"""Build Liv's three-quarter rig for Rive: writes tools/liv/rive/liv-tq/scene.rml (and pose.luau).

    python3 tools/liv/rive/cut_tq.py && python3 tools/liv/rive/build_tq.py
    cd tools/liv/rive/liv-tq && rive . --verify       # compile check
    rive .                                            # live preview with pose buttons

One view (three-quarter) first, as the hand-over asks. Everything is image layers from the pack on skinned meshes
(parts/*.png), plus the limbs cut by cut_tq.py (tq/*.png) and the six hand poses (parts/hand_*.png). View pixels
throughout: 1024 x 1536, 996 px = 1 m. The character node scales them to the stage.

Rig (native Rive): pelvis -> spine -> head; arms upper -> fore -> hand with a two-bone IK constraint toward a hand
target; legs thigh -> shin -> foot with a two-bone IK constraint toward a foot target. The sleeve is a mesh skinned
from the torso (at the shoulder seam), through two helper bones that copy one third and two thirds of the upper arm's
rotation (rotation constraints), to the arm (at the cuff). The controller (pose.luau) only sets view-model numbers.
"""
from pathlib import Path
import base64, json, math
import xml.etree.ElementTree as E
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
OUTD = HERE / 'liv-tq'; OUTD.mkdir(exist_ok=True)
PARTS = json.loads((HERE / 'parts/parts.json').read_text())
T = json.loads((HERE / 'tq/tq.json').read_text())
META = PARTS['_meta']['tq']
SCALE = .62
STAGE_W, STAGE_H = 1240, 1020
CHAR_X, CHAR_Y = 40, 36

N = 2000
def el(t, parent=None, **a):
    global N
    if 'id' not in a: N += 1; a['id'] = f'0:{N}'
    e = E.Element(t, {k: (str(v).lower() if isinstance(v, bool) else str(v)) for k, v in a.items()})
    if parent is not None: parent.append(e)
    return e

root = E.Element('Rive', version='1', kind='fragment')
assets = {}
def asset(key, rel, ident):
    assets[key] = el('ImageAsset', root, file=rel, name=key, id=f'0:{ident}').get('id')
aid = 100
for n in ['tq_head', 'tq_bootA', 'tq_bootB', 'tq_blink0', 'tq_blink1', 'tq_brow0', 'tq_mouth']:
    asset(n, f'../parts/{n}.png', aid); aid += 1
for n in ['tq_upperA', 'tq_foreA', 'tq_upperB', 'tq_foreB', 'tq_thighA', 'tq_shinA', 'tq_thighB', 'tq_shinB', 'tq_capA', 'tq_capB', 'tq_strap',
          'tq_torso_c', 'tq_sleeveA_c', 'tq_sleeveB_c', 'tq_sockA_c', 'tq_sockB_c', 'tq_apron', 'tq_skirtred', 'tq_slip', 'tq_chemise']:   # cloth: re-toned by cut_cloth.py
    asset(n, f'../tq/{n}.png', aid); aid += 1
for n in ['relaxed', 'palm', 'fist', 'point', 'thumb', 'back']:
    asset('hand_' + n, f'../parts/hand_{n}.png', aid); aid += 1
asset('satchel', '../parts/satchel.png', aid); aid += 1

ab = el('Artboard', root, name='Liv three-quarter', width=STAGE_W, height=STAGE_H, defaultStateMachineId='0:7', styleId='0:5', id='0:2')
el('LayoutComponentStyle', ab, name='Artboard style', id='0:5')
f = el('Fill', ab, name='Studio'); el('SolidColor', f, colorValue='FFF3EBDD')
char = el('Node', ab, name='Liv', x=CHAR_X, y=CHAR_Y, scaleX=SCALE, scaleY=SCALE, id='0:10')

# ---------------------------------------------------------------- bones
bones, bind, world = {}, {}, {}
FOOT_W = {}
def ang(a, b): return math.atan2(b[1] - a[1], b[0] - a[0])
def bone(name, p, end, parent=None, root_bone=True, holder=None, rotation=None):
    """A RootBone (positioned in its parent's frame) or a chained Bone (sits at its parent's tip).
    rotation: use this local rotation instead of the one that points the bone at `end` (the bind pose stays the same:
    the bone is then expected to be turned to its bind direction by a constraint)."""
    w = ang(p, end) if end != p else 0.0
    pw = world[parent][2] if parent else 0.0
    po = world[parent][0] if parent else (0.0, 0.0)
    a = (w - pw) if rotation is None else rotation
    a = (a + math.pi) % (2 * math.pi) - math.pi            # |rotation| <= pi: constraints that copy it must not meet the wrap
    if root_bone:
        d = (p[0] - po[0], p[1] - po[1]); c, s = math.cos(pw), math.sin(pw)
        b = el('RootBone', bones[parent] if parent else (holder if holder is not None else char), name=name, x=c * d[0] + s * d[1], y=-s * d[0] + c * d[1], rotation=a, length=math.dist(p, end))
    else:
        b = el('Bone', bones[parent], name=name, rotation=a, length=math.dist(p, end))
    bones[name] = b; world[name] = (p, end, w)
    bind[name] = (math.cos(w), math.sin(w), -math.sin(w), math.cos(w), p[0], p[1])
    return b

pel = tuple(T['pelvis']); neck = tuple(T['neck']); head_top = (neck[0] + 4, 180)
bone('pelvis', pel, pel)
bone('spine', pel, neck, 'pelvis')
bone('head', neck, head_top, 'spine')
SIDES = ['A', 'B']
for sd in SIDES:
    a = T[sd]
    # 'shoulder' is a zero-length bone that carries the arm's bind direction, so the upper arm's own rotation is 0 at
    # rest and never meets the +-pi wrap that rotation constraints (the sleeve helpers) cannot follow
    bone(f'sh{sd}', tuple(a['sh']), tuple(a['elbow']), 'spine')
    bone(f'upper{sd}', tuple(a['sh']), tuple(a['elbow']), f'sh{sd}')
    bone(f'fore{sd}', tuple(a['elbow']), tuple(a['wrist']), f'upper{sd}', False)
    wr = np.array(a['wrist']); u = np.array(a['dir'])
    bone(f'hand{sd}', tuple(wr), tuple(wr + u * 70), f'fore{sd}', False)
    # sleeve helpers: sit at the shoulder, bind-pointing along the arm, but their rotation attribute is only the
    # remainder: a rotation constraint adds the share of the upper arm's turn (see below)
    for h, share in (('1', 1 / 3), ('2', 2 / 3)):
        bone(f'slv{sd}{h}', tuple(a['sh']), tuple(a['elbow']), f'sh{sd}', rotation=0.0)
for sd in SIDES:
    hip, knee, ank = tuple(T['hip' + sd]), tuple(T['knee' + sd]), tuple(T['ankle' + sd])
    bone(f'thigh{sd}', hip, knee, 'pelvis')
    bone(f'shin{sd}', knee, ank, f'thigh{sd}', False)
    toe = (ank[0] + 70, ank[1] + 78)
    bone(f'foot{sd}', ank, toe, f'shin{sd}', False)
    FOOT_W[sd] = ang(ank, toe)

# secondary motion: hair (child of the head), skirt (child of the pelvis), satchel on its strap (child of the pelvis)
bone('hair', (452, 232), (440, 420), 'head')
bone('skirt', (510, 770), (510, 1090), 'pelvis')
bone('skirtL', (420, 770), (330, 1090), 'pelvis'); bone('skirtR', (600, 770), (700, 1090), 'pelvis')       # the hem flutters in three parts
bone('apron1', (510, 748), (510, 905), 'pelvis'); bone('apron2', (510, 905), (510, 1072), 'apron1', False)  # the apron hangs from the waistband and bends
BAG_B = (438, 800)                                      # where the strap ends (the pack's bag point for this view)
bone('satchel', (BAG_B[0], BAG_B[1] + 2), (BAG_B[0], BAG_B[1] + 110), 'pelvis')
# IK targets: nodes in character space, driven by the controller (view model)
targets = {}
for sd in SIDES:
    targets['hand' + sd] = el('Node', char, name=f'hand {sd} target', x=T[sd]['wrist'][0], y=T[sd]['wrist'][1])
    targets['foot' + sd] = el('Node', char, name=f'foot {sd} target', x=T['ankle' + sd][0], y=T['ankle' + sd][1], rotation=FOOT_W[sd])
# arms bend so the elbow points down and out; legs: knee toward the way she faces (viewer's right)
INV = {'handA': False, 'handB': False, 'footA': True, 'footB': True}
for sd in SIDES:
    el('IKConstraint', bones[f'fore{sd}'], name=f'arm {sd} IK', targetId=targets['hand' + sd].get('id'), parentBoneCount=1, invertDirection=INV['hand' + sd], strength=1)
    el('IKConstraint', bones[f'shin{sd}'], name=f'leg {sd} IK', targetId=targets['foot' + sd].get('id'), parentBoneCount=1, invertDirection=INV['foot' + sd], strength=1)
    # the foot keeps the angle the controller gives it (world rotation of the foot target), whatever the shin does
    el('RotationConstraint', bones[f'foot{sd}'], name=f'foot {sd} level', targetId=targets['foot' + sd].get('id'), copyFactor=1, offset=False, sourceSpaceValue='world', destSpaceValue='world', strength=1)
    for h, share in (('1', 1 / 3), ('2', 2 / 3)):
        el('RotationConstraint', bones[f'slv{sd}{h}'], name=f'sleeve {sd} {h}', targetId=bones[f'upper{sd}'].get('id'), copyFactor=round(share, 4),
           offset=True, sourceSpaceValue='local', destSpaceValue='local', strength=1)

# ---------------------------------------------------------------- meshes
def varuint(n):
    out = []
    while n > 127: out.append((n & 127) | 128); n >>= 7
    return bytes(out + [n])
def weight_el(parent, pairs):
    pairs = [(i, w) for i, w in pairs if w > 1e-4][:4]
    vals = [int(round(w * 255)) for _, w in pairs]; vals[vals.index(max(vals))] += 255 - sum(vals)
    v = sum(val << (8 * k) for k, val in enumerate(vals)); idx = sum((i + 1) << (8 * k) for k, (i, _) in enumerate(pairs))
    el('Weight', parent, values=v, indices=idx)
def mesh(name, key, pts, uvs, tris, influences, weights, holder=None):
    im = el('Image', holder if holder is not None else char, name=name, assetId=assets[key], originX=0, originY=0)
    m = el('Mesh', im, name=name + ' mesh', triangleIndexBytes=base64.b64encode(b''.join(varuint(int(i)) for t in tris for i in t)).decode())
    for i, ((x, y), (u, v)) in enumerate(zip(pts, uvs)):
        vert = el('MeshVertex', m, x=round(x, 3), y=round(y, 3), u=round(u, 5), v=round(v, 5))
        weight_el(vert, weights(x, y))
    skin = el('Skin', m, name=name + ' skin', tx=0, ty=0)
    for b in influences:
        xx, xy, yx, yy, tx, ty = bind[b]
        el('Tendon', skin, boneId=bones[b].get('id'), name=b, xx=xx, xy=xy, yx=yx, yy=yy, tx=tx, ty=ty)
    return im
def cl(v): return min(1.0, max(0.0, v))
def smooth(t): t = cl(t); return t * t * (3 - 2 * t)
def grid(name, key, box, nx, ny, influences, wts, holder=None):
    x, y, w, h = box
    pts = [(x + w * i / nx, y + h * j / ny) for j in range(ny + 1) for i in range(nx + 1)]
    tris = []
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i; tris += [(a, a + 1, a + nx + 2), (a, a + nx + 2, a + nx + 1)]
    return mesh(name, key, pts, [((px - x) / w, (py - y) / h) for px, py in pts], tris, influences, wts, holder)
def rigid(name, key, box, bone_name, holder=None):
    x, y, w, h = box
    return mesh(name, key, [(x, y), (x + w, y), (x + w, y + h), (x, y + h)], [(0, 0), (1, 0), (1, 1), (0, 1)], [(0, 1, 2), (0, 2, 3)], [bone_name], lambda *_: [(0, 1)], holder)
def box_of(n): p = PARTS[n]; return [p['x'], p['y'], p['w'], p['h']]
def img_size(path): return Image.open(path).size

# head: rigid on the head bone. Face overlays (blink, brow, mouth) come with the expression step.
def head_w(px, py):
    # the face and scalp follow the head; the hair away from the face (back, side, ends) hangs from a hair bone
    dx, dy = (px - 545) / 120, (py - 335) / 150
    d = math.hypot(dx, dy)
    w = smooth((d - 1.0) / .55) * (1.0 if (px < 560 or py < 230) else .35) * smooth((py - 150) / 90)
    return [(0, 1 - w), (1, w)]
head = grid('Liv head', 'tq_head', box_of('tq_head'), 12, 12, ['head', 'hair'], head_w)
lids = [rigid(f'Liv closed eye {i}', f'tq_blink{i}', box_of(f'tq_blink{i}'), 'head') for i in (0, 1)]    # skin patches with the closed lash line, over the open eyes

# sleeves: torso at the seam (shoulder side), helpers along the sleeve, upper arm from the cuff
def sleeve(sd):
    a = T[sd]; sh = np.array(a['sh']); u = np.array(a['dir']); el_ = np.array(a['elbow'])
    bx = box_of('tq_sleeve' + sd)
    def wts(px, py):
        t = ((px - sh[0]) * u[0] + (py - sh[1]) * u[1])        # along the arm from the shoulder joint
        k = smooth((t + 4) / 62) * 3                            # 0 at the shoulder seam .. 3 at the cuff
        inf = [f'upper{sd}', f'slv{sd}1', f'slv{sd}2', 'spine']
        if k <= 1: return [(3, 1 - k), (1, k)]
        if k <= 2: return [(1, 2 - k), (2, k - 1)]
        return [(2, 3 - k), (0, k - 2)]
    return grid(f'Liv sleeve {sd}', 'tq_sleeve' + sd + '_c', bx, 10, 10, [f'upper{sd}', f'slv{sd}1', f'slv{sd}2', 'spine'], wts)
sleeves = {sd: sleeve(sd) for sd in SIDES}
caps = {sd: rigid(f'Liv shoulder cap {sd}', 'tq_cap' + sd, box_of('tq_sleeve' + sd), 'spine') for sd in SIDES}

# arms
arm_imgs = {}
for sd in SIDES:
    a = T[sd]
    arm_imgs[sd] = {
        'upper': rigid(f'Liv upper arm {sd}', f'tq_upper{sd}', a['upper'], f'upper{sd}'),
        'fore': rigid(f'Liv forearm {sd}', f'tq_fore{sd}', a['fore'], f'fore{sd}'),
    }

# hands: six poses as sprites on the hand bone, one visible at a time (opacity per pose)
HAND_SCALE = 996 / PARTS['hand_relaxed']['ppm'] * 1.1
HAND_POSES = ['relaxed', 'palm', 'fist', 'point', 'thumb', 'back']
def make_hand(sd, pose, tag=''):
    a = T[sd]; wr = np.array(a['wrist']); u = np.array(a['dir']); bone_ang = math.atan2(u[1], u[0])
    hp = PARTS['hand_' + pose]; w_, h_ = hp['w'], hp['h']; ax, ay = hp['ax'], hp['ay']
    nat = math.atan2(hp['fwd'][1], hp['fwd'][0]); rot = bone_ang - nat
    c, s_ = math.cos(rot), math.sin(rot)
    flip = -1 if sd == 'B' else 1                               # the drawn hands are one hand: mirror the other
    def P(lx, ly): lx, ly = (lx - ax) * HAND_SCALE, ((ly - ay) * HAND_SCALE) * flip; return (wr[0] - 8 * u[0] + lx * c - ly * s_, wr[1] - 8 * u[1] + lx * s_ + ly * c)
    pts = [P(0, 0), P(w_, 0), P(w_, h_), P(0, h_)]
    return mesh(f'Liv hand {sd} {pose}{tag}', 'hand_' + pose, pts, [(0, 0), (1, 0), (1, 1), (0, 1)], [(0, 1, 2), (0, 2, 3)], [f'hand{sd}'], lambda *_: [(0, 1)])
hand_imgs = {sd: {p: make_hand(sd, p) for p in HAND_POSES} for sd in SIDES}

# torso and skirt
def torso_w(px, py):
    t = smooth((py - 520) / 240)                                # chest follows the spine, waist the pelvis
    return [(0, t), (1, 1 - t)]
def torso_ws(px, py):
    t = smooth((py - 520) / 240)                                # chest follows the spine, waist the pelvis
    return [(0, 1 - t), (1, t)]
torso = grid('Liv torso', 'tq_torso_c', box_of('tq_torso'), 6, 10, ['spine', 'pelvis'], torso_ws)
chemise = grid('Liv chemise (base layer)', 'tq_chemise', box_of('tq_torso'), 4, 6, ['spine', 'pelvis'], torso_ws)   # plain linen under the bodice, never skin
SKIRT_INF = ['pelvis', 'thighA', 'thighB', 'skirtL', 'skirt', 'skirtR']
def skirt_w(px, py):
    # at most four bones per vertex: pelvis, one or two thighs, one or two hem bones; every blend is continuous in x
    t = smooth((py - 760) / 330)                                # waist on the pelvis, the hem swings with the thighs and flutters
    s = cl((px - 360) / 300); sB = smooth((s - .25) / .5); sA = 1 - sB
    wl = cl((435 - px) / 150); wr = cl((px - 585) / 150); wc = 1 - wl - wr
    return [(0, 1 - t * .6), (1, t * .18 * sA), (2, t * .18 * sB), (3, t * .24 * wl), (4, t * .24 * wc), (5, t * .24 * wr)]
skirt = grid('Liv skirt (red)', 'tq_skirtred', box_of('tq_skirt'), 10, 10, SKIRT_INF, skirt_w)
slip = grid('Liv petticoat (base layer)', 'tq_slip', box_of('tq_skirt'), 8, 8, SKIRT_INF, skirt_w)              # plain linen under the skirt, never skin
def apron_w(px, py):
    u = smooth((py - 760) / 70)                                 # the waistband is sewn to the pelvis, the rest hangs
    v = smooth((py - 860) / 190)
    return [(0, 1 - u), (1, u * (1 - v)), (2, u * v)]
apron = grid('Liv apron', 'tq_apron', box_of('tq_skirt'), 12, 12, ['pelvis', 'apron1', 'apron2'], apron_w)
# satchel and strap
SAT_S = 996 / PARTS['satchel']['ppm']
sx0, sy0 = BAG_B[0] - PARTS['satchel']['ax'] * SAT_S, BAG_B[1] - PARTS['satchel']['ay'] * SAT_S
satchel = rigid('Liv satchel', 'satchel', [sx0, sy0, PARTS['satchel']['w'] * SAT_S, PARTS['satchel']['h'] * SAT_S], 'satchel')
STRAP_A, STRAP_B = (556, 478), (BAG_B[0], BAG_B[1] + 14)
def strap_mesh():
    a, b = np.array(STRAP_A, float), np.array(STRAP_B, float); u = (b - a) / np.linalg.norm(b - a); n = np.array([-u[1], u[0]]) * 15
    pts = [tuple(a + n), tuple(a - n), tuple(b - n), tuple(b + n)]
    # weights: the top follows the chest, the bottom the satchel; four rows so it bends
    rows = 6; pts = []; uvs = []; tris = []
    for r in range(rows + 1):
        t = r / rows; c = a + (b - a) * t
        pts += [tuple(c + n), tuple(c - n)]; uvs += [(1, 0), (0, 0)]
        if r < rows: i = r * 2; tris += [(i, i + 1, i + 3), (i, i + 3, i + 2)]
    def wts(px, py):
        t = cl(np.dot(np.array([px, py]) - a, u) / np.linalg.norm(b - a)); t = smooth((t - .55) / .45)
        return [(0, 1 - t), (1, t)]
    return mesh('Liv satchel strap', 'tq_strap', pts, uvs, tris, ['spine', 'satchel'], wts)
strap = strap_mesh()

# legs: thigh and shin are two rigid skin pieces with a round knee (a half disc with an ink arc on the thigh, a plain skin
# disc on the shin drawn over it), like the arms' elbows: no pinched, skinned bend. cut_tq.py draws them from the leg strip.
def leg_pieces(sd):
    lp = T['legpiece'][sd]; hip, knee, ank = np.array(T['hip' + sd], float), np.array(T['knee' + sd], float), np.array(T['ankle' + sd], float)
    def quad(name, key, org, to, spec, bone_name):
        u = (to - org) / np.linalg.norm(to - org); n = np.array([u[1], -u[0]]); hw = spec['cols'] / 2.0
        t0, t1 = -spec['top_ext'], spec['rows'] - spec['top_ext']
        P = lambda t, s_: tuple(org + u * t + n * s_)
        return mesh(name, key, [P(t0, -hw), P(t0, hw), P(t1, hw), P(t1, -hw)], [(0, 0), (1, 0), (1, 1), (0, 1)], [(0, 1, 2), (0, 2, 3)], [bone_name], lambda *_: [(0, 1)])
    return (quad(f'Liv thigh {sd}', f'tq_thigh{sd}', hip, knee, lp['thigh'], f'thigh{sd}'),
            quad(f'Liv shin {sd}', f'tq_shin{sd}', knee, ank, lp['shin'], f'shin{sd}'))
thighs, shins = {}, {}
for sd in SIDES: thighs[sd], shins[sd] = leg_pieces(sd)
socks = {sd: rigid(f'Liv sock {sd}', 'tq_sock' + sd + '_c', box_of('tq_sock' + sd), f'shin{sd}') for sd in SIDES}
boots = {sd: rigid(f'Liv boot {sd}', 'tq_boot' + sd, box_of('tq_boot' + sd), f'foot{sd}') for sd in SIDES}

# ---------------------------------------------------------------- draw order (first child = on top)
# the far arm (B) is behind the torso; a second copy in front is faded in when the arm swings forward or up
far_front = {}
def dup_arm(sd):
    a = T[sd]
    up = rigid(f'Liv upper arm {sd} (front)', f'tq_upper{sd}', a['upper'], f'upper{sd}')
    fo = rigid(f'Liv forearm {sd} (front)', f'tq_fore{sd}', a['fore'], f'fore{sd}')
    return up, fo
bf_up, bf_fo = dup_arm('B')
hands_front_B = {p: make_hand('B', p, ' (front)') for p in HAND_POSES}
order = [*[hand_imgs['A'][p] for p in HAND_POSES], arm_imgs['A']['fore'], sleeves['A'], caps['A'], arm_imgs['A']['upper'], *lids, head,   # her near arm is in front of the head when it goes up
         *[hands_front_B[p] for p in HAND_POSES], bf_fo, sleeves['B'], caps['B'], bf_up,
         satchel, strap, torso, apron, skirt, slip, chemise,
         boots['A'], socks['A'], shins['A'], thighs['A'], boots['B'], socks['B'], shins['B'], thighs['B'],
         *[hand_imgs['B'][p] for p in HAND_POSES], arm_imgs['B']['fore'], arm_imgs['B']['upper']]
for im in order:
    char.remove(im); char.append(im)

# ---------------------------------------------------------------- view model
REST = {}
def rot_of(b): return float(bones[b].get('rotation'))
defaults = {'pelvisX': pel[0], 'pelvisY': pel[1], 'pose': 0, 'rate': 1.0, 'frontB': 0.0, 'backB': 1.0, 'handAFlip': 1.0, 'handBFlip': 1.0, 'gait': 0, 'blink': 0.0, 'speedOut': 0, 'sOut': 0, 'phaseOut': 0,
            'plA': 1, 'plB': 1, 'cAX': 0, 'cAY': 0, 'cBX': 0, 'cBY': 0}
for i in range(8): defaults[f'mX{i}'] = 0.0; defaults[f'mY{i}'] = 0.0
for p in HAND_POSES: defaults['handBF' + p.capitalize()] = 0.0
for k in ['spine', 'head', 'upperA', 'upperB', 'foreA', 'foreB', 'handA', 'handB', 'hair', 'skirt', 'skirtL', 'skirtR', 'apron1', 'apron2', 'satchel', 'slvA1', 'slvA2', 'slvB1', 'slvB2']: defaults[k + 'Rot'] = rot_of(k)
for sd in SIDES:
    defaults[f'hand{sd}X'], defaults[f'hand{sd}Y'] = T[sd]['wrist']
    defaults[f'foot{sd}X'], defaults[f'foot{sd}Y'] = T['ankle' + sd]
    defaults[f'foot{sd}Rot'] = FOOT_W[sd]
    for p in HAND_POSES: defaults[f'hand{sd}{p.capitalize()}'] = 1.0 if p == 'relaxed' else 0.0
vm = el('ViewModel', root, name='LivTq', defaultInstanceId='0:41', id='0:40')
ab.set('viewModelId', '0:40'); ab.set('viewModelInstanceId', '0:41')
props = {}
for name in defaults: props[name] = el('ViewModelPropertyNumber', vm, name=name).get('id')
ins = el('ViewModelInstance', vm, name='Default', exports=True, id='0:41')
for name, value in defaults.items(): el('ViewModelInstanceNumber', ins, viewModelPropertyId=props[name], propertyValue=value)
def bindp(target, key, name): el('DataBindContext', target, sourcePathIds='0:40-' + props[name], propertyKey=key)
bindp(bones['pelvis'], 90, 'pelvisX'); bindp(bones['pelvis'], 91, 'pelvisY')
for k in ['spine', 'head', 'handA', 'handB', 'hair', 'skirt', 'skirtL', 'skirtR', 'apron1', 'apron2', 'satchel', 'slvA1', 'slvA2', 'slvB1', 'slvB2']: bindp(bones[k], 15, k + 'Rot')
for lid in lids: bindp(lid, 18, 'blink')
bindp(bones['handA'], 17, 'handAFlip'); bindp(bones['handB'], 17, 'handBFlip')       # a hand turns over (mirrors) so its fingers curl the way gravity wants
for sd in SIDES:
    bindp(targets['hand' + sd], 13, f'hand{sd}X'); bindp(targets['hand' + sd], 14, f'hand{sd}Y')
    bindp(targets['foot' + sd], 13, f'foot{sd}X'); bindp(targets['foot' + sd], 14, f'foot{sd}Y')
    bindp(targets['foot' + sd], 15, f'foot{sd}Rot')
    for p in HAND_POSES: bindp(hand_imgs[sd][p], 18, f'hand{sd}{p.capitalize()}')
# far arm: behind the torso (opacity 1 - frontB), or in front of it (frontB). Hands: pose opacity times that.
# (the product is formed by the controller: the hand properties for the copy in front carry 'F')
for p in HAND_POSES: bindp(hands_front_B[p], 18, f'handBF{p.capitalize()}')
bindp(bf_up, 18, 'frontB'); bindp(bf_fo, 18, 'frontB')
bindp(arm_imgs['B']['upper'], 18, 'backB'); bindp(arm_imgs['B']['fore'], 18, 'backB')
for p in HAND_POSES: pass

# ground markers: small posts on the floor that slide past while she walks (a planted boot stays on its marker)
markers = []
for i in range(8):
    m = el('Shape', char, name=f'ground marker {i}', x=0, y=0)
    el('Rectangle', m, width=7, height=34, x=0, y=-17)
    el('Ellipse', m, width=46, height=9, y=1)
    f = el('Fill', m); el('SolidColor', f, colorValue='FFBFAE92'); markers.append(m)
    char.remove(m); char.append(m)                               # behind her
for i, m in enumerate(markers): bindp(m, 13, f'mX{i}'); bindp(m, 14, f'mY{i}')
# ---------------------------------------------------------------- floor, shadow
floor = el('Shape', ab, name='Floor line', x=CHAR_X + 512 * SCALE, y=CHAR_Y + 1340 * SCALE); el('Rectangle', floor, width=760, height=2)
f = el('Fill', floor); el('SolidColor', f, colorValue='FFD9CDBA')
shadow = el('Shape', ab, name='Contact shadow', x=CHAR_X + 500 * SCALE, y=CHAR_Y + 1340 * SCALE); el('Ellipse', shadow, width=250, height=24)
f = el('Fill', shadow, fillRule='clockwise'); el('SolidColor', f, colorValue='30402A10'); el('Feather', f, strength=9)
ab.remove(floor); ab.insert(0, floor); ab.remove(shadow); ab.insert(1, shadow)

# ---------------------------------------------------------------- controller, buttons, state machine
el('ScriptAsset', root, file='pose.luau', name='pose', id='0:80')
layout = el('LayoutComponent', ab, name='Pose controller', width=STAGE_W, height=STAGE_H, styleId='0:82', id='0:81')
el('LayoutComponentStyle', layout, name='Fill stage', layoutWidthScaleType='fill', layoutHeightScaleType='fill', widthUnitsValue='auto', heightUnitsValue='auto', id='0:82')
el('ScriptedLayout', layout, name='Liv pose controller', scriptAssetId='0:80')
ab.remove(layout); ab.insert(0, layout)
POSES = ['Rest', 'Wave', 'Reach', 'Cheer', 'Crouch', 'Step', 'Hands', 'Bind']
el('FontAsset', root, file='Inter.ttf', name='Inter', id='0:30')
def text(content, x, y, size=18, color='FF4C4038', at=None):
    t = el('Text', ab, name=content, x=x, y=y)
    st = el('TextStylePaint', t, fontSize=size, fontAssetId='0:30'); f = el('Fill', st); el('SolidColor', f, colorValue=color)
    el('TextValueRun', t, styleId=st.get('id'), text=content)          # without a run the text is empty
    ab.remove(t); ab.insert(3 if at is None else at, t)          # above the buttons: the first child is drawn on top
    return t
text('Liv · three-quarter view · Rive rig', 40, 12, 18)
text('Poses', 1088, 82, 14, 'FF8B7460')
text('Gait', 1088, 586, 14, 'FF8B7460')
sm = el('StateMachine', ab, name='Liv', id='0:7'); layer = el('StateMachineLayer', sm, name='Body', id='0:8')
BUTTONS = [(n, 'pose', i, 0) for i, n in enumerate(POSES)] + [('Walk', 'gait', 1, 0), ('Run', 'gait', 2, 0), ('Stop', 'gait', 0, None)]
def button(label, x, y, w, h, actions):
    sh = el('Shape', ab, x=x, y=y, name=label + ' button'); el('Rectangle', sh, width=w, height=h, cornerRadiusTL=10, cornerRadiusTR=10, cornerRadiusBL=10, cornerRadiusBR=10)
    f = el('Fill', sh); el('SolidColor', f, colorValue='FFE6D8C6'); ab.remove(sh); ab.insert(3, sh)
    text(label, x - (len(label) * 5.2), y - 11, 18, at=3)
    li = el('StateMachineListenerSingle', sm, targetId=sh.get('id'), listenerTypeValue='click', name=label)
    for prop, val in actions:
        act = el('ListenerViewModelChange', li); bp = el('BindablePropertyNumber', act, propertyValue=val)
        el('DataBindContext', bp, sourcePathIds='0:40-' + props[prop], propertyKey=636, direction=True)
for i, n in enumerate(POSES):
    button(n, 1130, 120 + i * 54, 150, 42, [('pose', i), ('gait', 0)])
button('Walk', 1130, 624, 150, 42, [('gait', 1), ('pose', 0)])
button('Run', 1130, 678, 150, 42, [('gait', 2), ('pose', 0)])
button('Stop', 1130, 732, 150, 42, [('gait', 0)])
entry = el('EntryState', layer, x=0, y=0); el('StateTransition', entry, stateToId='0:12')
el('AnyState', layer, x=0, y=-150); el('ExitState', layer, x=650, y=-150)
el('AnimationState', layer, animationId='0:60', id='0:12', x=180, y=0)
an = el('LinearAnimation', ab, name='Idle', fps=60, duration=240, loopValue='loop', id='0:60')
ko = el('KeyedObject', an, objectId=bones['spine'].get('id')); kp = el('KeyedProperty', ko, property='scaleY')
for fr, v in [(0, 1), (120, 1.004), (240, 1)]: el('KeyFrameDouble', kp, frame=fr, value=v, interpolationType='cubic')


# ---------------------------------------------------------------- controller (template + generated values)
POSE_LINES = """ {handAX=424,handAY=806,handBX=668,handBY=790},                                         -- 0 Rest: arms hang
 {handAX=210,handAY=318,handBX=582,handBY=818,shapeA=2,spineRot=-.03},               -- 1 Wave
 {handAX=170,handAY=600,handBX=790,handBY=650,shapeA=4,spineRot=.04,headRot=.04}, -- 2 Reach
 {handAX=298,handAY=292,handBX=730,handBY=292,shapeA=2,shapeB=2,pelvisY=-16,headRot=-.03}, -- 3 Cheer
 {pelvisY=92,handAX=398,handAY=930,handBX=612,handBY=930,frontB=1,spineRot=.1,headRot=-.07}, -- 4 Crouch
 {dfootAX=52,dfootAY=-90,handAX=380,handAY=790,handBX=640,handBY=800,frontB=1,spineRot=.05}, -- 5 Step
 {handAX=330,handAY=470,handBX=702,handBY=470,shapeA=3,shapeB=5,frontB=1,spineRot=-.04}, -- 6 Hands
 {},                                                                                   -- 7 Bind: the art as drawn"""
tmpl = (HERE / 'pose.tmpl.luau').read_text()
rest_lines = ''.join(f' ["{k}"] = {v:.10g},\n' for k, v in defaults.items())
luau = (tmpl.replace('@REST@', rest_lines.rstrip('\n')).replace('@POSES@', POSE_LINES).replace('@FOOTW@', f"{FOOT_W['A']:.6f}")
        .replace('@HOLDAX@', str(T['ankleA'][0])).replace('@HOLDAY@', str(T['ankleA'][1])).replace('@HOLDBX@', str(T['ankleB'][0])).replace('@HOLDBY@', str(T['ankleB'][1])))
(OUTD / 'pose.luau').write_text(luau)

# Bone names follow the handoff's proposed shared skeleton, so another character's images can be bound to the same names.
# (A is her right arm and leg, B her left: the pack's near side in the three-quarter view.)
NAMES = {'sh': 'shoulder', 'upper': 'upperArm', 'fore': 'foreArm', 'hand': 'hand', 'thigh': 'thigh', 'shin': 'shin', 'foot': 'foot', 'slv': 'sleeveHelper'}
for key, b in bones.items():
    for pre, nm in NAMES.items():
        if key.startswith(pre) and key[len(pre):len(pre) + 1] in ('A', 'B') and (pre != 'sh' or key[2:3] in ('A', 'B')):
            side = 'R' if key[len(pre)] == 'A' else 'L'; rest = key[len(pre) + 1:]
            b.set('name', f'{nm}_{side}{rest}'); break
for sd in SIDES:
    for n_, nm in ((f'hand {sd} target', f'hand_{"R" if sd == "A" else "L"}_target'),):
        pass
E.indent(root)
(OUTD / 'scene.rml').write_text(E.tostring(root, encoding='unicode'))
(OUTD / 'rive.yaml').write_text('name: Liv-TQ\nlogs:\n  file: build/rive.log\n  problems: build/problems.log\n')
(OUTD / '.gitignore').write_text('build/\nweb-check/*.riv\n')
(OUTD / 'rig-bones.json').write_text(json.dumps({k: {'start': world[k][0], 'end': world[k][1], 'world_angle': world[k][2], 'rotation': float(bones[k].get('rotation'))} for k in bones}, indent=1))
json.dump({'defaults': defaults, 'T': T, 'poses': POSES}, open(OUTD / 'defaults.json', 'w'), indent=1)
print('bones', len(bones), 'images', len(order))
