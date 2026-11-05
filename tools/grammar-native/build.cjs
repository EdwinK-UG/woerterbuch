// Compile authored native lessons; never publishes the source document or generated lesson bodies.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),directory=path.join(root,'.local/grammar-native/chapters'),index=JSON.parse(fs.readFileSync(path.join(__dirname,'source-index.json')));
const lessons=fs.readdirSync(directory).filter(n=>/^\d{3}-(B2|C1|Liste)\.json$/.test(n)).sort().map(n=>JSON.parse(fs.readFileSync(path.join(directory,n))));
const ready=[];
for(const lesson of lessons){
 const source=lesson.source?.reference?index.references.find(c=>c.id===lesson.source.reference):index.chapters.find(c=>c.sourceChapter===lesson.source?.chapter);assert.ok(source,'unknown source unit');assert.equal(source.ids?source.ids[lesson.level]:source.id,lesson.n);
 assert.ok(lesson.understand.length&&lesson.exercises.length&&lesson.scene);
 for(const block of lesson.understand){assert.ok(block.type==='merk'||block.scene||(block.type==='scenes'&&block.items.every(item=>item.scene)),'every concept needs a native illustration: '+lesson.n+' '+block.title);if(block.type==='note')assert.ok(!/<\/?[a-z]/i.test(block.text),'use native emphasis markup in notes');}
 const ids=new Set();
 for(const exercise of lesson.exercises){assert.ok(!ids.has(exercise.id));ids.add(exercise.id);assert.ok(['type','order','fill','choice','match','cases','select'].includes(exercise.type),'requires a graded native exercise: '+exercise.id);assert.notEqual(exercise.graded,false);assert.ok(exercise.items.length);if(['type','select'].includes(exercise.type))for(const item of exercise.items){assert.ok(item.ok?.length&&item.ok.every(a=>typeof a==='string'&&a.trim()));if(exercise.type==='select')assert.ok(new Set(item.options).size===item.options.length&&item.ok.every(a=>item.options.includes(a)));}}
 const body=JSON.stringify(lesson,null,2);assert.ok(!/sourceCourse|grammar-source\/|\.webp|data:image|\.pdf/.test(body),'source-page content cannot enter a native lesson');
 fs.writeFileSync(path.join(root,'.local/lessons/k'+lesson.n+'.js'),'// Authored native lesson: source unit '+(source.sourceChapter||source.id)+' · '+lesson.level+'\nGRAM.add('+body+');\n');ready.push(lesson.n);
}
const groups=[];
for(const level of ['B2','C1'])for(const chapter of index.chapters){if(!chapter.ids[level])continue;let group=groups.find(g=>g.lv===level&&g.t===chapter.group+' · '+level);if(!group){group={t:chapter.group+' · '+level,ic:'book-open',h:level==='B2'?40:160,adv:true,lv:level,ch:[]};groups.push(group)}group.ch.push([chapter.ids[level],chapter.title,'',level]);}
const file=path.join(root,'grammatik/grammatik.js');let engine=fs.readFileSync(file,'utf8');
const referenceStart=s=>{const positions=[s.indexOf("  { t: 'Nachschlagen und trainieren'"),s.indexOf('  {"t":"Nachschlagen und trainieren"')].filter(n=>n>=0);return positions.length?Math.min(...positions):-1;};
const start=engine.indexOf('  /* B2–C1:'),stop=referenceStart(engine);assert.ok(start>=0&&stop>start);
engine=engine.slice(0,start)+'  /* B2–C1: authored native lessons; source chapter numbers are metadata. */\n'+groups.map(g=>'  '+JSON.stringify(g)+',').join('\n')+'\n'+engine.slice(stop);
// Keep the existing lower-level references and add the source appendix as native references.
const refsStart=referenceStart(engine),refsStop=engine.indexOf('\n];',refsStart);
const refs=[[101,'Unregelmäßige Verben','Präteritum, Partizip, haben oder sein – mit Trainer','Liste'],[102,'Verben mit Dativ','helfen, danken, gefallen … – mit Trainer','Liste'],[103,'Verben mit Dativ und Akkusativ','jemandem etwas geben … – mit Trainer','Liste'],[104,'Verben mit Präpositionen','warten auf, denken an … – mit Trainer','Liste'],...index.references.map(r=>[r.id,r.title,'','Liste'])];
engine=engine.slice(0,refsStart)+'  '+JSON.stringify({t:'Nachschlagen und trainieren',ic:'library',h:40,ref:true,ch:refs})+engine.slice(refsStop);
engine=engine.replace(/const isRef = n => [^;]*;/,'const isRef = n => !!chInfo(n)?.g.ref;');
engine=engine.replace(/const B2C1_READY = \[[^;]*;/,'const B2C1_READY = '+JSON.stringify(ready)+';');
engine=engine.replace(/const gNo = n => [^;]*;/,'const SOURCE_NO = '+JSON.stringify(Object.fromEntries(index.chapters.flatMap(c=>Object.values(c.ids).map(id=>[id,c.sourceChapter]))))+';\nconst gNo = n => SOURCE_NO[n] || n;');
// Regeneration replaces existing SOURCE_NO as well as the old draft's numeric formula.
engine=engine.replace(/const SOURCE_NO = ([^;]+);\nconst SOURCE_NO = ([^;]+);/,'const SOURCE_NO = $2;');
engine=engine.replace('const isV = n => n > 200;','const isV = n => !!chInfo(n)?.g.vocab;').replace('n > 200 ? String(topicNo(n))','isV(n) ? String(topicNo(n))').replace("n > 200 ? 'Thema '","isV(n) ? 'Thema '");
engine=engine.replace('vocab: !!g.vocab, group: g.t, no: c[0] > 200 ? topicNo(c[0]) : gNo(c[0])','vocab: !!g.vocab, ref: !!g.ref, group: g.t, no: g.vocab ? topicNo(c[0]) : gNo(c[0])');
fs.writeFileSync(file,engine);
const audit=lessons.map(c=>({chapter:c.source.chapter,reference:c.source.reference,level:c.level,id:c.n,concepts:c.source.concepts,groups:c.exercises.map(x=>({id:x.id,source:x.source,items:x.items.length,graded:x.graded!==false,type:x.type}))}));
fs.writeFileSync(path.join(root,'.local/grammar-native/coverage.json'),JSON.stringify(audit,null,2));
const expected=JSON.parse(fs.readFileSync(path.join(__dirname,'exercise-index.json'))).chapters;
const coverage=expected.map(ch=>{const mapped=new Set(lessons.filter(c=>c.source.chapter===ch.chapter).flatMap(c=>c.exercises.map(x=>/^\d+/.exec(String(x.source?.exercise))?.[0]).filter(Boolean)));return {chapter:ch.chapter,mapped:ch.exercises.filter(x=>mapped.has(String(x.number))).map(x=>x.number),remaining:ch.exercises.filter(x=>!mapped.has(String(x.number))).map(x=>x.number)}});
fs.writeFileSync(path.join(root,'.local/grammar-native/source-coverage.json'),JSON.stringify({chapters:coverage,mappedOriginalGroups:coverage.reduce((n,c)=>n+c.mapped.length,0),totalOriginalGroups:expected.reduce((n,c)=>n+c.exercises.length,0),nativeQuestions:lessons.reduce((n,c)=>n+c.exercises.reduce((s,x)=>s+x.items.length,0),0),note:'Mappings record authored coverage; linguistic and visual review remain separate checks.'},null,2));
console.log('Compiled '+lessons.length+' native lessons, '+lessons.reduce((s,c)=>s+c.exercises.reduce((n,x)=>n+x.items.length,0),0)+' automatically graded questions.');
