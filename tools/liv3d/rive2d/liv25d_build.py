# Liv 2.5D · builds the rig in the open Rive file from what liv25d_prep.py prepared.
#   python3 liv25d_build.py WORK            (WORK holds liv25d.json, the pieces and depth_*.npy)
# Needs the Rive editor running with a file open (local MCP endpoint, see rive_call.sh). Makes the artboard "Liv25D".
#
# The rig. Liv's head and upper body were rendered from the 3D model at nine turns (liv25d-export.js), every ten degrees
# from fully turned to one side to fully turned to the other. Each capture gives three pictures of the head (back hair, face, front hair)
# and, for the face, one small overlay per expression; the body is one picture. Every picture is an image mesh on
# a grid of bones. A bone only slides; where it slides to at a turn is where its part of the picture would be if the
# picture were the 3D surface it shows, turned with the head: each bone gets a place in the head's own space
# (fitted, least squares over the weights Rive gave the mesh, to every vertex's true depth from the depth render).
# So a picture is exact at its own capture's turn and stays close for the five degrees to either side that it is
# used for; half way to the next capture that one takes over.
#
# Animations (30 a second unless said):
#   Turn      240 frames, frame = (turn + 1) * 120: face and body bones' x, which capture's face shows
#   HairTurn  the same for the hair's bones and pictures (played a moment behind Turn, the hair lags)
#   Tilt      120 frames, frame = (tilt + 1) * 60: every head bone's y
#   Idle (breathing, loops), FaceHappy (blinks), FaceTalk, FaceSmile, FaceLaugh, FaceSurprised, FaceSad
# Turn, HairTurn and Tilt are not in the state machine: the page sets their time from its turn and tilt values
# (the editor's local endpoint has no way to make a blend state or a joystick). The state machine "Character" runs
# Idle and the faces from the view model Cast2D (face, talking), as the 2D cast does.
import json, base64, math, sys, hashlib, urllib.request
import numpy as np
from PIL import Image
from scipy import ndimage

URL = 'http://127.0.0.1:9791/mcp'; SID = None
WORK = sys.argv[1]; D = json.load(open(f'{WORK}/liv25d.json')); W, H = D['W'], D['H']; AB_NAME = 'Liv25D'
RAD = math.pi / 180; TH, TB, TT = D['turn'] * RAD, D['body'] * RAD, D['tilt'] * RAD; Ps, Ph = D['joints']['spine'], D['joints']['head']
VIEWS = D['views']; BAND = D['band']; FACES = ['happy', 'smile', 'laugh', 'surprised', 'sad']
KH, KB = 5, 4                                     # bones along each side of a head picture, of the body picture
X, Y, OPA, GY, SX, SY, FPS, DUR, LOOP = 90, 91, 18, 14, 16, 17, 56, 57, 59

def rpc(method, params, rid=1):
    global SID
    req = urllib.request.Request(URL, data=json.dumps({'jsonrpc': '2.0', 'id': rid, 'method': method, 'params': params}).encode(),
                                 headers={'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', **({'mcp-session-id': SID} if SID else {})})
    with urllib.request.urlopen(req, timeout=600) as r:
        if not SID: SID = r.headers.get('mcp-session-id')
        body = r.read().decode()
    if body.startswith('event:') or body.startswith('data:'): body = [l[5:] for l in body.splitlines() if l.startswith('data:')][-1]
    return json.loads(body) if body.strip() else {}
def call(tool, args):
    for attempt in range(12):                     # the file drops off its server now and then: wait and ask again
        r = rpc('tools/call', {'name': tool, 'arguments': args}, 7)
        res = r.get('result', {}); txt = ''.join(c.get('text', '') for c in res.get('content', []) if c.get('type') == 'text')
        if 'reconnecting to coop' not in txt: break
        __import__('time').sleep(4)
    if res.get('isError') or not txt.startswith('{'): raise SystemExit(f'{tool} {args.get("command", "")} failed: {txt[:1500]}')
    out = json.loads(txt)
    if isinstance(out.get('content'), str):
        try: out = json.loads(out['content'])
        except ValueError: pass
    if out.get('success') is False or out.get('errors'): raise SystemExit(f'{tool} {args.get("command", "")} error: {json.dumps(out)[:1500]}')
    return out
ae = lambda cmd, data: call('animation_editor', {'command': cmd, 'data': {cmd: data}})
mesh = lambda cmd, data: call('mesh_rigging_tool', {'command': cmd, 'data': {cmd: data}})
rpc('initialize', {'protocolVersion': '2025-11-25', 'capabilities': {}, 'clientInfo': {'name': 'liv25d-build', 'version': '1'}})

# ------------------------------------------------------------------ where a point of the head goes
def head_local(x, y, z, at, hd):
    """A point as a capture shows it (artboard x, y and depth, the capture made at turn `at` with the head joint at hd),
    in the head's own space: from the head joint, with the head straight."""
    t1 = at * TH; cx, cy, cz = x - hd[0], y - hd[1], z - hd[2]
    return cx * np.cos(t1) - cz * np.sin(t1), cy, cx * np.sin(t1) + cz * np.cos(t1)
def head_x(Xk, Yk, Zk, turn, tilt=0.0):
    tb, th, ti = turn * TB, turn * TH, tilt * TT
    return Ps[0] + (Ph[0] - Ps[0]) * math.cos(tb) + (Ph[2] - Ps[2]) * math.sin(tb) + Xk * math.cos(th) + (-Yk * math.sin(ti) + Zk * math.cos(ti)) * math.sin(th)
def head_y(Yk, Zk, tilt): return Ph[1] + Yk * math.cos(tilt * TT) + Zk * math.sin(tilt * TT)
def body_x(Xk, Zk, turn): return Ps[0] + Xk * math.cos(turn * TB) + Zk * math.sin(turn * TB)
# Which capture's pictures show at a turn: each from half way to the capture before to half way to the next, one at
# a time. (Faded into one another over a degree, the two were both there for a moment, a hand's breadth apart at the
# far eye and along the hair: a ghost whenever the head stopped there. Now the picture changes at once; what it
# shows moves by the few pixels the two disagree.)
STEP = D['step']
def shows(at, turn):
    g = np.sign(at); u = turn * g if g else abs(turn); a = abs(at)
    return 1.0 if (u >= a - STEP / 2 or not a) and (u < a + STEP / 2 or a > 0.999) else 0.0

# ------------------------------------------------------------------ artboard
old = [a['id'] for a in call('open_file_editor', {'command': 'listArtboards'})['artboards'] if a['name'] == AB_NAME]
# pictures already in the file are used again when their bytes are the same (--fresh uploads everything anew)
have = {a['name']: a['id'] for a in call('assets_tool', {'command': 'listAssets', 'data': {'listAssets': {'typeFilter': 'image'}}})['assets'] if a['name'].startswith(AB_NAME + ' ')}
SUMS = f'{WORK}/uploaded.json'; sums = json.load(open(SUMS)) if __import__('os').path.exists(SUMS) and '--fresh' not in sys.argv else {}
stale = [i for n, i in have.items() if '--fresh' in sys.argv or n not in sums]
if old or stale: call('delete_objects', {'objectIds': old + stale})
have = {n: i for n, i in have.items() if i not in stale}
AB = call('open_file_editor', {'command': 'createArtboard', 'data': {'createArtboard': [{'name': AB_NAME, 'width': W, 'height': H}]}})['artboards'][0]['id']
call('open_file_editor', {'command': 'focusArtboard', 'data': {'focusArtboard': {'artboardId': AB}}})
fills = [o['id'] for o in call('get_artboard_hierarchy', {'depth': 1})['objects'] if 'Fill' in o['types']]
if fills: call('delete_objects', {'objectIds': fills})
grp = lambda name, parent=None: call('group_editor', {'name': name, 'x': 0, 'y': 0, **({'parentId': parent} if parent else {})})['group']['id']
RIG = grp('Rig'); BODYG = grp('BodyBones', RIG); HEADG = grp('HeadBones', RIG)

# ------------------------------------------------------------------ pictures, in drawing order
pieces = D['pieces']; ov = D['overlays']; img, ovimg, ovgrp, order = {}, {}, {}, []
def upload(name, path):
    raw = open(path, 'rb').read(); key = hashlib.sha1(raw).hexdigest(); full = f'{AB_NAME} {name}'
    if full in have and sums.get(full) == key: return have[full]
    if full in have: call('delete_objects', {'objectIds': [have[full]]})
    sums[full] = key; json.dump(sums, open(SUMS, 'w'))
    up = call('upload_asset', {'file': 'data:image/webp;name=' + name + '.webp;base64,' + base64.b64encode(raw).decode(), 'name': f'{AB_NAME} {name}'})
    aid = up.get('assetId') or up.get('id') or up.get('asset', {}).get('id')
    if not aid or aid == '0-0': raise SystemExit(f'upload of {name} gave no asset: {json.dumps(up)[:300]}')
    return aid
def place(name, crop, parent):
    aid = upload(name, f'{WORK}/{name}.webp')
    inst = call('assets_tool', {'command': 'addImageInstance', 'data': {'addImageInstance': {'assetId': aid, 'name': name, 'parentId': parent, 'x': crop['x'] + crop['w'] / 2, 'y': crop['y'] + crop['h'] / 2}}})
    i = inst.get('imageId') or inst.get('id') or inst.get('image', {}).get('id'); order.append(i)
    if crop.get('scale', 1) != 1: call('set_property_values', {'propertyValues': {i: {SX: 100 / crop['scale'], SY: 100 / crop['scale']}}})
    return i
VORDER = sorted(VIEWS, key=lambda v: abs(VIEWS[v]))            # the straight capture lowest, the full turns on top
for base in ('hairB', 'body', 'face', 'hairF'):
    for v in (['z'] if base == 'body' else VORDER):
        name = f'{v}_{base}'; img[name] = place(name, pieces[name], RIG)
        if base == 'face':                                     # its expressions, in a group that shows with the face
            ovgrp[v] = grp(f'{v}_faces', RIG); order.append(ovgrp[v])
            for f in D['faces'][1:]: ovimg[(v, f)] = place(f'ov_{v}_{f}', ov[f'{v}_{f}'], ovgrp[v]); order.pop()
call('reorder_objects', {'operations': [{'objectId': i, 'order': 'sendToFront'} for i in order]})
print('pictures', len(img), 'overlays', len(ovimg))

# ------------------------------------------------------------------ bones, meshes, weights, and each bone's place
def importance(name, vx, vy, crop):
    """How much a vertex's place matters: where the picture has lines and edges (an eye, the outline, a strand of hair)
    a wrong place shows; in the middle of plain skin or hair it does not."""
    t = np.array(Image.open(f'{WORK}/{name}.png').convert('RGBA')).astype(np.float64); a = t[..., 3] / 255; lum = t[..., :3].mean(-1) / 255 * a
    e = np.hypot(ndimage.sobel(lum, 0), ndimage.sobel(lum, 1)) + np.hypot(ndimage.sobel(a, 0), ndimage.sobel(a, 1))
    e = ndimage.gaussian_filter(e, 7); e /= max(e.max(), 1e-6); am = ndimage.gaussian_filter(a, 4)
    yi = np.clip(np.round(vy - crop['y']).astype(int), 0, crop['h'] - 1); xi = np.clip(np.round(vx - crop['x']).astype(int), 0, crop['w'] - 1)
    # (outside the picture, where the depth is the nearest edge's, still a little: left free, the mesh's rim folded in over the cheek)
    return np.where(am[yi, xi] > 0.05, 0.25 + 3.0 * e[yi, xi], 0.15)
bones, fit, report = {}, {}, []
for name, p in pieces.items():
    K = KB if p['group'] == 'body' else KH; spec = []
    for r in range(K):
        for c in range(K):
            bx, by = p['x'] + p['w'] * (c + 0.5) / K, p['y'] + p['h'] * (r + 0.5) / K
            spec.append({'name': f'{name}_{r}{c}', 'head': {'x': bx, 'y': by - 5}, 'tail': {'x': bx, 'y': by + 5}})
    made = call('create_bones', {'artboardId': AB, 'bones': spec})['bones']; ids = [b['id'] for b in made]
    call('reparent_objects', {'operations': [{'objectId': b, 'newParentId': BODYG if p['group'] == 'body' else HEADG} for b in ids]})
    # (moved into a group a bone lands on the group's origin: put each back where it was made)
    call('set_property_values', {'propertyValues': {b['id']: {X: b['head']['x'], Y: b['head']['y'], 15: 90} for b in made}})
    targets = [img[name]] + ([ovimg[(p['view'], f)] for f in D['faces'][1:]] if name.endswith('_face') else [])
    # the picture's mesh 9 x 9 points, an expression's 5 x 5 (every point costs about 50 bytes of the file)
    meshes = [mesh('generateMesh', {'imageId': t, 'subdivisions': 3 if n == 0 else 2, 'trace': False})['meshId'] for n, t in enumerate(targets)]
    for m in meshes: mesh('bindBones', {'targetId': m, 'boneIds': ids})
    mesh('autoWeight', {'targetIds': meshes, 'blend': 1.0, 'maxInfluences': 4, 'smooth': True})
    q = mesh('querySkin', {'targetId': meshes[0], 'includeVertexWeights': True})['vertexWeights']
    Wm = np.array([[v['weights'].get(b, 0.0) for b in ids] for v in q])
    sc = 1 / p.get('scale', 1); vx = np.array([v['x'] for v in q]) * sc + p['x'] + p['w'] / 2; vy = np.array([v['y'] for v in q]) * sc + p['y'] + p['h'] / 2
    Z = np.load(f'{WORK}/depth_{name}.npy'); vz = Z[np.clip(np.round(vy).astype(int), 0, H - 1), np.clip(np.round(vx).astype(int), 0, W - 1)].astype(np.float64)
    if p['group'] == 'body': tx, ty, tz = vx - Ps[0], vy, vz - Ps[2]
    else: tx, ty, tz = head_local(vx, vy, vz, p['at'], p['head'])
    imp = importance(name, vx, vy, p)[:, None]; A = Wm * imp
    sol = [np.linalg.lstsq(np.vstack([A, 0.02 * np.eye(len(ids))]), np.concatenate([t * imp[:, 0], 0.02 * (Wm.T @ t) / np.maximum(Wm.sum(0), 1e-6)]), rcond=None)[0] for t in (tx, ty, tz)]
    err = Wm @ sol[2] - tz; inside = imp[:, 0] > 0.2
    report.append(f"{name}: depth fit rms {np.sqrt((err[inside] ** 2).mean()):.1f} px, weighted rms {np.sqrt(((err * imp[:, 0]) ** 2).sum() / (imp[:, 0] ** 2).sum()):.1f}")
    bones[name] = ids; fit[name] = {'X': sol[0].tolist(), 'Y': sol[1].tolist(), 'Z': sol[2].tolist(), 'rest': [[b['head']['x'], b['head']['y'] + 5] for b in made]}
    # the bones' own x and y as the editor holds them (in their group), to key from
    vals = call('query_property_values', {'propertyKeys': {b: [X, Y] for b in ids}})['values']
    fit[name]['xy'] = [[float(vals[b][str(X)]), float(vals[b][str(Y)])] for b in ids]
print('\n'.join(report)); json.dump({'fit': fit, 'bones': bones}, open(f'{WORK}/fit.json', 'w'))

# ------------------------------------------------------------------ animations
def thin(vals, tol):
    keep = {0, len(vals) - 1}; stack = [(0, len(vals) - 1)]
    while stack:
        a, b = stack.pop(); worst, at = tol, None
        for i in range(a + 1, b):
            d = abs(vals[i] - (vals[a] + (vals[b] - vals[a]) * (i - a) / (b - a)))
            if d > worst: worst, at = d, i
        if at is not None: keep.add(at); stack += [(a, at), (at, b)]
    return sorted(keep)
key = lambda oid, pk, f, v, hold=False: {'objectId': oid, 'propertyKey': pk, 'frame': f, 'value': round(float(v), 3), 'interpolationType': 'hold' if hold else 'linear'}
NT, NL = 240, 120; turn_of = lambda f: f / (NT / 2) - 1; tilt_of = lambda f: f / (NL / 2) - 1
K_turn, K_hair, K_tilt = [], [], []
for name, p in pieces.items():
    F = fit[name]; into = K_hair if p['group'] == 'hair' else K_turn
    for k, b in enumerate(bones[name]):
        x0, y0 = F['xy'][k]
        if p['group'] == 'body': xs = [x0 + body_x(F['X'][k], F['Z'][k], turn_of(f)) - body_x(F['X'][k], F['Z'][k], 0) for f in range(NT + 1)]
        else:
            # only at the turns at which this capture shows; held before and after
            lo, hi = p['at'] - STEP / 2 - 0.02, p['at'] + STEP / 2 + 0.02; cap = lambda t: max(lo, min(hi, t))
            xs = [x0 + head_x(F['X'][k], F['Y'][k], F['Z'][k], cap(turn_of(f))) - head_x(F['X'][k], F['Y'][k], F['Z'][k], p['at']) for f in range(NT + 1)]
            ys = [y0 + head_y(F['Y'][k], F['Z'][k], tilt_of(f)) - head_y(F['Y'][k], F['Z'][k], 0) for f in range(NL + 1)]
            K_tilt += [key(b, Y, f, ys[f]) for f in thin(ys, 0.25)]
        into += [key(b, X, f, xs[f]) for f in thin(xs, 0.25)]
    if p['group'] != 'body':
        op = [100 * shows(p['at'], turn_of(f)) for f in range(NT + 1)]
        for target in [img[name]] + ([ovgrp[p['view']]] if name.endswith('_face') else []): into += [key(target, OPA, f, op[f], True) for f in range(NT + 1) if f == 0 or op[f] != op[f - 1]]
# breathing: the head rides up a little and back, the chest a little less
idle = [key(HEADG, GY, f, v) for f, v in ((0, 0), (45, -2.4), (90, 0))] + [key(BODYG, GY, f, v) for f, v in ((0, 0), (45, -1.0), (90, 0))]
# faces: one overlay of every capture's face shows (or none: her resting face); the capture's group lets its own through
def face(name, f=0): return [key(i, OPA, f, 100 if fc == name else 0, True) for (v, fc), i in ovimg.items()]
A = {'Turn': (K_turn, NT, 0), 'HairTurn': (K_hair, NT, 0), 'Tilt': (K_tilt, NL, 0), 'Idle': (idle, 90, 1),
     'FaceHappy': (face('happy') + face('blink', 66) + face('happy', 70) + face('blink', 102) + face('happy', 106), 120, 1),
     'FaceTalk': (face('talk') + face('happy', 4) + face('talk', 7) + face('happy', 12), 16, 1),
     **{'Face' + f.capitalize(): (face(f), 1, 0) for f in FACES[1:]}}
anims = {a['name']: a['id'] for a in ae('listLinearAnimations', {})['linearAnimations']}
ae('renameAnimations', {'animations': [{'animationId': next(iter(anims.values())), 'name': 'Idle'}]})
ae('createLinearAnimations', {'linearAnimations': [{'name': n, 'duration': 1} for n in A if n != 'Idle']})
anims = {a['name']: a['id'] for a in ae('listLinearAnimations', {})['linearAnimations']}
for n, (keys, dur, loop) in A.items():
    keys = list({(k['objectId'], k['propertyKey'], k['frame']): k for k in keys}.values())
    for i in range(0, len(keys), 5000): ae('modifyKeyFrames', {'animationId': anims[n], 'add': keys[i:i + 5000]})
    print(n, len(keys), 'keys')
call('set_property_values', {'propertyValues': {anims[n]: {FPS: 30, DUR: dur, LOOP: loop} for n, (_, dur, loop) in A.items()}})
for i in ovimg.values(): call('set_property_values', {'propertyValues': {i: {OPA: 0}}})

# ------------------------------------------------------------------ view model and state machine (the cast's)
vm = next((v for v in call('viewmodel_editor', {'command': 'listViewModels'})['viewModels'] if v['name'] == 'Cast2D'), None)
if not vm: raise SystemExit('the file has no view model Cast2D (it is made by rive_build.py)')
P = {p['name']: p['id'] for p in vm['viewModelProperties']}
call('viewmodel_editor', {'command': 'bindViewModelToArtboard', 'data': {'bindViewModelToArtboard': {'artboardId': AB, 'viewModelId': vm['id']}}})
sm = ae('queryStateMachine', {}); SM = sm['stateMachineId']; L0 = sm['layers'][0]
call('rename_objects', {'renames': [{'id': SM, 'name': 'Character'}, {'id': L0['layerId'], 'name': 'Body'}]})
FACE = ['Happy', 'Talk'] + [f.capitalize() for f in FACES[1:]]
ae('createStateMachineLayers', {'stateMachineId': SM, 'layers': [{'name': 'Face', 'states': [{'name': f, 'linearAnimationName': 'Face' + f, 'x': 160 + 140 * i, 'y': 0} for i, f in enumerate(FACE)]}]})
sm = ae('queryStateMachine', {'stateMachineId': SM})
st = {(L['layerName'], s['name']): s['id'] for L in sm['layers'] for s in L['states'] if s['name']}
entry = next(s['id'] for L in sm['layers'] if L['layerName'] == 'Face' for s in L['states'] if s['type'] == 'entry')
spec = {entry: [{'to': st[('Face', 'Happy')]}]}
for a in FACE:
    for b in FACE:
        if a != b: spec.setdefault(st[('Face', a)], []).append({'to': st[('Face', b)]})
ae('createTransitions', {'states': [{'id': k, 'transitions': v} for k, v in spec.items()]})
sm = ae('queryStateMachine', {'stateMachineId': SM})
names = {s['id']: (s['name'] or s['type']) for L in sm['layers'] for s in L['states']}
T = {(names[t['fromStateId']], names[t['toStateId']]): t['id'] for L in sm['layers'] if L['layerName'] == 'Face' for t in L.get('transitions', [])}
eq = lambda pid, v: {'leftComparator': {'viewModelPropertyId': pid}, 'operation': 'equal', 'rightComparator': {'value': v, 'valueType': 'constantValueType'}}
on = lambda f: [eq(P['talking'], True)] if f == 'Talk' else [eq(P['talking'], False), eq(P['face'], f.lower())]
ae('createConditions', {'transitions': [{'id': T[(a, b)], 'conditions': on(b)} for a in FACE for b in FACE if a != b]})
print(AB_NAME, 'built: artboard', AB, 'bones', sum(len(b) for b in bones.values()))
