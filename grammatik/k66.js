/* Kapitel 66 – lassen (B1). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 66, level: 'B1', group: 'Verben 3',
  title: 'lassen',
  kicker: 'Ich lasse mein Fahrrad reparieren.',
  intro: '<b>lassen</b> hat mehrere Bedeutungen: Jemand anderes macht etwas für mich (<b>reparieren lassen</b>), etwas erlauben (<b>Lass mich gehen!</b>), etwas nicht mitnehmen (<b>Ich lasse den Schirm hier</b>) – und aufhören (<b>Lass das!</b>).',
  hero: 'Ich {v:lasse} mein Fahrrad {t:reparieren}.',
  art: K => K.svg(K.room(false) + `<rect x="40" y="70" width="190" height="34" rx="6" fill="var(--ink)"/><text x="135" y="94" text-anchor="middle" font-family="Inter,sans-serif" font-size="16" font-weight="800" fill="var(--sun)">FAHRRAD-SERVICE</text>
<g stroke="var(--metal)" stroke-width="5" stroke-linecap="round"><path d="M60 140h130M80 140v30M170 140v30"/></g>` + K.bike(330, 300) +
    K.shadow(140) + K.person({ x: 140, shirt: 'var(--akk)', skin: 1, hair: 'curly', armR: 'chest', face: 'smile' }) +
    K.shadow(440) + K.person({ x: 440, shirt: 'var(--pants)', apron: 'var(--nom)', skin: 4, hair: 'short', hc: 'var(--hair3)', armL: 'front',
      extra: '<path d="M-60 -98l-18 -18M-78 -116l-6 4l8 10l6-4" stroke="var(--metal)" stroke-width="5" stroke-linecap="round" fill="none"/>' }) +
    K.bubble(150, 92, 'Ich *lasse* es *reparieren*.', { tail: 'c' }),
    'In der Fahrradwerkstatt: Ein Mechaniker repariert ein Fahrrad. Der Kunde lässt es reparieren.'),
  lemmas: { lasse: 'lassen', lässt: 'lassen', lass: 'lassen', Lass: 'lassen', ließ: 'lassen', gelassen: 'lassen' },

  understand: [
    { type: 'cards', title: 'Vier Bedeutungen', min: '13rem', items: [
      { t: 'machen lassen', k: 'ac', icon: 'wrench', p: 'Jemand anderes macht es für mich.', ex: 'Ich {v:lasse} mir die Haare {t:schneiden}.' },
      { t: 'erlauben', k: 'ok', icon: 'circle-check', p: 'Ich erlaube es (nicht).', ex: 'Meine Eltern {v:lassen} mich nicht allein {t:reisen}.' },
      { t: 'nicht mitnehmen', k: 'n', icon: 'package', p: 'Etwas bleibt an einem Ort.', ex: 'Ich {v:lasse} den Schirm im Auto.' },
      { t: 'aufhören', k: 'b', icon: 'hand', p: 'Stopp!', ex: '{v:Lass} das! Lass mich in Ruhe!' } ] },
    { type: 'conj', title: 'lassen im Präsens', verbs: { lassen: { f: ['lasse', 'l{e:ä}sst', 'l{e:ä}sst', 'lassen', 'lasst', 'lassen'], n: 'Vokalwechsel a → ä bei du und er/sie/es.' } } },
    { type: 'grid', title: 'Perfekt: zwei Formen', head: ['', 'Beispiel'], rows: [
      ['mit Infinitiv', 'Ich {v:habe} das Auto {t:reparieren lassen}. (Infinitiv, nicht gelassen!)'],
      ['ohne Infinitiv', 'Ich {v:habe} den Schlüssel zu Hause {t:gelassen}.'] ] },
    { type: 'merk', text: '{v:lassen} + {t:Infinitiv}: Jemand anderes macht es. Kein „zu“!' }
  ],

  examples: [
    'Wir {v:lassen} das Auto {t:waschen}.',
    'Ich {v:lasse} mir die Haare kurz {t:schneiden}.',
    '{v:Lass} mich bitte {t:schlafen}!',
    'Er {v:lässt} seinen Hund nie allein.',
    'Ich habe meine Jacke im Restaurant {t:gelassen}.',
    'Sie hat sich ein Kleid {t:nähen lassen}.'
  ],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Welche Bedeutung?', instr: 'Was bedeutet lassen hier?',
      items: [
        'Ich lasse mein Auto reparieren. – ((jemand anderes macht es|erlauben|nicht mitnehmen))', 'Lass mich mitspielen! – ((erlauben|aufhören|jemand anderes macht es))',
        'Ich lasse die Jacke zu Hause. – ((nicht mitnehmen|erlauben|aufhören))', 'Lass das! Das ist gefährlich! – ((aufhören|erlauben|nicht mitnehmen))' ] },
    { id: 'u2', type: 'choice', title: 'Die richtige Form', instr: 'Wähle die richtige Form von lassen.',
      items: [
        'Er ((lässt|lasst|lasse)) sein Fahrrad reparieren.', 'Du ((lässt|lasst|lassen)) mich nie ausreden!', 'Wir ((lassen|lässt|lasst)) uns ein Haus bauen.',
        '((Lass|Lässt|Lasse)) mich bitte in Ruhe!', 'Ich habe das Auto waschen ((lassen|gelassen)).', 'Ich habe meinen Schirm im Bus ((gelassen|lassen)).' ] },
    { id: 'u3', type: 'type', title: 'Jemand anderes macht es', instr: 'Sag den Satz mit lassen.',
      items: [
        { q: 'Der Friseur schneidet mir die Haare.', pre: 'Ich', end: '.', ok: ['lasse mir die Haare schneiden'] },
        { q: 'Der Mechaniker repariert mein Auto.', pre: 'Ich', end: '.', ok: ['lasse mein Auto reparieren'] },
        { q: 'Eine Firma putzt unsere Fenster.', pre: 'Wir', end: '.', ok: ['lassen unsere Fenster putzen'] },
        { q: 'Der Schneider näht ihr ein Kleid.', pre: 'Sie', end: '.', ok: ['lässt sich ein Kleid nähen'] } ] },
    { id: 'u4', type: 'order', title: 'Sätze bauen', instr: 'lassen auf Position 2, Infinitiv ans Ende.',
      items: [
        { tiles: ['Ich', 'lasse', 'mein Fahrrad', 'reparieren'], end: '.', ok: ['Ich lasse mein Fahrrad reparieren'] },
        { tiles: ['Lass', 'mich', 'bitte', 'schlafen'], end: '!', ok: ['Lass mich bitte schlafen'] },
        { tiles: ['Wir', 'haben', 'das Auto', 'waschen lassen'], end: '.', ok: ['Wir haben das Auto waschen lassen'] },
        { tiles: ['Ich', 'habe', 'den Schlüssel', 'zu Hause', 'gelassen'], end: '.', ok: ['Ich habe den Schlüssel zu Hause gelassen'] } ] }
  ],

  speak: { title: 'lassen im Alltag', intro: 'Bilde den Satz mit lassen.', altLabel: 'Perfekt',
    items: [
      { cue: [['x', 'scissors', 'Friseur · Haare schneiden']], say: 'Ich {v:lasse} mir die Haare {t:schneiden}.', alt: 'Ich habe mir die Haare {t:schneiden lassen}.' },
      { cue: [['x', 'wrench', 'Werkstatt · Auto reparieren']], say: 'Ich {v:lasse} das Auto {t:reparieren}.', alt: 'Ich habe das Auto {t:reparieren lassen}.' },
      { cue: [['x', 'umbrella', 'Schirm · im Auto · nicht mitnehmen']], say: 'Ich {v:lasse} den Schirm im Auto.', alt: 'Ich habe den Schirm im Auto {t:gelassen}.' },
      { cue: [['x', 'hand', 'Stopp! (du)']], say: '{v:Lass} das!' },
      { cue: [['x', 'moon', 'erlauben: mich schlafen']], say: '{v:Lass} mich {t:schlafen}!' } ] }
});
