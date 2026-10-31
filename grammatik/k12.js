/* Kapitel 12 – Das Verb auf Position 2 (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 12, level: 'A1', group: 'Sätze und Fragen',
  title: 'Das Verb auf Position 2',
  kicker: 'Heute gehen wir ins Kino.',
  intro: 'In der Aussage steht das Verb <b>immer auf Position 2</b>. Auf Position 1 kann das Subjekt stehen – oder eine Zeit, ein Ort, eine Sache. Dann steht das <b>Subjekt direkt nach dem Verb</b>.',
  hero: '{e:Heute} {v:gehen} wir ins Kino.',
  art: K => {
    const words = [['Heute', 'q', '1'], ['gehen', 'v', '2'], ['wir', 'n', ''], ['ins Kino', 'x', '']];
    const sty = { q: ['var(--ac-salt)', 'var(--ac)', 'var(--ac)'], v: ['var(--fg)', 'var(--fg)', 'var(--bg)'], n: ['var(--nom-s)', 'var(--nom)', 'var(--nom)'], x: ['var(--card)', 'var(--line)', 'var(--ink)'] };
    let x = 18, g = '';
    for (const [w, k, num] of words) {
      const wd = Math.round(w.length * 11.5 + 30), [bg, st, tc] = sty[k];
      g += `<rect x="${x}" y="196" width="${wd}" height="64" rx="10" fill="${bg}" stroke="${st}" stroke-width="2.5"/>
<text x="${x + wd / 2}" y="236" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="21" fill="${tc}">${w}</text>
<circle cx="${x + 18}" cy="270" r="9" fill="var(--ink)"/><circle cx="${x + wd - 18}" cy="270" r="9" fill="var(--ink)"/>` +
        (num ? `<circle cx="${x + wd / 2}" cy="170" r="15" fill="${k === 'v' ? 'var(--fg)' : 'var(--ac)'}"/><text x="${x + wd / 2}" y="176" text-anchor="middle" font-family="Inter,sans-serif" font-weight="800" font-size="16" fill="var(--card)">${num}</text>` : '');
      x += wd + 4; g += `<rect x="${x - 6}" y="240" width="8" height="5" fill="var(--ink)"/>`; x += 6;
    }
    const lx = x + 2;
    g += `<path d="M${lx} 260V188q0-8 8-8h40v-26h22v26h8q10 0 10 10v70z" fill="var(--die)"/><rect x="${lx + 52}" y="130" width="14" height="26" rx="3" fill="var(--ink)"/>
<rect x="${lx + 10}" y="192" width="30" height="26" rx="4" fill="var(--sky1)"/><circle cx="${lx + 16}" cy="270" r="11" fill="var(--ink)"/><circle cx="${lx + 62}" cy="270" r="11" fill="var(--ink)"/>
<g fill="var(--cloud)" opacity=".95"><circle cx="${lx + 62}" cy="114" r="11"/><circle cx="${lx + 78}" cy="96" r="14"/><circle cx="${lx + 98}" cy="78" r="17"/></g>`;
    return K.svg(K.sky() + `<path d="M0 284H520" stroke="var(--ink)" stroke-width="4"/><g stroke="var(--wood)" stroke-width="6">${Array.from({ length: 18 }, (_, i) => `<path d="M${i * 30 + 6} 286v10"/>`).join('')}</g>` + g,
      'Ein Zug mit Wagen: Heute (Position 1), gehen (Position 2), wir, ins Kino.');
  },
  lemmas: { gehen: 'gehen', besuche: 'besuchen', trinkt: 'trinken', kenne: 'kennen', beginnt: 'beginnen', habe: 'haben' },

  understand: [
    { type: 'slots', title: 'Position 1 wechselt – das Verb bleibt', rows: [
      [['Wir', 'n', 'Position 1'], ['gehen', 'v', 'Position 2'], ['heute', 'x', ''], ['ins Kino', 'x', '']],
      [['Heute', 'q', 'Position 1'], ['gehen', 'v', 'Position 2'], ['wir', 'n', 'Subjekt'], ['ins Kino', 'x', '']],
      [['Ins Kino', 'q', 'Position 1'], ['gehen', 'v', 'Position 2'], ['wir', 'n', 'Subjekt'], ['heute', 'x', '']] ],
      note: 'Steht etwas anderes als das Subjekt auf Position 1, rutscht das Subjekt <b>hinter das Verb</b>. Das Verb bewegt sich nie.' },
    { type: 'cards', title: 'Was kann auf Position 1 stehen?', min: '12rem', items: [
      { t: 'Subjekt', k: 'n', ex: '{e:Ich} {v:arbeite} heute.' },
      { t: 'Zeit', k: 'ac', ex: '{e:Heute} {v:arbeite} ich.' },
      { t: 'Ort', k: 'd', ex: '{e:In Berlin} {v:wohnt} meine Tante.' },
      { t: 'Sache', k: 'a', ex: '{e:Den Film} {v:kenne} ich schon.' } ],
      foot: 'Position 1 ist ein <b>Satzteil</b>, nicht ein Wort: „Am nächsten Samstag“ ist zusammen Position 1.' },
    { type: 'merk', text: 'Das Verb ist immer die Nummer 2: {e:Am Montag} {v:habe} ich frei.' },
    { type: 'note', title: 'Diese Wörter zählen nicht', text: '{e:und, aber, oder, denn} stehen vor Position 1 – auf „Position 0“: Ich bin müde, aber ich {v:gehe} noch einkaufen.' },
    { type: 'note', title: 'Tipp: Zeit vor Ort', text: 'Wenn beides in der Mitte steht: erst die Zeit, dann der Ort. Ich fahre {e:morgen} {e:nach Berlin}.' }
  ],

  examples: [
    '{e:Heute} {v:gehen} wir ins Kino.',
    '{e:Am Wochenende} {v:besuche} ich meine Oma.',
    '{e:In Kampala} {v:ist} es oft warm.',
    '{e:Jeden Morgen} {v:trinkt} Paul einen Kaffee.',
    '{e:Diesen Film} {v:kenne} ich schon.',
    '{e:Um acht Uhr} {v:beginnt} der Kurs.',
    '{e:Leider} {v:habe} ich keine Zeit.'
  ],

  exercises: [
    { id: 'u1', type: 'order', title: 'Sätze bauen', instr: 'Der Satz beginnt mit dem großgeschriebenen Teil. Wo steht das Verb?',
      items: [
        { tiles: ['Heute', 'gehen', 'wir', 'ins Kino'], end: '.', ok: ['Heute gehen wir ins Kino'] },
        { tiles: ['Am Montag', 'arbeite', 'ich', 'nicht'], end: '.', ok: ['Am Montag arbeite ich nicht'] },
        { tiles: ['In Hamburg', 'wohnt', 'mein Bruder'], end: '.', ok: ['In Hamburg wohnt mein Bruder'] },
        { tiles: ['Jeden Tag', 'lernt', 'Amara', 'Deutsch'], end: '.', ok: ['Jeden Tag lernt Amara Deutsch'] },
        { tiles: ['Um sieben Uhr', 'frühstücken', 'wir'], end: '.', ok: ['Um sieben Uhr frühstücken wir'] },
        { tiles: ['Leider', 'kann', 'ich', 'nicht', 'kommen'], end: '.', ok: ['Leider kann ich nicht kommen'] } ] },
    { id: 'u2', type: 'choice', title: 'Verb oder Subjekt zuerst?', instr: 'Was kommt nach Position 1?',
      items: [
        'Morgen ((fahre ich|ich fahre)) nach Köln.', 'Am Abend ((sehen wir|wir sehen)) fern.', 'Ich ((trinke|trinke ich)) gern Tee.',
        'Im Sommer ((ist es|es ist)) heiß.', 'Dann ((kocht Maria|Maria kocht)) das Essen.', 'Heute Abend ((spielt die Band|die Band spielt)) im Park.' ] },
    { id: 'u3', type: 'type', title: 'Fang anders an', instr: 'Schreib den Satz neu. Er beginnt mit dem markierten Teil.',
      items: [
        { q: 'Wir fahren [morgen] nach Berlin.', pre: 'Morgen', end: '.', ok: ['fahren wir nach Berlin'] },
        { q: 'Ich habe [heute] keine Zeit.', pre: 'Heute', end: '.', ok: ['habe ich keine Zeit'] },
        { q: 'Der Kurs beginnt [um neun Uhr].', pre: 'Um neun Uhr', end: '.', ok: ['beginnt der Kurs'] },
        { q: 'Meine Tante wohnt [in Mombasa].', pre: 'In Mombasa', end: '.', ok: ['wohnt meine Tante'] },
        { q: 'Paul spielt [am Samstag] Fußball.', pre: 'Am Samstag', end: '.', ok: ['spielt Paul Fußball'] },
        { q: 'Ich kenne [den Film] schon.', pre: 'Den Film', end: '.', ok: ['kenne ich schon'] } ] },
    { id: 'u4', type: 'choice', title: 'Welcher Satz ist richtig?', instr: 'Wähle den richtigen Satz.',
      items: [
        '((Am Samstag besuche ich meine Oma.|Am Samstag ich besuche meine Oma.))',
        '((Jetzt habe ich Hunger.|Jetzt ich habe Hunger.))',
        '((In Berlin gibt es viele Museen.|In Berlin es gibt viele Museen.))',
        '((Leider ist das Café geschlossen.|Leider das Café ist geschlossen.))',
        '((Abends lese ich gern.|Abends ich lese gern.))' ] }
  ],

  speak: { title: 'Fang mit der Zeit an', intro: 'Beginne mit dem ersten Teil. Das Verb kommt sofort danach!', altLabel: 'Weiter',
    items: [
      { cue: [['e', 'sun', 'Heute'], ['n', 'user-round', 'ich'], ['x', 'briefcase', 'lange arbeiten']], say: '{e:Heute} {v:arbeite} ich lange.' },
      { cue: [['e', 'calendar', 'Am Sonntag'], ['n', 'users', 'wir'], ['x', 'heart', 'Oma besuchen']], say: '{e:Am Sonntag} {v:besuchen} wir Oma.' },
      { cue: [['e', 'plane', 'Morgen'], ['n', 'user-round', 'du'], ['x', 'map-pin', 'nach Kampala fliegen']], say: '{e:Morgen} {v:fliegst} du nach Kampala.' },
      { cue: [['e', 'snowflake', 'Im Winter'], ['n', 'circle', 'es'], ['x', 'thermometer', 'kalt sein']], say: '{e:Im Winter} {v:ist} es kalt.' },
      { cue: [['e', 'sunrise', 'Jeden Morgen'], ['n', 'user-round', 'Paul'], ['x', 'footprints', 'joggen']], say: '{e:Jeden Morgen} {v:joggt} Paul.' },
      { cue: [['e', 'frown', 'Leider'], ['n', 'user-round', 'ich'], ['x', 'clock', 'keine Zeit haben']], say: '{e:Leider} {v:habe} ich keine Zeit.' } ] }
});
