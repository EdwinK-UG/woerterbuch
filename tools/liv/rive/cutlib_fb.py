"""Shared cutter for Liv's FRONT and BACK views (used by cut_front.py and cut_back.py).

The same recipe as the three-quarter view (cut_tq.py for limbs, cut_cloth.py for cloth), adapted to the two frontal views:

  <V>_upperA/B.png   upper arm: the drawn arm where it shows (between cuff and elbow), a tube rebuilt from that arm's own
                     cross-section where the sleeve hides it, a round top under the sleeve, a round elbow disc with an ink arc
  <V>_foreA/B.png    forearm: elbow disc (plain skin) to the wrist, cut straight at wrist - 14 px (the hand sprite overlaps there)
  <V>_legA/B.png     a strip of leg skin (all rows alike), <V>_thighA/B.png, <V>_shinA/B.png: rigid pieces with a round knee
  <V>_capA/B.png     the top of the re-toned sleeve, faded out down the arm (stays on the torso)
  <V>_sleeveA/B_c    sleeve re-toned to linen, plus the sleeve's own pixels that the pack's sleeve part left out (same box)
  <V>_sockA/B_c      socks re-toned
  <V>_torso_c        bodice from the view's pixels (the pack's part has painted-over spots), cloth re-toned, neck skin kept
  <V>_skirtred       red skirt (front: apron area filled with red; back: the bow tails' area filled with red)
  <V>_apron          front only: apron cut off the skirt, re-toned
  <V>_bow1/2         back only: the two tails of the waist bow, re-toned (bow1 = viewer's left, x < 512)
  <V>_slip, <V>_chemise   plain linen base layers under skirt and bodice
  <V>_strap          satchel strap texture (same as tq_strap)
  <V>.json           joints and boxes (contract of tq/tq.json plus yaw_deg, facing, A_is, far_arm, rig, parts, hand, boxes)
  check/             assembled picture, difference picture, cloth/skin contact sheet, joint table

Pixel processing only (numpy / scipy / PIL), from the pack's own pixels.
"""
from pathlib import Path
import json
import math
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

HERE = Path(__file__).resolve().parent
PARTS = json.loads((HERE / 'parts/parts.json').read_text())
BG = np.array([0xBF, 0xD9, 0xE6], np.float32)
INK = np.array([0x3a, 0x1c, 0x0c], np.float32)
LEN_UP, LEN_FORE = 149.0, 139.0                     # prop.upArm / foreArm (0.15 / 0.14 m) at 996 px per metre
TW = LEN_UP + LEN_FORE - 14                          # wrist: the hand sprite overlaps the forearm's end by ~14 px
LINEN = dict(sat=.40, hue_to=39.0, hue_pull=.55, vlift=.015)
VIEWFILE = {'front': '01_front.png', 'back': '05_back.png'}


# ------------------------------------------------------------------------------------------------ colour helpers (cut_cloth.py)
def rgb_to_hsv(rgb):
    r, g, b = [rgb[..., i] / 255. for i in range(3)]
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); d = mx - mn
    h = np.zeros_like(mx); m = d > 1e-6
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
    h, s, v = rgb_to_hsv(rgba[..., :3])
    cream = mask & (v > .5)
    h2 = np.where(cream, h + (LINEN['hue_to'] - h) * LINEN['hue_pull'], h)
    s2 = np.where(cream, s * LINEN['sat'], s)
    v2 = np.where(cream, np.minimum(1, v + LINEN['vlift']), v)
    out = rgba.copy(); out[..., :3] = np.where(cream[..., None], hsv_to_rgb(h2, s2, v2), rgba[..., :3])
    return out


def is_cream(rgba):
    r, a = rgba[..., 0], rgba[..., 3]
    h, s, v = rgb_to_hsv(rgba[..., :3])
    return (a > 128) & (h > 20) & (h < 52) & (s > .12) & (s < .62) & (v > .62) & (r > 200)


def unit(v): v = np.array(v, float); return v / np.hypot(*v)


class Cutter:
    def __init__(self, V):
        self.V = V
        self.OUT = HERE / V; self.OUT.mkdir(exist_ok=True)
        self.CHK = self.OUT / 'check'; self.CHK.mkdir(exist_ok=True)
        self.view = np.asarray(Image.open(HERE / 'views' / VIEWFILE[V]).convert('RGB')).astype(np.float32)
        self.H, self.W = self.view.shape[:2]
        self.META = PARTS['_meta'][V]
        self.yy, self.xx = np.mgrid[0:self.H, 0:self.W]
        self.nonbg = np.abs(self.view - BG).sum(axis=2) > 24
        self.ink = self.view.sum(axis=2) < 330
        r, g = self.view[..., 0], self.view[..., 1]
        self.red = (r > 110) & (g < 95) & (r > 1.9 * g)
        self.cov = {}                                  # pack part alpha (> 128) in view coordinates
        for n in ['head', 'torso', 'skirt', 'sleeveA', 'sleeveB', 'sockA', 'sockB', 'bootA', 'bootB']:
            self.cov[n] = self.part_mask(n)
        self.info = {}
        self.pieces = []        # (name, rgba_final, rgba_raw, placement) for the checks; placement ('box', x, y) or ('quad', org, to, spec)
        self.files = {}         # name -> box [x, y, w, h] in view pixels
        self.cloth_names = set(); self.skin_names = set()

    # -------------------------------------------------------------------------------------------- io
    def part(self, n):
        return np.asarray(Image.open(HERE / f'parts/{self.V}_{n}.png').convert('RGBA')).astype(np.float32)

    def pbox(self, n):
        p = PARTS[f'{self.V}_{n}']; return [int(p['x']), int(p['y']), int(p['w']), int(p['h'])]

    def part_mask(self, n):
        m = np.zeros((self.H, self.W), bool); a = self.part(n)[..., 3] > 128; x, y, _, _ = self.pbox(n)
        m[y:y + a.shape[0], x:x + a.shape[1]] = a; return m

    def save(self, name, rgba):
        Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA').save(self.OUT / f'{self.V}_{name}.png')

    def add_box_piece(self, name, rgba, box, raw=None, kind=None):
        self.save(name, rgba); self.files[name] = [int(v) for v in box]
        self.pieces.append((name, rgba, rgba if raw is None else raw, ('box', box[0], box[1])))
        if kind == 'cloth': self.cloth_names.add(name)
        if kind == 'skin': self.skin_names.add(name)

    def to_view(self, rgba, box):
        """A piece (box in view px) as a full view-size RGBA canvas."""
        c = np.zeros((self.H, self.W, 4), np.float32); x, y = box[0], box[1]; h, w = rgba.shape[:2]
        c[y:y + h, x:x + w] = rgba; return c

    # -------------------------------------------------------------------------------------------- arms
    def segment_arm(self, side):
        """Arm (skin + its outline) vs. sleeve pixels the pack's sleeve part left out. The skin is flooded from the forearm
        through everything that is not ink: the cuff's ink line stops it. Leftover pixels go to the nearer of the two."""
        sh = np.array(self.META[side]['sh'], float); u = unit(self.META[side]['dir']); n = np.array([-u[1], u[0]])
        xx, yy = self.xx, self.yy
        region = ((xx < 500) if side == 'A' else (xx > 524)) & (yy > 470) & (yy < 900)
        others = self.cov['head'] | self.cov['skirt'] | self.cov['sockA'] | self.cov['sockB'] | self.cov['bootA'] | self.cov['bootB']
        R = self.nonbg & region & ~others & ~(self.cov['torso'] & (self.red | self.ink))
        slv = self.cov['sleeve' + side]
        walls = ndimage.binary_dilation(self.ink, iterations=1)
        free = R & ~walls & ~slv
        lab, _ = ndimage.label(free)
        seed = sh + u * 210
        F = lab == lab[int(round(seed[1])), int(round(seed[0]))]
        assert F.sum() > 3000, 'arm flood failed'
        for _ in range(2): F = F | (ndimage.binary_dilation(F) & R & ~self.ink & ~slv)
        t = (xx - sh[0]) * u[0] + (yy - sh[1]) * u[1]; s = (xx - sh[0]) * n[0] + (yy - sh[1]) * n[1]
        S = (R & ~F & ~self.ink & (t < LEN_UP)) | slv
        rest = R & ~F & ~S
        dF = ndimage.distance_transform_edt(~F); dS = ndimage.distance_transform_edt(~S)
        arm = F | (rest & (dF <= dS) & (dF <= 5))
        arm = ndimage.binary_fill_holes(arm)
        sext = ((S & ~slv) | (rest & (dS < dF) & (dS <= 5))) & (t < LEN_UP) & ~arm
        lab, k = ndimage.label(sext)                        # only what touches the pack's sleeve
        if k:
            touch = ndimage.binary_dilation(slv, iterations=2)
            keep = [i for i in range(1, k + 1) if (touch & (lab == i)).any()]
            sext = np.isin(lab, keep)
        return dict(sh=sh, u=u, n=n, t=t, s=s, arm=arm, sext=sext, R=R)

    def cut_arm(self, side, seg, sleeve_view_alpha):
        V = self.V; view = self.view; xx, yy = self.xx, self.yy
        sh, u, n, t, s, arm = seg['sh'], seg['u'], seg['n'], seg['t'], seg['s'], seg['arm']
        # the upper arm's own cross-section just above the elbow (the visible stretch below the cuff)
        ts = np.arange(LEN_UP - 22, LEN_UP - 2)
        cen, hw = [], []
        for tk in ts:
            row = arm & (np.rint(t) == tk)
            if row.sum() > 5: cen.append((s[row].min() + s[row].max()) / 2); hw.append((s[row].max() - s[row].min()) / 2)
        s_c, half = float(np.median(cen)), float(np.median(hw))
        sn = np.linspace(-1.12, 1.12, 56)
        prof = np.zeros((len(sn), 3), np.float32)
        for ci in range(3):
            vals = []
            for tk in ts[::2]:
                px = sh[0] + u[0] * tk + n[0] * (s_c + sn * half); py = sh[1] + u[1] * tk + n[1] * (s_c + sn * half)
                vals.append(ndimage.map_coordinates(view[..., ci], [py, px], order=1))
            prof[:, ci] = np.median(vals, axis=0)
        snn = (s - s_c) / half
        skin_col = np.median(view[arm & (np.abs(t - LEN_UP) < 12) & (np.abs(snn) < .5)], axis=0)
        # round top of the tube: as high as possible while it stays inside the sleeve (it must not show at rest)
        under = (sleeve_view_alpha > 100) | arm
        t_c = 6.0
        for tc in np.arange(6.0, 80.0, 2.0):
            disc = np.hypot(t - tc, s - s_c) <= half
            if (disc & ~under).sum() <= 0.01 * disc.sum(): t_c = float(tc); break
        tube = ((t >= t_c) & (t < LEN_UP + 14) & (np.abs(snn) <= 1.0)) | (np.hypot(t - t_c, s - s_c) <= half)
        img = view.copy(); ii = np.clip((snn + 1.12) / 2.24 * (len(sn) - 1), 0, len(sn) - 1)
        for ci in range(3): img[..., ci] = np.where(tube, np.interp(ii, np.arange(len(sn)), prof[:, ci]), view[..., ci])
        edge = tube & (np.abs(snn) > 1 - 2.8 / half)
        for ci in range(3): img[..., ci] = np.where(edge, INK[ci] * .85 + img[..., ci] * .15, img[..., ci])
        sx, sy, sw, shh = self.pbox('sleeve' + side)
        inbox = (xx >= sx) & (xx < sx + sw) & (yy >= sy) & (yy < sy + shh)
        spill = seg['sext'] & ~inbox & (t > 0.6 * LEN_UP)         # cuff pixels the sleeve's box cannot hold: they ride on the arm
        vis = (arm | spill) & (t < LEN_UP)                        # where the drawn upper arm shows: keep its own pixels
        img = np.where(vis[..., None], view, img)
        hidden_tube = tube & ~vis & ndimage.binary_dilation(under, iterations=2)
        clipped = int((tube & ~vis & ~ndimage.binary_dilation(under, iterations=2) & (t < LEN_UP)).sum())
        up = (vis | hidden_tube) & (t < LEN_UP)
        el = sh + u * LEN_UP + n * s_c
        d = np.hypot(xx - el[0], yy - el[1]); r = half * 0.98
        upper = up | (d <= r)
        arc = (d <= r) & (d > r - 3.2) & (t >= LEN_UP - 2)
        up_img = img.copy(); up_img[(d <= r) & ~up] = skin_col; up_img[arc] = INK
        fore = (arm & (t >= LEN_UP) & (t < TW)) | ((d <= r - 3.4) & (t < LEN_UP))
        fo_img = view.copy(); fo_img[(d <= r - 3.4) & ~arm] = skin_col
        wr = sh + u * TW + n * s_c

        def crop_save(name, rgb, mask):
            ys_, xs_ = np.nonzero(mask); y0, y1, x0, x1 = ys_.min(), ys_.max() + 1, xs_.min(), xs_.max() + 1
            a = ndimage.gaussian_filter(mask.astype(np.float32), .6)[y0:y1, x0:x1] * 255
            out = np.dstack([rgb[y0:y1, x0:x1], a]); out[..., 3] = np.where(mask[y0:y1, x0:x1], np.maximum(out[..., 3], 160), out[..., 3])
            box = [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]
            self.add_box_piece(name, out, box, kind='skin')
            return box
        box_up = crop_save(f'upper{side}', up_img, upper); box_fo = crop_save(f'fore{side}', fo_img, fore)
        # hand: what lies beyond the forearm piece (for the checks; the rig uses the hand sprites)
        hand = seg['R'] & (t >= TW - 14) & ~seg['sext'] & ~self.cov['sleeve' + side]
        lab, k = ndimage.label(hand); hand = lab == (1 + int(np.argmax(ndimage.sum(hand, lab, range(1, k + 1)))))
        tip_i = np.argmax(np.where(hand, t, -1e9)); ty_, tx_ = np.unravel_index(tip_i, t.shape)
        hc = np.array([xx[hand].mean(), yy[hand].mean()])
        self.hand_masks = getattr(self, 'hand_masks', {}); self.hand_masks[side] = hand
        return dict(sh=[float(v) for v in sh], elbow=[float(v) for v in el], wrist=[float(v) for v in wr], dir=[float(v) for v in u],
                    half=half, axis_offset=s_c, upper=box_up, fore=box_fo), \
            dict(wrist=[float(v) for v in wr], dir=[float(v) for v in u], length=float(t[ty_, tx_] - TW), tip=[int(tx_), int(ty_)],
                 centroid=[round(float(hc[0]), 1), round(float(hc[1]), 1)]), \
            dict(t_cap=t_c, clipped=clipped, half=half)

    # -------------------------------------------------------------------------------------------- legs (cut_tq.py)
    def cut_leg(self, side, rows):
        sk = PARTS[f'{self.V}_sock{side}']
        x0 = int(sk['x']) - 14; x1 = x0 + int(sk['w']) + 28
        y0, y1 = rows
        res = self.nonbg & ~self.cov['skirt'] & ~self.cov['sock' + side]
        m = res[y0:y1, x0:x1]
        cols = np.nonzero(m.mean(axis=0) > .85)[0]
        cx0, cx1 = x0 + cols.min(), x0 + cols.max() + 1
        strip = np.zeros((16, cx1 - cx0, 4), np.float32)
        sub = self.view[y0:y1, cx0:cx1]; w = res[y0:y1, cx0:cx1].astype(np.float32)[..., None]
        mean = (sub * w).sum(axis=0) / np.maximum(w.sum(axis=0), 1)
        strip[..., :3] = mean[None]; strip[..., 3] = 255
        self.save(f'leg{side}', strip); self.skin_names.add(f'leg{side}')
        return dict(x0=int(cx0), x1=int(cx1))

    def make_leg_pieces(self, side):
        """Thigh and shin as two rigid pieces with a round knee (cut_tq.make_leg_pieces: the thigh ends in a half disc with an ink
        arc, the shin starts with a plain skin disc drawn over it). Differences from tq, same file format: the outline follows the
        drawn leg (its two edges measured along the bone and extended linearly, so the leg tapers as drawn) and, where the bare leg
        shows in the view, the skin is the drawing's own (hem shadow, knee light); elsewhere the colours of the strip."""
        info = self.info; V = self.V
        prof = np.asarray(Image.open(self.OUT / f'{V}_leg{side}.png').convert('RGBA'))[0, :, :3].astype(np.float32)
        w = len(prof); ink = 3.8
        inner = prof[5:w - 5]
        hip, knee, ank = np.array(info['hip' + side], float), np.array(info['knee' + side], float), np.array(info['ankle' + side], float)
        U = (ank - hip) / np.linalg.norm(ank - hip); N = np.array([U[1], -U[0]])          # the builder's n for the quads
        Lk = float(np.linalg.norm(knee - hip))
        full = self.nonbg & ~self.cov['skirt'] & ~self.cov['sock' + side] & ~self.cov['boot' + side]
        full &= ((self.xx < 512) if side == 'A' else (self.xx >= 512)) & (self.yy > 1050) & (self.yy < 1260)
        lab, k = ndimage.label(full); full = lab == 1 + int(np.argmax(ndimage.sum(full, lab, range(1, k + 1))))
        self.legvis = getattr(self, 'legvis', {}); self.legvis[side] = ndimage.binary_erosion(full & ~self.ink, iterations=2)
        line = full & (self.view.sum(axis=2) < 150)
        LINK = np.median(self.view[line], axis=0) if line.sum() > 50 else INK        # the drawing's own outline colour
        T = (self.xx - hip[0]) * U[0] + (self.yy - hip[1]) * U[1]; S = (self.xx - hip[0]) * N[0] + (self.yy - hip[1]) * N[1]
        tk, lo, hi = [], [], []
        hem_t = T[full].min() + 6; sock_t = T[full].max() - 6
        for t0 in np.arange(hem_t, sock_t):
            row = full & (np.abs(T - t0) < .5)
            if row.sum() > 20: tk.append(t0); lo.append(S[row].min() - .5); hi.append(S[row].max() + .5)
        plo = np.polyfit(tk, lo, 1); phi = np.polyfit(tk, hi, 1)
        def edges(tg): return np.polyval(plo, tg), np.polyval(phi, tg)
        lo_k, hi_k = edges(Lk); ck, rk = (lo_k + hi_k) / 2, (hi_k - lo_k) / 2
        def col(sn):                                       # skin colour at a normalised position across the leg (-1..1)
            x = np.clip((sn + 1) / 2 * (len(inner) - 1), 0, len(inner) - 1)
            return np.stack([np.interp(x, np.arange(len(inner)), inner[:, c]) for c in range(3)], -1)

        def piece(name, top_ext, length, cap_top, t_off):
            tt_all = np.arange(-top_ext, length + rk + 2) + t_off
            l_, h_ = edges(tt_all); smax = float(max(np.abs(l_).max(), np.abs(h_).max(), abs(ck) + rk)) + 2
            cols = int(np.ceil(2 * smax)); hwc = cols / 2.0
            rows = int(np.ceil(top_ext + length + (0 if cap_top else rk))) + 1
            rr, cc = np.mgrid[0:rows, 0:cols].astype(np.float32); tt = rr - top_ext; ss = cc + .5 - hwc
            tg = tt + t_off; l_, h_ = edges(tg)
            sd_tube = np.maximum(l_ - ss, ss - h_)
            if cap_top:
                sd_cap = np.hypot(ss - ck, np.minimum(tt, 0)) - (rk - 3.6)
                sd = np.where(tt < 0, sd_cap, sd_tube)
            else:
                sd = np.where(tt <= length, np.maximum(sd_tube, -tt - 1e3), np.hypot(ss - ck, tt - length) - rk)
            a = np.clip(.5 - sd, 0, 1)
            skin = col(np.clip((ss - (l_ + h_) / 2) / np.maximum((h_ - l_) / 2, 1), -1, 1))
            is_ink = (sd > -ink)
            if cap_top: is_ink = is_ink & (tt >= 0)
            core = np.clip((sd + ink) / 1.2, 0, 1)[..., None]                           # soft inner edge of the line
            rgb = np.where(is_ink[..., None], LINK[None, None, :] * core + skin * (1 - core), skin)
            px = hip[0] + U[0] * tg + N[0] * ss; py = hip[1] + U[1] * tg + N[1] * ss
            samp = np.stack([ndimage.map_coordinates(self.view[..., ci], [py, px], order=1) for ci in range(3)], -1)
            inside = ndimage.map_coordinates(self.legvis[side].astype(np.float32), [py, px], order=1)
            wgt = np.clip(inside, 0, 1)[..., None] * (~is_ink)[..., None]
            rgb = rgb * (1 - wgt) + samp * wgt
            rgba = np.dstack([rgb, a * 255]).clip(0, 255)
            self.save(name, rgba); self.skin_names.add(name)
            return [int(rows), int(cols)], rgba
        lt = Lk; ls = float(np.linalg.norm(ank - knee)) + 10
        r1, im1 = piece(f'thigh{side}', 34, lt, False, 0.0); top2 = int(np.ceil(rk)); r2, im2 = piece(f'shin{side}', top2, ls, True, Lk)
        spec = dict(thigh=dict(rows=r1[0], cols=r1[1], top_ext=34, length=lt), shin=dict(rows=r2[0], cols=r2[1], top_ext=top2, length=ls), hw=round(float(rk), 2),
                    knee_axis_offset=round(float(ck), 2), edge_fit=dict(lo=[round(float(v), 5) for v in plo], hi=[round(float(v), 5) for v in phi]))
        self.pieces.append((f'thigh{side}', im1, im1, ('quad', hip, knee, spec['thigh'])))
        self.pieces.append((f'shin{side}', im2, im2, ('quad', knee, ank, spec['shin'])))
        return spec

    def leg_joints(self, side, rows):
        """Hip on the leg's centre line extended up to y 930; knee half way between hip and ankle on that line."""
        ank = np.array(self.META[side]['ankle'], float)
        res = self.nonbg & ~self.cov['skirt'] & ~self.cov['sock' + side]
        cs, ys = [], []
        for y in range(rows[0], rows[1]):
            xs = np.nonzero(res[y, :512] if side == 'A' else res[y, 512:])[0] + (0 if side == 'A' else 512)
            if len(xs) > 20: cs.append((xs.min() + xs.max()) / 2); ys.append(y)
        cy, cx = float(np.mean(ys)), float(np.mean(cs))
        slope = (cx - ank[0]) / (cy - ank[1])                  # dx/dy of the line from the ankle through the leg's centre
        hy = 930.0; hx = ank[0] + slope * (hy - ank[1])
        hip = np.array([hx, hy]); knee = (hip + ank) / 2
        return [round(float(v), 1) for v in hip], [round(float(v), 1) for v in knee]

    # -------------------------------------------------------------------------------------------- cloth
    def sleeve_c(self, side, sext):
        im = self.part('sleeve' + side); box = self.pbox('sleeve' + side); x, y, w, h = box
        ext = sext[y:y + h, x:x + w]
        lost = int(sext.sum() - ext.sum())
        im = im.copy()
        im[..., :3] = np.where(ext[..., None], self.view[y:y + h, x:x + w], im[..., :3])
        im[..., 3] = np.where(ext, 255, im[..., 3])
        raw = im.copy()
        out = retone(im, is_cream(im) | ((im[..., 3] > 128) & (im[..., 0] > 190)))
        self.add_box_piece(f'sleeve{side}_c', out, box, raw=raw, kind='cloth')
        return out, box, lost

    def cap(self, side, sleeve_rgba, box):
        a = self.info[side]; sh = np.array(a['sh']); u = np.array(a['dir'])
        im = sleeve_rgba.copy(); yy_, xx_ = np.mgrid[0:im.shape[0], 0:im.shape[1]]
        t = (xx_ + box[0] - sh[0]) * u[0] + (yy_ + box[1] - sh[1]) * u[1]
        im[..., 3] *= np.clip((30 - t) / 22, 0, 1)
        self.add_box_piece(f'cap{side}', im, box, kind='cloth')

    def socks(self):
        for sd in 'AB':
            im = self.part('sock' + sd)
            self.add_box_piece(f'sock{sd}_c', retone(im, is_cream(im) | ((im[..., 3] > 128) & (im[..., 0] > 190))), self.pbox('sock' + sd), raw=im, kind='cloth')

    def skirt_full(self):
        """The pack's skirt part with its own hem ink line added where the part stops short of it (over the legs and between
        them the pack left the hem's outline out). Same box."""
        sk = self.part('skirt'); x, y, w, h = self.pbox('skirt')
        a = sk[..., 3] > 128
        dark = (self.view[y:y + h, x:x + w].sum(axis=2) < 420) & self.nonbg[y:y + h, x:x + w]
        grow = a.copy()
        for _ in range(6):                                  # grow downwards only, through dark pixels
            nxt = np.zeros_like(grow); nxt[1:] = grow[:-1]
            grow |= nxt & dark
        add = grow & ~a
        sk = sk.copy(); sk[..., :3] = np.where(add[..., None], self.view[y:y + h, x:x + w], sk[..., :3]); sk[..., 3] = np.where(add, 255, sk[..., 3])
        self.hem_added = int(add.sum())
        return sk

    def torso_from_view(self, owned_extra):
        """The pack's torso silhouette, with the view's own pixels wherever the view shows the torso there (not head, sleeve,
        arm): the pack's part has painted-over spots (and in the back view the waistband and bow loops painted red)."""
        tor = self.part('torso'); box = self.pbox('torso'); x, y, w, h = box
        own = ~(self.cov['head'] | self.cov['sleeveA'] | self.cov['sleeveB'] | owned_extra) & self.nonbg
        o = own[y:y + h, x:x + w] & (tor[..., 3] > 0)
        tor = tor.copy(); tor[..., :3] = np.where(o[..., None], self.view[y:y + h, x:x + w], tor[..., :3])
        # the dress's outline where neither the torso nor the skirt part holds it (the waist corners): add it to the torso
        allcov = np.zeros((self.H, self.W), bool)
        for m in self.cov.values(): allcov |= m
        near = ndimage.binary_dilation(self.cov['torso'] | self.cov['skirt'], iterations=4)
        dark = self.nonbg & (self.view.sum(axis=2) < 420) & ~allcov & ~owned_extra & near
        add = dark[y:y + h, x:x + w]
        tor[..., :3] = np.where(add[..., None], self.view[y:y + h, x:x + w], tor[..., :3]); tor[..., 3] = np.where(add, 255, tor[..., 3])
        self.outline_added = int(add.sum())
        return tor, box

    def torso_cloth(self, tor):
        cr = is_cream(tor)
        h_, s_, v_ = rgb_to_hsv(tor[..., :3])
        walls = (tor[..., 3] > 128) & (v_ < .55)
        lab, k = ndimage.label(cr & ~ndimage.binary_dilation(walls, iterations=1))
        cloth = np.zeros(cr.shape, bool); comps = []
        for i in range(1, k + 1):
            m = lab == i; ys, xs = np.nonzero(m)
            if m.sum() < 40: continue
            skin = ys.mean() <= .12 * tor.shape[0] + 30   # the neck / chest skin (cut_cloth.py's rule)
            comps.append((int(m.sum()), int(ys.mean()), int(xs.mean()), 'skin' if skin else 'cloth'))
            if not skin: cloth |= m
        cloth = ndimage.binary_dilation(cloth, iterations=2) & (cr | ((tor[..., 3] > 128) & (v_ > .55) & (tor[..., 0] > 200)))
        return cloth, comps

    def base_layer(self, src, shrink, name, box):
        m = ndimage.binary_erosion(ndimage.binary_closing(src[..., 3] > 128, iterations=10), iterations=shrink)
        out = np.zeros_like(src); out[..., :3] = np.array([214, 200, 176], np.float32)
        out[..., 3] = ndimage.gaussian_filter(m.astype(np.float32), 1.2) * 255
        self.add_box_piece(name, out, box, kind='cloth')

    def red_fill(self, rgba, under, plain):
        """Fill `under` with one red per row (median of the plain red on that row), smoothed down the rows (cut_cloth.py)."""
        Hh, Ww = rgba.shape[:2]
        rowc = np.zeros((Hh, 3), np.float32); have = np.zeros(Hh, bool)
        for y in range(Hh):
            px = rgba[y][plain[y]][:, :3]
            if len(px) > 12: rowc[y] = np.median(px, axis=0); have[y] = True
        ys_ = np.arange(Hh); rowc = np.stack([np.interp(ys_, ys_[have], rowc[have, c]) for c in range(3)], 1)
        rowc = ndimage.gaussian_filter1d(rowc, 14, axis=0)
        fill = np.repeat(rowc[:, None, :], Ww, axis=1)
        fill = fill * (1 + .035 * np.sin(np.arange(Ww)[None, :, None] / 37.))
        out = rgba.copy()
        out[..., :3] = np.where(under[..., None], fill, out[..., :3]); out[..., 3] = np.where(under, 255, out[..., 3])
        return out

    def strap(self):
        strap = np.zeros((8, 30, 4), np.float32)
        strap[..., :3] = np.array([0xe6, 0x9d, 0x43], np.float32); strap[..., 3] = 255
        strap[:, :3, :3] = INK; strap[:, -3:, :3] = INK
        self.save('strap', strap)

    # -------------------------------------------------------------------------------------------- rig points
    def head_points(self):
        hm = self.cov['head']; nx = int(self.META['neck'][0])
        cols = hm[:, nx - 30:nx + 30]
        tops = [np.nonzero(cols[:, i])[0].min() for i in range(cols.shape[1]) if cols[:, i].any()]
        top_y = float(np.median(tops))
        r, g, b = self.view[..., 0], self.view[..., 1], self.view[..., 2]
        hair = hm & (r < 175) & (r > 60) & (g < 95) & (b < 70) & (r > 1.4 * g)
        ys, xs = np.nonzero(hair)
        tip_y = float(np.percentile(ys, 99.5))
        return [float(nx), top_y], hair, tip_y

    def skirt_bones(self):
        m = self.cov['skirt']
        def edges(y):
            xs = np.nonzero(m[y])[0]; return float(xs.min()), float(xs.max())
        ys = np.nonzero(m.any(axis=1))[0]
        cx = float(self.info['pelvis'][0])
        hem_c = float(np.nonzero(m[:, int(cx)])[0].max())
        y_top = 770
        l0, r0 = edges(y_top)
        yh = int(hem_c - 70); lh, rh = edges(yh)
        hemL = lh + .2 * (rh - lh); hemR = rh - .2 * (rh - lh)
        def hem_at(x): return float(np.nonzero(m[:, int(round(x))])[0].max() - 10)
        return dict(skirt=[[cx, y_top], [cx, hem_c - 10]],
                    skirt_L=[[round(l0 + .25 * (cx - l0), 1), y_top], [round(hemL, 1), hem_at(hemL)]],
                    skirt_R=[[round(r0 - .25 * (r0 - cx), 1), y_top], [round(hemR, 1), hem_at(hemR)]])

    # -------------------------------------------------------------------------------------------- checks
    def place(self, canvas, rgba, placement):
        """Alpha-composite a piece onto a float RGB canvas (view size) at its bind pose."""
        if placement[0] == 'box':
            _, x, y = placement; h, w = rgba.shape[:2]
            x0, y0, x1, y1 = max(0, x), max(0, y), min(self.W, x + w), min(self.H, y + h)
            src = rgba[y0 - y:y1 - y, x0 - x:x1 - x]
            a = src[..., 3:4] / 255.
            canvas[y0:y1, x0:x1] = canvas[y0:y1, x0:x1] * (1 - a) + src[..., :3] * a
            m = np.zeros((self.H, self.W), np.float32); m[y0:y1, x0:x1] = a[..., 0]; return m
        _, org, to, spec = placement
        u = (np.array(to) - np.array(org)) / np.linalg.norm(np.array(to) - np.array(org)); n = np.array([u[1], -u[0]]); hw = spec['cols'] / 2.0
        # output (x, y) -> input (col, row): col = n.(p - org) + hw, row = u.(p - org) + top_ext
        data = (n[0], n[1], -n @ org + hw, u[0], u[1], -u @ org + spec['top_ext'])
        im = Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA')
        # premultiply to avoid dark fringes when resampling
        pm = np.asarray(im).astype(np.float32); pm[..., :3] *= pm[..., 3:4] / 255.
        chans = [np.asarray(Image.fromarray(pm[..., c]).transform((self.W, self.H), Image.AFFINE, data, resample=Image.BILINEAR)) for c in range(4)]
        a = chans[3][..., None] / 255.
        canvas[:] = canvas * (1 - a) + np.stack(chans[:3], -1)
        return a[..., 0]

    def assemble(self, order, extra_orig, raw=False):
        """Draw pieces bottom-up (order is first = on top). extra_orig: masks to copy from the original (hands) at a place in
        the order, given as ('ORIG', mask)."""
        canvas = np.zeros((self.H, self.W, 3), np.float32) + BG
        byname = {p[0]: p for p in self.pieces}
        for name in reversed(order):
            if isinstance(name, tuple):
                m = name[1].astype(np.float32)[..., None]; canvas = canvas * (1 - m) + self.view * m; continue
            nm, fin, rw, pl = byname[name]
            self.place(canvas, rw if raw else fin, pl)
        return canvas

    def checks(self, order, cloth_view_mask, report):
        V = self.V
        hands = [('ORIG', self.hand_masks[s]) for s in 'AB']
        order2 = []
        for nm in order:
            if nm in ('HAND_A', 'HAND_B'): order2.append(hands['AB'.index(nm[-1])])
            else: order2.append(nm)
        asm = self.assemble(order2, None)
        raw = self.assemble(order2, None, raw=True)
        Image.fromarray(np.clip(asm, 0, 255).astype(np.uint8)).save(self.CHK / f'{V}_assembled.png')
        d = np.abs(asm - self.view).max(axis=2)
        dr = np.abs(raw - self.view).max(axis=2)
        Image.fromarray(np.clip(d * 3, 0, 255).astype(np.uint8)).save(self.CHK / f'{V}_diff.png')
        Image.fromarray(np.clip(dr * 3, 0, 255).astype(np.uint8)).save(self.CHK / f'{V}_diff_raw.png')
        sil = self.nonbg | (np.abs(asm - BG).max(axis=2) > 24)
        outside = ~cloth_view_mask
        big = d > 24
        legs = np.zeros_like(sil)
        for sd in 'AB':                                   # the bare legs are rebuilt tubes (as in tq): reported apart
            hip, ank = np.array(self.info['hip' + sd]), np.array(self.info['ankle' + sd])
            hw = self.info['legpiece'][sd]['hw']
            u = (ank - hip) / np.linalg.norm(ank - hip); n = np.array([-u[1], u[0]])
            tt = (self.xx - hip[0]) * u[0] + (self.yy - hip[1]) * u[1]; ss = (self.xx - hip[0]) * n[0] + (self.yy - hip[1]) * n[1]
            legs |= (np.abs(ss) < hw + 6) & (tt > 0) & (tt < np.linalg.norm(ank - hip)) & ~self.cov['skirt'] & ~self.cov['sock' + sd] & ~self.cov['boot' + sd]
        stats = dict(
            image_pct_gt24_outside_cloth=round(100 * (big & outside).sum() / big.size, 3),
            silhouette_pct_gt24_outside_cloth=round(100 * (big & outside & sil).sum() / (sil & outside).sum(), 3),
            silhouette_pct_gt24_outside_cloth_and_legs=round(100 * (big & outside & sil & ~legs).sum() / (sil & outside & ~legs).sum(), 3),
            raw_silhouette_pct_gt24_all=round(100 * ((dr > 24) & sil).sum() / sil.sum(), 3),
            raw_silhouette_pct_gt24_without_legs=round(100 * ((dr > 24) & sil & ~legs).sum() / (sil & ~legs).sum(), 3),
            bare_leg_pct_gt24=round(100 * ((dr > 24) & legs).sum() / max(1, legs.sum()), 2))
        report['assembly'] = stats
        # where the remaining differences are (outside cloth and legs)
        lab, k = ndimage.label(big & outside & sil & ~legs)
        blobs = []
        for i, sl in enumerate(ndimage.find_objects(lab)):
            sz = int((lab[sl] == i + 1).sum())
            if sz >= 25: blobs.append(dict(x=[sl[1].start, sl[1].stop], y=[sl[0].start, sl[0].stop], px=sz))
        report['diff_blobs'] = sorted(blobs, key=lambda b: -b['px'])[:12]
        # zoom crops: original | assembled | diff, for the joints
        crops = []
        def crop(cx, cy, r=70):
            b = (int(cx - r), int(cy - r), int(cx + r), int(cy + r))
            row = [Image.fromarray(self.view.astype(np.uint8)).crop(b), Image.fromarray(np.clip(asm, 0, 255).astype(np.uint8)).crop(b),
                   Image.fromarray(np.clip(d * 3, 0, 255).astype(np.uint8)).convert('RGB').crop(b)]
            return [im.resize((280, 280), Image.NEAREST) for im in row]
        pts = []
        for sd in 'AB':
            a = self.info[sd]; pts += [a['sh'], a['elbow'], a['wrist']]
        pts += [self.info['kneeA'], self.info['kneeB']]
        if 'bow1' in self.files: pts.append([512, 715])
        sheet = Image.new('RGB', (3 * 290, len(pts) * 290), (255, 255, 255))
        for i, p in enumerate(pts):
            for j, im in enumerate(crop(*p)): sheet.paste(im, (j * 290, i * 290))
        sheet.save(self.CHK / f'{V}_joints_zoom.png')
        return stats

    def contact_sheet(self, report):
        V = self.V
        def classify(rgba):
            a = rgba[..., 3] > 200
            h, s, v = rgb_to_hsv(rgba[..., :3])
            body = a & (v > .72)                                             # not ink, not deep shade
            linen = body & (s < .30) & (h > 15) & (h < 60)                   # reads as cloth (linen / cream after re-tone)
            skinlike = body & (s >= .36) & (h >= 14) & (h <= 34) & (rgba[..., 0] > 225)   # reads as skin
            return body, linen, skinlike
        rows = []; res = {}
        names = sorted(self.skin_names - {'legA', 'legB'}) + sorted(self.cloth_names - {f'slip', 'chemise'})
        for nm in names:
            im = np.asarray(Image.open(self.OUT / f'{V}_{nm}.png').convert('RGBA')).astype(np.float32)
            body, linen, skinlike = classify(im)
            kind = 'skin' if nm in self.skin_names else 'cloth'
            bad = linen if kind == 'skin' else skinlike
            extra = {}
            if nm in getattr(self, 'mixed', {}):                  # torso: cloth (collar, waistband) and skin (neck) in one picture
                cm = self.mixed[nm]
                bad = (skinlike & cm) | (linen & ~ndimage.binary_dilation(cm, iterations=3) & self.mixed_skin[nm])
                extra = dict(note='cloth region checked for skin colour, neck region checked for linen', skin_region_px=int((body & self.mixed_skin[nm]).sum()))
            res[nm] = dict(kind=kind, body_px=int(body.sum()), wrong_px=int(bad.sum()), wrong_pct=round(100 * bad.sum() / max(1, body.sum()), 2), **extra)
            rows.append((nm, im, bad))
        # torso: the neck skin is skin, the rest cloth: report both halves
        report['retone'] = res
        cell = 2
        W = 8 + sum(min(400, r[1].shape[1] * cell) + 12 for r in rows[:6])
        tiles = []
        for nm, im, bad in rows:
            bgc = np.zeros(im.shape[:2] + (3,), np.float32) + np.array([110, 150, 110])
            a = im[..., 3:4] / 255.; comp = bgc * (1 - a) + im[..., :3] * a
            mark = comp.copy(); mark[bad] = [255, 0, 255]
            t = np.concatenate([comp, np.full((im.shape[0], 6, 3), 255.), mark], 1)
            t = Image.fromarray(t.astype(np.uint8)).resize((t.shape[1] * cell, t.shape[0] * cell), Image.NEAREST)
            lab = Image.new('RGB', (t.width, 24), (255, 255, 255)); ImageDraw.Draw(lab).text((4, 6), f'{nm}  ({res[nm]["kind"]}, wrong {res[nm]["wrong_px"]} px)', fill=(0, 0, 0))
            tt = Image.new('RGB', (t.width, t.height + 24), (255, 255, 255)); tt.paste(lab, (0, 0)); tt.paste(t, (0, 24)); tiles.append(tt)
        # pack tiles in rows of max width 1800
        rws, cur, wcur = [], [], 0
        for t in tiles:
            if wcur + t.width > 1800 and cur: rws.append(cur); cur, wcur = [], 0
            cur.append(t); wcur += t.width + 10
        if cur: rws.append(cur)
        Wt = max(sum(t.width + 10 for t in r) for r in rws); Ht = sum(max(t.height for t in r) + 10 for r in rws)
        sheet = Image.new('RGB', (Wt, Ht), (255, 255, 255)); y = 0
        for r in rws:
            x = 0
            for t in r: sheet.paste(t, (x, y)); x += t.width + 10
            y += max(t.height for t in r) + 10
        sheet.save(self.CHK / f'{V}_cloth_skin_sheet.png')

    def joint_table(self, report):
        I = self.info; L = []
        def dist(a, b): return math.dist(a, b)
        L.append(f'{self.V}: joints (view px, 996 px = 1 m)')
        for sd in 'AB':
            a = I[sd]
            L.append(f"  arm {sd}: sh {np.round(a['sh'], 1).tolist()} elbow {np.round(a['elbow'], 1).tolist()} wrist {np.round(a['wrist'], 1).tolist()} "
                     f"dir {np.round(a['dir'], 3).tolist()} half {a['half']:.1f} axis_offset {a['axis_offset']:.2f}")
            L.append(f"         upper arm {dist(a['sh'], a['elbow']):.1f} px (pack 149), forearm to wrist joint {dist(a['elbow'], a['wrist']):.1f} px "
                     f"(139 - 14 overlap = 125; bone to hand-sprite anchor {dist(a['elbow'], a['wrist']) + 14:.1f})")
        for sd in 'AB':
            h, k, an = I['hip' + sd], I['knee' + sd], I['ankle' + sd]
            th, sh_ = dist(h, k), dist(k, an); tot = dist(h, an)
            between = (min(h[1], an[1]) < k[1] < max(h[1], an[1]))
            L.append(f"  leg {sd}: hip {h} knee {k} ankle {an}: thigh {th:.1f} shin {sh_:.1f} (pack 199/199), hip-ankle {tot:.1f}, "
                     f"knee between hip and ankle: {between}, straight-leg reach used {tot / (th + sh_):.3f}")
        L.append(f"  pelvis {I['pelvis']} neck {I['neck']} head_top {I['rig']['head_top']} hair {I['rig']['hair']}")
        for k in ('skirt_L', 'skirt', 'skirt_R', 'apron', 'bow1', 'bow2'):
            if k in I['rig']: L.append(f"  {k}: {I['rig'][k]}")
        L.append(f"  bag {I['rig']['bag']} visible {I['rig']['bag_visible']}")
        for sd in 'AB':
            h = I['hand'][sd]; L.append(f"  hand {sd}: wrist {np.round(h['wrist'], 1).tolist()} dir {np.round(h['dir'], 3).tolist()} visible length {h['length']:.0f} px tip {h['tip']}")
        txt = '\n'.join(L); (self.CHK / f'{self.V}_joints.txt').write_text(txt + '\n'); print(txt)


# ------------------------------------------------------------------------------------------------ the common pipeline
def run(V, leg_rows, dress_hook, rig_extra, json_extra):
    """dress_hook(c, torso_rgba, torso_box) -> (torso_rgba, list of extra piece names drawn between bows and torso) does the
    view's own cloth work (apron or bow) and returns the torso before re-tone."""
    c = Cutter(V); I = c.info
    I['_ppm'] = 996
    segs = {sd: c.segment_arm(sd) for sd in 'AB'}
    sleeves = {sd: c.sleeve_c(sd, segs[sd]['sext']) for sd in 'AB'}
    notes = {}
    hand = {}
    for sd in 'AB':
        s_rgba, box, lost = sleeves[sd]
        sva = c.to_view(s_rgba, box)[..., 3]
        I[sd], hand[sd], note = c.cut_arm(sd, segs[sd], sva)
        note['sleeve_px_added'] = int(segs[sd]['sext'].sum()); note['sleeve_px_outside_box'] = lost
        notes[sd] = note
    for sd in 'AB': c.cap(sd, sleeves[sd][0], sleeves[sd][1])
    for sd in 'AB':
        I['leg' + sd] = c.cut_leg(sd, leg_rows)
    I['pelvis'] = [float(v) for v in json_extra.pop('pelvis')]
    for sd in 'AB':
        I['hip' + sd], I['knee' + sd] = c.leg_joints(sd, leg_rows)
        I['ankle' + sd] = c.META[sd]['ankle']
    I['neck'] = c.META['neck']
    I['legpiece'] = {sd: c.make_leg_pieces(sd) for sd in 'AB'}
    c.socks()
    # torso and the view's own cloth
    owned = segs['A']['arm'] | segs['B']['arm'] | segs['A']['sext'] | segs['B']['sext']
    tor, tbox = c.torso_from_view(owned)
    tor, between = dress_hook(c, tor, tbox)
    cloth, comps = c.torso_cloth(tor)
    notes['torso_cream_components'] = comps
    notes['outline_px_added_to_torso'] = c.outline_added
    c.mixed = {'torso_c': cloth}
    c.mixed_skin = {'torso_c': is_cream(tor) & ~cloth & (np.mgrid[0:tor.shape[0], 0:tor.shape[1]][0] < .12 * tor.shape[0] + 60)}
    c.add_box_piece('torso_c', retone(tor, cloth), tbox, raw=tor, kind='cloth')
    c.base_layer(c.skirt_full(), 22, 'slip', c.pbox('skirt'))
    notes['hem_ink_px_added_to_skirt'] = c.hem_added
    c.base_layer(c.part('torso'), 14, 'chemise', tbox)
    c.strap()
    # pack parts that are used as they are (for the checks only)
    for n in ['head', 'bootA', 'bootB', 'brow0', 'brow1', 'mouth']:
        if f'{V}_{n}' not in PARTS: continue
        im = c.part(n); b = c.pbox(n); c.pieces.append((n, im, im, ('box', b[0], b[1])))
    # rig
    head_top, hair, tip_y = c.head_points()
    rig = dict(head_top=head_top, hair=[[head_top[0], round(head_top[1] + 60, 1)], [head_top[0], round(tip_y - 10, 1)]])
    rig.update(c.skirt_bones())
    rig.update(rig_extra(c))
    I['rig'] = rig
    I['hand'] = {sd: dict(wrist=hand[sd]['wrist'], dir=hand[sd]['dir'], length=round(hand[sd]['length'], 1), tip=hand[sd]['tip'],
                          centroid=hand[sd]['centroid']) for sd in 'AB'}
    I['hand_length'] = round(max(hand[sd]['length'] for sd in 'AB'), 1)
    I.update(json_extra)
    I['boxes'] = dict(sorted(c.files.items()))
    I['parts'] = sorted(k for k in PARTS if k.startswith(V + '_'))
    I['_notes'] = dict(arm=notes, legs='thigh/shin: tq-format rigid pieces with a round knee; outline follows the drawn leg (linear taper fit, legpiece.*.edge_fit), skin is the drawing itself where the leg shows (hem shadow, knee light) and the strip colours elsewhere; knee lies on the hip-ankle line (leg straight at bind)', sleeves='pack sleeve part plus the sleeve pixels the pack left out (inside the pack box); cuff pixels outside the box ride on the upper arm piece', torso='torso_c uses the view pixels where the view shows the torso (pack part had painted-over spots); missing dress outline at the waist corners added')
    # checks
    face = [n for n in ('brow0', 'brow1', 'mouth') if f'{V}_{n}' in PARTS]
    order = ['HAND_A', 'foreA', 'sleeveA_c', 'capA', 'upperA', *face, 'head',
             'HAND_B', 'foreB', 'sleeveB_c', 'capB', 'upperB',
             *between, 'torso_c', *(['apron'] if 'apron' in c.files else []), 'skirtred', 'slip', 'chemise',
             'bootA', 'sockA_c', 'shinA', 'thighA', 'bootB', 'sockB_c', 'shinB', 'thighB']
    cmask = np.zeros((c.H, c.W), bool)
    for nm, fin, raw, pl in c.pieces:
        if nm in c.cloth_names and nm not in ('slip', 'chemise', 'capA', 'capB'):
            tmp = np.zeros((c.H, c.W, 3), np.float32); tmp2 = tmp.copy()
            a = c.place(tmp, fin, pl); c.place(tmp2, raw, pl)
            cmask |= (np.abs(tmp - tmp2).max(axis=2) > 2) & (a > .02)
    cmask = ndimage.binary_dilation(cmask, iterations=1)
    report = {}
    I['_checks'] = report
    (c.OUT / f'{V}.json').write_text(json.dumps(I, indent=1))
    c.checks(order, cmask, report)
    c.contact_sheet(report)
    c.joint_table(report)
    report['draw_order_top_first'] = order
    (c.OUT / f'{V}.json').write_text(json.dumps(I, indent=1))
    print(json.dumps({k: report[k] for k in ('assembly', 'retone', 'diff_blobs')}, indent=1))
    print('arm notes', json.dumps(notes))
    return c
