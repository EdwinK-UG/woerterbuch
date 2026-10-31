/* Kapitel 74 – Infinitiv ohne zu (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 74, level: 'B1', group: 'Sätze verbinden 2',
  title: 'Infinitiv ohne zu',
  kicker: 'Ich höre die Vögel singen.',
  intro: 'Nach einigen Verben steht der Infinitiv <b>ohne zu</b>: nach den <b>Modalverben</b>, nach <b>lassen</b>, nach <b>sehen, hören, fühlen</b> und nach <b>gehen, fahren, kommen, bleiben, lernen</b>.',
  hero: 'Ich {v:höre} die Vögel {t:singen}.',
  art: K => K.svg(K.sky() + K.tree(400, 300, 1.15) + `<path d="M396 168q-50 -4 -96 6" stroke="var(--wood)" stroke-width="8" stroke-linecap="round"/>` + K.bird(318, 158, 'var(--akk)') + K.bird(372, 120, 'var(--nom)') + K.notes(280, 120) + K.notes(340, 80) +
    K.shadow(150) + K.person({ x: 150, shirt: 'var(--dat)', skin: 1, hair: 'bun', armL: 'down', armR: 'chest', face: 'sleep' }) +
    K.bubble(150, 96, 'Ich *höre* die Vögel *singen*.', { tail: 'c' }),
    'Eine Frau steht mit geschlossenen Augen unter einem Baum und hört zwei Vögel singen.'),
  lemmas: { höre: 'hören', singen: 'singen', sehe: 'sehen', lasse: 'lassen' },

  understand: [
    { type: 'cards', title: 'Diese Verben: Infinitiv ohne zu', min: '12rem', items: [
      { t: 'Modalverben', k: 'ac', ex: 'Ich {v:kann} {t:schwimmen}. Wir {v:müssen} {t:gehen}.' },
      { t: 'lassen', k: 'n', ex: 'Ich {v:lasse} das Auto {t:reparieren}.' },
      { t: 'sehen, hören, fühlen', k: 'd', ex: 'Ich {v:sehe} ihn {t:kommen}. Ich {v:höre} sie {t:lachen}.' },
      { t: 'gehen, fahren, kommen', k: 'a', ex: 'Wir {v:gehen} {t:schwimmen}. Kommst du {t:essen}?' },
      { t: 'bleiben, lernen', k: 'ok', ex: 'Bleib {t:sitzen}! Er {v:lernt} {t:schwimmen}.' } ] },
    { type: 'grid', title: 'Vergleiche', head: ['ohne zu', 'mit zu'], label: false, rows: [
      ['Ich {v:muss} {t:arbeiten}.', 'Ich habe keine Lust {t:zu arbeiten}.'], ['Ich {v:gehe} {t:einkaufen}.', 'Ich vergesse oft {t:einzukaufen}.'], ['Ich {v:höre} ihn {t:singen}.', 'Ich versuche {t:zu singen}.'] ] },
    { type: 'note', title: 'Perfekt mit sehen, hören, lassen', text: 'Mit Infinitiv steht im Perfekt oft der Infinitiv statt des Partizips: Ich habe ihn {t:kommen sehen}. Ich habe das Auto {t:reparieren lassen}.' },
    { type: 'merk', text: 'Modalverben, lassen, sehen, hören, gehen, bleiben, lernen + Infinitiv: {e:kein zu}!' }
  ],

  examples: [
    'Ich {v:sehe} die Kinder im Garten {t:spielen}.',
    'Hörst du den Hund {t:bellen}?',
    'Er {v:lässt} mich nie {t:ausreden}.',
    'Wir {v:gehen} heute Abend {t:essen}.',
    'Bleiben Sie bitte {t:sitzen}.',
    'Meine Tochter {v:lernt} gerade {t:lesen}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'zu oder nicht?', instr: 'Wähle die richtige Form.',
      items: [
        'Ich höre ihn ((singen|zu singen)).', 'Ich habe Lust ((zu singen|singen)).', 'Wir gehen ((schwimmen|zu schwimmen)).',
        'Es ist schön ((zu schwimmen|schwimmen)).', 'Er lässt sein Fahrrad ((reparieren|zu reparieren)).', 'Ich versuche, das Fahrrad ((zu reparieren|reparieren)).' ] },
    { id: 'u2', type: 'order', title: 'Sätze bauen', instr: 'Der Infinitiv kommt ans Ende.',
      items: [
        { tiles: ['Ich', 'sehe', 'die Kinder', 'spielen'], end: '.', ok: ['Ich sehe die Kinder spielen'] },
        { tiles: ['Hörst', 'du', 'das Baby', 'weinen'], end: '?', ok: ['Hörst du das Baby weinen'] },
        { tiles: ['Wir', 'gehen', 'am Samstag', 'tanzen'], end: '.', ok: ['Wir gehen am Samstag tanzen'] },
        { tiles: ['Bleib', 'bitte', 'sitzen'], end: '!', ok: ['Bleib bitte sitzen'] } ] },
    { id: 'u3', type: 'fill', title: 'Ergänze', instr: 'Schreib das Verb – mit oder ohne zu.',
      items: [
        '(kommen) Ich sehe den Bus [[kommen]].', '(kommen) Ich hoffe, morgen [[zu kommen]].', '(lachen) Ich höre die Kinder [[lachen]].',
        '(fahren) Er lernt Auto [[fahren]].', '(fahren) Es macht Spaß, Auto [[zu fahren]].', '(schneiden) Ich lasse mir die Haare [[schneiden]].' ] }
  ],

  speak: { title: 'Was siehst und hörst du?', intro: 'Beschreib mit sehen oder hören + Infinitiv.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'bird', 'die Vögel · singen']], say: 'Ich {v:höre} die Vögel {t:singen}.' },
      { cue: [['x', 'users', 'die Kinder · spielen']], say: 'Ich {v:sehe} die Kinder {t:spielen}.' },
      { cue: [['x', 'dog', 'der Hund · bellen']], say: 'Ich {v:höre} den Hund {t:bellen}.' },
      { cue: [['x', 'bus', 'der Bus · kommen']], say: 'Ich {v:sehe} den Bus {t:kommen}.' },
      { cue: [['x', 'waves', 'wir · schwimmen gehen']], say: 'Wir {v:gehen} {t:schwimmen}.' } ] }
});
