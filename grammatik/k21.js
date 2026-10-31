/* Kapitel 21 – Personalpronomen im Akkusativ und Dativ (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 21, level: 'A1', group: 'Pronomen, Nomen und Artikel',
  title: 'Personalpronomen im Akkusativ und Dativ',
  kicker: 'mich, mir, dich, dir …',
  intro: 'Auch Pronomen haben Fälle: <b>ich</b> sehe – du siehst <b>mich</b> (Akkusativ) – du hilfst <b>mir</b> (Dativ). Welchen Fall du brauchst, sagt dir das Verb oder die Präposition.',
  hero: 'Siehst du {a:mich}? – Ja, ich sehe {a:dich}!',
  art: K => K.svg(K.sky() + K.tree(262, 316, .95) + K.shadow(110) + K.shadow(420) +
    K.person({ x: 110, shirt: 'var(--akk)', skin: 4, hair: 'long', hc: 'var(--hair4)', armR: 'wave', face: 'open' }) +
    K.person({ x: 420, shirt: 'var(--nom)', skin: 1, hair: 'curly', armL: 'wave', armR: 'up', face: 'open' }) +
    K.bubble(122, 92, 'Siehst du *mich*?', { tail: 'c' }) + K.bubble(410, 120, 'Ja, ich sehe *dich*!', { tail: 'c' }),
    'Zwei Freunde auf beiden Seiten eines Baums winken sich zu: Siehst du mich? – Ja, ich sehe dich!'),
  lemmas: { mich: 'ich', mir: 'ich', dich: 'du', dir: 'du', ihn: 'er', ihm: 'er', uns: 'wir', euch: 'ihr', Ihnen: 'Sie', Siehst: 'sehen' },

  understand: [
    { type: 'grid', title: 'Alle Formen', head: ['Nominativ', 'Akkusativ', 'Dativ'], label: false, rows: [
      ['ich', '{a:mich}', '{d:mir}'], ['du', '{a:dich}', '{d:dir}'], ['er', '{a:ihn}', '{d:ihm}'], ['sie', '{a:sie}', '{d:ihr}'], ['es', '{a:es}', '{d:ihm}'],
      ['wir', '{a:uns}', '{d:uns}'], ['ihr', '{a:euch}', '{d:euch}'], ['sie', '{a:sie}', '{d:ihnen}'], ['Sie', '{a:Sie}', '{d:Ihnen}'] ],
      foot: 'wir und ihr haben im Akkusativ und Dativ die gleiche Form: uns, euch.' },
    { type: 'cards', title: 'Wann Akkusativ, wann Dativ?', min: '14rem', items: [
      { t: 'Akkusativ', k: 'a', s: 'wen?', p: 'Nach Verben wie sehen, besuchen, anrufen, lieben, fragen – und nach <b>für, ohne, durch, gegen, um</b>.', ex: 'Ich rufe {a:dich} an. Das ist für {a:dich}.' },
      { t: 'Dativ', k: 'd', s: 'wem?', p: 'Nach Verben wie helfen, danken, gefallen, gehören – und nach <b>mit, bei, von, zu, aus, nach, seit</b>.', ex: 'Hilfst du {d:mir}? Kommst du mit {d:uns}?' } ] },
    { type: 'note', title: 'Dreimal „ihr“', text: '{e:ihr} kann drei Dinge sein: das Pronomen für „du + du“ (Kommt {e:ihr}?), der Dativ von sie (Ich helfe {e:ihr}.) und der Possessivartikel ({e:ihr} Bruder).' },
    { type: 'merk', text: '{a:mich} und {a:dich} = Akkusativ (wen?) · {d:mir} und {d:dir} = Dativ (wem?)' }
  ],

  examples: [
    'Ich rufe {a:dich} morgen an.',
    'Kannst du {d:mir} helfen?',
    'Wir besuchen {a:euch} am Sonntag.',
    'Das Geschenk ist für {a:dich}.',
    'Kommst du mit {d:uns}?',
    'Der Film gefällt {d:ihm} nicht.',
    'Vielen Dank! Ich danke {d:Ihnen}!'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Akkusativ oder Dativ?', instr: 'Wähle das richtige Pronomen.',
      items: [
        'Siehst du ((mich|mir))?', 'Kannst du ((mir|mich)) helfen?', 'Ich rufe ((dich|dir)) heute an.', 'Das Buch gehört ((ihm|ihn)).',
        'Kommst du mit ((uns|wir))?', 'Wir besuchen ((euch|ihr)) morgen.', 'Der Kuchen ist für ((dich|dir)).', 'Ich danke ((Ihnen|Sie)) sehr!' ] },
    { id: 'u2', type: 'fill', title: 'Nomen → Pronomen', instr: 'Ersetze das Nomen durch ein Pronomen.',
      items: [
        'Ich sehe den Mann. → Ich sehe [[ihn]].', 'Ich helfe der Frau. → Ich helfe [[ihr]].', 'Wir besuchen die Kinder. → Wir besuchen [[sie]].',
        'Er dankt dem Lehrer. → Er dankt [[ihm]].', 'Das gehört den Kindern. → Das gehört [[ihnen]].', 'Ich rufe Lisa an. → Ich rufe [[sie]] an.' ] },
    { id: 'u3', type: 'fill', title: 'Nach Präpositionen', instr: 'Schreib das Pronomen in der richtigen Form.',
      items: [
        '(ich) Kommst du mit [[mir]]?', '(du) Das ist für [[dich]].', '(wir) Wohnst du bei [[uns]]?',
        '(er) Ohne [[ihn]] fahren wir nicht.', '(sie, Singular) Ich gehe zu [[ihr]].', '(ihr) Wir spielen gegen [[euch]].' ] },
    { id: 'u4', type: 'cases', title: 'Welcher Fall?', instr: 'Tippe auf jeden markierten Teil, bis die richtige Farbe erscheint.',
      items: [
        '{n:Ich} helfe {d:dir}.', '{n:Du} siehst {a:mich}.', '{n:Wir} besuchen {a:ihn}.',
        'Gefällt {d:dir} {n:die Musik}?', '{n:Er} gibt {d:mir} {a:das Buch}.', '{n:Sie} ruft {a:uns} an.' ] }
  ],

  speak: { title: 'Sag es mit Pronomen', intro: 'Bilde den Satz. Akkusativ oder Dativ?', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'phone', 'anrufen'], ['n', 'user-round', 'ich']], say: 'Ruf {a:mich} an!' },
      { cue: [['x', 'hand-helping', 'helfen'], ['n', 'user-round', 'ich']], say: 'Kannst du {d:mir} helfen?' },
      { cue: [['x', 'gift', 'für'], ['n', 'user-round', 'du']], say: 'Das ist für {a:dich}.' },
      { cue: [['x', 'users', 'mit'], ['n', 'users', 'wir']], say: 'Komm doch mit {d:uns}!' },
      { cue: [['x', 'heart', 'gefallen'], ['n', 'user-round', 'er']], say: 'Das gefällt {d:ihm}.' },
      { cue: [['x', 'house', 'besuchen'], ['n', 'users', 'ihr']], say: 'Wir besuchen {a:euch}.' } ] }
});
