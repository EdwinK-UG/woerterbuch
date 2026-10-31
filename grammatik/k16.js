/* Kapitel 16 – Verneinung: nicht und kein (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 16, level: 'A1', group: 'Pronomen, Nomen und Artikel',
  title: 'Verneinung: nicht und kein',
  kicker: 'Das ist kein Tee!',
  intro: '<b>kein</b> verneint Nomen mit <b>ein / eine</b> oder ohne Artikel. <b>nicht</b> verneint alles andere: Verben, Adjektive, Nomen mit der/das/die oder mein, Orte und ganze Sätze.',
  hero: 'Das ist {e:kein} Tee – und er ist {e:nicht} heiß!',
  art: K => K.svg(K.room() + K.shadow(200) + K.shadow(390) +
    K.person({ x: 200, shirt: 'var(--die)', skin: 3, hair: 'long', hc: 'var(--hair2)', armR: 'front', face: 'o', extra: K.cup(51, -84) }) +
    K.person({ x: 390, shirt: 'var(--akk)', skin: 1, hair: 'short', armL: 'hip', armR: 'chest', face: 'open' }) +
    K.bubble(170, 76, 'Das ist *kein* Tee!', { tail: 'c' }) + K.bubble(206, 124, 'Und er ist *nicht* heiß!', { tail: 'l' }) + K.bubble(404, 110, 'Oh nein – Kaffee!', { tail: 'c' }),
    'Eine Frau trinkt aus einer Tasse: Das ist kein Tee! Und er ist nicht heiß! Ein Mann sagt: Oh nein – Kaffee!'),
  lemmas: { keine: 'kein', keinen: 'kein', keinem: 'kein' },

  understand: [
    { type: 'cards', title: 'kein oder nicht?', min: '14rem', items: [
      { t: 'kein', k: 'b', icon: 'circle-slash', p: 'Für Nomen mit <b>ein/eine</b> und Nomen <b>ohne Artikel</b>.', ex: 'ein Tee → {e:kein} Tee · Zeit → {e:keine} Zeit · Kinder → {e:keine} Kinder' },
      { t: 'nicht', k: 'f', icon: 'x', p: 'Für Verben, Adjektive, Nomen mit <b>der/das/die</b> oder <b>mein</b>, Orte und ganze Sätze.', ex: 'Ich schlafe {e:nicht}. Das ist {e:nicht} teuer. Das ist {e:nicht} mein Handy.' } ] },
    { type: 'grid', title: 'Die Formen von kein', head: ['', 'maskulin', 'neutral', 'feminin', 'Plural'], rows: [
      ['Nominativ', 'kein Tee', 'kein Brot', 'keine Milch', 'keine Eier'],
      ['Akkusativ', '{e:keinen} Tee', 'kein Brot', 'keine Milch', 'keine Eier'] ],
      foot: 'kein hat die Endungen von ein – und im Plural die Endung -e. Mehr zum Akkusativ in Kapitel 17.' },
    { type: 'grid', title: 'Wo steht nicht?', head: ['', 'Beispiel'], rows: [
      ['am Satzende', 'Ich komme heute {e:nicht}.'],
      ['vor dem Adjektiv', 'Das Essen ist {e:nicht} gut.'],
      ['vor Ort oder Präposition', 'Ich wohne {e:nicht} in Berlin.'],
      ['vor dem Infinitiv', 'Ich kann heute {e:nicht} kommen.'],
      ['vor dem Präfix', 'Ich rufe dich {e:nicht} an.'] ] },
    { type: 'merk', text: 'ein, eine oder kein Artikel → {e:kein}. Alles andere → {e:nicht}.' },
    { type: 'note', title: 'Antwort auf negative Fragen', text: 'Hast du {e:keine} Zeit? – Doch, ich habe Zeit! Mehr dazu in Kapitel 11.' }
  ],

  examples: [
    'Ich habe heute {e:keine} Zeit.',
    'Das ist {e:nicht} mein Fahrrad.',
    'Wir haben {e:kein} Auto.',
    'Der Film ist {e:nicht} lustig.',
    'Er trinkt {e:keinen} Alkohol.',
    'Ich verstehe das {e:nicht}.',
    'Sie wohnt {e:nicht} in Hamburg.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'nicht oder kein?', instr: 'Wähle die richtige Verneinung.',
      items: [
        'Ich habe ((keine|nicht)) Zeit.', 'Das Wetter ist ((nicht|kein)) schön.', 'Er hat ((kein|nicht)) Auto.', 'Ich komme heute ((nicht|kein)).',
        'Das ist ((nicht|kein)) mein Buch.', 'Wir haben ((keine|nicht)) Kinder.', 'Ich verstehe dich ((nicht|kein)).', 'Der Kaffee ist ((nicht|kein)) heiß.' ] },
    { id: 'u2', type: 'fill', title: 'Die richtige Form von kein', instr: 'Schreib kein, keine oder keinen.',
      items: [
        'Das ist [[kein]] Hund, das ist ein Wolf!', 'Ich habe [[keine]] Geschwister.', 'Wir brauchen [[keine]] Milch.',
        'Er hat [[keinen]] Bruder.', 'Das ist [[keine]] gute Idee.', 'Heute gibt es [[kein]] Problem.' ] },
    { id: 'u3', type: 'type', title: 'Sag das Gegenteil', instr: 'Verneine den Satz mit nicht oder kein.',
      items: [
        { q: 'Ich habe ein Fahrrad.', pre: 'Ich habe', end: '.', ok: ['kein Fahrrad'] },
        { q: 'Das Essen ist gut.', pre: 'Das Essen ist', end: '.', ok: ['nicht gut'] },
        { q: 'Er hat eine Schwester.', pre: 'Er hat', end: '.', ok: ['keine Schwester'] },
        { q: 'Ich komme morgen.', pre: 'Ich komme', end: '.', ok: ['morgen nicht'] },
        { q: 'Sie trinkt Kaffee.', pre: 'Sie trinkt', end: '.', ok: ['keinen Kaffee'] },
        { q: 'Das ist mein Schlüssel.', pre: 'Das ist', end: '.', ok: ['nicht mein Schlüssel'] } ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'Wo steht nicht oder kein?',
      items: [
        { tiles: ['Ich', 'habe', 'heute', 'keine Zeit'], end: '.', ok: ['Ich habe heute keine Zeit'] },
        { tiles: ['Das', 'ist', 'nicht', 'mein Handy'], end: '.', ok: ['Das ist nicht mein Handy'] },
        { tiles: ['Wir', 'kommen', 'morgen', 'nicht'], end: '.', ok: ['Wir kommen morgen nicht'] },
        { tiles: ['Er', 'kann', 'heute', 'nicht', 'kommen'], end: '.', ok: ['Er kann heute nicht kommen'] },
        { tiles: ['Sie', 'wohnt', 'nicht', 'in Berlin'], end: '.', ok: ['Sie wohnt nicht in Berlin'] } ] }
  ],

  speak: { title: 'Nein!', intro: 'Antworte mit Nein – mit nicht oder kein.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'circle-help', 'Hast du Zeit?']], say: 'Nein, ich habe {e:keine} Zeit.' },
      { cue: [['x', 'circle-help', 'Ist das dein Handy?']], say: 'Nein, das ist {e:nicht} mein Handy.' },
      { cue: [['x', 'circle-help', 'Kommst du heute?']], say: 'Nein, ich komme heute {e:nicht}.' },
      { cue: [['x', 'circle-help', 'Trinkst du Kaffee?']], say: 'Nein, ich trinke {e:keinen} Kaffee.' },
      { cue: [['x', 'circle-help', 'Ist der Film gut?']], say: 'Nein, der Film ist {e:nicht} gut.' },
      { cue: [['x', 'circle-help', 'Hast du Geschwister?']], say: 'Nein, ich habe {e:keine} Geschwister.', alt: 'Ich bin Einzelkind.' } ] }
});
