/* Kapitel 69 – n-Deklination (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 69, level: 'B1', group: 'Nomen 2',
  title: 'n-Deklination',
  kicker: 'den Polizisten, dem Kunden',
  intro: 'Einige <b>maskuline</b> Nomen bekommen in <b>allen Fällen außer Nominativ Singular</b> ein <b>-(e)n</b>: der Student – den Student<b>en</b> – dem Student<b>en</b>. Das sind vor allem Personen und Tiere.',
  hero: 'Ich frage {a:den Polizisten} nach dem Weg.',
  art: K => K.svg(K.street() + K.shadow(170) + K.shadow(360) +
    K.person({ x: 170, shirt: 'var(--nom)', skin: 4, hair: 'short', hc: 'var(--hair4)', armL: 'down', armR: 'front', face: 'open',
      extra: '<rect x="42" y="-118" width="40" height="30" rx="3" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><path d="M48 -110h28M48 -102h20" stroke="var(--der)" stroke-width="2"/><rect x="-46" y="-80" width="30" height="36" rx="6" fill="var(--akk)"/>' }) +
    K.person({ x: 360, shirt: 'var(--der)', skin: 1, hair: 'short', armL: 'out', face: 'smile',
      extra: '<path d="M-25 -184h50l-6-14h-38z" fill="var(--ink)"/><rect x="-27" y="-188" width="54" height="7" rx="3" fill="var(--ink)"/><circle cx="0" cy="-192" r="4" fill="var(--sun)"/>' }) +
    K.bubble(170, 92, 'Ich frage *den Polizisten*.', { tail: 'c' }) + K.tag(370, 120, 'der Polizist', 'der'),
    'Ein Tourist mit Stadtplan fragt einen Polizisten nach dem Weg.'),
  lemmas: { Polizisten: 'Polizist', Herrn: 'Herr', Kunden: 'Kunde', Studenten: 'Student', Kollegen: 'Kollege', Jungen: 'Junge', Menschen: 'Mensch', Nachbarn: 'Nachbar' },

  understand: [
    { type: 'grid', title: 'normal und n-Deklination', head: ['', 'normal', 'n-Deklination', 'n-Deklination'], rows: [
      ['Nominativ', 'der Mann', 'der Student', 'der Herr'], ['Akkusativ', 'den Mann', 'den Student{e:en}', 'den Herr{e:n}'],
      ['Dativ', 'dem Mann', 'dem Student{e:en}', 'dem Herr{e:n}'], ['Genitiv', 'des Mann(e)s', 'des Student{e:en}', 'des Herr{e:n}'],
      ['Plural', 'die Männer', 'die Student{e:en}', 'die Herr{e:en}'] ] },
    { type: 'cards', title: 'Welche Nomen?', min: '13rem', items: [
      { t: 'auf -e', k: 'n', p: 'maskuline Personen und Tiere', ws: ['der Junge', 'der Kollege', 'der Kunde', 'der Neffe', 'der Löwe', 'der Affe', 'der Franzose'] },
      { t: '-ent, -ant, -ist, -at, -oge', k: 'ac', p: 'oft Berufe (Fremdwörter)', ws: ['der Student', 'der Präsident', 'der Elefant', 'der Polizist', 'der Tourist', 'der Soldat', 'der Biologe'] },
      { t: 'Einzelne', k: 'd', p: 'diese einfach lernen', ws: ['der Herr', 'der Mensch', 'der Nachbar', 'der Bauer', 'der Bär', 'der Held'] } ],
      foot: 'Im Wörterbuch steht bei diesen Nomen: der Student, <b>-en, -en</b> (Genitiv und Plural).' },
    { type: 'merk', text: 'Nur Nominativ Singular ohne -n: {e:der} Kollege – sonst immer {e:-(e)n}.' }
  ],

  examples: [
    'Kennen Sie {a:den Jungen} dort?',
    'Ich helfe {d:meinem Kollegen}.',
    'Der Verkäufer spricht mit {d:dem Kunden}.',
    'Wir haben {a:einen neuen Nachbarn}.',
    'Das ist das Büro {e:des Präsidenten}.',
    'Im Zoo sehen wir {a:einen Elefanten}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Mit oder ohne -n?', instr: 'Wähle die richtige Form.',
      items: [
        'Der ((Student|Studenten)) lernt viel.', 'Ich frage den ((Studenten|Student)).', 'Wir helfen dem ((Kunden|Kunde)).',
        'Der ((Kunde|Kunden)) ist zufrieden.', 'Kennst du den ((Herrn|Herr)) dort?', 'Im Zoo gibt es einen ((Löwen|Löwe)).', 'Er spricht mit seinem ((Nachbarn|Nachbar)).', 'Das ist ein ((Mensch|Menschen)) mit Herz.' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze die Endung', instr: 'Schreib die Endung (oder lass die Lücke leer).',
      items: [
        'Ich sehe den Polizist[[en]].', 'Der Junge[[|-]] spielt Fußball.', 'Wir sprechen mit dem Präsident[[en]].',
        'Sie fragt ihren Kollege[[n]].', 'Der Tourist[[|-]] fotografiert die Kirche.', 'Gib dem Affe[[n]] keine Banane!' ] },
    { id: 'u3', type: 'type', title: 'Im Akkusativ', instr: 'Schreib das Nomen in Klammern im Akkusativ.',
      items: [
        { q: '(der Polizist) Ich frage …', pre: 'Ich frage', end: '.', ok: ['den Polizisten'] },
        { q: '(der Junge) Kennst du …?', pre: 'Kennst du', end: '?', ok: ['den Jungen'] },
        { q: '(ein Kollege) Ich habe … aus Kenia.', pre: 'Ich habe', end: ' aus Kenia.', ok: ['einen Kollegen'] },
        { q: '(der Herr) Sehen Sie … dort?', pre: 'Sehen Sie', end: ' dort?', ok: ['den Herrn'] } ] }
  ],

  speak: { title: 'Wen siehst du?', intro: 'Sag den Satz – mit -n!', altLabel: 'Dativ',
    items: [
      { cue: [['x', 'shield', 'der Polizist']], say: 'Ich frage {a:den Polizisten}.', alt: 'Ich spreche mit {d:dem Polizisten}.' },
      { cue: [['x', 'user-round', 'der Kollege']], say: 'Ich kenne {a:den Kollegen}.', alt: 'Ich helfe {d:dem Kollegen}.' },
      { cue: [['x', 'shopping-bag', 'der Kunde']], say: 'Wir begrüßen {a:den Kunden}.', alt: 'Wir danken {d:dem Kunden}.' },
      { cue: [['x', 'graduation-cap', 'der Student']], say: 'Ich treffe {a:den Studenten}.' },
      { cue: [['x', 'paw-print', 'der Löwe']], say: 'Ich sehe {a:einen Löwen}.' } ] }
});
