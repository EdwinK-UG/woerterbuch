/* Kapitel 64 – Futur I (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 64, level: 'B1', group: 'Verben 3',
  title: 'Futur I',
  kicker: 'Morgen wird es regnen.',
  intro: 'Das Futur I bildest du mit <b>werden</b> (Position 2) + <b>Infinitiv</b> (Ende). Du brauchst es für <b>Vorhersagen</b>, <b>Pläne</b>, <b>Versprechen</b> und <b>Vermutungen</b>. Im Alltag sagt man für die Zukunft oft einfach Präsens + Zeitangabe.',
  hero: 'Morgen {v:wird} es {t:regnen}.',
  art: K => K.svg(`<rect width="520" height="360" fill="var(--wall)"/><rect x="200" y="40" width="290" height="200" rx="10" fill="var(--der)"/><rect x="214" y="54" width="262" height="172" rx="6" fill="var(--sky1)"/>
<path d="M260 210Q300 120 360 160T470 120V226H230Z" fill="var(--hill1)" opacity=".7"/><g fill="var(--cloud)" stroke="var(--line)" stroke-width="2"><ellipse cx="300" cy="100" rx="38" ry="18"/><ellipse cx="324" cy="88" rx="26" ry="18"/></g>
<g stroke="var(--der)" stroke-width="3" stroke-linecap="round">${[290, 306, 322].map(x => `<path d="M${x} 124l-5 14"/>`).join('')}</g><circle cx="420" cy="96" r="20" fill="var(--sun)"/><text x="300" y="180" text-anchor="middle" font-family="Inter,sans-serif" font-size="14" font-weight="800" fill="var(--ink)">MORGEN</text><text x="420" y="150" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="800" fill="var(--ink)">SAMSTAG</text>
<rect y="296" width="520" height="64" fill="var(--floor)"/>` +
    K.shadow(120) + K.person({ x: 120, shirt: 'var(--die)', skin: 4, hair: 'bun', hc: 'var(--hair4)', armR: 'out', face: 'open' }) +
    K.bubble(120, 90, 'Morgen *wird* es *regnen*.', { tail: 'c' }),
    'Eine Wetterfrau zeigt auf eine Wetterkarte: Morgen wird es regnen, am Samstag scheint die Sonne.'),
  lemmas: { wird: 'werden', werde: 'werden', regnen: 'regnen' },

  understand: [
    { type: 'slots', title: 'werden + Infinitiv', rows: [
      [['Morgen', 'q', 'Position 1'], ['wird', 'v', 'Position 2'], ['es', 'n', ''], ['regnen', 'vt', 'Ende']],
      [['Ich', 'n', 'Position 1'], ['werde', 'v', 'Position 2'], ['dich', 'x', ''], ['nie', 'x', ''], ['vergessen', 'vt', 'Ende']] ],
      note: 'Wie bei den Modalverben: werden auf Position 2, der Infinitiv am Ende.' },
    { type: 'cards', title: 'Wofür?', min: '12rem', items: [
      { t: 'Vorhersage', k: 'ac', icon: 'cloud-sun', ex: 'Morgen {v:wird} es {t:schneien}.' },
      { t: 'Plan', k: 'n', icon: 'calendar', ex: 'Nächstes Jahr {v:werde} ich in Berlin {t:studieren}.' },
      { t: 'Versprechen', k: 'ok', icon: 'handshake', ex: 'Ich {v:werde} dich {t:anrufen}, versprochen!' },
      { t: 'Vermutung', k: 'w', icon: 'circle-help', ex: 'Er ist nicht da. Er {v:wird} wohl krank {t:sein}.' } ] },
    { type: 'note', title: 'Präsens für die Zukunft', text: 'Mit einer Zeitangabe reicht oft das Präsens: Morgen {e:fahre} ich nach Köln. (= Morgen werde ich nach Köln fahren.)' },
    { type: 'merk', text: 'Zukunft: {v:werden} + {t:Infinitiv} – oder Präsens + Zeitangabe.' }
  ],

  examples: [
    'Morgen {v:wird} es sonnig und warm {t:sein}.',
    'Ich {v:werde} nächstes Jahr Deutsch {t:studieren}.',
    'Keine Sorge, alles {v:wird} gut {t:werden}.',
    'Wir {v:werden} euch im Sommer {t:besuchen}.',
    'Das Paket {v:wird} wohl morgen {t:ankommen}.',
    '{v:Wirst} du mir {t:helfen}?'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Die Form von werden', instr: 'Wähle die richtige Form.',
      items: [
        'Ich ((werde|wird|wirst)) morgen arbeiten.', 'Du ((wirst|wird|werdest)) das schaffen!', 'Es ((wird|werden|wirst)) heute regnen.',
        'Wir ((werden|werdet|wird)) im Mai heiraten.', '((Werdet|Werden|Wird)) ihr uns besuchen?', 'Die Preise ((werden|wird|werdet)) steigen.' ] },
    { id: 'u2', type: 'order', title: 'Sätze bauen', instr: 'werden auf Position 2, Infinitiv ans Ende.',
      items: [
        { tiles: ['Morgen', 'wird', 'es', 'regnen'], end: '.', ok: ['Morgen wird es regnen'] },
        { tiles: ['Ich', 'werde', 'dich', 'anrufen'], end: '.', ok: ['Ich werde dich anrufen'] },
        { tiles: ['Nächstes Jahr', 'werden', 'wir', 'umziehen'], end: '.', ok: ['Nächstes Jahr werden wir umziehen'] },
        { tiles: ['Wirst', 'du', 'mir', 'helfen'], end: '?', ok: ['Wirst du mir helfen'] } ] },
    { id: 'u3', type: 'type', title: 'Ins Futur', instr: 'Schreib den Satz im Futur I.',
      items: [
        { q: 'Ich lerne Deutsch.', pre: 'Ich', end: '.', ok: ['werde Deutsch lernen'] },
        { q: 'Es schneit morgen.', pre: 'Es', end: '.', ok: ['wird morgen schneien'] },
        { q: 'Wir besuchen euch.', pre: 'Wir', end: '.', ok: ['werden euch besuchen'] },
        { q: 'Kommst du mit?', pre: '', end: '?', ok: ['Wirst du mitkommen'] },
        { q: 'Sie fährt nach Kenia.', pre: 'Sie', end: '.', ok: ['wird nach Kenia fahren'] } ] },
    { id: 'u4', type: 'choice', title: 'Was bedeutet es?', instr: 'Vorhersage, Plan, Versprechen oder Vermutung?',
      items: [
        '„Morgen wird es kalt.“ – ((Vorhersage|Versprechen|Vermutung))', '„Ich werde dir immer helfen.“ – ((Versprechen|Vorhersage|Plan))',
        '„Er wird wohl im Stau stehen.“ – ((Vermutung|Plan|Versprechen))', '„Nächstes Jahr werde ich Medizin studieren.“ – ((Plan|Vermutung|Vorhersage))' ] }
  ],

  speak: { title: 'Die Zukunft', intro: 'Sag den Satz im Futur I.', altLabel: 'Präsens',
    items: [
      { cue: [['x', 'cloud-rain', 'morgen · regnen']], say: 'Morgen {v:wird} es {t:regnen}.', alt: 'Morgen regnet es.' },
      { cue: [['x', 'graduation-cap', 'nächstes Jahr · studieren']], say: 'Nächstes Jahr {v:werde} ich {t:studieren}.', alt: 'Nächstes Jahr studiere ich.' },
      { cue: [['x', 'phone', 'Versprechen · dich anrufen']], say: 'Ich {v:werde} dich {t:anrufen}!' },
      { cue: [['x', 'circle-help', 'Vermutung · er · krank sein']], say: 'Er {v:wird} wohl krank {t:sein}.' },
      { cue: [['x', 'smile', 'alles · gut werden']], say: 'Alles {v:wird} gut {t:werden}.' } ] }
});
