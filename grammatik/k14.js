/* Kapitel 14 – Plural der Nomen (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 14, level: 'A1', group: 'Pronomen, Nomen und Artikel',
  title: 'Plural der Nomen',
  kicker: 'Ein Apfel, zwei Äpfel …',
  intro: 'Im Plural ist der Artikel immer <b>die</b>. Die Nomen bekommen verschiedene Endungen: <b>-(e)n, -e, -er, -s</b> oder keine Endung – oft auch einen Umlaut (a → ä, o → ö, u → ü).',
  hero: 'Ein Apfel, zwei {e:Äpfel} und drei {e:Bananen}, bitte!',
  art: K => K.svg(K.room(false) +
    `<g>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${40 + i * 56} 70h56v34q-28 16-56 0z" fill="${i % 2 ? 'var(--card)' : 'var(--die)'}"/>`).join('')}<rect x="40" y="62" width="448" height="10" rx="4" fill="var(--wood)"/><rect x="58" y="72" width="8" height="170" fill="var(--wood)"/><rect x="462" y="72" width="8" height="170" fill="var(--wood)"/></g>` +
    K.shadow(330, 40) + K.person({ x: 330, y: 300, shirt: 'var(--akk)', apron: 'var(--card)', skin: 3, hair: 'short', hc: 'var(--hair2)', armL: 'front', face: 'open' }) +
    K.table(300, 238, 300) + K.apples(196, 238, 5) + K.bananas(286, 238) + K.oranges(370, 238) +
    K.shadow(96) + K.person({ x: 96, shirt: 'var(--dat)', skin: 1, hair: 'long', hc: 'var(--hair2)', armR: 'front' }) +
    K.bubble(120, 132, 'Drei *Bananen*, bitte!', { tail: 'l' }) + K.bubble(352, 108, 'Und zwei *Äpfel*?', { tail: 'c' }),
    'Am Marktstand: Eine Kundin möchte drei Bananen. Der Verkäufer fragt: Und zwei Äpfel?'),
  lemmas: { Äpfel: 'Apfel', Bananen: 'Banane', Brüder: 'Bruder', Kinder: 'Kind', Bücher: 'Buch', Freundinnen: 'Freundin', Autos: 'Auto', Hunde: 'Hund' },

  understand: [
    { type: 'cards', title: 'Die fünf Plural-Endungen', min: '12rem', items: [
      { t: '-(e)n', k: 'n', s: 'oft feminin', ex: 'die Lampe → die Lampe{e:n} · die Frau → die Frau{e:en}', p: 'Fast alle Nomen auf -e, -ung, -heit, -keit, -in. Vorsicht: die Freundin → die Freundin{e:nen}.' },
      { t: '-e', k: 'd', s: 'oft maskulin', ex: 'der Tag → die Tag{e:e} · der Stuhl → die St{e:ü}hl{e:e}', p: 'Oft mit Umlaut.' },
      { t: '-er', k: 'a', s: 'oft neutral', ex: 'das Kind → die Kind{e:er} · das Buch → die B{e:ü}ch{e:er}', p: 'Mit Umlaut, wenn möglich.' },
      { t: '-s', k: 'ac', s: 'Fremdwörter', ex: 'das Auto → die Auto{e:s} · das Handy → die Handy{e:s}', p: 'Auch Nomen auf -a, -i, -o, -u.' },
      { t: '– (keine Endung)', k: 'w', s: 'auf -er, -el, -en', ex: 'der Lehrer → die Lehrer · der Apfel → die {e:Ä}pfel', p: 'Manchmal nur ein Umlaut.' } ] },
    { type: 'grid', title: 'Der Artikel im Plural', head: ['', 'Singular', 'Plural'], rows: [
      ['bestimmt', 'der Tisch · das Bild · die Lampe', '{e:die} Tische · {e:die} Bilder · {e:die} Lampen'],
      ['unbestimmt', 'ein Tisch · eine Lampe', 'Tische · Lampen (kein Artikel)'],
      ['negativ', 'kein Tisch · keine Lampe', '{e:keine} Tische · {e:keine} Lampen'] ] },
    { type: 'merk', text: 'Lerne jedes Nomen mit Artikel und Plural: der Tisch, die Tisch{e:e}.' },
    { type: 'note', title: 'Nur Singular oder nur Plural', text: 'Manche Nomen gibt es nur im Singular: die Milch, das Geld, der Zucker. Andere nur im Plural: die Leute, die Eltern, die Ferien.' }
  ],

  examples: [
    'Ich habe zwei {e:Brüder} und eine Schwester.',
    'Die {e:Kinder} spielen im Garten.',
    'Wie viele {e:Äpfel} möchten Sie?',
    'Im Regal stehen viele {e:Bücher}.',
    'Meine {e:Freundinnen} kommen heute Abend.',
    'Die {e:Autos} parken vor dem Haus.',
    'Meine Eltern haben zwei {e:Hunde}.'
  ],

  exercises: [
    { id: 'u1', type: 'fill', title: 'Wie heißt der Plural?', instr: 'Schreib das Nomen im Plural.',
      items: [
        'das Buch → die [[Bücher]]', 'die Lampe → die [[Lampen]]', 'der Tag → die [[Tage]]', 'das Auto → die [[Autos]]',
        'der Lehrer → die [[Lehrer]]', 'die Freundin → die [[Freundinnen]]', 'das Kind → die [[Kinder]]', 'der Stuhl → die [[Stühle]]' ] },
    { id: 'u2', type: 'choice', title: 'Welche Form ist richtig?', instr: 'Wähle die richtige Pluralform.',
      items: [
        'Ich kaufe drei ((Äpfel|Apfels|Äpfeln)).', 'Wir haben zwei ((Katzen|Katze|Katzes)).', 'In der Klasse sind 20 ((Studenten|Student|Studente)).',
        'Die ((Handys|Handyen|Handye)) sind teuer.', 'Wie viele ((Zimmer|Zimmers|Zimmern)) hat die Wohnung?', 'Ich brauche zwei ((Tassen|Tasse|Tasses)).',
        'Die ((Häuser|Hause|Hausen)) in der Altstadt sind alt.', 'Viele ((Leute|Leuten|Leutes)) warten auf den Bus.' ] },
    { id: 'u3', type: 'choice', title: 'Singular oder Plural?', instr: 'Wähle den passenden Artikel oder die passende Form.',
      items: [
        '((Die|Der)) Kinder spielen.', 'Wo sind ((die|das)) Bücher?', '((Der|Die)) Lehrer ist sehr nett.',
        '((Die|Der)) Lehrer sind sehr nett.', 'Ich habe ((keine|kein)) Geschwister.', 'Ich esse gern ((Bananen|Banane)).' ] },
    { id: 'u4', type: 'fill', title: 'Im Satz', instr: 'Schreib das Nomen in Klammern im Plural.',
      items: [
        '(die Tomate) Ich kaufe ein Kilo [[Tomaten]].', '(der Freund) Am Samstag kommen meine [[Freunde]].', '(das Bild) An der Wand hängen viele [[Bilder]].',
        '(die Idee) Du hast immer gute [[Ideen]].', '(das Foto) Zeig mir deine [[Fotos]]!', '(der Schlüssel) Wo sind meine [[Schlüssel]]?' ] }
  ],

  speak: { title: 'Am Markt', intro: 'Sag die Zahl und das Nomen im Plural. Dann bestell!', altLabel: 'Bestellen',
    items: [
      { cue: [['x', 'apple', '3 × der Apfel']], say: 'drei {e:Äpfel}', alt: 'Ich möchte drei {e:Äpfel}, bitte.' },
      { cue: [['x', 'banana', '6 × die Banane']], say: 'sechs {e:Bananen}', alt: 'Sechs {e:Bananen}, bitte!' },
      { cue: [['x', 'book-open', '2 × das Buch']], say: 'zwei {e:Bücher}', alt: 'Ich lese zwei {e:Bücher}.' },
      { cue: [['x', 'baby', '4 × das Kind']], say: 'vier {e:Kinder}', alt: 'Sie hat vier {e:Kinder}.' },
      { cue: [['x', 'car', '2 × das Auto']], say: 'zwei {e:Autos}', alt: 'Wir haben zwei {e:Autos}.' },
      { cue: [['x', 'users', '3 × die Freundin']], say: 'drei {e:Freundinnen}', alt: 'Meine drei {e:Freundinnen} kommen.' } ] }
});
