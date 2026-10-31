/* Kapitel 61 – Konjunktiv II: Wünsche, Ratschläge, Irreales (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 61, level: 'B1', group: 'Verben 3',
  title: 'Konjunktiv II: Wünsche und Ratschläge',
  kicker: 'Wenn ich Zeit hätte …',
  intro: 'Den Konjunktiv II brauchst du für <b>Wünsche</b>, <b>Ratschläge</b>, <b>höfliche Bitten</b> und für <b>irreale Bedingungen</b>: Was wäre, wenn …? In beiden Teilen des Satzes steht der Konjunktiv II.',
  hero: '{e:Wenn} ich mehr Zeit {v:hätte}, {v:würde} ich Gitarre {t:lernen}.',
  art: K => K.svg(K.room() + K.shadow(170) + K.person({ x: 170, shirt: 'var(--das)', skin: 4, hair: 'curly', hc: 'var(--hair3)', armL: 'hip', armR: 'chest', face: 'smile' }) +
    `<circle cx="232" cy="128" r="7" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><circle cx="252" cy="104" r="11" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><ellipse cx="350" cy="96" rx="104" ry="66" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>` +
    K.guitar(330, 120, -40) + K.notes(380, 80) +
    `<circle cx="80" cy="96" r="30" fill="var(--card)" stroke="var(--ink)" stroke-width="4"/><path d="M80 96V76M80 96l14 10" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/>` +
    K.tag(350, 196, 'Wenn ich Zeit hätte …', 'das'),
    'Eine Frau denkt an eine Gitarre und Musik: Wenn ich Zeit hätte …'),
  lemmas: { hätte: 'haben', würde: 'werden', wäre: 'sein', solltest: 'sollen', Könnten: 'können' },

  understand: [
    { type: 'cards', title: 'Wofür?', min: '13rem', items: [
      { t: 'Wunsch', k: 'ac', icon: 'sparkles', ex: 'Ich {v:wäre} gern Profisportler. {e:Wenn} ich doch Zeit {v:hätte}!' },
      { t: 'Ratschlag', k: 'ok', icon: 'lightbulb', ex: 'Du {v:solltest} zum Arzt gehen. An deiner Stelle {v:würde} ich mich {t:ausruhen}.' },
      { t: 'höfliche Bitte', k: 'n', icon: 'hand-helping', ex: '{v:Könnten} Sie mir {t:helfen}? {v:Würden} Sie bitte das Fenster {t:schließen}?' },
      { t: 'irreale Bedingung', k: 'd', icon: 'cloud', ex: '{e:Wenn} ich reich {v:wäre}, {v:würde} ich ein Haus {t:kaufen}.' } ] },
    { type: 'slots', title: 'Wenn-Satz + Hauptsatz', rows: [
      [['Wenn', 'q', 'Konnektor'], ['ich', 'n', ''], ['Zeit', 'x', ''], ['hätte,', 'v', 'Ende'], ['würde', 'v', 'Position 1'], ['ich', 'n', ''], ['dich', 'x', ''], ['besuchen', 'vt', 'Ende']] ],
      note: 'Nach dem Nebensatz kommt sofort das Verb des Hauptsatzes: … hätte, <b>würde</b> ich … (Verb, Verb).' },
    { type: 'grid', title: 'Real oder irreal?', head: ['', 'Beispiel', 'Bedeutung'], rows: [
      ['real (Indikativ)', 'Wenn ich Zeit {e:habe}, komme ich.', 'Vielleicht habe ich Zeit.'],
      ['irreal (Konjunktiv II)', 'Wenn ich Zeit {e:hätte}, {e:würde} ich kommen.', 'Ich habe keine Zeit.'] ] },
    { type: 'merk', text: 'Rat: {v:Du solltest} … · Bitte: {v:Könnten Sie} …? · Traum: {e:Wenn} ich … {v:hätte}, {v:würde} ich …' }
  ],

  examples: [
    '{e:Wenn} ich Flügel {v:hätte}, {v:würde} ich {t:fliegen}.',
    'Du {v:solltest} weniger Kaffee {t:trinken}.',
    '{v:Würden} Sie bitte etwas leiser {t:sprechen}?',
    'An deiner Stelle {v:würde} ich das Angebot {t:annehmen}.',
    '{e:Wenn} es nicht so kalt {v:wäre}, {v:würden} wir {t:schwimmen gehen}.',
    'Ich {v:hätte} gern mehr Geschwister.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Was ist das?', instr: 'Wunsch, Ratschlag, Bitte oder irreale Bedingung?',
      items: [
        '„Du solltest mehr schlafen.“ – ((Ratschlag|Wunsch|Bitte))', '„Könnten Sie mir den Weg zeigen?“ – ((Bitte|Ratschlag|Wunsch))', '„Ich wäre gern am Meer.“ – ((Wunsch|Bitte|Ratschlag))',
        '„Wenn ich reich wäre, würde ich reisen.“ – ((irreale Bedingung|Bitte|Ratschlag))', '„An deiner Stelle würde ich warten.“ – ((Ratschlag|Wunsch|Bitte))' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze', instr: 'Schreib das Verb im Konjunktiv II.',
      items: [
        '(haben) Wenn ich ein Auto [[hätte]], würde ich ans Meer fahren.', '(sein) Wenn das Wetter besser [[wäre]], würden wir grillen.', '(sollen) Du [[solltest]] mal Urlaub machen.',
        '(können) [[Könnten]] Sie bitte langsamer sprechen?', '(werden) Wenn ich du wäre, [[würde]] ich das nicht machen.', '(haben) Wenn wir mehr Zeit [[hätten]], würden wir länger bleiben.' ] },
    { id: 'u3', type: 'type', title: 'Was wäre, wenn …?', instr: 'Ergänze den Hauptsatz mit würde.',
      items: [
        { q: 'Wenn ich Zeit hätte, … (dich besuchen)', pre: 'Wenn ich Zeit hätte,', end: '.', ok: ['würde ich dich besuchen'] },
        { q: 'Wenn ich reich wäre, … (ein Haus kaufen)', pre: 'Wenn ich reich wäre,', end: '.', ok: ['würde ich ein Haus kaufen'] },
        { q: 'Wenn es nicht regnen würde, … (spazieren gehen)', pre: 'Wenn es nicht regnen würde,', end: '.', ok: ['würden wir spazieren gehen', 'würde ich spazieren gehen'] },
        { q: 'Wenn ich du wäre, … (zum Arzt gehen)', pre: 'Wenn ich du wäre,', end: '.', ok: ['würde ich zum Arzt gehen'] } ] },
    { id: 'u4', type: 'free', title: 'Deine Träume', graded: false,
      instr: 'Schreib über deine Wünsche. Die automatische Prüfung findet viele Fehler, aber nicht alle – diese Übung zählt deshalb nicht für die Note.',
      verbs: ['wäre', 'hätte', 'würde', 'könnte', 'müsste', 'sollte'], needMsg: 'Benutze den Konjunktiv II: wäre, hätte, würde …',
      checks: [ t => /\bwenn\b[^,]*\b(würde|würdest|würden)\b[^,]*\b(haben|sein)\b,/i.test(t) && ['h', 'Bei haben und sein nimmt man meistens hätte / wäre statt würde haben / würde sein.'],
        t => /\bwenn\b[^,]+,\s*(ich|du|er|sie|es|wir|ihr)\s+(würde|hätte|wäre)/i.test(t) && ['e', 'Nach dem Wenn-Satz kommt zuerst das Verb: „…, würde ich …“ (nicht „…, ich würde …“).'] ],
      items: [
        { q: 'Was würdest du machen, wenn du viel Geld hättest?', ph: 'Wenn ich viel Geld hätte, würde ich …' },
        { q: 'Wo wärst du jetzt gern?', ph: 'Ich wäre jetzt gern …' },
        { q: 'Gib einem Freund einen Rat: Er ist immer müde.', ph: 'Du solltest …' } ] }
  ],

  speak: { title: 'Was wäre, wenn …?', intro: 'Sag den ganzen Satz im Konjunktiv II.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'clock', 'Zeit haben'], ['x', 'music', 'Gitarre lernen']], say: '{e:Wenn} ich Zeit {v:hätte}, {v:würde} ich Gitarre {t:lernen}.' },
      { cue: [['x', 'euro', 'reich sein'], ['x', 'plane', 'um die Welt reisen']], say: '{e:Wenn} ich reich {v:wäre}, {v:würde} ich um die Welt {t:reisen}.' },
      { cue: [['x', 'moon', 'Rat: mehr schlafen']], say: 'Du {v:solltest} mehr {t:schlafen}.' },
      { cue: [['x', 'app-window', 'Bitte: Fenster öffnen (Sie)']], say: '{v:Könnten} Sie bitte das Fenster {t:öffnen}?' },
      { cue: [['x', 'user-round', 'an deiner Stelle'], ['x', 'stethoscope', 'zum Arzt gehen']], say: 'An deiner Stelle {v:würde} ich zum Arzt {t:gehen}.' } ] }
});
