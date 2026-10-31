/* Kapitel 36 – Wo oder wohin? Wechselpräpositionen (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 36, level: 'A2', group: 'Präpositionen 1',
  title: 'Wo oder wohin? Wechselpräpositionen',
  kicker: 'im Kino – ins Kino',
  intro: '<b>in, an, auf, unter, über, vor, hinter, neben, zwischen</b> haben zwei Fälle: Bei <b>Wo?</b> (Position) steht der <b>Dativ</b>. Bei <b>Wohin?</b> (Bewegung zu einem Ziel) steht der <b>Akkusativ</b>.',
  hero: 'Ich gehe {a:ins Kino}. – Jetzt bin ich {d:im Kino}.',
  art: K => K.svg(K.street() +
    `<rect x="250" y="96" width="240" height="192" fill="var(--die)"/><rect x="250" y="96" width="240" height="22" fill="var(--ink)" opacity=".2"/>
<rect x="280" y="128" width="180" height="40" rx="6" fill="var(--ink)"/><text x="370" y="157" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="26" fill="var(--sun)" letter-spacing="6">KINO</text>
${[290, 318, 346, 374, 402, 430].map(x => `<circle cx="${x + 6}" cy="178" r="4" fill="var(--sun)"/>`).join('')}
<rect x="330" y="200" width="80" height="88" rx="4" fill="var(--sky1)" opacity=".9"/><path d="M370 200V288" stroke="var(--ink)" stroke-width="2"/>` +
    K.shadow(140) + K.person({ x: 140, shirt: 'var(--akk)', skin: 4, hair: 'bun', hc: 'var(--hair3)', armR: 'out', face: 'open' }) +
    K.arrow('M190 250Q260 230 322 252', 'var(--akk)') +
    `<g transform="translate(352 288) scale(.55)"><circle cx="0" cy="-160" r="23" fill="var(--skin1)"/><path d="M-23 -162Q-24 -188 0 -188Q24 -188 23 -162Q15 -178 0 -175Q-15 -178-23 -162Z" fill="var(--hair2)"/><path d="M-27 0V-72Q-27 -134 0 -134Q27 -134 27 -72V0Z" fill="var(--dat)"/></g>` +
    K.bubble(140, 96, 'Ich gehe *ins* Kino!', { tail: 'c' }) + K.tag(388, 224, 'im Kino', 'dat') + K.tag(256, 218, 'ins Kino', 'akk'),
    'Eine Frau geht ins Kino. Im Kino sitzt schon ein Mann.'),
  lemmas: { ins: 'in', im: 'in', ans: 'an', am: 'an' },

  understand: [
    { type: 'cards', title: 'Zwei Fragen – zwei Fälle', min: '14rem', items: [
      { t: 'Wo? → Dativ', k: 'd', icon: 'map-pin', p: 'Position: Etwas ist oder passiert an einem Ort.', ex: 'Ich bin {d:im Kino}. Das Buch liegt {d:auf dem Tisch}.' },
      { t: 'Wohin? → Akkusativ', k: 'a', icon: 'move-right', p: 'Bewegung zu einem Ziel: Danach ist etwas an einem neuen Ort.', ex: 'Ich gehe {a:ins Kino}. Ich lege das Buch {a:auf den Tisch}.' } ] },
    { type: 'grid', title: 'Wo? und Wohin? im Vergleich', head: ['', 'Wo? (Dativ)', 'Wohin? (Akkusativ)'], rows: [
      ['in', 'Ich bin {d:im Kino}.', 'Ich gehe {a:ins Kino}.'], ['auf', 'Das Buch liegt {d:auf dem Tisch}.', 'Ich lege das Buch {a:auf den Tisch}.'],
      ['an', 'Das Bild hängt {d:an der Wand}.', 'Ich hänge das Bild {a:an die Wand}.'], ['unter', 'Die Katze schläft {d:unter dem Bett}.', 'Die Katze läuft {a:unter das Bett}.'],
      ['neben', 'Er sitzt {d:neben mir}.', 'Er setzt sich {a:neben mich}.'] ] },
    { type: 'note', title: 'Kurzformen', text: 'Dativ: in dem → {d:im}, an dem → {d:am} · Akkusativ: in das → {a:ins}, an das → {a:ans}' },
    { type: 'merk', text: '{e:Wo?} → {d:Dativ} · {e:Wohin?} → {a:Akkusativ}' }
  ],

  examples: [
    'Wir gehen heute Abend {a:ins Theater}.',
    'Wir sitzen {d:im Theater} in der ersten Reihe.',
    'Leg den Schlüssel bitte {a:auf den Tisch}.',
    'Der Schlüssel liegt {d:auf dem Tisch}.',
    'Die Kinder laufen {a:in den Garten}.',
    'Die Kinder spielen {d:im Garten}.',
    'Stell die Flaschen {a:in den Kühlschrank}!'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Wo oder wohin?', instr: 'Position oder Bewegung? Wähle die richtige Form.',
      items: [
        'Ich gehe ((ins|im)) Kino.', 'Ich bin ((im|ins)) Büro.', 'Leg das Handy auf ((den|dem)) Tisch.', 'Das Handy liegt auf ((dem|den)) Tisch.',
        'Wir fahren an ((das|dem)) Meer.', 'Wir sind ((am|ans)) Meer.', 'Er hängt die Lampe über ((den|dem)) Tisch.', 'Die Lampe hängt über ((dem|den)) Tisch.' ] },
    { id: 'u2', type: 'fill', title: 'Dativ oder Akkusativ?', instr: 'Schreib den Artikel. Frag zuerst: Wo? oder Wohin?',
      items: [
        'Die Kinder laufen in [[den]] Garten. (der Garten)', 'Die Kinder spielen in [[dem]] Garten. (der Garten)', 'Ich setze mich auf [[das]] Sofa. (das Sofa)',
        'Ich sitze auf [[dem]] Sofa. (das Sofa)', 'Sie hängt das Bild an [[die]] Wand. (die Wand)', 'Das Bild hängt an [[der]] Wand. (die Wand)' ] },
    { id: 'u3', type: 'fill', title: 'ins, im, ans oder am?', instr: 'Schreib die Kurzform.',
      items: [
        'Wir gehen [[ins]] Restaurant.', 'Wir essen [[im]] Restaurant.', 'Im Sommer fahren wir [[ans]] Meer.',
        'Wir wohnen [[am]] Meer.', 'Er bringt die Kinder [[ins]] Bett.', 'Die Kinder sind schon [[im]] Bett.' ] },
    { id: 'u4', type: 'type', title: 'Wohin?', instr: 'Antworte mit der Information in Klammern.',
      items: [
        { q: 'Wohin gehst du? (in · die Stadt)', pre: 'Ich gehe', end: '.', ok: ['in die Stadt'] },
        { q: 'Wohin legst du das Buch? (auf · der Tisch)', pre: 'Ich lege das Buch', end: '.', ok: ['auf den Tisch'] },
        { q: 'Wohin hängst du die Uhr? (an · die Wand)', pre: 'Ich hänge die Uhr', end: '.', ok: ['an die Wand'] },
        { q: 'Wo ist das Buch jetzt? (auf · der Tisch)', pre: 'Das Buch liegt', end: '.', ok: ['auf dem Tisch'] },
        { q: 'Wohin läuft die Katze? (unter · das Bett)', pre: 'Die Katze läuft', end: '.', ok: ['unter das Bett'] },
        { q: 'Wo schläft die Katze? (unter · das Bett)', pre: 'Die Katze schläft', end: '.', ok: ['unter dem Bett'] } ] }
  ],

  speak: { title: 'Wo und wohin?', intro: 'Erst die Bewegung (Wohin?), dann die Position (Wo?).', altLabel: 'Wo?',
    items: [
      { cue: [['a', 'clapperboard', 'in · das Kino']], say: 'Ich gehe {a:ins Kino}.', alt: 'Ich bin {d:im Kino}.' },
      { cue: [['a', 'trees', 'in · der Park']], say: 'Wir gehen {a:in den Park}.', alt: 'Wir sind {d:im Park}.' },
      { cue: [['a', 'waves', 'an · das Meer']], say: 'Wir fahren {a:ans Meer}.', alt: 'Wir sind {d:am Meer}.' },
      { cue: [['a', 'table', 'auf · der Tisch']], say: 'Ich lege das Buch {a:auf den Tisch}.', alt: 'Das Buch liegt {d:auf dem Tisch}.' },
      { cue: [['a', 'image', 'an · die Wand']], say: 'Ich hänge das Bild {a:an die Wand}.', alt: 'Das Bild hängt {d:an der Wand}.' },
      { cue: [['a', 'building-2', 'in · die Stadt']], say: 'Sie fährt {a:in die Stadt}.', alt: 'Sie ist {d:in der Stadt}.' } ] }
});
