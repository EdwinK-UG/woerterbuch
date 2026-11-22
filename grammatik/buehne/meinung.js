/* Meinung: the feedback button and form of a scene (the owner shares the scenes in WhatsApp groups and wants to
   know what people think). A star rating for each version (the German explanation and the English one), which one
   helps more, and an optional comment. Sent to the Worker (POST /scene-feedback); nothing about the person is sent.
   A version not yet watched in this browser is marked, with a link that switches to it. */
import { $, LANG, esc } from './stage.js';

const TXT = {
  de: { btn: 'Feedback', title: 'Wie gefällt dir die Animation?', sub: 'Ehrliche, auch kritische Rückmeldungen helfen uns am meisten. Alles ist freiwillig und anonym.', de: 'Deutsche Erklärung', en: 'Englische Erklärung',
    deSub: 'alles auf Deutsch', enSub: 'Erklärung auf Englisch, Beispiele auf Deutsch', unseen: 'noch nicht gesehen –', watch: 'ansehen', which: 'Was hilft dir mehr?',
    pDe: 'Deutsch', pEn: 'Englisch', pSame: 'Beide gleich', good: 'Was hat gut funktioniert? (freiwillig)', improve: 'Was war unklar, falsch, kaputt oder fehlt? Je genauer, desto besser: welche Szene, welcher Satz, welches Gerät.', send: 'Senden', close: 'Schließen',
    need: 'Gib Sterne, wähle eine Version oder schreib etwas.', ok2: 'Danke! Noch etwas? Du kannst jederzeit mehr schicken.', sending: 'Wird gesendet …', thanks: 'Danke! Dein Feedback ist angekommen.', fail: 'Das hat nicht geklappt. Bitte versuch es noch einmal.' },
  en: { btn: 'Feedback', title: 'How do you like this animation?', sub: 'Honest, critical feedback helps us most. Everything is optional and anonymous.', de: 'German explanation', en: 'English explanation',
    deSub: 'everything in German', enSub: 'explained in English, examples in German', unseen: 'not watched yet –', watch: 'watch it', which: 'Which one helps you more?',
    pDe: 'German', pEn: 'English', pSame: 'Both the same', good: 'What worked well? (optional)', improve: 'What was unclear, wrong, broken or missing? The more exact the better: which scene, which sentence, which device.', send: 'Send', close: 'Close',
    need: 'Give stars, pick a version or write something.', ok2: 'Thank you! Anything else? You can send more any time.', sending: 'Sending …', thanks: 'Thank you! Your feedback has arrived.', fail: "That didn't work. Please try again." },
}[LANG];

// the kind of device, for tracing bugs (nothing that identifies a person): 'phone · iOS · Safari'
function device() {
  const ua = navigator.userAgent, w = Math.min(screen.width, screen.height) || innerWidth;
  const kind = /iPad|Tablet/i.test(ua) || (w >= 600 && /Mobi|Android/i.test(ua)) ? 'tablet' : /Mobi|iPhone|Android/i.test(ua) ? 'phone' : 'desktop';
  const os = /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'other';
  const br = /SamsungBrowser/.test(ua) ? 'Samsung' : /Edg\//.test(ua) ? 'Edge' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /CriOS|Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'other';
  return `${kind} · ${os} · ${br}`;
}
export function createMeinung(B, { scene, langs }) {
  const btn = document.createElement('button'); btn.type = 'button'; btn.id = 'fbBtn'; btn.innerHTML = `★ <span class="t">${TXT.btn}</span>`; btn.title = TXT.title; btn.setAttribute('aria-label', TXT.btn);
  ($('meta') || $('ctl')).appendChild(btn);
  const box = document.createElement('div'); box.className = 'fb'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', TXT.title);
  document.body.appendChild(box);
  const state = { ratings: { de: null, en: null }, prefer: null };
  const seen = () => { try { return JSON.parse(localStorage.getItem('buehne-seen-' + scene) || '[]'); } catch (e) { return []; } };
  function row(l) {
    const watched = seen().includes(l) || l === LANG;
    return `<div class="fb-row" data-l="${l}"><div><b>${TXT[l]}</b><small>${watched ? TXT[l + 'Sub'] : `${TXT.unseen} <a data-go="${l}">${TXT.watch}</a>`}</small></div>
      <div class="fb-stars" role="radiogroup" aria-label="${esc(TXT[l])}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-l="${l}" data-n="${n}" role="radio" aria-checked="false" aria-label="${n} ★">★</button>`).join('')}</div></div>`;
  }
  function draw() {
    box.innerHTML = `<div class="fb-card"><h3>${TXT.title}</h3><p>${TXT.sub}</p>${langs.map(row).join('')}
      ${langs.length > 1 ? `<div class="fb-q">${TXT.which}</div><div class="fb-pick">${[['de', TXT.pDe], ['en', TXT.pEn], ['same', TXT.pSame]].map(([k, t]) => `<button type="button" data-p="${k}" aria-pressed="false">${t}</button>`).join('')}</div>` : ''}
      <textarea data-f="good" maxlength="4000" rows="2" placeholder="${esc(TXT.good)}" aria-label="${esc(TXT.good)}"></textarea>
      <textarea data-f="improve" maxlength="4000" rows="4" placeholder="${esc(TXT.improve)}" aria-label="${esc(TXT.improve)}"></textarea>
      <div class="fb-act"><span class="fb-msg" aria-live="polite"></span><button type="button" data-x>${TXT.close}</button><button type="button" class="main" data-send>${TXT.send}</button></div></div>`;
    paint();
  }
  function paint() {
    box.querySelectorAll('.fb-stars button').forEach((b) => { const on = (state.ratings[b.dataset.l] || 0) >= +b.dataset.n; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(state.ratings[b.dataset.l] === +b.dataset.n)); });
    box.querySelectorAll('.fb-pick button').forEach((b) => { b.classList.toggle('on', state.prefer === b.dataset.p); b.setAttribute('aria-pressed', String(state.prefer === b.dataset.p)); });
  }
  const msg = (t, cls = '') => { const m = box.querySelector('.fb-msg'); m.textContent = t; m.className = 'fb-msg ' + cls; };
  const open = () => { draw(); box.classList.add('on'); B.setPaused(true); box.querySelector('.fb-stars button').focus(); };
  const close = () => { box.classList.remove('on'); btn.focus(); };
  btn.onclick = open;
  box.addEventListener('click', async (e) => {
    const t = e.target;
    if (t === box || t.closest('[data-x]')) { close(); return; }
    const star = t.closest('.fb-stars button'); if (star) { state.ratings[star.dataset.l] = state.ratings[star.dataset.l] === +star.dataset.n ? null : +star.dataset.n; paint(); return; }
    const pick = t.closest('.fb-pick button'); if (pick) { state.prefer = state.prefer === pick.dataset.p ? null : pick.dataset.p; paint(); return; }
    const go = t.closest('[data-go]'); if (go) { const u = new URL(location.href); if (go.dataset.go === 'de') u.searchParams.delete('lang'); else u.searchParams.set('lang', go.dataset.go); location.replace(u); return; }
    if (t.closest('[data-send]')) {
      const good = box.querySelector('[data-f="good"]').value.trim(), improve = box.querySelector('[data-f="improve"]').value.trim();
      if (state.ratings.de == null && state.ratings.en == null && !state.prefer && !good && !improve) { msg(TXT.need, 'no'); return; }
      const cfg = window.APP_CONFIG || (window.parent !== window && window.parent.APP_CONFIG) || {};
      msg(TXT.sending); t.disabled = true;
      try {
        const r = await fetch((cfg.workerUrl || '') + '/scene-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scene, ratings: state.ratings, prefer: state.prefer, good, improve, device: device(), watched: seen(), lang: LANG }) });
        if (!r.ok && r.status !== 429) throw Error(r.status);
        msg(TXT.thanks, 'ok'); box.querySelectorAll('textarea').forEach((x) => (x.value = '')); state.ratings = { de: null, en: null }; state.prefer = null; paint(); t.disabled = false; setTimeout(() => { if (box.classList.contains('on')) msg(TXT.ok2, 'ok'); }, 2200);
      } catch (err) { msg(TXT.fail, 'no'); t.disabled = false; }
    }
  });
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}
