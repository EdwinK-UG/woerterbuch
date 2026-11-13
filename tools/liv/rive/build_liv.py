"""Build Liv's Rive project: every view that has cut art (front, three-quarter, side, three-quarter back, back) in one artboard.

    python3 tools/liv/rive/cut_tq.py && python3 tools/liv/rive/cut_cloth.py     # art for the three-quarter view (see cut_*.py)
    python3 tools/liv/rive/build_liv.py                                         # -> tools/liv/rive/liv/ (scene.rml, liv.luau)
    cd tools/liv/rive/liv && rive . --verify                                    # compile check
    rive .                                                                      # live preview with buttons

A view is a complete rig of its own (bones, IK, skinned cloth) inside a Node group; the controller (liv.tmpl.luau) turns the
body (one set of numbers in the ground plane and in body space) into each view's numbers and cross-fades the groups when the
`view` number changes. A view needs  <view>/<view>.json  from its cut script (the same contract as tq/tq.json).

Rig per view (native Rive): pelvis -> spine -> head; shoulder -> upper arm -> fore arm -> hand with a two-bone IK constraint to a
hand target; thigh -> shin -> foot with two-bone IK to a foot target; sleeve helper bones (rotation constraints); hair, skirt (three
hem bones), apron (two-bone chain), bow tails, satchel on damped springs; the clothes are separate layers from the skin (cut_cloth.py).
"""
from pathlib import Path
import base64, json, math, sys
import xml.etree.ElementTree as E
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / 'face')); from face_tq import emit_face     # the face and expression rig (face/, from the pack's pixels)
sys.path.insert(0, str(HERE / 'hands')); import hand_rig   # the painted articulated hand (hands/, from the generated parts sheet)
import os
OUTD = HERE / os.environ.get('LIV_OUT', 'liv'); OUTD.mkdir(exist_ok=True)      # LIV_OUT=liv-scratch builds an experiment next to the real project
PARTS = json.loads((HERE / 'parts/parts.json').read_text())
ALL_VIEWS = ['front', 'tq', 'side', 'tqb', 'back']
DEFAULT_YAW = {'front': 0, 'tq': 43, 'side': 90, 'tqb': 137, 'back': 180}
only = [a for a in sys.argv[1:] if a in ALL_VIEWS]
VIEWS = [v for v in ALL_VIEWS if (HERE / v / f'{v}.json').exists() and (not only or v in only)]
DEFAULT_VIEW = 'tq' if 'tq' in VIEWS else VIEWS[0]
SCALE = .62
STAGE_W, STAGE_H = 1240, 1020
CHAR_X, CHAR_Y = 40, 36
PPM = 996.0

N = 2000
def el(t, parent=None, **a):
    global N
    if 'id' not in a: N += 1; a['id'] = f'0:{N}'
    e = E.Element(t, {k: (str(v).lower() if isinstance(v, bool) else str(v)) for k, v in a.items()})
    if parent is not None: parent.append(e)
    return e

root = E.Element('Rive', version='1', kind='fragment')
assets = {}                                                   # relative file -> ImageAsset id
AID = [100]
WEBP = os.environ.get('LIV_WEBP', '1') == '1'      # lossy WebP copies of the art (a quarter of the size, same look at q94) in <project>/art/; LIV_WEBP=0 uses the PNGs
def asset(rel):
    if rel not in assets:
        use = rel
        if WEBP and rel.endswith('.png') and 'strap' not in rel:
            src = (OUTD / rel).resolve(); (OUTD / 'art').mkdir(exist_ok=True)
            name = '_'.join(src.parts[-2:]).replace('.png', '.webp'); dst = OUTD / 'art' / name
            Image.open(src).convert('RGBA').save(dst, 'WEBP', quality=94, method=6, exact=True)
            use = f'art/{name}'
        a = el('ImageAsset', root, file=use, name=Path(rel).stem, id=f'0:{AID[0]}'); AID[0] += 1
        assets[rel] = a.get('id')
    return assets[rel]
def artfile(V, name):
    """The picture of a piece of view V: a cut of ours (<V>/<V>_<name>.png) or the pack's part (parts/<V>_<name>.png)."""
    for rel in (f'../{V}/{V}_{name}.png', f'../parts/{V}_{name}.png'):
        if (OUTD / rel).resolve().exists(): return rel
    return None

ab = el('Artboard', root, name='Liv', width=STAGE_W, height=STAGE_H, defaultStateMachineId='0:7', styleId='0:5', id='0:2')
el('LayoutComponentStyle', ab, name='Artboard style', id='0:5')
f = el('Fill', ab, name='Studio'); el('SolidColor', f, colorValue='FFF3EBDD')
char = el('Node', ab, name='Liv', x=CHAR_X, y=CHAR_Y, scaleX=SCALE, scaleY=SCALE, id='0:10')
flip = el('Node', char, name='mirror', x=512)                  # she can face left: this node's scaleX goes to -1
inner = el('Node', flip, name='Liv body', x=-512)

# ---------------------------------------------------------------- view model (global + per view), bindings
vm = el('ViewModel', root, name='Liv', defaultInstanceId='0:41', id='0:40')
ab.set('viewModelId', '0:40'); ab.set('viewModelInstanceId', '0:41')
props, defaults = {}, {}
def prop(name, default):
    props[name] = el('ViewModelPropertyNumber', vm, name=name).get('id'); defaults[name] = default
def bindp(target, key, name): el('DataBindContext', target, sourcePathIds='0:40-' + props[name], propertyKey=key)
GLOBAL_DEFAULTS = {'pose': 0, 'rate': 1.0, 'gait': 0, 'view': ALL_VIEWS.index(DEFAULT_VIEW), 'mirror': 0, 'yawOut': DEFAULT_YAW[DEFAULT_VIEW], 'flipX': 1.0,
                   'speedOut': 0, 'sOut': 0, 'phaseOut': 0}
for k, v in GLOBAL_DEFAULTS.items(): prop(k, v)
for k, v in {'expression': 0, 'expressionAmount': 1.0, 'lookX': 0.0, 'lookY': 0.0, 'blinkNow': 0, 'winkNow': 0, 'faceIdle': 1, 'autoBlink': 1}.items(): prop(k, v)
FACE_VIEWS = []
# [liv-actions] begin: the action library's numbers (actions_rig.py, actions.luau, docs/liv-actions.md)
import actions_rig; actions_rig.declare(prop)
# [liv-actions] end
for i in range(8): prop(f'mX{i}', 0.0); prop(f'mY{i}', 0.0)
bindp(flip, 16, 'flipX')

def varuint(n):
    out = []
    while n > 127: out.append((n & 127) | 128); n >>= 7
    return bytes(out + [n])
def weight_el(parent, pairs):
    pairs = [(i, w) for i, w in pairs if w > 1e-4][:4]
    vals = [int(round(w * 255)) for _, w in pairs]; vals[vals.index(max(vals))] += 255 - sum(vals)
    v = sum(val << (8 * k) for k, val in enumerate(vals)); idx = sum((i + 1) << (8 * k) for k, (i, _) in enumerate(pairs))
    el('Weight', parent, values=v, indices=idx)
def cl(v): return min(1.0, max(0.0, v))
def smooth(t): t = cl(t); return t * t * (3 - 2 * t)
def ang(a, b): return math.atan2(b[1] - a[1], b[0] - a[0])

# strap texture (shared): the strap colour with an ink edge
STRAP = np.zeros((8, 30, 4), np.uint8); STRAP[..., :3] = (0xe6, 0x9d, 0x43); STRAP[..., 3] = 255
STRAP[:, :3, :3] = (0x3a, 0x1c, 0x0c); STRAP[:, -3:, :3] = (0x3a, 0x1c, 0x0c)
Image.fromarray(STRAP, 'RGBA').save(OUTD / 'strap.png')

HEAD_DX = {'front': 0, 'tq': 41, 'side': 30, 'tqb': 20, 'back': 0}   # where the head's centre sits relative to the neck, for the hair weights
CTRL = {}                                                     # per view: constants and rest values for the controller
SPINE_ID = {}
import sleeve_field                                           # [liv-sleeves] the sleeve's bend field (weights and art)
SLV = [str(k) for k in range(sleeve_field.LEVELS - 1)]        # [liv-sleeves] sleeve helper bones slv<sd>0..5

def emit_view(V):
    T = json.loads((HERE / V / f'{V}.json').read_text())
    yaw = T.get('yaw_deg', DEFAULT_YAW[V]); rig = T['rig']
    near = 'A' if T.get('far_arm', 'B') == 'B' else 'B'; far = 'B' if near == 'A' else 'A'
    A_is_R = T.get('A_is', 'R') == 'R'
    g = el('Node', inner, name=f'Liv {V}')
    pre = V + '_'
    vdef = {}
    def vprop(name, default): prop(pre + name, default); vdef[name] = default
    def vbind(target, key, name): bindp(target, key, pre + name)
    bones, bind, world = {}, {}, {}
    def bone(name, p, end, parent=None, root_bone=True, rotation=None):
        """A RootBone (positioned in its parent's frame) or a chained Bone (sits at its parent's tip). rotation: use this local
        rotation instead of the one that points the bone at `end` (it is then turned to its bind direction by a constraint)."""
        w = ang(p, end) if end != p else 0.0
        pw = world[parent][2] if parent else 0.0
        po = world[parent][0] if parent else (0.0, 0.0)
        a = (w - pw) if rotation is None else rotation
        a = (a + math.pi) % (2 * math.pi) - math.pi            # |rotation| <= pi: constraints that copy it must not meet the wrap
        if root_bone:
            d = (p[0] - po[0], p[1] - po[1]); c, s = math.cos(pw), math.sin(pw)
            b = el('RootBone', bones[parent] if parent else g, name=name, x=c * d[0] + s * d[1], y=-s * d[0] + c * d[1], rotation=a, length=math.dist(p, end))
        else:
            b = el('Bone', bones[parent], name=name, rotation=a, length=math.dist(p, end))
        bones[name] = b; world[name] = (p, end, w)
        bind[name] = (math.cos(w), math.sin(w), -math.sin(w), math.cos(w), p[0], p[1])
        return b
    def mesh(name, rel, pts, uvs, tris, influences, weights, holder=None):
        im = el('Image', holder if holder is not None else g, name=name, assetId=asset(rel), originX=0, originY=0)
        m = el('Mesh', im, name=name + ' mesh', triangleIndexBytes=base64.b64encode(b''.join(varuint(int(i)) for t in tris for i in t)).decode())
        for i, ((x, y), (u, v)) in enumerate(zip(pts, uvs)):
            vert = el('MeshVertex', m, x=round(x, 3), y=round(y, 3), u=round(u, 5), v=round(v, 5))
            weight_el(vert, weights(x, y))
        skin = el('Skin', m, name=name + ' skin', tx=0, ty=0)
        for b in influences:
            xx, xy, yx, yy, tx, ty = bind[b]
            el('Tendon', skin, boneId=bones[b].get('id'), name=b, xx=xx, xy=xy, yx=yx, yy=yy, tx=tx, ty=ty)
        return im
    def grid(name, rel, box, nx, ny, influences, wts):
        x, y, w, h = box
        pts = [(x + w * i / nx, y + h * j / ny) for j in range(ny + 1) for i in range(nx + 1)]
        tris = []
        for j in range(ny):
            for i in range(nx):
                a = j * (nx + 1) + i; tris += [(a, a + 1, a + nx + 2), (a, a + nx + 2, a + nx + 1)]
        return mesh(name, rel, pts, [((px - x) / w, (py - y) / h) for px, py in pts], tris, influences, wts)
    def rigid(name, rel, box, bone_name):
        x, y, w, h = box
        return mesh(name, rel, [(x, y), (x + w, y), (x + w, y + h), (x, y + h)], [(0, 0), (1, 0), (1, 1), (0, 1)], [(0, 1, 2), (0, 2, 3)], [bone_name], lambda *_: [(0, 1)])
    def box_of(n):
        if f'{V}_{n}' in PARTS: p = PARTS[f'{V}_{n}']; return [p['x'], p['y'], p['w'], p['h']]
        return list(T['boxes'][n.replace('_c', '')])               # a cut piece without a pack part (e.g. the side view's far sleeve)
    def has(name): return artfile(V, name) is not None
    def A(name): return artfile(V, name)

    # ---------------------------------------------------------------- bones
    pel = tuple(T['pelvis']); neck = tuple(T['neck']); head_top = tuple(rig['head_top'])
    bone('pelvis', pel, pel); bone('spine', pel, neck, 'pelvis'); bone('head', neck, head_top, 'spine')
    SIDES = [s for s in 'AB' if s in T]
    sin_y = math.sin(math.radians(yaw))
    FOOT_W = {}
    for sd in SIDES:
        a = T[sd]
        # 'shoulder' is a zero-length bone that carries the arm's bind direction, so the upper arm's own rotation is 0 at rest and
        # never meets the +-pi wrap that rotation constraints (the sleeve helpers) cannot follow
        bone(f'sh{sd}', tuple(a['sh']), tuple(a['elbow']), 'spine')
        bone(f'upper{sd}', tuple(a['sh']), tuple(a['elbow']), f'sh{sd}')
        bone(f'fore{sd}', tuple(a['elbow']), tuple(a['wrist']), f'upper{sd}', False)
        wr = np.array(a['wrist']); u = np.array(a['dir'])
        bone(f'hand{sd}', tuple(wr), tuple(wr + u * 70), f'fore{sd}', False)
        for h in SLV: bone(f'slv{sd}{h}', tuple(a['sh']), tuple(a['elbow']), f'sh{sd}', rotation=0.0)   # [liv-sleeves] six helpers, turned by the controller
    for sd in 'AB':
        hip, knee, ank = tuple(T['hip' + sd]), tuple(T['knee' + sd]), tuple(T['ankle' + sd])
        bone(f'thigh{sd}', hip, knee, 'pelvis'); bone(f'shin{sd}', knee, ank, f'thigh{sd}', False)
        toe = (ank[0] + 100 * sin_y, ank[1] + 78)
        bone(f'foot{sd}', ank, toe, f'shin{sd}', False); FOOT_W[sd] = ang(ank, toe)
    bone('hair', tuple(rig['hair'][0]), tuple(rig['hair'][1]), 'head')
    bone('skirt', tuple(rig['skirt'][0]), tuple(rig['skirt'][1]), 'pelvis')
    bone('skirtL', tuple(rig['skirt_L'][0]), tuple(rig['skirt_L'][1]), 'pelvis'); bone('skirtR', tuple(rig['skirt_R'][0]), tuple(rig['skirt_R'][1]), 'pelvis')
    has_apron = has('apron')
    if has_apron:
        ap = rig['apron']; bone('apron1', tuple(ap[0]), tuple(ap[1]), 'pelvis'); bone('apron2', tuple(ap[1]), tuple(ap[2]), 'apron1', False)
    bag = rig.get('bag'); bag_vis = bool(rig.get('bag_visible', True)) and bag is not None
    if bag_vis:
        bb = tuple(bag['b']); bone('satchel', (bb[0], bb[1] + 2), (bb[0], bb[1] + 110), 'pelvis')
    bows = [n for n in ('bow1', 'bow2') if n in rig]
    for n in bows: bone(n, tuple(rig[n][0]), tuple(rig[n][1]), 'pelvis')

    targets = {}
    for sd in SIDES:
        targets['hand' + sd] = el('Node', g, name=f'hand {sd} target', x=T[sd]['wrist'][0], y=T[sd]['wrist'][1])
    for sd in 'AB':
        targets['foot' + sd] = el('Node', g, name=f'foot {sd} target', x=T['ankle' + sd][0], y=T['ankle' + sd][1], rotation=FOOT_W[sd])
    for sd in SIDES:
        el('IKConstraint', bones[f'fore{sd}'], name=f'arm {sd} IK', targetId=targets['hand' + sd].get('id'), parentBoneCount=1, invertDirection=False, strength=1)
        # [liv-sleeves] no rotation constraints on the sleeve helpers: a constraint copies the IK's wrapped angle (a flip at
        # +-180 degrees tore the puff when the arm went up past it); the controller turns them from the unwrapped arm angle
    for sd in 'AB':
        el('IKConstraint', bones[f'shin{sd}'], name=f'leg {sd} IK', targetId=targets['foot' + sd].get('id'), parentBoneCount=1, invertDirection=True, strength=1)
        el('RotationConstraint', bones[f'foot{sd}'], name=f'foot {sd} level', targetId=targets['foot' + sd].get('id'), copyFactor=1, offset=False, sourceSpaceValue='world', destSpaceValue='world', strength=1)

    # ---------------------------------------------------------------- meshes
    def head_w(px, py):
        dx, dy = (px - (neck[0] + HEAD_DX.get(V, 41))) / 120, (py - 335) / 150
        w = smooth((math.hypot(dx, dy) - 1.0) / .55) * (1.0 if (px < neck[0] + HEAD_DX.get(V, 41) + 15 or py < 230) else .35) * smooth((py - 150) / 90)
        return [(0, 1 - w), (1, w)]
    head = grid('Liv head', A('head'), box_of('head'), 12, 12, ['head', 'hair'], head_w)
    lids = []; face = None
    if (HERE / 'face' / 'art' / f'{V}_face.json').exists():       # a view with face art gets the full expression rig
        face = emit_face(el, bones['head'], {'char': g, 'head_world': (world['head'][0], world['head'][2]),
                                             'add_asset': lambda key, rel: asset(rel), 'art_rel': '../face/art', 'view': V}, pre=pre)
        lids = face['drawables']                                  # first = on top; they take the old lids' place just above the head
        (OUTD / f'face_cfg_{V}.luau').write_text(face['luau_cfg']); FACE_VIEWS.append(V)
    else:                                                         # the other views: the pack's closed-eye patches, opacity = blink
        lids = [rigid(f'Liv closed eye {i}', A(f'blink{i}'), box_of(f'blink{i}'), 'head') for i in (0, 1) if has(f'blink{i}')]

    def sleeve(sd):
        # [liv-sleeves] begin: the core of the sleeve on the bend field (sleeve_field.py): skinned to the helpers slv0..5 and the
        # upper arm, two neighbouring levels per vertex, on a fine grid (the twirl about the joint needs it)
        if has(f'sleeve{sd}_k'):                                  # (fix_sleeves.py: the sleeve with clean cut edges)
            F = sleeve_field.Field(V, T, sd)
            return grid(f'Liv sleeve {sd}', A(f'sleeve{sd}_k'), F.box, 18, 18, [*(f'slv{sd}{h}' for h in SLV), f'upper{sd}'],
                        lambda px, py: sleeve_field.level_weights(F.f(px, py)))
        # [liv-sleeves] end
        a = T[sd]; sh = np.array(a['sh']); u = np.array(a['dir'])
        def wts(px, py):
            t = ((px - sh[0]) * u[0] + (py - sh[1]) * u[1]); k = smooth((t + 4) / 62) * 3
            if k <= 1: return [(3, 1 - k), (1, k)]
            if k <= 2: return [(1, 2 - k), (2, k - 1)]
            return [(2, 3 - k), (0, k - 2)]
        full = A(f'sleeve{sd}_f')                                   # a completed far sleeve (fix_sleeves.py), with its own box
        return grid(f'Liv sleeve {sd}', full or A(f'sleeve{sd}_c') or A(f'sleeve{sd}_x') or A(f'sleeve{sd}'), T['boxes'][f'sleeve{sd}_f'] if full else box_of(f'sleeve{sd}'), 10, 10, [f'upper{sd}', f'slv{sd}1', f'slv{sd}2', 'spine'], wts)
    sleeves = {sd: sleeve(sd) for sd in SIDES if (has(f'sleeve{sd}_f') or has(f'sleeve{sd}_c') or has(f'sleeve{sd}_x') or has(f'sleeve{sd}'))}
    caps = {sd: rigid(f'Liv shoulder cap {sd}', A(f'cap{sd}_k'), sleeve_field.Field(V, T, sd).box, 'spine') for sd in sleeves if has(f'cap{sd}_k')}   # [liv-sleeves]
    caps.update({sd: rigid(f'Liv shoulder cap {sd}', A(f'cap{sd}_f') or A(f'cap{sd}') or A(f'cap{sd}_x'), T['boxes'][f'sleeve{sd}_f'] if has(f'cap{sd}_f') else box_of(f'sleeve{sd}'), 'spine') for sd in sleeves if sd not in caps and (has(f'cap{sd}_f') or has(f'cap{sd}') or has(f'cap{sd}_x'))})
    def UP(sd): return A(f'upper{sd}_s') or A(f'upper{sd}')       # [liv-sleeves] the upper arm without the skin under the puff
    arm_up = {sd: rigid(f'Liv upper arm {sd}', UP(sd), T[sd]['upper'], f'upper{sd}') for sd in SIDES}
    arm_fo = {sd: rigid(f'Liv forearm {sd}', A(f'fore{sd}'), T[sd]['fore'], f'fore{sd}') for sd in SIDES}

    # hands: the painted articulated hand (hands/hand_rig.py), one mount per side that follows the hand bone in world space;
    # the far arm has a second mount for its copy in front of the torso
    def bind_c(t, k, name, conv):                                # a bind with an optional converter
        a_ = {'sourcePathIds': '0:40-' + props[name], 'propertyKey': k}
        if conv: a_['converterId'] = conv
        el('DataBindContext', t, **a_)
    def hand_mount(sd, tag=''):
        m = el('Node', g, name=f'Liv hand {sd}{tag} mount')
        el('TransformConstraint', m, targetId=bones[f'hand{sd}'].get('id'), sourceSpaceValue='world', destSpaceValue='world', strength=1, name=f'follow hand {sd}{tag}')
        side = 'R' if (sd == 'A') == A_is_R else 'L'
        hp = {'prefix': f'hand{sd}{tag}', 'root': root, 'asset': asset, 'pieces': '../hands/pieces/rig', 'bind': bind_c, 'declare': prop}
        hand_rig.emit_hand(el, m, side, 1.0, hp, pre=pre)
        return m
    hand_mounts = {sd: hand_mount(sd) for sd in SIDES}
    far_hand_front = hand_mount(far, 'F') if far in SIDES else None
    far_up_front = rigid(f'Liv upper arm {far} (front)', A(f'upper{far}_sf') or UP(far), T[far]['upper'], f'upper{far}') if far in SIDES else None
    # [liv-sleeves] begin: where the far sleeve is a sliver (three-quarter view: the bodice hides the rest) it goes behind the torso
    # with the far arm's back copy (the bodice covers its cut edge, as in the picture), and the front copy gets a whole sleeve
    # (fix_sleeves.py: the near one mirrored), faded in with the front copy
    far_ff = None
    if far in sleeves and has(f'sleeve{far}_ff'):
        Fff = sleeve_field.Field(V, T, far, HERE / V / f'{V}_sleeve{far}_ff.png', T['boxes'][f'sleeve{far}_ff'], like=sleeve_field.Field(V, T, far))
        far_ff = grid(f'Liv sleeve {far} (front)', A(f'sleeve{far}_ff'), Fff.box, 18, 18, [*(f'slv{far}{h}' for h in SLV), f'upper{far}'],
                      lambda px, py: sleeve_field.level_weights(Fff.f(px, py)))
        far_h = grid(f'Liv sleeve {far} (hidden part)', A(f'sleeve{far}_h'), Fff.box, 18, 18, [*(f'slv{far}{h}' for h in SLV), f'upper{far}'],
                     lambda px, py: sleeve_field.level_weights(Fff.f(px, py))) if has(f'sleeve{far}_h') else None
        far_g = grid(f'Liv sleeve {far} (gap fill)', A(f'sleeve{far}_g'), Fff.box, 18, 18, [*(f'slv{far}{h}' for h in SLV), f'upper{far}'],
                     lambda px, py: sleeve_field.level_weights(Fff.f(px, py))) if has(f'sleeve{far}_g') else None
    # [liv-sleeves] end
    far_fo_front = rigid(f'Liv forearm {far} (front)', A(f'fore{far}'), T[far]['fore'], f'fore{far}') if far in SIDES else None

    # torso, skirt (red), apron, base layers
    def torso_ws(px, py):
        t = smooth((py - 520) / 240); return [(0, 1 - t), (1, t)]
    if has('torso_s'): torso = grid('Liv torso', A('torso_s'), T['boxes']['torso_s'], 6, 10, ['spine', 'pelvis'], torso_ws)   # [liv-sleeves] with the shoulders under the sleeves
    else: torso = grid('Liv torso', A('torso_c') or A('torso'), box_of('torso'), 6, 10, ['spine', 'pelvis'], torso_ws)
    chemise = grid('Liv chemise (base layer)', A('chemise'), box_of('torso'), 4, 6, ['spine', 'pelvis'], torso_ws) if has('chemise') else None
    sk_l, sk_r = rig['skirt_L'][1][0], rig['skirt_R'][1][0]
    cx_ = rig['skirt'][0][0]
    SKIRT_INF = ['pelvis', 'thighA', 'thighB', 'skirtL', 'skirt', 'skirtR']
    def skirt_w(px, py):
        # at most four bones per vertex: pelvis, one or two thighs, one or two hem bones; every blend is continuous in x
        t = smooth((py - 760) / 330); s = cl((px - (cx_ - 150)) / 300); sB = smooth((s - .25) / .5); sA = 1 - sB
        wl = cl(((cx_ - 75) - px) / 150); wr = cl((px - (cx_ + 75)) / 150); wc = 1 - wl - wr
        return [(0, 1 - t * .6), (1, t * .18 * sA), (2, t * .18 * sB), (3, t * .24 * wl), (4, t * .24 * wc), (5, t * .24 * wr)]
    skirt = grid('Liv skirt (red)', A('skirtred') or A('skirt'), box_of('skirt'), 10, 10, SKIRT_INF, skirt_w)
    slip = grid('Liv petticoat (base layer)', A('slip'), box_of('skirt'), 8, 8, SKIRT_INF, skirt_w) if has('slip') else None
    def apron_w(px, py):
        u = smooth((py - 760) / 70); v = smooth((py - 860) / 190)
        return [(0, 1 - u), (1, u * (1 - v)), (2, u * v)]
    apron = grid('Liv apron', A('apron'), box_of('skirt'), 12, 12, ['pelvis', 'apron1', 'apron2'], apron_w) if has_apron else None
    bow_imgs = []
    for n in bows:                                              # waist-bow tails (back views): a rigid piece on its own bone
        if has(n) and 'boxes' in T and n in T['boxes']: bow_imgs.append(rigid(f'Liv {n}', A(n), T['boxes'][n], n))

    # satchel and strap
    satchel = strap = None
    if bag_vis:
        SAT_S = 996 / PARTS['satchel']['ppm']; BAG_B = tuple(bag['b'])
        sx0, sy0 = BAG_B[0] - PARTS['satchel']['ax'] * SAT_S, BAG_B[1] - PARTS['satchel']['ay'] * SAT_S
        satchel = rigid('Liv satchel', '../parts/satchel.png', [sx0, sy0, PARTS['satchel']['w'] * SAT_S, PARTS['satchel']['h'] * SAT_S], 'satchel')
        SA, SB = np.array(bag['a'], float), np.array([BAG_B[0], BAG_B[1] + 14], float)
        u = (SB - SA) / np.linalg.norm(SB - SA); n = np.array([-u[1], u[0]]) * 15
        rows = 6; pts = []; uvs = []; tris = []
        for r in range(rows + 1):
            t = r / rows; c = SA + (SB - SA) * t
            pts += [tuple(c + n), tuple(c - n)]; uvs += [(1, 0), (0, 0)]
            if r < rows: i = r * 2; tris += [(i, i + 1, i + 3), (i, i + 3, i + 2)]
        def swts(px, py):
            t = cl(np.dot(np.array([px, py]) - SA, u) / np.linalg.norm(SB - SA)); t = smooth((t - .55) / .45)
            return [(0, 1 - t), (1, t)]
        strap = mesh('Liv satchel strap', '../liv/strap.png' if False else 'strap.png', pts, uvs, tris, ['spine', 'satchel'], swts)

    # legs: thigh and shin are rigid skin pieces with a round knee (cut_tq.py draws them)
    def leg_pieces(sd):
        lp = T['legpiece'][sd]; hip, knee, ank = np.array(T['hip' + sd], float), np.array(T['knee' + sd], float), np.array(T['ankle' + sd], float)
        def quad(name, rel, org, to, spec, bone_name):
            u = (to - org) / np.linalg.norm(to - org); n = np.array([u[1], -u[0]]); hw = spec['cols'] / 2.0
            t0, t1 = -spec['top_ext'], spec['rows'] - spec['top_ext']
            P = lambda t, s_: tuple(org + u * t + n * s_)
            return mesh(name, rel, [P(t0, -hw), P(t0, hw), P(t1, hw), P(t1, -hw)], [(0, 0), (1, 0), (1, 1), (0, 1)], [(0, 1, 2), (0, 2, 3)], [bone_name], lambda *_: [(0, 1)])
        return (quad(f'Liv thigh {sd}', A(f'thigh{sd}'), hip, knee, lp['thigh'], f'thigh{sd}'), quad(f'Liv shin {sd}', A(f'shin{sd}'), knee, ank, lp['shin'], f'shin{sd}'))
    thighs, shins = {}, {}
    for sd in 'AB': thighs[sd], shins[sd] = leg_pieces(sd)
    socks = {sd: rigid(f'Liv sock {sd}', A(f'sock{sd}_c') or A(f'sock{sd}'), box_of(f'sock{sd}'), f'shin{sd}') for sd in 'AB'}
    boots = {sd: rigid(f'Liv boot {sd}', A(f'boot{sd}'), box_of(f'boot{sd}'), f'foot{sd}') for sd in 'AB'}

    # ---------------------------------------------------------------- draw order (first child = on top)
    # the near arm is in front of everything (and of the head when raised); the far arm is behind the torso, with a second copy in
    # front faded in when it swings forward or up; the far arm's back copy is at the very bottom
    def arm_group(sd, up, fo, hand): return [hand, fo, *( [sleeves[sd]] if sd in sleeves else []), *( [caps[sd]] if sd in caps else []), up]
    far_front = arm_group(far, far_up_front, far_fo_front, far_hand_front) if far in SIDES else []
    far_back = [hand_mounts[far], arm_fo[far], arm_up[far]] if far in SIDES else []
    if far_ff is not None:                                       # [liv-sleeves] sliver behind the torso, whole sleeve on the front copy
        far_front = [far_hand_front, far_fo_front, far_ff, far_up_front]
        far_back = [hand_mounts[far], arm_fo[far], sleeves[far], *([far_h] if far_h is not None else []), *([far_g] if far_g is not None else []),
                    *([caps[far]] if far in caps else []), arm_up[far]]
    order = [*(arm_group(near, arm_up[near], arm_fo[near], hand_mounts[near]) if near in SIDES else []), *lids, head,
             *far_front,
             *[x for x in (satchel, strap) if x is not None], *bow_imgs, torso, *[x for x in (apron,) if x is not None], skirt, *[x for x in (slip, chemise) if x is not None],
             boots['A'], socks['A'], shins['A'], thighs['A'], boots['B'], socks['B'], shins['B'], thighs['B'],
             *far_back]
    for im in order:
        g.remove(im); g.append(im)

    # ---------------------------------------------------------------- view-model numbers
    def rot_of(b): return float(bones[b].get('rotation'))
    vprop('opacity', 1.0 if V == DEFAULT_VIEW else 0.0); vbind(g, 18, 'opacity')
    vprop('pelvisX', pel[0]); vprop('pelvisY', pel[1]); vbind(bones['pelvis'], 90, 'pelvisX'); vbind(bones['pelvis'], 91, 'pelvisY')
    rest = {}
    rot_bones = ['spine', 'head', 'hair', 'skirt', 'skirtL', 'skirtR'] + (['apron1', 'apron2'] if has_apron else []) + (['satchel'] if bag_vis else []) + bows
    for k in rot_bones: rest[k + 'Rot'] = rot_of(k); vprop(k + 'Rot', rest[k + 'Rot']); vbind(bones[k], 15, k + 'Rot')
    for sd in SIDES:
        rest[f'hand{sd}Rot'] = rot_of(f'hand{sd}'); vprop(f'hand{sd}Rot', rest[f'hand{sd}Rot']); vbind(bones[f'hand{sd}'], 15, f'hand{sd}Rot')
        for h in SLV:                                             # [liv-sleeves]
            rest[f'slv{sd}{h}Rot'] = 0.0; vprop(f'slv{sd}{h}Rot', 0.0); vbind(bones[f'slv{sd}{h}'], 15, f'slv{sd}{h}Rot')
        vprop(f'hand{sd}X', T[sd]['wrist'][0]); vprop(f'hand{sd}Y', T[sd]['wrist'][1]); vbind(targets['hand' + sd], 13, f'hand{sd}X'); vbind(targets['hand' + sd], 14, f'hand{sd}Y')
    for sd in 'AB':
        vprop(f'foot{sd}X', T['ankle' + sd][0]); vprop(f'foot{sd}Y', T['ankle' + sd][1]); vprop(f'foot{sd}Rot', FOOT_W[sd])
        vbind(targets['foot' + sd], 13, f'foot{sd}X'); vbind(targets['foot' + sd], 14, f'foot{sd}Y'); vbind(targets['foot' + sd], 15, f'foot{sd}Rot')
    for sd in 'AB':                                              # leg foreshortening (seen from the front or back a lifted leg gets shorter, its knee goes toward the camera)
        vprop(f'leg{sd}Scale', 1.0); vbind(bones[f'thigh{sd}'], 16, f'leg{sd}Scale')     # the shin and foot inherit the thigh's scale
    if far in SIDES:
        vprop('front', 0.0); vprop('back', 1.0)
        vbind(far_up_front, 18, 'front'); vbind(far_fo_front, 18, 'front'); vbind(far_hand_front, 18, 'front')
        if far_ff is not None: vbind(far_ff, 18, 'front')        # [liv-sleeves]
        if far_ff is not None and far_g is not None:             # [liv-sleeves] (in rest, so the controller grabs it)
            vprop(f'slvFill{far}', 0.0); vbind(far_g, 18, f'slvFill{far}'); rest[f'slvFill{far}'] = 0.0
        vbind(arm_up[far], 18, 'back'); vbind(arm_fo[far], 18, 'back'); vbind(hand_mounts[far], 18, 'back')
    if face:
        for n, d in face['props'].items(): vprop(n, d)
        for e_, key, n in face['bindings']: vbind(e_, key, n)
    else:
        vprop('blink', 0.0)
        for lid in lids: vbind(lid, 18, 'blink')
    for k in ('plA', 'plB', 'cAX', 'cAY', 'cBX', 'cBY'): vprop(k, 1 if k.startswith('pl') else 0)

    # [liv-actions] begin: props on her right hand, the crate between the hands, the thrown apple, head offsets (actions_rig.py)
    actions_rig.view(dict(V=V, el=el, g=g, bones=bones, hand_mounts=hand_mounts, far_hand_front=far_hand_front, far=far, A_is_R=A_is_R,
                          vprop=vprop, vbind=vbind, bindp=bindp, rest=rest, head_anchor=head, far_top=far_up_front, vm=vm, yaw=yaw))
    # [liv-actions] end
    # constants for the controller (view pixels)
    ankA, ankB = T['ankleA'], T['ankleB']
    half = abs(ankB[0] - ankA[0]) / 2 / PPM
    c = dict(oxg=(ankA[0] + ankB[0]) / 2, oyg=(ankA[1] + ankB[1]) / 2 + 98, pelx=pel[0], pely=pel[1],
             legmax=.975 * (math.dist(T['hipA'], T['kneeA']) + math.dist(T['kneeA'], ankA)), hipdy=T['hipA'][1] - pel[1],
             hipAx=T['hipA'][0] - pel[0], hipBx=T['hipB'][0] - pel[0], lat0=min(.13, max(.08, half / max(abs(math.cos(math.radians(yaw))), .35))),
             footWA=FOOT_W['A'], footWB=FOOT_W['B'], ffbias=1.0 if yaw in (0, 180) else 0.0)     # ffbias: seen from the front or back the far arm is in front of the torso at rest
    for sd in 'AB':
        s_ = T[sd]['sh'] if sd in T else T[near]['sh']
        c[f'sh{sd}x'] = s_[0] - pel[0]; c[f'sh{sd}y'] = s_[1] - pel[1]; c[f'sh{sd}x0'] = s_[0]; c[f'sh{sd}y0'] = s_[1]
        w_ = T[sd]['wrist'] if sd in T else T[near]['wrist']; c[f'w{sd}x'] = w_[0]; c[f'w{sd}y'] = w_[1]
        a_ = T[sd] if sd in T else T[near]                         # [liv-sleeves] the arm's bone lengths and bind direction (sleeve turn)
        c[f'L1{sd}'] = math.dist(a_['sh'], a_['elbow']); c[f'L2{sd}'] = math.dist(a_['elbow'], a_['wrist']); c[f'bd{sd}'] = ang(a_['sh'], a_['elbow'])
    SPINE_ID[V] = bones['spine'].get('id')
    CTRL[V] = dict(yaw=yaw, aR=A_is_R, farB=(far == 'B'), c=c, rest=rest)
    print(f'{V}: bones {len(bones)}, images {len(order)}, far arm {far}, apron {has_apron}, bag {bag_vis}')

for V in VIEWS: emit_view(V)

# ---------------------------------------------------------------- ground markers, floor, shadow
markers = []
for i in range(8):
    m = el('Shape', inner, name=f'ground marker {i}', x=0, y=0)
    el('Rectangle', m, width=7, height=34, x=0, y=-17); el('Ellipse', m, width=46, height=9, y=1)
    f = el('Fill', m); el('SolidColor', f, colorValue='FFBFAE92'); markers.append(m)
    inner.remove(m); inner.append(m)                             # behind her
for i, m in enumerate(markers): bindp(m, 13, f'mX{i}'); bindp(m, 14, f'mY{i}')
c0 = CTRL[DEFAULT_VIEW]['c']
floor = el('Shape', ab, name='Floor line', x=CHAR_X + 512 * SCALE, y=CHAR_Y + (c0['oyg'] - 72) * SCALE); el('Rectangle', floor, width=760, height=2)
f = el('Fill', floor); el('SolidColor', f, colorValue='FFD9CDBA')
shadow = el('Shape', ab, name='Contact shadow', x=CHAR_X + 500 * SCALE, y=CHAR_Y + (c0['oyg'] - 72) * SCALE); el('Ellipse', shadow, width=250, height=24)
f = el('Fill', shadow, fillRule='clockwise'); el('SolidColor', f, colorValue='30402A10'); el('Feather', f, strength=9)
ab.remove(floor); ab.insert(0, floor); ab.remove(shadow); ab.insert(1, shadow)

# ---------------------------------------------------------------- controller, buttons, state machine
ins = el('ViewModelInstance', vm, name='Default', exports=True, id='0:41')
for name, value in defaults.items(): el('ViewModelInstanceNumber', ins, viewModelPropertyId=props[name], propertyValue=value)
import shutil; shutil.copy(HERE / 'face' / 'face.luau', OUTD / 'face.luau')
shutil.copy(HERE / 'hands' / 'hand_pose.luau', OUTD / 'hand_pose.luau')
el('ScriptAsset', root, file='hand_pose.luau', name='hand_pose', isModule=True, id='0:79')
el('ScriptAsset', root, file='face.luau', name='face', isModule=True, id='0:77')
for i, V in enumerate(FACE_VIEWS): el('ScriptAsset', root, file=f'face_cfg_{V}.luau', name=f'face_cfg_{V}', isModule=True, id=f'0:{70 + i}')
# [liv-actions] begin: the action module (required by liv.luau, so declared before it)
actions_rig.instance(el, ins)
shutil.copy(HERE / 'actions.luau', OUTD / 'actions.luau'); el('ScriptAsset', root, file='actions.luau', name='actions', isModule=True, id='0:78')
# [liv-actions] end
el('ScriptAsset', root, file='liv.luau', name='liv', id='0:80')
layout = el('LayoutComponent', ab, name='Liv controller', width=STAGE_W, height=STAGE_H, styleId='0:82', id='0:81')
el('LayoutComponentStyle', layout, name='Fill stage', layoutWidthScaleType='fill', layoutHeightScaleType='fill', widthUnitsValue='auto', heightUnitsValue='auto', id='0:82')
el('ScriptedLayout', layout, name='Liv controller', scriptAssetId='0:80')
ab.remove(layout); ab.insert(0, layout)
POSES = ['Rest', 'Wave', 'Reach', 'Cheer', 'Crouch', 'Step', 'Hands', 'Bind']
el('FontAsset', root, file='Inter.ttf', name='Inter', id='0:30')
def text(content, x, y, size=18, color='FF4C4038', at=None):
    t = el('Text', ab, name=content, x=x, y=y)
    st = el('TextStylePaint', t, fontSize=size, fontAssetId='0:30'); f = el('Fill', st); el('SolidColor', f, colorValue=color)
    el('TextValueRun', t, styleId=st.get('id'), text=content)          # without a run the text is empty
    ab.remove(t); ab.insert(3 if at is None else at, t)          # above the buttons: the first child is drawn on top
    return t
text('Liv · Rive rig · views, walk, run, poses', 40, 12, 18)
text('Poses', 1088, 82, 14, 'FF8B7460'); text('Gait', 1088, 586, 14, 'FF8B7460'); text('View', 790, 82, 14, 'FF8B7460')
sm = el('StateMachine', ab, name='Liv', id='0:7'); layer = el('StateMachineLayer', sm, name='Body', id='0:8')
def button(label, x, y, w, h, actions):
    sh = el('Shape', ab, x=x, y=y, name=label + ' button'); el('Rectangle', sh, width=w, height=h, cornerRadiusTL=10, cornerRadiusTR=10, cornerRadiusBL=10, cornerRadiusBR=10)
    f = el('Fill', sh); el('SolidColor', f, colorValue='FFE6D8C6'); ab.remove(sh); ab.insert(3, sh)
    text(label, x - (len(label) * 5.2), y - 11, 18, at=3)
    li = el('StateMachineListenerSingle', sm, targetId=sh.get('id'), listenerTypeValue='click', name=label)
    for p_, val in actions:
        act = el('ListenerViewModelChange', li); bp = el('BindablePropertyNumber', act, propertyValue=val)
        el('DataBindContext', bp, sourcePathIds='0:40-' + props[p_], propertyKey=636, direction=True)
for i, n in enumerate(POSES): button(n, 1130, 120 + i * 54, 150, 42, [('pose', i), ('gait', 0)])
button('Walk', 1130, 624, 150, 42, [('gait', 1), ('pose', 0)]); button('Run', 1130, 678, 150, 42, [('gait', 2), ('pose', 0)]); button('Stop', 1130, 732, 150, 42, [('gait', 0)])
VIEW_BUTTONS = [('Front', 0), ('3/4 front', 1), ('Side', 2), ('3/4 back', 3), ('Back', 4)]
for i, (n, vv) in enumerate(VIEW_BUTTONS): button(n, 860, 120 + i * 54, 150, 42, [('view', vv)])
button('Face left', 860, 120 + 5 * 54 + 20, 150, 42, [('mirror', 1)]); button('Face right', 860, 120 + 6 * 54 + 20, 150, 42, [('mirror', 0)])
# [liv-actions] begin: action and prop buttons
actions_rig.buttons(dict(el=el, ab=ab, sm=sm, props=props, text=text))
# [liv-actions] end
entry = el('EntryState', layer, x=0, y=0); el('StateTransition', entry, stateToId='0:12')
el('AnyState', layer, x=0, y=-150); el('ExitState', layer, x=650, y=-150)
el('AnimationState', layer, animationId='0:60', id='0:12', x=180, y=0)
an = el('LinearAnimation', ab, name='Idle', fps=60, duration=240, loopValue='loop', id='0:60')
for V in VIEWS:                                                  # breathing: the chest rises a little (keeps the state machine running too)
    ko = el('KeyedObject', an, objectId=SPINE_ID[V]); kp = el('KeyedProperty', ko, property='scaleY')
    for fr, v in [(0, 1), (120, 1.004), (240, 1)]: el('KeyFrameDouble', kp, frame=fr, value=v, interpolationType='cubic')

# ---------------------------------------------------------------- controller text (template + generated values)
sys.path.insert(0, str(HERE)); from poses3d import POSES3D   # the pose table as Luau text
def lua_num(v): return f'{v:.10g}'
def lua_tbl(d): return '{' + ','.join(f'{k}={lua_num(v)}' for k, v in d.items()) + '}'
view_lines = ',\n'.join(f" {{name='{V}',yaw={lua_num(CTRL[V]['yaw'])},aR={'true' if CTRL[V]['aR'] else 'false'},farB={'true' if CTRL[V]['farB'] else 'false'},\n  c={lua_tbl(CTRL[V]['c'])},\n  rest={lua_tbl(CTRL[V]['rest'])}}}" for V in VIEWS)
face_req = ''.join(f"local FACE_CFG_{V.upper()} = require('face_cfg_{V}')\n" for V in FACE_VIEWS)
face_list = ', '.join(f"{{pre = '{V}_', cfg = FACE_CFG_{V.upper()}}}" for V in FACE_VIEWS)
luau = (HERE / 'liv.tmpl.luau').read_text().replace('@VIEWS@', view_lines).replace('@POSES@', POSES3D).replace('@FACEREQ@', face_req).replace('@FACEVIEWS@', face_list)
(OUTD / 'liv.luau').write_text(luau)
E.indent(root)
(OUTD / 'scene.rml').write_text(E.tostring(root, encoding='unicode'))
(OUTD / 'rive.yaml').write_text('name: Liv\nlogs:\n  file: build/rive.log\n  problems: build/problems.log\n')
(OUTD / '.gitignore').write_text('build/\nweb-check/*.riv\nart/\n')
json.dump({'views': VIEWS, 'ctrl': CTRL, 'props': len(props)}, open(OUTD / 'defaults.json', 'w'), indent=1)
print('views', VIEWS, 'view-model numbers', len(props))
