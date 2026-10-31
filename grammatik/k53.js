/* Kapitel 53 – Ortsadverbien (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 53, level: 'B1', group: 'Wörter und Wortbildung',
  title: 'Ortsadverbien',
  kicker: 'oben, unten, nach oben',
  intro: 'Ortsadverbien sagen kurz, wo etwas ist: <b>oben, unten, vorn, hinten, links, rechts, drinnen, draußen</b>. Für eine Richtung (wohin?) sagt man <b>nach oben, nach unten, nach links …</b> oder <b>rein, raus</b>.',
  hero: 'Lea ist {e:oben}, Tom ist {e:unten}. – Tom, komm {e:nach oben}!',
  art: K => K.svg(`<rect width="520" height="360" fill="var(--sky1)"/><rect x="90" y="40" width="340" height="296" fill="var(--wall)" stroke="var(--wood)" stroke-width="6"/><rect x="90" y="182" width="340" height="10" fill="var(--wood)"/>
<path d="M300 326h40v-22h40v-22h40v-22h10" fill="none" stroke="var(--wood)" stroke-width="6"/><path d="M76 46L260 -10L444 46Z" fill="var(--die)"/>` +
    K.person({ x: 190, y: 182, s: .62, shirt: 'var(--akk)', skin: 4, hair: 'long', hc: 'var(--hair4)', armR: 'wave', face: 'open' }) +
    K.person({ x: 210, y: 330, s: .62, shirt: 'var(--nom)', skin: 1, hair: 'short', armL: 'up', face: 'open' }) +
    K.tag(340, 120, 'oben', 'akk') + K.tag(120, 260, 'unten', 'nom') + K.arrow('M250 300Q300 260 330 214', 'var(--ac)') + K.tag(372, 240, 'nach oben', 'der'),
    'Ein Haus mit zwei Stockwerken: Lea ist oben, Tom ist unten. Ein Pfeil zeigt nach oben.'),
  lemmas: { oben: 'oben', unten: 'unten', draußen: 'draußen', drinnen: 'drinnen', rein: 'rein', raus: 'raus' },

  understand: [
    { type: 'grid', title: 'Wo? und Wohin?', head: ['Wo? (Position)', 'Wohin? (Richtung)'], label: false, rows: [
      ['oben', 'nach oben'], ['unten', 'nach unten'], ['vorn(e)', 'nach vorn(e)'], ['hinten', 'nach hinten'], ['links', 'nach links'], ['rechts', 'nach rechts'],
      ['drinnen', 'rein (hinein / herein)'], ['draußen', 'raus (hinaus / heraus)'], ['hier · da · dort', 'hierher · dahin · dorthin'] ] },
    { type: 'cards', title: 'hin oder her?', min: '13rem', items: [
      { t: 'her', k: 'ok', p: 'zum Sprecher hin', ex: 'Komm {e:her}! Komm {e:herein}!' },
      { t: 'hin', k: 'b', p: 'vom Sprecher weg', ex: 'Geh {e:hin}! Geh {e:hinaus}!' } ],
      foot: 'Gesprochen sagt man meistens kurz: rein, raus, rauf, runter.' },
    { type: 'merk', text: 'Wo? {e:oben} · Wohin? {e:nach oben}' }
  ],

  examples: [
    'Das Bad ist {e:oben}, die Küche ist {e:unten}.',
    'Bei Regen spielen die Kinder {e:drinnen}.',
    'Gehen Sie bitte {e:nach links}.',
    'Wir sitzen {e:hinten} im Bus.',
    'Komm {e:rein}, es ist kalt {e:draußen}!',
    'Fahren Sie {e:nach rechts} und dann geradeaus.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Wo oder wohin?', instr: 'Wähle die passende Form.',
      items: [
        'Mein Zimmer ist ((oben|nach oben)).', 'Ich gehe jetzt ((nach oben|oben)).', 'Die Kinder spielen ((draußen|raus)).',
        'Komm ((rein|drinnen)), die Tür ist offen!', 'Biegen Sie hier ((nach links|links)) ab.', 'Der Ausgang ist ((hinten|nach hinten)).' ] },
    { id: 'u2', type: 'choice', title: 'Gegenteile', instr: 'Wähle das Gegenteil.',
      items: [ 'oben ↔ ((unten|hinten|links))', 'vorn ↔ ((hinten|unten|rechts))', 'links ↔ ((rechts|oben|draußen))', 'drinnen ↔ ((draußen|unten|hinten))', 'rein ↔ ((raus|runter|her))' ] },
    { id: 'u3', type: 'fill', title: 'Ergänze', instr: 'Schreib das passende Adverb.',
      items: [
        'Das Wetter ist schön, wir essen [[draußen]].', 'Der Aufzug fährt [[nach oben]] – in den 5. Stock.', 'Geh bitte [[raus]], ich muss mich umziehen.',
        'Im Kino sitze ich gern [[hinten]].', 'Der Keller ist [[unten]].', 'Komm [[her]]! Ich zeige dir etwas.' ] },
    { id: 'u4', type: 'type', title: 'Wohin?', instr: 'Antworte mit einer Richtung.',
      items: [
        { q: 'Ich bin unten. Ich will in den 2. Stock.', pre: 'Ich gehe', end: '.', ok: ['nach oben', 'rauf', 'hinauf'] },
        { q: 'Ich bin draußen. Ich will ins Haus.', pre: 'Ich gehe', end: '.', ok: ['rein', 'hinein'] },
        { q: 'Ich bin im Haus. Ich will in den Garten.', pre: 'Ich gehe', end: '.', ok: ['raus', 'hinaus', 'nach draußen'] },
        { q: 'Ich bin oben. Ich will in den Keller.', pre: 'Ich gehe', end: '.', ok: ['nach unten', 'runter', 'hinunter'] } ] }
  ],

  speak: { title: 'Wo ist was?', intro: 'Beschreib dein Haus oder deine Wohnung.', altLabel: 'Wohin?',
    items: [
      { cue: [['x', 'bed', 'Schlafzimmer · oben']], say: 'Das Schlafzimmer ist {e:oben}.', alt: 'Ich gehe {e:nach oben}.' },
      { cue: [['x', 'chef-hat', 'Küche · unten']], say: 'Die Küche ist {e:unten}.', alt: 'Ich gehe {e:nach unten}.' },
      { cue: [['x', 'trees', 'Garten · draußen']], say: 'Die Kinder sind {e:draußen}.', alt: 'Ich gehe {e:raus}.' },
      { cue: [['x', 'arrow-left', 'Weg · links']], say: 'Gehen Sie {e:nach links}.' },
      { cue: [['x', 'door-open', 'Gast · rein']], say: 'Komm {e:rein}!' } ] }
});
