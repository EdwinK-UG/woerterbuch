/* Kapitel 5 – Modalverben: Formen und Satzbau (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 5, level: 'A1', group: 'Verben 1',
  title: 'Modalverben: Formen und Satzbau',
  kicker: 'Ich kann, du kannst …',
  intro: 'Modalverben – <b>können, müssen, dürfen, wollen, sollen</b> und <b>möchten</b> – zeigen, wie wir etwas meinen: als Fähigkeit, Pflicht, Erlaubnis oder Wunsch. Das Modalverb steht auf Position 2, das zweite Verb kommt im <b>Infinitiv</b> ans Ende.',
  hero: 'Ich {v:kann} gut {t:schwimmen}.',
  art: K => {
    const dot = (x, y, t, c) => { const r = Math.max(26, t.length * 5.2 + 9); return `<g transform="translate(${x} ${y})"><circle r="${r}" fill="var(--${c}-s)" stroke="var(--${c})" stroke-width="2"/><text y="6" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="17" fill="var(--${c})">${t}</text></g>`; };
    const line = (x, y) => K.arrow(`M260 150L${x} ${y}`, 'var(--faint)');
    return K.svg(K.room(false) + `<circle cx="260" cy="170" r="128" fill="var(--sun)" opacity=".12"/>` +
      line(108, 84) + line(84, 186) + line(122, 270) + line(412, 84) + line(436, 186) + line(398, 270) + K.shadow(260) +
      K.person({ x: 260, shirt: 'var(--ac)', skin: 3, hair: 'curly', hc: 'var(--hair3)', armL: 'hip', armR: 'up', face: 'open' }) +
      dot(108, 84, 'kann', 'nom') + dot(84, 186, 'muss', 'dat') + dot(122, 270, 'darf', 'der') + dot(412, 84, 'will', 'akk') + dot(436, 186, 'soll', 'die') + dot(398, 270, 'möchte', 'das'),
      'Eine Person in der Mitte, um sie herum die Modalverben kann, muss, darf, will, soll und möchte.');
  },
  lemmas: { kann: 'können', Kannst: 'können', Musst: 'müssen', Könnt: 'können', darf: 'dürfen', will: 'wollen', sollst: 'sollen', möchtest: ['möchten', 'mögen'] },

  understand: [
    { type: 'grid', title: 'Alle Formen im Präsens', head: ['', 'können', 'müssen', 'dürfen', 'wollen', 'sollen', 'möchten'], rows: [
      ['ich', '{e:kann}', '{e:muss}', '{e:darf}', '{e:will}', 'soll', 'möchte'],
      ['du', 'kannst', 'musst', 'darfst', 'willst', 'sollst', 'möchtest'],
      ['er · sie · es', '{e:kann}', '{e:muss}', '{e:darf}', '{e:will}', 'soll', 'möchte'],
      ['wir', 'können', 'müssen', 'dürfen', 'wollen', 'sollen', 'möchten'],
      ['ihr', 'könnt', 'müsst', 'dürft', 'wollt', 'sollt', 'möchtet'],
      ['sie · Sie', 'können', 'müssen', 'dürfen', 'wollen', 'sollen', 'möchten'] ], hl: [0, 2],
      foot: '<b>ich</b> und <b>er/sie/es</b> sind gleich und haben keine Endung: ich kann – er kann. Im Singular ändert sich oft der Vokal: können → ich k<b>a</b>nn, müssen → ich m<b>u</b>ss, dürfen → ich d<b>a</b>rf, wollen → ich w<b>i</b>ll.' },
    { type: 'slots', title: 'Die Satzklammer', rows: [
      [['Ich', 'n', 'Position 1'], ['kann', 'v', 'Position 2'], ['heute', 'x', ''], ['nicht', 'x', ''], ['kommen', 'vt', 'Ende']],
      [['Heute', 'x', 'Position 1'], ['muss', 'v', 'Position 2'], ['ich', 'n', ''], ['lange', 'x', ''], ['arbeiten', 'vt', 'Ende']],
      [['Kannst', 'v', 'Position 1'], ['du', 'n', ''], ['mir', 'x', ''], ['helfen', 'vt', 'Ende']] ],
      note: 'Das Modalverb steht auf <b>Position 2</b> (in Ja/Nein-Fragen auf Position 1). Der <b>Infinitiv</b> steht am <b>Ende</b>. Alles andere steht dazwischen – wie in einer Klammer.' },
    { type: 'merk', text: 'Modalverb auf Position 2 – {t:Infinitiv} ans Ende!' },
    { type: 'note', title: 'Ohne zweites Verb', text: 'Manchmal fehlt der Infinitiv, weil er klar ist: Ich {v:kann} Deutsch. (= sprechen) – Ich {v:möchte} einen Kaffee. (= haben) – Ich {v:muss} nach Hause. (= gehen)' }
  ],

  examples: [
    'Ich {v:kann} heute nicht {t:kommen}.',
    '{v:Musst} du morgen {t:arbeiten}?',
    'Hier {v:darf} man nicht {t:parken}.',
    'Wir {v:wollen} im Sommer nach Italien {t:fahren}.',
    'Du {v:sollst} den Arzt {t:anrufen}.',
    'Was {v:möchtest} du {t:trinken}?',
    '{v:Könnt} ihr mir {t:helfen}?'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Die richtige Form', instr: 'Wähle die richtige Form des Modalverbs.',
      items: [
        'Ich ((kann|kannst|können)) nicht schwimmen.', '((Musst|Muss|Müsst)) du heute arbeiten?', 'Er ((will|willt|wollt)) Arzt werden.',
        'Ihr ((dürft|darft|dürfen)) hier nicht rauchen.', 'Wir ((sollen|sollt|soll)) um acht Uhr da sein.', 'Anna ((möchte|möchtet|möchtest)) einen Tee.',
        '((Könnt|Können|Kannst)) ihr morgen kommen?', 'Man ((darf|dürft|darfst)) hier parken.' ] },
    { id: 'u2', type: 'order', title: 'Die Satzklammer bauen', instr: 'Modalverb auf Position 2, Infinitiv ans Ende!',
      items: [
        { tiles: ['Ich', 'muss', 'heute', 'lange', 'arbeiten'], end: '.', ok: ['Ich muss heute lange arbeiten'] },
        { tiles: ['Kannst', 'du', 'mir', 'helfen'], end: '?', ok: ['Kannst du mir helfen'] },
        { tiles: ['Wir', 'wollen', 'am Samstag', 'ins Kino', 'gehen'], end: '.', ok: ['Wir wollen am Samstag ins Kino gehen'] },
        { tiles: ['Hier', 'darf', 'man', 'nicht', 'parken'], end: '.', ok: ['Hier darf man nicht parken'] },
        { tiles: ['Was', 'möchtest', 'du', 'essen'], end: '?', ok: ['Was möchtest du essen'] },
        { tiles: ['Morgen', 'soll', 'es', 'regnen'], end: '.', ok: ['Morgen soll es regnen'] } ] },
    { id: 'u3', type: 'fill', title: 'Formen ergänzen', instr: 'Schreib das Modalverb in der richtigen Form.',
      items: [
        '(können) Ich [[kann]] gut kochen.', '(müssen) Du [[musst]] mehr schlafen.', '(wollen) [[Wollt]] ihr mitkommen?',
        '(dürfen) Hunde [[dürfen]] hier nicht ins Wasser.', '(sollen) Was [[soll]] ich machen?', '(möchten) Wir [[möchten]] bestellen.', '(können) [[Kann]] Paul Englisch?' ] },
    { id: 'u4', type: 'type', title: 'Sätze mit Modalverb', instr: 'Schreib den Satz mit dem Modalverb. Das Verb aus dem Satz kommt im Infinitiv ans Ende.',
      items: [
        { q: 'Ich schwimme. (können)', pre: 'Ich', end: '.', ok: ['kann schwimmen'] },
        { q: 'Du lernst Deutsch. (müssen)', pre: 'Du', end: '.', ok: ['musst Deutsch lernen'] },
        { q: 'Er kommt morgen. (wollen)', pre: 'Er', end: '.', ok: ['will morgen kommen'] },
        { q: 'Wir parken hier. (dürfen)', pre: 'Wir', end: '.', ok: ['dürfen hier parken'] },
        { q: 'Ihr ruft Mama an. (sollen)', pre: 'Ihr', end: '.', ok: ['sollt Mama anrufen'] },
        { q: 'Trinkst du Tee? (möchten)', pre: '', end: '?', ok: ['Möchtest du Tee trinken'] } ] }
  ],

  speak: { title: 'Bilde Sätze', intro: 'Bilde einen Satz mit Modalverb. Denk an die Klammer!', altLabel: 'Weiter',
    items: [
      { cue: [['n', 'user-round', 'ich'], ['v', '', 'können'], ['x', 'bike', 'Fahrrad fahren']], say: 'Ich {v:kann} Fahrrad {t:fahren}.', alt: '{v:Kannst} du auch Fahrrad {t:fahren}?' },
      { cue: [['n', 'user-round', 'du'], ['v', '', 'müssen'], ['x', 'briefcase', 'morgen arbeiten?']], say: '{v:Musst} du morgen {t:arbeiten}?', alt: 'Ja, ich {v:muss} um acht {t:anfangen}.' },
      { cue: [['n', 'user-round', 'man'], ['v', '', 'dürfen'], ['x', 'cigarette-off', 'hier nicht rauchen']], say: 'Hier {v:darf} man nicht {t:rauchen}.' },
      { cue: [['n', 'users', 'wir'], ['v', '', 'wollen'], ['x', 'map', 'nach Mombasa fahren']], say: 'Wir {v:wollen} nach Mombasa {t:fahren}.' },
      { cue: [['n', 'users', 'ihr'], ['v', '', 'sollen'], ['x', 'volume-x', 'leise sein']], say: 'Ihr {v:sollt} leise {t:sein}.' },
      { cue: [['n', 'user-round', 'ich'], ['v', '', 'möchten'], ['x', 'glass-water', 'ein Wasser trinken']], say: 'Ich {v:möchte} ein Wasser {t:trinken}.' } ] }
});
