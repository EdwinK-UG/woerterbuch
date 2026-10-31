/* Kapitel 67 – stehen/stellen, liegen/legen, sitzen/setzen, hängen (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 67, level: 'B1', group: 'Verben 3',
  title: 'stehen/stellen, liegen/legen …',
  kicker: 'Wo? und Wohin?',
  intro: 'Diese Verben kommen in Paaren: <b>stehen, liegen, sitzen, hängen</b> sagen, <b>wo</b> etwas ist (Position, Dativ). <b>stellen, legen, setzen, hängen</b> sagen, <b>wohin</b> jemand etwas bringt (Handlung, Akkusativ).',
  hero: 'Ich {v:stelle} die Vase {a:auf den Tisch}. Jetzt {v:steht} sie {d:auf dem Tisch}.',
  art: K => K.svg(K.room() + K.table(230, 230, 220) +
    `<path d="M210 230q-10 -30 4 -60h32q14 30 4 60z" fill="var(--akk)"/><g fill="var(--die)"><circle cx="218" cy="160" r="9"/><circle cx="240" cy="152" r="9"/><circle cx="228" cy="140" r="9"/></g><path d="M222 168v-14M236 166v-14" stroke="var(--hill1)" stroke-width="3"/>
<g transform="translate(296 222) rotate(-4)"><rect x="-30" y="-8" width="60" height="10" rx="2" fill="var(--dat)"/><rect x="-30" y="-14" width="60" height="7" rx="2" fill="var(--nom)"/></g>
<rect x="70" y="80" width="80" height="60" rx="4" fill="var(--card)" stroke="var(--wood)" stroke-width="5"/><path d="M78 132l20 -24l16 14l10 -10l18 20z" fill="var(--hill1)"/><path d="M110 80l0 -14" stroke="var(--ink)" stroke-width="2"/>` +
    K.cat(150, 230, { s: .65 }) +
    K.tag(232, 112, 'steht', 'akk') + K.tag(330, 192, 'liegt', 'dat') + K.tag(110, 162, 'hängt', 'nom') + K.tag(110, 214, 'sitzt', 'die'),
    'Ein Tisch: Eine Vase steht darauf, Bücher liegen darauf, eine Katze sitzt darauf, ein Bild hängt an der Wand.'),
  lemmas: { stelle: 'stellen', steht: 'stehen', legt: 'legen', liegt: 'liegen', setzt: 'setzen', sitzt: 'sitzen', hängt: 'hängen' },

  understand: [
    { type: 'grid', title: 'Position und Handlung', head: ['Wo? (Position + Dativ)', 'Wohin? (Handlung + Akkusativ)'], label: false, rows: [
      ['Die Vase {v:steht} {d:auf dem Tisch}.', 'Ich {v:stelle} die Vase {a:auf den Tisch}.'],
      ['Das Buch {v:liegt} {d:auf dem Tisch}.', 'Ich {v:lege} das Buch {a:auf den Tisch}.'],
      ['Die Katze {v:sitzt} {d:auf dem Sofa}.', 'Ich {v:setze} die Katze {a:auf das Sofa}.'],
      ['Das Bild {v:hängt} {d:an der Wand}.', 'Ich {v:hänge} das Bild {a:an die Wand}.'] ] },
    { type: 'grid', title: 'Die Formen im Perfekt', head: ['Position (unregelmäßig)', 'Handlung (regelmäßig)'], label: false, rows: [
      ['stehen – hat gestanden', 'stellen – hat gestellt'], ['liegen – hat gelegen', 'legen – hat gelegt'], ['sitzen – hat gesessen', 'setzen – hat gesetzt'], ['hängen – hat gehangen', 'hängen – hat gehängt'] ] },
    { type: 'note', title: 'stehen oder liegen?', text: 'Was hoch und senkrecht ist, {e:steht} (Flasche, Vase, Schrank). Was flach ist, {e:liegt} (Buch, Handy, Teppich). Ein Mensch {e:sitzt} auf dem Stuhl – sich {e:setzen} ist die Handlung.' },
    { type: 'merk', text: 'Position: {v:stehen, liegen, sitzen, hängen} + {d:Dativ} · Handlung: {v:stellen, legen, setzen, hängen} + {a:Akkusativ}' }
  ],

  examples: [
    'Der Schlüssel {v:liegt} {d:auf dem Schreibtisch}.',
    '{v:Leg} das Handy bitte {a:auf den Tisch}!',
    'Die Gäste {v:sitzen} schon {d:am Tisch}.',
    'Setz dich {a:neben mich}!',
    'Wohin hast du die Milch {t:gestellt}? – {a:In den Kühlschrank}.',
    'Das Bild {v:hat} lange {d:im Flur} {t:gehangen}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Position oder Handlung?', instr: 'Wähle das passende Verb.',
      items: [
        'Das Buch ((liegt|legt)) auf dem Tisch.', 'Ich ((lege|liege)) das Buch auf den Tisch.', 'Die Flasche ((steht|stellt)) im Kühlschrank.',
        '((Stell|Steh)) die Flasche in den Kühlschrank!', 'Das Kind ((sitzt|setzt)) auf dem Stuhl.', 'Die Mutter ((setzt|sitzt)) das Kind auf den Stuhl.' ] },
    { id: 'u2', type: 'choice', title: 'Dativ oder Akkusativ?', instr: 'Wähle den richtigen Artikel.',
      items: [
        'Ich stelle den Stuhl an ((den|dem)) Tisch.', 'Der Stuhl steht an ((dem|den)) Tisch.', 'Er hängt die Jacke an ((die|der)) Tür.',
        'Die Jacke hängt an ((der|die)) Tür.', 'Sie legt das Kind in ((das|dem)) Bett.', 'Das Kind liegt in ((dem|das)) Bett.' ] },
    { id: 'u3', type: 'fill', title: 'Perfekt', instr: 'Schreib das Partizip II.',
      items: [
        '(legen) Ich habe das Geld in die Schublade [[gelegt]].', '(liegen) Das Geld hat in der Schublade [[gelegen]].', '(stellen) Wer hat die Blumen auf den Tisch [[gestellt]]?',
        '(stehen) Wir haben eine Stunde im Regen [[gestanden]].', '(setzen) Sie hat sich neben mich [[gesetzt]].', '(sitzen) Wir haben lange im Café [[gesessen]].' ] },
    { id: 'u4', type: 'type', title: 'Wohin? → Wo?', instr: 'Beschreib das Ergebnis.',
      items: [
        { q: 'Ich lege das Handy auf den Tisch. → Das Handy …', pre: 'Das Handy', end: '.', ok: ['liegt auf dem Tisch'] },
        { q: 'Ich stelle die Tasse in den Schrank. → Die Tasse …', pre: 'Die Tasse', end: '.', ok: ['steht im Schrank', 'steht in dem Schrank'] },
        { q: 'Ich hänge den Mantel an die Tür. → Der Mantel …', pre: 'Der Mantel', end: '.', ok: ['hängt an der Tür'] },
        { q: 'Ich setze das Baby auf das Sofa. → Das Baby …', pre: 'Das Baby', end: '.', ok: ['sitzt auf dem Sofa'] } ] }
  ],

  speak: { title: 'Räum auf!', intro: 'Sag, wohin du es bringst – und wo es dann ist.', altLabel: 'Wo?',
    items: [
      { cue: [['x', 'flower-2', 'die Vase · auf den Tisch']], say: 'Ich {v:stelle} die Vase {a:auf den Tisch}.', alt: 'Die Vase {v:steht} {d:auf dem Tisch}.' },
      { cue: [['x', 'book-open', 'das Buch · ins Regal']], say: 'Ich {v:stelle} das Buch {a:ins Regal}.', alt: 'Das Buch {v:steht} {d:im Regal}.' },
      { cue: [['x', 'smartphone', 'das Handy · auf das Sofa']], say: 'Ich {v:lege} das Handy {a:aufs Sofa}.', alt: 'Das Handy {v:liegt} {d:auf dem Sofa}.' },
      { cue: [['x', 'shirt', 'die Jacke · an die Garderobe']], say: 'Ich {v:hänge} die Jacke {a:an die Garderobe}.', alt: 'Die Jacke {v:hängt} {d:an der Garderobe}.' },
      { cue: [['x', 'armchair', 'sich · auf den Stuhl']], say: 'Ich {v:setze} mich {a:auf den Stuhl}.', alt: 'Ich {v:sitze} {d:auf dem Stuhl}.' } ] }
});
