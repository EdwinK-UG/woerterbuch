// Completion checks use private authored files; no lesson text is printed or published.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),privateDir=path.join(root,'.local/grammar-native');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const index=read(path.join(__dirname,'source-index.json')),exIndex=read(path.join(__dirname,'exercise-index.json'));
const units=fs.readdirSync(path.join(privateDir,'chapters')).filter(f=>/^\d{3}-(B2|C1|Liste)\.json$/.test(f)).map(f=>read(path.join(privateDir,'chapters',f)));
for(const ch of index.chapters)for(const [level,id] of Object.entries(ch.ids))assert.ok(units.some(c=>c.n===id&&c.level===level&&c.source.chapter===ch.sourceChapter),`missing chapter ${ch.sourceChapter} ${level}`);
for(const ch of exIndex.chapters)for(const ex of ch.exercises)assert.ok(units.some(c=>c.source.chapter===ch.chapter&&c.level===ex.level&&c.exercises.some(x=>String(x.source?.exercise).match(/^\d+/)?.[0]===String(ex.number))),`missing source group ${ch.chapter}.${ex.number} ${ex.level}`);
for(const ref of index.references)assert.ok(units.some(c=>c.n===ref.id&&c.source.reference===ref.id),`missing reference ${ref.id}`);
const partners=fs.readdirSync(path.join(privateDir,'partners')).filter(f=>/^\d{3}\.json$/.test(f)).map(f=>read(path.join(privateDir,'partners',f)));
for(const partner of index.partners){const authored=partners.find(p=>p.id===partner.id);assert.ok(authored,`missing partner ${partner.id}`);for(const [level,id] of Object.entries(authored.targets))assert.ok(units.some(c=>c.n===id&&c.level===level));assert.ok(authored.exercises.length);}
const training=read(path.join(privateDir,'written-training-coverage.json'));
assert.deepEqual([...new Set(training.map(x=>x.training))].sort((a,b)=>a-b),Array.from({length:36},(_,i)=>i+1));
for(const row of training){assert.equal(row.sourceAudioTrack,row.training+1);assert.ok(units.some(c=>c.n===row.lesson&&c.exercises.some(x=>x.id===row.exercise&&x.source.writtenTrainingNumber===row.training)));}
const expectedRows={180:71,181:8,182:67,183:238,184:330,185:99,186:113,187:144};
for(const [id,expected] of Object.entries(expectedRows)){const c=units.find(c=>c.n===+id),table=c.understand.find(b=>b.type==='reflist');assert.equal(table?.rows.length,expected,`reference ${id} lost table rows`);}
const coverage=read(path.join(privateDir,'source-coverage.json'));
assert.equal(coverage.mappedOriginalGroups,499);assert.equal(coverage.totalOriginalGroups,499);assert.ok(coverage.chapters.every(c=>!c.remaining.length));
const report={chapters:index.chapters.length,units:units.length,sourceGroups:499,partners:partners.length,writtenActivities:36,references:index.references.length,referenceRows:expectedRows};
fs.writeFileSync(path.join(privateDir,'completion-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Complete: ${report.chapters} chapters, ${report.sourceGroups} source exercise groups, ${report.partners} partner activities, ${report.writtenActivities} written activities and ${report.references} references (${report.units} native units).`);
