"""Overview sheets: for each action, one row per view with N frames spread over the action (from render_actions.py frames).

    python3 tools/liv/rive/actions/overview.py FRAMES_DIR OUT_DIR [--per 3] [--cols 9] [--w 150] [--views front,tq,side] [action ...]
"""
import sys, glob, re
from pathlib import Path
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent)); from actions_rig import ACTIONS


def main():
    a = sys.argv[1:]
    opt = {'--per': '3', '--cols': '9', '--w': '150', '--views': 'front,tq,side', '--box': '20,40,740,1010'}
    for k in list(opt):
        if k in a: i = a.index(k); opt[k] = a[i + 1]; del a[i:i + 2]
    src, out = Path(a[0]), Path(a[1]); out.mkdir(parents=True, exist_ok=True)
    names = a[2:] or ACTIONS
    per, cols, w = int(opt['--per']), int(opt['--cols']), int(opt['--w'])
    views = opt['--views'].split(',')
    box = tuple(int(x) for x in opt['--box'].split(','))
    h = int(w * (box[3] - box[1]) / (box[2] - box[0]))
    for gi in range(0, len(names), per):
        grp = names[gi:gi + per]
        rows = [(n, v) for n in grp for v in views]
        S = Image.new('RGB', (cols * w + 70, len(rows) * (h + 4)), 'white'); d = ImageDraw.Draw(S)
        for r, (n, v) in enumerate(rows):
            fr = sorted(glob.glob(str(src / f'{v}_{n}_[0-9][0-9][0-9].png')), key=lambda p: int(re.findall(r'_(\d{3})\.png', p)[0]))
            if not fr: continue
            pick = [fr[round(i * (len(fr) - 1) / (cols - 1))] for i in range(cols)]
            d.text((2, r * (h + 4) + 4), f'{n}\n{v}', fill=(60, 40, 30))
            for c, p in enumerate(pick):
                im = Image.open(p).convert('RGB').crop(box).resize((w, h), Image.LANCZOS)
                S.paste(im, (70 + c * w, r * (h + 4)))
        S.save(out / f'ov_{"_".join(grp)}.png')


main()
