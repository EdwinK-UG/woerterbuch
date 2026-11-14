"""Recolour the VRoid preset textures into Liv's outfit: red dirndl with cream blouse and apron, brown lace-up boots, cream socks.

    python3 tools/liv3d/vroid_params.py png IN.vroid DIR          # the project's textures -> DIR/NNN.png
    python3 tools/liv3d/liv_textures.py DIR OUT_DIR dress=2 boots=7 socks=34
    python3 tools/liv3d/vroid_params.py tex IN.vroid OUT.vroid 2=OUT_DIR/dress.png 7=OUT_DIR/boots.png 34=OUT_DIR/socks.png

The numbers are the texture indices of this project (they change when another preset is chosen: look at the PNGs).
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

RED = np.array([190, 59, 34], np.float32)          # dirndl
CREAM = np.array([246, 230, 200], np.float32)      # blouse, apron, socks
BROWN = np.array([122, 74, 38], np.float32)        # boots
TAN = np.array([224, 167, 74], np.float32)         # laces
LACE = np.array([120, 50, 30], np.float32)         # bodice lacing


def hsv(rgb):
    r, g, b = rgb[..., 0] / 255., rgb[..., 1] / 255., rgb[..., 2] / 255.
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); d = mx - mn
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    h = np.zeros_like(mx); m = d > 1e-6
    rm = m & (mx == r); gm = m & (mx == g) & ~rm; bm = m & ~rm & ~gm
    h[rm] = (60 * ((g - b)[rm] / d[rm])) % 360; h[gm] = 60 * ((b - r)[gm] / d[gm]) + 120; h[bm] = 60 * ((r - g)[bm] / d[bm]) + 240
    return h, s, mx


def dress(im):
    a = np.asarray(im.convert('RGBA')).astype(np.float32); rgb = a[..., :3]
    h, s, v = hsv(rgb)
    pink = (s > .10) & ((h > 300) | (h < 25))              # the preset's pink cloth and ribbon
    # red cloth: keep the painted shading (value and how saturated the pink was) as light and dark red
    shade = np.clip((v - .55) / .45, 0, 1)[..., None] * np.clip(1.15 - s * 1.2, .55, 1)[..., None]
    red = RED * (.62 + .38 * shade)
    white = ~pink                                           # blouse, apron, frills: cream, shading kept
    lum = (rgb @ np.array([.299, .587, .114], np.float32))[..., None] / 255.
    cream = CREAM * np.clip(.35 + .68 * lum, 0, 1.03)
    out = np.where(pink[..., None], red, cream)
    a[..., :3] = np.clip(out, 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def boots(im):
    a = np.asarray(im.convert('RGBA')).astype(np.float32); rgb = a[..., :3]
    lum = (rgb @ np.array([.299, .587, .114], np.float32))[..., None] / 255.
    leather = BROWN * np.clip(.42 + lum * 3.2, 0, 1.75)     # the preset is near black: lift it into brown
    lace = TAN * np.clip(.5 + lum * .6, 0, 1.1)
    k = np.clip((lum - .42) / .18, 0, 1)                    # light pixels are laces and eyelets
    a[..., :3] = np.clip(leather * (1 - k) + lace * k, 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def socks(im):
    a = np.asarray(im.convert('RGBA')).astype(np.float32); rgb = a[..., :3]
    lum = (rgb @ np.array([.299, .587, .114], np.float32))[..., None] / 255.
    a[..., :3] = np.clip(CREAM * np.clip(.3 + .72 * lum, 0, 1.03), 0, 255)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def main():
    src, out = Path(sys.argv[1]), Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    jobs = dict(a.split('=') for a in sys.argv[3:])
    for name, fn in (('dress', dress), ('boots', boots), ('socks', socks)):
        if name in jobs:
            fn(Image.open(src / f'{int(jobs[name]):03d}.png')).save(out / f'{name}.png'); print('wrote', out / f'{name}.png')


main()
