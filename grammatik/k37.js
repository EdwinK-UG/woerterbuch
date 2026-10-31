/* Kapitel 37 – Wohin? zu, nach, in, auf, an (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 37, level: 'A2', group: 'Präpositionen 1',
  title: 'Wohin? zu, nach, in, auf',
  kicker: 'zum Arzt, nach Berlin, ins Kino',
  intro: 'Wohin gehst du? Die Präposition hängt vom <b>Ziel</b> ab: <b>nach</b> für Städte und Länder ohne Artikel, <b>zu</b> für Personen und Geschäfte, <b>in</b> für Gebäude und Länder mit Artikel, <b>auf</b> für Plätze und Veranstaltungen, <b>an</b> für Wasser.',
  hero: 'Wir fahren {e:nach} Hamburg und dann {e:ans} Meer.',
  art: K => {
    const sign = (y, txt, c, dir) => `<g transform="translate(260 ${y})"><path d="${dir > 0 ? 'M0 -18H170L192 0L170 18H0Z' : 'M0 -18H-170L-192 0L-170 18H0Z'}" fill="var(--${c})"/><text x="${dir * 92}" y="6" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="16" fill="var(--card)">${txt}</text></g>`;
    return K.svg(K.sky() + `<rect x="254" y="60" width="12" height="270" rx="4" fill="var(--wood)"/>` +
      sign(90, 'nach Hamburg', 'der', 1) + sign(138, 'ans Meer', 'akk', -1) + sign(186, 'zum Bahnhof', 'nom', 1) + sign(234, 'in die Stadt', 'dat', -1) + sign(282, 'auf den Markt', 'die', 1),
      'Ein Wegweiser mit Schildern: nach Hamburg, ans Meer, zum Bahnhof, in die Stadt, auf den Markt.');
  },
  lemmas: { nach: 'nach', zum: 'zu', zur: 'zu', ins: 'in', ans: 'an' },

  understand: [
    { type: 'grid', title: 'Welches Ziel – welche Präposition?', head: ['Ziel', 'Präposition', 'Beispiele'], rows: [
      ['Städte, Länder ohne Artikel', '{e:nach}', 'nach Berlin · nach Kenia · nach Hause'],
      ['Länder mit Artikel', '{e:in} + Akk.', 'in die Schweiz · in die Türkei · in die USA'],
      ['Personen, Geschäfte, Ärzte', '{e:zu} + Dat.', 'zu Oma · zum Arzt · zur Apotheke · zu Aldi'],
      ['Gebäude, Räume', '{e:in} + Akk.', 'ins Kino · in die Schule · in den Supermarkt'],
      ['Plätze, Veranstaltungen', '{e:auf} + Akk.', 'auf den Markt · auf eine Party · auf die Bank'],
      ['Wasser, Grenzen', '{e:an} + Akk.', 'ans Meer · an den See · an den Strand'] ] },
    { type: 'note', title: 'zur Schule oder in die Schule?', text: 'Beides gibt es: {e:in die} Schule = hinein, als Schüler. {e:zur} Schule = das Ziel, der Weg. Kinder gehen meistens „in die Schule“.' },
    { type: 'note', title: 'nach Hause', text: 'Ich gehe {e:nach Hause} (Wohin?) – aber: Ich bin {e:zu Hause} (Wo?).' },
    { type: 'merk', text: 'Stadt/Land → {e:nach} · Person → {e:zu} · Gebäude → {e:in} · Platz → {e:auf} · Wasser → {e:an}' }
  ],

  examples: [
    'Im Sommer fliegen wir {e:nach} Mexiko.',
    'Meine Schwester zieht {e:in die} Schweiz.',
    'Ich muss heute noch {e:zum} Zahnarzt.',
    'Kommst du mit {e:ins} Schwimmbad?',
    'Am Samstag gehe ich {e:auf den} Markt.',
    'Wir fahren am Wochenende {e:an den} See.',
    'Es ist spät, ich gehe {e:nach} Hause.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welche Präposition?', instr: 'Wähle die passende Präposition.',
      items: [
        'Wir fliegen ((nach|in|zu)) Italien.', 'Ich gehe ((zum|ins|nach)) Arzt.', 'Sie fährt ((in die|nach|zur)) Türkei.', 'Kommst du mit ((ins|zum|nach)) Kino?',
        'Wir gehen ((auf den|in den|zum)) Markt.', 'Am Wochenende fahren wir ((ans|ins|nach)) Meer.', 'Ich gehe jetzt ((nach|zu|in)) Hause.', 'Er geht ((zu|nach|in)) seiner Oma.' ] },
    { id: 'u2', type: 'fill', title: 'zum oder zur?', instr: 'Schreib zum oder zur.',
      items: [
        'Ich gehe [[zum]] Bahnhof. (der Bahnhof)', 'Wir müssen [[zur]] Post. (die Post)', 'Sie bringt das Kind [[zum]] Kindergarten. (der Kindergarten)',
        'Wie komme ich [[zur]] Universität? (die Universität)', 'Geht ihr [[zum]] Konzert? (das Konzert)', 'Ich fahre [[zur]] Arbeit. (die Arbeit)' ] },
    { id: 'u3', type: 'choice', title: 'Wohin fahren sie?', instr: 'Wähle die richtige Form.',
      items: [
        'Wir fahren ((nach|in die)) Österreich.', 'Wir fahren ((in die|nach)) USA.', 'Sie fliegt ((nach|in den)) Ghana.',
        'Er reist ((in die|nach)) Slowakei.', 'Ich ziehe ((nach|in die)) Hamburg.', 'Sie fahren ((in die|nach)) Niederlande.' ] },
    { id: 'u4', type: 'type', title: 'Wohin gehst du?', instr: 'Antworte mit der richtigen Präposition.',
      items: [
        { q: 'der Arzt', pre: 'Ich gehe', end: '.', ok: ['zum Arzt'] },
        { q: 'Berlin', pre: 'Ich fahre', end: '.', ok: ['nach Berlin'] },
        { q: 'das Kino', pre: 'Ich gehe', end: '.', ok: ['ins Kino', 'in das Kino'] },
        { q: 'der Markt', pre: 'Ich gehe', end: '.', ok: ['auf den Markt'] },
        { q: 'der Strand', pre: 'Ich gehe', end: '.', ok: ['an den Strand'] },
        { q: 'die Schweiz', pre: 'Ich fahre', end: '.', ok: ['in die Schweiz'] } ] }
  ],

  speak: { title: 'Wohin gehst du?', intro: 'Sag, wohin du gehst oder fährst.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'stethoscope', 'der Arzt']], say: 'Ich gehe {e:zum} Arzt.' },
      { cue: [['x', 'map-pin', 'Kampala']], say: 'Ich fliege {e:nach} Kampala.' },
      { cue: [['x', 'clapperboard', 'das Kino']], say: 'Ich gehe {e:ins} Kino.' },
      { cue: [['x', 'store', 'der Markt']], say: 'Ich gehe {e:auf den} Markt.' },
      { cue: [['x', 'waves', 'das Meer']], say: 'Wir fahren {e:ans} Meer.' },
      { cue: [['x', 'house', 'Zuhause']], say: 'Ich gehe {e:nach} Hause.' } ] }
});
