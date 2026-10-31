/* Kapitel 77 – wenn und als (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 77, level: 'B1', group: 'Sätze verbinden 2',
  title: 'wenn und als',
  kicker: 'Zeit in Nebensätzen',
  intro: '<b>als</b> benutzt du für <b>eine einzige Situation</b> oder einen Zeitraum <b>in der Vergangenheit</b>. <b>wenn</b> benutzt du für Gegenwart und Zukunft – und für Dinge, die in der Vergangenheit <b>öfter</b> passiert sind (immer wenn).',
  hero: '{e:Als} ich ein Kind {v:war}, wohnte ich in Gulu.',
  art: K => K.svg(K.sky() + `<path d="M40 330H480" stroke="var(--ink)" stroke-width="3"/><path d="M470 322l12 8l-12 8" fill="var(--ink)"/>` +
    K.shadow(130, 30, 330) + K.person({ x: 130, s: .6, shirt: 'var(--nom)', skin: 1, hair: 'curly', armR: 'wave', face: 'open' }) +
    K.shadow(360, 40, 330) + K.person({ x: 360, shirt: 'var(--nom)', skin: 1, hair: 'curly', beard: 'var(--hair2)', armL: 'hip' }) +
    K.arrow('M170 250Q260 200 320 220', 'var(--faint)') + K.tag(130, 160, 'als Kind', 'nom') + K.tag(360, 70, 'heute', 'akk'),
    'Eine Zeitlinie: links ein Junge, rechts derselbe Mann als Erwachsener.'),
  lemmas: { als: 'als', wenn: 'wenn', war: 'sein', wohnte: 'wohnen' },

  understand: [
    { type: 'grid', title: 'als oder wenn?', head: ['', 'einmal', 'mehrmals / immer'], rows: [
      ['Vergangenheit', '{e:als}: {e:Als} ich 18 {v:war}, …', '{e:wenn}: {e:(Immer) wenn} ich krank {v:war}, …'],
      ['Gegenwart / Zukunft', '{e:wenn}: {e:Wenn} ich morgen {v:komme}, …', '{e:wenn}: {e:Wenn} ich Zeit {v:habe}, …'] ] },
    { type: 'cards', title: 'Beispiele', min: '14rem', items: [
      { t: 'als – einmal', k: 'n', ex: '{e:Als} ich in Berlin {v:ankam}, regnete es.' },
      { t: 'als – ein Zeitraum', k: 'n', ex: '{e:Als} ich Student {v:war}, hatte ich wenig Geld.' },
      { t: 'wenn – immer wieder', k: 'ac', ex: '{e:Wenn} wir Oma {v:besuchten}, gab es Kuchen.' },
      { t: 'wenn – Zukunft', k: 'ac', ex: '{e:Wenn} ich fertig {v:bin}, rufe ich dich an.' } ] },
    { type: 'merk', text: 'Vergangenheit + einmal = {e:als}. Alles andere = {e:wenn}.' },
    { type: 'note', title: 'Nebensatz zuerst', text: 'Wie bei weil: Nach dem Nebensatz kommt sofort das Verb: Als ich ankam, {v:regnete} es.' }
  ],

  examples: [
    '{e:Als} ich zehn {v:war}, bekam ich mein erstes Fahrrad.',
    '{e:Wenn} es regnet, {v:bleibe} ich zu Hause.',
    '{e:Als} der Film zu Ende {v:war}, gingen wir essen.',
    '{e:Immer wenn} ich sie {v:sah}, lachte sie.',
    'Ruf mich an, {e:wenn} du {v:ankommst}.',
    '{e:Als} wir in Mombasa {v:wohnten}, gingen wir oft an den Strand.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'als oder wenn?', instr: 'Wähle als oder wenn.',
      items: [
        '((Als|Wenn)) ich ein Kind war, spielte ich viel draußen.', '((Wenn|Als)) ich morgen Zeit habe, komme ich.', '((Als|Wenn)) ich gestern nach Hause kam, war niemand da.',
        'Immer ((wenn|als)) ich Kaffee trinke, kann ich nicht schlafen.', '((Wenn|Als)) wir früher Urlaub hatten, fuhren wir ans Meer.', '((Als|Wenn)) ich 2020 nach Deutschland kam, sprach ich kein Deutsch.' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze', instr: 'Schreib als oder wenn.',
      items: [
        '[[Als]] meine Schwester geboren wurde, war ich fünf.', '[[Wenn]] du Hunger hast, iss etwas!', '[[Als]] wir in Kenia waren, haben wir Elefanten gesehen.',
        'Jedes Mal, [[wenn]] er kommt, bringt er Blumen mit.', '[[Wenn]] ich groß bin, werde ich Ärztin.', '[[Als]] das Telefon klingelte, schlief ich schon.' ] },
    { id: 'u3', type: 'type', title: 'Verbinde', instr: 'Verbinde mit als oder wenn.',
      items: [
        { q: 'Ich war klein. Ich hatte Angst vor Hunden. (als)', pre: 'Als ich klein war,', end: ' Angst vor Hunden.', ok: ['hatte ich'] },
        { q: 'Ich habe Zeit. Ich lese. (wenn)', pre: '', end: ', lese ich.', ok: ['Wenn ich Zeit habe'] },
        { q: 'Er kam nach Hause. Er war müde. (als)', pre: '', end: ', war er müde.', ok: ['Als er nach Hause kam'] } ] }
  ],

  speak: { title: 'Erzähl von früher', intro: 'Bilde Sätze mit als oder wenn.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'baby', 'Kind sein · in Gulu wohnen']], say: '{e:Als} ich ein Kind {v:war}, wohnte ich in Gulu.' },
      { cue: [['x', 'cloud-rain', 'es regnet · zu Hause bleiben']], say: '{e:Wenn} es {v:regnet}, bleibe ich zu Hause.' },
      { cue: [['x', 'plane', '2020 nach Deutschland kommen · kein Deutsch sprechen']], say: '{e:Als} ich 2020 nach Deutschland {v:kam}, sprach ich kein Deutsch.' },
      { cue: [['x', 'cake', 'immer · Oma besuchen · Kuchen essen']], say: '{e:Immer wenn} wir Oma {v:besuchten}, aßen wir Kuchen.' },
      { cue: [['x', 'phone', 'ankommen · anrufen']], say: 'Ruf mich an, {e:wenn} du {v:ankommst}.' } ] }
});
