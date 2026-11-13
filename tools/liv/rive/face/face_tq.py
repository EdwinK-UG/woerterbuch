"""Liv's face rig for Rive (three-quarter view first): emits the face overlays bound to the head bone.

    from face_tq import emit_face
    face = emit_face(el, bones['head'], ctx)

The art comes from cut_face.py (tools/liv/rive/face/art/, all made from the pack's pixels). Every overlay is a rigid
quad mesh skinned to one small bone, and those bones hang from the head bone, so the face follows the head (turns,
nods, the hair bone does not touch them). The overlays are children of ctx['char'] like every other image, so the
caller decides the draw order: put face['drawables'] (first = on top) just above the head image.

Bones (all RootBones, axis-aligned with the view at bind; 'face' cancels the head bone's own angle):
  head -> face -> eyeN -> lidN, irisN          eyeN: scale (wide); lidN: y (lid closes); irisN: x, y, scale (look)
               -> eyeF -> lidF, irisF
               -> browN base -> browN          x, y, rotation
               -> browF base -> browF
               -> mouth base -> mouth          x, y, rotation, scaleX, scaleY
Layers per eye (top first): happy (^ closed), closed, frame (head pixels with an eye-shaped hole), lash (moves down),
lid filler (stretches from the lash's top to its moving bottom), iris, sclera. The frame hides whatever the moving
layers put outside the eye, so a pupil cannot leave the eye and a lowered lid never shows outside it.

Per-view config: VIEWS[view] (art prefix, which eyes / brows / mouth exist); the numbers the controller needs
(iris travel, lid travel, brow raise) go into a generated Luau module (face_cfg_<view>.luau) via luau_cfg().
"""
from pathlib import Path
import base64, json, math

HERE = Path(__file__).resolve().parent
ART = HERE / 'art'

# what each view has (tq first; front would add both eyes as 'L'/'R' with two brows; side has one eye; tqb/back none)
VIEWS = {
    'tq': {'eyes': ['N', 'F'], 'brows': ['N', 'F'],
           'mouths': ['painted', '0', '1', '2', '3', '4', '5', '6', '7', '8', '0f', '4f'],
           'brow_raise': 9.0, 'brow_rot': 0.2, 'brow_far_scale': 0.85},
    'front': {'eyes': ['N', 'F'], 'brows': ['N', 'F'],
              'mouths': ['painted', '0', '1', '2', '3', '4', '5', '6', '7', '8', '0f', '4f'],
              'brow_raise': 9.0, 'brow_rot': 0.2, 'brow_far_scale': 1.0},
    # side: one eye and one brow; the mouths are drawn profile mouths in the slots of the pack mouths they stand for
    'side': {'eyes': ['N'], 'brows': ['N'], 'mouths': ['painted', '0', '1', '8', '5', '0f', '4f'],
             'brow_raise': 8.0, 'brow_rot': 0.15, 'brow_far_scale': 1.0, 'mouth_xk': 0.0},
    'tqb': {'eyes': [], 'brows': [], 'mouths': []},
    'back': {'eyes': [], 'brows': [], 'mouths': []},
}
MOUTHS_PACK = [str(i) for i in range(9)]


def _varuint(n):
    out = []
    while n > 127: out.append((n & 127) | 128); n >>= 7
    return bytes(out + [n])


def _weights(el, parent, pairs):
    pairs = [(i, w) for i, w in pairs if w > 1e-4][:4]
    vals = [int(round(w * 255)) for _, w in pairs]; vals[vals.index(max(vals))] += 255 - sum(vals)
    v = sum(val << (8 * k) for k, val in enumerate(vals)); idx = sum((i + 1) << (8 * k) for k, (i, _) in enumerate(pairs))
    el('Weight', parent, values=v, indices=idx)


class _Rig:
    def __init__(self, el, head_bone, ctx):
        self.el, self.ctx = el, ctx
        self.char = ctx['char']
        (nx, ny), self.head_ang = ctx['head_world']
        self.neck = (nx, ny)
        # 'face': at the neck, turned back by the head's bind angle, so its children use view axes
        self.face = el('RootBone', head_bone, name='face', x=0, y=0, rotation=-self.head_ang, length=0)
        self.world = {'face': (nx, ny)}
        self.bones = {'face': self.face}

    def bone(self, name, parent, p):
        """A view-aligned RootBone at world point p (bind), child of `parent` (a name in self.bones)."""
        px, py = self.world[parent]
        b = self.el('RootBone', self.bones[parent], name=name, x=p[0] - px, y=p[1] - py, rotation=0, length=0)
        self.bones[name] = b; self.world[name] = (p[0], p[1])
        return b

    def mesh(self, name, asset_id, pts, uvs, tris, bone_names, weights):
        el = self.el
        im = el('Image', self.char, name=name, assetId=asset_id, originX=0, originY=0)
        m = el('Mesh', im, name=name + ' mesh', triangleIndexBytes=base64.b64encode(b''.join(_varuint(int(i)) for t in tris for i in t)).decode())
        for (x, y), (u, v), w in zip(pts, uvs, weights):
            vert = el('MeshVertex', m, x=round(x, 3), y=round(y, 3), u=round(u, 5), v=round(v, 5))
            _weights(el, vert, w)
        skin = el('Skin', m, name=name + ' skin', tx=0, ty=0)
        for b in bone_names:
            wx, wy = self.world[b]
            el('Tendon', skin, boneId=self.bones[b].get('id'), name=b, xx=1, xy=0, yx=0, yy=1, tx=wx, ty=wy)
        return im

    def quad(self, name, asset_id, corners, bone_name):
        return self.mesh(name, asset_id, corners, [(0, 0), (1, 0), (1, 1), (0, 1)], [(0, 1, 2), (0, 2, 3)], [bone_name], [[(0, 1)]] * 4)

    def rect(self, name, asset_id, box, bone_name):
        x, y, w, h = box
        return self.quad(name, asset_id, [(x, y), (x + w, y), (x + w, y + h), (x, y + h)], bone_name)


def emit_face(el, parent_head_bone_element, ctx, pre='', view_cfg=None):
    """Emit Liv's face overlays for one view, skinned to bones under the head bone.

    ctx: {
      'char':       the Node that holds the view's images (build_liv.py: the view group g; meshes are its children, in view px),
      'head_world': ((x, y), angle) of the head bone at bind, in the same view pixels (build_liv.py: world['head'][0] and
                    world['head'][2], i.e. the neck and the angle from the neck to the head top),
      'add_asset':  function(key, file) -> ImageAsset id string; file is relative to the Rive project folder,
      'art_rel':    path of tools/liv/rive/face/art relative to the project folder (default '../face/art'),
      'view':       'tq' (default): which art/<view>_face.json and VIEWS entry to use,
    }
    pre:      the caller's view-model prefix (e.g. 'tq_'). Every name this function returns is WITHOUT it: the caller adds
              it (build_liv.py's vprop / vbind), and the controller passes the same prefix to Face.new in Luau.
    view_cfg: optional dict overriding VIEWS[view]: 'eyes' (e.g. ['N', 'F'], or [] for tqb / back), 'brows', 'mouths',
              'brow_raise', 'brow_rot', 'brow_far_scale', and 'json' (a face json in another place; positions in view px).
    Returns {
      'props':     {name: default} view-model numbers the overlays are bound to (the controller writes them),
      'bindings':  [(element, propertyKey, name)] to bind with the caller's vbind(),
      'drawables': [Image elements] in draw order, first = on top: insert just above the head image,
      'bones':     {name: element},
      'luau_cfg':  text of a Luau module with this view's numbers (face_cfg_<view>.luau, required by the controller),
    }
    """
    view = ctx.get('view', 'tq'); V = dict(VIEWS.get(view, {})); V.update(view_cfg or {})
    art_rel = ctx.get('art_rel', '../face/art')
    J = json.loads(Path(V['json']).read_text() if V.get('json') else (ART / f'{view}_face.json').read_text())
    R = _Rig(el, parent_head_bone_element, ctx)
    props, binds, draw = {}, [], []

    def prop(name, default, element, key):
        props[name] = default; binds.append((element, key, name))

    aids = {}
    def asset(fname):
        if fname not in aids: aids[fname] = ctx['add_asset'](f'face_{fname[:-4]}', f'{art_rel}/{fname}')
        return aids[fname]

    # ---------------------------------------------------------------- mouth (drawn on top of everything else)
    V.setdefault('eyes', []); V.setdefault('brows', []); V.setdefault('mouths', [])
    M = J.get('mouth') or {}
    if not M: V['mouths'] = []
    c = M.get('c', ctx['head_world'][0])
    R.bone('mouth base', 'face', c); mouth = R.bone('mouth', 'mouth base', c)
    for k, key in (('x', 90), ('y', 91), ('r', 15), ('sx', 16), ('sy', 17)):     # RootBone x / y are keys 90 / 91 (13 / 14 are Node's)
        prop('mouth_' + k, 1.0 if k in ('sx', 'sy') else 0.0, mouth, key)
    ox, oy = M.get('pack_origin', (0, 0)); pw, ph = M.get('pack_size', (0, 0))
    ct, st = math.cos(M.get('tilt', 0)), math.sin(M.get('tilt', 0))
    def placed(x, y):          # pack mouth image point -> view: scale sx about the mouth point, then tilt
        dx, dy = (x + ox) * M['sx'], (y + oy)
        return (c[0] + dx * ct - dy * st, c[1] + dx * st + dy * ct)
    if not V['mouths']:
        props.clear(); binds.clear()          # no mouth in this view: no mouth numbers either
    for mname in V['mouths']:
        if mname == 'painted':
            im = R.rect(f'Liv mouth painted', asset(f'{view}_mouth_painted.png'), M['painted_box'], 'mouth')
        elif 'boxes' in M:          # drawn profile mouths, each with its own box
            im = R.rect(f'Liv mouth {mname}', asset(f'{view}_mouth_{mname}.png'), M['boxes'][mname], 'mouth')
        else:
            im = R.quad(f'Liv mouth {mname}', asset(f'mouth_{mname}.png'), [placed(0, 0), placed(pw, 0), placed(pw, ph), placed(0, ph)], 'mouth')
        prop('mo_' + mname, 1.0 if mname == 'painted' else 0.0, im, 18)
        draw.append(im)

    # ---------------------------------------------------------------- brows (above the eyes), far brow's hole patch
    holes = []
    for bn in V['brows']:
        B = J['brows'][bn]
        R.bone(f'brow{bn} base', 'face', B['pivot']); b = R.bone(f'brow{bn}', f'brow{bn} base', B['pivot'])
        for k, key in (('x', 90), ('y', 91), ('r', 15)): prop(f'brow{bn}_{k}', 0.0, b, key)
        draw.append(R.rect(f'Liv brow {bn}', asset(B['img']), B['box'], f'brow{bn}'))
        if B['hole']: holes.append(R.rect(f'Liv brow {bn} hole', asset(B['hole']), B['box'], 'face'))
    draw += holes

    # ---------------------------------------------------------------- eyes
    for en in V['eyes']:
        E = J['eyes'][en]; box = E['box']; ctr = E['center']
        eye = R.bone(f'eye{en}', 'face', ctr); lid = R.bone(f'lid{en}', f'eye{en}', ctr); iris = R.bone(f'iris{en}', f'eye{en}', ctr)
        prop(f'eye{en}_sx', 1.0, eye, 16); prop(f'eye{en}_sy', 1.0, eye, 17)
        prop(f'lid{en}_y', 0.0, lid, 91)
        prop(f'iris{en}_x', 0.0, iris, 90); prop(f'iris{en}_y', 0.0, iris, 91)
        prop(f'iris{en}_s', 1.0, iris, 16); binds.append((iris, 17, f'iris{en}_s'))
        happy = R.rect(f'Liv eye {en} happy', asset(f'{view}_eye{en}_happy.png'), E['happy_box'], f'eye{en}')
        closed = R.rect(f'Liv eye {en} closed', asset(f'{view}_eye{en}_closed.png'), E['closed_box'], f'eye{en}')
        prop(f'happy{en}', 0.0, happy, 18); prop(f'closed{en}', 0.0, closed, 18)
        frame = R.rect(f'Liv eye {en} frame', asset(f'{view}_eye{en}_frame.png'), box, f'eye{en}')
        lash = R.rect(f'Liv eye {en} lash', asset(f'{view}_eye{en}_lash.png'), box, f'lid{en}')
        # lid filler: a strip per column, top row fixed on the eye bone, bottom row on the lid bone
        cols = E['fill_cols']; pts, uvs, tris, wts = [], [], [], []
        for i, (x, top, edge) in enumerate(cols):
            pts += [(x - 0.5, top), (x - 0.5, edge)]; uvs += [(0.5, 0.5), (0.5, 0.5)]; wts += [[(0, 1)], [(1, 1)]]
        x, top, edge = cols[-1]; pts += [(x + 0.5, top), (x + 0.5, edge)]; uvs += [(0.5, 0.5)] * 2; wts += [[(0, 1)], [(1, 1)]]
        for i in range(len(cols)):
            a = 2 * i; tris += [(a, a + 2, a + 3), (a, a + 3, a + 1)]
        fill = R.mesh(f'Liv eye {en} lid', asset(f'{view}_eye{en}_lidfill.png'), pts, uvs, tris, [f'eye{en}', f'lid{en}'], wts)
        irs = R.rect(f'Liv eye {en} iris', asset(f'{view}_eye{en}_iris.png'), box, f'iris{en}')
        scl = R.rect(f'Liv eye {en} white', asset(f'{view}_eye{en}_sclera.png'), box, f'eye{en}')
        draw += [happy, closed, frame, lash, fill, irs, scl]
    return {'props': props, 'bindings': binds, 'drawables': draw, 'bones': R.bones, 'luau_cfg': luau_cfg(view, J, V), 'pre': pre}


def luau_cfg(view, J=None, V=None):
    """The per-view numbers for face.luau, as a Luau module (all numbers, one flat table)."""
    J = J or json.loads((ART / f'{view}_face.json').read_text()); V = V or VIEWS[view]
    cfg = {'brow_raise': V.get('brow_raise', 9.0), 'brow_rot': V.get('brow_rot', 0.2), 'brow_far_scale': V.get('brow_far_scale', 1.0),
           'wide_sx': 1.05, 'wide_sy': 1.09, 'iris_wide': 0.86, 'mouth_px': 1.0, 'mouth_xk': V.get('mouth_xk', 1.0)}
    for en in ('N', 'F'):
        E = J['eyes'].get(en) if en in V.get('eyes', []) else None
        cfg['has' + en] = 1 if E else 0
        if not E: continue
        L = E['look']
        cfg.update({f'iris{en}_xl': L['xl'], f'iris{en}_xr': L['xr'], f'iris{en}_yu': L['yu'], f'iris{en}_yd': L['yd'], f'lid{en}_travel': E['travel']})
    body = ''.join(f' {k} = {float(v):.4f},\n' for k, v in sorted(cfg.items()))
    return (f'-- Generated by tools/liv/rive/face/face_tq.py for the {view} view: pixel ranges for face.luau.\n'
            f'local CFG: {{[string]: number}} = {{\n{body}}}\nreturn CFG\n')
