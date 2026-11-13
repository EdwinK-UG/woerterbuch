"""Liv's action library in the Rive build: view-model numbers, props (apple, crate, saw handle), head offsets, demo buttons.

Called from build_liv.py at four clearly marked hooks (search for `[liv-actions]`); the controller side is actions.luau
(required by liv.tmpl.luau). See docs/liv-actions.md.

Props are vector shapes in the painted style (ink #3a1c0c outline): an apple (#d9473a with a leaf) and a saw handle (#b07a3f)
mounted on her right hand in every view, behind the fingers so the grip wraps them; a crate (tan) between both hands, placed
by the controller; a second apple per view that flies when she throws.
"""
import math

# the canvas order (tools/liv/src/06-actions.js); `action` = index + 1
ACTIONS = ['wave', 'point', 'pointUp', 'thumb', 'clap', 'shrug', 'think', 'cheer', 'hips', 'present', 'stop', 'beckon', 'count',
           'nod', 'shake', 'bow', 'jump', 'crouch', 'carry', 'push', 'pull', 'throw', 'kick', 'sit', 'dance', 'explain', 'ouchHand']
LABELS = {'pointUp': 'point up', 'thumb': 'thumbs up', 'ouchHand': 'ouch hand', 'hips': 'hands hips'}
PROPS = {'apple': 1, 'crate': 2, 'saw': 3}

INK, APPLE, APPLE_HI, LEAF, STEM = 'FF3A1C0C', 'FFD9473A', 'FFEE7A62', 'FF6E9A3C', 'FF6B3F1D'
TAN, TAN_D, BLUE, WOOD, WOOD_D = 'FFD9AE72', 'FFB98A4E', 'FF4F78A8', 'FFB07A3F', 'FF8A5A2B'


def declare(prop):
    """Global view-model numbers (hook 1, next to the other globals)."""
    for k, v in {'action': 0, 'actionT': 0.0, 'prop': 0, 'propApple': 0.0, 'propCrate': 0.0, 'propSaw': 0.0, 'flyOp': 0.0}.items():
        prop(k, v)


def _fill(el, sh, color):
    f = el('Fill', sh); el('SolidColor', f, colorValue=color)


def _stroke(el, sh, w=3.0):
    s = el('Stroke', sh, thickness=w, join='round', cap='round'); el('SolidColor', s, colorValue=INK)


def _path(el, parent, pts, closed=True):
    """pts: (x, y) or (x, y, inRot, inDist, outRot, outDist) for a smooth vertex."""
    p = el('PointsPath', parent, isClosed=closed)
    for q in pts:
        if len(q) == 2: el('StraightVertex', p, x=q[0], y=q[1])
        else: el('CubicDetachedVertex', p, x=q[0], y=q[1], inRotation=q[2], inDistance=q[3], outRotation=q[4], outDistance=q[5])
    return p


def apple(el, parent, name, x=0.0, y=0.0, r=26.0):
    """An apple of radius r (view px) centred at (x, y), stem up (-y)."""
    n = el('Node', parent, name=name, x=x, y=y)
    leaf = el('Shape', n, name=name + ' leaf', x=r * .12, y=-r * 1.02, rotation=-.55)
    _path(el, leaf, [(0, 0, math.pi * .5, r * .28, -math.pi * .5, r * .28), (r * .78, 0, -math.pi * .5, r * .28, math.pi * .5, r * .28)])
    _fill(el, leaf, LEAF); _stroke(el, leaf, 2.4)
    stem = el('Shape', n, name=name + ' stem', x=r * .02, y=-r * .95, rotation=.25)
    el('Rectangle', stem, width=r * .14, height=r * .42, cornerRadiusTL=2, cornerRadiusTR=2, cornerRadiusBL=2, cornerRadiusBR=2)
    _fill(el, stem, STEM); _stroke(el, stem, 2.0)
    hi = el('Shape', n, name=name + ' shine', x=-r * .38, y=-r * .3, rotation=-.5)
    el('Ellipse', hi, width=r * .34, height=r * .2); _fill(el, hi, APPLE_HI)
    body = el('Shape', n, name=name + ' body')
    # a round apple a little wider than tall with a dip at the stem
    _path(el, body, [(0, -r * .78, math.pi * .85, r * .35, math.pi * .15, r * .35), (r * .98, -r * .2, -math.pi * .5, r * .45, math.pi * .5, r * .5),
                     (r * .35, r * .95, 0.0, r * .35, math.pi, r * .2), (-r * .35, r * .95, 0.0, r * .2, math.pi, r * .35),
                     (-r * .98, -r * .2, math.pi * .5, r * .5, -math.pi * .5, r * .45)])
    _fill(el, body, APPLE); _stroke(el, body, 3.0)
    # first child on top: shine above the body; leaf and stem behind it
    for k in (hi, body, stem, leaf): n.remove(k); n.append(k)
    return n


def saw_handle(el, parent, name, x=0.0, y=0.0):
    """The saw's grip: a wooden bar across the palm (along the mount's y axis) with the D-frame's ends."""
    n = el('Node', parent, name=name, x=x, y=y)
    bar = el('Shape', n, name=name + ' grip')
    el('Rectangle', bar, width=30, height=96, cornerRadiusTL=13, cornerRadiusTR=13, cornerRadiusBL=13, cornerRadiusBR=13)
    _fill(el, bar, WOOD); _stroke(el, bar, 3.0)
    for i, yy in enumerate((-40, 40)):
        cap = el('Shape', n, name=name + f' frame {i}', x=-16, y=yy)
        el('Rectangle', cap, width=34, height=20, cornerRadiusTL=6, cornerRadiusTR=6, cornerRadiusBL=6, cornerRadiusBR=6)
        _fill(el, cap, WOOD_D); _stroke(el, cap, 2.6)
    return n


def crate(el, parent, name):
    """A small wooden crate (220 x 150 view px at scale 1), centred on the node, with a blue label."""
    n = el('Node', parent, name=name)
    box = el('Shape', n, name=name + ' box')
    el('Rectangle', box, width=220, height=150, cornerRadiusTL=8, cornerRadiusTR=8, cornerRadiusBL=8, cornerRadiusBR=8)
    _fill(el, box, TAN); _stroke(el, box, 3.5)
    parts = [box]
    for i, yy in enumerate((-25, 25)):
        pl = el('Shape', n, name=name + f' plank {i}', y=yy); el('Rectangle', pl, width=214, height=4); _fill(el, pl, TAN_D); parts.append(pl)
    lab = el('Shape', n, name=name + ' label'); el('Rectangle', lab, width=70, height=36, cornerRadiusTL=5, cornerRadiusTR=5, cornerRadiusBL=5, cornerRadiusBR=5)
    _fill(el, lab, BLUE); _stroke(el, lab, 2.4); parts.append(lab)
    for k in (lab, *parts[1:], box): n.remove(k); n.append(k)
    return n


BOOLS = []          # (name, property id) of the boolean view-model properties made here (their instance values: instance())


def view(ctx):
    """Per view (hook 2, inside emit_view after the draw order): props and the head offset numbers.
    ctx: el, g, bones, hand_mounts, far_hand_front, far, near, A_is_R, vprop, vbind, bindp, rest, head_anchor, far_top"""
    el, g, vprop, vbind, bindp = ctx['el'], ctx['g'], ctx['vprop'], ctx['vbind'], ctx['bindp']
    V = ctx['V']
    # the head can move a little on the neck (nod seen from the front, shake, shrug): its bone position in the spine's frame
    hb = ctx['bones']['head']
    for k, key, attr in (('headPX', 90, 'x'), ('headPY', 91, 'y')):   # RootBone x / y
        v0 = float(hb.get(attr)); ctx['rest'][k] = v0; vprop(k, v0)
        vbind(hb, key, k)
    # which way each arm's IK bends (the controller picks the side from the action's elbow hint): IK invertDirection
    for sd in ('A', 'B'):
        ik = ctx['bones'][f'fore{sd}'].find('IKConstraint')
        if ik is None: continue
        b = el('ViewModelPropertyBoolean', ctx['vm'], name=f'{V}_ikInv{sd}'); BOOLS.append((b.get('name'), b.get('id'), False))
        el('DataBindContext', ik, sourcePathIds='0:40-' + b.get('id'), propertyKey=174)
    # seen from the front or back both knees bend to the same side of the screen; a deep crouch or sit turns leg A's knee
    # to the other side (knees apart) while the action holds the hips low
    if ctx['yaw'] in (0, 180):
        ik = ctx['bones']['shinA'].find('IKConstraint')
        b = el('ViewModelPropertyBoolean', ctx['vm'], name=f'{V}_legInvA'); BOOLS.append((b.get('name'), b.get('id'), ik.get('invertDirection') == 'true'))
        el('DataBindContext', ik, sourcePathIds='0:40-' + b.get('id'), propertyKey=174)
    # her right hand: the near hand in front / three-quarter / side / three-quarter back, the far one in the back view
    rs = 'A' if ctx['A_is_R'] else 'B'
    mounts = [ctx['hand_mounts'][rs]] + ([ctx['far_hand_front']] if rs == ctx['far'] and ctx['far_hand_front'] is not None else [])
    for i, m in enumerate(mounts):
        # grip point: in the mount's frame x runs from the wrist along the hand, the palm side is -y for the right hand
        a = apple(el, m, f'Liv {V} apple in hand {i}', x=54, y=-24, r=26)
        bindp(a, 18, 'propApple')
        s = saw_handle(el, m, f'Liv {V} saw handle {i}', x=50, y=-6)
        bindp(s, 18, 'propSaw')
    # crate between the hands: below the hands (they hold its sides), above the torso
    c = crate(el, g, f'Liv {V} crate')
    vprop('crateX', 512.0); vprop('crateY', 700.0); vprop('crateSX', 1.0)
    vbind(c, 13, 'crateX'); vbind(c, 14, 'crateY'); vbind(c, 16, 'crateSX'); bindp(c, 18, 'propCrate')
    g.remove(c)
    if ctx['yaw'] > 90: g.append(c)                       # seen from behind, the crate in front of her is behind everything
    else:
        kids = list(g); anchor = ctx['far_top'] if ctx['far_top'] is not None else ctx['head_anchor']
        g.insert(kids.index(anchor) + 1, c)
    # the thrown apple: above everything in the view
    fa = apple(el, g, f'Liv {V} flying apple', r=26)
    vprop('flyX', 512.0); vprop('flyY', 600.0); vprop('flyS', 1.0)
    vbind(fa, 13, 'flyX'); vbind(fa, 14, 'flyY'); vbind(fa, 16, 'flyS'); vbind(fa, 17, 'flyS'); bindp(fa, 18, 'flyOp')
    g.remove(fa); g.insert(0, fa)


def instance(el, ins):
    """Hook 3: the default instance's values of the boolean properties."""
    for _, pid, v in BOOLS: el('ViewModelInstanceBoolean', ins, viewModelPropertyId=pid, propertyValue=v)


def buttons(ctx):
    """Demo buttons (hook 4): a column of small action buttons and the props. ctx: el, ab, sm, props, text"""
    el, ab, sm, props, text = ctx['el'], ctx['ab'], ctx['sm'], ctx['props'], ctx['text']

    def small(label, x, y, w, h, actions, size=12):
        sh = el('Shape', ab, x=x, y=y, name=label + ' action button')
        el('Rectangle', sh, width=w, height=h, cornerRadiusTL=7, cornerRadiusTR=7, cornerRadiusBL=7, cornerRadiusBR=7)
        f = el('Fill', sh); el('SolidColor', f, colorValue='FFEADFCF'); ab.remove(sh); ab.insert(3, sh)
        text(label, x - len(label) * size * .29, y - size * .62, size, at=3)
        li = el('StateMachineListenerSingle', sm, targetId=sh.get('id'), listenerTypeValue='click', name='action ' + label)
        for p_, val in actions:
            act = el('ListenerViewModelChange', li); bp = el('BindablePropertyNumber', act, propertyValue=val)
            el('DataBindContext', bp, sourcePathIds='0:40-' + props[p_], propertyKey=636, direction=True)

    text('Actions', 762, 528, 14, 'FF8B7460')
    W, H, X0, DX, Y0, DY = 86, 26, 806, 92, 562, 30
    coords = {}
    for i, n in enumerate(ACTIONS):
        col, row = i % 3, i // 3
        x, y = X0 + col * DX, Y0 + row * DY
        coords[n] = (x, y)
        acts = [('action', i + 1)]
        if n == 'throw': acts.append(('prop', PROPS['apple']))       # she throws the apple
        if n == 'carry': acts.append(('prop', PROPS['crate']))       # and keeps holding the crate (Empty hands puts it down)
        small(LABELS.get(n, n), x, y, W, H, acts)
    text('Props', 1088, 792, 14, 'FF8B7460')
    for i, (lab, v) in enumerate([('Apple', 1), ('Crate', 2), ('Saw handle', 3), ('Empty hands', 0)]):
        small(lab, 1130, 830 + i * 34, 150, 28, [('prop', v)], 14)
    return coords
