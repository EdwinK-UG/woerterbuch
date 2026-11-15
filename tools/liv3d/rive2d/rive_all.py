# One character (or several) from rendered layers to exported .riv files, all three views.
#   python3 rive_all.py SHOTS WORK ID [ID ...]
# SHOTS: where cast.js __export2d(ID) saved its pictures and motions; WORK: a scratch folder for the prepared layers.
# Needs the Rive editor open (its MCP endpoint on 127.0.0.1:9791). Writes tools/liv3d/models/cast/2d/<id>.riv
# (three-quarter), <id>-front.riv, <id>-back.riv.
# The editor exports only the first artboard of the file, so each view is built alone: the file is cleared (artboards
# and images) before every build. The view model Cast2D and its Face enum stay and are reused.
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..', 'models', 'cast', '2d')
SHOTS, WORK, ids = sys.argv[1], sys.argv[2], sys.argv[3:]
os.makedirs(OUT, exist_ok=True); os.makedirs(WORK, exist_ok=True)
run = lambda *a: subprocess.run([sys.executable, *a], check=True)
def rive(tool, args):
    out = subprocess.run([os.path.join(HERE, 'rive_call.sh'), tool, json.dumps(args)], capture_output=True, text=True, check=True).stdout
    t = json.loads(json.loads(out)['result']['content'][0]['text']); return json.loads(t['content']) if isinstance(t.get('content'), str) else t
def clear():
    ids = [a['id'] for a in rive('open_file_editor', {'command': 'listArtboards'})['artboards']] + \
          [a['id'] for a in rive('assets_tool', {'command': 'listAssets', 'data': {'listAssets': {'typeFilter': 'image'}}})['assets']]
    if ids: rive('delete_objects', {'objectIds': ids})
def motion(prep, out):
    # for scenes that put things in the character's hand (the saw's handle, a picked-up box): the hand and hip paths of
    # every motion, in artboard pixels, 30 a second. World metres = pixels * metres / H; the ground is at y = ground.
    D = json.load(open(prep)); r = lambda v: [round(v[0], 1), round(v[1], 1)]
    keep = ('hips', 'wrR', 'fiR', 'wrL', 'fiL')
    json.dump({'W': D['W'], 'H': D['H'], 'metres': D['metres'], 'ground': round(D['H'] * (1 - 0.02 / D['metres']), 1), 'fps': 30,
               'rest': {k: r(D['joints'][k]) for k in keep},
               'anims': {n: [{k: r(f[k]) for k in keep} for f in a['frames']] for n, a in D['anims'].items()}}, open(out, 'w'), separators=(',', ':'))
for cid in ids:
    for v, name, suffix in (('q', '3q', ''), ('f', 'front', '-front'), ('b', 'back', '-back')):
        pf = f'{cid.lower()}_{v}'; ab = f'{cid} {name}'
        prep, man = os.path.join(WORK, pf + '.json'), os.path.join(SHOTS, pf + '_manifest.json')
        riv = os.path.join(OUT, f'{cid.lower()}{suffix}.riv')
        if os.path.exists(prep) and os.path.exists(riv) and os.path.getmtime(riv) > os.path.getmtime(prep) > os.path.getmtime(man):
            print(cid, name, 'up to date', flush=True); continue      # a retry only redoes the views that failed
        if not (os.path.exists(prep) and os.path.getmtime(prep) > os.path.getmtime(man)):   # prepared already (ahead, in parallel)
            run(os.path.join(HERE, 'rive_prep.py'), SHOTS, WORK, pf)
        clear()
        run(os.path.join(HERE, 'rive_build.py'), os.path.join(WORK, pf + '.json'), ab)
        run(os.path.join(HERE, 'rive_export.py'), os.path.join(OUT, f'{cid.lower()}{suffix}.riv'), ab)
        motion(os.path.join(WORK, pf + '.json'), os.path.join(OUT, f'{cid.lower()}{suffix}.motion.json'))
        print(cid, name, os.path.getsize(os.path.join(OUT, f'{cid.lower()}{suffix}.riv')) // 1024, 'KB', flush=True)
