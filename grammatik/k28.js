/* Kapitel 28 – Das Partizip II (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 28, level: 'A2', group: 'Verben 2',
  title: 'Das Partizip II',
  kicker: 'gemacht, eingekauft, bezahlt',
  intro: 'Das Partizip II hat drei Muster: <b>ge-</b> vorne (gemacht), <b>ge</b> in der Mitte bei trennbaren Verben (ein<b>ge</b>kauft) – und <b>gar kein ge-</b> bei Verben mit be-, ver-, er- … und bei Verben auf <b>-ieren</b> (bezahlt, studiert).',
  hero: 'Ich {v:habe} {t:eingekauft} und schon {t:bezahlt}.',
  art: K => K.svg(K.room(false) +
    `<rect x="300" y="198" width="190" height="98" rx="8" fill="var(--wood)"/><rect x="300" y="190" width="190" height="12" rx="4" fill="var(--metal)"/>
<rect x="400" y="150" width="62" height="40" rx="6" fill="var(--ink)"/><rect x="408" y="157" width="46" height="20" rx="3" fill="var(--das)" opacity=".8"/><text x="431" y="172" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="var(--card)">24,90 €</text>
<path d="M340 190v-26h22v26" fill="var(--card)" stroke="var(--line)"/><path d="M344 172h14M344 178h14M344 184h10" stroke="var(--mut)" stroke-width="1.5"/>` +
    K.shadow(130) + K.shadow(240, 60) + K.cart(240, 330) +
    K.person({ x: 120, shirt: 'var(--dat)', skin: 3, hair: 'long', hc: 'var(--hair3)', armR: 'out', face: 'open' }) +
    K.bubble(150, 90, 'Ich *habe* *eingekauft* …', { tail: 'c' }) + K.bubble(370, 110, '… und schon *bezahlt*!', { tail: 'l' }),
    'Im Supermarkt an der Kasse: Eine Frau mit Einkaufswagen hat eingekauft und schon bezahlt.'),
  lemmas: { eingekauft: 'einkaufen', bezahlt: 'bezahlen', verstanden: 'verstehen', telefoniert: 'telefonieren', angerufen: 'anrufen', studiert: 'studieren', aufgestanden: 'aufstehen' },

  understand: [
    { type: 'cards', title: 'Drei Muster', min: '14rem', items: [
      { t: 'ge- vorne', k: 'n', s: 'normale Verben', ex: 'machen → {e:ge}macht · kommen → {e:ge}kommen · finden → {e:ge}funden' },
      { t: 'ge in der Mitte', k: 'ac', s: 'trennbare Verben', ex: 'einkaufen → ein{e:ge}kauft · anrufen → an{e:ge}rufen · aufstehen → auf{e:ge}standen' },
      { t: 'ohne ge-', k: 'b', s: 'be-, ver-, er-, ent-, emp-, ge-, zer- · -ieren', ex: 'bezahlen → bezahlt · verstehen → verstanden · erklären → erklärt · telefonieren → telefoniert' } ] },
    { type: 'grid', title: 'Wichtige unregelmäßige Partizipien', head: ['Infinitiv', 'Partizip II', 'Infinitiv', 'Partizip II'], rows: [
      ['gehen', 'gegangen', 'sitzen', 'gesessen'], ['stehen', 'gestanden', 'finden', 'gefunden'], ['trinken', 'getrunken', 'helfen', 'geholfen'],
      ['nehmen', 'genommen', 'sprechen', 'gesprochen'], ['schreiben', 'geschrieben', 'bleiben', 'geblieben'], ['vergessen', 'vergessen', 'verstehen', 'verstanden'] ] },
    { type: 'note', title: 'Gemischte Verben', text: 'Einige Verben haben -t, aber trotzdem einen neuen Vokal: bringen → ge{e:brach}t, denken → ge{e:dach}t, kennen → ge{e:kann}t, wissen → ge{e:wuss}t.' },
    { type: 'merk', text: 'be-, ver-, er- oder -ieren? Dann {e:kein ge-}: bezahlt, verstanden, studiert.' }
  ],

  examples: [
    'Ich {v:habe} heute schon {t:eingekauft}.',
    '{v:Hast} du die Rechnung {t:bezahlt}?',
    'Wir {v:haben} die Aufgabe nicht {t:verstanden}.',
    'Sie {v:hat} eine Stunde {t:telefoniert}.',
    'Er {v:hat} mich gestern {t:angerufen}.',
    'Mein Bruder {v:hat} in Kampala {t:studiert}.',
    'Wann {v:bist} du {t:aufgestanden}?'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welche Form?', instr: 'Wähle das richtige Partizip II.',
      items: [
        'bezahlen → ((bezahlt|gebezahlt|bezahlen))', 'einkaufen → ((eingekauft|geeinkauft|einkauft))', 'telefonieren → ((telefoniert|getelefoniert|telefonierte))',
        'verstehen → ((verstanden|geverstanden|verstehen))', 'anrufen → ((angerufen|geanrufen|anrufen))', 'erklären → ((erklärt|geerklärt|erklären))',
        'aufstehen → ((aufgestanden|aufgesteht|geaufstanden))', 'studieren → ((studiert|gestudiert|studieren))' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze das Partizip', instr: 'Schreib das Partizip II.',
      items: [
        '(einladen) Ich habe dich [[eingeladen]].', '(besuchen) Wir haben Oma [[besucht]].', '(fotografieren) Er hat den Dom [[fotografiert]].',
        '(vergessen) Ich habe den Schlüssel [[vergessen]].', '(fernsehen) Die Kinder haben [[ferngesehen]].', '(bringen) Er hat Blumen [[gebracht]].',
        '(denken) Ich habe an dich [[gedacht]].', '(mitkommen) Lea ist [[mitgekommen]].' ] },
    { id: 'u3', type: 'type', title: 'Ins Perfekt', instr: 'Schreib den Satz im Perfekt.',
      items: [
        { q: 'Ich kaufe ein.', pre: 'Ich', end: '.', ok: ['habe eingekauft'] },
        { q: 'Er bezahlt die Rechnung.', pre: 'Er', end: '.', ok: ['hat die Rechnung bezahlt'] },
        { q: 'Wir verstehen alles.', pre: 'Wir', end: '.', ok: ['haben alles verstanden'] },
        { q: 'Sie telefoniert mit ihrer Mutter.', pre: 'Sie', end: '.', ok: ['hat mit ihrer Mutter telefoniert'] },
        { q: 'Der Zug kommt an.', pre: 'Der Zug', end: '.', ok: ['ist angekommen'] },
        { q: 'Ich vergesse das Datum.', pre: 'Ich', end: '.', ok: ['habe das Datum vergessen'] } ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'Tippe die Teile in der richtigen Reihenfolge an.',
      items: [
        { tiles: ['Ich', 'habe', 'heute', 'eingekauft'], end: '.', ok: ['Ich habe heute eingekauft'] },
        { tiles: ['Hast', 'du', 'schon', 'bezahlt'], end: '?', ok: ['Hast du schon bezahlt'] },
        { tiles: ['Er', 'hat', 'mich', 'gestern', 'angerufen'], end: '.', ok: ['Er hat mich gestern angerufen'] },
        { tiles: ['Wir', 'haben', 'den Text', 'nicht', 'verstanden'], end: '.', ok: ['Wir haben den Text nicht verstanden'] },
        { tiles: ['Sie', 'hat', 'in Berlin', 'studiert'], end: '.', ok: ['Sie hat in Berlin studiert'] } ] }
  ],

  speak: { title: 'Was hast du heute gemacht?', intro: 'Bilde einen Satz im Perfekt. Wo steht ge-?', altLabel: 'Weiter',
    items: [
      { cue: [['n', 'user-round', 'ich'], ['x', 'shopping-cart', 'einkaufen']], say: 'Ich {v:habe} {t:eingekauft}.' },
      { cue: [['n', 'user-round', 'du'], ['x', 'credit-card', 'bezahlen?']], say: '{v:Hast} du schon {t:bezahlt}?', alt: 'Ja, mit Karte.' },
      { cue: [['n', 'user-round', 'sie'], ['x', 'phone', 'telefonieren']], say: 'Sie {v:hat} lange {t:telefoniert}.' },
      { cue: [['n', 'users', 'wir'], ['x', 'circle-help', 'nicht verstehen']], say: 'Wir {v:haben} das nicht {t:verstanden}.' },
      { cue: [['n', 'user-round', 'er'], ['x', 'phone-call', 'mich anrufen']], say: 'Er {v:hat} mich {t:angerufen}.' },
      { cue: [['n', 'user-round', 'ich'], ['x', 'sunrise', 'früh aufstehen']], say: 'Ich {v:bin} früh {t:aufgestanden}.' } ] }
});
