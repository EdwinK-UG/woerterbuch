/* Kapitel 51 – Wortbildung mit Endungen (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 51, level: 'A2', group: 'Wörter und Wortbildung',
  title: 'Wortbildung mit Endungen',
  kicker: '-chen, -er, -in, -ung, -heit, -keit',
  intro: 'Mit Endungen machst du aus einem Wort ein neues: aus einem Verb eine Person (lehren → Lehr<b>er</b>), aus einem Adjektiv ein Nomen (frei → Frei<b>heit</b>), etwas Kleines (Haus → Häus<b>chen</b>). Die Endung zeigt oft auch den Artikel.',
  hero: 'lehren → {e:der} Lehr{e:er} → {e:die} Lehrer{e:in}',
  art: K => {
    const block = (x, y, t, c, w) => `<g><rect x="${x - w / 2}" y="${y - 22}" width="${w}" height="44" rx="10" fill="var(--${c}-s)" stroke="var(--${c})" stroke-width="2.5"/><text x="${x}" y="${y + 7}" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="21" fill="var(--${c})">${t}</text></g>`;
    const house = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-40" y="-50" width="80" height="50" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><path d="M-50 -46L0 -86L50 -46Z" fill="var(--die)"/><rect x="-10" y="-30" width="20" height="30" fill="var(--wood)"/></g>`;
    return K.svg(`<rect width="520" height="360" fill="var(--sky1)"/>` + house(90, 160, 1.2) + house(400, 160, .6) +
      block(90, 210, 'das Haus', 'akk', 120) + `<text x="190" y="218" font-family="Inter,sans-serif" font-size="26" font-weight="800" fill="var(--ink)">+</text>` + block(260, 210, '-chen', 'das', 92) +
      `<text x="320" y="218" font-family="Inter,sans-serif" font-size="26" font-weight="800" fill="var(--ink)">=</text>` + block(424, 210, 'das Häuschen', 'das', 150) +
      block(150, 300, 'frei + -heit', 'die', 150) + block(370, 300, 'die Freiheit', 'die', 140),
      'Wort-Bausteine: das Haus + -chen = das Häuschen; frei + -heit = die Freiheit.');
  },
  lemmas: { Lehrer: 'Lehrer', Lehrerin: 'Lehrerin', Häuschen: 'Häuschen', Freiheit: 'Freiheit' },

  understand: [
    { type: 'cards', title: 'Personen', min: '13rem', items: [
      { t: '-er', k: 'n', s: 'Verb → Person (der)', ex: 'lehren → der Lehr{e:er} · spielen → der Spiel{e:er} · backen → der Bäck{e:er}' },
      { t: '-in', k: 'b', s: 'männlich → weiblich (die)', ex: 'der Lehrer → die Lehrer{e:in} · der Arzt → die Ärzt{e:in} · Plural: die Lehrer{e:innen}' } ] },
    { type: 'cards', title: 'Nomen aus Verben und Adjektiven', min: '13rem', items: [
      { t: '-ung', k: 'b', s: 'Verb → Nomen (die)', ex: 'wohnen → die Wohn{e:ung} · erklären → die Erklär{e:ung}' },
      { t: '-heit', k: 'b', s: 'Adjektiv → Nomen (die)', ex: 'frei → die Frei{e:heit} · gesund → die Gesund{e:heit}' },
      { t: '-keit', k: 'b', s: 'Adjektiv (-ig, -lich, -bar) → Nomen (die)', ex: 'möglich → die Möglich{e:keit} · freundlich → die Freundlich{e:keit}' } ] },
    { type: 'cards', title: 'Klein und neu', min: '13rem', items: [
      { t: '-chen / -lein', k: 'ok', s: 'klein (das) – oft mit Umlaut', ex: 'das Haus → das H{e:ä}us{e:chen} · der Tisch → das Tisch{e:lein}' },
      { t: 'un-', k: 'w', s: 'Gegenteil', ex: 'glücklich → {e:un}glücklich · freundlich → {e:un}freundlich' },
      { t: '-los / -bar', k: 'ac', s: 'ohne / kann man', ex: 'die Arbeit → arbeits{e:los} · essen → ess{e:bar}' } ] },
    { type: 'merk', text: '{e:-ung, -heit, -keit, -in} → die · {e:-chen, -lein} → das · {e:-er} (Person) → der' }
  ],

  examples: [
    'Meine {e:Lehrerin} ist sehr geduldig.',
    'Wir suchen eine neue {e:Wohnung}.',
    'Danke für deine {e:Erklärung}!',
    'Die {e:Gesundheit} ist das Wichtigste.',
    'Im Garten steht ein kleines {e:Häuschen}.',
    'Er ist seit zwei Monaten {e:arbeitslos}.'
  ],

  exercises: [
    { id: 'u1', type: 'fill', title: 'Aus Verb wird Nomen', instr: 'Bilde das Nomen mit -ung (mit Artikel die).',
      items: [
        'wohnen → die [[Wohnung]]', 'üben → die [[Übung]]', 'erklären → die [[Erklärung]]', 'meinen → die [[Meinung]]',
        'bestellen → die [[Bestellung]]', 'einladen → die [[Einladung]]' ] },
    { id: 'u2', type: 'fill', title: 'Aus Adjektiv wird Nomen', instr: 'Bilde das Nomen mit -heit oder -keit.',
      items: [
        'frei → die [[Freiheit]]', 'gesund → die [[Gesundheit]]', 'möglich → die [[Möglichkeit]]',
        'freundlich → die [[Freundlichkeit]]', 'krank → die [[Krankheit]]', 'pünktlich → die [[Pünktlichkeit]]' ] },
    { id: 'u3', type: 'fill', title: 'Personen', instr: 'Schreib die weibliche Form mit -in.',
      items: [
        'der Lehrer → die [[Lehrerin]]', 'der Freund → die [[Freundin]]', 'der Arzt → die [[Ärztin]]',
        'der Koch → die [[Köchin]]', 'der Verkäufer → die [[Verkäuferin]]', 'der Student → die [[Studentin]]' ] },
    { id: 'u4', type: 'choice', title: 'Welcher Artikel?', instr: 'Die Endung verrät den Artikel.',
      items: [
        '((das|der|die)) Brötchen', '((die|der|das)) Zeitung', '((der|die|das)) Spieler', '((die|der|das)) Schönheit',
        '((die|der|das)) Ärztin', '((das|der|die)) Tischlein' ] }
  ],

  speak: { title: 'Bau neue Wörter', intro: 'Bilde das neue Wort mit Artikel.', altLabel: 'Im Satz',
    items: [
      { cue: [['x', 'house', 'wohnen + -ung']], say: '{e:die} Wohnung', alt: 'Meine Wohnung ist klein.' },
      { cue: [['x', 'heart-pulse', 'gesund + -heit']], say: '{e:die} Gesundheit', alt: 'Gesundheit ist wichtig.' },
      { cue: [['x', 'graduation-cap', 'lehren + -er']], say: '{e:der} Lehrer', alt: '… und {e:die} Lehrerin.' },
      { cue: [['x', 'lightbulb', 'möglich + -keit']], say: '{e:die} Möglichkeit' },
      { cue: [['x', 'home', 'das Haus + -chen']], say: '{e:das} Häuschen' },
      { cue: [['x', 'frown', 'un- + glücklich']], say: 'unglücklich', alt: 'Er ist unglücklich.' } ] }
});
