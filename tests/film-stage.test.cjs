'use strict';
// Grammar stage + private overlay tooling. Synthetic fixtures only: no protected lesson text belongs in this repository.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {JSDOM}=require('jsdom'),G=require('../grammatik/film-stage.js'),V=require('../tools/film-visual.cjs'),I=require('../tools/film-integrity.cjs');
const lesson=(say='Er sagt es.')=>({n:9001,level:'B2',title:'Testkapitel',understand:[{rows:[['Deshalb','gehe','ich','heute','weg.']]}],examples:[],exercises:[],
  film:{version:1,id:'t9001',title:'Verb auf Position 2',level:'B2',scenes:[{id:'t-move',title:'Das Verb bleibt',visual:'slots',alt:'Satz',from:[{id:'a',text:'Ich',role:'neutral'},{id:'b',text:'gehe',role:'verb'}],to:[{id:'a',text:'Ich',role:'neutral'},{id:'b',text:'gehe',role:'verb'}],takeaway:'',beats:[{say,seconds:4,stage:0},{say:'Dann bleibt es.',seconds:4,stage:1}],quiz:{prompt:'Wo?',options:[{text:'2',correct:true,feedback:'Ja.'},{text:'1',correct:false,feedback:'Nein.'}]}}]}});
const src=(l)=>'GRAM.add('+JSON.stringify(l)+');\n';
const authoring=(edit)=>`module.exports=(K)=>{const {w,wn,wp,T,R,S,pun}=K;const row=(o={})=>R('r','ex',[T('a',w('ex',0),{f:o.f?1:undefined}),T('v',w('ex',1),{r:o.f?'fin':undefined,f:o.f?2:undefined}),T('s',w('ex',2)),T('h',w('ex',3)),T('w',wn('ex',4)),pun('d',wp('ex',4))]);
 const m={key:'B2-9001',n:9001,examples:[['ex','understand[0].rows[0], joined','Deshalb gehe ich heute weg.']],cues:{'t-move--1':[S(0,[row()]),S(0.5,[row({f:true})],{br:[{t:['r','a','v'],l:'Position 1 und 2'}]})],'t-move--2':[S(0,[row({f:true})],{ar:[{a:['r','a'],b:['r','s'],k:'link',l:'Verbindung'}]})]},checks:{'t-move':{origin:'source-quiz'}}};
 ${edit||''};return m;};`;
function setup(edit,l=lesson()){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fv-'));fs.mkdirSync(path.join(dir,'les'));fs.mkdirSync(path.join(dir,'aut'));fs.writeFileSync(path.join(dir,'les','k9001.js'),src(l));const a=path.join(dir,'aut','B2-9001.cjs');fs.writeFileSync(a,authoring(edit));return {dir,les:path.join(dir,'les'),a};}
const measure=(t,fs)=>t.length*fs*0.56;
const sceneOf=(r,dur={'t-move--1':4,'t-move--2':4})=>{let t=0;const kfs=[];for(const [cue,list] of Object.entries(r.visual.scenes['t-move'].cues)){for(const k of list)kfs.push({t:t+k.at*dur[cue],s:k.s});t+=dur[cue];}return {kfs};};

test('overlay build keeps only references and refuses invented or altered sentences',()=>{
  const ok=setup();const r=V.build(ok.a,ok.les,null);assert.deepEqual(r.errors,[]);assert.equal(r.stats.cuesDrawn,2);
  const json=JSON.stringify(r.visual);assert.doesNotMatch(json,/Deshalb gehe/,'the overlay must not contain lesson text');assert.equal(r.visual.refs.ex.len,27);
  for(const [edit,why] of [
    ["m.cues['t-move--1'][0].rows[0].ex=null",/neither a rail nor a list/],
    ["m.cues['t-move--1'][0].rows[0].tiles.pop()",/must equal/],
    ["m.examples[0][2]='Deshalb gehe ich morgen weg.'",/text differs/],
    ["m.cues['t-move--9']=m.cues['t-move--1']",/unknown cue/],
    ["m.cues['t-move--1'][1].say='x'",/forbidden key/],
    ["delete m.cues['t-move--2']",/covers 1 of 2 cues/],
    ["m.cues['t-move--1'][1].at=0",/fractions/]]){const s=setup(edit);assert.match(V.build(s.a,s.les,null).errors.join('\n'),why,edit);}
});
test('example keys resolve only while the protected lesson text is unchanged',()=>{
  const s=setup(),r=V.build(s.a,s.les,null),l=lesson();assert.deepEqual(G.registry(l,r.visual).bad,[]);
  l.understand[0].rows[0][3]='morgen';assert.deepEqual(G.registry(l,r.visual).bad,['ex']);
});
test('the picture is a pure function of time: seek order, replay and reduced motion agree',()=>{
  const s=setup(),r=V.build(s.a,s.les,null),reg=G.registry(lesson(),r.visual),sc=sceneOf(r),opt={fs:24,measure,margin:20,tlH:100,idp:'t'};
  const at=(t,o={})=>G.render(reg,sc,t,900,{...opt,...o}).svg,times=[0.1,2.15,2.4,5,7.9],fresh=times.map(t=>at(t)),shuffled=[...times].reverse().map(t=>at(t)).reverse();
  assert.deepEqual(shuffled,fresh);assert.equal(at(2.3),at(2.3));
  assert.equal(G.frame(reg,sc,2,900,{...opt}).index,1,'a keyframe starts exactly at its time (half-open)');assert.equal(G.frame(reg,sc,1.999,900,opt).index,0);
  assert.equal(G.frame(reg,sc,2.1,900,{...opt,reduce:true}).p,1,'reduced motion cuts to the settled state');assert.ok(G.frame(reg,sc,2.1,900,opt).p<1);
  assert.match(at(3),/role="img" aria-label="/);assert.doesNotMatch(at(3),/<script|onerror|<animate/);
});
test('phone layout keeps every word inside the stage and labels readable',()=>{
  const s=setup(),r=V.build(s.a,s.les,null),reg=G.registry(lesson(),r.visual);
  for(const W of [296,320,366]){const L=G.layout(reg,r.visual.scenes['t-move'].cues['t-move--1'][1].s,W,{fs:17,measure,margin:12});for(const q of L.pieces){assert.ok(q.x>=0&&q.x+q.w<=W,'word '+q.text+' at '+W);}
    const svg=G.render(reg,sceneOf(r),3,W,{fs:17,measure,margin:12,tlH:110,idp:'p'}).svg;for(const m of svg.matchAll(/font-size="([\d.]+)"/g))assert.ok(+m[1]>=11,'font '+m[1]+' at '+W);}
});
test('arrows route around words and the text alternative names the grammar',()=>{
  const s=setup(),r=V.build(s.a,s.les,null),reg=G.registry(lesson(),r.visual),st=r.visual.scenes['t-move'].cues['t-move--2'][0].s,L=G.layout(reg,st,900,{fs:24,measure,margin:20});
  const a=L.pieces.find(q=>q.id==='a'),b=L.pieces.find(q=>q.id==='s'),v=L.pieces.find(q=>q.id==='v'),c=G.route(L,a,b,900,24,{margin:20});
  for(let i=1;i<24;i++){const u=i/24,x=(1-u)*(1-u)*c[0]+2*u*(1-u)*c[2]+u*u*c[4],y=(1-u)*(1-u)*c[1]+2*u*(1-u)*c[3]+u*u*c[5];assert.ok(!(x>v.x&&x<v.x+v.w&&y>v.base-22&&y<v.base+7),'arrow crosses the finite verb');}
  const d=G.describe(reg,st);assert.match(d,/Deshalb gehe ich heute weg\./);assert.match(d,/Position 1: Deshalb/);assert.match(d,/finit: gehe/);assert.match(d,/Pfeil: Verbindung/);
});
test('the player uses the stage for covered scenes, falls back when the text changed, and answers return to the film',()=>{
  const s=setup(),r=V.build(s.a,s.les,null),d=new JSDOM('<main><div id="host"></div></main>',{runScripts:'outside-only',pretendToBeVisual:true});
  d.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});d.window.HTMLCanvasElement.prototype.getContext=()=>null;
  d.window.eval(fs.readFileSync(path.join(__dirname,'../grammatik/film-stage.js'),'utf8'));d.window.eval(fs.readFileSync(path.join(__dirname,'../grammatik/film.js'),'utf8'));
  const host=d.window.document.getElementById('host'),l=lesson();let p=d.window.GRAM_FILM.mount(host,l.film,{lesson:l,visual:{visual:r.visual,audio:null}});
  p.seek(5);assert.ok(host.querySelector('.gf-view').classList.contains('gf-grammar'));assert.match(host.querySelector('.gf-view svg').getAttribute('aria-label'),/Position 1: Deshalb/);
  host.querySelector('.gf-options button').click();assert.match(host.querySelector('.gf-feedback').textContent,/Für diese Frage nicht richtig|Richtig/);
  host.querySelector('.gf-back').click();assert.equal(Math.round(p.timeline.cues[1].start),4);assert.match(host.querySelector('.gf-time').textContent,/00:05/);p.dispose();
  const changed=lesson();changed.understand[0].rows[0][1]='ging';p=d.window.GRAM_FILM.mount(host,changed.film,{lesson:changed,visual:{visual:r.visual,audio:null}});
  assert.ok(!host.querySelector('.gf-view').classList.contains('gf-grammar'),'a changed lesson keeps the classic picture');p.dispose();d.window.close();
});
test('recordings play on their audited decoded length only when the file hash matches',()=>{
  const s=setup(),r=V.build(s.a,s.les,null),d=new JSDOM('<div id="h"></div>',{runScripts:'outside-only',pretendToBeVisual:true});d.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  d.window.eval(fs.readFileSync(path.join(__dirname,'../grammatik/film.js'),'utf8'));const l=lesson(),h='a'.repeat(64),host=d.window.document.getElementById('h');
  const audio={'t-move--1':{url:'https://x.test/film-audio/clip?k=k9001%2F'+h+'.mp3',seconds:5.1,say:l.film.scenes[0].beats[0].say},'t-move--2':{url:'https://x.test/c?k=k9001%2F'+'b'.repeat(64)+'.mp3',seconds:6.1,say:'Dann bleibt es.'}};
  const p=d.window.GRAM_FILM.mount(host,l.film,{audio,lesson:l,visual:{visual:r.visual,audio:{sampleRate:48000,cues:{'t-move--1':{frames:240000,mp3:h},'t-move--2':{frames:96000,mp3:'c'.repeat(64)}}}}});
  assert.equal(p.timeline.cues[0].seconds,5,'decoded 48 kHz length of the audited file');assert.equal(p.timeline.cues[1].seconds,6.1,'unknown file keeps its own length');p.dispose();d.window.close();
});
test('integrity check rejects narration, id, order, timing, example and quiz changes but accepts visual-only edits',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fi-')),write=(l)=>fs.writeFileSync(path.join(dir,'k9001.js'),src(l));write(lesson());const base=I.films(dir);
  const check=(mut)=>{const l=lesson();mut(l);write(l);const p=[];I.compare(base,I.films(dir),p);return p.join('\n');};
  assert.equal(check(l=>{l.film.scenes[0].alt='Neue Bildbeschreibung';}),'');
  for(const [mut,why] of [[l=>{l.film.scenes[0].beats[0].say='Er sagt es!';},/narration text changed/],[l=>{l.film.scenes[0].id='t-other';},/scene ids/],
    [l=>{l.film.scenes.push({...l.film.scenes[0]});},/duplicate scene id/],[l=>{l.film.scenes[0].beats.reverse();},/narration text changed/],[l=>{l.film.scenes[0].beats[1].seconds=5;},/authored seconds/],
    [l=>{l.film.scenes[0].beats[1].stage=0;},/authored stage/],[l=>{l.film.scenes[0].to[1].text='ging';},/examples changed/],[l=>{l.film.scenes[0].quiz.options[1].text='3';},/quiz changed/],
    [l=>{l.understand[0].rows[0][0]='Darum';},/understand changed/]])assert.match(check(mut),why);
});
