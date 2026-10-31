/* Kapitel 23 – Verben mit Dativ (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 23, level: 'A2', group: 'Pronomen, Nomen und Artikel',
  title: 'Verben mit Dativ',
  kicker: 'helfen, danken, gefallen',
  intro: 'Einige Verben haben kein Akkusativ-Objekt, sondern ein <b>Dativ-Objekt</b> – meistens eine Person: Ich helfe <b>dir</b>. Bei <b>gefallen, schmecken, gehören</b> ist die Sache das Subjekt und die Person steht im Dativ.',
  hero: '{n:Lukas} hilft {d:der Nachbarin}. {n:Sie} dankt {d:ihm}.',
  art: K => K.svg(K.street() + K.shadow(160) + K.shadow(360) +
    K.person({ x: 160, shirt: 'var(--dat)', dress: 'var(--dat)', skin: 3, hair: 'bun', hc: 'var(--hair1)', glasses: true, armR: 'chest', face: 'open' }) +
    K.person({ x: 360, shirt: 'var(--nom)', skin: 1, hair: 'short', armL: 'down', armR: 'down',
      extra: '<path d="M-38 -76h22l3 36h-28z" fill="var(--card)" stroke="var(--line)" stroke-width="1.5"/><path d="M-33 -76q6 -12 12 0" stroke="var(--ink)" stroke-width="2" fill="none"/><circle cx="-27" cy="-82" r="6" fill="var(--das)"/>' +
        '<path d="M16 -76h22l3 36h-28z" fill="var(--sun)" stroke="var(--line)" stroke-width="1.5"/><path d="M21 -76q6 -12 12 0" stroke="var(--ink)" stroke-width="2" fill="none"/><rect x="22" y="-90" width="6" height="16" fill="var(--die)"/>' }) +
    K.bubble(140, 98, 'Ich *danke* Ihnen!', { tail: 'c' }) + K.bubble(370, 112, 'Ich *helfe* Ihnen gern!', { tail: 'c' }),
    'Ein junger Mann trägt Einkaufstaschen für eine ältere Nachbarin. Sie sagt: Ich danke Ihnen!'),
  lemmas: { hilft: 'helfen', helfe: 'helfen', dankt: 'danken', danke: 'danken', gefällt: 'gefallen', gehört: 'gehören', schmeckt: 'schmecken', Nachbarin: 'Nachbarin' },

  understand: [
    { type: 'slots', title: 'Subjekt + Verb + Dativ', rows: [
      [['Lukas', 'n', 'Wer?'], ['hilft', 'v', 'Position 2'], ['der Nachbarin', 'd', 'Wem?']],
      [['Die Jacke', 'n', 'Was?'], ['gefällt', 'v', 'Position 2'], ['mir', 'd', 'Wem?']],
      [['Mir', 'd', 'Wem?'], ['schmeckt', 'v', 'Position 2'], ['die Suppe', 'n', 'Was?']] ],
      note: 'Bei <b>gefallen, schmecken, gehören, passen</b> ist die Sache das Subjekt. Die Person steht im Dativ – oft auf Position 1.' },
    { type: 'verbs', title: 'Wichtige Verben mit Dativ', pattern: 'jemandem (Dativ) …', items: [
      ['helfen', 'Kannst du {d:mir} helfen?'], ['danken', 'Ich danke {d:dir}!'], ['gefallen', 'Die Stadt gefällt {d:uns}.'],
      ['gehören', 'Das Handy gehört {d:meiner Schwester}.'], ['schmecken', 'Schmeckt {d:dir} der Kuchen?'], ['passen', 'Die Schuhe passen {d:ihm} nicht.'],
      ['antworten', 'Antworte {d:mir} bitte!'], ['gratulieren', 'Wir gratulieren {d:dir}!'], ['glauben', 'Ich glaube {d:dir}.'],
      ['zuhören', 'Hör {d:mir} bitte zu!'], ['fehlen', 'Du fehlst {d:mir}.'], ['stehen', 'Die Farbe steht {d:dir} gut.'] ] },
    { type: 'grid', title: 'Wie geht es dir?', head: ['', 'Beispiel'], rows: [
      ['Befinden', 'Wie geht es {d:dir}? – {d:Mir} geht es gut.'], ['kalt / warm', '{d:Mir} ist kalt.'], ['Schmerzen', '{d:Mir} tut der Kopf weh.'], ['schlecht', '{d:Mir} ist schlecht.'] ],
      foot: 'Bei vielen Sätzen über Gefühle und den Körper steht die Person im Dativ.' },
    { type: 'note', title: 'Vorsicht bei gefallen und schmecken', text: 'Nicht: Ich gefalle die Jacke. Sondern: {n:Die Jacke} gefällt {d:mir}. Die Sache ist das Subjekt – darum: Die Schuhe gefall{e:en} mir (Plural).' },
    { type: 'merk', text: 'helfen, danken, gefallen, gehören, schmecken – immer mit {d:Dativ}!' }
  ],

  examples: [
    'Kannst {n:du} {d:mir} helfen?',
    '{n:Ich} danke {d:Ihnen} für die Hilfe.',
    'Wie gefällt {d:dir} {n:die Stadt}?',
    '{n:Das Fahrrad} gehört {d:meinem Bruder}.',
    '{n:Die Suppe} schmeckt {d:den Kindern} nicht.',
    '{n:Wir} gratulieren {d:dir} zum Geburtstag!',
    'Wie geht es {d:Ihnen}?'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Dativ!', instr: 'Wähle die richtige Form.',
      items: [
        'Ich helfe ((dir|dich)).', 'Das Kleid gefällt ((mir|mich)).', 'Wir danken ((unserem|unseren)) Lehrer.', 'Das Auto gehört ((meiner|meine)) Mutter.',
        'Schmeckt ((dir|dich)) der Kuchen?', 'Er antwortet ((der|die)) Lehrerin.', 'Ich gratuliere ((dir|dich)) zum Geburtstag!', 'Die Schuhe passen ((ihm|ihn)) nicht.' ] },
    { id: 'u2', type: 'cases', title: 'Wer? Wem? Was?', instr: 'Tippe auf jeden markierten Teil, bis die richtige Farbe erscheint.',
      items: [
        '{n:Der Film} gefällt {d:meiner Freundin}.', '{n:Ich} helfe {d:dem Kind}.', 'Gehört {n:die Tasche} {d:dir}?',
        '{d:Den Kindern} schmeckt {n:die Pizza}.', '{n:Wir} danken {d:euch}!', '{n:Paul} gibt {d:seiner Mutter} {a:eine Blume}.' ] },
    { id: 'u3', type: 'type', title: 'Mit gefallen', instr: 'Sag es mit gefallen. Die Sache ist das Subjekt!',
      items: [
        { q: 'Ich mag die Musik.', pre: 'Die Musik', end: '.', ok: ['gefällt mir'] },
        { q: 'Er mag die Stadt.', pre: 'Die Stadt', end: '.', ok: ['gefällt ihm'] },
        { q: 'Wir mögen das Hotel.', pre: 'Das Hotel', end: '.', ok: ['gefällt uns'] },
        { q: 'Magst du die Schuhe?', pre: '', end: '?', ok: ['Gefallen dir die Schuhe'] },
        { q: 'Sie mag den Film.', pre: 'Der Film', end: '.', ok: ['gefällt ihr'] },
        { q: 'Mögt ihr die Bilder?', pre: '', end: '?', ok: ['Gefallen euch die Bilder'] } ] },
    { id: 'u4', type: 'fill', title: 'Verb und Pronomen', instr: 'Schreib das Verb und das Pronomen in der richtigen Form.',
      items: [
        '(helfen: ich → du) Ich [[helfe]] [[dir]].', '(danken: wir → Sie) Wir [[danken]] [[Ihnen]].', '(gehören: das Buch → er) Das Buch [[gehört]] [[ihm]].',
        '(schmecken: die Suppe → ich) Die Suppe [[schmeckt]] [[mir]].', '(gefallen: die Bilder → wir) Die Bilder [[gefallen]] [[uns]].', '(antworten: du → sie, Singular) Du [[antwortest]] [[ihr]].' ] }
  ],

  speak: { title: 'Sag es!', intro: 'Bilde einen Satz mit einem Dativ-Verb.', altLabel: 'Weiter',
    items: [
      { cue: [['n', 'cake', 'der Kuchen'], ['v', '', 'schmecken'], ['d', 'user-round', 'ich']], say: 'Der Kuchen schmeckt {d:mir}.' },
      { cue: [['n', 'shirt', 'die Jacke'], ['v', '', 'gefallen'], ['d', 'user-round', 'du ?']], say: 'Gefällt {d:dir} die Jacke?', alt: 'Ja, sie gefällt {d:mir} sehr!' },
      { cue: [['n', 'bike', 'das Fahrrad'], ['v', '', 'gehören'], ['d', 'user-round', 'Tom']], say: 'Das Fahrrad gehört {d:Tom}.' },
      { cue: [['n', 'user-round', 'du'], ['v', '', 'helfen'], ['d', 'user-round', 'ich ?']], say: 'Kannst du {d:mir} helfen?', alt: 'Ja, ich helfe {d:dir} gern.' },
      { cue: [['n', 'user-round', 'ich'], ['v', '', 'danken'], ['d', 'user-round', 'Sie']], say: 'Ich danke {d:Ihnen}!' },
      { cue: [['n', 'brain', 'der Kopf'], ['v', '', 'wehtun'], ['d', 'user-round', 'ich']], say: '{d:Mir} tut der Kopf weh.' } ] }
});
