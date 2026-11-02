const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const {JSDOM,ResourceLoader,VirtualConsole} = require('jsdom');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file));
const core=zlib.gunzipSync(read('core.bin')), defs=zlib.gunzipSync(read('defs.bin'));
async function until(check) {
  for(let i=0;i<100;i++){if(check())return;await new Promise(r=>setTimeout(r,15));}
  throw new Error('page did not reach the expected state');
}
async function site(hash='',options={}) {
  const calls=[],errors=[];
  class Resources extends ResourceLoader {
    fetch(url) {
      calls.push(new URL(url).pathname);
      return Promise.resolve(new URL(url).hostname==='site.test'?read(decodeURIComponent(new URL(url).pathname.slice(1))):Buffer.from(''));
    }
  }
  const dom=new JSDOM(read('index.html'),{url:'https://site.test/'+hash,runScripts:'dangerously',resources:new Resources(),
    virtualConsole:new VirtualConsole().on('jsdomError',e=>{if(!e.message.includes('HTMLCanvasElement'))errors.push(e.message)}),
    beforeParse(w){
      w.requestAnimationFrame=callback=>w.setTimeout(()=>callback(Date.now()),16);
      w.cancelAnimationFrame=w.clearTimeout;
      w.scrollTo=()=>{};w.matchMedia=()=>({matches:false});w.TextDecoder=TextDecoder;w.TextEncoder=TextEncoder;w.crypto.randomUUID=require('node:crypto').randomUUID;w.structuredClone=structuredClone;
      w.fetch=async(url,request={})=>{
        const u=new URL(url,w.location.href);calls.push(u.pathname);
        if(u.hostname==='site.test'){
          if(u.pathname.endsWith('core.bin'))return new Response(core);
          if(u.pathname.endsWith('defs.bin'))return options.definitions?.()||new Response(defs);
        }
        if(u.pathname==='/entries')return new Response('[]');
        if(u.pathname==='/entry')return options.entry?.(request)||new Response('{}',{status:404});
        if(u.pathname.includes('site_settings'))return new Response(JSON.stringify([{features:options.features||{},welcome:{}}]));
        if(u.pathname.includes('profiles'))return options.profile?.()||new Response(JSON.stringify([{user_id:'fixture',role:'learner',unlocked:['B1'],level:'B1'}]));
        if(u.pathname.includes('grammar_results'))return options.results?.(u)||new Response('[]');
        if(u.pathname.includes('user_data'))return new Response('[]');
        return new Response('[]');
      };
      if(options.features)w.localStorage.setItem('gd_site',JSON.stringify({features:options.features}));
      if(options.account)w.localStorage.setItem('gd_session',JSON.stringify({expires_at:Date.now()/1000+3600,access_token:'offline',user:{id:'fixture',email:'fixture@example.invalid'}}));
    }});
  await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
  await until(()=>dom.window.KONTO);
  return {window:dom.window,document:dom.window.document,calls,errors,close:async()=>{await new Promise(r=>setTimeout(r,30));dom.window.close()}};
}
test('welcome skips dictionary and grammar and a slow search preserves the typed word',async()=>{
  const s=await site();try{
    await until(()=>s.document.querySelector('.kd-look'));
    assert.ok(!s.calls.some(p=>/\.bin$|grammatik\//.test(p)));
    s.window.KONTO.lookup('Haus');
    await until(()=>s.document.querySelector('#q')?.value==='Haus');
    assert.ok(s.document.querySelector('#sug li'));
    assert.ok(s.calls.includes('/core.bin'));assert.ok(!s.calls.includes('/defs.bin'));
    assert.deepEqual(s.errors,[]);
  }finally{await s.close()}
});
test('the sign-in dialog has labels, traps focus and restores focus on Escape',async()=>{
  const s=await site('#/start');try{
    const opener=s.document.querySelector('#acct');opener.focus();opener.click();
    const sheet=s.document.querySelector('#sheet');
    assert.equal(sheet.getAttribute('role'),'dialog');
    assert.ok(s.document.querySelector('label[for="ac_em"]'));
    assert.ok(s.document.querySelector('label[for="ac_pw"]'));
    const buttons=sheet.querySelectorAll('button');buttons[buttons.length-1].focus();
    s.document.dispatchEvent(new s.window.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));
    assert.equal(s.document.activeElement,sheet.querySelector('button'));
    s.document.dispatchEvent(new s.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    assert.equal(s.document.querySelector('#modal').getAttribute('aria-hidden'),'true');
    assert.equal(s.document.activeElement,opener);
    assert.equal(s.document.documentElement.lang,'en');
  }finally{await s.close()}
});
test('failed definitions settle, show retry and recover on the next click',async()=>{
  let n=0;const s=await site('#/w/Haus',{definitions:()=>new Response(++n===1?'':defs,{status:n===1?503:200})});
  try{
    await until(()=>s.document.querySelector('#view .empty button'));
    s.document.querySelector('#view .empty button').click();
    await until(()=>s.document.querySelector('.entry'));
    assert.equal(n,2);assert.ok(s.document.querySelector('.def').textContent.includes('Haus'));
    assert.equal(s.document.querySelector('.entry h1').textContent.replace(/·/g,''),'Haus');
    assert.match(s.document.title,/Haus/);
    assert.equal(s.document.querySelectorAll('.def > ol > li.ds').length,3);
    assert.ok(s.document.querySelector('.more-senses summary'));
    assert.deepEqual(s.errors,[]);
  }finally{await s.close()}
});
test('course overview, contents and progress need no full chapter or dictionary',async()=>{
  const s=await site('#/v',{features:{vocab:'everyone'}});try{
    await until(()=>s.document.querySelector('#grlist .gr-row[data-n]'));
    s.document.querySelector('.gr-exp').click();
    assert.ok(s.document.querySelector('.gr-cl a'));
    assert.ok(!s.calls.some(p=>/k\d+\.js$|\.bin$/.test(p)));
    s.window.location.hash='#/v/fortschritt';
    await until(()=>s.document.querySelector('.gr-ptab'));
    assert.ok(!s.calls.some(p=>/k\d+\.js$|\.bin$/.test(p)));
    s.window.location.hash='#/v/201';
    await until(()=>s.document.querySelector('.gr-ch'));
    assert.deepEqual(s.calls.filter(p=>/k\d+\.js$/.test(p)),['/grammatik/k201.js']);
    assert.deepEqual(s.errors,[]);
  }finally{await s.close()}
});
test('result history follows stable cursors even when the API caps each response',async()=>{
  const rows=Array.from({length:5010},(_,i)=>({id:i+1,chapter:1,exercise:'u1',score:1,total:1}));
  const s=await site('#/settings',{account:true,results:url=>{
    const after=Number(url.searchParams.get('id').slice(3));
    return new Response(JSON.stringify(rows.filter(row=>row.id>after).slice(0,100)));
  }});
  try{
    const all=await s.window.ACCT.resultRows('&user_id=eq.fixture');
    assert.equal(all.length,5010);assert.equal(all[5009].id,5010);
    assert.deepEqual(s.errors,[]);
  }finally{await s.close()}
});
test('an AI suggestion awaiting review stays off the public dictionary',async()=>{
  const s=await site('#/',{account:true,entry:request=>{
    assert.match(request.headers.Authorization,/^Bearer /);
    return new Response('{"pending":true}',{status:202});
  }});
  try{
    await until(()=>s.document.querySelector('#q'));
    await s.window.createAI('Testvorschlag');
    assert.match(s.document.querySelector('#view').textContent,/Submitted for review/);
    assert.equal(s.document.querySelector('.entry'),null);
  }finally{await s.close()}
});
test('failed profiles close enrolled content and retry restores only enrolled levels',async()=>{
  let broken=true;const s=await site('#/v',{account:true,profile:()=>broken?new Response('{"message":"offline"}',{status:503}):new Response('[{"user_id":"fixture","role":"learner","unlocked":["B1"],"level":"B1"}]')});
  try{
    await until(()=>s.document.querySelector('.kd-gate button'));
    assert.equal(s.window.KONTO.can('vocab'),false);assert.equal(s.window.KONTO.canOpen('A1'),false);
    broken=false;await s.window.KONTO.reload();
    await until(()=>s.document.querySelector('#grlist'));
    assert.equal(s.window.KONTO.canOpen('B1'),true);assert.equal(s.window.KONTO.canOpen('A1'),false);
    assert.deepEqual(s.errors,[]);
  }finally{await s.close()}
});
