/* Nachschlagen – Verben mit Dativ. Liste und Trainer (jede Runde neue Sätze). */
(function () {
// [Verb, Beispiel, Übungssatz (erste Option richtig)]
const L = [
  ['helfen', 'Ich helfe {d:dir}.', 'Ich helfe ((dir|dich)) gern.'], ['danken', 'Wir danken {d:Ihnen}.', 'Ich danke ((dir|dich)) für alles.'],
  ['gefallen', 'Die Stadt gefällt {d:mir}.', 'Der Film gefällt ((mir|mich)).'], ['gehören', 'Das Buch gehört {d:ihm}.', 'Die Tasche gehört ((meiner|meine)) Schwester.'],
  ['schmecken', 'Schmeckt {d:dir} die Suppe?', 'Schmeckt ((dir|dich)) der Kuchen?'], ['passen', 'Die Hose passt {d:mir} nicht.', 'Die Schuhe passen ((ihm|ihn)) nicht.'],
  ['stehen', 'Die Farbe steht {d:dir} gut.', 'Das Kleid steht ((ihr|sie)) gut.'], ['gratulieren', 'Wir gratulieren {d:dir}!', 'Ich gratuliere ((dir|dich)) zum Geburtstag.'],
  ['antworten', 'Antworte {d:mir} bitte!', 'Er antwortet ((dem|den)) Lehrer nicht.'], ['glauben', 'Ich glaube {d:dir}.', 'Ich glaube ((dir|dich)) kein Wort!'],
  ['vertrauen', 'Ich vertraue {d:meinem Bruder}.', 'Ich vertraue ((meinem|meinen)) Freund.'], ['zuhören', 'Hör {d:mir} zu!', 'Hör ((mir|mich)) bitte zu!'],
  ['zustimmen', 'Ich stimme {d:Ihnen} zu.', 'Ich stimme ((dir|dich)) zu.'], ['widersprechen', 'Er widerspricht {d:seinem Chef}.', 'Sie widerspricht ((ihrem|ihren)) Vater.'],
  ['folgen', 'Folgen Sie {d:mir}!', 'Der Hund folgt ((dem|den)) Kind.'], ['begegnen', 'Ich bin {d:ihr} im Park begegnet.', 'Gestern bin ich ((meiner|meine)) Lehrerin begegnet.'],
  ['fehlen', 'Du fehlst {d:mir}.', 'Meine Familie fehlt ((mir|mich)) sehr.'], ['schaden', 'Rauchen schadet {d:der Gesundheit}.', 'Zu viel Zucker schadet ((den|die)) Zähnen.'],
  ['nützen', 'Das nützt {d:mir} nichts.', 'Das Wörterbuch nützt ((uns|unser)) viel.'], ['gelingen', 'Der Kuchen ist {d:mir} gelungen.', 'Die Prüfung ist ((ihm|ihn)) gut gelungen.'],
  ['passieren', 'Was ist {d:dir} passiert?', 'Was ist ((dir|dich)) passiert?'], ['wehtun', '{d:Mir} tut der Rücken weh.', '((Mir|Mich)) tut der Kopf weh.'],
  ['leidtun', 'Es tut {d:mir} leid.', 'Es tut ((mir|mich)) leid.'], ['raten', 'Der Arzt rät {d:mir}, mehr zu schlafen.', 'Ich rate ((dir|dich)), früher ins Bett zu gehen.'],
  ['verzeihen', 'Verzeih {d:mir}!', 'Bitte verzeih ((mir|mich))!'], ['gehorchen', 'Der Hund gehorcht {d:ihm}.', 'Die Kinder gehorchen ((ihren|ihre)) Eltern.'],
  ['ähneln', 'Sie ähnelt {d:ihrer Mutter}.', 'Er ähnelt ((seinem|seinen)) Vater.'], ['zusehen', 'Ich sehe {d:euch} beim Spielen zu.', 'Ich sehe ((den|die)) Kindern beim Spielen zu.']
];
const AKK = ['besuchen', 'fragen', 'anrufen', 'lieben', 'sehen', 'treffen', 'kennen', 'brauchen', 'suchen', 'einladen', 'verstehen', 'vergessen', 'bezahlen', 'unterstützen', 'begrüßen'];
const PRON = [['ich', 'mir'], ['du', 'dir'], ['er', 'ihm'], ['sie (Singular)', 'ihr'], ['wir', 'uns'], ['ihr', 'euch'], ['sie (Plural)', 'ihnen'], ['Sie', 'Ihnen']];
const FRAMES = [['Kannst du', 'helfen?'], ['Das Buch gehört', '.'], ['Der Film hat', 'gefallen.'], ['Wir danken', 'herzlich.'], ['Es tut', 'leid.'], ['Ich gratuliere', 'zum Geburtstag.']];
const pick = (arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };

GRAM.add({
  n: 102, level: 'Liste', group: 'Nachschlagen und trainieren',
  title: 'Verben mit Dativ',
  kicker: 'helfen, danken, gefallen …',
  intro: 'Diese Verben haben ein <b>Dativ-Objekt</b> – meistens eine Person – und kein Akkusativ-Objekt. Bei gefallen, schmecken, gehören, passen und fehlen ist die Sache das Subjekt. Der Trainer gibt dir bei jedem „Neu“ andere Sätze.',
  hero: 'Ich helfe {d:dir}, du dankst {d:mir}, und das gefällt {d:uns}.',
  art: K => {
    const chip = (x, y, t) => `<g transform="translate(${x} ${y})"><rect x="-40" y="-22" width="80" height="44" rx="22" fill="var(--dat-s)" stroke="var(--dat)" stroke-width="2.5"/><text y="7" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="21" fill="var(--dat)">${t}</text></g>`;
    return K.svg(`<rect width="520" height="360" fill="var(--sky1)"/><circle cx="260" cy="180" r="70" fill="var(--dat)"/><text x="260" y="174" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="28" fill="var(--card)">Wem?</text><text x="260" y="204" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="14" fill="var(--card)">DATIV</text>` +
      [['mir', 100, 80], ['dir', 260, 50], ['ihm', 420, 80], ['ihr', 450, 200], ['uns', 400, 300], ['euch', 260, 316], ['ihnen', 110, 300], ['Ihnen', 70, 200]].map(([t, x, y]) => K.arrow(`M260 180L${x} ${y}`, 'var(--faint)') + chip(x, y, t)).join(''),
      'Das Fragewort Wem? in der Mitte, rundherum die Dativpronomen mir, dir, ihm, ihr, uns, euch, ihnen, Ihnen.');
  },
  lemmas: {},

  understand: [
    { type: 'grid', title: 'Personalpronomen im Dativ', head: ['Nominativ', 'Dativ'], label: false, rows: PRON.map(p => [p[0], `{d:${p[1]}}`]) },
    { type: 'note', title: 'Vorsicht bei gefallen, schmecken, gehören', text: 'Die Sache ist das Subjekt: {n:Die Suppe} schmeckt {d:mir}. {n:Die Schuhe} gefall{e:en} {d:mir} (Plural!).' },
    { type: 'reflist', title: 'Alle Verben mit Dativ', intro: 'Tippe auf ein Verb, um es im Wörterbuch zu sehen.', head: ['Verb', 'Beispiel'], rows: L.map(v => [v[0], v[1]]) }
  ],

  examples: L.slice(0, 7).map(v => v[1]),

  exercises: [
    { id: 'u1', type: 'choice', title: 'Dativ!', instr: 'Wähle die richtige Form. Bei „Neu“ kommen andere Sätze.', gen: () => pick(L, 8).map(v => v[2]) },
    { id: 'u2', type: 'choice', title: 'Dativ oder Akkusativ?', instr: 'Welchen Fall braucht das Verb?',
      gen: () => pick(L.map(v => v[0] + ' + ((Dativ|Akkusativ))').concat(AKK.map(v => v + ' + ((Akkusativ|Dativ))')), 8) },
    { id: 'u3', type: 'fill', title: 'Das Pronomen', instr: 'Schreib das Pronomen im Dativ.',
      gen: () => pick(FRAMES, 6).map(f => { const p = PRON[Math.floor(Math.random() * PRON.length)]; return `(${p[0]}) ${f[0]} [[${p[1]}]] ${f[1]}`.replace(' .', '.'); }) }
  ],

  speak: { title: 'Lernkarten', intro: 'Bilde einen Satz mit dem Verb – dann deck auf.', altLabel: 'Weiter', gen: () => pick(L, 8).map(v => ({ cue: [['x', 'book-open', v[0]], ['d', '', '+ Dativ']], say: v[1] })) }
});
})();
