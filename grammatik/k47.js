/* Kapitel 47 – Zusammengesetzte Nomen (A1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 47, level: 'A1', group: 'Wörter und Wortbildung',
  title: 'Zusammengesetzte Nomen',
  kicker: 'der Regen + der Schirm = der Regenschirm',
  intro: 'Im Deutschen kann man Nomen zusammensetzen. Das <b>letzte Wort</b> ist das Grundwort: Es sagt, <b>was</b> es ist, und gibt den <b>Artikel</b>. Das erste Wort sagt, <b>welche Art</b>.',
  hero: 'die Sonne + {e:der} Schirm = {e:der} Sonnenschirm',
  art: K => {
    const umb = (x, c) => `<path d="M${x} 210V292" stroke="var(--ink)" stroke-width="4"/><path d="M${x} 292q0 12 -12 10" stroke="var(--ink)" stroke-width="4" fill="none"/><path d="M${x - 62} 214Q${x} 140 ${x + 62} 214Q${x + 42} 202 ${x + 20} 214Q${x} 202 ${x - 20} 214Q${x - 42} 202 ${x - 62} 214Z" fill="${c}"/>`;
    return K.svg(`<rect width="520" height="360" fill="var(--sky1)"/>` +
      `<g fill="var(--cloud)"><ellipse cx="130" cy="74" rx="60" ry="22"/><ellipse cx="160" cy="60" rx="34" ry="22"/></g><g stroke="var(--der)" stroke-width="3" stroke-linecap="round">${[100, 124, 148, 172].map(x => `<path d="M${x} 104l-5 14"/>`).join('')}</g>` +
      `<circle cx="390" cy="76" r="30" fill="var(--sun)"/>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M${390 + Math.cos(a) * 40} ${76 + Math.sin(a) * 40}L${390 + Math.cos(a) * 52} ${76 + Math.sin(a) * 52}" stroke="var(--sun)" stroke-width="4" stroke-linecap="round"/>`; }).join('')}` +
      umb(140, 'var(--der)') + umb(390, 'var(--die)') + `<rect y="300" width="520" height="60" fill="var(--floor)"/>` +
      K.tag(140, 330, 'der Regenschirm', 'der') + K.tag(390, 330, 'der Sonnenschirm', 'die'),
      'Zwei Schirme: ein Regenschirm unter einer Regenwolke und ein Sonnenschirm unter der Sonne.');
  },
  lemmas: { Sonnenschirm: 'Sonnenschirm', Regenschirm: 'Regenschirm' },

  understand: [
    { type: 'grid', title: 'Das letzte Wort bestimmt', head: ['Bestimmungswort', 'Grundwort', 'Kompositum'], rows: [
      ['der Regen', '{e:der} Schirm', '{e:der} Regenschirm'], ['die Sonne', '{e:die} Brille', '{e:die} Sonnenbrille'], ['das Kind', '{e:der} Arzt', '{e:der} Kinderarzt'],
      ['der Arzt', '{e:das} Kind', '{e:das} Arztkind'], ['das Haus', '{e:die} Tür', '{e:die} Haustür'], ['schlafen', '{e:das} Zimmer', '{e:das} Schlafzimmer'] ], label: false,
      foot: 'Kinderarzt ist ein Arzt für Kinder. Arztkind ist ein Kind von einem Arzt. Die Reihenfolge ändert die Bedeutung!' },
    { type: 'cards', title: 'Was kann vorne stehen?', min: '12rem', items: [
      { t: 'Nomen', k: 'ac', ex: 'die Tomate + die Suppe = die Tomatensuppe' },
      { t: 'Verb (Stamm)', k: 'n', ex: 'schreiben + der Tisch = der Schreibtisch' },
      { t: 'Adjektiv', k: 'd', ex: 'groß + die Stadt = die Großstadt' } ] },
    { type: 'note', title: 'Ein Buchstabe dazwischen', text: 'Oft kommt ein -s-, -n- oder -en- dazwischen: der Geburt{e:s}tag, die Sonne{e:n}brille, die Tomate{e:n}suppe. Das lernst du am besten mit dem Wort.' },
    { type: 'merk', text: 'Der Artikel kommt vom {e:letzten} Wort: das Haus + {e:die} Tür = {e:die} Haustür.' }
  ],

  examples: [
    'Ich brauche einen {e:Regenschirm}.',
    'Die {e:Haustür} ist offen.',
    'Mein {e:Schreibtisch} ist sehr klein.',
    'Am Sonntag feiern wir meinen {e:Geburtstag}.',
    'Wir wohnen in einer {e:Großstadt}.',
    'Wo ist meine {e:Sonnenbrille}?'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welcher Artikel?', instr: 'Der Artikel kommt vom letzten Wort.',
      items: [
        '((der|die|das)) Kinderarzt', '((die|der|das)) Haustür', '((das|der|die)) Schlafzimmer', '((die|der|das)) Sonnenbrille',
        '((der|die|das)) Kühlschrank', '((das|der|die)) Fußballspiel', '((die|der|das)) Tomatensuppe', '((der|die|das)) Geburtstag' ] },
    { id: 'u2', type: 'fill', title: 'Bilde das Wort', instr: 'Schreib das zusammengesetzte Nomen (mit großem Anfangsbuchstaben).',
      items: [
        'das Haus + der Schlüssel = der [[Hausschlüssel]]', 'der Apfel + der Saft = der [[Apfelsaft]]', 'schreiben + der Tisch = der [[Schreibtisch]]',
        'die Hand + der Schuh = der [[Handschuh]]', 'der Bus + die Haltestelle = die [[Bushaltestelle]]', 'die Kinder + das Zimmer = das [[Kinderzimmer]]' ] },
    { id: 'u3', type: 'choice', title: 'Was ist das?', instr: 'Was bedeutet das Wort?',
      items: [
        'ein Kinderarzt ist ((ein Arzt für Kinder|ein Kind von einem Arzt))', 'ein Arztkind ist ((ein Kind von einem Arzt|ein Arzt für Kinder))',
        'eine Wasserflasche ist ((eine Flasche für Wasser|Wasser in einer Flasche))', 'ein Sonnenschirm ist ((ein Schirm gegen die Sonne|eine Sonne mit Schirm))',
        'ein Schlafzimmer ist ((ein Zimmer zum Schlafen|ein Schlaf im Zimmer))', 'ein Briefkasten ist ((ein Kasten für Briefe|ein Brief in einem Kasten))' ] },
    { id: 'u4', type: 'fill', title: 'Im Satz', instr: 'Bilde das Wort aus den Teilen in Klammern.',
      items: [
        '(Geburt + Tag) Heute ist mein [[Geburtstag]]!', '(Tomate + Suppe) Ich koche eine [[Tomatensuppe]].', '(Fuß + Ball) Spielst du gern [[Fußball]]?',
        '(Kühl + Schrank) Die Milch ist im [[Kühlschrank]].', '(Zahn + Bürste) Ich brauche eine neue [[Zahnbürste]].', '(Groß + Stadt) Berlin ist eine [[Großstadt]].' ] }
  ],

  speak: { title: 'Wort-Baukasten', intro: 'Bilde das Wort und sag es mit Artikel.', altLabel: 'Im Satz',
    items: [
      { cue: [['x', 'cloud-rain', 'der Regen'], ['x', 'umbrella', 'der Schirm']], say: '{e:der} Regenschirm', alt: 'Ich nehme den Regenschirm mit.' },
      { cue: [['x', 'house', 'das Haus'], ['x', 'door-closed', 'die Tür']], say: '{e:die} Haustür', alt: 'Die Haustür ist zu.' },
      { cue: [['x', 'apple', 'der Apfel'], ['x', 'glass-water', 'der Saft']], say: '{e:der} Apfelsaft', alt: 'Ich trinke gern Apfelsaft.' },
      { cue: [['x', 'bed', 'schlafen'], ['x', 'door-open', 'das Zimmer']], say: '{e:das} Schlafzimmer', alt: 'Das Schlafzimmer ist groß.' },
      { cue: [['x', 'sun', 'die Sonne'], ['x', 'glasses', 'die Brille']], say: '{e:die} Sonnenbrille', alt: 'Wo ist meine Sonnenbrille?' } ] }
});
