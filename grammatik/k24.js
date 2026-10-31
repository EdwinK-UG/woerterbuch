/* Kapitel 24 – Fragen nach Personen und Sachen: wer, wen, wem, was (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 24, level: 'A2', group: 'Pronomen, Nomen und Artikel',
  title: 'Fragen nach Personen und Sachen',
  kicker: 'Wer? Wen? Wem? Was?',
  intro: 'Das Fragewort zeigt den Fall: <b>wer</b> (Nominativ), <b>wen</b> (Akkusativ), <b>wem</b> (Dativ) – für Personen. Für Sachen fragst du mit <b>was</b>. Die Antwort steht im gleichen Fall wie die Frage.',
  hero: '{d:Wem} schenkst {n:du} {a:das Buch}? – {d:Meiner Schwester}.',
  art: K => K.svg(K.room() + K.shadow(160) + K.shadow(380) +
    K.person({ x: 160, shirt: 'var(--nom)', skin: 3, hair: 'curly', hc: 'var(--hair2)', armR: 'out' }) + K.gift(232, 238, 'var(--akk)', 44) +
    K.person({ x: 380, shirt: 'var(--dat)', skin: 1, hair: 'long', hc: 'var(--hair2)', armL: 'up', armR: 'up', face: 'open' }) +
    K.tag(160, 116, 'Wer?', 'nom') + K.tag(232, 150, 'Was?', 'akk') + K.tag(380, 96, 'Wem?', 'dat') +
    K.bubble(440, 62, 'Für *mich*?', { tail: 'l' }),
    'Ein Mann schenkt einer Frau ein Geschenk. Über ihnen: Wer? Was? Wem? Die Frau fragt: Für mich?'),
  lemmas: { Wem: 'wer', wem: 'wer', Wen: 'wer', wen: 'wer', schenkst: 'schenken', rufst: 'anrufen', gehört: 'gehören' },

  understand: [
    { type: 'grid', title: 'Die Fragewörter', head: ['Fall', 'Person', 'Sache'], rows: [
      ['Nominativ', '{n:wer?}', '{n:was?}'], ['Akkusativ', '{a:wen?}', '{a:was?}'], ['Dativ', '{d:wem?}', '–'] ],
      foot: 'Für Sachen gibt es nur <b>was</b> – im Nominativ und im Akkusativ.' },
    { type: 'cards', title: 'Frage und Antwort – im gleichen Fall', min: '13rem', items: [
      { t: 'wer?', k: 'n', ex: '{n:Wer} kommt heute? – {n:Paul} kommt.' },
      { t: 'wen?', k: 'a', ex: '{a:Wen} besuchst du? – {a:Meine Oma}.' },
      { t: 'wem?', k: 'd', ex: '{d:Wem} hilfst du? – {d:Meinem Bruder}.' },
      { t: 'was?', k: 'a', ex: '{a:Was} kaufst du? – {a:Ein Buch}.' } ] },
    { type: 'note', title: 'Mit Präposition', text: 'Die Präposition bestimmt den Fall: Mit {d:wem} gehst du ins Kino? – Mit {d:Lisa}. · Für {a:wen} ist das? – Für {a:dich}. Die Präposition steht vor dem Fragewort.' },
    { type: 'merk', text: 'Frage {d:wem}? – Antwort {d:dem / der / den …}. Gleicher Fall!' }
  ],

  examples: [
    '{n:Wer} ist der Mann dort?',
    '{a:Wen} rufst du an?',
    '{d:Wem} gehört das Handy?',
    '{a:Was} möchtest du trinken?',
    'Mit {d:wem} wohnst du zusammen?',
    'Für {a:wen} kochst du heute?',
    '{d:Wem} schenkst du die Blumen?'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welches Fragewort?', instr: 'Lies die Antwort und wähle das Fragewort.',
      items: [
        '((Wen|Wem|Wer)) besuchst du? – Meine Tante.', '((Wem|Wen|Wer)) hilfst du? – Meinem Opa.', '((Wer|Wen|Wem)) wohnt hier? – Familie Kato.',
        '((Was|Wen|Wem)) isst du? – Einen Apfel.', '((Wem|Wen|Wer)) gehört der Schlüssel? – Mir.', '((Wen|Wem|Wer)) liebst du? – Dich!',
        'Mit ((wem|wen|wer)) sprichst du? – Mit dem Chef.', 'Für ((wen|wem|wer)) ist der Kuchen? – Für die Kinder.' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze das Fragewort', instr: 'Schreib wer, wen, wem oder was.',
      items: [
        '[[Wer]] kommt mit? – Lena und Tom.', '[[Wen]] fragst du? – Den Lehrer.', '[[Wem]] schreibst du? – Meiner Freundin.',
        '[[Was]] suchst du? – Meine Brille.', 'Mit [[wem]] fährst du? – Mit meinen Eltern.', 'Für [[wen]] ist das? – Für dich.' ] },
    { id: 'u3', type: 'type', title: 'Frag nach dem markierten Teil', instr: 'Schreib die Frage.',
      items: [
        { q: 'Ich besuche [meinen Onkel].', pre: '', end: '?', ok: ['Wen besuchst du'] },
        { q: 'Ich helfe [meiner Schwester].', pre: '', end: '?', ok: ['Wem hilfst du'] },
        { q: '[Paul] spielt Gitarre.', pre: '', end: '?', ok: ['Wer spielt Gitarre'] },
        { q: 'Ich kaufe [eine Jacke].', pre: '', end: '?', ok: ['Was kaufst du'] },
        { q: 'Das Buch gehört [mir].', pre: '', end: '?', ok: ['Wem gehört das Buch'] },
        { q: 'Ich gehe mit [Lisa] ins Kino.', pre: '', end: '?', ok: ['Mit wem gehst du ins Kino'] } ] },
    { id: 'u4', type: 'cases', title: 'Welcher Fall?', instr: 'Tippe auf jeden markierten Teil, bis die richtige Farbe erscheint.',
      items: [
        '{d:Wem} gibst {n:du} {a:das Geld}?', '{a:Wen} sucht {n:der Polizist}?', '{n:Wer} hilft {d:dir}?',
        '{a:Was} schenkt {n:ihr} {d:Oma}?', '{d:Wem} gefällt {n:der Film}?', '{a:Wen} lädst {n:du} ein?' ] }
  ],

  speak: { title: 'Frag nach!', intro: 'Du hörst eine Information. Frag nach dem markierten Teil.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'phone', 'Ich rufe [Tom] an.']], say: '{a:Wen} rufst du an?' },
      { cue: [['x', 'hand-helping', 'Ich helfe [meiner Mutter].']], say: '{d:Wem} hilfst du?' },
      { cue: [['x', 'door-open', '[Lena] kommt heute.']], say: '{n:Wer} kommt heute?' },
      { cue: [['x', 'shopping-bag', 'Ich kaufe [Brot].']], say: '{a:Was} kaufst du?' },
      { cue: [['x', 'smartphone', 'Das Handy gehört [Sami].']], say: '{d:Wem} gehört das Handy?' },
      { cue: [['x', 'users', 'Ich fahre mit [Ben] nach Köln.']], say: 'Mit {d:wem} fährst du nach Köln?' } ] }
});
