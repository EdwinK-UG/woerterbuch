/* Kapitel 31 – Reflexive Verben (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 31, level: 'A2', group: 'Verben 2',
  title: 'Reflexive Verben',
  kicker: 'sich waschen, sich freuen',
  intro: 'Bei reflexiven Verben sind Subjekt und Objekt <b>dieselbe Person</b>: Ich kämme <b>mich</b>. Das Reflexivpronomen ist wie der Akkusativ – nur bei er, sie, es und sie/Sie heißt es <b>sich</b>.',
  hero: 'Er {v:kämmt} {a:sich} vor dem Spiegel.',
  art: K => K.svg(K.room(false) +
    `<rect x="300" y="70" width="150" height="180" rx="75" fill="var(--sky1)" stroke="var(--wood)" stroke-width="8"/><path d="M330 110q20 -24 42 -10" stroke="var(--card)" stroke-width="6" stroke-linecap="round" fill="none" opacity=".8"/>` +
    `<g transform="translate(375 0)"><circle cx="0" cy="166" r="23" fill="var(--skin1)"/><path d="M-23 164Q-24 138 0 138Q24 138 23 164Q15 148 0 151Q-15 148-23 164Z" fill="var(--hair2)"/><circle cx="-8" cy="166" r="2.5" fill="var(--ink)"/><circle cx="8" cy="166" r="2.5" fill="var(--ink)"/><path d="M-7 176Q0 182 7 176" stroke="var(--ink)" stroke-width="2.2" fill="none"/><path d="M-27 254Q-27 192 0 192Q27 192 27 254" fill="var(--akk)"/></g>` +
    `<rect x="250" y="250" width="240" height="22" rx="8" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><rect x="290" y="272" width="160" height="24" fill="var(--metal)" opacity=".5"/>` +
    K.shadow(190) + K.person({ x: 190, shirt: 'var(--akk)', skin: 1, hair: 'short', armL: 'down', armR: 'up', face: 'smile',
      extra: '<rect x="28" y="-196" width="8" height="34" rx="2" fill="var(--die)" transform="rotate(20 32 -180)"/>' }) +
    K.bubble(160, 76, 'Ich *kämme* *mich*.', { tail: 'c' }),
    'Ein Mann kämmt sich vor dem Spiegel. Im Spiegel sieht man sein Gesicht.'),
  lemmas: { kämmt: 'kämmen', kämme: 'kämmen', sich: 'sich', dusche: 'duschen', freuen: 'freuen', erkältet: 'erkälten', treffen: 'treffen', ziehen: 'anziehen' },

  understand: [
    { type: 'grid', title: 'Die Reflexivpronomen', head: ['Person', 'Reflexivpronomen', 'Beispiel'], rows: [
      ['ich', '{a:mich}', 'Ich wasche {a:mich}.'], ['du', '{a:dich}', 'Du wäschst {a:dich}.'], ['er · sie · es', '{a:sich}', 'Er wäscht {a:sich}.'],
      ['wir', '{a:uns}', 'Wir waschen {a:uns}.'], ['ihr', '{a:euch}', 'Ihr wascht {a:euch}.'], ['sie · Sie', '{a:sich}', 'Sie waschen {a:sich}.'] ], hl: [2, 5],
      foot: 'Nur in der 3. Person (und bei Sie) heißt es <b>sich</b> – kleingeschrieben, auch bei Sie.' },
    { type: 'cards', title: 'Drei Arten', min: '13rem', items: [
      { t: 'mit oder ohne sich', k: 'ac', p: 'Die Handlung geht zu mir zurück – oder zu jemand anderem.', ex: 'Ich wasche {a:das Auto}. – Ich wasche {a:mich}.' },
      { t: 'immer mit sich', k: 'a', p: 'Diese Verben gibt es nur reflexiv.', ws: ['sich freuen', 'sich beeilen', 'sich erholen', 'sich erkälten', 'sich verlieben', 'sich bedanken'] },
      { t: 'einander', k: 'd', p: 'Zwei oder mehr Personen tun etwas miteinander.', ex: 'Wir treffen {a:uns}. Sie lieben {a:sich}.' } ] },
    { type: 'verbs', title: 'Häufige reflexive Verben', pattern: 'sich … (Akkusativ)', items: [
      ['sich waschen', 'Ich wasche {a:mich} jeden Morgen.'], ['sich anziehen', 'Zieh {a:dich} warm an!'], ['sich duschen', 'Er duscht {a:sich}.'],
      ['sich setzen', 'Setzen Sie {a:sich}!'], ['sich beeilen', 'Wir müssen {a:uns} beeilen.'], ['sich freuen', 'Ich freue {a:mich}!'],
      ['sich ärgern', 'Ärgere {a:dich} nicht!'], ['sich erholen', 'Habt ihr {a:euch} erholt?'], ['sich treffen', 'Wir treffen {a:uns} um acht.'] ] },
    { type: 'note', title: 'Perfekt', text: 'Reflexive Verben bilden das Perfekt mit haben: Ich {v:habe} {a:mich} {t:erkältet}. Wir {v:haben} {a:uns} {t:gefreut}.' },
    { type: 'merk', text: 'er, sie, es, sie, Sie → {a:sich}. Sonst wie Akkusativ: {a:mich, dich, uns, euch}.' }
  ],

  examples: [
    'Ich {v:dusche} {a:mich} jeden Morgen.',
    '{v:Beeil} {a:dich}! Der Bus kommt!',
    'Wir {v:freuen} {a:uns} auf die Ferien.',
    'Er {v:hat} {a:sich} {t:erkältet}.',
    '{v:Setzen} Sie {a:sich}, bitte.',
    'Wann {v:treffen} wir {a:uns}?',
    'Die Kinder {v:ziehen} {a:sich} {t:an}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welches Pronomen?', instr: 'Wähle das richtige Reflexivpronomen.',
      items: [
        'Ich wasche ((mich|mir|sich)).', 'Du musst ((dich|dir|sich)) beeilen.', 'Er freut ((sich|ihn|ihm)) sehr.', 'Wir treffen ((uns|euch|sich)) um acht.',
        'Habt ihr ((euch|uns|sich)) gut erholt?', 'Die beiden lieben ((sich|ihnen|uns)).', 'Setzen Sie ((sich|Sie|Ihnen)), bitte!', 'Ich ziehe ((mich|mir)) schnell an.' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze', instr: 'Schreib das Reflexivpronomen.',
      items: [
        'Ich freue [[mich]] auf das Wochenende.', 'Beeil [[dich]]!', 'Mein Vater ärgert [[sich]] über den Verkehr.',
        'Wir sehen [[uns]] morgen!', 'Interessiert ihr [[euch]] für Musik?', 'Die Gäste setzen [[sich]].' ] },
    { id: 'u3', type: 'type', title: 'Bilde den Satz', instr: 'Schreib den Satz mit dem reflexiven Verb.',
      items: [
        { q: '(sich duschen) Ich … jeden Morgen.', pre: 'Ich', end: '.', ok: ['dusche mich jeden Morgen'] },
        { q: '(sich beeilen) Imperativ für du', pre: '', end: '!', ok: ['Beeil dich', 'Beeile dich'] },
        { q: '(sich freuen) Wir … auf den Urlaub.', pre: 'Wir', end: '.', ok: ['freuen uns auf den Urlaub'] },
        { q: '(sich treffen) Wann … ihr …?', pre: 'Wann', end: '?', ok: ['trefft ihr euch'] },
        { q: '(sich anziehen) Er … schnell …', pre: 'Er', end: '.', ok: ['zieht sich schnell an'] },
        { q: '(sich setzen) Bitte … Sie …!', pre: 'Bitte', end: '!', ok: ['setzen Sie sich'] } ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'Tippe die Teile in der richtigen Reihenfolge an.',
      items: [
        { tiles: ['Ich', 'freue', 'mich', 'auf den Sommer'], end: '.', ok: ['Ich freue mich auf den Sommer'] },
        { tiles: ['Wann', 'treffen', 'wir', 'uns'], end: '?', ok: ['Wann treffen wir uns'] },
        { tiles: ['Er', 'zieht', 'sich', 'schnell', 'an'], end: '.', ok: ['Er zieht sich schnell an'] },
        { tiles: ['Beeil', 'dich'], end: '!', ok: ['Beeil dich'] },
        { tiles: ['Habt', 'ihr', 'euch', 'gut', 'erholt'], end: '?', ok: ['Habt ihr euch gut erholt'] } ] }
  ],

  speak: { title: 'Mein Morgen', intro: 'Bilde den Satz mit dem reflexiven Verb.', altLabel: 'Weiter',
    items: [
      { cue: [['n', 'user-round', 'ich'], ['x', 'shower-head', 'sich duschen']], say: 'Ich {v:dusche} {a:mich}.' },
      { cue: [['n', 'user-round', 'ich'], ['x', 'shirt', 'sich anziehen']], say: 'Ich {v:ziehe} {a:mich} {t:an}.' },
      { cue: [['n', 'user-round', 'du'], ['x', 'timer', 'sich beeilen (Imperativ)']], say: '{v:Beeil} {a:dich}!' },
      { cue: [['n', 'users', 'wir'], ['x', 'party-popper', 'sich freuen · auf das Fest']], say: 'Wir {v:freuen} {a:uns} auf das Fest.' },
      { cue: [['n', 'user-round', 'er'], ['x', 'thermometer', 'sich erkälten (Perfekt)']], say: 'Er {v:hat} {a:sich} {t:erkältet}.' },
      { cue: [['n', 'users', 'ihr'], ['x', 'clock', 'sich treffen · wann?']], say: 'Wann {v:trefft} ihr {a:euch}?', alt: 'Wir treffen {a:uns} um acht.' } ] }
});
