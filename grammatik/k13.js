/* Kapitel 13 – Zwei Verben im Satz (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 13, level: 'A2', group: 'Sätze und Fragen',
  title: 'Zwei Verben im Satz',
  kicker: 'Ich gehe einkaufen.',
  intro: 'Nach <b>gehen, fahren, kommen, lernen</b> und <b>bleiben</b> kann ein zweites Verb im <b>Infinitiv</b> stehen – ohne „zu“. Wie bei den Modalverben steht das erste Verb auf Position 2 und der Infinitiv am Ende.',
  hero: 'Am Samstag {v:gehen} wir {t:schwimmen}.',
  art: K => K.svg(K.sky() + K.shadow(150) +
    K.person({ x: 150, shirt: 'var(--akk)', skin: 1, hair: 'short', armL: 'down', armR: 'wave', face: 'open',
      under: '<path d="M-27 -128L-6 -134L-2 -66L-20 -62Z" fill="var(--die)"/><path d="M-24 -112l18-3M-22 -96l17-2" stroke="var(--card)" stroke-width="3" opacity=".7"/>' }) +
    K.person({ x: 404, y: 384, s: .8, shirt: 'var(--nom)', skin: 4, hair: 'long', hc: 'var(--hair4)', armL: 'up', armR: 'wave', face: 'open' }) +
    `<path d="M236 360Q244 262 320 260H520V360Z" style="fill:color-mix(in srgb,var(--der) 55%,var(--sky2))"/><g fill="none" stroke="var(--card)" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M300 290q12-8 24 0t24 0"/><path d="M430 312q12-8 24 0t24 0"/><path d="M330 330q12-8 24 0t24 0"/><path d="M366 268q10-6 20 0t20 0"/><path d="M422 268q10-6 20 0t20 0"/></g>` +
    K.bubble(150, 92, 'Ich *gehe* *schwimmen*!', { tail: 'c' }) + K.bubble(396, 120, 'Komm, das Wasser ist super!', { tail: 'c' }),
    'Am See: Ein Mann mit Handtuch sagt: Ich gehe schwimmen! Eine Frau im Wasser ruft: Komm, das Wasser ist super!'),
  lemmas: { gehe: 'gehen', gehen: 'gehen', schwimmen: 'schwimmen', lernt: 'lernen', bleiben: 'bleiben', Kommst: 'kommen' },

  understand: [
    { type: 'slots', title: 'Verb 1 + Infinitiv', rows: [
      [['Ich', 'n', 'Position 1'], ['gehe', 'v', 'Position 2'], ['heute', 'x', ''], ['schwimmen', 'vt', 'Ende']],
      [['Kommst', 'v', 'Position 1'], ['du', 'n', ''], ['mit uns', 'x', ''], ['essen', 'vt', 'Ende']],
      [['Meine Tochter', 'n', 'Position 1'], ['lernt', 'v', 'Position 2'], ['Fahrrad', 'x', ''], ['fahren', 'vt', 'Ende']] ],
      note: 'Das konjugierte Verb steht auf <b>Position 2</b> (in Ja/Nein-Fragen auf Position 1), der Infinitiv am <b>Ende</b> – wie bei können oder müssen.' },
    { type: 'cards', title: 'Diese Verben verbinden sich oft', min: '13rem', items: [
      { t: 'gehen', k: 'n', icon: 'footprints', ex: 'Wir {v:gehen} heute {t:tanzen}.', ws: ['einkaufen', 'schwimmen', 'essen', 'tanzen', 'spazieren'] },
      { t: 'fahren', k: 'ac', icon: 'car', ex: 'Sie {v:fährt} morgen {t:einkaufen}.' },
      { t: 'kommen', k: 'd', icon: 'door-open', ex: '{v:Kommst} du {t:essen}? Es ist fertig!' },
      { t: 'lernen', k: 'a', icon: 'graduation-cap', ex: 'Mein Sohn {v:lernt} {t:schwimmen}.' },
      { t: 'bleiben', k: 'w', icon: 'armchair', ex: 'Bitte {v:bleiben} Sie {t:sitzen}.' } ] },
    { type: 'note', title: 'Kein „zu“!', text: 'Nach gehen, fahren, kommen, lernen und bleiben steht der Infinitiv ohne „zu“: Ich gehe {t:schwimmen}. (Nicht: Ich gehe zu schwimmen.)' },
    { type: 'grid', title: 'Drei Verben? Kein Problem', head: ['', 'Satz'], rows: [
      ['ohne Modalverb', 'Ich {v:gehe} heute Abend {t:essen}.'],
      ['mit Modalverb', 'Ich {v:möchte} heute Abend {t:essen gehen}.'],
      ['mit Modalverb', 'Wir {v:wollen} am Sonntag {t:spazieren gehen}.'] ],
      foot: 'Mit Modalverb stehen beide Infinitive am Ende. Das Verb, das zum Modalverb gehört (gehen), steht ganz am Schluss.' },
    { type: 'merk', text: 'Verb 1 auf Position 2 – {t:Verb 2} im Infinitiv ans Ende.' }
  ],

  examples: [
    'Ich {v:gehe} jeden Samstag {t:einkaufen}.',
    '{v:Kommst} du mit uns {t:essen}?',
    'Mein Bruder {v:lernt} gerade Auto {t:fahren}.',
    'Wir {v:gehen} heute Abend {t:tanzen}.',
    'Am Sonntag {v:gehen} wir im Park {t:spazieren}.',
    'Bleib bitte noch kurz {t:sitzen}!',
    'Ich {v:möchte} heute Abend {t:essen gehen}.'
  ],

  exercises: [
    { id: 'u1', type: 'order', title: 'Sätze bauen', instr: 'Erstes Verb auf Position 2, Infinitiv ans Ende.',
      items: [
        { tiles: ['Ich', 'gehe', 'heute', 'einkaufen'], end: '.', ok: ['Ich gehe heute einkaufen'] },
        { tiles: ['Kommst', 'du', 'mit', 'essen'], end: '?', ok: ['Kommst du mit essen'] },
        { tiles: ['Wir', 'gehen', 'am Abend', 'tanzen'], end: '.', ok: ['Wir gehen am Abend tanzen'] },
        { tiles: ['Mein Sohn', 'lernt', 'schwimmen'], end: '.', ok: ['Mein Sohn lernt schwimmen'] },
        { tiles: ['Am Sonntag', 'gehen', 'wir', 'spazieren'], end: '.', ok: ['Am Sonntag gehen wir spazieren'] },
        { tiles: ['Ich', 'möchte', 'heute', 'essen gehen'], end: '.', ok: ['Ich möchte heute essen gehen'] } ] },
    { id: 'u2', type: 'choice', title: 'Was ist richtig?', instr: 'Mit oder ohne „zu“? Welche Reihenfolge?',
      items: [
        'Ich gehe heute ((schwimmen|zu schwimmen)).', 'Kommst du ((essen|zu essen))?', 'Mein Sohn lernt ((lesen|zu lesen)).',
        'Wir möchten ((tanzen gehen|gehen tanzen)).', 'Bitte bleiben Sie ((sitzen|zu sitzen)).', 'Ich will heute ((spazieren gehen|gehen spazieren)).' ] },
    { id: 'u3', type: 'type', title: 'Zwei Sätze – ein Satz', instr: 'Mach aus zwei Sätzen einen Satz.',
      items: [
        { q: 'Ich gehe. Ich kaufe ein. (heute)', pre: 'Ich gehe', end: '.', ok: ['heute einkaufen'] },
        { q: 'Wir gehen. Wir essen. (am Abend)', pre: 'Wir gehen', end: '.', ok: ['am Abend essen'] },
        { q: 'Er lernt. Er fährt Auto.', pre: 'Er lernt', end: '.', ok: ['Auto fahren'] },
        { q: 'Kommst du? Du isst mit uns.', pre: 'Kommst du', end: '?', ok: ['mit uns essen'] },
        { q: 'Sie geht. Sie tanzt. (jeden Freitag)', pre: 'Sie geht', end: '.', ok: ['jeden Freitag tanzen'] },
        { q: '(möchten · heute · essen gehen)', pre: 'Ich', end: '.', ok: ['möchte heute essen gehen'] } ] },
    { id: 'u4', type: 'free', title: 'Dein Wochenende', graded: false,
      instr: 'Schreib über dein Wochenende. Die automatische Prüfung findet viele Fehler, aber nicht alle – diese Übung zählt deshalb nicht für die Note.',
      verbs: ['geh', 'fahr', 'fähr', 'komm', 'lern', 'bleib'], needMsg: 'Benutze gehen, fahren, kommen, lernen oder bleiben + Infinitiv.',
      checks: [
        t => /\b(gehe|gehst|geht|gehen|fahre|fährst|fährt|fahren|komme|kommst|kommt|kommen|lerne|lernst|lernt|lernen|bleibe|bleibst|bleibt|bleiben)\b[^.!?]*\bzu\s+\w+en\b/i.test(t) && ['e', 'Nach gehen, fahren, kommen, lernen und bleiben steht der Infinitiv ohne „zu“.'] ],
      items: [
        { q: 'Was machst du am Samstag?', ph: 'Am Samstag gehe ich …' },
        { q: 'Was lernst du gerade – außer Deutsch?', ph: 'Ich lerne gerade …' },
        { q: 'Wohin gehst du gern essen?', ph: 'Ich gehe gern …' } ] }
  ],

  speak: { title: 'Was machst du?', intro: 'Bilde einen Satz mit zwei Verben.', altLabel: 'Weiter',
    items: [
      { cue: [['n', 'user-round', 'ich'], ['v', '', 'gehen'], ['x', 'shopping-cart', 'einkaufen']], say: 'Ich {v:gehe} {t:einkaufen}.' },
      { cue: [['n', 'user-round', 'du'], ['v', '', 'kommen'], ['x', 'utensils', 'essen?']], say: '{v:Kommst} du {t:essen}?', alt: 'Ja, ich komme sofort!' },
      { cue: [['e', 'calendar', 'am Samstag'], ['n', 'users', 'wir'], ['v', '', 'gehen'], ['x', 'music', 'tanzen']], say: 'Am Samstag {v:gehen} wir {t:tanzen}.' },
      { cue: [['n', 'baby', 'das Kind'], ['v', '', 'lernen'], ['x', 'waves', 'schwimmen']], say: 'Das Kind {v:lernt} {t:schwimmen}.' },
      { cue: [['n', 'user-round', 'ich'], ['v', '', 'möchten'], ['x', 'trees', 'spazieren gehen']], say: 'Ich {v:möchte} {t:spazieren gehen}.' },
      { cue: [['n', 'users', 'ihr'], ['v', '', 'fahren'], ['x', 'shopping-bag', 'einkaufen?']], say: '{v:Fahrt} ihr {t:einkaufen}?', alt: 'Ja, wir fahren in die Stadt.' } ] }
});
