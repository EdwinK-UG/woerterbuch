"""Liv's rigged hand for Rive, built from the owner's painted parts sheet (cut by cut_hand_sheet.py).

    import sys; sys.path.insert(0, str(HERE / 'hands')); import hand_rig
    root_node, names = hand_rig.emit_hand(el, parent, 'R', 1.0, props, pre='tq_')

Pieces (tools/liv/rive/hands/pieces/rig/*.png, measured pivots in pieces/pieces.json): per side of the hand (back /
palm) one fingerless palm with the wrist stump, per finger a base piece (proximal + middle phalanx) and a tip piece,
and the thumb as base + tip. Two complete sets, back of the hand and palm side, cross-faded by `palmSide`.

Hierarchy (a Node tree, no meshes):
    hand (scale) -> mirror (scaleX = flip: +1 right hand, -1 left hand) -> art (native px -> view px, fingers +x)
      -> back set / palm set (opacity from palmSide) -> palm picture, thumb, index, middle, ring, little
    finger: root (at the knuckle; rotation = spread fan) -> converge (rotation = a little toward the middle as it
            curls) -> base (scaleY = s1) and tip joint (y follows s1) -> tip (scaleY = s2)
    thumb : root (in the thumb mound; rotation = opposition) -> mcp (rotation = thumbCurl) -> base picture,
            tip joint -> tip (scaleY)
Curling: the sheet draws the fingers straight up seen from the back or the palm, so a curl is mostly a turn AWAY
from (back) or TOWARD (palm) the viewer. Each piece is therefore foreshortened along the finger instead of turned in the
picture plane: s = cos(angle + TILT) / cos(TILT), angle = curl * (BASE_MAX, BASE_MAX + TIP_MAX). s < 0 folds the
piece down over the palm (drawn mirrored, which reads as the back of the folded finger).
Draw order: back of the hand: the palm picture is in FRONT of the fingers (their root ends hide under the knuckle edge,
and fingers that fold go behind the back of the hand, as they do); base above tip. Palm side: fingers in FRONT of the
palm (they fold over it; the closed root end of each base piece reads as the finger's crease on the palm); tip above
base; the thumb on top of everything.
All motion is data binding (converters on the curl numbers), so the hand also works without a script.

props (a dict):
  'prefix'   name of the hand in the view model, e.g. 'handA' (default 'hand' + side)
  'root'     the <Rive> root element (converters are root elements; shared by all hands under one root)
  'asset'    callable(rel_path) -> ImageAsset id (rel_path relative to the Rive project folder)
  'pieces'   rel path of the rig pictures folder as seen from the project, e.g. '../hands/pieces/rig'
  'bind'     callable(target, propertyKey, vmName, converterId_or_None)
  'declare'  optional callable(vmName, default): called for every name before it is bound
  'defaults' optional {base name: value}
  out: 'names', 'defaults' (full names), 'stats'
pre: a view prefix put in front of every name (build_liv.py: 'tq_' ...): pre + prefix + 'IndexCurl'.
"""
import json, math
from pathlib import Path

HERE = Path(__file__).resolve().parent
P = json.loads((HERE / 'pieces' / 'pieces.json').read_text())
RIG_S = P['_meta']['rigScale']

WRIST_BACK = 9.0       # view px: the hand starts this far back into the forearm
ART_S = .09            # sheet px -> view px (a whole hand, wrist to middle tip, about 115 view px)
FIN_SX, FIN_SY = P['_meta']['fingerScaleX'], P['_meta']['fingerScaleY'] # finger pieces: narrower than drawn (the sheet's fingers are too wide for its palm)
THUMB_S = .70           # thumb pieces (the sheet's thumb base is a cupcake)
ROOT_DEPTH = P['_meta']['rootDepth']  # the base piece's root END sits this many (scaled) finger widths below the knuckle bump's top
ROOT_FADE = (.42, .60)  # palm side: the root patch fades out between these curls (the finger then folds over the palm)
TIP_ENDON = (.20, .25)   # palm side: tips fade out when seen this end-on (|foreshortening| below)
BASE_ENDON = (.03, .12)
CLIP_BELOW = 200.0      # native px below the lowest knuckle top: fingers are clipped there on the back view
TIP_HIDE = 70.0         # native px: a tip seen end-on slides this far INSIDE the base (no double edge)
JOINT_OVERLAP = 34.0    # native px: the tip's root end tucks this far under the base's end (one knuckle line, no notch)
TILT = math.radians(16)  # the camera looks a little along the fingers: a finger at 74 deg is seen end-on
BASE_MAX = 118.0        # degrees at curl 1: MCP + PIP together (the base piece is the proximal + middle phalanx)
TIP_MAX = 128.0         # DIP on top of that, growing with curl^2 (it lags at small curls); 246 in a fist
T_TIP_MAX = 95.0        # thumb IP
T_MCP = .38             # radians the whole thumb turns toward the palm at thumbCurl 1 (MCP flexion)
THUMB_OPP = (-1.05, -.06, 1.2)   # thumb angle from its drawn tilt at thumbOpp -1 (out, thumbs-up), 0, +1 (across)
THUMB_ROOT = (95.0, 70.0)       # thumb root pivot from the mound's outer point, toward the palm (native px)
FINGERS = ['index', 'middle', 'ring', 'pinky']
FAN = {'index': -.16, 'middle': -.04, 'ring': .07, 'pinky': .19}        # radians at spread 1 (back view; - = thumb side)
REST = {'index': -.03, 'middle': 0.0, 'ring': .02, 'pinky': .05}
CONVERGE = {'index': .10, 'middle': .02, 'ring': -.05, 'pinky': -.12}   # radians at curl 1 (fingers close up in a fist)

BASE_DEFAULTS = {'thumbCurl': .2, 'thumbOpp': 0.0, 'indexCurl': .22, 'middleCurl': .28, 'ringCurl': .33,
                 'pinkyCurl': .38, 'spread': .15, 'flip': 1.0, 'palmSide': 0.0}
NAMES = list(BASE_DEFAULTS)
_CONV = {}


def _s(c, deg, deg2=0.0):
    """Foreshortening of a piece at curl c: its angle is deg * c + deg2 * c^2 (deg2: the end joint lags at small curls)."""
    return math.cos(math.radians(deg) * c + math.radians(deg2) * c * c + TILT) / math.cos(TILT)


OPS = {'+': 0, '-': 1, '*': 2, '/': 3}
FUN = {'min': 0, 'max': 1, 'cos': 9, 'sin': 10}


def _tokens(el, conv, e):
    if isinstance(e, (int, float)):
        el('FormulaTokenValue', conv, operationValue=round(float(e), 7)); return
    if e[0] == 'in':
        el('FormulaTokenInput', conv); return
    if e[0] in OPS:
        el('FormulaTokenParenthesisOpen', conv); _tokens(el, conv, e[1])
        el('FormulaTokenOperation', conv, operationType=OPS[e[0]]); _tokens(el, conv, e[2])
        el('FormulaTokenParenthesisClose', conv); return
    el('FormulaTokenFunction', conv, functionType=FUN[e[0]])
    for i, a in enumerate(e[1:]):
        if i: el('FormulaTokenArgumentSeparator', conv)
        _tokens(el, conv, a)
    el('FormulaTokenParenthesisClose', conv)


def _ex_s(deg, mul=1.0, deg2=0.0):
    a = ('*', ('in',), math.radians(deg))
    if deg2: a = ('+', a, ('*', ('*', ('in',), ('in',)), math.radians(deg2)))
    return ('*', ('cos', ('+', a, TILT)), mul / math.cos(TILT))


def _ex_slide(deg, L, deg2=0.0):
    """Back of the hand: how far a piece slides back under the piece in front of it, L * (1 - max(s, 0))."""
    return ('*', L, ('-', 1.0, ('max', _ex_s(deg, 1.0, deg2), 0.0)))


def _slide(c, deg, L, deg2=0.0): return L * (1 - max(_s(c, deg, deg2), 0))


def _tip_len(f):
    return P[f'back_{f}_tip']['length'] * FIN_SY


def _thumb_tip_len():
    return P['back_thumb_tip']['length'] * THUMB_S


def _ex_endon(ex, a, b):
    """Opacity from a foreshortening s: 0 below |s| = a, 1 above |s| = b."""
    ab = ('max', ex, ('*', -1.0, ex))
    return ('min', 1.0, ('max', 0.0, ('/', ('-', ab, a), b - a)))


def _endon(sv, a, b): return min(1.0, max(0.0, (abs(sv) - a) / (b - a)))


def _thumb_angle(o):
    a0, a1, a2 = THUMB_OPP
    return a1 + (a2 - a1) * max(o, 0) + (a1 - a0) * min(o, 0)


def _base_len(f):
    """Root end to tip joint of a finger's base piece (scaled native px)."""
    b = P[f'back_{f}_base']
    return math.dist(b['baseEnd'], b['tipEnd']) * FIN_SY - JOINT_OVERLAP


def _axis_angle(u):
    """Angle from 'up' (0, -1) to the axis u, clockwise positive (Rive rotation)."""
    return math.atan2(u[0], -u[1])


def _converters(el, root):
    key = id(root)
    if key in _CONV: return _CONV[key]
    C = {}

    def formula(name, ex):
        conv = el('DataConverterFormula', root, name=name); _tokens(el, conv, ex); C[name] = conv.get('id')

    def mapper(name, a, b, c, d, clamp=False):
        kw = {'clampLower': True, 'clampUpper': True} if clamp else {}
        C[name] = el('DataConverterRangeMapper', root, name=name, minInput=a, maxInput=b, minOutput=c, maxOutput=d, **kw).get('id')

    formula('hand base fold', _ex_s(BASE_MAX))
    formula('hand tip fold', _ex_s(BASE_MAX, 1.0, TIP_MAX))
    formula('hand thumb tip fold', _ex_s(T_TIP_MAX))
    # palm side: a piece seen nearly end-on would be a smeared sliver; it fades out over the last bit instead
    formula('hand tip end-on', _ex_endon(_ex_s(BASE_MAX, 1.0, TIP_MAX), *TIP_ENDON))
    formula('hand base end-on', _ex_endon(_ex_s(BASE_MAX), *BASE_ENDON))
    formula('hand thumb tip end-on', _ex_endon(_ex_s(T_TIP_MAX), *TIP_ENDON))
    formula('hand thumb slide tip', _ex_slide(T_TIP_MAX, _thumb_tip_len()))
    for f in FINGERS:
        formula(f'hand {f} tip joint', _ex_s(BASE_MAX, -_base_len(f)))
        formula(f'hand {f} slide base', _ex_slide(BASE_MAX, _base_len(f)))
        formula(f'hand {f} slide tip', _ex_slide(BASE_MAX, _tip_len(f) + TIP_HIDE, TIP_MAX))
        for side, sg in (('back', 1), ('palm', -1)):
            mapper(f'hand {f} fan {side}', 0, 1, sg * REST[f], sg * (REST[f] + FAN[f]))
            mapper(f'hand {f} converge {side}', 0, 1, 0, sg * CONVERGE[f])
    a0, a1, a2 = THUMB_OPP
    for side, sg in (('back', 1), ('palm', -1)):
        formula(f'hand thumb opp {side}', ('*', sg, ('+', a1, ('+', ('*', a2 - a1, ('max', ('in',), 0.0)),
                                                               ('*', a1 - a0, ('min', ('in',), 0.0))))))
        mapper(f'hand thumb mcp {side}', 0, 1, 0, sg * T_MCP)
    mapper('hand root patch', ROOT_FADE[0], ROOT_FADE[1], 1, 0, clamp=True)
    mapper('hand back opacity', .4, .6, 1, 0, clamp=True)
    mapper('hand palm opacity', .4, .6, 0, 1, clamp=True)
    _CONV[key] = C
    return C


def emit_hand(el, parent, side, scale, props, pre=''):
    prefix = props.get('prefix') or ('hand' + side)
    root = props['root']; bind_raw = props['bind']; asset = props['asset']; rel = props['pieces']
    declare = props.get('declare')
    stats = {'images': 0, 'nodes': 0, 'binds': 0}
    C = _converters(el, root)
    base = dict(BASE_DEFAULTS); base['flip'] = 1.0 if side == 'R' else -1.0
    base.update(props.get('defaults') or {})
    vm = {b: pre + prefix + b[0].upper() + b[1:] for b in NAMES}
    if declare:
        for b in NAMES: declare(vm[b], base[b])

    def bind(t, k, b, conv=None):
        stats['binds'] += 1; bind_raw(t, k, vm[b], conv)

    def node(par, name, **a):
        stats['nodes'] += 1; return el('Node', par, name=f'{pre}{prefix} {name}', **a)

    def picture(par, piece, px, py, sx, sy, name):
        """The rig picture of `piece`, scaled (sx, sy) from native px, with its native point (px, py) at the origin."""
        stats['images'] += 1
        q = P[piece].get('rig')
        bx, by = (q[2] / q[0], q[3] / q[1]) if q else (RIG_S, RIG_S)      # rig px per native px (baked, rounded)
        return el('Image', par, name=f'{pre}{prefix} {name}', assetId=asset(f'{rel}/{piece}.png'), originX=0, originY=0, samplerWrapX=1, samplerWrapY=1,
                  x=round(-px * sx, 3), y=round(-py * sy, 3), scaleX=round(sx / bx, 5), scaleY=round(sy / by, 5))

    hand = node(parent, 'hand', x=-WRIST_BACK, scaleX=scale, scaleY=scale)       # the stump overlaps the forearm's end (no gap at the wrist)
    mirror = node(hand, 'mirror', scaleY=base['flip']); bind(mirror, 17, 'flip')
    art = node(mirror, 'art', rotation=math.pi / 2, scaleX=ART_S, scaleY=ART_S)    # sheet up -> along the hand bone

    p = base['palmSide']
    for hs in ('back', 'palm'):
        sg = 1 if hs == 'back' else -1
        op = (min(1, max(0, (.6 - p) / .2)) if hs == 'back' else min(1, max(0, (p - .4) / .2)))
        S = node(art, f'{hs} side', opacity=op); bind(S, 18, 'palmSide', C[f'hand {hs} opacity'])
        pm = P[f'{hs}_palm']; wx, wy = pm['wrist']
        fingers = node(S, f'{hs} fingers')
        groups = {'thumb': node(S, f'{hs} thumb')}
        groups.update({g: node(fingers, f'{hs} {g}') for g in FINGERS})
        palm_img = picture(S, f'{hs}_palm', wx, wy, 1, 1, f'{hs} palm')
        order = [palm_img, groups['thumb'], fingers] if hs == 'back' else [groups['thumb'], fingers, palm_img]
        for k in order: S.remove(k)
        for k in order: S.append(k)
        if hs == 'back':
            # back of the hand: fingers that slide back under the palm must not come out below it; they are clipped
            # to the region above a line a little below the knuckles (well inside the palm picture)
            yc = max(v[1] for v in pm['fingerTops'].values()) + CLIP_BELOW - wy
            clip = el('Shape', S, name=f'{pre}{prefix} {hs} finger clip')
            el('Rectangle', clip, x=-4000, y=yc - 8000, originX=0, originY=0, width=8000, height=8000)
            S.remove(clip); S.append(clip)
            el('ClippingShape', fingers, sourceId=clip.get('id'), name=f'{pre}{prefix} {hs} finger clip')

        # ---- fingers
        for f in FINGERS:
            c0 = base[f + 'Curl']
            bp = P[f'back_{f}_base']
            bpc, tpc = P[f'{hs}_{f}_base'], P[f'{hs}_{f}_tip']
            kx, ky = pm['fingerTops'][f]
            fw = bp['width'] * FIN_SX
            rx, ry = kx - wx, ky - wy + ROOT_DEPTH * fw
            r = node(groups[f], f'{hs} {f} root', x=round(rx, 2), y=round(ry, 2),
                     rotation=sg * (REST[f] + FAN[f] * base['spread']))
            bind(r, 15, 'spread', C[f'hand {f} fan {hs}'])
            cv = node(r, f'{hs} {f} converge', rotation=sg * CONVERGE[f] * c0)
            bind(cv, 15, f + 'Curl', C[f'hand {f} converge {hs}'])
            s1, s2 = _s(c0, BASE_MAX), _s(c0, BASE_MAX, TIP_MAX)
            if hs == 'back':
                # back of the hand: a curling finger turns away; each piece slides back under the one in front of it
                # (the palm hides the base, the base hides the tip), so ends stay round and lines stay even
                sl = node(cv, f'{hs} {f} slide', y=round(_slide(c0, BASE_MAX, _base_len(f)), 3))
                bind(sl, 14, f + 'Curl', C[f'hand {f} slide base'])
                picture(sl, f'{hs}_{f}_base', bpc['baseEnd'][0], bpc['baseEnd'][1], FIN_SX, FIN_SY, f'{hs} {f} base picture')
                joint = node(sl, f'{hs} {f} tip joint', y=round(-_base_len(f), 3))
                tsl = node(joint, f'{hs} {f} tip slide', y=round(_slide(c0, BASE_MAX, _tip_len(f) + TIP_HIDE, TIP_MAX), 3))
                bind(tsl, 14, f + 'Curl', C[f'hand {f} slide tip'])
                picture(tsl, f'{hs}_{f}_tip', tpc['baseEnd'][0], tpc['baseEnd'][1], FIN_SX, FIN_SY, f'{hs} {f} tip picture')
            else:
                # palm side: the finger turns toward the viewer and folds down over the palm: foreshortened pieces
                bnode = node(cv, f'{hs} {f} base', scaleY=s1, opacity=round(_endon(s1, *BASE_ENDON), 4))
                bind(bnode, 17, f + 'Curl', C['hand base fold']); bind(bnode, 18, f + 'Curl', C['hand base end-on'])
                picture(bnode, f'{hs}_{f}_base', bpc['baseEnd'][0], bpc['baseEnd'][1], FIN_SX, FIN_SY, f'{hs} {f} base picture')
                joint = node(cv, f'{hs} {f} tip joint', y=round(-_base_len(f) * s1, 3))
                bind(joint, 14, f + 'Curl', C[f'hand {f} tip joint'])
                tnode = node(joint, f'{hs} {f} tip', scaleY=s2, opacity=round(_endon(s2, *TIP_ENDON), 4))
                bind(tnode, 17, f + 'Curl', C['hand tip fold']); bind(tnode, 18, f + 'Curl', C['hand tip end-on'])
                picture(tnode, f'{hs}_{f}_tip', tpc['baseEnd'][0], tpc['baseEnd'][1], FIN_SX, FIN_SY, f'{hs} {f} tip picture')
            if hs == 'palm':
                # palm side: a patch of the palm over the finger's root while it is fairly straight (the finger grows
                # out from behind the knuckle edge); it fades out before the finger folds over the palm
                rp = P[f'palm_{f}_root']
                patch = picture(groups[f], f'palm_{f}_root', wx - rp['offset'][0], wy - rp['offset'][1], 1, 1, f'{hs} {f} root patch')
                patch.set('opacity', str(round(min(1, max(0, (ROOT_FADE[1] - c0) / (ROOT_FADE[1] - ROOT_FADE[0]))), 4)))
                bind(patch, 18, f + 'Curl', C['hand root patch'])
                groups[f].remove(patch); groups[f].insert(0, patch)
            # base above tip on both sides: the base's end cap overlaps the tip's root cap and reads as the knuckle line

        # ---- thumb
        tb, tt = P[f'{hs}_thumb_base'], P[f'{hs}_thumb_tip']
        mx, my = pm['thumbMound']
        trx = mx + sg * THUMB_ROOT[0] - wx; tryy = my + THUMB_ROOT[1] - wy
        o0, tc0 = base['thumbOpp'], base['thumbCurl']
        troot = node(groups['thumb'], f'{hs} thumb root', x=round(trx, 2), y=round(tryy, 2), rotation=sg * _thumb_angle(o0))
        bind(troot, 15, 'thumbOpp', C[f'hand thumb opp {hs}'])
        tmcp = node(troot, f'{hs} thumb mcp', rotation=sg * T_MCP * tc0)
        bind(tmcp, 15, 'thumbCurl', C[f'hand thumb mcp {hs}'])
        picture(tmcp, f'{hs}_thumb_base', tb['baseEnd'][0], tb['baseEnd'][1], THUMB_S, THUMB_S, f'{hs} thumb base picture')
        ua = tb['axis']
        jx = (tb['tipEnd'][0] - tb['baseEnd'][0] - ua[0] * JOINT_OVERLAP * 1.6) * THUMB_S
        jy = (tb['tipEnd'][1] - tb['baseEnd'][1] - ua[1] * JOINT_OVERLAP * 1.6) * THUMB_S
        ax = _axis_angle(tt['axis'])
        tj = node(tmcp, f'{hs} thumb tip joint', x=round(jx, 3), y=round(jy, 3), rotation=round(ax, 5))
        if hs == 'back':
            ts = node(tj, f'{hs} thumb tip', y=round(_slide(tc0, T_TIP_MAX, _thumb_tip_len()), 3))
            bind(ts, 14, 'thumbCurl', C['hand thumb slide tip'])
        else:
            st = _s(tc0, T_TIP_MAX)
            ts = node(tj, f'{hs} thumb tip', scaleY=st, opacity=round(_endon(st, *TIP_ENDON), 4))
            bind(ts, 17, 'thumbCurl', C['hand thumb tip fold']); bind(ts, 18, 'thumbCurl', C['hand thumb tip end-on'])
        tr = node(ts, f'{hs} thumb tip unturn', rotation=round(-ax, 5))
        picture(tr, f'{hs}_thumb_tip', tt['baseEnd'][0], tt['baseEnd'][1], THUMB_S, THUMB_S, f'{hs} thumb tip picture')
        tmcp.remove(tj); tmcp.append(tj)                           # base above tip

    names = [vm[b] for b in NAMES]
    props['names'] = names
    props['defaults'] = {vm[b]: base[b] for b in NAMES}
    props['stats'] = dict(stats, converters=len(C))
    return hand, names
