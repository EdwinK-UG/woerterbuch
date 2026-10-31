/* Kapitel 56 – Reflexivpronomen im Dativ (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 56, level: 'B1', group: 'Verben 3',
  title: 'Reflexivpronomen im Dativ',
  kicker: 'Ich wasche mir die Hände.',
  intro: 'Hat ein reflexives Verb noch ein <b>Akkusativ-Objekt</b>, steht das Reflexivpronomen im <b>Dativ</b>: Ich wasche <b>mich</b> – aber: Ich wasche <b>mir</b> die Hände. Nur bei ich und du ändert sich die Form.',
  hero: 'Ich {v:wasche} {d:mir} {a:die Hände}.',
  art: K => K.svg(K.room(false) + `<rect x="300" y="60" width="150" height="120" rx="60" fill="var(--sky1)" stroke="var(--wood)" stroke-width="7"/>
<rect x="270" y="218" width="210" height="24" rx="10" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><rect x="310" y="242" width="130" height="54" fill="var(--metal)" opacity=".5"/><path d="M375 218v-24h22" stroke="var(--metal)" stroke-width="7" fill="none" stroke-linecap="round"/>
<g fill="var(--der)" opacity=".6"><circle cx="388" cy="206" r="3"/><circle cx="380" cy="212" r="2.5"/><circle cx="394" cy="214" r="2"/></g><g fill="var(--card)" stroke="var(--der)" stroke-width="1.5"><circle cx="340" cy="206" r="6"/><circle cx="352" cy="198" r="4"/><circle cx="330" cy="196" r="3"/></g>` +
    K.shadow(230) + K.person({ x: 230, shirt: 'var(--dat)', skin: 1, hair: 'long', hc: 'var(--hair2)', armL: 'front', armR: 'front', face: 'smile' }) +
    K.bubble(180, 90, 'Ich wasche *mir* die Hände.', { tail: 'c' }),
    'Eine Frau wäscht sich am Waschbecken die Hände.'),
  lemmas: { wasche: 'waschen', mir: 'ich', dir: 'du', putze: 'putzen', kaufe: 'kaufen', wünsche: 'wünschen' },

  understand: [
    { type: 'grid', title: 'Akkusativ oder Dativ?', head: ['Person', 'nur sich (Akk.)', 'sich + Objekt (Dat.)'], rows: [
      ['ich', 'Ich wasche {a:mich}.', 'Ich wasche {d:mir} die Hände.'], ['du', 'Du wäschst {a:dich}.', 'Du wäschst {d:dir} die Hände.'],
      ['er · sie · es', 'Er wäscht {a:sich}.', 'Er wäscht {d:sich} die Hände.'], ['wir', 'Wir waschen {a:uns}.', 'Wir waschen {d:uns} die Hände.'],
      ['ihr', 'Ihr wascht {a:euch}.', 'Ihr wascht {d:euch} die Hände.'], ['sie · Sie', 'Sie waschen {a:sich}.', 'Sie waschen {d:sich} die Hände.'] ], hl: [0, 1],
      foot: 'Nur bei <b>ich</b> und <b>du</b> gibt es einen Unterschied: mich → mir, dich → dir.' },
    { type: 'verbs', title: 'Typische Verben', pattern: 'sich (Dativ) + etwas (Akkusativ)', items: [
      ['sich waschen', 'Ich wasche {d:mir} {a:die Haare}.'], ['sich putzen', 'Putz {d:dir} {a:die Zähne}!'], ['sich kämmen', 'Er kämmt {d:sich} {a:die Haare}.'],
      ['sich kaufen', 'Ich kaufe {d:mir} {a:ein Eis}.'], ['sich wünschen', 'Ich wünsche {d:mir} {a:einen Hund}.'], ['sich ansehen', 'Wir sehen {d:uns} {a:den Film} an.'],
      ['sich vorstellen', 'Stell {d:dir} {a:das} vor!'], ['sich merken', 'Ich kann {d:mir} {a:keine Namen} merken.'], ['sich brechen', 'Sie hat {d:sich} {a:das Bein} gebrochen.'] ] },
    { type: 'merk', text: 'Gibt es noch ein Akkusativ-Objekt? Dann {d:mir} / {d:dir} statt {a:mich} / {a:dich}.' },
    { type: 'note', title: 'Körperteile', text: 'Bei Körperteilen benutzt man im Deutschen den Artikel, nicht mein: Ich putze {d:mir} {a:die Zähne}. (Nicht: Ich putze meine Zähne – das ist möglich, klingt aber weniger natürlich.)' }
  ],

  examples: [
    'Ich putze {d:mir} jeden Abend {a:die Zähne}.',
    'Was wünschst du {d:dir} zum Geburtstag?',
    'Ich kaufe {d:mir} {a:eine neue Jacke}.',
    'Kannst du {d:dir} {a:meine Telefonnummer} merken?',
    'Wir sehen {d:uns} {a:die Stadt} an.',
    'Er hat {d:sich} {a:den Arm} gebrochen.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'mich oder mir?', instr: 'Gibt es ein Akkusativ-Objekt?',
      items: [
        'Ich wasche ((mich|mir)).', 'Ich wasche ((mir|mich)) die Haare.', 'Du musst ((dir|dich)) die Zähne putzen.', 'Beeil ((dich|dir))!',
        'Ich kaufe ((mir|mich)) ein Buch.', 'Ich freue ((mich|mir)) auf die Ferien.', 'Stell ((dir|dich)) vor: Ich habe gewonnen!', 'Zieh ((dich|dir)) warm an!' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze', instr: 'Schreib das Reflexivpronomen.',
      items: [
        '(ich) Ich putze [[mir]] die Zähne.', '(du) Was wünschst du [[dir]]?', '(er) Er kämmt [[sich]] die Haare.',
        '(wir) Wir sehen [[uns]] die Fotos an.', '(ihr) Habt ihr [[euch]] die Hände gewaschen?', '(du) Kannst du [[dir]] das merken?' ] },
    { id: 'u3', type: 'type', title: 'Bilde Sätze', instr: 'Schreib den Satz mit dem Reflexivpronomen im Dativ.',
      items: [
        { q: '(sich die Hände waschen) Ich …', pre: 'Ich', end: '.', ok: ['wasche mir die Hände'] },
        { q: '(sich ein Eis kaufen) Du …', pre: 'Du', end: '.', ok: ['kaufst dir ein Eis'] },
        { q: '(sich die Zähne putzen) Er …', pre: 'Er', end: '.', ok: ['putzt sich die Zähne'] },
        { q: '(sich einen Hund wünschen) Ich …', pre: 'Ich', end: '.', ok: ['wünsche mir einen Hund'] } ] },
    { id: 'u4', type: 'cases', title: 'Dativ oder Akkusativ?', instr: 'Tippe auf die markierten Teile, bis die richtige Farbe erscheint.',
      items: [
        '{n:Ich} wasche {d:mir} {a:die Hände}.', '{n:Ich} wasche {a:mich}.', '{n:Du} kaufst {d:dir} {a:ein Fahrrad}.',
        '{n:Er} freut {a:sich}.', 'Was wünschst {n:du} {d:dir}?', '{n:Wir} sehen {d:uns} {a:den Film} an.' ] }
  ],

  speak: { title: 'Mein Abend', intro: 'Bilde Sätze mit mir oder dir.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'hand', 'sich die Hände waschen']], say: 'Ich wasche {d:mir} {a:die Hände}.' },
      { cue: [['x', 'smile', 'sich die Zähne putzen']], say: 'Ich putze {d:mir} {a:die Zähne}.' },
      { cue: [['x', 'gift', 'du · sich etwas wünschen?']], say: 'Was wünschst du {d:dir}?', alt: 'Ich wünsche {d:mir} {a:ein Fahrrad}.' },
      { cue: [['x', 'ice-cream-cone', 'sich ein Eis kaufen']], say: 'Ich kaufe {d:mir} {a:ein Eis}.' },
      { cue: [['x', 'clapperboard', 'wir · sich einen Film ansehen']], say: 'Wir sehen {d:uns} {a:einen Film} an.' } ] }
});
