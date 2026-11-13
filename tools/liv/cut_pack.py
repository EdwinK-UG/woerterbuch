"""Cut a generated rig pack (five body views on a flat background, arms held away from the body) into rig parts.
Usage: python cut_pack.py art/c01-pack out_dir
Per view: head, torso, sleeves, skirt, socks, boots, plus measured anchor points (shoulders, ankles, neck)."""
import sys, json, os
import numpy as np, cv2
from PIL import Image

src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
VIEWS = {'front': '01_front', 'tq': '02_three_quarter_front', 'side': '03_side', 'tqb': '04_three_quarter_back', 'back': '05_back'}
NSLEEVE = {'front': 2, 'tq': 2, 'side': 1, 'tqb': 2, 'back': 2}
WAIST, HEMPAD = 748, 14
EYES = {'front': [(463, 331), (566, 331)], 'tq': [(536, 330), (608, 329)], 'side': [(605, 331)]}   # eye centres, measured
MOUTH = {'front': (478, 384, 552, 412), 'tq': (546, 384, 606, 412), 'side': (602, 384, 628, 410)}   # drawn mouth, lifted off so the rig can speak
K = lambda k: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * k + 1, 2 * k + 1))
dil = lambda m, k: cv2.dilate(m.astype(np.uint8), K(k)) > 0
ero = lambda m, k: cv2.erode(m.astype(np.uint8), K(k)) > 0
def comps(m, minarea=200):
    num, lab, st, cen = cv2.connectedComponentsWithStats(m.astype(np.uint8), 8)
    r = [dict(m=lab == i, area=int(st[i, 4]), x=int(st[i, 0]), y=int(st[i, 1]), w=int(st[i, 2]), h=int(st[i, 3]), cx=float(cen[i][0]), cy=float(cen[i][1])) for i in range(1, num) if st[i, 4] >= minarea]
    r.sort(key=lambda c: -c['area']); return r
def fill_holes(m):
    H, W = m.shape; pad = cv2.copyMakeBorder(m.astype(np.uint8), 1, 1, 1, 1, cv2.BORDER_CONSTANT, value=0); mask = np.zeros((H + 4, W + 4), np.uint8); cv2.floodFill(pad, mask, (0, 0), 2); return pad[1:-1, 1:-1] != 2

parts, meta, colors, dbg = {}, {}, {}, []
for vn, fn in VIEWS.items():
    rgb = np.array(Image.open(os.path.join(src, fn + '.png')).convert('RGB')); H, W = rgb.shape[:2]
    R, G, B = [rgb[..., i].astype(np.int32) for i in range(3)]
    mx, mn = np.maximum(np.maximum(R, G), B), np.minimum(np.minimum(R, G), B); sat = (mx - mn) / np.maximum(mx, 1); val = mx / 255.0
    hue = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)[..., 0].astype(np.int32) * 2
    yy, xx = np.mgrid[0:H, 0:W]
    rgb0 = rgb.copy()
    fg = np.abs(rgb.astype(np.int32) - np.array([191, 217, 230])).max(axis=2) > 24; fg = fill_holes(comps(fg, 2000)[0]['m'])
    # skin and the cream cloth are close in this art: skin is the more orange of the two (less green)
    skin = fg & (hue >= 10) & (hue <= 36) & (sat > 0.43) & (val > 0.82) & (G <= 198) & (R > 200)
    cream = fg & (val > 0.9) & (G >= 201) & (sat < 0.46) & (sat > 0.2); dark = val < 0.42
    redm = fg & ((hue < 14) | (hue > 340)) & (sat > 0.55) & (val > 0.45)
    hem = int(np.where(redm.sum(axis=1) > 20)[0].max())
    w = fg.sum(axis=1); neck = 400 + int(np.argmin(w[400:560])); ncx = float(np.where(fg[neck])[0].mean())
    def save(name, m, extra=None):
        ys, xs = np.where(m)
        if not len(xs): return None
        x0, x1, y0, y1 = max(0, xs.min() - 2), min(W, xs.max() + 3), max(0, ys.min() - 2), min(H, ys.max() + 3)
        a = cv2.GaussianBlur((m[y0:y1, x0:x1] * 255).astype(np.uint8), (0, 0), 0.6)
        Image.fromarray(np.dstack([rgb[y0:y1, x0:x1], a]), 'RGBA').save(os.path.join(out, vn + '_' + name + '.png'))
        parts[vn + '_' + name] = dict(x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0)); return parts[vn + '_' + name]
    # limbs: bare arms between shoulder and hem, bare legs under the hem. They are dropped, the rig draws them.
    def limb(band):
        core = skin & band & ~ero(fg, 0) | (skin & band); core = cv2.morphologyEx(core.astype(np.uint8), cv2.MORPH_OPEN, K(2)) > 0
        return [c for c in comps(core, 900)]
    arms = [c for c in limb((yy > neck + 30) & (yy < hem - 120)) if c['area'] > 6000]
    legs = limb(yy > hem - 30)
    limbs = np.zeros_like(fg)
    for c in arms + legs: limbs |= c['m']
    limbs = dil(limbs, 5) & fg & (skin | dark | dil(limbs, 2))
    body = fg & ~limbs
    # sleeves: the big cream shapes at shoulder height (not the small neckline piece in the middle)
    cand = [c for c in comps(cream & body & (yy > neck) & (yy < 690) & ~dil(skin & (yy < neck + 40), 3), 1200) if not (abs(c['cx'] - ncx) < 60 and c['area'] < 4500)]
    cand = sorted(cand[:NSLEEVE[vn]], key=lambda c: c['cx']); sleeves = np.zeros_like(fg); V = dict(neck=[round(ncx), neck], hem=hem)
    arms.sort(key=lambda c: c['cx']); 0 and print(vn, 'neck', neck, 'hem', hem, 'arms', [(round(a['cx']), round(a['cy']), a['area']) for a in arms], 'legs', len(legs), 'sleeves', [(round(c['cx']), round(c['cy']), c['area']) for c in cand])
    for i, c in enumerate(cand):
        key = 'A' if (len(cand) == 2 and i == 0) or (len(cand) == 1 and (vn == 'side' or c['cx'] < ncx)) else 'B'
        # the whole sleeve: puff, gathered folds and the cuff band (other cream pieces right next to the puff)
        grp = c['m'].copy(); near = dil(c['m'], 16)
        for o in comps(cream & body & (yy > neck) & (yy < 720), 60):
            if abs(o['cx'] - ncx) > 60 and (o['m'] & near).any(): grp |= o['m']
        solid = cv2.morphologyEx(grp.astype(np.uint8), cv2.MORPH_CLOSE, K(11)) > 0
        m = fill_holes((solid | (dil(solid, 5) & dark)) & body & ~redm & (yy > neck - 6)); m = comps(m, 200)[0]['m']; sleeves |= m; save('sleeve' + key, m)
        arm = min(arms, key=lambda a: abs(a['cx'] - c['cx']) + abs(a['cy'] - c['cy'])) if arms else None
        if arm:
            ay, ax = np.where(arm['m']); pts = np.stack([ax, ay], 1).astype(np.float64); cen = pts.mean(axis=0)
            d = np.linalg.svd(pts - cen, full_matrices=False)[2][0]; d = d if np.dot(d, cen - np.array([ncx, neck])) > 0 else -d; perp = np.array([-d[1], d[0]])
            sy, sx = np.where(m); st = (np.stack([sx, sy], 1) - cen) @ d; t0, t1 = st.min(), st.max()
            at = (pts - cen) @ d; nearCuff = pts[at < at.min() + 0.2 * (at.max() - at.min())]; wdt = np.ptp((nearCuff - cen) @ perp)
            piv = cen + d * (t0 + 0.27 * (t1 - t0)); V[key] = dict(sh=[round(piv[0]), round(piv[1])], dir=[round(d[0] * 100), round(d[1] * 100)], armW=round(float(wdt), 1))
        else: V[key] = dict(sh=[round(c['cx']), round(c['y'] + c['h'] * 0.4)], dir=[0, 60])
    if vn in MOUTH:
        a0, b0, a1, b1 = MOUTH[vn]; mm = (xx >= a0) & (xx <= a1) & (yy >= b0) & (yy <= b1) & body; save('mouth', mm & dil(mm & (val < 0.62), 2)); rgb = cv2.inpaint(rgb.astype(np.uint8), (dil(mm, 1) * 255).astype(np.uint8), 5, cv2.INPAINT_TELEA)
    for i, (ex, ey) in enumerate(EYES.get(vn, [])):
        hw = 30 if (vn == 'side' or (vn == 'tq' and i == 1)) else 54; bx0, bx1, by0, by1 = ex - hw, ex + hw, ey - 82, ey - 30
        num, lab, st, cen = cv2.connectedComponentsWithStats(((val < 0.5) & body)[by0:by1, bx0:bx1].astype(np.uint8), 8)
        ok = [j for j in range(1, num) if st[j, 4] > 50 and st[j, 0] > 0 and st[j, 1] > 0 and st[j, 0] + st[j, 2] < bx1 - bx0 and st[j, 1] + st[j, 3] < by1 - by0]
        if not ok: continue
        j = max(ok, key=lambda q: st[q, 4]); bm = np.zeros_like(body); bm[by0:by1, bx0:bx1] = lab == j; bm = dil(bm, 2)
        pb = save('brow%d' % i, bm); box = np.zeros_like(body); box[by0:by1, bx0:bx1] = True; rgb = rgb.copy(); rgb[dil(bm, 2)] = np.median(rgb[box & skin & ~dil(bm, 4)], axis=0).astype(np.uint8); rgb = cv2.blur(rgb, (5, 5)) * dil(bm, 5)[..., None] + rgb * (~dil(bm, 5))[..., None]; rgb = rgb.astype(np.uint8)
    lab = cv2.connectedComponents((skin & (yy > neck - 60) & (yy < neck + 24)).astype(np.uint8), connectivity=8)[1]; sy = neck - 8
    while sy > neck - 50 and not lab[sy, int(ncx)]: sy -= 2
    neckskin = (lab == lab[sy, int(ncx)]) & (lab > 0) & (yy >= neck - 2)
    save('head', (body & (yy < neck)) | (dil(neckskin, 3) & body & (skin | dark) & (yy < neck + 24)))
    # The torso keeps only what is certainly torso: the red bodice, the neck and blouse inside the neckline, and the
    # waistband. Every trace of a sleeve is dropped, and where a sleeve hid the bodice the bodice is continued in red,
    # because the rig draws the sleeves itself on top.
    armsM = np.zeros_like(fg)
    for a_ in arms: armsM |= a_['m']
    armsM = dil(armsM, 6)
    band = body & (yy >= neck - 12) & (yy < WAIST + 14); rr = redm & band & (yy < WAIST - 4); low = yy > WAIST - 40
    cnt = rr.sum(axis=1); rows = np.where(cnt > max(10, 0.35 * cnt.max()))[0]; inR = np.zeros_like(fg); first = rows.min(); last = rows.max()
    # side lines of the torso, from the top of the bodice to the waistband: they stand in for a bodice edge that a sleeve covered
    top = [np.where(rr[y])[0] for y in range(first, first + 14)]; wy = WAIST - 30; row = (body[wy] & ~dil(sleeves, 6)[wy]).astype(np.uint8); lab1 = cv2.connectedComponents(row.reshape(1, -1), connectivity=4)[1][0]; cxi = int(ncx)
    while not lab1[cxi] and cxi < W - 1: cxi += 1
    wx = np.where(lab1 == lab1[cxi])[0]   # the waist itself, not an arm passing at that height
    xlt, xrt = min(t.min() for t in top if len(t)), max(t.max() for t in top if len(t)); xlb, xrb = wx.min(), wx.max()
    for y in range(neck - 12, WAIST + 14):
        ry = min(max(y, first), last); ry = rows[np.argmin(np.abs(rows - ry))]; xs = np.where(rr[ry])[0]; k = np.clip((y - first) / max(1, wy - first), 0, 1)
        inR[y, max(0, int(min(xs.min(), xlt + (xlb - xlt) * k)) - 4):int(max(xs.max(), xrt + (xrb - xrt) * k)) + 5] = True
    free = cv2.erode((band & ~redm & ~(yy > WAIST - 12)).astype(np.uint8), K(2)); lab = cv2.connectedComponents(free, connectivity=4)[1]; sy = neck - 6
    while sy < neck + 30 and not lab[sy, int(ncx)]: sy += 1
    central = dil(lab == lab[sy, int(ncx)], 3) & band & ~redm if lab[sy, int(ncx)] else np.zeros_like(fg)
    central &= inR
    keep = band & ((rr | (dil(rr, 4) & dark) | central) & inR | (low & ~dil(sleeves, 4)))
    fill = fg & inR & ~keep & (yy >= first) & ~low & ~armsM
    torso = keep | fill; rgb = rgb.copy(); rgb[fill] = np.median(rgb[rr], axis=0).astype(np.uint8)
    up_ = torso & ~low; up_ = cv2.morphologyEx(up_.astype(np.uint8), cv2.MORPH_OPEN, K(7)) > 0          # no thin tabs at the armholes
    torso = up_ | (torso & low); torso = cv2.GaussianBlur(torso.astype(np.float32), (0, 0), 2.2) > 0.5
    torso = comps(torso, 500)[0]['m']; newpx = torso & ~keep; rgb[newpx & ~fill] = np.median(rgb[rr], axis=0).astype(np.uint8)
    rim = dil(newpx, 2) & torso & ~ero(torso, 3) & ~low; rgb[rim] = (58, 28, 12)
    save('torso', torso)
    sk = body & (yy >= WAIST - 14) & (yy < hem + HEMPAD) & ~sleeves; sk = comps(dil(ero(sk, 2), 2) & sk, 500)[0]['m']; p = save('skirt', sk)
    p['rows'] = [[int(np.where(sk[y])[0].min()), int(np.where(sk[y])[0].max())] if sk[y].any() else None for y in range(p['y'], p['y'] + p['h'])]
    # feet: sock = cream cuff, boot = everything below it
    low = body & (yy > hem + 40); feet = comps(dil(ero(low, 1), 1) & low, 1500)[:2]; feet.sort(key=lambda c: c['cx'])
    if len(feet) == 1 and feet[0]['w'] > 230:   # the two feet touch: split between the two sock tops
        tops = np.where(feet[0]['m'][feet[0]['y'] + 12])[0]; gap = int(np.median(tops)); feet = [dict(m=feet[0]['m'] & (xx < gap)), dict(m=feet[0]['m'] & (xx >= gap))]
    for i, c in enumerate(feet):
        key = 'AB'[i]; m = c['m']; ys = np.where(m.any(axis=1))[0]; top = ys.min()
        sockrows = [y for y in range(top, top + 110) if (cream & m)[y].sum() > 0.45 * m[y].sum()]; cut = (max(sockrows) if sockrows else top + 55) + 3
        save('sock' + key, m & (yy <= cut + 4)); save('boot' + key, m & (yy > cut - 6))
        shaft = np.where(m[cut:cut + 60].any(axis=0))[0]
        V.setdefault(key, {}); V[key]['ankle'] = [round(float(shaft.mean())), round(cut + 0.42 * (ys.max() - cut))]; V[key]['sockTop'] = [round(float(np.where(m[top + 6])[0].mean())), int(top + 6)]
    if vn == 'side': V['edge'] = dict(y0=360, xs=[int(np.where(fg[y])[0].max()) for y in range(360, 450)])   # face profile, for the open mouth
    meta[vn] = V
    if vn == 'front':
        px = lambda m: ('#%02x%02x%02x' % tuple(int(v) for v in np.median(rgb[m], axis=0))) if m.any() else '#f9c896'
        colors.update(skin=px(skin & (yy > hem + 20)), skinArm=px(skin & (yy > neck + 60) & (yy < hem - 150)), blouse='#%02x%02x%02x' % tuple(int(v) for v in np.median(rgb0[sleeves & cream], axis=0)), ink='#3a1c0c', lid=px(skin & (yy > 230) & (yy < 300)), mouthIn='#8c3a2c', tongue='#e07a66')
    t = rgb.copy().astype(np.float32); t[limbs] = t[limbs] * 0.35 + np.array((0, 90, 255)) * 0.65; t[sleeves] = t[sleeves] * 0.5 + np.array((255, 230, 0)) * 0.5
    for key in 'AB':
        if key in V:
            for nm in ('sh', 'ankle', 'sockTop'):
                if nm in V[key]: cv2.circle(t, tuple(int(v) for v in V[key][nm]), 9, (0, 255, 0), -1)
    cv2.circle(t, (int(ncx), neck), 9, (255, 0, 255), -1); dbg.append(Image.fromarray(t.astype(np.uint8)).resize((512, 768)))
parts['_colors'] = colors; parts['_meta'] = meta
json.dump(parts, open(os.path.join(out, 'parts.json'), 'w'))
sh = Image.new('RGB', (512 * 5, 768)); [sh.paste(d, (i * 512, 0)) for i, d in enumerate(dbg)]; sh.save(os.path.join(out, 'debug.png'))
print({k: {a: v[a] for a in 'AB' if a in v} for k, v in meta.items()}); print(colors); print(sorted(k for k in parts if k[0] != '_'))
