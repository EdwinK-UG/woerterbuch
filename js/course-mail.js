/* Private, selected-recipient mail. Addresses and permissions are resolved again
   by the server; this interface never sends a supplied email address. */
(function () {
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let current=null;
 const css=document.createElement('style');
 css.textContent=`.course-mail{min-width:0}.cm-intro{color:var(--mut);font-size:.85rem;line-height:1.6}.cm-tools{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap;margin:1rem 0}.cm-tools input{flex:1;min-width:0}.cm-field{display:grid;gap:.4rem;margin:1rem 0;font-size:.86rem}.cm-field input,.cm-field textarea,.cm-field select{width:100%;box-sizing:border-box;min-width:0}.cm-field textarea{min-height:180px;resize:vertical;line-height:1.6}.cm-list{max-height:min(36dvh,290px);overflow:auto;border:1px solid var(--line);border-radius:1rem;padding:.25rem .8rem}.cm-person{display:flex;align-items:center;gap:.7rem;padding:.65rem 0;border-bottom:1px solid var(--line)}.cm-person:last-child{border:0}.cm-person input{width:20px;height:20px;flex:none;accent-color:var(--ac)}.cm-person span{min-width:0;overflow-wrap:anywhere}.cm-person small{display:block;color:var(--mut);font-size:.75rem}.cm-actions{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-top:1rem}.cm-actions .primary{margin-left:auto}.cm-count{color:var(--mut);font-size:.8rem}.cm-preview{background:var(--card);border:1px solid var(--line);border-top:4px solid var(--ac);border-radius:1.2rem;padding:1.4rem;margin:1rem 0;overflow-wrap:anywhere}.cm-preview h4{font:500 1.6rem/1.25 Fraunces,Georgia,serif;margin:.8rem 0}.cm-body{white-space:pre-wrap;line-height:1.75;font-size:.9rem}.cm-result{display:flex;justify-content:space-between;gap:.8rem;padding:.7rem 0;border-bottom:1px solid var(--line);font-size:.85rem;overflow-wrap:anywhere}.cm-result>span{min-width:0}.cm-result small{display:block;color:var(--mut);font-size:.75rem}.cm-result b{flex:none;font-size:.75rem}.cm-status{font-size:.83rem;line-height:1.6;overflow-wrap:anywhere}.cm-selected{font-size:.8rem;color:var(--mut)}@media(max-width:480px){.cm-tools input{flex-basis:100%}.cm-preview{padding:1rem}.cm-actions button{min-height:44px}.cm-list{max-height:30dvh}}`;
 document.head.append(css);
 function open(options) {
  if(current?.sending&&current.options.actor!==options.actor)return;
  const reusable=current?.attempted&&current.options.actor===options.actor&&current.options.mode===options.mode&&current.classId===(options.classId||null);
  if(current?.sending&&!reusable){options.toast(options.t('Please let the current email finish.','Bitte warten Sie, bis der aktuelle Versand abgeschlossen ist.'));return;}
  const s=reusable?current:{options,classId:options.classId||null,selected:new Map(),rows:[],total:0,offset:0,search:'',subject:'',body:'',step:'pick',seq:0,draft:crypto.randomUUID(),results:new Map(),attempted:false,sending:false,error:''};
  current=s;options.sheet('<div class="course-mail"></div>');s.root=document.querySelector('.course-mail');
  if(!reusable&&options.preselect)s.preselect=options.preselect;
  render(s);if(s.step==='pick'&&(options.mode==='founder'||s.classId))load(s);
 }
 function active(s){return current===s&&s.options.active()&&s.root?.isConnected;}
 function el(s,k){return s.root.querySelector('[data-cm="'+k+'"]');}
 function count(s){return s.options.t(`${s.selected.size} selected · up to 50 per email`,`${s.selected.size} ausgewählt · bis zu 50 pro E-Mail`);}
 async function load(s,offset=0){
  const seq=++s.seq;s.offset=offset;s.error='';s.rows=[];s.loading=true;render(s);
  try{const r=await s.options.recipients({p_class:s.classId,p_search:s.search,p_offset:offset});if(!active(s)||seq!==s.seq)return;
   s.rows=r.users||[];s.total=r.total||0;
   if(s.preselect){const row=s.rows.find(x=>x.id===s.preselect);if(row)s.selected.set(row.id,row);s.preselect=null;}
  }catch(e){if(active(s)&&seq===s.seq)s.error=e.message||String(e);}finally{if(active(s)&&seq===s.seq){s.loading=false;render(s);}}
 }
 function render(s){
  if(!active(s))return;const t=s.options.t;
  const from=s.options.mode==='founder'&&!s.classId?'support@deutschklinik.com':'hello@deutschklinik.com';
  s.root.innerHTML=`<h3>${s.options.mode==='class'?t('Email learners','Lernenden schreiben'):t('Email users','Nutzern eine E-Mail senden')}</h3><p class="cm-intro">${s.options.mode==='founder'?t('Choose the people you want to contact.','Wählen Sie die Personen aus, die Sie kontaktieren möchten.'):t('Choose learners in your class.','Wählen Sie Lernende in Ihrem Kurs aus.')} ${t('Everyone receives a separate email.','Jede Person erhält eine eigene E-Mail.')}</p><div data-cm="content"></div><p class="cm-status" data-cm="status" role="status"></p>`;
  const content=el(s,'content');
  if(s.step==='pick'){
   content.innerHTML=`${s.options.mode==='class'?`<label class="cm-field">${t('Teaching term','Kursdurchgang')}<select class="input" data-cm="class"><option value="">${t('Choose a class','Kurs wählen')}</option>${s.options.classes.map(c=>`<option value="${esc(c.id)}"${s.classId===c.id?' selected':''}>${esc(c.name)}${c.term_name?' · '+esc(c.term_name):''}</option>`).join('')}</select></label>`:''}<div class="cm-tools"><input class="input" type="search" aria-label="${t('Search recipients','Empfänger suchen')}" data-cm="search" value="${esc(s.search)}" placeholder="${s.options.mode==='founder'?t('Name or email','Name oder E-Mail'):t('Learner name','Name der lernenden Person')}"><button class="btn" data-cm="search-button">${t('Search','Suchen')}</button></div><div class="cm-tools"><span class="cm-count" data-cm="count">${count(s)}</span><button class="btn sm" data-cm="select-page">${t('Select this page','Diese Seite auswählen')}</button><button class="btn sm" data-cm="clear">${t('Clear selection','Auswahl aufheben')}</button></div><div class="cm-list">${s.loading?`<p>${t('Loading…','Wird geladen…')}</p>`:s.rows.map(u=>`<label class="cm-person"><input type="checkbox" value="${esc(u.id)}"${s.selected.has(u.id)?' checked':''}><span>${esc(u.name)}${u.email?`<small>${esc(u.email)}</small>`:''}</span></label>`).join('')||`<p>${s.classId||s.options.mode==='founder'?t('No matching recipients.','Keine passenden Empfänger.'):t('Choose a class to see its learners.','Wählen Sie einen Kurs, um dessen Lernende zu sehen.')}</p>`}</div><div class="cm-tools">${s.offset?`<button class="btn sm" data-cm="prev">${t('Previous','Zurück')}</button>`:''}<span class="cm-count">${s.total} ${t('recipients','Empfänger')}</span>${s.offset+50<s.total?`<button class="btn sm" data-cm="next">${t('Next','Weiter')}</button>`:''}</div><div class="cm-actions"><button class="btn primary" data-cm="compose"${!s.selected.size?' disabled':''}>${t('Write email','E-Mail schreiben')} →</button></div>`;
   const sync=()=>{el(s,'count').textContent=count(s);el(s,'compose').disabled=!s.selected.size;};
   content.querySelectorAll('.cm-person input').forEach(c=>c.onchange=()=>{if(c.checked&&s.selected.size>=50){c.checked=false;el(s,'status').textContent=t('Choose up to 50 people at a time.','Wählen Sie höchstens 50 Personen auf einmal.');return;}c.checked?s.selected.set(c.value,s.rows.find(r=>r.id===c.value)):s.selected.delete(c.value);sync();});
   el(s,'select-page').onclick=()=>{for(const u of s.rows)if(s.selected.size<50)s.selected.set(u.id,u);render(s);};
   el(s,'clear').onclick=()=>{s.selected.clear();render(s);};
   const search=()=>{s.search=el(s,'search').value.trim();load(s);};el(s,'search-button').onclick=search;el(s,'search').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();search();}};
   if(el(s,'class'))el(s,'class').onchange=e=>{s.classId=e.target.value||null;s.selected.clear();s.seq++;s.rows=[];s.total=0;s.search='';s.classId?load(s):render(s);};
   if(el(s,'prev'))el(s,'prev').onclick=()=>load(s,Math.max(0,s.offset-50));if(el(s,'next'))el(s,'next').onclick=()=>load(s,s.offset+50);
   el(s,'compose').onclick=()=>{s.step='write';render(s);};
  }else if(s.step==='write'){
   content.innerHTML=`<p class="cm-selected">${count(s)}</p><p class="cm-intro">${t('From','Von')}: ${from} · ${s.classId?t('Replies go to your teacher email.','Antworten gehen an Ihre Lehrkraft-E-Mail.'):t('Replies go to support.','Antworten gehen an den Support.')}</p><label class="cm-field">${t('Subject','Betreff')}<input class="input" data-cm="subject" maxlength="160" required value="${esc(s.subject)}"></label><label class="cm-field">${t('Message','Nachricht')}<textarea class="input" data-cm="body" maxlength="6000" required>${esc(s.body)}</textarea></label><div class="cm-actions"><button class="btn" data-cm="back">← ${t('Recipients','Empfänger')}</button><button class="btn primary" data-cm="review">${t('Review email','E-Mail prüfen')} →</button></div>`;
   const save=()=>{s.subject=el(s,'subject').value;s.body=el(s,'body').value;};el(s,'subject').oninput=save;el(s,'body').oninput=save;
   el(s,'back').onclick=()=>{save();s.step='pick';render(s);};el(s,'review').onclick=()=>{save();if(!el(s,'subject').reportValidity()||!el(s,'body').reportValidity())return;if(!s.subject.trim()||!s.body.trim()){el(s,'status').textContent=t('Add a subject and a message.','Ergänzen Sie Betreff und Nachricht.');return;}s.step='review';render(s);};
  }else if(s.step==='review'){
   content.innerHTML=`<p class="cm-intro">${t('From','Von')}: ${from}</p><details><summary class="cm-selected">${count(s)}</summary><p class="cm-selected">${[...s.selected.values()].map(u=>esc(u.name)).join(' · ')}</p></details><article class="cm-preview"><small>${esc(s.options.brand||'Deutschklinik')}</small><h4>${esc(s.subject)}</h4><p>${t('Hello','Hallo')} ${esc([...s.selected.values()][0]?.name)},</p><div class="cm-body">${esc(s.body)}</div><p>${esc(s.options.senderName||s.options.brand||'Deutschklinik')}</p></article><div class="cm-actions"><button class="btn" data-cm="edit">${t('Edit','Bearbeiten')}</button><button class="btn primary" data-cm="send">${t(`Send to ${s.selected.size}`,`An ${s.selected.size} senden`)}</button></div>`;
   el(s,'edit').onclick=()=>{s.step='write';render(s);};el(s,'send').onclick=()=>send(s);
  }else{
   const sent=[...s.results.values()].filter(r=>r.state==='sent').length;
   content.innerHTML=`<p class="cm-intro">${s.sending?t('Sending… Keep this window open.','Wird gesendet… Bitte dieses Fenster offen lassen.'):t('Delivery report','Versandbericht')} · ${sent}/${s.selected.size} ${t('accepted by the email provider','vom E-Mail-Anbieter angenommen')}</p><div class="cm-list">${[...s.selected.values()].map(u=>{const r=s.results.get(u.id)||{state:'pending'},label={sent:t('Sent','Gesendet'),failed:t('Not sent','Nicht gesendet'),unknown:t('Check inbox','Posteingang prüfen'),sending:t('Sending','Wird gesendet'),pending:t('Not sent yet','Noch nicht gesendet')}[r.state];return `<div class="cm-result"><span>${esc(u.name)}${r.error?`<small>${esc(r.error)}</small>`:''}</span><b>${label}</b></div>`;}).join('')}</div><div class="cm-actions">${!s.sending?`<button class="btn" data-cm="new">${t('New email','Neue E-Mail')}</button>${[...s.selected.keys()].some(id=>!s.results.has(id)||s.results.get(id).state==='failed')?`<button class="btn primary" data-cm="retry">${t('Retry unsent recipients','Nicht gesendete erneut versuchen')}</button>`:''}`:''}</div>`;
   if(el(s,'retry'))el(s,'retry').onclick=()=>send(s);if(el(s,'new'))el(s,'new').onclick=()=>{current=null;open(s.options);};
  }
  el(s,'status').textContent=s.error||'';
 }
 async function send(s){
  if(s.sending||!active(s))return;s.sending=true;s.attempted=true;s.step='result';s.error='';render(s);
  const todo=[...s.selected.keys()].filter(id=>!s.results.has(id)||s.results.get(id).state==='failed');let stop=false;
  async function work(){for(let id;!stop&&active(s)&&(id=todo.shift());){s.results.set(id,{state:'sending'});render(s);
   try{const r=await s.options.send({draft_id:s.draft,class_id:s.classId,recipient_id:id,subject:s.subject.trim(),body:s.body.trim()});s.results.set(id,{state:r.state==='sent'?'sent':'unknown'});}
   catch(e){s.results.set(id,{state:e.state==='failed'||e.status&&e.status<500&&e.status!==409?'failed':'unknown',error:e.message||'Delivery could not be confirmed.'});if([401,403,429,503].includes(e.status))stop=true;}
   render(s);
  }}
  await Promise.all([work(),work()]);s.sending=false;render(s);
 }
 window.CourseMail={open};window.addEventListener('acct:out',()=>{current=null;});
})();
