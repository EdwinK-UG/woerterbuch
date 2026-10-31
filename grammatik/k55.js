/* Kapitel 55 – Plusquamperfekt (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 55, level: 'B1', group: 'Verben 3',
  title: 'Plusquamperfekt',
  kicker: 'Der Zug war schon abgefahren.',
  intro: 'Mit dem Plusquamperfekt erzählst du, was <b>vor</b> einem anderen Ereignis in der Vergangenheit passiert war. Du bildest es wie das Perfekt – nur mit <b>hatte</b> oder <b>war</b>.',
  hero: 'Als ich am Bahnhof ankam, {v:war} der Zug schon {t:abgefahren}.',
  art: K => K.svg(K.grad() + K.clouds() + `<rect y="250" width="520" height="110" fill="var(--metal)" opacity=".6"/><rect y="240" width="520" height="14" fill="var(--card)" opacity=".8"/>
<g transform="translate(330 0)"><rect x="0" y="150" width="150" height="90" rx="14" fill="var(--der)"/><rect x="150" y="150" width="150" height="90" rx="8" fill="var(--der)"/><g fill="var(--sky1)"><rect x="18" y="166" width="34" height="30" rx="5"/><rect x="62" y="166" width="34" height="30" rx="5"/><rect x="106" y="166" width="34" height="30" rx="5"/><rect x="168" y="166" width="34" height="30" rx="5"/></g>
<circle cx="30" cy="242" r="10" fill="var(--ink)"/><circle cx="120" cy="242" r="10" fill="var(--ink)"/></g><g stroke="var(--faint)" stroke-width="3" stroke-linecap="round"><path d="M296 170h24M286 190h30M300 210h20"/></g>` +
    K.shadow(140, 40, 252) + K.person({ x: 140, y: 252, shirt: 'var(--akk)', skin: 1, hair: 'curly', armL: 'out', armR: 'up', face: 'open',
      extra: '<rect x="-56" y="-60" width="34" height="42" rx="6" fill="var(--nom)"/>' }) +
    K.bubble(150, 66, 'Halt! Warte!', { tail: 'c' }) + K.tag(410, 120, 'schon abgefahren', 'der'),
    'Ein Mann rennt mit Koffer auf den Bahnsteig. Der Zug ist schon weg.'),
  lemmas: { abgefahren: 'abfahren', ankam: 'ankommen', hatte: 'haben', gegessen: 'essen', gegangen: 'gehen' },

  understand: [
    { type: 'grid', title: 'So bildest du es', head: ['', 'Perfekt', 'Plusquamperfekt'], rows: [
      ['mit haben', 'Ich {v:habe} {t:gegessen}.', 'Ich {v:hatte} {t:gegessen}.'],
      ['mit sein', 'Der Zug {v:ist} {t:abgefahren}.', 'Der Zug {v:war} {t:abgefahren}.'] ],
      foot: 'hatte / war (Präteritum) + Partizip II. Haben oder sein: wie im Perfekt.' },
    { type: 'cards', title: 'Wann benutze ich es?', min: '14rem', items: [
      { t: 'zuerst', k: 'd', p: 'Plusquamperfekt', ex: 'Ich {v:hatte} schon {t:gegessen}.' },
      { t: 'danach', k: 'ac', p: 'Präteritum oder Perfekt', ex: 'Dann {e:kam} mein Freund.' } ],
      foot: 'Zwei Ereignisse in der Vergangenheit: Das frühere steht im Plusquamperfekt.' },
    { type: 'note', title: 'Oft mit nachdem', text: '{e:Nachdem} ich {t:gegessen} {v:hatte}, ging ich spazieren. (Mehr dazu in Kapitel 78.)' },
    { type: 'merk', text: 'Vorvergangenheit = {v:hatte / war} + {t:Partizip II}.' }
  ],

  examples: [
    'Als wir ankamen, {v:hatte} der Film schon {t:begonnen}.',
    'Sie {v:war} noch nie in Afrika {t:gewesen}.',
    'Ich {v:hatte} meinen Schlüssel {t:vergessen}, deshalb wartete ich draußen.',
    'Er war müde, weil er schlecht {t:geschlafen} {v:hatte}.',
    'Nachdem es aufgehört {v:hatte} zu regnen, gingen wir raus.',
    'Die Gäste {v:waren} schon {t:gegangen}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'hatte oder war?', instr: 'Wähle das richtige Hilfsverb.',
      items: [
        'Ich ((hatte|war)) schon gegessen.', 'Der Zug ((war|hatte)) schon abgefahren.', 'Wir ((hatten|waren)) das Buch schon gelesen.',
        'Sie ((war|hatte)) früh aufgestanden.', 'Er ((hatte|war)) den Schlüssel verloren.', 'Die Kinder ((waren|hatten)) schon eingeschlafen.' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze', instr: 'Schreib hatte oder war in der richtigen Form.',
      items: [
        'Als ich anrief, [[war]] sie schon gegangen.', 'Wir [[hatten]] zu viel gegessen und konnten nicht schlafen.', 'Du [[hattest]] die Tür nicht abgeschlossen.',
        'Ich [[war]] noch nie geflogen – es war mein erster Flug.', 'Ihr [[hattet]] alles vorbereitet.', 'Nachdem er angekommen [[war]], rief er mich an.' ] },
    { id: 'u3', type: 'type', title: 'Was war vorher?', instr: 'Schreib den ersten Teil im Plusquamperfekt.',
      items: [
        { q: 'Ich esse. Dann gehe ich spazieren.', pre: 'Ich', end: '. Dann ging ich spazieren.', ok: ['hatte gegessen'] },
        { q: 'Der Zug fährt ab. Dann komme ich an.', pre: 'Der Zug', end: '. Dann kam ich an.', ok: ['war abgefahren'] },
        { q: 'Wir sehen den Film. Dann lesen wir das Buch.', pre: 'Wir', end: '. Dann lasen wir das Buch.', ok: ['hatten den Film gesehen'] },
        { q: 'Sie steht früh auf. Dann ist sie müde.', pre: 'Sie', end: '. Dann war sie müde.', ok: ['war früh aufgestanden'] } ] },
    { id: 'u4', type: 'choice', title: 'Was passierte zuerst?', instr: 'Welche Handlung war zuerst?',
      items: [
        'Als ich kam, war er schon gegangen. – Zuerst: ((er ging|ich kam))', 'Ich hatte gegessen, dann kam Paul. – Zuerst: ((ich aß|Paul kam))',
        'Nachdem sie geduscht hatte, frühstückte sie. – Zuerst: ((sie duschte|sie frühstückte))', 'Er war müde, weil er gearbeitet hatte. – Zuerst: ((er arbeitete|er war müde))' ] }
  ],

  speak: { title: 'Zu spät!', intro: 'Erzähl, was schon passiert war.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'train-front', 'der Zug · schon abfahren']], say: 'Der Zug {v:war} schon {t:abgefahren}.' },
      { cue: [['x', 'clapperboard', 'der Film · schon beginnen']], say: 'Der Film {v:hatte} schon {t:begonnen}.' },
      { cue: [['x', 'users', 'die Gäste · schon gehen']], say: 'Die Gäste {v:waren} schon {t:gegangen}.' },
      { cue: [['x', 'key-round', 'ich · den Schlüssel · vergessen']], say: 'Ich {v:hatte} den Schlüssel {t:vergessen}.' },
      { cue: [['x', 'utensils', 'wir · schon essen']], say: 'Wir {v:hatten} schon {t:gegessen}.' } ] }
});
