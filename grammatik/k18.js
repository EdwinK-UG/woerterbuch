/* Kapitel 18 – Der Dativ (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 18, level: 'A1', group: 'Pronomen, Nomen und Artikel',
  title: 'Der Dativ',
  kicker: 'mit dem Bus, mit der Bahn',
  intro: 'Den <b>Dativ</b> brauchst du nach den Präpositionen <b>aus, bei, mit, nach, seit, von, zu</b> – und bei einigen Verben (Kapitel 22 und 23). Die Artikel ändern sich: <b>dem, dem, der</b> und im Plural <b>den … n</b>.',
  hero: 'Ich fahre {d:mit dem Rad} – und du {d:mit dem Bus}?',
  art: K => K.svg(K.street() + K.bus(380, 322) + `<circle cx="444" cy="254" r="12" fill="var(--skin4)"/><path d="M432 252q0-16 12-16t12 16q-6-8-12-7t-12 7z" fill="var(--hair3)"/>` +
    K.shadow(110) + K.person({ x: 110, shirt: 'var(--dat)', skin: 1, hair: 'curly', armR: 'out' }) + K.bike(200, 330) +
    K.bubble(130, 96, 'Ich fahre *mit dem* Rad!', { tail: 'l' }) + K.bubble(396, 150, 'Und ich *mit dem* Bus!', { tail: 'r' }),
    'Ein Mann mit Fahrrad sagt: Ich fahre mit dem Rad! Eine Frau im Bus ruft: Und ich mit dem Bus!'),
  lemmas: { fahre: 'fahren', wohnen: 'wohnen', zum: 'zu', zur: 'zu', beim: 'bei', vom: 'von', Kindern: 'Kind', Eltern: 'Eltern' },

  understand: [
    { type: 'table', title: 'Die Artikel im Dativ', head: ['maskulin', 'neutral', 'feminin', 'Plural'], sets: {
      der: [['der Bus', 'das Auto', 'die Bahn', 'die Freunde'], ['den Bus', 'das Auto', 'die Bahn', 'die Freunde'], ['dem Bus', 'dem Auto', 'der Bahn', 'den Freunde+n']],
      ein: [['ein Bus', 'ein Auto', 'eine Bahn', '– Freunde'], ['einen Bus', 'ein Auto', 'eine Bahn', '– Freunde'], ['einem Bus', 'einem Auto', 'einer Bahn', '– Freunde+n']],
      kein: [['kein Bus', 'kein Auto', 'keine Bahn', 'keine Freunde'], ['keinen Bus', 'kein Auto', 'keine Bahn', 'keine Freunde'], ['keinem Bus', 'keinem Auto', 'keiner Bahn', 'keinen Freunde+n']],
      mein: [['mein Bus', 'mein Auto', 'meine Bahn', 'meine Freunde'], ['meinen Bus', 'mein Auto', 'meine Bahn', 'meine Freunde'], ['meinem Bus', 'meinem Auto', 'meiner Bahn', 'meinen Freunde+n']] },
      foot: 'Im Dativ ändern sich alle Artikel. Im Plural bekommt das Nomen ein <b>-n</b> (den Freunde<b class="plusn">n</b>) – außer bei Nomen auf -s oder -n (mit den Autos, mit den Frauen).' },
    { type: 'cards', title: 'Diese Präpositionen haben immer Dativ', min: '12rem', items: [
      { t: 'mit', k: 'd', ex: 'Ich fahre {d:mit dem Bus}.' }, { t: 'bei', k: 'd', ex: 'Ich wohne {d:bei meiner Tante}.' },
      { t: 'von', k: 'd', ex: 'Das Geschenk ist {d:von meinem Bruder}.' }, { t: 'zu', k: 'd', ex: 'Ich gehe {d:zum Arzt}.' },
      { t: 'aus', k: 'd', ex: 'Er kommt {d:aus der Türkei}.' }, { t: 'nach', k: 'd', ex: '{d:Nach dem Essen} trinke ich Tee.' },
      { t: 'seit', k: 'd', ex: 'Ich lerne {d:seit einem Jahr} Deutsch.' } ] },
    { type: 'grid', title: 'Kurzformen', head: ['', 'Kurzform', 'Beispiel'], rows: [
      ['zu + dem', '{d:zum}', 'Ich gehe {d:zum} Bahnhof.'], ['zu + der', '{d:zur}', 'Wir gehen {d:zur} Schule.'],
      ['bei + dem', '{d:beim}', 'Er ist {d:beim} Arzt.'], ['von + dem', '{d:vom}', 'Das ist {d:vom} Chef.'] ] },
    { type: 'merk', text: '{d:aus, bei, mit, nach, seit, von, zu} – immer mit Dativ!' }
  ],

  examples: [
    'Ich fahre {d:mit dem Bus} zur Arbeit.',
    'Wir wohnen {d:bei unseren Eltern}.',
    'Das Paket ist {d:von meiner Schwester}.',
    '{d:Nach dem Kurs} gehen wir essen.',
    'Sie lernt {d:seit einem Jahr} Deutsch.',
    'Ich gehe morgen {d:zum Arzt}.',
    'Er spielt gern {d:mit den Kindern}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welcher Artikel?', instr: 'Wähle die richtige Dativform.',
      items: [
        'Ich fahre mit ((dem|den|der)) Zug.', 'Wir wohnen bei ((meiner|meine|meinem)) Oma.', 'Das ist ein Brief von ((meinem|meinen|mein)) Vater.',
        'Er spielt mit ((den|die|dem)) Kindern.', 'Ich lerne seit ((einem|ein|einen)) Monat Deutsch.', 'Nach ((der|die|dem)) Arbeit gehe ich nach Hause.',
        'Sie kommt aus ((der|die|dem)) Schweiz.', 'Wir fahren mit ((dem|das|den)) Auto.' ] },
    { id: 'u2', type: 'fill', title: 'Kurzformen', instr: 'Schreib die Kurzform: zum, zur, beim oder vom.',
      items: [
        '(zu + dem) Ich gehe [[zum]] Arzt.', '(zu + der) Wir gehen [[zur]] Schule.', '(bei + dem) Ich bin [[beim]] Friseur.',
        '(von + dem) Das Geschenk ist [[vom]] Chef.', '(zu + dem) Komm bitte [[zum]] Essen!', '(zu + der) Wie komme ich [[zur]] Post?' ] },
    { id: 'u3', type: 'fill', title: 'Dativ Plural', instr: 'Schreib das Nomen im Dativ Plural. Denk an das -n!',
      items: [
        '(die Kinder) Er spricht mit den [[Kindern]].', '(die Freunde) Ich fahre mit meinen [[Freunden]] ans Meer.', '(die Eltern) Wir wohnen bei unseren [[Eltern]].',
        '(die Kollegen) Sie isst mit den [[Kollegen]].', '(die Autos) Wir fahren mit zwei [[Autos]].', '(die Schüler) Der Lehrer spricht mit den [[Schülern]].' ] },
    { id: 'u4', type: 'cases', title: 'Welcher Fall?', instr: 'Tippe auf jeden markierten Satzteil, bis die richtige Farbe erscheint.',
      items: [
        '{n:Ich} fahre mit {d:dem Bus}.', '{n:Lisa} wohnt bei {d:ihrer Tante}.', 'Nach {d:dem Essen} trinkt {n:mein Vater} {a:einen Kaffee}.',
        '{n:Wir} spielen mit {d:den Kindern}.', 'Seit {d:einem Jahr} lernt {n:Amara} {a:Deutsch}.', '{n:Das Geschenk} ist von {d:meiner Oma}.' ] }
  ],

  speak: { title: 'Wie und wohin?', intro: 'Bilde einen Satz mit Präposition und Dativ.', altLabel: 'Weiter',
    items: [
      { cue: [['n', 'user-round', 'ich'], ['x', 'bus', 'fahren · mit · der Bus']], say: 'Ich fahre {d:mit dem Bus}.' },
      { cue: [['n', 'users', 'wir'], ['x', 'train-front', 'fahren · mit · die Bahn']], say: 'Wir fahren {d:mit der Bahn}.' },
      { cue: [['n', 'user-round', 'er'], ['x', 'bike', 'fahren · mit · das Fahrrad']], say: 'Er fährt {d:mit dem Fahrrad}.' },
      { cue: [['n', 'user-round', 'du'], ['x', 'stethoscope', 'gehen · zu · der Arzt']], say: 'Du gehst {d:zum Arzt}.' },
      { cue: [['n', 'user-round', 'ich'], ['x', 'house', 'wohnen · bei · meine Tante']], say: 'Ich wohne {d:bei meiner Tante}.' },
      { cue: [['n', 'user-round', 'sie'], ['x', 'calendar', 'Deutsch lernen · seit · ein Jahr']], say: 'Sie lernt {d:seit einem Jahr} Deutsch.' } ] }
});
