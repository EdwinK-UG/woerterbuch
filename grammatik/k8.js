/* Kapitel 8 – Trennbare Verben (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 8, level: 'A1', group: 'Verben 1',
  title: 'Trennbare Verben',
  kicker: 'Ich kaufe heute ein.',
  intro: 'Bei trennbaren Verben wie <b>ein|kaufen</b> oder <b>an|rufen</b> wandert der erste Teil – das Präfix – im Satz ans <b>Ende</b>. Das Präfix ist betont: <b>EIN</b>kaufen, <b>AN</b>rufen.',
  hero: 'Ich {v:kaufe} heute im Supermarkt {t:ein}.',
  art: K => {
    const shelf = (x) => `<g><rect x="${x}" y="96" width="150" height="196" rx="6" fill="var(--wood)" opacity=".3"/>${[136, 186, 236].map(y => `<rect x="${x}" y="${y}" width="150" height="6" fill="var(--wood)"/>`).join('')}
${[[8, 'nom'], [30, 'die'], [52, 'das'], [80, 'akk'], [104, 'dat'], [126, 'der']].map(([dx, c], i) => `<rect x="${x + dx}" y="${108 - (i % 2) * 6}" width="16" height="${28 + (i % 2) * 6}" rx="3" fill="var(--${c})" opacity=".85"/><rect x="${x + dx + 4}" y="${164 - (i % 3) * 4}" width="14" height="${22 + (i % 3) * 4}" rx="7" fill="var(--${['das', 'nom', 'die'][i % 3]})" opacity=".8"/><circle cx="${x + dx + 9}" cy="226" r="9" fill="var(--${['die', 'nom', 'das'][i % 3]})" opacity=".85"/>`).join('')}</g>`;
    return K.svg(K.room(false) + shelf(24) + shelf(346) + K.shadow(150) + K.shadow(290, 70) + K.cart(290, 330) +
      K.person({ x: 150, shirt: 'var(--das)', skin: 3, hair: 'short', hc: 'var(--hair2)', beard: 'var(--hair2)', armR: 'out' }) +
      K.bubble(170, 72, 'Ich *kaufe* heute *ein*!', { tail: 'l' }),
      'Ein Mann schiebt einen Einkaufswagen durch den Supermarkt: Ich kaufe heute ein!');
  },
  lemmas: { kaufe: 'einkaufen', stehe: 'aufstehen', kommt: 'ankommen', Rufst: 'anrufen', laden: 'einladen', sehen: 'fernsehen', Kommst: 'mitkommen' },

  understand: [
    { type: 'slots', title: 'Die Satzklammer', rows: [
      [['Ich', 'n', 'Position 1'], ['kaufe', 'v', 'Position 2'], ['heute', 'x', ''], ['im Supermarkt', 'x', ''], ['ein', 'vt', 'Ende']],
      [['Wann', 'q', 'Position 1'], ['rufst', 'v', 'Position 2'], ['du', 'n', ''], ['mich', 'x', ''], ['an', 'vt', 'Ende']],
      [['Stehst', 'v', 'Position 1'], ['du', 'n', ''], ['morgen', 'x', ''], ['früh', 'x', ''], ['auf', 'vt', 'Ende']] ],
      note: 'Der Verbstamm (kaufe, rufst) steht auf <b>Position 2</b> – in Ja/Nein-Fragen auf Position 1. Das <b>Präfix</b> (ein, an, auf) steht am <b>Ende</b>.' },
    { type: 'cards', title: 'Typische trennbare Präfixe', min: '11rem', items: [
      { t: 'an', k: 'n', ws: ['anrufen', 'anfangen', 'ankommen', 'anziehen'] },
      { t: 'auf', k: 'd', ws: ['aufstehen', 'aufmachen', 'aufräumen', 'aufhören'] },
      { t: 'aus', k: 'a', ws: ['aussteigen', 'ausgehen', 'aussehen', 'ausmachen'] },
      { t: 'ein', k: 'ac', ws: ['einkaufen', 'einladen', 'einsteigen', 'einschlafen'] },
      { t: 'mit', k: 'ok', ws: ['mitkommen', 'mitbringen', 'mitnehmen', 'mitmachen'] },
      { t: 'zu · fern · zurück', k: 'w', ws: ['zumachen', 'zuhören', 'fernsehen', 'zurückkommen'] } ] },
    { type: 'grid', title: 'Wann bleibt das Verb zusammen?', head: ['', 'Beispiel'], rows: [
      ['mit Modalverb', 'Ich {v:muss} heute noch {t:einkaufen}.'],
      ['im Infinitiv', 'Ich {v:möchte} am Abend {t:fernsehen}.'],
      ['ohne Modalverb', 'Ich {v:sehe} am Abend {t:fern}.'] ],
      foot: 'Mit Modalverb steht das ganze Verb im Infinitiv am Ende – zusammen geschrieben.' },
    { type: 'note', title: 'Nicht trennbar', text: 'Die Präfixe {e:be-, ver-, er-, ent-, emp-, ge-, zer-, miss-} trennt man nie: Ich bezahle. Er versteht alles. Wir erklären es dir. Sie sind auch nicht betont: be{e:ZAH}len, ver{e:STE}hen.' },
    { type: 'merk', text: 'Betonung auf dem Präfix? Dann ist es trennbar: {e:AN}rufen, {e:EIN}kaufen – aber ver{e:STE}hen.' }
  ],

  examples: [
    'Ich {v:stehe} jeden Morgen um sechs Uhr {t:auf}.',
    'Der Zug {v:kommt} um 9:15 Uhr in Köln {t:an}.',
    '{v:Rufst} du mich heute Abend {t:an}?',
    'Wir {v:laden} unsere Nachbarn zum Essen {t:ein}.',
    'Am Abend {v:sehen} die Kinder {t:fern}.',
    '{v:Kommst} du {t:mit}? – Ja, gern!',
    'Ich muss heute noch {t:einkaufen}.'
  ],

  exercises: [
    { id: 'u1', type: 'order', title: 'Sätze bauen', instr: 'Verb auf Position 2, Präfix ans Ende!',
      items: [
        { tiles: ['Ich', 'stehe', 'um sieben Uhr', 'auf'], end: '.', ok: ['Ich stehe um sieben Uhr auf'] },
        { tiles: ['Wann', 'fängt', 'der Kurs', 'an'], end: '?', ok: ['Wann fängt der Kurs an'] },
        { tiles: ['Wir', 'kaufen', 'am Samstag', 'ein'], end: '.', ok: ['Wir kaufen am Samstag ein'] },
        { tiles: ['Kommst', 'du', 'heute', 'mit'], end: '?', ok: ['Kommst du heute mit'] },
        { tiles: ['Der Bus', 'fährt', 'um acht', 'ab'], end: '.', ok: ['Der Bus fährt um acht ab'] },
        { tiles: ['Ich', 'muss', 'meine Mutter', 'anrufen'], end: '.', ok: ['Ich muss meine Mutter anrufen'] } ] },
    { id: 'u2', type: 'fill', title: 'Das Präfix', instr: 'Ergänze das Präfix am Satzende.',
      items: [
        'Der Film fängt um acht Uhr [[an]].', 'Ich lade dich zu meiner Party [[ein]].', 'Wir steigen am Bahnhof [[aus]].',
        'Sie hört dem Lehrer gut [[zu]].', 'Mein Vater kommt morgen [[zurück]].', 'Nimmst du einen Regenschirm [[mit]]?' ] },
    { id: 'u3', type: 'choice', title: 'Trennbar oder nicht?', instr: 'Wähle den richtigen Satzteil.',
      items: [
        'Ich ((bezahle|zahle be)) mit Karte.', 'Wir ((kommen um acht Uhr an|ankommen um acht Uhr)).', 'Er ((versteht|steht ver)) alles.',
        'Wann ((stehst du auf|aufstehst du))?', 'Ich ((erkläre|kläre er)) dir die Aufgabe.', 'Sie ((räumt ihr Zimmer auf|aufräumt ihr Zimmer)).' ] },
    { id: 'u4', type: 'type', title: 'Schreib den Satz', instr: 'Schreib den Satz mit dem trennbaren Verb.',
      items: [
        { q: '(einkaufen) Ich … heute.', pre: 'Ich', end: '.', ok: ['kaufe heute ein'] },
        { q: '(anrufen) Paul … seine Freundin.', pre: 'Paul', end: '.', ok: ['ruft seine Freundin an'] },
        { q: '(aufstehen) Wann … du?', pre: 'Wann', end: '?', ok: ['stehst du auf'] },
        { q: '(fernsehen) Die Kinder … am Abend.', pre: 'Die Kinder', end: '.', ok: ['sehen am Abend fern'] },
        { q: '(mitbringen) … ihr Getränke?', pre: '', end: '?', ok: ['Bringt ihr Getränke mit'] },
        { q: '(zumachen) … du bitte das Fenster?', pre: '', end: '?', ok: ['Machst du bitte das Fenster zu', 'Machst du das Fenster bitte zu'] } ] }
  ],

  speak: { title: 'Mein Tag', intro: 'Bilde einen Satz mit dem trennbaren Verb.', altLabel: 'Antwort',
    items: [
      { cue: [['n', 'user-round', 'ich'], ['v', '', 'aufstehen'], ['x', 'alarm-clock', '6 Uhr']], say: 'Ich {v:stehe} um sechs Uhr {t:auf}.' },
      { cue: [['n', 'user-round', 'du'], ['v', '', 'anrufen'], ['x', 'phone', 'mich · heute?']], say: '{v:Rufst} du mich heute {t:an}?', alt: 'Ja, ich {v:rufe} dich um acht {t:an}.' },
      { cue: [['n', 'train-front', 'der Zug'], ['v', '', 'ankommen'], ['x', 'clock', '10:30 Uhr']], say: 'Der Zug {v:kommt} um halb elf {t:an}.' },
      { cue: [['n', 'users', 'wir'], ['v', '', 'einkaufen'], ['x', 'calendar', 'am Samstag']], say: 'Wir {v:kaufen} am Samstag {t:ein}.' },
      { cue: [['n', 'users', 'ihr'], ['v', '', 'mitkommen'], ['x', 'circle-help', '?']], say: '{v:Kommt} ihr {t:mit}?', alt: 'Ja, wir {v:kommen} gern {t:mit}!' },
      { cue: [['n', 'user-round', 'ich'], ['v', '', 'müssen + einkaufen'], ['x', 'shopping-cart', 'noch']], say: 'Ich {v:muss} noch {t:einkaufen}.' } ] }
});
