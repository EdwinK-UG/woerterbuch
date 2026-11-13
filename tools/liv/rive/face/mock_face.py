"""Quick Python stand-in for the Rive face rig (same layers, same order, same offsets) for checking the cut art.
Not the deliverable: the Rive renders are. Usage: python3 mock_face.py OUT.png  (writes a sheet of test states)."""
from pathlib import Path
import json, sys, math
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent; ART = HERE / 'art'; PARTS = HERE.parent / 'parts'
J = json.loads((ART / 'tq_face.json').read_text())


def put(canvas, img, x, y, dx=0.0, dy=0.0, sx=1.0, sy=1.0, rot=0.0, pivot=None, alpha=1.0):
    """Draw img (its top-left at view x, y) moved by (dx, dy) and scaled / rotated about pivot."""
    if alpha <= 0.001: return
    px, py = pivot if pivot else (x + img.width / 2, y + img.height / 2)
    c, s = math.cos(rot), math.sin(rot)
    # forward: p' = pivot + R S (p - pivot) + d ; inverse affine for PIL (output -> input) in canvas coords
    a, b, d_, e = c * sx, -s * sy, s * sx, c * sy
    det = a * e - b * d_
    ia, ib, id_, ie = e / det, -b / det, -d_ / det, a / det
    tx, ty = px + dx, py + dy
    # input coords relative to image top-left
    coeffs = (ia, ib, -ia * tx - ib * ty + px - x, id_, ie, -id_ * tx - ie * ty + py - y)
    layer = img.transform(canvas.size, Image.AFFINE, coeffs, resample=Image.BILINEAR)
    if alpha < 1:
        arr = np.asarray(layer).copy(); arr[..., 3] = (arr[..., 3] * alpha).astype(np.uint8); layer = Image.fromarray(arr)
    canvas.alpha_composite(layer)


def lidfill(canvas, eye, d):
    if d <= 0.05: return
    col = tuple(int(eye['lid_colour'][i:i + 2], 16) for i in (1, 3, 5))
    arr = np.zeros((canvas.height, canvas.width, 4), np.uint8)
    for x, top, edge in eye['fill_cols']:
        xi = int(x); y0 = int(math.floor(top)); y1 = int(math.ceil(edge + d))
        arr[y0:y1, xi] = [*col, 255]
    canvas.alpha_composite(Image.fromarray(arr))


IMG = {}
def im(n):
    if n not in IMG: IMG[n] = Image.open(ART / n).convert('RGBA')
    return IMG[n]


def face(st):
    H = J['head']
    cv = Image.new('RGBA', (1024, 1536), (191, 217, 230, 255))
    cv.alpha_composite(Image.open(PARTS / 'tq_head.png'), (H['x'], H['y']))
    for en in ('F', 'N'):
        E = J['eyes'][en]; bx, by = E['box'][:2]; cx, cy = E['center']
        sc = st.get('scale' + en, 1.0)
        layer = Image.new('RGBA', cv.size, (0, 0, 0, 0))
        put(layer, im(f'tq_eye{en}_sclera.png'), bx, by)
        put(layer, im(f'tq_eye{en}_iris.png'), bx, by, st.get('ix' + en, 0), st.get('iy' + en, 0), st.get('is' + en, 1), st.get('is' + en, 1), pivot=E['center'])
        lidfill(layer, E, st.get('lid' + en, 0))
        put(layer, im(f'tq_eye{en}_lash.png'), bx, by, 0, st.get('lid' + en, 0))
        put(layer, im(f'tq_eye{en}_frame.png'), bx, by)
        cb = E['closed_box']; put(layer, im(f'tq_eye{en}_closed.png'), cb[0], cb[1], alpha=st.get('closed' + en, 0))
        hb = E['happy_box']; put(layer, im(f'tq_eye{en}_happy.png'), hb[0], hb[1], alpha=st.get('happy' + en, 0))
        if sc != 1: layer = layer.transform(cv.size, Image.AFFINE, (1 / sc, 0, cx - cx / sc, 0, 1 / sc, cy - cy / sc), resample=Image.BILINEAR)
        cv.alpha_composite(layer)
    for bn in ('F', 'N'):
        B = J['brows'][bn]
        if B['hole']: put(cv, im(B['hole']), *B['box'][:2])
        put(cv, im(B['img']), *B['box'][:2], st.get('bx' + bn, 0), st.get('by' + bn, 0), rot=st.get('br' + bn, 0), pivot=B['pivot'])
    M = J['mouth']
    m = st.get('mouth', 'painted')
    if m == 'painted': put(cv, im('tq_mouth_painted.png'), *M['painted_box'][:2])
    else:
        ox, oy = M['pack_origin']; c = M['c']
        put(cv, im(f'mouth_{m}.png'), c[0] + ox, c[1] + oy, st.get('mdx', 0), st.get('mdy', 0), M['sx'] * st.get('msx', 1), st.get('msy', 1), M['tilt'] + st.get('mr', 0), pivot=c)
    return cv


if __name__ == '__main__':
    states = [('rest', {}), ('lid 10', {'lidN': 10, 'lidF': 9}), ('lid 20', {'lidN': 20, 'lidF': 18}),
              ('closed', {'closedN': 1, 'closedF': 1}), ('happy', {'happyN': 1, 'happyF': 1}),
              ('look L', {'ixN': -7, 'ixF': -2.6}), ('look R', {'ixN': 2.5, 'ixF': 1.1}), ('look U', {'iyN': -2.5, 'iyF': -2.2}),
              ('look D', {'iyN': 2.5, 'iyF': 2.2}), ('wide', {'scaleN': 1.08, 'scaleF': 1.06, 'isN': .9, 'isF': .9}),
              ('brows up', {'byN': -9, 'byF': -8}), ('brows sad', {'brN': -0.25, 'brF': 0.25, 'byN': -3, 'byF': -3})]
    tiles = []
    for name, st in states:
        f = face(st).crop((470, 250, 650, 440)).resize((540, 570), Image.LANCZOS); tiles.append(f)
    W = 4; sheet = Image.new('RGBA', (540 * W, 570 * math.ceil(len(tiles) / W)), 'white')
    for i, t in enumerate(tiles): sheet.paste(t, ((i % W) * 540, (i // W) * 570))
    sheet.save(sys.argv[1] if len(sys.argv) > 1 else '/tmp/mock.png')
    # rest must equal the head
    a = np.asarray(face({}).convert('RGB')).astype(int); b = Image.new('RGBA', (1024, 1536), (191, 217, 230, 255)); b.alpha_composite(Image.open(PARTS / 'tq_head.png'), (J['head']['x'], J['head']['y']))
    pm = J['mouth']['painted_box']; bb = b.copy(); bb.alpha_composite(Image.open(ART / 'tq_mouth_painted.png'), tuple(pm[:2]))
    for bn in ('N',): B = J['brows'][bn]; bb.alpha_composite(Image.open(ART / B['img']), tuple(B['box'][:2]))
    d = np.abs(a - np.asarray(bb.convert('RGB')).astype(int)).max(axis=2)
    print('rest vs pack: max diff', d.max(), 'pixels > 12:', int((d > 12).sum()))
