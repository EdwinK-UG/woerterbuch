/* Wortschatz A1 · Thema 15 – Kleine Wörter.
   Wörter: eigene Auswahl (Grundwortschatz A1). Übersetzungen nach Wiktionary (CC BY-SA),
   Beispielsätze von Tatoeba (CC BY 2.0 FR), Aussprache von Wikimedia Commons.
   Bilder, Wortliste, Tipps und Übungen: eigene Inhalte. Erzeugt von vokabel/build_topic.py. */
(function () {
const W = [{"w":"hier","ps":"adv","g":"Wo?","en":["here"],"ipa":"/hiːr/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/b/b1/De-hier.ogg/De-hier.ogg.mp3","af":"De-hier.ogg","ex":[["Hier ist es.","Here it is.",6644807,35529],["Komm hierher!","Come over!",1430527,472477],["Hier ist sie!","Here she is!",1848490,33119]]},{"w":"dort","ps":"adv","g":"Wo?","en":["there"],"ipa":"/dɔʁt/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/De-dort.ogg/De-dort.ogg.mp3","af":"De-dort.ogg","ex":[["Dort ist es.","That's where it is.",13390528,13309236],["Er wohnt dort.","He lives there.",13030115,8477895],["Dort ist ein Junge.","There is a boy.",2085196,2174726]]},{"w":"oben","ps":"adv","g":"Wo?","en":["up","upstairs","at the top"],"ipa":"/ˈʔoːbən/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/5/5a/De-at-oben.ogg/De-at-oben.ogg.mp3","af":"De-at-oben.ogg","note":"oben ↔ unten","ex":[["Er ist oben.","He is upstairs.",8642400,8179452],["Guck nach oben!","Look up!",8964715,8239311],["Sie ging nach oben.","She went upstairs.",1812041,1410320]]},{"w":"unten","ps":"adv","g":"Wo?","en":["down","downstairs","at the bottom"],"ipa":"/ˈʊntn̩/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/7/78/De-unten2.ogg/De-unten2.ogg.mp3","af":"De-unten2.ogg","ex":[["Das Bad ist unten.","The bathroom is downstairs.",10039807,8989028],["Komm nach unten.","Come downstairs.",5107102,3735983],["Es ist unten.","It's downstairs.",8388054,8976991]]},{"w":"vorne","ps":"adv","g":"Wo?","en":["at the front"],"ipa":"/ˈfɔʁnə/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/4/4b/De-vorne.ogg/De-vorne.ogg.mp3","af":"De-vorne.ogg","note":"vorne ↔ hinten","ex":[["Willst du vorne sitzen?","Do you want to sit in the front?",4982699,3871276],["Ich möchte lieber vorne sitzen.","I'd rather sit in the front.",12459797,12458960]]},{"w":"hinten","ps":"adv","g":"Wo?","en":["at the back"],"ipa":"/ˈhɪntən/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/9/9c/De-hinten.ogg/De-hinten.ogg.mp3","af":"De-hinten.ogg","ex":[["Ich sitze nicht gerne hinten im Bus.","I don't like sitting in the back of a bus.",12406864,6240745],["Das habe ich hinten im Schrank gefunden.","I found that in the back of the closet.",12324405,6244845]]},{"w":"draußen","ps":"adv","g":"Wo?","en":["outside"],"ipa":"/ˈdraʊ̯sən/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/6/6e/De-at-drau%C3%9Fen.ogg/De-at-drau%C3%9Fen.ogg.mp3","af":"De-at-draußen.ogg","ex":[["Komm nach draußen spielen!","Come out and play.",5368963,5367538],["Meine Mutter ist draußen.","My mother is out.",406768,320703],["Es ist draußen schon hell.","It's light out already.",13596150,13611686]]},{"w":"in","ps":"prep","g":"Präpositionen","en":["in","into"],"ipa":"/ʔɪn/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/5/51/DE-in.OGG/DE-in.OGG.mp3","af":"DE-in.OGG","note":"Wo? + Dativ: im Haus · Wohin? + Akkusativ: ins Haus","ex":[["Er ist in der Küche.","He is in the kitchen.",1338751,434934],["Er ist im Haus.","He is in the house.",9984782,8257152],["Josef ist im Garten.","Joseph is in the garden.",5242109,5240422]]},{"w":"auf","ps":"prep","g":"Präpositionen","en":["on","onto"],"ipa":"/aʊ̯f/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/1c/De-auf.ogg/De-auf.ogg.mp3","af":"De-auf.ogg","note":"Wo? auf dem Tisch · Wohin? auf den Tisch","ex":[["Es ist auf dem Tisch.","It's on the table.",1871552,1871551],["Er liegt auf dem Sofa.","He is lying on the sofa.",344463,291410],["Was ist auf dem Tisch?","What is on the desk?",8976399,20561]]},{"w":"unter","ps":"prep","g":"Präpositionen","en":["under","below"],"ipa":"/ˈʊntɐ/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/a/ab/De-unter.ogg/De-unter.ogg.mp3","af":"De-unter.ogg","ex":[["Die Katze ist unter dem Auto.","The cat is under the car.",10734380,10734356],["Die Katze ist unter dem Bett.","The cat is under the bed.",7042691,6772041],["Es ist unter dem Tisch.","It's under the table.",989736,39623]]},{"w":"neben","ps":"prep","g":"Präpositionen","en":["next to","beside"],"ipa":"/ˈneːbən/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/a/aa/De-neben.ogg/De-neben.ogg.mp3","af":"De-neben.ogg","ex":[["Die Küche ist neben dem Wohnzimmer.","The kitchen is next to the living room.",8641705,8910322],["Diese Frau sitzt neben dem Mann.","This woman is sitting next to that man.",12354157,12222357],["Mein Onkel wohnt neben der Schule.","My uncle lives near the school.",499038,65069]]},{"w":"zwischen","ps":"prep","g":"Präpositionen","en":["between"],"ipa":"/ˈtsvɪʃən/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/a/a0/De-zwischen.ogg/De-zwischen.ogg.mp3","af":"De-zwischen.ogg","ex":[["Die Post befindet sich zwischen der Schule und der Bank.","The post office is between the school and the bank.",11481153,11481138],["Der Bus pendelt zwischen der Schule und dem Bahnhof.","The bus runs between the school and the station.",2232102,35430]]},{"w":"vor","ps":"prep","g":"Präpositionen","en":["in front of","before"],"ipa":"/foːr/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/a/ac/De-vor.ogg/De-vor.ogg.mp3","af":"De-vor.ogg","note":"vor dem Haus (Ort) · vor zwei Jahren (Zeit)","ex":[["Ein Baum steht vor dem Haus.","A tree stands in front of the house.",5099592,6210038],["Der Garten ist vor dem Haus.","The garden is in front of the house.",719550,278502],["Das Kino ist vor dem Bahnhof.","The cinema is outside the station.",10967036,11126749]]},{"w":"hinter","ps":"prep","g":"Präpositionen","en":["behind"],"ipa":"/ˈhɪntər/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/4/43/De-hinter2.ogg/De-hinter2.ogg.mp3","af":"De-hinter2.ogg","ex":[["Ich bin hinter dem Baum.","I'm behind the tree.",10080663,10099836],["Hast du hinter dem Haus nachgesehen?","Did you look behind the house?",12647988,12305450]]},{"w":"mit","ps":"prep","g":"Präpositionen","en":["with"],"ipa":"/mɪt/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/0/00/De-mit.ogg/De-mit.ogg.mp3","af":"De-mit.ogg","note":"mit + Dativ: mit dem Bus, mit meiner Mutter","ex":[["Ich trinke Kaffee mit Milch.","I drink coffee with milk.",6116929,6733372],["Wo ist der Tee mit Milch?","Where is the tea with milk?",470154,453458]]},{"w":"ohne","ps":"prep","g":"Präpositionen","en":["without"],"ipa":"/ˈoːnə/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/3/36/De-ohne.ogg/De-ohne.ogg.mp3","af":"De-ohne.ogg","note":"ohne + Akkusativ: ohne mich, ohne Zucker","ex":[["Ich trinke Tee ohne Zucker.","I take my tea without sugar.",2287668,248721]]},{"w":"für","ps":"prep","g":"Präpositionen","en":["for"],"ipa":"/fyːɐ̯/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/6/6a/De-f%C3%BCr.ogg/De-f%C3%BCr.ogg.mp3","af":"De-für.ogg","note":"für + Akkusativ: für dich, für meinen Bruder","ex":[["Das ist für dich.","This is for you.",396854,55752],["Diese Rose ist für dich.","This rose is for you.",11401248,11401195],["Der Rest ist für dich.","The rest is for you.",4699849,12466758]]},{"w":"und","ps":"conj","g":"Verbinden","en":["and"],"ipa":"/ʊnt/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/0/08/De-und.ogg/De-und.ogg.mp3","af":"De-und.ogg","ex":[["Er und ich sind Brüder.","He and I are brothers.",1815864,284474],["Es gab Kartoffeln, Würstchen und Käse.","There were potatoes, sausage, and cheese.",13346957,12244896]]},{"w":"oder","ps":"conj","g":"Verbinden","en":["or"],"ipa":"/ˈoːdər/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/a/af/De-oder.ogg/De-oder.ogg.mp3","af":"De-oder.ogg","note":"Kaffee oder Tee?","ex":[["Kaffee oder Tee?","Coffee or tea?",1080150,1080170],["Magst du Tee oder Kaffee?","Do you like tea or coffee?",410762,70153],["Trinkst du Tee oder Kaffee?","Do you drink tea or coffee?",1434864,1308157]]},{"w":"aber","ps":"conj","g":"Verbinden","en":["but"],"ipa":"/ˈaːbɐ/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/9/9d/De-aber.ogg/De-aber.ogg.mp3","af":"De-aber.ogg","note":"Ich bin müde, aber ich komme mit.","ex":[["Sie ist reich, aber er ist arm.","She is rich but he is poor.",526288,313309],["Nur zu gern, aber ich habe zu tun.","I'd love to, but I'm busy.",7042749,2908765],["Du bist Profi, aber ich bin Amateur.","You are a professional, but I am an amateur.",1045150,69774]]},{"w":"ja","ps":"intj","g":"Antworten","en":["yes"],"au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f7/De-ja.ogg/De-ja.ogg.mp3","af":"De-ja.ogg","ex":[["Ja, natürlich.","Yes, of course.",413792,30530],["Ja, ich weiß.","Yes, I know.",3881090,35504],["Ja, gerne.","I don't mind if I do!",560482,559837]]},{"w":"nein","ps":"intj","g":"Antworten","en":["no"],"ipa":"/naɪ̯n/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f6/De-nein.ogg/De-nein.ogg.mp3","af":"De-nein.ogg","ex":[["Nein, danke.","Thanks, but no thanks.",358356,67362],["Nein, ich bin müde.","No, I'm tired.",451195,66779],["Nein, ich will nicht.","No, I don't want to.",1985907,1981493]]},{"w":"doch","ps":"adv","g":"Antworten","en":["yes (after a negative question)"],"ipa":"/dɔx/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/a/ac/De-doch.ogg/De-doch.ogg.mp3","af":"De-doch.ogg","note":"Antwort auf eine negative Frage: Hast du keine Zeit? – Doch! (= Yes, I do.)","ex":[["Doch, ich war zu Hause!","No, I was at home!",4006079,4021892],["Doch, ich glaube an Wunder.","I do believe in miracles.",7567821,5639101]]},{"w":"nicht","ps":"adv","g":"Antworten","en":["not"],"ipa":"/nɪçt/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/6/69/De-nicht.ogg/De-nicht.ogg.mp3","af":"De-nicht.ogg","note":"nicht = not · kein = no/not a: Ich habe kein Auto.","ex":[["Das ist nicht gut.","This is no good.",1907056,3363714],["Ich bin nicht da.","I'm not in.",3108356,5828923]]},{"w":"auch","ps":"adv","g":"Wie viel?","en":["also","too"],"ipa":"/aʊ̯x/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f8/De-auch.ogg/De-auch.ogg.mp3","af":"De-auch.ogg","ex":[["Ich komme auch.","I'm coming, too.",6644264,5853093],["Ich bin auch müde.","I'm tired, too.",10029797,5102485],["Ich bin auch Arzt.","I, too, am a doctor.",13428161,11634455]]},{"w":"nur","ps":"adv","g":"Wie viel?","en":["only","just"],"ipa":"/nuːɐ̯/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/6/60/De-nur_fcm.ogg/De-nur_fcm.ogg.mp3","af":"De-nur fcm.ogg","ex":[["Ich habe nur eine Frage.","I only have one question.",1956667,1956046],["Ich habe nur noch eine.","I only have one left.",1144855,11200186],["Ich habe nur wenig Geld.","I have a little money.",5383911,18587]]},{"w":"sehr","ps":"adv","g":"Wie viel?","en":["very"],"ipa":"/zeːr/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/4/4a/De-sehr.ogg/De-sehr.ogg.mp3","af":"De-sehr.ogg","ex":[["Es ist sehr gut.","It's very good.",356163,37872],["Es war sehr gut.","It was very good.",10071676,3392956],["Er ist sehr gut.","He's very good.",8890678,8478708]]},{"w":"viel","ps":"adv","g":"Wie viel?","en":["much","a lot"],"ipa":"/fiːl/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/b/bb/De-viel.ogg/De-viel.ogg.mp3","af":"De-viel.ogg","note":"viel Geld · viele Leute (Plural)","ex":[["Er hat viel Geld.","He has a lot of money.",737213,480576],["Das ist viel Geld.","That's a lot of money.",2208309,2206502],["Hast du viel Zeit?","Do you have a lot of time?",368279,69902]]},{"w":"wenig","ps":"adv","g":"Wie viel?","en":["little","not much"],"ipa":"/ˈveːnɪç/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/5/50/De-wenig.ogg/De-wenig.ogg.mp3","af":"De-wenig.ogg","ex":[["Ich habe wenig Geld.","I am short of money.",340854,18613],["Wir haben wenig Zeit.","We don't have too much time.",1777671,3819692],["Er hat wenig Geld.","He has little money.",522499,530809]]},{"w":"etwas","ps":"pron","g":"Wie viel?","en":["something","some"],"ipa":"/ˈɛtvas/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/1/1c/De-etwas.ogg/De-etwas.ogg.mp3","af":"De-etwas.ogg","ex":[["Kann ich etwas für Sie tun?","Can I do anything for you?",363388,25266],["Ich habe noch etwas für dich.","I have something else for you.",6203495,3302649]]},{"w":"noch","ps":"adv","g":"Wie viel?","en":["still","yet","more"],"ipa":"/nɔx/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/c/cd/De-at-noch.ogg/De-at-noch.ogg.mp3","af":"De-at-noch.ogg","note":"noch nicht = not yet · noch einmal = once more","ex":[["Hast du noch Zeit?","Do you still have time?",8088445,3819653],["Hast du noch Bier?","Do you still have beer?",9435299,9435298]]},{"w":"schon","ps":"adv","g":"Wie viel?","en":["already"],"ipa":"/ʃoːn/","au":"https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/De-schon.ogg/De-schon.ogg.mp3","af":"De-schon.ogg","note":"schon = already · noch nicht = not yet","ex":[["Ich bin schon da.","I'm already there.",6198941,6198944],["Ich habe es dir schon gesagt.","I've already told you that.",2485729,2358915]]}];
const BY = Object.fromEntries(W.map(x => [x.w, x]));
const kit = GRAM.kit, pick = kit.pick;
let K = null, F = null;
const ICON = {
  hier: 'map-pin', dort: 'navigation', oben: 'arrow-big-up', unten: 'arrow-big-down', vorne: 'arrow-up-to-line', hinten: 'arrow-down-to-line', draußen: 'trees',
  mit: 'plus', ohne: 'minus', für: 'gift', und: 'ampersand', oder: 'split', aber: 'git-compare-arrows', ja: 'thumbs-up', nein: 'thumbs-down', doch: 'rotate-ccw',
  nicht: 'ban', auch: 'copy-plus', nur: 'target', sehr: 'chevrons-up', viel: 'boxes', wenig: 'box', etwas: 'circle-dot-dashed', noch: 'hourglass', schon: 'check-check'
};
/* a ball and a box: where is the ball? */
const box = (x, y = 136, o = 1) => `<g opacity="${o}"><rect x="${x - 34}" y="${y - 52}" width="68" height="52" rx="4" fill="var(--wood)"/><path d="M${x - 34} ${y - 40}h68" stroke="var(--floor)" stroke-width="3"/></g>`;
const ball = (x, y, r = 14) => `<circle cx="${x}" cy="${y}" r="${r}" fill="var(--die)"/><path d="M${x - r * .6} ${y - r * .4}q${r * .6} ${r * .5} ${r * 1.2} 0" stroke="var(--card)" stroke-width="2" fill="none" opacity=".7"/>`;
const POS = {
  in: () => `<path d="M66 84l10-12h48l10 12z" fill="var(--ink)" opacity=".35"/>` + ball(100, 82, 14) + `<rect x="66" y="84" width="68" height="52" rx="4" fill="var(--wood)"/><path d="M66 96h68" stroke="var(--floor)" stroke-width="3"/>`,
  auf: () => box(100) + ball(100, 70),
  unter: () => `<rect x="54" y="66" width="92" height="10" rx="3" fill="var(--wood)"/><rect x="60" y="76" width="8" height="60" fill="var(--wood)"/><rect x="132" y="76" width="8" height="60" fill="var(--wood)"/>` + ball(100, 122),
  neben: () => box(80) + ball(140, 122),
  zwischen: () => box(52) + box(148) + ball(100, 122),
  vor: () => box(108, 120) + ball(92, 128, 16),
  hinter: () => ball(118, 86, 17) + box(100)
};
function pic(w) {
  if (POS[w] && K) { F = F || kit.figs(K); return F.svg(POS[w](), 'Bild: ' + w); }
  return ICON[w] ? kit.tile(ICON[w], BY[w]) : '';
}
/* hero: a cat in, on and under */
function art(Kit) {
  K = Kit; F = kit.figs(Kit);
  return Kit.svg(Kit.room(true) + `<rect x="150" y="200" width="220" height="12" rx="4" fill="var(--wood)"/><rect x="164" y="212" width="10" height="114" fill="var(--wood)"/><rect x="346" y="212" width="10" height="114" fill="var(--wood)"/>` +
    Kit.cat(220, 200, { s: .8 }) + Kit.dog(270, 326, { s: .7 }) + `<g transform="translate(60 0)">${box(30, 326)}</g>` + Kit.cat(90, 300, { s: .5, c: 'var(--nom)' }) +
    Kit.bubble(300, 90, 'Die Katze ist *auf* dem Tisch, der Hund *unter* dem Tisch.', { tail: 'l', w: 420 }), 'Eine Katze sitzt auf dem Tisch, ein Hund liegt unter dem Tisch, eine kleine Katze sitzt in einer Kiste.');
}
const PREPS = [['in', 'in der Kiste'], ['auf', 'auf der Kiste'], ['unter', 'unter dem Tisch'], ['neben', 'neben der Kiste'], ['zwischen', 'zwischen den Kisten'], ['vor', 'vor der Kiste'], ['hinter', 'hinter der Kiste']];

GRAM.add({
  n: 215, level: 'A1', group: 'Wortschatz A1', vocab: true,
  title: 'Kleine Wörter',
  kicker: 'hier und dort, mit und ohne, ja und doch',
  intro: 'Kleine Wörter – aber sehr wichtig! Hier finden Sie Wörter für den <b>Ort</b>, <b>Präpositionen</b>, Wörter zum <b>Verbinden</b> und zum <b>Antworten</b> und Wörter für <b>wie viel</b>.',
  hero: 'Die Katze ist auf dem Tisch, und der Hund liegt unter dem Tisch.',
  art, words: W, pic,
  lemmas: {},

  wordlist: [
    { h: 'Wo?', rows: [['hier', 'dort'], ['oben', 'unten'], ['vorne', 'hinten'], ['draußen']],
      box: ['{b:Hier} ist es schön.', 'Das Bad ist {b:unten}.', 'Die Kinder spielen {b:draußen}.'] },
    { h: 'Präpositionen', rows: [['in', 'auf'], ['unter', 'neben'], ['zwischen'], ['vor', 'hinter'], ['mit', 'ohne'], ['für']],
      box: ['Die Katze ist {b:unter} dem Auto.', 'Ich trinke Kaffee {b:mit} Milch, aber {b:ohne} Zucker.', 'Das ist {b:für} dich!'] },
    { h: 'Verbinden', rows: [['und', 'oder'], ['aber']],
      box: ['Kaffee {b:oder} Tee?', 'Ich bin müde, {b:aber} ich komme mit.'] },
    { h: 'Antworten', rows: [['ja', 'nein'], ['doch'], ['nicht']],
      box: ['{b:Ja}, natürlich!', '{b:Nein}, danke.', 'Hast du keine Zeit? – {b:Doch}!'] },
    { h: 'Wie viel?', rows: [['auch', 'nur'], ['sehr'], ['viel', 'wenig'], ['etwas'], ['noch', 'schon']],
      box: ['Ich komme {b:auch}.', 'Ich habe {b:nur} eine Frage.', 'Das ist {b:sehr} gut!', 'Hast du {b:noch} Zeit?'] }
  ],
  info: `<table><tr><td>Hast du Zeit?</td><td>Ja! (= ich habe Zeit)</td><td>Nein. (= ich habe keine Zeit)</td></tr>
    <tr><td>Hast du keine Zeit?</td><td>Doch! (= ich habe Zeit)</td><td>Nein. (= ich habe keine Zeit)</td></tr></table>
    <p style="margin:.4rem 0 0">„Doch“ widerspricht einer negativen Frage. Präpositionen: mehr in <a href="#/g/35">Grammatik, Kapitel 35</a></p>`,
  tips: [
    { t: 'Lernen Sie Präpositionen mit einem Bild: Ein Ball und eine Kiste – wo ist der Ball?', note: 'in · auf · unter · neben · zwischen · vor · hinter' },
    { t: 'Lernen Sie kleine Wörter immer in einem kurzen Satz, nicht allein.', note: 'mit Milch · ohne Zucker · für dich' },
    { t: '„Doch“ ist ein besonderes deutsches Wort: Es sagt „ja“ zu einer negativen Frage.', note: 'Kommst du nicht? – Doch!' },
    { t: 'Paare helfen beim Merken.', note: 'hier – dort · oben – unten · viel – wenig · mit – ohne' }
  ],
  understand: [],
  examples: [],

  exercises: [
    { id: 'u1', type: 'choice', title: 'Wo ist der Ball? – Wählen Sie.', instr: 'Schauen Sie das Bild an. Bei „Neu“ kommen andere Bilder.',
      gen: () => pick(PREPS, 6).map(([p, place]) => { const o = pick(PREPS.map(x => x[0]).filter(x => x !== p), 2), rest = place.slice(p.length + 1);
        return `{p:${p}|${BY[p].en[0]}} Der Ball ist ((${[p, ...o].join('|')})) ${rest}.`; }) },
    { id: 'u2', type: 'fill', title: 'Präpositionen – Ergänzen Sie.', instr: 'In, auf, unter, neben, zwischen, vor oder hinter?',
      items: [ 'Die Katze schläft [[auf]] dem Sofa.', 'Die Milch ist [[im|in dem]] Kühlschrank.', 'Der Hund liegt [[unter]] dem Tisch.', 'Die Post ist [[zwischen]] der Bank und dem Supermarkt.',
        'Das Auto steht [[vor]] dem Haus.', 'Der Garten ist [[hinter]] dem Haus.', 'Ich sitze im Kurs [[neben]] Grace.' ] },
    { id: 'u3', type: 'choice', title: 'Und, oder, aber? – Wählen Sie.', instr: 'Welches Wort passt?',
      items: [ 'Möchtest du Kaffee ((oder|und|aber)) Tee?', 'Ich bin müde, ((aber|oder|und)) ich komme mit.', 'Mein Bruder ((und|oder|aber)) ich wohnen in Berlin.',
        'Das Essen ist gut, ((aber|und|oder)) teuer.', 'Fahren wir mit dem Bus ((oder|aber)) mit dem Fahrrad?', 'Ich kaufe Brot, Milch ((und|aber|oder)) Eier.' ] },
    { id: 'u4', type: 'choice', title: 'Ja, nein oder doch? – Wählen Sie.', instr: 'Achtung: Auf eine negative Frage antwortet man mit „doch“, wenn man „ja“ meint.',
      items: [ 'Bist du müde? – ((Ja|Doch)), ich bin müde.', 'Bist du nicht müde? – ((Doch|Ja)), ich bin müde.', 'Hast du keinen Hunger? – ((Nein|Doch|Ja)), ich habe keinen Hunger.',
        'Kommst du heute nicht? – ((Doch|Ja|Nein)), ich komme!', 'Möchten Sie Kaffee? – ((Nein|Doch)), danke.', 'Hast du keine Geschwister? – ((Doch|Ja)), ich habe einen Bruder.' ] },
    { id: 'u5', type: 'choice', title: 'Mit, ohne oder für? – Wählen Sie.', instr: 'Welches Wort passt?',
      items: [ 'Ich trinke Kaffee ((mit|für|ohne)) Milch – ich mag Milch!', 'Ich trinke Tee ((ohne|mit|für)) Zucker – Zucker ist nicht gesund.', 'Das Geschenk ist ((für|mit|ohne)) dich.',
        'Wir fahren ((mit|für|ohne)) dem Bus.', 'Geh nicht ((ohne|für|mit)) deinen Pass!', 'Ich koche heute ((für|ohne|mit)) meine Freunde.' ] },
    { id: 'u6', type: 'fill', title: 'Gegenteile – Ergänzen Sie.', instr: 'Schreiben Sie das Gegenteil.',
      items: [ 'Das Bad ist nicht oben, es ist [[unten]].', 'Ich wohne nicht dort, ich wohne [[hier]].', 'Wir sitzen nicht hinten, wir sitzen [[vorne]].', 'Ich habe nicht viel Geld, ich habe [[wenig]] Geld.',
        'Ich trinke Kaffee nicht mit Milch, sondern [[ohne]] Milch.', 'Er ist nicht drinnen, er ist [[draußen]].' ] },
    { id: 'u7', type: 'choice', title: 'Auch, nur, sehr, noch, schon – Wählen Sie.', instr: 'Welches Wort passt am besten?',
      items: [ 'Du kommst? Ich komme ((auch|nur|sehr)).', 'Ich habe ((nur|auch|sehr)) eine Frage – dann bin ich fertig.', 'Das Essen ist ((sehr|nur|noch)) gut!',
        'Hast du ((noch|sehr|nur)) Zeit? – Ja, noch zehn Minuten.', 'Ist Daniel ((schon|sehr|auch)) da? – Ja, er ist seit acht Uhr hier.', 'Ich habe ((wenig|viel|sehr)) Zeit – nur fünf Minuten.' ] },
    ...kit.extras(W, { picq: ['in', 'auf', 'unter', 'neben', 'zwischen', 'vor', 'hinter', 'oben', 'unten', 'ja', 'nein', 'mit', 'ohne'],
      same: [['in', 'auf', 'unter', 'neben', 'zwischen', 'vor', 'hinter'], ['oben', 'unten'], ['ja', 'nein', 'doch'], ['mit', 'ohne']] }),
    { id: 'm5', more: true, type: 'order', title: 'Sätze bauen', instr: 'Tippen Sie die Teile in der richtigen Reihenfolge an.',
      items: [ { tiles: ['Die Katze', 'ist', 'unter', 'dem Tisch'], ok: ['Die Katze ist unter dem Tisch'], end: '.' }, { tiles: ['Ich', 'trinke', 'Kaffee', 'ohne Zucker'], ok: ['Ich trinke Kaffee ohne Zucker'], end: '.' },
        { tiles: ['Das Geschenk', 'ist', 'für', 'dich'], ok: ['Das Geschenk ist für dich'], end: '.' }, { tiles: ['Ich', 'habe', 'nur', 'eine Frage'], ok: ['Ich habe nur eine Frage'], end: '.' },
        { tiles: ['Hast', 'du', 'noch', 'Zeit'], ok: ['Hast du noch Zeit'], end: '?' }, { tiles: ['Ich', 'bin', 'müde', 'aber glücklich'], ok: ['Ich bin müde aber glücklich'], end: '.' } ] },
    { id: 'm6', more: true, type: 'free', title: 'Schreiben: Wo ist was?', graded: false,
      instr: 'Schreiben Sie ganze Sätze. Die automatische Prüfung findet viele Fehler, aber nicht alle – diese Übung zählt nicht für die Note.',
      items: [ { q: 'Schauen Sie sich in Ihrem Zimmer um. Wo ist was?', ph: 'Das Buch ist auf dem Tisch …' }, { q: 'Wie trinken Sie Kaffee oder Tee?', ph: 'Ich trinke Tee mit …' },
        { q: 'Was machen Sie heute? Benutzen Sie „und“, „oder“ und „aber“.', ph: 'Heute … und … aber …' } ] }
  ],

  dialogs: [
    { type: 'dialog', title: 'Hören und nachsprechen: Wo ist mein Handy?', lines: [
      ['A', 'Wo ist mein Handy?'], ['B', 'Ist es nicht auf dem Tisch?'], ['A', 'Nein, da ist es nicht.'], ['B', 'Vielleicht unter dem Sofa?'], ['A', 'Ja, hier ist es! Danke!'] ] },
    { type: 'dialog', title: 'Hören und nachsprechen: Kaffee oder Tee?', lines: [
      ['A', 'Möchtest du Kaffee oder Tee?'], ['B', 'Tee, bitte. Ohne Zucker.'], ['A', 'Mit Milch?'], ['B', 'Nein, danke. Nur Tee.'], ['A', 'Möchtest du keinen Kuchen?'], ['B', 'Doch, gern!'] ] }
  ],

  speak: { title: 'Sprechen', intro: 'Sagen Sie einen Satz zu den Stichwörtern – erst laut, dann aufdecken.', altLabel: 'Weiter',
    gen: () => pick([
      { cue: [['x', 'map-pin', 'Handy?']], say: 'Wo ist mein Handy?' },
      { cue: [['x', 'arrow-big-down', 'unter dem Sofa']], say: 'Das Handy ist unter dem Sofa.' },
      { cue: [['x', 'split', 'Kaffee / Tee']], say: 'Möchtest du Kaffee oder Tee?' },
      { cue: [['x', 'plus', 'Milch'], ['x', 'minus', 'Zucker']], say: 'Ich trinke Kaffee mit Milch, aber ohne Zucker.' },
      { cue: [['x', 'gift', 'für dich']], say: 'Das ist für dich!' },
      { cue: [['x', 'rotate-ccw', 'keine Zeit?']], say: 'Hast du keine Zeit? – Doch!' },
      { cue: [['x', 'target', 'eine Frage']], say: 'Ich habe nur eine Frage.' },
      { cue: [['x', 'copy-plus', 'auch']], say: 'Ich komme auch.' },
      { cue: [['x', 'chevrons-up', 'sehr gut']], say: 'Das ist sehr gut!' },
      { cue: [['x', 'trees', 'draußen']], say: 'Die Kinder spielen draußen.' }
    ], 6) }
});
})();
