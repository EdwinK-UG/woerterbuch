/* C1 Wortwelten: private lesson data, public renderer. No dictionary-ID dependency. */
(function(root){
 'use strict';
 const H=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const label=e=>e.display||((e.article?e.article+' ':'')+(e.term||e.w||''));
 const norm=s=>String(s??'').normalize('NFC').trim().toLocaleLowerCase('de').replace(/ß/g,'ss').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/[.,!?;:„“"'()]/g,'').replace(/\s+/g,' ');
 const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 const glossStop=new Set('this that with from into through someone somebody something oneself person people other their another have make give take very more less also particular only used whose which one per can man woman generic to the and for'.split(' '));
 const glossTokens=e=>new Set((e.en||[]).join(' ').toLowerCase().match(/[a-z]+/g)?.filter(x=>x.length>2&&!glossStop.has(x))||[]);
 const synonymSets=[['talkative','garrulous','gabby','loquacious','communicative','chatty'],['silent','taciturn','reticent','discreet'],['sly','cunning','sneaky','underhand','treacherous','insidious','perfidious'],['reduce','decline','decrease','shrink','diminish','lower'],['increase','rise','grow','climb','expand','soar']];
 function overlaps(a,b){const left=glossTokens(a),right=glossTokens(b);return (a.en||[]).some(x=>(b.en||[]).some(y=>norm(x)===norm(y)))||[...left].some(x=>right.has(x))||synonymSets.some(xs=>xs.some(x=>left.has(x))&&xs.some(x=>right.has(x)))}
 const svg=(name)=>({arrow:'M5 12h14m-5-5 5 5-5 5',check:'m5 12 4 4L19 6',close:'m6 6 12 12M6 18 18 6',cards:'M7 4h12v14H7zM3 8v14h12',game:'M7 7h10l4 9q0 4-4 0H7q-4 4-4 0zM8 9v6m-3-3h6m5 0h.01',search:'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',sound:'M11 4 5 9H2v6h3l6 5zM15 8q5 4 0 8m3-12q8 8 0 16',plus:'M12 5v14M5 12h14',back:'M19 12H5m5-5-5 5 5 5',star:'m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z'}[name]||'');
 const icon=n=>`<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${'<path d="'+svg(n)+'"/>'}</svg>`;
 const safeURL=u=>{try{const x=new URL(u);return x.protocol==='https:'?x.href:''}catch{return ''}};
 function sourceHTML(s){
  if(!s)return '';
  const url=safeURL(s.url),tr=safeURL(s.translationUrl),original=safeURL(s.original);
  return `<span class="vw-source">${url?`<a href="${H(url)}" target="_blank" rel="noopener">${H(s.title)}</a>`:H(s.title)}${s.author?' · '+H(s.author):''}${tr?` · <a href="${H(tr)}" target="_blank" rel="noopener">EN${s.translationAuthor?' · '+H(s.translationAuthor):''}</a>`:''}${s.license?' · '+H(s.license):''}${original?` · <a href="${H(original)}" target="_blank" rel="noopener">Originalbeleg</a>`:''}</span>`;
 }
 function exampleHTML(ex){return `<blockquote class="vw-quote">${ex.fragment?'<span class="vw-overline">Belegte Wortverbindung / Überschrift</span>':/[.…]…|…|\[.*?….*?\]/.test(ex.de)?'<span class="vw-overline">Belegauszug</span>':''}<p lang="de">${H(ex.de)}</p>${ex.en?`<p class="vw-translation" lang="en">${H(ex.en)}</p>`:''}<footer>${sourceHTML(ex.source)}</footer></blockquote>`}
 const wordPayload=e=>JSON.parse(JSON.stringify({version:2,id:e.id,term:e.term,article:e.article,display:e.display,variants:e.variants,en:e.en,forms:e.forms,note:e.note,pattern:e.pattern,examples:e.examples,visual:e.visual,pos:e.pos,sources:e.sources}));
 function selected(c,ids){const wanted=ids==null?null:new Set(ids);return (c.words||[]).filter(e=>!wanted||wanted.has(e.id))}
 function accepted(e){
  const term=e.term||e.w||'',xs=[label(e)];
  if(!e.article){const bare=term.replace(/^(?:(?:etw\.(?:\s*\/\s*jmdn\.)?|jmdn\.|jmdm\.|jmds\.)\s+)+/i,'');if(bare!==term)xs.push(bare);}
  if(e.variants?.length)xs.push(...e.variants);
  else if(e.article==='der/die')xs.push('der '+term,'die '+term);
  // Phrases with conventional dictionary placeholders can also be recalled as their full pattern.
  if(e.pattern&&e.pattern!==label(e))xs.push(e.pattern.replace(/\|/g,''));
  return [...new Set(xs)];
 }
 function cloze(e){
  const ex=e.examples?.[0];if(!ex)return null;
  const explicit=ex.cloze;
  if(explicit&&explicit.answer&&ex.de.includes(explicit.answer))return {p:ex.de.replace(explicit.answer,'_____'),answer:explicit.answer,source:ex.source};
  // Only hide attested whole surface forms. Never guess an inflected answer.
  const forms=[e.term,...(e.forms||[]),...(e.surfaceForms||[])].filter(x=>x&&!/\b(?:etw\.|jmdn\.|jmdm\.)/.test(x)).sort((a,b)=>b.length-a.length);
  for(const f of forms){
   const escaped=f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   const rx=new RegExp('(?<![\\p{L}])('+escaped+')(?![\\p{L}])','iu'),m=rx.exec(ex.de);
   if(m)return {p:ex.de.slice(0,m.index)+'_____'+ex.de.slice(m.index+m[0].length),answer:m[0],source:ex.source};
  }
  return null;
 }
 function questions(c,ids,count=10,mode='mixed'){
  const words=selected(c,ids),all=c.words||[],out=[];
  for(const e of shuffle(words)){
   const gap=cloze(e),ctx=mode==='context'||(mode==='mixed'&&out.length%2===1);
   if(ctx&&gap){out.push({t:'type',p:gap.p,ans:[gap.answer],sub:(e.en||[])[0]||'Das Wort aus dem Kontext',wordId:e.id,source:gap.source,kind:'context'});continue}
   if(mode==='recall'){out.push({t:'type',p:(e.en||[]).slice(0,2).join(' · '),ans:accepted(e),sub:e.article?'Auf Deutsch, mit Artikel':'Das Wort / die Wendung aus dieser Wortwelt',wordId:e.id,kind:'recall'});continue}
   if(ctx){
    const answer=label(e),others=[...new Set(shuffle(all.filter(x=>x.id!==e.id&&!overlaps(x,e))).map(label))].filter(x=>x!==answer).slice(0,3),o=shuffle([answer,...others]);
    if(others.length){out.push({t:'mc',p:(e.en||[]).slice(0,2).join(' · '),o,c:o.indexOf(answer),sub:'Welche deutsche Wortverbindung passt?',wordId:e.id,kind:'recall'});continue}
    out.push({t:'type',p:(e.en||[])[0],ans:accepted(e),sub:'Auf Deutsch',wordId:e.id,kind:'recall'});continue;
   }
   const answer=(e.en||[])[0];if(!answer)continue;
   const distractors=[...new Set(shuffle(all.filter(x=>x.id!==e.id&&!overlaps(x,e)&&(x.pos===e.pos||all.length<8))).map(x=>x.en?.[0]).filter(Boolean))].slice(0,3);
   if(distractors.length<2)for(const x of shuffle(all))if(x.id!==e.id&&x.en?.[0]&&!overlaps(x,e)&&!distractors.includes(x.en[0])){distractors.push(x.en[0]);if(distractors.length===3)break}
   if(distractors.length<1){out.push({t:'type',p:answer,ans:accepted(e),sub:'Auf Deutsch',wordId:e.id,kind:'recall'});continue}
   const o=shuffle([answer,...distractors]);out.push({t:'mc',p:label(e),o,c:o.indexOf(answer),sub:'Welche Bedeutung passt?',wordId:e.id,kind:'meaning'});
  }
  return out.slice(0,Math.max(1,count)).map(q=>({...q,nativeVocabulary:true}));
 }
 function grade(q,given){if(given==null||typeof given==='boolean'||String(given).trim()==='')return false;return q.t==='mc'?Number(given)===q.c:(q.ans||[]).some(a=>norm(a)===norm(given))}
 function cardHTML(e,revealed){
  if(!revealed)return `<span class="fside">Erst erinnern. Dann umdrehen.</span><span class="vw-card-clue" lang="en">${H((e.en||[]).slice(0,2).join(' · '))}</span><span class="tap">${e.article?'Auf Deutsch, mit Artikel':'Das deutsche Wort oder die Wendung'}</span>`;
  return `<div class="vw-flashback" lang="de"><div class="vw-flash-art">${root.C1_ART.draw(e)}</div><div><p class="vw-overline">C1 · Deine Wortkarte</p><h2>${H(label(e))}</h2><p lang="en">${H((e.en||[]).join(' · '))}</p>${e.forms?.length?`<p class="vw-form">${e.forms.map(H).join(' · ')}</p>`:''}${e.note?`<p class="vw-note">${H(e.note)}</p>`:''}${(e.examples||[]).slice(0,1).map(exampleHTML).join('')}</div></div>`;
 }
 let active=null;
 function mount(host,c,bridge={}){
  if(active)active.destroy();
  const state={selected:new Set(),game:new Set(),group:'',query:'',page:1,roundPage:1,view:'cards',round:null,dialog:null,alive:true};
  const words=c.words||[],byId=new Map(words.map(e=>[e.id,e])),groups=[...new Set(words.flatMap(e=>e.groups||[e.group]))],PAGE=24;
  const notify=s=>bridge.toast?.(s), art=e=>root.C1_ART.draw(e),best=id=>bridge.best?.(id),pass=bridge.pass??.7;
  const filtered=()=>words.filter(e=>(!state.group||(e.groups||[e.group]).includes(state.group))&&(!state.query||norm(label(e)+' '+e.en.join(' ')+' '+(e.note||'')).includes(norm(state.query))));
  const done=()=>c.exercises.filter(x=>{const b=best(x.id);return b&&b.score/b.total>=pass}).length;
  const button=(text,act,cls='',extra='')=>`<button ${/\btype=/.test(extra)?'':'type="button"'} class="vw-button ${cls}" data-vact="${act}" ${extra}>${text}</button>`;
  function toolbar(){
   if(!state.selected.size&&!state.game.size)return '';
   return `<div class="vw-tray" aria-label="Ausgewählte Wörter"><div><span class="vw-tray-count">${state.selected.size}</span><span>ausgewählt</span>${state.selected.size?button('Keine','none','vw-quiet'):''}</div><div>${button(icon('cards')+' Lernkarten','cards','vw-secondary',state.selected.size?'':'disabled')}${button(icon('game')+' '+(state.game.size?state.game.size+' im Spiel':'Ins Spiel'),'play','vw-primary',state.game.size||state.selected.size?'':'disabled')}</div></div>`;
  }
  function tile(e){
   const pick=state.selected.has(e.id),g=state.game.has(e.id);
   return `<article class="vw-tile${pick?' is-picked':''}" data-word="${H(e.id)}"><label class="vw-pick"><input type="checkbox" data-vpick="${H(e.id)}" ${pick?'checked':''}><span class="vw-sr">${H(label(e))} auswählen</span></label><button class="vw-open" data-vopen="${H(e.id)}" aria-label="${H(label(e))}: Wort entdecken"><span class="vw-tile-art">${art(e)}</span><span class="vw-tile-title">${e.article?`<small>${H(e.article)}</small> `:''}${H(e.term)}</span><span class="vw-tile-meaning" lang="en">${H(e.en.slice(0,2).join(' · '))}</span></button><button class="vw-game-add${g?' is-added':''}" data-vgame="${H(e.id)}" aria-label="${H(label(e))} ${g?'aus Spiel entfernen':'zum Spiel hinzufügen'}" aria-pressed="${g}">${icon(g?'check':'plus')}${g?'Im Spiel':'Spiel'}</button></article>`;
  }
  function catalogue(){
   const list=filtered(),visible=list.slice(0,state.page*PAGE);
   return `<section id="vw-words" aria-labelledby="vw-words-title"><div class="vw-section-head"><div><p class="vw-overline">Entdecken</p><h2 id="vw-words-title">Wörter, die bleiben.</h2></div><span class="vw-count">${list.length} Wörter & Wendungen</span></div><div class="vw-discover-controls"><label class="vw-search">${icon('search')}<span class="vw-sr">Wörter oder Bedeutungen suchen</span><input type="search" value="${H(state.query)}" placeholder="Ein Wort, eine Bedeutung …" data-vsearch></label><label class="vw-group-label"><span class="vw-sr">Wortgruppe</span><select data-vgroup><option value="">Alle Wortgruppen</option>${groups.map(g=>`<option ${state.group===g?'selected':''} value="${H(g)}">${H(g)}</option>`).join('')}</select></label></div><div class="vw-list-actions">${button('Ganzes Kapitel auswählen','all','vw-quiet')}${state.group||state.query?button('Diese Treffer auswählen','filtered','vw-quiet'):''}<div class="vw-view-switch" aria-label="Darstellung">${button('Bildkarten','view-cards',state.view==='cards'?'is-on':'','aria-pressed="'+(state.view==='cards')+'"')}${button('Kompakt','view-list',state.view==='list'?'is-on':'','aria-pressed="'+(state.view==='list')+'"')}</div></div><div class="vw-word-grid ${state.view==='list'?'vw-compact':''}" id="vw-grid">${visible.length?visible.map(tile).join(''):'<p class="vw-empty">Kein Treffer. Versuch ein anderes Wort oder eine englische Bedeutung.</p>'}</div>${list.length>visible.length?`<div class="vw-more">${button('Weitere '+Math.min(PAGE,list.length-visible.length)+' entdecken','more','vw-secondary')}<span>${visible.length} von ${list.length}</span></div>`:''}</section>`;
  }
  function rounds(){
   const blocks=c.exercises.slice(0,state.roundPage*6),total=c.exercises.length;
   return `<section class="vw-rounds" id="vw-rounds" aria-labelledby="vw-rounds-title"><div class="vw-section-head"><div><p class="vw-overline">Abrufen statt nur lesen</p><h2 id="vw-rounds-title">Eine kleine Runde.</h2></div><span class="vw-count">${done()} / ${total} geschafft</span></div><p class="vw-intro">Erkennen, im Kontext ergänzen, später wiederholen. Jede Runde wird bewertet.</p><div class="vw-round-grid">${blocks.map((x,i)=>{const b=best(x.id),ok=b&&b.score/b.total>=pass;return `<button class="vw-round-link ${ok?'is-passed':''}" data-vround="${H(x.id)}"><span class="vw-round-number">${ok?icon('check'):String(i+1).padStart(2,'0')}</span><span><strong>${H(x.title)}</strong><small>${x.wordIds.length} Wörter · ${x.mode==='context'?'Im Kontext':'Bedeutungen'}${b?' · '+Math.round(b.score/b.total*100)+' %':''}</small></span>${icon('arrow')}</button>`}).join('')}</div>${blocks.length<total?`<div class="vw-more">${button('Weitere Runden','more-rounds','vw-secondary')}<span>${blocks.length} von ${total}</span></div>`:''}</section>`;
  }
  function home(){
   state.round=null;
   host.innerHTML=`<article class="vw-studio" lang="de"><nav class="vw-back"><a href="#/v">${icon('back')} Wortschatz</a><span>C1 · Wortwelt ${c.n-260}</span></nav><section class="vw-hero"><div><p class="vw-overline">Deutsch fürs echte Leben</p><h1>${H(c.title)}</h1><p class="vw-hero-line">${H(c.tagline||'Verstehen. Verbinden. Erinnern.')}</p><div class="vw-hero-actions">${button('Lernen starten '+icon('arrow'),'learn','vw-primary')}<a class="vw-text-link" href="#vw-words" data-vjump="vw-words">${words.length} Wörter entdecken</a></div><div class="vw-progress"><span>${done()} von ${c.exercises.length} Runden</span><span class="vw-progress-line"><i style="width:${Math.round(done()/Math.max(1,c.exercises.length)*100)}%"></i></span></div></div><div class="vw-hero-art" aria-hidden="true">${root.C1_ART.hero(c.n-260)}</div></section><div class="vw-content">${catalogue()}${rounds()}<details class="vw-method"><summary>So lernst du mit dieser Wortwelt</summary><div class="vw-method-grid"><p><b>1. Verstehen.</b> Öffne ein Wort. Verbinde Bedeutung, Merkbild und belegten Kontext.</p><p><b>2. Erinnern.</b> Versuche die Antwort, bevor du sie ansiehst. Ein Fehler zeigt dir, was du wiederholen kannst.</p><p><b>3. Verteilen.</b> Erstelle Lernkarten und komm zu den fälligen Karten zurück. Die Abstände richten sich nach deinen Antworten.</p><p><b>4. Anwenden.</b> Spiele mit deinen Wörtern. Sprich oder schreibe danach einen eigenen Satz.</p></div><p class="vw-small">Lernprinzipien: <a href="https://doi.org/10.1126/science.1152408" target="_blank" rel="noopener">Abrufübungen</a> und <a href="https://doi.org/10.1177/1529100612453266" target="_blank" rel="noopener">verteilte Wiederholung</a>. Ein Bild hilft beim Verstehen; die eigene Erinnerung prüfst du ohne eingeblendete Lösung.</p></details><details class="vw-method"><summary>Quellen & vollständige Wortliste</summary><p class="vw-small">Alle ${words.length} Einträge dieses Kapitels sind hier enthalten. Grundlage: Deutsch intensiv Wortschatz C1, Klett, Kapitel ${c.n-260}. Die Wortkarten, Illustrationen und Abrufübungen wurden neu gestaltet. Beispiele sind belegte Sätze und Wortverbindungen aus Tatoeba, Wiktionary oder den jeweils verlinkten Originalquellen. Es wurden keine neuen deutschen Beispielsätze generiert. Lückentexte sind aus diesen Belegen abgeleitet; Auslassungen sind mit … markiert. Englische Belegübersetzungen ohne eigene Quellenangabe sind redaktionelle Übersetzungen.</p><ul class="vw-word-index">${words.map(e=>`<li><button data-vopen="${H(e.id)}">${H(label(e))}</button></li>`).join('')}</ul></details></div><div id="vw-tray-host">${toolbar()}</div><div class="vw-sr" role="status" aria-live="polite" id="vw-status"></div></article>`;
  }
  function refreshCatalogue(){
   const section=host.querySelector('#vw-words'),focus=host.ownerDocument.activeElement,search=focus?.hasAttribute('data-vsearch'),start=focus?.selectionStart;
   if(section)section.outerHTML=catalogue();
   const tray=host.querySelector('#vw-tray-host');if(tray)tray.innerHTML=toolbar();
   if(search){const input=host.querySelector('[data-vsearch]');input?.focus();try{input?.setSelectionRange(start,start)}catch{}}
   else if(focus?.dataset.vpick){host.querySelector('[data-vpick="'+focus.dataset.vpick+'"]')?.focus()}
   else if(focus?.dataset.vgame){host.querySelector('[data-vgame="'+focus.dataset.vgame+'"]')?.focus()}
   else if(focus?.hasAttribute('data-vgroup'))host.querySelector('[data-vgroup]')?.focus();
  }
  function say(e){bridge.say?.(label(e).replace('der/die','der'))}
  function openWord(id,opener){
   const e=byId.get(id);if(!e)return;closeWord();
   const d=host.ownerDocument.createElement('dialog');d.className='vw-dialog vw-studio';
   d.innerHTML=`<div class="vw-dialog-bar"><span class="vw-overline">${H(e.group)}</span><button class="vw-icon-button" data-vclose aria-label="Wortkarte schließen">${icon('close')}</button></div><div class="vw-word-detail"><div class="vw-detail-art">${art(e)}</div><div><div class="vw-detail-heading"><h2>${H(label(e))}</h2><button class="vw-icon-button" data-vsay="${H(e.id)}" aria-label="${H(label(e))} aussprechen">${icon('sound')}</button></div><p class="vw-detail-en" lang="en">${H(e.en.join(' · '))}</p>${e.forms?.length?`<p class="vw-form">${e.forms.map(H).join(' · ')}</p>`:''}${e.pattern&&e.pattern!==label(e)?`<p class="vw-pattern">${H(e.pattern.replace(/\|/g,''))}</p>`:''}${e.note?`<p class="vw-note">${H(e.note)}</p>`:''}</div></div><section class="vw-detail-context"><h3>So wird es verwendet.</h3>${e.examples?.length?e.examples.slice(0,2).map(exampleHTML).join(''):'<p>Erkunde die Bedeutung und die Wortverbindungen oben.</p>'}${e.contrast?`<p class="vw-note">${H(e.contrast)}</p>`:''}</section><div class="vw-detail-actions">${button(icon('cards')+' Diese Wortkarte','single-card','vw-primary',`data-id="${H(id)}"`)}${button(icon(state.game.has(id)?'check':'plus')+' '+(state.game.has(id)?'Im Spiel':'Ins Spiel'),'single-game','vw-secondary',`data-id="${H(id)}"`)}</div><details class="vw-detail-sources"><summary>Wortinformationen & Herkunft</summary><p class="vw-small">Wortliste, Kapitel ${c.n-260}, PDF-Seite ${e.page}. ${e.editorialNote?H(e.editorialNote):''}</p>${(e.sources||[]).map(s=>`<p>${sourceHTML(s)}</p>`).join('')}</details>`;
   state.dialog=d;state.opener=opener;host.append(d);
   d.addEventListener('cancel',ev=>{ev.preventDefault();closeWord()});
   d.addEventListener('click',ev=>{if(ev.target===d){const b=d.getBoundingClientRect();if(ev.clientX<b.left||ev.clientX>b.right||ev.clientY<b.top||ev.clientY>b.bottom)closeWord()}});
   if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');
   d.querySelector('[data-vclose]').focus();
  }
  function closeWord(){const d=state.dialog;if(d){d.close?.();d.remove();state.dialog=null;state.opener?.focus?.()}}
  async function cards(ids){
   if(!ids.length)return;const list=selected(c,ids).map(wordPayload);
   try{await bridge.cards?.(list,c)}catch{notify('Lernkarten konnten nicht gespeichert werden. Bitte noch einmal versuchen.')}
  }
  function addGame(id){state.game.has(id)?state.game.delete(id):state.game.add(id);refreshCatalogue();const e=byId.get(id);host.querySelector('#vw-status').textContent=label(e)+(state.game.has(id)?' ist im Spiel.':' wurde aus dem Spiel entfernt.');}
  function startRound(ex){
   closeWord();state.round={exercise:ex,qs:questions(c,ex.wordIds,ex.wordIds.length,ex.mode==='context'?'context':'meaning'),index:0,answers:[],checked:false,given:null};paintRound();host.querySelector('h1')?.focus();
  }
  function paintRound(){
   const R=state.round;if(!R)return;
   if(R.index>=R.qs.length){finishRound();return}
   const q=R.qs[R.index],e=byId.get(q.wordId);
   host.innerHTML=`<article class="vw-studio vw-learning" lang="de"><nav class="vw-back">${button(icon('back')+' Wortwelt','leave-round','vw-quiet')}<span>${R.index+1} / ${R.qs.length}</span></nav><div class="vw-learning-progress"><i style="width:${R.index/R.qs.length*100}%"></i></div><div class="vw-learning-header"><p class="vw-overline">${H(R.exercise.title)}</p><h1 tabindex="-1">${q.kind==='context'?'Ein Wort fehlt.':q.kind==='recall'?'Wie heißt es auf Deutsch?':'Was bedeutet das?'}</h1></div><div class="vw-question-layout"><div class="vw-question-art" aria-hidden="true">${root.C1_ART.draw(e,{hideMeaning:true})}</div><div class="vw-question"><p class="vw-question-prompt" lang="${q.kind==='recall'?'en':'de'}">${H(q.p)}</p>${q.sub?`<p class="vw-intro">${H(q.sub)}</p>`:''}<form data-vanswer novalidate>${q.t==='mc'?`<fieldset><legend class="vw-sr">Bedeutung wählen</legend><div class="vw-answers">${q.o.map((o,i)=>`<label><input type="radio" name="answer" value="${i}"><span>${H(o)}</span></label>`).join('')}</div></fieldset>`:`<label class="vw-type-label">Deine Antwort<input type="text" name="answer" autocomplete="off" spellcheck="false" autocapitalize="off" placeholder="Erst überlegen …" maxlength="300"></label>`}<div class="vw-question-submit">${button('Prüfen','check-answer','vw-primary','type="submit"')}${button('Weiß ich noch nicht','skip-answer','vw-quiet')}</div></form><div class="vw-feedback" aria-live="polite" tabindex="-1"></div>${q.source?`<details class="vw-question-source"><summary>Belegquelle</summary>${sourceHTML(q.source)}</details>`:''}</div></div></article>`;
   host.querySelector('input[type="text"]')?.focus();
  }
  function checkAnswer(skipped=false){
   const R=state.round;if(!R||R.checked)return;const q=R.qs[R.index],form=host.querySelector('[data-vanswer]'),input=q.t==='mc'?form.querySelector('input:checked'):form.querySelector('input'),given=skipped?'':input?.value;
   if(!skipped&&(given==null||String(given).trim()==='')){form.querySelector('input')?.focus();notify('Gib zuerst eine Antwort ein.');return}
   const ok=!skipped&&grade(q,given);R.answers.push({wordId:q.wordId,given:String(given??''),ok});R.checked=true;
   form.querySelectorAll('input,button').forEach(el=>el.disabled=true);const e=byId.get(q.wordId),fb=host.querySelector('.vw-feedback');
   fb.classList.add(ok?'is-correct':'is-incorrect');fb.innerHTML=`<strong>${ok?'Richtig.':skipped?'Hier ist die Verbindung.':'Noch nicht. Merk dir die Verbindung.'}</strong><p>${H(q.t==='mc'?q.o[q.c]:q.ans[0])}</p><p class="vw-feedback-meaning">${H(label(e))} · ${H(e.en[0])}</p>${e.examples?.length?exampleHTML(e.examples[0]):''}${button(R.index+1===R.qs.length?'Runde abschließen':'Weiter '+icon('arrow'),'next-answer','vw-primary')}`;
   fb.focus();
  }
  function finishRound(){
   const R=state.round,score=R.answers.filter(a=>a.ok).length,total=R.qs.length,passed=score/total>=pass;
   // Only completed rounds are recorded. Revealing a solution never earns a point.
   if(!R.recorded){bridge.record?.({ch:c.n,ex:R.exercise.id,score,total,passed,at:Date.now(),ans:R.answers.map(a=>a.given)});R.recorded=true}
   const missed=R.answers.filter(a=>!a.ok).map(a=>a.wordId);
   host.innerHTML=`<article class="vw-studio vw-finish"><div class="vw-finish-art">${root.C1_ART.hero(c.n-260)}</div><p class="vw-overline">${passed?'Gut verbunden.':'Die erste Verbindung steht.'}</p><h1>${score} von ${total}</h1><p>${Math.round(score/total*100)} % · ${passed?'Runde bestanden':'Bestanden ab '+Math.round(pass*100)+' %'}</p><p class="vw-intro">${missed.length?'Diese Wörter profitieren von einer zweiten Begegnung.':'Komm später zu deinen Lernkarten zurück. Mit Abstand wird Erinnern wertvoller.'}</p><div class="vw-finish-actions">${button('Zur Wortwelt','leave-round','vw-primary')}${missed.length?button(icon('cards')+' '+missed.length+' Wörter als Lernkarten','missed-cards','vw-secondary'):''}${button('Noch einmal','retry-round','vw-quiet')}</div></article>`;
  }
  function onClick(ev){
   const b=ev.target.closest('button,[data-vjump]');if(!b||!host.contains(b))return;
   if(b.hasAttribute('data-vclose')){closeWord();return}
   if(b.dataset.vsay){say(byId.get(b.dataset.vsay));return}
   if(b.dataset.vopen){openWord(b.dataset.vopen,b);return}
   if(b.dataset.vgame){addGame(b.dataset.vgame);return}
   if(b.dataset.vround){startRound(c.exercises.find(x=>x.id===b.dataset.vround));return}
   if(b.dataset.vjump){ev.preventDefault();host.querySelector('#'+b.dataset.vjump)?.scrollIntoView({behavior:'auto',block:'start'});return}
   const a=b.dataset.vact;if(!a)return;
   if(a==='all')state.selected=new Set(words.map(e=>e.id));
   if(a==='filtered')filtered().forEach(e=>state.selected.add(e.id));
   if(a==='none')state.selected.clear();
   if(a==='cards'){cards([...state.selected]);return}
   if(a==='single-card'){cards([b.dataset.id]);return}
   if(a==='single-game'){const id=b.dataset.id;addGame(id);b.innerHTML=icon(state.game.has(id)?'check':'plus')+' '+(state.game.has(id)?'Im Spiel':'Ins Spiel');return}
   if(a==='play'){const ids=[...new Set([...state.game,...state.selected])];bridge.game?.(ids,c);return}
   if(a==='learn'){startRound(c.exercises.find(x=>{const b=best(x.id);return !b||b.score/b.total<pass})||c.exercises[0]);return}
   if(a==='leave-round'){home();return}
   if(a==='retry-round'){startRound(state.round.exercise);return}
   if(a==='missed-cards'){cards(state.round.answers.filter(x=>!x.ok).map(x=>x.wordId));return}
   if(a==='check-answer'){ev.preventDefault();checkAnswer();return}
   if(a==='skip-answer'){checkAnswer(true);return}
   if(a==='next-answer'){state.round.index++;state.round.checked=false;paintRound();return}
   if(a==='more')state.page++;
   if(a==='more-rounds'){state.roundPage++;host.querySelector('.vw-rounds').outerHTML=rounds();return}
   if(a.startsWith('view-'))state.view=a.slice(5);
   refreshCatalogue();
  }
  function onChange(ev){
   if(ev.target.dataset.vpick){const id=ev.target.dataset.vpick;ev.target.checked?state.selected.add(id):state.selected.delete(id);refreshCatalogue()}
   if(ev.target.hasAttribute('data-vgroup')){state.group=ev.target.value;state.page=1;refreshCatalogue()}
  }
  function onInput(ev){if(ev.target.hasAttribute('data-vsearch')){state.query=ev.target.value;state.page=1;refreshCatalogue()}}
  function onSubmit(ev){if(ev.target.hasAttribute('data-vanswer')){ev.preventDefault();checkAnswer()}}
  host.addEventListener('click',onClick);host.addEventListener('change',onChange);host.addEventListener('input',onInput);host.addEventListener('submit',onSubmit);
  home();
  const instance={refresh(){if(!state.round&&host.querySelector('.vw-rounds'))host.querySelector('.vw-rounds').outerHTML=rounds()},destroy(){if(!state.alive)return;state.alive=false;closeWord();host.removeEventListener('click',onClick);host.removeEventListener('change',onChange);host.removeEventListener('input',onInput);host.removeEventListener('submit',onSubmit);if(active===instance)active=null},get state(){return state},open:id=>openWord(id),chapter:c};
  active=instance;return instance;
 }
 root.C1_VOCAB={mount,refresh(){active?.refresh()},leave(){active?.destroy()},questions,grade,cloze,label,wordPayload,cardHTML,selected,sourceHTML,exampleHTML,norm};
 if(typeof module!=='undefined')module.exports=root.C1_VOCAB;
})(typeof window!=='undefined'?window:globalThis);
