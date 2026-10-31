/* Kapitel 42 – Komparativ und Vergleiche (A2). Eigene Texte, Beispiele und Übungen. */
GRAM.add({
  n: 42, level: 'A2', group: 'Adjektive 1',
  title: 'Komparativ und Vergleiche',
  kicker: 'größer als, so groß wie',
  intro: 'Den <b>Komparativ</b> bildest du mit <b>-er</b>: klein → klein<b>er</b>. Viele kurze Adjektive bekommen einen Umlaut: alt → <b>ä</b>lter. Verschieden: <b>… als</b>. Gleich: <b>so … wie</b>.',
  hero: 'Tom ist {e:größer als} Lea – aber Lea ist {e:schneller}.',
  art: K => K.svg(K.room(false) +
    `<rect x="250" y="70" width="18" height="226" fill="var(--card)" stroke="var(--line)" stroke-width="1.5"/>${Array.from({ length: 12 }, (_, i) => `<path d="M250 ${86 + i * 18}h${i % 2 ? 8 : 14}" stroke="var(--ink)" stroke-width="1.5"/>`).join('')}` +
    K.shadow(180) + K.person({ x: 180, s: 1.12, shirt: 'var(--der)', skin: 1, hair: 'short', armR: 'hip' }) +
    K.shadow(340) + K.person({ x: 340, s: .86, shirt: 'var(--die)', skin: 4, hair: 'long', hc: 'var(--hair4)', armL: 'up', face: 'open' }) +
    K.arrow('M150 112H300', 'var(--faint)') + K.tag(180, 70, 'größer', 'der') + K.tag(400, 120, 'kleiner', 'die'),
    'Tom und Lea stehen neben einem Maßband. Tom ist größer, Lea ist kleiner.'),
  lemmas: { größer: 'groß', schneller: 'schnell', älter: 'alt', besser: 'gut', mehr: 'viel', lieber: 'gern', teurer: 'teuer' },

  understand: [
    { type: 'grid', title: 'So bildest du den Komparativ', head: ['', 'Grundform', 'Komparativ'], rows: [
      ['regelmäßig', 'klein · schnell · billig', 'klein{e:er} · schnell{e:er} · billig{e:er}'],
      ['mit Umlaut', 'alt · groß · jung · warm · kalt · lang · kurz', '{e:ä}lt{e:er} · gr{e:ö}ß{e:er} · j{e:ü}ng{e:er} · w{e:ä}rm{e:er} · k{e:ä}lt{e:er} · l{e:ä}ng{e:er} · k{e:ü}rz{e:er}'],
      ['auf -el / -er', 'dunkel · teuer', 'dunk{e:ler} · teu{e:rer}'],
      ['unregelmäßig', 'gut · viel · gern · hoch', '{e:besser} · {e:mehr} · {e:lieber} · {e:höher}'] ] },
    { type: 'cards', title: 'Vergleichen', min: '14rem', items: [
      { t: '… als', k: 'ac', icon: 'scale', p: 'verschieden: Komparativ + als', ex: 'Tom ist {e:größer als} Lea.' },
      { t: 'so … wie', k: 'ok', icon: 'equal', p: 'gleich: so + Grundform + wie', ex: 'Lea ist {e:so alt wie} Tom.' },
      { t: 'nicht so … wie', k: 'b', icon: 'equal-not', p: 'weniger: nicht so + Grundform + wie', ex: 'Der Bus ist {e:nicht so schnell wie} der Zug.' } ] },
    { type: 'note', title: 'Vor dem Nomen', text: 'Vor einem Nomen bekommt der Komparativ eine Adjektivendung: Ich möchte ein {e:größeres} Zimmer. Sie hat das {e:bessere} Handy.' },
    { type: 'merk', text: 'Anders → {e:als}. Gleich → {e:so … wie}.' }
  ],

  examples: [
    'Der Zug ist {e:schneller als} der Bus.',
    'Im Juli ist es {e:wärmer als} im April.',
    'Mein Bruder ist {e:älter als} ich.',
    'Tee trinke ich {e:lieber als} Kaffee.',
    'Die Jacke ist {e:so teuer wie} die Schuhe.',
    'Heute ist es {e:nicht so kalt wie} gestern.',
    'Wir brauchen eine {e:größere} Wohnung.'
  ],

  exercises: [
    { id: 'u1', type: 'fill', title: 'Komparativ bilden', instr: 'Schreib den Komparativ.',
      items: [
        'klein → [[kleiner]]', 'alt → [[älter]]', 'gut → [[besser]]', 'viel → [[mehr]]',
        'gern → [[lieber]]', 'groß → [[größer]]', 'teuer → [[teurer]]', 'kurz → [[kürzer]]' ] },
    { id: 'u2', type: 'choice', title: 'als oder wie?', instr: 'Wähle als oder wie.',
      items: [
        'Ich bin größer ((als|wie)) meine Schwester.', 'Paul ist so alt ((wie|als)) ich.', 'Das Auto ist teurer ((als|wie)) das Fahrrad.',
        'Heute ist es nicht so warm ((wie|als)) gestern.', 'Sie spricht besser Deutsch ((als|wie)) ich.', 'Mein Zimmer ist genauso groß ((wie|als)) deins.' ] },
    { id: 'u3', type: 'type', title: 'Vergleiche', instr: 'Vergleiche mit dem Adjektiv in Klammern.',
      items: [
        { q: 'Tom: 1,90 m · Lea: 1,60 m (groß)', pre: 'Tom ist', end: ' Lea.', ok: ['größer als'] },
        { q: 'der Zug: 200 km/h · das Auto: 120 km/h (schnell)', pre: 'Der Zug ist', end: ' das Auto.', ok: ['schneller als'] },
        { q: 'Ben: 20 Jahre · Mia: 20 Jahre (alt)', pre: 'Ben ist', end: ' Mia.', ok: ['so alt wie', 'genauso alt wie'] },
        { q: 'Tee: ♥♥♥ · Kaffee: ♥ (gern)', pre: 'Ich trinke Tee', end: ' Kaffee.', ok: ['lieber als'] },
        { q: 'Juli: 30 °C · Mai: 20 °C (warm)', pre: 'Im Juli ist es', end: ' im Mai.', ok: ['wärmer als'] },
        { q: 'Buch: 10 € · Film: 15 € (billig)', pre: 'Das Buch ist', end: ' der Film.', ok: ['billiger als'] } ] },
    { id: 'u4', type: 'choice', title: 'Die richtige Form', instr: 'Wähle die richtige Form.',
      items: [
        'Im Winter ist es ((kälter|kalter|kälterer)) als im Herbst.', 'Mein Handy ist ((besser|guter|gutter)) als deins.', 'Ich esse ((mehr|vieler|meher)) Obst als früher.',
        'Wir suchen eine ((größere|größer|größeren)) Wohnung.', 'Der Berg ist ((höher|hocher|hoher)) als das Haus.', 'Er hat ein ((schnelleres|schneller|schnelleren)) Auto.' ] }
  ],

  speak: { title: 'Vergleiche!', intro: 'Vergleiche die zwei Dinge.', altLabel: 'Andersherum',
    items: [
      { cue: [['x', 'train-front', 'Zug'], ['x', 'bus', 'Bus'], ['e', 'gauge', 'schnell']], say: 'Der Zug ist {e:schneller als} der Bus.', alt: 'Der Bus ist {e:nicht so schnell wie} der Zug.' },
      { cue: [['x', 'sun', 'Sommer'], ['x', 'snowflake', 'Winter'], ['e', 'thermometer', 'warm']], say: 'Im Sommer ist es {e:wärmer als} im Winter.', alt: 'Im Winter ist es {e:kälter als} im Sommer.' },
      { cue: [['x', 'coffee', 'Tee'], ['x', 'coffee', 'Kaffee'], ['e', 'heart', 'gern']], say: 'Ich trinke Tee {e:lieber als} Kaffee.' },
      { cue: [['x', 'car', 'Auto'], ['x', 'bike', 'Fahrrad'], ['e', 'euro', 'teuer']], say: 'Ein Auto ist {e:teurer als} ein Fahrrad.', alt: 'Ein Fahrrad ist {e:billiger als} ein Auto.' },
      { cue: [['x', 'user-round', 'ich'], ['x', 'user-round', 'mein Freund'], ['e', 'equal', 'alt (gleich)']], say: 'Ich bin {e:so alt wie} mein Freund.' },
      { cue: [['x', 'mountain', 'Berg'], ['x', 'house', 'Haus'], ['e', 'arrow-up', 'hoch']], say: 'Der Berg ist {e:höher als} das Haus.' } ] }
});
