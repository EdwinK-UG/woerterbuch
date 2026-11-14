"""Make a narrated preview video of one park scene from recorded frames.

    python3 tools/liv3d/park/make_video.py goal|location FRAMES_DIR OUT.mp4 [PRIVATE_DIR]

FRAMES_DIR holds rec_<scene>_0000.jpg ... at 30 frames a second, written through demo/shot_server.py from the preview page:

    const R = __renderer; window.__rec = async (scene, f0, f1) => { R.setPixelRatio(1); R.setSize(1280, 720, false);
      for (let f = f0; f < f1; f++) { __seek(scene, f / 30); const b = await new Promise((r) => R.domElement.toBlob(r, 'image/jpeg', 0.93));
        await fetch('/save?name=rec_' + scene + '_' + String(f).padStart(4, '0') + '.jpg', { method: 'POST', body: b }); } };
    await __rec('goal', 0, 674); await __rec('location', 0, 791);      // in chunks if the page is slow
 PRIVATE_DIR (default tools/liv3d/park/.local) is the private lesson material: the narration clips,
the captions and the example sentence. They are read here at run time and drawn onto the frames, like the preview page
does; the video is private lesson material too and must not be committed.
"""
import json, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

FPS = 30; GOAL = (217, 98, 43); PLACE = (47, 93, 80); INK = (58, 28, 12); PAPER = (255, 250, 240)
TAGS = {'goal': 'in den Park · Wohin?', 'location': 'im Park · Wo?'}


def font(size, bold=True):
    for path, idx in (('/System/Library/Fonts/Avenir Next.ttc', 0 if bold else 5), ('/System/Library/Fonts/Helvetica.ttc', 1 if bold else 0)):
        try: return ImageFont.truetype(path, size, index=idx)
        except Exception: pass
    return ImageFont.load_default()


def wrap(d, text, f, width):
    lines, cur = [], ''
    for w in text.split():
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=f) <= width or not cur: cur = t
        else: lines.append(cur); cur = w
    return lines + [cur]


def main():
    scene, frames, out = sys.argv[1], Path(sys.argv[2]), sys.argv[3]
    priv = Path(sys.argv[4] if len(sys.argv) > 4 else Path(__file__).parent / '.local')
    lessons = json.load(open(priv / 'data/lessons.json')); man = json.load(open(priv / 'data/audio-manifest.json')); ov = json.load(open(priv / 'overlay/visual-overlay.json'))
    key = 'space-park-' + scene; sc = next(s for s in lessons['lessons']['B2-109']['scenes'] if s['id'] == key); au = next(s for s in man['lessons']['B2-109']['scenes'] if s['id'] == key)
    sr = man['sampleRate']; cues = [dict(say=c['say'], start=a['startInScene'] / sr, plan=ov['films']['B2-109']['cues'].get(c['id'], {}).get('visual', {}).get('sentencePlan', [])) for c, a in zip(sc['cues'], au['cues'])]
    length = au['pcmFrames'] / sr; col = GOAL if scene == 'goal' else PLACE
    files = sorted(frames.glob(f'rec_{scene}_*.jpg')); n = min(len(files), int(length * FPS) + 1)
    tmp = Path(tempfile.mkdtemp(prefix='parkvid_'))
    for k in range(n):
        t = k / FPS; im = Image.open(files[k]).convert('RGBA'); W, H = im.size; u = W / 1280; lay = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
        i = max(j for j, c in enumerate(cues) if t >= c['start'] - 1e-6); cue = cues[i]; end = cues[i + 1]['start'] if i + 1 < len(cues) else length; fr = (t - cue['start']) / (end - cue['start'])
        plan = None
        for q in cue['plan']:
            if fr >= q['cueFraction']: plan = q
        toks = sc[plan['source']] if plan else sc['from']; em = plan['emphasis'] if plan else []
        # the tag
        f = font(int(22 * u)); tw = d.textlength(TAGS[scene], font=f) + 34 * u; th = 40 * u; x = W - tw - 20 * u; y = 16 * u
        d.rounded_rectangle([x, y, x + tw, y + th], radius=th / 2, fill=PAPER + (245,), outline=col + (255,), width=max(2, int(2.5 * u)))
        d.text((x + tw / 2, y + th / 2), TAGS[scene], font=f, fill=col + (255,), anchor='mm')
        # the sentence
        f = font(int(31 * u), True); fs = font(int(15 * u)); pad = 12 * u; gap = 12 * u; ws = [d.textlength(tk['text'], font=f) + 14 * u for tk in toks]
        sw = sum(ws) + gap * (len(toks) - 1) + 2 * pad; sh = 78 * u; x0 = 20 * u; y0 = 16 * u
        d.rounded_rectangle([x0, y0, x0 + sw, y0 + sh], radius=14 * u, fill=PAPER + (245,)); x = x0 + pad
        for j, tk in enumerate(toks):
            on = j in em
            if on: d.rounded_rectangle([x, y0 + 8 * u, x + ws[j], y0 + sh - 8 * u], radius=9 * u, fill=col + (255,))
            d.text((x + ws[j] / 2, y0 + (27 if on else 39) * u), tk['text'], font=f, fill=(255, 255, 255, 255) if on else INK + (255,), anchor='mm')
            if on and tk.get('label'): d.text((x + ws[j] / 2, y0 + 56 * u), tk['label'], font=fs, fill=(255, 255, 255, 255), anchor='mm')
            x += ws[j] + gap
        # the caption
        f = font(int(24 * u), False); lines = wrap(d, cue['say'], f, W * 0.8); lh = 32 * u; bw = max(d.textlength(l, font=f) for l in lines) + 36 * u; bh = lh * len(lines) + 18 * u; bx = (W - bw) / 2; by = H - bh - 22 * u
        d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=12 * u, fill=(42, 30, 22, 212))
        for j, l in enumerate(lines): d.text((W / 2, by + 9 * u + lh * (j + 0.5)), l, font=f, fill=(255, 248, 236, 255), anchor='mm')
        Image.alpha_composite(im, lay).convert('RGB').save(tmp / f'f{k:04d}.jpg', quality=93)
    lst = tmp / 'audio.txt'; lst.write_text(''.join(f"file '{(priv / c['wav']).resolve()}'\n" for c in au['cues']))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', str(tmp / 'f%04d.jpg'), '-f', 'concat', '-safe', '0', '-i', str(lst),
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out], check=True)
    print(f'wrote {out}: {n} frames, {length:.2f} s of narration')


main()
