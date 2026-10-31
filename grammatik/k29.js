/* Kapitel 29 – Präteritum der Modalverben (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 29, level: 'A2', group: 'Verben 2',
  title: 'Präteritum der Modalverben',
  kicker: 'Ich konnte, ich musste',
  intro: 'Modalverben benutzt man in der Vergangenheit fast immer im <b>Präteritum</b>: Stamm ohne Umlaut + <b>-te-</b>. können → ich k<b>o</b>nn<b>te</b>, müssen → ich m<b>u</b>ss<b>te</b>.',
  hero: 'Gestern {v:musste} ich lange {t:arbeiten}.',
  art: K => K.svg(`<rect width="520" height="360" fill="var(--wall)"/><rect y="296" width="520" height="64" fill="var(--floor)"/><rect y="292" width="520" height="6" fill="var(--wood)" opacity=".55"/>
<rect x="370" y="52" width="114" height="120" rx="8" fill="var(--der)" stroke="var(--wood)" stroke-width="6"/><circle cx="446" cy="88" r="16" fill="var(--sun)"/><circle cx="454" cy="82" r="14" fill="var(--der)"/><g fill="var(--card)"><circle cx="398" cy="78" r="2"/><circle cx="420" cy="140" r="1.6"/><circle cx="470" cy="134" r="2"/></g><path d="M427 52V172M370 112H484" stroke="var(--wood)" stroke-width="4"/>
<circle cx="70" cy="200" r="30" fill="var(--card)" stroke="var(--ink)" stroke-width="4"/><path d="M70 200V180M70 200l16 9" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/>` +
    K.shadow(240) + K.person({ x: 240, shirt: 'var(--der)', skin: 1, hair: 'short', glasses: true, armL: 'front', armR: 'hold', face: 'flat' }) +
    K.table(250, 236, 200) + `<rect x="232" y="196" width="68" height="40" rx="4" fill="var(--ink)"/><rect x="237" y="201" width="58" height="30" fill="var(--der)" opacity=".55"/><rect x="224" y="232" width="84" height="5" rx="2" fill="var(--metal)"/>` + K.cup(320, 236) +
    K.bubble(250, 92, 'Ich *musste* lange arbeiten …', { tail: 'c' }),
    'Spät am Abend: Ein müder Mann am Schreibtisch mit Laptop. Draußen ist es dunkel. Ich musste lange arbeiten.'),
  lemmas: { musste: 'müssen', konnte: 'können', durften: 'dürfen', wollte: 'wollen', Konntest: 'können', solltet: 'sollen' },

  understand: [
    { type: 'grid', title: 'Die Formen im Präteritum', head: ['', 'können', 'müssen', 'dürfen', 'wollen', 'sollen'], rows: [
      ['ich', '{e:konnte}', '{e:musste}', '{e:durfte}', '{e:wollte}', '{e:sollte}'], ['du', 'konntest', 'musstest', 'durftest', 'wolltest', 'solltest'],
      ['er · sie · es', '{e:konnte}', '{e:musste}', '{e:durfte}', '{e:wollte}', '{e:sollte}'], ['wir', 'konnten', 'mussten', 'durften', 'wollten', 'sollten'],
      ['ihr', 'konntet', 'musstet', 'durftet', 'wolltet', 'solltet'], ['sie · Sie', 'konnten', 'mussten', 'durften', 'wollten', 'sollten'] ], hl: [0, 2],
      foot: 'Kein Umlaut: k<b>ö</b>nnen → k<b>o</b>nnte, m<b>ü</b>ssen → m<b>u</b>sste, d<b>ü</b>rfen → d<b>u</b>rfte. ich und er/sie/es sind gleich.' },
    { type: 'slots', title: 'Der Satzbau bleibt gleich', rows: [
      [['Gestern', 'q', 'Position 1'], ['musste', 'v', 'Position 2'], ['ich', 'n', ''], ['lange', 'x', ''], ['arbeiten', 'vt', 'Ende']] ],
      note: 'Das Modalverb im Präteritum steht auf Position 2, der Infinitiv am Ende – wie im Präsens.' },
    { type: 'note', title: 'Und möchten?', text: 'möchten hat kein Präteritum. Man nimmt {v:wollte}: Ich möchte einen Tee. → Ich {v:wollte} einen Tee.' },
    { type: 'merk', text: 'Modalverben in der Vergangenheit: Präteritum – ich {v:konnte}, ich {v:musste}, ich {v:wollte}.' }
  ],

  examples: [
    'Als Kind {v:konnte} ich nicht {t:schwimmen}.',
    'Gestern {v:musste} ich zum Arzt.',
    'Früher {v:durfte} man hier {t:rauchen}.',
    'Ich {v:wollte} dich {t:anrufen}, aber mein Handy war leer.',
    '{v:Konntest} du gut {t:schlafen}?',
    'Ihr {v:solltet} doch um acht {t:kommen}!',
    'Mit zehn {v:wollte} er Pilot {t:werden}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Die richtige Form', instr: 'Wähle die richtige Form.',
      items: [
        'Gestern ((konnte|kann|konnten)) ich nicht kommen.', 'Wir ((mussten|musstet|musste)) lange warten.', 'Als Kind ((durfte|durftet|darf)) ich nicht fernsehen.',
        '((Wolltest|Wollte|Wolltet)) du nicht mitkommen?', 'Ihr ((solltet|sollten|sollte)) pünktlich sein.', 'Die Kinder ((konnten|konnte|könnten)) schon lesen.' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze', instr: 'Schreib das Modalverb im Präteritum.',
      items: [
        '(können) Ich [[konnte]] nicht schlafen.', '(müssen) Er [[musste]] früh aufstehen.', '(wollen) Wir [[wollten]] ins Kino gehen.',
        '(dürfen) [[Durftest]] du lange aufbleiben?', '(sollen) Ich [[sollte]] dich anrufen.', '(möchten) Sie [[wollte]] einen Tee.' ] },
    { id: 'u3', type: 'type', title: 'Gestern …', instr: 'Schreib den Satz im Präteritum.',
      items: [
        { q: 'Ich muss arbeiten.', pre: 'Gestern', end: '.', ok: ['musste ich arbeiten'] },
        { q: 'Er kann nicht kommen.', pre: 'Gestern', end: '.', ok: ['konnte er nicht kommen'] },
        { q: 'Wir wollen ins Kino gehen.', pre: 'Gestern', end: '.', ok: ['wollten wir ins Kino gehen'] },
        { q: 'Du darfst nicht rauchen.', pre: 'Früher', end: '.', ok: ['durftest du nicht rauchen'] },
        { q: 'Ihr sollt um acht da sein.', pre: 'Gestern', end: '.', ok: ['solltet ihr um acht da sein'] },
        { q: 'Ich möchte schlafen.', pre: 'Gestern', end: '.', ok: ['wollte ich schlafen'] } ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'Tippe die Teile in der richtigen Reihenfolge an.',
      items: [
        { tiles: ['Gestern', 'musste', 'ich', 'lange', 'arbeiten'], end: '.', ok: ['Gestern musste ich lange arbeiten'] },
        { tiles: ['Als Kind', 'konnte', 'ich', 'nicht', 'schwimmen'], end: '.', ok: ['Als Kind konnte ich nicht schwimmen'] },
        { tiles: ['Wolltest', 'du', 'nicht', 'kommen'], end: '?', ok: ['Wolltest du nicht kommen'] },
        { tiles: ['Wir', 'durften', 'nicht', 'laut', 'sein'], end: '.', ok: ['Wir durften nicht laut sein'] },
        { tiles: ['Ich', 'sollte', 'dich', 'anrufen'], end: '.', ok: ['Ich sollte dich anrufen'] } ] }
  ],

  speak: { title: 'Früher und gestern', intro: 'Erzähl mit einem Modalverb im Präteritum.', altLabel: 'Weiter',
    items: [
      { cue: [['e', 'calendar', 'gestern'], ['n', 'user-round', 'ich'], ['v', '', 'müssen'], ['x', 'briefcase', 'lange arbeiten']], say: 'Gestern {v:musste} ich lange {t:arbeiten}.' },
      { cue: [['e', 'baby', 'als Kind'], ['n', 'user-round', 'ich'], ['v', '', 'können'], ['x', 'waves', 'nicht schwimmen']], say: 'Als Kind {v:konnte} ich nicht {t:schwimmen}.' },
      { cue: [['n', 'user-round', 'du'], ['v', '', 'können'], ['x', 'moon', 'gut schlafen?']], say: '{v:Konntest} du gut {t:schlafen}?', alt: 'Nein, ich {v:konnte} nicht {t:einschlafen}.' },
      { cue: [['e', 'history', 'früher'], ['n', 'user-round', 'man'], ['v', '', 'dürfen'], ['x', 'cigarette', 'im Zug rauchen']], say: 'Früher {v:durfte} man im Zug {t:rauchen}.' },
      { cue: [['n', 'user-round', 'ich'], ['v', '', 'wollen'], ['x', 'phone', 'dich anrufen']], say: 'Ich {v:wollte} dich {t:anrufen}.' },
      { cue: [['n', 'users', 'ihr'], ['v', '', 'sollen'], ['x', 'clock', 'um acht kommen']], say: 'Ihr {v:solltet} um acht {t:kommen}.' } ] }
});
