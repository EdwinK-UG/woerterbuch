/* Kapitel 1 – Personalpronomen (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 1, level: 'A1', group: 'Verben 1',
  title: 'Personalpronomen',
  kicker: 'Ich, du, er, sie, es …',
  intro: 'Personalpronomen stehen für Personen und Dinge: <b>ich</b> spreche, <b>du</b> hörst zu, <b>er</b> oder <b>sie</b> lacht. Mit <b>Sie</b> sprichst du höflich mit Erwachsenen, die du nicht gut kennst.',
  hero: '{e:Ich} bin Amara. Und wie heißt {e:du}?',
  art: K => K.svg(K.sky() + K.shadow(150) + K.shadow(372) + K.shadow(280, 62, 289) +
    K.person({ x: 232, y: 288, s: .6, shirt: 'var(--der)', skin: 3, hair: 'short', hc: 'var(--hair3)', beard: 'var(--hair3)' }) +
    K.person({ x: 284, y: 288, s: .6, shirt: 'var(--die)', dress: 'var(--die)', skin: 2, hair: 'long', armL: 'hold' }) +
    K.person({ x: 326, y: 288, s: .4, shirt: 'var(--das)', skin: 3, hair: 'curly', armR: 'up' }) +
    K.person({ x: 150, shirt: 'var(--nom)', skin: 1, hair: 'curly', armR: 'chest', face: 'open' }) +
    K.person({ x: 372, shirt: 'var(--akk)', skin: 4, hair: 'short', hc: 'var(--hair3)', armL: 'wave' }) +
    K.tag(226, 152, 'er', 'der') + K.tag(290, 152, 'sie', 'die') + K.tag(326, 198, 'es', 'das') + K.bubble(160, 92, '*Ich* bin Amara. Und *du*?', { tail: 'l' }) + K.bubble(388, 112, '*Ich* bin Jonas.', { tail: 'c' }),
    'Amara und Jonas stellen sich vor. Im Hintergrund: ein Mann, eine Frau und ein Kind.'),
  lemmas: { heißt: 'heißen', bin: 'sein', Ich: 'ich', Er: 'er', Sie: 'Sie', Es: 'es', Wir: 'wir' },

  understand: [
    { type: 'cards', title: 'Singular: eine Person', min: '10.5rem', items: [
      { t: 'ich', k: 'n', s: '1. Person', p: 'Die Person, die spricht.', ex: '{e:Ich} heiße Amara.' },
      { t: 'du', k: 'ac', s: '2. Person', p: 'Die Person, mit der ich spreche – in der Familie, mit Freunden, mit Kindern.', ex: 'Wo wohnst {e:du}?' },
      { t: 'er', k: 'd', s: '3. Person', p: 'Ein Mann – oder ein Nomen mit <b>der</b>.', ex: 'Der Tisch ist neu. {e:Er} ist schön.' },
      { t: 'sie', k: 'b', s: '3. Person', p: 'Eine Frau – oder ein Nomen mit <b>die</b>.', ex: 'Die Lampe ist alt. {e:Sie} ist kaputt.' },
      { t: 'es', k: 'ok', s: '3. Person', p: 'Ein Kind – oder ein Nomen mit <b>das</b>.', ex: 'Das Handy ist teuer. {e:Es} ist neu.' } ] },
    { type: 'cards', title: 'Plural: mehrere Personen', min: '10.5rem', items: [
      { t: 'wir', k: 'n', s: '1. Person', p: 'Ich und andere Personen.', ex: '{e:Wir} lernen Deutsch.' },
      { t: 'ihr', k: 'ac', s: '2. Person', p: 'Du und andere: mehrere Freunde, Kinder, Familie.', ex: 'Kommt {e:ihr} heute?' },
      { t: 'sie', k: 'b', s: '3. Person', p: 'Mehrere Personen oder Dinge.', ex: 'Lisa und Tom? {e:Sie} spielen Fußball.' },
      { t: 'Sie', k: 'f', s: 'höflich', p: 'Eine oder mehrere Personen, höflich. Immer groß geschrieben!', ex: 'Woher kommen {e:Sie}?' } ] },
    { type: 'grid', title: 'Alle Pronomen auf einen Blick', head: ['Person', 'Singular', 'Plural'], rows: [
      ['1. Person', 'ich', 'wir'], ['2. Person', 'du', 'ihr'], ['3. Person', 'er · sie · es', 'sie'], ['höflich', 'Sie', 'Sie'] ], hl: [3],
      foot: '<b>Sie</b> ist für eine Person und für mehrere Personen gleich: „Frau Weber, kommen Sie?“ – „Herr und Frau Weber, kommen Sie?“' },
    { type: 'cards', title: 'du oder Sie?', min: '14rem', items: [
      { t: 'du', k: 'ac', icon: 'smile', p: 'Familie, Freunde, Kinder, oft auch junge Leute untereinander und Kollegen, die sich gut kennen.', ex: 'Hallo Jonas, wie geht es {e:dir}?' },
      { t: 'Sie', k: 'f', icon: 'briefcase', p: 'Erwachsene, die du nicht gut kennst: im Geschäft, im Büro, beim Arzt, auf dem Amt.', ex: 'Guten Tag, Frau Kato. Wie geht es {e:Ihnen}?' } ],
      foot: 'Unsicher? Dann nimm <b>Sie</b>. Die andere Person sagt dir, wenn du „du“ sagen darfst: „Wir können uns duzen.“' },
    { type: 'merk', text: '{e:Sie} groß = höflich. {e:sie} klein = eine Frau oder mehrere Personen.' },
    { type: 'note', title: 'Auch Dinge sind er, sie oder es', text: 'Das Pronomen richtet sich nach dem Artikel, nicht nach der Person: der Löffel → {e:er}, die Gabel → {e:sie}, das Messer → {e:es}. Und: das Mädchen → {e:es}!' }
  ],

  examples: [
    'Das ist Herr Okello. {e:Er} kommt aus Kampala.',
    'Das ist Frau Weber. {e:Sie} wohnt in Köln.',
    '{e:Wir} lernen Deutsch. Und {e:ihr}?',
    'Lisa und Tom sind Freunde. {e:Sie} spielen zusammen Fußball.',
    'Entschuldigung, sprechen {e:Sie} Englisch?',
    'Wo ist das Buch? – {e:Es} liegt auf dem Tisch.',
    'Mama, hast {e:du} meine Jacke gesehen?'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welches Pronomen passt?', instr: 'Wähle das richtige Pronomen.',
      items: [
        'Das ist Paul. ((Er|Sie|Es)) ist Lehrer.',
        'Das ist Maria. ((Sie|Er|Es)) kommt aus Spanien.',
        'Das Baby ist müde. ((Es|Er|Sie)) schläft.',
        'Anna und ich spielen Tennis. ((Wir|Ihr|Sie)) spielen jeden Samstag.',
        'Max und Lena, woher kommt ((ihr|wir|sie))?',
        'Herr Braun, wohnen ((Sie|du|ihr)) in Berlin?',
        'Der Kaffee ist heiß. ((Er|Sie|Es)) ist zu heiß!',
        'Die Kinder sind im Park. ((Sie|Wir|Ihr)) spielen Fußball.' ] },
    { id: 'u2', type: 'choice', title: 'du oder Sie?', instr: 'Wer spricht mit wem? Wähle du oder Sie.',
      items: [
        'Ein Kind fragt seinen Freund: „Hast ((du|Sie)) heute Zeit?“',
        'Im Büro fragt eine Frau ihren Chef: „Haben ((Sie|du)) einen Moment Zeit?“',
        'Eine Mutter fragt ihre Tochter: „Kommst ((du|Sie)) zum Essen?“',
        'An der Hotelrezeption: „Wie ist Ihr Name? Wie heißen ((Sie|du))?“',
        'Zwei Studenten in der Mensa: „Wie heißt ((du|Sie)) eigentlich?“',
        'In der Apotheke: „Guten Tag! Was möchten ((Sie|du))?“' ] },
    { id: 'u3', type: 'fill', title: 'Nomen → Pronomen', instr: 'Schreib das passende Pronomen in die Lücke.',
      items: [
        'Der Bus ist pünktlich. [[Er]] kommt um acht.',
        'Die Tasche ist neu. [[Sie]] ist blau.',
        'Das Auto ist alt. [[Es]] fährt langsam.',
        'Die Äpfel sind rot. [[Sie]] sind lecker.',
        'Mein Bruder und ich – [[wir]] wohnen in Hamburg.',
        'Der Tee ist kalt. [[Er]] schmeckt nicht.' ] },
    { id: 'u4', type: 'fill', title: 'Fragen und Antworten', instr: 'Ergänze das Pronomen in der Antwort.',
      items: [
        'Kommst du aus Berlin? – Ja, [[ich]] komme aus Berlin.',
        'Wohnt ihr in Köln? – Ja, [[wir]] wohnen in Köln.',
        'Kommt Paula heute? – Ja, [[sie]] kommt um sechs.',
        'Wo ist der Schlüssel? – [[Er]] ist in der Tasche.',
        'Sprechen Sie Deutsch? – Ja, [[ich]] spreche ein bisschen Deutsch.',
        'Wo sind Tim und Jan? – [[Sie]] sind in der Schule.' ] }
  ],

  speak: { title: 'Wer ist das?', intro: 'Stell die Person vor. Sag den Satz laut, dann prüf dich mit der Lösung.', altLabel: 'Frage',
    items: [
      { cue: [['n', 'user-round', 'Frau Kato'], ['x', 'map-pin', 'Tokio']], say: 'Das ist Frau Kato. {e:Sie} kommt aus Tokio.', alt: 'Woher kommen {e:Sie}, Frau Kato?' },
      { cue: [['n', 'user-round', 'Herr Silva'], ['x', 'map-pin', 'Lissabon']], say: 'Das ist Herr Silva. {e:Er} kommt aus Lissabon.', alt: 'Woher kommen {e:Sie}, Herr Silva?' },
      { cue: [['n', 'users', 'Mia und Ben'], ['x', 'map-pin', 'Wien']], say: 'Das sind Mia und Ben. {e:Sie} kommen aus Wien.', alt: 'Woher kommt {e:ihr}?' },
      { cue: [['n', 'baby', 'das Baby'], ['x', 'moon', 'schlafen']], say: 'Das ist das Baby. {e:Es} schläft.' },
      { cue: [['n', 'user-round', 'ich'], ['x', 'map-pin', 'Uganda']], say: '{e:Ich} komme aus Uganda.', alt: 'Und {e:du}? Woher kommst {e:du}?' },
      { cue: [['n', 'users', 'ich + Lea'], ['x', 'book-open', 'Deutsch lernen']], say: '{e:Wir} lernen Deutsch.', alt: 'Lernt {e:ihr} auch Deutsch?' } ] }
});
