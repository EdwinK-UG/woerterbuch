/* Kapitel 72 – Indirekte Fragen (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 72, level: 'B1', group: 'Sätze verbinden 2',
  title: 'Indirekte Fragen',
  kicker: 'Wissen Sie, wo …?',
  intro: 'Indirekte Fragen sind <b>höflicher</b>. Sie beginnen mit „Wissen Sie, …“, „Können Sie mir sagen, …“ oder „Ich frage mich, …“. Danach kommt ein <b>Nebensatz</b>: W-Frage → mit dem Fragewort, Ja/Nein-Frage → mit <b>ob</b>. Das Verb steht am <b>Ende</b>.',
  hero: 'Entschuldigung, wissen Sie, {e:wo} der Bahnhof {v:ist}?',
  art: K => K.svg(K.street() + K.shadow(160) + K.shadow(380) +
    K.person({ x: 160, shirt: 'var(--das)', skin: 4, hair: 'bun', hc: 'var(--hair4)', armL: 'front', armR: 'front', face: 'open',
      extra: '<rect x="-20" y="-118" width="70" height="46" rx="3" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><path d="M-12 -106l20 10l14 -14l12 12M-4 -84h40" stroke="var(--der)" stroke-width="2" fill="none"/><circle cx="34" cy="-100" r="4" fill="var(--die)"/>' }) +
    K.person({ x: 380, shirt: 'var(--nom)', skin: 1, hair: 'short', beard: 'var(--hair2)', armL: 'out', face: 'smile' }) +
    K.bubble(176, 82, 'Wissen Sie, *wo* der Bahnhof *ist*?', { tail: 'c' }) + K.bubble(400, 126, 'Da vorne links!', { tail: 'c' }),
    'Eine Touristin mit Stadtplan fragt einen Mann: Wissen Sie, wo der Bahnhof ist? – Da vorne links!'),
  lemmas: { ob: 'ob', wo: 'wo', wann: 'wann', Wissen: 'wissen' },

  understand: [
    { type: 'grid', title: 'Direkt und indirekt', head: ['direkte Frage', 'indirekte Frage'], label: false, rows: [
      ['Wo {v:ist} der Bahnhof?', 'Wissen Sie, {e:wo} der Bahnhof {v:ist}?'],
      ['Wann {v:fährt} der Zug?', 'Können Sie mir sagen, {e:wann} der Zug {v:fährt}?'],
      ['{v:Ist} der Platz frei?', 'Wissen Sie, {e:ob} der Platz frei {v:ist}?'],
      ['{v:Kommt} er heute?', 'Ich weiß nicht, {e:ob} er heute {v:kommt}.'] ] },
    { type: 'cards', title: 'So funktioniert es', min: '13rem', items: [
      { t: 'W-Frage', k: 'ac', p: 'Das Fragewort bleibt und leitet den Nebensatz ein.', ex: 'Ich frage mich, {e:warum} er so spät {v:kommt}.' },
      { t: 'Ja/Nein-Frage', k: 'n', p: 'Statt Fragewort: {e:ob}.', ex: 'Weißt du, {e:ob} das Museum heute offen {v:ist}?' } ] },
    { type: 'merk', text: 'Indirekte Frage = Nebensatz: Fragewort oder {e:ob} – Verb am Ende.' },
    { type: 'note', title: 'Satzzeichen', text: 'Ist der ganze Satz eine Frage (Wissen Sie, …?), steht am Ende ein Fragezeichen. Sonst ein Punkt: Ich weiß nicht, wo er {v:wohnt}.' }
  ],

  examples: [
    'Können Sie mir sagen, {e:wie spät} es {v:ist}?',
    'Wissen Sie, {e:ob} dieser Bus zum Flughafen {v:fährt}?',
    'Ich weiß nicht, {e:was} das {v:bedeutet}.',
    'Darf ich fragen, {e:woher} Sie {v:kommen}?',
    'Er fragt, {e:ob} wir morgen Zeit {v:haben}.',
    'Ich frage mich, {e:wann} der Sommer {v:kommt}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Fragewort oder ob?', instr: 'Wähle das passende Wort.',
      items: [
        'Wissen Sie, ((wo|ob)) die Post ist?', 'Wissen Sie, ((ob|wo)) die Post heute offen ist?', 'Ich weiß nicht, ((wann|ob)) der Film beginnt.',
        'Kannst du mir sagen, ((ob|wie)) du morgen kommst? – Ja, ich komme.', 'Er fragt, ((wie|ob)) ich heiße.', 'Ich frage mich, ((ob|was)) sie Zeit hat.' ] },
    { id: 'u2', type: 'order', title: 'Indirekte Fragen bauen', instr: 'Das Verb kommt ans Ende.',
      items: [
        { tiles: ['wo', 'der Bahnhof', 'ist'], end: '?', ok: ['wo der Bahnhof ist'] },
        { tiles: ['ob', 'der Zug', 'pünktlich', 'kommt'], end: '?', ok: ['ob der Zug pünktlich kommt'] },
        { tiles: ['wann', 'das Konzert', 'beginnt'], end: '?', ok: ['wann das Konzert beginnt'] },
        { tiles: ['was', 'das', 'kostet'], end: '?', ok: ['was das kostet'] } ] },
    { id: 'u3', type: 'type', title: 'Frag höflich', instr: 'Mach aus der Frage eine indirekte Frage.',
      items: [
        { q: 'Wo ist die Toilette?', pre: 'Wissen Sie,', end: '?', ok: ['wo die Toilette ist'] },
        { q: 'Wann kommt der Bus?', pre: 'Können Sie mir sagen,', end: '?', ok: ['wann der Bus kommt'] },
        { q: 'Ist der Platz frei?', pre: 'Wissen Sie,', end: '?', ok: ['ob der Platz frei ist'] },
        { q: 'Wie viel kostet das?', pre: 'Können Sie mir sagen,', end: '?', ok: ['wie viel das kostet'] },
        { q: 'Spricht er Englisch?', pre: 'Weißt du,', end: '?', ok: ['ob er Englisch spricht'] } ] }
  ],

  speak: { title: 'Höflich fragen', intro: 'Stell die Frage höflich mit „Wissen Sie, …?“ oder „Können Sie mir sagen, …?“', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'train-front', 'Wo ist der Bahnhof?']], say: 'Wissen Sie, {e:wo} der Bahnhof {v:ist}?' },
      { cue: [['x', 'clock', 'Wie spät ist es?']], say: 'Können Sie mir sagen, {e:wie spät} es {v:ist}?' },
      { cue: [['x', 'armchair', 'Ist der Platz frei?']], say: 'Wissen Sie, {e:ob} der Platz frei {v:ist}?' },
      { cue: [['x', 'bus', 'Fährt der Bus zum Zoo?']], say: 'Wissen Sie, {e:ob} der Bus zum Zoo {v:fährt}?' },
      { cue: [['x', 'euro', 'Was kostet das?']], say: 'Können Sie mir sagen, {e:was} das {v:kostet}?' } ] }
});
