/* Kapitel 45 – deshalb, sonst, dann, danach (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 45, level: 'A2', group: 'Sätze verbinden 1',
  title: 'deshalb, sonst, dann, danach',
  kicker: 'Folge und Reihenfolge',
  intro: '<b>deshalb, trotzdem, sonst, dann, danach</b> verbinden auch zwei Sätze – aber sie stehen auf <b>Position 1</b>. Darum kommt danach sofort das <b>Verb</b> und dann das Subjekt.',
  hero: 'Es regnet, {e:deshalb} {v:nehme} ich den Schirm.',
  art: K => K.svg(`<defs><linearGradient id="grsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--metal)"/><stop offset="1" stop-color="var(--sky2)"/></linearGradient></defs><rect width="520" height="360" fill="url(#grsky)"/>
<g fill="var(--cloud)"><ellipse cx="140" cy="60" rx="70" ry="24"/><ellipse cx="190" cy="44" rx="44" ry="26"/><ellipse cx="380" cy="70" rx="80" ry="26"/><ellipse cx="420" cy="52" rx="44" ry="24"/></g>
<g stroke="var(--der)" stroke-width="2.5" stroke-linecap="round" opacity=".7">${Array.from({ length: 26 }, (_, i) => { const x = 20 + (i * 47) % 500, y = 100 + (i * 73) % 200; return `<path d="M${x} ${y}l-6 16"/>`; }).join('')}</g>
<path d="M0 296H520V360H0Z" fill="var(--metal)" opacity=".7"/>` +
    K.shadow(250) + K.person({ x: 250, shirt: 'var(--nom)', skin: 1, hair: 'curly', armR: 'up', face: 'smile',
      extra: '<path d="M33 -176V-60" stroke="var(--ink)" stroke-width="3"/><path d="M-50 -176Q33 -260 116 -176Q95 -188 75 -176Q54 -188 33 -176Q12 -188-8 -176Q-29 -188-50 -176Z" fill="var(--die)"/>' }) +
    K.bubble(400, 210, 'Es regnet, *deshalb* …', { tail: 'l' }),
    'Es regnet stark. Ein Mann steht mit einem roten Regenschirm im Regen.'),
  lemmas: { deshalb: 'deshalb', sonst: 'sonst', dann: 'dann', danach: 'danach', trotzdem: 'trotzdem', nehme: 'nehmen' },

  understand: [
    { type: 'slots', title: 'Position 1 – dann das Verb', rows: [
      [['Es regnet,', 'x', 'Satz 1'], ['deshalb', 'q', 'Position 1'], ['nehme', 'v', 'Position 2'], ['ich', 'n', 'Subjekt'], ['den Schirm', 'x', '']],
      [['Es regnet,', 'x', 'Satz 1'], ['aber', 'q', 'Position 0'], ['ich', 'n', 'Position 1'], ['nehme', 'v', 'Position 2'], ['keinen Schirm', 'x', '']] ],
      note: 'Vergleiche: <b>aber</b> zählt nicht (Position 0) – <b>deshalb</b> zählt (Position 1). Nach deshalb kommt sofort das Verb.' },
    { type: 'cards', title: 'Was bedeuten sie?', min: '12rem', items: [
      { t: 'deshalb', k: 'n', s: 'Folge (darum, deswegen)', ex: 'Ich bin krank, {e:deshalb} {v:bleibe} ich zu Hause.' },
      { t: 'trotzdem', k: 'b', s: 'unerwartete Folge', ex: 'Ich bin krank, {e:trotzdem} {v:gehe} ich zur Arbeit.' },
      { t: 'sonst', k: 'w', s: 'wenn nicht …', ex: 'Beeil dich, {e:sonst} {v:kommen} wir zu spät.' },
      { t: 'dann · danach', k: 'ac', s: 'Reihenfolge', ex: 'Zuerst esse ich, {e:dann} {v:trinke} ich Kaffee. {e:Danach} {v:gehe} ich los.' } ] },
    { type: 'merk', text: '{e:deshalb, trotzdem, sonst, dann} + {v:Verb} + Subjekt' },
    { type: 'note', title: 'Erzählen', text: 'Für eine Reihenfolge: {e:Zuerst} … {e:dann} … {e:danach} … {e:zum Schluss} … – Zuerst {v:dusche} ich, dann {v:frühstücke} ich.' }
  ],

  examples: [
    'Der Bus kommt nicht, {e:deshalb} {v:nehme} ich ein Taxi.',
    'Es ist kalt, {e:trotzdem} {v:geht} er ohne Jacke raus.',
    'Wir müssen jetzt los, {e:sonst} {v:verpassen} wir den Zug.',
    'Zuerst kaufen wir ein, {e:dann} {v:kochen} wir.',
    'Ich mache meine Hausaufgaben. {e:Danach} {v:spiele} ich Fußball.',
    'Sie hat viel gelernt, {e:deshalb} {v:hat} sie die Prüfung bestanden.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welches Wort passt?', instr: 'Wähle deshalb, trotzdem, sonst oder dann.',
      items: [
        'Ich habe Hunger, ((deshalb|trotzdem|sonst)) koche ich jetzt.', 'Es regnet, ((trotzdem|deshalb|dann)) gehen wir spazieren.', 'Nimm eine Jacke mit, ((sonst|deshalb|dann)) frierst du.',
        'Zuerst duschen wir, ((dann|sonst|trotzdem)) frühstücken wir.', 'Der Film ist langweilig, ((deshalb|trotzdem|sonst)) gehe ich nach Hause.', 'Er ist sehr müde, ((trotzdem|deshalb|sonst)) arbeitet er weiter.' ] },
    { id: 'u2', type: 'choice', title: 'Wo steht das Verb?', instr: 'Wähle die richtige Wortstellung.',
      items: [
        'Ich bin krank, deshalb ((bleibe ich|ich bleibe)) zu Hause.', 'Ich bin krank, aber ((ich gehe|gehe ich)) zur Arbeit.', 'Es ist spät, dann ((gehen wir|wir gehen)) nach Hause.',
        'Lern mehr, sonst ((bestehst du|du bestehst)) die Prüfung nicht.', 'Ich bin müde, denn ((ich habe|habe ich)) wenig geschlafen.', 'Sie hat Zeit, trotzdem ((kommt sie|sie kommt)) nicht.' ] },
    { id: 'u3', type: 'type', title: 'Verbinde die Sätze', instr: 'Verbinde mit dem Wort in Klammern. Achte auf das Verb!',
      items: [
        { q: 'Es regnet. Ich nehme den Bus. (deshalb)', pre: 'Es regnet,', end: '.', ok: ['deshalb nehme ich den Bus'] },
        { q: 'Ich habe kein Geld. Ich kaufe das Handy. (trotzdem)', pre: 'Ich habe kein Geld,', end: '.', ok: ['trotzdem kaufe ich das Handy'] },
        { q: 'Beeil dich! Wir kommen zu spät. (sonst)', pre: 'Beeil dich,', end: '.', ok: ['sonst kommen wir zu spät'] },
        { q: 'Zuerst esse ich. Ich trinke Kaffee. (dann)', pre: 'Zuerst esse ich,', end: '.', ok: ['dann trinke ich Kaffee'] },
        { q: 'Er ist müde. Er geht ins Bett. (deshalb)', pre: 'Er ist müde,', end: '.', ok: ['deshalb geht er ins Bett'] } ] },
    { id: 'u4', type: 'order', title: 'Mein Morgen', instr: 'Bau die Sätze: Verb nach dem ersten Teil!',
      items: [
        { tiles: ['Zuerst', 'stehe', 'ich', 'auf'], end: '.', ok: ['Zuerst stehe ich auf'] },
        { tiles: ['Dann', 'dusche', 'ich'], end: '.', ok: ['Dann dusche ich'] },
        { tiles: ['Danach', 'frühstücke', 'ich', 'mit meiner Familie'], end: '.', ok: ['Danach frühstücke ich mit meiner Familie'] },
        { tiles: ['Zum Schluss', 'fahre', 'ich', 'zur Arbeit'], end: '.', ok: ['Zum Schluss fahre ich zur Arbeit'] } ] }
  ],

  speak: { title: 'Was folgt?', intro: 'Bilde einen Satz – das Verb kommt direkt nach dem Verbindungswort.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'cloud-rain', 'Es regnet.'], ['e', '', 'deshalb'], ['x', 'umbrella', 'Schirm nehmen']], say: 'Es regnet, {e:deshalb} {v:nehme} ich den Schirm.' },
      { cue: [['x', 'thermometer', 'krank'], ['e', '', 'trotzdem'], ['x', 'briefcase', 'arbeiten']], say: 'Ich bin krank, {e:trotzdem} {v:arbeite} ich.' },
      { cue: [['x', 'timer', 'Beeil dich!'], ['e', '', 'sonst'], ['x', 'train-front', 'Zug verpassen']], say: 'Beeil dich, {e:sonst} {v:verpassen} wir den Zug.' },
      { cue: [['x', 'shopping-cart', 'zuerst einkaufen'], ['e', '', 'dann'], ['x', 'chef-hat', 'kochen']], say: 'Zuerst kaufen wir ein, {e:dann} {v:kochen} wir.' },
      { cue: [['x', 'book-open', 'Hausaufgaben'], ['e', '', 'danach'], ['x', 'trophy', 'Fußball spielen']], say: 'Ich mache Hausaufgaben. {e:Danach} {v:spiele} ich Fußball.' } ] }
});
