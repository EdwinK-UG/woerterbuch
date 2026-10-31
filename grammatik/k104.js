/* Nachschlagen – Verben mit Präpositionen. Liste und Trainer (jede Runde neue Verben). */
(function () {
// [Verb, Präposition, Fall (A/D), Beispiel]
const L = [
  ['abhängen', 'von', 'D', 'Das hängt {d:von dem Wetter} ab.'], ['achten', 'auf', 'A', 'Achte {a:auf den Verkehr}!'], ['anfangen', 'mit', 'D', 'Wir fangen {d:mit der Arbeit} an.'],
  ['sich ärgern', 'über', 'A', 'Ich ärgere mich {a:über den Lärm}.'], ['aufhören', 'mit', 'D', 'Er hört {d:mit dem Rauchen} auf.'], ['sich bedanken', 'für', 'A', 'Ich bedanke mich {a:für die Hilfe}.'],
  ['sich beschweren', 'über', 'A', 'Sie beschwert sich {a:über das Essen}.'], ['sich bewerben', 'um', 'A', 'Er bewirbt sich {a:um die Stelle}.'], ['bitten', 'um', 'A', 'Darf ich Sie {a:um Hilfe} bitten?'],
  ['denken', 'an', 'A', 'Ich denke oft {a:an dich}.'], ['diskutieren', 'über', 'A', 'Wir diskutieren {a:über das Thema}.'], ['einladen', 'zu', 'D', 'Ich lade dich {d:zu meiner Party} ein.'],
  ['sich entscheiden', 'für', 'A', 'Ich entscheide mich {a:für das rote Kleid}.'], ['sich entschuldigen', 'für', 'A', 'Er entschuldigt sich {a:für den Fehler}.'], ['sich erinnern', 'an', 'A', 'Erinnerst du dich {a:an den Urlaub}?'],
  ['erzählen', 'von', 'D', 'Sie erzählt {d:von ihrer Reise}.'], ['fragen', 'nach', 'D', 'Er fragt {d:nach dem Weg}.'], ['sich freuen', 'auf', 'A', 'Ich freue mich {a:auf die Ferien}.'],
  ['sich freuen', 'über', 'A', 'Sie freut sich {a:über das Geschenk}.'], ['gehören', 'zu', 'D', 'Das gehört {d:zu meinen Aufgaben}.'], ['sich gewöhnen', 'an', 'A', 'Ich gewöhne mich {a:an das Wetter}.'],
  ['glauben', 'an', 'A', 'Ich glaube {a:an dich}.'], ['gratulieren', 'zu', 'D', 'Wir gratulieren dir {d:zu der Hochzeit}.'], ['halten', 'von', 'D', 'Was hältst du {d:von der Idee}?'],
  ['handeln', 'von', 'D', 'Der Film handelt {d:von einem Hund}.'], ['helfen', 'bei', 'D', 'Hilfst du mir {d:bei den Hausaufgaben}?'], ['hoffen', 'auf', 'A', 'Wir hoffen {a:auf gutes Wetter}.'],
  ['sich interessieren', 'für', 'A', 'Er interessiert sich {a:für Musik}.'], ['sich konzentrieren', 'auf', 'A', 'Konzentrier dich {a:auf die Aufgabe}!'], ['sich kümmern', 'um', 'A', 'Wer kümmert sich {a:um den Hund}?'],
  ['lachen', 'über', 'A', 'Alle lachen {a:über den Witz}.'], ['nachdenken', 'über', 'A', 'Ich denke {a:über deine Frage} nach.'], ['protestieren', 'gegen', 'A', 'Sie protestieren {a:gegen den Krieg}.'],
  ['rechnen', 'mit', 'D', 'Wir rechnen {d:mit Regen}.'], ['reden', 'über', 'A', 'Wir reden {a:über das Wetter}.'], ['riechen', 'nach', 'D', 'Hier riecht es {d:nach Kaffee}.'],
  ['schreiben', 'an', 'A', 'Ich schreibe {a:an meine Oma}.'], ['sich sorgen', 'um', 'A', 'Sie sorgt sich {a:um ihren Sohn}.'], ['sprechen', 'mit', 'D', 'Ich spreche {d:mit dem Chef}.'],
  ['sprechen', 'über', 'A', 'Wir sprechen {a:über den Film}.'], ['suchen', 'nach', 'D', 'Ich suche {d:nach meinem Schlüssel}.'], ['teilnehmen', 'an', 'D', 'Ich nehme {d:an dem Kurs} teil.'],
  ['telefonieren', 'mit', 'D', 'Er telefoniert {d:mit seiner Mutter}.'], ['träumen', 'von', 'D', 'Sie träumt {d:von einem Haus am Meer}.'], ['sich treffen', 'mit', 'D', 'Ich treffe mich {d:mit Freunden}.'],
  ['sich unterhalten', 'über', 'A', 'Wir unterhalten uns {a:über Politik}.'], ['sich verabreden', 'mit', 'D', 'Ich bin {d:mit Lea} verabredet.'], ['sich verlassen', 'auf', 'A', 'Du kannst dich {a:auf mich} verlassen.'],
  ['sich verlieben', 'in', 'A', 'Er hat sich {a:in sie} verliebt.'], ['sich vorbereiten', 'auf', 'A', 'Ich bereite mich {a:auf die Prüfung} vor.'], ['warnen', 'vor', 'D', 'Man warnt {d:vor dem Sturm}.'],
  ['warten', 'auf', 'A', 'Ich warte {a:auf den Bus}.'], ['sich wundern', 'über', 'A', 'Ich wundere mich {a:über seine Antwort}.'], ['zweifeln', 'an', 'D', 'Ich zweifle {d:an der Geschichte}.'],
  ['Angst haben', 'vor', 'D', 'Er hat Angst {d:vor Hunden}.'], ['Lust haben', 'auf', 'A', 'Hast du Lust {a:auf ein Eis}?'], ['zufrieden sein', 'mit', 'D', 'Ich bin {d:mit dem Ergebnis} zufrieden.'],
  ['stolz sein', 'auf', 'A', 'Wir sind stolz {a:auf dich}.'], ['verheiratet sein', 'mit', 'D', 'Sie ist {d:mit einem Arzt} verheiratet.']
];
const PREPS = ['an', 'auf', 'für', 'mit', 'nach', 'über', 'um', 'von', 'vor', 'zu', 'bei', 'in', 'gegen'];
const pick = (arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
const wo = p => (/^[aeiouäöü]/.test(p) ? 'wor' : 'wo') + p;
const valid = v => L.filter(x => x[0] === v[0]).map(x => x[1]);     // some verbs have two prepositions
const plainEx = s => s.replace(/\{[da]:([^}]*)\}/g, '$1');

GRAM.add({
  n: 104, level: 'Liste', group: 'Nachschlagen und trainieren',
  title: 'Verben mit Präpositionen',
  kicker: 'warten auf, denken an …',
  intro: 'Viele Verben haben eine feste Präposition. Lerne sie immer im Paket: <b>Verb + Präposition + Fall</b>. Nach Sachen fragst du mit <b>wo(r) + Präposition</b> (Worauf wartest du?), nach Personen mit <b>Präposition + wen/wem</b>. Der Trainer gibt dir bei jedem „Neu“ andere Verben.',
  hero: 'Ich warte {a:auf den Bus} und denke {a:an dich}.',
  art: K => {
    const piece = (x, y, t, c, right) => `<g transform="translate(${x} ${y})"><path d="M-80 -36H${right ? 60 : 80}${right ? 'q0 -14 12 -14t12 14v14q-14 0 -14 22t14 22v14q0 14 -12 14t-12 -14' : 'V36'}H-80${right ? '' : 'q0 14 -12 14t-12 -14V22q14 0 14 -22t-14 -22V-22q0 -14 12 -14t12 14'}Z" fill="var(--${c}-s)" stroke="var(--${c})" stroke-width="3"/><text x="0" y="9" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="26" fill="var(--${c})">${t}</text></g>`;
    return K.svg(`<rect width="520" height="360" fill="var(--sky1)"/>` + piece(170, 140, 'warten', 'nom', true) + piece(350, 140, 'auf', 'akk', false) +
      piece(170, 250, 'denken', 'nom', true) + piece(350, 250, 'an', 'akk', false) + K.tag(460, 196, '+ Akk.', 'akk'),
      'Puzzleteile: warten passt zu auf, denken passt zu an.');
  },
  lemmas: {},

  understand: [
    { type: 'cards', title: 'Fragen', min: '14rem', items: [
      { t: 'Sache', k: 'ac', p: 'wo(r) + Präposition', ex: '{e:Worauf} wartest du? – Auf den Bus.' },
      { t: 'Person', k: 'n', p: 'Präposition + wen / wem', ex: '{e:Auf wen} wartest du? – Auf meine Schwester.' } ] },
    { type: 'reflist', title: 'Alle Verben mit Präposition', intro: 'A = Akkusativ, D = Dativ. Tippe auf ein Verb, um es im Wörterbuch zu sehen.', head: ['Verb', 'Präposition', 'Beispiel'],
      rows: L.map(v => [v[0], `{${v[2] === 'A' ? 'a' : 'd'}:${v[1]} + ${v[2] === 'A' ? 'Akk.' : 'Dat.'}}`, v[3]]) }
  ],

  examples: L.slice(0, 7).map(v => v[3]),

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welche Präposition?', instr: 'Wähle die feste Präposition. Bei „Neu“ kommen andere Verben.',
      gen: () => pick(L, 8).map(v => { const wrong = pick(PREPS.filter(p => !valid(v).includes(p)), 2); return `${v[0]} ((${v[1]}|${wrong.join('|')})) …`; }) },
    { id: 'u2', type: 'choice', title: 'Akkusativ oder Dativ?', instr: 'Welchen Fall hat die Präposition hier?',
      gen: () => pick(L, 8).map(v => `${v[0]} ${v[1]} + ((${v[2] === 'A' ? 'Akkusativ|Dativ' : 'Dativ|Akkusativ'}))`) },
    { id: 'u3', type: 'fill', title: 'Im Satz', instr: 'Schreib die Präposition in die Lücke.',
      gen: () => pick(L.filter(v => new RegExp('\\b' + v[1] + '\\b').test(plainEx(v[3]))), 6).map(v => plainEx(v[3]).replace(new RegExp('\\b' + v[1] + '\\b'), `[[${v[1]}]]`)) },
    { id: 'u4', type: 'fill', title: 'Nach Sachen fragen', instr: 'Schreib das Fragewort mit wo(r)-.',
      gen: () => pick(L.filter(v => !/sein|haben/.test(v[0])), 6).map(v => `(${v[0]} ${v[1]}) [[${wo(v[1])}|${wo(v[1]).charAt(0).toUpperCase() + wo(v[1]).slice(1)}]] …?`) }
  ],

  speak: { title: 'Lernkarten', intro: 'Sag Verb + Präposition + Fall – und einen Beispielsatz.', altLabel: 'Frage',
    gen: () => pick(L, 8).map(v => ({ cue: [['x', 'book-open', v[0]]], say: `${v[0]} ${v[1]} + ${v[2] === 'A' ? 'Akkusativ' : 'Dativ'}. ${v[3]}`, alt: `${wo(v[1]).charAt(0).toUpperCase() + wo(v[1]).slice(1)} …?` })) }
});
})();
