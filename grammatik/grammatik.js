/* ===== Grammatik =====
   Loaded only when someone opens the grammar tab, so the dictionary stays as fast as before.
   Each chapter is its own small file (k22.js …) that calls GRAM.add({...}).
   Results: every "Prüfen" is one attempt. 70 % or more = passed (PASS below).
   Attempts are kept in this browser and, for signed-in users, saved to Supabase (table grammar_results). */
(function () {
'use strict';
const VER = '5';
const PASS = 0.7;                       // share of correct answers needed to pass an exercise
const $ = id => document.getElementById(id);
const H = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const icn = n => (typeof ic === 'function' ? ic(n) : '');
const icons = () => { if (typeof drawIcons === 'function') drawIcons(); };
const CASE = { n: 'Nominativ', d: 'Dativ', a: 'Akkusativ' };
const CH = {};                          // loaded chapters by number
let cur = null;                         // chapter on screen

/* ---------- chapter list (topics A1–B1, in learning order) ---------- */
const GROUPS = [
  { t: 'Verben 1', ic: 'zap', h: 216, ch: [
    [1, 'Personalpronomen', 'ich, du, er, sie, es …', 'A1'], [2, 'Präsens: regelmäßige Verben', 'ich wohne, du wohnst', 'A1'],
    [3, 'sein, haben und möchten', 'ich bin, ich habe', 'A1'], [4, 'Verben mit Vokalwechsel', 'essen → isst, fahren → fährt', 'A1'],
    [5, 'Modalverben: Formen und Satzbau', 'können, müssen, dürfen …', 'A1'], [6, 'Modalverben: können, wollen, möchten', 'Fähigkeit und Wunsch', 'A1'],
    [7, 'Modalverben: müssen, sollen, dürfen', 'Pflicht und Erlaubnis', 'A1'], [8, 'Trennbare Verben', 'einkaufen, anrufen', 'A1'],
    [9, 'Imperativ', 'Komm! Kommt! Kommen Sie!', 'A1'] ] },
  { t: 'Sätze und Fragen', ic: 'message-circle-question', h: 262, ch: [
    [10, 'W-Fragen', 'wer, wie, wo, was …', 'A1'], [11, 'Ja/Nein-Fragen', 'Wohnst du hier?', 'A1'],
    [12, 'Das Verb auf Position 2', 'Heute gehen wir ins Kino.', 'A1'], [13, 'Zwei Verben im Satz', 'Ich gehe einkaufen.', 'A2'] ] },
  { t: 'Pronomen, Nomen und Artikel', ic: 'users', h: 280, ch: [
    [14, 'Plural der Nomen', 'das Buch – die Bücher', 'A1'], [15, 'Bestimmter und unbestimmter Artikel', 'der, das, die – ein, eine', 'A1'],
    [16, 'Verneinung: nicht und kein', 'Ich habe keine Zeit.', 'A1'], [17, 'Der Akkusativ', 'Ich sehe den Hund.', 'A1'],
    [18, 'Der Dativ', 'mit dem Bus, mit der Bahn', 'A1'], [19, 'Possessivartikel', 'mein, dein, unser …', 'A1'],
    [20, 'welcher? und dieser', 'Welche Jacke? – Diese!', 'A1'], [21, 'Personalpronomen im Akkusativ und Dativ', 'mich, mir, dich, dir …', 'A1'],
    [22, 'Verben mit Dativ und Akkusativ', 'Wem gibst du was?', 'A2'], [23, 'Verben mit Dativ', 'helfen, danken, gefallen', 'A2'],
    [24, 'Fragen nach Personen und Sachen', 'wer, wen, wem, was', 'A2'] ] },
  { t: 'Verben 2', ic: 'history', h: 24, ch: [
    [25, 'Präteritum von sein und haben', 'ich war, ich hatte', 'A1'], [26, 'Perfekt mit haben', 'Ich habe gekocht.', 'A1'],
    [27, 'Perfekt mit sein', 'Ich bin gefahren.', 'A2'], [28, 'Das Partizip II', 'gemacht, eingekauft, bezahlt', 'A2'],
    [29, 'Präteritum der Modalverben', 'ich konnte, ich musste', 'A2'], [30, 'Perfekt oder Präteritum?', 'Erzählen über gestern', 'A2'],
    [31, 'Reflexive Verben', 'sich waschen, sich freuen', 'A2'] ] },
  { t: 'Präpositionen 1', ic: 'map-pin', h: 160, ch: [
    [32, 'Zeitangaben', 'im Mai, am Montag, um acht', 'A1'], [33, 'Präpositionen mit Dativ', 'aus, bei, mit, nach, seit, von, zu', 'A1'],
    [34, 'Präpositionen mit Akkusativ', 'für, durch, ohne, gegen, um', 'A1'], [35, 'Wo? Ortsangaben mit Dativ', 'im Kino, auf dem Tisch', 'A1'],
    [36, 'Wo oder wohin? Wechselpräpositionen', 'im Kino – ins Kino', 'A2'], [37, 'Wohin? zu, nach, in, auf', 'zum Arzt, nach Berlin', 'A2'],
    [38, 'Wo? bei, in, auf', 'beim Arzt, in Berlin', 'A2'], [39, 'Woher? aus und von', 'aus Berlin, vom Arzt', 'A2'] ] },
  { t: 'Adjektive 1', ic: 'palette', h: 330, ch: [
    [40, 'Adjektivendungen', 'ein netter Mann, den netten Mann', 'A2'], [41, 'Ordinalzahlen und Datum', 'am ersten Mai', 'A2'],
    [42, 'Komparativ und Vergleiche', 'größer als, so groß wie', 'A2'], [43, 'Superlativ', 'am schnellsten, der größte', 'B1'] ] },
  { t: 'Sätze verbinden 1', ic: 'link', h: 190, ch: [
    [44, 'und, aber, oder, denn', 'Hauptsätze verbinden', 'A1'], [45, 'deshalb, sonst, dann, danach', 'Folge und Reihenfolge', 'A2'],
    [46, 'Nebensätze: weil, dass, wenn', 'Das Verb steht am Ende', 'A2'] ] },
  { t: 'Wörter und Wortbildung', ic: 'puzzle', h: 44, ch: [
    [47, 'Zusammengesetzte Nomen', 'der Regenschirm', 'A1'], [48, 'an sein, aus sein, weg sein', 'Kurze Verbformen', 'A1'],
    [49, 'Der, die oder das? Genusregeln', 'Endungen verraten den Artikel', 'A1'], [50, 'Modalpartikeln', 'denn, doch, mal', 'A2'],
    [51, 'Wortbildung mit Endungen', '-chen, -in, -ung …', 'A2'], [52, 'nicht, nichts, noch nicht, nicht mehr', 'Verneinung genau', 'B1'],
    [53, 'Ortsadverbien', 'oben, unten, nach oben', 'B1'] ] },
  { t: 'Verben 3', ic: 'layers', h: 4, ch: [
    [54, 'Präteritum', 'Er kam, sah und …', 'B1'], [55, 'Plusquamperfekt', 'Ich hatte geschlafen.', 'B1'],
    [56, 'Reflexivpronomen im Dativ', 'Ich wasche mir die Hände.', 'B1'], [57, 'Trennbar oder untrennbar?', 'einkaufen – bestellen', 'B1'],
    [58, 'Verben mit Präpositionen', 'sich freuen über', 'B1'], [59, 'dafür, daran, worauf …', 'Präpositionaladverbien', 'B1'],
    [60, 'Konjunktiv II: Formen', 'wäre, hätte, würde', 'B1'], [61, 'Konjunktiv II: Wünsche und Ratschläge', 'Wenn ich Zeit hätte …', 'B1'],
    [62, 'Passiv Präsens', 'Der Baum wird gepflanzt.', 'B1'], [63, 'Passiv in der Vergangenheit', 'wurde gebaut', 'B1'],
    [64, 'Futur I', 'Ich werde kommen.', 'B1'], [65, 'Die vielen Gesichter von werden', 'Verb, Futur, Passiv', 'B1'],
    [66, 'lassen', 'Ich lasse das Auto reparieren.', 'B1'], [67, 'stehen/stellen, liegen/legen …', 'Wo? und Wohin?', 'B1'] ] },
  { t: 'Nomen 2', ic: 'box', h: 300, ch: [
    [68, 'Der Genitiv', 'das Auto meines Vaters', 'B1'], [69, 'n-Deklination', 'den Herrn, dem Kunden', 'B1'],
    [70, 'Adjektive als Nomen', 'der Jugendliche, ein Jugendlicher', 'B1'], [71, 'alles Gute, etwas Neues', 'Adjektive nach alles, etwas', 'B1'] ] },
  { t: 'Sätze verbinden 2', ic: 'git-branch', h: 200, ch: [
    [72, 'Indirekte Fragen', 'Wissen Sie, ob …?', 'B1'], [73, 'Infinitiv mit zu', 'Es ist schön, zu …', 'B1'],
    [74, 'Infinitiv ohne zu', 'Ich höre ihn singen.', 'B1'], [75, 'Relativsätze', 'der Mann, der …', 'B1'],
    [76, 'Relativsätze mit Präposition', 'das Ding, mit dem …', 'B1'], [77, 'wenn und als', 'Zeit in Nebensätzen', 'B1'],
    [78, 'während, bevor, nachdem, seit', 'Was passiert wann?', 'B1'], [79, 'um … zu und damit', 'Ziele ausdrücken', 'B1'],
    [80, 'Zweiteilige Konnektoren', 'entweder … oder, weder … noch', 'B1'], [81, 'je … desto', 'Je mehr, desto besser.', 'B1'] ] },
  { t: 'Präpositionen 2', ic: 'navigation', h: 140, ch: [
    [82, 'Präpositionen mit Genitiv', 'wegen, trotz, während', 'B1'], [83, 'Zeitliche Präpositionen', 'innerhalb, vor, seit …', 'B1'] ] },
  { t: 'Adjektive 2', ic: 'sparkles', h: 350, ch: [
    [84, 'Adjektive ohne Artikel', 'frisches Brot, kaltes Wasser', 'B1'], [85, 'Partizip I als Adjektiv', 'ein lachendes Kind', 'B1'] ] },
  { t: 'Nachschlagen und trainieren', ic: 'library', h: 40, ref: true, ch: [
    [101, 'Unregelmäßige Verben', 'Präteritum, Partizip, haben oder sein – mit Trainer', 'Liste'], [102, 'Verben mit Dativ', 'helfen, danken, gefallen … – mit Trainer', 'Liste'],
    [103, 'Verben mit Dativ und Akkusativ', 'jemandem etwas geben … – mit Trainer', 'Liste'], [104, 'Verben mit Präpositionen', 'warten auf, denken an … – mit Trainer', 'Liste'] ] }
];
const READY = Object.fromEntries([...Array.from({ length: 85 }, (_, i) => i + 1), 101, 102, 103, 104].map(n => [n, 1]));   // chapters that exist so far   // chapters that exist so far
const TOTAL = GROUPS.reduce((s, g) => s + (g.ref ? 0 : g.ch.length), 0);
const chInfo = n => { for (const g of GROUPS) for (const c of g.ch) if (c[0] === n) return { g, c }; return null; };

/* ---------- styles ---------- */
const CSS = `
:root{--nom:#b8730a;--nom-s:#fcf0d9;--dat:#7c3aed;--dat-s:#f1eafe;--akk:#0b8579;--akk-s:#dcf3ef;
  --cream:#fbf4e3;--cream-b:#ecdcb8;--cream-ink:#5a4626;--sky1:#fdf1d6;--sky2:#f9e2bd;--sun:#f6b94a;--cloud:#fffaf0;
  --hill1:#a9cf8f;--hill2:#cde3a8;--skin1:#8a5a3c;--skin2:#a86f48;--hair1:#f2efe9;--hair2:#2b1d16;--pants:#3d4656;--ink:#2a2f38;
  --skin3:#c48a5a;--skin3b:#d9a274;--skin4:#f1cfae;--skin4b:#f6dcc2;--hair3:#8a5a2b;--hair4:#e3b04b;--wall:#fbefd8;--floor:#e7c99a;--wood:#b07a46;--metal:#9aa6b4}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--nom:#f2b450;--nom-s:#382a12;--dat:#b79bff;--dat-s:#2a1f47;--akk:#4fd1c0;--akk-s:#11332f;
  --cream:#1e1b15;--cream-b:#3a3223;--cream-ink:#e3d3b2;--sky1:#1e2638;--sky2:#2d2f45;--sun:#e8c46a;--cloud:#3a4258;
  --hill1:#2f4a35;--hill2:#3a5a3f;--skin1:#7a4e33;--skin2:#93603f;--hair1:#e7e3db;--hair2:#140d09;--pants:#1c222d;--ink:#e8ecf2;--skin3:#a8754b;--skin3b:#bb8758;--skin4:#d9b391;--skin4b:#e3c3a5;--hair3:#6e4520;--hair4:#c9973a;--wall:#232634;--floor:#3a3127;--wood:#7d5631;--metal:#5d6876}}
:root[data-theme="dark"]{--nom:#f2b450;--nom-s:#382a12;--dat:#b79bff;--dat-s:#2a1f47;--akk:#4fd1c0;--akk-s:#11332f;
  --cream:#1e1b15;--cream-b:#3a3223;--cream-ink:#e3d3b2;--sky1:#1e2638;--sky2:#2d2f45;--sun:#e8c46a;--cloud:#3a4258;
  --hill1:#2f4a35;--hill2:#3a5a3f;--skin1:#7a4e33;--skin2:#93603f;--hair1:#e7e3db;--hair2:#140d09;--pants:#1c222d;--ink:#e8ecf2;--skin3:#a8754b;--skin3b:#bb8758;--skin4:#d9b391;--skin4b:#e3c3a5;--hair3:#6e4520;--hair4:#c9973a;--wall:#232634;--floor:#3a3127;--wood:#7d5631;--metal:#5d6876}
.cs{border-radius:.35em;padding:0 .22em;box-decoration-break:clone;-webkit-box-decoration-break:clone;font-weight:600}
.cs.n{background:var(--nom-s);color:var(--nom);box-shadow:inset 0 -2px 0 var(--nom)}
.cs.d{background:var(--dat-s);color:var(--dat);box-shadow:inset 0 -2px 0 var(--dat)}
.cs.a{background:var(--akk-s);color:var(--akk);box-shadow:inset 0 -2px 0 var(--akk)}
#view a.btn,.gr-pop a.btn{text-decoration:none}
.gr-ue[data-type=cases] .gr-ib{line-height:2.75}
.gr-toc{scrollbar-width:none}.gr-toc::-webkit-scrollbar{display:none}
.gw{cursor:pointer;border-radius:.2em;transition:background .12s}
.gw:hover{background:color-mix(in srgb,var(--ac) 14%,transparent)}
.gr-eyebrow{font-size:.74rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--mut);margin:0 0 .35rem}
.gr-lv{display:inline-block;font-size:.7rem;font-weight:700;padding:.12rem .45rem;border-radius:999px;letter-spacing:.03em}
.gr-lv.Liste{background:var(--line2);color:var(--mut)}
.gr-lv.A1{background:#e3f4ea;color:#0f7a4f}.gr-lv.A2{background:#e6eefe;color:#1d5bd6}.gr-lv.B1{background:#f6e8fd;color:#8b2fc9}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]) .gr-lv.A1{background:#12301f;color:#5fd69b}:root:not([data-theme="light"]) .gr-lv.A2{background:#16233a;color:#7fb0ff}:root:not([data-theme="light"]) .gr-lv.B1{background:#2a1838;color:#d29bf5}}
:root[data-theme="dark"] .gr-lv.A1{background:#12301f;color:#5fd69b}:root[data-theme="dark"] .gr-lv.A2{background:#16233a;color:#7fb0ff}:root[data-theme="dark"] .gr-lv.B1{background:#2a1838;color:#d29bf5}
/* overview */
.gr-top{display:grid;grid-template-columns:1.25fr 1fr;gap:1.2rem;align-items:center;background:var(--cream);border:1px solid var(--cream-b);border-radius:1.5rem;padding:1.6rem 1.7rem;margin:.3rem 0 1.2rem;overflow:hidden}
.gr-top h1{font-family:Fraunces,serif;font-weight:700;font-size:2.4rem;letter-spacing:-.02em;margin:0 0 .5rem;line-height:1.05;color:var(--fg)}
.gr-top p{margin:0;color:var(--cream-ink);font-size:1rem;max-width:30rem}
.gr-top .gr-stats{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1rem}
.gr-stat{background:var(--card);border:1px solid var(--cream-b);border-radius:.8rem;padding:.45rem .7rem;font-size:.8rem;color:var(--mut)}
.gr-stat b{color:var(--fg);font-size:1rem;margin-right:.2rem}
.gr-topart svg{width:100%;height:auto;display:block}
.gr-feat{display:flex;gap:1rem;align-items:center;text-decoration:none;color:inherit;background:var(--card);border:1px solid var(--line);border-radius:1.2rem;padding:.8rem;box-shadow:var(--shadow);margin-bottom:1.4rem;transition:transform .15s}
.gr-feat:hover{transform:translateY(-2px)}
.gr-feat .th{flex:0 0 9.5rem;border-radius:.8rem;overflow:hidden;line-height:0}
.gr-feat .th svg{width:100%;height:auto}
.gr-feat b{font-family:Fraunces,serif;font-size:1.25rem;display:block;margin:.15rem 0 .2rem}
.gr-feat p{margin:0;color:var(--mut);font-size:.9rem}
.gr-filter{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;margin:0 0 1rem}
.gr-chip{border:1px solid var(--line);background:var(--card);color:var(--mut);font-weight:600;font-size:.8rem;padding:.38rem .8rem;border-radius:999px}
.gr-chip.on{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.gr-filter input{flex:1 1 12rem;min-width:0;border:1px solid var(--line);background:var(--card);color:var(--fg);border-radius:999px;padding:.45rem .9rem;font:inherit;font-size:.9rem}
.gr-grp{margin:0 0 1.5rem}
.gr-grp h2{display:flex;align-items:center;gap:.6rem;font-family:Fraunces,serif;font-weight:600;font-size:1.25rem;margin:0 0 .65rem}
.gr-grp h2 small{font-family:Inter,sans-serif;font-size:.78rem;color:var(--faint);font-weight:500;margin-left:auto}
.gr-grp .badge{width:2.1rem;height:2.1rem;font-size:1rem;border-radius:.7rem}
.gr-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(15.5rem,1fr));gap:.55rem}
.gr-card{display:flex;align-items:center;gap:.7rem;padding:.7rem .8rem;border:1px solid var(--line);background:var(--card);border-radius:.9rem;text-decoration:none;color:inherit;position:relative}
.gr-card .gr-num{font-family:Fraunces,serif;font-weight:700;font-size:1.25rem;color:hsl(var(--h) 55% 50%);width:2rem;text-align:center;flex:0 0 auto}
.gr-card .gr-ct{flex:1;min-width:0}.gr-card .gr-ct b{display:block;font-size:.9rem;line-height:1.25}
.gr-card .gr-ct small{display:block;color:var(--mut);font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gr-card.soon{opacity:.55}.gr-card.soon .gr-lv{filter:grayscale(.5)}
.gr-card.ready{border-color:color-mix(in srgb,var(--ac) 45%,var(--line));box-shadow:0 0 0 3px var(--ac-salt);transition:transform .15s}
.gr-card.ready:hover{transform:translateY(-2px)}
.gr-tagr{position:absolute;top:-.55rem;right:.6rem;background:var(--ac);color:#fff;font-size:.62rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:.12rem .45rem;border-radius:999px}
.gr-done{color:var(--ok);display:inline-flex}
/* chapter */
.gr-hero{display:grid;grid-template-columns:1fr 1.05fr;gap:1.4rem;align-items:center;margin:.2rem 0 1rem}
.gr-hero h1{font-family:Fraunces,serif;font-weight:700;font-size:2.25rem;line-height:1.08;letter-spacing:-.02em;margin:.1rem 0 .25rem}
.gr-kick{font-family:Newsreader,serif;font-style:italic;font-size:1.35rem;color:var(--mut);margin:0 0 .8rem}
.gr-intro{font-size:1rem;margin:0 0 1rem}
.gr-art{margin:0;background:var(--cream);border:1px solid var(--cream-b);border-radius:1.4rem;overflow:hidden;box-shadow:var(--shadow)}
.gr-art svg{display:block;width:100%;height:auto}
.gr-art figcaption{display:flex;align-items:center;gap:.6rem;justify-content:center;padding:.75rem 1rem .9rem;font-family:Newsreader,serif;font-size:1.3rem;text-align:center;flex-wrap:wrap}
.gr-say{border:1px solid var(--line);background:var(--card);color:var(--mut);width:34px;height:34px;border-radius:50%;display:inline-grid;place-items:center;flex:0 0 auto;vertical-align:middle}
.gr-say:hover{color:var(--ac);border-color:var(--ac)}
.gr-prog{display:flex;align-items:center;gap:.7rem;font-size:.86rem;color:var(--mut)}
.gr-prog svg{flex:0 0 auto}
.gr-prog b{color:var(--fg)}
.gr-toc{position:sticky;top:58px;z-index:20;display:flex;gap:.35rem;overflow:auto;padding:.55rem 0;margin:0 0 .6rem;background:var(--bg);border-bottom:1px solid var(--line)}
.gr-toc a{white-space:nowrap;text-decoration:none;font-size:.82rem;font-weight:600;color:var(--mut);padding:.32rem .75rem;border-radius:999px;border:1px solid var(--line);background:var(--card);display:inline-flex;gap:.35rem;align-items:center}
.gr-toc a:hover{color:var(--fg)}
.gr-sec{scroll-margin-top:110px;margin:1.6rem 0 0}
.gr-sec>h2{display:flex;align-items:center;gap:.6rem;font-family:Fraunces,serif;font-weight:600;font-size:1.55rem;margin:0 0 .9rem}
.gr-sec>h2 .gr-sn{width:2rem;height:2rem;border-radius:.65rem;display:grid;place-items:center;background:var(--fg);color:var(--bg);font-family:Inter,sans-serif;font-size:.95rem;font-weight:700}
.gr-cream{background:var(--cream);border:1px solid var(--cream-b);border-radius:1.2rem;padding:1.15rem 1.2rem;margin:0 0 .9rem;color:var(--fg)}
.gr-cream h3{font-family:Fraunces,serif;font-weight:600;font-size:1.12rem;margin:0 0 .75rem;color:var(--cream-ink)}
.gr-q3{display:grid;grid-template-columns:repeat(3,1fr);gap:.65rem}
.gr-qc{background:var(--card);border-radius:1rem;padding:.85rem .9rem;border-top:4px solid var(--c);box-shadow:var(--shadow)}
.gr-qc.n{--c:var(--nom);--cs:var(--nom-s)}.gr-qc.d{--c:var(--dat);--cs:var(--dat-s)}.gr-qc.a{--c:var(--akk);--cs:var(--akk-s)}
.gr-qi{width:2.2rem;height:2.2rem;border-radius:.7rem;display:grid;place-items:center;background:var(--cs);color:var(--c);font-size:1.1rem;float:right}
.gr-qq{display:block;font-family:Fraunces,serif;font-size:1.6rem;line-height:1.1;color:var(--c)}
.gr-qk{font-size:.72rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--c)}
.gr-qc p{margin:.45rem 0 0;font-size:.9rem}.gr-qc .gr-qex{font-family:Newsreader,serif;font-size:1.05rem;color:var(--mut)}
.gr-slots{display:flex;flex-wrap:wrap;gap:.45rem;align-items:flex-start;margin:0 0 .9rem}
.gr-slot{display:flex;flex-direction:column;align-items:center;gap:.3rem}
.gr-slot>span{font-family:Newsreader,serif;font-size:1.2rem;padding:.4rem .75rem;border-radius:.7rem;background:var(--card);border:1.5px solid var(--line);white-space:nowrap}
.gr-slot small{font-size:.7rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--mut)}
.gr-slot.n>span{border-color:var(--nom);background:var(--nom-s);color:var(--nom)}.gr-slot.n small{color:var(--nom)}
.gr-slot.d>span{border-color:var(--dat);background:var(--dat-s);color:var(--dat)}.gr-slot.d small{color:var(--dat)}
.gr-slot.a>span{border-color:var(--akk);background:var(--akk-s);color:var(--akk)}.gr-slot.a small{color:var(--akk)}
.gr-slot.v>span{background:var(--fg);color:var(--bg);border-color:var(--fg);font-weight:600}
.gr-pair{display:flex;flex-direction:column;align-items:stretch}
.gr-pair>.gr-pairin{display:flex;gap:.45rem}
.gr-pair>.gr-give{display:flex;align-items:center;justify-content:center;gap:.3rem;font-size:.74rem;color:var(--mut);margin-top:.15rem}
.gr-pair>.gr-give svg{width:7.5rem;height:1.4rem}
.gr-cream .gr-foot{font-size:.9rem;margin:.2rem 0 0;color:var(--cream-ink)}
.gr-tsw{display:flex;gap:.3rem;margin:0 0 .7rem;flex-wrap:wrap}
.gr-tbl{width:100%;border-collapse:separate;border-spacing:0;background:var(--card);border-radius:.9rem;overflow:hidden;border:1px solid var(--cream-b);font-size:.95rem}
.gr-tbl th,.gr-tbl td{padding:.5rem .6rem;text-align:left;border-bottom:1px solid var(--line2)}
.gr-tbl thead th{font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);font-weight:700;background:var(--panel)}
.gr-tbl tbody th{font-size:.8rem;font-weight:700;white-space:nowrap}
.gr-tbl tr:last-child td,.gr-tbl tr:last-child th{border-bottom:0}
.gr-tbl tr.n th{color:var(--nom)}.gr-tbl tr.a th{color:var(--akk)}.gr-tbl tr.d th{color:var(--dat)}
.gr-tbl td{font-family:Newsreader,serif;font-size:1.08rem}
.gr-tbl td .art{font-weight:600}
.gr-tbl .ls{display:none}
@media(max-width:560px){.gr-tbl .lf{display:none}.gr-tbl .ls{display:inline}.gr-tbl:not(.gr-grid) td{font-size:.9rem;padding:.4rem .2rem;line-height:1.25}.gr-tbl:not(.gr-grid) th{padding:.4rem .3rem}.gr-tbl:not(.gr-grid) thead th{font-size:.6rem;letter-spacing:.02em}}
.gr-tbl tr.a td .art.chg{color:var(--akk);background:var(--akk-s);border-radius:.3em;padding:0 .2em}
.gr-tbl tr.d td .art.chg{color:var(--dat);background:var(--dat-s);border-radius:.3em;padding:0 .2em}
.plusn{color:var(--dat);text-decoration:underline;text-underline-offset:3px}
.gr-tblw{overflow-x:auto}
.gr-merk{display:flex;gap:.8rem;align-items:center;background:var(--fg);color:var(--bg);border-radius:1.1rem;padding:1rem 1.15rem;margin:0 0 .9rem}
.gr-merk .ico{font-size:1.4rem;color:var(--sun)}
.gr-merk p{margin:0;font-family:Newsreader,serif;font-size:1.25rem}
.gr-merk small{display:block;font-family:Inter,sans-serif;font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.65}
.gr-merk .cs.n,.gr-merk .cs.d,.gr-merk .cs.a{background:transparent}
.gr-mach .gr-msw{display:flex;gap:.5rem;flex-wrap:wrap;margin:0 0 1rem}
.gr-tg{display:inline-flex;align-items:center;gap:.5rem;border:1.5px solid var(--line);background:var(--card);color:var(--fg);border-radius:999px;padding:.35rem .4rem .35rem .8rem;font-size:.86rem;font-weight:600}
.gr-tg i.k{width:2.1rem;height:1.2rem;border-radius:999px;background:var(--line);position:relative;transition:background .2s}
.gr-tg i.k::after{content:'';position:absolute;left:.15rem;top:.15rem;width:.9rem;height:.9rem;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 1px 2px rgba(0,0,0,.25)}
.gr-tg.on.d i.k{background:var(--dat)}.gr-tg.on.a i.k{background:var(--akk)}
.gr-tg.on i.k::after{transform:translateX(.9rem)}
.gr-msent{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center;font-family:Newsreader,serif;font-size:1.5rem;min-height:3.2rem;padding:.6rem .2rem}
.gr-msent .w{display:inline-block;padding:.15rem .55rem;border-radius:.6rem;transition:transform .45s cubic-bezier(.3,1.4,.5,1),background .3s}
.gr-msent .w.d{background:var(--dat-s);color:var(--dat);box-shadow:inset 0 -2px 0 var(--dat)}
.gr-msent .w.a{background:var(--akk-s);color:var(--akk);box-shadow:inset 0 -2px 0 var(--akk)}
.gr-mrule{display:flex;gap:.5rem;align-items:flex-start;font-size:.95rem;background:var(--card);border-radius:.8rem;padding:.6rem .8rem;margin:.2rem 0 0;color:var(--fg)}
.gr-mrule .lic{color:var(--ac);margin-top:.15rem}
.gr-verbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(14rem,1fr));gap:.5rem}
.gr-verb{background:var(--card);border-radius:.85rem;padding:.6rem .75rem;border:1px solid var(--cream-b)}
.gr-verb b{display:block;font-size:.98rem}
.gr-verb span.ex{font-family:Newsreader,serif;font-size:1rem;color:var(--mut)}
.gr-pat{font-family:Newsreader,serif;font-style:italic;color:var(--cream-ink);margin:-.4rem 0 .7rem}
.gr-note{display:flex;gap:.7rem;border-left:4px solid var(--warn);background:color-mix(in srgb,var(--warn) 9%,var(--card));border-radius:.4rem .9rem .9rem .4rem;padding:.8rem 1rem;margin:0 0 .9rem}
.gr-note .lic{color:var(--warn);font-size:1.2rem;margin-top:.1rem}
.gr-note p{margin:0}.gr-note b.t{display:block;margin-bottom:.15rem}
.gr-exs{list-style:none;margin:0;padding:0;display:grid;gap:.45rem}
.gr-exs li{display:flex;gap:.7rem;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:.9rem;padding:.55rem .7rem}
.gr-exs .s{font-family:Newsreader,serif;font-size:1.22rem;flex:1;line-height:1.5}
.gr-legend{display:flex;gap:.9rem;flex-wrap:wrap;font-size:.8rem;color:var(--mut);margin:0 0 .7rem}
.gr-legend span::before{content:'';display:inline-block;width:.7rem;height:.7rem;border-radius:.2rem;margin-right:.35rem;vertical-align:-.05rem;background:var(--c)}
.gr-legend .n{--c:var(--nom)}.gr-legend .d{--c:var(--dat)}.gr-legend .a{--c:var(--akk)}
.gr-tip{font-size:.82rem;color:var(--faint);margin:.5rem 0 0;display:flex;gap:.35rem;align-items:center}
/* exercises */
.gr-ue{background:var(--card);border:1px solid var(--line);border-radius:1.2rem;box-shadow:var(--shadow);padding:1.1rem 1.15rem;margin:0 0 1rem}
.gr-ueh{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap}
.gr-uen{font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ac);background:var(--ac-salt);padding:.18rem .5rem;border-radius:999px}
.gr-ueh h3{margin:0;font-family:Fraunces,serif;font-weight:600;font-size:1.2rem}
.gr-ueb{margin-left:auto;font-size:.76rem;font-weight:700;padding:.2rem .55rem;border-radius:999px;display:inline-flex;gap:.3rem;align-items:center}
.gr-ueb.pass{background:color-mix(in srgb,var(--ok) 15%,var(--card));color:var(--ok)}
.gr-ueb.fail{background:color-mix(in srgb,var(--warn) 15%,var(--card));color:var(--warn)}
.gr-ueb.free{background:var(--line2);color:var(--mut)}
.gr-uei{color:var(--mut);font-size:.9rem;margin:.45rem 0 .8rem}
.gr-it{display:flex;gap:.6rem;align-items:flex-start;padding:.6rem 0;border-top:1px dashed var(--line)}
.gr-it:first-child{border-top:0}
.gr-in{flex:0 0 1.6rem;height:1.6rem;border-radius:50%;display:grid;place-items:center;font-size:.75rem;font-weight:700;color:var(--mut);background:var(--line2);margin-top:.2rem;transition:.2s}
.gr-it.ok .gr-in{background:var(--ok);color:#fff}.gr-it.no .gr-in{background:var(--bad);color:#fff}
.gr-ib{flex:1;min-width:0;font-family:Newsreader,serif;font-size:1.2rem;line-height:1.85}
.gr-sol{font-family:Inter,sans-serif;font-size:.84rem;color:var(--ok);margin-top:.2rem;line-height:1.4}
.gr-sol.bad{color:var(--bad)}
.gr-tag{font:inherit;border:1.5px dashed var(--faint);background:transparent;color:var(--fg);border-radius:.5rem;padding:0 .35rem;line-height:1.5;position:relative;transition:background .15s,border-color .15s}
.gr-tag[data-st="n"]{border:1.5px solid var(--nom);background:var(--nom-s);color:var(--nom)}
.gr-tag[data-st="d"]{border:1.5px solid var(--dat);background:var(--dat-s);color:var(--dat)}
.gr-tag[data-st="a"]{border:1.5px solid var(--akk);background:var(--akk-s);color:var(--akk)}
.gr-tag[data-st]:not([data-st=""])::after{content:attr(data-lb);position:absolute;left:50%;top:-.95rem;transform:translateX(-50%);font:700 .58rem Inter,sans-serif;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}
.gr-gap{display:inline-flex;gap:.2rem;vertical-align:middle;margin:0 .1rem}
.gr-gap button{font:inherit;font-size:1rem;border:1.5px solid var(--line);background:var(--panel);color:var(--fg);border-radius:.5rem;padding:0 .45rem;line-height:1.55}
.gr-gap button.sel{border-color:var(--ac);background:var(--ac);color:#fff}
.gr-gap button.right{border-color:var(--ok);background:var(--ok);color:#fff}
.gr-gap button.wrong{border-color:var(--bad);background:color-mix(in srgb,var(--bad) 14%,var(--card));color:var(--bad);text-decoration:line-through}
.gr-line{min-height:2.6rem;display:flex;flex-wrap:wrap;gap:.35rem;align-items:center;border-bottom:2px solid var(--line);padding:.2rem 0 .35rem;margin-bottom:.45rem}
.gr-line:empty::before{content:'Tippe die Teile unten an …';font:italic .9rem Inter,sans-serif;color:var(--faint)}
.gr-pool{display:flex;flex-wrap:wrap;gap:.35rem}
.gr-tile{font:inherit;font-size:1.05rem;border:1.5px solid var(--line);background:var(--panel);color:var(--fg);border-radius:.6rem;padding:.12rem .6rem;box-shadow:0 2px 0 var(--line)}
.gr-tile:active{transform:translateY(1px);box-shadow:none}
.gr-line .gr-tile{background:var(--ac-salt);border-color:color-mix(in srgb,var(--ac) 40%,var(--line))}
.gr-end{font-size:1.2rem}
.gr-q{font-size:1.05rem;color:var(--mut);margin-bottom:.25rem}
.gr-q mark{background:var(--ac-salt);color:var(--ac);border-radius:.3em;padding:0 .2em}
.gr-tl{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap}
.gr-tl input,.gr-free textarea{font:inherit;font-size:1.1rem;flex:1 1 10rem;min-width:0;border:1.5px solid var(--line);background:var(--panel);color:var(--fg);border-radius:.6rem;padding:.25rem .6rem}
.gr-tl input:focus,.gr-free textarea:focus{outline:none;border-color:var(--ac);box-shadow:0 0 0 3px var(--ac-salt)}
.gr-free textarea{width:100%;resize:vertical;min-height:2.8rem;font-family:Newsreader,serif}
.gr-fb{font-family:Inter,sans-serif;font-size:.86rem;margin-top:.35rem;line-height:1.45}
.gr-fb .e{display:block;color:var(--bad)}.gr-fb .h{display:block;color:var(--warn)}.gr-fb .k{display:block;color:var(--ok)}
.gr-uef{display:flex;gap:.45rem;align-items:center;flex-wrap:wrap;margin-top:.8rem;padding-top:.8rem;border-top:1px solid var(--line)}
.gr-res{font-size:.9rem;font-weight:600;margin-left:auto}
.gr-res.pass{color:var(--ok)}.gr-res.fail{color:var(--warn)}
.gr-btn[disabled]{opacity:.45;cursor:not-allowed}
.gr-burst{position:fixed;pointer-events:none;z-index:90;font-size:1.3rem;animation:grb 1s ease-out forwards}
@keyframes grb{to{transform:translate(var(--x),var(--y)) rotate(var(--r));opacity:0}}
@keyframes grshake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.gr-it.no .gr-ib{animation:grshake .3s}
/* speaking cards */
.gr-spk{display:grid;grid-template-columns:repeat(auto-fill,minmax(16rem,1fr));gap:.65rem}
.gr-sc{background:var(--card);border:1px solid var(--line);border-radius:1.1rem;padding:.9rem;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:.6rem}
.gr-scp{display:flex;align-items:center;gap:.35rem;flex-wrap:wrap;font-size:.86rem}
.gr-scp span{display:inline-flex;align-items:center;gap:.3rem;padding:.25rem .55rem;border-radius:999px;font-weight:600}
.gr-scp .n{background:var(--nom-s);color:var(--nom)}.gr-scp .d{background:var(--dat-s);color:var(--dat)}.gr-scp .a{background:var(--akk-s);color:var(--akk)}
.gr-scp .arr{color:var(--faint);padding:0}
.gr-scs{font-family:Newsreader,serif;font-size:1.15rem;min-height:1.6rem}
.gr-scs.hid{color:var(--faint);font-style:italic;font-size:.95rem;font-family:Inter,sans-serif}
.gr-sc .row{gap:.35rem}
/* word popover */
.gr-pop{position:absolute;z-index:70;width:min(20rem,calc(100vw - 2rem));background:var(--card);border:1px solid var(--line);border-radius:1rem;box-shadow:0 18px 40px -12px rgba(0,0,0,.35);padding:.85rem .95rem;font-size:.9rem}
.gr-pop .hw{font-family:Fraunces,serif;font-weight:700;font-size:1.25rem;display:flex;align-items:center;gap:.5rem}
.gr-pop .ps{font-size:.72rem;color:var(--faint);font-weight:600;text-transform:uppercase;letter-spacing:.05em}
.gr-pop p{margin:.35rem 0 .6rem;color:var(--mut)}
/* progress page */
.gr-ptab{width:100%;border-collapse:collapse;font-size:.9rem;background:var(--card);border-radius:1rem;overflow:hidden;border:1px solid var(--line)}
.gr-ptab th,.gr-ptab td{padding:.55rem .7rem;border-bottom:1px solid var(--line2);text-align:left}
.gr-ptab thead th{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);background:var(--panel)}
.gr-ph td{background:var(--panel);font-size:.86rem}.gr-ph a{text-decoration:none}
.gr-bar{height:.45rem;border-radius:999px;background:var(--line2);overflow:hidden;min-width:4rem}
.gr-bar i{display:block;height:100%;border-radius:999px;background:var(--ok)}
.gr-bar i.f{background:var(--warn)}
@media(max-width:760px){.gr-hero{grid-template-columns:1fr}.gr-hero .gr-art{order:-1}.gr-top{grid-template-columns:1fr;padding:1.3rem}.gr-topart{max-width:20rem;margin:0 auto;order:-1}}
@media(max-width:640px){.gr-q3{grid-template-columns:1fr}.gr-qc{display:grid;grid-template-columns:auto 1fr;column-gap:.8rem}.gr-qc .gr-qi{float:none;grid-row:span 2}
  .gr-hero h1{font-size:1.8rem}.gr-top h1{font-size:2rem}.gr-feat .th{flex-basis:6.5rem}.gr-toc{top:58px}
  .gr-slot>span{font-size:1.05rem;padding:.3rem .55rem}.gr-msent{font-size:1.25rem}.gr-ib{font-size:1.1rem}.gr-tbl{font-size:.85rem}.gr-tbl td{font-size:.98rem;padding:.45rem .4rem}
  .gr-ptab .hide-s{display:none}}
/* verbs, endings, bracket */
.cs.e{color:var(--ac);background:var(--ac-salt);box-shadow:inset 0 -2px 0 var(--ac);padding:0 .08em;border-radius:.25em}
.cs.v{background:var(--fg);color:var(--bg);box-shadow:none;padding:0 .3em}
.cs.t{background:transparent;color:var(--fg);box-shadow:none;outline:1.5px dashed var(--fg);outline-offset:-1px;padding:0 .3em}
.gr-merk .cs.v{background:var(--bg);color:var(--fg)}.gr-merk .cs.t{color:var(--bg);outline-color:var(--bg)}
.gr-slot.vt>span{background:transparent;border:2px dashed var(--fg);font-weight:600}
.gr-slot.q>span{border-color:var(--ac);background:var(--ac-salt);color:var(--ac)}.gr-slot.q small{color:var(--ac)}
.gr-slot small:empty::before{content:'\\00a0'}
.gr-cards2{display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--min,13rem),1fr));gap:.6rem}
.gr-c2{background:var(--card);border-radius:1rem;padding:.8rem .9rem;border:1px solid var(--cream-b);border-top:4px solid var(--c,var(--ac))}
.gr-c2 .tt{font-family:Fraunces,serif;font-weight:700;font-size:1.35rem;color:var(--c,var(--fg));line-height:1.15;display:flex;gap:.45rem;align-items:center}
.gr-c2 .tt .lic{font-size:1.05rem}
.gr-c2 .s{font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);display:block;margin:.1rem 0 .35rem}
.gr-c2 p{margin:.3rem 0 0;font-size:.92rem}.gr-c2 .ex{font-family:Newsreader,serif;font-size:1.05rem;color:var(--mut)}
.gr-c2 .ws{display:flex;flex-wrap:wrap;gap:.25rem .35rem;margin-top:.35rem;font-family:Newsreader,serif;font-size:1.05rem}
.gr-c2 .ws span.gw{background:var(--panel);border:1px solid var(--line);border-radius:.4rem;padding:0 .35rem}
.k-n{--c:var(--nom)}.k-d{--c:var(--dat)}.k-a{--c:var(--akk)}.k-ac{--c:var(--ac)}.k-ok{--c:var(--ok)}.k-w{--c:var(--warn)}.k-b{--c:var(--bad)}.k-f{--c:var(--fg)}
.gr-grid td{font-family:Newsreader,serif;font-size:1.06rem}.gr-grid td.l,.gr-grid th.l{font-family:Inter,sans-serif;font-size:.86rem;font-weight:600;color:var(--mut)}
.gr-grid td.l{white-space:nowrap}
.gr-grid tr.hl td{background:color-mix(in srgb,var(--ac) 7%,var(--card))}
.gr-conj .gr-cv{display:flex;flex-wrap:wrap;gap:.3rem;margin:0 0 .75rem}
.gr-conj .gr-cv .gr-chip{font-family:Newsreader,serif;font-size:1rem;padding:.25rem .75rem}
.gr-conjt{display:grid;grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(3,auto);grid-auto-flow:column;gap:.4rem}
@media(max-width:560px){.gr-conjt{grid-template-columns:1fr;grid-template-rows:none;grid-auto-flow:row}.gr-conjt b{width:4.6rem}}
.gr-conjt div{background:var(--card);border-radius:.75rem;padding:.5rem .75rem;display:flex;align-items:baseline;gap:.6rem;border:1px solid var(--cream-b);animation:grin .35s both}
.gr-conjt b{font-family:Inter,sans-serif;font-size:.8rem;color:var(--mut);width:5.2rem;flex:0 0 auto;font-weight:600}
.gr-conjt span{font-family:Newsreader,serif;font-size:1.3rem}
.gr-conjt .end{color:var(--ac);font-weight:600;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px}
@keyframes grin{from{opacity:0;transform:translateY(4px)}}
.gr-cnote{font-size:.88rem;color:var(--cream-ink);margin:.6rem 0 0;min-height:1.3em}
.gr-fill{font:inherit;font-size:1.05rem;width:calc(var(--n,4)*.68em + 1.4em);min-width:3.2em;max-width:100%;border:none;border-bottom:2px solid var(--ac);background:var(--ac-salt);color:var(--fg);border-radius:.35rem .35rem 0 0;padding:0 .3em;text-align:center}
.gr-fill:focus{outline:none;background:color-mix(in srgb,var(--ac) 22%,var(--card))}
.gr-fill.right{border-color:var(--ok);background:color-mix(in srgb,var(--ok) 14%,var(--card));color:var(--ok);font-weight:600}
.gr-fill.wrong{border-color:var(--bad);background:color-mix(in srgb,var(--bad) 12%,var(--card));color:var(--bad)}
.gr-hint{font-family:Inter,sans-serif;font-size:.78rem;font-weight:600;color:var(--mut);background:var(--line2);border-radius:.35rem;padding:.05rem .4rem;margin-right:.25rem;vertical-align:.15em}
.gr-scp .x{background:var(--line2);color:var(--fg)}.gr-scp .b{background:color-mix(in srgb,var(--bad) 13%,var(--card));color:var(--bad)}.gr-scp .ok{background:color-mix(in srgb,var(--ok) 13%,var(--card));color:var(--ok)}.gr-scp .v{background:var(--fg);color:var(--bg)}.gr-scp .e{background:var(--ac-salt);color:var(--ac)}
.gr-refq{width:100%;border:1.5px solid var(--cream-b);background:var(--card);color:var(--fg);border-radius:999px;padding:.5rem 1rem;font:inherit;margin:0 0 .6rem}
.gr-refw{max-height:28rem;overflow:auto;border-radius:.9rem}
.gr-ref thead th{position:sticky;top:0;z-index:1}
.gr-ref0{font-weight:600}
.gr-play{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;background:var(--ac-salt);border-radius:1rem;padding:.7rem .9rem;margin:0 0 1rem;font-size:.9rem;font-weight:600}
.gr-play>span{display:inline-flex;gap:.4rem;align-items:center;margin-right:auto}
.gr-scs .alt{display:block;font-size:1rem;color:var(--mut);margin-top:.2rem}
`;
function css() { if (!$('grcss')) { const s = document.createElement('style'); s.id = 'grcss'; s.textContent = CSS; document.head.appendChild(s); } }

/* ---------- illustrations (drawn in code, follow light/dark theme) ---------- */
const ART = {
  kite(small) {
    const lab = (x, y, t, c) => `<g transform="translate(${x} ${y})"><rect x="-27" y="-15" width="54" height="26" rx="13" fill="var(--${c})"/><text y="3" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="13" fill="var(--card)">${t}</text></g>`;
    return `<svg viewBox="0 0 520 360" role="img" aria-label="Ein Opa schenkt seinem Enkel einen Drachen.">
<defs><linearGradient id="grsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky1)"/><stop offset="1" stop-color="var(--sky2)"/></linearGradient>
<marker id="grarr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--dat)"/></marker></defs>
<rect width="520" height="360" fill="url(#grsky)"/>
<circle cx="440" cy="70" r="40" fill="var(--sun)" opacity=".25"/><circle cx="440" cy="70" r="27" fill="var(--sun)"/>
<g fill="var(--cloud)"><ellipse cx="96" cy="66" rx="40" ry="13"/><ellipse cx="118" cy="56" rx="24" ry="15"/><ellipse cx="326" cy="40" rx="30" ry="9"/><ellipse cx="342" cy="33" rx="16" ry="10"/></g>
<path d="M60 112q6-6 12 0q6-6 12 0M380 132q5-5 10 0q5-5 10 0" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" opacity=".45"/>
<path d="M0 262Q120 212 250 248T520 236V360H0Z" fill="var(--hill2)"/>
<path d="M0 300Q170 262 310 290T520 282V360H0Z" fill="var(--hill1)"/>
<g opacity=".18" fill="var(--ink)"><ellipse cx="170" cy="330" rx="56" ry="8"/><ellipse cx="372" cy="330" rx="40" ry="7"/></g>
<!-- Opa -->
<g>
 <rect x="150" y="250" width="17" height="76" rx="8" fill="var(--pants)"/><rect x="173" y="250" width="17" height="76" rx="8" fill="var(--pants)"/>
 <ellipse cx="156" cy="326" rx="14" ry="6" fill="var(--ink)"/><ellipse cx="186" cy="326" rx="14" ry="6" fill="var(--ink)"/>
 <path d="M134 214q0-46 36-46q36 0 36 46v44q0 8-8 8h-56q-8 0-8-8z" fill="var(--nom)"/>
 <path d="M170 170v96" stroke="var(--card)" stroke-width="2" opacity=".5"/>
 <g fill="var(--card)" opacity=".75"><circle cx="176" cy="196" r="2.4"/><circle cx="176" cy="214" r="2.4"/><circle cx="176" cy="232" r="2.4"/></g>
 <path d="M140 200q-14 30-4 58" stroke="var(--nom)" stroke-width="15" stroke-linecap="round" fill="none"/>
 <circle cx="138" cy="260" r="7.5" fill="var(--skin1)"/>
 <path d="M200 192q24 6 40 -12" stroke="var(--nom)" stroke-width="15" stroke-linecap="round" fill="none"/>
 <rect x="162" y="150" width="16" height="20" rx="6" fill="var(--skin1)"/>
 <circle cx="170" cy="134" r="28" fill="var(--skin1)"/>
 <path d="M143 136q-3-26 13-34q-12 14-6 34zM197 136q3-26-13-34q12 14 6 34z" fill="var(--hair1)"/>
 <path d="M150 112q20-14 40 0" stroke="var(--hair1)" stroke-width="5" stroke-linecap="round" fill="none"/>
 <circle cx="141" cy="138" r="5" fill="var(--skin2)"/><circle cx="199" cy="138" r="5" fill="var(--skin2)"/>
 <g fill="none" stroke="var(--ink)" stroke-width="2"><circle cx="160" cy="132" r="7"/><circle cx="180" cy="132" r="7"/><path d="M167 132h6"/></g>
 <circle cx="160" cy="132" r="2" fill="var(--ink)"/><circle cx="180" cy="132" r="2" fill="var(--ink)"/>
 <path d="M157 147q13-9 26 0q-4 6-13 3q-9 3-13-3z" fill="var(--hair1)"/>
 <path d="M164 154q6 4 12 0" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" fill="none"/>
</g>
<!-- Drachen -->
<g transform="rotate(-12 268 148)">
 <path d="M268 74L310 140L268 214L228 140Z" fill="var(--akk)"/>
 <path d="M268 74L310 140H268Z" fill="var(--card)" opacity=".28"/><path d="M228 140L268 214V140Z" fill="var(--card)" opacity=".18"/>
 <path d="M268 74V214M228 140H310" stroke="var(--card)" stroke-width="2.5" opacity=".7"/>
 <path d="M268 214q-10 22 6 38q16 16 0 40" stroke="var(--ink)" stroke-width="1.6" fill="none" opacity=".55"/>
 <g fill="var(--nom)"><path d="M262 232l12-6l-2 12z"/><path d="M270 262l12-4l-4 11z"/></g><path d="M266 284l11-2l-5 10z" fill="var(--dat)"/>
</g>
<circle cx="241" cy="180" r="7.5" fill="var(--skin1)"/>
<!-- Enkel -->
<g>
 <rect x="357" y="270" width="14" height="56" rx="7" fill="var(--pants)"/><rect x="376" y="270" width="14" height="56" rx="7" fill="var(--pants)"/>
 <ellipse cx="362" cy="326" rx="11" ry="5" fill="var(--ink)"/><ellipse cx="386" cy="326" rx="11" ry="5" fill="var(--ink)"/>
 <path d="M350 246q0-36 24-36q24 0 24 36v26q0 6-6 6h-36q-6 0-6-6z" fill="var(--dat)"/>
 <path d="M356 228q-18-14-26-36" stroke="var(--dat)" stroke-width="12" stroke-linecap="round" fill="none"/>
 <circle cx="329" cy="188" r="6.5" fill="var(--skin1)"/>
 <path d="M393 228q16-14 18-38" stroke="var(--dat)" stroke-width="12" stroke-linecap="round" fill="none"/>
 <circle cx="411" cy="186" r="6.5" fill="var(--skin1)"/>
 <circle cx="374" cy="186" r="24" fill="var(--skin1)"/>
 <g fill="var(--hair2)"><circle cx="356" cy="170" r="9"/><circle cx="366" cy="163" r="10"/><circle cx="379" cy="161" r="10"/><circle cx="391" cy="167" r="9"/><circle cx="396" cy="176" r="6"/><circle cx="352" cy="179" r="6"/></g>
 <circle cx="351" cy="190" r="4.5" fill="var(--skin2)"/><circle cx="397" cy="190" r="4.5" fill="var(--skin2)"/>
 <circle cx="366" cy="188" r="2.6" fill="var(--ink)"/><circle cx="382" cy="188" r="2.6" fill="var(--ink)"/>
 <path d="M364 198q10 10 20 0z" fill="var(--ink)"/>
 <g fill="var(--die)" opacity=".35"><circle cx="360" cy="196" r="3.5"/><circle cx="388" cy="196" r="3.5"/></g>
</g>
<path d="M300 106Q348 96 352 150" fill="none" stroke="var(--dat)" stroke-width="2.4" stroke-dasharray="5 6" marker-end="url(#grarr)"/>
${small ? '' : lab(170, 84, 'Wer?', 'nom') + lab(374, 132, 'Wem?', 'dat') + lab(222, 60, 'Was?', 'akk')}
</svg>`;
  },
  cover() {
    const tile = (x, y, r, t, c, s) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-38" y="-22" width="76" height="44" rx="12" fill="var(--${s})" stroke="var(--${c})" stroke-width="2"/><text y="8" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="22" fill="var(--${c})">${t}</text></g>`;
    return `<svg viewBox="0 0 320 230" role="img" aria-label="Ein offenes Buch mit Artikeln">
<ellipse cx="160" cy="206" rx="120" ry="10" fill="var(--ink)" opacity=".1"/>
<path d="M160 70Q110 48 40 58V190Q110 180 160 202Z" fill="var(--card)" stroke="var(--cream-b)" stroke-width="2"/>
<path d="M160 70Q210 48 280 58V190Q210 180 160 202Z" fill="var(--card)" stroke="var(--cream-b)" stroke-width="2"/>
<path d="M160 70V202" stroke="var(--cream-b)" stroke-width="2"/>
<g stroke="var(--faint)" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"><path d="M60 92q40-6 80 2M60 112q40-6 80 2M60 132q40-6 66 2M60 152q40-6 80 2"/><path d="M180 94q40-8 80-2M180 114q40-8 80-2M194 134q32-6 66-2M180 154q40-8 80-2"/></g>
${tile(88, 34, -10, 'der', 'nom', 'nom-s')}${tile(236, 30, 9, 'dem', 'dat', 'dat-s')}${tile(162, 18, -2, 'den', 'akk', 'akk-s')}
<g fill="var(--sun)"><path d="M30 30l3 8l8 3l-8 3l-3 8l-3-8l-8-3l8-3z"/><path d="M292 108l2 5l5 2l-5 2l-2 5l-2-5l-5-2l5-2z"/></g>
</svg>`;
  }
};

/* ---------- drawing kit: chapters compose their pictures from these pieces ---------- */
const K = {
  svg: (inner, label) => `<svg viewBox="0 0 520 360" role="img" aria-label="${H(label)}">${inner}</svg>`,
  grad: () => `<defs><linearGradient id="grsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky1)"/><stop offset="1" stop-color="var(--sky2)"/></linearGradient></defs><rect width="520" height="360" fill="url(#grsky)"/>`,
  clouds: () => `<g fill="var(--cloud)"><ellipse cx="90" cy="62" rx="38" ry="12"/><ellipse cx="110" cy="53" rx="22" ry="14"/><ellipse cx="318" cy="38" rx="28" ry="9"/><ellipse cx="334" cy="31" rx="15" ry="9"/></g>`,
  sun: (x = 446, y = 66) => `<circle cx="${x}" cy="${y}" r="38" fill="var(--sun)" opacity=".25"/><circle cx="${x}" cy="${y}" r="25" fill="var(--sun)"/>`,
  sky: (sun = true) => K.grad() + (sun ? K.sun() : '') + K.clouds() + `<path d="M0 262Q120 214 250 250T520 238V360H0Z" fill="var(--hill2)"/><path d="M0 300Q170 264 310 292T520 284V360H0Z" fill="var(--hill1)"/>`,
  room: (win = true) => `<rect width="520" height="360" fill="var(--wall)"/><rect y="296" width="520" height="64" fill="var(--floor)"/><rect y="292" width="520" height="6" fill="var(--wood)" opacity=".55"/>` +
    (win ? `<rect x="380" y="52" width="104" height="116" rx="8" fill="var(--sky1)" stroke="var(--wood)" stroke-width="6"/><circle cx="458" cy="84" r="11" fill="var(--sun)"/><path d="M432 52V168M380 110H484" stroke="var(--wood)" stroke-width="4"/>` : ''),
  street: () => K.grad() + K.clouds() + `<g opacity=".55"><rect x="20" y="150" width="70" height="140" fill="var(--hill2)"/><rect x="96" y="120" width="56" height="170" fill="var(--hill1)"/><rect x="380" y="136" width="62" height="154" fill="var(--hill1)"/><rect x="446" y="168" width="60" height="122" fill="var(--hill2)"/>
<g fill="var(--sky1)"><rect x="34" y="168" width="14" height="14"/><rect x="60" y="168" width="14" height="14"/><rect x="34" y="198" width="14" height="14"/><rect x="60" y="198" width="14" height="14"/><rect x="108" y="140" width="12" height="12"/><rect x="128" y="140" width="12" height="12"/><rect x="108" y="168" width="12" height="12"/><rect x="128" y="168" width="12" height="12"/><rect x="394" y="156" width="12" height="12"/><rect x="416" y="156" width="12" height="12"/><rect x="394" y="184" width="12" height="12"/><rect x="416" y="184" width="12" height="12"/></g></g>
<rect y="288" width="520" height="72" fill="var(--metal)" opacity=".5"/><rect y="284" width="520" height="8" fill="var(--card)" opacity=".7"/><path d="M0 334H520" stroke="var(--card)" stroke-width="4" stroke-dasharray="26 22" opacity=".7"/>`,
  shadow: (x, w = 44, y = 328) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="7" fill="var(--ink)" opacity=".14"/>`,
  /* a person standing with feet at (x,y). o: s scale, shirt, skin 1–4, hair short|curly|long|bun|white|bald, hc, pants, dress, apron,
     armL/armR down|up|wave|out|hold|hip|chest|front, face smile|open|o|sleep|flat, glasses, beard, flip, extra (drawn in the figure's frame) */
  person(o) {
    const s = o.s || 1, sh = o.shirt || 'var(--nom)', sk = 'var(--skin' + (o.skin || 1) + ')', sk2 = 'var(--skin' + ({ 1: 2, 2: 2, 3: '3b', 4: '4b' }[o.skin || 1]) + ')';
    const hc = o.hc || 'var(--hair2)', pants = o.pants || 'var(--pants)', hair = o.hair || 'short';
    const P = { down: [6, 54], up: [12, -54], wave: [34, -50], out: [48, 18], hold: [-12, 30], hip: [18, 38], chest: [-20, 4], front: [30, 26] };
    const arm = (side, pose) => {
      const sx = side * 21, sy = -122, d = P[pose] || P.down, hx = sx + side * d[0], hy = sy + d[1];
      const cx = sx + side * (pose === 'down' ? 6 : pose === 'chest' || pose === 'hold' ? 8 : 20), cy = (sy + hy) / 2 + (pose === 'up' || pose === 'wave' ? 14 : 8);
      return `<path d="M${sx} ${sy}Q${cx} ${cy} ${hx} ${hy}" stroke="${sh}" stroke-width="13" stroke-linecap="round" fill="none"/><circle cx="${hx}" cy="${hy}" r="6.5" fill="${sk}"/>`;
    };
    const hairBack = hair === 'long' ? `<path d="M-25 -158Q-28 -192 0 -188Q28 -192 25 -158V-116Q17 -108 12 -118V-146Q0 -164-12 -146V-118Q-17 -108-25 -116Z" fill="${hc}"/>` : '';
    const cap = `<path d="M-23 -162Q-24 -188 0 -188Q24 -188 23 -162Q15 -178 0 -175Q-15 -178-23 -162Z" fill="${hc}"/>`;
    const hairFront = {
      short: cap, bun: `<circle cx="0" cy="-192" r="10" fill="${hc}"/>` + cap,
      long: `<path d="M-23 -160Q-24 -188 0 -188Q24 -188 23 -160Q12 -180-2 -172Q-14 -180-23 -160Z" fill="${hc}"/>`,
      curly: `<g fill="${hc}"><circle cx="-16" cy="-174" r="9"/><circle cx="-6" cy="-182" r="10"/><circle cx="7" cy="-182" r="10"/><circle cx="17" cy="-174" r="9"/><circle cx="21" cy="-163" r="6"/><circle cx="-21" cy="-163" r="6"/></g>`,
      white: `<path d="M-24 -156Q-27 -180-12 -186Q-22 -172-18 -154zM24 -156Q27 -180 12 -186Q22 -172 18 -154z" fill="var(--hair1)"/>`, bald: ''
    }[hair] || '';
    const mouth = { smile: '<path d="M-7 -150Q0 -144 7 -150" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" fill="none"/>', open: '<path d="M-7 -151Q0 -139 7 -151Z" fill="var(--ink)"/>',
      o: '<ellipse cx="0" cy="-148" rx="3.2" ry="4" fill="var(--ink)"/>', flat: '<path d="M-6 -149H6" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/>' }[o.face || 'smile'] || '';
    const eyes = o.face === 'sleep' ? '<path d="M-11 -160q3 3 6 0M5 -160q3 3 6 0" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M-5 -149H5" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/>'
      : '<circle cx="-8" cy="-160" r="2.5" fill="var(--ink)"/><circle cx="8" cy="-160" r="2.5" fill="var(--ink)"/>' + mouth;
    const legs = o.dress ? `<rect x="-16" y="-58" width="10" height="58" rx="5" fill="${sk}"/><rect x="6" y="-58" width="10" height="58" rx="5" fill="${sk}"/>`
      : `<rect x="-19" y="-62" width="15" height="62" rx="7" fill="${pants}"/><rect x="4" y="-62" width="15" height="62" rx="7" fill="${pants}"/>`;
    return `<g transform="translate(${o.x} ${o.y || 326}) scale(${o.flip ? -s : s} ${s})">${legs}<ellipse cx="-12" cy="0" rx="12" ry="5" fill="var(--ink)"/><ellipse cx="12" cy="0" rx="12" ry="5" fill="var(--ink)"/>
<path d="M-27 -72Q-27 -134 0 -134Q27 -134 27 -72V-60Q27 -54 21 -54H-21Q-27 -54-27 -60Z" fill="${sh}"/>${o.dress ? `<path d="M-25 -80L-36 -42Q0 -34 36 -42L25 -80Z" fill="${o.dress}"/>` : ''}
${o.apron ? `<path d="M-15 -114H15V-50H-15Z" fill="${o.apron}"/>` : ''}${o.under || ''}${arm(-1, o.armL || 'down')}${arm(1, o.armR || 'down')}
${hairBack}<rect x="-6" y="-146" width="12" height="16" rx="5" fill="${sk}"/><circle cx="0" cy="-160" r="23" fill="${sk}"/>
<circle cx="-23" cy="-158" r="4.5" fill="${sk2}"/><circle cx="23" cy="-158" r="4.5" fill="${sk2}"/>${hairFront}${eyes}<g fill="var(--die)" opacity=".28"><circle cx="-13" cy="-151" r="3.5"/><circle cx="13" cy="-151" r="3.5"/></g>
${o.glasses ? '<g fill="none" stroke="var(--ink)" stroke-width="1.8"><circle cx="-8" cy="-160" r="6.5"/><circle cx="8" cy="-160" r="6.5"/><path d="M-1.5 -160h3"/></g>' : ''}
${o.beard ? `<path d="M-19 -158Q-20 -132 0 -130Q20 -132 19 -158Q14 -146 0 -144Q-14 -146-19 -158Z" fill="${o.beard}"/><path d="M-6 -149Q0 -146 6 -149" stroke="var(--ink)" stroke-width="2" fill="none"/>` : ''}${o.extra || ''}</g>`;
  },
  /* speech bubble; *word* is highlighted. tail l|r|c */
  bubble(x, y, t, o = {}) {
    const w = o.w || Math.round(t.replace(/\*/g, '').length * 7.5 + 30), h = 34, c = o.c ? `var(--${o.c})` : 'var(--card)', tc = o.c ? 'var(--card)' : 'var(--ink)';
    const tx = x + (o.tail === 'r' ? w / 4 : o.tail === 'c' ? 0 : -w / 4), dir = o.tail === 'r' ? 1 : o.tail === 'c' ? 0 : -1, st = o.c ? '' : 'stroke="var(--line)" stroke-width="1.5"';
    const txt = H(t).replace(/\*([^*]+)\*/g, `<tspan fill="${o.c ? 'var(--card)' : 'var(--ac)'}" font-weight="800">$1</tspan>`);
    return `<g><path d="M${tx - 7} ${y + h / 2 - 2}L${tx + 7} ${y + h / 2 - 2}L${tx + dir * 10} ${y + h / 2 + 11}Z" fill="${c}" ${st}/><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="17" fill="${c}" ${st}/>
<path d="M${tx - 6} ${y + h / 2 - 1}H${tx + 6}" stroke="${c}" stroke-width="3"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600" font-size="14.5" fill="${tc}">${txt}</text></g>`;
  },
  tag: (x, y, t, c) => `<g transform="translate(${x} ${y})"><rect x="${-(t.length * 4.7 + 14)}" y="-14" width="${t.length * 9.4 + 28}" height="27" rx="13.5" fill="var(--${c})"/><text y="4.5" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="14" fill="var(--card)">${H(t)}</text></g>`,
  notes: (x, y) => `<g opacity=".9"><path d="M${x} ${y}v-26l14-4v24" stroke="var(--dat)" stroke-width="2.4" fill="none"/><ellipse cx="${x - 4}" cy="${y}" rx="5" ry="4" fill="var(--dat)"/><ellipse cx="${x + 10}" cy="${y - 4}" rx="5" ry="4" fill="var(--dat)"/>
<path d="M${x + 34} ${y - 30}v-20" stroke="var(--akk)" stroke-width="2.4"/><ellipse cx="${x + 30}" cy="${y - 30}" rx="5" ry="4" fill="var(--akk)"/></g>`,
  table: (x, y, w) => `<g><rect x="${x - w / 2}" y="${y}" width="${w}" height="10" rx="4" fill="var(--wood)"/><rect x="${x - w / 2 + 12}" y="${y + 10}" width="8" height="${326 - y - 10}" fill="var(--wood)" opacity=".85"/><rect x="${x + w / 2 - 20}" y="${y + 10}" width="8" height="${326 - y - 10}" fill="var(--wood)" opacity=".85"/></g>`,
  cup: (x, y) => `<g><path d="M${x - 11} ${y - 22}h22l-3 22h-16z" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5"/><path d="M${x + 11} ${y - 17}q9 0 7 8q-2 6-9 5" fill="none" stroke="var(--ink)" stroke-width="1.5"/><path d="M${x - 4} ${y - 28}q4-6 0-12M${x + 4} ${y - 28}q4-6 0-12" stroke="var(--mut)" stroke-width="1.6" fill="none" opacity=".7"/></g>`,
  plate: (x, y) => `<g><path d="M${x - 18} ${y - 5}q18-24 36 0z" fill="var(--nom)"/><circle cx="${x - 6}" cy="${y - 13}" r="3" fill="var(--die)"/><circle cx="${x + 6}" cy="${y - 11}" r="3" fill="var(--das)"/><ellipse cx="${x}" cy="${y - 3}" rx="26" ry="5" fill="var(--card)" stroke="var(--line)" stroke-width="1.5"/></g>`,
  boxes: (x, y) => `<g stroke="var(--ink)" stroke-opacity=".3" stroke-width="1.5"><rect x="${x - 34}" y="${y - 36}" width="68" height="36" rx="3" fill="var(--wood)"/><rect x="${x - 28}" y="${y - 70}" width="56" height="34" rx="3" fill="var(--floor)"/><rect x="${x - 22}" y="${y - 100}" width="44" height="30" rx="3" fill="var(--wood)"/>
<path d="M${x - 34} ${y - 18}h68M${x - 28} ${y - 53}h56M${x - 22} ${y - 85}h44" stroke="var(--card)" stroke-opacity=".6" stroke-width="3"/></g>`,
  cart: (x, y) => `<g><rect x="${x - 40}" y="${y - 104}" width="14" height="34" rx="3" fill="var(--card)" stroke="var(--ac)" stroke-width="2"/><circle cx="${x - 12}" cy="${y - 82}" r="12" fill="var(--die)"/><path d="M${x - 12} ${y - 94}q3-6 8-6" stroke="var(--das)" stroke-width="3" fill="none"/>
<path d="M${x + 2} ${y - 76}l30-34" stroke="var(--nom)" stroke-width="9" stroke-linecap="round"/><circle cx="${x + 26}" cy="${y - 84}" r="9" fill="var(--das)"/>
<path d="M${x - 50} ${y - 76}h84l-9 36h-67z" fill="var(--metal)" opacity=".35"/><path d="M${x - 76} ${y - 92}h16l10 62h70l12-46h-86" fill="none" stroke="var(--metal)" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="${x - 36}" cy="${y - 10}" r="9" fill="var(--ink)"/><circle cx="${x + 18}" cy="${y - 10}" r="9" fill="var(--ink)"/></g>`,
  guitar: (x, y, r = -35) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-4" y="-92" width="8" height="66" rx="2" fill="var(--wood)"/><rect x="-7" y="-104" width="14" height="16" rx="3" fill="var(--ink)"/>
<circle cx="0" cy="-14" r="17" fill="var(--nom)"/><circle cx="0" cy="12" r="22" fill="var(--nom)"/><circle cx="0" cy="-4" r="6" fill="var(--ink)"/><path d="M-2 -92V24M2 -92V24" stroke="var(--card)" stroke-width=".8" opacity=".8"/></g>`,
  car: (x, y, c = 'var(--die)') => `<g><path d="M${x - 78} ${y - 14}v-26q0-10 10-12l26-4l20-24q6-6 16-6h40q10 0 16 8l18 22q24 2 26 14v28z" fill="${c}"/>
<path d="M${x - 34} ${y - 58}l16-20h30v20zM${x + 18} ${y - 58}v-20h22l14 20z" fill="var(--sky1)" opacity=".9"/><circle cx="${x - 44}" cy="${y - 12}" r="15" fill="var(--ink)"/><circle cx="${x - 44}" cy="${y - 12}" r="6" fill="var(--metal)"/><circle cx="${x + 50}" cy="${y - 12}" r="15" fill="var(--ink)"/><circle cx="${x + 50}" cy="${y - 12}" r="6" fill="var(--metal)"/></g>`,
  bus: (x, y) => `<g><rect x="${x - 96}" y="${y - 108}" width="192" height="92" rx="14" fill="var(--nom)"/><rect x="${x - 96}" y="${y - 40}" width="192" height="8" fill="var(--ink)" opacity=".18"/>
<g fill="var(--sky1)"><rect x="${x - 84}" y="${y - 96}" width="36" height="34" rx="5"/><rect x="${x - 42}" y="${y - 96}" width="36" height="34" rx="5"/><rect x="${x}" y="${y - 96}" width="36" height="34" rx="5"/><rect x="${x + 44}" y="${y - 96}" width="40" height="52" rx="5"/></g>
<circle cx="${x - 56}" cy="${y - 14}" r="14" fill="var(--ink)"/><circle cx="${x + 54}" cy="${y - 14}" r="14" fill="var(--ink)"/><rect x="${x - 70}" y="${y - 124}" width="58" height="16" rx="4" fill="var(--ink)" opacity=".85"/><text x="${x - 41}" y="${y - 112}" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="var(--sun)">Linie 7</text></g>`,
  bike: (x, y) => `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="${x - 40}" cy="${y - 26}" r="24" stroke="var(--ink)" stroke-width="4"/><circle cx="${x + 40}" cy="${y - 26}" r="24" stroke="var(--ink)" stroke-width="4"/>
<path d="M${x - 40} ${y - 26}l26-36h40l14 36M${x - 14} ${y - 62}l18 36l36 0M${x + 26} ${y - 62}l-4-14h12M${x - 20} ${y - 70}h14" stroke="var(--akk)" stroke-width="5"/></g>`,
  sign: (x, y, kind = 'P') => `<g><rect x="${x - 3}" y="${y - 150}" width="6" height="150" fill="var(--metal)"/><circle cx="${x}" cy="${y - 168}" r="30" fill="var(--der)" stroke="var(--bad)" stroke-width="8"/><path d="M${x - 20} ${y - 188}l40 40${kind === 'X' ? `M${x + 20} ${y - 188}l-40 40` : ''}" stroke="var(--bad)" stroke-width="8"/></g>`,
  stop: (x, y) => `<g><rect x="${x - 3}" y="${y - 130}" width="6" height="130" fill="var(--metal)"/><circle cx="${x}" cy="${y - 140}" r="20" fill="var(--sun)" stroke="var(--das)" stroke-width="4"/><text x="${x}" y="${y - 134}" text-anchor="middle" font-family="Inter,sans-serif" font-size="17" font-weight="800" fill="var(--das)">H</text></g>`,
  icon: (x, y, t, c) => `<g transform="translate(${x} ${y})"><circle r="26" fill="var(--${c}-s)" stroke="var(--${c})" stroke-width="2"/><text y="6" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="17" fill="var(--${c})">${H(t)}</text></g>`,
  arrow: (d, c = 'var(--ac)') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="2.4" stroke-dasharray="5 6" stroke-linecap="round"/>`,
  dog: (x, y, o = {}) => { const c = o.c || 'var(--wood)', s = o.s || 1;
    return `<g transform="translate(${x} ${y}) scale(${o.flip ? -s : s} ${s})"><path d="M-32 -42q-16 -14 -10 -32" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/>
<rect x="-27" y="-30" width="10" height="30" rx="5" fill="${c}"/><rect x="-12" y="-30" width="10" height="30" rx="5" fill="${c}"/><rect x="12" y="-30" width="10" height="30" rx="5" fill="${c}"/><rect x="25" y="-30" width="10" height="30" rx="5" fill="${c}"/>
<ellipse cx="0" cy="-37" rx="37" ry="18" fill="${c}"/><circle cx="34" cy="-60" r="18" fill="${c}"/><ellipse cx="48" cy="-53" rx="12" ry="8.5" fill="var(--floor)"/><circle cx="58" cy="-56" r="4" fill="var(--ink)"/>
<path d="M23 -74q-12 4 -7 26q9 -6 11 -21z" fill="var(--hair2)"/><circle cx="39" cy="-64" r="2.6" fill="var(--ink)"/><path d="M22 -46q11 9 24 2" stroke="var(--die)" stroke-width="4.5" fill="none"/></g>`; },
  cat: (x, y, o = {}) => { const c = o.c || 'var(--pants)', s = o.s || 1;
    return `<g transform="translate(${x} ${y}) scale(${o.flip ? -s : s} ${s})"><path d="M18 -6q36 -2 26 -36" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="-27" rx="23" ry="28" fill="${c}"/>
<circle cx="0" cy="-64" r="18" fill="${c}"/><path d="M-16 -72l2 -19l13 11zM16 -72l-2 -19l-13 11z" fill="${c}"/><ellipse cx="-6" cy="-66" rx="3" ry="4" fill="var(--sun)"/><ellipse cx="6" cy="-66" rx="3" ry="4" fill="var(--sun)"/>
<path d="M-3 -57l3 3l3 -3" stroke="var(--die)" stroke-width="2" fill="none"/><path d="M-10 -58h-13M-10 -55l-12 4M10 -58h13M10 -55l12 4" stroke="var(--card)" stroke-width="1.2" opacity=".6"/></g>`; },
  bird: (x, y, c = 'var(--akk)') => `<g transform="translate(${x} ${y})"><path d="M-14 2l-14 5l5 -10z" fill="${c}"/><ellipse rx="17" ry="12" fill="${c}"/><circle cx="12" cy="-9" r="9" fill="${c}"/>
<path d="M20 -10l10 3l-10 4z" fill="var(--sun)"/><circle cx="15" cy="-11" r="2" fill="var(--ink)"/><path d="M-4 -3q-9 -15 -22 -8q9 2 11 11z" fill="var(--card)" opacity=".45"/><path d="M-2 11v7M4 11v7" stroke="var(--sun)" stroke-width="2"/></g>`,
  tree: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-9" y="-110" width="18" height="110" rx="6" fill="var(--wood)"/><g fill="var(--hill1)"><circle cx="-34" cy="-122" r="34"/><circle cx="30" cy="-128" r="38"/><circle cx="-2" cy="-166" r="40"/></g><g fill="var(--hill2)" opacity=".7"><circle cx="-14" cy="-176" r="16"/><circle cx="34" cy="-140" r="14"/></g></g>`,
  gift: (x, y, c = 'var(--die)', w = 46) => `<g><rect x="${x - w / 2}" y="${y - w * .8}" width="${w}" height="${w * .8}" rx="4" fill="${c}"/><rect x="${x - w / 2 - 3}" y="${y - w * .8 - 8}" width="${w + 6}" height="11" rx="3" fill="${c}"/>
<rect x="${x - 4}" y="${y - w * .8 - 8}" width="8" height="${w * .8 + 8}" fill="var(--sun)"/><path d="M${x} ${y - w * .8 - 8}q-16 -16 -18 -2q4 6 18 2q16 4 18 -2q-2 -14 -18 2z" fill="var(--sun)"/></g>`,
  jacket: (x, y, c) => `<g><path d="M${x} ${y}v-8q0-6 6-6" stroke="var(--metal)" stroke-width="3" fill="none"/><path d="M${x - 26} ${y + 14}L${x} ${y}L${x + 26} ${y + 14}" stroke="var(--metal)" stroke-width="3" fill="none"/>
<path d="M${x - 24} ${y + 12}L${x - 36} ${y + 66}H${x - 24}L${x - 20} ${y + 40}V${y + 92}H${x + 20}V${y + 40}L${x + 24} ${y + 66}H${x + 36}L${x + 24} ${y + 12}L${x + 8} ${y + 6}L${x} ${y + 24}L${x - 8} ${y + 6}Z" fill="${c}"/><path d="M${x} ${y + 24}V${y + 92}" stroke="var(--card)" stroke-width="1.5" opacity=".6"/></g>`,
  apples: (x, y, n = 5) => Array.from({ length: n }, (_, i) => { const cx = x + (i % 3) * 18 - 18 + (i >= 3 ? 9 : 0), cy = y - 9 - (i >= 3 ? 15 : 0);
    return `<circle cx="${cx}" cy="${cy}" r="10" fill="var(--die)"/><path d="M${cx} ${cy - 10}v-5" stroke="var(--wood)" stroke-width="2"/><ellipse cx="${cx + 4}" cy="${cy - 13}" rx="4" ry="2" fill="var(--das)"/>`; }).join(''),
  bananas: (x, y) => [0, 1, 2].map(i => `<path d="M${x - 24 + i * 6} ${y - 6 - i * 7}q24 14 46 -10q-20 8 -46 4z" fill="var(--sun)" stroke="var(--nom)" stroke-width="1.5"/>`).join(''),
  oranges: (x, y) => [[-14, -9], [6, -9], [26, -9], [-4, -26], [16, -26]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="10" fill="var(--nom)"/>`).join('')
};

/* ---------- text helpers ---------- */
// {n:…} Nominativ, {d:…} Dativ, {a:…} Akkusativ, {e:…} Endung/wichtiger Teil, {v:…} Verb (Position 2), {t:…} Verbteil am Ende
const plain = s => s.replace(/\{[ndaevt]:([^}]*)\}/g, '$1').replace(/\(\(([^|)]*)[^)]*\)\)/g, '$1').replace(/\[\[([^\]|]*)[^\]]*\]\]/g, '$1').replace(/\[|\]/g, '');
const wrapWords = t => H(t).replace(/[A-Za-zÄÖÜäöüß]+/g, w => `<span class="gw">${w}</span>`);
function fmt(s) {
  let out = '', last = 0, m; const re = /\{([ndaevt]):([^}]*)\}/g;
  while ((m = re.exec(s))) {
    const before = s.slice(last, m.index), glued = m[1] === 'e' && /[A-Za-zÄÖÜäöüß]$/.test(before);
    // an ending glued to its stem: keep the whole word tappable as one
    if (glued) { const wm = /[A-Za-zÄÖÜäöüß]+$/.exec(before); out += wrapWords(before.slice(0, wm.index)) + `<span class="gw">${H(wm[0])}<span class="cs e">${H(m[2])}</span></span>`; }
    else out += wrapWords(before) + `<span class="cs ${m[1]}">${m[1] === 'e' ? H(m[2]) : wrapWords(m[2])}</span>`;
    last = re.lastIndex;
  }
  return out + wrapWords(s.slice(last));
}
// highlight markup inside text that may already contain HTML (notes under tables, card texts)
const rich = s => String(s == null ? '' : s).replace(/\{([ndaevt]):([^}]*)\}/g, (m, k, t) => `<span class="cs ${k}">${t}</span>`);
const sayBtn = s => `<button class="gr-say" data-say="${H(plain(s))}" title="Anhören" aria-label="Anhören">${icn('volume-2')}</button>`;
function talk(t) { if (typeof speak === 'function') speak(t); }
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = s => s.replace(/[.,!?;:„“"'»«]/g, ' ').replace(/\s+/g, ' ').trim();

/* ---------- dictionary look-up for tapped words ---------- */
const BASEL = { dem: 'der', den: 'der', des: 'der', die: 'der', das: 'der', einem: 'ein', einen: 'ein', einer: 'ein', eine: 'ein', eines: 'ein',
  mir: 'ich', mich: 'ich', dir: 'du', dich: 'du', ihm: 'er', ihn: 'er', ihnen: 'sie', Ihnen: 'Sie', uns: 'wir', euch: 'ihr', es: 'es',
  bin: 'sein', bist: 'sein', ist: 'sein', sind: 'sein', seid: 'sein', war: 'sein', hast: 'haben', hat: 'haben', habt: 'haben',
  kann: 'können', kannst: 'können', könnt: 'können', muss: 'müssen', musst: 'müssen', müsst: 'müssen', darf: 'dürfen', darfst: 'dürfen', dürft: 'dürfen',
  will: 'wollen', willst: 'wollen', wollt: 'wollen', soll: 'sollen', sollst: 'sollen', sollt: 'sollen', möchte: ['möchten', 'mögen'], möchtest: ['möchten', 'mögen'], möchtet: ['möchten', 'mögen'],
  isst: 'essen', iss: 'essen', gibst: 'geben', gibt: 'geben', gib: 'geben', nimmst: 'nehmen', nimmt: 'nehmen', nimm: 'nehmen', liest: 'lesen', lies: 'lesen', siehst: 'sehen', sieht: 'sehen',
  sprichst: 'sprechen', spricht: 'sprechen', hilfst: 'helfen', hilft: 'helfen', hilf: 'helfen', triffst: 'treffen', trifft: 'treffen', vergisst: 'vergessen', fährst: 'fahren', fährt: 'fahren',
  schläfst: 'schlafen', schläft: 'schlafen', läufst: 'laufen', läuft: 'laufen', trägst: 'tragen', trägt: 'tragen', wäscht: 'waschen', hält: 'halten', sei: 'sein', seien: 'sein', weißt: 'wissen', weiß: 'wissen' };
function findWord(w) {
  if (typeof WIDX === 'undefined' || !WIDX.size) return null;
  const L = Object.assign({}, BASEL, (cur && cur.lemmas) || {});
  const lw = w.toLowerCase(), cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const c = [].concat(L[w] || [], w, L[lw] || [], lw, cap(lw), lw + 'en', lw + 'n');
  for (const suf of ['st', 'est', 't', 'et', 'e', 'en', 'n', 'em', 'er', 'es', 's']) if (lw.endsWith(suf) && lw.length - suf.length >= 3) {
    const st = lw.slice(0, -suf.length); c.push(st + 'en', st + 'n', st, cap(st), cap(st) + 'e');
  }
  for (const x of c) if (x && WIDX.has(x)) return WIDX.get(x);
  return null;
}
function closePop() { const p = $('grpop'); if (p) p.remove(); }
function pop(el) {
  closePop();
  const w = el.textContent, i = findWord(w), r = el.getBoundingClientRect(), d = document.createElement('div');
  d.id = 'grpop'; d.className = 'gr-pop';
  if (typeof E === 'undefined' || !E.length) d.innerHTML = `<p style="margin:0">Das Wörterbuch lädt noch …</p>`;
  else if (i == null) d.innerHTML = `<div class="hw">${H(w)}</div><p>Kein eigener Eintrag – vielleicht eine gebeugte Form.</p><a class="btn sm" href="#/" onclick="setTimeout(()=>{const q=document.getElementById('q');if(q){q.value=${H(JSON.stringify(w))};q.dispatchEvent(new Event('input'))}},60)">${icn('search')} Suchen</a>`;
  else {
    const e = E[i], g = typeof gloss === 'function' ? gloss(e) : '';
    const ar = e.ar ? `<span style="color:${typeof gcol === 'function' ? gcol(e.ar) : 'inherit'}">${H(e.ar)}</span> ` : '';
    d.innerHTML = `<div class="hw">${ar}${H(plainW ? plainW(e.w) : e.w)}<button class="gr-say" onclick="say(${i},this)" title="Anhören">${icn('volume-2')}</button></div>
      <div class="ps">${H((typeof POSL !== 'undefined' && POSL[e.ps]) || e.ps || '')}</div><p>${H(g || (typeof FULL !== 'undefined' && !FULL ? 'Bedeutung wird geladen …' : ''))}</p>
      <a class="btn sm primary" href="#/w/${encodeURIComponent(e.w)}">${icn('book-open')} Im Wörterbuch öffnen</a>`;
  }
  document.body.appendChild(d);
  const W = d.offsetWidth, left = Math.max(12, Math.min(window.scrollX + r.left + r.width / 2 - W / 2, window.scrollX + document.documentElement.clientWidth - W - 12));
  d.style.left = left + 'px'; d.style.top = (window.scrollY + r.bottom + 8) + 'px';
  icons();
}

/* ---------- results: local + Supabase ---------- */
const LKEY = 'gd_gram';
function store() { try { return JSON.parse(localStorage.getItem(LKEY) || 'null') || { att: [] }; } catch (e) { return { att: [] }; } }
function save(s) { try { localStorage.setItem(LKEY, JSON.stringify(s)); } catch (e) {} }
const acct = () => window.ACCT && ACCT.user && ACCT.user();
let remote = null, noTable = false;            // results from the database (all devices)
function attempts() {
  const me = acct(), loc = store().att.filter(a => !a.uid || (me && a.uid === me.id) || (!me && !a.uid));
  if (!remote) return loc;
  const seen = new Set(remote.map(a => a.at));
  return remote.concat(loc.filter(a => !seen.has(a.at)));
}
function best(ch, ex) {
  let b = null; for (const a of attempts()) if (a.ch === ch && a.ex === ex) { if (!b || a.score / a.total > b.score / b.total) b = a; }
  return b;
}
function record(a) {
  const s = store(), me = acct(); a.uid = me ? me.id : null; a.sent = false; s.att.push(a); if (s.att.length > 2000) s.att = s.att.slice(-2000); save(s); sync();
}
let syncing = false;
async function sync() {
  const me = acct(); if (!me || noTable || syncing || !ACCT.api) return;
  const s = store();
  // attempts made while signed out are given to the account that signs in on this device
  const todo = s.att.filter(a => !a.sent && (!a.uid || a.uid === me.id)); if (!todo.length) return;
  syncing = true;
  try {
    await ACCT.api('/rest/v1/grammar_results', { method: 'POST', token: await ACCT.token(), headers: { Prefer: 'return=minimal' },
      body: todo.map(a => ({ chapter: a.ch, exercise: a.ex, score: a.score, total: a.total, passed: a.passed, answers: a.ans || null, created_at: new Date(a.at).toISOString() })) });
    const s2 = store(); s2.att.forEach(a => { if (todo.some(t => t.at === a.at)) { a.sent = true; a.uid = me.id; } }); save(s2);
    if (remote) remote = remote.concat(todo.map(a => Object.assign({}, a, { uid: me.id })));
  } catch (e) { if (e && (e.status === 404 || e.code === 'PGRST205' || e.code === '42P01')) noTable = true; }
  syncing = false;
}
async function pull() {
  const me = acct(); if (!me || noTable || !ACCT.api) { remote = null; return; }
  try {
    const rows = await ACCT.api('/rest/v1/grammar_results?select=chapter,exercise,score,total,passed,created_at&order=created_at.asc&limit=5000', { token: await ACCT.token() });
    remote = rows.map(r => ({ ch: r.chapter, ex: r.exercise, score: r.score, total: r.total, passed: r.passed, at: Date.parse(r.created_at), uid: me.id }));
  } catch (e) { if (e && (e.status === 404 || e.code === 'PGRST205' || e.code === '42P01')) noTable = true; remote = null; }
}
function chapterProgress(c) {
  const g = c.exercises.filter(x => x.graded !== false); let passed = 0;
  for (const x of g) { const b = best(c.n, x.id); if (b && b.score / b.total >= PASS) passed++; }
  return { passed, total: g.length };
}
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
function ring(p, size = 46) {
  const r = size / 2 - 4, C = 2 * Math.PI * r;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="5"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--ok)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p / 100)}" transform="rotate(-90 ${size / 2} ${size / 2})" style="transition:stroke-dashoffset .6s"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="${size / 4}" font-weight="700" fill="var(--fg)" font-family="Inter,sans-serif">${p}%</text></svg>`;
}

/* ---------- overview ---------- */
let filt = { lv: '', q: '' };
function overview() {
  const done = Object.keys(READY).filter(n => +n <= 100).length;
  const passedEx = new Set(attempts().filter(a => a.score / a.total >= PASS).map(a => a.ch + '/' + a.ex)).size;
  V().innerHTML = `
  <section class="gr-top"><div><p class="gr-eyebrow">A1 · A2 · B1</p><h1>Grammatik</h1>
    <p>Alle Themen bis B1 – mit Bildern, Beispielen zum Anhören und Übungen, die sofort sagen, was richtig ist.</p>
    <div class="gr-stats"><span class="gr-stat"><b>${TOTAL}</b>Kapitel</span><span class="gr-stat"><b>${done}</b>schon fertig</span><a class="gr-stat" href="#/g/fortschritt" style="text-decoration:none"><b>${passedEx}</b>Übungen bestanden →</a></div></div>
    <div class="gr-topart">${ART.cover()}</div></section>
  <a class="gr-feat" href="#/g/1"><span class="th" id="grfeat"></span><span><span class="gr-lv A1">A1</span> <span class="gr-eyebrow" style="display:inline">Hier anfangen</span><b>Kapitel 1: Personalpronomen</b><p>Alle 85 Kapitel von A1 bis B1 – mit Erklärungen, Beispielen, Übungen, Sprechtraining und Spiel. Dazu Verblisten mit Trainer.</p></span></a>
  <div class="gr-filter">${['', 'A1', 'A2', 'B1'].map(l => `<button class="gr-chip${filt.lv === l ? ' on' : ''}" data-lv="${l}">${l || 'Alle'}</button>`).join('')}
    <input id="grq" placeholder="Thema suchen, z. B. Perfekt" value="${H(filt.q)}" autocomplete="off"></div>
  <div id="grlist"></div>`;
  list();
  V().querySelectorAll('[data-lv]').forEach(b => b.onclick = () => { filt.lv = b.dataset.lv; V().querySelectorAll('[data-lv]').forEach(x => x.classList.toggle('on', x === b)); list(); });
  $('grq').oninput = e => { filt.q = e.target.value; list(); };
  icons();
}
function list() {
  const f = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), q = f(filt.q.trim());
  let html = '';
  for (const g of GROUPS) {
    const cs = g.ch.filter(c => (!filt.lv || c[3] === filt.lv) && (!q || f(c[1] + ' ' + c[2] + ' ' + g.t).includes(q)));
    if (!cs.length) continue;
    html += `<section class="gr-grp" style="--h:${g.h}"><h2><span class="badge">${icn(g.ic)}</span>${H(g.t)}<small>${g.ch.length} Kapitel</small></h2><div class="gr-cards">` +
      cs.map(c => {
        const ok = READY[c[0]], body = `<span class="gr-num">${c[0] > 100 ? icn('book-marked') : c[0]}</span><span class="gr-ct"><b>${H(c[1])}</b><small>${H(c[2])}</small></span><span class="gr-lv ${c[3]}">${c[3]}</span>`;
        if (!ok) return `<div class="gr-card soon" title="Kommt bald">${body}</div>`;
        const pr = CH[c[0]] ? chapterProgress(CH[c[0]]) : null, all = pr && pr.passed === pr.total;
        return `<a class="gr-card ready" href="#/g/${c[0]}">${body}${all ? `<span class="gr-done" title="Alle Übungen bestanden">${icn('circle-check')}</span>` : ''}</a>`;
      }).join('') + `</div></section>`;
  }
  $('grlist').innerHTML = html || `<p class="sub" style="margin:1rem 0">Kein Thema gefunden.</p>`;
  icons();
}

/* ---------- progress page ---------- */
async function progressView() {
  V().innerHTML = `<div class="row" style="margin-bottom:.6rem"><a class="btn sm" href="#/g">${icn('arrow-left')} Grammatik</a></div>
    <h1 class="page">Mein Fortschritt</h1><div id="grpv"><div class="loading"><div class="spin"></div>Ergebnisse werden geladen …</div></div>`;
  icons();
  await Promise.all(Object.keys(READY).map(n => loadChapter(+n).catch(() => {})));
  await pull(); if (!location.hash.startsWith('#/g/fortschritt')) return;
  const me = acct(), at = attempts();
  let rows = '';
  for (const n of Object.keys(READY).map(Number)) {
    const c = CH[n]; if (!c) continue;
    rows += `<tr class="gr-ph"><td colspan="5"><a href="#/g/${n}"><b>${n > 100 ? 'Nachschlagen' : 'Kapitel ' + n}</b> · ${H(c.title)}</a> <span class="gr-lv ${c.level}">${c.level}</span></td></tr>`;
    for (const x of c.exercises.filter(x => x.graded !== false)) {
      const mine = at.filter(a => a.ch === n && a.ex === x.id), b = best(n, x.id), last = mine[mine.length - 1];
      const p = b ? pct(b.score, b.total) : 0, ok = b && b.score / b.total >= PASS;
      rows += `<tr><td>${H(x.title)}</td>
        <td>${b ? `<div class="gr-bar"><i class="${ok ? '' : 'f'}" style="width:${p}%"></i></div><small>${p} % (${b.score}/${b.total})</small>` : '<small class="muted">noch nicht geübt</small>'}</td>
        <td class="hide-s">${mine.length}</td><td class="hide-s"><small>${last ? new Date(last.at).toLocaleDateString('de-DE') : '–'}</small></td>
        <td>${b ? (ok ? `<span class="gr-ueb pass">${icn('check')} bestanden</span>` : `<span class="gr-ueb fail">unter ${Math.round(PASS * 100)} %</span>`) : ''}</td></tr>`;
    }
  }
  $('grpv').innerHTML = `<p class="sub">${me ? 'Deine Ergebnisse werden in deinem Konto gespeichert und sind auf allen Geräten da.' : 'Du bist nicht angemeldet: Die Ergebnisse sind nur in diesem Browser gespeichert. Melde dich an, dann werden sie in deinem Konto gesichert.'}
    Bestanden ist eine Übung ab ${Math.round(PASS * 100)} % richtigen Antworten.</p>
    ${!me && window.ACCT ? `<p><button class="btn primary" onclick="ACCT.open()">${icn('user-round')} Anmelden</button></p>` : ''}
    ${noTable && me ? `<p class="gr-note" style="display:block">Die Ergebnis-Tabelle ist noch nicht eingerichtet – die Ergebnisse bleiben vorerst in diesem Browser.</p>` : ''}
    <div class="gr-tblw"><table class="gr-ptab"><thead><tr><th>Übung</th><th>Bestes Ergebnis</th><th class="hide-s">Versuche</th><th class="hide-s">Zuletzt</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  icons();
}

/* ---------- chapter ---------- */
function loadChapter(n) {
  if (CH[n]) return Promise.resolve(CH[n]);
  return new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = GRAM.base + 'k' + n + '.js?v=' + VER;
    s.onload = () => CH[n] ? res(CH[n]) : rej(new Error('leer')); s.onerror = () => rej(new Error('Netz'));
    document.head.appendChild(s);
  });
}
async function chapter(n) {
  if (!READY[n]) { V().innerHTML = `<div class="row" style="margin-bottom:.6rem"><a class="btn sm" href="#/g">${icn('arrow-left')} Grammatik</a></div>
    <div class="empty"><span class="em">${icn('hourglass')}</span><h1 class="page">Kapitel ${n} kommt bald</h1><p class="sub">Dieses Kapitel ist noch in Arbeit.</p></div>`; icons(); return; }
  if (!CH[n]) { V().innerHTML = `<div class="loading"><div class="spin"></div>Kapitel wird geladen …</div>`;
    try { await loadChapter(n); } catch (e) { V().innerHTML = `<div class="empty"><span class="em">⚠️</span>Das Kapitel konnte nicht geladen werden. Bitte prüfe die Internetverbindung.</div>`; return; } }
  if (location.hash !== '#/g/' + n) return;
  render(CH[n]);
  pull().then(() => { if (cur === CH[n] && location.hash === '#/g/' + n) { refreshBadges(); sync(); } });
}
function render(c) {
  cur = c;
  for (const x of c.exercises) if (x.gen) x.items = x.gen();
  if (c.speak && c.speak.gen) c.speak.items = c.speak.gen(); const info = chInfo(c.n), pr = chapterProgress(c);
  const blocks = c.understand.map(block).join('');
  V().innerHTML = `<div class="row" style="margin-bottom:.6rem"><a class="btn sm" href="#/g">${icn('arrow-left')} Grammatik</a></div>
  <article class="gr-ch">
   <div class="gr-hero"><div>
     <p class="gr-eyebrow">${c.n > 100 ? 'Nachschlagen und trainieren' : `Kapitel ${c.n} · ${H(c.group)}`} · <span class="gr-lv ${c.level}">${c.level}</span></p>
     <h1>${H(c.title)}</h1><p class="gr-kick">${H(c.kicker)}</p><p class="gr-intro">${rich(c.intro)}</p>
     <div class="gr-prog" id="grprog">${progHTML(pr)}</div>
     <div class="row" style="margin-top:.8rem"><button class="btn sm" onclick="GRAM.practice('solo')">${icn('gamepad-2')} Im Spiel üben</button></div></div>
     <figure class="gr-art">${typeof c.art === 'function' ? c.art(K) : ART[c.art] ? ART[c.art]() : ''}<figcaption><span>${fmt(c.hero)}</span>${sayBtn(c.hero)}</figcaption></figure>
   </div>
   <nav class="gr-toc"><a href="#grs-v" data-jump>${icn('lightbulb')} Verstehen</a><a href="#grs-b" data-jump>${icn('quote')} Beispiele</a><a href="#grs-u" data-jump>${icn('pencil')} Üben</a><a href="#grs-s" data-jump>${icn('mic')} Sprechen</a></nav>
   <section class="gr-sec" id="grs-v"><h2><span class="gr-sn">1</span>Verstehen</h2>${blocks}</section>
   <section class="gr-sec" id="grs-b"><h2><span class="gr-sn">2</span>Beispiele</h2>
     <div class="gr-legend"><span class="n">Nominativ – wer?</span><span class="d">Dativ – wem?</span><span class="a">Akkusativ – was?</span></div>
     <ul class="gr-exs">${c.examples.map(s => `<li><span class="s">${fmt(s)}</span>${sayBtn(s)}</li>`).join('')}</ul>
     <p class="gr-tip">${icn('mouse-pointer-click')} Tippe auf ein Wort, um es im Wörterbuch nachzuschlagen.</p></section>
   <section class="gr-sec" id="grs-u"><h2><span class="gr-sn">3</span>Üben</h2>
     <p class="sub" style="margin:-.3rem 0 1rem">Bestanden ab ${Math.round(PASS * 100)} % richtigen Antworten. Die Lösung kannst du nach dem ersten Prüfen ansehen.</p>
     <div class="gr-play"><span>${icn('gamepad-2')} Übe dieses Kapitel auch im Spiel:</span><button class="btn sm primary" onclick="GRAM.practice('solo')">${icn('user-round')} Allein spielen</button><button class="btn sm" onclick="GRAM.practice('host')">${icn('users')} Live mit Gruppe</button></div>
     ${c.exercises.map((x, i) => exHTML(x, i + 1)).join('')}</section>
   <section class="gr-sec" id="grs-s"><h2><span class="gr-sn">4</span>Sprechen</h2>${speakHTML(c.speak)}</section>
  </article>`;
  wire(c); icons();
}
function progHTML(pr) {
  const p = pct(pr.passed, pr.total);
  return `${ring(p)}<span><b>${pr.passed} von ${pr.total}</b> Übungen bestanden<br>${pr.passed === pr.total ? 'Kapitel geschafft! 🎉' : (acct() ? 'Ergebnisse werden in deinem Konto gespeichert.' : '<a href="#/g/fortschritt">Wo werden meine Ergebnisse gespeichert?</a>')}</span>`;
}

/* explanation blocks */
function block(b) {
  if (b.type === 'q3') return `<div class="gr-cream"><h3>${H(b.title)}</h3><div class="gr-q3">${b.items.map(i =>
    `<div class="gr-qc ${i.k}"><span class="gr-qi">${icn(i.icon)}</span><b class="gr-qq">${H(i.q)}</b><span class="gr-qk">${H(i.c)}</span><p>${H(i.t)}</p><p class="gr-qex">${fmt(i.ex)}</p></div>`).join('')}</div></div>`;
  if (b.type === 'slots') {
    const slot = s => `<div class="gr-slot ${s[1]}"><span>${wrapWords(s[0])}</span><small>${H(s[2])}</small></div>`;
    const arrow = `<svg viewBox="0 0 120 22"><path d="M110 4Q60 26 10 6" fill="none" stroke="var(--dat)" stroke-width="2" stroke-dasharray="4 4" marker-end="url(#grarr2)"/><defs><marker id="grarr2" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--dat)"/></marker></defs></svg>`;
    const row = r => { const i = r.findIndex(s => s[1] === 'd'); if (i < 0 || r[i + 1]?.[1] !== 'a') return `<div class="gr-slots">${r.map(slot).join('')}</div>`;
      return `<div class="gr-slots">${r.slice(0, i).map(slot).join('')}<div class="gr-pair"><div class="gr-pairin">${slot(r[i])}${slot(r[i + 1])}</div><div class="gr-give">${arrow}<span>die Person bekommt die Sache</span></div></div>${r.slice(i + 2).map(slot).join('')}</div>`; };
    return `<div class="gr-cream"><h3>${H(b.title)}</h3>${b.rows.map(row).join('')}<p class="gr-foot">${rich(b.note)}</p></div>`;
  }
  if (b.type === 'table') {
    const keys = Object.keys(b.sets), id = 'grt' + Math.random().toString(36).slice(2, 7);
    return `<div class="gr-cream"><h3>${H(b.title)}</h3><div class="gr-tsw" data-tbl="${id}">${keys.map((k, i) => `<button class="gr-chip${i ? '' : ' on'}" data-set="${k}">${k}</button>`).join('')}</div>
      <div class="gr-tblw" id="${id}">${tableHTML(b, keys[0])}</div><p class="gr-foot" style="margin-top:.7rem">${rich(b.foot)}</p></div>`;
  }
  if (b.type === 'merk') return `<div class="gr-merk"><span class="ico">${icn('lightbulb')}</span><p><small>Merksatz</small>${fmt(b.text)}</p></div>`;
  if (b.type === 'machine') return `<div class="gr-cream gr-mach" data-mach='${H(JSON.stringify(b))}'><h3>${H(b.title)}</h3><p class="gr-foot" style="margin:-.3rem 0 .8rem">${H(b.intro)}</p>
      <div class="gr-msw"><button class="gr-tg d" data-sw="d">${H(b.d[0])} → ${H(b.d[1])}<i class="k"></i></button><button class="gr-tg a" data-sw="a">${H(b.a[0])} → ${H(b.a[1])}<i class="k"></i></button></div>
      <div class="gr-msent"></div><div class="gr-mrule">${icn('info')}<span></span></div></div>`;
  if (b.type === 'verbs') return `<div class="gr-cream"><h3>${H(b.title)}</h3><p class="gr-pat">${H(b.pattern)}</p><div class="gr-verbs">${b.items.map(v =>
      `<div class="gr-verb"><b><span class="gw">${H(v[0])}</span></b><span class="ex">${fmt(v[1])}</span></div>`).join('')}</div></div>`;
  if (b.type === 'cards') return `<div class="gr-cream"${b.min ? ` style="--min:${b.min}"` : ''}>${b.title ? `<h3>${H(b.title)}</h3>` : ''}<div class="gr-cards2">${b.items.map(i =>
    `<div class="gr-c2 k-${i.k || 'ac'}"><span class="tt">${i.icon ? icn(i.icon) : ''}${H(i.t)}</span>${i.s ? `<span class="s">${H(i.s)}</span>` : ''}${i.p ? `<p>${rich(i.p)}</p>` : ''}${i.ex ? `<p class="ex">${fmt(i.ex)}</p>` : ''}${i.ws ? `<div class="ws">${i.ws.map(w => `<span class="gw">${H(w)}</span>`).join('')}</div>` : ''}</div>`).join('')}</div>${b.foot ? `<p class="gr-foot" style="margin-top:.7rem">${rich(b.foot)}</p>` : ''}</div>`;
  if (b.type === 'grid') return `<div class="gr-cream"><h3>${H(b.title)}</h3><div class="gr-tblw"><table class="gr-tbl gr-grid">${b.head ? `<thead><tr>${b.head.map((h, i) => `<th${i === 0 && b.label !== false ? ' class="l"' : ''}>${H(h)}</th>`).join('')}</tr></thead>` : ''}<tbody>${b.rows.map((r, ri) =>
    `<tr${(b.hl || []).includes(ri) ? ' class="hl"' : ''}>${r.map((c, i) => i === 0 && b.label !== false ? `<td class="l">${H(c)}</td>` : `<td>${/<\w/.test(c) ? c : fmt(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${b.foot ? `<p class="gr-foot" style="margin-top:.7rem">${rich(b.foot)}</p>` : ''}</div>`;
  if (b.type === 'conj') { const ks = Object.keys(b.verbs);
    return `<div class="gr-cream gr-conj" data-conj="${H(JSON.stringify(b))}"><h3>${H(b.title)}</h3>${b.intro ? `<p class="gr-foot" style="margin:-.3rem 0 .7rem">${rich(b.intro)}</p>` : ''}<div class="gr-cv">${ks.map((k, i) => `<button class="gr-chip${i ? '' : ' on'}" data-verb="${H(k)}">${H(k)}</button>`).join('')}</div><div class="gr-conjt"></div><p class="gr-cnote"></p></div>`; }
  if (b.type === 'reflist') { const id = 'grl' + Math.random().toString(36).slice(2, 7);
    return `<div class="gr-cream gr-ref"><h3>${H(b.title)}</h3>${b.intro ? `<p class="gr-foot" style="margin:-.3rem 0 .7rem">${rich(b.intro)}</p>` : ''}<input class="gr-refq" data-list="${id}" placeholder="Suchen …" autocomplete="off">
      <div class="gr-tblw gr-refw"><table class="gr-tbl gr-grid" id="${id}"><thead><tr>${b.head.map(h => `<th>${H(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r =>
      `<tr data-s="${H(r.map(plain).join(' ').toLowerCase())}">${r.map((c, i) => `<td${i === 0 ? ' class="gr-ref0"' : ''}>${i === 0 ? `<span class="gw">${H(plain(c))}</span>` : fmt(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="gr-foot gr-refn" style="margin-top:.5rem">${b.rows.length} Einträge</p></div>`; }
  if (b.type === 'note') return `<div class="gr-note">${icn('triangle-alert')}<p><b class="t">${H(b.title)}</b>${fmt(b.text)}</p></div>`;
  return '';
}
function tableHTML(b, k) {
  const rows = b.sets[k], cls = ['n', 'a', 'd'], lab = ['Nominativ', 'Akkusativ', 'Dativ'];
  const cell = (t, r, col) => {
    const [art, ...rest] = t.split(' '), nom = rows[0][col].split(' ')[0], chg = r > 0 && art !== nom && art !== '–';
    const noun = rest.join(' ').replace(/\+n$/, '<b class="plusn">n</b>');
    return `<td><span class="art${chg ? ' chg' : ''}">${H(art)}</span> ${noun}</td>`;
  };
  return `<table class="gr-tbl"><thead><tr><th></th>${b.head.map(h => `<th>${H(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) =>
    `<tr class="${cls[i]}"><th><span class="lf">${lab[i]}</span><span class="ls">${lab[i].slice(0, 3)}.</span></th>${r.map((t, j) => cell(t, i, j)).join('')}</tr>`).join('')}</tbody></table>`;
}
const PERS = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];
function conjForm(inf, f) {
  if (/\{e:/.test(f)) return f.replace(/\{e:([^}]*)\}/g, (m, x) => `<span class="end">${H(x)}</span>`).replace(/^([^<]*)/, m => H(m));
  const stem = inf.replace(/(e?n)$/, ''); let i = 0; while (i < f.length && i < stem.length && f[i] === stem[i]) i++;
  if (i === 0) return `<span class="end">${H(f)}</span>`;
  return H(f.slice(0, i)) + (i < f.length ? `<span class="end">${H(f.slice(i))}</span>` : '');
}
function conj(el) {
  const b = JSON.parse(el.dataset.conj), out = el.querySelector('.gr-conjt'), note = el.querySelector('.gr-cnote');
  const draw = k => { const v = b.verbs[k], forms = Array.isArray(v) ? v : v.f;
    out.innerHTML = forms.map((f, i) => `<div style="animation-delay:${i * 35}ms"><b>${PERS[i]}</b><span>${conjForm(k, f)}</span><button class="gr-say" data-say="${H(PERS[i].split('/')[0] + ' ' + f.replace(/\{e:([^}]*)\}/g, '$1'))}" style="margin-left:auto;width:28px;height:28px">${icn('volume-2')}</button></div>`).join('');
    note.innerHTML = Array.isArray(v) ? '' : rich(v.n || ''); icons(); };
  el.querySelectorAll('[data-verb]').forEach(c => c.onclick = () => { el.querySelectorAll('[data-verb]').forEach(x => x.classList.toggle('on', x === c)); draw(c.dataset.verb); });
  draw(Object.keys(b.verbs)[0]);
}
function machine(el) {
  const b = JSON.parse(el.dataset.mach), st = { d: false, a: false }, sent = el.querySelector('.gr-msent'), rule = el.querySelector('.gr-mrule span');
  const draw = first => {
    const pD = st.d, pA = st.a, aFirst = pA && (!pD || pA);   // pronoun object before a noun; two pronouns: accusative first
    const order = (pA && !pD) || (pA && pD) ? ['a', 'd'] : ['d', 'a'];
    const key = (pD ? 'p' : 'n') + (pA ? 'p' : 'n');
    const before = {}; if (!first) sent.querySelectorAll('.w').forEach(w => before[w.dataset.k] = w.getBoundingClientRect().left);
    const word = k => `<span class="w ${k === 'd' || k === 'a' ? k : ''}" data-k="${k}">${H(k === 'd' ? b.d[+pD] : k === 'a' ? b.a[+pA] : k === 's' ? b.start : b.end)}</span>`;
    sent.innerHTML = word('s') + order.map(word).join('') + `<span class="w" data-k="e" style="padding-left:0;margin-left:-.5rem">${H(b.end)}</span>${sayBtn(b.start + ' ' + order.map(k => k === 'd' ? b.d[+pD] : b.a[+pA]).join(' ') + b.end)}`;
    rule.textContent = b.rules[key === 'nn' ? 'nn' : key === 'pn' ? 'pn' : key === 'np' ? 'np' : 'pp'];
    if (!first) sent.querySelectorAll('.w').forEach(w => { const x = before[w.dataset.k]; if (x == null) return; const dx = x - w.getBoundingClientRect().left;
      if (dx) { w.style.transition = 'none'; w.style.transform = `translateX(${dx}px)`; requestAnimationFrame(() => requestAnimationFrame(() => { w.style.transition = ''; w.style.transform = ''; })); } });
    icons(); void aFirst;
  };
  el.querySelectorAll('[data-sw]').forEach(t => t.onclick = () => { const k = t.dataset.sw; st[k] = !st[k]; t.classList.toggle('on', st[k]); draw(false); });
  draw(true);
}

/* ---------- exercises ---------- */
function exHTML(x, n) {
  const items = x.items.map((it, i) => `<div class="gr-it" data-i="${i}"><span class="gr-in">${i + 1}</span><div class="gr-ib">${itemHTML(x, it, i)}<div class="gr-sol" hidden></div></div></div>`).join('');
  const legend = x.type === 'cases' ? `<div class="gr-legend"><span class="n">1× Nominativ</span><span class="d">2× Dativ</span><span class="a">3× Akkusativ</span></div>` : '';
  return `<div class="gr-ue" id="ue-${x.id}" data-ex="${x.id}" data-type="${x.type}"><div class="gr-ueh"><span class="gr-uen">Übung ${n}</span><h3>${H(x.title)}</h3><span id="ueb-${x.id}">${badgeHTML(x)}</span></div>
    <p class="gr-uei">${H(x.instr)}</p>${legend}<div class="gr-items">${items}</div>
    <div class="gr-uef"><button class="btn primary gr-btn" data-act="check">${icn('check')} Prüfen</button>
    ${x.type === 'free' ? '' : `<button class="btn gr-btn" data-act="show" disabled title="Erst nach dem ersten Prüfen">${icn('eye')} Lösung zeigen</button>`}
    <button class="btn gr-btn" data-act="reset">${icn('rotate-ccw')} Neu</button><span class="gr-res"></span></div></div>`;
}
function badgeHTML(x) {
  if (x.graded === false) return `<span class="gr-ueb free">ohne Note</span>`;
  const b = cur && best(cur.n, x.id); if (!b) return '';
  const p = pct(b.score, b.total);
  return b.score / b.total >= PASS ? `<span class="gr-ueb pass">${icn('circle-check')} bestanden · ${p} %</span>` : `<span class="gr-ueb fail">bestes Ergebnis ${p} %</span>`;
}
function itemHTML(x, it, i) {
  if (x.type === 'cases') return it.replace(/\{([nda]):([^}]*)\}|([^{]+)/g, (m, k, t, p) => p != null ? H(p) : `<button class="gr-tag" data-k="${k}" data-st="" data-lb="">${H(t)}</button>`);
  if (x.type === 'choice') return it.replace(/\(\(([^)]*)\)\)|([^(]+|\()/g, (m, opts, p) => {
    if (p != null) return H(p); const o = opts.split('|');
    return `<span class="gr-gap" data-ok="${H(o[0])}">${shuffle(o).map(v => `<button>${H(v)}</button>`).join('')}</span>`; });
  if (x.type === 'order') { let t = shuffle(it.tiles); for (let k = 0; k < 5 && t.join(' ') === it.tiles.join(' '); k++) t = shuffle(it.tiles);
    return `<div class="gr-line"></div><div class="gr-pool">${t.map(v => `<button class="gr-tile">${H(v)}</button>`).join('')}</div><span class="gr-end" hidden>${H(it.end)}</span>`; }
  if (x.type === 'type') return `<div class="gr-q">${H(it.q).replace(/\[([^\]]*)\]/g, '<mark>$1</mark>')}</div>
    <div class="gr-tl"><span>${H(it.pre)}</span><input autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Antwort ${i + 1}"><span>${H(it.end)}</span></div>`;
  if (x.type === 'fill') return it.replace(/^\(([^)]*)\)\s*/, (m, h) => `<span class="gr-hint">${H(h)}</span>`).replace(/\[\[([^\]]*)\]\]|([^[]+|\[)/g, (m, a, p) => {
    if (p != null) return p.startsWith('<span class="gr-hint">') ? p : H(p); const ok = a.split('|');
    return `<input class="gr-fill" data-ok="${H(JSON.stringify(ok))}" style="--n:${Math.max(...ok.map(o => o.length))}" autocomplete="off" autocapitalize="off" spellcheck="false">`; });
  if (x.type === 'free') return `<div class="gr-q">${H(it.q)}</div><div class="gr-free"><textarea rows="2" placeholder="${H(it.ph)}" spellcheck="false"></textarea></div><div class="gr-fb"></div>`;
  return '';
}
const exState = {};       // exercise id -> {shown:bool}
function wire(c) {
  const root = V().querySelector('.gr-ch');
  root.querySelectorAll('.gr-mach').forEach(machine);
  root.querySelectorAll('.gr-conj').forEach(conj);
  root.querySelectorAll('.gr-refq').forEach(q => q.oninput = () => { const t = q.value.trim().toLowerCase(), tb = $(q.dataset.list); let n = 0;
    tb.querySelectorAll('tbody tr').forEach(tr => { const show = !t || tr.dataset.s.includes(t); tr.hidden = !show; if (show) n++; }); q.closest('.gr-ref').querySelector('.gr-refn').textContent = n + ' Einträge'; });
  root.querySelectorAll('.gr-tsw').forEach(sw => sw.querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
    sw.querySelectorAll('[data-set]').forEach(x => x.classList.toggle('on', x === b));
    const blk = c.understand.find(x => x.type === 'table'); $(sw.dataset.tbl).innerHTML = tableHTML(blk, b.dataset.set); }));
  c.exercises.forEach(x => exState[x.id] = { shown: false, checked: false });
}
function onClick(ev) {
  const t = ev.target;
  if (!t.closest) return;
  if (!t.closest('#grpop') && !t.closest('.gw')) closePop();
  const ch = t.closest('.gr-ch'); if (!ch || !cur) return;
  const sb = t.closest('[data-say]'); if (sb) { talk(sb.dataset.say); return; }
  const j = t.closest('[data-jump]'); if (j) { ev.preventDefault(); const el = document.querySelector(j.getAttribute('href')); if (el) el.scrollIntoView({ behavior: 'smooth' }); return; }
  const gw = t.closest('.gw'); if (gw && !t.closest('button')) { pop(gw); return; }
  const ue = t.closest('.gr-ue'); if (!ue) { spk(t); return; }
  const x = cur.exercises.find(e => e.id === ue.dataset.ex), S = exState[x.id];
  const act = t.closest('[data-act]');
  if (act) { if (act.disabled) return; if (act.dataset.act === 'check') check(x, ue); else if (act.dataset.act === 'show') show(x, ue); else reset(x, ue); return; }
  if (S.shown) return;                  // answers on screen: nothing to change until "Neu"
  const tag = t.closest('.gr-tag');
  if (tag) { const seq = ['', 'n', 'd', 'a'], nx = seq[(seq.indexOf(tag.dataset.st) + 1) % 4]; tag.dataset.st = nx; tag.dataset.lb = nx ? CASE[nx] : ''; clearMark(tag); return; }
  const gb = t.closest('.gr-gap button');
  if (gb) { gb.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('sel', b === gb && !gb.classList.contains('sel'))); clearMark(gb); return; }
  const tile = t.closest('.gr-tile');
  if (tile) { const it = tile.closest('.gr-ib'), line = it.querySelector('.gr-line'), pool = it.querySelector('.gr-pool');
    (tile.parentNode === line ? pool : line).appendChild(tile); it.querySelector('.gr-end').hidden = !!pool.children.length; clearMark(tile); return; }
}
function clearMark(el) { const it = el.closest('.gr-it'); it.classList.remove('ok', 'no'); const s = it.querySelector('.gr-sol'); s.hidden = true; }
function spk(t) {
  const b = t.closest('[data-spk]'); if (!b) return;
  const card = b.closest('.gr-sc'), out = card.querySelector('.gr-scs'), i = +card.dataset.i, it = cur.speak.items[i];
  const s = b.dataset.spk === 'pron' ? (it.pron || it.alt) : it.say;
  out.classList.remove('hid'); out.innerHTML = fmt(s); talk(plain(s));
}
function answers(x, ue) {
  return [...ue.querySelectorAll('.gr-it')].map((el, i) => {
    const it = x.items[i];
    if (x.type === 'cases') { const tags = [...el.querySelectorAll('.gr-tag')]; return { ok: tags.every(g => g.dataset.st === g.dataset.k), given: tags.map(g => g.dataset.st || '-').join(''), empty: tags.every(g => !g.dataset.st) }; }
    if (x.type === 'choice') { const gaps = [...el.querySelectorAll('.gr-gap')], val = gaps.map(g => (g.querySelector('.sel') || {}).textContent || '');
      return { ok: gaps.every((g, k) => val[k] === g.dataset.ok), given: val.join('|'), empty: val.every(v => !v) }; }
    if (x.type === 'order') { const v = [...el.querySelectorAll('.gr-line .gr-tile')].map(b => b.textContent).join(' ');
      return { ok: it.ok.includes(v) && !el.querySelector('.gr-pool').children.length, given: v, empty: !v }; }
    if (x.type === 'fill') { const ins = [...el.querySelectorAll('.gr-fill')], res = ins.map(i => { const ok = JSON.parse(i.dataset.ok), v = i.value.trim();
        return { v, ok: ok.includes(v), ci: !ok.includes(v) && ok.some(o => o.toLowerCase() === v.toLowerCase()) }; });
      ins.forEach((inp, k) => { inp.classList.remove('right', 'wrong'); inp.classList.add(res[k].ok || res[k].ci ? 'right' : 'wrong'); });
      return { ok: res.every(r => r.ok || r.ci), ci: res.some(r => r.ci), given: res.map(r => r.v).join('|'), empty: res.every(r => !r.v) }; }
    if (x.type === 'type') { const raw = el.querySelector('input').value, v = norm(raw), ok = it.ok.some(a => norm(a) === v), ci = !ok && it.ok.some(a => norm(a).toLowerCase() === v.toLowerCase());
      return { ok: ok || ci, ci, given: raw.trim(), empty: !v }; }
    return { ok: false, given: '', empty: true };
  });
}
function solText(x, it) {
  if (x.type === 'cases') return 'Richtig: ' + [...it.matchAll(/\{([nda]):([^}]*)\}/g)].map(m => `${m[2]} = ${CASE[m[1]]}`).join(' · ');
  if (x.type === 'choice') return 'Richtig: ' + plain(it);
  if (x.type === 'order') return 'Richtig: ' + it.ok[0] + it.end;
  if (x.type === 'fill') return 'Richtig: ' + plain(it.replace(/^\([^)]*\)\s*/, ''));
  if (x.type === 'type') return 'Richtig: ' + it.pre + ' ' + it.ok[0] + it.end;
  return '';
}
function check(x, ue) {
  if (x.type === 'free') { freeCheck(x, ue); return; }
  const S = exState[x.id], res = answers(x, ue);
  if (res.every(r => r.empty)) { if (typeof toast === 'function') toast('Bearbeite zuerst die Aufgaben.'); return; }
  const score = res.filter(r => r.ok).length, total = res.length, passed = score / total >= PASS;
  ue.querySelectorAll('.gr-it').forEach((el, i) => { const r = res[i]; el.classList.remove('ok', 'no'); void el.offsetWidth; el.classList.add(r.ok ? 'ok' : 'no');
    const s = el.querySelector('.gr-sol'); s.hidden = !(r.ok && r.ci); if (r.ok && r.ci) { s.className = 'gr-sol'; s.textContent = 'Richtig – aber achte auf Groß- und Kleinschreibung: ' + solText(x, x.items[i]).replace(/^Richtig: /, ''); } });
  const out = ue.querySelector('.gr-res');
  if (S.shown) { out.className = 'gr-res'; out.textContent = `${score} von ${total} richtig – zählt nicht, weil die Lösung angezeigt wurde.`; return; }
  record({ ch: cur.n, ex: x.id, score, total, passed, at: Date.now(), ans: res.map(r => r.given) });
  S.checked = true; ue.querySelector('[data-act="show"]').disabled = false;
  out.className = 'gr-res ' + (passed ? 'pass' : 'fail');
  out.textContent = `${score} von ${total} richtig (${pct(score, total)} %) – ${passed ? 'bestanden!' : `noch nicht bestanden (ab ${Math.round(PASS * 100)} %)`}`;
  if (passed) burst(ue.querySelector('[data-act="check"]'), score === total);
  refreshBadges();
}
function show(x, ue) {
  const S = exState[x.id]; S.shown = true;
  ue.querySelectorAll('.gr-it').forEach((el, i) => {
    const it = x.items[i], s = el.querySelector('.gr-sol'), wasOk = el.classList.contains('ok');
    if (x.type === 'cases') el.querySelectorAll('.gr-tag').forEach(g => { g.dataset.st = g.dataset.k; g.dataset.lb = CASE[g.dataset.k]; });
    if (x.type === 'choice') el.querySelectorAll('.gr-gap').forEach(g => g.querySelectorAll('button').forEach(b => {
      const right = b.textContent === g.dataset.ok; b.classList.toggle('right', right); b.classList.toggle('wrong', b.classList.contains('sel') && !right); b.classList.remove('sel'); }));
    if (x.type === 'fill') el.querySelectorAll('.gr-fill').forEach(i => { const ok = JSON.parse(i.dataset.ok); if (!ok.some(o => o.toLowerCase() === i.value.trim().toLowerCase())) { i.value = ok[0]; i.classList.remove('wrong'); i.classList.add('right'); } i.readOnly = true; });
    if (!wasOk) { s.hidden = false; s.className = 'gr-sol'; s.textContent = solText(x, it); }
  });
  const out = ue.querySelector('.gr-res'); out.className = 'gr-res'; out.textContent = 'Lösung angezeigt. Mit „Neu“ kannst du es noch einmal versuchen.';
}
function reset(x, ue) {
  exState[x.id] = { shown: false, checked: false };
  if (x.gen) { x.items = x.gen(); const box = ue.querySelector('.gr-items'); box.innerHTML = x.items.map((it, i) => `<div class="gr-it" data-i="${i}"><span class="gr-in">${i + 1}</span><div class="gr-ib">${itemHTML(x, it, i)}<div class="gr-sol" hidden></div></div></div>`).join(''); }
  ue.querySelectorAll('.gr-it').forEach((el, i) => { el.classList.remove('ok', 'no'); el.querySelector('.gr-ib').innerHTML = itemHTML(x, x.items[i], i) + '<div class="gr-sol" hidden></div>'; });
  const sh = ue.querySelector('[data-act="show"]'); if (sh) sh.disabled = true;
  ue.querySelector('.gr-res').textContent = '';
}
function refreshBadges() {
  if (!cur) return;
  cur.exercises.forEach(x => { const b = $('ueb-' + x.id); if (b) b.innerHTML = badgeHTML(x); });
  const p = $('grprog'); if (p) p.innerHTML = progHTML(chapterProgress(cur));
  icons();
}
function burst(el, big) {
  const r = el.getBoundingClientRect(), n = big ? 14 : 7, chars = ['✦', '★', '•', '✿'];
  for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.className = 'gr-burst'; s.textContent = chars[i % 4];
    s.style.left = (r.left + r.width / 2) + 'px'; s.style.top = (r.top) + 'px'; s.style.color = ['var(--nom)', 'var(--dat)', 'var(--akk)'][i % 3];
    s.style.setProperty('--x', (Math.random() * 160 - 80) + 'px'); s.style.setProperty('--y', (-40 - Math.random() * 90) + 'px'); s.style.setProperty('--r', (Math.random() * 360) + 'deg');
    document.body.appendChild(s); setTimeout(() => s.remove(), 1000); }
}

/* free writing: LanguageTool (free grammar checker) finds wrong forms; simple rules look for this chapter's typical mistakes.
   Not graded, because no automatic check can be sure about a free sentence. */
async function freeCheck(x, ue) {
  const out = ue.querySelector('.gr-res'), btn = ue.querySelector('[data-act="check"]');
  const items = [...ue.querySelectorAll('.gr-it')], texts = items.map(el => el.querySelector('textarea').value.trim());
  if (texts.every(t => !t)) { if (typeof toast === 'function') toast('Schreib zuerst einen Satz.'); return; }
  btn.disabled = true; out.className = 'gr-res'; out.textContent = 'Wird geprüft …';
  let good = 0, done = 0;
  await Promise.all(items.map(async (el, i) => {
    const t = texts[i], fb = el.querySelector('.gr-fb'); el.classList.remove('ok', 'no');
    if (!t) { fb.innerHTML = ''; return; }
    done++;
    const notes = [], low = t.toLowerCase();
    if (!/[.!?]$/.test(t)) notes.push(['h', 'Am Satzende fehlt ein Punkt.']);
    if (x.verbs && !x.verbs.some(v => new RegExp('\\b(?:\\w+)?' + v, 'i').test(low))) notes.push(['h', x.needMsg || 'Benutze ein passendes Verb aus diesem Kapitel.']);
    for (const fn of x.checks || []) { const r = fn(t); if (r) notes.push(r); }
    try {
      const r = await fetch('https://api.languagetool.org/v2/check', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ text: t, language: 'de-DE' }) });
      const j = await r.json();
      for (const m of j.matches || []) { const bad = t.substr(m.offset, m.length), rep = (m.replacements || []).slice(0, 2).map(r => '„' + r.value + '“').join(' oder ');
        notes.push([m.rule && /TYPOS|CASING/.test(m.rule.category && m.rule.category.id || '') ? 'h' : 'e', `„${bad}“: ${m.shortMessage || m.message}${rep ? ' Besser: ' + rep + '.' : ''}`]); }
    } catch (e) { notes.push(['h', 'Die automatische Rechtschreibprüfung ist gerade nicht erreichbar.']); }
    const errs = notes.filter(n => n[0] === 'e').length;
    if (!notes.length) { good++; el.classList.add('ok'); fb.innerHTML = `<span class="k">Keine Fehler gefunden. Gut gemacht! (Die Prüfung findet nicht jeden Fehler.)</span>`; }
    else { if (errs) el.classList.add('no'); else good++; fb.innerHTML = notes.map(n => `<span class="${n[0]}">${H(n[1])}</span>`).join(''); }
  }));
  btn.disabled = false; out.textContent = `${good} von ${done} Sätzen ohne erkannte Fehler.`;
}

function speakHTML(s) {
  return `<p class="sub" style="margin:-.3rem 0 1rem">${H(s.intro)}</p><div class="gr-spk">${s.items.map((it, i) => `<div class="gr-sc" data-i="${i}">
    <div class="gr-scp">${(it.cue || [['n', 'user-round', it.who], ['arr'], ['d', 'hand-heart', it.whom], ['a', it.icon, it.what]]).map(c => c[0] === 'arr' ? `<span class="arr">${icn('arrow-right')}</span>` : `<span class="${c[0]}">${c[1] ? icn(c[1]) : ''}${H(c[2])}</span>`).join('')}</div>
    <div class="gr-scs hid">Erst laut sagen – dann aufdecken.</div>
    <div class="row"><button class="btn sm" data-spk="say">${icn('eye')} Lösung</button>${it.pron || it.alt ? `<button class="btn sm" data-spk="pron">${icn(it.altIcon || 'replace')} ${H(it.altLabel || s.altLabel || 'Mit Pronomen')}</button>` : ''}</div></div>`).join('')}</div>`;
}

/* ---------- entry point ---------- */
function view(arg) {
  css(); closePop();
  if (!arg) { cur = null; overview(); loadChapter(1).then(c => { const t = $('grfeat'); if (t && typeof c.art === 'function') t.innerHTML = c.art(K); }).catch(() => {}); Promise.all(Object.keys(READY).map(n => loadChapter(+n).catch(() => {}))).then(() => pull()).then(() => { if (location.hash === '#/g' || location.hash === '#/g/') list(); }); return; }
  if (arg === 'fortschritt') { cur = null; progressView(); return; }
  chapter(parseInt(arg, 10));
}
function leave() { closePop(); cur = null; }
document.addEventListener('click', onClick);
document.addEventListener('input', e => { const t = e.target; if (!t.closest || !t.closest('.gr-ue')) return; const S = cur && exState[t.closest('.gr-ue').dataset.ex]; if (S && S.shown) return; if (t.classList.contains('gr-fill')) t.classList.remove('right', 'wrong'); const it = t.closest('.gr-it'); if (it) clearMark(t); });
window.addEventListener('scroll', () => { if ($('grpop')) closePop(); }, { passive: true });
window.addEventListener('resize', closePop);

const base = (document.currentScript && document.currentScript.src.replace(/[^/]*$/, '')) || 'grammatik/';
/* ---------- questions for the Spiele (solo and live quiz) ---------- */
function toQuestions(x, it) {
  const sub = x.title;
  if (x.type === 'choice') {
    let k = 0, right = null, opts = null;
    const p = it.replace(/\(\(([^)]*)\)\)/g, (m, o) => { const os = o.split('|'); if (k++ === 0) { right = os[0]; opts = os; return '_____'; } return os[0]; });
    const o = shuffle(opts); return { t: 'mc', p: plain(p), o, c: o.indexOf(right), sub };
  }
  if (x.type === 'fill') {
    const hint = (/^\(([^)]*)\)/.exec(it) || [])[1]; let k = 0, ans = null;
    const p = it.replace(/^\([^)]*\)\s*/, '').replace(/\[\[([^\]]*)\]\]/g, (m, a) => { const ok = a.split('|'); if (k++ === 0) { ans = ok.filter(Boolean); return '_____'; } return ok[0]; });
    if (!ans || !ans.length) return null;
    return { t: 'type', p: plain(p), ans, sub: (hint ? hint + ' · ' : '') + sub };
  }
  if (x.type === 'type') return { t: 'type', p: it.q.replace(/\[([^\]]*)\]/g, '»$1«'), ans: it.ok, sub: `${x.instr} – Schreib nur den Rest: „${it.pre ? it.pre + ' ' : ''}…${it.end}“` };
  if (x.type === 'order') {
    if (it.ok.length > 1) return null;
    let rest = it.ok[0]; const sol = [];
    for (let g = 0; rest && g < 20; g++) { const t = it.tiles.filter(t => !sol.includes(t) && (rest === t || rest.startsWith(t + ' '))).sort((a, b) => b.length - a.length)[0]; if (!t) return null; sol.push(t); rest = rest.slice(t.length).trim(); }
    let o = shuffle(sol); for (let g = 0; g < 6 && o.join(' ') === sol.join(' '); g++) o = shuffle(sol);
    return { t: 'order', p: 'Bring die Teile in die richtige Reihenfolge.', sub: `${sub} · Satzende: „${it.end}“`, o, sol };
  }
  if (x.type === 'cases') {
    const tags = [...it.matchAll(/\{([nda]):([^}]*)\}/g)]; if (!tags.length) return null;
    const m = tags[Math.floor(Math.random() * tags.length)], o = ['Nominativ', 'Akkusativ', 'Dativ'];
    return { t: 'mc', p: `Welcher Fall ist „${m[2]}“?`, o, c: o.indexOf(CASE[m[1]]), sub: plain(it) };
  }
  return null;
}
async function quiz(n, count) {
  const c = await loadChapter(n), pool = [];
  for (const x of c.exercises) { if (x.type === 'free') continue; for (const it of (x.gen ? x.gen() : x.items)) { const q = toQuestions(x, it); if (q && q.o !== undefined ? q.c >= 0 || q.t === 'order' : q) pool.push(q); } }
  // a fair mix: shuffle, but spread the exercise types
  return shuffle(pool).slice(0, count || 10);
}
const chapterList = () => GROUPS.flatMap(g => g.ch.filter(c => READY[c[0]]).map(c => ({ n: c[0], title: c[1], group: g.t, level: c[3] })));
// open the Spiele setup with this chapter already chosen as the question source
function practice(kind) {
  if (!cur) return; const k = 'gd_gset_' + kind;
  let st = {}; try { st = JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) {}
  Object.assign(st, { src: 'gram', id: String(cur.n), title: cur.title }); try { localStorage.setItem(k, JSON.stringify(st)); } catch (e) {}
  location.hash = '#/play/' + kind;
}

window.GRAM = { view, leave, base, quiz, list: chapterList, practice, add(c) { CH[c.n] = c; }, _test: { findWord, norm, attempts, best, store, PASS, CH,
  // answers every exercise with its own key; used to check new chapters ("ok" = all 100 %)
  async check(list) {
    const sl = ms => new Promise(r => setTimeout(r, ms)), report = {};
    for (const n of list) {
      location.hash = '#/g/' + n; for (let k = 0; k < 40 && !(CH[n] && cur === CH[n]); k++) await sl(120); await sl(150);
      const c = CH[n]; if (!c) { report[n] = 'NOT LOADED'; continue; }
      const r = []; if (!document.querySelector('.gr-art svg')) r.push('no art');
      for (const x of c.exercises) {
        const ue = $('ue-' + x.id); if (!ue) { r.push(x.id + ' missing'); continue; } if (x.type === 'free') continue;
        ue.querySelectorAll('.gr-it').forEach((el, i) => { const it = x.items[i];
          if (x.type === 'cases') el.querySelectorAll('.gr-tag').forEach(t => { for (let j = 0; j < { n: 1, d: 2, a: 3 }[t.dataset.k]; j++) t.click(); });
          if (x.type === 'choice') el.querySelectorAll('.gr-gap').forEach(g => [...g.querySelectorAll('button')].find(b => b.textContent === g.dataset.ok).click());
          if (x.type === 'fill') el.querySelectorAll('.gr-fill').forEach(f => f.value = JSON.parse(f.dataset.ok)[0]);
          if (x.type === 'type') el.querySelector('input').value = it.ok[0];
          if (x.type === 'order') { let rest = it.ok[0], g = 0; while (rest && g++ < 20) { const t = [...el.querySelectorAll('.gr-pool .gr-tile')].filter(t => rest === t.textContent || rest.startsWith(t.textContent + ' ')).sort((a, b) => b.textContent.length - a.textContent.length)[0]; if (!t) { r.push(x.id + ' item' + (i + 1) + ' cannot build: ' + rest); break; } t.click(); rest = rest.slice(t.textContent.length).trim(); } }
        });
        ue.querySelector('[data-act=check]').click(); await sl(30);
        const res = ue.querySelector('.gr-res').textContent, m = /(\d+) von (\d+)/.exec(res); if (!m || m[1] !== m[2]) r.push(x.id + ': ' + res);
      }
      report[n] = r.length ? r : 'ok';
    }
    try { localStorage.removeItem(LKEY); } catch (e) {} remote = null;
    return JSON.stringify(report);
  } } };
})();
