/* Meinung: the feedback button and form of a scene (the owner shares the scenes in WhatsApp groups and wants to
   know what people think). Kept small on purpose: stars for the version being watched (and for any other version
   this browser has watched), which one helps most once there is more than one, and a box to write freely. One quiet
   link opens four short sections that follow the parts of a scene: understanding the film, pictures and animation,
   practice, problems. Sent to the Worker (POST /scene-feedback); nothing about the person is sent.
   Versions: de, en, sw, fr (short) and de-long, en-long, sw-long, fr-long (the detailed ones with an introduction). */
import { $, LANG, VERSION, esc } from './stage.js';

const TXT = {
  de: { btn: 'Feedback', title: 'Wie war’s?', sub: 'Ehrlich und gern kritisch – das hilft uns am meisten. Anonym.', which: 'Was hilft dir am meisten?', same: 'Gleich',
    free: 'Was sollen wir besser machen? Schreib einfach los …', more: 'Genauer: Verstehen, Bilder, Üben, Probleme', less: 'Weniger', send: 'Senden', close: 'Schließen',
    need: 'Gib Sterne oder schreib etwas.', sending: 'Wird gesendet …', thanks: 'Danke! Du kannst jederzeit mehr schicken.', fail: 'Das hat nicht geklappt. Bitte noch einmal.',
    v: { de: 'Deutsch', en: 'Englisch', sw: 'Swahili', fr: 'Französisch' }, short: 'kurz', long: 'ausführlich' },
  en: { btn: 'Feedback', title: 'How was it?', sub: 'Honest, critical feedback helps us most. Anonymous.', which: 'Which helps you most?', same: 'Same',
    free: 'What should we do better? Just write …', more: 'In detail: understanding, pictures, practice, problems', less: 'Less', send: 'Send', close: 'Close',
    need: 'Give stars or write something.', sending: 'Sending …', thanks: 'Thank you! You can send more any time.', fail: "That didn't work. Please try again.",
    v: { de: 'German', en: 'English', sw: 'Swahili', fr: 'French' }, short: 'short', long: 'detailed' },
  sw: { btn: 'Maoni', title: 'Ilikuwaje?', sub: 'Maoni ya kweli, hata makali, yanatusaidia zaidi. Bila jina.', which: 'Lipi linakusaidia zaidi?', same: 'Sawa tu',
    free: 'Tuboreshe nini? Andika tu …', more: 'Kwa undani: kuelewa, picha, mazoezi, matatizo', less: 'Punguza', send: 'Tuma', close: 'Funga',
    need: 'Toa nyota au andika kitu.', sending: 'Inatumwa …', thanks: 'Asante! Unaweza kutuma zaidi wakati wowote.', fail: 'Haikufaulu. Tafadhali jaribu tena.',
    v: { de: 'Kijerumani', en: 'Kiingereza', sw: 'Kiswahili', fr: 'Kifaransa' }, short: 'fupi', long: 'ndefu' },
  fr: { btn: 'Avis', title: 'C’était comment\u202f?', sub: 'Un avis honnête, même critique, nous aide le plus. Anonyme.', which: 'Laquelle t’aide le plus\u202f?', same: 'Pareil',
    free: 'Que devrions-nous améliorer\u202f? Écris simplement …', more: 'En détail\u202f: comprendre, images, exercices, problèmes', less: 'Moins', send: 'Envoyer', close: 'Fermer',
    need: 'Donne des étoiles ou écris quelque chose.', sending: 'Envoi …', thanks: 'Merci\u202f! Tu peux en envoyer plus à tout moment.', fail: 'Ça n’a pas marché. Réessaie, s’il te plaît.',
    v: { de: 'Allemand', en: 'Anglais', sw: 'Swahili', fr: 'Français' }, short: 'court', long: 'détaillé' },
}[LANG];
// the sections follow the parts of a scene; each question is the placeholder of its box
const PARTS = {
  de: [['understand', 'Verstehen', 'Wo bist du nicht mitgekommen? Was sollten wir einfacher oder mit einem anderen Beispiel erklären?'],
    ['pictures', 'Bilder & Animation', 'Was sollten wir zeichnen oder animieren, damit ein Satz klarer wird? Kreative Ideen willkommen!'],
    ['practice', 'Üben', 'Wie könnten die Übungen mehr Spaß machen?'],
    ['bugs', 'Probleme', 'Was war kaputt, langsam oder abgeschnitten? Welcher Teil?']],
  en: [['understand', 'Understanding', 'Where did you get lost? What should we explain more simply, or with another example?'],
    ['pictures', 'Pictures & animation', 'What should we draw or animate to make a sentence clearer? Creative ideas welcome!'],
    ['practice', 'Practice', 'How could the exercises be more fun?'],
    ['bugs', 'Problems', 'What was broken, slow or cut off? Which part?']],
  sw: [['understand', 'Kuelewa', 'Ulipotea wapi? Tueleze nini kwa urahisi zaidi, au kwa mfano mwingine?'],
    ['pictures', 'Picha na michoro', 'Tuchore au tuhuishe nini ili sentensi ieleweke zaidi? Mawazo mapya yanakaribishwa!'],
    ['practice', 'Mazoezi', 'Mazoezi yangekuwa ya kufurahisha zaidi vipi?'],
    ['bugs', 'Matatizo', 'Nini kiliharibika, kilikuwa polepole au kilikatika? Sehemu gani?']],
  fr: [['understand', 'Comprendre', 'Où t’es-tu perdu·e\u202f? Que devrions-nous expliquer plus simplement, ou avec un autre exemple\u202f?'],
    ['pictures', 'Images et animation', 'Que devrions-nous dessiner ou animer pour rendre une phrase plus claire\u202f? Les idées créatives sont bienvenues\u202f!'],
    ['practice', 'Exercices', 'Comment rendre les exercices plus amusants\u202f?'],
    ['bugs', 'Problèmes', 'Qu’est-ce qui était cassé, lent ou coupé\u202f? Quelle partie\u202f?']],
}[LANG];
const FIELDS = ['free', ...PARTS.map((p) => p[0])];

// the kind of device, for tracing bugs (nothing that identifies a person): 'phone · iOS · Safari'
function device() {
  const ua = navigator.userAgent, w = Math.min(screen.width, screen.height) || innerWidth;
  const kind = /iPad|Tablet/i.test(ua) || (w >= 600 && /Mobi|Android/i.test(ua)) ? 'tablet' : /Mobi|iPhone|Android/i.test(ua) ? 'phone' : 'desktop';
  const os = /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'other';
  const br = /SamsungBrowser/.test(ua) ? 'Samsung' : /Edg\//.test(ua) ? 'Edge' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /CriOS|Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'other';
  return `${kind} · ${os} · ${br}`;
}
export function createMeinung(B, { scene, versions }) {
  const btn = document.createElement('button'); btn.type = 'button'; btn.id = 'fbBtn'; btn.innerHTML = `★ <span class="t">${TXT.btn}</span>`; btn.title = TXT.title; btn.setAttribute('aria-label', TXT.btn);
  ($('meta') || $('ctl')).appendChild(btn);
  const box = document.createElement('div'); box.className = 'fb'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', TXT.title);
  document.body.appendChild(box);
  const hasLong = versions.some((v) => v.endsWith('-long'));
  const label = (v) => TXT.v[v.slice(0, 2)] + (hasLong ? ' · ' + (v.endsWith('-long') ? TXT.long : TXT.short) : '');
  const state = { ratings: {}, prefer: null, more: false };
  const seen = () => { try { return JSON.parse(localStorage.getItem('buehne-seen-' + scene) || '[]'); } catch (e) { return []; } };
  // the version being watched first, then the others this browser has watched
  const rated = () => [VERSION, ...versions.filter((v) => v !== VERSION && seen().includes(v))];
  const stars = (v) => `<div class="fb-row"><span>${esc(label(v))}</span><div class="fb-stars" role="radiogroup" aria-label="${esc(label(v))}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-v="${v}" data-n="${n}" role="radio" aria-checked="false" aria-label="${n} ★">★</button>`).join('')}</div></div>`;
  function draw() {
    const rs = rated();
    box.innerHTML = `<div class="fb-card"><button type="button" class="fb-x" data-x aria-label="${TXT.close}">✕</button><h3>${TXT.title}</h3><p>${TXT.sub}</p>
      ${rs.map(stars).join('')}
      ${rs.length > 1 ? `<div class="fb-pick" role="group" aria-label="${esc(TXT.which)}"><span>${TXT.which}</span>${[...rs, 'same'].map((v) => `<button type="button" data-p="${v}" aria-pressed="false">${esc(v === 'same' ? TXT.same : label(v))}</button>`).join('')}</div>` : ''}
      <textarea data-f="free" maxlength="4000" rows="3" placeholder="${esc(TXT.free)}" aria-label="${esc(TXT.free)}"></textarea>
      <button type="button" class="fb-more" data-more aria-expanded="false">+ ${TXT.more}</button>
      <div class="fb-parts" hidden>${PARTS.map(([k, h, q]) => `<label class="fb-part"><span>${esc(h)}</span><textarea data-f="${k}" maxlength="4000" rows="2" placeholder="${esc(q)}"></textarea></label>`).join('')}</div>
      <div class="fb-act"><span class="fb-msg" aria-live="polite"></span><button type="button" class="main" data-send>${TXT.send}</button></div></div>`;
    paint();
  }
  function paint() {
    box.querySelectorAll('.fb-stars button').forEach((b) => { const r = state.ratings[b.dataset.v] || 0; b.classList.toggle('on', r >= +b.dataset.n); b.setAttribute('aria-checked', String(r === +b.dataset.n)); });
    box.querySelectorAll('.fb-pick button').forEach((b) => { b.classList.toggle('on', state.prefer === b.dataset.p); b.setAttribute('aria-pressed', String(state.prefer === b.dataset.p)); });
  }
  const msg = (t, cls = '') => { const m = box.querySelector('.fb-msg'); m.textContent = t; m.className = 'fb-msg ' + cls; };
  const open = () => { draw(); box.classList.add('on'); B.setPaused(true); box.querySelector('.fb-stars button').focus(); };
  const close = () => { box.classList.remove('on'); btn.focus(); };
  btn.onclick = open;
  box.addEventListener('click', async (e) => {
    const t = e.target;
    if (t === box || t.closest('[data-x]')) { close(); return; }
    const star = t.closest('.fb-stars button'); if (star) { const v = star.dataset.v; state.ratings[v] = state.ratings[v] === +star.dataset.n ? null : +star.dataset.n; paint(); return; }
    const pick = t.closest('.fb-pick button'); if (pick) { state.prefer = state.prefer === pick.dataset.p ? null : pick.dataset.p; paint(); return; }
    const more = t.closest('[data-more]'); if (more) { const p = box.querySelector('.fb-parts'); p.hidden = !p.hidden; more.setAttribute('aria-expanded', String(!p.hidden)); more.textContent = p.hidden ? '+ ' + TXT.more : '– ' + TXT.less; if (!p.hidden) p.querySelector('textarea').focus(); return; }
    if (t.closest('[data-send]')) {
      const text = Object.fromEntries(FIELDS.map((f) => [f, box.querySelector(`[data-f="${f}"]`).value.trim()]));
      if (!Object.values(state.ratings).some((x) => x) && !state.prefer && FIELDS.every((f) => !text[f])) { msg(TXT.need, 'no'); return; }
      const cfg = window.APP_CONFIG || (window.parent !== window && window.parent.APP_CONFIG) || {};
      msg(TXT.sending); t.disabled = true;
      try {
        const r = await fetch((cfg.workerUrl || '') + '/scene-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scene, version: VERSION, ratings: state.ratings, prefer: state.prefer, ...text, device: device(), watched: seen().filter((v) => !v.endsWith('-long')), lang: LANG }) });
        if (!r.ok && r.status !== 429) throw Error(r.status);
        state.ratings = {}; state.prefer = null; box.querySelectorAll('textarea').forEach((x) => (x.value = '')); paint(); msg(TXT.thanks, 'ok'); t.disabled = false;
      } catch (err) { msg(TXT.fail, 'no'); t.disabled = false; }
    }
  });
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}
