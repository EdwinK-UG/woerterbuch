"""A preview video of the action buttons: clicks the demo window's buttons with the Rive CLI (`pointer click@x,y`), takes
every frame at 30 fps, marks each click with a ring, and encodes an mp4 with ffmpeg.

    python3 tools/liv/rive/actions/make_video.py tools/liv/rive/liv OUT.mp4 [FRAMES_DIR]
"""
import subprocess, sys, tempfile
from pathlib import Path
from PIL import Image, ImageDraw

RIVE = '/Users/edwin/Documents/Codex/2026-11-02/i-x20/work/rive-tools/rive'
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent)); from actions_rig import ACTIONS


def act(name):            # the action button's centre (actions_rig.buttons: 3 columns from x 806, rows from y 562)
    i = ACTIONS.index(name); return 806 + (i % 3) * 92, 562 + (i // 3) * 30
VIEW = {'front': (860, 120), 'tq': (860, 174), 'side': (860, 228), 'tqb': (860, 282), 'back': (860, 336)}
PROP = {'apple': (1130, 830), 'crate': (1130, 864), 'saw': (1130, 898), 'empty': (1130, 932)}
WALK, STOP = (1130, 624), (1130, 732)

# (seconds, button) in order
SCRIPT = [(0.5, act('wave')), (3.3, act('clap')), (5.9, act('cheer')), (8.5, act('think')),
          (11.8, VIEW['front']), (13.0, act('point')), (15.2, act('shrug')), (17.6, act('bow')),
          (20.2, VIEW['side']), (21.2, PROP['apple']), (22.2, act('throw')), (24.0, act('kick')), (25.6, act('sit')),
          (29.0, VIEW['tqb']), (30.0, act('dance')),
          (33.6, VIEW['back']), (34.6, act('cheer')),
          (37.4, VIEW['tq']), (38.4, act('carry')), (40.6, WALK), (44.6, act('wave')), (47.6, STOP), (49.4, PROP['empty']),
          (50.6, act('jump'))]
END = 53.0


def main():
    proj, out = Path(sys.argv[1]), Path(sys.argv[2]).resolve()
    fdir = Path(sys.argv[3]) if len(sys.argv) > 3 else Path(tempfile.mkdtemp(prefix='liv-video-'))
    fdir.mkdir(parents=True, exist_ok=True)
    n = int(END * 30); clicks = {int(round(t * 30)): xy for t, xy in SCRIPT}
    L = []
    for k in range(n):
        if k in clicks: L.append('pointer click@%d,%d' % clicks[k])
        L.append('advance 33.333ms'); L.append(f'screenshot {fdir}/v{k:05d}.png')
    L.append('quit')
    subprocess.run([RIVE, str(proj), '--commands'], input='\n'.join(L) + '\n', text=True, capture_output=True, timeout=3600)
    for k in range(n):                                      # a ring where the button was clicked, fading over 0.5 s
        for kc, (x, y) in clicks.items():
            if 0 <= k - kc < 15:
                p = fdir / f'v{k:05d}.png'; im = Image.open(p).convert('RGB'); d = ImageDraw.Draw(im)
                r = 14 + (k - kc) * 1.2; a = 1 - (k - kc) / 15
                d.ellipse([x - r, y - r, x + r, y + r], outline=(int(200 * a + 55), 80, 61), width=3); im.save(p)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '30', '-i', f'{fdir}/v%05d.png', '-c:v', 'libx264',
                    '-pix_fmt', 'yuv420p', '-crf', '23', '-vf', 'scale=1240:1020', str(out)], check=True)
    print('wrote', out, n, 'frames')


main()
