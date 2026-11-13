"""Render frames from a Rive project with the CLI's command mode, for checking motion frame by frame.

    python3 tools/liv/rive/render_seq.py PROJECT_DIR OUT_DIR "data pose=1" "adv 1.5" "shot wave" "adv 2 3"

Steps (one argument each):
    data k=v         set a view-model number
    adv S [N]        advance S seconds in 1/30 s steps; with N, screenshot every N-th step (f0000.png, f0001.png ...)
    shot NAME        screenshot NAME.png
    dump NAME        view-model dump NAME.json
"""
import subprocess, sys
from pathlib import Path

RIVE = '/Users/edwin/Documents/Codex/2026-11-02/i-x20/work/rive-tools/rive'


def main():
    proj, out, steps = Path(sys.argv[1]), Path(sys.argv[2]).resolve(), sys.argv[3:]
    out.mkdir(parents=True, exist_ok=True)
    lines, n = [], 0
    for st in steps:
        p = st.split()
        if p[0] == 'data': lines.append(st)
        elif p[0] == 'shot': lines.append(f'screenshot {out}/{p[1]}.png')
        elif p[0] == 'dump': lines.append(f'data-dump {out}/{p[1]}.json')
        elif p[0] == 'adv':
            frames = int(round(float(p[1]) * 30)); every = int(p[2]) if len(p) > 2 else 0
            for i in range(frames):
                lines.append('advance 33.333ms')
                if every and (i + 1) % every == 0: lines.append(f'screenshot {out}/f{n:04d}.png'); n += 1
    lines.append('quit')
    r = subprocess.run([RIVE, str(proj), '--commands'], input='\n'.join(lines) + '\n', text=True, capture_output=True, timeout=600)
    if r.returncode: print(r.stdout[-800:], r.stderr[-800:])
    print('frames', n, 'shots in', out)


main()
