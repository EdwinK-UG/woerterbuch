function updatePageMetadata() {
  const parts = location.hash.slice(2).split("/");
  let word = "";
  try {
    if (parts[0] === "w") word = decodeURIComponent(parts.slice(1).join("/"));
  } catch {}
  const names = {
    start: ["Learn German", "Deutsch lernen"],
    privacy: ["Privacy and your data", "Datenschutz und deine Daten"],
    v: ["Vocabulary", "Wortschatz"],
    g: ["Grammar", "Grammatik"],
    lists: ["Revision lists", "Revisionslisten"],
    decks: ["Flashcards", "Lernkarten"],
    play: ["Play", "Spielen"],
    klasse: ["Classes & invitations", "Klassen & Einladungen"],
    settings: ["Settings", "Einstellungen"],
    kurs: ["My course", "Mein Kurs"],
    aufgaben: ["Assignments", "Aufgaben"],
    schule: ["School", "Schule"],
    admin: ["Owner dashboard", "Übersicht"],
    "": ["German dictionary", "Deutsches Wörterbuch"],
  };
  const title =
    word || (names[parts[0]] ? ui(...names[parts[0]]) : "Deutschklinik");
  const school = window.KONTO?.brand()?.name;
  document.title =
    title + " · " + (school || "Deutschklinik");
  const description = document.querySelector('meta[name="description"]');
  if (description)
    description.content = word
      ? ui(
          "Meanings, examples and pronunciation of " + word + ".",
          "Bedeutungen, Beispiele und Aussprache von " + word + ".",
        )
      : ui(
          "Learn German with vocabulary topics, grammar exercises, a dictionary, flashcards and practice games.",
          "Deutsch lernen mit Wortschatz-Themen, Grammatikübungen, Wörterbuch, Lernkarten und Lernspielen.",
        );
}
function privacyPage() {
  V().innerHTML = `<article class="ks-page">
    <h1>${ui("Privacy and your data", "Datenschutz und deine Daten")}</h1>
    <h2>${ui("Your account and practice", "Dein Konto und deine Übungen")}</h2>
    <p>${ui("Supabase stores your sign-in details, profile, lists, flashcards, custom quizzes and submitted practice attempts. Lists, cards and quizzes are private to your account. Authorized staff at your current school can read your profile and practice history, including earlier attempts.", "Supabase speichert Anmeldedaten, Profil, Listen, Lernkarten, eigene Quizze und eingereichte Übungsversuche. Listen, Karten und Quizze sind deinem Konto vorbehalten. Berechtigte Lehrkräfte deiner aktuellen Schule sehen dein Profil und deine Übungshistorie einschließlich früherer Versuche.")}</p>
    <p>${ui("Practice scores are checked in your browser. They are learning indicators.", "Übungsergebnisse werden im Browser geprüft. Sie dienen als Lernhinweise.")}</p>
    <h2>${ui("On this device", "Auf diesem Gerät")}</h2>
    <p>${ui("The browser keeps your session, guest work, account cache, pending saves and exercise attempts. Signing out hides your account work. Pending saves remain in a separate cache for that account until you sign in again. Offline dictionary files and pictures use browser caches. Clearing browser data can remove work that has not synchronized.", "Der Browser speichert Sitzung, Gastdaten, Kontocache, ausstehende Änderungen und Übungsversuche. Beim Abmelden werden Kontodaten ausgeblendet. Ausstehende Änderungen bleiben in einem getrennten Cache bis zur nächsten Anmeldung erhalten. Offline-Wörterbuch und Bilder liegen im Browsercache. Beim Löschen der Browserdaten können noch nicht synchronisierte Änderungen verloren gehen.")}</p>
    <h2>${ui("Optional services", "Optionale Dienste")}</h2>
    <p>${ui("Free-writing checks send the text you choose to check to LanguageTool after confirmation. Image and dictionary suggestions are processed by the Cloudflare Worker and its AI or photo providers. Public live-game rooms share nicknames, answers and scores with their participants. Use a nickname and avoid personal information in public rooms.", "Bei der Prüfung frei geschriebener Sätze wird der gewählte Text nach Bestätigung an LanguageTool gesendet. Bild- und Wörterbuchvorschläge verarbeitet der Cloudflare Worker mit KI- und Fotoanbietern. Öffentliche Live-Spiele teilen Spitznamen, Antworten und Punkte mit den Teilnehmenden. Verwende einen Spitznamen und vermeide persönliche Angaben in öffentlichen Räumen.")}</p>
    <p>${ui("With English translations enabled, uncached public dictionary text is translated by Cloudflare Workers AI and cached for reuse. No private learner writing is included. Machine translations are labelled and may contain errors. Daily generation limits apply. You can turn English off in an entry; that choice is remembered on this device.", "Bei aktivierten englischen Übersetzungen übersetzt Cloudflare Workers AI noch nicht gespeicherten öffentlichen Wörterbuchtext. Die Übersetzungen werden zur Wiederverwendung gespeichert. Private Texte von Lernenden sind nicht enthalten. Maschinelle Übersetzungen sind gekennzeichnet und können Fehler enthalten. Es gelten tägliche Erzeugungslimits. Englisch lässt sich im Eintrag ausschalten; die Auswahl wird auf diesem Gerät gespeichert.")}</p>
    <p>${ui("Fonts and icons load from Google Fonts and a public CDN. Pronunciation and photos may load from Wikimedia or stock-photo services. These services receive normal connection information when requested.", "Schriften und Symbole werden von Google Fonts und einem öffentlichen CDN geladen. Aussprache und Fotos können von Wikimedia oder Fotodiensten kommen. Die Dienste erhalten bei Abruf die üblichen Verbindungsdaten.")}</p>
    <h2>${ui("Export or request deletion", "Export oder Löschanfrage")}</h2>
    <p>${ui("Sign in and open your account to download your saved work and practice history. For account deletion, data-protection or school-sharing questions, contact us at <a href=\"mailto:support@deutschklinik.com\">support@deutschklinik.com</a>.", "Melde dich an und öffne dein Konto, um gespeicherte Daten und Übungshistorie herunterzuladen. Bei Fragen zur Kontolöschung, zum Datenschutz oder zur Weitergabe an Schulen erreichst du uns unter <a href=\"mailto:support@deutschklinik.com\">support@deutschklinik.com</a>.")}</p>
    <h2>${ui("Content sources", "Inhaltsquellen")}</h2>
    <p>${ui("The dictionary identifies Langenscheidt as its source. Vocabulary lessons identify Wiktionary and Tatoeba and link to their sources. AI entries carry a separate label.", "Das Wörterbuch nennt Langenscheidt als Quelle. Wortschatz-Themen nennen Wiktionary und Tatoeba und verlinken ihre Quellen. KI-Einträge sind gesondert gekennzeichnet.")}</p>
  </article>`;
}
