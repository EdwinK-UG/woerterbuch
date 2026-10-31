/* Kapitel 11 – Ja/Nein-Fragen (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 11, level: 'A1', group: 'Sätze und Fragen',
  title: 'Ja/Nein-Fragen',
  kicker: 'Kommst du mit? – Ja, gern!',
  intro: 'Bei Ja/Nein-Fragen steht das <b>Verb auf Position 1</b>, das Subjekt danach. Die Antwort beginnt oft mit <b>ja</b>, <b>nein</b> – oder mit <b>doch</b>, wenn die Frage negativ ist.',
  hero: '{v:Lernst} du Deutsch? – Ja, jeden Tag!',
  art: K => K.svg(K.sky() + K.shadow(166) + K.shadow(370) +
    K.person({ x: 166, shirt: 'var(--nom)', skin: 3, hair: 'curly', hc: 'var(--hair2)', armR: 'out', face: 'open',
      extra: '<circle cx="78" cy="-100" r="14" fill="var(--card)" stroke="var(--ink)" stroke-width="2"/><path d="M66 -104q12 6 24 0M72 -113q6 10 0 26" stroke="var(--ink)" stroke-width="1.6" fill="none"/>' }) +
    K.person({ x: 370, shirt: 'var(--dat)', skin: 1, hair: 'long', hc: 'var(--hair2)', armL: 'wave', armR: 'up' }) +
    K.tag(212, 44, 'ja', 'das') + K.tag(270, 44, 'nein', 'die') + K.tag(338, 44, 'doch', 'der') +
    K.bubble(150, 102, '*Kommst* du mit?', { tail: 'c' }) + K.bubble(380, 124, 'Ja, gern!', { tail: 'c' }),
    'Ein Junge mit Ball fragt: Kommst du mit? Ein Mädchen antwortet: Ja, gern!'),
  lemmas: { Lernst: 'lernen', Wohnst: 'wohnen', Kommst: 'kommen', Sprechen: 'sprechen', Hast: 'haben', Bist: 'sein', Ist: 'sein' },

  understand: [
    { type: 'slots', title: 'Aussage und Frage', rows: [
      [['Er', 'n', 'Position 1'], ['kommt', 'v', 'Position 2'], ['aus Berlin', 'x', '']],
      [['Kommt', 'v', 'Position 1'], ['er', 'n', 'Subjekt'], ['aus Berlin', 'x', '']],
      [['Kannst', 'v', 'Position 1'], ['du', 'n', 'Subjekt'], ['morgen', 'x', ''], ['kommen', 'vt', 'Ende']] ],
      note: 'In der Ja/Nein-Frage tauschen Verb und Subjekt die Plätze. Mit Modalverb oder trennbarem Verb kommt der zweite Teil wie immer ans Ende.' },
    { type: 'cards', title: 'ja, nein oder doch?', min: '13rem', items: [
      { t: 'ja', k: 'ok', s: 'positive Frage → positive Antwort', ex: '{v:Kommst} du? – {e:Ja}, ich komme.' },
      { t: 'nein', k: 'b', s: 'Frage → negative Antwort', ex: '{v:Kommst} du? – {e:Nein}, ich komme nicht.' },
      { t: 'doch', k: 'ac', s: 'negative Frage → positive Antwort', ex: '{v:Kommst} du nicht? – {e:Doch}, ich komme!' } ] },
    { type: 'merk', text: 'Frage mit nicht oder kein – und die Antwort ist positiv? Dann sag {e:doch}!' },
    { type: 'note', title: 'Die Melodie', text: 'Bei Ja/Nein-Fragen geht die Stimme am Ende nach oben ↗: Kommst du mit? ↗ – Bei W-Fragen geht sie meist nach unten ↘: Wo wohnst du? ↘ Hör dir die Beispiele an!' }
  ],

  examples: [
    '{v:Wohnst} du hier? – Ja, schon seit zwei Jahren.',
    '{v:Sprechen} Sie Englisch? – Nein, leider nicht.',
    '{v:Hast} du keinen Hunger? – {e:Doch}, großen Hunger!',
    '{v:Ist} das dein Fahrrad? – Ja, das ist meins.',
    '{v:Kommt} ihr morgen? – Nein, wir haben keine Zeit.',
    '{v:Kannst} du mir {t:helfen}? – Ja, klar.',
    '{v:Bist} du nicht müde? – {e:Doch}, ein bisschen.'
  ],

  exercises: [
    { id: 'u1', type: 'order', title: 'Fragen bauen', instr: 'Das Verb steht auf Position 1. Tippe die Teile in der richtigen Reihenfolge an.',
      items: [
        { tiles: ['Wohnst', 'du', 'in Hamburg'], end: '?', ok: ['Wohnst du in Hamburg'] },
        { tiles: ['Sprechen', 'Sie', 'Französisch'], end: '?', ok: ['Sprechen Sie Französisch'] },
        { tiles: ['Hast', 'du', 'heute', 'Zeit'], end: '?', ok: ['Hast du heute Zeit'] },
        { tiles: ['Kommt', 'Paula', 'auch'], end: '?', ok: ['Kommt Paula auch'] },
        { tiles: ['Trinkt', 'ihr', 'gern', 'Kaffee'], end: '?', ok: ['Trinkt ihr gern Kaffee'] },
        { tiles: ['Kannst', 'du', 'gut', 'schwimmen'], end: '?', ok: ['Kannst du gut schwimmen'] } ] },
    { id: 'u2', type: 'choice', title: 'ja, nein oder doch?', instr: 'Wähle die passende Antwort.',
      items: [
        'Kommst du heute? – ((Ja|Doch)), ich komme um sechs.', 'Hast du keine Zeit? – ((Doch|Ja)), ich habe Zeit.',
        'Ist das deine Tasche? – ((Nein|Doch)), das ist nicht meine Tasche.', 'Bist du nicht müde? – ((Doch|Ja)), sehr müde.',
        'Trinkst du keinen Kaffee? – ((Nein|Doch)), ich trinke nur Tee.', 'Sprichst du Deutsch? – ((Ja|Doch)), ein bisschen.',
        'Wohnt ihr nicht in Köln? – ((Doch|Ja)), wir wohnen in Köln.', 'Hast du Geschwister? – ((Nein|Doch)), ich bin Einzelkind.' ] },
    { id: 'u3', type: 'type', title: 'Aus der Aussage wird eine Frage', instr: 'Schreib die Ja/Nein-Frage.',
      items: [
        { q: 'Du wohnst in Berlin.', pre: '', end: '?', ok: ['Wohnst du in Berlin'] },
        { q: 'Er spricht Englisch.', pre: '', end: '?', ok: ['Spricht er Englisch'] },
        { q: 'Ihr habt Hunger.', pre: '', end: '?', ok: ['Habt ihr Hunger'] },
        { q: 'Sie kommen aus Polen.', pre: '', end: '?', ok: ['Kommen Sie aus Polen'] },
        { q: 'Du kannst Auto fahren.', pre: '', end: '?', ok: ['Kannst du Auto fahren'] },
        { q: 'Der Zug kommt pünktlich an.', pre: '', end: '?', ok: ['Kommt der Zug pünktlich an'] } ] },
    { id: 'u4', type: 'choice', title: 'W-Frage oder Ja/Nein-Frage?', instr: 'Welche Frage passt zur Antwort?',
      items: [
        '((Wohnst du in Berlin?|Wo wohnst du?)) – Ja, in Berlin.', '((Wo wohnst du?|Wohnst du in Berlin?)) – In Berlin.',
        '((Hast du Kinder?|Wie viele Kinder hast du?)) – Nein.', '((Wie viele Kinder hast du?|Hast du Kinder?)) – Zwei.',
        '((Kommst du nicht mit?|Kommst du mit?)) – Doch, natürlich!', '((Was trinkst du?|Trinkst du Tee?)) – Wasser, bitte.' ] }
  ],

  speak: { title: 'Frag und antworte', intro: 'Stell die Frage – dann gib eine Antwort.', altLabel: 'Antwort',
    items: [
      { cue: [['n', 'user-round', 'du'], ['x', 'clock', 'heute Zeit haben']], say: '{v:Hast} du heute Zeit?', alt: 'Ja, ich habe Zeit.' },
      { cue: [['n', 'user-round', 'Sie'], ['x', 'languages', 'Englisch sprechen']], say: '{v:Sprechen} Sie Englisch?', alt: 'Ja, ein bisschen.' },
      { cue: [['n', 'users', 'ihr'], ['x', 'footprints', 'mitkommen']], say: '{v:Kommt} ihr {t:mit}?', alt: 'Nein, wir haben leider keine Zeit.' },
      { cue: [['n', 'user-round', 'du'], ['b', 'moon', 'nicht müde sein']], say: '{v:Bist} du nicht müde?', alt: '{e:Doch}, sehr!' },
      { cue: [['n', 'user-round', 'du'], ['x', 'waves', 'schwimmen können']], say: '{v:Kannst} du {t:schwimmen}?', alt: 'Ja, sehr gut.' },
      { cue: [['n', 'user-round', 'du'], ['b', 'utensils', 'keinen Hunger haben']], say: '{v:Hast} du keinen Hunger?', alt: '{e:Doch}, großen Hunger!' } ] }
});
