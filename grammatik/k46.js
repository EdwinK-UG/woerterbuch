/* Kapitel 46 – Nebensätze: weil, dass, wenn (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 46, level: 'A2', group: 'Sätze verbinden 1',
  title: 'Nebensätze: weil, dass, wenn',
  kicker: 'Das Verb steht am Ende',
  intro: '<b>weil, dass, wenn</b> leiten einen <b>Nebensatz</b> ein. Im Nebensatz steht das konjugierte Verb ganz am <b>Ende</b>. Zwischen Haupt- und Nebensatz steht ein <b>Komma</b>.',
  hero: 'Ich bleibe heute zu Hause, {e:weil} ich krank {v:bin}.',
  art: K => K.svg(K.room() +
    `<rect x="120" y="226" width="290" height="58" rx="18" fill="var(--der)"/><rect x="108" y="196" width="40" height="100" rx="14" fill="var(--der)"/><rect x="382" y="196" width="40" height="100" rx="14" fill="var(--der)"/><rect x="130" y="284" width="12" height="14" fill="var(--wood)"/><rect x="390" y="284" width="12" height="14" fill="var(--wood)"/>
<g transform="translate(220 0)"><circle cx="0" cy="190" r="22" fill="var(--skin3)"/><path d="M-22 188Q-23 164 0 164Q23 164 22 188Q14 174 0 176Q-14 174-22 188Z" fill="var(--hair3)"/><path d="M-11 190q3 3 6 0M5 190q3 3 6 0" stroke="var(--ink)" stroke-width="2" fill="none"/><path d="M-5 201h10" stroke="var(--ink)" stroke-width="2"/><rect x="10" y="198" width="22" height="4" rx="2" fill="var(--card)" transform="rotate(-18 10 198)"/></g>
<path d="M190 214Q300 196 380 222V250Q300 236 190 248Z" fill="var(--die)"/>` + K.cup(450, 296) +
    K.bubble(260, 120, '… *weil* ich krank *bin*.', { tail: 'l' }),
    'Eine kranke Frau liegt mit Decke und Thermometer auf dem Sofa: … weil ich krank bin.'),
  lemmas: { weil: 'weil', dass: 'dass', wenn: 'wenn', bin: 'sein', habe: 'haben' },

  understand: [
    { type: 'slots', title: 'Hauptsatz + Nebensatz', rows: [
      [['Ich bleibe zu Hause,', 'x', 'Hauptsatz'], ['weil', 'q', 'Konnektor'], ['ich', 'n', 'Subjekt'], ['krank', 'x', ''], ['bin', 'v', 'Ende']],
      [['Ich glaube,', 'x', 'Hauptsatz'], ['dass', 'q', 'Konnektor'], ['er', 'n', 'Subjekt'], ['heute', 'x', ''], ['kommt', 'v', 'Ende']],
      [['Ich komme,', 'x', 'Hauptsatz'], ['wenn', 'q', 'Konnektor'], ['ich', 'n', 'Subjekt'], ['Zeit', 'x', ''], ['habe', 'v', 'Ende']] ],
      note: 'Konnektor – Subjekt – … – <b>Verb am Ende</b>.' },
    { type: 'cards', title: 'Was bedeuten sie?', min: '13rem', items: [
      { t: 'weil', k: 'n', s: 'Grund (Warum?)', ex: 'Ich lerne Deutsch, {e:weil} ich in Deutschland {v:arbeite}.' },
      { t: 'dass', k: 'ac', s: 'Inhalt (nach sagen, glauben, wissen, finden …)', ex: 'Sie sagt, {e:dass} der Kurs heute {v:ausfällt}.' },
      { t: 'wenn', k: 'd', s: 'Bedingung oder Zeit', ex: '{e:Wenn} es regnet, {v:bleiben} wir zu Hause.' } ] },
    { type: 'grid', title: 'weil oder denn?', head: ['', 'Beispiel', 'Verb'], rows: [
      ['denn (Hauptsatz)', 'Ich bleibe zu Hause, {e:denn} ich {v:bin} krank.', 'Position 2'],
      ['weil (Nebensatz)', 'Ich bleibe zu Hause, {e:weil} ich krank {v:bin}.', 'am Ende'] ] },
    { type: 'grid', title: 'Mehrere Verben im Nebensatz', head: ['', 'Beispiel'], rows: [
      ['trennbares Verb', '…, weil ich früh {v:aufstehe}.'], ['Modalverb', '…, weil ich {t:arbeiten} {v:muss}.'], ['Perfekt', '…, weil ich lange {t:geschlafen} {v:habe}.'] ],
      foot: 'Das konjugierte Verb steht immer ganz am Ende. Trennbare Verben bleiben zusammen.' },
    { type: 'note', title: 'Nebensatz zuerst', text: 'Steht der Nebensatz vorne, beginnt der Hauptsatz mit dem Verb: {e:Wenn} ich Zeit {v:habe}, {v:komme} ich. (Verb, Verb!)' },
    { type: 'merk', text: 'weil, dass, wenn → Komma → Verb ans Ende!' }
  ],

  examples: [
    'Ich trinke Kaffee, {e:weil} ich müde {v:bin}.',
    'Ich weiß, {e:dass} du recht {v:hast}.',
    '{e:Wenn} das Wetter schön {v:ist}, {v:gehen} wir an den See.',
    'Er sagt, {e:dass} er später {v:kommt}.',
    'Sie ist glücklich, {e:weil} sie die Prüfung bestanden {v:hat}.',
    'Ruf mich an, {e:wenn} du {t:ankommst}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'weil, dass oder wenn?', instr: 'Wähle das passende Wort.',
      items: [
        'Ich gehe ins Bett, ((weil|dass|wenn)) ich müde bin.', 'Ich hoffe, ((dass|weil|wenn)) du bald kommst.', '((Wenn|Dass|Weil)) ich Zeit habe, besuche ich dich.',
        'Er sagt, ((dass|wenn|weil)) er keinen Hunger hat.', 'Wir bleiben zu Hause, ((wenn|dass|weil)) es morgen regnet.', 'Sie lernt Deutsch, ((weil|dass|wenn)) sie in Wien studieren möchte.' ] },
    { id: 'u2', type: 'order', title: 'Nebensätze bauen', instr: 'Tippe den Nebensatz in der richtigen Reihenfolge an. Das Verb kommt ans Ende!',
      items: [
        { tiles: ['weil', 'ich', 'krank', 'bin'], end: '.', ok: ['weil ich krank bin'] },
        { tiles: ['dass', 'er', 'heute', 'kommt'], end: '.', ok: ['dass er heute kommt'] },
        { tiles: ['wenn', 'du', 'Zeit', 'hast'], end: '.', ok: ['wenn du Zeit hast'] },
        { tiles: ['weil', 'ich', 'arbeiten', 'muss'], end: '.', ok: ['weil ich arbeiten muss'] },
        { tiles: ['dass', 'der Zug', 'pünktlich', 'ankommt'], end: '.', ok: ['dass der Zug pünktlich ankommt'] } ] },
    { id: 'u3', type: 'type', title: 'Verbinde', instr: 'Verbinde die Sätze mit dem Wort in Klammern.',
      items: [
        { q: 'Ich bleibe zu Hause. Ich bin krank. (weil)', pre: 'Ich bleibe zu Hause,', end: '.', ok: ['weil ich krank bin'] },
        { q: 'Ich glaube: Er hat recht. (dass)', pre: 'Ich glaube,', end: '.', ok: ['dass er recht hat'] },
        { q: 'Ich komme mit. Ich habe Zeit. (wenn)', pre: 'Ich komme mit,', end: '.', ok: ['wenn ich Zeit habe'] },
        { q: 'Sie ist müde. Sie hat schlecht geschlafen. (weil)', pre: 'Sie ist müde,', end: '.', ok: ['weil sie schlecht geschlafen hat'] },
        { q: 'Er sagt: Der Kurs fällt aus. (dass)', pre: 'Er sagt,', end: '.', ok: ['dass der Kurs ausfällt'] },
        { q: 'Ich muss früh los. Ich will den Bus nehmen. (weil)', pre: 'Ich muss früh los,', end: '.', ok: ['weil ich den Bus nehmen will'] } ] },
    { id: 'u4', type: 'choice', title: 'weil oder denn?', instr: 'Achte auf die Position des Verbs.',
      items: [
        'Ich esse nichts, ((weil|denn)) ich keinen Hunger habe.', 'Ich esse nichts, ((denn|weil)) ich habe keinen Hunger.', 'Er kommt nicht, ((weil|denn)) er arbeiten muss.',
        'Er kommt nicht, ((denn|weil)) er muss arbeiten.', 'Wir fahren mit dem Zug, ((weil|denn)) das schneller ist.', 'Wir fahren mit dem Zug, ((denn|weil)) das ist schneller.' ] }
  ],

  speak: { title: 'Warum?', intro: 'Antworte mit weil – das Verb kommt ans Ende!', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'circle-help', 'Warum lernst du Deutsch?'], ['x', 'briefcase', 'in Deutschland arbeiten wollen']], say: '{e:Weil} ich in Deutschland arbeiten {v:will}.' },
      { cue: [['x', 'circle-help', 'Warum kommst du nicht?'], ['x', 'thermometer', 'krank sein']], say: '{e:Weil} ich krank {v:bin}.' },
      { cue: [['x', 'circle-help', 'Warum bist du müde?'], ['x', 'moon', 'schlecht schlafen (Perfekt)']], say: '{e:Weil} ich schlecht geschlafen {v:habe}.' },
      { cue: [['x', 'lightbulb', 'Ich glaube …'], ['x', 'sun', 'das Wetter · morgen schön sein']], say: 'Ich glaube, {e:dass} das Wetter morgen schön {v:ist}.' },
      { cue: [['x', 'calendar', 'Zeit haben'], ['x', 'house', 'dich besuchen']], say: '{e:Wenn} ich Zeit {v:habe}, {v:besuche} ich dich.' } ] }
});
