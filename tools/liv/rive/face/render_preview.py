"""Render the face test project in the Rive runtime (rive . --commands) and build the previews in face/preview/.

    python3 tools/liv/rive/face/render_preview.py sheet        # contact sheet of the ten expressions (3x crops) + 64 px row
    python3 tools/liv/rive/face/render_preview.py states       # look / blink / wink / wide test crops
    python3 tools/liv/rive/face/render_preview.py transitions  # 1/30 s frames of expression changes
    python3 tools/liv/rive/face/render_preview.py video        # mp4: every expression, then a blink / look / wink run
    python3 tools/liv/rive/face/render_preview.py all
Every picture here is a screenshot of the Rive runtime, not a Python composite.
"""
from pathlib import Path
import json, subprocess, sys, tempfile, shutil
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
PROJ = HERE / 'liv-face-test'
PREV = HERE / 'preview'; PREV.mkdir(exist_ok=True)
RIVE = '/Users/edwin/Documents/Codex/2026-11-02/i-x20/work/rive-tools/rive'
L = json.loads((PROJ / 'layout.json').read_text())
FACE = [round(v) for v in L['face_crop']]; HEAD = [round(v) for v in L['head_crop']]
NAMES = L['expressions']
FONT = ImageFont.truetype(str(HERE.parent / 'liv-tq/Inter.ttf'), 22)
FRAME = 'advance 33.333ms'


def run(lines, tmp):
    """Run the project headless with the given command lines; returns nothing (screenshots land where they say)."""
    cmd = '\n'.join(lines + ['quit']) + '\n'
    r = subprocess.run([RIVE, '.', '--commands'], input=cmd, text=True, cwd=PROJ, capture_output=True, timeout=1800)
    if 'error' in r.stdout.lower() and 'errors' not in r.stdout.lower():
        print(r.stdout[-2000:])


def frames(n): return [FRAME] * n


def click(name):
    """Press a test button (the runtime's 'data' command cannot follow a screenshot in one run, so the view model
    is changed through the buttons, as a user would)."""
    x, y = L['buttons'][name]
    return f'pointer click@{x},{y}'


LOOK = {(-1, 0): 'Look Left', (1, 0): 'Look Right', (0, 1): 'Look Up', (0, -1): 'Look Down', (0, 0): 'Look Centre'}


def settle(n=12): return ['data faceIdle=0'] + frames(n)


def label(im, text):
    d = ImageDraw.Draw(im); d.rectangle([0, 0, im.width, 34], fill=(243, 235, 221)); d.text((10, 5), text, fill=(76, 64, 56), font=FONT)
    return im


def sheet(tmp):
    lines = ['data faceIdle=0', 'data autoBlink=0'] + frames(3)
    for i, n in enumerate(NAMES):
        lines += [click(n)] + frames(9) + [f'screenshot {tmp}/e{i}.png']
    run(lines, tmp)
    crops, smalls = [], []
    for i, n in enumerate(NAMES):
        im = Image.open(f'{tmp}/e{i}.png').convert('RGB')
        c = im.crop(FACE); s = 3 / L['scale'] * 0.62           # 3x of the stage rig's size (the rig draws view px at 0.62)
        crops.append(label(c.resize((round(c.width * s), round(c.height * s)), Image.LANCZOS), f'{i} {n}'))
        h = im.crop(HEAD); smalls.append(h.resize((round(h.width * 64 / h.height), 64), Image.LANCZOS))
    cw, ch = crops[0].size
    out = Image.new('RGB', (cw * 5, ch * 2 + 110), (243, 235, 221))
    for i, c in enumerate(crops): out.paste(c, ((i % 5) * cw, (i // 5) * ch))
    x = 10
    for s in smalls: out.paste(s, (x, ch * 2 + 30)); x += s.width + 14
    ImageDraw.Draw(out).text((x + 10, ch * 2 + 50), 'the same at 64 px tall', fill=(76, 64, 56), font=FONT)
    out.save(PREV / 'expressions-3x.png')
    s1 = Image.new('RGB', (sum(s.width + 8 for s in smalls), 64), (243, 235, 221)); x = 0
    for s in smalls: s1.paste(s, (x, 0)); x += s.width + 8
    s1.save(PREV / 'expressions-64px.png')
    print('wrote', PREV / 'expressions-3x.png')


def states(tmp):
    seq = [('look left', 'data lookX=-1'), ('look right', 'data lookX=1'), ('look up', 'data lookY=1'), ('look down', 'data lookY=-1'),
           ('blink mid (2 frames in)', None), ('blink closed', None), ('wink', None), ('nod tilt', 'data nod=1')]
    lines = ['data faceIdle=0', 'data autoBlink=0'] + frames(4)
    lines += [click('Look Left')] + frames(8) + [f'screenshot {tmp}/s0.png', click('Look Right')] + frames(8) + [f'screenshot {tmp}/s1.png',
              click('Look Up')] + frames(8) + [f'screenshot {tmp}/s2.png', click('Look Down')] + frames(8) + [f'screenshot {tmp}/s3.png',
              click('Look Centre')] + frames(8) + [click('Blink'), FRAME, f'screenshot {tmp}/s4.png', FRAME, FRAME, f'screenshot {tmp}/s5.png'] + frames(10) + \
             [click('Wink eye')] + frames(6) + [f'screenshot {tmp}/s6.png'] + frames(20) + [click('Nod')] + frames(16) + [f'screenshot {tmp}/s7.png']
    run(lines, tmp)
    crops = []
    for i, (n, _) in enumerate(seq):
        c = Image.open(f'{tmp}/s{i}.png').convert('RGB').crop(FACE); s = 3 / L['scale'] * 0.62
        crops.append(label(c.resize((round(c.width * s), round(c.height * s)), Image.LANCZOS), n))
    cw, ch = crops[0].size
    out = Image.new('RGB', (cw * 4, ch * 2), 'white')
    for i, c in enumerate(crops): out.paste(c, ((i % 4) * cw, (i // 4) * ch))
    out.save(PREV / 'look-blink-wink-3x.png'); print('wrote', PREV / 'look-blink-wink-3x.png')


def transitions(tmp):
    pairs = [(0, 3), (3, 5), (5, 4), (4, 8), (8, 9)]
    lines = ['data faceIdle=0', 'data autoBlink=0'] + frames(3)
    for k, (a, b) in enumerate(pairs):
        lines += [click(NAMES[a])] + frames(12) + [click(NAMES[b])]
        for j in range(8): lines += [FRAME, f'screenshot {tmp}/t{k}_{j}.png']
    run(lines, tmp)
    rows = []
    for k, (a, b) in enumerate(pairs):
        cs = []
        for j in range(8):
            c = Image.open(f'{tmp}/t{k}_{j}.png').convert('RGB').crop(FACE); s = 0.5
            cs.append(c.resize((round(c.width * s), round(c.height * s)), Image.LANCZOS))
        row = Image.new('RGB', (cs[0].width * 8, cs[0].height + 30), (243, 235, 221))
        ImageDraw.Draw(row).text((6, 2), f'{NAMES[a]} -> {NAMES[b]}, frames 1-8 at 1/30 s', fill=(76, 64, 56), font=FONT)
        for j, c in enumerate(cs): row.paste(c, (j * c.width, 30))
        rows.append(row)
    out = Image.new('RGB', (rows[0].width, sum(r.height for r in rows)), 'white'); y = 0
    for r in rows: out.paste(r, (0, y)); y += r.height
    out.save(PREV / 'transitions.png'); print('wrote', PREV / 'transitions.png')


def video(tmp):
    lines = ['data faceIdle=1'] + frames(2); n = [0]
    def shoot(k):
        for _ in range(k): lines.extend([FRAME, f'screenshot {tmp}/v{n[0]:05d}.png']); n[0] += 1
    shoot(30)
    for n_ in NAMES:
        lines.append(click(n_)); shoot(45)
    lines.append(click('Happy')); shoot(20)
    for lk in [(-1, 0), (1, 0), (0, 1), (0, -1), (0, 0)]:
        lines.append(click(LOOK[lk])); shoot(22)
    lines.append(click('Blink')); shoot(20); lines.append(click('Wink eye')); shoot(30)
    lines.append(click('Nod')); shoot(60); lines.append(click('Still')); shoot(20)
    run(lines, tmp)
    fr = Path(tmp) / 'crop'; fr.mkdir(exist_ok=True)
    big = [HEAD[0] - 10, HEAD[1] - 10, HEAD[2] + 10, HEAD[3] + 10]
    big[2] += (big[2] - big[0]) % 2; big[3] += (big[3] - big[1]) % 2
    for i in range(n[0]):
        Image.open(f'{tmp}/v{i:05d}.png').convert('RGB').crop(big).save(fr / f'{i:05d}.png')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '30', '-i', str(fr / '%05d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18',
                    str(PREV / 'liv-face.mp4')], check=True)
    print('wrote', PREV / 'liv-face.mp4', n[0], 'frames')


if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'all'
    tmp = tempfile.mkdtemp(prefix='livface', dir=sys.argv[2] if len(sys.argv) > 2 else None)
    try:
        for name, fn in (('sheet', sheet), ('states', states), ('transitions', transitions), ('video', video)):
            if what in (name, 'all'): fn(tmp)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
