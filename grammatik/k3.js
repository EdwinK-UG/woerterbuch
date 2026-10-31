/* Kapitel 3 – sein, haben und möchten (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 3, level: 'A1', group: 'Verben 1',
  title: 'sein, haben und möchten',
  kicker: 'Ich bin müde und habe Hunger.',
  intro: '<b>sein</b> und <b>haben</b> sind die wichtigsten Verben im Deutschen – und sie sind unregelmäßig. <b>möchten</b> brauchst du immer, wenn du höflich etwas haben willst.',
  hero: 'Ich {e:bin} müde, ich {e:habe} Hunger und ich {e:möchte} eine Pizza.',
  art: K => K.svg(K.room() + K.shadow(150) + K.shadow(392) + K.table(272, 238, 132) + K.cup(246, 238) + K.plate(298, 238) +
    K.person({ x: 150, shirt: 'var(--dat)', skin: 4, hair: 'bun', hc: 'var(--hair4)', armR: 'front', face: 'o' }) +
    K.person({ x: 392, shirt: 'var(--akk)', apron: 'var(--card)', skin: 1, hair: 'short', armL: 'front', glasses: true,
      extra: '<rect x="-80" y="-118" width="24" height="30" rx="3" fill="var(--card)" stroke="var(--line)" stroke-width="1.5" transform="rotate(-8)"/>' }) +
    K.bubble(140, 76, 'Ich *bin* müde …', { tail: 'c' }) + K.bubble(176, 122, '… und ich *habe* Hunger!', { tail: 'l' }) + K.bubble(392, 102, 'Was *möchten* Sie?', { tail: 'c' }),
    'Im Café: Ein Gast ist müde und hat Hunger. Der Kellner fragt: Was möchten Sie?'),
  lemmas: { bin: 'sein', bist: 'sein', habe: 'haben', habt: 'haben', Habt: 'haben', möchte: ['möchten', 'mögen'] },

  understand: [
    { type: 'conj', title: 'Die Formen', intro: 'sein und haben sind unregelmäßig – lern sie auswendig!', verbs: {
      sein: { f: ['{e:bin}', '{e:bist}', '{e:ist}', '{e:sind}', '{e:seid}', '{e:sind}'], n: 'Jede Form ist anders. Tipp: Sprich sie laut, wie ein Lied: bin – bist – ist – sind – seid – sind.' },
      haben: { f: ['habe', 'ha{e:st}', 'ha{e:t}', 'haben', 'habt', 'haben'], n: 'Bei du und er/sie/es fällt das <b>b</b> weg: du ha<b>st</b>, er ha<b>t</b>.' },
      möchten: { f: ['möchte', 'möchtest', 'möcht{e:e}', 'möchten', 'möchtet', 'möchten'], n: 'Vorsicht: er/sie/es möcht<b>e</b> – ohne -t, genau wie ich möchte.' } } },
    { type: 'cards', title: 'Wofür brauche ich was?', min: '13rem', items: [
      { t: 'sein', k: 'n', icon: 'user-round', p: 'Name, Herkunft, Beruf, Alter, Eigenschaften, Ort.', ex: 'Ich {e:bin} Lehrerin. Das Wetter {e:ist} schön.' },
      { t: 'haben', k: 'd', icon: 'hand', p: 'Besitz, Familie, Zeit – und Hunger, Durst, Angst.', ex: 'Ich {e:habe} zwei Brüder. {e:Hast} du Zeit?' },
      { t: 'möchten', k: 'a', icon: 'heart', p: 'Wünsche, höflich bestellen und einkaufen.', ex: 'Ich {e:möchte} einen Tee, bitte.' } ] },
    { type: 'merk', text: 'Hunger, Durst, Zeit, Angst – das {e:hat} man: Ich {e:habe} Hunger. (Nicht: Ich bin Hunger.)' },
    { type: 'note', title: 'Mit Adjektiv: sein', text: 'Wie geht es dir? Mit einem Adjektiv brauchst du sein: Ich {e:bin} müde. Wir {e:sind} glücklich. Das Essen {e:ist} lecker.' }
  ],

  examples: [
    'Ich {e:bin} Studentin und {e:habe} heute keine Zeit.',
    '{e:Bist} du müde? – Ja, sehr.',
    'Wir {e:haben} zwei Kinder.',
    'Das {e:ist} Herr Mukasa. Er {e:ist} Arzt.',
    '{e:Habt} ihr Durst?',
    'Ich {e:möchte} einen Kaffee, bitte.',
    'Was {e:möchtest} du essen?'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'sein oder haben?', instr: 'Wähle die richtige Form.',
      items: [
        'Ich ((bin|habe|ist)) 25 Jahre alt.', '((Hast|Bist|Hat)) du Hunger?', 'Wir ((sind|haben|seid)) aus Ghana.',
        'Er ((hat|ist|habt)) ein Auto.', 'Ihr ((seid|sind|habt)) sehr nett.', 'Die Kinder ((haben|sind|hat)) heute keine Schule.',
        'Das Zimmer ((ist|hat|bin)) sehr klein.', 'Frau Kato, ((haben|sind|hat)) Sie einen Moment Zeit?' ] },
    { id: 'u2', type: 'fill', title: 'möchten', instr: 'Ergänze möchten in der richtigen Form.',
      items: [
        'Ich [[möchte]] ein Wasser, bitte.', 'Was [[möchtest]] du trinken?', 'Er [[möchte]] einen Salat.',
        'Wir [[möchten]] bitte zahlen.', '[[Möchtet]] ihr ein Stück Kuchen?', 'Die Gäste [[möchten]] einen Tisch am Fenster.' ] },
    { id: 'u3', type: 'order', title: 'Sätze bauen', instr: 'Tippe die Teile in der richtigen Reihenfolge an.',
      items: [
        { tiles: ['Ich', 'habe', 'heute', 'keine Zeit'], end: '.', ok: ['Ich habe heute keine Zeit'] },
        { tiles: ['Was', 'möchten', 'Sie', 'trinken'], end: '?', ok: ['Was möchten Sie trinken'] },
        { tiles: ['Mein Bruder', 'ist', 'Koch'], end: '.', ok: ['Mein Bruder ist Koch'] },
        { tiles: ['Habt', 'ihr', 'Hunger'], end: '?', ok: ['Habt ihr Hunger'] },
        { tiles: ['Wir', 'möchten', 'einen Tisch', 'für zwei Personen'], end: '.', ok: ['Wir möchten einen Tisch für zwei Personen'] },
        { tiles: ['Das Wetter', 'ist', 'heute', 'schön'], end: '.', ok: ['Das Wetter ist heute schön'] } ] },
    { id: 'u4', type: 'fill', title: 'Die richtige Form', instr: 'Schreib sein oder haben in der richtigen Form.',
      items: [
        '(sein) Wo [[ist]] der Bahnhof?', '(haben) [[Hast]] du ein Handy?', '(sein) Wir [[sind]] im Kino.',
        '(haben) Ihr [[habt]] viel Glück!', '(sein) [[Seid]] ihr fertig?', '(haben) Meine Eltern [[haben]] ein Haus am See.' ] }
  ],

  speak: { title: 'Sag es!', intro: 'Bilde einen Satz mit sein, haben oder möchten.', altLabel: 'Antwort',
    items: [
      { cue: [['n', 'user-round', 'ich'], ['x', 'utensils', 'Hunger']], say: 'Ich {e:habe} Hunger.' },
      { cue: [['n', 'user-round', 'du'], ['x', 'clock', 'Zeit?']], say: '{e:Hast} du Zeit?', alt: 'Ja, ich {e:habe} Zeit.' },
      { cue: [['n', 'users', 'wir'], ['x', 'map-pin', 'aus Uganda']], say: 'Wir {e:sind} aus Uganda.' },
      { cue: [['n', 'user-round', 'ich'], ['x', 'coffee', 'ein Tee']], say: 'Ich {e:möchte} einen Tee, bitte.' },
      { cue: [['n', 'user-round', 'Frau Lee'], ['x', 'stethoscope', 'Ärztin']], say: 'Frau Lee {e:ist} Ärztin.' },
      { cue: [['n', 'users', 'ihr'], ['x', 'glass-water', 'Durst?']], say: '{e:Habt} ihr Durst?', alt: 'Ja, wir {e:haben} Durst.' } ] }
});
