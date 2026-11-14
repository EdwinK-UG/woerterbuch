"""The PARK scene's scenery for Rive: a vector port of background() / foreground() / the tag pill of grammatik/liv/film-park.js.

    python3 tools/liv/rive/park/scenery.py          # -> park/park-scenery-test/ (scene.rml, park_test.luau, rive.yaml) and park/layers.json
    cd tools/liv/rive/park/park-scenery-test && rive . --verify

Artboard 1760 x 864, the canvas camera with W = 1760, H = 864: pitch 7 deg, dist 60, zoom 400 px/m, cx 880, cy 432,
target (camX, 0.93, 0). Every shape is the canvas drawing projected at camX = 0 (screen pixels); the camera follows Liv by
moving the world: a point at depth (y, z) moves by  -camX * 400 * m  with  m = s(y, z) / zoom  (s = pixels per metre there).
The scene is split into LAYERS (one view-model number parX<i> each, bound to the x of the layer's Node(s)); a shape or vertex
that is not at its layer's depth gets a range-mapper converter on that same number (x = base + parX * (m_v / m_L - 1)), so the
perspective is exact for every vertex (ground planes, box tops and sides, the pond, the area outline) at every camX.

Nothing advances by itself: the picture is a pure function of the view-model values (parX0..n, t, route, goal, goalVis, tag).

Integration (the lead's build): see emit_scenery() and docs/liv-park-scenery.md.
"""
from pathlib import Path
import json, math

HERE = Path(__file__).resolve().parent

# ---------------------------------------------------------------- camera (film-park.js draw() with W = 1760, H = 864)
W, H = 1760, 864
U = W / 880.0                                    # the canvas line-width unit u
ZOOM, DIST, PITCH, TY = min(W / 4.4, H / 2.16), 60.0, math.radians(7), 0.93
CX, CY = W / 2, H * 0.5
SP, CP = math.sin(PITCH), math.cos(PITCH)
INK = '3a1c0c'
GATE = 0.0
CAM_RANGE = 8.0       # |camX| the perspective check is made for (park: -2.5 .. 6.2)
TOL = 1.0             # px: a shape / vertex off its layer's depth by more than this at CAM_RANGE gets its own converter


def proj(x, y, z, camX=0.0):
    """Camera.project: -> (screen x, screen y, pixels per metre)."""
    rx, ry, rz = x - camX, y - TY, z
    sy_ = ry * CP - rz * SP
    d = ry * SP + rz * CP
    s = ZOOM * DIST / max(0.5, DIST - d)
    return CX + rx * s, CY - sy_ * s, s


def mult(y, z):
    """Scroll multiplier at depth (y, z): screen x moves by -camX * ZOOM * mult."""
    return proj(0, y, z)[2] / ZOOM


def jshash(i):
    x = math.sin(i * 127.1 + 311.7) * 43758.5453
    return x - math.floor(x)


def rnd(i): return jshash(i * 7.31 + 1.7)


HZ = proj(0, 0, -7)[1]                           # horizon line (the far edge of the ground planes)

# ---------------------------------------------------------------- layers: (prop, name, y, z or None, m)
LAYER_DEF = [
    ('parX0', 'hills', None, None, 0.12),        # canvas parallax factor of the far hills
    ('parX1', 'far', 0.0, -3.6),                 # hedge, far trees, back of the houses
    ('parX2', 'houses', 0.0, -2.6),              # house fronts, pond, near tree
    ('parX3', 'park', 0.0, -1.4),                # bench, flowers
    ('parX4', 'gate', 0.0, -0.72),               # far gate post
    ('parX5', 'ground', 0.0, 0.0),               # ground planes, pavement lines, arrow, area
    ('parX6', 'near', 0.0, 0.72),                # near gate post + STADTPARK sign (in front of Liv)
    ('parX7', 'front', 0.0, 1.1),                # grass tufts (in front of Liv)
]
LAYERS = []
for d in LAYER_DEF:
    m = d[4] if len(d) > 4 else mult(d[2], d[3])
    LAYERS.append({'prop': d[0], 'name': d[1], 'y': d[2], 'z': d[3], 'm': round(m, 7)})
LI = {l['name']: i for i, l in enumerate(LAYERS)}


def col(h, a=1.0): return '%02X%s' % (round(a * 255), h.lstrip('#').upper())


class Scene:
    """Collects the scenery under a parent; children are created in PAINT order (back first) and reversed at the end,
    because in Rive the first sibling is drawn on top."""

    def __init__(self, el, ctx):
        self.el, self.ctx = el, ctx
        self.root = ctx['root']
        self.conv = {}
        self.stats = {'shapes': 0, 'converters': 0, 'bound_vertices': 0, 'bound_nodes': 0}
        self.kids = {}                            # node element -> [children in paint order]

    # -- tree building in paint order
    def node(self, parent, name, **a):
        n = self.el('Node', None, name=name, **a); self.kids.setdefault(id(parent), (parent, []))[1].append(n)
        self.kids.setdefault(id(n), (n, [])); return n

    def add(self, parent, e):
        self.kids.setdefault(id(parent), (parent, []))[1].append(e); self.kids.setdefault(id(e), (e, [])); return e

    def finish(self):
        for _, (p, ch) in list(self.kids.items()):
            for c in reversed(ch): p.append(c)

    # -- converters and bindings
    def mapper(self, a, b):
        """x = a + b * input  (a range mapper from [0, 1] to [a, a + b], unclamped)."""
        key = (round(a, 3), round(b, 7))
        if key not in self.conv:
            self.conv[key] = self.el('DataConverterRangeMapper', self.root, name=f'scroll {key[0]} {key[1]}', minInput=0, maxInput=1,
                                     minOutput=key[0], maxOutput=round(key[0] + key[1], 7)).get('id')
            self.stats['converters'] += 1
        return self.conv[key]

    def bindc(self, target, key, name, conv=None):
        self.ctx['bindp'](target, key, name)
        if conv is not None: target[-1].set('converterId', conv)   # bindp appends the DataBindContext as the last child

    def layer(self, parent, li, name):
        """A Node that scrolls with layer li (x bound to its parX)."""
        n = self.node(parent, f'{name} [{LAYERS[li]["prop"]}]')
        self.bindc(n, 13, LAYERS[li]['prop']); return n

    def anchor(self, parent, li, m_a, name):
        """A Node for one object at multiplier m_a inside layer li: its own correction if m_a is off the layer's depth."""
        mL = LAYERS[li]['m']; d = m_a / mL - 1
        if abs(m_a - mL) * ZOOM * CAM_RANGE <= TOL: return parent, mL
        n = self.node(parent, name); self.bindc(n, 13, LAYERS[li]['prop'], self.mapper(0, d)); self.stats['bound_nodes'] += 1
        return n, m_a

    # -- shapes
    def shape(self, parent, name):
        s = self.el('Shape', None, name=name); self.add(parent, s); self.stats['shapes'] += 1; return s

    def paint(self, s, fill=None, stroke=None, lw=0, cap=None, join='round', ink_under=False, fill_rule=None):
        def mk_stroke():
            k = {'thickness': round(lw, 3), 'join': join}
            if cap: k['cap'] = cap
            st = self.el('Stroke', s, **k); self.el('SolidColor', st, colorValue=stroke); return st
        st = None
        if stroke and ink_under: st = mk_stroke()
        if fill:
            f = self.el('Fill', s, **({'fillRule': fill_rule} if fill_rule else {})); self.el('SolidColor', f, colorValue=fill)
        if stroke and not ink_under: st = mk_stroke()
        return st

    def poly(self, parent, li, m_a, pts3, name, fill=None, stroke=None, lw=0, closed=True, bind=True, cap=None):
        """scn.poly: a closed polygon of world points; each vertex is exact (own converter when off the anchor depth)."""
        s = self.shape(parent, name)
        p = self.el('PointsPath', s, isClosed=closed, name='path')
        mL = LAYERS[li]['m']
        for (x, y, z) in pts3:
            sx, sy, _ = proj(x, y, z); m_v = mult(y, z)
            v = self.el('StraightVertex', p, x=round(sx, 3), y=round(sy, 3))
            if bind and abs(m_v - m_a) * ZOOM * CAM_RANGE > TOL and abs(sx - CX) < 6000:
                self.bindc(v, 24, LAYERS[li]['prop'], self.mapper(sx, (m_v - m_a) / mL)); self.stats['bound_vertices'] += 1
        self.paint(s, fill, stroke, lw, cap=cap)
        return s

    def box(self, parent, li, m_a, x0, y0, z0, x1, y1, z1, c, lw, name):
        """scn.box. Both side faces are drawn (under the top and the front): the one the camera does not see lies inside the
        top + front silhouette, so whichever side camX shows comes out right without a switch."""
        P = lambda x, y, z: (x, y, z)
        ink = col(INK)
        self.poly(parent, li, m_a, [P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)], name + ' side R', col(c.get('side', c['front'])), ink, lw)
        self.poly(parent, li, m_a, [P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0)], name + ' side L', col(c.get('side', c['front'])), ink, lw)
        self.poly(parent, li, m_a, [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], name + ' top', col(c.get('top', c['front'])), ink, lw)
        self.poly(parent, li, m_a, [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], name + ' front', col(c['front']), ink, lw)

    def circle(self, s, x, y, r):
        self.el('Ellipse', s, x=round(x, 3), y=round(y, 3), width=round(2 * r, 3), height=round(2 * r, 3), originX=0.5, originY=0.5)

    def text(self, parent, name, content, size, weight, color, x, y, align='center', run_bind=None):
        t = self.el('Text', None, name=name, x=round(x, 3), y=round(y, 3), alignValue=align, sizingValue='autoWidth',
                    originX={'center': 0.5, 'right': 1.0, 'left': 0.0}[align], originY=0.5, wrapValue='noWrap')
        self.add(parent, t)
        st = self.el('TextStylePaint', t, fontSize=round(size, 3), fontAssetId=self.ctx['font_id'], name=name + ' style')
        self.el('TextStyleAxis', st, tag=0x77676874, axisValue=weight)             # 'wght' of the variable Inter
        f = self.el('Fill', st); sc = self.el('SolidColor', f, colorValue=color)
        return t, st, sc


# ---------------------------------------------------------------- the scenery
TREES = [(1.5, -3.4, 2.1, '#7fb069'), (3.6, -3.9, 2.5, '#6aa65c'), (8.6, -3.3, 2.3, '#7fb069'), (10.4, -3.8, 2.6, '#6aa65c'),
         (12.6, -3.1, 2.2, '#86b46b'), (-1.3, -2.3, 1.9, '#8fba74')]
PAVE_LINES_FROM = -10.4   # pavement cross lines are drawn for x >= this (enough for camX >= -8)
HILL_X = (-480, W + 960)  # hill silhouette sampled over this screen range (parallax 0.12: camX -10 .. 20)


def emit_scenery(el, parent, ctx):
    """Emit the park scenery under `parent` (the artboard or a Node of it).

    el(type, parent=None, **attrs) -> Element   the RML element factory (build_liv.py's el: makes ids)
    ctx = {
      'root':     the <Rive> root (converters are root elements),
      'prop':     prop(name, default)      declares a view-model NUMBER,
      'prop_str': prop_str(name, default)  declares a view-model STRING (used for `tag`),
      'bindp':    bindp(target, key, name) appends a DataBindContext for view-model property `name` to target
                  (it must append it as target's LAST child: a converterId is set on it afterwards when needed),
      'font_id':  id of a FontAsset with the variable Inter (wght axis),
    }
    Appends four Nodes to parent, drawn top to bottom: 'tag pill', 'scenery front', 'Liv slot', 'scenery back'.
    Returns the empty 'Liv slot' Node (at the ground under camX = 0: screen = proj(0, 0, 0)); put Liv's group in it.
    """
    S = Scene(el, ctx); prop = ctx['prop']
    for l in LAYERS: prop(l['prop'], 0.0)
    for k, v in (('t', 0.0), ('route', 0.0), ('goal', 0.0), ('goalVis', 1.0)): prop(k, v)
    ctx['prop_str']('tag', 'in den Park · Wohin?')
    ink, u = col(INK), U
    top = el('Node', None, name='park scenery'); S.kids[id(top)] = (top, [])
    back = S.node(top, 'scenery back')
    slot_x, slot_y, _ = proj(0, 0, 0)
    slot = S.node(top, 'Liv slot', x=round(slot_x, 3), y=round(slot_y, 3))
    front = S.node(top, 'scenery front')
    pill = S.node(top, 'tag pill')

    # sky (static) and far hills (parallax 0.12)
    s = S.shape(back, 'sky'); el('Rectangle', s, width=W, height=round(HZ + 1, 3), originX=0, originY=0)
    f = el('Fill', s); g = el('LinearGradient', f, startX=0, startY=0, endX=0, endY=round(HZ, 3))
    el('GradientStop', g, colorValue=col('cfe6ee'), position=0); el('GradientStop', g, colorValue=col('f6efe0'), position=1)
    hills = S.layer(back, LI['hills'], 'hills')
    s = S.shape(hills, 'hill silhouette'); p = el('PointsPath', s, isClosed=True, name='path')
    el('StraightVertex', p, x=HILL_X[0], y=round(HZ, 3))
    x = HILL_X[0]
    while x <= HILL_X[1]:
        y = HZ - (46 + 26 * math.sin(x / u * 0.006) + 14 * math.sin(x / u * 0.017 + 1)) * u * 0.6
        el('StraightVertex', p, x=x, y=round(y, 3)); x += 40 * u
    el('StraightVertex', p, x=x - 40 * u, y=round(HZ, 3))
    S.paint(s, fill=col('c9dcc2'))

    # ground planes, strips and pavement lines (one layer, every vertex exact)
    gl = LI['ground']; mG = LAYERS[gl]['m']; ground = S.layer(back, gl, 'ground')
    Gq = lambda x0, x1, z0, z1, c, name: S.poly(ground, gl, mG, [(x0, 0, z0), (x1, 0, z0), (x1, 0, z1), (x0, 0, z1)], name, col(c))
    Gq(-30, GATE, -7, 9, 'e3dccd', 'pavement'); Gq(GATE, 40, -7, 9, 'b9d49a', 'lawn')
    Gq(-30, GATE, -0.5, 0.55, 'd6cebd', 'pavement strip'); Gq(GATE, 40, -0.42, 0.42, 'ead9b0', 'sand path')
    s = S.shape(ground, 'pavement lines')
    x = -30.0; xs = []
    while x < GATE - 1e-9: xs.append(x); x += 0.8
    for x in xs:
        if x < PAVE_LINES_FROM: continue
        p = el('PointsPath', s, isClosed=False, name=f'line {x:.1f}')
        for z in (-0.5, 0.55):
            sx, sy, _ = proj(x, 0, z); m_v = mult(0, z)
            v = el('StraightVertex', p, x=round(sx, 3), y=round(sy, 3))
            S.bindc(v, 24, LAYERS[gl]['prop'], S.mapper(sx, (m_v - mG) / mG)); S.stats['bound_vertices'] += 1
    S.paint(s, stroke=col(INK, .22), lw=u, join='miter')

    # houses
    hl = LI['houses']; houses = S.layer(back, hl, 'houses'); mH = LAYERS[hl]['m']
    for i in range(6):
        x = -2.2 - i * 2.3; h = 1.9 + rnd(i) * 0.7; c = ['f1d9b5', 'e9c3a6', 'dfd3bd', 'f0cfa0'][i % 4]
        hn, ma = S.anchor(houses, hl, mult(0, -2.6), f'house {i}')
        S.box(hn, hl, ma, x - 1.05, 0, -3.4, x + 1.05, h, -2.6, {'front': c, 'top': 'c8a98a', 'side': 'cdb695'}, 1.3 * u, f'house {i}')
        S.poly(hn, hl, ma, [(x - 1.15, h, -2.6), (x, h + 0.75, -2.6), (x + 1.15, h, -2.6)], f'house {i} roof', col('b8553f'), ink, 1.3 * u)
        for wx in (-0.5, 0.5):
            for wy in (0.9, 1.7):
                S.poly(hn, hl, ma, [(x + wx - 0.2, wy, -2.59), (x + wx + 0.2, wy, -2.59), (x + wx + 0.2, wy + 0.45, -2.59), (x + wx - 0.2, wy + 0.45, -2.59)],
                       f'house {i} window', col('cfe3ea'), ink, u)
    # pond
    pn, ma = S.anchor(houses, hl, mult(0, -2.3), 'pond')
    S.poly(pn, hl, ma, [(6.3 + math.cos(i / 28 * 2 * math.pi) * 1.7, 0, -2.3 + math.sin(i / 28 * 2 * math.pi) * 0.7) for i in range(28)], 'pond', col('9fd0df'), ink, 1.3 * u)

    # hedge (one shape, all at z = -4.4, y = 0.5)
    fl = LI['far']; far = S.layer(back, fl, 'hedge'); hn, _ = S.anchor(far, fl, mult(0.5, -4.4), 'hedge row')
    s = S.shape(hn, 'hedge'); x = GATE + 0.4
    while x < 40:
        qx, qy, qs = proj(x, 0.5, -4.4); S.circle(s, qx, qy, 0.62 * qs); x += 0.95
    S.paint(s, fill=col('86b46b'))

    # trees (each rigid at its base point, as the canvas draws it)
    for k, (tx, tz, th, hue) in enumerate(TREES):
        li = LI['far'] if tz < -3.0 else LI['houses']
        ln = S.layer(back, li, f'tree {k}'); tn, _ = S.anchor(ln, li, mult(0, tz), f'tree {k} at z {tz}')
        bx, by, bs = proj(tx, 0, tz); _, ty_, _ = proj(tx, th * 0.55, tz)
        s = S.shape(tn, f'tree {k} trunk'); p = el('PointsPath', s, isClosed=True, name='path')
        for vx, vy in ((bx - 0.07 * bs, by), (bx - 0.045 * bs, ty_), (bx + 0.045 * bs, ty_), (bx + 0.07 * bs, by)):
            el('StraightVertex', p, x=round(vx, 3), y=round(vy, 3))
        S.paint(s, col('8a5a35'), ink, max(u, bs * 0.006))
        s = S.shape(tn, f'tree {k} crown')
        for dx, dy, r in ((0, 0.78, 0.44), (-0.34, 0.62, 0.34), (0.34, 0.62, 0.34), (-0.16, 0.95, 0.3), (0.2, 0.93, 0.3)):
            S.circle(s, bx + dx * th * bs * 0.6, by - dy * th * bs, r * th * bs * 0.6)
        S.paint(s, col(hue), ink, max(2 * u, bs * 0.012), ink_under=True)   # ink stroked first, fill over it: one outlined silhouette

    # bench
    pl = LI['park']; park = S.layer(back, pl, 'bench and flowers'); bn, ma = S.anchor(park, pl, mult(0.3, -1.45), 'bench')
    for x in (2.72, 3.5): S.box(bn, pl, ma, x, 0, -1.55, x + 0.05, 0.3, -1.3, {'front': '6b4a2c', 'side': '553a22'}, u, 'bench leg')
    S.box(bn, pl, ma, 2.6, 0.3, -1.6, 3.65, 0.35, -1.25, {'front': 'b98450', 'top': 'd9a868'}, 1.2 * u, 'bench seat')
    for y in (0.44, 0.56): S.box(bn, pl, ma, 2.6, y, -1.62, 3.65, y + 0.08, -1.6, {'front': 'c79258', 'top': 'd9a868'}, 1.2 * u, 'bench slat')
    # flowers: one dot shape each, at its own depth (own converter when needed)
    cols = ['ffffff', 'f6d255', 'f29b9b']
    for i in range(26):                                       # index order: overlapping dots stack as in the canvas
        if True:
            ci = i % 3
            fx, fy, fz = 0.6 + rnd(i) * 13, 0.07, -0.75 - rnd(i + 50) * 1.6
            fn, _ = S.anchor(park, pl, mult(fy, fz), f'flower {i}')
            qx, qy, qs = proj(fx, fy, fz)
            s = S.shape(fn, f'flower {i}'); S.circle(s, qx, qy, 0.03 * qs); S.paint(s, fill=col(cols[ci]))

    # far gate post
    gtl = LI['gate']; gate = S.layer(back, gtl, 'far gate post')
    post(S, gate, gtl, GATE, -0.72, u)

    # the grammar on the ground (shown only while she moves: goalVis); arrow for route 0, area for route 1
    ov = S.layer(back, gl, 'grammar overlay')
    arrow = S.node(ov, 'arrow (into)'); area = S.node(ov, 'area (within)')
    vis_formula(S, arrow, invert=True); vis_formula(S, area, invert=False)
    an, _ = S.anchor(arrow, gl, mult(0.01, 0.48), 'arrow at z 0.48')
    ax, ay, _ = proj(-1.7, 0.01, 0.48); bx, by, _ = proj(1.25, 0.01, 0.48)
    s = S.shape(an, 'arrow dashes'); p = el('PointsPath', s, isClosed=False, name='path')
    el('StraightVertex', p, x=round(ax, 3), y=round(ay, 3)); el('StraightVertex', p, x=round(bx, 3), y=round(by, 3))
    st = S.paint(s, stroke=col('d9622b'), lw=4 * u, cap='round')
    dp = el('DashPath', st, name='dashes', offset=0)
    el('Dash', dp, length=round(11 * u, 3), name='on'); el('Dash', dp, length=round(9 * u, 3), name='off')
    S.bindc(dp, 690, 't', dash_formula(S, 36 * u, 20 * u))      # canvas: lineDashOffset = -t * 36 u, wrapped into one period
    s = S.shape(an, 'arrow head'); p = el('PointsPath', s, isClosed=True, name='path')
    for vx, vy in ((bx + 16 * u, by), (bx - 4 * u, by - 10 * u), (bx - 4 * u, by + 10 * u)): el('StraightVertex', p, x=round(vx, 3), y=round(vy, 3))
    S.paint(s, fill=col('d9622b'))
    quad = [(GATE + 0.1, 0, -4), (10.5, 0, -4), (10.5, 0, 1.4), (GATE + 0.1, 0, 1.4)]
    S.poly(area, gl, mG, quad, 'area fill', col('2f5d50', 0.2))
    s = S.poly(area, gl, mG, quad, 'area outline', None, col('2f5d50'), 2.4 * u)
    st = s.find('Stroke'); dp = el('DashPath', st, name='dashes', offset=0)
    el('Dash', dp, length=round(8 * u, 3), name='on'); el('Dash', dp, length=round(7 * u, 3), name='off')

    # ---- in front of Liv: near gate post, the STADTPARK sign, grass tufts
    nl = LI['near']; near = S.layer(front, nl, 'near gate post')
    post(S, near, nl, GATE, 0.72, u)
    a = proj(GATE - 0.06, 1.65, 0.72); b = proj(GATE - 0.06, 1.65, -0.72); sa = a[2]
    # the board's left edge is min(near end, far end) - 0.5 s: it follows the near end while camX > -0.06, else the far end
    ma, mb, mL = mult(1.65, 0.72), mult(1.65, -0.72), LAYERS[nl]['m']
    sn = S.node(near, 'sign (left edge = min of the two ends)')
    conv = el('DataConverterFormula', S.root, name='sign left edge'); S.stats['converters'] += 1
    el('FormulaTokenFunction', conv, functionType=0)
    el('FormulaTokenInput', conv); el('FormulaTokenOperation', conv, operationType=2); el('FormulaTokenValue', conv, operationValue=round(ma / mL - 1, 7))
    el('FormulaTokenArgumentSeparator', conv)
    el('FormulaTokenValue', conv, operationValue=round(b[0] - a[0], 4)); el('FormulaTokenOperation', conv, operationType=0)
    el('FormulaTokenInput', conv); el('FormulaTokenOperation', conv, operationType=2); el('FormulaTokenValue', conv, operationValue=round(mb / mL - 1, 7))
    el('FormulaTokenParenthesisClose', conv)
    S.bindc(sn, 13, LAYERS[nl]['prop'], conv.get('id')); S.stats['bound_nodes'] += 1
    x0, y0, w_, h_ = min(a[0], b[0]) - 0.5 * sa, b[1] - 0.3 * sa, 1.0 * sa, 0.26 * sa + (a[1] - b[1])
    s = S.shape(sn, 'sign board'); el('Rectangle', s, x=round(x0, 3), y=round(y0, 3), width=round(w_, 3), height=round(h_, 3), originX=0, originY=0,
                                      cornerRadiusTL=round(0.05 * sa, 3), cornerRadiusTR=round(0.05 * sa, 3), cornerRadiusBL=round(0.05 * sa, 3), cornerRadiusBR=round(0.05 * sa, 3))
    S.paint(s, col('5d7a52'), ink, 1.4 * u)
    # the text sits halfway between the post's near and far ends: its own (small) correction relative to the board
    m_txt = (mult(1.65, 0.72) + mult(1.65, -0.72)) / 2
    tn = S.node(near, 'sign text anchor'); S.bindc(tn, 13, LAYERS[nl]['prop'], S.mapper(0, m_txt / mL - 1)); S.stats['bound_nodes'] += 1
    # Inter (the file's font) sits lower and runs wider than the canvas's Avenir Next: nudged up 0.016 s, tracking -0.0029 s
    t, st, _ = S.text(tn, 'STADTPARK', 'STADTPARK', 0.125 * sa, 600, col('fffaf0'), (a[0] + b[0]) / 2, b[1] - 0.17 * sa + (a[1] - b[1]) / 2 - 0.016 * sa)
    st.set('letterSpacing', str(round(-0.0029 * sa, 3)))
    el('TextValueRun', t, styleId=st.get('id'), text='STADTPARK')
    tl = LI['front']; tufts = S.layer(front, tl, 'grass tufts')
    for i in range(9):
        x = -5 + i * 2.1 + rnd(i) * 0.8; z = 0.95 + rnd(i + 9) * 0.3
        tn, _ = S.anchor(tufts, tl, mult(0, z), f'tuft {i}')
        qx, qy, qs = proj(x, 0, z)
        s = S.shape(tn, f'tuft {i}')
        for kk in range(-2, 3):
            p = el('PointsPath', s, isClosed=False, name=f'blade {kk}')
            sx_, sy_ = qx + kk * 0.03 * qs, qy; ex, ey = qx + kk * 0.085 * qs, qy - (0.16 - abs(kk) * 0.02) * qs
            cxq, cyq = qx + kk * 0.05 * qs, qy - 0.09 * qs                   # quadratic control -> cubic handles
            o1 = (sx_ + 2 / 3 * (cxq - sx_), sy_ + 2 / 3 * (cyq - sy_)); i2 = (ex + 2 / 3 * (cxq - ex), ey + 2 / 3 * (cyq - ey))
            el('CubicDetachedVertex', p, x=round(sx_, 3), y=round(sy_, 3), inRotation=0, inDistance=0,
               outRotation=round(math.atan2(o1[1] - sy_, o1[0] - sx_), 5), outDistance=round(math.dist(o1, (sx_, sy_)), 3))
            el('CubicDetachedVertex', p, x=round(ex, 3), y=round(ey, 3), inRotation=round(math.atan2(i2[1] - ey, i2[0] - ex), 5),
               inDistance=round(math.dist(i2, (ex, ey)), 3), outRotation=0, outDistance=0)
        S.paint(s, stroke=col('5f9450' if x > GATE else '9aa58a'), lw=0.016 * qs, cap='round')

    # ---- the tag pill (top right): cream pill with an orange (goal) or green border, bold text in the same colour
    k_ = max(u, 0.85)                                         # canvas: k = max(u, 0.85 * dpr); 1 artboard px = 1 canvas px here
    th = 26 * k_; cy_ = 10 * u + th / 2
    # auto-sized by layout: a fixed row as wide as the artboard minus the right margin, the pill hugs its text, right aligned
    row = el('LayoutComponent', None, name='tag row', x=0, y=round(10 * u, 3), width=W, height=round(th, 3))
    S.add(pill, row)
    rs = el('LayoutComponentStyle', row, name='tag row style', flexDirectionValue='row', layoutAlignmentType='topRight', paddingRight=round(10 * u, 3))
    row.set('styleId', rs.get('id'))
    box = el('LayoutComponent', row, name='pill', width=200, height=round(th, 3))
    bs = el('LayoutComponentStyle', box, name='pill style', layoutWidthScaleType='hug', layoutHeightScaleType='fixed', layoutAlignmentType='center',
            paddingLeft=round(10 * k_, 3), paddingRight=round(10 * k_, 3), paddingBottom=round(2 * k_, 3), cornerRadiusTL=round(th / 2, 3))
    box.set('styleId', bs.get('id'))
    bf = el('Fill', box); el('SolidColor', bf, colorValue='F5F3EDDC')                 # rgba(243,237,220,.96)
    bst = el('Stroke', box, thickness=round(2 * k_, 3)); bsc = el('SolidColor', bst, colorValue=col('2f5d50'))
    t = el('Text', box, name='tag', sizingValue='autoWidth', wrapValue='noWrap')
    el('LayoutParticipant', t, layoutWidthScaleType='hug', layoutHeightScaleType='hug', name='tag size')
    st = el('TextStylePaint', t, fontSize=round(15 * k_, 3), fontAssetId=ctx['font_id'], name='tag style')
    el('TextStyleAxis', st, tag=0x77676874, axisValue=700)
    f = el('Fill', st); sc = el('SolidColor', f, colorValue=col('2f5d50'))
    run = el('TextValueRun', t, styleId=st.get('id'), text='in den Park · Wohin?', name='tag')
    S.bindc(run, 268, 'tag')
    for c_ in (sc, bsc): goal_colour(S, c_)

    S.finish()
    for c in list(top): parent.append(c)                      # tag pill, scenery front, Liv slot, scenery back (top first)
    ctx['stats'] = S.stats
    return slot


def post(S, parent, li, x, z, u):
    pn, ma = S.anchor(parent, li, mult(0.8, z), f'post z {z}')
    S.box(pn, li, ma, x - 0.11, 0, z - 0.09, x + 0.11, 1.56, z + 0.09, {'front': 'd8cdb8', 'top': 'ece4d2', 'side': 'b9ac94'}, 1.4 * u, 'post')
    S.box(pn, li, ma, x - 0.15, 1.56, z - 0.12, x + 0.15, 1.65, z + 0.12, {'front': 'c2b59c', 'top': 'e0d6c0', 'side': 'a59880'}, 1.4 * u, 'post cap')


def vis_formula(S, node, invert):
    """node.opacity = goalVis * (1 - route)  (arrow)  or  goalVis * route  (area)."""
    el = S.el; name = 'overlay arrow vis' if invert else 'overlay area vis'
    conv = el('DataConverterFormula', S.root, name=name); S.stats['converters'] += 1
    el('FormulaTokenInput', conv); el('FormulaTokenOperation', conv, operationType=2)
    el('FormulaTokenParenthesisOpen', conv)
    if invert: el('FormulaTokenValue', conv, operationValue=1); el('FormulaTokenOperation', conv, operationType=1)
    tok = el('FormulaTokenValue', conv, operationValue=0); S.ctx['bindp'](tok, 777, 'route')
    el('FormulaTokenParenthesisClose', conv)
    S.bindc(node, 18, 'goalVis', conv.get('id'))


def dash_formula(S, speed, period):
    """The arrow's dash offset from t (the canvas lineDashOffset = -t * speed). Rive draws a broken first dash when |offset| exceeds a period,
    so the offset is kept inside [-period, 0)."""
    el = S.el; conv = el('DataConverterFormula', S.root, name='arrow dash offset'); S.stats['converters'] += 1
    T = lambda: (el('FormulaTokenInput', conv), el('FormulaTokenOperation', conv, operationType=2), el('FormulaTokenValue', conv, operationValue=round(speed / period, 7)))
    # Rive's phase is -offset, the canvas phase is (-t * speed) mod period, so offset = period * (x - floor(x) - 1), x = t * speed / period
    el('FormulaTokenValue', conv, operationValue=round(period, 7)); el('FormulaTokenOperation', conv, operationType=2)
    el('FormulaTokenParenthesisOpen', conv)
    el('FormulaTokenParenthesisOpen', conv); T(); el('FormulaTokenParenthesisClose', conv)
    el('FormulaTokenOperation', conv, operationType=1); el('FormulaTokenFunction', conv, functionType=4); T(); el('FormulaTokenParenthesisClose', conv)
    el('FormulaTokenOperation', conv, operationType=1); el('FormulaTokenValue', conv, operationValue=1)
    el('FormulaTokenParenthesisClose', conv)
    return conv.get('id')


def goal_colour(S, solid):
    """Green #2f5d50 at goal 0, orange #d9622b at goal 1 (per channel, clamped)."""
    for key, a, b in ((118, 0x2f, 0xd9), (136, 0x5d, 0x62), (210, 0x50, 0x2b)):
        cid = ('goal', key)
        if cid not in S.conv:
            S.conv[cid] = S.el('DataConverterRangeMapper', S.root, name=f'goal colour {key}', minInput=0, maxInput=1, minOutput=a, maxOutput=b,
                               clampLower=True, clampUpper=True).get('id'); S.stats['converters'] += 1
        S.bindc(solid, key, 'goal', S.conv[cid])


def layers_json():
    return {'artboard': [W, H], 'zoom': round(ZOOM, 6), 'checked_for_abs_camX_up_to': CAM_RANGE, 'tolerance_px': TOL,
            'note': 'every layer number must be written each frame; shapes and vertices off a layer depth read the same number through converters', 'camera': {'pitch_deg': 7, 'dist': DIST, 'target_y': TY, 'cx': CX, 'cy': CY},
            'formula': 'parX = -camX * 400 * m', 'liv_slot': [round(proj(0, 0, 0)[0], 3), round(proj(0, 0, 0)[1], 3)],
            'liv_ppm_at_z0': round(proj(0, 0, 0)[2], 4),
            'layers': [{'prop': l['prop'], 'name': l['name'], 'y': l['y'], 'z': l['z'], 'm': l['m']} for l in LAYERS]}


# ---------------------------------------------------------------- the test project
def build_test():
    import xml.etree.ElementTree as E
    out = HERE / 'park-scenery-test'; out.mkdir(exist_ok=True)
    N = [3000]

    def el(t, parent=None, **a):
        if 'id' not in a: N[0] += 1; a['id'] = f'0:{N[0]}'
        e = E.Element(t, {k: (str(v).lower() if isinstance(v, bool) else str(v)) for k, v in a.items()})
        if parent is not None: parent.append(e)
        return e
    root = E.Element('Rive', version='1', kind='fragment')
    ab = el('Artboard', root, name='Park', width=W, height=H, styleId='0:5', id='0:2', defaultStateMachineId='0:7')
    el('LayoutComponentStyle', ab, name='Artboard style', id='0:5')
    vm = el('ViewModel', root, name='Park', defaultInstanceId='0:41', id='0:40'); ab.set('viewModelId', '0:40'); ab.set('viewModelInstanceId', '0:41')
    props, defaults, sdefaults = {}, {}, {}

    def prop(name, default): props[name] = el('ViewModelPropertyNumber', vm, name=name).get('id'); defaults[name] = default
    def prop_str(name, default): props[name] = el('ViewModelPropertyString', vm, name=name).get('id'); sdefaults[name] = default
    def bindp(target, key, name): el('DataBindContext', target, sourcePathIds='0:40-' + props[name], propertyKey=key)
    el('FontAsset', root, file='../../liv/Inter.ttf', name='Inter', id='0:30')
    prop('camX', 0.0)                                         # test only: the controller turns camX into parX0..n
    slot = emit_scenery(el, ab, {'root': root, 'prop': prop, 'prop_str': prop_str, 'bindp': bindp, 'font_id': '0:30'})
    # a stand-in for Liv in the slot (test only): a 1.3 m tall outline at 400 px/m, feet on the slot
    m = el('Shape', None, name='Liv stand-in'); slot.append(m)
    el('Rectangle', m, x=0, y=-260, width=150, height=520, originX=0.5, originY=0.5, cornerRadiusTL=60, cornerRadiusTR=60, cornerRadiusBL=20, cornerRadiusBR=20)
    st = el('Stroke', m, thickness=4); el('SolidColor', st, colorValue='AA7A3A9A')
    ins = el('ViewModelInstance', vm, name='Default', exports=True, id='0:41')
    for n_, v in defaults.items(): el('ViewModelInstanceNumber', ins, viewModelPropertyId=props[n_], propertyValue=v)
    for n_, v in sdefaults.items(): el('ViewModelInstanceString', ins, viewModelPropertyId=props[n_], propertyValue=v)
    # controller (test): parX<i> = -camX * 400 * m<i>; it reads only view-model numbers (a pure function of camX)
    names = ','.join(f"'{l['prop']}'" for l in LAYERS); ms = ','.join(repr(l['m']) for l in LAYERS)
    (out / 'park_test.luau').write_text(f"""-- Test controller for the park scenery: parX<i> = -camX * {ZOOM:g} * m<i> (tools/liv/rive/park/scenery.py, layers.json).
-- A pure function of the view-model number camX: nothing here keeps time.
type St = {{context: Context, vm: ViewModel?, cam: Property<number>?, out: {{{{p: Property<number>, m: number}}}}}}
local NAMES: {{string}} = {{{names}}}
local MS: {{number}} = {{{ms}}}
local function init(self: St, context: Context): boolean
 self.context = context
 local vm = context:viewModel(); if vm == nil then return true end
 self.vm = vm; self.cam = vm:getNumber('camX')
 for i, n in ipairs(NAMES) do local p = vm:getNumber(n); if p then table.insert(self.out, {{p = p, m = MS[i]}}) end end
 return true
end
local function advance(self: St, seconds: number): boolean
 if self.vm == nil then init(self, self.context); if self.vm == nil then return true end end
 local c = if self.cam then self.cam.value else 0
 for _, o in ipairs(self.out) do o.p.value = -c * {ZOOM:g} * o.m end
 return true
end
return function(context: Context): Layout<St>
 return {{context = context, vm = nil, cam = nil, out = {{}}, init = init, advance = advance, draw = function(self: St, renderer: Renderer) end}}
end
""")
    el('ScriptAsset', root, file='park_test.luau', name='park_test', id='0:80')
    layout = el('LayoutComponent', None, name='park test controller', width=W, height=H, styleId='0:82', id='0:81')
    el('LayoutComponentStyle', layout, name='Fill stage', layoutWidthScaleType='fill', layoutHeightScaleType='fill', widthUnitsValue='auto', heightUnitsValue='auto', id='0:82')
    el('ScriptedLayout', layout, name='park test controller', scriptAssetId='0:80')
    ab.insert(1, layout)
    sm = el('StateMachine', ab, name='Park', id='0:7'); layer = el('StateMachineLayer', sm, name='Main', id='0:8')
    entry = el('EntryState', layer, x=0, y=0); el('AnyState', layer, x=0, y=-150); el('ExitState', layer, x=650, y=-150)
    E.indent(root)
    (out / 'scene.rml').write_text(E.tostring(root, encoding='unicode'))
    (out / 'rive.yaml').write_text('name: Park scenery test\nlogs:\n  file: build/rive.log\n  problems: build/problems.log\n')
    (out / '.gitignore').write_text('build/\n')
    (HERE / 'layers.json').write_text(json.dumps(layers_json(), indent=1) + '\n')
    txt = (out / 'scene.rml').read_text()
    print({t: txt.count('<' + t + ' ') for t in ('Shape', 'StraightVertex', 'Ellipse', 'DataBindContext', 'DataConverterRangeMapper', 'DataConverterFormula')}, 'props', len(props))


if __name__ == '__main__':
    build_test()
