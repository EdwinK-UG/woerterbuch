-- Liv controller (generated into liv/liv.luau by tools/liv/rive/build_liv.py).
-- It only sets view-model numbers: IK targets, spine/head rotation, hand shapes, cloth springs, view opacities.
-- The native rig (bones, IK, sleeve constraints) does the rest. Units: view pixels of the 1024 x 1536 art, 996 px = 1 m.
--
-- One body, several views. The body is described once, in the ground plane and in body space (metres):
--   * ground: u forward, w to her left. Feet are planted in WORLD coordinates (u, w) and never move while they are on the
--     ground; she walks along u and the ground markers slide past.
--   * body space: X to her left, Y up, Z forward, relative to the standing pelvis (hand targets of a pose).
-- A view is a projection with a yaw (0 front, 43 three-quarter, 90 side, 137 three-quarter back, 180 back):
--   screen x = (X cos yaw + Z sin yaw), depth toward the viewer = (Z cos yaw - X sin yaw).
-- Every view has its own rig (art + bones + IK) in the same artboard. `yaw` turns toward the target of the `view`
-- number (0..4); the two views around the current yaw cross-fade, the others are hidden and not computed.
local Face = require('face')
local HandPose = require('hand_pose')
local Actions = require('actions')              -- [liv-actions] the action library (actions.luau, docs/liv-actions.md)
local FACE_CFG_FRONT = require('face_cfg_front')
local FACE_CFG_TQ = require('face_cfg_tq')
local FACE_CFG_SIDE = require('face_cfg_side')

type Foot = {u: number, w: number, fu: number, fw: number, planted: boolean, ph: number}
type View = {name: string, yaw: number, aR: boolean, farB: boolean, c: {[string]: number}, rest: {[string]: number}}
type St = {context: Context, vm: ViewModel?, n: {[string]: Property<number>}, cur: {[string]: number}, vel: {[string]: number},
  t: number, v: number, s: number, phi: number, frozen: boolean, rw: number, gw: number,
  fR: Foot, fL: Foot, yaw: number, yawV: number, flip: number, flipV: number, turnF: number,
  hands: {[string]: any}, face: Face.Face?, blinkT: number, blinkI: number, sx: {[string]: number}, sv: {[string]: number}, ready: boolean, prev: {[string]: number},
  act: Actions.State}                           -- [liv-actions] action layers, props

local VIEWS: {View} = {
 {name='front',yaw=0,aR=true,farB=true,
  c={oxg=511.5,oyg=1420.5,pelx=513,pely=912,legmax=383.2845912,hipdy=18,hipAx=-87.6,hipBx=79.7,lat0=0.09588353414,footWA=1.570796327,footWB=1.570796327,ffbias=1,shAx=-99,shAy=-377,shAx0=414,shAy0=535,wAx=223.8152155,wAy=732.2471664,L1A=149.0023385,L2A=125,bdA=2.340523722,shBx=97,shBy=-377,shBx0=610,shBy0=535,wBx=799.8318433,wBy=732.5854017,L1B=149.0004016,L2B=125,bdB=0.8043497235},
  rest={spineRot=-1.570796327,headRot=0,hairRot=-3.141592654,skirtRot=1.570796327,skirtLRot=1.712961742,skirtRRot=1.434270751,apron1Rot=1.570796327,apron2Rot=0,satchelRot=1.570796327,handARot=4.440892099e-16,slvA0Rot=0,slvA1Rot=0,slvA2Rot=0,slvA3Rot=0,slvA4Rot=0,slvA5Rot=0,handBRot=-4.440892099e-16,slvB0Rot=0,slvB1Rot=0,slvB2Rot=0,slvB3Rot=0,slvB4Rot=0,slvB5Rot=0,headPX=451,headPY=-2.761578532e-14}},
 {name='tq',yaw=43,aR=true,farB=true,
  c={oxg=488,oyg=1411.5,pelx=510,pely=912,legmax=380.6052173,hipdy=18,hipAx=-58,hipBx=56,lat0=0.11943523,footWA=0.8523306928,footWB=0.8523306928,ffbias=0,shAx=-70,shAy=-374,shAx0=440,shAy0=538,wAx=256.716103,wAy=741.6754982,L1A=149.0023338,L2A=125,bdA=2.300992833,shBx=55,shBy=-367,shBx0=565,shBy0=545,wBx=762.8976189,wBy=734.5060514,L1B=149.0000372,L2B=125,bdB=0.7634181336},
  rest={spineRot=-1.584431845,headRot=0.02733329187,hairRot=-3.091547114,skirtRot=1.570796327,skirtLRot=1.844963778,skirtRRot=1.267911458,apron1Rot=1.570796327,apron2Rot=0,satchelRot=1.570796327,handARot=4.440892099e-16,slvA0Rot=0,slvA1Rot=0,slvA2Rot=0,slvA3Rot=0,slvA4Rot=0,slvA5Rot=0,handBRot=4.440892099e-16,slvB0Rot=0,slvB1Rot=0,slvB2Rot=0,slvB3Rot=0,slvB4Rot=0,slvB5Rot=0,slvFillB=0,headPX=440.0409072,headPY=4.440892099e-14}},
 {name='side',yaw=90,aR=true,farB=true,
  c={oxg=480.5,oyg=1417,pelx=505,pely=912,legmax=388.05,hipdy=22.873865,hipAx=-77.11698744,hipBx=72.15140464,lat0=0.13,footWA=0.6624262938,footWB=0.6624262938,ffbias=0,shAx=-9,shAy=-383,shAx0=496,shAy0=529,wAx=309.7512354,wAy=743.4000926,L1A=149.0000067,L2A=135,bdA=2.286188066,shBx=28.80745031,shBy=-383,shBx0=533.8074503,shBy0=529,wBx=711.3157894,wBy=740.3453352,L1B=149.0002052,L2B=127,bdB=0.8729604558},
  rest={spineRot=-1.545858187,headRot=-0.02493813961,hairRot=-2.624897515,skirtRot=1.55992719,skirtLRot=1.687451762,skirtRRot=1.432619982,apron1Rot=1.39216532,apron2Rot=-0.016760548,satchelRot=1.570796327,bow1Rot=2.296436664,handARot=0,slvA0Rot=0,slvA1Rot=0,slvA2Rot=0,slvA3Rot=0,slvA4Rot=0,slvA5Rot=0,handBRot=4.440892099e-16,slvB0Rot=0,slvB1Rot=0,slvB2Rot=0,slvB3Rot=0,slvB4Rot=0,slvB5Rot=0,headPX=441.1371669,headPY=-2.131628207e-14}},
 {name='tqb',yaw=137,aR=false,farB=false,
  c={oxg=465.5,oyg=1414.5,pelx=500,pely=912,legmax=388.05,hipdy=2.417016382,hipAx=-70.83640145,hipBx=18.41315008,lat0=0.1009021771,footWA=0.8523306928,footWB=0.8523306928,ffbias=0,shAx=-58,shAy=-378,shAx0=442,shAy0=534,wAx=269.8329369,wAy=734.137643,L1A=149.0019253,L2A=115,bdA=2.283421595,shBx=34,shBy=-368,shBx0=534,shBy0=544,wBx=727.8304346,wBy=748.8339318,L1B=149.0106606,L2B=133,bdB=0.8186334512},
  rest={spineRot=-1.566312052,headRot=-0.004484274875,hairRot=-3.079173844,skirtRot=1.62991738,skirtLRot=1.685649135,skirtRRot=1.574558065,satchelRot=1.570796327,bow1Rot=2.289626326,bow2Rot=1.642103792,handARot=-8.881784197e-16,slvA0Rot=0,slvA1Rot=0,slvA2Rot=0,slvA3Rot=0,slvA4Rot=0,slvA5Rot=0,handBRot=0,slvB0Rot=0,slvB1Rot=0,slvB2Rot=0,slvB3Rot=0,slvB4Rot=0,slvB5Rot=0,headPX=446.0044843,headPY=-1.576516695e-14}},
 {name='back',yaw=180,aR=false,farB=true,
  c={oxg=511,oyg=1419,pelx=512,pely=912,legmax=381.3650651,hipdy=18,hipAx=-83.4,hipBx=82.6,lat0=0.09337349398,footWA=1.570796327,footWB=1.570796327,ffbias=1,shAx=-97,shAy=-379,shAx0=415,shAy0=533,wAx=227.5456573,wAy=732.8443679,L1A=149.0030268,L2A=125,bdA=2.327122321,shBx=96,shBy=-379,shBx0=608,shBy0=533,wBx=796.4609161,wBy=731.893433,L1B=149.0003845,L2B=125,bdB=0.8112880548},
  rest={spineRot=-1.570796327,headRot=0,hairRot=-3.141592654,skirtRot=1.570796327,skirtLRot=1.71128857,skirtRRot=1.431256048,satchelRot=1.570796327,bow1Rot=1.760166377,bow2Rot=1.384834441,handARot=4.440892099e-16,slvA0Rot=0,slvA1Rot=0,slvA2Rot=0,slvA3Rot=0,slvA4Rot=0,slvA5Rot=0,handBRot=4.440892099e-16,slvB0Rot=0,slvB1Rot=0,slvB2Rot=0,slvB3Rot=0,slvB4Rot=0,slvB5Rot=0,headPX=448,headPY=-2.74320883e-14}}
}
-- hand shapes by number (poses use these): the names of hands/hand_pose.luau
local HP = {'relaxed','open','flat','wave','fist','point','thumbsUp','pinch','gripSphere','gripHandle','carry','beckon','count1','count2','count3','count4','count5'}
local PALMY: {[string]: number} = {open=1,flat=1,wave=1,beckon=1,count1=1,count2=1,count3=1,count4=1,count5=1}   -- shapes shown palm-first when she faces the viewer
-- Poses: hand targets in body space (X left, Y up, Z forward, metres, relative to the standing pelvis); shapeR / shapeL
-- 1 relaxed 2 palm 3 fist 4 point 5 thumb 6 back of hand; pelDY pelvis offset (m, up); lean / headR in radians (+ forward);
-- dRu / dRup / dLu / dLup lift a foot (forward m, up m); ff 1 puts the far arm in front of the torso; bind 1 = the art's pose
local POSES: {{[string]: number}} = {
 {hRX=-.10,hRY=.106,hRZ=-.02,hLX=.10,hLY=.122,hLZ=.12},                                                  -- 0 Rest: arms hang
 {hRX=-.43,hRY=.596,hRZ=.14,hLX=.10,hLY=.122,hLZ=.12,shapeR=4,lean=-.03},                                   -- 1 Wave
 {hRX=-.513,hRY=.313,hRZ=.05,hLX=.384,hLY=.263,hLZ=0,shapeR=6,lean=.04,headR=.04},                           -- 2 Reach
 {hRX=-.291,hRY=.6225,hRZ=-.04,hLX=.302,hLY=.6225,hLZ=-.04,shapeR=2,shapeL=2,pelDY=.016,headR=-.03},               -- 3 Cheer
 {hRX=-.154,hRY=-.018,hRZ=0,hLX=.14,hLY=-.018,hLZ=0,pelDY=-.092,pelDZ=-.06,ff=1,lean=.2,headR=-.13},                    -- 4 Crouch
 {hRX=-.178,hRY=.1225,hRZ=0,hLX=.178,hLY=.112,hLZ=0,dRu=.0766,dRup=.0905,ff=1,lean=.05},                     -- 5 Step
 {hRX=-.247,hRY=.4438,hRZ=0,hLX=.2636,hLY=.4438,hLZ=0,shapeR=5,shapeL=7,ff=1,lean=-.04},                     -- 6 Hands
 {bind=1}                                                                                                     -- 7 Bind: the art as drawn
}
local PPM=996.0
local KD=.07                                  -- how much of the depth axis shows on the ground (camera nearly level)
local ANKLE=.098
local YAWS={0.0,43.0,90.0,137.0,180.0}        -- yaw of the five `view` values

local function smooth(t:number):number t=math.clamp(t,0,1);return t*t*(3-2*t) end
local function lerp(a:number,b:number,t:number):number return a+(b-a)*t end
-- steps per second: a child with 0.39 m legs steps about 2.9 times a second at 0.9 m/s (cadence ~ 1 / sqrt(leg length))
local function cadence(v:number):number return 1.9+1.0*math.min(v,.9)/.9+math.max(0,v-.9)*.45 end
local function stanceOf(v:number):number return .62-.26*smooth((v-.9)/1.1) end                        -- share of the stride on the ground
local function newFoot(u:number,w:number,ph:number):Foot return {u=u,w=w,fu=u,fw=w,planted=true,ph=ph} end

local CH={'hRX','hRY','hRZ','hLX','hLY','hLZ','pelDY','pelDZ','lean','headR','dRu','dRup','dLu','dLup','ff'}
local function init(self:St,context:Context):boolean
 self.context=context
 local vm=context:viewModel();if vm==nil then return true end
 self.vm=vm
 local function grab(k:string) local p=vm:getNumber(k);if p then self.n[k]=p end end
 for _,k in ipairs({'pose','rate','gait','view','mirror','yawOut','flipX','speedOut','sOut','phaseOut'}) do grab(k) end
 for i=0,7 do grab('mX'..i);grab('mY'..i) end
 for _,vw in ipairs(VIEWS) do
  local pre=vw.name..'_'
  for k,_ in pairs(vw.rest) do grab(pre..k) end
  for _,k in ipairs({'opacity','pelvisX','pelvisY','front','back','blink','legAScale','legBScale','legAScaleInv','legBScaleInv','plA','plB','cAX','cAY','cBX','cBY'}) do grab(pre..k) end
  for _,sd in ipairs({'A','B'}) do
   grab(pre..'hand'..sd..'X');grab(pre..'hand'..sd..'Y');grab(pre..'foot'..sd..'X');grab(pre..'foot'..sd..'Y');grab(pre..'foot'..sd..'Rot')
  end
 end
 -- [liv-actions] begin: action inputs and read-outs, props, face inputs the actions drive, per-view prop and head numbers
 for _,k in ipairs({'action','actionT','prop','propApple','propCrate','propSaw','flyOp','expression','lookX','lookY'}) do grab(k) end
 for _,vw in ipairs(VIEWS) do for _,k in ipairs({'crateX','crateY','crateSX','flyX','flyY','flyS','headPX','headPY'}) do grab(vw.name..'_'..k) end end
 do local bn:{string}={};for _,vw in ipairs(VIEWS) do table.insert(bn,vw.name..'_ikInvA');table.insert(bn,vw.name..'_ikInvB');table.insert(bn,vw.name..'_legInvA') end;Actions.attach(self.act,vm,bn) end
 -- [liv-actions] end
 self.face=Face.new(vm, {{pre = 'front_', cfg = FACE_CFG_FRONT}, {pre = 'tq_', cfg = FACE_CFG_TQ}, {pre = 'side_', cfg = FACE_CFG_SIDE}}, '')
 for vi2,vw in ipairs(VIEWS) do                                   -- one painted hand per side (and the far arm's copy in front) per view
  local pre=vw.name..'_'
  for sdi,sd in ipairs({'A','B'}) do
   for _,key in ipairs({sd,sd..'F'}) do
    local h=HandPose.new((vi2*3+sdi)*1.37)
    HandPose.attach(h,vm,pre..'hand'..key)
    self.hands[pre..key]=h
   end
  end
 end
 -- start in the Rest pose, not in the drawn A-pose
 local r0:{[string]:number}=POSES[1]
 for _,k in ipairs(CH) do self.cur[k]=r0[k] or 0;self.vel[k]=0 end
 return true
end

local function advance(self:St,seconds:number):boolean
 if self.vm==nil then init(self,self.context);if self.vm==nil then return true end end
 local function nv(k:string,d:number):number local p=self.n[k];if p==nil then return d end;return p.value end
 local function put(k:string,v:number) local p=self.n[k];if p then p.value=v end end
 local rate=math.clamp(nv('rate',1),.1,2)      -- time scale: 0.25 plays everything at quarter speed
 local dt=math.min(seconds,1/20)*rate;self.t+=dt
 local fc=self.face;if fc then Face.update(fc,dt) end
 local pi=math.floor(nv('pose',0)+.5)
 local mode=math.floor(nv('gait',0)+.5)         -- 0 stand, 1 walk, 2 run
 local P:{[string]:number}=POSES[pi+1] or POSES[1]
 local function pqd(k:string,d:number):number local x=P[k] :: number?;if x~=nil then return x end;return d end

 -- ------------------------------------------------------------------ the turn (yaw) and the mirror
 local vi=math.clamp(math.floor(nv('view',1)+.5),0,4)
 local yt=YAWS[vi+1]
 self.yawV+=(42*(yt-self.yaw)-2*6.5*self.yawV)*dt;self.yaw+=self.yawV*dt
 self.yaw=math.clamp(self.yaw,0,180)
 local mt=if nv('mirror',0)>.5 then -1.0 else 1.0
 self.flipV+=(150*(mt-self.flip)-2*12*self.flipV)*dt;self.flip+=self.flipV*dt
 local yaw=self.yaw
 -- the two views around the yaw, and how far we are from one to the other
 local nviews=#VIEWS;local lo=1;local hi=1;local f=0.0
 if yaw<=VIEWS[1].yaw then lo=1;hi=1 elseif yaw>=VIEWS[nviews].yaw then lo=nviews;hi=nviews else
  for i=1,nviews-1 do
   if yaw>=VIEWS[i].yaw and yaw<=VIEWS[i+1].yaw then lo=i;hi=i+1;f=(yaw-VIEWS[i].yaw)/(VIEWS[i+1].yaw-VIEWS[i].yaw) end
  end
 end
 local sf=smooth(f)
 put('yawOut',yaw);put('flipX',self.flip*(1-.24*math.sin(math.pi*sf)))
 local yr=math.rad(yaw);local ycs=math.cos(yr);local ysn=math.sin(yr)

 -- ------------------------------------------------------------------ gait (shared): phase, speed, feet in the world
 local tv=if mode==1 then .9 elseif mode==2 then 2.5 else 0
 local acc=if mode==2 or self.v>1.0 then .85 else .75
 if tv>self.v then self.v=math.min(tv,self.v+acc*dt) else self.v=math.max(tv,self.v-acc*dt) end
 local v=self.v
 local active=(mode>0) or (not self.frozen)
 local sg=stanceOf(v);local nu=cadence(v);local T=2/nu
 local rwT=smooth((v-1.2)/.8)
 self.rw+=(rwT-self.rw)*math.min(1,dt*8)
 local rw=self.rw
 if mode>0 then self.frozen=false end
 if active then
  -- she stops when both feet are on the ground and she has almost no speed left
  if mode==0 and v<.07 and self.fR.planted and self.fL.planted then self.frozen=true end
  if not self.frozen then
   self.phi+=dt*nu/2;if self.phi>=1 then self.phi-=1 end
   self.s+=v*dt
  end
 end
 self.gw+=((if active then 1 else 0)-self.gw)*math.min(1,dt*(if active then 10 else 6))
 local gw=self.gw
 local lat0=VIEWS[lo].c.lat0
 local lat=lerp(lat0,lat0*.75,smooth(v/.9))
 local lead=v*sg*T*.5
 local Hs=lerp(.05,.17,rw)
 local function stepFoot(F:Foot,ph:number,sgn:number)
  if ph<F.ph and not F.planted then F.planted=true end    -- heel strike: the foot stays where it is
  F.ph=ph
  if ph<sg then
   F.planted=true
  else
   if F.planted then F.planted=false;F.fu=F.u;F.fw=F.w end     -- toe-off
   local sp=(ph-sg)/(1-sg)
   local landS=self.s+v*(1-sg)*T*(1-sp)+lead
   local e=sp-math.sin(2*math.pi*sp)/(2*math.pi)
   F.u=F.fu+(landS-F.fu)*e;F.w=F.fw+(-sgn*lat-F.fw)*e
  end
 end
 if not self.frozen and active then
  stepFoot(self.fR,self.phi,1);stepFoot(self.fL,(self.phi+.5)%1,-1)
 end
 -- pose layer: springs on body-space channels (shared by all views)
 local function track(k:string,target:number,wk:number,zeta:number)
  local c=self.cur[k] or target;local vel=self.vel[k] or 0
  vel+=(wk*wk*(target-c)-2*zeta*wk*vel)*dt;c+=vel*dt
  self.cur[k]=c;self.vel[k]=vel
 end
 local wk=13.0
 for _,k in ipairs(CH) do
  local target=pqd(k,0)
  if k=='pelDY' then target+=.0016*math.sin(self.t*2*math.pi/3.8) end
  local zeta=1.0
  if string.sub(k,1,1)=='h' and string.sub(k,2,2)~='e' and k~='headR' then zeta=.78 end
  local w=wk
  if pi==1 and (k=='hRX' or k=='hRY') then                                   -- the wave
   local ph=math.sin(self.t*2*math.pi*2.3)
   if k=='hRX' then target+=.024*ph else target-=.007*math.abs(ph) end
   w=wk*1.7
  end
  if k=='ff' then w=30 end
  track(k,target,w,zeta)
 end
 local cur=self.cur
 -- [liv-actions] begin: play the requested action (layers, blends, expression, props); per-view parts are applied below
 local act=self.act
 Actions.frame(act,dt,nv,put,gw)
 -- [liv-actions] end
 -- hand shapes: a quick cross-fade (the shape weights are channels of their own)
 -- blink for the views without the expression rig (front, side): every 2.2 to 5.4 s, about 0.2 s; the face rig has its own
 local blink=0.0
 do
  local GAPS={2.6,4.1,3.3,5.4,2.9,3.8,2.2,4.6}
  self.blinkT+=dt
  local u=self.blinkT-GAPS[self.blinkI]
  if u>=0 then
   if u>=.2 then self.blinkT=0;self.blinkI=(self.blinkI % #GAPS)+1
   elseif u<.07 then blink=smooth(u/.07) elseif u<.1 then blink=1.0 else blink=1-smooth((u-.1)/.1) end
  end
 end
 -- cloth drivers shared by the views (forward push and sway of the pelvis come from the gait numbers)
 local accW=0.0;do
  local pvv=self.prev['v'] or v
  accW=math.clamp((v-pvv)/math.max(dt,.0005),-4,4)*PPM*.35;self.prev['v']=v
 end

 -- ------------------------------------------------------------------ render the views that show
 for vi2,vw in ipairs(VIEWS) do
  local op=0.0
  -- a turn: the views switch at the middle of the turn (both whole, never half-transparent: a group's opacity is applied to each
  -- picture on its own, so a fading figure shows its own layers through each other) with a squash of the whole figure
  if lo==hi then op=if vi2==lo then 1 else 0 elseif vi2==lo then op=if sf<.5 then 1 else 0 elseif vi2==hi then op=if sf>=.5 then 1 else 0 end
  local pre=vw.name..'_'
  put(pre..'opacity',op);put(pre..'blink',blink)
  if op<.003 then continue end
  local c=vw.c
  local th=math.rad(vw.yaw);local cs=math.cos(th);local sn=math.sin(th)
  local OXG=c.oxg;local OYG=c.oyg
  local liftK=lerp(.45,1,smooth(sn/.6))                  -- a lifted foot in front or back view: the leg shortens instead of the foot rising high
  local sideR=if vw.aR then 'A' else 'B'                       -- the image slot of her right limbs
  -- ankle on screen, with the heel / ball rocker of a planted foot and the lift of a swinging one
  local function ankle(F:Foot,ph:number):(number,number,number)
   local pitch=0.0;local dfwd=0.0;local dup=0.0
   if F.planted and ph<sg then
    local u=ph/sg
    local pw=if u<.16 then .26*(1-smooth(u/.16)) elseif u<.55 then 0.0 else -.62*smooth((u-.55)/.45)
    local pr=if u<.25 then .06*(1-smooth(u/.25)) elseif u<.58 then 0.0 else -.8*smooth((u-.58)/.42)
    pitch=lerp(pw,pr,rw)*smooth(v/.3)
    if pitch>=0 then
     dfwd=-.07+(.07*math.cos(pitch)-ANKLE*math.sin(pitch));dup=.07*math.sin(pitch)+ANKLE*math.cos(pitch)-ANKLE
    else
     dfwd=.10+(-.10*math.cos(pitch)-ANKLE*math.sin(pitch));dup=-.10*math.sin(pitch)+ANKLE*math.cos(pitch)-ANKLE
    end
   else
    local sp=math.clamp((ph-sg)/(1-sg),0,1)
    local p0=lerp(-.62,-.8,rw)
    pitch=if sp<.5 then lerp(p0,.05,smooth(sp/.5)) else lerp(.05,lerp(.26,.06,rw),smooth((sp-.5)/.5))
    dup=Hs*liftK*smooth(v/.25)*(math.sin(math.pi*sp^.85))^2
   end
   local du=F.u-self.s
   local X=OXG+(du*sn+F.w*cs+dfwd*sn)*PPM
   local Y=OYG+(du*cs-F.w*sn+dfwd*cs)*PPM*KD-(ANKLE+dup)*PPM
   return X,Y,pitch
  end
  local phR=self.phi;local phL=(self.phi+.5)%1
  local axR,ayR,pitR=ankle(self.fR,phR);local axL,ayL,pitL=ankle(self.fL,phL)
  -- a foot lifted by the pose (Step)
  axR+=cur.dRu*sn*PPM;ayR+=cur.dRu*cs*KD*PPM-cur.dRup*PPM
  axL+=cur.dLu*sn*PPM;ayL+=cur.dLu*cs*KD*PPM-cur.dLup*PPM
  do -- [liv-actions] feet moved by an action (jump, kick, sit, dance) and the hop
   local dx,dy,dp=Actions.foot(act,'r',cs,sn,KD);axR+=dx;ayR+=dy;pitR+=dp
   dx,dy,dp=Actions.foot(act,'l',cs,sn,KD);axL+=dx;ayL+=dy;pitL+=dp
  end
  local fA_x,fA_y,fA_p=axR,ayR,pitR;local fB_x,fB_y,fB_p=axL,ayL,pitL
  if not vw.aR then fA_x,fA_y,fA_p=axL,ayL,pitL;fB_x,fB_y,fB_p=axR,ayR,pitR end

  -- pelvis, spine, head from the phase (gait) or the pose
  local c2=math.cos(4*math.pi*(self.phi-sg*.5))       -- 1 at mid-stance of either leg
  local c1=math.cos(2*math.pi*(self.phi-sg*.5))       -- toward the right leg's mid-stance
  local move=smooth(v/.5)
  local hp=503-32*move-30*rw+move*((1-rw)*14*c2+rw*(-30*c2))
  local sway=move*lerp(.022,.018,rw)*PPM*c1
  local pelX=c.pelx+sway*(-cs)
  local gaitY=OYG-hp+sway*sn*KD
  local poseY=c.pely-cur.pelDY*PPM+1.6*math.sin(self.t*2*math.pi/3.8)+6
  -- the hip must stay within reach of both ankles (the soft max leaves no kink when the leg reaches its limit)
  local function reach(hxo:number,axx:number,ayy:number):number
   local dx=(pelX+hxo)-axx;local vr=math.sqrt(math.max(0,c.legmax*c.legmax-dx*dx))
   return ayy-vr-c.hipdy
  end
  local ymin=math.max(reach(c.hipAx,fA_x,fA_y),reach(c.hipBx,fB_x,fB_y))
  local pelY=lerp(poseY,gaitY,gw)
  if gw>.001 then pelY=(pelY+ymin+math.sqrt((pelY-ymin)*(pelY-ymin)+14*14))*.5 end
  pelX=lerp(c.pelx+cur.pelDZ*sn*PPM,pelX,gw)          -- a pose can push the hips back (crouch)
  do local dx,dy=Actions.pelvis(act,cs,sn);pelX+=dx;pelY+=dy end   -- [liv-actions] hips down / back / sideways, hop
  local lean=move*lerp(.045,.19,rw)
  local twist=move*lerp(.028,.05,rw)*math.sin(2*math.pi*self.phi)
  local ks=.2+.8*sn                                           -- forward lean shows in side views, not from the front
  local spineA=(lean*gw+cur.lean)*ks+twist*gw*(.4+.6*sn)
  local headA=(-.55*lean*gw+cur.headR)*ks-.8*twist*gw*(.4+.6*sn)+.012*math.sin(self.t*2*math.pi/6.1)*math.sin(self.t*2*math.pi/3.8)
  spineA+=.004*math.sin(self.t*2*math.pi/3.8)
  do local ds,dh=Actions.spine(act,cs,sn);spineA+=ds;headA+=dh end   -- [liv-actions] lean, chest roll, head pitch / roll
  local rsp=vw.rest.spineRot;local rhd=vw.rest.headRot
  local cr=math.cos(spineA);local sr=math.sin(spineA)
  -- arms: the gait swings them against the legs (elbow folds when running); the pose gives body-space targets
  local function armGait(isRight:boolean,shx:number,shy:number):(number,number)
   local sgn=if isRight then 1 else -1
   local A=lerp(.36,.62,rw)
   local alpha=-sgn*A*move*math.cos(2*math.pi*(self.phi-.04))
   local fwdPart=math.max(0,alpha)/math.max(A,.01)
   local beta=lerp(.22+.2*fwdPart,1.45-.25*fwdPart,rw)
   local fwd=.15*math.sin(alpha)+.14*math.sin(alpha+beta)
   local down=.15*math.cos(alpha)+.14*math.cos(alpha+beta)
   local latX=if isRight then -.045 else .045
   local sxx=pelX+shx*cr-shy*sr
   local syy=pelY+shx*sr+shy*cr
   return sxx+(latX*cs+fwd*sn)*PPM,syy+down*PPM+(fwd*cs-latX*sn)*KD*PPM
  end
  local function poseHand(isRight:boolean):(number,number)
   local X=if isRight then cur.hRX else cur.hLX
   local Y=if isRight then cur.hRY else cur.hLY
   local Z=if isRight then cur.hRZ else cur.hLZ
   return c.pelx+(X*cs+Z*sn)*PPM,c.pely-Y*PPM
  end
  local bind=pqd('bind',0)
  local handX:{[string]:number}={};local handY:{[string]:number}={}
  for _,sd in ipairs({'A','B'}) do
   local isRight=(sd==sideR)
   local gx,gy=armGait(isRight,if sd=='A' then c.shAx else c.shBx,if sd=='A' then c.shAy else c.shBy)
   local px,py=poseHand(isRight)
   if bind>.5 then px=if sd=='A' then c.wAx else c.wBx;py=if sd=='A' then c.wAy else c.wBy end
   handX[sd]=lerp(px,gx,gw);handY[sd]=lerp(py,gy,gw)
   -- [liv-actions] the action's hand (chest frame, turned with the spine) replaces the pose / gait hand by the action's weight
   local ax,ay,aw=Actions.hand(act,if isRight then 'r' else 'l',cs,sn,pelX,pelY,spineA)
   do local cr2=math.cos(spineA);local sr2=math.sin(spineA)                 -- (arc about the shoulder; the elbow side from the hint)
    local shx=if sd=='A' then c.shAx else c.shBx;local shy=if sd=='A' then c.shAy else c.shBy
    local sx,sy=pelX+shx*cr2-shy*sr2,pelY+shx*sr2+shy*cr2
    handX[sd],handY[sd]=Actions.arm(act,pre..'ikInv'..sd,if isRight then 'r' else 'l',sx,sy,handX[sd],handY[sd],ax,ay,aw,cs,sn,spineA,dt) end
  end
  do -- [liv-actions] head on the neck, props (crate between the hands, the thrown apple)
   local ha,hs=Actions.head(act,cs,sn)
   put(pre..'headPX',(vw.rest.headPX or 0)+ha);put(pre..'headPY',(vw.rest.headPY or 0)+hs)
   local rS=sideR;local lS=if sideR=='A' then 'B' else 'A'
   Actions.legs(act,pre..'legInvA',cs)
   Actions.props(act,pre,handX[rS],handY[rS],handX[lS],handY[lS],cs,sn,put)
  end

  -- outputs: pelvis, spine, head, IK targets, feet
  put(pre..'pelvisX',pelX);put(pre..'pelvisY',pelY)
  put(pre..'spineRot',rsp+spineA);put(pre..'headRot',rhd+headA)
  for _,sd in ipairs({'A','B'}) do
   put(pre..'hand'..sd..'X',handX[sd]);put(pre..'hand'..sd..'Y',handY[sd])
   put(pre..'foot'..sd..'X',if sd=='A' then fA_x else fB_x);put(pre..'foot'..sd..'Y',if sd=='A' then fA_y else fB_y)
   put(pre..'foot'..sd..'Rot',(if sd=='A' then c.footWA else c.footWB)-(if sd=='A' then fA_p else fB_p)*.85*(.15+.85*sn))
  end
  -- seen from the front or back a lifted leg gets shorter (its knee goes toward the camera) instead of bending sideways:
  -- the thigh bone is scaled along its length (the shin and foot inherit it: a boot squashed by up to 20 %, a swing foot that rises
  -- less than in profile, so the rest of the shortening is within what the knee can absorb)
  local fz=smooth((cs*cs-.55)/.45)
  local Lleg=c.legmax/.975
  for _,sd in ipairs({'A','B'}) do
   local hx=pelX+(if sd=='A' then c.hipAx else c.hipBx);local hy=pelY+c.hipdy
   local fx=if sd=='A' then fA_x else fB_x;local fy=if sd=='A' then fA_y else fB_y
   local d=math.sqrt((fx-hx)*(fx-hx)+(fy-hy)*(fy-hy))
   local kk=lerp(1,math.clamp(d/Lleg,.8,1),fz)
   put(pre..'leg'..sd..'Scale',kk)
  end
  -- a hand turns over so its fingers curl down: the drawn hand curls to one side of the arm only
  local function smoothTo(k:string,target:number,wn:number):number
   local x=self.sx[pre..k] or target;local vel=self.sv[pre..k] or 0
   vel+=(wn*wn*(target-x)-2*wn*vel)*dt;x+=vel*dt
   self.sx[pre..k]=x;self.sv[pre..k]=vel;return x
  end
  -- hands (the painted articulated hand): the shape is a name from the pose, springs and cascade live in hand_pose.luau
  local farSlot=if vw.farB then 'B' else 'A'
  local ffv=math.max(Actions.ff(act,pre,math.clamp(cur.ff,0,1),cs,sn,dt),c.ffbias)   -- [liv-actions] far hand in front of the chest
  put(pre..'front',ffv);put(pre..'back',1-ffv)
  local palmFace=smooth((cs+.1)/.4)                                -- 1 when she faces the viewer, 0 from the side and the back
  for _,sd in ipairs({'A','B'}) do
   local isRight=(sd==sideR)
   local idx=math.floor(pqd(if isRight then 'shapeR' else 'shapeL',1)+.5)
   local name=HP[math.clamp(idx,1,#HP)]
   local grip=pqd(if isRight then 'gripR' else 'gripL',20)
   name,grip=Actions.shape(act,if isRight then 'r' else 'l',name,grip)        -- [liv-actions] the action's or the prop's hand shape
   local keys={sd}
   if sd==farSlot then keys={sd,sd..'F'} end
   local wrist=0.0
   for _,key in ipairs(keys) do
    local h=self.hands[pre..key]
    if h then
     if name=='relaxed' and rw>.05 then HandPose.setBlend(h,'relaxed','fist',math.clamp(rw*.9,0,.9),0,0)       -- running: loose fists
     else HandPose.setShape(h,name,grip) end
     HandPose.update(h,dt);HandPose.write(h);wrist=HandPose.wrist(h)
     put(pre..'hand'..key..'PalmSide',smoothTo('palm'..key,Actions.palm(act,if isRight then 'r' else 'l',cs,sn,(if (PALMY[name] or 0)>0 then palmFace else 0.0)),12))   -- [liv-actions] palm from the action
    end
   end
   put(pre..'hand'..sd..'Rot',(vw.rest['hand'..sd..'Rot'] or 0)+wrist+Actions.bend(act,if isRight then 'r' else 'l',1))   -- [liv-actions] wrist bend
  end
  -- secondary motion: hair, skirt, apron, satchel, sleeves trail the body (damped springs)
  local function spring(k:string,target:number,wn:number,z:number)
   local x=self.sx[pre..k] or 0;local vel=self.sv[pre..k] or 0
   vel+=(wn*wn*(target-x)-2*z*wn*vel)*dt;x+=vel*dt
   self.sx[pre..k]=x;self.sv[pre..k]=vel
   local rest=vw.rest[k..'Rot'] or 0
   put(pre..k..'Rot',rest+math.clamp(x,-.45,.45))
  end
  local px0=self.sx[pre..'ppx'] or pelX
  local vxn=(pelX-px0)/math.max(dt,.0005);self.sx[pre..'ppx']=pelX
  local acx=(vxn-(self.sx[pre..'pvx'] or 0))/math.max(dt,.0005);self.sx[pre..'pvx']=vxn
  local axS=lerp(self.sx[pre..'axS'] or 0,math.clamp(acx,-9000,9000),.3);self.sx[pre..'axS']=axS
  local swv=math.clamp(axS,-5000,5000)
  local hrv=(headA-(self.sx[pre..'hvp'] or headA))/math.max(dt,.0005);self.sx[pre..'hvp']=headA
  local kf=.35+.65*sn                                         -- trailing shows in side views
  local aW=accW*kf
  local stride=2*math.pi*self.phi
  local flut=move*(.012+.03*rw)
  spring('hair',.00006*aW+.00003*swv+.0016*math.clamp(hrv,-30,30)+.1*rw*smooth(v/1.5)*kf,13,.34)
  spring('skirt',.00016*aW+.00005*swv+.07*rw*kf,11,.42)
  spring('skirtL',.00016*aW+.00005*swv+.07*rw*kf+flut*math.sin(2*stride+.9),9.5,.36)
  spring('skirtR',.00016*aW+.00005*swv+.07*rw*kf-flut*math.sin(2*stride+.2),12.5,.4)
  spring('apron1',.00009*aW+.00003*swv+.035*rw*kf+.35*flut*math.sin(2*stride+2.1),10,.5)
  spring('apron2',.00022*aW+.00007*swv+.085*rw*kf+.8*flut*math.sin(2*stride+1.5),8.2,.36)
  spring('bow1',.0002*aW+.00008*swv+.1*rw*kf+.5*flut*math.sin(2*stride+.4),11,.3)
  spring('bow2',.0002*aW+.00008*swv+.1*rw*kf-.5*flut*math.sin(2*stride+1.2),10,.3)
  spring('satchel',.00016*aW+.00008*swv+.06*rw*kf,8.5,.3)
  -- [liv-sleeves] begin: the sleeve helpers slv<sd>0..5 (sleeve_field.py). The upper arm's turn from its bind direction is worked
  -- out here as the rig's IK makes it (law of cosines, the elbow side from the IK-inversion boolean), so it is the same angle the
  -- arm shows; helper k takes the share k/6 of it, and the shares go to 1 as the turn passes 90 degrees (at +-180 the whole sleeve
  -- turns with the arm, so the wrap from +180 to -180 changes nothing and the puff never flips). On top, the puff trails the arm's
  -- swing (angular speed about the shoulder) and settles with a small overshoot, most in the middle of the puff.
  for _,sd in ipairs({'A','B'}) do
   local rx=if sd=='A' then c.shAx else c.shBx;local ry=if sd=='A' then c.shAy else c.shBy
   local shx=pelX+rx*cr-ry*sr;local shy=pelY+rx*sr+ry*cr
   local vx=handX[sd]-shx;local vy=handY[sd]-shy;local dd=math.max(math.sqrt(vx*vx+vy*vy),.001)
   local L1=c['L1'..sd];local L2=c['L2'..sd]
   local al=math.acos(math.clamp((L1*L1+dd*dd-L2*L2)/(2*L1*dd),-1,1))
   local inv=act.bools[pre..'ikInv'..sd];if inv and inv.value then al=-al end
   local sth=math.atan2(vy,vx)+al-c['bd'..sd]-spineA
   sth=(sth+math.pi)%(2*math.pi)-math.pi
   local q=smooth((math.abs(sth)-math.pi*.5)/(math.pi*.5))
   put(pre..'slvFill'..sd,smooth((math.abs(sth)-.06)/.2))      -- (three-quarter far sleeve: the gap fill, see build_liv.py)
   local th2=math.atan2(vx,vy);local pt=self.sx[pre..'th'..sd] or th2
   local d=th2-pt;if d>math.pi then d-=2*math.pi elseif d<-math.pi then d+=2*math.pi end
   self.sx[pre..'th'..sd]=th2
   local om=math.clamp(d/math.max(dt,.0005),-14,14)
   local ws=lerp(self.sx[pre..'om'..sd] or 0,om,.35);self.sx[pre..'om'..sd]=ws
   for k=0,5 do
    local sh_=k/6;local key=pre..'slvL'..sd..k
    local x=self.sx[key] or 0;local vel=self.sv[key] or 0
    local target=math.clamp(.13*ws*sh_*(1-sh_)*(1-q),-.4,.4)
    vel+=(14*14*(target-x)-2*.42*14*vel)*dt;x+=vel*dt;self.sx[key]=x;self.sv[key]=vel
    put(pre..'slv'..sd..k..'Rot',sth*(sh_+(1-sh_)*q)+math.clamp(x,-.4,.4))
   end
  end
  -- [liv-sleeves] end
  -- read-outs for measuring (the view that is showing most)
  if op>=.5 then
   put(pre..'plA',if (if vw.aR then self.fR.planted else self.fL.planted) and gw>.001 then 1 else 0)
   put(pre..'plB',if (if vw.aR then self.fL.planted else self.fR.planted) and gw>.001 then 1 else 0)
   local function wx(F:Foot):number return OXG+((F.u-self.s)*sn+F.w*cs)*PPM end
   local function wy(F:Foot):number return OYG+((F.u-self.s)*cs-F.w*sn)*PPM*KD end
   put(pre..'cAX',if vw.aR then wx(self.fR) else wx(self.fL));put(pre..'cAY',if vw.aR then wy(self.fR) else wy(self.fL))
   put(pre..'cBX',if vw.aR then wx(self.fL) else wx(self.fR));put(pre..'cBY',if vw.aR then wy(self.fL) else wy(self.fR))
  end
 end

 -- ground markers (the ground slides past: a planted foot stays on its marker); the lead view's origin
 local lc=VIEWS[if sf>.5 then hi else lo].c
 local span=3.2
 for i=0,7 do
  local d=((i*.4-self.s)%span)-span*.5
  put('mX'..i,lc.oxg+d*ysn*PPM);put('mY'..i,lc.oyg+d*ycs*KD*PPM)
 end
 put('speedOut',v);put('sOut',self.s);put('phaseOut',self.phi)
 return true
end
return function(context:Context):Layout<St>
 local lat0=VIEWS[1].c.lat0
 return {context=context,vm=nil,n={},cur={},vel={},t=0,v=0,s=0,phi=.05,frozen=true,rw=0,gw=0,
  fR=newFoot(0,-lat0,.05),fL=newFoot(0,lat0,.55),yaw=43,yawV=0,flip=1,flipV=0,turnF=0,
  hands={},face=nil,blinkT=0,blinkI=1,sx={},sv={},ready=false,prev={},act=Actions.new(),init=init,advance=advance,draw=function(self:St,renderer:Renderer) end}
end
