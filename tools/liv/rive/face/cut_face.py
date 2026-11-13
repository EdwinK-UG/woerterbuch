"""Cut Liv's animatable face parts from the pack's own pixels (no redrawing of her likeness, no generative models).

    python3 tools/liv/rive/face/cut_face.py [view]       # default view: tq  ->  tools/liv/rive/face/art/<view>_*.png
                                                        #                      tools/liv/rive/face/art/<view>_face.json

What the pack gives for the three-quarter view (parts/parts.json):
  tq_head.png   the head with BOTH eyes painted open, the FAR brow painted, the near brow and the mouth already
                removed (skin painted over them in the pack)
  tq_brow0.png  the near brow, tq_mouth.png the painted closed smile, mouth_0..8.png the nine pack mouths,
  tq_blink0/1   skin patches with a closed lash line (blink1, the far eye, shows streaks of the open eye: replaced)

What this script makes, per eye (all aligned to the head image, in VIEW pixels of the 1024 x 1536 pack frame):
  frame   the head's own pixels around the eye with a hole where the eye is (eye white, iris, lash). It sits on top of
          the moving layers below it, so they can only be seen through the hole: nothing can leave the eye.
  lash    the upper lash (and the light lid rim under it): moves down to close the eye (half, sleepy, sad, blink)
  iris    the iris with its highlight, cut along its ellipse: moves for eye direction
  sclera  the eye white with the iris and lash removed (filled by diffusion from the eye white's own pixels)
  closed  a skin patch with the closed lash (near: the pack's blink0; far: made here from the head's skin + blink0's
          lash squeezed to the far eye's width)
  happy   the same patch with an upward arc (laughing / winking eye), drawn here in the lash colour of the art
and for the far brow, which is still painted in the head: brow image (matted from the skin) + a hole patch (skin filled
by diffusion) that covers the painted brow. The lid filler is a flat swatch of the skin painted just above each eye (<view>_eye<N>_lidfill.png).

Everything is local pixel processing: masks from colour classes, Neumann diffusion (Laplace) for fills, alpha matting
of dark ink over skin. The same steps run for another view by adding a CFG entry (boxes, iris ellipse guesses, hair
edge limits).
"""
from pathlib import Path
import json, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

HERE = Path(__file__).resolve().parent
PARTS_DIR = HERE.parent / 'parts'
ART = HERE / 'art'; ART.mkdir(exist_ok=True)
PARTS = json.loads((PARTS_DIR / 'parts.json').read_text())
INK = (31, 10, 1)            # lash core colour sampled from tq_head (darker than the outline #3a1c0c, as painted)

# Per view: boxes in HEAD-IMAGE pixels (x0, y0, x1, y1), iris ellipse guess (cx, cy, rx, ry) refined by a fit,
# xmax = last column of the eye (hair begins after it), look = iris travel in px, travel = lid travel in px.
CFG = {
    'tq': {
        'head': 'tq_head',
        'eyes': {
            'N': {'box': (228, 184, 298, 260), 'iris': (268.0, 220.5, 12.5, 19.0), 'xmax': None, 'closed': 'tq_blink0',
                  'look': {'xl': -7.0, 'xr': 2.5, 'yu': -2.5, 'yd': 2.5}, 'travel': 31.0,
                  'happy': {'p0': (238.5, 225.0), 'p1': (264.0, 201.0), 'p2': (289.0, 222.5), 'w': 3.6}},
            'F': {'box': (324, 184, 351, 254), 'iris': (338.5, 217.0, 7.5, 17.0), 'xmax': 350, 'closed': None,
                  'look': {'xl': -2.6, 'xr': 1.1, 'yu': -2.2, 'yd': 2.2}, 'travel': 29.0,
                  'happy': {'p0': (328.5, 222.0), 'p1': (339.0, 200.0), 'p2': (349.5, 219.0), 'w': 2.9}},
        },
        # far brow: box and the hair edge (x at the top row, x at the bottom row): the brow ends where the hair starts
        'browcut': {'F': {'box': (329, 152, 357, 171), 'edge': (354.5, 350.5)}},
        'brows': {'N': 'tq_brow0'},
        'mouth': {'painted': 'tq_mouth', 'c': (577.0, 406.0), 'sx': 0.8, 'tilt': -0.04},
    },
    # front: two eyes of the same size, both brows are pack parts, both closed patches exist (front_blink0/1)
    'front': {
        'head': 'front_head',
        'eyes': {
            'N': {'box': (152, 184, 214, 256), 'iris': (186.5, 222.0, 13.5, 18.5), 'xmax': None, 'closed': None,                # front_blink0/1 show faint outlines of the open eye: made here
                  'look': {'xl': -6.5, 'xr': 1.8, 'yu': -2.5, 'yd': 2.5}, 'travel': 31.0,
                  'happy': {'p0': (161.0, 226.0), 'p1': (186.0, 202.0), 'p2': (211.0, 224.0), 'w': 3.6}},
            'F': {'box': (258, 184, 322, 256), 'iris': (281.3, 221.5, 13.5, 19.0), 'xmax': None, 'closed': None, 'mirror': True,
                  'look': {'xl': -1.8, 'xr': 6.5, 'yu': -2.5, 'yd': 2.5}, 'travel': 31.0,
                  'happy': {'p0': (262.0, 224.0), 'p1': (287.0, 202.0), 'p2': (312.0, 226.0), 'w': 3.6}},
        },
        'browcut': {},
        'brows': {'N': 'front_brow0', 'F': 'front_brow1'},
        'mouth': {'painted': 'front_mouth', 'c': (515.0, 401.0), 'sx': 1.0, 'tilt': 0.0},   # 7 px below the canvas engine's point: the pack mouths then sit on the painted smile's line
    },
    # side (profile, facing right): one eye, the brow is painted in the head (cut here), the mouth is a profile mouth
    # drawn in code (profile_mouths) at the lips of the face contour
    'side': {
        'head': 'side_head',
        'eyes': {
            'N': {'box': (300, 184, 346, 252), 'iris': (330.5, 220.0, 6.5, 19.5), 'xmax': None, 'closed': None,                # side_blink0 shows a streak of the open eye: made here
                  'look': {'xl': -6.0, 'xr': 0.6, 'yu': -2.2, 'yd': 2.2}, 'travel': 30.0,
                  'happy': {'p0': (311.0, 224.0), 'p1': (325.0, 201.0), 'p2': (339.0, 219.0), 'w': 3.4}},
        },
        'browcut': {'N': {'box': (297, 156, 346, 192), 'edge': (400.0, 400.0), 'seed': (330, 163)}},
        'brows': {},
        'mouth': {'painted': 'side_mouth', 'profile': True},
    },
}

# palette for the drawn profile mouths (from the pack, see docs/liv-rive-handoff.md)
MOUTH_INK, MOUTH_IN, TONGUE, TEETH = (0x3a, 0x1c, 0x0c), (0x8c, 0x3a, 0x2c), (0xe0, 0x7a, 0x66), (0xfb, 0xf4, 0xe8)


def lum(a):
    return (a[..., 0] * 0.3 + a[..., 1] * 0.6 + a[..., 2] * 0.1)


def skin_mask(a):
    """Skin (lit or shaded, with blush), not the cream eye white, not ink, not hair."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (a[..., 3] > 0) & (r > 215) & (g < 210) & (g > 135) & (r - b > 70) & (lum(a) > 165)


def diffuse(img, unknown, source, iters=1500):
    """Neumann Laplace fill: unknown pixels become the average of their unknown or source neighbours; pixels in neither
    set (hair, ink, outside) are ignored, so a fill never bleeds their colour."""
    out = img.astype(float).copy()
    use = unknown | source
    # start from the mean of the nearest source pixels (fast convergence)
    idx = ndi.distance_transform_edt(~source, return_distances=False, return_indices=True)
    out[unknown] = img[idx[0], idx[1]][unknown]
    w = use.astype(float)
    for _ in range(iters):
        acc = np.zeros_like(out); cnt = np.zeros(out.shape[:2])
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            acc += np.roll(out * w[..., None], (dy, dx), (0, 1)); cnt += np.roll(w, (dy, dx), (0, 1))
        new = acc / np.maximum(cnt, 1e-6)[..., None]
        out[unknown] = new[unknown]
    return out


def soft(mask, sigma=0.6):
    return np.clip(ndi.gaussian_filter(mask.astype(float), sigma) * 1.0, 0, 1)


def ellipse_cov(shape, cx, cy, rx, ry, ss=4):
    """Anti-aliased coverage of an axis-aligned ellipse (supersampled)."""
    H, W = shape
    ys = (np.arange(H * ss) + 0.5) / ss; xs = (np.arange(W * ss) + 0.5) / ss
    X, Y = np.meshgrid(xs, ys)
    inside = ((X - cx - 0.5) / rx) ** 2 + ((Y - cy - 0.5) / ry) ** 2 <= 1.0
    return inside.reshape(H, ss, W, ss).mean(axis=(1, 3))


def stroke(shape, pts, widths, ss=4):
    """Anti-aliased tapered stroke along a polyline (pixel-centre coordinates)."""
    H, W = shape
    im = Image.new('L', (W * ss, H * ss), 0); d = ImageDraw.Draw(im)
    for (x, y), w in zip(pts, widths):
        r = w * ss / 2
        d.ellipse([(x + 0.5) * ss - r, (y + 0.5) * ss - r, (x + 0.5) * ss + r, (y + 0.5) * ss + r], fill=255)
    return np.asarray(im.resize((W, H), Image.LANCZOS)).astype(float) / 255


def bez(p0, p1, p2, n=80):
    t = np.linspace(0, 1, n)[:, None]
    return (1 - t) ** 2 * np.array(p0) + 2 * (1 - t) * t * np.array(p1) + t ** 2 * np.array(p2), t[:, 0]


def fill_cols(cols, top, edge, ox, oy, pad=3, xmax=None):
    """Lid filler columns (x, top, edge) in view px, padded sideways by `pad` columns and 3 px upward, so the stretched
    filler covers the whole hole the lash leaves (including the soft ring around it)."""
    out = []
    c0, c1 = int(cols[0]), int(cols[-1])
    for c in range(c0 - pad, (c1 + pad if xmax is None else min(c1 + pad, xmax)) + 1):
        k = min(max(c, c0), c1)
        while np.isnan(top[k]): k += 1 if c < c0 else -1
        out.append([float(c + ox), float(top[k] + oy - 5.0), float(edge[k] + oy + 0.5)])
    return out


def save(arr_rgb, alpha, name):
    a = np.dstack([np.clip(arr_rgb, 0, 255), np.clip(alpha * 255, 0, 255)]).round().astype(np.uint8)
    Image.fromarray(a, 'RGBA').save(ART / name)


def profile_mouths(view, pm):
    """Profile mouths for a side view, drawn in code in the art's palette (the pack's mouths are front views). Each sits
    at the lips of the face contour (the pack's contour per row, parts.json _meta.<view>.edge) and never paints outside
    the face: the drawing is clipped to the contour, as the canvas engine's profile wedge. Slots use the names of the
    pack mouths they replace, so face.luau's expression table works unchanged:
      0 closed smile, 1 flat, 0f corners down (sad), 8 open laugh, 5 open round (surprised), 4f teeth, corners down."""
    ed = PARTS['_meta'][view]['edge']; xs = ed['xs']; y0e = ed['y0']
    def edge_x(y): return xs[int(np.clip(round(y) - y0e, 0, len(xs) - 1))] + 0.5
    BX, BY, W, H = 598, 386, 44, 38                                  # image box in view px
    SS = 8
    notch = (edge_x(403) - 0.6, 403.0)                               # where the lips meet on the contour
    clip = np.zeros((H * SS, W * SS), bool)
    for j in range(H * SS):
        y = BY + (j + 0.5) / SS; ex = edge_x(y) - 1.4                  # stay inside the contour's ink line
        clip[j, :] = (BX + (np.arange(W * SS) + 0.5) / SS) < ex
    def P(x, y): return ((x - BX) * SS, (y - BY) * SS)
    def curve(p0, p1, p2, n=60):
        pts, _ = bez(p0, p1, p2, n); return [P(*q) for q in pts]
    def layer(): return Image.new('L', (W * SS, H * SS), 0)
    def strokes(pairs, img):
        d = ImageDraw.Draw(img)
        for pts, w0, w1 in pairs:            # width tapers from w0 (first point) to w1
            for k, (x, y) in enumerate(pts):
                w = (w0 + (w1 - w0) * k / max(1, len(pts) - 1)) * SS / 2
                d.ellipse([x - w, y - w, x + w, y + w], fill=255)
        return img
    def poly(pts, img):
        ImageDraw.Draw(img).polygon(pts, fill=255); return img
    def compose(layers):
        rgb = np.zeros((H * SS, W * SS, 3)); a = np.zeros((H * SS, W * SS))
        for colour, m in layers:                                   # bottom first
            m = (np.asarray(m).astype(float) / 255) * clip
            rgb = rgb * (1 - m[..., None]) + np.array(colour) * m[..., None]; a = a + m * (1 - a)
        rgb = np.where(a[..., None] > 0, rgb, 0)
        big = np.dstack([rgb * a[..., None], a])
        small = big.reshape(H, SS, W, SS, 4).mean(axis=(1, 3))
        al = small[..., 3]; col = small[..., :3] / np.maximum(al[..., None], 1e-6)
        return col, al
    ex, ey = notch
    def closed(p0, p1, w0=1.3, w1=2.6, tick=None):
        L = strokes([(curve(p0, p1, (ex + 2, ey)), w0, w1)], layer())
        if tick: strokes([(curve(p0, ((p0[0] + tick[0]) / 2, (p0[1] + tick[1]) / 2), tick, 12), 2.2, 1.2)], L)
        return [(MOUTH_INK, L)]
    def opened(corner, top_mid, top_end, bot_mid, bot_end, teeth_top=0.0, teeth_bot=0.0, tongue=True, mid_line=False):
        top = curve(corner, top_mid, top_end); bot = curve(corner, bot_mid, bot_end)
        far = [P(ex + 6, top_end[1]), P(ex + 6, bot_end[1])]
        hole = poly(top + far + bot[::-1], layer())
        out_ = [(MOUTH_IN, hole)]
        if tongue:
            tg = layer(); ImageDraw.Draw(tg).ellipse([*P(corner[0] + 7, bot_end[1] - 5.5), *P(ex + 4, bot_end[1] + 3)], fill=255)
            out_.append((TONGUE, Image.fromarray(np.minimum(np.asarray(tg), np.asarray(hole)))))
        for amt, ref, sgn in ((teeth_top, top, 1), (teeth_bot, bot, -1)):
            if amt <= 0: continue
            band = poly(ref + [(x, y + sgn * amt * SS) for x, y in ref[::-1]], layer())
            tz = np.asarray(band) * (np.arange(W * SS)[None, :] > (corner[0] + 4 - BX) * SS)
            out_.append((TEETH, Image.fromarray(np.minimum(tz, np.asarray(hole)).astype(np.uint8))))
        if mid_line:
            mid = curve(((corner[0] + 4), (top_mid[1] + bot_mid[1]) / 2), ((corner[0] + ex) / 2, (top_mid[1] + bot_mid[1]) / 2 + .5), (ex + 2, (top_end[1] + bot_end[1]) / 2))
            out_.append((MOUTH_INK, strokes([(mid, 0.9, 0.9)], layer())))
        out_.append((MOUTH_INK, strokes([(top, 1.6, 2.4), (bot, 1.6, 2.2)], layer())))
        return out_
    shapes = {
        '0': closed((609.0, 398.5), (620.0, 405.8), tick=(606.8, 396.6)),
        '1': closed((609.5, 403.6), (622.0, 404.4), 1.5, 2.5, tick=(608.0, 403.2)),
        '0f': closed((612.0, 408.5), (622.0, 401.0), 1.4, 2.4, tick=(610.6, 410.2)),
        '8': opened((609.0, 398.0), (621.0, 403.0), (ex + 2, 401.0), (614.0, 418.0), (ex + 2, 417.0), teeth_top=2.6),
        '5': opened((617.0, 405.0), (618.5, 395.5), (ex + 2, 397.5), (619.5, 417.0), (ex + 2, 415.5)),
        '4f': opened((612.0, 406.5), (620.0, 399.5), (ex + 2, 400.0), (621.0, 411.0), (ex + 2, 410.0), teeth_top=4.2, teeth_bot=4.2, tongue=False, mid_line=True),
    }
    for name, layers in shapes.items():
        col, al = compose(layers); save(col, al, f'{view}_mouth_{name}.png')
    return {'c': [ex, ey], 'sx': 1.0, 'tilt': 0.0, 'painted_box': [pm['x'], pm['y'], pm['w'], pm['h']],
            'boxes': {n: [BX, BY, W, H] for n in shapes}, 'profile': True}


def fit_iris(a, box, guess, eye):
    """Refine the iris ellipse from the dark iris body (rows below the lash, where its sides are clean)."""
    cx, cy, rx, ry = guess
    x0, y0, x1, y1 = box
    sub = a[y0:y1, x0:x1]
    dark = (lum(sub) < 150) & eye[y0:y1, x0:x1]
    pts = []
    for yy in range(int(cy - 0.35 * ry), int(cy + 0.95 * ry)):
        row = dark[yy - y0]
        c = int(round(cx)) - x0
        if not row[c] and not row[max(0, c - 3)]: continue
        l = c
        while l > 0 and (row[l - 1] or (l - 2 >= 0 and row[l - 2])): l -= 1
        r = c
        while r < row.size - 1 and (row[r + 1] or (r + 2 < row.size and row[r + 2])): r += 1
        if abs((l + r) / 2 + x0 - cx) > 4: continue
        pts += [(l + x0 - 0.5, yy), (r + x0 + 0.5, yy)]
    for xx in range(int(cx - 0.5 * rx), int(cx + 0.5 * rx) + 1):
        col = dark[:, xx - x0]; c = int(cy) - y0
        b = c
        while b < col.size - 1 and col[b + 1]: b += 1
        pts.append((xx, b + y0 + 0.5))
    P = np.array(pts, float)
    # (x-cx)^2/rx^2 + (y-cy)^2/ry^2 = 1  ->  A x^2 + B y^2 + C x + D y = 1
    M = np.c_[P[:, 0] ** 2, P[:, 1] ** 2, P[:, 0], P[:, 1]]
    A, B, C, D = np.linalg.lstsq(M, np.ones(len(P)), rcond=None)[0]
    fcx, fcy = -C / (2 * A), -D / (2 * B)
    k = 1 + A * fcx ** 2 + B * fcy ** 2
    frx, fry = np.sqrt(k / A), np.sqrt(k / B)
    if not (abs(fcx - cx) < 3 and abs(fcy - cy) < 4 and 0.7 < frx / rx < 1.3 and 0.7 < fry / ry < 1.3):
        print('  iris fit rejected, using guess', (fcx, fcy, frx, fry)); return guess
    return float(fcx), float(fcy), float(frx), float(fry)


def cut_view(view):
    C = CFG[view]
    hp = PARTS[C['head']]; HX, HY = hp['x'], hp['y']
    head = np.asarray(Image.open(PARTS_DIR / f"{C['head']}.png")).astype(float)
    rgb = head[..., :3]
    out = {'view': view, 'head': {'x': HX, 'y': HY, 'w': hp['w'], 'h': hp['h']}, 'eyes': {}, 'brows': {}, 'mouth': {}}
    skin = skin_mask(head)
    lid_col = np.median(rgb[skin], axis=0)
    blink0 = np.asarray(Image.open(PARTS_DIR / 'tq_blink0.png')).astype(float)     # lash matte for a generated closed eye

    for en, E in C['eyes'].items():
        x0, y0, x1, y1 = E['box']
        sub = head[y0:y1, x0:x1]; srgb = sub[..., :3]; H, W = sub.shape[:2]
        sk = skin_mask(sub)
        cand = ~sk & (sub[..., 3] > 200)
        if E['xmax'] is not None: cand[:, E['xmax'] + 1 - x0:] = False
        lab, n = ndi.label(cand)
        ic = (int(E['iris'][1]) - y0, int(E['iris'][0]) - x0)
        eye = ndi.binary_fill_holes(lab == lab[ic])
        # small closing so the light lid rim between lash and iris is part of the eye
        eye = ndi.binary_fill_holes(ndi.binary_closing(eye, iterations=1)) & (sub[..., 3] > 200)
        if E['xmax'] is not None: eye[:, E['xmax'] + 1 - x0:] = False
        full_eye = np.zeros(head.shape[:2], bool); full_eye[y0:y1, x0:x1] = eye
        icx, icy, irx, iry = fit_iris(head, E['box'], E['iris'], full_eye)
        print(f'{view} eye {en}: iris ellipse ({icx:.1f}, {icy:.1f}) r ({irx:.1f}, {iry:.1f}), eye px {eye.sum()}')
        lx, ly = icx - x0, icy - y0
        iris_cov = ellipse_cov((H, W), lx - 0.5, ly - 0.5, irx + 0.7, iry + 0.7)   # 0.7 px wider: keeps the full ink outline
        iris_in = iris_cov > 0.5
        L = lum(sub)
        sclera_cls = eye & ~iris_in & (L > 175)
        # lid edge per column: the first eye-white or iris pixel below the lash; columns without either (the outer
        # corner's outline) belong to the lid down to the bottom of the eye
        ys = np.arange(H)
        edge = np.full(W, np.nan); top = np.full(W, np.nan); bot = np.full(W, np.nan)
        for c in range(W):
            col = eye[:, c]
            if not col.any(): continue
            t0 = ys[col][0]; top[c] = t0; bot[c] = ys[col][-1]
            below = (sclera_cls[:, c] | (iris_cov[:, c] > 0.98)) & (ys > t0 + 1)
            edge[c] = ys[below][0] if below.any() else bot[c] + 1
        # smooth the edge (median, then a 5-column mean where both neighbours are opening columns): a clean lid line
        valid = ~np.isnan(edge)
        e2 = edge.copy()
        for c in np.where(valid)[0]:
            nb = [edge[k] for k in range(max(0, c - 1), min(W, c + 2)) if valid[k]]
            e2[c] = np.median(nb)
        opening = valid & np.array([(sclera_cls[:, c] | (iris_cov[:, c] > 0.98)).any() for c in range(W)])
        e3 = e2.copy()
        for c in np.where(opening)[0]:
            nb = [e2[k] for k in range(max(0, c - 2), min(W, c + 3)) if opening[k]]
            e3[c] = float(np.mean(nb))
        edge = e3
        # the lash: everything above the lid edge, plus the dark lash ends that curl down beside the iris (not the
        # iris' own outline: inside the iris ellipse shrunk by 1.2 px)
        iris_core = ellipse_cov((H, W), lx - 0.5, ly - 0.5, max(irx - 1.2, 1), max(iry - 1.2, 1)) > 0.5
        lash = np.zeros((H, W), bool); lash_frac = np.zeros((H, W))
        for c in np.where(valid)[0]:
            lash[:, c] = eye[:, c] & (ys < np.floor(edge[c]))
            lash_frac[:, c] = np.clip(edge[c] - ys, 0, 1) * eye[:, c]
        curl = eye & (L < 150) & ~iris_in & (ys[:, None] < ly) & ~sclera_cls
        curl = curl & ndi.binary_dilation(lash, iterations=12)
        lash = lash | curl
        lash_bot = np.array([ys[lash[:, c]][-1] + 1.0 if lash[:, c].any() else np.nan for c in range(W)])
        # soft masks (the hole is the eye grown by 2 px, so the light rim around the lash is inside it)
        up = np.array([[0, 1, 0], [1, 1, 1], [0, 0, 0]], bool)
        lash_d = ndi.binary_dilation(lash, structure=up, iterations=4) & ~(eye & ~lash)
        hole = ndi.binary_dilation(eye, iterations=2) | lash_d
        h_soft = np.maximum(soft(hole, 0.55), hole * 1.0)
        lash_a = np.clip(np.maximum.reduce([lash_d * 1.0, lash_frac, curl * 1.0, soft(curl, 0.5)]), 0, 1)
        # the light lid rim under the dark lash stays where it is painted (moving it onto the iris gives a dotted
        # light line); the lid filler covers it once the lid comes down
        tail = np.zeros((H, W), bool)
        for c in np.where(valid)[0]:
            dk = np.where(lash[:, c] & (L[:, c] < 150))[0]
            if dk.size: tail[:, c] = (ys > dk[-1]) & (lash[:, c] | (lash_frac[:, c] > 0)) & ~curl[:, c]
        if E['xmax'] is not None:
            # the far eye's outer edge runs into the face contour and the hair: it stays painted where it is (static,
            # in the eye-white layer) instead of sliding down with the lid
            tail = tail | (lash & (np.arange(W)[None, :] >= E['xmax'] - 2 - x0))
        lash_a = lash_a * ~tail
        # the lid's skin: what is painted just above this eye's lash
        band = np.zeros((H, W), bool)
        for c in np.where(valid)[0]:
            band[:, c] = (ys >= top[c] - 9) & (ys <= top[c] - 4)
        lid_col = np.median(srgb[band & sk], axis=0) if (band & sk).sum() > 20 else np.median(rgb[skin], axis=0)
        # bottom edge of the lash: 1 px soft transition into the eye white / iris
        # frame: head pixels, hole where the eye is, feathered box border (it scales with the eye for 'wide')
        yy, xx = np.mgrid[0:H, 0:W]
        border = np.minimum.reduce([xx, W - 1 - xx, yy, H - 1 - yy]).astype(float)
        feather = np.clip(border / 5.0, 0, 1)
        if E['xmax'] is not None:   # never paint hair from the frame: it does not move, the head below has it
            hair = ~ndi.binary_dilation(skin_mask(sub) | eye, iterations=2) | (xx > E['xmax'] + 1)
            feather = feather * ~hair
        frame_a = (1 - h_soft) * feather
        if E['xmax'] is not None:   # nothing of the eye's moving layers may show over the hair beside it
            keep = np.clip(E['xmax'] + 1.5 - xx, 0, 1)
            lash_a = lash_a * keep; iris_cov = iris_cov * keep
        save(srgb, frame_a, f'{view}_eye{en}_frame.png')
        # lash layer: head pixels (lash + the lid rim), alpha from the lash mask
        save(srgb, lash_a, f'{view}_eye{en}_lash.png')
        # iris: head pixels inside the ellipse; under the lash the head holds lash colour, kept (reads as the iris'
        # shaded top when the iris moves down)
        ring = ~iris_core
        iris_a = iris_cov * np.where(ring, np.clip((205 - L) / 70, 0, 1), 1.0)     # no light eye-white rim on the iris' edge
        save(srgb, iris_a, f'{view}_eye{en}_iris.png')
        # sclera: eye white with iris and lash filled from the eye white's own pixels
        unknown = (ndi.binary_dilation(iris_in, iterations=1) | lash | (eye & (L <= 175))) & ndi.binary_dilation(eye, iterations=3)
        source = sclera_cls & ~ndi.binary_dilation(iris_in, iterations=1) & ~unknown
        scl = diffuse(srgb, unknown, source, 1200)
        # gentle shade under the upper lid (as painted on the visible eye white)
        sh = np.zeros((H, W))
        for c in np.where(valid)[0]:
            d = ys - edge[c]; sh[:, c] = np.clip(1 - d / 6.0, 0, 1) * (d >= -2)
        scl = scl * (1 - 0.10 * sh[..., None]) + np.array([200, 150, 120]) * 0.10 * sh[..., None]
        scl_a = np.clip(soft(ndi.binary_dilation(eye, iterations=3), 0.6) * 1.0 + ndi.binary_dilation(eye, iterations=2), 0, 1)
        if E['xmax'] is not None: scl_a = scl_a * np.clip(E['xmax'] + 1.5 - xx, 0, 1)
        # above the lid edge the sclera layer is only ever seen while the lid is lowered: give it lid skin there
        above = np.zeros((H, W), bool)
        for c in range(W):
            e_ = edge[c] if valid[c] else np.nan
            if np.isnan(e_):
                near = np.where(valid)[0]; e_ = edge[near[np.argmin(np.abs(near - c))]]
            above[:, c] = ys < e_ - 0.5
        scl_rgb = np.where(unknown[..., None], scl, srgb)
        scl_rgb = np.where(((above | lash) & ~tail)[..., None], lid_col, scl_rgb)
        scl_rgb = np.where(tail[..., None], srgb, scl_rgb)
        save(scl_rgb, scl_a, f'{view}_eye{en}_sclera.png')

        # closed patches: skin fill of the whole eye, plus a closed lash (near: the pack's own patch)
        skin_unknown = ndi.binary_dilation(eye, iterations=3)
        skin_src = skin_mask(sub) & ~skin_unknown
        skin_fill = diffuse(srgb, skin_unknown, skin_src, 1500)
        patch_a = np.clip(soft(ndi.binary_dilation(eye, iterations=4), 1.2) * 1.15, 0, 1) * (sub[..., 3] / 255)
        if E['xmax'] is not None: patch_a = patch_a * ~(xx > E['xmax'] + 1) * np.clip((E['xmax'] + 1.5 - xx), 0, 1)
        # lash curve of the pack's closed eye (blink0), as a matte
        b0 = blink0; b0L = lum(b0); b0a = np.clip((150 - b0L) / 110, 0, 1) * (b0[..., 3] / 255)
        bx, by = PARTS['tq_blink0']['x'] - HX, PARTS['tq_blink0']['y'] - HY       # head coords of the patch
        if E['closed']:
            cp = PARTS[E['closed']]
            cl = np.asarray(Image.open(PARTS_DIR / f"{E['closed']}.png"))
            Image.fromarray(cl).save(ART / f'{view}_eye{en}_closed.png')
            closed_box = (cp['x'], cp['y'], cl.shape[1], cl.shape[0])
            # the happy patch is made on the head's own skin (the pack patch's lash cannot be lifted cleanly)
            happy_base, happy_a, happy_box = skin_fill, patch_a, (x0 + HX, y0 + HY, W, H)
        else:
            # far eye: the head's skin over the eye + blink0's lash squeezed to this eye's width
            if E.get('mirror'): b0a = b0a[:, ::-1]             # outer corner on the right (front view, her left eye)
            ex = np.where(eye.any(0))[0]; ew = ex[-1] - ex[0] + 1
            n_ex = np.where(b0a.max(0) > 0.3)[0]; nw = n_ex[-1] - n_ex[0] + 1
            sx = (ew + 1.0) / nw
            # resample blink0's lash matte: target pixel (u, v) in the eye box <- blink0 (bx0 + (u-ux0)/sx, v + dy)
            lash_rows = np.where(b0a.max(1) > 0.3)[0]; lash_cy = lash_rows.mean()
            target_cy = ly + 4.0
            U, V = np.meshgrid(np.arange(W, dtype=float), np.arange(H, dtype=float))
            srcx = n_ex[0] + (U - ex[0]) / sx; srcy = V - target_cy + lash_cy
            m = ndi.map_coordinates(b0a, [srcy, srcx], order=1, cval=0)
            closed_rgb = skin_fill * (1 - m[..., None]) + np.array(INK) * m[..., None]
            save(closed_rgb, np.maximum(patch_a, m), f'{view}_eye{en}_closed.png')
            closed_box = (x0 + HX, y0 + HY, W, H)
            happy_base, happy_a, happy_box = skin_fill, patch_a, closed_box
        # happy (laughing) closed eye: an upward arc in the lash colour, tapered, on the patch's skin
        hb = E['happy']; ox, oy = happy_box[0] - HX, happy_box[1] - HY
        pts, t = bez(*[(p[0] - ox, p[1] - oy) for p in (hb['p0'], hb['p1'], hb['p2'])])
        wid = 0.9 + (hb['w'] - 0.9) * np.sin(np.pi * np.clip(t * 1.05, 0, 1)) ** 0.7
        hs = stroke(happy_base.shape[:2], pts, wid)
        happy_rgb = happy_base * (1 - hs[..., None]) + np.array(INK) * hs[..., None]
        save(happy_rgb, np.maximum(happy_a, hs), f'{view}_eye{en}_happy.png')

        # lid filler mesh rows (top of the lash, lid edge) per column, in view px; the filler stretches from the
        # lash's top (fixed) down to the lash's moving bottom edge
        cols = np.where(valid)[0]
        out['eyes'][en] = {
            'box': [x0 + HX, y0 + HY, W, H],
            'center': [icx + HX, icy + HY],
            'iris': [icx + HX, icy + HY, irx, iry],
            'closed_box': list(map(float, closed_box)), 'happy_box': list(map(float, happy_box)),
            'look': E['look'], 'travel': E['travel'],
            'fill_cols': fill_cols(cols, top, edge, x0 + HX, y0 + HY, xmax=None if E['xmax'] is None else E['xmax'] - 3 - x0),
            'lid_colour': '#%02x%02x%02x' % tuple(int(v) for v in np.round(lid_col)),
        }
        Image.fromarray(np.full((4, 4, 4), [*map(int, np.round(lid_col)), 255], np.uint8)).save(ART / f'{view}_eye{en}_lidfill.png')

    # far brow: matte it off the skin, and a hole patch with the skin filled in
    for bn, B in C.get('browcut', {}).items():
        x0, y0, x1, y1 = B['box']; sub = head[y0:y1, x0:x1]; srgb = sub[..., :3]; H, W = sub.shape[:2]
        yy, xx = np.mgrid[0:H, 0:W]
        ex = B['edge'][0] + (B['edge'][1] - B['edge'][0]) * yy / (H - 1) - x0      # hair edge per row
        left = xx < ex - 0.5
        L = lum(sub)
        ink = (L < 185) & left & (sub[..., 3] > 200) & ~skin_mask(sub)
        lab, n = ndi.label(ink); sizes = ndi.sum(ink, lab, range(1, n + 1))
        if 'seed' in B: brow = lab == lab[B['seed'][1] - y0, B['seed'][0] - x0]
        else: brow = lab == (1 + int(np.argmax(sizes)))
        unknown = ndi.binary_dilation(brow, iterations=2) & left
        source = skin_mask(sub) & ~unknown
        bg = diffuse(srgb, unknown, source, 1500)
        Lb = lum(bg); core = np.percentile(L[brow], 10)
        alpha = np.clip((Lb - L) / np.maximum(Lb - core, 1), 0, 1) * unknown
        alpha[alpha < 0.04] = 0
        F = (srgb - (1 - alpha[..., None]) * bg) / np.maximum(alpha[..., None], 1e-3)
        F = np.where(alpha[..., None] > 0.25, np.clip(F, 0, 255), np.array(INK) * 1.25)
        save(F, alpha, f'{view}_brow{bn}.png')
        hole_a = np.clip(soft(ndi.binary_dilation(unknown, iterations=1), 0.8) * 1.3, 0, 1) * left * (sub[..., 3] / 255)
        save(bg, hole_a, f'{view}_brow{bn}_hole.png')
        ys_, xs_ = np.where(alpha > 0.3)
        out['brows'][bn] = {'img': f'{view}_brow{bn}.png', 'hole': f'{view}_brow{bn}_hole.png', 'box': [x0 + HX, y0 + HY, W, H],
                            'pivot': [float(xs_.mean() + x0 + HX), float(ys_.mean() + y0 + HY)]}
    for bn, part in C.get('brows', {}).items():
        p = PARTS[part]; im = np.asarray(Image.open(PARTS_DIR / f'{part}.png'))
        ys_, xs_ = np.where(im[..., 3] > 76)
        Image.fromarray(im).save(ART / f'{view}_brow{bn}.png')
        out['brows'][bn] = {'img': f'{view}_brow{bn}.png', 'hole': None, 'box': [p['x'], p['y'], p['w'], p['h']],
                            'pivot': [float(xs_.mean() + p['x']), float(ys_.mean() + p['y'])]}
    # mouths: the pack's painted smile at its own place; the nine pack mouths about the view's mouth point
    M = C['mouth']; pm = PARTS[M['painted']]
    Image.open(PARTS_DIR / f"{M['painted']}.png").save(ART / f'{view}_mouth_painted.png')
    if M.get('profile'):
        out['mouth'] = profile_mouths(view, pm)
        (ART / f'{view}_face.json').write_text(json.dumps(out, indent=1))
        return out
    mc = PARTS['_mouth']
    out['mouth'] = {'c': list(M['c']), 'sx': M['sx'], 'tilt': M['tilt'],
                    'painted_box': [pm['x'], pm['y'], pm['w'], pm['h']],
                    'pack_origin': [PARTS['mouth_0']['x'] - mc['cx'], PARTS['mouth_0']['y'] - mc['cy']],    # image top-left relative to the mouth point
                    'pack_size': [PARTS['mouth_0']['w'], PARTS['mouth_0']['h']]}
    # flipped pack mouths (corners down): made here so one mouth bone can carry them all
    for i in range(9):
        im = Image.open(PARTS_DIR / f'mouth_{i}.png'); im.save(ART / f'mouth_{i}.png')
        im.transpose(Image.FLIP_TOP_BOTTOM).save(ART / f'mouth_{i}f.png')
    (ART / f'{view}_face.json').write_text(json.dumps(out, indent=1))
    return out


if __name__ == '__main__':
    cut_view(sys.argv[1] if len(sys.argv) > 1 else 'tq')
