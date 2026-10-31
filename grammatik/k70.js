/* Kapitel 70 – Adjektive als Nomen (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 70, level: 'B1', group: 'Nomen 2',
  title: 'Adjektive als Nomen',
  kicker: 'der Jugendliche, ein Jugendlicher',
  intro: 'Manche Nomen kommen von Adjektiven: jugendlich → <b>der Jugendliche</b>, erwachsen → <b>die Erwachsenen</b>. Sie werden großgeschrieben, haben aber <b>Adjektivendungen</b>: der Jugendlich<b>e</b>, ein Jugendlich<b>er</b>.',
  hero: 'Die {e:Jugendlichen} spielen Fußball, die {e:Erwachsenen} schauen zu.',
  art: K => K.svg(K.sky() + `<rect x="360" y="230" width="140" height="76" fill="var(--card)" stroke="var(--line)" stroke-width="3"/><path d="M370 240h120M370 260h120M370 280h120M390 230v76M430 230v76M470 230v76" stroke="var(--line)" stroke-width="1.5"/>` +
    K.shadow(120, 34) + K.person({ x: 120, s: .85, shirt: 'var(--akk)', skin: 1, hair: 'curly', armL: 'up', armR: 'out', face: 'open' }) +
    K.shadow(230, 34) + K.person({ x: 230, s: .85, shirt: 'var(--die)', skin: 4, hair: 'long', hc: 'var(--hair4)', armR: 'up', face: 'open' }) +
    `<circle cx="180" cy="312" r="13" fill="var(--card)" stroke="var(--ink)" stroke-width="2"/><path d="M168 308q12 6 24 0M174 300q6 10 0 24" stroke="var(--ink)" stroke-width="1.6" fill="none"/>` +
    K.person({ x: 440, y: 220, s: .65, shirt: 'var(--der)', skin: 3, hair: 'white', glasses: true, armL: 'chest' }) +
    K.tag(175, 60, 'die Jugendlichen', 'akk') + K.tag(440, 70, 'die Erwachsenen', 'der'),
    'Zwei Jugendliche spielen Fußball, ein Erwachsener schaut von der Tribüne zu.'),
  lemmas: { Jugendlichen: 'Jugendliche', Jugendlicher: 'Jugendliche', Erwachsenen: 'Erwachsene', Deutsche: 'Deutsche', Deutscher: 'Deutsche', Bekannte: 'Bekannte', Verwandten: 'Verwandte' },

  understand: [
    { type: 'grid', title: 'Endungen wie beim Adjektiv', head: ['', 'mit der', 'mit ein', 'Plural'], rows: [
      ['Nominativ', 'der Deutsch{e:e}', 'ein Deutsch{e:er}', 'die Deutsch{e:en} / Deutsch{e:e}'],
      ['Akkusativ', 'den Deutsch{e:en}', 'einen Deutsch{e:en}', 'die Deutsch{e:en}'],
      ['Dativ', 'dem Deutsch{e:en}', 'einem Deutsch{e:en}', 'den Deutsch{e:en}'],
      ['feminin', 'die Deutsch{e:e}', 'eine Deutsch{e:e}', '—'] ] },
    { type: 'cards', title: 'Häufige Wörter', min: '13rem', items: [
      { t: 'Personen', k: 'ac', ws: ['der/die Deutsche', 'der/die Erwachsene', 'der/die Jugendliche', 'der/die Bekannte', 'der/die Verwandte', 'der/die Kranke', 'der/die Angestellte', 'der/die Arbeitslose'] },
      { t: 'auch Partizipien', k: 'n', ws: ['der/die Reisende', 'der/die Studierende', 'der/die Vorsitzende', 'der/die Verletzte'] } ] },
    { type: 'merk', text: 'Großgeschrieben – aber mit Adjektivendung: {e:ein} Deutsch{e:er}, {e:der} Deutsch{e:e}.' },
    { type: 'note', title: 'Vorsicht', text: '{e:der Deutsche} (ein Mann aus Deutschland) – aber {e:das Deutsch} (die Sprache) hat keine Adjektivendung: Ich lerne Deutsch.' }
  ],

  examples: [
    'Mein Nachbar ist {e:ein Deutscher}.',
    'Für {e:Erwachsene} kostet der Eintritt 10 Euro.',
    'Sie ist {e:eine Bekannte} von mir.',
    'Am Wochenende besuchen wir {e:Verwandte}.',
    'Der Arzt hilft {e:den Kranken}.',
    'Viele {e:Jugendliche} haben ein Handy.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Die richtige Endung', instr: 'Wähle die richtige Form.',
      items: [
        'Er ist ein ((Deutscher|Deutsche|Deutschen)).', 'Die ((Jugendlichen|Jugendliche|Jugendlicher)) spielen Fußball.', 'Das ist eine ((Bekannte|Bekannten|Bekannter)) von mir.',
        'Der Eintritt für ((Erwachsene|Erwachsener|Erwachsenen)) kostet 8 Euro.', 'Ich helfe dem ((Kranken|Kranke|Kranker)).', 'Mein Bruder ist ((Angestellter|Angestellte|Angestellten)) bei der Bank.' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze die Endung', instr: 'Schreib die Endung.',
      items: [
        'Der Jugendlich[[e]] kommt aus Gulu.', 'Ich kenne einen Deutsch[[en]].', 'Wir besuchen unsere Verwandt[[en]].',
        'Eine Bekannt[[e]] hat angerufen.', 'Die Erwachsen[[en]] trinken Kaffee.', 'Er spricht mit dem Angestellt[[en]].' ] },
    { id: 'u3', type: 'type', title: 'Bilde das Nomen', instr: 'Schreib das Adjektiv als Nomen.',
      items: [
        { q: 'krank → ein Mann, der krank ist: ein …', pre: 'ein', end: '', ok: ['Kranker'] },
        { q: 'erwachsen → eine Frau, die erwachsen ist: eine …', pre: 'eine', end: '', ok: ['Erwachsene'] },
        { q: 'jugendlich → mehrere junge Leute: viele …', pre: 'viele', end: '', ok: ['Jugendliche'] },
        { q: 'deutsch → ein Mann aus Deutschland: ein …', pre: 'ein', end: '', ok: ['Deutscher'] } ] }
  ],

  speak: { title: 'Wer ist das?', intro: 'Sag es mit dem Adjektiv-Nomen.', altLabel: 'Mit der/die',
    items: [
      { cue: [['x', 'user-round', 'ein Mann aus Deutschland']], say: 'Er ist {e:ein Deutscher}.', alt: '{e:Der Deutsche} wohnt neben mir.' },
      { cue: [['x', 'user-round', 'eine Frau, die ich kenne']], say: 'Sie ist {e:eine Bekannte}.', alt: '{e:Die Bekannte} heißt Amina.' },
      { cue: [['x', 'users', 'junge Leute']], say: 'Das sind {e:Jugendliche}.', alt: '{e:Die Jugendlichen} spielen Fußball.' },
      { cue: [['x', 'heart-pulse', 'ein Mann, der krank ist']], say: 'Er ist {e:ein Kranker}.', alt: 'Der Arzt hilft {e:dem Kranken}.' } ] }
});
