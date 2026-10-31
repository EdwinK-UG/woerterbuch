/* Kapitel 27 – Perfekt mit sein (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 27, level: 'A2', group: 'Verben 2',
  title: 'Perfekt mit sein',
  kicker: 'Ich bin nach Deutschland geflogen.',
  intro: 'Die meisten Verben bilden das Perfekt mit haben. Mit <b>sein</b> bilden es Verben, die eine <b>Bewegung von A nach B</b> oder eine <b>Veränderung</b> zeigen – und die Verben sein, bleiben und passieren.',
  hero: 'Letztes Jahr {v:bin} ich nach Deutschland {t:geflogen}.',
  art: K => K.svg(K.sky(false) +
    `<path d="M70 150q90 -20 170 -64" stroke="var(--card)" stroke-width="5" stroke-dasharray="14 10" fill="none" opacity=".9"/>
<g transform="translate(320 76) rotate(-14)"><path d="M-74 0q0-13 15-13h104q24 0 32 13q-8 13-32 13h-104q-15 0-15-13z" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
<path d="M-6 -9l-28 -42h17l42 42zM-6 9l-28 42h17l42-42z" fill="var(--der)"/><path d="M-64 -9l-13 -24h11l17 24z" fill="var(--der)"/>
<g fill="var(--sky2)">${[-40, -24, -8, 8, 24].map(x => `<circle cx="${x}" cy="-2" r="4"/>`).join('')}</g><path d="M48 -6h10" stroke="var(--sky2)" stroke-width="5" stroke-linecap="round"/></g>` +
    K.shadow(170) + K.person({ x: 170, shirt: 'var(--nom)', skin: 1, hair: 'curly', armL: 'wave', armR: 'down', face: 'open' }) +
    `<rect x="208" y="276" width="40" height="50" rx="6" fill="var(--akk)"/><path d="M218 276v-10h20v10" stroke="var(--ink)" fill="none" stroke-width="3"/><path d="M214 292h28" stroke="var(--card)" stroke-width="2" opacity=".6"/>` +
    K.bubble(196, 110, 'Ich *bin* nach Deutschland *geflogen*!', { tail: 'l' }),
    'Ein Flugzeug am Himmel. Ein Mann mit Koffer winkt: Ich bin nach Deutschland geflogen!'),
  lemmas: { geflogen: 'fliegen', aufgestanden: 'aufstehen', gekommen: 'kommen', gefahren: 'fahren', passiert: 'passieren', eingeschlafen: 'einschlafen', geblieben: 'bleiben', geworden: 'werden', bin: 'sein', bist: 'sein' },

  understand: [
    { type: 'cards', title: 'Diese Verben haben sein', min: '13rem', items: [
      { t: 'Bewegung A → B', k: 'ac', icon: 'move-right', p: 'Man ist danach an einem anderen Ort.', ex: 'gehen → {v:ist} {t:gegangen} · fahren → {v:ist} {t:gefahren} · fliegen → {v:ist} {t:geflogen} · kommen → {v:ist} {t:gekommen} · laufen → {v:ist} {t:gelaufen}' },
      { t: 'Veränderung', k: 'd', icon: 'refresh-cw', p: 'Etwas ist danach anders.', ex: 'aufstehen → {v:ist} {t:aufgestanden} · einschlafen → {v:ist} {t:eingeschlafen} · werden → {v:ist} {t:geworden}' },
      { t: 'Ausnahmen', k: 'b', icon: 'star', p: 'Diese musst du einfach lernen.', ex: 'sein → {v:ist} {t:gewesen} · bleiben → {v:ist} {t:geblieben} · passieren → {v:ist} {t:passiert}' } ] },
    { type: 'grid', title: 'sein im Perfekt', head: ['', 'Beispiel'], rows: [
      ['ich', 'Ich {v:bin} {t:gefahren}.'], ['du', 'Du {v:bist} {t:gefahren}.'], ['er · sie · es', 'Sie {v:ist} {t:gefahren}.'],
      ['wir', 'Wir {v:sind} {t:gefahren}.'], ['ihr', 'Ihr {v:seid} {t:gefahren}.'], ['sie · Sie', 'Sie {v:sind} {t:gefahren}.'] ] },
    { type: 'merk', text: 'Von A nach B – oder eine Veränderung? Dann {v:sein}. Sonst {v:haben}.' },
    { type: 'note', title: 'fahren mit Objekt', text: 'Wer selbst fährt und ein Objekt hat, nimmt haben: Ich {v:habe} das Auto {t:gefahren}. Aber: Ich {v:bin} nach Köln {t:gefahren}.' }
  ],

  examples: [
    'Ich {v:bin} heute früh {t:aufgestanden}.',
    'Wann {v:bist} du nach Hause {t:gekommen}?',
    'Wir {v:sind} mit dem Zug nach Wien {t:gefahren}.',
    'Was {v:ist} {t:passiert}?',
    'Das Kind {v:ist} schnell {t:eingeschlafen}.',
    '{v:Seid} ihr lange {t:geblieben}?',
    'Sie {v:ist} Ärztin {t:geworden}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'haben oder sein?', instr: 'Wähle das richtige Hilfsverb.',
      items: [
        'Ich ((bin|habe)) nach Hause gegangen.', 'Wir ((haben|sind)) Pizza gegessen.', 'Er ((ist|hat)) um sechs aufgestanden.', 'Du ((hast|bist)) lange geschlafen.',
        'Was ((ist|hat)) passiert?', 'Sie ((sind|haben)) nach Kampala geflogen.', 'Ich ((habe|bin)) einen Brief geschrieben.', 'Ihr ((seid|habt)) zu Hause geblieben.' ] },
    { id: 'u2', type: 'fill', title: 'Das Partizip II', instr: 'Schreib das Partizip II.',
      items: [
        '(gehen) Wir sind ins Kino [[gegangen]].', '(fahren) Er ist nach Hamburg [[gefahren]].', '(kommen) Wann bist du [[gekommen]]?',
        '(fliegen) Sie sind nach Rom [[geflogen]].', '(bleiben) Ich bin zu Hause [[geblieben]].', '(werden) Er ist Lehrer [[geworden]].' ] },
    { id: 'u3', type: 'fill', title: 'Das Hilfsverb', instr: 'Schreib haben oder sein in der richtigen Form.',
      items: [
        'Ich [[bin]] gestern viel gelaufen.', 'Wir [[haben]] Kaffee getrunken.', 'Du [[bist]] spät gekommen.',
        'Ihr [[habt]] Fußball gespielt.', 'Er [[ist]] sofort eingeschlafen.', 'Die Gäste [[sind]] lange geblieben.' ] },
    { id: 'u4', type: 'type', title: 'Ins Perfekt', instr: 'Schreib den Satz im Perfekt.',
      items: [
        { q: 'Ich fahre nach Berlin.', pre: 'Ich', end: '.', ok: ['bin nach Berlin gefahren'] },
        { q: 'Er kommt spät.', pre: 'Er', end: '.', ok: ['ist spät gekommen'] },
        { q: 'Wir gehen ins Kino.', pre: 'Wir', end: '.', ok: ['sind ins Kino gegangen'] },
        { q: 'Was passiert?', pre: 'Was', end: '?', ok: ['ist passiert'] },
        { q: 'Sie fliegt nach Accra.', pre: 'Sie', end: '.', ok: ['ist nach Accra geflogen'] },
        { q: 'Ich stehe um sieben auf.', pre: 'Ich', end: '.', ok: ['bin um sieben aufgestanden'] } ] }
  ],

  speak: { title: 'Meine Reise', intro: 'Erzähl im Perfekt – mit sein!', altLabel: 'Weiter',
    items: [
      { cue: [['n', 'user-round', 'ich'], ['x', 'plane', 'nach Deutschland fliegen']], say: 'Ich {v:bin} nach Deutschland {t:geflogen}.' },
      { cue: [['n', 'user-round', 'du'], ['x', 'clock', 'wann · ankommen?']], say: 'Wann {v:bist} du {t:angekommen}?', alt: 'Ich {v:bin} gestern {t:angekommen}.' },
      { cue: [['n', 'users', 'wir'], ['x', 'train-front', 'mit dem Zug fahren']], say: 'Wir {v:sind} mit dem Zug {t:gefahren}.' },
      { cue: [['n', 'user-round', 'er'], ['x', 'house', 'zu Hause bleiben']], say: 'Er {v:ist} zu Hause {t:geblieben}.' },
      { cue: [['n', 'baby', 'das Baby'], ['x', 'moon', 'einschlafen']], say: 'Das Baby {v:ist} {t:eingeschlafen}.' },
      { cue: [['x', 'circle-help', 'was · passieren?']], say: 'Was {v:ist} {t:passiert}?', alt: 'Nichts, alles ist gut.' } ] }
});
