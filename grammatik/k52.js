/* Kapitel 52 – nicht, nichts, noch nicht, nicht mehr (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 52, level: 'B1', group: 'Wörter und Wortbildung',
  title: 'nicht, nichts, noch nicht, nicht mehr',
  kicker: 'Verneinung genau',
  intro: 'Jedes positive Wort hat sein Gegenteil: <b>etwas → nichts</b>, <b>jemand → niemand</b>, <b>immer → nie</b>, <b>schon → noch nicht</b>, <b>noch → nicht mehr</b>. So sagst du genau, was nicht stimmt.',
  hero: 'Hast du {e:schon} gegessen? – Nein, {e:noch nicht}.',
  art: K => {
    const pt = (x, t, c, sub) => `<circle cx="${x}" cy="180" r="12" fill="var(--${c})"/><text x="${x}" y="226" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="22" fill="var(--${c})">${t}</text><text x="${x}" y="250" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" fill="var(--mut)">${sub}</text>`;
    return K.svg(`<rect width="520" height="360" fill="var(--sky1)"/><path d="M40 180H480" stroke="var(--ink)" stroke-width="4"/><path d="M470 170l14 10l-14 10" fill="var(--ink)"/>` +
      `<rect x="200" y="160" width="120" height="40" rx="20" fill="var(--sun)" opacity=".35"/><text x="260" y="284" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" font-weight="800" fill="var(--ink)">JETZT</text>` +
      pt(100, 'noch nicht', 'die', 'Es kommt später.') + pt(260, 'schon / noch', 'akk', 'Es ist jetzt so.') + pt(420, 'nicht mehr', 'der', 'Es ist vorbei.') +
      `<path d="M100 130V100" stroke="var(--hill1)" stroke-width="5" stroke-linecap="round"/><ellipse cx="88" cy="98" rx="12" ry="6" fill="var(--hill1)" transform="rotate(-30 88 98)"/><ellipse cx="112" cy="94" rx="12" ry="6" fill="var(--hill1)" transform="rotate(30 112 94)"/>` + K.tree(260, 140, .45) + `<ellipse cx="420" cy="104" rx="20" ry="10" fill="var(--nom)" transform="rotate(-35 420 104)"/><path d="M404 116L436 92" stroke="var(--wood)" stroke-width="2"/>`,
      'Eine Zeitlinie: noch nicht (später), schon und noch (jetzt), nicht mehr (vorbei).');
  },
  lemmas: { nichts: 'nichts', niemand: 'niemand', nie: 'nie', noch: 'noch', mehr: 'mehr', schon: 'schon' },

  understand: [
    { type: 'grid', title: 'Positiv und negativ', head: ['positiv', 'negativ', 'Beispiel'], rows: [
      ['etwas · alles', '{e:nichts}', 'Ich habe {e:nichts} gekauft.'], ['jemand · alle', '{e:niemand}', '{e:Niemand} ist zu Hause.'],
      ['immer · oft', '{e:nie}', 'Er kommt {e:nie} pünktlich.'], ['schon', '{e:noch nicht}', 'Ich habe {e:noch nicht} gegessen.'],
      ['noch', '{e:nicht mehr}', 'Ich wohne {e:nicht mehr} in Köln.'], ['überall', '{e:nirgends}', 'Ich finde ihn {e:nirgends}.'] ], label: false },
    { type: 'cards', title: 'schon, noch, noch nicht, nicht mehr', min: '13rem', items: [
      { t: 'schon ↔ noch nicht', k: 'b', p: 'Ist es passiert?', ex: 'Ist der Bus {e:schon} da? – Nein, {e:noch nicht}.' },
      { t: 'noch ↔ nicht mehr', k: 'd', p: 'Dauert es an?', ex: 'Arbeitest du {e:noch} bei Siemens? – Nein, {e:nicht mehr}.' } ] },
    { type: 'note', title: 'Kein doppeltes Nein', text: 'Im Deutschen steht nur ein Nein: Ich sehe {e:niemand}. (Nicht: Ich sehe nicht niemand.)' },
    { type: 'merk', text: '{e:schon} ↔ {e:noch nicht} · {e:noch} ↔ {e:nicht mehr} · {e:etwas} ↔ {e:nichts} · {e:jemand} ↔ {e:niemand}' }
  ],

  examples: [
    'Ich habe heute {e:nichts} gegessen.',
    'Ist {e:jemand} da? – Nein, {e:niemand}.',
    'Wir waren {e:noch nie} in Paris.',
    'Er raucht {e:nicht mehr}.',
    'Bist du {e:schon} fertig? – {e:Noch nicht}.',
    'Ich kann meinen Schlüssel {e:nirgends} finden.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Das passende Gegenteil', instr: 'Antworte negativ.',
      items: [
        'Hast du etwas gekauft? – Nein, ich habe ((nichts|nicht|niemand)) gekauft.', 'Ist jemand da? – Nein, ((niemand|nichts|nie)) ist da.',
        'Bist du schon fertig? – Nein, ((noch nicht|nicht mehr|nie)).', 'Wohnst du noch in Berlin? – Nein, ((nicht mehr|noch nicht|nichts)).',
        'Gehst du oft ins Kino? – Nein, ((nie|nichts|niemand)).', 'Hast du schon gefrühstückt? – Nein, ((noch nicht|nicht mehr|nichts)).' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze', instr: 'Schreib nichts, niemand, nie, noch nicht oder nicht mehr.',
      items: [
        'Ich habe Hunger. Ich habe heute [[nichts]] gegessen.', 'Er ist sehr ehrlich. Er lügt [[nie]].', 'Das Kino ist leer. [[Niemand]] ist da.',
        'Früher habe ich geraucht, aber jetzt rauche ich [[nicht mehr]].', 'Der Film beginnt um acht. Es ist sieben – er hat [[noch nicht]] begonnen.', 'Ich spiele kein Klavier [[mehr]], seit ich 15 bin.' ] },
    { id: 'u3', type: 'choice', title: 'schon, noch oder …?', instr: 'Wähle das passende Wort.',
      items: [
        'Ist Paul ((schon|noch nicht)) da? – Ja, seit 10 Minuten.', 'Schläft das Baby ((noch|schon))? – Ja, es ist erst sechs Uhr.',
        'Hast du ((schon|noch)) mal Sushi gegessen? – Nein, ((noch nie|nicht mehr)).', 'Ich bin 30. Ich bin ((kein Kind mehr|noch kein Kind)).',
        'Mein Opa arbeitet ((nicht mehr|noch nicht)). Er ist in Rente.', 'Der Bus ist ((noch nicht|nicht mehr)) da. Wir warten.' ] },
    { id: 'u4', type: 'type', title: 'Sag nein', instr: 'Antworte negativ – mit einem ganzen Satz.',
      items: [
        { q: 'Hast du etwas gesehen?', pre: 'Nein, ich habe', end: ' gesehen.', ok: ['nichts'] },
        { q: 'Hat jemand angerufen?', pre: 'Nein,', end: ' hat angerufen.', ok: ['niemand'] },
        { q: 'Wohnst du noch in Kampala?', pre: 'Nein, ich wohne', end: ' in Kampala.', ok: ['nicht mehr'] },
        { q: 'Hast du schon bezahlt?', pre: 'Nein, ich habe', end: ' bezahlt.', ok: ['noch nicht'] },
        { q: 'Trinkst du immer Kaffee?', pre: 'Nein, ich trinke', end: ' Kaffee.', ok: ['nie'] } ] }
  ],

  speak: { title: 'Nein!', intro: 'Antworte negativ – genau!', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'circle-help', 'Hast du etwas gegessen?']], say: 'Nein, ich habe {e:nichts} gegessen.' },
      { cue: [['x', 'circle-help', 'Ist jemand im Büro?']], say: 'Nein, {e:niemand} ist im Büro.' },
      { cue: [['x', 'circle-help', 'Bist du schon fertig?']], say: 'Nein, {e:noch nicht}.' },
      { cue: [['x', 'circle-help', 'Spielst du noch Fußball?']], say: 'Nein, {e:nicht mehr}.' },
      { cue: [['x', 'circle-help', 'Warst du schon mal in Japan?']], say: 'Nein, {e:noch nie}.' } ] }
});
