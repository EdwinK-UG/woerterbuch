/* Kapitel 10 – W-Fragen (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 10, level: 'A1', group: 'Sätze und Fragen',
  title: 'W-Fragen',
  kicker: 'Wer, wie, wo, was …?',
  intro: 'W-Fragen beginnen mit einem <b>Fragewort</b>: wer, was, wo, wann, wie … Danach kommt das <b>Verb</b> auf Position 2 und dann das <b>Subjekt</b>. Die Antwort ist eine Information – nicht nur ja oder nein.',
  hero: '{e:Wie} {v:heißen} Sie? – Ich heiße Sara Mensah.',
  art: K => K.svg(K.sky(false) + K.shadow(170) + K.shadow(366) +
    K.person({ x: 170, shirt: 'var(--der)', skin: 4, hair: 'short', hc: 'var(--hair3)', glasses: true, armR: 'front',
      extra: '<path d="M51 -96L55 -112" stroke="var(--ink)" stroke-width="6" stroke-linecap="round"/><circle cx="56" cy="-118" r="8" fill="var(--metal)" stroke="var(--ink)" stroke-width="2"/>' }) +
    K.person({ x: 366, shirt: 'var(--das)', dress: 'var(--das)', skin: 1, hair: 'bun', armL: 'chest', face: 'open' }) +
    K.tag(58, 150, 'Wer?', 'nom') + K.tag(250, 44, 'Wann?', 'dat') + K.tag(462, 44, 'Woher?', 'akk') + K.tag(470, 196, 'Was?', 'die') + K.tag(52, 214, 'Wo?', 'der') +
    K.bubble(152, 88, '*Wie* heißen Sie?', { tail: 'c' }) + K.bubble(372, 112, 'Ich heiße Sara Mensah.', { tail: 'c' }),
    'Ein Reporter mit Mikrofon fragt eine Frau: Wie heißen Sie? Um sie herum Fragewörter.'),
  lemmas: { heißen: 'heißen', wohnst: 'wohnen', machst: 'machen', sprichst: 'sprechen', lernst: 'lernen' },

  understand: [
    { type: 'cards', title: 'Die wichtigsten Fragewörter', min: '11.5rem', items: [
      { t: 'wer?', k: 'n', s: 'Person', ex: '{e:Wer} ist das? – Das ist Paul.' },
      { t: 'was?', k: 'a', s: 'Sache · Aktion', ex: '{e:Was} machst du? – Ich koche.' },
      { t: 'wo?', k: 'd', s: 'Ort', ex: '{e:Wo} wohnst du? – In Köln.' },
      { t: 'woher?', k: 'd', s: 'Herkunft', ex: '{e:Woher} kommst du? – Aus Ghana.' },
      { t: 'wohin?', k: 'd', s: 'Richtung · Ziel', ex: '{e:Wohin} fährst du? – Nach Wien.' },
      { t: 'wann?', k: 'w', s: 'Zeit', ex: '{e:Wann} kommst du? – Um acht.' },
      { t: 'wie?', k: 'ac', s: 'Art · Name', ex: '{e:Wie} heißt du? – Sami.' },
      { t: 'wie alt?', k: 'ac', s: 'Alter', ex: '{e:Wie alt} bist du? – 22.' },
      { t: 'wie viel?', k: 'ac', s: 'Menge · Preis', ex: '{e:Wie viel} kostet das? – 5 Euro.' },
      { t: 'warum?', k: 'b', s: 'Grund', ex: '{e:Warum} lernst du Deutsch? – Für die Arbeit.' } ] },
    { type: 'slots', title: 'So ist die W-Frage gebaut', rows: [
      [['Wo', 'q', 'Fragewort'], ['wohnst', 'v', 'Position 2'], ['du', 'n', 'Subjekt']],
      [['Was', 'q', 'Fragewort'], ['macht', 'v', 'Position 2'], ['ihr', 'n', 'Subjekt'], ['heute', 'x', '']],
      [['Wann', 'q', 'Fragewort'], ['beginnt', 'v', 'Position 2'], ['der Film', 'n', 'Subjekt']] ],
      note: 'Fragewort auf <b>Position 1</b>, Verb auf <b>Position 2</b>, dann das Subjekt. Am Ende steht ein Fragezeichen.' },
    { type: 'grid', title: 'wo, woher oder wohin?', head: ['', 'Frage', 'Antwort'], rows: [
      ['wo? · Ort', '{e:Wo} {v:ist} Lena?', 'Lena ist in der Schule.'],
      ['woher? · von dort', '{e:Woher} {v:kommt} Lena?', 'Sie kommt aus der Schule.'],
      ['wohin? · nach dort', '{e:Wohin} {v:geht} Lena?', 'Sie geht in die Schule.'] ] },
    { type: 'note', title: 'wie viel oder wie viele?', text: '{e:Wie viel} + Singular – Dinge, die man nicht zählt: Wie viel Zeit hast du? Wie viel Geld? · {e:Wie viele} + Plural: Wie viele Geschwister hast du?' },
    { type: 'merk', text: 'Fragewort – Verb – Subjekt: {e:Wo} {v:wohnst} du?' }
  ],

  examples: [
    '{e:Wer} {v:ist} die Frau dort?',
    '{e:Was} {v:machst} du am Wochenende?',
    '{e:Wo} {v:ist} die Toilette, bitte?',
    '{e:Woher} {v:kommt} euer Lehrer?',
    '{e:Wann} {v:beginnt} der Deutschkurs?',
    '{e:Wie viele} Sprachen {v:sprichst} du?',
    '{e:Warum} {v:lernst} du Deutsch?'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welches Fragewort passt?', instr: 'Lies die Antwort und wähle das passende Fragewort.',
      items: [
        '((Wo|Wer|Wann)) wohnst du? – In Berlin.', '((Wer|Was|Wie)) ist das? – Das ist mein Bruder.', '((Woher|Wohin|Wo)) kommen Sie? – Aus Ghana.',
        '((Wann|Wie|Wo)) beginnt der Film? – Um acht Uhr.', '((Was|Wer|Wo)) trinkst du? – Einen Tee, bitte.', '((Wie|Was|Wer)) heißt du? – Ich heiße Lea.',
        '((Wohin|Woher|Wo)) fährst du im Urlaub? – Nach Sansibar.', '((Wie viele|Wie viel|Wie)) Kinder haben Sie? – Drei.' ] },
    { id: 'u2', type: 'fill', title: 'Fragewort ergänzen', instr: 'Schreib das passende Fragewort in die Lücke.',
      items: [
        '[[Wie]] alt bist du? – 24.', '[[Warum]] lernst du Deutsch? – Ich möchte in Deutschland studieren.', '[[Wie viel]] kostet das Brot? – Drei Euro.',
        '[[Was]] machst du heute Abend? – Ich koche.', '[[Wer]] spielt mit? – Lena und Tom.', '[[Wo]] arbeitet deine Mutter? – Im Krankenhaus.' ] },
    { id: 'u3', type: 'order', title: 'Fragen bauen', instr: 'Tippe die Teile in der richtigen Reihenfolge an.',
      items: [
        { tiles: ['Wo', 'wohnst', 'du'], end: '?', ok: ['Wo wohnst du'] },
        { tiles: ['Was', 'macht', 'ihr', 'am Samstag'], end: '?', ok: ['Was macht ihr am Samstag'] },
        { tiles: ['Wann', 'beginnt', 'der Unterricht'], end: '?', ok: ['Wann beginnt der Unterricht'] },
        { tiles: ['Woher', 'kommt', 'dein Freund'], end: '?', ok: ['Woher kommt dein Freund'] },
        { tiles: ['Wie viele', 'Sprachen', 'sprichst', 'du'], end: '?', ok: ['Wie viele Sprachen sprichst du'] },
        { tiles: ['Warum', 'kommst', 'du', 'so spät'], end: '?', ok: ['Warum kommst du so spät'] } ] },
    { id: 'u4', type: 'type', title: 'Die passende Frage', instr: 'Hier ist die Antwort. Schreib die Frage dazu (mit du oder ihr – oder höflich mit Sie).',
      items: [
        { q: 'Ich wohne in Kampala.', pre: '', end: '?', ok: ['Wo wohnst du', 'Wo wohnen Sie'] },
        { q: 'Ich komme aus Kenia.', pre: '', end: '?', ok: ['Woher kommst du', 'Woher kommen Sie'] },
        { q: 'Der Kurs beginnt um neun.', pre: '', end: '?', ok: ['Wann beginnt der Kurs'] },
        { q: 'Ich heiße Sami.', pre: '', end: '?', ok: ['Wie heißt du', 'Wie heißen Sie'] },
        { q: 'Er ist 30 Jahre alt.', pre: '', end: '?', ok: ['Wie alt ist er'] },
        { q: 'Wir fahren nach Hamburg.', pre: '', end: '?', ok: ['Wohin fahrt ihr', 'Wohin fahren Sie'] } ] }
  ],

  speak: { title: 'Ein Interview', intro: 'Stell die Frage – erst mit du, dann höflich mit Sie.', altLabel: 'Höflich',
    items: [
      { cue: [['e', 'id-card', 'Name']], say: '{e:Wie} {v:heißt} du?', alt: '{e:Wie} {v:heißen} Sie?' },
      { cue: [['e', 'globe', 'Herkunft']], say: '{e:Woher} {v:kommst} du?', alt: '{e:Woher} {v:kommen} Sie?' },
      { cue: [['e', 'house', 'Wohnort']], say: '{e:Wo} {v:wohnst} du?', alt: '{e:Wo} {v:wohnen} Sie?' },
      { cue: [['e', 'cake', 'Alter']], say: '{e:Wie alt} {v:bist} du?', alt: '{e:Wie alt} {v:sind} Sie?' },
      { cue: [['e', 'briefcase', 'Beruf']], say: '{e:Was} {v:bist} du von Beruf?', alt: '{e:Was} {v:sind} Sie von Beruf?' },
      { cue: [['e', 'languages', 'Sprachen']], say: '{e:Wie viele} Sprachen {v:sprichst} du?', alt: '{e:Wie viele} Sprachen {v:sprechen} Sie?' } ] }
});
