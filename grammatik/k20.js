/* Kapitel 20 – welcher? und dieser (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 20, level: 'A1', group: 'Pronomen, Nomen und Artikel',
  title: 'welcher? und dieser',
  kicker: 'Welche Jacke? – Diese!',
  intro: 'Mit <b>welch-</b> fragst du nach einer Person oder Sache aus einer Gruppe. Mit <b>dies-</b> zeigst du darauf. Die Endungen sind wie beim Artikel: de<b>r</b> → welche<b>r</b>, da<b>s</b> → diese<b>s</b>, di<b>e</b> → welch<b>e</b>.',
  hero: '{e:Welche} Jacke nimmst du? – {e:Diese} hier!',
  art: K => K.svg(K.room(false) + `<rect x="30" y="104" width="300" height="7" rx="3" fill="var(--metal)"/><rect x="40" y="110" width="6" height="186" fill="var(--metal)"/><rect x="314" y="110" width="6" height="186" fill="var(--metal)"/>` +
    K.jacket(80, 112, 'var(--die)') + K.jacket(150, 112, 'var(--akk)') + K.jacket(220, 112, 'var(--nom)') + K.jacket(286, 112, 'var(--dat)') +
    K.shadow(380) + K.shadow(462, 36) +
    K.person({ x: 380, shirt: 'var(--das)', skin: 4, hair: 'bun', hc: 'var(--hair3)', armL: 'out', face: 'open' }) +
    K.person({ x: 462, s: .92, shirt: 'var(--der)', skin: 1, hair: 'short', armL: 'hip' }) +
    K.bubble(404, 60, '*Welche* Jacke nimmst du?', { tail: 'r' }) + K.bubble(300, 112, '*Diese* hier – die gelbe!', { tail: 'r' }),
    'Im Geschäft: Jacken hängen an einer Stange. Eine Frau zeigt auf eine gelbe Jacke.'),
  lemmas: { Welche: 'welcher', Welcher: 'welcher', Welches: 'welcher', welchem: 'welcher', Diese: 'dieser', diesen: 'dieser', Dieser: 'dieser', diesem: 'dieser' },

  understand: [
    { type: 'table', title: 'Die Formen', head: ['maskulin', 'neutral', 'feminin', 'Plural'], sets: {
      welcher: [['welcher Rock', 'welches Kleid', 'welche Jacke', 'welche Schuhe'], ['welchen Rock', 'welches Kleid', 'welche Jacke', 'welche Schuhe'], ['welchem Rock', 'welchem Kleid', 'welcher Jacke', 'welchen Schuhe+n']],
      dieser: [['dieser Rock', 'dieses Kleid', 'diese Jacke', 'diese Schuhe'], ['diesen Rock', 'dieses Kleid', 'diese Jacke', 'diese Schuhe'], ['diesem Rock', 'diesem Kleid', 'dieser Jacke', 'diesen Schuhe+n']],
      der: [['der Rock', 'das Kleid', 'die Jacke', 'die Schuhe'], ['den Rock', 'das Kleid', 'die Jacke', 'die Schuhe'], ['dem Rock', 'dem Kleid', 'der Jacke', 'den Schuhe+n']] },
      foot: 'Vergleiche mit <b>der</b>: Der letzte Buchstabe vom Artikel kommt ans Ende – de<b>r</b> → diese<b>r</b>, da<b>s</b> → diese<b>s</b>, de<b>n</b> → diese<b>n</b>, de<b>m</b> → diese<b>m</b>.' },
    { type: 'cards', title: 'Fragen und zeigen', min: '13rem', items: [
      { t: 'welch-?', k: 'ac', icon: 'circle-help', p: 'Frage nach einer Sache aus einer Gruppe.', ex: '{e:Welcher} Bus fährt zum Bahnhof?' },
      { t: 'dies-', k: 'a', icon: 'pointer', p: 'Du zeigst auf etwas: hier, da, dort.', ex: '{e:Dieser} Bus hier. – {e:Diese} Schuhe sind schön.' } ] },
    { type: 'note', title: 'Auch ohne Nomen', text: 'Wenn das Nomen klar ist, kannst du es weglassen: {e:Welches} Kleid gefällt dir? – {e:Dieses} hier.' },
    { type: 'merk', text: 'der → {e:dieser}, das → {e:dieses}, die → {e:diese}, den → {e:diesen}, dem → {e:diesem}' }
  ],

  examples: [
    '{e:Welcher} Bus fährt zum Bahnhof?',
    '{e:Welches} Kleid gefällt dir?',
    '{e:Welche} Sprachen sprichst du?',
    '{e:Dieser} Kuchen ist lecker!',
    'Ich nehme {e:diesen} Tisch.',
    'In {e:welchem} Stock wohnst du?',
    '{e:Diese} Schuhe sind zu klein.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'welcher, welches, welche …?', instr: 'Wähle die richtige Form.',
      items: [
        '((Welcher|Welches|Welche)) Tag ist heute?', '((Welches|Welcher|Welche)) Buch liest du?', '((Welche|Welcher|Welches)) Farbe magst du?',
        '((Welchen|Welcher|Welchem)) Film sehen wir?', 'In ((welchem|welchen|welcher)) Haus wohnst du?', '((Welche|Welches|Welcher)) Schuhe kaufst du?' ] },
    { id: 'u2', type: 'choice', title: 'dieser, dieses, diese …', instr: 'Wähle die richtige Form.',
      items: [
        '((Dieser|Dieses|Diese)) Mantel ist warm.', 'Ich nehme ((diese|dieser|dieses)) Tasche.', '((Dieses|Dieser|Diese)) Hotel ist teuer.',
        'Kennst du ((diesen|dieser|dieses)) Mann?', '((Diese|Dieser|Dieses)) Äpfel sind süß.', 'Mit ((diesem|diesen|dieser)) Bus fahren wir.' ] },
    { id: 'u3', type: 'fill', title: 'Frage und Antwort', instr: 'Ergänze welch- und dies- in der richtigen Form.',
      items: [
        '(der Rock) [[Welcher]] Rock gefällt dir? – [[Dieser]] hier.', '(das Hemd) [[Welches]] Hemd kaufst du? – [[Dieses]] hier.',
        '(die Jacke) [[Welche]] Jacke nimmst du? – [[Diese]] hier.', '(der Pullover) [[Welchen]] Pullover nimmst du? – [[Diesen]] hier.',
        '(die Schuhe) [[Welche]] Schuhe ziehst du an? – [[Diese]] hier.', '(das Auto) [[Welches]] Auto gehört dir? – [[Dieses]] dort.' ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'Tippe die Teile in der richtigen Reihenfolge an.',
      items: [
        { tiles: ['Welcher', 'Bus', 'fährt', 'zum Bahnhof'], end: '?', ok: ['Welcher Bus fährt zum Bahnhof'] },
        { tiles: ['Diese Schuhe', 'sind', 'zu klein'], end: '.', ok: ['Diese Schuhe sind zu klein'] },
        { tiles: ['Welches Kleid', 'gefällt', 'dir'], end: '?', ok: ['Welches Kleid gefällt dir'] },
        { tiles: ['Ich', 'nehme', 'diesen Tisch'], end: '.', ok: ['Ich nehme diesen Tisch'] },
        { tiles: ['In welchem Stock', 'wohnst', 'du'], end: '?', ok: ['In welchem Stock wohnst du'] } ] }
  ],

  speak: { title: 'Beim Einkaufen', intro: 'Frag mit welch- – und antworte mit dies-.', altLabel: 'Antwort',
    items: [
      { cue: [['x', 'shirt', 'die Jacke · nehmen']], say: '{e:Welche} Jacke nimmst du?', alt: '{e:Diese} hier!' },
      { cue: [['x', 'shirt', 'der Pullover · nehmen']], say: '{e:Welchen} Pullover nimmst du?', alt: '{e:Diesen} hier!' },
      { cue: [['x', 'shirt', 'das Hemd · kaufen']], say: '{e:Welches} Hemd kaufst du?', alt: '{e:Dieses} hier!' },
      { cue: [['x', 'footprints', 'die Schuhe · gefallen']], say: '{e:Welche} Schuhe gefallen dir?', alt: '{e:Diese} hier!' },
      { cue: [['x', 'bus', 'der Bus · fahren · zum Zoo']], say: '{e:Welcher} Bus fährt zum Zoo?', alt: '{e:Dieser} hier.' },
      { cue: [['x', 'building', 'der Stock · wohnen']], say: 'In {e:welchem} Stock wohnst du?', alt: 'Im dritten Stock.' } ] }
});
