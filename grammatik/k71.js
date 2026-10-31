/* Kapitel 71 – alles Gute, etwas Neues (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 71, level: 'B1', group: 'Nomen 2',
  title: 'alles Gute, etwas Neues',
  kicker: 'Adjektive nach alles, etwas, nichts',
  intro: 'Nach <b>etwas, nichts, viel, wenig</b> wird ein Adjektiv zum Nomen mit <b>-es</b>: etwas Neu<b>es</b>. Nach <b>alles</b> und <b>das</b> mit <b>-e</b>: alles Gut<b>e</b>, das Best<b>e</b>. Immer großgeschrieben!',
  hero: '{e:Alles Gute} zum Geburtstag – und viel {e:Schönes} im neuen Jahr!',
  art: K => K.svg(K.room() + K.table(260, 240, 260) + K.gift(190, 240, 'var(--akk)', 50) + K.gift(330, 240, 'var(--die)', 40) +
    `<g transform="translate(260 120) rotate(-4)"><rect x="-110" y="-46" width="220" height="92" rx="10" fill="var(--card)" stroke="var(--die)" stroke-width="3"/><text y="-6" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="28" fill="var(--die)">Alles Gute!</text><text y="24" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" fill="var(--ink)">zum Geburtstag</text></g>
<g fill="var(--sun)"><path d="M90 70l3 8l8 3l-8 3l-3 8l-3-8l-8-3l8-3z"/><path d="M430 60l3 8l8 3l-8 3l-3 8l-3-8l-8-3l8-3z"/></g>`,
    'Eine Geburtstagskarte „Alles Gute!“ und zwei Geschenke auf einem Tisch.'),
  lemmas: { Gute: 'gut', Neues: 'neu', Schönes: 'schön', Beste: 'gut', Interessantes: 'interessant' },

  understand: [
    { type: 'grid', title: 'Welche Endung?', head: ['nach …', 'Endung', 'Beispiele'], rows: [
      ['etwas · nichts · viel · wenig', '{e:-es}', 'etwas Neu{e:es} · nichts Besonder{e:es} · viel Gut{e:es} · wenig Neu{e:es}'],
      ['alles · das', '{e:-e}', 'alles Gut{e:e} · alles Liebe · das Best{e:e} · das Wichtigst{e:e}'] ], label: false },
    { type: 'cards', title: 'Typische Wünsche', min: '12rem', items: [
      { t: 'Alles Gute!', k: 'n', ex: '{e:Alles Gute} zum Geburtstag!' }, { t: 'Alles Liebe!', k: 'b', ex: '{e:Alles Liebe}, deine Lea' },
      { t: 'Viel Glück!', k: 'ok', ex: '{e:Viel Glück} bei der Prüfung!' }, { t: 'Gute Besserung!', k: 'ac', ex: '{e:Gute Besserung}! (für Kranke)' } ] },
    { type: 'merk', text: 'etwas Neu{e:es} · nichts Neu{e:es} · alles Neu{e:e} – und immer groß!' },
    { type: 'note', title: 'Im Dativ', text: 'Mit Präposition wechselt die Endung: mit etwas Neu{e:em} · mit allem Gut{e:en}. Das ist aber selten.' }
  ],

  examples: [
    'Gibt es {e:etwas Neues}?',
    'Im Fernsehen kommt heute {e:nichts Interessantes}.',
    'Ich wünsche dir {e:alles Gute}!',
    'Das {e:Wichtigste} ist die Gesundheit.',
    'Wir haben im Urlaub {e:viel Schönes} gesehen.',
    'Ich möchte {e:etwas Warmes} trinken.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: '-es oder -e?', instr: 'Wähle die richtige Form.',
      items: [
        'Ich wünsche dir alles ((Gute|Gutes|Guten)).', 'Gibt es etwas ((Neues|Neue|Neuen))?', 'Heute habe ich nichts ((Besonderes|Besondere|Besonderen)) gemacht.',
        'Das ((Beste|Bestes|Besten)) kommt zum Schluss.', 'Ich möchte etwas ((Kaltes|Kalte|Kalten)) trinken.', 'Sie erzählt viel ((Interessantes|Interessante|Interessanten)).' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze', instr: 'Schreib das Adjektiv als Nomen (groß!).',
      items: [
        '(neu) Weißt du etwas [[Neues]]?', '(gut) Alles [[Gute]] zum Geburtstag!', '(schön) Wir haben viel [[Schönes]] erlebt.',
        '(wichtig) Das [[Wichtigste]] ist, dass du gesund bist.', '(süß) Ich esse gern etwas [[Süßes]].', '(interessant) Im Buch steht nichts [[Interessantes]].' ] },
    { id: 'u3', type: 'choice', title: 'Der passende Wunsch', instr: 'Was sagst du?',
      items: [
        'Ein Freund hat Geburtstag: ((Alles Gute!|Gute Besserung!|Guten Appetit!))', 'Eine Kollegin ist krank: ((Gute Besserung!|Alles Gute zum Geburtstag!|Viel Spaß!))',
        'Deine Schwester hat morgen eine Prüfung: ((Viel Glück!|Gute Besserung!|Gute Nacht!))', 'Am Ende eines Briefes an deine Mutter: ((Alles Liebe|Viel Glück|Guten Appetit))' ] }
  ],

  speak: { title: 'Wünsche', intro: 'Was sagst du in dieser Situation?', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'cake', 'Geburtstag']], say: '{e:Alles Gute} zum Geburtstag!' },
      { cue: [['x', 'thermometer', 'jemand ist krank']], say: '{e:Gute Besserung}!' },
      { cue: [['x', 'pencil', 'Prüfung']], say: '{e:Viel Glück} bei der Prüfung!' },
      { cue: [['x', 'newspaper', 'Nachrichten?']], say: 'Gibt es {e:etwas Neues}?', alt: 'Nein, {e:nichts Neues}.' },
      { cue: [['x', 'coffee', 'warm trinken']], say: 'Ich möchte {e:etwas Warmes} trinken.' } ] }
});
