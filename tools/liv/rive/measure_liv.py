"""Measure a rendered Liv gait from per-frame view-model dumps (and screenshots).

    python3 tools/liv/rive/measure_liv.py FRAMES_DIR OUT.json [--prefix w]

FRAMES_DIR holds fNNNN.png-style screenshots and dNNNN.json dumps written by `rive . --commands` (same stem).
Two checks of foot sliding:
  * controller: for each foot, the planted contact point is fixed in world coordinates, i.e. its screen position plus the
    distance she has travelled (sOut) must not change while the foot is down (plA / plB);
  * pixels: the bottom of the rendered boot (the sole) is tracked in the screenshots while the foot is flat on the ground
    and the same rule is applied: screen x + travelled distance must stay put.
Also reports speed, cadence, foot lift and leg reach (hip to ankle target against thigh + shin)."""
import json, math, sys, glob
from pathlib import Path
import numpy as np
from PIL import Image

args = sys.argv[1:]
prefix = 'w'; VIEW = ''; YAW = 43.0; FOOTW = .84
if '--view' in args: i = args.index('--view'); VIEW = args[i + 1]; del args[i:i + 2]
if '--footw' in args: i = args.index('--footw'); FOOTW = float(args[i + 1]); del args[i:i + 2]
if '--yaw' in args: i = args.index('--yaw'); YAW = float(args[i + 1]); del args[i:i + 2]
if '--prefix' in args: i = args.index('--prefix'); prefix = args[i + 1]; del args[i:i + 2]
D, OUT = Path(args[0]), args[1]
SCALE, CX, CY = .62, 40, 36
FX = math.sin(math.radians(YAW)); FZ = math.cos(math.radians(YAW)); KD = .07; PPM = 996

def vals(p):
    out = {}
    def w(o):
        if isinstance(o, dict):
            if 'name' in o and 'value' in o:
                out[o['name']] = o['value']
                if VIEW and o['name'].startswith(VIEW + '_'): out[o['name'][len(VIEW) + 1:]] = o['value']       # a view's numbers without the prefix
            for v in o.values(): w(v)
        elif isinstance(o, list):
            for v in o: w(v)
    w(json.load(open(p))); return out

files = sorted(D.glob(f'{prefix}*.json'))
V = [vals(p) for p in files]
res = dict(frames=len(V))
# --- controller-level slide
slide = {'A': 0.0, 'B': 0.0}; pairs = {'A': 0, 'B': 0}
for a, b in zip(V, V[1:]):
    for f in 'AB':
        if a['pl' + f] > .5 and b['pl' + f] > .5:
            da = (b['c%sX' % f] + b['sOut'] * FX * PPM) - (a['c%sX' % f] + a['sOut'] * FX * PPM)
            dy_ = (b['c%sY' % f] + b['sOut'] * FZ * KD * PPM) - (a['c%sY' % f] + a['sOut'] * FZ * KD * PPM)
            slide[f] = max(slide[f], math.hypot(da, dy_)); pairs[f] += 1
res['plantedPairs'] = pairs; res['maxControllerSlideViewPx'] = {k: round(v, 4) for k, v in slide.items()}
# --- pixel slide: the sole of each boot while its foot is flat on the ground
def boot_bottom(img, x, y):
    # x, y: foot target in view px -> stage px; a window round the boot, brown pixels, the bottom rows
    sx, sy = CX + x * SCALE, CY + y * SCALE
    x0, x1, y0, y1 = int(sx - 55), int(sx + 55), int(sy - 20), int(sy + 90)
    a = img[y0:y1, x0:x1].astype(int)
    brown = (a[..., 0] > 60) & (a[..., 0] < 150) & (a[..., 1] > 35) & (a[..., 1] < 100) & (a[..., 2] < 70) & (a[..., 0] > a[..., 1] + 15)
    ys, xs = np.nonzero(brown)
    if len(ys) < 40: return None
    low = ys >= ys.max() - 6
    return xs[low].mean() + x0, ys.max() + y0
pix = {'A': [], 'B': []}; prev = {}; runs = {'A': [], 'B': []}; cur = {'A': [], 'B': []}
for i, p in enumerate(files):
    v = V[i]; im = np.asarray(Image.open(str(p).replace('.json', '.png')).convert('RGB'))
    for f in 'AB':
        flat = v['pl' + f] > .5 and abs(v['foot%sRot' % f] - FOOTW) < .006
        other = 'B' if f == 'A' else 'A'
        near_other = abs(v['foot%sX' % f] - v['foot%sX' % other]) < 125       # the other boot is in the window: not measurable
        r = boot_bottom(im, v['foot%sX' % f], v['foot%sY' % f]) if (flat and not near_other) else None
        if r is not None:
            wx = r[0] + v['sOut'] * FX * PPM * SCALE; wy = r[1] + v['sOut'] * FZ * KD * PPM * SCALE      # the sole in the world: x and y (she runs toward the camera in front views)
            if f in prev and prev[f][0] == i - 1: pix[f].append(math.hypot(wx - prev[f][1], wy - prev[f][2]))
            else:
                if len(cur[f]) > 3: runs[f].append(math.hypot(max(c_[0] for c_ in cur[f]) - min(c_[0] for c_ in cur[f]), max(c_[1] for c_ in cur[f]) - min(c_[1] for c_ in cur[f])))
                cur[f] = []
            cur[f].append((wx, wy)); prev[f] = (i, wx, wy)
for f in 'AB':
    if len(cur[f]) > 3: runs[f].append(math.hypot(max(c_[0] for c_ in cur[f]) - min(c_[0] for c_ in cur[f]), max(c_[1] for c_ in cur[f]) - min(c_[1] for c_ in cur[f])))
res['maxFlatStanceDriftStagePx'] = {k: round(max(v), 2) if v else None for k, v in runs.items()}   # world drift of the sole over one whole flat stance
res['pixelPairs'] = {k: len(v) for k, v in pix.items()}
res['maxPixelSlideStagePx'] = {k: round(max(v), 2) if v else None for k, v in pix.items()}
res['p95PixelSlideStagePx'] = {k: round(float(np.percentile(v, 95)), 2) if v else None for k, v in pix.items()}
# --- speed, cadence, lift, reach
sp = [v['speedOut'] for v in V]; res['maxSpeedMps'] = round(max(sp), 3)
st = [i for i in range(1, len(V)) if V[i]['plA'] > .5 and V[i - 1]['plA'] < .5]
res['heelStrikesA'] = len(st)
if len(st) > 1: res['strideSeconds'] = round((st[-1] - st[0]) / (len(st) - 1) / 30, 3)
res['maxFootLiftViewPx'] = round(max(max(1318 - v['footAY'], 1318 - v['footBY']) for v in V), 1)
reach = 0
for v in V:
    if v['speedOut'] < .05: continue            # the gait only (poses may stretch a leg on purpose, e.g. Step)
    for f, hx in (('A', 452), ('B', 566)):
        dx = v['footAX' if f == 'A' else 'footBX'] - (v['pelvisX'] - 510 + hx); dy = v['footAY' if f == 'A' else 'footBY'] - (v['pelvisY'] - 912 + 930)
        reach = max(reach, math.hypot(dx, dy) / 390)
res['maxLegReach'] = round(reach, 3)
json.dump(res, open(OUT, 'w'), indent=2); print(json.dumps(res, indent=1))
