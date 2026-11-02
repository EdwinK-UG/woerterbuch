const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const index = fs.readFileSync('index.html','utf8');
const script = [...index.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes("const SKEY='gd_session'"));
const source = fs.readFileSync('js/study-sync.js','utf8') + '\n' +
  script.slice(0,script.indexOf('/* header button')) + 'window.account={afterLogin,push,endSession};})();';
function server(){
  let row=null;
  return {get row(){return row}, old:false, async request(url,req){
    const json=(value,status=200)=>({ok:status<400,status,text:async()=>JSON.stringify(value)});
    if(this.old && !url.includes('select=*'))return json({code:'42703',message:'old schema'},400);
    if(req.method==='GET')return json(row?[row]:[]);
    const value=JSON.parse(req.body);
    if(req.method==='POST'&&row)return json({code:'23505'},409);
    if(req.method==='PATCH'&& !url.endsWith('revision=eq.'+row.revision))return json([]);
    row={...value,revision:(row?.revision??-1)+1};return json([{revision:row.revision}]);
  }};
}
function device(db,store=new Map()){
  store.set('gd_session',{expires_at:Date.now()/1000+3600,user:{id:'me'},access_token:'offline'});
  const nothing=()=>{};
  const ctx={structuredClone,console,Event:class{},CustomEvent:class{},URLSearchParams, setTimeout:()=>1,clearTimeout:nothing,
    lists:{},decks:{},prefs:{},saveLists:nothing,saveDecks:nothing,savePrefs:nothing,closeSheet:nothing,toast:nothing,confirm:()=>true,
    location:{origin:'https://offline.test',pathname:'/',hash:'#/start'},document:{getElementById:()=>null},window:{dispatchEvent:nothing},
    fetch:db.request.bind(db), LS:{get:(k,v)=>store.has(k)?structuredClone(store.get(k)):v,set:(k,v)=>store.set(k,structuredClone(v))},
    localStorage:{setItem:(k,v)=>store.set(k,JSON.parse(v)),removeItem:k=>store.delete(k)}};
  vm.runInNewContext(source,ctx);
  return Object.assign(ctx,ctx.window.account,{store});
}
test('independent devices retain list, deck and quiz changes across sign-out',async()=>{
  const db=server(),a=device(db),b=device(db);
  await Promise.all([a.afterLogin(false),b.afterLogin(false)]);
  a.lists.list={name:'A',words:['Haus']};a.saveLists();
  b.decks.deck={name:'B'};b.prefs.quizzes={mine:{title:'Quiz'}};b.savePrefs();
  await Promise.all([a.push(),b.push()]);
  a.endSession();const c=device(db,a.store);await c.afterLogin(false);
  assert.equal(c.lists.list.words[0],'Haus');assert.equal(c.decks.deck.name,'B');assert.equal(c.prefs.quizzes.mine.title,'Quiz');
});
test('an incompatible schema retains pending quizzes through sign-out and upgrade',async()=>{
  const db=server();db.old=true;const a=device(db);await a.afterLogin(false);
  a.prefs.quizzes={mine:{title:'recover me'}};a.savePrefs();await a.push();a.endSession();
  assert.equal(a.store.get('gd_cache_me').dirty,true);assert.equal(a.prefs.quizzes,undefined);
  db.old=false;const b=device(db,a.store);await b.afterLogin(false);assert.equal(db.row.prefs.quizzes.mine.title,'recover me');
});
test('concurrent edits to the same field require an explicit choice',async()=>{
  const db=server(),a=device(db);await a.afterLogin(false);
  a.lists.x={name:'initial',words:[]};a.saveLists();await a.push();
  const b=device(db);await b.afterLogin(false);
  a.lists.x.name='phone';a.saveLists();await a.push();
  b.lists.x.name='laptop';b.lists.x.words=['Tag'];b.saveLists();await b.push();
  assert.equal(db.row.lists.x.name,'phone');assert.equal(b.store.get('gd_cache_me').dirty,true);
  await b.push('server');assert.equal(db.row.lists.x.name,'phone');assert.equal(db.row.lists.x.words[0],'Tag');
});
