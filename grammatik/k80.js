/* Kapitel 80 – Zweiteilige Konnektoren (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 80, level: 'B1', group: 'Sätze verbinden 2',
  title: 'Zweiteilige Konnektoren',
  kicker: 'entweder … oder, weder … noch',
  intro: 'Manche Konnektoren haben <b>zwei Teile</b>: <b>entweder … oder</b> (eins von zwei), <b>weder … noch</b> (keins von beiden), <b>sowohl … als auch</b> (beides), <b>nicht nur … sondern auch</b> (beides, mit Betonung) und <b>zwar … aber</b> (Einschränkung).',
  hero: 'Ich trinke {e:weder} Kaffee {e:noch} Tee – nur Wasser.',
  art: K => {
    const cup = (x, label, cross) => `<g>${K.cup(x, 230)}<text x="${x}" y="268" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" font-weight="700" fill="var(--ink)">${label}</text>${cross ? `<path d="M${x - 28} 182l56 56M${x + 28} 182l-56 56" stroke="var(--bad)" stroke-width="6" stroke-linecap="round"/>` : ''}</g>`;
    return K.svg(`<rect width="520" height="360" fill="var(--sky1)"/><rect y="280" width="520" height="80" fill="var(--wood)"/>` + cup(110, 'Kaffee', true) + cup(260, 'Tee', true) +
      `<path d="M396 186h28l-4 46h-20z" fill="var(--der)" opacity=".35" stroke="var(--ink)" stroke-width="1.5"/><text x="410" y="268" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" font-weight="700" fill="var(--ink)">Wasser</text><path d="M392 140l12 14l26 -30" stroke="var(--ok)" stroke-width="7" fill="none" stroke-linecap="round"/>` +
      K.tag(185, 90, 'weder … noch', 'die'),
      'Kaffee und Tee sind durchgestrichen, Wasser hat einen Haken: weder Kaffee noch Tee.');
  },
  lemmas: { weder: 'weder', noch: 'noch', entweder: 'entweder', sowohl: 'sowohl', zwar: 'zwar' },

  understand: [
    { type: 'cards', title: 'Die fünf Paare', min: '13rem', items: [
      { t: 'entweder … oder', k: 'ac', s: 'eins von zwei', ex: 'Wir fahren {e:entweder} mit dem Bus {e:oder} mit der Bahn.' },
      { t: 'weder … noch', k: 'b', s: 'keins von beiden', ex: 'Er spricht {e:weder} Französisch {e:noch} Spanisch.' },
      { t: 'sowohl … als auch', k: 'ok', s: 'beides', ex: 'Sie spricht {e:sowohl} Englisch {e:als auch} Suaheli.' },
      { t: 'nicht nur … sondern auch', k: 'n', s: 'beides – das Zweite ist besonders', ex: 'Das Essen ist {e:nicht nur} billig, {e:sondern auch} lecker.' },
      { t: 'zwar … aber', k: 'w', s: 'ja, aber …', ex: 'Die Wohnung ist {e:zwar} klein, {e:aber} sehr schön.' } ] },
    { type: 'note', title: 'weder … noch ist schon negativ', text: 'Kein extra nicht oder kein: Ich habe {e:weder} Zeit {e:noch} Geld. (Nicht: weder keine Zeit …)' },
    { type: 'merk', text: 'eins: {e:entweder … oder} · keins: {e:weder … noch} · beides: {e:sowohl … als auch}' }
  ],

  examples: [
    'Ich trinke {e:entweder} Tee {e:oder} Saft.',
    'Er hat {e:weder} angerufen {e:noch} geschrieben.',
    'Die Stadt ist {e:sowohl} schön {e:als auch} günstig.',
    'Sie spielt {e:nicht nur} Gitarre, {e:sondern auch} Klavier.',
    'Der Film war {e:zwar} lang, {e:aber} spannend.',
    'Wir können {e:entweder} heute {e:oder} morgen kommen.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Der zweite Teil', instr: 'Wähle den passenden zweiten Teil.',
      items: [
        'Entweder du kommst mit, ((oder|noch|aber)) du bleibst zu Hause.', 'Ich habe weder Hunger ((noch|oder|als auch)) Durst.', 'Sie spricht sowohl Deutsch ((als auch|noch|oder)) Englisch.',
        'Er ist nicht nur nett, ((sondern auch|aber auch|oder)) klug.', 'Das Hotel ist zwar teuer, ((aber|oder|noch)) sehr gut.' ] },
    { id: 'u2', type: 'choice', title: 'Welches Paar passt?', instr: 'Wähle das passende Paar.',
      items: [
        'Ich mag beides: ((sowohl Fisch als auch Fleisch|weder Fisch noch Fleisch))', 'Ich esse keins von beiden: ((weder Fisch noch Fleisch|entweder Fisch oder Fleisch))',
        'Nur eins ist möglich: ((entweder heute oder morgen|sowohl heute als auch morgen))', 'Ja, aber …: ((zwar klein, aber gemütlich|weder klein noch gemütlich))' ] },
    { id: 'u3', type: 'type', title: 'Verbinde', instr: 'Verbinde mit dem Paar in Klammern.',
      items: [
        { q: 'Ich habe keine Zeit. Ich habe kein Geld. (weder … noch)', pre: 'Ich habe', end: '.', ok: ['weder Zeit noch Geld'] },
        { q: 'Er spricht Englisch. Er spricht Französisch. (sowohl … als auch)', pre: 'Er spricht', end: '.', ok: ['sowohl Englisch als auch Französisch'] },
        { q: 'Wir fahren mit dem Bus oder mit dem Zug. (entweder … oder)', pre: 'Wir fahren', end: '.', ok: ['entweder mit dem Bus oder mit dem Zug'] } ] }
  ],

  speak: { title: 'Was magst du?', intro: 'Antworte mit einem Paar.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'coffee', 'Kaffee ✗'], ['x', 'coffee', 'Tee ✗']], say: 'Ich trinke {e:weder} Kaffee {e:noch} Tee.' },
      { cue: [['x', 'languages', 'Englisch ✓'], ['x', 'languages', 'Suaheli ✓']], say: 'Ich spreche {e:sowohl} Englisch {e:als auch} Suaheli.' },
      { cue: [['x', 'bus', 'Bus?'], ['x', 'train-front', 'Bahn?']], say: 'Wir fahren {e:entweder} mit dem Bus {e:oder} mit der Bahn.' },
      { cue: [['x', 'house', 'Wohnung · klein'], ['x', 'heart', 'gemütlich']], say: 'Die Wohnung ist {e:zwar} klein, {e:aber} gemütlich.' } ] }
});
