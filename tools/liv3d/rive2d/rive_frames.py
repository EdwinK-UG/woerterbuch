# rive_frames.py PREFIX HIDE OUT.png [ANIM] [FRAMES] : poses one built view in the Rive editor at recorded frames and
# captures it (a strip, cropped to the middle of the figure), to check deformation without exporting.
#   run from the folder that holds rive_prep.py's output (PREFIX.json) and rive_build.py's ids (PREFIX.ids.json)
#   HIDE: comma-separated images to hide (opacity 0) while capturing, '' for none; ANIM idle|walk|wave; FRAMES 0,4,8
# Older than the foreshortening bones and the head's own tilt (rive_build.py): it poses the joint bones only. To check
# exported files frame by frame use tools/liv3d/demo/rive2d-frames.html.
import json, math, sys, base64, io, urllib.request
from PIL import Image
URL='http://127.0.0.1:9791/mcp'; SID=None
def rpc(m,p):
    global SID
    r=urllib.request.Request(URL,data=json.dumps({'jsonrpc':'2.0','id':1,'method':m,'params':p}).encode(),headers={'Content-Type':'application/json','Accept':'application/json, text/event-stream',**({'mcp-session-id':SID} if SID else {})})
    with urllib.request.urlopen(r,timeout=600) as x:
        SID=SID or x.headers.get('mcp-session-id'); b=x.read().decode()
    if b.startswith('event:') or b.startswith('data:'): b=[l[5:] for l in b.splitlines() if l.startswith('data:')][-1]
    return json.loads(b)
rpc('initialize',{'protocolVersion':'2025-11-25','capabilities':{},'clientInfo':{'name':'x','version':'1'}})
call=lambda t,a: rpc('tools/call',{'name':t,'arguments':a})['result']
pf, hide, out = sys.argv[1], sys.argv[2].split(',') if sys.argv[2] else [], sys.argv[3]
D=json.load(open(f'{pf}.json')); I=json.load(open(f'{pf}.ids.json')); J=D['joints']; bones=I['bones']; body=I['body']; img=I['images']
X,Y,R,LEN,GX,GY=90,91,15,89,13,14
ang=lambda j,a,b: math.degrees(math.atan2(j[b][1]-j[a][1],j[b][0]-j[a][0])); dist=lambda j,a,b: math.hypot(j[b][0]-j[a][0],j[b][1]-j[a][1])
def rot(p,deg): c,s=math.cos(math.radians(deg)),math.sin(math.radians(deg)); return [p[0]*c-p[1]*s,p[0]*s+p[1]*c]
hr=ang(J,'neck','top')-ang(J,'hips','neck'); h0=ang(J,'neck','head')-ang(J,'hips','neck')
def ch(j):
    o={}; off=[j['hips'][0]-J['hips'][0], j['hips'][1]-J['hips'][1]]; o[(body,GX)],o[(body,GY)]=off
    o[(bones['pelvis'],R)]=ang(j,'hips','midhip'); gt=ang(j,'hips','neck'); o[(bones['torso'],R)]=gt; o[(bones['torso'],LEN)]=dist(j,'hips','neck'); o[(bones['head'],R)]=hr+(ang(j,'neck','head')-gt)-h0
    for s in 'RL':
        lp=rot([j['sh'+s][0]-j['hips'][0], j['sh'+s][1]-j['hips'][1]],-gt); u,l,h=ang(j,'sh'+s,'el'+s),ang(j,'el'+s,'wr'+s),ang(j,'wr'+s,'fi'+s)
        b=bones['uarm'+s]; o[(b,X)],o[(b,Y)]=lp; o[(b,R)]=u-gt; o[(b,LEN)]=dist(j,'sh'+s,'el'+s)
        b=bones['larm'+s]; o[(b,R)]=l-u; o[(b,LEN)]=dist(j,'el'+s,'wr'+s)
        b=bones['hand'+s]; o[(b,R)]=h-l; o[(b,LEN)]=dist(j,'wr'+s,'fi'+s)
        ul,ll,ft=ang(j,'hip'+s,'kn'+s),ang(j,'kn'+s,'an'+s),ang(j,'an'+s,'to'+s)
        b=bones['uleg'+s]; o[(b,X)]=j['hip'+s][0]-off[0]; o[(b,Y)]=j['hip'+s][1]-off[1]; o[(b,R)]=ul; o[(b,LEN)]=dist(j,'hip'+s,'kn'+s)
        b=bones['lleg'+s]; o[(b,R)]=ll-ul; o[(b,LEN)]=dist(j,'kn'+s,'an'+s)
        b=bones['foot'+s]; o[(b,R)]=ft-ll; o[(b,LEN)]=dist(j,'an'+s,'to'+s)
    return o
def setv(o):
    pv={}
    for (oid,pk),v in o.items(): pv.setdefault(oid,{})[str(pk)]=round(v,3)
    call('set_property_values',{'propertyValues':pv})
call('set_property_values',{'propertyValues':{img[h]:{'18':0} for h in hide}})
F=D['anims'][sys.argv[4] if len(sys.argv)>4 else 'walk']['frames']; frames=[int(x) for x in (sys.argv[5] if len(sys.argv)>5 else '0,4,8,12,16,20').split(',')]
tiles=[]
for f in frames:
    setv(ch(F[f])); r=call('capture_artboard',{'artboardId':I['artboard'],'longEdge':900,'backgroundColor':'#f3e9d8'})
    b64=next(c['data'] for c in r['content'] if c.get('type')=='image'); tiles.append(Image.open(io.BytesIO(base64.b64decode(b64))).convert('RGB'))
setv(ch(J)); call('set_property_values',{'propertyValues':{img[h]:{'18':100} for h in hide}})
call('set_property_values',{'propertyValues':{img['head_laugh']:{'18':0}}}) if 'head_laugh' in img else None
w,h=tiles[0].size; sheet=Image.new('RGB',(w*len(tiles),h//2))
for i,t in enumerate(tiles): sheet.paste(t.crop((0,int(h*0.3),w,int(h*0.8))),(i*w,0))
sheet.save(out); print('ok',sheet.size)
