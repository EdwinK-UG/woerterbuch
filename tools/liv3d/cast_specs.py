"""The Deutschklinik cast (reference pack A01-A06, C02-C04): one entry per character for cast_fit.py.

Every colour is the dominant colour of the character's reference sheet (front view), measured, not taken from the brief.
Rules are written in the export's own metres (rest pose, +Z is the character's front, +X its left), relative to the
joints in L (cast_fit.landmarks): L.y('knee'), L['shoulder'][0] and so on. k is the head joint's scale.
"""
import numpy as np
import cast_fit as F
import vrm_fit as V
from cast_fit import Tex, sstep

C = lambda *v: np.asarray(v, np.float32)


# ------------------------------------------------------------------ shared rules

def torso(t, L, pad=0.03):
    """Texels of the trunk (not the sleeves)."""
    return t.ax < L.x('shoulder') + pad


def arm(t, L, pad=0.03, band=0.13):
    """Texels of a sleeve: outside the trunk, at shoulder height (the arms are level in the rest pose)."""
    return ~torso(t, L, pad) & (np.abs(t.y - L.y('shoulder')) < band)


def sleeve_cut(t, L, at, roll_rgb=None, roll=0.035):
    """Rolled sleeves: the sleeve ends at |x| = at (fraction of the way elbow -> wrist), with a darker rolled band."""
    xe, xw = L.x('elbow'), L.x('wrist'); xc = xe + at * (xw - xe)
    t.hide((t.ax > xc) & arm(t, L))
    if roll_rgb is not None: t.fill((t.ax > xc - roll) & (t.ax <= xc) & arm(t, L), roll_rgb, keep=0.4)
    return xc


def socks(t, L, top, rgb, rib=True, cuff=0.014, slouch=0.0):
    """Socks on the body's legs from the ankle to `top` (height): ribbed, with a cuff band and a slouch (wavy top)."""
    for sx in (-1, 1):
        lx = sx * L.x('knee'); m = t.cov & (np.sign(t.x) == sx) & (t.ax < L.x('knee') + 0.08) & (t.y < L.y('knee') - 0.02)
        ang = np.arctan2(t.x - lx, t.z - L['knee'][2]); topw = top + slouch * np.sin(ang * 3)
        sm = m & (t.y < topw)
        shade = (0.94 + 0.06 * np.cos(ang * 18)) if rib else 1.0
        col = np.asarray(rgb, np.float32)[None] * np.broadcast_to(shade, t.y.shape)[sm][:, None]
        t.a[sm, :3] = col; t.a[sm, 3] = 255
        band = sm & (t.y > topw - cuff); t.a[band, :3] = np.minimum(np.asarray(rgb, np.float32) * 1.03, 255)
        t.a[sm & (t.y > topw - 0.003), :3] = np.asarray(rgb, np.float32) * 0.78


def buttons(t, L, ys, x=0.0, r=0.006, rgb=(250, 246, 236), ring=(150, 130, 110), front=True):
    for y in ys:
        d = np.hypot(t.x - x, t.y - y); m = t.cov & (d < r) & ((t.z > L['chest'][2]) if front else True)
        t.a[m, :3] = ring; t.a[m & (d < r * 0.7), :3] = rgb


def tuck(t, g, L, over=0.015):
    """Hide the shirt inside the trousers: below the trousers' own waistline, measured all round (it dips at the front
    and rises at the back), smoothed so belt loops do not comb the edge."""
    from scipy.ndimage import uniform_filter1d
    B = F.mesh_points(g, 'Bottoms_01_CLOTH'); B = B[B[:, 1] > L.y('hips') - 0.12]
    c = L['hips']; ab = np.arctan2(B[:, 0] - c[0], B[:, 2] - c[2]); n = 24; bins = np.linspace(-np.pi, np.pi, n + 1)
    top = np.array([np.percentile(B[(ab >= a) & (ab < b), 1], 80) if ((ab >= a) & (ab < b)).sum() > 3 else np.nan for a, b in zip(bins[:-1], bins[1:])])
    ok = ~np.isnan(top); top = np.interp(np.arange(n), np.where(ok)[0], top[ok], period=n)
    top = uniform_filter1d(top, 3, mode='wrap'); mid = (bins[:-1] + bins[1:]) / 2
    at = np.interp(np.arctan2(t.x - c[0], t.z - c[2]), mid, top, period=2 * np.pi)
    t.hide(t.cov & torso(t, L, 0.06) & (t.y < at - over) & (t.y < L.y('chest')))


def top_of(g, part):
    return float(F.mesh_points(g, part)[:, 1].max())


def recolour_all(t, rgb, keep=0.5):
    t.fill(t.cov & (t.a[..., 3] > 0), rgb, keep=keep)


# ------------------------------------------------------------------ C03: the blonde girl in the blue dress

def fit_c03(g, L, k):
    BLUE, BLUE_D, WHITE, HAIR = C(118, 147, 188), C(92, 118, 160), C(250, 238, 218), C(247, 206, 110)
    hj = L.y('head'); brow = L['brow']
    final = lambda yf: hj + (yf - hj) / k                              # cut height before the head is scaled
    def y_end(deg):
        d = abs(deg)
        return float(np.interp(d, [0, 26, 34, 60, 100, 180], [brow + 0.012, brow + 0.008, final(L.y('uchest') - 0.03), final(L.y('chest') - 0.0), final(L.y('chest') - 0.01), final(L.y('chest') - 0.015)]))
    F.hair_cut(g, y_end, hair_wave=0.04, hair_volume=0.085, hair_flick=0.02, hair_blunt=0.97)
    F.hair_colour(g, (178, 118, 40), HAIR, (246, 214, 120))
    # the dress: the cut-outs of Liv's cleanup (no frills, plain cuffs, open scoop), the preset's own folds, all blue
    i = g.mat_image('Tops'); orig = F.arr(g.image(i)); cut = F.arr(V.dress_tex(g.image(i))); orig[..., 3] = cut[..., 3]; g.set_image(i, F.img(orig))
    t = Tex(g, 'Tops'); vis = t.cov & (t.a[..., 3] > 0); t.fill(vis, BLUE, keep=0.12)
    wy = float(np.median(t.y[int(1066 * t.H / 2048):int(1152 * t.H / 2048)][t.cov[int(1066 * t.H / 2048):int(1152 * t.H / 2048)]]))
    t.fill(vis & (np.abs(t.y - wy) < 0.010), BLUE_D, keep=0.45)               # waist seam
    xs = t.ax[vis & ~torso(t, L, 0.0)]; xend = np.percentile(xs, 99) if len(xs) else 0.3
    t.fill(vis & ~torso(t, L, 0.0) & (t.ax > xend - 0.018), BLUE_D, keep=0.4)   # sleeve cuff band
    buttons(t, L, np.linspace(L.y('neck') - 0.06, wy + 0.02, 4), r=0.0055)
    t.save()
    # the body: dress blue where the dress mesh is open, a white round collar, buttons; bloomers under the skirt
    b = Tex(g, 'Body_00_SKIN'); neck = L['neck']; ny = L.y('neck')
    r = np.hypot(b.x - neck[0], b.z - neck[2]); chest = b.cov & (b.ax < 0.10) & (b.y > L.y('chest') - 0.06) & ((b.y < ny - 0.012) | ((r > 0.036) & (b.y < ny + 0.012)))
    b.fill(chest, BLUE, keep=0.25)
    for sx in (-1, 1):
        e = ((b.x - sx * 0.030) / 0.038) ** 2 + ((b.y - (ny - 0.028)) / 0.027) ** 2
        col = chest & (e < 1) & (b.z > neck[2]) & (np.sign(b.x) == sx); b.flat(col, WHITE); b.flat(chest & (np.abs(e - 1) < 0.12) & (b.z > neck[2]) & (np.sign(b.x) == sx), C(200, 186, 166))
    collar_back = chest & (b.z <= neck[2]) & (b.y > ny - 0.03); b.flat(collar_back, WHITE)
    buttons(b, L, np.linspace(ny - 0.06, wy + 0.02, 4), r=0.0055)
    hem, top = L.y('knee') + 0.09, L.y('hips') + 0.005
    sh = b.cov & (b.y > hem) & (b.y < L.y('spine') + 0.04) & (b.ax < 0.16); b.a[sh & (b.y < top), 3] = 255; b.fill(sh, C(236, 238, 242), keep=0.2)
    b.save()
    i = g.mat_image('Body_00_SKIN'); old = V.CREAM; V.CREAM = (249, 240, 222)
    try: g.set_image(i, V.socks_tex(g.image(i))); V.sock_cuffs(g)
    finally: V.CREAM = old
    i = g.mat_image('Shoes_01_CLOTH_01'); g.set_image(i, V.boots_tex(g.image(i)))
    i = g.mat_image('Shoes_01_CLOTH_02'); g.set_image(i, V.bow_tex(g.image(i)))
    F.face_paint(g, L, skin=(250, 211, 178), blush=0.38)
    F.brows(g, (176, 128, 62), thick=0.005); F.iris(g, (86, 128, 186)); F.lashes(g, (96, 64, 40))
    # the big blue bow on top of the head, a little to the back
    s = L['face_x'] * 1.45; c = np.array([0.0, L['hair_top'] - 0.02 * s, L['head'][2] - 0.30 * s])
    parts = []
    for sx in (-1, 1):
        rot = _rz(sx * 0.32) @ _ry(sx * 0.25)
        parts.append(F.ellipsoid(c + [sx * 0.66 * s, 0.06 * s, 0], [0.62 * s, 0.30 * s, 0.12 * s], rot=rot))
        parts.append(F.ellipsoid(c + [sx * 0.30 * s, -0.55 * s, -0.08 * s], [0.14 * s, 0.50 * s, 0.07 * s], rot=_rz(sx * 0.45)))
    parts.append(F.ellipsoid(c, [0.20 * s, 0.20 * s, 0.17 * s]))
    F.add_part(g, 'Bow', *F.merge(*parts), rgb=(102, 132, 190), head_k=k)


def _rz(a): c, s = np.cos(a), np.sin(a); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
def _ry(a): c, s = np.cos(a), np.sin(a); return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
def _rx(a): c, s = np.cos(a), np.sin(a); return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


# ------------------------------------------------------------------ the two boys (one VRoid base)

def boy_common(g, L, k, shirt, trousers, hair, socks_rgb, sock_top, boots_rgb, vol, wave):
    brow = L['brow']
    F.hair_cut(g, lambda d: float(np.interp(abs(d), [0, 30, 45, 180], [brow + 0.008, brow + 0.004, -9, -9])), hair_wave=wave, hair_volume=vol, hair_flick=0.01, hair_blunt=1.0)
    L['hair'] = F.mesh_points(g, 'Hair_00_HAIR'); L['hair_top'] = float(L['hair'][:, 1].max())
    F.hair_colour(g, *hair)
    ttop = top_of(g, 'Bottoms_01_CLOTH')
    t = Tex(g, 'Tops'); recolour_all(t, shirt, keep=0.55)
    tuck(t, g, L)                                                             # tucked in
    sleeve_cut(t, L, 0.42, roll_rgb=shirt * 0.9)
    return t, ttop


def boy_bottoms(g, L, trousers, belt, cuff=None):
    for m in g.j['materials']:
        if 'Bottoms' not in m['name']: continue
        i = g.j['textures'][m['pbrMetallicRoughness']['baseColorTexture']['index']]['source']; t = Tex(g, m['name'], i)
        top = t.y[t.cov].max() if t.cov.any() else 0
        recolour_all(t, cuff if (cuff is not None and top < L.y('knee')) else trousers, keep=0.5)
        if top < L.y('knee'): t.save(); continue
        if belt is not None: t.fill(t.cov & (t.y > top - 0.028), belt, keep=0.3)
        t.save()


def boots(g, rgb, lace=(196, 150, 92)):
    t = Tex(g, 'Shoes_01_CLOTH'); recolour_all(t, rgb, keep=0.55)
    # laces: crossed light lines over the instep (front, between the ankle and the toes)
    t.save()


def fit_c02(g, L, k):
    SHIRT, VEST, TROU, BELT = C(241, 222, 180), C(102, 67, 38), C(129, 96, 61), C(62, 40, 26)
    t, ttop = boy_common(g, L, k, SHIRT, TROU, ((22, 16, 12), (44, 31, 22), (92, 70, 52)), None, None, None, 0.03, 0.016)
    ny = L.y('neck'); front = t.z > L['chest'][2] - 0.01
    gap = 0.010 + 0.055 * sstep(L.y('chest') - 0.02, ny - 0.02, t.y)              # the vest's V opening
    vest = t.cov & torso(t, L, 0.012) & (t.y > ttop - 0.03) & (t.y < ny - 0.012) & ~(front & (t.ax < gap))
    t.fill(vest, VEST, keep=0.35)
    t.flat(vest & front & (np.abs(t.ax - gap) < 0.004), VEST * 0.7)
    buttons(t, L, np.linspace(L.y('chest') - 0.01, ttop - 0.03, 4), x=0.022, r=0.0055, rgb=(150, 110, 70), ring=(70, 45, 28))
    for sx in (-1, 1):                                                         # welt pockets
        m = vest & front & (np.abs(t.x - sx * 0.07) < 0.025) & (np.abs(t.y - (ttop + 0.0)) < 0.003); t.flat(m, VEST * 0.6)
    t.save()
    boy_bottoms(g, L, TROU, BELT, cuff=C(96, 64, 42))
    tb = Tex(g, 'Bottoms_01_CLOTH')                                            # patch on the left leg (the viewer's right)
    px, py = L.x('knee') + 0.012, L.y('knee') + 0.085
    m = tb.cov & (tb.x > 0) & (tb.z > L['knee'][2]) & (np.abs(tb.x - px) < 0.028) & (np.abs(tb.y - py) < 0.034)
    tb.fill(m, C(104, 72, 44), keep=0.4); tb.flat(m & ((np.abs(np.abs(tb.x - px) - 0.024) < 0.002) | (np.abs(np.abs(tb.y - py) - 0.030) < 0.002)), C(186, 150, 100))
    by = top_of(g, 'Bottoms_01_CLOTH') - 0.014; bm = tb.cov & (tb.ax < 0.018) & (tb.z > 0) & (np.abs(tb.y - by) < 0.011); tb.flat(bm, C(168, 140, 86))
    tb.save()
    b = Tex(g, 'Body_00_SKIN'); socks(b, L, L.y('ankle') + 0.62 * (L.y('knee') - L.y('ankle')) * 0.55, C(233, 210, 170), slouch=0.006); b.save()
    boots(g, C(96, 64, 42))
    F.face_paint(g, L, skin=(247, 194, 141), blush=0.40)
    F.brows(g, (44, 30, 22), thick=0.007); F.lashes(g, (40, 28, 20), alpha=0.85)
    straw_hat(g, L, k)


def hat_fit(L, c, drop):
    """Radius of the hair at the hat band (the hat must sit over it) and the band's height: `drop` below the hair top."""
    H = L['hair']; top = L['hair_top']; yb = top - drop
    band = H[(H[:, 1] > yb - 0.02) & (H[:, 1] < yb + 0.05)]
    hr = np.percentile(np.hypot(band[:, 0] - c[0], band[:, 2] - c[2]), 97) + 0.004
    return hr, yb, top


def straw_hat(g, L, k):
    c = np.array([0.0, 0.0, L['head'][2] - 0.02])
    hr, yb, top = hat_fit(L, c, 0.62 * (L['hair_top'] - L['brow']))
    P, N, I = F.lathe(c, dome_profile(hr, yb, 0.36 * hr, 0.48 * hr, 1.85, lip=-0.12 * hr), 56)
    P = (P - c - [0, yb, 0]) @ _rx(-0.18).T + c + [0, yb, 0]                   # tipped back a little
    F.add_part(g, 'Hat', P, F.normals(P, I), I, rgb=(234, 190, 92), head_k=k)
    P, N, I = F.lathe(c, [(hr * 1.01, yb + 0.30 * hr), (hr * 1.01, yb + 0.03 * hr)], 56); P = (P - c - [0, yb, 0]) @ _rx(-0.18).T + c + [0, yb, 0]
    F.add_part(g, 'HatBand', P, F.normals(P, I), I, rgb=(110, 66, 34), head_k=k)


def normals_of(P, I):
    N = F.normals(P, I); c = P.mean(0); return N


def fit_c04(g, L, k):
    SHIRT, STRAP, SHORTS = C(175, 189, 126), C(122, 85, 48), C(109, 75, 46)
    t, ttop = boy_common(g, L, k, SHIRT, SHORTS, ((132, 62, 22), (186, 100, 38), (232, 150, 72)), None, None, None, 0.045, 0.022)
    ny = L.y('neck'); sh_top = L.y('shoulder') + 0.035; front = t.z > L['chest'][2] - 0.012
    yjoin = L.y('chest') - 0.01
    for sx in (-1, 1):
        xf = sx * 0.050                                                        # front straps, straight up over the shoulders
        xb = sx * 0.050 * sstep(yjoin, sh_top, t.y)                            # the back: a Y that meets in the middle
        xs = np.where(front, xf, xb)
        m = t.cov & torso(t, L, 0.0) & (np.abs(t.x - xs) < 0.011) & (t.y > ttop - 0.04) & (np.sign(t.x) == sx)
        t.fill(m, STRAP, keep=0.3)
        t.flat(m & front & (np.abs(t.y - (ttop + 0.01)) < 0.006), C(190, 160, 90))       # brass clip
    t.fill(t.cov & ~front & torso(t, L, 0.0) & (np.abs(t.x) < 0.011) & (t.y < yjoin + 0.005) & (t.y > ttop - 0.04), STRAP, keep=0.3)
    buttons(t, L, np.linspace(ny - 0.045, ttop + 0.02, 4), x=0.0, r=0.0045, rgb=(206, 216, 168), ring=(120, 132, 84))
    t.save()
    boy_bottoms(g, L, SHORTS, None, cuff=C(119, 85, 53))
    b = Tex(g, 'Body_00_SKIN'); socks(b, L, L.y('ankle') + 0.42 * (L.y('knee') - L.y('ankle')), C(239, 210, 164), slouch=0.008, cuff=0.022); b.save()
    boots(g, C(119, 85, 53))
    F.face_paint(g, L, skin=(251, 203, 155), blush=0.40, freckles=11, freckle_rgb=(196, 116, 64))
    F.brows(g, (150, 74, 28), thick=0.007); F.lashes(g, (90, 50, 24), alpha=0.85)


# ------------------------------------------------------------------ adults: shared pieces

def hair_set(g, L, k, ramp, y_end=None, vol=0.0, wave=0.0, flick=0.0):
    F.hair_cut(g, y_end or (lambda d: -9.0), hair_wave=wave, hair_volume=vol, hair_flick=flick, hair_blunt=1.0 if y_end is None else 0.97)
    F.hair_colour(g, *ramp)
    L['hair'] = F.mesh_points(g, 'Hair_00_HAIR'); L['hair_top'] = float(L['hair'][:, 1].max())


def drop_buns(g, L):
    """The preset's two buns (many small locks above the ears at the back) go; a bun of our own is added where needed."""
    F.hair_drop(g, lambda c, P: abs(c[0]) > 0.055 and c[1] > L['crown'] - 0.065 and c[2] < -0.025 and np.linalg.norm(P - c, axis=1).max() < 0.085, 'bun locks')
    L['hair'] = F.mesh_points(g, 'Hair_00_HAIR'); L['hair_top'] = float(L['hair'][:, 1].max())


def bun(g, L, k, c, r, rgb, name='Bun'):
    body = F.ellipsoid(c, r, 32, 18)
    wrap = F.torus([0, 0, 0], max(r[0], r[1]) * 0.78, min(r) * 0.28)                 # a twist round the bun
    P, N, I = wrap; P = P @ _rx(np.pi / 2 - 0.5).T + np.asarray(c) + [0, 0, -r[2] * 0.15]; wrap = (P, F.normals(P, I), I)
    F.add_part(g, name, *F.merge(body, wrap), rgb=rgb, head_k=k)


def eye_centres(g):
    E = F.mesh_points(g, 'EyeWhite'); out = []
    for sx in (-1, 1):
        q = E[np.sign(E[:, 0]) == sx]; out.append((q.mean(0), (q[:, 0].max() - q[:, 0].min()) / 2, q[:, 2].max()))
    return out


def glasses(g, L, k, rgb=(70, 60, 52)):
    parts = []; (cl, wl, zl), (cr, wr, zr) = eye_centres(g); R = max(wl, wr) * 1.05; zf = max(zl, zr) + 0.008; rr = R * 0.07
    for c in (cl, cr): parts.append(F.torus([c[0], c[1], zf], R, rr))
    xi = R * 1.0
    parts.append(F.tube([[cl[0] + np.sign(cr[0] - cl[0]) * R * 0.95, cl[1] + R * 0.25, zf], [0, cl[1] + R * 0.35, zf + 0.002], [cr[0] - np.sign(cr[0] - cl[0]) * R * 0.95, cr[1] + R * 0.25, zf]], rr))
    for c in (cl, cr):
        sx = np.sign(c[0]); x0 = c[0] + sx * R
        parts.append(F.tube([[x0, c[1] + R * 0.2, zf], [sx * L['face_x'] * 0.98, c[1] + R * 0.3, zf - 0.02], [sx * L['face_x'] * 1.0, c[1] + R * 0.1, L['head'][2] - 0.01]], rr))
    F.add_part(g, 'Glasses', *F.merge(*parts), rgb=rgb, outline=0.0006, head_k=k)


def dome_profile(hr, yb, band, dome, brim, lip=0.0, n=9):
    """Hat profile from the top down: a dome of height `dome` on a band of height `band` (radius hr), then a brim out to
    `brim` x hr, turned up by `lip` at its edge, and back under to the band."""
    out = [(hr * np.sin(a), yb + band + dome * np.cos(a)) for a in np.linspace(0.02, np.pi / 2, n)]
    out += [(hr, yb + 0.02 * band), (hr * (1 + 0.6 * (brim - 1)), yb - 0.02 * hr + lip * 0.3), (hr * brim, yb + lip), (hr * brim * 1.005, yb + lip - 0.03 * hr), (hr * (1 + 0.55 * (brim - 1)), yb - 0.06 * hr), (hr * 0.99, yb - 0.035 * hr)]
    return out


def bowler(g, L, k, rgb=(68, 54, 46), band_rgb=(40, 32, 27)):
    c = np.array([0.0, 0.0, L['head'][2] - 0.012]); hr, yb, top = hat_fit(L, c, 0.62 * (L['hair_top'] - L['brow']))
    P, N, I = F.lathe(c, dome_profile(hr, yb, 0.42 * hr, 0.62 * hr, 1.32, lip=0.07 * hr), 56); P = (P - c - [0, yb, 0]) @ _rx(-0.06).T + c + [0, yb, 0]
    F.add_part(g, 'Hat', P, F.normals(P, I), I, rgb=rgb, head_k=k)
    P, N, I = F.lathe(c, [(hr * 1.008, yb + 0.30 * hr), (hr * 1.008, yb + 0.03 * hr)], 56); P = (P - c - [0, yb, 0]) @ _rx(-0.06).T + c + [0, yb, 0]
    F.add_part(g, 'HatBand', P, F.normals(P, I), I, rgb=band_rgb, head_k=k)


def headscarf(g, L, k, rgb):
    fx = L['face_x']; c = np.array([0.0, L['eye'] + 0.01, L['head'][2] - 0.01])
    yf = L['brow'] + 0.40 * (L['crown'] - L['brow']); yb = L['mouth'] - 0.005
    y_edge = lambda t: float(np.interp(abs(t), [0, 0.9, 1.6, np.pi], [yf, yf - 0.02 * fx / 0.1, L['eye'] - 0.01, yb]))
    pts = np.concatenate([L['hair'], L['face'][L['face'][:, 1] > L['eye'] - 0.02]])
    F.add_part(g, 'Scarf', *F.sphere_cover(pts, c, 0.006, y_edge), rgb=rgb, head_k=k)
    zb = pts[:, 2].min(); yk = yb + 0.012; u = fx / 0.1
    parts = [F.ellipsoid([0, yk, zb - 0.008], [0.020 * u, 0.015 * u, 0.012 * u])]
    for sx in (-1, 1):
        parts.append(F.ellipsoid([sx * 0.016 * u, yk - 0.026 * u, zb - 0.012], [0.012 * u, 0.028 * u, 0.005 * u], rot=_rz(sx * 0.45) @ _rx(0.3)))
    F.add_part(g, 'ScarfKnot', *F.merge(*parts), rgb=rgb, head_k=k)


def cloth(g, part, rgb, keep=0.5):
    t = Tex(g, part); recolour_all(t, rgb, keep); return t


def shoes(g, rgb, keep=0.5):
    for m in g.j['materials']:
        if 'Shoes' in m['name']:
            i = g.j['textures'][m['pbrMetallicRoughness']['baseColorTexture']['index']]['source']; t = Tex(g, m['name'], i); recolour_all(t, rgb, keep); t.save()


def vest_on(t, L, ttop, rgb, gap0=0.016, gap_top=0.07, hem=0.04, nbut=4, but_rgb=(150, 110, 70)):
    ny = L.y('neck'); front = t.z > L['chest'][2] - 0.01
    gap = gap0 + gap_top * sstep(L.y('chest') - 0.02, ny - 0.02, t.y)
    vest = t.cov & torso(t, L, 0.012) & (t.y > ttop - hem) & (t.y < ny - 0.015) & ~(front & (t.ax < gap))
    t.fill(vest, rgb, keep=0.35); t.flat(vest & front & (np.abs(t.ax - gap) < 0.004), np.asarray(rgb) * 0.7)
    buttons(t, L, np.linspace(L.y('chest') - 0.01, ttop - hem * 0.5, nbut), x=gap0 + 0.012, r=0.0065, rgb=but_rgb, ring=np.asarray(rgb) * 0.6)
    return vest


# ------------------------------------------------------------------ A01 grandfather

def fit_a01(g, L, k):
    SHIRT, VEST, BREECH, SOCK = C(244, 225, 186), C(118, 80, 46), C(122, 114, 64), C(196, 168, 118)
    hj = L.y('head')
    hair_set(g, L, k, ((168, 164, 156), (226, 223, 214), (250, 248, 242)), y_end=lambda d: float(np.interp(abs(d), [0, 40, 60, 180], [L['brow'] + 0.03, L['brow'] + 0.02, -9, L.y('neck') + 0.03])), vol=0.012, wave=0.012)
    ttop = top_of(g, 'Bottoms_01_CLOTH')
    t = cloth(g, 'Tops', SHIRT, 0.55); tuck(t, g, L); sleeve_cut(t, L, 0.30, roll_rgb=SHIRT * 0.9)
    vest_on(t, L, ttop, VEST, hem=0.05); t.save()
    boy_bottoms(g, L, BREECH, C(70, 48, 30), cuff=C(117, 84, 51))
    b = Tex(g, 'Body_00_SKIN'); socks(b, L, L.y('knee') - 0.035, SOCK, cuff=0.02); b.save()
    shoes(g, C(117, 84, 51))
    F.face_paint(g, L, skin=(243, 184, 140), blush=0.30, blush_rgb=(232, 130, 110), wrinkles=1.0)
    F.brows(g, (238, 234, 224), thick=0.012, short=False); F.lashes(g, (120, 96, 80), alpha=0.5)
    fx = L['face_x']; hh = L['crown'] - L['chin']
    F.add_part(g, 'Beard', *F.beard(L, length=0.42 * hh, thick=0.15 * hh, bulge=0.10 * hh, top_side=L['eye'] - 0.06 * hh, sides=112), rgb=(242, 238, 228), head_k=k)
    F.add_part(g, 'Moustache', *F.moustache(L, width=1.25, height=0.11 * hh, thick=0.08 * hh, droop=0.07 * hh), rgb=(250, 248, 242), head_k=k)


# ------------------------------------------------------------------ A02 craftsman

def fit_a02(g, L, k):
    SHIRT, TROU, APRON, STRAP = C(228, 191, 139), C(74, 55, 38), (116, 76, 41), C(104, 68, 38)
    hair_set(g, L, k, ((60, 36, 18), (103, 64, 34), (150, 100, 60)), y_end=lambda d: float(np.interp(abs(d), [0, 40, 60, 180], [L['brow'] + 0.03, L['brow'] + 0.02, -9, -9])), vol=0.02, wave=0.03, flick=0.012)
    ttop = top_of(g, 'Bottoms_01_CLOTH')
    t = cloth(g, 'Tops', SHIRT, 0.55); tuck(t, g, L); sleeve_cut(t, L, 0.12, roll_rgb=SHIRT * 0.9)
    # apron straps: up from the bib's corners over the shoulders, crossed on the back down to the waist ties
    front = t.z > L['chest'][2] - 0.012; sh = L.y('shoulder') + 0.04; yb = L.y('uchest') + 0.02
    for sx in (-1, 1):
        xf = sx * 0.085
        xb = sx * (0.085 - 0.17 * sstep(sh, ttop + 0.02, t.y))                      # crossing: each strap goes to the other side
        m = t.cov & torso(t, L, 0.0) & (np.abs(t.x - np.where(front, xf, xb)) < 0.014) & np.where(front, t.y > yb, t.y > ttop)
        t.fill(m, STRAP, keep=0.3)
    t.save()
    boy_bottoms(g, L, TROU, None)
    shoes(g, C(99, 71, 45))
    hw = lambda y: float(np.interp(y, [L.y('knee') - 0.15, L.y('hips') - 0.05, L.y('spine') + 0.01, L.y('chest'), L.y('uchest') + 0.03], [0.205, 0.195, 0.185, 0.12, 0.11]))
    F.apron_sheet(g, L, L.y('uchest') + 0.03, L.y('knee') - 0.15, hw, APRON, off=0.016)
    F.face_paint(g, L, skin=(236, 185, 143), blush=0.42, blush_rgb=(226, 120, 96))
    F.brows(g, (62, 38, 20), thick=0.011); F.lashes(g, (50, 30, 18), alpha=0.7)
    hh = L['crown'] - L['chin']
    F.add_part(g, 'Beard', *F.beard(L, length=0.16 * hh, thick=0.07 * hh, bulge=0.03 * hh, top_side=L['eye'] - 0.12 * hh), rgb=(84, 50, 26), head_k=k)
    F.add_part(g, 'Moustache', *F.moustache(L, width=1.0, height=0.08 * hh, thick=0.045 * hh, droop=0.05 * hh), rgb=(84, 50, 26), head_k=k)


# ------------------------------------------------------------------ A05 scholar

def fit_a05(g, L, k):
    COAT, VEST, SHIRT, TIE, TROU = C(60, 56, 52), C(110, 81, 58), C(250, 244, 228), C(56, 50, 46), C(67, 57, 50)
    hair_set(g, L, k, ((55, 35, 20), (95, 62, 38), (140, 100, 70)), y_end=lambda d: float(np.interp(abs(d), [0, 40, 60, 180], [L['brow'] + 0.03, L['brow'] + 0.02, -9, -9])), vol=0.004)
    t = cloth(g, '007_01_Tops', COAT, 0.5); t.save()
    s = Tex(g, '007_02_Tops'); ny = L.y('neck')
    recolour_all(s, SHIRT, 0.4)
    tie = s.cov & (s.ax < 0.012 + 0.004 * sstep(ny - 0.03, ny - 0.12, s.y)) & (s.y < ny - 0.02) & (s.z > L['neck'][2])
    vest = s.cov & (s.y < ny - 0.075) & ~tie & (s.z > L['neck'][2])
    s.fill(vest, VEST, keep=0.3); s.fill(tie, TIE, keep=0.3)
    buttons(s, L, np.linspace(ny - 0.09, ny - 0.2, 3), x=0.022, r=0.005, rgb=(150, 116, 84), ring=(70, 50, 36)); s.save()
    for m in g.j['materials']:
        if 'Bottoms' in m['name']:
            i = g.j['textures'][m['pbrMetallicRoughness']['baseColorTexture']['index']]['source']; b = Tex(g, m['name'], i); recolour_all(b, TROU, 0.5); b.save()
    shoes(g, C(51, 45, 38))
    F.face_paint(g, L, skin=(243, 200, 165), blush=0.26)
    F.brows(g, (70, 45, 28), thick=0.008); F.lashes(g, (50, 34, 22), alpha=0.7)
    hh = L['crown'] - L['chin']
    F.add_part(g, 'Moustache', *F.moustache(L, width=1.05, height=0.085 * hh, thick=0.05 * hh, droop=0.06 * hh, curl=0.03 * hh), rgb=(88, 56, 34), head_k=k)
    glasses(g, L, k); bowler(g, L, k)


# ------------------------------------------------------------------ the women (one VRoid base, the long maid dress)

def waist_y(L): return L.y('spine') + 0.45 * (L.y('chest') - L.y('spine'))


def apron_layer(g, L, keep_bib=False, rgb=None, hide_all_but_sash=False, sash_rgb=None):
    t = Tex(g, 'Tops_01_CLOTH_02'); yw = waist_y(L); back = t.z < L['hips'][2] - 0.02
    band = np.abs(t.y - yw) < 0.022; bow = back & (t.ax < 0.10) & (t.y < yw + 0.05) & (t.y > yw - 0.20)
    if hide_all_but_sash:
        t.hide(t.cov & ~band & ~bow); t.fill(t.cov & (band | bow), sash_rgb, keep=0.4)
    else:
        if not keep_bib: t.hide(t.cov & (t.y > yw + 0.022))
        t.fill(t.cov & (t.a[..., 3] > 0), rgb, keep=0.4)
        if sash_rgb is not None: t.fill(t.cov & (band | bow), sash_rgb, keep=0.4)
    t.save()


def fit_a03(g, L, k):
    MAUVE, BLOUSE, SASH = C(166, 112, 122), C(243, 232, 203), C(240, 228, 204)
    drop_buns(g, L)
    hair_set(g, L, k, ((58, 36, 22), (103, 66, 40), (150, 105, 70)), vol=0.006, wave=0.01)
    H = L['hair']; zb = float(H[(np.abs(H[:, 1] - L['eye']) < 0.03)][:, 2].min()); fx = L['face_x']
    bun(g, L, k, [0, L['eye'] + 0.004, zb - 0.032 * fx / 0.11], [0.043 * fx / 0.11, 0.040 * fx / 0.11, 0.036 * fx / 0.11], (103, 66, 40))
    t = Tex(g, 'Tops_01_CLOTH_01'); ny = L.y('neck'); front = t.z > L['chest'][2] - 0.02
    recolour_all(t, MAUVE, 0.35)
    sleeve = t.cov & arm(t, L, 0.035); t.fill(sleeve, BLOUSE, keep=0.45)
    xc = sleeve_cut(t, L, -0.18, roll_rgb=BLOUSE * 0.93, roll=0.025)                  # puff sleeves to above the elbow, a cuff
    neck = t.cov & front & (t.ax < 0.062) & (t.y > ny - 0.115); t.fill(neck, BLOUSE, keep=0.4)      # the blouse in the square neckline
    t.flat(t.cov & front & (np.abs(t.ax - 0.062) < 0.004) & (t.y > ny - 0.115) & (t.y < ny - 0.01), MAUVE * 0.75)
    t.flat(t.cov & front & (t.ax < 0.062) & (np.abs(t.y - (ny - 0.115)) < 0.004), MAUVE * 0.75)
    collar = t.cov & (t.y > ny - 0.035) & torso(t, L, 0.0); t.fill(collar, BLOUSE, keep=0.4)
    t.flat(t.cov & front & (t.ax < 0.0015) & (t.y > ny - 0.06) & (t.y < ny - 0.02), BLOUSE * 0.7)     # the slit
    t.save()
    apron_layer(g, L, hide_all_but_sash=True, sash_rgb=SASH)
    shoes(g, C(85, 60, 45))
    F.face_paint(g, L, skin=(247, 207, 167), blush=0.36)
    F.brows(g, (92, 60, 38), thick=0.006); F.lashes(g, (70, 44, 28))


def fit_a04(g, L, k):
    SAGE, CREAM, APRON = C(150, 162, 128), C(240, 232, 212), C(247, 236, 210)
    drop_buns(g, L); brow = L['brow']
    hair_set(g, L, k, ((25, 20, 18), (48, 40, 36), (86, 74, 66)), y_end=lambda d: float(np.interp(abs(d), [0, 40, 70, 180], [brow + 0.012, brow + 0.004, L['eye'] - 0.01, L['mouth']])), vol=0.0)
    t = Tex(g, 'Tops_01_CLOTH_01'); ny = L.y('neck'); front = t.z > L['chest'][2] - 0.02
    recolour_all(t, SAGE, 0.35)
    sleeve_cut(t, L, 0.30, roll_rgb=CREAM, roll=0.02)                                 # three-quarter sleeves, cream cuff
    t.fill(t.cov & (t.y > ny - 0.03) & torso(t, L, 0.0), CREAM, keep=0.3)             # cream trim round the neck
    t.save()
    apron_layer(g, L, keep_bib=False, rgb=APRON)
    shoes(g, C(88, 70, 59))
    F.face_paint(g, L, skin=(246, 204, 167), blush=0.55, blush_rgb=(238, 128, 112))
    F.brows(g, (40, 32, 28), thick=0.006); F.lashes(g, (40, 30, 26))
    headscarf(g, L, k, (242, 236, 224))


def fit_a06(g, L, k):
    GOWN, LACE = C(83, 90, 104), C(246, 240, 228)
    drop_buns(g, L)
    hair_set(g, L, k, ((150, 100, 40), (210, 153, 72), (242, 204, 128)), y_end=lambda d: float(np.interp(abs(d), [0, 35, 55, 180], [L['brow'] + 0.45 * (L['crown'] - L['brow']), L['brow'] + 0.3 * (L['crown'] - L['brow']), -9, L['eye']])), vol=0.02, wave=0.012)
    t = Tex(g, 'Tops_01_CLOTH'); ny = L.y('neck'); orig = t.lum()
    white = t.cov & (orig > 150); dark = t.cov & ~white
    t.fill(dark, GOWN, keep=0.3); t.fill(white, LACE, keep=0.4)
    t.flat(white & (t.z > L['chest'][2]) & (t.ax < 0.01) & (t.y < ny - 0.05), GOWN * 0.7)      # dark buttons
    t.save()
    shoes(g, C(73, 63, 53))
    F.face_paint(g, L, skin=(249, 202, 160), blush=0.30)
    F.brows(g, (150, 100, 50), thick=0.005); F.lashes(g, (90, 60, 34))
    fx = L['face_x']; H = L['hair']
    bun(g, L, k, [0, L['crown'] + 0.004, L['head'][2] - 0.03 * fx / 0.11], [0.055 * fx / 0.11, 0.042 * fx / 0.11, 0.05 * fx / 0.11], (210, 153, 72))
    # brooch at the collar (on the neck joint) and pearl earrings
    T = F.mesh_points(g, 'Tops_01_CLOTH'); q = T[(np.abs(T[:, 1] - (ny - 0.005)) < 0.012) & (np.abs(T[:, 0]) < 0.015)]
    zc = q[:, 2].max() + 0.003 if len(q) else L['neck'][2] + 0.05
    br = F.merge(F.ellipsoid([0, ny - 0.006, zc], [0.009, 0.011, 0.004]), )
    F.add_part(g, 'Brooch', *br, rgb=(64, 100, 170), parent='J_Bip_C_Neck', outline=0.0006)
    P, N, I = F.torus([0, ny - 0.006, zc - 0.001], 0.011, 0.0022); F.add_part(g, 'BroochFrame', P, N, I, rgb=(212, 175, 70), parent='J_Bip_C_Neck', outline=0.0004)
    Fc = L['face']; ear = Fc[np.abs(Fc[:, 0]) > fx * 0.85]
    for sx in (-1, 1):
        e = ear[np.sign(ear[:, 0]) == sx]
        if not len(e): continue
        p = [e[:, 0].mean(), e[:, 1].min() - 0.008, e[:, 2].mean()]
        F.add_part(g, f'Earring{"L" if sx > 0 else "R"}', *F.ellipsoid(p, [0.005, 0.0065, 0.005], 12, 8), rgb=(246, 242, 232), outline=0.0004, head_k=k)


CAST = {
    'C03': {'name': 'C03 Blonde girl', 'src': 'c03-vroid.vrm', 'heads': 4.6, 'skin': (250, 211, 178), 'fit': fit_c03},
    'C02': {'name': 'C02 Village boy', 'src': 'boy-vroid.vrm', 'heads': 4.6, 'skin': (247, 194, 141), 'fit': fit_c02},
    'C04': {'name': 'C04 Ginger boy', 'src': 'boy-vroid.vrm', 'heads': 4.6, 'skin': (251, 203, 155), 'fit': fit_c04},
    'A01': {'name': 'A01 Grandfather', 'src': 'a01-vroid.vrm', 'heads': 6.3, 'skin': (243, 184, 140), 'fit': fit_a01},
    'A02': {'name': 'A02 Craftsman', 'src': 'a02-vroid.vrm', 'heads': 6.5, 'skin': (236, 185, 143), 'fit': fit_a02},
    'A03': {'name': 'A03 Young woman', 'src': 'a03-vroid.vrm', 'heads': 5.6, 'skin': (247, 207, 167), 'fit': fit_a03},
    'A04': {'name': 'A04 Housekeeper', 'src': 'a04-vroid.vrm', 'heads': 5.5, 'skin': (246, 204, 167), 'fit': fit_a04},
    'A05': {'name': 'A05 Scholar', 'src': 'a05-vroid.vrm', 'heads': 7.0, 'skin': (243, 200, 165), 'fit': fit_a05},
    'A06': {'name': 'A06 Lady', 'src': 'a06-vroid.vrm', 'heads': 6.5, 'skin': (249, 202, 160), 'fit': fit_a06},
}
