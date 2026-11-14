"""Cut Liv's three-quarter-back view (04_three_quarter_back.png) for the Rive rig.

    python3 tools/liv/rive/cut_tqb.py           (writes tools/liv/rive/tqb/, checks in tqb/check/)

The recipe of cut_tq.py + cut_cloth.py, mirrored: seen from behind on her left, she faces away to the viewer's right. Slot A (the
viewer's left) is her LEFT arm and leg and is the far side (the arm partly behind the bodice); slot B is her right, the near side.
No face, no apron (from behind the dress is plain red); the waist bow's two tails are cut off as tqb_bow1 / tqb_bow2 with the
bodice and skirt behind them filled in. The shared machinery (class ViewCut) lives in cut_side.py.
"""
import json
import numpy as np
from PIL import Image
from scipy import ndimage

from cut_side import (ViewCut, PARTS, INK, is_red, is_ink, skin_like, finish_checks)


def main():
    V = 'tqb'
    c = ViewCut(V, '04_three_quarter_back.png')
    M = c.META
    print('tqb: parts', list(c.parts))

    # ---- sleeves: the pack's parts plus the cuff pixels the pack left in the picture
    ext = {sd: c.claim('sleeve' + sd, c.sleeve_extras(sd)) for sd in 'AB'}
    info = {}
    for sd in 'AB':
        info[sd] = c.cut_arm(sd, M[sd]['sh'], M[sd]['dir'], c.parts['sleeve' + sd]['cov'] | ext[sd])
    for sd in 'AB':
        rim = c.claim('sleeve' + sd, c.res & ndimage.binary_dilation(c.parts['sleeve' + sd]['cov'] | ext[sd], iterations=12) & ~skin_like(c.view))
        ext[sd] = ext[sd] | rim
    sl = {}
    for sd in 'AB':
        sl[sd] = c.cloth_retone_all(c.part_piece('sleeve' + sd, ext[sd]))
        c.save_box(f'sleeve{sd}_c', sl[sd], c.parts['sleeve' + sd]['box']); c.pieces[f'sleeve{sd}_c'] = sl[sd]
        a = info[sd]; sh = np.array(a['sh']); u = np.array(a['dir'])
        t = (c.xx - sh[0]) * u[0] + (c.yy - sh[1]) * u[1]
        im = sl[sd].copy(); im[..., 3] *= np.clip((30 - t) / 22, 0, 1)
        c.save_box(f'cap{sd}', im, c.parts['sleeve' + sd]['box']); c.pieces[f'cap{sd}'] = im

    # ---- waist-bow tails (the right one lies over the left one); the knot and loops stay on the bodice
    RIGHT = [(429, 696), (449, 694), (461, 762), (413, 764), (416, 738)]
    LEFT = [(418, 698), (440, 698), (431, 714), (409, 762), (390, 762), (368, 738), (386, 719), (404, 703)]
    t2 = c.bow_tail('bow2', RIGHT, (440, 694))
    t1 = c.bow_tail('bow1', LEFT, (430, 696))
    tails = t1 | t2

    # ---- legs (A: her left, viewer's left; B: her right); the skirt's hem line first
    c.claim_hem()
    legA, hipA, kneeA, ankA = c.cut_leg('A', M['A']['ankle'], 1060, 1200, 395)
    legB, hipB, kneeB, ankB = c.cut_leg('B', M['B']['ankle'], 1060, 1205, 520)
    info.update(pelvis=[500, 912], hipA=hipA, hipB=hipB, kneeA=kneeA, kneeB=kneeB, ankleA=ankA, ankleB=ankB, neck=M['neck'])
    for sd, lg in (('A', legA), ('B', legB)):
        xs = np.nonzero(lg.any(0))[0]; info['leg' + sd] = dict(x0=int(xs.min()), x1=int(xs.max()) + 1)
    info['legpiece'] = {'A': c.leg_pieces('A', legA, hipA, kneeA, ankA), 'B': c.leg_pieces('B', legB, hipB, kneeB, ankB)}

    # ---- torso and skirt: the picture's pixels, tails cut away and filled in
    NECK_SKIN_Y = 520
    tb = c.parts['torso']['box']; inT = np.zeros((c.H, c.W), bool); inT[tb[1]:tb[1] + tb[3], tb[0]:tb[0] + tb[2]] = True
    sb = c.parts['skirt']['box']; inS = np.zeros((c.H, c.W), bool); inS[sb[1]:sb[1] + sb[3], sb[0]:sb[0] + sb[2]] = True
    tor_extra = c.claim('torso', c.res & inT & (c.yy < 740))
    tor = c.part_piece('torso', tor_extra)
    sk_extra = c.claim('skirt', c.res & inS & (c.yy < 1000) & (is_red(c.view) | is_ink(c.view)))
    skp = c.part_piece('skirt', c.extra['skirt'])
    sil0 = ((tor[..., 3] > 128) | (skp[..., 3] > 128)) & ~tails
    E0, E1 = (431.0, 660), (384.0, 752)                                    # the dress's left edge, behind the left tail
    edge = {y: E0[0] + (E1[0] - E0[0]) * (y - E0[1]) / (E1[1] - E0[1]) for y in range(E0[1], E1[1] + 1)}
    sil = sil0.copy()
    for y, x0 in edge.items(): sil[y, int(round(x0)):560] = True
    ring = ndimage.binary_dilation(tails, iterations=3) & ~is_red(c.view)      # the tail's soft outline and any pixel of it the mask missed
    shadow = ndimage.binary_dilation(tails, iterations=3) & (c.view.sum(axis=-1) < 230)   # and its drop shadow on the dress
    ring &= c.yy > 704                                                       # not into the bow's loops above
    gone = (tails | ring | shadow) & (c.yy > 694)
    hole = gone & sil
    tor_f, f1 = c.fill_behind(tor, hole & inT, sil, {y: x for y, x in edge.items() if 694 <= y < tb[1] + tb[3]})
    tor_f[..., 3] = np.where(gone & ~f1 & inT, 0, tor_f[..., 3])
    sk_f, f2 = c.fill_behind(skp, hole & (c.yy >= 732) & inS, sil, {y: x for y, x in edge.items() if y >= 732})
    sk_f[..., 3] = np.where(gone & ~f2, 0, sk_f[..., 3])
    tor_c, tcl, tsk = c.torso_retone(tor_f, NECK_SKIN_Y)
    c.save_box('torso_c', tor_c, tb); c.pieces['torso_c'] = tor_c
    # no apron from behind: the skirt is all red; anything cream left on it (a tail's tip) is filled red
    a = sk_f[..., 3] > 128
    cream_left = a & ~is_red(sk_f[..., :3]) & ~is_ink(sk_f[..., :3]) & (c.yy < 800)
    red = c.fill_red(sk_f, ndimage.binary_dilation(cream_left, iterations=1) & a, a) if cream_left.any() else sk_f
    c.save_box('skirtred', red, sb); c.pieces['skirtred'] = red
    print('  cream left on the skirt after the tails were cut:', int(cream_left.sum()), 'px')
    c.base_layer(sk_f, 22, 'slip', sb); c.base_layer(tor_f, 14, 'chemise', tb)
    for sd in 'AB':
        so = c.cloth_retone_all(c.parts['sock' + sd]['rgba']); c.save_box(f'sock{sd}_c', so, c.parts['sock' + sd]['box']); c.pieces[f'sock{sd}_c'] = so
    strap = np.zeros((8, 30, 4), np.float32); strap[..., :3] = (0xe6, 0x9d, 0x43); strap[..., 3] = 255
    strap[:, :3, :3] = INK; strap[:, -3:, :3] = INK
    Image.fromarray(strap.astype(np.uint8), 'RGBA').save(c.OUT / f'{V}_strap.png')

    # ---- rig points
    def rows_of(m, y):
        xs = np.nonzero(m[y])[0]; return float(xs.min()), float(xs.max())
    skm = red[..., 3] > 128
    (wl, wr), (hl, hr) = rows_of(skm, 770), rows_of(skm, M['hem'] - 6)
    info['yaw_deg'] = 137; info['facing'] = 'right'; info['A_is'] = 'L'; info['far_arm'] = 'A'
    info['rig'] = {
        'head_top': [float(M['neck'][0]), 180.0],
        'hair': [[485, 200], [470, 440]],                          # the whole back of the head is hair: crown to the ends at the nape
        'skirt_L': [[wl + .2 * (wr - wl), 770], [hl + .1 * (hr - hl), M['hem'] - 2]],
        'skirt': [[(wl + wr) / 2, 770], [(hl + hr) / 2, M['hem']]],
        'skirt_R': [[wl + .8 * (wr - wl), 770], [hl + .9 * (hr - hl), M['hem'] - 2]],
        'apron': None,                                             # none from behind
        'bag': {'a': [470, 478], 'b': [592, 800]}, 'bag_visible': True,
        'bag_mirror': {'a': [552, 478], 'b': [398, 792], 'behind': True},
        'bow1': [[430.0, 698.0], [388.0, 746.0]], 'bow2': [[440.0, 696.0], [436.0, 752.0]],
        'bow_knot': [437.0, 682.0],
    }
    info['boxes'] = dict(c.boxes)
    for n in ['torso', 'skirt', 'sleeveA', 'sleeveB', 'sockA', 'sockB', 'bootA', 'bootB', 'head']: info['boxes'].setdefault(n, c.parts[n]['box'])
    info['parts'] = sorted(n for n in PARTS if n.startswith('tqb_'))
    info['hand'] = {sd: {'wrist': info[sd]['wrist'], 'dir': info[sd]['dir']} for sd in 'AB'}
    info['far_arm_detail'] = {'side': 'A', 'behind_torso': True,
                              'sleeve': 'tqb_sleeveA_c holds only the visible sleeve pixels, so it may be drawn in front of the bodice (as build_liv.py does) '
                                        'and still match the picture at rest'}
    info['draw_order_hint'] = ['upperA', 'foreA', 'handA', 'thighA', 'shinA', 'sockA_c', 'bootA', 'thighB', 'shinB', 'sockB_c', 'bootB',
                               'chemise', 'slip', 'skirtred', 'torso_c', 'bow1', 'bow2', 'capA', 'sleeveA_c', 'head',
                               'upperB', 'capB', 'sleeveB_c', 'foreB', 'handB']
    info['notes'] = {
        'legs': 'near leg is B (her right); build_liv.py draws leg A over B. They do not overlap at rest; in a stride B should be in front.',
        'wrist': 'wrist = where the drawn hand starts; A._tw/B._tw are the distances from the shoulder',
        'bow': 'bow1 = left tail (behind), bow2 = right tail (in front); bones from the knot to the tail tips; knot and loops stay on tqb_torso_c',
    }
    info['_ppm'] = 996
    (c.OUT / f'{V}.json').write_text(json.dumps(info, indent=1))

    # ---- checks (back to front, as build_liv.py draws: far arm's back copy at the bottom, legs B then A, cloth, near arm on top)
    P = c.pieces
    head = c.parts['head']['rgba']; boot = {sd: c.parts['boot' + sd]['rgba'] for sd in 'AB'}
    order = [('upperA', P['upperA']), ('foreA', P['foreA']), ('handA*', P['handA*']),
             ('thighB', P['thighB']), ('shinB', P['shinB']), ('sockB_c', P['sockB_c']), ('bootB', boot['B']),
             ('thighA', P['thighA']), ('shinA', P['shinA']), ('sockA_c', P['sockA_c']), ('bootA', boot['A']),
             ('chemise', P['chemise']), ('slip', P['slip']), ('skirtred', P['skirtred']), ('torso_c', P['torso_c']),
             ('bow1', P['bow1']), ('bow2', P['bow2']), ('capA', P['capA']), ('sleeveA_c', P['sleeveA_c']), ('head', head),
             ('upperB', P['upperB']), ('capB', P['capB']), ('sleeveB_c', P['sleeveB_c']), ('foreB', P['foreB']), ('handB*', P['handB*'])]
    cloth = np.zeros((c.H, c.W), bool)
    for nm in ['sleeveA_c', 'sleeveB_c', 'capA', 'capB', 'sockA_c', 'sockB_c', 'bow1', 'bow2']:
        cloth |= P[nm][..., 3] > 30
    cloth = ndimage.binary_dilation((cloth & ~is_ink(c.view) & ~is_red(c.view)) | tcl, iterations=1)
    EDIT = {'torso_c', 'skirtred', 'sleeveA_c', 'sleeveB_c', 'sockA_c', 'sockB_c', 'bow1', 'bow2', 'upperA', 'upperB', 'foreA', 'foreB'}
    r, asm, diff = c.report(order, cloth, EDIT)
    r['seal'] = c.sealed
    print('tqb check:', json.dumps(r))
    finish_checks(c, info, r)


if __name__ == '__main__':
    main()
