"""Complete the far sleeve and clean the sleeve pieces (run after the cut_*.py scripts).

In the side and three-quarter-back pictures the far arm's sleeve is mostly hidden behind the body, so the pack's piece is a
sliver; when that arm is raised the missing part shows as torn shards. The near sleeve is a whole puff, and the two arms are
almost mirror images, so the far sleeve (and its shoulder cap) becomes the near one mirrored about the line midway between the
shoulders: <view>_sleeve<far>_f.png / <view>_cap<far>_f.png, with their boxes in <view>.json under `boxes`.
Also every sleeve piece loses the red specks that the pack's painted torso left on its edge.

    python3 tools/liv/rive/fix_sleeves.py
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageOps

HERE = Path(__file__).resolve().parent
PARTS = json.loads((HERE / 'parts/parts.json').read_text())
LINEN = np.array([238, 224, 198], np.float32)

def unspeckle(path):
    im = np.asarray(Image.open(path).convert('RGBA')).astype(np.float32)
    r, g, b, a = im[..., 0], im[..., 1], im[..., 2], im[..., 3]
    red = (a > 20) & (r > 120) & (g < 105) & (b < 95) & (r - g > 60)
    n = int(red.sum())
    if n: im[red, :3] = LINEN
    Image.fromarray(im.astype(np.uint8), 'RGBA').save(path)
    return n

for V in ('front', 'tq', 'side', 'tqb', 'back'):
    jpath = HERE / V / f'{V}.json'
    T = json.loads(jpath.read_text())
    cleaned = {p.name: unspeckle(p) for p in sorted((HERE / V).glob(f'{V}_sleeve*_c.png'))}
    msg = f'{V}: red specks removed {cleaned}'
    if V in ('side', 'tqb'):
        far = T['far_arm']; near = 'B' if far == 'A' else 'A'
        boxes = T.setdefault('boxes', {})
        nb = boxes.get(f'sleeve{near}') or [PARTS[f'{V}_sleeve{near}'][k] for k in 'xywh']
        axis = (T[near]['sh'][0] + T[far]['sh'][0]) / 2.0
        fx = 2 * axis - (nb[0] + nb[2]); fy = nb[1] + (T[far]['sh'][1] - T[near]['sh'][1])
        for piece, src in (('sleeve', f'{V}_sleeve{near}_c.png'), ('cap', f'{V}_cap{near}.png')):
            sp = HERE / V / src
            if not sp.exists(): continue
            ImageOps.mirror(Image.open(sp).convert('RGBA')).save(HERE / V / f'{V}_{piece}{far}_f.png')
        boxes[f'sleeve{far}_f'] = [round(fx, 1), round(fy, 1), nb[2], nb[3]]
        jpath.write_text(json.dumps(T, indent=1))
        msg += f'; far sleeve {far} = near {near} mirrored, box {boxes[f"sleeve{far}_f"]}'
    print(msg)
