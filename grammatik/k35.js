/* Kapitel 35 – Wo? Ortsangaben mit Dativ (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 35, level: 'A1', group: 'Präpositionen 1',
  title: 'Wo? Ortsangaben mit Dativ',
  kicker: 'Die Katze sitzt auf dem Tisch.',
  intro: 'Mit <b>in, an, auf, unter, über, vor, hinter, neben, zwischen</b> sagst du, <b>wo</b> etwas ist. Bei der Frage <b>Wo?</b> steht nach diesen Präpositionen der <b>Dativ</b>.',
  hero: 'Die Katze sitzt {d:auf dem Tisch}, der Ball liegt {d:unter dem Tisch}.',
  art: K => K.svg(K.room() +
    `<path d="M250 0V58" stroke="var(--ink)" stroke-width="3"/><path d="M220 86q30 -40 60 0z" fill="var(--nom)"/><circle cx="250" cy="90" r="7" fill="var(--sun)"/>` +
    `<rect x="40" y="70" width="90" height="70" rx="4" fill="var(--card)" stroke="var(--wood)" stroke-width="5"/><path d="M50 128l24 -30l18 18l12 -12l18 24z" fill="var(--hill1)"/><circle cx="108" cy="90" r="8" fill="var(--sun)"/>` +
    K.table(250, 230, 220) + K.cat(250, 230, { s: .9 }) +
    `<circle cx="250" cy="310" r="15" fill="var(--die)"/><path d="M237 304q13 8 26 0M250 295v30" stroke="var(--card)" stroke-width="2" fill="none" opacity=".7"/>` +
    `<path d="M410 296h52l-6 -40h-40z" fill="var(--wood)"/><g fill="var(--hill1)"><ellipse cx="436" cy="232" rx="22" ry="34"/><ellipse cx="416" cy="246" rx="14" ry="22"/><ellipse cx="456" cy="246" rx="14" ry="22"/></g>` +
    `<rect x="78" y="226" width="44" height="70" rx="6" fill="var(--akk)"/><rect x="72" y="214" width="56" height="16" rx="6" fill="var(--akk)"/>` +
    K.tag(312, 84, 'über', 'nom') + K.tag(326, 196, 'auf', 'dat') + K.tag(310, 314, 'unter', 'die') + K.tag(436, 170, 'neben', 'akk') + K.tag(85, 160, 'an', 'der'),
    'Ein Zimmer: Eine Lampe hängt über dem Tisch, eine Katze sitzt auf dem Tisch, ein Ball liegt unter dem Tisch, eine Pflanze steht neben dem Tisch, ein Bild hängt an der Wand.'),
  lemmas: { sitzt: 'sitzen', liegt: 'liegen', steht: 'stehen', hängt: 'hängen', im: 'in', am: 'an' },

  understand: [
    { type: 'cards', title: 'Wo ist das?', min: '11rem', items: [
      { t: 'auf', k: 'd', ex: 'Die Katze sitzt {d:auf dem Tisch}.' }, { t: 'unter', k: 'd', ex: 'Der Ball liegt {d:unter dem Tisch}.' },
      { t: 'über', k: 'd', ex: 'Die Lampe hängt {d:über dem Tisch}.' }, { t: 'neben', k: 'd', ex: 'Die Pflanze steht {d:neben dem Tisch}.' },
      { t: 'an', k: 'd', ex: 'Das Bild hängt {d:an der Wand}.' }, { t: 'in', k: 'd', ex: 'Die Milch ist {d:im Kühlschrank}.' },
      { t: 'vor', k: 'd', ex: 'Das Auto steht {d:vor dem Haus}.' }, { t: 'hinter', k: 'd', ex: 'Der Garten ist {d:hinter dem Haus}.' },
      { t: 'zwischen', k: 'd', ex: 'Der Stuhl steht {d:zwischen dem Tisch und dem Sofa}.' } ] },
    { type: 'grid', title: 'an oder auf?', head: ['', 'Beispiel', 'Wann?'], rows: [
      ['auf', 'Das Buch liegt {d:auf dem Tisch}.', 'auf einer Fläche (horizontal)'],
      ['an', 'Das Bild hängt {d:an der Wand}.', 'an einer Seite, Kante (vertikal)'] ] },
    { type: 'note', title: 'Kurzformen', text: 'in dem → {d:im} · an dem → {d:am}: Ich bin {d:im} Kino. Wir sind {d:am} Strand.' },
    { type: 'merk', text: 'Frage {e:Wo?} → Dativ: {d:auf dem}, {d:in der}, {d:neben den …n}' }
  ],

  examples: [
    'Mein Handy liegt {d:auf dem Sofa}.',
    'Die Schuhe stehen {d:unter dem Bett}.',
    'Wir wohnen {d:neben einer Schule}.',
    'Das Auto steht {d:vor dem Haus}.',
    'Der Kalender hängt {d:an der Wand}.',
    'Die Kinder spielen {d:hinter dem Haus}.',
    'Das Café ist {d:zwischen der Bank und der Post}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Was passt zum Bild?', instr: 'Schau das Bild oben an und wähle die passende Präposition.',
      items: [
        'Die Katze sitzt ((auf|unter|neben)) dem Tisch.', 'Der Ball liegt ((unter|auf|über)) dem Tisch.', 'Die Lampe hängt ((über|unter|an)) dem Tisch.',
        'Die Pflanze steht ((neben|auf|in)) dem Tisch.', 'Das Bild hängt ((an|auf|unter)) der Wand.', 'Der Schrank steht ((an|auf|über)) der Wand.' ] },
    { id: 'u2', type: 'fill', title: 'Der Dativ', instr: 'Schreib den Artikel im Dativ.',
      items: [
        'Das Buch liegt auf [[dem]] Tisch. (der Tisch)', 'Die Milch steht in [[dem]] Kühlschrank. (der Kühlschrank)', 'Das Bild hängt an [[der]] Wand. (die Wand)',
        'Der Hund schläft unter [[dem]] Bett. (das Bett)', 'Wir warten vor [[der]] Tür. (die Tür)', 'Ich sitze zwischen [[den]] Kindern. (die Kinder)' ] },
    { id: 'u3', type: 'fill', title: 'im oder am?', instr: 'Schreib die Kurzform im oder am.',
      items: [
        'Wir sind [[im]] Kino.', 'Das Restaurant ist [[am]] Bahnhof.', 'Die Kinder spielen [[im]] Garten.',
        'Wir liegen [[am]] Strand.', 'Er arbeitet [[im]] Büro.', 'Das Schild hängt [[am]] Fenster.' ] },
    { id: 'u4', type: 'type', title: 'Wo ist …?', instr: 'Antworte mit der Information in Klammern.',
      items: [
        { q: 'Wo ist der Schlüssel? (auf · der Tisch)', pre: 'Der Schlüssel ist', end: '.', ok: ['auf dem Tisch'] },
        { q: 'Wo ist die Katze? (unter · das Sofa)', pre: 'Die Katze ist', end: '.', ok: ['unter dem Sofa'] },
        { q: 'Wo hängt die Uhr? (an · die Wand)', pre: 'Die Uhr hängt', end: '.', ok: ['an der Wand'] },
        { q: 'Wo wartet Paul? (vor · das Kino)', pre: 'Paul wartet', end: '.', ok: ['vor dem Kino'] },
        { q: 'Wo ist die Post? (neben · die Bank)', pre: 'Die Post ist', end: '.', ok: ['neben der Bank'] },
        { q: 'Wo ist der Garten? (hinter · das Haus)', pre: 'Der Garten ist', end: '.', ok: ['hinter dem Haus'] } ] }
  ],

  speak: { title: 'Mein Zimmer', intro: 'Beschreib, wo die Dinge sind.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'smartphone', 'das Handy'], ['d', 'sofa', 'auf · das Sofa']], say: 'Das Handy liegt {d:auf dem Sofa}.' },
      { cue: [['x', 'footprints', 'die Schuhe'], ['d', 'bed', 'unter · das Bett']], say: 'Die Schuhe stehen {d:unter dem Bett}.' },
      { cue: [['x', 'image', 'das Bild'], ['d', 'square', 'an · die Wand']], say: 'Das Bild hängt {d:an der Wand}.' },
      { cue: [['x', 'lamp', 'die Lampe'], ['d', 'table', 'über · der Tisch']], say: 'Die Lampe hängt {d:über dem Tisch}.' },
      { cue: [['x', 'sprout', 'die Pflanze'], ['d', 'app-window', 'neben · das Fenster']], say: 'Die Pflanze steht {d:neben dem Fenster}.' },
      { cue: [['x', 'milk', 'die Milch'], ['d', 'refrigerator', 'in · der Kühlschrank']], say: 'Die Milch ist {d:im Kühlschrank}.' } ] }
});
