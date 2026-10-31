/* Kapitel 73 – Infinitiv mit zu (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 73, level: 'B1', group: 'Sätze verbinden 2',
  title: 'Infinitiv mit zu',
  kicker: 'Es ist schön, Freunde zu treffen.',
  intro: 'Nach vielen Verben, Nomen und Ausdrücken steht ein <b>Infinitiv mit zu</b> am Ende: Ich habe keine Lust, <b>zu kochen</b>. Bei trennbaren Verben steht zu in der Mitte: <b>einzukaufen</b>.',
  hero: 'Es macht Spaß, mit Freunden {t:zu feiern}!',
  art: K => K.svg(K.room() + `<g>${[[70, 70, 'die'], [110, 56, 'akk'], [430, 64, 'nom'], [470, 80, 'dat']].map(([x, y, c]) => `<ellipse cx="${x}" cy="${y}" rx="18" ry="22" fill="var(--${c})"/><path d="M${x} ${y + 22}q4 30 -4 60" stroke="var(--ink)" stroke-width="1.5" fill="none"/>`).join('')}</g>
<path d="M140 30q60 30 120 0t120 0" stroke="var(--line)" stroke-width="2" fill="none"/>${[160, 200, 240, 280, 320, 360].map((x, i) => `<path d="M${x} ${34 + (i % 2) * 6}l10 16l10 -16z" fill="var(--${['die', 'nom', 'akk', 'dat', 'die', 'nom'][i]})"/>`).join('')}` +
    K.shadow(160) + K.shadow(270) + K.shadow(380) +
    K.person({ x: 160, shirt: 'var(--die)', skin: 1, hair: 'long', hc: 'var(--hair2)', armL: 'up', armR: 'wave', face: 'open' }) +
    K.person({ x: 270, shirt: 'var(--akk)', skin: 4, hair: 'short', hc: 'var(--hair4)', armR: 'up', face: 'open', extra: K.cup(12, -186) }) +
    K.person({ x: 380, shirt: 'var(--nom)', skin: 3, hair: 'curly', hc: 'var(--hair2)', armL: 'wave', armR: 'up', face: 'open' }),
    'Eine Party mit Luftballons und Girlande: drei Freunde feiern zusammen.'),
  lemmas: { feiern: 'feiern', einzukaufen: 'einkaufen', anzurufen: 'anrufen' },

  understand: [
    { type: 'cards', title: 'Wann steht zu + Infinitiv?', min: '13rem', items: [
      { t: 'nach Verben', k: 'ac', ws: ['versuchen', 'vergessen', 'anfangen', 'aufhören', 'hoffen', 'planen', 'vorhaben', 'beginnen'], ex: 'Ich versuche, pünktlich {t:zu sein}.' },
      { t: 'nach Nomen', k: 'n', ws: ['Lust haben', 'Zeit haben', 'Angst haben', 'die Möglichkeit', 'die Idee'], ex: 'Ich habe keine Zeit, {t:zu kochen}.' },
      { t: 'nach es ist + Adjektiv', k: 'd', ws: ['es ist schön', 'es ist wichtig', 'es ist schwer', 'es macht Spaß'], ex: 'Es ist wichtig, viel Wasser {t:zu trinken}.' } ] },
    { type: 'grid', title: 'Wo steht zu?', head: ['', 'Beispiel'], rows: [
      ['normales Verb', 'Ich habe Lust, ins Kino {t:zu gehen}.'], ['trennbares Verb', 'Vergiss nicht, Brot {t:einzukaufen}! (ein-zu-kaufen)'],
      ['Modalverb im Satz', 'Ich hoffe, morgen kommen {t:zu können}.'] ],
      foot: 'Kein zu nach Modalverben, lassen, gehen, sehen, hören … (Kapitel 74).' },
    { type: 'merk', text: 'Komma – … {t:zu} + Infinitiv am Ende. Trennbar: an{t:zu}rufen.' }
  ],

  examples: [
    'Ich habe keine Lust, heute {t:zu arbeiten}.',
    'Vergiss nicht, deine Mutter {t:anzurufen}!',
    'Es ist schwer, eine Wohnung in Berlin {t:zu finden}.',
    'Wir haben vor, im Sommer nach Ghana {t:zu fliegen}.',
    'Er hat aufgehört {t:zu rauchen}.',
    'Es macht Spaß, neue Leute {t:kennenzulernen}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Mit oder ohne zu?', instr: 'Wähle die richtige Form.',
      items: [
        'Ich habe keine Zeit, ((zu kochen|kochen)).', 'Ich muss heute ((kochen|zu kochen)).', 'Es ist schön, dich ((zu sehen|sehen)).',
        'Vergiss nicht, ((einzukaufen|zu einkaufen|einkaufen))!', 'Ich versuche, früher ((aufzustehen|zu aufstehen|aufstehen)).', 'Wir möchten ((tanzen|zu tanzen)).' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze', instr: 'Schreib das Verb in Klammern mit zu.',
      items: [
        '(lernen) Es ist wichtig, jeden Tag [[zu lernen]].', '(anrufen) Ich vergesse immer, dich [[anzurufen]].', '(gehen) Hast du Lust, schwimmen [[zu gehen]]?',
        '(aufräumen) Er hat keine Lust, sein Zimmer [[aufzuräumen]].', '(finden) Es ist nicht leicht, einen Job [[zu finden]].', '(mitkommen) Hast du Zeit, [[mitzukommen]]?' ] },
    { id: 'u3', type: 'type', title: 'Ergänze den Satz', instr: 'Schreib den Infinitiv mit zu.',
      items: [
        { q: 'Ich kaufe ein. Ich habe keine Lust …', pre: 'Ich habe keine Lust,', end: '.', ok: ['einzukaufen'] },
        { q: 'Man trinkt viel Wasser. Das ist wichtig.', pre: 'Es ist wichtig, viel Wasser', end: '.', ok: ['zu trinken'] },
        { q: 'Ich rauche nicht mehr. Ich habe aufgehört …', pre: 'Ich habe aufgehört', end: '.', ok: ['zu rauchen'] },
        { q: 'Ich rufe dich an. Ich habe vergessen …', pre: 'Ich habe vergessen, dich', end: '.', ok: ['anzurufen'] } ] }
  ],

  speak: { title: 'Was macht dir Spaß?', intro: 'Bilde Sätze mit zu + Infinitiv.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'smile', 'Spaß machen'], ['x', 'users', 'mit Freunden feiern']], say: 'Es macht Spaß, mit Freunden {t:zu feiern}.' },
      { cue: [['x', 'clock', 'keine Zeit haben'], ['x', 'chef-hat', 'kochen']], say: 'Ich habe keine Zeit {t:zu kochen}.' },
      { cue: [['x', 'heart', 'wichtig sein'], ['x', 'glass-water', 'viel Wasser trinken']], say: 'Es ist wichtig, viel Wasser {t:zu trinken}.' },
      { cue: [['x', 'phone', 'nicht vergessen'], ['x', 'user-round', 'Mama anrufen']], say: 'Vergiss nicht, Mama {t:anzurufen}!' },
      { cue: [['x', 'plane', 'vorhaben'], ['x', 'map-pin', 'nach Ghana fliegen']], say: 'Ich habe vor, nach Ghana {t:zu fliegen}.' } ] }
});
