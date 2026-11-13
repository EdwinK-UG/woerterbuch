"""Upper-arm direction paths through every action and pose, per view and arm (from view-model dumps of a CLI run), in degrees
relative to the bind direction, unwrapped along each path. Shows which directions an arm sweeps through, so each arm's
+-180 degree rotation wrap (where the sleeve helpers would flip) can sit where the arm never goes.

    python3 tools/liv/rive/sleeves/arm_paths.py PROJECT_DIR WORK_DIR [views...]
"""
import json, math, shutil, subprocess, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent.parent
RIVE = '/Users/edwin/Documents/Codex/2026-11-02/i-x20/work/rive-tools/rive'
VIEWS = ['front', 'tq', 'side', 'tqb', 'back']
DUR = [0, 2.6, 2.0, 2.0, 2.0, 2.4, 2.2, 3.0, 2.4, 2.4, 2.6, 2.0, 2.4, 3.0, 1.6, 1.6, 2.2, 1.5, 2.6, 2.0, 2.4, 2.4, 1.5, 1.3, 3.0, 3.2, 3.0, 1.6]
EVERY = 3


def upper_dir(T, sd, vals, V, rs, inv):
    a = T[sd]; px, py, sr = vals[V + '_pelvisX'], vals[V + '_pelvisY'], vals[V + '_spineRot'] - rs
    dx, dy = a['sh'][0] - T['pelvis'][0], a['sh'][1] - T['pelvis'][1]
    c, s = math.cos(sr), math.sin(sr); shx, shy = px + c * dx - s * dy, py + s * dx + c * dy
    hx, hy = vals[f'{V}_hand{sd}X'], vals[f'{V}_hand{sd}Y']
    L1 = math.dist(a['sh'], a['elbow']); L2 = math.dist(a['elbow'], a['wrist']); d = math.hypot(hx - shx, hy - shy)
    al = math.acos(max(-1, min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * max(d, 1e-3)))))
    hd = math.atan2(hy - shy, hx - shx) - sr
    return hd + (-al if inv else al)          # invertDirection false bends this way (checked on the front think frame: elbow low)


def main():
    proj, work = Path(sys.argv[1]), Path(sys.argv[2]); views = sys.argv[3:] or VIEWS
    D = json.loads((proj / 'defaults.json').read_text())
    for V in views:
        T = json.loads((HERE / V / f'{V}.json').read_text()); rs = D['ctrl'][V]['rest']['spineRot']
        od = (work / V).resolve(); shutil.rmtree(od, ignore_errors=True); od.mkdir(parents=True)
        lines = [f'data view={VIEWS.index(V)}'] + ['advance 33.333ms'] * 40 + [f'data-dump {od}/bind.json']
        segs = []
        jobs = [(f'a{i}', [f'action={i}'] + (['prop=1'] if i == 22 else ['prop=2'] if i == 19 else []), DUR[i] + .6) for i in range(1, 28)]
        jobs += [(f'p{i}', [f'pose={i}'], 1.6) for i in range(1, 7)] + [('walk', ['gait=1'], 2.5), ('run', ['gait=2'], 2.5)]
        for name, sets, t in jobs:
            lines += [f'data {x}' for x in sets]; n = int(t * 30)
            for k in range(n):
                lines.append('advance 33.333ms')
                if k % EVERY == 0: lines.append(f'data-dump {od}/{name}_{k:03d}.json')
            lines += ['data action=0', 'data pose=0', 'data prop=0', 'data gait=0'] + ['advance 33.333ms'] * 60
            segs.append(name)
        lines.append('quit')
        subprocess.run([RIVE, str(proj), '--commands'], input='\n'.join(lines) + '\n', text=True, capture_output=True, timeout=1200)
        def vals_of(f): return {p['name']: p['value'] for p in json.loads(f.read_text())['viewModel']['properties']}
        for sd in 'AB':
            if sd not in T: continue
            bd = math.atan2(T[sd]['dir'][1], T[sd]['dir'][0])
            # which IK sign gives the bind elbow
            vb = vals_of(od / 'bind.json'); el = math.atan2(T[sd]['elbow'][1] - T[sd]['sh'][1], T[sd]['elbow'][0] - T[sd]['sh'][0])
            # at bind pose 0 is rest, not bind: just report both signs' spread at rest instead
            lo, hi, worst = 0.0, 0.0, {}
            for name in segs:
                prev = 0.0
                for f in sorted(od.glob(f'{name}_*.json')):
                    v = vals_of(f); inv = bool(v.get(f'{V}_ikInv{sd}', False))
                    a = upper_dir(T, sd, v, V, rs, inv) - bd
                    a = prev + ((a - prev + math.pi) % (2 * math.pi) - math.pi); prev = a
                    lo, hi = min(lo, a), max(hi, a)
                    if a < worst.get('lo', (9, ''))[0]: worst['lo'] = (a, f.stem)
                    if a > worst.get('hi', (-9, ''))[0]: worst['hi'] = (a, f.stem)
            print(f'{V} {sd}: upper arm from {math.degrees(lo):+.0f} to {math.degrees(hi):+.0f} deg about the bind direction '
                  f'(min at {worst["lo"][1]}, max at {worst["hi"][1]}); free gap centre {math.degrees((lo + hi) / 2 + math.pi):+.0f}')
        shutil.rmtree(od, ignore_errors=True)


main()
