"""Cut Liv's FRONT view for the Rive rig (views/01_front.png -> tools/liv/rive/front/).

    python3 tools/liv/rive/cut_front.py

Arms, legs, caps and cloth as for the three-quarter view (cut_tq.py + cut_cloth.py); the shared steps are in cutlib_fb.py.
Front only: the apron is cut off the skirt (front_apron.png, same box as the pack's front_skirt) and the red skirt under it is
filled in (front_skirtred.png). A is the arm/leg on the viewer's left (x < 512) = her RIGHT.
"""
import numpy as np
from scipy import ndimage
from cutlib_fb import run, is_cream, rgb_to_hsv, retone


def apron(c, tor, tbox):
    sk = c.skirt_full(); box = c.pbox('skirt'); a = sk[..., 3] > 128
    h_, s_, v_ = rgb_to_hsv(sk[..., :3])
    cream = is_cream(sk)
    lab, k = ndimage.label(cream)
    big = 1 + int(np.argmax(ndimage.sum(cream, lab, range(1, k + 1))))
    core = ndimage.binary_closing(ndimage.binary_fill_holes(lab == big), iterations=2)
    dark = a & (v_ < .5)
    ring = ndimage.binary_dilation(core, iterations=6) & ~core
    m = ndimage.binary_fill_holes(core | (ring & dark))
    alpha = ndimage.gaussian_filter(m.astype(np.float32), .7)
    ap = sk.copy(); ap[..., 3] = np.where(m, 255, np.clip(alpha * 255, 0, 255) * (alpha > .25))
    raw = ap.copy()
    c.add_box_piece('apron', retone(ap, ap[..., 3] > 100), box, raw=raw, kind='cloth')
    under = ndimage.binary_dilation(m, iterations=1) & a
    plain = a & ~under & (sk[..., 0] > 165) & (sk[..., 1] > 40) & (sk[..., 0] > 120) & (sk[..., 1] < 110)
    red = c.red_fill(sk, under, plain)
    c.add_box_piece('skirtred', red, box)
    # apron chain: waist (just under the waistband), middle, hem, on the apron's centre column
    ys, xs = np.nonzero(m); cx = float(np.median(xs))
    col = m[:, int(round(cx - box[0]))] if False else m[:, int(round(cx))]
    hem = float(np.nonzero(col)[0].max() + box[1])
    # the apron's top below the waistband: the band is in the torso; take the first apron (cream) row under it
    tc = is_cream(tor)[:, int(round(cx + box[0] - tbox[0]))]
    band_rows = np.nonzero(tc)[0] + tbox[1]
    waist = 748.0
    c.apron_rig = [[cx + box[0], waist], [cx + box[0], round((waist + hem) / 2, 1)], [cx + box[0], hem - 6]]
    return tor, []


def rig_extra(c):
    return dict(apron=[[round(float(v), 1) for v in p] for p in c.apron_rig],
                bag=dict(a=[566, 474], b=[416, 800]), bag_visible=True)


run('front', (1150, 1190), apron, rig_extra,
    dict(pelvis=[513, 912], yaw_deg=0, facing='toward', A_is='R', far_arm='B'))
