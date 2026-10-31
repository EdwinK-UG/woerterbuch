/* Kapitel 26 – Perfekt mit haben (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 26, level: 'A1', group: 'Verben 2',
  title: 'Perfekt mit haben',
  kicker: 'Ich habe Pizza gemacht.',
  intro: 'Beim Sprechen erzählt man über die Vergangenheit meistens im <b>Perfekt</b>: <b>haben</b> (oder sein) auf Position 2 und das <b>Partizip II</b> am Ende. Die meisten Verben bilden das Perfekt mit haben.',
  hero: 'Gestern {v:habe} ich Pizza {t:gemacht}.',
  art: K => K.svg(K.room() + K.table(270, 236, 150) +
    `<ellipse cx="266" cy="232" rx="44" ry="9" fill="var(--card)" stroke="var(--line)" stroke-width="1.5"/><ellipse cx="266" cy="228" rx="36" ry="7" fill="var(--nom)"/><g fill="var(--die)"><circle cx="252" cy="227" r="3.5"/><circle cx="270" cy="229" r="3.5"/><circle cx="284" cy="226" r="3.5"/></g><g fill="var(--das)"><circle cx="262" cy="225" r="2"/><circle cx="278" cy="230" r="2"/></g><path d="M256 212q4-8 0-14M272 212q4-8 0-14" stroke="var(--mut)" stroke-width="1.6" fill="none" opacity=".6"/>` +
    K.shadow(150) + K.shadow(400) +
    K.person({ x: 150, shirt: 'var(--akk)', apron: 'var(--card)', skin: 3, hair: 'curly', hc: 'var(--hair2)', armR: 'front', face: 'open' }) +
    K.person({ x: 400, shirt: 'var(--die)', skin: 1, hair: 'long', hc: 'var(--hair2)', armL: 'front', armR: 'chest' }) +
    K.bubble(150, 92, 'Ich *habe* Pizza *gemacht*!', { tail: 'c' }) + K.bubble(404, 120, 'Mmh, lecker!', { tail: 'c' }),
    'In der Küche: Ein Mann hat Pizza gemacht. Eine Frau sagt: Mmh, lecker!'),
  lemmas: { gemacht: 'machen', gearbeitet: 'arbeiten', gegessen: 'essen', gesehen: 'sehen', gelesen: 'lesen', gelernt: 'lernen', geschrieben: 'schreiben', getrunken: 'trinken', gekauft: 'kaufen' },

  understand: [
    { type: 'slots', title: 'Die Perfekt-Klammer', rows: [
      [['Ich', 'n', 'Position 1'], ['habe', 'v', 'Position 2 · haben'], ['gestern', 'x', ''], ['Pizza', 'x', ''], ['gemacht', 'vt', 'Ende · Partizip II']],
      [['Was', 'q', 'Position 1'], ['hast', 'v', 'Position 2'], ['du', 'n', ''], ['gekauft', 'vt', 'Ende']],
      [['Hast', 'v', 'Position 1'], ['du', 'n', ''], ['gut', 'x', ''], ['geschlafen', 'vt', 'Ende']] ],
      note: 'Wie bei den Modalverben: <b>haben</b> auf Position 2, das <b>Partizip II</b> am Ende.' },
    { type: 'grid', title: 'Regelmäßige Verben: ge- … -t', head: ['Infinitiv', 'Partizip II'], rows: [
      ['machen', '{e:ge}mach{e:t}'], ['kaufen', '{e:ge}kauf{e:t}'], ['spielen', '{e:ge}spiel{e:t}'], ['kochen', '{e:ge}koch{e:t}'], ['arbeiten', '{e:ge}arbeit{e:et}'] ],
      foot: 'Stamm auf -t oder -d: mit -et (gearbeitet, geredet).' },
    { type: 'grid', title: 'Unregelmäßige Verben: ge- … -en', head: ['Infinitiv', 'Partizip II'], rows: [
      ['essen', '{e:ge}gess{e:en}'], ['trinken', '{e:ge}trunk{e:en}'], ['sehen', '{e:ge}seh{e:en}'], ['lesen', '{e:ge}les{e:en}'], ['schreiben', '{e:ge}schrieb{e:en}'],
      ['sprechen', '{e:ge}sproch{e:en}'], ['nehmen', '{e:ge}nomm{e:en}'], ['finden', '{e:ge}fund{e:en}'], ['schlafen', '{e:ge}schlaf{e:en}'] ],
      foot: 'Oft ändert sich auch der Vokal. Lerne diese Formen mit dem Verb: trinken – getrunken.' },
    { type: 'merk', text: '{v:haben} auf Position 2 – {t:Partizip II} ans Ende.' },
    { type: 'note', title: 'Perfekt oder Präteritum?', text: 'Beim Sprechen nimmt man fast immer das Perfekt: Ich {v:habe} {t:gekocht}. Nur bei sein, haben und den Modalverben sagt man meistens war, hatte, konnte (Kapitel 25, 29, 30).' }
  ],

  examples: [
    'Ich {v:habe} gestern lange {t:gearbeitet}.',
    'Was {v:hast} du am Wochenende {t:gemacht}?',
    'Wir {v:haben} im Restaurant {t:gegessen}.',
    '{v:Hast} du den Film schon {t:gesehen}?',
    'Sie {v:hat} drei Bücher {t:gelesen}.',
    'Ihr {v:habt} heute viel {t:gelernt}.',
    'Er {v:hat} mir eine Nachricht {t:geschrieben}.'
  ],

  exercises: [
    { id: 'u1', type: 'fill', title: 'Das Partizip II', instr: 'Schreib das Partizip II.',
      items: [
        'machen → [[gemacht]]', 'kaufen → [[gekauft]]', 'arbeiten → [[gearbeitet]]', 'essen → [[gegessen]]',
        'trinken → [[getrunken]]', 'sehen → [[gesehen]]', 'schreiben → [[geschrieben]]', 'spielen → [[gespielt]]' ] },
    { id: 'u2', type: 'choice', title: 'Die Form von haben', instr: 'Wähle die richtige Form.',
      items: [
        'Ich ((habe|hat|hast)) Tee getrunken.', 'Du ((hast|habt|hat)) gut gekocht.', 'Er ((hat|habe|haben)) lange geschlafen.',
        'Wir ((haben|habt|hat)) Fußball gespielt.', 'Ihr ((habt|haben|hast)) viel gelernt.', 'Die Kinder ((haben|hat|habt)) ein Eis gegessen.' ] },
    { id: 'u3', type: 'type', title: 'Ins Perfekt', instr: 'Schreib den Satz im Perfekt.',
      items: [
        { q: 'Ich kaufe Brot.', pre: 'Ich', end: '.', ok: ['habe Brot gekauft'] },
        { q: 'Er spielt Gitarre.', pre: 'Er', end: '.', ok: ['hat Gitarre gespielt'] },
        { q: 'Wir essen Pizza.', pre: 'Wir', end: '.', ok: ['haben Pizza gegessen'] },
        { q: 'Liest du die Zeitung?', pre: '', end: '?', ok: ['Hast du die Zeitung gelesen'] },
        { q: 'Sie trinkt Kaffee.', pre: 'Sie', end: '.', ok: ['hat Kaffee getrunken'] },
        { q: 'Ihr lernt Deutsch.', pre: 'Ihr', end: '.', ok: ['habt Deutsch gelernt'] } ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'haben auf Position 2, Partizip ans Ende.',
      items: [
        { tiles: ['Ich', 'habe', 'gestern', 'Fußball', 'gespielt'], end: '.', ok: ['Ich habe gestern Fußball gespielt'] },
        { tiles: ['Was', 'hast', 'du', 'gekocht'], end: '?', ok: ['Was hast du gekocht'] },
        { tiles: ['Wir', 'haben', 'den Film', 'gesehen'], end: '.', ok: ['Wir haben den Film gesehen'] },
        { tiles: ['Hast', 'du', 'gut', 'geschlafen'], end: '?', ok: ['Hast du gut geschlafen'] },
        { tiles: ['Am Sonntag', 'hat', 'Lea', 'ein Buch', 'gelesen'], end: '.', ok: ['Am Sonntag hat Lea ein Buch gelesen'] } ] }
  ],

  speak: { title: 'Was hast du gemacht?', intro: 'Erzähl im Perfekt.', altLabel: 'Antwort',
    items: [
      { cue: [['n', 'user-round', 'ich'], ['x', 'pizza', 'Pizza machen']], say: 'Ich {v:habe} Pizza {t:gemacht}.' },
      { cue: [['n', 'user-round', 'du'], ['x', 'film', 'den Film sehen?']], say: '{v:Hast} du den Film {t:gesehen}?', alt: 'Ja, ich {v:habe} ihn gestern {t:gesehen}.' },
      { cue: [['n', 'users', 'wir'], ['x', 'bed', 'lange schlafen']], say: 'Wir {v:haben} lange {t:geschlafen}.' },
      { cue: [['n', 'user-round', 'er'], ['x', 'mail', 'einen Brief schreiben']], say: 'Er {v:hat} einen Brief {t:geschrieben}.' },
      { cue: [['n', 'user-round', 'sie'], ['x', 'coffee', 'Tee trinken']], say: 'Sie {v:hat} Tee {t:getrunken}.' },
      { cue: [['n', 'users', 'ihr'], ['x', 'book-open', 'Deutsch lernen']], say: 'Ihr {v:habt} Deutsch {t:gelernt}.' } ] }
});
