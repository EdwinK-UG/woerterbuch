"""Liv's articulated vector hand for Rive (RML), shared by the character build and the hand test project.

    from hand_rig import emit_hand
    root_node, names = emit_hand(el, parent, 'R', 1.0, props)

* Drawn with Rive shapes only: palm, four fingers of three phalanges, thumb of three segments (the first one is the
  thenar mass), nails, palm creases. Flat skin #fdc28d, soft shade #f0a56e, outline #3a1c0c of even weight
  (3 view px at scale 1; 996 view px = 1 m). Middle fingertip about 114 px from the wrist at scale 1.
* Clean outlines: every finger is drawn twice by two identical joint chains, an INK chain (rounded rectangles with a
  6 px stroke, half of it outside the skin) under a FILL chain (the same rectangles in skin). Joints are therefore
  seamless, while a finger in front still has its outline over the finger behind it. A small skin "root" patch per
  finger, fixed to the palm, hides the base of the finger's own outline inside the palm.
* Motion is pure data binding, no script needed: each finger is a chain of Nodes (knuckle -> middle joint -> end
  joint). Its rotations and the segment lengths are DataConverterFormula functions of ONE number, the finger's curl
  (0 straight .. 1 fist). The fingers curl in a plane tilted against the screen (cos tilt = CPHI), so a curled finger
  shortens and folds back over the palm as in the painted fist instead of all fingers piling up on one spot:
      angle of segment k:  beta_k = curl * (80, 180, 247 degrees)[k]      (end joint follows the middle joint at 2/3)
      on screen:           theta_k = atan2(sin(beta_k) * CPHI, cos(beta_k)),  length_k = L_k * |(cos, CPHI sin)|
  Spread fans the fingers (a rotation per finger), thumbOpp swings the thumb from abducted (-1, thumbs-up) through its
  rest along the index (0) to across the palm (1); thumbCurl bends its two outer joints.
* Hand frame: origin at the wrist joint, +x along the hand toward the fingertips, +y the side the fingers curl to.
  Put the returned root under a Node that follows the wrist bone (TransformConstraint, world to world). `Flip` = -1
  mirrors the hand across its own axis (the other hand, or the hand turned over); `PalmSide` 1 shows the palm
  details (creases, no nails) for a hand seen from the palm.

props (a dict, read and written):
  in : 'prefix'  view-model name prefix, e.g. 'handR' -> 'handRIndexCurl'
       'root'    the <Rive> root element (converters are root elements; shared by every hand under this root)
       'bind'    callable(target, propertyKey, vmName, converterId_or_None): adds the DataBindContext
       'defaults' (optional) {base name: value} to start from, e.g. {'indexCurl': .3}
  out: 'names'   the full view-model names this hand needs (also returned)
       'defaults' {full name: start value}
       'stats'   counts of shapes, nodes, binds, converters
"""
import math

SKIN, SHADE, INK = 'FFFDC28D', 'FFF0A56E', 'FF3A1C0C'
NAIL, NAIL_LINE, CREASE, SOFT = 'FFFFD7AE', 'FFD9925F', 'FFCF8152', 'FFF6B27C'
OUT = 2.5                      # visible outline, view px (the body art's lines are 3-4 px, the painted hands' 2)
G = 1.1                        # geometry scale: matches the painted hands as the character rig shows them (x1.1)
CPHI = .70                     # cos of the tilt between the fingers' curl plane and the screen
BETA = (80.0, 180.0, 247.0)    # cumulative joint angles at curl 1 (MCP 80, PIP 100, DIP 67 = 2/3 of PIP)
TAPER = (1.0, .94, .88)        # finger half width per phalanx
T_CPHI = .82                   # the thumb curls nearly in the screen plane
T_BETA = (42.0, 112.0)         # thumb MCP and IP at thumbCurl 1

# knuckle (x, y), half width r, phalanx lengths (joint to joint; the tip adds r), fan per unit spread, rest angle
FINGERS = [
    ('index',  (49.6, -12.6), 4.30, (20.0, 13.0, 8.4), -.26, -.05),
    ('middle', (52.2, -4.1),  4.45, (21.8, 14.2, 9.0), -.08, .0),
    ('ring',   (49.8, 4.4),   4.20, (20.6, 13.4, 8.4), .10, .05),
    ('pinky',  (45.0, 12.5),  3.75, (15.8, 10.4, 7.0), .28, .11),
]
THUMB_CMC = (8.5, -9.0)
THUMB_R = (7.6, 5.5, 5.2)       # thenar base, proximal, distal half widths
THUMB_L = (23.5, 14.5, 10.0)
THUMB_OPP = (-1.55, .10, .95)  # CMC angle at thumbOpp -1 (thumbs-up), 0 (rest, along the index) and +1 (across the palm)

BASE_DEFAULTS = {'thumbCurl': .25, 'thumbOpp': 0.0, 'indexCurl': .22, 'middleCurl': .28, 'ringCurl': .33,
                 'pinkyCurl': .38, 'spread': .15, 'flip': 1.0, 'palmSide': 0.0}
NAMES = list(BASE_DEFAULTS)

_CONV = {}                     # id(root) -> {key: converter id}


def _vm(prefix, base): return prefix + base[0].upper() + base[1:]


def _theta(c, beta, cphi):
    b = math.radians(beta) * c
    return math.atan2(math.sin(b) * cphi, math.cos(b))


def _plen(c, beta, cphi, L):
    b = math.radians(beta) * c
    return L * math.sqrt(1 - (1 - cphi * cphi) * math.sin(b) ** 2)


# ------------------------------------------------------------------ formula converters
OPS = {'+': 0, '-': 1, '*': 2, '/': 3}
FUN = {'min': 0, 'max': 1, 'cos': 9, 'sin': 10, 'sqrt': 5, 'atan2': 15}


def _emit_tokens(el, conv, e, bind):
    if isinstance(e, (int, float)):
        el('FormulaTokenValue', conv, operationValue=round(float(e), 7)); return
    if e[0] == 'in':
        el('FormulaTokenInput', conv); return
    if e[0] == 'var':
        t = el('FormulaTokenValue', conv, operationValue=0); bind(t, 777, e[1], None); return
    if e[0] in OPS:
        el('FormulaTokenParenthesisOpen', conv)
        _emit_tokens(el, conv, e[1], bind)
        el('FormulaTokenOperation', conv, operationType=OPS[e[0]])
        _emit_tokens(el, conv, e[2], bind)
        el('FormulaTokenParenthesisClose', conv); return
    el('FormulaTokenFunction', conv, functionType=FUN[e[0]])
    for i, a in enumerate(e[1:]):
        if i: el('FormulaTokenArgumentSeparator', conv)
        _emit_tokens(el, conv, a, bind)
    el('FormulaTokenParenthesisClose', conv)


def _ex_theta(beta, cphi):
    b = ('*', ('in',), math.radians(beta))
    return ('atan2', ('*', ('sin', b), cphi), ('cos', b))


def _ex_plen(beta, cphi, L, add=0.0):
    b = ('*', ('in',), math.radians(beta))
    s = ('sin', b)
    e = ('*', L, ('sqrt', ('-', 1.0, ('*', 1 - cphi * cphi, ('*', s, s)))))
    return ('+', e, add) if add else e


def _converters(el, root, bind):
    """Converters shared by every hand under this root (inputs are curls, so they do not name a hand)."""
    key = id(root)
    if key in _CONV: return _CONV[key]
    C = {}

    def formula(name, ex):
        conv = el('DataConverterFormula', root, name=name)
        _emit_tokens(el, conv, ex, bind)
        C[name] = conv.get('id')

    def mapper(name, a, b, c, d, **flags):
        C[name] = el('DataConverterRangeMapper', root, name=name, minInput=a, maxInput=b, minOutput=c, maxOutput=d, **flags).get('id')

    th = [_ex_theta(b, CPHI) for b in BETA]
    formula('hand finger angle 1', th[0])
    formula('hand finger angle 2', ('-', th[1], th[0]))
    formula('hand finger angle 3', ('-', th[2], th[1]))
    for name, _k, r, L, fan, base in FINGERS:
        for i in range(3):
            formula(f'hand {name} len {i + 1}', _ex_plen(BETA[i], CPHI, L[i] * G))
            formula(f'hand {name} width {i + 1}', _ex_plen(BETA[i], CPHI, L[i] * G, 2 * r * TAPER[i] * G))
        mapper(f'hand {name} fan', 0, 1, base, base + fan)
    tth = [_ex_theta(b, T_CPHI) for b in T_BETA]
    formula('hand thumb angle 1', tth[0])
    formula('hand thumb angle 2', ('-', tth[1], tth[0]))
    for i in range(2):
        formula(f'hand thumb len {i + 1}', _ex_plen(T_BETA[i], T_CPHI, THUMB_L[i + 1] * G))
        formula(f'hand thumb width {i + 1}', _ex_plen(T_BETA[i], T_CPHI, THUMB_L[i + 1] * G, 2 * THUMB_R[i + 1] * G))
    mapper('hand back side', 0, 1, 1, 0)
    a0, a1, a2 = THUMB_OPP
    formula('hand thumb opp', ('+', a1, ('+', ('*', a2 - a1, ('max', ('in',), 0.0)), ('*', a1 - a0, ('min', ('in',), 0.0)))))
    _CONV[key] = C
    return C


# ------------------------------------------------------------------ shapes
def _paint(el, shape, kind, color, **kw):
    p = el(kind, shape, **kw); el('SolidColor', p, colorValue=color); return p


def _capsule(el, parent, name, r, width, ink):
    """A rounded rectangle from x = -r (back cap) to x = width - r, height 2r, in the parent's frame."""
    s = el('Shape', parent, name=name)
    el('Rectangle', s, x=-r, y=0, originX=0, originY=.5, width=round(width, 4), height=2 * r, cornerRadiusTL=r)
    if ink: _paint(el, s, 'Stroke', INK, thickness=2 * OUT, cap='round', join='round')
    else: _paint(el, s, 'Fill', SKIN)
    return s


def _smooth_path(el, shape, pts, closed=False, tension=1 / 3):
    """PointsPath through pts (Catmull-Rom tangents); ends are corners when open."""
    path = el('PointsPath', shape, isClosed=closed, isClockwise=True)
    n = len(pts)
    for i, (x, y) in enumerate(pts):
        if not closed and i in (0, n - 1):
            el('StraightVertex', path, x=round(x, 3), y=round(y, 3)); continue
        p0, p2 = pts[(i - 1) % n], pts[(i + 1) % n]
        ang = math.atan2(p2[1] - p0[1], p2[0] - p0[0])
        el('CubicAsymmetricVertex', path, x=round(x, 3), y=round(y, 3), rotation=round(ang, 5),
           inDistance=round(math.dist(p0, (x, y)) * tension, 3), outDistance=round(math.dist(p2, (x, y)) * tension, 3))
    return path


def _g(p): return (p[0] * G, p[1] * G)


def _taper_outline(r1, r2, length, n=7):
    """Outline (clockwise, y down) of the hull of a circle r1 at the origin and a circle r2 at (length, 0)."""
    phi = math.acos(max(-1.0, min(1.0, (r1 - r2) / length)))      # tangent angle, measured from +x
    pts = []
    for i in range(n):                                             # the small end: from -phi to +phi through 0
        a = -phi + 2 * phi * i / (n - 1)
        pts.append((length + r2 * math.cos(a), r2 * math.sin(a)))
    for i in range(n + 2):                                         # the big end: from phi to 2pi - phi through pi
        a = phi + (2 * math.pi - 2 * phi) * i / (n + 1)
        pts.append((r1 * math.cos(a), r1 * math.sin(a)))
    return pts


PALM = [(-6, -15.2), (14, -16.4), (34, -17.3), (49, -17.1), (54.3, -12.2), (56.4, -4.1), (54.2, 4.5), (49.6, 12.1),
        (46.0, 16.2), (30, 17.4), (10, 16.4), (-6, 15.2)]
COVER = [(-6, -15.2), (14, -16.4), (34, -17.3), (45.0, -16.9), (47.6, -12.6), (50.6, -6.5), (51.0, -4.1),
         (48.6, 4.4), (43.6, 12.5), (40.5, 16.2), (30, 17.4), (10, 16.4), (-6, 15.2), (-6.5, 0)]
CREASES = [[(18, 10), (30, 7), (42, 2), (49, -6)], [(16, -4), (27, -2.5), (38, 2.5), (45, 9)], [(22, -11), (25, -2), (24, 9)]]


def emit_hand(el, parent, side, scale, props):
    prefix = props.get('prefix', 'hand' + side)
    root = props['root']; bind_raw = props['bind']
    stats = {'shapes': 0, 'nodes': 0, 'binds': 0}

    def bind(target, key, name, conv=None):
        stats['binds'] += 1; bind_raw(target, key, name, conv)

    C = _converters(el, root, bind_raw)
    base = dict(BASE_DEFAULTS); base['flip'] = 1.0 if side == 'R' else -1.0
    base.update(props.get('defaults') or {})
    vm = {b: _vm(prefix, b) for b in NAMES}

    def node(par, name, **a):
        stats['nodes'] += 1; return el('Node', par, name=name, **a)

    def shape_count(s): stats['shapes'] += 1; return s

    hand = node(parent, f'{prefix} hand', scaleX=scale, scaleY=scale)
    flip = node(hand, f'{prefix} flip', scaleY=base['flip'])
    bind(flip, 17, vm['flip'])

    groups = {}
    # draw order: first child on top -> thumb, index, middle, ring, pinky, palm details, palm
    for name in ['thumb', 'index', 'middle', 'ring', 'pinky']:
        groups[name] = node(flip, f'{prefix} {name}')
    # back of the hand: the back of the palm is in front of the curled fingers, whose middle and end phalanges go
    # behind it; its front edge runs along the knuckles and has no ink, so the fingers grow out of it
    cover = shape_count(el('Shape', flip, name=f'{prefix} back of hand', opacity=1 - base['palmSide']))
    _smooth_path(el, cover, [_g(p) for p in COVER], closed=True)
    _paint(el, cover, 'Fill', SKIN)
    bind(cover, 18, vm['palmSide'], C['hand back side'])
    flip.remove(cover); flip.insert(1, cover)
    creases = shape_count(el('Shape', flip, name=f'{prefix} palm creases', opacity=base['palmSide']))
    for c in CREASES:
        _smooth_path(el, creases, [_g(p) for p in c])
    _paint(el, creases, 'Stroke', CREASE, thickness=1.5, cap='round')
    bind(creases, 18, vm['palmSide'])
    palm_fill = shape_count(el('Shape', flip, name=f'{prefix} palm fill'))
    _smooth_path(el, palm_fill, [_g(p) for p in PALM])
    _paint(el, palm_fill, 'Fill', SKIN)
    palm_ink = shape_count(el('Shape', flip, name=f'{prefix} palm ink'))
    _smooth_path(el, palm_ink, [_g(p) for p in PALM])
    _paint(el, palm_ink, 'Stroke', INK, thickness=2 * OUT, cap='round', join='round')

    # ---- fingers
    for fi, (name, k, r, L, fan, rest) in enumerate(FINGERS):
        g = groups[name]; c0 = base[name + 'Curl']; curl = vm[name + 'Curl']
        rG = r * G
        spread_node = node(g, f'{prefix} {name} knuckle', x=k[0] * G, y=k[1] * G, rotation=rest + fan * base['spread'])
        bind(spread_node, 15, vm['spread'], C[f'hand {name} fan'])
        th = [_theta(c0, b, CPHI) for b in BETA]
        pl = [_plen(c0, BETA[i], CPHI, L[i] * G) for i in range(3)]
        # knuckle frame children, first on top: fill chain, root patch, ink chain
        layers = {'fill': node(spread_node, f'{prefix} {name} fill layer')}
        top = -(rG + OUT + .3) if name != 'index' else -(rG - 1.0)
        bot = (rG + OUT + .3) if name != 'pinky' else (rG - 1.0)
        # the root patch: palm skin over the base of this finger's own outline (inside the palm only); it turns with
        # the spread but not with the curl
        root_s = shape_count(el('Shape', spread_node, name=f'{prefix} {name} root'))
        el('Rectangle', root_s, x=-(rG + 6), y=top, originX=0, originY=0, width=rG + 7.5, height=bot - top, cornerRadiusTL=2.5)
        _paint(el, root_s, 'Fill', SKIN)
        layers['ink'] = node(spread_node, f'{prefix} {name} ink layer')
        chains = {}
        for layer in ('fill', 'ink'):
            j1 = node(layers[layer], f'{prefix} {name} {layer} 1', rotation=th[0])
            bind(j1, 15, curl, C['hand finger angle 1'])
            j2 = node(j1, f'{prefix} {name} {layer} 2', x=pl[0], rotation=th[1] - th[0])
            bind(j2, 13, curl, C[f'hand {name} len 1']); bind(j2, 15, curl, C['hand finger angle 2'])
            j3 = node(j2, f'{prefix} {name} {layer} 3', x=pl[1], rotation=th[2] - th[1])
            bind(j3, 13, curl, C[f'hand {name} len 2']); bind(j3, 15, curl, C['hand finger angle 3'])
            chains[layer] = (j1, j2, j3)
        for i in range(3):
            ri = rG * TAPER[i]
            w = pl[i] + 2 * ri
            for layer in ('ink', 'fill'):
                s = shape_count(_capsule(el, chains[layer][i], f'{prefix} {name} {layer} seg {i + 1}', ri, w, layer == 'ink'))
                bind(s.find('Rectangle'), 20, curl, C[f'hand {name} width {i + 1}'])
        # nail on the end segment (back of the hand only, fades as the tip turns away)
        j3 = chains['fill'][2]
        nail = shape_count(el('Shape', j3, name=f'{prefix} {name} nail', x=pl[2], opacity=1))
        rn = rG * TAPER[2]
        el('Rectangle', nail, x=rn - .9 - rn * 1.55, y=-rn * .12, originX=0, originY=.5, width=rn * 1.55, height=rn * 1.12,
           cornerRadiusTL=rn * .56)
        _paint(el, nail, 'Fill', NAIL)
        _paint(el, nail, 'Stroke', NAIL_LINE, thickness=.9)
        j3.remove(nail); j3.insert(0, nail)
        bind(nail, 13, curl, C[f'hand {name} len 3'])
        nconv = _nail_converter(el, root, prefix, name, vm['palmSide'], bind)
        bind(nail, 18, curl, nconv)

    # ---- thumb: CMC (opposition) -> metacarpal (thenar) -> proximal -> distal
    g = groups['thumb']; tc0 = base['thumbCurl']
    cmc = node(g, f'{prefix} thumb cmc', x=THUMB_CMC[0] * G, y=THUMB_CMC[1] * G,
               rotation=_thumb_angle(base['thumbOpp']))
    bind(cmc, 15, vm['thumbOpp'], C['hand thumb opp'])
    tth = [_theta(tc0, b, T_CPHI) for b in T_BETA]
    tpl = [_plen(tc0, T_BETA[i], T_CPHI, THUMB_L[i + 1] * G) for i in range(2)]
    lay = {}
    for layer in ('fill', 'ink'):
        lay[layer] = node(cmc, f'{prefix} thumb {layer} layer')
    tchain = {}
    for layer in ('fill', 'ink'):
        t0 = lay[layer]
        t1 = node(t0, f'{prefix} thumb {layer} 1', x=THUMB_L[0] * G, rotation=tth[0])
        bind(t1, 15, vm['thumbCurl'], C['hand thumb angle 1'])
        t2 = node(t1, f'{prefix} thumb {layer} 2', x=tpl[0], rotation=tth[1] - tth[0])
        bind(t2, 13, vm['thumbCurl'], C['hand thumb len 1']); bind(t2, 15, vm['thumbCurl'], C['hand thumb angle 2'])
        tchain[layer] = (t0, t1, t2)
        rs = (THUMB_R[0] * G, THUMB_R[1] * G, THUMB_R[2] * G)
        widths = (THUMB_L[0] * G + 2 * rs[0] * .55, tpl[0] + 2 * rs[1], tpl[1] + 2 * rs[2])
        for i, par in enumerate((t0, t1, t2)):
            if i == 0:
                # the thenar mass: tapered from the base (wide) to the thumb's first joint (as wide as the thumb)
                # (its outline runs only along the outer side and the thumb's first joint, and fades into the back
                # of the hand on the inner side: the thumb grows out of the hand)
                s = el('Shape', par, name=f'{prefix} thumb {layer} seg 0')
                if layer == 'ink':
                    _smooth_path(el, s, _taper_ink(rs[0], rs[1] * 1.04, THUMB_L[0] * G))
                    _paint(el, s, 'Stroke', INK, thickness=2 * OUT, cap='round', join='round')
                else:
                    _smooth_path(el, s, _taper_outline(rs[0], rs[1] * 1.04, THUMB_L[0] * G), closed=True)
                    _paint(el, s, 'Fill', SKIN)
            else:
                s = _capsule(el, par, f'{prefix} thumb {layer} seg {i}', rs[i], widths[i], layer == 'ink')
                bind(s.find('Rectangle'), 20, vm['thumbCurl'], C[f'hand thumb width {i}'])
            shape_count(s)
            par.remove(s); par.append(s)
    tnail = shape_count(el('Shape', tchain['fill'][2], name=f'{prefix} thumb nail', x=tpl[1]))
    rT = THUMB_R[2] * G
    el('Rectangle', tnail, x=rT - .9 - rT * 1.5, y=-rT * .14, originX=0, originY=.5, width=rT * 1.5, height=rT * 1.1, cornerRadiusTL=rT * .55)
    _paint(el, tnail, 'Fill', NAIL); _paint(el, tnail, 'Stroke', NAIL_LINE, thickness=.9)
    tchain['fill'][2].remove(tnail); tchain['fill'][2].insert(0, tnail)
    bind(tnail, 13, vm['thumbCurl'], C['hand thumb len 2'])
    bind(tnail, 18, vm['thumbCurl'], _nail_converter(el, root, prefix, 'thumb', vm['palmSide'], bind, fade=(.7, 1.2)))

    names = [vm[b] for b in NAMES]
    props['names'] = names
    props['defaults'] = {vm[b]: base[b] for b in NAMES}
    props['stats'] = dict(stats, converters=len(C))
    return hand, names


def _thumb_angle(o):
    a0, a1, a2 = THUMB_OPP
    return a1 + (a2 - a1) * max(o, 0) + (a1 - a0) * min(o, 0)


def _taper_ink(r1, r2, length, n=7):
    """The outer part of _taper_outline: from the middle of the inner (+y) side, round the small end, along the outer
    (-y) side and a little way round the big end."""
    phi = math.acos(max(-1.0, min(1.0, (r1 - r2) / length)))
    sb = (length + r2 * math.cos(phi), r2 * math.sin(phi)); bb = (r1 * math.cos(phi), r1 * math.sin(phi))
    pts = [(sb[0] + (bb[0] - sb[0]) * .45, sb[1] + (bb[1] - sb[1]) * .45)]
    for i in range(n):
        a = phi - 2 * phi * i / (n - 1)
        pts.append((length + r2 * math.cos(a), r2 * math.sin(a)))
    for i in range(4):
        a = -phi - (math.pi * .72 - phi) * i / 3
        pts.append((r1 * math.cos(a), r1 * math.sin(a)))
    return pts


def _nail_converter(el, root, prefix, finger, palm_name, bind, fade=(.42, .8)):
    """Nail opacity: (1 - palmSide) * (1 - smooth fade with the curl). Per hand (it reads that hand's palmSide)."""
    a, b = fade
    conv = el('DataConverterFormula', root, name=f'{prefix} {finger} nail opacity')
    ex = ('*', ('-', 1.0, ('var', palm_name)), ('min', 1.0, ('max', 0.0, ('/', ('-', b, ('in',)), b - a))))
    _emit_tokens(el, conv, ex, lambda t, k, n, c: bind(t, k, n, c))
    return conv.get('id')
