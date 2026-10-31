/* Kapitel 44 – und, aber, oder, denn (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 44, level: 'A1', group: 'Sätze verbinden 1',
  title: 'und, aber, oder, denn',
  kicker: 'Hauptsätze verbinden',
  intro: '<b>und, aber, oder, denn</b> verbinden zwei Hauptsätze. Sie stehen auf <b>Position 0</b> – sie zählen nicht. Danach geht der Satz ganz normal weiter: Subjekt, Verb …',
  hero: 'Ich bin müde, {e:aber} ich komme mit, {e:denn} die Party ist super!',
  art: K => K.svg(K.room() + `<g transform="translate(262 52)"><circle r="26" fill="var(--metal)"/>${Array.from({ length: 10 }, (_, i) => `<rect x="${-22 + (i % 4) * 12}" y="${-20 + Math.floor(i / 4) * 12}" width="9" height="9" fill="var(--card)" opacity="${.4 + (i % 3) * .2}"/>`).join('')}<path d="M0 -26V-52" stroke="var(--ink)" stroke-width="2"/></g>` +
    K.notes(380, 150) + K.notes(110, 140) + K.shadow(170) + K.shadow(370) +
    K.person({ x: 170, shirt: 'var(--das)', skin: 4, hair: 'short', hc: 'var(--hair3)', armR: 'wave', face: 'open' }) +
    K.person({ x: 370, shirt: 'var(--dat)', skin: 1, hair: 'long', hc: 'var(--hair2)', armL: 'chest', face: 'smile' }) +
    K.bubble(170, 104, 'Kommst du mit tanzen?', { tail: 'c' }) + K.bubble(352, 116, 'Ich bin müde, *aber* ich komme!', { tail: 'r' }),
    'Eine Party: Er fragt: Kommst du mit tanzen? Sie sagt: Ich bin müde, aber ich komme!'),
  lemmas: { und: 'und', aber: 'aber', oder: 'oder', denn: 'denn' },

  understand: [
    { type: 'slots', title: 'Position 0', rows: [
      [['Ich bin müde,', 'x', 'Satz 1'], ['aber', 'q', 'Position 0'], ['ich', 'n', 'Position 1'], ['komme', 'v', 'Position 2'], ['mit', 'vt', 'Ende']],
      [['Ich bleibe zu Hause,', 'x', 'Satz 1'], ['denn', 'q', 'Position 0'], ['ich', 'n', 'Position 1'], ['bin', 'v', 'Position 2'], ['krank', 'x', '']] ],
      note: 'Nach und, aber, oder, denn bleibt der Satz wie ein normaler Hauptsatz: Das Verb steht auf Position 2.' },
    { type: 'cards', title: 'Was bedeuten sie?', min: '12rem', items: [
      { t: 'und', k: 'ok', s: 'plus, außerdem', ex: 'Ich koche {e:und} du deckst den Tisch.' },
      { t: 'aber', k: 'b', s: 'Gegensatz', ex: 'Das Hotel ist schön, {e:aber} es ist teuer.' },
      { t: 'oder', k: 'ac', s: 'Alternative', ex: 'Trinkst du Tee {e:oder} möchtest du Kaffee?' },
      { t: 'denn', k: 'n', s: 'Grund', ex: 'Ich esse nichts, {e:denn} ich habe keinen Hunger.' } ] },
    { type: 'note', title: 'Komma', text: 'Vor {e:aber} und {e:denn} steht immer ein Komma. Vor {e:und} und {e:oder} meistens nicht.' },
    { type: 'note', title: 'sondern', text: 'Nach einer Verneinung korrigierst du mit {e:sondern}: Ich komme nicht heute, {e:sondern} morgen.' },
    { type: 'merk', text: 'und, aber, oder, denn = Position 0. Danach: Subjekt – Verb – …' }
  ],

  examples: [
    'Ich lerne Deutsch {e:und} meine Schwester lernt Französisch.',
    'Das Essen ist lecker, {e:aber} sehr scharf.',
    'Fahren wir mit dem Bus {e:oder} gehen wir zu Fuß?',
    'Ich nehme einen Schirm mit, {e:denn} es regnet.',
    'Er wohnt in Köln, {e:aber} er arbeitet in Bonn.',
    'Ich trinke keinen Kaffee, {e:sondern} Tee.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welches Wort passt?', instr: 'Wähle und, aber, oder oder denn.',
      items: [
        'Ich habe Hunger, ((denn|oder|und)) ich habe nicht gefrühstückt.', 'Möchtest du Wasser ((oder|aber|denn)) Saft?', 'Die Wohnung ist schön, ((aber|und|oder)) zu klein.',
        'Ich spiele Gitarre ((und|denn|aber)) mein Bruder spielt Klavier.', 'Wir gehen nicht ins Kino, ((denn|oder|und)) der Film ist schon ausverkauft.', 'Er ist krank, ((aber|oder|denn)) er geht zur Arbeit.' ] },
    { id: 'u2', type: 'order', title: 'Sätze verbinden', instr: 'Tippe den zweiten Satz in der richtigen Reihenfolge an.',
      items: [
        { tiles: ['aber', 'ich', 'habe', 'keine Zeit'], end: '.', ok: ['aber ich habe keine Zeit'] },
        { tiles: ['denn', 'ich', 'bin', 'müde'], end: '.', ok: ['denn ich bin müde'] },
        { tiles: ['oder', 'gehen', 'wir', 'ins Kino'], end: '?', ok: ['oder gehen wir ins Kino'] },
        { tiles: ['und', 'Paul', 'kocht', 'das Essen'], end: '.', ok: ['und Paul kocht das Essen'] },
        { tiles: ['aber', 'heute', 'regnet', 'es'], end: '.', ok: ['aber heute regnet es'] } ] },
    { id: 'u3', type: 'type', title: 'Verbinde die Sätze', instr: 'Verbinde die zwei Sätze mit dem Wort in Klammern.',
      items: [
        { q: 'Ich bleibe zu Hause. Ich bin krank. (denn)', pre: 'Ich bleibe zu Hause,', end: '.', ok: ['denn ich bin krank'] },
        { q: 'Das Auto ist alt. Es fährt gut. (aber)', pre: 'Das Auto ist alt,', end: '.', ok: ['aber es fährt gut'] },
        { q: 'Kommst du? Bleibst du? (oder)', pre: 'Kommst du', end: '?', ok: ['oder bleibst du'] },
        { q: 'Ich koche. Du kaufst ein. (und)', pre: 'Ich koche', end: '.', ok: ['und du kaufst ein'] },
        { q: 'Wir fahren nicht ans Meer. Wir fahren in die Berge. (sondern)', pre: 'Wir fahren nicht ans Meer,', end: '.', ok: ['sondern in die Berge', 'sondern wir fahren in die Berge'] } ] },
    { id: 'u4', type: 'choice', title: 'aber oder sondern?', instr: 'Wähle aber oder sondern.',
      items: [
        'Das Restaurant ist gut, ((aber|sondern)) teuer.', 'Ich trinke nicht Kaffee, ((sondern|aber)) Tee.', 'Sie ist nicht Lehrerin, ((sondern|aber)) Ärztin.',
        'Er ist klein, ((aber|sondern)) stark.', 'Wir fahren nicht heute, ((sondern|aber)) morgen.', 'Ich kann nicht gut singen, ((aber|sondern)) ich singe gern.' ] }
  ],

  speak: { title: 'Verbinde!', intro: 'Sag einen Satz mit und, aber, oder oder denn.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'moon', 'müde sein'], ['e', '', 'aber'], ['x', 'music', 'tanzen gehen']], say: 'Ich bin müde, {e:aber} ich gehe tanzen.' },
      { cue: [['x', 'house', 'zu Hause bleiben'], ['e', '', 'denn'], ['x', 'thermometer', 'krank sein']], say: 'Ich bleibe zu Hause, {e:denn} ich bin krank.' },
      { cue: [['x', 'coffee', 'Tee'], ['e', '', 'oder'], ['x', 'cup-soda', 'Saft']], say: 'Möchtest du Tee {e:oder} Saft?' },
      { cue: [['x', 'chef-hat', 'ich koche'], ['e', '', 'und'], ['x', 'utensils', 'du deckst den Tisch']], say: 'Ich koche {e:und} du deckst den Tisch.' },
      { cue: [['x', 'house', 'Wohnung · schön'], ['e', '', 'aber'], ['x', 'euro', 'teuer']], say: 'Die Wohnung ist schön, {e:aber} teuer.' },
      { cue: [['x', 'calendar', 'nicht heute'], ['e', '', 'sondern'], ['x', 'calendar', 'morgen']], say: 'Ich komme nicht heute, {e:sondern} morgen.' } ] }
});
