/* Kapitel 6 – Modalverben: können, wollen, möchten (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 6, level: 'A1', group: 'Verben 1',
  title: 'Modalverben: können, wollen, möchten',
  kicker: 'Was kannst du – und was willst du?',
  intro: '<b>können</b> sagt, was jemand kann oder was möglich ist. <b>wollen</b> ist ein Plan oder ein starker Wunsch. <b>möchten</b> ist ein höflicher Wunsch.',
  hero: 'Ich {v:kann} Gitarre {t:spielen} und ich {v:will} in einer Band {t:spielen}.',
  art: K => K.svg(K.room() + K.shadow(214) + K.shadow(420, 30) +
    K.person({ x: 214, shirt: 'var(--akk)', skin: 2, hair: 'bun', hc: 'var(--hair2)', armL: 'hold', armR: 'hold', face: 'open' }) + K.guitar(212, 236, -58) +
    K.person({ x: 420, s: .7, shirt: 'var(--nom)', skin: 4, hair: 'curly', hc: 'var(--hair4)', armL: 'up', armR: 'up', face: 'open' }) +
    K.notes(300, 150) + K.notes(110, 120) + K.bubble(318, 70, 'Ich *kann* Gitarre spielen!', { tail: 'l' }),
    'Eine Frau spielt Gitarre. Ein Kind hört zu und freut sich.'),
  lemmas: { kann: 'können', Kannst: 'können', will: 'wollen', möchte: ['möchten', 'mögen'], Möchten: ['möchten', 'mögen'] },

  understand: [
    { type: 'cards', title: 'Was bedeuten sie?', min: '14rem', items: [
      { t: 'können', k: 'n', icon: 'dumbbell', s: 'Fähigkeit · Möglichkeit · Bitte', p: 'Was jemand kann, was möglich ist – und höfliche Bitten.', ex: 'Ich {v:kann} {t:schwimmen}. Hier {v:kann} man gut {t:essen}. {v:Kannst} du mir {t:helfen}?' },
      { t: 'wollen', k: 'd', icon: 'target', s: 'Plan · starker Wunsch', p: 'Was jemand vorhat oder unbedingt will.', ex: 'Ich {v:will} Ärztin {t:werden}. Ich {v:will} jetzt nach Hause!' },
      { t: 'möchten', k: 'a', icon: 'heart', s: 'höflicher Wunsch', p: 'Im Café, im Geschäft, bei Fremden.', ex: 'Ich {v:möchte} einen Tee. {v:Möchten} Sie {t:bestellen}?' } ] },
    { type: 'grid', title: 'Eine Situation – drei Verben', head: ['', 'Satz', 'Bedeutung'], rows: [
      ['können', 'Ich {v:kann} Suaheli {t:sprechen}.', 'Ich habe es gelernt.'],
      ['wollen', 'Ich {v:will} Suaheli {t:lernen}.', 'Das ist mein Plan.'],
      ['möchten', 'Ich {v:möchte} Suaheli {t:lernen}.', 'Das ist mein Wunsch (freundlicher).'] ] },
    { type: 'note', title: 'möchten oder wollen?', text: 'Im Restaurant und im Geschäft sagt man {v:möchte}. „Ich will einen Kaffee!“ klingt unhöflich – wie ein Kind, das etwas haben will.' },
    { type: 'merk', text: '{v:kann} = Fähigkeit oder Möglichkeit · {v:will} = Plan · {v:möchte} = höflicher Wunsch' },
    { type: 'note', title: 'Ohne Infinitiv', text: '{v:Kannst} du Deutsch? – Ja, ich {v:kann} ein bisschen Deutsch. · Ich {v:möchte} ein Eis. (Das Verb ist klar, darum fehlt es.)' }
  ],

  examples: [
    'Mein Sohn {v:kann} schon {t:lesen}.',
    'Im Park {v:kann} man Fußball {t:spielen}.',
    '{v:Kannst} du bitte das Fenster {t:schließen}?',
    'Nach der Schule {v:will} Amara Medizin {t:studieren}.',
    'Wir {v:möchten} zwei Kaffee, bitte.',
    'Ich {v:möchte} Sie etwas {t:fragen}.',
    'Was {v:willst} du später {t:werden}?'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welches Verb passt?', instr: 'Lies die Situation und wähle das passende Modalverb.',
      items: [
        'Im Café: „Ich ((möchte|will|kann)) einen Orangensaft, bitte.“',
        'Lea ist zwei Jahre alt. Sie ((kann|will|möchte)) noch nicht lesen.',
        'Ich habe Kopfschmerzen. ((Kannst|Willst|Möchtest)) du das Radio leiser machen?',
        'Tim hat einen klaren Plan: „Ich ((will|kann|darf)) Pilot werden!“',
        'In der Bibliothek ((kann|will|möchte)) man Bücher ausleihen.',
        'Die Verkäuferin fragt freundlich: „Was ((möchten|wollen|können)) Sie?“',
        'Mein Opa ist 90. Er ((kann|will|möchte)) nicht mehr gut sehen.' ] },
    { id: 'u2', type: 'fill', title: 'Formen ergänzen', instr: 'Schreib das Modalverb in der richtigen Form.',
      items: [
        '(können) [[Könnt]] ihr Schach spielen?', '(wollen) Mein Bruder [[will]] im Ausland arbeiten.', '(möchten) [[Möchten]] Sie etwas trinken?',
        '(können) Hier [[kann]] man gut parken.', '(wollen) Was [[willst]] du später werden?', '(möchten) Ich [[möchte]] bitte zahlen.' ] },
    { id: 'u3', type: 'order', title: 'Sätze bauen', instr: 'Tippe die Teile in der richtigen Reihenfolge an.',
      items: [
        { tiles: ['Ich', 'möchte', 'einen Tisch', 'reservieren'], end: '.', ok: ['Ich möchte einen Tisch reservieren'] },
        { tiles: ['Kannst', 'du', 'Gitarre', 'spielen'], end: '?', ok: ['Kannst du Gitarre spielen'] },
        { tiles: ['Mein Bruder', 'will', 'Koch', 'werden'], end: '.', ok: ['Mein Bruder will Koch werden'] },
        { tiles: ['Hier', 'kann', 'man', 'gut', 'essen'], end: '.', ok: ['Hier kann man gut essen'] },
        { tiles: ['Was', 'möchten', 'Sie', 'bestellen'], end: '?', ok: ['Was möchten Sie bestellen'] } ] },
    { id: 'u4', type: 'free', title: 'Über dich', graded: false,
      instr: 'Schreib über dich. Die automatische Prüfung findet viele Fehler, aber nicht alle – diese Übung zählt deshalb nicht für die Note.',
      verbs: ['kann', 'kannst', 'könn', 'will', 'willst', 'woll', 'möcht'], needMsg: 'Benutze können, wollen oder möchten.',
      checks: [
        t => /\b(kann|will|möchte|möchten|können|wollen)\b[^.!?]*\b(zu)\s+\w+en[.!?]?$/i.test(t) && ['e', 'Nach Modalverben steht der Infinitiv ohne „zu“: Ich kann schwimmen (nicht: zu schwimmen).'],
        t => /\b(er|sie|es|man)\s+(kannt|willt|möchtet)\b/i.test(t) && ['e', 'Bei er/sie/es hat das Modalverb keine Endung: er kann, er will, er möchte.'] ],
      items: [
        { q: 'Was kannst du gut?', ph: 'Ich kann …' },
        { q: 'Was willst du in fünf Jahren machen?', ph: 'In fünf Jahren will ich …' },
        { q: 'Du bist im Café. Was möchtest du?', ph: 'Ich möchte …' } ] }
  ],

  speak: { title: 'Sag es!', intro: 'Bilde einen Satz. Dann prüf dich mit der Lösung.', altLabel: 'Antwort',
    items: [
      { cue: [['n', 'user-round', 'du'], ['v', '', 'können'], ['x', 'chef-hat', 'kochen?']], say: '{v:Kannst} du {t:kochen}?', alt: 'Ja, ich {v:kann} gut {t:kochen}.' },
      { cue: [['n', 'coffee', 'im Café'], ['v', '', 'möchten'], ['x', 'cup-soda', 'ein Tee']], say: 'Ich {v:möchte} einen Tee, bitte.' },
      { cue: [['n', 'target', 'Plan'], ['v', '', 'wollen'], ['x', 'graduation-cap', 'in Deutschland studieren']], say: 'Ich {v:will} in Deutschland {t:studieren}.' },
      { cue: [['n', 'hand-helping', 'Bitte'], ['v', '', 'können'], ['x', 'app-window', 'das Fenster öffnen']], say: '{v:Kannst} du bitte das Fenster {t:öffnen}?' },
      { cue: [['n', 'trees', 'im Park'], ['v', '', 'können'], ['x', 'flame', 'grillen']], say: 'Im Park {v:kann} man {t:grillen}.' },
      { cue: [['n', 'user-round', 'Sie'], ['v', '', 'möchten'], ['x', 'utensils', 'bestellen?']], say: '{v:Möchten} Sie {t:bestellen}?', alt: 'Ja, ich {v:möchte} die Suppe, bitte.' } ] }
});
