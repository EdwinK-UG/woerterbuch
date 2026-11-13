-- Liv three-quarter controller (generated into liv-tq/pose.luau by tools/liv/rive/build_tq.py).
-- It sets view-model numbers only: IK targets, spine/head rotation, hand shapes, ground markers. The native rig (bones,
-- IK, sleeve constraints) does the rest. Units: view pixels of the 1024 x 1536 art, 996 px = 1 m.
--
-- Two layers:
--   * poses (Rest, Wave, ...): targets for hands, feet, pelvis, spine, head and hand shapes; every channel follows its
--     target through a critically damped spring, so a pose change is a motion, not a cut.
--   * gait (Walk, Run): feet are planted in WORLD coordinates and never move while they are on the ground; the
--     camera follows her, so the ground markers slide past and a planted boot stays on its marker.
type Foot = {x: number, z: number, fx: number, fz: number, planted: boolean, ph: number}
type St = {context: Context, vm: ViewModel?, n: {[string]: Property<number>}, cur: {[string]: number}, vel: {[string]: number},
  t: number, v: number, s: number, phi: number, frozen: boolean, rw: number, gw: number, started: boolean,
  fA: Foot, fB: Foot, hold: {[string]: number}, prevGait: number,
  blinkT: number, blinkI: number,
  sx: {[string]: number}, sv: {[string]: number}, ppx: number, pvx: number, axS: number, vPrev: number, hvPrev: number, ready: boolean}
local REST: {[string]: number} = {
@REST@
}
local SHAPES = {'Relaxed','Palm','Fist','Point','Thumb','Back'}
-- per pose: absolute targets for hands, relative (d...) for feet, offsets for pelvisY / rotations; hand shapes are
-- 1 relaxed, 2 palm, 3 fist, 4 point, 5 thumb, 6 back of hand
local POSES: {{[string]: number}} = {
@POSES@
}

local PPM=996.0
local KD=.07                                  -- how much of the depth axis shows on the ground (camera nearly level)
local ANG=0.7505                              -- she faces 43 degrees from the viewer
local FXd=math.sin(ANG);local FZd=math.cos(ANG)      -- forward on the ground: right on screen and toward the viewer
local RXd=-math.cos(ANG);local RZd=math.sin(ANG)     -- her right: viewer's left, a little nearer
local OXG=488.0;local OYG=1412.0               -- ground point between her feet, on screen
local PELX=510.0                          -- pelvis at rest (x)
local HIPA=18.0                               -- the hip joint sits this far below the pelvis bone
local LEGMAX=.975*390.0                       -- thigh + shin
local ANKLE=.098
local FOOT_W=@FOOTW@                          -- foot bone's bind angle (the boot as drawn)
local SHAx,SHAy=-70.0,-374.0                  -- shoulders relative to the pelvis at rest
local SHBx,SHBy=55.0,-367.0
local HIPAx,HIPBx=-58.0,56.0

local function smooth(t:number):number t=math.clamp(t,0,1);return t*t*(3-2*t) end
local function lerp(a:number,b:number,t:number):number return a+(b-a)*t end
-- steps per second: a child with 0.39 m legs steps about 2.9 times a second at 0.9 m/s (cadence ~ 1 / sqrt(leg length))
local function cadence(v:number):number return 1.9+1.0*math.min(v,.9)/.9+math.max(0,v-.9)*.45 end
local function stanceOf(v:number):number return .62-.26*smooth((v-.9)/1.1) end                        -- share of the stride on the ground

local function newFoot(x:number,z:number,ph:number):Foot return {x=x,z=z,fx=x,fz=z,planted=true,ph=ph} end

local function init(self:St,context:Context):boolean
 self.context=context
 local vm=context:viewModel();if vm==nil then return true end
 self.vm=vm
 for k,v in pairs(REST) do
  local p=vm:getNumber(k);if p then self.n[k]=p;self.cur[k]=v;self.vel[k]=0 end
 end
 -- start in the Rest pose, not in the drawn A-pose (the arms must not swing down when the page opens)
 local rest0:{[string]:number}=POSES[1]
 for _,k in ipairs({'handAX','handAY','handBX','handBY'}) do
  local val=rest0[k] :: number?
  local p=self.n[k]
  if val~=nil and p then p.value=val;self.cur[k]=val;self.vel[k]=0 end
 end
 for _,sd in ipairs({'A','B'}) do for _,sh in ipairs(SHAPES) do
  for _,pre in ipairs({'hand','handF'}) do
   local k=pre..sd..sh
   if sd=='A' and pre=='handF' then continue end
   local p=vm:getNumber(k);if p then self.n[k]=p;self.cur[k]=if sh=='Relaxed' and pre=='hand' then 1 else 0;self.vel[k]=0 end
  end
 end end
 for _,k in ipairs({'blink','hairRot','skirtRot','satchelRot','pose','rate','frontB','backB','gait','speedOut','sOut','phaseOut','plA','plB','cAX','cAY','cBX','cBY','topA','topB'}) do
  local p=vm:getNumber(k);if p then self.n[k]=p end
 end
 for i=0,7 do local a=vm:getNumber('mX'..i);if a then self.n['mX'..i]=a end;local b=vm:getNumber('mY'..i);if b then self.n['mY'..i]=b end end
 return true
end

local function advance(self:St,seconds:number):boolean
 if self.vm==nil then init(self,self.context);if self.vm==nil then return true end end
 local function nv0(k:string,d:number):number local p=self.n[k];if p==nil then return d end;return p.value end
 local rate=math.clamp(nv0('rate',1),.1,2)      -- time scale: 0.25 plays everything at quarter speed
 local dt=math.min(seconds,1/20)*rate;self.t+=dt
 local function nv(k:string,d:number):number local p=self.n[k];if p==nil then return d end;return p.value end
 local function put(k:string,v:number) local p=self.n[k];if p then p.value=v end end
 local pi=math.floor(nv('pose',0)+.5)
 local mode=math.floor(nv('gait',0)+.5)                  -- 0 stand, 1 walk, 2 run
 local P:{[string]:number}=POSES[pi+1] or POSES[1]
 local function pq(k:string):number? return (P[k] :: number?) end
 local w=13.0
 local function track(k:string,target:number,wk:number,zeta:number?)
  local p=self.n[k];if p==nil then return end
  local z=if zeta~=nil then zeta else 1.0
  local c=self.cur[k] or target;local vel=self.vel[k] or 0
  vel+=(wk*wk*(target-c)-2*z*wk*vel)*dt;c+=vel*dt
  self.cur[k]=c;self.vel[k]=vel;p.value=c
 end
 local function direct(k:string,val:number) local p=self.n[k];if p then p.value=val;self.cur[k]=val;self.vel[k]=0 end end

 -- ------------------------------------------------------------------ gait
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
  if mode==0 and v<.07 and self.fA.planted and self.fB.planted then self.frozen=true end
  if not self.frozen then
   self.phi+=dt*nu/2;if self.phi>=1 then self.phi-=1 end
   self.s+=v*dt
  end
 end
 self.gw+=((if active then 1 else 0)-self.gw)*math.min(1,dt*(if active then 10 else 6))
 local gw=self.gw
 local lat=lerp(.12,.09,smooth(v/.9))
 local lead=v*sg*T*.5
 local Hs=lerp(.05,.17,rw)
 local function stepFoot(F:Foot,ph:number,sgn:number)
  if ph<F.ph and not F.planted then F.planted=true end    -- heel strike: the foot stays where it is
  F.ph=ph
  if ph<sg then
   F.planted=true
  else
   if F.planted then F.planted=false;F.fx=F.x;F.fz=F.z end     -- toe-off
   local sp=(ph-sg)/(1-sg)
   local landS=self.s+v*(1-sg)*T*(1-sp)+lead
   local lx=landS*FXd+sgn*lat*RXd;local lz=landS*FZd+sgn*lat*RZd
   local e=sp-math.sin(2*math.pi*sp)/(2*math.pi)
   F.x=F.fx+(lx-F.fx)*e;F.z=F.fz+(lz-F.fz)*e
  end
 end
 if not self.frozen and active then
  stepFoot(self.fA,self.phi,1);stepFoot(self.fB,(self.phi+.5)%1,-1)
 end
 -- ankle on screen, with the heel / ball rocker of a planted foot and the lift of a swinging one
 local function ankle(F:Foot,ph:number):(number,number,number,number,number)
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
   dup=Hs*smooth(v/.25)*(math.sin(math.pi*sp^.85))^2
  end
  local X=OXG+(F.x-self.s*FXd)*PPM+dfwd*FXd*PPM
  local Y=OYG+(F.z-self.s*FZd)*PPM*KD+dfwd*FZd*KD*PPM-(ANKLE+dup)*PPM
  return X,Y,pitch,F.x,F.z
 end

 local ax,ay,apitch=0.0,0.0,0.0
 local bx,by,bpitch=0.0,0.0,0.0
 if gw>.001 then
  local ph1=self.phi;local ph2=(self.phi+.5)%1
  ax,ay,apitch=ankle(self.fA,ph1);bx,by,bpitch=ankle(self.fB,ph2)
 end

 -- pelvis, spine, head, arms from the phase
 local c2=math.cos(4*math.pi*(self.phi-sg*.5))       -- 1 at mid-stance of either leg
 local c1=math.cos(2*math.pi*(self.phi-sg*.5))       -- toward the right leg's mid-stance
 local move=smooth(v/.5)
 local hp=503-32*move-30*rw+move*((1-rw)*14*c2+rw*(-30*c2))
 local sway=move*lerp(.022,.018,rw)*PPM*c1
 local pelX=PELX+sway*RXd
 local pelY=OYG-hp+sway*RZd*KD
 -- the hip must stay within reach of both ankles
 local function reach(hxo:number,axx:number,ayy:number)
  local dx=(pelX+hxo)-axx;local vr=math.sqrt(math.max(0,LEGMAX*LEGMAX-dx*dx))
  return ayy-vr-HIPA
 end
 local ymin=math.max(reach(HIPAx,ax,ay),reach(HIPBx,bx,by))
 if gw>.001 then pelY=(pelY+ymin+math.sqrt((pelY-ymin)*(pelY-ymin)+14*14))*.5 end   -- soft max: no kink when the leg reaches its limit
 local lean=move*lerp(.045,.19,rw)
 local twist=move*lerp(.028,.05,rw)*math.sin(2*math.pi*self.phi)
 local spineRot=lean+twist
 local headRot=-.55*lean-.8*twist
 -- arms swing against the legs; the elbow folds more when running
 local function arm(sgn:number,shx:number,shy:number,phase:number):(number,number)
  local A=lerp(.36,.62,rw)
  local alpha=-sgn*A*move*math.cos(2*math.pi*(phase-.04))
  local fwdPart=math.max(0,alpha)/math.max(A,.01)
  local beta=lerp(.22+.2*fwdPart,1.45-.25*fwdPart,rw)
  local fwd=.15*math.sin(alpha)+.14*math.sin(alpha+beta)
  local down=.15*math.cos(alpha)+.14*math.cos(alpha+beta)
  local latOff=(if sgn>0 then -18.0 else 38.0)
  local cr=math.cos(spineRot);local sr=math.sin(spineRot)
  local sx=pelX+shx*cr-shy*sr
  local sy=pelY+shx*sr+shy*cr
  return sx+latOff+fwd*FXd*PPM,sy+down*PPM+fwd*FZd*KD*PPM
 end
 local hxA,hyA=arm(1,SHAx,SHAy,self.phi)
 local hxB,hyB=arm(-1,SHBx,SHBy,self.phi)

 -- ------------------------------------------------------------------ outputs
 -- what the pose layer wants (its own springs), and what the gait wants; mixed by gw
 local function o(k:string):number? return (P[k] :: number?) end
 local function restOr(k:string):number local x=o(k);if x~=nil then return x end;return REST[k] end
 for k,rest in pairs(REST) do
  if k=='pose' or k=='rate' or k=='frontB' or k=='backB' or k=='gait' then continue end
  local target=restOr(k)
  local pv=o(k)
  if k=='pelvisY' then target=rest+(if pv~=nil then pv else 0)+1.6*math.sin(self.t*2*math.pi/3.8)+6 end
  if k=='pelvisX' then target=rest end
  if k=='spineRot' or k=='headRot' then target=rest+(if pv~=nil then pv else 0)+(if k=='spineRot' then .004 else .012*math.sin(self.t*2*math.pi/6.1))*math.sin(self.t*2*math.pi/3.8) end
  -- feet: the pose moves them relative to where they stand (the gait leaves them wherever they were planted)
  if k=='footAX' then target=self.hold.ax+(o('dfootAX') or 0) end
  if k=='footAY' then target=self.hold.ay+(o('dfootAY') or 0) end
  if k=='footBX' then target=self.hold.bx+(o('dfootBX') or 0) end
  if k=='footBY' then target=self.hold.by+(o('dfootBY') or 0) end
  if k=='footARot' or k=='footBRot' then target=rest end
  local wk=w
  if pi==1 and (k=='handAX' or k=='handAY' or k=='handARot') then
   local ph=math.sin(self.t*2*math.pi*2.3)
   if k=='handAX' then target+=24*ph elseif k=='handAY' then target-=7*math.abs(ph) else target+=.42*ph end
   wk=w*1.7
  end
  -- gait overrides
  if gw>.001 then
   local gv:number? = nil
   if k=='pelvisX' then gv=pelX elseif k=='pelvisY' then gv=pelY
   elseif k=='spineRot' then gv=REST.spineRot+spineRot elseif k=='headRot' then gv=REST.headRot+headRot
   elseif k=='handAX' then gv=hxA elseif k=='handAY' then gv=hyA elseif k=='handBX' then gv=hxB elseif k=='handBY' then gv=hyB
   elseif k=='handARot' then gv=rest elseif k=='handBRot' then gv=rest
   elseif k=='footAX' then gv=ax elseif k=='footAY' then gv=ay elseif k=='footBX' then gv=bx elseif k=='footBY' then gv=by
   elseif k=='footARot' then gv=FOOT_W-apitch*.85 elseif k=='footBRot' then gv=FOOT_W-bpitch*.85 end
   if gv~=nil then
    local isFoot=(string.sub(k,1,4)=='foot') or k=='pelvisY' or k=='pelvisX'      -- (the hip must stay in reach of the planted foot: no spring on it)
    if isFoot and gw>.99 then direct(k,gv) else
     local mixed=lerp(target,gv,gw)
     if isFoot then direct(k,mixed) else track(k,mixed,if string.sub(k,1,4)=='hand' then 34 else 26) end
    end
    continue
   end
  end
  if k=='handAFlip' or k=='handBFlip' then
   -- a hand turns over so its fingers curl down: the drawn hand curls to one side of the arm only
   local isA=(k=='handAFlip')
   local shx=(if isA then 440.0 else 565.0)+(self.cur.pelvisX or PELX)-PELX
   local shy=(if isA then 538.0 else 545.0)+(self.cur.pelvisY or 912)-912
   local dx=(self.cur[if isA then 'handAX' else 'handBX'] or shx)-shx;local dy=(self.cur[if isA then 'handAY' else 'handBY'] or shy+200)-shy
   local c=dx/math.max(1,math.sqrt(dx*dx+dy*dy))
   local want=1.0
   if isA and c<-.38 then want=-1.0 end
   if (not isA) and c>.38 then want=-1.0 end
   track(k,want,32)
   continue
  end
  local zeta=1.0
  if string.sub(k,1,4)=='hand' and string.sub(k,5,5)~='B' or k=='handBX' or k=='handBY' then zeta=.78 end
  if k=='handARot' or k=='handBRot' then zeta=.55 end
  track(k,target,wk,zeta)
 end
 -- when the gait ends the feet stay where they are planted
 if gw>.001 then
  self.hold.ax=ax;self.hold.ay=ay;self.hold.bx=bx;self.hold.by=by
 end
 -- hand shapes: a quick cross-fade
 local sa=pq('shapeA');local sb=pq('shapeB');local fq=pq('frontB')
 local shA=(if sa~=nil then sa else 1)-1;local shB=(if sb~=nil then sb else 1)-1
 local fb=if fq~=nil then fq else 0
 for i,sh in ipairs(SHAPES) do
  track('handA'..sh,if shA==i-1 then 1 else 0,40)
  local on=if shB==i-1 then 1 else 0
  track('handB'..sh,on*(1-fb),40);track('handBF'..sh,on*fb,40)
 end
 track('frontB',fb,30);track('backB',1-fb,30)

 -- secondary motion: hair, skirt and satchel trail the body (damped springs driven by how the pelvis is pushed about)
 do
  local px=nv('pelvisX',PELX);local hr=nv('headRot',0)
  if not self.ready then self.ppx=px;self.vPrev=v;self.hvPrev=hr;self.ready=true end
  if dt>.0005 then
   local vx=(px-self.ppx)/dt;local acx=(vx-self.pvx)/dt
   self.axS=lerp(self.axS,math.clamp(acx,-9000,9000),.3);self.pvx=vx;self.ppx=px
   local accW=math.clamp((v-self.vPrev)/dt,-4,4)*FXd*PPM*.35;self.vPrev=v
   local hv=(hr-self.hvPrev)/dt;self.hvPrev=hr
   local sw=math.clamp(self.axS,-5000,5000)
   local function spring(k:string,target:number,wn:number,z:number)
    local c=self.sx[k] or 0;local vel=self.sv[k] or 0
    vel+=(wn*wn*(target-c)-2*z*wn*vel)*dt;c+=vel*dt
    self.sx[k]=c;self.sv[k]=vel
    local p=self.n[k..'Rot']
    if p then p.value=(REST[k..'Rot'] or 0)+math.clamp(c,-.45,.45) end
   end
   spring('hair',.00006*accW+.00003*sw+.0016*math.clamp(hv,-30,30)+.1*rw*smooth(v/1.5),13,.34)
   -- skirt: three hem bones that flutter a little out of step with each other, and with the stride
   local stride=2*math.pi*self.phi
   local flut=move*(.012+.03*rw)
   spring('skirt',.00016*accW+.00005*sw+.07*rw,11,.42)
   spring('skirtL',.00016*accW+.00005*sw+.07*rw+flut*math.sin(2*stride+.9),9.5,.36)
   spring('skirtR',.00016*accW+.00005*sw+.07*rw-flut*math.sin(2*stride+.2),12.5,.4)
   -- apron: hangs from the waistband, the hem trails more than the middle (two bones in a chain)
   spring('apron1',.00009*accW+.00003*sw+.035*rw+.35*flut*math.sin(2*stride+2.1),10,.5)
   spring('apron2',.00022*accW+.00007*sw+.085*rw+.8*flut*math.sin(2*stride+1.5),8.2,.36)
   spring('satchel',.00016*accW+.00008*sw+.06*rw,8.5,.3)
   -- sleeves: the puff trails the arm's swing (angular speed of the hand about the shoulder) and settles with a small overshoot
   local pxx=self.cur['pelvisX'] or PELX;local pyy=self.cur['pelvisY'] or 912
   for _,sd in ipairs({'A','B'}) do
    local shx=pxx+(if sd=='A' then SHAx else SHBx);local shy=pyy+(if sd=='A' then SHAy else SHBy)
    local hx=self.cur['hand'..sd..'X'] or shx;local hy=self.cur['hand'..sd..'Y'] or shy+200
    local th=math.atan2(hx-shx,hy-shy);local pt=self.sx['th'..sd] or th
    local d=th-pt;if d>math.pi then d-=2*math.pi elseif d<-math.pi then d+=2*math.pi end
    self.sx['th'..sd]=th
    local om=math.clamp(d/dt,-14,14)
    local ws=lerp(self.sx['om'..sd] or 0,om,.35);self.sx['om'..sd]=ws
    spring('slv'..sd..'1',math.clamp(.018*ws,-.28,.28),15,.45)
    spring('slv'..sd..'2',math.clamp(.032*ws,-.4,.4),13,.4)
   end
  end
 end

 -- blink: every 2.2 to 5.4 s, about 0.2 s (closing 70 ms, held 30 ms, opening 100 ms)
 do
  local GAPS={2.6,4.1,3.3,5.4,2.9,3.8,2.2,4.6}
  self.blinkT+=dt
  local gap=GAPS[self.blinkI]
  local u=self.blinkT-gap
  local b=0.0
  if u>=0 then
   if u>=.2 then self.blinkT=0;self.blinkI=(self.blinkI % #GAPS)+1
   elseif u<.07 then b=smooth(u/.07) elseif u<.1 then b=1.0 else b=1-smooth((u-.1)/.1) end
  end
  put('blink',b)
 end
 -- ground markers (the ground slides past: a planted foot stays on its marker) and read-outs for measuring
 local span=3.2
 for i=0,7 do
  local d=((i*.4-self.s)%span)-span*.5
  put('mX'..i,OXG+d*FXd*PPM);put('mY'..i,OYG+d*FZd*KD*PPM)
 end
 put('speedOut',v);put('sOut',self.s);put('phaseOut',self.phi)
 put('plA',if self.fA.planted and gw>.001 then 1 else 0);put('plB',if self.fB.planted and gw>.001 then 1 else 0)
 put('cAX',OXG+(self.fA.x-self.s*FXd)*PPM);put('cAY',OYG+(self.fA.z-self.s*FZd)*PPM*KD)
 put('cBX',OXG+(self.fB.x-self.s*FXd)*PPM);put('cBY',OYG+(self.fB.z-self.s*FZd)*PPM*KD)
 return true
end
return function(context:Context):Layout<St>
 local rA=newFoot(.12*RXd,.12*RZd,.05);local rB=newFoot(-.12*RXd,-.12*RZd,.55)
 return {context=context,vm=nil,n={},cur={},vel={},t=0,v=0,s=0,phi=.05,frozen=true,rw=0,gw=0,started=false,
  blinkT=0,blinkI=1,sx={},sv={},ppx=0,pvx=0,axS=0,vPrev=0,hvPrev=0,ready=false,
  fA=rA,fB=rB,hold={ax=@HOLDAX@,ay=@HOLDAY@,bx=@HOLDBX@,by=@HOLDBY@},prevGait=0,init=init,advance=advance,draw=function(self:St,renderer:Renderer) end}
end
