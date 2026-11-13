--!strict
-- Hand test controller: shape buttons -> hand_pose (springs, cascade, idle) -> curl numbers of both hands.
-- Also moves the arms (bone rotations) so the attached hands are seen following the wrist bone.
local HandPose = require('hand_pose')

type St = {context: Context, vm: ViewModel?, hR: HandPose.Hand, hL: HandPose.Hand, n: {[string]: Property<number>},
  t: number, seqT: number, turnCur: number}

local SHAPES = HandPose.SHAPES
-- the 12 s demo sequence: shape index (0-based) and how long it is held
local SEQ: {{number}} = {{0, .8}, {4, .8}, {1, .8}, {3, 1.2}, {5, .7}, {6, .7}, {7, .7}, {8, .8}, {9, .8}, {10, .7},
  {11, 1.3}, {12, .45}, {13, .45}, {14, .45}, {15, .45}, {16, .7}, {0, .6}}
local GRIP: {[string]: number} = {gripSphere = 20, gripHandle = 15}

local function num(self: St, k: string, d: number): number
  local p = self.n[k]
  if p == nil then return d end
  return p.value
end
local function put(self: St, k: string, v: number)
  local p = self.n[k]
  if p then p.value = v end
end

local function init(self: St, context: Context): boolean
  self.context = context
  local vm = context:viewModel()
  if vm == nil then return true end
  self.vm = vm
  for _, k in ipairs({'shape', 'turn', 'move', 'seq', 'rate', 'shapeOut', 'armRSh', 'armREl', 'armRWr', 'armLSh', 'armLEl',
      'armLWr', 'propApple', 'propHandle', 'handRFlip', 'handLFlip', 'handRPalmSide', 'handLPalmSide'}) do
    local p = vm:getNumber(k)
    if p then self.n[k] = p end
  end
  HandPose.attach(self.hR, vm, 'handR')
  HandPose.attach(self.hL, vm, 'handL')
  return true
end

local function advance(self: St, seconds: number): boolean
  if self.vm == nil then init(self, self.context); if self.vm == nil then return true end end
  local rate = math.clamp(num(self, 'rate', 1), .1, 2)
  local dt = math.min(seconds, 1 / 20) * rate
  self.t += dt
  local si = math.floor(num(self, 'shape', 0) + .5)
  if num(self, 'seq', 0) > .5 then
    self.seqT += dt
    local total = 0.0
    for _, e in ipairs(SEQ) do total += e[2] end
    local u = self.seqT % total
    local acc = 0.0
    for _, e in ipairs(SEQ) do
      acc += e[2]
      if u < acc then si = e[1]; break end
    end
  else
    self.seqT = 0
  end
  put(self, 'shapeOut', si)
  local name = SHAPES[si + 1] or 'relaxed'
  local g = GRIP[name] or 0
  HandPose.setShape(self.hR, name, g)
  HandPose.setShape(self.hL, name, g)
  HandPose.update(self.hR, dt)
  HandPose.update(self.hL, dt)
  HandPose.write(self.hR)
  HandPose.write(self.hL)
  put(self, 'propApple', if name == 'gripSphere' then 1 else 0)
  put(self, 'propHandle', if name == 'gripHandle' then 1 else 0)

  -- turning over: the flip runs through zero (the hand goes edge-on and comes back mirrored)
  local turn = num(self, 'turn', 0)
  self.turnCur += (turn - self.turnCur) * math.min(1, dt * 14)
  local s = math.cos(math.pi * self.turnCur)
  local function edge(x: number): number
    if math.abs(x) < .06 then return if x < 0 then -.06 else .06 end
    return x
  end
  put(self, 'handRFlip', edge(s))
  put(self, 'handLFlip', edge(-s))
  local palm = if self.turnCur > .5 then 1 else 0
  put(self, 'handRPalmSide', palm)
  put(self, 'handLPalmSide', palm)

  -- arms: still, or a slow reach that shows the hands following the wrist bone
  local mv = num(self, 'move', 0)
  local a = mv * .35 * math.sin(self.t * 1.3)
  local b = mv * .45 * math.sin(self.t * 1.7 + 1)
  local c = mv * .5 * math.sin(self.t * 2.3 + 2)
  put(self, 'armRSh', .62 + a); put(self, 'armREl', -.62 + b); put(self, 'armRWr', c + HandPose.wrist(self.hR))
  put(self, 'armLSh', -.62 - a); put(self, 'armLEl', .62 - b); put(self, 'armLWr', -c - HandPose.wrist(self.hL))
  return true
end

return function(context: Context): Layout<St>
  return {context = context, vm = nil, hR = HandPose.new(0), hL = HandPose.new(2.3), n = {}, t = 0, seqT = 0, turnCur = 0,
    init = init, advance = advance, draw = function(self: St, renderer: Renderer) end}
end
