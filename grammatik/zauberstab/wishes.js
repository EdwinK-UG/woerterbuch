// Wunschzauber (B2 · Kapitel 9 · Konjunktiv II der Gegenwart): the rounds.
// This public file holds only verb facts (the forms of a few verbs). The wish sentences are lesson content: the lesson
// page (which loaded the chapter with the learner's enrolment) sends its own texts, and loadRounds() finds them there.

// Persons: ich, du, er/sie/es, wir, ihr, sie/Sie. k2 = Konjunktiv II, pres = Präsens, prat = Präteritum.
export const VERBS = {
  sein: { k2: ['wäre', 'wärst', 'wäre', 'wären', 'wärt', 'wären'], pres: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'], prat: ['war', 'warst', 'war', 'waren', 'wart', 'waren'], alt: { wärest: 1, wäret: 4 } },
  haben: { k2: ['hätte', 'hättest', 'hätte', 'hätten', 'hättet', 'hätten'], pres: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'], prat: ['hatte', 'hattest', 'hatte', 'hatten', 'hattet', 'hatten'] },
  werden: { k2: ['würde', 'würdest', 'würde', 'würden', 'würdet', 'würden'], pres: ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden'], prat: ['wurde', 'wurdest', 'wurde', 'wurden', 'wurdet', 'wurden'] },
  können: { k2: ['könnte', 'könntest', 'könnte', 'könnten', 'könntet', 'könnten'], pres: ['kann', 'kannst', 'kann', 'können', 'könnt', 'können'], prat: ['konnte', 'konntest', 'konnte', 'konnten', 'konntet', 'konnten'] },
  müssen: { k2: ['müsste', 'müsstest', 'müsste', 'müssten', 'müsstet', 'müssten'], pres: ['muss', 'musst', 'muss', 'müssen', 'müsst', 'müssen'], prat: ['musste', 'musstest', 'musste', 'mussten', 'musstet', 'mussten'] },
  dürfen: { k2: ['dürfte', 'dürftest', 'dürfte', 'dürften', 'dürftet', 'dürften'], pres: ['darf', 'darfst', 'darf', 'dürfen', 'dürft', 'dürfen'], prat: ['durfte', 'durftest', 'durfte', 'durften', 'durftet', 'durften'] },
  wollen: { k2: ['wollte', 'wolltest', 'wollte', 'wollten', 'wolltet', 'wollten'], pres: ['will', 'willst', 'will', 'wollen', 'wollt', 'wollen'], prat: null, fake: ['wöllte', 'wölltest', 'wöllte', 'wöllten', 'wölltet', 'wöllten'] },
  sollen: { k2: ['sollte', 'solltest', 'sollte', 'sollten', 'solltet', 'sollten'], pres: ['soll', 'sollst', 'soll', 'sollen', 'sollt', 'sollen'], prat: null, fake: ['söllte', 'sölltest', 'söllte', 'söllten', 'sölltet', 'söllten'] },
  kommen: { k2: ['käme', 'kämst', 'käme', 'kämen', 'kämt', 'kämen'], pres: ['komme', 'kommst', 'kommt', 'kommen', 'kommt', 'kommen'], prat: ['kam', 'kamst', 'kam', 'kamen', 'kamt', 'kamen'], alt: { kämest: 1, kämet: 4 } },
  gehen: { k2: ['ginge', 'gingest', 'ginge', 'gingen', 'ginget', 'gingen'], pres: ['gehe', 'gehst', 'geht', 'gehen', 'geht', 'gehen'], prat: ['ging', 'gingst', 'ging', 'gingen', 'gingt', 'gingen'] },
  geben: { k2: ['gäbe', 'gäbest', 'gäbe', 'gäben', 'gäbet', 'gäben'], pres: ['gebe', 'gibst', 'gibt', 'geben', 'gebt', 'geben'], prat: ['gab', 'gabst', 'gab', 'gaben', 'gabt', 'gaben'] },
  finden: { k2: ['fände', 'fändest', 'fände', 'fänden', 'fändet', 'fänden'], pres: ['finde', 'findest', 'findet', 'finden', 'findet', 'finden'], prat: ['fand', 'fandest', 'fand', 'fanden', 'fandet', 'fanden'] },
  brauchen: { k2: ['bräuchte', 'bräuchtest', 'bräuchte', 'bräuchten', 'bräuchtet', 'bräuchten'], pres: ['brauche', 'brauchst', 'braucht', 'brauchen', 'braucht', 'brauchen'], prat: ['brauchte', 'brauchtest', 'brauchte', 'brauchten', 'brauchtet', 'brauchten'] },
  wissen: { k2: ['wüsste', 'wüsstest', 'wüsste', 'wüssten', 'wüsstet', 'wüssten'], pres: ['weiß', 'weißt', 'weiß', 'wissen', 'wisst', 'wissen'], prat: ['wusste', 'wusstest', 'wusste', 'wussten', 'wusstet', 'wussten'] },
  lassen: { k2: ['ließe', 'ließest', 'ließe', 'ließen', 'ließet', 'ließen'], pres: ['lasse', 'lässt', 'lässt', 'lassen', 'lasst', 'lassen'], prat: ['ließ', 'ließest', 'ließ', 'ließen', 'ließt', 'ließen'] },
  bleiben: { k2: ['bliebe', 'bliebest', 'bliebe', 'blieben', 'bliebet', 'blieben'], pres: ['bleibe', 'bleibst', 'bleibt', 'bleiben', 'bleibt', 'bleiben'], prat: ['blieb', 'bliebst', 'blieb', 'blieben', 'bliebt', 'blieben'] },
  sehen: { k2: ['sähe', 'sähest', 'sähe', 'sähen', 'sähet', 'sähen'], pres: ['sehe', 'siehst', 'sieht', 'sehen', 'seht', 'sehen'], prat: ['sah', 'sahst', 'sah', 'sahen', 'saht', 'sahen'] },
};
// separable prefixes a Konjunktiv II form can carry at the end of a wenn-clause (mitkäme)
const PREFIXES = ['mit', 'an', 'auf', 'aus', 'ein', 'zurück', 'vorbei', 'weg', 'zu', 'nach', 'vor', 'her', 'hin', 'los', 'um', 'ab', 'bei', 'fern', 'mit'];
const SUBJ = { ich: [0], du: [1], er: [2], es: [2], man: [2], wir: [3], ihr: [4], sie: [2, 5], Sie: [5] };
const UML = { ä: 'a', ö: 'o', ü: 'u', äu: 'au' };

// which verb and person a word is, if it is a Konjunktiv II form: { verb, idx: [persons], pre }
export function k2Of(word) {
  const w = word.replace(/[.,!?]/g, '');
  for (const pre of ['', ...PREFIXES]) {
    if (pre && !w.startsWith(pre)) continue;
    const rest = w.slice(pre.length);
    for (const [verb, f] of Object.entries(VERBS)) {
      const idx = f.k2.map((x, i) => (x === rest ? i : -1)).filter((i) => i >= 0);
      if (f.alt && f.alt[rest] != null) idx.push(f.alt[rest]);
      if (idx.length && (!pre || ['kommen', 'gehen', 'geben', 'finden', 'lassen', 'bleiben', 'sehen'].includes(verb))) return { verb, idx, pre, form: rest };
    }
  }
  return null;
}

// Präteritum -> Konjunktiv II, letter by letter: which letters get an Umlaut and which ending is added.
export function derive(verb) {
  const f = VERBS[verb]; if (!f || !f.prat) return null;
  const from = f.prat[2], to = f.k2[2]; const parts = []; let i = 0, j = 0;
  while (i < from.length && j < to.length) {
    if (from[i] === to[j]) { parts.push({ c: to[j], kind: 'stem' }); i++; j++; continue; }
    if (UML[to[j]] === from[i]) { parts.push({ c: to[j], kind: 'umlaut', was: from[i] }); i++; j++; continue; }
    return null;
  }
  if (i < from.length) return null;
  for (; j < to.length; j++) parts.push({ c: to[j], kind: 'ending' });
  return { verb, from, to, parts, umlaut: parts.some((p) => p.kind === 'umlaut'), ending: parts.filter((p) => p.kind === 'ending').map((p) => p.c).join('') };
}

// the three words for one gap: the right one, then the Indikativ forms she must not take
function options(k, person) {
  const f = VERBS[k.verb], p = k.pre, i = person;
  const right = p + f.k2[i];
  const wrong = [];
  const pres = f.pres[i];
  // a separable verb at the end of a wenn-clause: mitkommt, mitkam
  wrong.push({ w: p + pres, kind: 'pres' });
  if (f.prat) wrong.push({ w: p + f.prat[i], kind: 'prat' }); else wrong.push({ w: p + f.fake[i], kind: 'fake' });
  return [{ w: right, kind: 'k2' }, ...wrong.filter((o, n, a) => o.w !== right && a.findIndex((x) => x.w === o.w) === n)];
}

// Filled in place by loadRounds(), so importers keep one live array.
export const ROUNDS = [];

export function loadRounds(texts) {
  const list = (Array.isArray(texts) ? texts : []).filter((t) => typeof t === 'string' && t.length < 400).map((t) => t.trim());
  const has = (w) => list.some((t) => new RegExp('(^|[^\\p{L}])' + w + '($|[^\\p{L}])', 'u').test(t));
  const out = [];
  // 1) how the form is made: Präteritum + Umlaut + -e, for verbs the lesson itself shows in both forms
  for (const verb of ['kommen', 'sein', 'haben', 'können', 'gehen', 'wissen']) {
    const d = derive(verb); if (!d || !has(d.from) || !has(d.to)) continue;
    out.push({ kind: 'form', ...d }); if (out.length >= 3) break;
  }
  // 2) wishes: the lesson's own wenn-sentences, with every Konjunktiv II form as a gap
  let hint = '', used = false; const wishes = [];
  const seen = new Set();
  for (const raw of list) {
    if (/ · .+\/.+ · /.test(raw)) { hint = raw; used = false; continue; }
    if (/[*{}]/.test(raw)) continue;                                   // marked-up copies (bubbles)
    const t = raw.split(/(?<=[.!?])\s+/)[0].replace(/[.!?]$/, '');    // only the first sentence
    if (seen.has(t)) continue; seen.add(t);
    const m = t.match(/^Wenn\s+[^,]+,\s+.+$/);
    if (!m || used) { if (m && wishes.length) wishes[wishes.length - 1].alt.push(t); continue; }
    const words = t.replace(/[.!?]$/, '').split(/\s+/), toks = []; let ok = true, gaps = 0;
    words.forEach((w, n) => {
      const k = k2Of(w);
      if (!k) { toks.push({ text: w }); return; }
      // the person: the subject is the word after "Wenn", or the word after the verb in the main clause
      const comma = w.endsWith(','), bare = w.replace(/[,]/g, '');
      const subj = n > 0 && words[n - 1].endsWith(',') ? words[n + 1] : words[1];
      let person = k.idx[0];
      const sp = SUBJ[(subj || '').replace(/[,]/g, '')];
      if (sp) { const both = sp.filter((x) => k.idx.includes(x)); if (both.length) person = both[0]; else ok = false; }
      else if (k.idx.includes(2) && !/n$/.test(k.form)) person = 2; else if (k.idx.includes(5)) person = 5;
      const opts = options(k, person); if (opts.length < 3) ok = false;
      toks.push({ text: bare, comma, gap: { verb: k.verb, person, pre: k.pre, opts } }); gaps++;
    });
    if (!ok || !gaps) continue;
    used = true; wishes.push({ kind: 'wish', hint: hint.replace(/\s*\/\s*/, '  /  '), toks, alt: [] });
  }
  out.push(...wishes.slice(0, 6));
  for (const r of out) if (r.kind === 'wish') r.alt = r.alt.filter((a) => a !== r.toks.map((x) => x.text + (x.comma ? ',' : '')).join(' '));
  ROUNDS.length = 0; ROUNDS.push(...out);
  return ROUNDS.length;
}

// a short German explanation for a wrong word
export function why(gap, kind) {
  const f = VERBS[gap.verb], right = gap.pre + f.k2[gap.person], d = derive(gap.verb);
  if (kind === 'pres') return `<b class="no">${gap.pre + f.pres[gap.person]}</b> ist Indikativ Präsens – so ist es wirklich. Für den Wunsch brauchst du <b class="ok">${right}</b>.`;
  if (kind === 'prat') return d && d.umlaut ? `<b class="no">${gap.pre + f.prat[gap.person]}</b> ist Präteritum, ohne Umlaut. Der Konjunktiv II bekommt den Umlaut: <b class="ok">${right}</b>.`
    : `<b class="no">${gap.pre + f.prat[gap.person]}</b> ist Präteritum. Der Konjunktiv II hat die Endung -e: <b class="ok">${right}</b>.`;
  return `Bei ${gap.verb} gibt es keinen Umlaut: <b class="ok">${right}</b> (wie im Präteritum).`;
}
export function praise(gap) {
  const f = VERBS[gap.verb], right = gap.pre + f.k2[gap.person];
  if (gap.verb === 'werden') return `<b class="ok">${right}</b> + Infinitiv am Ende – die normale Form für den Wunsch.`;
  return `<b class="ok">${right}</b> – Konjunktiv II von ${gap.verb}: ein Wunsch, nicht die Wirklichkeit.`;
}
