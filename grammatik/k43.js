/* Kapitel 43 – Superlativ (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 43, level: 'B1', group: 'Adjektive 1',
  title: 'Superlativ',
  kicker: 'am schnellsten, der größte',
  intro: 'Mit dem Superlativ sagst du: Nummer 1. Nach dem Verb: <b>am …sten</b> (am schnellsten). Vor dem Nomen: <b>der/das/die …ste</b> (der schnellste Läufer). Die Umlaute und Ausnahmen sind wie beim Komparativ.',
  hero: 'Amara läuft {e:am schnellsten} – sie ist {e:die schnellste} Läuferin.',
  art: K => K.svg(K.sky() +
    `<rect x="200" y="226" width="120" height="70" fill="var(--sun)"/><text x="260" y="276" text-anchor="middle" font-family="Fraunces,serif" font-size="40" font-weight="700" fill="var(--ink)">1</text>
<rect x="80" y="252" width="120" height="44" fill="var(--metal)"/><text x="140" y="286" text-anchor="middle" font-family="Fraunces,serif" font-size="32" font-weight="700" fill="var(--card)">2</text>
<rect x="320" y="266" width="120" height="30" fill="var(--wood)"/><text x="380" y="290" text-anchor="middle" font-family="Fraunces,serif" font-size="26" font-weight="700" fill="var(--card)">3</text>` +
    K.person({ x: 260, y: 226, s: .82, shirt: 'var(--akk)', skin: 1, hair: 'bun', armL: 'up', armR: 'up', face: 'open' }) +
    K.person({ x: 140, y: 252, s: .82, shirt: 'var(--der)', skin: 4, hair: 'short', hc: 'var(--hair3)', armR: 'wave' }) +
    K.person({ x: 380, y: 266, s: .82, shirt: 'var(--die)', skin: 3, hair: 'curly', hc: 'var(--hair2)' }) +
    K.tag(260, 42, 'am schnellsten', 'akk') + K.tag(140, 74, 'schneller', 'der') + K.tag(380, 88, 'schnell', 'die'),
    'Ein Siegertreppchen: Amara steht ganz oben auf Platz 1, daneben Platz 2 und 3.'),
  lemmas: { schnellsten: 'schnell', schnellste: 'schnell', größte: 'groß', besten: 'gut', meisten: 'viel', liebsten: 'gern', höchste: 'hoch' },

  understand: [
    { type: 'grid', title: 'Grundform – Komparativ – Superlativ', head: ['Grundform', 'Komparativ', 'Superlativ'], rows: [
      ['schnell', 'schnell{e:er}', 'am schnell{e:sten}'], ['alt', '{e:ä}lter', 'am {e:ä}lt{e:esten}'], ['groß', 'gr{e:ö}ßer', 'am gr{e:ö}ß{e:ten}'],
      ['kurz', 'k{e:ü}rzer', 'am k{e:ü}rz{e:esten}'], ['gut', '{e:besser}', 'am {e:besten}'], ['viel', '{e:mehr}', 'am {e:meisten}'],
      ['gern', '{e:lieber}', 'am {e:liebsten}'], ['hoch', '{e:höher}', 'am {e:höchsten}'], ['nah', '{e:näher}', 'am {e:nächsten}'] ],
      foot: 'Nach -d, -t, -s, -ß, -sch, -z kommt ein -e-: am ält<b>e</b>sten, am kürz<b>e</b>sten. Aber: am größten.' },
    { type: 'cards', title: 'Zwei Formen', min: '14rem', items: [
      { t: 'am …sten', k: 'ac', p: 'nach dem Verb (wie, wie viel?)', ex: 'Amara läuft {e:am schnellsten}. Ich trinke {e:am liebsten} Tee.' },
      { t: 'der …ste', k: 'a', p: 'vor dem Nomen – mit Adjektivendung', ex: 'Sie ist {e:die schnellste} Läuferin. Das ist {e:das höchste} Haus der Stadt.' } ] },
    { type: 'merk', text: 'Nummer 1: {e:am} …{e:sten} – oder {e:der/das/die} …{e:ste} + Nomen.' }
  ],

  examples: [
    'Der Gepard ist das {e:schnellste} Tier der Welt.',
    'Im August ist es hier {e:am heißesten}.',
    'Welche Stadt ist {e:am schönsten}?',
    'Ich esse {e:am liebsten} Matooke.',
    'Der Kilimandscharo ist der {e:höchste} Berg Afrikas.',
    'Wer hat die {e:meisten} Punkte?',
    'Das ist mein {e:bester} Freund.'
  ],

  exercises: [
    { id: 'u1', type: 'fill', title: 'Superlativ bilden', instr: 'Schreib den Superlativ mit am.',
      items: [
        'schnell → am [[schnellsten]]', 'alt → am [[ältesten]]', 'gut → am [[besten]]', 'viel → am [[meisten]]',
        'gern → am [[liebsten]]', 'groß → am [[größten]]', 'hoch → am [[höchsten]]', 'kurz → am [[kürzesten]]' ] },
    { id: 'u2', type: 'choice', title: 'am …sten oder der …ste?', instr: 'Wähle die richtige Form.',
      items: [
        'Lisa singt ((am schönsten|die schönste)).', 'Das ist ((das teuerste|am teuersten)) Auto.', 'Wer kann ((am schnellsten|der schnellste)) laufen?',
        'Er ist ((der beste|am besten)) Spieler im Team.', 'Ich mag Schokolade ((am liebsten|die liebste)).', 'Das ist ((der höchste|am höchsten)) Turm der Stadt.' ] },
    { id: 'u3', type: 'choice', title: 'Grundform, Komparativ oder Superlativ?', instr: 'Wähle die passende Form.',
      items: [
        'Ein Fahrrad ist ((billiger|am billigsten|billig)) als ein Auto.', 'Von allen Monaten ist der Februar ((am kürzesten|kürzer|kurz)).',
        'Mein Bruder ist so ((alt|älter|am ältesten)) wie ich.', 'Das ist die ((beste|besser|gut)) Idee von allen!',
        'Wer wohnt ((am nächsten|näher|nah)) an der Schule?', 'Heute ist es ((wärmer|am wärmsten|warm)) als gestern.' ] },
    { id: 'u4', type: 'type', title: 'Wer ist Nummer 1?', instr: 'Schreib den Satz mit dem Superlativ.',
      items: [
        { q: 'Amara 10 s · Tom 12 s · Lea 14 s (schnell laufen)', pre: 'Amara läuft', end: '.', ok: ['am schnellsten'] },
        { q: 'Opa 80 · Oma 78 · Tante 50 (alt)', pre: 'Opa ist', end: '.', ok: ['am ältesten'] },
        { q: 'Tee ♥♥♥ · Saft ♥♥ · Cola ♥ (gern trinken)', pre: 'Ich trinke', end: ' Tee.', ok: ['am liebsten'] },
        { q: 'der Berg (hoch) – vor dem Nomen', pre: 'Das ist der', end: ' Berg.', ok: ['höchste'] },
        { q: 'die Idee (gut) – vor dem Nomen', pre: 'Das ist die', end: ' Idee.', ok: ['beste'] },
        { q: 'Ben 30 Punkte · Mia 25 · Sam 20 (viele Punkte)', pre: 'Ben hat', end: ' Punkte.', ok: ['die meisten'] } ] }
  ],

  speak: { title: 'Was magst du am liebsten?', intro: 'Antworte mit dem Superlativ.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'utensils', 'Essen · gern']], say: 'Ich esse {e:am liebsten} …' },
      { cue: [['x', 'map-pin', 'Stadt · schön']], say: 'Die {e:schönste} Stadt ist …' },
      { cue: [['x', 'sun', 'Jahreszeit · gern']], say: '{e:Am liebsten} mag ich den Sommer.' },
      { cue: [['x', 'users', 'Familie · alt']], say: 'Meine Oma ist {e:am ältesten}.' },
      { cue: [['x', 'mountain', 'Afrika · Berg · hoch']], say: 'Der Kilimandscharo ist der {e:höchste} Berg Afrikas.' },
      { cue: [['x', 'trophy', 'Sport · gut']], say: '{e:Am besten} kann ich schwimmen.' } ] }
});
