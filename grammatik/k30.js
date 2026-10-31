/* Kapitel 30 – Perfekt oder Präteritum? (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 30, level: 'A2', group: 'Verben 2',
  title: 'Perfekt oder Präteritum?',
  kicker: 'Erzählen über gestern',
  intro: 'Beim <b>Sprechen</b> erzählt man meistens im <b>Perfekt</b>. Nur <b>sein, haben</b>, die <b>Modalverben</b> und <b>es gibt</b> stehen fast immer im <b>Präteritum</b>. In Zeitungen, Büchern und Märchen liest man viel Präteritum.',
  hero: 'Am Samstag {e:war} es warm und wir {v:sind} an den See {t:gefahren}.',
  art: K => K.svg(K.room() + K.table(262, 236, 150) + K.cup(232, 236) + K.cup(292, 236) + K.shadow(150) + K.shadow(380) +
    K.person({ x: 150, shirt: 'var(--akk)', skin: 4, hair: 'short', hc: 'var(--hair3)', armR: 'front', face: 'open' }) +
    K.person({ x: 380, shirt: 'var(--die)', skin: 1, hair: 'curly', armL: 'wave', face: 'open' }) +
    K.bubble(150, 84, 'Was *hast* du *gemacht*?', { tail: 'c' }) + K.bubble(372, 106, 'Ich *war* am See!', { tail: 'c' }) + K.bubble(352, 148, 'Wir *sind* *geschwommen*.', { tail: 'r' }),
    'Zwei Freunde im Café erzählen vom Wochenende: Was hast du gemacht? – Ich war am See! Wir sind geschwommen.'),
  lemmas: { war: 'sein', hatten: 'haben', gab: 'geben', mussten: 'müssen', konnte: 'können', gefahren: 'fahren', gegessen: 'essen', geschwommen: 'schwimmen' },

  understand: [
    { type: 'cards', title: 'Was benutze ich wann?', min: '14rem', items: [
      { t: 'Perfekt', k: 'ac', icon: 'message-circle', s: 'beim Sprechen · die meisten Verben', ex: 'Ich {v:habe} {t:gekocht}. Wir {v:sind} {t:gefahren}.' },
      { t: 'Präteritum', k: 'n', icon: 'clock', s: 'sein · haben · Modalverben · es gibt', ex: 'Ich {e:war} müde. Ich {e:hatte} Zeit. Ich {e:musste} gehen. Es {e:gab} Kuchen.' },
      { t: 'Präteritum in Texten', k: 'd', icon: 'newspaper', s: 'Zeitung · Bücher · Märchen', ex: 'Es {e:war} einmal ein König. Er {e:lebte} in einem Schloss. (Kapitel 54)' } ] },
    { type: 'grid', title: 'Eine Geschichte erzählen', head: ['Zeitform', 'Satz'], rows: [
      ['Präteritum', 'Am Samstag {e:war} das Wetter schön.'], ['Perfekt', 'Wir {v:sind} an den See {t:gefahren}.'], ['Präteritum', 'Dort {e:gab} es ein kleines Café.'],
      ['Perfekt', 'Wir {v:haben} ein Eis {t:gegessen}.'], ['Präteritum', 'Am Abend {e:mussten} wir früh nach Hause.'] ],
      foot: 'Beides mischt sich ganz natürlich – je nach Verb.' },
    { type: 'merk', text: 'Sprechen: Perfekt – außer {e:war, hatte, konnte, musste, wollte, gab}.' },
    { type: 'note', title: 'Klingt komisch', text: '„Ich bin gewesen“ und „ich habe gehabt“ sind richtig, aber man sagt meistens einfach: Ich {e:war} … Ich {e:hatte} …' }
  ],

  examples: [
    'Gestern {e:war} ich beim Arzt.',
    'Ich {v:habe} eine Stunde {t:gewartet}.',
    'Wir {e:hatten} Glück: Es {e:gab} noch Karten.',
    'Danach {v:sind} wir essen {t:gegangen}.',
    'Ich {e:konnte} nicht schlafen, also {v:habe} ich {t:gelesen}.',
    'Was {v:hast} du im Urlaub {t:gemacht}?',
    'Wo {e:warst} du so lange?'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Was sagt man meistens?', instr: 'Beide Formen sind richtig. Wähle die Form, die man beim Sprechen meistens benutzt.',
      items: [
        '((Ich war|Ich bin gewesen)) gestern im Kino.', '((Ich habe Pizza gegessen.|Ich aß Pizza.))', '((Wir hatten|Wir haben gehabt)) keine Zeit.',
        '((Er musste|Er hat gemusst)) arbeiten.', '((Sie hat Musik gehört.|Sie hörte Musik.))', '((Es gab|Es hat gegeben)) keinen Platz mehr.', '((Wir sind nach Köln gefahren.|Wir fuhren nach Köln.))' ] },
    { id: 'u2', type: 'fill', title: 'Ein Tag am See', instr: 'Ergänze das Verb in der passenden Form.',
      items: [
        '(sein) Am Samstag [[war]] das Wetter schön.', '(fahren) Wir sind an den See [[gefahren]].', '(geben) Dort [[gab]] es ein kleines Café.',
        '(essen) Wir haben ein Eis [[gegessen]].', '(müssen) Am Abend [[mussten]] wir früh nach Hause.', '(haben) Wir [[hatten]] einen tollen Tag!' ] },
    { id: 'u3', type: 'type', title: 'Gestern …', instr: 'Erzähl in der Vergangenheit – so, wie man spricht.',
      items: [
        { q: 'Ich bin müde.', pre: 'Gestern', end: '.', ok: ['war ich müde'] },
        { q: 'Ich koche Suppe.', pre: 'Gestern', end: '.', ok: ['habe ich Suppe gekocht'] },
        { q: 'Wir können nicht kommen.', pre: 'Gestern', end: '.', ok: ['konnten wir nicht kommen'] },
        { q: 'Er fährt nach Berlin.', pre: 'Gestern', end: '.', ok: ['ist er nach Berlin gefahren'] },
        { q: 'Es gibt Kuchen.', pre: 'Gestern', end: '.', ok: ['gab es Kuchen'] },
        { q: 'Ich habe Kopfschmerzen.', pre: 'Gestern', end: '.', ok: ['hatte ich Kopfschmerzen'] } ] },
    { id: 'u4', type: 'free', title: 'Dein Wochenende', graded: false,
      instr: 'Erzähl von deinem letzten Wochenende. Die automatische Prüfung findet viele Fehler, aber nicht alle – diese Übung zählt deshalb nicht für die Note.',
      verbs: ['war', 'hatte', 'habe', 'hab', 'bin', 'sind', 'haben', 'musste', 'konnte', 'wollte', 'gab'], needMsg: 'Erzähl in der Vergangenheit: war, hatte, habe … gemacht, bin … gefahren.',
      checks: [
        t => /\bbin\s+[^.!?]*gewesen\b/i.test(t) && ['h', 'Richtig, aber beim Sprechen sagt man meistens einfach „ich war …“.'],
        t => /\bhabe\s+[^.!?]*gehabt\b/i.test(t) && ['h', 'Richtig, aber beim Sprechen sagt man meistens einfach „ich hatte …“.'],
        t => /\b(habe|hast|hat|haben|habt)\b[^.!?]*\b(gefahren|gegangen|gekommen|geflogen|geblieben|aufgestanden|gelaufen)\b/i.test(t) && ['e', 'Bewegung von A nach B? Dann Perfekt mit sein: ich bin gefahren, wir sind gegangen.'] ],
      items: [
        { q: 'Wie war dein Samstag?', ph: 'Am Samstag war ich …' },
        { q: 'Was hast du am Sonntag gemacht?', ph: 'Am Sonntag habe ich …' },
        { q: 'Was konntest du nicht machen – und warum?', ph: 'Ich konnte leider nicht …' } ] }
  ],

  speak: { title: 'Erzähl!', intro: 'Bilde den Satz – Perfekt oder Präteritum?', altLabel: 'Weiter',
    items: [
      { cue: [['e', 'calendar', 'Samstag'], ['x', 'sun', 'das Wetter · schön sein']], say: 'Am Samstag {e:war} das Wetter schön.' },
      { cue: [['n', 'users', 'wir'], ['x', 'waves', 'an den See fahren']], say: 'Wir {v:sind} an den See {t:gefahren}.' },
      { cue: [['x', 'coffee', 'es gibt · ein Café']], say: 'Dort {e:gab} es ein Café.' },
      { cue: [['n', 'users', 'wir'], ['x', 'ice-cream-cone', 'ein Eis essen']], say: 'Wir {v:haben} ein Eis {t:gegessen}.' },
      { cue: [['n', 'users', 'wir'], ['x', 'house', 'früh nach Hause müssen']], say: 'Am Abend {e:mussten} wir früh nach Hause.' },
      { cue: [['n', 'user-round', 'du'], ['x', 'circle-help', 'was · am Wochenende machen?']], say: 'Was {v:hast} du am Wochenende {t:gemacht}?', alt: 'Ich {e:war} bei meiner Familie.' } ] }
});
