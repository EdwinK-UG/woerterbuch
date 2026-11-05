// Run every private native task through the actual submit handler without publishing lesson bodies.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'.local/grammar-native/chapters');
let count=0,groups=0,points=0;
for(const file of fs.readdirSync(dir).filter(n=>/\.json$/.test(n)).sort()){
 const authored=JSON.parse(fs.readFileSync(path.join(dir,file)));let lesson;require('node:vm').runInNewContext(fs.readFileSync(path.join(root,'.local/lessons/k'+authored.n+'.js'),'utf8'),{GRAM:{add:c=>lesson=c}});const dom=new JSDOM('<main id="view"></main>',{url:'https://native.test/',runScripts:'outside-only'}),w=dom.window;
 try{
  w.V=()=>w.document.getElementById('view');w.matchMedia=()=>({matches:true});w.crypto.randomUUID=require('node:crypto').randomUUID;w.ACCT={user:()=>({id:'native-check'})};
  w.eval(fs.readFileSync(path.join(root,'grammatik/illustrations.js'),'utf8'));w.eval(fs.readFileSync(path.join(root,'grammatik/grammatik.js'),'utf8'));
  w.GRAM._test.render(lesson);
  assert.equal(w.document.querySelectorAll('img').length,0,'source-page images must not be rendered');
  for(const x of lesson.exercises){const box=w.document.getElementById('ue-'+x.id);assert.ok(box,x.id+' missing');
   box.querySelectorAll('.gr-it').forEach((el,i)=>{const it=x.items[i];
    if(x.type==='type')el.querySelector('input,textarea').value=it.ok[0];
    else if(x.type==='select')el.querySelectorAll('input').forEach(input=>{input.checked=it.ok.includes(it.options[+input.value])});
    else if(x.type==='choice')el.querySelectorAll('.gr-gap').forEach(gap=>[...gap.querySelectorAll('button')].find(b=>b.textContent===gap.dataset.ok).click());
    else if(x.type==='fill')el.querySelectorAll('.gr-fill').forEach(input=>{input.value=JSON.parse(input.dataset.ok)[0]});
    else if(x.type==='match')el.querySelector('select').value=String.fromCharCode(97+x._opts.indexOf(it.r));
    else if(x.type==='order'){let rest=it.ok[0];while(rest){const tile=[...el.querySelectorAll('.gr-pool .gr-tile')].filter(t=>rest===t.textContent||rest.startsWith(t.textContent+' ')).sort((a,b)=>b.textContent.length-a.textContent.length)[0];assert.ok(tile,x.id+' item '+(i+1)+' cannot be built');tile.click();rest=rest.slice(tile.textContent.length).trim()}assert.equal(el.querySelector('.gr-pool').children.length,0)}
    else throw new Error('Verifier not yet implemented for '+x.type);
   });
   box.querySelector('[data-act=check]').click();const attempt=w.GRAM._test.attempts().at(-1);assert.equal(attempt?.ex,x.id);const total=x.perGap?x.items.reduce((n,it)=>n+(it.match(x.type==='fill'?/\[\[/g:/\(\(/g)||[]).length,0):x.items.length;assert.equal(attempt.score,total,x.id+' rejects its answer key');assert.equal(attempt.total,total);points+=total;assert.equal(attempt.uid,'native-check');groups++;count+=x.items.length;
  }
 }finally{dom.window.close()}
}
console.log(`Verified ${groups} native exercise groups and ${count} submitted questions (${points} answer points) through the real grading UI.`);
