/* Kapitel 38 – Wo? bei, in, auf, an (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 38, level: 'A2', group: 'Präpositionen 1',
  title: 'Wo? bei, in, auf',
  kicker: 'beim Arzt, in Berlin, am Meer',
  intro: 'Wo bist du? Die Präpositionen passen zu denen bei „Wohin?“ – aber jetzt mit <b>Dativ</b>: <b>bei</b> für Personen und Geschäfte, <b>in</b> für Städte, Länder und Gebäude, <b>auf</b> für Plätze und Veranstaltungen, <b>an</b> für Wasser.',
  hero: 'Ich bin {e:beim} Arzt – und du bist {e:am} Meer?',
  art: K => K.svg(`<rect width="260" height="360" fill="var(--wall)"/><rect y="296" width="260" height="64" fill="var(--floor)"/>
<rect x="40" y="56" width="70" height="70" rx="10" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><path d="M75 70v42M54 91h42" stroke="var(--die)" stroke-width="12"/>
<rect x="260" width="260" height="360" fill="var(--sky1)"/><circle cx="460" cy="64" r="26" fill="var(--sun)"/><rect x="260" y="210" width="260" height="70" style="fill:color-mix(in srgb,var(--der) 55%,var(--sky2))"/><rect x="260" y="276" width="260" height="84" fill="var(--floor)"/>
<path d="M300 236q12-8 24 0t24 0M420 252q12-8 24 0t24 0" stroke="var(--card)" stroke-width="3" fill="none" opacity=".8"/><path d="M258 0V360" stroke="var(--card)" stroke-width="6"/>` +
    K.shadow(140) + K.person({ x: 140, y: 340, shirt: 'var(--der)', skin: 1, hair: 'short', glasses: true, armR: 'chest', face: 'flat', extra: '<rect x="12" y="-176" width="12" height="22" rx="3" fill="var(--ink)"/>' }) +
    K.shadow(390, 40, 320) + K.person({ x: 390, y: 320, shirt: 'var(--nom)', skin: 3, hair: 'long', hc: 'var(--hair4)', armL: 'chest', armR: 'up', face: 'open', extra: '<rect x="-24" y="-176" width="12" height="22" rx="3" fill="var(--ink)"/>' }) +
    K.bubble(150, 150, 'Ich bin *beim* Arzt.', { tail: 'c' }) + K.bubble(380, 104, 'Ich bin *am* Meer!', { tail: 'c' }),
    'Ein Telefongespräch: Links ist ein Mann beim Arzt. Rechts ist eine Frau am Meer.'),
  lemmas: { beim: 'bei', am: 'an', im: 'in' },

  understand: [
    { type: 'grid', title: 'Wo bist du?', head: ['Ort', 'Präposition', 'Beispiele'], rows: [
      ['Personen, Geschäfte, Ärzte', '{e:bei} + Dat.', 'bei Oma · beim Arzt · bei Aldi · bei der Arbeit'],
      ['Städte, Länder', '{e:in}', 'in Berlin · in Kenia · in der Schweiz · in den USA'],
      ['Gebäude, Räume', '{e:in} + Dat.', 'im Kino · in der Schule · im Supermarkt'],
      ['Plätze, Veranstaltungen', '{e:auf} + Dat.', 'auf dem Markt · auf einer Party · auf der Bank'],
      ['Wasser, Grenzen', '{e:an} + Dat.', 'am Meer · am See · am Strand'],
      ['Zuhause', '{e:zu}', 'zu Hause'] ] },
    { type: 'note', title: 'Vergleiche mit Wohin?', text: 'zum Arzt → {e:beim} Arzt · nach Berlin → {e:in} Berlin · ins Kino → {e:im} Kino · auf den Markt → {e:auf dem} Markt · ans Meer → {e:am} Meer · nach Hause → {e:zu} Hause' },
    { type: 'merk', text: 'Person → {e:bei} · Stadt, Land, Gebäude → {e:in} · Platz → {e:auf} · Wasser → {e:an}' }
  ],

  examples: [
    'Ich war gestern {e:beim} Zahnarzt.',
    'Meine Familie wohnt {e:in} Nairobi.',
    'Wir treffen uns {e:im} Café.',
    'Am Samstag bin ich {e:auf dem} Markt.',
    'Wir machen Urlaub {e:am} Meer.',
    'Arbeitest du heute {e:bei} der Bank?',
    'Heute Abend bleibe ich {e:zu} Hause.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welche Präposition?', instr: 'Wähle die passende Präposition.',
      items: [
        'Ich bin ((beim|im|am)) Friseur.', 'Wir wohnen ((in|bei|nach)) Hamburg.', 'Sie ist ((auf einer|in einer|bei einer)) Party.', 'Die Kinder spielen ((am|im|beim)) Strand.',
        'Er arbeitet ((bei|in|auf)) Siemens.', 'Ich bleibe heute ((zu|nach|bei)) Hause.', 'Wir sind ((in der|bei der|an der)) Schweiz.', 'Meine Tante wohnt ((am|im|auf dem)) See.' ] },
    { id: 'u2', type: 'fill', title: 'Kurzformen und Artikel', instr: 'Schreib die Präposition mit Artikel (Kurzform, wenn möglich).',
      items: [
        '(bei + der Arzt) Ich warte [[beim]] Arzt.', '(in + das Kino) Wir sind [[im]] Kino.', '(an + der See) Das Hotel liegt [[am]] See.',
        '(auf + der Markt) Ich kaufe Obst [[auf dem]] Markt.', '(in + die Stadt) Sie ist [[in der]] Stadt.', '(bei + meine Eltern) Ich wohne [[bei meinen]] Eltern.' ] },
    { id: 'u3', type: 'choice', title: 'Wohin oder wo?', instr: 'Wähle die passende Form.',
      items: [
        'Ich gehe ((zum|beim)) Arzt.', 'Ich bin ((beim|zum)) Arzt.', 'Wir fahren ((nach|in)) Berlin.', 'Wir wohnen ((in|nach)) Berlin.',
        'Ich gehe ((nach|zu)) Hause.', 'Ich bin ((zu|nach)) Hause.' ] },
    { id: 'u4', type: 'type', title: 'Wo bist du?', instr: 'Antworte mit der richtigen Präposition.',
      items: [
        { q: 'der Arzt', pre: 'Ich bin', end: '.', ok: ['beim Arzt'] },
        { q: 'Berlin', pre: 'Ich bin', end: '.', ok: ['in Berlin'] },
        { q: 'das Kino', pre: 'Ich bin', end: '.', ok: ['im Kino', 'in dem Kino'] },
        { q: 'der Markt', pre: 'Ich bin', end: '.', ok: ['auf dem Markt'] },
        { q: 'das Meer', pre: 'Ich bin', end: '.', ok: ['am Meer', 'an dem Meer'] },
        { q: 'Zuhause', pre: 'Ich bin', end: '.', ok: ['zu Hause', 'zuhause'] } ] }
  ],

  speak: { title: 'Wo bist du gerade?', intro: 'Sag, wo du bist.', altLabel: 'Wohin?',
    items: [
      { cue: [['x', 'stethoscope', 'der Arzt']], say: 'Ich bin {e:beim} Arzt.', alt: 'Ich gehe {e:zum} Arzt.' },
      { cue: [['x', 'map-pin', 'Wien']], say: 'Ich bin {e:in} Wien.', alt: 'Ich fahre {e:nach} Wien.' },
      { cue: [['x', 'clapperboard', 'das Kino']], say: 'Ich bin {e:im} Kino.', alt: 'Ich gehe {e:ins} Kino.' },
      { cue: [['x', 'store', 'der Markt']], say: 'Ich bin {e:auf dem} Markt.', alt: 'Ich gehe {e:auf den} Markt.' },
      { cue: [['x', 'waves', 'der See']], say: 'Ich bin {e:am} See.', alt: 'Ich fahre {e:an den} See.' },
      { cue: [['x', 'house', 'Zuhause']], say: 'Ich bin {e:zu} Hause.', alt: 'Ich gehe {e:nach} Hause.' } ] }
});
