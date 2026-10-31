/* Kapitel 4 – Verben mit Vokalwechsel (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 4, level: 'A1', group: 'Verben 1',
  title: 'Verben mit Vokalwechsel',
  kicker: 'Ich fahre – du fährst.',
  intro: 'Manche Verben ändern im Präsens ihren Vokal – aber nur bei <b>du</b> und <b>er/sie/es</b>: <b>e → i</b> (geben → du gibst), <b>e → ie</b> (lesen → du liest), <b>a → ä</b> (fahren → du fährst).',
  hero: '{e:Fährst} du Rad? – Ja, ich {e:fahre} jeden Tag.',
  art: K => K.svg(K.street() + K.bus(124, 322) + K.stop(250, 288) + K.shadow(298, 40, 330) + K.shadow(440, 70, 330) +
    K.person({ x: 298, shirt: 'var(--der)', skin: 3, hair: 'long', hc: 'var(--hair2)', armL: 'hip', face: 'open' }) +
    K.person({ x: 470, shirt: 'var(--dat)', skin: 1, hair: 'curly', armL: 'out' }) + K.bike(404, 330) +
    K.bubble(290, 100, '*Fährst* du Rad?', { tail: 'c' }) + K.bubble(420, 140, 'Ja, ich *fahre* Rad!', { tail: 'r' }),
    'An der Bushaltestelle: Eine Frau fragt: Fährst du Rad? Ein Mann mit Fahrrad sagt: Ja, ich fahre Rad!'),
  lemmas: { Fährst: 'fahren', fahre: 'fahren', Rad: 'Rad' },

  understand: [
    { type: 'cards', title: 'Drei Gruppen', min: '14rem', items: [
      { t: 'e → i', k: 'n', p: 'du g<b>i</b>bst, er g<b>i</b>bt', ws: ['essen', 'geben', 'helfen', 'nehmen', 'sprechen', 'treffen', 'vergessen'] },
      { t: 'e → ie', k: 'd', p: 'du l<b>ie</b>st, er l<b>ie</b>st', ws: ['lesen', 'sehen', 'empfehlen'] },
      { t: 'a → ä', k: 'a', p: 'du f<b>ä</b>hrst, er f<b>ä</b>hrt', ws: ['fahren', 'schlafen', 'tragen', 'waschen', 'laufen', 'halten'] } ],
      foot: 'Auch <b>au → äu</b>: laufen → du l<b>äu</b>fst. Tippe auf ein Verb, um es im Wörterbuch zu sehen.' },
    { type: 'conj', title: 'Die Formen', intro: 'Achte auf du und er/sie/es.', verbs: {
      essen: { f: ['esse', '{e:isst}', '{e:isst}', 'essen', 'esst', 'essen'], n: 'du isst – nur ein <b>-t</b>, weil der Stamm auf -ss endet.' },
      nehmen: { f: ['nehme', 'n{e:imm}st', 'n{e:imm}t', 'nehmen', 'nehmt', 'nehmen'], n: 'nehmen ändert noch mehr: du n<b>imm</b>st, er n<b>imm</b>t.' },
      sprechen: { f: ['spreche', 'spr{e:i}chst', 'spr{e:i}cht', 'sprechen', 'sprecht', 'sprechen'] },
      lesen: { f: ['lese', 'l{e:ie}st', 'l{e:ie}st', 'lesen', 'lest', 'lesen'], n: 'du liest = er liest: gleiche Form.' },
      sehen: { f: ['sehe', 's{e:ie}hst', 's{e:ie}ht', 'sehen', 'seht', 'sehen'] },
      fahren: { f: ['fahre', 'f{e:ä}hrst', 'f{e:ä}hrt', 'fahren', 'fahrt', 'fahren'] },
      schlafen: { f: ['schlafe', 'schl{e:ä}fst', 'schl{e:ä}ft', 'schlafen', 'schlaft', 'schlafen'] },
      laufen: { f: ['laufe', 'l{e:äu}fst', 'l{e:äu}ft', 'laufen', 'lauft', 'laufen'] } } },
    { type: 'merk', text: 'Vokalwechsel nur bei {e:du} und {e:er/sie/es}. Ich esse, wir essen, ihr esst – ganz normal.' },
    { type: 'note', title: 'Wie finde ich das heraus?', text: 'Ob ein Verb den Vokal ändert, siehst du nicht am Infinitiv. Lerne die du-Form gleich mit: fahren – du fährst, geben – du gibst.' }
  ],

  examples: [
    'Was {e:isst} du gern?',
    'Er {e:spricht} drei Sprachen.',
    '{e:Nimmst} du den Bus oder die Bahn?',
    'Lena {e:liest} jeden Abend ein Buch.',
    '{e:Siehst} du den Hund dort?',
    'Das Baby {e:schläft} schon.',
    'Mein Vater {e:fährt} jeden Tag mit dem Rad zur Arbeit.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welche Form ist richtig?', instr: 'Wähle die richtige Verbform.',
      items: [
        'Du ((sprichst|sprechst|sprichtst)) sehr gut Deutsch.', 'Er ((isst|esst|ist)) gern Reis.', 'Was ((nimmst|nehmst|nimmt)) du?',
        'Sie ((liest|lest|lesst)) die Zeitung.', '((Fährst|Fahrst|Fährt)) du morgen nach Köln?', 'Ich ((schlafe|schläfe|schläft)) gern lange.',
        'Wir ((sehen|sieht|siehen)) einen Film.', 'Das Kind ((läuft|lauft|läufst)) schnell.' ] },
    { id: 'u2', type: 'fill', title: 'Schreib die Form', instr: 'Schreib das Verb in der richtigen Form.',
      items: [
        '(geben) Er [[gibt]] mir das Buch.', '(helfen) [[Hilfst]] du mir?', '(treffen) Sie [[trifft]] heute ihre Freundin.',
        '(tragen) Du [[trägst]] eine schöne Jacke.', '(vergessen) Er [[vergisst]] immer seinen Schlüssel.', '(waschen) Mama [[wäscht]] das Auto.' ] },
    { id: 'u3', type: 'choice', title: 'Mit oder ohne Vokalwechsel?', instr: 'Nur du und er/sie/es ändern den Vokal. Wähle richtig.',
      items: [
        'Ihr ((esst|isst)) zu schnell!', 'Wir ((nehmen|nimmen)) ein Taxi.', 'Du ((schläfst|schlafst)) zu wenig.',
        'Ich ((fahre|fähre)) mit dem Zug.', 'Ihr ((lest|liest)) viel.', 'Er ((hilft|helft)) seiner Mutter.' ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'Tippe die Teile in der richtigen Reihenfolge an.',
      items: [
        { tiles: ['Was', 'isst', 'du', 'zum Frühstück'], end: '?', ok: ['Was isst du zum Frühstück'] },
        { tiles: ['Er', 'spricht', 'sehr', 'schnell'], end: '.', ok: ['Er spricht sehr schnell'] },
        { tiles: ['Nimmst', 'du', 'einen Kaffee'], end: '?', ok: ['Nimmst du einen Kaffee'] },
        { tiles: ['Meine Schwester', 'fährt', 'nach Berlin'], end: '.', ok: ['Meine Schwester fährt nach Berlin'] },
        { tiles: ['Das Baby', 'schläft', 'schon'], end: '.', ok: ['Das Baby schläft schon'] } ] }
  ],

  speak: { title: 'Frag und antworte', intro: 'Bilde die Frage mit du oder er/sie – achte auf den Vokal!', altLabel: 'Antwort',
    items: [
      { cue: [['n', 'user-round', 'du'], ['x', 'utensils', 'essen'], ['e', 'circle-help', 'Was gern?']], say: 'Was {e:isst} du gern?', alt: 'Ich esse gern Matooke.' },
      { cue: [['n', 'user-round', 'er'], ['x', 'languages', 'sprechen'], ['e', 'circle-help', 'Wie viele Sprachen?']], say: 'Wie viele Sprachen {e:spricht} er?', alt: 'Er {e:spricht} drei Sprachen.' },
      { cue: [['n', 'user-round', 'du'], ['x', 'car', 'fahren'], ['e', 'circle-help', 'Wohin?']], say: 'Wohin {e:fährst} du?', alt: 'Ich fahre nach Hamburg.' },
      { cue: [['n', 'user-round', 'sie'], ['x', 'book-open', 'lesen'], ['e', 'circle-help', 'Was?']], say: 'Was {e:liest} sie?', alt: 'Sie {e:liest} einen Roman.' },
      { cue: [['n', 'user-round', 'du'], ['x', 'bus', 'nehmen'], ['e', 'circle-help', 'den Bus?']], say: '{e:Nimmst} du den Bus?', alt: 'Nein, ich nehme das Fahrrad.' },
      { cue: [['n', 'baby', 'das Kind'], ['x', 'moon', 'schlafen'], ['e', 'circle-help', 'Wo?']], say: 'Wo {e:schläft} das Kind?', alt: 'Es {e:schläft} im Auto.' } ] }
});
