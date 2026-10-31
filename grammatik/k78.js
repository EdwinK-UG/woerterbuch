/* Kapitel 78 – während, bevor, nachdem, seit (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 78, level: 'B1', group: 'Sätze verbinden 2',
  title: 'während, bevor, nachdem, seit',
  kicker: 'Was passiert wann?',
  intro: 'Mit diesen Konnektoren ordnest du zwei Handlungen zeitlich: <b>während</b> = gleichzeitig, <b>bevor</b> = vorher, <b>nachdem</b> = danach, <b>seit</b> = von damals bis heute. Alle leiten einen <b>Nebensatz</b> ein – Verb am Ende.',
  hero: '{e:Bevor} ich {v:frühstücke}, gehe ich joggen.',
  art: K => K.svg(K.sky() + `<path d="M40 300H480" stroke="var(--ink)" stroke-width="3"/><path d="M470 292l12 8l-12 8" fill="var(--ink)"/>` +
    K.shadow(130, 34, 300) + K.person({ x: 130, y: 300, s: .8, shirt: 'var(--akk)', skin: 1, hair: 'short', armL: 'up', armR: 'out', face: 'open' }) +
    K.table(380, 230, 140) + K.cup(356, 230) + K.plate(408, 230) +
    K.tag(130, 90, '1. joggen', 'akk') + K.tag(380, 170, '2. frühstücken', 'nom') + K.arrow('M190 200Q260 150 320 190', 'var(--faint)'),
    'Zuerst joggt ein Mann, danach frühstückt er.'),
  lemmas: { während: 'während', bevor: 'bevor', nachdem: 'nachdem', seit: 'seit', seitdem: 'seitdem', frühstücke: 'frühstücken' },

  understand: [
    { type: 'cards', title: 'Vier Konnektoren', min: '13rem', items: [
      { t: 'während', k: 'ac', s: 'gleichzeitig', ex: '{e:Während} ich {v:koche}, hört sie Musik.' },
      { t: 'bevor', k: 'n', s: 'Nebensatz passiert später', ex: '{e:Bevor} ich {v:schlafe}, lese ich.' },
      { t: 'nachdem', k: 'd', s: 'Nebensatz passiert früher', ex: '{e:Nachdem} ich {t:gegessen} {v:hatte}, ging ich spazieren.' },
      { t: 'seit / seitdem', k: 'a', s: 'von damals bis jetzt', ex: '{e:Seit} ich in Berlin {v:wohne}, fahre ich Fahrrad.' } ] },
    { type: 'grid', title: 'nachdem: die Zeitform', head: ['Nebensatz (zuerst)', 'Hauptsatz (danach)'], label: false, rows: [
      ['Perfekt: Nachdem ich {t:gegessen} {v:habe},', 'Präsens: gehe ich spazieren.'],
      ['Plusquamperfekt: Nachdem ich {t:gegessen} {v:hatte},', 'Präteritum: ging ich spazieren.'] ],
      foot: 'Nach <b>nachdem</b> steht die Handlung eine Zeitstufe früher.' },
    { type: 'merk', text: 'gleichzeitig: {e:während} · vorher: {e:bevor} · danach: {e:nachdem} · bis jetzt: {e:seit}' }
  ],

  examples: [
    '{e:Während} die Kinder {v:schlafen}, räumen wir auf.',
    '{e:Bevor} du {v:gehst}, mach bitte das Licht aus.',
    '{e:Nachdem} er die Prüfung {t:bestanden} {v:hatte}, feierte er.',
    '{e:Seit} ich Sport {v:mache}, fühle ich mich besser.',
    'Ich putze mir die Zähne, {e:bevor} ich ins Bett {v:gehe}.',
    '{e:Während} ich {v:arbeite}, trinke ich viel Tee.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welcher Konnektor?', instr: 'Wähle den passenden Konnektor.',
      items: [
        '((Bevor|Nachdem|Während)) ich frühstücke, dusche ich. (zuerst duschen)', '((Während|Bevor|Seit)) ich koche, telefoniere ich.', '((Seit|Während|Bevor)) ich in Köln wohne, habe ich viele Freunde.',
        '((Nachdem|Bevor|Seit)) wir gegessen hatten, tranken wir Kaffee.', 'Mach die Fenster zu, ((bevor|nachdem|seit)) du gehst!', '((Während|Bevor|Nachdem)) der Lehrer spricht, hören alle zu.' ] },
    { id: 'u2', type: 'order', title: 'Nebensätze bauen', instr: 'Das Verb kommt ans Ende.',
      items: [
        { tiles: ['bevor', 'ich', 'ins Bett', 'gehe'], end: ',', ok: ['bevor ich ins Bett gehe'] },
        { tiles: ['während', 'die Kinder', 'schlafen'], end: ',', ok: ['während die Kinder schlafen'] },
        { tiles: ['nachdem', 'er', 'gegessen', 'hatte'], end: ',', ok: ['nachdem er gegessen hatte'] },
        { tiles: ['seit', 'ich', 'in Berlin', 'wohne'], end: ',', ok: ['seit ich in Berlin wohne'] } ] },
    { id: 'u3', type: 'type', title: 'Verbinde', instr: 'Verbinde die Sätze mit dem Konnektor.',
      items: [
        { q: 'Ich lese. Dann schlafe ich. (bevor)', pre: 'Ich lese,', end: '.', ok: ['bevor ich schlafe'] },
        { q: 'Ich koche. Gleichzeitig höre ich Musik. (während)', pre: 'Ich höre Musik,', end: '.', ok: ['während ich koche'] },
        { q: 'Ich wohne in Wien. Seitdem lerne ich Deutsch. (seit)', pre: '', end: ', lerne ich Deutsch.', ok: ['Seit ich in Wien wohne'] } ] }
  ],

  speak: { title: 'Mein Tagesablauf', intro: 'Bilde Sätze mit bevor, nachdem, während oder seit.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'footprints', 'joggen'], ['e', '', 'bevor'], ['x', 'coffee', 'frühstücken']], say: '{e:Bevor} ich {v:frühstücke}, gehe ich joggen.' },
      { cue: [['x', 'chef-hat', 'kochen'], ['e', '', 'während'], ['x', 'music', 'Musik hören']], say: '{e:Während} ich {v:koche}, höre ich Musik.' },
      { cue: [['x', 'utensils', 'essen (vorher)'], ['e', '', 'nachdem'], ['x', 'trees', 'spazieren gehen']], say: '{e:Nachdem} ich {t:gegessen} {v:habe}, gehe ich spazieren.' },
      { cue: [['x', 'map-pin', 'in Berlin wohnen'], ['e', '', 'seit'], ['x', 'bike', 'Fahrrad fahren']], say: '{e:Seit} ich in Berlin {v:wohne}, fahre ich Fahrrad.' } ] }
});
