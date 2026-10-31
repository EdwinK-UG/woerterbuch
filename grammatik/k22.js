/* Kapitel 22 – Verben mit Dativ und Akkusativ (A2). Eigene Texte, Beispiele und Übungen.
   Schreibweise: {n:…} Nominativ, {d:…} Dativ, {a:…} Akkusativ, ((richtig|falsch|falsch)) Lücke zum Auswählen. */
GRAM.add({
  n: 22, level: 'A2', group: 'Pronomen, Nomen und Artikel',
  title: 'Verben mit Dativ und Akkusativ',
  kicker: 'Wem gibst du was?',
  intro: 'Bei Verben wie <b>geben</b>, <b>schenken</b> oder <b>zeigen</b> bekommt eine Person etwas. Die Person steht im <span class="cs d">Dativ</span>, die Sache im <span class="cs a">Akkusativ</span>.',
  hero: '{n:Der Opa} schenkt {d:dem Enkel} {a:einen Drachen}.',
  art: 'kite',
  lemmas: { schenkt: 'schenken', Enkel: 'Enkel', Drachen: 'Drachen', gibt: 'geben', gib: 'geben', gebe: 'geben', Gib: 'geben',
    empfiehlt: 'empfehlen', empfehle: 'empfehlen', Leihst: 'leihen', leihe: 'leihen', Kindern: 'Kind', Gästen: 'Gast', Freunden: 'Freund',
    Schülern: 'Schüler', Nachbarn: 'Nachbar', Patienten: 'Patient', Kannst: 'können', Zeig: 'zeigen', Schreib: 'schreiben', Sag: 'sagen',
    Großeltern: 'Großeltern', Oma: 'Oma', Opa: 'Opa' },

  understand: [
    { type: 'q3', title: 'Drei Fragen – drei Fälle', items: [
      { k: 'n', q: 'Wer?', c: 'Nominativ', icon: 'user-round', t: 'Wer macht etwas? Das ist das Subjekt.', ex: '{n:Der Opa} schenkt …' },
      { k: 'd', q: 'Wem?', c: 'Dativ', icon: 'hand-heart', t: 'Wer bekommt etwas? Meistens eine Person.', ex: '… {d:dem Enkel} …' },
      { k: 'a', q: 'Was?', c: 'Akkusativ', icon: 'gift', t: 'Was bekommt die Person? Meistens eine Sache.', ex: '… {a:einen Drachen}.' } ] },

    { type: 'slots', title: 'So ist der Satz gebaut', rows: [
      [['Der Opa', 'n', 'Position 1'], ['schenkt', 'v', 'Position 2'], ['dem Enkel', 'd', 'Wem?'], ['einen Drachen', 'a', 'Was?']],
      [['Heute', 'x', 'Position 1'], ['schenkt', 'v', 'Position 2'], ['der Opa', 'n', 'Wer?'], ['dem Enkel', 'd', 'Wem?'], ['einen Drachen', 'a', 'Was?']] ],
      note: 'Das Verb steht immer auf <b>Position 2</b>. Zwei Nomen: erst die Person im Dativ, dann die Sache im Akkusativ.' },

    { type: 'table', title: 'Die Artikel im Überblick', head: ['maskulin', 'neutral', 'feminin', 'Plural'], sets: {
      der:  [['der Opa', 'das Kind', 'die Oma', 'die Kinder'], ['den Opa', 'das Kind', 'die Oma', 'die Kinder'], ['dem Opa', 'dem Kind', 'der Oma', 'den Kinder+n']],
      ein:  [['ein Opa', 'ein Kind', 'eine Oma', '– Kinder'], ['einen Opa', 'ein Kind', 'eine Oma', '– Kinder'], ['einem Opa', 'einem Kind', 'einer Oma', '– Kinder+n']],
      kein: [['kein Opa', 'kein Kind', 'keine Oma', 'keine Kinder'], ['keinen Opa', 'kein Kind', 'keine Oma', 'keine Kinder'], ['keinem Opa', 'keinem Kind', 'keiner Oma', 'keinen Kinder+n']],
      mein: [['mein Opa', 'mein Kind', 'meine Oma', 'meine Kinder'], ['meinen Opa', 'mein Kind', 'meine Oma', 'meine Kinder'], ['meinem Opa', 'meinem Kind', 'meiner Oma', 'meinen Kinder+n']] },
      foot: 'Im Dativ Plural bekommt das Nomen ein <b>-n</b>: den Kinder<b class="plusn">n</b>, den Freunde<b class="plusn">n</b>. Kein -n bei Nomen auf -s (den Autos) und bei Nomen, die schon auf -n enden (den Frauen). Wie <i>mein</i> gehen auch dein, sein, ihr, unser, euer.' },

    { type: 'merk', text: 'Person vor Sache: Ich gebe {d:dem Kind} {a:den Ball}.' },

    { type: 'machine', title: 'Mit Pronomen ändert sich die Reihenfolge',
      intro: 'Tippe auf die Schalter und ersetze die Nomen durch Pronomen.',
      start: 'Ich gebe', d: ['dem Kind', 'ihm'], a: ['den Ball', 'ihn'], end: '.',
      rules: { nn: 'Zwei Nomen: erst der Dativ (Person), dann der Akkusativ (Sache).',
               pn: 'Ein Pronomen steht vor einem Nomen. Hier passt das zur normalen Reihenfolge.',
               np: 'Ein Pronomen steht vor einem Nomen – jetzt kommt also der Akkusativ zuerst!',
               pp: 'Zwei Pronomen: erst Akkusativ, dann Dativ. Merke: „Gib es mir!“' } },

    { type: 'verbs', title: 'Diese Verben brauchen oft Dativ und Akkusativ', pattern: 'jemandem (Dativ) etwas (Akkusativ) …', items: [
      ['geben', 'Gib {d:mir} bitte {a:den Zucker}.'], ['schenken', 'Was schenkst du {d:deiner Mutter}?'],
      ['bringen', 'Ich bringe {d:dir} {a:einen Tee}.'], ['zeigen', 'Zeig {d:mir} {a:deine Fotos}!'],
      ['schicken', 'Er schickt {d:seiner Freundin} {a:eine Nachricht}.'], ['schreiben', 'Schreib {d:mir} {a:eine Karte}!'],
      ['erklären', 'Kannst du {d:mir} {a:die Aufgabe} erklären?'], ['erzählen', 'Opa erzählt {d:den Kindern} {a:eine Geschichte}.'],
      ['empfehlen', 'Ich empfehle {d:Ihnen} {a:die Suppe}.'], ['leihen', 'Leihst du {d:mir} {a:deinen Stift}?'],
      ['kaufen', 'Wir kaufen {d:dem Baby} {a:einen Teddy}.'], ['wünschen', 'Ich wünsche {d:dir} {a:alles Gute}.'] ] },

    { type: 'note', title: 'Gut zu wissen', text: 'Ein Dativ ohne Präposition ist fast immer eine Person – oder ein Tier: Ich gebe {d:dem Hund} {a:Wasser}. Die Sache steht fast immer im Akkusativ.' }
  ],

  examples: [
    '{n:Ich} schreibe {d:meiner Schwester} {a:eine Nachricht}.',
    'Kannst {n:du} {d:mir} {a:das Salz} geben?',
    '{n:Die Ärztin} erklärt {d:dem Patienten} {a:die Therapie}.',
    '{n:Wir} zeigen {d:unseren Freunden} {a:die Altstadt}.',
    'Zum Geburtstag kauft {n:Jonas} {d:seiner Mutter} {a:einen Blumenstrauß}.',
    '– Leihst {n:du} {d:mir} {a:dein Fahrrad}?',
    '– Klar, {n:ich} leihe {a:es} {d:dir}.'
  ],

  exercises: [
    { id: 'u1', type: 'cases', title: 'Wer? Wem? Was?',
      instr: 'Tippe auf jeden markierten Satzteil, bis die richtige Farbe erscheint: Nominativ, Dativ oder Akkusativ.',
      items: [
        '{n:Die Lehrerin} gibt {d:den Schülern} {a:die Hausaufgaben}.',
        '{n:Mein Bruder} schickt {d:mir} {a:eine Postkarte}.',
        'Heute zeigt {n:der Chef} {d:der neuen Kollegin} {a:das Büro}.',
        '{a:Den Schlüssel} gebe {n:ich} {d:dir} morgen.',
        '{a:Was} empfiehlst {n:du} {d:deinem Freund}?',
        '{d:Dem Hund} bringt {n:das Kind} {a:einen Stock}.' ] },

    { id: 'u2', type: 'choice', title: 'Welcher Artikel passt?',
      instr: 'Wähle in jeder Lücke die richtige Form.',
      items: [
        'Ich schenke ((meinem|meinen|meiner)) Vater ((einen|einem|ein)) Pullover.',
        'Die Oma erzählt ((den|dem|die)) Kindern ((eine|einer|einen)) Geschichte.',
        'Kannst du ((der|die|dem)) Kollegin ((das|dem|den)) Dokument schicken?',
        'Wir kaufen ((unserem|unseren|unser)) Sohn ((ein|einen|einem)) Fahrrad.',
        'Der Verkäufer zeigt ((der|die|dem)) Kundin ((die|den|der)) Schuhe.',
        'Gib ((dem|den|das)) Baby bitte ((die|der|dem)) Flasche!',
        'Ich leihe ((meiner|meine|meinem)) Freundin ((meinen|meinem|mein)) Regenschirm.',
        'Wer erklärt ((der|die|dem)) neuen Studentin ((den|dem|der)) Weg?' ] },

    { id: 'u3', type: 'order', title: 'Sätze bauen',
      instr: 'Tippe die Teile in der richtigen Reihenfolge an. Der große Anfangsbuchstabe zeigt dir den Satzanfang.',
      items: [
        { tiles: ['Ich', 'zeige', 'dir', 'die Fotos'], end: '.', ok: ['Ich zeige dir die Fotos'] },
        { tiles: ['Die Großeltern', 'schicken', 'ihrer Enkelin', 'ein Paket'], end: '.', ok: ['Die Großeltern schicken ihrer Enkelin ein Paket'] },
        { tiles: ['Morgen', 'bringe', 'ich', 'dir', 'das Buch'], end: '.', ok: ['Morgen bringe ich dir das Buch'] },
        { tiles: ['Ich', 'gebe', 'es', 'dir', 'morgen', 'zurück'], end: '.', ok: ['Ich gebe es dir morgen zurück'] },
        { tiles: ['Kannst', 'du', 'mir', 'den Weg', 'erklären'], end: '?', ok: ['Kannst du mir den Weg erklären'] },
        { tiles: ['Wem', 'hast', 'du', 'die Blumen', 'geschenkt'], end: '?', ok: ['Wem hast du die Blumen geschenkt'] } ] },

    { id: 'u4', type: 'type', title: 'Nomen → Pronomen',
      instr: 'Ersetze die markierten Satzteile durch Pronomen und schreib den Satz zu Ende. Achte auf die Reihenfolge!',
      items: [
        { q: 'Ich gebe [dem Kind] den Ball.', pre: 'Ich gebe', end: '.', ok: ['ihm den Ball'] },
        { q: 'Ich gebe dem Kind [den Ball].', pre: 'Ich gebe', end: '.', ok: ['ihn dem Kind'] },
        { q: 'Ich gebe [dem Kind] [den Ball].', pre: 'Ich gebe', end: '.', ok: ['ihn ihm'] },
        { q: 'Sie schenkt [ihrer Schwester] [die Kette].', pre: 'Sie schenkt', end: '.', ok: ['sie ihr'] },
        { q: 'Wir zeigen [den Gästen] [das Zimmer].', pre: 'Wir zeigen', end: '.', ok: ['es ihnen'] },
        { q: 'Bringst du [mir] [den Kaffee]?', pre: 'Bringst du', end: '?', ok: ['ihn mir'] } ] },

    { id: 'u5', type: 'free', title: 'Dein eigener Satz', graded: false,
      instr: 'Schreib eigene Sätze. Die automatische Prüfung findet viele Fehler, aber nicht alle – diese Übung zählt deshalb nicht für die Note.',
      verbs: ['geb', 'gib', 'gab', 'schenk', 'kauf', 'bring', 'brach', 'zeig', 'schick', 'schreib', 'schrieb', 'erklär', 'erzähl', 'empf', 'leih', 'lieh', 'sag', 'wünsch', 'biet', 'bot'],
      items: [
        { q: 'Was schenkst du deiner Mutter oder deinem Vater zum Geburtstag?', ph: 'Ich schenke …' },
        { q: 'Was leihst du einem Freund oder einer Freundin gern?', ph: 'Ich leihe …' },
        { q: 'Was zeigst du einem Gast in deiner Stadt?', ph: 'Ich zeige …' } ] }
  ],

  speak: { title: 'Wer schenkt wem was?', intro: 'Sag den Satz laut. Dann prüf dich mit der Lösung – und versuch es danach mit Pronomen.',
    items: [
      { who: 'Anna', whom: 'ihr Bruder', what: 'ein Buch', icon: 'book-open', say: '{n:Anna} schenkt {d:ihrem Bruder} {a:ein Buch}.', pron: '{n:Anna} schenkt {a:es} {d:ihm}.' },
      { who: 'Tom', whom: 'seine Freundin', what: 'Blumen', icon: 'flower-2', say: '{n:Tom} schenkt {d:seiner Freundin} {a:Blumen}.', pron: '{n:Tom} schenkt {a:sie} {d:ihr}.' },
      { who: 'ich', whom: 'mein Vater', what: 'eine Uhr', icon: 'watch', say: '{n:Ich} schenke {d:meinem Vater} {a:eine Uhr}.', pron: '{n:Ich} schenke {a:sie} {d:ihm}.' },
      { who: 'wir', whom: 'die Kinder', what: 'ein Fahrrad', icon: 'bike', say: '{n:Wir} schenken {d:den Kindern} {a:ein Fahrrad}.', pron: '{n:Wir} schenken {a:es} {d:ihnen}.' },
      { who: 'du', whom: 'deine Oma', what: 'ein Regenschirm', icon: 'umbrella', say: '{n:Du} schenkst {d:deiner Oma} {a:einen Regenschirm}.', pron: '{n:Du} schenkst {a:ihn} {d:ihr}.' },
      { who: 'Lea und Max', whom: 'ihre Lehrerin', what: 'eine Karte', icon: 'mail', say: '{n:Lea und Max} schenken {d:ihrer Lehrerin} {a:eine Karte}.', pron: '{n:Sie} schenken {a:sie} {d:ihr}.' } ] }
});
