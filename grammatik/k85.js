/* Kapitel 85 – Partizip I als Adjektiv (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 85, level: 'B1', group: 'Adjektive 2',
  title: 'Partizip I als Adjektiv',
  kicker: 'ein lachendes Kind',
  intro: 'Das <b>Partizip I</b> bildest du so: <b>Infinitiv + d</b> (lachen → lachend). Es beschreibt etwas, das <b>gerade passiert</b> und <b>aktiv</b> ist. Vor einem Nomen bekommt es eine Adjektivendung: ein lachend<b>es</b> Kind.',
  hero: 'Ein {e:lachendes} Kind und ein {e:bellender} Hund.',
  art: K => K.svg(K.sky() + K.shadow(170, 34) + K.person({ x: 170, s: .8, shirt: 'var(--die)', skin: 1, hair: 'curly', armL: 'up', armR: 'up', face: 'open' }) +
    K.shadow(360, 50) + K.dog(350, 328, { c: 'var(--nom)' }) +
    `<g stroke="var(--ink)" stroke-width="3" stroke-linecap="round" opacity=".6"><path d="M418 252l14 -8M420 266l18 0M418 280l14 8"/></g>` +
    K.tag(170, 110, 'ein lachendes Kind', 'die') + K.tag(380, 200, 'ein bellender Hund', 'nom'),
    'Ein lachendes Kind und ein bellender Hund.'),
  lemmas: { lachendes: 'lachen', bellender: 'bellen', schlafende: 'schlafen', laufenden: 'laufen', kommende: 'kommen', fliegende: 'fliegen', singend: 'singen' },

  understand: [
    { type: 'grid', title: 'So bildest du das Partizip I', head: ['Infinitiv', 'Partizip I', 'vor dem Nomen'], rows: [
      ['lachen', 'lachen{e:d}', 'ein lachend{e:es} Kind'], ['bellen', 'bellen{e:d}', 'ein bellend{e:er} Hund'], ['schlafen', 'schlafen{e:d}', 'das schlafend{e:e} Baby'],
      ['kommen', 'kommen{e:d}', 'die kommend{e:e} Woche'], ['laufen', 'laufen{e:d}', 'bei laufend{e:em} Motor'] ] },
    { type: 'grid', title: 'Partizip I oder Partizip II?', head: ['', 'Beispiel', 'Bedeutung'], rows: [
      ['Partizip I', 'das {e:kochende} Wasser', 'aktiv, gerade jetzt: Das Wasser kocht.'],
      ['Partizip II', 'das {e:gekochte} Ei', 'passiv oder fertig: Das Ei wurde gekocht.'] ] },
    { type: 'cards', title: 'Partizip I als Relativsatz', min: '14rem', items: [
      { t: 'kurz', k: 'ac', ex: 'ein {e:bellender} Hund' }, { t: 'lang', k: 'n', ex: 'ein Hund, {e:der} {v:bellt}' } ],
      foot: 'Das Partizip I ist eine kurze Form für einen Relativsatz im Präsens. Man liest es oft in Texten.' },
    { type: 'merk', text: 'Infinitiv + {e:d} + Adjektivendung: lachen → lachen{e:d} → ein lachend{e:es} Kind' },
    { type: 'note', title: 'Ohne Nomen', text: 'Ohne Nomen beschreibt das Partizip I, wie jemand etwas tut – ohne Endung: Er kam {e:singend} nach Hause. Sie antwortete {e:lächelnd}.' }
  ],

  examples: [
    'Das {e:schlafende} Baby ist so süß.',
    'In der {e:kommenden} Woche habe ich Urlaub.',
    'Pass auf den {e:fahrenden} Zug auf!',
    'Er hat {e:fließendes} Deutsch gesprochen.',
    'Die {e:wartenden} Gäste werden ungeduldig.',
    'Sie kam {e:lachend} ins Zimmer.'
  ],

  exercises: [
    { id: 'u1', type: 'fill', title: 'Partizip I bilden', instr: 'Schreib das Partizip I (ohne Endung).',
      items: [ 'lachen → [[lachend]]', 'schlafen → [[schlafend]]', 'singen → [[singend]]', 'weinen → [[weinend]]', 'kommen → [[kommend]]', 'spielen → [[spielend]]' ] },
    { id: 'u2', type: 'choice', title: 'Die richtige Endung', instr: 'Wähle die richtige Form.',
      items: [
        'Das ((schlafende|schlafender|schlafendes)) Baby liegt im Bett.', 'Ein ((bellender|bellende|bellendes)) Hund läuft durch den Park.', 'Ich höre ein ((weinendes|weinender|weinende)) Kind.',
        'In der ((kommenden|kommende|kommender)) Woche fliege ich nach Accra.', 'Die ((lachenden|lachende|lachendes)) Kinder spielen draußen.' ] },
    { id: 'u3', type: 'choice', title: 'Partizip I oder II?', instr: 'Aktiv und gerade jetzt – oder passiv/fertig?',
      items: [
        'Vorsicht, ((kochendes|gekochtes)) Wasser! (Es kocht gerade.)', 'Zum Frühstück esse ich ein ((gekochtes|kochendes)) Ei.', 'Das ((spielende|gespielte)) Kind lacht.',
        'Ich suche den ((verlorenen|verlierenden)) Schlüssel.', 'Ein ((laufender|gelaufener)) Mann ruft „Hallo!“' ] },
    { id: 'u4', type: 'type', title: 'Kürzer sagen', instr: 'Schreib das Nomen mit Partizip I.',
      items: [
        { q: 'ein Kind, das lacht', pre: 'ein', end: ' Kind', ok: ['lachendes'] },
        { q: 'ein Hund, der bellt', pre: 'ein', end: ' Hund', ok: ['bellender'] },
        { q: 'das Baby, das schläft', pre: 'das', end: ' Baby', ok: ['schlafende'] },
        { q: 'die Woche, die kommt', pre: 'die', end: ' Woche', ok: ['kommende'] } ] }
  ],

  speak: { title: 'Was siehst du?', intro: 'Beschreib kurz mit Partizip I.', altLabel: 'Lang',
    items: [
      { cue: [['x', 'baby', 'ein Kind · lachen']], say: 'ein {e:lachendes} Kind', alt: 'ein Kind, {e:das} {v:lacht}' },
      { cue: [['x', 'dog', 'ein Hund · bellen']], say: 'ein {e:bellender} Hund', alt: 'ein Hund, {e:der} {v:bellt}' },
      { cue: [['x', 'moon', 'das Baby · schlafen']], say: 'das {e:schlafende} Baby', alt: 'das Baby, {e:das} {v:schläft}' },
      { cue: [['x', 'bird', 'die Vögel · singen']], say: 'die {e:singenden} Vögel', alt: 'die Vögel, {e:die} {v:singen}' } ] }
});
