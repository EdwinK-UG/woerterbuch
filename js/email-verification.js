/* Access is immediate. Mailbox proof remains server-owned and independent of Auth's login flag. */
(()=>{
 const esc=x=>String(x||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const tr=(en,de)=>window.KONTO?.lang()==='de'?de:en;
 let status=null,generation=0,capability=null,working=false;
 async function rpc(name,body={},anonymous=false){
  const headers={apikey:APP_CONFIG.supabaseKey,'Content-Type':'application/json'};
  if(!anonymous){const token=await window.ACCT?.token();if(!token)throw Error('Sign in first');headers.Authorization='Bearer '+token;}
  const r=await fetch(APP_CONFIG.supabaseUrl+'/rest/v1/rpc/'+name,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(7000),redirect:'manual'});
  const d=await r.json();if(!r.ok)throw Error(d.message||'Email confirmation is temporarily unavailable.');return d;
 }
 function banner(){
  let box=document.getElementById('email-status-banner');if(!box){box=document.createElement('aside');box.id='email-status-banner';box.className='email-nudge';document.querySelector('main')?.prepend(box);}
  const pending=window.ACCT?.user()&&status?.required&&!status.verified;box.hidden=!pending;
  if(pending)box.innerHTML=`<div><b>${tr('Keep learning. Confirm your email when you can.','Lerne weiter. Bestätige deine E-Mail, sobald du kannst.')}</b><small>${esc(status.email)} · ${tr('Check your inbox or spam folder. Private class invitations open after confirmation.','Prüfe Posteingang und Spam. Private Kurseinladungen öffnen sich nach der Bestätigung.')}</small></div><button class="btn sm" ${working?'disabled':''}>${tr('Resend email','E-Mail erneut senden')}</button>`;
  const button=box.querySelector('button');if(button)button.onclick=resend;
 }
 async function wake(){try{const token=await ACCT.token();await fetch(APP_CONFIG.workerUrl+'/email-verification/send',{method:'POST',headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(12000),redirect:'manual'});}catch{/* The durable scheduled queue retries without the browser. */}}
 async function refresh(){
  const user=window.ACCT?.user(),g=++generation;status=null;banner();if(!user)return;
  try{const result=await rpc('email_verification_status');if(g!==generation||ACCT.user()?.id!==user.id)return;status=result;banner();if(result?.initial_pending)wake();}catch{/* Compatible with the previous database during a rolling deploy. */}
 }
 async function resend(){
  if(working)return;working=true;banner();
  try{const r=await rpc('request_email_verification');if(r.verified){await refresh();return;}if(r.wait){toast(tr('Please wait before requesting another email. Check your inbox and spam folder.','Bitte warte vor der nächsten Anfrage. Prüfe auch den Spamordner.'));return;}await wake();toast(tr('Confirmation email requested. Check your inbox and spam folder.','Bestätigungs-E-Mail angefordert. Prüfe auch den Spamordner.'));}
  catch(e){toast(e.message)}finally{working=false;banner();}
 }
 function handleRoute(hash){
  const match=/^(confirm-email|stop-email)\/([a-f0-9-]{36})\/([a-f0-9]{64})$/i.exec(hash);
  if(match){capability={stop:match[1]==='stop-email',user:match[2],token:match[3]};history.replaceState(null,'','#/'+match[1]);}
  if(!/^(confirm-email|stop-email)(\/|$)/.test(hash))return false;
  const stop=hash.startsWith('stop-email');
  document.getElementById('view').innerHTML=`<article class="email-confirm-page"><p class="play-eyebrow">${esc(window.KONTO?.brand()?.name||'Deutschklinik')}</p><h1>${stop?tr('Stop email reminders?','E-Mail-Erinnerungen beenden?'):tr('One small step.','Ein kleiner Schritt.')}</h1><p>${stop?tr('We will stop these confirmation reminders. Your account will remain available.','Wir beenden diese Bestätigungserinnerungen. Dein Konto bleibt verfügbar.'):tr('Confirm that this email address belongs to you. You can already use your account.','Bestätige, dass diese E-Mail-Adresse dir gehört. Du kannst dein Konto bereits nutzen.')}</p><p id="email-confirm-result" role="status"></p>${capability?`<button class="btn primary" id="email-confirm-action">${stop?tr('Stop reminders','Erinnerungen beenden'):tr('Confirm my email','Meine E-Mail bestätigen')}</button>`:`<p>${tr('Open the link in your latest email, or sign in to request another confirmation email.','Öffne den Link in deiner neuesten E-Mail oder melde dich an, um einen neuen Link anzufordern.')}</p>`}<p><a href="#/start">${tr('Go to my dashboard','Zu meiner Übersicht')} ↗</a></p></article>`;
  const button=document.getElementById('email-confirm-action');if(button)button.onclick=complete;
  return true;
 }
 async function complete(){
  if(!capability||working)return;working=true;const action=capability,button=document.getElementById('email-confirm-action'),result=document.getElementById('email-confirm-result');button.disabled=true;
  try{await rpc('confirm_email_token',{p_user:action.user,p_token:action.token,p_stop:action.stop},true);capability=null;button.remove();result.textContent=action.stop?tr('Reminders stopped.','Erinnerungen beendet.'):tr('Email confirmed. Your account is ready.','E-Mail bestätigt. Dein Konto ist bereit.');if(ACCT.user()?.id===action.user){await refresh();await KONTO.reload();if(!action.stop){location.hash='#/start';toast(tr('Email confirmed. Welcome!','E-Mail bestätigt. Willkommen!'));}}}
  catch(e){result.textContent=tr('This link is invalid or expired. Sign in and request a new confirmation email.','Dieser Link ist ungültig oder abgelaufen. Melde dich an und fordere eine neue Bestätigung an.');button.disabled=false;}
  finally{working=false;}
 }
 window.EMAIL_VERIFY={refresh,resend,handleRoute,required:()=>!!status?.required&&!status?.verified};
 window.addEventListener('acct:in',refresh);window.addEventListener('acct:out',()=>{generation++;status=null;capability=null;banner()});
 window.addEventListener('focus',()=>{if(status?.required)refresh()});
 const style=document.createElement('style');style.textContent='.email-nudge[hidden]{display:none}.email-nudge{display:flex;align-items:center;gap:1rem;justify-content:space-between;padding:1rem 1.2rem;width:calc(100% - 2rem);max-width:58rem;margin:0 auto 1.3rem;border:1px solid var(--line);border-radius:1rem;background:var(--card);font-size:.8rem}.email-nudge b{font-weight:500}.email-nudge small{display:block;color:var(--mut);line-height:1.6;margin-top:.3rem;overflow-wrap:anywhere}.email-nudge button{flex-shrink:0}.email-confirm-page{max-width:520px;margin:2rem auto;line-height:1.7}.email-confirm-page h1{font:500 2.6rem/1.1 Fraunces,serif}.email-confirm-page p{color:var(--mut)}@media(max-width:560px){.email-nudge{align-items:flex-start;flex-direction:column;padding:.85rem;gap:.6rem}.email-nudge button{align-self:flex-end}}';document.head.append(style);
})();
