"""Separate Liv's clothes from her skin, and the apron from the skirt (three-quarter view).

Why: in the pack's art the cream of the apron, the blouse sleeves and the socks is almost the skin colour
(apron 252 207 155, skin 253 194 141), so in motion an arm in front of the apron, or a sleeve next to an arm, reads as
one shape. This script

  1. re-tones every piece of cloth to a cooler, lighter linen (the skin keeps the pack's colour),
  2. cuts the apron off the skirt: tq_apron.png (the apron, same box as the skirt part) and tq_skirtred.png (the red
     skirt with the apron's area filled in red, so it can swing independently),
  3. makes a plain base layer under the dress that is not skin: a linen chemise (tq_chemise.png) and a petticoat
     (tq_slip.png). They are drawn behind the dress so a gap between pieces never shows the background (or skin).

Outputs go to tools/liv/rive/tq/ (the pack's originals in parts/ are untouched).

    python3 tools/liv/rive/cut_cloth.py
"""
from pathlib import Path
import colorsys
import json
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent
OUT = HERE / 'tq'; OUT.mkdir(exist_ok=True)
PARTS = json.loads((HERE / 'parts/parts.json').read_text())
INK = np.array([0x3a, 0x1c, 0x0c], np.float32)
LINEN = dict(sat=.40, hue_to=39.0, hue_pull=.55, vlift=.015)       # how the cream is re-toned


def load(name, folder='parts'):
    return np.asarray(Image.open(HERE / f'{folder}/{name}.png').convert('RGBA')).astype(np.float32)


def save(name, rgba):
    Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA').save(OUT / f'{name}.png')


def rgb_to_hsv(rgb):
    r, g, b = [rgb[..., i] / 255. for i in range(3)]
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rm = m & (mx == r); gm = m & (mx == g) & ~rm; bm = m & ~rm & ~gm
    h[rm] = (60 * ((g - b)[rm] / d[rm])) % 360
    h[gm] = 60 * ((b - r)[gm] / d[gm]) + 120
    h[bm] = 60 * ((r - g)[bm] / d[bm]) + 240
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    return h, s, mx


def hsv_to_rgb(h, s, v):
    h = (h % 360) / 60.; i = np.floor(h).astype(int) % 6; f = h - np.floor(h)
    p = v * (1 - s); q = v * (1 - s * f); t = v * (1 - s * (1 - f))
    r = np.choose(i, [v, q, p, p, t, v]); g = np.choose(i, [t, v, v, q, p, p]); b = np.choose(i, [p, p, t, v, v, q])
    return np.stack([r, g, b], -1) * 255.


def retone(rgba, mask):
    """Cloth pixels (mask) become linen: less saturated, a little yellower, folds keep their value. Ink is left alone."""
    h, s, v = rgb_to_hsv(rgba[..., :3])
    cream = mask & (v > .5)                                           # not the ink lines
    h2 = np.where(cream, h + (LINEN['hue_to'] - h) * LINEN['hue_pull'], h)
    s2 = np.where(cream, s * LINEN['sat'], s)
    v2 = np.where(cream, np.minimum(1, v + LINEN['vlift']), v)
    out = rgba.copy(); out[..., :3] = np.where(cream[..., None], hsv_to_rgb(h2, s2, v2), rgba[..., :3])
    return out


def is_cream(rgba):
    r, g, b, a = [rgba[..., i] for i in range(4)]
    h, s, v = rgb_to_hsv(rgba[..., :3])
    return (a > 128) & (h > 20) & (h < 52) & (s > .12) & (s < .62) & (v > .62) & (r > 200)


# ---------------------------------------------------------------- sleeves and socks: all cloth
for n in ['tq_sleeveA', 'tq_sleeveB', 'tq_sockA', 'tq_sockB']:
    im = load(n); save(n + '_c', retone(im, is_cream(im) | ((im[..., 3] > 128) & (im[..., 0] > 190))))

# ---------------------------------------------------------------- torso: the blouse collar, waistband, bow and the
# apron's top are cloth; the neck and chest skin at the top are not. Cream pixels are labelled with ink as a wall; the
# components that start below the neckline are cloth.
tor = load('tq_torso'); cr = is_cream(tor)
h_, s_, v_ = rgb_to_hsv(tor[..., :3])
walls = (tor[..., 3] > 128) & (v_ < .55)
lab, k = ndimage.label(cr & ~ndimage.binary_dilation(walls, iterations=1))
cloth = np.zeros(cr.shape, bool); info = []
for i in range(1, k + 1):
    m = lab == i; ys, xs = np.nonzero(m)
    if m.sum() < 40: continue
    info.append((i, int(m.sum()), int(ys.mean()), int(xs.mean())))
    # the neck / chest skin is the component whose centre is in the top 12 % of the part; everything else cream is cloth
    if ys.mean() > .12 * tor.shape[0] + 30: cloth |= m
# the skin component is also a cream-hued patch with no cloth under it: report so a bad split is visible
print('torso cream components (id, px, y, x):', info)
cloth = ndimage.binary_dilation(cloth, iterations=2) & (cr | ((tor[..., 3] > 128) & (v_ > .55) & (tor[..., 0] > 200)))
save('tq_torso_c', retone(tor, cloth))

# ---------------------------------------------------------------- skirt: apron and red skirt
sk = load('tq_skirt'); a = sk[..., 3] > 128
h_, s_, v_ = rgb_to_hsv(sk[..., :3])
cream = is_cream(sk)
lab, k = ndimage.label(cream)
big = 1 + int(np.argmax(ndimage.sum(cream, lab, range(1, k + 1))))
apron_core = ndimage.binary_fill_holes(lab == big)
apron_core = ndimage.binary_closing(apron_core, iterations=2)
dark = a & (v_ < .62)
ring = ndimage.binary_dilation(apron_core, iterations=3) & ~apron_core
apron_m = apron_core | (ring & dark)                                  # the ink line that outlines it
apron_m = ndimage.binary_fill_holes(apron_m)
apron_alpha = ndimage.gaussian_filter(apron_m.astype(np.float32), .7)
apron = sk.copy(); apron[..., 3] = np.where(apron_m, np.maximum(sk[..., 3] * 0 + 255, 0), 0) * 1.0
apron[..., 3] = np.clip(apron_alpha * 255, 0, 255) * (apron_m | (apron_alpha > .5))
apron = retone(apron, apron[..., 3] > 100)
save('tq_apron', apron)

red = sk.copy()
# The red skirt under the apron: what the apron covered is filled with the red next to it on the same row (linear across
# the gap); rows with no red on one side use the red of the nearest rows below. The drawn shadow under the apron's hem
# is part of the skirt and stays.
under = ndimage.binary_dilation(apron_m, iterations=2) & a
Hh, Ww = sk.shape[:2]
isred = a & ~under & (sk[..., 0] > 120) & (sk[..., 1] < 110)
# one colour per row (the median of the plain red on that row, fold shadows left out), smoothed down the rows
plain = isred & (sk[..., 0] > 165) & (sk[..., 1] > 40)
rowc = np.zeros((Hh, 3), np.float32); have = np.zeros(Hh, bool)
for y in range(Hh):
    px = sk[y][plain[y]][:, :3]
    if len(px) > 12: rowc[y] = np.median(px, axis=0); have[y] = True
ys_ = np.arange(Hh); rowc = np.stack([np.interp(ys_, ys_[have], rowc[have, c]) for c in range(3)], 1)
rowc = ndimage.gaussian_filter1d(rowc, 14, axis=0)
fill = np.repeat(rowc[:, None, :], Ww, axis=1)
fill = fill * (1 + .035 * np.sin(np.arange(Ww)[None, :, None] / 37.))      # a little grain so it is not dead flat
red[..., :3] = np.where(under[..., None], fill, red[..., :3])
red[..., 3] = np.where(under, 255, red[..., 3])
save('tq_skirtred', red)
print('apron px', int(apron_m.sum()), 'of', int(a.sum()))

# ---------------------------------------------------------------- base layer under the dress (not skin)
# petticoat: the skirt's silhouette pulled in, linen colour, ink edge; chemise: the torso's silhouette pulled in
def base_layer(src, shrink, name):
    """A flat linen shape inside the silhouette of the dress piece, no outline: it can only show through a gap, and then
    it reads as the shaded underlayer, never as skin."""
    m = ndimage.binary_erosion(ndimage.binary_closing(src[..., 3] > 128, iterations=10), iterations=shrink)
    out = np.zeros_like(src)
    out[..., :3] = np.array([214, 200, 176], np.float32)
    out[..., 3] = ndimage.gaussian_filter(m.astype(np.float32), 1.2) * 255
    save(name, out)
    return out
base_layer(sk, 22, 'tq_slip')
base_layer(tor, 14, 'tq_chemise')
