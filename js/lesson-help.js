/* Explanations in the learner's language (A1–B1 grammar chapters).
   The German lesson is never changed. A translation is a separate map from a German text of the lesson to its
   translation; at display time the chapter page shows a translated view of the lesson where such a text exists,
   and German everywhere else. Exercise items, answers, examples and anything graded are never part of the view,
   so marking is exactly the same in every language.
   The same walker collects the texts for translation (tools/lesson-help/) and builds the view in the browser,
   so the two can never disagree about which texts are translatable. */
(function (root) {
  'use strict';
  const LANGS = ['en', 'fr', 'sw'];
  const NAMES = { de: 'Deutsch', en: 'English', fr: 'Français', sw: 'Kiswahili' };
  const LEVELS = ['A1', 'A2', 'B1'];
  const REFS = [101, 102, 103, 104, 106];   // the A1–B1 reference units (irregular verbs, verbs with cases, ordinals)
  // Translated text is wrapped in two private-use characters while the page is built, then turned into
  // <span lang="xx" class="gr-tr"> by marks(): screen readers read it in the right language, and fmt() does
  // not make its words tappable for the German dictionary.
  const OPEN = '', CLOSE = '';

  const eligible = c => !!c && (LEVELS.includes(c.level) || REFS.includes(c.n)) && !c.vocab && !c.vocabularyVersion && Array.isArray(c.understand);

  // mapText(c, f): a shallow copy of chapter c in which every translatable text s is replaced by f(s).
  // Everything else (examples, exercise items, answers, generators, pictures) is shared with c by reference.
  function mapText(c, f) {
    const t = s => (typeof s === 'string' ? f(s) : s);
    const list = (a, g) => (Array.isArray(a) ? a.map(g) : a);
    function blk(b) {
      if (!b || typeof b !== 'object') return b;
      const o = { ...b };
      for (const k of ['title', 'intro', 'foot', 'note', 'text', 'pattern']) if (typeof o[k] === 'string') o[k] = t(o[k]);
      switch (b.type) {
        case 'cards': o.items = list(b.items, i => ({ ...i, t: t(i.t), s: t(i.s), p: t(i.p) })); break;
        case 'q3': o.items = list(b.items, i => ({ ...i, q: t(i.q), c: t(i.c), t: t(i.t) })); break;
        case 'grid': o.head = list(b.head, t); o.rows = list(b.rows, r => list(r, t)); break;
        case 'slots': o.rows = list(b.rows, r => list(r, s => (Array.isArray(s) ? [s[0], s[1], t(s[2]), ...s.slice(3)] : s))); break;
        case 'table': o.head = list(b.head, t); break;
        case 'reflist': o.head = list(b.head, t); break;
        case 'scenes': o.items = list(b.items, i => ({ ...i, title: t(i.title), explain: t(i.explain) })); break;
        default: break;
      }
      return o;
    }
    const ex = x => {
      if (!x || typeof x !== 'object') return x;
      const o = { ...x, title: t(x.title), instr: t(x.instr) };
      if (x.before) o.before = blk(x.before);
      return o;
    };
    const out = { ...c, title: t(c.title), group: t(c.group), intro: t(c.intro), understand: list(c.understand, blk), exercises: list(c.exercises, ex) };
    if (c.speak && typeof c.speak === 'object') out.speak = { ...c.speak, title: t(c.speak.title), intro: t(c.speak.intro) };
    return out;
  }

  // Every distinct translatable German text of a chapter, in reading order. Texts without letters are left out.
  function strings(c) {
    const seen = new Set(), out = [];
    mapText(c, s => { if (/\p{L}/u.test(s) && !seen.has(s)) { seen.add(s); out.push(s); } return s; });
    return out;
  }

  // The view of chapter c in language lang, or c itself when there is nothing to translate.
  function view(c, map) {
    if (!eligible(c) || !map || typeof map !== 'object') return c;
    let hits = 0;
    const v = mapText(c, s => {
      const r = Object.prototype.hasOwnProperty.call(map, s) ? map[s] : null;
      if (typeof r !== 'string' || !r || r === s) return s;
      hits++; return OPEN + r + CLOSE;
    });
    return hits ? v : c;
  }

  const isMarked = s => typeof s === 'string' && s.charAt(0) === OPEN;
  const unmark = s => String(s).replace(/[]/g, '');
  // Turn the markers of a finished HTML string into language spans; inside tags (attribute values) just drop them.
  function marks(html, lang) {
    if (html.indexOf(OPEN) < 0) return html;
    const L = LANGS.includes(lang) ? lang : 'en';
    return html.split(/(<[^>]*>)/).map(part => (part.charAt(0) === '<' ? unmark(part)
      : part.replace(//g, `<span lang="${L}" class="gr-tr">`).replace(//g, '</span>'))).join('');
  }

  // The chapter page's own words (headings, buttons, feedback). %1 … %4 are filled in by the page.
  const UI = {
    en: {
      'Grammatik': 'Grammar', 'Kapitel': 'Chapter', 'Nachschlagen und trainieren': 'Look up and practise',
      'Erklärungen auf': 'Explanations in', 'Sprache der Erklärungen': 'Language of the explanations',
      'Im Spiel üben': 'Practise in a game', 'Verstehen': 'Understand', 'Beispiele': 'Examples', 'Üben': 'Practise', 'Sprechen': 'Speak',
      'Nominativ – wer?': 'Nominativ – who?', 'Dativ – wem?': 'Dativ – to whom?', 'Akkusativ – was?': 'Akkusativ – what?',
      'Tippe auf ein Wort, um es im Wörterbuch nachzuschlagen.': 'Tap a German word to look it up in the dictionary.',
      'Bestanden ab %1 % richtigen Antworten. Die Lösung kannst du nach dem ersten Prüfen ansehen.': 'You pass with at least %1% correct answers. You can see the solution after your first check.',
      'Übe dieses Kapitel auch im Spiel:': 'Practise this chapter in a game too:', 'Allein spielen': 'Play solo', 'Live mit Gruppe': 'Live with a group',
      'Trainingsrunde': 'Practice round', 'Vorherige Trainingsrunde': 'Previous practice round', 'Nächste Trainingsrunde': 'Next practice round', 'Runde %1 von %2': 'Round %1 of %2',
      'Die Animation konnte nicht geladen werden. Du kannst die Erklärungen und Übungen darunter weiter nutzen.': 'The animation could not be loaded. You can still use the explanations and exercises below.',
      'Alle Abschnitte zu- oder aufklappen': 'Collapse or expand all sections', 'Alles zuklappen': 'Collapse all', 'Alles aufklappen': 'Expand all',
      '<b>%1 von %2</b> Übungen bestanden': '<b>%1 of %2</b> exercises passed', 'Kapitel geschafft! 🎉': 'Chapter complete! 🎉',
      'Ergebnisse werden in deinem Konto gespeichert.': 'Your results are saved in your account.', 'Wo werden meine Ergebnisse gespeichert?': 'Where are my results saved?',
      'Merksatz': 'Remember', 'die Person bekommt die Sache': 'the person gets the thing', 'Suchen …': 'Search …', '%1 Einträge': '%1 entries',
      'Anhören': 'Listen', 'Übung': 'Exercise', 'Prüfen': 'Check', 'Erst nach dem ersten Prüfen': 'Only after your first check', 'Lösung zeigen': 'Show solution', 'Zuerst ansehen:': 'Look at this first:', 'Neu': 'New',
      'ohne Note': 'not graded', 'bestanden · %1 %': 'passed · %1%', 'bestes Ergebnis %1 %': 'best result %1%', 'Antwort %1': 'Answer %1',
      'Richtig: ': 'Correct: ', 'Bearbeite zuerst die Aufgaben.': 'Do the tasks first.',
      'Richtig – aber achte auf Groß- und Kleinschreibung: ': 'Correct – but check capital and lower-case letters: ',
      '%1 von %2 richtig – zählt nicht, weil die Lösung angezeigt wurde.': '%1 of %2 correct – this does not count because the solution was shown.',
      '%1 von %2 richtig (%3 %) – bestanden!': '%1 of %2 correct (%3%) – passed!',
      '%1 von %2 richtig (%3 %) – noch nicht bestanden (ab %4 %)': '%1 of %2 correct (%3%) – not passed yet (pass mark %4%)',
      'Lösung angezeigt. Mit „Neu“ kannst du es noch einmal versuchen.': 'Solution shown. Press “New” to try again.',
      'Schreib zuerst einen Satz.': 'Write a sentence first.', 'Wird geprüft …': 'Checking …', 'Am Satzende fehlt ein Punkt.': 'The full stop at the end of the sentence is missing.',
      'Benutze ein passendes Verb aus diesem Kapitel.': 'Use a suitable verb from this chapter.',
      'Die automatische Rechtschreibprüfung ist gerade nicht erreichbar.': 'The automatic spelling check cannot be reached right now.',
      'Keine Fehler gefunden. Gut gemacht! (Die Prüfung findet nicht jeden Fehler.)': 'No mistakes found. Well done! (The check does not find every mistake.)',
      '%1 von %2 Sätzen ohne erkannte Fehler.': '%1 of %2 sentences without detected mistakes.',
      'Erst laut sagen – dann aufdecken.': 'Say it out loud first – then reveal it.', 'Lösung': 'Solution', 'Mit Pronomen': 'With a pronoun',
      'Animation ansehen': 'Watch the animation', 'Video ansehen': 'Watch the video', 'Animation starten': 'Start the animation',
      'Liv und ihre Nachbarn stellen sich vor – mit Ton. Danach fragt Liv dich.': 'Liv and her neighbours introduce themselves – with sound. Then Liv asks you.', 'Die Säge zeigt es': 'The saw shows it', 'Trennbare Verben lassen sich zersägen, untrennbare nicht. Sieh Liv zu oder säge selbst – mit Ton.': 'Separable verbs can be sawn apart, inseparable ones cannot. Watch Liv or saw yourself – with sound.', 'Werkstatt mit Liv': 'Workshop with Liv', '3D-Werkstatt': '3D workshop',
      'Die Übersetzung konnte nicht geladen werden. Die Erklärungen stehen auf Deutsch da.': 'The translation could not be loaded. The explanations are shown in German.',
    },
    fr: {
      'Grammatik': 'Grammaire', 'Kapitel': 'Chapitre', 'Nachschlagen und trainieren': 'Consulter et s’entraîner',
      'Erklärungen auf': 'Explications en', 'Sprache der Erklärungen': 'Langue des explications',
      'Im Spiel üben': 'S’entraîner en jouant', 'Verstehen': 'Comprendre', 'Beispiele': 'Exemples', 'Üben': 'S’entraîner', 'Sprechen': 'Parler',
      'Nominativ – wer?': 'Nominativ – qui ?', 'Dativ – wem?': 'Dativ – à qui ?', 'Akkusativ – was?': 'Akkusativ – quoi ?',
      'Tippe auf ein Wort, um es im Wörterbuch nachzuschlagen.': 'Touche un mot allemand pour le chercher dans le dictionnaire.',
      'Bestanden ab %1 % richtigen Antworten. Die Lösung kannst du nach dem ersten Prüfen ansehen.': 'Réussi à partir de %1 % de bonnes réponses. Tu peux voir la solution après ta première vérification.',
      'Übe dieses Kapitel auch im Spiel:': 'Entraîne-toi aussi sur ce chapitre en jouant :', 'Allein spielen': 'Jouer en solo', 'Live mit Gruppe': 'En direct avec un groupe',
      'Trainingsrunde': 'Série d’exercices', 'Vorherige Trainingsrunde': 'Série précédente', 'Nächste Trainingsrunde': 'Série suivante', 'Runde %1 von %2': 'Série %1 sur %2',
      'Die Animation konnte nicht geladen werden. Du kannst die Erklärungen und Übungen darunter weiter nutzen.': 'L’animation n’a pas pu être chargée. Tu peux quand même utiliser les explications et les exercices ci-dessous.',
      'Alle Abschnitte zu- oder aufklappen': 'Replier ou déplier toutes les sections', 'Alles zuklappen': 'Tout replier', 'Alles aufklappen': 'Tout déplier',
      '<b>%1 von %2</b> Übungen bestanden': '<b>%1 sur %2</b> exercices réussis', 'Kapitel geschafft! 🎉': 'Chapitre terminé ! 🎉',
      'Ergebnisse werden in deinem Konto gespeichert.': 'Tes résultats sont enregistrés dans ton compte.', 'Wo werden meine Ergebnisse gespeichert?': 'Où mes résultats sont-ils enregistrés ?',
      'Merksatz': 'À retenir', 'die Person bekommt die Sache': 'la personne reçoit la chose', 'Suchen …': 'Rechercher …', '%1 Einträge': '%1 entrées',
      'Anhören': 'Écouter', 'Übung': 'Exercice', 'Prüfen': 'Vérifier', 'Erst nach dem ersten Prüfen': 'Seulement après ta première vérification', 'Lösung zeigen': 'Voir la solution', 'Zuerst ansehen:': 'À voir d’abord :', 'Neu': 'Recommencer',
      'ohne Note': 'non noté', 'bestanden · %1 %': 'réussi · %1 %', 'bestes Ergebnis %1 %': 'meilleur résultat %1 %', 'Antwort %1': 'Réponse %1',
      'Richtig: ': 'Bonne réponse : ', 'Bearbeite zuerst die Aufgaben.': 'Fais d’abord les exercices.',
      'Richtig – aber achte auf Groß- und Kleinschreibung: ': 'Correct – mais fais attention aux majuscules et minuscules : ',
      '%1 von %2 richtig – zählt nicht, weil die Lösung angezeigt wurde.': '%1 sur %2 correctes – cela ne compte pas, car la solution a été affichée.',
      '%1 von %2 richtig (%3 %) – bestanden!': '%1 sur %2 correctes (%3 %) – réussi !',
      '%1 von %2 richtig (%3 %) – noch nicht bestanden (ab %4 %)': '%1 sur %2 correctes (%3 %) – pas encore réussi (il faut %4 %)',
      'Lösung angezeigt. Mit „Neu“ kannst du es noch einmal versuchen.': 'Solution affichée. Avec « Recommencer », tu peux essayer encore une fois.',
      'Schreib zuerst einen Satz.': 'Écris d’abord une phrase.', 'Wird geprüft …': 'Vérification en cours …', 'Am Satzende fehlt ein Punkt.': 'Il manque un point à la fin de la phrase.',
      'Benutze ein passendes Verb aus diesem Kapitel.': 'Utilise un verbe de ce chapitre qui convient.',
      'Die automatische Rechtschreibprüfung ist gerade nicht erreichbar.': 'La correction automatique n’est pas disponible pour le moment.',
      'Keine Fehler gefunden. Gut gemacht! (Die Prüfung findet nicht jeden Fehler.)': 'Aucune faute trouvée. Bravo ! (La vérification ne trouve pas toutes les fautes.)',
      '%1 von %2 Sätzen ohne erkannte Fehler.': '%1 phrases sur %2 sans faute détectée.',
      'Erst laut sagen – dann aufdecken.': 'Dis-le d’abord à voix haute – puis découvre la solution.', 'Lösung': 'Solution', 'Mit Pronomen': 'Avec un pronom',
      'Animation ansehen': 'Voir l’animation', 'Video ansehen': 'Voir la vidéo', 'Animation starten': 'Lancer l’animation',
      'Liv und ihre Nachbarn stellen sich vor – mit Ton. Danach fragt Liv dich.': 'Liv et ses voisins se présentent – avec le son. Ensuite, Liv te pose des questions.', 'Die Säge zeigt es': 'La scie le montre', 'Trennbare Verben lassen sich zersägen, untrennbare nicht. Sieh Liv zu oder säge selbst – mit Ton.': 'On peut scier les verbes séparables, pas les inséparables. Regarde Liv ou scie toi-même – avec le son.', 'Werkstatt mit Liv': 'L’atelier avec Liv', '3D-Werkstatt': 'Atelier en 3D',
      'Die Übersetzung konnte nicht geladen werden. Die Erklärungen stehen auf Deutsch da.': 'La traduction n’a pas pu être chargée. Les explications sont affichées en allemand.',
    },
    sw: {
      'Grammatik': 'Sarufi', 'Kapitel': 'Sura', 'Nachschlagen und trainieren': 'Rejelea na ujizoeze',
      'Erklärungen auf': 'Maelezo kwa', 'Sprache der Erklärungen': 'Lugha ya maelezo',
      'Im Spiel üben': 'Jizoeze kwa mchezo', 'Verstehen': 'Elewa', 'Beispiele': 'Mifano', 'Üben': 'Jizoeze', 'Sprechen': 'Zungumza',
      'Nominativ – wer?': 'Nominativ – nani?', 'Dativ – wem?': 'Dativ – kwa nani?', 'Akkusativ – was?': 'Akkusativ – nini?',
      'Tippe auf ein Wort, um es im Wörterbuch nachzuschlagen.': 'Gusa neno la Kijerumani ulitafute kwenye kamusi.',
      'Bestanden ab %1 % richtigen Antworten. Die Lösung kannst du nach dem ersten Prüfen ansehen.': 'Unafaulu ukipata angalau %1 % ya majibu sahihi. Unaweza kuona jibu baada ya kukagua mara ya kwanza.',
      'Übe dieses Kapitel auch im Spiel:': 'Jizoeze sura hii pia kwa mchezo:', 'Allein spielen': 'Cheza peke yako', 'Live mit Gruppe': 'Moja kwa moja na kikundi',
      'Trainingsrunde': 'Awamu ya mazoezi', 'Vorherige Trainingsrunde': 'Awamu iliyotangulia', 'Nächste Trainingsrunde': 'Awamu inayofuata', 'Runde %1 von %2': 'Awamu %1 kati ya %2',
      'Die Animation konnte nicht geladen werden. Du kannst die Erklärungen und Übungen darunter weiter nutzen.': 'Uhuishaji haukuweza kupakiwa. Bado unaweza kutumia maelezo na mazoezi yaliyo hapa chini.',
      'Alle Abschnitte zu- oder aufklappen': 'Funga au fungua sehemu zote', 'Alles zuklappen': 'Funga zote', 'Alles aufklappen': 'Fungua zote',
      '<b>%1 von %2</b> Übungen bestanden': 'Umefaulu <b>mazoezi %1 kati ya %2</b>', 'Kapitel geschafft! 🎉': 'Umemaliza sura! 🎉',
      'Ergebnisse werden in deinem Konto gespeichert.': 'Matokeo yako yanahifadhiwa kwenye akaunti yako.', 'Wo werden meine Ergebnisse gespeichert?': 'Matokeo yangu yanahifadhiwa wapi?',
      'Merksatz': 'Kumbuka', 'die Person bekommt die Sache': 'mtu anapokea kitu', 'Suchen …': 'Tafuta …', '%1 Einträge': 'vipengele %1',
      'Anhören': 'Sikiliza', 'Übung': 'Zoezi', 'Prüfen': 'Kagua', 'Erst nach dem ersten Prüfen': 'Baada ya kukagua mara ya kwanza tu', 'Lösung zeigen': 'Onyesha jibu', 'Zuerst ansehen:': 'Tazama kwanza:', 'Neu': 'Upya',
      'ohne Note': 'bila alama', 'bestanden · %1 %': 'umefaulu · %1 %', 'bestes Ergebnis %1 %': 'matokeo bora %1 %', 'Antwort %1': 'Jibu %1',
      'Richtig: ': 'Jibu sahihi: ', 'Bearbeite zuerst die Aufgaben.': 'Fanya mazoezi kwanza.',
      'Richtig – aber achte auf Groß- und Kleinschreibung: ': 'Sahihi – lakini zingatia herufi kubwa na ndogo: ',
      '%1 von %2 richtig – zählt nicht, weil die Lösung angezeigt wurde.': 'Sahihi %1 kati ya %2 – haihesabiwi kwa sababu jibu lilionyeshwa.',
      '%1 von %2 richtig (%3 %) – bestanden!': 'Sahihi %1 kati ya %2 (%3 %) – umefaulu!',
      '%1 von %2 richtig (%3 %) – noch nicht bestanden (ab %4 %)': 'Sahihi %1 kati ya %2 (%3 %) – bado hujafaulu (unahitaji %4 %)',
      'Lösung angezeigt. Mit „Neu“ kannst du es noch einmal versuchen.': 'Jibu limeonyeshwa. Bonyeza „Upya“ ujaribu tena.',
      'Schreib zuerst einen Satz.': 'Andika sentensi kwanza.', 'Wird geprüft …': 'Inakaguliwa …', 'Am Satzende fehlt ein Punkt.': 'Nukta inakosekana mwishoni mwa sentensi.',
      'Benutze ein passendes Verb aus diesem Kapitel.': 'Tumia kitenzi kinachofaa kutoka sura hii.',
      'Die automatische Rechtschreibprüfung ist gerade nicht erreichbar.': 'Ukaguzi wa tahajia wa kiotomatiki haupatikani kwa sasa.',
      'Keine Fehler gefunden. Gut gemacht! (Die Prüfung findet nicht jeden Fehler.)': 'Hakuna kosa lililopatikana. Hongera! (Ukaguzi haupati kila kosa.)',
      '%1 von %2 Sätzen ohne erkannte Fehler.': 'Sentensi %1 kati ya %2 hazina kosa lililogunduliwa.',
      'Erst laut sagen – dann aufdecken.': 'Sema kwa sauti kwanza – kisha ufunue.', 'Lösung': 'Jibu', 'Mit Pronomen': 'Kwa kiwakilishi',
      'Animation ansehen': 'Tazama uhuishaji', 'Video ansehen': 'Tazama video', 'Animation starten': 'Anza uhuishaji',
      'Liv und ihre Nachbarn stellen sich vor – mit Ton. Danach fragt Liv dich.': 'Liv na majirani zake wanajitambulisha – kwa sauti. Kisha Liv anakuuliza maswali.', 'Die Säge zeigt es': 'Msumeno unaonyesha', 'Trennbare Verben lassen sich zersägen, untrennbare nicht. Sieh Liv zu oder säge selbst – mit Ton.': 'Vitenzi vinavyotengana vinaweza kukatwa kwa msumeno, visivyotengana haviwezi. Mtazame Liv au ukate mwenyewe – kwa sauti.', 'Werkstatt mit Liv': 'Karakana na Liv', '3D-Werkstatt': 'Karakana ya 3D',
      'Die Übersetzung konnte nicht geladen werden. Die Erklärungen stehen auf Deutsch da.': 'Tafsiri haikuweza kupakiwa. Maelezo yanaonyeshwa kwa Kijerumani.',
    },
  };
  // ui(lang, german, ...values): the page's own text in lang, German when there is no translation.
  function ui(lang, s, ...v) {
    const t = (UI[lang] && UI[lang][s]) || s;
    return v.length ? t.replace(/%(\d)/g, (m, i) => (v[i - 1] != null ? v[i - 1] : m)) : t;
  }

  // The visitor's choice on this device (signed-in learners also keep it in their account, see konto.js).
  const KEY = 'gd_help';
  function stored() { try { const v = localStorage.getItem(KEY); return v === 'de' || LANGS.includes(v) ? v : null; } catch (e) { return null; } }
  function store(l) { try { localStorage.setItem(KEY, l); } catch (e) { /* private mode */ } }

  const api = { LANGS, NAMES, LEVELS, REFS, UI, ui, stored, store, OPEN, CLOSE, eligible, mapText, strings, view, marks, isMarked, unmark };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LessonHelp = api;
})(typeof window !== 'undefined' ? window : globalThis);
