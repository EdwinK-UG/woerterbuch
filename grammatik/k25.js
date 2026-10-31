/* Kapitel 25 – Präteritum von sein und haben (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 25, level: 'A1', group: 'Verben 2',
  title: 'Präteritum von sein und haben',
  kicker: 'Ich war, ich hatte',
  intro: 'Wenn du über die Vergangenheit sprichst, benutzt du bei <b>sein</b> und <b>haben</b> meistens das <b>Präteritum</b>: ich <b>war</b>, ich <b>hatte</b>. Auch „es gibt“ wird zu „es <b>gab</b>“.',
  hero: 'Gestern {e:war} ich krank und {e:hatte} Fieber.',
  art: K => K.svg(K.room() + K.shadow(170) + K.shadow(380) +
    K.person({ x: 170, shirt: 'var(--dat)', skin: 1, hair: 'short', armR: 'front', face: 'flat',
      extra: '<path d="M-24 -136q24 14 48 0v12q-24 14-48 0z" fill="var(--die)"/><path d="M14 -128l6 34h-12z" fill="var(--die)"/>' + K.cup(51, -84) }) +
    K.person({ x: 380, shirt: 'var(--nom)', skin: 4, hair: 'bun', hc: 'var(--hair3)', armL: 'out', face: 'open' }) +
    K.bubble(380, 96, 'Wo *warst* du gestern?', { tail: 'c' }) + K.bubble(160, 76, 'Ich *war* krank.', { tail: 'c' }) + K.bubble(196, 122, 'Ich *hatte* Fieber.', { tail: 'l' }),
    'Ein Mann mit Schal und Tee: Ich war krank. Ich hatte Fieber. Eine Freundin fragt: Wo warst du gestern?'),
  lemmas: { war: 'sein', warst: 'sein', waren: 'sein', wart: 'sein', Wart: 'sein', hatte: 'haben', hatten: 'haben', hattest: 'haben', gab: 'geben' },

  understand: [
    { type: 'conj', title: 'Die Formen', intro: 'ich und er/sie/es sind gleich – ohne Endung.', verbs: {
      sein: { f: ['{e:war}', 'war{e:st}', '{e:war}', 'war{e:en}', 'war{e:t}', 'war{e:en}'], n: 'sein → war: Der Stamm ist <b>war</b>.' },
      haben: { f: ['{e:hatte}', 'hatte{e:st}', '{e:hatte}', 'hatte{e:n}', 'hatte{e:t}', 'hatte{e:n}'], n: 'haben → hatte: Der Stamm ist <b>hatte</b>.' } } },
    { type: 'grid', title: 'Gegenwart → Vergangenheit', head: ['', 'Präsens', 'Präteritum'], rows: [
      ['sein', 'Ich {e:bin} müde.', 'Ich {e:war} müde.'], ['haben', 'Wir {e:haben} Zeit.', 'Wir {e:hatten} Zeit.'], ['es gibt', 'Es {e:gibt} Kuchen.', 'Es {e:gab} Kuchen.'] ] },
    { type: 'cards', title: 'Wörter für die Vergangenheit', min: '10rem', items: [
      { t: 'gestern', k: 'ac' }, { t: 'vorgestern', k: 'ac' }, { t: 'letzte Woche', k: 'ac' }, { t: 'letztes Jahr', k: 'ac' }, { t: 'vor zwei Tagen', k: 'ac' }, { t: 'früher', k: 'ac' }, { t: 'als Kind', k: 'ac' } ] },
    { type: 'merk', text: 'sein und haben in der Vergangenheit: fast immer {e:war} und {e:hatte}.' }
  ],

  examples: [
    'Gestern {e:war} ich im Kino.',
    'Wo {e:warst} du am Wochenende?',
    'Wir {e:hatten} leider keine Zeit.',
    'Als Kind {e:hatte} ich einen Hund.',
    'Das Wetter {e:war} wunderbar.',
    '{e:Wart} ihr schon einmal in Berlin?',
    'Früher {e:gab} es hier einen Markt.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'war oder hatte?', instr: 'Wähle die richtige Form.',
      items: [
        'Gestern ((war|hatte|bin)) ich sehr müde.', 'Du ((warst|wart|war)) nicht da.', 'Wir ((hatten|waren|hattet)) viel Spaß.', 'Er ((hatte|war|hattest)) Kopfschmerzen.',
        '((Wart|Waren|Warst)) ihr im Urlaub?', 'Die Kinder ((waren|war|hatten)) im Garten.', 'Früher ((gab|gibt|gaben)) es hier keine Straße.', '((Hattest|Hattet|Hatte)) du Glück?' ] },
    { id: 'u2', type: 'fill', title: 'Die richtige Form', instr: 'Schreib sein oder haben im Präteritum.',
      items: [
        '(sein) Wo [[warst]] du gestern?', '(haben) Ich [[hatte]] Hunger.', '(sein) Das Konzert [[war]] super.',
        '(haben) Wir [[hatten]] einen Hund.', '(sein) [[Wart]] ihr schon in Paris?', '(haben) [[Hattest]] du Zeit?' ] },
    { id: 'u3', type: 'type', title: 'Gestern …', instr: 'Schreib den Satz im Präteritum.',
      items: [
        { q: 'Ich bin krank.', pre: 'Gestern', end: '.', ok: ['war ich krank'] },
        { q: 'Wir haben keine Zeit.', pre: 'Gestern', end: '.', ok: ['hatten wir keine Zeit'] },
        { q: 'Er ist in Köln.', pre: 'Letzte Woche', end: '.', ok: ['war er in Köln'] },
        { q: 'Du hast Glück.', pre: 'Gestern', end: '.', ok: ['hattest du Glück'] },
        { q: 'Sie sind müde.', pre: 'Gestern Abend', end: '.', ok: ['waren sie müde'] },
        { q: 'Es gibt ein Problem.', pre: 'Gestern', end: '.', ok: ['gab es ein Problem'] } ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'Tippe die Teile in der richtigen Reihenfolge an.',
      items: [
        { tiles: ['Gestern', 'war', 'ich', 'im Kino'], end: '.', ok: ['Gestern war ich im Kino'] },
        { tiles: ['Wo', 'warst', 'du'], end: '?', ok: ['Wo warst du'] },
        { tiles: ['Als Kind', 'hatte', 'ich', 'eine Katze'], end: '.', ok: ['Als Kind hatte ich eine Katze'] },
        { tiles: ['Letzte Woche', 'hatten', 'wir', 'Urlaub'], end: '.', ok: ['Letzte Woche hatten wir Urlaub'] },
        { tiles: ['Früher', 'gab', 'es', 'hier', 'ein Kino'], end: '.', ok: ['Früher gab es hier ein Kino'] } ] }
  ],

  speak: { title: 'Wie war es?', intro: 'Erzähl in der Vergangenheit.', altLabel: 'Antwort',
    items: [
      { cue: [['e', 'calendar', 'gestern'], ['n', 'user-round', 'ich'], ['x', 'thermometer', 'krank']], say: 'Gestern {e:war} ich krank.' },
      { cue: [['n', 'user-round', 'du'], ['x', 'circle-help', 'wo · gestern?']], say: 'Wo {e:warst} du gestern?', alt: 'Ich {e:war} zu Hause.' },
      { cue: [['n', 'users', 'wir'], ['x', 'clock', 'keine Zeit']], say: 'Wir {e:hatten} keine Zeit.' },
      { cue: [['e', 'baby', 'als Kind'], ['n', 'user-round', 'ich'], ['x', 'dog', 'ein Hund']], say: 'Als Kind {e:hatte} ich einen Hund.' },
      { cue: [['n', 'sun', 'das Wetter'], ['x', 'smile', 'schön']], say: 'Das Wetter {e:war} schön.' },
      { cue: [['n', 'users', 'ihr'], ['x', 'plane', 'Urlaub?']], say: '{e:Hattet} ihr Urlaub?', alt: 'Ja, wir {e:waren} in Mombasa.' } ] }
});
