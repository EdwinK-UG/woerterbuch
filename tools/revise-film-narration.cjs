#!/usr/bin/env node
/* Apply reviewed, exact-text edits to an independent COMPLETE source archive.
 * Everything except the authored film metadata is preserved, including generators.
 * No network requests, recording calls, publication or source-folder writes. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Film=require('../grammatik/film.js');
function canonicalOutput(p){let ancestor=path.resolve(p),tail=[];while(!fs.existsSync(ancestor)){tail.unshift(path.basename(ancestor));ancestor=path.dirname(ancestor);}return path.join(fs.realpathSync(ancestor),...tail);}
function revise(source,edits,destination,visualEdits=[]){
 const src=fs.realpathSync(source),dst=canonicalOutput(destination),root=fs.realpathSync(path.resolve(__dirname,'..'));
 if(dst===src||dst.startsWith(src+path.sep)||src.startsWith(dst+path.sep))throw Error('Source and output must be separate.');
 if(dst.startsWith(root+path.sep)&&!dst.startsWith(path.join(root,'.local')+path.sep))throw Error('Private lessons must stay outside the public tree.');
 if(fs.existsSync(dst))throw Error('Choose a new output folder. Existing archives are never overwritten.');
 const ids=new Set(),byId=new Map();
 for(const e of edits){if(!e.id||!e.before||!e.after||e.before===e.after||ids.has(e.id))throw Error('Invalid or duplicate edit.');ids.add(e.id);byId.set(e.id,e);}
 const visualById=new Map(visualEdits.map(e=>[e.id,e]));if(visualById.size!==visualEdits.length)throw Error('Duplicate visual edit.');
 const files=[],applied=new Set(),visualApplied=new Set(),films={};
 for(const file of fs.readdirSync(src).filter(f=>/^k\d+\.js$/.test(f))){
  let original=fs.readFileSync(path.join(src,file),'utf8'),lesson;
  if(/\bfilm\s*:/.test(original)){
   vm.runInNewContext(original,{GRAM:{add:x=>{lesson=x;}}},{timeout:3000});
   if(lesson?.film&&['B2','C1'].includes(lesson.level)){
    const film=JSON.parse(JSON.stringify(lesson.film));let changed=false;
    for(const scene of film.scenes){
     const artEdit=visualById.get(scene.id);
     if(artEdit){if(artEdit.chapter!==lesson.n||JSON.stringify({visual:scene.visual,art:scene.art})!==JSON.stringify(artEdit.before))throw Error('Visual baseline changed for '+scene.id);Object.assign(scene,artEdit.after);visualApplied.add(scene.id);changed=true;}
     scene.beats.forEach((beat,i)=>{
     const id=scene.id+'--'+(i+1),edit=byId.get(id);if(!edit)return;
     if(applied.has(id)||beat.say!==edit.before||(edit.chapter!=null&&edit.chapter!==lesson.n))throw Error('The baseline changed for '+id+'. Review before applying.');
     beat.say=edit.after;
     const sentences=beat.say.split(/[.!?]+/u).filter(s=>s.trim()).length;
     beat.seconds=Math.max(5,Math.ceil(beat.say.trim().split(/\s+/u).length/2.05+sentences*.22+1.4));
     applied.add(id);changed=true;
    });}
    Film.validate(film);films[lesson.n]=film;
    if(changed){
     const oldJSON=JSON.stringify(lesson.film),offset=original.lastIndexOf(oldJSON);
     // Existing authored wrappers store the film as a JSON literal. Replacing
     // that exact literal avoids retaining an obsolete second script in a file.
     if(offset>=0)original=original.slice(0,offset)+JSON.stringify(film)+original.slice(offset+oldJSON.length);
     else original='// Private narration revision; original exercises and generators preserved.\n(function(GRAM){\n'+original+'\n})(Object.assign(Object.create(GRAM),{add: lesson => GRAM.add({...lesson,film:'+JSON.stringify(film)+'})}));\n';
    }
   }
  }
  files.push([file,original]);
 }
 const missing=[...ids].filter(id=>!applied.has(id));if(missing.length)throw Error('Missing cues: '+missing.join(', '));
 if(visualApplied.size!==visualById.size)throw Error('Missing visual scene.');
 // Validate everything before writing even the first lesson.
 fs.mkdirSync(dst,{recursive:true,mode:0o700});
 if(fs.realpathSync(dst)!==dst)throw Error('Output cannot resolve through a symlink.');
 for(const [file,body] of files)fs.writeFileSync(path.join(dst,file),body,{mode:0o600});
 return {lessons:files.length,films,changedBeats:applied.size,changedVisuals:visualApplied.size};
}
if(require.main===module){const [src,edits,dst,visuals]=process.argv.slice(2);if(!dst)throw Error('Use: node tools/revise-film-narration.cjs COMPLETE_SOURCES REVIEWED_EDITS.json NEW_OUTPUT [VISUAL_EDITS.json]');const r=revise(src,JSON.parse(fs.readFileSync(edits,'utf8')),dst,visuals?JSON.parse(fs.readFileSync(visuals,'utf8')):[]);console.log(JSON.stringify({lessons:r.lessons,films:Object.keys(r.films).length,changedBeats:r.changedBeats,changedVisuals:r.changedVisuals}));}
module.exports={revise};
