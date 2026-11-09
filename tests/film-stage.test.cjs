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
test('pictures: unknown kinds are refused, figures and moves render without broken coordinates, one action plays once',()=>{
  global.window=globalThis;require('../grammatik/film-props.js');
  const bad=setup("m.cues['t-move--1'][1].pic={items:[{id:'x',k:'dragon',x:1,y:1}],marks:[{k:'glitter'}]}");const e=V.build(bad.a,bad.les,null).errors.join('\n');assert.match(e,/unknown picture item dragon/);assert.match(e,/unknown picture mark glitter/);assert.match(e,/text alternative/);
  const A={items:[{id:'f',k:'figure',who:'mara',x:100,y:240,face:1},{id:'c',k:'cat',x:80,y:240,pose:'sit'}],marks:[]},B={items:[{id:'f',k:'figure',who:'mara',x:300,y:240,face:1,move:'walk'},{id:'c',k:'cat',x:380,y:200,pose:'sit',move:'jump'}],marks:[{k:'tag',x:300,y:40,t:'Wohin?',g:1}]};
  for(const p of [0,0.13,0.5,0.87,1]){const svg=G.picture(A,B,p,600,260,{idp:'t'});assert.doesNotMatch(svg,/NaN|undefined|Infinity/,'p='+p);}
  assert.equal(G.picture(B,B,0.5,600,260,{idp:'t'}),G.picture(B,B,1,600,260,{idp:'t'}),'an unchanged state does not replay its jump or walk');
});

test('legacy multiword constituents are not inferred to be finite forms',()=>{
  const K=require('../tools/film-visual-kit.cjs'),l=lesson();
  l.film.scenes[0].from=[{id:'s',text:'ein Kind,',role:'neutral'},{id:'v',text:'das malt',role:'verb'}];l.film.scenes[0].to=l.film.scenes[0].from;
  const a=K.auto(l,{scenes:{'t-move':{fields:false}}});
  for(const list of Object.values(a.cues))for(const k of list)for(const r of k.rows)assert.ok(r.tiles.every(t=>t.r!=='fin'));
  const s=setup("m.cues['t-move--1'][0].rows[0].tiles[0].r='fin';m.cues['t-move--1'][0].rows[0].tiles[0].p.push({x:'ex#1'});");
  assert.match(V.build(s.a,s.les,null).errors.join('\n'),/finite marking spans multiple words/);
});
function interactiveFixture(task){
  const l=lesson(),s=setup('',l),r=V.build(s.a,s.les,null);r.visual.checks['t-move']={origin:'authored-visual-diagnostic',ask:'Ordne die Wörter.',answer:'Deshalb gehe ich.',task,why:'Das Verb folgt.'};
  const d=new JSDOM('<main><div id="h"></div></main>',{runScripts:'outside-only',pretendToBeVisual:true}),w=d.window;
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.HTMLCanvasElement.prototype.getContext=()=>null;w.requestAnimationFrame=fn=>{w._frame=fn;return 1;};w.cancelAnimationFrame=()=>{};
  for(const f of ['film-stage.js','film.js'])w.eval(fs.readFileSync(path.join(__dirname,'../grammatik/',f),'utf8'));
  const h=w.document.querySelector('#h'),p=w.GRAM_FILM.mount(h,l.film,{lesson:l,visual:{visual:r.visual}});return {d,h,p};
}
test('exploration restores its entering play state and navigation invalidates question state',()=>{
  const {d,h,p}=interactiveFixture({kind:'order',items:['ich','gehe','Deshalb'],accept:[[2,1,0]]});
  h.querySelector('[data-play]').click();assert.equal(h.querySelector('[data-play]').textContent,'Pause');h.querySelector('[data-explore-toggle]').click();h.querySelector('[data-explore-toggle]').click();assert.equal(h.querySelector('[data-play]').textContent,'Pause');
  p.seek(1);h.querySelector('[data-explore-toggle]').click();h.querySelector('[data-explore-toggle]').click();assert.equal(h.querySelector('[data-play]').textContent,'Abspielen');
  const check=()=>[...h.querySelectorAll('button')].find(b=>b.textContent==='Prüfen').click();
  p.seek(1);check();p.seek(5);check();h.querySelector('.gf-back').click();assert.match(h.querySelector('.gf-time').textContent,/00:05/);
  p.seek(1);check();h.querySelector('[data-play]').click();d.window._frame(d.window.performance.now()+1700);const now=h.querySelector('.gf-time').textContent;check();h.querySelector('.gf-back').click();assert.equal(h.querySelector('.gf-time').textContent,now,'manual playback leaves the previous question lifecycle');p.dispose();d.window.close();
});
test('ordering and omission require real attempts; reset and reveal are independent',()=>{
  for(const kind of ['order','omit']){
    const {d,h,p}=interactiveFixture({kind,items:['ich','gehe','Deshalb'],accept:kind==='order'?[[2,1,0]]:[[0]],hint:'Versuche es noch einmal.'});
    const action=t=>[...h.querySelectorAll('button')].find(b=>b.textContent===t).click();action('Prüfen');assert.match(h.querySelector('.gf-feedback').textContent,/Noch nicht/);
    const bank=()=>h.querySelector('[aria-label="Satzteile"]');if(kind==='order')for(const i of [2,1,0])bank().children[i].click();else bank().children[0].click();action('Prüfen');assert.match(h.querySelector('.gf-feedback').textContent,/Richtig/);
    action('Neu beginnen');assert.equal(h.querySelector('.gf-feedback').textContent,'');action('Lösung zeigen');assert.match(h.querySelector('.gf-feedback').textContent,/Lösung:/);p.dispose();d.window.close();
  }
});

test('post-timing validation rejects damaged fractions and invalid task indices',()=>{
  const s=setup(),r=V.build(s.a,s.les,null);assert.deepEqual(V.validateReleased(r.visual,s.les).errors,[]);
  r.visual.scenes['t-move'].cues['t-move--1'][1].at=0;assert.match(V.validateReleased(r.visual,s.les).errors.join('\n'),/post-timing fraction/);
  const bad=setup("m.checks['t-move']={origin:'authored-visual-diagnostic',ask:'Test?',answer:'Test.',task:{kind:'order',items:['Test.'],accept:[[5]]}};");assert.match(V.build(bad.a,bad.les,null).errors.join('\n'),/invalid manipulation/);
});
test('semantic pictures are deterministic at intermediate action times',()=>{
  const a={items:[{id:'paint',k:'easel',x:360,y:240,paint:0}],marks:[]},b={items:[{id:'paint',k:'easel',x:360,y:240,paint:1}],marks:[]};
  const at=p=>G.picture(a,b,p,320,139,{idp:'meaning'});assert.notEqual(at(0),at(.5));assert.notEqual(at(.5),at(1));assert.equal(at(.5),at(.5));
  for(const k of ['clock','calendar','train','vase','activityBands'])assert.doesNotMatch(G.picture(null,{items:[{id:'x',k,x:300,y:120,labels:['A','B']}],marks:[]},1,320,139,{idp:'meaning'}),/NaN|undefined|Infinity/);
});

test('glued compound descriptions name one written finite word',()=>{
  const src={examples:{x:{text:'abholt'}}},row={id:'x',ex:'x',tiles:[{id:'v',r:'fin',p:[{x:'x#0.0-2'},{x:'x#0.2-',j:1}]}]};
  assert.equal(G.rowText(src,row),'abholt');assert.match(G.describe(src,{rows:[row]}),/finit: abholt/);assert.doesNotMatch(G.describe(src,{rows:[row]}),/ab holt/);
});

test('explicit word roles split a constituent without losing its example or bracket span',()=>{
  const s=setup("const r=m.cues['t-move--1'][0].rows[0];r.tiles[0].p.push({x:'ex#1'});r.tiles[0].r='fin';r.tiles.splice(1,1);m.wordRoles={'Deshalb gehe':{1:'fin'}};m.cues['t-move--1'][0].br=[{t:['r','a'],l:'Wortgruppe'}];m.cues['t-move--2'][0].rows=[r];m.cues['t-move--2'][0].br=[{t:['r','a'],l:'Wortgruppe'}];");
  const r=V.build(s.a,s.les,null);assert.deepEqual(r.errors,[]);const src=G.registry(lesson(),r.visual),k=r.visual.scenes['t-move'].cues['t-move--1'][0];assert.equal(G.rowText(src,k.s.rows[0]),'Deshalb gehe ich heute weg.');assert.equal(G.rowText(src,{tiles:k.s.rows[0].tiles.filter(t=>t.r==='fin')}),'gehe');assert.deepEqual(k.s.br[0].t,['r','a','aw1']);assert.deepEqual(r.visual.scenes['t-move'].cues['t-move--2'][0].s.br[0].t,['r','a','aw1'],'a reused row retains its complete span in later cues');
});
test('long explanatory chips wrap instead of leaving the phone stage',()=>{
  const s=setup("m.cues['t-move--1'][1].ch=[{t:'Ein längerer Hinweis bleibt auch auf einem schmalen Telefon vollständig lesbar.',k:'rule'}];"),r=V.build(s.a,s.les,null),src=G.registry(lesson(),r.visual);
  const z=G.render(src,sceneOf(r),3,304,{fs:16,measure,margin:12,tlH:106,idp:'chip'});assert.doesNotMatch(z.svg,/>Ein längerer Hinweis bleibt auch auf einem schmalen Telefon vollständig lesbar\.</);assert.match(z.svg,/vollständig lesbar\./);assert.ok(z.H>100);
});
