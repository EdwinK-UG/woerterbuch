#!/usr/bin/env node
/* Offline recording handoff. Reads protected lesson sources; never calls a voice
 * service. Cue identity and exact UTF-8 text are kept separate from timing. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const Film=require('../grammatik/film.js');
const hash=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
function canonicalOutput(p){let ancestor=path.resolve(p),tail=[];while(!fs.existsSync(ancestor)){tail.unshift(path.basename(ancestor));ancestor=path.dirname(ancestor);}return path.join(fs.realpathSync(ancestor),...tail);}
function rows(directory){
 const found=[],ids=new Set();
 for(const file of fs.readdirSync(directory).filter(f=>/^k\d+\.js$/.test(f)).sort((a,b)=>+a.slice(1,-3)-+b.slice(1,-3))){
  const source=fs.readFileSync(path.join(directory,file),'utf8');
  // Vocabulary lessons may have their own runtime dependencies and no film.
  if(!/\bfilm\s*:/.test(source))continue;
  let lesson;vm.runInNewContext(source,{GRAM:{add:x=>{lesson=x;}}},{timeout:3000});
  if(!lesson?.film||!['B2','C1'].includes(lesson.level))continue;
  const timeline=Film.compile(lesson.film);
  for(const cue of timeline.cues){
   if(ids.has(cue.id))throw Error('Duplicate audio filename across films: '+cue.id);ids.add(cue.id);
   const position=timeline.cues.indexOf(cue);
   found.push({chapter:lesson.n,level:lesson.level,film:lesson.film.id,title:lesson.film.title,scene:lesson.film.scenes[cue.scene].id,beat:cue.beat+1,id:cue.id,file:cue.id+'.mp3',say:cue.say,textSha256:hash(cue.say),characters:[...cue.say].length,plannedSeconds:cue.seconds,previousText:timeline.cues[position-1]?.say||'',nextText:timeline.cues[position+1]?.say||''});
  }
 }
 return found;
}
function compare(current,previous=[]){
 const before=new Map(previous.map(c=>[c.id,c]));
 return current.map(c=>{const old=before.get(c.id);return {...c,status:!old?'new':old.say===c.say?'unchanged':'changed',...(old?{previousSay:old.say,previousTextSha256:hash(old.say)}:{})};});
}
function warnings(cue){
 const text=cue.say,out=[];
 if(/[+→/\[\]()<>]|\b(?:Partizip|Konjunktiv|Futur)\s+I{1,3}\b/.test(text))out.push('unspoken notation');
 if(/\bz\.\s*B\.|\busw\.|\bbzw\.|\bd\.\s*h\.|\d/.test(text))out.push('abbreviation or digit');
 if(/\b(?:unten|klick|wechsle)\b/i.test(text))out.push('check video-independent wording');
 if(text.split(/[.!?]+/u).some(s=>s.trim().split(/\s+/u).length>32))out.push('long sentence');
 return out;
}
function makePlan(directory,previous=[]){
 const cues=compare(rows(directory),previous),changed=cues.filter(c=>c.status!=='unchanged');
 return {version:1,language:'de',voice:{id:'Ew9k3hOjG0x2iTWems98',name:'Elisa - Pleasant, Friendly & Familiar',model:'eleven_multilingual_v2'},rules:['Record the exact say text. Do not prepend scene titles, acting directions or metadata.','One MP3 per cue, named exactly as file.','Reuse only when id, exact text, voice, model and generation settings all match. A matching filename alone is insufficient.','Freeze settings after a small listening test; do not normalize or rewrite the script in the recording tool.','Measured MP3 durations replace plannedSeconds in the animation.'],summary:{films:new Set(cues.map(c=>c.film)).size,beats:cues.length,characters:cues.reduce((n,c)=>n+c.characters,0),changedBeats:changed.length,unchangedBeats:cues.length-changed.length,charactersToRerecord:changed.reduce((n,c)=>n+c.characters,0)},cues:cues.map(c=>({...c,warnings:warnings(c)}))};
}
function writePlan(directory,dest,previous=[]){
 const output=canonicalOutput(dest),source=fs.realpathSync(directory);
 if(output===source||output.startsWith(source+path.sep)||source.startsWith(output+path.sep))throw Error('Keep the recording plan separate from the lesson source folder.');
 if(fs.existsSync(output))throw Error('Choose a new recording-plan folder; existing plans are never overwritten.');
 const plan=makePlan(source,previous);if(!plan.cues.length)throw Error('No authored B2/C1 films found.');
 fs.mkdirSync(output,{recursive:true,mode:0o700});
 fs.writeFileSync(path.join(output,'recording-plan.json'),JSON.stringify(plan,null,2)+'\n');
 fs.writeFileSync(path.join(output,'script.txt'),plan.cues.map(c=>`${c.chapter} · ${c.title}\n${c.file}\n${c.say}\n`).join('\n'));
 for(const n of new Set(plan.cues.map(c=>c.chapter))){const cues=plan.cues.filter(c=>c.chapter===n);fs.writeFileSync(path.join(output,'k'+n+'.json'),JSON.stringify({version:1,voice:plan.voice,chapter:n,cues},null,2)+'\n');}
 return plan;
}
if(require.main===module){
 const [source,dest,baseline]=process.argv.slice(2);
 if(!source||!dest)throw Error('Use: node tools/film-recording-plan.cjs COMPLETE_LESSONS NEW_OUTPUT [PREVIOUS_PLAN.json]');
 const previous=baseline?JSON.parse(fs.readFileSync(baseline,'utf8')).cues:[];
 console.log(JSON.stringify(writePlan(source,dest,previous).summary,null,2));
}
module.exports={rows,compare,warnings,makePlan,writePlan,hash};
