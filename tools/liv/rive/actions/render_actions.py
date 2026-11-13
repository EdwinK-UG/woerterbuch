"""Render Liv's actions frame by frame with the Rive CLI and make contact sheets (for checking, see docs/liv-actions.md).

    python3 tools/liv/rive/actions/render_actions.py PROJECT OUT VIEW [action ...] [--step 3] [--zoom] [--prop N]

VIEW 0..4 (front, three-quarter, side, three-quarter back, back). For every action: set `action`, take a frame every
--step thirtieths of a second (3 = 1/10 s) over its whole duration plus 0.4 s after (she must be back at rest), then one
contact sheet per action (OUT/sheet_<view>_<action>.png). --zoom crops the sheet to the character.
"""
import subprocess, sys, re
from pathlib import Path
from PIL import Image, ImageDraw

RIVE = '/Users/edwin/Documents/Codex/2026-11-02/i-x20/work/rive-tools/rive'
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent)); from actions_rig import ACTIONS
DUR = {}
for m in re.finditer(r"def\('(\w+)', ([\d.]+)", (HERE.parent / 'actions.luau').read_text()): DUR[m.group(1)] = float(m.group(2))
VIEWN = ['front', 'tq', 'side', 'tqb', 'back']


def main():
    a = sys.argv[1:]
    step = 3; prop = None; mirror = 0; gait = 0
    if '--step' in a: i = a.index('--step'); step = int(a[i + 1]); del a[i:i + 2]
    if '--prop' in a: i = a.index('--prop'); prop = a[i + 1]; del a[i:i + 2]
    if '--mirror' in a: a.remove('--mirror'); mirror = 1
    if '--gait' in a: i = a.index('--gait'); gait = int(a[i + 1]); del a[i:i + 2]
    proj, out, view = Path(a[0]), Path(a[1]).resolve(), int(a[2])
    names = a[3:] or ACTIONS
    out.mkdir(parents=True, exist_ok=True)
    L = [f'data view={view}', f'data mirror={mirror}', f'data gait={gait}']
    L += ['advance 33.333ms'] * 45
    frames = {}
    for n in names:
        idx = ACTIONS.index(n) + 1
        if prop is not None: L.append(f'data prop={prop}'); L += ['advance 33.333ms'] * 10
        L.append(f'data action={idx}')
        total = int(round((DUR[n] + 0.4) * 30)); fr = []
        L.append(f'screenshot {out}/{VIEWN[view]}_{n}_000.png'); fr.append(f'{out}/{VIEWN[view]}_{n}_000.png')
        for k in range(1, total + 1):
            L.append('advance 33.333ms')
            if k % step == 0:
                p = f'{out}/{VIEWN[view]}_{n}_{k:03d}.png'; L.append(f'screenshot {p}'); fr.append(p)
        frames[n] = fr
        L += ['advance 33.333ms'] * 9
        L.append(f'data-dump {out}/{VIEWN[view]}_{n}_end.json')
    L.append('quit')
    r = subprocess.run([RIVE, str(proj), '--commands'], input='\n'.join(L) + '\n', text=True, capture_output=True, timeout=1800)
    if r.returncode: print(r.stdout[-1500:], r.stderr[-1500:])
    for n, fr in frames.items(): sheet(fr, out / f'sheet_{VIEWN[view]}_{n}.png', f'{n} · {VIEWN[view]} · every {step / 30:.2f} s')


def sheet(paths, dst, title, box=(20, 40, 740, 1010), cols=8, w=210):
    ims = []
    for p in paths:
        try: ims.append(Image.open(p).convert('RGB').crop(box))
        except FileNotFoundError: pass
    if not ims: return
    h = int(w * (box[3] - box[1]) / (box[2] - box[0]))
    rows = (len(ims) + cols - 1) // cols
    S = Image.new('RGB', (cols * w, rows * (h + 16) + 24), (255, 255, 255)); d = ImageDraw.Draw(S)
    d.text((6, 4), title, fill=(60, 40, 30))
    for i, im in enumerate(ims):
        x, y = (i % cols) * w, 24 + (i // cols) * (h + 16)
        S.paste(im.resize((w, h), Image.LANCZOS), (x, y)); d.text((x + 4, y + h + 1), f'{i}', fill=(120, 100, 90))
    S.save(dst)


if __name__ == '__main__':
    main()
