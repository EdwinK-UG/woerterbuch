/* Kapitel 39 – Woher? aus und von (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 39, level: 'A2', group: 'Präpositionen 1',
  title: 'Woher? aus und von',
  kicker: 'aus der Schule, vom Arzt',
  intro: 'Woher kommst du? Zwei Präpositionen, beide mit <b>Dativ</b>: <b>aus</b> für Städte, Länder, Gebäude und Räume (wo man drin war). <b>von</b> für Personen, Plätze und Veranstaltungen (wo man bei war).',
  hero: 'Ich komme gerade {e:aus} der Schule und dann {e:vom} Fußball.',
  art: K => K.svg(K.sky() +
    `<g><rect x="40" y="140" width="150" height="156" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><path d="M28 146L115 92L202 146Z" fill="var(--der)"/><rect x="94" y="226" width="42" height="70" rx="4" fill="var(--wood)"/>
<rect x="56" y="166" width="30" height="28" rx="3" fill="var(--sky1)" stroke="var(--wood)" stroke-width="3"/><rect x="144" y="166" width="30" height="28" rx="3" fill="var(--sky1)" stroke="var(--wood)" stroke-width="3"/><text x="115" y="132" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="800" fill="var(--card)">SCHULE</text></g>` +
    K.arrow('M200 270Q250 250 300 270', 'var(--dat)') +
    K.shadow(360) + K.person({ x: 360, s: .85, shirt: 'var(--das)', skin: 1, hair: 'curly', armL: 'wave', face: 'open',
      under: '<rect x="18" y="-128" width="26" height="40" rx="8" fill="var(--die)"/>' }) +
    `<circle cx="438" cy="314" r="14" fill="var(--card)" stroke="var(--ink)" stroke-width="2"/><path d="M426 310q12 6 24 0M432 302q6 10 0 24" stroke="var(--ink)" stroke-width="1.6" fill="none"/>` +
    K.bubble(370, 104, 'Ich komme *aus* der Schule!', { tail: 'c' }),
    'Ein Kind mit Schultasche kommt aus der Schule und läuft nach Hause.'),
  lemmas: { aus: 'aus', vom: 'von', von: 'von' },

  understand: [
    { type: 'cards', title: 'aus oder von?', min: '14rem', items: [
      { t: 'aus + Dativ', k: 'd', icon: 'door-open', p: 'Städte, Länder, Gebäude, Räume – man war <b>drin</b>.', ex: 'Ich komme {e:aus} Kampala / {e:aus der} Schweiz / {e:aus dem} Kino.' },
      { t: 'von + Dativ', k: 'n', icon: 'user-round', p: 'Personen, Plätze, Veranstaltungen – man war <b>bei</b> oder <b>auf</b>.', ex: 'Ich komme {e:vom} Arzt / {e:von} Oma / {e:von der} Party / {e:vom} Markt.' } ] },
    { type: 'grid', title: 'Wohin? – Wo? – Woher?', head: ['', 'Wohin?', 'Wo?', 'Woher?'], rows: [
      ['Gebäude', 'ins Kino', 'im Kino', '{e:aus dem} Kino'], ['Person', 'zum Arzt', 'beim Arzt', '{e:vom} Arzt'],
      ['Stadt, Land', 'nach Berlin', 'in Berlin', '{e:aus} Berlin'], ['Land mit Artikel', 'in die Türkei', 'in der Türkei', '{e:aus der} Türkei'],
      ['Platz', 'auf den Markt', 'auf dem Markt', '{e:vom} Markt'], ['Wasser', 'ans Meer', 'am Meer', '{e:vom} Meer'], ['Zuhause', 'nach Hause', 'zu Hause', '{e:von zu} Hause'] ] },
    { type: 'merk', text: 'in / nach → {e:aus} · zu / bei / auf / an → {e:von}' }
  ],

  examples: [
    'Mein Nachbar kommt {e:aus} Polen.',
    'Wann kommst du {e:aus dem} Büro?',
    'Ich komme gerade {e:vom} Zahnarzt.',
    'Sie kommt spät {e:von der} Party.',
    'Er hat das Gemüse {e:vom} Markt.',
    'Wir kommen {e:aus der} Türkei.',
    'Ich arbeite heute {e:von zu} Hause.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'aus oder von?', instr: 'Wähle die richtige Präposition.',
      items: [
        'Ich komme ((aus|von)) Spanien.', 'Er kommt gerade ((vom|aus dem)) Arzt.', 'Sie kommt ((aus dem|vom)) Kino.', 'Wir kommen ((von der|aus der)) Party.',
        'Kommst du ((vom|aus dem)) Markt?', 'Mein Kollege kommt ((aus der|von der)) Schweiz.', 'Die Kinder kommen ((aus der|von der)) Schule.', 'Ich komme ((von|aus)) meiner Oma.' ] },
    { id: 'u2', type: 'fill', title: 'Wohin? – Wo? – Woher?', instr: 'Ergänze die Präposition mit Artikel.',
      items: [
        'Ich gehe zum Arzt. Ich bin [[beim]] Arzt. Ich komme [[vom]] Arzt.', 'Ich gehe ins Büro. Ich bin [[im]] Büro. Ich komme [[aus dem]] Büro.',
        'Ich fahre nach Wien. Ich bin [[in]] Wien. Ich komme [[aus]] Wien.', 'Ich gehe auf den Markt. Ich bin [[auf dem]] Markt. Ich komme [[vom]] Markt.' ] },
    { id: 'u3', type: 'type', title: 'Woher kommst du?', instr: 'Antworte mit aus oder von.',
      items: [
        { q: 'der Supermarkt', pre: 'Ich komme', end: '.', ok: ['aus dem Supermarkt'] },
        { q: 'mein Bruder', pre: 'Ich komme', end: '.', ok: ['von meinem Bruder'] },
        { q: 'die Arbeit', pre: 'Ich komme', end: '.', ok: ['von der Arbeit'] },
        { q: 'Ghana', pre: 'Ich komme', end: '.', ok: ['aus Ghana'] },
        { q: 'der Strand', pre: 'Ich komme', end: '.', ok: ['vom Strand', 'von dem Strand'] },
        { q: 'das Schwimmbad', pre: 'Ich komme', end: '.', ok: ['aus dem Schwimmbad', 'vom Schwimmbad'] } ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'Tippe die Teile in der richtigen Reihenfolge an.',
      items: [
        { tiles: ['Ich', 'komme', 'gerade', 'vom Arzt'], end: '.', ok: ['Ich komme gerade vom Arzt'] },
        { tiles: ['Woher', 'kommst', 'du'], end: '?', ok: ['Woher kommst du'] },
        { tiles: ['Sie', 'kommt', 'aus der Türkei'], end: '.', ok: ['Sie kommt aus der Türkei'] },
        { tiles: ['Wann', 'kommst', 'du', 'aus dem Büro'], end: '?', ok: ['Wann kommst du aus dem Büro'] },
        { tiles: ['Wir', 'kommen', 'von der Party'], end: '.', ok: ['Wir kommen von der Party'] } ] }
  ],

  speak: { title: 'Woher kommst du?', intro: 'Sag, woher du gerade kommst.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'school', 'die Schule']], say: 'Ich komme {e:aus der} Schule.' },
      { cue: [['x', 'stethoscope', 'der Arzt']], say: 'Ich komme {e:vom} Arzt.' },
      { cue: [['x', 'map-pin', 'Uganda']], say: 'Ich komme {e:aus} Uganda.' },
      { cue: [['x', 'party-popper', 'die Party']], say: 'Ich komme {e:von der} Party.' },
      { cue: [['x', 'clapperboard', 'das Kino']], say: 'Ich komme {e:aus dem} Kino.' },
      { cue: [['x', 'user-round', 'meine Freundin']], say: 'Ich komme {e:von meiner} Freundin.' } ] }
});
