/* Kapitel 2 – Präsens: regelmäßige Verben (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 2, level: 'A1', group: 'Verben 1',
  title: 'Präsens: regelmäßige Verben',
  kicker: 'Woher kommst du?',
  intro: 'Im Präsens bekommt das Verb eine <b>Endung</b>, die zur Person passt. Der <b>Stamm</b> bleibt gleich: wohn-en → ich wohn<span class="cs e">e</span>, du wohn<span class="cs e">st</span>, er wohn<span class="cs e">t</span>.',
  hero: '– Woher komm{e:st} du? – Ich komm{e:e} aus Uganda.',
  art: K => K.svg(K.street() + K.shadow(170) + K.shadow(356) +
    K.person({ x: 170, shirt: 'var(--dat)', skin: 4, hair: 'long', hc: 'var(--hair4)', armR: 'front' }) +
    K.person({ x: 356, shirt: 'var(--nom)', skin: 1, hair: 'short', armL: 'wave', face: 'open' }) +
    `<rect x="392" y="280" width="36" height="46" rx="6" fill="var(--akk)"/><path d="M402 280v-9h16v9" stroke="var(--ink)" fill="none" stroke-width="3"/><path d="M398 296h24" stroke="var(--card)" stroke-width="2" opacity=".6"/>` +
    K.bubble(160, 98, 'Woher *kommst* du?', { tail: 'l' }) + K.bubble(372, 126, 'Ich *komme* aus Uganda!', { tail: 'c' }),
    'Zwei Menschen treffen sich. Sie fragt: Woher kommst du? Er antwortet: Ich komme aus Uganda.'),
  lemmas: { komm: 'kommen', wohn: 'wohnen', lern: 'lernen', spiel: 'spielen', mach: 'machen', arbeit: 'arbeiten', heiß: 'heißen' },

  understand: [
    { type: 'conj', title: 'Stamm + Endung', intro: 'Wähle ein Verb. Die Endungen sind markiert.', verbs: {
      wohnen: ['wohne', 'wohnst', 'wohnt', 'wohnen', 'wohnt', 'wohnen'],
      kommen: ['komme', 'kommst', 'kommt', 'kommen', 'kommt', 'kommen'],
      lernen: ['lerne', 'lernst', 'lernt', 'lernen', 'lernt', 'lernen'],
      spielen: ['spiele', 'spielst', 'spielt', 'spielen', 'spielt', 'spielen'],
      arbeiten: { f: ['arbeite', 'arbeitest', 'arbeitet', 'arbeiten', 'arbeitet', 'arbeiten'], n: 'Stamm auf <b>-t</b> oder <b>-d</b>: Vor -st und -t kommt ein <b>-e-</b>. So kann man es besser sprechen: du arbeit<b>e</b>st, er arbeit<b>e</b>t.' },
      finden: { f: ['finde', 'findest', 'findet', 'finden', 'findet', 'finden'], n: 'Wie arbeiten: du find<b>e</b>st, er find<b>e</b>t, ihr find<b>e</b>t.' },
      heißen: { f: ['heiße', 'heißt', 'heißt', 'heißen', 'heißt', 'heißen'], n: 'Stamm auf <b>-s, -ß, -z</b>: Bei du kommt nur <b>-t</b>: du heißt, du tanzt (nicht: heißst).' },
      tanzen: { f: ['tanze', 'tanzt', 'tanzt', 'tanzen', 'tanzt', 'tanzen'], n: 'du tanzt = er tanzt: gleiche Form.' } } },
    { type: 'grid', title: 'Die Endungen im Präsens', head: ['Person', 'Endung', 'Beispiel'], rows: [
      ['ich', '-{e:e}', 'ich wohn{e:e}'], ['du', '-{e:st}', 'du wohn{e:st}'], ['er · sie · es', '-{e:t}', 'sie wohn{e:t}'],
      ['wir', '-{e:en}', 'wir wohn{e:en}'], ['ihr', '-{e:t}', 'ihr wohn{e:t}'], ['sie · Sie', '-{e:en}', 'Sie wohn{e:en}'] ],
      foot: 'Den Stamm findest du so: Infinitiv minus <b>-en</b> (wohn-en) oder minus <b>-n</b> (wander-n → ich wandere).' },
    { type: 'merk', text: 'wir und sie/Sie sehen aus wie der Infinitiv: wir {e:wohnen}, Sie {e:wohnen}.' },
    { type: 'note', title: 'Gleiche Endung, andere Person', text: 'er/sie/es und ihr haben beide -t: er {e:kommt} – ihr {e:kommt}. Das Pronomen zeigt, wer gemeint ist.' }
  ],

  examples: [
    'Ich wohn{e:e} in Kampala.',
    'Wo wohn{e:st} du?',
    'Er lern{e:t} jeden Tag Deutsch.',
    'Wir spiel{e:en} am Samstag Fußball.',
    'Was mach{e:t} ihr heute Abend?',
    'Frau Weber arbeit{e:et} in einer Bank.',
    'Wie heiß{e:t} du?'
  ],

  exercises: [
    { id: 'u1', type: 'fill', title: 'Endungen ergänzen', instr: 'Schreib die richtige Endung in die Lücke.',
      items: [
        'Woher komm[[st]] du?', 'Ich komm[[e]] aus Brasilien.', 'Wo wohn[[t]] ihr?', 'Wir wohn[[en]] in München.',
        'Frau Lee arbeit[[et]] im Krankenhaus.', 'Was lern[[st]] du gerade?', 'Die Kinder spiel[[en]] im Garten.', 'Wie heiß[[t]] du?' ] },
    { id: 'u2', type: 'choice', title: 'Welche Form passt?', instr: 'Wähle die richtige Verbform.',
      items: [
        'Er ((trinkt|trinkst|trinken)) gern Tee.', 'Ihr ((macht|machen|machst)) viel Sport.', 'Wir ((kochen|kocht|koche)) heute Pasta.',
        'Du ((findest|findst|findet)) das Buch gut.', 'Ich ((höre|hört|hörst)) gern Musik.', 'Lara und Jonas ((tanzen|tanzt|tanze)) sehr gut.',
        'Du ((heißt|heißst|heißen)) Sami, oder?', 'Paul ((arbeitet|arbeitt|arbeiten)) heute lange.' ] },
    { id: 'u3', type: 'order', title: 'Sätze bauen', instr: 'Tippe die Teile in der richtigen Reihenfolge an. Der große Anfangsbuchstabe zeigt den Satzanfang.',
      items: [
        { tiles: ['Wo', 'wohnst', 'du'], end: '?', ok: ['Wo wohnst du'] },
        { tiles: ['Ich', 'lerne', 'Deutsch', 'in Berlin'], end: '.', ok: ['Ich lerne Deutsch in Berlin', 'Ich lerne in Berlin Deutsch'] },
        { tiles: ['Wir', 'spielen', 'am Wochenende', 'Tennis'], end: '.', ok: ['Wir spielen am Wochenende Tennis', 'Wir spielen Tennis am Wochenende'] },
        { tiles: ['Was', 'macht', 'ihr', 'heute'], end: '?', ok: ['Was macht ihr heute'] },
        { tiles: ['Woher', 'kommt', 'Frau Silva'], end: '?', ok: ['Woher kommt Frau Silva'] },
        { tiles: ['Er', 'trinkt', 'gern', 'Kaffee'], end: '.', ok: ['Er trinkt gern Kaffee'] } ] },
    { id: 'u4', type: 'fill', title: 'Die ganze Form', instr: 'Schreib das Verb in der richtigen Form.',
      items: [
        '(wohnen) Wo [[wohnt]] ihr?', '(arbeiten) Er [[arbeitet]] in Hamburg.', '(lernen) Wir [[lernen]] zusammen.',
        '(heißen) Wie [[heißt]] du?', '(finden) [[Findest]] du Deutsch schwer?', '(spielen) Die Kinder [[spielen]] im Park.' ] }
  ],

  speak: { title: 'Fragen und Antworten', intro: 'Bilde die Frage. Dann sag eine Antwort.', altLabel: 'Antwort',
    items: [
      { cue: [['n', 'user-round', 'du'], ['x', 'house', 'wohnen'], ['e', 'circle-help', 'Wo?']], say: 'Wo wohn{e:st} du?', alt: 'Ich wohn{e:e} in Kampala.' },
      { cue: [['n', 'users', 'ihr'], ['x', 'plane', 'kommen'], ['e', 'circle-help', 'Woher?']], say: 'Woher komm{e:t} ihr?', alt: 'Wir komm{e:en} aus Kenia.' },
      { cue: [['n', 'user-round', 'Frau Lee'], ['x', 'briefcase', 'arbeiten'], ['e', 'circle-help', 'Wo?']], say: 'Wo arbeit{e:et} Frau Lee?', alt: 'Sie arbeit{e:et} im Krankenhaus.' },
      { cue: [['n', 'user-round', 'du'], ['x', 'book-open', 'lernen'], ['e', 'circle-help', 'Was?']], say: 'Was lern{e:st} du?', alt: 'Ich lern{e:e} Deutsch.' },
      { cue: [['n', 'user-round', 'Sie'], ['x', 'id-card', 'heißen'], ['e', 'circle-help', 'Wie?']], say: 'Wie heiß{e:en} Sie?', alt: 'Ich heiß{e:e} Amara Nansubuga.' },
      { cue: [['n', 'users', 'die Kinder'], ['x', 'volleyball', 'spielen'], ['e', 'circle-help', 'Wo?']], say: 'Wo spiel{e:en} die Kinder?', alt: 'Sie spiel{e:en} im Park.' } ] }
});
