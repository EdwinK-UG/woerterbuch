const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
function fixture(n=38){return {n:261,title:'Fixture word world',vocabularyVersion:2,words:Array.from({length:n},(_,i)=>({id:'fixture-'+i,term:i===0?'den Faden verlieren':'Wort '+i,article:'',group:i<19?'Gruppe A':'Gruppe B',pos:'phrase',en:['meaning '+i],forms:[],examples:[{de:'Dies ist der belegte Kontext für Wort '+i+'.',en:'Fixture translation '+i,source:{kind:'corpus',title:'Fixture, not a real corpus sentence',url:'https://fixture.invalid/'+i,author:'Fixture'}}]})),exercises:[{id:'c1v2-fixture',title:'Fixture round',mode:'meaning',wordIds:['fixture-0','fixture-1','fixture-2']}]} }
function setup(c=fixture(),bridge={}){const dom=new JSDOM('<main id="view"></main>',{url:'https://preview.invalid/#/v/261',runScripts:'outside-only'}),w=dom.window;w.eval(fs.readFileSync('grammatik/vocabulary-art.js','utf8'));w.eval(fs.readFileSync('grammatik/vocabulary.js','utf8'));const host=w.document.querySelector('main'),instance=w.C1_VOCAB.mount(host,c,bridge);return {dom,w,host,instance};}
test('all means the entire chapter, including words beyond the first page; subset cards preserve phrases and examples',async()=>{
 let received;const {dom,w,host,instance}=setup(fixture(),{cards:es=>received=es});try{
  assert.equal(host.querySelectorAll('.vw-tile').length,24);
  host.querySelector('[data-vact="all"]').click();assert.equal(instance.state.selected.size,38);
  host.querySelector('[data-vact="cards"]').click();assert.equal(received.length,38);
  host.querySelector('[data-vact="none"]').click();host.querySelector('[data-vpick="fixture-0"]').click();
  host.querySelector('[data-vact="cards"]').click();assert.equal(received.length,1);assert.equal(received[0].term,'den Faden verlieren');assert.ok(received[0].examples[0].source.url);assert.equal(received[0].version,2);
  const selected=w.C1_VOCAB.selected(fixture(),['fixture-0']);assert.equal(selected.length,1);
 }finally{dom.window.close()}
});
test('one click adds a word to the game; selected games never silently expand to the whole chapter',()=>{
 let received;const {dom,w,host,instance}=setup(fixture(),{game:ids=>received=ids});try{
  host.querySelector('[data-vgame="fixture-0"]').click();assert.equal(instance.state.game.size,1);
  host.querySelector('[data-vact="play"]').click();assert.deepEqual([...received],['fixture-0']);
  const qs=w.C1_VOCAB.questions(fixture(),['fixture-0'],20);assert.equal(qs.length,1);assert.equal(qs[0].wordId,'fixture-0');
  assert.equal(w.C1_VOCAB.questions(fixture(),['nonexistent'],20).length,0);
 }finally{dom.window.close()}
});
test('a completed submitted round stores the real score exactly once; skipped or empty answers earn no points',()=>{
 const records=[];const {dom,w,host,instance}=setup(fixture(),{record:a=>records.push(a)});try{
  host.querySelector('[data-vact="learn"]').click();host.querySelector('[data-vact="check-answer"]').click();assert.equal(records.length,0);assert.equal(instance.state.round.answers.length,0);
  for(let i=0;i<3;i++){
   const q=instance.state.round.qs[i];
   if(i===0){if(q.t==='mc')host.querySelector('input[value="'+q.c+'"]').checked=true;else host.querySelector('input[name="answer"]').value=q.ans[0];host.querySelector('[data-vanswer]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}))}
   else host.querySelector('[data-vact="skip-answer"]').click();
   assert.equal(instance.state.round.answers.length,i+1);host.querySelector('[data-vact="next-answer"]').click();
  }
  assert.equal(records.length,1);assert.equal(records[0].score,1);assert.equal(records[0].total,3);assert.equal(records[0].passed,false);assert.equal(host.querySelector('h1').textContent,'1 von 3');
 }finally{dom.window.close()}
});
test('cloze answers are exact attested forms, umlaut transliteration is accepted, and front cards do not leak the target',()=>{
 const {dom,w}=setup();try{
  const e={id:'x',term:'humpeln',article:'',en:['limp'],forms:['humpelte'],examples:[{de:'Die Person humpelte nach Hause.',source:{url:'https://fixture.invalid/context'}}]};
  const q=w.C1_VOCAB.questions({words:[e]},['x'],1,'context')[0];assert.equal(q.p,'Die Person _____ nach Hause.');assert.deepEqual([...q.ans],['humpelte']);assert.equal(w.C1_VOCAB.grade(q,'humpeln'),false);assert.equal(w.C1_VOCAB.grade(q,'humpelte'),true);
  assert.equal(w.C1_VOCAB.grade({t:'type',ans:['Größe']},'Groesse'),true);
  for(const empty of ['',null,undefined,false])assert.equal(w.C1_VOCAB.grade({t:'mc',c:0},empty),false);
  const front=w.C1_VOCAB.cardHTML({...e,term:'GEHEIMES-ZIEL'},false);assert.doesNotMatch(front,/GEHEIMES-ZIEL|humpelte/);
 }finally{dom.window.close()}
});
test('source links are safe and a first tap opens an illustrated, accessible dialog',()=>{
 const c=fixture();c.words[0].term='<img src=x onerror=alert(1)>';const {dom,w,host}=setup(c);try{
  host.querySelector('[data-vopen="fixture-0"]').click();const d=host.querySelector('dialog');assert.ok(d);assert.ok(d.querySelector('svg.va-art'));assert.equal(d.querySelectorAll('img').length,0);assert.ok(d.querySelector('h2').textContent.includes('<img'));
  const unsafe=w.C1_VOCAB.sourceHTML({url:'javascript:alert(1)',title:'<script>bad</script>'});assert.doesNotMatch(unsafe,/href=|<script>/);
  d.querySelector('[data-vclose]').click();assert.equal(host.querySelector('dialog'),null);
  w.C1_VOCAB.leave();assert.equal(host.querySelector('dialog'),null);
 }finally{dom.window.close()}
});
test('course-native cards use the existing deck persistence and scheduler without a dictionary entry',()=>{
 const html=fs.readFileSync('index.html','utf8'),ctx=vm.createContext({requireFeature:()=>true,assertWritable(){},decks:{},uid:()=> 'new-deck',now:()=>Date.now(),saveDecks(){ctx.saved=true},toast(){},go:p=>ctx.destination=p});
 const scheduler=html.slice(html.indexOf('function newCard()'),html.indexOf('function dueQueue('));vm.runInContext(scheduler,ctx);
 const create=html.slice(html.indexOf('function createVocabularyDeck('),html.indexOf('async function renderVocabularyCard('));vm.runInContext(create,ctx);
 const payload={version:2,id:'fixture-idiom',term:'den Faden verlieren',en:['lose the thread'],examples:[]};ctx.payload=payload;vm.runInContext('createVocabularyDeck({n:261,title:"Fixture"},[payload])',ctx);
 const card=ctx.decks['new-deck'].cards['@c1/fixture-idiom'];assert.equal(card.vocabulary.term,payload.term);assert.equal(card.state,'new');assert.equal(ctx.saved,true);assert.equal(ctx.destination,'study/new-deck');
 ctx.card=card;vm.runInContext('grade(card,2)',ctx);assert.equal(card.vocabulary.id,payload.id);assert.ok(card.due>0);
});
test('all private C1 chapters cover every entry in meaning and context rounds, with real source provenance',t=>{
 const path='.local/c1-vocabulary/chapters.json';if(!fs.existsSync(path)){t.skip('Private editorial archive is not restored');return}
 const cs=JSON.parse(fs.readFileSync(path)),ids=new Set(),sourceIds=new Set();assert.equal(cs.length,13);
 for(let i=0;i<13;i++){
  const c=cs[i];assert.equal(c.n,261+i);assert.ok(c.words.length>=75);
  const meaning=new Set(c.exercises.filter(x=>x.mode==='meaning').flatMap(x=>x.wordIds)),context=new Set(c.exercises.filter(x=>x.mode==='context').flatMap(x=>x.wordIds));
  for(const e of c.words){assert.ok(!ids.has(e.id));ids.add(e.id);for(const id of e.sourceEntries)sourceIds.add(id);assert.ok(e.examples[0].en,e.id+' has no English context translation');assert.ok(e.en?.length,e.id+' has no meaning');assert.ok(e.examples?.length,e.id+' has no authentic context');assert.ok(e.examples[0].source.url.startsWith('https://'));assert.ok(e.page>0);assert.ok(meaning.has(e.id));assert.ok(context.has(e.id))}
 }
 assert.equal(ids.size,1268);assert.equal(sourceIds.size,1270);
 const words=cs.flatMap(c=>c.words),byId=Object.fromEntries(words.map(e=>[e.id,e]));
 assert.equal(byId['c1-02-077'].article,'die');assert.equal(byId['c1-05-041'].article,'die');
 assert.deepEqual(byId['c1-13-004'].forms,['Gehälter']);
 assert.match(byId['c1-10-037'].examples[0].de,/zur Urne gehen/);
 assert.match(byId['c1-07-080'].examples[0].de,/schloss ich/);
 assert.match(byId['c1-13-005'].examples[0].de,/erhielt keine Heuer/);
 assert.equal(byId['c1-04-103b'].term,'unverdaulich');
});
test('native card decks become game questions and an account switch cancels an in-flight build',async()=>{
 const html=fs.readFileSync('index.html','utf8'),code=html.slice(html.indexOf('async function buildQs(s)'),html.indexOf('/* ---------- scoring ---------- */'));
 const native={version:2,id:'native-id',term:'humpeln',en:['limp'],examples:[]};let owner='owner-a',release;
 const ctx=vm.createContext({window:{ACCT:{user:()=>({id:owner})},C1_VOCAB:{questions:c=>c.words.map(e=>({t:'type',p:e.en[0],ans:[e.term]}))}},decks:{deck:{cards:{'@c1/native-id':{vocabulary:native}}}},loadVocabulary:()=>new Promise(r=>release=r),poolFor:()=>[],DUR:{type:20}});
 vm.runInContext(code,ctx);let pending=vm.runInContext('buildQs({src:"deck",id:"deck",n:10})',ctx);release();let questions=await pending;assert.equal(questions.length,1);assert.equal(questions[0].ans[0],'humpeln');
 pending=vm.runInContext('buildQs({src:"deck",id:"deck",n:10})',ctx);owner='owner-b';release();assert.equal((await pending).length,0);
});
test('illustration classification respects whole-word senses instead of accidental substrings',()=>{
 const art=require('../grammatik/vocabulary-art.js');
 for(const [term,en,kind]of [['Schaukelstuhl','rocking chair','furniture'],['Maschinen','machines','machine'],['Reederei','shipping company','transport'],['futtern','eat heartily','eat'],['Lebenserwartung','life expectancy, lifespan','population'],['konstant','constant, stable','flat'],['labil','unstable','volatile'],['Trugschluss','fallacy','logic']])assert.equal(art.spec({term,en:[en]}).kind,kind,term);
 assert.notEqual(art.draw({term:'Eckbank',en:['corner bench']}),art.draw({term:'Schaukelstuhl',en:['rocking chair']}));
});
test('recognition does not use a synonymous flock gloss as an incorrect alternative',()=>{
 const c=fixture(4);c.words[0].en=['flock or crowd'];c.words[1].en=['herd; flock'];c.words[2].en=['river'];c.words[3].en=['mountain'];const {dom,w}=setup(c);try{const q=w.C1_VOCAB.questions(c,[c.words[0].id],1,'meaning')[0];assert.equal(q.t,'mc');assert.ok(!q.o.includes('herd; flock'));assert.ok(q.o.includes('flock or crowd'));}finally{dom.window.close()}
});
