/* Wörterbuch – roles, levels, schools/teachers, classes, assignments (needs accounts_setup.sql in Supabase).
   If the tables are not set up yet, everything here stays quietly switched off and the site works as before. */
(function () {
'use strict';
const LV = ['A1', 'A2', 'B1', 'B2', 'C1'];
const ROLE = { learner: 'Lernende/r', teacher: 'Lehrkraft', school: 'Sprachschule', founder: 'Gründer/in' };
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LSg = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const LSs = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const toastM = m => (window.toast ? toast(m) : alert(m));
const icn = n => `<i data-lucide="${n}" class="lic"></i>`;
const icons = () => { try { window.lucide && lucide.createIcons(); } catch (e) {} };
const V = () => $('view');

let P = null, ORG = null, OFF = false, loading = null, mine = { orgs: [], staff: [] };

/* ---------- backend ---------- */
const A = () => window.ACCT;
const me = () => A() && A().user && A().user();
async function q(path, opt = {}) { return A().api(path, Object.assign({}, opt, { token: await A().token() })); }
const rpc = (name, body = {}) => q('/rest/v1/rpc/' + name, { method: 'POST', body });
const notInstalled = e => /PGRST20[25]|42P01|42883/.test(String(e && e.code)) || (e && e.status === 404);
function err(e) { return notInstalled(e) ? 'Diese Funktion ist noch nicht eingerichtet.' : (e && e.message) || String(e); }

async function load() {
  const u = me();
  if (!u) { P = null; ORG = null; apply(); return; }
  if (OFF) return;
  try {
    let rows = await q('/rest/v1/profiles?select=*&user_id=eq.' + u.id);
    P = rows && rows[0];
    const su = LSg('gd_signup', null), fresh = su && su.email && u.email && su.email.toLowerCase() === u.email.toLowerCase();
    if (!P) {
      const body = { user_id: u.id };
      if (fresh) { if (LV.includes(su.level)) body.level = su.level; if (su.role === 'teacher' || su.role === 'school') body.requested_role = su.role; if (su.name) body.display_name = su.name; }
      await q('/rest/v1/profiles', { method: 'POST', headers: { Prefer: 'return=minimal' }, body });
      rows = await q('/rest/v1/profiles?select=*&user_id=eq.' + u.id); P = rows && rows[0];
    }
    if (fresh) LSs('gd_signup', null);
    ORG = null;
    if (P && P.org_id) { try { ORG = await rpc('my_org'); } catch (e) {} }
    if (P && P.role !== 'learner') {
      try {
        mine.orgs = await q('/rest/v1/orgs?select=*&owner=eq.' + u.id) || [];
        const ms = await q('/rest/v1/org_members?select=org_id,member_role&member_role=eq.teacher&user_id=eq.' + u.id) || [];
        mine.staff = ms.map(m => m.org_id);
      } catch (e) {}
    }
    const code = LSg('gd_join', null);
    if (code) { LSs('gd_join', null); await join(code, true); return; }
  } catch (e) { if (notInstalled(e)) { OFF = true; P = null; } else console.warn('konto', e); }
  apply();
}
function reload() { loading = load(); return loading; }

/* ---------- applying the profile to the site ---------- */
const level = () => (P && P.role === 'learner' && LV.includes(P.level) ? P.level : null);
function passMark() { const c = ORG && ORG.class; return (c && c.pass_mark) || (ORG && ORG.pass_mark) || 70; }
function lang() {
  if (P && P.ui_lang && P.ui_lang !== 'auto') return P.ui_lang;
  const L = level(); return L === 'A1' || L === 'A2' ? 'en' : 'de';
}
const NAV = { home: ['Suche', 'Search'], cats: ['Themen', 'Topics'], lists: ['Listen', 'Lists'], decks: ['Karten', 'Cards'], wort: ['Wortschatz', 'Vocabulary'], gram: ['Grammatik', 'Grammar'], play: ['Spiele', 'Games'] };
function applyLang() {
  const en = lang() === 'en';
  document.documentElement.dataset.ui = en ? 'en' : 'de';
  document.querySelectorAll('#tabs a[data-t]').forEach(a => { const t = NAV[a.dataset.t]; if (!t) return; const s = a.querySelector('span'); if (s) s.textContent = t[en ? 1 : 0]; a.title = t[en ? 1 : 0]; });
}
function applyBrand() {
  const root = document.documentElement, b = document.querySelector('header .brand');
  let el = $('orgbrand');
  if (ORG && ORG.name) {
    if (!el && b) { el = document.createElement('span'); el.id = 'orgbrand'; b.after(el); }
    if (el) el.innerHTML = `${ORG.logo_url ? `<img src="${esc(ORG.logo_url)}" alt="" referrerpolicy="no-referrer">` : icn(ORG.kind === 'school' ? 'school' : 'graduation-cap')}<span>${esc(ORG.name)}</span>`;
    if (ORG.theme && /^#[0-9a-f]{6}$/i.test(ORG.theme)) root.style.setProperty('--ac', ORG.theme); else root.style.removeProperty('--ac');
  } else { if (el) el.remove(); root.style.removeProperty('--ac'); }
  icons();
}
function apply() {
  applyLang(); applyBrand();
  if (window.GRAM) { GRAM.setPass(passMark()); GRAM.refresh(); }
  const h = location.hash.slice(2).split('/')[0];
  if (['klasse', 'admin', 'aufgaben'].includes(h)) view(h, decodeURIComponent(location.hash.split('/').slice(2).join('/')));
  // existing learner without a level: ask once
  const u = me();
  if (P && u && P.role === 'learner' && !P.level && !P.org_id && !LSg('gd_lvask_' + u.id, 0)) { LSs('gd_lvask_' + u.id, 1); setTimeout(askLevel, 800); }
}

/* ---------- small forms ---------- */
const lvOpts = (sel, none = 'Kein Niveau – alles frei') => `<option value="">${none}</option>` + LV.map(l => `<option value="${l}"${sel === l ? ' selected' : ''}>${l}${l === 'B2' || l === 'C1' ? ' (Inhalte folgen)' : ''}</option>`).join('');
function askLevel() {
  if (!window.openSheet) return;
  openSheet(`<h3>Auf welchem Niveau lernst du?</h3><p>Dann zeigen wir dir Wortschatz und Grammatik bis zu deinem Niveau, und Spiele mit passenden Fragen. Das Wörterbuch ist immer frei. Du kannst das jederzeit im Konto ändern.</p>
    <select class="input" id="kv_lv" style="width:100%">${lvOpts('')}</select>
    <div class="row" style="margin-top:1rem"><span class="spacer"></span><button class="btn" onclick="closeSheet()">Später</button><button class="btn primary" onclick="KONTO.saveLevel()">Speichern</button></div>`);
}
async function saveProfile(body, ok) {
  try { await q('/rest/v1/profiles?user_id=eq.' + me().id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body }); Object.assign(P, body); apply(); if (ok) toastM(ok); return true; }
  catch (e) { toastM(/level is set/i.test(String(e.message)) ? 'Dein Niveau legt deine Lehrkraft fest.' : err(e)); return false; }
}
async function saveLevel() { const v = ($('kv_lv') || {}).value || null; if (await saveProfile({ level: v }, 'Gespeichert')) window.closeSheet && closeSheet(); }

function signupFields() {
  const f = document.querySelector('.acct-f'); if (!f || $('ks_role')) return;
  const m = f.querySelector('.acct-msg');
  const box = document.createElement('div'); box.className = 'ks-box';
  box.innerHTML = `<label class="ks-l">Ich bin …<select class="input" id="ks_role"><option value="learner">Lernende/r</option><option value="teacher">Lehrkraft</option><option value="school">Sprachschule / Organisation</option></select></label>
    <label class="ks-l" id="ks_lvl">Mein Niveau<select class="input" id="ks_level">${lvOpts('', 'Noch nicht sicher – alles frei')}</select></label>
    <p class="ks-n" id="ks_note" hidden>Konten für Lehrkräfte und Schulen werden von uns geprüft und dann freigeschaltet. Bis dahin kannst du alles als Lernende/r nutzen.</p>`;
  f.insertBefore(box, m);
  $('ks_role').onchange = e => { const t = e.target.value !== 'learner'; $('ks_note').hidden = !t; $('ks_lvl').hidden = t; };
}
function rememberSignup(email) {
  const r = $('ks_role'), l = $('ks_level');
  LSs('gd_signup', { email, role: r ? r.value : 'learner', level: l && r && r.value === 'learner' ? l.value : '' });
}

/* ---------- account sheet ---------- */
function fillMe() {
  const box = $('acct_prof'); if (!box) return;
  if (OFF || !me()) { box.innerHTML = ''; return; }
  if (!P) { box.innerHTML = '<p class="muted" style="font-size:.82rem">Profil wird geladen …</p>'; (loading || reload()).then(fillMe); return; }
  const locked = !!P.org_id && P.role === 'learner', staff = P.role !== 'learner';
  box.innerHTML = `<div class="ks-card">
    <div class="ks-row"><span>Rolle</span><b>${ROLE[P.role] || P.role}</b>${P.requested_role ? ` <small class="ks-pend">${ROLE[P.requested_role]} angefragt</small>` : ''}</div>
    ${ORG && ORG.name ? `<div class="ks-row"><span>${ORG.kind === 'school' ? 'Schule' : 'Lehrkraft'}</span><b>${esc(ORG.name)}</b>${ORG.class ? ` <small>· Klasse ${esc(ORG.class.name)}</small>` : ''}</div>` : ''}
    <label class="ks-row"><span>Name</span><input class="input" id="kp_name" maxlength="60" placeholder="Wie sollen Lehrkräfte dich sehen?" value="${esc(P.display_name || '')}"></label>
    ${staff ? '' : `<label class="ks-row"><span>Niveau</span><select class="input" id="kp_level"${locked ? ' disabled title="Das Niveau legt deine Lehrkraft fest."' : ''}>${lvOpts(P.level)}</select></label>`}
    <label class="ks-row"><span>Menüs</span><select class="input" id="kp_lang"><option value="auto"${P.ui_lang === 'auto' ? ' selected' : ''}>Automatisch (A1/A2 Englisch)</option><option value="de"${P.ui_lang === 'de' ? ' selected' : ''}>Deutsch</option><option value="en"${P.ui_lang === 'en' ? ' selected' : ''}>English</option></select></label>
    <div class="row" style="margin:.4rem 0 0"><span class="spacer"></span><button class="btn sm primary" onclick="KONTO.saveMe()">Profil speichern</button></div>
    <div class="ks-sep"></div>
    <div class="ks-row"><span>Code</span><input class="input" id="kp_code" placeholder="Einladungscode von Schule oder Lehrkraft" autocomplete="off"><button class="btn sm" onclick="KONTO.join(document.getElementById('kp_code').value)">Einlösen</button></div>
    <div class="ks-links">${P.org_id && P.role === 'learner' ? `<a class="btn sm" href="#/aufgaben" onclick="closeSheet()">${icn('clipboard-list')} Meine Aufgaben</a>` : ''}
      ${staff ? `<a class="btn sm" href="#/klasse" onclick="closeSheet()">${icn('users')} Klassen verwalten</a>` : ''}
      ${P.role === 'founder' ? `<a class="btn sm" href="#/admin" onclick="closeSheet()">${icn('shield-check')} Freigaben</a>` : ''}
      ${P.role === 'learner' && !P.requested_role ? `<button class="btn sm" onclick="KONTO.request()">${icn('graduation-cap')} Ich bin Lehrkraft / Schule</button>` : ''}</div></div>`;
  icons();
}
async function saveMe() {
  const body = { display_name: ($('kp_name').value || '').trim() || null, ui_lang: $('kp_lang').value };
  const lv = $('kp_level'); if (lv && !lv.disabled) body.level = lv.value || null;
  if (await saveProfile(body, 'Profil gespeichert')) fillMe();
}
function request() {
  openSheet(`<h3>Konto für Lehrkräfte und Schulen</h3><p>Mit einem Lehrkraft- oder Schulkonto kannst du Klassen anlegen, Lernende einladen, Aufgaben mit Abgabetermin stellen und die Bestehensgrenze selbst festlegen. Wir prüfen die Anfrage und schalten das Konto frei.</p>
    <select class="input" id="kr_role" style="width:100%"><option value="teacher">Ich bin Lehrkraft</option><option value="school">Wir sind eine Sprachschule / Organisation</option></select>
    <div class="row" style="margin-top:1rem"><span class="spacer"></span><button class="btn" onclick="closeSheet()">Abbrechen</button><button class="btn primary" onclick="KONTO.sendRequest()">Anfrage senden</button></div>`);
}
async function sendRequest() { if (await saveProfile({ requested_role: $('kr_role').value }, 'Anfrage gesendet – wir melden uns.')) closeSheet(); }

async function join(code, quiet) {
  code = String(code || '').trim().toLowerCase().replace(/[^0-9a-f]/g, '');
  if (!code) return;
  if (!me()) { LSs('gd_join', code); toastM('Bitte melde dich an oder registriere dich – dann wirst du automatisch hinzugefügt.'); A() && A().sheet && A().sheet('up'); return; }
  try {
    const r = await rpc('join_with_code', { p_code: code });
    toastM(`Willkommen bei ${r.org}${r.level ? ' · Niveau ' + r.level : ''}!`);
    window.closeSheet && closeSheet();
    await reload();
  } catch (e) { toastM(/invalid code/i.test(String(e.message)) ? 'Dieser Code ist ungültig oder abgelaufen.' : err(e)); if (quiet) apply(); }
}

/* ---------- pages ---------- */
const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
const dt = d => (d ? new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–');
function page(title, body) { V().innerHTML = `<div class="ks-page"><h1 class="page">${title}</h1>${body}</div>`; icons(); }
function need(msg) { page('Bitte anmelden', `<p class="sub">${msg}</p><p><button class="btn primary" onclick="ACCT.sheet('in')">Anmelden</button></p>`); }
const chTitle = n => { const c = window.GRAM && GRAM.list && GRAM.list().find(x => x.n === n); return c ? c.title : (n > 200 ? 'Thema ' + n : 'Kapitel ' + n); };
const chHash = n => (n > 200 ? '#/v/' : '#/g/') + n;
async function ensureGram() { if (!window.GRAM && window.loadGram) { try { await loadGram(); } catch (e) {} } }

/* best result per (user, chapter, exercise) → passed? */
function bestMap(rows) { const b = {}; for (const r of rows) { const k = r.user_id + '|' + r.chapter + '|' + r.exercise, s = r.score / r.total; if (!(k in b) || s > b[k]) b[k] = s; } return b; }

async function viewTasks() {
  if (!me()) return need('Melde dich an, um deine Aufgaben zu sehen.');
  await (loading || reload()); await ensureGram();
  if (OFF) return page('Meine Aufgaben', '<p class="sub">Diese Funktion ist noch nicht eingerichtet.</p>');
  let as = [], res = [];
  try { as = await q('/rest/v1/assignments?select=*&order=due_at.asc.nullslast') || []; res = await q('/rest/v1/grammar_results?select=user_id,chapter,exercise,score,total&user_id=eq.' + me().id + '&limit=5000') || []; }
  catch (e) { return page('Meine Aufgaben', `<p class="sub">${esc(err(e))}</p>`); }
  const b = bestMap(res), pm = passMark();
  const rows = as.map(a => {
    const items = a.items || [], need = a.pass_mark || pm, now = Date.now(), due = a.due_at ? new Date(a.due_at).getTime() : null;
    const done = items.filter(it => { const ks = Object.keys(b).filter(k => k.startsWith(me().id + '|' + it.ch + '|') && (!it.ex || k.endsWith('|' + it.ex))); return ks.length && ks.some(k => b[k] * 100 >= need); }).length;
    const ok = items.length && done === items.length, late = !ok && due && due < now;
    return `<tr><td><b>${esc(a.title)}</b><div class="ks-it">${items.map(it => `<a href="${chHash(it.ch)}${it.ex ? '/ue-' + esc(it.ex) : ''}">${esc(chTitle(it.ch))}${it.ex ? ' · ' + esc(it.ex) : ''}</a>`).join(' · ')}</div></td>
      <td>${dt(a.due_at)}</td><td>${need} %</td><td>${ok ? `<span class="gr-ueb pass">${icn('check')} erledigt</span>` : late ? '<span class="gr-ueb fail">überfällig</span>' : `${done}/${items.length}`}</td></tr>`;
  }).join('');
  page('Meine Aufgaben', `<p class="sub">Aufgaben von ${esc(ORG && ORG.name || 'deiner Lehrkraft')}. Bestanden ab ${pm} % (wenn bei der Aufgabe nichts anderes steht).</p>
    ${rows ? `<div class="ks-tw"><table class="ks-t"><tr><th>Aufgabe</th><th>Bis</th><th>Bestanden ab</th><th>Stand</th></tr>${rows}</table></div>` : '<p class="sub">Im Moment hast du keine Aufgaben.</p>'}`);
}

async function viewAdmin() {
  if (!me()) return need('Nur für die Gründerin / den Gründer.');
  await (loading || reload());
  if (!P || P.role !== 'founder') return page('Freigaben', '<p class="sub">Diese Seite ist nur für die Gründerin / den Gründer.</p>');
  let rs = [];
  try { rs = await rpc('pending_requests') || []; } catch (e) { return page('Freigaben', `<p class="sub">${esc(err(e))}</p>`); }
  page('Freigaben', `<p class="sub">Anfragen für Lehrkraft- und Schulkonten.</p>${rs.length ? `<div class="ks-tw"><table class="ks-t"><tr><th>E-Mail</th><th>Name</th><th>Möchte</th><th>Seit</th><th></th></tr>${rs.map(r => `<tr><td>${esc(r.email)}</td><td>${esc(r.display_name || '–')}</td><td>${ROLE[r.requested_role]}</td><td>${dt(r.created_at)}</td>
    <td class="ks-act"><button class="btn sm primary" onclick="KONTO.decide('${r.user_id}',true)">Freischalten</button><button class="btn sm" onclick="KONTO.decide('${r.user_id}',false)">Ablehnen</button></td></tr>`).join('')}</table></div>` : '<p class="sub">Keine offenen Anfragen.</p>'}`);
}
async function decide(id, ok) { try { await rpc('decide_request', { p_user: id, p_ok: ok }); toastM(ok ? 'Freigeschaltet' : 'Abgelehnt'); viewAdmin(); } catch (e) { toastM(err(e)); } }

/* ----- staff dashboard ----- */
let D = { org: null, classes: [], members: [], profiles: {}, invites: [], tasks: [], res: [] };
async function viewClasses(arg) {
  if (!me()) return need('Melde dich an, um deine Klassen zu verwalten.');
  await (loading || reload()); await ensureGram();
  if (OFF) return page('Klassen', '<p class="sub">Diese Funktion ist noch nicht eingerichtet (Datenbank).</p>');
  if (!P || P.role === 'learner') return page('Klassen', `<p class="sub">Klassen können Lehrkräfte und Schulen verwalten.${P && P.requested_role ? ' Deine Anfrage wird geprüft.' : ''}</p>${P && !P.requested_role ? `<p><button class="btn primary" onclick="KONTO.request()">Konto für Lehrkräfte / Schulen anfragen</button></p>` : ''}`);
  const orgs = [...mine.orgs];
  if (mine.staff.length) { try { (await q('/rest/v1/orgs?select=*&id=in.(' + mine.staff.join(',') + ')') || []).forEach(o => { if (!orgs.some(x => x.id === o.id)) orgs.push(o); }); } catch (e) {} }
  if (!orgs.length) {
    const kind = P.role === 'school' ? 'school' : 'teacher';
    return page(kind === 'school' ? 'Ihre Schule einrichten' : 'Ihren Unterricht einrichten', `<p class="sub">${kind === 'school' ? 'Name und optional Logo und Farbe – Ihre Lernenden sehen dann Ihre Marke auf der Seite.' : 'Ihr Name erscheint bei Ihren Lernenden. Danach legen Sie Klassen an und laden ein.'}</p>
      <div class="ks-card ks-form"><label>Name<input class="input" id="ko_name" maxlength="80" value="${esc(P.display_name || '')}"></label>
      <label>Logo (Link, https://…, optional)<input class="input" id="ko_logo" placeholder="https://…/logo.png"></label>
      <label>Farbe (optional)<input class="input" id="ko_theme" type="color" value="#1f6feb"></label>
      <label>Bestehensgrenze<input class="input" id="ko_pass" type="number" min="1" max="100" value="70"> %</label>
      <div class="row"><span class="spacer"></span><button class="btn primary" onclick="KONTO.createOrg('${kind}')">Anlegen</button></div></div>`);
  }
  const org = orgs.find(o => o.id === arg) || orgs[0]; D.org = org; const owner = org.owner === me().id;
  try {
    D.classes = await q('/rest/v1/classes?select=*&org_id=eq.' + org.id + '&order=created_at') || [];
    D.members = await q('/rest/v1/org_members?select=*&org_id=eq.' + org.id) || [];
    D.invites = await q('/rest/v1/invites?select=*&org_id=eq.' + org.id + '&order=expires_at.desc') || [];
    const ids = D.members.map(m => m.user_id);
    D.profiles = {}; D.res = [];
    if (ids.length) {
      (await q('/rest/v1/profiles?select=user_id,display_name,level&user_id=in.(' + ids.join(',') + ')') || []).forEach(p => { D.profiles[p.user_id] = p; });
      D.res = await q('/rest/v1/grammar_results?select=user_id,chapter,exercise,score,total&user_id=in.(' + ids.join(',') + ')&limit=20000') || [];
    }
    D.tasks = D.classes.length ? await q('/rest/v1/assignments?select=*&class_id=in.(' + D.classes.map(c => c.id).join(',') + ')&order=due_at.asc.nullslast') || [] : [];
  } catch (e) { return page('Klassen', `<p class="sub">${esc(err(e))}</p>`); }
  const best = bestMap(D.res), name = id => esc((D.profiles[id] && D.profiles[id].display_name) || 'ohne Namen');
  const link = c => location.origin + location.pathname + '?join=' + c;
  const invRow = i => `<li><code>${esc(i.code)}</code> · ${i.member_role === 'teacher' ? 'Lehrkraft' : 'Lernende'}${i.level ? ' · ' + i.level : ''} · noch ${i.uses_left}× · bis ${dt(i.expires_at)}
    <button class="btn sm" onclick="KONTO.copy('${link(i.code)}')">${icn('copy')} Link kopieren</button><button class="btn sm" onclick="KONTO.delInvite('${i.code}')">${icn('trash-2')}</button></li>`;
  const grade = (uid, cls) => {
    const L = cls.level, pm = cls.pass_mark || org.pass_mark || 70;
    let tried = 0, passed = 0, sum = 0;
    Object.keys(best).filter(k => k.startsWith(uid + '|')).forEach(k => { const ch = +k.split('|')[1]; if (window.GRAM && GRAM.chLevel(ch) !== L) return; tried++; sum += best[k]; if (best[k] * 100 >= pm) passed++; });
    return { tried, passed, avg: tried ? Math.round(sum / tried * 100) : 0, pm };
  };
  const classCard = c => {
    const ms = D.members.filter(m => m.class_id === c.id && m.member_role === 'student'), ts = D.tasks.filter(t => t.class_id === c.id);
    return `<details class="ks-card ks-cls" open><summary><b>${esc(c.name)}</b> <span class="gr-lv ${c.level}">${c.level}</span> <small>${ms.length} Lernende · bestanden ab ${c.pass_mark || org.pass_mark} %</small></summary>
      <div class="ks-row"><span>Bestehensgrenze</span><input class="input" type="number" min="1" max="100" id="kc_pm_${c.id}" value="${c.pass_mark || ''}" placeholder="${org.pass_mark} (${org.kind === 'school' ? 'Schule' : 'Standard'})" style="width:7rem"> %<button class="btn sm" onclick="KONTO.classPass('${c.id}')">Speichern</button></div>
      <div class="ks-row"><span>Einladen</span><button class="btn sm primary" onclick="KONTO.invite('student','${c.id}','${c.level}')">${icn('link')} Einladungslink für diese Klasse</button></div>
      <ul class="ks-inv">${D.invites.filter(i => i.class_id === c.id).map(invRow).join('')}</ul>
      <h4 class="ks-h">Lernende · Ergebnisse auf Niveau ${c.level}</h4>
      ${ms.length ? `<div class="ks-tw"><table class="ks-t"><tr><th>Name</th><th>Niveau</th><th>Übungen bestanden</th><th>Durchschnitt</th><th></th></tr>${ms.map(m => { const g = grade(m.user_id, c), p = D.profiles[m.user_id] || {};
        return `<tr><td>${name(m.user_id)}</td><td><select class="input ks-sl" onchange="KONTO.setLevel('${m.user_id}',this.value)">${LV.map(l => `<option${p.level === l ? ' selected' : ''}>${l}</option>`).join('')}</select></td>
          <td>${g.passed}/${g.tried}</td><td>${g.tried ? `<span class="gr-ueb ${g.avg >= g.pm ? 'pass' : 'fail'}">${g.avg} %</span>` : '–'}</td><td><button class="btn sm" title="Aus der Schule entfernen" onclick="KONTO.removeMember('${m.user_id}')">${icn('user-x')}</button></td></tr>`; }).join('')}</table></div>` : '<p class="sub">Noch niemand in dieser Klasse. Teilen Sie den Einladungslink.</p>'}
      <h4 class="ks-h">Aufgaben</h4>
      ${ts.length ? `<div class="ks-tw"><table class="ks-t"><tr><th>Aufgabe</th><th>Bis</th><th>Bestanden ab</th><th>Erledigt</th><th></th></tr>${ts.map(t => { const need = t.pass_mark || c.pass_mark || org.pass_mark || 70, its = t.items || [];
        const doneBy = ms.filter(m => its.length && its.every(it => Object.keys(best).some(k => k.startsWith(m.user_id + '|' + it.ch + '|') && (!it.ex || k.endsWith('|' + it.ex)) && best[k] * 100 >= need))).length;
        return `<tr><td><b>${esc(t.title)}</b><div class="ks-it">${its.map(it => esc(chTitle(it.ch))).join(' · ')}</div></td><td>${dt(t.due_at)}</td><td>${need} %</td><td>${doneBy}/${ms.length}</td><td><button class="btn sm" onclick="KONTO.delTask('${t.id}')">${icn('trash-2')}</button></td></tr>`; }).join('')}</table></div>` : ''}
      <div class="ks-form ks-new"><b>Neue Aufgabe</b><label>Titel<input class="input" id="kt_t_${c.id}" maxlength="100" placeholder="z. B. Wortschatz Thema 3 bis Freitag"></label>
        <label>Kapitel / Themen (Mehrfachauswahl mit Strg / ⌘)<select class="input" id="kt_ch_${c.id}" multiple size="6">${(window.GRAM ? GRAM.list() : []).filter(x => !x.level || x.level === c.level || x.level === 'Liste' || LV.indexOf(x.level) <= LV.indexOf(c.level)).map(x => `<option value="${x.n}">${x.n > 200 ? 'Wortschatz' : 'Grammatik'} ${x.level} · ${esc(x.title)}</option>`).join('')}</select></label>
        <label>Abgabe bis<input class="input" type="date" id="kt_d_${c.id}"></label><label>Bestanden ab (optional)<input class="input" type="number" min="1" max="100" id="kt_p_${c.id}" placeholder="${c.pass_mark || org.pass_mark}"> %</label>
        <div class="row"><span class="spacer"></span><button class="btn sm primary" onclick="KONTO.addTask('${c.id}')">Aufgabe stellen</button></div></div>
      <p class="ks-tip">${icn('gamepad-2')} Quiz im Unterricht: Öffnen Sie <a href="#/play">Spiele</a> am Beamer und wählen Sie ein Kapitel – alle spielen gemeinsam.</p></details>`;
  };
  const free = D.members.filter(m => m.member_role === 'student' && !m.class_id), teachers = D.members.filter(m => m.member_role === 'teacher');
  page(esc(org.name), `${orgs.length > 1 ? `<p>${orgs.map(o => `<a class="btn sm${o.id === org.id ? ' primary' : ''}" href="#/klasse/${o.id}">${esc(o.name)}</a>`).join(' ')}</p>` : ''}
    ${owner ? `<details class="ks-card"><summary><b>Einstellungen</b> <small>${org.kind === 'school' ? 'Schule' : 'Lehrkraft'} · bestanden ab ${org.pass_mark} %</small></summary><div class="ks-form">
      <label>Name<input class="input" id="ko_name" maxlength="80" value="${esc(org.name)}"></label><label>Logo (https://…)<input class="input" id="ko_logo" value="${esc(org.logo_url || '')}"></label>
      <label>Farbe<input class="input" id="ko_theme" type="color" value="${esc(org.theme || '#1f6feb')}"></label><label>Bestehensgrenze für alle Klassen<input class="input" id="ko_pass" type="number" min="1" max="100" value="${org.pass_mark}"> %</label>
      <div class="row"><span class="spacer"></span><button class="btn sm primary" onclick="KONTO.saveOrg('${org.id}')">Speichern</button></div></div></details>` : ''}
    ${owner && org.kind === 'school' ? `<div class="ks-card"><b>Lehrkräfte</b> <small>${teachers.length}</small><ul class="ks-inv">${teachers.map(t => `<li>${name(t.user_id)} <button class="btn sm" onclick="KONTO.removeMember('${t.user_id}')">${icn('user-x')}</button></li>`).join('')}${D.invites.filter(i => i.member_role === 'teacher').map(invRow).join('')}</ul>
      <button class="btn sm" onclick="KONTO.invite('teacher','','')">${icn('link')} Einladungslink für Lehrkräfte</button></div>` : ''}
    ${D.classes.map(classCard).join('')}
    ${free.length ? `<div class="ks-card"><b>Ohne Klasse</b><ul class="ks-inv">${free.map(m => `<li>${name(m.user_id)} <select class="input ks-sl" onchange="KONTO.moveMember('${m.user_id}',this.value)"><option value="">Klasse wählen …</option>${D.classes.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></li>`).join('')}</ul></div>` : ''}
    <div class="ks-card ks-form"><b>Neue Klasse</b><label>Name<input class="input" id="kc_name" maxlength="60" placeholder="z. B. Abendkurs B1"></label><label>Niveau<select class="input" id="kc_level">${LV.map(l => `<option>${l}</option>`).join('')}</select></label>
      <label>Bestehensgrenze (optional)<input class="input" id="kc_pass" type="number" min="1" max="100" placeholder="${org.pass_mark}"> %</label><div class="row"><span class="spacer"></span><button class="btn sm primary" onclick="KONTO.addClass()">Klasse anlegen</button></div></div>`);
}
const refresh = () => viewClasses(D.org && D.org.id);
const num = id => { const v = parseInt(($(id) || {}).value, 10); return v >= 1 && v <= 100 ? v : null; };
async function act(fn, ok) { try { await fn(); if (ok) toastM(ok); } catch (e) { toastM(err(e)); } }
const createOrg = kind => act(async () => {
  const name = $('ko_name').value.trim(), logo = $('ko_logo').value.trim();
  if (name.length < 2) throw new Error('Bitte einen Namen eingeben.');
  if (logo && !/^https:\/\//.test(logo)) throw new Error('Das Logo muss ein https-Link sein.');
  await q('/rest/v1/orgs', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { kind, name, logo_url: logo || null, theme: $('ko_theme').value, pass_mark: num('ko_pass') || 70 } });
  await reload(); viewClasses();
}, 'Angelegt');
const saveOrg = id => act(async () => {
  const logo = $('ko_logo').value.trim(); if (logo && !/^https:\/\//.test(logo)) throw new Error('Das Logo muss ein https-Link sein.');
  await q('/rest/v1/orgs?id=eq.' + id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { name: $('ko_name').value.trim(), logo_url: logo || null, theme: $('ko_theme').value, pass_mark: num('ko_pass') || 70 } });
  await reload(); refresh();
}, 'Gespeichert');
const addClass = () => act(async () => {
  const name = $('kc_name').value.trim(); if (!name) throw new Error('Bitte einen Namen eingeben.');
  await q('/rest/v1/classes', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { org_id: D.org.id, name, level: $('kc_level').value, pass_mark: num('kc_pass'), teacher_id: me().id } });
  refresh();
}, 'Klasse angelegt');
const classPass = id => act(async () => { await q('/rest/v1/classes?id=eq.' + id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { pass_mark: num('kc_pm_' + id) } }); refresh(); }, 'Gespeichert');
const invite = (role, cls, lv) => act(async () => {
  await q('/rest/v1/invites', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { org_id: D.org.id, class_id: cls || null, member_role: role, level: role === 'student' ? lv : null } });
  refresh();
}, 'Einladungslink erstellt');
const delInvite = code => act(async () => { await q('/rest/v1/invites?code=eq.' + code, { method: 'DELETE' }); refresh(); });
const setLevel = (u, l) => act(async () => { await rpc('set_student_level', { p_user: u, p_level: l }); }, 'Niveau geändert');
const moveMember = (u, c) => act(async () => { if (!c) return; await q('/rest/v1/org_members?org_id=eq.' + D.org.id + '&user_id=eq.' + u, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { class_id: c } }); refresh(); }, 'Verschoben');
const removeMember = u => { if (!confirm('Diese Person aus der Schule entfernen?')) return; act(async () => { await q('/rest/v1/org_members?org_id=eq.' + D.org.id + '&user_id=eq.' + u, { method: 'DELETE' }); refresh(); }, 'Entfernt'); };
const addTask = c => act(async () => {
  const title = $('kt_t_' + c).value.trim(), sel = [...$('kt_ch_' + c).selectedOptions].map(o => ({ ch: +o.value, ex: null })), d = $('kt_d_' + c).value;
  if (!title || !sel.length) throw new Error('Bitte Titel und mindestens ein Kapitel wählen.');
  await q('/rest/v1/assignments', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { class_id: c, title, items: sel, due_at: d ? new Date(d + 'T23:59:00').toISOString() : null, pass_mark: num('kt_p_' + c) } });
  refresh();
}, 'Aufgabe gestellt');
const delTask = id => { if (!confirm('Aufgabe löschen?')) return; act(async () => { await q('/rest/v1/assignments?id=eq.' + id, { method: 'DELETE' }); refresh(); }); };
function copy(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toastM('Link kopiert'), () => prompt('Link kopieren:', t)); }

function view(p, arg) {
  document.querySelectorAll('#tabs a').forEach(a => a.classList.remove('on'));
  if (p === 'aufgaben') return viewTasks();
  if (p === 'admin') return viewAdmin();
  return viewClasses(arg);
}

/* ---------- styles ---------- */
const st = document.createElement('style');
st.textContent = `#orgbrand{display:flex;align-items:center;gap:.4rem;font-weight:700;font-size:.85rem;color:var(--ac);margin-left:.4rem;max-width:9rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
#orgbrand img{height:26px;width:auto;max-width:60px;border-radius:4px}
@media(max-width:700px){#orgbrand span{display:none}}
.ks-box{display:grid;gap:.5rem;margin:.2rem 0 .6rem}.ks-l{display:grid;gap:.25rem;font-size:.82rem;color:var(--mut);font-weight:600}.ks-l .input{width:100%}.ks-n{font-size:.8rem!important;margin:0!important}
.ks-card{border:1px solid var(--line);background:var(--card);border-radius:.8rem;padding:.8rem .9rem;margin:0 0 .9rem}
.ks-row{display:flex;align-items:center;gap:.5rem;margin:.35rem 0;font-size:.88rem;flex-wrap:wrap}.ks-row>span:first-child{min-width:5.5rem;color:var(--mut);font-size:.8rem;font-weight:600}
.ks-row .input{flex:1;min-width:8rem;padding:.4rem .6rem;font-size:.88rem}.ks-pend{color:var(--bad)}.ks-sep{height:1px;background:var(--line);margin:.7rem 0}
.ks-links{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.5rem}.ks-page{max-width:980px}
.ks-form{display:grid;gap:.55rem}.ks-form label{display:grid;gap:.25rem;font-size:.82rem;color:var(--mut);font-weight:600}.ks-form .input{width:100%}
.ks-tw{overflow-x:auto}.ks-t{width:100%;border-collapse:collapse;font-size:.88rem}.ks-t th,.ks-t td{text-align:left;padding:.45rem .5rem;border-bottom:1px solid var(--line2);vertical-align:top}
.ks-t th{font-size:.75rem;color:var(--mut);text-transform:uppercase;letter-spacing:.04em}.ks-act{white-space:nowrap}.ks-act .btn{margin-left:.3rem}
.ks-it{font-size:.78rem;color:var(--mut);margin-top:.15rem}.ks-it a{color:var(--ac)}.ks-sl{padding:.25rem .4rem;font-size:.82rem}
.ks-inv{list-style:none;padding:0;margin:.4rem 0;display:grid;gap:.35rem;font-size:.85rem}.ks-inv li{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap}.ks-inv code{background:var(--panel);padding:.1rem .35rem;border-radius:.3rem}
.ks-cls summary,.ks-card>summary{cursor:pointer;display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}.ks-cls summary small,.ks-card summary small{color:var(--mut)}
.ks-page .gr-ueb.pass{color:var(--ok);font-weight:600}.ks-page .gr-ueb.fail{color:var(--bad);font-weight:600}.ks-page .gr-lv{font-size:.7rem;font-weight:700;padding:.05rem .4rem;border-radius:.4rem;background:var(--panel)}
.ks-h{margin:1rem 0 .4rem;font-size:.9rem}.ks-new{border-top:1px solid var(--line);margin-top:1rem;padding-top:.8rem}.ks-tip{font-size:.82rem;color:var(--mut);margin:.8rem 0 0}`;
document.head.appendChild(st);

/* ---------- start ---------- */
window.KONTO = { level, lang, passMark, profile: () => P, org: () => ORG, view, fillMe, saveMe, saveLevel, signupFields, rememberSignup, request, sendRequest, join, decide,
  createOrg, saveOrg, addClass, classPass, invite, delInvite, setLevel, moveMember, removeMember, addTask, delTask, copy, reload };
window.addEventListener('acct:in', () => reload());
window.addEventListener('acct:out', () => { P = null; ORG = null; mine = { orgs: [], staff: [] }; apply(); });
// invite links: …/?join=CODE
const jc = new URLSearchParams(location.search).get('join');
if (jc) { history.replaceState(null, '', location.pathname + location.hash); setTimeout(() => join(jc), 600); }
if (me()) reload(); else apply();
})();
