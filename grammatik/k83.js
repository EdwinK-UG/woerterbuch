/* Kapitel 83 – Zeitliche Präpositionen (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 83, level: 'B1', group: 'Präpositionen 2',
  title: 'Zeitliche Präpositionen',
  kicker: 'innerhalb, vor, seit, in, bei …',
  intro: 'Für Zeitangaben gibt es viele Präpositionen – mit verschiedenen Fällen. Wichtig ist der Unterschied: <b>vor</b> (in der Vergangenheit), <b>in</b> (in der Zukunft), <b>seit</b> (bis jetzt) und <b>innerhalb</b> (in einem Zeitraum).',
  hero: '{e:Innerhalb einer Woche} bekommen Sie eine Antwort.',
  art: K => {
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    let g = `<rect x="40" y="130" width="440" height="100" rx="14" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>`;
    days.forEach((d, i) => { const x = 72 + i * 62; g += `<text x="${x}" y="160" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="700" fill="var(--mut)">${d}</text><circle cx="${x}" cy="192" r="16" fill="${i === 4 ? 'var(--ok)' : 'var(--line2)'}"/>${i === 4 ? `<path d="M${x - 7} 192l5 6l10 -12" stroke="var(--card)" stroke-width="3.5" fill="none" stroke-linecap="round"/>` : ''}`; });
    g += `<path d="M50 254H470" stroke="var(--ac)" stroke-width="4"/><path d="M50 244v20M470 244v20" stroke="var(--ac)" stroke-width="4"/>`;
    return K.svg(`<rect width="520" height="360" fill="var(--sky1)"/>` + g + K.tag(260, 290, 'innerhalb einer Woche', 'akk') +
      `<g transform="translate(260 70)"><rect x="-44" y="-30" width="88" height="56" rx="6" fill="var(--card)" stroke="var(--der)" stroke-width="3"/><path d="M-44 -30L0 6L44 -30" fill="none" stroke="var(--der)" stroke-width="3"/></g>`,
      'Eine Woche von Montag bis Sonntag. Am Freitag ist ein Haken: Die Antwort kommt innerhalb einer Woche.');
  },
  lemmas: { innerhalb: 'innerhalb', vor: 'vor', seit: 'seit', in: 'in', bei: 'bei', ab: 'ab', bis: 'bis' },

  understand: [
    { type: 'grid', title: 'Wann? – Vergangenheit, jetzt, Zukunft', head: ['Präposition', 'Bedeutung', 'Beispiel'], rows: [
      ['vor + Dativ', 'Zeitpunkt in der Vergangenheit', 'Ich bin {d:vor einem Jahr} gekommen.'],
      ['seit + Dativ', 'von damals bis jetzt', 'Ich wohne {d:seit einem Jahr} hier.'],
      ['in + Dativ', 'Zeitpunkt in der Zukunft', 'Ich komme {d:in einer Stunde}.'],
      ['ab + Dativ', 'Beginn (meist Zukunft)', '{d:Ab nächster Woche} habe ich Urlaub.'],
      ['innerhalb + Genitiv', 'in einem Zeitraum', '{e:Innerhalb eines Monats} …'],
      ['bei + Dativ', 'gleichzeitig mit', '{d:Beim Essen} sieht er fern.'],
      ['während + Genitiv', 'gleichzeitig, eine Zeit lang', '{e:Während der Pause} …'],
      ['bis + Akkusativ', 'Ende', 'Ich warte {a:bis nächsten Montag}.'] ], label: false },
    { type: 'cards', title: 'vor, seit oder in?', min: '12rem', items: [
      { t: 'vor', k: 'd', p: '← vorbei', ex: 'Er ist {d:vor zwei Tagen} angekommen.' },
      { t: 'seit', k: 'ac', p: '← bis jetzt', ex: 'Er ist {d:seit zwei Tagen} hier.' },
      { t: 'in', k: 'ok', p: '→ kommt noch', ex: 'Er kommt {d:in zwei Tagen}.' } ] },
    { type: 'merk', text: 'Vergangenheit: {e:vor} · bis jetzt: {e:seit} · Zukunft: {e:in}' }
  ],

  examples: [
    'Der Zug kommt {e:in zehn Minuten}.',
    'Wir haben uns {e:vor fünf Jahren} kennengelernt.',
    'Ich lerne {e:seit drei Monaten} Deutsch.',
    'Bitte bezahlen Sie {e:innerhalb von 14 Tagen}.',
    '{e:Beim Kochen} höre ich gern Radio.',
    '{e:Ab morgen} mache ich mehr Sport.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'vor, seit oder in?', instr: 'Wähle die passende Präposition.',
      items: [
        'Ich habe ihn ((vor|seit|in)) einer Woche gesehen.', 'Ich kenne ihn ((seit|vor|in)) zehn Jahren.', 'Der Film beginnt ((in|vor|seit)) fünf Minuten.',
        'Sie wohnt ((seit|vor|in)) 2019 in Köln.', '((In|Vor|Seit)) einem Monat habe ich Geburtstag.', 'Er hat ((vor|seit|in)) zwei Stunden angerufen.' ] },
    { id: 'u2', type: 'choice', title: 'Welche Präposition passt?', instr: 'Wähle die richtige Präposition.',
      items: [
        '((Beim|Im|Am)) Frühstück lese ich Zeitung.', 'Bitte antworten Sie ((innerhalb|außerhalb|während)) einer Woche.', '((Ab|Seit|Vor)) Montag habe ich Urlaub.',
        'Ich bleibe ((bis|ab|seit)) Freitag.', '((Während|Seit|Bei)) des Konzerts war es sehr laut.' ] },
    { id: 'u3', type: 'fill', title: 'Dativ', instr: 'Schreib die Endung des Artikels.',
      items: [ 'Ich bin vor ein[[em]] Jahr gekommen.', 'Ich komme in ein[[er]] Stunde.', 'Seit ein[[er]] Woche bin ich krank.', 'Vor d[[em]] Essen wasche ich mir die Hände.' ] }
  ],

  speak: { title: 'Wann war das?', intro: 'Sag es mit vor, seit oder in.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'history', 'vorbei · zwei Jahre'], ['x', 'plane', 'nach Deutschland kommen']], say: 'Ich bin {d:vor zwei Jahren} nach Deutschland gekommen.' },
      { cue: [['x', 'clock', 'bis jetzt · ein Jahr'], ['x', 'book-open', 'Deutsch lernen']], say: 'Ich lerne {d:seit einem Jahr} Deutsch.' },
      { cue: [['x', 'timer', 'Zukunft · eine Stunde'], ['x', 'house', 'nach Hause kommen']], say: 'Ich komme {d:in einer Stunde} nach Hause.' },
      { cue: [['x', 'chef-hat', 'gleichzeitig: kochen'], ['x', 'music', 'Radio hören']], say: '{d:Beim Kochen} höre ich Radio.' } ] }
});
