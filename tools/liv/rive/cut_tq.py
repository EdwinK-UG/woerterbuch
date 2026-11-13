"""Cut the limbs of Liv's three-quarter view for the Rive rig.

The pack's parts (tools/liv/rive/parts) hold head, torso, skirt, sleeves, socks and boots, but not the arms and legs:
in the view picture they are what is left once the parts are taken away. This script finds that rest and cuts it into

  tq_upperA/B.png   upper arm: from under the sleeve (stretched upwards, the sleeve hides it) to the elbow
  tq_foreA/B.png    forearm: elbow to wrist (the hand is a separate sprite, see hands below)
  tq_legA/B.png     a strip of leg skin (all rows alike), stretched by the rig over the whole leg
  tq.json           joints (view pixels) and boxes

The elbow is rounded: the upper arm ends in a disc with an ink arc, the forearm starts with a plain skin disc on the
same centre, so a bent elbow has no flat cut edge. Hands come from parts/hand_*.png (six poses).

    python3 tools/liv/rive/cut_tq.py            (writes tools/liv/rive/tq/)
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

HERE = Path(__file__).resolve().parent
OUT = HERE / 'tq'; OUT.mkdir(exist_ok=True)
PARTS = json.loads((HERE / 'parts/parts.json').read_text())
view = np.asarray(Image.open(HERE / 'views/02_three_quarter_front.png').convert('RGB')).astype(np.float32)
H, W = view.shape[:2]
BG = np.array([0xBF, 0xD9, 0xE6], np.float32)
INK = np.array([0x3a, 0x1c, 0x0c], np.float32)
SKIN = np.array([0xfd, 0xb7, 0x7e], np.float32)

# --- what is left of the view once the parts are taken away ---
cov = np.zeros((H, W), bool)
for n in ['tq_skirt', 'tq_torso', 'tq_head', 'tq_sleeveA', 'tq_sleeveB', 'tq_sockA', 'tq_bootA', 'tq_sockB', 'tq_bootB']:
    p = PARTS[n]; a = np.asarray(Image.open(HERE / f'parts/{n}.png'))[..., 3] > 128
    x, y = int(p['x']), int(p['y']); cov[y:y + a.shape[0], x:x + a.shape[1]] |= a
res = (np.abs(view - BG).sum(axis=2) > 24) & ~cov

META = PARTS['_meta']['tq']
J = {}                                                   # joints in view pixels
J['shA'] = META['A']['sh']; J['shB'] = META['B']['sh']
LEN_UP, LEN_FORE = 149.0, 139.0                          # prop.upArm / foreArm (0.15 / 0.14 m) at 996 px per metre
yy, xx = np.mgrid[0:H, 0:W]

def unit(v): v = np.array(v, float); return v / np.hypot(*v)

def cut_arm(side):
    sh = np.array(META[side]['sh'], float); u = unit(META[side]['dir']); n = np.array([-u[1], u[0]])
    region = (xx < 480) & (yy > 560) & (yy < 880) if side == 'A' else (xx > 560) & (yy > 560) & (yy < 880)
    r_, g_, b_ = view[..., 0], view[..., 1], view[..., 2]
    skin = (g_ < .83 * r_) & (b_ < .64 * r_) & (r_ > 190)            # not the cream cuff, not the red dress
    ink = (view.sum(axis=2) < 330)
    m = res & region & (skin | ink | (ndimage.binary_dilation(skin, iterations=2) & (view.sum(axis=2) < 560)))
    m = ndimage.binary_opening(m, iterations=1)
    lab, k = ndimage.label(m); m = lab == (1 + int(np.argmax(ndimage.sum(m, lab, range(1, k + 1)))))   # the arm and hand
    m = ndimage.binary_fill_holes(m)
    t = (xx - sh[0]) * u[0] + (yy - sh[1]) * u[1]; s = (xx - sh[0]) * n[0] + (yy - sh[1]) * n[1]
    tw = LEN_UP + LEN_FORE - 14                          # wrist: the hand sprite overlaps the forearm's end by ~14 px
    arm = m & (t < tw)
    half = float(np.percentile(np.abs(s[arm & (t > 90) & (t < 150)]), 96))
    # The visible upper arm is a short stretch between the cuff and the elbow, shaded by the sleeve, so it is rebuilt
    # as a plain tube: the cross-section of the forearm (skin and the ink on its edge), repeated along the upper arm.
    ts = np.arange(LEN_UP + 22, LEN_UP + 62)
    cen, hw = [], []
    for tk in ts:
        row = arm & (np.rint(t) == tk)
        if row.sum() > 5: cen.append((s[row].min() + s[row].max()) / 2); hw.append((s[row].max() - s[row].min()) / 2)
    s_c, half_f = float(np.median(cen)), float(np.median(hw))
    sn = np.linspace(-1.12, 1.12, 56)
    prof = np.zeros((len(sn), 3), np.float32)
    for ci in range(3):
        vals = []
        for tk in ts[::3]:
            px = sh[0] + u[0] * tk + n[0] * (s_c + sn * half_f); py = sh[1] + u[1] * tk + n[1] * (s_c + sn * half_f)
            vals.append(ndimage.map_coordinates(view[..., ci], [py, px], order=1))
        prof[:, ci] = np.median(vals, axis=0)
    half = half_f * 1.04
    tmin = LEN_UP - 80                                   # the visible top; the tube goes on up under the sleeve
    ext_lo = 6 - half                                   # the round cap's centre sits on the shoulder joint
    snn = (s - s_c) / half
    tube = ((t >= ext_lo + half) & (t < LEN_UP + 14) & (np.abs(snn) <= 1.0)) | (np.hypot(t - (ext_lo + half), s - s_c) <= half)   # round cap at the top
    img = view.copy(); ii = np.clip((snn + 1.12) / 2.24 * (len(sn) - 1), 0, len(sn) - 1)
    for ci in range(3): img[..., ci] = np.where(tube, np.interp(ii, np.arange(len(sn)), prof[:, ci]), view[..., ci])
    edge = tube & (np.abs(snn) > 1 - 2.8 / half)                # the drawing's ink line along the arm
    for ci in range(3): img[..., ci] = np.where(edge, INK[ci] * .85 + img[..., ci] * .15, img[..., ci])
    alpha = (tube | (arm & (t >= LEN_UP + 14))).astype(np.float32)
    # elbow discs
    d = np.hypot(xx - (sh[0] + u[0] * LEN_UP + n[0] * s_c), yy - (sh[1] + u[1] * LEN_UP + n[1] * s_c)); r = half * 0.98
    el = sh + u * LEN_UP + n * s_c
    d = np.hypot(xx - el[0], yy - el[1])
    up = tube & (t < LEN_UP)
    upper = up | (d <= r)
    arc = (d <= r) & (d > r - 3.2) & (t >= LEN_UP - 2)
    up_img = img.copy(); up_img[(d <= r) & ~up] = SKIN; up_img[arc] = INK
    fore = (arm & (t >= LEN_UP)) | ((d <= r - 3.4) & (t < LEN_UP))
    fo_img = view.copy(); fo_img[(d <= r - 3.4) & ~arm] = SKIN
    wr = sh + u * tw + n * s_c
    def save(name, rgb, mask):
        ys_, xs_ = np.nonzero(mask); y0, y1, x0, x1 = ys_.min(), ys_.max() + 1, xs_.min(), xs_.max() + 1
        a = ndimage.gaussian_filter(mask.astype(np.float32), .6)[y0:y1, x0:x1] * 255
        out = np.dstack([rgb[y0:y1, x0:x1], a]); out[..., 3] = np.where(mask[y0:y1, x0:x1], np.maximum(out[..., 3], 160), out[..., 3])
        Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA').save(OUT / f'{name}.png')
        return [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]
    box_up = save(f'tq_upper{side}', up_img, upper); box_fo = save(f'tq_fore{side}', fo_img, fore)
    return dict(sh=[float(v) for v in sh], elbow=[float(v) for v in el], wrist=[float(v) for v in wr], dir=[float(v) for v in u],
                half=half, axis_offset=s_c, upper=box_up, fore=box_fo)

def cut_leg(side):
    # the bare leg between the hem and the sock; a strip of rows without the hem shadow, all alike, is enough
    sk = PARTS['tq_sock' + side]
    x0 = int(sk['x']) - 10 if side == 'A' else int(sk['x']) - 14; x1 = x0 + int(sk['w']) + 24
    y0, y1 = 1128, 1176
    m = res[y0:y1, x0:x1]
    cols = np.nonzero(m.mean(axis=0) > .85)[0]
    cx0, cx1 = x0 + cols.min(), x0 + cols.max() + 1
    strip = np.zeros((16, cx1 - cx0, 4), np.float32)
    sub = view[y0:y1, cx0:cx1]; w = res[y0:y1, cx0:cx1].astype(np.float32)[..., None]
    mean = (sub * w).sum(axis=0) / np.maximum(w.sum(axis=0), 1)
    strip[..., :3] = mean[None]; strip[..., 3] = 255
    Image.fromarray(strip.astype(np.uint8), 'RGBA').save(OUT / f'tq_leg{side}.png')
    return dict(x0=int(cx0), x1=int(cx1))

info = {'A': cut_arm('A'), 'B': cut_arm('B'), 'legA': cut_leg('A'), 'legB': cut_leg('B')}

def make_cap(side):
    # The top of the sleeve, from the shoulder joint a little way down the arm, faded out: it stays sewn to the torso when
    # the arm goes up (drawn behind the sleeve, so at rest it is hidden by the same pixels)
    a = info[side]; sh = np.array(a['sh']); u = np.array(a['dir'])
    p = PARTS['tq_sleeve' + side]; src = OUT / f'tq_sleeve{side}_c.png'   # the re-toned sleeve (cut_cloth.py) if it has been made
    im = np.asarray(Image.open(src if src.exists() else HERE / f'parts/tq_sleeve{side}.png').convert('RGBA')).astype(np.float32)
    yy_, xx_ = np.mgrid[0:im.shape[0], 0:im.shape[1]]
    t = (xx_ + p['x'] - sh[0]) * u[0] + (yy_ + p['y'] - sh[1]) * u[1]
    im[..., 3] *= np.clip((30 - t) / 22, 0, 1)
    Image.fromarray(np.clip(im, 0, 255).astype(np.uint8), 'RGBA').save(OUT / f'tq_cap{side}.png')
make_cap('A'); make_cap('B')
def make_leg_pieces(side):
    """Thigh and shin as two rigid pieces with a round knee, the way the arms have an elbow disc: the thigh ends in a
    half disc with an ink arc, the shin starts with a plain skin disc drawn over it. No skinned bend, so no pinched
    knee. The skin comes from the strip cut above (colours across the leg)."""
    prof = np.asarray(Image.open(OUT / f'tq_leg{side}.png').convert('RGBA'))[0, :, :3].astype(np.float32)
    w = len(prof); hw = w / 2.0; ink = 3.2
    inner = prof[5:w - 5]
    def col(sv):                                           # skin colour at lateral offset sv (-hw..hw)
        x = np.clip((sv + hw - 5) / max(1, w - 10) * (len(inner) - 1), 0, len(inner) - 1)
        return np.stack([np.interp(x, np.arange(len(inner)), inner[:, c]) for c in range(3)], -1)
    hip, knee, ank = np.array(info['hip' + side], float), np.array(info['knee' + side], float), np.array(info['ankle' + side], float)
    def piece(name, top_ext, length, cap_top):
        # rows: t from -top_ext (above the bone's start) down to length (+ hw for the round end of the thigh)
        rows = int(np.ceil(top_ext + length + (0 if cap_top else hw))) + 1
        rr, cc = np.mgrid[0:rows, 0:int(round(w))].astype(np.float32); tt = rr - top_ext; ss = cc + .5 - hw
        if cap_top:       # shin: the tube from the knee down, a plain skin disc above the knee centre
            sd_tube = np.abs(ss) - hw                          # the sides only: the top is the cap, the bottom is under the sock
            sd_cap = np.hypot(ss, np.minimum(tt, 0)) - (hw - 3.6)
            sd = np.where(tt < 0, sd_cap, sd_tube)
        else:             # thigh: the tube to the knee centre, then a half disc
            sd = np.where(tt <= length, np.maximum(np.abs(ss) - hw, -tt - 1e3), np.hypot(ss, tt - length) - hw)
        a = np.clip(.5 - sd, 0, 1)
        skin = col(ss)
        is_ink = (sd > -ink)
        if cap_top: is_ink = is_ink & (tt >= 0)
        rgb = np.where(is_ink[..., None], INK[None, None, :] * .92 + skin * .08, skin)
        Image.fromarray(np.dstack([rgb, a * 255]).clip(0, 255).astype(np.uint8), 'RGBA').save(OUT / f'{name}.png')
        return [int(rows), int(round(w))]
    lt = float(np.linalg.norm(knee - hip)); ls = float(np.linalg.norm(ank - knee)) + 10
    r1 = piece(f'tq_thigh{side}', 34, lt, False); top2 = int(np.ceil(hw)); r2 = piece(f'tq_shin{side}', top2, ls, True)
    return dict(thigh=dict(rows=r1[0], cols=r1[1], top_ext=34, length=lt), shin=dict(rows=r2[0], cols=r2[1], top_ext=top2, length=ls), hw=hw)

# joints: hips under the skirt, knees between hip and ankle, ankles from the pack's measurements
info['pelvis'] = [510, 912]
info['hipA'] = [452, 930]; info['hipB'] = [566, 930]
info['ankleA'] = META['A']['ankle']; info['ankleB'] = META['B']['ankle']
info['kneeA'] = [424, 1128]; info['kneeB'] = [571, 1120]
info['neck'] = META['neck']
info['legpiece'] = {sd: make_leg_pieces(sd) for sd in 'AB'}
info['_ppm'] = 996
# satchel strap: the canvas rig strokes it 30 px wide in the strap colour with an ink edge
strap = np.zeros((8, 30, 4), np.float32)
strap[..., :3] = np.array([0xe6, 0x9d, 0x43], np.float32); strap[..., 3] = 255
strap[:, :3, :3] = INK; strap[:, -3:, :3] = INK
Image.fromarray(strap.astype(np.uint8), 'RGBA').save(OUT / 'tq_strap.png')
(OUT / 'tq.json').write_text(json.dumps(info, indent=1))
print('ok', {k: (v if not isinstance(v, dict) else {kk: vv for kk, vv in v.items() if kk in ('half',)}) for k, v in info.items() if k in ('A', 'B')})
