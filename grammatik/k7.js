/* Kapitel 7 – Modalverben: müssen, sollen, dürfen (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 7, level: 'A1', group: 'Verben 1',
  title: 'Modalverben: müssen, sollen, dürfen',
  kicker: 'Muss ich – oder soll ich?',
  intro: '<b>müssen</b>: Es ist nötig. <b>sollen</b>: Eine andere Person will es – ein Rat oder ein Auftrag. <b>dürfen</b>: Es ist erlaubt. Und <b>nicht dürfen</b>: Es ist verboten.',
  hero: 'Hier {v:darf} man nicht {t:parken}!',
  art: K => K.svg(K.street() + K.sign(96, 290) + K.car(262, 330) + K.shadow(430) +
    K.person({ x: 430, shirt: 'var(--der)', skin: 1, hair: 'bun', armL: 'out', face: 'open',
      extra: '<path d="M-25 -184h50l-6-14h-38z" fill="var(--ink)"/><rect x="-27" y="-188" width="54" height="7" rx="3" fill="var(--ink)"/><circle cx="0" cy="-192" r="4" fill="var(--sun)"/>' }) +
    K.bubble(372, 92, 'Hier *darf* man nicht parken!', { tail: 'r' }),
    'Eine Polizistin zeigt auf ein Parkverbot-Schild und ein Auto: Hier darf man nicht parken!'),
  lemmas: { darf: 'dürfen', Darf: 'dürfen', muss: 'müssen', soll: 'sollen', Soll: 'sollen', dürfen: 'dürfen' },

  understand: [
    { type: 'cards', title: 'Was bedeuten sie?', min: '14rem', items: [
      { t: 'müssen', k: 'd', icon: 'alarm-clock', s: 'Pflicht · Notwendigkeit', p: 'Es ist nötig – es gibt keine Wahl.', ex: 'Ich {v:muss} um sieben {t:aufstehen}. Ich {v:muss} zum Arzt.' },
      { t: 'sollen', k: 'n', icon: 'message-square-quote', s: 'Rat · Auftrag', p: 'Eine andere Person sagt oder rät es.', ex: 'Der Arzt sagt, ich {v:soll} mehr {t:schlafen}.' },
      { t: 'dürfen', k: 'ok', icon: 'circle-check', s: 'Erlaubnis', p: 'Es ist erlaubt. Mit „nicht“: verboten.', ex: '{v:Darf} ich das Fenster {t:öffnen}? Hier {v:darf} man nicht {t:rauchen}.' } ] },
    { type: 'grid', title: 'Vorsicht: nicht müssen ≠ nicht dürfen', head: ['', 'Beispiel', 'Bedeutung'], rows: [
      ['nicht dürfen', 'Du {v:darfst} hier nicht {t:rauchen}.', '⛔ Das ist verboten.'],
      ['nicht müssen', 'Du {v:musst} nicht {t:kommen}.', '👍 Das ist nicht nötig – aber du kannst, wenn du willst.'] ] },
    { type: 'note', title: 'Kein Verbot!', text: '„Du {v:musst} nicht {t:kommen}“ heißt nicht: Komm nicht! Es heißt nur: Es ist nicht nötig. Ein Verbot ist: Du {v:darfst} nicht {t:kommen}.' },
    { type: 'merk', text: '{v:muss} = nötig · {v:soll} = jemand will es · {v:darf} = erlaubt · {v:darf} nicht = verboten' },
    { type: 'note', title: 'Soll ich …?', text: 'Mit „Soll ich …?“ bietest du Hilfe an oder fragst, was jemand will: {v:Soll} ich dir {t:helfen}? {v:Soll} ich das Fenster {t:zumachen}?' }
  ],

  examples: [
    'Ich {v:muss} jeden Tag um sechs Uhr {t:aufstehen}.',
    '{v:Darf} ich hier {t:sitzen}?',
    'Der Arzt sagt, ich {v:soll} mehr Wasser {t:trinken}.',
    'Im Museum {v:darf} man nicht {t:fotografieren}.',
    'Morgen ist Sonntag. Wir {v:müssen} nicht {t:arbeiten}.',
    '{v:Soll} ich dir {t:helfen}?',
    'Kinder unter zwölf {v:dürfen} den Film nicht {t:sehen}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Was passt?', instr: 'Lies die Situation und wähle das passende Modalverb.',
      items: [
        'Das Auto ist kaputt. Ich ((muss|darf|will)) den Bus nehmen.',
        'Mama sagt, ich ((soll|darf|kann)) mein Zimmer aufräumen.',
        'Im Krankenhaus ((darf|muss|will)) man nicht laut telefonieren.',
        '„Mama, ((darf|muss|will)) ich heute länger fernsehen?“',
        'Der Arzt sagt, Sie ((sollen|dürfen|wollen)) mehr Obst essen.',
        'Hier ist Parkverbot. Man ((darf|muss|will)) hier nicht parken.',
        'Kinder ((dürfen|müssen|sollen)) hier spielen – der Spielplatz ist für sie da.' ] },
    { id: 'u2', type: 'choice', title: 'nicht müssen oder nicht dürfen?', instr: 'Verboten oder nur nicht nötig? Wähle richtig.',
      items: [
        'Du ((musst|darfst)) nicht kommen – aber du kannst, wenn du Lust hast.',
        'Im Kino ((darf|muss)) man nicht telefonieren.',
        'Heute ist Sonntag. Ich ((muss|darf)) nicht früh aufstehen.',
        'Beim Autofahren ((darf|muss)) man keinen Alkohol trinken.',
        'Das Essen ist kostenlos. Ihr ((müsst|dürft)) nichts bezahlen.',
        'In der Prüfung ((darf|muss)) man nicht abschreiben.' ] },
    { id: 'u3', type: 'fill', title: 'Formen ergänzen', instr: 'Schreib das Modalverb in der richtigen Form.',
      items: [
        '(müssen) Du [[musst]] mehr lernen.', '(dürfen) [[Darf]] ich etwas fragen?', '(sollen) Ihr [[sollt]] pünktlich sein.',
        '(müssen) Wir [[müssen]] jetzt gehen.', '(dürfen) Hunde [[dürfen]] hier nicht ins Wasser.', '(sollen) Der Chef sagt, ich [[soll]] morgen früher kommen.' ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'Modalverb auf Position 2, Infinitiv ans Ende!',
      items: [
        { tiles: ['Ich', 'muss', 'heute', 'einkaufen'], end: '.', ok: ['Ich muss heute einkaufen'] },
        { tiles: ['Darf', 'ich', 'das Fenster', 'öffnen'], end: '?', ok: ['Darf ich das Fenster öffnen'] },
        { tiles: ['Hier', 'darf', 'man', 'nicht', 'rauchen'], end: '.', ok: ['Hier darf man nicht rauchen'] },
        { tiles: ['Was', 'soll', 'ich', 'machen'], end: '?', ok: ['Was soll ich machen'] },
        { tiles: ['Am Sonntag', 'müssen', 'wir', 'nicht', 'arbeiten'], end: '.', ok: ['Am Sonntag müssen wir nicht arbeiten'] } ] }
  ],

  speak: { title: 'Sag es!', intro: 'Bilde einen Satz mit müssen, sollen oder dürfen.', altLabel: 'Antwort',
    items: [
      { cue: [['b', 'camera-off', 'Museum'], ['x', 'camera', 'fotografieren · verboten']], say: 'Im Museum {v:darf} man nicht {t:fotografieren}.' },
      { cue: [['n', 'stethoscope', 'der Arzt'], ['x', 'candy-off', 'weniger Zucker essen']], say: 'Der Arzt sagt, ich {v:soll} weniger Zucker {t:essen}.' },
      { cue: [['d', 'alarm-clock', 'nötig'], ['x', 'sunrise', 'um 7 Uhr aufstehen']], say: 'Ich {v:muss} um sieben Uhr {t:aufstehen}.' },
      { cue: [['ok', 'circle-help', 'Erlaubnis?'], ['x', 'armchair', 'hier sitzen']], say: '{v:Darf} ich hier {t:sitzen}?', alt: 'Ja, natürlich!' },
      { cue: [['x', 'calendar', 'Sonntag'], ['d', 'briefcase', 'nicht arbeiten · nicht nötig']], say: 'Am Sonntag {v:müssen} wir nicht {t:arbeiten}.' },
      { cue: [['n', 'hand-helping', 'Angebot'], ['x', 'user-round', 'dir helfen']], say: '{v:Soll} ich dir {t:helfen}?', alt: 'Ja, gern. Danke!' } ] }
});
