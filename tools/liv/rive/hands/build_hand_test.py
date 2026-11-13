"""Build the hand test project: tools/liv/rive/hands/liv-hand-test/ (scene.rml, controller.luau, rive.yaml).

    python3 tools/liv/rive/hands/build_hand_test.py
    cd tools/liv/rive/hands/liv-hand-test && rive . --verify && rive .

Two arms as bone chains (shoulder -> forearm -> hand bone). Each hand hangs on a Node that copies the hand bone's world
transform (TransformConstraint, world to world), exactly as the character rig will attach it. The lower arm carries the
LEFT hand (flip -1, the mirror). Below: both hands at character scale next to the painted hands of the pack (same
scale) for comparison. Buttons: every shape, Turn over (palm side), Arm moves, Sequence (the 12 s demo sequence).
"""
from pathlib import Path
import json, math, shutil, sys
import xml.etree.ElementTree as E

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import hand_rig  # noqa: E402

OUTD = HERE / 'liv-hand-test'; OUTD.mkdir(exist_ok=True)
PARTS = json.loads((HERE.parent / 'parts/parts.json').read_text())
W, H = 1440, 1000

N = 2000
def el(t, parent=None, **a):
    global N
    if 'id' not in a: N += 1; a['id'] = f'0:{N}'
    e = E.Element(t, {k: (str(v).lower() if isinstance(v, bool) else str(v)) for k, v in a.items()})
    if parent is not None: parent.append(e)
    return e

root = E.Element('Rive', version='1', kind='fragment')
shutil.copy(HERE / 'hand_pose.luau', OUTD / 'hand_pose.luau')          # a copy: the module must sit in the project
el('ScriptAsset', root, file='hand_pose.luau', name='hand_pose', isModule=True, id='0:79')
el('ScriptAsset', root, file='controller.luau', name='controller', id='0:80')
el('FontAsset', root, file='../../liv-tq/Inter.ttf', name='Inter', id='0:30')
REF = ['relaxed', 'point', 'fist', 'thumb', 'palm', 'back']
ref_assets = {}
for i, n in enumerate(REF):
    ref_assets[n] = el('ImageAsset', root, file=f'../../parts/hand_{n}.png', name='hand_' + n, id=f'0:{100 + i}').get('id')

ab = el('Artboard', root, name='Liv hands', width=W, height=H, defaultStateMachineId='0:7', styleId='0:5', id='0:2')
el('LayoutComponentStyle', ab, name='Artboard style', id='0:5')
f = el('Fill', ab, name='Paper'); el('SolidColor', f, colorValue='FFF3EBDD')

# view model (declared up front; binds are collected and applied at the end)
vm = el('ViewModel', root, name='Hands', defaultInstanceId='0:41', id='0:40')
ab.set('viewModelId', '0:40'); ab.set('viewModelInstanceId', '0:41')
PROPS, DEFAULTS, PENDING = {}, {}, []
def prop(name, value):
    if name not in PROPS:
        PROPS[name] = el('ViewModelPropertyNumber', vm, name=name).get('id'); DEFAULTS[name] = value
def bind(target, key, name, conv=None):
    PENDING.append((target, key, name, conv))

SHAPES = ['relaxed', 'open', 'flat', 'wave', 'fist', 'point', 'thumbsUp', 'pinch', 'gripSphere', 'gripHandle',
          'carry', 'beckon', 'count1', 'count2', 'count3', 'count4', 'count5']
for k, v in {'shape': 0, 'turn': 0, 'move': 0, 'seq': 0, 'rate': 1, 'shapeOut': 0,
             'armRSh': .62, 'armREl': -.62, 'armRWr': 0, 'armLSh': -.62, 'armLEl': .62, 'armLWr': 0,
             'propApple': 0, 'propHandle': 0}.items():
    prop(k, v)

SKIN, INK, SLEEVE = 'FFFDC28D', 'FF3A1C0C', 'FFFED9A6'
def capsule(parent, name, length, r0, color, ink=True, x0=0.0):
    s = el('Shape', parent, name=name)
    el('Rectangle', s, x=x0 - r0, y=0, originX=0, originY=.5, width=length + 2 * r0, height=2 * r0, cornerRadiusTL=r0)
    if ink:
        st = el('Stroke', s, thickness=6, cap='round', join='round'); el('SolidColor', st, colorValue=INK)
    fl = el('Fill', s); el('SolidColor', fl, colorValue=color)
    # (paints: last declared on top -> the fill covers the inner half of the 6 px stroke)
    s.remove(fl); s.insert(1, fl)
    return s

hands = {}
def arm(side, x, y, scale, sh, elb):
    """A bone chain: shoulder (root bone) -> forearm -> hand bone; the hand is attached by a world TransformConstraint."""
    holder = el('Node', ab, name=f'arm {side}', x=x, y=y, scaleX=scale, scaleY=scale)
    up = el('RootBone', holder, name=f'upperArm_{side}', x=0, y=0, rotation=sh, length=150)
    fo = el('Bone', up, name=f'foreArm_{side}', rotation=elb, length=140)
    hb = el('Bone', fo, name=f'hand_{side}', rotation=0, length=45)
    bind(up, 15, f'arm{side}Sh'); bind(fo, 15, f'arm{side}El'); bind(hb, 15, f'arm{side}Wr')
    capsule(fo, f'forearm {side}', 140, 16.6, SKIN)
    capsule(up, f'sleeve {side}', 150, 27, SLEEVE)
    mount = el('Node', ab, name=f'hand mount {side}')
    el('TransformConstraint', mount, name=f'follow hand_{side}', targetId=hb.get('id'), sourceSpaceValue='world', destSpaceValue='world', strength=1)
    return holder, mount

def add_hand(side, parent, scale, prefix):
    pr = {'prefix': prefix, 'root': root, 'bind': bind}
    node, names = hand_rig.emit_hand(el, parent, side, scale, pr)
    for n in names: prop(n, pr['defaults'][n])
    hands[prefix] = pr
    return node, pr

# sleeves draw over the forearm; forearm under the hand: fix order below
armR, mountR = arm('R', 70, 70, 2.0, .62, -.62)
armL, mountL = arm('L', 70, 600, 2.0, -.62, .62)
handR, prR = add_hand('R', mountR, 1.0, 'handR')
handL, prL = add_hand('L', mountL, 1.0, 'handL')

# grip props in the hand frame (behind the hand): an apple (40 px) and a saw handle (30 px)
def grip_props(hand_node, tag):
    flip = hand_node.find('Node')
    ap = el('Shape', flip, name=f'apple {tag}', x=58 * 1.1, y=24 * 1.1, opacity=0)
    el('Ellipse', ap, width=40 * 1.1, height=40 * 1.1)
    st = el('Stroke', ap, thickness=6); el('SolidColor', st, colorValue=INK)
    fl = el('Fill', ap); el('SolidColor', fl, colorValue='FFD8432E')
    bind(ap, 18, 'propApple')
    hd = el('Shape', flip, name=f'handle {tag}', x=52 * 1.1, y=20 * 1.1, opacity=0, rotation=1.35)
    el('Rectangle', hd, width=120, height=30, cornerRadiusTL=12)
    st = el('Stroke', hd, thickness=6); el('SolidColor', st, colorValue=INK)
    fl = el('Fill', hd); el('SolidColor', fl, colorValue='FFB07A45')
    bind(hd, 18, 'propHandle')
    for s in (ap, hd):
        flip.remove(s); flip.append(s)          # behind the hand
for hn, tag in ((handR, 'R'), (handL, 'L')):
    grip_props(hn, tag)

# character-scale row: the two hands at the rig's scale (view px x 0.62 stage scale) next to the painted ones
CS = 0.62 * 1.6                                   # shown 1.6x larger than on the stage, still small enough to judge
row_y = 905
small = {}
for i, (side, prefix) in enumerate((('R', 'handR'), ('L', 'handL'))):
    holder = el('Node', ab, name=f'small {side}', x=60 + i * 170, y=row_y - (0 if side == 'R' else 30))
    capsule(holder, f'small forearm {side}', 60, 15.5 * CS, SKIN, x0=-60 * CS)
    pr = {'prefix': prefix, 'root': root, 'bind': bind}
    n, _ = hand_rig.emit_hand(el, holder, side, CS, pr)
    holder.remove(n); holder.insert(0, n)
REF_S = 996 / PARTS['hand_relaxed']['ppm'] * 1.1 * CS
for i, nme in enumerate(REF):
    p = PARTS['hand_' + nme]
    img = el('Image', ab, name=f'painted {nme}', assetId=ref_assets[nme], originX=0, originY=0,
             x=380 + i * 118 - p['ax'] * REF_S * 0 , y=row_y - 70, scaleX=REF_S, scaleY=REF_S)

def text(content, x, y, size=18, color='FF4C4038', at=None):
    t = el('Text', ab, name=content, x=x, y=y)
    st = el('TextStylePaint', t, fontSize=size, fontAssetId='0:30'); fl = el('Fill', st); el('SolidColor', fl, colorValue=color)
    el('TextValueRun', t, styleId=st.get('id'), text=content)
    ab.remove(t); ab.insert(0, t)
    return t

text('Liv hands - vector rig test (right hand above, left hand = mirror below)', 30, 14, 18)
text('character scale x1.6: vector R, L   |   painted pack hands, same scale', 30, row_y - 118, 13, 'FF8B7460')

sm = el('StateMachine', ab, name='Hands', id='0:7'); layer = el('StateMachineLayer', sm, name='Main', id='0:8')
BX, BY, BW, BH = 1110, 64, 140, 36
def button(label, x, y, prop_name, val, w=BW):
    sh = el('Shape', ab, x=x, y=y, name=label + ' button'); el('Rectangle', sh, width=w, height=BH, cornerRadiusTL=9)
    fl = el('Fill', sh); el('SolidColor', fl, colorValue='FFE6D8C6'); ab.remove(sh); ab.insert(0, sh)
    t = text(label, x - len(label) * 4.6, y - 10, 16)
    li = el('StateMachineListenerSingle', sm, targetId=sh.get('id'), listenerTypeValue='click', name=label)
    act = el('ListenerViewModelChange', li); bp = el('BindablePropertyNumber', act, propertyValue=val)
    el('DataBindContext', bp, sourcePathIds='0:40-' + PROPS[prop_name], propertyKey=636, direction=True)
    if prop_name == 'shape':
        act2 = el('ListenerViewModelChange', li); bp2 = el('BindablePropertyNumber', act2, propertyValue=0)
        el('DataBindContext', bp2, sourcePathIds='0:40-' + PROPS['seq'], propertyKey=636, direction=True)
LABELS = {'relaxed': 'Relaxed', 'open': 'Open', 'flat': 'Flat', 'wave': 'Wave', 'fist': 'Fist', 'point': 'Point',
          'thumbsUp': 'Thumbs up', 'pinch': 'Pinch', 'gripSphere': 'Grip apple', 'gripHandle': 'Grip handle',
          'carry': 'Carry', 'beckon': 'Beckon', 'count1': 'Count 1', 'count2': 'Count 2', 'count3': 'Count 3',
          'count4': 'Count 4', 'count5': 'Count 5'}
for i, s in enumerate(SHAPES):
    col, row = i % 2, i // 2
    button(LABELS[s], BX + col * 160, BY + row * 46, 'shape', i)
yb = BY + 9 * 46 + 10
text('View', BX - 60, yb - 30, 14, 'FF8B7460')
button('Back of hand', BX, yb, 'turn', 0); button('Palm side', BX + 160, yb, 'turn', 1)
button('Arm still', BX, yb + 46, 'move', 0); button('Arm moves', BX + 160, yb + 46, 'move', 1)
button('Sequence', BX, yb + 92, 'seq', 1); button('Slow 0.25x', BX + 160, yb + 92, 'rate', .25)
button('Speed 1x', BX + 160, yb + 138, 'rate', 1)
text('Shapes', BX - 60, BY - 44, 14, 'FF8B7460')

# a read-out of the shape index (for frame dumps)
layout = el('LayoutComponent', ab, name='Hand controller', width=W, height=H, styleId='0:82', id='0:81')
el('LayoutComponentStyle', layout, name='Fill stage', layoutWidthScaleType='fill', layoutHeightScaleType='fill', widthUnitsValue='auto', heightUnitsValue='auto', id='0:82')
el('ScriptedLayout', layout, name='Hand controller', scriptAssetId='0:80')
ab.remove(layout); ab.insert(0, layout)

entry = el('EntryState', layer, x=0, y=0); el('StateTransition', entry, stateToId='0:12')
el('AnyState', layer, x=0, y=-150); el('ExitState', layer, x=650, y=-150)
el('AnimationState', layer, animationId='0:60', id='0:12', x=180, y=0)
an = el('LinearAnimation', ab, name='Idle', fps=60, duration=60, loopValue='loop', id='0:60')

# order: hands above arms (first child on top). Mounts before arm holders.
for m in (mountR, mountL):
    ab.remove(m)
idx = list(ab).index(armR)
ab.insert(idx, mountL); ab.insert(idx, mountR)

# view model instance + binds
ins = el('ViewModelInstance', vm, name='Default', exports=True, id='0:41')
for name, value in DEFAULTS.items():
    el('ViewModelInstanceNumber', ins, viewModelPropertyId=PROPS[name], propertyValue=value)
for target, key, name, conv in PENDING:
    a = {'sourcePathIds': '0:40-' + PROPS[name], 'propertyKey': key}
    if conv: a['converterId'] = conv
    el('DataBindContext', target, **a)
# converters and the view model are root elements; keep the view model after the converters that read it
root.remove(vm); root.append(vm)

E.indent(root)
(OUTD / 'scene.rml').write_text(E.tostring(root, encoding='unicode'))
(OUTD / 'rive.yaml').write_text('name: Liv-Hands\nlogs:\n  file: build/rive.log\n  problems: build/problems.log\n')
(OUTD / '.gitignore').write_text('build/\n')
stats = {k: v['stats'] for k, v in hands.items()}
(OUTD / 'shapes.json').write_text(json.dumps({'shapes': SHAPES, 'stats': stats}, indent=1))
print(json.dumps(stats))
