/* Kapitel 59 – dafür, daran, worauf … (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 59, level: 'B1', group: 'Verben 3',
  title: 'dafür, daran, worauf …',
  kicker: 'Präpositionaladverbien',
  intro: 'Bei <b>Sachen</b> ersetzt du „Präposition + Nomen“ durch <b>da(r) + Präposition</b>: auf den Bus → <b>darauf</b>. Die Frage heißt <b>wo(r) + Präposition</b>: <b>Worauf</b> wartest du? Bei <b>Personen</b> bleibt die Präposition + Pronomen: auf ihn, auf wen?',
  hero: '{e:Worauf} wartest du? – Auf den Bus. Ich warte schon lange {e:darauf}.',
  art: K => K.svg(K.street() + K.stop(110, 290) + `<circle cx="430" cy="88" r="34" fill="var(--card)" stroke="var(--ink)" stroke-width="5"/><path d="M430 88V64M430 88l18 10" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>` +
    K.shadow(200) + K.person({ x: 200, shirt: 'var(--akk)', skin: 3, hair: 'curly', hc: 'var(--hair2)', armL: 'hip', armR: 'chest', face: 'flat' }) +
    K.shadow(330) + K.person({ x: 330, shirt: 'var(--nom)', skin: 1, hair: 'bun', armL: 'out', face: 'open' }) +
    K.bubble(330, 96, '*Worauf* wartest du?', { tail: 'c' }) + K.bubble(196, 140, 'Auf den Bus!', { tail: 'c' }),
    'An der Bushaltestelle: Worauf wartest du? – Auf den Bus! Eine große Uhr zeigt, dass es spät ist.'),
  lemmas: { darauf: 'darauf', worauf: 'worauf', dafür: 'dafür', wofür: 'wofür', daran: 'daran', woran: 'woran', damit: 'damit', womit: 'womit', davon: 'davon', wovon: 'wovon' },

  understand: [
    { type: 'grid', title: 'Sache oder Person?', head: ['', 'Sache', 'Person'], rows: [
      ['Frage', '{e:Worauf} wartest du?', '{e:Auf wen} wartest du?'],
      ['Antwort', 'Auf den Bus. – Ich warte {e:darauf}.', 'Auf Lea. – Ich warte {e:auf sie}.'],
      ['Frage', '{e:Wofür} interessierst du dich?', '{e:Für wen} interessierst du dich?'],
      ['Antwort', 'Für Musik. – Ich interessiere mich {e:dafür}.', 'Für Paul. – Ich interessiere mich {e:für ihn}.'] ] },
    { type: 'cards', title: 'So bildest du die Wörter', min: '13rem', items: [
      { t: 'da- / wo-', k: 'ac', p: 'vor Konsonant', ex: 'mit → {e:da}mit / {e:wo}mit · für → {e:da}für / {e:wo}für · von → {e:da}von / {e:wo}von' },
      { t: 'dar- / wor-', k: 'n', p: 'vor Vokal', ex: 'auf → {e:dar}auf / {e:wor}auf · an → {e:dar}an / {e:wor}an · über → {e:dar}über / {e:wor}über · um → {e:dar}um / {e:wor}um' } ] },
    { type: 'cards', title: 'Auch für Orte', min: '11rem', items: [
      { t: 'daneben', k: 'd', ex: 'Hier ist die Post, {e:daneben} die Bank.' }, { t: 'dahinter', k: 'd', ex: 'Das Haus – {e:dahinter} der Garten.' },
      { t: 'davor', k: 'd', ex: 'Das Kino – {e:davor} ein Café.' }, { t: 'darauf', k: 'd', ex: 'Ein Tisch – {e:darauf} eine Vase.' } ] },
    { type: 'merk', text: 'Sache: {e:darauf / worauf}. Person: {e:auf ihn / auf wen}.' }
  ],

  examples: [
    '{e:Worüber} sprecht ihr? – Über den Film.',
    'Der Film war toll. Wir haben lange {e:darüber} gesprochen.',
    '{e:Womit} fährst du? – Mit dem Fahrrad.',
    'Erinnerst du dich an den Urlaub? – Ja, ich denke oft {e:daran}.',
    'Ich habe keine Lust {e:dazu}.',
    'Hier ist das Rathaus, und {e:daneben} ist ein Café.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Frage nach der Sache', instr: 'Wähle das passende Fragewort.',
      items: [
        '((Worauf|Wofür|Woran)) wartest du? – Auf den Zug.', '((Wofür|Worauf|Womit)) interessierst du dich? – Für Kunst.', '((Woran|Worüber|Womit)) denkst du? – An die Prüfung.',
        '((Worüber|Woran|Wofür)) ärgerst du dich? – Über den Regen.', '((Womit|Wovon|Wofür)) schreibst du? – Mit einem Bleistift.', '((Wovon|Womit|Worauf)) träumst du? – Von einer Reise.' ] },
    { id: 'u2', type: 'choice', title: 'Sache oder Person?', instr: 'Wähle die richtige Form.',
      items: [
        'Wartest du auf den Bus? – Ja, ich warte ((darauf|auf ihn)).', 'Wartest du auf Paul? – Ja, ich warte ((auf ihn|darauf)).', 'Denkst du an die Party? – Ja, ich denke ((daran|an sie)).',
        'Denkst du an deine Mutter? – Ja, ich denke ((an sie|daran)).', 'Sprichst du mit dem Chef? – Ja, ich spreche ((mit ihm|damit)).', 'Spielst du mit dem Ball? – Ja, ich spiele ((damit|mit ihm)).' ] },
    { id: 'u3', type: 'fill', title: 'Ergänze', instr: 'Schreib da(r) + Präposition.',
      items: [
        'Freust du dich auf die Ferien? – Ja, ich freue mich sehr [[darauf]].', 'Interessierst du dich für Politik? – Nein, ich interessiere mich nicht [[dafür]].',
        'Hast du an den Termin gedacht? – Oh nein, ich habe nicht [[daran]] gedacht!', 'Bist du mit dem Hotel zufrieden? – Ja, ich bin sehr zufrieden [[damit]].',
        'Hast du von dem Unfall gehört? – Ja, ich habe [[davon]] gehört.', 'Sprecht ihr über das Wetter? – Ja, wir sprechen [[darüber]].' ] },
    { id: 'u4', type: 'type', title: 'Frag nach!', instr: 'Frag nach dem markierten Teil.',
      items: [
        { q: 'Ich warte auf [den Bus].', pre: '', end: '?', ok: ['Worauf wartest du'] },
        { q: 'Ich warte auf [meinen Bruder].', pre: '', end: '?', ok: ['Auf wen wartest du'] },
        { q: 'Ich freue mich über [das Geschenk].', pre: '', end: '?', ok: ['Worüber freust du dich'] },
        { q: 'Ich spreche mit [meiner Lehrerin].', pre: '', end: '?', ok: ['Mit wem sprichst du'] } ] }
  ],

  speak: { title: 'Frag und antworte', intro: 'Frag mit wo(r)- und antworte mit da(r)-.', altLabel: 'Antwort',
    items: [
      { cue: [['x', 'bus', 'warten auf']], say: '{e:Worauf} wartest du?', alt: 'Auf den Bus. Ich warte schon lange {e:darauf}.' },
      { cue: [['x', 'music', 'sich interessieren für']], say: '{e:Wofür} interessierst du dich?', alt: 'Für Musik. Ich interessiere mich sehr {e:dafür}.' },
      { cue: [['x', 'calendar', 'denken an']], say: '{e:Woran} denkst du?', alt: 'An die Prüfung. Ich denke immer {e:daran}.' },
      { cue: [['x', 'message-circle', 'sprechen über']], say: '{e:Worüber} sprecht ihr?', alt: 'Über den Film. Wir sprechen {e:darüber}.' },
      { cue: [['x', 'pen', 'schreiben mit']], say: '{e:Womit} schreibst du?', alt: 'Mit einem Kuli. Ich schreibe {e:damit}.' } ] }
});
