/* Nachschlagen – Verben mit Dativ und Akkusativ. Liste und Trainer (jede Runde neue Sätze). */
(function () {
// [Verb, Beispiel mit Nominativ/Dativ/Akkusativ]
const L = [
  ['geben', '{n:Ich} gebe {d:dem Kind} {a:den Ball}.'], ['schenken', '{n:Wir} schenken {d:unserer Mutter} {a:Blumen}.'], ['bringen', '{n:Der Kellner} bringt {d:dem Gast} {a:die Suppe}.'],
  ['zeigen', '{n:Ich} zeige {d:dir} {a:die Stadt}.'], ['schicken', '{n:Sie} schickt {d:ihrem Freund} {a:ein Foto}.'], ['schreiben', '{n:Er} schreibt {d:seiner Oma} {a:einen Brief}.'],
  ['erklären', '{n:Die Lehrerin} erklärt {d:den Schülern} {a:die Regel}.'], ['erzählen', '{n:Opa} erzählt {d:den Kindern} {a:eine Geschichte}.'], ['empfehlen', '{n:Ich} empfehle {d:Ihnen} {a:den Fisch}.'],
  ['leihen', 'Kannst {n:du} {d:mir} {a:dein Fahrrad} leihen?'], ['kaufen', '{n:Wir} kaufen {d:dem Baby} {a:einen Teddy}.'], ['sagen', 'Sag {d:mir} {a:die Wahrheit}!'],
  ['wünschen', '{n:Ich} wünsche {d:dir} {a:viel Glück}.'], ['anbieten', 'Darf {n:ich} {d:Ihnen} {a:einen Kaffee} anbieten?'], ['zurückgeben', 'Gib {d:mir} {a:das Buch} zurück!'],
  ['mitbringen', '{n:Er} bringt {d:uns} {a:Kuchen} mit.'], ['verkaufen', '{n:Der Nachbar} verkauft {d:mir} {a:sein Auto}.'], ['reichen', 'Reich {d:mir} bitte {a:das Salz}!'],
  ['verbieten', '{n:Der Arzt} verbietet {d:ihm} {a:den Zucker}.'], ['erlauben', '{n:Die Eltern} erlauben {d:dem Kind} {a:das Handy}.'], ['vorlesen', '{n:Papa} liest {d:den Kindern} {a:ein Märchen} vor.'],
  ['beibringen', '{n:Sie} bringt {d:mir} {a:Suaheli} bei.'], ['beschreiben', 'Beschreib {d:mir} {a:den Weg}!'], ['kochen', '{n:Ich} koche {d:meinen Freunden} {a:eine Suppe}.']
];
// für die Pronomen-Übung: [Satzanfang, Dativ-Nomen, Dativ-Pronomen, Akkusativ-Nomen, Akkusativ-Pronomen]
const T = [
  ['Ich gebe', 'dem Kind', 'ihm', 'den Ball', 'ihn'], ['Sie schenkt', 'ihrer Schwester', 'ihr', 'die Kette', 'sie'], ['Wir zeigen', 'den Gästen', 'ihnen', 'das Zimmer', 'es'],
  ['Er bringt', 'seiner Mutter', 'ihr', 'den Kaffee', 'ihn'], ['Ich leihe', 'meinem Bruder', 'ihm', 'das Auto', 'es'], ['Du erklärst', 'den Kindern', 'ihnen', 'die Aufgabe', 'sie'],
  ['Wir schicken', 'dem Chef', 'ihm', 'den Brief', 'ihn'], ['Ich empfehle', 'meiner Freundin', 'ihr', 'das Buch', 'es']
];
const pick = (arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };

GRAM.add({
  n: 103, level: 'Liste', group: 'Nachschlagen und trainieren',
  title: 'Verben mit Dativ und Akkusativ',
  kicker: 'jemandem etwas geben',
  intro: 'Diese Verben haben zwei Objekte: eine <b>Person im Dativ</b> (wem?) und eine <b>Sache im Akkusativ</b> (was?). Zwei Nomen: Dativ vor Akkusativ. Ein Pronomen: Pronomen zuerst. Zwei Pronomen: Akkusativ vor Dativ (Kapitel 22).',
  hero: '{n:Ich} gebe {d:dir} {a:das Buch}. – {n:Ich} gebe {a:es} {d:dir}.',
  art: K => K.svg(K.sky() + K.shadow(150) + K.shadow(380) +
    K.person({ x: 150, shirt: 'var(--nom)', skin: 3, hair: 'short', hc: 'var(--hair2)', armR: 'out' }) + K.gift(232, 238, 'var(--akk)', 44) +
    K.person({ x: 380, shirt: 'var(--dat)', skin: 1, hair: 'bun', armL: 'out', face: 'open' }) +
    K.tag(150, 112, 'Wer?', 'nom') + K.tag(232, 150, 'Was?', 'akk') + K.tag(380, 112, 'Wem?', 'dat'),
    'Ein Mann gibt einer Frau ein Geschenk: Wer? Was? Wem?'),
  lemmas: {},

  understand: [
    { type: 'grid', title: 'Die Reihenfolge', head: ['', 'Beispiel'], rows: [
      ['zwei Nomen', 'Ich gebe {d:dem Kind} {a:den Ball}.'], ['Dativ als Pronomen', 'Ich gebe {d:ihm} {a:den Ball}.'], ['Akkusativ als Pronomen', 'Ich gebe {a:ihn} {d:dem Kind}.'], ['zwei Pronomen', 'Ich gebe {a:ihn} {d:ihm}.'] ],
      foot: 'Merke: Pronomen vor Nomen – und zwei Pronomen: erst Akkusativ, dann Dativ („Gib es mir!“).' },
    { type: 'reflist', title: 'Alle Verben', intro: 'Tippe auf ein Verb, um es im Wörterbuch zu sehen.', head: ['Verb', 'Beispiel'], rows: L.map(v => [v[0], v[1]]) }
  ],

  examples: L.slice(0, 7).map(v => v[1]),

  exercises: [
    { id: 'u1', type: 'cases', title: 'Wer? Wem? Was?', instr: 'Tippe auf die markierten Satzteile, bis die richtige Farbe erscheint. Bei „Neu“ kommen andere Sätze.', gen: () => pick(L, 6).map(v => v[1]) },
    { id: 'u2', type: 'type', title: 'Mit Pronomen', instr: 'Ersetze die markierten Teile durch Pronomen. Achte auf die Reihenfolge!',
      gen: () => pick(T, 6).map(t => { const k = Math.floor(Math.random() * 3);
        if (k === 0) return { q: `${t[0]} [${t[1]}] ${t[3]}.`, pre: t[0], end: '.', ok: [`${t[2]} ${t[3]}`] };
        if (k === 1) return { q: `${t[0]} ${t[1]} [${t[3]}].`, pre: t[0], end: '.', ok: [`${t[4]} ${t[1]}`] };
        return { q: `${t[0]} [${t[1]}] [${t[3]}].`, pre: t[0], end: '.', ok: [`${t[4]} ${t[2]}`] }; }) }
  ],

  speak: { title: 'Lernkarten', intro: 'Bilde einen Satz mit dem Verb – Wer? Wem? Was?', altLabel: 'Weiter', gen: () => pick(L, 8).map(v => ({ cue: [['x', 'book-open', v[0]], ['d', '', 'wem?'], ['a', '', 'was?']], say: v[1] })) }
});
})();
