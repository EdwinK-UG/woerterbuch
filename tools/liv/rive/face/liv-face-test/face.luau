-- Liv face controller (Rive Luau module). Maps expression / look / blink / wink to the view-model numbers that the
-- face overlays from tools/liv/rive/face/face_tq.py are bound to.
--
--   local Face = require('face')            -- this module (ScriptAsset isModule="true", declared before its users)
--   local CFG = require('face_cfg')         -- generated per view by face_tq.luau_cfg()
--   self.face = Face.new(vm, CFG, '')       -- in init (vm = context:viewModel()); '' = property prefix
--   Face.update(self.face, dt)              -- in advance, every frame
--
-- Inputs (view-model numbers, all optional): expression 0..9 (happy, smile, neutral, laugh, surprised, sad, think, ouch,
-- effort, wink), expressionAmount 0..1, lookX / lookY -1..1 (+x = viewer's right, +y = up), blinkNow / winkNow (set to 1
-- to fire once; the module sets them back to 0), faceIdle (1 = micro-saccades and glances, default on), autoBlink
-- (1 = blink by itself, default on).
-- Blink: every 2.2 to 5.4 s, about 0.2 s (closing 70 ms, closed 30 ms, opening 100 ms), as the canvas engine.
-- Liv face controller (Rive Luau module). Maps expression / look / blink / wink to the view-model numbers that the
-- face overlays from tools/liv/rive/face/face_tq.py are bound to. One face state drives every view that has a face, so
-- blinks, saccades and expression blends stay in step when the rig cross-fades between views.
--
--   local Face = require('face')               -- this module (ScriptAsset isModule="true", declared before its users)
--   local CFG_TQ = require('face_cfg_tq')      -- generated per view by face_tq.luau_cfg()
--   self.face = Face.new(vm, {{pre='tq_', cfg=CFG_TQ}}, '')   -- in init; '' = prefix of the INPUT numbers
--   Face.update(self.face, dt)                 -- in advance, every frame
--
-- Inputs (view-model numbers with the input prefix, all optional): expression 0..9 (happy, smile, neutral, laugh,
-- surprised, sad, think, ouch, effort, wink), expressionAmount 0..1, lookX / lookY -1..1 (+x = viewer's right, +y = up),
-- blinkNow / winkNow (set to 1 to fire once; the module sets them back to 0), faceIdle (1 = micro-saccades and glances,
-- default on), autoBlink (1 = blink by itself, default on).
-- Outputs: per view, the numbers face_tq.emit_face bound (names after the view's prefix); a view without some part
-- (no far eye, no mouth) simply has no such numbers and they are skipped.
-- Blink: every 2.2 to 5.4 s, about 0.2 s (closing 70 ms, closed 30 ms, opening 100 ms), as the canvas engine.
export type FaceView = {pre: string, cfg: {[string]: number}}
type Out = {cfg: {[string]: number}, p: {[string]: Property<number>}}
export type Face = {
 outs: {Out}, inp: {[string]: Property<number>},
 cur: {[string]: number}, mop: {[string]: number},
 t: number, blinkT: number, blinkI: number, blinkU: number, winkU: number,
 sacT: number, sacI: number, sx: number, sy: number, gx: number, gy: number, gvx: number, gvy: number,
 mouth: string, popU: number,
}

-- channels (normalised): op = eyes open (1), wide 0..1, hN / hF = laughing closed eye (near / far), rN / rF = brow
-- raise (1 = full, negative lowers), iN / iF = brow inner end up (+) or down (-), gx / gy = gaze (+x right, +y up),
-- mx / my = mouth move (px), ms / mh = mouth width / height factor, mr = mouth turn (rad)
local CH = {'op','wide','hN','hF','rN','rF','iN','iF','gx','gy','mx','my','ms','mh','mr'}
local E: {{[string]: number}} = {
 {op=1,wide=0,hN=0,hF=0,rN=0,rF=0,iN=0,iF=0,gx=0,gy=0,mx=0,my=0,ms=1,mh=1,mr=0},                 -- 0 happy (rest): painted smile
 {op=.94,wide=0,hN=0,hF=0,rN=.1,rF=.1,iN=.05,iF=.05,gx=0,gy=0,mx=0,my=-1,ms=1.05,mh=1,mr=0},     -- 1 smile
 {op=1,wide=0,hN=0,hF=0,rN=0,rF=0,iN=0,iF=0,gx=0,gy=0,mx=0,my=-2,ms=.85,mh=1,mr=0},               -- 2 neutral: lips together, flat
 {op=1,wide=0,hN=1,hF=1,rN=.5,rF=.5,iN=0,iF=0,gx=0,gy=0,mx=0,my=2,ms=1,mh=1,mr=0},                -- 3 laugh
 {op=1,wide=1,hN=0,hF=0,rN=1.2,rF=1.2,iN=.1,iF=.1,gx=0,gy=0,mx=0,my=2,ms=.82,mh=.82,mr=0},        -- 4 surprised
 {op=.75,wide=0,hN=0,hF=0,rN=.2,rF=.2,iN=.9,iF=.9,gx=0,gy=-.75,mx=0,my=4,ms=.8,mh=.9,mr=0},       -- 5 sad
 {op=1,wide=0,hN=0,hF=0,rN=1,rF=-.3,iN=0,iF=0,gx=-.75,gy=.85,mx=4,my=-2,ms=.55,mh=1,mr=.1},       -- 6 think: up and aside
 {op=.55,wide=0,hN=0,hF=0,rN=.6,rF=.6,iN=.8,iF=.8,gx=0,gy=0,mx=0,my=3,ms=.92,mh=.95,mr=0},        -- 7 ouch
 {op=.8,wide=0,hN=0,hF=0,rN=-.3,rF=-.3,iN=-.7,iF=-.7,gx=0,gy=0,mx=0,my=1,ms=.95,mh=.6,mr=0},      -- 8 effort
 {op=1,wide=0,hN=1,hF=0,rN=-.15,rF=.4,iN=0,iF=0,gx=0,gy=0,mx=0,my=2,ms=.78,mh=.72,mr=-.04},       -- 9 wink (near eye)
}
-- mouth per expression (names match the overlays: mo_<name>)
local MOUTH: {string} = {'painted','0','1','8','5','0f','1','4f','4f','8'}
local MOUTHS: {string} = {'painted','0','1','2','3','4','5','6','7','8','0f','4f'}
local GAPS: {number} = {2.6,4.1,3.3,5.4,2.9,3.8,2.2,4.6}
-- idle eye movement: small saccades (gaze units) with an occasional longer glance
local SAC: {{number}} = {{.9,.10,.04},{1.7,-.06,-.03},{1.1,.04,.07},{2.4,-.55,.12},{.8,0,0},{1.5,.08,-.06},{2.1,-.03,.03},{1.2,.35,-.1},{.9,0,.02}}

local function smooth(t:number):number t=math.clamp(t,0,1);return t*t*(3-2*t) end
local function lerp(a:number,b:number,t:number):number return a+(b-a)*t end
local function get(t:{[string]:number},k:string,d:number):number local v=t[k];if v==nil then return d end;return v end

local M = {}

function M.new(vm:ViewModel,views:{FaceView},inPre:string):Face
 local f:Face={outs={},inp={},cur={},mop={},t=0,blinkT=0,blinkI=1,blinkU=-1,winkU=-1,
  sacT=0,sacI=1,sx=0,sy=0,gx=0,gy=0,gvx=0,gvy=0,mouth='painted',popU=1}
 local names={'mouth_x','mouth_y','mouth_r','mouth_sx','mouth_sy','browN_x','browN_y','browN_r','browF_x','browF_y','browF_r'}
 for _,en in ipairs({'N','F'}) do
  for _,k in ipairs({'eye%s_sx','eye%s_sy','lid%s_y','iris%s_x','iris%s_y','iris%s_s','happy%s','closed%s'}) do table.insert(names,string.format(k,en)) end
 end
 for _,m in ipairs(MOUTHS) do table.insert(names,'mo_'..m) end
 for _,v in ipairs(views) do
  local o:Out={cfg=v.cfg,p={}}
  for _,k in ipairs(names) do local p=vm:getNumber(v.pre..k);if p then o.p[k]=p end end
  table.insert(f.outs,o)
 end
 for _,k in ipairs({'expression','expressionAmount','lookX','lookY','blinkNow','winkNow','faceIdle','autoBlink'}) do
  local p=vm:getNumber(inPre..k);if p then f.inp[k]=p end
 end
 for _,k in ipairs(CH) do f.cur[k]=get(E[1],k,0) end
 for _,m in ipairs(MOUTHS) do f.mop[m]=if m=='painted' then 1 else 0 end
 return f
end

local function put(o:Out,k:string,v:number) local p=o.p[k];if p then p.value=v end end
local function inp(f:Face,k:string,d:number):number local p=f.inp[k];if p==nil then return d end;return p.value end

function M.update(f:Face,dt:number)
 dt=math.clamp(dt,0,1/15);f.t+=dt
 local ei=math.clamp(math.floor(inp(f,'expression',0)+.5),0,#E-1)+1
 local amt=math.clamp(inp(f,'expressionAmount',1),0,1)
 -- targets: rest (happy) blended toward the chosen expression; channels follow in about 0.2 s
 local k=1-math.exp(-dt*15)
 for _,c in ipairs(CH) do
  local tg=lerp(get(E[1],c,0),get(E[ei],c,0),amt)
  f.cur[c]=lerp(f.cur[c] or tg,tg,k)
 end
 local cu=f.cur
 -- mouth: a two-frame dissolve (in 0.05 s, out 0.07 s) inside a short squash, so a change reads as one mouth moving
 local want=if amt>=.5 then MOUTH[ei] else 'painted'
 if want~=f.mouth then f.mouth=want;f.popU=0 end
 f.popU=math.min(1,f.popU+dt/.18)
 for _,m in ipairs(MOUTHS) do
  local o=f.mop[m] or 0
  local tgt=if m==want then 1 else 0
  if o<tgt then o=math.min(tgt,o+dt/.05) else o=math.max(tgt,o-dt/.07) end
  f.mop[m]=o
 end
 local pop=1-.22*math.sin(math.pi*f.popU)

 -- gaze: user look + expression gaze + idle saccades (fast, critically damped)
 if inp(f,'faceIdle',1)>.5 then
  f.sacT+=dt
  local s=SAC[f.sacI]
  if f.sacT>=s[1] then f.sacT=0;f.sacI=(f.sacI % #SAC)+1;local n=SAC[f.sacI];f.sx=n[2];f.sy=n[3] end
 else f.sx=0;f.sy=0 end
 local tx=math.clamp(inp(f,'lookX',0)+cu.gx+f.sx,-1,1)
 local ty=math.clamp(inp(f,'lookY',0)+cu.gy+f.sy,-1,1)
 local w=38.0
 f.gvx+=(w*w*(tx-f.gx)-2*w*f.gvx)*dt;f.gx+=f.gvx*dt
 f.gvy+=(w*w*(ty-f.gy)-2*w*f.gvy)*dt;f.gy+=f.gvy*dt

 -- blink (auto and on request) and wink (near eye, on request)
 if inp(f,'blinkNow',0)>.5 then local p=f.inp['blinkNow'];if p then p.value=0 end;f.blinkU=0 end
 if inp(f,'winkNow',0)>.5 then local p=f.inp['winkNow'];if p then p.value=0 end;f.winkU=0 end
 f.blinkT+=dt
 if f.blinkU<0 and f.blinkT>=GAPS[f.blinkI] then if inp(f,'autoBlink',1)>.5 then f.blinkU=0 else f.blinkT=0 end end
 local b=0.0
 if f.blinkU>=0 then
  local u=f.blinkU
  if u<.07 then b=smooth(u/.07) elseif u<.1 then b=1 elseif u<.2 then b=1-smooth((u-.1)/.1) end
  f.blinkU+=dt
  if f.blinkU>=.2 then f.blinkU=-1;f.blinkT=0;f.blinkI=(f.blinkI % #GAPS)+1 end
 end
 local wk=0.0
 if f.winkU>=0 then
  local u=f.winkU
  wk=if u<.09 then smooth(u/.09) elseif u<.4 then 1 else 1-smooth((u-.4)/.14)
  f.winkU+=dt;if f.winkU>=.54 then f.winkU=-1 end
 end
 local down=math.max(0,-f.gy)                 -- looking down lowers the lids a little
 local wd=math.clamp(cu.wide,0,1)

 -- outputs, per view (pixel ranges from that view's cfg)
 for _,o in ipairs(f.outs) do
  local C=o.cfg
  for _,m in ipairs(MOUTHS) do put(o,'mo_'..m,f.mop[m] or 0) end
  local mp=get(C,'mouth_px',1)
  put(o,'mouth_x',cu.mx*mp*get(C,'mouth_xk',1));put(o,'mouth_y',cu.my*mp);put(o,'mouth_r',cu.mr)
  put(o,'mouth_sx',cu.ms*(1+.05*(1-pop)));put(o,'mouth_sy',cu.mh*pop)
  -- brows: raise moves up; inner end up turns the brow (near brow: inner end on the right; far brow: on the left)
  local br=get(C,'brow_raise',9);local rot=get(C,'brow_rot',.2);local fs=get(C,'brow_far_scale',.85)
  put(o,'browN_y',-cu.rN*br);put(o,'browN_r',-cu.iN*rot);put(o,'browN_x',cu.iN*.6)
  put(o,'browF_y',-cu.rF*br*fs);put(o,'browF_r',cu.iF*rot*.8);put(o,'browF_x',-cu.iF*.4)
  for _,en in ipairs({'N','F'}) do
   if get(C,'has'..en,0)<.5 then continue end
   local h=math.clamp(if en=='N' then math.max(cu.hN,wk) else cu.hF,0,1)
   local op=math.clamp(cu.op,0,1)*(1-b)*(1-.85*smooth(h/.7))
   op=math.min(op,1-.18*down)
   -- the lid stops three quarters down: below that the closed patch has taken over (and the lash's outer corner
   -- would leave the eye's frame)
   put(o,'lid'..en..'_y',math.min(1-op,.75)*get(C,'lid'..en..'_travel',30))
   put(o,'closed'..en,smooth((.32-op)/.24)*(1-smooth(h/.5)));put(o,'happy'..en,smooth((h-.35)/.2))
   put(o,'eye'..en..'_sx',1+(get(C,'wide_sx',1.05)-1)*wd);put(o,'eye'..en..'_sy',1+(get(C,'wide_sy',1.09)-1)*wd)
   put(o,'iris'..en..'_s',1+(get(C,'iris_wide',.86)-1)*wd)
   local ix=if f.gx<0 then -f.gx*get(C,'iris'..en..'_xl',-5) else f.gx*get(C,'iris'..en..'_xr',2)
   local iy=if f.gy>0 then f.gy*get(C,'iris'..en..'_yu',-2) else -f.gy*get(C,'iris'..en..'_yd',2)
   put(o,'iris'..en..'_x',ix);put(o,'iris'..en..'_y',iy)
  end
 end
end

return M
