/* Kapitel 79 – um … zu und damit (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 79, level: 'B1', group: 'Sätze verbinden 2',
  title: 'um … zu und damit',
  kicker: 'Ziele ausdrücken',
  intro: 'Mit <b>um … zu</b> und <b>damit</b> sagst du ein <b>Ziel</b> (Wozu?). Ist das Subjekt in beiden Sätzen <b>gleich</b>, nimmst du meistens <b>um … zu + Infinitiv</b>. Sind die Subjekte <b>verschieden</b>, nimmst du <b>damit</b> + Nebensatz.',
  hero: 'Ich lerne Deutsch, {e:um} in Berlin {t:zu studieren}.',
  art: K => K.svg(K.sky(false) + `<g fill="var(--metal)" opacity=".75"><rect x="300" y="210" width="40" height="90"/><rect x="350" y="180" width="50" height="120"/><rect x="420" y="200" width="44" height="100"/><rect x="250" y="230" width="36" height="70"/></g>
<rect x="383" y="40" width="10" height="200" fill="var(--metal)"/><circle cx="388" cy="140" r="22" fill="var(--metal)"/><rect x="386" y="20" width="4" height="24" fill="var(--metal)"/>` +
    `<rect y="296" width="520" height="64" fill="var(--hill1)"/>` + K.shadow(150) +
    K.person({ x: 150, shirt: 'var(--akk)', skin: 1, hair: 'bun', armL: 'front', armR: 'front', face: 'smile',
      extra: '<g transform="translate(0 -96)"><rect x="-34" y="-16" width="68" height="26" rx="3" fill="var(--die)"/><rect x="-30" y="-22" width="60" height="8" rx="2" fill="var(--der)"/><rect x="-26" y="-30" width="52" height="8" rx="2" fill="var(--nom)"/></g>' }) +
    K.bubble(170, 92, 'Ich lerne, *um* in Berlin *zu studieren*!', { tail: 'c' }),
    'Eine Studentin mit Büchern. Im Hintergrund die Silhouette von Berlin mit dem Fernsehturm.'),
  lemmas: { um: 'um', damit: 'damit', studieren: 'studieren' },

  understand: [
    { type: 'grid', title: 'gleiches oder anderes Subjekt?', head: ['', 'Beispiel'], rows: [
      ['gleiches Subjekt', '{n:Ich} lerne Deutsch, {e:um} in Berlin {t:zu studieren}. (= ich studiere)'],
      ['gleiches Subjekt', '{n:Ich} lerne Deutsch, {e:damit} {n:ich} in Berlin studieren {v:kann}. (auch möglich)'],
      ['anderes Subjekt', '{n:Ich} spreche langsam, {e:damit} {n:du} mich {v:verstehst}.'] ] },
    { type: 'slots', title: 'Der Satzbau', rows: [
      [['…,', 'x', 'Hauptsatz'], ['um', 'q', 'um'], ['in Berlin', 'x', ''], ['zu studieren', 'vt', 'zu + Infinitiv']],
      [['…,', 'x', 'Hauptsatz'], ['damit', 'q', 'damit'], ['du', 'n', 'Subjekt'], ['mich', 'x', ''], ['verstehst', 'v', 'Ende']] ],
      note: 'Bei um … zu gibt es kein eigenes Subjekt. Trennbare Verben: um früh auf<b>zu</b>stehen.' },
    { type: 'note', title: 'Kein Modalverb', text: 'In Sätzen mit um … zu und damit stehen normalerweise keine Modalverben wie wollen oder sollen: Ich spare, um ein Auto {t:zu kaufen}. (Nicht: um ein Auto kaufen zu wollen.)' },
    { type: 'merk', text: 'Gleiches Subjekt: {e:um} … {t:zu} + Infinitiv. Anderes Subjekt: {e:damit} … {v:Verb}.' }
  ],

  examples: [
    'Ich stehe früh auf, {e:um} den Bus {t:zu bekommen}.',
    'Er spart Geld, {e:um} ein Auto {t:zu kaufen}.',
    'Ich erkläre es noch einmal, {e:damit} alle es {v:verstehen}.',
    'Wir gehen in den Park, {e:um} frische Luft {t:zu schnappen}.',
    'Mach das Fenster zu, {e:damit} es nicht so kalt {v:wird}.',
    'Sie lernt jeden Abend, {e:um} die Prüfung {t:zu bestehen}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'um … zu oder damit?', instr: 'Gleiches oder anderes Subjekt?',
      items: [
        'Ich spare, ((um|damit)) ein Fahrrad zu kaufen.', 'Ich spreche laut, ((damit|um)) alle mich hören.', 'Er trainiert, ((um|damit)) fit zu bleiben.',
        'Wir bringen Essen mit, ((damit|um)) niemand Hunger hat.', 'Sie fährt nach Kenia, ((um|damit)) ihre Familie zu besuchen.', 'Ich gebe dir mein Handy, ((damit|um)) du deine Mutter anrufen kannst.' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze', instr: 'Schreib zu + Infinitiv.',
      items: [
        '(lernen) Ich gehe in die Bibliothek, um [[zu lernen]].', '(einkaufen) Wir fahren in die Stadt, um [[einzukaufen]].', '(kaufen) Ich spare, um ein Auto [[zu kaufen]].',
        '(aufstehen) Ich stelle den Wecker, um früh [[aufzustehen]].', '(abholen) Er fährt zum Bahnhof, um seine Oma [[abzuholen]].' ] },
    { id: 'u3', type: 'type', title: 'Verbinde', instr: 'Verbinde mit um … zu oder damit.',
      items: [
        { q: 'Ich lerne Deutsch. Ich will in Deutschland arbeiten. (um … zu)', pre: 'Ich lerne Deutsch,', end: '.', ok: ['um in Deutschland zu arbeiten'] },
        { q: 'Ich spreche langsam. Du verstehst mich. (damit)', pre: 'Ich spreche langsam,', end: '.', ok: ['damit du mich verstehst'] },
        { q: 'Er joggt. Er will fit bleiben. (um … zu)', pre: 'Er joggt,', end: '.', ok: ['um fit zu bleiben'] },
        { q: 'Ich schreibe es auf. Du vergisst es nicht. (damit)', pre: 'Ich schreibe es auf,', end: '.', ok: ['damit du es nicht vergisst'] } ] }
  ],

  speak: { title: 'Wozu?', intro: 'Sag das Ziel mit um … zu oder damit.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'book-open', 'Deutsch lernen'], ['x', 'graduation-cap', 'in Berlin studieren']], say: 'Ich lerne Deutsch, {e:um} in Berlin {t:zu studieren}.' },
      { cue: [['x', 'euro', 'Geld sparen'], ['x', 'car', 'ein Auto kaufen']], say: 'Ich spare Geld, {e:um} ein Auto {t:zu kaufen}.' },
      { cue: [['x', 'volume-2', 'langsam sprechen'], ['x', 'user-round', 'du · mich verstehen']], say: 'Ich spreche langsam, {e:damit} du mich {v:verstehst}.' },
      { cue: [['x', 'alarm-clock', 'früh aufstehen'], ['x', 'bus', 'den Bus bekommen']], say: 'Ich stehe früh auf, {e:um} den Bus {t:zu bekommen}.' } ] }
});
