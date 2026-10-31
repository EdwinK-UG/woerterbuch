/* Kapitel 48 – an sein, aus sein, weg sein … (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 48, level: 'A1', group: 'Wörter und Wortbildung',
  title: 'an sein, aus sein, weg sein',
  kicker: 'Das Licht ist an.',
  intro: 'Im Alltag sagt man oft kurz: <b>sein</b> + ein kleines Wort wie <b>an, aus, auf, zu, weg, da, los</b>. So beschreibst du einen Zustand: Das Licht <b>ist an</b> (= eingeschaltet).',
  hero: 'Das Licht {e:ist an}. – Mach es bitte {e:aus}!',
  art: K => {
    const lamp = (x, on) => `<path d="M${x} 0V90" stroke="var(--ink)" stroke-width="3"/>${on ? `<path d="M${x - 90} 260L${x - 34} 120H${x + 34}L${x + 90} 260Z" fill="var(--sun)" opacity=".28"/>` : ''}<path d="M${x - 40} 124q40 -50 80 0z" fill="${on ? 'var(--nom)' : 'var(--metal)'}"/><circle cx="${x}" cy="128" r="10" fill="${on ? 'var(--sun)' : 'var(--line)'}"/>`;
    return K.svg(`<rect width="260" height="360" fill="var(--wall)"/><rect x="260" width="260" height="360" fill="var(--pants)"/><rect y="296" width="520" height="64" fill="var(--floor)"/><rect x="260" y="296" width="260" height="64" fill="var(--ink)" opacity=".35"/>` +
      lamp(130, true) + lamp(390, false) + K.tag(130, 320, 'an', 'nom') + K.tag(390, 320, 'aus', 'der') +
      `<rect x="214" y="172" width="32" height="48" rx="6" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><rect x="223" y="182" width="14" height="14" rx="3" fill="var(--nom)"/><rect x="474" y="172" width="32" height="48" rx="6" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><rect x="483" y="196" width="14" height="14" rx="3" fill="var(--metal)"/>`,
      'Zwei Zimmer: Links ist das Licht an, rechts ist das Licht aus.');
  },
  lemmas: { an: 'an', aus: 'aus', weg: 'weg', los: 'los' },

  understand: [
    { type: 'grid', title: 'Kurze Formen mit sein', head: ['', 'Bedeutung', 'Beispiel'], rows: [
      ['an sein ↔ aus sein', 'eingeschaltet ↔ ausgeschaltet', 'Der Fernseher {e:ist an}. Das Licht {e:ist aus}.'],
      ['auf sein ↔ zu sein', 'geöffnet ↔ geschlossen', 'Das Fenster {e:ist auf}. Die Tür {e:ist zu}.'],
      ['da sein ↔ weg sein', 'anwesend ↔ nicht mehr da', 'Ist Paul {e:da}? – Nein, er {e:ist weg}.'],
      ['los sein', 'passieren', 'Was {e:ist} hier {e:los}?'],
      ['aus sein', 'zu Ende', 'Der Film {e:ist aus}.'] ] },
    { type: 'cards', title: 'Zustand oder Handlung?', min: '14rem', items: [
      { t: 'Zustand: sein', k: 'ac', p: 'So ist es gerade.', ex: 'Das Licht {e:ist an}.' },
      { t: 'Handlung: machen', k: 'n', p: 'Jemand tut etwas.', ex: 'Ich {e:mache} das Licht {e:an}. (= anmachen)' } ] },
    { type: 'merk', text: 'Wie ist es? → {e:ist an / aus / auf / zu / weg}. Was tust du? → {e:mach} … {e:an / aus / auf / zu}.' },
    { type: 'note', title: 'Typisch gesprochen', text: 'Diese Formen sind Alltagssprache. Geschrieben steht oft: eingeschaltet, geöffnet, geschlossen.' }
  ],

  examples: [
    'Ist der Computer noch {e:an}?',
    'Die Bäckerei {e:ist} schon {e:zu}.',
    'Mein Schlüssel {e:ist weg}!',
    'Ist der Chef heute {e:da}?',
    'Was {e:ist} denn {e:los}?',
    'Mach bitte das Fenster {e:auf}, es ist so warm.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Was passt?', instr: 'Wähle das passende Wort.',
      items: [
        'Es ist dunkel, das Licht ist ((aus|an|auf)).', 'Der Supermarkt ist noch ((auf|aus|weg)) – bis 22 Uhr.', 'Mein Handy ist ((weg|zu|an)). Ich finde es nicht!',
        'Der Film ist ((aus|zu|los)). Wir gehen nach Hause.', 'Was ist ((los|weg|da))? Warum weinst du?', 'Ist Frau Kato ((da|los|aus))? – Ja, sie ist im Büro.' ] },
    { id: 'u2', type: 'choice', title: 'Gegenteile', instr: 'Wähle das Gegenteil.',
      items: [
        'an ↔ ((aus|auf|weg))', 'auf ↔ ((zu|aus|an))', 'da ↔ ((weg|zu|los))', 'Das Licht ist an. ↔ Das Licht ist ((aus|zu)).',
        'Die Tür ist offen. ↔ Die Tür ist ((zu|aus)).', 'Er ist noch hier. ↔ Er ist schon ((weg|aus)).' ] },
    { id: 'u3', type: 'fill', title: 'Ergänze', instr: 'Schreib an, aus, auf, zu, weg oder los.',
      items: [
        'Es ist kalt – ist das Fenster [[auf]]?', 'Der Fernseher ist [[an]], aber niemand sieht fern.', 'Die Post ist schon [[zu]]. Sie macht morgen um 9 Uhr auf.',
        'Wo ist mein Geld? Es ist [[weg]]!', 'Hörst du die Musik? Nebenan ist eine Party [[los]].', 'Die Heizung ist [[aus]], darum ist es so kalt.' ] },
    { id: 'u4', type: 'type', title: 'Zustand → Handlung', instr: 'Sag, was jemand tun soll (Imperativ).',
      items: [
        { q: 'Das Licht ist an. (du)', pre: 'Mach das Licht bitte', end: '!', ok: ['aus'] },
        { q: 'Das Fenster ist zu. (du)', pre: 'Mach das Fenster bitte', end: '!', ok: ['auf'] },
        { q: 'Der Fernseher ist aus. (du)', pre: 'Mach den Fernseher bitte', end: '!', ok: ['an'] },
        { q: 'Die Tür ist auf. (du)', pre: 'Mach die Tür bitte', end: '!', ok: ['zu'] } ] }
  ],

  speak: { title: 'Wie ist es gerade?', intro: 'Sag den Zustand – dann bitte jemanden, etwas zu ändern.', altLabel: 'Bitte',
    items: [
      { cue: [['x', 'lightbulb', 'Licht · eingeschaltet']], say: 'Das Licht {e:ist an}.', alt: 'Mach bitte das Licht {e:aus}!' },
      { cue: [['x', 'app-window', 'Fenster · geöffnet']], say: 'Das Fenster {e:ist auf}.', alt: 'Mach bitte das Fenster {e:zu}!' },
      { cue: [['x', 'key-round', 'Schlüssel · nicht mehr da']], say: 'Mein Schlüssel {e:ist weg}!' },
      { cue: [['x', 'store', 'Laden · geschlossen']], say: 'Der Laden {e:ist} schon {e:zu}.' },
      { cue: [['x', 'tv', 'Fernseher · ausgeschaltet']], say: 'Der Fernseher {e:ist aus}.', alt: 'Mach bitte den Fernseher {e:an}!' } ] }
});
