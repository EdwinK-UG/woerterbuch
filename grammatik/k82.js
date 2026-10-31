/* Kapitel 82 – Präpositionen mit Genitiv (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 82, level: 'B1', group: 'Präpositionen 2',
  title: 'Präpositionen mit Genitiv',
  kicker: 'wegen, trotz, während',
  intro: 'Nach <b>wegen, trotz, während, statt, innerhalb, außerhalb</b> steht der <b>Genitiv</b> – vor allem in der Schriftsprache. Im Gespräch hört man nach wegen und trotz oft auch den Dativ.',
  hero: '{e:Wegen des Regens} bleiben wir heute zu Hause.',
  art: K => K.svg(K.room(false) + `<rect x="120" y="50" width="280" height="190" rx="10" fill="var(--metal)" stroke="var(--wood)" stroke-width="10"/><path d="M260 50V240M120 145H400" stroke="var(--wood)" stroke-width="6"/>
<g stroke="var(--der)" stroke-width="3" stroke-linecap="round">${Array.from({ length: 22 }, (_, i) => { const x = 136 + (i * 41) % 250, y = 66 + (i * 57) % 160; return `<path d="M${x} ${y}l-5 14"/>`; }).join('')}</g>` +
    K.shadow(180, 34) + K.cat(180, 300, { s: .8 }) + K.shadow(360) + K.person({ x: 360, shirt: 'var(--nom)', skin: 3, hair: 'bun', hc: 'var(--hair2)', armL: 'hip', armR: 'chest', face: 'flat' }) +
    K.tag(270, 334, 'wegen des Regens', 'der'),
    'Draußen regnet es. Eine Frau und eine Katze schauen aus dem Fenster und bleiben zu Hause.'),
  lemmas: { wegen: 'wegen', trotz: 'trotz', während: 'während', statt: 'statt', innerhalb: 'innerhalb', außerhalb: 'außerhalb', Regens: 'Regen', des: 'der' },

  understand: [
    { type: 'cards', title: 'Die Präpositionen', min: '13rem', items: [
      { t: 'wegen', k: 'n', s: 'Grund', ex: '{e:Wegen des Staus} kam ich zu spät.' },
      { t: 'trotz', k: 'b', s: 'Gegengrund', ex: '{e:Trotz des Regens} gingen wir spazieren.' },
      { t: 'während', k: 'ac', s: 'gleichzeitig', ex: '{e:Während des Films} schlief er ein.' },
      { t: 'statt / anstatt', k: 'w', s: 'Alternative', ex: '{e:Statt eines Autos} kaufte sie ein Fahrrad.' },
      { t: 'innerhalb · außerhalb', k: 'd', s: 'Raum oder Zeit', ex: '{e:Innerhalb einer Woche} … · {e:außerhalb der Stadt}' } ] },
    { type: 'grid', title: 'Genitiv-Formen zur Erinnerung', head: ['', 'maskulin', 'neutral', 'feminin', 'Plural'], rows: [
      ['bestimmt', 'des Regens', 'des Wetters', 'der Arbeit', 'der Ferien'], ['unbestimmt', 'eines Fehlers', 'eines Problems', 'einer Krankheit', '—'] ] },
    { type: 'note', title: 'Gesprochen', text: 'Im Alltag hört man oft: wegen {d:dem Regen}, trotz {d:dem Wetter}. In Texten und Prüfungen nimm den Genitiv.' },
    { type: 'merk', text: 'Grund: {e:wegen} · Gegengrund: {e:trotz} · gleichzeitig: {e:während} – + Genitiv' }
  ],

  examples: [
    '{e:Wegen der Hitze} ist das Schwimmbad voll.',
    '{e:Trotz der Kälte} trägt er nur ein T-Shirt.',
    '{e:Während der Ferien} besuchen wir unsere Großeltern.',
    '{e:Statt des Busses} nehme ich heute das Fahrrad.',
    'Der Supermarkt liegt {e:außerhalb der Stadt}.',
    '{e:Wegen eines Unfalls} gibt es Stau.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welche Präposition?', instr: 'Wähle die passende Präposition.',
      items: [
        '((Wegen|Trotz|Während)) des Regens bleiben wir zu Hause.', '((Trotz|Wegen|Statt)) des Regens gehen wir spazieren.', '((Während|Wegen|Statt)) des Unterrichts darf man nicht telefonieren.',
        '((Statt|Trotz|Während)) eines Kuchens backe ich Brot.', 'Das Haus liegt ((außerhalb|während|wegen)) des Dorfes.', '((Wegen|Trotz|Statt)) einer Erkältung kann sie nicht kommen.' ] },
    { id: 'u2', type: 'fill', title: 'Genitiv', instr: 'Schreib den Artikel im Genitiv.',
      items: [
        'Wegen [[des]] Streiks fährt kein Zug. (der Streik)', 'Trotz [[der]] Kälte spielen die Kinder draußen. (die Kälte)', 'Während [[des]] Essens sprechen wir nicht. (das Essen)',
        'Wegen [[eines]] Termins komme ich später. (ein Termin)', 'Innerhalb [[der]] Woche antworte ich. (die Woche)', 'Statt [[der]] Suppe nehme ich Salat. (die Suppe)' ] },
    { id: 'u3', type: 'type', title: 'Umformen', instr: 'Sag es mit wegen oder trotz + Genitiv.',
      items: [
        { q: 'Es regnet. Deshalb bleiben wir zu Hause.', pre: '', end: ' bleiben wir zu Hause.', ok: ['Wegen des Regens'] },
        { q: 'Es ist kalt. Trotzdem gehen wir schwimmen. (die Kälte)', pre: '', end: ' gehen wir schwimmen.', ok: ['Trotz der Kälte'] },
        { q: 'Es gibt einen Stau. Deshalb komme ich zu spät. (der Stau)', pre: '', end: ' komme ich zu spät.', ok: ['Wegen des Staus'] } ] }
  ],

  speak: { title: 'Warum?', intro: 'Sag den Grund mit wegen oder trotz.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'cloud-rain', 'der Regen'], ['x', 'house', 'zu Hause bleiben']], say: '{e:Wegen des Regens} bleiben wir zu Hause.' },
      { cue: [['x', 'snowflake', 'die Kälte'], ['x', 'waves', 'schwimmen gehen']], say: '{e:Trotz der Kälte} gehen wir schwimmen.' },
      { cue: [['x', 'car', 'der Stau'], ['x', 'clock', 'zu spät kommen']], say: '{e:Wegen des Staus} komme ich zu spät.' },
      { cue: [['x', 'clapperboard', 'der Film'], ['x', 'moon', 'einschlafen']], say: '{e:Während des Films} bin ich eingeschlafen.' } ] }
});
