"""Cut Liv's BACK view for the Rive rig (views/05_back.png -> tools/liv/rive/back/).

    python3 tools/liv/rive/cut_back.py

Arms, legs, caps and cloth as for the three-quarter view (cut_tq.py + cut_cloth.py); the shared steps are in cutlib_fb.py.
Back only: no apron (the skirt is red all round), but the apron's waist BOW: its two tails are cut off as back_bow1.png (the
viewer's left tail, x < 512) and back_bow2.png, re-toned to linen, with the red dress behind them filled in (in back_torso_c
and back_skirtred). The knot and the two loops stay on the bodice (back_torso_c): they do not swing. The head is hair only.
A is the arm/leg on the viewer's left (x < 512): from behind that is her LEFT (A_is = 'L').
"""
import numpy as np
from scipy import ndimage
from cutlib_fb import run, is_cream, retone, rgb_to_hsv

BOW_BOX = (640, 780, 420, 610)            # y0, y1, x0, x1: where the bow is


def bow(c, tor, tbox):
    y0, y1, x0, x1 = BOW_BOX
    v = c.view; rgba = np.dstack([v, np.full(v.shape[:2], 255, np.float32)])
    reg = np.zeros((c.H, c.W), bool); reg[y0:y1, x0:x1] = True
    cr = is_cream(rgba) & reg
    lab, k = ndimage.label(cr & ~ndimage.binary_dilation(c.ink))
    comps = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        m = lab == i + 1
        if m.sum() > 150: comps.append(dict(id=i + 1, px=int(m.sum()), x0=sl[1].start, x1=sl[1].stop, y0=sl[0].start, y1=sl[0].stop))
    tails = sorted([q for q in comps if q['y1'] > 720 and q['y0'] > 685], key=lambda q: q['x0'])
    assert len(tails) == 2, comps
    # every outline pixel near the bow goes to the nearest cream component (knot, loops, band ends or a tail)
    allc = np.zeros((c.H, c.W), np.int32)
    for q in comps: allc[lab == q['id']] = q['id']
    d, (iy, ix) = ndimage.distance_transform_edt(allc == 0, return_indices=True)
    nearest = allc[iy, ix]
    outline = reg & (v[..., 0] < 115) & (v.sum(axis=2) < 260)
    pieces = {}
    under_all = np.zeros((c.H, c.W), bool)
    for name, q in zip(('bow1', 'bow2'), tails):
        core = lab == q['id']
        m = core | (outline & (nearest == q['id']) & (d <= 5))
        m = ndimage.binary_fill_holes(m)
        ys, xs = np.nonzero(m); by0, by1, bx0, bx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        a = ndimage.gaussian_filter(m.astype(np.float32), .6)
        a = np.where(m, 1.0, a * (a > .3))
        out = np.dstack([v, a * 255])[by0:by1, bx0:bx1]
        raw = out.copy()
        fin = retone(out, out[..., 3] > 100)
        c.add_box_piece(name, fin, [int(bx0), int(by0), int(bx1 - bx0), int(by1 - by0)], raw=raw, kind='cloth')
        top = ys.min(); topx = xs[ys < top + 5].mean()
        bot = ys.max(); botx = xs[ys > bot - 6].mean()
        pieces[name] = [[round(float(topx), 1), float(top + 3)], [round(float(botx), 1), float(bot - 3)]]
        under_all |= ndimage.binary_dilation(m, iterations=1) & ~(allc > 0) | m
    # the dress behind the tails: one red per row from the plain red on that row (cut_cloth.py's skirt fill)
    filled = rgba.copy()
    sub = (slice(y0, y1), slice(x0, x1))
    plain = c.red & ~ndimage.binary_dilation(allc > 0, iterations=6) & (v[..., 0] > 165)
    filled[sub] = c.red_fill(rgba[sub], under_all[sub], plain[sub])
    tx, ty, tw, th = tbox
    t_under = under_all[ty:ty + th, tx:tx + tw] & (tor[..., 3] > 0)
    tor = tor.copy(); tor[..., :3] = np.where(t_under[..., None], filled[ty:ty + th, tx:tx + tw, :3], tor[..., :3])
    sk = c.skirt_full(); sx, sy, sw, sh = c.pbox('skirt')
    s_under = under_all[sy:sy + sh, sx:sx + sw] & (sk[..., 3] > 0)
    sk[..., :3] = np.where(s_under[..., None], filled[sy:sy + sh, sx:sx + sw, :3], sk[..., :3])
    c.add_box_piece('skirtred', sk, c.pbox('skirt'))
    c.bow_rig = pieces
    return tor, ['bow1', 'bow2']


def rig_extra(c):
    return dict(bow1=c.bow_rig['bow1'], bow2=c.bow_rig['bow2'], bag=dict(a=[462, 474], b=[622, 800]), bag_visible=True)


run('back', (1130, 1185), bow, rig_extra,
    dict(pelvis=[512, 912], yaw_deg=180, facing='away', A_is='L', far_arm='B'))
