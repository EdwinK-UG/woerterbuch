/* Kapitel 41 – Ordinalzahlen und Datum (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 41, level: 'A2', group: 'Adjektive 1',
  title: 'Ordinalzahlen und Datum',
  kicker: 'der erste, der zweite, der dritte …',
  intro: 'Mit Ordinalzahlen sagst du die Reihenfolge und das Datum: der <b>erste</b>, der <b>zweite</b> … Bis 19 hängst du <b>-te</b> an die Zahl, ab 20 <b>-ste</b>. Geschrieben: eine Zahl mit Punkt – 3. = dritte.',
  hero: 'Mein Geburtstag ist {e:am dritten} März.',
  art: K => K.svg(K.room() + K.table(240, 250, 240) +
    `<rect x="170" y="196" width="140" height="54" rx="8" fill="var(--die)"/><rect x="180" y="166" width="120" height="34" rx="8" fill="var(--card)"/><path d="M180 186q15 10 30 0t30 0t30 0t30 0" stroke="var(--die)" stroke-width="5" fill="none"/>
${[210, 240, 270].map(x => `<rect x="${x - 3}" y="140" width="6" height="28" rx="2" fill="var(--akk)"/><path d="M${x} 126q8 8 0 14q-8 -6 0 -14z" fill="var(--sun)"/>`).join('')}
<g transform="translate(406 154) rotate(6)"><rect x="-50" y="-58" width="100" height="116" rx="10" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><rect x="-50" y="-58" width="100" height="30" rx="10" fill="var(--der)"/><rect x="-50" y="-38" width="100" height="10" fill="var(--der)"/>
<text y="-36" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" font-weight="800" fill="var(--card)">MÄRZ</text><text y="34" text-anchor="middle" font-family="Fraunces,serif" font-size="56" font-weight="700" fill="var(--ink)">3.</text></g>` +
    K.tag(240, 92, 'am dritten März', 'die'),
    'Ein Geburtstagskuchen mit drei Kerzen und ein Kalenderblatt: 3. März.'),
  lemmas: { dritten: 'dritte', ersten: 'erste', zweiten: 'zweite' },

  understand: [
    { type: 'grid', title: 'Die Ordinalzahlen', head: ['Zahl', 'Ordinalzahl', 'Zahl', 'Ordinalzahl'], rows: [
      ['1.', 'der {e:erste}', '11.', 'der elf{e:te}'], ['2.', 'der zwei{e:te}', '12.', 'der zwölf{e:te}'], ['3.', 'der {e:dritte}', '19.', 'der neunzehn{e:te}'],
      ['4.', 'der vier{e:te}', '20.', 'der zwanzig{e:ste}'], ['5.', 'der fünf{e:te}', '21.', 'der einundzwanzig{e:ste}'], ['7.', 'der {e:siebte}', '30.', 'der dreißig{e:ste}'],
      ['8.', 'der {e:achte}', '31.', 'der einunddreißig{e:ste}'] ],
      foot: 'Unregelmäßig: <b>erste, dritte, siebte, achte</b>. 2–19: -te · ab 20: -ste.' },
    { type: 'grid', title: 'Das Datum', head: ['Frage', 'Antwort', 'geschrieben'], rows: [
      ['Welcher Tag ist heute?', 'Heute ist {e:der dritte} Mai.', 'der 3. Mai'],
      ['Der Wievielte ist heute?', 'Heute ist {e:der dritte}.', '3.5. / 03.05.'],
      ['Wann hast du Geburtstag?', '{e:Am dritten} Mai.', 'am 3. Mai'] ] },
    { type: 'note', title: 'Endungen wie beim Adjektiv', text: 'Ordinalzahlen haben Adjektivendungen: der erst{e:e} Tag · am erst{e:en} Tag · im zweit{e:en} Stock · mein dritt{e:es} Kind.' },
    { type: 'merk', text: 'Wann? → {e:am} …{e:ten}: am ersten, am dritten, am zwanzigsten.' }
  ],

  examples: [
    'Heute ist der {e:zweite} Oktober.',
    'Wir wohnen im {e:vierten} Stock.',
    'Mein Geburtstag ist am {e:siebten} Juli.',
    'Das ist mein {e:erstes} Konzert!',
    'Der Kurs beginnt am {e:ersten} September.',
    'Weihnachten ist am {e:fünfundzwanzigsten} Dezember.',
    'Sie ist die {e:dritte} Person in der Reihe.'
  ],

  exercises: [
    { id: 'u1', type: 'fill', title: 'Ordinalzahlen schreiben', instr: 'Schreib die Ordinalzahl als Wort.',
      items: [
        '1. → der [[erste]]', '3. → der [[dritte]]', '7. → der [[siebte]]', '8. → der [[achte]]',
        '10. → der [[zehnte]]', '20. → der [[zwanzigste]]', '21. → der [[einundzwanzigste]]', '16. → der [[sechzehnte]]' ] },
    { id: 'u2', type: 'choice', title: 'der oder am?', instr: 'Wähle die richtige Form.',
      items: [
        'Heute ist ((der erste|am ersten)) Mai.', 'Ich habe ((am ersten|der erste)) Mai frei.', 'Wann hast du Geburtstag? – ((Am zwölften|Der zwölfte)) Juni.',
        'Der Wievielte ist heute? – ((Der zwölfte|Am zwölften)).', 'Wir wohnen im ((dritten|dritte|dritter)) Stock.', 'Das ist mein ((erstes|erste|ersten)) Kind.' ] },
    { id: 'u3', type: 'type', title: 'Wann ist das?', instr: 'Antworte mit am + Ordinalzahl (als Wort).',
      items: [
        { q: 'Wann ist Weihnachten? (24.12.)', pre: 'Am', end: ' Dezember.', ok: ['vierundzwanzigsten'] },
        { q: 'Wann ist Neujahr? (1.1.)', pre: 'Am', end: ' Januar.', ok: ['ersten'] },
        { q: 'Wann hast du Geburtstag? (3.3.)', pre: 'Am', end: ' März.', ok: ['dritten'] },
        { q: 'Wann beginnt der Kurs? (7.9.)', pre: 'Am', end: ' September.', ok: ['siebten'] },
        { q: 'Wann ist die Party? (20.6.)', pre: 'Am', end: ' Juni.', ok: ['zwanzigsten'] },
        { q: 'Wann fliegst du? (8.8.)', pre: 'Am', end: ' August.', ok: ['achten'] } ] },
    { id: 'u4', type: 'fill', title: 'Endungen', instr: 'Schreib die Ordinalzahl mit der richtigen Endung.',
      items: [
        '(2.) Er wohnt im [[zweiten]] Stock.', '(1.) Das ist mein [[erster]] Tag hier.', '(3.) Wir sehen uns am [[dritten]] Mai.',
        '(1.) Der [[erste]] Januar ist ein Feiertag.', '(10.) Heute ist mein [[zehnter]] Geburtstag.', '(4.) Das ist das [[vierte]] Kapitel.' ] }
  ],

  speak: { title: 'Daten sagen', intro: 'Sag das Datum laut.', altLabel: 'Wann?',
    items: [
      { cue: [['x', 'calendar', '1.5.']], say: 'Heute ist der {e:erste} Mai.', alt: 'Am {e:ersten} Mai.' },
      { cue: [['x', 'calendar', '3.10.']], say: 'Heute ist der {e:dritte} Oktober.', alt: 'Am {e:dritten} Oktober.' },
      { cue: [['x', 'calendar', '7.7.']], say: 'Heute ist der {e:siebte} Juli.', alt: 'Am {e:siebten} Juli.' },
      { cue: [['x', 'calendar', '20.2.']], say: 'Heute ist der {e:zwanzigste} Februar.', alt: 'Am {e:zwanzigsten} Februar.' },
      { cue: [['x', 'cake', 'dein Geburtstag']], say: 'Mein Geburtstag ist am …', alt: 'Wann hast du Geburtstag?' },
      { cue: [['x', 'building', '4. Stock']], say: 'Ich wohne im {e:vierten} Stock.' } ] }
});
