/* Kapitel 57 – Trennbar oder untrennbar? (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 57, level: 'B1', group: 'Verben 3',
  title: 'Trennbar oder untrennbar?',
  kicker: 'einkaufen – bestellen',
  intro: 'Präfixe wie <b>an-, auf-, ein-</b> sind trennbar und betont. Präfixe wie <b>be-, ver-, er-</b> sind untrennbar und unbetont. Und einige – <b>über-, unter-, um-, durch-, wieder-</b> – können beides sein, mit verschiedener Bedeutung.',
  hero: 'Ich {v:kaufe} heute {t:ein} – du {v:bestellst} Pizza!',
  art: K => K.svg(K.room() +
    `<g transform="translate(380 240)"><rect x="-70" y="-14" width="140" height="22" rx="4" fill="var(--wood)"/><rect x="-70" y="-24" width="140" height="14" rx="4" fill="var(--floor)"/><text x="0" y="2" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="800" fill="var(--card)">PIZZA</text></g>` +
    K.shadow(140) + K.person({ x: 140, shirt: 'var(--das)', skin: 3, hair: 'short', hc: 'var(--hair2)', armL: 'down', armR: 'down',
      extra: '<path d="M-40 -76h26l3 38h-32z" fill="var(--sun)" stroke="var(--line)"/><circle cx="-27" cy="-84" r="7" fill="var(--die)"/><path d="M14 -76h26l3 38h-32z" fill="var(--card)" stroke="var(--line)"/><rect x="22" y="-96" width="7" height="22" fill="var(--das)"/>' }) +
    K.shadow(380) + K.person({ x: 380, y: 326, shirt: 'var(--die)', skin: 1, hair: 'bun', armL: 'front', armR: 'front', face: 'open' }) +
    K.bubble(130, 88, 'Ich *kaufe* *ein*!', { tail: 'c' }) + K.bubble(392, 110, 'Ich *bestelle* Pizza!', { tail: 'c' }),
    'Ein Mann kommt mit Einkaufstaschen nach Hause. Eine Frau hält eine Pizzaschachtel: Ich bestelle Pizza!'),
  lemmas: { kaufe: 'einkaufen', bestellst: 'bestellen', bestelle: 'bestellen' },

  understand: [
    { type: 'grid', title: 'Trennbar und untrennbar', head: ['', 'trennbar', 'untrennbar'], rows: [
      ['Präfixe', 'an, auf, aus, ein, mit, vor, nach, zu, ab, weg, zurück, fern …', 'be, emp, ent, er, ge, miss, ver, zer'],
      ['Betonung', '{e:EIN}kaufen', 'be{e:STEL}len'],
      ['Präsens', 'Ich {v:kaufe} heute {t:ein}.', 'Ich {v:bestelle} heute Pizza.'],
      ['Perfekt', 'Ich habe {t:eingekauft}.', 'Ich habe {t:bestellt}. (kein ge-)'],
      ['zu + Infinitiv', 'Ich habe keine Lust, {t:einzukaufen}.', 'Ich habe keine Lust, {t:zu bestellen}.'] ] },
    { type: 'cards', title: 'Beides möglich: über, unter, um, durch, wieder', min: '14rem', items: [
      { t: 'trennbar (betont)', k: 'ac', p: 'Oft wörtliche, konkrete Bedeutung.', ex: 'Der Fährmann {v:setzt} uns {t:über}. ({e:ÜBER}setzen = ans andere Ufer bringen)' },
      { t: 'untrennbar (unbetont)', k: 'b', p: 'Oft übertragene Bedeutung.', ex: 'Sie {v:übersetzt} den Text. (über{e:SET}zen = in eine andere Sprache)' } ],
      foot: 'Weitere Paare: {e:UM}fahren (umstoßen) – um{e:FAH}ren (um etwas herum fahren); {e:WIE}derholen (zurückholen) – wieder{e:HO}len (noch einmal sagen).' },
    { type: 'merk', text: 'Betonung auf dem Präfix? Trennbar. Betonung auf dem Verb? Untrennbar – und kein ge- im Partizip.' }
  ],

  examples: [
    'Wann {v:fängt} der Kurs {t:an}?',
    'Ich {v:verstehe} die Frage nicht.',
    'Er hat mich zum Essen {t:eingeladen}.',
    'Sie hat die Rechnung schon {t:bezahlt}.',
    'Kannst du das bitte {v:wiederholen}?',
    'Wir {v:steigen} am Bahnhof {t:um}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Wie heißt das Partizip?', instr: 'Wähle das richtige Partizip II.',
      items: [
        'anrufen → ((angerufen|geanrufen|anrufen))', 'bezahlen → ((bezahlt|gebezahlt|bezahlen))', 'verstehen → ((verstanden|geverstanden|verstehen))',
        'aufräumen → ((aufgeräumt|geaufräumt|aufräumt))', 'erzählen → ((erzählt|geerzählt|erzählen))', 'mitbringen → ((mitgebracht|gemitbracht|mitbringt))' ] },
    { id: 'u2', type: 'choice', title: 'Trennen oder nicht?', instr: 'Wähle den richtigen Satz.',
      items: [
        '((Ich bezahle mit Karte.|Ich zahle mit Karte be.))', '((Er ruft mich morgen an.|Er anruft mich morgen.))', '((Wir verkaufen das Auto.|Wir kaufen das Auto ver.))',
        '((Sie steht um sechs auf.|Sie aufsteht um sechs.))', '((Ich erkläre dir das.|Ich kläre dir das er.))', '((Kommst du mit?|Mitkommst du?))' ] },
    { id: 'u3', type: 'type', title: 'Präsens', instr: 'Schreib den Satz im Präsens.',
      items: [
        { q: '(einladen) Ich … dich …', pre: 'Ich', end: '.', ok: ['lade dich ein'] },
        { q: '(vergessen) Er … immer seinen Schlüssel.', pre: 'Er', end: '.', ok: ['vergisst immer seinen Schlüssel'] },
        { q: '(zurückkommen) Wann … du …?', pre: 'Wann', end: '?', ok: ['kommst du zurück'] },
        { q: '(besuchen) Wir … unsere Oma.', pre: 'Wir', end: '.', ok: ['besuchen unsere Oma'] },
        { q: '(umsteigen) Ihr … in Köln …', pre: 'Ihr', end: '.', ok: ['steigt in Köln um'] } ] },
    { id: 'u4', type: 'fill', title: 'Perfekt', instr: 'Schreib das Partizip II.',
      items: [
        '(einkaufen) Ich habe schon [[eingekauft]].', '(bestellen) Wir haben Pizza [[bestellt]].', '(übersetzen – in eine andere Sprache) Sie hat den Brief [[übersetzt]].',
        '(abholen) Er hat mich vom Bahnhof [[abgeholt]].', '(erklären) Der Lehrer hat es gut [[erklärt]].', '(wiederholen – noch einmal sagen) Ich habe die Frage [[wiederholt]].' ] }
  ],

  speak: { title: 'Trennbar oder nicht?', intro: 'Sag den Satz im Präsens. Achte auf die Betonung!', altLabel: 'Perfekt',
    items: [
      { cue: [['x', 'shopping-cart', 'einkaufen · heute']], say: 'Ich {v:kaufe} heute {t:ein}.', alt: 'Ich habe heute {t:eingekauft}.' },
      { cue: [['x', 'pizza', 'bestellen · Pizza']], say: 'Ich {v:bestelle} Pizza.', alt: 'Ich habe Pizza {t:bestellt}.' },
      { cue: [['x', 'phone', 'anrufen · dich']], say: 'Ich {v:rufe} dich {t:an}.', alt: 'Ich habe dich {t:angerufen}.' },
      { cue: [['x', 'circle-help', 'verstehen · die Frage nicht']], say: 'Ich {v:verstehe} die Frage nicht.', alt: 'Ich habe die Frage nicht {t:verstanden}.' },
      { cue: [['x', 'languages', 'übersetzen · den Text']], say: 'Ich {v:übersetze} den Text.', alt: 'Ich habe den Text {t:übersetzt}.' } ] }
});
