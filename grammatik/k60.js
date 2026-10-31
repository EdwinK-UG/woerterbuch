/* Kapitel 60 – Konjunktiv II: Formen (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 60, level: 'B1', group: 'Verben 3',
  title: 'Konjunktiv II: Formen',
  kicker: 'wäre, hätte, würde',
  intro: 'Mit dem Konjunktiv II sprichst du über <b>Träume, Wünsche und Höflichkeit</b> – über Dinge, die nicht wirklich so sind. Meistens nimmst du <b>würde + Infinitiv</b>. Bei sein, haben und den Modalverben gibt es eigene Formen: <b>wäre, hätte, könnte, müsste …</b>',
  hero: 'Ich {v:wäre} jetzt so gern am Strand!',
  art: K => K.svg(K.room(false) + K.table(160, 236, 180) + `<rect x="120" y="196" width="68" height="40" rx="4" fill="var(--ink)"/><rect x="125" y="201" width="58" height="30" fill="var(--der)" opacity=".55"/><rect x="112" y="232" width="84" height="5" rx="2" fill="var(--metal)"/>` +
    K.shadow(240) + K.person({ x: 240, shirt: 'var(--der)', skin: 1, hair: 'short', glasses: true, armL: 'front', armR: 'chest', face: 'smile' }) +
    `<g><circle cx="300" cy="134" r="7" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><circle cx="318" cy="112" r="11" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>
<ellipse cx="400" cy="74" rx="100" ry="62" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><clipPath id="grdream"><ellipse cx="400" cy="74" rx="94" ry="56"/></clipPath>
<g clip-path="url(#grdream)"><rect x="300" y="10" width="200" height="130" fill="var(--sky1)"/><circle cx="450" cy="40" r="14" fill="var(--sun)"/><rect x="300" y="84" width="200" height="30" style="fill:color-mix(in srgb,var(--der) 55%,var(--sky2))"/><rect x="300" y="110" width="200" height="40" fill="var(--floor)"/>
<path d="M360 110q4 -40 -6 -56" stroke="var(--wood)" stroke-width="5" fill="none"/><g fill="var(--hill1)"><ellipse cx="342" cy="52" rx="22" ry="7" transform="rotate(-20 342 52)"/><ellipse cx="370" cy="50" rx="22" ry="7" transform="rotate(20 370 50)"/><ellipse cx="356" cy="44" rx="18" ry="6"/></g></g></g>`,
    'Ein Mann sitzt im Büro am Laptop und träumt vom Strand mit Palme und Sonne.'),
  lemmas: { wäre: 'sein', hätte: 'haben', würde: 'werden', könnte: 'können', müsste: 'müssen', dürfte: 'dürfen', sollte: 'sollen', wollte: 'wollen' },

  understand: [
    { type: 'grid', title: 'Die wichtigsten Formen', head: ['', 'sein', 'haben', 'werden', 'können', 'müssen'], rows: [
      ['ich', '{e:wäre}', '{e:hätte}', '{e:würde}', '{e:könnte}', '{e:müsste}'], ['du', 'wärst', 'hättest', 'würdest', 'könntest', 'müsstest'],
      ['er · sie · es', '{e:wäre}', '{e:hätte}', '{e:würde}', '{e:könnte}', '{e:müsste}'], ['wir', 'wären', 'hätten', 'würden', 'könnten', 'müssten'],
      ['ihr', 'wärt', 'hättet', 'würdet', 'könntet', 'müsstet'], ['sie · Sie', 'wären', 'hätten', 'würden', 'könnten', 'müssten'] ], hl: [0, 2],
      foot: 'Die Formen kommen vom Präteritum + Umlaut: war → w<b>ä</b>re, hatte → h<b>ä</b>tte, konnte → k<b>ö</b>nnte. sollte und wollte bleiben ohne Umlaut.' },
    { type: 'slots', title: 'würde + Infinitiv', rows: [
      [['Ich', 'n', 'Position 1'], ['würde', 'v', 'Position 2'], ['gern', 'x', ''], ['am Meer', 'x', ''], ['wohnen', 'vt', 'Ende']] ],
      note: 'Für fast alle anderen Verben: würde (Position 2) + Infinitiv (Ende) – wie bei den Modalverben.' },
    { type: 'merk', text: 'sein → {v:wäre} · haben → {v:hätte} · alle anderen → {v:würde} + {t:Infinitiv}' },
    { type: 'note', title: 'Wirklich oder nicht?', text: 'Indikativ: Ich {e:bin} am Strand. (Das ist so.) – Konjunktiv II: Ich {e:wäre} gern am Strand. (Das ist nicht so – ich wünsche es mir.)' }
  ],

  examples: [
    'Ich {v:hätte} gern einen Kaffee.',
    'Das {v:wäre} toll!',
    '{v:Könnten} Sie mir bitte {t:helfen}?',
    'Ich {v:würde} gern mehr {t:reisen}.',
    'Du {v:solltest} mehr {t:schlafen}.',
    'An deiner Stelle {v:würde} ich {t:warten}.'
  ],

  exercises: [
    { id: 'u1', type: 'fill', title: 'Konjunktiv-II-Formen', instr: 'Schreib die Form im Konjunktiv II.',
      items: [
        '(sein) ich [[wäre]]', '(haben) ich [[hätte]]', '(werden) ich [[würde]]', '(können) ich [[könnte]]',
        '(sein) wir [[wären]]', '(haben) du [[hättest]]', '(müssen) er [[müsste]]', '(dürfen) ich [[dürfte]]' ] },
    { id: 'u2', type: 'choice', title: 'Die richtige Form', instr: 'Wähle die passende Form.',
      items: [
        'Ich ((wäre|würde|hätte)) gern reich.', 'Wir ((hätten|wären|würden)) gern mehr Zeit.', 'Er ((würde|wäre|hätte)) gern Pilot werden.',
        '((Könntest|Würdest|Wärst)) du mir helfen?', 'Ihr ((solltet|solltest|sollte)) früher ins Bett gehen.', 'Das ((wäre|hätte|würde)) schön!' ] },
    { id: 'u3', type: 'type', title: 'Wünsche', instr: 'Schreib den Wunsch mit würde gern … oder wäre/hätte gern.',
      items: [
        { q: 'Ich bin nicht am Meer.', pre: 'Ich', end: ' am Meer.', ok: ['wäre gern', 'wäre gerne'] },
        { q: 'Ich habe keinen Hund.', pre: 'Ich', end: ' einen Hund.', ok: ['hätte gern', 'hätte gerne'] },
        { q: 'Ich reise nicht viel.', pre: 'Ich', end: '.', ok: ['würde gern viel reisen', 'würde gerne viel reisen', 'würde gern mehr reisen'] },
        { q: 'Ich spiele nicht Gitarre.', pre: 'Ich', end: '.', ok: ['würde gern Gitarre spielen', 'würde gerne Gitarre spielen'] } ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'würde auf Position 2, Infinitiv ans Ende.',
      items: [
        { tiles: ['Ich', 'würde', 'gern', 'in Berlin', 'wohnen'], end: '.', ok: ['Ich würde gern in Berlin wohnen'] },
        { tiles: ['Könnten', 'Sie', 'das Fenster', 'öffnen'], end: '?', ok: ['Könnten Sie das Fenster öffnen'] },
        { tiles: ['Wir', 'hätten', 'gern', 'zwei Kaffee'], end: '.', ok: ['Wir hätten gern zwei Kaffee'] },
        { tiles: ['Du', 'solltest', 'mehr', 'Wasser', 'trinken'], end: '.', ok: ['Du solltest mehr Wasser trinken'] } ] }
  ],

  speak: { title: 'Ich wäre gern …', intro: 'Sag deine Träume im Konjunktiv II.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'waves', 'am Strand sein']], say: 'Ich {v:wäre} jetzt gern am Strand.' },
      { cue: [['x', 'clock', 'mehr Zeit haben']], say: 'Ich {v:hätte} gern mehr Zeit.' },
      { cue: [['x', 'plane', 'um die Welt reisen']], say: 'Ich {v:würde} gern um die Welt {t:reisen}.' },
      { cue: [['x', 'coffee', 'höflich: einen Tee']], say: 'Ich {v:hätte} gern einen Tee, bitte.' },
      { cue: [['x', 'hand-helping', 'höflich: helfen (Sie)']], say: '{v:Könnten} Sie mir bitte {t:helfen}?' } ] }
});
