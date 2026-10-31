/* Kapitel 50 – Modalpartikeln (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 50, level: 'A2', group: 'Wörter und Wortbildung',
  title: 'Modalpartikeln',
  kicker: 'denn, doch, mal, ja',
  intro: 'Kleine Wörter wie <b>denn, doch, mal, ja</b> ändern nicht die Information – aber den <b>Ton</b>. Sie machen Sätze freundlicher, natürlicher oder zeigen Gefühle. Man hört sie ständig, vor allem beim Sprechen.',
  hero: 'Komm {e:doch} {e:mal} vorbei!',
  art: K => K.svg(K.room() + K.shadow(160) + K.shadow(380) +
    K.person({ x: 160, shirt: 'var(--akk)', skin: 3, hair: 'bun', hc: 'var(--hair2)', armR: 'chest', face: 'open', extra: '<rect x="12" y="-176" width="12" height="22" rx="3" fill="var(--ink)"/>' }) +
    K.person({ x: 380, shirt: 'var(--nom)', skin: 1, hair: 'short', armL: 'chest', face: 'smile', extra: '<rect x="-24" y="-176" width="12" height="22" rx="3" fill="var(--ink)"/>' }) +
    `<path d="M200 140q60 -40 140 0" stroke="var(--faint)" stroke-width="2" stroke-dasharray="4 6" fill="none"/>` +
    K.bubble(150, 84, 'Komm *doch* *mal* vorbei!', { tail: 'c' }) + K.bubble(380, 106, 'Gern! Wann *denn*?', { tail: 'c' }),
    'Zwei Freunde telefonieren: Komm doch mal vorbei! – Gern! Wann denn?'),
  lemmas: { doch: 'doch', mal: 'mal', denn: 'denn', ja: 'ja', eigentlich: 'eigentlich' },

  understand: [
    { type: 'cards', title: 'Die wichtigsten Partikeln', min: '13rem', items: [
      { t: 'denn', k: 'ac', s: 'in Fragen: Interesse, freundlich', ex: 'Wie heißt du {e:denn}? Was ist {e:denn} los?' },
      { t: 'mal', k: 'n', s: 'Bitte: locker, nicht so streng', ex: 'Komm {e:mal} her! Kannst du {e:mal} helfen?' },
      { t: 'doch', k: 'd', s: 'Vorschlag oder Ermutigung', ex: 'Setz dich {e:doch}! Probier {e:doch} mal!' },
      { t: 'ja', k: 'ok', s: 'Überraschung oder Bekanntes', ex: 'Das ist {e:ja} toll! Du weißt {e:ja}, ich habe keine Zeit.' },
      { t: 'eigentlich', k: 'w', s: 'übrigens, im Grunde', ex: 'Wie alt bist du {e:eigentlich}?' },
      { t: 'aber', k: 'b', s: 'Staunen (nicht Gegensatz!)', ex: 'Das ist {e:aber} schön!' } ] },
    { type: 'grid', title: 'Mit und ohne Partikel', head: ['ohne', 'mit Partikel', 'Wirkung'], rows: [
      ['Komm her!', 'Komm {e:mal} her!', 'freundlicher'], ['Wie heißt du?', 'Wie heißt du {e:denn}?', 'interessierter'],
      ['Setz dich!', 'Setz dich {e:doch}!', 'einladend'], ['Das ist schön!', 'Das ist {e:ja} schön!', 'überrascht'] ], label: false },
    { type: 'merk', text: 'Bitte freundlich: {e:doch mal}. Frage interessiert: {e:denn}.' },
    { type: 'note', title: 'Wo stehen sie?', text: 'Partikeln stehen in der Satzmitte, meist nach dem Verb und den Pronomen – nie auf Position 1: Kannst du mir {e:mal} helfen?' }
  ],

  examples: [
    'Was machst du {e:denn} hier?',
    'Hör {e:mal}, ich habe eine Idee!',
    'Nimm {e:doch} noch ein Stück Kuchen!',
    'Du bist {e:ja} schon da!',
    'Woher kommst du {e:eigentlich}?',
    'Das Kleid ist {e:aber} schön!'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welche Partikel passt?', instr: 'Wähle die passende Partikel.',
      items: [
        'Wie spät ist es ((denn|mal|doch))?', 'Kannst du mir ((mal|denn|ja)) das Salz geben?', 'Komm ((doch|denn|ja)) mit ins Kino!',
        'Oh, du bist ((ja|denn|mal)) schon da!', 'Was ist ((denn|mal|doch)) passiert?', 'Setzen Sie sich ((doch|denn|ja))!' ] },
    { id: 'u2', type: 'fill', title: 'Mach es freundlicher', instr: 'Ergänze mal, doch oder denn.',
      items: [
        'Wo wohnst du [[denn]]?', 'Warte [[mal]], ich komme mit!', 'Probier [[doch]] den Kuchen!',
        'Was möchtest du [[denn]] trinken?', 'Ruf mich [[mal]] an!', 'Bleib [[doch]] noch ein bisschen!' ] },
    { id: 'u3', type: 'choice', title: 'Was bedeutet das?', instr: 'Wie klingt der Satz?',
      items: [
        '„Das ist ja toll!“ – Der Sprecher ist ((überrascht und froh|wütend|traurig)).', '„Komm doch mal vorbei!“ ist ((eine freundliche Einladung|ein Befehl|eine Frage)).',
        '„Was ist denn los?“ – Der Sprecher ist ((interessiert, vielleicht besorgt|unhöflich|froh)).', '„Das Kleid ist aber schön!“ – aber bedeutet hier ((Staunen|Gegensatz|Grund)).' ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'Die Partikel steht in der Satzmitte.',
      items: [
        { tiles: ['Kannst', 'du', 'mir', 'mal', 'helfen'], end: '?', ok: ['Kannst du mir mal helfen'] },
        { tiles: ['Wie', 'heißt', 'du', 'denn'], end: '?', ok: ['Wie heißt du denn'] },
        { tiles: ['Komm', 'doch', 'mit'], end: '!', ok: ['Komm doch mit'] },
        { tiles: ['Das', 'ist', 'ja', 'super'], end: '!', ok: ['Das ist ja super'] } ] }
  ],

  speak: { title: 'Klingt natürlich!', intro: 'Sag den Satz mit Partikel – hör auf die Melodie.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'door-open', 'Einladung: vorbeikommen']], say: 'Komm {e:doch} {e:mal} vorbei!' },
      { cue: [['x', 'circle-help', 'Frage: Was ist los?']], say: 'Was ist {e:denn} los?' },
      { cue: [['x', 'hand-helping', 'Bitte: helfen']], say: 'Kannst du mir {e:mal} helfen?' },
      { cue: [['x', 'sparkles', 'Staunen: schön']], say: 'Das ist {e:ja} schön!' },
      { cue: [['x', 'armchair', 'Einladung: sich setzen (Sie)']], say: 'Setzen Sie sich {e:doch}!' } ] }
});
