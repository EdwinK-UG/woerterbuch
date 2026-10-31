/* Kapitel 81 – je … desto (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 81, level: 'B1', group: 'Sätze verbinden 2',
  title: 'je … desto',
  kicker: 'Je mehr, desto besser.',
  intro: 'Mit <b>je … desto</b> (oder <b>je … umso</b>) sagst du: Wenn das eine steigt, steigt auch das andere. Beide Teile haben einen <b>Komparativ</b>. Der je-Teil ist ein Nebensatz (Verb am Ende), danach folgt desto + Komparativ + Verb.',
  hero: '{e:Je} mehr ich {v:übe}, {e:desto} besser {v:spreche} ich.',
  art: K => {
    let st = ''; for (let i = 0; i < 5; i++) st += `<rect x="${80 + i * 72}" y="${300 - (i + 1) * 40}" width="72" height="${(i + 1) * 40}" fill="var(--${['der', 'akk', 'nom', 'dat', 'die'][i]})" opacity=".85"/>`;
    return K.svg(K.sky(false) + st + K.person({ x: 368, y: 140, s: .7, shirt: 'var(--das)', skin: 1, hair: 'curly', armL: 'up', armR: 'up', face: 'open' }) +
      K.arrow('M90 240Q260 200 420 70', 'var(--ok)') + K.tag(150, 60, 'je mehr …', 'der') + K.tag(424, 40, '… desto besser!', 'die'),
      'Eine Treppe aus Blöcken, die immer höher wird. Oben jubelt ein Mann: je mehr, desto besser.');
  },
  lemmas: { je: 'je', desto: 'desto', umso: 'umso', übe: 'üben', spreche: 'sprechen' },

  understand: [
    { type: 'slots', title: 'Der Satzbau', rows: [
      [['Je', 'q', ''], ['mehr', 'x', 'Komparativ'], ['ich', 'n', ''], ['übe,', 'v', 'Ende'], ['desto', 'q', ''], ['besser', 'x', 'Komparativ'], ['spreche', 'v', 'Verb'], ['ich', 'n', 'Subjekt']] ],
      note: 'Je-Teil: Verb am Ende. desto-Teil: desto + Komparativ, dann sofort das Verb, dann das Subjekt.' },
    { type: 'grid', title: 'Typische Sätze', head: ['je …', 'desto / umso …'], label: false, rows: [
      ['Je älter er wird,', 'desto ruhiger wird er.'], ['Je früher wir losfahren,', 'desto weniger Stau gibt es.'], ['Je mehr du schläfst,', 'umso fitter bist du.'] ] },
    { type: 'merk', text: '{e:Je} + Komparativ … {v:Verb}, {e:desto} + Komparativ + {v:Verb} + Subjekt' },
    { type: 'note', title: 'Kurz und bekannt', text: 'Als Redewendung oft ohne Verb: {e:Je} mehr, {e:desto} besser! {e:Je} früher, {e:desto} lieber.' }
  ],

  examples: [
    '{e:Je} länger ich in Deutschland {v:wohne}, {e:desto} besser {v:gefällt} es mir.',
    '{e:Je} mehr du {v:liest}, {e:desto} mehr Wörter {v:lernst} du.',
    '{e:Je} später es {v:wird}, {e:desto} müder {v:werde} ich.',
    '{e:Je} teurer das Hotel {v:ist}, {e:umso} besser {v:ist} der Service.',
    '{e:Je} mehr Leute {v:kommen}, {e:desto} lustiger {v:wird} die Party.',
    'Je mehr, desto besser!'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Die richtige Wortstellung', instr: 'Wähle den richtigen zweiten Teil.',
      items: [
        'Je mehr ich lerne, ((desto mehr weiß ich|desto ich weiß mehr|desto mehr ich weiß)).', 'Je älter man wird, ((desto weiser wird man|desto man wird weiser|desto weiser man wird)).',
        'Je schneller du fährst, ((desto gefährlicher ist es|desto es ist gefährlicher|desto gefährlicher es ist)).', 'Je öfter ich übe, ((umso leichter wird es|umso es wird leichter|umso leichter es wird)).' ] },
    { id: 'u2', type: 'fill', title: 'Komparativ', instr: 'Schreib den Komparativ.',
      items: [
        '(viel / gut) Je [[mehr]] du übst, desto [[besser]] wirst du.', '(früh / wenig) Je [[früher]] wir fahren, desto [[weniger]] Stau gibt es.',
        '(alt / ruhig) Je [[älter]] er wird, desto [[ruhiger]] wird er.', '(lang / schön) Je [[länger]] ich hier bin, desto [[schöner]] finde ich es.' ] },
    { id: 'u3', type: 'type', title: 'Ergänze den desto-Teil', instr: 'Schreib den zweiten Teil. Achte auf die Wortstellung!',
      items: [
        { q: 'Je mehr ich schlafe, … (fit sein → fitter)', pre: 'Je mehr ich schlafe, desto', end: '.', ok: ['fitter bin ich'] },
        { q: 'Je mehr du liest, … (gut schreiben → besser)', pre: 'Je mehr du liest, desto', end: '.', ok: ['besser schreibst du'] },
        { q: 'Je später es wird, … (müde werden → müder)', pre: 'Je später es wird, desto', end: '.', ok: ['müder werde ich'] } ] }
  ],

  speak: { title: 'Je mehr, desto …', intro: 'Bilde Sätze mit je … desto.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'book-open', 'mehr üben'], ['x', 'message-circle', 'besser sprechen']], say: '{e:Je} mehr ich {v:übe}, {e:desto} besser {v:spreche} ich.' },
      { cue: [['x', 'moon', 'mehr schlafen'], ['x', 'zap', 'fitter sein']], say: '{e:Je} mehr ich {v:schlafe}, {e:desto} fitter {v:bin} ich.' },
      { cue: [['x', 'clock', 'später werden'], ['x', 'bed', 'müder werden']], say: '{e:Je} später es {v:wird}, {e:desto} müder {v:werde} ich.' },
      { cue: [['x', 'users', 'mehr Leute'], ['x', 'party-popper', 'lustiger']], say: '{e:Je} mehr Leute {v:kommen}, {e:desto} lustiger {v:wird} es.' } ] }
});
