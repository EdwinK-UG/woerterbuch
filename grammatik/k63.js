/* Kapitel 63 – Passiv in der Vergangenheit (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 63, level: 'B1', group: 'Verben 3',
  title: 'Passiv in der Vergangenheit',
  kicker: 'wurde gebaut, ist gebaut worden',
  intro: 'Im Präteritum heißt das Passiv <b>wurde + Partizip II</b>. Im Perfekt: <b>ist + Partizip II + worden</b> (ohne ge-!). Mit Modalverb: <b>muss + Partizip II + werden</b>.',
  hero: 'Die Brücke {v:wurde} 1932 {t:gebaut}.',
  art: K => K.svg(K.sky() + `<rect y="250" width="520" height="110" style="fill:color-mix(in srgb,var(--der) 50%,var(--sky2))"/><g fill="none" stroke="var(--card)" stroke-width="3" opacity=".7"><path d="M60 300q12-8 24 0t24 0M380 320q12-8 24 0t24 0"/></g>
<path d="M20 200H500" stroke="var(--wood)" stroke-width="16"/><path d="M60 200Q260 40 460 200" stroke="var(--die)" stroke-width="10" fill="none"/>${[100, 140, 180, 220, 260, 300, 340, 380, 420].map(x => { const y = 200 - (1 - Math.pow((x - 260) / 200, 2)) * 120; return `<path d="M${x} ${y}V200" stroke="var(--die)" stroke-width="4"/>`; }).join('')}
<rect x="40" y="200" width="24" height="70" fill="var(--wood)"/><rect x="456" y="200" width="24" height="70" fill="var(--wood)"/>` +
    K.tag(260, 160, '1932', 'die'),
    'Eine alte Brücke über einen Fluss mit der Jahreszahl 1932.'),
  lemmas: { wurde: 'werden', wurden: 'werden', worden: 'werden', gebaut: 'bauen', renoviert: 'renovieren', erfunden: 'erfinden', gegründet: 'gründen' },

  understand: [
    { type: 'grid', title: 'Passiv in allen Zeiten', head: ['', 'Beispiel'], rows: [
      ['Präsens', 'Die Brücke {v:wird} {t:gebaut}.'], ['Präteritum', 'Die Brücke {v:wurde} 1932 {t:gebaut}.'],
      ['Perfekt', 'Die Brücke {v:ist} 1932 {t:gebaut worden}.'], ['mit Modalverb', 'Die Brücke {v:muss} {t:renoviert werden}.'] ],
      foot: 'Im Perfekt heißt es <b>worden</b> – nicht geworden! Und das Hilfsverb ist immer <b>sein</b>.' },
    { type: 'conj', title: 'werden im Präteritum', verbs: { werden: { f: ['{e:wurde}', 'wurde{e:st}', '{e:wurde}', 'wurde{e:n}', 'wurde{e:t}', 'wurde{e:n}'], n: 'ich und er/sie/es: wurde (ohne Endung).' } } },
    { type: 'merk', text: 'Präteritum: {v:wurde} … {t:gebaut} · Perfekt: {v:ist} … {t:gebaut worden}' },
    { type: 'note', title: 'Typisch in Texten', text: 'Für Geschichte und Nachrichten nimmt man oft das Präteritum: Das Telefon {v:wurde} 1876 {t:erfunden}. Die Firma {v:wurde} 1990 {t:gegründet}.' }
  ],

  examples: [
    'Der Kölner Dom {v:wurde} über 600 Jahre lang {t:gebaut}.',
    'Das Telefon {v:wurde} 1876 {t:erfunden}.',
    'Wann {v:wurde} die Universität {t:gegründet}?',
    'Mein Fahrrad {v:ist} gestern {t:gestohlen worden}.',
    'Die Schule {v:muss} dringend {t:renoviert werden}.',
    'Alle Gäste {v:wurden} {t:eingeladen}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welche Form?', instr: 'Wähle die richtige Form.',
      items: [
        'Das Haus ((wurde|wurden|würde)) 1950 gebaut.', 'Die Briefe ((wurden|wurde|werden)) gestern verschickt.', 'Das Auto ist repariert ((worden|geworden|werden)).',
        'Der Saal muss geputzt ((werden|worden|wurde)).', 'Wir ((wurden|wurde|wurdet)) nicht eingeladen.', 'Das Fenster ist geöffnet ((worden|geworden)).' ] },
    { id: 'u2', type: 'fill', title: 'Präteritum', instr: 'Schreib wurde oder wurden.',
      items: [
        'Amerika [[wurde]] 1492 von Kolumbus erreicht.', 'Die Bilder [[wurden]] im Museum gezeigt.', 'Der Film [[wurde]] in Kenia gedreht.',
        'Die Kinder [[wurden]] von der Schule abgeholt.', 'Das Problem [[wurde]] schnell gelöst.', 'Viele Häuser [[wurden]] renoviert.' ] },
    { id: 'u3', type: 'type', title: 'Ins Perfekt', instr: 'Schreib den Satz im Passiv Perfekt.',
      items: [
        { q: 'Das Auto wurde repariert.', pre: 'Das Auto', end: '.', ok: ['ist repariert worden'] },
        { q: 'Die Brücke wurde gebaut.', pre: 'Die Brücke', end: '.', ok: ['ist gebaut worden'] },
        { q: 'Die Briefe wurden geschrieben.', pre: 'Die Briefe', end: '.', ok: ['sind geschrieben worden'] },
        { q: 'Mein Handy wurde gestohlen.', pre: 'Mein Handy', end: '.', ok: ['ist gestohlen worden'] } ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'Tippe die Teile in der richtigen Reihenfolge an.',
      items: [
        { tiles: ['Die Brücke', 'wurde', '1932', 'gebaut'], end: '.', ok: ['Die Brücke wurde 1932 gebaut'] },
        { tiles: ['Mein Fahrrad', 'ist', 'gestohlen', 'worden'], end: '.', ok: ['Mein Fahrrad ist gestohlen worden'] },
        { tiles: ['Die Schule', 'muss', 'renoviert', 'werden'], end: '.', ok: ['Die Schule muss renoviert werden'] },
        { tiles: ['Wann', 'wurde', 'das Telefon', 'erfunden'], end: '?', ok: ['Wann wurde das Telefon erfunden'] } ] }
  ],

  speak: { title: 'Geschichte', intro: 'Erzähl im Passiv Präteritum.', altLabel: 'Perfekt',
    items: [
      { cue: [['x', 'phone', 'das Telefon · 1876 · erfinden']], say: 'Das Telefon {v:wurde} 1876 {t:erfunden}.', alt: 'Das Telefon {v:ist} 1876 {t:erfunden worden}.' },
      { cue: [['x', 'landmark', 'die Brücke · 1932 · bauen']], say: 'Die Brücke {v:wurde} 1932 {t:gebaut}.', alt: 'Die Brücke {v:ist} 1932 {t:gebaut worden}.' },
      { cue: [['x', 'bike', 'mein Fahrrad · gestern · stehlen']], say: 'Mein Fahrrad {v:wurde} gestern {t:gestohlen}.', alt: 'Mein Fahrrad {v:ist} gestern {t:gestohlen worden}.' },
      { cue: [['x', 'school', 'die Schule · renovieren müssen']], say: 'Die Schule {v:muss} {t:renoviert werden}.' } ] }
});
