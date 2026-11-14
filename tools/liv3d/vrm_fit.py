"""Fit the VRoid Studio export to the painted Liv, directly in the VRM file (no VRoid Studio needed).

    python3 tools/liv3d/vrm_fit.py tools/liv3d/models/liv-vroid.vrm tools/liv3d/models/liv.vrm

What it changes (each step can be switched off with --no-<step>):
  head     the head (with face, hair, hair bones) is scaled about the head joint: the export is about 2.7 heads tall,
           the painted Liv about 4
  hair     every lock is cut to a bob along its own shape (fringe above the brows, sides and back at the jaw) and
           closed with a rounded end; volume, waves and a slight outward curl; ear tufts and flyaway locks removed
  dress    the texture is repainted: red bodice with a scoop and a laced panel, long straight apron, a small bow at the
           back, a plain hem and plain sleeve cuffs; the blouse is painted on the body where the dress mesh is open;
           cream shorts under the skirt
  socks    short ribbed socks instead of the knee socks (painted into the skin texture), with a real cuff
  boots    tan laces and bow
  face     the paintings' skin tone, blush, freckles, short thick brows, peach skin shadows
  look     dark-brown outlines (also on the hair), hair gloss toned down
  slim     a small thumbnail instead of the 2048 px one

The VRM is a GLB: JSON + one binary buffer. Everything not touched is copied as it is.
"""
import argparse, io, json, struct, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
CTR = {np.dtype(v): k for k, v in CT.items()}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}

# the painted Liv's own colours (dominant colours of tools/liv/rive/views/01_front.png)
RED = (192, 56, 28); CREAM = (250, 218, 168); CREAM_D = (222, 178, 120); APRON = (249, 204, 148); APRON_D = (224, 176, 112); TAN = (232, 160, 78); LACE = (104, 56, 30)
SKIN = (253, 194, 141); SKIN_VROID = (253, 203, 155); OUTLINE = [0.045, 0.012, 0.004]          # outline #3a1c0c in linear light


class GLB:
    def __init__(self, path):
        b = open(path, 'rb').read(); o = 12; ch = []
        while o < len(b):
            l, _ = struct.unpack('<II', b[o:o + 8]); ch.append(b[o + 8:o + 8 + l]); o += 8 + l
        self.j = json.loads(ch[0]); bin_ = ch[1]
        self.views = [bytes(bin_[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]) for bv in self.j['bufferViews']]

    def acc(self, i):
        a = self.j['accessors'][i]; bv = self.j['bufferViews'][a['bufferView']]; dt = np.dtype(CT[a['componentType']]); n = NC[a['type']]
        raw = self.views[a['bufferView']]; off = a.get('byteOffset', 0); st = bv.get('byteStride', 0)
        if st and st != dt.itemsize * n:
            m = np.frombuffer(raw, np.uint8, count=st * a['count'], offset=off).reshape(a['count'], st)[:, :dt.itemsize * n]
            return np.frombuffer(m.tobytes(), dt).reshape(a['count'], n).copy()
        return np.frombuffer(raw, dt, count=a['count'] * n, offset=off).reshape(a['count'], n).copy()

    def new_acc(self, arr, typ, minmax=False):
        arr = np.ascontiguousarray(arr); self.views.append(arr.tobytes())
        self.j['bufferViews'].append({'buffer': 0, 'byteLength': arr.nbytes, 'target': 34962})
        a = {'bufferView': len(self.views) - 1, 'componentType': CTR[arr.dtype], 'count': int(arr.shape[0]), 'type': typ}
        if minmax: a['min'] = [float(x) for x in arr.min(0)]; a['max'] = [float(x) for x in arr.max(0)]
        self.j['accessors'].append(a); return len(self.j['accessors']) - 1

    def image(self, i): return Image.open(io.BytesIO(self.views[self.j['images'][i]['bufferView']]))

    def set_image(self, i, im):
        f = io.BytesIO(); im.save(f, 'PNG', optimize=True); self.views[self.j['images'][i]['bufferView']] = f.getvalue()

    def mat_image(self, part):
        """Image index of the base colour texture of the first material whose name contains `part`."""
        for m in self.j['materials']:
            if part in m['name']:
                return self.j['textures'][m['pbrMetallicRoughness']['baseColorTexture']['index']]['source']
        raise KeyError(part)

    def node(self, name): return next(i for i, n in enumerate(self.j['nodes']) if n.get('name') == name)

    def world(self, i):
        nodes = self.j['nodes']; parent = {c: k for k, n in enumerate(nodes) for c in n.get('children', [])}; M = np.eye(4)
        while i is not None:
            n = nodes[i]; t = np.array(n.get('translation', [0, 0, 0]), float); x, y, z, w = n.get('rotation', [0, 0, 0, 1]); s = np.array(n.get('scale', [1, 1, 1]), float)
            R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
            L = np.eye(4); L[:3, :3] = R * s; L[:3, 3] = t; M = L @ M; i = parent.get(i)
        return M

    def save(self, path):
        out = bytearray()
        for bv, raw in zip(self.j['bufferViews'], self.views):
            while len(out) % 4: out.append(0)
            bv['byteOffset'] = len(out); bv['byteLength'] = len(raw); out += raw
        while len(out) % 4: out.append(0)
        self.j['buffers'] = [{'byteLength': len(out)}]
        js = json.dumps(self.j, separators=(',', ':'), ensure_ascii=False).encode('utf8')
        while len(js) % 4: js += b' '
        with open(path, 'wb') as f:
            f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(out)))
            f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
            f.write(struct.pack('<II', len(out), 0x004E4942)); f.write(out)
        return 12 + 8 + len(js) + 8 + len(out)


def sstep(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)


# ------------------------------------------------------------------ head

def head_scale(g, k):
    """Scale the head joint (face, hair, eyes and hair bones follow). three-vrm 3.0 does not scale spring-bone radii with
    the world matrix, so the radii below the head are scaled here."""
    j = g.j; nodes = j['nodes']; h = g.node('J_Bip_C_Head'); nodes[h]['scale'] = [k, k, k]
    sub = set(); todo = [h]
    while todo:
        i = todo.pop(); sub.add(i); todo += nodes[i].get('children', [])
    sb = j['extensions']['VRMC_springBone']
    for c in sb.get('colliders', []):
        if c['node'] in sub:
            for sh in c['shape'].values(): sh['radius'] *= k
    for s in sb['springs']:
        for jt in s['joints']:
            if jt['node'] in sub and 'hitRadius' in jt: jt['hitRadius'] *= k
    la = j['extensions']['VRMC_vrm'].get('lookAt')
    if la and 'offsetFromHeadBone' in la: la['offsetFromHeadBone'] = [x * k for x in la['offsetFromHeadBone']]


# ------------------------------------------------------------------ hair

def y_end(deg):
    """Where a strand ends (height in the export's own metres, head unscaled) by its direction around the head:
    0 = front, 90 = side, 180 = back. Brows are at 0.99..1.03, eyes 0.90..0.96, mouth 0.83, chin 0.77."""
    d = abs(deg)
    return float(np.interp(d, [0, 28, 48, 72, 100, 180], [1.066, 1.060, 0.985, 0.875, 0.835, 0.815]))


def hair_bob(g, o):
    """A true cut: every lock keeps its own shape down to the cut and is closed there with a short rounded end (the rings
    beyond the cut are gathered into it), so nothing is twisted. Then a smooth field adds volume, waves and a slight
    outward curl at the ends."""
    import scipy.sparse as sp
    from scipy.sparse.csgraph import connected_components
    j = g.j; node = j['nodes'][g.node('Hair')]; pr = j['meshes'][node['mesh']]['primitives'][0]; at = pr['attributes']
    P = g.acc(at['POSITION']).astype(np.float64); UV = g.acc(at['TEXCOORD_0'])
    J = g.acc(at['JOINTS_0']); W = g.acc(at['WEIGHTS_0']).astype(np.float64); I = g.acc(pr['indices']).reshape(-1, 3).astype(np.int64)
    nj = len(j['skins'][node['skin']]['joints']); zc = o.hair_zc; nv = len(P)
    def comps(ids, n):
        e = np.concatenate([ids[I[:, [0, 1]]], ids[I[:, [1, 2]]], ids[I[:, [2, 0]]]])
        return connected_components(sp.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n)), directed=False)
    _, raw = comps(np.arange(nv), nv)                                                 # ribbon halves and caps
    _, weld = np.unique(np.round(P * 2e4).astype(np.int64), axis=0, return_inverse=True); weld = weld.ravel()
    nc, lab = comps(weld, weld.max() + 1); sid = lab[weld]                             # whole locks
    v = UV[:, 1].astype(np.float64); rk = np.round(v, 3); col = raw.astype(np.int64) * 100000 + np.round(UV[:, 0] * 10000).astype(np.int64)
    P2 = P.copy(); J2 = J.copy(); W2 = W.copy(); rng = np.random.RandomState(7); ncut = 0
    tt = np.zeros(nv); phase = np.zeros((nv, 3)); kept = []
    names = [j['nodes'][n]['name'] for n in j['skins'][node['skin']]['joints']]
    tuft = np.array([any(nm.startswith('J_Sec_Hair') and nm.endswith(t) for t in o.hair_drop.split(',') if t) for nm in names])
    gone = np.zeros(nv, bool)
    for s in range(nc):
        idx = np.where(sid == s)[0]; rings = np.unique(rk[idx])
        if (W[idx] * tuft[J[idx]]).sum() > 0.05 * len(idx): gone[idx] = True; continue      # the thin tufts that stick out at the ears
        if len(rings) < 4: continue
        C = np.array([P[idx][rk[idx] == r].mean(0) for r in rings]); v0, v1 = rings[0], rings[-1]
        if C[-1, 1] > o.hair_fly and abs(np.degrees(np.arctan2(C[-1, 0], C[-1, 2] - zc))) > 50: gone[idx] = True; continue    # short flyaway locks at the sides and back
        jit = rng.uniform(-1, 1); ang = np.degrees(np.arctan2(C[:, 0], C[:, 2] - zc)); lim = np.array([y_end(a_) for a_ in ang]) + jit * o.hair_jitter
        phase[idx] = rng.uniform(0, 2 * np.pi, 3)
        below = np.where((C[:, 1] < lim) & (np.arange(len(rings)) > 1))[0]
        kmax = int(np.searchsorted(rings, v0 + o.hair_blunt * (v1 - v0)))               # a lock that is short enough still loses its pointed tip
        if len(below) and below[0] <= kmax:
            k = int(below[0]); f = float(np.clip((C[k - 1, 1] - lim[k]) / max(C[k - 1, 1] - C[k, 1], 1e-6), 0.05, 1.0)); ncut += 1
        else:
            k = max(kmax, 2); f = float(np.clip((v0 + o.hair_blunt * (v1 - v0) - rings[k - 1]) / max(rings[k] - rings[k - 1], 1e-9), 0.05, 1.0))
        vcut = rings[k - 1] + f * (rings[k] - rings[k - 1]); kept.append((vcut - v0) / (v1 - v0))
        Cc = C[k - 1] + f * (C[k] - C[k - 1]); T = C[k] - C[k - 1]; T /= max(np.linalg.norm(T), 1e-9)
        tt[idx] = np.clip((v[idx] - v0) / (vcut - v0), 0, 1)
        # per column (a line of vertices along the lock): its point on the cut
        ring_of = np.searchsorted(rings, rk[idx]); cutpt = {}
        for c in np.unique(col[idx]):
            m = idx[col[idx] == c]; r = np.searchsorted(rings, rk[m]); a_ = m[r == k - 1]; b_ = m[r == k]
            if len(a_) and len(b_): cutpt[c] = P[a_[0]] + f * (P[b_[0]] - P[a_[0]])
        Wd = np.zeros((2, nj))
        for q, r in enumerate((rings[k - 1], rings[k])):
            m = idx[rk[idx] == r]; np.add.at(Wd[q], J[m].ravel(), W[m].ravel()); Wd[q] /= max(Wd[q].sum(), 1e-9)
        wc = Wd[0] + f * (Wd[1] - Wd[0]); top = np.argsort(-wc)[:4]; w4 = wc[top] / wc[top].sum()
        shrink = [1.0, 0.82, 0.5, 0.0]; ahead = [0.0, 0.006, 0.011, 0.014]               # the rounded end: rings k, k+1, k+2, the rest
        for i_, r in zip(idx, ring_of):
            if r < k: continue
            m_ = min(r - k, 3); cp = cutpt.get(col[i_])
            P2[i_] = Cc + T * ahead[m_] * o.hair_width + ((cp - Cc) * shrink[m_] if cp is not None and m_ < 3 else 0)
            J2[i_] = top.astype(J.dtype); W2[i_] = w4
    # the smooth field (in the export's own metres, the head joint scales it later)
    ang = np.arctan2(P2[:, 0], P2[:, 2] - zc); deg = np.abs(np.degrees(ang)); front = sstep(48, 20, deg)
    rad = np.stack([np.sin(ang), np.zeros(nv), np.cos(ang)], 1); tan = np.stack([np.cos(ang), np.zeros(nv), -np.sin(ang)], 1)
    low = sstep(1.16, 1.0, P2[:, 1]); amp = o.hair_wave * (1 - 0.55 * front) * low * sstep(0.1, 0.45, tt)
    wave = rad * (amp * np.sin(2 * np.pi * 2.1 * tt + phase[:, 0]))[:, None] + tan * (amp * 0.9 * np.sin(2 * np.pi * 1.7 * tt + phase[:, 1]))[:, None]
    vol = rad * (o.hair_volume * low * (1 - 0.7 * front) * sstep(0.1, 0.75, tt))[:, None]
    curl = sstep(0.62, 1.0, tt) ** 2 * (1 - front)
    flick = rad * (o.hair_flick * curl)[:, None] + np.array([0, 1, 0]) * (o.hair_flick * 0.5 * curl)[:, None]
    P2 += wave + vol + flick
    # single locks that still stand away from the bob, named by where their tip is (angle from the front, height), both sides
    tips = {}
    for s_ in range(nc):
        idx = np.where((sid == s_) & ~gone)[0]
        if len(idx) >= 12: tp = P2[idx][tt[idx] > 0.9].mean(0); tips[s_] = (abs(np.degrees(np.arctan2(tp[0], tp[2] - zc))), tp[1], np.sign(tp[0]), np.hypot(tp[0], tp[2] - zc))
    for spec in filter(None, o.hair_drop_tips.split(';')):
        a_, y_ = map(float, spec.split(','))
        for sg in (-1, 1):
            c = min((k for k in tips if tips[k][2] == sg), key=lambda k: abs(tips[k][0] - a_) / 100 + abs(tips[k][1] - y_), default=None)
            if c is not None and abs(tips[c][0] - a_) < 12 and abs(tips[c][1] - y_) < 0.03: gone[sid == c] = True
    if o.hair_report:
        for k, (a_, y_, sg, r) in tips.items(): print(f'  lock {k}: tip angle {a_ * sg:5.0f} y {y_:.3f} radius {r:.3f}' + ('  (dropped)' if gone[sid == k].all() else ''))
    print(f'hair: {nc} locks, {ncut} cut; kept length {np.mean(kept):.2f} on average')
    # normals from the new surface (area-weighted, per welded position so the two halves of a lock agree), facing as before
    N0 = g.acc(at['NORMAL']).astype(np.float64); fn = np.cross(P2[I[:, 1]] - P2[I[:, 0]], P2[I[:, 2]] - P2[I[:, 0]])
    acc_ = np.zeros((weld.max() + 1, 3)); [np.add.at(acc_, weld[I[:, c]], fn) for c in range(3)]
    N2 = acc_[weld]; ln = np.linalg.norm(N2, axis=1, keepdims=True); N2 = np.where(ln > 1e-12, N2 / np.maximum(ln, 1e-12), N0)
    at['POSITION'] = g.new_acc(P2.astype(np.float32), 'VEC3', True); at['NORMAL'] = g.new_acc(N2.astype(np.float32), 'VEC3')
    at['JOINTS_0'] = g.new_acc(J2, 'VEC4'); at['WEIGHTS_0'] = g.new_acc(W2.astype(np.float32), 'VEC4')
    if gone.any():
        keep = I[~gone[I].any(1)]; self_i = g.j['accessors'][pr['indices']]; dt = np.dtype(CT[self_i['componentType']])
        g.views.append(np.ascontiguousarray(keep.ravel().astype(dt)).tobytes()); g.j['bufferViews'].append({'buffer': 0, 'byteLength': keep.size * dt.itemsize, 'target': 34963})
        g.j['accessors'].append({'bufferView': len(g.views) - 1, 'componentType': self_i['componentType'], 'count': int(keep.size), 'type': 'SCALAR'}); pr['indices'] = len(g.j['accessors']) - 1
        print(f'hair: {len(I) - len(keep)} triangles of ear tufts and flyaway locks removed')


# ------------------------------------------------------------------ textures

def arr(im): return np.array(im.convert('RGBA')).astype(np.float32)
def img(a): return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
def is_red(a): return (a[..., 0] > 120) & (a[..., 1] < 105) & (a[..., 2] < 90) & (a[..., 3] > 128)


def row_red(a, y0, y1, x0=0, x1=None):
    """The dress red of every row y0..y1 (median of the red pixels of that row, carried over rows without red)."""
    out = np.zeros((y1 - y0, 3), np.float32); last = np.array(RED, np.float32)
    for y in range(y0, y1):
        row = a[y, x0:x1]; m = is_red(row)
        if m.sum() > 40: last = np.median(row[m][:, :3], axis=0)
        out[y - y0] = last
    return out


def dress_tex(im):
    a = arr(im); S = im.size[0] / 2048.0; px = lambda v: int(round(v * S)); Wd = im.size[0]
    pale = ~is_red(a) & (a[..., 3] > 128); a[pale, :3] *= np.array(CREAM, np.float32) / np.array([246, 230, 200], np.float32)   # the sleeves' cream, warmed
    # --- skirt: all red, clean hem
    ys0, yh, ys1 = px(1150), px(1826), px(1960)
    reds = row_red(a, ys0, yh, px(700), px(1350))
    k = np.arange(len(reds)); sm = np.stack([np.convolve(reds[:, c], np.ones(25) / 25, 'same') for c in range(3)], 1); sm[:12] = reds[:12]; sm[-12:] = reds[-12:]
    a[ys0:yh, :, :3] = sm[:, None, :]; a[ys0:yh, :, 3] = 255
    # soft folds so the red is not flat: darker valleys that fan out toward the hem
    xs = np.arange(Wd)[None, :]; yy = (np.arange(ys0, yh)[:, None] - ys0) / (yh - ys0)
    fold = 0.5 + 0.5 * np.cos(xs / Wd * 2 * np.pi * 14 + 0.6 * np.sin(xs / Wd * 2 * np.pi * 3))
    a[ys0:yh, :, :3] *= (1 - 0.085 * fold * sstep(0.15, 0.9, yy))[..., None]
    a[yh - px(14):yh, :, :3] *= 0.86                                                # the hem's edge
    a[yh:ys1, :, 3] = 0
    im2 = img(a); d = ImageDraw.Draw(im2)
    # --- waistband
    yw0, yw1 = px(1066), px(1152)
    d.rectangle([0, yw0, Wd, yw1], fill=CREAM); d.line([0, yw1, Wd, yw1], fill=CREAM_D, width=px(5)); d.line([0, yw0, Wd, yw0], fill=CREAM_D, width=px(4))
    # --- apron: long and straight, to four fifths of the skirt
    ax0, ax1, ay1 = px(664), px(1384), px(1700)
    sh = Image.new('L', im2.size, 0); ImageDraw.Draw(sh).rounded_rectangle([ax0 - px(10), yw1, ax1 + px(10), ay1 + px(16)], radius=px(70), fill=120)
    sh = sh.filter(ImageFilter.GaussianBlur(px(9))); im2 = Image.composite(Image.new('RGBA', im2.size, (120, 30, 16, 255)), im2, sh.point(lambda p: p * 0.55)); d = ImageDraw.Draw(im2)
    d.rounded_rectangle([ax0, yw1 - px(60), ax1, ay1], radius=px(64), fill=APRON, outline=APRON_D, width=px(6))
    d.rectangle([0, yw0, Wd, yw1], fill=APRON); d.line([0, yw1, Wd, yw1], fill=APRON_D, width=px(5)); d.line([0, yw0, Wd, yw0], fill=APRON_D, width=px(4))
    fold = Image.new('L', im2.size, 0); fd = ImageDraw.Draw(fold)
    for fx, fy0, fy1 in ((790, 1190, 1560), (925, 1230, 1640), (1115, 1200, 1600), (1260, 1240, 1650)):
        fd.line([px(fx), px(fy0), px(fx + 14), px(fy1)], fill=70, width=px(16))
    im2 = Image.composite(Image.new('RGBA', im2.size, APRON_D + (255,)), im2, fold.filter(ImageFilter.GaussianBlur(px(12)))); d = ImageDraw.Draw(im2)
    # --- the bow at the back (the back seam is the texture's left and right edge)
    yb = (yw0 + yw1) // 2
    for sx, sg in ((0, 1), (Wd, -1)):
        d.polygon([(sx + sg * px(40), yb + px(20)), (sx + sg * px(150), yb + px(175)), (sx + sg * px(86), yb + px(190)), (sx + sg * px(10), yb + px(40))], fill=APRON, outline=APRON_D)
        d.ellipse([min(sx + sg * px(22), sx + sg * px(196)), yb - px(58), max(sx + sg * px(22), sx + sg * px(196)), yb + px(58)], fill=APRON, outline=APRON_D, width=px(5))
        d.ellipse([min(sx + sg * px(70), sx + sg * px(150)), yb - px(22), max(sx + sg * px(70), sx + sg * px(150)), yb + px(22)], fill=APRON_D)
        d.rectangle([min(sx, sx + sg * px(34)), yb - px(36), max(sx, sx + sg * px(34)), yb + px(36)], fill=APRON, outline=APRON_D, width=px(4))
    a = arr(im2)
    # --- bodice front: blouse to the collarbone, red bodice with a scoop, laced panel
    bx0, bx1, by0, by1 = px(868), px(1182), px(520), px(1046)
    reds = row_red(a, by0, by1, px(1200), px(1500)); a[by0:by1, bx0:bx1, :3] = reds[:, None, :]; a[by0:by1, bx0:bx1, 3] = 255
    im2 = img(a); d = ImageDraw.Draw(im2)
    # the scoop: open (the blouse inside it is painted on the body, see blouse_on_body: the dress mesh has gaps there)
    sx0, sx1 = px(932), px(1108); hole = Image.new('L', im2.size, 0); hd = ImageDraw.Draw(hole)
    hd.rounded_rectangle([sx0, px(470), sx1, px(860)], radius=px(84), fill=255); hd.rectangle([sx0, px(470), sx1, px(700)], fill=255)
    d.rectangle([px(996), px(872), px(1044), by1], fill=TAN, outline=(170, 110, 50), width=px(3))
    rowsy = [888, 930, 972, 1014]
    for y0_, y1_ in zip(rowsy[:-1], rowsy[1:]):
        d.line([px(978), px(y0_), px(1062), px(y1_)], fill=LACE, width=px(8)); d.line([px(1062), px(y0_), px(978), px(y1_)], fill=LACE, width=px(8))
    for y_ in rowsy:
        for x_ in (978, 1062): d.ellipse([px(x_ - 8), px(y_ - 8), px(x_ + 8), px(y_ + 8)], fill=(70, 36, 22))
    a = arr(im2); a[np.array(hole) > 0, 3] = 0
    # --- bodice back: the preset's open scoop and frill go (the body carries the blouse there too)
    for x0, x1 in ((px(532), px(668)), (px(1378), px(1516))):
        box = a[px(520):px(668), x0:x1]; m = ~is_red(box); box[m, 3] = 0
    # --- sleeves: plain cuff instead of ribbon and frill
    for x0, x1 in ((0, px(532)), (px(1516), Wd)):
        blk = a[px(180):px(560), x0:x1]; red_rows = np.where(is_red(blk).mean(1) > 0.25)[0]
        if not len(red_rows): continue
        r0 = red_rows.min() + px(180); c0, c1 = r0 - px(12), r0 + px(70)
        a[c0:c1, x0:x1, :3] = np.array(CREAM, np.float32) * 0.985; a[c0:c1, x0:x1, 3] = 255
        a[c0:c0 + px(7), x0:x1, :3] = CREAM_D; a[c1 - px(7):c1, x0:x1, :3] = CREAM_D; a[c1:px(560), x0:x1, 3] = 0
    return img(a)


def skin_tone(im):
    a = arr(im); a[..., :3] *= np.array(SKIN, np.float32) / np.array(SKIN_VROID, np.float32); return img(a)


def socks_tex(im, v_top=0.838):
    """Short ribbed socks: skin again above v_top on the lower legs, cream ribs below."""
    a = arr(im); H, Wd = a.shape[:2]; yt = int(v_top * H)
    for u0, u1 in ((0.0, 0.2405), (0.7595, 1.0)):
        x0, x1 = int(u0 * Wd), int(u1 * Wd); skin = np.median(a[int(0.715 * H):int(0.745 * H), x0:x1, :3], axis=0)      # per column
        a[int(0.74 * H):yt, x0:x1, :3] = skin[None]
        xs = np.arange(x0, x1); rib = 0.93 + 0.07 * np.cos((xs - x0) / (x1 - x0) * 2 * np.pi * 22)
        col = np.array(CREAM, np.float32)[None, :] * rib[:, None]
        a[yt:H, x0:x1, :3] = col[None]
        cuff = int(0.022 * H); a[yt:yt + cuff, x0:x1, :3] = np.minimum(col * 1.03, 255)[None]
        a[yt + cuff:yt + cuff + 6, x0:x1, :3] *= 0.84; a[yt:yt + 5, x0:x1, :3] = (196, 170, 128)
        a[int(0.74 * H):H, x0:x1, 3] = 255
    return img(a)


def sock_cuffs(g, v_top=0.838, thick=0.0058):
    """Give the painted socks some body: the leg rings inside the sock are pushed out, the first skin ring above is set
    right on top of the cuff, so the sock ends in a small ledge instead of a line of colour."""
    j = g.j; me = j['meshes'][j['nodes'][g.node('Body')]['mesh']]
    pb = next(p for p in me['primitives'] if 'Body_00_SKIN' in j['materials'][p['material']]['name'])
    ai = pb['attributes']['POSITION']; P = g.acc(ai).astype(np.float64); UV = g.acc(pb['attributes']['TEXCOORD_0'])
    used = np.zeros(len(P), bool); used[np.unique(g.acc(pb['indices']))] = True
    leg = used & (P[:, 1] < 0.30) & (P[:, 1] > 0.09) & ((UV[:, 0] < 0.2405) | (UV[:, 0] > 0.7595)) & (UV[:, 1] > 0.70)
    for side in (-1, 1):
        m = leg & (P[:, 0] * side > 0.005); sock = m & (UV[:, 1] >= v_top)
        if not sock.any(): continue
        ytop = P[sock][:, 1].max(); above = m & ~sock & (P[:, 1] < ytop + 0.016)
        for grp, k in ((sock, 1.0),):
            ii = np.where(grp)[0]
            for i in ii:
                near = m & (np.abs(P[:, 1] - P[i, 1]) < 0.004); c = P[near][:, [0, 2]].mean(0); d = P[i, [0, 2]] - c; d /= max(np.linalg.norm(d), 1e-9)
                up = sstep(0.125, ytop, P[i, 1]); P[i, [0, 2]] += d * thick * (0.55 + 0.45 * up + 0.3 * sstep(ytop - 0.012, ytop, P[i, 1]))
        P[above, 1] = np.minimum(P[above, 1], ytop + 0.002 + 0.35 * (P[above, 1] - ytop).clip(0))
    na = g.new_acc(P.astype(np.float32), 'VEC3', True)
    for pr in me['primitives']:
        if pr['attributes']['POSITION'] == ai: pr['attributes']['POSITION'] = na


def boots_tex(im):
    """Tan laces: every lace pixel is found as a thin dark-edged line on the tongue; simpler and safer is to draw new ones
    between the eyelets."""
    a = arr(im); H, Wd = a.shape[:2]; S = Wd / 512.0; im2 = img(a); d = ImageDraw.Draw(im2)
    ey = [472, 530, 589, 645, 699, 747]; xl, xr = 203, 309
    for y0, y1 in zip(ey[:-1], ey[1:]):
        for p, q in (((xl, y0), (xr, y1)), ((xr, y0), (xl, y1))):
            d.line([p[0] * S, p[1] * S, q[0] * S, q[1] * S], fill=(120, 78, 30), width=int(15 * S)); d.line([p[0] * S, p[1] * S, q[0] * S, q[1] * S], fill=TAN, width=int(9 * S))
    for y in ey:
        for x in (xl, xr): d.ellipse([(x - 9) * S, (y - 9) * S, (x + 9) * S, (y + 9) * S], fill=(236, 186, 96), outline=(120, 78, 30))
    return im2


def bow_tex(im):
    a = arr(im); lum = (a[..., :3] @ np.array([.299, .587, .114], np.float32))[..., None] / 255.
    a[..., :3] = np.array(TAN, np.float32) * np.clip(0.62 + lum * 2.6, 0, 1.12)
    return img(a)


def face_tex(im):
    a = arr(im); H, Wd = a.shape[:2]; yy, xx = np.mgrid[0:H, 0:Wd]
    for cx in (0.335, 0.665):
        r = np.hypot((xx - cx * Wd) / (0.085 * Wd), (yy - 0.665 * H) / (0.06 * H)); k = np.clip(1 - r, 0, 1) ** 1.5 * 0.42
        a[..., :3] = a[..., :3] * (1 - k[..., None]) + np.array([247, 150, 128], np.float32) * k[..., None]
    im2 = img(a); d = ImageDraw.Draw(im2); rng = np.random.RandomState(3)
    for cx in (0.335, 0.665):
        for _ in range(7):
            x = (cx + rng.uniform(-0.06, 0.06)) * Wd; y = (0.655 + rng.uniform(-0.03, 0.03)) * H; r = rng.uniform(2.2, 3.6) * Wd / 1024
            d.ellipse([x - r, y - r, x + r, y + r], fill=(206, 128, 92, 255))
    return im2


def brow_tex(im):
    """Short, thick, dark brows like the painted ones (the export has long thin lines)."""
    a = arr(im); H, Wd = a.shape[:2]; al = Image.fromarray(a[..., 3].astype(np.uint8))
    al = np.array(al.filter(ImageFilter.MaxFilter(2 * int(Wd * 0.007) + 1)).filter(ImageFilter.GaussianBlur(Wd * 0.0015))).astype(np.float32)
    xs = np.arange(Wd) / Wd; win = np.where(xs < 0.5, sstep(0.13, 0.22, xs), sstep(0.87, 0.78, xs))        # shorter at the temples
    a[..., 3] = np.clip(al * 1.25, 0, 255) * win[None, :]; a[..., :3] = (86, 46, 24)
    return img(a)


def blouse_on_body(g):
    """The dress mesh is open at the chest and the nape (strips of collar and ribbon with gaps: the preset shows skin there).
    Liv's blouse closes to a round neckline, so the body surface itself is painted cream there: every skin texel of the
    torso below the neckline. Texels the export already hides stay hidden. Also cream shorts instead of the black ones."""
    j = g.j; me = j['meshes'][j['nodes'][g.node('Body')]['mesh']]
    pb = next(p for p in me['primitives'] if 'Body_00_SKIN' in j['materials'][p['material']]['name'])
    P = g.acc(pb['attributes']['POSITION']).astype(np.float64); UV = g.acc(pb['attributes']['TEXCOORD_0']).astype(np.float64); Ib = g.acc(pb['indices']).reshape(-1, 3)
    bi = g.mat_image('Body_00_SKIN'); im = g.image(bi).convert('RGBA'); a = arr(im); H, Wd = a.shape[:2]
    neck = g.world(g.node('J_Bip_C_Neck'))[:3, 3]; c = P[Ib].mean(1)
    tris = Ib[(c[:, 1] > 0.55) & (c[:, 1] < 0.84) & (np.abs(c[:, 0]) < 0.10)]; n = 0
    cream = np.array(CREAM, np.float32)
    for t in tris:
        uv = UV[t] * [Wd, H]; x0, y0 = np.floor(uv.min(0)).astype(int) - 1; x1, y1 = np.ceil(uv.max(0)).astype(int) + 1
        x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, Wd - 1), min(y1, H - 1)
        if x1 <= x0 or y1 <= y0: continue
        yy, xx = np.mgrid[y0:y1 + 1, x0:x1 + 1]; q = np.stack([xx + 0.5, yy + 0.5], -1) - uv[0]
        e1, e2 = uv[1] - uv[0], uv[2] - uv[0]; det = e1[0] * e2[1] - e1[1] * e2[0]
        if abs(det) < 1e-9: continue
        b1 = (q[..., 0] * e2[1] - q[..., 1] * e2[0]) / det; b2 = (q[..., 1] * e1[0] - q[..., 0] * e1[1]) / det; b0 = 1 - b1 - b2
        inside = (b0 >= -0.02) & (b1 >= -0.02) & (b2 >= -0.02)                           # a hair wider than the triangle: no seams
        w = b0[..., None] * P[t[0]] + b1[..., None] * P[t[1]] + b2[..., None] * P[t[2]]
        r = np.hypot(w[..., 0] - neck[0], w[..., 2] - neck[2])                           # distance from the neck's axis
        on = inside & (np.abs(w[..., 0]) < 0.088) & ((w[..., 1] < neck[1] - 0.012) | ((r > 0.036) & (w[..., 1] < neck[1] + 0.012)))
        sub = a[y0:y1 + 1, x0:x1 + 1]; m = on & (sub[..., 3] > 128)
        sub[m, :3] = cream; n += int(m.sum())
        # under the scoop's lower edge the export hides the body; make it solid there, or a gap opens when she raises her arms
        low = inside & (np.abs(w[..., 0]) < 0.04) & (w[..., 2] > neck[2]) & (w[..., 1] > 0.672) & (w[..., 1] < 0.74)
        sub[low, :3] = cream; sub[low, 3] = 255; m = m | low
        # outside the scoop the body is red like the bodice on top of it, so the gaps in the dress mesh never show cream
        xs = 0.0365 * np.sqrt(np.clip(1 - (np.clip(0.722 - w[..., 1], 0, None) / 0.031) ** 2, 0, 1))
        sub[m & (w[..., 2] > neck[2] - 0.005) & (np.abs(w[..., 0]) > xs) & (np.abs(w[..., 0]) < 0.056), :3] = RED      # not the shoulder under the sleeve
        slit = m & (np.abs(w[..., 0]) < 0.0016) & (w[..., 2] > neck[2]) & (w[..., 1] > neck[1] - 0.05); sub[slit, :3] = CREAM_D      # the slit at the neck
    dark = (a[..., :3].max(-1) < 46) & (a[..., 3] > 128); a[dark, :3] = cream * 0.97
    # cream shorts to mid thigh under the skirt (seen when it flies in a run, a kick or a crouch); the export hides the
    # body under the dress top, so the hips are made solid again where the skirt stands away from them
    hem = 0.372; top = 0.49; ns = 0
    for t in Ib[(c[:, 1] > hem - 0.03) & (c[:, 1] < 0.60) & (np.abs(c[:, 0]) < 0.16)]:
        uv = UV[t] * [Wd, H]; x0, y0 = np.floor(uv.min(0)).astype(int) - 1; x1, y1 = np.ceil(uv.max(0)).astype(int) + 1
        x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, Wd - 1), min(y1, H - 1)
        if x1 <= x0 or y1 <= y0: continue
        yy, xx = np.mgrid[y0:y1 + 1, x0:x1 + 1]; q = np.stack([xx + 0.5, yy + 0.5], -1) - uv[0]
        e1, e2 = uv[1] - uv[0], uv[2] - uv[0]; det = e1[0] * e2[1] - e1[1] * e2[0]
        if abs(det) < 1e-9: continue
        b1 = (q[..., 0] * e2[1] - q[..., 1] * e2[0]) / det; b2 = (q[..., 1] * e1[0] - q[..., 0] * e1[1]) / det; b0 = 1 - b1 - b2
        wy = b0 * P[t[0], 1] + b1 * P[t[1], 1] + b2 * P[t[2], 1]; inside = (b0 >= -0.02) & (b1 >= -0.02) & (b2 >= -0.02)
        sub = a[y0:y1 + 1, x0:x1 + 1]; m = inside & (wy > hem) & ((sub[..., 3] > 128) | (wy < top))
        sub[m & (wy < top), 3] = 255; sub[m, :3] = cream * 0.97; sub[m & (wy < hem + 0.007), :3] = CREAM_D; ns += int(m.sum())
    g.set_image(bi, img(a)); print(f'blouse: {n} skin texels on the chest and nape painted cream; shorts: {ns} texels')


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--head', type=float, default=0.66)
    ap.add_argument('--hair-zc', type=float, default=-0.04); ap.add_argument('--hair-jitter', type=float, default=0.012)
    ap.add_argument('--hair-width', type=float, default=1.0); ap.add_argument('--hair-blunt', type=float, default=0.84); ap.add_argument('--hair-drop', default='_01,_02'); ap.add_argument('--hair-fly', type=float, default=0.99); ap.add_argument('--hair-report', action='store_true'); ap.add_argument('--hair-drop-tips', default='74,0.935')
    ap.add_argument('--hair-wave', type=float, default=0.014); ap.add_argument('--hair-volume', type=float, default=0.046); ap.add_argument('--hair-flick', type=float, default=0.012)
    ap.add_argument('--outline', type=float, default=0.0016); ap.add_argument('--hair-gloss', type=float, default=0.4)
    for s in ('head', 'hair', 'dress', 'socks', 'boots', 'face', 'slim', 'look'): ap.add_argument('--no-' + s, action='store_true')
    o = ap.parse_args(); g = GLB(o.src)
    if not o.no_hair: hair_bob(g, o)
    if not o.no_head: head_scale(g, o.head)
    if not o.no_face:
        for part in ('Face_00_SKIN', 'Body_00_SKIN'): i = g.mat_image(part); g.set_image(i, skin_tone(g.image(i)))
    if not o.no_dress: i = g.mat_image('Tops'); g.set_image(i, dress_tex(g.image(i)))
    if not o.no_socks: i = g.mat_image('Body_00_SKIN'); g.set_image(i, socks_tex(g.image(i))); sock_cuffs(g)
    if not o.no_dress:
        blouse_on_body(g)
        for m in g.j['materials']:                                                    # warm cloth shadows as in the paintings (the export's are blue)
            if 'CLOTH' in m['name']: m['extensions']['VRMC_materials_mtoon']['shadeColorFactor'] = [0.80, 0.70, 0.66]
    if not o.no_face:
        for m in g.j['materials']:                                                    # peach skin shadows (#f0a56e on #fdc28d) instead of pink
            if 'SKIN' in m['name'] or 'FaceMouth' in m['name']: m['extensions']['VRMC_materials_mtoon']['shadeColorFactor'] = [0.95, 0.80, 0.72]
    if not o.no_boots:
        i = g.mat_image('Shoes_01_CLOTH_01'); g.set_image(i, boots_tex(g.image(i)))
        i = g.mat_image('Shoes_01_CLOTH_02'); g.set_image(i, bow_tex(g.image(i)))
    if not o.no_face:
        i = g.mat_image('Face_00_SKIN'); g.set_image(i, face_tex(g.image(i)))
        i = g.mat_image('FaceBrow'); g.set_image(i, brow_tex(g.image(i)))
    if not o.no_look:
        for m in g.j['materials']:
            mt = m['extensions']['VRMC_materials_mtoon']; mt['outlineColorFactor'] = OUTLINE; head = any(k in m['name'] for k in ('Face', 'Hair', 'Eye'))
            if mt.get('outlineWidthMode') == 'worldCoordinates': mt['outlineWidthFactor'] = o.outline * (1 / max(o.head, 0.3) if head and not o.no_head else 1)
            if 'Hair_00_HAIR' in m['name'] and 'HairBack' not in m['name']:
                mt['outlineWidthMode'] = 'worldCoordinates'; mt['outlineWidthFactor'] = o.outline * 0.8 / (o.head if not o.no_head else 1); mt['outlineLightingMixFactor'] = 0
                m['emissiveFactor'] = [x * o.hair_gloss for x in m.get('emissiveFactor', [0, 0, 0])]       # the export's glossy ring, toned down
    if not o.no_slim:
        t = g.j['extensions']['VRMC_vrm']['meta'].get('thumbnailImage')
        if t is not None: g.set_image(t, g.image(t).convert('RGBA').resize((256, 256), Image.LANCZOS))
    n = g.save(o.dst); print(f'wrote {o.dst}: {n / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
