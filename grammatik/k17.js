/* Kapitel 17 – Der Akkusativ (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 17, level: 'A1', group: 'Pronomen, Nomen und Artikel',
  title: 'Der Akkusativ',
  kicker: 'Die Katze sieht den Vogel.',
  intro: 'Viele Verben haben ein <b>Objekt</b>: Wen oder was sieht die Katze? Dieses Objekt steht im <b>Akkusativ</b>. Die gute Nachricht: Nur bei <b>maskulinen</b> Nomen ändert sich der Artikel – der wird zu <b>den</b>, ein zu <b>einen</b>.',
  hero: '{n:Die Katze} sieht {a:den Vogel}.',
  art: K => K.svg(K.sky() + K.tree(420, 300, 1.05) +
    `<path d="M400 168q-60 -6 -110 4" stroke="var(--wood)" stroke-width="8" stroke-linecap="round"/>` + K.bird(318, 156, 'var(--akk)') +
    K.shadow(170, 40) + K.cat(170, 326, { s: 1.35 }) +
    K.arrow('M190 226Q250 170 296 162', 'var(--faint)') +
    K.tag(170, 168, 'Wer? die Katze', 'nom') + K.tag(318, 112, 'Wen? den Vogel', 'akk'),
    'Eine Katze sitzt unter einem Baum und sieht einen Vogel auf dem Ast.'),
  lemmas: { sieht: 'sehen', Vogel: 'Vogel', brauche: 'brauchen', besuchen: 'besuchen', kauft: 'kaufen', sucht: 'suchen', kenne: 'kennen' },

  understand: [
    { type: 'cards', title: 'Subjekt und Objekt', min: '14rem', items: [
      { t: 'Wer?', k: 'n', icon: 'user-round', s: 'Nominativ · Subjekt', p: 'Wer macht etwas?', ex: '{n:Die Katze} sieht …' },
      { t: 'Wen? Was?', k: 'a', icon: 'target', s: 'Akkusativ · Objekt', p: 'Wen oder was sieht sie?', ex: '… {a:den Vogel}.' } ],
      foot: 'Tipp: Frag nach dem Satzteil. Wer sieht? – die Katze. Wen sieht sie? – den Vogel.' },
    { type: 'table', title: 'Nominativ und Akkusativ', head: ['maskulin', 'neutral', 'feminin', 'Plural'], sets: {
      der: [['der Hund', 'das Pferd', 'die Katze', 'die Vögel'], ['den Hund', 'das Pferd', 'die Katze', 'die Vögel']],
      ein: [['ein Hund', 'ein Pferd', 'eine Katze', '– Vögel'], ['einen Hund', 'ein Pferd', 'eine Katze', '– Vögel']],
      kein: [['kein Hund', 'kein Pferd', 'keine Katze', 'keine Vögel'], ['keinen Hund', 'kein Pferd', 'keine Katze', 'keine Vögel']],
      mein: [['mein Hund', 'mein Pferd', 'meine Katze', 'meine Vögel'], ['meinen Hund', 'mein Pferd', 'meine Katze', 'meine Vögel']] },
      foot: 'Nur maskulin ändert sich: <b>der → den, ein → einen, kein → keinen, mein → meinen</b>. Neutral, feminin und Plural bleiben gleich.' },
    { type: 'verbs', title: 'Verben mit Akkusativ', pattern: 'jemanden / etwas (Akkusativ) …', items: [
      ['haben', 'Ich habe {a:einen Bruder}.'], ['brauchen', 'Wir brauchen {a:einen Tisch}.'], ['kaufen', 'Sie kauft {a:den Rock}.'],
      ['sehen', 'Siehst du {a:den Bus}?'], ['suchen', 'Ich suche {a:meinen Schlüssel}.'], ['finden', 'Er findet {a:den Film} gut.'],
      ['essen', 'Ich esse {a:einen Apfel}.'], ['trinken', 'Trinkst du {a:einen Tee}?'], ['besuchen', 'Wir besuchen {a:unseren Opa}.'],
      ['kennen', 'Kennst du {a:den Mann}?'], ['nehmen', 'Ich nehme {a:den Salat}.'], ['es gibt', 'Hier gibt es {a:einen Park}.'] ] },
    { type: 'merk', text: 'Nur maskulin ändert sich: {a:den}, {a:einen}, {a:keinen}, {a:meinen}.' },
    { type: 'note', title: 'Das Objekt auf Position 1', text: 'Der Akkusativ kann auch vorne stehen. Der Artikel zeigt, wer was macht: {a:Den Hund} sieht {n:die Katze}. (Die Katze sieht den Hund.)' }
  ],

  examples: [
    '{n:Ich} brauche {a:einen Stift}.',
    '{n:Wir} besuchen {a:den Zoo}.',
    'Hast {n:du} {a:einen Bruder}?',
    '{n:Paul} kauft {a:eine Jacke}.',
    '{n:Sie} sucht {a:ihren Schlüssel}.',
    '{a:Den Film} kenne {n:ich} schon.',
    'Im Park gibt {n:es} {a:einen Spielplatz}.'
  ],

  exercises: [
    { id: 'u1', type: 'cases', title: 'Subjekt oder Objekt?', instr: 'Tippe auf jeden markierten Satzteil, bis die richtige Farbe erscheint: Nominativ oder Akkusativ.',
      items: [
        '{n:Der Mann} kauft {a:einen Hut}.', '{n:Ich} suche {a:den Bahnhof}.', '{a:Den Kuchen} isst {n:das Kind}.',
        '{n:Meine Schwester} hat {a:einen Hund}.', 'Brauchst {n:du} {a:das Auto}?', '{a:Einen Kaffee} möchte {n:ich}, bitte.' ] },
    { id: 'u2', type: 'choice', title: 'Welcher Artikel?', instr: 'Wähle die richtige Form.',
      items: [
        'Ich habe ((einen|ein|eine)) Bruder.', 'Wir kaufen ((den|der|dem)) Tisch.', 'Er trinkt ((einen|ein)) Tee.', 'Sie sucht ((die|den)) Tasche.',
        'Ich sehe ((das|den)) Auto.', 'Kennst du ((den|der)) Mann dort?', 'Wir brauchen ((einen|ein)) Kühlschrank.', 'Es gibt hier ((einen|ein)) Supermarkt.' ] },
    { id: 'u3', type: 'fill', title: 'Ergänze', instr: 'Schreib das Wort in Klammern im Akkusativ.',
      items: [
        '(ein) Ich esse [[einen]] Apfel.', '(der) Siehst du [[den]] Bus?', '(kein) Er hat [[keinen]] Hunger.',
        '(eine) Wir suchen [[eine]] Wohnung.', '(das) Ich nehme [[das]] Zimmer.', '(der) Kennst du [[den]] Lehrer?' ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'Tippe die Teile in der richtigen Reihenfolge an.',
      items: [
        { tiles: ['Ich', 'brauche', 'einen Stift'], end: '.', ok: ['Ich brauche einen Stift'] },
        { tiles: ['Wir', 'besuchen', 'am Sonntag', 'den Zoo'], end: '.', ok: ['Wir besuchen am Sonntag den Zoo', 'Wir besuchen den Zoo am Sonntag'] },
        { tiles: ['Den Film', 'kenne', 'ich', 'schon'], end: '.', ok: ['Den Film kenne ich schon'] },
        { tiles: ['Hast', 'du', 'einen Bruder'], end: '?', ok: ['Hast du einen Bruder'] },
        { tiles: ['Paul', 'kauft', 'eine Jacke'], end: '.', ok: ['Paul kauft eine Jacke'] } ] }
  ],

  speak: { title: 'Sag es mit Akkusativ', intro: 'Bilde den Satz. Achte auf maskuline Nomen!', altLabel: 'Weiter',
    items: [
      { cue: [['n', 'user-round', 'ich'], ['v', '', 'brauchen'], ['a', 'pencil', 'ein Stift (m)']], say: 'Ich brauche {a:einen Stift}.' },
      { cue: [['n', 'user-round', 'du'], ['v', '', 'haben'], ['a', 'dog', 'ein Hund (m) ?']], say: 'Hast du {a:einen Hund}?', alt: 'Nein, ich habe {a:keinen Hund}.' },
      { cue: [['n', 'users', 'wir'], ['v', '', 'suchen'], ['a', 'train-front', 'der Bahnhof']], say: 'Wir suchen {a:den Bahnhof}.' },
      { cue: [['n', 'user-round', 'er'], ['v', '', 'kaufen'], ['a', 'shirt', 'eine Jacke']], say: 'Er kauft {a:eine Jacke}.' },
      { cue: [['n', 'user-round', 'ich'], ['v', '', 'sehen'], ['a', 'car', 'das Auto']], say: 'Ich sehe {a:das Auto}.' },
      { cue: [['n', 'user-round', 'sie'], ['v', '', 'trinken'], ['a', 'coffee', 'ein Kaffee (m)']], say: 'Sie trinkt {a:einen Kaffee}.' } ] }
});
