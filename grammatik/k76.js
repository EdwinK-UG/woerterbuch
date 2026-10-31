/* Kapitel 76 – Relativsätze mit Präposition (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 76, level: 'B1', group: 'Sätze verbinden 2',
  title: 'Relativsätze mit Präposition',
  kicker: 'der Stift, mit dem ich schreibe',
  intro: 'Hat das Verb eine Präposition (schreiben mit, sprechen über, warten auf …), steht die <b>Präposition vor dem Relativpronomen</b>. Die Präposition bestimmt den Fall. Für Orte kannst du auch <b>wo</b> sagen.',
  hero: 'Das ist der Stift, {e:mit dem} ich alle meine Briefe {v:schreibe}.',
  art: K => K.svg(`<rect width="520" height="360" fill="var(--wall)"/><rect x="40" y="220" width="440" height="140" fill="var(--wood)"/>
<g transform="translate(240 200) rotate(-6)"><rect x="-120" y="-80" width="240" height="160" rx="6" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>${[-50, -26, -2, 22, 46].map(y => `<path d="M-96 ${y}q60 -6 120 0t72 0" stroke="var(--der)" stroke-width="2.5" fill="none" opacity=".6"/>`).join('')}</g>
<g transform="translate(380 150) rotate(40)"><rect x="-8" y="-90" width="16" height="140" rx="6" fill="var(--nom)"/><path d="M-8 50L0 74L8 50Z" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5"/><path d="M-2 66l2 8l2 -8z" fill="var(--ink)"/><rect x="-9" y="-100" width="18" height="16" rx="4" fill="var(--ink)"/></g>` +
    K.tag(260, 60, 'der Stift, mit dem ich schreibe', 'nom'),
    'Ein Briefbogen und ein gelber Stift: der Stift, mit dem ich schreibe.'),
  lemmas: { dem: 'der', denen: 'der', wo: 'wo', worauf: 'worauf' },

  understand: [
    { type: 'grid', title: 'Präposition + Relativpronomen', head: ['Verb', 'Relativsatz'], rows: [
      ['schreiben mit + D', 'der Stift, {e:mit dem} ich {v:schreibe}'], ['warten auf + A', 'der Bus, {e:auf den} ich {v:warte}'],
      ['sprechen über + A', 'das Thema, {e:über das} wir {v:sprechen}'], ['sich freuen über + A', 'die Blumen, {e:über die} sie sich {v:freut}'],
      ['wohnen bei + D', 'die Familie, {e:bei der} ich {v:wohne}'], ['spielen mit + D', 'die Kinder, {e:mit denen} er {v:spielt}'] ] },
    { type: 'cards', title: 'Orte: in dem oder wo', min: '14rem', items: [
      { t: 'in dem / in der', k: 'd', ex: 'die Stadt, {e:in der} ich {v:wohne}' },
      { t: 'wo', k: 'ac', ex: 'die Stadt, {e:wo} ich {v:wohne}' } ],
      foot: 'Bei Städten und Ländern ohne Artikel nur <b>wo</b>: Kampala, wo ich geboren bin.' },
    { type: 'merk', text: 'Präposition zuerst: der Bus, {e:auf den} ich {v:warte}. Nicht: der Bus, den ich auf warte.' }
  ],

  examples: [
    'Das ist das Haus, {e:in dem} ich aufgewachsen {v:bin}.',
    'Wie heißt der Kollege, {e:mit dem} du {v:sprichst}?',
    'Das Thema, {e:über das} wir {v:diskutieren}, ist wichtig.',
    'Das ist der Freund, {e:auf den} ich {v:warte}.',
    'Die Firma, {e:für die} sie {v:arbeitet}, ist sehr groß.',
    'Gulu ist die Stadt, {e:wo} ich geboren {v:bin}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welche Form?', instr: 'Wähle Präposition + Relativpronomen.',
      items: [
        'Das ist der Stift, ((mit dem|mit den|den)) ich schreibe.', 'Das ist der Bus, ((auf den|auf dem|den)) wir warten.', 'Das ist die Frau, ((mit der|mit die|der)) ich spreche.',
        'Das sind die Kinder, ((mit denen|mit den|mit die)) ich spiele.', 'Das ist das Thema, ((über das|über dem|das)) wir reden.', 'Das ist die Firma, ((für die|für der|die)) ich arbeite.' ] },
    { id: 'u2', type: 'fill', title: 'Ergänze', instr: 'Schreib das Relativpronomen.',
      items: [
        'Das ist die Wohnung, in [[der]] ich wohne.', 'Das ist der Freund, mit [[dem]] ich Fußball spiele.', 'Das sind die Leute, bei [[denen]] ich wohne.',
        'Das ist das Geschenk, über [[das]] ich mich freue.', 'Das ist der Kurs, an [[dem]] ich teilnehme.', 'Das ist die Prüfung, vor [[der]] ich Angst habe.' ] },
    { id: 'u3', type: 'type', title: 'Verbinde', instr: 'Verbinde mit Präposition + Relativpronomen.',
      items: [
        { q: 'Das ist der Bus. Ich warte auf den Bus.', pre: 'Das ist der Bus,', end: '.', ok: ['auf den ich warte'] },
        { q: 'Das ist die Kollegin. Ich arbeite mit ihr.', pre: 'Das ist die Kollegin,', end: '.', ok: ['mit der ich arbeite'] },
        { q: 'Das ist das Hotel. Wir wohnen in dem Hotel.', pre: 'Das ist das Hotel,', end: '.', ok: ['in dem wir wohnen', 'wo wir wohnen'] },
        { q: 'Das sind die Freunde. Ich fahre mit ihnen.', pre: 'Das sind die Freunde,', end: '.', ok: ['mit denen ich fahre'] } ] }
  ],

  speak: { title: 'Beschreib es genauer', intro: 'Bilde einen Relativsatz mit Präposition.', altLabel: 'Weiter',
    items: [
      { cue: [['x', 'pen', 'der Stift'], ['x', 'pencil', 'schreiben mit']], say: 'Das ist der Stift, {e:mit dem} ich {v:schreibe}.' },
      { cue: [['x', 'bus', 'der Bus'], ['x', 'clock', 'warten auf']], say: 'Das ist der Bus, {e:auf den} ich {v:warte}.' },
      { cue: [['x', 'building-2', 'die Stadt'], ['x', 'house', 'wohnen in']], say: 'Das ist die Stadt, {e:in der} ich {v:wohne}.', alt: 'Das ist die Stadt, {e:wo} ich {v:wohne}.' },
      { cue: [['x', 'users', 'die Kollegen'], ['x', 'briefcase', 'arbeiten mit']], say: 'Das sind die Kollegen, {e:mit denen} ich {v:arbeite}.' } ] }
});
