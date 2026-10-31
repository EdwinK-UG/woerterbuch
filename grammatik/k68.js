/* Kapitel 68 – Der Genitiv (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 68, level: 'B1', group: 'Nomen 2',
  title: 'Der Genitiv',
  kicker: 'das Auto meines Vaters',
  intro: 'Der Genitiv zeigt, <b>wem etwas gehört</b> oder wozu etwas gehört. Frage: <b>Wessen?</b> Maskuline und neutrale Nomen bekommen <b>-s</b> oder <b>-es</b>. Im Gespräch sagt man oft <b>von + Dativ</b>.',
  hero: 'Das ist das Auto {e:meines Vaters}.',
  art: K => K.svg(K.street() + K.car(270, 330, 'var(--der)') + K.shadow(420) +
    K.person({ x: 420, shirt: 'var(--nom)', skin: 1, hair: 'white', beard: 'var(--hair1)', glasses: true, armL: 'front', face: 'smile',
      extra: '<g transform="translate(-52 -98)"><circle r="8" fill="none" stroke="var(--sun)" stroke-width="4"/><rect x="6" y="-2" width="16" height="4" fill="var(--sun)"/></g>' }) +
    K.shadow(110) + K.person({ x: 110, s: .8, shirt: 'var(--akk)', skin: 1, hair: 'curly', armR: 'out', face: 'open' }) +
    K.tag(270, 200, 'das Auto meines Vaters', 'der'),
    'Ein Vater mit Autoschlüssel steht neben seinem Auto. Sein Kind zeigt darauf: das Auto meines Vaters.'),
  lemmas: { meines: 'mein', Vaters: 'Vater', des: 'der', wessen: 'wer', Wessen: 'wer' },

  understand: [
    { type: 'grid', title: 'Die Formen', head: ['', 'maskulin', 'neutral', 'feminin', 'Plural'], rows: [
      ['bestimmt', 'd{e:es} Vater{e:s}', 'd{e:es} Kind{e:es}', 'd{e:er} Mutter', 'd{e:er} Eltern'],
      ['unbestimmt', 'ein{e:es} Vater{e:s}', 'ein{e:es} Kind{e:es}', 'ein{e:er} Mutter', '– (von + Dativ)'],
      ['Possessiv', 'mein{e:es} Vater{e:s}', 'mein{e:es} Kind{e:es}', 'mein{e:er} Mutter', 'mein{e:er} Eltern'] ],
      foot: 'Kurze Nomen (oft eine Silbe) bekommen meistens <b>-es</b>: des Kindes, des Mannes. Lange Nomen: <b>-s</b>: des Vaters, des Lehrers.' },
    { type: 'cards', title: 'Genitiv im Alltag', min: '13rem', items: [
      { t: 'Namen', k: 'ac', p: 'Name + s (ohne Apostroph!)', ex: 'Annas Auto · Pauls Bruder · Frau Katos Büro' },
      { t: 'von + Dativ', k: 'n', p: 'gesprochen oft statt Genitiv', ex: 'das Auto {d:von meinem Vater} = das Auto {e:meines Vaters}' },
      { t: 'Frage: Wessen?', k: 'd', p: 'nach dem Besitzer fragen', ex: '{e:Wessen} Tasche ist das? – Die Tasche {e:meiner Schwester}.' } ] },
    { type: 'merk', text: 'maskulin und neutral: {e:des} …{e:(e)s} · feminin und Plural: {e:der} …' },
    { type: 'note', title: 'Wo steht der Genitiv?', text: 'Der Genitiv steht meistens <b>nach</b> dem Nomen: die Farbe {e:des Autos}, das Ende {e:des Films}. Namen stehen davor: Lisas Fahrrad.' }
  ],

  examples: [
    'Das ist das Haus {e:meiner Großeltern}.',
    'Die Farbe {e:des Autos} gefällt mir.',
    'Am Ende {e:des Films} weinen alle.',
    'Das ist {e:Saras} Handy.',
    'Der Name {e:des Lehrers} ist Herr Okoth.',
    '{e:Wessen} Schlüssel ist das?'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Die richtige Form', instr: 'Wähle die Genitivform.',
      items: [
        'Das ist das Auto ((meines Vaters|meinem Vater|mein Vater)).', 'Die Farbe ((des Hauses|dem Haus|das Haus)) ist weiß.', 'Das ist das Zimmer ((meiner Schwester|meine Schwester|meines Schwesters)).',
        'Der Hund ((der Nachbarn|den Nachbarn|die Nachbarn)) bellt.', 'Am Anfang ((des Kurses|dem Kurs|der Kurs)) war ich nervös.', 'Das Büro ((des Chefs|der Chef|dem Chefs)) ist im 3. Stock.' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze', instr: 'Schreib den Artikel und die Endung im Genitiv.',
      items: [
        '(der Film) das Ende [[des]] Film[[s|es]]', '(das Kind) das Spielzeug [[des]] Kind[[es|s]]', '(die Stadt) das Zentrum [[der]] Stadt',
        '(mein Bruder) das Fahrrad [[meines]] Bruder[[s]]', '(die Kinder) die Schule [[der]] Kinder', '(ein Freund) das Auto [[eines]] Freund[[es|s]]' ] },
    { id: 'u3', type: 'type', title: 'Genitiv statt von', instr: 'Schreib den Ausdruck mit Genitiv.',
      items: [
        { q: 'das Auto von meinem Vater', pre: 'das Auto', end: '', ok: ['meines Vaters'] },
        { q: 'die Tasche von meiner Mutter', pre: 'die Tasche', end: '', ok: ['meiner Mutter'] },
        { q: 'das Ende von dem Film', pre: 'das Ende', end: '', ok: ['des Films', 'des Filmes'] },
        { q: 'das Handy von Sara', pre: 'das ist', end: ' Handy', ok: ['Saras'] },
        { q: 'die Wohnung von meinen Eltern', pre: 'die Wohnung', end: '', ok: ['meiner Eltern'] } ] },
    { id: 'u4', type: 'choice', title: 'Wessen?', instr: 'Wähle die passende Frage.',
      items: [ '((Wessen|Wem|Wen)) Jacke ist das? – Die Jacke meines Bruders.', '((Wem|Wessen|Wer)) gehört die Jacke? – Meinem Bruder.', '((Wer|Wessen|Wem)) ist das? – Mein Bruder.' ] }
  ],

  speak: { title: 'Wem gehört das?', intro: 'Sag es mit Genitiv – dann mit von + Dativ.', altLabel: 'Mit von',
    items: [
      { cue: [['x', 'car', 'Auto'], ['x', 'user-round', 'mein Vater']], say: 'Das ist das Auto {e:meines Vaters}.', alt: 'Das ist das Auto {d:von meinem Vater}.' },
      { cue: [['x', 'house', 'Haus'], ['x', 'users', 'meine Großeltern']], say: 'Das ist das Haus {e:meiner Großeltern}.', alt: 'Das ist das Haus {d:von meinen Großeltern}.' },
      { cue: [['x', 'smartphone', 'Handy'], ['x', 'user-round', 'Sara']], say: 'Das ist {e:Saras} Handy.' },
      { cue: [['x', 'clapperboard', 'Ende'], ['x', 'film', 'der Film']], say: 'das Ende {e:des Films}' },
      { cue: [['x', 'palette', 'Farbe'], ['x', 'car', 'das Auto']], say: 'die Farbe {e:des Autos}' } ] }
});
