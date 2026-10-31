/* Kapitel 40 – Adjektivendungen (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 40, level: 'A2', group: 'Adjektive 1',
  title: 'Adjektivendungen',
  kicker: 'ein rotes Auto, die kleine Katze',
  intro: 'Steht ein Adjektiv <b>vor einem Nomen</b>, bekommt es eine Endung. Die Endung hängt vom Artikel, vom Genus und vom Fall ab. Steht es <b>nach dem Verb</b> (sein, werden, finden …), bekommt es keine Endung.',
  hero: 'Das ist ein rot{e:es} Auto – und das Auto ist rot.',
  art: K => K.svg(K.sky() + K.tree(440, 300, 1.15) + K.shadow(200, 90) + K.car(200, 330, 'var(--die)') + K.cat(370, 326, { s: .75, c: 'var(--nom)' }) +
    K.tag(200, 210, 'ein rotes Auto', 'die') + K.tag(370, 240, 'eine kleine Katze', 'nom') + K.tag(440, 60, 'der große Baum', 'akk'),
    'Ein rotes Auto, eine kleine Katze und ein großer Baum.'),
  lemmas: { rotes: 'rot', kleine: 'klein', große: 'groß', roten: 'rot', neuen: 'neu', alten: 'alt' },

  understand: [
    { type: 'cards', title: 'Mit oder ohne Endung?', min: '14rem', items: [
      { t: 'ohne Endung', k: 'f', p: 'Das Adjektiv steht nach dem Verb.', ex: 'Das Auto ist rot. Ich finde den Film gut.' },
      { t: 'mit Endung', k: 'ac', p: 'Das Adjektiv steht vor dem Nomen.', ex: 'ein rot{e:es} Auto · der gut{e:e} Film' } ] },
    { type: 'grid', title: 'Nach der, das, die (bestimmter Artikel)', head: ['', 'maskulin', 'neutral', 'feminin', 'Plural'], rows: [
      ['Nominativ', 'der rot{e:e} Hut', 'das rot{e:e} Auto', 'die rot{e:e} Tasche', 'die rot{e:en} Schuhe'],
      ['Akkusativ', 'den rot{e:en} Hut', 'das rot{e:e} Auto', 'die rot{e:e} Tasche', 'die rot{e:en} Schuhe'],
      ['Dativ', 'dem rot{e:en} Hut', 'dem rot{e:en} Auto', 'der rot{e:en} Tasche', 'den rot{e:en} Schuhen'] ],
      foot: 'Nur <b>-e</b> oder <b>-en</b>: -e in den fünf Feldern oben links (Nominativ Singular, Akkusativ neutral und feminin), sonst immer -en.' },
    { type: 'grid', title: 'Nach ein, kein, mein …', head: ['', 'maskulin', 'neutral', 'feminin', 'Plural'], rows: [
      ['Nominativ', 'ein rot{e:er} Hut', 'ein rot{e:es} Auto', 'eine rot{e:e} Tasche', 'keine rot{e:en} Schuhe'],
      ['Akkusativ', 'einen rot{e:en} Hut', 'ein rot{e:es} Auto', 'eine rot{e:e} Tasche', 'keine rot{e:en} Schuhe'],
      ['Dativ', 'einem rot{e:en} Hut', 'einem rot{e:en} Auto', 'einer rot{e:en} Tasche', 'keinen rot{e:en} Schuhen'] ],
      foot: 'Nach <b>ein</b> ohne Endung zeigt das Adjektiv das Genus: ein rot<b>er</b> Hut (de<b>r</b>), ein rot<b>es</b> Auto (da<b>s</b>).' },
    { type: 'merk', text: 'Fehlt dem Artikel das Signal, übernimmt es das Adjektiv: ein rot{e:er} Hut – ein rot{e:es} Auto.' },
    { type: 'note', title: 'Besondere Adjektive', text: 'dunkel → eine {e:dunkle} Nacht · teuer → ein {e:teures} Auto · hoch → ein {e:hoher} Berg. Ohne Endung bleiben: lila, rosa, prima.' }
  ],

  examples: [
    'Ich trinke gern {e:kalten} Saft.',
    'Der {e:neue} Kollege heißt Samuel.',
    'Sie trägt ein {e:schönes} Kleid.',
    'Wir wohnen in einem {e:kleinen} Dorf.',
    'Hast du den {e:roten} Rucksack gesehen?',
    'Das ist eine {e:gute} Idee!',
    'Mein Opa hat einen {e:großen} Garten.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Nach der, das, die', instr: 'Wähle die richtige Endung.',
      items: [
        'Der ((neue|neuen|neues)) Lehrer ist nett.', 'Ich kaufe die ((rote|roten|roter)) Jacke.', 'Das ((kleine|kleinen|kleines)) Kind schläft.',
        'Wir sehen den ((alten|alte|alter)) Film.', 'Mit dem ((neuen|neue|neuem)) Fahrrad fahre ich zur Arbeit.', 'Die ((teuren|teure|teurer)) Schuhe gefallen mir.' ] },
    { id: 'u2', type: 'choice', title: 'Nach ein, kein, mein', instr: 'Wähle die richtige Endung.',
      items: [
        'Das ist ein ((schöner|schöne|schönes)) Tag.', 'Ich habe ein ((neues|neue|neuer)) Handy.', 'Sie hat eine ((kleine|kleinen|kleiner)) Wohnung.',
        'Er sucht einen ((guten|gute|guter)) Job.', 'Wir wohnen in einem ((alten|alte|altes)) Haus.', 'Das sind keine ((guten|gute|guter)) Ideen.' ] },
    { id: 'u3', type: 'fill', title: 'Ergänze die Endung', instr: 'Schreib die Endung. Gibt es keine Endung, lass die Lücke leer (oder schreib „-“).',
      items: [
        'Ich trinke einen heiß[[en]] Tee.', 'Der Tee ist heiß[[-|–|]].', 'Das ist mein neu[[es]] Auto.',
        'Wir essen in einem klein[[en]] Restaurant.', 'Die alt[[e]] Frau wohnt neben uns.', 'Ich finde das Buch spannend[[-|–|]].' ] },
    { id: 'u4', type: 'type', title: 'Beschreib es', instr: 'Schreib das Adjektiv mit der richtigen Endung vor das Nomen.',
      items: [
        { q: 'Das Kleid ist schön. → Das ist ein …', pre: 'Das ist ein', end: '.', ok: ['schönes Kleid'] },
        { q: 'Der Kaffee ist heiß. → Ich trinke einen …', pre: 'Ich trinke einen', end: '.', ok: ['heißen Kaffee'] },
        { q: 'Die Tasche ist neu. → Das ist meine …', pre: 'Das ist meine', end: '.', ok: ['neue Tasche'] },
        { q: 'Das Auto ist alt. → Er fährt ein …', pre: 'Er fährt ein', end: '.', ok: ['altes Auto'] },
        { q: 'Der Mann ist nett. → Das ist der …', pre: 'Das ist der', end: '.', ok: ['nette Mann'] },
        { q: 'Die Kinder sind klein. → Ich spiele mit den …', pre: 'Ich spiele mit den', end: '.', ok: ['kleinen Kindern'] } ] }
  ],

  speak: { title: 'Was siehst du?', intro: 'Beschreib mit Adjektiv und Endung.', altLabel: 'Mit „der“',
    items: [
      { cue: [['x', 'car', 'ein Auto · rot']], say: 'Das ist ein rot{e:es} Auto.', alt: 'Das rot{e:e} Auto gehört mir.' },
      { cue: [['x', 'cat', 'eine Katze · klein']], say: 'Das ist eine klein{e:e} Katze.', alt: 'Die klein{e:e} Katze schläft.' },
      { cue: [['x', 'trees', 'ein Baum · groß']], say: 'Das ist ein groß{e:er} Baum.', alt: 'Der groß{e:e} Baum ist alt.' },
      { cue: [['x', 'coffee', 'einen Kaffee · heiß (Akk.)']], say: 'Ich möchte einen heiß{e:en} Kaffee.' },
      { cue: [['x', 'house', 'in einem Haus · alt (Dat.)']], say: 'Wir wohnen in einem alt{e:en} Haus.' },
      { cue: [['x', 'footprints', 'die Schuhe · neu (Plural)']], say: 'Die neu{e:en} Schuhe sind bequem.' } ] }
});
