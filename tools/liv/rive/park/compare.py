"""Render the Rive test project at the comparison frames and diff them with the canvas references.

    python3 tools/liv/rive/park/compare.py [path/to/rive]      # -> preview/rive_<route>_cam<X>.png, cmp_*.png, prints mean diffs
The references preview/ref_<route>_cam<X>.png come from ref.html?batch=1 (served by ref_server.py): film-park.js itself, Liv off.
"""
import subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent; PROJ = HERE / 'park-scenery-test'; P = HERE / 'preview'
RIVE = sys.argv[1] if len(sys.argv) > 1 else 'rive'
CAMS = ['0', '3', '6', '10', '-2.5']
for cx in CAMS:
    for r in ('into', 'within'):
        into = r == 'into'
        cmds = (f'data camX={cx}\ndata route={0 if into else 1}\ndata goal={1 if into else 0}\ndata t=3\n'
                f"data tag={'in den Park · Wohin?' if into else 'im Park · Wo?'}\nadvance 33.333ms\nscreenshot {P}/rive_{r}_cam{cx}.png\nquit\n")
        subprocess.run([RIVE, '.', '--commands'], cwd=PROJ, input=cmds, text=True, capture_output=True, check=True)
        a = Image.open(P / f'ref_{r}_cam{cx}.png').convert('RGB'); b = Image.open(P / f'rive_{r}_cam{cx}.png').convert('RGB')
        d = np.abs(np.asarray(a).astype(int) - np.asarray(b).astype(int)).sum(2); d[:, 790:970] = 0   # the Liv stand-in
        print(f'{r:6s} camX {cx:>4s}  mean |diff| {d.mean():.2f}  pixels > 60: {int((d > 60).sum())}')
        if (r, cx) in (('into', '0'), ('into', '-2.5'), ('within', '3'), ('within', '10')):
            w, h = a.size; c = Image.new('RGB', (w // 2, h // 2 * 3))
            c.paste(a.resize((w // 2, h // 2)), (0, 0)); c.paste(b.resize((w // 2, h // 2)), (0, h // 2))
            c.paste(Image.fromarray(np.clip(d, 0, 255).astype('uint8')).convert('RGB').resize((w // 2, h // 2)), (0, h))
            c.save(P / f'cmp_{r}_cam{cx}.png')
