'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),Film=require('../grammatik/film.js');
const fixture=()=>({version:1,id:'test-film',title:'A meaningful change',level:'B2',scenes:[{id:'location',title:'Ort und Ziel',visual:'space',alt:'A runner remains inside a park.',art:{place:'park',mode:'within'},from:[{id:'p',text:'im Park',role:'recipient'}],to:[{id:'p',text:'in den Park',role:'patient'}],takeaway:'Ask what the spatial phrase expresses.',beats:[{say:'Observe the existing location.',seconds:5,stage:0},{say:'Now the destination becomes relevant.',seconds:7,stage:1}],quiz:{prompt:'Which question names a location?',options:[{text:'Wo?',correct:true,feedback:'Wo asks about location, including motion within it.'},{text:'Wohin?',correct:false,feedback:'Wohin asks for a destination.'}]},variants:[{label:'Destination',art:{place:'park',mode:'goal'},takeaway:'The destination changes the relation.'}]}]});
test('one deterministic timeline drives seeking, recording durations and subtitle cues',()=>{
 const t=Film.compile(fixture(),{'location--1':8,'location--2':12});
 assert.equal(t.duration,20);assert.equal(Film.at(t,7).cue.id,'location--1');assert.equal(Film.at(t,8).cue.id,'location--2');assert.equal(Film.at(t,8).stage,0);assert.equal(Film.at(t,11).stage,1);
 assert.equal(Film.frame(t,9),Film.frame(t,9));assert.notEqual(Film.frame(t,8),Film.frame(t,11));assert.match(Film.vtt(t),/00:00:08.000 --> 00:00:20.000/);
 assert.equal(Film.manifest(t).cues[1].audio,'location--2.mp3');
 assert.match(Film.vtt(t,{start:9,end:13}),/00:00:00.000 --> 00:00:04.000/);
});
test('invalid grammar roles, unsafe audio ids, absent narration and ambiguous answers fail closed',()=>{
 for(const mutate of [f=>f.scenes[0].id='../escape',f=>f.scenes[0].from[0].role='guess',f=>f.scenes[0].beats=[],f=>f.scenes[0].beats[1].stage=-1,f=>f.scenes[0].quiz.options[1].correct=true]){const f=fixture();mutate(f);assert.throws(()=>Film.compile(f));}
 assert.throws(()=>Film.compile(fixture(),{'location--1':NaN}));
});
test('frame text is escaped, has a text alternative, and never relies on looping CSS or picture inference',()=>{
 const f=fixture();f.scenes[0].title='<img src=x onerror=bad()>';const t=Film.compile(f),svg=Film.frame(t,9);
 assert.match(svg,/&lt;img/);assert.doesNotMatch(svg,/<img/);assert.match(svg,/<title>/);assert.match(svg,/<desc>/);assert.doesNotMatch(svg,/<animate|@keyframes|<script|foreignObject/);
 assert.match(Film.frame(t,9,{compact:true}),/viewBox="0 0 900 1190"/);
});
function dom(){const d=new JSDOM('<main><div id="host"></div></main>',{runScripts:'outside-only',pretendToBeVisual:true});d.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});d.window.eval(fs.readFileSync(path.join(__dirname,'../grammatik/film.js'),'utf8'));return d;}
test('page activity uses native controls, gives reasons and leaves graded exercises alone',()=>{
 const d=dom(),host=d.window.document.getElementById('host'),p=d.window.GRAM_FILM.mount(host,fixture());
 assert.equal(host.querySelector('[data-play]').textContent,'Abspielen');assert.equal(host.querySelectorAll('svg [tabindex]').length,0);assert.equal(host.querySelectorAll('input[type=range]').length,2);
 assert.ok(host.querySelector('.gf-production').hidden,'learner pages must not show production/export controls');
 const buttons=[...host.querySelectorAll('.gf-options button')],wrong=buttons.find(b=>b.textContent==='Wohin?');wrong.click();assert.match(host.querySelector('.gf-feedback').textContent,/destination/);assert.equal(wrong.getAttribute('data-correct'),'false');
 buttons.find(b=>b.textContent==='Wo?').click();assert.match(host.querySelector('.gf-feedback').textContent,/motion within/);
 assert.equal(host.querySelectorAll('.gr-it').length,0);p.dispose();assert.equal(host.childNodes.length,0);d.window.close();
});
test('interactive variants use the same frame renderer and a user-controlled stage',()=>{
 const d=dom(),h=d.window.document.getElementById('host'),p=d.window.GRAM_FILM.mount(h,fixture());
 h.querySelector('.gf-options button').click();const r=h.querySelector('[aria-label="Veränderung untersuchen"]');r.value=1;r.dispatchEvent(new d.window.Event('input'));assert.match(h.querySelector('svg').outerHTML,/Wohin/);assert.match(h.querySelector('.gf-caption').textContent,/destination/);p.dispose();d.window.close();
});
test('an imported recording controls playback time and is revoked on disposal',async()=>{
 const d=dom(),w=d.window,instances=[],revoked=[],pending=new Map();let frameId=0;
 w.URL.createObjectURL=()=> 'blob:local-voice';w.URL.revokeObjectURL=u=>revoked.push(u);
 w.requestAnimationFrame=fn=>{pending.set(++frameId,fn);return frameId;};w.cancelAnimationFrame=id=>pending.delete(id);
 w.Audio=class {constructor(src){this.currentTime=0;this.duration=6;instances.push(this);if(src)this.src=src;}set src(v){this._src=v;setTimeout(()=>this.onloadedmetadata?.(),0);}get src(){return this._src;}play(){return Promise.resolve();}pause(){this.paused=true;}removeAttribute(){this._src='';}load(){}};
 const h=w.document.getElementById('host'),p=w.GRAM_FILM.mount(h,fixture(),{production:true}),input=h.querySelector('[data-audio]');Object.defineProperty(input,'files',{value:[{name:'location--1.mp3'}]});input.dispatchEvent(new w.Event('change'));await new Promise(r=>setTimeout(r,20));
 assert.equal(p.timeline.duration,13);h.querySelector('[data-play]').click();const tick=()=>{const [id,fn]=pending.entries().next().value;pending.delete(id);fn(999999);};tick();instances.at(-1).currentTime=3;tick();assert.equal(+h.querySelector('input[type=range]').value,3,'wall clock must not outrun the recording');
 p.dispose();assert.equal(pending.size,0);assert.deepEqual(revoked,['blob:local-voice']);d.window.close();
});
test('private film build preserves exercises and refuses to overwrite a linked source directory',()=>{
 const {build}=require('../tools/build-film-lessons.cjs'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dk-film-'));
 try{const src=path.join(tmp,'source'),dst=path.join(tmp,'out');fs.mkdirSync(src);const lesson={n:1,level:'B2',understand:[],exercises:[{id:'existing',type:'type',items:[{q:'a',ok:['b']}]}]};fs.writeFileSync(path.join(src,'k1.js'),'GRAM.add({...'+JSON.stringify(lesson)+',answer:()=>GRAM.kit.answer});');const story=fixture();story.n=1;const scripts=path.join(tmp,'stories.cjs');fs.writeFileSync(scripts,'module.exports='+JSON.stringify({1:story})+';');
 const before=fs.readFileSync(path.join(src,'k1.js'),'utf8');build(src,scripts,dst);let result;vm.runInNewContext(fs.readFileSync(path.join(dst,'k1.js'),'utf8'),{GRAM:{kit:{answer:'preserved'},add:x=>{result=x;}}});assert.equal(JSON.stringify(result.exercises),JSON.stringify(lesson.exercises));assert.equal(result.answer(),'preserved');assert.equal(fs.readFileSync(path.join(src,'k1.js'),'utf8'),before);
 const linked=path.join(tmp,'linked');fs.symlinkSync(src,linked);assert.throws(()=>build(src,scripts,linked),/symlink/);assert.throws(()=>build(src,scripts,src),/separate/);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test('added picture families render escaped, deterministic SVG at every stage, on desktop and phone',()=>{
 const tok=[{id:'a',text:'<b>Ich</b>',role:'agent'},{id:'v',text:'komme',role:'verb'}];
 const arts={slots:{a:['Ich','komme','','mit',''],b:['','Kommst','du','mit?',''],fields:['V','2','M','E','N']},timeline:{label:'<x>',events:[{text:'früher',at:.2},{text:'jetzt',at:.8,late:true}],now:.8,span:[.2,.8],arrow:[0,1],arrowLabel:'danach'},scale:{items:['kann','muss'],source:0,target:1,ends:['a','b']},link:{kind:'concession',word:'obwohl',left:'Es regnet.',right:'Wir gehen.'},group:{label:'Sortieren',groups:['A','B'],items:[{text:'x',g:0},{text:'y',g:1}]},imagine:{real:'Kein Geld.',dream:'Wenn ich Geld hätte …'},route:{kind:'room',place:'Supermarkt',mode:'to',label:'Wohin?'}};
 const story={version:1,id:'families',title:'Families',level:'C1',scenes:Object.entries(arts).map(([visual,art])=>({id:'s-'+visual,title:visual,visual,alt:visual,art,from:tok,to:tok,beats:[{say:'Beobachten.',seconds:4,stage:0},{say:'Verändern.',seconds:4,stage:1}]}))};
 const t=Film.compile(story);
 for(const scene of story.scenes)for(const stage of [0,.5,1])for(const compact of [false,true]){
  const svg=Film.frame(t,0,{scene,stage,compact});
  assert.doesNotMatch(svg,/NaN|undefined|<b>|<animate|@keyframes/,scene.visual);assert.match(svg,/&lt;b&gt;Ich/);
  assert.equal(svg,Film.frame(t,0,{scene,stage,compact}),'same input, same frame');
 }
 assert.notEqual(Film.frame(t,0,{scene:story.scenes[1],stage:0}),Film.frame(t,0,{scene:story.scenes[1],stage:1}),'the stage changes the picture');
 for(const v of ['slots','timeline','scale','link','group','imagine','route'])assert.ok(Film.visuals.includes(v));
});
