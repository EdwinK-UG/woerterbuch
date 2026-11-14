"""Sleeve stress test: render every view in arm poses that strain the sleeves and shoulder joins, crop both shoulders at 3x.

    python3 tools/liv/rive/sleeves/stress.py tools/liv/rive/liv OUT [views...]      # views: front tq side tqb back (default all)
    python3 tools/liv/rive/sleeves/stress.py --sheet BEFORE AFTER OUT                 # before / after contact sheets

Per view and case: OUT/<view>/<case>.png (full frame), <case>.json (view-model dump), <case>_A.png / _B.png (shoulder crops 3x),
and OUT/sheet_<view>_<n>.jpg (cases side by side). A shoulder's screen place is the bind shoulder turned with the spine.
"""
import json, math, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent.parent
RIVE = '/Users/edwin/Documents/Codex/2026-11-02/i-x20/work/rive-tools/rive'
VIEWS = ['front', 'tq', 'side', 'tqb', 'back']
SCALE, CX, CY = .62, 40, 36
ZOOM, HALF = 3, 84                     # crop 168 x 168 stage px around a shoulder, shown 3x

# (name, steps, seconds to advance): poses are pose numbers (poses3d.py), actions are action numbers (docs/liv-actions.md)
CASES = [
    ('rest', ['pose=0'], 1.2),
    ('bind', ['pose=7'], 1.2),
    ('p_wave', ['pose=1'], 1.2),
    ('p_reach', ['pose=2'], 1.2),
    ('p_cheer', ['pose=3'], 1.2),
    ('p_hands', ['pose=6'], 1.2),
    ('a_wave', ['action=1'], 1.0),
    ('a_point', ['action=2'], 1.0),
    ('a_pointUp', ['action=3'], 1.0),
    ('a_clap', ['action=5'], 0.75),
    ('a_think', ['action=7'], 1.4),
    ('a_cheer', ['action=8'], 0.9),
    ('a_hips', ['action=9'], 1.0),
    ('a_present', ['action=10'], 1.0),
    ('a_stop', ['action=11'], 1.0),
    ('a_jump', ['action=17'], 0.55),
    ('a_carry', ['prop=2', 'action=19'], 1.2),
    ('a_push', ['action=20'], 1.2),
    ('a_throwBack', ['prop=1', 'action=22'], 0.45),
    ('a_throwFwd', ['prop=1', 'action=22'], 0.8),
    ('a_dance', ['action=25'], 1.1),
    ('a_ouch', ['action=27'], 0.7),
]


def render(proj, out, views):
    D = json.loads((Path(proj) / 'defaults.json').read_text())
    for V in views:
        T = json.loads((HERE / V / f'{V}.json').read_text())
        od = (Path(out) / V).resolve(); od.mkdir(parents=True, exist_ok=True)
        lines = [f'data view={VIEWS.index(V)}', *['advance 33.333ms'] * 45]
        for name, sets, t in CASES:
            lines += [f'data {s}' for s in sets] + ['advance 33.333ms'] * int(round(t * 30))
            lines += [f'screenshot {od}/{name}.png', f'data-dump {od}/{name}.json']
            lines += ['data action=0', 'data pose=0', 'data prop=0'] + ['advance 33.333ms'] * 75
        lines.append('quit')
        r = subprocess.run([RIVE, str(proj), '--commands'], input='\n'.join(lines) + '\n', text=True, capture_output=True, timeout=900)
        if r.returncode: print(r.stdout[-800:], r.stderr[-800:])
        rest_spine = D['ctrl'][V]['rest']['spineRot']
        for name, _, _ in CASES:
            d = json.loads((od / f'{name}.json').read_text())
            vals = {p['name']: p['value'] for p in d['viewModel']['properties']}
            px, py, sr = vals[V + '_pelvisX'], vals[V + '_pelvisY'], vals[V + '_spineRot'] - rest_spine
            im = Image.open(od / f'{name}.png').convert('RGB')
            for sd in 'AB':
                if sd not in T: continue
                dx, dy = T[sd]['sh'][0] - T['pelvis'][0], T[sd]['sh'][1] - T['pelvis'][1]
                c, s = math.cos(sr), math.sin(sr)
                x, y = px + c * dx - s * dy, py + s * dx + c * dy
                if vals.get('mirror', 0) >= .5: x = 1024 - x
                X, Y = CX + SCALE * x, CY + SCALE * y + 12
                im.crop((int(X - HALF), int(Y - HALF), int(X + HALF), int(Y + HALF))).resize((2 * HALF * ZOOM,) * 2, Image.LANCZOS).save(od / f'{name}_{sd}.png')
        print(V, 'done')


def sheet(before, after, out, per=4):
    out = Path(out); out.mkdir(parents=True, exist_ok=True)
    tile = 2 * HALF * ZOOM
    for V in VIEWS:
        names = [n for n, _, _ in CASES if (Path(before) / V / f'{n}_A.png').exists()]
        for k in range(0, len(names), per):
            grp = names[k:k + per]
            W = 2 * (tile // 2) + 36; H = len(grp) * (tile // 2 + 26)
            S = Image.new('RGB', (W * 2 + 20, H), 'white'); dr = ImageDraw.Draw(S)
            for i, n in enumerate(grp):
                for j, (lab, src) in enumerate((('before', before), ('after', after))):
                    for q, sd in enumerate('AB'):
                        p = Path(src) / V / f'{n}_{sd}.png'
                        if p.exists():
                            S.paste(Image.open(p).resize((tile // 2, tile // 2)), (j * (W + 20) + q * (tile // 2 + 6), i * (tile // 2 + 26) + 22))
                    dr.text((j * (W + 20) + 4, i * (tile // 2 + 26) + 4), f'{V} {n} {lab}  (shoulder A | B)', fill='black')
            S.save(out / f'sheet_{V}_{k // per}.jpg', quality=88)


if __name__ == '__main__':
    if sys.argv[1] == '--sheet': sheet(*sys.argv[2:5])
    else: render(sys.argv[1], sys.argv[2], [v for v in sys.argv[3:]] or VIEWS)
