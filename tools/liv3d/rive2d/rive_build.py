# Build one view of a 2D character in the open Rive file, through the Rive editor's local MCP endpoint.
#   python3 rive_build.py PREP.json ARTBOARD_NAME
# PREP.json comes from rive_prep.py (layers next to it in a folder of the same name, joints, motions). Re-runnable:
# an artboard of the same name and its images are replaced. About three minutes a view.
#
# In the artboard:
#   Flip (group; mirrored for facing left)
#     the images, stacked back to front, each meshed and skinned
#     Body (group; moved by the recorded hip offset: walking bob, jumps)
#       bones: pelvis, torso > head, torso > upper arm > forearm > hand, thigh > lower leg > foot
#   Skin: the body (pelvis, torso, the heads) is one blended surface, so waist and neck bend smoothly; a long skirt
#   or an apron also follows the thighs, through two skirt bones (it drapes over the knees when sitting). Limb pieces are
#   rigid, one bone each, overlapping like a cut-out puppet with the layer in front covering the joint (sleeve over
#   the forearm, pelvis or skirt over the thighs, trouser leg over the shin). Blending across the elbow, the wrist,
#   the shoulder or the hip was tried and dropped: a raised arm drew stretched flaps, a hand folded over or was left
#   behind next to the torso bone, and a blended thigh threw a spike.
#   Hands drawn in an action's pose (open palm for wave and cheer, pointing finger, hand at the chin) sit on the hand
#   bone and replace the resting hand while that action holds.
#   Animations (bone keys every frame, 30 fps): Idle, Walk, Run (loops); Wave, Point, Cheer, Think, Pull, Clap (once
#   each); SitDown > Sitting (loop) > StandUp; PickUp > Holding (loop) > PutDown (pick up backwards);
#   faces: Happy (blinks), Talk (mouth moves, blinks), Smile, Laugh, Surprised, Sad; FaceRight / FaceLeft (mirror).
#   View model Cast2D: walking, running, sitting, holding, talking, facingLeft (booleans); face (enum Face: happy,
#   smile, laugh, surprised, sad); wave, point, cheer, think, pull, clap (triggers). State machine "Character": layers Body, Face, Facing.
import base64, json, math, os, sys, time, urllib.request
T0 = time.time(); tick = lambda what: print(f'{ABNAME} {what} {time.time() - T0:.0f}s', flush=True)

URL = 'http://127.0.0.1:9791/mcp'
prep_path, ABNAME = sys.argv[1], sys.argv[2]
D = json.load(open(prep_path)); IMGDIR = prep_path[:-5]; W, H, K = D['W'], D['H'], D['k']; J = D['joints']
ACTS = [a for a in ('wave', 'point', 'cheer', 'think', 'pull', 'clap') if a in D['anims']]
SEQ = {'sitdown': 'SitDown', 'sitting': 'Sitting', 'standup': 'StandUp', 'pickup': 'PickUp', 'holding': 'Holding', 'putdown': 'PutDown'}
SEQ = {k: v for k, v in SEQ.items() if k in D['anims']}
GAITS = [g for g in ('Walk', 'Run') if g.lower() in D['anims']]
FACES = ['happy', 'smile', 'laugh', 'surprised', 'sad']
SID = None; LOG = {}

def rpc(method, params, rid=1):
    global SID
    req = urllib.request.Request(URL, data=json.dumps({'jsonrpc': '2.0', 'id': rid, 'method': method, 'params': params}).encode(),
                                 headers={'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', **({'mcp-session-id': SID} if SID else {})})
    with urllib.request.urlopen(req, timeout=600) as r:
        if not SID: SID = r.headers.get('mcp-session-id')
        body = r.read().decode()
    if body.startswith('event:') or body.startswith('data:'):
        body = [l[5:] for l in body.splitlines() if l.startswith('data:')][-1]
    return json.loads(body) if body.strip() else {}

def call(tool, args, quiet=True):
    r = rpc('tools/call', {'name': tool, 'arguments': args}, 7)
    res = r.get('result', {}); txt = ''.join(c.get('text', '') for c in res.get('content', []) if c.get('type') == 'text')
    if res.get('isError') or not txt.startswith('{'):
        raise SystemExit(f'{tool} {args.get("command", "")} failed: {txt[:1500]}')
    out = json.loads(txt)
    if isinstance(out.get('content'), str):
        try: out = json.loads(out['content'])
        except ValueError: pass
    if out.get('success') is False or out.get('errors'):
        raise SystemExit(f'{tool} {args.get("command", "")} error: {json.dumps(out)[:1500]}')
    if not quiet: print(tool, args.get('command', ''), json.dumps(out)[:160])
    return out
ae = lambda cmd, data: call('animation_editor', {'command': cmd, 'data': {cmd: data}})

rpc('initialize', {'protocolVersion': '2025-11-25', 'capabilities': {}, 'clientInfo': {'name': 'rive-build', 'version': '1'}})

# ------------------------------------------------------------------ artboard
old = [a['id'] for a in call('open_file_editor', {'command': 'listArtboards'})['artboards'] if a['name'] == ABNAME]
olda = [a['id'] for a in call('assets_tool', {'command': 'listAssets', 'data': {'listAssets': {'typeFilter': 'image'}}})['assets'] if a['name'].startswith(ABNAME + ' ')]
if old or olda: call('delete_objects', {'objectIds': old + olda})
ab = call('open_file_editor', {'command': 'createArtboard', 'data': {'createArtboard': [{'name': ABNAME, 'width': W, 'height': H}]}})
AB = ab['artboards'][0]['id']; LOG['artboard'] = AB
call('open_file_editor', {'command': 'focusArtboard', 'data': {'focusArtboard': {'artboardId': AB}}})
fills = [o['id'] for o in call('get_artboard_hierarchy', {'depth': 1})['objects'] if 'Fill' in o['types']]
if fills: call('delete_objects', {'objectIds': fills})                             # transparent background

# ------------------------------------------------------------------ images
flip = call('group_editor', {'name': 'Flip', 'x': 0, 'y': 0})['group']['id']; LOG['flip'] = flip
img, uploaded = {}, {}
import hashlib
for p in D['order']:
    raw = open(f'{IMGDIR}/{p}.webp', 'rb').read(); key = hashlib.sha1(raw).hexdigest()
    if key in uploaded: aid = uploaded[key]      # identical pictures (a face the model cannot make looks like another):
    else:                                         # the editor answers a second upload of the same bytes with no asset
        data = base64.b64encode(raw).decode()
        up = call('upload_asset', {'file': f'data:image/webp;name={ABNAME.replace(" ", "_")}_{p}.webp;base64,{data}', 'name': f'{ABNAME} {p}'})
        aid = up.get('assetId') or up.get('id') or up.get('asset', {}).get('id')
        if not aid or aid == '0-0': raise SystemExit(f'upload of {p} gave no asset: {json.dumps(up)[:300]}')
        uploaded[key] = aid
    c = D['crops'][p]
    inst = call('assets_tool', {'command': 'addImageInstance', 'data': {'addImageInstance': {'assetId': aid, 'name': p, 'parentId': flip, 'x': c['x'], 'y': c['y']}}})
    img[p] = inst.get('imageId') or inst.get('id') or inst.get('image', {}).get('id')
LOG['images'] = img
call('reorder_objects', {'operations': [{'objectId': img[p], 'order': 'sendToFront'} for p in D['order']]})   # Rive draws the first child in front
print(ABNAME, 'images', len(img))

tick('images')
# ------------------------------------------------------------------ bones
_hk = lambda s: (J['hipL'][1] + J['hipR'][1]) / 2 if s == 'hip' else (J['knL'][1] + J['knR'][1]) / 2
LONG = ('ulegL' not in D['order'] and 'ulegR' not in D['order']) or \
       D['crops']['pelvis']['y'] + D['crops']['pelvis']['h'] / 2 > _hk('kn')       # or a garment on the hips hanging past the knees (an apron)
B = [('pelvis', 'hips', 'midhip', None), ('torso', 'hips', 'neck', None), ('head', 'neck', 'top', 'torso'),
     ('uarmR', 'shR', 'elR', None), ('larmR', 'elR', 'wrR', 'uarmR'), ('handR', 'wrR', 'fiR', 'larmR'),
     ('uarmL', 'shL', 'elL', None), ('larmL', 'elL', 'wrL', 'uarmL'), ('handL', 'wrL', 'fiL', 'larmL'),
     ('ulegR', 'hipR', 'knR', None), ('llegR', 'knR', 'anR', 'ulegR'), ('footR', 'anR', 'toR', 'llegR'),
     ('ulegL', 'hipL', 'knL', None), ('llegL', 'knL', 'anL', 'ulegL'), ('footL', 'anL', 'toL', 'llegL')]
# a long skirt or apron hangs from two bones of its own at the hips: they follow the thighs together but only a third as
# far apart, so the skirt sways in a walk instead of being pulled into a narrow tube between the legs
# and each has a lower bone from the knee to the hem that hangs (nearly) straight down whatever the upper one does:
# seated, the skirt lies on the lap and falls from the knees instead of sticking out as one flat board
if LONG:
    _hem = D['crops']['pelvis']['y'] + D['crops']['pelvis']['h'] / 2
    for s_ in 'RL': J['hem' + s_] = [J['kn' + s_][0], max(_hem, J['kn' + s_][1] + 20 * K)]
    if D.get('seat'): J['seat'] = D['seat']     # the back of the seat (rive_prep: a long skirt in the three-quarter view): see channels
    B += [('skirtR', 'hipR', 'knR', None), ('skirtL', 'hipL', 'knL', None), ('hemR', 'knR', 'hemR', 'skirtR'), ('hemL', 'knL', 'hemL', 'skirtL')]
# Foreshortening. A limb that points partly at the camera is shorter in the picture; a cut-out piece keeps its full
# length, so it ran on past its joint (a forearm sticking out beyond the hand, a thigh beyond the knee). The upper
# arms, forearms and thighs are therefore drawn on a bone of their own inside the joint's bone, and that bone is
# scaled along its length to the length the 3D limb has in the picture. Scaling the joint's bone itself would also
# scale and shear everything hanging from it.
# (From the front and from behind the calves as well: running, a heel kicked up points the calf at the camera, a fifth
# of its length in the picture, and drawn at its full length it stuck out sideways past its own foot.)
FB = abs(math.sin(D['view'])) < 0.3          # front or back view: in idle and walk the arms swing toward the camera
SKIN = [f'{p}{s}' for s in 'RL' for p in ('uarm', 'larm', 'uleg') + (('lleg',) if FB else ())]
B += [(n + '_s', s_, e_, None) for n, s_, e_, _ in list(B) if n in SKIN]
# a front apron over trousers (A02), as against a skirt that goes all round the legs
APRON = LONG and 'ulegR' in D['order']
idx = {b[0]: i for i, b in enumerate(B)}; spec = []
for name, s, e, par in B:
    o = {'name': name, 'tail': {'x': J[e][0], 'y': J[e][1]}}
    if par: o['parentIndex'] = idx[par]
    else: o['head'] = {'x': J[s][0], 'y': J[s][1]}
    spec.append(o)
bones = {b['name']: b['id'] for b in call('create_bones', {'artboardId': AB, 'bones': spec})['bones']}; LOG['bones'] = bones
body = call('group_editor', {'name': 'Body', 'parentId': flip, 'x': 0, 'y': 0})['group']['id']; LOG['body'] = body
call('reparent_objects', {'operations': [{'objectId': bones[b], 'newParentId': body} for b in ('pelvis', 'torso', 'ulegR', 'ulegL') + (('skirtR', 'skirtL') if LONG else ())] +
                                        [{'objectId': bones[b], 'newParentId': bones['torso']} for b in ('uarmR', 'uarmL')] +
                                        [{'objectId': bones[n + '_s'], 'newParentId': bones[n]} for n in SKIN]})
call('set_property_values', {'propertyValues': {bones[n + '_s']: {90: 0, 91: 0, 15: 0} for n in SKIN}})     # on the joint's bone, along it

tick('bones')
# ------------------------------------------------------------------ meshes and weights
# The blended body pieces get a mesh traced to the picture's outline. A rigid limb piece gets a plain rectangle: it never
# bends, and tracing keeps only one island of a picture (a forearm drawn as a sleeve cuff and the skin below it lost
# its skin and the hand floated).
BLENDED = {'pelvis', 'torso'} | {p for p in D['order'] if p.startswith('head_')}
# Every piece gets a plain rectangle mesh (its transparent pixels just do not show): traced to the outline, a mesh
# could come out with a hole (a laughing face showed the background through a patch over the eyes). The blended
# pieces (body, long skirt) get it subdivided into a fine grid: sparse, long triangles reached from the waist to the
# shoulders, and in a deep bend one with a corner on the hips and two on the shoulders stretched into a thin sliver.
mesh = {p: call('mesh_rigging_tool', {'command': 'generateMesh', 'data': {'generateMesh': {'imageId': img[p], 'subdivisions': 4 if p == 'pelvis_bow' else 3 if p in ('pelvis', 'torso', 'pelvis_bow', 'waist_bow') else 1,
        'trace': False}}})['meshId'] for p in D['order']}
heads = [p for p in D['order'] if p.startswith('head_')]
swaps = [p for p in D['order'] if '_' in p and not p.startswith('head_')]             # posed parts, e.g. handR_wave, larmL_clap
# a long skirt (no thigh is ever seen under it) or an apron hanging past the knees follows the thighs through its two
# skirt bones, so it drapes forward over the knees when she sits or crouches and sways a little when she walks; it is
# one picture, so it bends and never splits
# The heads are rigid on the head bone and the body does not follow the head: weighted partly to it, a few points of
# the collar or a shoulder were dragged out into a long thin spike when she bent down to pick something up.
# A long skirt's pictures for the bow (rive_prep, three-quarter view; shown instead of the skirt's while she bows to
# pick something up): the waistband bends between the hips and the body as the body's own picture does; the skirt
# cut off above the hips hangs from the hips and the skirt's bones on a finer mesh with a wide blend between them,
# so its back curves from the seat to the hem (rigid on its bones it met the waistband in a corner: a boxy seat).
BOW = [p for p in D['order'] if p.endswith('_bow')]
CORE = ([(['torso'], ['pelvis', 'torso']), (['pelvis'], ['pelvis', 'torso', 'skirtL', 'skirtR', 'hemL', 'hemR'])] if LONG else [(['pelvis', 'torso'], ['pelvis', 'torso'])]) + \
       ([(['waist_bow'], ['pelvis', 'torso']), (['pelvis_bow'], ['pelvis', 'skirtL', 'skirtR', 'hemL', 'hemR'])] if BOW else []) + \
       [([h], ['head']) for h in heads]
CHAINS = CORE + \
         [([f'{p}{s}'], [f'{p}{s}' + ('_s' if f'{p}{s}' in SKIN else '')]) for s in 'RL' for p in ('uarm', 'larm', 'hand', 'uleg', 'lleg', 'foot')] + \
         [([p], [p.split('_')[0] + ('_s' if p.endswith('_sit') else '')]) for p in swaps if p not in BOW] + [(['apron'], ['pelvis'])]     # a part drawn in a pose is already as short as it looks: on the joint's bone
# (a thigh's second drawing for sitting, seen from behind (rive_prep), is the thigh again: on its scaled bone)
CHAINS = [([p for p in parts if p in mesh], bn) for parts, bn in CHAINS]   # layers that are empty (thighs under a long skirt) were left out
CHAINS = [(parts, bn) for parts, bn in CHAINS if parts]
for parts, bn in CHAINS:
    for p in parts: call('mesh_rigging_tool', {'command': 'bindBones', 'data': {'bindBones': {'targetId': mesh[p], 'boneIds': [bones[b] for b in bn]}}})
    if len(bn) > 1: call('mesh_rigging_tool', {'command': 'autoWeight', 'data': {'autoWeight': {'targetIds': [mesh[p] for p in parts], 'blend': 0.7 if parts == ['pelvis_bow'] else 0.3,
                                                                                                 'maxInfluences': 4 if parts == ['pelvis_bow'] else 3}}})   # narrower: the hips pull on the body only near the waist
LOG['meshes'] = mesh

tick('meshes')
# ------------------------------------------------------------------ bone channels from the recorded joints
X, Y, R, LEN, GX, GY, SX, OPA = 90, 91, 15, 89, 13, 14, 16, 18
ang = lambda j, a, b: math.degrees(math.atan2(j[b][1] - j[a][1], j[b][0] - j[a][0]))
dist = lambda j, a, b: math.hypot(j[b][0] - j[a][0], j[b][1] - j[a][1])
def rot(p, deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg)); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]
head_rest = ang(J, 'neck', 'top') - ang(J, 'hips', 'neck'); head_rel0 = ang(J, 'neck', 'head') - ang(J, 'hips', 'neck')
# scale of a limb's picture, per cent. Not below 0.45 (a forearm 0.3: kept longer, it ran on over the hand)
# (the front and back clap: 0.72. There the forearm only swings through the camera's direction for a moment on its way
# down, outside the frames drawn in the pose, and squeezed to a third a long sleeve's cuff was a pale stripe.)
# (a calf 0.25: it is only that short for a few frames of a run, in front of or behind its own thigh)
LIM = {'el': 0.3, 'kn': 0.25}
fore = lambda j, a, b: 100 * max(LIM.get(a[:2], 0.45), min(1.15, dist(j, a, b) / max(1e-3, dist(J, a, b))))
def channels(j, steady=False, drape=False, gait=False, bow=False):
    out = {}; off = [j['hips'][0] - J['hips'][0], j['hips'][1] - J['hips'][1]]
    out[(body, GX)], out[(body, GY)] = off
    out[(bones['pelvis'], R)] = ang(j, 'hips', 'midhip')
    gt = ang(j, 'hips', 'neck'); out[(bones['torso'], R)] = gt; out[(bones['torso'], LEN)] = dist(j, 'hips', 'neck')
    # the head turns as the 3D head does (its own up direction); the line from the neck to the head, used before,
    # tips over further in a bow than the head is tipped
    if 'hup' in j and 'hup' in J: out[(bones['head'], R)] = ang(J, 'neck', 'top') + (ang(j, 'head', 'hup') - ang(J, 'head', 'hup')) - gt
    else: out[(bones['head'], R)] = head_rest + (ang(j, 'neck', 'head') - gt) - head_rel0
    for s in 'RL':
        lp = rot([j['sh' + s][0] - j['hips'][0], j['sh' + s][1] - j['hips'][1]], -gt)
        u, l, h = ang(j, 'sh' + s, 'el' + s), ang(j, 'el' + s, 'wr' + s), ang(j, 'wr' + s, 'fi' + s)
        Lj = J if steady == 'full' else j         # steady: the arm keeps its rest lengths (a walk seen from the front)
        if steady: h = l + (ang(J, 'wr' + s, 'fi' + s) - ang(J, 'el' + s, 'wr' + s))   # and the hand stays in line
        b = bones['uarm' + s]; out[(b, X)], out[(b, Y)] = lp; out[(b, R)] = u - gt; out[(b, LEN)] = dist(Lj, 'sh' + s, 'el' + s)
        out[(bones[f'uarm{s}_s'], SX)] = fore(Lj, 'sh' + s, 'el' + s); out[(bones[f'larm{s}_s'], SX)] = fore(Lj, 'el' + s, 'wr' + s)
        b = bones['larm' + s]; out[(b, R)] = l - u; out[(b, LEN)] = dist(Lj, 'el' + s, 'wr' + s)
        b = bones['hand' + s]; out[(b, R)] = h - l; out[(b, LEN)] = dist(Lj, 'wr' + s, 'fi' + s)
        ul, ll, ft = ang(j, 'hip' + s, 'kn' + s), ang(j, 'kn' + s, 'an' + s), ang(j, 'an' + s, 'to' + s)
        b = bones['uleg' + s]; out[(b, X)] = j['hip' + s][0] - off[0]; out[(b, Y)] = j['hip' + s][1] - off[1]; out[(b, R)] = ul; out[(b, LEN)] = dist(j, 'hip' + s, 'kn' + s)
        out[(bones[f'uleg{s}_s'], SX)] = fore(j, 'hip' + s, 'kn' + s)
        b = bones['lleg' + s]; out[(b, R)] = ll - ul; out[(b, LEN)] = dist(j, 'kn' + s, 'an' + s)
        if f'lleg{s}_s' in bones: out[(bones[f'lleg{s}_s'], SX)] = fore(j, 'kn' + s, 'an' + s)
        b = bones['foot' + s]; out[(b, R)] = ft - ll; out[(b, LEN)] = dist(j, 'an' + s, 'to' + s)
        if drape: drape_leg(out, j, s)
    if LONG:
        a0 = {s: ang(J, 'hip' + s, 'kn' + s) for s in 'RL'}
        dv = {s: (out[(bones['uleg' + s], R)] - a0[s] + 180) % 360 - 180 for s in 'RL'}; avg = (dv['R'] + dv['L']) / 2
        if gait: avg = max(-8.0, min(8.0, avg))    # running, the legs' average swing sheared the skirt into a wedge
        # An apron hangs from the waist in front of the legs; the thighs only push it forward as far as they come out
        # in front of that. In a bow the body leans over the knees and the apron hangs nearly straight down from the
        # waist (following the thighs all the way, as a skirt must, it stood out forward like a board); seated, the
        # body is upright and it lies on the lap as before.
        if APRON and not drape:
            dg = (gt - ang(J, 'hips', 'neck') + 180) % 360 - 180
            if avg * dg < 0: avg = math.copysign(max(0.0, abs(avg) - 0.8 * abs(dg)), avg)
        for s in 'RL':
            b = bones['skirt' + s]; out[(b, X)] = out[(bones['uleg' + s], X)]; out[(b, Y)] = out[(bones['uleg' + s], Y)]
            out[(b, R)] = a0[s] + avg + 0.35 * (dv[s] - avg); out[(b, SX)] = out[(bones[f'uleg{s}_s'], SX)] if drape else 100.0
            # In the bow to pick something up (bow; a long skirt in the three-quarter view) the skirt turns on the
            # back of the seat instead, a point that goes with the hips, and reaches from there to where its knee
            # end would be, longer or shorter as needed: turning on the hip joints, further forward, its back edge
            # sank away under the waistband and left the seat standing out behind. As far as the body leans over
            # (lean): upright it turns on the hip joints, as it does in every other motion.
            if bow:
                lean = max(0.0, min(1.0, (abs((gt - ang(J, 'hips', 'neck') + 180) % 360 - 180) - 12) / 25))
                hip0, hip = J['hip' + s], [out[(b, X)], out[(b, Y)]]; L0 = dist(J, 'hip' + s, 'kn' + s); a_ = math.radians(out[(b, R)])
                # where the skirt's knee end goes: as far from the hips as the knees are in the picture (both together).
                # In this view the thighs of a deep bow point partly at the camera; at their full length the
                # skirt's knees were a hand's breadth in front of hers, and below them the skirt hung so far
                # forward that the far calf stood out behind it.
                L0 *= min(1.0, sum(dist(j, 'hip' + q, 'kn' + q) / max(1.0, dist(J, 'hip' + q, 'kn' + q)) for q in 'RL') / 2)
                kn = [hip[0] + L0 * math.cos(a_), hip[1] + L0 * math.sin(a_)]
                st = rot([J['seat'][0] - J['hips'][0], J['seat'][1] - J['hips'][1]], out[(bones['pelvis'], R)] - ang(J, 'hips', 'midhip'))
                st = [J['hips'][0] + st[0], J['hips'][1] + st[1]]                                            # the seat now
                q0 = [hip0[0] + lean * (J['seat'][0] - hip0[0]), hip0[1] + lean * (J['seat'][1] - hip0[1])]  # the point it turns on, at rest
                q = [hip[0] + lean * (st[0] - hip[0]), hip[1] + lean * (st[1] - hip[1])]                     # and now
                k0 = [J['kn' + s][0] - q0[0], J['kn' + s][1] - q0[1]]; k1 = [kn[0] - q[0], kn[1] - q[1]]
                th = math.degrees(math.atan2(k1[1], k1[0]) - math.atan2(k0[1], k0[0])); head = rot([hip0[0] - q0[0], hip0[1] - q0[1]], th)
                out[(b, X)], out[(b, Y)] = q[0] + head[0], q[1] + head[1]; out[(b, R)] = a0[s] + th; out[(b, SX)] = 100 * math.hypot(*k1) / max(1.0, math.hypot(*k0))
            # below the knees the skirt lies along the shins (both together, each a little on its own), as cloth
            # draped over the legs does: hanging straight down instead, it left the calves standing out behind it
            # when she bowed with her hips back. Walking and running it only leans a little.
            sv = {q: (ang(j, 'kn' + q, 'an' + q) - ang(J, 'kn' + q, 'an' + q) + 180) % 360 - 180 for q in 'RL'}; sav = (sv['R'] + sv['L']) / 2
            if gait: sav = max(-8.0, min(8.0, sav))
            h0 = ang(J, 'kn' + s, 'hem' + s); want = h0 + sav + (0.0 if gait else 0.35 * max(-40.0, min(40.0, sv[s] - sav)))
            out[(bones['hem' + s], R)] = (h0 - a0[s]) if drape else want - out[(b, R)]
    return out
# drape: front and back views while sitting, squatting to pick something up and standing up again. Following the
# recorded thighs, which there point at the camera or out to the sides, a long skirt swung out into a flat disc,
# shorts became a flat bar, and the scaled thigh sheared the lower legs into a narrow X. Instead the thighs hang as
# at rest and get shorter (a foreshortened thigh): a long skirt keeps its shape and only gets shorter, its hem a little
# above where it hangs when she stands; shorts and trousers end at the knee. The lower leg runs from that knee to the
# recorded ankle.
HEM = (D['crops']['pelvis']['y'] + D['crops']['pelvis']['h'] / 2) if LONG else 0
def drape_leg(out, j, s):
    hip0, hip = J['hip' + s], j['hip' + s]; drop = hip[1] - hip0[1]
    a0 = ang(J, 'hip' + s, 'kn' + s); u = (math.cos(math.radians(a0)), math.sin(math.radians(a0)))
    kd = max(10.0, (j['kn' + s][0] - hip[0]) * u[0] + (j['kn' + s][1] - hip[1]) * u[1])     # knee depth along the hanging thigh
    if LONG: sc = (HEM - 0.08 * max(0, drop) - hip[1]) / max(1, HEM - hip0[1])
    else: sc = kd / max(1, dist(J, 'hip' + s, 'kn' + s))
    sc = max(0.5, min(1.0, sc))                   # squeezed further, shorts were a ragged strip
    # Seen from behind, the calf is cut off along the thigh's lower edge (a shorts hem) and that edge changes shape as
    # the thigh gets shorter: the background showed between them. The thigh's sitting drawing lies over the calf, so
    # the calf goes up a little way under it.
    if f'uleg{s}_sit' in img: kd = max(4.0, kd - 14 * K * min(1.0, (1 - sc) / 0.15))
    knee = (hip[0] + u[0] * kd, hip[1] + u[1] * kd)
    b = bones['uleg' + s]; out[(b, R)] = a0; out[(b, LEN)] = kd; out[(bones[f'uleg{s}_s'], SX)] = 100 * sc
    ll = math.degrees(math.atan2(j['an' + s][1] - knee[1], j['an' + s][0] - knee[0]))
    b = bones['lleg' + s]; out[(b, R)] = ll - a0; out[(b, LEN)] = math.hypot(j['an' + s][0] - knee[0], j['an' + s][1] - knee[1])
    out[(bones['foot' + s], R)] = ang(j, 'an' + s, 'to' + s) - ll
    if f'lleg{s}_s' in bones: out[(bones[f'lleg{s}_s'], SX)] = 100.0     # from that knee the calf keeps its length
rest = channels(J)

# ------------------------------------------------------------------ animations
BODY = ['Idle'] + GAITS + [a.capitalize() for a in ACTS] + list(SEQ.values()); FACE = ['Happy', 'Talk'] + [f.capitalize() for f in FACES[1:]]
anims = {a['name']: a['id'] for a in ae('listLinearAnimations', {})['linearAnimations']}
ae('renameAnimations', {'animations': [{'animationId': next(iter(anims.values())), 'name': 'Idle'}]})
ae('createLinearAnimations', {'linearAnimations': [{'name': n, 'duration': 1} for n in BODY[1:] + ['Face' + f for f in FACE] + ['FaceRight', 'FaceLeft']]})
anims = {a['name']: a['id'] for a in ae('listLinearAnimations', {})['linearAnimations']}; LOG['anims'] = anims
FPS, DUR, LOOP = 56, 57, 59
STATS = {}
hk = lambda oid, pk, v, f=0: {'objectId': oid, 'propertyKey': pk, 'frame': f, 'value': v, 'interpolationType': 'hold'}
def add(name, keys):
    keys = list({(k['objectId'], k['propertyKey'], k['frame']): k for k in keys}.values())   # one key per property and frame
    for i in range(0, len(keys), 6000): ae('modifyKeyFrames', {'animationId': anims[name], 'add': keys[i:i + 6000]})
def thin(vals, tol):
    # the frames to key so that straight lines between them stay within tol of every frame (Ramer-Douglas-Peucker)
    keep = {0, len(vals) - 1}; stack = [(0, len(vals) - 1)]
    while stack:
        a, b = stack.pop(); worst, at = tol, None
        for i in range(a + 1, b):
            d = abs(vals[i] - (vals[a] + (vals[b] - vals[a]) * (i - a) / (b - a)))
            if d > worst: worst, at = d, i
        if at is not None: keep.add(at); stack += [(a, at), (at, b)]
    return sorted(keep)
# Angles are keyed as the nearest turn to the frame before, so nothing spins inside an animation. Where one animation
# hands over to another the two must also agree on the turn, or the blend between them spins the piece once round
# (a hand wheeling round the wrist as the clap ended, seen from the front, where the hand's direction in the picture
# passes through every angle while it points at the camera). So a state that follows another starts from that one's
# last angles (after: PickUp -> Holding -> PutDown), and an animation that hands back to Idle (home) ends within half
# a turn of the rest pose: a whole turn too many is taken out in one step, between two frames, where it does not show.
LAST = {}
def body_anim(name, F, act=None, swap=(), after=None, home=True):
    keys, prev, series = [], dict(LAST.get(after, {})), {}; LIM['el'] = 0.72 if FB and name == 'Clap' else 0.3
    for f, j in enumerate(F):
        # front and back: standing and walking the arms keep their lengths; running and sitting the forearms point at
        # the camera and are foreshortened (kept long they crossed over the belly); the hands stay in line throughout
        for (oid, pk), v in channels(j, FB and ('full' if name in ('Idle', 'Walk') else 'hand' if name in ('Run', 'SitDown', 'Sitting', 'StandUp') else False),
                                     FB and name in ('SitDown', 'Sitting', 'StandUp', 'PickUp', 'Holding', 'PutDown'), name in ('Walk', 'Run'),
                                     'seat' in J and name in ('PickUp', 'PutDown')).items():
            if pk == R:                                       # nearest turn to the previous key (no spins)
                ref = prev.get((oid, pk), rest[(oid, pk)]); v = v + 360 * round((ref - v) / 360)
            prev[(oid, pk)] = v; series.setdefault((oid, pk), []).append(v)
    step = {}
    for (oid, pk), vals in series.items():
        n = round((vals[-1] - rest[(oid, pk)]) / 360) if pk == R and home and len(vals) > 2 else 0
        if n:
            f = max(range(len(vals) - 1), key=lambda i: abs(vals[i + 1] - vals[i])); step[(oid, pk)] = f
            for i in range(f + 1, len(vals)): vals[i] -= 360 * n
    LAST[name] = {q: vals[-1] for q, vals in series.items() if q[1] == R}
    # keys only where the motion bends: within a quarter degree or half a pixel of the recorded curve
    for (oid, pk), vals in series.items():
        f0 = step.get((oid, pk))
        for f in sorted(set(thin(vals, 0.25 if pk == R else 0.5 * K if pk in (X, Y, LEN, GX, GY) else 0.4)) | ({f0, f0 + 1} if f0 is not None else set())):
            keys.append({'objectId': oid, 'propertyKey': pk, 'frame': f, 'value': round(vals[f], 3), 'interpolationType': 'hold' if f == f0 else 'linear'})
    # posed hands: this action's drawing replaces the resting hand while the action holds (after its blend-in, until
    # its blend-out); every other posed hand stays hidden
    span = {}                                         # posed hand -> (first frame, frame it goes again)
    # (the clap's drawings later and shorter: its hands rise and sink apart first, see cast.js clapPose)
    if act: span = {p: (((5, len(F) - 8) if FB else (8, len(F) - 12)) if act == 'clap' else (6, len(F) - 8)) for p in swaps if p.endswith('_' + act)}
    hide = {}                                         # ... and when its resting drawing is hidden, where that differs
    for p, f0, f1, *b in swap or ():
        if p in img: span[p] = (f0, f1 if f1 is not None else len(F) + 1); hide.update({p: tuple(b)} if b else {})
    for p in swaps:
        keys.append(hk(img[p], OPA, 0))
    for base in {p.split('_')[0] for p in swaps} & set(img): keys.append(hk(img[base], OPA, 100))
    for p, (on, off) in span.items():
        base = p.split('_')[0]
        hon, hoff = hide.get(p, (on, off))
        keys += [hk(img[p], OPA, 100, on)] + ([hk(img[base], OPA, 0, hon)] if base in img else [])   # (the bow's waistband replaces nothing)
        if off < len(F): keys.append(hk(img[p], OPA, 0, off))
        if hoff < len(F) and base in img: keys.append(hk(img[base], OPA, 100, hoff))
    add(name, keys); STATS[name] = len(keys)
    return len(F)
F = [dict(f) for f in D['anims']['idle']['frames'][:59]]; n = len(F)
for i in range(n - 14, n):                                   # the last half second blends back to the start: it loops
    t = (i - (n - 15)) / 14; F[i] = {k: [F[i][k][0] * (1 - t) + F[0][k][0] * t, F[i][k][1] * (1 - t) + F[0][k][1] * t] for k in F[i]}
lens = {'Idle': body_anim('Idle', F)}
for g in GAITS: lens[g] = body_anim(g, D['anims'][g.lower()]['frames'])
for a in ACTS: lens[a.capitalize()] = body_anim(a.capitalize(), D['anims'][a]['frames'], a)
for k, nm in SEQ.items():
    A = D['anims'][k]; F = [dict(f) for f in A['frames']]
    if A.get('loop'):                                 # held states loop: the last half second blends back to the start
        n = len(F)
        for i in range(n - 14, n):
            t = (i - (n - 15)) / 14; F[i] = {q: [F[i][q][0] * (1 - t) + F[0][q][0] * t, F[i][q][1] * (1 - t) + F[0][q][1] * t] for q in F[i]}
    # sit down -> sitting -> stand up, pick up -> holding -> put down: each from the last angles of the one before
    before = {'Sitting': 'SitDown', 'StandUp': 'Sitting', 'Holding': 'PickUp', 'PutDown': 'Holding'}.get(nm)
    lens[nm] = body_anim(nm, F, None, A.get('swaps'), before if before in LAST else None, nm in ('StandUp', 'PutDown'))
print(ABNAME, 'body', lens, 'keys', sum(STATS.values()))
# faces: one head shows at a time. Happy blinks (4 s loop, twice); Talk moves the mouth (0.53 s loop) and blinks.
hd = {h[5:]: img[h] for h in heads}
def show(name, f=0): return [hk(i, OPA, 100 if n == name else 0, f) for n, i in hd.items()] if len(hd) > 1 else [hk(i, OPA, 100, f) for i in hd.values()]
blink = 'blink' if 'blink' in hd else 'happy'; talk = 'talk' if 'talk' in hd else 'happy'
add('FaceHappy', show('happy') + show(blink, 66) + show('happy', 70) + show(blink, 102) + show('happy', 106)); lens['FaceHappy'] = 120
add('FaceTalk', show(talk) + show('happy', 4) + show(talk, 7) + show('happy', 12)); lens['FaceTalk'] = 16
for f in FACES[1:]: add('Face' + f.capitalize(), show(f if f in hd else 'happy')); lens['Face' + f.capitalize()] = 1
for h in heads[1:]: call('set_property_values', {'propertyValues': {img[h]: {OPA: 0}}})
for p in swaps: call('set_property_values', {'propertyValues': {img[p]: {OPA: 0}}})
add('FaceRight', [hk(flip, SX, 100), hk(flip, GX, 0)]); add('FaceLeft', [hk(flip, SX, -100), hk(flip, GX, W)]); lens['FaceRight'] = lens['FaceLeft'] = 1
loops = {'Idle', 'Walk', 'Run', 'Sitting', 'Holding', 'FaceHappy', 'FaceTalk'}
call('set_property_values', {'propertyValues': {anims[a]: {FPS: 30, DUR: n - 1 if n > 1 else 1, LOOP: 1 if a in loops else 0} for a, n in lens.items()}})

tick('animations')
# ------------------------------------------------------------------ view model (shared by every artboard of the file)
vms = call('viewmodel_editor', {'command': 'listViewModels'})['viewModels']
vm = next((v for v in vms if v['name'] == 'Cast2D'), None)
if not vm:
    if not any(e['name'] == 'Face' for e in call('viewmodel_editor', {'command': 'listDataEnums'}).get('dataEnums', [])):
        call('viewmodel_editor', {'command': 'createDataEnums', 'data': {'createDataEnums': {'dataEnums': [{'name': 'Face', 'values': FACES}]}}})
    props = [{'name': n, 'propertyType': 'boolean'} for n in ('walking', 'running', 'talking', 'facingLeft', 'sitting', 'holding')] + [{'name': 'face', 'propertyType': 'enum', 'enumName': 'Face'}] + \
            [{'name': a, 'propertyType': 'trigger'} for a in ('wave', 'point', 'cheer', 'think', 'pull', 'clap')]
    call('viewmodel_editor', {'command': 'createViewModels', 'data': {'createViewModels': {'viewModels': [{'name': 'Cast2D', 'viewModelProperties': props}]}}})
    vm = next(v for v in call('viewmodel_editor', {'command': 'listViewModels'})['viewModels'] if v['name'] == 'Cast2D')
    call('viewmodel_editor', {'command': 'createViewModelInstances', 'data': {'createViewModelInstances': {'viewModelId': vm['id'], 'instances': [{'name': 'Default', 'instanceProperties': []}]}}})
want = {**{n: 'boolean' for n in ('walking', 'running', 'talking', 'facingLeft', 'sitting', 'holding')}, **{a: 'trigger' for a in ('wave', 'point', 'cheer', 'think', 'pull', 'clap')}}
fe = next((e for e in call('viewmodel_editor', {'command': 'listDataEnums'})['dataEnums'] if e['name'] == 'Face'), None)
if fe and any(f not in {v['key'] for v in fe['values']} for f in FACES):
    call('viewmodel_editor', {'command': 'addDataEnumValues', 'data': {'addDataEnumValues': {'dataEnumId': fe['id'], 'values': [f for f in FACES if f not in {v['key'] for v in fe['values']}]}}})
miss = [{'name': n, 'propertyType': t} for n, t in want.items() if n not in {p['name'] for p in vm['viewModelProperties']}]
if miss:                                         # a file made by an older build: add what is new
    call('viewmodel_editor', {'command': 'addProperties', 'data': {'addProperties': {'viewModels': [{'viewModelId': vm['id'], 'viewModelProperties': miss}]}}})
    vm = next(v for v in call('viewmodel_editor', {'command': 'listViewModels'})['viewModels'] if v['name'] == 'Cast2D')
P = {p['name']: p['id'] for p in vm['viewModelProperties']}
call('viewmodel_editor', {'command': 'bindViewModelToArtboard', 'data': {'bindViewModelToArtboard': {'artboardId': AB, 'viewModelId': vm['id']}}})

tick('view model')
# ------------------------------------------------------------------ state machine
sm = ae('queryStateMachine', {}); SM = sm['stateMachineId']; L0 = sm['layers'][0]
call('rename_objects', {'renames': [{'id': SM, 'name': 'Character'}, {'id': L0['layerId'], 'name': 'Body'}]})   # the Idle state is named by its animation
ae('createStates', {'layerId': L0['layerId'], 'states': [{'name': n, 'linearAnimationName': n, 'x': 200 + 120 * i, 'y': -160 if i else 160} for i, n in enumerate(BODY[1:])]})
ae('createStateMachineLayers', {'stateMachineId': SM, 'layers': [
    {'name': 'Face', 'states': [{'name': f, 'linearAnimationName': 'Face' + f, 'x': 160 + 140 * i, 'y': 0} for i, f in enumerate(FACE)]},
    {'name': 'Facing', 'states': [{'name': f, 'linearAnimationName': f, 'x': 160 + 200 * i, 'y': 0} for i, f in enumerate(('FaceRight', 'FaceLeft'))]}]})
sm = ae('queryStateMachine', {'stateMachineId': SM})
st = {(L['layerName'], s['name']): s['id'] for L in sm['layers'] for s in L['states'] if s['name']}
entry = {L['layerName']: next(s['id'] for s in L['states'] if s['type'] == 'entry') for L in sm['layers']}
HELD = [('SitDown', 'Sitting', 'StandUp', 'sitting'), ('PickUp', 'Holding', 'PutDown', 'holding')]
HELD = [h for h in HELD if h[0] in BODY]
INTO = [b for b in BODY[1:] if b not in SEQ.values()] + [h[0] for h in HELD]            # states entered from Idle
pairs = [('Body', 'Idle', b) for b in INTO] + [('Body', b, 'Idle') for b in BODY[1:] if b not in SEQ.values()] + \
        [x for a, b, c, _ in HELD for x in (('Body', a, b), ('Body', b, c), ('Body', c, 'Idle'))] + \
        ([('Body', 'Walk', 'Run'), ('Body', 'Run', 'Walk')] if len(GAITS) == 2 else []) + \
        [('Body', a.capitalize(), b.capitalize()) for a in ACTS for b in ACTS if a != b] + \
        [('Body', g, a.capitalize()) for g in GAITS for a in ACTS] + \
        [('Face', a, b) for a in FACE for b in FACE if a != b] + [('Facing', 'FaceRight', 'FaceLeft'), ('Facing', 'FaceLeft', 'FaceRight')]
spec = {}
for l, a, b in pairs: spec.setdefault(st[(l, a)], []).append({'to': st[(l, b)]})
spec[entry['Face']] = [{'to': st[('Face', 'Happy')]}]; spec[entry['Facing']] = [{'to': st[('Facing', 'FaceRight')]}]
ae('createTransitions', {'states': [{'id': k, 'transitions': v} for k, v in spec.items()]})
sm = ae('queryStateMachine', {'stateMachineId': SM})
names = {s['id']: (s['name'] or s['type']) for L in sm['layers'] for s in L['states']}
T = {(L['layerName'], names[t['fromStateId']], names[t['toStateId']]): t['id'] for L in sm['layers'] for t in L.get('transitions', [])}
eq = lambda pid, v: {'leftComparator': {'viewModelPropertyId': pid}, 'operation': 'equal', 'rightComparator': {'value': v, 'valueType': 'constantValueType'}}
trig = lambda pid: {'leftComparator': {'viewModelPropertyId': pid}}
faceOn = lambda f: [eq(P['talking'], True)] if f == 'Talk' else [eq(P['talking'], False), eq(P['face'], f.lower())]
# running wins over walking: running on = Run; walking alone = Walk; both off = Idle
cond = [('Body', 'Idle', 'Walk', [eq(P['walking'], True), eq(P['running'], False)]), ('Body', 'Walk', 'Idle', [eq(P['walking'], False), eq(P['running'], False)])] + \
       ([('Body', 'Idle', 'Run', [eq(P['running'], True)]), ('Body', 'Run', 'Idle', [eq(P['running'], False), eq(P['walking'], False)]),
         ('Body', 'Walk', 'Run', [eq(P['running'], True)]), ('Body', 'Run', 'Walk', [eq(P['running'], False), eq(P['walking'], True)])] if 'Run' in GAITS else []) + \
       [('Body', 'Idle', a.capitalize(), [trig(P[a])]) for a in ACTS] + \
       [('Body', a.capitalize(), b.capitalize(), [trig(P[b])]) for a in ACTS for b in ACTS if a != b] + \
       [('Body', g, a.capitalize(), [trig(P[a])]) for g in GAITS for a in ACTS] + \
       [x for a, b, c, prop in HELD for x in (('Body', 'Idle', a, [eq(P[prop], True)]), ('Body', b, c, [eq(P[prop], False)]))] + \
       [('Face', a, b, faceOn(b)) for a in FACE for b in FACE if a != b] + \
       [('Facing', 'FaceRight', 'FaceLeft', [eq(P['facingLeft'], True)]), ('Facing', 'FaceLeft', 'FaceRight', [eq(P['facingLeft'], False)])]
ae('createConditions', {'transitions': [{'id': T[(l, a, b)], 'conditions': c} for l, a, b, c in cond]})
# blends: walking in and out 0.2 s; into an action 0.15 s (also straight from a walk or run: the figure stops for
# the gesture and walks on after it); out of an action when it has played (exit time), 0.12 s: a gesture asked for
# while that blend runs is not taken, so the blend is kept short
pv = {T[k]: {158: 200} for k in T if k[0] == 'Body' and k[1] in ('Idle', 'Walk', 'Run') and k[2] in ('Idle', 'Walk', 'Run')}
for a in ACTS:
    pv[T[('Body', 'Idle', a.capitalize())]] = {158: 150}; pv[T[('Body', a.capitalize(), 'Idle')]] = {152: 12, 158: 120, 160: 100}
    for g in GAITS: pv[T[('Body', g, a.capitalize())]] = {158: 150}
    for b in ACTS:
        if a != b: pv[T[('Body', a.capitalize(), b.capitalize())]] = {158: 200}
# turning round (facing left and back) blends the mirror over 0.2 s: the scale passes through zero while the picture
# stays centred, so the figure narrows to its middle and opens facing the other way (how 2D animation turns a figure)
pv[T[('Facing', 'FaceRight', 'FaceLeft')]] = {158: 200}; pv[T[('Facing', 'FaceLeft', 'FaceRight')]] = {158: 200}
call('set_property_values', {'propertyValues': pv})
for a, b, c, _ in HELD:                                 # down/up play through, then hand over (exit time)
    pv[T[('Body', a, b)]] = {152: 12, 158: 100, 160: 100}; pv[T[('Body', c, 'Idle')]] = {152: 12, 158: 150, 160: 100}
    pv[T[('Body', 'Idle', a)]] = {158: 150}; pv[T[('Body', b, c)]] = {158: 100}
call('set_property_values', {'propertyValues': pv})
LOG['transitions'] = {'|'.join(k): v for k, v in T.items()}
json.dump(LOG, open(prep_path[:-5] + '.ids.json', 'w'), indent=1)
sim = ae('simulateStateMachine', {'stateMachineId': SM, 'frames': 300, 'fps': 60, 'inputs': [
    {'frame': 10, 'property': 'walking', 'value': True}, {'frame': 40, 'property': 'wave'}, {'frame': 60, 'property': 'walking', 'value': False}, {'frame': 90, 'property': 'cheer'},
    {'frame': 100, 'property': 'face', 'value': 'laugh'}, {'frame': 140, 'property': 'talking', 'value': True}, {'frame': 160, 'property': 'facingLeft', 'value': True}]})
seen = [(t.get('fromStateName'), t.get('toStateName')) for t in sim['trace'] if t['kind'] == 'transition']
print(ABNAME, 'simulated:', seen)
need = [('Idle', 'Walk'), ('Walk', 'Wave'), ('Wave', 'Cheer'), ('Happy', 'Talk'), ('FaceRight', 'FaceLeft')]   # faces: the simulator cannot set enums
missing = [n for n in need if n not in seen]
print(ABNAME, 'done', AB, 'MISSING ' + str(missing) if missing else 'all transitions seen')
