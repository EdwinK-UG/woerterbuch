"""Cut the owner's painted hand-parts sheet into rig pieces.

    python3 tools/liv/rive/hands/cut_hand_sheet.py

In : source/C01_right_hand_cutout_parts_4096x2048.png (22 closed-outline pieces, 2 rows: back of a RIGHT hand on top,
     palm side below; per row: palm, index/middle/ring/little as tip + base, thumb as tip + base tilted 30 deg up-left).
Out: pieces/native/<side>_<piece>.png   tight RGBA at the sheet's resolution (outer edge antialiased)
     pieces/rig/<side>_<piece>.png      the same, scaled to RIG_S of the sheet (what the Rive rig loads)
     pieces/pieces.json                 per piece: size, bbox on the sheet, measured pivots (native px, piece frame)
     pieces/check_*.png                 3x crops for checking the cut by eye

Cleaning (all measured from the pixels):
* the sheet's palette was snapped to four colours, so the antialiasing became a skin-coloured fringe OUTSIDE the ink
  and white specks inside. A piece is the region enclosed by its ink (ink mask, holes filled); the fringe is outside
  it and dropped; specks inside are filled from their neighbours. The outer edge gets a soft alpha (1.2 px blur of the
  mask, outward only), the interior stays fully opaque.
* the outline is thickened outward by GROW px so that, at the rig's scale, it matches the weight of the pack's
  painted hands (about 2 view px) instead of 0.8 px.
* palm pieces: the ink across the wrist cut-off is removed (the forearm is drawn under the hand there).
* palm-side tips: the dorsal nail is removed (nail interior and nail line painted skin, outer outline kept).
* palm-side thumb pieces are mirrored (the sheet draws them tilted up-left like the back row, but on the palm side
  the thumb sits on the viewer's right).
"""
from pathlib import Path
import json, math
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

HERE = Path(__file__).resolve().parent
SRC = HERE / 'source' / 'C01_right_hand_cutout_parts_4096x2048.png'
OUT = HERE / 'pieces'
INK, SKIN, SHADE = (0x3a, 0x1c, 0x0c), (0xfd, 0xc2, 0x8d), (0xf0, 0xa5, 0x6e)
GROW = 19            # native px added to the outer outline (the sheet's line is about 10 px)
RIG_S = 0.112        # rig pictures: the stage scale on a 2x screen (0.084 view x 0.62 stage x 2); see docs (Rive blurs minified images near 90 deg)
PADN = 30            # native px of transparent margin around every piece (3 rig px)
FIN_SY = 1.02        # the rig lengthens the finger pieces to this (they are short against the palm)
FINGERS = ['index', 'middle', 'ring', 'pinky']
FIN_SX = .93         # the rig narrows the finger pieces to this (the sheet's fingers are too wide for its palm)
ROOT_DEPTH = .80     # the rig puts a base piece's root end this many (narrowed) finger widths below its knuckle top


def color_mask(a, c, tol=40):
    return np.abs(a.astype(int) - np.array(c)).sum(-1) < tol


def shrink(img, bx, by):
    """Resize with premultiplied alpha (no colour bleeding from transparent pixels)."""
    size = (max(1, round(img.width * bx)), max(1, round(img.height * by)))
    return img.convert('RGBa').resize(size, Image.LANCZOS).convert('RGBA')


def square(img):
    """Pad (right / bottom, so the top-left origin stays) to a square canvas. Rive's renderer picks an image's mip
    level from the axis-aligned bounds of the drawn picture: a tall picture turned near 90 degrees is then sampled
    from a much smaller mip and comes out smeared. A square canvas keeps that ratio at 1 for every angle."""
    n = max(img.size)
    out = Image.new('RGBA', (n, n), (0, 0, 0, 0)); out.paste(img, (0, 0))
    return out


def principal(mask):
    ys, xs = np.nonzero(mask)
    c = np.array([xs.mean(), ys.mean()])
    cov = np.cov(np.stack([xs - c[0], ys - c[1]]))
    w, v = np.linalg.eigh(cov)
    u = v[:, np.argmax(w)]
    if u[1] > 0: u = -u                                   # point "up" (toward the fingertip)
    return c, u


def capsule_pivots(mask):
    """For an elongated piece: axis, length, width, centre of the base cap and of the tip cap (piece pixel frame)."""
    c, u = principal(mask)
    n = np.array([-u[1], u[0]])
    ys, xs = np.nonzero(mask)
    p = np.stack([xs, ys], 1) - c
    t = p @ u; s = p @ n
    t0, t1 = t.min(), t.max()
    mid = np.abs(t - (t0 + t1) / 2) < (t1 - t0) * .2
    width = np.percentile(s[mid], 99.5) - np.percentile(s[mid], .5)
    def centre_at(tt):
        band = np.abs(t - tt) < 3
        sc = (s[band].max() + s[band].min()) / 2 if band.any() else 0
        return c + u * tt + n * sc
    def width_at(tt):
        band = np.abs(t - tt) < 4
        return (s[band].max() - s[band].min()) if band.any() else width
    L = t1 - t0
    wb, wt = width_at(t0 + .14 * L), width_at(t1 - .14 * L)      # each end's own width: its cap radius
    base = centre_at(t0 + wb / 2); tip = centre_at(t1 - wt / 2)
    return {'axis': [float(u[0]), float(u[1])], 'length': float(t1 - t0), 'width': float(width),
            'baseWidth': float(wb), 'tipWidth': float(wt),
            'base': [float(base[0]), float(base[1])], 'tip': [float(tip[0]), float(tip[1])],
            'baseEnd': [float((c + u * t0)[0]), float((c + u * t0)[1])], 'tipEnd': [float((c + u * t1)[0]), float((c + u * t1)[1])]}


def clean_piece(rgb, ink_line):
    """rgb: crop of the sheet; returns (RGBA float image, interior mask, ink thickness)."""
    ink = color_mask(rgb, INK)
    ink = ndi.binary_closing(ink, iterations=2)
    inside = ndi.binary_fill_holes(ink)
    lab, n = ndi.label(inside)
    if n > 1:
        sizes = ndi.sum(inside, lab, range(1, n + 1)); inside = lab == (1 + int(np.argmax(sizes)))
    # interior colours: specks (white or anything off-palette) take the most common colour around them
    out = rgb.copy()
    known = color_mask(rgb, INK) | color_mask(rgb, SKIN) | color_mask(rgb, SHADE)
    bad = inside & ~known
    if bad.any():
        idx = ndi.distance_transform_edt(bad | ~inside, return_distances=False, return_indices=True)
        out[bad] = out[idx[0][bad], idx[1][bad]]
    # thicken the outline outward
    grown = ndi.distance_transform_edt(~inside) <= GROW if GROW else inside      # round growth (a disk, not a diamond)
    out[grown & ~inside] = INK
    # the inner antialiasing of the original line was snapped to skin: a light hairline inside the ink. Ink again.
    band = inside & (ndi.distance_transform_edt(inside) <= 6)
    out[band] = INK
    # soft outer edge: blur the mask a little, but never below 1 inside the piece
    m = Image.fromarray((grown * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    alpha = np.maximum(np.asarray(m, float) / 255, grown * 1.0)
    alpha = np.where(grown, 1.0, np.clip((alpha - .5) * 2, 0, 1))      # outward band only
    rgba = np.dstack([out.astype(float), alpha * 255])
    return rgba, grown, inside


def remove_wrist_line(rgba, inside):
    """The flat wrist cut-off: the hand must end in plain skin over the forearm, with no ink line and no notch.
    Every ink pixel of the bottom band between the two side outlines becomes skin (or shade where the shade stripe
    runs), the picture is cut straight across above the old line, and the last rows fade out in skin colour.
    Returns the info and a mask of the faded band (its colour must stay skin, not ink)."""
    h, w = inside.shape
    rows = np.nonzero(inside.any(1))[0]; yb = rows.max()
    rgb = rgba[..., :3].astype(np.uint8)
    ink = color_mask(rgb, INK)
    line = 10 + GROW                                          # the (thickened) wrist line
    cut = yb - line - 6
    band_top = cut - 70
    fade_rows = 22
    keep = np.zeros((h, w), bool)
    for y in range(band_top, yb + 1):
        xs = np.nonzero(inside[y])[0]
        if len(xs) == 0: continue
        # the side outlines at this height: the ink runs touching the outside on the left and on the right
        xl, xr = xs.min(), xs.max()
        l = xl
        while l < xr and ink[y, l]: l += 1
        r = xr
        while r > xl and ink[y, r]: r -= 1
        for x in range(l, r + 1):
            if ink[y, x]:
                up = y
                while up > band_top - 40 and ink[up, x]: up -= 1
                rgba[y, x, :3] = SHADE if color_mask(rgba[up, x, :3].astype(np.uint8)[None], SHADE)[0] else SKIN
    rgba[cut:, :, 3] = 0
    for i in range(1, fade_rows + 1):
        rgba[cut - i, :, 3] *= (i / fade_rows) ** 1.3
        keep[cut - i, :] = rgba[cut - i, :, 3] > 0
    return {'wristCut': int(cut)}, keep


def shade_piece(rgba, kind, side):
    """The pack's soft shade (#F0A56E at low strength), painted by formula on the skin of a piece (ink untouched):
    finger pieces darken toward their left edge (where the sheet's tips already carry a shade stripe) and toward the
    root; the palm gets a soft band under the knuckles (where the fingers start) and along the outer edge; the thumb
    toward its root. Strength 0.45 at most: the look stays the sheet's flat colours."""
    a = rgba[..., 3] >= 254
    rgb = rgba[..., :3]
    skin = a & ~color_mask(rgb.astype(np.uint8), INK, 60)
    if not skin.any(): return
    h, w = skin.shape
    din = ndi.distance_transform_edt(skin)                     # distance to the outline (inside the skin)
    wgt = np.zeros((h, w))
    ys, xs = np.nonzero(skin)
    if kind in ('base', 'tip'):
        x0 = np.array([np.nonzero(skin[y])[0].min() if skin[y].any() else 0 for y in range(h)])
        x1 = np.array([np.nonzero(skin[y])[0].max() if skin[y].any() else w for y in range(h)])
        u = (np.arange(w)[None, :] - x0[:, None]) / np.maximum(1, (x1 - x0)[:, None])
        wgt += .42 * np.clip(1 - u / .34, 0, 1) ** 1.6                # left side: the gap to the next finger
        wgt += .16 * np.clip(1 - (1 - u) / .14, 0, 1)                 # a thin rim on the right
        if kind == 'base':
            v = np.arange(h)[:, None] / h                              # 1 at the root end (bottom)
            wgt += .30 * np.clip((v - .72) / .28, 0, 1) ** 1.5         # where the finger goes under the knuckles
    elif kind == 'palm':
        top = np.array([np.nonzero(skin[:, x])[0].min() if skin[:, x].any() else h for x in range(w)])
        dy = np.arange(h)[:, None] - top[None, :]
        wgt += .28 * np.exp(-(dy - 55) ** 2 / (2 * 38.0 ** 2))       # under the knuckles: the fingers' roots
        wgt += .30 * np.clip(1 - din / 70.0, 0, 1) ** 1.4             # rounding toward the outline
    elif kind == 'thumb':
        wgt += .32 * np.clip(1 - din / 60.0, 0, 1) ** 1.3
    wgt = ndi.gaussian_filter(wgt, 6) * skin
    wgt = np.clip(wgt, 0, .45)
    for c in range(3):
        rgb[..., c] = np.where(skin, rgb[..., c] * (1 - wgt) + SHADE[c] * wgt, rgb[..., c])


def remove_nail(rgba, inside, line):
    """Palm-side tip: nail interior (a skin island enclosed by ink in the upper part) and its ink line become skin;
    the outer outline (within `line` px of the outside) stays."""
    rgb = rgba[..., :3].astype(np.uint8)
    skin = (color_mask(rgb, SKIN) | color_mask(rgb, SHADE)) & inside
    lab, n = ndi.label(skin)
    sizes = ndi.sum(skin, lab, range(1, n + 1))
    main = 1 + int(np.argmax(sizes))
    nail = np.zeros_like(skin)
    for i in range(1, n + 1):
        if i == main or sizes[i - 1] < 40: continue
        ys = np.nonzero(lab == i)[0]
        if ys.mean() < inside.shape[0] * .5: nail |= lab == i
    if not nail.any(): return 0
    outer = ndi.distance_transform_edt(rgba[..., 3] > 127) <= line
    near = ndi.binary_dilation(nail, iterations=int(line * 1.6))
    ink = color_mask(rgb, INK)
    near2 = ndi.binary_dilation(nail, iterations=16)
    paint = (nail | (near & ink) | (near2 & color_mask(rgb, SHADE))) & ~outer
    rgba[paint, :3] = SKIN
    # specks left between the nail line and the outer line
    rgba[ndi.binary_closing(paint, iterations=2) & ~outer & (rgba[..., 3] > 0), :3] = SKIN
    return int(nail.sum())


def main():
    sheet = np.asarray(Image.open(SRC).convert('RGB'))
    nonwhite = np.abs(sheet.astype(int) - 255).sum(-1) > 30
    lab, n = ndi.label(nonwhite, structure=np.ones((3, 3)))
    objs = ndi.find_objects(lab)
    sizes = ndi.sum(nonwhite, lab, range(1, n + 1))
    comps = [(i + 1, objs[i]) for i in range(n) if sizes[i] > 2000]
    assert len(comps) == 22, f'{len(comps)} pieces found'
    H = sheet.shape[0]
    rows = {'back': [c for c in comps if (c[1][0].start + c[1][0].stop) / 2 < H / 2],
            'palm': [c for c in comps if (c[1][0].start + c[1][0].stop) / 2 >= H / 2]}
    (OUT / 'native').mkdir(parents=True, exist_ok=True); (OUT / 'rig').mkdir(exist_ok=True)
    meta = {'_meta': {'source': SRC.name, 'grow': GROW, 'rigScale': RIG_S, 'fingerScaleX': FIN_SX, 'fingerScaleY': FIN_SY, 'rootDepth': ROOT_DEPTH,
                      'note': 'pivots in native px of each piece (x right, y down); rig pictures are RIG_S of that'}}
    for side, cs in rows.items():
        cs = sorted(cs, key=lambda c: (c[1][1].start + c[1][1].stop) / 2)
        palm = cs[0]; rest = cs[1:]
        # group the remaining 10 by x: pairs (tip above base)
        pairs = [rest[i:i + 2] for i in range(0, 10, 2)]
        named = [('palm', palm)]
        for name, pr in zip(FINGERS + ['thumb'], pairs):
            pr = sorted(pr, key=lambda c: (c[1][0].start + c[1][0].stop) / 2)
            if name == 'thumb':                            # tip is the smaller one
                pr = sorted(pr, key=lambda c: sizes[c[0] - 1])
            named += [(name + '_tip', pr[0]), (name + '_base', pr[1])]
        for name, (li, sl) in named:
            pad = GROW + 6
            y0, y1 = max(0, sl[0].start - pad), min(H, sl[0].stop + pad)
            x0, x1 = max(0, sl[1].start - pad), min(sheet.shape[1], sl[1].stop + pad)
            crop = sheet[y0:y1, x0:x1].copy()
            mine = lab[y0:y1, x0:x1] == li
            crop[~ndi.binary_dilation(mine, iterations=3)] = 255
            rgba, grown, inside = clean_piece(crop, 10)
            info = {}
            wrist_keep = None
            if name == 'palm':
                wi, wrist_keep = remove_wrist_line(rgba, grown); info.update(wi)
            if side == 'palm' and name.endswith('_tip'):
                info['nailPixels'] = remove_nail(rgba, grown, GROW + 11)
            shade_piece(rgba, 'palm' if name == 'palm' else ('thumb' if name.startswith('thumb') else name.split('_')[1]), side)
            if side == 'palm' and name.startswith('thumb'):
                rgba = rgba[:, ::-1].copy(); grown = grown[:, ::-1].copy()
                info['mirrored'] = True
            # tight crop to alpha
            a = rgba[..., 3] > 0
            ys, xs = np.nonzero(a); ty0, ty1, tx0, tx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
            rgba = rgba[ty0:ty1, tx0:tx1]; grown = grown[ty0:ty1, tx0:tx1]
            if wrist_keep is not None: wrist_keep = np.pad(wrist_keep[ty0:ty1, tx0:tx1], PADN)
            # a transparent margin (so no edge pixel sits on the texture border) and ink colour under the soft edge
            # (so bilinear sampling never pulls in the white of the sheet)
            rgba = np.pad(rgba, ((PADN, PADN), (PADN, PADN), (0, 0))); grown = np.pad(grown, PADN)
            soft = rgba[..., 3] < 255
            if wrist_keep is not None: soft &= ~wrist_keep                 # the faded wrist stays skin coloured
            rgba[soft, :3] = INK
            tx0 -= PADN; ty0 -= PADN
            img = Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA')
            img.save(OUT / 'native' / f'{side}_{name}.png')
            # finger pictures are baked at the rig's narrower, longer proportions: Rive then draws every picture at
            # one uniform scale (a strongly anisotropic image scale blurs in the runtime's sampling)
            bx, by = (RIG_S * FIN_SX, RIG_S * FIN_SY) if name.split('_')[0] in FINGERS else (RIG_S, RIG_S)
            small = shrink(img, bx, by)
            square(small).save(OUT / 'rig' / f'{side}_{name}.png')
            d = {'w': img.width, 'h': img.height, 'rig': [img.width * bx / small.width, img.height * by / small.height, bx, by], 'sheetBox': [int(x0 + tx0), int(y0 + ty0), int(img.width), int(img.height)], **info}
            if name == 'palm':
                d.update(palm_pivots(grown, side, info, ty0))
            else:
                d.update(capsule_pivots(grown))
            meta[f'{side}_{name}'] = d
            print(side, name, img.size, {k: v for k, v in d.items() if k in ('width', 'length', 'base', 'tip')})
    root_patches(meta)
    (OUT / 'pieces.json').write_text(json.dumps(meta, indent=1, default=lambda o: o.item() if hasattr(o, 'item') else str(o)))
    check_sheet(meta)


def palm_pivots(mask, side, info, ty0):
    """Finger roots: the four bumps of the top edge (local minima of the top contour); wrist centre; thumb root."""
    h, w = mask.shape
    top = np.array([np.nonzero(mask[:, x])[0].min() if mask[:, x].any() else h for x in range(w)], float)
    sm = ndi.gaussian_filter1d(top, 5)
    # the knuckle region: the flat top between the thumb mound and the far side; bumps are minima of sm
    cand = [x for x in range(40, w - 40) if sm[x] <= sm[x - 35:x + 36].min() + 1e-6]
    peaks = []
    for x in cand:
        if not peaks or x - peaks[-1] > 60: peaks.append(x)
    peaks = sorted(peaks, key=lambda x: sm[x])[:4]
    peaks.sort()
    if len(peaks) == 3:
        # the index knuckle (next to the thumb) is drawn as a shoulder, not a bump: one spacing further on that side
        sp = (peaks[2] - peaks[0]) / 2
        peaks = [int(peaks[0] - sp)] + peaks if side == 'back' else peaks + [int(peaks[2] + sp)]
    assert len(peaks) == 4, f'{side}: {len(peaks)} knuckle bumps found'
    # valleys between bumps (for knuckle spacing / web)
    valleys = [int(a + np.argmax(sm[a:b])) for a, b in zip(peaks[:-1], peaks[1:])]
    rows = np.nonzero(mask.any(1))[0]
    cut = info['wristCut'] - ty0
    wx = np.nonzero(mask[cut - 2])[0]
    wrist = [float((wx.min() + wx.max()) / 2), float(cut)]
    # thumb mound: the side bulge (left on the back view, right on the palm view), at its outermost point
    xs_rows = [(y, np.nonzero(mask[y])[0]) for y in rows]
    if side == 'back':
        y_m, xm = min(((y, r.min()) for y, r in xs_rows if len(r)), key=lambda t: t[1])
    else:
        y_m, xm = max(((y, r.max()) for y, r in xs_rows if len(r)), key=lambda t: t[1])
    order = peaks if side == 'palm' else peaks           # left to right on the sheet
    # back view of a right hand: thumb on the left, so index is the leftmost bump; palm view: index rightmost
    names = FINGERS if side == 'back' else FINGERS[::-1]
    roots = {n: [float(x), float(sm[x])] for n, x in zip(names, order)}
    return {'fingerTops': roots, 'valleys': [[float(v), float(sm[v])] for v in valleys], 'wrist': wrist,
            'thumbMound': [float(xm), float(y_m)], 'width': float(w), 'height': float(h)}


def root_patches(meta):
    """Palm side: a patch of the palm picture over each finger's root (the knuckle edge with the palm below it). The rig
    draws it above the finger while the finger is fairly straight, so the finger grows out from behind the palm's edge;
    it fades out before the finger folds over the palm."""
    pm = meta['palm_palm']
    img = Image.open(OUT / 'native' / 'palm_palm.png')
    for f in FINGERS:
        kx, ky = pm['fingerTops'][f]
        fw = meta[f'back_{f}_base']['width'] * FIN_SX
        x0, x1 = int(kx - fw * .62), int(kx + fw * .62)
        y1 = int(ky + ROOT_DEPTH * fw + 40)
        patch = np.asarray(img.crop((x0, 0, x1, y1))).astype(float)
        # soften the patch's lower and side edges into the palm (only alpha; the palm below is the same picture)
        h, w = patch.shape[:2]
        fy = np.clip((y1 - np.arange(h)) / 30.0, 0, 1)[:, None]
        fx = np.clip(np.minimum(np.arange(w), w - 1 - np.arange(w)) / 34.0, 0, 1)[None, :]
        inner = np.arange(h)[:, None] > ky + 30                       # the knuckle edge: only the sides fade
        patch[..., 3] *= np.where(inner, fy * fx, fx)
        pi = Image.fromarray(patch.clip(0, 255).astype(np.uint8), 'RGBA')
        pi.save(OUT / 'native' / f'palm_{f}_root.png')
        square(shrink(pi, RIG_S, RIG_S)).save(OUT / 'rig' / f'palm_{f}_root.png')
        meta[f'palm_{f}_root'] = {'w': w, 'h': h, 'offset': [x0, 0]}


def check_sheet(meta):
    """3x crops of the cleaned palm-side tips and a palm, on a mid grey, to check edges and nail removal."""
    ims = []
    for n in ['back_index_tip', 'palm_index_tip', 'palm_middle_tip', 'palm_thumb_tip', 'back_palm']:
        im = Image.open(OUT / 'rig' / f'{n}.png')
        im = im.resize((im.width * 3, im.height * 3), Image.NEAREST)
        bg = Image.new('RGBA', im.size, (190, 200, 210, 255)); bg.alpha_composite(im); ims.append(bg)
    W = sum(i.width + 10 for i in ims); Hh = max(i.height for i in ims)
    sheet = Image.new('RGBA', (W, Hh), 'white'); x = 0
    for i in ims: sheet.paste(i, (x, 0)); x += i.width + 10
    sheet.save(OUT / 'check_rig_3x.png')


if __name__ == '__main__':
    main()

# ---- match the arms: the sheet's skin (#FDC28D) is lighter than the arm pieces cut from the pack's view picture (rendered about 255 190 134),
# so a hand next to its forearm showed as a lighter patch with a light line at the wrist; tint every picture toward the arm's skin
ARM_SKIN = np.array([254.0, 190.0, 134.0]); TINT = ARM_SKIN / np.array(SKIN, float)
for sub in ('native', 'rig'):
    for p in sorted((OUT / sub).glob('*.png')):
        im = np.asarray(Image.open(p).convert('RGBA')).astype(np.float32)
        im[..., :3] = np.clip(im[..., :3] * TINT[None, None, :], 0, 255)
        Image.fromarray(im.astype(np.uint8), 'RGBA').save(p)
print('tinted to the arm skin', TINT.round(3))
