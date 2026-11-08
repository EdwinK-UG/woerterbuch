/* Deutschklinik Film — authored grammar, one deterministic clock.
 * No inference from picture kinds, highlighted strings or character differences.
 * Storyboards belong in private lessons as `film`, not in this public renderer.
 * Pure compile/frame functions also drive the offline video exporter. */
(function (root) {
'use strict';
const E = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { x = clamp(x); return x*x*(3-2*x); };
const mix = (a,b,t) => a+(b-a)*t;
const COLORS = {agent:'#315eaf', patient:'#a64c3f', recipient:'#167465', verb:'#7950a0', focus:'#95650a', ending:'#315eaf', neutral:'#455163'};
const VISUALS = ['space','handoff','focus','quote','ending','nominal','clause','perspective','transform','slots','timeline','scale','link','group','imagine','route','painting'];
const text = (s,x,y,size=28,fill='#263147',extra='') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${E(s)}</text>`;
const rect = (x,y,w,h,fill,rx=20,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
function lines(s,max) {
  const out=['']; for (const word of String(s).split(/\s+/)) {
    if ((out.at(-1)+' '+word).trim().length > max && out.at(-1)) out.push(word);
    else out[out.length-1]=(out.at(-1)+' '+word).trim();
  } return out;
}
const paragraph = (s,x,y,max,size=26,fill='#566174') => lines(s,max).map((l,i)=>text(l,x,y+i*size*1.4,size,fill)).join('');

function validate(story) {
  if (!story || story.version !== 1 || !/^[a-z0-9][a-z0-9-]*$/.test(story.id||'') || !story.title || !Array.isArray(story.scenes) || !story.scenes.length) throw Error('A versioned, authored storyboard is required.');
  const ids=new Set();
  for (const s of story.scenes) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(s.id||'') || ids.has(s.id)) throw Error('Scene ids must be unique and safe for local audio filenames.'); ids.add(s.id);
    if (!VISUALS.includes(s.visual) || !s.title || !s.alt) throw Error('Every scene needs a supported visual, title and text alternative: '+s.id);
    if((s.visual==='painting'||s.art?.picture==='painting')&&!['action','result'].includes(s.art?.phase))throw Error('Painting scenes require an authored action/result phase: '+s.id);
    if (!s.beats?.length) throw Error('Every scene needs authored narration: '+s.id);
    let previous=-1;
    for (const b of s.beats) {
      if (!b.say || !Number.isFinite(b.seconds) || b.seconds<2 || !Number.isFinite(b.stage) || b.stage<previous || b.stage<0 || b.stage>1) throw Error('Invalid narration/timing in '+s.id);
      previous=b.stage;
    }
    for (const key of ['from','to']) {
      const seen=new Set();
      for (const t of s[key]||[]) {
        if (!t.id || !t.text || !COLORS[t.role||'neutral'] || seen.has(t.id)) throw Error('Invalid authored token in '+s.id);
        seen.add(t.id);
      }
    }
    if (s.quiz && (!s.quiz.prompt || s.quiz.options?.length<2 || s.quiz.options.filter(o=>o.correct).length!==1 || s.quiz.options.some(o=>!o.feedback))) throw Error('A checkpoint needs one correct answer and explanatory feedback: '+s.id);
  }
  return story;
}
function compile(story, durations={}) {
  validate(story); let time=0; const cues=[];
  story.scenes.forEach((s,scene)=>s.beats.forEach((b,beat)=>{
    const id=s.id+'--'+(beat+1), seconds=durations[id] ?? b.seconds;
    if (!Number.isFinite(seconds) || seconds<=0) throw Error('Invalid audio duration: '+id);
    cues.push({id,scene,beat,start:time,end:time+seconds,seconds,say:b.say,stage:b.stage,previous:beat?s.beats[beat-1].stage:b.stage}); time+=seconds;
  }));
  return {story,cues,duration:time};
}
function at(timeline, seconds) {
  const t=Math.max(0, Math.min(timeline.duration, Number(seconds)||0));
  const cue=timeline.cues.find(c=>t<c.end)||timeline.cues.at(-1);
  // Let the opening words establish the change before moving the picture.
  // Movement takes only part of the cue; leave a still frame to understand it.
  // Audio clips replace cue lengths; video, scrubbing and lesson interactions use this same function.
  const lead=Math.min(.4,cue.seconds*.12),move=Math.min(2.2,cue.seconds*.55);
  const p=ease((t-cue.start-lead)/move);
  return {time:t,cue,scene:timeline.story.scenes[cue.scene],stage:mix(cue.previous,cue.stage,p)};
}
function tokenLayout(tokens,width,font=29) {
  let x=0,y=0; const out={};
  for (const t of tokens||[]) {
    const w=Math.min(width,Math.max(66,[...t.text].length*font*.56+32));
    if(x+w>width && x){x=0;y+=90;}
    out[t.id]={x,y,w,t}; x+=w+12;
  } return {items:out,height:y+70};
}
function tokens(s,p,x,y,width,compact) {
  const a=tokenLayout(s.from,width,compact?29:30), b=tokenLayout(s.to,width,compact?29:30);
  const same=(s.from||[]).length===(s.to||[]).length&&(s.from||[]).every((t,i)=>t.id===s.to[i].id&&t.text===s.to[i].text);
  if(same){
    let out=text(s.fromLabel||'BEISPIEL',x,y-25,18,'#657186','letter-spacing="2" font-weight="700"');
    for(const v of Object.values(a.items)){const c=COLORS[v.t.role||'neutral'];out+=rect(x+v.x,y+v.y,v.w,62,'#fffdf8',14,`stroke="${c}" stroke-width="2"`)+text(v.t.text,x+v.x+16,y+v.y+39,compact?29:30,c,'font-weight="600"');if(v.t.label)out+=text(v.t.label,x+v.x+4,y+v.y+84,17,c);}
    return out;
  }
  const rowGap=Math.max(165,a.height+52), toY=y+rowGap;
  let out=text(s.fromLabel||'AUSGANGSPUNKT',x,y-25,18,'#657186','letter-spacing="2" font-weight="700"');
  out+=`<g opacity="${clamp(p*2)}">${text(s.toLabel||'NEUE PERSPEKTIVE',x,toY-25,18,'#657186','letter-spacing="2" font-weight="700"')}</g>`;
  // Ghost source preserves the comparison without rereading a second animated sentence.
  for(const v of Object.values(a.items))out+=`<g opacity="${clamp(p)*.68}">${rect(x+v.x,y+v.y,v.w,62,'#e9e7e1',14)}${text(v.t.text,x+v.x+16,y+v.y+39,compact?29:30,'#7b8087')}</g>`;
  const ids=[...new Set([...Object.keys(a.items),...Object.keys(b.items)])];
  for(const id of ids){
    const src=a.items[id],dst=b.items[id],v=dst||src;
    const q=ease(p),px=mix(x+(src||dst).x,x+(dst||src).x,q),py=mix(y+(src||dst).y,toY+(dst||src).y,q);
    const opacity=src&&dst?1:dst?clamp(p*2):1-clamp(p*2);
    const color=COLORS[v.t.role||'neutral'];
    const label=(p>.55&&dst?dst:src||dst).t.text;
    const w=mix((src||dst).w,(dst||src).w,q);
    out+=`<g opacity="${opacity}" transform="translate(${px.toFixed(2)} ${py.toFixed(2)})">${rect(0,5,w,62,'#13233b',14,'opacity=".04"')}${rect(0,0,w,62,'#fffdf8',14,`stroke="${color}" stroke-width="2"`)}${text(label,16,39,compact?29:30,color,'font-weight="600"')}${v.t.label?text(v.t.label,4,84,17,color):''}</g>`;
  }
  return out;
}
// Screen-only token cards wrap long examples instead of shrinking the words or
// letting a sentence run outside its card. Exported video frames are unchanged.
function playerTokenLayout(list,width){
  let x=0,y=0,row=0;const items={};
  for(const t of list||[]){
    const w=Math.min(width,Math.max(70,[...t.text].length*30*.56+32));
    const content=lines(t.text,Math.max(3,Math.floor((w-20)/16.8))),h=Math.max(62,22+content.length*40);
    const labels=t.label?lines(t.label,Math.max(8,Math.floor(w/10))):[];
    if(x+w>width&&x){y+=row+20;x=0;row=0;}
    items[t.id]={x,y,w,h,content,labels,t};row=Math.max(row,h+labels.length*25);x+=w+12;
  }
  return {items,height:y+row};
}
function playerTokens(s,p,x,y,width){
  const a=playerTokenLayout(s.from,width),b=playerTokenLayout(s.to,width),same=JSON.stringify(s.from)===JSON.stringify(s.to);
  const gap=Math.max(140,a.height+40),q=ease(p);
  const card=(v,px,py,opacity=1,ghost=false,w=v.w,h=v.h)=>{
    const color=ghost?'#7b8087':COLORS[v.t.role||'neutral'];
    return `<g opacity="${opacity}" transform="translate(${px} ${py})">${rect(0,0,w,h,ghost?'#e9e7e1':'#fffdf8',14,ghost?'':`stroke="${color}" stroke-width="2"`)}${v.content.map((l,i)=>text(l,16,39+i*40,30,color,'font-weight="600"')).join('')}${!ghost?v.labels.map((l,i)=>text(l,4,h+25+i*25,18,color)).join(''):''}</g>`;
  };
  let out=text(s.fromLabel||'BEISPIEL',x,y-25,18,'#657186','letter-spacing="2" font-weight="700"');
  if(same)return out+Object.values(a.items).map(v=>card(v,x+v.x,y+v.y)).join('');
  out+=`<g opacity="${clamp(p*2)}">${text(s.toLabel||'NEUE PERSPEKTIVE',x,y+gap-25,18,'#657186','letter-spacing="2" font-weight="700"')}</g>`;
  for(const v of Object.values(a.items))out+=card(v,x+v.x,y+v.y,clamp(p)*.68,true);
  for(const id of new Set([...Object.keys(a.items),...Object.keys(b.items)])){
    const src=a.items[id],dst=b.items[id],v=p>.55&&dst?dst:src||dst;
    out+=card(v,mix(x+(src||dst).x,x+(dst||src).x,q),mix(y+(src||dst).y,y+gap+(dst||src).y,q),src&&dst?1:dst?clamp(p*2):1-clamp(p*2),false,mix((src||dst).w,(dst||src).w,q),mix((src||dst).h,(dst||src).h,q));
  }
  return out;
}
function person(x,y,scale,color='#315eaf',pose=0) {
  const leg=Math.sin(pose)*12;
  return `<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cx="0" cy="75" rx="29" ry="7" fill="#1d2b40" opacity=".08"/><path d="M-12 24L${-18-leg} 71M12 24L${20+leg} 71" fill="none" stroke="#263147" stroke-width="12" stroke-linecap="round"/><path d="M-22 1Q0-15 22 1L17 31H-17Z" fill="${color}"/><path d="M-18 1L${-39-leg} 22M18 1L${35+leg} -8" fill="none" stroke="#c48f70" stroke-width="10" stroke-linecap="round"/><rect x="-7" y="-25" width="14" height="20" rx="6" fill="#c48f70"/><circle cy="-43" r="24" fill="#dca685"/><path d="M-24-44Q-22-77 7-68Q28-63 25-40Q10-53-2-56Q-11-44-24-44" fill="#263147"/><circle cx="8" cy="-43" r="2.2" fill="#263147"/><path d="M5-32q8 5 12-2" fill="none" stroke="#805446" stroke-width="2" stroke-linecap="round"/></g>`;
}
function book(x,y,scale=1,color='#dfad6c') {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-29-23L23-30L32 15L-20 24Z" fill="${color}" stroke="#8e6740" stroke-width="2"/><path d="M-21 18L29 10L32 15L-20 24Z" fill="#fffdf7"/><path d="M-24-22L-16 15" stroke="#8e6740" stroke-width="2"/></g>`;
}
function bubble(label,x,y,w=220) {
  return rect(x,y,w,74,'#fffdf8',20,'stroke="#dad9d2" stroke-width="2"')+`<path d="M${x+35} ${y+74}l-7 17 27-17" fill="#fffdf8" stroke="#dad9d2" stroke-width="2"/>`+paragraph(label,x+18,y+31,Math.floor(w/12),22,'#263147');
}
function illustration(s,p) {
  const art=s.art||{},q=ease(p),ac=art.color||'#315eaf';
  let out=`<ellipse cx="280" cy="365" rx="235" ry="49" fill="#eae6db"/>`;
  if(s.visual==='painting'||(s.visual==='timeline'&&art.picture==='painting')){
    // Authored contrast: the child doing the painting vs. the finished picture.
    // The small time axis retains simultaneity/result information from the original diagram.
    const result=art.phase==='result',x=result?175:285,y=112,w=result?260:205,h=result?196:172;
    out=rect(22,30,516,350,'#eee8da',30)+`<ellipse cx="280" cy="371" rx="235" ry="24" fill="#ded6c4"/>`;
    if(result)out+=`<path d="M${x+35} ${y}L${x+w/2} ${y-39}L${x+w-35} ${y}" fill="none" stroke="#8e826c" stroke-width="3"/>`;
    else out+=`<path d="M${x+30} ${y+h-5}L${x+3} 362M${x+w-30} ${y+h-5}L${x+w-3} 362M${x-12} ${y+h+12}H${x+w+12}" stroke="#aa8053" stroke-width="9" stroke-linecap="round"/>`;
    out+=rect(x-9,y-9,w+18,h+18,'#bf996d',9)+rect(x,y,w,h,'#fffdf8',3);
    out+=`<circle cx="${x+w*.73}" cy="${y+h*.25}" r="${h*.13}" fill="#e9bc65"/><path d="M${x+7} ${y+h-9}L${x+w*.37} ${y+h*.42}L${x+w*.61} ${y+h*.77}L${x+w*.77} ${y+h*.56}L${x+w-7} ${y+h-9}Z" fill="#90afa0"/>`;
    out+=`<path d="M${x+14} ${y+h*.82}Q${x+w*.3} ${y+h*.67} ${x+w*.49} ${y+h*.85}T${x+w-14} ${y+h*.8}" fill="none" stroke="#598879" stroke-width="7" stroke-linecap="round" stroke-dasharray="${result?500:mix(34,220,q)} 500"/>`;
    if(!result){
      out+=person(180,291,1.04,'#c37858',0);
      out+=`<path d="M198 290Q235 257 272 239" fill="none" stroke="#dca685" stroke-width="12" stroke-linecap="round"/><path d="M267 241L${mix(300,329,q)} ${mix(227,251,q)}" stroke="#8b6743" stroke-width="5" stroke-linecap="round"/><ellipse cx="${mix(301,330,q)}" cy="${mix(226,250,q)}" rx="7" ry="4" fill="#598879"/>`;
      out+=text('das Kind malt',36,74,25,'#263147','font-weight="700"');
    }else out+=text('das fertige Bild',42,74,25,'#263147','font-weight="700"');
    const now=result?470:285;out+=`<path d="M60 418H510" stroke="#b1aa9a" stroke-width="3"/><path d="M110 418H${result?330:mix(220,330,q)}" stroke="${result?'#a64c3f':ac}" stroke-width="9" stroke-linecap="round"/><path d="M${now} 399V430" stroke="#263147" stroke-width="2"/>`+text('jetzt',now,456,20,'#566174','text-anchor="middle"');
    out+=text(result?'Die Handlung ist schon abgeschlossen.':'Die Handlung läuft gerade.',36,493,23,result?'#a64c3f':ac);
    return out;
  }
  if(s.visual==='space') {
    // Floor plane, translucent boundary, reference object, moving referent.
    const mode=art.mode||'goal',relation=art.relation||'in';
    if(art.place==='park') {
      out=`<path d="M30 260L315 180L535 292L245 390Z" fill="#e4ecdf"/><path d="M30 260L315 180L535 292L245 390Z" fill="none" stroke="#9daf92" stroke-width="3" stroke-dasharray="9 9"/>`;
      out+=`<path d="M117 313Q280 206 439 292" fill="none" stroke="#c2cdb7" stroke-width="30" stroke-linecap="round"/>`;
      for(const [x,y] of [[100,191],[409,214],[284,153]])out+=`<path d="M${x} ${y+63}v-48" stroke="#a38062" stroke-width="10"/><ellipse cx="${x}" cy="${y}" rx="36" ry="45" fill="#91ad85"/>`;
      const x=mode==='within'?245+Math.sin(q*Math.PI*2)*80:mix(10,310,q),y=mode==='within'?249+Math.cos(q*Math.PI*2)*13:mix(339,260,q);
      out+=`<path d="${mode==='within'?'M168 270Q230 210 325 260Q292 304 168 270':'M25 345Q146 355 300 270'}" stroke="${ac}" stroke-width="3" stroke-dasharray="7 8" fill="none" opacity=".45"/>`;
      out+=person(x,y,.78,ac,q*Math.PI*6);
      out+=text(mode==='within'?'Wo? · Dativ':'Wohin? · Akkusativ',115,75,31,ac,'font-weight="700"');
      out+=text(mode==='within'?'Die Bewegung bleibt im Park.':'Die Bewegung führt in den Park.',65,425,23);
      return out;
    }
    const dest={in:[287,254],an:[236,259],auf:[284,194],über:[284,97],unter:[284,311],vor:[249,340],hinter:[355,205],neben:[432,303],zwischen:[285,290]}[relation]||[287,254];
    const x=mode==='within'?dest[0]+Math.sin(q*Math.PI*2)*22:mix(55,dest[0],q), y=mode==='within'?dest[1]:mix(343,dest[1],q);
    const ball=`<g><ellipse cx="${x}" cy="${y+30}" rx="26" ry="7" fill="#263147" opacity=".12"/><circle cx="${x}" cy="${y}" r="26" fill="#c56c55"/><circle cx="${x-8}" cy="${y-9}" r="7" fill="#fff" opacity=".3"/></g>`;
    const crate=(dx=0)=>`<g transform="translate(${dx} 0)"><path d="M192 204L302 174L382 213L273 245Z" fill="#f1dfb9"/><path d="M192 204L273 245V339L192 298Z" fill="#d0b18b"/><path d="M273 245L382 213V306L273 339Z" fill="#e5cca3"/><path d="M204 218L259 246M204 244L259 272M204 269L259 298" stroke="#b39472" stroke-width="3"/></g>`;
    out+=`<path d="M55 343Q150 373 ${dest[0]} ${dest[1]}" stroke="${ac}" stroke-width="3" stroke-dasharray="7 8" fill="none" opacity=".4"/>`;
    if(relation==='hinter'||relation==='unter')out+=ball;
    if(['auf','über','unter'].includes(relation))out+=`<path d="M174 220L207 205H430L403 220Z" fill="#eddbbd"/>${rect(174,220,229,17,'#c9a77f',4)}${rect(184,237,16,109,'#b99a77',2)}${rect(377,237,16,109,'#b99a77',2)}`;
    else if(relation==='an')out+=`<path d="M265 123L399 168V331L265 287Z" fill="#e3d9c5" stroke="#b6a98e" stroke-width="2"/><path d="M265 287L399 331L353 357L218 312Z" fill="#eae4d6"/>`;
    else out+=relation==='zwischen'?crate(-120)+crate(130):crate();
    if(relation!=='hinter'&&relation!=='unter')out+=ball;
    if(relation==='in')out+=`<path d="M273 245L382 213V306L273 339Z" fill="#fffdf8" opacity=".52" stroke="#b39472" stroke-width="2" stroke-dasharray="6 5"/>`;
    out+=text(relation,60,75,48,ac,'font-family="Georgia,serif" font-style="italic"');
    out+=text(mode==='within'?'Wo? · bestehende Beziehung':'Wohin? · neue Beziehung',77,425,25,ac,'font-weight="600"');
    return out;
  }
  if(s.visual==='handoff'||s.visual==='perspective') {
    const camera=s.visual==='perspective'?q:0;
    if(art.object==='door'){
      out+=rect(292,91,167,259,'#dcd4c3',7)+rect(309,106,133,244,'#b8b09f',3);
      const w=mix(126,45,q);out+=`<path d="M312 109L${312+w} ${109+q*29}V${347-q*4}L312 347Z" fill="#c79c76" stroke="#a77d59" stroke-width="3"/>`;
      out+=`<circle cx="${312+w-12}" cy="233" r="5" fill="#e9d9ac"/>`+person(175,256,1.18,'#315eaf',q*1.5);
      out+=`<rect x="${mix(107,290,q)}" y="82" width="${mix(139,170,q)}" height="280" rx="20" fill="none" stroke="${ac}" stroke-width="3" stroke-dasharray="10 8"/>`;
      out+=text('Mara',134,388,25,'#315eaf')+text('die Tür',325,388,25,'#a64c3f')+text('Die Handlung bleibt dieselbe.',84,432,24);return out;
    }
    out+=rect(68,252,418,13,'#c9b08f',6)+rect(97,262,13,89,'#c9b08f',3)+rect(444,262,13,89,'#c9b08f',3);
    out+=person(115,202,1.1,'#315eaf')+person(449,202,1.1,'#167465');
    out+=`<path d="M155 180Q277 92 404 180" stroke="#a5aea6" stroke-width="3" fill="none" stroke-dasharray="7 8"/>`;
    out+=book(mix(163,391,q),180-Math.sin(q*Math.PI)*65,1.2);
    out+=text(art.left||'Mara',77,335,23,'#315eaf')+text(art.right||'Elias',408,335,23,'#167465');
    if(s.visual==='perspective')out+=`<rect x="${mix(62,239,camera)}" y="${mix(100,125,camera)}" width="${mix(105,115,camera)}" height="${mix(220,115,camera)}" rx="20" fill="none" stroke="${ac}" stroke-width="4" stroke-dasharray="12 8"/>`+text(art.label||'Die Handlung bleibt dieselbe.',64,420,24);
    else out+=text(art.label||'Wer gibt wem was?',130,420,25);
    return out;
  }
  if(s.visual==='quote') {
    out+=person(115,264,1.04,'#315eaf')+person(446,264,1.04,'#7950a0');
    out+=bubble(art.quote||'Ich bin bereit.',30,67,248);
    out+=`<path d="M250 173Q285 216 361 169" fill="none" stroke="#aeb6be" stroke-width="3" stroke-dasharray="8 8"/>`;
    out+=`<g transform="translate(${mix(150,350,q)} ${mix(177,216,q)}) rotate(${mix(-8,7,q)})">${rect(-47,-31,94,62,'#fffdf8',10,'stroke="#d9d5ce" stroke-width="2"')}${text('„…“',-29,9,34,'#7950a0')}</g>`;
    if(p>.4)out+=`<g opacity="${clamp((p-.4)*3)}">${bubble(art.report||'Sie sei bereit.',303,67,248)}</g>`;
    out+=text(art.label||'Eine Aussage · zwei Perspektiven',62,420,25);
    return out;
  }
  if(s.visual==='focus') {
    out+=rect(84,103,385,244,'#fffdf8',23,'stroke="#ded9ce" stroke-width="2"');
    out+=rect(84,103,385,55,'#e3e9f4',23)+text(art.label||'Was meinst du?',110,139,25);
    const entries=art.items||['heute','morgen','übermorgen'];
    entries.slice(0,3).forEach((v,i)=>{
      const chosen=i===(p>.5?(art.target??1):(art.source??0));
      out+=rect(108,181+i*48,333,42,chosen?'#f4e7cc':'#f5f3ed',10)+text(v,126,209+i*48,25,chosen?'#785607':'#6b7482');
      if(chosen)out+=`<circle cx="418" cy="${201+i*48}" r="6" fill="#95650a"/>`;
    });
    out+=`<path d="M61 372Q145 340 ${mix(137,403,q)} 366" stroke="#95650a" stroke-width="3" fill="none"/>`;
    out+=text(art.footer||'Der Fokus verändert die Aussage.',63,425,24);
    return out;
  }
  if(s.visual==='ending') {
    const carriers=art.items||['Artikel','Adjektiv','Nomen'],selected=art.carrier??1;
    carriers.slice(0,3).forEach((v,i)=>{
      const x=38+i*176,lit=i===selected&&p>.35;
      out+=`<path d="M${x+72} 52L${x+25} 233H${x+121}Z" fill="${lit?'#f2dfac':'#e9e6dc'}" opacity="${lit?'.65':'.35'}"/>`;
      out+=rect(x,220,158,105,lit?'#fbefcf':'#fffdf8',17,`stroke="${lit?'#b28b36':'#dcd8cd'}" stroke-width="2"`)+text(v,x+18,263,v.length>10?18:25);
      const ending=art.endings?.[i]||'—';out+=text(ending,x+18,304,Math.min(31,122/(ending.length*.55)),lit?'#8b6516':'#77818e','font-weight="700"');
      out+=`<circle cx="${x+73}" cy="68" r="19" fill="${lit?'#d6ab54':'#b6b5b0'}"/>`;
    });
    const sparkX=mix(111,111+selected*176,q);out+=`<circle cx="${sparkX}" cy="148" r="16" fill="#d7ad56" stroke="#a1792b" stroke-width="2"/><path d="M111 148H${111+selected*176}" stroke="#c5b080" stroke-width="2" stroke-dasharray="5 6"/>`;
    out+=text(art.label||'Die Form trägt Information.',68,425,25);
    return out;
  }
  if(s.visual==='nominal') {
    out+=person(98,239,.85,'#315eaf');
    out+=rect(145,147,125,62,'#e8e3ef',14)+text('Vorgang',159,186,23,'#7950a0');
    out+=rect(145,236,125,62,'#f1e1d8',14)+text('Bezug',159,275,23,'#a64c3f');
    out+=`<path d="M125 230L145 180M125 230L145 266M207 210V236" stroke="#b8b5b2" stroke-width="2"/>`;
    out+=`<path d="M222 213Q290 178 338 220" stroke="#aeb8bd" stroke-width="3" fill="none" stroke-dasharray="8 8"/>`;
    const noun=art.noun||'das Lesen';out+=`<g transform="translate(${mix(195,402,q)} ${mix(210,231,q)}) scale(${mix(.45,1,q)})">${rect(-90,-76,180,151,'#eee1c9',18,'stroke="#c8af86" stroke-width="2"')}${rect(-90,-84,87,23,'#dfc89f',8)}${rect(-72,-49,143,91,'#fffdf8',8)}${text(noun,-58,-8,Math.min(26,132/(noun.length*.55)))}${text('WER? · WAS?',-58,23,16,'#657186')}</g>`;
    out+=text(art.label||'Der Vorgang wird zur Nomengruppe.',52,425,24);
    return out;
  }
  if(s.visual==='slots') {
    // Topological sentence fields; the two verb pillars form the bracket. Changed cells light up.
    const names=art.fields||['Vorfeld','Position 2','Mittelfeld','Satzende','Nachfeld'],A=art.a||[],B=art.b||A,pillars=art.pillars||[1,3];
    const cols=[[24,100],[132,88],[228,150],[386,88],[482,76]],mid=i=>cols[i][0]+cols[i][1]/2;
    out=`<ellipse cx="290" cy="372" rx="262" ry="40" fill="#eae6db"/>`;
    if(!art.noBracket&&pillars.length===2){const a=mid(pillars[0]),b=mid(pillars[1]);out+=`<path d="M${a} 148Q${(a+b)/2} ${mix(118,64,q)} ${b} 148" fill="none" stroke="#7950a0" stroke-width="5" stroke-linecap="round" opacity=".6"/>`+text(art.bracket||'Satzklammer',(a+b)/2,mix(126,92,q),16,'#7950a0','text-anchor="middle" font-weight="700" letter-spacing="1"');}
    cols.forEach(([x,w],i)=>{
      const pillar=pillars.includes(i),a=A[i]||'',b=B[i]||'',lit=(a!==b||art.hot===i)&&p>.3;
      out+=rect(x,150,w,196,pillar?(lit?'#eadcf5':'#efebf3'):(lit?'#fbefcf':'#fffdf8'),14,`stroke="${pillar?'#7950a0':lit?'#b28b36':'#dcd8cd'}" stroke-width="${lit?3:2}"`);
      out+=text(names[i],x+w/2,174,Math.min(14,(w-8)/Math.max(1,[...names[i]].length*.56)),pillar?'#7950a0':'#657186','text-anchor="middle" font-weight="700"');
      const cell=(v,o)=>{if(!v)return '';const long=Math.max(...String(v).split(/\s+/).map(x=>[...x].length)),size=Math.min(22,(w-14)/(long*.56));
        return `<g opacity="${o}">`+lines(v,Math.max(3,Math.floor((w-14)/(size*.56)))).slice(0,6).map((l,j)=>text(l,x+8,210+j*size*1.3,size,pillar?'#5b3a7a':'#263147',pillar?'font-weight="700"':'')).join('')+'</g>';};
      out+=a===b?cell(a,1):cell(a,(1-clamp(p*2)).toFixed(2))+cell(b,clamp(p*2-.6).toFixed(2));
    });
    out+=text(art.footer||'Die Felder ordnen den Satz.',40,425,24);
    return out;
  }
  if(s.visual==='timeline') {
    // A time axis: events as pinned cards, an optional span and a relation arrow drawn with the beat.
    const ev=art.events||[],X=v=>48+clamp(v)*452,y0=318;
    out=`<path d="M36 ${y0}H522" stroke="#263147" stroke-width="3"/><path d="M528 ${y0}l-15-8v16z" fill="#263147"/>`;
    if(art.span){const a=X(art.span[0]),b=X(art.span[1]);out+=rect(a,y0-11,Math.max(4,mix(0,b-a,art.spanGrow===false?1:q)),22,'#d9e3f2',11,`stroke="${ac}" stroke-width="2"`);}
    if(Number.isFinite(art.now)){const x=X(art.now);out+=`<path d="M${x} ${y0+10}l-10 18h20z" fill="${ac}"/>`+text(art.nowLabel||'jetzt',x-22,y0+52,17,ac,'font-weight="700"');}
    ev.forEach((e,i)=>{
      const x=X(e.at),w=Math.min(190,Math.max(86,[...e.text].length*9.6+26)),cx=Math.max(20,Math.min(540-w,x-w/2)),cy=i%2?118:200,o=e.late?clamp(p*2-.4):1,hot=(art.focus===i||e.late)&&p>.3;
      out+=`<g opacity="${o.toFixed(2)}"><path d="M${x} ${cy+58}V${y0}" stroke="${hot?ac:'#b9b4a8'}" stroke-width="2" stroke-dasharray="4 5"/><circle cx="${x}" cy="${y0}" r="${hot?10:7}" fill="${hot?ac:'#8b8f99'}"/>`;
      out+=rect(cx,cy,w,58,hot?'#eef2fa':'#fffdf8',12,`stroke="${hot?ac:'#dcd8cd'}" stroke-width="2"`)+lines(e.text,Math.floor((w-16)/9.6)).slice(0,2).map((l,j)=>text(l,cx+10,cy+(e.text.length*9.6+26>w?24:35)+j*21,17,'#263147')).join('')+'</g>';
    });
    if(art.arrow&&ev[art.arrow[0]]&&ev[art.arrow[1]]){
      const a=X(ev[art.arrow[0]].at),b=X(ev[art.arrow[1]].at),len=Math.abs(b-a)*1.25+20;
      out+=`<path d="M${a} ${y0-14}Q${(a+b)/2} ${y0-76} ${b} ${y0-14}" fill="none" stroke="${ac}" stroke-width="3" stroke-dasharray="${len.toFixed(1)}" stroke-dashoffset="${(len*(1-q)).toFixed(1)}"/>`;
      if(art.arrowLabel)out+=`<g opacity="${clamp(p*2-.8).toFixed(2)}">${text(art.arrowLabel,(a+b)/2,y0-22,16,ac,'text-anchor="middle" font-weight="700"')}</g>`;
    }
    if(art.label)out+=text(art.label,52,75,27,ac,'font-weight="700"');
    out+=text(art.footer||'Die Zeitachse zeigt die Reihenfolge.',40,425,23);
    return out;
  }
  if(s.visual==='scale') {
    // A gauge: authored stops from left to right, the needle moves from source to target.
    const items=art.items||['möglich','wahrscheinlich','sicher'],n=items.length,cx=290,cy=318,r=188;
    const ang=i=>Math.PI*(1-i/Math.max(1,n-1)),pos=mix(art.source??0,art.target??n-1,q),now=Math.round(pos);
    out=`<path d="M${cx-r} ${cy}A${r} ${r} 0 0 1 ${cx+r} ${cy}" fill="none" stroke="#e3ddd0" stroke-width="24" stroke-linecap="round"/>`;
    items.forEach((v,i)=>{const a=ang(i),x=cx+Math.cos(a)*r,y=cy-Math.sin(a)*r,lx=cx+Math.cos(a)*(r+30),ly=cy-Math.sin(a)*(r+30)+6,hot=i===now&&p>.2;
      out+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${hot?15:10}" fill="${hot?ac:'#a7a9ae'}" stroke="#fffdf8" stroke-width="3"/>`;
      out+=text(v,lx.toFixed(1),ly.toFixed(1),Math.min(21,150/Math.max(1,[...v].length*.56)),hot?ac:'#566174',`text-anchor="${Math.cos(a)>.35?'start':Math.cos(a)<-.35?'end':'middle'}" font-weight="${hot?700:500}"`);});
    const a=Math.PI*(1-pos/Math.max(1,n-1));
    out+=`<path d="M${cx} ${cy}L${(cx+Math.cos(a)*(r-38)).toFixed(1)} ${(cy-Math.sin(a)*(r-38)).toFixed(1)}" stroke="#263147" stroke-width="7" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="17" fill="#263147"/>`;
    if(art.ends)out+=text(art.ends[0],cx-r-16,cy+46,16,'#657186')+text(art.ends[1],cx+r+16,cy+46,16,'#657186','text-anchor="end"');
    if(art.label)out+=text(art.label,40,52,25,ac,'font-weight="700"');
    out+=text(art.footer||'Die Wahl verändert die Stärke der Aussage.',40,425,23);
    return out;
  }
  if(s.visual==='link') {
    // Two propositions and the logical relation between them; the connector arrives with the beat.
    const kind=art.kind||'cause',lc=COLORS[art.leftRole||'agent'],rc=COLORS[art.rightRole||'patient'],ro=.35+.65*clamp(p*1.8);
    const card=(x,v,c,o,tag)=>`<g opacity="${o.toFixed(2)}">`+rect(x,152,222,140,'#fffdf8',18,`stroke="${c}" stroke-width="3"`)+(tag?text(tag,x+14,180,14,c,'font-weight="700" letter-spacing="1"'):'')+lines(v,17).slice(0,4).map((l,j)=>text(l,x+14,(tag?208:192)+j*25,20,'#263147')).join('')+'</g>';
    out=`<ellipse cx="290" cy="372" rx="250" ry="40" fill="#eae6db"/>`+card(24,art.left||'',lc,1,art.leftTag)+card(334,art.right||'',rc,ro,art.rightTag);
    const len=70,dash=`stroke-dasharray="${len}" stroke-dashoffset="${(len*(1-q)).toFixed(1)}"`;
    if(kind==='contrast'||kind==='alternative')out+=`<path d="M252 206H322M252 240H322" stroke="${ac}" stroke-width="4" ${dash}/><path d="M322 206l-11-7v14zM252 240l11-7v14z" fill="${ac}" opacity="${q.toFixed(2)}"/>`;
    else out+=`<path d="M250 222H322" stroke="${ac}" stroke-width="5" stroke-linecap="round" ${dash}/><path d="M330 222l-15-9v18z" fill="${ac}" opacity="${q.toFixed(2)}"/>`;
    const ix=290,iy=330,icon={
      cause:`<path d="M${ix+4} ${iy-24}L${ix-12} ${iy+3}H${ix+2}L${ix-6} ${iy+26}L${ix+14} ${iy-4}H${ix}Z" fill="#d7ad56" stroke="#a1792b" stroke-width="2"/>`,
      condition:`<path d="M${ix} ${iy-24}L${ix+24} ${iy}L${ix} ${iy+24}L${ix-24} ${iy}Z" fill="#e7e9f4" stroke="#7950a0" stroke-width="3"/>${text('?',ix-6,iy+8,22,'#7950a0','font-weight="700"')}`,
      concession:`<path d="M${ix-30} ${iy+20}H${ix+30}M${ix-18} ${iy+20}V${iy-2}M${ix+18} ${iy+20}V${iy-2}M${ix-24} ${iy-2}H${ix+24}" stroke="#a64c3f" stroke-width="5"/><path d="M${ix-42} ${iy+6}Q${ix} ${iy-52} ${ix+42} ${iy+6}" fill="none" stroke="${ac}" stroke-width="3"/>`,
      purpose:`<circle cx="${ix}" cy="${iy}" r="24" fill="#fffdf8" stroke="#a64c3f" stroke-width="4"/><circle cx="${ix}" cy="${iy}" r="13" fill="none" stroke="#a64c3f" stroke-width="4"/><circle cx="${ix}" cy="${iy}" r="4" fill="#a64c3f"/>`,
      means:`<circle cx="${ix}" cy="${iy}" r="15" fill="none" stroke="#167465" stroke-width="9" stroke-dasharray="7 5"/><circle cx="${ix}" cy="${iy}" r="5" fill="#167465"/>`,
      time:`<circle cx="${ix}" cy="${iy}" r="23" fill="#fffdf8" stroke="#315eaf" stroke-width="4"/><path d="M${ix} ${iy-14}V${iy}L${ix+11} ${iy+7}" stroke="#315eaf" stroke-width="4" fill="none" stroke-linecap="round"/>`,
      contrast:`<path d="M${ix-26} ${iy}H${ix+26}" stroke="#95650a" stroke-width="4"/><circle cx="${ix-26}" cy="${iy}" r="9" fill="#315eaf"/><circle cx="${ix+26}" cy="${iy}" r="9" fill="#a64c3f"/>`,
      alternative:`<path d="M${ix} ${iy+22}V${iy}L${ix-22} ${iy-20}M${ix} ${iy}L${ix+22} ${iy-20}" stroke="#7950a0" stroke-width="5" fill="none" stroke-linecap="round"/>`,
      addition:`<path d="M${ix-18} ${iy}H${ix+18}M${ix} ${iy-18}V${iy+18}" stroke="#167465" stroke-width="7" stroke-linecap="round"/>`,
      result:`<path d="M${ix-24} ${iy-14}H${ix+6}V${iy-26}L${ix+28} ${iy}L${ix+6} ${iy+26}V${iy+14}H${ix-24}Z" fill="#f1e1d8" stroke="#a64c3f" stroke-width="3"/>`
    }[kind]||'';
    out+=`<g opacity="${clamp(p*1.6).toFixed(2)}">${icon}</g>`;
    if(art.word){const w=Math.max(96,[...art.word].length*13+34);out+=`<g opacity="${clamp(p*2).toFixed(2)}" transform="translate(0 ${mix(-34,0,q).toFixed(1)})">${rect(290-w/2,88,w,46,'#263147',23)}${text(art.word,290,119,22,'#fffdf8','text-anchor="middle" font-weight="700"')}</g>`;}
    out+=text(art.footer||'Die Verbindung zeigt die Beziehung.',40,425,23);
    return out;
  }
  if(s.visual==='route') {
    // An authored place and an authored movement relative to it: to / at / from / along / through / around.
    const kind=art.kind||'room',mode=art.mode||'to',name=art.place||'';
    out=`<ellipse cx="290" cy="360" rx="262" ry="52" fill="#eae6db"/>`;
    if(kind==='room')out+=`<path d="M226 168L312 112L398 168Z" fill="#c9a77f"/>`+rect(236,168,152,170,'#f1dfb9',4,'stroke="#b39472" stroke-width="2"')+rect(292,262,40,76,'#b39472',3)+rect(250,190,124,30,'#fffdf8',6)+text(name,312,211,Math.min(18,116/Math.max(1,[...name].length*.56)),'#6b4f2e','text-anchor="middle" font-weight="700"');
    else if(kind==='surface')out+=`<path d="M176 300L276 248H470L392 300Z" fill="#e0e6d6" stroke="#9daf92" stroke-width="3"/><path d="M176 300H392V312H176Z" fill="#c2cdb7"/>`+text(name,300,285,18,'#4f6146','text-anchor="middle" font-weight="700"');
    else if(kind==='water')out+=`<path d="M330 360Q360 220 540 200V372H330Z" fill="#cfe3f0"/><path d="M350 300q20-10 40 0t40 0t40 0M370 250q20-10 40 0t40 0t40 0" stroke="#7fa9c7" stroke-width="3" fill="none"/><path d="M300 372Q320 260 345 230L330 372Z" fill="#efe1bd"/>`+text(name,440,345,18,'#2f5f80','text-anchor="middle" font-weight="700"');
    else if(kind==='person')out+=`<path d="M246 196L318 146L390 196Z" fill="#a64c3f" opacity=".8"/>`+rect(256,196,124,128,'#fbe9df',4,'stroke="#c88a76" stroke-width="2"')+rect(300,262,36,62,'#c88a76',3)+person(352,270,.55,'#167465')+text(name,318,180,Math.min(18,110/Math.max(1,[...name].length*.56)),'#fffdf8','text-anchor="middle" font-weight="700"');
    else if(kind==='city')out+=[[230,200,40,138],[274,160,46,178],[324,214,38,124],[366,178,44,160]].map(([x,y,w,h])=>rect(x,y,w,h,'#d8dde8',3,'stroke="#9aa5b8" stroke-width="2"')).join('')+text(name,320,365,19,'#3b4a66','text-anchor="middle" font-weight="700"');
    else if(kind==='river')out+=`<path d="M300 70Q250 200 330 360H392Q312 200 352 70Z" fill="#cfe3f0" stroke="#7fa9c7" stroke-width="2"/>`+text(name,370,90,18,'#2f5f80','font-weight="700"');
    const P={to:[[52,330],[300,310]],at:[[300,310],[300,310]],from:[[300,310],[520,336]],along:[[248,120],[268,352]],through:[[60,260],[540,262]],around:[[312,236],[312,236]]}[mode]||[[52,330],[300,310]];
    let x=mix(P[0][0],P[1][0],q),y=mix(P[0][1],P[1][1],q);
    if(mode==='around'){const a=q*Math.PI*2;x=312+Math.cos(a)*190;y=262+Math.sin(a)*86;}
    if(mode==='at'){x+=Math.sin(q*Math.PI*2)*10;}
    if(Number.isFinite(art.x)){x=art.x;y=art.y??y;}
    out+=`<path d="M${P[0][0]} ${P[0][1]+40}${mode==='around'?'m-30 0':''}L${P[1][0]} ${P[1][1]+40}" stroke="${ac}" stroke-width="3" stroke-dasharray="7 8" opacity="${mode==='at'||mode==='around'||Number.isFinite(art.x)?0:.45}"/>`;
    out+=person(x,y-40,.62,ac,q*Math.PI*6);
    // Inside a room: a translucent front wall shows that the person is in the space.
    if(kind==='room'&&(mode==='at'||(mode==='to'&&q>.85)||(mode==='from'&&q<.15)))out+=rect(236,226,152,112,'#f1dfb9',4,'opacity=".55"');
    if(art.label)out+=text(art.label,40,60,26,ac,'font-weight="700"');
    out+=text(art.footer||'',40,430,23);
    return out;
  }
  if(s.visual==='imagine') {
    // Reality stays solid; the imagined situation grows as a thought cloud. Authored text only.
    out=`<ellipse cx="290" cy="372" rx="250" ry="40" fill="#eae6db"/>`+person(118,292,1.05,'#315eaf',0);
    if(art.real){out+=rect(196,262,330,86,'#fffdf8',16,'stroke="#9aa1ab" stroke-width="2"')+text(art.realTag||'WIRKLICHKEIT',214,288,14,'#657186','font-weight="700" letter-spacing="1.5"')+lines(art.real,26).slice(0,2).map((l,j)=>text(l,214,316+j*24,20,'#263147')).join('');}
    const k=mix(.35,1,q),cx=352,cy=150;
    out+=`<g opacity="${(.25+.75*clamp(p*1.6)).toFixed(2)}" transform="translate(${cx} ${cy}) scale(${k.toFixed(3)})">`;
    for(const [x,y,r] of [[-118,8,46],[-62,-38,58],[8,-52,64],[82,-30,56],[132,12,44],[64,38,58],[-22,40,60],[-96,40,42]])out+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#f3eefb" stroke="#b9a5d6" stroke-width="2.5" stroke-dasharray="6 6"/>`;
    out+=`<ellipse cx="6" cy="-4" rx="150" ry="62" fill="#f3eefb"/>`+text(art.dreamTag||'VORSTELLUNG',-118,-30,14,'#7950a0','font-weight="700" letter-spacing="1.5"')+lines(art.dream||'',24).slice(0,3).map((l,j)=>text(l,-118,0+j*25,21,'#3d2a5c')).join('')+'</g>';
    out+=`<g opacity="${clamp(p*2).toFixed(2)}"><circle cx="190" cy="218" r="7" fill="#f3eefb" stroke="#b9a5d6" stroke-width="2"/><circle cx="206" cy="200" r="10" fill="#f3eefb" stroke="#b9a5d6" stroke-width="2"/></g>`;
    out+=text(art.footer||'Vorgestellt, nicht wirklich.',40,425,23);
    return out;
  }
  if(s.visual==='group') {
    // Sorting: authored items move into authored groups; nothing is classified by the renderer.
    const groups=art.groups||[],items=art.items||[],n=Math.max(1,groups.length),gap=14,bw=(520-gap*(n-1))/n,pal=['#315eaf','#a64c3f','#167465','#7950a0'];
    out=`<ellipse cx="290" cy="380" rx="262" ry="34" fill="#eae6db"/>`;
    groups.forEach((g,i)=>{const x=30+i*(bw+gap),c=pal[i%4];out+=rect(x,236,bw,148,'#fffdf8',16,`stroke="${c}" stroke-width="2.5" stroke-dasharray="${p>.5?'0':'7 6'}"`)+text(g,x+bw/2,410,Math.min(20,(bw-8)/Math.max(1,[...g].length*.56)),c,'text-anchor="middle" font-weight="700"');});
    let rx=30,ry=96;const count=new Array(n).fill(0);
    items.forEach((it,i)=>{
      const size=Math.min(19,(bw-14)/Math.max(1,[...it.text].length*.56)),w=Math.min(bw-6,[...it.text].length*size*.56+22);
      if(rx+w>550){rx=30;ry+=52;}const sx=rx,sy=ry;rx+=w+10;
      const g=Math.max(0,Math.min(n-1,it.g??0)),k=count[g]++,ex=30+g*(bw+gap)+(bw-w)/2,ey=248+k*42,qi=ease(clamp(p*1.7-i*.08));
      out+=`<g transform="translate(${mix(sx,ex,qi).toFixed(1)} ${mix(sy,ey,qi).toFixed(1)})">${rect(0,0,w,34,'#fffdf8',10,`stroke="${qi>.5?pal[g%4]:'#9da3ad'}" stroke-width="2"`)}${text(it.text,11,23,size,qi>.5?pal[g%4]:'#263147','font-weight="600"')}</g>`;
    });
    if(art.label)out+=text(art.label,32,62,24,ac,'font-weight="700"');
    return out;
  }
  // Clause frames: an embedded group opens and closes a matching boundary.
  out+=rect(45,137,470,176,'#fffdf8',24,'stroke="#ddd9ce" stroke-width="2"');
  const label=art.label||'ein Gedanke',targetW=Math.min(420,Math.max(257,label.length*14+36));
  const bw=mix(80,targetW,q),bx=280-bw/2;
  out+=rect(bx,179,bw,84,'#e7e9f4',15,'stroke="#7950a0" stroke-width="2"');
  out+=`<g opacity="${clamp((p-.3)*2)}">${text(label,bx+18,229,Math.min(26,(targetW-36)/(label.length*.55)),'#7950a0')}</g>`;
  out+=`<path d="M${bx-17} 180v83m${bw+35} -83v83" stroke="#a64c3f" stroke-width="4"/>`;
  out+=text(art.footer||'Die Grenze bleibt sichtbar.',91,422,25);
  return out;
}
function frame(timeline,seconds,opt={}) {
  const state=at(timeline,seconds),s=opt.scene||state.scene,p=opt.stage??state.stage, compact=!!opt.compact;
  // The lesson player has its own HTML heading and captions. Keep the artwork
  // close to its example there; the original video/export composition stays intact.
  if(opt.player){
    const W=compact?900:1500,tw=compact?824:800;
    const a=playerTokenLayout(s.from,tw),b=playerTokenLayout(s.to,tw);
    const same=JSON.stringify(s.from)===JSON.stringify(s.to);
    const th=same?a.height:Math.max(140,a.height+40)+b.height;
    const y=compact?455:80,H=compact?y+th+36:Math.max(470,y+th)+32;
    const art=`<g transform="translate(${compact?125:12} 0)">${illustration(s,p)}</g>`;
    const accessible=s.alt+' Ausgangspunkt: '+(s.from||[]).map(t=>t.text).join(' ')+' Ergebnis: '+(s.to||[]).map(t=>t.text).join(' ');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${E(accessible)}" font-family="Arial, Helvetica, sans-serif"><title>${E(s.title)}</title><desc>${E(accessible)}</desc>${art}${playerTokens(s,p,compact?38:680,y,tw)}</svg>`;
  }
  const W=compact?900:1600,H=compact?1190:900,ac=/^#[0-9a-f]{6}$/i.test(opt.accent||'')?opt.accent:'#315eaf';
  let body=rect(0,0,W,H,'#f5f2ea',0);
  body+=`<circle cx="${compact?765:1390}" cy="${compact?254:155}" r="${compact?105:150}" fill="#e7e1d5" opacity=".35"/>`;
  body+=text(opt.brand||'Deutschklinik',compact?38:70,compact?47:56,22,'#263147','font-weight="700"');
  body+=text(timeline.story.level+' / '+(s.section||'Grammatik in Bewegung'),compact?38:70,compact?90:110,18,ac,'letter-spacing="2" font-weight="700"');
  body+=paragraph(s.title,compact?38:70,compact?150:181,compact?29:46,compact?42:50,'#263147');
  if(compact) {
    body+=`<g transform="translate(162 178) scale(1.02)">${illustration(s,p)}</g>`;
    const a=tokenLayout(s.from,824,29),b=tokenLayout(s.to,824,29);
    const comparisonHeight=JSON.stringify(s.from)===JSON.stringify(s.to)?a.height:Math.max(165,a.height+52)+b.height;
    const tokenTop=Math.min(735,1040-comparisonHeight);
    body+=tokens(s,p,38,tokenTop,824,true);
    body+=`<g opacity="${opt.stage!=null||state.cue.beat===s.beats.length-1?1:0}">${paragraph(s.takeaway||'',38,1090,62,24)}</g>`;
  } else {
    body+=`<g transform="translate(52 238) scale(1.02)">${illustration(s,p)}</g>`;
    body+=tokens(s,p,700,335,830,false);
    body+=`<g opacity="${opt.stage!=null||state.cue.beat===s.beats.length-1?1:0}">${paragraph(s.takeaway||'',700,768,57,26)}</g>`;
  }
  body+=`<path d="M${compact?38:70} ${H-40}H${W-(compact?38:70)}" stroke="#d8d2c7" stroke-width="2"/>`;
  body+=`<path d="M${compact?38:70} ${H-40}H${(compact?38:70)+(W-(compact?76:140))*state.time/timeline.duration}" stroke="${ac}" stroke-width="3"/>`;
  body+=text(String(state.cue.scene+1).padStart(2,'0')+' / '+timeline.story.scenes.length,W-(compact?140:180),H-61,18,'#74808b');
  const accessible=s.alt+' Ausgangspunkt: '+(s.from||[]).map(t=>t.text).join(' ')+' Ergebnis: '+(s.to||[]).map(t=>t.text).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${E(accessible)}" font-family="Arial, Helvetica, sans-serif"><title>${E(s.title)}</title><desc>${E(accessible)}</desc>${body}</svg>`;
}
function stamp(seconds,separator='.') {
  const ms=Math.round(seconds*1000),h=Math.floor(ms/3600000),m=Math.floor(ms/60000)%60,s=Math.floor(ms/1000)%60;
  return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':')+separator+String(ms%1000).padStart(3,'0');
}
function vtt(timeline,opt={}){const start=opt.start??0,end=opt.end??timeline.duration;return 'WEBVTT\n\n'+timeline.cues.filter(c=>c.end>start&&c.start<end).map((c,i)=>`${i+1}\n${stamp(Math.max(c.start,start)-start)} --> ${stamp(Math.min(c.end,end)-start)}\n${c.say}\n`).join('\n');}
function manifest(timeline){return {version:1,id:timeline.story.id,title:timeline.story.title,duration:timeline.duration,language:'de',audio:'One local audio file per cue; filenames must match the cue id.',cues:timeline.cues.map(c=>({...c,audio:c.id+'.mp3'}))};}
function recordingMatches(cue,plan){const entries=Array.isArray(plan?.cues)?plan.cues.filter(c=>c.id===cue.id):[];return entries.length===1&&entries[0].say===cue.say;}
const API={validate,compile,at,frame,manifest,recordingMatches,vtt,stamp,visuals:VISUALS};
if(typeof module!=='undefined'&&module.exports)module.exports=API;
root.GRAM_FILM=API;
if(!root.document)return;

/* Player and lesson activity. No autoplay, speech synthesis, observer, or global art patch. */
let active=null;const mounted=new Set();
function download(name,data,type='application/json') {
  const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function mount(host,story,opt={}) {
  validate(story);const disposables=[],clips=new Map(),durations={};
  // opt.audio: {cueId: {url, seconds, say}} from a recording manifest. A clip is used only while its text still matches the cue.
  for(const c of compile(story).cues){const a=opt.audio?.[c.id];if(a&&typeof a.url==='string'&&a.say===c.say&&a.seconds>0){clips.set(c.id,{url:a.url,given:true});durations[c.id]=a.seconds;}}
  let timeline=compile(story,durations),recordingPlan=null,time=0,playing=false,raf=0,clock=0,offset=0,rate=1,audio=null,audioId='',lastCue='',disposed=false,exploration=null,exploreScene=null;
  const media=root.matchMedia?.('(prefers-reduced-motion: reduce)'),compact=root.matchMedia?.('(max-width: 640px)');
  let reduce=!!media?.matches;
  host.classList.add('gf');host.lang='de';
  host.innerHTML=`<header class="gf-head"><div><p class="gf-eyebrow">${E(opt.brand||'Deutschklinik')} · ${E(story.level)} · Lernstudio</p><h2>${E(story.title)}</h2></div>${opt.close?'<button type="button" data-close aria-label="Lernstudio schließen">✕</button>':''}</header><div class="gf-stage"><div class="gf-scene-bar"><label class="gf-scene-picker"><span>Szene</span><select data-scene-select aria-label="Szene auswählen">${story.scenes.map((s,i)=>`<option value="${i}">${String(i+1).padStart(2,'0')} · ${E(s.title)}</option>`).join('')}</select></label><button type="button" data-explore-toggle aria-pressed="false">Ausprobieren</button></div><div class="gf-workspace"><div class="gf-manipulation" hidden></div><div class="gf-caption" aria-live="off"></div><div class="gf-view"></div></div><div class="gf-playback"><div class="gf-transport"><button type="button" data-prev aria-label="Vorherige Erklärung">←</button><button type="button" class="gf-primary" data-play>Abspielen</button><button type="button" data-next aria-label="Nächste Erklärung">→</button><output class="gf-time"></output><label class="gf-speed">Tempo<select aria-label="Wiedergabetempo"><option value=".75">0,75×</option><option value="1" selected>1×</option><option value="1.25">1,25×</option><option value="1.5">1,5×</option></select></label></div><label class="gf-scrub"><span>Filmposition</span><input type="range" min="0" max="${timeline.duration}" step=".05" value="0" aria-label="Filmposition"></label></div></div><div class="gf-bottom"><section class="gf-explore"><h3>Kurz prüfen.</h3><div class="gf-question"></div></section><details class="gf-scene-list"><summary>Alle ${story.scenes.length} Szenen</summary><nav class="gf-chapters" aria-label="Szenen"></nav></details></div><details class="gf-production"><summary>Stimme & Video</summary><p>Sprachaufnahmen bleiben auf deinem Gerät. Für jeden Sprechabschnitt ist eine Datei vorgesehen. Dateiname und Text stehen im Sprechplan. Die Aufnahme bestimmt die Dauer des Abschnitts.</p><label>Sprachdateien hinzufügen<input type="file" accept="audio/*" multiple data-audio></label><button type="button" data-script>Sprechplan (.json)</button><button type="button" data-subs>Untertitel (.vtt)</button><button type="button" data-frame>Bild (.svg)</button><p>MP4-Export: mit dem lokalen Filmwerkzeug. Keine Aufnahme wird hochgeladen.</p></details><p class="gf-status" role="status"></p>`;
  const $=s=>host.querySelector(s),view=$('.gf-view'),caption=$('.gf-caption'),range=$('[aria-label="Filmposition"]'),status=$('.gf-status');
  $('.gf-production').hidden=!opt.production;
  $('[data-audio]').accept='audio/*,.json';
  const recordingHint=document.createElement('p');recordingHint.textContent='Wähle die MP3-Dateien zusammen mit ihrem JSON-Sprechplan. Dateinamen und genauer Text müssen zum aktuellen Film passen.';$('.gf-production').append(recordingHint);
  if(opt.onExercises){const button=document.createElement('button');button.type='button';button.textContent='Mit Aufgaben festigen';button.className='gf-to-exercises';button.onclick=opt.onExercises;$('.gf-explore').append(button);}
  $('.gf-chapters').innerHTML=story.scenes.map((s,i)=>`<button type="button" data-scene="${i}"><span>${String(i+1).padStart(2,'0')}</span>${E(s.title)}</button>`).join('');
  const theme=()=>({compact:!!compact?.matches,accent:opt.accent,brand:opt.brand});
  const on=(el,event,fn)=>{el.addEventListener(event,fn);disposables.push(()=>el.removeEventListener(event,fn));};
  // One audio element for every clip: Safari on iPhone lets an element keep playing after the first tap, not a new one per line.
  let voice=null;
  function clearAudio(){if(audio){audio.onended=audio.onerror=null;audio.pause();audio.removeAttribute('src');audio.load();audio=null;}audioId='';}
  function stop(){playing=false;cancelAnimationFrame(raf);clearAudio();$('[data-play]').textContent='Abspielen';}
  function question(s) {
    const area=$('.gf-question');area.replaceChildren();
    $('.gf-explore').hidden=!s.quiz&&!opt.onExercises;
    $('.gf-explore h3').hidden=!s.quiz;
    const tools=$('.gf-manipulation');tools.replaceChildren();exploreScene=null;
    const canExplore=JSON.stringify(s.from)!==JSON.stringify(s.to)||s.beats.some(b=>b.stage!==s.beats[0].stage);
    const variants=s.variants?.length?s.variants:!s.matrix&&canExplore?[{label:'Beispiel untersuchen',takeaway:s.takeaway}]:[];
    if(variants.length){
      const group=document.createElement('div');group.className='gf-options';
      const hint=document.createElement('p');hint.className='gf-hint';hint.textContent=s.variants?.length?'Wähle eine Perspektive. Bewege dann den Regler.':'Bewege den Regler und beobachte das Beispiel.';tools.append(hint,group);
      const label=document.createElement('label');label.className='gf-change';label.textContent='Veränderung untersuchen';const slider=document.createElement('input');slider.type='range';slider.min=0;slider.max=1;slider.step=.01;slider.value=0;slider.setAttribute('aria-label','Veränderung untersuchen');label.append(slider);tools.append(label);
      let variant=variants[0];
      const show=()=>{stop();exploration={scene:at(timeline,time).cue.scene,override:{...s,...variant},stage:+slider.value,caption:variant.takeaway||s.takeaway||'',label:variant.label};draw();};
      exploreScene=show;
      if(s.variants?.length)variants.forEach((v,i)=>{const button=document.createElement('button');button.type='button';button.textContent=v.label;button.setAttribute('aria-pressed',String(i===0));button.onclick=()=>{variant=v;slider.value=0;group.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));show();};group.append(button);});slider.oninput=show;
    }
    if(s.matrix){
      const box=document.createElement('div');box.className='gf-matrix';const selections=[];
      for(const [name,values] of [['Begleiter',s.matrix.modes],['Kasus',s.matrix.cases],['Genus / Zahl',s.matrix.genders]]){
        const label=document.createElement('label');label.textContent=name;const select=document.createElement('select');select.setAttribute('aria-label',name);
        values.forEach((v,i)=>{const o=document.createElement('option');o.value=i;o.textContent=v;select.append(o);});label.append(select);box.append(label);selections.push(select);
      }
      const output=document.createElement('p');output.setAttribute('role','status');box.append(output);tools.append(box);
      const show=()=>{stop();const [mode,c,g]=selections.map(e=>+e.value),cell=s.matrix.cells.find(x=>x.mode===mode&&x.c===c&&x.g===g);
        const carrier=!cell.article?(c===3&&g<2?2:1):/^(ein|kein|mein)$/.test(cell.article)?1:0;
        const override={...s,alt:s.matrix.cases[c]+' · '+s.matrix.genders[g]+': '+cell.phrase,from:[{id:'phrase',text:cell.phrase,role:'ending'}],to:[{id:'phrase',text:cell.phrase,role:'ending'}],fromLabel:s.matrix.cases[c]+' · '+s.matrix.genders[g],toLabel:'ENDUNG -'+cell.ending.toUpperCase(),art:{items:[cell.article||'ohne Artikel','alt',cell.noun],endings:[cell.article?'Begleiter':'—','-'+cell.ending,carrier===2?'Genitiv-s':'Nomen'],carrier},takeaway:'Im gewählten Muster lautet die Form: '+cell.phrase+'.'};
        output.textContent=cell.phrase+' · Adjektivendung -'+cell.ending;exploration={scene:at(timeline,time).cue.scene,override,stage:1,caption:override.takeaway,label:'Endungen vergleichen'};draw();
      };selections.forEach(e=>e.onchange=show);output.textContent=s.matrix.cells[0].phrase;
      exploreScene=show;
    }
    $('[data-explore-toggle]').disabled=!exploreScene;
    if(!s.quiz){if(!variants.length&&!s.matrix)area.innerHTML='<p>Beobachte das Beispiel. Gehe dann zur nächsten Erklärung.</p>';return;}
    const p=document.createElement('p');p.textContent=s.quiz.prompt;area.append(p);
    const options=document.createElement('div');options.className='gf-options';
    const feedback=document.createElement('p');feedback.className='gf-feedback';feedback.setAttribute('role','status');
    const shift=[...s.id].reduce((n,c)=>n+c.charCodeAt(0),0)%s.quiz.options.length;
    const optionsInOrder=[...s.quiz.options.slice(shift),...s.quiz.options.slice(0,shift)];
    optionsInOrder.forEach(o=>{const b=document.createElement('button');b.type='button';b.textContent=o.text;b.onclick=()=>{
      stop();options.querySelectorAll('button').forEach(x=>{x.removeAttribute('data-correct');x.setAttribute('aria-pressed','false');});b.setAttribute('data-correct',String(!!o.correct));b.setAttribute('aria-pressed','true');feedback.textContent=(o.correct?'Richtig. ':'Schau noch einmal hin. ')+o.feedback;
      const t=timeline.cues.filter(c=>c.scene===at(timeline,time).cue.scene).at(-1);time=t.start+Math.min(3,t.seconds);exploration=null;draw();
    };options.append(b);});area.append(options,feedback);
  }
  function draw(){
    const state=at(timeline,time),cue=state.cue;
    const manual=exploration?.scene===cue.scene?exploration:null;
    view.innerHTML=frame(timeline,time,{...theme(),player:true,...(manual?{scene:manual.override,stage:manual.stage}:reduce?{stage:cue.stage}:{})});
    caption.textContent=manual?manual.caption:cue.say;range.value=String(time);range.max=String(timeline.duration);range.setAttribute('aria-valuetext',stamp(time).slice(3,8)+' von '+stamp(timeline.duration).slice(3,8));
    host.classList.toggle('gf-exploring',!!manual);$('.gf-manipulation').hidden=!manual;$('.gf-playback').hidden=!!manual;
    $('[data-explore-toggle]').textContent=manual?'Zurück zum Film':'Ausprobieren';$('[data-explore-toggle]').setAttribute('aria-pressed',String(!!manual));
    $('[data-scene-select]').value=String(cue.scene);
    $('.gf-time').textContent=stamp(time).slice(3,8)+' / '+stamp(timeline.duration).slice(3,8);
    if(lastCue!==String(cue.scene)){
      lastCue=String(cue.scene);$('.gf-chapters').querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',b.dataset.scene===lastCue?'step':'false'));question(state.scene);
    }
  }
  function seek(t){stop();exploration=null;time=Math.max(0,Math.min(timeline.duration,t));draw();}
  function revealWorkspace(){
    const stage=$('.gf-stage'),tools=$('.gf-scene-bar').getBoundingClientRect(),area=$('.gf-workspace').getBoundingClientRect();
    const inset=opt.close?$('.gf-head').getBoundingClientRect().height+8:76;
    // Align once on entering the activity, never while a pointer drags the slider.
    if(tools.top<inset||area.bottom>root.innerHeight-12){stage.style.scrollMarginTop=inset+'px';stage.scrollIntoView?.({block:'start',inline:'nearest',behavior:'instant'});}
  }
  function tick(now){
    if(!playing||disposed)return;
    if(!host.isConnected){dispose();return;}
    const state=at(timeline,time),cue=state.cue,clip=clips.get(cue.id);
    if(clip){
      if(audioId!==cue.id){clearAudio();audio=voice||(voice=new Audio());audio.preload='auto';audio.src=clip.url;audioId=cue.id;
        // fetch the next recorded line while this one plays
        const next=timeline.cues[timeline.cues.indexOf(cue)+1],ahead=next&&clips.get(next.id);if(ahead?.given&&!ahead.warm){ahead.warm=true;fetch(ahead.url).catch(()=>{ahead.warm=false;});}audio.playbackRate=rate;audio.currentTime=Math.max(0,time-cue.start);audio.onended=()=>{time=cue.end;clearAudio();clock=performance.now();offset=time;};audio.onerror=()=>{stop();status.textContent='Diese Sprachdatei konnte nicht abgespielt werden.';};audio.play().catch(()=>{stop();status.textContent='Bitte Wiedergabe erneut starten, um Audio zu erlauben.';});}
      if(audio)time=cue.start+Math.min(cue.seconds,audio.currentTime);
    } else {
      if(audio)clearAudio();time=Math.min(cue.end,offset+(now-clock)/1000*rate);
      if(time>=cue.end){clock=now;offset=time;}
    }
    draw();if(time>=timeline.duration){stop();return;}raf=requestAnimationFrame(tick);
  }
  on($('[data-play]'),'click',()=>{if(playing){stop();return;}if(time>=timeline.duration)time=0;playing=true;clock=performance.now();offset=time;$('[data-play]').textContent='Pause';tick(performance.now());});   // first frame inside the tap, so the sound may start
  on($('[data-prev]'),'click',()=>{const c=at(timeline,time).cue,i=timeline.cues.indexOf(c);seek(timeline.cues[Math.max(0,i-1)].start);});
  on($('[data-next]'),'click',()=>{const c=at(timeline,time).cue,i=timeline.cues.indexOf(c);seek(timeline.cues[Math.min(timeline.cues.length-1,i+1)].start);});
  on(range,'input',()=>seek(+range.value));
  on($('[data-scene-select]'),'change',e=>seek(timeline.cues.find(c=>c.scene===+e.target.value).start));
  on($('[data-explore-toggle]'),'click',()=>{if(exploration){exploration=null;draw();}else{exploreScene?.();revealWorkspace();}});
  on($('.gf-chapters'),'click',e=>{const b=e.target.closest('[data-scene]');if(b)seek(timeline.cues.find(c=>c.scene===+b.dataset.scene).start);});
  on($('.gf-speed select'),'change',e=>{rate=+e.target.value;clock=performance.now();offset=time;if(audio)audio.playbackRate=rate;});
  on(document,'visibilitychange',()=>{if(document.hidden)stop();});
  const resize=()=>draw();compact?.addEventListener('change',resize);disposables.push(()=>compact?.removeEventListener('change',resize));
  const motion=()=>{reduce=!!media.matches;stop();draw();};media?.addEventListener('change',motion);disposables.push(()=>media?.removeEventListener('change',motion));
  on($('[data-script]'),'click',()=>download(story.id+'-narration.json',JSON.stringify(manifest(timeline),null,2)));
  on($('[data-subs]'),'click',()=>download(story.id+'.vtt',vtt(timeline),'text/vtt'));
  on($('[data-frame]'),'click',()=>download(story.id+'-'+Math.round(time)+'.svg',frame(timeline,time,theme()),'image/svg+xml'));
  on($('[data-audio]'),'change',async e=>{
    stop();const keys=new Map(timeline.cues.map(c=>[c.id,c])),accepted=[],rejected=[],files=Array.from(e.target.files);
    const plans=files.filter(f=>/\.json$/i.test(f.name));
    if(plans.length>1){status.textContent='Bitte nur einen Sprechplan zusammen mit den Sprachdateien auswählen.';return;}
    if(plans.length){
      try{const candidate=JSON.parse(await plans[0].text());if(!Array.isArray(candidate.cues)||timeline.cues.some(c=>!recordingMatches(c,candidate)))throw Error('Text mismatch');recordingPlan=candidate;}
      catch{status.textContent='Der Sprechplan passt nicht zum aktuellen Film. Bitte den genauen Text und die Abschnittsnummern prüfen.';return;}
    }
    if(disposed)return;
    for(const file of files.filter(f=>!/\.json$/i.test(f.name))){
      const id=file.name.replace(/\.[^.]+$/,'');if(!keys.has(id)){rejected.push(file.name);continue;}
      if(!recordingMatches(keys.get(id),recordingPlan)){rejected.push(file.name+' (passender Sprechplan fehlt)');continue;}
      const url=URL.createObjectURL(file),probe=new Audio();probe.preload='metadata';
      try{
        const duration=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Audio metadata timeout')),5000);probe.onloadedmetadata=()=>{clearTimeout(timeout);Number.isFinite(probe.duration)&&probe.duration>0?resolve(probe.duration):reject(Error('Invalid duration'));};probe.onerror=()=>{clearTimeout(timeout);reject(Error('Unreadable audio'));};probe.src=url;});
        if(disposed){URL.revokeObjectURL(url);continue;}const old=clips.get(id);if(old&&!old.given)URL.revokeObjectURL(old.url);clips.set(id,{url});durations[id]=duration;accepted.push(id);
      }catch{URL.revokeObjectURL(url);rejected.push(file.name);}finally{probe.removeAttribute('src');probe.load();}
    }
    timeline=compile(story,durations);time=0;lastCue='';exploration=null;draw();status.textContent=accepted.length+' Sprachdatei(en) geladen.'+(rejected.length?' Nicht zugeordnet: '+rejected.join(', '):'');
  });
  let observer;
  function dispose(){if(disposed)return;disposed=true;stop();observer?.disconnect();disposables.forEach(f=>f());clips.forEach(c=>{if(!c.given)URL.revokeObjectURL(c.url);});host.replaceChildren();mounted.delete(controller);opt.onDispose?.();}
  // Only watch ancestors of this player, never scan the complete document after mutations.
  observer=new MutationObserver(()=>{if(!host.isConnected)dispose();});for(let parent=host.parentNode;parent;parent=parent.parentNode)observer.observe(parent,{childList:true});
  if(opt.close)on($('[data-close]'),'click',opt.close);
  const controller={dispose,pause:stop,seek,get timeline(){return timeline;},get recorded(){return clips.size;}};mounted.add(controller);draw();return controller;
}
function open(story,opt={}) {
  mounted.forEach(p=>p.pause());if(active)active();const previous=document.activeElement,scroll=document.body.style.overflow;
  const dialog=document.createElement('dialog');dialog.className='gf-dialog';const host=document.createElement('div');dialog.append(host);document.body.append(dialog);
  const close=()=>{player.dispose();dialog.close();dialog.remove();document.body.style.overflow=scroll;previous?.focus();active=null;};
  const player=mount(host,story,{...opt,close});dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.showModal();document.body.style.overflow='hidden';active=close;return player;
}
API.mount=mount;API.open=open;API.close=()=>active?.();
})(typeof window!=='undefined'?window:globalThis);
