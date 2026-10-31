/* Kapitel 9 – Imperativ (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 9, level: 'A1', group: 'Verben 1',
  title: 'Imperativ',
  kicker: 'Komm! Kommt! Kommen Sie!',
  intro: 'Mit dem Imperativ bittest du jemanden um etwas, gibst einen Rat oder sagst, was jemand tun soll. Es gibt drei Formen: für <b>du</b>, für <b>ihr</b> und für <b>Sie</b>. Mit <b>bitte</b> klingt es freundlich.',
  hero: '{v:Hilf} mir bitte!',
  art: K => K.svg(K.room() + K.shadow(170) + K.shadow(392) +
    K.person({ x: 170, shirt: 'var(--die)', skin: 1, hair: 'long', hc: 'var(--hair2)', armL: 'hold', armR: 'hold', face: 'o' }) + K.boxes(170, 282) +
    K.person({ x: 392, shirt: 'var(--das)', skin: 4, hair: 'short', hc: 'var(--hair4)', armL: 'out', armR: 'wave', face: 'open' }) +
    K.arrow('M320 250q-30 10-80 6', 'var(--das)') +
    K.bubble(150, 84, '*Hilf* mir bitte!', { tail: 'c' }) + K.bubble(392, 112, 'Klar, ich komme!', { tail: 'c' }),
    'Eine Frau trägt viele Kisten und ruft: Hilf mir bitte! Ein Mann kommt: Klar, ich komme!'),
  lemmas: { Hilf: 'helfen', Komm: 'kommen', Kommt: 'kommen', Hört: 'hören', Gib: 'geben', Fahr: 'fahren', Sei: 'sein', Ruf: 'anrufen', Warte: 'warten', Nehmen: 'nehmen' },

  understand: [
    { type: 'grid', title: 'So bildest du den Imperativ', head: ['', 'Präsens', 'Imperativ', 'Regel'], rows: [
      ['du', 'du komm{e:st}', '{v:Komm}!', 'du-Form ohne <b>du</b> und ohne <b>-st</b>'],
      ['ihr', 'ihr kommt', '{v:Kommt}!', 'ihr-Form ohne <b>ihr</b>'],
      ['Sie', 'Sie kommen', '{v:Kommen} Sie!', 'Verb + <b>Sie</b>'] ] },
    { type: 'cards', title: 'Besondere Formen', min: '13rem', items: [
      { t: 'e → i bleibt', k: 'n', p: 'Der Vokalwechsel e → i/ie bleibt.', ex: 'du gibst → {v:Gib}! · du nimmst → {v:Nimm}! · du liest → {v:Lies}!' },
      { t: 'a → ä fällt weg', k: 'd', p: 'Ohne Umlaut!', ex: 'du fährst → {v:Fahr}! · du schläfst → {v:Schlaf}!' },
      { t: '-t / -d + e', k: 'a', p: 'Stamm auf -t oder -d: mit -e.', ex: '{v:Warte}! · {v:Arbeite}! · {v:Finde} es!' },
      { t: 'sein', k: 'b', p: 'Ganz unregelmäßig.', ex: '{v:Sei} leise! · {v:Seid} leise! · {v:Seien} Sie leise!' },
      { t: 'trennbar', k: 'ok', p: 'Das Präfix kommt ans Ende.', ex: '{v:Ruf} mich {t:an}! · {v:Steht} {t:auf}!' } ] },
    { type: 'merk', text: 'du-Form ohne du und ohne -st: du komm{e:st} → {v:Komm}!' },
    { type: 'note', title: 'Freundlich bitten', text: 'Ein Imperativ allein kann streng klingen. Freundlicher mit bitte oder mal: {v:Komm} bitte! {v:Warte} mal kurz! – Noch höflicher ist eine Frage: {v:Kannst} du mir bitte {t:helfen}?' }
  ],

  examples: [
    '{v:Komm} bitte pünktlich!',
    '{v:Hört} gut {t:zu}!',
    '{v:Nehmen} Sie bitte Platz.',
    '{v:Gib} mir bitte das Salz.',
    '{v:Fahr} vorsichtig!',
    '{v:Sei} nicht traurig!',
    '{v:Ruf} mich morgen {t:an}!'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Die richtige Form', instr: 'Wähle die richtige Imperativform.',
      items: [
        '((Gib|Geb|Gibst)) mir bitte das Buch!', '((Nimm|Nehm|Nimmst)) doch noch ein Stück Kuchen!', 'Kinder, ((wascht|wäscht|waschen)) euch die Hände!',
        'Herr Weber, ((kommen Sie|komm|kommt)) bitte herein!', '((Fahr|Fähr|Fährst)) nicht so schnell!', '((Sei|Bist|Seid)) bitte still, Tom!',
        '((Lies|Les|Lest)) mal diesen Artikel, Anna!', '((Wartet|Wart|Warten)) auf mich, ihr zwei!' ] },
    { id: 'u2', type: 'type', title: 'Mach eine Bitte daraus', instr: 'Schreib den Satz im Imperativ. „bitte“ darfst du dazuschreiben.',
      items: [
        { q: 'Du kommst morgen.', pre: '', end: '!', ok: ['Komm morgen', 'Komm bitte morgen', 'Komm morgen bitte', 'Bitte komm morgen'] },
        { q: 'Du hilfst mir.', pre: '', end: '!', ok: ['Hilf mir', 'Hilf mir bitte', 'Bitte hilf mir'] },
        { q: 'Ihr seid leise.', pre: '', end: '!', ok: ['Seid leise', 'Seid bitte leise', 'Bitte seid leise'] },
        { q: 'Sie nehmen Platz.', pre: '', end: '!', ok: ['Nehmen Sie Platz', 'Nehmen Sie bitte Platz', 'Bitte nehmen Sie Platz'] },
        { q: 'Du liest den Text.', pre: '', end: '!', ok: ['Lies den Text', 'Lies bitte den Text', 'Lies den Text bitte', 'Bitte lies den Text'] },
        { q: 'Du fährst langsam.', pre: '', end: '!', ok: ['Fahr langsam', 'Fahre langsam', 'Fahr bitte langsam', 'Fahr langsam bitte', 'Bitte fahr langsam'] } ] },
    { id: 'u3', type: 'fill', title: 'Trennbare Verben im Imperativ', instr: 'Schreib das Verb und das Präfix in die Lücken.',
      items: [
        '(anrufen, du) [[Ruf]] mich später [[an]]!', '(aufstehen, ihr) [[Steht]] bitte [[auf]]!', '(mitkommen, du) [[Komm]] doch [[mit]]!',
        '(zumachen, Sie) [[Machen]] Sie bitte die Tür [[zu]].', '(einkaufen, du) [[Kauf]] bitte Milch [[ein]]!', '(zuhören, ihr) [[Hört]] gut [[zu]]!' ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'Im Imperativ steht das Verb auf Position 1.',
      items: [
        { tiles: ['Kommen', 'Sie', 'bitte', 'herein'], end: '!', ok: ['Kommen Sie bitte herein'] },
        { tiles: ['Ruf', 'mich', 'morgen', 'an'], end: '!', ok: ['Ruf mich morgen an'] },
        { tiles: ['Gib', 'mir', 'bitte', 'den Schlüssel'], end: '!', ok: ['Gib mir bitte den Schlüssel', 'Gib mir den Schlüssel bitte'] },
        { tiles: ['Mach', 'das Licht', 'aus'], end: '!', ok: ['Mach das Licht aus'] },
        { tiles: ['Seid', 'bitte', 'leise'], end: '!', ok: ['Seid bitte leise'] } ] }
  ],

  speak: { title: 'Was sagst du?', intro: 'Wer? Was? Sag den passenden Imperativ.', altLabel: 'Freundlicher',
    items: [
      { cue: [['n', 'user-round', 'Freund'], ['x', 'zap', 'schnell kommen']], say: '{v:Komm} schnell!', alt: '{v:Komm} bitte schnell!' },
      { cue: [['n', 'users', 'Kinder'], ['x', 'bed', 'Zimmer aufräumen']], say: '{v:Räumt} euer Zimmer {t:auf}!', alt: '{v:Räumt} bitte euer Zimmer {t:auf}!' },
      { cue: [['n', 'user-round', 'Gast (Sie)'], ['x', 'armchair', 'Platz nehmen']], say: '{v:Nehmen} Sie Platz!', alt: '{v:Nehmen} Sie bitte Platz!' },
      { cue: [['n', 'user-round', 'Freundin'], ['x', 'hand-helping', 'mir helfen']], say: '{v:Hilf} mir!', alt: '{v:Hilf} mir bitte!' },
      { cue: [['n', 'user-round', 'Kollege (Sie)'], ['x', 'hourglass', 'kurz warten']], say: '{v:Warten} Sie kurz!', alt: '{v:Warten} Sie bitte einen Moment!' },
      { cue: [['n', 'user-round', 'Bruder'], ['x', 'volume-x', 'leise sein']], say: '{v:Sei} leise!', alt: '{v:Sei} bitte leise!' } ] }
});
