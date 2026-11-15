# Crop the part layers of one view (rendered by cast.js __export2d) and collect the recorded joint paths.
#   python3 rive_prep.py SHOTS OUT PREFIX            e.g.  shots rive c02_q
# Reads SHOTS/PREFIX_manifest.json (view, stacking kind, actions), _rig.json, the layer PNGs and _anim_*.json.
# Writes OUT/PREFIX/<image>.webp (and .png), OUT/PREFIX.json (images in stacking order, crops, joints, motions) and
# OUT/PREFIX_stack.jpg (the layers stacked at rest next to the whole figure, to check them).
import json, math, os, sys
from PIL import Image, ImageDraw
S, O, pf = sys.argv[1:4]
M = json.load(open(f'{S}/{pf}_manifest.json'))
FRONT = ['footL', 'llegL', 'ulegL', 'footR', 'llegR', 'ulegR', 'pelvis', 'torso', 'head', 'handL', 'larmL', 'uarmL', 'handR', 'larmR', 'uarmR']
ORDER = M.get('order') or {'q': ['handL', 'larmL', 'uarmL', 'llegL', 'footL', 'ulegL', 'llegR', 'footR', 'ulegR', 'pelvis', 'torso', 'head', 'handR', 'larmR', 'uarmR'],
                           'fb': FRONT, 'f': FRONT}[M['kind']]
rig = json.load(open(f'{S}/{pf}_rig.json')); J = rig['joints']; k = rig['W'] / 768        # k: render scale
if not J.get('top') or None in J['top']:     # older renders measured the top of the head on head accessories only
    bb = Image.open(f'{S}/{pf}_head_happy.png').getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox(); J['top'] = [J['head'][0], float(bb[1])]
def mid(j):                                    # the pelvis bone ends between the hip joints, a little lower
    j['midhip'] = [(j['hipL'][0] + j['hipR'][0]) / 2, (j['hipL'][1] + j['hipR'][1]) / 2 + 30 * k]; return j
mid(J)
def fix_top(f):                               # the same for the recorded frames: the top of the head above the head joint
    if not f.get('top') or None in f['top']: f['top'] = [f['head'][0], f['head'][1] - (J['head'][1] - J['top'][1])]
    return f
FACES = ['happy', 'blink', 'talk', 'smile', 'laugh', 'surprised', 'sad']
heads = [f for f in FACES if os.path.exists(f'{S}/{pf}_head_{f}.png')]
images = [p if p != 'head' else 'head_' + heads[0] for p in ORDER if os.path.exists(f'{S}/{pf}_{p}.png')]   # a layer only some have (the apron seen from behind)
images[images.index('head_' + heads[0]) + 1:1] = ['head_' + f for f in heads[1:]]   # the other faces right after
# Parts drawn in an action's pose (the open hand of a wave, the pointing finger, a forearm that points at the camera
# while clapping), turned and moved so that on the part's bone at rest they line up as in that pose: the rig shows
# them instead of the resting part while the action plays. They sit where the resting part sits in the stack, unless
# the action stacks them in front of the body (front: the far forearm and hand of the three-quarter clap).
src = {}
BONE = {'hand': ('wr', 'fi'), 'larm': ('el', 'wr'), 'uarm': ('sh', 'el')}
posed = [(a['name'], a['hands'], a.get('front', [])) for a in M['actions']] + \
        [('pick', [h for h in ('handR', 'larmR') if os.path.exists(f'{S}/{pf}_{h}_pick.png')], [])] * ('pick' in rig['poses'])
for pname, parts, front in posed:
    PJ = rig['poses'][pname]
    for part in parts:
        s = part[-1]; a0, a1 = (x + s for x in BONE[part[:-1]])
        th0 = math.atan2(J[a1][1] - J[a0][1], J[a1][0] - J[a0][0]); th1 = math.atan2(PJ[a1][1] - PJ[a0][1], PJ[a1][0] - PJ[a0][0])
        d = th0 - th1; c, sn = math.cos(d), math.sin(d); (x0, y0), (x1, y1) = J[a0], PJ[a0]
        im = Image.open(f'{S}/{pf}_{part}_{pname}.png').convert('RGBA')
        im = im.transform(im.size, Image.AFFINE, (c, sn, x1 - c * x0 - sn * y0, -sn, c, y1 + sn * x0 - c * y0), resample=Image.BICUBIC)
        name = f'{part}_{pname}'; im.save(f'{S}/{pf}_{name}_aligned.png'); src[name] = f'{name}_aligned'
        if part in front and 'handR' in images and images.index('handR') > images.index('torso'): images.insert(images.index('handR'), name)
        else: images.insert(images.index(part) + 1, name)
# Seen from the front, the clap's and the holding forearm point at the camera and the hand is at their near end: the
# hand's drawing goes in front of the forearm's (behind it, a long sleeve's cuff showed as a white disc with no hand).
if M['kind'] in ('f', 'fb'):
    for nm in ('clap', 'pick'):
        for s_ in 'LR':
            h_, l_ = f'hand{s_}_{nm}', f'larm{s_}_{nm}'
            if h_ in images and l_ in images: images.remove(h_); images.insert(images.index(l_) + 1, h_)
import numpy as np
from scipy import ndimage
A_ = lambda im: np.array(im.getchannel('A'), float)
def fill_from(t, want, valid):
    """Colour the pixels `want` of the RGBA array t from the nearest pixel of `valid` (the picture's own cloth or skin,
    taken a few pixels inside its edge so the dark outline is not smeared out)."""
    if not want.any() or not valid.any(): return
    idx = ndimage.distance_transform_edt(~valid, return_distances=False, return_indices=True)
    t[want, :3] = t[idx[0][want], idx[1][want], :3]
# Round joints. A limb piece ends at each joint in a disc round the joint as wide as the limb there, whole: what the
# piece's own picture does not cover of that disc is filled with its cloth, and what reaches past the disc is cut
# off. So at any angle two pieces meet in a round joint, and a piece that swings away never leaves an open end or a
# gap: the shoulder and the hip are ball joints too (a thigh used to end where the pelvis hid it, and a gap opened at
# the hip as soon as the leg swung: shorts torn in the middle). A piece that reaches far past its far joint on
# purpose is a garment that does (breeches over the knee) and keeps that end.
# Where a piece begins some way past its joint (a trouser leg below the hip, a thigh below a skirt's hem), the ball is
# joined to it by a straight piece of the same cloth or skin. ('new' instead of 'keep' makes a ball all of new cloth.)
CAPS = {f'{p}{s}': [(j + s, t + s, near) for j, t, near in ends] for s in 'LR' for p, ends in (
    ('uarm', (('sh', 'el', 'keep'), ('el', 'sh', False))), ('larm', (('el', 'wr', 'keep'), ('wr', 'el', False))),
    ('uleg', (('hip', 'kn', 'keep'), ('kn', 'hip', False))), ('lleg', (('kn', 'an', 'keep'),)))}
# What is added to a piece stacked behind the piece it hangs from (a thigh behind the pelvis, a forearm behind its
# upper arm) stays under that piece as it stands at rest, so the rest pose shows nothing new (a hip's ball used to
# stick out behind the seat like a little tail).
UNDER = {'uleg': 'pelvis', 'lleg': 'uleg', 'larm': 'uarm', 'uarm': 'torso'}
# A piece's cut (where it was parted from the body) follows the mesh's triangles: a zigzag, hidden at rest and
# showing as a torn edge as soon as the piece turns (a raised puff sleeve). Round the shoulder and the hip the
# piece's outline is smoothed: teeth are taken off and notches filled with the cloth next to them.
def smooth_cut(im, j, r, reach=2.0):
    full = np.array(im).astype(float); FH, FW = full.shape[:2]; c = np.array(J[j], float)
    m = int(2.6 * r + 8); x0, y0, x1, y1 = max(int(c[0]) - m, 0), max(int(c[1]) - m, 0), min(int(c[0]) + m, FW), min(int(c[1]) + m, FH)
    t = full[y0:y1, x0:x1]; a = t[..., 3].copy(); yy, xx = np.mgrid[y0:y1, x0:x1]; dist = np.hypot(xx - c[0], yy - c[1])
    sm = np.clip((ndimage.gaussian_filter(a / 255, max(2.0, 0.11 * r)) - 0.5) * 6 + 0.5, 0, 1) * 255
    w = np.clip((reach * r - dist) / (0.5 * r), 0, 1)                          # only near the joint, fading out
    new = a * (1 - w) + sm * w
    fill_from(t, (new > 8) & (a < 250), ndimage.binary_erosion(a > 200, iterations=max(2, round(3 * k))))
    t[..., 3] = new; return Image.fromarray(full.clip(0, 255).astype(np.uint8), 'RGBA')
RADIUS = {}
WHOLE = np.array(Image.open(f'{S}/{pf}_whole.png').getchannel('A'))
WHOLE_RGB = np.array(Image.open(f'{S}/{pf}_whole.png').convert('RGB'))
def as_whole(t, want, y0, x0, tol=45):
    """Where the pixels `want` of the window t (its corner at y0, x0) are nearly the colour the whole figure's picture
    has there, they take exactly that colour: added cloth lying over the same garment then does not show at rest."""
    w = WHOLE_RGB[y0:y0 + t.shape[0], x0:x0 + t.shape[1]].astype(float)
    ok = want & (WHOLE[y0:y0 + t.shape[0], x0:x0 + t.shape[1]] > 200) & (np.abs(w - t[..., :3]).max(-1) < tol); t[ok, :3] = w[ok]
def cap(im, part):
    full = np.array(im).astype(float); FH, FW = full.shape[:2]
    # a hole right through the piece (looking into a sleeve from the body's side, where it was cut off) is closed
    hole = ndimage.binary_fill_holes(ndimage.binary_closing(full[..., 3] > 128, iterations=max(4, round(4 * k)))) & (full[..., 3] < 128)
    if hole.any(): fill_from(full, hole, ndimage.binary_erosion(full[..., 3] > 200, iterations=max(2, round(3 * k)))); full[hole, 3] = 255
    was = full[..., 3].copy()
    over = UNDER[part[:-1]] + ('' if UNDER[part[:-1]] in ('pelvis', 'torso') else part[-1])
    cover = None; behind = over in images and images.index(over) > images.index(part)
    if behind and part[:4] in ('uarm', 'uleg'):       # elbows and knees keep their whole ball: cut to the upper piece, a bent joint showed slits
        cover = done[over] if over in done else Image.open(f'{S}/{pf}_{over}.png')
        cover = ndimage.binary_erosion(np.array(cover.convert('RGBA'))[..., 3] > 128, iterations=2)
    first = True
    for j, to, near in CAPS[part]:
        if part.startswith('lleg') and 'uleg' + part[-1] in images and images.index(part) > images.index('uleg' + part[-1]): continue   # from behind the calf is over the thigh
        c = np.array(J[j], float); d = np.array(J[to], float) - c; L = max(np.linalg.norm(d), 1e-6); d /= L
        ys, xs = np.nonzero(full[..., 3] > 128)
        if len(xs) < 20: continue
        al = (xs - c[0]) * d[0] + (ys - c[1]) * d[1]; pe = -(xs - c[0]) * d[1] + (ys - c[1]) * d[0]
        lo = max(0.0, float(np.percentile(al, 1.5))) if near else 0.0            # where the piece begins, past its joint
        band = (al >= lo) & (al < lo + max(8 * k, 0.12 * L))                     # the limb's width just inside the joint
        if band.sum() < 3: band = np.abs(al) < 8 * k
        if band.sum() < 3: continue
        r = (pe[band].max() - pe[band].min()) / 2 * 1.03; pc = (pe[band].max() + pe[band].min()) / 2 if lo > 2 else 0.0
        if lo > 0.8 * L: continue
        RADIUS[j] = r
        if near and first and part[:4] in ('uarm', 'uleg'):                     # its cut, smoothed (once, before anything is added)
            first = False; full = np.array(smooth_cut(Image.fromarray(full.clip(0, 255).astype(np.uint8), 'RGBA'), j, r)).astype(float)
        # An upper arm behind the body (both from behind, the far one in the three-quarter view): see below the loop
        back_arm = near and cover is not None and part.startswith('uarm')
        if back_arm: body = np.array(Image.open(f'{S}/{pf}_torso.png').getchannel('A')) > 128
        if not near and (-al).max() > 1.6 * r: continue                         # a garment hanging past this joint
        # a piece stacked in front of the one it hangs from (the near arm over the body): what is added shows at
        # rest, so its ball is no wider than the arm itself is further down (a puffed sleeve got a round lump) and
        # stays inside the figure's outline. The body carries that joint's ball as well (shoulders).
        rr = r
        if near and not behind:
            mid = (al > 0.45 * L) & (al < 0.6 * L)
            if mid.sum() > 3: rr = min(r, (pe[mid].max() - pe[mid].min()) / 2 * 1.15)
        # the work is done in a window round the joint (what lies past the joint and outside it is cut off after)
        m = int(3 * r + lo + 8); x0, y0, x1, y1 = max(int(c[0]) - m, 0), max(int(c[1]) - m, 0), min(int(c[0]) + m, FW), min(int(c[1]) + m, FH)
        t = full[y0:y1, x0:x1]; a = t[..., 3].copy(); yy, xx = np.mgrid[y0:y1, x0:x1]; Q0, Q1 = xx - c[0], yy - c[1]
        al = Q0 * d[0] + Q1 * d[1]; pe = -Q0 * d[1] + Q1 * d[0]; dist = np.hypot(Q0, Q1)
        disc = np.clip((r - dist) / 1.5 + 0.5, 0, 1)                            # 1.5 px soft edge
        if near and not behind:                     # keeps its own end; only the small ball is added, inside the figure
            ball = np.clip((rr - dist) / 1.5 + 0.5, 0, 1) * (WHOLE[y0:y1, x0:x1] > 128)
            inner = ndimage.binary_erosion(a > 200, iterations=max(2, round(3 * k))) & (al > -0.5 * r) & (al < 1.8 * r)
            # (filled from its own cloth the ball showed on the body as a disc of another shade)
            fill_from(t, (ball > 0) & (a < 250), inner); as_whole(t, (ball > 0) & (a < 250), y0, x0); t[..., 3] = np.maximum(a, 255 * ball); continue
        if near:
            tube = np.clip((r - np.abs(pe - pc * np.clip(al / max(lo, 1.0), 0, 1))) / 1.5 + 0.5, 0, 1) * (al >= 0) * (al <= lo + 0.06 * L)
            shape = np.maximum(disc * (al < 0.4 * r), tube)                     # the ball and its join to the piece
            new = near == 'new'
            inner = ndimage.binary_erosion(a > 200, iterations=max(2, round(3 * k))) & (al > lo + (0.45 * r if new else -0.5 * r)) & (al < lo + 1.8 * r)
            if new: a = np.where((shape > 0) & (al < lo + 0.3 * r), 0, a)       # all of it new
            fill_from(t, ndimage.binary_dilation((shape > 0) & (a < 250), iterations=2) & (a < 250), inner)   # also the old edge's soft pixels
            # past the joint: the ball, and whatever of the piece's own picture the piece in front does not hide at
            # rest (the point of a shoulder seen from behind: cut off with the rest, it left a notch of background)
            seen = a * ~cover[y0:y1, x0:x1] if cover is not None else 0
            t[..., 3] = np.where(al < 0, np.maximum(255 * disc, seen), np.maximum(a, 255 * shape))
            gap = ndimage.binary_closing(t[..., 3] > 200, iterations=max(3, round(2 * k))) & (t[..., 3] < 250)   # a slanted top left a slit
            fill_from(t, gap & (a < 128), inner); t[gap, 3] = 255
        else: t[..., 3] = np.where(al < 0, a * disc, a)
        YY, XX = np.mgrid[0:FH, 0:FW]; far = ((XX - c[0]) * d[0] + (YY - c[1]) * d[1] < 0); far[y0:y1, x0:x1] = False
        if near and cover is not None: far &= cover
        full[far, 3] = 0
        if back_arm:
            # Its top is filled out to one smooth, closed shape: the convex outline of the ball and the sleeve's top,
            # as far as that lies inside the figure as it stands at rest (so nothing new shows at rest). The side
            # the body hides was a staircase where the mesh was parted, with a wedge-shaped bite below the ball, and
            # the ball itself was cut off where it would have shown: a raised arm showed all that as notches, and
            # the point of the shoulder beside them as a frayed spike. What the sleeve shows past the joint at rest
            # (the top of a puff) stays on the arm and goes up with it.
            full[..., 3] = np.where(WHOLE > 128, full[..., 3], np.minimum(full[..., 3], ndimage.grey_dilation(was, size=(5, 5))))
            m = int(3.2 * r + 8); x0, y0, x1, y1 = max(int(c[0]) - m, 0), max(int(c[1]) - m, 0), min(int(c[0]) + m, FW), min(int(c[1]) + m, FH)
            t = full[y0:y1, x0:x1]; a = t[..., 3]; solid = a > 128; yy, xx = np.mgrid[y0:y1, x0:x1]
            top = solid & (np.hypot(xx - c[0], yy - c[1]) < 3.2 * r); rim = top & ~ndimage.binary_erosion(top)
            py, px = np.nonzero(rim); hull = Image.new('L', (x1 - x0, y1 - y0), 0)
            if len(px) > 8:
                from scipy.spatial import ConvexHull
                pts = np.stack([px, py], 1); ImageDraw.Draw(hull).polygon([tuple(map(float, pts[i])) for i in ConvexHull(pts).vertices], fill=255)
            add = (np.array(hull) > 0) & ~solid & (WHOLE[y0:y1, x0:x1] > 128)       # inside the figure: under the body, or a crack beside it
            fill_from(t, add | (ndimage.binary_dilation(add, iterations=2) & (a < 250) & (a > 8)), ndimage.binary_erosion(a > 200, iterations=max(2, round(3 * k)))); a[add] = 255
    if cover is not None and not part.startswith('uarm'): full[..., 3] = np.where(cover, full[..., 3], np.minimum(full[..., 3], ndimage.grey_dilation(was, size=(5, 5))))
    # An upper arm stacked behind the body (the far arm; both from behind) met the body's armhole edge to edge, and
    # smoothing its cut opened that into a slit of background from the shoulder down. Its cloth is carried on across
    # the slit and a little under the body's picture.
    if part.startswith('uarm') and behind and 'sh' + part[-1] in RADIUS:
        r = RADIUS['sh' + part[-1]]; c = np.array(J['sh' + part[-1]], float); n = max(4, round(6 * k))
        m = int(2.6 * r + 8); x0, y0, x1, y1 = max(int(c[0]) - m, 0), max(int(c[1]) - m, 0), min(int(c[0]) + m, FW), min(int(c[1]) + m, FH)
        t = full[y0:y1, x0:x1]; a = t[..., 3]; yy, xx = np.mgrid[y0:y1, x0:x1]
        body = np.array(Image.open(f'{S}/{pf}_torso.png').getchannel('A'))[y0:y1, x0:x1] > 128
        band = ndimage.binary_dilation(a > 128, iterations=n) & body & (a < 250) & (np.hypot(xx - c[0], yy - c[1]) < 2.4 * r)   # under the body only: what is open beside it is the body's (mend)
        fill_from(t, band, ndimage.binary_erosion(a > 200, iterations=max(2, round(3 * k)))); a[band] = 255
    if part.startswith('larm') and 'wr' + part[-1] in RADIUS:      # the cuff's end: scraps of the ring into the hand, a frayed edge when the hand is hidden
        return smooth_cut(Image.fromarray(full.clip(0, 255).astype(np.uint8), 'RGBA'), 'wr' + part[-1], RADIUS['wr' + part[-1]])
    return Image.fromarray(full.clip(0, 255).astype(np.uint8), 'RGBA')
# The shoulder on the body. An arm stacked in front of the body (the near arm in the three-quarter view, both arms
# from the front) hides the armhole in the body's picture at rest; when the arm swings away the body must show a
# shoulder there, not a hole or the edge of the cut. The body gets the arm's own top (the disc round the shoulder
# joint, as the arm's picture has it at rest), so a raised arm turns on a shoulder of its own cloth; the armhole
# next to it is closed with the sleeve's colour. (An earlier version painted this place in the median colour of the
# body round the shoulder: white on a black coat, cream on a brown vest.)
def shoulders(im, arms):
    full = np.array(im).astype(float); FH, FW = full.shape[:2]
    for s, arm in arms.items():
        sh = np.array(J['sh' + s], float); r = RADIUS.get('sh' + s)
        if r is None: continue
        m = int(4 * r + 8); x0, y0, x1, y1 = max(int(sh[0]) - m, 0), max(int(sh[1]) - m, 0), min(int(sh[0]) + m, FW), min(int(sh[1]) + m, FH)
        t = full[y0:y1, x0:x1]; u = np.array(arm)[y0:y1, x0:x1].astype(float); yy, xx = np.mgrid[y0:y1, x0:x1]
        dist = np.hypot(xx - sh[0], yy - sh[1]); a = t[..., 3]; near = dist < 2.6 * r
        # the armhole: its rim's thin lines go, and the notch it leaves in the body is closed with the sleeve's cloth
        n = max(2, round(2.5 * k)); solid = a > 128
        clean = ndimage.binary_dilation(ndimage.binary_opening(solid, iterations=n), iterations=n + 2) & solid
        a[near & solid & ~clean] = 0
        closed = ndimage.binary_closing(np.pad(clean, m, mode='edge'), iterations=int(1.5 * r))[m:-m, m:-m]
        hole = closed & ~clean & (dist < 2.2 * r) & ndimage.binary_dilation(u[..., 3] > 128, iterations=int(0.3 * r) + 2)   # under the arm as it hangs, and a little round it
        ball = (u[..., 3] > 200) & (dist < r)
        if hole.any() and ball.sum() > 20:
            t[hole, :3] = np.median(u[ball, :3], axis=0); t[hole, 3] = 255
        ua = u[..., 3:4] / 255 * np.clip((r - dist) / 1.5 + 0.5, 0, 1)[..., None]
        t[..., :3] = u[..., :3] * ua + t[..., :3] * (1 - ua); t[..., 3] = np.maximum(t[..., 3], 255 * ua[..., 0])
        # Seen from the front, a wide sleeve hangs beside the body from the shoulder down, and as soon as the arm
        # swings out a little (the clap) a wedge of background opened between the two, from the shoulder's ball
        # down. The body keeps a strip of the sleeve as it hangs at rest, widest at the shoulder and running out
        # below it: hidden under the arm at rest, it closes that wedge. Only where sleeve and body are one garment.
        if M['kind'] in ('f', 'fb'):
            # (all that the figure has there: the sleeve, and what lies between it and the body, see `mend`; nothing
            # above the joint, where it would stand out beside a raised arm)
            tor = t[..., 3] > 128; ar = u[..., 3] > 128; dy = yy - sh[1]; fig = WHOLE[y0:y1, x0:x1] > 128
            wide = 0.6 * r * np.clip((3 * r - dy) / (1.5 * r), 0, 1) * np.clip((dy + 0.5 * r) / (0.5 * r), 0, 1)
            strip = fig & ~tor & (ndimage.distance_transform_edt(~tor) <= wide) & ndimage.binary_dilation(ar, iterations=int(0.6 * r))
            edge = tor & ndimage.binary_dilation(strip, iterations=max(4, round(4 * k)))
            if (strip & ar).sum() > 20 and edge.sum() > 20 and np.abs(np.median(u[strip & ar, :3], axis=0) - np.median(t[edge, :3], axis=0)).max() < 50:
                t[strip, :3] = np.where(ar[strip][:, None], u[strip, :3], WHOLE_RGB[y0:y1, x0:x1][strip]); t[strip, 3] = 255
    return Image.fromarray(full.clip(0, 255).astype(np.uint8), 'RGBA')
# Collars. Each head picture reaches a little past the neck into the body picture behind it, so it carries a piece of
# collar (and long hair hanging down the back). Bowing the head deeply (picking something up) swung the collar piece
# out behind the neck like a ribbon. What a head picture holds below the neck is moved into the body picture: it
# looks the same at rest and now moves with the body. A beard reaching below the neck (A01) stays with the head.
# The head's picture fades out over a few pixels below that line instead of ending on it: cut on the line, the two
# pictures met edge to edge and a hairline of background showed across the hair.
BEARD = {'A01'}
def neck_depth(shape):                         # pixels below the neck line (positive below)
    H, W = shape[:2]; yy, xx = np.mgrid[0:H, 0:W]; nk, hd = np.array(J['neck']), np.array(J['head']); up = (hd - nk) / max(np.linalg.norm(hd - nk), 1e-6)
    return -((xx - nk[0]) * up[0] + (yy - nk[1]) * up[1])
HEAD0 = np.array(Image.open(f'{S}/{pf}_head_{heads[0]}.png').convert('RGBA')).astype(float)
DEPTH = neck_depth(HEAD0.shape); FADE = 10 * k
BELOW = (DEPTH > 0) & (HEAD0[..., 3] > 8) if M['id'] not in BEARD else np.zeros(HEAD0.shape[:2], bool)
def collar(im):
    if M['id'] in BEARD: return im
    t = np.array(im).astype(float); t[..., 3] *= np.clip(1 - DEPTH / FADE, 0, 1); return Image.fromarray(t.clip(0, 255).astype(np.uint8), 'RGBA')
# Long hair is cut in two by this (the head's part turns with the head). So that no gap opens across a lock when the
# head turns, the body's copy of the hair reaches a little above the line as well, hidden behind the head at rest.
HAIR = np.array(Image.open(f'{S}/{pf}_head_hair.png').getchannel('A')) > 128 if os.path.exists(f'{S}/{pf}_head_hair.png') else np.zeros(HEAD0.shape[:2], bool)
if M['id'] not in BEARD: BELOW |= HAIR & (DEPTH > -16 * k) & (HEAD0[..., 3] > 8)
def body_collar(im):                                  # the head's below-neck pixels laid over the body picture
    t = np.array(im).astype(float); h = HEAD0; a = h[..., 3:4] / 255 * BELOW[..., None]
    t[..., :3] = h[..., :3] * a + t[..., :3] * (1 - a); t[..., 3] = np.maximum(t[..., 3], h[..., 3] * BELOW)
    return Image.fromarray(t.clip(0, 255).astype(np.uint8), 'RGBA')
# Stray lines. A piece drawn alone is open where it was cut, and through the opening the far rim of the garment
# shows as a thin line outside the piece's own shape (the far side of a waistband above the hips). Whatever of a body
# piece is thinner than a few pixels is removed.
# The body in front of an arm (an arm stacked behind it): along the armhole its picture has thin
# open slits between the cloth and the far rim's outline. At rest the sleeve behind shows through them; with the arm
# raised the background did, as pale notches down the body's side. They are closed with the cloth next to them.
def armhole(im, s):
    if 'sh' + s not in RADIUS: return im
    full = np.array(im).astype(float); FH, FW = full.shape[:2]; c = np.array(J['sh' + s], float); r = RADIUS['sh' + s]; e = np.array(J['el' + s], float)
    x0, y0, x1, y1 = max(int(min(c[0], e[0]) - 3 * r), 0), max(int(c[1] - 2.5 * r), 0), min(int(max(c[0], e[0]) + 3 * r), FW), min(int(e[1] + r), FH)
    t = full[y0:y1, x0:x1]; a = t[..., 3]; solid = a > 128; n = max(3, round(3 * k))
    slit = ndimage.binary_closing(np.pad(solid, n + 1), iterations=n)[n + 1:-n - 1, n + 1:-n - 1] & ~solid & (WHOLE[y0:y1, x0:x1] > 128)
    fill_from(t, slit | (ndimage.binary_dilation(slit, iterations=2) & (a < 250) & (a > 8)), ndimage.binary_erosion(a > 200, iterations=max(2, round(3 * k)))); a[slit] = 255
    return Image.fromarray(full.clip(0, 255).astype(np.uint8), 'RGBA')
# Closed at rest. Round the shoulders, whatever of the whole figure's picture no piece covers as the pieces stand at
# rest is added in the figure's own colours: the top of a puffed sleeve that neither the body's nor the arm's part
# of the mesh drew (a wedge of background between sleeve and body, even standing still), the outline along the top
# of a sleeve. What lies against an arm goes to that arm (stacked in front of the body only if sleeve and body are
# one garment: on the body the sleeve's point stood out as a wing under the raised arm, on the arm it turns in over
# the body where it does not show); the rest goes to the body if it lies against it. Hairlines along outlines and
# specks are left out: they would hang in the air once the arm moves away.
def mend(im, pieces, front, behind):
    arms = {}; R_ = [RADIUS['sh' + s] for s in 'LR' if 'sh' + s in RADIUS]
    if not R_: return im, arms
    m = int(4 * max(R_) + 4); xs = [J['sh' + s][0] for s in 'LR']; ys = [J['sh' + s][1] for s in 'LR']
    x0, y0, x1, y1 = max(int(min(xs)) - m, 0), max(int(min(ys)) - m, 0), min(int(max(xs)) + m, im.width), min(int(max(ys)) + m, im.height); box = (x0, y0, x1, y1)
    full = np.array(im.crop(box)).astype(np.float32); cov = full[..., 3].copy(); whole = WHOLE[y0:y1, x0:x1]
    for q in pieces: cov = np.maximum(cov, np.array(q.crop(box).getchannel('A'), np.float32))
    gap = (whole > 128) & (cov < 128); near = np.zeros_like(gap); YY, XX = np.mgrid[y0:y1, x0:x1]
    dist = {s: np.hypot(XX - J['sh' + s][0], YY - J['sh' + s][1]) for s in 'LR' if 'sh' + s in RADIUS}
    for s, d in dist.items(): near |= d < 4 * RADIUS['sh' + s]
    gap &= near; core = ndimage.binary_opening(gap, iterations=1)
    gap &= ndimage.binary_dilation(core, iterations=max(3, round(2 * k)))
    lab, n = ndimage.label(gap); print(pf, 'mended at the shoulders:', int(gap.sum()), 'px in', n)
    if not gap.any(): return im, arms
    wh = np.array(Image.open(f'{S}/{pf}_whole.png').convert('RGBA').crop(box)).astype(np.float32)
    def give(t, g):
        soft = ndimage.binary_dilation(g, iterations=1) & (t[..., 3] < 250) & (whole > 128)       # and the soft edge it meets
        t[soft, :3] = wh[soft, :3]; t[soft, 3] = np.maximum(t[soft, 3], wh[soft, 3]); t[g, 3] = 255
    def back(src_im, t):
        out = src_im.copy(); out.paste(Image.fromarray(t.clip(0, 255).astype(np.uint8), 'RGBA'), (x0, y0)); return out
    for s, arm in list(front.items()) + list(behind.items()):
        if s not in dist: continue
        u = np.array(arm.crop(box)).astype(np.float32); d = dist[s]; r = RADIUS['sh' + s]
        mine, body = (u[..., 3] > 200) & (d < 2.5 * r), (full[..., 3] > 200) & (d < 2.5 * r)
        if s in front and (mine.sum() < 20 or body.sum() < 20 or np.abs(np.median(u[mine, :3], axis=0) - np.median(full[body, :3], axis=0)).max() > 50): continue
        ids = np.unique(lab[gap & ndimage.binary_dilation(u[..., 3] > 128, iterations=3) & (d < 4 * r)]); g = np.isin(lab, ids[ids > 0]) & gap
        if g.any(): give(u, g); gap &= ~g; arms[s] = back(arm, u); print(pf, ' of that to the arm', s, int(g.sum()))
    lab, n = ndimage.label(gap); touch = np.unique(lab[gap & ndimage.binary_dilation(full[..., 3] > 128, iterations=3)])   # what is left must lie against the body:
    gap &= np.isin(lab, touch[touch > 0])                                   # a speck beside a sleeve's cuff would be left hanging there when the arm goes up
    give(full, gap)
    return back(im, full), arms
def despeck(im, r=None):
    r = r or max(2, round(2.5 * k)); t = np.array(im); a = t[..., 3] > 96
    core = ndimage.binary_dilation(ndimage.binary_opening(a, iterations=r), iterations=r + 2)
    t[..., 3] = np.where(core, t[..., 3], 0); return Image.fromarray(t, 'RGBA')
os.makedirs(f'{O}/{pf}', exist_ok=True); crops = {}
def opaque(p):                                # a layer can be empty: no thigh under a long skirt
    return Image.open(f'{S}/{pf}_{src.get(p, p)}.png').getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox() is not None
images = [p for p in images if opaque(p)]
# A long skirt in a bow (three-quarter view). Its picture turns forward with the thighs on the hip joints and reaches
# well above them, up to the waist, where the body's picture ends. Bowing to pick something up, the body leans
# forward from the hips while the skirt's top stayed upright and swung back with the thighs: a square flap stood out
# behind the waist. For the bow the skirt is drawn as two pictures, shown instead of the one while it lasts
# (rive_build): the waistband (waist_bow), from the waist to a little below the hip joints, which bends between the
# hips and the body as the body's own picture does, and behind it the skirt from the hip line down
# (pelvis_bow), which turns on the back of the seat (SEAT). Sitting and walking keep the one picture: its top, turned
# back under the body, is the seat she sits on.
def store(p, im):
    bb = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    pad = 2; bb = (max(bb[0] - pad, 0), max(bb[1] - pad, 0), min(bb[2] + pad, im.width), min(bb[3] + pad, im.height))
    c = im.crop(bb); c.save(f'{O}/{pf}/{p}.png', optimize=True); c.save(f'{O}/{pf}/{p}.webp', quality=90, method=6)
    crops[p] = {'x': (bb[0] + bb[2]) / 2, 'y': (bb[1] + bb[3]) / 2, 'w': bb[2] - bb[0], 'h': bb[3] - bb[1],
                'png': os.path.getsize(f'{O}/{pf}/{p}.png'), 'webp': os.path.getsize(f'{O}/{pf}/{p}.webp')}
SEAT = []
def waistband(im):
    if M['kind'] != 'q' or 'ulegL' in images or 'ulegR' in images: return
    t = np.array(im).astype(float); a = t[..., 3]; y0 = (J['hipL'][1] + J['hipR'][1]) / 2
    yy = np.mgrid[0:a.shape[0], 0:a.shape[1]][0]; row = np.nonzero(a[int(y0)] > 128)[0]
    wb = t.copy(); wb[..., 3] = a * np.clip((y0 + 14 * k - yy) / (12 * k), 0, 1)
    if len(row) < 20 or (wb[..., 3] > 128).sum() < 200: return
    right = J['toR'][0] + J['toL'][0] > J['anR'][0] + J['anL'][0]                 # which way the figure faces
    SEAT[:] = [float(row[0] + 6 * k if right else row[-1] - 6 * k), float(y0)]   # where the skirt's back edge crosses the hip line
    done['waist_bow'] = Image.fromarray(wb.clip(0, 255).astype(np.uint8), 'RGBA')
    t[..., 3] = a * np.clip((yy - (y0 - 10 * k)) / (8 * k), 0, 1); done['pelvis_bow'] = Image.fromarray(t.clip(0, 255).astype(np.uint8), 'RGBA')
done = {}
rank = lambda p: 3 if p == 'torso' else 2 if p == 'pelvis' else 1 if p[:4] in ('larm', 'lleg') else 0
for p in sorted(images, key=lambda p: (rank(p), p)):       # forearms and calves after what they hang from; the body last: it takes the arms' shoulders
    im = Image.open(f'{S}/{pf}_{src.get(p, p)}.png').convert('RGBA')
    if p == 'pelvis' or p.split('_')[0] in CAPS: im = despeck(im)
    if p in CAPS: im = cap(im, p)
    if p == 'pelvis':                                  # the stubs of its ring into the thighs: a zigzag under the seat when the thighs lift
        for s_ in 'LR':
            if 'hip' + s_ in RADIUS: im = smooth_cut(im, 'hip' + s_, RADIUS['hip' + s_])
        waistband(im)
    if p == 'torso':
        front = {s: done['uarm' + s] for s in 'LR' if 'uarm' + s in done and images.index('uarm' + s) > images.index('torso')}
        im = body_collar(shoulders(im, front))        # hair that hangs over a shoulder stays in front of it
        for s_ in 'LR':                               # over an arm stacked behind it, the body's own cut at the shoulder: no teeth
            if 'uarm' + s_ in done and s_ not in front and 'sh' + s_ in RADIUS: im = smooth_cut(armhole(im, s_), 'sh' + s_, RADIUS['sh' + s_], 1.4)
        im, arms = mend(im, [q for n_, q in done.items() if n_ not in src and (not n_.startswith('head_') or n_ == 'head_' + heads[0])], front,
                        {s_: done['uarm' + s_] for s_ in 'LR' if 'uarm' + s_ in done and s_ not in front})
        for s_, q in arms.items(): done['uarm' + s_] = q; store('uarm' + s_, q)
    if p.startswith('head_'): im = collar(im)
    done[p] = im; store(p, im)
for q_ in ('waist_bow', 'pelvis_bow'):            # stacked: skirt, the bow's skirt, the bow's waistband
    if q_ in done: store(q_, done[q_]); images.insert(images.index('pelvis') + 1, q_)
anims = {}
gaits = [g for g in ('walk', 'run') if os.path.exists(f'{S}/{pf}_anim_{g}.json')]
for name, mode in [('idle', 'idle')] + [(g, g) for g in gaits] + [(a['name'], a['mode']) for a in M['actions']]:
    A = json.load(open(f'{S}/{pf}_anim_{mode}.json')); F = [mid(fix_top(f)) for f in A['frames']]
    if name in ('walk', 'run'): n = round(A['T'] / A['dt']); F = F[-n - 1:]   # the last stride, closing the loop
    if name == 'idle': F = F[:60]
    anims[name] = {'dt': A['dt'], 'frames': F, 'hands': next((a['hands'] for a in M['actions'] if a['name'] == name), [])}
# held states: sit down, sitting, stand up; pick up, holding, and put down = pick up backwards. swap: from which frame
# the posed hand (the grip) shows
for q in M.get('seqs', []):
    A = json.load(open(f'{S}/{pf}_anim_{q["name"]}.json')); F = [mid(fix_top(f)) for f in A['frames']]
    # swaps: [drawing, first frame it shows, frame it goes again or None]
    sw = q.get('swaps') or ([[q.get('hand', 'handR'), q['swapFrom']]] if 'swapFrom' in q else [])
    anims[q['name']] = {'dt': A['dt'], 'frames': F, 'loop': bool(q.get('loop')), 'swaps': [[f'{h}_pick', f0, None] for h, f0 in sw if f'{h}_pick' in images]}
    # the bow's skirt and waistband, from just after it begins until she stands upright again
    if q['name'] == 'pickup' and 'waist_bow' in done: anims['pickup']['swaps'] += [[b_, 3, len(F) - 3] for b_ in ('pelvis_bow', 'waist_bow')]
if 'pickup' in anims:
    p = anims['pickup']; n = len(p['frames'])
    anims['putdown'] = {'dt': p['dt'], 'frames': p['frames'][::-1], 'loop': False, 'swaps': [[h, 0 if f1 is None else n - f1, n - f0] for h, f0, f1 in p['swaps']]}
# the artboard's height in metres (cast.js orthoCam: the figure's top times 1.18); older renders lack it in the rig
TOP = {'C01': 1.1042, 'C02': 1.245, 'C03': 1.0921, 'C04': 1.1999, 'A01': 1.4931, 'A02': 1.8065, 'A03': 1.6743, 'A04': 1.4598, 'A05': 1.8649, 'A06': 1.6545}
metres = rig.get('metres') or TOP[M['id']] * 1.18
json.dump({'id': M['id'], 'viewKey': M['view'], 'view': rig['view'], 'radius': RADIUS, 'seat': SEAT if 'waist_bow' in done else None, 'W': rig['W'], 'H': rig['H'], 'k': k, 'metres': metres, 'order': images, 'heads': heads,
           'crops': crops, 'joints': J, 'anims': anims}, open(f'{O}/{pf}.json', 'w'))
print(pf, 'images', len(images), 'webp KB', round(sum(c['webp'] for c in crops.values()) / 1024), 'anims', {a: len(v['frames']) for a, v in anims.items()})
# check picture: the layers stacked in order (first face, no posed hands) next to the whole figure
st = Image.new('RGBA', (rig['W'], rig['H']), (243, 233, 216, 255))
for p in images:
    if (p.startswith('head_') and p != 'head_' + heads[0]) or p in src: continue
    st.alpha_composite(done[p])
wh = Image.new('RGBA', (rig['W'], rig['H']), (243, 233, 216, 255)); wh.alpha_composite(Image.open(f'{S}/{pf}_whole.png').convert('RGBA'))
both = Image.new('RGB', (rig['W'] * 2, rig['H'])); both.paste(st, (0, 0)); both.paste(wh, (rig['W'], 0))
both.resize((rig['W'] // 2, rig['H'] // 4)).save(f'{O}/{pf}_stack.jpg', quality=85)
