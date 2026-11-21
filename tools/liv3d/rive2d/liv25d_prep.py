# Liv 2.5D · prepares what tools/liv3d/demo/liv25d-export.js rendered for the Rive build (liv25d_build.py).
#   python3 liv25d_prep.py SRC OUT
# SRC holds l25_<piece>.png, l25_<piece>_z.png, l25_face_<expression>.png and l25_meta.json.
# Writes OUT/<piece>.webp (cropped), OUT/depth_<piece>.npy (the piece's depth over the whole artboard, in pixels,
# smoothed and carried on past its outline), OUT/ov_<expression>.webp (what an expression changes in the face, on
# the face's own crop) and OUT/liv25d.json.
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

SRC, OUT = sys.argv[1:3]; os.makedirs(OUT, exist_ok=True)
M = json.load(open(f'{SRC}/l25_meta.json')); W, H, S, ZR = M['W'], M['H'], M['S'], M['ZR']
rgba = lambda n: np.array(Image.open(f'{SRC}/l25_{n}.png').convert('RGBA'))

def depth(name, alpha, sigma):
    """World depth of a piece in artboard pixels: where the piece is drawn, blurred inside its outline (a hair's breadth
    of noise would otherwise tilt single bones), and beyond the outline the nearest value."""
    t = np.array(Image.open(f'{SRC}/l25_{name}_z.png').convert('RGB')).astype(np.float64)
    z = ((t[..., 0] * 256 + t[..., 1]) / 65535 * 2 * ZR - ZR) * S; ok = (t[..., 2] > 128) & (alpha > 128)
    num = ndimage.gaussian_filter(np.where(ok, z, 0.0), sigma); den = ndimage.gaussian_filter(ok.astype(np.float64), sigma)
    zs = np.where(den > 1e-3, num / np.maximum(den, 1e-3), 0.0)
    idx = ndimage.distance_transform_edt(~ok, return_distances=False, return_indices=True)
    zs = zs[idx[0], idx[1]]; return ndimage.gaussian_filter(zs, sigma / 2).astype(np.float32)

def crop_box(alpha, pad=3):
    ys, xs = np.nonzero(alpha > 8); return [max(int(xs.min()) - pad, 0), max(int(ys.min()) - pad, 0), min(int(xs.max()) + pad + 1, W), min(int(ys.max()) + pad + 1, H)]

def save(name, t, box, scale=1.0, quality=82):
    # scale: the picture is stored smaller and drawn larger (the back hair: little of it shows, and none of it sharp)
    im = Image.fromarray(t[box[1]:box[3], box[0]:box[2]], 'RGBA'); im.save(f'{OUT}/{name}.png')
    if scale != 1: im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    im.save(f'{OUT}/{name}.webp', quality=quality, method=6, alpha_quality=75)
    return {'x': box[0], 'y': box[1], 'w': box[2] - box[0], 'h': box[3] - box[1], 'scale': scale, 'webp': os.path.getsize(f'{OUT}/{name}.webp')}

pieces, order = {}, []
# group: what a piece turns with ('hair' turns with the head a moment late). view: the capture it comes from; at: the
# turn of that capture. A capture's pieces show from half way to the capture before to half way to the next.
VIEWS = M['views']
for base, zbase, group, sigma in (('hairB', 'hairB', 'hair', 7), ('body', 'body', 'body', 6), ('face', 'skin', 'head', 5), ('hairF', 'hairF', 'hair', 5)):
    for v in (['z'] if base == 'body' else list(VIEWS)):
        name = f'{v}_{base}'; t = rgba(name)
        if base == 'body':
            # The neck goes up under the jaw. The body's mesh also holds the skull (it lies under the hair, painted like
            # it): above the jaw line nothing is kept, and around the neck's top only what has the neck's own colour.
            hy = int(M['joints']['head'][1]); cx = int(M['joints']['neck'][0]); t[:hy - 25] = 0
            # (by brightness: the neck in the jaw's shadow is darker skin, the skull's underside darker still; and no
            # specks: what is left of an outline between the two)
            zone = t[hy - 25:hy + 48]; zone[zone[..., :3].mean(-1) < 125, 3] = 0
            lab, n = ndimage.label(zone[..., 3] > 128); big = np.isin(lab, [i for i in range(1, n + 1) if (lab == i).sum() > 150])
            zone[~ndimage.binary_opening(big, iterations=2), 3] = 0
        box = crop_box(t[..., 3])
        if base == 'face':                                            # every expression fits the face's crop
            for f in M['faces'][1:]:
                b = crop_box(rgba(f'{v}_face_{f}')[..., 3]); box = [min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3])]
        pieces[name] = {**save(name, t, box, 0.4 if base == 'hairB' else 1.0), 'group': group, 'view': v, 'at': VIEWS[v], 'head': M['jointsAt'][v]['head']}; order.append(name)
        z = depth(f'{v}_{zbase}', t[..., 3], sigma); np.save(f'{OUT}/depth_{name}.npy', z)
        # a coarse copy of the depth for the check page (liv25d-sim.html): one value every G pixels of the crop
        G = 10; pieces[name]['grid'] = {'step': G, 'z': np.round(z[np.ix_(np.minimum(np.arange(box[1], box[3] + G, G), H - 1), np.minimum(np.arange(box[0], box[2] + G, G), W - 1))]).astype(int).tolist()}

# what an expression changes: the pixels that differ from the resting face, a little wider, with a soft edge
overlays = {}
for v in VIEWS:
    fp = pieces[f'{v}_face']; base = rgba(f'{v}_face').astype(np.int32); box = [fp['x'], fp['y'], fp['x'] + fp['w'], fp['y'] + fp['h']]
    for f in M['faces'][1:]:
        t = rgba(f'{v}_face_{f}'); d = np.abs(t.astype(np.int32) - base).max(-1) > 14
        d = ndimage.binary_opening(d, iterations=1); lab, n = ndimage.label(ndimage.binary_dilation(d, iterations=9))
        keep = np.zeros_like(d)
        for i in range(1, n + 1):
            if (d & (lab == i)).sum() > 30: keep |= lab == i
        soft = ndimage.gaussian_filter(ndimage.binary_dilation(keep, iterations=3).astype(np.float64), 2.5)
        t[..., 3] = (t[..., 3] * np.clip(soft * 1.6 - 0.3, 0, 1)).astype(np.uint8)
        overlays[f'{v}_{f}'] = {**save(f'ov_{v}_{f}', t, box, 0.75, 74), 'view': v, 'face': f}

json.dump({'W': W, 'H': H, 'S': S, 'turn': M['turn'], 'body': M['body'], 'tilt': M['tilt'], 'joints': M['joints'], 'views': VIEWS, 'band': 1 / 120, 'step': min(abs(a) for a in VIEWS.values() if a),
           'order': order, 'pieces': pieces, 'overlays': overlays, 'faces': M['faces']}, open(f'{OUT}/liv25d.json', 'w'), indent=1)
print({k: (v['w'], v['h'], v['webp'] // 1024) for k, v in pieces.items()}, 'overlays KB', sum(v['webp'] for v in overlays.values()) // 1024, 'pieces KB', sum(v['webp'] for v in pieces.values()) // 1024)
