/* Kapitel 75 – Relativsätze (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 75, level: 'B1', group: 'Sätze verbinden 2',
  title: 'Relativsätze',
  kicker: 'die Frau, die neben mir wohnt',
  intro: 'Ein Relativsatz <b>beschreibt ein Nomen</b> genauer. Er beginnt mit einem <b>Relativpronomen</b> (der, die, das …) und das Verb steht am <b>Ende</b>. Das <b>Genus</b> kommt vom Nomen, der <b>Fall</b> vom Verb im Relativsatz.',
  hero: 'Das ist die Frau, {e:die} neben mir {v:wohnt}.',
  art: K => K.svg(K.sky() + `<g><rect x="250" y="80" width="220" height="216" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><path d="M236 86L360 20L484 86Z" fill="var(--der)"/>
<rect x="276" y="110" width="66" height="60" rx="4" fill="var(--sky1)" stroke="var(--wood)" stroke-width="4"/><rect x="380" y="110" width="66" height="60" rx="4" fill="var(--sky1)" stroke="var(--wood)" stroke-width="4"/><rect x="340" y="210" width="44" height="86" rx="4" fill="var(--wood)"/>
<g transform="translate(413 170)"><circle cx="0" cy="-34" r="14" fill="var(--skin4)"/><path d="M-14 -36q0-16 14-16t14 16q-6-8-14-7t-14 7z" fill="var(--hair3)"/><path d="M-18 0q0-20 18-20t18 20z" fill="var(--die)"/><path d="M12 -20l12 -14" stroke="var(--die)" stroke-width="6" stroke-linecap="round"/></g></g>` +
    K.shadow(140) + K.person({ x: 140, shirt: 'var(--akk)', skin: 1, hair: 'short', armR: 'out', face: 'open' }) +
    K.bubble(176, 92, 'Das ist die Frau, *die* neben mir *wohnt*.', { tail: 'l', w: 300 }),
    'Ein Mann zeigt auf ein Haus. Am Fenster winkt eine Frau: Das ist die Frau, die neben mir wohnt.'),
  lemmas: { die: 'der', den: 'der', dem: 'der', denen: 'der', deren: 'der', dessen: 'der' },

  understand: [
    { type: 'grid', title: 'Die Relativpronomen', head: ['', 'maskulin', 'neutral', 'feminin', 'Plural'], rows: [
      ['Nominativ', 'der', 'das', 'die', 'die'], ['Akkusativ', '{e:den}', 'das', 'die', 'die'], ['Dativ', '{e:dem}', '{e:dem}', '{e:der}', '{e:denen}'], ['Genitiv', '{e:dessen}', '{e:dessen}', '{e:deren}', '{e:deren}'] ],
      foot: 'Fast wie der Artikel – nur Dativ Plural (<b>denen</b>) und Genitiv (<b>dessen, deren</b>) sind anders.' },
    { type: 'slots', title: 'So ist der Relativsatz gebaut', rows: [
      [['Das ist der Mann,', 'x', 'Hauptsatz'], ['der', 'q', 'Relativpronomen'], ['immer', 'x', ''], ['pünktlich', 'x', ''], ['kommt', 'v', 'Ende']],
      [['Das ist der Film,', 'x', 'Hauptsatz'], ['den', 'q', 'Akkusativ'], ['ich', 'n', ''], ['so', 'x', ''], ['liebe', 'v', 'Ende']] ] },
    { type: 'cards', title: 'Genus vom Nomen – Fall vom Verb', min: '14rem', items: [
      { t: 'der Mann … der', k: 'n', p: 'Er (Nominativ) wohnt hier.', ex: 'der Mann, {e:der} hier {v:wohnt}' },
      { t: 'der Mann … den', k: 'a', p: 'Ich kenne ihn (Akkusativ).', ex: 'der Mann, {e:den} ich {v:kenne}' },
      { t: 'der Mann … dem', k: 'd', p: 'Ich helfe ihm (Dativ).', ex: 'der Mann, {e:dem} ich {v:helfe}' } ] },
    { type: 'merk', text: 'Komma – Relativpronomen (Genus vom Nomen, Fall vom Verb) – … – Verb am Ende.' }
  ],

  examples: [
    'Das ist der Bus, {e:der} zum Flughafen {v:fährt}.',
    'Wie heißt das Buch, {e:das} du {v:liest}?',
    'Die Frau, {e:die} dort {v:steht}, ist meine Lehrerin.',
    'Ich suche den Schlüssel, {e:den} ich gestern {v:verloren habe}.',
    'Das sind die Kinder, {e:denen} ich Deutsch {v:beibringe}.',
    'Kennst du den Mann, {e:dessen} Auto vor der Tür {v:steht}?'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welches Relativpronomen?', instr: 'Wähle das richtige Pronomen.',
      items: [
        'Das ist der Mann, ((der|den|dem)) neben mir wohnt.', 'Das ist der Mann, ((den|der|dem)) ich gestern gesehen habe.', 'Das ist der Mann, ((dem|der|den)) ich geholfen habe.',
        'Das ist das Auto, ((das|der|dem)) ich kaufen möchte.', 'Das ist die Frau, ((die|der|den)) Deutsch unterrichtet.', 'Das sind die Freunde, ((denen|die|den)) ich vertraue.',
        'Wo ist die Tasche, ((die|der|das)) ich dir geschenkt habe?', 'Das ist das Mädchen, ((dessen|deren|das)) Vater Arzt ist.' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze', instr: 'Schreib das Relativpronomen.',
      items: [
        'Der Film, [[den]] wir gestern gesehen haben, war toll.', 'Die Stadt, [[die]] mir am besten gefällt, ist Wien.', 'Das Kind, [[das]] dort spielt, ist mein Neffe.',
        'Der Kollege, [[dem]] ich das Buch gegeben habe, kommt aus Ghana.', 'Die Nachbarn, [[die]] neben uns wohnen, sind sehr nett.', 'Die Leute, [[denen]] das Haus gehört, wohnen in Köln.' ] },
    { id: 'u3', type: 'type', title: 'Verbinde die Sätze', instr: 'Verbinde die Sätze mit einem Relativsatz.',
      items: [
        { q: 'Das ist die Frau. Sie wohnt neben mir.', pre: 'Das ist die Frau,', end: '.', ok: ['die neben mir wohnt'] },
        { q: 'Das ist der Film. Ich liebe ihn.', pre: 'Das ist der Film,', end: '.', ok: ['den ich liebe'] },
        { q: 'Das ist das Kind. Ich helfe ihm.', pre: 'Das ist das Kind,', end: '.', ok: ['dem ich helfe'] },
        { q: 'Das sind die Schuhe. Ich habe sie gekauft.', pre: 'Das sind die Schuhe,', end: '.', ok: ['die ich gekauft habe'] } ] }
  ],

  speak: { title: 'Wer ist das?', intro: 'Beschreib die Person mit einem Relativsatz.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'user-round', 'die Frau'], ['x', 'house', 'neben mir wohnen']], say: 'Das ist die Frau, {e:die} neben mir {v:wohnt}.' },
      { cue: [['x', 'user-round', 'der Mann'], ['x', 'eye', 'ich · gestern sehen']], say: 'Das ist der Mann, {e:den} ich gestern {v:gesehen habe}.' },
      { cue: [['x', 'baby', 'das Kind'], ['x', 'hand-helping', 'ich · helfen']], say: 'Das ist das Kind, {e:dem} ich {v:helfe}.' },
      { cue: [['x', 'bus', 'der Bus'], ['x', 'plane', 'zum Flughafen fahren']], say: 'Das ist der Bus, {e:der} zum Flughafen {v:fährt}.' },
      { cue: [['x', 'users', 'die Freunde'], ['x', 'heart', 'ich · vertrauen (Dat.)']], say: 'Das sind die Freunde, {e:denen} ich {v:vertraue}.' } ] }
});
