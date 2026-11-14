-- Test controller: drives the face module and a gentle head nod (button "Nod").
local Face = require('face')
local CFG_V = require('face_cfg_tq')
type St = {context: Context, face: Face.Face?, rot: Property<number>?, rest: number, nod: Property<number>?, t: number}
local function init(self: St, context: Context): boolean
 self.context = context
 local vm = context:viewModel()
 if vm == nil then return true end
 self.face = Face.new(vm, {{pre = 'tq_', cfg = CFG_V}}, '')
 self.rot = vm:getNumber('headRot'); self.nod = vm:getNumber('nod')
 local r = vm:getNumber('headRest'); if r then self.rest = r.value end
 return true
end
local function advance(self: St, seconds: number): boolean
 self.t += seconds
 local f = self.face
 if f then Face.update(f, seconds) end
 local n = 0.0
 local np = self.nod
 if np then n = np.value end
 local rp = self.rot
 if rp then rp.value = self.rest + n * 0.16 * math.sin(self.t * 2.4) end
 return true
end
return function(context: Context): Layout<St>
 return {context = context, face = nil, rot = nil, rest = 0, nod = nil, t = 0, init = init, advance = advance, draw = function(self: St, renderer: Renderer) end}
end
