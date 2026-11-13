--!strict
-- actions: Liv's action library for the Rive controller, a port of tools/liv/src/06-actions.js (the canvas engine).
--
-- Use it as a module (ScriptAsset isModule="true", declared before liv.luau):
--     local Actions = require('actions')
--     self.act = Actions.new()
--     local req = Actions.frame(self.act, dt, nv, put, gaitWeight)       -- once per frame (plays, blends, face, props)
--     ... per view: Actions.pelvis / foot / spine / hand / ff / shape / palm / head / props (see liv.tmpl.luau)
--
-- Inputs (view-model numbers): action 0 none, 1..27 (ORDER below, the canvas order); the controller sets it back to 0
-- when the action has played and blended out. prop 0 none, 1 apple, 2 crate, 3 saw handle (held in her hands; a throw
-- releases the apple and sets prop to 0). Read-outs: actionT (seconds into the action, 0 when none).
--
-- Every action is a function of time t (seconds) that fills a partial pose, exactly the canvas maths (same timings and
-- amplitudes); units are converted here:
--   * hand targets: canvas arm lengths [out, up, forward] from the shoulder (m = 1: from the breastbone) -> metres in the
--     chest frame (X her left, Y up from the standing pelvis, Z forward); arm length 0.274 m, shoulders at +-0.098 m,
--     0.378 m above the pelvis (the Rive art). The controller turns the chest frame with the spine (lean) and the twist.
--   * py (hip height factor, rest 0.985) -> dpy metres (x hip height 0.498); psf (leg lengths) -> metres (x 0.40);
--     psx (hip widths) -> metres (x 0.076); hop metres; foot p [lateral hip widths, up legs, forward legs] -> offsets from
--     the planted foot in metres; lean, hp (head pitch, absolute), hr (roll), hy (yaw), crl (chest roll), ctw (chest
--     twist) radians; shL/shR -> shrug (shoulders up 0.035 m per unit).
--   * finger presets (FING) -> hand_pose.luau shapes (see SHAPE): open -> open, point -> point, thumb -> thumbsUp,
--     flat -> flat, grip -> gripSphere (apple) / gripHandle (pull) / carry (crate), one/two/three -> count1..3,
--     hook/open mix -> beckon, relaxed -> relaxed, fist -> fist; think's own curl row -> point.
--   * expressions: happy 0 smile 1 neutral 2 laugh 3 surprised 4 sad 5 think 6 ouch 7 effort 8 wink 9 (face.luau).
-- "near" is her right arm and "far" her left in every view (the rig always turns the same way; mirror flips the picture).
export type Part = {[string]: number}
type Def = {name: string, dur: number, tin: number, tout: number, expr: number, key: number, fn: (number, Part) -> ()}
type Layer = {d: Def, id: number, t: number, w: number, w0: number, te: number, ending: boolean, dead: boolean}
export type State = {
  layers: {Layer}, mix: Part, req: number, alive: boolean, hold: {number},
  savedE: number, savedLX: number, savedLY: number, wroteE: boolean, wroteL: boolean,
  release: boolean, flyT: number, fly: {[string]: number}, prev: {[string]: number}, prop: number,
  bools: {[string]: Property<boolean>},
}

local M = {}

local ARM = 0.274          -- shoulder to wrist (149 + 125 view px)
local SHX = 0.098          -- shoulder half width
local SHY = 0.378          -- shoulder height above the pelvis
local HIPH = 0.498         -- hip height (thigh + shin + ankle)
local LEG = 0.40           -- thigh + shin
local HIPW = 0.076         -- hip half width
local PPM = 996.0
local PI = math.pi
local TAU = 2 * math.pi

-- hand shapes: the order of HP in liv.tmpl.luau / M.SHAPES in hand_pose.luau
M.HP = {'relaxed','open','flat','wave','fist','point','thumbsUp','pinch','gripSphere','gripHandle','carry','beckon','count1','count2','count3','count4','count5'}
local relaxed, open, flat, fist, point, thumbsUp, gripSphere, gripHandle, carry, beckon = 1, 2, 3, 5, 6, 7, 9, 10, 11, 12
local count1 = 13
local APPLE_R = 24.0       -- grip radii (view px) for the hand shapes
local HANDLE_R = 15.0

local function clamp(x: number, a: number, b: number): number return math.clamp(x, a, b) end
local function ss(t: number): number t = clamp(t, 0, 1); return t * t * (3 - 2 * t) end
local function seg(t: number, a: number, b: number): number return ss((t - a) / (b - a)) end
local function pulse(t: number, a: number, b: number, c: number, d: number): number return seg(t, a, b) * (1 - seg(t, c, d)) end
local function lerp(a: number, b: number, t: number): number return a + (b - a) * t end
local function g(P: Part, k: string, d: number): number local x = P[k] :: number?; if x ~= nil then return x end; return d end

-- one arm of a partial pose: s 'r' (near) or 'l' (far); h = canvas hand target [out, up, forward] in arm lengths;
-- palm = canvas palm direction [out, up, forward]; m = 1 measures from the breastbone; bend = wrist bend (rad)
-- e = canvas elbow hint [out, up, forward] from the shoulder: the Rive IK bends to one of two sides, the hint picks it
local function arm(P: Part, s: string, h0: number, h1: number, h2: number, shape: number, p0: number, p1: number, p2: number, m: number, grip: number, bend: number,
  e0: number, e1: number, e2: number)
  local sg = if s == 'l' then 1 else -1
  P[s .. 'Ex'] = sg * e0; P[s .. 'Ey'] = e1; P[s .. 'Ez'] = e2
  P[s .. 'X'] = sg * (SHX * (1 - m) + h0 * ARM)
  P[s .. 'Y'] = SHY + h1 * ARM
  P[s .. 'Z'] = h2 * ARM
  P[s .. 'A'] = 1
  P[s .. 'S'] = shape; P[s .. 'G'] = grip
  P[s .. 'Px'] = sg * p0; P[s .. 'Py'] = p1; P[s .. 'Pz'] = p2
  P[s .. 'B'] = bend
end
local function both(P: Part, h0: number, h1: number, h2: number, shape: number, p0: number, p1: number, p2: number, m: number, grip: number, bend: number,
  e0: number, e1: number, e2: number)
  arm(P, 'r', h0, h1, h2, shape, p0, p1, p2, m, grip, bend, e0, e1, e2); arm(P, 'l', h0, h1, h2, shape, p0, p1, p2, m, grip, bend, e0, e1, e2)
end
local function py(P: Part, v: number) P.dpy = (v - 0.985) * HIPH end              -- canvas hip height factor -> metres
-- a foot: canvas p = [lateral hip widths (rest 1), up (legs), forward (legs)], pitch (rad, + toe up)
local function foot(P: Part, s: string, p0: number, p1: number, p2: number, pitch: number)
  P[s .. 'Fw'] = (p0 - 1) * HIPW; P[s .. 'Fup'] = p1 * LEG; P[s .. 'Fu'] = p2 * LEG; P[s .. 'Fp'] = pitch
end

-- expression numbers
local E_NONE, E_NEUTRAL, E_LAUGH, E_THINK, E_OUCH, E_EFFORT, E_WINK = -1, 2, 3, 6, 7, 8, 9

local function def(name: string, dur: number, fn: (number, Part) -> (), tin: number?, tout: number?, expr: number?, key: number?): Def
  return {name = name, dur = dur, fn = fn, tin = if tin ~= nil then tin else 0.22, tout = if tout ~= nil then tout else 0.25,
    expr = if expr ~= nil then expr else E_NONE, key = if key ~= nil then key else 0}
end

local DEFS: {Def} = {
  def('wave', 2.6, function(t, P)
    local s = math.sin(t * 9.5)
    arm(P, 'r', 0.64 + 0.16 * s, 0.6 - 0.04 * math.abs(s), 0.3, open, 0, 0, 1, 0, 0, 0, 1, -0.55, 0.1); P.hr = 0.06; P.crl = 0.03
  end),
  def('point', 2.0, function(t, P) arm(P, 'l', 0.9, 0.1, 0.22, point, 0, -1, 0, 0, 0, 0, 0.3, -1, -0.3); P.lRd = 1; P.ctw = 0.06 end),
  def('pointUp', 2.0, function(t, P) arm(P, 'r', 0.6, 0.62, 0.3, point, -1, 0, 0.2, 0, 0, 0, 0.9, -0.6, 0); P.hp = -0.08 end),
  def('thumb', 2.0, function(t, P)
    local b = 0.03 * math.sin(t * 11) * pulse(t, 0.2, 0.5, 1.2, 1.5)
    arm(P, 'r', 0.3, -0.12 + b, 0.66, thumbsUp, -1, 0, 0.15, 0, 0, 0, 0.7, -0.8, -0.2); P.hr = 0.05
  end, nil, nil, E_WINK),
  def('clap', 2.4, function(t, P)
    local gg = math.abs(math.sin(t * PI / 0.3))
    both(P, 0.03 + 0.14 * gg, -0.22, 0.62, flat, -1, 0, 0, 1, 0, 0, 0.9, -0.7, 0); py(P, 0.985 + 0.006 * gg)
  end, nil, nil, E_LAUGH),
  def('shrug', 2.2, function(t, P) both(P, 0.5, -0.46, 0.42, open, 0, 1, 0.2, 0, 0, 0, 0.5, -0.9, -0.3); P.shrug = 1.3; P.hr = 0.1 end, nil, nil, E_THINK),
  def('think', 3.0, function(t, P)
    arm(P, 'r', -0.02, 0.06, 0.44, point, -0.3, 0, -1, 0.85, 0, 0, 0.9, -0.8, 0.2); P.rNc = 1   -- the finger to the chin (2D: chin centre and lower; canvas out 0.14, up 0.24)
    arm(P, 'l', -0.05, -0.62, 0.32, relaxed, 0, 0, -1, 0.5, 0, 0, 0.9, -0.6, -0.2); P.hr = -0.09; P.hp = -0.04
  end, nil, nil, E_THINK),
  def('cheer', 2.4, function(t, P)
    local b = math.abs(math.sin(t * PI / 0.42))
    both(P, 0.42, 0.92 + 0.04 * b, 0.12, open, 0, 0, 1, 0, 0, 0, 1, 0.2, 0); P.hop = 0.05 * b * HIPH; P.hp = -0.1
  end, nil, nil, E_LAUGH),
  def('hips', 2.4, function(t, P) both(P, 0.2, -0.62, 0.0, fist,   -- 2D: out 0.2 (canvas 0.34) puts the fists on the waist, not beside it
    0, 0, -1, 0, 0, 0, 1, -0.15, -0.7) end),
  def('present', 2.6, function(t, P) arm(P, 'l', 0.85, 0.1, 0.3, open, 0, 1, 0.2, 0, 0, 0, 0.3, -1, -0.3); P.lRd = 1 end),
  def('stop', 2.0, function(t, P) arm(P, 'r', 0.2, 0.22, 0.86, flat, 0, 0, 1, 0, 0, -0.5, 0.6, -0.8, -0.2) end, nil, nil, E_NEUTRAL),
  def('beckon', 2.4, function(t, P)
    local c = 0.5 + 0.5 * math.sin(t * 9)
    arm(P, 'r', 0.3, -0.05, 0.75, beckon, 0, 1, 0, 0, 0, 0.5 * c, 0.7, -0.8, -0.2)
  end),
  def('count', 3.0, function(t, P)
    local n = math.min(2, math.floor(t / 0.9)); local b = 0.03 * math.exp(-((t % 0.9) * 8))
    arm(P, 'r', 0.62, 0.38 + b, 0.42, count1 + n, 0, 0, 1, 0, 0, 0, 0.9, -0.7, 0)
  end),
  def('nod', 1.6, function(t, P) P.hp = 0.2 * math.sin(t * TAU / 0.55) end, 0.1),
  def('shake', 1.6, function(t, P) P.hy = 0.5 * math.sin(t * TAU / 0.5); P.hr = 0.03 * math.sin(t * TAU / 0.5) end, 0.1, nil, E_NEUTRAL),
  def('bow', 2.2, function(t, P)
    both(P, 0.16, -0.9, -0.2, relaxed, -1, 0, 0, 0, 0, 0, 0.4, -0.3, -1); P.lean = 0.6; P.hp = 0.3; py(P, 0.96)
  end, 0.45, 0.45),
  def('jump', 1.5, function(t, P)
    local cr = pulse(t, 0, 0.28, 0.3, 0.42) + pulse(t, 0.86, 0.94, 1.0, 1.3) * 0.75
    local air = clamp((t - 0.4) / 0.46, 0, 1); local up = seg(t, 0.3, 0.5) * (1 - seg(t, 0.9, 1.25))
    local hop = if t > 0.4 and t < 0.86 then 4 * 0.3 * HIPH * air * (1 - air) else 0
    local tuck = math.sin(PI * air) * 0.16
    -- arm = mix(down-back, up) by `up`; elbow hints are not used by the Rive IK
    both(P, lerp(0.14, 0.36, up), lerp(-0.82, 0.86, up), lerp(-0.42, 0.2, up), open, -1, 0, 0, 0, 0, 0, lerp(0.3, 1, up), lerp(-0.2, 0, up), lerp(-1, 0, up))
    py(P, 0.985 - 0.2 * cr); P.lean = 0.24 * cr - 0.05 * up; P.hop = hop; P.hp = 0.1 * cr - 0.12 * up
    foot(P, 'l', 1.05, tuck, if hop > 0 then -0.05 else 0, -0.5 * math.sin(PI * air))
    foot(P, 'r', 1.05, tuck * 0.8, if hop > 0 then 0.05 else 0, -0.5 * math.sin(PI * air))
  end, 0.08, 0.2, E_LAUGH),
  def('crouch', 2.6, function(t, P)
    both(P, 0.2, -0.5, 0.75, relaxed, 0, -1, 0, 0.3, 0, 0, 0.8, -0.6, 0); py(P, 0.56); P.psf = -0.1 * LEG; P.lean = 0.5; P.hp = -0.3
  end, 0.5, 0.5),
  def('carry', 2.0, function(t, P) both(P, 0.3, -0.42, 0.55, carry, -1, 0, 0, 1, 0, 0, 1, -0.6, -0.4); P.lean = -0.05 end, nil, nil, nil, 1),
  def('push', 2.4, function(t, P) both(P, 0.14, -0.1, 0.9, flat, 0, 0, 1, 0.2, 0, -0.6, 0.8, -0.7, -0.2); P.lean = 0.3; P.hp = -0.2 end, nil, nil, E_EFFORT, 1),
  def('pull', 2.4, function(t, P) both(P, 0.12, -0.3, 0.8, gripHandle, -1, 0, 0, 0.6, HANDLE_R, 0, 0.8, -0.7, -0.2); P.lean = -0.22; py(P, 0.93) end, nil, nil, E_EFFORT, 1),
  def('throw', 1.5, function(t, P)
    local w = seg(t, 0, 0.5); local r = seg(t, 0.55, 0.72)
    local hx = lerp(lerp(0.2, 0.4, w), 0.25, r); local hy = lerp(lerp(-0.5, 0.5, w), 0.3, r); local hz = lerp(lerp(0.3, -0.55, w), 0.92, r)
    arm(P, 'r', hx, hy, hz, if r > 0.5 then open else gripSphere, 0, 0, 1, 0, APPLE_R, 0, lerp(0.8, 0.6, r), lerp(-0.4, -0.8, r), lerp(-0.6, 0, r))
    P.ctw = -0.35 * w + 0.6 * r                          -- near arm is her right: the canvas sign for near 'R'
    P.lean = -0.08 * w + 0.22 * r
  end, 0.12),
  def('kick', 1.3, function(t, P)
    local w = pulse(t, 0, 0.35, 0.35, 0.5); local r = pulse(t, 0.4, 0.55, 0.7, 1.0)
    foot(P, 'r', 1.0, 0.1 * w + 0.22 * r, -0.35 * w + 0.55 * r, -0.5 * w + 0.3 * r)
    P.lean = 0.06 * w - 0.14 * r; py(P, 0.975)
    arm(P, 'r', 0.35, -0.6, 0.45 * w - 0.4 * r, relaxed, -1, 0, 0, 0, 0, 0, 0.6, -0.5, -0.6)
    arm(P, 'l', 0.4, -0.6, -0.4 * w + 0.5 * r, relaxed, -1, 0, 0, 0, 0, 0, 0.6, -0.5, -0.6)
  end, 0.1),
  def('sit', 3.0, function(t, P)
    both(P, 0.12, -0.62, 0.42, relaxed, 0, -1, 0, 0.3, 0, 0, 0.8, -0.6, -0.3); py(P, 0.6); P.psf = -0.34 * LEG; P.lean = 0.06
    foot(P, 'l', 1.0, 0, 0.12, 0); foot(P, 'r', 1.0, 0, 0.2, 0)
  end, 0.6, 0.6),
  def('dance', 3.2, function(t, P)
    local s = math.sin(t * TAU / 0.8); local c = math.cos(t * TAU / 0.8); local b = math.abs(math.sin(t * TAU / 0.8))
    P.psx = 0.6 * s * HIPW; P.crl = -0.08 * s; py(P, 0.975 - 0.03 * b); P.hr = 0.08 * s     -- prl (pelvis roll) has no bone in the Rive rig
    arm(P, 'l', 0.5, 0.2 + 0.25 * s, 0.4, open, 0, 0, 1, 0, 0, 0, 1, -0.4, 0); arm(P, 'r', 0.5, 0.2 - 0.25 * s, 0.4, open, 0, 0, 1, 0, 0, 0, 1, -0.4, 0)
    foot(P, 'l', 1.2, 0.05 * math.max(0, -c), 0, 0); foot(P, 'r', 1.2, 0.05 * math.max(0, c), 0, 0)
  end, nil, nil, E_LAUGH),
  def('explain', 3.0, function(t, P)
    local b = math.sin(t * 5.2)
    arm(P, 'r', 0.44, -0.2 + 0.05 * b, 0.6, open, 0, 1, 0.3, 0, 0, -0.15 + 0.1 * b, 0.8, -0.8, -0.1); P.hr = 0.03 * b
  end),
  def('ouchHand', 1.6, function(t, P)
    local s = math.sin(t * 26) * math.exp(-t * 1.6)
    arm(P, 'l', 0.5 + 0.1 * s, -0.1 + 0.08 * math.abs(s), 0.6, open, 0, -1, 0, 0, 0, 0.5 * s, 0.5, -0.9, -0.2); P.lean = -0.12; P.hr = -0.06
  end, 0.08, nil, E_OUCH),
}
M.ORDER = {}
for i, d in ipairs(DEFS) do M.ORDER[i] = d.name end
M.COUNT = #DEFS
function M.duration(i: number): number local d = DEFS[i]; if d then return d.dur end; return 0 end

-- holding a prop (lowest layer): 1 apple in the right hand, 2 crate in both (the carry arms), 3 saw handle in the right hand
local function holdPart(k: number, P: Part)
  -- (not in the canvas engine: there a held object overrides the arms in the scene's code). The hand comes forward a little
  -- so the apple or the handle is not hidden by the satchel.
  if k == 1 then arm(P, 'r', 0.16, -0.72, 0.42, gripSphere, -1, 0, 0, 0, APPLE_R, 0, 0.3, -1, -0.3)
  elseif k == 2 then both(P, 0.3, -0.42, 0.55, carry, -1, 0, 0, 1, 0, 0, 1, -0.6, -0.4)
  elseif k == 3 then arm(P, 'r', 0.14, -0.6, 0.55, gripHandle, -1, 0, 0, 0, HANDLE_R, 0, 0.3, -1, -0.3) end
end

function M.new(): State
  return {layers = {}, mix = {}, req = 0, alive = false, hold = {0, 0, 0}, savedE = 0, savedLX = 0, savedLY = 0, wroteE = false,
    wroteL = false, release = false, flyT = 99, fly = {}, prev = {}, prop = 0, bools = {}}
end

local ARMK = {'X', 'Y', 'Z', 'Px', 'Py', 'Pz', 'B', 'Ex', 'Ey', 'Ez'}
local SCAL = {'lean', 'hp', 'hr', 'hy', 'crl', 'ctw', 'dpy', 'psf', 'psx', 'hop', 'shrug', 'rRd', 'lRd', 'rNc', 'lNc',
  'rFu', 'rFw', 'rFup', 'rFp', 'lFu', 'lFw', 'lFup', 'lFp'}
-- blend one partial pose over the mix with weight w (the canvas blendInto: only what the part sets)
local function blendInto(Mx: Part, P: Part, w: number)
  if w <= 0 then return end
  for _, s in ipairs({'r', 'l'}) do
    if g(P, s .. 'A', 0) > 0 then
      local aw = g(Mx, s .. 'A', 0); local W = 1 - (1 - aw) * (1 - w)
      for _, k in ipairs(ARMK) do
        local key = s .. k
        Mx[key] = (g(Mx, key, 0) * aw * (1 - w) + g(P, key, 0) * w) / math.max(W, 1e-6)
      end
      Mx[s .. 'A'] = W
    end
    -- the hand shape: the latest layer that holds it with some weight wins (the hand's springs do the transition)
    local sw = if g(P, s .. 'A', 0) > 0 then 1 else g(P, s .. 'SW', 0)
    if sw > 0 and w >= 0.35 and g(P, s .. 'S', 0) > 0 then Mx[s .. 'S'] = g(P, s .. 'S', 1); Mx[s .. 'G'] = g(P, s .. 'G', 0) end
  end
  for _, k in ipairs(SCAL) do
    local v = P[k] :: number?
    if v ~= nil then Mx[k] = lerp(g(Mx, k, 0), v, w) end
  end
end

-- once per frame. nv(name, default) reads a view-model number, put(name, value) writes one; gw = gait weight (0 standing)
function M.frame(st: State, dt: number, nv: (string, number) -> number, put: (string, number) -> (), gw: number)
  local req = math.floor(nv('action', 0) + 0.5)
  local propK = math.floor(nv('prop', 0) + 0.5)
  -- a new request starts a layer; a layer with the same key blends out (the canvas `play`)
  if req ~= st.req then
    st.req = req
    local d = DEFS[req]
    if d then
      for _, l in ipairs(st.layers) do
        if l.d.key == d.key and not l.ending then l.ending = true; l.te = 0; l.w0 = l.w end
      end
      if not st.alive then st.savedE = nv('expression', 0); st.savedLX = nv('lookX', 0); st.savedLY = nv('lookY', 0) end
      table.insert(st.layers, {d = d, id = req, t = 0, w = 0, w0 = 0, te = 0, ending = false, dead = false})
      st.alive = true
    end
  end
  -- play the layers
  local Mx: Part = {}
  -- props held (lowest layer, blends in and out over about 0.25 s)
  for k = 1, 3 do
    local target = if propK == k then 1 else 0
    st.hold[k] += (target - st.hold[k]) * math.min(1, dt * 9)
    if st.hold[k] > 0.002 then local P: Part = {}; holdPart(k, P); blendInto(Mx, P, ss(st.hold[k])) end
  end
  local expr = E_NONE; local tShow = 0.0
  st.release = false
  for _, l in ipairs(st.layers) do
    local t0 = l.t
    l.t += dt
    local d = l.d
    if not l.ending and l.t >= d.dur - d.tout then l.ending = true; l.te = 0; l.w0 = l.w end
    if l.ending then
      l.te += dt; l.w = l.w0 * (1 - ss(l.te / d.tout)); if l.te >= d.tout then l.dead = true end
    else l.w = math.max(l.w, ss(l.t / d.tin)) end
    local P: Part = {}
    d.fn(l.t, P)
    blendInto(Mx, P, l.w)
    if not l.ending and d.expr >= 0 then expr = d.expr end
    if l.id == st.req then tShow = l.t end
    -- the throw lets go of the apple when the hand opens (r passes 0.5 at t = 0.635 s)
    if d.name == 'throw' and t0 < 0.635 and l.t >= 0.635 and propK == 1 then st.release = true end
  end
  -- finished layers; the request number goes back to 0 when its action has blended out
  local keep: {Layer} = {}
  local reqAlive = false
  for _, l in ipairs(st.layers) do
    if not l.dead then table.insert(keep, l); if l.id == st.req then reqAlive = true end end
  end
  st.layers = keep
  if st.req ~= 0 and not reqAlive then st.req = 0; put('action', 0) end
  put('actionT', tShow)
  -- the face: the action's expression while it plays (not while it blends out), gaze follows the head
  local alive = #st.layers > 0
  if expr >= 0 then put('expression', expr); st.wroteE = true
  elseif st.wroteE then put('expression', st.savedE); st.wroteE = false end
  local hp = g(Mx, 'hp', 0); local hy = g(Mx, 'hy', 0)
  if alive and (math.abs(hp) > 1e-4 or math.abs(hy) > 1e-4) then
    put('lookX', clamp(st.savedLX + 1.1 * math.sin(hy), -1, 1)); put('lookY', clamp(st.savedLY - 1.5 * hp, -1, 1)); st.wroteL = true
  elseif st.wroteL then put('lookX', st.savedLX); put('lookY', st.savedLY); st.wroteL = false end
  st.alive = alive
  -- props: the apple flies when it is thrown, then the hands are empty
  if st.release then st.flyT = 0; put('prop', 0); propK = 0 end
  st.flyT += dt
  st.prop = propK
  put('propApple', ss(st.hold[1] * 3 - 2) * (if propK == 1 then 1 else 0))
  put('propCrate', ss(st.hold[2] * 2 - 0.6))
  put('propSaw', ss(st.hold[3] * 3 - 2) * (if propK == 3 then 1 else 0))
  put('flyOp', if st.flyT < 0.9 then 1 - ss((st.flyT - 0.45) / 0.45) else 0)
  -- the lower body of an action (hips height, hips back, feet) only plays while she stands; arms and torso always
  Mx.lw = 1 - clamp(gw, 0, 1)
  st.mix = Mx
end

-- ----------------------------------------------------------------- per view (cs, sn: cos and sin of the view's yaw)
-- pelvis offset in view px (x, y): hips down / back / sideways, and the hop of a jump
function M.pelvis(st: State, cs: number, sn: number): (number, number)
  local P = st.mix; local lw = g(P, 'lw', 1)
  return (g(P, 'psf', 0) * sn * lw + g(P, 'psx', 0) * cs * lw) * PPM, -(g(P, 'dpy', 0) * lw + g(P, 'hop', 0)) * PPM
end
-- a foot's offset in view px and its extra pitch; s 'r' or 'l'. Seen from the front or back, a foot moving forward also
-- moves a little outward (a 2D animator's angle: a kick straight at the camera does not read)
function M.foot(st: State, s: string, cs: number, sn: number, KD: number): (number, number, number)
  local P = st.mix; local lw = g(P, 'lw', 1)
  local du = g(P, s .. 'Fu', 0) * lw; local dw = g(P, s .. 'Fw', 0) * lw; local up = g(P, s .. 'Fup', 0) * lw
  dw += 0.45 * math.abs(du) * cs * cs
  local wl = if s == 'l' then dw else -dw
  return (du * sn + wl * cs) * PPM, (du * cs - wl * sn) * KD * PPM - (up + g(P, 'hop', 0)) * PPM, g(P, s .. 'Fp', 0) * lw
end
-- screen rotation added to the spine and to the head (head pitch is absolute in the canvas: relative to the chest here)
function M.spine(st: State, cs: number, sn: number): (number, number)
  local P = st.mix; local ks = 0.2 + 0.8 * sn
  local lean = g(P, 'lean', 0)
  return lean * ks + g(P, 'crl', 0) * cs, (g(P, 'hp', 0) - lean) * ks + g(P, 'hr', 0) * cs
end
-- head offset on the neck, in the spine's frame (along: up the spine, side: to screen right): nod dips the head seen from
-- the front, shake shifts it sideways (the canvas cut-out does the same), a shrug sinks it between the shoulders
function M.head(st: State, cs: number, sn: number): (number, number)
  local P = st.mix
  -- a forward lean seen from the front (bow, crouch) drops the head toward the chest: the torso is foreshortened
  local along = -(math.max(0, g(P, 'hp', 0)) * 0.08 * cs * cs + math.max(0, g(P, 'lean', 0)) * 0.06 * cs * cs + g(P, 'shrug', 0) * 0.016) * PPM
  local side = math.sin(g(P, 'hy', 0)) * 0.016 * cs * PPM
  return along, side
end
-- the hand target in view px for side s, and the weight with which the action owns that arm. Body space: chest frame
-- (twisted by ctw about the vertical), projected with the view's yaw, then turned with the spine about the pelvis.
function M.hand(st: State, s: string, cs: number, sn: number, pelX: number, pelY: number, spineA: number): (number, number, number)
  local P = st.mix; local w = g(P, s .. 'A', 0)
  if w <= 0 then return 0, 0, 0 end
  local X = g(P, s .. 'X', 0); local Y = g(P, s .. 'Y', 0) + g(P, 'shrug', 0) * 0.035; local Z = g(P, s .. 'Z', 0)
  local tw = g(P, 'ctw', 0)
  if tw ~= 0 then local c = math.cos(tw); local sv = math.sin(tw); X, Z = X * c + Z * sv, Z * c - X * sv end
  -- a 2D animator's angle: a gesture that points straight at or away from the camera (the far arm pointing to her left,
  -- seen from the side) is turned about the shoulder toward her front until at least 85 % of it shows on screen
  local rd = g(P, s .. 'Rd', 0)
  if rd > 0 then
    local sx0 = if s == 'l' then SHX else -SHX
    local dx = X - sx0; local dz = Z
    local hl = math.sqrt(dx * dx + dz * dz)
    if hl > 0.05 then
      local scr = (dx * cs + dz * sn) / hl
      if math.abs(scr) < 0.85 then
        local a0 = math.atan2(dx, dz)                                   -- heading of the gesture (0 = forward, + = her left)
        local best = a0; local bd = 99.0
        for i = -40, 40 do                                              -- the nearest heading (prefer forward) that shows 85 %
          local a = i * math.pi / 40
          local sc = math.sin(a) * cs + math.cos(a) * sn
          local cost = math.abs(a - a0) + (if math.cos(a) < 0 then 1 else 0)
          if math.abs(sc) >= 0.85 and cost < bd then bd = cost; best = a end
        end
        local a = lerp(a0, best, rd)
        X = sx0 + hl * math.sin(a); Z = hl * math.cos(a)
      end
    end
  end
  local vx = (X * cs + Z * sn) * PPM; local vy = -Y * PPM
  if rd > 0 then                                -- and as long on screen as it is in space (a pointing arm is straight)
    local sx0 = if s == 'l' then SHX else -SHX
    local qx = (X * cs + Z * sn) - sx0 * cs; local qy = Y - SHY
    local L2 = math.sqrt(qx * qx + qy * qy); local L3 = math.sqrt((X - sx0) ^ 2 + qy * qy + Z * Z)
    if L2 > 1e-3 and L2 < L3 then local k = lerp(1, L3 / L2, rd); vx = (sx0 * cs + qx * k) * PPM; vy = -(SHY + qy * k) * PPM end
  end
  local cr = math.cos(spineA); local sr = math.sin(spineA)
  local hx = pelX + vx * cr - vy * sr; local hy = pelY + vx * sr + vy * cr
  -- keep the hand off the head (a 2D picture has no depth: a hand "beside" the head in 3D lands on the face or the hair):
  -- the wrist is pushed sideways out of a circle around the head; seen from the side, toward the front
  if g(P, s .. 'Nc', 0) < 0.5 then
    local fxl = 0.04 * sn * PPM; local fyl = -0.58 * PPM
    local fx = pelX + fxl * cr - fyl * sr; local fy = pelY + fxl * sr + fyl * cr
    local r = 0.24 * PPM
    local dy = hy - fy
    if math.abs(dy) < r then
      local need = math.sqrt(r * r - dy * dy)
      local dir = if math.abs(cs) < 0.5 then 1.0 else (if s == 'r' then -1.0 else 1.0) * (if cs >= 0 then 1.0 else -1.0)
      local d = (hx - fx) * dir
      if d < need and d > -need then hx = fx + dir * need end      -- only a wrist inside the circle
    end
  end
  return hx, hy, w
end
-- far arm (her left) in front of the torso: when its hand comes toward the viewer past the chest (clap, carry, push).
-- With hysteresis and a quick fade (about 0.08 s): a copy left half faded would show the arm twice.
function M.ff(st: State, pre: string, ffv: number, cs: number, sn: number, dt: number): number
  local P = st.mix; local w = g(P, 'lA', 0)
  local on = (st.prev[pre .. 'ffOn'] or 0) > 0.5
  if w > 0 then
    local d = g(P, 'lZ', 0) * cs - g(P, 'lX', 0) * sn
    if d > 0.03 then on = true elseif d < 0.0 then on = false end
  else on = false end
  st.prev[pre .. 'ffOn'] = if on then 1 else 0
  local f = st.prev[pre .. 'ff'] or 0
  f = math.clamp(f + (if on then dt else -dt) / 0.08, 0, 1)
  st.prev[pre .. 'ff'] = f
  return lerp(ffv, f, math.min(1, w * 3))
end
-- leg A's knee side in the front and back views (key = that view's boolean; default = the rig's): knees apart while the
-- hips are held low by an action, switched only while the legs are nearly straight
function M.legs(st: State, key: string, cs: number)
  local p = st.bools[key]
  if p == nil then return end
  local d0 = st.prev[key .. 'def']
  if d0 == nil then d0 = if p.value then 1 else 0; st.prev[key .. 'def'] = d0 end
  local P = st.mix
  local deep = g(P, 'dpy', 0) * g(P, 'lw', 1)
  local want = (d0 > 0.5)
  if math.abs(cs) > 0.75 and st.alive and #st.layers > 0 then
    local lowest = 0.0
    for _, l in ipairs(st.layers) do if l.d.name == 'crouch' or l.d.name == 'sit' or l.d.name == 'jump' then lowest = 1 end end
    if lowest > 0 then want = not want end
  end
  if want ~= p.value and deep > -0.012 then p.value = want end
end
-- the hand shape for side s (a name of hand_pose.luau and the grip radius), or the pose's
function M.shape(st: State, s: string, name: string, grip: number): (string, number)
  local P = st.mix; local i = math.floor(g(P, s .. 'S', 0) + 0.5)
  if i >= 1 and i <= #M.HP then return M.HP[i], g(P, s .. 'G', grip) end
  return name, grip
end
-- palm toward the viewer (1) or the back of the hand (0): from the action's palm direction where it is clear
function M.palm(st: State, s: string, cs: number, sn: number, default: number): number
  local P = st.mix; local w = g(P, s .. 'A', 0)
  if w <= 0 then return default end
  local d = g(P, s .. 'Pz', 0) * cs - g(P, s .. 'Px', 0) * sn
  local want = if d > 0 then 1 else 0
  return lerp(default, want, w * ss((math.abs(d) - 0.1) / 0.2))
end
-- wrist bend (radians on the hand bone): stop and push bend the hand back, beckon and the ouch shake flap it
function M.bend(st: State, s: string, flip: number): number
  local P = st.mix
  return g(P, s .. 'B', 0) * g(P, s .. 'A', 0) * flip
end

-- the elbow side of one arm in one view. The Rive two-bone IK bends to a fixed side of the shoulder -> target line (y down:
-- cross(target - shoulder, elbow - shoulder) > 0 without inversion); the canvas elbow hint says which side the elbow belongs.
-- The side only changes while the arm is almost straight (no visible flip); without an action it goes back to the default.
function M.attach(st: State, vm: ViewModel, names: {string})
  for _, n in ipairs(names) do local p = vm:getBoolean(n); if p then st.bools[n] = p end end
end
-- one arm of one view: blends the pose / gait hand (bx, by) to the action's (ax, ay) and keeps the elbow on the side the
-- action's elbow hint asks for (key = the view's IK-inversion boolean). sx, sy = shoulder (view px). Returns the hand target.
-- A change of side needs a straight arm (the elbow passes through the shoulder-hand line): while one is pending the arm is
-- stretched for a moment (about 0.1 s), the side flips when it is straight, then the arm bends again: no elbow pop.
function M.arm(st: State, key: string, s: string, sx: number, sy: number, bx: number, by: number, ax: number, ay: number, aw: number,
  cs: number, sn: number, spineA: number, dt: number): (number, number)
  local hx, hy = bx, by
  if aw > 0 then hx, hy = M.blendHand(sx, sy, bx, by, ax, ay, aw) end
  local p = st.bools[key]
  if p == nil then return hx, hy end
  local P = st.mix
  local want = false
  if aw > 0.02 then
    -- the side is decided on the action's own target (stable while it blends in and out): of the two elbows the 2D IK can
    -- make, the one nearer the canvas elbow hint (a pole from the shoulder) wins
    local vx = ax - sx; local vy = ay - sy
    local L1 = 0.149 * PPM; local L2 = 0.125 * PPM
    local d = math.clamp(math.sqrt(vx * vx + vy * vy), math.abs(L1 - L2) + 1, L1 + L2 - 1)
    local ux = vx / math.max(d, 1e-3); local uy = vy / math.max(d, 1e-3)
    local a = (L1 * L1 - L2 * L2 + d * d) / (2 * d); local h = math.sqrt(math.max(0, L1 * L1 - a * a))
    local nx = -uy; local ny = ux
    local ex = (g(P, s .. 'Ex', 0) * cs + g(P, s .. 'Ez', 0) * sn); local ey = -g(P, s .. 'Ey', 0)
    local cr = math.cos(spineA); local sr = math.sin(spineA)
    local hx2 = ex * cr - ey * sr; local hy2 = ex * sr + ey * cr
    local hl = math.max(1e-3, math.sqrt(hx2 * hx2 + hy2 * hy2))
    local px = hx2 / hl * L1; local py = hy2 / hl * L1                     -- the hint point, relative to the shoulder
    local d1 = (a * ux + h * nx - px) ^ 2 + (a * uy + h * ny - py) ^ 2     -- default side (no inversion)
    local d2 = (a * ux - h * nx - px) ^ 2 + (a * uy - h * ny - py) ^ 2
    want = d2 < d1
  end
  local pend = want ~= p.value
  local k = st.prev[key .. 'str'] or 0
  k = math.clamp(k + (if pend then dt / 0.1 else -dt / 0.12), 0, 1)
  st.prev[key .. 'str'] = k
  local reach = (0.149 + 0.125) * PPM
  local dx = hx - sx; local dy = hy - sy; local r = math.sqrt(dx * dx + dy * dy)
  if k > 0 and r > 1 then
    local r2 = lerp(r, math.max(r, 0.99 * reach), ss(k))
    hx = sx + dx / r * r2; hy = sy + dy / r * r2; r = r2
  end
  if pend and r >= 0.975 * reach then p.value = want end
  return hx, hy
end
-- blend the hand from the pose / gait target (b) to the action's (a) along an arc about the shoulder (s), not a straight
-- line: a raised hand swings down beside the body instead of folding the arm across the chest
function M.blendHand(sx: number, sy: number, bx: number, by: number, ax: number, ay: number, w: number): (number, number)
  if w >= 1 then return ax, ay end
  local ab = math.atan2(by - sy, bx - sx); local aa = math.atan2(ay - sy, ax - sx)
  local d = aa - ab
  if d > math.pi then d -= 2 * math.pi elseif d < -math.pi then d += 2 * math.pi end
  local rb = math.sqrt((bx - sx) ^ 2 + (by - sy) ^ 2); local ra = math.sqrt((ax - sx) ^ 2 + (ay - sy) ^ 2)
  local an = ab + d * w; local r = lerp(rb, ra, w)
  return sx + r * math.cos(an), sy + r * math.sin(an)
end

-- props of one view: the crate between the hands, the thrown apple's flight. pre = the view's prefix; rx, ry / lx, ly = the
-- final hand targets of the right and left hand (view px); put writes view-model numbers
local THROW_V = {0.0, 2.6, 2.4}          -- the apple leaves the hand at (X, Y, Z) m/s in body space: forward and up
function M.props(st: State, pre: string, rx: number, ry: number, lx: number, ly: number, cs: number, sn: number, put: (string, number) -> ())
  -- crate: centred between the two grips, as wide as the hands are apart (seen from the side it is its depth)
  local cx = (rx + lx) * 0.5; local cy = (ry + ly) * 0.5
  put(pre .. 'crateX', cx); put(pre .. 'crateY', cy + 34)
  put(pre .. 'crateSX', clamp((math.abs(rx - lx) + 70) / 220, 0.55, 1.15))
  -- flying apple: from the hand at the release, ballistic in body space, projected; toward the camera it grows
  if st.release then st.fly[pre .. 'x'] = rx; st.fly[pre .. 'y'] = ry end
  local fx = st.fly[pre .. 'x']
  if fx ~= nil and st.flyT < 1 then
    local t = st.flyT
    local vx = (THROW_V[1] * cs + THROW_V[3] * sn) * PPM; local vy = -THROW_V[2] * PPM
    local depth = (THROW_V[3] * cs - THROW_V[1] * sn) * t                -- metres toward the viewer
    put(pre .. 'flyX', fx + vx * t); put(pre .. 'flyY', (st.fly[pre .. 'y'] or ry) + vy * t + 0.5 * 9.81 * PPM * t * t)
    put(pre .. 'flyS', clamp(1 / math.max(0.25, 1 - depth / 2.5), 0.5, 3))
  else
    put(pre .. 'flyX', rx); put(pre .. 'flyY', ry); put(pre .. 'flyS', 1)
  end
end

return M
