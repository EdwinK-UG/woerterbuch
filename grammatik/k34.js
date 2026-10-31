/* Kapitel 34 – Präpositionen mit Akkusativ (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 34, level: 'A1', group: 'Präpositionen 1',
  title: 'Präpositionen mit Akkusativ',
  kicker: 'für, um, durch, ohne, gegen',
  intro: 'Nach <b>für, um, durch, ohne, gegen</b> (und <b>bis</b>) steht <b>immer der Akkusativ</b>. Nur maskuline Artikel ändern sich: für <b>den</b> Mann, ohne <b>einen</b> Schirm.',
  hero: 'Jeden Morgen laufe ich {a:um den See} – {a:ohne meinen Hund}.',
  art: K => K.svg(K.sky() + `<ellipse cx="270" cy="282" rx="210" ry="56" fill="var(--wood)" opacity=".35"/><ellipse cx="270" cy="282" rx="170" ry="38" style="fill:color-mix(in srgb,var(--der) 55%,var(--sky2))"/>
<g fill="none" stroke="var(--card)" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M190 280q12-8 24 0t24 0"/><path d="M300 290q12-8 24 0t24 0"/></g>` +
    K.arrow('M110 250Q60 300 150 330', 'var(--akk)') + K.arrow('M430 330Q500 300 440 250', 'var(--akk)') +
    K.shadow(420, 30, 334) + K.person({ x: 420, y: 334, s: .8, shirt: 'var(--akk)', skin: 1, hair: 'short', armL: 'front', armR: 'hip', face: 'open' }) +
    K.dog(110, 216, { s: .6, c: 'var(--nom)' }) + K.bubble(110, 150, 'Und ich?', { tail: 'c' }) +
    K.bubble(380, 140, 'Ich laufe *um* den See!', { tail: 'r' }),
    'Ein Mann joggt um einen See. Sein Hund wartet am Ufer: Und ich?'),
  lemmas: { für: 'für', um: 'um', durch: 'durch', ohne: 'ohne', gegen: 'gegen', laufe: 'laufen' },

  understand: [
    { type: 'cards', title: 'Die Akkusativ-Präpositionen', min: '13rem', items: [
      { t: 'für', k: 'a', s: 'für eine Person · Zweck · Dauer', ex: 'Das ist {a:für dich}. Ich spare {a:für ein Auto}. Wir fahren {a:für eine Woche} weg.' },
      { t: 'um', k: 'a', s: 'rund herum · Uhrzeit', ex: 'Wir sitzen {a:um den Tisch}. Der Kurs beginnt um 9 Uhr.' },
      { t: 'durch', k: 'a', s: 'von einer Seite zur anderen', ex: 'Wir gehen {a:durch den Park}.' },
      { t: 'ohne', k: 'a', s: 'nicht mit', ex: 'Ich trinke Kaffee {a:ohne Zucker}. Komm nicht {a:ohne deinen Pass}!' },
      { t: 'gegen', k: 'a', s: 'Kontakt · Gegner · ungefähre Uhrzeit', ex: 'Das Auto fährt {a:gegen den Baum}. Wir spielen {a:gegen euch}. Ich komme gegen acht.' },
      { t: 'bis', k: 'a', s: 'Ende einer Zeit oder Strecke', ex: 'Ich bleibe bis Montag. Der Zug fährt bis Hamburg.' } ] },
    { type: 'grid', title: 'Die Artikel nach diesen Präpositionen', head: ['', 'maskulin', 'neutral', 'feminin', 'Plural'], rows: [
      ['Nominativ', 'der Park', 'das Haus', 'die Stadt', 'die Kinder'],
      ['durch + der', 'durch {a:den} Park', 'durch das Haus', 'durch die Stadt', 'für die Kinder'],
      ['ohne + ein', 'ohne {a:einen} Hund', 'ohne ein Kind', 'ohne eine Jacke', 'ohne Kinder'] ],
      foot: 'Nur maskulin ändert sich: der → den, ein → einen.' },
    { type: 'merk', text: '{a:für, um, durch, ohne, gegen} – immer Akkusativ! (Merkwort: FUDOG)' },
    { type: 'note', title: 'durchs, fürs, ums', text: 'Gesprochen oft kurz: durch das → durchs, für das → fürs, um das → ums. Wir gehen {a:durchs} Zentrum.' }
  ],

  examples: [
    'Das Geschenk ist {a:für meinen Vater}.',
    'Wir fahren {a:durch den Tunnel}.',
    'Ich gehe nie {a:ohne meinen Regenschirm} aus dem Haus.',
    'Unser Team spielt heute {a:gegen Bayern}.',
    'Die Kinder laufen {a:um das Haus}.',
    'Danke {a:für die Einladung}!',
    'Ich bin {a:gegen diese Idee}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welche Präposition?', instr: 'Wähle die passende Präposition.',
      items: [
        'Ich trinke Tee ((ohne|für|um)) Zucker.', 'Das Geschenk ist ((für|gegen|durch)) dich.', 'Wir spazieren ((durch|um|gegen)) den Wald.',
        'Die Erde dreht sich ((um|durch|für)) die Sonne.', 'Ghana spielt ((gegen|für|ohne)) Kamerun.', 'Danke ((für|um|durch)) deine Hilfe!' ] },
    { id: 'u2', type: 'choice', title: 'Der richtige Artikel', instr: 'Wähle die Form im Akkusativ.',
      items: [
        'Wir gehen durch ((den|dem|der)) Park.', 'Das ist für ((meinen|meinem|mein)) Bruder.', 'Ich fahre nie ohne ((meine|meiner|meinen)) Brille.',
        'Er läuft gegen ((die|der|den)) Tür.', 'Wir sitzen um ((den|dem)) Tisch.', 'Das ist ein Geschenk für ((einen|einem|ein)) Freund.' ] },
    { id: 'u3', type: 'fill', title: 'Ergänze', instr: 'Schreib den Artikel oder das Pronomen im Akkusativ.',
      items: [
        '(du) Das ist für [[dich]].', '(der Tunnel) Wir fahren durch [[den]] Tunnel.', '(er) Ohne [[ihn]] gehe ich nicht.',
        '(mein Sohn) Ich kaufe ein Fahrrad für [[meinen]] Sohn.', '(wir) Spielt ihr gegen [[uns]]?', '(ein Schirm) Er geht ohne [[einen]] Schirm raus.' ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'Tippe die Teile in der richtigen Reihenfolge an.',
      items: [
        { tiles: ['Wir', 'gehen', 'durch den Park'], end: '.', ok: ['Wir gehen durch den Park'] },
        { tiles: ['Das Geschenk', 'ist', 'für meine Mutter'], end: '.', ok: ['Das Geschenk ist für meine Mutter'] },
        { tiles: ['Ich', 'trinke', 'Kaffee', 'ohne Milch'], end: '.', ok: ['Ich trinke Kaffee ohne Milch'] },
        { tiles: ['Heute', 'spielen', 'wir', 'gegen Köln'], end: '.', ok: ['Heute spielen wir gegen Köln'] },
        { tiles: ['Danke', 'für', 'die Blumen'], end: '!', ok: ['Danke für die Blumen'] } ] }
  ],

  speak: { title: 'Sag es mit Akkusativ', intro: 'Bilde den Satz mit der Präposition.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'gift', 'Geschenk'], ['a', 'user-round', 'für · mein Vater']], say: 'Das Geschenk ist {a:für meinen Vater}.' },
      { cue: [['n', 'users', 'wir'], ['a', 'trees', 'durch · der Park · gehen']], say: 'Wir gehen {a:durch den Park}.' },
      { cue: [['n', 'user-round', 'ich'], ['a', 'coffee', 'Kaffee · ohne · Zucker']], say: 'Ich trinke Kaffee {a:ohne Zucker}.' },
      { cue: [['n', 'users', 'wir'], ['a', 'trophy', 'gegen · ihr · spielen']], say: 'Wir spielen {a:gegen euch}.' },
      { cue: [['n', 'user-round', 'ich'], ['a', 'waves', 'um · der See · laufen']], say: 'Ich laufe {a:um den See}.' },
      { cue: [['x', 'heart', 'Danke'], ['a', 'hand-helping', 'für · deine Hilfe']], say: 'Danke {a:für deine Hilfe}!' } ] }
});
