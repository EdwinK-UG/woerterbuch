"""Complete the far sleeve and clean the sleeve pieces (run after the cut_*.py scripts).

In the side and three-quarter-back pictures the far arm's sleeve is mostly hidden behind the body, so the pack's piece is a
sliver; when that arm is raised the missing part shows as torn shards. The near sleeve is a whole puff, and the two arms are
almost mirror images, so the far sleeve (and its shoulder cap) becomes the near one mirrored about the line midway between the
shoulders: <view>_sleeve<far>_f.png / <view>_cap<far>_f.png, with their boxes in <view>.json under `boxes`.
Also every sleeve piece loses the red specks that the pack's painted torso left on its edge.

[liv-sleeves] Then the shoulder joins (bottom of this file; sleeve_field.py has the sleeve's bend field): cleaned sleeves
(<view>_sleeve<sd>_k.png), shoulder caps on the field (<view>_cap<sd>_k.png), upper arms without the skin under the puff
(<view>_upper<sd>_s.png), the torso with a linen shoulder under each sleeve (<view>_torso_s.png, box boxes.torso_s), and in the
three-quarter view a whole far sleeve for the far arm's front copy (tq_sleeveB_ff.png), its hidden part behind the bodice
(tq_sleeveB_h.png) and gap fill (tq_sleeveB_g.png).

    python3 tools/liv/rive/fix_sleeves.py
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageOps

HERE = Path(__file__).resolve().parent
PARTS = json.loads((HERE / 'parts/parts.json').read_text())
LINEN = np.array([238, 224, 198], np.float32)

def unspeckle(path):
    im = np.asarray(Image.open(path).convert('RGBA')).astype(np.float32)
    r, g, b, a = im[..., 0], im[..., 1], im[..., 2], im[..., 3]
    red = (a > 20) & (r > 120) & (g < 105) & (b < 95) & (r - g > 60)
    n = int(red.sum())
    if n: im[red, :3] = LINEN
    Image.fromarray(im.astype(np.uint8), 'RGBA').save(path)
    return n

for V in ('front', 'tq', 'side', 'tqb', 'back'):
    jpath = HERE / V / f'{V}.json'
    T = json.loads(jpath.read_text())
    cleaned = {p.name: unspeckle(p) for p in sorted((HERE / V).glob(f'{V}_sleeve*_c.png'))}
    msg = f'{V}: red specks removed {cleaned}'
    if V in ('side', 'tqb'):
        far = T['far_arm']; near = 'B' if far == 'A' else 'A'
        boxes = T.setdefault('boxes', {})
        nb = boxes.get(f'sleeve{near}') or [PARTS[f'{V}_sleeve{near}'][k] for k in 'xywh']
        axis = (T[near]['sh'][0] + T[far]['sh'][0]) / 2.0
        fx = 2 * axis - (nb[0] + nb[2]); fy = nb[1] + (T[far]['sh'][1] - T[near]['sh'][1])
        for piece, src in (('sleeve', f'{V}_sleeve{near}_c.png'), ('cap', f'{V}_cap{near}.png')):
            sp = HERE / V / src
            if not sp.exists(): continue
            ImageOps.mirror(Image.open(sp).convert('RGBA')).save(HERE / V / f'{V}_{piece}{far}_f.png')
        boxes[f'sleeve{far}_f'] = [round(fx, 1), round(fy, 1), nb[2], nb[3]]
        jpath.write_text(json.dumps(T, indent=1))
        msg += f'; far sleeve {far} = near {near} mirrored, box {boxes[f"sleeve{far}_f"]}'
    print(msg)


# ---------------------------------------------------------------------------------------------------------- [liv-sleeves]
# Shoulder joins (sleeve_field.py has the bend field):
#   <view>_sleeve<sd>_k.png  the sleeve's core: the sleeve faded out on the seam wedge (where the field is small)
#   <view>_cap<sd>_k.png     the shoulder cap: the sleeve's own pixels on the seam wedge, fading out toward the arm; rigid on the
#                            spine and drawn under the core, so at rest core + cap = the sleeve as drawn
#   <view>_upper<sd>_s.png   the upper arm without the skin hidden under the puff (only the part inside the cuff is kept): when
#                            the puff turns away from the arm, the body under it shows, never the arm's skin over the bodice
#   <view>_torso_s.png       the torso with a linen shoulder under each sleeve (blouse, the under-layer colour), outlined where it
#                            meets the background; small torn fragments of the pack's painting under the sleeves are removed
from scipy import ndimage
from sleeve_field import Field, ramp, CAP

INK = np.array([58, 28, 12], np.float32)
SHOULDER_R = {'front': 32, 'back': 32, 'tq': 34, 'tqb': 34, 'side': 46}   # the shoulder dome's radius about the joint (view px)
BAND = {'front': 45, 'back': 45, 'tq': 50, 'tqb': 50, 'side': 90}         # the torso rows (about the joint) the shoulder's outline joins


def load(p): return np.asarray(Image.open(p).convert('RGBA')).astype(np.float32)
def save(a, p): Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA').save(p)


def sample(img, box, X, Y):
    """img (h, w, 4) placed at box: bilinear sample at view coordinates X, Y (0 outside)."""
    h, w = img.shape[:2]
    u = (X - box[0]) / box[2] * w - .5; v = (Y - box[1]) / box[3] * h - .5
    return np.stack([ndimage.map_coordinates(img[..., c], [v, u], order=1, mode='constant', cval=0) for c in range(4)], -1)


def grid(box, shape):
    h, w = shape; yy, xx = np.mgrid[0:h, 0:w]
    return box[0] + (xx + .5) * box[2] / w, box[1] + (yy + .5) * box[3] / h


def trim_upper(V, T, sd, F, sl, suffix, extra=None):
    """The upper arm without the skin under the puff (the sleeve's opaque inside, eroded so its outline still covers the arm's
    edge); the arm inside the cuff stays."""
    up_p = HERE / V / f'{V}_upper{sd}.png'
    if not up_p.exists(): return
    up = load(up_p); ub = T[sd]['upper']; UX, UY = grid(ub, up.shape[:2])
    sa = ndimage.minimum_filter(sl[..., 3] / 255.0, size=5)
    cov = sample(np.dstack([sa * 255] * 4), F.box, UX, UY)[..., 3] / 255.0
    if extra is not None:                                          # (another picture of the sleeve that covers the arm too)
        ea = ndimage.minimum_filter(extra[1][..., 3] / 255.0, size=5)
        cov = np.maximum(cov, sample(np.dstack([ea * 255] * 4), extra[0], UX, UY)[..., 3] / 255.0)
    t = (UX - F.sh[0]) * F.u[0] + (UY - F.sh[1]) * F.u[1]
    keep = ramp(t, F.tend - 40, F.tend - 28)
    up[..., 3] *= 1 - np.clip((cov - .5) * 2, 0, 1) * (1 - keep)
    save(up, HERE / V / f'{V}_upper{sd}{suffix}.png')


def clean_sleeve(sl):
    """A sleeve picture with clean cut edges: the pack's paper (bluish) at the edge becomes linen, and where the edge has no ink
    (it was cut along the bodice or the arm) its soft fringe and hair-thin shards go: when the puff turns, that edge shows."""
    sl = sl.copy(); a = sl[..., 3] / 255.0
    blu = (sl[..., 3] > 8) & (sl[..., 2] > sl[..., 0] + 8); sl[blu, :3] = LINEN
    ink = (a > .5) & (sl[..., :3].sum(-1) < 330)
    near_ink = ndimage.binary_dilation(ink, iterations=4)
    solid = ndimage.binary_opening(a > .5, iterations=2)                   # shards thinner than about 4 px are not solid
    keep = ndimage.binary_dilation(solid, iterations=1)
    raw = ~near_ink
    a2 = np.where(raw, np.where(keep, ramp(a, .3, .7), 0.0), a)
    sl[..., 3] = a2 * 255
    return sl


def shoulders(V):
    T = json.loads((HERE / V / f'{V}.json').read_text())
    out = []
    tb = [PARTS[f'{V}_torso'][k] for k in 'xywh'] if f'{V}_torso' in PARTS else T['boxes']['torso']
    tp = HERE / V / f'{V}_torso_c.png'
    torso = load(tp if tp.exists() else HERE / 'parts' / f'{V}_torso.png')
    # a margin round the torso picture, so the shoulder can reach past its box (its outline is drawn, not cut by the box)
    M = 28; torso = np.pad(torso, ((M, M), (M, M), (0, 0))); tb = [tb[0] - M, tb[1] - M, tb[2] + 2 * M, tb[3] + 2 * M]
    TX, TY = grid(tb, torso.shape[:2])
    patch = np.zeros(torso.shape[:2], np.float32); covered = np.zeros(torso.shape[:2], bool)
    # small torn fragments of the torso painting near the shoulders (pieces of collar, ink dots, red specks) go first
    zone = np.zeros(torso.shape[:2], bool)
    for sd in 'AB':
        if sd in T: zone |= np.hypot(TX - T[sd]['sh'][0], TY - T[sd]['sh'][1]) < 120
    lab, n = ndimage.label(torso[..., 3] > 40)
    sizes = ndimage.sum(np.ones_like(lab), lab, index=np.arange(1, n + 1))
    small = np.isin(lab, 1 + np.flatnonzero(sizes < 400)) & zone
    torso[small, 3] = 0
    if V == 'tq':
        # the far sleeve is a sliver here (the bodice hides the rest): for the far arm's copy in front of the torso (it swings
        # forward past the chest) a whole sleeve, the near one mirrored about the line midway between the shoulders (as above)
        far = T.get('far_arm', 'B'); near = 'A' if far == 'B' else 'B'
        nb = [PARTS[f'{V}_sleeve{near}'][k] for k in 'xywh']; axis = (T[near]['sh'][0] + T[far]['sh'][0]) / 2.0
        T.setdefault('boxes', {})[f'sleeve{far}_ff'] = [round(2 * axis - (nb[0] + nb[2]), 1), round(nb[1] + T[far]['sh'][1] - T[near]['sh'][1], 1), nb[2], nb[3]]
        ImageOps.mirror(Image.open(HERE / V / f'{V}_sleeve{near}_c.png').convert('RGBA')).save(HERE / V / f'{V}_sleeve{far}_ff.png')
        out.append(f'front copy of the far sleeve {far} = near {near} mirrored, box {T["boxes"][f"sleeve{far}_ff"]}')
    for sd in 'AB':
        if sd not in T: continue
        F = Field(V, T, sd)
        if F.src is None: continue
        sl = load(F.src); X, Y = grid(F.box, sl.shape[:2]); f = F.f(X, Y)
        save(clean_sleeve(sl), HERE / V / f'{V}_sleeve{sd}_k.png')
        cap = sl.copy(); cap[..., 3] *= 1 - ramp(f, *CAP)
        save(cap, HERE / V / f'{V}_cap{sd}_k.png')
        if sd == T.get('far_arm', 'B') and (HERE / V / f'{V}_sleeve{sd}_ff.png').exists():   # the far arm's copy in front: under the whole sleeve
            bf = T['boxes'][f'sleeve{sd}_ff']; pf = HERE / V / f'{V}_sleeve{sd}_ff.png'
            trim_upper(V, T, sd, Field(V, T, sd, pf, bf, like=F), load(pf), '_sf')
            # and behind the torso, under the sliver: the part of that whole sleeve the bodice (or the sliver) hides at rest, so
            # a far arm that swings out or up pulls a whole puff from behind the bodice instead of the sliver's cut edge
            ff = clean_sleeve(load(pf)); FX, FY = grid(bf, ff.shape[:2])
            hid = sample(torso, tb, FX, FY)[..., 3] / 255.0
            hid = np.maximum(hid, sample(sl, F.box, FX, FY)[..., 3] / 255.0)
            ffall = ff.copy()
            hm = np.clip((ndimage.minimum_filter(hid, size=3) - .5) * 2, 0, 1)
            ff[..., 3] *= hm
            save(clean_sleeve(load(pf)), pf); save(ff, HERE / V / f'{V}_sleeve{sd}_h.png')
            # the gaps in it (at rest the far upper arm shows there, between the bodice and the sliver): filled when the arm turns
            # (the controller fades this in with the turn: slvFill<sd>), so the arm's skin does not show through the puff
            gap = ndimage.binary_closing(hm > .5, iterations=8) & (hm < .99)
            ffall[..., 3] *= ndimage.gaussian_filter(gap.astype(np.float32), .6)
            save(ffall, HERE / V / f'{V}_sleeve{sd}_g.png')
            trim_upper(V, T, sd, F, sl, '_s', extra=(bf, ff))
        else:
            trim_upper(V, T, sd, F, sl, '_s')
        # the shoulder under the sleeve: inside the body's outline (hull of the torso band and a dome about the joint) and under
        # the sleeve as drawn
        sa = sample(np.dstack([sl[..., 3]] * 4), F.box, TX, TY)[..., 3] / 255.0
        under = ndimage.binary_dilation(sa > .5, iterations=3)
        if not (sd == T.get('far_arm', 'B') and V == 'tq'):        # (the sliver is behind the torso there)
            covered |= ndimage.binary_erosion(sa > .95, iterations=3)
        dome = np.hypot(TX - F.sh[0], TY - F.sh[1]) <= SHOULDER_R[V]
        band = (torso[..., 3] > 128) & (np.abs(TY - F.sh[1]) < BAND[V]) & (np.hypot(TX - F.sh[0], TY - F.sh[1]) < 150)
        from scipy.spatial import ConvexHull
        from matplotlib.path import Path as MPath
        pts = np.column_stack([TX[band | dome], TY[band | dome]])
        hull = ConvexHull(pts); poly = MPath(pts[hull.vertices])
        inside = poly.contains_points(np.column_stack([TX.ravel(), TY.ravel()])).reshape(TX.shape)
        reg = inside & under
        patch = np.maximum(patch, reg.astype(np.float32))
        out.append(f'{sd}: f-field cuff end {F.tend:.0f}, shoulder patch {int(reg.sum())} px')
    # under the sleeves the torso keeps its bodice (red, and the ink along it); bits of blouse, collar and stray ink that the pack
    # painted there become plain linen (they showed as shards when the arm went up)
    r, g_, b = torso[..., 0], torso[..., 1], torso[..., 2]
    red = (torso[..., 3] > 40) & (r > 110) & (g_ < 110) & (r - g_ > 45)
    keep_ink = ndimage.binary_dilation(red, iterations=4)
    linen_px = covered & (torso[..., 3] > 8) & ~red & ~keep_ink
    torso[linen_px, :3] = LINEN
    # linen with an ink outline where the patch meets the outside (not the torso)
    P = ndimage.gaussian_filter(patch, .7)
    body = (torso[..., 3] > 20) | (patch > .5)
    outside = ~ndimage.binary_dilation(body, iterations=1)
    dist_out = ndimage.distance_transform_edt(~outside)
    ink = np.clip(3.6 - dist_out, 0, 1) * (patch > .5) * (torso[..., 3] < 128)
    rgb = LINEN[None, None, :] * (1 - ink[..., None]) + INK[None, None, :] * ink[..., None]
    under = np.dstack([rgb, P * 255])
    a_t = torso[..., 3:4] / 255.0
    comp_a = a_t + (under[..., 3:4] / 255.0) * (1 - a_t)
    comp_rgb = (torso[..., :3] * a_t + under[..., :3] * (under[..., 3:4] / 255.0) * (1 - a_t)) / np.maximum(comp_a, 1e-4)
    save(np.dstack([comp_rgb, comp_a * 255]), HERE / V / f'{V}_torso_s.png')
    T.setdefault('boxes', {})['torso_s'] = tb
    (HERE / V / f'{V}.json').write_text(json.dumps(T, indent=1))
    print(f'{V} shoulders: ' + '; '.join(out) + f'; fragments removed {int(small.sum())} px, under-sleeve bits to linen {int(linen_px.sum())} px')


for V in ('front', 'tq', 'side', 'tqb', 'back'): shoulders(V)
