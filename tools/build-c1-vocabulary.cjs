/* Build the private C1 chapters from the reviewed editorial JSON, without network access. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function option(name,fallback){const i=process.argv.indexOf(name);if(i<0)return fallback;assert.ok(process.argv[i+1],`Missing ${name} value`);return path.resolve(process.argv[i+1])}
const input=option('--input',path.join(root,'.local/c1-vocabulary/editorial.json'));
const out=option('--out',path.join(root,'.local/c1-vocabulary'));
// .local/lessons can point at another checkout. Never write through it, even by accident.
const legacy=path.join(root,'.local/lessons');
assert.ok(out!==legacy&&!out.startsWith(legacy+path.sep),'Choose an independent output directory; .local/lessons may be a symlink.');
let ancestor=out;while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);
assert.equal(fs.realpathSync(ancestor),ancestor,'Output must not traverse symlinks.');
const chapters=JSON.parse(fs.readFileSync(input,'utf8'));assert.equal(chapters.length,13);
const sourceIds=new Set(),wordIds=new Set();
const lines=['Vom leisen Schritt bis zum gedeckten Tisch.','Menschen beschreiben. Gefühle verstehen.','Zwischen den Zeilen liegt eine Welt.','Vom Acker auf den Teller.','Den Körper verstehen. Präzise beschreiben.','Sprache für deinen nächsten beruflichen Schritt.','Wie etwas funktioniert. Warum etwas stimmt.','Was eine Stadt zusammenhält.','Rechte verstehen. Genau unterscheiden.','Macht, Mitbestimmung und Überzeugungen.','Spuren lesen. Gesellschaft verstehen.','Klar denken. Präzise verbinden.','Vom ersten Gehalt zum großen Ganzen.'];
const lessons=chapters.map((chapter,i)=>{
 assert.equal(chapter.chapter,i+1);assert.ok(chapter.entries.length);
 const words=chapter.entries.map(entry=>{
  assert.ok(!wordIds.has(entry.id),`Duplicate word ID ${entry.id}`);wordIds.add(entry.id);
  assert.ok(entry.en?.length&&entry.examples?.length,`Incomplete entry ${entry.id}`);
  for(const example of entry.examples){assert.ok(example.de&&example.en&&example.source?.title,`Incomplete context ${entry.id}`);assert.equal(new URL(example.source.url).protocol,'https:');assert.ok(!example.cloze||example.de.includes(example.cloze.answer),`Unattested cloze ${entry.id}`)}
  entry.sourceEntries.forEach(id=>sourceIds.add(id));return {...entry,w:entry.term,g:entry.group};
 });
 const exercises=[];
 for(const group of new Set(words.map(e=>e.group))){
  const subset=words.filter(e=>e.group===group);
  for(let offset=0;offset<subset.length;offset+=8){const ix=exercises.length/2+1,ids=subset.slice(offset,offset+8).map(e=>e.id);
   for(const mode of ['meaning','context'])exercises.push({id:`c1v2-${String(i+1).padStart(2,'0')}-${mode}-${String(ix).padStart(2,'0')}`,title:`${group} · ${offset/8+1}`+(mode==='context'?' im Kontext':''),type:'native',mode,wordIds:ids,items:[]});
  }
 }
 return {n:261+i,level:'C1',vocab:true,vocabularyVersion:2,title:chapter.title,group:'Wortschatz C1',tagline:lines[i],kicker:lines[i],intro:'',hero:'',words,exercises,sourceDocument:{title:'Deutsch intensiv Wortschatz C1 · Wortliste',chapter:i+1,pages:chapter.pages}};
});
assert.equal(sourceIds.size,1270,'Every PDF source row must remain accounted for.');
fs.mkdirSync(out,{recursive:true});
for(const lesson of lessons){const file=path.join(out,`k${lesson.n}.js`);assert.ok(!fs.existsSync(file)||!fs.lstatSync(file).isSymbolicLink(),'Refusing a symlink output');fs.writeFileSync(file,'/* Private C1 vocabulary. Generated from the reviewed, attributed inventory. */\nGRAM.add('+JSON.stringify(lesson)+');\n')}
const json=path.join(out,'chapters.json');assert.ok(!fs.existsSync(json)||!fs.lstatSync(json).isSymbolicLink());fs.writeFileSync(json,JSON.stringify(lessons));
console.log(`Built ${lessons.length} private chapters, ${wordIds.size} teaching entries, ${sourceIds.size} source rows and ${lessons.reduce((n,c)=>n+c.exercises.length,0)} graded rounds.`);
