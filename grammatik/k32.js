/* Kapitel 32 – Zeitangaben (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 32, level: 'A1', group: 'Präpositionen 1',
  title: 'Zeitangaben',
  kicker: 'um acht, am Montag, im Mai',
  intro: 'Für Zeitangaben brauchst du vor allem drei Präpositionen: <b>um</b> für die Uhrzeit, <b>am</b> für Tage und Tageszeiten, <b>im</b> für Monate und Jahreszeiten. Dazu kommen von … bis, vor, nach, seit und ab.',
  hero: '{e:Am} Montag {e:um} acht beginnt der Kurs – {e:im} Mai ist er fertig.',
  art: K => {
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    let cal = `<rect x="56" y="58" width="250" height="236" rx="16" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><rect x="56" y="58" width="250" height="52" rx="16" fill="var(--die)"/><rect x="56" y="94" width="250" height="16" fill="var(--die)"/>
<text x="181" y="93" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="26" fill="var(--card)">Mai</text>
${[100, 150, 210, 260].map(x => `<rect x="${x}" y="44" width="8" height="26" rx="4" fill="var(--ink)"/>`).join('')}`;
    days.forEach((d, i) => { cal += `<text x="${80 + i * 34}" y="134" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="var(--mut)">${d}</text>`; });
    for (let k = 0; k < 31; k++) { const c = (k + 3) % 7, r = Math.floor((k + 3) / 7); if (r > 4) continue; const x = 80 + c * 34, y = 162 + r * 28;
      cal += k === 11 ? `<circle cx="${x}" cy="${y - 5}" r="13" fill="none" stroke="var(--akk)" stroke-width="3"/><text x="${x}" y="${y}" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="800" fill="var(--akk)">${k + 1}</text>`
        : `<text x="${x}" y="${y}" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" fill="var(--ink)">${k + 1}</text>`; }
    const clock = `<circle cx="408" cy="150" r="70" fill="var(--card)" stroke="var(--ink)" stroke-width="6"/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<circle cx="${408 + Math.sin(a) * 56}" cy="${150 - Math.cos(a) * 56}" r="${i % 3 ? 2.5 : 4.5}" fill="var(--ink)"/>`; }).join('')}
<path d="M408 150V104" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/><path d="M408 150L372 130" stroke="var(--nom)" stroke-width="7" stroke-linecap="round"/><circle cx="408" cy="150" r="6" fill="var(--ink)"/>`;
    return K.svg(`<rect width="520" height="360" fill="var(--sky1)"/>` + cal + clock + K.tag(181, 322, 'am Montag', 'akk') + K.tag(408, 252, 'um acht', 'nom') + K.tag(408, 300, 'im Mai', 'die'),
      'Ein Kalenderblatt Mai mit einem markierten Montag und eine Uhr, die acht Uhr zeigt.');
  },
  lemmas: { um: 'um', am: 'an', im: 'in' },

  understand: [
    { type: 'grid', title: 'um, am, im', head: ['', 'wofür?', 'Beispiele'], rows: [
      ['{e:um}', 'Uhrzeit', 'um 8 Uhr · um halb neun · um Mitternacht'],
      ['{e:am}', 'Tage · Datum · Tageszeiten', 'am Montag · am Wochenende · am 3. Mai · am Morgen · am Abend'],
      ['{e:im}', 'Monate · Jahreszeiten', 'im Mai · im Sommer · im Winter'],
      ['–', 'Jahre', '2025 · im Jahr 2025 (nicht: in 2025)'] ], label: false },
    { type: 'cards', title: 'Weitere Zeit-Präpositionen', min: '12rem', items: [
      { t: 'von … bis', k: 'ac', ex: 'Ich arbeite {e:von} 9 {e:bis} 17 Uhr.' },
      { t: 'vor', k: 'n', ex: '{e:Vor} dem Essen wasche ich mir die Hände.' },
      { t: 'nach', k: 'n', ex: '{e:Nach} der Arbeit gehe ich joggen.' },
      { t: 'seit', k: 'd', ex: 'Ich wohne {e:seit} einem Jahr hier.' },
      { t: 'ab', k: 'a', ex: '{e:Ab} Montag habe ich Urlaub.' },
      { t: 'bis', k: 'a', ex: 'Ich warte {e:bis} morgen.' } ] },
    { type: 'note', title: 'Vorsicht: die Nacht', text: 'am Morgen, am Mittag, am Abend – aber: {e:in der} Nacht.' },
    { type: 'merk', text: '{e:um} – Uhr · {e:am} – Tag · {e:im} – Monat und Jahreszeit' }
  ],

  examples: [
    'Der Film beginnt {e:um} acht Uhr.',
    '{e:Am} Wochenende schlafe ich lange.',
    '{e:Im} Sommer fahren wir ans Meer.',
    'Ich arbeite {e:von} Montag {e:bis} Freitag.',
    '{e:Am} Abend lese ich gern.',
    'Mein Bruder ist 1998 geboren.',
    '{e:Nach} dem Essen trinken wir Tee.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'um, am oder im?', instr: 'Wähle die richtige Präposition.',
      items: [
        'Ich stehe ((um|am|im)) 7 Uhr auf.', 'Wir treffen uns ((am|um|im)) Dienstag.', '((Im|Am|Um)) Juli ist es heiß.', '((Im|Am|Um)) Winter fahren wir Ski.',
        '((Am|Im|Um)) Abend sehe ich fern.', 'Ich schlafe ((in der|am|im)) Nacht.', 'Weihnachten ist ((am|im|um)) 24. Dezember.', 'Der Bus kommt ((um|am|im)) halb zehn.' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze', instr: 'Schreib die passende Präposition.',
      items: [
        'Wir haben [[am]] Freitag frei.', 'Das Konzert beginnt [[um]] 20 Uhr.', '[[Im]] Herbst regnet es oft.',
        'Ich arbeite [[von]] 9 [[bis]] 17 Uhr.', 'Mein Geburtstag ist [[am]] 3. März.', 'Ich wohne [[seit]] zwei Jahren in Köln.' ] },
    { id: 'u3', type: 'order', title: 'Sätze bauen', instr: 'Tippe die Teile in der richtigen Reihenfolge an.',
      items: [
        { tiles: ['Am Montag', 'gehe', 'ich', 'zum Deutschkurs'], end: '.', ok: ['Am Montag gehe ich zum Deutschkurs'] },
        { tiles: ['Der Kurs', 'beginnt', 'um neun Uhr'], end: '.', ok: ['Der Kurs beginnt um neun Uhr'] },
        { tiles: ['Im Sommer', 'ist', 'es', 'heiß'], end: '.', ok: ['Im Sommer ist es heiß'] },
        { tiles: ['Ich', 'arbeite', 'von Montag', 'bis Freitag'], end: '.', ok: ['Ich arbeite von Montag bis Freitag'] },
        { tiles: ['Nach dem Essen', 'trinken', 'wir', 'Tee'], end: '.', ok: ['Nach dem Essen trinken wir Tee'] } ] },
    { id: 'u4', type: 'type', title: 'Wann?', instr: 'Antworte mit der Information in Klammern.',
      items: [
        { q: 'Wann beginnt der Film? (20 Uhr)', pre: 'Der Film beginnt', end: '.', ok: ['um 20 Uhr', 'um zwanzig Uhr', 'um acht Uhr'] },
        { q: 'Wann hast du Geburtstag? (Mai)', pre: 'Ich habe', end: '.', ok: ['im Mai Geburtstag'] },
        { q: 'Wann gehst du joggen? (Morgen)', pre: 'Ich gehe', end: '.', ok: ['am Morgen joggen'] },
        { q: 'Wann fahrt ihr in Urlaub? (Sommer)', pre: 'Wir fahren', end: '.', ok: ['im Sommer in Urlaub'] },
        { q: 'Wann kommt Paul? (Freitag)', pre: 'Paul kommt', end: '.', ok: ['am Freitag'] },
        { q: 'Wie lange arbeitest du? (8 bis 16 Uhr)', pre: 'Ich arbeite', end: '.', ok: ['von 8 bis 16 Uhr', 'von acht bis sechzehn Uhr'] } ] }
  ],

  speak: { title: 'Wann?', intro: 'Sag die Zeitangabe mit der richtigen Präposition.', altLabel: 'Im Satz',
    items: [
      { cue: [['x', 'clock', '7:00']], say: '{e:um} sieben Uhr', alt: 'Ich stehe {e:um} sieben Uhr auf.' },
      { cue: [['x', 'calendar', 'Samstag']], say: '{e:am} Samstag', alt: '{e:Am} Samstag gehe ich einkaufen.' },
      { cue: [['x', 'sun', 'Sommer']], say: '{e:im} Sommer', alt: '{e:Im} Sommer ist es warm.' },
      { cue: [['x', 'calendar-days', 'Dezember']], say: '{e:im} Dezember', alt: '{e:Im} Dezember ist Weihnachten.' },
      { cue: [['x', 'sunset', 'Abend']], say: '{e:am} Abend', alt: '{e:Am} Abend koche ich.' },
      { cue: [['x', 'moon', 'Nacht']], say: '{e:in der} Nacht', alt: '{e:In der} Nacht schlafe ich.' } ] }
});
