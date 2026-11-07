'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const Plan=require('../tools/film-recording-plan.cjs'),{revise}=require('../tools/revise-film-narration.cjs'),Film=require('../grammatik/film.js');
const story=()=>({version:1,id:'dk-b2-1',n:1,level:'B2',title:'Ein Beispiel',scenes:[{id:'s-one',title:'Ein Beispiel',visual:'clause',alt:'Eine Satzgrenze.',from:[{id:'a',text:'vorher',role:'neutral'}],to:[{id:'a',text:'nachher',role:'neutral'}],takeaway:'Die Grenze wird sichtbar.',beats:[{say:'Schau auf den Satz.',stage:0,seconds:5},{say:'Jetzt verändert sich die Form.',stage:1,seconds:5},{say:'Die Bedeutung bleibt erhalten.',stage:1,seconds:5}]}]});
function fixture(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dk-recording-')),src=path.join(dir,'source');fs.mkdirSync(src);const s=story();fs.writeFileSync(path.join(src,'k1.js'),'GRAM.add({n:1,level:"B2",exercise:()=>42,film:'+JSON.stringify(s)+'});');fs.writeFileSync(path.join(src,'k2.js'),'GRAM.add({n:2,level:"A1",exercises:[]});');return {dir,src};}
test('recording plan preserves exact text, stable filenames and cross-beat context without calling a service',()=>{
 const f=fixture();try{const cues=Plan.rows(f.src);assert.equal(cues.length,3);assert.equal(cues[1].file,'s-one--2.mp3');assert.equal(cues[1].previousText,cues[0].say);assert.equal(cues[1].nextText,cues[2].say);assert.equal(cues[1].textSha256,Plan.hash(cues[1].say));
 const p=Plan.makePlan(f.src,cues);assert.equal(p.summary.changedBeats,0);assert.equal(p.summary.charactersToRerecord,0);assert.equal(p.voice.model,'eleven_multilingual_v2');
 const changed=Plan.compare([{...cues[0],say:cues[0].say+' '}],cues);assert.equal(changed[0].status,'changed','even a whitespace change invalidates a recording');
 const renamed=Plan.compare([{...cues[0],id:'new-id'}],cues);assert.equal(renamed[0].status,'new');
 }finally{fs.rmSync(f.dir,{recursive:true,force:true});}
});
test('revision changes only reviewed beats, preserves generators and unrelated lessons, and rejects a stale baseline',()=>{
 const f=fixture();try{const before=fs.readFileSync(path.join(f.src,'k1.js'),'utf8'),edits=[{id:'s-one--2',chapter:1,before:'Jetzt verändert sich die Form.',after:'Und jetzt, schau auf die neue Form.'}],out=path.join(f.dir,'revised');const r=revise(f.src,edits,out);assert.equal(r.lessons,2);assert.equal(r.changedBeats,1);
 let l;vm.runInNewContext(fs.readFileSync(path.join(out,'k1.js'),'utf8'),{GRAM:{add:x=>{l=x;}}});assert.equal(l.exercise(),42);assert.deepEqual(JSON.parse(JSON.stringify(l.film.scenes.map(s=>({id:s.id,count:s.beats.length})))),[{id:'s-one',count:3}]);assert.equal(l.film.scenes[0].beats[0].say,story().scenes[0].beats[0].say);assert.equal(l.film.scenes[0].beats[1].say,edits[0].after);
 assert.equal(fs.readFileSync(path.join(f.src,'k1.js'),'utf8'),before);assert.equal(fs.readFileSync(path.join(out,'k2.js'),'utf8'),fs.readFileSync(path.join(f.src,'k2.js'),'utf8'));
 assert.throws(()=>revise(f.src,edits,f.src),/separate/);assert.throws(()=>revise(f.src,[{...edits[0],before:'Old draft.'}],path.join(f.dir,'bad')),/baseline changed/);assert.equal(fs.existsSync(path.join(f.dir,'bad')),false);
 }finally{fs.rmSync(f.dir,{recursive:true,force:true});}
});
test('recording-plan output is separate, cannot overwrite a frozen plan, and flags speech notation',()=>{
 const f=fixture();try{assert.throws(()=>Plan.writePlan(f.src,path.join(f.src,'plan')),/separate/);const out=path.join(f.dir,'plan');Plan.writePlan(f.src,out);assert.ok(fs.existsSync(path.join(out,'k1.json')));assert.throws(()=>Plan.writePlan(f.src,out),/never overwritten/);assert.ok(Plan.warnings({say:'Partizip I + Infinitiv, z. B. 2024.'}).length);assert.equal(Plan.warnings({say:'Das Partizip eins steht vor dem Nomen.'}).length,0);
 }finally{fs.rmSync(f.dir,{recursive:true,force:true});}
});
test('animation allows an opening breath, completes the change and holds the result',()=>{
 const t=Film.compile(story());assert.equal(Film.at(t,5.2).stage,0);assert.ok(Film.at(t,6).stage>0&&Film.at(t,6).stage<1);assert.equal(Film.at(t,8).stage,1);assert.equal(Film.at(t,9.9).stage,1);
 const early=Film.frame(t,1),late=Film.frame(t,11);assert.match(early,/<g opacity="0"><text[^>]+>Die Grenze wird sichtbar/);assert.match(late,/<g opacity="1"><text[^>]+>Die Grenze wird sichtbar/);
});
test('matching filenames cannot validate a recording with changed text or duplicate cue claims',()=>{
 const cue=Film.compile(story()).cues[0];
 assert.equal(Film.recordingMatches(cue,{cues:[{id:cue.id,say:cue.say}]}),true);
 assert.equal(Film.recordingMatches(cue,{cues:[{id:cue.id,say:cue.say+' '}]}),false);
 assert.equal(Film.recordingMatches(cue,{cues:[{id:'renamed',say:cue.say}]}),false);
 assert.equal(Film.recordingMatches(cue,{cues:[cue,cue]}),false);
 assert.equal(Film.recordingMatches(cue,null),false);
});
test('an authored illustration can change without invalidating narration IDs or texts',()=>{
 const f=fixture();try{const original=story().scenes[0],out=path.join(f.dir,'art'),r=revise(f.src,[],out,[{id:original.id,chapter:1,before:{visual:original.visual},after:{visual:'painting',art:{phase:'action'}}}]);
 assert.equal(r.changedVisuals,1);const plan=Plan.makePlan(out,Plan.rows(f.src));assert.equal(plan.summary.changedBeats,0);assert.equal(plan.summary.charactersToRerecord,0);assert.throws(()=>Film.validate({...story(),scenes:[{...original,visual:'painting',art:{phase:'guess'}}]}),/authored action/);
 }finally{fs.rmSync(f.dir,{recursive:true,force:true});}
});
