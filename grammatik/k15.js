/* Kapitel 15 – Bestimmter und unbestimmter Artikel (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 15, level: 'A1', group: 'Pronomen, Nomen und Artikel',
  title: 'Bestimmter und unbestimmter Artikel',
  kicker: 'Ein Hund? Der Hund!',
  intro: '<b>ein / eine</b> benutzt du für etwas Neues oder Unbekanntes. <b>der / das / die</b> benutzt du, wenn klar ist, wen oder was du meinst – weil es schon genannt wurde oder weil es nur eins gibt.',
  hero: 'Schau, da ist {e:ein} Hund! – {e:Der} Hund heißt Bello.',
  art: K => K.svg(K.sky() + K.shadow(140) + K.shadow(320, 46) + K.shadow(440) +
    K.person({ x: 140, shirt: 'var(--nom)', skin: 4, hair: 'curly', hc: 'var(--hair3)', armR: 'out', face: 'open' }) +
    K.dog(310, 328) +
    K.person({ x: 440, shirt: 'var(--das)', skin: 1, hair: 'bun', armL: 'chest' }) +
    K.bubble(140, 100, 'Schau, *ein* Hund!', { tail: 'c' }) + K.bubble(420, 120, '*Der* Hund heißt Bello.', { tail: 'r' }),
    'Ein Kind zeigt auf einen Hund: Schau, ein Hund! Die Besitzerin sagt: Der Hund heißt Bello.'),
  lemmas: { Hund: 'Hund', heißt: 'heißen' },

  understand: [
    { type: 'grid', title: 'Die Artikel im Nominativ', head: ['', 'maskulin', 'neutral', 'feminin', 'Plural'], rows: [
      ['bestimmt', '{e:der} Hund', '{e:das} Haus', '{e:die} Katze', '{e:die} Hunde'],
      ['unbestimmt', '{e:ein} Hund', '{e:ein} Haus', '{e:eine} Katze', '– Hunde'] ],
      foot: 'Im Plural gibt es keinen unbestimmten Artikel: ein Hund → Hunde.' },
    { type: 'cards', title: 'Wann welcher Artikel?', min: '13rem', items: [
      { t: 'ein / eine', k: 'n', icon: 'sparkles', p: 'Neu, unbekannt, zum ersten Mal genannt – oder irgendeins.', ex: 'Da ist {e:ein} Hund. Ich brauche {e:einen} Stift.' },
      { t: 'der / das / die', k: 'd', icon: 'pin', p: 'Bekannt, schon genannt – oder es gibt nur eins.', ex: '{e:Der} Hund heißt Bello. {e:Die} Sonne scheint.' },
      { t: 'kein Artikel', k: 'a', icon: 'circle-slash', p: 'Plural (unbestimmt), Mengen ohne Zahl, Berufe, Namen.', ex: 'Ich trinke Kaffee. Sie ist Ärztin. Das ist Paul.' } ] },
    { type: 'merk', text: 'Neu? {e:ein / eine}. Bekannt? {e:der / das / die}.' },
    { type: 'note', title: 'Den Artikel lernen', text: 'Den Artikel kann man nicht immer raten. Lerne jedes Nomen mit Artikel – am besten mit Farbe: der (blau), das (grün), die (rot). Tipps zu Endungen findest du in Kapitel 49.' }
  ],

  examples: [
    'Ich habe {e:eine} Idee!',
    'Wir suchen {e:eine} Wohnung. {e:Die} Wohnung muss groß sein.',
    'Entschuldigung, wo ist {e:der} Bahnhof?',
    'Das ist {e:ein} Tisch. {e:Der} Tisch ist neu.',
    'Ich trinke morgens Tee.',
    'Mein Vater ist Lehrer.',
    '{e:Die} Sonne scheint heute.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'der, das oder die?', instr: 'Wähle den richtigen Artikel.',
      items: [
        '((Der|Die|Das)) Tisch ist neu.', '((Die|Der|Das)) Lampe ist kaputt.', '((Das|Der|Die)) Buch ist spannend.', '((Der|Die|Das)) Stuhl ist bequem.',
        '((Die|Der|Das)) Tasche ist schwer.', '((Das|Der|Die)) Fenster ist offen.', '((Die|Der|Das)) Zeitung ist von heute.', '((Das|Der|Die)) Handy ist teuer.' ] },
    { id: 'u2', type: 'choice', title: 'ein oder eine?', instr: 'Wähle den unbestimmten Artikel.',
      items: [
        'Das ist ((ein|eine)) Auto.', 'Da ist ((eine|ein)) Katze.', 'Da ist ((ein|eine)) Apfel.',
        'Das ist ((eine|ein)) Banane.', 'Hier ist ((ein|eine)) Café.', 'Das ist ((eine|ein)) Uhr.' ] },
    { id: 'u3', type: 'choice', title: 'Neu oder bekannt?', instr: 'Bestimmter oder unbestimmter Artikel?',
      items: [
        'Da ist ((ein|der)) Mann. ((Der|Ein)) Mann ist sehr groß.', 'Ich habe ((eine|die)) Schwester. ((Die|Eine)) Schwester heißt Lea.',
        'Entschuldigung, wo ist ((die|eine)) Toilette?', 'Hier ist ((ein|der)) Brief für dich. ((Der|Ein)) Brief kommt aus Kampala.', '((Die|Eine)) Sonne scheint heute.' ] },
    { id: 'u4', type: 'fill', title: 'Ergänze die Artikel', instr: 'Erst neu, dann bekannt: Schreib die Artikel in die Lücken.',
      items: [
        'Das ist [[ein]] Hund. [[Der]] Hund heißt Bello.', 'Das ist [[eine]] Lampe. [[Die]] Lampe ist modern.', 'Das ist [[ein]] Fahrrad. [[Das]] Fahrrad ist neu.',
        'Das sind Blumen. [[Die]] Blumen sind schön.', 'Das ist [[eine]] Uhr. [[Die]] Uhr ist teuer.', 'Das ist [[ein]] Stuhl. [[Der]] Stuhl ist bequem.' ] }
  ],

  speak: { title: 'Was ist das?', intro: 'Sag zuerst, was du siehst – dann beschreib es.', altLabel: 'Beschreiben',
    items: [
      { cue: [['x', 'table', 'der Tisch · neu']], say: 'Das ist {e:ein} Tisch.', alt: '{e:Der} Tisch ist neu.' },
      { cue: [['x', 'lamp', 'die Lampe · modern']], say: 'Das ist {e:eine} Lampe.', alt: '{e:Die} Lampe ist modern.' },
      { cue: [['x', 'book-open', 'das Buch · spannend']], say: 'Das ist {e:ein} Buch.', alt: '{e:Das} Buch ist spannend.' },
      { cue: [['x', 'cat', 'die Katze · süß']], say: 'Das ist {e:eine} Katze.', alt: '{e:Die} Katze ist süß.' },
      { cue: [['x', 'smartphone', 'das Handy · teuer']], say: 'Das ist {e:ein} Handy.', alt: '{e:Das} Handy ist teuer.' },
      { cue: [['x', 'flower-2', 'die Blumen · schön']], say: 'Das sind Blumen.', alt: '{e:Die} Blumen sind schön.' } ] }
});
