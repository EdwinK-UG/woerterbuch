/* Kapitel 19 – Possessivartikel (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 19, level: 'A1', group: 'Pronomen, Nomen und Artikel',
  title: 'Possessivartikel',
  kicker: 'Ist das dein Hund?',
  intro: 'Possessivartikel zeigen, wem etwas gehört: <b>mein</b> Hund, <b>dein</b> Auto, <b>unsere</b> Stadt. Sie haben die gleichen Endungen wie <b>kein</b>.',
  hero: 'Ist das {e:dein} Hund? – Ja, das ist {e:mein} Hund!',
  art: K => K.svg(K.sky() + K.shadow(120) + K.shadow(296, 46) + K.shadow(410) +
    K.person({ x: 120, shirt: 'var(--nom)', skin: 3, hair: 'short', hc: 'var(--hair2)', armR: 'out', face: 'open' }) +
    K.dog(290, 328, { c: 'var(--nom)' }) + `<path d="M341 222Q336 256 328 284" stroke="var(--die)" stroke-width="3" fill="none"/>` +
    K.person({ x: 410, shirt: 'var(--dat)', skin: 1, hair: 'long', hc: 'var(--hair2)', armL: 'out' }) +
    K.bubble(122, 98, 'Ist das *dein* Hund?', { tail: 'c' }) + K.bubble(404, 120, 'Ja, das ist *mein* Hund!', { tail: 'r' }),
    'Ein Junge fragt: Ist das dein Hund? Die Frau mit der Leine sagt: Ja, das ist mein Hund!'),
  lemmas: { meine: 'mein', meinen: 'mein', meinem: 'mein', meiner: 'mein', deine: 'dein', deinen: 'dein', seine: 'sein', seinen: 'sein', ihre: 'ihr', unsere: 'unser', eure: 'euer', Ihre: 'Ihr' },

  understand: [
    { type: 'grid', title: 'Wem gehört es?', head: ['Person', 'Possessivartikel', 'Beispiel'], rows: [
      ['ich', 'mein', '{e:mein} Handy'], ['du', 'dein', '{e:dein} Handy'], ['er · es', 'sein', '{e:sein} Handy'], ['sie', 'ihr', '{e:ihr} Handy'],
      ['wir', 'unser', '{e:unser} Haus'], ['ihr', 'euer', '{e:euer} Haus'], ['sie (Plural)', 'ihr', '{e:ihr} Haus'], ['Sie', 'Ihr', '{e:Ihr} Haus'] ], hl: [7] },
    { type: 'table', title: 'Die Endungen – wie bei kein', head: ['maskulin', 'neutral', 'feminin', 'Plural'], sets: {
      mein: [['mein Vater', 'mein Kind', 'meine Mutter', 'meine Eltern'], ['meinen Vater', 'mein Kind', 'meine Mutter', 'meine Eltern'], ['meinem Vater', 'meinem Kind', 'meiner Mutter', 'meinen Eltern']],
      unser: [['unser Vater', 'unser Kind', 'unsere Mutter', 'unsere Eltern'], ['unseren Vater', 'unser Kind', 'unsere Mutter', 'unsere Eltern'], ['unserem Vater', 'unserem Kind', 'unserer Mutter', 'unseren Eltern']],
      euer: [['euer Vater', 'euer Kind', 'eure Mutter', 'eure Eltern'], ['euren Vater', 'euer Kind', 'eure Mutter', 'eure Eltern'], ['eurem Vater', 'eurem Kind', 'eurer Mutter', 'euren Eltern']] },
      foot: 'Alle Possessivartikel funktionieren so: dein, sein, ihr, Ihr wie mein. Bei <b>euer</b> fällt das e weg, wenn eine Endung kommt: eu<b>re</b>, eu<b>ren</b>, eu<b>rem</b>.' },
    { type: 'cards', title: 'sein oder ihr?', min: '13rem', items: [
      { t: 'sein', k: 'd', icon: 'user-round', p: 'Der Besitzer ist ein Mann (oder er/es).', ex: 'Paul und {e:seine} Schwester. Das Baby und {e:sein} Bett.' },
      { t: 'ihr', k: 'b', icon: 'user-round', p: 'Die Besitzerin ist eine Frau – oder mehrere Personen.', ex: 'Lea und {e:ihr} Bruder. Die Kinder und {e:ihr} Hund.' } ],
      foot: 'Es kommt auf den Besitzer an, nicht auf die Sache: Paul und seine Schwester – Lea und ihr Bruder.' },
    { type: 'merk', text: 'Possessivartikel = Endungen von kein: {e:kein} Hund – {e:mein} Hund, {e:keine} Katze – {e:meine} Katze.' }
  ],

  examples: [
    'Das ist {e:meine} Schwester Amina.',
    'Wo ist {e:dein} Handy?',
    'Paul besucht {e:seine} Oma.',
    'Lea und {e:ihr} Bruder spielen Tennis.',
    'Wir lieben {e:unsere} Stadt.',
    'Ist das {e:euer} Auto?',
    'Frau Weber, ist das {e:Ihre} Tasche?'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'sein oder ihr?', instr: 'Wem gehört es? Wähle den richtigen Possessivartikel.',
      items: [
        'Tom sucht ((seinen|ihren)) Schlüssel.', 'Anna ruft ((ihre|seine)) Mutter an.', 'Die Kinder spielen mit ((ihrem|seinem)) Hund.',
        'Herr Kato, ist das ((Ihr|ihr|sein)) Koffer?', 'Max und ((seine|ihre)) Freundin gehen ins Kino.', 'Das Baby schläft in ((seinem|ihrem)) Bett.' ] },
    { id: 'u2', type: 'choice', title: 'Die richtige Endung', instr: 'Wähle die richtige Form.',
      items: [
        'Das ist ((mein|meine|meinen)) Vater.', 'Ich besuche ((meine|mein|meiner)) Oma.', 'Hast du ((deinen|dein|deine)) Pass?',
        'Wir fahren mit ((unserem|unser|unseren)) Auto.', 'Wo sind ((eure|euer|euren)) Kinder?', 'Er spricht mit ((seiner|seine|seinen)) Lehrerin.',
        'Ich liebe ((meine|mein|meinen)) Eltern.', 'Ist das ((Ihr|Ihre|Ihren)) Platz?' ] },
    { id: 'u3', type: 'fill', title: 'Ergänze', instr: 'Schreib den passenden Possessivartikel. Die Person steht in Klammern.',
      items: [
        '(ich) Das ist [[mein]] Bruder.', '(du) Ist das [[deine]] Jacke?', '(wir) [[Unser]] Haus ist klein.',
        '(er) Er sucht [[seinen]] Schlüssel.', '(sie) Sie telefoniert mit [[ihrer]] Freundin.', '(ihr) Ist das [[euer]] Hund?' ] },
    { id: 'u4', type: 'type', title: 'Wem gehört das?', instr: 'Schreib, wem es gehört – mit Possessivartikel.',
      items: [
        { q: 'Das Handy gehört Lea.', pre: 'Das ist', end: '.', ok: ['ihr Handy', 'Leas Handy'] },
        { q: 'Der Ball gehört Tom.', pre: 'Das ist', end: '.', ok: ['sein Ball', 'Toms Ball'] },
        { q: 'Das Auto gehört uns.', pre: 'Das ist', end: '.', ok: ['unser Auto'] },
        { q: 'Die Tasche gehört dir.', pre: 'Das ist', end: '.', ok: ['deine Tasche'] },
        { q: 'Die Bücher gehören mir.', pre: 'Das sind', end: '.', ok: ['meine Bücher'] },
        { q: 'Der Hund gehört euch.', pre: 'Das ist', end: '.', ok: ['euer Hund'] } ] }
  ],

  speak: { title: 'Wem gehört das?', intro: 'Sag, wem es gehört. Dann frag nach.', altLabel: 'Frage',
    items: [
      { cue: [['x', 'dog', 'der Hund'], ['n', 'user-round', 'Tom']], say: 'Das ist {e:sein} Hund.', alt: 'Tom, ist das {e:dein} Hund?' },
      { cue: [['x', 'shopping-bag', 'die Tasche'], ['n', 'user-round', 'Lea']], say: 'Das ist {e:ihre} Tasche.', alt: 'Lea, ist das {e:deine} Tasche?' },
      { cue: [['x', 'car', 'das Auto'], ['n', 'users', 'wir']], say: 'Das ist {e:unser} Auto.' },
      { cue: [['x', 'book-open', 'die Bücher'], ['n', 'user-round', 'ich']], say: 'Das sind {e:meine} Bücher.' },
      { cue: [['x', 'house', 'das Haus'], ['n', 'users', 'Herr und Frau Kato']], say: 'Das ist {e:ihr} Haus.', alt: 'Herr Kato, ist das {e:Ihr} Haus?' },
      { cue: [['x', 'bike', 'das Fahrrad'], ['n', 'user-round', 'du']], say: 'Ist das {e:dein} Fahrrad?', alt: 'Ja, das ist {e:mein} Fahrrad.' } ] }
});
