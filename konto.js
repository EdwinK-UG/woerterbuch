/* Wörterbuch – accounts: roles, levels and unlocking, schools/teachers with their own home page, classes, assignments,
   dashboards (learner, teacher/school, founder), settings and invitations. Needs accounts_setup.sql in Supabase.
   If the tables are not set up yet, everything here stays quietly switched off and the site works as before. */
(function () {
'use strict';
const LV = ['A1', 'A2', 'B1', 'B2', 'C1'];
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LSg = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const LSs = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const toastM = m => (window.toast ? toast(m) : alert(m));
const icn = n => `<i data-lucide="${n}" class="lic"></i>`;
const icons = () => { try { window.lucide && lucide.createIcons(); } catch (e) {} };
const V = () => $('view');
const lvSort = a => LV.filter(l => (a || []).includes(l));
const okUrl = u => /^https:\/\/[^\s<>"']+$/.test(String(u || ''));

let profileRequest = 0;
let P = null, ORG = null, OFF = false, loading = null, mine = { orgs: [], staff: [] }, CUR = '';

/* ---------- language: menus and account pages in English or German; the courses themselves stay German ---------- */
function lang() {
  if (P && (P.ui_lang === 'en' || P.ui_lang === 'de')) return P.ui_lang;
  return LSg('gd_lang', null) || 'en';
}
const T = (en, de) => (lang() === 'en' ? en : de);
const ROLE = r => ({ learner: T('Learner', 'Lernende/r'), teacher: T('Teacher', 'Lehrkraft'), school: T('School', 'Sprachschule'), founder: T('Founder', 'Gründer/in') }[r] || r);
const LVN = { A1: ['Beginner', 'Einstieg'], A2: ['Elementary', 'Grundlagen'], B1: ['Intermediate', 'Mittelstufe'], B2: ['Upper intermediate', 'Gute Mittelstufe'], C1: ['Advanced', 'Fortgeschritten'] };
const lvName = l => (LVN[l] ? T(LVN[l][0], LVN[l][1]) : l);
const dt = d => (d ? new Date(d).toLocaleDateString(T('en-GB', 'de-DE'), { day: '2-digit', month: 'short', year: 'numeric' }) : '–');
const ago = t => { if (!t) return T('never', 'nie'); const d = Math.floor((Date.now() - t) / 864e5); return d <= 0 ? T('today', 'heute') : d === 1 ? T('yesterday', 'gestern') : T(d + ' days ago', 'vor ' + d + ' Tagen'); };

/* ---------- backend ---------- */
const A = () => window.ACCT;
const me = () => A() && A().user && A().user();
async function q(path, opt = {}) { return A().api(path, Object.assign({}, opt, { token: await A().token() })); }
const rpc = (name, body = {}) => q('/rest/v1/rpc/' + name, { method: 'POST', body });
const rpcAnon = (name, body = {}) => A().api('/rest/v1/rpc/' + name, { method: 'POST', body });
const notInstalled = e => /PGRST20[0-9]|42P01|42883|42703/.test(String(e && e.code)) || (e && e.status === 404);
function err(e) { return notInstalled(e) ? T('This is not set up yet.', 'Diese Funktion ist noch nicht eingerichtet.') : (e && e.message) || String(e); }
const PATCH = (path, body) => q(path, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body });

async function load() {
  const u = me(), request = ++profileRequest;
  const current = () => request === profileRequest && me()?.id === u?.id;
  OFF = false;
  if (P?.user_id !== u?.id) { P = null; ORG = null; mine = {orgs:[],staff:[]}; }
  if (!u) { P = null; ORG = null; mine = { orgs: [], staff: [] }; apply(); return; }
  try {
    let rows = await q('/rest/v1/profiles?select=*&user_id=eq.' + u.id);
    if (!current()) return;
    let profile = rows && rows[0];
    const su = LSg('gd_signup', null), fresh = su && su.email && u.email && su.email.toLowerCase() === u.email.toLowerCase();
    if (!profile) {   // the database normally makes the profile at sign-up; this is the fallback for older accounts
      const body = { user_id: u.id }, d = fresh && su.data || {};
      if (d.name) body.display_name = String(d.name).slice(0, 60);
      if (LV.includes(d.level)) { body.level = d.level; if (!d.join) body.unlocked = [d.level]; }
      if ((d.role === 'teacher' || d.role === 'school') && !d.invite) { body.requested_role = d.role; body.request_info = d.info || null; }
      if (d.lang === 'en' || d.lang === 'de') body.ui_lang = d.lang;
      try { await q('/rest/v1/profiles', { method: 'POST', headers: { Prefer: 'return=minimal' }, body }); }
      catch (e) { if (e.status === 400) await q('/rest/v1/profiles', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { user_id: u.id } }); else if (e.status !== 409) throw e; }
      rows = await q('/rest/v1/profiles?select=*&user_id=eq.' + u.id); profile = rows && rows[0];
    }
    if (!current()) return;
    if (!profile) throw new Error('Profile unavailable');
    if (fresh) LSs('gd_signup', null);
    if (profile.requested_role) { await rpc('complete_teacher_onboarding'); rows = await q('/rest/v1/profiles?select=*&user_id=eq.' + u.id); profile = rows[0]; }
    if (!Array.isArray(profile.unlocked)) throw new Error('Enrollment schema unavailable');
    const org = profile.org_id ? await rpc('my_org') : null;
    const memberships = { orgs: [], staff: [] };
    if (profile.role !== 'learner') {
      try {
        memberships.orgs = await q('/rest/v1/orgs?select=*&owner=eq.' + u.id + '&order=created_at') || [];
        const ms = await q('/rest/v1/org_members?select=org_id&member_role=eq.teacher&user_id=eq.' + u.id) || [];
        memberships.staff = ms.map(m => m.org_id).filter(id => !memberships.orgs.some(o => o.id === id));
      } catch (e) {}
    }
    if (!current()) return;
    P = profile; ORG = org; mine = memberships;
    await pendingLogo();
    if (!current() || await handleInvite()) return;
  } catch (e) { if (!current()) return; OFF = true; P = null; ORG = null; mine = {orgs:[],staff:[]}; }
  if (current()) apply();
}
function reload() { loading = load(); return loading; }
const ready = () => loading || reload();

/* ---------- levels: what a learner may open ---------- */
const isStaff = () => !!(P && P.role !== 'learner');
function unlockedSet() {
  if (!P) return [];
  const u = new Set(P.unlocked || []);
  return lvSort([...u]);
}
// a learner opens exactly the levels they are enrolled in (until they unenroll); teachers, schools and the owner open everything
function canOpen(l) {
  if (!LV.includes(l)) return true;
  if (!me()) return false;
  return !!P && P.user_id === me().id && (isStaff() || unlockedSet().includes(l));
}
const lvState = l => (canOpen(l) ? 'open' : P && P.org_id && P.level === l ? 'pending' : 'locked');
const level = () => (P && P.role === 'learner' ? (LV.includes(P.level) && canOpen(P.level) ? P.level : unlockedSet().slice(-1)[0] || null) : null);
function passMark() { const c = ORG && ORG.class; return (c && c.pass_mark) || (ORG && ORG.pass_mark) || 70; }

async function unlock(l) {
  if (!me()) { A() && A().sheet && A().sheet('up'); return; }
  await ready();
  if (!P || !LV.includes(l)) return;
  if (P.org_id) {
    if (await saveProfile({ level: l }, T(`Your teacher has been asked to unlock ${l}.`, `Deine Lehrkraft wurde gebeten, ${l} freizuschalten.`))) refreshView();
    return;
  }
  if (await saveProfile({ level: l, unlocked: lvSort([...(P.unlocked || []), l]) }, T(`You are enrolled in ${l} – have fun!`, `Du bist für ${l} eingeschrieben – viel Spaß!`))) refreshView();
}
function lockSheet(l) {
  if (!LV.includes(l)) return;
  const st = lvState(l), school = P && P.org_id;
  openSheet(`<h3>${icn('lock')} ${T('Level', 'Niveau')} ${esc(l)} · ${esc(lvName(l))}</h3>
    <p>${esc(!me() ? T('Create a free account and choose your level.', 'Erstelle ein kostenloses Konto und wähle dein Niveau.')
      : school ? (st === 'pending' ? T(`You asked for ${l}. Your teacher at ${ORG ? ORG.name : 'your school'} will unlock it.`, `Du hast ${l} angefragt. Deine Lehrkraft (${ORG ? ORG.name : 'deine Schule'}) schaltet es frei.`)
        : T(`Your teacher at ${ORG ? ORG.name : 'your school'} unlocks new levels for you. Ask for ${l} and they will see your request.`, `Neue Niveaus schaltet deine Lehrkraft (${ORG ? ORG.name : 'deine Schule'}) frei. Frag nach ${l} – sie sieht deine Anfrage.`))
      : T(`Enroll in ${l} to open its topics and exercises. They stay open for you until you unenroll.`, `Schreib dich für ${l} ein, um seine Themen und Übungen zu öffnen. Sie bleiben offen, bis du dich abmeldest.`))}</p>
    <div class="row"><span class="spacer"></span><button class="btn" onclick="closeSheet()">${T('Not now', 'Später')}</button>
    ${!me() ? `<button class="btn primary" onclick="ACCT.sheet('up')">${T('Sign up', 'Registrieren')}</button>`
      : st === 'pending' ? '' : `<button class="btn primary" onclick="closeSheet();KONTO.unlock('${l}')">${school ? T('Ask my teacher', 'Lehrkraft fragen') : T('Enroll', 'Einschreiben') + ' ' + l}</button>`}</div>`);
  icons();
}

/* ---------- features: who may use what (the owner sets this in Settings) ---------- */
const FEAT = { dict: ['Dictionary', 'Wörterbuch'], games: ['Games', 'Spiele'], lists: ['Word lists', 'Wortlisten'], cards: ['Flashcards', 'Lernkarten'], vocab: ['Vocabulary courses', 'Wortschatz-Kurse'], grammar: ['Grammar courses', 'Grammatik-Kurse'] };
const FDEF = { dict: 'everyone', games: 'everyone', lists: 'enrolled', cards: 'enrolled', vocab: 'enrolled', grammar: 'enrolled' };
const FMODES = () => [['everyone', T('Everyone, also visitors', 'Alle, auch Besucher')], ['account', T('Signed-in users', 'Angemeldete')], ['enrolled', T('Enrolled learners (with a level)', 'Eingeschriebene (mit Niveau)')], ['off', T('Off (only you)', 'Aus (nur Sie)')]];
let SITE = LSg('gd_site', null) || { features: {}, welcome: {} };
async function loadSite() {
  try { const r = await A().api('/rest/v1/site_settings?select=features,welcome&id=eq.1'); if (r && r[0]) { SITE = r[0]; LSs('gd_site', SITE); applyNav(); gateCheck(); } } catch (e) {}
}
const mode = f => (SITE.features && FMODES().some(m => m[0] === SITE.features[f]) ? SITE.features[f] : FDEF[f]);
const isFounder = () => !!(P && P.role === 'founder');
const enrolled = () => !!(me() && P && (isStaff() || unlockedSet().length));
function can(f) {
  if (!FDEF[f] || isFounder()) return true;
  const m = mode(f);
  if (m === 'everyone') return true;
  if (m === 'off' || !me()) return false;
  return m === 'account' || enrolled();
}
const retryProfile = () => `<button class="btn" onclick="KONTO.reload()">${T('Retry connection', 'Verbindung erneut versuchen')}</button>`;
const ROUTE_F = { '': 'dict', w: 'dict', cats: 'dict', cat: 'dict', lists: 'lists', list: 'lists', decks: 'cards', study: 'cards', v: 'vocab', g: 'grammar', play: 'games' };
const featureOf = p => ROUTE_F[p == null ? location.hash.slice(2).split('/')[0] : p];
const TAB_F = { home: 'dict', cats: 'dict', lists: 'lists', decks: 'cards', wort: 'vocab', gram: 'grammar', play: 'games' };
// the page shown instead of a feature the visitor may not use (yet)
function gate(f) {
  const m = mode(f), name = T(FEAT[f][0], FEAT[f][1]);
  let ic = 'lock', h, p, b;
  if (me() && !P) { h = OFF ? T('Your course access could not be checked', 'Dein Kurszugang konnte nicht geprüft werden') : T('Checking your course access …', 'Dein Kurszugang wird geprüft …'); p = ''; b = OFF ? retryProfile() : ''; }
  else if (m === 'off') { h = T('Not available right now', 'Im Moment nicht verfügbar'); p = T(`${name}: this part of Deutschklinik is switched off at the moment.`, `${name}: Dieser Teil von Deutschklinik ist im Moment ausgeschaltet.`); b = `<a class="btn primary" href="#/start">${T('Home', 'Startseite')}</a>`; }
  else if (!me()) { h = m === 'account' ? T('Sign in to continue', 'Bitte anmelden') : T('Enroll to unlock this', 'Einschreiben und freischalten');
    p = m === 'account' ? T(`${name} are for members. Create a free account – it takes 20 seconds.`, `${name} gibt es für Mitglieder. Erstelle ein kostenloses Konto – das dauert 20 Sekunden.`)
      : T(`${name} open when you enroll in a level. Create a free account, choose your level (A1 to C1) and your course starts right away.`, `${name} öffnen sich, wenn du dich für ein Niveau einschreibst. Erstelle ein kostenloses Konto, wähle dein Niveau (A1 bis C1) und dein Kurs beginnt sofort.`);
    b = `<button class="btn primary" onclick="ACCT.sheet('up')">${T('Create free account', 'Kostenloses Konto')}</button><button class="btn" onclick="ACCT.sheet('in')">${T('Sign in', 'Anmelden')}</button>`; }
  else if (P && P.org_id) { ic = 'hourglass'; h = T('Waiting for your teacher', 'Wartet auf deine Lehrkraft'); p = T(`${name} open as soon as your teacher at ${ORG ? ORG.name : 'your school'} unlocks a level for you.`, `${name} öffnen sich, sobald deine Lehrkraft (${ORG ? ORG.name : 'deine Schule'}) ein Niveau für dich freischaltet.`); b = `<a class="btn primary" href="#/start">${T('My home', 'Meine Startseite')}</a>`; }
  else { h = T('Choose your level', 'Wähle dein Niveau'); p = T(`${name} open when you enroll in a level. Choose yours – you can change it later.`, `${name} öffnen sich, wenn du dich für ein Niveau einschreibst. Wähle deins – du kannst es später ändern.`); b = `<button class="btn primary" onclick="KONTO.askLevel()">${T('Choose my level', 'Niveau wählen')}</button>`; }
  V().innerHTML = `<div class="ks-page kd"><div class="kd-gate"><span class="ic">${icn(ic)}</span><p class="kd-eye">${esc(name)}</p><h1>${esc(h)}</h1><p>${esc(p)}</p><div class="row">${b}</div>
    <p class="ks-tip">${T('Free for everyone:', 'Für alle frei:')} ${['dict', 'games'].filter(x => mode(x) === 'everyone').map(x => `<a href="${x === 'dict' ? '#/' : '#/play'}">${T(FEAT[x][0], FEAT[x][1])}</a>`).join(' · ') || '–'}</p></div></div>`;
  icons();
}
// after sign-in, profile or settings change: show or remove the lock page
function gateCheck() {
  const f = featureOf(); if (!f || typeof window.route !== 'function') return;
  const shown = !!document.querySelector('.kd-gate');
  if (shown || !can(f)) window.route();
}

/* ---------- applying the profile to the site ---------- */
const NAV = { start: ['Home', 'Start'], home: ['Search', 'Suche'], cats: ['Topics', 'Themen'], lists: ['Lists', 'Listen'], decks: ['Cards', 'Karten'], wort: ['Vocabulary', 'Wortschatz'], gram: ['Grammar', 'Grammatik'], play: ['Games', 'Spiele'] };
function applyNav() {
  const tabs = $('tabs'); if (!tabs) return;
  tabs.setAttribute('aria-label',T('Main navigation','Hauptnavigation'));
  let st = tabs.querySelector('a[data-t="start"]');
  if (!st) { st = document.createElement('a'); st.href = '#/start'; st.dataset.t = 'start'; st.innerHTML = icn('house') + '<span></span>'; tabs.prepend(st); }
  const en = lang() === 'en';
  document.documentElement.dataset.audience = me() ? 'member' : 'visitor';
  document.documentElement.dataset.ui = en ? 'en' : 'de';
  document.documentElement.lang = en ? 'en' : 'de';
  tabs.querySelectorAll('a[data-t]').forEach(a => {
    const t = NAV[a.dataset.t]; if (!t) return; const s = a.querySelector('span'); if (s) s.textContent = t[en ? 0 : 1];
    const f = TAB_F[a.dataset.t], off = f && mode(f) === 'off' && !isFounder(), lk = f && !off && !can(f);
    a.hidden = !!off || a.dataset.t === 'cats' || (!me() && !['start','home','play'].includes(a.dataset.t)); a.classList.toggle('ks-lk', !!lk);
    let k = a.querySelector('.ks-lki'); if (lk && !k) a.insertAdjacentHTML('beforeend', LOCK); if (!lk && k) k.remove();
    a.title = t[en ? 0 : 1] + (lk ? ' – ' + T('locked', 'gesperrt') : '');
  });
  const b = document.querySelector('header .brand'); if (b) b.setAttribute('href', '#/start');
  const ab = $('acct'); if (ab && !me()) { const sp = ab.querySelector('span'); if (sp) sp.textContent = T('Sign in', 'Anmelden'); ab.title = T('Sign in or create a free account', 'Anmelden oder kostenloses Konto erstellen'); }
  if(ab){ab.setAttribute('aria-label',me()?T('Open your account','Konto öffnen'):T('Sign in','Anmelden'));const label=ab.querySelector('.account-label');if(label)label.textContent=T('Account','Konto');}
  icons();
}
const LOCK = '<svg class="ks-lki" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
const ink = hex => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return '#fff'; const n = parseInt(m[1], 16), c = [n >> 16, n >> 8 & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2] > .45 ? '#14202e' : '#fff'; };
function applyBrand() {
  const root = document.documentElement, b = document.querySelector('header .brand');
  let el = $('orgbrand');
  if (ORG && ORG.name) {
    if (!el && b) { el = document.createElement('a'); el.id = 'orgbrand'; b.after(el); }
    if (el) { el.href = '#/schule/' + ORG.id; el.title = ORG.name; const key=JSON.stringify([ORG.id,ORG.logo_url,ORG.kind,ORG.name]);if(el.dataset.brandKey!==key){el.dataset.brandKey=key;el.innerHTML = `${okUrl(ORG.logo_url) ? `<img src="${esc(ORG.logo_url)}" alt="" width="28" height="28" referrerpolicy="no-referrer">` : icn(ORG.kind === 'school' ? 'school' : 'graduation-cap')}<span>${esc(ORG.name)}</span>`;} }
    if (/^#[0-9a-f]{6}$/i.test(ORG.theme || '')) { root.style.setProperty('--ac', ORG.theme); root.style.setProperty('--org', ORG.theme); }
    else { root.style.removeProperty('--ac'); root.style.removeProperty('--org'); }
    document.title = ORG.name + ' · Deutschklinik';
  } else { if (el) el.remove(); root.style.removeProperty('--ac'); root.style.removeProperty('--org'); document.title = 'Deutschklinik'; }
  if(window.updatePageMetadata)updatePageMetadata();
  const colour=ORG&&/^#[0-9a-f]{6}$/i.test(ORG.theme||'')?ORG.theme:null;
  root.style.setProperty('--ac-ink',colour?ink(colour):'#fff');
  if(colour)root.style.setProperty('--ac-salt',`color-mix(in srgb, ${colour} 14%, var(--card))`);else root.style.removeProperty('--ac-salt');
  setBrandIcon(colour);
  icons();
}
let brandIconColour;
function setBrandIcon(colour){
  if(brandIconColour===colour&&document.querySelectorAll('link[rel="icon"]').length===1)return;
  brandIconColour=colour;
  document.querySelectorAll('link[rel="icon"]').forEach(link=>link.remove());
  const favicon=document.createElement('link');favicon.rel='icon';favicon.type='image/svg+xml';
  favicon.href=colour?'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="${colour}"/><text x="32" y="46" text-anchor="middle" font-family="Georgia,serif" font-size="46" fill="${ink(colour)}">D</text></svg>`):'favicon.svg?v=3';
  document.head.append(favicon);
}
function apply() {
  applyNav(); applyBrand();
  if (window.GRAM) { GRAM.setPass(passMark()); GRAM.refresh(); }
  if (window.PLAY?.refresh) PLAY.refresh();
  refreshView(); gateCheck();
  const u = me();   // a learner on their own without a level: ask once
  if (P && u && P.role === 'learner' && !P.level && !P.org_id && !P.requested_role && !LSg('gd_lvask_' + u.id, 0)) { LSs('gd_lvask_' + u.id, 1); setTimeout(askLevel, 900); }
}
function refreshView() {
  const h = location.hash.slice(2).split('/')[0];
  if (ROUTES.includes(h)) view(h, decodeURIComponent(location.hash.split('/').slice(2).join('/')));
}

/* ---------- small forms ---------- */
const lvOpts = (sel, none) => (none ? `<option value="">${none}</option>` : '') + LV.map(l => `<option value="${l}"${sel === l ? ' selected' : ''}>${l} · ${lvName(l)}</option>`).join('');
function askLevel() {
  if (!window.openSheet) return;
  openSheet(`<h3>${T('Which level are you learning?', 'Auf welchem Niveau lernst du?')}</h3><p>${T('Your home page then shows your course: vocabulary, grammar and games for your level. The dictionary is always free. You can change this in Settings.', 'Deine Startseite zeigt dann deinen Kurs: Wortschatz, Grammatik und Spiele für dein Niveau. Das Wörterbuch ist immer frei. Du kannst das in den Einstellungen ändern.')}</p>
    <select class="input" id="kv_lv" style="width:100%">${lvOpts('', T('Not sure yet – keep everything open', 'Noch nicht sicher – alles offen lassen'))}</select>
    <div class="row" style="margin-top:1rem"><span class="spacer"></span><button class="btn" onclick="closeSheet()">${T('Later', 'Später')}</button><button class="btn primary" onclick="KONTO.saveLevel()">${T('Save', 'Speichern')}</button></div>`);
}
async function saveProfile(body, ok) {
  try { await PATCH('/rest/v1/profiles?user_id=eq.' + me().id, body); Object.assign(P, body); if (body.unlocked) P.unlocked = lvSort(body.unlocked); applyNav(); if (window.GRAM) GRAM.refresh(); if (ok) toastM(ok); return true; }
  catch (e) { toastM(/unlocked by your teacher/i.test(String(e.message)) ? T('Your teacher unlocks your levels.', 'Deine Niveaus schaltet deine Lehrkraft frei.') : err(e)); return false; }
}
async function saveLevel() {
  const v = ($('kv_lv') || {}).value || null;
  const body = { level: v }; if (v && !P.org_id) body.unlocked = lvSort([...(P.unlocked || []), v]);
  if (await saveProfile(body, T('Saved', 'Gespeichert'))) { window.closeSheet && closeSheet(); applyNav(); if (document.querySelector('.kd-gate')) gateCheck(); else if (v) location.hash = '#/start'; }
}

/* ----- details of a teacher or school (sign-up, request, settings) ----- */
const ORGTYPES = () => [['Language school', 'Sprachschule'], ['School', 'Schule'], ['University', 'Universität'], ['Company', 'Firma'], ['Organisation / NGO', 'Verein / NGO'], ['Other', 'Andere']].map(x => T(x[0], x[1]));
function detailFields(kind, v = {}, pre = 'kd') {
  const f = (id, lab, inner) => `<label class="ks-l">${lab}${inner}</label>`;
  const inp = (id, ph, val, max = 120, type = 'text') => `<input class="input" id="${pre}_${id}" type="${type}" maxlength="${max}" placeholder="${esc(ph)}" value="${esc(val || '')}">`;
  const ta = (id, ph, val, max) => `<textarea class="input" id="${pre}_${id}" rows="3" maxlength="${max}" placeholder="${esc(ph)}">${esc(val || '')}</textarea>`;
  if (kind === 'teacher') return f('tagline', T('Your title', 'Ihr Titel'), inp('tagline', T('e.g. German teacher · 8 years of experience', 'z. B. Deutschlehrerin · 8 Jahre Erfahrung'), v.tagline))
    + f('about', T('About you (shown on your page)', 'Über Sie (auf Ihrer Seite)'), ta('about', T('How you teach, who you teach, what makes your lessons special …', 'Wie und wen Sie unterrichten, was Ihren Unterricht besonders macht …'), v.about, 2000))
    + `<div class="ks-2">${f('city', T('City', 'Stadt'), inp('city', 'Kampala', v.city, 80))}${f('country', T('Country', 'Land'), inp('country', 'Uganda', v.country, 80))}</div>`
    + f('languages', T('Languages you speak', 'Ihre Sprachen'), inp('languages', T('e.g. English, Luganda, German', 'z. B. Englisch, Luganda, Deutsch'), v.languages))
    + f('website', T('Website (optional)', 'Website (optional)'), inp('website', 'https://…', v.website, 200, 'url')) + f('logo', T('Portrait or logo (optional)', 'Porträt oder Logo (optional)'), `<input class="input" id="${pre}_logo" type="file" accept="image/png,image/jpeg,image/webp"><small>${T('We fit your picture automatically, without cropping.', 'Ihr Bild wird automatisch ohne Beschneiden eingepasst.')}</small>`);
  return f('name', T('Name of the school *', 'Name der Schule *'), inp('name', T('e.g. Kampala German Centre', 'z. B. Deutschzentrum Kampala'), v.name, 80))
    + f('org_type', T('Type', 'Art'), `<select class="input" id="${pre}_org_type">${ORGTYPES().map(t => `<option${v.org_type === t ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>`)
    + f('tagline', T('Short slogan', 'Kurzer Slogan'), inp('tagline', T('e.g. German for work, study and life', 'z. B. Deutsch für Beruf, Studium und Alltag'), v.tagline))
    + f('about', T('About the school (shown on your page)', 'Über die Schule (auf Ihrer Seite)'), ta('about', T('Courses, history, what students can expect …', 'Kurse, Geschichte, was Lernende erwartet …'), v.about, 2000))
    + `<div class="ks-2">${f('city', T('City', 'Stadt'), inp('city', 'Kampala', v.city, 80))}${f('country', T('Country', 'Land'), inp('country', 'Uganda', v.country, 80))}</div>`
    + f('website', T('Website (optional)', 'Website (optional)'), inp('website', 'https://…', v.website, 200, 'url'))
    + `<div class="ks-2">${f('theme', T('Brand colour', 'Markenfarbe'), `<input class="input" id="${pre}_theme" type="color" value="${esc(/^#[0-9a-f]{6}$/i.test(v.theme || '') ? v.theme : '#1f6feb')}">`)}
      ${f('logo', T('Logo (optional)', 'Logo (optional)'), `<input class="input" id="${pre}_logo" type="file" accept="image/png,image/jpeg,image/webp">`)}</div>`;
}
function readDetails(kind, pre = 'kd') {
  const g = id => { const e = $(pre + '_' + id); return e ? e.value.trim() : ''; }, o = {};
  ['tagline', 'about', 'city', 'country', 'website'].forEach(k => { if (g(k)) o[k] = g(k); });
  if (o.website && !/^https?:\/\//.test(o.website)) o.website = 'https://' + o.website;
  if (kind === 'teacher') { if (g('languages')) o.languages = g('languages'); }
  else { o.name = g('name'); o.org_type = g('org_type'); o.theme = g('theme'); }
  return o;
}
// shrink a logo picture to at most 320 px (also turns it into PNG/WebP)
function shrinkLogo(file) {
  return new Promise((res, rej) => {
    if (!file) return res(null);
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return rej(new Error(T('Please choose a PNG, JPG or WebP picture.', 'Bitte ein PNG-, JPG- oder WebP-Bild wählen.')));
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, 288 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = 320; c.height = 320;
      const w=img.width*s,h=img.height*s; c.getContext('2d').drawImage(img,(320-w)/2,(320-h)/2,w,h); URL.revokeObjectURL(url);
      c.toBlob(b => b ? res({ blob: b, data: c.toDataURL(b.type) }) : rej(new Error('image')), 'image/webp', .9);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error(T('This picture cannot be read.', 'Dieses Bild kann nicht gelesen werden.'))); };
    img.src = url;
  });
}
async function uploadLogo(blob) {
  const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/jpeg' ? 'jpg' : 'png';
  return A().upload('logos', me().id + '/logo-' + Date.now() + '.' + ext, blob);
}
async function pendingLogo() {
  const L = LSg('gd_logo', null), u = me();
  if (!L || !u || !L.email || L.email.toLowerCase() !== String(u.email || '').toLowerCase() || !A().upload) return;
  try {
    const url = await uploadLogo(await (await fetch(L.data)).blob());
    const own = mine.orgs[0];
    if (own) { await PATCH('/rest/v1/orgs?id=eq.' + own.id, { logo_url: url }); own.logo_url = url; }
    else if (P) { const ri = Object.assign({}, P.request_info || {}, { logo_url: url }); await PATCH('/rest/v1/profiles?user_id=eq.' + u.id, { request_info: ri }); P.request_info = ri; }
    LSs('gd_logo', null);
  } catch (e) { console.warn('logo', e); }
}

/* ---------- sign-up form (role, name, level, details) and invitations ---------- */
let SU = { role: 'learner', logo: null };
const INV = () => LSg('gd_inv', null);
function signupFields() {
  const f = document.querySelector('.acct-f'); if (!f || $('su_box')) return;
  const I = INV(), pv = I && I.pv || null, fixed = pv && (pv.type === 'org' ? (pv.role === 'teacher' ? 'teacher' : 'learner') : pv.role);
  SU = { role: fixed || SU.role || 'learner', logo: null };
  const box = document.createElement('div'); box.id = 'su_box'; box.className = 'ks-box';
  const banner = pv ? `<div class="ks-invite" style="--org:${esc(/^#[0-9a-f]{6}$/i.test(pv.theme || '') ? pv.theme : 'var(--ac)')}">${pv.type === 'org'
      ? `${okUrl(pv.logo_url) ? `<img src="${esc(pv.logo_url)}" alt="" referrerpolicy="no-referrer">` : `<span class="ic">${icn('school')}</span>`}<span><b>${esc(pv.org)}</b><small>${pv.role === 'teacher' ? T('invites you to teach with them', 'lädt Sie als Lehrkraft ein') : pv.class ? T(`invites you to the class ${esc(pv.class)} (${esc(pv.level)})`, `lädt dich in die Klasse ${esc(pv.class)} (${esc(pv.level)}) ein`) : T('invites you to learn German with them', 'lädt dich zum Deutschlernen ein')}</small></span>`
      : `<span class="ic">${icn('mail-open')}</span><span><b>${T('You are invited', 'Sie sind eingeladen')}</b><small>${pv.role === 'school' ? T('to set up your school on Deutschklinik', 'Ihre Schule bei Deutschklinik einzurichten') : pv.role === 'teacher' ? T('to teach with Deutschklinik', 'mit Deutschklinik zu unterrichten') : T('to learn German with Deutschklinik', 'mit Deutschklinik Deutsch zu lernen')}</small></span>`}</div>` : '';
  box.innerHTML = banner + (fixed ? '' : `<div class="ks-seg" role="radiogroup" aria-label="${T('I am', 'Ich bin')}">${[['learner', 'user-round', T('Learner', 'Lernende/r')], ['teacher', 'presentation', T('Teacher', 'Lehrkraft')], ['school', 'school', T('School', 'Schule')]]
      .map(r => `<button type="button" role="radio" data-role="${r[0]}" aria-checked="${SU.role === r[0]}">${icn(r[1])}<span>${r[2]}</span></button>`).join('')}</div>`)
    + `<div id="su_more"></div>`;
  f.insertBefore(box, f.firstChild);
  box.querySelectorAll('[data-role]').forEach(b => b.onclick = () => { SU.role = b.dataset.role; box.querySelectorAll('[data-role]').forEach(x => x.setAttribute('aria-checked', x === b)); suMore(); });
  if (pv && pv.type === 'site' && pv.email) { const em = $('ac_em'); if (em && !em.value) em.value = pv.email; }
  suMore(); icons();
}
function suMore() {
  const box = $('su_more'); if (!box) return;
  const I = INV(), pv = I && I.pv || {}, r = SU.role, invited = !!(I && I.pv);
  const keep = id => { const e = $(id); return e ? e.value : ''; };
  const name = keep('su_pname') || (pv.type === 'site' && pv.role !== 'school' ? pv.name || '' : '');
  let h = `<label class="ks-l">${r === 'school' ? T('Your name (contact person)', 'Ihr Name (Ansprechperson)') : T('Your name', 'Dein Name')}${r === 'learner' ? '' : ' *'}<input class="input" id="su_pname" maxlength="60" autocomplete="name" placeholder="${T('First and last name', 'Vor- und Nachname')}" value="${esc(name)}"></label>`;
  if (r === 'learner') {
    if (pv.type === 'org' && pv.level && pv.class) h += `<p class="ks-n">${icn('lock-open')} ${T(`Your class is at level ${esc(pv.level)} – it is unlocked for you.`, `Deine Klasse ist auf Niveau ${esc(pv.level)} – es ist für dich freigeschaltet.`)}</p>`;
    else h += `<label class="ks-l">${T('My level', 'Mein Niveau')}<select class="input" id="su_level">${lvOpts(pv.level || '', T('Not sure yet', 'Noch nicht sicher'))}</select></label>
      ${pv.type === 'org' ? `<p class="ks-n">${icn('info')} ${T('Your teacher unlocks your level for you.', 'Deine Lehrkraft schaltet dein Niveau für dich frei.')}</p>` : ''}`;
  } else {
    h += `<div class="ks-dt">${detailFields(r, pv.type === 'site' && r === 'school' ? { name: pv.name } : {}, 'su')}</div>`;
    if (!invited) h += `<p class="ks-n">${icn('shield-check')} ${T('Confirm your email to open your own teaching dashboard and personalised page.', 'Bestätigen Sie Ihre E-Mail, um Ihre Unterrichtsübersicht und persönliche Seite zu öffnen.')}</p>`;
  }
  if(pv.type==='org'&&pv.term_name)h+=`<div class="invite-summary"><span class="play-eyebrow">${esc(pv.term_name)}</span><p>${dt(pv.starts_on)} – ${dt(pv.ends_on)}</p><p>${esc(pv.schedule||'')}</p>${pv.course_details?`<details><summary>${T('Your course','Dein Kurs')}</summary><p>${esc(pv.course_details)}</p></details>`:''}</div>`;
  box.innerHTML = h; icons();
  const lg = $('su_logo'); if (lg) lg.onchange = async () => { try { SU.logo = await shrinkLogo(lg.files[0]); } catch (e) { SU.logo = null; lg.value = ''; toastM(e.message); } };
}
function signupCheck() {
  const r = SU.role, n = (($('su_pname') || {}).value || '').trim();
  if (r !== 'learner' && n.length < 2) return T('Please enter your name.', 'Bitte geben Sie Ihren Namen ein.');
  if (r === 'school' && (($('su_name') || {}).value || '').trim().length < 2) return T('Please enter the name of the school.', 'Bitte geben Sie den Namen der Schule ein.');
  return '';
}
function signupData(email) {
  const r = SU.role, I = INV(), d = { role: r, lang: lang() };
  const n = (($('su_pname') || {}).value || '').trim(); if (n) d.name = n.slice(0, 60);
  if (r === 'learner') { const l = ($('su_level') || {}).value; if (LV.includes(l)) d.level = l; }
  else { d.info = readDetails(r, 'su'); }
  if (I && I.code) d[I.t === 'join' ? 'join' : 'invite'] = I.code;
  if (SU.logo && SU.logo.data && SU.logo.data.length < 400000) LSs('gd_logo', { email, data: SU.logo.data });
  LSs('gd_signup', { email, data: d });
  return d;
}
async function invitePreview(code) { try { return await rpcAnon('invite_preview', { p_code: code }); } catch (e) { return null; } }
async function openInvite(t, code) {
  code = String(code || '').trim().toLowerCase().replace(/[^0-9a-f]/g, ''); if (!code) return;
  const pv = await invitePreview(code);
  if (!pv) { LSs('gd_inv', null); if (!me()) LSs('gd_lang', 'en'); toastM(T('This invitation is no longer valid. Please ask for a new link.', 'Diese Einladung ist nicht mehr gültig. Bitte frag nach einem neuen Link.')); return; }
  LSs('gd_inv', { t: pv.type === 'org' ? 'join' : 'invite', code, pv });
  if (me()) { await reload(); return; }
  LSs('gd_lang', 'en'); applyNav();
  if (A() && A().sheet) A().sheet('up');
}
async function join(code) {
  code = String(code || '').trim().toLowerCase().replace(/[^0-9a-f]/g, '');
  if (!code) return;
  if (!me()) return openInvite('join', code);
  try {
    let r;
    try { r = await rpc('join_with_code', { p_code: code }); toastM(T(`Welcome to ${r.org}!`, `Willkommen bei ${r.org}!`)); }
    catch (e) { if (!/invalid code/i.test(String(e.message))) throw e; r = await rpc('redeem_invite', { p_code: code }); toastM(T('Invitation accepted', 'Einladung angenommen')); }
    window.closeSheet && closeSheet();
    await reload(); location.hash = '#/start';
  } catch (e) { toastM(/invalid code/i.test(String(e.message)) ? T('This code is invalid or has expired.', 'Dieser Code ist ungültig oder abgelaufen.') : err(e)); }
}
async function handleInvite() {
  const I = INV(); if (!I || !P) return false;
  const pv = I.pv || {}, act = I.t === 'join' ? 'join_with_code' : 'redeem_invite';
  const user = me().id;
  try {
    await rpc(act, {p_code:I.code});
    if (me()?.id !== user) return false;
    LSs('gd_inv',null); toastM(T('Invitation accepted', 'Einladung angenommen'));
  } catch (e) {
    if (me()?.id !== user) return false;
    if (/invalid code|expired/i.test(String(e.message))) LSs('gd_inv',null);
    toastM(err(e)); return false;
  }
  await reload(); return true;
}

/* ---------- account sheet ---------- */
function fillMe() {
  const box = $('acct_prof'); if (!box) return;
  if (OFF || !me()) { box.innerHTML = OFF ? retryProfile() : ''; return; }
  if (!P) { box.innerHTML = `<p class="muted" style="font-size:.82rem">${T('Loading profile …', 'Profil wird geladen …')}</p>`; ready().then(fillMe); return; }
  const go = h => `onclick="closeSheet();location.hash='${h}'"`;
  box.innerHTML = `<div class="ks-card">
    <div class="ks-row"><span>${T('Role', 'Rolle')}</span><b>${ROLE(P.role)}</b>${P.requested_role ? ` <small class="ks-pend">${ROLE(P.requested_role)} · ${T('confirm email', 'E-Mail bestätigen')}</small>` : ''}</div>
    ${ORG && ORG.name ? `<div class="ks-row"><span>${ORG.kind === 'school' ? T('School', 'Schule') : T('Teacher', 'Lehrkraft')}</span><b>${esc(ORG.name)}</b>${ORG.class ? ` <small>· ${esc(ORG.class.name)}</small>` : ''}</div>` : ''}
    ${P.role === 'learner' ? `<div class="ks-row"><span>${T('Levels', 'Niveaus')}</span>${unlockedSet().map(l => `<span class="gr-lv ${l}">${l}</span>`).join(' ') || `<small>${T('none yet', 'noch keins')}</small>`}</div>` : ''}
    <div class="ks-links"><button class="btn sm primary" ${go('#/start')}>${icn('layout-dashboard')} ${T('My home', 'Meine Startseite')}</button>
      <button class="btn sm" ${go('#/settings')}>${icn('settings')} ${T('Settings', 'Einstellungen')}</button>
      ${isStaff() && P.role !== 'founder' ? `<button class="btn sm" ${go('#/klasse')}>${icn('users')} ${T('Classes', 'Klassen')}</button>` : ''}
      ${P.role === 'founder' ? `<button class="btn sm" ${go('#/admin')}>${icn('shield-check')} ${T('Owner dashboard', 'Übersicht')}</button>` : ''}</div>
    <div class="ks-sep"></div>
    <div class="ks-row"><span>${T('Code', 'Code')}</span><input class="input" id="kp_code" placeholder="${T('Invitation code', 'Einladungscode')}" autocomplete="off"><button class="btn sm" onclick="KONTO.join(document.getElementById('kp_code').value)">${T('Use', 'Einlösen')}</button></div></div>`;
  icons();
}

/* ---------- shared bits for pages ---------- */
const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
let pageMarkup='',pageNode=null,pageHash='';
function page(title, body, cls = '') {
  if (location.hash.slice(2).split('/')[0] !== CUR) return false;
  const markup=`<div class="ks-page ${cls}">${title ? `<h1 class="page">${title}</h1>` : ''}${body}</div>`;
  if(pageNode===V().firstElementChild&&pageHash===location.hash&&pageMarkup===markup)return true;
  V().innerHTML=markup;pageMarkup=markup;pageNode=V().firstElementChild;pageHash=location.hash;icons();return true;
}
const busy = () => {if(pageNode===V().firstElementChild&&pageHash===location.hash&&!pageNode.querySelector('.loading'))return;page('', `<div class="loading"><div class="spin"></div>${T('Loading …', 'Wird geladen …')}</div>`);};
function need() {
  page(T('Please sign in', 'Bitte anmelden'), `<p class="sub">${T('Sign in or create a free account to see this page.', 'Melde dich an oder erstelle ein kostenloses Konto, um diese Seite zu sehen.')}</p>
    <p class="row"><button class="btn primary" onclick="ACCT.sheet('up')">${T('Create account', 'Konto erstellen')}</button><button class="btn" onclick="ACCT.sheet('in')">${T('Sign in', 'Anmelden')}</button></p>`);
}
const chHash = n => (n > 200 ? '#/v/' : '#/g/') + n;
async function ensureGram() { if (!window.GRAM && window.loadGram) { try { await loadGram(); } catch (e) {} } }
const CHS = () => (window.GRAM && GRAM.chapters ? GRAM.chapters() : []);
const chTitle = n => { const c = CHS().find(x => x.n === n); return c ? c.title : (n > 200 ? T('Topic ', 'Thema ') + n : T('Chapter ', 'Kapitel ') + n); };
const chLabel = c => (c.vocab ? T('Topic ', 'Thema ') : T('Chapter ', 'Kapitel ')) + c.no;
/* best result per (user, chapter, exercise) → share correct */
function bestMap(rows) {
  const b = {}; for (const r of rows) { const k = (r.user_id || r.uid || '') + '|' + (r.chapter != null ? r.chapter : r.ch) + '|' + (r.exercise || r.ex), s = r.score / r.total; if (!(k in b) || s > b[k]) b[k] = s; }
  return b;
}
function doneTask(best, uid, task, need) {
  return (task.items || []).filter(item => {
    const ids = item.ex ? [item.ex] : item.required || window.GRAM?.requiredExercises(item.ch) || [];
    return Array.isArray(ids) && ids.length > 0 &&
      ids.every(id => best[uid + '|' + item.ch + '|' + id] * 100 >= need);
  }).length;
}
function kpis(list) { return `<div class="kd-kpis">${list.map(k => `<div class="kd-kpi"><span class="ic">${icn(k[0])}</span><b>${esc(k[1])}</b><span>${esc(k[2])}</span>${k[3] ? `<small>${esc(k[3])}</small>` : ''}</div>`).join('')}</div>`; }
function hero(o, inner) {
  const col = o && /^#[0-9a-f]{6}$/i.test(o.theme || '') ? o.theme : null;
  const school=o?.kind==='school';
  return `<section class="kd-hero cv-${esc(o && o.cover || 'waves')}${school?' school-hero':''}" style="${col ? `--org:${col};--orgink:${ink(col)}` : ''}">${o && okUrl(o.logo_url) ? `<img class="kd-logo" src="${esc(o.logo_url)}" alt="" width="84" height="84" referrerpolicy="no-referrer">` : school?`<span class="kd-logo school-monogram" aria-hidden="true">${esc(o.name.slice(0,1))}</span>`:''}<div class="hero-copy">${inner}</div>${school?`<div class="school-scene" aria-hidden="true">${SiteDesign.art('school','school-hero')}</div>`:''}</section>`;
}
/* a single-series bar chart (one colour; hover shows the value; numbers also in a table below) */
function bars(points, label, h = 150) {
  const W = 640, H = h, L = 34, R = 6, Tp = 10, B = 22, n = points.length, max = Math.max(1, ...points.map(p => p.v));
  const step = Math.pow(10, Math.floor(Math.log10(max))), top = Math.ceil(max / step) * step || 1;
  const bw = (W - L - R) / n, w = Math.max(2, bw - 2), ph = H - Tp - B;
  const grid = [0, top / 2, top].map(v => { const y = Tp + ph - v / top * ph; return `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" class="gl"/><text x="${L - 6}" y="${y + 4}" text-anchor="end" class="ax">${Math.round(v * 10) / 10}</text>`; }).join('');
  const marks = points.map((p, i) => {
    const x = L + i * bw + 1, bh = p.v / top * ph, y = Tp + ph - bh, r = Math.min(4, w / 2, bh);
    const bar = bh > 0 ? `<path class="bar" d="M${x} ${Tp + ph}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${Tp + ph}Z"/>` : '';
    return `<g data-tip="${esc(p.tip || p.x + ': ' + p.v)}">${bar}<rect x="${L + i * bw}" y="${Tp}" width="${bw}" height="${ph}" fill="transparent"/></g>`;
  }).join('');
  const xl = [0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i).map(i => `<text x="${L + i * bw + bw / 2}" y="${H - 6}" text-anchor="middle" class="ax">${esc(points[i].x)}</text>`).join('');
  return `<div class="kd-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${grid}<line x1="${L}" x2="${W - R}" y1="${Tp + ph}" y2="${Tp + ph}" class="bl"/>${marks}${xl}</svg>
    <details class="kd-tbl"><summary>${T('Show numbers', 'Zahlen zeigen')}</summary><div class="ks-tw"><table class="ks-t">${points.filter(p => p.v).map(p => `<tr><td>${esc(p.x)}</td><td>${p.v}</td></tr>`).join('') || `<tr><td>${T('No data yet', 'Noch keine Daten')}</td></tr>`}</table></div></details></div>`;
}
const last30 = rows => { const m = {}; (rows || []).forEach(r => { m[String(r.d).slice(0, 10)] = r.n; }); const out = []; for (let i = 29; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5), k = d.toISOString().slice(0, 10); out.push({ x: d.toLocaleDateString(T('en-GB', 'de-DE'), { day: 'numeric', month: 'short' }), v: m[k] || 0 }); } out.forEach(p => { p.tip = p.x + ': ' + p.v; }); return out; };
function hbars(obj, keys) {
  const max = Math.max(1, ...keys.map(k => obj[k] || 0));
  return `<div class="kd-hb">${keys.map(k => `<div class="r"><span class="k">${esc(k)}</span><span class="t"><i style="width:${(obj[k] || 0) / max * 100}%"></i></span><b>${obj[k] || 0}</b></div>`).join('')}</div>`;
}

/* ---------- learner: home page with my courses ---------- */
function levelStats(l, chs, res) {
  const cs = chs.filter(c => c.level === l), ids = new Set(cs.map(c => c.n)), mine = res.filter(r => ids.has(r.ch));
  const b = bestMap(mine.map(r => ({ uid: 'me', ch: r.ch, ex: r.ex, score: r.score, total: r.total })));
  const vals = Object.values(b), pm = passMark() / 100;
  const tried = new Set(mine.map(r => r.ch));
  const nextV = cs.find(c => c.vocab && !tried.has(c.n)) || cs.find(c => c.vocab), nextG = cs.find(c => !c.vocab && !tried.has(c.n)) || cs.find(c => !c.vocab);
  return { cs, voc: cs.filter(c => c.vocab).length, gram: cs.filter(c => !c.vocab).length, tried: tried.size, passed: vals.filter(v => v >= pm).length, avg: vals.length ? Math.round(vals.reduce((a, c) => a + c, 0) / vals.length * 100) : null, nextV, nextG };
}
async function viewLearner() {
  await ensureGram();
  let res = [], tasks = [];
  try { res = window.GRAM && GRAM.results ? await GRAM.results() : []; } catch (e) {}
  if (P.org_id) { try { tasks = await q('/rest/v1/assignments?select=*&order=due_at.asc.nullslast') || []; } catch (e) {} }
  const chs = CHS(), now = Date.now(), name = P.display_name ? esc(P.display_name.split(' ')[0]) : '';
  const week = res.filter(r => now - r.at < 7 * 864e5).length;
  const days = new Set(res.map(r => new Date(r.at).toDateString())); let streak = 0; for (let i = 0; i < 400; i++) { if (days.has(new Date(now - i * 864e5).toDateString())) streak++; else if (i > 0) break; }
  const lastR = res.slice().sort((a, b) => b.at - a.at)[0];
  const lvs = LV.map(l => ({ l, st: lvState(l), s: levelStats(l, chs, res) }));
  const mineL = lvs.filter(x => x.st === 'open' && unlockedSet().includes(x.l)), cur = level();
  const card = x => {
    const { l, st, s } = x, has = s.cs.length;
    return `<div class="kd-lv ${st}${l === cur ? ' cur' : ''}"><div class="h"><span class="gr-lv ${l}">${l}</span><b>${esc(lvName(l))}</b>${st !== 'open' ? `<span class="lk">${icn(st === 'pending' ? 'hourglass' : 'lock')}</span>` : l === cur ? `<span class="tag">${T('my course', 'mein Kurs')}</span>` : ''}</div>
      ${has ? `<p class="m">${s.voc ? s.voc + ' ' + T('vocabulary topics', 'Wortschatz-Themen') : ''}${s.voc && s.gram ? ' · ' : ''}${s.gram ? s.gram + ' ' + T('grammar chapters', 'Grammatik-Kapitel') : ''}</p>` : `<p class="m">${T('Topics for this level are being written.', 'Die Themen für dieses Niveau sind in Arbeit.')}</p>`}
      ${st === 'open' && has ? `<div class="kd-bar"><i style="width:${pct(s.tried, s.cs.length)}%"></i></div><p class="m">${T(`${s.tried} of ${s.cs.length} practised · ${s.passed} exercises passed`, `${s.tried} von ${s.cs.length} geübt · ${s.passed} Übungen bestanden`)}${s.avg != null ? ` · Ø ${s.avg} %` : ''}</p>
        <div class="row"><a class="btn sm primary" href="#/kurs/${l}">${T('Open course', 'Kurs öffnen')}</a>${s.nextV ? `<a class="btn sm" href="${chHash(s.nextV.n)}">${T('Continue', 'Weiter')}: ${esc(s.nextV.title)}</a>` : ''}</div>`
      : st === 'pending' ? `<p class="m">${T('Waiting for your teacher to unlock it.', 'Wartet auf Freischaltung durch deine Lehrkraft.')}</p>`
      : st === 'locked' ? `<div class="row"><button class="btn sm" onclick="KONTO.lockSheet('${l}')">${icn(P.org_id ? 'hand' : 'lock-open')} ${P.org_id ? T('Ask my teacher', 'Lehrkraft fragen') : T('Enroll', 'Einschreiben')}</button></div>` : ''}</div>`;
  };
  const b = bestMap(res.map(r => ({ uid: 'me', ch: r.ch, ex: r.ex, score: r.score, total: r.total }))), pm = passMark();
  const taskRows = tasks.map(t => { const need = t.pass_mark || pm, its = t.items || [], done = doneTask(b, 'me', t, need), ok = its.length && done === its.length, late = !ok && t.due_at && new Date(t.due_at) < new Date();
    return `<li class="${ok ? 'ok' : late ? 'late' : ''}"><span class="ic">${icn(ok ? 'circle-check' : late ? 'alarm-clock' : 'clipboard-list')}</span><span><b>${esc(t.title)}</b><small>${its.map(it => `<a href="${chHash(it.ch)}">${esc(chTitle(it.ch))}</a>`).join(' · ')}</small></span><span class="d">${ok ? T('done', 'erledigt') : (t.due_at ? T('due ', 'bis ') + dt(t.due_at) : '') + ` · ${done}/${its.length}`}</span></li>`; }).join('');
  const open = mineL.length ? mineL : lvs.filter(x => x.st === 'open' && x.s.cs.length);
  const rest = lvs.filter(x => !open.includes(x));
  page('', `${hero(ORG, `${ORG ? `<p class="kd-eye">${esc(ORG.org_type || (ORG.kind === 'school' ? T('Your school', 'Deine Schule') : T('Your teacher', 'Deine Lehrkraft')))}${ORG.class ? ' · ' + esc(ORG.class.name) : ''}</p><h1>${esc(ORG.name)}</h1>` : `<p class="kd-eye">${T('Welcome back', 'Willkommen zurück')}</p>`}
      <p class="kd-hi">${name ? T(`Hello ${name}!`, `Hallo ${name}!`) : T('Hello!', 'Hallo!')} ${cur ? T(`You are learning German at level ${cur}.`, `Du lernst Deutsch auf Niveau ${cur}.`) : P.org_id ? T('Your teacher will unlock your level soon.', 'Deine Lehrkraft schaltet dein Niveau bald frei.') : T('Choose a level to start your course.', 'Wähle ein Niveau, um mit deinem Kurs zu beginnen.')}</p>
      ${ORG && ORG.welcome ? `<p class="kd-wel">${esc(ORG.welcome)}</p>` : ''}
      <div class="row">${cur ? `<a class="btn kd-cta" href="#/kurs/${cur}">${icn('play')} ${T('Go to my course', 'Zu meinem Kurs')}</a>` : !P.org_id ? `<button class="btn kd-cta" onclick="KONTO.askLevel()">${T('Choose my level', 'Niveau wählen')}</button>` : ''}${ORG ? `<a class="btn kd-ghost" href="#/schule/${ORG.id}">${icn('school')} ${ORG.kind === 'school' ? T('School page', 'Schulseite') : T('Teacher page', 'Seite der Lehrkraft')}</a>` : ''}</div>`)}
    ${ORG?.class?.term_name?`<section class="kd-card learner-term"><span class="play-eyebrow">${esc(ORG.class.term_name)}</span><h2>${esc(ORG.class.name)}</h2><p>${dt(ORG.class.starts_on)} – ${dt(ORG.class.ends_on)}</p><p>${esc(ORG.class.schedule||'')}</p>${ORG.class.meeting_details?`<details><summary>${T('Joining details','Teilnahmeinformationen')}</summary><p style="white-space:pre-line">${esc(ORG.class.meeting_details)}</p></details>`:''}</section>`:''}
    ${P.requested_role ? `<p class="kd-note">${icn('hourglass')} ${T('Confirm your email to finish activating your teaching workspace.','Bestätigen Sie Ihre E-Mail, um Ihren Unterrichtsbereich zu aktivieren.')}</p>` : ''}
    ${kpis([['flame', streak, T('day streak', 'Tage am Stück')], ['dumbbell', week, T('exercises this week', 'Übungen diese Woche')], ['history', lastR ? ago(lastR.at) : '–', T('last practice', 'zuletzt geübt'), lastR ? chTitle(lastR.ch) : ''], ['trophy', Object.values(b).filter(v => v * 100 >= pm).length, T('exercises passed', 'Übungen bestanden'), T(`from ${pm} %`, `ab ${pm} %`)]])}
    ${tasks.length ? `<h2 class="kd-h">${icn('clipboard-list')} ${T('Assignments', 'Aufgaben')}</h2><ul class="kd-tasks">${taskRows}</ul>` : ''}
    <h2 class="kd-h">${icn('graduation-cap')} ${T('My courses', 'Meine Kurse')}</h2><div class="kd-lvs">${open.map(card).join('') || `<p class="sub">${T('No level unlocked yet.', 'Noch kein Niveau freigeschaltet.')}</p>`}</div>
    ${rest.length ? `<details class="dashboard-extra"><summary>${T('Explore more levels', 'Weitere Niveaus entdecken')}</summary><div class="kd-lvs">${rest.map(card).join('')}</div></details>` : ''}
    <h2 class="kd-h">${icn('sparkles')} ${T('Tools', 'Werkzeuge')}</h2>
    <div class="kd-tools"><a href="#/">${icn('search')}<b>${T('Dictionary', 'Wörterbuch')}</b><small>${T('look up any word', 'jedes Wort nachschlagen')}</small></a><a href="#/decks">${icn('layers')}<b>${T('Flashcards', 'Lernkarten')}</b><small>${T('review your words', 'Wörter wiederholen')}</small></a>
      <a href="#/play">${icn('gamepad-2')}<b>${T('Games', 'Spiele')}</b><small>${T('quiz for your level', 'Quiz für dein Niveau')}</small></a><a href="#/settings">${icn('settings')}<b>${T('Settings', 'Einstellungen')}</b><small>${T('name, language, levels', 'Name, Sprache, Niveaus')}</small></a></div>`, 'kd');
}
/* one level: all its topics and chapters */
async function viewCourse(arg) {
  if (!me()) return need();
  busy(); await ready(); await ensureGram();
  const l = LV.includes(arg) ? arg : level() || 'A1', st = lvState(l), chs = CHS().filter(c => c.level === l);
  let res = []; try { res = window.GRAM && GRAM.results ? await GRAM.results() : []; } catch (e) {}
  const b = bestMap(res.map(r => ({ uid: 'me', ch: r.ch, ex: r.ex, score: r.score, total: r.total }))), pm = passMark() / 100;
  const row = c => { const ks = Object.keys(b).filter(k => k.startsWith('me|' + c.n + '|')), passed = ks.filter(k => b[k] >= pm).length, avg = ks.length ? Math.round(ks.reduce((a, k) => a + b[k], 0) / ks.length * 100) : null;
    return `<a class="kd-ch${ks.length ? ' tried' : ''}" href="${chHash(c.n)}"><span class="no">${c.no}</span><span class="t"><b>${esc(c.title)}</b><small>${esc(c.kick || '')}</small></span><span class="s">${ks.length ? `${passed} ${icn('circle-check')}${avg != null ? ` · ${avg} %` : ''}` : T('new', 'neu')}</span></a>`; };
  const voc = chs.filter(c => c.vocab), gram = chs.filter(c => !c.vocab);
  page('', `<p class="row"><a class="btn sm" href="#/start">${icn('arrow-left')} ${T('My home', 'Startseite')}</a></p>
    <section class="kd-course"><span class="gr-lv ${l}">${l}</span><h1 class="page">${T('German', 'Deutsch')} ${l} · ${esc(lvName(l))}</h1>
      <div class="kd-lvtabs">${LV.map(x => `<a href="#/kurs/${x}" class="${x === l ? 'on' : ''} ${lvState(x)}">${lvState(x) === 'open' ? '' : icn('lock')}${x}</a>`).join('')}</div></section>
    ${st !== 'open' ? `<div class="kd-locked">${icn(st === 'pending' ? 'hourglass' : 'lock')}<div><b>${st === 'pending' ? T('Waiting for your teacher', 'Wartet auf deine Lehrkraft') : T('You are not enrolled in this level', 'Du bist für dieses Niveau nicht eingeschrieben')}</b><p>${st === 'pending' ? T('You asked for this level. Your teacher will unlock it.', 'Du hast dieses Niveau angefragt. Deine Lehrkraft schaltet es frei.') : T('Enroll to open the topics below.', 'Schreib dich ein, um die Themen unten zu öffnen.')}</p></div>${st === 'locked' ? `<button class="btn primary" onclick="KONTO.lockSheet('${l}')">${P && P.org_id ? T('Ask my teacher', 'Lehrkraft fragen') : T('Enroll', 'Einschreiben') + ' ' + l}</button>` : ''}</div>` : ''}
    ${chs.length ? '' : `<p class="sub">${T('The topics for this level are being written.', 'Die Themen für dieses Niveau sind in Arbeit.')}</p>`}
    <div class="kd-cols2 ${st !== 'open' ? 'dim' : ''}">${voc.length ? `<div><h2 class="kd-h">${icn('book-a')} ${T('Vocabulary', 'Wortschatz')} <small>${voc.length}</small></h2>${voc.map(row).join('')}</div>` : ''}
      ${gram.length ? `<div><h2 class="kd-h">${icn('book-open-text')} ${T('Grammar', 'Grammatik')} <small>${gram.length}</small></h2>${gram.map(row).join('')}</div>` : ''}</div>`, 'kd');
}

/* ---------- teacher / school: dashboard ---------- */
async function staffOrgs() {
  const orgs = [...mine.orgs];
  if (mine.staff.length) { try { (await q('/rest/v1/orgs?select=*&id=in.(' + mine.staff.join(',') + ')') || []).forEach(o => { if (!orgs.some(x => x.id === o.id)) orgs.push(o); }); } catch (e) {} }
  return orgs;
}
let D = { org: null, classes: [], members: [], profiles: {}, invites: [], tasks: [], res: [], liveRequests: [] };
let orgLoadGeneration=0;
async function loadOrg(org) {
  const request=++orgLoadGeneration,user=me()?.id;
  const next = { org, classes: [], members: [], profiles: {}, invites: [], tasks: [], res: [], liveRequests: [] };
  next.classes = await q('/rest/v1/classes?select=*&org_id=eq.' + org.id + '&order=created_at') || [];
  next.members = await q('/rest/v1/org_members?select=*&org_id=eq.' + org.id) || [];
  next.invites = await q('/rest/v1/invites?select=*&org_id=eq.' + org.id + '&order=expires_at.desc') || [];
  const ids = next.members.map(m => m.user_id);
  if (ids.length) {
    (await q('/rest/v1/profiles?select=user_id,display_name,level,unlocked,created_at&user_id=in.(' + ids.join(',') + ')') || []).forEach(p => { p.unlocked = p.unlocked || []; next.profiles[p.user_id] = p; });
    next.members = next.members.filter(member => next.profiles[member.user_id]);
    next.res = await A().practiceSummary(Object.keys(next.profiles));
  }
  next.tasks = next.classes.length ? await q('/rest/v1/assignments?select=*&class_id=in.(' + next.classes.map(c => c.id).join(',') + ')&order=due_at.asc.nullslast') || [] : [];
  if (next.classes.length) try { next.liveRequests = await q('/rest/v1/live_class_requests?select=*&class_id=in.(' + next.classes.map(c => c.id).join(',') + ')&order=created_at.desc') || []; } catch (e) { next.liveRequests = []; }
  if(request!==orgLoadGeneration||me()?.id!==user)return false;
  D=next;setBrandIcon(/^#[0-9a-f]{6}$/i.test(org.theme||'')?org.theme:null);return true;
}
const sName = id => esc((D.profiles[id] && D.profiles[id].display_name) || T('(no name)', '(ohne Namen)'));
const curLv = p => (p && LV.includes(p.level) && p.unlocked.includes(p.level) ? p.level : p && p.unlocked.slice(-1)[0] || null);
const wants = p => (p && LV.includes(p.level) && !p.unlocked.includes(p.level) ? p.level : null);
function needOrg(kind) {
  return page(T('Set up your page', 'Ihre Seite einrichten'), `<p class="sub">${T('Fill in your details – they make your home page that your learners see.', 'Tragen Sie Ihre Angaben ein – daraus entsteht die Startseite, die Ihre Lernenden sehen.')}</p>
    <div class="ks-card ks-form">${orgForm(null, kind)}</div>`);
}
async function viewStaff(arg) {
  const orgs = await staffOrgs();
  if (!orgs.length) return needOrg(P.role === 'school' ? 'school' : 'teacher');
  const org = orgs.find(o => o.id === arg) || orgs[0], owner = org.owner === me().id;
  try { if(!await loadOrg(org))return; } catch (e) { return page(T('Dashboard', 'Übersicht'), `<p class="sub">${esc(err(e))}</p>`); }
  const studs = D.members.filter(m => m.member_role === 'student'), teachers = D.members.filter(m => m.member_role === 'teacher');
  const lastAct = {}, b = bestMap(D.res); D.res.forEach(r => { const t = Date.parse(r.created_at); if (!lastAct[r.user_id] || t > lastAct[r.user_id]) lastAct[r.user_id] = t; });
  const active = studs.filter(m => Date.now() - (lastAct[m.user_id] || 0) < 7 * 864e5).length;
  const recentCount = D.res.reduce((sum, row) => sum + Number(row.recent_count), 0);
  const avg30 = recentCount ? Math.round(D.res.reduce((sum, row) => sum + Number(row.recent_score), 0) / recentCount * 100) : null;
  const pend = studs.filter(m => wants(D.profiles[m.user_id]) || !(D.profiles[m.user_id] || { unlocked: [] }).unlocked.length);
  const avgOf = (uid, l) => { const ks = Object.keys(b).filter(k => k.startsWith(uid + '|') && (!l || (window.GRAM && GRAM.chLevel(+k.split('|')[1]) === l))); return ks.length ? Math.round(ks.reduce((a, k) => a + b[k], 0) / ks.length * 100) : null; };
  const cls = id => { const c = D.classes.find(x => x.id === id); return c ? esc(c.name) : ''; };
  const pm = org.pass_mark || 70;
  const stu = m => { const p = D.profiles[m.user_id] || { unlocked: [] }, l = curLv(p), a = avgOf(m.user_id, l);
    return `<button class="kd-stu" onclick="KONTO.student('${m.user_id}')"><span class="av">${sName(m.user_id).slice(0, 1)}</span><span class="t"><b>${sName(m.user_id)}</b><small>${cls(m.class_id) || T('no class', 'ohne Klasse')} · ${ago(lastAct[m.user_id])}</small></span>
      <span class="lvs">${p.unlocked.map(x => `<span class="gr-lv ${x}">${x}</span>`).join('')}${wants(p) ? `<span class="kd-want">${icn('hand')} ${wants(p)}</span>` : ''}</span><span class="sc ${a == null ? '' : a >= pm ? 'pass' : 'fail'}">${a == null ? '–' : a + ' %'}</span></button>`; };
  const groups = [...LV, null].map(l => ({ l, ms: studs.filter(m => curLv(D.profiles[m.user_id]) === l) })).filter(g => g.ms.length);
  const upcoming = D.tasks.filter(t => !t.due_at || new Date(t.due_at) > Date.now() - 864e5).slice(0, 6);
  page('', `${hero(org, `<p class="kd-eye">${esc(org.org_type || (org.kind === 'school' ? T('School', 'Schule') : T('Teacher', 'Lehrkraft')))}${org.city ? ' · ' + esc(org.city) : ''}</p><h1>${esc(org.name)}</h1>
      ${org.tagline ? `<p class="kd-hi">${esc(org.tagline)}</p>` : ''}
      <div class="row"><button class="btn kd-cta" onclick="KONTO.inviteLearner()">${icn('user-plus')} ${T('Invite a learner','Lernende einladen')} ${icn('arrow-up-right')}</button></div>`)}
    <nav class="school-shortcuts" aria-label="${T('Teaching workspace','Unterrichtsbereich')}"><a href="#/klasse/${org.id}">${icn('calendar-days')} ${T('Teaching terms','Kursdurchgänge')} ${icn('arrow-up-right')}</a><a href="#/schule/${org.id}">${icn('panel-top')} ${T('View page','Seite ansehen')}</a>${owner?`<a href="#/settings">${icn('sliders-horizontal')} ${T('Personalise','Gestalten')}</a>` : ''}</nav>
    ${orgs.length > 1 ? `<p class="row">${orgs.map(o => `<a class="btn sm${o.id === org.id ? ' primary' : ''}" href="#/start/${o.id}">${esc(o.name)}</a>`).join('')}</p>` : ''}
    ${kpis([['users', studs.length, T('learners', 'Lernende')], ['layers', D.classes.length, T('classes', 'Klassen'), org.kind === 'school' ? teachers.length + ' ' + T('teachers', 'Lehrkräfte') : ''], ['activity', active, T('active this week', 'aktiv diese Woche')], ['gauge', avg30 == null ? '–' : avg30 + ' %', T('average score', 'Durchschnitt'), T('last 30 days', 'letzte 30 Tage')], ['hand', pend.length, T('waiting for you', 'warten auf Sie')]])}
    ${pend.length ? `<h2 class="kd-h">${icn('hand')} ${T('Waiting for a level', 'Warten auf ein Niveau')}</h2><div class="kd-card"><p class="m">${T('These learners cannot open course content until you unlock a level for them.', 'Diese Lernenden können erst üben, wenn Sie ein Niveau freischalten.')}</p>
      <ul class="kd-pend">${pend.map(m => { const p = D.profiles[m.user_id] || {}, w = wants(p) || (m.class_id && (D.classes.find(c => c.id === m.class_id) || {}).level) || 'A1';
        return `<li><b>${sName(m.user_id)}</b><small>${wants(p) ? T(`wants ${w}`, `möchte ${w}`) : T('no level yet', 'noch kein Niveau')}${cls(m.class_id) ? ' · ' + cls(m.class_id) : ''}</small><span class="spacer"></span><button class="btn sm primary" onclick="KONTO.unlockFor('${m.user_id}','${w}',true)">${icn('lock-open')} ${T('Unlock', 'Freischalten')} ${w}</button><button class="btn sm" onclick="KONTO.student('${m.user_id}')">${T('Other level', 'Anderes Niveau')}</button></li>`; }).join('')}</ul></div>` : ''}
    <h2 class="kd-h">${icn('graduation-cap')} ${T('Learners by level', 'Lernende nach Niveau')}</h2>
    ${groups.length ? `<div class="kd-cols">${groups.map(g => `<div class="kd-col"><div class="h">${g.l ? `<span class="gr-lv ${g.l}">${g.l}</span> ${esc(lvName(g.l))}` : T('No level yet', 'Noch ohne Niveau')}<small>${g.ms.length}</small></div>${g.ms.map(stu).join('')}</div>`).join('')}</div>`
      : org.kind==='school'?`<section class="school-welcome">${SiteDesign.art('together','school-empty')}<div><h3>${D.classes.length?T('Your classroom is ready.','Ihr Kursraum ist bereit.'):T('A fresh start, together.','Gemeinsam neu anfangen.')}</h3><p>${D.classes.length?T('Invite your first learner. Their next chapter starts with you.','Laden Sie die erste lernende Person ein. Das nächste Kapitel beginnt mit Ihnen.'):T('Choose your dates, make a class, and give your learners a place to begin.','Wählen Sie Termine und erstellen Sie einen Kurs – einen Platz für den Anfang.')}</p>${D.classes.length?`<button class="btn" onclick="KONTO.inviteLearner()">${T('Send an invitation','Einladung senden')} ${icn('arrow-up-right')}</button>`:`<a class="btn" href="#/klasse/${org.id}">${T('Start a teaching term','Kursdurchgang starten')} ${icn('arrow-up-right')}</a>`}</div></section>`:`<div class="kd-card kd-empty">${icn('user-plus')}<p>${T('No learners yet. Create a class and share its invitation link.', 'Noch keine Lernenden. Legen Sie eine Klasse an und teilen Sie den Einladungslink.')}</p><a class="btn primary" href="#/klasse/${org.id}">${T('Create a class', 'Klasse anlegen')}</a></div>`}
    ${upcoming.length ? `<h2 class="kd-h">${icn('clipboard-list')} ${T('Assignments', 'Aufgaben')}</h2><div class="ks-tw"><table class="ks-t"><tr><th>${T('Assignment', 'Aufgabe')}</th><th>${T('Class', 'Klasse')}</th><th>${T('Due', 'Bis')}</th><th>${T('Done', 'Erledigt')}</th></tr>${upcoming.map(t => { const c = D.classes.find(x => x.id === t.class_id) || {}, ms = studs.filter(m => m.class_id === t.class_id), need = t.pass_mark || c.pass_mark || pm, n = ms.filter(m => (t.items || []).length && doneTask(b, m.user_id, t, need) === t.items.length).length;
      return `<tr><td><b>${esc(t.title)}</b></td><td>${esc(c.name || '')}</td><td>${dt(t.due_at)}</td><td><div class="kd-bar sm"><i style="width:${pct(n, ms.length)}%"></i></div><small>${n}/${ms.length}</small></td></tr>`; }).join('')}</table></div>` : ''}`, org.kind==='school'?'kd school-dashboard':'kd');
}
function student(uid) {
  const p = D.profiles[uid] || { unlocked: [] }, m = D.members.find(x => x.user_id === uid) || {};
  openSheet(`<h3>${sName(uid)}</h3><p>${wants(p) ? T(`Asked for level ${wants(p)}.`, `Hat Niveau ${wants(p)} angefragt.`) + ' ' : ''}${T('Tick the levels this learner is enrolled in. Only these levels open for them.', 'Haken Sie die Niveaus an, in denen diese Person eingeschrieben ist. Nur diese Niveaus öffnen sich.')}</p>
    <div class="kd-unl">${LV.map(l => `<label><input type="checkbox" ${p.unlocked.includes(l) ? 'checked' : ''} onchange="KONTO.unlockFor('${uid}','${l}',this.checked,true)"><span class="gr-lv ${l}">${l}</span> ${esc(lvName(l))}</label>`).join('')}</div>
    <label class="ks-l" style="margin-top:.8rem">${T('Class', 'Klasse')}<select class="input" onchange="KONTO.moveMember('${uid}',this.value)"><option value="">${T('no class', 'ohne Klasse')}</option>${D.classes.map(c => `<option value="${c.id}"${m.class_id === c.id ? ' selected' : ''}>${esc(c.name)} (${c.level})</option>`).join('')}</select></label>
    <div class="row" style="margin-top:1rem"><button class="btn sm" onclick="KONTO.removeMember('${uid}')">${icn('user-x')} ${T('Remove', 'Entfernen')}</button><span class="spacer"></span><button class="btn primary" onclick="closeSheet();KONTO.refresh()">${T('Done', 'Fertig')}</button></div>`);
  icons();
}
async function unlockFor(uid, l, on, quiet) {
  try { await rpc('unlock_level', { p_user: uid, p_level: l, p_on: !!on }); const p = D.profiles[uid]; if (p) { p.unlocked = on ? lvSort([...p.unlocked, l]) : p.unlocked.filter(x => x !== l); if (on && !p.level) p.level = l; }
    toastM(on ? T(`${l} unlocked`, `${l} freigeschaltet`) : T(`${l} locked`, `${l} gesperrt`)); if (!quiet) refreshView(); }
  catch (e) { toastM(err(e)); }
}

/* ---------- classes, invitations, assignments (teacher / school) ---------- */
async function viewClasses(arg) {
  if (!me()) return need();
  busy(); await ready(); await ensureGram();
  if (OFF) return page(T('Classes', 'Klassen'), `<p class="sub">${T('This is not set up yet.', 'Diese Funktion ist noch nicht eingerichtet.')}</p>`);
  if (!isStaff()) return page(T('Classes', 'Klassen'), `<p class="sub">${T('Teachers and schools manage classes here.', 'Hier verwalten Lehrkräfte und Schulen ihre Klassen.')}${P && P.requested_role ? ' ' + T('Confirm your email to activate teaching.', 'Bestätigen Sie Ihre E-Mail, um zu unterrichten.') : ''}</p>${P && !P.requested_role ? `<p><button class="btn primary" onclick="KONTO.request()">${T('Request a teacher / school account', 'Konto für Lehrkräfte / Schulen anfragen')}</button></p>` : ''}`);
  const orgs = await staffOrgs();
  if (!orgs.length) return needOrg(P.role === 'school' ? 'school' : 'teacher');
  const org = orgs.find(o => o.id === arg) || orgs[0], owner = org.owner === me().id;
  try { if(!await loadOrg(org))return; } catch (e) { return page(T('Classes', 'Klassen'), `<p class="sub">${esc(err(e))}</p>`); }
  const best = bestMap(D.res), link = c => location.origin + location.pathname + '?join=' + c;
  const invRow = i => `<li><code>${esc(i.code)}</code> · ${i.member_role === 'teacher' ? T('teachers', 'Lehrkräfte') : T('learners', 'Lernende')}${i.level ? ' · ' + i.level : ''} · ${T(`${i.uses_left} uses left`, `noch ${i.uses_left}×`)} · ${T('until', 'bis')} ${dt(i.expires_at)}
    <button class="btn sm" onclick="KONTO.copy('${link(i.code)}')">${icn('copy')} ${T('Copy link', 'Link kopieren')}</button><button class="btn sm" title="${T('Delete', 'Löschen')}" onclick="KONTO.delInvite('${i.code}')">${icn('trash-2')}</button></li>`;
  const grade = (uid, cls) => { const L = cls.level, pm = cls.pass_mark || org.pass_mark || 70; let tried = 0, passed = 0, sum = 0;
    Object.keys(best).filter(k => k.startsWith(uid + '|')).forEach(k => { const ch = +k.split('|')[1]; if (window.GRAM && GRAM.chLevel(ch) !== L) return; tried++; sum += best[k]; if (best[k] * 100 >= pm) passed++; });
    return { tried, passed, avg: tried ? Math.round(sum / tried * 100) : 0, pm }; };
  const classCard = c => {
    const ms = D.members.filter(m => m.class_id === c.id && m.member_role === 'student'), ts = D.tasks.filter(t => t.class_id === c.id), apps = D.liveRequests.filter(r => r.class_id === c.id && r.status === 'pending');
    return `<details class="ks-card ks-cls" open><summary><b>${esc(c.name)}</b> <span class="gr-lv ${c.level}">${c.level}</span> <small>${c.term_name ? esc(c.term_name) + ' · ' : ''}${ms.length} ${T('learners', 'Lernende')} · ${T('pass from', 'bestanden ab')} ${c.pass_mark || org.pass_mark} %</small></summary>
      <div class="ks-row"><span>${T('Pass mark', 'Bestehensgrenze')}</span><input class="input" type="number" min="1" max="100" id="kc_pm_${c.id}" value="${c.pass_mark || ''}" placeholder="${org.pass_mark}" style="width:7rem"> %<button class="btn sm" onclick="KONTO.classPass('${c.id}')">${T('Save', 'Speichern')}</button></div>
      <div class="ks-row"><span>${T('Invite', 'Einladen')}</span><button class="btn sm primary" onclick="KONTO.sendClassInvite('${c.id}')">${icn('send')} ${T('Send individual invitation', 'Einzelne Einladung senden')}</button><button class="btn sm" onclick="KONTO.invite('student','${c.id}','${c.level}')">${icn('link')} ${T('Create shareable link', 'Link zum Teilen erstellen')}</button></div>
      <p class="ks-tip">${icn('info')} ${T(`Learners who join with this link get ${c.level} unlocked at once.`, `Wer mit diesem Link beitritt, bekommt ${c.level} sofort freigeschaltet.`)}</p>
      <div class="ks-row"><span>${T('Live class', 'Live-Unterricht')}</span><span>${c.live_open ? T('Open for applications', 'Für Anmeldungen geöffnet') : T('Private / invite-only', 'Privat / nur mit Einladung')}</span><button class="btn sm" onclick="KONTO.liveClassSheet('${c.id}')">${icn('settings-2')} ${T('Set up', 'Einrichten')}</button></div>
      ${c.live_open ? `<p class="ks-tip">${T('Starts', 'Start')}: ${dt(c.starts_on)} · ${T('Ends', 'Ende')}: ${dt(c.ends_on)}${c.schedule ? ' · ' + esc(c.schedule) : ''}</p>` : ''}
      <ul class="ks-inv">${D.invites.filter(i => i.class_id === c.id).map(invRow).join('')}</ul>
      <details><summary>${T('Invitation email status','Status der Einladungs-E-Mails')}</summary><p class="ks-tip">${T('Check whether the mail provider accepted each invitation. Inbox delivery can take a few minutes; ask learners to check spam too.','Prüfen Sie, ob der Mailanbieter die Einladungen angenommen hat. Die Zustellung kann einige Minuten dauern; bitte auch den Spamordner prüfen.')}</p><button class="btn sm" onclick="KONTO.checkInvitationMail('${c.id}')">${T('Check email status','E-Mail-Status prüfen')}</button><div id="mail_status_${c.id}" role="status"></div></details>
      ${apps.length ? `<h4 class="ks-h">${icn('inbox')} ${T('Live class applications', 'Anmeldungen zum Live-Unterricht')}</h4><ul class="ks-inv">${apps.map(r => `<li><b>${sName(r.user_id)}</b><span class="spacer"></span><button class="btn sm" onclick="KONTO.decideLiveRequest('${r.id}',false)">${T('Decline', 'Ablehnen')}</button><button class="btn sm primary" onclick="KONTO.decideLiveRequest('${r.id}',true)">${T('Accept & enrol', 'Annehmen & einschreiben')}</button></li>`).join('')}</ul>` : ''}
      <h4 class="ks-h">${T('Learners · results at level', 'Lernende · Ergebnisse auf Niveau')} ${c.level}</h4>
      ${ms.length ? `<div class="ks-tw"><table class="ks-t"><tr><th>${T('Name', 'Name')}</th><th>${T('Levels', 'Niveaus')}</th><th>${T('Passed', 'Bestanden')}</th><th>Ø</th><th></th></tr>${ms.map(m => { const g = grade(m.user_id, c), p = D.profiles[m.user_id] || { unlocked: [] };
        return `<tr><td>${sName(m.user_id)}</td><td>${p.unlocked.map(x => `<span class="gr-lv ${x}">${x}</span>`).join(' ') || '–'}${wants(p) ? ` <span class="kd-want">${icn('hand')} ${wants(p)}</span>` : ''}</td>
          <td>${g.passed}/${g.tried}</td><td>${g.tried ? `<span class="gr-ueb ${g.avg >= g.pm ? 'pass' : 'fail'}">${g.avg} %</span>` : '–'}</td><td><button class="btn sm" onclick="KONTO.student('${m.user_id}')">${icn('sliders-horizontal')} ${T('Levels', 'Niveaus')}</button></td></tr>`; }).join('')}</table></div>` : `<p class="sub">${T('Nobody in this class yet. Share the invitation link.', 'Noch niemand in dieser Klasse. Teilen Sie den Einladungslink.')}</p>`}
      <h4 class="ks-h">${T('Assignments', 'Aufgaben')}</h4>
      ${ts.length ? `<div class="ks-tw"><table class="ks-t"><tr><th>${T('Assignment', 'Aufgabe')}</th><th>${T('Due', 'Bis')}</th><th>${T('Pass from', 'Bestanden ab')}</th><th>${T('Done', 'Erledigt')}</th><th></th></tr>${ts.map(t => { const need = t.pass_mark || c.pass_mark || org.pass_mark || 70, its = t.items || [];
        const n = ms.filter(m => its.length && doneTask(best, m.user_id, t, need) === its.length).length;
        return `<tr><td><b>${esc(t.title)}</b><div class="ks-it">${its.map(it => esc(chTitle(it.ch))).join(' · ')}</div></td><td>${dt(t.due_at)}</td><td>${need} %</td><td>${n}/${ms.length}</td><td><button class="btn sm" onclick="KONTO.delTask('${t.id}')">${icn('trash-2')}</button></td></tr>`; }).join('')}</table></div>` : ''}
      <div class="ks-form ks-new"><b>${T('New assignment', 'Neue Aufgabe')}</b><label>${T('Title', 'Titel')}<input class="input" id="kt_t_${c.id}" maxlength="100" placeholder="${T('e.g. Vocabulary topic 3 by Friday', 'z. B. Wortschatz Thema 3 bis Freitag')}"></label>
        <label>${T('Topics / chapters (hold Ctrl / ⌘ to choose several)', 'Kapitel / Themen (Mehrfachauswahl mit Strg / ⌘)')}<select class="input" id="kt_ch_${c.id}" multiple size="6">${CHS().filter(x => !LV.includes(x.level) || LV.indexOf(x.level) <= LV.indexOf(c.level)).map(x => `<option value="${x.n}">${x.vocab ? T('Vocabulary', 'Wortschatz') : T('Grammar', 'Grammatik')} ${x.level} · ${esc(x.title)}</option>`).join('')}</select></label>
        <label>${T('Due', 'Abgabe bis')}<input class="input" type="date" id="kt_d_${c.id}"></label><label>${T('Pass from (optional)', 'Bestanden ab (optional)')}<input class="input" type="number" min="1" max="100" id="kt_p_${c.id}" placeholder="${c.pass_mark || org.pass_mark}"> %</label>
        <div class="row"><span class="spacer"></span><button class="btn sm primary" onclick="KONTO.addTask('${c.id}')">${T('Set assignment', 'Aufgabe stellen')}</button></div></div>
      <p class="ks-tip">${icn('gamepad-2')} ${T('Quiz in class: open', 'Quiz im Unterricht: Öffnen Sie')} <a href="#/play">${T('Games', 'Spiele')}</a> ${T('on the projector and choose a chapter – everyone plays together.', 'am Beamer und wählen Sie ein Kapitel – alle spielen gemeinsam.')}</p></details>`;
  };
  const free = D.members.filter(m => m.member_role === 'student' && !m.class_id), teachers = D.members.filter(m => m.member_role === 'teacher');
  page(esc(org.name), `<p class="row"><a class="btn sm" href="#/start/${org.id}">${icn('arrow-left')} ${T('Dashboard', 'Übersicht')}</a>${orgs.length > 1 ? orgs.map(o => `<a class="btn sm${o.id === org.id ? ' primary' : ''}" href="#/klasse/${o.id}">${esc(o.name)}</a>`).join('') : ''}</p>
    ${owner ? `<div class="ks-card"><div class="ks-row"><span>${T('Pass mark', 'Bestehensgrenze')}</span><input class="input" id="ko_pass" type="number" min="1" max="100" value="${org.pass_mark}" style="width:7rem"> % <small class="muted">${T('for all classes (each class can set its own)', 'für alle Klassen (jede Klasse kann eine eigene haben)')}</small><button class="btn sm" onclick="KONTO.orgPass('${org.id}')">${T('Save', 'Speichern')}</button></div></div>` : ''}
    ${owner && org.kind === 'school' ? `<div class="ks-card"><b>${T('Teachers', 'Lehrkräfte')}</b> <small>${teachers.length}</small><ul class="ks-inv">${teachers.map(t => `<li>${sName(t.user_id)} <button class="btn sm" onclick="KONTO.removeMember('${t.user_id}')">${icn('user-x')}</button></li>`).join('')}${D.invites.filter(i => i.member_role === 'teacher').map(invRow).join('')}</ul>
      <button class="btn sm" onclick="KONTO.invite('teacher','','')">${icn('link')} ${T('Invitation link for teachers', 'Einladungslink für Lehrkräfte')}</button></div>` : ''}
    <div class="ks-card"><b>${T('Link for the whole school', 'Link für die ganze Schule')}</b><p class="ks-tip">${T('Learners choose their level when they sign up; you then unlock it on your dashboard.', 'Lernende wählen beim Registrieren ihr Niveau; Sie schalten es dann in der Übersicht frei.')}</p>
      <ul class="ks-inv">${D.invites.filter(i => !i.class_id && i.member_role === 'student').map(invRow).join('')}</ul><button class="btn sm" onclick="KONTO.invite('student','','')">${icn('link')} ${T('New link', 'Neuer Link')}</button></div>
    ${D.classes.map(classCard).join('')}
    ${free.length ? `<div class="ks-card"><b>${T('Without a class', 'Ohne Klasse')}</b><ul class="ks-inv">${free.map(m => `<li>${sName(m.user_id)} <select class="input ks-sl" onchange="KONTO.moveMember('${m.user_id}',this.value)"><option value="">${T('Choose class …', 'Klasse wählen …')}</option>${D.classes.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></li>`).join('')}</ul></div>` : ''}
    <details class="ks-card term-create"><summary>${icn('calendar-plus')} ${T('Start a new term', 'Neuen Kursdurchgang starten')}</summary><div class="ks-form"><p class="ks-tip">${T('Choose a level and timetable. Save a draft, or open applications when you are ready.', 'Wähle Niveau und Zeitplan. Speichere einen Entwurf oder öffne die Anmeldungen, wenn du bereit bist.')}</p><label>${T('Class name', 'Klassenname')}<input class="input" id="kc_name" maxlength="60" placeholder="${T('e.g. Evening course B1', 'z. B. Abendkurs B1')}"></label><label>${T('Level', 'Niveau')}<select class="input" id="kc_level">${LV.map(l => `<option>${l}</option>`).join('')}</select></label>
      ${termFields({}, 'kc')}<label>${T('Pass mark (optional)', 'Bestehensgrenze (optional)')}<input class="input" id="kc_pass" type="number" min="1" max="100" placeholder="${org.pass_mark}"> %</label><div class="row"><span class="spacer"></span><button class="btn sm primary" onclick="KONTO.addClass()">${T('Create term / class', 'Durchgang / Klasse anlegen')}</button></div></div></details>`);
}
const refresh = () => refreshView();
const num = id => { const v = parseInt(($(id) || {}).value, 10); return v >= 1 && v <= 100 ? v : null; };
async function act(fn, ok) { try { await fn(); if (ok) toastM(ok); } catch (e) { toastM(err(e)); } }
const orgPass = id => act(async () => { await PATCH('/rest/v1/orgs?id=eq.' + id, { pass_mark: num('ko_pass') || 70 }); await reload(); }, T('Saved', 'Gespeichert'));
const addClass = () => act(async () => {
  const name = $('kc_name').value.trim(); if (!name) throw new Error(T('Please enter a name.', 'Bitte einen Namen eingeben.'));
  await q('/rest/v1/classes', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { org_id: D.org.id, name, level: $('kc_level').value, pass_mark: num('kc_pass'), teacher_id: me().id, ...readTerm('kc') } });
  refresh();
}, T('Class created', 'Klasse angelegt'));
function termFields(c, pre) {
  return `<label>${T('Term name', 'Name des Durchgangs')}<input class="input" id="${pre}_term" maxlength="80" value="${esc(c.term_name || '')}" placeholder="${T('e.g. January 2027 intake', 'z. B. Januar 2027')}"></label><div class="ks-2"><label>${T('Starts', 'Start')}<input class="input" id="${pre}_start" type="date" value="${esc(c.starts_on || '')}"></label><label>${T('Ends', 'Ende')}<input class="input" id="${pre}_end" type="date" value="${esc(c.ends_on || '')}"></label></div><label>${T('Days, times and time zone', 'Tage, Zeiten und Zeitzone')}<input class="input" id="${pre}_schedule" maxlength="240" value="${esc(c.schedule || '')}" placeholder="${T('e.g. Mon & Wed, 18:00–20:00 EAT (UTC+3)', 'z. B. Mo & Mi, 18:00–20:00 EAT (UTC+3)')}"></label><label>${T('What the course includes', 'Kursleistungen')}<textarea class="input" id="${pre}_details" maxlength="1200" rows="4" placeholder="${T('Live lessons, weekly study time, teacher feedback, learning resources, fees and access duration …', 'Live-Unterricht, wöchentlicher Lernaufwand, Feedback, Lernmaterial, Gebühren und Zugangsdauer …')}">${esc(c.course_details || '')}</textarea></label><label>${T('Teacher notification email', 'Benachrichtigungs-E-Mail der Lehrkraft')}<input class="input" id="${pre}_notify" type="email" maxlength="120" value="${esc(c.notification_email || me().email || '')}"></label><label><input id="${pre}_open" type="checkbox" ${c.live_open ? 'checked' : ''}> ${T('Open public applications for this term', 'Öffentliche Anmeldungen für diesen Durchgang öffnen')}</label>`;
}
function readTerm(pre) {
  const val = n => (($(`${pre}_${n}`) || {}).value || '').trim();
  const body = {term_name:val('term') || null, starts_on:val('start') || null, ends_on:val('end') || null, schedule:val('schedule') || null, course_details:val('details') || null, notification_email:val('notify') || null, live_open:!!(($(`${pre}_open`) || {}).checked)};
  if (body.notification_email && !/^[^\s@<>]+@[^\s@<>]+$/.test(body.notification_email)) throw new Error(T('Enter a valid teacher email.', 'Gültige Lehrkraft-E-Mail eingeben.'));
  if (body.starts_on && body.ends_on && body.ends_on < body.starts_on) throw new Error(T('The end date must be on or after the start date.', 'Das Enddatum darf nicht vor dem Startdatum liegen.'));
  if (body.live_open && (!body.term_name || !body.starts_on || !body.ends_on || !body.schedule)) throw new Error(T('Enter a term name, start and end dates, and timetable before opening applications.', 'Vor dem Öffnen Namen, Start, Ende und Zeitplan eintragen.'));
  return body;
}
function liveClassSheet(id) {
  const c = D.classes.find(x => x.id === id); if (!c) return;
  openSheet(`<h3>${T('Set up live class', 'Live-Unterricht einrichten')}</h3><p>${T('Public applications are requests, not automatic enrolment. You accept each learner in your dashboard.', 'Öffentliche Anmeldungen sind Anfragen, keine automatische Einschreibung. Sie nehmen jede Person in Ihrer Übersicht an.')}</p>
    <div class="ks-form">${termFields(c, 'lc')}<label>${T('Meeting details for enrolled learners', 'Details für eingeschriebene Lernende')}<textarea class="input" id="lc_meeting" maxlength="400" rows="3">${esc(c.meeting_details || '')}</textarea></label></div>
    <div class="row" style="margin-top:1rem"><span class="spacer"></span><button class="btn" onclick="closeSheet()">${T('Cancel', 'Abbrechen')}</button><button class="btn primary" onclick="KONTO.saveLiveClass('${id}')">${T('Save', 'Speichern')}</button></div>`);
}
const saveLiveClass = id => act(async () => {
  const val = n => (($('lc_' + n) || {}).value || '').trim();
  const notification_email = val('notify');
  if (notification_email && !/^[^\s@<>]+@[^\s@<>]+$/.test(notification_email)) throw new Error(T('Enter a valid teacher e-mail.', 'Bitte eine gültige E-Mail der Lehrkraft eingeben.'));
  await PATCH('/rest/v1/classes?id=eq.' + id, { ...readTerm('lc'), meeting_details: val('meeting') || null });
  closeSheet(); refresh();
}, T('Live class saved', 'Live-Unterricht gespeichert'));
const classPass = id => act(async () => { await PATCH('/rest/v1/classes?id=eq.' + id, { pass_mark: num('kc_pm_' + id) }); refresh(); }, T('Saved', 'Gespeichert'));
const invite = (role, cls, lv) => act(async () => {
  await q('/rest/v1/invites', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { org_id: D.org.id, class_id: cls || null, member_role: role, level: role === 'student' && lv ? lv : null } });
  refresh();
}, T('Invitation link created', 'Einladungslink erstellt'));
async function workerPost(path, body) {
  const r = await fetch(APP_CONFIG.workerUrl + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await A().token() }, body: JSON.stringify(body) });
  const d=await r.json().catch(()=>({}));
  if(!r.ok){
    if(r.status===401){
      const user=me(),id=$('ci_class')?.value;
      if(id)pendingInvite={account:user?.id,id,name:$('ci_name')?.value||'',to:$('ci_email')?.value||'',note:$('ci_note')?.value||'',draft:classInviteDraft};
      A().sheet('in');if($('ac_em')&&user?.email)$('ac_em').value=user.email;
      if($('ac_msg'))$('ac_msg').textContent=T('Your session has ended. Sign in again to continue. No email has been sent.','Ihre Sitzung ist beendet. Bitte erneut anmelden. Es wurde keine E-Mail gesendet.');
    }
    throw Object.assign(new Error(r.status===401?T('Sign in again to continue.','Bitte erneut anmelden.'):d.error||'Email service unavailable'),{status:r.status});
  }
  return d;
}
let classInviteDraft=null,pendingInvite=null;
async function checkInvitationMail(id){
  const target=$('mail_status_'+id);if(!target)return;target.textContent=T('Checking…','Wird geprüft…');
  try{const result=await workerPost('/course-invitation/status',{class_id:id});if(!target.isConnected)return;
    const states={sent:T('Accepted by mail provider','Vom Mailanbieter angenommen'),sending:T('Sending','Wird gesendet'),failed:T('Sending failed — create a new invitation or contact support','Versand fehlgeschlagen — neue Einladung erstellen oder Support kontaktieren'),not_sent:T('Email not sent','E-Mail nicht gesendet')};
    target.innerHTML=result.invitations?.length?`<ul class="ks-inv">${result.invitations.map(record=>{const invite=D.invites.find(i=>i.code===record.code);return `<li><b>${esc(invite?.recipient_email||T('Learner','Lernende Person'))}</b> · ${esc(states[record.state]||states.not_sent)}${record.updated_at?' · '+esc(new Date(record.updated_at).toLocaleString()):''}</li>`}).join('')}</ul>`:T('No individual invitation emails for this class yet. Shareable links do not send an email.','Noch keine persönlichen Einladungs-E-Mails für diese Klasse. Ein Link zum Teilen versendet keine E-Mail.');
  }catch(error){if(target.isConnected)target.textContent=err(error)}
}
async function inviteLearner() {
  if(!isStaff())return;
  if(!D.org){const orgs=await staffOrgs();if(!orgs.length){location.hash='#/klasse';return;}if(!await loadOrg(orgs[0]))return;}
  const classes=D.classes;
  if(!classes.length){toastM(T('Start a teaching term first.', 'Bitte zuerst einen Kursdurchgang erstellen.'));location.hash='#/klasse/'+D.org.id;return;}
  sendClassInvite(classes[0].id);
}
function sendClassInvite(id) {
  const c=D.classes.find(x=>x.id===id);if(!c)return;
  classInviteDraft=null;
  const complete=!!(c.term_name&&c.starts_on&&c.ends_on&&c.schedule);
  openSheet(`<h3>${T('Invite a learner','Lernende einladen')}</h3><p class="ks-tip">${T('From hello@deutschklinik.com · replies go to you.','Von hello@deutschklinik.com · Antworten gehen an Sie.')}</p>
    <div class="ks-form"><label>${T('Teaching term','Kursdurchgang')}<select class="input" id="ci_class" onchange="KONTO.sendClassInvite(this.value)">${D.classes.map(x=>`<option value="${x.id}"${x.id===id?' selected':''}>${esc(x.name)} · ${esc(x.term_name||x.level)}</option>`).join('')}</select></label>
    <div class="invite-summary"><span class="play-eyebrow">${esc(c.level)} · ${esc(c.term_name||'')}</span><h4>${esc(c.name)}</h4><p>${dt(c.starts_on)} – ${dt(c.ends_on)}</p><p>${esc(c.schedule||T('Add a timetable in term setup','Zeitplan in den Kurseinstellungen ergänzen'))}</p>${c.course_details?`<details><summary>${T('What is included','Kursangebot')}</summary><p>${esc(c.course_details)}</p></details>`:''}</div>
    <label>${T('Learner name','Name der lernenden Person')}<input class="input" id="ci_name" maxlength="60" autocomplete="off"></label><label>${T('Learner email','E-Mail der lernenden Person')}<input class="input" id="ci_email" type="email" maxlength="120" autocomplete="off" required></label><label>${T('Personal note (optional)','Persönliche Nachricht (optional)')}<textarea class="input" id="ci_note" maxlength="500" rows="2"></textarea></label></div>
    <p id="ci_status" class="ks-tip" role="status">${complete?T('The email includes your branding, dates, timetable and an enrolment link.','Die E-Mail enthält Ihr Branding, Termine, Zeitplan und den Einschreibelink.'):T('Complete the term name, dates and timetable before sending.','Vor dem Versand bitte Kursname, Termine und Zeitplan ergänzen.')}</p><div class="row" style="margin-top:1rem"><button class="btn" onclick="KONTO.previewInvite('${id}')">${icn('eye')} ${T('Preview email','E-Mail-Vorschau')}</button><span class="spacer"></span>${complete?`<button id="ci_send" class="btn primary" onclick="KONTO.sendClassInviteNow('${id}')">${icn('send')} ${T('Send invitation','Einladung senden')}</button>`:`<button class="btn primary" onclick="closeSheet();KONTO.liveClassSheet('${id}')">${T('Complete term details','Kursdaten ergänzen')}</button>`}</div>`);
  icons();
}
async function previewInvite(id){
  const status=$('ci_status');try{const r=await workerPost('/course-invitation/preview',{class_id:id,name:($('ci_name')?.value||'').trim(),note:($('ci_note')?.value||'').trim()});
    let frame=$('ci_preview');if(!frame){frame=document.createElement('iframe');frame.id='ci_preview';frame.title=T('Invitation email preview','Vorschau der Einladungs-E-Mail');frame.setAttribute('sandbox','');frame.style.cssText='width:100%;height:520px;border:1px solid var(--line);border-radius:1rem;margin-top:1rem;background:white';status.after(frame);}frame.srcdoc=r.html;status.textContent=T('Preview only — no email has been sent.','Nur Vorschau — es wurde keine E-Mail gesendet.');
  }catch(e){status.textContent=err(e);}
}
async function sendClassInviteNow(id){
  const c=D.classes.find(x=>x.id===id),name=($('ci_name')?.value||'').trim(),to=($('ci_email')?.value||'').trim().toLowerCase(),note=($('ci_note')?.value||'').trim(),button=$('ci_send'),status=$('ci_status');
  if(!c||!$('ci_email')?.reportValidity()||!to)return;
  if(button?.disabled)return;
  button.disabled=true;status.textContent=T('Sending your invitation…','Einladung wird gesendet…');
  try{
    if(!classInviteDraft||classInviteDraft.id!==id||classInviteDraft.to!==to){
      const r=await q('/rest/v1/invites',{method:'POST',headers:{Prefer:'return=representation'},body:{org_id:D.org.id,class_id:id,member_role:'student',level:c.level,uses_left:1,recipient_email:to}});
      const code=r?.[0]?.code;if(!code)throw Error(T('Could not create an invitation.','Einladung konnte nicht erstellt werden.'));
      classInviteDraft={id,to,code};
    }
    const r=await workerPost('/course-invitation',{class_id:id,to,name,note,invite_url:location.origin+location.pathname+'?join='+classInviteDraft.code});
    if(r.sent!==true)throw Error(T('The email was not accepted. Please retry.','Die E-Mail wurde nicht angenommen. Bitte erneut versuchen.'));
    closeSheet();refresh();toastM(T('Invitation sent to ','Einladung gesendet an ')+to);
  }catch(e){status.textContent=err(e);if(button)button.disabled=false;}
}
const delInvite = code => act(async () => { await q('/rest/v1/invites?code=eq.' + code, { method: 'DELETE' }); refresh(); });
const decideLiveRequest = (id, accept) => act(async () => { await rpc('decide_live_class_request', { p_request: id, p_accept: !!accept }); refresh(); }, accept ? T('Learner enrolled', 'Lernende Person eingeschrieben') : T('Application declined', 'Anmeldung abgelehnt'));
const moveMember = (u, c) => act(async () => { await PATCH('/rest/v1/org_members?org_id=eq.' + D.org.id + '&user_id=eq.' + u, { class_id: c || null }); const m = D.members.find(x => x.user_id === u); if (m) m.class_id = c || null; }, T('Moved', 'Verschoben'));
const removeMember = u => { if (!confirm(T('Remove this person from your school?', 'Diese Person aus der Schule entfernen?'))) return; act(async () => { await q('/rest/v1/org_members?org_id=eq.' + D.org.id + '&user_id=eq.' + u, { method: 'DELETE' }); window.closeSheet && closeSheet(); refresh(); }, T('Removed', 'Entfernt')); };
const addTask = c => act(async () => {
  const title = $('kt_t_' + c).value.trim(), sel = [...$('kt_ch_' + c).selectedOptions].map(o => ({ ch: +o.value, ex: null, required: GRAM.requiredExercises(+o.value) })), d = $('kt_d_' + c).value;
  if (sel.some(item => !item.required.length)) throw new Error(T('Choose a chapter with graded exercises.', 'Bitte ein Kapitel mit bewerteten Übungen wählen.'));
  if (!title || !sel.length) throw new Error(T('Please enter a title and choose at least one chapter.', 'Bitte Titel und mindestens ein Kapitel wählen.'));
  await q('/rest/v1/assignments', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { class_id: c, title, items: sel, due_at: d ? new Date(d + 'T23:59:00').toISOString() : null, pass_mark: num('kt_p_' + c) } });
  refresh();
}, T('Assignment set', 'Aufgabe gestellt'));
const delTask = id => { if (!confirm(T('Delete this assignment?', 'Aufgabe löschen?'))) return; act(async () => { await q('/rest/v1/assignments?id=eq.' + id, { method: 'DELETE' }); refresh(); }); };
function copy(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toastM(T('Link copied', 'Link kopiert')), () => prompt(T('Copy the link:', 'Link kopieren:'), t)); }

/* ---------- learner: assignments ---------- */
async function viewTasks() {
  if (!me()) return need();
  busy(); await ready(); await ensureGram();
  if (OFF) return page(T('My assignments', 'Meine Aufgaben'), `<p class="sub">${T('This is not set up yet.', 'Diese Funktion ist noch nicht eingerichtet.')}</p>`);
  let as = [], res = [];
  try { as = await q('/rest/v1/assignments?select=*&order=due_at.asc.nullslast') || []; res = await A().practiceSummary([me().id]); }
  catch (e) { return page(T('My assignments', 'Meine Aufgaben'), `<p class="sub">${esc(err(e))}</p>`); }
  const b = bestMap(res), pm = passMark();
  const rows = as.map(a => { const items = a.items || [], need = a.pass_mark || pm, done = doneTask(b, me().id, a, need), ok = items.length && done === items.length, late = !ok && a.due_at && new Date(a.due_at) < new Date();
    return `<tr><td><b>${esc(a.title)}</b><div class="ks-it">${items.map(it => `<a href="${chHash(it.ch)}${it.ex ? '/ue-' + esc(it.ex) : ''}">${esc(chTitle(it.ch))}</a>`).join(' · ')}</div></td>
      <td>${dt(a.due_at)}</td><td>${need} %</td><td>${ok ? `<span class="gr-ueb pass">${icn('check')} ${T('done', 'erledigt')}</span>` : late ? `<span class="gr-ueb fail">${T('overdue', 'überfällig')}</span>` : `${done}/${items.length}`}</td></tr>`; }).join('');
  page(T('My assignments', 'Meine Aufgaben'), `<p class="sub">${T('Assignments from', 'Aufgaben von')} ${esc(ORG && ORG.name || T('your teacher', 'deiner Lehrkraft'))}. ${T(`Passed from ${pm} % (unless the assignment says otherwise).`, `Bestanden ab ${pm} % (wenn bei der Aufgabe nichts anderes steht).`)}</p>
    ${rows ? `<div class="ks-tw"><table class="ks-t"><tr><th>${T('Assignment', 'Aufgabe')}</th><th>${T('Due', 'Bis')}</th><th>${T('Pass from', 'Bestanden ab')}</th><th>${T('Status', 'Stand')}</th></tr>${rows}</table></div>` : `<p class="sub">${T('You have no assignments right now.', 'Im Moment hast du keine Aufgaben.')}</p>`}`);
}

/* ---------- founder: what is going on ---------- */
async function viewAdmin() {
  if (!me()) return need();
  busy(); await ready(); await ensureGram();
  if (!P || P.role !== 'founder') return page(T('Owner dashboard', 'Übersicht'), `<p class="sub">${T('This page is only for the site owner.', 'Diese Seite ist nur für die Betreiberin / den Betreiber.')}</p>`);
  let s = {}, inv = [];
  try { [s, inv] = await Promise.all([rpc('site_stats'), q('/rest/v1/site_invites?select=*&order=created_at.desc&limit=50')]); }
  catch (e) { return page(T('Owner dashboard', 'Übersicht'), `<p class="sub">${esc(err(e))}</p>`); }
  s = s || {}; const a = s.activity || {}, roles = s.roles || {}, orgs = s.orgs || {};
  const link = c => location.origin + location.pathname + '?invite=' + c;
  page('', `<section class="kd-hero cv-grid"><div><p class="kd-eye">${T('Site owner', 'Betreiber/in')}</p><h1>${T('What is happening on Deutschklinik', 'Was auf Deutschklinik passiert')}</h1>
      <p class="kd-hi">${T(`${s.users || 0} accounts · ${s.new7 || 0} new this week`, `${s.users || 0} Konten · ${s.new7 || 0} neu diese Woche`)}</p>
      <div class="row"><button class="btn kd-cta" onclick="KONTO.inviteLearner()">${icn('send')} ${T('Invite a learner', 'Lernende einladen')}</button><a class="btn kd-ghost" href="#/klasse">${icn('calendar-plus')} ${T('My teaching terms', 'Meine Kursdurchgänge')}</a><a class="btn kd-ghost" href="#owner-accounts" onclick="event.preventDefault();document.getElementById('owner-accounts').open=true;document.getElementById('owner-accounts').scrollIntoView({behavior:'smooth'});KONTO.loadOwnerUsers()">${icn('users')} ${T('Manage accounts','Konten verwalten')}</a><button class="btn kd-ghost" onclick="KONTO.inviteSheet()">${icn('send')} ${T('Invite someone', 'Jemanden einladen')}</button></div></div></section>
    ${kpis([['users', s.users || 0, T('accounts', 'Konten'), `${s.confirmed || 0} ${T('confirmed', 'bestätigt')}`], ['user-plus', s.new7 || 0, T('new this week', 'neu diese Woche'), `${s.new30 || 0} ${T('in 30 days', 'in 30 Tagen')}`], ['log-in', s.signin7 || 0, T('signed in this week', 'angemeldet diese Woche')],
      ['activity', a.active7 || 0, T('active learners', 'aktive Lernende'), T('7 days', '7 Tage')], ['dumbbell', a.ex7 || 0, T('exercises this week', 'Übungen diese Woche'), a.avg30 != null ? `Ø ${a.avg30} % (30 ${T('days', 'Tage')})` : ''],
      ['school', orgs.school || 0, T('schools', 'Schulen'), `${orgs.teacher || 0} ${T('teacher pages', 'Lehrkraft-Seiten')}`], ['layers', s.classes || 0, T('classes', 'Klassen'), `${s.in_school || 0} ${T('learners in schools', 'Lernende in Schulen')}`], ['mail', (s.users||0)-(s.confirmed||0), T('awaiting email confirmation', 'warten auf E-Mail-Bestätigung')]])}
    <div class="kd-grid2"><div class="kd-card"><h3>${T('Sign-ups per day', 'Registrierungen pro Tag')} <small>${T('last 30 days', 'letzte 30 Tage')}</small></h3>${bars(last30(s.signups), T('Sign-ups per day', 'Registrierungen pro Tag'))}</div>
      <div class="kd-card"><h3>${T('Exercises done per day', 'Übungen pro Tag')} <small>${T('last 30 days', 'letzte 30 Tage')}</small></h3>${bars(last30(a.daily), T('Exercises per day', 'Übungen pro Tag'))}</div>
      <div class="kd-card"><h3>${T('Learners by level', 'Lernende nach Niveau')}</h3>${hbars(s.levels || {}, [...LV, '–'])}<p class="ks-tip">– = ${T('no level chosen yet', 'noch kein Niveau gewählt')}</p></div>
      <div class="kd-card"><h3>${T('Accounts by role', 'Konten nach Rolle')}</h3>${hbars(Object.fromEntries(Object.entries(roles).map(([k, v]) => [ROLE(k), v])), ['learner', 'teacher', 'school', 'founder'].map(ROLE))}</div></div>
    <details class="kd-card owner-accounts" id="owner-accounts" ontoggle="if(this.open)KONTO.loadOwnerUsers()"><summary>${T('Manage accounts','Konten verwalten')}</summary><div class="row" style="margin:1rem 0"><input class="input" id="owner_search" type="search" placeholder="${T('Search by email','Nach E-Mail suchen')}" onkeydown="if(event.key==='Enter')KONTO.loadOwnerUsers()"><button class="btn" onclick="KONTO.loadOwnerUsers()">${T('Search','Suchen')}</button></div><div id="owner_users"></div></details>
    <div class="kd-grid2"><div><h2 class="kd-h">${icn('user-plus')} ${T('Newest accounts', 'Neueste Konten')}</h2><div class="ks-tw"><table class="ks-t"><tr><th>${T('E-mail', 'E-Mail')}</th><th>${T('Role', 'Rolle')}</th><th>${T('Joined', 'Seit')}</th></tr>${(s.recent || []).map(r => `<tr><td>${esc(r.display_name || '')}<div class="ks-it">${esc(r.email)}${r.confirmed ? '' : ` · <span class="ks-pend">${T('not confirmed', 'nicht bestätigt')}</span>`}</div></td><td>${ROLE(r.role || 'learner')}${r.level ? ' · ' + r.level : ''}${r.requested_role ? ` · <span class="ks-pend">${ROLE(r.requested_role)}?</span>` : ''}${r.org ? `<div class="ks-it">${esc(r.org)}</div>` : ''}</td><td>${dt(r.created_at)}</td></tr>`).join('')}</table></div></div>
      <div><h2 class="kd-h">${icn('school')} ${T('Schools and teachers', 'Schulen und Lehrkräfte')}</h2>${(s.org_list || []).length ? `<div class="ks-tw"><table class="ks-t"><tr><th>${T('Name', 'Name')}</th><th>${T('Learners', 'Lernende')}</th><th>${T('Classes', 'Klassen')}</th></tr>${s.org_list.map(o => `<tr><td><a href="#/schule/${o.id}">${esc(o.name)}</a><div class="ks-it">${o.kind === 'school' ? T('School', 'Schule') : T('Teacher', 'Lehrkraft')}${o.city ? ' · ' + esc(o.city) : ''}</div></td><td>${o.students}</td><td>${o.classes}</td></tr>`).join('')}</table></div>` : `<p class="sub">${T('None yet.', 'Noch keine.')}</p>`}
      ${(a.top || []).length ? `<h2 class="kd-h">${icn('flame')} ${T('Most practised (30 days)', 'Am meisten geübt (30 Tage)')}</h2><div class="ks-tw"><table class="ks-t"><tr><th>${T('Topic / chapter', 'Thema / Kapitel')}</th><th>${T('Exercises', 'Übungen')}</th><th>${T('Learners', 'Lernende')}</th></tr>${a.top.map(t => `<tr><td><a href="${chHash(t.chapter)}">${esc(chTitle(t.chapter))}</a></td><td>${t.n}</td><td>${t.users}</td></tr>`).join('')}</table></div>` : ''}</div></div>`, 'kd');
}
async function decide(id, ok) { try { await rpc('decide_request', { p_user: id, p_ok: ok }); toastM(ok ? T('Approved – their page is ready', 'Freigeschaltet – die Seite ist angelegt') : T('Rejected', 'Abgelehnt')); refreshView(); } catch (e) { toastM(err(e)); } }
let siteInviteDraft=null;
function inviteSheet(){
 siteInviteDraft=null;
 openSheet(`<h3>${T('Invite a teacher or school','Lehrkraft oder Schule einladen')}</h3><p class="ks-tip">${T('Send a personal invitation from hello@deutschklinik.com. For students, use “Invite a learner” and choose a teaching term.','Senden Sie eine persönliche Einladung von hello@deutschklinik.com. Für Lernende wählen Sie „Lernende einladen“ und einen Kursdurchgang.')}</p><div class="ks-form"><label>${T('Invite as','Einladen als')}<select class="input" id="si_role"><option value="teacher">${T('Teacher','Lehrkraft')}</option><option value="school">${T('School','Schule')}</option></select></label><label>${T('Name','Name')}<input class="input" id="si_name" maxlength="80"></label><label>${T('Email','E-Mail')}<input class="input" id="si_email" type="email" required maxlength="120"></label></div><p id="si_status" class="ks-tip" role="status">${T('They confirm their email and go straight to their teaching dashboard.','Nach der E-Mail-Bestätigung öffnet sich direkt die Unterrichtsübersicht.')}</p><div class="row" style="margin-top:1rem"><button class="btn" onclick="closeSheet()">${T('Cancel','Abbrechen')}</button><span class="spacer"></span><button class="btn primary" id="si_send" onclick="KONTO.makeSiteInvite()">${icn('send')} ${T('Send invitation','Einladung senden')}</button></div>`);icons();
}
async function makeSiteInvite(){
 const role=$('si_role').value,name=$('si_name').value.trim(),email=$('si_email').value.trim().toLowerCase(),status=$('si_status'),button=$('si_send');
 if(!$('si_email').reportValidity())return;if(button.disabled)return;button.disabled=true;status.textContent=T('Sending invitation…','Einladung wird gesendet…');
 try{
  if(!siteInviteDraft||siteInviteDraft.email!==email||siteInviteDraft.role!==role){const rows=await q('/rest/v1/site_invites',{method:'POST',headers:{Prefer:'return=representation'},body:{role,name:name||null,email,uses_left:1}});siteInviteDraft={code:rows[0].code,role,email};}
  await workerPost('/site-invitation',{code:siteInviteDraft.code});closeSheet();refresh();toastM(T('Invitation sent to ','Einladung gesendet an ')+email);
 }catch(e){status.textContent=err(e);button.disabled=false;}
}
const delSiteInvite = code => { if (!confirm(T('Delete this invitation? The link will stop working.', 'Einladung löschen? Der Link funktioniert dann nicht mehr.'))) return; act(async () => { await q('/rest/v1/site_invites?code=eq.' + code, { method: 'DELETE' }); refresh(); }); };

let ownerUsers=[],ownerOffset=0,ownerSearch='';
async function loadOwnerUsers(offset=0){
  if(!isFounder())return;
  ownerOffset=offset;ownerSearch=$('owner_search')?.value||ownerSearch;
  const target=$('owner_users');if(!target)return;
  target.innerHTML='<p role="status">'+T('Loading accounts…','Konten werden geladen…')+'</p>';
  try{const data=await rpc('owner_accounts',{p_search:ownerSearch,p_offset:offset});ownerUsers=data.users||[];
    target.innerHTML=`<p class="ks-tip">${data.total} ${T('accounts','Konten')}</p><div class="ks-tw"><table class="ks-t"><tr><th>${T('Account','Konto')}</th><th>${T('Role','Rolle')}</th><th></th></tr>${ownerUsers.map(u=>`<tr><td><b>${esc(u.display_name||u.email)}</b><small class="ks-it">${esc(u.email)} · ${u.email_confirmed_at?T('Email confirmed','E-Mail bestätigt'):T('Awaiting email confirmation','Wartet auf E-Mail-Bestätigung')}</small></td><td>${ROLE(u.role||'learner')}</td><td>${u.protected?T('Protected','Geschützt'):`<button class="btn sm" onclick="KONTO.deleteAccountSheet('${u.id}')">${icn('trash-2')} ${T('Delete','Löschen')}</button>`}</td></tr>`).join('')}</table></div><div class="row">${offset?`<button class="btn sm" onclick="KONTO.loadOwnerUsers(${Math.max(0,offset-50)})">${T('Previous','Zurück')}</button>`:''}${offset+50<data.total?`<button class="btn sm" onclick="KONTO.loadOwnerUsers(${offset+50})">${T('Next','Weiter')}</button>`:''}</div>`;icons();
  }catch(e){target.textContent=err(e);}
}
function deleteAccountSheet(id){
 const u=ownerUsers.find(u=>u.id===id);if(!u||u.protected)return;
 openSheet(`<h3>${T('Delete account','Konto löschen')}</h3><p><b>${esc(u.email)}</b></p><p>${T('This permanently removes the account, saved learning data and results.','Das Konto, gespeicherte Lerndaten und Ergebnisse werden endgültig gelöscht.')}</p>${u.pages?`<p>${T('It also removes their teaching pages and classes. Learners keep their own accounts but lose that school membership.','Auch die Unterrichtsseiten und Klassen werden entfernt. Lernende behalten ihr Konto, verlieren aber diese Schulmitgliedschaft.')}<br>${u.pages} ${T('pages','Seiten')} · ${u.classes} ${T('classes','Klassen')} · ${u.memberships} ${T('memberships','Mitgliedschaften')}</p>`:''}<label class="ks-l">${T('Type the email to confirm','E-Mail zur Bestätigung eingeben')}<input class="input" id="delete_email" type="email" autocomplete="off"></label><p id="delete_status" role="status"></p><div class="row"><button class="btn" onclick="closeSheet()">${T('Cancel','Abbrechen')}</button><span class="spacer"></span><button class="btn" id="delete_account" onclick="KONTO.deleteAccount('${id}')">${T('Permanently delete account','Konto endgültig löschen')}</button></div>`);
}
async function deleteAccount(id){
 const u=ownerUsers.find(x=>x.id===id),status=$('delete_status'),button=$('delete_account'),email=$('delete_email')?.value.trim();
 if(!u||u.protected||email?.toLowerCase()!==u.email.toLowerCase()){status.textContent=T('Type the exact account email.','Bitte die genaue Konto-E-Mail eingeben.');return;}
 button.disabled=true;
 try{await q('/functions/v1/owner-accounts',{method:'POST',body:{user_id:id,confirm_email:email}});closeSheet();await loadOwnerUsers(ownerOffset);toastM(T('Account deleted','Konto gelöscht'));}catch(e){status.textContent=err(e);button.disabled=false;}
}

/* ---------- a school's or teacher's own home page ---------- */
async function viewOrgPage(id) {
  busy();if(me())await ready();
  let o=null,terms=[];
  try{if(/^[0-9a-f-]{36}$/i.test(id||'')){const rpcCall=me()?rpc:rpcAnon;[o,terms]=await Promise.all([rpcCall('org_page',{p_id:id}),rpcCall('org_public_terms',{p_org:id})]);}}catch(e){}
  if(!o)return page(T('Not found','Nicht gefunden'),`<p class="sub">${T('This teaching page is not available.','Diese Unterrichtsseite ist nicht verfügbar.')}</p>`);
  setBrandIcon(/^#[0-9a-f]{6}$/i.test(o.theme||'')?o.theme:null);
  const own=!!mine.orgs.find(x=>x.id===o.id),member=!!(ORG&&ORG.id===o.id),where=[o.city,o.country].filter(Boolean).map(esc).join(' · ');
  page('',`<div class="teacher-page">${hero(o,`<p class="kd-eye">${esc(o.org_type||(o.kind==='school'?T('Language school','Sprachschule'):T('German teacher','Deutschlehrkraft')))}${where?' · '+where:''}</p><h1>${esc(o.name)}</h1>${o.tagline?`<p class="kd-hi">${esc(o.tagline)}</p>`:''}<div class="row">${own?`<a class="btn kd-cta" href="#/settings">${icn('palette')} ${T('Personalise my page','Meine Seite gestalten')}</a><a class="btn kd-ghost" href="#/start/${o.id}">${T('My dashboard','Meine Übersicht')}</a>`:member?`<a class="btn kd-cta" href="#/start">${T('My classroom','Mein Kursraum')}</a>`:`<button class="btn kd-cta" onclick="KONTO.codeSheet()">${icn('mail-open')} ${T('Accept an invitation','Einladung annehmen')}</button>`}${okUrl(o.website)?`<a class="btn kd-ghost" href="${esc(o.website)}" target="_blank" rel="noopener noreferrer">${icn('arrow-up-right')} ${T('Website','Website')}</a>`:''}</div>`)}
  <div class="teacher-story"><div>${o.about?`<p class="play-eyebrow">${o.kind==='school'?T('About our school','Über unsere Schule'):T('Meet your teacher','Ihre Lehrkraft kennenlernen')}</p><h2>${T('Learning, your way.','Lernen auf Ihre Art.')}</h2><p class="teacher-bio">${esc(o.about).replace(/\n/g,'<br>')}</p>`:own?`<h2>${T('Make this space yours.','Gestalten Sie Ihren Bereich.')}</h2><p>${T('Add your story, a portrait or logo, your languages and a welcome message in Settings.','Ergänzen Sie Ihre Geschichte, ein Porträt oder Logo, Ihre Sprachen und einen Willkommenstext in den Einstellungen.')}</p>`:`<div class="teacher-intro">${SiteDesign.art('words')}<h2>${T('Make room for German.','Platz für Deutsch.')}</h2><p>${T('Use your invitation to open your classroom.','Mit Ihrer Einladung öffnet sich Ihr Kursraum.')}</p></div>`}</div><aside>${o.owner_name?`<p>${icn('user-round')} ${esc(o.owner_name)}</p>`:''}${o.languages?`<p>${icn('languages')} ${esc(o.languages)}</p>`:''}${(o.levels||[]).length?`<div class="kd-lvchips">${lvSort(o.levels).map(l=>`<span class="gr-lv ${l}">${l}</span>`).join('')}</div>`:''}<small>${T('Teaching on Deutschklinik since','Bei Deutschklinik seit')} ${dt(o.created_at)}</small></aside></div>
  ${terms.length?`<section class="teacher-terms"><p class="play-eyebrow">${T('Learn together','Gemeinsam lernen')}</p><h2>${T('Find your next class.','Finden Sie Ihren nächsten Kurs.')}</h2><div class="kd-grid2">${terms.map(c=>`<article class="kd-card"><span class="gr-lv ${c.level}">${c.level}</span><h3>${esc(c.name)}</h3><p class="play-eyebrow">${esc(c.term_name)}</p><p>${dt(c.starts_on)} – ${dt(c.ends_on)}</p><p>${esc(c.schedule)}</p>${c.course_details?`<details><summary>${T('Inside this course','Das bietet der Kurs')}</summary><p style="white-space:pre-line">${esc(c.course_details)}</p></details>`:''}<a class="btn" href="#/live-classes">${T('View class & sign up','Kurs ansehen & anmelden')} ${icn('arrow-up-right')}</a></article>`).join('')}</div></section>`:own?`<section class="quiet-empty">${SiteDesign.art('together')}<h2>${T('Your next term starts with you.','Ihr nächster Kurs beginnt mit Ihnen.')}</h2><p>${T('Choose dates, a level and a timetable, then invite your learners.','Wählen Sie Termine, Niveau und Zeitplan und laden Sie Lernende ein.')}</p><a class="btn primary" href="#/klasse/${o.id}">${T('Start a teaching term','Kursdurchgang starten')}</a></section>`:''}
  <details class="dashboard-extra"><summary>${T('Your learning toolkit','Ihre Lernwerkzeuge')}</summary><div class="kd-tools static"><span>${icn('book-a')}<b>${T('Vocabulary & grammar','Wortschatz & Grammatik')}</b></span><span>${icn('layers')}<b>${T('Flashcards','Lernkarten')}</b></span><span>${icn('gamepad-2')}<b>${T('Games','Spiele')}</b></span><span>${icn('chart-line')}<b>${T('Your progress','Ihr Fortschritt')}</b></span></div></details></div>`,'kd');
}
function codeSheet() {
  openSheet(`<h3>${T('Join with a code', 'Mit Code beitreten')}</h3><p>${T('Enter the code from your invitation link.', 'Gib den Code aus deinem Einladungslink ein.')}</p><input class="input" id="kj_code" autocomplete="off" style="width:100%" placeholder="z. B. 3f9a1c0b7d2e">
    <div class="row" style="margin-top:1rem"><span class="spacer"></span><button class="btn" onclick="closeSheet()">${T('Cancel', 'Abbrechen')}</button><button class="btn primary" onclick="KONTO.join(document.getElementById('kj_code').value)">${T('Continue', 'Weiter')}</button></div>`);
}

/* ---------- settings ---------- */
function orgForm(o, kind) {
  kind = o ? o.kind : kind; const v = o || {};
  return `${detailFields(kind, v, 'ko')}
    ${kind === 'teacher' ? `<label class="ks-l">${T('Name on your page', 'Name auf Ihrer Seite')}<input class="input" id="ko_name" maxlength="80" value="${esc(v.name || P.display_name || '')}"></label>
      <label class="ks-l">${T('Colour', 'Farbe')}<input class="input" id="ko_theme" type="color" value="${esc(/^#[0-9a-f]{6}$/i.test(v.theme || '') ? v.theme : '#1f6feb')}"></label>` : ''}
    <label class="ks-l">${T('Welcome message for your learners (on their home page)', 'Begrüßung für Ihre Lernenden (auf deren Startseite)')}<textarea class="input" id="ko_welcome" rows="2" maxlength="600">${esc(v.welcome || '')}</textarea></label>
    <label class="ks-l">${T('Banner pattern', 'Muster im Banner')}<select class="input" id="ko_cover">${[['waves', T('Waves', 'Wellen')], ['dots', T('Dots', 'Punkte')], ['grid', T('Grid', 'Raster')], ['plain', T('Plain', 'Einfarbig')]].map(c => `<option value="${c[0]}"${(v.cover || 'waves') === c[0] ? ' selected' : ''}>${c[1]}</option>`).join('')}</select></label>
    ${o && okUrl(o.logo_url) ? `<p class="ks-n"><img src="${esc(o.logo_url)}" alt="" class="kd-rqlogo" referrerpolicy="no-referrer"> <button class="btn sm" type="button" onclick="KONTO.dropLogo('${o.id}')">${T('Remove logo', 'Logo entfernen')}</button></p>` : ''}
    <div class="row"><span class="spacer"></span>${o ? `<a class="btn" href="#/schule/${o.id}">${icn('eye')} ${T('View page', 'Seite ansehen')}</a>` : ''}<button class="btn primary" onclick="KONTO.saveOrg(${o ? `'${o.id}'` : 'null'},'${kind}')">${o ? T('Save page', 'Seite speichern') : T('Create page', 'Seite anlegen')}</button></div>`;
}
async function saveOrg(id, kind) {
  const d = readDetails(kind, 'ko'), g = k => ($('ko_' + k) || {}).value;
  const body = { tagline: d.tagline || null, about: d.about || null, city: d.city || null, country: d.country || null, website: d.website || null, welcome: (g('welcome') || '').trim() || null, cover: g('cover') || 'waves' };
  if (kind === 'teacher') { body.name = (g('name') || '').trim(); body.languages = d.languages || null; body.theme = g('theme'); }
  else { body.name = d.name; body.org_type = d.org_type || null; body.theme = d.theme; }
  if (!body.name || body.name.length < 2) return toastM(T('Please enter a name.', 'Bitte einen Namen eingeben.'));
  try {
    const lf = $('ko_logo'); if (lf && lf.files && lf.files[0]) { const s = await shrinkLogo(lf.files[0]); body.logo_url = await uploadLogo(s.blob); }
    if (id) await PATCH('/rest/v1/orgs?id=eq.' + id, body);
    else { body.kind = kind; await q('/rest/v1/orgs', { method: 'POST', headers: { Prefer: 'return=minimal' }, body }); }
    toastM(T('Saved', 'Gespeichert')); await reload();
    if (!id) location.hash = '#/start';
  } catch (e) { toastM(err(e)); }
}
const dropLogo = id => act(async () => { await PATCH('/rest/v1/orgs?id=eq.' + id, { logo_url: null }); await reload(); }, T('Logo removed', 'Logo entfernt'));
async function viewSettings() {
  if (!me()) return need();
  busy(); await ready();
  if (OFF || !P) return page(T('Settings', 'Einstellungen'), `<p class="sub">${T('Your account could not be loaded.', 'Dein Konto konnte nicht geladen werden.')}</p>${retryProfile()}`);
  const learner = P.role === 'learner', own = mine.orgs[0], school = P.org_id && ORG && !ORG.owner;
  const sec = (ic, h, body) => `<section class="kd-card kd-set"><h3>${icn(ic)} ${h}</h3>${body}</section>`;
  page(T('Settings', 'Einstellungen'), `
    ${sec('user-round', T('Profile', 'Profil'), `<div class="ks-form"><label>${T('E-mail', 'E-Mail')}<input class="input" value="${esc(me().email || '')}" disabled></label>
      <label>${T('Name', 'Name')}<input class="input" id="ks_name" maxlength="60" value="${esc(P.display_name || '')}" placeholder="${T('How teachers and classmates see you', 'So sehen dich Lehrkräfte')}"></label>
      <label>${T('Language of menus and account pages', 'Sprache der Menüs und Kontoseiten')}<select class="input" id="ks_lang"><option value="auto"${P.ui_lang === 'auto' ? ' selected' : ''}>${T('Automatic (English)', 'Automatisch (Englisch)')}</option><option value="en"${P.ui_lang === 'en' ? ' selected' : ''}>English</option><option value="de"${P.ui_lang === 'de' ? ' selected' : ''}>Deutsch</option></select></label>
      <p class="ks-tip">${icn('info')} ${T('The courses themselves (topics, exercises) are always in German.', 'Die Kurse selbst (Themen, Übungen) sind immer auf Deutsch.')}</p>
      <div class="row"><span class="spacer"></span><button class="btn primary" onclick="KONTO.saveSettings()">${T('Save', 'Speichern')}</button></div></div>`)}
    ${learner ? sec('graduation-cap', T('My levels', 'Meine Niveaus'), `<div class="kd-lvset">${LV.map(l => { const st = lvState(l); return `<div class="${st}"><span class="gr-lv ${l}">${l}</span><span class="t">${esc(lvName(l))}<small>${st === 'open' ? T('enrolled', 'eingeschrieben') : st === 'pending' ? T('asked – waiting for your teacher', 'angefragt – wartet auf Lehrkraft') : T('locked', 'gesperrt')}</small></span>
        ${st === 'open' ? (l === level() ? `<span class="tag">${T('my course', 'mein Kurs')}</span>` : `<button class="btn sm" onclick="KONTO.setCourse('${l}')">${T('Make my course', 'Als Kurs wählen')}</button>`) + `<button class="btn sm" onclick="KONTO.unenroll('${l}')">${icn('log-out')} ${T('Unenroll', 'Abmelden')}</button>` : st === 'locked' ? `<button class="btn sm" onclick="KONTO.lockSheet('${l}')">${icn(P.org_id ? 'hand' : 'lock-open')} ${P.org_id ? T('Ask', 'Anfragen') : T('Enroll', 'Einschreiben')}</button>` : ''}</div>`; }).join('')}</div>
      ${P.org_id ? `<p class="ks-tip">${icn('info')} ${T('Your teacher enrolls you in new levels. You can open every level you are enrolled in until you unenroll.', 'In neue Niveaus schreibt dich deine Lehrkraft ein. Jedes Niveau, in dem du eingeschrieben bist, bleibt offen, bis du dich abmeldest.')}</p>` : ''}`) : ''}
    ${learner || school ? sec('school', T('School', 'Schule'), `${ORG ? `<p><b>${esc(ORG.name)}</b>${ORG.class ? ' · ' + esc(ORG.class.name) : ''} <a href="#/schule/${ORG.id}">${T('School page', 'Schulseite')}</a></p><p><button class="btn sm" onclick="KONTO.leave()">${icn('log-out')} ${T('Leave this school', 'Schule verlassen')}</button></p>` : `<p class="sub">${T('You are learning on your own.', 'Du lernst selbstständig.')}</p>`}
      <div class="ks-row"><span>${T('Code', 'Code')}</span><input class="input" id="ks_code" placeholder="${T('Invitation code from a school or teacher', 'Einladungscode einer Schule oder Lehrkraft')}" autocomplete="off"><button class="btn sm" onclick="KONTO.join(document.getElementById('ks_code').value)">${T('Use', 'Einlösen')}</button></div>`) : ''}
    ${own ? sec(own.kind === 'school' ? 'school' : 'presentation', own.kind === 'school' ? T('School page', 'Schulseite') : T('My teacher page', 'Meine Seite als Lehrkraft'), `<p class="ks-tip">${T('This is what your learners and visitors see. Your colour and logo also appear across the site for your learners.', 'Das sehen Ihre Lernenden und Besucher. Farbe und Logo erscheinen für Ihre Lernenden auch auf der ganzen Seite.')}</p><div class="ks-form">${orgForm(own)}</div>`)
      : isStaff() && P.role !== 'founder' && !mine.staff.length ? sec('school', T('Your page', 'Ihre Seite'), `<div class="ks-form">${orgForm(null, P.role === 'school' ? 'school' : 'teacher')}</div>`) : ''}
    ${learner ? sec('presentation', T('Teacher or school?', 'Lehrkraft oder Schule?'), P.requested_role ? `<p class="sub">${icn('hourglass')} ${T(`Confirm your email to finish setting up your teaching account.`, `Bestätige deine E-Mail, um dein Lehrkonto fertig einzurichten.`)}</p>` : `<p class="sub">${T('Teachers and schools get classes, invitation links, assignments and their own home page.', 'Lehrkräfte und Schulen bekommen Klassen, Einladungslinks, Aufgaben und eine eigene Startseite.')}</p><button class="btn" onclick="KONTO.request()">${T('Start teaching', 'Unterrichten starten')}</button>`) : ''}
    ${isFounder() ? sec('sliders-horizontal', T('Site access (owner)', 'Zugang zur Seite (Betreiber)'), `<p class="ks-tip">${T('Choose who may use each part of Deutschklinik. “Enrolled” means signed in and with a level unlocked. Teachers and schools can always use everything that is not switched off.', 'Legen Sie fest, wer welchen Teil von Deutschklinik nutzen darf. „Eingeschrieben“ heißt: angemeldet und mit freigeschaltetem Niveau. Lehrkräfte und Schulen dürfen alles, was nicht ausgeschaltet ist.')}</p>
      <div class="ks-form kd-acc">${Object.keys(FDEF).map(f => `<label><span>${T(FEAT[f][0], FEAT[f][1])}</span><select class="input" id="sf_${f}">${FMODES().map(o => `<option value="${o[0]}"${mode(f) === o[0] ? ' selected' : ''}>${o[1]}</option>`).join('')}</select></label>`).join('')}
      <label>${T('Welcome headline for visitors (empty = default)', 'Begrüßung für Besucher – Überschrift (leer = Standard)')}<input class="input" id="sw_h" maxlength="120" value="${esc((SITE.welcome || {}).headline || '')}" placeholder="Welcome to Deutschklinik"></label>
      <label>${T('Welcome message (empty = default)', 'Begrüßungstext (leer = Standard)')}<textarea class="input" id="sw_m" rows="3" maxlength="600">${esc((SITE.welcome || {}).message || '')}</textarea></label>
      <div class="row"><span class="spacer"></span><a class="btn" href="#/start" onclick="event.preventDefault();KONTO.previewWelcome()">${icn('eye')} ${T('Preview home page', 'Startseite ansehen')}</a><button class="btn primary" onclick="KONTO.saveSite()">${T('Save', 'Speichern')}</button></div></div>`) : ''}
    ${sec('lock-keyhole', T('Security', 'Sicherheit'), `<div class="row"><button class="btn" onclick="ACCT.sheet('newpw')">${icn('key-round')} ${T('Change password', 'Passwort ändern')}</button><button class="btn" onclick="ACCT.signOut()">${icn('log-out')} ${T('Sign out', 'Abmelden')}</button></div>`)}`, 'kd');
}
async function saveSettings() {
  const body = { display_name: ($('ks_name').value || '').trim() || null, ui_lang: $('ks_lang').value };
  if (await saveProfile(body, T('Saved', 'Gespeichert'))) { applyNav(); refreshView(); }
}
async function unenroll(l) {
  if (!P || !confirm(T(`Unenroll from ${l}? Its topics and exercises close for you; your results are kept.` + (P.org_id ? ' Only your teacher can enroll you again.' : ''), `Von ${l} abmelden? Die Themen und Übungen schließen sich für dich; deine Ergebnisse bleiben gespeichert.` + (P.org_id ? ' Nur deine Lehrkraft kann dich wieder einschreiben.' : '')))) return;
  const rest = unlockedSet().filter(x => x !== l), body = { unlocked: rest };
  if (P.level === l) body.level = rest.slice(-1)[0] || null;
  if (await saveProfile(body, T(`You left ${l}.`, `Du hast dich von ${l} abgemeldet.`))) { delete P._noUnl; applyNav(); refreshView(); }
}
async function setCourse(l) { if (await saveProfile({ level: l }, T(`${l} is now your course`, `${l} ist jetzt dein Kurs`))) refreshView(); }
async function leave() {
  if (!ORG || !confirm(T(`Leave ${ORG.name}? Your unlocked levels stay.`, `${ORG.name} verlassen? Deine freigeschalteten Niveaus bleiben.`))) return;
  act(async () => { await q('/rest/v1/org_members?org_id=eq.' + ORG.id + '&user_id=eq.' + me().id, { method: 'DELETE' }); await reload(); }, T('You left the school', 'Du hast die Schule verlassen'));
}
function request() {
  openSheet(`<h3>${T('Account for teachers and schools', 'Konto für Lehrkräfte und Schulen')}</h3><p>${T('With it you create classes, invite learners, set assignments with deadlines and your own pass mark, and get your own home page. Your confirmed email activates your teaching workspace immediately.', 'Damit legen Sie Klassen an, laden Lernende ein, stellen Aufgaben mit Termin und eigener Bestehensgrenze und bekommen eine eigene Startseite. Mit Ihrer bestätigten E-Mail wird Ihr Unterrichtsbereich sofort aktiviert.')}</p>
    <div class="ks-form"><select class="input" id="kr_role" onchange="KONTO.reqFields()"><option value="teacher">${T('I am a teacher', 'Ich bin Lehrkraft')}</option><option value="school">${T('We are a school / organisation', 'Wir sind eine Schule / Organisation')}</option></select><div id="kr_more"></div></div>
    <div class="row" style="margin-top:1rem"><span class="spacer"></span><button class="btn" onclick="closeSheet()">${T('Cancel', 'Abbrechen')}</button><button class="btn primary" onclick="KONTO.sendRequest()">${T('Create my teaching workspace', 'Unterrichtsbereich erstellen')}</button></div>`);
  reqFields();
}
function reqFields() { const r = $('kr_role').value; $('kr_more').innerHTML = detailFields(r, {}, 'kr'); }
async function sendRequest() {
  const r = $('kr_role').value, info = readDetails(r, 'kr');
  if (r === 'school' && (!info.name || info.name.length < 2)) return toastM(T('Please enter the name of the school.', 'Bitte den Namen der Schule eingeben.'));
  try { const lf = $('kr_logo'); if (lf && lf.files && lf.files[0]) { const s = await shrinkLogo(lf.files[0]); info.logo_url = await uploadLogo(s.blob); } } catch (e) { return toastM(err(e)); }
  try { await rpc('register_teaching_account', {p_kind:r,p_info:info}); closeSheet(); await reload(); location.hash='#/start'; refreshView(); toastM(T('Your teaching workspace is ready', 'Ihr Unterrichtsbereich ist bereit')); } catch(e) { toastM(err(e)); }
}

/* ---------- home for visitors who are not signed in: Deutschklinik ---------- */
const LVDESC = { A1: ['First words, first conversations', 'Erste Wörter, erste Gespräche'], A2: ['Everyday life with confidence', 'Sicher im Alltag'], B1: ['Work, travel and your opinion', 'Beruf, Reisen und die eigene Meinung'],
  B2: ['Discuss, argue, understand the news', 'Diskutieren, argumentieren, Nachrichten verstehen'], C1: ['Precise, professional, almost native', 'Präzise, professionell, fast muttersprachlich'] };
function viewWelcome() {
  const w = SITE.welcome || {}, h = w.headline || T('Your German starts here.', 'Hier beginnt dein Deutsch.'),
    msg = w.message || T('Words, pictures and practice. A little more German, every day.', 'Wörter, Bilder und Übungen. Jeden Tag ein bisschen mehr Deutsch.');
  const free = ['dict', 'games'].filter(f => mode(f) === 'everyone');
  page('', `<section class="kd-home-hero"><div class="kd-home-intro"><p class="kd-eye">${T('A new language. New possibilities.', 'Eine neue Sprache. Neue Möglichkeiten.')}</p><h1>${esc(h)}</h1><p>${esc(msg)}</p>
      <button class="btn primary" onclick="ACCT.sheet('up')">${T('Start learning for free', 'Kostenlos loslegen')} ${icn('arrow-right')}</button></div>
      <div class="kd-home-art" aria-hidden="true">${welcomeArt('learn')}</div></section>
    ${free.length ? `<section class="kd-home-try" aria-labelledby="home-try"><div><h2 id="home-try">${T('Try a little German.', 'Probiere ein bisschen Deutsch.')}</h2><p>${T('No account needed.', 'Ohne Konto.')}</p></div><div class="kd-home-tools">
      ${free.includes('dict') ? `<form class="kd-look" role="search" onsubmit="event.preventDefault();KONTO.lookup(this.q.value)"><label class="sr-only" for="home-word">${T('Look up a German word', 'Deutsches Wort nachschlagen')}</label><input id="home-word" name="q" class="input" role="combobox" aria-autocomplete="list" aria-controls="home-suggestions" aria-expanded="false" placeholder="${T('Look up a word …', 'Ein Wort nachschlagen …')}" autocomplete="off" lang="de" required><button class="btn primary" aria-label="${T('Search dictionary', 'Wörterbuch durchsuchen')}">${icn('search')}</button><div id="home-suggestions" role="listbox" aria-label="${T('Search results','Suchergebnisse')}" hidden></div></form>` : ''}
      ${free.includes('games') ? `<a class="kd-home-game" href="#/play">${icn('gamepad-2')} ${T('Play a game', 'Ein Spiel spielen')} ${icn('arrow-up-right')}</a>` : ''}</div></section>` : ''}
    <section class="kd-home-live" aria-labelledby="home-live"><div class="kd-home-class-art" aria-hidden="true">${welcomeArt('class')}</div><div><p class="kd-eye">${T('Learn together', 'Gemeinsam lernen')}</p><h2 id="home-live">${T('A teacher. A class. Your next step.', 'Eine Lehrkraft. Eine Klasse. Dein nächster Schritt.')}</h2><p>${T('Find a live German class that fits your level and schedule.', 'Finde einen Deutsch-Live-Kurs, der zu deinem Niveau und Zeitplan passt.')}</p><a class="kd-home-link" href="#/live-classes">${T('Explore live classes', 'Live-Kurse entdecken')} ${icn('arrow-right')}</a></div></section>
    <div class="kd-home-more"><details><summary>${T('Find your level', 'Finde dein Niveau')} ${icn('plus')}</summary><div class="kd-home-levels">${LV.map(l => { const c = COURSE_COUNTS[l]; return `<div><span class="gr-lv ${l}">${l}</span><div><b>${esc(lvName(l))}</b><p>${c ? esc(T(LVDESC[l][0], LVDESC[l][1])) : T('Coming soon', 'Kommt bald')}</p>${c ? `<small>${[c.v ? c.v + ' ' + T('vocabulary topics', 'Wortschatz-Themen') : '', c.g ? c.g + ' ' + T('grammar chapters', 'Grammatik-Kapitel') : ''].filter(Boolean).join(' · ')}</small>` : ''}</div></div>`; }).join('')}</div></details>
    <details><summary>${T('For teachers & schools', 'Für Lehrkräfte & Schulen')} ${icn('plus')}</summary><div class="kd-home-teachers"><p>${T('Start a term, invite your learners and follow their progress.', 'Starte einen Kursdurchgang, lade Lernende ein und begleite ihren Fortschritt.')}</p><div class="row"><button class="btn" onclick="KONTO.signupAs('teacher')">${T('I am a teacher', 'Ich bin Lehrkraft')}</button><button class="btn" onclick="KONTO.signupAs('school')">${T('Register a school', 'Schule registrieren')}</button></div></div></details></div>`, 'kd kd-home');
if($('home-word')&&window.bindHomeSearch)bindHomeSearch($('home-word'),$('home-suggestions'));
}
// Small inline vector scenes stay sharp on phones and need no image downloads.
function welcomeArt(scene) {
  if (scene === 'class') return `<svg viewBox="0 0 300 210" xmlns="http://www.w3.org/2000/svg" focusable="false"><circle cx="151" cy="105" r="93" fill="#e9f1ff"/><rect x="27" y="33" width="247" height="149" rx="15" fill="#fff" stroke="#1f6feb" stroke-width="3"/><path d="M28 64h245" stroke="#1f6feb" stroke-width="2"/><circle cx="43" cy="49" r="4" fill="#a7c7fb"/><circle cx="57" cy="49" r="4" fill="#a7c7fb"/><circle cx="71" cy="49" r="4" fill="#a7c7fb"/><rect x="41" y="78" width="139" height="89" rx="8" fill="#f6f4ef"/><path d="M82 167v-16c0-20 14-33 29-33s29 13 29 33v16" fill="#1f6feb"/><rect x="102" y="116" width="17" height="20" rx="7" fill="#c78359"/><ellipse cx="111" cy="106" rx="21" ry="24" fill="#d99d75"/><path d="M90 108c-8-38 42-43 43-8-10-1-18-6-24-14-2 12-9 18-19 22" fill="#233448"/><rect x="191" y="78" width="68" height="40" rx="6" fill="#dce9ff"/><circle cx="225" cy="92" r="9" fill="#e7b98f"/><path d="M208 116c1-17 32-17 34 0" fill="#233448"/><rect x="191" y="127" width="68" height="40" rx="6" fill="#f6f4ef"/><circle cx="225" cy="140" r="9" fill="#9c6246"/><path d="M208 166c1-17 32-17 34 0" fill="#1f6feb"/><path d="M116 193h69m-35-10v10" stroke="#1f6feb" stroke-width="4" stroke-linecap="round"/><path d="m8 126 6-7 6 7m260-40 6-7 6 7" fill="none" stroke="#1f6feb" stroke-width="3" stroke-linecap="round"/></svg>`;
  return `<svg viewBox="0 0 440 370" xmlns="http://www.w3.org/2000/svg" focusable="false"><ellipse cx="226" cy="192" rx="177" ry="159" fill="#e1ecff"/><path d="M28 288c34-34 57-38 90-20m236-145c30-23 44-16 57-36" fill="none" stroke="#a5c4f7" stroke-width="2" stroke-dasharray="5 7"/><g transform="rotate(-11 124 135)"><rect x="48" y="48" width="148" height="179" rx="15" fill="#fff" stroke="#1f6feb" stroke-width="2"/><path d="M122 85c-7-13 1-24 11-26" fill="none" stroke="#426d51" stroke-width="5" stroke-linecap="round"/><path d="M127 87c18-24 43-4 32 24-9 25-21 40-33 29-15 10-28-7-34-28-8-26 16-41 35-25" fill="#ee8868"/><path d="M125 77c-19 1-26-7-25-16 15-2 25 4 25 16" fill="#59865c"/><text x="122" y="174" text-anchor="middle" font-size="23" font-family="Georgia,serif" fill="#233448">der Apfel</text><path d="M99 198v-5m10 10v-14m10 19v-24m10 19v-14m10 9v-5" stroke="#1f6feb" stroke-width="3" stroke-linecap="round"/></g><path d="M218 282c-5-55 8-112 51-112 42 0 59 47 62 99l-24 38-89-25" fill="#1f6feb"/><path d="M266 182c12 3 27 0 29-12l-3-26-26 1z" fill="#a96a4d"/><path d="M250 103c-18 21-11 69 17 74 25 5 44-17 46-42s-44-50-63-32" fill="#bd805d"/><path d="M245 131c-24-19-11-58 13-54 18-20 54-3 57 19 17 8 11 33-2 45l-8-18c-23-1-36-9-45-22 3 15-3 24-15 30" fill="#233448"/><path d="M282 139h8m-28-4h3" stroke="#233448" stroke-width="3" stroke-linecap="round"/><path d="M271 152c5 5 11 5 16 1" stroke="#754932" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M239 216c-6 28-22 49-43 48l-26-19-11 17c32 39 68 34 94-3" fill="#bd805d"/><path d="M307 218c14 25 25 38 43 34l17-23 15 12c-12 39-43 53-72 23" fill="#bd805d"/><path d="M136 262c35-9 69-5 99 11 31-17 66-20 104-10l-3 63c-37-12-72-10-101 5-30-15-65-17-102-5z" fill="#fff" stroke="#233448" stroke-width="2.5"/><path d="M235 274v56m-83-49c23-4 44-1 65 7m-66 10c23-4 44-1 65 7m37-17c21-8 42-11 64-7m-64 24c21-8 42-11 64-7" fill="none" stroke="#a5c4f7" stroke-width="3" stroke-linecap="round"/><path d="M89 335h292" stroke="#233448" stroke-width="3" stroke-linecap="round"/><path d="m361 66 4-12 4 12 12 4-12 4-4 12-4-12-12-4z" fill="#ee8868"/><circle cx="49" cy="241" r="5" fill="#ee8868"/><g transform="rotate(9 350 177)"><rect x="323" y="157" width="83" height="45" rx="14" fill="#fff" stroke="#1f6feb" stroke-width="2"/><path d="m334 199-1 13 17-10" fill="#fff" stroke="#1f6feb" stroke-width="2"/><text x="365" y="186" text-anchor="middle" font-family="Georgia,serif" font-size="20" fill="#233448">Hallo!</text></g></svg>`;
}
function lookup(w) { openLookup(w); }
function signupAs(r) { SU.role = r; A() && A().sheet && A().sheet('up'); }
async function saveSite() {
  const features = {}; Object.keys(FDEF).forEach(f => { const v = ($('sf_' + f) || {}).value; if (v) features[f] = v; });
  const welcome = {}, hh = (($('sw_h') || {}).value || '').trim(), mm = (($('sw_m') || {}).value || '').trim(); if (hh) welcome.headline = hh.slice(0, 120); if (mm) welcome.message = mm.slice(0, 600);
  try { await PATCH('/rest/v1/site_settings?id=eq.1', { features, welcome, updated_at: new Date().toISOString() }); SITE = { features, welcome }; LSs('gd_site', SITE); applyNav(); toastM(T('Site settings saved', 'Einstellungen der Seite gespeichert')); }
  catch (e) { toastM(err(e)); }
}

/* ---------- public live-class enrolment ---------- */
async function viewLiveClasses() {
  busy(); let classes = [];
  try { classes = await rpcAnon('live_class_catalog') || []; } catch (e) { classes = []; }
  const apply = c => !me() ? `<button class="btn primary" onclick="ACCT.sheet('up')">${T('Create a free learner account', 'Kostenloses Lernkonto erstellen')}</button>`
    : !P ? `<button class="btn" onclick="KONTO.reload()">${T('Checking account …', 'Konto wird geprüft …')}</button>`
    : P.role !== 'learner' ? '' : `<button class="btn primary" onclick="KONTO.applyLiveClass('${c.id}')">${T('Apply for this class', 'Für diese Klasse anmelden')}</button>`;
  page('', `<section class="course-public-hero"><div><p class="kd-eye">${T('Learn together', 'Gemeinsam lernen')}</p><h1>${T('Live instructor-led German classes', 'Deutsch-Live-Unterricht mit Lehrkraft')}</h1><p>${T('Your teacher. Your class. Your next step.', 'Deine Lehrkraft. Deine Klasse. Dein nächster Schritt.')}</p></div>${SiteDesign.art('together')}</section><details class="dashboard-extra"><summary>${T('How joining works', 'So meldest du dich an')}</summary><p>${T('Choose a class and level, create your free learner account, and apply. Your teacher confirms enrolment before your course opens.', 'Wähle Klasse und Niveau, erstelle dein kostenloses Lernkonto und melde dich an. Deine Lehrkraft bestätigt die Einschreibung, bevor dein Kurs öffnet.')}</p><p><a href="mailto:support@deutschklinik.com">support@deutschklinik.com</a> · +256 755 221 543</p></details>
    ${classes.length ? `<div class="kd-grid2">${classes.map(c => `<article class="kd-card"><span class="gr-lv ${esc(c.level)}">${esc(c.level)}</span><h2>${esc(c.name)}</h2>${c.term_name ? `<p class="kd-eye">${esc(c.term_name)}</p>` : ''}<p class="m"><b>${esc(c.teacher || c.organisation)}</b>${c.organisation && c.teacher ? ' · ' + esc(c.organisation) : ''}</p><p>${icn('calendar')} ${T('Starts', 'Start')}: ${dt(c.starts_on)}${c.ends_on ? ' · ' + T('ends', 'Ende') + ': ' + dt(c.ends_on) : ''}</p><p>${icn('clock')} ${esc(c.schedule || T('Schedule to be confirmed', 'Zeitplan wird noch bestätigt'))}</p>${c.course_details ? `<p style="white-space:pre-line">${esc(c.course_details)}</p>` : ''}${apply(c)}</article>`).join('')}</div>` : `<div class="kd-card kd-empty">${icn('calendar-clock')}<h2>${T('Classes will be published here soon', 'Klassen werden bald hier veröffentlicht')}</h2><p>${T('For upcoming terms or course questions, contact support@deutschklinik.com or +256 755 221 543.', 'Für kommende Kurse oder Fragen: support@deutschklinik.com oder +256 755 221 543.')}</p></div>`}`, 'kd');
}
const applyLiveClass = id => act(async () => { const r = await workerPost('/live-class-request', { class_id: id }); toastM(T(`Application received for ${r.class_name} (${r.level}). Your teacher will confirm your place.`, `Anmeldung für ${r.class_name} (${r.level}) eingegangen. Ihre Lehrkraft bestätigt den Platz.`)); }, '');

/* ---------- routes ---------- */
const ROUTES = ['start', 'kurs', 'settings', 'schule', 'klasse', 'admin', 'aufgaben', 'live-classes'];
async function viewStart(arg) {
  if (!me() || arg === 'besucher') return viewWelcome();
  busy(); await ready();
  if (OFF || !P) return page(T('Home', 'Start'), `<p class="sub">${T('Your account could not be loaded.', 'Dein Konto konnte nicht geladen werden.')}</p>${retryProfile()}<p><a class="btn" href="#/">${T('Dictionary', 'Wörterbuch')}</a></p>`);
  if (P.role === 'founder' && !arg) return viewAdmin();
  if (isStaff()) return viewStaff(arg);
  return viewLearner();
}
function view(p, arg) {
  CUR = p;
  document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('on', p === 'start' && a.dataset.t === 'start'));
  const f = { start: viewStart, kurs: viewCourse, settings: viewSettings, schule: viewOrgPage, klasse: viewClasses, admin: viewAdmin, aufgaben: viewTasks, 'live-classes': viewLiveClasses }[p] || viewStart;
  return f(arg);
}

/* ---------- tooltips for the charts ---------- */
let tip = null;
document.addEventListener('mouseover', e => {
  const g = e.target.closest && e.target.closest('.kd-chart [data-tip]');
  if (!g) { if (tip) tip.hidden = true; return; }
  if (!tip) { tip = document.createElement('div'); tip.className = 'kd-tip'; document.body.appendChild(tip); }
  tip.textContent = g.dataset.tip; tip.hidden = false;
  const r = g.getBoundingClientRect(); tip.style.left = Math.min(innerWidth - tip.offsetWidth - 8, Math.max(8, r.left + r.width / 2 - tip.offsetWidth / 2)) + 'px'; tip.style.top = (r.top + scrollY - tip.offsetHeight - 6) + 'px';
});

/* ---------- styles ---------- */
const st = document.createElement('style');
st.textContent = `#orgbrand{display:flex;align-items:center;gap:.4rem;font-weight:700;font-size:.85rem;color:var(--ac);margin-left:.5rem;max-width:12rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;text-decoration:none}
#orgbrand img{height:28px;width:auto;max-width:64px;border-radius:5px;object-fit:contain}
@media(max-width:1360px){#orgbrand span{display:none}}
.sheet{max-height:calc(100vh - 2rem);overflow-y:auto}
@media(max-width:640px){
  nav.tabs{grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-flow:row;grid-auto-columns:auto;gap:.1rem;padding:.35rem .5rem calc(.35rem + env(safe-area-inset-bottom))}
  nav.tabs a{font-size:.72rem;letter-spacing:normal;min-height:46px;padding:.3rem .1rem}
  nav.tabs a span{display:block;overflow:visible;text-overflow:clip}
  main{padding-bottom:1rem}.site-footer{padding-bottom:calc(8rem + env(safe-area-inset-bottom))}
  #toast{bottom:calc(7.5rem + env(safe-area-inset-bottom))}
  .grades{bottom:calc(7.5rem + env(safe-area-inset-bottom))}
}
@media(min-width:641px) and (max-width:1180px){
  header .bar{height:auto;min-height:58px;flex-wrap:wrap;gap:.5rem;padding-top:.5rem;padding-bottom:.5rem}
  #theme{margin-left:auto}
  nav.tabs{order:3;flex-basis:100%;margin:0;overflow:visible;justify-content:space-between}
  nav.tabs a{flex:1;justify-content:center;padding:.4rem .2rem;font-size:.75rem}
  nav.tabs a span{display:inline}nav.tabs a .lic{display:none}
}
nav.tabs a{position:relative}nav.tabs a.ks-lk{opacity:.62}.ks-lki{position:absolute;top:3px;right:3px;opacity:.9}
header .brand{flex-shrink:0}@media(min-width:1100px){header .wrap{max-width:1220px}}
.kd-gate{max-width:560px;margin:2.5rem auto;text-align:center;display:grid;justify-items:center;gap:.5rem;padding:2rem 1.2rem;border:1px solid var(--line);border-radius:1.2rem;background:var(--card)}
.kd-gate .ic{width:56px;height:56px;border-radius:1rem;display:grid;place-items:center;background:var(--ac-salt);color:var(--ac);font-size:1.6rem}.kd-gate h1{font-family:Fraunces,serif;margin:0;font-size:1.6rem}.kd-gate p{margin:0;color:var(--mut)}
.kd-gate .row{display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center;margin-top:.5rem}.kd-gate .kd-eye{color:var(--ac)}.kd-gate .ks-tip a{color:var(--ac)}
:root[data-audience="visitor"] nav.tabs a:not([data-t="start"]):not([data-t="home"]):not([data-t="play"]){display:none}
.kd-home{padding-top:.5rem}.kd-home .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}.kd-home-hero{display:grid;grid-template-columns:1.1fr 1fr;gap:1rem;align-items:center;min-height:390px;padding:.5rem 0 1.7rem}
.kd-home .btn.primary{background:#1f6feb;color:#fff}.kd-home-intro{padding:1rem 0}.kd-home-intro .kd-eye,.kd-home-live .kd-eye{color:var(--ac);opacity:1;font-size:.67rem;letter-spacing:.1em}
.kd-home-intro h1{font-family:Fraunces,serif;font-weight:600;font-size:clamp(2.7rem,5.5vw,4.3rem);letter-spacing:-.045em;line-height:1.06;max-width:12ch;margin:1rem 0;color:var(--fg);overflow-wrap:anywhere}
.kd-home-intro>p:not(.kd-eye){font-size:1.05rem;line-height:1.6;color:var(--mut);max-width:30ch;margin:0 0 1.5rem}.kd-home-intro>.btn{padding:.8rem 1.1rem;gap:.8rem;font-size:.9rem}
.kd-home-art svg,.kd-home-class-art svg{display:block;width:100%;height:auto}.kd-home-art{max-width:440px;width:100%;justify-self:end}
.kd-home-try{display:flex;align-items:center;gap:1.2rem;justify-content:space-between;border-block:1px solid var(--line);padding:1.6rem 0}
.kd-home h2{font-family:Fraunces,serif;font-weight:600;font-size:1.55rem;line-height:1.2;letter-spacing:-.02em;margin:0 0 .4rem;color:var(--fg)}
.kd-home-try p{font-size:.82rem;color:var(--mut);margin:0}.kd-home-tools{display:flex;align-items:center;gap:1rem;flex-wrap:wrap;justify-content:flex-end;flex:1;min-width:0}
.kd-look{display:flex;gap:.35rem;flex:1;min-width:12rem;max-width:23rem;margin:0}.kd-look .input{flex:1;min-width:0;width:100%;padding:.65rem .8rem;background:var(--card);color:var(--fg)}.kd-look .btn{padding:.6rem .8rem}
.kd-home-game,.kd-home-link{display:inline-flex;gap:.45rem;align-items:center;color:var(--ac);font-weight:600;font-size:.85rem;text-decoration:none;min-height:44px}.kd-home-game:hover,.kd-home-link:hover{text-decoration:underline;text-underline-offset:4px}
.kd-home-live{display:grid;grid-template-columns:230px 1fr;gap:2.5rem;align-items:center;padding:2.5rem 1rem}.kd-home-live h2{max-width:24ch;margin:.6rem 0}.kd-home-live p:not(.kd-eye){color:var(--mut);font-size:.9rem;max-width:44ch;margin:.6rem 0}.kd-home-class-art{width:100%;max-width:250px}
.kd-home-more{border-top:1px solid var(--line)}.kd-home-more>details{border-bottom:1px solid var(--line)}.kd-home-more summary{display:flex;justify-content:space-between;align-items:center;gap:1rem;list-style:none;cursor:pointer;font-weight:600;font-size:.9rem;padding:1.2rem 0}.kd-home-more summary::-webkit-details-marker{display:none}.kd-home-more summary .lic{color:var(--mut);transition:transform .15s}.kd-home-more details[open]>summary .lic{transform:rotate(45deg)}
.kd-home-levels{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.3rem;padding:.2rem 0 1.5rem}.kd-home-levels>div{display:flex;gap:.7rem;align-items:flex-start}.kd-home-levels .gr-lv{font-size:.85rem;padding:.3rem .5rem;min-width:2.3rem;text-align:center}.kd-home-levels b{font-size:.85rem}.kd-home-levels p{color:var(--mut);font-size:.8rem;margin:.15rem 0}.kd-home-levels small{color:var(--mut);font-size:.72rem}.kd-home-teachers{padding:0 0 1.4rem}.kd-home-teachers p{color:var(--mut);font-size:.88rem;margin:0 0 .7rem}.kd-home-teachers .row{display:flex;flex-wrap:wrap;gap:.5rem}
@media(max-width:700px){.kd-home-hero{grid-template-columns:1.15fr 1fr;gap:0;min-height:310px}.kd-home-intro h1{font-size:clamp(2.2rem,6.5vw,3rem)}.kd-home-intro .kd-eye{font-size:.6rem}.kd-home-intro>p:not(.kd-eye){font-size:.9rem}.kd-home-try{align-items:flex-start;flex-direction:column;gap:1rem}.kd-home-tools{width:100%;justify-content:flex-start}.kd-look{max-width:none}.kd-home-live{grid-template-columns:180px 1fr;gap:1rem;padding:2rem 0}}
@media(max-width:640px){:root[data-audience="visitor"] nav.tabs{grid-template-columns:repeat(3,minmax(0,1fr))}:root[data-audience="visitor"] .site-footer{padding-bottom:calc(5rem + env(safe-area-inset-bottom))}}
@media(max-width:480px){.kd-home-hero{grid-template-columns:1fr;padding:0 0 1.1rem;gap:0}.kd-home-intro{padding:.5rem 0 0}.kd-home-intro h1{font-size:2.9rem;max-width:12ch;margin:.7rem 0}.kd-home-intro>p:not(.kd-eye){max-width:32ch;margin-bottom:1rem}.kd-home-intro>.btn{padding:.7rem 1rem}.kd-home-art{max-width:280px;justify-self:center;margin:-.3rem 0 -.7rem}.kd-home-try{padding:1.2rem 0}.kd-home-tools{gap:.3rem 1rem}.kd-look{flex-basis:100%}.kd-home-live{grid-template-columns:1fr;gap:.3rem;padding:1.4rem 0}.kd-home-class-art{max-width:180px;justify-self:center}.kd-home-live h2{font-size:1.65rem;max-width:22ch}.kd-home h2{font-size:1.45rem}}
.kd-acc>label{grid-template-columns:minmax(8rem,12rem) 1fr;align-items:center}@media(max-width:560px){.kd-acc>label{grid-template-columns:1fr}}
.ks-box{display:grid;gap:.55rem;margin:0 0 .3rem}.ks-l{display:grid;gap:.25rem;font-size:.8rem;color:var(--mut);font-weight:600}.ks-l .input{width:100%}.ks-n{font-size:.8rem!important;margin:0!important;display:flex;gap:.4rem;align-items:center}
.ks-2{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}.ks-dt{display:grid;gap:.55rem}textarea.input{resize:vertical;min-height:4.2rem;font:inherit}
.ks-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:.3rem}.ks-seg button{display:flex;flex-direction:column;align-items:center;gap:.2rem;padding:.55rem .3rem;border:1px solid var(--line);background:var(--panel);border-radius:.7rem;font-weight:600;font-size:.8rem;color:var(--mut);cursor:pointer}
.ks-seg button[aria-checked="true"]{border-color:var(--ac);background:var(--ac-salt);color:var(--ac)}
.ks-invite{display:flex;gap:.7rem;align-items:center;padding:.7rem .8rem;border-radius:.8rem;background:color-mix(in srgb,var(--org) 12%,var(--card));border:1px solid color-mix(in srgb,var(--org) 40%,var(--line))}
.ks-invite img{height:40px;max-width:70px;object-fit:contain;border-radius:6px}.ks-invite .ic{width:40px;height:40px;display:grid;place-items:center;border-radius:.6rem;background:var(--org);color:#fff}.ks-invite b{display:block}.ks-invite small{color:var(--mut)}
.ks-card{border:1px solid var(--line);background:var(--card);border-radius:.8rem;padding:.8rem .9rem;margin:0 0 .9rem}
.ks-row{display:flex;align-items:center;gap:.5rem;margin:.35rem 0;font-size:.88rem;flex-wrap:wrap}.ks-row>span:first-child{min-width:5.5rem;color:var(--mut);font-size:.8rem;font-weight:600}
.ks-row .input{flex:1;min-width:8rem;padding:.4rem .6rem;font-size:.88rem}.ks-pend{color:var(--bad)}.ks-sep{height:1px;background:var(--line);margin:.7rem 0}
.ks-links{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.5rem}.ks-page{max-width:1040px}
.ks-form{display:grid;gap:.55rem}.ks-form>label{display:grid;gap:.25rem;font-size:.82rem;color:var(--mut);font-weight:600}.ks-form .input{width:100%}
.ks-tw{overflow-x:auto}.ks-t{width:100%;border-collapse:collapse;font-size:.88rem}.ks-t th,.ks-t td{text-align:left;padding:.45rem .5rem;border-bottom:1px solid var(--line2);vertical-align:top}
.ks-t th{font-size:.72rem;color:var(--mut);text-transform:uppercase;letter-spacing:.04em}.ks-act{white-space:nowrap}.ks-act .btn{margin-left:.3rem}
.ks-it{font-size:.78rem;color:var(--mut);margin-top:.15rem}.ks-it a{color:var(--ac)}.ks-sl{padding:.25rem .4rem;font-size:.82rem}
.ks-inv{list-style:none;padding:0;margin:.4rem 0;display:grid;gap:.35rem;font-size:.85rem}.ks-inv li{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap}.ks-inv code{background:var(--panel);padding:.1rem .35rem;border-radius:.3rem}
.ks-cls summary,.ks-card>summary{cursor:pointer;display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}.ks-cls summary small,.ks-card summary small{color:var(--mut)}
.ks-page .gr-ueb.pass{color:var(--ok);font-weight:600}.ks-page .gr-ueb.fail{color:var(--bad);font-weight:600}.ks-page .gr-lv,.sheet .gr-lv{font-size:.7rem;font-weight:700;padding:.05rem .4rem;border-radius:.4rem;background:var(--panel)}
.ks-h{margin:1rem 0 .4rem;font-size:.9rem}.ks-new{border-top:1px solid var(--line);margin-top:1rem;padding-top:.8rem}.ks-tip{font-size:.8rem;color:var(--mut);margin:.5rem 0 0}
/* dashboards */
.kd-hero{--org:var(--ac);--orgink:#fff;position:relative;display:flex;gap:1.1rem;align-items:center;padding:1.6rem 1.5rem;border-radius:1.2rem;color:var(--orgink);background:var(--org);overflow:hidden;margin:0 0 1rem}
.kd-hero.cv-waves{background:radial-gradient(circle at 105% -10%,rgba(255,255,255,.2) 0 28%,transparent 29%),radial-gradient(circle at 75% 140%,rgba(255,255,255,.14) 0 34%,transparent 35%),var(--org)}
.kd-hero.cv-dots{background:radial-gradient(rgba(255,255,255,.22) 1.4px,transparent 1.6px) 0 0/16px 16px,var(--org)}
.kd-hero.cv-grid{background:linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px) 0 0/24px 24px,linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px) 0 0/24px 24px,var(--org)}
.kd-hero h1{font-family:Fraunces,serif;font-size:clamp(1.5rem,4vw,2.2rem);margin:.1rem 0 .3rem;line-height:1.15;color:inherit}
.kd-eye{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;font-weight:700;opacity:.85;margin:0}.kd-hi{margin:.2rem 0 .7rem;opacity:.95;max-width:46rem}.kd-wel{margin:-.3rem 0 .8rem;padding:.55rem .75rem;border-radius:.7rem;background:rgba(255,255,255,.16);max-width:46rem;font-size:.92rem}
.kd-hero .row{display:flex;flex-wrap:wrap;gap:.45rem}.kd-logo{width:84px;height:84px;object-fit:contain;background:#fff;border-radius:1rem;padding:.45rem;flex:0 0 auto}
.kd-cta{background:#fff!important;color:#14202e!important;border-color:#fff!important;font-weight:700}.kd-ghost{background:rgba(255,255,255,.14)!important;color:inherit!important;border-color:rgba(255,255,255,.35)!important}
.kd-note{display:flex;gap:.5rem;align-items:center;padding:.6rem .8rem;border-radius:.7rem;background:var(--panel);border:1px solid var(--line);font-size:.88rem}
.kd-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.6rem;margin:0 0 1.2rem}
.kd-kpi{border:1px solid var(--line);background:var(--card);border-radius:.9rem;padding:.75rem .85rem;display:grid;grid-template-columns:auto 1fr;column-gap:.6rem;align-items:center}
.kd-kpi .ic{grid-row:span 3;width:38px;height:38px;border-radius:.7rem;display:grid;place-items:center;background:var(--ac-salt);color:var(--ac)}
.kd-kpi b{font-size:1.45rem;line-height:1.1;font-variant-numeric:tabular-nums;color:var(--fg)}.kd-kpi span:not(.ic){font-size:.78rem;color:var(--mut);font-weight:600}.kd-kpi small{font-size:.72rem;color:var(--faint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kd-h{display:flex;align-items:center;gap:.45rem;font-size:1.05rem;margin:1.3rem 0 .6rem}.kd-h small{color:var(--mut);font-weight:600}
.kd-lvs{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:.7rem}
.kd-lv{border:1px solid var(--line);background:var(--card);border-radius:1rem;padding:.9rem 1rem}.kd-lv .h{display:flex;align-items:center;gap:.5rem}.kd-lv .h b{font-size:1rem}.kd-lv .h .lk{margin-left:auto;color:var(--faint)}
.kd-lv.cur{border-color:var(--ac);box-shadow:0 0 0 3px var(--ac-salt)}.kd-lv.locked,.kd-lv.pending{background:var(--panel)}.kd-lv.locked .h b,.kd-lv.locked .m{color:var(--mut)}
.kd-lv .m{font-size:.8rem;color:var(--mut);margin:.45rem 0}.kd-lv .row{display:flex;flex-wrap:wrap;gap:.4rem}.tag{margin-left:auto;font-size:.68rem;font-weight:700;padding:.1rem .5rem;border-radius:1rem;background:var(--ac-salt);color:var(--ac)}
.kd-bar{height:7px;border-radius:9px;background:var(--line2);overflow:hidden;margin:.5rem 0 0}.kd-bar i{display:block;height:100%;background:var(--ac);border-radius:9px}.kd-bar.sm{width:5rem;display:inline-block;margin:0 .4rem 0 0;vertical-align:middle}
.kd-tasks{list-style:none;margin:0;padding:0;display:grid;gap:.4rem}.kd-tasks li{display:flex;gap:.6rem;align-items:center;border:1px solid var(--line);background:var(--card);border-radius:.8rem;padding:.6rem .8rem}
.kd-tasks li>span:nth-child(2){flex:1;min-width:0}.kd-tasks b{display:block}.kd-tasks small{font-size:.78rem}.kd-tasks small a{color:var(--ac)}.kd-tasks .d{font-size:.8rem;color:var(--mut);white-space:nowrap}.kd-tasks li.ok .ic{color:var(--ok)}.kd-tasks li.late .ic,.kd-tasks li.late .d{color:var(--bad)}
.kd-tools{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.6rem}.kd-tools>*{display:grid;gap:.15rem;padding:.8rem .9rem;border:1px solid var(--line);border-radius:.9rem;background:var(--card);text-decoration:none;color:var(--fg)}
.kd-tools>a:hover{border-color:var(--ac)}.kd-tools .lic{color:var(--ac);font-size:1.2rem}.kd-tools small{color:var(--mut);font-size:.76rem}
.kd-card{border:1px solid var(--line);background:var(--card);border-radius:1rem;padding:.9rem 1rem;margin:0 0 .9rem;min-width:0}.kd-card h3{font-size:.95rem;margin:0 0 .6rem;display:flex;gap:.4rem;align-items:center;flex-wrap:wrap}.kd-card h3 small{color:var(--mut);font-weight:500}.kd-card .m{font-size:.84rem;color:var(--mut);margin:0 0 .5rem}
.kd-pend{list-style:none;margin:0;padding:0;display:grid;gap:.4rem}.kd-pend li{display:flex;flex-wrap:wrap;gap:.4rem .6rem;align-items:center;padding:.45rem 0;border-top:1px solid var(--line2)}.kd-pend small{color:var(--mut)}
.kd-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:.7rem}.kd-col{border:1px solid var(--line);background:var(--panel);border-radius:1rem;padding:.6rem;display:grid;gap:.35rem;align-content:start;min-width:0}
.kd-col>.h{display:flex;gap:.45rem;align-items:center;font-weight:700;font-size:.88rem;padding:.2rem .3rem}.kd-col>.h small{margin-left:auto;color:var(--mut)}
.kd-stu{display:flex;align-items:center;gap:.55rem;width:100%;text-align:left;border:1px solid var(--line);background:var(--card);border-radius:.75rem;padding:.5rem .6rem;cursor:pointer;color:var(--fg);font:inherit;min-width:0}
.kd-stu:hover{border-color:var(--ac)}.kd-stu .av{width:30px;height:30px;border-radius:50%;background:var(--ac-salt);color:var(--ac);display:grid;place-items:center;font-weight:700;flex:0 0 auto}
.kd-stu .t{flex:1;min-width:0}.kd-stu .t b{display:block;font-size:.86rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kd-stu .t small{font-size:.72rem;color:var(--mut)}.kd-stu .lvs{display:flex;gap:.2rem;flex-wrap:wrap;justify-content:flex-end}
.kd-stu .sc{font-size:.78rem;font-weight:700;min-width:2.6rem;text-align:right}.kd-stu .sc.pass{color:var(--ok)}.kd-stu .sc.fail{color:var(--bad)}
.kd-want{display:inline-flex;align-items:center;gap:.2rem;font-size:.68rem;font-weight:700;color:var(--bad);padding:.05rem .35rem;border-radius:.4rem;border:1px dashed currentColor}
.kd-empty{display:grid;justify-items:center;gap:.4rem;text-align:center;padding:1.6rem}.kd-empty>.lic{font-size:1.6rem;color:var(--ac)}
.kd-unl{display:grid;gap:.35rem}.kd-unl label{display:flex;gap:.5rem;align-items:center;padding:.4rem .5rem;border:1px solid var(--line);border-radius:.6rem;font-size:.88rem}
.kd-grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:.9rem;align-items:start}
.kd-chart svg{width:100%;height:auto;display:block}.kd-chart .gl{stroke:var(--line2);stroke-width:1}.kd-chart .bl{stroke:var(--line);stroke-width:1}.kd-chart .ax{fill:var(--mut);font-size:11px;font-family:Inter,system-ui,sans-serif}
.kd-chart .bar{fill:var(--ac)}.kd-chart svg:hover .bar{opacity:.55}.kd-chart svg g:hover .bar{opacity:1}
.kd-tbl{margin-top:.4rem;font-size:.78rem;color:var(--mut)}.kd-tbl summary{cursor:pointer}.kd-tbl .ks-t{font-size:.8rem}
.kd-tip{position:absolute;z-index:90;pointer-events:none;background:var(--fg);color:var(--bg);font-size:.76rem;font-weight:600;padding:.25rem .5rem;border-radius:.4rem;white-space:nowrap}
.kd-hb{display:grid;gap:.4rem}.kd-hb .r{display:grid;grid-template-columns:5.5rem 1fr 2.5rem;gap:.5rem;align-items:center;font-size:.82rem}.kd-hb .k{color:var(--mut);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kd-hb .t{height:12px;background:var(--line2);border-radius:4px;overflow:hidden}.kd-hb .t i{display:block;height:100%;background:var(--ac);border-radius:0 4px 4px 0}.kd-hb b{text-align:right;font-variant-numeric:tabular-nums}
.kd-rqs{display:grid;gap:.6rem}.kd-rq .h{display:flex;flex-wrap:wrap;gap:.4rem .6rem;align-items:center}.kd-rq .h .tag{margin-left:0}.kd-rq .h small{color:var(--mut);width:100%}.kd-rq .d{font-size:.84rem;color:var(--mut);margin:.4rem 0}.kd-rq .d p{margin:.35rem 0 0;color:var(--fg)}
.kd-rqlogo{height:48px;max-width:120px;object-fit:contain;border-radius:6px;background:#fff;padding:3px;border:1px solid var(--line);vertical-align:middle}
.kd-about{line-height:1.6;margin:0 0 .6rem}.kd-meta{display:flex;gap:.4rem;align-items:center;color:var(--mut);font-size:.86rem;margin:.3rem 0}
.kd-lvchips{display:flex;flex-wrap:wrap;gap:.4rem .8rem;font-size:.88rem}.kd-mini{display:flex;flex-wrap:wrap;gap:.3rem 1rem;font-size:.8rem;color:var(--mut);margin-top:.8rem}
.kd-tools.static>span{cursor:default}
.kd-course{display:grid;gap:.4rem;margin:.4rem 0 1rem}.kd-course .page{margin:0}.kd-lvtabs{display:flex;flex-wrap:wrap;gap:.3rem}.kd-lvtabs a{display:inline-flex;gap:.25rem;align-items:center;padding:.3rem .7rem;border-radius:999px;border:1px solid var(--line);text-decoration:none;color:var(--mut);font-weight:700;font-size:.82rem}
.kd-lvtabs a.on{background:var(--ac);border-color:var(--ac);color:#fff}.kd-lvtabs a.locked,.kd-lvtabs a.pending{opacity:.65}
.kd-locked{display:flex;gap:.8rem;align-items:center;flex-wrap:wrap;padding:.9rem 1rem;border-radius:1rem;border:1px dashed var(--line);background:var(--panel);margin:0 0 1rem}.kd-locked>.lic{font-size:1.5rem;color:var(--mut)}.kd-locked p{margin:.2rem 0 0;color:var(--mut);font-size:.86rem}.kd-locked>div{flex:1;min-width:12rem}
.kd-cols2{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:1rem}.kd-cols2.dim{opacity:.5;pointer-events:none}
.kd-ch{display:flex;gap:.6rem;align-items:center;padding:.55rem .7rem;border:1px solid var(--line);border-radius:.8rem;background:var(--card);margin:0 0 .4rem;text-decoration:none;color:var(--fg)}.kd-ch:hover{border-color:var(--ac)}
.kd-ch .no{width:28px;height:28px;border-radius:.5rem;display:grid;place-items:center;background:var(--panel);font-weight:700;font-size:.8rem;flex:0 0 auto}.kd-ch.tried .no{background:var(--ac-salt);color:var(--ac)}
.kd-ch .t{flex:1;min-width:0}.kd-ch .t b{display:block;font-size:.9rem}.kd-ch .t small{font-size:.76rem;color:var(--mut)}.kd-ch .s{font-size:.78rem;color:var(--mut);white-space:nowrap;display:flex;gap:.2rem;align-items:center}
.kd-set h3{font-size:1rem}.kd-lvset{display:grid;gap:.4rem}.kd-lvset>div{display:flex;gap:.6rem;align-items:center;padding:.5rem .6rem;border:1px solid var(--line);border-radius:.7rem;flex-wrap:wrap}.kd-lvset .t{flex:1;font-weight:600;font-size:.9rem;min-width:8rem}.kd-lvset small{display:block;font-weight:500;color:var(--mut);font-size:.76rem}.kd-lvset .locked{background:var(--panel)}
@media(max-width:560px){.kd-hero{flex-direction:column;align-items:flex-start;padding:1.2rem 1rem}.kd-logo{width:64px;height:64px}.ks-2{grid-template-columns:1fr}.kd-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.kd-kpi b{font-size:1.2rem}}`;
document.head.appendChild(st);

/* ---------- start ---------- */
window.KONTO = { level, lang, passMark, canOpen, lvState, unlock, lockSheet, unlocked: unlockedSet, profile: () => P, org: () => ORG, view, routes: ROUTES, fillMe, saveLevel, askLevel,
  signupFields, signupCheck, signupData, request, reqFields, sendRequest, join, decide, inviteSheet, makeSiteInvite, delSiteInvite, codeSheet,
  saveOrg, dropLogo, orgPass, addClass, classPass, invite, delInvite, moveMember, removeMember, addTask, delTask, copy, reload, refresh, liveClassSheet, saveLiveClass, sendClassInvite, sendClassInviteNow, inviteLearner, previewInvite, loadOwnerUsers, deleteAccountSheet, deleteAccount, decideLiveRequest, applyLiveClass,
  student, unlockFor, saveSettings, setCourse, unenroll, leave, T, can, gate, featureOf, saveSite, lookup, signupAs, checkInvitationMail, previewWelcome: () => { location.hash = '#/start/besucher'; } };
window.addEventListener('acct:in', e => { reload().then(() => {
  if(e.detail&&e.detail.fresh&&/^#?\/?$/.test(location.hash))location.hash='#/start';
  const pending=pendingInvite;pendingInvite=null;
  if(pending&&pending.account===me()?.id&&D.classes.some(c=>c.id===pending.id)){
    sendClassInvite(pending.id);classInviteDraft=pending.draft;
    if($('ci_name'))$('ci_name').value=pending.name;if($('ci_email'))$('ci_email').value=pending.to;if($('ci_note'))$('ci_note').value=pending.note;
  }
}); });
window.addEventListener('acct:out', () => { profileRequest++; loading=null; OFF=false; P = null; ORG = null; mine = { orgs: [], staff: [] }; apply(); if (/^#?\/?$/.test(location.hash)) location.hash = '#/start'; });
// invitation links: …/?join=CODE (school or teacher) and …/?invite=CODE (from the site owner)
const sp = new URLSearchParams(location.search), jc = sp.get('join'), ic = sp.get('invite');
if (jc || ic) { history.replaceState(null, '', location.pathname + location.hash); setTimeout(() => openInvite(jc ? 'join' : 'invite', jc || ic), 500); }
loadSite();
if (!location.hash) location.replace('#/start');
if (me()) reload(); else apply();
})();
