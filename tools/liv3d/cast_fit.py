"""Fit a VRoid Studio export to one of the Deutschklinik cast's reference sheets, directly in the VRM file.

    python3 tools/liv3d/cast_fit.py C03                      # models/cast/c03-vroid.vrm -> models/cast/c03.vrm
    python3 tools/liv3d/cast_fit.py all                      # every character in cast_specs.CAST
    python3 tools/liv3d/cast_fit.py C04 --src x.vrm --dst y.vrm

The same idea as vrm_fit.py (Liv), made general for nine characters:

  head      the head joint is scaled until the model is as many heads tall as the reference
  hair      recoloured to the reference (luminance kept, so the strands stay); optionally cut to a length, locks dropped
  paint     every clothing, skin and face texture is repainted *by world position*: each texel is mapped back to the point
            on the body it covers (rest pose), and a rule written in body coordinates ("vest over the shirt above the
            belt, with a 3 cm gap at the front") decides its colour. The rules live in cast_specs.py, one function per
            character. The texture's own light and dark (folds, seams) is kept by multiplying.
  parts     meshes the presets do not have, generated here and fixed to the head joint: beards, moustaches, buns, hats,
            a bow, a headscarf, glasses. Their materials have "Hair" in the name, so the player leaves them out when it
            measures the body.
  look      outlines, warm shadows, hair gloss down, small thumbnail, and vrm_fit.slim for the web

The source export is never changed; run vrm_pack.py on the result for the site.
"""
import argparse, copy, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import vrm_fit as V                                     # noqa: E402  (GLB, head_scale, hair_bob, slim, arr, img, sstep)
from vrm_fit import GLB, arr, img, sstep                # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUTLINE = [0.045, 0.012, 0.004]                         # #3a1c0c in linear light, as Liv


def lin(rgb):
    c = np.asarray(rgb, np.float64) / 255.0
    return [float(x) for x in np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)]


def lum(a): return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


# ------------------------------------------------------------------ landmarks

JOINTS = {'hips': 'J_Bip_C_Hips', 'spine': 'J_Bip_C_Spine', 'chest': 'J_Bip_C_Chest', 'uchest': 'J_Bip_C_UpperChest', 'neck': 'J_Bip_C_Neck',
          'head': 'J_Bip_C_Head', 'shoulder': 'J_Bip_L_UpperArm', 'elbow': 'J_Bip_L_LowerArm', 'wrist': 'J_Bip_L_Hand',
          'thigh': 'J_Bip_L_UpperLeg', 'knee': 'J_Bip_L_LowerLeg', 'ankle': 'J_Bip_L_Foot', 'toe': 'J_Bip_L_ToeBase'}


class Land(dict):
    """Joint positions (rest pose, export metres) plus face measures. L.y('knee') etc."""
    def y(self, k): return float(self[k][1])
    def x(self, k): return float(abs(self[k][0]))


def landmarks(g):
    L = Land()
    for k, n in JOINTS.items():
        try: L[k] = g.world(g.node(n))[:3, 3].copy()
        except StopIteration: pass
    F = mesh_points(g, 'Face_00_SKIN'); L['face'] = F
    L['chin'] = float(F[:, 1].min()); L['crown'] = float(F[:, 1].max()); L['face_x'] = float(np.abs(F[:, 0]).max())
    L['face_z'] = float(F[:, 2].max())
    for part, key in (('EyeWhite', 'eye'), ('FaceBrow', 'brow'), ('FaceMouth', 'mouth')):
        try: Q = mesh_points(g, part); L[key] = float(Q[:, 1].mean()); L[key + '_z'] = float(Q[:, 2].max())
        except KeyError: pass
    try: H = mesh_points(g, 'Hair_00_HAIR'); L['hair'] = H; L['hair_top'] = float(H[:, 1].max())
    except KeyError: pass
    return L


def prims_of(g, part):
    j = g.j; out = []
    for ni, n in enumerate(j['nodes']):
        if 'mesh' not in n: continue
        for pr in j['meshes'][n['mesh']]['primitives']:
            if part in j['materials'][pr['material']]['name']: out.append(pr)
    if not out: raise KeyError(part)
    return out


def mesh_points(g, part):
    P = []
    for pr in prims_of(g, part):
        Q = g.acc(pr['attributes']['POSITION']); used = np.unique(g.acc(pr['indices']).ravel()); P.append(Q[used])
    return np.concatenate(P).astype(np.float64)


# ------------------------------------------------------------------ texel -> world position

def prims_of_image(g, i):
    j = g.j; out = []
    for n in j['nodes']:
        if 'mesh' not in n: continue
        for pr in j['meshes'][n['mesh']]['primitives']:
            tx = j['materials'][pr['material']]['pbrMetallicRoughness'].get('baseColorTexture')
            if tx is not None and j['textures'][tx['index']]['source'] == i: out.append(pr)
    return out


def world_map(g, i, size):
    """World position, normal and coverage of every texel of image i (rest pose), from every primitive drawn with it."""
    Wd, H = size; Pm = np.zeros((H, Wd, 3), np.float32); Nm = np.zeros((H, Wd, 3), np.float32); cov = np.zeros((H, Wd), bool)
    for pr in prims_of_image(g, i):
        at = pr['attributes']; P = g.acc(at['POSITION']).astype(np.float64); UV = g.acc(at['TEXCOORD_0']).astype(np.float64)
        N = g.acc(at['NORMAL']).astype(np.float64) if 'NORMAL' in at else np.zeros_like(P); I = g.acc(pr['indices']).reshape(-1, 3)
        for t in I:
            uv = UV[t] * [Wd, H]; x0, y0 = np.floor(uv.min(0)).astype(int) - 1; x1, y1 = np.ceil(uv.max(0)).astype(int) + 1
            x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, Wd - 1), min(y1, H - 1)
            if x1 < x0 or y1 < y0: continue
            yy, xx = np.mgrid[y0:y1 + 1, x0:x1 + 1]; q = np.stack([xx + 0.5, yy + 0.5], -1) - uv[0]
            e1, e2 = uv[1] - uv[0], uv[2] - uv[0]; det = e1[0] * e2[1] - e1[1] * e2[0]
            if abs(det) < 1e-12: continue
            b1 = (q[..., 0] * e2[1] - q[..., 1] * e2[0]) / det; b2 = (q[..., 1] * e1[0] - q[..., 0] * e1[1]) / det; b0 = 1 - b1 - b2
            ins = (b0 >= -0.03) & (b1 >= -0.03) & (b2 >= -0.03)
            if not ins.any(): continue
            w = b0[..., None] * P[t[0]] + b1[..., None] * P[t[1]] + b2[..., None] * P[t[2]]
            n = b0[..., None] * N[t[0]] + b1[..., None] * N[t[1]] + b2[..., None] * N[t[2]]
            sub = cov[y0:y1 + 1, x0:x1 + 1]; strict = ins & ((b0 >= 0) & (b1 >= 0) & (b2 >= 0) | ~sub)
            Pm[y0:y1 + 1, x0:x1 + 1][strict] = w[strict]; Nm[y0:y1 + 1, x0:x1 + 1][strict] = n[strict]; sub |= ins
    return Pm, Nm, cov


class Tex:
    """A texture being repainted: a (RGBA float), P/N (texel world position and normal), cov (texels a triangle covers)."""
    def __init__(self, g, part, i=None):
        self.g = g; self.part = part; self.i = g.mat_image(part) if i is None else i; self.im = g.image(self.i).convert('RGBA'); self.a = arr(self.im)
        self.P, self.N, self.cov = world_map(g, self.i, self.im.size); self.x, self.y, self.z = self.P[..., 0], self.P[..., 1], self.P[..., 2]
        self.ax = np.abs(self.x); self.H, self.W = self.a.shape[:2]
    def lum(self): return lum(self.a)
    def save(self): self.g.set_image(self.i, img(self.a))
    def detail(self, sigma=10):
        """The texture's fine light and dark (folds, seams) relative to its local mean: 1 = flat. Region colours (a red
        bodice next to a cream apron) cancel out, so a repaint is even."""
        if getattr(self, '_det', None) is None:
            from scipy.ndimage import gaussian_filter
            L = self.lum().astype(np.float64); w = (self.a[..., 3] > 0).astype(np.float64)
            mean = gaussian_filter(L * w, sigma) / np.maximum(gaussian_filter(w, sigma), 1e-6)
            self._det = np.clip(L / np.maximum(mean, 1), 0.3, 1.6)
        return self._det
    def fill(self, m, rgb, keep=0.5, ref=None, lo=0.62, hi=1.12):
        """Colour `rgb` on mask m, keeping the texture's own folds and seams (local light and dark, to the power keep)."""
        m = m & self.cov
        if not m.any(): return
        s = np.clip(self.detail()[m] ** keep, lo, hi); self.a[m, :3] = np.asarray(rgb, np.float32)[None] * s[:, None]
    def flat(self, m, rgb, alpha=None):
        m = m & self.cov; self.a[m, :3] = rgb
        if alpha is not None: self.a[m, 3] = alpha
    def hide(self, m): self.a[m & self.cov, 3] = 0
    def show(self, m): self.a[m & self.cov, 3] = 255


def stripes(t, axis_vals, period, rgb_a, rgb_b, duty=0.5):
    return (np.mod(axis_vals / period, 1.0) < duty)


# ------------------------------------------------------------------ hair

def hair_colour(g, dark, mid, light, hi=None):
    """Recolour hair textures to a ramp dark -> mid -> light by the texture's own luminance (strands and the glossy band
    stay where they are)."""
    for m in g.j['materials']:
        if 'HAIR' not in m['name']: continue
        tx = m['pbrMetallicRoughness'].get('baseColorTexture')
        if not tx: continue
        i = g.j['textures'][tx['index']]['source']; a = arr(g.image(i)); vis = a[..., 3] > 8
        if not vis.any(): continue
        L = lum(a); lo, top = np.percentile(L[vis], 3), np.percentile(L[vis], 97); t = np.clip((L - lo) / max(top - lo, 1), 0, 1)
        d, md, l = (np.asarray(c, np.float32) for c in (dark, mid, light))
        c = np.where(t[..., None] < 0.5, d + (md - d) * (t[..., None] / 0.5), md + (l - md) * ((t[..., None] - 0.5) / 0.5))
        a[vis, :3] = c[vis]; g.set_image(i, img(a))
        mt = m['extensions']['VRMC_materials_mtoon']; mt['shadeColorFactor'] = [0.80, 0.72, 0.68]
        mt['shadeMultiplyTexture'] = {'index': tx['index']}                    # shade = the recoloured texture, darkened
        # the export's sheen (a white matcap at full strength) and gloss ring (orange, for brown hair) follow the colour
        mt['matcapFactor'] = [x * 0.18 for x in lin(light)]; mt['parametricRimColorFactor'] = [0, 0, 0]
        if 'emissiveFactor' in m: m['emissiveFactor'] = [x * 0.9 for x in lin(light)]


def hair_cut(g, y_end, **kw):
    """Liv's bob cut (vrm_fit.hair_bob) with this character's length function y_end(angle from the front, degrees)."""
    class O: pass
    o = O(); defaults = dict(hair_zc=-0.04, hair_jitter=0.008, hair_width=1.0, hair_blunt=0.9, hair_drop='', hair_fly=9.0,
                             hair_report=False, hair_drop_tips='', hair_wave=0.0, hair_volume=0.0, hair_flick=0.0)
    defaults.update(kw); [setattr(o, k, v) for k, v in defaults.items()]
    old = V.y_end; V.y_end = y_end
    try: V.hair_bob(g, o)
    finally: V.y_end = old


def hair_drop(g, pred, label='locks'):
    """Remove whole hair locks (welded components) whose centre satisfies pred(centre xyz, points)."""
    import scipy.sparse as sp
    from scipy.sparse.csgraph import connected_components
    node = g.j['nodes'][g.node('Hair')]; pr = g.j['meshes'][node['mesh']]['primitives'][0]
    P = g.acc(pr['attributes']['POSITION']).astype(np.float64); I = g.acc(pr['indices']).reshape(-1, 3).astype(np.int64)
    _, weld = np.unique(np.round(P * 2e4).astype(np.int64), axis=0, return_inverse=True); weld = weld.ravel(); n = weld.max() + 1
    e = np.concatenate([weld[I[:, [0, 1]]], weld[I[:, [1, 2]]], weld[I[:, [2, 0]]]])
    nc, lab = connected_components(sp.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n)), directed=False); sid = lab[weld]
    gone = np.zeros(len(P), bool); k = 0
    for s in range(nc):
        idx = np.where(sid == s)[0]
        if len(idx) and pred(P[idx].mean(0), P[idx]): gone[idx] = True; k += 1
    keep = I[~gone[I].any(1)]; ia = g.j['accessors'][pr['indices']]
    pr['indices'] = g.new_acc(keep.ravel().astype(np.uint32), 'SCALAR'); g.j['bufferViews'][-1]['target'] = 34963
    print(f'hair: {k} {label} removed ({len(I) - len(keep)} triangles)')


def hair_squash(g, fn):
    """Move hair vertices: P -> fn(P) (rest pose), e.g. pressing the hair flat under a scarf or hat."""
    node = g.j['nodes'][g.node('Hair')]; pr = g.j['meshes'][node['mesh']]['primitives'][0]
    P = g.acc(pr['attributes']['POSITION']).astype(np.float64); P2 = fn(P)
    pr['attributes']['POSITION'] = g.new_acc(P2.astype(np.float32), 'VEC3', True)


# ------------------------------------------------------------------ face

def face_paint(g, L, skin=None, blush=0.35, blush_rgb=(240, 140, 120), freckles=0, freckle_rgb=(190, 110, 70), wrinkles=0.0, stubble=None):
    t = Tex(g, 'Face_00_SKIN')
    if skin is not None:                                                       # to the measured skin colour of the texture itself
        vis = t.a[..., 3] > 0; ref = np.median(t.a[vis & t.cov][:, :3], 0); t.a[vis, :3] *= np.asarray(skin, np.float32) / np.maximum(ref, 1)
    front = t.z > L['face_z'] - 0.06
    for sx in (-1, 1):
        cx = sx * L['face_x'] * 0.52; cy = L['eye'] - (L['eye'] - L['mouth']) * 0.55
        r = np.hypot((t.x - cx) / (L['face_x'] * 0.30), (t.y - cy) / ((L['eye'] - L['mouth']) * 0.42))
        k = np.clip(1 - r, 0, 1) ** 1.5 * blush * front * t.cov
        t.a[..., :3] = t.a[..., :3] * (1 - k[..., None]) + np.asarray(blush_rgb, np.float32) * k[..., None]
    if freckles:
        rng = np.random.RandomState(5); im = img(t.a); a = t.a
        for sx in (-1, 1):
            for _ in range(freckles):
                px = sx * L['face_x'] * rng.uniform(0.12, 0.52); py = L['eye'] - (L['eye'] - L['mouth']) * rng.uniform(0.42, 0.70)
                d2 = (t.x - px) ** 2 + (t.y - py) ** 2; m = front & t.cov & (d2 < (L['face_x'] * rng.uniform(0.013, 0.02)) ** 2)
                a[m, :3] = a[m, :3] * 0.5 + np.asarray(freckle_rgb, np.float32) * 0.5
    if wrinkles:
        ln = np.zeros(t.cov.shape, bool); fx = L['face_x']; e, b, mo = L['eye'], L.get('brow', L['eye'] + 0.03), L['mouth']
        for k in range(3):                                                       # forehead lines
            yy = b + (0.018 + 0.014 * k) * (fx / 0.11)
            ln |= front & (np.abs(t.y - yy - 0.004 * np.cos(t.x / fx * 3)) < 0.0011 * fx / 0.11) & (t.ax < fx * (0.45 - 0.07 * k))
        for sx in (-1, 1):                                                       # smile lines from the nose to the mouth corners
            x0 = sx * fx * 0.20; y0 = e - (e - mo) * 0.45
            s = np.clip((y0 - t.y) / max(y0 - mo + 0.01, 1e-3), 0, 1); xl = x0 + sx * fx * 0.17 * s
            ln |= front & (np.abs(t.x - xl) < 0.0012 * fx / 0.11) & (t.y < y0) & (t.y > mo - 0.008)
            for k in range(2):                                                   # crow's feet
                ang = 0.35 * (k - 0.5); yy = e + (t.ax - fx * 0.62) * np.tan(ang)
                ln |= (np.sign(t.x) == sx) & (np.abs(t.y - yy) < 0.001 * fx / 0.11) & (t.ax > fx * 0.62) & (t.ax < fx * 0.78)
        t.a[ln & t.cov, :3] *= (1 - 0.35 * wrinkles)
    if stubble is not None:
        m = front & t.cov & (t.y < L['mouth'] + 0.01) & (t.ax < L['face_x'] * 0.8)
        t.a[m, :3] = t.a[m, :3] * 0.8 + np.asarray(stubble, np.float32) * 0.2
    t.save()
    for m in g.j['materials']:
        if 'SKIN' in m['name'] or 'FaceMouth' in m['name']: m['extensions']['VRMC_materials_mtoon']['shadeColorFactor'] = [0.95, 0.80, 0.72]


def skin_tone(g, rgb):
    i = g.mat_image('Body_00_SKIN'); a = arr(g.image(i)); vis = a[..., 3] > 0
    skinish = vis & (a[..., 0] > a[..., 2] + 8) & (a[..., 0] > 180)                       # skin, not painted socks or clothes
    ref = np.median(a[skinish][:, :3], 0) if skinish.sum() > 100 else np.array([253, 203, 155], np.float32)
    m = vis & (np.abs(a[..., :3] - ref).max(-1) < 40); a[m, :3] *= np.asarray(rgb, np.float32) / np.maximum(ref, 1); g.set_image(i, img(a))


def brows(g, rgb, thick=0.007, short=True):
    i = g.mat_image('FaceBrow'); a = arr(g.image(i)); H, Wd = a.shape[:2]
    al = Image.fromarray(a[..., 3].astype(np.uint8))
    if thick: al = al.filter(ImageFilter.MaxFilter(2 * int(Wd * thick) + 1)).filter(ImageFilter.GaussianBlur(Wd * 0.0015))
    al = np.array(al).astype(np.float32); xs = np.arange(Wd) / Wd
    win = np.where(xs < 0.5, sstep(0.13, 0.22, xs), sstep(0.87, 0.78, xs)) if short else np.ones(Wd)
    a[..., 3] = np.clip(al * 1.2, 0, 255) * win[None, :]; a[..., :3] = rgb; g.set_image(i, img(a))


def lashes(g, rgb=None, alpha=1.0):
    i = g.mat_image('FaceEyeline'); a = arr(g.image(i))
    if rgb is not None: a[..., :3] = rgb
    a[..., 3] *= alpha; g.set_image(i, img(a))


def iris(g, rgb, keep=0.9):
    i = g.mat_image('EyeIris'); a = arr(g.image(i)); vis = a[..., 3] > 8; L = lum(a); r = np.percentile(L[vis], 80)
    s = np.clip(L / max(r, 1), 0.15, 1.35) ** keep; col = np.asarray(rgb, np.float32)[None] * s[vis][:, None]
    dark = L[vis] < 30; col[dark] = a[vis][dark, :3]; a[vis, :3] = col; g.set_image(i, img(a))


# ------------------------------------------------------------------ generated parts

def add_part(g, name, P, N, I, rgb, shade=0.72, outline=0.0016, double=True, parent='J_Bip_C_Head', head_k=1.0):
    """A rigid mesh fixed to a joint. P, N in the export's world space (rest pose); stored relative to the joint."""
    j = g.j; pj = g.node(parent); org = g.world(pj)[:3, 3]
    src = next(m for m in j['materials'] if 'CLOTH' in m['name'])
    mt = copy.deepcopy(src['extensions']['VRMC_materials_mtoon'])
    for k in [k for k in mt if k.endswith('Texture')]: mt.pop(k)
    c = lin(rgb); mt['shadeColorFactor'] = [x * shade for x in c]; mt['outlineWidthMode'] = 'worldCoordinates'
    mt['outlineWidthFactor'] = outline / max(head_k, 0.3) if parent == 'J_Bip_C_Head' else outline; mt['outlineColorFactor'] = OUTLINE
    mt['outlineLightingMixFactor'] = 0.0; mt['parametricRimColorFactor'] = [0, 0, 0]; mt['matcapFactor'] = [0, 0, 0]
    mat = {'name': f'AccHair_{name}', 'alphaMode': 'OPAQUE', 'doubleSided': bool(double),
           'pbrMetallicRoughness': {'baseColorFactor': c + [1.0], 'metallicFactor': 0.0, 'roughnessFactor': 1.0},
           'extensions': {'VRMC_materials_mtoon': mt}}
    j['materials'].append(mat); mi = len(j['materials']) - 1
    P = np.asarray(P, np.float32) - org.astype(np.float32); N = np.asarray(N, np.float32)
    N = N / np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-9)
    UV = np.zeros((len(P), 2), np.float32)
    at = {'POSITION': g.new_acc(P, 'VEC3', True), 'NORMAL': g.new_acc(N.astype(np.float32), 'VEC3'), 'TEXCOORD_0': g.new_acc(UV, 'VEC2')}
    ii = g.new_acc(np.asarray(I, np.uint32).ravel(), 'SCALAR'); j['bufferViews'][-1]['target'] = 34963
    j['meshes'].append({'name': f'Hair_{name}', 'primitives': [{'attributes': at, 'indices': ii, 'material': mi, 'mode': 4}]})
    j['nodes'].append({'name': f'Hair_{name}', 'mesh': len(j['meshes']) - 1}); ni = len(j['nodes']) - 1
    j['nodes'][pj].setdefault('children', []).append(ni)
    return ni


def normals(P, I):
    P = np.asarray(P, np.float64); I = np.asarray(I); fn = np.cross(P[I[:, 1]] - P[I[:, 0]], P[I[:, 2]] - P[I[:, 0]]); N = np.zeros_like(P)
    for c in range(3): np.add.at(N, I[:, c], fn)
    return N / np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-12)


def grid_tris(nu, nv, wrap_u=False):
    I = []
    for i in range(nu - (0 if wrap_u else 1)):
        i2 = (i + 1) % nu
        for k in range(nv - 1):
            a, b, c, d = i * nv + k, i2 * nv + k, i2 * nv + k + 1, i * nv + k + 1; I += [(a, b, c), (a, c, d)]
    return np.array(I, np.int64)


def ellipsoid(c, r, nu=28, nv=16, rot=None):
    th = np.linspace(0, 2 * np.pi, nu, endpoint=False); ph = np.linspace(0, np.pi, nv)
    T, Ph = np.meshgrid(th, ph, indexing='ij'); u = np.stack([np.sin(Ph) * np.sin(T), np.cos(Ph), np.sin(Ph) * np.cos(T)], -1).reshape(-1, 3)
    P = u * np.asarray(r)[None]
    if rot is not None: P = P @ np.asarray(rot).T
    P = P + np.asarray(c)[None]; I = grid_tris(nu, nv, True)
    # outward-facing winding
    N = normals(P, I)
    if (np.sum(N * (P - np.asarray(c)), 1) < 0).mean() > 0.5: I = I[:, [0, 2, 1]]
    return P, normals(P, I), I


def lathe(c, prof, nu=40):
    """Surface of revolution about the vertical axis through c; prof = [(radius, height), ...] from the top down."""
    prof = np.asarray(prof, np.float64); th = np.linspace(0, 2 * np.pi, nu, endpoint=False)
    P = np.array([[r * np.sin(t), h, r * np.cos(t)] for t in th for r, h in prof]) + np.asarray(c)[None]
    I = grid_tris(nu, len(prof), True); N = normals(P, I)
    if (np.sum(N[:, [0, 2]] * (P - np.asarray(c))[:, [0, 2]], 1) + N[:, 1] * 0.01 < 0).mean() > 0.5: I = I[:, [0, 2, 1]]
    return P, normals(P, I), I


def torus(c, R, r, axis='z', nu=36, nv=10):
    a = np.linspace(0, 2 * np.pi, nu, endpoint=False); b = np.linspace(0, 2 * np.pi, nv, endpoint=False)
    A, B = np.meshgrid(a, b, indexing='ij')
    x = (R + r * np.cos(B)) * np.cos(A); y = (R + r * np.cos(B)) * np.sin(A); z = r * np.sin(B)
    P = np.stack([x, y, z], -1).reshape(-1, 3)
    if axis == 'z': pass
    I = []
    for i in range(nu):
        for k in range(nv):
            i2, k2 = (i + 1) % nu, (k + 1) % nv; I += [(i * nv + k, i2 * nv + k, i2 * nv + k2), (i * nv + k, i2 * nv + k2, i * nv + k2)]
    I = np.array(I); P = P + np.asarray(c)[None]; return P, normals(P, I), I


def tube(pts, r, nv=8):
    pts = np.asarray(pts, np.float64); n = len(pts); P = []
    for i in range(n):
        t = pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]; t /= np.linalg.norm(t)
        a = np.cross(t, [0, 1, 0]) if abs(t[1]) < 0.9 else np.cross(t, [1, 0, 0]); a /= np.linalg.norm(a); b = np.cross(t, a)
        rr = r[i] if np.ndim(r) else r
        for k in range(nv): ang = 2 * np.pi * k / nv; P.append(pts[i] + rr * (np.cos(ang) * a + np.sin(ang) * b))
    P = np.array(P); I = grid_tris(n, nv, False)
    I = []
    for i in range(n - 1):
        for k in range(nv):
            k2 = (k + 1) % nv; I += [(i * nv + k, (i + 1) * nv + k, (i + 1) * nv + k2), (i * nv + k, (i + 1) * nv + k2, i * nv + k2)]
    I = np.array(I); N = normals(P, I)
    if (np.sum(N * (P - np.repeat(pts, nv, 0)), 1) < 0).mean() > 0.5: I = I[:, [0, 2, 1]]
    return P, normals(P, I), I


def merge(*parts):
    P, N, I = [], [], []; o = 0
    for p, n, i in parts: P.append(p); N.append(n); I.append(np.asarray(i) + o); o += len(p)
    return np.concatenate(P), np.concatenate(N), np.concatenate(I)


def radial_profile(points, c, th_bins, y_bins):
    """Largest horizontal distance of `points` from the vertical axis through c, per (angle, height) bin; NaN where empty."""
    d = points - np.asarray(c)[None]; th = np.arctan2(d[:, 0], d[:, 2]); r = np.hypot(d[:, 0], d[:, 2])
    it = np.clip(np.searchsorted(th_bins, th) - 1, 0, len(th_bins) - 2); iy = np.clip(np.searchsorted(y_bins, points[:, 1]) - 1, 0, len(y_bins) - 2)
    out = np.full((len(th_bins) - 1, len(y_bins) - 1), np.nan)
    for a, b, rr in zip(it, iy, r):
        if np.isnan(out[a, b]) or rr > out[a, b]: out[a, b] = rr
    return out


def shell(c, th, ys, R, close_top=False):
    """Surface over a (angle, height) grid at radius R[angle, height] about the vertical axis through c."""
    T, Y = np.meshgrid(th, ys, indexing='ij'); P = np.stack([c[0] + R * np.sin(T), Y, c[2] + R * np.cos(T)], -1).reshape(-1, 3)
    I = grid_tris(len(th), len(ys), False); N = normals(P, I)
    out = (np.sum(N[:, [0, 2]] * (P[:, [0, 2]] - np.asarray(c)[[0, 2]]), 1) < 0).mean() > 0.5
    if out: I = I[:, [0, 2, 1]]
    return P, normals(P, I), I


def face_radius(L, c, th, ys, pad=0.0):
    """Radius of the face/head surface about the vertical axis through c, per (angle, height); gaps filled along height."""
    tb = np.concatenate([[th[0] - (th[1] - th[0]) / 2], (th[:-1] + th[1:]) / 2, [th[-1] + (th[1] - th[0]) / 2]])
    yb = np.concatenate([[ys[0] - (ys[1] - ys[0]) / 2], (ys[:-1] + ys[1:]) / 2, [ys[-1] + (ys[1] - ys[0]) / 2]])
    R = radial_profile(L['face'], c, tb, yb)
    for a in range(R.shape[0]):
        col = R[a]; ok = ~np.isnan(col)
        if ok.any(): R[a] = np.interp(np.arange(len(col)), np.where(ok)[0], col[ok])
        else: R[a] = np.nanmedian(R)
    from scipy.ndimage import gaussian_filter
    return gaussian_filter(R, 1.0) + pad


def beard(L, length=0.06, thick=0.012, top_front=None, top_side=None, spread=1.0, bulge=0.012, sides=105):
    """A full beard: from just under the lower lip in front up along the cheeks to the sideburns, hanging `length` below the
    chin, wrapped `thick` off the face (thicker at the chin)."""
    c = np.array([0.0, 0.0, L['face_z'] - L['face_x'] * 1.05]); fx = L['face_x']
    th = np.radians(np.linspace(-sides, sides, 31)); ys = np.linspace(L['chin'] - length, L['eye'], 26)
    R = face_radius(L, c, th, ys)
    chin_r = np.array([R[a][np.searchsorted(ys, L['chin'])] for a in range(len(th))])
    Y = ys[None, :]; below = Y < L['chin']
    R = np.where(below, np.maximum(R, chin_r[:, None] - (L['chin'] - Y) * 0.35), R)
    yt_f = top_front if top_front is not None else L['mouth'] - 0.010; yt_s = top_side if top_side is not None else L['eye'] - 0.012
    a = np.abs(th)[:, None]
    ytop = yt_f + (yt_s - yt_f) * sstep(np.radians(18), np.radians(70), a)
    ybot = L['chin'] - length * (np.cos(np.clip(th, -1.5, 1.5)) ** 0.8)[:, None] * spread + 0.01 * (1 - np.cos(np.clip(th, -1.5, 1.5)))[:, None]
    # every column runs from ybot to ytop: re-sample heights per column
    P, rows = [], 22
    for i in range(len(th)):
        yy = np.linspace(ybot[i, 0], ytop[i, 0], rows); rr = np.interp(yy, ys, R[i])
        s = (yy - ybot[i, 0]) / max(ytop[i, 0] - ybot[i, 0], 1e-6)                  # 0 at the bottom edge, 1 at the top edge
        tk = thick * (0.35 + 0.65 * np.sin(np.pi * np.clip(s * 0.9 + 0.08, 0, 1))) + bulge * np.exp(-((th[i] / 0.8) ** 2)) * sstep(0.0, 0.6, s) * sstep(1.0, 0.5, s)
        rr = rr + tk; P += [[c[0] + r_ * np.sin(th[i]), y_, c[2] + r_ * np.cos(th[i])] for r_, y_ in zip(rr, yy)]
    P = np.array(P); I = grid_tris(len(th), rows, False); N = normals(P, I)
    if (np.sum(N[:, [0, 2]] * (P[:, [0, 2]] - c[[0, 2]]), 1) < 0).mean() > 0.5: I = I[:, [0, 2, 1]]
    return P, normals(P, I), I


def moustache(L, width=0.9, height=0.016, thick=0.007, droop=0.012, curl=0.0):
    c = np.array([0.0, 0.0, L['face_z'] - L['face_x'] * 1.05]); fx = L['face_x']
    th = np.radians(np.linspace(-38, 38, 25) * width); ys = np.linspace(L['mouth'] - 0.03, L['mouth'] + 0.04, 30)
    R = face_radius(L, c, th, ys)
    yc = L['mouth'] + 0.011; P = []; rows = 9
    for i, t in enumerate(th):
        s = abs(t) / max(abs(th).max(), 1e-6); hgt = height * (1 - 0.65 * s ** 2) + 0.002
        y0 = yc - droop * s ** 1.5 + curl * sstep(0.75, 1.0, s); yy = np.linspace(y0 - hgt / 2, y0 + hgt / 2, rows)
        rr = np.interp(yy, ys, R[i]) + thick * (1 - 0.5 * s) * np.sin(np.linspace(0.15, np.pi - 0.15, rows))
        P += [[c[0] + r_ * np.sin(t), y_, c[2] + r_ * np.cos(t)] for r_, y_ in zip(rr, yy)]
    P = np.array(P); I = grid_tris(len(th), rows, False); N = normals(P, I)
    if (np.sum(N[:, [0, 2]] * (P[:, [0, 2]] - c[[0, 2]]), 1) < 0).mean() > 0.5: I = I[:, [0, 2, 1]]
    return P, normals(P, I), I


def head_cover(L, pts, c, y_lo, pad=0.006, th_range=(-180, 180), front_y=None, back_y=None, nth=48, ny=16):
    """A cap over the head (scarf, hat crown): the outer surface of `pts` (hair) above y_lo plus pad. front_y/back_y set
    the lower edge in front and at the back (an edge that sweeps down from the forehead to the nape)."""
    th = np.radians(np.linspace(th_range[0], th_range[1], nth)); top = float(pts[:, 1].max()) + pad
    ys = np.linspace(y_lo, top, ny)
    tb = np.concatenate([[th[0] - 0.07], (th[:-1] + th[1:]) / 2, [th[-1] + 0.07]]); yb = np.concatenate([[ys[0] - 0.01], (ys[:-1] + ys[1:]) / 2, [ys[-1] + 0.05]])
    R = radial_profile(pts, c, tb, yb)
    for a in range(R.shape[0]):
        col = R[a]; ok = ~np.isnan(col)
        R[a] = np.interp(np.arange(len(col)), np.where(ok)[0], col[ok]) if ok.any() else np.nanmedian(R)
    from scipy.ndimage import gaussian_filter
    R = gaussian_filter(R, (1.5, 1.0), mode=['wrap', 'nearest']) + pad
    # dome: the top rows close in to the crown
    P = []; rows = ny + 6
    for i, t in enumerate(th):
        a = abs(np.degrees(t)); ylo = y_lo if front_y is None else float(np.interp(a, [0, 90, 180], [front_y, (front_y + back_y) / 2, back_y]))
        yy = np.linspace(ylo, top, rows); rr = np.interp(yy, ys, R[i]); k = sstep(top - (top - y_lo) * 0.35, top, yy)
        rr = rr * np.sqrt(np.clip(1 - k ** 2, 0, 1)) + 0.0
        yy = yy + 0
        P += [[c[0] + r_ * np.sin(t), y_, c[2] + r_ * np.cos(t)] for r_, y_ in zip(rr, yy)]
    P = np.array(P); wrap = th_range[1] - th_range[0] >= 359
    I = grid_tris(len(th), rows, wrap); N = normals(P, I)
    if (np.sum(N * (P - np.array([c[0], y_lo, c[2]])), 1) < 0).mean() > 0.5: I = I[:, [0, 2, 1]]
    return P, normals(P, I), I


# ------------------------------------------------------------------ look and output

def look(g, o_head, outline=0.0016, hair_gloss=0.4, cloth_shade=(0.80, 0.70, 0.66), name=None):
    for m in g.j['materials']:
        mt = m['extensions'].get('VRMC_materials_mtoon') if 'extensions' in m else None
        if mt is None or m['name'].startswith('AccHair_'): continue
        mt['outlineColorFactor'] = OUTLINE; head = any(k in m['name'] for k in ('Face', 'Hair', 'Eye'))
        if mt.get('outlineWidthMode') == 'worldCoordinates': mt['outlineWidthFactor'] = outline * (1 / max(o_head, 0.3) if head else 1)
        if 'Hair_00_HAIR' in m['name'] and 'HairBack' not in m['name']:
            mt['outlineWidthMode'] = 'worldCoordinates'; mt['outlineWidthFactor'] = outline * 0.8 / o_head; mt['outlineLightingMixFactor'] = 0
            m['emissiveFactor'] = [x * hair_gloss for x in m.get('emissiveFactor', [0, 0, 0])]
        if 'CLOTH' in m['name']: mt['shadeColorFactor'] = list(cloth_shade)
    meta = g.j['extensions']['VRMC_vrm']['meta']
    if name: meta['name'] = name
    meta['authors'] = ['Deutschklinik']
    t = meta.get('thumbnailImage')
    if t is not None: g.set_image(t, g.image(t).convert('RGBA').resize((256, 256), Image.LANCZOS))


def heads_k(L, target):
    """Head joint scale that makes the model `target` heads tall (crown to soles; hair volume not counted)."""
    h = L['crown'] - L['chin']; H = L['crown']
    return float((H - h) / (h * (target - 1)))


def run(cid, src=None, dst=None, only=None):
    import cast_specs as S
    spec = S.CAST[cid]; src = src or os.path.join(HERE, 'models', 'cast', spec['src']); dst = dst or os.path.join(HERE, 'models', 'cast', cid.lower() + '.vrm')
    g = GLB(src); L = landmarks(g)
    k = spec.get('head') or heads_k(L, spec['heads'])
    print(f'{cid}: {spec["name"]}: export {L["crown"] - L["chin"]:.3f} m head, {L["crown"]:.3f} m to the crown; head joint x{k:.3f}')
    L['k'] = k; L['skin'] = spec.get('skin') or (240, 200, 165)
    if spec.get('skin'): skin_tone(g, spec['skin'])           # first, so socks and clothes painted later keep their colour
    spec['fit'](g, L, k)
    print(f'face lines: {face_lines(g, L)} texels')           # nose and mouth readable at scene distance                                  # hair, paint, parts (all in the export's unscaled space)
    V.head_scale(g, k)
    look(g, k, name=spec['name'])
    V.slim(g)
    n = g.save(dst); print(f'wrote {dst}: {n / 1e6:.1f} MB')


# ------------------------------------------------------------------ a skinned cloth sheet (an apron that follows the legs)

def add_skinned(g, name, P, I, joints, weights, rgb, shade=0.72, outline=0.0016):
    """A sheet skinned to the body's own skin: joints (N x 4 joint node names), weights (N x 4). Added as a primitive of
    the Body mesh, so it uses the Body node's skin."""
    j = g.j; bn = g.node('Body'); node = j['nodes'][bn]; sk = j['skins'][node['skin']]
    idx = {j['nodes'][n]['name']: k for k, n in enumerate(sk['joints'])}
    J = np.array([[idx[n] for n in row] for row in joints], np.uint16); Wt = np.asarray(weights, np.float32); Wt /= Wt.sum(1, keepdims=True)
    src = next(m for m in j['materials'] if 'CLOTH' in m['name']); mt = copy.deepcopy(src['extensions']['VRMC_materials_mtoon'])
    for k in [k for k in mt if k.endswith('Texture')]: mt.pop(k)
    c = lin(rgb); mt['shadeColorFactor'] = [x * shade for x in c]; mt['outlineWidthMode'] = 'worldCoordinates'; mt['outlineWidthFactor'] = outline
    mt['outlineColorFactor'] = OUTLINE; mt['outlineLightingMixFactor'] = 0.0; mt['parametricRimColorFactor'] = [0, 0, 0]; mt['matcapFactor'] = [0, 0, 0]
    j['materials'].append({'name': f'AccHair_{name}', 'alphaMode': 'OPAQUE', 'doubleSided': True,
                           'pbrMetallicRoughness': {'baseColorFactor': c + [1.0], 'metallicFactor': 0.0, 'roughnessFactor': 1.0},
                           'extensions': {'VRMC_materials_mtoon': mt}})
    P = np.asarray(P, np.float32); N = normals(P, I).astype(np.float32)
    at = {'POSITION': g.new_acc(P, 'VEC3', True), 'NORMAL': g.new_acc(N, 'VEC3'), 'TEXCOORD_0': g.new_acc(np.zeros((len(P), 2), np.float32), 'VEC2'),
          'JOINTS_0': g.new_acc(J, 'VEC4'), 'WEIGHTS_0': g.new_acc(Wt, 'VEC4')}
    ii = g.new_acc(np.asarray(I, np.uint32).ravel(), 'SCALAR'); j['bufferViews'][-1]['target'] = 34963
    j['meshes'][node['mesh']]['primitives'].append({'attributes': at, 'indices': ii, 'material': len(j['materials']) - 1, 'mode': 4})


def front_surface(g, parts=('Body_00_SKIN', 'Tops', 'Bottoms')):
    pts = []
    for p in parts:
        try: pts.append(mesh_points(g, p))
        except KeyError: pass
    return np.concatenate(pts)


def apron_sheet(g, L, y_top, y_bot, half_w, rgb, off=0.014, nx=13, ny=22, name='Apron'):
    """A bib apron: half_w(y) is its half width at height y. It lies `off` in front of the body (clothes included) and
    hangs straight below the belly. Rows above the hips follow the spine, rows below blend from the hips into the thighs
    (left half the left thigh, right half the right one), like a skirt."""
    S = front_surface(g); ys = np.linspace(y_top, y_bot, ny); P = []; JN = []; WT = []
    zmax_run = -1.0
    for r, y in enumerate(ys):
        hw = half_w(y); xs = np.linspace(-hw, hw, nx)
        band = S[np.abs(S[:, 1] - y) < 0.02]
        zs = []
        for x in xs:
            q = band[np.abs(band[:, 0] - x) < 0.03]; zs.append(q[:, 2].max() if len(q) else (zs[-1] if zs else 0.1))
        zs = np.array(zs); zmax_run = max(zmax_run, zs.max()) if y < L.y('hips') + 0.08 else zmax_run
        if y < L.y('hips'): zs = np.maximum(zs, zmax_run - 0.01)                 # hangs from the belly, not into the legs
        zs = np.convolve(np.pad(zs, 2, mode='edge'), np.ones(5) / 5, 'valid') + off + 0.07 * float(sstep(L.y('hips'), L.y('knee'), y))   # stands off the knees
        for x, z in zip(xs, zs):
            P.append([x, y, z])
            if y > L.y('chest'): JN.append(['J_Bip_C_UpperChest', 'J_Bip_C_Chest', 'J_Bip_C_Spine', 'J_Bip_C_Hips']); WT.append([0.7, 0.3, 1e-4, 1e-4])
            elif y > L.y('hips') + 0.03:
                t = float(sstep(L.y('hips') + 0.03, L.y('chest'), y)); JN.append(['J_Bip_C_Chest', 'J_Bip_C_Spine', 'J_Bip_C_Hips', 'J_Bip_C_UpperChest']); WT.append([t * 0.6, 0.4, (1 - t) * 0.6 + 1e-4, 1e-4])
            else:
                # each half leans on its own thigh but also on the other one, so the sheet swings a little and never
                # folds round a leg (a full split made it trail behind the back leg like a tail)
                lg = float(sstep(L.y('hips') + 0.03, L.y('knee') + 0.05, y)) * 0.55; sl = float(sstep(-0.08, 0.08, x))
                JN.append(['J_Bip_C_Hips', 'J_Bip_L_UpperLeg', 'J_Bip_R_UpperLeg', 'J_Bip_C_Spine']); WT.append([1 - lg + 1e-4, lg * (0.3 + 0.4 * sl) + 1e-4, lg * (0.3 + 0.4 * (1 - sl)) + 1e-4, 1e-4])
    P = np.array(P); I = grid_tris(ny, nx, False)
    I = []
    for r in range(ny - 1):
        for c in range(nx - 1):
            a, b, d, e = r * nx + c, r * nx + c + 1, (r + 1) * nx + c, (r + 1) * nx + c + 1; I += [(a, d, b), (b, d, e)]
    I = np.array(I); N = normals(P, I)
    if (N[:, 2] < 0).mean() > 0.5: I = I[:, [0, 2, 1]]
    add_skinned(g, name, P, I, JN, WT, rgb)
    return P


def sphere_cover(pts, c, pad, y_edge, nth=48, nph=22, ph_max=2.2):
    """A cap over the head: in every direction from c (spherical angles), as far out as the farthest of `pts` plus pad,
    down to the height y_edge(theta) (theta 0 = front, radians)."""
    from scipy.ndimage import gaussian_filter
    d = pts - np.asarray(c)[None]; r = np.linalg.norm(d, axis=1); th = np.arctan2(d[:, 0], d[:, 2]); ph = np.arccos(np.clip(d[:, 1] / np.maximum(r, 1e-9), -1, 1))
    tb = np.linspace(-np.pi, np.pi, nth + 1); pb = np.linspace(0, ph_max, nph + 1)
    it = np.clip(np.searchsorted(tb, th) - 1, 0, nth - 1); ip = np.clip(np.searchsorted(pb, ph) - 1, 0, nph - 1)
    R = np.full((nth, nph), np.nan)
    for a, b, rr in zip(it, ip, r):
        if np.isnan(R[a, b]) or rr > R[a, b]: R[a, b] = rr
    for a in range(nth):
        ok = ~np.isnan(R[a]); R[a] = np.interp(np.arange(nph), np.where(ok)[0], R[a][ok]) if ok.any() else np.nan
    for b in range(nph):
        ok = ~np.isnan(R[:, b]); R[:, b] = np.interp(np.arange(nth), np.where(ok)[0], R[:, b][ok], period=nth) if ok.any() else np.nanmedian(R)
    R = gaussian_filter(R, (1.2, 1.0), mode=['wrap', 'nearest']) + pad
    thc = (tb[:-1] + tb[1:]) / 2; phc = (pb[:-1] + pb[1:]) / 2; rows = 24; P = []
    for a, t in enumerate(thc):
        Rm = float(np.median(R[a])); lim = float(np.arccos(np.clip((y_edge(t) - c[1]) / Rm, -1, 1)))
        for q in np.linspace(0.0, lim, rows):
            rr = float(np.interp(q, phc, R[a])); P.append([c[0] + rr * np.sin(q) * np.sin(t), c[1] + rr * np.cos(q), c[2] + rr * np.sin(q) * np.cos(t)])
    P = np.array(P); I = grid_tris(nth, rows, True); N = normals(P, I)
    if (np.sum(N * (P - np.asarray(c)), 1) < 0).mean() > 0.5: I = I[:, [0, 2, 1]]
    return P, normals(P, I), I


def face_lines(g, L, nose=0.75, mouth=0.6, nose_ink=(166, 92, 68), mouth_ink=(132, 58, 50)):
    """The export draws the nose (a tiny stroke) and the closed mouth (a thin line) so faintly that toon shading loses
    them beyond a close-up. Both marks are found by where they are on the face (the nose between the eyes and the
    mouth near the middle, the mouth line at mouth height) and by being darker than the skin around them, then
    darkened toward a warm ink and grown to about twice their size (soft edges), so they still read at scene distance.
    Subtle on purpose: no new lines are drawn, the face's own marks are only made readable."""
    from scipy.ndimage import grey_dilation, gaussian_filter
    t = Tex(g, 'Face_00_SKIN'); det = t.detail(10); fx = L['face_x']; e, mo = L['eye'], L['mouth']; span = e - mo
    front = t.cov & (t.z > L['face_z'] - 0.35 * fx); px = t.W / 1024
    out = 0
    for region, s, ink, foot in ((front & (t.ax < 0.08 * fx) & (t.y < e - 0.2 * span) & (t.y > mo + 0.3 * span), nose, nose_ink, (int(9 * px), int(5 * px))),
                                 (front & (t.ax < 0.32 * fx) & (np.abs(t.y - mo) < 0.16 * span), mouth, mouth_ink, (int(4 * px), int(5 * px)))):
        k = np.clip((0.985 - det) / 0.07, 0, 1) * region
        k = gaussian_filter(grey_dilation(k, size=foot), 1.2 * px) * region
        t.a[..., :3] = t.a[..., :3] * (1 - (k * s)[..., None]) + np.asarray(ink, np.float32) * (k * s)[..., None]; out += int((k > 0.2).sum())
    t.save(); return out


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('cid'); ap.add_argument('--src'); ap.add_argument('--dst')
    o = ap.parse_args()
    import cast_specs as S
    for c in (S.CAST if o.cid == 'all' else [o.cid]): run(c, o.src if o.cid != 'all' else None, o.dst if o.cid != 'all' else None)
