/* ===== Grammatik =====
   Loaded only when someone opens the grammar tab, so the dictionary stays as fast as before.
   Each chapter is its own small file (k22.js …) that calls GRAM.add({...}).
   Results: every "Prüfen" is one attempt. 70 % or more = passed (PASS below).
   Attempts are kept in this browser and, for signed-in users, saved to Supabase (table grammar_results). */
(function () {
'use strict';
let PASS = 0.7;                         // share of correct answers needed to pass an exercise (a teacher/school can change it)
const $ = id => document.getElementById(id);
const H = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const icn = n => (typeof ic === 'function' ? ic(n) : '');
const icons = () => { if (typeof drawIcons === 'function') drawIcons(); };
const CASE = { n: 'Nominativ', d: 'Dativ', a: 'Akkusativ' };
const CH = {};                          // loaded chapters by number
let cur = null;                         // chapter on screen

/* ---------- chapter list (topics A1–B1, in learning order) ---------- */
const GROUPS = [
  { t: 'Wortschatz A1', ic: 'book-a', h: 20, vocab: true, lv: 'A1', open: true, ch: [
    [201, 'Person', 'Name, Herkunft, Alter', 'A1'], [202, 'Familie und Freunde', 'Eltern, Geschwister, Freunde', 'A1'],
    [203, 'Körper und Gesundheit', 'Kopf, Hand, krank sein', 'A1'], [204, 'Post, Bank und Ämter', 'Brief, Konto, Formular', 'A1'],
    [205, 'Verkehr', 'Bus, Bahn, Fahrrad', 'A1'], [206, 'Reisen', 'Hotel, Koffer, Fahrkarte', 'A1'],
    [207, 'Einkaufen: Lebensmittel', 'Brot, Obst, Supermarkt', 'A1'], [208, 'Restaurant, Imbiss, Einladung', 'bestellen, bezahlen', 'A1'],
    [209, 'Kommunikation und Freizeit', 'Handy, Hobby, Sport', 'A1'], [210, 'Lernen', 'Kurs, Heft, üben', 'A1'],
    [211, 'Arbeit und Beruf', 'Büro, Kollege, arbeiten', 'A1'], [212, 'Wohnen', 'Zimmer, Küche, Miete', 'A1'],
    [213, 'Uhrzeit, Tag und Woche', 'Montag, morgens, um acht', 'A1'], [214, 'Datum, Jahreszeiten, Wetter', 'Mai, Sommer, Regen', 'A1'],
    [215, 'Kleine Wörter', 'hier, dort, mit, ohne', 'A1'], [216, 'Zahlen, Maße, Gewichte', 'eins, Kilo, Meter', 'A1'] ] },
  { t: 'Wortschatz A2', ic: 'book-a', h: 215, vocab: true, lv: 'A2', ch: [
    [221, 'Miteinander sprechen', 'fragen, antworten, sich entschuldigen', 'A2'], [222, 'Familie, Eigenschaften, Personen', 'freundlich, geduldig, ehrlich', 'A2'],
    [223, 'Körper und Gesundheit', 'Rücken, Fieber, Termin', 'A2'], [224, 'Wohnen', 'Miete, Vermieter, umziehen', 'A2'], [225, 'Zu Hause', 'putzen, Möbel, Haushalt', 'A2'],
    [226, 'Auto und Verkehr', 'Stau, tanken, parken', 'A2'], [227, 'Einkaufen: Lebensmittel, Kleidung, Produkte', 'Größe, Angebot, umtauschen', 'A2'],
    [228, 'Wirtschaft und Politik', 'Wahl, Steuer, Preis', 'A2'], [229, 'Beruf und Ausbildung', 'Lehre, Bewerbung, Kollegin', 'A2'],
    [230, 'Dienstleistungen und Behörden', 'Antrag, Ausweis, Formular', 'A2'], [231, 'Freizeit und Unterhaltung', 'Konzert, Verein, Ausflug', 'A2'],
    [232, 'Reisen und Natur', 'Gepäck, Strand, Berge', 'A2'], [233, 'Zeit, Ort, Art und Weise', 'bald, überall, gern', 'A2'] ] },
  { t: 'Wortschatz B1', ic: 'book-a', h: 290, vocab: true, lv: 'B1', ch: [
    [241, 'Menschen', 'Eigenschaften, Beziehungen, Gefühle', 'B1'], [242, 'Wohnen', 'Wohnungsanzeigen, Hausordnung, Nachbarn', 'B1'],
    [243, 'Einkaufen', 'Produkte beschreiben, reklamieren', 'B1'], [244, 'Lernen', 'Schule, Zeugnisse, Sprachkenntnisse', 'B1'],
    [245, 'Freizeit und Kultur', 'Verabredungen, Veranstaltungen, Medien', 'B1'], [246, 'Reisen und Verkehr', 'Unterkünfte, unterwegs', 'B1'],
    [247, 'Gesundheit', 'Alltag, Krankenhaus', 'B1'], [248, 'Umwelt', 'Tiere, Umweltprobleme, Wetter und Klima', 'B1'],
    [249, 'Beruf und Karriere', 'Bewerben, Arbeitsalltag, Rechte', 'B1'], [250, 'Behörden und Institutionen', 'Verwaltung, Bank, Versicherungen', 'B1'] ] },
  { t: 'Wortschatz B2', ic: 'book-a', h: 340, vocab: true, lv: 'B2', soon: true, ch: [] },
  { t: 'Wortschatz C1', ic: 'book-a', h: 10, vocab: true, lv: 'C1', ch: [
    [261, 'Alltag', 'Tätigkeiten, Gegenstände', 'C1'], [262, 'Eigenschaften und Gefühle', 'Charakter, Empfindungen', 'C1'],
    [263, 'Kommunikation und Medien', 'Gespräche, Presse', 'C1'], [264, 'Landwirtschaft und Ernährung', 'Anbau, Nahrung', 'C1'],
    [265, 'Körper und Medizin', 'Organe, Behandlungen', 'C1'], [266, 'Arbeit und Beruf', 'Bewerbung, Arbeitsmarkt', 'C1'],
    [267, 'Geräte und Verfahren', 'Bedienung, Abläufe beschreiben', 'C1'], [268, 'Infrastruktur', 'Versorgung und Energie, Verkehr und Logistik', 'C1'],
    [269, 'Rechtliches', 'Strafrecht, Zivilrecht', 'C1'], [270, 'Politik und Ideologie', 'Demokratie, Gesinnungen', 'C1'],
    [271, 'Geistes- und Sozialwissenschaften', 'Theorien, Gesellschaft', 'C1'], [272, 'Mathematik und Logik', 'Rechnen, Schlussfolgern', 'C1'],
    [273, 'Finanzen und Wirtschaft', 'Geld, Märkte', 'C1'] ] },
  { t: 'Verben 1', ic: 'zap', h: 216, open: true, ch: [
    [1, 'Personalpronomen', 'ich, du, er, sie, es …', 'A1'], [2, 'Präsens: regelmäßige Verben', 'ich wohne, du wohnst', 'A1'],
    [3, 'sein, haben und möchten', 'ich bin, ich habe', 'A1'], [4, 'Verben mit Vokalwechsel', 'essen → isst, fahren → fährt', 'A1'],
    [5, 'Modalverben: Formen und Satzbau', 'können, müssen, dürfen …', 'A1'], [6, 'Modalverben: können, wollen, möchten', 'Fähigkeit und Wunsch', 'A1'],
    [7, 'Modalverben: müssen, sollen, dürfen', 'Pflicht und Erlaubnis', 'A1'], [8, 'Trennbare Verben', 'einkaufen, anrufen', 'A1'],
    [9, 'Imperativ', 'Komm! Kommt! Kommen Sie!', 'A1'] ] },
  { t: 'Sätze und Fragen', ic: 'message-circle-question', h: 262, ch: [
    [10, 'W-Fragen', 'wer, wie, wo, was …', 'A1'], [11, 'Ja/Nein-Fragen', 'Wohnst du hier?', 'A1'],
    [12, 'Das Verb auf Position 2', 'Heute gehen wir ins Kino.', 'A1'], [13, 'Zwei Verben im Satz', 'Ich gehe einkaufen.', 'A2'] ] },
  { t: 'Pronomen, Nomen und Artikel', ic: 'users', h: 280, ch: [
    [14, 'Plural der Nomen', 'das Buch – die Bücher', 'A1'], [15, 'Bestimmter und unbestimmter Artikel', 'der, das, die – ein, eine', 'A1'],
    [16, 'Verneinung: nicht und kein', 'Ich habe keine Zeit.', 'A1'], [17, 'Der Akkusativ', 'Ich sehe den Hund.', 'A1'],
    [18, 'Der Dativ', 'mit dem Bus, mit der Bahn', 'A1'], [19, 'Possessivartikel', 'mein, dein, unser …', 'A1'],
    [20, 'welcher? und dieser', 'Welche Jacke? – Diese!', 'A1'], [21, 'Personalpronomen im Akkusativ und Dativ', 'mich, mir, dich, dir …', 'A1'],
    [22, 'Verben mit Dativ und Akkusativ', 'Wem gibst du was?', 'A2'], [23, 'Verben mit Dativ', 'helfen, danken, gefallen', 'A2'],
    [24, 'Fragen nach Personen und Sachen', 'wer, wen, wem, was', 'A2'] ] },
  { t: 'Verben 2', ic: 'history', h: 24, ch: [
    [25, 'Präteritum von sein und haben', 'ich war, ich hatte', 'A1'], [26, 'Perfekt mit haben', 'Ich habe gekocht.', 'A1'],
    [27, 'Perfekt mit sein', 'Ich bin gefahren.', 'A2'], [28, 'Das Partizip II', 'gemacht, eingekauft, bezahlt', 'A2'],
    [29, 'Präteritum der Modalverben', 'ich konnte, ich musste', 'A2'], [30, 'Perfekt oder Präteritum?', 'Erzählen über gestern', 'A2'],
    [31, 'Reflexive Verben', 'sich waschen, sich freuen', 'A2'] ] },
  { t: 'Präpositionen 1', ic: 'map-pin', h: 160, ch: [
    [32, 'Zeitangaben', 'im Mai, am Montag, um acht', 'A1'], [33, 'Präpositionen mit Dativ', 'aus, bei, mit, nach, seit, von, zu', 'A1'],
    [34, 'Präpositionen mit Akkusativ', 'für, durch, ohne, gegen, um', 'A1'], [35, 'Wo? Ortsangaben mit Dativ', 'im Kino, auf dem Tisch', 'A1'],
    [36, 'Wo oder wohin? Wechselpräpositionen', 'im Kino – ins Kino', 'A2'], [37, 'Wohin? zu, nach, in, auf', 'zum Arzt, nach Berlin', 'A2'],
    [38, 'Wo? bei, in, auf', 'beim Arzt, in Berlin', 'A2'], [39, 'Woher? aus und von', 'aus Berlin, vom Arzt', 'A2'] ] },
  { t: 'Adjektive 1', ic: 'palette', h: 330, ch: [
    [40, 'Adjektivendungen', 'ein netter Mann, den netten Mann', 'A2'], [41, 'Ordinalzahlen und Datum', 'am ersten Mai', 'A2'],
    [42, 'Komparativ und Vergleiche', 'größer als, so groß wie', 'A2'], [43, 'Superlativ', 'am schnellsten, der größte', 'B1'] ] },
  { t: 'Sätze verbinden 1', ic: 'link', h: 190, ch: [
    [44, 'und, aber, oder, denn', 'Hauptsätze verbinden', 'A1'], [45, 'deshalb, sonst, dann, danach', 'Folge und Reihenfolge', 'A2'],
    [46, 'Nebensätze: weil, dass, wenn', 'Das Verb steht am Ende', 'A2'] ] },
  { t: 'Wörter und Wortbildung', ic: 'puzzle', h: 44, ch: [
    [47, 'Zusammengesetzte Nomen', 'der Regenschirm', 'A1'], [48, 'an sein, aus sein, weg sein', 'Kurze Verbformen', 'A1'],
    [49, 'Der, die oder das? Genusregeln', 'Endungen verraten den Artikel', 'A1'], [50, 'Modalpartikeln', 'denn, doch, mal', 'A2'],
    [51, 'Wortbildung mit Endungen', '-chen, -in, -ung …', 'A2'], [52, 'nicht, nichts, noch nicht, nicht mehr', 'Verneinung genau', 'B1'],
    [53, 'Ortsadverbien', 'oben, unten, nach oben', 'B1'] ] },
  { t: 'Verben 3', ic: 'layers', h: 4, ch: [
    [54, 'Präteritum', 'Er kam, sah und …', 'B1'], [55, 'Plusquamperfekt', 'Ich hatte geschlafen.', 'B1'],
    [56, 'Reflexivpronomen im Dativ', 'Ich wasche mir die Hände.', 'B1'], [57, 'Trennbar oder untrennbar?', 'einkaufen – bestellen', 'B1'],
    [58, 'Verben mit Präpositionen', 'sich freuen über', 'B1'], [59, 'dafür, daran, worauf …', 'Präpositionaladverbien', 'B1'],
    [60, 'Konjunktiv II: Formen', 'wäre, hätte, würde', 'B1'], [61, 'Konjunktiv II: Wünsche und Ratschläge', 'Wenn ich Zeit hätte …', 'B1'],
    [62, 'Passiv Präsens', 'Der Baum wird gepflanzt.', 'B1'], [63, 'Passiv in der Vergangenheit', 'wurde gebaut', 'B1'],
    [64, 'Futur I', 'Ich werde kommen.', 'B1'], [65, 'Die vielen Gesichter von werden', 'Verb, Futur, Passiv', 'B1'],
    [66, 'lassen', 'Ich lasse das Auto reparieren.', 'B1'], [67, 'stehen/stellen, liegen/legen …', 'Wo? und Wohin?', 'B1'] ] },
  { t: 'Nomen 2', ic: 'box', h: 300, ch: [
    [68, 'Der Genitiv', 'das Auto meines Vaters', 'B1'], [69, 'n-Deklination', 'den Herrn, dem Kunden', 'B1'],
    [70, 'Adjektive als Nomen', 'der Jugendliche, ein Jugendlicher', 'B1'], [71, 'alles Gute, etwas Neues', 'Adjektive nach alles, etwas', 'B1'] ] },
  { t: 'Sätze verbinden 2', ic: 'git-branch', h: 200, ch: [
    [72, 'Indirekte Fragen', 'Wissen Sie, ob …?', 'B1'], [73, 'Infinitiv mit zu', 'Es ist schön, zu …', 'B1'],
    [74, 'Infinitiv ohne zu', 'Ich höre ihn singen.', 'B1'], [75, 'Relativsätze', 'der Mann, der …', 'B1'],
    [76, 'Relativsätze mit Präposition', 'das Ding, mit dem …', 'B1'], [77, 'wenn und als', 'Zeit in Nebensätzen', 'B1'],
    [78, 'während, bevor, nachdem, seit', 'Was passiert wann?', 'B1'], [79, 'um … zu und damit', 'Ziele ausdrücken', 'B1'],
    [80, 'Zweiteilige Konnektoren', 'entweder … oder, weder … noch', 'B1'], [81, 'je … desto', 'Je mehr, desto besser.', 'B1'] ] },
  { t: 'Präpositionen 2', ic: 'navigation', h: 140, ch: [
    [82, 'Präpositionen mit Genitiv', 'wegen, trotz, während', 'B1'], [83, 'Zeitliche Präpositionen', 'innerhalb, vor, seit …', 'B1'] ] },
  { t: 'Adjektive 2', ic: 'sparkles', h: 350, ch: [
    [84, 'Adjektive ohne Artikel', 'frisches Brot, kaltes Wasser', 'B1'], [85, 'Partizip I als Adjektiv', 'ein lachendes Kind', 'B1'] ] },
  /* B2–C1: authored native lessons; source chapter numbers are metadata. */
  {"t":"Wortpositionen im Satz · B2","ic":"book-open","h":40,"adv":true,"lv":"B2","ch":[[86,"Verbposition in einfachen Sätzen","","B2"],[87,"Verbposition in Satzverbindungen","","B2"],[88,"Position von Dativ- und Akkusativobjekt","","B2"],[89,"Position der Angaben im Satz","","B2"],[90,"Informationen direkt zum Verb","","B2"],[91,"Position von nicht","","B2"]]},
  {"t":"Konjunktiv II · B2","ic":"book-open","h":40,"adv":true,"lv":"B2","ch":[[94,"Konjunktiv II der Gegenwart: Formen","","B2"],[95,"Konjunktiv II der Vergangenheit: Formen","","B2"],[96,"Höflichkeit, Vorschläge, Ratschläge und Vorwürfe","","B2"],[97,"Wünsche, irreale Wünsche und irreale Bedingungen","","B2"],[98,"Irreale Vergleiche und irreale Folgen","","B2"]]},
  {"t":"Passiv · B2","ic":"book-open","h":40,"adv":true,"lv":"B2","ch":[[99,"Passiv in allen Zeiten","","B2"],[100,"Passiv mit Modalverben in allen Zeiten","","B2"],[105,"Alternativen zum Passiv","","B2"]]},
  {"t":"Präpositionen · B2","ic":"book-open","h":40,"adv":true,"lv":"B2","ch":[[109,"Wechselpräpositionen","","B2"],[110,"Oft gebrauchte lokale Präpositionen","","B2"],[111,"Weitere lokale Präpositionen","","B2"],[112,"Die wichtigsten temporalen Präpositionen","","B2"],[113,"Weitere temporale Präpositionen","","B2"],[114,"Kausale Präpositionen","","B2"],[116,"Präpositionen mit verschiedenen Positionen","","B2"]]},
  {"t":"Ergänzungen · B2","ic":"book-open","h":40,"adv":true,"lv":"B2","ch":[[120,"Verben mit Nominativ, Akkusativ und Dativ","","B2"],[122,"Verben, Nomen und Adjektive mit Präpositionen","","B2"],[123,"Verben, Adjektive und Nomen mit festen Präpositionen mit Akkusativ","","B2"],[124,"Verben, Adjektive und Nomen mit festen Präpositionen mit Dativ","","B2"]]},
  {"t":"Zeiten · B2","ic":"book-open","h":40,"adv":true,"lv":"B2","ch":[[125,"Bildung der Vergangenheitszeiten","","B2"],[126,"Besondere Perfektformen: Modalverben und sehen, hören, lassen","","B2"],[127,"Gebrauch von Zeiten der Vergangenheit","","B2"],[128,"Vermutung und Zukunft mit dem Futur","","B2"]]},
  {"t":"Modalverben und Verbpräfixe · B2","ic":"book-open","h":40,"adv":true,"lv":"B2","ch":[[130,"Modalverben in der Grundbedeutung","","B2"],[131,"Modalverben: Vermutungen über die Gegenwart","","B2"],[133,"Das Verb lassen","","B2"],[134,"Trennbare und untrennbare Verben 1","","B2"]]},
  {"t":"Nomen, Artikel und Pronomen · B2","ic":"book-open","h":40,"adv":true,"lv":"B2","ch":[[136,"Genusregeln","","B2"],[137,"Artikelgebrauch","","B2"],[138,"Genitiv","","B2"],[139,"n-Deklination","","B2"],[140,"Drei Deklinationen","","B2"],[141,"Deklination der Indefinit- und Possessivpronomen","","B2"],[142,"Indefinitpronomen für Menschen","","B2"],[143,"Indefinitpronomen für Menschen und Dinge","","B2"]]},
  {"t":"Adjektive · B2","ic":"book-open","h":40,"adv":true,"lv":"B2","ch":[[144,"Adjektivdeklination","","B2"],[146,"Komparation","","B2"],[147,"Partizip I und II als Adjektiv","","B2"]]},
  {"t":"Indirekte Rede · B2","ic":"book-open","h":40,"adv":true,"lv":"B2","ch":[[148,"Indirekte Rede und Konjunktiv I","","B2"],[149,"Indirekte Rede: Vergangenheit","","B2"]]},
  {"t":"Nebensätze · B2","ic":"book-open","h":40,"adv":true,"lv":"B2","ch":[[151,"Temporale Nebensätze","","B2"],[152,"Kausale und konzessive Nebensätze","","B2"],[153,"Konsekutive Nebensätze","","B2"],[154,"Konditionale und adversative Nebensätze","","B2"],[155,"Modale Nebensätze: Methode","","B2"],[156,"Infinitiv mit und ohne zu","","B2"],[157,"Nebensatz mit dass und Infinitiv mit zu","","B2"],[158,"Finale und modale Infinitiv- und Nebensätze","","B2"],[159,"Relativpronomen im Nominativ, Akkusativ und Dativ","","B2"],[160,"Relativpronomen im Genitiv","","B2"],[161,"Relativpronomen mit w- und als","","B2"]]},
  {"t":"Wörter und Wortverbindungen · B2","ic":"book-open","h":40,"adv":true,"lv":"B2","ch":[[162,"Doppelkonnektoren","","B2"],[163,"Negationswörter","","B2"],[164,"Irgend…","","B2"],[165,"Position und Direktion","","B2"],[166,"Es","","B2"],[167,"Funktionsverbgefüge 1","","B2"],[169,"Wörter mit da-","","B2"],[170,"Modalpartikeln","","B2"]]},
  {"t":"Schreiben und Sprechen · B2","ic":"book-open","h":40,"adv":true,"lv":"B2","ch":[[176,"Kommaregeln","","B2"]]},
  {"t":"Wortpositionen im Satz · C1","ic":"book-open","h":160,"adv":true,"lv":"C1","ch":[[401,"Verbposition in einfachen Sätzen","","C1"],[407,"Position von auch und Fokuspartikeln","","C1"],[408,"Informationsverteilung im Satz","","C1"]]},
  {"t":"Konjunktiv II · C1","ic":"book-open","h":160,"adv":true,"lv":"C1","ch":[[410,"Konjunktiv II der Vergangenheit: Formen","","C1"],[412,"Wünsche, irreale Wünsche und irreale Bedingungen","","C1"],[413,"Irreale Vergleiche und irreale Folgen","","C1"]]},
  {"t":"Passiv · C1","ic":"book-open","h":160,"adv":true,"lv":"C1","ch":[[414,"Passiv in allen Zeiten","","C1"],[415,"Passiv mit Modalverben in allen Zeiten","","C1"],[417,"Formen mit Passivbedeutung","","C1"],[418,"Passivsätze ohne Subjekt","","C1"],[419,"Wann ist Passiv möglich, wann nicht?","","C1"]]},
  {"t":"Präpositionen · C1","ic":"book-open","h":160,"adv":true,"lv":"C1","ch":[[426,"Präpositionen der Redewiedergabe und Referenz","","C1"],[427,"Präpositionen mit verschiedenen Positionen","","C1"],[428,"„Sprechende“ Präpositionen","","C1"],[429,"Bedeutungen von in, an, auf, über, unter, vor","","C1"],[430,"Bedeutungen von um, bei, von, nach, aus, mit, zu","","C1"]]},
  {"t":"Ergänzungen · C1","ic":"book-open","h":160,"adv":true,"lv":"C1","ch":[[431,"Verben mit Nominativ, Akkusativ und Dativ","","C1"],[432,"Verben mit Genitiv","","C1"]]},
  {"t":"Zeiten · C1","ic":"book-open","h":160,"adv":true,"lv":"C1","ch":[[437,"Besondere Perfektformen: Modalverben und sehen, hören, lassen","","C1"],[439,"Vermutung und Zukunft mit dem Futur","","C1"],[440,"Überblick über die Zeiten im Deutschen","","C1"]]},
  {"t":"Modalverben und Verbpräfixe · C1","ic":"book-open","h":160,"adv":true,"lv":"C1","ch":[[441,"Modalverben in der Grundbedeutung","","C1"],[443,"Modalverben: Vermutungen über die Vergangenheit","","C1"],[445,"Trennbare und untrennbare Verben 1","","C1"],[446,"Trennbare und untrennbare Verben 2","","C1"]]},
  {"t":"Nomen, Artikel und Pronomen · C1","ic":"book-open","h":160,"adv":true,"lv":"C1","ch":[[449,"Genitiv","","C1"],[453,"Indefinitpronomen für Menschen","","C1"]]},
  {"t":"Adjektive · C1","ic":"book-open","h":160,"adv":true,"lv":"C1","ch":[[456,"Artikelwörter und Adjektivdeklination","","C1"],[457,"Komparation","","C1"]]},
  {"t":"Indirekte Rede · C1","ic":"book-open","h":160,"adv":true,"lv":"C1","ch":[[461,"Wiedergabe von Aufforderungen, Gerüchten und Selbstaussagen","","C1"]]},
  {"t":"Nebensätze · C1","ic":"book-open","h":160,"adv":true,"lv":"C1","ch":[[463,"Kausale und konzessive Nebensätze","","C1"],[464,"Konsekutive Nebensätze","","C1"],[465,"Konditionale und adversative Nebensätze","","C1"],[466,"Modale Nebensätze: Methode","","C1"],[467,"Infinitiv mit und ohne zu","","C1"],[468,"Nebensatz mit dass und Infinitiv mit zu","","C1"],[471,"Relativpronomen im Genitiv","","C1"],[472,"Relativpronomen mit w- und als","","C1"]]},
  {"t":"Wörter und Wortverbindungen · C1","ic":"book-open","h":160,"adv":true,"lv":"C1","ch":[[473,"Doppelkonnektoren","","C1"],[479,"Funktionsverbgefüge 2","","C1"]]},
  {"t":"Sätze umformen · C1","ic":"book-open","h":160,"adv":true,"lv":"C1","ch":[[482,"Nominalisierung","","C1"],[483,"Links- und Rechtsattribute","","C1"],[484,"Präposition – Adverb – Konnektor: temporal","","C1"],[485,"Präposition – Adverb – Konnektor: kausal, konsekutiv, konzessiv, adversativ","","C1"],[486,"Präposition – Adverb – Konnektor: modal, konditional, final","","C1"]]},
  {"t":"Schreiben und Sprechen · C1","ic":"book-open","h":160,"adv":true,"lv":"C1","ch":[[488,"Besondere Formen der mündlichen Sprache","","C1"]]},
  {"t":"Nachschlagen und trainieren","ic":"library","h":40,"ref":true,"ch":[[101,"Unregelmäßige Verben","Präteritum, Partizip, haben oder sein – mit Trainer","Liste"],[102,"Verben mit Dativ","helfen, danken, gefallen … – mit Trainer","Liste"],[103,"Verben mit Dativ und Akkusativ","jemandem etwas geben … – mit Trainer","Liste"],[104,"Verben mit Präpositionen","warten auf, denken an … – mit Trainer","Liste"],[180,"Begriffe und Synonyme","","Liste"],[181,"Wortpositionen im Satz: Gesamtschema","","Liste"],[182,"Präpositionen mit Akkusativ, Dativ und Genitiv","","Liste"],[183,"Verben, Adjektive und Nomen: nach Präpositionen","","Liste"],[184,"Verben, Adjektive und Nomen: alphabetisch","","Liste"],[185,"Dativ, Genitiv und zwei Akkusative","","Liste"],[186,"Unregelmäßige Verben: nach Vokalen","","Liste"],[187,"Unregelmäßige Verben: alphabetisch","","Liste"]]}
];
const B2C1_READY = [86,401,87,88,89,90,91,407,408,94,95,410,96,97,412,98,413,99,414,100,415,105,417,418,419,109,110,111,112,113,114,426,116,427,428,429,430,120,431,432,122,123,124,125,126,437,127,128,439,440,130,441,131,443,133,187];   // B2–C1 grammar chapters that are finished
const READY = Object.fromEntries([...B2C1_READY, ...Array.from({ length: 85 }, (_, i) => i + 1), 101, 102, 103, 104, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273].map(n => [n, 1]));   // chapters that exist so far
const TOTAL = GROUPS.reduce((s, g) => s + (g.ref || g.vocab ? 0 : g.ch.length), 0);
/* level gating: a learner enrolled at level X sees chapters up to X; no level = everything open */
const LVS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const myLevel = () => (window.KONTO && KONTO.level && KONTO.level()) || null;
const chLevel = n => { for (const g of GROUPS) for (const c of g.ch) if (c[0] === n) return c[3]; return null; };
const lvOpen = l => !!(window.KONTO && KONTO.profile() && (LVS.includes(l) ? KONTO.canOpen(l) : KONTO.profile().role !== 'learner' || KONTO.unlocked().length));
const allowed = n => lvOpen(chLevel(n));
const topicNo = n => n > 260 ? n - 260 : n > 240 ? n - 240 : n > 220 ? n - 220 : n - 200;
const en = () => !!(window.KONTO && KONTO.lang && KONTO.lang() === 'en');
const lockBtn = l => window.KONTO && KONTO.lockSheet ? `<button class="btn sm gr-unl" data-unlock="${l}">${icn(KONTO.lvState(l) === 'pending' ? 'hourglass' : 'lock-open')} ${KONTO.lvState(l) === 'pending' ? (en() ? 'Requested' : 'Angefragt') : KONTO.org && KONTO.org() ? (en() ? 'Ask my teacher' : 'Lehrkraft fragen') : (en() ? 'Enroll' : 'Einschreiben')}</button>` : '';
const isRef = n => !!chInfo(n)?.g.ref;                       // the four reference lists
const SOURCE_NO = {"86":1,"87":2,"88":3,"89":4,"90":5,"91":6,"94":9,"95":10,"96":11,"97":12,"98":13,"99":14,"100":15,"105":16,"109":20,"110":21,"111":22,"112":23,"113":24,"114":25,"116":27,"120":31,"122":33,"123":34,"124":35,"125":36,"126":37,"127":38,"128":39,"130":41,"131":42,"133":44,"134":45,"136":47,"137":48,"138":49,"139":50,"140":51,"141":52,"142":53,"143":54,"144":55,"146":57,"147":58,"148":59,"149":60,"151":62,"152":63,"153":64,"154":65,"155":66,"156":67,"157":68,"158":69,"159":70,"160":71,"161":72,"162":73,"163":74,"164":75,"165":76,"166":77,"167":78,"169":80,"170":81,"176":87,"401":1,"407":7,"408":8,"410":10,"412":12,"413":13,"414":14,"415":15,"417":17,"418":18,"419":19,"426":26,"427":27,"428":28,"429":29,"430":30,"431":31,"432":32,"437":37,"439":39,"440":40,"441":41,"443":43,"445":45,"446":46,"449":49,"453":53,"456":56,"457":57,"461":61,"463":63,"464":64,"465":65,"466":66,"467":67,"468":68,"471":71,"472":72,"473":73,"479":79,"482":82,"483":83,"484":84,"485":85,"486":86,"488":88};
const gNo = n => SOURCE_NO[n] || n;              // B2–C1 chapters 105–177 are shown as 101–173
const numLabel = n => isV(n) ? String(topicNo(n)) : isRef(n) ? icn('book-marked') : String(gNo(n));
const chInfo = n => { for (const g of GROUPS) for (const c of g.ch) if (c[0] === n) return { g, c }; return null; };

/* ---------- styles ---------- */
const CSS = `
:root{--nom:#b8730a;--nom-s:#fcf0d9;--dat:#7c3aed;--dat-s:#f1eafe;--akk:#0b8579;--akk-s:#dcf3ef;
  --cream:#fbf4e3;--cream-b:#ecdcb8;--cream-ink:#5a4626;--sky1:#fdf1d6;--sky2:#f9e2bd;--sun:#f6b94a;--cloud:#fffaf0;
  --hill1:#a9cf8f;--hill2:#cde3a8;--skin1:#8a5a3c;--skin2:#a86f48;--hair1:#f2efe9;--hair2:#2b1d16;--pants:#3d4656;--ink:#2a2f38;
  --skin3:#c48a5a;--skin3b:#d9a274;--skin4:#f1cfae;--skin4b:#f6dcc2;--hair3:#8a5a2b;--hair4:#e3b04b;--wall:#fbefd8;--floor:#e7c99a;--wood:#b07a46;--metal:#9aa6b4}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--nom:#f2b450;--nom-s:#382a12;--dat:#b79bff;--dat-s:#2a1f47;--akk:#4fd1c0;--akk-s:#11332f;
  --cream:#1e1b15;--cream-b:#3a3223;--cream-ink:#e3d3b2;--sky1:#1e2638;--sky2:#2d2f45;--sun:#e8c46a;--cloud:#3a4258;
  --hill1:#2f4a35;--hill2:#3a5a3f;--skin1:#7a4e33;--skin2:#93603f;--hair1:#e7e3db;--hair2:#140d09;--pants:#1c222d;--ink:#e8ecf2;--skin3:#a8754b;--skin3b:#bb8758;--skin4:#d9b391;--skin4b:#e3c3a5;--hair3:#6e4520;--hair4:#c9973a;--wall:#232634;--floor:#3a3127;--wood:#7d5631;--metal:#5d6876}}
:root[data-theme="dark"]{--nom:#f2b450;--nom-s:#382a12;--dat:#b79bff;--dat-s:#2a1f47;--akk:#4fd1c0;--akk-s:#11332f;
  --cream:#1e1b15;--cream-b:#3a3223;--cream-ink:#e3d3b2;--sky1:#1e2638;--sky2:#2d2f45;--sun:#e8c46a;--cloud:#3a4258;
  --hill1:#2f4a35;--hill2:#3a5a3f;--skin1:#7a4e33;--skin2:#93603f;--hair1:#e7e3db;--hair2:#140d09;--pants:#1c222d;--ink:#e8ecf2;--skin3:#a8754b;--skin3b:#bb8758;--skin4:#d9b391;--skin4b:#e3c3a5;--hair3:#6e4520;--hair4:#c9973a;--wall:#232634;--floor:#3a3127;--wood:#7d5631;--metal:#5d6876}
.cs{border-radius:.35em;padding:0 .22em;box-decoration-break:clone;-webkit-box-decoration-break:clone;font-weight:600}
.cs.n{background:var(--nom-s);color:var(--nom);box-shadow:inset 0 -2px 0 var(--nom)}
.cs.d{background:var(--dat-s);color:var(--dat);box-shadow:inset 0 -2px 0 var(--dat)}
.cs.a{background:var(--akk-s);color:var(--akk);box-shadow:inset 0 -2px 0 var(--akk)}
#view a.btn,.gr-pop a.btn{text-decoration:none}
.gr-ue[data-type=cases] .gr-ib{line-height:2.75}
.gr-toc{scrollbar-width:none}.gr-toc::-webkit-scrollbar{display:none}
.gw{cursor:pointer;border-radius:.2em;transition:background .12s}
.gw:hover{background:color-mix(in srgb,var(--ac) 14%,transparent)}
.gr-eyebrow{font-size:.74rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--mut);margin:0 0 .35rem}
.gr-lv{display:inline-block;font-size:.7rem;font-weight:700;padding:.12rem .45rem;border-radius:999px;letter-spacing:.03em}
.gr-lv.Liste{background:var(--line2);color:var(--mut)}
.gr-lv.A1{background:#e3f4ea;color:#0f7a4f}.gr-lv.A2{background:#e6eefe;color:#1d5bd6}.gr-lv.B1{background:#f6e8fd;color:#8b2fc9}.gr-lv.B2{background:#fdeee3;color:#b4520f}.gr-lv.C1{background:#fde7ea;color:#b4233c}
.gr-acc.locked{border:1px dashed var(--line);border-radius:1rem;margin:0 0 .6rem;background:var(--panel)}.gr-acc.locked .gr-lockrow{display:flex;align-items:center;gap:.6rem;padding:.75rem .9rem;flex-wrap:wrap;opacity:.9}
.gr-acc.locked .gr-gt{color:var(--mut)}.gr-acc.locked small{color:var(--mut)}.gr-lockrow .gr-unl{margin-left:auto}.gr-chip .lic{width:.8em;height:.8em;margin-right:.15rem;vertical-align:-1px}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]) .gr-lv.A1{background:#12301f;color:#5fd69b}:root:not([data-theme="light"]) .gr-lv.A2{background:#16233a;color:#7fb0ff}:root:not([data-theme="light"]) .gr-lv.B1{background:#2a1838;color:#d29bf5}:root:not([data-theme="light"]) .gr-lv.B2{background:#33210f;color:#f3a76b}:root:not([data-theme="light"]) .gr-lv.C1{background:#361620;color:#f58a9c}}
:root[data-theme="dark"] .gr-lv.A1{background:#12301f;color:#5fd69b}:root[data-theme="dark"] .gr-lv.A2{background:#16233a;color:#7fb0ff}:root[data-theme="dark"] .gr-lv.B1{background:#2a1838;color:#d29bf5}:root[data-theme="dark"] .gr-lv.B2{background:#33210f;color:#f3a76b}:root[data-theme="dark"] .gr-lv.C1{background:#361620;color:#f58a9c}
/* overview */
.gr-top{display:grid;grid-template-columns:1.25fr 1fr;gap:1.2rem;align-items:center;background:var(--cream);border:1px solid var(--cream-b);border-radius:1.5rem;padding:1.6rem 1.7rem;margin:.3rem 0 1.2rem;overflow:hidden}
.gr-top h1{font-family:Fraunces,serif;font-weight:700;font-size:2.4rem;letter-spacing:-.02em;margin:0 0 .5rem;line-height:1.05;color:var(--fg)}
.gr-top p{margin:0;color:var(--cream-ink);font-size:1rem;max-width:30rem}
.gr-top .gr-stats{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1rem}
.gr-stat{background:var(--card);border:1px solid var(--cream-b);border-radius:.8rem;padding:.45rem .7rem;font-size:.8rem;color:var(--mut)}
.gr-stat b{color:var(--fg);font-size:1rem;margin-right:.2rem}
.gr-topart svg{width:100%;height:auto;display:block}
.gr-feat{display:flex;gap:1rem;align-items:center;text-decoration:none;color:inherit;background:var(--card);border:1px solid var(--line);border-radius:1.2rem;padding:.8rem;box-shadow:var(--shadow);margin-bottom:1.4rem;transition:transform .15s}
.gr-feat:hover{transform:translateY(-2px)}
.gr-feat .th{flex:0 0 9.5rem;border-radius:.8rem;overflow:hidden;line-height:0}
.gr-feat .th svg{width:100%;height:auto}
.gr-feat b{font-family:Fraunces,serif;font-size:1.25rem;display:block;margin:.15rem 0 .2rem}
.gr-feat p{margin:0;color:var(--mut);font-size:.9rem}
.gr-filter{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;margin:0 0 1rem}
.gr-chip{border:1px solid var(--line);background:var(--card);color:var(--mut);font-weight:600;font-size:.8rem;padding:.38rem .8rem;border-radius:999px}
.gr-chip.on{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.gr-filter input{flex:1 1 12rem;min-width:0;border:1px solid var(--line);background:var(--card);color:var(--fg);border-radius:999px;padding:.45rem .9rem;font:inherit;font-size:.9rem}
.gr-grp{margin:0 0 1.5rem}
.gr-grp h2{display:flex;align-items:center;gap:.6rem;font-family:Fraunces,serif;font-weight:600;font-size:1.25rem;margin:0 0 .65rem}
.gr-grp h2 small{font-family:Inter,sans-serif;font-size:.78rem;color:var(--faint);font-weight:500;margin-left:auto}
.gr-grp .badge{width:2.1rem;height:2.1rem;font-size:1rem;border-radius:.7rem}
.gr-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(15.5rem,1fr));gap:.55rem}
.gr-card{display:flex;align-items:center;gap:.7rem;padding:.7rem .8rem;border:1px solid var(--line);background:var(--card);border-radius:.9rem;text-decoration:none;color:inherit;position:relative}
.gr-card .gr-num{font-family:Fraunces,serif;font-weight:700;font-size:1.25rem;color:hsl(var(--h) 55% 50%);width:2rem;text-align:center;flex:0 0 auto}
.gr-card .gr-ct{flex:1;min-width:0}.gr-card .gr-ct b{display:block;font-size:.9rem;line-height:1.25}
.gr-card .gr-ct small{display:block;color:var(--mut);font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gr-card.soon{opacity:.55}.gr-card.soon .gr-lv{filter:grayscale(.5)}
.gr-card.ready{border-color:color-mix(in srgb,var(--ac) 45%,var(--line));box-shadow:0 0 0 3px var(--ac-salt);transition:transform .15s}
.gr-card.ready:hover{transform:translateY(-2px)}
.gr-tagr{position:absolute;top:-.55rem;right:.6rem;background:var(--ac);color:#fff;font-size:.62rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:.12rem .45rem;border-radius:999px}
.gr-done{color:var(--ok);display:inline-flex}
/* chapter */
.gr-hero{display:grid;grid-template-columns:1fr 1.05fr;gap:1.4rem;align-items:center;margin:.2rem 0 1rem}
.gr-hero h1{font-family:Fraunces,serif;font-weight:700;font-size:2.25rem;line-height:1.08;letter-spacing:-.02em;margin:.1rem 0 .25rem}
.gr-kick{font-family:Newsreader,serif;font-style:italic;font-size:1.35rem;color:var(--mut);margin:0 0 .8rem}
.gr-intro{font-size:1rem;margin:0 0 1rem}
.gr-art{margin:0;background:var(--cream);border:1px solid var(--cream-b);border-radius:1.4rem;overflow:hidden;box-shadow:var(--shadow)}
.gr-art svg{display:block;width:100%;height:auto}
.gr-art figcaption{display:flex;align-items:center;gap:.6rem;justify-content:center;padding:.75rem 1rem .9rem;font-family:Newsreader,serif;font-size:1.3rem;text-align:center;flex-wrap:wrap}
.gr-say{border:1px solid var(--line);background:var(--card);color:var(--mut);width:34px;height:34px;border-radius:50%;display:inline-grid;place-items:center;flex:0 0 auto;vertical-align:middle}
.gr-say:hover{color:var(--ac);border-color:var(--ac)}
.gr-prog{display:flex;align-items:center;gap:.7rem;font-size:.86rem;color:var(--mut)}
.gr-prog svg{flex:0 0 auto}
.gr-prog b{color:var(--fg)}
.gr-toc{position:sticky;top:58px;z-index:20;display:flex;gap:.35rem;overflow:auto;padding:.55rem 0;margin:0 0 .6rem;background:var(--bg);border-bottom:1px solid var(--line)}
.gr-toc a{white-space:nowrap;text-decoration:none;font-size:.82rem;font-weight:600;color:var(--mut);padding:.32rem .75rem;border-radius:999px;border:1px solid var(--line);background:var(--card);display:inline-flex;gap:.35rem;align-items:center}
.gr-toc a:hover{color:var(--fg)}
.gr-sec{scroll-margin-top:110px;margin:1.6rem 0 0}
.gr-sec>h2{cursor:pointer;display:flex;align-items:center;gap:.6rem;font-family:Fraunces,serif;font-weight:600;font-size:1.55rem;margin:0 0 .9rem}
.gr-sec>h2 .gr-sn{width:2rem;height:2rem;border-radius:.65rem;display:grid;place-items:center;background:var(--fg);color:var(--bg);font-family:Inter,sans-serif;font-size:.95rem;font-weight:700}
.gr-cream{background:var(--cream);border:1px solid var(--cream-b);border-radius:1.2rem;padding:1.15rem 1.2rem;margin:0 0 .9rem;color:var(--fg)}
.gr-cream h3{font-family:Fraunces,serif;font-weight:600;font-size:1.12rem;margin:0 0 .75rem;color:var(--cream-ink)}
.gr-q3{display:grid;grid-template-columns:repeat(3,1fr);gap:.65rem}
.gr-qc{background:var(--card);border-radius:1rem;padding:.85rem .9rem;border-top:4px solid var(--c);box-shadow:var(--shadow)}
.gr-qc.n{--c:var(--nom);--cs:var(--nom-s)}.gr-qc.d{--c:var(--dat);--cs:var(--dat-s)}.gr-qc.a{--c:var(--akk);--cs:var(--akk-s)}
.gr-qi{width:2.2rem;height:2.2rem;border-radius:.7rem;display:grid;place-items:center;background:var(--cs);color:var(--c);font-size:1.1rem;float:right}
.gr-qq{display:block;font-family:Fraunces,serif;font-size:1.6rem;line-height:1.1;color:var(--c)}
.gr-qk{font-size:.72rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--c)}
.gr-qc p{margin:.45rem 0 0;font-size:.9rem}.gr-qc .gr-qex{font-family:Newsreader,serif;font-size:1.05rem;color:var(--mut)}
.gr-slots{display:flex;flex-wrap:wrap;gap:.45rem;align-items:flex-start;margin:0 0 .9rem}
.gr-slot{display:flex;flex-direction:column;align-items:center;gap:.3rem}
.gr-slot>span{font-family:Newsreader,serif;font-size:1.2rem;padding:.4rem .75rem;border-radius:.7rem;background:var(--card);border:1.5px solid var(--line);white-space:nowrap}
.gr-slot small{font-size:.7rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--mut)}
.gr-slot.n>span{border-color:var(--nom);background:var(--nom-s);color:var(--nom)}.gr-slot.n small{color:var(--nom)}
.gr-slot.d>span{border-color:var(--dat);background:var(--dat-s);color:var(--dat)}.gr-slot.d small{color:var(--dat)}
.gr-slot.a>span{border-color:var(--akk);background:var(--akk-s);color:var(--akk)}.gr-slot.a small{color:var(--akk)}
.gr-slot.v>span{background:var(--fg);color:var(--bg);border-color:var(--fg);font-weight:600}
.gr-pair{display:flex;flex-direction:column;align-items:stretch}
.gr-pair>.gr-pairin{display:flex;gap:.45rem}
.gr-pair>.gr-give{display:flex;align-items:center;justify-content:center;gap:.3rem;font-size:.74rem;color:var(--mut);margin-top:.15rem}
.gr-pair>.gr-give svg{width:7.5rem;height:1.4rem}
.gr-cream .gr-foot{font-size:.9rem;margin:.2rem 0 0;color:var(--cream-ink)}
.gr-tsw{display:flex;gap:.3rem;margin:0 0 .7rem;flex-wrap:wrap}
.gr-tbl{width:100%;border-collapse:separate;border-spacing:0;background:var(--card);border-radius:.9rem;overflow:hidden;border:1px solid var(--cream-b);font-size:.95rem}
.gr-tbl th,.gr-tbl td{padding:.5rem .6rem;text-align:left;border-bottom:1px solid var(--line2)}
.gr-tbl thead th{font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);font-weight:700;background:var(--panel)}
.gr-tbl tbody th{font-size:.8rem;font-weight:700;white-space:nowrap}
.gr-tbl tr:last-child td,.gr-tbl tr:last-child th{border-bottom:0}
.gr-tbl tr.n th{color:var(--nom)}.gr-tbl tr.a th{color:var(--akk)}.gr-tbl tr.d th{color:var(--dat)}
.gr-tbl td{font-family:Newsreader,serif;font-size:1.08rem}
.gr-tbl td .art{font-weight:600}
.gr-tbl .ls{display:none}
@media(max-width:560px){.gr-tbl .lf{display:none}.gr-tbl .ls{display:inline}.gr-tbl:not(.gr-grid) td{font-size:.9rem;padding:.4rem .2rem;line-height:1.25}.gr-tbl:not(.gr-grid) th{padding:.4rem .3rem}.gr-tbl:not(.gr-grid) thead th{font-size:.6rem;letter-spacing:.02em}}
.gr-tbl tr.a td .art.chg{color:var(--akk);background:var(--akk-s);border-radius:.3em;padding:0 .2em}
.gr-tbl tr.d td .art.chg{color:var(--dat);background:var(--dat-s);border-radius:.3em;padding:0 .2em}
.plusn{color:var(--dat);text-decoration:underline;text-underline-offset:3px}
.gr-tblw{overflow-x:auto}
.gr-merk{display:flex;gap:.8rem;align-items:center;background:var(--fg);color:var(--bg);border-radius:1.1rem;padding:1rem 1.15rem;margin:0 0 .9rem}
.gr-merk .ico{font-size:1.4rem;color:var(--sun)}
.gr-merk p{margin:0;font-family:Newsreader,serif;font-size:1.25rem}
.gr-merk small{display:block;font-family:Inter,sans-serif;font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.65}
.gr-merk .cs.n,.gr-merk .cs.d,.gr-merk .cs.a{background:transparent}
.gr-mach .gr-msw{display:flex;gap:.5rem;flex-wrap:wrap;margin:0 0 1rem}
.gr-tg{display:inline-flex;align-items:center;gap:.5rem;border:1.5px solid var(--line);background:var(--card);color:var(--fg);border-radius:999px;padding:.35rem .4rem .35rem .8rem;font-size:.86rem;font-weight:600}
.gr-tg i.k{width:2.1rem;height:1.2rem;border-radius:999px;background:var(--line);position:relative;transition:background .2s}
.gr-tg i.k::after{content:'';position:absolute;left:.15rem;top:.15rem;width:.9rem;height:.9rem;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 1px 2px rgba(0,0,0,.25)}
.gr-tg.on.d i.k{background:var(--dat)}.gr-tg.on.a i.k{background:var(--akk)}
.gr-tg.on i.k::after{transform:translateX(.9rem)}
.gr-msent{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center;font-family:Newsreader,serif;font-size:1.5rem;min-height:3.2rem;padding:.6rem .2rem}
.gr-msent .w{display:inline-block;padding:.15rem .55rem;border-radius:.6rem;transition:transform .45s cubic-bezier(.3,1.4,.5,1),background .3s}
.gr-msent .w.d{background:var(--dat-s);color:var(--dat);box-shadow:inset 0 -2px 0 var(--dat)}
.gr-msent .w.a{background:var(--akk-s);color:var(--akk);box-shadow:inset 0 -2px 0 var(--akk)}
.gr-mrule{display:flex;gap:.5rem;align-items:flex-start;font-size:.95rem;background:var(--card);border-radius:.8rem;padding:.6rem .8rem;margin:.2rem 0 0;color:var(--fg)}
.gr-mrule .lic{color:var(--ac);margin-top:.15rem}
.gr-verbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(14rem,1fr));gap:.5rem}
.gr-verb{background:var(--card);border-radius:.85rem;padding:.6rem .75rem;border:1px solid var(--cream-b)}
.gr-verb b{display:block;font-size:.98rem}
.gr-verb span.ex{font-family:Newsreader,serif;font-size:1rem;color:var(--mut)}
.gr-pat{font-family:Newsreader,serif;font-style:italic;color:var(--cream-ink);margin:-.4rem 0 .7rem}
.gr-note{display:flex;gap:.7rem;border-left:4px solid var(--warn);background:color-mix(in srgb,var(--warn) 9%,var(--card));border-radius:.4rem .9rem .9rem .4rem;padding:.8rem 1rem;margin:0 0 .9rem}
.gr-note .lic{color:var(--warn);font-size:1.2rem;margin-top:.1rem}
.gr-note p{margin:0}.gr-note b.t{display:block;margin-bottom:.15rem}
.gr-exs{list-style:none;margin:0;padding:0;display:grid;gap:.45rem}
.gr-exs li{display:flex;gap:.7rem;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:.9rem;padding:.55rem .7rem}
.gr-exs .s{font-family:Newsreader,serif;font-size:1.22rem;flex:1;line-height:1.5}
.gr-legend{display:flex;gap:.9rem;flex-wrap:wrap;font-size:.8rem;color:var(--mut);margin:0 0 .7rem}
.gr-legend span::before{content:'';display:inline-block;width:.7rem;height:.7rem;border-radius:.2rem;margin-right:.35rem;vertical-align:-.05rem;background:var(--c)}
.gr-legend .n{--c:var(--nom)}.gr-legend .d{--c:var(--dat)}.gr-legend .a{--c:var(--akk)}
.gr-tip{font-size:.82rem;color:var(--faint);margin:.5rem 0 0;display:flex;gap:.35rem;align-items:center}
/* exercises */
.gr-ue{background:var(--card);border:1px solid var(--line);border-radius:1.2rem;box-shadow:var(--shadow);padding:1.1rem 1.15rem;margin:0 0 1rem}
.gr-ueh{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap}
.gr-uen{font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ac);background:var(--ac-salt);padding:.18rem .5rem;border-radius:999px}
.gr-ueh h3{margin:0;font-family:Fraunces,serif;font-weight:600;font-size:1.2rem}
.gr-ueb{margin-left:auto;font-size:.76rem;font-weight:700;padding:.2rem .55rem;border-radius:999px;display:inline-flex;gap:.3rem;align-items:center}
.gr-ueb.pass{background:color-mix(in srgb,var(--ok) 15%,var(--card));color:var(--ok)}
.gr-ueb.fail{background:color-mix(in srgb,var(--warn) 15%,var(--card));color:var(--warn)}
.gr-ueb.free{background:var(--line2);color:var(--mut)}
.gr-uei{color:var(--mut);font-size:.9rem;margin:.45rem 0 .8rem}
.gr-it{display:flex;gap:.6rem;align-items:flex-start;padding:.6rem 0;border-top:1px dashed var(--line)}
.gr-it:first-child{border-top:0}
.gr-in{flex:0 0 1.6rem;height:1.6rem;border-radius:50%;display:grid;place-items:center;font-size:.75rem;font-weight:700;color:var(--mut);background:var(--line2);margin-top:.2rem;transition:.2s}
.gr-it.ok .gr-in{background:var(--ok);color:#fff}.gr-it.no .gr-in{background:var(--bad);color:#fff}
.gr-ib{flex:1;min-width:0;font-family:Newsreader,serif;font-size:1.2rem;line-height:1.85}
.gr-sol{font-family:Inter,sans-serif;font-size:.84rem;color:var(--ok);margin-top:.2rem;line-height:1.4}
.gr-sol.bad{color:var(--bad)}
.gr-tag{font:inherit;border:1.5px dashed var(--faint);background:transparent;color:var(--fg);border-radius:.5rem;padding:0 .35rem;line-height:1.5;position:relative;transition:background .15s,border-color .15s}
.gr-tag[data-st="n"]{border:1.5px solid var(--nom);background:var(--nom-s);color:var(--nom)}
.gr-tag[data-st="d"]{border:1.5px solid var(--dat);background:var(--dat-s);color:var(--dat)}
.gr-tag[data-st="a"]{border:1.5px solid var(--akk);background:var(--akk-s);color:var(--akk)}
.gr-tag[data-st]:not([data-st=""])::after{content:attr(data-lb);position:absolute;left:50%;top:-.95rem;transform:translateX(-50%);font:700 .58rem Inter,sans-serif;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}
.gr-gap{display:inline-flex;flex-wrap:wrap;gap:.2rem;vertical-align:middle;margin:0 .1rem;max-width:100%}
.gr-gap button{max-width:100%;white-space:normal;text-align:left;overflow-wrap:anywhere}
.gr-gap button{font:inherit;font-size:1rem;border:1.5px solid var(--line);background:var(--panel);color:var(--fg);border-radius:.5rem;padding:0 .45rem;line-height:1.55}
.gr-gap button.sel{border-color:var(--ac);background:var(--ac);color:#fff}
.gr-gap button.right{border-color:var(--ok);background:var(--ok);color:#fff}
.gr-gap button.wrong{border-color:var(--bad);background:color-mix(in srgb,var(--bad) 14%,var(--card));color:var(--bad);text-decoration:line-through}
.gr-line{min-height:2.6rem;display:flex;flex-wrap:wrap;gap:.35rem;align-items:center;border-bottom:2px solid var(--line);padding:.2rem 0 .35rem;margin-bottom:.45rem}
.gr-line:empty::before{content:'Tippe die Teile unten an …';font:italic .9rem Inter,sans-serif;color:var(--faint)}
.gr-pool{display:flex;flex-wrap:wrap;gap:.35rem}
.gr-tile{font:inherit;font-size:1.05rem;border:1.5px solid var(--line);background:var(--panel);color:var(--fg);border-radius:.6rem;padding:.12rem .6rem;box-shadow:0 2px 0 var(--line)}
.gr-tile:active{transform:translateY(1px);box-shadow:none}
.gr-line .gr-tile{background:var(--ac-salt);border-color:color-mix(in srgb,var(--ac) 40%,var(--line))}
.gr-end{font-size:1.2rem}
.gr-q{font-size:1.05rem;color:var(--mut);margin-bottom:.25rem}
.gr-q mark{background:var(--ac-salt);color:var(--ac);border-radius:.3em;padding:0 .2em}
.gr-tl{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap}
.gr-tl input,.gr-free textarea{font:inherit;font-size:1.1rem;flex:1 1 10rem;min-width:0;border:1.5px solid var(--line);background:var(--panel);color:var(--fg);border-radius:.6rem;padding:.25rem .6rem}
.gr-tl input:focus,.gr-free textarea:focus{outline:none;border-color:var(--ac);box-shadow:0 0 0 3px var(--ac-salt)}
.gr-free textarea{width:100%;resize:vertical;min-height:2.8rem;font-family:Newsreader,serif}
.gr-fb{font-family:Inter,sans-serif;font-size:.86rem;margin-top:.35rem;line-height:1.45}
.gr-fb .e{display:block;color:var(--bad)}.gr-fb .h{display:block;color:var(--warn)}.gr-fb .k{display:block;color:var(--ok)}
.gr-uef{display:flex;gap:.45rem;align-items:center;flex-wrap:wrap;margin-top:.8rem;padding-top:.8rem;border-top:1px solid var(--line)}
.gr-res{font-size:.9rem;font-weight:600;margin-left:auto}
.gr-res.pass{color:var(--ok)}.gr-res.fail{color:var(--warn)}
.gr-btn[disabled]{opacity:.45;cursor:not-allowed}
.gr-burst{position:fixed;pointer-events:none;z-index:90;font-size:1.3rem;animation:grb 1s ease-out forwards}
@keyframes grb{to{transform:translate(var(--x),var(--y)) rotate(var(--r));opacity:0}}
@keyframes grshake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
.gr-it.no .gr-ib{animation:grshake .3s}
/* speaking cards */
.gr-spk{display:grid;grid-template-columns:repeat(auto-fill,minmax(16rem,1fr));gap:.65rem}
.gr-sc{background:var(--card);border:1px solid var(--line);border-radius:1.1rem;padding:.9rem;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:.6rem}
.gr-scp{display:flex;align-items:center;gap:.35rem;flex-wrap:wrap;font-size:.86rem}
.gr-scp span{display:inline-flex;align-items:center;gap:.3rem;padding:.25rem .55rem;border-radius:999px;font-weight:600}
.gr-scp .n{background:var(--nom-s);color:var(--nom)}.gr-scp .d{background:var(--dat-s);color:var(--dat)}.gr-scp .a{background:var(--akk-s);color:var(--akk)}
.gr-scp .arr{color:var(--faint);padding:0}
.gr-scs{font-family:Newsreader,serif;font-size:1.15rem;min-height:1.6rem}
.gr-scs.hid{color:var(--faint);font-style:italic;font-size:.95rem;font-family:Inter,sans-serif}
.gr-sc .row{gap:.35rem}
/* word popover */
.gr-pop{position:absolute;z-index:70;width:min(20rem,calc(100vw - 2rem));background:var(--card);border:1px solid var(--line);border-radius:1rem;box-shadow:0 18px 40px -12px rgba(0,0,0,.35);padding:.85rem .95rem;font-size:.9rem}
.gr-pop .hw{font-family:Fraunces,serif;font-weight:700;font-size:1.25rem;display:flex;align-items:center;gap:.5rem}
.gr-pop .ps{font-size:.72rem;color:var(--faint);font-weight:600;text-transform:uppercase;letter-spacing:.05em}
.gr-pop p{margin:.35rem 0 .6rem;color:var(--mut)}
/* progress page */
.gr-ptab{width:100%;border-collapse:collapse;font-size:.9rem;background:var(--card);border-radius:1rem;overflow:hidden;border:1px solid var(--line)}
.gr-ptab th,.gr-ptab td{padding:.55rem .7rem;border-bottom:1px solid var(--line2);text-align:left}
.gr-ptab thead th{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);background:var(--panel)}
.gr-ph td{background:var(--panel);font-size:.86rem}.gr-ph a{text-decoration:none}
.gr-bar{height:.45rem;border-radius:999px;background:var(--line2);overflow:hidden;min-width:4rem}
.gr-bar i{display:block;height:100%;border-radius:999px;background:var(--ok)}
.gr-bar i.f{background:var(--warn)}
@media(max-width:760px){.gr-hero{grid-template-columns:1fr}.gr-hero .gr-art{order:-1}.gr-top{grid-template-columns:1fr;padding:1.3rem}.gr-topart{max-width:20rem;margin:0 auto;order:-1}}
@media(max-width:640px){.gr-q3{grid-template-columns:1fr}.gr-qc{display:grid;grid-template-columns:auto 1fr;column-gap:.8rem}.gr-qc .gr-qi{float:none;grid-row:span 2}
  .gr-hero h1{font-size:1.8rem}.gr-top h1{font-size:2rem}.gr-feat .th{flex-basis:6.5rem}.gr-toc{top:58px}
  .gr-slot>span{font-size:1.05rem;padding:.3rem .55rem}.gr-msent{font-size:1.25rem}.gr-ib{font-size:1.1rem}.gr-tbl{font-size:.85rem}.gr-tbl td{font-size:.98rem;padding:.45rem .4rem}
  .gr-ptab .hide-s{display:none}}
/* verbs, endings, bracket */
.cs.e{color:var(--ac);background:var(--ac-salt);box-shadow:inset 0 -2px 0 var(--ac);padding:0 .08em;border-radius:.25em}
.cs.v{background:var(--fg);color:var(--bg);box-shadow:none;padding:0 .3em}
.cs.t{background:transparent;color:var(--fg);box-shadow:none;outline:1.5px dashed var(--fg);outline-offset:-1px;padding:0 .3em}
.gr-merk .cs.v{background:var(--bg);color:var(--fg)}.gr-merk .cs.t{color:var(--bg);outline-color:var(--bg)}
.gr-slot.vt>span{background:transparent;border:2px dashed var(--fg);font-weight:600}
.gr-slot.q>span{border-color:var(--ac);background:var(--ac-salt);color:var(--ac)}.gr-slot.q small{color:var(--ac)}
.gr-slot small:empty::before{content:'\\00a0'}
.gr-cards2{display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--min,13rem),1fr));gap:.6rem}
.gr-c2{background:var(--card);border-radius:1rem;padding:.8rem .9rem;border:1px solid var(--cream-b);border-top:4px solid var(--c,var(--ac))}
.gr-c2 .tt{font-family:Fraunces,serif;font-weight:700;font-size:1.35rem;color:var(--c,var(--fg));line-height:1.15;display:flex;gap:.45rem;align-items:center}
.gr-c2 .tt .lic{font-size:1.05rem}
.gr-c2 .s{font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);display:block;margin:.1rem 0 .35rem}
.gr-c2 p{margin:.3rem 0 0;font-size:.92rem}.gr-c2 .ex{font-family:Newsreader,serif;font-size:1.05rem;color:var(--mut)}
.gr-c2 .ws{display:flex;flex-wrap:wrap;gap:.25rem .35rem;margin-top:.35rem;font-family:Newsreader,serif;font-size:1.05rem}
.gr-c2 .ws span.gw{background:var(--panel);border:1px solid var(--line);border-radius:.4rem;padding:0 .35rem}
.k-n{--c:var(--nom)}.k-d{--c:var(--dat)}.k-a{--c:var(--akk)}.k-ac{--c:var(--ac)}.k-ok{--c:var(--ok)}.k-w{--c:var(--warn)}.k-b{--c:var(--bad)}.k-f{--c:var(--fg)}
.gr-grid td{font-family:Newsreader,serif;font-size:1.06rem}.gr-grid td.l,.gr-grid th.l{font-family:Inter,sans-serif;font-size:.86rem;font-weight:600;color:var(--mut)}
.gr-grid td.l{white-space:nowrap}
.gr-grid tr.hl td{background:color-mix(in srgb,var(--ac) 7%,var(--card))}
.gr-conj .gr-cv{display:flex;flex-wrap:wrap;gap:.3rem;margin:0 0 .75rem}
.gr-conj .gr-cv .gr-chip{font-family:Newsreader,serif;font-size:1rem;padding:.25rem .75rem}
.gr-conjt{display:grid;grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(3,auto);grid-auto-flow:column;gap:.4rem}
@media(max-width:560px){.gr-conjt{grid-template-columns:1fr;grid-template-rows:none;grid-auto-flow:row}.gr-conjt b{width:4.6rem}}
.gr-conjt div{background:var(--card);border-radius:.75rem;padding:.5rem .75rem;display:flex;align-items:baseline;gap:.6rem;border:1px solid var(--cream-b);animation:grin .35s both}
.gr-conjt b{font-family:Inter,sans-serif;font-size:.8rem;color:var(--mut);width:5.2rem;flex:0 0 auto;font-weight:600}
.gr-conjt span{font-family:Newsreader,serif;font-size:1.3rem}
.gr-conjt .end{color:var(--ac);font-weight:600;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px}
@keyframes grin{from{opacity:0;transform:translateY(4px)}}
.gr-cnote{font-size:.88rem;color:var(--cream-ink);margin:.6rem 0 0;min-height:1.3em}
.gr-fill{font:inherit;font-size:1.05rem;width:calc(var(--n,4)*.68em + 1.4em);min-width:3.2em;max-width:100%;border:none;border-bottom:2px solid var(--ac);background:var(--ac-salt);color:var(--fg);border-radius:.35rem .35rem 0 0;padding:0 .3em;text-align:center}
.gr-fill:focus{outline:none;background:color-mix(in srgb,var(--ac) 22%,var(--card))}
.gr-fill.right{border-color:var(--ok);background:color-mix(in srgb,var(--ok) 14%,var(--card));color:var(--ok);font-weight:600}
.gr-fill.wrong{border-color:var(--bad);background:color-mix(in srgb,var(--bad) 12%,var(--card));color:var(--bad)}
.gr-hint{font-family:Inter,sans-serif;font-size:.78rem;font-weight:600;color:var(--mut);background:var(--line2);border-radius:.35rem;padding:.05rem .4rem;margin-right:.25rem;vertical-align:.15em}
.gr-scp .x{background:var(--line2);color:var(--fg)}.gr-scp .b{background:color-mix(in srgb,var(--bad) 13%,var(--card));color:var(--bad)}.gr-scp .ok{background:color-mix(in srgb,var(--ok) 13%,var(--card));color:var(--ok)}.gr-scp .v{background:var(--fg);color:var(--bg)}.gr-scp .e{background:var(--ac-salt);color:var(--ac)}
.gr-refq{width:100%;border:1.5px solid var(--cream-b);background:var(--card);color:var(--fg);border-radius:999px;padding:.5rem 1rem;font:inherit;margin:0 0 .6rem}
.gr-refw{max-height:28rem;overflow:auto;border-radius:.9rem}
.gr-ref thead th{position:sticky;top:0;z-index:1}
.gr-ref0{font-weight:600}
.gr-play{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;background:var(--ac-salt);border-radius:1rem;padding:.7rem .9rem;margin:0 0 1rem;font-size:.9rem;font-weight:600}
.gr-play>span{display:inline-flex;gap:.4rem;align-items:center;margin-right:auto}
.gr-scs .alt{display:block;font-size:1rem;color:var(--mut);margin-top:.2rem}

/* Wortschatz */
.vk-feat .th{background:var(--cream)}
.vk-n{font-family:Inter,sans-serif;font-size:.8rem;color:var(--mut);font-weight:600;margin-left:.3rem}
.vk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(9.6rem,1fr));gap:.7rem}
.vk-card{display:flex;flex-direction:column;align-items:stretch;text-align:left;gap:.12rem;padding:.55rem .6rem .65rem;border:1px solid var(--line);border-radius:1rem;background:var(--card);color:var(--fg);cursor:pointer;font:inherit;position:relative;transition:transform .15s,box-shadow .15s}
.vk-card:hover{transform:translateY(-2px);box-shadow:var(--shadow)}
.vk-card::before{content:"";position:absolute;left:.6rem;right:.6rem;top:0;height:3px;border-radius:0 0 3px 3px;background:var(--faint)}
.vk-card.der::before{background:var(--der)}.vk-card.die::before{background:var(--die)}.vk-card.das::before{background:var(--das)}
.vk-pic{display:block;aspect-ratio:4/3;border-radius:.7rem;background:var(--cream);overflow:hidden;margin-bottom:.35rem}
.vk-pic svg,.vk-shp svg,.vk-qpic svg{display:block;width:100%;height:100%}
.vk-w{font-family:Fraunces,serif;font-weight:600;font-size:1.08rem;line-height:1.2}
.vk-ar{font-family:Inter,sans-serif;font-size:.82rem;font-weight:700}
.der .vk-ar{color:var(--der)}.die .vk-ar{color:var(--die)}.das .vk-ar{color:var(--das)}
.vk-pl{font-size:.76rem;color:var(--mut)}.vk-en{font-size:.82rem;color:var(--fg);opacity:.8;font-style:italic}
.vk-legend{display:flex;gap:.9rem;flex-wrap:wrap;margin:.8rem 0 0;font-size:.78rem;color:var(--mut)}
.vk-legend span::before{content:"";display:inline-block;width:.9rem;height:3px;border-radius:2px;margin-right:.3rem;vertical-align:middle;background:var(--faint)}
.vk-legend .der::before{background:var(--der)}.vk-legend .die::before{background:var(--die)}.vk-legend .das::before{background:var(--das)}
.vk-fil{margin:0 0 .8rem}
.vk-src{font-size:.75rem;color:var(--mut);margin:1.6rem 0 0;line-height:1.5}.vk-src a{color:inherit}
.vk-qpic{display:inline-block;width:5.4rem;height:4rem;border-radius:.6rem;background:var(--cream);overflow:hidden;vertical-align:middle;margin:0 .6rem .3rem 0}
.vk-dlg{display:flex;flex-direction:column;gap:.5rem}
.vk-ln{display:flex;align-items:center;gap:.5rem}.vk-ln.r{flex-direction:row-reverse}
.vk-who{flex:0 0 auto;width:2.1rem;height:2.1rem;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:.8rem;background:var(--akk-s);color:var(--akk)}
.vk-ln.r .vk-who{background:var(--dat-s);color:var(--dat)}
.vk-bub{background:var(--card);border:1px solid var(--line);border-radius:1rem;padding:.45rem .75rem;font-size:.98rem;max-width:75%}
.vk-tree{display:block;width:100%;max-width:560px;margin:0 auto}
.vk-cap{min-height:1.6em;margin:.4rem 0 0;font-family:Newsreader,serif;font-size:1.12rem;color:var(--cream-ink);text-align:center}
.vk-tree [data-cap]{cursor:pointer}.vk-tree [data-cap] .ring{opacity:0;transition:opacity .2s}.vk-tree [data-cap].on .ring,.vk-tree [data-cap]:hover .ring{opacity:1}
.vk-sh{max-height:min(84vh,46rem);overflow:auto;margin:-.2rem -.5rem -.2rem -.2rem;padding:.2rem .5rem .2rem .2rem}
.vk-shh{display:flex;gap:.9rem;align-items:center}
.vk-shp{flex:0 0 6.6rem;height:5rem;border-radius:.8rem;background:var(--cream);overflow:hidden}
.vk-sht{min-width:0}
.vk-shw{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap;font-family:Fraunces,serif;font-size:1.65rem;line-height:1.15}
.vk-shw .vk-ar{font-size:1rem}.vk-shw .gr-say{width:32px;height:32px}
.vk-shw.der b{color:var(--der)}.vk-shw.die b{color:var(--die)}.vk-shw.das b{color:var(--das)}
.gr-say.on{color:var(--ac);border-color:var(--ac);box-shadow:0 0 0 3px var(--ac-salt)}
.vk-meta{font-size:.8rem;color:var(--mut);margin-top:.15rem}.vk-meta .ipa{font-family:ui-monospace,Menlo,monospace}
.vk-fm{font-size:.88rem;margin-top:.25rem}.vk-fm small{color:var(--mut)}
.vk-tr{display:flex;gap:.6rem;align-items:baseline;background:var(--ac-salt);border-radius:.8rem;padding:.6rem .8rem;margin:.9rem 0 .7rem;font-size:1.02rem}
.vk-tr .lab{font-size:.68rem;font-weight:800;letter-spacing:.06em;color:var(--ac)}.vk-tr i{color:var(--faint);font-style:normal;margin:0 .4rem}
.vk-conj{display:flex;gap:1rem;flex-wrap:wrap;margin:0 0 .7rem;font-size:.9rem}
.vk-conj table{border-collapse:collapse}.vk-conj td{padding:.12rem .7rem .12rem 0}.vk-conj td:first-child{color:var(--mut)}
.vk-tense p{margin:0 0 .45rem}.vk-tense small{display:block;font-size:.7rem;color:var(--mut);text-transform:uppercase;letter-spacing:.05em}
.vk-note{display:flex;gap:.5rem;align-items:flex-start;background:var(--cream);border:1px solid var(--cream-b);border-radius:.8rem;padding:.55rem .75rem;font-size:.9rem;margin:0 0 .6rem;color:var(--cream-ink)}
.vk-note svg{flex:0 0 auto;margin-top:.15rem;color:var(--nom)}
.vk-h4{font-size:.72rem;letter-spacing:.07em;text-transform:uppercase;color:var(--mut);margin:.8rem 0 .4rem}
.vk-exs{border:1px solid var(--line);border-radius:.8rem;overflow:hidden}
.vk-exr{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--line)}.vk-exr:first-child{border-top:0}
.vk-exr>div{padding:.5rem .7rem;font-size:.93rem;line-height:1.4}
.vk-exr .de{display:flex;gap:.4rem;align-items:flex-start;justify-content:space-between;font-family:Newsreader,serif;font-size:1.04rem}
.vk-exr .en{background:var(--line2);color:var(--fg)}
.vk-exr mark{background:none;color:var(--ac);font-weight:700}
.vk-exr .gr-say.sm{width:26px;height:26px}
.vk-tl{font-size:.68rem;color:var(--faint);text-decoration:none;margin-left:.2rem}.vk-tl:hover{color:var(--ac)}
.vk-shf{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;margin:.9rem 0 .3rem}.vk-shf .spacer{flex:1}
.vk-cred{font-size:.7rem;color:var(--faint);margin:.3rem 0 0}.vk-cred a{color:inherit}
@media(max-width:520px){.vk-exr{grid-template-columns:1fr}.vk-exr .en{padding-top:.25rem}.vk-grid{grid-template-columns:repeat(2,1fr);gap:.5rem}.vk-w{font-size:.98rem}}

.gr-round-nav{display:flex;align-items:end;gap:.6rem;flex-wrap:wrap;margin:1.5rem 0}.gr-round-nav label{display:grid;gap:.4rem;flex:1;min-width:0}.gr-round-nav select{width:100%;padding:.75rem;border:1px solid var(--line);border-radius:.8rem;color:var(--fg);background:var(--card);font:inherit}.gr-round-nav [data-round-status]{flex-basis:100%;font-size:.85rem;color:var(--mut)}.gr-ue[hidden]{display:none}
.gr-select{border:0;padding:0;margin:0;min-width:0}.gr-select legend{margin-bottom:.75rem;line-height:1.65}.gr-select label{display:inline-flex;align-items:center;gap:.5rem;margin:0 .5rem .5rem 0;border:1px solid var(--line);border-radius:.8rem;padding:.65rem .85rem;cursor:pointer;max-width:100%;overflow-wrap:anywhere}.gr-select label:has(:checked){border-color:var(--ac);background:var(--ac-salt)}.gr-select input{width:1.1rem;min-width:1.1rem;height:1.1rem;accent-color:var(--ac);margin:0}.gr-select input:focus-visible{outline:2px solid var(--ac);outline-offset:3px}
.gr-tl:has(textarea){display:block}.gr-tl textarea{width:100%;resize:vertical;padding:.9rem;border:1px solid var(--line);border-radius:.8rem;font:inherit;line-height:1.7;background:var(--card);color:var(--fg)}.gr-tl textarea:focus{outline:2px solid var(--ac);outline-offset:2px}.gr-scene-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr));gap:1rem}.gr-scene{margin:0;border:1px solid var(--line);border-radius:1rem;overflow:hidden;background:var(--card)}.gr-scene svg{width:100%;height:auto;display:block}.gr-it .gr-scene{max-width:26rem;margin:0 0 .9rem}.gr-scene figcaption{padding:.9rem}.gr-scene figcaption p{margin:.45rem 0;line-height:1.65}.gr-concept{margin:1.3rem 0}.gr-concept>figure{margin:0 auto -.4rem;width:min(100%,24rem);border-radius:1rem;overflow:hidden}.gr-concept>figure svg{width:100%;display:block;height:auto}
/* contents list (Grammatik and Wortschatz) */
.gr-tocbar{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;margin:0 0 .7rem}.gr-tocbar b{font-family:Fraunces,serif;font-size:1.2rem}.gr-tocbar .spacer{flex:1}
.gr-acc{border:1px solid var(--line);background:var(--card);border-radius:1rem;margin:0 0 .6rem;overflow:hidden}
.gr-acc>summary{list-style:none;display:flex;align-items:center;gap:.65rem;padding:.75rem .9rem;cursor:pointer;user-select:none}
.gr-acc>summary::-webkit-details-marker{display:none}
.gr-acc>summary .badge{width:2.1rem;height:2.1rem;border-radius:.7rem;display:grid;place-items:center;flex:0 0 auto;background:hsl(var(--h) 70% 94%);color:hsl(var(--h) 55% 42%)}
.gr-acc>summary .gr-gt{font-family:Fraunces,serif;font-weight:600;font-size:1.12rem}
.gr-acc>summary .gr-gl{display:flex;gap:.2rem}
.gr-acc>summary small{margin-left:auto;color:var(--faint);font-size:.78rem;white-space:nowrap}
.gr-acc>summary .chev{display:inline-flex;color:var(--mut);transition:transform .2s}
.gr-acc[open]>summary .chev{transform:rotate(180deg)}
.gr-acc[open]>summary{border-bottom:1px solid var(--line2)}
.gr-rows{padding:.45rem .55rem .6rem;display:grid;gap:.35rem}
.gr-row{position:relative;border-radius:.8rem}
.gr-row .gr-card{padding-right:3rem}
.gr-row .gr-card.ready{box-shadow:none;border-color:var(--line)}
.gr-row.open .gr-card{border-bottom-left-radius:0;border-bottom-right-radius:0;border-color:color-mix(in srgb,var(--ac) 40%,var(--line))}
.gr-exp{position:absolute;right:.45rem;top:.5rem;width:2.1rem;height:2.1rem;border-radius:50%;border:1px solid var(--line);background:var(--card);color:var(--mut);display:grid;place-items:center;cursor:pointer;transition:transform .2s}
.gr-exp:hover{color:var(--ac);border-color:var(--ac)}.gr-row.open .gr-exp{transform:rotate(180deg)}
.gr-pp{font-size:.72rem;color:var(--ok);font-weight:700}
.gr-clbox{border:1px solid color-mix(in srgb,var(--ac) 40%,var(--line));border-top:0;border-radius:0 0 .8rem .8rem;background:var(--panel);padding:.35rem .5rem .5rem}
.gr-cl{columns:15rem;column-gap:.8rem}.gr-cl a{break-inside:avoid}
.gr-cl a{display:flex;align-items:center;gap:.45rem;padding:.35rem .45rem;border-radius:.5rem;text-decoration:none;color:var(--fg);font-size:.86rem}
.gr-cl a:hover{background:var(--ac-salt)}.gr-cl a svg{width:15px;height:15px;color:var(--mut);flex:0 0 auto}
.gr-cl .k{font-size:.7rem;font-weight:700;color:var(--ac);white-space:nowrap}.gr-cl .t{flex:1;min-width:0}
.gr-cl .ok{color:var(--ok);display:inline-flex}.gr-cl .ok svg{color:var(--ok)}.gr-cl .pc{font-size:.7rem;color:var(--mut)}
.gr-clw{margin:.4rem .5rem;color:var(--mut);font-size:.88rem}
/* folding inside a chapter */
.gr-sec>h2::after{content:"";width:.55rem;height:.55rem;border-right:2.5px solid var(--faint);border-bottom:2.5px solid var(--faint);transform:rotate(45deg);margin:-.3rem 0 0 .35rem;transition:transform .2s}
.gr-sec.closed>h2::after{transform:rotate(-45deg);margin-top:0}
.gr-sec.closed>*:not(h2){display:none!important}.gr-sec.closed{margin-bottom:.2rem}
.gr-secall{margin-left:auto;display:inline-flex;align-items:center;gap:.3rem;white-space:nowrap;font:inherit;font-size:.78rem;font-weight:600;color:var(--mut);background:none;border:1px dashed var(--line);border-radius:999px;padding:.3rem .7rem;cursor:pointer}
.gr-secall svg{width:14px;height:14px}
/* new exercise layouts */
.gr-items.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(10.5rem,1fr));gap:.6rem}
.gr-items.grid .gr-it{border:1px solid var(--line);border-radius:.9rem;padding:.55rem;background:var(--card);margin:0;min-width:0;overflow-wrap:anywhere}
.gr-items.grid .gr-fill{max-width:100%}
.gr-items.grid .gr-ib{display:flex;flex-direction:column;gap:.35rem}.gr-items.grid .vk-qpic{width:100%;height:auto;aspect-ratio:4/3;margin:0}
.gr-items.grid .gr-in{position:absolute;margin:.3rem}
.gr-items.cols{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,17rem),1fr));gap:0 1.2rem}
.gr-items.flow{display:block;line-height:2.5;font-family:Newsreader,serif;font-size:1.12rem}
.gr-items.flow .gr-it{display:inline;padding:0;margin:0;border:0;background:none!important;box-shadow:none}
.gr-items.flow .gr-it::after{content:" "}.gr-items.flow .gr-in,.gr-items.flow .gr-sol{display:none!important}.gr-items.flow .gr-ib{display:inline}
.gr-gn{font-family:Inter,sans-serif;font-size:.68rem;color:var(--mut);margin:0 .25rem 0 .1rem}
.gr-bank{display:flex;flex-wrap:wrap;gap:.35rem;border:2px solid var(--cream-b);border-left-width:6px;border-right-width:6px;border-radius:.6rem;padding:.5rem .7rem;margin:0 0 .8rem;background:var(--cream)}
.gr-bank span{font-weight:600;font-size:.9rem;color:var(--cream-ink)}.gr-bank span:not(:last-child)::after{content:"·";margin-left:.35rem;color:var(--faint)}
.gr-bank span.done{text-decoration:line-through;opacity:.6}
.gr-frame{border:1px solid var(--line);border-radius:.9rem;background:var(--card);padding:.9rem 1rem;margin:0 0 .3rem;box-shadow:var(--shadow)}
.gr-frame.mail .gr-fh{display:flex;align-items:center;gap:.5rem;margin:-.9rem -1rem .7rem;padding:.55rem 1rem;border-bottom:1px solid var(--line);background:var(--panel);border-radius:.9rem .9rem 0 0;font-size:.85rem;color:var(--mut)}
.gr-frame.card{background:var(--cream);border-color:var(--cream-b);transform:rotate(-.6deg);max-width:34rem}
.gr-frame.card .gr-items.flow{font-style:italic}
.vk-more{display:flex;gap:.7rem;align-items:center;margin:-.3rem 0 1.2rem;border-radius:.7rem;overflow:hidden;background:var(--die-s)}
.vk-more span{align-self:stretch;display:flex;align-items:center;background:var(--die);color:#fff;font-size:.68rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:.45rem .7rem;white-space:nowrap}
.vk-more p{margin:0;padding:.45rem .7rem .45rem 0;font-size:.9rem}
.vk-qt{display:inline}
.vk-ue .gr-uen{font-family:Fraunces,serif;font-size:1.05rem;color:var(--ac);background:var(--ac-salt)}
/* word list in the style of a learner's word list */
.vk-lhead{display:flex;gap:.8rem;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;margin:-.3rem 0 .8rem}.vk-lhead .sub{margin:0;flex:1 1 18rem}
.vk-viewsw{display:inline-flex;border:1px solid var(--line);border-radius:999px;padding:.15rem;background:var(--card)}
.vk-viewsw button{display:inline-flex;align-items:center;gap:.3rem;border:0;background:none;font:inherit;font-size:.8rem;font-weight:600;color:var(--mut);padding:.32rem .7rem;border-radius:999px;cursor:pointer}
.vk-viewsw button.on{background:var(--fg);color:var(--bg)}.vk-viewsw svg{width:14px;height:14px}
.vk-wl{display:grid;grid-template-columns:repeat(auto-fit,minmax(19rem,1fr));gap:1rem 1.6rem;background:var(--card);border:1px solid var(--line);border-radius:1.1rem;padding:1rem 1.1rem}
.vk-wg h4{font-family:Fraunces,serif;font-size:1.15rem;color:var(--ac);margin:0 0 .4rem}
.vk-wrows{display:flex;flex-direction:column;gap:.05rem}
.vk-wr{display:grid;grid-template-columns:1fr;gap:.6rem}.vk-wr.pair{grid-template-columns:1fr 1fr}
.vk-we{display:flex;align-items:center;gap:.4rem;padding:.16rem .3rem;border-radius:.45rem;cursor:pointer;min-width:0}
.vk-we:hover{background:var(--line2)}
.vk-wt{font-size:.98rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.vk-wt b{font-weight:600}
.vk-we .vk-ar{font-size:.95rem;font-weight:600}.vk-pn{color:var(--mut);font-size:.88rem}
.vk-mk{flex:0 0 auto;width:20px;height:20px;border-radius:50%;border:1.5px solid var(--line);background:var(--card);color:transparent;display:grid;place-items:center;padding:0;cursor:pointer}
.vk-mk svg{width:12px;height:12px}
.vk-we.known .vk-mk{background:var(--ok);border-color:var(--ok);color:#fff}
.vk-we.known .vk-wt b{background:linear-gradient(transparent 45%,color-mix(in srgb,var(--sun) 55%,transparent) 45%)}
.vk-box{border:2px solid var(--ac);border-radius:.6rem;padding:.55rem .8rem;margin:.7rem 0 0;background:var(--card)}
.vk-box p{display:flex;justify-content:space-between;align-items:center;gap:.5rem;margin:.1rem 0;font-family:Newsreader,serif;font-size:1.05rem}.vk-box b{font-weight:700}
.vk-box .gr-say{width:26px;height:26px}
.vk-info{display:flex;gap:0;margin:1rem 0 .8rem;border-top:2px solid var(--das);background:var(--card)}
.vk-info .lab,.vk-tip .lab{flex:0 0 auto;font-size:.68rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#fff;background:var(--das);padding:.3rem .6rem;align-self:flex-start}
.vk-info>div{padding:.5rem .8rem;flex:1;min-width:0;overflow-x:auto}
.vk-info table{border-collapse:collapse;font-size:.92rem}.vk-info td{padding:.2rem .7rem;border-right:1px solid var(--line)}.vk-info tr:first-child td{border-bottom:1px solid var(--line);font-weight:600}
.vk-ask{font-size:.95rem;color:var(--ac);margin:.6rem 0 .5rem}
.vk-markbar{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap;background:var(--ac-salt);border-radius:.8rem;padding:.55rem .75rem;font-size:.9rem}.vk-markbar .spacer{flex:1}
.vk-tip{display:flex;flex-wrap:wrap;gap:.7rem;align-items:flex-start;border-top:2px solid var(--der);padding:.1rem 0 .9rem;margin:0 0 .8rem}
.vk-tip .lab{background:var(--der)}.vk-tip p{flex:1 1 18rem;margin:.25rem 0 0}
.vk-hand{flex:0 1 auto;font-family:Newsreader,serif;font-style:italic;font-size:1.05rem;background:var(--card);border:1px solid var(--line);box-shadow:var(--shadow);padding:.45rem .8rem;border-radius:.4rem;transform:rotate(-1deg);color:var(--fg)}
.vk-chh{display:flex;align-items:center;gap:.8rem}.vk-chh h1{margin:0}
.vk-chn{flex:0 0 auto;width:3rem;height:3rem;border-radius:.6rem;background:var(--ac);color:#fff;display:grid;place-items:center;font-family:Fraunces,serif;font-weight:700;font-size:1.6rem}
@media(max-width:520px){.vk-wr.pair{gap:.2rem}.vk-wt{font-size:.9rem}.vk-we{padding:.16rem .1rem;gap:.3rem}.vk-wl{padding:.7rem .55rem}.gr-acc>summary small{display:none}.gr-items.grid{grid-template-columns:repeat(2,1fr)}.gr-secall span{display:none}}

.vk-ico{display:grid;place-items:center;width:100%;height:100%;background:var(--line2);color:var(--faint)}
.vk-ico svg,.vk-ico .lic{width:44%;height:44%;font-size:2.2rem;stroke-width:1.6}
.vk-ico.der{background:var(--der-s);color:var(--der)}.vk-ico.die{background:var(--die-s);color:var(--die)}.vk-ico.das{background:var(--das-s);color:var(--das)}.vk-ico.x{background:var(--cream);color:var(--cream-ink)}
.vk-qpic .vk-ico svg{width:52%;height:52%}
.gr-mopts{display:flex;flex-wrap:wrap;gap:.35rem .9rem;background:var(--cream);border:1px solid var(--cream-b);border-radius:.7rem;padding:.55rem .8rem;margin:0 0 .6rem;font-size:.95rem}
.gr-mopts b{color:var(--ac)}
.gr-items.cols .gr-mopts,.gr-items.grid .gr-mopts{grid-column:1/-1}
.gr-items.cols:has(.gr-scene){grid-template-columns:repeat(2,minmax(0,1fr))}
@media(max-width:640px){.gr-items.cols:has(.gr-scene){grid-template-columns:minmax(0,1fr)}}
.gr-ml{display:inline-block;min-width:9rem;font-weight:600;margin-right:.5rem}
.gr-msel{font:inherit;font-size:1rem;padding:.3rem .5rem;border:1px solid var(--line);border-radius:.5rem;background:var(--card);color:var(--fg);min-width:4.2rem}
.gr-it.ok .gr-msel{border-color:var(--ok)}.gr-it.no .gr-msel{border-color:var(--bad)}

.gr-frame.form{background:var(--card);border:2px solid var(--line);border-radius:.5rem;box-shadow:none;background-image:repeating-linear-gradient(transparent 0 2.45rem,var(--line2) 2.45rem 2.5rem)}
.gr-frame.form .gr-fh{display:flex;align-items:center;gap:.5rem;margin:-.9rem -1rem .7rem;padding:.5rem 1rem;background:var(--ac);color:#fff;font-weight:700;font-size:.85rem;letter-spacing:.04em;text-transform:uppercase}
.vk-card .vk-ico,.vk-shp .vk-ico{border-radius:inherit}
.vk-steck{display:flex;gap:1rem;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:1rem;padding:.9rem 1rem;box-shadow:var(--shadow)}
.vk-steck .ph{flex:0 0 7rem;height:7rem;border-radius:.8rem;overflow:hidden;background:var(--sky1)}.vk-steck .ph svg{width:100%;height:100%;display:block}
.vk-steck p{margin:0;font-family:Newsreader,serif;font-size:1.08rem;line-height:1.5}
@media(max-width:520px){.vk-steck{flex-direction:column;align-items:flex-start}}

.vk-selbar{z-index:15;display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;margin:0 0 .6rem}
.vk-selbar.on{position:sticky;top:104px;background:var(--card);border:1px solid color-mix(in srgb,var(--ac) 45%,var(--line));box-shadow:var(--shadow);border-radius:.9rem;padding:.45rem .6rem}
.vk-seln{font-size:.9rem;margin-right:.3rem}
#vkwl.selmode .vk-we,#vkwl.selmode .vk-card{cursor:copy}
#vkwl.selmode .vk-mk{display:none}
#vkwl .vk-we.picked{background:var(--ac-salt);box-shadow:inset 0 0 0 2px var(--ac)}
#vkwl .vk-card.picked{box-shadow:0 0 0 3px var(--ac);transform:none}
#vkwl .vk-card.picked::after{content:"✓";position:absolute;top:.5rem;right:.5rem;width:1.6rem;height:1.6rem;border-radius:50%;background:var(--ac);color:#fff;display:grid;place-items:center;font-weight:800}
@media(max-width:640px){.vk-selbar{top:58px}}
`;
function css() { if (!$('grcss')) { const s = document.createElement('style'); s.id = 'grcss'; s.textContent = CSS; document.head.appendChild(s); } }

/* ---------- illustrations (drawn in code, follow light/dark theme) ---------- */
const ART = {
  kite(small) {
    const lab = (x, y, t, c) => `<g transform="translate(${x} ${y})"><rect x="-27" y="-15" width="54" height="26" rx="13" fill="var(--${c})"/><text y="3" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="13" fill="var(--card)">${t}</text></g>`;
    return `<svg viewBox="0 0 520 360" role="img" aria-label="Ein Opa schenkt seinem Enkel einen Drachen.">
<defs><linearGradient id="grsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky1)"/><stop offset="1" stop-color="var(--sky2)"/></linearGradient>
<marker id="grarr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--dat)"/></marker></defs>
<rect width="520" height="360" fill="url(#grsky)"/>
<circle cx="440" cy="70" r="40" fill="var(--sun)" opacity=".25"/><circle cx="440" cy="70" r="27" fill="var(--sun)"/>
<g fill="var(--cloud)"><ellipse cx="96" cy="66" rx="40" ry="13"/><ellipse cx="118" cy="56" rx="24" ry="15"/><ellipse cx="326" cy="40" rx="30" ry="9"/><ellipse cx="342" cy="33" rx="16" ry="10"/></g>
<path d="M60 112q6-6 12 0q6-6 12 0M380 132q5-5 10 0q5-5 10 0" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" opacity=".45"/>
<path d="M0 262Q120 212 250 248T520 236V360H0Z" fill="var(--hill2)"/>
<path d="M0 300Q170 262 310 290T520 282V360H0Z" fill="var(--hill1)"/>
<g opacity=".18" fill="var(--ink)"><ellipse cx="170" cy="330" rx="56" ry="8"/><ellipse cx="372" cy="330" rx="40" ry="7"/></g>
<!-- Opa -->
<g>
 <rect x="150" y="250" width="17" height="76" rx="8" fill="var(--pants)"/><rect x="173" y="250" width="17" height="76" rx="8" fill="var(--pants)"/>
 <ellipse cx="156" cy="326" rx="14" ry="6" fill="var(--ink)"/><ellipse cx="186" cy="326" rx="14" ry="6" fill="var(--ink)"/>
 <path d="M134 214q0-46 36-46q36 0 36 46v44q0 8-8 8h-56q-8 0-8-8z" fill="var(--nom)"/>
 <path d="M170 170v96" stroke="var(--card)" stroke-width="2" opacity=".5"/>
 <g fill="var(--card)" opacity=".75"><circle cx="176" cy="196" r="2.4"/><circle cx="176" cy="214" r="2.4"/><circle cx="176" cy="232" r="2.4"/></g>
 <path d="M140 200q-14 30-4 58" stroke="var(--nom)" stroke-width="15" stroke-linecap="round" fill="none"/>
 <circle cx="138" cy="260" r="7.5" fill="var(--skin1)"/>
 <path d="M200 192q24 6 40 -12" stroke="var(--nom)" stroke-width="15" stroke-linecap="round" fill="none"/>
 <rect x="162" y="150" width="16" height="20" rx="6" fill="var(--skin1)"/>
 <circle cx="170" cy="134" r="28" fill="var(--skin1)"/>
 <path d="M143 136q-3-26 13-34q-12 14-6 34zM197 136q3-26-13-34q12 14 6 34z" fill="var(--hair1)"/>
 <path d="M150 112q20-14 40 0" stroke="var(--hair1)" stroke-width="5" stroke-linecap="round" fill="none"/>
 <circle cx="141" cy="138" r="5" fill="var(--skin2)"/><circle cx="199" cy="138" r="5" fill="var(--skin2)"/>
 <g fill="none" stroke="var(--ink)" stroke-width="2"><circle cx="160" cy="132" r="7"/><circle cx="180" cy="132" r="7"/><path d="M167 132h6"/></g>
 <circle cx="160" cy="132" r="2" fill="var(--ink)"/><circle cx="180" cy="132" r="2" fill="var(--ink)"/>
 <path d="M157 147q13-9 26 0q-4 6-13 3q-9 3-13-3z" fill="var(--hair1)"/>
 <path d="M164 154q6 4 12 0" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" fill="none"/>
</g>
<!-- Drachen -->
<g transform="rotate(-12 268 148)">
 <path d="M268 74L310 140L268 214L228 140Z" fill="var(--akk)"/>
 <path d="M268 74L310 140H268Z" fill="var(--card)" opacity=".28"/><path d="M228 140L268 214V140Z" fill="var(--card)" opacity=".18"/>
 <path d="M268 74V214M228 140H310" stroke="var(--card)" stroke-width="2.5" opacity=".7"/>
 <path d="M268 214q-10 22 6 38q16 16 0 40" stroke="var(--ink)" stroke-width="1.6" fill="none" opacity=".55"/>
 <g fill="var(--nom)"><path d="M262 232l12-6l-2 12z"/><path d="M270 262l12-4l-4 11z"/></g><path d="M266 284l11-2l-5 10z" fill="var(--dat)"/>
</g>
<circle cx="241" cy="180" r="7.5" fill="var(--skin1)"/>
<!-- Enkel -->
<g>
 <rect x="357" y="270" width="14" height="56" rx="7" fill="var(--pants)"/><rect x="376" y="270" width="14" height="56" rx="7" fill="var(--pants)"/>
 <ellipse cx="362" cy="326" rx="11" ry="5" fill="var(--ink)"/><ellipse cx="386" cy="326" rx="11" ry="5" fill="var(--ink)"/>
 <path d="M350 246q0-36 24-36q24 0 24 36v26q0 6-6 6h-36q-6 0-6-6z" fill="var(--dat)"/>
 <path d="M356 228q-18-14-26-36" stroke="var(--dat)" stroke-width="12" stroke-linecap="round" fill="none"/>
 <circle cx="329" cy="188" r="6.5" fill="var(--skin1)"/>
 <path d="M393 228q16-14 18-38" stroke="var(--dat)" stroke-width="12" stroke-linecap="round" fill="none"/>
 <circle cx="411" cy="186" r="6.5" fill="var(--skin1)"/>
 <circle cx="374" cy="186" r="24" fill="var(--skin1)"/>
 <g fill="var(--hair2)"><circle cx="356" cy="170" r="9"/><circle cx="366" cy="163" r="10"/><circle cx="379" cy="161" r="10"/><circle cx="391" cy="167" r="9"/><circle cx="396" cy="176" r="6"/><circle cx="352" cy="179" r="6"/></g>
 <circle cx="351" cy="190" r="4.5" fill="var(--skin2)"/><circle cx="397" cy="190" r="4.5" fill="var(--skin2)"/>
 <circle cx="366" cy="188" r="2.6" fill="var(--ink)"/><circle cx="382" cy="188" r="2.6" fill="var(--ink)"/>
 <path d="M364 198q10 10 20 0z" fill="var(--ink)"/>
 <g fill="var(--die)" opacity=".35"><circle cx="360" cy="196" r="3.5"/><circle cx="388" cy="196" r="3.5"/></g>
</g>
<path d="M300 106Q348 96 352 150" fill="none" stroke="var(--dat)" stroke-width="2.4" stroke-dasharray="5 6" marker-end="url(#grarr)"/>
${small ? '' : lab(170, 84, 'Wer?', 'nom') + lab(374, 132, 'Wem?', 'dat') + lab(222, 60, 'Was?', 'akk')}
</svg>`;
  },
  vcover() {
    const card = (x, y, r, ar, w, c) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-92" y="-40" width="184" height="80" rx="14" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><rect x="-92" y="-40" width="184" height="9" rx="4" fill="${c}"/>
      <text x="0" y="16" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="26" fill="var(--fg)"><tspan fill="${c}" font-family="Inter,sans-serif" font-size="17">${ar} </tspan>${w}</text></g>`;
    return `<svg viewBox="0 0 520 300" role="img" aria-label="Wortkarten: der Bruder, die Familie, das Kind"><ellipse cx="260" cy="270" rx="200" ry="14" fill="var(--ink)" opacity=".08"/>` +
      card(170, 190, -8, 'die', 'Familie', 'var(--die)') + card(350, 200, 7, 'das', 'Kind', 'var(--das)') + card(262, 110, -2, 'der', 'Bruder', 'var(--der)') +
      `<path d="M440 70l6 14l15 2l-11 10l3 15l-13 -7l-13 7l3 -15l-11 -10l15 -2z" fill="var(--sun)"/><circle cx="84" cy="96" r="7" fill="var(--sun)" opacity=".7"/></svg>`;
  },
  cover() {
    const tile = (x, y, r, t, c, s) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-38" y="-22" width="76" height="44" rx="12" fill="var(--${s})" stroke="var(--${c})" stroke-width="2"/><text y="8" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="22" fill="var(--${c})">${t}</text></g>`;
    return `<svg viewBox="0 0 320 230" role="img" aria-label="Ein offenes Buch mit Artikeln">
<ellipse cx="160" cy="206" rx="120" ry="10" fill="var(--ink)" opacity=".1"/>
<path d="M160 70Q110 48 40 58V190Q110 180 160 202Z" fill="var(--card)" stroke="var(--cream-b)" stroke-width="2"/>
<path d="M160 70Q210 48 280 58V190Q210 180 160 202Z" fill="var(--card)" stroke="var(--cream-b)" stroke-width="2"/>
<path d="M160 70V202" stroke="var(--cream-b)" stroke-width="2"/>
<g stroke="var(--faint)" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"><path d="M60 92q40-6 80 2M60 112q40-6 80 2M60 132q40-6 66 2M60 152q40-6 80 2"/><path d="M180 94q40-8 80-2M180 114q40-8 80-2M194 134q32-6 66-2M180 154q40-8 80-2"/></g>
${tile(88, 34, -10, 'der', 'nom', 'nom-s')}${tile(236, 30, 9, 'dem', 'dat', 'dat-s')}${tile(162, 18, -2, 'den', 'akk', 'akk-s')}
<g fill="var(--sun)"><path d="M30 30l3 8l8 3l-8 3l-3 8l-3-8l-8-3l8-3z"/><path d="M292 108l2 5l5 2l-5 2l-2 5l-2-5l-5-2l5-2z"/></g>
</svg>`;
  }
};

/* ---------- drawing kit: chapters compose their pictures from these pieces ---------- */
const K = {
  svg: (inner, label) => `<svg viewBox="0 0 520 360" role="img" aria-label="${H(label)}">${inner}</svg>`,
  grad: () => `<defs><linearGradient id="grsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky1)"/><stop offset="1" stop-color="var(--sky2)"/></linearGradient></defs><rect width="520" height="360" fill="url(#grsky)"/>`,
  clouds: () => `<g fill="var(--cloud)"><ellipse cx="90" cy="62" rx="38" ry="12"/><ellipse cx="110" cy="53" rx="22" ry="14"/><ellipse cx="318" cy="38" rx="28" ry="9"/><ellipse cx="334" cy="31" rx="15" ry="9"/></g>`,
  sun: (x = 446, y = 66) => `<circle cx="${x}" cy="${y}" r="38" fill="var(--sun)" opacity=".25"/><circle cx="${x}" cy="${y}" r="25" fill="var(--sun)"/>`,
  sky: (sun = true) => K.grad() + (sun ? K.sun() : '') + K.clouds() + `<path d="M0 262Q120 214 250 250T520 238V360H0Z" fill="var(--hill2)"/><path d="M0 300Q170 264 310 292T520 284V360H0Z" fill="var(--hill1)"/>`,
  room: (win = true) => `<rect width="520" height="360" fill="var(--wall)"/><rect y="296" width="520" height="64" fill="var(--floor)"/><rect y="292" width="520" height="6" fill="var(--wood)" opacity=".55"/>` +
    (win ? `<rect x="380" y="52" width="104" height="116" rx="8" fill="var(--sky1)" stroke="var(--wood)" stroke-width="6"/><circle cx="458" cy="84" r="11" fill="var(--sun)"/><path d="M432 52V168M380 110H484" stroke="var(--wood)" stroke-width="4"/>` : ''),
  street: () => K.grad() + K.clouds() + `<g opacity=".55"><rect x="20" y="150" width="70" height="140" fill="var(--hill2)"/><rect x="96" y="120" width="56" height="170" fill="var(--hill1)"/><rect x="380" y="136" width="62" height="154" fill="var(--hill1)"/><rect x="446" y="168" width="60" height="122" fill="var(--hill2)"/>
<g fill="var(--sky1)"><rect x="34" y="168" width="14" height="14"/><rect x="60" y="168" width="14" height="14"/><rect x="34" y="198" width="14" height="14"/><rect x="60" y="198" width="14" height="14"/><rect x="108" y="140" width="12" height="12"/><rect x="128" y="140" width="12" height="12"/><rect x="108" y="168" width="12" height="12"/><rect x="128" y="168" width="12" height="12"/><rect x="394" y="156" width="12" height="12"/><rect x="416" y="156" width="12" height="12"/><rect x="394" y="184" width="12" height="12"/><rect x="416" y="184" width="12" height="12"/></g></g>
<rect y="288" width="520" height="72" fill="var(--metal)" opacity=".5"/><rect y="284" width="520" height="8" fill="var(--card)" opacity=".7"/><path d="M0 334H520" stroke="var(--card)" stroke-width="4" stroke-dasharray="26 22" opacity=".7"/>`,
  shadow: (x, w = 44, y = 328) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="7" fill="var(--ink)" opacity=".14"/>`,
  /* a person standing with feet at (x,y). o: s scale, shirt, skin 1–4, hair short|curly|long|bun|white|bald, hc, pants, dress, apron,
     armL/armR down|up|wave|out|hold|hip|chest|front, face smile|open|o|sleep|flat, glasses, beard, flip, extra (drawn in the figure's frame) */
  person(o) {
    const s = o.s || 1, sh = o.shirt || 'var(--nom)', sk = 'var(--skin' + (o.skin || 1) + ')', sk2 = 'var(--skin' + ({ 1: 2, 2: 2, 3: '3b', 4: '4b' }[o.skin || 1]) + ')';
    const hc = o.hc || 'var(--hair2)', pants = o.pants || 'var(--pants)', hair = o.hair || 'short';
    const P = { down: [6, 54], up: [12, -54], wave: [34, -50], out: [48, 18], hold: [-12, 30], hip: [18, 38], chest: [-20, 4], front: [30, 26] };
    const arm = (side, pose) => {
      const sx = side * 21, sy = -122, d = P[pose] || P.down, hx = sx + side * d[0], hy = sy + d[1];
      const cx = sx + side * (pose === 'down' ? 6 : pose === 'chest' || pose === 'hold' ? 8 : 20), cy = (sy + hy) / 2 + (pose === 'up' || pose === 'wave' ? 14 : 8);
      return `<path d="M${sx} ${sy}Q${cx} ${cy} ${hx} ${hy}" stroke="${sh}" stroke-width="13" stroke-linecap="round" fill="none"/><circle cx="${hx}" cy="${hy}" r="6.5" fill="${sk}"/>`;
    };
    const hairBack = hair === 'long' ? `<path d="M-25 -158Q-28 -192 0 -188Q28 -192 25 -158V-116Q17 -108 12 -118V-146Q0 -164-12 -146V-118Q-17 -108-25 -116Z" fill="${hc}"/>` : '';
    const cap = `<path d="M-23 -162Q-24 -188 0 -188Q24 -188 23 -162Q15 -178 0 -175Q-15 -178-23 -162Z" fill="${hc}"/>`;
    const hairFront = {
      short: cap, bun: `<circle cx="0" cy="-192" r="10" fill="${hc}"/>` + cap,
      long: `<path d="M-23 -160Q-24 -188 0 -188Q24 -188 23 -160Q12 -180-2 -172Q-14 -180-23 -160Z" fill="${hc}"/>`,
      curly: `<g fill="${hc}"><circle cx="-16" cy="-174" r="9"/><circle cx="-6" cy="-182" r="10"/><circle cx="7" cy="-182" r="10"/><circle cx="17" cy="-174" r="9"/><circle cx="21" cy="-163" r="6"/><circle cx="-21" cy="-163" r="6"/></g>`,
      white: `<path d="M-24 -156Q-27 -180-12 -186Q-22 -172-18 -154zM24 -156Q27 -180 12 -186Q22 -172 18 -154z" fill="var(--hair1)"/>`, bald: ''
    }[hair] || '';
    const mouth = { smile: '<path d="M-7 -150Q0 -144 7 -150" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" fill="none"/>', open: '<path d="M-7 -151Q0 -139 7 -151Z" fill="var(--ink)"/>',
      o: '<ellipse cx="0" cy="-148" rx="3.2" ry="4" fill="var(--ink)"/>', flat: '<path d="M-6 -149H6" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/>' }[o.face || 'smile'] || '';
    const eyes = o.face === 'sleep' ? '<path d="M-11 -160q3 3 6 0M5 -160q3 3 6 0" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M-5 -149H5" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/>'
      : '<circle cx="-8" cy="-160" r="2.5" fill="var(--ink)"/><circle cx="8" cy="-160" r="2.5" fill="var(--ink)"/>' + mouth;
    const legs = o.dress ? `<rect x="-16" y="-58" width="10" height="58" rx="5" fill="${sk}"/><rect x="6" y="-58" width="10" height="58" rx="5" fill="${sk}"/>`
      : `<rect x="-19" y="-62" width="15" height="62" rx="7" fill="${pants}"/><rect x="4" y="-62" width="15" height="62" rx="7" fill="${pants}"/>`;
    return `<g transform="translate(${o.x} ${o.y || 326}) scale(${o.flip ? -s : s} ${s})">${legs}<ellipse cx="-12" cy="0" rx="12" ry="5" fill="var(--ink)"/><ellipse cx="12" cy="0" rx="12" ry="5" fill="var(--ink)"/>
<path d="M-27 -72Q-27 -134 0 -134Q27 -134 27 -72V-60Q27 -54 21 -54H-21Q-27 -54-27 -60Z" fill="${sh}"/>${o.dress ? `<path d="M-25 -80L-36 -42Q0 -34 36 -42L25 -80Z" fill="${o.dress}"/>` : ''}
${o.apron ? `<path d="M-15 -114H15V-50H-15Z" fill="${o.apron}"/>` : ''}${o.under || ''}${arm(-1, o.armL || 'down')}${arm(1, o.armR || 'down')}
${hairBack}<rect x="-6" y="-146" width="12" height="16" rx="5" fill="${sk}"/><circle cx="0" cy="-160" r="23" fill="${sk}"/>
<circle cx="-23" cy="-158" r="4.5" fill="${sk2}"/><circle cx="23" cy="-158" r="4.5" fill="${sk2}"/>${hairFront}${eyes}<g fill="var(--die)" opacity=".28"><circle cx="-13" cy="-151" r="3.5"/><circle cx="13" cy="-151" r="3.5"/></g>
${o.glasses ? '<g fill="none" stroke="var(--ink)" stroke-width="1.8"><circle cx="-8" cy="-160" r="6.5"/><circle cx="8" cy="-160" r="6.5"/><path d="M-1.5 -160h3"/></g>' : ''}
${o.beard ? `<path d="M-19 -158Q-20 -132 0 -130Q20 -132 19 -158Q14 -146 0 -144Q-14 -146-19 -158Z" fill="${o.beard}"/><path d="M-6 -149Q0 -146 6 -149" stroke="var(--ink)" stroke-width="2" fill="none"/>` : ''}${o.extra || ''}</g>`;
  },
  /* speech bubble; *word* is highlighted. tail l|r|c */
  bubble(x, y, t, o = {}) {
    const len = u => Math.round(u.replace(/\*/g, '').length * 7.5 + 30);
    // long text: two lines, split at a space near the middle (never inside a *highlight*)
    let lines = [t];
    if (len(t) > 470) {
      let best = -1;
      for (let k = 0; k < t.length; k++) if (t[k] === ' ' && (t.slice(0, k).split('*').length % 2) && (best < 0 || Math.abs(k - t.length / 2) < Math.abs(best - t.length / 2))) best = k;
      if (best > 0) lines = [t.slice(0, best), t.slice(best + 1)];
    }
    const w = Math.max(o.w || 0, ...lines.map(len)), h = lines.length > 1 ? 54 : 34;
    x = Math.min(Math.max(x, w / 2 + 6), 514 - w / 2); const c = o.c ? `var(--${o.c})` : 'var(--card)', tc = o.c ? 'var(--card)' : 'var(--ink)';
    const tx = x + (o.tail === 'r' ? w / 4 : o.tail === 'c' ? 0 : -w / 4), dir = o.tail === 'r' ? 1 : o.tail === 'c' ? 0 : -1, st = o.c ? '' : 'stroke="var(--line)" stroke-width="1.5"';
    const fmt = u => H(u).replace(/\*([^*]+)\*/g, `<tspan fill="${o.c ? 'var(--card)' : 'var(--ac)'}" font-weight="800">$1</tspan>`);
    const txt = lines.length > 1 ? lines.map((u, k) => `<tspan x="${x}" dy="${k ? 19 : -5}">${fmt(u)}</tspan>`).join('') : fmt(t);
    return `<g><path d="M${tx - 7} ${y + h / 2 - 2}L${tx + 7} ${y + h / 2 - 2}L${tx + dir * 10} ${y + h / 2 + 11}Z" fill="${c}" ${st}/><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="17" fill="${c}" ${st}/>
<path d="M${tx - 6} ${y + h / 2 - 1}H${tx + 6}" stroke="${c}" stroke-width="3"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600" font-size="14.5" fill="${tc}">${txt}</text></g>`;
  },
  tag: (x, y, t, c) => `<g transform="translate(${x} ${y})"><rect x="${-(t.length * 4.7 + 14)}" y="-14" width="${t.length * 9.4 + 28}" height="27" rx="13.5" fill="var(--${c})"/><text y="4.5" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="14" fill="var(--card)">${H(t)}</text></g>`,
  notes: (x, y) => `<g opacity=".9"><path d="M${x} ${y}v-26l14-4v24" stroke="var(--dat)" stroke-width="2.4" fill="none"/><ellipse cx="${x - 4}" cy="${y}" rx="5" ry="4" fill="var(--dat)"/><ellipse cx="${x + 10}" cy="${y - 4}" rx="5" ry="4" fill="var(--dat)"/>
<path d="M${x + 34} ${y - 30}v-20" stroke="var(--akk)" stroke-width="2.4"/><ellipse cx="${x + 30}" cy="${y - 30}" rx="5" ry="4" fill="var(--akk)"/></g>`,
  table: (x, y, w) => `<g><rect x="${x - w / 2}" y="${y}" width="${w}" height="10" rx="4" fill="var(--wood)"/><rect x="${x - w / 2 + 12}" y="${y + 10}" width="8" height="${326 - y - 10}" fill="var(--wood)" opacity=".85"/><rect x="${x + w / 2 - 20}" y="${y + 10}" width="8" height="${326 - y - 10}" fill="var(--wood)" opacity=".85"/></g>`,
  cup: (x, y) => `<g><path d="M${x - 11} ${y - 22}h22l-3 22h-16z" fill="var(--card)" stroke="var(--ink)" stroke-width="1.5"/><path d="M${x + 11} ${y - 17}q9 0 7 8q-2 6-9 5" fill="none" stroke="var(--ink)" stroke-width="1.5"/><path d="M${x - 4} ${y - 28}q4-6 0-12M${x + 4} ${y - 28}q4-6 0-12" stroke="var(--mut)" stroke-width="1.6" fill="none" opacity=".7"/></g>`,
  plate: (x, y) => `<g><path d="M${x - 18} ${y - 5}q18-24 36 0z" fill="var(--nom)"/><circle cx="${x - 6}" cy="${y - 13}" r="3" fill="var(--die)"/><circle cx="${x + 6}" cy="${y - 11}" r="3" fill="var(--das)"/><ellipse cx="${x}" cy="${y - 3}" rx="26" ry="5" fill="var(--card)" stroke="var(--line)" stroke-width="1.5"/></g>`,
  boxes: (x, y) => `<g stroke="var(--ink)" stroke-opacity=".3" stroke-width="1.5"><rect x="${x - 34}" y="${y - 36}" width="68" height="36" rx="3" fill="var(--wood)"/><rect x="${x - 28}" y="${y - 70}" width="56" height="34" rx="3" fill="var(--floor)"/><rect x="${x - 22}" y="${y - 100}" width="44" height="30" rx="3" fill="var(--wood)"/>
<path d="M${x - 34} ${y - 18}h68M${x - 28} ${y - 53}h56M${x - 22} ${y - 85}h44" stroke="var(--card)" stroke-opacity=".6" stroke-width="3"/></g>`,
  cart: (x, y) => `<g><rect x="${x - 40}" y="${y - 104}" width="14" height="34" rx="3" fill="var(--card)" stroke="var(--ac)" stroke-width="2"/><circle cx="${x - 12}" cy="${y - 82}" r="12" fill="var(--die)"/><path d="M${x - 12} ${y - 94}q3-6 8-6" stroke="var(--das)" stroke-width="3" fill="none"/>
<path d="M${x + 2} ${y - 76}l30-34" stroke="var(--nom)" stroke-width="9" stroke-linecap="round"/><circle cx="${x + 26}" cy="${y - 84}" r="9" fill="var(--das)"/>
<path d="M${x - 50} ${y - 76}h84l-9 36h-67z" fill="var(--metal)" opacity=".35"/><path d="M${x - 76} ${y - 92}h16l10 62h70l12-46h-86" fill="none" stroke="var(--metal)" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="${x - 36}" cy="${y - 10}" r="9" fill="var(--ink)"/><circle cx="${x + 18}" cy="${y - 10}" r="9" fill="var(--ink)"/></g>`,
  guitar: (x, y, r = -35) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-4" y="-92" width="8" height="66" rx="2" fill="var(--wood)"/><rect x="-7" y="-104" width="14" height="16" rx="3" fill="var(--ink)"/>
<circle cx="0" cy="-14" r="17" fill="var(--nom)"/><circle cx="0" cy="12" r="22" fill="var(--nom)"/><circle cx="0" cy="-4" r="6" fill="var(--ink)"/><path d="M-2 -92V24M2 -92V24" stroke="var(--card)" stroke-width=".8" opacity=".8"/></g>`,
  car: (x, y, c = 'var(--die)') => `<g><path d="M${x - 78} ${y - 14}v-26q0-10 10-12l26-4l20-24q6-6 16-6h40q10 0 16 8l18 22q24 2 26 14v28z" fill="${c}"/>
<path d="M${x - 34} ${y - 58}l16-20h30v20zM${x + 18} ${y - 58}v-20h22l14 20z" fill="var(--sky1)" opacity=".9"/><circle cx="${x - 44}" cy="${y - 12}" r="15" fill="var(--ink)"/><circle cx="${x - 44}" cy="${y - 12}" r="6" fill="var(--metal)"/><circle cx="${x + 50}" cy="${y - 12}" r="15" fill="var(--ink)"/><circle cx="${x + 50}" cy="${y - 12}" r="6" fill="var(--metal)"/></g>`,
  bus: (x, y) => `<g><rect x="${x - 96}" y="${y - 108}" width="192" height="92" rx="14" fill="var(--nom)"/><rect x="${x - 96}" y="${y - 40}" width="192" height="8" fill="var(--ink)" opacity=".18"/>
<g fill="var(--sky1)"><rect x="${x - 84}" y="${y - 96}" width="36" height="34" rx="5"/><rect x="${x - 42}" y="${y - 96}" width="36" height="34" rx="5"/><rect x="${x}" y="${y - 96}" width="36" height="34" rx="5"/><rect x="${x + 44}" y="${y - 96}" width="40" height="52" rx="5"/></g>
<circle cx="${x - 56}" cy="${y - 14}" r="14" fill="var(--ink)"/><circle cx="${x + 54}" cy="${y - 14}" r="14" fill="var(--ink)"/><rect x="${x - 70}" y="${y - 124}" width="58" height="16" rx="4" fill="var(--ink)" opacity=".85"/><text x="${x - 41}" y="${y - 112}" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="var(--sun)">Linie 7</text></g>`,
  bike: (x, y) => `<g fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="${x - 40}" cy="${y - 26}" r="24" stroke="var(--ink)" stroke-width="4"/><circle cx="${x + 40}" cy="${y - 26}" r="24" stroke="var(--ink)" stroke-width="4"/>
<path d="M${x - 40} ${y - 26}l26-36h40l14 36M${x - 14} ${y - 62}l18 36l36 0M${x + 26} ${y - 62}l-4-14h12M${x - 20} ${y - 70}h14" stroke="var(--akk)" stroke-width="5"/></g>`,
  sign: (x, y, kind = 'P') => `<g><rect x="${x - 3}" y="${y - 150}" width="6" height="150" fill="var(--metal)"/><circle cx="${x}" cy="${y - 168}" r="30" fill="var(--der)" stroke="var(--bad)" stroke-width="8"/><path d="M${x - 20} ${y - 188}l40 40${kind === 'X' ? `M${x + 20} ${y - 188}l-40 40` : ''}" stroke="var(--bad)" stroke-width="8"/></g>`,
  stop: (x, y) => `<g><rect x="${x - 3}" y="${y - 130}" width="6" height="130" fill="var(--metal)"/><circle cx="${x}" cy="${y - 140}" r="20" fill="var(--sun)" stroke="var(--das)" stroke-width="4"/><text x="${x}" y="${y - 134}" text-anchor="middle" font-family="Inter,sans-serif" font-size="17" font-weight="800" fill="var(--das)">H</text></g>`,
  icon: (x, y, t, c) => `<g transform="translate(${x} ${y})"><circle r="26" fill="var(--${c}-s)" stroke="var(--${c})" stroke-width="2"/><text y="6" text-anchor="middle" font-family="Fraunces,serif" font-weight="700" font-size="17" fill="var(--${c})">${H(t)}</text></g>`,
  arrow: (d, c = 'var(--ac)') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="2.4" stroke-dasharray="5 6" stroke-linecap="round"/>`,
  dog: (x, y, o = {}) => { const c = o.c || 'var(--wood)', s = o.s || 1;
    return `<g transform="translate(${x} ${y}) scale(${o.flip ? -s : s} ${s})"><path d="M-32 -42q-16 -14 -10 -32" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/>
<rect x="-27" y="-30" width="10" height="30" rx="5" fill="${c}"/><rect x="-12" y="-30" width="10" height="30" rx="5" fill="${c}"/><rect x="12" y="-30" width="10" height="30" rx="5" fill="${c}"/><rect x="25" y="-30" width="10" height="30" rx="5" fill="${c}"/>
<ellipse cx="0" cy="-37" rx="37" ry="18" fill="${c}"/><circle cx="34" cy="-60" r="18" fill="${c}"/><ellipse cx="48" cy="-53" rx="12" ry="8.5" fill="var(--floor)"/><circle cx="58" cy="-56" r="4" fill="var(--ink)"/>
<path d="M23 -74q-12 4 -7 26q9 -6 11 -21z" fill="var(--hair2)"/><circle cx="39" cy="-64" r="2.6" fill="var(--ink)"/><path d="M22 -46q11 9 24 2" stroke="var(--die)" stroke-width="4.5" fill="none"/></g>`; },
  cat: (x, y, o = {}) => { const c = o.c || 'var(--pants)', s = o.s || 1;
    return `<g transform="translate(${x} ${y}) scale(${o.flip ? -s : s} ${s})"><path d="M18 -6q36 -2 26 -36" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="-27" rx="23" ry="28" fill="${c}"/>
<circle cx="0" cy="-64" r="18" fill="${c}"/><path d="M-16 -72l2 -19l13 11zM16 -72l-2 -19l-13 11z" fill="${c}"/><ellipse cx="-6" cy="-66" rx="3" ry="4" fill="var(--sun)"/><ellipse cx="6" cy="-66" rx="3" ry="4" fill="var(--sun)"/>
<path d="M-3 -57l3 3l3 -3" stroke="var(--die)" stroke-width="2" fill="none"/><path d="M-10 -58h-13M-10 -55l-12 4M10 -58h13M10 -55l12 4" stroke="var(--card)" stroke-width="1.2" opacity=".6"/></g>`; },
  bird: (x, y, c = 'var(--akk)') => `<g transform="translate(${x} ${y})"><path d="M-14 2l-14 5l5 -10z" fill="${c}"/><ellipse rx="17" ry="12" fill="${c}"/><circle cx="12" cy="-9" r="9" fill="${c}"/>
<path d="M20 -10l10 3l-10 4z" fill="var(--sun)"/><circle cx="15" cy="-11" r="2" fill="var(--ink)"/><path d="M-4 -3q-9 -15 -22 -8q9 2 11 11z" fill="var(--card)" opacity=".45"/><path d="M-2 11v7M4 11v7" stroke="var(--sun)" stroke-width="2"/></g>`,
  tree: (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-9" y="-110" width="18" height="110" rx="6" fill="var(--wood)"/><g fill="var(--hill1)"><circle cx="-34" cy="-122" r="34"/><circle cx="30" cy="-128" r="38"/><circle cx="-2" cy="-166" r="40"/></g><g fill="var(--hill2)" opacity=".7"><circle cx="-14" cy="-176" r="16"/><circle cx="34" cy="-140" r="14"/></g></g>`,
  gift: (x, y, c = 'var(--die)', w = 46) => `<g><rect x="${x - w / 2}" y="${y - w * .8}" width="${w}" height="${w * .8}" rx="4" fill="${c}"/><rect x="${x - w / 2 - 3}" y="${y - w * .8 - 8}" width="${w + 6}" height="11" rx="3" fill="${c}"/>
<rect x="${x - 4}" y="${y - w * .8 - 8}" width="8" height="${w * .8 + 8}" fill="var(--sun)"/><path d="M${x} ${y - w * .8 - 8}q-16 -16 -18 -2q4 6 18 2q16 4 18 -2q-2 -14 -18 2z" fill="var(--sun)"/></g>`,
  jacket: (x, y, c) => `<g><path d="M${x} ${y}v-8q0-6 6-6" stroke="var(--metal)" stroke-width="3" fill="none"/><path d="M${x - 26} ${y + 14}L${x} ${y}L${x + 26} ${y + 14}" stroke="var(--metal)" stroke-width="3" fill="none"/>
<path d="M${x - 24} ${y + 12}L${x - 36} ${y + 66}H${x - 24}L${x - 20} ${y + 40}V${y + 92}H${x + 20}V${y + 40}L${x + 24} ${y + 66}H${x + 36}L${x + 24} ${y + 12}L${x + 8} ${y + 6}L${x} ${y + 24}L${x - 8} ${y + 6}Z" fill="${c}"/><path d="M${x} ${y + 24}V${y + 92}" stroke="var(--card)" stroke-width="1.5" opacity=".6"/></g>`,
  apples: (x, y, n = 5) => Array.from({ length: n }, (_, i) => { const cx = x + (i % 3) * 18 - 18 + (i >= 3 ? 9 : 0), cy = y - 9 - (i >= 3 ? 15 : 0);
    return `<circle cx="${cx}" cy="${cy}" r="10" fill="var(--die)"/><path d="M${cx} ${cy - 10}v-5" stroke="var(--wood)" stroke-width="2"/><ellipse cx="${cx + 4}" cy="${cy - 13}" rx="4" ry="2" fill="var(--das)"/>`; }).join(''),
  bananas: (x, y) => [0, 1, 2].map(i => `<path d="M${x - 24 + i * 6} ${y - 6 - i * 7}q24 14 46 -10q-20 8 -46 4z" fill="var(--sun)" stroke="var(--nom)" stroke-width="1.5"/>`).join(''),
  oranges: (x, y) => [[-14, -9], [6, -9], [26, -9], [-4, -26], [16, -26]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="10" fill="var(--nom)"/>`).join('')
};

/* ---------- text helpers ---------- */
// {n:…} Nominativ, {d:…} Dativ, {a:…} Akkusativ, {e:…} Endung/wichtiger Teil, {v:…} Verb (Position 2), {t:…} Verbteil am Ende
const plain = s => s.replace(/\{p:[^}]*\}\s*/g, '').replace(/\[\[\^/g, '[[').replace(/\{[ndaevt]:([^}]*)\}/g, '$1').replace(/\(\(([^|)]*)[^)]*\)\)/g, '$1').replace(/\[\[([^\]|]*)[^\]]*\]\]/g, '$1').replace(/\[|\]/g, '');
const wrapWords = t => H(t).replace(/[A-Za-zÄÖÜäöüß]+/g, w => `<span class="gw">${w}</span>`);
function fmt(s) {
  let out = '', last = 0, m; const re = /\{([ndaevt]):([^}]*)\}/g;
  while ((m = re.exec(s))) {
    const before = s.slice(last, m.index), glued = m[1] === 'e' && /[A-Za-zÄÖÜäöüß]$/.test(before);
    // an ending glued to its stem: keep the whole word tappable as one
    if (glued) { const wm = /[A-Za-zÄÖÜäöüß]+$/.exec(before); out += wrapWords(before.slice(0, wm.index)) + `<span class="gw">${H(wm[0])}<span class="cs e">${H(m[2])}</span></span>`; }
    else out += wrapWords(before) + `<span class="cs ${m[1]}">${m[1] === 'e' ? H(m[2]) : wrapWords(m[2])}</span>`;
    last = re.lastIndex;
  }
  return out + wrapWords(s.slice(last));
}
// highlight markup inside text that may already contain HTML (notes under tables, card texts)
const rich = s => String(s == null ? '' : s).replace(/\{([ndaevt]):([^}]*)\}/g, (m, k, t) => `<span class="cs ${k}">${t}</span>`);
const sayBtn = s => `<button class="gr-say" data-say="${H(plain(s))}" title="Anhören" aria-label="Anhören">${icn('volume-2')}</button>`;
function talk(t) { if (typeof speak === 'function') speak(t); }
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sentenceNorm = (s, commas = false) => commas ? s.normalize('NFC').replace(/[.!?;:„“\"'»«]/g, ' ').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim() : norm(s);
const norm = s => s.replace(/[.,!?;:„“"'»«]/g, ' ').replace(/\s+/g, ' ').trim();

/* ---------- dictionary look-up for tapped words ---------- */
const BASEL = { dem: 'der', den: 'der', des: 'der', die: 'der', das: 'der', einem: 'ein', einen: 'ein', einer: 'ein', eine: 'ein', eines: 'ein',
  mir: 'ich', mich: 'ich', dir: 'du', dich: 'du', ihm: 'er', ihn: 'er', ihnen: 'sie', Ihnen: 'Sie', uns: 'wir', euch: 'ihr', es: 'es',
  bin: 'sein', bist: 'sein', ist: 'sein', sind: 'sein', seid: 'sein', war: 'sein', hast: 'haben', hat: 'haben', habt: 'haben',
  kann: 'können', kannst: 'können', könnt: 'können', muss: 'müssen', musst: 'müssen', müsst: 'müssen', darf: 'dürfen', darfst: 'dürfen', dürft: 'dürfen',
  will: 'wollen', willst: 'wollen', wollt: 'wollen', soll: 'sollen', sollst: 'sollen', sollt: 'sollen', möchte: ['möchten', 'mögen'], möchtest: ['möchten', 'mögen'], möchtet: ['möchten', 'mögen'],
  isst: 'essen', iss: 'essen', gibst: 'geben', gibt: 'geben', gib: 'geben', nimmst: 'nehmen', nimmt: 'nehmen', nimm: 'nehmen', liest: 'lesen', lies: 'lesen', siehst: 'sehen', sieht: 'sehen',
  sprichst: 'sprechen', spricht: 'sprechen', hilfst: 'helfen', hilft: 'helfen', hilf: 'helfen', triffst: 'treffen', trifft: 'treffen', vergisst: 'vergessen', fährst: 'fahren', fährt: 'fahren',
  schläfst: 'schlafen', schläft: 'schlafen', läufst: 'laufen', läuft: 'laufen', trägst: 'tragen', trägt: 'tragen', wäscht: 'waschen', hält: 'halten', sei: 'sein', seien: 'sein', weißt: 'wissen', weiß: 'wissen' };
function findWord(w) {
  if (typeof WIDX === 'undefined' || !WIDX.size) return null;
  const L = Object.assign({}, BASEL, (cur && cur.lemmas) || {});
  const lw = w.toLowerCase(), cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const c = [].concat(L[w] || [], w, L[lw] || [], lw, cap(lw), lw + 'en', lw + 'n');
  for (const suf of ['st', 'est', 't', 'et', 'e', 'en', 'n', 'em', 'er', 'es', 's']) if (lw.endsWith(suf) && lw.length - suf.length >= 3) {
    const st = lw.slice(0, -suf.length); c.push(st + 'en', st + 'n', st, cap(st), cap(st) + 'e');
  }
  for (const x of c) if (x && WIDX.has(x)) return WIDX.get(x);
  return null;
}
function closePop() { const p = $('grpop'); if (p) p.remove(); }
async function pop(el) {
  closePop();
  if(typeof ensureDefinitions==='function'&&!FULL){
    const wait=document.createElement('div');wait.id='grpop';wait.className='gr-pop';wait.textContent='Wörterbuch wird geladen …';document.body.append(wait);
    try{await ensureDefinitions()}catch{
      if(document.getElementById('grpop')===wait){wait.textContent='Wörterbuch konnte nicht geladen werden. ';const retry=document.createElement('button');retry.className='btn sm';retry.textContent='Erneut versuchen';retry.onclick=()=>pop(el);wait.append(retry)}return;
    }
    if(!document.contains(el)||document.getElementById('grpop')!==wait)return;
    wait.remove();
  }
  const w = el.textContent, i = findWord(w), r = el.getBoundingClientRect(), d = document.createElement('div');
  d.id = 'grpop'; d.className = 'gr-pop';
  if (typeof E === 'undefined' || !E.length) d.innerHTML = `<p style="margin:0">Das Wörterbuch lädt noch …</p>`;
  else if (i == null) d.innerHTML = `<div class="hw">${H(w)}</div><p>Kein eigener Eintrag – vielleicht eine gebeugte Form.</p><a class="btn sm" href="#/" onclick="setTimeout(()=>{const q=document.getElementById('q');if(q){q.value=${H(JSON.stringify(w))};q.dispatchEvent(new Event('input'))}},60)">${icn('search')} Suchen</a>`;
  else {
    const e = E[i], g = typeof gloss === 'function' ? gloss(e) : '';
    const ar = e.ar ? `<span style="color:${typeof gcol === 'function' ? gcol(e.ar) : 'inherit'}">${H(e.ar)}</span> ` : '';
    d.innerHTML = `<div class="hw">${ar}${H(plainW ? plainW(e.w) : e.w)}<button class="gr-say" onclick="say(${i},this)" title="Anhören">${icn('volume-2')}</button></div>
      <div class="ps">${H((typeof POSL !== 'undefined' && POSL[e.ps]) || e.ps || '')}</div><p>${H(g || (typeof FULL !== 'undefined' && !FULL ? 'Bedeutung wird geladen …' : ''))}</p>
      <a class="btn sm primary" href="#/w/${encodeURIComponent(e.w)}">${icn('book-open')} Im Wörterbuch öffnen</a>`;
  }
  document.body.appendChild(d);
  const W = d.offsetWidth, left = Math.max(12, Math.min(window.scrollX + r.left + r.width / 2 - W / 2, window.scrollX + document.documentElement.clientWidth - W - 12));
  d.style.left = left + 'px'; d.style.top = (window.scrollY + r.bottom + 8) + 'px';
  icons();
}

/* ---------- results: local + Supabase ---------- */
const LKEY = 'gd_gram';
let unsavedState=null;
function store() {
  if(unsavedState)return structuredClone(unsavedState);
  try { return JSON.parse(localStorage.getItem(LKEY) || 'null') || {att:[]}; }
  catch { return {att:[]}; }
}
let bestCache = null;
function save(state) {
  bestCache = null;
  try { localStorage.setItem(LKEY, JSON.stringify(state)); unsavedState=null; }
  catch { unsavedState=structuredClone(state); if (window.toast) toast('Gerätespeicher voll. Bitte diese Seite geöffnet lassen und die Ergebnisse synchronisieren.'); }
}
const acct = () => window.ACCT && ACCT.user && ACCT.user();
let remote = null, remoteUser = null, noTable = false, syncError = false;
const attemptKey = a => a.aid || [a.ch,a.ex,a.at].join('|');
function attempts() {
  const user = acct();
  const local = store().att.filter(a => !a.uid || a.uid === user?.id);
  const rows = user && remoteUser === user.id && remote || [];
  const keys = new Set(rows.map(attemptKey));
  const old = new Set(rows.map(a => [a.ch,a.ex,a.at].join('|')));
  return rows.concat(local.filter(a => !keys.has(attemptKey(a)) && (a.aid || !old.has([a.ch,a.ex,a.at].join('|')))));
}
function best(ch, ex) {
  if (!bestCache) {
    bestCache = new Map();
    for (const attempt of attempts()) {
      const key = attempt.ch + '/' + attempt.ex, previous = bestCache.get(key);
      if (!previous || attempt.score / attempt.total > previous.score / previous.total) bestCache.set(key, attempt);
    }
  }
  return bestCache.get(ch + '/' + ex);
}
function record(attempt) {
  const state = store(), user = acct();
  Object.assign(attempt,{aid:crypto.randomUUID(),uid:user?.id||null,sent:false});
  state.att.push(attempt);
  // Retain pending uploads even when the completed device history is full.
  const completed = state.att.filter(a => a.sent).slice(-2000);
  state.att = completed.concat(state.att.filter(a => !a.sent));
  save(state); sync(); paintSyncStatus();
}
let syncing = null, retrySync = null;
function syncStatus() {
  const user = acct();
  const pending = store().att.filter(a => !a.sent && (!a.uid || a.uid === user?.id)).length;
  return pending ? (syncError ? 'Noch nicht synchronisiert. Ergebnisse bleiben auf diesem Gerät. ' : 'Ergebnisse werden synchronisiert … ') :
    syncError ? 'Ergebnisse konnten nicht aktualisiert werden. ' : '';
}
function paintSyncStatus() {
  const holder = V().querySelector('.gr-ch,.gr-top,#grpv');
  if (!holder) return;
  let notice = V().querySelector('.gr-sync');
  const text = syncStatus();
  if (!text || !acct()) { notice?.remove(); return; }
  if (!notice) { notice = document.createElement('p'); notice.className = 'gr-note gr-sync'; notice.style.display = 'block'; notice.setAttribute('role','status'); holder.prepend(notice); }
  notice.textContent = text;
  if (syncError) { const retry=document.createElement('button');retry.className='btn sm';retry.textContent='Erneut versuchen';retry.onclick=()=>{pull().then(()=>sync())};notice.append(retry); }
}
function sync() {
  if (syncing) return syncing;
  const user = acct();
  if (!user || !ACCT.api) return Promise.resolve();
  clearTimeout(retrySync);
  const state = store(), pending = state.att.filter(a => !a.sent && (!a.uid || a.uid === user.id));
  if (!pending.length) return Promise.resolve();
  for (const a of pending) { a.aid ||= crypto.randomUUID(); a.uid = user.id; }
  save(state);
  const batch = pending.slice(0,100);
  syncing = (async()=>{
    const token = await ACCT.token();
    if (acct()?.id !== user.id) return;
    await ACCT.api('/rest/v1/grammar_results?on_conflict=user_id,attempt_id', {
      method:'POST',token,headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},
      body:batch.map(a=>({user_id:user.id,attempt_id:a.aid,chapter:a.ch,exercise:a.ex,score:a.score,total:a.total,
        passed:a.passed,answers:a.ans||null,created_at:new Date(a.at).toISOString()}))
    });
    const ids=new Set(batch.map(a=>a.aid)), updated=store();
    for (const a of updated.att) if (a.uid===user.id && ids.has(a.aid)) a.sent=true;
    save(updated);
    if (acct()?.id === user.id) { syncError=false; await pull(); }
  })().catch(()=>{if (acct()?.id === user.id) syncError=true})
    .finally(()=>{
      syncing=null;paintSyncStatus();
      if (acct()?.id === user.id) retrySync=setTimeout(sync,syncError?15000:300);
    });
  return syncing;
}
async function pull() {
  const user = acct();
  if (!user || !ACCT.api) { remote=null;remoteUser=null;bestCache=null;return; }
  try {
    const rows=await ACCT.resultRows('&user_id=eq.'+user.id);
    if (acct()?.id !== user.id) return;
    remote=rows.map(r=>({aid:r.attempt_id,ch:r.chapter,ex:r.exercise,score:r.score,total:r.total,passed:r.passed,at:Date.parse(r.created_at),uid:user.id}));
    remoteUser=user.id;noTable=false;syncError=false;bestCache=null;
  } catch (e) { if (acct()?.id !== user.id) return; syncError=true;noTable=!!(e.status===404||e.code==='42P01'||e.code==='PGRST205'); }
  paintSyncStatus();
}
window.addEventListener('acct:in',()=>{remote=null;remoteUser=null;bestCache=null;noTable=false;pull().then(sync)});
window.addEventListener('acct:out',()=>{remote=null;remoteUser=null;bestCache=null;noTable=false;syncError=false;clearTimeout(retrySync)});
window.addEventListener('storage',event=>{if (event.key===LKEY) {bestCache=null;paintSyncStatus()}});
window.addEventListener('online',()=>pull().then(sync));
window.addEventListener('beforeunload',event=>{if(unsavedState){event.preventDefault();event.returnValue=''}});
function chapterProgress(c) {
  if (!c) return { passed: 0, total: 0 };
  const g = c.exercises.filter(x => x.graded !== false); let passed = 0;
  for (const x of g) { const b = best(c.n, x.id); if (b && b.score / b.total >= PASS) passed++; }
  return { passed, total: g.length };
}
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
function ring(p, size = 46) {
  const r = size / 2 - 4, C = 2 * Math.PI * r;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="5"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--ok)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p / 100)}" transform="rotate(-90 ${size / 2} ${size / 2})" style="transition:stroke-dashoffset .6s"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="${size / 4}" font-weight="700" fill="var(--fg)" font-family="Inter,sans-serif">${p}%</text></svg>`;
}

/* ---------- overview: Grammatik (#/g) and Wortschatz (#/v) are separate sections ---------- */
let mode = 'g';                                         // 'g' Grammatik, 'v' Wortschatz
const isV = n => !!chInfo(n)?.g.vocab;
const hashOf = n => (isV(n) ? '#/v/' : '#/g/') + n;
const onCh = n => location.hash === hashOf(n) || location.hash.startsWith(hashOf(n) + '/');
const groupsOf = m => GROUPS.filter(g => !!g.vocab === (m === 'v'));
const readyOf = m => Object.keys(READY).map(Number).filter(n => isV(n) === (m === 'v'));
const filt = { g: { lv: '', q: '' }, v: { lv: '', q: '' } };
const TKEY = 'gd_toc';
function tocState() { try { return JSON.parse(localStorage.getItem(TKEY) || '{}') || {}; } catch (e) { return {}; } }
function tocSave(st) { try { localStorage.setItem(TKEY, JSON.stringify(st)); } catch (e) {} }
function exLabel(c, x) {
  if (!c.vocab) return 'Übung ' + (c.exercises.indexOf(x) + 1);
  const list = c.exercises.filter(e => !!e.more === !!x.more), k = list.indexOf(x) + 1;
  return x.more ? 'Extra ' + k : 'Übung ' + k;
}
function overview(m) {
  mode = m;
  const F = filt[m], gs = groupsOf(m), lv = ['A1', 'A2', 'B1', 'B2', 'C1'];
  const all = gs.reduce((t, g) => t + (g.ref ? 0 : g.ch.length), 0), ready = readyOf(m).filter(n => !isRef(n)).length;
  const passedEx = new Set(attempts().filter(x => isV(x.ch) === (m === 'v') && x.score / x.total >= PASS).map(x => x.ch + '/' + x.ex)).size;
  const T = m === 'v'
    ? { eye: 'A1 · A2 · B1 · B2 · C1', h: 'Wortschatz', p: 'Die Wörter für jedes Niveau, nach Themen geordnet – mit Wortliste, Bildern, Aussprache, echten Beispielsätzen auf Deutsch und Englisch und Übungen.', unit: 'Themen', art: ART.vcover() }
    : { eye: 'A1 · A2 · B1 · B2 · C1', h: 'Grammatik', p: 'Alle Themen von A1 bis C1 – mit Bildern, Beispielen zum Anhören und Übungen, die sofort sagen, was richtig ist.', unit: 'Kapitel', art: ART.cover() };
  V().innerHTML = `
  <section class="gr-top"><div><p class="gr-eyebrow">${T.eye}</p><h1>${T.h}</h1><p>${T.p}</p>
    <div class="gr-stats"><span class="gr-stat"><b>${all}</b>${T.unit}</span><span class="gr-stat"><b>${ready}</b>schon fertig</span><a class="gr-stat" href="#/${m}/fortschritt" style="text-decoration:none"><b>${passedEx}</b>Übungen bestanden →</a></div></div>
    <div class="gr-topart">${T.art}</div></section>
  ${m === 'v' ? `<a class="gr-feat" href="#/v/201"><span class="th" id="vkfeat"></span><span><span class="gr-lv A1">A1</span> <span class="gr-eyebrow" style="display:inline">Hier anfangen</span><b>Thema 1: Person</b><p>Themen für A1, A2, B1 und C1 – mit Wortliste, Bildern, Aussprache und Übungen. Wählen Sie Wörter aus und machen Sie daraus mit einem Klick Lernkarten.</p></span></a>`
    : `<a class="gr-feat" href="#/g/1"><span class="th" id="grfeat"></span><span><span class="gr-lv A1">A1</span> <span class="gr-eyebrow" style="display:inline">Hier anfangen</span><b>Kapitel 1: Personalpronomen</b><p>Kapitel von A1 bis C1 – mit Erklärungen, Beispielen, Übungen, Sprechtraining und Spiel. Dazu Verblisten mit Trainer.</p></span></a>`}
  <div class="gr-filter">${['', ...lv].map(l => `<button class="gr-chip${F.lv === l ? ' on' : ''}" data-lv="${l}">${l && !lvOpen(l) ? icn('lock') : ''}${l || 'Alle'}</button>`).join('')}
    <input id="grq" placeholder="${m === 'v' ? 'Thema suchen, z. B. Familie' : 'Thema suchen, z. B. Perfekt'}" value="${H(F.q)}" autocomplete="off"></div>
  <div class="gr-tocbar"><b>Inhalt</b><span class="spacer"></span><button class="btn sm" data-toc="open">${icn('chevrons-up-down')} Alles aufklappen</button><button class="btn sm" data-toc="close">${icn('chevrons-down-up')} Alles zuklappen</button></div>
  <div id="grlist"></div>`;
  list();
  V().querySelectorAll('[data-lv]').forEach(b => b.onclick = () => { F.lv = b.dataset.lv; V().querySelectorAll('[data-lv]').forEach(x => x.classList.toggle('on', x === b)); list(); });
  $('grq').oninput = e => { F.q = e.target.value; list(); };
  icons();
}
// what a chapter contains – shown when its row is opened
function chapterSummary(n) {
  const info = chInfo(n), rows = LESSON_EXERCISES[n];
  return info && rows ? {n, title:info.c[1],level:info.c[3],vocab:!!info.g.vocab,
    exercises:rows.map(([id,title,flags])=>({id,title,more:!!(flags&1),graded:!(flags&2)}))} : null;
}
function contents(n) {
  const c = chapterSummary(n); if (!c) return `<p class="gr-clw">Inhalt wird geladen …</p>`;
  const h = hashOf(n), parts = c.vocab ? [['grs-l', 'Wortliste', 'list'], ['grs-t', 'Tipps', 'lightbulb']] : [['grs-v', 'Verstehen', 'lightbulb'], ['grs-b', 'Beispiele', 'quote']];
  const ex = c.exercises.map(x => { const b = best(n, x.id), ok = b && b.score / b.total >= PASS;
    return `<a href="${h}/ue-${x.id}"><span class="k">${exLabel(c, x)}</span><span class="t">${H(x.title)}</span>${x.graded === false ? '<span class="pc">ohne Note</span>' : ok ? `<span class="ok">${icn('circle-check')}</span>` : b ? `<span class="pc">${pct(b.score, b.total)} %</span>` : ''}</a>`; }).join('');
  return `<div class="gr-cl">${parts.map(p => `<a href="${h}/${p[0]}">${icn(p[2])}<span class="t">${p[1]}</span></a>`).join('')}${ex}<a href="${h}/grs-s">${icn('mic')}<span class="t">Sprechen</span></a></div>`;
}
function list() {
  const m = mode, F = filt[m], f = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), q = f(F.q.trim()), st = tocState(), searching = !!q || !!F.lv;
  let html = '';
  for (const g of groupsOf(m)) {
    const cs = g.ch.filter(c => (!F.lv || c[3] === F.lv) && (!q || f(c[1] + ' ' + c[2] + ' ' + g.t).includes(q)));
    if (!cs.length && (searching && !(g.soon && F.lv === g.lv))) continue;
    const gk = m + ':' + g.t, open = searching || (st[gk] != null ? st[gk] === 1 : !!g.open);
    const glv = g.lv || (g.ch.length && g.ch.every(c => c[3] === g.ch[0][3]) ? g.ch[0][3] : null);
    if (glv && !g.soon && !lvOpen(glv) && g.ch.every(c => !allowed(c[0]))) {
      html += `<div class="gr-acc locked" style="--h:${g.h}"><div class="gr-lockrow"><span class="badge">${icn('lock')}</span><span class="gr-gt">${H(g.t)}</span><span class="gr-lv ${glv}">${glv}</span>
        <small>${g.ch.length} ${g.vocab ? 'Themen' : 'Kapitel'} · ${KONTO.lvState(glv) === 'pending' ? (en() ? 'waiting for your teacher' : 'wartet auf Freischaltung') : (en() ? 'locked' : 'gesperrt')}</small>${lockBtn(glv)}</div></div>`;
      continue;
    }
    const done = g.ch.filter(c => READY[c[0]] && (p => p.total && p.passed === p.total)(chapterProgress(chapterSummary(c[0])))).length;
    const lvls = [...new Set(g.ch.map(c => c[3]))].filter(l => l !== 'Liste');
    html += `<details class="gr-acc" data-k="${H(gk)}" style="--h:${g.h}"${open ? ' open' : ''}><summary><span class="badge">${icn(g.ic)}</span><span class="gr-gt">${H(g.t)}</span>
      <span class="gr-gl">${lvls.map(l => `<span class="gr-lv ${l}">${l}</span>`).join('')}</span><small>${g.soon ? 'kommt bald' : `${g.ch.length} ${g.vocab ? 'Themen' : 'Kapitel'}${done ? ` · ${done} geschafft` : ''}`}</small><span class="chev">${icn('chevron-down')}</span></summary>
      <div class="gr-rows">${g.soon ? `<p class="gr-clw">Die Themen für ${g.lv} sind in Arbeit.</p>` : cs.map(c => {
        const n = c[0], summary = chapterSummary(n), ok = READY[n] && !!summary, pr = ok ? chapterProgress(summary) : null, all = pr && pr.total && pr.passed === pr.total, ck = 'c:' + n, copen = ok && st[ck] === 1;
        const body = `<span class="gr-num">${numLabel(n)}</span><span class="gr-ct"><b>${H(c[1])}</b><small>${H(c[2])}</small></span>${pr && pr.passed ? `<span class="gr-pp">${pr.passed}/${pr.total}</span>` : ''}${all ? `<span class="gr-done" title="Alle Übungen bestanden">${icn('circle-check')}</span>` : ''}<span class="gr-lv ${c[3]}">${c[3]}</span>`;
        if (!ok) return `<div class="gr-row soon"><div class="gr-card soon" title="Kommt bald">${body}</div></div>`;
        if (!allowed(n)) return `<div class="gr-row soon"><div class="gr-card soon" title="Ab Niveau ${c[3]}">${body}<span class="gr-pp">${icn('lock')} ${c[3]}</span></div></div>`;
        return `<div class="gr-row${copen ? ' open' : ''}" data-n="${n}"><a class="gr-card ready" href="${hashOf(n)}">${body}</a><button class="gr-exp" data-exp="${n}" aria-expanded="${copen}" title="Inhalt zeigen">${icn('chevron-down')}</button>
          <div class="gr-clbox"${copen ? '' : ' hidden'}>${copen ? contents(n) : ''}</div></div>`;
      }).join('')}</div></details>`;
  }
  if (!$('grlist')) return;
  $('grlist').innerHTML = html || `<p class="sub" style="margin:1rem 0">Kein Thema gefunden.</p>`;
  icons();
}
function tocAll(open) {
  const st = tocState();
  V().querySelectorAll('.gr-acc').forEach(d => { d.open = open; st[d.dataset.k] = open ? 1 : 0; });
  V().querySelectorAll('.gr-row[data-n]').forEach(r => { const n = +r.dataset.n; st['c:' + n] = open ? 1 : 0; rowOpen(r, open); });
  tocSave(st); icons();
}
function rowOpen(r, open) {
  const n = +r.dataset.n, box = r.querySelector('.gr-clbox'), b = r.querySelector('.gr-exp');
  r.classList.toggle('open', open); b.setAttribute('aria-expanded', open); box.hidden = !open;
  if (open) { box.innerHTML = contents(n); icons(); }
}

/* ---------- progress page ---------- */
async function progressView(m) {
  V().innerHTML = `<div class="row" style="margin-bottom:.6rem"><a class="btn sm" href="#/${m}">${icn('arrow-left')} ${m === 'v' ? 'Wortschatz' : 'Grammatik'}</a></div>
    <h1 class="page">Mein Fortschritt · ${m === 'v' ? 'Wortschatz' : 'Grammatik'}</h1><div id="grpv"><div class="loading"><div class="spin"></div>Ergebnisse werden geladen …</div></div>`;
  icons();
  await pull(); if (!location.hash.startsWith('#/' + m + '/fortschritt')) return;
  const me = acct(), at = attempts(), L = myLevel();
  let rows = L ? `<tr><td colspan="5" class="sub">Für deine Note zählen die ${m === 'v' ? 'Themen' : 'Kapitel'} auf deinem Niveau ${H(L)} (dazu die Aufgaben deiner Lehrkraft).</td></tr>` : '';
  for (const n of readyOf(m).filter(n => !L || chLevel(n) === L || !LVS.includes(chLevel(n)))) {
    const c = chapterSummary(n); if (!c) continue;
    rows += `<tr class="gr-ph"><td colspan="5"><a href="${hashOf(n)}"><b>${isV(n) ? 'Thema ' + topicNo(n) : isRef(n) ? 'Nachschlagen' : 'Kapitel ' + gNo(n)}</b> · ${H(c.title)}</a> <span class="gr-lv ${c.level}">${c.level}</span></td></tr>`;
    for (const x of c.exercises.filter(x => x.graded !== false)) {
      const mine = at.filter(a => a.ch === n && a.ex === x.id), b = best(n, x.id), last = mine[mine.length - 1];
      const p = b ? pct(b.score, b.total) : 0, ok = b && b.score / b.total >= PASS;
      rows += `<tr><td><a href="${hashOf(n)}/ue-${x.id}" style="color:inherit">${H(x.title)}</a></td>
        <td>${b ? `<div class="gr-bar"><i class="${ok ? '' : 'f'}" style="width:${p}%"></i></div><small>${p} % (${b.score}/${b.total})</small>` : '<small class="muted">noch nicht geübt</small>'}</td>
        <td class="hide-s">${mine.length}</td><td class="hide-s"><small>${last ? new Date(last.at).toLocaleDateString('de-DE') : '–'}</small></td>
        <td>${b ? (ok ? `<span class="gr-ueb pass">${icn('check')} bestanden</span>` : `<span class="gr-ueb fail">unter ${Math.round(PASS * 100)} %</span>`) : ''}</td></tr>`;
    }
  }
  $('grpv').innerHTML = `<p class="sub">${me ? 'Deine Ergebnisse werden in deinem Konto gespeichert und sind auf allen Geräten da.' : 'Du bist nicht angemeldet: Die Ergebnisse sind nur in diesem Browser gespeichert. Melde dich an, dann werden sie in deinem Konto gesichert.'}
    Bestanden ist eine Übung ab ${Math.round(PASS * 100)} % richtigen Antworten.</p>
    ${!me && window.ACCT ? `<p><button class="btn primary" onclick="ACCT.open()">${icn('user-round')} Anmelden</button></p>` : ''}
    ${noTable && me ? `<p class="gr-note" style="display:block">Die Ergebnis-Tabelle ist noch nicht eingerichtet – die Ergebnisse bleiben vorerst in diesem Browser.</p>` : ''}
    <div class="gr-tblw"><table class="gr-ptab"><thead><tr><th>Übung</th><th>Bestes Ergebnis</th><th class="hide-s">Versuche</th><th class="hide-s">Zuletzt</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  icons();
}

/* ---------- chapter ---------- */
let lessonEpoch = 0;
const lessonLoads = new Map();
function clearLessons() {
  lessonEpoch++;
  lessonLoads.clear();
  for (const n of Object.keys(CH)) delete CH[n];
  cur = null;
}
window.addEventListener('acct:in', clearLessons);
window.addEventListener('acct:out', clearLessons);
async function loadChapter(n) {
  const user = acct(), epoch = lessonEpoch;
  if (!user || !allowed(n)) throw new Error('Enrolment required');
  // Authorize every opening, including a previously loaded lesson, so a revoked level closes.
  if (lessonLoads.has(n)) return lessonLoads.get(n);
  const current = () => epoch === lessonEpoch && acct()?.id === user.id && allowed(n);
  const loading = (async () => {
    const token = await ACCT.token();
    if (!current()) throw new Error('account changed');
    const response = await fetch(APP_CONFIG.supabaseUrl + '/functions/v1/lessons?chapter=' + encodeURIComponent(n), {
      headers: { apikey: APP_CONFIG.supabaseKey, Authorization: 'Bearer ' + token }, cache: 'no-store',
    });
    if (!current()) throw new Error('account changed');
    if (!response.ok) {
      delete CH[n];
      const error = new Error(response.status === 401 || response.status === 403 ? 'Enrolment required' : 'Lesson unavailable');
      error.status = response.status; throw error;
    }
    const source = await response.text();
    if (!current()) throw new Error('account changed');
    if (CH[n]) return CH[n];
    const url = URL.createObjectURL(new Blob(['if (window.GRAM.lessonEpoch() === ' + epoch + ') {\n' + source + '\n}'], { type: 'text/javascript' }));
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script'); script.src = url;
        script.onload = () => { script.remove(); resolve(); };
        script.onerror = () => { script.remove(); reject(new Error('Lesson unavailable')); };
        // The script itself checks its captured epoch before registering any content.
        document.head.appendChild(script);
      });
    } finally { URL.revokeObjectURL(url); }
    if (!current()) { delete CH[n]; throw new Error('account changed'); }
    if (!CH[n]) throw new Error('Empty lesson');
    return CH[n];
  })();
  lessonLoads.set(n, loading);
  try { return await loading; } finally { if (lessonLoads.get(n) === loading) lessonLoads.delete(n); }
}
function jump(anchor) {
  const el = anchor && $(anchor); if (!el) return;
  const sec = el.closest('.gr-sec'); if (sec) sec.classList.remove('closed');
  const go = () => { const y = el.getBoundingClientRect().top + window.scrollY - 118; window.scrollTo(0, Math.max(0, y)); };
  setTimeout(go, 60); setTimeout(go, 500);
}
async function chapter(n, anchor) {
  const back = `<div class="row" style="margin-bottom:.6rem"><a class="btn sm" href="#/${isV(n) ? 'v' : 'g'}">${icn('arrow-left')} ${isV(n) ? 'Wortschatz' : 'Grammatik'}</a></div>`;
  if (READY[n] && !allowed(n)) { const l = chLevel(n); V().innerHTML = `${back}<div class="empty"><span class="em">${icn('lock')}</span><h1 class="page">${en() ? 'Level' : 'Niveau'} ${H(l)} ${en() ? 'is locked' : 'ist gesperrt'}</h1><p class="sub">${window.KONTO && KONTO.org() ? (en() ? 'Your teacher unlocks new levels for you.' : 'Neue Niveaus schaltet deine Lehrkraft für dich frei.') : (en() ? `Enroll in ${l} to open this ${isV(n) ? 'topic' : 'chapter'}.` : `Schreib dich für ${l} ein, um dieses ${isV(n) ? 'Thema' : 'Kapitel'} zu öffnen.`)}</p><p>${lockBtn(l)}</p></div>`; icons(); return; }
  if (!READY[n]) { V().innerHTML = `${back}<div class="empty"><span class="em">${icn('hourglass')}</span><h1 class="page">${isV(n) ? 'Dieses Thema' : 'Kapitel ' + n} kommt bald</h1><p class="sub">Daran wird gerade gearbeitet.</p></div>`; icons(); return; }
  V().innerHTML = `<div class="loading"><div class="spin"></div>${en() ? 'Loading lesson …' : 'Kapitel wird geladen …'}</div>`;
  try { await loadChapter(n); } catch (e) {
    if (!onCh(n)) return;
    V().innerHTML = `${back}<div class="empty"><span class="em">⚠️</span>${e.status === 401 || e.status === 403
      ? (en() ? 'Sign in and enrol in this level to open the lesson.' : 'Bitte anmelden und für dieses Niveau einschreiben.')
      : (en() ? 'The lesson could not be loaded. Please check your connection and try again.' : 'Das Kapitel konnte nicht geladen werden. Bitte prüfe die Verbindung und versuche es erneut.')}</div>`;
    return;
  }
  if (!onCh(n)) return;
  if (cur !== CH[n] || !V().querySelector('.gr-ch')) render(CH[n]);
  jump(anchor);
  pull().then(() => { if (cur === CH[n] && onCh(n)) { refreshBadges(); sync(); } });
}
function render(c) {
  cur = c;
  if (c.vocab) { renderVocab(c); return; }
  for (const x of c.exercises) if (x.gen) x.items = x.gen();
  if (c.speak && c.speak.gen) c.speak.items = c.speak.gen(); const info = chInfo(c.n), pr = chapterProgress(c);
  const blocks = c.understand.map(block).join('');
  const hasExamples=!!c.examples?.length,hasSpeak=!!c.speak?.items?.length;
  V().innerHTML = `<div class="row" style="margin-bottom:.6rem"><a class="btn sm" href="#/g">${icn('arrow-left')} Grammatik</a></div>
  <article lang="de" class="gr-ch">
   <div class="gr-hero"><div>
     <p class="gr-eyebrow">${isRef(c.n) ? 'Nachschlagen und trainieren' : `Kapitel ${gNo(c.n)} · ${H(c.group)}`} · <span class="gr-lv ${c.level}">${c.level}</span></p>
     <h1>${H(c.title)}</h1><p class="gr-kick">${H(c.kicker)}</p><p class="gr-intro">${rich(c.intro)}</p>
     <div class="gr-prog" id="grprog">${progHTML(pr)}</div>
     <div class="row" style="margin-top:.8rem"><button class="btn sm" onclick="GRAM.practice('solo')">${icn('gamepad-2')} Im Spiel üben</button></div></div>
     <figure class="gr-art">${typeof c.art === 'function' ? c.art(K) : c.scene ? window.GRAM_ART.draw(K,c.scene) : ART[c.art] ? ART[c.art]() : ''}<figcaption><span>${fmt(c.hero)}</span>${sayBtn(c.hero)}</figcaption></figure>
   </div>
   <nav class="gr-toc"><a href="#grs-v" data-jump>${icn('lightbulb')} Verstehen</a>${hasExamples?`<a href="#grs-b" data-jump>${icn('quote')} Beispiele</a>`:''}<a href="#grs-u" data-jump>${icn('pencil')} Üben</a>${hasSpeak?`<a href="#grs-s" data-jump>${icn('mic')} Sprechen</a>`:''}${secAllBtn()}</nav>
   <section class="gr-sec" id="grs-v"><h2><span class="gr-sn">1</span>Verstehen</h2>${blocks}</section>
   ${hasExamples?`<section class="gr-sec" id="grs-b"><h2><span class="gr-sn">2</span>Beispiele</h2>
     <div class="gr-legend"><span class="n">Nominativ – wer?</span><span class="d">Dativ – wem?</span><span class="a">Akkusativ – was?</span></div>
     <ul class="gr-exs">${c.examples.map(s => `<li><span class="s">${fmt(s)}</span>${sayBtn(s)}</li>`).join('')}</ul>
     <p class="gr-tip">${icn('mouse-pointer-click')} Tippe auf ein Wort, um es im Wörterbuch nachzuschlagen.</p></section>`:''}
   <section class="gr-sec" id="grs-u"><h2><span class="gr-sn">${hasExamples?3:2}</span>Üben</h2>
     <p class="sub" style="margin:-.3rem 0 1rem">Bestanden ab ${Math.round(PASS * 100)} % richtigen Antworten. Die Lösung kannst du nach dem ersten Prüfen ansehen.</p>
     <div class="gr-play"><span>${icn('gamepad-2')} Übe dieses Kapitel auch im Spiel:</span><button class="btn sm primary" onclick="GRAM.practice('solo')">${icn('user-round')} Allein spielen</button><button class="btn sm" onclick="GRAM.practice('host')">${icn('users')} Live mit Gruppe</button></div>
     ${c.exercisePaging?`<div class="gr-round-nav"><label>Trainingsrunde <select data-round-select>${c.exercises.map((x,i)=>`<option value="${i}">${H(x.title)}</option>`).join('')}</select></label><button class="btn sm" data-round-step="-1" aria-label="Vorherige Trainingsrunde">←</button><button class="btn sm" data-round-step="1" aria-label="Nächste Trainingsrunde">→</button><span data-round-status aria-live="polite"></span></div>`:''}
     ${c.exercises.map((x, i) => exHTML(x, i + 1)).join('')}</section>
   ${hasSpeak?`<section class="gr-sec" id="grs-s"><h2><span class="gr-sn">${hasExamples?4:3}</span>Sprechen</h2>${speakHTML(c.speak)}</section>`:''}
  </article>`;
  wire(c); icons();
}
const secAllBtn = () => `<button class="gr-secall" data-secall="1" title="Alle Abschnitte zu- oder aufklappen">${icn('chevrons-down-up')}<span>Alles zuklappen</span></button>`;
function secToggleAll(btn) {
  const secs = [...document.querySelectorAll('.gr-ch .gr-sec')], close = secs.some(x => !x.classList.contains('closed'));
  secs.forEach(x => x.classList.toggle('closed', close));
  btn.querySelector('span').textContent = close ? 'Alles aufklappen' : 'Alles zuklappen';
}
function progHTML(pr) {
  const p = pct(pr.passed, pr.total);
  return `${ring(p)}<span><b>${pr.passed} von ${pr.total}</b> Übungen bestanden<br>${pr.passed === pr.total ? 'Kapitel geschafft! 🎉' : (acct() ? 'Ergebnisse werden in deinem Konto gespeichert.' : '<a href="#/g/fortschritt">Wo werden meine Ergebnisse gespeichert?</a>')}</span>`;
}

/* ---------- Wortschatz topics: word cards, dictionary sheet (DE/EN), forms, examples ---------- */
const VPOS = { n: 'Nomen', v: 'Verb', adj: 'Adjektiv', adv: 'Adverb', w: 'Fragewort', intj: 'Gruß', num: 'Zahl', prep: 'Präposition', pron: 'Pronomen', conj: 'Konjunktion' };
const vlabel = x => (x.ar ? x.ar + ' ' : '') + x.w;
function vsub(x) {
  if (x.ps === 'n') return x.pf ? 'nur Plural' : x.sg ? 'nur Singular' : x.pl ? (x.pl === x.w ? 'die ' + x.pl + ' (gleich)' : 'die ' + x.pl) : '';
  if (x.ps === 'v') return 'er/sie ' + x.pres[2];
  if (x.ps === 'adj' && x.comp) return x.comp + ' · ' + x.sup;
  return VPOS[x.ps] || '';
}
function vforms(x) {     // every form of the word, to mark it in the example sentences
  const f = new Set([x.w, x.pl, x.prt, x.pp, x.comp, x.sup && x.sup.replace(/^am /, '')].filter(Boolean));
  (x.pres || []).forEach(p => f.add(p.split(' ')[0]));
  if (x.prt) f.add(x.prt.split(' ')[0]);
  if (x.ps === 'n') { f.add(x.w + 'n'); f.add(x.w + 's'); if (x.pl) f.add(x.pl + 'n'); }
  if (x.ps === 'adj') [...f].forEach(b => ['e', 'en', 'er', 'es', 'em'].forEach(e => f.add(b + e)));
  if (x.ps === 'v') { const st = x.w.replace(/n$/, ''); ['e', 'st', 't', 'en', 'te', 'test', 'ten', 'tet'].forEach(e => f.add(st.replace(/e$/, '') + e)); }
  return new Set([...f].map(w => w.toLowerCase()));
}
function vmark(x, sent) {
  const f = vforms(x), sep = x.pres && / /.test(x.pres[2]) ? x.pres[2].split(' ')[1] : '';
  const toks = sent.split(/([A-Za-zÄÖÜäöüß]+)/);
  const hasVerb = toks.some(t => f.has(t.toLowerCase()));
  let lastWord = -1; toks.forEach((t, k) => { if (/^[A-Za-zÄÖÜäöüß]+$/.test(t)) lastWord = k; });
  return toks.map((t, k) => !/^[A-Za-zÄÖÜäöüß]+$/.test(t) ? H(t) : (f.has(t.toLowerCase()) || (sep && hasVerb && k === lastWord && t === sep)) ? `<mark>${H(t)}</mark>` : H(t)).join('');
}
function vcard(c, x) {
  return `<button class="vk-card ${x.ar && !x.pf ? x.ar : x.pf ? 'die' : 'x'}" data-vw="${H(x.w)}" data-g="${H(x.g)}">
    <span class="vk-pic">${c.pic ? c.pic(x.w) : ''}</span>
    <span class="vk-w">${x.ar ? `<span class="vk-ar">${H(x.ar)}</span> ` : ''}${H(vdisp(x))}</span>
    <span class="vk-pl">${H(vsub(x))}</span><span class="vk-en">${H(x.en.slice(0, 2).join(', '))}</span></button>`;
}
let vgroup = '', vview = 'list';
function vfilter(g) {
  vgroup = g;
  document.querySelectorAll('[data-vg]').forEach(b => b.classList.toggle('on', b.dataset.vg === g));
  document.querySelectorAll('#vkwl .vk-card').forEach(b => { b.hidden = !!g && b.dataset.g !== g; });
}
// plural as in a learner's word list: -n, ¨-er, -s, Pl., Sg.
function plNote(x) {
  if (x.ps !== 'n') return '';
  if (x.pf) return 'Pl.'; if (x.sg || !x.pl) return 'Sg.'; if (x.pl === x.w) return '-';
  const uml = w => w.replace(/(au|a|o|u)(?=[^aouäöü]*$)/i, m => ({ au: 'äu', a: 'ä', o: 'ö', u: 'ü', Au: 'Äu', A: 'Ä', O: 'Ö', U: 'Ü' })[m] || m);
  if (x.pl.startsWith(x.w)) return '-' + x.pl.slice(x.w.length);
  const u = uml(x.w); if (x.pl.startsWith(u)) return '¨-' + x.pl.slice(u.length);
  return 'die ' + x.pl;
}
const VKKEY = 'gd_vknown';
function known(n) { try { return new Set((JSON.parse(localStorage.getItem(VKKEY) || '{}') || {})[n] || []); } catch (e) { return new Set(); } }
function setKnown(n, set) { try { const all = JSON.parse(localStorage.getItem(VKKEY) || '{}') || {}; all[n] = [...set]; localStorage.setItem(VKKEY, JSON.stringify(all)); } catch (e) {} }
const vdisp = x => x.d || (x.refl ? 'sich ' + x.w : x.w);
function wentry(c, x, kn) {
  const pn = plNote(x), cls = x.ar && !x.pf ? x.ar : x.pf ? 'die' : 'x';
  return `<span class="vk-we ${cls}${kn.has(x.w) ? ' known' : ''}" data-vw="${H(x.w)}"><button class="vk-mk" data-mk="${H(x.w)}" title="Kenne ich – markieren" aria-label="${H(x.w)} markieren">${icn('check')}</button><span class="vk-wt">${x.ar ? `<span class="vk-ar">${H(x.ar)}</span> ` : ''}<b>${H(vdisp(x))}</b>${pn ? `<span class="vk-pn">, ${H(pn)}</span>` : ''}</span></span>`;
}
function wordList(c) {
  const kn = known(c.n), byW = Object.fromEntries(c.words.map(x => [x.w, x]));
  if (vview === 'cards') {
    const groups = [...new Set(c.words.map(x => x.g))];
    return `<div class="gr-filter vk-fil"><button class="gr-chip${vgroup ? '' : ' on'}" data-vg="">Alle</button>${groups.map(g => `<button class="gr-chip${vgroup === g ? ' on' : ''}" data-vg="${H(g)}">${H(g)}</button>`).join('')}</div>
      <div class="vk-grid">${c.words.map(x => vcard(c, x).replace('<button class="vk-card', `<button${vgroup && x.g !== vgroup ? ' hidden' : ''} class="vk-card`)).join('')}</div>`;
  }
  return `<div class="vk-wl">${c.wordlist.map(g => `<div class="vk-wg"><h4>${H(g.h)}</h4><div class="vk-wrows">${g.rows.map(r => `<div class="vk-wr${r.length > 1 ? ' pair' : ''}">${r.map(w => (w = byW[w] ? w : w.replace(/^(der|die|das|sich) /, ''), byW[w] ? wentry(c, byW[w], kn) : '')).join('')}</div>`).join('')}</div>
    ${g.box ? `<div class="vk-box">${g.box.map(t => `<p><span>${t.replace(/\{b:([^}]*)\}/g, '<b>$1</b>')}</span>${sayBtn(t.replace(/\{b:([^}]*)\}/g, '$1'))}</p>`).join('')}</div>` : ''}</div>`).join('')}</div>`;
}
function markBar(c) {
  const kn = known(c.n), n = c.words.filter(x => kn.has(x.w)).length;
  return `<span>${icn('highlighter')} <b>${n}</b> von ${c.words.length} Wörtern markiert</span><span class="spacer"></span>
    <button class="btn sm primary" data-lk="1">${icn('layers')} ${c.words.length - n} unbekannte Wörter als Lernkarten</button>`;
}
// selecting words for flashcards
let vsel = new Set(), vselOn = false;
function selBar(c) {
  if (!vselOn) return `<button class="btn sm" data-vs="1">${icn('square-check')} Wörter für Lernkarten auswählen</button>`;
  return `<span class="vk-seln"><b>${vsel.size}</b> ${vsel.size === 1 ? 'Wort' : 'Wörter'} ausgewählt</span><button class="btn sm" data-vsa="1">Alle</button><button class="btn sm" data-vsn="1">Keine</button>
    <button class="btn sm primary" data-vsc="1"${vsel.size ? '' : ' disabled'}>${icn('layers')} Als Lernkarten</button><button class="btn sm" data-vs="0">Fertig</button>`;
}
function selPaint() {
  document.querySelectorAll('#vkwl [data-vw]').forEach(el => el.classList.toggle('picked', vsel.has(el.dataset.vw)));
  const wl = $('vkwl'); if (wl) wl.classList.toggle('selmode', vselOn);
  const b = $('vksel'); if (b) { b.innerHTML = selBar(cur); b.classList.toggle('on', vselOn); }
  icons();
}
async function deckFrom(c, words, label) {
  if(typeof requireFeature==='function'&&!requireFeature('cards'))return;
  const user=acct()?.id, hash=location.hash;
  try{if(typeof ensureCore==='function')await ensureCore()}catch{if(typeof toast==='function')toast('Wörterbuch konnte nicht geladen werden. Bitte erneut versuchen.');return}
  if(user!==acct()?.id||hash!==location.hash)return;
  if (typeof decks === 'undefined' || typeof newCard !== 'function' || typeof WIDX === 'undefined') { if (typeof toast === 'function') toast('Lernkarten sind gerade nicht verfügbar.'); return; }
  const name = `Wortschatz ${c.level} · ${c.title}${label ? ' · ' + label : ''}`;
  const ws = words.map(w => WIDX.has(w) ? E[WIDX.get(w)].w : WIDX.has(w + '¹') ? w + '¹' : null).filter(Boolean);
  if (!ws.length) { if (typeof toast === 'function') toast('Diese Wörter gibt es nicht als Lernkarten.'); return; }
  let did = Object.keys(decks).find(d => decks[d].name === name);
  if (!did) { did = (typeof uid === 'function' ? uid() : String(Date.now())); decks[did] = { name, cards: {}, created: Date.now() }; }
  let added = 0; ws.forEach(w => { if (!decks[did].cards[w]) { decks[did].cards[w] = newCard(); added++; } });
  if (typeof saveDecks === 'function') saveDecks();
  if (typeof toast === 'function') toast(added ? `${added} Lernkarten im Stapel „${name}“` : 'Diese Wörter sind schon im Stapel.');
  location.hash = '#/study/' + did;
}
// unknown words -> a flashcard deck in "Karten" (only words the big dictionary has)
function toCards(c) {
  const kn = known(c.n), ws = c.words.filter(x => !kn.has(x.w)).map(x => x.w);
  if (!ws.length) { if (typeof toast === 'function') toast('Alle Wörter sind markiert – super!'); return; }
  deckFrom(c, ws, '');
}
function vocabClick(t) {
  const vs = t.closest('[data-vs]'); if (vs) { vselOn = vs.dataset.vs === '1'; if (!vselOn) vsel.clear(); selPaint(); return true; }
  const vsa = t.closest('[data-vsa]'); if (vsa) { document.querySelectorAll('#vkwl [data-vw]').forEach(el => { if (!el.hidden) vsel.add(el.dataset.vw); }); selPaint(); return true; }
  const vsn = t.closest('[data-vsn]'); if (vsn) { vsel.clear(); selPaint(); return true; }
  const vsc = t.closest('[data-vsc]'); if (vsc) { if (vsel.size) { const ws = [...vsel]; vsel.clear(); vselOn = false; deckFrom(cur, ws, 'Auswahl'); } return true; }
  const mk = t.closest('[data-mk]');
  if (mk) { const n = cur.n, kn = known(n), w = mk.dataset.mk; kn.has(w) ? kn.delete(w) : kn.add(w); setKnown(n, kn);
    mk.closest('.vk-we').classList.toggle('known', kn.has(w)); const bar = $('vkbar'); if (bar) { bar.innerHTML = markBar(cur); icons(); } return true; }
  const lk = t.closest('[data-lk]'); if (lk) { toCards(cur); return true; }
  const pw = vselOn && t.closest('#vkwl [data-vw]'); if (pw) { const w = pw.dataset.vw; vsel.has(w) ? vsel.delete(w) : vsel.add(w); selPaint(); return true; }
  const vv = t.closest('[data-vv]'); if (vv) { vview = vv.dataset.vv; document.querySelectorAll('[data-vv]').forEach(b => b.classList.toggle('on', b === vv)); $('vkwl').innerHTML = wordList(cur); selPaint(); return true; }
  return false;
}
function renderVocab(c) {
  vsel = new Set(); vselOn = false;
  for (const x of c.exercises) if (x.gen) x.items = x.gen();
  if (c.speak && c.speak.gen) c.speak.items = c.speak.gen();
  const pr = chapterProgress(c), main = c.exercises.filter(x => !x.more), more = c.exercises.filter(x => x.more);
  V().innerHTML = `<div class="row" style="margin-bottom:.6rem"><a class="btn sm" href="#/v">${icn('arrow-left')} Wortschatz</a></div>
  <article lang="de" class="gr-ch vk">
   <div class="gr-hero"><div>
     <div class="vk-chh"><span class="vk-chn">${topicNo(c.n)}</span><div><p class="gr-eyebrow">Wortschatz ${H(c.level)} · Thema ${topicNo(c.n)} · <span class="gr-lv ${c.level}">${c.level}</span></p><h1>${H(c.title)}</h1></div></div>
     <p class="gr-kick">${H(c.kicker)}</p><p class="gr-intro">${rich(c.intro)}</p>
     <div class="gr-prog" id="grprog">${progHTML(pr)}</div>
     <div class="row" style="margin-top:.8rem"><button class="btn sm" onclick="GRAM.practice('solo')">${icn('gamepad-2')} Im Spiel üben</button></div></div>
     <figure class="gr-art">${typeof c.art === 'function' ? c.art(K) : ''}<figcaption><span>${fmt(c.hero)}</span>${sayBtn(c.hero)}</figcaption></figure>
   </div>
   <nav class="gr-toc"><a href="#grs-l" data-jump>${icn('list')} Wortliste</a><a href="#grs-t" data-jump>${icn('lightbulb')} Tipps</a><a href="#grs-u" data-jump>${icn('pencil')} Übungen</a><a href="#grs-m" data-jump>${icn('plus')} Mehr üben</a><a href="#grs-s" data-jump>${icn('mic')} Sprechen</a>${secAllBtn()}</nav>
   <section class="gr-sec" id="grs-l"><h2><span class="gr-sn">1</span>Wortliste <small class="vk-n">${c.words.length} Wörter</small></h2>
     <div class="vk-lhead"><p class="sub">Tippen Sie auf ein Wort: Übersetzung, Formen, Aussprache und Beispielsätze. Mit ${icn('check')} markieren Sie Wörter, die Sie schon kennen. Mit „Wörter auswählen“ machen Sie aus beliebigen Wörtern schnell Lernkarten.</p>
       <div class="vk-viewsw"><button data-vv="list" class="${vview === 'list' ? 'on' : ''}">${icn('list')} Liste</button><button data-vv="cards" class="${vview === 'cards' ? 'on' : ''}">${icn('image')} Bildkarten</button></div></div>
     <div class="vk-selbar" id="vksel">${selBar(c)}</div>
     <div id="vkwl">${wordList(c)}</div>
     ${c.info ? `<div class="vk-info"><span class="lab">Info</span><div>${c.info}</div></div>` : ''}
     <div class="vk-ask"><b>Welche Wörter kennen Sie? Markieren Sie.</b> Lernen Sie die unbekannten Wörter mit Lernkarten.</div>
     <div class="vk-markbar" id="vkbar">${markBar(c)}</div></section>
   <section class="gr-sec" id="grs-t"><h2><span class="gr-sn">2</span>Tipps</h2>${(c.tips || []).map(tp => `<div class="vk-tip"><span class="lab">Tipp</span><p>${rich(tp.t)}</p>${tp.note ? `<span class="vk-hand">${H(tp.note)}</span>` : ''}</div>`).join('')}</section>
   <section class="gr-sec" id="grs-u"><h2><span class="gr-sn">3</span>Übungen</h2>
     <p class="sub" style="margin:-.3rem 0 1rem">Bestanden ab ${Math.round(PASS * 100)} % richtigen Antworten. Die Lösung können Sie nach dem ersten Prüfen ansehen.</p>
     ${main.map(x => exHTML(x)).join('')}</section>
   <section class="gr-sec" id="grs-m"><h2><span class="gr-sn">4</span>Mehr üben</h2>
     <div class="gr-play"><span>${icn('gamepad-2')} Die Wörter auch im Spiel üben:</span><button class="btn sm primary" onclick="GRAM.practice('solo')">${icn('user-round')} Allein spielen</button><button class="btn sm" onclick="GRAM.practice('host')">${icn('users')} Live mit Gruppe</button></div>
     ${more.map(x => exHTML(x)).join('')}</section>
   <section class="gr-sec" id="grs-s"><h2><span class="gr-sn">5</span>Sprechen</h2>${(c.dialogs || []).map(block).join('')}${speakHTML(c.speak)}</section>
   <p class="vk-src">Übersetzungen und Formen nach <a href="https://de.wiktionary.org" target="_blank" rel="noopener">Wiktionary</a> (CC BY-SA), Beispielsätze von <a href="https://tatoeba.org" target="_blank" rel="noopener">Tatoeba</a> (CC BY 2.0 FR), Aussprache von <a href="https://commons.wikimedia.org" target="_blank" rel="noopener">Wikimedia Commons</a>. Bilder, Wortliste, Tipps und Übungen: Wörterbuch.</p>
  </article>`;
  wire(c); icons();
}
function vplay(x, btn) {
  const fallback = () => talk(vlabel(x));
  if (!x.au) { fallback(); return; }
  try { const a = new Audio(x.au); if (btn) { btn.classList.add('on'); a.onended = a.onerror = () => btn.classList.remove('on'); } a.play().catch(() => { if (btn) btn.classList.remove('on'); fallback(); }); } catch (e) { fallback(); }
}
function vocabSheet(c, w) {
  if (typeof openSheet !== 'function') return;
  const list = c.words.filter(x => !vgroup || x.g === vgroup), k = Math.max(0, list.findIndex(x => x.w === w)), x = list[k] || c.words[0];
  const prev = list[(k - 1 + list.length) % list.length], next = list[(k + 1) % list.length];
  let forms = '';
  if (x.ps === 'n') forms = x.pf ? `<span>${H(vlabel(x))}</span> <small>nur Plural</small>` : x.sg ? `<span>${H(vlabel(x))}</span> <small>meist nur Singular</small>` : `<span>${H(vlabel(x))}</span>${x.pl ? ` · <span>die ${H(x.pl)}</span> <small>Plural</small>` : ''}`;
  if (x.ps === 'adj' && x.comp) forms = `${H(x.w)} · ${H(x.comp)} · ${H(x.sup)}`;
  const verb = x.ps === 'v' ? `<div class="vk-conj"><table>${PERS.map((p, i) => `<tr><td>${p}</td><td><b>${H(x.refl ? x.pres[i] + ' ' + ['mich', 'dich', 'sich', 'uns', 'euch', 'sich'][i] : x.pres[i])}</b></td></tr>`).join('')}</table>
    <div class="vk-tense"><p><small>Präteritum</small>er/sie ${H(x.prt)}</p><p><small>Perfekt</small>er/sie ${x.aux === 'sein' ? 'ist' : 'hat'}${x.refl ? ' sich' : ''} ${H(x.pp)}</p></div></div>` : '';
  const big = typeof WIDX !== 'undefined' && (WIDX.has(x.w) ? x.w : WIDX.has(x.w + '¹') ? x.w + '¹' : null);
  openSheet(`<div class="vk-sh">
    <div class="vk-shh"><span class="vk-shp">${c.pic ? c.pic(x.w) : ''}</span><div class="vk-sht">
      <div class="vk-shw ${x.ar && !x.pf ? x.ar : x.pf ? 'die' : 'x'}">${x.ar ? `<span class="vk-ar">${H(x.ar)}</span> ` : ''}<b>${H(vdisp(x))}</b>
        <button class="gr-say" title="Aussprache anhören" onclick="GRAM.voc.play(${c.n},${H(JSON.stringify(x.w))},this)">${icn('volume-2')}</button></div>
      <div class="vk-meta">${H(VPOS[x.ps] || '')}${x.ipa ? ` · <span class="ipa">${H(x.ipa)}</span>` : ''}</div>
      ${forms ? `<div class="vk-fm">${forms}</div>` : ''}</div></div>
    <div class="vk-tr"><span class="lab">EN</span><span>${x.en.map((e, i) => i === 0 ? `<b>${H(e)}</b>` : H(e)).join('<i>·</i>')}</span></div>
    ${verb}
    ${x.note ? `<p class="vk-note">${icn('lightbulb')}<span>${H(x.note)}</span></p>` : ''}
    ${x.ex.length ? `<h4 class="vk-h4">Beispiele</h4>` : ''}
    <div class="vk-exs">${x.ex.map(e => `<div class="vk-exr"><div class="de"><span>${vmark(x, e[0])}</span><button class="gr-say sm" title="Anhören" onclick="GRAM.voc.say(this.dataset.t)" data-t="${H(e[0])}">${icn('volume-2')}</button></div>
      <div class="en">${H(e[1])} <a class="vk-tl" href="https://tatoeba.org/de/sentences/show/${e[2]}" target="_blank" rel="noopener" title="Satz bei Tatoeba">Tatoeba</a></div></div>`).join('')}</div>
    <div class="vk-shf"><button class="btn sm" onclick="GRAM.voc.open(${c.n},'${H(prev.w)}')">${icn('arrow-left')} ${H(prev.w)}</button>
      <button class="btn sm" onclick="GRAM.voc.open(${c.n},'${H(next.w)}')">${H(next.w)} ${icn('arrow-right')}</button><span class="spacer"></span>
      ${`<a class="btn sm" href="#/w/${encodeURIComponent(big||x.w)}" onclick="closeSheet()">${icn('book-open')} Großes Wörterbuch</a>`}
      <button class="btn sm primary" onclick="closeSheet()">Fertig</button></div>
    ${x.af ? `<p class="vk-cred">Aussprache: <a href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(x.af)}" target="_blank" rel="noopener">${H(x.af)}</a> (Wikimedia Commons) · Formen: <a href="https://de.wiktionary.org/wiki/${encodeURIComponent(x.w)}" target="_blank" rel="noopener">Wiktionary</a></p>` : ''}
  </div>`);
  icons();
}

/* explanation blocks */
function block(b) {
  if (b.type === 'scenes') return `<div class="gr-cream"><h3>${H(b.title)}</h3><div class="gr-scene-grid">${b.items.map(item => `<figure class="gr-scene">${window.GRAM_ART.draw(K,item.scene)}<figcaption><b>${H(item.title)}</b><p>${fmt(item.example)}</p><p class="gr-foot">${rich(item.explain || '')}</p></figcaption></figure>`).join('')}</div></div>`;
  if (b.scene) { const rest = {...b}; delete rest.scene; return `<div class="gr-concept"><figure>${window.GRAM_ART.draw(K,b.scene)}</figure>${block(rest)}</div>`; }

  if (b.type === 'q3') return `<div class="gr-cream"><h3>${H(b.title)}</h3><div class="gr-q3">${b.items.map(i =>
    `<div class="gr-qc ${i.k}"><span class="gr-qi">${icn(i.icon)}</span><b class="gr-qq">${H(i.q)}</b><span class="gr-qk">${H(i.c)}</span><p>${H(i.t)}</p><p class="gr-qex">${fmt(i.ex)}</p></div>`).join('')}</div></div>`;
  if (b.type === 'slots') {
    const slot = s => `<div class="gr-slot ${s[1]}"><span>${wrapWords(s[0])}</span><small>${H(s[2])}</small></div>`;
    const arrow = `<svg viewBox="0 0 120 22"><path d="M110 4Q60 26 10 6" fill="none" stroke="var(--dat)" stroke-width="2" stroke-dasharray="4 4" marker-end="url(#grarr2)"/><defs><marker id="grarr2" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--dat)"/></marker></defs></svg>`;
    const row = r => { const i = r.findIndex(s => s[1] === 'd'); if (i < 0 || r[i + 1]?.[1] !== 'a') return `<div class="gr-slots">${r.map(slot).join('')}</div>`;
      return `<div class="gr-slots">${r.slice(0, i).map(slot).join('')}<div class="gr-pair"><div class="gr-pairin">${slot(r[i])}${slot(r[i + 1])}</div><div class="gr-give">${arrow}<span>die Person bekommt die Sache</span></div></div>${r.slice(i + 2).map(slot).join('')}</div>`; };
    return `<div class="gr-cream"><h3>${H(b.title)}</h3>${b.rows.map(row).join('')}<p class="gr-foot">${rich(b.note)}</p></div>`;
  }
  if (b.type === 'table') {
    const keys = Object.keys(b.sets), id = 'grt' + Math.random().toString(36).slice(2, 7);
    return `<div class="gr-cream"><h3>${H(b.title)}</h3><div class="gr-tsw" data-tbl="${id}">${keys.map((k, i) => `<button class="gr-chip${i ? '' : ' on'}" data-set="${k}">${k}</button>`).join('')}</div>
      <div class="gr-tblw" id="${id}">${tableHTML(b, keys[0])}</div><p class="gr-foot" style="margin-top:.7rem">${rich(b.foot)}</p></div>`;
  }
  if (b.type === 'merk') return `<div class="gr-merk"><span class="ico">${icn('lightbulb')}</span><p><small>Merksatz</small>${fmt(b.text)}</p></div>`;
  if (b.type === 'machine') return `<div class="gr-cream gr-mach" data-mach='${H(JSON.stringify(b))}'><h3>${H(b.title)}</h3><p class="gr-foot" style="margin:-.3rem 0 .8rem">${H(b.intro)}</p>
      <div class="gr-msw"><button class="gr-tg d" data-sw="d">${H(b.d[0])} → ${H(b.d[1])}<i class="k"></i></button><button class="gr-tg a" data-sw="a">${H(b.a[0])} → ${H(b.a[1])}<i class="k"></i></button></div>
      <div class="gr-msent"></div><div class="gr-mrule">${icn('info')}<span></span></div></div>`;
  if (b.type === 'verbs') return `<div class="gr-cream"><h3>${H(b.title)}</h3><p class="gr-pat">${H(b.pattern)}</p><div class="gr-verbs">${b.items.map(v =>
      `<div class="gr-verb"><b><span class="gw">${H(v[0])}</span></b><span class="ex">${fmt(v[1])}</span></div>`).join('')}</div></div>`;
  if (b.type === 'cards') return `<div class="gr-cream"${b.min ? ` style="--min:${b.min}"` : ''}>${b.title ? `<h3>${H(b.title)}</h3>` : ''}<div class="gr-cards2">${b.items.map(i =>
    `<div class="gr-c2 k-${i.k || 'ac'}"><span class="tt">${i.icon ? icn(i.icon) : ''}${H(i.t)}</span>${i.s ? `<span class="s">${H(i.s)}</span>` : ''}${i.p ? `<p>${rich(i.p)}</p>` : ''}${i.ex ? `<p class="ex">${fmt(i.ex)}</p>` : ''}${i.ws ? `<div class="ws">${i.ws.map(w => `<span class="gw">${H(w)}</span>`).join('')}</div>` : ''}</div>`).join('')}</div>${b.foot ? `<p class="gr-foot" style="margin-top:.7rem">${rich(b.foot)}</p>` : ''}</div>`;
  if (b.type === 'grid') return `<div class="gr-cream"><h3>${H(b.title)}</h3><div class="gr-tblw"><table class="gr-tbl gr-grid">${b.head ? `<thead><tr>${b.head.map((h, i) => `<th${i === 0 && b.label !== false ? ' class="l"' : ''}>${H(h)}</th>`).join('')}</tr></thead>` : ''}<tbody>${b.rows.map((r, ri) =>
    `<tr${(b.hl || []).includes(ri) ? ' class="hl"' : ''}>${r.map((c, i) => i === 0 && b.label !== false ? `<td class="l">${H(c)}</td>` : `<td>${/<\w/.test(c) ? c : fmt(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${b.foot ? `<p class="gr-foot" style="margin-top:.7rem">${rich(b.foot)}</p>` : ''}</div>`;
  if (b.type === 'conj') { const ks = Object.keys(b.verbs);
    return `<div class="gr-cream gr-conj" data-conj="${H(JSON.stringify(b))}"><h3>${H(b.title)}</h3>${b.intro ? `<p class="gr-foot" style="margin:-.3rem 0 .7rem">${rich(b.intro)}</p>` : ''}<div class="gr-cv">${ks.map((k, i) => `<button class="gr-chip${i ? '' : ' on'}" data-verb="${H(k)}">${H(k)}</button>`).join('')}</div><div class="gr-conjt"></div><p class="gr-cnote"></p></div>`; }
  if (b.type === 'reflist') { const id = 'grl' + Math.random().toString(36).slice(2, 7);
    return `<div class="gr-cream gr-ref"><h3>${H(b.title)}</h3>${b.intro ? `<p class="gr-foot" style="margin:-.3rem 0 .7rem">${rich(b.intro)}</p>` : ''}<input class="gr-refq" data-list="${id}" placeholder="Suchen …" autocomplete="off">
      <div class="gr-tblw gr-refw"><table class="gr-tbl gr-grid" id="${id}"><thead><tr>${b.head.map(h => `<th>${H(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r =>
      `<tr data-s="${H(r.map(plain).join(' ').toLowerCase())}">${r.map((c, i) => `<td${i === 0 ? ' class="gr-ref0"' : ''}>${i === 0 ? `<span class="gw">${H(plain(c))}</span>` : fmt(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="gr-foot gr-refn" style="margin-top:.5rem">${b.rows.length} Einträge</p></div>`; }
  if (b.type === 'html') return `<div class="gr-cream">${b.title ? `<h3>${H(b.title)}</h3>` : ''}${typeof b.html === 'function' ? b.html(K) : b.html}${b.foot ? `<p class="gr-foot">${rich(b.foot)}</p>` : ''}</div>`;
  if (b.type === 'dialog') return `<div class="gr-cream"><h3>${H(b.title)}</h3><div class="vk-dlg">${b.lines.map((l, k) => `<div class="vk-ln ${k % 2 ? 'r' : ''}"><span class="vk-who">${H(l[0])}</span><span class="vk-bub">${fmt(l[1])}</span>${sayBtn(l[1])}</div>`).join('')}</div>${b.foot ? `<p class="gr-foot">${rich(b.foot)}</p>` : ''}</div>`;
  if (b.type === 'note') return `<div class="gr-note">${icn('triangle-alert')}<p><b class="t">${H(b.title)}</b>${fmt(b.text)}</p></div>`;
  return '';
}
function tableHTML(b, k) {
  const rows = b.sets[k], cls = ['n', 'a', 'd'], lab = ['Nominativ', 'Akkusativ', 'Dativ'];
  const cell = (t, r, col) => {
    const [art, ...rest] = t.split(' '), nom = rows[0][col].split(' ')[0], chg = r > 0 && art !== nom && art !== '–';
    const noun = rest.join(' ').replace(/\+n$/, '<b class="plusn">n</b>');
    return `<td><span class="art${chg ? ' chg' : ''}">${H(art)}</span> ${noun}</td>`;
  };
  return `<table class="gr-tbl"><thead><tr><th></th>${b.head.map(h => `<th>${H(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) =>
    `<tr class="${cls[i]}"><th><span class="lf">${lab[i]}</span><span class="ls">${lab[i].slice(0, 3)}.</span></th>${r.map((t, j) => cell(t, i, j)).join('')}</tr>`).join('')}</tbody></table>`;
}
const PERS = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];
function conjForm(inf, f) {
  if (/\{e:/.test(f)) return f.replace(/\{e:([^}]*)\}/g, (m, x) => `<span class="end">${H(x)}</span>`).replace(/^([^<]*)/, m => H(m));
  const stem = inf.replace(/(e?n)$/, ''); let i = 0; while (i < f.length && i < stem.length && f[i] === stem[i]) i++;
  if (i === 0) return `<span class="end">${H(f)}</span>`;
  return H(f.slice(0, i)) + (i < f.length ? `<span class="end">${H(f.slice(i))}</span>` : '');
}
function conj(el) {
  const b = JSON.parse(el.dataset.conj), out = el.querySelector('.gr-conjt'), note = el.querySelector('.gr-cnote');
  const draw = k => { const v = b.verbs[k], forms = Array.isArray(v) ? v : v.f;
    out.innerHTML = forms.map((f, i) => `<div style="animation-delay:${i * 35}ms"><b>${PERS[i]}</b><span>${conjForm(k, f)}</span><button class="gr-say" data-say="${H(PERS[i].split('/')[0] + ' ' + f.replace(/\{e:([^}]*)\}/g, '$1'))}" style="margin-left:auto;width:28px;height:28px">${icn('volume-2')}</button></div>`).join('');
    note.innerHTML = Array.isArray(v) ? '' : rich(v.n || ''); icons(); };
  el.querySelectorAll('[data-verb]').forEach(c => c.onclick = () => { el.querySelectorAll('[data-verb]').forEach(x => x.classList.toggle('on', x === c)); draw(c.dataset.verb); });
  draw(Object.keys(b.verbs)[0]);
}
function machine(el) {
  const b = JSON.parse(el.dataset.mach), st = { d: false, a: false }, sent = el.querySelector('.gr-msent'), rule = el.querySelector('.gr-mrule span');
  const draw = first => {
    const pD = st.d, pA = st.a, aFirst = pA && (!pD || pA);   // pronoun object before a noun; two pronouns: accusative first
    const order = (pA && !pD) || (pA && pD) ? ['a', 'd'] : ['d', 'a'];
    const key = (pD ? 'p' : 'n') + (pA ? 'p' : 'n');
    const before = {}; if (!first) sent.querySelectorAll('.w').forEach(w => before[w.dataset.k] = w.getBoundingClientRect().left);
    const word = k => `<span class="w ${k === 'd' || k === 'a' ? k : ''}" data-k="${k}">${H(k === 'd' ? b.d[+pD] : k === 'a' ? b.a[+pA] : k === 's' ? b.start : b.end)}</span>`;
    sent.innerHTML = word('s') + order.map(word).join('') + `<span class="w" data-k="e" style="padding-left:0;margin-left:-.5rem">${H(b.end)}</span>${sayBtn(b.start + ' ' + order.map(k => k === 'd' ? b.d[+pD] : b.a[+pA]).join(' ') + b.end)}`;
    rule.textContent = b.rules[key === 'nn' ? 'nn' : key === 'pn' ? 'pn' : key === 'np' ? 'np' : 'pp'];
    if (!first) sent.querySelectorAll('.w').forEach(w => { const x = before[w.dataset.k]; if (x == null) return; const dx = x - w.getBoundingClientRect().left;
      if (dx) { w.style.transition = 'none'; w.style.transform = `translateX(${dx}px)`; requestAnimationFrame(() => requestAnimationFrame(() => { w.style.transition = ''; w.style.transform = ''; })); } });
    icons(); void aFirst;
  };
  el.querySelectorAll('[data-sw]').forEach(t => t.onclick = () => { const k = t.dataset.sw; st[k] = !st[k]; t.classList.toggle('on', st[k]); draw(false); });
  draw(true);
}

/* ---------- exercises ---------- */
const LET = 'abcdefghijklmnop';
function matchOpts(x) { x._opts = shuffle(x.items.map(it => it.r)); return `<div class="gr-mopts">${x._opts.map((r, k) => `<span><b>${LET[k]})</b> ${H(r)}</span>`).join('')}</div>`; }
const itemBody = (x,it,i) => `${it.scene ? `<figure class="gr-scene">${window.GRAM_ART.draw(K,it.scene)}</figure>` : ''}${itemHTML(x,it,i)}<div class="gr-sol" hidden></div>`;
const itemsHTML = x => (x.type === 'match' ? matchOpts(x) : '') + x.items.map((it, i) => `<div class="gr-it" data-i="${i}"><span class="gr-in">${i + 1}</span><div class="gr-ib">${itemBody(x,it,i)}</div></div>`).join('');
function exHTML(x, n) {
  const legend = x.type === 'cases' ? `<div class="gr-legend"><span class="n">1× Nominativ</span><span class="d">2× Dativ</span><span class="a">3× Akkusativ</span></div>` : '';
  const lay = [x.grid ? 'grid' : '', x.cols ? 'cols' : '', x.flow ? 'flow' : ''].filter(Boolean).join(' ');
  const bank = x.bank ? `<div class="gr-bank">${x.bank.map((w, k) => `<span class="${k === 0 && x.bankDone ? 'done' : ''}">${H(w)}</span>`).join('')}</div>` : '';
  const label = cur && cur.vocab ? exLabel(cur, x) : 'Übung ' + n;
  let body = `<div class="gr-items ${lay}">${itemsHTML(x)}</div>`;
  if (x.frame) body = `<div class="gr-frame ${x.frame}">${x.frame === 'form' ? `<div class="gr-fh">${icn('clipboard-list')}<span>${H(x.subject || 'Formular')}</span></div>` : ''}${x.frame === 'mail' ? `<div class="gr-fh">${icn('mail')}<span>${H(x.subject || 'Neue Nachricht')}</span></div>` : ''}${body}</div>`;
  return `<div class="gr-ue${cur && cur.vocab ? ' vk-ue' : ''}" id="ue-${x.id}" data-ex="${x.id}" data-type="${x.type}"><div class="gr-ueh"><span class="gr-uen">${label}</span><h3>${H(x.title)}</h3><span id="ueb-${x.id}">${badgeHTML(x)}</span></div>
    <p class="gr-uei">${rich(H(x.instr))}</p>${legend}${bank}${x.before ? block(x.before) : ''}${body}
    <div class="gr-uef"><button class="btn primary gr-btn" data-act="check">${icn('check')} Prüfen</button>
    ${x.type === 'free' ? '' : `<button class="btn gr-btn" data-act="show" disabled title="Erst nach dem ersten Prüfen">${icn('eye')} Lösung zeigen</button>`}
    <button class="btn gr-btn" data-act="reset">${icn('rotate-ccw')} Neu</button><span class="gr-res"></span></div></div>
    ${x.moreTip ? `<div class="vk-more"><span>Mehr üben?</span><p>${H(x.moreTip).replace(/\{e:([^}]*)\}/g, '<b>$1</b>')}</p></div>` : ''}`;
}
function badgeHTML(x) {
  if (x.graded === false) return `<span class="gr-ueb free">ohne Note</span>`;
  const b = cur && best(cur.n, x.id); if (!b) return '';
  const p = pct(b.score, b.total);
  return b.score / b.total >= PASS ? `<span class="gr-ueb pass">${icn('circle-check')} bestanden · ${p} %</span>` : `<span class="gr-ueb fail">bestes Ergebnis ${p} %</span>`;
}
function itemHTML(x, it, i) {
  if (x.type === 'select') return `<fieldset class="gr-select"><legend>${H(it.q)}</legend>${it.options.map((option,k)=>`<label><input type="checkbox" value="${k}" aria-label="${H(option)}"><span>${H(option)}</span></label>`).join('')}</fieldset>`;
  if (x.type === 'cases') return it.replace(/\{([nda]):([^}]*)\}|([^{]+)/g, (m, k, t, p) => p != null ? H(p) : `<button class="gr-tag" data-k="${k}" data-st="" data-lb="">${H(t)}</button>`);
  if ((x.type === 'choice' || x.type === 'fill') && typeof it === 'string' && /^\{p:/.test(it)) { const m = /^\{p:([^|}]+)[^}]*\}\s*/.exec(it);
    return `<span class="vk-qpic">${cur && cur.pic ? cur.pic(m[1]) : ''}</span><span class="vk-qt">${itemHTML(x, it.slice(m[0].length), i)}</span>`; }
  if (x.type === 'choice') return it.replace(/\(\(([^)]*)\)\)|([^(]+|\()/g, (m, opts, p) => {
    if (p != null) return H(p); const o = opts.split('|');
    return `<span class="gr-gap" data-ok="${H(o[0])}">${shuffle(o).map(v => `<button>${H(v)}</button>`).join('')}</span>`; });
  if (x.type === 'order') { let t = shuffle(it.tiles); for (let k = 0; k < 5 && t.join(' ') === it.tiles.join(' '); k++) t = shuffle(it.tiles);
    return `<div class="gr-line"></div><div class="gr-pool">${t.map(v => `<button class="gr-tile">${H(v)}</button>`).join('')}</div><span class="gr-end" hidden>${H(it.end)}</span>`; }
  if (x.type === 'type') return `<div class="gr-q">${H(it.q).replace(/\[([^\]]*)\]/g, '<mark>$1</mark>')}</div>
    <div class="gr-tl"><span>${H(it.pre)}</span>${it.long ? `<textarea rows="${it.rows || 6}" autocomplete="off" spellcheck="false" aria-label="Antwort ${i + 1}">${H(it.start || '')}</textarea>` : `<input autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Antwort ${i + 1}" value="${H(it.start || '')}">`}<span>${H(it.end)}</span></div>`;
  if (x.type === 'fill') { let gap = 0; return it.replace(/^\(([^)]*)\)\s*/, (m, h) => `<span class="gr-hint">${H(h)}</span>`).replace(/\[\[([^\]]*)\]\]|([^[]+|\[)/g, (m, a, p) => {
    if (p != null) return p.startsWith('<span class="gr-hint">') ? p : H(p).replace(/\n/g, '<br>');
    let hint = ''; if (a[0] === '^') { a = a.slice(1); hint = a[0]; }
    const ok = a.split('|');
    return `<input class="gr-fill" aria-label="Antwort ${i + 1}, Lücke ${++gap}" data-ok="${H(JSON.stringify(ok))}"${hint ? ` data-h="${H(hint)}" placeholder="${H(hint)} …"` : ''} style="--n:${Math.max(...ok.map(o => o.length))}" autocomplete="off" autocapitalize="off" spellcheck="false">${x.flow ? `<sup class="gr-gn">(${i + 1})</sup>` : ''}`; }); }
  if (x.type === 'match') return `<span class="gr-ml">${H(it.l)}</span><select class="gr-msel" aria-label="${H(it.l)}"><option value="">–</option>${(x._opts || []).map((r, k) => `<option value="${LET[k]}">${LET[k]})</option>`).join('')}</select>`;
  if (x.type === 'free') return `<div class="gr-q">${H(it.q)}</div><div class="gr-free"><textarea rows="2" placeholder="${H(it.ph)}" spellcheck="false"></textarea></div><div class="gr-fb"></div>`;
  return '';
}
const exState = {};       // exercise id -> {shown:bool}
function wire(c) {
  const root = V().querySelector('.gr-ch');
  const round=root.querySelector('[data-round-select]');if(round){const update=()=>{const index=Number(round.value);root.querySelectorAll('.gr-ue').forEach((el,i)=>el.hidden=i!==index);root.querySelector('[data-round-status]').textContent=`Runde ${index+1} von ${c.exercises.length}`;root.querySelector('[data-round-step="-1"]').disabled=index===0;root.querySelector('[data-round-step="1"]').disabled=index===c.exercises.length-1;};round.onchange=update;root.querySelectorAll('[data-round-step]').forEach(button=>button.onclick=()=>{round.value=String(Math.max(0,Math.min(c.exercises.length-1,Number(round.value)+Number(button.dataset.roundStep))));update()});update();}
  root.querySelectorAll('.gr-mach').forEach(machine);
  root.querySelectorAll('.gr-conj').forEach(conj);
  root.querySelectorAll('.gr-refq').forEach(q => q.oninput = () => { const t = q.value.trim().toLowerCase(), tb = $(q.dataset.list); let n = 0;
    tb.querySelectorAll('tbody tr').forEach(tr => { const show = !t || tr.dataset.s.includes(t); tr.hidden = !show; if (show) n++; }); q.closest('.gr-ref').querySelector('.gr-refn').textContent = n + ' Einträge'; });
  root.querySelectorAll('.gr-tsw').forEach(sw => sw.querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
    sw.querySelectorAll('[data-set]').forEach(x => x.classList.toggle('on', x === b));
    const blk = c.understand.find(x => x.type === 'table'); $(sw.dataset.tbl).innerHTML = tableHTML(blk, b.dataset.set); }));
  c.exercises.forEach(x => exState[x.id] = { shown: false, checked: false });
}
function onClick(ev) {
  const ul = ev.target.closest && ev.target.closest('[data-unlock]'); if (ul && window.KONTO) { ev.preventDefault(); KONTO.lockSheet(ul.dataset.unlock); return; }
  const t = ev.target;
  if (!t.closest) return;
  if (!t.closest('#grpop') && !t.closest('.gw')) closePop();
  const tb = t.closest('[data-toc]'); if (tb) { tocAll(tb.dataset.toc === 'open'); return; }
  const ex = t.closest('[data-exp]'); if (ex) { const r = ex.closest('.gr-row'), st = tocState(), open = !r.classList.contains('open'); st['c:' + r.dataset.n] = open ? 1 : 0; tocSave(st); rowOpen(r, open); icons(); return; }
  const sa = t.closest('[data-secall]'); if (sa) { secToggleAll(sa); return; }
  const sh2 = t.closest('.gr-ch .gr-sec>h2'); if (sh2) { sh2.parentNode.classList.toggle('closed'); return; }
  const ch = t.closest('.gr-ch'); if (!ch || !cur) return;
  if (cur.vocab && vocabClick(t)) return;
  const sb = t.closest('[data-say]'); if (sb) { talk(sb.dataset.say); if (sb.dataset.cap != null) { const box = sb.closest('.gr-cream'), cp = box && box.querySelector('.vk-cap'); if (cp) cp.innerHTML = fmt(sb.dataset.cap); box.querySelectorAll('[data-cap]').forEach(g => g.classList.toggle('on', g === sb)); } return; }
  const vc = t.closest('[data-vw]'); if (vc && cur && cur.vocab) { vocabSheet(cur, vc.dataset.vw); return; }
  const vf = t.closest('[data-vg]'); if (vf && cur && cur.vocab) { vfilter(vf.dataset.vg); return; }
  const j = t.closest('[data-jump]'); if (j) { ev.preventDefault(); const el = document.querySelector(j.getAttribute('href')); if (el) el.scrollIntoView({ behavior: 'smooth' }); return; }
  const gw = t.closest('.gw'); if (gw && !t.closest('button')) { pop(gw); return; }
  const ue = t.closest('.gr-ue'); if (!ue) { spk(t); return; }
  const x = cur.exercises.find(e => e.id === ue.dataset.ex), S = exState[x.id];
  const act = t.closest('[data-act]');
  if (act) { if (act.disabled) return; if (act.dataset.act === 'check') check(x, ue); else if (act.dataset.act === 'show') show(x, ue); else reset(x, ue); return; }
  if (S.shown) return;                  // answers on screen: nothing to change until "Neu"
  if (t.matches('.gr-select input')) { clearMark(t); return; }
  const tag = t.closest('.gr-tag');
  if (tag) { const seq = ['', 'n', 'd', 'a'], nx = seq[(seq.indexOf(tag.dataset.st) + 1) % 4]; tag.dataset.st = nx; tag.dataset.lb = nx ? CASE[nx] : ''; clearMark(tag); return; }
  const gb = t.closest('.gr-gap button');
  if (gb) { gb.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('sel', b === gb && !gb.classList.contains('sel'))); clearMark(gb); return; }
  const tile = t.closest('.gr-tile');
  if (tile) { const it = tile.closest('.gr-ib'), line = it.querySelector('.gr-line'), pool = it.querySelector('.gr-pool');
    (tile.parentNode === line ? pool : line).appendChild(tile); it.querySelector('.gr-end').hidden = !!pool.children.length; clearMark(tile); return; }
}
function clearMark(el) { const it = el.closest('.gr-it'); it.classList.remove('ok', 'no'); const s = it.querySelector('.gr-sol'); s.hidden = true; }
function spk(t) {
  const b = t.closest('[data-spk]'); if (!b) return;
  const card = b.closest('.gr-sc'), out = card.querySelector('.gr-scs'), i = +card.dataset.i, it = cur.speak.items[i];
  const s = b.dataset.spk === 'pron' ? (it.pron || it.alt) : it.say;
  out.classList.remove('hid'); out.innerHTML = fmt(s); talk(plain(s));
}
function answers(x, ue) {
  return [...ue.querySelectorAll('.gr-it')].map((el, i) => {
    const it = x.items[i];
    if (x.type === 'select') { const selected=[...el.querySelectorAll('input:checked')].map(input=>it.options[+input.value]); return {ok:selected.length===it.ok.length&&it.ok.every(value=>selected.includes(value)),given:selected.join(' | '),empty:!selected.length}; }
    if (x.type === 'cases') { const tags = [...el.querySelectorAll('.gr-tag')]; return { ok: tags.every(g => g.dataset.st === g.dataset.k), given: tags.map(g => g.dataset.st || '-').join(''), empty: tags.every(g => !g.dataset.st) }; }
    if (x.type === 'choice') { const gaps = [...el.querySelectorAll('.gr-gap')], val = gaps.map(g => (g.querySelector('.sel') || {}).textContent || '');
      return { ok: gaps.every((g, k) => val[k] === g.dataset.ok), points: gaps.filter((g,k)=>val[k]===g.dataset.ok).length, total: gaps.length, given: val.join('|'), empty: val.every(v => !v) }; }
    if (x.type === 'order') { const v = [...el.querySelectorAll('.gr-line .gr-tile')].map(b => b.textContent).join(' ');
      return { ok: it.ok.includes(v) && !el.querySelector('.gr-pool').children.length, given: v, empty: !v }; }
    if (x.type === 'fill') { const ins = [...el.querySelectorAll('.gr-fill')], res = ins.map(i => { const ok = JSON.parse(i.dataset.ok), h = i.dataset.h, low = o => o.toLowerCase(); let v = i.value.trim();
        if (h && v && !ok.some(o => low(o) === low(v)) && ok.some(o => low(o) === low(h + v))) v = h + v;
        return { v, ok: ok.includes(v), ci: !ok.includes(v) && ok.some(o => o.toLowerCase() === v.toLowerCase()) }; });
      ins.forEach((inp, k) => { inp.classList.remove('right', 'wrong'); inp.classList.add(res[k].ok || res[k].ci ? 'right' : 'wrong'); });
      return { ok: res.every(r => r.ok || r.ci), points: res.filter(r=>r.ok||r.ci).length, total: res.length, ci: res.some(r => r.ci), given: res.map(r => r.v).join('|'), empty: res.every(r => !r.v) }; }
    if (x.type === 'match') { const v = el.querySelector('select').value, ok = v && x._opts[LET.indexOf(v)] === it.r; return { ok: !!ok, given: v ? x._opts[LET.indexOf(v)] : '', empty: !v }; }
    if (x.type === 'type') { const raw = el.querySelector('input,textarea').value, v = sentenceNorm(raw, x.commas), ok = it.ok.some(a => sentenceNorm(a, x.commas) === v), ci = !ok && it.ok.some(a => sentenceNorm(a, x.commas).toLowerCase() === v.toLowerCase());
      return { ok: ok || ci, ci, given: raw.trim(), empty: !v }; }
    return { ok: false, given: '', empty: true };
  });
}
function solText(x, it) {
  if (x.type === 'select') return 'Richtig: ' + it.ok.join(' · ');
  if (x.type === 'cases') return 'Richtig: ' + [...it.matchAll(/\{([nda]):([^}]*)\}/g)].map(m => `${m[2]} = ${CASE[m[1]]}`).join(' · ');
  if (x.type === 'choice') return 'Richtig: ' + plain(it);
  if (x.type === 'match') return 'Richtig: ' + LET[x._opts.indexOf(it.r)] + ') ' + it.r;
  if (x.type === 'order') return 'Richtig: ' + it.ok[0] + it.end;
  if (x.type === 'fill') return 'Richtig: ' + plain(it.replace(/^\([^)]*\)\s*/, ''));
  if (x.type === 'type') return 'Richtig: ' + it.pre + ' ' + it.ok[0] + it.end;
  return '';
}
function check(x, ue) {
  if (x.type === 'free') { freeCheck(x, ue); return; }
  const S = exState[x.id], res = answers(x, ue);
  if (res.every(r => r.empty)) { if (typeof toast === 'function') toast('Bearbeite zuerst die Aufgaben.'); return; }
  const score = res.reduce((sum,r)=>sum+(x.perGap&&Number.isFinite(r.points)?r.points:Number(r.ok)),0), total = res.reduce((sum,r)=>sum+(x.perGap&&r.total?r.total:1),0), passed = score / total >= PASS;
  ue.querySelectorAll('.gr-it').forEach((el, i) => { const r = res[i]; el.classList.remove('ok', 'no'); void el.offsetWidth; el.classList.add(r.ok ? 'ok' : 'no');
    const s = el.querySelector('.gr-sol'); s.hidden = !(r.ok && r.ci); if (r.ok && r.ci) { s.className = 'gr-sol'; s.textContent = 'Richtig – aber achte auf Groß- und Kleinschreibung: ' + solText(x, x.items[i]).replace(/^Richtig: /, ''); } });
  const out = ue.querySelector('.gr-res');
  if (S.shown) { out.className = 'gr-res'; out.textContent = `${score} von ${total} richtig – zählt nicht, weil die Lösung angezeigt wurde.`; return; }
  record({ ch: cur.n, ex: x.id, score, total, passed, at: Date.now(), ans: res.map(r => r.given) });
  S.checked = true; ue.querySelector('[data-act="show"]').disabled = false;
  out.className = 'gr-res ' + (passed ? 'pass' : 'fail');
  out.textContent = `${score} von ${total} richtig (${pct(score, total)} %) – ${passed ? 'bestanden!' : `noch nicht bestanden (ab ${Math.round(PASS * 100)} %)`}`;
  if (passed) burst(ue.querySelector('[data-act="check"]'), score === total);
  refreshBadges();
}
function show(x, ue) {
  const S = exState[x.id]; S.shown = true;
  ue.querySelectorAll('.gr-it').forEach((el, i) => {
    const it = x.items[i], s = el.querySelector('.gr-sol'), wasOk = el.classList.contains('ok');
    if (x.type === 'select') el.querySelectorAll('input').forEach(input=>{input.checked=it.ok.includes(it.options[+input.value]);input.disabled=true;});
    if (x.type === 'cases') el.querySelectorAll('.gr-tag').forEach(g => { g.dataset.st = g.dataset.k; g.dataset.lb = CASE[g.dataset.k]; });
    if (x.type === 'choice') el.querySelectorAll('.gr-gap').forEach(g => g.querySelectorAll('button').forEach(b => {
      const right = b.textContent === g.dataset.ok; b.classList.toggle('right', right); b.classList.toggle('wrong', b.classList.contains('sel') && !right); b.classList.remove('sel'); }));
    if (x.type === 'match') { const sl = el.querySelector('select'); sl.value = LET[x._opts.indexOf(it.r)]; sl.disabled = true; }
    if (x.type === 'fill') el.querySelectorAll('.gr-fill').forEach(i => { const ok = JSON.parse(i.dataset.ok); if (!ok.some(o => o.toLowerCase() === i.value.trim().toLowerCase())) { i.value = ok[0]; i.classList.remove('wrong'); i.classList.add('right'); } i.readOnly = true; });
    if (!wasOk) { s.hidden = false; s.className = 'gr-sol'; s.textContent = solText(x, it); }
  });
  const out = ue.querySelector('.gr-res'); out.className = 'gr-res'; out.textContent = 'Lösung angezeigt. Mit „Neu“ kannst du es noch einmal versuchen.';
}
function reset(x, ue) {
  exState[x.id] = { shown: false, checked: false };
  if (x.gen) x.items = x.gen();
  if (x.gen || x.type === 'match') { const box = ue.querySelector('.gr-items'); box.innerHTML = itemsHTML(x); }
  if (x.type !== 'match') ue.querySelectorAll('.gr-it').forEach((el, i) => { el.classList.remove('ok', 'no'); el.querySelector('.gr-ib').innerHTML = itemBody(x, x.items[i], i); });
  const sh = ue.querySelector('[data-act="show"]'); if (sh) sh.disabled = true;
  ue.querySelector('.gr-res').textContent = '';
}
function refreshBadges() {
  if (!cur) return;
  cur.exercises.forEach(x => { const b = $('ueb-' + x.id); if (b) b.innerHTML = badgeHTML(x); });
  const p = $('grprog'); if (p) p.innerHTML = progHTML(chapterProgress(cur));
  icons();
}
function burst(el, big) {
  const r = el.getBoundingClientRect(), n = big ? 14 : 7, chars = ['✦', '★', '•', '✿'];
  for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.className = 'gr-burst'; s.textContent = chars[i % 4];
    s.style.left = (r.left + r.width / 2) + 'px'; s.style.top = (r.top) + 'px'; s.style.color = ['var(--nom)', 'var(--dat)', 'var(--akk)'][i % 3];
    s.style.setProperty('--x', (Math.random() * 160 - 80) + 'px'); s.style.setProperty('--y', (-40 - Math.random() * 90) + 'px'); s.style.setProperty('--r', (Math.random() * 360) + 'deg');
    document.body.appendChild(s); setTimeout(() => s.remove(), 1000); }
}

/* free writing: LanguageTool (free grammar checker) finds wrong forms; simple rules look for this chapter's typical mistakes.
   Not graded, because no automatic check can be sure about a free sentence. */
async function freeCheck(x, ue) {
  if(!confirm(en()?'Send the sentences in this exercise to LanguageTool for a grammar check? Avoid personal information.':'Die Sätze dieser Übung zur Grammatikprüfung an LanguageTool senden? Bitte keine persönlichen Angaben verwenden.'))return;
  const out = ue.querySelector('.gr-res'), btn = ue.querySelector('[data-act="check"]');
  const items = [...ue.querySelectorAll('.gr-it')], texts = items.map(el => el.querySelector('textarea').value.trim());
  if (texts.every(t => !t)) { if (typeof toast === 'function') toast('Schreib zuerst einen Satz.'); return; }
  btn.disabled = true; out.className = 'gr-res'; out.textContent = 'Wird geprüft …';
  let good = 0, done = 0;
  await Promise.all(items.map(async (el, i) => {
    const t = texts[i], fb = el.querySelector('.gr-fb'); el.classList.remove('ok', 'no');
    if (!t) { fb.innerHTML = ''; return; }
    done++;
    const notes = [], low = t.toLowerCase();
    if (!/[.!?]$/.test(t)) notes.push(['h', 'Am Satzende fehlt ein Punkt.']);
    if (x.verbs && !x.verbs.some(v => new RegExp('\\b(?:\\w+)?' + v, 'i').test(low))) notes.push(['h', x.needMsg || 'Benutze ein passendes Verb aus diesem Kapitel.']);
    for (const fn of x.checks || []) { const r = fn(t); if (r) notes.push(r); }
    if (!x.noLT) try {
      const r = await fetch('https://api.languagetool.org/v2/check', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ text: t, language: 'de-DE' }) });
      const j = await r.json();
      for (const m of j.matches || []) { const bad = t.substr(m.offset, m.length), rep = (m.replacements || []).slice(0, 2).map(r => '„' + r.value + '“').join(' oder ');
        notes.push([m.rule && /TYPOS|CASING/.test(m.rule.category && m.rule.category.id || '') ? 'h' : 'e', `„${bad}“: ${m.shortMessage || m.message}${rep ? ' Besser: ' + rep + '.' : ''}`]); }
    } catch (e) { notes.push(['h', 'Die automatische Rechtschreibprüfung ist gerade nicht erreichbar.']); }
    const errs = notes.filter(n => n[0] === 'e').length;
    if (!notes.length) { good++; el.classList.add('ok'); fb.innerHTML = `<span class="k">Keine Fehler gefunden. Gut gemacht! (Die Prüfung findet nicht jeden Fehler.)</span>`; }
    else { if (errs) el.classList.add('no'); else good++; fb.innerHTML = notes.map(n => `<span class="${n[0]}">${H(n[1])}</span>`).join(''); }
  }));
  btn.disabled = false; out.textContent = `${good} von ${done} Sätzen ohne erkannte Fehler.`;
}

function speakHTML(s) {
  return `<p class="sub" style="margin:-.3rem 0 1rem">${H(s.intro)}</p><div class="gr-spk">${s.items.map((it, i) => `<div class="gr-sc" data-i="${i}">
    <div class="gr-scp">${(it.cue || [['n', 'user-round', it.who], ['arr'], ['d', 'hand-heart', it.whom], ['a', it.icon, it.what]]).map(c => c[0] === 'arr' ? `<span class="arr">${icn('arrow-right')}</span>` : `<span class="${c[0]}">${c[1] ? icn(c[1]) : ''}${H(c[2])}</span>`).join('')}</div>
    <div class="gr-scs hid">Erst laut sagen – dann aufdecken.</div>
    <div class="row"><button class="btn sm" data-spk="say">${icn('eye')} Lösung</button>${it.pron || it.alt ? `<button class="btn sm" data-spk="pron">${icn(it.altIcon || 'replace')} ${H(it.altLabel || s.altLabel || 'Mit Pronomen')}</button>` : ''}</div></div>`).join('')}</div>`;
}

/* ---------- entry point ---------- */
function view(arg, m) {
  css(); closePop(); m = m === 'v' ? 'v' : 'g'; mode = m;
  const [a0, anchor] = String(arg || '').split('/');
  if (!a0) { cur = null; overview(m);
    const feat = m === 'v' ? [201, 'vkfeat'] : [1, 'grfeat'];
    const preview = $(feat[1]); if (preview) preview.innerHTML = icn(m === 'v' ? 'book-a' : 'book-open-text');
    pull().then(() => { if (location.hash === '#/' + m || location.hash === '#/' + m + '/') list(); }); return; }
  if (a0 === 'fortschritt') { cur = null; progressView(m); return; }
  const n = parseInt(a0, 10);
  if (isV(n) !== (m === 'v')) { location.replace(hashOf(n) + (anchor ? '/' + anchor : '')); return; }
  chapter(n, anchor);
}
function leave() { closePop(); cur = null; }
document.addEventListener('click', onClick);
document.addEventListener('toggle', e => { const d = e.target; if (d && d.classList && d.classList.contains('gr-acc')) { const st = tocState(); st[d.dataset.k] = d.open ? 1 : 0; tocSave(st); } }, true);
document.addEventListener('input', e => { const t = e.target; if (!t.closest || !t.closest('.gr-ue')) return; const S = cur && exState[t.closest('.gr-ue').dataset.ex]; if (S && S.shown) return; if (t.classList.contains('gr-fill')) t.classList.remove('right', 'wrong'); const it = t.closest('.gr-it'); if (it) clearMark(t); });
window.addEventListener('scroll', () => { if ($('grpop')) closePop(); }, { passive: true });
window.addEventListener('resize', closePop);

const base = (document.currentScript && document.currentScript.src.replace(/[^/]*$/, '')) || 'grammatik/';
/* ---------- questions for the Spiele (solo and live quiz) ---------- */
function toQuestions(x, it) {
  const sub = x.title;
  if (x.type === 'choice') {
    let k = 0, right = null, opts = null;
    it = it.replace(/^\{p:[^|}]*\|([^}]*)\}\s*/, '»$1« = ');
    const p = it.replace(/\(\(([^)]*)\)\)/g, (m, o) => { const os = o.split('|'); if (k++ === 0) { right = os[0]; opts = os; return '_____'; } return os[0]; });
    const o = shuffle(opts); return { t: 'mc', p: plain(p), o, c: o.indexOf(right), sub };
  }
  if (x.type === 'fill') {
    it = it.replace(/^\{p:[^|}]*\|([^}]*)\}\s*/, '»$1« – ').replace(/\[\[\^/g, '[[');
    const hint = (/^\(([^)]*)\)/.exec(it) || [])[1]; let k = 0, ans = null;
    const p = it.replace(/^\([^)]*\)\s*/, '').replace(/\[\[([^\]]*)\]\]/g, (m, a) => { const ok = a.split('|'); if (k++ === 0) { ans = ok.filter(Boolean); return '_____'; } return ok[0]; });
    if (!ans || !ans.length) return null;
    return { t: 'type', p: plain(p), ans, sub: (hint ? hint + ' · ' : '') + sub };
  }
  if (x.type === 'type') return { t: 'type', p: it.q.replace(/\[([^\]]*)\]/g, '»$1«'), ans: it.ok, sub: it.pre || it.end ? `${x.instr} – Schreib nur den Rest: „${it.pre ? it.pre + ' ' : ''}…${it.end}“` : x.instr };
  if (x.type === 'order') {
    if (it.ok.length > 1) return null;
    let rest = it.ok[0]; const sol = [];
    for (let g = 0; rest && g < 20; g++) { const t = it.tiles.filter(t => !sol.includes(t) && (rest === t || rest.startsWith(t + ' '))).sort((a, b) => b.length - a.length)[0]; if (!t) return null; sol.push(t); rest = rest.slice(t.length).trim(); }
    let o = shuffle(sol); for (let g = 0; g < 6 && o.join(' ') === sol.join(' '); g++) o = shuffle(sol);
    return { t: 'order', p: 'Bring die Teile in die richtige Reihenfolge.', sub: `${sub} · Satzende: „${it.end}“`, o, sol };
  }
  if (x.type === 'match') { const o = shuffle([it.r, ...shuffle(x.items.filter(y => y.r !== it.r).map(y => y.r)).slice(0, 3)]); return { t: 'mc', p: it.l, o, c: o.indexOf(it.r), sub }; }
  if (x.type === 'cases') {
    const tags = [...it.matchAll(/\{([nda]):([^}]*)\}/g)]; if (!tags.length) return null;
    const m = tags[Math.floor(Math.random() * tags.length)], o = ['Nominativ', 'Akkusativ', 'Dativ'];
    return { t: 'mc', p: `Welcher Fall ist „${m[2]}“?`, o, c: o.indexOf(CASE[m[1]]), sub: plain(it) };
  }
  return null;
}
async function quiz(n, count) {
  if (!READY[n] || !allowed(n)) return [];
  const c = await loadChapter(n), pool = [];
  for (const x of c.exercises) { if (x.type === 'free' || x.quiz === false) continue; for (const it of (x.gen ? x.gen() : x.items)) { const q = toQuestions(x, it); if (q && q.o !== undefined ? q.c >= 0 || q.t === 'order' : q) pool.push(q); } }
  // a fair mix: shuffle, but spread the exercise types
  return shuffle(pool).slice(0, count || 10);
}
// chapters for games and assignments: the learner's levels – or all of them while no level is unlocked yet (games are open to everyone)
const chapterList = () => { const all = GROUPS.flatMap(g => g.ch.filter(c => READY[c[0]]).map(c => ({ n: c[0], title: c[1], group: g.t, level: c[3], vocab: !!g.vocab, ref: !!g.ref, no: g.vocab ? topicNo(c[0]) : gNo(c[0]) }))), mine = all.filter(c => allowed(c.n));
  return mine; };
// open the Spiele setup with this chapter already chosen as the question source
function practice(kind) {
  if (!cur) return; const k = 'gd_gset_' + kind;
  let st = {}; try { st = JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) {}
  Object.assign(st, { src: 'gram', id: String(cur.n), title: cur.title }); try { localStorage.setItem(k, JSON.stringify(st)); } catch (e) {}
  location.hash = '#/play/' + kind;
}

/* ---------- shared helpers for Wortschatz topics ---------- */
const VKIT = {
  pick: (arr, n) => shuffle(arr).slice(0, n),
  // small scenes for word cards (200 × 150) and ready-made people
  figs(K) {
    const F = {};
    F.svg = (inner, label) => `<svg viewBox="0 0 200 150" role="img" aria-label="${H(label || '')}"><circle cx="100" cy="84" r="60" fill="var(--sky1)"/><ellipse cx="100" cy="143" rx="78" ry="5" fill="var(--ink)" opacity=".08"/>${inner}</svg>`;
    F.dim = t => `<g opacity=".38">${t}</g>`;
    F.man = (x, o = {}) => K.person(Object.assign({ x, y: 142, s: .6, shirt: 'var(--akk)', skin: 3, hair: 'short', hc: 'var(--hair2)' }, o));
    F.woman = (x, o = {}) => K.person(Object.assign({ x, y: 142, s: .58, shirt: 'var(--nom)', dress: 'var(--nom)', skin: 4, hair: 'long', hc: 'var(--hair3)' }, o));
    F.boy = (x, o = {}) => K.person(Object.assign({ x, y: 142, s: .42, shirt: 'var(--dat)', skin: 1, hair: 'short', hc: 'var(--hair2)' }, o));
    F.girl = (x, o = {}) => K.person(Object.assign({ x, y: 142, s: .42, shirt: 'var(--sun)', dress: 'var(--sun)', skin: 2, hair: 'long', hc: 'var(--hair4)' }, o));
    F.grandpa = (x, o = {}) => K.person(Object.assign({ x, y: 142, s: .58, shirt: 'var(--metal)', skin: 4, hair: 'white', glasses: 1, beard: 'var(--hair1)' }, o));
    F.grandma = (x, o = {}) => K.person(Object.assign({ x, y: 142, s: .56, shirt: 'var(--dat)', dress: 'var(--dat)', skin: 1, hair: 'bun', hc: 'var(--hair1)', glasses: 1 }, o));
    F.heart = (x, y, sc = 1, c = 'var(--die)') => `<path transform="translate(${x} ${y}) scale(${sc})" d="M0 6C-14 -4 -12 -16 -5 -16C-2 -16 0 -13 0 -11C0 -13 2 -16 5 -16C12 -16 14 -4 0 6Z" fill="${c}"/>`;
    F.bag = (x, y, c = 'var(--die)') => `<g><rect x="${x - 11}" y="${y - 14}" width="22" height="26" rx="5" fill="${c}"/><path d="M${x - 6} ${y - 14}v-5q6 -6 12 0v5" stroke="${c}" stroke-width="2.5" fill="none"/><rect x="${x - 7}" y="${y - 3}" width="14" height="8" rx="2" fill="var(--card)" opacity=".5"/></g>`;
    F.book = (x, y, c = 'var(--der)') => `<g transform="translate(${x} ${y})"><path d="M-16 -10q8 -4 16 0q8 -4 16 0v20q-8 -4 -16 0q-8 -4 -16 0z" fill="var(--card)" stroke="${c}" stroke-width="2"/><path d="M0 -10v20" stroke="${c}" stroke-width="2"/></g>`;
    return F;
  },

  tile: (icon, x) => `<span class="vk-ico ${x && x.ar && !x.pf ? x.ar : x && x.pf ? 'die' : 'x'}">${icn(icon)}</span>`,
  lab: x => (x.ar ? x.ar + ' ' : '') + x.w,
  // standard practice for every topic: picture quiz, articles, plural, English -> German
  extras(W, o = {}) {
    const BY = Object.fromEntries(W.map(x => [x.w, x])), lab = VKIT.lab, NOUNS = W.filter(x => x.ps === 'n'), pick = VKIT.pick;
    const same = o.same || [], clash = (a, b) => a === b || same.some(g => g.includes(a) && g.includes(b)) || BY[a].en[0] === BY[b].en[0];
    const EN2 = {}; W.forEach(x => x.en.forEach(e => (EN2[e] = EN2[e] || []).push(x)));
    const out = [];
    if (o.picq && o.picq.length >= 4) out.push({ id: 'm1', more: true, type: 'choice', title: 'Was ist das?', instr: 'Schauen Sie das Bild an und wählen Sie das passende Wort. Bei „Neu“ kommen andere Bilder.',
      gen: () => pick(o.picq, 6).map(w => `{p:${w}|${BY[w].en[0]}} ((${[w, ...pick(o.picq.filter(v => !clash(v, w)), 2)].map(v => lab(BY[v])).join('|')}))`) });
    if (NOUNS.length >= 6) out.push({ id: 'm2', more: true, type: 'choice', title: 'Der, die oder das?', instr: 'Wählen Sie den richtigen Artikel.',
      gen: () => pick(NOUNS.filter(x => x.ar), 8).map(x => `((${[x.ar, ...['der', 'die', 'das'].filter(a => a !== x.ar)].join('|')})) ${x.w}${x.pf ? ' (Plural)' : ''}`) });
    const PL = NOUNS.filter(x => x.pl && !x.sg && !x.pf);
    if (PL.length >= 6) out.push({ id: 'm3', more: true, type: 'fill', title: 'Einer – viele', instr: 'Schreiben Sie den Plural. Vorsicht: Manche Wörter bleiben gleich.',
      gen: () => pick(PL, 8).map(x => `(${x.en[0]}) ${lab(x)} → die [[${x.pl}]]`) });
    const EN = NOUNS.filter(x => x.ar && !(o.enSkip || []).includes(x.w));
    if (EN.length >= 6) out.push({ id: 'm4', more: true, type: 'type', title: 'Auf Deutsch, bitte!', instr: 'Schreiben Sie das deutsche Wort – Nomen mit Artikel (der, die oder das).',
      gen: () => pick(EN, 6).map(x => ({ q: `[${x.en[0]}]`, pre: '', end: '', ok: (EN2[x.en[0]] || [x]).filter(y => y.ps === 'n').map(lab) })) });
    return out;
  }
};
window.GRAM = { kit: VKIT, view, leave, base, quiz, list: chapterList, practice, lessonEpoch: () => lessonEpoch, add(c) { CH[c.n] = c; }, allowed, chLevel,
  chapters: () => GROUPS.flatMap(g => g.ch.filter(c => READY[c[0]]).map(c => ({ n: c[0], title: c[1], kick: c[2], level: c[3], vocab: !!g.vocab, ref: !!g.ref, group: g.t, no: g.vocab ? topicNo(c[0]) : gNo(c[0]) })))
    .sort((a, b) => (a.vocab === b.vocab ? 0 : a.vocab ? -1 : 1) || a.n - b.n),
  requiredExercises: n => (LESSON_EXERCISES[n] || []).filter(row => !(row[2] & 2)).map(row => row[0]),
  async results() { await pull(); return attempts(); },
  setPass(p) { PASS = p > 1 ? p / 100 : p; if (cur) render(cur); }, pass: () => PASS, refresh() { if (window.KONTO && KONTO.can && !KONTO.can(mode === 'v' ? 'vocab' : 'grammar')) return; if (mode && location.hash.match(/^#\/[gv](\/|$)/)) view(decodeURIComponent(location.hash.split('/').slice(2).join('/')), mode); },
  voc: { open: (n, w) => CH[n] && vocabSheet(CH[n], w), play: (n, w, b) => { const x = CH[n] && CH[n].words.find(v => v.w === w); if (x) vplay(x, b); }, say: t => talk(t) }, _test: { findWord, norm, sentenceNorm, render, answers, attempts, best, store, PASS, CH,
  // answers every exercise with its own key; used to check new chapters ("ok" = all 100 %)
  async check(list) {
    const sl = ms => new Promise(r => setTimeout(r, ms)), report = {};
    for (const n of list) {
      location.hash = hashOf(n); for (let k = 0; k < 40 && !(CH[n] && cur === CH[n]); k++) await sl(120); await sl(150);
      const c = CH[n]; if (!c) { report[n] = 'NOT LOADED'; continue; }
      const r = []; if (!document.querySelector('.gr-art svg')) r.push('no art');
      if (c.vocab && c.wordlist) { const inRows = new Set(c.wordlist.flatMap(g => g.rows.flat()).map(w => w.replace(/^(der|die|das|sich) /, '')));
        inRows.forEach(w => { if (!c.words.some(x => x.w === w)) r.push('row word missing: ' + w); }); c.words.forEach(x => { if (!inRows.has(x.w)) r.push('not in word list: ' + x.w); }); }
      for (const x of c.exercises) {
        const ue = $('ue-' + x.id); if (!ue) { r.push(x.id + ' missing'); continue; } if (x.type === 'free') continue;
        ue.querySelectorAll('.gr-it').forEach((el, i) => { const it = x.items[i];
          if (x.type === 'cases') el.querySelectorAll('.gr-tag').forEach(t => { for (let j = 0; j < { n: 1, d: 2, a: 3 }[t.dataset.k]; j++) t.click(); });
          if (x.type === 'choice') el.querySelectorAll('.gr-gap').forEach(g => [...g.querySelectorAll('button')].find(b => b.textContent === g.dataset.ok).click());
          if (x.type === 'fill') el.querySelectorAll('.gr-fill').forEach(f => f.value = JSON.parse(f.dataset.ok)[0]);
          if (x.type === 'type') el.querySelector('input,textarea').value = it.ok[0];
          if (x.type === 'select') el.querySelectorAll('input').forEach(input=>input.checked=it.ok.includes(it.options[+input.value]));
          if (x.type === 'match') el.querySelector('select').value = LET[x._opts.indexOf(it.r)];
          if (x.type === 'order') { let rest = it.ok[0], g = 0; while (rest && g++ < 20) { const t = [...el.querySelectorAll('.gr-pool .gr-tile')].filter(t => rest === t.textContent || rest.startsWith(t.textContent + ' ')).sort((a, b) => b.textContent.length - a.textContent.length)[0]; if (!t) { r.push(x.id + ' item' + (i + 1) + ' cannot build: ' + rest); break; } t.click(); rest = rest.slice(t.textContent.length).trim(); } }
        });
        ue.querySelector('[data-act=check]').click(); await sl(30);
        const res = ue.querySelector('.gr-res').textContent, m = /(\d+) von (\d+)/.exec(res); if (!m || m[1] !== m[2]) r.push(x.id + ': ' + res);
      }
      report[n] = r.length ? r : 'ok';
    }
    try { localStorage.removeItem(LKEY); } catch (e) {} remote = null;
    return JSON.stringify(report);
  } } };
})();
