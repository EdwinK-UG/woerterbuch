/* Nachschlagen – Unregelmäßige Verben. Liste, Rhythmus-Gruppen und Trainer (jede Runde neue Verben). */
(function () {
// [Infinitiv, er/sie/es Präsens, Präteritum, Partizip II, Hilfsverb: h = hat, s = ist, sh = beides]
const V = [
  ['backen', 'backt', 'backte', 'gebacken', 'h'], ['beginnen', 'beginnt', 'begann', 'begonnen', 'h'], ['beißen', 'beißt', 'biss', 'gebissen', 'h'],
  ['bekommen', 'bekommt', 'bekam', 'bekommen', 'h'], ['bieten', 'bietet', 'bot', 'geboten', 'h'], ['binden', 'bindet', 'band', 'gebunden', 'h'],
  ['bitten', 'bittet', 'bat', 'gebeten', 'h'], ['bleiben', 'bleibt', 'blieb', 'geblieben', 's'], ['braten', 'brät', 'briet', 'gebraten', 'h'],
  ['brechen', 'bricht', 'brach', 'gebrochen', 'h'], ['brennen', 'brennt', 'brannte', 'gebrannt', 'h'], ['bringen', 'bringt', 'brachte', 'gebracht', 'h'],
  ['denken', 'denkt', 'dachte', 'gedacht', 'h'], ['dürfen', 'darf', 'durfte', 'gedurft', 'h'], ['einladen', 'lädt ein', 'lud ein', 'eingeladen', 'h'],
  ['empfehlen', 'empfiehlt', 'empfahl', 'empfohlen', 'h'], ['entscheiden', 'entscheidet', 'entschied', 'entschieden', 'h'], ['essen', 'isst', 'aß', 'gegessen', 'h'],
  ['fahren', 'fährt', 'fuhr', 'gefahren', 's'], ['fallen', 'fällt', 'fiel', 'gefallen', 's'], ['fangen', 'fängt', 'fing', 'gefangen', 'h'],
  ['finden', 'findet', 'fand', 'gefunden', 'h'], ['fliegen', 'fliegt', 'flog', 'geflogen', 's'], ['fliehen', 'flieht', 'floh', 'geflohen', 's'],
  ['fließen', 'fließt', 'floss', 'geflossen', 's'], ['frieren', 'friert', 'fror', 'gefroren', 'h'], ['geben', 'gibt', 'gab', 'gegeben', 'h'],
  ['gefallen', 'gefällt', 'gefiel', 'gefallen', 'h'], ['gehen', 'geht', 'ging', 'gegangen', 's'], ['gelingen', 'gelingt', 'gelang', 'gelungen', 's'],
  ['gelten', 'gilt', 'galt', 'gegolten', 'h'], ['genießen', 'genießt', 'genoss', 'genossen', 'h'], ['geschehen', 'geschieht', 'geschah', 'geschehen', 's'],
  ['gewinnen', 'gewinnt', 'gewann', 'gewonnen', 'h'], ['gießen', 'gießt', 'goss', 'gegossen', 'h'], ['greifen', 'greift', 'griff', 'gegriffen', 'h'],
  ['haben', 'hat', 'hatte', 'gehabt', 'h'], ['halten', 'hält', 'hielt', 'gehalten', 'h'], ['hängen', 'hängt', 'hing', 'gehangen', 'h'],
  ['heben', 'hebt', 'hob', 'gehoben', 'h'], ['heißen', 'heißt', 'hieß', 'geheißen', 'h'], ['helfen', 'hilft', 'half', 'geholfen', 'h'],
  ['kennen', 'kennt', 'kannte', 'gekannt', 'h'], ['klingen', 'klingt', 'klang', 'geklungen', 'h'], ['kommen', 'kommt', 'kam', 'gekommen', 's'],
  ['können', 'kann', 'konnte', 'gekonnt', 'h'], ['laden', 'lädt', 'lud', 'geladen', 'h'], ['lassen', 'lässt', 'ließ', 'gelassen', 'h'],
  ['laufen', 'läuft', 'lief', 'gelaufen', 's'], ['leiden', 'leidet', 'litt', 'gelitten', 'h'], ['leihen', 'leiht', 'lieh', 'geliehen', 'h'],
  ['lesen', 'liest', 'las', 'gelesen', 'h'], ['liegen', 'liegt', 'lag', 'gelegen', 'h'], ['lügen', 'lügt', 'log', 'gelogen', 'h'],
  ['messen', 'misst', 'maß', 'gemessen', 'h'], ['mögen', 'mag', 'mochte', 'gemocht', 'h'], ['müssen', 'muss', 'musste', 'gemusst', 'h'],
  ['nehmen', 'nimmt', 'nahm', 'genommen', 'h'], ['nennen', 'nennt', 'nannte', 'genannt', 'h'], ['pfeifen', 'pfeift', 'pfiff', 'gepfiffen', 'h'],
  ['raten', 'rät', 'riet', 'geraten', 'h'], ['reiten', 'reitet', 'ritt', 'geritten', 'sh'], ['rennen', 'rennt', 'rannte', 'gerannt', 's'],
  ['riechen', 'riecht', 'roch', 'gerochen', 'h'], ['rufen', 'ruft', 'rief', 'gerufen', 'h'], ['scheinen', 'scheint', 'schien', 'geschienen', 'h'],
  ['schieben', 'schiebt', 'schob', 'geschoben', 'h'], ['schießen', 'schießt', 'schoss', 'geschossen', 'h'], ['schlafen', 'schläft', 'schlief', 'geschlafen', 'h'],
  ['schlagen', 'schlägt', 'schlug', 'geschlagen', 'h'], ['schließen', 'schließt', 'schloss', 'geschlossen', 'h'], ['schneiden', 'schneidet', 'schnitt', 'geschnitten', 'h'],
  ['schreiben', 'schreibt', 'schrieb', 'geschrieben', 'h'], ['schreien', 'schreit', 'schrie', 'geschrien', 'h'], ['schweigen', 'schweigt', 'schwieg', 'geschwiegen', 'h'],
  ['schwimmen', 'schwimmt', 'schwamm', 'geschwommen', 'sh'], ['sehen', 'sieht', 'sah', 'gesehen', 'h'], ['sein', 'ist', 'war', 'gewesen', 's'],
  ['singen', 'singt', 'sang', 'gesungen', 'h'], ['sinken', 'sinkt', 'sank', 'gesunken', 's'], ['sitzen', 'sitzt', 'saß', 'gesessen', 'h'],
  ['sprechen', 'spricht', 'sprach', 'gesprochen', 'h'], ['springen', 'springt', 'sprang', 'gesprungen', 's'], ['stehen', 'steht', 'stand', 'gestanden', 'h'],
  ['stehlen', 'stiehlt', 'stahl', 'gestohlen', 'h'], ['steigen', 'steigt', 'stieg', 'gestiegen', 's'], ['sterben', 'stirbt', 'starb', 'gestorben', 's'],
  ['streiten', 'streitet', 'stritt', 'gestritten', 'h'], ['tragen', 'trägt', 'trug', 'getragen', 'h'], ['treffen', 'trifft', 'traf', 'getroffen', 'h'],
  ['treiben', 'treibt', 'trieb', 'getrieben', 'h'], ['trinken', 'trinkt', 'trank', 'getrunken', 'h'], ['tun', 'tut', 'tat', 'getan', 'h'],
  ['vergessen', 'vergisst', 'vergaß', 'vergessen', 'h'], ['verlieren', 'verliert', 'verlor', 'verloren', 'h'], ['verschwinden', 'verschwindet', 'verschwand', 'verschwunden', 's'],
  ['verzeihen', 'verzeiht', 'verzieh', 'verziehen', 'h'], ['wachsen', 'wächst', 'wuchs', 'gewachsen', 's'], ['waschen', 'wäscht', 'wusch', 'gewaschen', 'h'],
  ['werden', 'wird', 'wurde', 'geworden', 's'], ['werfen', 'wirft', 'warf', 'geworfen', 'h'], ['wiegen', 'wiegt', 'wog', 'gewogen', 'h'],
  ['wissen', 'weiß', 'wusste', 'gewusst', 'h'], ['wollen', 'will', 'wollte', 'gewollt', 'h'], ['ziehen', 'zieht', 'zog', 'gezogen', 'h'], ['zwingen', 'zwingt', 'zwang', 'gezwungen', 'h']
];
// Rhythmus-Gruppen: gleiche Vokalfolge Infinitiv – Präteritum – Partizip
const R = [
  ['ei – ie – ie', ['bleiben', 'leihen', 'schreiben', 'schreien', 'schweigen', 'steigen', 'treiben', 'verzeihen', 'scheinen', 'entscheiden']],
  ['ei – i – i', ['beißen', 'greifen', 'leiden', 'pfeifen', 'reiten', 'schneiden', 'streiten']],
  ['ie – o – o', ['bieten', 'fliegen', 'fliehen', 'fließen', 'frieren', 'genießen', 'gießen', 'riechen', 'schieben', 'schießen', 'schließen', 'verlieren', 'wiegen']],
  ['i – a – u', ['binden', 'finden', 'gelingen', 'klingen', 'singen', 'sinken', 'springen', 'trinken', 'verschwinden', 'zwingen']],
  ['i – a – o', ['beginnen', 'gewinnen', 'schwimmen']],
  ['e – a – o', ['brechen', 'empfehlen', 'gelten', 'helfen', 'nehmen', 'sprechen', 'stehlen', 'sterben', 'treffen', 'werfen']],
  ['e – a – e', ['essen', 'geben', 'geschehen', 'lesen', 'messen', 'sehen', 'vergessen']],
  ['a – u – a', ['fahren', 'laden', 'schlagen', 'tragen', 'wachsen', 'waschen']],
  ['a – ie – a', ['braten', 'fallen', 'halten', 'lassen', 'raten', 'schlafen']],
  ['gemischt: -te + neuer Vokal', ['brennen', 'bringen', 'denken', 'kennen', 'nennen', 'rennen', 'wissen']]
];
const byInf = Object.fromEntries(V.map(v => [v[0], v]));
const group = Object.fromEntries(R.flatMap(([g, ws]) => ws.map(w => [w, g])));
const pick = (arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
const aux = a => a === 's' ? 'ist' : a === 'h' ? 'hat' : 'ist|hat';
const regStem = inf => { const st = inf.replace(/e?n$/, ''); return /[td]$/.test(st) ? st + 'et' : st + 't'; };   // regular er-form, to spot vowel changes

GRAM.add({
  n: 101, level: 'Liste', group: 'Nachschlagen und trainieren',
  title: 'Unregelmäßige Verben',
  kicker: 'gehen – ging – gegangen',
  intro: 'Hier findest du die wichtigsten unregelmäßigen Verben mit Präteritum, Partizip II und Hilfsverb. Viele folgen einem <b>Rhythmus</b>: Die Vokale ändern sich nach einem Muster – sing-en, sang, ge-sung-en. Lern die Verben in diesen Gruppen, dann ist es viel leichter. Der Trainer gibt dir bei jedem „Neu“ andere Verben.',
  hero: 'sing{e:en} – s{e:a}ng – ges{e:u}ngen · tr{e:i}nken – tr{e:a}nk – getr{e:u}nken',
  art: K => {
    const card = (x, y, t, c, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-80" y="-34" width="160" height="68" rx="16" fill="var(--${c}-s)" stroke="var(--${c})" stroke-width="3"/><text y="10" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="28" fill="var(--${c})">${t}</text></g>`;
    return K.svg(`<rect width="520" height="360" fill="var(--sky1)"/>` + card(110, 120, 'singen', 'nom', -6) + card(270, 180, 'sang', 'akk', 3) + card(420, 250, 'gesungen', 'dat', -3) +
      K.arrow('M180 140Q220 150 214 162', 'var(--faint)') + K.arrow('M340 196Q370 214 360 228', 'var(--faint)') + K.notes(70, 300) + K.notes(400, 110) +
      `<g fill="var(--sun)"><path d="M250 60l3 8l8 3l-8 3l-3 8l-3-8l-8-3l8-3z"/></g>`,
      'Drei Karten: singen, sang, gesungen – mit Musiknoten.');
  },
  lemmas: {},

  understand: [
    { type: 'cards', title: 'Die Rhythmus-Gruppen', min: '13rem', items: R.map(([g, ws], i) => ({ t: g, k: ['n', 'ac', 'd', 'a', 'ok', 'w', 'b', 'f', 'n', 'ac'][i], ws, p: (() => { const v = byInf[ws[0]]; return `${v[0]} – ${v[2]} – ${v[3]}`; })() })),
      foot: 'Sprich jede Gruppe laut wie ein Lied: bleiben – blieb – geblieben, schreiben – schrieb – geschrieben, steigen – stieg – gestiegen …' },
    { type: 'note', title: 'haben oder sein?', text: 'Die meisten Verben haben {e:hat}. {e:ist} haben Verben der Bewegung von A nach B und der Veränderung – und sein, bleiben, werden, passieren (Kapitel 27).' },
    { type: 'reflist', title: 'Alle Verben', intro: 'Tippe auf ein Verb, um es im Wörterbuch zu sehen.', head: ['Infinitiv', 'Präsens (er)', 'Präteritum', 'Perfekt'],
      rows: V.map(v => [v[0], v[1] === regStem(v[0]) ? v[1] : `{e:${v[1]}}`, v[2], `${v[4] === 's' ? 'ist' : v[4] === 'h' ? 'hat' : 'ist/hat'} ${v[3]}`]) }
  ],

  examples: [ 'Gestern {e:ging} ich ins Kino.', 'Wir {e:sind} nach Kampala {e:geflogen}.', 'Sie {e:hat} das Buch schon {e:gelesen}.', 'Er {e:trank} einen Tee und {e:schlief} ein.', 'Das Kind {e:ist} schnell {e:gewachsen}.', 'Ich {e:habe} meinen Schlüssel {e:verloren}.' ],

  exercises: [
    { id: 'u1', type: 'fill', title: 'Präteritum', instr: 'Schreib die er/sie/es-Form im Präteritum. Bei „Neu“ kommen andere Verben.',
      gen: () => pick(V, 8).map(v => `(${v[0]}) er [[${v[2]}]]`) },
    { id: 'u2', type: 'fill', title: 'Perfekt', instr: 'Schreib das Hilfsverb und das Partizip II.',
      gen: () => pick(V, 8).map(v => `(${v[0]}) er [[${aux(v[4])}]] [[${v[3]}]]`) },
    { id: 'u3', type: 'choice', title: 'hat oder ist?', instr: 'Wähle das richtige Hilfsverb.',
      gen: () => pick(V.filter(v => v[4] !== 'sh'), 8).map(v => `Er ((${v[4] === 's' ? 'ist|hat' : 'hat|ist'})) ${v[3]}.`) },
    { id: 'u4', type: 'choice', title: 'Welcher Rhythmus?', instr: 'Zu welcher Gruppe gehört das Verb?',
      gen: () => pick(V.filter(v => group[v[0]]), 6).map(v => { const g = group[v[0]], others = pick(R.map(r => r[0]).filter(x => x !== g), 2);
        return `${v[0]} – ${v[2]} – ${v[3]}: ((${g}|${others.join('|')}))`; }) },
    { id: 'u5', type: 'fill', title: 'Präsens mit Vokalwechsel', instr: 'Schreib die er/sie/es-Form im Präsens.',
      gen: () => pick(V.filter(v => v[1] !== regStem(v[0]) && !v[1].includes(' ')), 6).map(v => `(${v[0]}) er [[${v[1]}]]`) }
  ],

  speak: { title: 'Lernkarten', intro: 'Sag die Formen laut – dann deck auf. Bei jedem Besuch gibt es neue Karten.', altLabel: 'Präsens',
    gen: () => pick(V, 8).map(v => ({ cue: [['x', 'book-open', v[0]]], say: `${v[2]} – ${v[4] === 's' ? 'ist' : 'hat'} ${v[3]}`, alt: `er ${v[1]}` })) }
});
})();
