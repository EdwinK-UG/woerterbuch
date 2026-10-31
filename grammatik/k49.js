/* Kapitel 49 – Der, die oder das? Genusregeln (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 49, level: 'A1', group: 'Wörter und Wortbildung',
  title: 'Der, die oder das? Genusregeln',
  kicker: 'Endungen verraten den Artikel',
  intro: 'Den Artikel muss man oft auswendig lernen. Aber es gibt <b>Regeln</b>, die sehr oft stimmen – vor allem die <b>Endungen</b>. -ung ist immer die, -chen ist immer das.',
  hero: '{e:die} Zeit{e:ung} · {e:das} Mäd{e:chen} · {e:der} Lehr{e:er}',
  art: K => {
    const box = (x, art, c, words) => `<g><path d="M${x - 70} 180h140l-12 120h-116z" fill="var(--${c}-s)" stroke="var(--${c})" stroke-width="3"/><text x="${x}" y="262" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="34" fill="var(--${c})">${art}</text>
${words.map((w, i) => `<g transform="translate(${x + (i - 1) * 34} ${70 + i * 30}) rotate(${(i - 1) * 9})"><rect x="${-w.length * 5 - 10}" y="-15" width="${w.length * 10 + 20}" height="30" rx="8" fill="var(--card)" stroke="var(--${c})" stroke-width="2"/><text y="6" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="15" fill="var(--${c})">${w}</text></g>`).join('')}</g>`;
    return K.svg(`<rect width="520" height="360" fill="var(--sky1)"/>` + box(95, 'der', 'der', ['-er', '-ling', 'Montag']) + box(260, 'die', 'die', ['-ung', '-heit', '-ion']) + box(425, 'das', 'das', ['-chen', '-um', '-ment']) +
      `<rect y="300" width="520" height="60" fill="var(--floor)"/>`, 'Drei Kisten: der, die, das. Endungen fliegen in die passende Kiste.');
  },
  lemmas: { Zeitung: 'Zeitung', Mädchen: 'Mädchen', Lehrer: 'Lehrer' },

  understand: [
    { type: 'cards', title: 'Fast immer der', min: '13rem', items: [
      { t: 'der', k: 'n', s: 'Bedeutung', p: 'Männer und männliche Tiere · Tage, Monate, Jahreszeiten · Himmelsrichtungen · Automarken · Alkohol (aber: das Bier)', ex: 'der Vater · der Montag · der Mai · der Winter · der Norden · der Wein' },
      { t: 'der', k: 'n', s: 'Endungen', p: '-er (Person) · -ling · -ismus · -ig · -or', ex: 'der Lehrer · der Frühling · der Tourismus · der Honig · der Motor' } ] },
    { type: 'cards', title: 'Fast immer die', min: '13rem', items: [
      { t: 'die', k: 'b', s: 'Bedeutung', p: 'Frauen und weibliche Tiere · Zahlen · viele Bäume und Blumen', ex: 'die Mutter · die Kuh · die Drei · die Rose' },
      { t: 'die', k: 'b', s: 'Endungen', p: '-ung · -heit · -keit · -schaft · -ion · -tät · -ie · -ik · -in · die meisten auf -e', ex: 'die Zeitung · die Freiheit · die Freundschaft · die Station · die Universität · die Musik · die Lampe' } ] },
    { type: 'cards', title: 'Fast immer das', min: '13rem', items: [
      { t: 'das', k: 'ok', s: 'Bedeutung', p: 'Verben als Nomen · Farben · Metalle · viele Länder ohne Artikel · Hotels, Kinos, Cafés', ex: 'das Essen · das Rot · das Gold · das schöne Kenia · das Café' },
      { t: 'das', k: 'ok', s: 'Endungen', p: '-chen · -lein · -um · -ment · -ma · -o', ex: 'das Mädchen · das Fräulein · das Museum · das Dokument · das Thema · das Auto' } ] },
    { type: 'merk', text: '{e:-ung, -heit, -keit} → die · {e:-chen, -lein} → das · {e:-er} (Person), {e:-ling} → der' },
    { type: 'note', title: 'Ausnahmen gibt es immer', text: 'Die Regeln stimmen oft, aber nicht immer: das Bier, der Käse, das Ende. Tipp: Lerne jedes Nomen mit Artikel – am besten mit Farbe.' }
  ],

  examples: [
    'Hast du {e:die} Zeitung von heute?',
    '{e:Das} Mädchen spielt im Garten.',
    'Im Frühling blühen {e:die} Rosen.',
    '{e:Das} Museum ist am Montag geschlossen.',
    '{e:Die} Freundschaft ist mir wichtig.',
    '{e:Der} Lehrer erklärt {e:das} Thema.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Endungen', instr: 'Welcher Artikel? Schau auf die Endung.',
      items: [
        '((die|der|das)) Wohnung', '((das|der|die)) Brötchen', '((der|die|das)) Frühling', '((die|der|das)) Gesundheit',
        '((das|der|die)) Zentrum', '((die|der|das)) Nation', '((der|die|das)) Optimismus', '((die|der|das)) Möglichkeit' ] },
    { id: 'u2', type: 'choice', title: 'Bedeutung', instr: 'Welcher Artikel? Denk an die Bedeutung.',
      items: [
        '((der|die|das)) Dienstag', '((der|die|das)) August', '((das|der|die)) Schwimmen', '((die|der|das)) Tante',
        '((das|der|die)) Blau', '((der|die|das)) Osten' ] },
    { id: 'u3', type: 'fill', title: 'Der richtige Artikel', instr: 'Schreib der, die oder das.',
      items: [
        '[[Die]] Bedeutung von diesem Wort ist schwer.', '[[Das]] Häuschen steht am See.', '[[Der]] Sommer war sehr heiß.',
        '[[Die]] Universität ist groß.', '[[Das]] Kochen macht mir Spaß.', '[[Der]] Lehrling lernt viel.' ] },
    { id: 'u4', type: 'choice', title: 'Ausnahme oder Regel?', instr: 'Wähle den richtigen Artikel – Vorsicht, Ausnahmen!',
      items: [
        '((das|der|die)) Bier', '((der|die|das)) Käse', '((die|der|das)) Lampe', '((das|der|die)) Ende', '((der|die|das)) Name', '((die|der|das)) Musik' ] }
  ],

  speak: { title: 'Rate den Artikel', intro: 'Sag das Wort mit Artikel. Welche Regel hilft?', altLabel: 'Regel',
    items: [
      { cue: [['x', 'newspaper', 'Zeitung']], say: '{e:die} Zeitung', alt: '-ung → immer die.' },
      { cue: [['x', 'baby', 'Mädchen']], say: '{e:das} Mädchen', alt: '-chen → immer das.' },
      { cue: [['x', 'calendar', 'Montag']], say: '{e:der} Montag', alt: 'Tage → der.' },
      { cue: [['x', 'landmark', 'Museum']], say: '{e:das} Museum', alt: '-um → das.' },
      { cue: [['x', 'heart', 'Freiheit']], say: '{e:die} Freiheit', alt: '-heit → die.' },
      { cue: [['x', 'utensils', 'Essen']], say: '{e:das} Essen', alt: 'Verb als Nomen → das.' } ] }
});
