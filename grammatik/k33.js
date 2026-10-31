/* Kapitel 33 – Präpositionen mit Dativ (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 33, level: 'A1', group: 'Präpositionen 1',
  title: 'Präpositionen mit Dativ',
  kicker: 'aus, bei, mit, nach, seit, von, zu',
  intro: 'Nach <b>aus, bei, mit, nach, seit, von, zu</b> steht <b>immer der Dativ</b>. Jede Präposition hat ein paar typische Bedeutungen – hier lernst du die wichtigsten.',
  hero: 'Ich komme {d:aus Uganda} und wohne {d:bei meiner Tante}.',
  art: K => K.svg(K.sky() +
    `<g><rect x="300" y="150" width="170" height="146" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><path d="M286 156L385 90L484 156Z" fill="var(--die)"/>
<rect x="364" y="226" width="40" height="70" rx="4" fill="var(--wood)"/><circle cx="396" cy="262" r="3" fill="var(--sun)"/><rect x="318" y="180" width="34" height="30" rx="3" fill="var(--sky1)" stroke="var(--wood)" stroke-width="3"/><rect x="420" y="180" width="34" height="30" rx="3" fill="var(--sky1)" stroke="var(--wood)" stroke-width="3"/></g>` +
    K.shadow(180) + K.shadow(430, 34) +
    K.person({ x: 180, shirt: 'var(--nom)', skin: 1, hair: 'curly', armL: 'wave', face: 'open' }) +
    `<rect x="214" y="276" width="40" height="50" rx="6" fill="var(--akk)"/><path d="M224 276v-10h20v10" stroke="var(--ink)" fill="none" stroke-width="3"/>` +
    K.person({ x: 430, s: .9, shirt: 'var(--dat)', dress: 'var(--dat)', skin: 1, hair: 'bun', armL: 'wave', face: 'open' }) +
    K.bubble(170, 90, 'Ich komme *aus* Uganda!', { tail: 'c' }) + K.bubble(394, 60, 'Willkommen *bei* uns!', { tail: 'r' }),
    'Ein junger Mann mit Koffer kommt aus Uganda. Seine Tante steht vor ihrem Haus: Willkommen bei uns!'),
  lemmas: { aus: 'aus', bei: 'bei', mit: 'mit', nach: 'nach', seit: 'seit', von: 'von', zu: 'zu', zum: 'zu', zur: 'zu', beim: 'bei', vom: 'von' },

  understand: [
    { type: 'cards', title: 'Die sieben Dativ-Präpositionen', min: '13rem', items: [
      { t: 'aus', k: 'd', s: 'Herkunft · aus einem Raum · Material', ex: 'Ich komme {d:aus Ghana}. Sie kommt {d:aus dem Haus}. Der Tisch ist {d:aus Holz}.' },
      { t: 'bei', k: 'd', s: 'bei einer Person · Firma · Nähe', ex: 'Ich wohne {d:bei meinen Eltern}. Er arbeitet {d:bei Siemens}. Potsdam liegt {d:bei Berlin}.' },
      { t: 'mit', k: 'd', s: 'zusammen · Verkehrsmittel · Werkzeug', ex: 'Ich gehe {d:mit dir}. Wir fahren {d:mit dem Bus}. Er schreibt {d:mit dem Stift}.' },
      { t: 'nach', k: 'd', s: 'Städte und Länder ohne Artikel · Zeit', ex: 'Wir fliegen {d:nach Kenia}. {d:Nach dem Kurs} gehen wir essen. Ich gehe nach Hause.' },
      { t: 'seit', k: 'd', s: 'Zeit von damals bis jetzt', ex: 'Ich lerne {d:seit einem Jahr} Deutsch.' },
      { t: 'von', k: 'd', s: 'Herkunft (Person, Ort) · Besitz · Zeit', ex: 'Das ist {d:von meiner Mutter}. Ich komme {d:vom Arzt}. {d:Von Montag} bis Freitag.' },
      { t: 'zu', k: 'd', s: 'Ziel: Personen, Geschäfte, Institutionen', ex: 'Ich gehe {d:zum Arzt}. Kommst du {d:zu mir}? Wir gehen {d:zur Post}.' } ] },
    { type: 'grid', title: 'seit oder vor?', head: ['', 'Beispiel', 'Bedeutung'], rows: [
      ['seit + Dativ', 'Ich wohne {d:seit zwei Jahren} hier.', 'Das ist noch so – bis heute.'],
      ['vor + Dativ', 'Ich bin {d:vor zwei Jahren} gekommen.', 'Das war ein Moment in der Vergangenheit.'] ] },
    { type: 'merk', text: '{d:Aus, bei, mit, nach, seit, von, zu} – fährst immer mit dem Dativ du!' },
    { type: 'note', title: 'Kurzformen', text: 'zu dem → {d:zum} · zu der → {d:zur} · bei dem → {d:beim} · von dem → {d:vom}' }
  ],

  examples: [
    'Mein Kollege kommt {d:aus der Türkei}.',
    'Heute Abend esse ich {d:bei meiner Oma}.',
    'Fährst du {d:mit dem Fahrrad} zur Arbeit?',
    'Im Sommer fliegen wir {d:nach Kanada}.',
    'Ich warte {d:seit einer Stunde} auf dich!',
    'Der Brief ist {d:von meinem Freund}.',
    'Ich muss {d:zur Bank}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welche Präposition?', instr: 'Wähle die passende Präposition.',
      items: [
        'Ich komme ((aus|von|zu)) Brasilien.', 'Wir fahren ((mit|bei|von)) der U-Bahn.', 'Am Wochenende fliegt sie ((nach|zu|bei)) Paris.',
        'Ich lerne ((seit|vor|ab)) drei Monaten Deutsch.', 'Er wohnt noch ((bei|mit|zu)) seinen Eltern.', 'Ich gehe heute ((zum|beim|vom)) Friseur.',
        'Das Geschenk ist ((von|aus|mit)) meiner Schwester.', 'Der Ring ist ((aus|von|mit)) Gold.' ] },
    { id: 'u2', type: 'fill', title: 'Der richtige Artikel', instr: 'Schreib den Artikel im Dativ.',
      items: [
        'Ich fahre mit [[dem]] Zug. (der Zug)', 'Er kommt aus [[der]] Schweiz. (die Schweiz)', 'Wir gehen zu [[einer]] Party. (eine Party)',
        'Seit [[einem]] Jahr wohne ich hier. (ein Jahr)', 'Das Paket ist von [[meinem]] Bruder. (mein Bruder)', 'Ich spiele mit [[den]] Kindern. (die Kinder)' ] },
    { id: 'u3', type: 'choice', title: 'seit oder vor?', instr: 'Noch bis jetzt – oder ein Moment in der Vergangenheit?',
      items: [
        'Ich wohne ((seit|vor)) 2020 in Köln.', 'Er ist ((vor|seit)) drei Tagen angekommen.', '((Seit|Vor)) einer Woche ist sie krank.',
        'Wir haben uns ((vor|seit)) zehn Jahren kennengelernt.', 'Ich warte schon ((seit|vor)) 20 Minuten.', '((Vor|Seit)) einem Monat war ich in Berlin.' ] },
    { id: 'u4', type: 'fill', title: 'Kurzformen', instr: 'Schreib zum, zur, beim oder vom.',
      items: [
        'Ich gehe [[zum]] Bahnhof.', 'Sie ist gerade [[beim]] Arzt.', 'Er kommt [[vom]] Training.',
        'Wie komme ich [[zur]] Universität?', 'Wir gehen [[zum]] Essen zu Oma.', 'Das ist ein Brief [[vom]] Finanzamt.' ] }
  ],

  speak: { title: 'Sag es mit Dativ', intro: 'Bilde den Satz mit der Präposition.', altLabel: 'Weiter',
    items: [
      { cue: [['n', 'user-round', 'ich'], ['d', 'map-pin', 'aus · Uganda']], say: 'Ich komme {d:aus Uganda}.' },
      { cue: [['n', 'user-round', 'ich'], ['d', 'house', 'bei · meine Tante']], say: 'Ich wohne {d:bei meiner Tante}.' },
      { cue: [['n', 'users', 'wir'], ['d', 'train-front', 'mit · der Zug']], say: 'Wir fahren {d:mit dem Zug}.' },
      { cue: [['n', 'user-round', 'sie'], ['d', 'plane', 'nach · Japan']], say: 'Sie fliegt {d:nach Japan}.' },
      { cue: [['n', 'user-round', 'ich'], ['d', 'stethoscope', 'zu · der Arzt']], say: 'Ich gehe {d:zum Arzt}.' },
      { cue: [['n', 'user-round', 'ich'], ['d', 'calendar', 'seit · ein Jahr · Deutsch lernen']], say: 'Ich lerne {d:seit einem Jahr} Deutsch.' } ] }
});
