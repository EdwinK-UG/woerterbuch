/* Kapitel 58 – Verben mit Präpositionen (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 58, level: 'B1', group: 'Verben 3',
  title: 'Verben mit Präpositionen',
  kicker: 'sich freuen über, warten auf',
  intro: 'Viele Verben haben eine <b>feste Präposition</b>: warten <b>auf</b>, denken <b>an</b>, sich interessieren <b>für</b>. Die Präposition bestimmt den Fall. Lerne Verb, Präposition und Fall immer zusammen.',
  hero: 'Sie {v:freut} sich {a:über die Blumen}.',
  art: K => K.svg(K.room() + K.shadow(170) + K.shadow(370) +
    K.person({ x: 170, shirt: 'var(--nom)', skin: 1, hair: 'short', armR: 'out', face: 'smile',
      extra: '<g transform="translate(78 -118)"><path d="M-6 30L0 -2L6 30Z" fill="var(--hill1)"/>' + [[-10, -12, 'var(--die)'], [8, -14, 'var(--sun)'], [0, -24, 'var(--dat)'], [-14, -26, 'var(--akk)'], [14, -28, 'var(--die)']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="9" fill="${c}"/><circle cx="${x}" cy="${y}" r="3" fill="var(--card)"/>`).join('') + '</g>' }) +
    K.person({ x: 370, shirt: 'var(--akk)', skin: 4, hair: 'long', hc: 'var(--hair3)', armL: 'up', armR: 'chest', face: 'open' }) +
    K.bubble(340, 96, 'Ich *freue* mich *über* die Blumen!', { tail: 'r' }),
    'Ein Mann schenkt einer Frau Blumen. Sie freut sich über die Blumen.'),
  lemmas: { freut: 'freuen', wartet: 'warten', denke: 'denken', interessiere: 'interessieren' },

  understand: [
    { type: 'grid', title: 'Wichtige Verben mit Akkusativ-Präposition', head: ['Verb', 'Beispiel'], rows: [
      ['warten auf + A', 'Ich warte {a:auf den Bus}.'], ['sich freuen auf + A', 'Ich freue mich {a:auf die Ferien}. (Zukunft)'], ['sich freuen über + A', 'Ich freue mich {a:über das Geschenk}. (jetzt / vorbei)'],
      ['denken an + A', 'Ich denke oft {a:an dich}.'], ['sich erinnern an + A', 'Erinnerst du dich {a:an den Urlaub}?'], ['sich interessieren für + A', 'Er interessiert sich {a:für Musik}.'],
      ['sich ärgern über + A', 'Sie ärgert sich {a:über den Lärm}.'], ['sich kümmern um + A', 'Wer kümmert sich {a:um den Hund}?'], ['bitten um + A', 'Darf ich Sie {a:um Hilfe} bitten?'] ] },
    { type: 'grid', title: 'Wichtige Verben mit Dativ-Präposition', head: ['Verb', 'Beispiel'], rows: [
      ['sprechen mit + D', 'Ich spreche {d:mit dem Chef}.'], ['träumen von + D', 'Sie träumt {d:von einer Reise}.'], ['Angst haben vor + D', 'Er hat Angst {d:vor Hunden}.'],
      ['teilnehmen an + D', 'Wir nehmen {d:an dem Kurs} teil.'], ['sich verabreden mit + D', 'Ich bin {d:mit Lea} verabredet.'], ['fragen nach + D', 'Er fragt {d:nach dem Weg}.'] ] },
    { type: 'cards', title: 'Fragen', min: '14rem', items: [
      { t: 'Person', k: 'ac', p: 'Präposition + wen/wem', ex: '{e:Auf wen} wartest du? – Auf meine Schwester.' },
      { t: 'Sache', k: 'n', p: 'wo(r) + Präposition', ex: '{e:Worauf} wartest du? – Auf den Bus. (Kapitel 59)' } ] },
    { type: 'merk', text: 'Lerne immer: Verb + Präposition + Fall – z. B. „warten {a:auf + Akk.}“.' }
  ],

  examples: [
    'Wir warten schon lange {a:auf eine Antwort}.',
    'Ich freue mich so {a:auf das Wochenende}!',
    'Denkst du noch {a:an mich}?',
    'Sie interessiert sich {a:für Geschichte}.',
    'Kannst du mal {d:mit deinem Vater} sprechen?',
    'Mein Sohn hat Angst {d:vor der Dunkelheit}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welche Präposition?', instr: 'Wähle die feste Präposition.',
      items: [
        'Ich warte ((auf|für|an)) den Bus.', 'Er denkt oft ((an|über|von)) seine Familie.', 'Interessierst du dich ((für|auf|an)) Fußball?',
        'Sie träumt ((von|an|für)) einem Haus am Meer.', 'Wir freuen uns ((auf|an|von)) den Urlaub.', 'Ich habe Angst ((vor|von|an)) Spinnen.',
        'Er ärgert sich ((über|auf|für)) den Stau.', 'Kannst du dich ((um|für|an)) die Kinder kümmern?' ] },
    { id: 'u2', type: 'choice', title: 'freuen auf oder über?', instr: 'Zukunft oder jetzt/vorbei?',
      items: [
        'Morgen beginnen die Ferien. Ich freue mich ((auf|über)) die Ferien.', 'Danke für das Geschenk! Ich freue mich sehr ((über|auf)) das Geschenk.',
        'Nächste Woche kommt meine Oma. Ich freue mich ((auf|über)) ihren Besuch.', 'Du hast die Prüfung bestanden? Ich freue mich ((über|auf)) die gute Nachricht!' ] },
    { id: 'u3', type: 'fill', title: 'Der richtige Fall', instr: 'Schreib den Artikel.',
      items: [
        'Ich warte auf [[den]] Zug. (der Zug)', 'Sie spricht mit [[ihrem]] Lehrer. (ihr Lehrer)', 'Er denkt an [[seine]] Freundin. (seine Freundin)',
        'Wir nehmen an [[dem]] Kurs teil. (der Kurs)', 'Ich interessiere mich für [[die]] Geschichte. (die Geschichte)', 'Er hat Angst vor [[dem]] Hund. (der Hund)' ] },
    { id: 'u4', type: 'type', title: 'Frag nach der Person', instr: 'Frag nach dem markierten Teil.',
      items: [
        { q: 'Ich warte auf [meine Schwester].', pre: '', end: '?', ok: ['Auf wen wartest du'] },
        { q: 'Ich spreche mit [dem Chef].', pre: '', end: '?', ok: ['Mit wem sprichst du'] },
        { q: 'Ich denke an [meinen Opa].', pre: '', end: '?', ok: ['An wen denkst du'] },
        { q: 'Ich habe Angst vor [dem Lehrer].', pre: '', end: '?', ok: ['Vor wem hast du Angst'] } ] }
  ],

  speak: { title: 'Erzähl!', intro: 'Bilde Sätze mit der festen Präposition.', altLabel: 'Frage',
    items: [
      { cue: [['x', 'bus', 'warten auf · der Bus']], say: 'Ich warte {a:auf den Bus}.', alt: 'Worauf wartest du?' },
      { cue: [['x', 'sun', 'sich freuen auf · die Ferien']], say: 'Ich freue mich {a:auf die Ferien}.' },
      { cue: [['x', 'heart', 'denken an · meine Familie']], say: 'Ich denke oft {a:an meine Familie}.', alt: 'An wen denkst du?' },
      { cue: [['x', 'music', 'sich interessieren für · Musik']], say: 'Ich interessiere mich {a:für Musik}.' },
      { cue: [['x', 'plane', 'träumen von · eine Reise']], say: 'Ich träume {d:von einer Reise}.' },
      { cue: [['x', 'dog', 'Angst haben vor · Hunde']], say: 'Ich habe Angst {d:vor Hunden}.' } ] }
});
