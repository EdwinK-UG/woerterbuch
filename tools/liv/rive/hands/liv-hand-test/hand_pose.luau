--!strict
-- hand_pose: natural finger motion for Liv's rigged hands (tools/liv/rive/hands/hand_rig.py, painted parts).
--
-- Use it as a module (ScriptAsset isModule="true", declared before the script that requires it):
--     local HandPose = require('hand_pose')
--     local h = HandPose.new(0.0)                         -- argument: phase seed for the idle motion
--     HandPose.attach(h, vm, 'handR')                     -- finds handRThumbCurl ... handRPalmSide
--     HandPose.setShape(h, 'gripSphere', 20)              -- a shape name and (for grips) the radius in view px
--     HandPose.setBlend(h, 'relaxed', 'fist', 0.4, 0, 0)  -- or a mix of two shapes
--     HandPose.update(h, dt); HandPose.write(h)           -- every frame
--     local wristOffset = HandPose.wrist(h)               -- radians to add to the wrist bone (wave, beckon)
-- or paste the whole file above a controller and drop the final `return`.
--
-- Channels (all view-model numbers of one hand): thumbCurl, thumbOpp (-1 thumbs-up .. 0 rest .. 1 across the palm),
-- indexCurl, middleCurl, ringCurl, pinkyCurl (0 straight .. 1 fist), spread (0 together .. 1 fanned).
-- Motion: one damped spring per channel, slightly underdamped (a few percent overshoot); a cascade (index leads, the
-- pinky follows about 60 ms later); idle micro-motion so a hand is never frozen; beckon and wave are cycles.
export type Hand = {
  t: number,
  seed: number,
  cur: {number},
  vel: {number},
  shapeA: string, gripA: number,
  shapeB: string, gripB: number,
  mix: number,
  prevA: string, prevGripA: number, prevB: string, prevGripB: number, prevMix: number,
  changeT: number,
  squeeze: number,
  props: {[string]: Property<number>},
  prefix: string,
}

local M = {}

M.CHANNELS = {'thumbCurl', 'thumbOpp', 'indexCurl', 'middleCurl', 'ringCurl', 'pinkyCurl', 'spread'}
-- the order of a shape row: thumbCurl, thumbOpp, index, middle, ring, pinky, spread
local DELAY = {0.012, 0.0, 0.0, 0.025, 0.042, 0.058, 0.0}          -- the cascade (s)
local OMEGA = {19.0, 17.0, 21.0, 20.0, 19.0, 18.5, 14.0}          -- spring stiffness (rad/s)
local ZETA = {0.70, 0.75, 0.62, 0.64, 0.66, 0.68, 0.80}           -- damping (< 1: slight overshoot)
local IDLE_P = {4.1, 5.3, 3.3, 3.7, 4.4, 3.1, 5.9}                -- idle drift periods (s)

M.SHAPES = {'relaxed', 'open', 'flat', 'wave', 'fist', 'point', 'thumbsUp', 'pinch', 'gripSphere', 'gripHandle',
  'carry', 'beckon', 'count1', 'count2', 'count3', 'count4', 'count5'}

local FIXED: {[string]: {number}} = {
  relaxed  = {0.25, 0.05, 0.20, 0.27, 0.33, 0.40, 0.14},
  open     = {0.00, -0.35, 0.00, 0.00, 0.02, 0.04, 1.00},
  flat     = {0.06, 0.08, 0.02, 0.02, 0.03, 0.04, 0.05},
  wave     = {0.04, -0.30, 0.02, 0.01, 0.03, 0.05, 0.55},
  fist     = {0.62, 0.62, 1.00, 1.00, 1.00, 1.00, 0.00},
  point    = {0.55, 0.62, 0.00, 0.97, 1.00, 1.00, 0.06},
  thumbsUp = {0.00, -1.00, 1.00, 1.00, 1.00, 1.00, 0.00},
  pinch    = {0.30, 0.55, 0.52, 0.30, 0.26, 0.24, 0.30},
  carry    = {0.30, 0.15, 0.66, 0.68, 0.70, 0.72, 0.00},
  beckon   = {0.30, 0.25, 0.10, 0.62, 0.80, 0.86, 0.10},
  count1   = {0.55, 0.62, 0.00, 0.97, 1.00, 1.00, 0.30},
  count2   = {0.55, 0.65, 0.00, 0.00, 1.00, 1.00, 0.55},
  count3   = {0.55, 0.70, 0.00, 0.00, 0.00, 1.00, 0.65},
  count4   = {0.55, 0.50, 0.00, 0.00, 0.00, 0.02, 0.75},
  count5   = {0.00, -0.65, 0.00, 0.00, 0.00, 0.02, 0.90},
}

local function clamp01(x: number): number return math.clamp(x, 0, 1) end
local function lerp(a: number, b: number, t: number): number return a + (b - a) * t end

-- grips: `grip` is the radius of the object in view px (an apple of about 40 px across: 20; a saw handle: 15)
local function gripRow(name: string, grip: number): {number}
  if name == 'gripSphere' then
    local r = if grip > 0 then grip else 20
    local c = clamp01(0.98 - r / 48)                -- r 20 -> 0.56: the fingers wrap the ball
    return {0.30, 0.55, c - 0.04, c, c + 0.03, c + 0.06, clamp01(0.75 - r / 80)}
  end
  -- gripHandle: a cylinder across the palm
  local r = if grip > 0 then grip else 15
  local c = clamp01(1.08 - r / 70)                  -- r 15 -> 0.87
  return {0.62, 0.66, c - 0.02, c, c + 0.01, c + 0.02, 0.0}
end

-- a shape's targets at time tt (beckon is a cycle: the fingers curl in one after the other, again and again)
function M.shapeRow(name: string, grip: number, tt: number): {number}
  if name == 'gripSphere' or name == 'gripHandle' then return gripRow(name, grip) end
  local row = FIXED[name] or FIXED.relaxed
  local out = table.clone(row)
  if name == 'beckon' then
    -- index and middle beckon; ring and pinky stay curled. One cycle 0.95 s.
    local ph = (tt % 0.95) / 0.95
    local w = 0.5 - 0.5 * math.cos(2 * math.pi * ph)
    out[3] = lerp(0.08, 0.92, w)
    local ph2 = ((tt - 0.07) % 0.95) / 0.95
    out[4] = lerp(0.35, 0.95, 0.5 - 0.5 * math.cos(2 * math.pi * ph2))
  end
  return out
end

function M.new(seed: number): Hand
  local row = FIXED.relaxed
  return {
    t = 0, seed = seed, cur = table.clone(row), vel = {0, 0, 0, 0, 0, 0, 0},
    shapeA = 'relaxed', gripA = 0, shapeB = 'relaxed', gripB = 0, mix = 0,
    prevA = 'relaxed', prevGripA = 0, prevB = 'relaxed', prevGripB = 0, prevMix = 0,
    changeT = -10, squeeze = 0, props = {}, prefix = '',
  }
end

local function remember(h: Hand)
  h.prevA = h.shapeA; h.prevGripA = h.gripA; h.prevB = h.shapeB; h.prevGripB = h.gripB; h.prevMix = h.mix
  h.changeT = h.t
end

-- one shape (grip: radius in view px for gripSphere / gripHandle, else ignored)
function M.setShape(h: Hand, name: string, grip: number?)
  local g = if grip ~= nil then grip else 0
  if name == h.shapeA and g == h.gripA and h.mix == 0 then return end
  remember(h)
  h.shapeA = name; h.gripA = g; h.shapeB = name; h.gripB = g; h.mix = 0
end

-- a mix of two shapes, 0 = a, 1 = b (e.g. a hand closing on an object: relaxed -> gripSphere by contact)
function M.setBlend(h: Hand, a: string, b: string, mix: number, gripA: number, gripB: number)
  local changed = a ~= h.shapeA or b ~= h.shapeB or gripA ~= h.gripA or gripB ~= h.gripB
  if changed then remember(h) end
  h.shapeA = a; h.gripA = gripA; h.shapeB = b; h.gripB = gripB; h.mix = clamp01(mix)
end

-- squeeze toward a fist on top of the current shape (the fistGrip helper: 0 none .. 1 full fist)
function M.fistGrip(h: Hand, amount: number) h.squeeze = clamp01(amount) end

local function targetAt(h: Hand, i: number, tt: number): number
  local useNew = tt >= h.changeT
  local a = if useNew then h.shapeA else h.prevA
  local b = if useNew then h.shapeB else h.prevB
  local ga = if useNew then h.gripA else h.prevGripA
  local gb = if useNew then h.gripB else h.prevGripB
  local m = if useNew then h.mix else h.prevMix
  local va = M.shapeRow(a, ga, tt)[i]
  local v = va
  if m > 0 then v = lerp(va, M.shapeRow(b, gb, tt)[i], m) end
  if h.squeeze > 0 then v = lerp(v, FIXED.fist[i], h.squeeze) end
  return v
end

function M.update(h: Hand, dt: number)
  local d = math.clamp(dt, 0, 1 / 20)
  h.t += d
  for i = 1, 7 do
    local goal = targetAt(h, i, h.t - DELAY[i])
    -- idle micro-motion: about +-3 % of the range, slow, different for every channel and hand
    local idle = 0.028 * math.sin(2 * math.pi * h.t / IDLE_P[i] + h.seed * 1.7 + i * 1.3)
      + 0.010 * math.sin(2 * math.pi * h.t / (IDLE_P[i] * 0.43) + h.seed + i)
    if i == 2 then idle *= 0.6 end
    goal += idle
    local w = OMEGA[i]; local z = ZETA[i]
    local x = h.cur[i]; local v = h.vel[i]
    -- semi-implicit Euler in two half steps (stable at 20 fps)
    for _ = 1, 2 do
      local hs = d * 0.5
      v += (w * w * (goal - x) - 2 * z * w * v) * hs
      x += v * hs
    end
    local lo = if i == 2 then -1.15 else -0.06
    h.cur[i] = math.clamp(x, lo, 1.06); h.vel[i] = v
  end
end

-- radians to add to the wrist: wave flaps the hand, beckon nods it a little with the fingers
function M.wrist(h: Hand): number
  local name = if h.mix < 0.5 then h.shapeA else h.shapeB
  if name == 'wave' then return 0.38 * math.sin(2 * math.pi * 2.1 * h.t) end
  if name == 'beckon' then return 0.10 * math.sin(2 * math.pi * (h.t % 0.95) / 0.95 - 0.6) end
  return 0
end

function M.value(h: Hand, channel: string): number
  for i, c in ipairs(M.CHANNELS) do if c == channel then return h.cur[i] end end
  return 0
end

local function cap(s: string): string return string.upper(string.sub(s, 1, 1)) .. string.sub(s, 2) end

function M.attach(h: Hand, vm: ViewModel, prefix: string)
  h.prefix = prefix
  for _, c in ipairs(M.CHANNELS) do
    local p = vm:getNumber(prefix .. cap(c))
    if p then h.props[c] = p end
  end
end

function M.write(h: Hand)
  for i, c in ipairs(M.CHANNELS) do
    local p = h.props[c]
    if p then p.value = h.cur[i] end
  end
end

return M
