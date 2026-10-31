/* Kapitel 62 – Passiv Präsens (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 62, level: 'B1', group: 'Verben 3',
  title: 'Passiv Präsens',
  kicker: 'Hier wird ein Haus gebaut.',
  intro: 'Im Passiv ist die <b>Handlung</b> wichtig, nicht die Person. Du bildest es mit <b>werden</b> (Position 2) + <b>Partizip II</b> (Ende). Die Person kann mit <b>von + Dativ</b> genannt werden – muss aber nicht.',
  hero: 'Hier {v:wird} ein neues Haus {t:gebaut}.',
  art: K => K.svg(K.sky() +
    `<g stroke="var(--nom)" stroke-width="6" fill="none"><path d="M420 300V60M420 60H240M420 60l40 30M400 300V80"/><path d="M404 90l12 16M404 130l12 16M404 170l12 16M404 210l12 16M404 250l12 16" stroke-width="3"/></g><path d="M300 60v60" stroke="var(--ink)" stroke-width="2"/><rect x="284" y="120" width="32" height="22" fill="var(--wood)"/>
<g><rect x="90" y="170" width="200" height="126" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><path d="M90 170h200M90 212h200M90 254h200M140 170v126M190 170v126M240 170v126" stroke="var(--die)" stroke-width="5"/>
${[[100, 222], [150, 222], [200, 264], [250, 180]].map(([x, y]) => `<rect x="${x}" y="${y}" width="32" height="24" fill="var(--sky1)" stroke="var(--wood)" stroke-width="2"/>`).join('')}</g>` +
    K.person({ x: 250, y: 170, s: .55, shirt: 'var(--nom)', skin: 1, hair: 'short', armR: 'up', extra: '<path d="M-27 -186Q0 -214 27 -186Z" fill="var(--sun)"/>' }) +
    K.tag(190, 330, 'Hier wird gebaut!', 'nom'),
    'Eine Baustelle mit Kran: Hier wird ein Haus gebaut. Ein Bauarbeiter mit Helm steht auf dem Gerüst.'),
  lemmas: { wird: 'werden', werden: 'werden', gebaut: 'bauen', gepflanzt: 'pflanzen', geöffnet: 'öffnen', gesprochen: 'sprechen' },

  understand: [
    { type: 'grid', title: 'Aktiv und Passiv', head: ['', 'Satz', 'Was ist wichtig?'], rows: [
      ['Aktiv', '{n:Die Arbeiter} bauen {a:ein Haus}.', 'Wer macht es?'],
      ['Passiv', '{n:Ein Haus} {v:wird} {t:gebaut}.', 'Was passiert?'],
      ['Passiv + von', '{n:Ein Haus} {v:wird} von den Arbeitern {t:gebaut}.', 'Was passiert – und durch wen?'] ],
      foot: 'Das Akkusativ-Objekt im Aktiv wird im Passiv zum Subjekt (Nominativ): Man baut <b>einen</b> Turm → <b>Ein</b> Turm wird gebaut.' },
    { type: 'conj', title: 'werden im Präsens', intro: 'Das Passiv braucht werden – lern die Formen gut.', verbs: {
      werden: { f: ['werde', 'w{e:ir}st', 'w{e:ird}', 'werden', 'werdet', 'werden'], n: 'Vorsicht: du wirst, er wird (ohne d bei du).' } } },
    { type: 'note', title: 'Das unpersönliche Passiv', text: 'Manchmal gibt es gar kein Subjekt: Hier {v:wird} nicht {t:geraucht}. Sonntags {v:wird} nicht {t:gearbeitet}.' },
    { type: 'merk', text: 'Passiv = {v:werden} + {t:Partizip II}' }
  ],

  examples: [
    'In Uganda {v:wird} viel Kaffee {t:angebaut}.',
    'Das Museum {v:wird} um 10 Uhr {t:geöffnet}.',
    'Hier {v:wird} Englisch {t:gesprochen}.',
    'Die Briefe {v:werden} jeden Tag {t:abgeholt}.',
    'Der Patient {v:wird} morgen {t:operiert}.',
    'Im Restaurant {v:wird} nicht {t:geraucht}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Die Form von werden', instr: 'Wähle die richtige Form.',
      items: [
        'Das Auto ((wird|werden|wirst)) repariert.', 'Die Fenster ((werden|wird|werdet)) geputzt.', 'Ich ((werde|wird|wirst)) abgeholt.',
        'Du ((wirst|wird|werdest)) gesucht!', 'Wir ((werden|wird|werdet)) eingeladen.', 'Hier ((wird|werden|werdet)) gebaut.' ] },
    { id: 'u2', type: 'fill', title: 'Partizip II', instr: 'Schreib das Partizip II.',
      items: [
        '(bauen) Die Brücke wird neu [[gebaut]].', '(reparieren) Mein Fahrrad wird [[repariert]].', '(schreiben) Der Brief wird heute [[geschrieben]].',
        '(öffnen) Die Tür wird um acht [[geöffnet]].', '(einladen) Alle Nachbarn werden [[eingeladen]].', '(verkaufen) Hier werden Bücher [[verkauft]].' ] },
    { id: 'u3', type: 'type', title: 'Aktiv → Passiv', instr: 'Schreib den Satz im Passiv (ohne „von“).',
      items: [
        { q: 'Man baut hier eine Schule.', pre: 'Hier', end: '.', ok: ['wird eine Schule gebaut'] },
        { q: 'Der Mechaniker repariert das Auto.', pre: 'Das Auto', end: '.', ok: ['wird repariert'] },
        { q: 'Man spricht hier Deutsch.', pre: 'Hier', end: '.', ok: ['wird Deutsch gesprochen'] },
        { q: 'Die Kinder essen die Kekse.', pre: 'Die Kekse', end: '.', ok: ['werden gegessen'] },
        { q: 'Man öffnet die Post um neun.', pre: 'Die Post', end: '.', ok: ['wird um neun geöffnet'] } ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'werden auf Position 2, Partizip ans Ende.',
      items: [
        { tiles: ['Hier', 'wird', 'ein Haus', 'gebaut'], end: '.', ok: ['Hier wird ein Haus gebaut'] },
        { tiles: ['Das Museum', 'wird', 'um zehn Uhr', 'geöffnet'], end: '.', ok: ['Das Museum wird um zehn Uhr geöffnet'] },
        { tiles: ['Die Briefe', 'werden', 'morgen', 'abgeholt'], end: '.', ok: ['Die Briefe werden morgen abgeholt'] },
        { tiles: ['Wird', 'hier', 'Englisch', 'gesprochen'], end: '?', ok: ['Wird hier Englisch gesprochen'] } ] }
  ],

  speak: { title: 'Was passiert hier?', intro: 'Beschreib im Passiv.', altLabel: 'Mit von',
    items: [
      { cue: [['x', 'construction', 'ein Haus · bauen']], say: 'Hier {v:wird} ein Haus {t:gebaut}.', alt: 'Das Haus {v:wird} von einer Firma {t:gebaut}.' },
      { cue: [['x', 'car', 'das Auto · reparieren']], say: 'Das Auto {v:wird} {t:repariert}.', alt: 'Das Auto {v:wird} vom Mechaniker {t:repariert}.' },
      { cue: [['x', 'coffee', 'in Uganda · Kaffee · anbauen']], say: 'In Uganda {v:wird} Kaffee {t:angebaut}.' },
      { cue: [['x', 'languages', 'hier · Englisch · sprechen']], say: 'Hier {v:wird} Englisch {t:gesprochen}.' },
      { cue: [['x', 'cigarette-off', 'hier · nicht rauchen']], say: 'Hier {v:wird} nicht {t:geraucht}.' } ] }
});
