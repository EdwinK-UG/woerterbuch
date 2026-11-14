"""Rest-pose pixel diff between two stress runs (stress.py): % of the character's pixels that changed, inside and outside the
shoulders (circles of SH_R view px about each bind shoulder), per view and case (bind = the art's pose, rest = pose 0).

    python3 tools/liv/rive/sleeves/rest_diff.py BEFORE AFTER [OUT_DIR for diff pictures]
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
HERE = Path(__file__).resolve().parent.parent
SCALE, CX, CY, SH_R, TOL = .62, 40, 36, 115, 10
before, after = Path(sys.argv[1]), Path(sys.argv[2]); out = Path(sys.argv[3]) if len(sys.argv) > 3 else None
for V in ['front', 'tq', 'side', 'tqb', 'back']:
    T = json.loads((HERE / V / f'{V}.json').read_text())
    for case in ('bind', 'rest'):
        a = np.asarray(Image.open(before / V / f'{case}.png').convert('RGB')).astype(int)[:, :740]
        b = np.asarray(Image.open(after / V / f'{case}.png').convert('RGB')).astype(int)[:, :740]
        yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
        sh = np.zeros(a.shape[:2], bool)
        for sd in 'AB':
            if sd in T: sh |= np.hypot(xx - (CX + SCALE * T[sd]['sh'][0]), yy - (CY + SCALE * T[sd]['sh'][1])) < SCALE * SH_R
        bg = np.array([0xF3, 0xEB, 0xDD])
        fig = (np.abs(a - bg).max(-1) > 6) | (np.abs(b - bg).max(-1) > 6)
        ch = np.abs(a - b).max(-1) > TOL
        o = fig & ~sh; i = fig & sh
        print(f'{V:5s} {case:4s}  changed outside the shoulders {100 * (ch & o).sum() / max(o.sum(), 1):5.2f} % of {o.sum()} px'
              f'   inside {100 * (ch & i).sum() / max(i.sum(), 1):5.2f} % of {i.sum()} px')
        if out:
            out.mkdir(parents=True, exist_ok=True); vis = (b * .35 + 160).astype(np.uint8); vis[ch] = [220, 30, 30]
            vis[sh & ~ch] = (vis[sh & ~ch] * .8).astype(np.uint8)
            Image.fromarray(vis).save(out / f'diff_{V}_{case}.png')
