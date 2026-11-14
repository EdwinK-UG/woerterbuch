"""Second pass over a rig pack: painted mouths, closed eyes, hands and the satchel.
Usage: python cut_face.py art/c01-pack art/c01-pack-full out_dir     (out_dir already holds parts.json from cut_pack.py)
Everything is resampled into the pixel space of the body views, so the rig can draw it straight onto the head."""
import sys, json, os
import numpy as np, cv2
from PIL import Image

body, full, out = sys.argv[1:4]
P = json.load(open(os.path.join(out, 'parts.json')))
BG = np.array([191, 217, 230])
K = lambda k: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * k + 1, 2 * k + 1))
load = lambda p: np.array(Image.open(p).convert('RGB'))
fgof = lambda rgb: np.abs(rgb.astype(int) - BG).max(axis=2) > 24
def cells(rgb, minarea=20000):
    num, lab, st, cen = cv2.connectedComponentsWithStats(fgof(rgb).astype(np.uint8), 8)
    r = [(int(st[i, 0]), int(st[i, 1]), int(st[i, 2]), int(st[i, 3])) for i in range(1, num) if st[i, 4] >= minarea]
    r.sort(key=lambda c: (round(c[1] / 400), c[0])); return r
def register(sheetHead, bodyRgb, patch):
    """find scale and offset so that body = offset + scale * sheet, by matching the body's face patch in the sheet head"""
    x0, y0, x1, y1 = patch; tpl = cv2.cvtColor(bodyRgb[y0:y1, x0:x1].astype(np.uint8), cv2.COLOR_RGB2GRAY); best = None
    gray = cv2.cvtColor(sheetHead.astype(np.uint8), cv2.COLOR_RGB2GRAY)
    for sc in np.arange(0.36, 0.66, 0.004):
        small = cv2.resize(gray, None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA)
        if small.shape[0] <= tpl.shape[0] or small.shape[1] <= tpl.shape[1]: continue
        r = cv2.matchTemplate(small, tpl, cv2.TM_CCOEFF_NORMED); _, v, _, loc = cv2.minMaxLoc(r)
        if best is None or v > best[0]: best = (v, sc, x0 - loc[0], y0 - loc[1])
    return best
def put(name, rgba, x, y, extra=None):
    Image.fromarray(rgba, 'RGBA').save(os.path.join(out, name + '.png')); P[name] = dict(x=float(x), y=float(y), w=int(rgba.shape[1]), h=int(rgba.shape[0]), **(extra or {}))
def feather(mask, r): return cv2.GaussianBlur((mask * 255).astype(np.uint8), (0, 0), r)

views = {'front': '01_front', 'tq': '02_three_quarter_front', 'side': '03_side'}
facePatch = {'front': (425, 285, 605, 375), 'tq': (505, 285, 635, 375), 'side': (575, 290, 650, 380)}
nEyes = {'front': 2, 'tq': 2, 'side': 1}
bodyEyes = {'front': [(463, 331), (566, 331)], 'tq': [(536, 330), (608, 329)], 'side': [(605, 331)]}   # measured on the body views
bodyRgb = {v: load(os.path.join(body, f + '.png')) for v, f in views.items()}

# ---------- mouths: nine identical heads that differ only at the mouth ----------
m = load(os.path.join(full, '07_mouths.png')); cs = cells(m); assert len(cs) == 9, len(cs)
heads = [m[y:y + h, x:x + w].astype(int) for x, y, w, h in cs]; w0, h0 = cs[0][2], cs[0][3]
diff = np.zeros((h0, w0), bool)
for hd in heads[1:]: diff |= np.abs(hd - heads[0]).max(axis=2) > 18
diff[: int(h0 * 0.45)] = False; ys, xs = np.where(cv2.morphologyEx(diff.astype(np.uint8), cv2.MORPH_OPEN, K(2)) > 0)
mx0, mx1, my0, my1 = xs.min() - 14, xs.max() + 15, ys.min() - 14, ys.max() + 15
score, sc, ox, oy = register(heads[0], bodyRgb['front'], facePatch['front'])
print('mouth sheet -> body: scale %.3f offset (%.0f, %.0f) match %.2f' % (sc, ox, oy, score), 'mouth box', (int(mx0), int(my0), int(mx1), int(my1)))
skinc = np.median(heads[0][my0:my1, mx0:mx1].reshape(-1, 3), axis=0); ph, pw = my1 - my0, mx1 - mx0
for i, hd in enumerate(heads):
    sub = hd[my0:my1, mx0:mx1]; non = (np.abs(sub - skinc).max(axis=2) > 34).astype(np.uint8)
    # keep only the mouth itself: shapes that reach the middle of the patch (the chin line near the edge is left out)
    num, lab, st, cen = cv2.connectedComponentsWithStats(non, 8); keep = np.zeros((ph, pw), bool)
    for j in range(1, num):
        x, y, w, h = st[j, :4]
        if x < pw * 0.72 and x + w > pw * 0.28 and y < ph * 0.62 and y + h > ph * 0.12 and st[j, 4] > 12: keep |= lab == j
    al = feather(cv2.dilate(keep.astype(np.uint8), K(5)) > 0, 2.2)
    patch = np.dstack([sub.astype(np.uint8), al]); nw, nh = round(pw * sc), round(ph * sc)
    put('mouth_%d' % i, np.array(Image.fromarray(patch, 'RGBA').resize((nw, nh), Image.LANCZOS)), ox + sc * mx0, oy + sc * my0)
P['_mouth'] = dict(cx=ox + sc * (mx0 + mx1) / 2, cy=oy + sc * (my0 + my1) / 2)

# ---------- closed eyes: bottom row of the heads sheet, registered to the open heads above ----------
hs = load(os.path.join(full, '06_heads.png')); hc = cells(hs); assert len(hc) == 6, len(hc)
for col, vn in enumerate(['front', 'tq', 'side']):
    ox0, oy0, ow, oh = hc[col]; cx0, cy0, cw, ch = hc[col + 3]
    openH = hs[oy0:oy0 + oh, ox0:ox0 + ow]; closedH = hs[cy0:cy0 + ch, cx0:cx0 + cw]
    score0, s2, rx0, ry0 = register(openH, bodyRgb[vn], facePatch[vn]); be = bodyEyes[vn]
    pe = [((a - rx0) / s2, (b - ry0) / s2) for a, b in be]
    ey = int(np.mean([b for a, b in pe])); ex = int(np.mean([a for a, b in pe])); tw = int(ow * 0.16)
    tpl = openH[ey + int(oh * 0.07):ey + int(oh * 0.2), ex - tw:ex + tw].astype(np.uint8)
    res = cv2.matchTemplate(closedH[ey:ey + int(oh * 0.3), max(0, ex - 2 * tw):ex + 2 * tw].astype(np.uint8), tpl, cv2.TM_CCOEFF_NORMED); _, score, _, loc = cv2.minMaxLoc(res)
    dx = loc[0] + max(0, ex - 2 * tw) - (ex - tw); dy = loc[1] + ey - (ey + int(oh * 0.07))
    print(vn, 'heads sheet -> body: scale %.3f match %.2f' % (s2, score0), 'closed-head offset', (dx, dy), 'match %.2f' % score)
    for i, (px, py) in enumerate(pe):
        rx, ry = int(42 / s2), int(42 / s2)
        if (vn == 'tq' and i == 1) or vn == 'side': rx = int(22 / s2)
        rxr = int((24 if vn == 'side' else 16) / s2) if ((vn == 'tq' and i == 1) or vn == 'side') else rx      # stay clear of the face outline
        x0, x1, y0, y1 = int(px - rx), int(px + rxr), int(py - ry * 0.86), int(py + ry * 0.95)
        crop = closedH[y0 + dy:y1 + dy, x0 + dx:x1 + dx]; core = np.zeros((y1 - y0, x1 - x0), bool); core[9:-9, 9:-9] = True
        EY = {'front': [(22, 26), (22, 26)], 'tq': [(22, 26), (11, 24)], 'side': [(10, 25)]}[vn][i]
        nw, nh = round((x1 - x0) * s2), round((y1 - y0) * s2); X0, Y0 = be[i][0] - s2 * (px - x0), be[i][1] - s2 * (py - y0)
        small = np.array(Image.fromarray(crop.astype(np.uint8)).resize((nw, nh), Image.LANCZOS)).astype(float)
        bodyp = bodyRgb[vn][int(round(Y0)):int(round(Y0)) + nh, int(round(X0)):int(round(X0)) + nw].astype(float)
        yy2, xx2 = np.mgrid[0:nh, 0:nw]; ex, ey = be[i][0] - X0, be[i][1] - Y0
        ell = ((xx2 - ex) / (EY[0] + (13.0 if EY[0] > 15 else (13.0 if vn == 'side' else 7.0)))) ** 2 + ((yy2 - ey) / (EY[1] + 7.0)) ** 2
        both = (small.min(axis=2) > 120) & (bodyp.min(axis=2) > 120) & (small[..., 0] > 215) & (bodyp[..., 0] > 215) & (ell > 0.8) & (ell < 1.6)   # skin in both, around the eye
        if both.sum() > 40: small = np.clip(small + np.median(bodyp[both] - small[both], axis=0), 0, 255)
        al = cv2.GaussianBlur(((ell < 1.0) * 255).astype(np.uint8), (0, 0), 2.2)
        P_rgba = np.dstack([small.astype(np.uint8), al])
        put('%s_blink%d' % (vn, i), P_rgba, X0, Y0)

# ---------- hands: right hand in six poses (the rod-grip drawing is skipped, the fist stands in for it) ----------
hd = load(os.path.join(full, '08_hands.png')); hcells = cells(hd); names = ['palm', 'back', 'relaxed', 'fist', 'point', 'thumb']
palmH = hcells[0][3]; HS = 0.3      # stored at 30 % of sheet size
for nm, (x, y, w, h) in zip(names, hcells[:6]):
    sub = hd[y - 4:y + h + 4, x - 4:x + w + 4]; a = feather(fgof(sub), 0.8).astype(np.float32)
    ramp = np.clip((np.arange(max(sub.shape[:2])) - 10) / 26.0, 0, 1)      # fade the cut end of the wrist into the drawn arm
    if nm in ('palm', 'back'): a *= ramp[:sub.shape[0]][::-1][:, None]
    else: a *= ramp[:sub.shape[1]][None, :]
    a = a.astype(np.uint8); im = Image.fromarray(np.dstack([sub, a]), 'RGBA').resize((round(sub.shape[1] * HS), round(sub.shape[0] * HS)), Image.LANCZOS)
    f = fgof(sub)
    if nm in ('palm', 'back'): rows = f[-int(h * 0.08) - 4:-4]; ax = float(np.where(rows.any(axis=0))[0].mean()); ay = sub.shape[0] - 4 - h * 0.09; fwd = [0, -1]
    else: cols = f[:, 4:4 + int(w * 0.08)]; ay = float(np.where(cols.any(axis=1))[0].mean()); ax = 4 + w * 0.09; fwd = [1, 0]
    put('hand_' + nm, np.array(im), 0, 0, dict(ax=ax * HS, ay=ay * HS, fwd=fwd, ppm=palmH * HS / 0.108))

# ---------- satchel: bag body from the front drawing; the strap is drawn by the rig ----------
st = load(os.path.join(full, '09_satchel.png')); (bx, by, bw, bh) = cells(st, 200000)[0]; sub = st[by:by + bh, bx:bx + bw]; f = fgof(sub)
wrow = f.sum(axis=1); bodyrows = np.where(wrow > 0.6 * wrow.max())[0]; top = max(0, bodyrows.min() - int(bh * 0.045)); crop = sub[top:]; fm = f[top:]
num, lab, stt, cen = cv2.connectedComponentsWithStats(fm.astype(np.uint8), 8); big = lab == (1 + np.argmax(stt[1:, 4])); BS = 180 / bw
im = Image.fromarray(np.dstack([crop, feather(big, 0.8)]), 'RGBA').resize((round(crop.shape[1] * BS), round(crop.shape[0] * BS)), Image.LANCZOS)
put('satchel', np.array(im), 0, 0, dict(ax=im.width / 2, ay=im.height * 0.08, ppm=im.width / 0.15))
strap = sub[int(bh * 0.3):int(bh * 0.5)]; sm = fgof(strap) & (strap.max(axis=2) > 150); P['_colors']['strap'] = '#%02x%02x%02x' % tuple(int(v) for v in np.median(strap[sm], axis=0))
json.dump(P, open(os.path.join(out, 'parts.json'), 'w'))
print('strap', P['_colors']['strap'], 'new parts', sorted(k for k in P if k.startswith(('mouth_', 'hand_', 'satchel')) or 'blink' in k))
