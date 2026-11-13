"""Standalone Rive test project for Liv's face: the pack's three-quarter head on a head bone + the face overlays from
face_tq.emit_face + labelled buttons (ten expressions, look left / right / up / down / centre, blink, wink, nod).

    python3 tools/liv/rive/face/cut_face.py            # art (once, or after changing the cut)
    python3 tools/liv/rive/face/build_face_test.py     # -> tools/liv/rive/face/liv-face-test/
    cd tools/liv/rive/face/liv-face-test && rive . --verify && rive .
"""
from pathlib import Path
import json, math, shutil, sys
import xml.etree.ElementTree as E

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from face_tq import emit_face

OUT = HERE / 'liv-face-test'; OUT.mkdir(exist_ok=True)
PARTS = json.loads((HERE.parent / 'parts/parts.json').read_text())
STAGE_W, STAGE_H = 1100, 760
SCALE = 1.7
NECK, HEAD_TOP = (504.0, 472.0), (508.0, 180.0)          # as build_tq.py
HP = PARTS['tq_head']
CHAR_X, CHAR_Y = 30 - HP['x'] * SCALE, 40 - HP['y'] * SCALE
EXPRS = ['Happy', 'Smile', 'Neutral', 'Laugh', 'Surprised', 'Sad', 'Think', 'Ouch', 'Effort', 'Wink']

N = 2000
def el(t, parent=None, **a):
    global N
    if 'id' not in a: N += 1; a['id'] = f'0:{N}'
    e = E.Element(t, {k: (str(v).lower() if isinstance(v, bool) else str(v)) for k, v in a.items()})
    if parent is not None: parent.append(e)
    return e

root = E.Element('Rive', version='1', kind='fragment')
aid = [100]
def add_asset(key, file):
    a = el('ImageAsset', root, file=file, name=key, id=f'0:{aid[0]}'); aid[0] += 1
    return a.get('id')
head_asset = add_asset('tq_head', '../../parts/tq_head.png')
ab = el('Artboard', root, name='Liv face test', width=STAGE_W, height=STAGE_H, defaultStateMachineId='0:7', styleId='0:5', id='0:2')
el('LayoutComponentStyle', ab, name='Artboard style', id='0:5')
f = el('Fill', ab, name='Studio'); el('SolidColor', f, colorValue='FFF3EBDD')
char = el('Node', ab, name='Liv', x=CHAR_X, y=CHAR_Y, scaleX=SCALE, scaleY=SCALE, id='0:10')

w = math.atan2(HEAD_TOP[1] - NECK[1], HEAD_TOP[0] - NECK[0])
head_bone = el('RootBone', char, name='head', x=NECK[0], y=NECK[1], rotation=w, length=math.dist(NECK, HEAD_TOP))
PRE = 'tq_'                                             # per-view prefix, as build_liv.py
face = emit_face(el, head_bone, {'char': char, 'head_world': (NECK, w), 'add_asset': add_asset, 'art_rel': '../art', 'view': 'tq'}, pre=PRE)

# the head image: rigid on the head bone (the real rig uses a grid with a hair bone; the face does not care)
x, y, ww, hh = HP['x'], HP['y'], HP['w'], HP['h']
head_img = el('Image', char, name='Liv head', assetId=head_asset, originX=0, originY=0)
import base64
m = el('Mesh', head_img, name='head mesh', triangleIndexBytes=base64.b64encode(bytes([0, 1, 2, 0, 2, 3])).decode())
for (px, py), (u, v) in zip([(x, y), (x + ww, y), (x + ww, y + hh), (x, y + hh)], [(0, 0), (1, 0), (1, 1), (0, 1)]):
    vt = el('MeshVertex', m, x=px, y=py, u=u, v=v); el('Weight', vt, values=255, indices=1)
sk = el('Skin', m, name='head skin', tx=0, ty=0)
el('Tendon', sk, boneId=head_bone.get('id'), name='head', xx=math.cos(w), xy=math.sin(w), yx=-math.sin(w), yy=math.cos(w), tx=NECK[0], ty=NECK[1])
for im in face['drawables'] + [head_img]:
    char.remove(im); char.append(im)

# view model: the face's outputs + its inputs + the test's head nod
defaults = {PRE + n: v for n, v in face['props'].items()}
defaults.update({'expression': 0, 'expressionAmount': 1, 'lookX': 0, 'lookY': 0, 'blinkNow': 0, 'winkNow': 0, 'faceIdle': 1, 'autoBlink': 1,
                 'nod': 0, 'headRot': w, 'headRest': w})
vm = el('ViewModel', root, name='LivFace', defaultInstanceId='0:41', id='0:40')
ab.set('viewModelId', '0:40'); ab.set('viewModelInstanceId', '0:41')
props = {n: el('ViewModelPropertyNumber', vm, name=n).get('id') for n in defaults}
ins = el('ViewModelInstance', vm, name='Default', exports=True, id='0:41')
for n, v in defaults.items(): el('ViewModelInstanceNumber', ins, viewModelPropertyId=props[n], propertyValue=v)
def bindp(target, key, name): el('DataBindContext', target, sourcePathIds='0:40-' + props[name], propertyKey=key)
for e_, key, n in face['bindings']: bindp(e_, key, PRE + n)
bindp(head_bone, 15, 'headRot')

# scripts: the face module and its per-view numbers first (a module must be declared before what requires it)
(OUT / 'face_cfg_tq.luau').write_text(face['luau_cfg'])
shutil.copy(HERE / 'face.luau', OUT / 'face.luau')
el('ScriptAsset', root, file='face.luau', name='face', isModule=True, id='0:78')
el('ScriptAsset', root, file='face_cfg_tq.luau', name='face_cfg_tq', isModule=True, id='0:79')
(OUT / 'test.luau').write_text('''-- Test controller: drives the face module and a gentle head nod (button "Nod").
local Face = require('face')
local CFG_TQ = require('face_cfg_tq')
type St = {context: Context, face: Face.Face?, rot: Property<number>?, rest: number, nod: Property<number>?, t: number}
local function init(self: St, context: Context): boolean
 self.context = context
 local vm = context:viewModel()
 if vm == nil then return true end
 self.face = Face.new(vm, {{pre = 'tq_', cfg = CFG_TQ}}, '')
 self.rot = vm:getNumber('headRot'); self.nod = vm:getNumber('nod')
 local r = vm:getNumber('headRest'); if r then self.rest = r.value end
 return true
end
local function advance(self: St, seconds: number): boolean
 self.t += seconds
 local f = self.face
 if f then Face.update(f, seconds) end
 local n = 0.0
 local np = self.nod
 if np then n = np.value end
 local rp = self.rot
 if rp then rp.value = self.rest + n * 0.16 * math.sin(self.t * 2.4) end
 return true
end
return function(context: Context): Layout<St>
 return {context = context, face = nil, rot = nil, rest = 0, nod = nil, t = 0, init = init, advance = advance, draw = function(self: St, renderer: Renderer) end}
end
''')
el('ScriptAsset', root, file='test.luau', name='test', id='0:80')
layout = el('LayoutComponent', ab, name='Face controller', width=STAGE_W, height=STAGE_H, styleId='0:82', id='0:81')
el('LayoutComponentStyle', layout, name='Fill stage', layoutWidthScaleType='fill', layoutHeightScaleType='fill', widthUnitsValue='auto', heightUnitsValue='auto', id='0:82')
el('ScriptedLayout', layout, name='Liv face controller', scriptAssetId='0:80')
ab.remove(layout); ab.insert(0, layout)

# buttons
el('FontAsset', root, file='../../liv-tq/Inter.ttf', name='Inter', id='0:30')
def text(content, x, y, size=17, color='FF4C4038'):
    t = el('Text', ab, name=content, x=x, y=y)
    st = el('TextStylePaint', t, fontSize=size, fontAssetId='0:30'); f = el('Fill', st); el('SolidColor', f, colorValue=color)
    el('TextValueRun', t, styleId=st.get('id'), text=content)
    ab.remove(t); ab.insert(1, t)
    return t
sm = el('StateMachine', ab, name='Face', id='0:7'); layer = el('StateMachineLayer', sm, name='Main', id='0:8')
def button(label, x, y, bw, actions):
    sh = el('Shape', ab, x=x, y=y, name=label + ' button'); el('Rectangle', sh, width=bw, height=38, cornerRadiusTL=9, cornerRadiusTR=9, cornerRadiusBL=9, cornerRadiusBR=9)
    f = el('Fill', sh); el('SolidColor', f, colorValue='FFE6D8C6'); ab.remove(sh); ab.insert(1, sh)
    text(label, x - len(label) * 4.9, y - 10)
    li = el('StateMachineListenerSingle', sm, targetId=sh.get('id'), listenerTypeValue='click', name=label)
    for prop, val in actions:
        act = el('ListenerViewModelChange', li); bp = el('BindablePropertyNumber', act, propertyValue=val)
        el('DataBindContext', bp, sourcePathIds='0:40-' + props[prop], propertyKey=636, direction=True)
    return (x, y)
BTN = {}
text('Liv · face · three-quarter view', 24, 10, 18)
text('Expressions', 812, 40, 14, 'FF8B7460')
for i, n in enumerate(EXPRS):
    BTN[n] = button(n, 870 + (i % 2) * 140, 92 + (i // 2) * 48, 128, [('expression', i)])
text('Look', 812, 340, 14, 'FF8B7460')
for i, (n, lx, ly) in enumerate([('Left', -1, 0), ('Right', 1, 0), ('Up', 0, 1), ('Down', 0, -1), ('Centre', 0, 0)]):
    BTN['Look ' + n] = button(n, 870 + (i % 2) * 140, 392 + (i // 2) * 48, 128, [('lookX', lx), ('lookY', ly)])
text('Eyes and head', 812, 590, 14, 'FF8B7460')
BTN['Blink'] = button('Blink', 870, 640, 128, [('blinkNow', 1)])
BTN['Wink eye'] = button('Wink eye', 1010, 640, 128, [('winkNow', 1)])
BTN['Nod'] = button('Nod', 870, 688, 128, [('nod', 1)])
BTN['Still'] = button('Still', 1010, 688, 128, [('nod', 0)])
entry = el('EntryState', layer, x=0, y=0); el('StateTransition', entry, stateToId='0:12')
el('AnyState', layer, x=0, y=-150); el('ExitState', layer, x=650, y=-150)
el('AnimationState', layer, animationId='0:60', id='0:12', x=180, y=0)
el('LinearAnimation', ab, name='Idle', fps=60, duration=60, loopValue='loop', id='0:60')

E.indent(root)
(OUT / 'scene.rml').write_text(E.tostring(root, encoding='unicode'))
(OUT / 'rive.yaml').write_text('name: Liv-Face-Test\nlogs:\n  file: build/rive.log\n  problems: build/problems.log\n')
(OUT / '.gitignore').write_text('build/\n')
# where things are on the stage (for the render script): face crop box and button centres
def stage(px, py): return (CHAR_X + px * SCALE, CHAR_Y + py * SCALE)
fx0, fy0 = stage(470, 248); fx1, fy1 = stage(652, 442)
hx0, hy0 = stage(HP['x'], HP['y']); hx1, hy1 = stage(HP['x'] + HP['w'], HP['y'] + HP['h'])
(OUT / 'layout.json').write_text(json.dumps({'face_crop': [fx0, fy0, fx1, fy1], 'head_crop': [hx0, hy0, hx1, hy1], 'buttons': BTN, 'scale': SCALE, 'expressions': EXPRS}, indent=1))
print('props', len(face['props']), 'drawables', len(face['drawables']))
