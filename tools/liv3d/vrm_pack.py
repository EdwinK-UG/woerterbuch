"""Pack a finished VRM for the web: the same model, a smaller download.

    python3 tools/liv3d/vrm_pack.py tools/liv3d/models/liv.vrm grammatik/liv/liv.vrm

Run it after vrm_fit.py. Only the storage changes, nothing that shows:
  textures   WebP (EXT_texture_webp) instead of PNG: colour lossy at high quality, alpha kept exactly, so the cut-out
             edges (MASK) stay where they were; normal maps lossless
  indices    16 bit where the mesh has fewer than 65536 vertices
  skin       joint numbers as bytes, weights as normalized bytes (core glTF, no extension needed)
PNG does not shrink under the server's gzip; WebP is 3 to 5 times smaller. Every browser that runs the scenes
(WebGL 2 and import maps) reads WebP.
"""
import argparse, io, os, sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from vrm_fit import GLB  # noqa: E402

Q_COLOUR = 92


def webp(im, lossless):
    f = io.BytesIO()
    if lossless: im.save(f, 'WEBP', lossless=True, quality=100, method=6, exact=True)
    else: im.save(f, 'WEBP', quality=Q_COLOUR, alpha_quality=100, method=6, exact=True)
    return f.getvalue()


def textures(g):
    j = g.j; normal = set()
    for m in j['materials']:
        if 'normalTexture' in m: normal.add(j['textures'][m['normalTexture']['index']]['source'])
    thumb = j['extensions']['VRMC_vrm']['meta'].get('thumbnailImage')
    before = after = 0
    for i, im in enumerate(j['images']):
        if i == thumb: continue                                      # the thumbnail stays PNG: other tools show it
        raw = g.views[im['bufferView']]; pic = Image.open(io.BytesIO(raw)); pic.load()
        if pic.mode not in ('RGB', 'RGBA'): pic = pic.convert('RGBA' if 'A' in pic.getbands() else 'RGB')
        if pic.mode == 'RGBA' and np.asarray(pic)[..., 3].min() == 255: pic = pic.convert('RGB')
        out = webp(pic, lossless=i in normal or max(pic.size) <= 16)
        if len(out) >= len(raw): continue
        before += len(raw); after += len(out)
        g.views[im['bufferView']] = out; im['mimeType'] = 'image/webp'
        for t in j['textures']:
            if t.get('source') == i:
                t.setdefault('extensions', {})['EXT_texture_webp'] = {'source': i}; del t['source']
    for k in ('extensionsUsed', 'extensionsRequired'):
        if 'EXT_texture_webp' not in j.setdefault(k, []): j[k].append('EXT_texture_webp')
    print(f'textures: {before / 1e6:.2f} MB PNG -> {after / 1e6:.2f} MB WebP')


def put(g, i, arr, normalized=False):
    """Store accessor i with new data (same count and type); its old buffer view is left for drop_unused."""
    a = g.j['accessors'][i]; arr = np.ascontiguousarray(arr)
    g.views.append(arr.tobytes()); g.j['bufferViews'].append({'buffer': 0, 'byteLength': arr.nbytes, 'target': g.j['bufferViews'][a['bufferView']].get('target', 34962)})
    a['bufferView'] = len(g.views) - 1; a['byteOffset'] = 0; a['componentType'] = {np.uint8: 5121, np.uint16: 5123, np.uint32: 5125}[arr.dtype.type]
    if normalized: a['normalized'] = True
    else: a.pop('normalized', None)


def geometry(g):
    j = g.j; done = set(); saved = 0
    for me in j['meshes']:
        for pr in me['primitives']:
            pos = pr['attributes']['POSITION']; nv = j['accessors'][pos]['count']
            jobs = [('indices', pr['indices'])] + [(k, v) for k, v in pr['attributes'].items() if k.startswith(('JOINTS_', 'WEIGHTS_'))]
            for kind, i in jobs:
                if i in done or 'sparse' in j['accessors'][i]: continue
                done.add(i); a = j['accessors'][i]; old = len(g.views[a['bufferView']]); x = g.acc(i)
                if kind == 'indices':
                    if nv >= 65536 or a['componentType'] != 5125: continue
                    put(g, i, x.astype(np.uint16).ravel())
                elif kind.startswith('JOINTS_'):
                    if x.max() > 255 or a['componentType'] == 5121: continue
                    put(g, i, x.astype(np.uint8))
                else:
                    if a['componentType'] != 5126: continue
                    w = np.clip(x, 0, None); s = w.sum(1, keepdims=True); w = np.where(s > 0, w / np.maximum(s, 1e-12), [[1, 0, 0, 0]])
                    q = np.floor(w * 255 + 0.5).astype(np.int32)
                    for r in np.where(q.sum(1) != 255)[0]:                     # sums exactly 255: the largest weight takes the rest
                        q[r, np.argmax(w[r])] += 255 - q[r].sum()
                    put(g, i, q.astype(np.uint8), normalized=True)
                saved += old - len(g.views[-1])
    print(f'geometry: {saved / 1e6:.2f} MB less (16-bit indices, byte joints and weights)')


def drop_unused(g):
    j = g.j; used = set()
    for im in j['images']: used.add(im['bufferView'])
    for a in j['accessors']:
        if 'bufferView' in a: used.add(a['bufferView'])
        if 'sparse' in a: used.update((a['sparse']['indices']['bufferView'], a['sparse']['values']['bufferView']))
    vmap = {o: n for n, o in enumerate(sorted(used))}
    for im in j['images']: im['bufferView'] = vmap[im['bufferView']]
    for a in j['accessors']:
        if 'bufferView' in a: a['bufferView'] = vmap[a['bufferView']]
        if 'sparse' in a:
            for k in ('indices', 'values'): a['sparse'][k]['bufferView'] = vmap[a['sparse'][k]['bufferView']]
    j['bufferViews'] = [j['bufferViews'][o] for o in sorted(used)]; g.views = [g.views[o] for o in sorted(used)]


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--no-textures', action='store_true'); ap.add_argument('--no-geometry', action='store_true')
    o = ap.parse_args(); g = GLB(o.src); n0 = os.path.getsize(o.src)
    if not o.no_textures: textures(g)
    if not o.no_geometry: geometry(g)
    drop_unused(g); n = g.save(o.dst)
    print(f'{o.dst}: {n0 / 1e6:.2f} MB -> {n / 1e6:.2f} MB')


if __name__ == '__main__':
    main()
