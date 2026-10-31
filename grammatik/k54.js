/* Kapitel 54 – Präteritum (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 54, level: 'B1', group: 'Verben 3',
  title: 'Präteritum',
  kicker: 'Es war einmal …',
  intro: 'In Geschichten, Märchen, Romanen und Zeitungsberichten steht die Vergangenheit meistens im <b>Präteritum</b>. Regelmäßige Verben bekommen <b>-te-</b> (sie lebte). Unregelmäßige Verben ändern den Vokal (er kam, sie ging) – bei ich und er/sie/es ohne Endung.',
  hero: 'Es {e:war} einmal ein Mädchen. Es {e:lebte} in einem kleinen Dorf am See.',
  art: K => K.svg(`<rect width="520" height="360" fill="var(--sky1)"/>` +
    `<path d="M260 300Q180 270 60 284V96Q180 82 260 112Z" fill="var(--card)" stroke="var(--cream-b)" stroke-width="3"/><path d="M260 300Q340 270 460 284V96Q340 82 260 112Z" fill="var(--card)" stroke="var(--cream-b)" stroke-width="3"/><path d="M260 112V300" stroke="var(--cream-b)" stroke-width="3"/>
<g stroke="var(--faint)" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"><path d="M86 140q70 -8 150 2M86 168q70 -8 150 2M86 196q70 -8 120 2M86 224q70 -8 150 2M86 252q70 -8 100 2"/></g>
<g transform="translate(362 236)"><rect x="-60" y="-70" width="120" height="70" fill="var(--dat)"/><rect x="-74" y="-110" width="34" height="110" fill="var(--dat)"/><rect x="40" y="-110" width="34" height="110" fill="var(--dat)"/>
<path d="M-80 -110L-57 -146L-34 -110ZM34 -110L57 -146L80 -110Z" fill="var(--die)"/><rect x="-14" y="-40" width="28" height="40" rx="14" fill="var(--wood)"/>${[-66, -50, 48, 64].map(x => `<rect x="${x - 4}" y="-122" width="8" height="10" fill="var(--dat)"/>`).join('')}
<rect x="-60" y="-80" width="120" height="10" fill="var(--dat)"/>${[-52, -32, -12, 8, 28, 48].map(x => `<rect x="${x}" y="-88" width="8" height="10" fill="var(--dat)"/>`).join('')}<circle cx="-57" cy="-80" r="6" fill="var(--sun)"/><circle cx="57" cy="-80" r="6" fill="var(--sun)"/></g>
<g fill="var(--sun)"><path d="M100 60l3 8l8 3l-8 3l-3 8l-3-8l-8-3l8-3z"/><path d="M430 50l2 6l6 2l-6 2l-2 6l-2-6l-6-2l6-2z"/></g>` +
    K.tag(160, 320, 'Es war einmal …', 'dat'),
    'Ein offenes Märchenbuch mit einem Schloss.'),
  lemmas: { war: 'sein', lebte: 'leben', kam: 'kommen', ging: 'gehen', sah: 'sehen', fuhr: 'fahren', gab: 'geben', nahm: 'nehmen', fand: 'finden', sagte: 'sagen', wusste: 'wissen', dachte: 'denken', brachte: 'bringen', stand: 'stehen', saß: 'sitzen', lief: 'laufen', schrieb: 'schreiben', sprach: 'sprechen' },

  understand: [
    { type: 'conj', title: 'Die Formen', intro: 'Regelmäßig mit -te-, unregelmäßig mit neuem Vokal.', verbs: {
      machen: { f: ['mach{e:te}', 'mach{e:test}', 'mach{e:te}', 'mach{e:ten}', 'mach{e:tet}', 'mach{e:ten}'], n: 'Regelmäßig: Stamm + <b>-te-</b> + Endung.' },
      arbeiten: { f: ['arbeit{e:ete}', 'arbeit{e:etest}', 'arbeit{e:ete}', 'arbeit{e:eten}', 'arbeit{e:etet}', 'arbeit{e:eten}'], n: 'Stamm auf -t/-d: mit -ete-.' },
      kommen: { f: ['{e:kam}', 'kam{e:st}', '{e:kam}', 'kam{e:en}', 'kam{e:t}', 'kam{e:en}'], n: 'Unregelmäßig: ich und er/sie/es haben <b>keine Endung</b>.' },
      gehen: { f: ['{e:ging}', 'ging{e:st}', '{e:ging}', 'ging{e:en}', 'ging{e:t}', 'ging{e:en}'] },
      sehen: { f: ['{e:sah}', 'sah{e:st}', '{e:sah}', 'sah{e:en}', 'sah{e:t}', 'sah{e:en}'] },
      denken: { f: ['{e:dachte}', 'dachte{e:st}', '{e:dachte}', 'dachte{e:n}', 'dachte{e:t}', 'dachte{e:n}'], n: 'Gemischt: neuer Vokal und -te-.' } } },
    { type: 'grid', title: 'Wichtige unregelmäßige Verben', head: ['Infinitiv', 'Präteritum', 'Infinitiv', 'Präteritum'], rows: [
      ['gehen', 'ging', 'kommen', 'kam'], ['sehen', 'sah', 'geben', 'gab'], ['nehmen', 'nahm', 'finden', 'fand'], ['sitzen', 'saß', 'stehen', 'stand'],
      ['fahren', 'fuhr', 'laufen', 'lief'], ['schreiben', 'schrieb', 'sprechen', 'sprach'], ['wissen', 'wusste', 'bringen', 'brachte'] ],
      foot: 'Eine längere Liste findest du in der Rubrik „Unregelmäßige Verben“.' },
    { type: 'merk', text: 'Geschichten und Zeitung: Präteritum. Gespräch: Perfekt (Kapitel 30).' }
  ],

  examples: [
    'Es {e:war} einmal ein König, der {e:hatte} drei Töchter.',
    'Am Morgen {e:ging} sie in den Wald.',
    'Dort {e:sah} sie einen großen Wolf.',
    'Der Wolf {e:sprach} mit ihr und {e:fragte}: „Wohin gehst du?“',
    'Die Polizei {e:fand} das Auto am Abend.',
    'Er {e:wusste} die Antwort nicht.'
  ],

  exercises: [
    { id: 'u1', type: 'fill', title: 'Präteritum bilden', instr: 'Schreib die er/sie/es-Form im Präteritum.',
      items: [
        'machen → er [[machte]]', 'kommen → er [[kam]]', 'gehen → er [[ging]]', 'sagen → er [[sagte]]',
        'fahren → er [[fuhr]]', 'finden → er [[fand]]', 'arbeiten → er [[arbeitete]]', 'denken → er [[dachte]]' ] },
    { id: 'u2', type: 'choice', title: 'Die richtige Form', instr: 'Wähle die richtige Präteritumform.',
      items: [
        'Ich ((kam|kamte|kommte)) spät nach Hause.', 'Wir ((gingen|gehten|ging)) in den Park.', 'Sie ((sah|sehte|sahte)) einen Film.',
        'Du ((schriebst|schreibtest|schrieb)) einen Brief.', 'Die Kinder ((liefen|lauften|lief)) schnell.', 'Er ((brachte|bringte|brang)) Blumen mit.' ] },
    { id: 'u3', type: 'fill', title: 'Ein Märchen', instr: 'Schreib das Verb in Klammern im Präteritum.',
      items: [
        '(sein) Es [[war]] einmal ein armer Fischer.', '(wohnen) Er [[wohnte]] mit seiner Frau am Meer.', '(gehen) Jeden Tag [[ging]] er zum Wasser.',
        '(finden) Eines Tages [[fand]] er einen goldenen Fisch.', '(sprechen) Der Fisch [[sprach]]: „Lass mich frei!“', '(lassen) Der Fischer [[ließ]] ihn frei.' ] },
    { id: 'u4', type: 'type', title: 'Erzähl im Präteritum', instr: 'Schreib den Satz im Präteritum.',
      items: [
        { q: 'Er kommt nach Hause.', pre: 'Er', end: ' nach Hause.', ok: ['kam'] },
        { q: 'Wir sehen einen Film.', pre: 'Wir', end: ' einen Film.', ok: ['sahen'] },
        { q: 'Sie fährt nach Köln.', pre: 'Sie', end: ' nach Köln.', ok: ['fuhr'] },
        { q: 'Ich weiß es nicht.', pre: 'Ich', end: ' es nicht.', ok: ['wusste'] },
        { q: 'Die Kinder spielen im Garten.', pre: 'Die Kinder', end: ' im Garten.', ok: ['spielten'] },
        { q: 'Du nimmst den Bus.', pre: 'Du', end: ' den Bus.', ok: ['nahmst'] } ] }
  ],

  speak: { title: 'Erzähl eine Geschichte', intro: 'Bilde den Satz im Präteritum – wie in einem Märchen.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'crown', 'ein König · sein']], say: 'Es {e:war} einmal ein König.' },
      { cue: [['x', 'castle', 'er · in einem Schloss · leben']], say: 'Er {e:lebte} in einem Schloss.' },
      { cue: [['x', 'trees', 'eines Tages · in den Wald · gehen']], say: 'Eines Tages {e:ging} er in den Wald.' },
      { cue: [['x', 'eye', 'dort · einen Drachen · sehen']], say: 'Dort {e:sah} er einen Drachen.' },
      { cue: [['x', 'message-circle', 'der Drache · sprechen']], say: 'Der Drache {e:sprach} mit ihm.' } ] }
});
