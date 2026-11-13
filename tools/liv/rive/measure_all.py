"""Measure foot sliding and leg reach for every view of the Rive project, walking, running and at quarter speed.

    python3 tools/liv/rive/measure_all.py [views...] [--secs 3]        (default: all five views)

Renders frames with the CLI (render_seq.py), then runs measure_liv.py on each run and prints one line per run. The controller
numbers (planted contact points in world coordinates) are exact; the pixel numbers track the rendered boot sole.
"""
import json, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = Path('/private/tmp/claude-501/liv/measure_all')
DEF = json.loads((HERE / 'liv/defaults.json').read_text())
VIEWS = ['front', 'tq', 'side', 'tqb', 'back']
args = [a for a in sys.argv[1:] if a in VIEWS] or VIEWS
secs = 2
if '--secs' in sys.argv: secs = float(sys.argv[sys.argv.index('--secs') + 1])
runs = [('walk', 'data gait=1', 3.5, 1.0), ('run', 'data gait=2', 5.0, 1.0)]
if '--slow' in sys.argv: runs.append(('slow', 'data gait=2', 5.0, 0.25))
for V in args:
    c = DEF['ctrl'][V]; yaw = c['yaw']; footw = c['c']['footWA']; vi = VIEWS.index(V)
    for name, gait, warm, rate in runs:
        d = OUT / f'{V}_{name}'
        steps = [f'data view={vi}', f'data rate={rate}', 'adv 1.5', gait, f'adv {warm / rate if rate < 1 else warm}', f'adv {secs / rate if rate < 1 else secs} 1 dump']
        subprocess.run([sys.executable, str(HERE / 'render_seq.py'), str(HERE / 'liv'), str(d), *steps], capture_output=True, text=True)
        r = subprocess.run([sys.executable, str(HERE / 'measure_liv.py'), str(d), str(d / 'm.json'), '--prefix', 'f', '--view', V, '--yaw', str(yaw), '--footw', str(footw)], capture_output=True, text=True)
        try:
            m = json.loads((d / 'm.json').read_text())
            print(f"{V:6s} {name:5s} ctrl-slide {max(m['maxControllerSlideViewPx'].values()):.4f}px  pixel-slide {m['maxPixelSlideStagePx']}  "
                  f"speed {m['maxSpeedMps']}  stride {m.get('strideSeconds')}s  lift {m['maxFootLiftViewPx']}  reach {m['maxLegReach']}", flush=True)
        except Exception as e:
            print(V, name, 'failed', e, r.stdout[-300:], r.stderr[-300:], flush=True)
