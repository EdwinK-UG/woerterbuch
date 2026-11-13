"""Pack the cut parts into one JavaScript file with WebP data URIs. Usage: python pack.py cut_dir out.js"""
import sys, json, os, io, base64
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
var = sys.argv[3] if len(sys.argv) > 3 else 'LIV_ART'
parts = json.load(open(os.path.join(src, 'parts.json'))); colors = parts.pop('_colors'); meta = parts.pop('_meta', None)
extra = {k[1:]: parts.pop(k) for k in [k for k in parts if k.startswith('_')]}
for name, p in parts.items():
    im = Image.open(os.path.join(src, name + '.png'))
    if name.startswith('sock') or '_sock' in name:  # let the sock run on under the boot so no gap opens when the foot bends
        ext = Image.new('RGBA', (im.width, im.height + 30)); ext.paste(im, (0, 0)); row = im.crop((0, im.height - 6, im.width, im.height - 5))
        for y in range(im.height - 5, im.height + 30): ext.paste(row, (0, y))
        im = ext; p['h'] = im.height
    buf = io.BytesIO(); im.save(buf, 'WEBP', quality=92, method=6); p['src'] = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
open(out, 'w').write('/* Sprite parts cut from the character art by the tools/ scripts. Generated file. */\n' + ('window.' + var[7:] if var.startswith('window.') else 'const ' + var) + ' = ' + json.dumps(dict(parts=parts, colors=colors, meta=meta, extra=extra)) + ';\n')
print(out, os.path.getsize(out) // 1024, 'KB', colors)
