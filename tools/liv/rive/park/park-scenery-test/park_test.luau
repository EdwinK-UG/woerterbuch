-- Test controller for the park scenery: parX<i> = -camX * 400 * m<i> (tools/liv/rive/park/scenery.py, layers.json).
-- A pure function of the view-model number camX: nothing here keeps time.
type St = {context: Context, vm: ViewModel?, cam: Property<number>?, out: {{p: Property<number>, m: number}}}
local NAMES: {string} = {'parX0','parX1','parX2','parX3','parX4','parX5','parX6','parX7'}
local MS: {number} = {0.12,0.9421148,0.95703,0.9755637,0.9863883,0.9981146,1.010123,1.0165781}
local function init(self: St, context: Context): boolean
 self.context = context
 local vm = context:viewModel(); if vm == nil then return true end
 self.vm = vm; self.cam = vm:getNumber('camX')
 for i, n in ipairs(NAMES) do local p = vm:getNumber(n); if p then table.insert(self.out, {p = p, m = MS[i]}) end end
 return true
end
local function advance(self: St, seconds: number): boolean
 if self.vm == nil then init(self, self.context); if self.vm == nil then return true end end
 local c = if self.cam then self.cam.value else 0
 for _, o in ipairs(self.out) do o.p.value = -c * 400 * o.m end
 return true
end
return function(context: Context): Layout<St>
 return {context = context, vm = nil, cam = nil, out = {}, init = init, advance = advance, draw = function(self: St, renderer: Renderer) end}
end
