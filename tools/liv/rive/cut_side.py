"""Cut Liv's side view (03_side.png) for the Rive rig: limbs, cloth layers, waist-bow tail, joints.

    python3 tools/liv/rive/cut_side.py           (writes tools/liv/rive/side/, checks in side/check/)

The same recipe as the three-quarter view (cut_tq.py + cut_cloth.py), adapted to a view where the joints are not all in the
pack's meta. This file also holds the shared machinery (class ViewCut) that cut_tqb.py imports; everything that is specific to a
view (joint guesses, the far sleeve, bow-tail polygons, rig points) is in the CONFIG at the bottom of each script.

What is made (prefix V_ = side_):
  V_upperA/B.png, V_foreA/B.png   arms (view pixels, boxes in V.json A/B.upper/fore): the visible skin is the picture's own
                                  pixels, the part hidden under the sleeve or the bodice is a tube rebuilt from the forearm's
                                  cross-section; round elbow (upper arm ends in a disc with an ink arc, forearm starts with a disc)
                                  and a round cap at the shoulder. Arms end at the wrist (where the drawn hand starts); hands come
                                  from the hand rig.
  V_thighA/B.png, V_shinA/B.png   legs in their bone frames (the builder's quad: rows along the bone, columns across); the picture's
                                  pixels where the leg shows, a tube where skirt or sock hide it; round knee as in tq.
  V_sleeveA_c.png (+B), V_capA/B  re-toned sleeves (the pack's part plus the sleeve pixels the pack left behind) and shoulder caps.
  V_torso_c, V_skirtred, V_apron  re-toned bodice (cloth only; skin keeps the pack's colour), red skirt with the apron cut off,
                                  the apron; V_slip, V_chemise plain linen base layers; V_sockA/B_c re-toned socks.
  V_bow1.png (+bow2)              the waist-bow tails as their own pieces; the bodice and skirt behind them are filled in.
  V_strap.png                     the generic strap strip (the strap is not in the picture; the canvas rig draws one).
  V.json                          joints and boxes, same contract as tq/tq.json plus yaw, facing, A_is, far_arm, rig, hand, ...
  check/                          V_assembled.png, V_diff.png, V_labels.png, V_cloth_skin.png, V_joints.txt
"""
from pathlib import Path
import colorsys
import json
import math
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

HERE = Path(__file__).resolve().parent
PARTS = json.loads((HERE / 'parts/parts.json').read_text())
BG = np.array([0xBF, 0xD9, 0xE6], np.float32)
INK = np.array([0x3a, 0x1c, 0x0c], np.float32)
SKIN = np.array([0xfd, 0xb7, 0x7e], np.float32)
LEN_UP, LEN_FORE, LEN_LEG = 149.0, 139.0, 199.0          # 0.15 / 0.14 / 0.20 m at 996 px per metre
LINEN = dict(sat=.40, hue_to=39.0, hue_pull=.55, vlift=.015)   # as cut_cloth.py


def unit(v): v = np.asarray(v, float); return v / np.hypot(*v)


# ---------------------------------------------------------------- colour helpers (as cut_cloth.py)
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
    """Cloth pixels (mask) become linen: less saturated, a little yellower, folds keep their value. Ink is left alone."""
    h, s, v = rgb_to_hsv(rgba[..., :3])
    cream = mask & (v > .5)
    h2 = np.where(cream, h + (LINEN['hue_to'] - h) * LINEN['hue_pull'], h)
    s2 = np.where(cream, s * LINEN['sat'], s)
    v2 = np.where(cream, np.minimum(1, v + LINEN['vlift']), v)
    out = rgba.copy(); out[..., :3] = np.where(cream[..., None], hsv_to_rgb(h2, s2, v2), rgba[..., :3])
    return out


def cloth_like(rgb):
    """Cream cloth (blouse, apron, bow, socks) and its fold shades, not skin: the cream is yellower (g/r >= .775) than the
    skin (g/r .68-.74, its shade lower still)."""
    h, s, v = rgb_to_hsv(rgb)
    r = np.maximum(rgb[..., 0], 1)
    return (h > 20) & (h < 55) & (s < .62) & (v > .5) & (rgb[..., 1] / r >= .775)


def skin_like(rgb):
    h, s, v = rgb_to_hsv(rgb)
    r = np.maximum(rgb[..., 0], 1)
    return (h > 12) & (h < 40) & (v > .6) & (rgb[..., 1] / r < .765) & (rgb[..., 1] / r > .45) & (s > .3)


def is_ink(rgb): return rgb.sum(axis=-1) < 330


def is_red(rgb): return (rgb[..., 0] > 110) & (rgb[..., 1] < 110) & (rgb[..., 0] > 1.6 * rgb[..., 1])


class ViewCut:
    def __init__(self, V, view_file):
        self.V = V
        self.OUT = HERE / V; self.OUT.mkdir(exist_ok=True)
        self.CHK = self.OUT / 'check'; self.CHK.mkdir(exist_ok=True)
        self.view = np.asarray(Image.open(HERE / f'views/{view_file}').convert('RGB')).astype(np.float32)
        self.H, self.W = self.view.shape[:2]
        self.yy, self.xx = np.mgrid[0:self.H, 0:self.W]
        self.META = PARTS['_meta'][V]
        self.parts = {}
        for n in ['head', 'torso', 'skirt', 'sleeveA', 'sleeveB', 'sockA', 'sockB', 'bootA', 'bootB']:
            key = f'{V}_{n}'
            if key not in PARTS: continue
            p = PARTS[key]; im = np.asarray(Image.open(HERE / f'parts/{key}.png').convert('RGBA')).astype(np.float32)
            box = [int(round(p['x'])), int(round(p['y'])), im.shape[1], im.shape[0]]
            full = np.zeros((self.H, self.W, 4), np.float32)
            x, y, w, h = box; full[y:y + h, x:x + w] = im
            self.parts[n] = dict(box=box, rgba=full, cov=full[..., 3] > 128)
        self.cov = np.zeros((self.H, self.W), bool)
        for p in self.parts.values(): self.cov |= p['cov']
        self.fg = np.abs(self.view - BG).sum(axis=2) > 24
        self.res = self.fg & ~self.cov                            # what the pack's parts leave of the picture
        self.label = np.zeros((self.H, self.W), np.int16)         # residual pixels claimed by a piece (debug map)
        self.LBL = {}
        self.extra = {}                                           # piece -> bool mask of residual pixels it takes
        self.info = {}
        self.boxes = {}
        self.pieces = {}                                          # name -> (full-canvas RGBA, kind) for the check composite

    # ------------------------------------------------------------ helpers
    def claim(self, name, m):
        m = m & self.res & (self.label == 0)
        if name not in self.LBL: self.LBL[name] = len(self.LBL) + 1
        self.label[m] = self.LBL[name]
        self.extra[name] = self.extra.get(name, np.zeros_like(m)) | m
        return m

    def soft(self, mask):
        a = np.maximum(mask.astype(np.float32), ndimage.gaussian_filter(mask.astype(np.float32), .6) * .9)
        return a * 255

    def save_box(self, name, rgba_full, box):
        x, y, w, h = box
        self.boxof = getattr(self, 'boxof', {}); self.boxof[name] = list(box)
        Image.fromarray(np.clip(rgba_full[y:y + h, x:x + w], 0, 255).astype(np.uint8), 'RGBA').save(self.OUT / f'{self.V}_{name}.png')

    def save_tight(self, name, rgb, mask):
        ys, xs = np.nonzero(mask); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        x0, y0 = max(0, x0 - 1), max(0, y0 - 1); x1, y1 = min(self.W, x1 + 1), min(self.H, y1 + 1)
        full = np.zeros((self.H, self.W, 4), np.float32); full[..., :3] = rgb; full[..., 3] = self.soft(mask)
        box = [int(x0), int(y0), int(x1 - x0), int(y1 - y0)]
        self.save_box(name, full, box)
        return box, full

    # ------------------------------------------------------------ arms
    def arm_frame(self, sh, u):
        sh = np.asarray(sh, float); u = unit(u); n = np.array([-u[1], u[0]])
        t = (self.xx - sh[0]) * u[0] + (self.yy - sh[1]) * u[1]; s = (self.xx - sh[0]) * n[0] + (self.yy - sh[1]) * n[1]
        return sh, u, n, t, s

    def fit_arm_line(self, sh_guess, u_guess, y_sh, iters=4):
        """For an arm whose shoulder is hidden: fit the visible arm's centre line and put the shoulder where it crosses y_sh."""
        sh = np.asarray(sh_guess, float); u = unit(u_guess)
        for _ in range(iters):
            sh, u, n, t, s = self.arm_frame(sh, u)
            ts, cs = [], []
            for tk in range(120, 256, 3):
                row = self.fg & (np.abs(t - tk) < .5) & (np.abs(s) < 60)
                ss = np.sort(s[row])
                if len(ss) < 5: continue
                segs = np.split(ss, np.nonzero(np.diff(ss) > 2)[0] + 1)
                seg = min(segs, key=lambda z: abs(z.mean()))
                ts.append(tk); cs.append((seg[0] + seg[-1]) / 2)
            k = np.polyfit(ts, cs, 1)
            p0 = sh + n * k[1]; p1 = sh + u * 250 + n * (k[0] * 250 + k[1]); u = unit(p1 - p0)
            sh = p0 + u * ((y_sh - p0[1]) / u[1])
        return sh, u

    def sleeve_extras(self, sd, zone_px=14, extra_zone=None, avail=None):
        """Residual sleeve pixels next to the pack's sleeve part (cuff undersides the pack left in the picture): cream, and the
        ink touching it."""
        if 'sleeve' + sd in self.parts:
            base = self.parts['sleeve' + sd]['cov']
            zone = ndimage.binary_dilation(base, iterations=zone_px)
        else:
            base = np.zeros((self.H, self.W), bool); zone = extra_zone
        rgb = self.view
        # regions walled by the drawing's ink lines; a region is sleeve when it is mostly cream (shaded folds included)
        wall = ndimage.binary_dilation(rgb.sum(axis=-1) < 450, iterations=1)
        res = self.res if avail is None else avail
        lab, k = ndimage.label(res & zone & ~wall)
        gr = rgb[..., 1] / np.maximum(rgb[..., 0], 1)
        cream = np.zeros((self.H, self.W), bool)
        near = ndimage.binary_dilation(base, iterations=4) if base.any() else zone
        for i, sl in enumerate(ndimage.find_objects(lab), 1):
            m = lab[sl] == i
            if m.sum() < 4: continue
            if np.median(gr[sl][m]) >= .775 and ((near[sl] & m).any() or m.sum() > 150): cream[sl] |= m
        ink = res & zone & wall & ndimage.binary_dilation(cream | base, iterations=3) & ~skin_like(rgb)
        m = ndimage.binary_fill_holes(ndimage.binary_closing(cream | ink, iterations=1)) & res & zone
        return m

    def cut_arm(self, sd, sh, u, sleeve_mask):
        """sleeve_mask: everything that is sleeve (part and extras) for this arm. Returns the joint dict (tq contract)."""
        V = self.V
        sh, u, n, t, s = self.arm_frame(sh, u)
        hidden = self.cov | sleeve_mask
        cand = self.res & ~sleeve_mask & (self.label == 0) & (t > 20) & (t < 470) & (np.abs(s) < 110)
        cand = ndimage.binary_opening(cand, iterations=1)
        lab, k = ndimage.label(cand)
        core = (t > LEN_UP + 20) & (t < 230) & (np.abs(s) < 12)
        cnt = ndimage.sum(core, lab, range(1, k + 1))
        comp = lab == (1 + int(np.argmax(cnt)))
        comp = ndimage.binary_fill_holes(comp)
        # wrist: where the drawn hand starts (the arm narrows to the wrist, then widens)
        prof = []
        for tk in range(190, 330, 2):
            row = comp & (np.abs(t - tk) < .5)
            if row.sum() < 3: continue
            prof.append((tk, s[row].max() - s[row].min()))
        prof = np.array(prof); w_ = prof[(prof[:, 0] >= 200) & (prof[:, 0] <= 320)]
        tn = w_[np.argmin(w_[:, 1]), 0]; wmin = w_[:, 1].min()
        flare = [r[0] for r in w_ if r[0] > tn and r[1] > wmin + 6]
        tw = float(np.clip(flare[0] if flare else tn + 8, 250, 292))
        arm = comp & (t < tw)
        # cross-section of the forearm (skin and its ink) a little below the elbow, repeated along the hidden upper arm
        ts = np.arange(LEN_UP + 22, LEN_UP + 62)
        cen, hw = [], []
        for tk in ts:
            row = arm & (np.rint(t) == tk)
            if row.sum() > 5: cen.append((s[row].min() + s[row].max()) / 2); hw.append((s[row].max() - s[row].min()) / 2)
        s_c, half_f = float(np.median(cen)), float(np.median(hw))
        sn = np.linspace(-1.12, 1.12, 56)
        prof3 = np.zeros((len(sn), 3), np.float32)
        for ci in range(3):
            vals = []
            for tk in ts[::3]:
                px = sh[0] + u[0] * tk + n[0] * (s_c + sn * half_f); py = sh[1] + u[1] * tk + n[1] * (s_c + sn * half_f)
                vals.append(ndimage.map_coordinates(self.view[..., ci], [py, px], order=1))
            prof3[:, ci] = np.median(vals, axis=0)
        half = half_f * 1.04
        # under the cuff only the arm's own band is arm (shadows and slivers beside it stay with the sleeve or the bodice)
        arm = arm & ~((t < LEN_UP + 14) & (np.abs(s - s_c) > half * 1.1))
        hand = comp & (t >= tw - 14)
        self.claim(f'arm{sd}', arm); self.claim(f'hand{sd}', hand & ~arm)
        self.hands = getattr(self, 'hands', {}); self.hands[sd] = hand
        cap_c = 6.0                                                   # the round cap's centre sits just below the shoulder joint
        snn = (s - s_c) / half
        tube = ((t >= cap_c) & (t < LEN_UP + 14) & (np.abs(snn) <= 1.0)) | (np.hypot(t - cap_c, s - s_c) <= half)
        syn = self.view.copy(); ii = np.clip((snn + 1.12) / 2.24 * (len(sn) - 1), 0, len(sn) - 1)
        for ci in range(3): syn[..., ci] = np.where(tube, np.interp(ii, np.arange(len(sn)), prof3[:, ci]), self.view[..., ci])
        edge = tube & (np.abs(snn) > 1 - 2.8 / half) | (tube & (np.hypot(t - cap_c, s - s_c) > half - 2.8) & (t < cap_c))
        for ci in range(3): syn[..., ci] = np.where(edge, INK[ci] * .85 + syn[..., ci] * .15, syn[..., ci])
        # upper arm: the picture where the arm shows, the tube where sleeve or bodice hide it
        vis = arm & (t < LEN_UP + 14)
        up_img = np.where(vis[..., None], self.view, syn)
        el = sh + u * LEN_UP + n * s_c
        d = np.hypot(self.xx - el[0], self.yy - el[1]); r = half * 0.98
        up_body = (vis & (t < LEN_UP)) | (tube & hidden & (t < LEN_UP))
        disc = (d <= r) & (ndimage.binary_dilation(arm, iterations=1) | hidden)
        upper = up_body | disc
        arc = (d <= r) & (d > r - 3.2) & (t >= LEN_UP - 2)
        up_img[disc & ~vis & ~tube] = SKIN
        up_img[arc] = INK
        # forearm: the picture from the elbow to the wrist, plus a plain disc over the elbow
        fdisc = (d <= r - 3.4) & (t < LEN_UP)
        fore = (arm & (t >= LEN_UP)) | fdisc
        fo_img = self.view.copy()
        fo_img[fdisc & ~arm] = SKIN
        fo_img[fdisc & arm & (is_ink(self.view) | ~skin_like(self.view))] = SKIN
        wr = sh + u * tw + n * s_c
        box_up, full_up = self.save_tight(f'upper{sd}', up_img, upper)
        box_fo, full_fo = self.save_tight(f'fore{sd}', fo_img, fore)
        self.pieces[f'upper{sd}'] = full_up; self.pieces[f'fore{sd}'] = full_fo
        self.pieces[f'hand{sd}*'] = np.dstack([self.view, self.soft(self.hands[sd])])     # check only: the drawn hand
        return dict(sh=[float(v) for v in sh], elbow=[float(v) for v in el], wrist=[float(v) for v in wr], dir=[float(v) for v in u],
                    half=half, axis_offset=s_c, upper=box_up, fore=box_fo, _tw=tw)

    # ------------------------------------------------------------ legs
    def cut_leg(self, sd, ankle, y_top, y_bot, x_hint):
        """Find the drawn leg between the hem and the sock, fit its centre line, put the knee on it 199 px from the ankle and the
        hip 199 px further up the same line."""
        under = self.cov & ~self.parts['sock' + sd]['cov'] | self.parts['sock' + sd]['cov']
        cand = self.res & (self.label == 0) & (self.yy >= y_top) & (self.yy <= y_bot)
        lab, k = ndimage.label(cand)
        hit = [lab[y_, x_] for y_, x_ in [((y_top + y_bot) // 2, x_hint)] if lab[y_, x_]]
        if not hit:
            d = [(abs(np.nonzero(lab == i)[1].mean() - x_hint), i) for i in range(1, k + 1) if (lab == i).sum() > 500]
            hit = [min(d)[1]]
        leg = ndimage.binary_fill_holes(lab == hit[0])
        self.claim(f'leg{sd}', leg)
        ys, cx, wd = [], [], []
        for y in range(y_top, y_bot + 1):
            xs = np.nonzero(leg[y])[0]
            if len(xs) < 10: continue
            # rows touching the skirt or the sock are left out of the fit
            if self.cov[y, max(0, xs.min() - 2):xs.max() + 3].any() or self.cov[max(0, y - 3):y + 4, xs.min():xs.max() + 1].any(): continue
            ys.append(y); cx.append((xs.min() + xs.max()) / 2); wd.append(xs.max() - xs.min() + 1)
        a, b = np.polyfit(ys, cx, 1)
        u = unit([a, 1.0])                                             # down the leg
        ank = np.asarray(ankle, float)
        # knee: the point of the line x = a y + b at distance LEN_LEG from the ankle (the upper one)
        p0 = np.array([b, 0.0]); dd = p0 - ank; B_ = 2 * dd.dot(u); C_ = dd.dot(dd) - LEN_LEG ** 2
        disc = B_ * B_ - 4 * C_
        if disc < 0: raise SystemExit(f'leg {sd}: the drawn line does not come within 199 px of the ankle')
        lam = (-B_ - math.sqrt(disc)) / 2; knee = p0 + u * lam
        if knee[1] > ank[1]: lam = (-B_ + math.sqrt(disc)) / 2; knee = p0 + u * lam
        hip = knee - u * LEN_LEG
        self.legfit = getattr(self, 'legfit', {}); self.legfit[sd] = dict(rows=(min(ys), max(ys)), slope=a, width=float(np.median(wd)) * abs(u[1]))
        return leg, [float(v) for v in hip], [float(v) for v in knee], [float(v) for v in ank]

    def leg_pieces(self, sd, leg, hip, knee, ank):
        """Thigh and shin pieces in the builder's quad frame (row r -> t = r + .5 - top_ext along the bone, column c ->
        s = c + .5 - hw across, n = (u_y, -u_x)). Real pixels where the leg shows, a tube where it is hidden, round knee."""
        hip, knee, ank = (np.asarray(p, float) for p in (hip, knee, ank))
        legf = leg.astype(np.float32)
        opaque = np.zeros((self.H, self.W), bool)                  # under a part's opaque interior (not its soft edge)
        for pp in self.parts.values(): opaque |= pp['rgba'][..., 3] >= 250
        opaque |= getattr(self, 'hem', np.zeros_like(opaque))
        hidden_f = opaque.astype(np.float32)
        # cross-section profile of the drawn leg near the knee (perpendicular to the thigh)
        def frame(org, to):
            u = unit(to - org); n = np.array([u[1], -u[0]]); return u, n
        u1, n1 = frame(hip, knee)
        def sample(org, u, n, tt, ss, img, order=1):
            px = org[0] + u[0] * tt + n[0] * ss; py = org[1] + u[1] * tt + n[1] * ss
            return ndimage.map_coordinates(img, [py, px], order=order, mode='constant', cval=0)
        # width and colours across the leg on the visible rows of the thigh
        widths, profs = [], []
        sgrid = np.arange(-60, 60.5, .5)
        L1 = float(np.linalg.norm(knee - hip))
        for tk in np.arange(L1 - 70, L1 + 40, 2):
            a_ = sample(hip, u1, n1, np.full_like(sgrid, tk), sgrid, legf)
            h_ = sample(hip, u1, n1, np.full_like(sgrid, tk), sgrid, hidden_f)
            if h_.max() > .1 or a_.max() < .5: continue
            on = sgrid[a_ > .5]; widths.append((on.min(), on.max()))
        widths = np.array(widths)
        s_lo, s_hi = float(np.median(widths[:, 0])), float(np.median(widths[:, 1]))
        hw_draw = (s_hi - s_lo) / 2; s_mid = (s_lo + s_hi) / 2
        hw0 = math.ceil(max(abs(widths[:, 0]).max(), abs(widths[:, 1]).max()) + 2)
        sn = np.linspace(-1, 1, 81)
        tks = [tk for tk in np.arange(L1 - 60, L1 + 30, 3)]
        pr = []
        for ci in range(3):
            vals = []
            for tk in tks:
                ss = s_mid + sn * hw_draw
                a_ = sample(hip, u1, n1, np.full_like(ss, tk), ss, legf)
                if a_.min() < .5: continue
                vals.append(sample(hip, u1, n1, np.full_like(ss, tk), ss, self.view[..., ci]))
            pr.append(np.median(vals, axis=0))
        prof = np.stack(pr, -1)
        def tube_rgb(ss):                                              # colour of the rebuilt tube at offset ss
            x = np.clip((ss - s_mid) / hw_draw, -1, 1)
            idx = (x + 1) / 2 * (len(sn) - 1)
            return np.stack([np.interp(idx, np.arange(len(sn)), prof[:, c]) for c in range(3)], -1)
        r_k = hw_draw                                                  # knee disc radius: the drawn half width
        ink_w = 3.2

        lys, lxs = np.nonzero(leg)
        legcol = (skin_like(self.view) | is_ink(self.view)).astype(np.float32)   # leg colours (seen through a part's soft edge)
        def piece(name, org, to, top_ext, length, is_shin):
            u, n = frame(org, to)
            rows = int(math.ceil(top_ext + length + (0 if is_shin else r_k))) + 1
            # wide enough for the drawn leg in this piece's own frame (the drawn leg need not be straight along the bone)
            lt = (lxs - org[0]) * u[0] + (lys - org[1]) * u[1]; ls = (lxs - org[0]) * n[0] + (lys - org[1]) * n[1]
            sel = (lt >= -top_ext) & (lt <= rows - top_ext)
            hw = int(math.ceil(max(hw0, np.abs(ls[sel]).max() + 3 if sel.any() else 0)))
            cols = 2 * hw
            rr, cc = np.mgrid[0:rows, 0:cols].astype(np.float32)
            tt = rr + .5 - top_ext; ss = cc + .5 - hw
            real = np.stack([sample(org, u, n, tt, ss, self.view[..., c]) for c in range(3)], -1)
            a_real = sample(org, u, n, tt, ss, legf)
            hid = (sample(org, u, n, tt, ss, hidden_f, 0) > .5) & ~((sample(org, u, n, tt, ss, legcol, 0) > .5) & (sample(org, u, n, tt, ss, legf, 0) > .5))
            # synthetic tube: centred on the drawn leg, ink on both sides
            sd_tube = np.abs(ss - s_mid) - hw_draw
            syn = tube_rgb(ss)
            syn = np.where((sd_tube > -ink_w)[..., None], INK * .92 + syn * .08, syn)
            a_syn = np.clip(.5 - sd_tube, 0, 1)
            if not is_shin:
                body = tt <= length
                kd = np.hypot(ss - s_mid, tt - length)
                a_end = np.clip(.5 - (kd - r_k), 0, 1) * (~body)
                a_syn = np.where(body, a_syn, a_end)
                syn = np.where((~body & (kd > r_k - ink_w))[..., None], INK * .92 + syn * .08, syn)
                rgb = np.where(hid[..., None], syn, real)
                a = np.where(hid, a_syn, np.where(body, a_real, np.minimum(a_real, a_end)))
                arc = ~body & (kd > r_k - ink_w) & (kd <= r_k)               # ink arc round the knee end (under the shin's cap)
                rgb = np.where(arc[..., None], INK * .92 + rgb * .08, rgb)
                a = np.where(arc, np.maximum(a, a_end), a)
            else:
                cap = tt < 0
                kd = np.hypot(ss - s_mid, tt)
                a_cap = np.clip(.5 - (kd - (r_k - 3.6)), 0, 1)
                capfill = np.where((~is_ink(real) & skin_like(real) & (a_real > .9))[..., None], real, syn * 0 + tube_rgb(ss))
                rgb = np.where(cap[..., None], capfill, np.where(hid[..., None], syn, real))
                # where the cap meets something that is not leg skin (the skirt's hem line) it is left open: the thigh shows there
                capok = (skin_like(real) & ~is_ink(real) & (a_real > .9)) | hid
                a_cap = a_cap * ndimage.binary_erosion(capok, iterations=1)
                a = np.where(cap, a_cap, np.where(hid, a_syn, a_real))
                a = np.where(~cap & (tt > length - 10), a * 0 + np.where(hid, a_syn, a_real), a)
            img = np.dstack([rgb, np.clip(a, 0, 1) * 255])
            Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGBA').save(self.OUT / f'{self.V}_{name}.png')
            return [int(rows), cols], img, hw
        top1 = 34
        L2 = float(np.linalg.norm(ank - knee)) + 10
        (r1, im1, hw1) = piece(f'thigh{sd}', hip, knee, top1, L1, False)
        top2 = int(math.ceil(r_k))
        (r2, im2, hw2) = piece(f'shin{sd}', knee, ank, top2, L2, True)
        self.pieces[f'thigh{sd}'] = self.unquad(im1, hip, knee, top1, hw1)
        self.pieces[f'shin{sd}'] = self.unquad(im2, knee, ank, top2, hw2)
        return dict(thigh=dict(rows=r1[0], cols=r1[1], top_ext=top1, length=L1), shin=dict(rows=r2[0], cols=r2[1], top_ext=top2, length=L2), hw=float(hw1),
                    _axis_offset=s_mid, _knee_r=r_k)

    def unquad(self, img, org, to, top_ext, hw):
        """Render a quad piece back into view pixels (for the check), exactly as the builder maps it."""
        u = unit(np.asarray(to) - np.asarray(org)); n = np.array([u[1], -u[0]])
        dx = self.xx - org[0]; dy = self.yy - org[1]
        tt = dx * u[0] + dy * u[1]; ss = dx * n[0] + dy * n[1]
        r = tt + top_ext - .5; c = ss + hw - .5
        out = np.stack([ndimage.map_coordinates(img[..., k], [r, c], order=1, mode='constant', cval=0) for k in range(4)], -1)
        return out

    # ------------------------------------------------------------ cloth
    def part_piece(self, n, extra=None):
        """The pack's part on its box plus residual pixels (extra, clipped to the box)."""
        p = self.parts[n]; rgba = p['rgba'].copy()
        # the pack's torso parts are repainted in places (side, tqb: waistband, bow, buttons differ from the picture): where the
        # part shows in the picture (not under a sleeve or the head) take the picture's own pixels; keep the pack's paint where hidden
        front = np.zeros((self.H, self.W), bool)
        for o in ('head', 'sleeveA', 'sleeveB'):
            if o in self.parts and o != n: front |= self.parts[o]['cov']
        vis = (rgba[..., 3] > 0) & self.fg & ~front
        rgba[..., :3] = np.where(vis[..., None], self.view, rgba[..., :3])
        if extra is not None:
            x, y, w, h = p['box']; inb = np.zeros_like(extra); inb[y:y + h, x:x + w] = True
            lost = int((extra & ~inb).sum())
            e = extra & inb
            rgba[..., :3] = np.where(e[..., None], self.view, rgba[..., :3])
            rgba[..., 3] = np.where(e, 255, rgba[..., 3])
            rim = ndimage.binary_dilation(e, iterations=1) & ~e & (rgba[..., 3] < 1) & inb
            rgba[..., :3] = np.where(rim[..., None], self.view, rgba[..., :3]); rgba[..., 3] = np.where(rim, np.maximum(rgba[..., 3], 0), rgba[..., 3])
            if lost: print(f'  {n}: {lost} residual px fall outside the part box and are dropped')
        return rgba

    def cloth_retone_all(self, rgba):
        """Every non-ink pixel of a cloth piece (sleeve, sock, apron, bow) is linen, fold strokes included."""
        a = rgba[..., 3] > 100
        # all of it but the ink and any red (strap): the orange fold strokes too, or they read as skin
        return retone(rgba, a & ~is_red(rgba[..., :3]))

    def torso_retone(self, rgba, neck_y):
        """Bodice: light pixels below the neckline are cloth (collar, waistband, bow, their shaded folds); skin only at the neck,
        above neck_y. (Colour alone cannot tell the shaded waistband, g/r ~.75, from skin.)"""
        a = rgba[..., 3] > 100
        rgb = rgba[..., :3]
        h, s_, v = rgb_to_hsv(rgb)
        light = a & ~is_red(rgb) & ~is_ink(rgb) & (h > 15) & (h < 55) & (v > .5)
        yy = np.arange(rgba.shape[0])[:, None] + np.zeros((1, rgba.shape[1]))
        sk = light & skin_like(rgb) & (yy < neck_y)
        cl = light & ~sk
        return retone(rgba, cl), cl, sk

    def split_apron(self, sk):
        """As cut_cloth.py: the apron (biggest cream area of the skirt, with its outline) and the red skirt filled in under it."""
        a = sk[..., 3] > 128
        h_, s_, v_ = rgb_to_hsv(sk[..., :3])
        cream = a & cloth_like(sk[..., :3])
        lab, k = ndimage.label(cream)
        big = 1 + int(np.argmax(ndimage.sum(cream, lab, range(1, k + 1))))
        core = ndimage.binary_closing(ndimage.binary_fill_holes(lab == big), iterations=2)
        dark = a & (v_ < .62)
        ring = ndimage.binary_dilation(core, iterations=3) & ~core
        am = ndimage.binary_fill_holes(core | (ring & dark))
        am = am | (ndimage.binary_dilation(am, iterations=3) & a & ~is_red(sk[..., :3]))   # the whole outline, so the red fill never covers it
        apron = sk.copy(); apron[..., 3] = np.where(am, 255, 0)
        apron = self.cloth_retone_all(apron)
        red = sk.copy()
        under = ndimage.binary_dilation(am, iterations=2) & a
        red = self.fill_red(red, under, a)
        return apron, red, am

    def fill_red(self, rgba, under, a):
        """Fill `under` with the plain red of the same row (smoothed down the rows), as cut_cloth.py does under the apron."""
        sk = rgba
        isred = a & ~under & is_red(sk[..., :3])
        plain = isred & (sk[..., 0] > 165) & (sk[..., 1] > 40)
        H_ = sk.shape[0]
        rowc = np.zeros((H_, 3), np.float32); have = np.zeros(H_, bool)
        for y in range(H_):
            px = sk[y][plain[y]][:, :3]
            if len(px) > 12: rowc[y] = np.median(px, axis=0); have[y] = True
        ys_ = np.arange(H_); rowc = np.stack([np.interp(ys_, ys_[have], rowc[have, c]) for c in range(3)], 1)
        rowc = ndimage.gaussian_filter1d(rowc, 14, axis=0)
        fill = np.repeat(rowc[:, None, :], sk.shape[1], axis=1)
        fill = fill * (1 + .035 * np.sin(np.arange(sk.shape[1])[None, :, None] / 37.))
        out = sk.copy()
        out[..., :3] = np.where(under[..., None], fill, out[..., :3]); out[..., 3] = np.where(under, 255, out[..., 3])
        return out

    def base_layer(self, src, shrink, name, box):
        m = ndimage.binary_erosion(ndimage.binary_closing(src[..., 3] > 128, iterations=10), iterations=shrink)
        out = np.zeros_like(src); out[..., :3] = np.array([214, 200, 176], np.float32)
        out[..., 3] = ndimage.gaussian_filter(m.astype(np.float32), 1.2) * 255
        self.save_box(name, out, box); self.pieces[name] = out
        return out

    def claim_hem(self):
        """The skirt's hem line where the pack's skirt part left it in the picture: it belongs to the skirt, not to the legs."""
        dark = self.view.sum(axis=-1) < 450
        m = self.res & ndimage.binary_dilation(self.parts['skirt']['cov'], iterations=4) & dark & (self.yy > 1000)
        self.hem = self.claim('skirt', m)
        return self.hem

    def bow_tail(self, name, poly, pivot):
        """A waist-bow tail inside a hand-drawn polygon: everything there that is not the red dress (cream, folds, outline)."""
        im = Image.new('L', (self.W, self.H), 0); ImageDraw.Draw(im).polygon([tuple(p) for p in poly], fill=1)
        inpoly = np.asarray(im) > 0
        taken = getattr(self, '_tails', np.zeros((self.H, self.W), bool))   # a tail cut earlier lies over this one
        m = inpoly & self.fg & ~is_red(self.view) & ~taken
        m = ndimage.binary_closing(m, iterations=1) & inpoly & self.fg & ~taken
        lab, k = ndimage.label(m); sz = ndimage.sum(m, lab, range(1, k + 1))
        m = np.isin(lab, 1 + np.nonzero(sz >= 15)[0])                     # the tail and its tip (an ink line may cut the tip off)
        m = ndimage.binary_fill_holes(m) & ~taken
        self._tails = taken | m
        rgba = np.dstack([self.view, self.soft(m)])
        rgba = self.cloth_retone_all(rgba)
        box, _ = self.save_tight(name, self.view, m)
        # save again with the re-toned colours
        x, y, w, h = box
        Image.fromarray(np.clip(rgba[y:y + h, x:x + w], 0, 255).astype(np.uint8), 'RGBA').save(self.OUT / f'{self.V}_{name}.png')
        self.pieces[name] = rgba; self.boxes[name] = box
        self.claim(name, m)
        return m

    def fill_behind(self, rgba, hole, sil, edge_line=None):
        """Fill `hole` (inside the silhouette `sil`) row by row with the nearest visible pixel to the right that is neither hole nor
        within 3 px of it, then soften down the rows. An ink outline is laid along `edge_line` (left edge x per row)."""
        out = rgba.copy()
        ok = sil & ~ndimage.binary_dilation(hole, iterations=3) & (rgba[..., 3] > 200) & is_red(rgba[..., :3])   # the plain dress only
        ys = np.nonzero(hole.any(axis=1))[0]
        filled = np.zeros_like(hole)
        for y in ys:
            xs = np.nonzero(hole[y] & sil[y])[0]
            if not len(xs): continue
            src = np.nonzero(ok[y])[0]
            if not len(src): continue
            for x in xs:
                right = src[src > x]
                xs_ = right[0] if len(right) else src[np.argmin(np.abs(src - x))]
                out[y, x, :3] = rgba[y, xs_, :3]; out[y, x, 3] = 255; filled[y, x] = True
        sm = ndimage.uniform_filter(out[..., :3], size=(5, 1, 1))
        out[..., :3] = np.where(filled[..., None], sm, out[..., :3])
        if edge_line is not None:
            for y, x0 in edge_line.items():
                xs = np.arange(int(round(x0)), int(round(x0)) + 3)
                for x in xs:
                    if filled[y, x] or (hole[y, x] and sil[y, x]): out[y, x, :3] = INK; out[y, x, 3] = 255
        return out, filled

    # ------------------------------------------------------------ seams
    def seal(self, order, editable):
        """Where pieces meet inside the figure, both often carry the drawing's soft edge (alpha < 1), so the background shows
        through as a light seam. Make the topmost cut piece that has any alpha there opaque; where only a pack piece (head,
        boot) is soft, extend the lowest cut piece within 3 px under it with the picture's pixels. Re-saves the edited pieces."""
        interior = ndimage.binary_erosion(self.fg, iterations=1)
        cov = np.zeros((self.H, self.W), np.float32)
        for _, rgba in order: a = rgba[..., 3] / 255.; cov = cov + a * (1 - cov)
        gap = interior & (cov < .97)
        done = np.zeros_like(gap); edited = {}
        for name, rgba in reversed(order):
            if name not in editable: continue
            m = gap & ~done & (rgba[..., 3] > 5)
            if m.any(): rgba[..., 3][m] = 255; done |= m; edited[name] = int(m.sum())
        rest = gap & ~done
        for name, rgba in order:
            if name not in editable or not rest.any(): continue
            x, y, w, h = self.boxof[name]; inb = np.zeros_like(rest); inb[y:y + h, x:x + w] = True
            near = ndimage.binary_dilation(rgba[..., 3] > 128, iterations=3) & rest & inb
            if near.any():
                rgba[..., :3][near] = self.view[near]; rgba[..., 3][near] = 255; rest &= ~near
                edited[name] = edited.get(name, 0) + int(near.sum())
        for name in edited: self.save_box(name, self.pieces[name], self.boxof[name])
        return dict(gap_px=int(gap.sum()), left_open=int(rest.sum()), edited=edited)

    # ------------------------------------------------------------ checks
    def composite(self, order):
        """order: back to front list of (name, full-canvas RGBA)."""
        img = np.zeros((self.H, self.W, 3), np.float32) + BG
        for name, rgba in order:
            a = np.clip(rgba[..., 3:4] / 255., 0, 1)
            img = img * (1 - a) + rgba[..., :3] * a
        return img

    def report(self, order, cloth_mask, editable):
        self.sealed = self.seal(order, editable)
        asm = self.composite(order)
        Image.fromarray(np.clip(asm, 0, 255).astype(np.uint8)).save(self.CHK / f'{self.V}_assembled.png')
        diff = np.abs(asm - self.view).max(axis=2)
        Image.fromarray(np.clip(np.dstack([diff * 3] * 3), 0, 255).astype(np.uint8)).save(self.CHK / f'{self.V}_diff.png')
        big = diff > 24
        fgm = self.fg | ndimage.binary_dilation(self.fg, iterations=2)
        hands = np.zeros_like(big)
        out = ~cloth_mask
        r = dict(all_px=int(big.sum()), outside_cloth=int((big & out).sum()), fg_px=int(self.fg.sum()),
                 pct_outside_cloth_of_fg=100 * float((big & out & fgm).sum()) / float(self.fg.sum()),
                 pct_outside_cloth_of_image=100 * float((big & out).sum()) / big.size)
        # unclaimed residual pixels: in the picture, in no piece
        un = self.res & (self.label == 0)
        r['unclaimed_residual_px'] = int(un.sum())
        # label debug map
        lab = np.zeros((self.H, self.W, 3), np.uint8) + 255
        lab[self.cov] = (200, 200, 200)
        rng = np.random.RandomState(3)
        for nm, i in self.LBL.items(): lab[self.label == i] = rng.randint(40, 220, 3)
        lab[un] = (255, 0, 255)
        Image.fromarray(lab).save(self.CHK / f'{self.V}_labels.png')
        return r, asm, diff


def contact_sheet(cut, names, out, scale=2):
    """Cloth pieces and skin pieces at 2x over a mid grey, with the pixels that fail the colour test marked magenta."""
    tiles = []
    for nm, kind in names:
        p = cut.OUT / f'{cut.V}_{nm}.png'
        if not p.exists(): continue
        im = np.asarray(Image.open(p).convert('RGBA')).astype(np.float32)
        a = im[..., 3] > 128
        if kind == 'skin': bad = a & cloth_like(im[..., :3]) & (im[..., 3] > 200)
        elif kind == 'cloth':
            # skin colour in cloth: the untoned cream is close to skin, the re-toned linen is not
            bad = a & skin_like(im[..., :3]) & ~is_ink(im[..., :3])
        else: bad = np.zeros_like(a)
        bg = np.zeros_like(im[..., :3]) + 150
        al = im[..., 3:4] / 255
        rgb = bg * (1 - al) + im[..., :3] * al
        rgb[bad] = (255, 0, 255)
        t = Image.fromarray(rgb.astype(np.uint8)).resize((im.shape[1] * scale, im.shape[0] * scale), Image.NEAREST)
        tiles.append((nm, kind, t, int(bad.sum())))
    W_ = sum(t.width for _, _, t, _ in tiles) + 12 * len(tiles); H_ = max(t.height for _, _, t, _ in tiles) + 30
    sheet = Image.new('RGB', (W_, H_), (235, 235, 235)); d = ImageDraw.Draw(sheet); x = 0
    for nm, kind, t, nb in tiles:
        sheet.paste(t, (x, 26)); d.text((x + 2, 4), f'{nm} [{kind}] bad={nb}', fill=(0, 0, 0)); x += t.width + 12
    sheet.save(out)
    return {nm: nb for nm, _, _, nb in tiles}


def joints_table(T, out):
    L = []
    def dist(a, b): return float(np.hypot(a[0] - b[0], a[1] - b[1]))
    L.append(f"{'joint':<10}{'x':>9}{'y':>9}")
    for k in ['neck', 'pelvis', 'hipA', 'kneeA', 'ankleA', 'hipB', 'kneeB', 'ankleB']: L.append(f'{k:<10}{T[k][0]:>9.1f}{T[k][1]:>9.1f}')
    for sd in 'AB':
        a = T[sd]
        for k in ['sh', 'elbow', 'wrist']: L.append(f'{sd}.{k:<8}{a[k][0]:>9.1f}{a[k][1]:>9.1f}')
    L.append('')
    L.append('checks:')
    for sd in 'AB':
        a = T[sd]
        L.append(f'  arm {sd}: upper {dist(a["sh"], a["elbow"]):.1f} px (0.15 m = 149.4), sh->wrist {dist(a["sh"], a["wrist"]):.1f}, '
                 f'forearm bone {dist(a["elbow"], a["wrist"]):.1f}, |dir| {np.hypot(*a["dir"]):.3f}')
        hip, kn, an = T['hip' + sd], T['knee' + sd], T['ankle' + sd]
        th, sh_ = dist(hip, kn), dist(kn, an); reach = dist(hip, an)
        between = hip[1] < kn[1] < an[1]
        # signed distance of the knee from the hip-ankle line (+: towards +x)
        v = np.subtract(an, hip); w = np.subtract(kn, hip); side = (v[0] * w[1] - v[1] * w[0]) / np.hypot(*v)
        bend = math.degrees(math.acos(np.clip(np.dot(np.subtract(kn, hip), np.subtract(an, kn)) / (th * sh_), -1, 1)))
        L.append(f'  leg {sd}: thigh {th:.1f} shin {sh_:.1f} (0.20 m = 199.2), hip->ankle {reach:.1f} = {reach / (th + sh_):.3f} of full reach, '
                 f'knee between hip and ankle (y): {between}, knee off the hip-ankle line {side:+.1f} px, bend {bend:.1f} deg')
    L.append(f"  hips apart {dist(T['hipA'], T['hipB']):.1f} px, pelvis->hip mid {dist(T['pelvis'], np.mean([T['hipA'], T['hipB']], 0)):.1f} px")
    L.append(f"  neck above pelvis by {T['pelvis'][1] - T['neck'][1]:.1f} px (0.386 m torso + neck = ~430)")
    Path(out).write_text('\n'.join(L) + '\n')
    return '\n'.join(L)


# ====================================================================================================== the side view
def main():
    V = 'side'
    c = ViewCut(V, '03_side.png')
    M = c.META
    print('side: parts', list(c.parts))

    # ---- the far sleeve (arm B): not in the pack; it is in the picture, partly behind the bodice
    zoneB = np.zeros((c.H, c.W), bool); zoneB[478:615, 560:648] = True
    notT = np.zeros((c.H, c.W), bool)
    for o in c.parts:
        if o != 'torso': notT |= c.parts[o]['cov']
    far_slv = c.sleeve_extras('B', extra_zone=zoneB, avail=c.fg & ~notT & (c.xx >= 572))   # also the part of it under the bodice part's straight cut
    lab, k = ndimage.label(far_slv); far_slv = lab == (1 + int(np.argmax(ndimage.sum(far_slv, lab, range(1, k + 1)))))
    far_slv = ndimage.binary_fill_holes(far_slv)
    c.claim('sleeveB', far_slv)
    near_extra = c.sleeve_extras('A')
    c.claim('sleeveA', near_extra)

    # ---- arms: A is the meta's (near arm, hangs back); B is fitted to the picture (far arm, reaches forward, shoulder hidden)
    shB, uB = c.fit_arm_line([540, 528], [66, 76], y_sh=M['A']['sh'][1])
    info = {}
    info['A'] = c.cut_arm('A', M['A']['sh'], M['A']['dir'], c.parts['sleeveA']['cov'] | near_extra)
    info['B'] = c.cut_arm('B', shB, uB, far_slv)

    # ---- what is left at the sleeves' rims (anti-aliased outline) goes to the sleeves
    for nm, base in (('A', c.parts['sleeveA']['cov'] | near_extra), ('B', far_slv)):
        rim = c.claim("sleeve" + nm, c.res & ndimage.binary_dilation(base, iterations=12) & ~skin_like(c.view))
        if nm == 'A': near_extra = near_extra | rim
        else: far_slv = far_slv | rim
    # ---- sleeves (re-toned) and caps
    slA = c.cloth_retone_all(c.part_piece('sleeveA', near_extra)); c.save_box('sleeveA_c', slA, c.parts['sleeveA']['box']); c.pieces['sleeveA_c'] = slA
    slB = np.dstack([c.view, c.soft(far_slv)]); slB = c.cloth_retone_all(slB)
    ys, xs = np.nonzero(far_slv); boxB = [int(xs.min()) - 1, int(ys.min()) - 1, int(xs.max() - xs.min()) + 3, int(ys.max() - ys.min()) + 3]
    c.save_box('sleeveB_x', slB, boxB); c.pieces['sleeveB_x'] = slB; c.boxes['sleeveB'] = boxB
    def cap(sd, src, box, name):
        a = info[sd]; sh = np.array(a['sh']); u = np.array(a['dir'])
        t = (c.xx - sh[0]) * u[0] + (c.yy - sh[1]) * u[1]
        im = src.copy(); im[..., 3] *= np.clip((30 - t) / 22, 0, 1)
        c.save_box(name, im, box); c.pieces[name] = im
    cap('A', slA, c.parts['sleeveA']['box'], 'capA')
    cap('B', slB, boxB, 'capB_x')

    # ---- waist-bow tail (one tail, notched end); the loop stays on the bodice
    TAIL = [(484, 695), (484, 705), (470, 725), (452, 745), (450, 770), (400, 770), (400, 737), (436, 712), (470, 698)]
    tail = c.bow_tail('bow1', TAIL, (480, 690))

    # ---- legs (A: back leg, her right; B: front leg, her left); the skirt's hem line first
    c.claim_hem()
    legA, hipA, kneeA, ankA = c.cut_leg('A', M['A']['ankle'], 1050, 1200, 370)
    legB, hipB, kneeB, ankB = c.cut_leg('B', M['B']['ankle'], 1050, 1205, 600)
    info.update(pelvis=[505, 912], hipA=hipA, hipB=hipB, kneeA=kneeA, kneeB=kneeB, ankleA=ankA, ankleB=ankB, neck=M['neck'])
    info['legA'] = dict(x0=int(np.nonzero(legA.any(0))[0].min()), x1=int(np.nonzero(legA.any(0))[0].max()) + 1)
    info['legB'] = dict(x0=int(np.nonzero(legB.any(0))[0].min()), x1=int(np.nonzero(legB.any(0))[0].max()) + 1)
    info['legpiece'] = {'A': c.leg_pieces('A', legA, hipA, kneeA, ankA), 'B': c.leg_pieces('B', legB, hipB, kneeB, ankB)}

    # ---- torso: the part plus what the pack left of the bodice (bow loop, strap at the neck); the tail cut away and filled in
    NECK_SKIN_Y = 540                                            # below this the light bodice pixels are all cloth
    tb = c.parts['torso']['box']; inT = np.zeros((c.H, c.W), bool); inT[tb[1]:tb[1] + tb[3], tb[0]:tb[0] + tb[2]] = True
    tor_extra = c.claim('torso', c.res & inT & (c.yy < 740) & ~is_red(c.view) | (c.res & inT & is_red(c.view) & (c.yy < 740)))
    tor = c.part_piece('torso', tor_extra)
    sk_part = c.parts['skirt']['rgba'].copy()
    sb = c.parts['skirt']['box']; inS = np.zeros((c.H, c.W), bool); inS[sb[1]:sb[1] + sb[3], sb[0]:sb[0] + sb[2]] = True
    sk_extra = c.claim('skirt', c.res & inS & ~tail & (c.yy < 1090) & (is_red(c.view) | is_ink(c.view)) & (c.yy < 1000))
    sk_part = c.part_piece('skirt', c.extra['skirt'])
    # silhouette behind the tail: the bodice's back edge at the waist runs to the skirt's back edge below the tail
    sil0 = ((tor[..., 3] > 128) | (sk_part[..., 3] > 128)) & ~tail
    edge = {}
    E0, E1 = (482.0, 694), (431.0, 762)
    for y in range(E0[1], E1[1] + 1): edge[y] = E0[0] + (E1[0] - E0[0]) * (y - E0[1]) / (E1[1] - E0[1])
    sil = sil0.copy()
    for y, x0 in edge.items(): sil[y, int(round(x0)):560] = True
    ring = ndimage.binary_dilation(tail, iterations=3) & ~is_red(c.view)      # the tail's soft outline and any pixel of it the mask missed
    shadow = ndimage.binary_dilation(tail, iterations=3) & (c.view.sum(axis=-1) < 230)   # and its drop shadow on the dress
    ring &= c.yy > 712                                                       # not into the bow's loops above
    gone = (tail | ring | shadow) & (c.yy > 694)
    hole = gone & sil
    tor_f, f1 = c.fill_behind(tor, hole & inT, sil, {y: x for y, x in edge.items() if y < tb[1] + tb[3]})
    tor_f[..., 3] = np.where(gone & ~f1 & inT, 0, tor_f[..., 3])
    sk_f, f2 = c.fill_behind(sk_part, hole & (c.yy >= 732) & inS, sil, {y: x for y, x in edge.items() if y >= 732})
    sk_f[..., 3] = np.where(gone & ~f2, 0, sk_f[..., 3])
    tor_c, tcl, tsk = c.torso_retone(tor_f, NECK_SKIN_Y)
    c.save_box('torso_c', tor_c, tb); c.pieces['torso_c'] = tor_c
    apron, red, am = c.split_apron(sk_f)
    c.save_box('apron', apron, sb); c.save_box('skirtred', red, sb); c.pieces['apron'] = apron; c.pieces['skirtred'] = red
    c.base_layer(sk_f, 22, 'slip', sb); c.base_layer(tor_f, 14, 'chemise', tb)
    for sd in 'AB':
        so = c.cloth_retone_all(c.parts['sock' + sd]['rgba']); c.save_box(f'sock{sd}_c', so, c.parts['sock' + sd]['box']); c.pieces[f'sock{sd}_c'] = so
    strap = np.zeros((8, 30, 4), np.float32); strap[..., :3] = (0xe6, 0x9d, 0x43); strap[..., 3] = 255
    strap[:, :3, :3] = INK; strap[:, -3:, :3] = INK
    Image.fromarray(strap.astype(np.uint8), 'RGBA').save(c.OUT / f'{V}_strap.png')

    # ---- rig points
    def rows_of(m, y):
        xs = np.nonzero(m[y])[0]; return float(xs.min()), float(xs.max())
    skm = sk_f[..., 3] > 128
    (wl, wr), (hl, hr) = rows_of(skm, 770), rows_of(skm, M['hem'] - 6)
    ys_, xs_ = np.nonzero(am)
    ap_top, ap_bot = int(ys_.min()), int(ys_.max())
    ap_mid = (ap_top + ap_bot) // 2
    apx = lambda y: float(np.nonzero(am[y])[0].mean())
    info['yaw_deg'] = 90; info['facing'] = 'right'; info['A_is'] = 'R'; info['far_arm'] = 'B'
    info['rig'] = {
        'head_top': [float(M['neck'][0]), 180.0],
        'hair': [[470, 200], [345, 420]],                         # the hair mass behind the face, from the crown to the curls at the back
        'skirt_L': [[wl + .2 * (wr - wl), 770], [hl + .1 * (hr - hl), M['hem'] - 2]],
        'skirt': [[(wl + wr) / 2, 770], [(hl + hr) / 2, M['hem']]],
        'skirt_R': [[wl + .8 * (wr - wl), 770], [hl + .9 * (hr - hl), M['hem'] - 2]],
        'apron': [[apx(ap_top + 4), float(ap_top)], [apx(ap_mid), float(ap_mid)], [apx(ap_bot - 6), float(ap_bot)]],
        'bag': {'a': [524, 480], 'b': [498, 800]}, 'bag_visible': True,
        'bag_mirror': {'a': [506, 480], 'b': [548, 706], 'b2': [470, 700], 'hidden': True},
        'bow1': [[480.0, 690.0], [425.0, 752.0]],
    }
    info['boxes'] = dict(c.boxes)
    for n in ['torso', 'skirt', 'sleeveA', 'sockA', 'sockB', 'bootA', 'bootB', 'head']: info['boxes'].setdefault(n, c.parts[n]['box'])
    info['parts'] = sorted(n for n in PARTS if n.startswith('side_'))
    info['hand'] = {sd: {'wrist': info[sd]['wrist'], 'dir': info[sd]['dir']} for sd in 'AB'}
    info['far_arm_detail'] = {'side': 'B', 'behind_torso': True,
                              'sleeve': 'side_sleeveB_x.png / side_capB_x.png, box boxes.sleeveB: the visible far-sleeve pixels only (the pack has no '
                                        'side_sleeveB part); named _x so the current build_liv.py (box_of from parts.json) does not trip over it'}
    info['draw_order_hint'] = ['upperB', 'foreB', 'handB', 'thighB', 'shinB', 'sockB_c', 'bootB', 'thighA', 'shinA', 'sockA_c', 'bootA',
                               'chemise', 'slip', 'skirtred', 'apron', 'torso_c', 'bow1', 'sleeveB_x', 'capB_x', 'head',
                               'upperA', 'capA', 'sleeveA_c', 'foreA', 'handA']
    info['notes'] = {
        'legs': 'The drawn stride puts the two legs on lines that meet the skirt about 150 px apart; with thigh = shin = 199 px the bind '
                'hips are where those lines are 398 px from the ankles. For gait in profile the lead may move both hip pivots towards the '
                'pelvis (the thigh tops are under the skirt); the bind pose then no longer matches the picture exactly.',
        'arm_B': 'shoulder fitted: the visible forearm/upper-arm centre line, crossing the near shoulder height y=529',
        'wrist': 'wrist = where the drawn hand starts (the arm narrows, then widens); A._tw/B._tw are the distances from the shoulder',
    }
    info['_ppm'] = 996
    (c.OUT / f'{V}.json').write_text(json.dumps(info, indent=1))

    # ---- checks
    P = c.pieces
    head = c.parts['head']['rgba']; boot = {sd: c.parts['boot' + sd]['rgba'] for sd in 'AB'}
    order = [('upperB', P['upperB']), ('foreB', P['foreB']), ('handB*', P['handB*']),
             ('thighB', P['thighB']), ('shinB', P['shinB']), ('sockB', P['sockB_c']), ('bootB', boot['B']),
             ('thighA', P['thighA']), ('shinA', P['shinA']), ('sockA', P['sockA_c']), ('bootA', boot['A']),
             ('chemise', P['chemise']), ('slip', P['slip']), ('skirtred', P['skirtred']), ('apron', P['apron']), ('torso_c', P['torso_c']),
             ('bow1', P['bow1']), ('sleeveB_x', P['sleeveB_x']), ('capB_x', P['capB_x']), ('head', head),
             ('upperA', P['upperA']), ('capA', P['capA']), ('sleeveA_c', P['sleeveA_c']), ('foreA', P['foreA']), ('handA*', P['handA*'])]
    cloth = np.zeros((c.H, c.W), bool)
    for nm in ['sleeveA_c', 'sleeveB_x', 'capA', 'capB_x', 'torso_c', 'apron', 'sockA_c', 'sockB_c', 'bow1']:
        cloth |= P[nm][..., 3] > 30
    cloth = (cloth & ~is_ink(c.view) & ~is_red(c.view)) | tcl                 # re-toned pixels: cloth pieces (not their ink) and the bodice's cloth
    cloth = ndimage.binary_dilation(cloth, iterations=1)
    EDIT = {'torso_c', 'skirtred', 'apron', 'sleeveA_c', 'sleeveB_x', 'sockA_c', 'sockB_c', 'bow1', 'bow2', 'upperA', 'upperB', 'foreA', 'foreB'}
    r, asm, diff = c.report(order, cloth, EDIT)
    r['seal'] = c.sealed
    print('side check:', json.dumps(r))
    finish_checks(c, info, r)


def finish_checks(c, info, r):
    V = c.V
    sheet = contact_sheet(c, [(f'sleeveA_c', 'cloth'), ('sleeveB_c', 'cloth'), ('sleeveB_x', 'cloth'), ('torso_c', 'mixed'), ('apron', 'cloth'),
                              ('bow1', 'cloth'), ('bow2', 'cloth'), ('sockA_c', 'cloth'), ('sockB_c', 'cloth'),
                              ('upperA', 'skin'), ('foreA', 'skin'), ('upperB', 'skin'), ('foreB', 'skin'),
                              ('thighA', 'skin'), ('shinA', 'skin'), ('thighB', 'skin'), ('shinB', 'skin')], c.CHK / f'{V}_cloth_skin.png')
    print(f'{V} contact sheet (bad px per piece):', sheet)
    tab = joints_table(info, c.CHK / f'{V}_joints.txt')
    print(tab)
    (c.CHK / f'{V}_report.json').write_text(json.dumps(dict(diff=r, colour_test=sheet), indent=1))


if __name__ == '__main__':
    main()
