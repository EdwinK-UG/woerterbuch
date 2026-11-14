"""The sleeve's bend field, shared by the art (fix_sleeves.py) and the rig (build_liv.py, sleeve()).

f(x, y) in [0, 1] says how much of the upper arm's turn a point of the puff follows: 1 = the cuff and the puff on the arm's side
(they turn with the upper arm), 0 = the seam wedge on the far side of the shoulder joint (it stays sewn to the body). Between
them f falls off with the angle about the shoulder joint, not along a straight line, so the puff turns like a twirl about the
joint. A twirl never folds over where f changes with the distance from the joint, and only folds where the turn changes faster
than the angle around the joint; the controller limits the turn the field sees (the helpers' shares go to 1 as the arm passes
90 degrees, see liv.tmpl.luau [liv-sleeves]), and the angular fall-off is spread over 150 degrees, so the puff bunches on the side
the arm moves into and stretches on the other, without tearing.

Near the joint f eases to F_CENTRE (no pinch at the joint), and from the inside of the cuff on f is 1 (the cuff is rigid).

The rig deforms the puff with seven levels: helper bones slv<sd>0..5 (share k/6 of the controller's sleeve turn) and the upper
arm (1); a vertex is skinned to the two levels around its f. The shoulder cap (<view>_cap<sd>_k.png, fix_sleeves.py) is the
sleeve's own pixels where f is small, rigid on the spine and drawn under the sleeve: at rest the same pixels hide it; when the arm
is far up (and the whole sleeve turns with it) it keeps the top of the sleeve sewn to the shoulder.
"""
import json, math
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
PARTS = json.loads((HERE / 'parts/parts.json').read_text())

FLAT = math.radians(28)        # |angle from the arm| below this: f = 1
F_CENTRE, R_CENTRE = .45, 26.0  # f at the joint, and the radius over which the angular field takes over
CUFF_IN = 46.0                 # from (cuff end - CUFF_IN) to (cuff end - CUFF_IN + 18) along the arm f goes to 1
CAP = (.22, .42)               # cap alpha: 1 below CAP[0], 0 above CAP[1]
LEVELS = 7                     # slv0..slv5 and the upper arm


def sleeve_src(V, T, sd):
    """(file, box) of the sleeve picture the rig uses for arm sd of view V (the same choice as build_liv.py)."""
    D = HERE / V
    for name in (f'sleeve{sd}_f', f'sleeve{sd}_c', f'sleeve{sd}_x', f'sleeve{sd}'):
        p = D / f'{V}_{name}.png'
        if not p.exists(): p = HERE / 'parts' / f'{V}_{name}.png'
        if p.exists(): break
    else:
        return None, None
    if name.endswith('_f'): box = T['boxes'][name]
    elif f'{V}_sleeve{sd}' in PARTS: q = PARTS[f'{V}_sleeve{sd}']; box = [q['x'], q['y'], q['w'], q['h']]
    else: box = T['boxes'][f'sleeve{sd}']
    return p, box


class Field:
    def __init__(self, V, T, sd, src=None, box=None, like=None):
        """src, box: another picture of this arm's sleeve (the three-quarter far sleeve's whole copy); like: a Field whose cuff it
        shares, so both pictures bend the same way."""
        a = T[sd]; self.sh = np.array(a['sh'], float); u = np.array(a['dir'], float); self.u = u / np.linalg.norm(u)
        self.phi = math.atan2(self.u[1], self.u[0])
        cfg = T.get('sleeve_rig', {}).get(sd, {})
        self.flat = math.radians(cfg.get('flat_deg', math.degrees(FLAT)))
        p, box = (src, box) if src is not None else sleeve_src(V, T, sd)
        self.src, self.box = Path(p), box
        im = np.asarray(Image.open(p).convert('RGBA')).astype(np.float32) / 255.0
        yy, xx = np.mgrid[0:im.shape[0], 0:im.shape[1]]
        X = box[0] + (xx + .5) * box[2] / im.shape[1]; Y = box[1] + (yy + .5) * box[3] / im.shape[0]
        t = (X - self.sh[0]) * self.u[0] + (Y - self.sh[1]) * self.u[1]; s = -(X - self.sh[0]) * self.u[1] + (Y - self.sh[1]) * self.u[0]
        on = (im[..., 3] > .5) & (np.abs(s) < 40)
        self.tend = float(t[on].max()) if on.any() else 110.0           # the cuff's far edge along the arm
        if like is not None: self.tend = like.tend
        self.tc0 = cfg.get('cuff_in', self.tend - CUFF_IN)

    def f(self, x, y):
        x = np.asarray(x, float); y = np.asarray(y, float)
        dx, dy = x - self.sh[0], y - self.sh[1]
        r = np.hypot(dx, dy); d = np.abs((np.arctan2(dy, dx) - self.phi + np.pi) % (2 * np.pi) - np.pi)
        fa = 1 - np.clip((d - self.flat) / (np.pi - self.flat), 0, 1)
        k = np.clip(r / R_CENTRE, 0, 1); k = k * k * (3 - 2 * k)
        f = F_CENTRE + (fa - F_CENTRE) * k
        t = dx * self.u[0] + dy * self.u[1]
        c = np.clip((t - self.tc0) / 18.0, 0, 1); c = c * c * (3 - 2 * c)
        return f + (1 - f) * c


def ramp(v, a, b):
    t = np.clip((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)


def level_weights(f):
    """f -> [(level index, weight), (level index, weight)] over LEVELS evenly spaced levels (0 = slv0 ... 6 = upper arm)."""
    x = min(max(float(f), 0.0), 1.0) * (LEVELS - 1); k = min(int(x), LEVELS - 2); a = x - k
    return [(k, 1 - a), (k + 1, a)]
