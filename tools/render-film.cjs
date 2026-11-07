#!/usr/bin/env node
/* Offline SVG/MP4 export. No browser, accounts, API or remote media requests.
 * npm package @resvg/resvg-js rasterises the exact frames used in the player.
 * ffmpeg is optional for --frames-only. See docs/animation-studio.md. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process');
const Film=require('../grammatik/film.js');
function args(argv){const out={};for(let i=0;i<argv.length;i++){if(!argv[i].startsWith('--'))throw Error('Expected a named option.');const key=argv[i].slice(2);out[key]=['frames-only','portrait'].includes(key)?true:argv[++i];}return out;}
function main(a){
 if(!a.lesson||!a.out)throw Error('Use --lesson PRIVATE_LESSON.js --out NEW_OUTPUT_DIRECTORY [--audio DIRECTORY] [--ffmpeg PATH] [--resvg PATH]');
 const dest=path.resolve(a.out);if(fs.existsSync(dest))throw Error('Choose a new output directory; existing files are never overwritten.');
 let lesson;vm.runInNewContext(fs.readFileSync(a.lesson,'utf8'),{GRAM:{add:c=>{lesson=c;}}},{timeout:3000});if(!lesson?.film)throw Error('This private lesson has no authored film.');
 const baseTimeline=Film.compile(lesson.film);
 if(a.cue&&!baseTimeline.cues.some(c=>c.id===a.cue))throw Error('Unknown narration cue: '+a.cue);
 if(a.cue&&(a.start!=null||a.seconds!=null))throw Error('Use --cue or an export interval, not both.');
 const Resvg=require(a.resvg||'@resvg/resvg-js').Resvg,ffmpeg=a.ffmpeg||'ffmpeg',fps=Number(a.fps||30),width=Number(a.width||(a.portrait?1080:1920));
 const commonFonts=[
  '/System/Library/Fonts/Supplemental/Arial.ttf','/System/Library/Fonts/Supplemental/Arial Bold.ttf','/System/Library/Fonts/Supplemental/Arial Italic.ttf','/System/Library/Fonts/Supplemental/Georgia.ttf','/System/Library/Fonts/Supplemental/Georgia Italic.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
 ].filter(p=>fs.existsSync(p));
 const fontFiles=a.font?a.font.split(','):commonFonts;
 const font={defaultFontFamily:'Arial',loadSystemFonts:!fontFiles.length,...(fontFiles.length?{fontFiles}:{})};
 if(!Number.isInteger(fps)||fps<1||fps>60||!Number.isInteger(width)||width<320||width>3840)throw Error('Invalid frame rate or width.');
 const durations={},audioPCM={};
 if(a.audio){
  const planPath=a.manifest||path.join(a.audio,'recording-plan.json');
  if(!fs.existsSync(planPath))throw Error('A matching recording plan is required. Use --manifest PLAN.json or put recording-plan.json beside the audio.');
  const plan=JSON.parse(fs.readFileSync(planPath,'utf8'));
  if(Film.compile(lesson.film).cues.some(c=>!Film.recordingMatches(c,plan)))throw Error('Recording plan text or cue IDs do not match this lesson.');
  const input=fs.readdirSync(a.audio);for(const cue of baseTimeline.cues.filter(c=>!a.cue||c.id===a.cue)){
   const f=input.find(f=>f.replace(/\.[^.]+$/,'')===cue.id&&/\.(wav|mp3|m4a|ogg)$/i.test(f));if(!f)throw Error('Missing narration clip: '+cue.id);
   // Decode first: container duration can include encoder delay/padding. Sample
   // counts keep the rendered timeline and concatenated voice track identical.
   const result=cp.spawnSync(ffmpeg,['-v','error','-i',path.resolve(a.audio,f),'-f','s16le','-ar','48000','-ac','1','pipe:1'],{maxBuffer:64*1024*1024});
   if(result.error)throw result.error;if(result.status!==0||!result.stdout.length)throw Error('Cannot decode narration: '+f);
   audioPCM[cue.id]=result.stdout;durations[cue.id]=result.stdout.length/(48000*2);
  }
 }
 const timeline=Film.compile(lesson.film,durations),selected=a.cue?timeline.cues.find(c=>c.id===a.cue):null,start=selected?selected.start:Number(a.start||0),end=selected?selected.end:a.seconds?Math.min(timeline.duration,start+Number(a.seconds)):timeline.duration;
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end>timeline.duration)throw Error('Invalid export interval.');
 fs.mkdirSync(dest,{recursive:true});
 fs.writeFileSync(path.join(dest,'narration.json'),JSON.stringify(Film.manifest(timeline),null,2));fs.writeFileSync(path.join(dest,'captions.vtt'),Film.vtt(timeline,{start,end}));
 fs.writeFileSync(path.join(dest,'film.json'),JSON.stringify(lesson.film,null,2));
 fs.writeFileSync(path.join(dest,'poster.svg'),Film.frame(timeline,start,{compact:!!a.portrait}));
 const count=Math.ceil((end-start)*fps),height=Math.round(width*(a.portrait?1190/900:900/1600)/2)*2;
 let encoder,encoderError;
 if(!a['frames-only']){encoder=cp.spawn(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',path.join(dest,'silent.mp4')],{stdio:['pipe','ignore','inherit']});encoder.on('error',e=>{encoderError=e;});}
 const write=async()=>{
  for(let i=0;i<count;i++){
   if(encoderError)throw encoderError;const svg=Film.frame(timeline,start+i/fps,{compact:!!a.portrait});
   const png=new Resvg(svg,{fitTo:{mode:'width',value:width},font}).render().asPng();
   if(a['frames-only'])fs.writeFileSync(path.join(dest,String(i).padStart(6,'0')+'.png'),png);
   else if(!encoder.stdin.write(png))await new Promise((resolve,reject)=>{const done=()=>{encoder.stdin.removeListener('error',fail);resolve();};const fail=e=>{encoder.stdin.removeListener('drain',done);reject(e);};encoder.stdin.once('drain',done);encoder.stdin.once('error',fail);});
  }
  if(encoder){encoder.stdin.end();await new Promise((resolve,reject)=>{encoder.once('close',code=>code===0?resolve():reject(Error('ffmpeg exited '+code)));encoder.once('error',reject);});}
  if(a.audio&&!a['frames-only']){
   // Encode each cue separately before concatenating: mixed source formats/rates are supported.
   const tracks=[];for(const cue of timeline.cues.filter(c=>!a.cue||c.id===a.cue)){
    const track=path.join(dest,cue.id+'.wav'),data=audioPCM[cue.id],header=Buffer.alloc(44);
    header.write('RIFF',0);header.writeUInt32LE(36+data.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(48000,24);header.writeUInt32LE(96000,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(data.length,40);
    fs.writeFileSync(track,Buffer.concat([header,data]));tracks.push(track);
   }
   // Generated filenames use authored ids restricted by storyboard validation.
   const list=path.join(dest,'audio-list.txt');fs.writeFileSync(list,tracks.map(p=>"file '"+p.replace(/'/g,"'\\''")+"'").join('\n'));
   const concat=cp.spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',list,'-c:a','pcm_s16le',path.join(dest,'voice.wav')]);if(concat.status!==0)throw Error('Audio concatenation failed.');
   const mux=cp.spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',path.join(dest,'silent.mp4'),'-ss',String(selected?0:start),'-i',path.join(dest,'voice.wav'),'-t',String(end-start),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-movflags','+faststart',path.join(dest,'narrated.mp4')]);if(mux.status!==0)throw Error('Audio mux failed.');
  }
  fs.writeFileSync(path.join(dest,'export.json'),JSON.stringify({story:lesson.film.id,cue:a.cue||null,start,end,fps,width,height,frames:count,narrated:!!a.audio},null,2));
  console.log('Exported '+count+' deterministic frames ('+width+'×'+height+').');
 };return write();
}
if(require.main===module)main(args(process.argv.slice(2))).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={main,args};
