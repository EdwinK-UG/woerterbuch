/* Kapitel 84 – Adjektive ohne Artikel (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 84, level: 'B1', group: 'Adjektive 2',
  title: 'Adjektive ohne Artikel',
  kicker: 'frisches Brot, heißer Kaffee',
  intro: 'Steht <b>kein Artikel</b> vor dem Adjektiv, übernimmt das Adjektiv die Endung des Artikels: de<b>r</b> Kaffee → heiß<b>er</b> Kaffee, da<b>s</b> Brot → frisch<b>es</b> Brot. Das ist typisch für Speisekarten, Anzeigen und Mengen.',
  hero: '{e:Frisches} Brot und {e:heißer} Kaffee – so beginnt der Tag!',
  art: K => K.svg(K.room() + K.table(260, 236, 300) +
    `<g transform="translate(180 236)"><path d="M-60 0Q-60 -46 0 -46Q60 -46 60 0Z" fill="var(--wood)"/><path d="M-40 -30q10 8 20 0M-10 -36q10 8 20 0M20 -30q10 8 20 0" stroke="var(--floor)" stroke-width="4" fill="none" stroke-linecap="round"/></g>` +
    K.cup(330, 236) + `<path d="M380 236h60l-6 -30h-48z" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><ellipse cx="410" cy="206" rx="24" ry="5" fill="var(--nom)"/>` +
    K.tag(180, 156, 'frisches Brot', 'nom') + K.tag(330, 120, 'heißer Kaffee', 'der') + K.tag(420, 170, 'warme Milch', 'die'),
    'Ein Frühstückstisch mit frischem Brot, heißem Kaffee und warmer Milch.'),
  lemmas: { Frisches: 'frisch', frisches: 'frisch', heißer: 'heiß', warme: 'warm', kalter: 'kalt' },

  understand: [
    { type: 'grid', title: 'Die Endungen ohne Artikel', head: ['', 'maskulin', 'neutral', 'feminin', 'Plural'], rows: [
      ['Nominativ', 'heiß{e:er} Kaffee', 'frisch{e:es} Brot', 'warm{e:e} Milch', 'rot{e:e} Äpfel'],
      ['Akkusativ', 'heiß{e:en} Kaffee', 'frisch{e:es} Brot', 'warm{e:e} Milch', 'rot{e:e} Äpfel'],
      ['Dativ', 'mit heiß{e:em} Kaffee', 'mit frisch{e:em} Brot', 'mit warm{e:er} Milch', 'mit rot{e:en} Äpfeln'],
      ['Genitiv', 'trotz kalt{e:en} Wetters', 'trotz schlecht{e:en} Wetters', 'wegen hoh{e:er} Kosten', 'wegen hoh{e:er} Preise'] ],
      foot: 'Wie der Artikel (der → -er, das → -es, die → -e, dem → -em …). Nur im Genitiv maskulin/neutral: -en.' },
    { type: 'cards', title: 'Wo braucht man das?', min: '12rem', items: [
      { t: 'Speisekarte', k: 'n', ex: 'Grün{e:er} Salat mit frisch{e:em} Brot' },
      { t: 'Mengen', k: 'ac', ex: 'ein Glas kalt{e:es} Wasser · ein Kilo rot{e:e} Tomaten' },
      { t: 'nach Zahlen', k: 'd', ex: 'zwei groß{e:e} Pizzen · drei neu{e:e} Kollegen' },
      { t: 'Grüße', k: 'ok', ex: 'Lieb{e:e} Anna · Herzlich{e:e} Grüße · Gut{e:en} Appetit!' } ] },
    { type: 'merk', text: 'Kein Artikel? Das Adjektiv zeigt den Artikel: heiß{e:er} (der), frisch{e:es} (das), warm{e:e} (die).' }
  ],

  examples: [
    'Ich trinke morgens {e:heißen} Tee.',
    'Hier gibt es {e:frisches} Obst vom Markt.',
    '{e:Liebe} Mama, {e:herzliche} Grüße aus Berlin!',
    'Ich esse gern Reis mit {e:scharfer} Soße.',
    'Wir suchen {e:freundliche} Mitarbeiter.',
    '{e:Guten} Appetit!'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Die richtige Endung', instr: 'Wähle die richtige Form.',
      items: [
        'Ich trinke gern ((kalten|kaltes|kalter)) Saft.', 'Hier gibt es ((frisches|frische|frischen)) Brot.', 'Ich möchte ((heiße|heißen|heißes)) Milch.',
        'Das ist ((guter|gutes|gute)) Wein.', 'Wir essen ((rote|roten|roter)) Äpfel.', 'Er trinkt Tee mit ((warmer|warme|warmem)) Milch.' ] },
    { id: 'u2', type: 'fill', title: 'Speisekarte', instr: 'Ergänze die Endung.',
      items: [
        'Grün[[er]] Salat (der Salat)', 'Frisch[[es]] Gemüse (das Gemüse)', 'Hausgemacht[[e]] Suppe (die Suppe)',
        'Gegrillt[[er]] Fisch mit frisch[[em]] Brot', 'Kalt[[e]] Getränke (Plural)', 'Heiß[[er]] Kaffee mit warm[[er]] Milch' ] },
    { id: 'u3', type: 'choice', title: 'Grüße und Wünsche', instr: 'Wähle die richtige Form.',
      items: [
        '((Liebe|Lieber|Liebes)) Anna, …', '((Lieber|Liebe|Lieben)) Paul, …', '((Herzliche|Herzlicher|Herzlichen)) Grüße!',
        '((Guten|Gute|Gutes)) Appetit!', '((Schönes|Schönen|Schöne)) Wochenende!', '((Viele|Vielen|Viel)) Dank!' ] }
  ],

  speak: { title: 'Im Café bestellen', intro: 'Bestell mit Adjektiv ohne Artikel.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'coffee', 'Kaffee · heiß']], say: 'Ich möchte {e:heißen} Kaffee, bitte.' },
      { cue: [['x', 'croissant', 'Brot · frisch']], say: 'Haben Sie {e:frisches} Brot?' },
      { cue: [['x', 'milk', 'Milch · warm']], say: 'Mit {e:warmer} Milch, bitte.' },
      { cue: [['x', 'glass-water', 'Wasser · kalt']], say: 'Ein Glas {e:kaltes} Wasser, bitte.' },
      { cue: [['x', 'utensils', 'Wunsch zum Essen']], say: '{e:Guten} Appetit!' } ] }
});
