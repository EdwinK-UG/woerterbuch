/* Kapitel 65 – Die vielen Gesichter von werden (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 65, level: 'B1', group: 'Verben 3',
  title: 'Die vielen Gesichter von werden',
  kicker: 'Verb, Futur, Passiv, Konjunktiv',
  intro: '<b>werden</b> hat vier Aufgaben: Allein ist es ein normales Verb (= sich verändern). Mit <b>Infinitiv</b> ist es Futur. Mit <b>Partizip II</b> ist es Passiv. Und <b>würde</b> + Infinitiv ist Konjunktiv II. Schau also immer ans <b>Satzende</b>!',
  hero: 'Sie {v:wird} Ärztin. – Sie {v:wird} {t:studieren}. – Sie {v:wird} {t:gefragt}.',
  art: K => {
    const box = (x, y, t, s, c) => `<g><rect x="${x - 95}" y="${y - 32}" width="190" height="64" rx="14" fill="var(--${c}-s)" stroke="var(--${c})" stroke-width="2.5"/><text x="${x}" y="${y - 5}" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="19" fill="var(--${c})">${t}</text><text x="${x}" y="${y + 18}" text-anchor="middle" font-family="Inter,sans-serif" font-size="12.5" fill="var(--ink)">${s}</text></g>`;
    return K.svg(`<rect width="520" height="360" fill="var(--sky1)"/>` + K.arrow('M230 160L150 100', 'var(--faint)') + K.arrow('M290 160L370 100', 'var(--faint)') + K.arrow('M230 200L150 260', 'var(--faint)') + K.arrow('M290 200L370 260', 'var(--faint)') +
      `<circle cx="260" cy="180" r="58" fill="var(--fg)"/><text x="260" y="188" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="28" fill="var(--bg)">werden</text>` +
      box(120, 70, 'Vollverb', 'Sie wird Ärztin.', 'nom') + box(400, 70, 'Futur', 'Es wird regnen.', 'akk') + box(120, 290, 'Passiv', 'Es wird gebaut.', 'dat') + box(400, 290, 'Konjunktiv II', 'Ich würde gehen.', 'die'),
      'werden in der Mitte, mit vier Pfeilen: Vollverb, Futur, Passiv, Konjunktiv II.');
  },
  lemmas: { wird: 'werden', würde: 'werden', geworden: 'werden', worden: 'werden' },

  understand: [
    { type: 'grid', title: 'Vier Funktionen', head: ['Funktion', 'Satzende', 'Beispiel'], rows: [
      ['Vollverb (sich verändern)', 'Nomen / Adjektiv', 'Sie {v:wird} Ärztin. Es {v:wird} kalt.'],
      ['Futur', '{t:Infinitiv}', 'Es {v:wird} morgen {t:regnen}.'],
      ['Passiv', '{t:Partizip II}', 'Das Haus {v:wird} {t:gebaut}.'],
      ['Konjunktiv II', 'würde + {t:Infinitiv}', 'Ich {v:würde} gern {t:kommen}.'] ] },
    { type: 'grid', title: 'Perfekt: geworden oder worden?', head: ['', 'Beispiel'], rows: [
      ['Vollverb', 'Sie {v:ist} Ärztin {t:geworden}.'], ['Passiv', 'Das Haus {v:ist} {t:gebaut worden}.'] ],
      foot: 'Nur im Passiv heißt es <b>worden</b> (ohne ge-).' },
    { type: 'merk', text: 'Schau ans Satzende: Infinitiv → Futur · Partizip II → Passiv · Nomen/Adjektiv → Vollverb' }
  ],

  examples: [
    'Im Herbst {v:werden} die Blätter gelb.',
    'Mein Bruder {v:wird} Koch.',
    'Wir {v:werden} im Sommer {t:heiraten}.',
    'Die Post {v:wird} um 9 Uhr {t:gebracht}.',
    'Ich {v:würde} gern ein Eis {t:essen}.',
    'Er {v:ist} sehr müde {t:geworden}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welche Funktion?', instr: 'Was ist werden hier?',
      items: [
        'Es wird dunkel. – ((Vollverb|Futur|Passiv))', 'Wir werden morgen fahren. – ((Futur|Passiv|Vollverb))', 'Der Brief wird geschrieben. – ((Passiv|Futur|Vollverb))',
        'Ich würde gern helfen. – ((Konjunktiv II|Futur|Passiv))', 'Sie wird Lehrerin. – ((Vollverb|Passiv|Futur))', 'Das Auto wird repariert. – ((Passiv|Vollverb|Futur))',
        'Du wirst es schaffen. – ((Futur|Passiv|Konjunktiv II))', 'Es würde mich freuen. – ((Konjunktiv II|Vollverb|Futur))' ] },
    { id: 'u2', type: 'choice', title: 'geworden oder worden?', instr: 'Vollverb oder Passiv?',
      items: [
        'Er ist Arzt ((geworden|worden)).', 'Das Haus ist verkauft ((worden|geworden)).', 'Es ist kalt ((geworden|worden)).',
        'Die Tür ist geöffnet ((worden|geworden)).', 'Mein Sohn ist groß ((geworden|worden)).', 'Der Dieb ist gefasst ((worden|geworden)).' ] },
    { id: 'u3', type: 'fill', title: 'Ergänze', instr: 'Schreib werden in der richtigen Form.',
      items: [
        'Es [[wird]] heute noch regnen.', 'Ich [[werde]] im Mai 30 Jahre alt.', 'Hier [[wird]] ein Supermarkt gebaut.',
        'Wir [[würden]] gern mitkommen.', 'Du [[wirst]] immer schöner!', 'Die Kinder [[werden]] von der Schule abgeholt.' ] }
  ],

  speak: { title: 'Viermal werden', intro: 'Bilde den Satz mit werden.', altLabel: 'Weiter',
    items: [
      { cue: [['e', '', 'Vollverb'], ['x', 'stethoscope', 'sie · Ärztin']], say: 'Sie {v:wird} Ärztin.' },
      { cue: [['e', '', 'Futur'], ['x', 'cloud-rain', 'morgen · regnen']], say: 'Morgen {v:wird} es {t:regnen}.' },
      { cue: [['e', '', 'Passiv'], ['x', 'construction', 'Haus · bauen']], say: 'Das Haus {v:wird} {t:gebaut}.' },
      { cue: [['e', '', 'Konjunktiv II'], ['x', 'ice-cream-cone', 'gern · ein Eis essen']], say: 'Ich {v:würde} gern ein Eis {t:essen}.' } ] }
});
