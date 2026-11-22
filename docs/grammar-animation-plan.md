# Animated grammar A1–B1: lessons and practice with the Rive cast (plan, draft 2)

**Status:** for your review, 22 Nov 2026. Nothing is built yet. Draft 1 was checked by two independent reviewers:
a German-teaching reviewer and an animation-production reviewer. Their findings are worked in, and section 0 lists
what changed.

**Scope:** the first two chapters of each grammar group from A1 to B1, in the order the grammar page shows them
(`tools/grammar-a1b1/order.json`). That is 24 groups and 46 chapters. Two groups have only one chapter (44 and 51).
Two chapters already have a scene: Kapitel 1 has *Im Dorf* and Kapitel 57 has the *Trennbar-Werkstatt*.

Each chapter gets two parts:

1. **Film** (the lesson), **2–3 minutes**, in 4–6 short scenes that can also be played one at a time. Elisa, the
   ElevenLabs narrator, explains the rule. The characters speak only the example sentences and act them out. Each
   scene ends with a short summary card (*Merksatz*).
2. **Mitspielen** (the practice) in the same scene, 8–12 rounds. Wherever possible it uses the chapter's own
   exercise sentences from the private lines file, as *Wunschzauber* does, so the grading matches the lesson.

---

## 0. What changed after the review

| Finding | Change |
|---|---|
| **The rig cannot carry while walking, and cannot gesture while sitting.** The state machine enters gestures and Holding only from Idle or a walk (checked in `rive_build.py`). | These are now the first Rive work. Scenes that need them are staged standing until then. **This also affects the live *Im Dorf*:** Opa's wave in scene 5 is probably dropped while he sits on his bench. |
| The figures' heads are one rigid picture, and the clothes are baked in. | There is no head-shake: a raised hand is used instead (see §1.6). Nothing is put on or taken off. Kap 68 uses objects, not hats. |
| My case colours clashed with the site. The genders are already der blue, die rose, das green, and the grammar pages colour the cases Nom amber, Akk teal, Dat violet. | The film uses **the site's own case colours**, plus one new colour for the Genitiv, and a letter badge (N, A, D, G) for colour-blind learners. |
| The arrow meant three things (action, Akkusativ, and *zu*). That would teach "movement = Akkusativ". | **Arrow and pin show only the question:** arrow = *Wohin?*, pin = *Wo?*. **Case is shown only by colour and letter.** |
| "Wrong grammar does the literal wrong thing" invents meanings where the wrong form means nothing. | That feedback is kept only where the wrong form is a real, different sentence (marked **Folge**). Everything else gets **neutral** feedback: "passt nicht", with the reason. |
| Labelling the Nominativ "who acts" breaks in the Passiv and with *schmecken*. | The ring label is "**Subjekt: das Verb passt zu ihm**". |
| Eight German or rule errors (Kap 2, 5, 18, 23, 57, 61, 68, and the badges in 2). | Fixed in each chapter below. |
| Content the chapters teach was missing (e.g. *gefallen*, *haben* + short words, *ob/dass/wenn*, Genitiv forms). | Added. |
| Films of 3–6 minutes across 44 chapters would be more than 3 hours of animation. | Films are now **2–3 minutes**. |
| The shared code is really the scene runtime in `grammatik/dorf/main.js`, not the seven machines. | New **M0 Bühne** (the stage), plus a tile component, a feedback system and a practice format. |
| Two metaphors (a clamp and a train) for one rule. | **One sentence strip.** The clamp's two jaws are drawn on it: the verb engine and the last wagon. |
| Kap 60 duplicated *Wunschzauber* (B2). | Kap 60 is now about **reality against wish** (two panels), not the forming step. |
| Opa saws in the 2D workshop, but the plan gave the workshop to Anton. | The 2D workshop is recast with Anton, so the saw is his in both 8 and 57. |
| Max has no voice that may be published, and children's voices are restricted. | Children's lines are kept short and few, and Kap 52's pair is recast as adults. **Your decision is needed** (§4). |
| Cake in seven chapters, lost-and-found twice, "be polite and get served" three times, a weak continuity. | Repeats removed, and a **story arc** across the three levels added. |
| A bridge continuity error: "no bridge" in Opa's youth, yet "built 1820". | The arc now uses it: the bridge is old, a storm breaks it in A2, and it is rebuilt for the B1 festival. |

---

## 1. One world, one story, shared parts

### 1.1 The story arc (in the learner's order)

- **A1, *Lena zieht ins Dorf*.** Lena arrives (Kap 10: Herr Berger interviews her for the *Dorfzeitung*). She
  meets everyone, finds her way round, and settles in.
- **A2, *Der Sturm*.** The village prepares Opa Sepp's 80th birthday (Kap 22). A storm breaks the old bridge. The
  village rebuilds it in Anton's workshop.
- **B1, *Das Brückenfest*.** The new bridge is opened with a festival: races (43), the chronicle (63), the buffet
  (80) and the photo wall (68).

Two running hooks:

- **Each chapter ends with a *Dorfzeitung* front page.** It recaps the rule in a headline and teases the next
  chapter.
- **Flocke the lamb is the mischief-maker.** He is hidden in every scene for the learner to find. He takes the bus
  alone (54) and eats the cake (26).

### 1.2 Places

The village, the bridge and Opa's bench exist already (`grammatik/dorf/village.js`). The places below are new.

**Each interior is a drawing about the size of `village.js`. That is real work, not free.**

| Place | First used | Used again |
|---|---|---|
| Frau Huber's bakery counter (an interior) | 2 | 6, 14, 23 |
| Meister Anton's workshop (an interior; the 2D workshop recast) | 5 | 8, 13, 28, 51, 57 |
| The bus stop (outside) | 18 | 33, 55 |
| The church clock (outside, close-up) | 32 | 83 |
| Liv's room, seen in cross-section, with Minka the cat | 36 | 56 |
| Anton's house in cross-section (cellar, ground floor, attic) | 53 | — |
| The station window across the bridge | 72 | — |
| The town hall with the chronicle | 49 | 63 |
| The festival meadow | 43 | 68, 80, 82, 83 |

### 1.3 The cast

| Rive | Name | Role | Voice |
|---|---|---|---|
| C01 | Liv | the main character | Lucy ✅ |
| C02 | Max | the cheeky village boy | ⚠️ KidVoice is test only and may not be published |
| C03 | **Mia** *(suggested name)* | Liv's little friend; few lines | ❗ new |
| C04 | **Finn** *(suggested name)* | ginger boy with a satchel; few lines | ❗ new |
| A01 | Opa Sepp | Liv's grandfather | Cornelius ✅ |
| A02 | **Meister Anton** *(suggested name)* | carpenter; owns the workshop, the saw and the word machine | ❗ new |
| A03 | Lena | the newcomer | Alice ✅ |
| A04 | Frau Huber | baker; *Frau Sonnig* in Kap 52 | Petra ✅ |
| A05 | Herr Berger | librarian, reporter, man at the station window; *Herr Grau* in Kap 52 | Theo ✅ |
| A06 | **Frau Adler** *(suggested name)* | the mayor; formal *Sie* | ❗ new |
| — | Elisa | narrator, never on screen | Elisa ✅ |
| drawn | Flocke the lamb, **Minka the cat**, **a small dog**, **two Umlaut sparrows** | the animal kit, drawn in Canvas | — |

**The voice rule:** Elisa explains the rule. Characters speak only example sentences, short reactions and story
lines. That keeps the recording to about **40–60 lines per chapter**.

- **Wrong answers are not recorded one by one.** Each figure gets about six reusable reactions (*Hm?*, *Nein, nein!*,
  *Genau!*, a laugh …), and the specific reason is shown as text.
- **Elisa records only the two most common mistakes per chapter.**

### 1.4 Case colours and symbols (the same everywhere)

| | Colour | Badge | Label in the film |
|---|---|---|---|
| Nominativ | amber (`--nom`) | **N** | Subjekt: das Verb passt zu ihm |
| Akkusativ | teal (`--akk`) | **A** | Wen? / Was? |
| Dativ | violet (`--dat`) | **D** | Wem? (also after *mit, bei, zu …*) |
| Genitiv | **new token** (e.g. slate grey; never blue, rose or green) | **G** | Wessen? |

- Gender colours (der, die, das) appear only on articles and nouns, never on characters.
- **Arrow = *Wohin?*, pin = *Wo?*.** They show the question only, never the case. *zum Arzt* has an arrow and the
  Dativ colour, and that is exactly the lesson of Kap 36.

### 1.5 Shared building blocks

| # | Part | What it is | Chapters |
|---|---|---|---|
| **M0** | **Bühne** (the stage runtime) | Taken out of `grammatik/dorf/main.js`: loading figures and the Rive logo check, the camera (now also vertical, for cross-sections and the podium), `say` and captions, both audio players and the iPhone unlock, waits and tweens with abort, scene dots, pause, lines via `postMessage`, the per-chapter audio route (today it is hard-wired to chapter 1), test hooks, plus **one prop canvas per figure** so a held thing stacks correctly. | all |
| **T** | **Tiles** | One component for every sentence task: tap a tile, then tap a slot (dragging is optional), keyboard support, targets of at least 44 px. It sits **below the picture as HTML**, as the answers do in *Im Dorf*. | all |
| **F** | **Feedback** | First-try score, a hint ladder, one standard failure animation per machine, then "Richtig ist …". Two kinds: **Folge** (the scene plays the other sentence's real meaning) and **neutral** (passt nicht + reason). | all |
| **P** | **Practice format** | The lines-file schema: each round has items, accepted answers (with a normaliser for free word order, as in 13, 22 and 45), and for each wrong option `{anim, reaction, why}`. | all |
| **M1** | **Satzband** (the sentence strip) | Wagons with numbered seats. The verb engine sits at seat 2 and the last wagon holds Teil 2; together they are the **clamp's two jaws**. Connectors (*und, aber …*) are a small **bridge** at seat 0. In a subordinate clause the engine uncouples and rolls to the back. | 5, 8, 10, 11, 13, 26, 44, 45, 48, 55, 60, 62, 63, 72, 73, 81 |
| **M2** | **Kasus-Ringe** (case rings) | Coloured rings with letters at the figures' feet and on things (§1.4). | 17, 18, 22, 23, 33, 36, 40, 41, 56, 68, 82 |
| **M3** | **Zeitstrahl** (timeline) | A path: the past in sepia, NOW as a lantern, the future. A point marks a moment (*vor*), a bar marks a span (*seit*), and a rewind goes back. | 25, 26, 27, 32, 52, 54, 55, 63, 83 |
| **M4** | **Raum** (space) | Places with an arrow (*Wohin?*) or a pin (*Wo?*). Targets are large, or labelled buttons. | 33, 36, 37, 53 |
| **M5** | **Wortmaschine** (word machine) | Anton's machine: chutes, levers, a **vowel wheel** for a vowel change, and **Umlaut sparrows** where an Umlaut is added. | 14, 28, 49, 51, 54 |
| — | **Regie** (a pattern, not a machine) | The learner writes a sentence and the figures act it out. Each chapter has its own table from verbs to actions, **limited to what the rig can do**. | 17, 36, 37, 43, 80 |

### 1.6 What the figures can do, and what to add

**They can already:** walk, run, sit, holding (bend and pick up at shin height), the gestures wave, point, cheer,
think, pull and clap, the faces happy, smile, laugh, surprised and sad, talk, mirror, and show three views.

**Rive work, in this order.** Allow 2–4 days per item, including the frame-sheet review.

1. **Carry while walking** (a carry-walk state). Needed in 22, 36, 49 and 54.
2. **Gestures while sitting** (Sitting → think, point, wave). Needed in 25, 54, and to fix *Im Dorf*.
3. **A head joint in `motion.json`**, so things can sit on the head (the sleep "Zzz", soap bubbles, wings in a
   thought bubble). Needed in 27, 56 and 61.
4. **The `sleep` face** (eyes shut; the picture exists already for blinking). Needed in 27.
5. **`nod`** (a tilt of the head bone). Needed in 11, 48 and 80.

**Staged with what exists plus drawn effects** (no new motion):

| Action | How it is staged |
|---|---|
| give | Put the thing down on a low crate; the other figure picks it up with `holding`. |
| phone | `think` (hand at the chin) plus a drawn handset. |
| shrug / *Keine Ahnung* | `think` plus the sad face plus a "?". |
| eat | The talking mouth while the food shrinks and crumbs fall. |
| no / disagree | A raised hand (`wave` from the side) plus the sad face. A head-shake is impossible. |
| falling in water | Walk behind a band of water drawn on the front canvas, with a splash and the surprised face. |
| stairs | Doors and cuts, not climbing. |
| sweeping, watering | Things move by themselves (that is the joke in Kap 62). |
| dancing | cheer and clap. |

**Clothes and hats are part of the figure.** Nothing is put on, taken off or handed over to wear.

### 1.7 Phones and accessibility

- The sentence strip, tiles and answers sit **below** the picture. On a 375-px phone a B1 sentence inside the
  picture would leave about 35 px per word.
- **Reduced motion:** pans, rewinds, time-lapses and sepia fades become plain cuts.
- Cross-sections and the podium are composed for **both 4:3 and 16:9**.
- **Load:**
  - At most four figures per scene on phones.
  - Thought bubbles that show a figure use a **snapshot**, not a second Rive instance (each new file shows the
    2.4 s Rive logo).
  - Test on a low-end Android first.
  - A paid Rive plan removes the logo screen. That is worth deciding before the rollout.

---

## 2. The chapters

Format: **Idea** · **Film** · **Mitspielen** (with the feedback kind, **Folge** or **neutral**) · **Voices** ·
**Needs**.

### A1 · Erste Schritte: Personen und Verben

#### Kap 1 · Personalpronomen — *exists (Im Dorf)*
Keep it, fix Opa's seated wave (§1.6), and add two beats:
- **Mia:** *Das Mädchen spielt. Es ist sechs.* Then her name: *Mia spielt. Sie ist sechs.* The *es* card turns
  into *sie*.
- **Things:** *Die Bank ist alt. Sie wackelt. – Der Eimer ist voll. Er ist schwer.* The pronoun takes the
  article's gender colour, not the meaning.

**Practice, *Viermal sie/Sie* (neutral):** four scenes. Singular *sie* is told apart by the verb ending (*-t*). The
other three all have *-en*, so they are told apart by the **capital S** and by **who is being spoken to** (the
camera shows whether someone is addressed).

Voices: Mia (a few words).

#### Kap 2 · Präsens: regelmäßige Verben
**Idea:** *Die Endungs-Bäckerei.* The stem is dough, and the ending is cut out like a biscuit.

**Film**
1. Frau Huber cuts *-en* off *kochen*, and the dough says *koch-*.
2. **She talks to her customers** (each pronoun is used the way it is really used):
   - *Ich koche heute.*
   - *Kochst du auch, Max?*
   - *Kocht ihr, Max und Mia?*
   - *Kochen Sie, Frau Adler?*

   Elisa adds the third person: *Sie kocht. – Wir kochen. – Sie kochen.* Each ending is stamped into the dough.
3. Anton tries *arbeit-st*: his mouth stalls, and an extra **-e-** drops in like a stepping stone: *arbeitest*.
   The same happens with *reden*.
4. *heißen*: *du heißst* hisses, and one *s* falls away: *du heißt*.
5. Same form, different person: *kocht* fits Lena (*sie kocht*) and Max and Mia (*ihr kocht*). That is why German
   always needs the pronoun.

**Mitspielen**
- *Wer spricht mit wem?* A sentence with a gap, and a figure who is spoken to. The learner chooses the ending (neutral).
- *Wer passt?* The form *reist* is shown; tap everyone it fits (du, er/sie, ihr) (neutral).

Voices: Huber, Anton, Max (one line), Frau Adler (one line).
Needs: the bakery interior, the biscuit-cutter prop.

### A1 · Fragen stellen, Sätze bauen

#### Kap 10 · W-Fragen
**Idea:** *Lena kommt an.* Herr Berger interviews her for the *Dorfzeitung*. This is the start of the A1 story.

**Film**
1. On the strip: *Woher | kommen | Sie?* The question word is in seat 1, the verb engine in seat 2. A group can
   take seat 1 too (*Um wie viel Uhr | beginnt …*).
2. The question words with icons: *wer / wen* (subject and object), *was*, *wo, woher, wohin*, *wann*, *warum*,
   *wie viel* (things you don't count, and prices) and *wie viele* (things you count).
3. ***wo / woher / wohin* as one walk.** Lena **comes from** the bus stop (*Woher? – Von der Bushaltestelle.* An
   arrow leaves it). She **goes to** the bakery (*Wohin? – Zur Bäckerei.* An arrow arrives). She **is at** the
   bakery (*Wo? – In der Bäckerei.* A pin).
4. The melody: the voice falls at the end of a W-question ↘ (unlike Kap 11).

**Mitspielen**
- *Die Antwort ist da:* a figure answers (*Aus Uganda.*); the learner builds the question (neutral).
- *Wie bitte?*
  - A noise (the stream, Flocke bleating) covers one word in the sentence. This needs the recordings' word
    timestamps.
  - The learner asks back with the right W-word: *Entschuldigung, wo wohnt sie?* (neutral)
  - The figure then repeats the missing word.

Voices: Berger, Lena, plus one-line answers from Liv, Opa and Huber.

#### Kap 11 · Ja/Nein-Fragen, doch
**Idea:** the verb engine jumps to the front, and the melody rises. ***Doch* is a spring.**

**Film**
1. *Du spielst Tennis.* becomes *Spielst du Tennis?* The engine hops from seat 2 to seat 1, and a pitch line ↗ is
   drawn. A question with *kann* or *ab* is shown only as a phrase: the last wagon stays at the back.
2. ***Doch*, set up so the truth is clear.** Max stares at the pretzels, and his stomach growls. Opa, from behind
   the newspaper, asks: *Hast du keinen Hunger?* The question carries a red *kein* stamp.
   - *Nein* would agree with it ("no hunger"), and the stamp stays red.
   - ***Doch!*** says "I am hungry". The stamp springs up to green, and Max grins.
3. A short nod after a negative question is unclear, so you say it: ***Doch!***
4. A polite request (to an adult): *Könnten Sie bitte die Tür aufhalten?*

**Mitspielen**
- *Ja, nein oder doch?* A question about a scene the learner can see. Mia holds the ball up; Finn asks *Hast du den
  Ball nicht?* The learner answers truthfully (**Folge**: the scene shows what that answer means).
- *Frag Lena!* Turn statements into questions on the strip (neutral).

Voices: Opa, Max, Mia (a few words), Finn (a few words), Liv.
Needs: the nod motion.

### A1 · Nomen und Artikel

#### Kap 14 · Plural
**Idea:** *Die Verdopplungsmaschine* at the market. One goes in, two come out. In the plural every article is
**die**.

**Film**
1. *ein Apfel* goes in, and *zwei Äpfel* come out; the sparrows land on the A.
2. Five chutes (*-(e)n, -e, -er, -s, –*). They are **tendencies, not rules**, so Elisa says: learn each noun with
   its plural.
   - Sure cases are marked: *-ung* and *-e* → *-n*, *-in* → *-innen*, *-chen* → no ending.
   - The sparrows never land in the *-s* chute.
3. The article hats der, das and die all come out as **die**. And *ein Haus* becomes ***Häuser***, with no article
   at all.
4. *das Mehl* makes the machine cough flour (no plural). *die Eltern*: the machine finds no singular.
5. Foreign plurals: *Museum*, the machine cuts *-um* and adds *-en*: *Museen*.

**Mitspielen**
- *Marktstand:* only words with a sure rule, and words already seen in the film (neutral).
- *Hat es einen Plural?* Throw out the nouns without one (neutral).

Voices: Huber, one customer (Lena).
Needs: M5, the market stall.

#### Kap 49 · Der, die oder das? (genus rules)
**Idea:** *Wörter ziehen ein.* Words arrive at the bus stop with their ending on a suitcase tag. At the town hall,
Frau Adler registers each one in the right house.

**Film**
1. The tags:
   - die: *-ung, -heit, -keit, -ion, -in, most -e*
   - das: *-chen, -lein, -o, Ge-*
   - der by meaning: weather, days, months, seasons, alcohol, car makes
2. An exception arrives. *Gewitter* shows a weather tag, but Frau Adler stamps it *Ausnahme: das*. The same happens
   with *die Sonne* and *das Bier*.
3. **Compound words:** *das Haus + die Tür* moves into the **die** house, because the last word decides.
4. A separate box: in the plural the article is *die* for every word. This is not a fourth house, and it is not
   "feminine".

**Mitspielen**
- *Anmeldung:* the learner reads each suitcase tag and stamps the house. A wrong house slams its door (neutral).
- *Ein Außenseiter:* one word in a house doesn't belong (neutral).

Voices: Frau Adler (new), Elisa.
Needs: the town hall, carry-walk (for suitcases), or suitcases that float in.

### A1 · Wer, wen, wem? Akkusativ und Dativ

#### Kap 17 · Akkusativ — *pilot*
**Idea:** *Wer jagt wen?* The article shows who does what, so the word order can change.

**Film**
1. *Max sieht den Hund.* Max gets the amber N ring, and the dog gets the teal A ring.
2. Four lights for der, das, die and plural die. **Only masculine words change:** *der → den, ein → einen,
   kein → keinen, mein → meinen*.
3. *Den Ball jagt der Hund.* The dog still chases. Swap the articles: ***Der Ball jagt den Hund.*** Now the ball
   chases the dog across the meadow.
4. *Wer?* and *wen?* for people; *was?* for things.

**Mitspielen**
- **Regie:** tiles *der/den Hund · der/den Ball · die Katze · jagt · sieht*. Task: "Lass den Hund den Ball jagen"
  (**Folge**). Only pairs where at least one word is masculine; *die Katze … die Maus* is ambiguous and is left out.
- *Max packt:* things into the backpack, choosing *den, das* or *die* (neutral).

Voices: Max (short lines), Elisa.
Needs: the dog and Minka (the animal kit), the ball.

#### Kap 18 · Dativ
**Idea:** *Mit dem Bus zum Markt.* In the Dativ **every** article changes.

**Film**
1. *Wem hilft Liv?* She takes Opa's basket. Opa gets the violet D ring: ***dem** Opa*.
2. The bus stop: *mit dem Bus, mit dem Rad, mit der Bahn, mit den Rädern*. All four hats flip. Masculine and neuter
   become twins (*dem*). The same happens with *einem, keinem, meinem / einer, meiner / meinen*.
3. Dativ plural *-n*: *mit den Freunde**n***. Not for *Autos*, and nothing is added to *Tanten*.
4. Short forms merge like two drops of water: *zu + dem* = *zum*, and also *zur, beim, vom*.

**Mitspielen**
- *Fahrplan:* the bus door opens only when the article is right (neutral).
- *Liv hilft allen:* *dem / der / den …n*. Then Liv helps (holding, pull) (neutral).

Voices: Liv, Opa, Berger (the bus driver).
Needs: the bus stop and the bus.

### A1 · Können, müssen, dürfen: Modalverben

#### Kap 5 · Modalverben: Formen und Satzklammer — *pilot*
**Idea:** the clamp (the sentence strip) appears for the first time in Anton's workshop. A modal verb takes seat 2,
and the main verb goes to the end **in its infinitive form**.

**Film**
1. *Ich koche.* becomes *Ich will kochen.* *will* takes the golden seat 2, *kochen* rides to the last wagon, and
   the jaws click shut.
2. **The vowel wheel** (the singular has a different vowel): *können → kann*, *müssen → muss*, *dürfen → darf*,
   *wollen → will*. In the plural the vowel comes back: *wir können*. *sollen* keeps its vowel. *möchten* keeps
   its ö: the sparrows stay on it.
3. *ich* and *er/sie* have no ending: *ich kann – sie kann*. Then *du kannst, ihr könnt*.
4. *man*: village signs: *Hier darf man nicht parken.*
5. Questions: *Soll ich das Fenster aufmachen?* A separable verb stays in one piece at the end.

**Mitspielen**
- *Die Klammer schließen:* put the infinitive on the last wagon (neutral; a wrong place makes the jaws slip).
- *Schilder fürs Dorf:* make rule signs (neutral).

Voices: Anton (new), Liv, Lena.
Needs: M0, T, F, P, M1 and the workshop interior. **This pilot builds the core.**

#### Kap 6 · können, wollen, möchten
**Idea:** three meanings of *können*, each with its own icon, and *will* against *möchte* at the counter.

**Film**
1. *können*:
   - **ability** (a medal): *Lena kann sehr gut singen*, carried by the audio;
   - **possibility** (an open door): *Im Gasthof kann man Fahrräder leihen*;
   - **permission** (a green sign): *Sonntags kann man hier parken*.
2. Max barks *Ich will einen Kuchen!* Frau Huber's face falls. Liv: *Ich möchte bitte ein Stück Kuchen.* A smile.
3. For plans, *will* is fine: *Nächstes Jahr will ich den Führerschein machen.*

**Mitspielen**
- *Bestellen:* Frau Huber's face reacts (Folge: her face shows how it sounds).
- *Welches können?* Tap the medal, the door or the sign (neutral).

Voices: Huber, Max (one line), Liv, Lena (a few sung bars).

### A1 · Mehr Verben: trennbar und Imperativ

#### Kap 8 · Trennbare Verben
**Idea:** Anton's saw (the 2D workshop, recast with him) cuts the stressed prefix off, and it rides to the end of
the sentence.

**Film**
1. *aufräumen*: the saw cuts *auf*, and it rides on the last wagon: *Ich räume heute auf.*
2. The prefix is the loud syllable: ANrufen, EINkaufen (it pulses as Liv says it).
3. With a modal verb the saw stays still: *Ich muss aufräumen.*

**Mitspielen**
- *Livs Samstag* (Regie): *aufstehen* (stand up from sitting), *einkaufen* (holding a basket), *fernsehen* (sit),
  *anrufen* (the drawn phone). Build the sentence, and Liv acts it (neutral; a word-order error).
- *Wo ist die Betonung?* Tap the loud syllable (neutral).

Voices: Liv, Anton.

#### Kap 48 · an, aus, auf, zu, da, weg
**Idea:** *Stell das Dorf ein.* Sentences switch the village.

**Film**
1. *Das Licht ist an / aus* (a lamp). *Der Kiosk ist auf / zu* (a shutter).
2. ***Flocke ist weg!*** A search, and then *Flocke ist wieder da!*
3. *dafür / dagegen*: a vote on a picnic (cheer, or nod; think and the sad face).
4. *Was ist los? – viel los / nichts los* (market day against Sunday).
5. **The *haben* half:** *Ich habe meinen Ausweis dabei. Max hat seinen Hut auf. Die Bäckerei hat sonntags zu.*
6. State against action: Liv pulls the lamp cord. *Ich mache das Licht an. – Jetzt ist es an.*

**Mitspielen**
- *Stell das Dorf ein:* hear a sentence and set the village to match (**Folge**: *an/aus*, *auf/zu*, *da/weg*
  really are opposites).
- *Was hast du dabei?* Pick the right word for things in Liv's bag (neutral).

Voices: Liv, Max, Opa, Huber.
Needs: switchable lamps, a shutter, the nod motion.

### A1 · Zeit und Ort: Präpositionen

#### Kap 32 · Zeitpräpositionen
**Idea:** *Zeit-Zoom* into the church clock: year → *im* → *am* → *um*.

**Film**
1. Nested boxes: *2027* (no preposition), *im Juni*, *am 4.*, *um sieben Uhr*.
2. The exception: ***in** der Nacht*, and *um Mitternacht*.
3. ***seit** against **vor***: *Lena wohnt seit drei Monaten hier* (a bar that reaches NOW). *Vor drei Monaten ist
   sie gekommen* (a point). The second sentence is taught only as a phrase; the Perfekt comes later.
4. *ab Montag*, and *von … bis* (the opening hours on the bakery door).

**Mitspielen**
- *Termine:* set the clock and calendar, and choose *im / am / um / –* (neutral).
- *seit oder vor?* Drop each event as a point or a bar (neutral).

Voices: Lena, Berger, Opa.
Needs: the church clock, M3.

#### Kap 33 · Immer Dativ: mit, nach, aus, zu, von, bei, seit
**Idea:** three movements: **zu** (an arrow towards), **bei** (a pin), **von** (an arrow away). Every one of them is
violet D: the arrow shows the direction, not the case.

**Film**
1. Liv's day as a road of signs: *aus dem Haus, mit dem Rad, zur Schule, bei der Freundin, vom Training, nach Hause*.
2. People: *zu / bei / von*. Cities: *nach / in / aus*. (*in Nairobi* is not one of the seven; it is a reminder of
   Kap 36.)
3. *zu Hause* (a pin) against *nach Hause* (an arrow).
4. A clapping chant with the cast: *Mit, nach, aus, zu, von, bei, seit – Dativ zu jeder Zeit!* (one shared caption).

**Mitspielen**
- *Wegbeschreibung:* send Max round the village (*zum Bäcker, zur Kirche, nach Hause*). He walks there, or shrugs
  (neutral).
- *Rhythmus:* clap along and fill the gap (neutral).

Voices: Liv, Max (one line), the chant (the cast together).

### A1 · Gestern: die erste Vergangenheit

#### Kap 25 · Präteritum von sein und haben
**Idea:** *Opas Fotoalbum.* A slider fades *früher* (sepia) into *heute* (colour).

**Film**
1. Opa, **standing** at the album table: *Früher war das Dorf klein. Es hatte keinen Laden und keinen Bus.*
2. Colour: *Heute ist es größer. Es hat eine Bäckerei und eine Bushaltestelle.*
3. The forms on the album pages: *ich war = er war*, *wir waren = sie waren*, *hatte* with two t's.
4. Time words are the switch: *gestern, damals, früher* turn sepia on; *heute, jetzt* turn it off.

**Mitspielen**
- *Früher / heute:* move the slider and describe the scene (neutral).
- *Wo warst du am Montag?* Liv and Lena: fill in the forms (neutral).

Voices: Opa, Liv, Lena.
Needs: the sepia filter, the album.

#### Kap 26 · Perfekt mit haben
**Idea:** ***Wer hat den Kuchen gegessen?*** A whodunit. This is the only cake chapter, and Flocke is the culprit.

**Film**
1. Saturday plays live. Then a rewind: *Was hast du am Samstag gemacht?*
2. The clamp: *habe* in seat 2, the participle on the last wagon. The participle has its own little clamp:
   ***ge**mach**t***.
3. Regular *ge…t*, irregular *ge…en*, and *-ieren* with no *ge*.

**Mitspielen**
- *Detektiv:* each villager gives an alibi using **haben verbs only** (*Ich habe gelesen. Ich habe Brot gebacken.*).
  The learner **rebuilds each alibi** (places *hat*, chooses the participle) (neutral).
- **The end:** crumbs lead to Flocke. *Flocke hat den Kuchen gegessen!* (The rule was *ge…t*; the solution is the
  reward.)

Voices: Huber, Liv, Opa, Lena, Berger.
Needs: the film-strip overlay, eating staged with drawn effects.

### A1 · Sätze verbinden

#### Kap 44 · und, aber, oder, denn (Position 0)
**Idea:** the connector is a small **bridge** between two sentence strips. It doesn't count as a seat.

**Film**
1. *Ich habe heute Dienst, **aber** morgen habe ich frei.* After the bridge the second strip starts normally.
2. Meanings: *und* (a plus), *aber* (a scale tipping the other way: a contrast), *oder* (one of two), *denn* (an
   arrow back to the reason).
3. Leaving out: *Ich kaufe Brot und ~~ich kaufe~~ Käse.* The repeated words pop. **After *denn*, nothing is left
   out.**
4. *sondern* after a *nicht*.

**Mitspielen**
- *Nach der Brücke:* put the clause after *aber* in order (*aber morgen habe ich frei*, not *aber habe ich*)
  (neutral). This sets up the contrast with Kap 45.
- *Weglassen:* tap what may go (neutral).

Voices: Liv, Lena, Elisa.

### A2 · Satzbau und Nebensätze

#### Kap 13 · Die Satzklammer
**Idea:** the storm has broken the bridge, and Anton builds the new railing. Each type of clamp holds one board.

**Film**
1. Seven kinds of Teil 2, one board each: modal, separable, Perfekt, *sein* + adjective, verb + verb, noun + verb,
   and noun + verb in the Perfekt.
2. The middle part can be as long as you like (*heute noch mit Opa im Garten*). **Only Teil 2 must stay at the end.**
3. A turntable at seat 1: *Heute* moves to the front, and the subject goes behind the verb.
4. Three verbs: *Ich bin gestern essen gegangen*.

**Mitspielen**
- *Das Geländer:* build sentences. A Teil 2 dropped into the middle makes the board fall (neutral).
- *Ein Satz – viele Anfänge:* turn the turntable (neutral).

Voices: Anton, Elisa.

#### Kap 45 · deshalb, sonst, dann, danach (Position 1)
**Idea:** these words are **passengers, not bridges**. They take seat 1, so the verb follows at once.

**Film**
1. Side by side: *aber* stands on the bridge, while *deshalb* sits in seat 1 and the subject moves behind the verb.
2. *deshalb*: *Die Brücke ist kaputt, deshalb nehmen wir den Bus.*
3. ***sonst* preview:** Opa: *Nimm einen Pullover mit, sonst frierst du!* A bubble shows Liv shivering in blue light.
4. *dann / danach*: a sequence.

**Mitspielen**
- *Sonst-Vorschau:* complete a warning, and the bubble plays the consequence (neutral for word order).
- *Brücke oder Sitz?* Place the connector, then move the verb (neutral).

Voices: Opa, Liv, Elisa.

### A2 · Dativ und Akkusativ im Satz

#### Kap 22 · Verben mit Dativ und Akkusativ
**Idea:** *Opas 80. Geburtstag.* Presents: N gives, D receives, A is the thing.

**Film**
1. *Liv schenkt dem Opa einen Schal.* She puts it on the gift table, and Opa picks it up. N, D and A rings appear.
2. Two nouns: Dativ before Akkusativ.
3. ***Liv schenkt ihn dem Opa.*** The teal tile shrinks to *ihn* and jumps ahead of the violet one. Pronouns go
   first.
4. Two pronouns: the Akkusativ comes first: *Gib es mir!*

**Mitspielen**
- *Geschenke:* drag a present to a guest and build the sentence (neutral).
- *Nomen zu Pronomen:* replace one word at a time and watch the tiles push forward (neutral).

Voices: Liv, Opa, Huber, Lena.
Needs: the gift table, holding.

#### Kap 23 · Verben mit Dativ
**Idea:** with *gefallen* and *schmecken*, **the thing is the subject**. It "sends" something to the person, who is
in the Dativ.

**Film**
1. Group 1, person to person: *Liv hilft der Nachbarin. Mia dankt dem Opa.*
2. Group 2, thing to person, at the jam tasting: *Die Marmelade schmeckt dem Opa.* The jar gets the N ring, Opa the
   D ring. *Das Lied gefällt den Gästen.* Then the Dativ first: *Den Gästen gefällt das Lied.*
3. Fixed phrases: *Es tut mir leid. Mein Knie tut mir weh.* *antworten* + Dativ against *beantworten* + Akkusativ.

**Mitspielen**
- *Marmeladenprobe:* read each face and say *Sie schmeckt ihm / ihr / dem Opa / den Kindern (nicht)* (neutral).
- *Wer hilft wem?* (neutral)

Voices: Huber, Opa, Mia, Liv.

### A2 · Perfekt und Präteritum

#### Kap 27 · Perfekt mit sein
**Idea:** the storm night. ***sein* when the place or the state changes.**

**Film**
1. Lena runs from the bridge to the bakery: *Sie ist gelaufen.*
2. Opa (the sleep face): *Opa ist eingeschlafen.* The clock spins: *Er hat acht Stunden geschlafen.*
3. In the storm a tree falls: *Der Baum ist umgefallen.* Flocke has grown over the summer: *Flocke ist gewachsen.*
4. **The verb decides, not what you see.** Flocke paddles round in circles in the pond: *Er ist geschwommen* (no
   new place, still *sein*). Lena parks: *Sie hat das Auto in die Garage gefahren* (a movement, but *haben*,
   because of the Akkusativ object).
5. *sein* and *bleiben*: *Wir sind zu Hause geblieben.*

**Mitspielen**
- *ist oder hat?* A short action plays; choose the auxiliary (neutral).
- *Die Sturmnacht:* tell the night in order (neutral).

Voices: Lena, Opa, Elisa.
Needs: the sleep face, the head joint (for the Zzz), the storm effects.

#### Kap 28 · Das Partizip
**Idea:** ***Die Partizip-Maschine*** (the name the lesson uses). Levers for *ge-* (front, middle, none), *-t* or
*-en*, and the vowel wheel.

**Film**
1. *kochen* → *gekocht*.
2. *abholen*: the saw splits it, and *ge* drops into the gap: *abgeholt*.
3. *bezahlen*: the *ge* stamp bounces off the hard prefix: *bezahlt*. *reparieren* → *repariert*.
4. *finden* → *gefunden* (the wheel turns). Mixed: *denken* → *gedacht*.

**Mitspielen**
- *Bediene die Maschine:* set the levers. A wrong setting rattles out a broken word (*gebezahlt*) (neutral: it
  shows the wrong word was never a word).

Voices: Anton, Elisa.

### A2 · Wo? Wohin? Woher?

#### Kap 36 · Wechselpräpositionen
**Idea:** *Minka ist überall.* Arrow = *Wohin?* and Akkusativ; pin = *Wo?* and Dativ. Only for these nine
prepositions do the question and the case go together.

**Film**
1. Minka **jumps onto** the wardrobe (an arrow, *auf **den** Schrank*, teal). Then she **sits on** it (a pin,
   *auf **dem** Schrank*, violet).
2. The nine prepositions round a box.
3. **The target test:** the children run round the yard (no new target, so *Wo?*) against running into the yard (a
   target, so *Wohin?*).
4. **A contrast that is the key point:** *Ich gehe zum Zahnarzt.* An arrow, but violet: *zu* is always Dativ.

**Mitspielen**
- *Minka:* tap a big target. *Minka springt …* (**Folge**: *auf dem Schrank springen* means jumping up and down on
  top of it, and the scene shows that). Then say where she is now.
- *Liv räumt auf:* *auf den Tisch, in den Schrank* (neutral).

Voices: Liv, Elisa.
Needs: Minka, Liv's room in cross-section, carry-walk.

#### Kap 37 · Wohin? in, nach, an, auf, zu
**Idea:** *Der Wegweiser.* One preposition really does take you somewhere else.

**Film**
1. *nach Accra* (no article), *in die Schweiz* (an article), *zur Oma* (a person).
2. ***an** den Fluss* against ***in** den Fluss*. Max wants to picnic on the bank. Finn says *in den Fluss*, and
   splash: Max is in the water.
3. *auf den Turm*, *ans Ufer*. *nach Hause* against *zu Hause*.

**Mitspielen**
- *Reiseplaner:* *an/in/auf* (**Folge**: they really mean different places). *nach/zu* errors such as *zu Accra*
  are **neutral**.

Voices: Max, Finn, Liv.
Needs: the water band and splash effect.

### A2 · Adjektive und Vergleiche

#### Kap 40 · Adjektivendungen (Nominativ, Akkusativ)
**Idea:** ***Die Signal-Laterne.*** Each noun group has exactly one lantern (r, s, e, n). It is on the article when
the article shows the signal; otherwise the adjective carries it.

**Film**
1. *der warme Mantel* (the lantern on *der*, the adjective takes *-e*). *ein warmer Mantel* (*ein* has no lantern,
   so the adjective takes it).
2. A second lantern starts to light, and Elisa blows it out: never twice.
3. Akkusativ masculine always takes *-en*. The plural: *die bunten Socken* against *bunte Socken*. Possessives
   work like *kein*.
4. After the noun (*Der Mantel ist warm.*): no lantern, no ending.

**Mitspielen**
- *Fundbüro* (after the storm): describe a lost thing (*Ich suche einen roten Schal*), and Herr Berger brings it
  (neutral).

Voices: Berger, Liv, Lena.

#### Kap 41 · Adjektivendungen in allen Fällen
**Idea:** ***Laternenumzug*** (St. Martin). Each noun group walks as a small procession with **one** lantern
floating above it.

**Film**
1. The lantern is on the article: *mit dem kleinen Hund*, and an echo carries *m/n* over to the adjective's *-n*.
2. **In the Dativ it is always *-en*:** *mit der kleinen Katze, mit einer kleinen Katze*.
3. *am ersten Mai*: the calendar flips (the Dativ after *am*).

**Mitspielen**
- *Wer kommt mit wem?* The procession arrives, and the learner names each group (*mit einem kleinen Hund*). A right
  ending lights its lantern (neutral).

Voices: Opa, Liv, Mia (a few words).
Needs: floating lanterns, the dog.

### A2 · Neue Wörter bilden

#### Kap 51 · Wortbildung mit Endungen
**Idea:** *Die Wörterwerkstatt* with a **shrink ray**.

**Film**
1. *die Maus + -chen*: ***das** Mäuschen*. It shrinks, the sparrows land, and the article changes to *das*.
2. *backen + -er* gives *der Bäcker*, and *-in* gives *die Bäckerin* (Frau Huber gets her badge).
3. *wohnen + -ung* gives *die Wohnung*.
4. *Beim Lesen trinkt Herr Berger Tee. Zum Lesen braucht er seine Brille.*

**Mitspielen**
- *Schrumpfstrahl:* choose the article (the ending decides) (neutral).
- *Wer macht das?* Name the person (*der Maler, die Malerin*) (neutral).

Voices: Huber, Berger, Elisa.

### B1 · Erzählen in der Vergangenheit

#### Kap 54 · Präteritum (written narrative)
**Idea:** the ***Dorfzeitung* special:** ***Lamm fährt allein Bus.*** Herr Berger writes it at his lectern, and the
scene plays as he writes.

**Film**
1. Writing in the past: *spielt → spielte* (a *-te* stamp), *fährt → fuhr* (the vowel wheel), *denkt → dachte*
   (both).
2. *ich = er*: irregular verbs have no ending there.
3. Separable verbs: *Flocke stieg an der Brücke ein und fuhr bis zum Markt.*
4. Spoken against written: Liv tells it aloud in the Perfekt, and Berger writes it in the Präteritum.

**Mitspielen**
- *Schreib den Artikel:* finish Berger's story in the Präteritum, and each correct verb plays its line of the story
  (neutral).

Voices: Berger, Liv.
Needs: carry-walk or the bus, Berger standing.

#### Kap 55 · Plusquamperfekt
**Idea:** ***Zu spät!*** Liv gets to the bus stop, and the bus had already left.

**Film**
1. Two moments on the Zeitstrahl.
2. *Als Liv kam, war der Bus schon abgefahren.* A rewind shows the bus leaving.
3. Only the auxiliary changes: *ist → war*, *hat → hatte*.
4. *nachdem* joins the two.

**Mitspielen**
- *Rückblende:* put the events on two lanes and build *nachdem* sentences (neutral).

Voices: Liv, Lena, Max (one line).

### B1 · Verben genauer

#### Kap 56 · Reflexivpronomen: mich oder mir?
**Idea:** ***One seat for the object.*** If the teal A seat is free, the reflexive takes it (*mich*). If something
else is already in it (*die Hände*), the reflexive moves to the Dativ (*mir*).

**Film**
1. *Ich wasche mich*: bubbles over the whole figure. *Ich wasche mir die Hände*: bubbles only on the hands.
2. The seat, free or taken.
3. Only *mich/mir* and *dich/dir* differ.
4. *sich vorstellen* (Lena waves: *Darf ich mich vorstellen?*) against *sich etwas vorstellen* (think, with a
   thought bubble).

**Mitspielen**
- *Morgenroutine:* tap a body part or the whole figure, then finish the sentence (neutral).

Voices: Liv, Lena.
Needs: the head joint (bubbles), the hand path for the hands.

#### Kap 57 · trennbar oder untrennbar? — *exists*
Wire in the 2D workshop recast with Anton. Add a short film (not a repeat of Kap 8's stress beat):
1. The inseparable prefixes (*be-, ver-, er-, ent-, zer-, ge-, emp-*) are welded on, and the saw bounces off.
2. ***übersetzen* at the new bridge:** *Die Fähre setzt Liv über* (separable). *Herr Berger übersetzt einen Brief*
   (inseparable).
3. *aufgemacht, aufzumachen* against *verkauft, zu verkaufen*.

Voices: Anton, Berger, Liv.

### B1 · Konjunktiv II

#### Kap 60 · Formen des Konjunktivs II
**Idea:** ***Wirklichkeit und Wunsch.*** Two panels: on the left reality (normal colour, the Indikativ), on the
right the wish (pastel, the Konjunktiv).

**Film**
1. Left: *Ich bin in der Schule.* Right: *Ich wäre gern am Meer.* Then *Dann würde ich den ganzen Tag schwimmen.*
2. *würde* + infinitive for most verbs, on the strip.
3. Own forms for *sein, haben* and the modals: the sparrows land, *war → wäre, hatte → hätte, konnte → könnte*.
4. *wollte* and *sollte* look like the Präteritum, so only the context tells.

**Mitspielen**
- *Wunsch oder Wirklichkeit?* Sort each sentence into a panel (neutral).
- *Mach es zum Wunsch:* the wish panel draws a small picture, reusing `zauberstab/visions.js` (neutral).

Voices: Liv, Lena.
Note: *Wunschzauber* (B2) trains how the form is made; this chapter trains telling wish from reality.

#### Kap 61 · Konjunktiv II: Wünsche, Bitten, Ratschläge
**Idea:** the ***Höflichkeitstreppe*** with **one** addressee: Liv asks Frau Adler, the mayor, to accept a parcel.

**Film**
1. Five situations as five doors: wish, unreal condition, request, advice, suggestion.
2. The stairs (always *Sie*):
   - *Nehmen Sie bitte das Paket an!*
   - *Können Sie …?*
   - *Könnten Sie …?*
   - *Würden Sie …?*

   Frau Adler's face warms at each step.
3. **Asking permission is a different act:** *Dürfte ich kurz Ihr Telefon benutzen?*
4. **Real against unreal:** *Wenn Max Zeit hat, hilft er. Wenn Max Zeit hätte, würde er helfen* (but he has none).
5. Advice: Opa: *An deiner Stelle würde ich … / Du solltest …*

**Mitspielen**
- *Treppe:* rephrase the request one step higher (neutral).
- *Rat geben:* Max has a toothache. *Du solltest zum Zahnarzt gehen*, and he goes (neutral).

Voices: Liv, Frau Adler, Opa, Max (one line).

### B1 · Passiv, Futur und werden

#### Kap 62 · Passiv Präsens
**Idea:** ***Wer war das?*** The night before the festival, the village gets ready **by itself**. The broom sweeps,
the roses are watered, the lamps are hung: everything is drawn, with no labour motions needed.

**Film**
1. *Die Straße wird gefegt. Die Rosen werden gegossen.* The camera is on the thing being done. Nobody is seen,
   because who does it doesn't matter.
2. The forms of *werden* (*wird, werden …*). The verb agrees with the new subject.
3. ***von wem?*** In the morning the camera swings round: *Die Straße wird von Anton gefegt.* There was someone
   after all.
4. *man = Passiv*: *Hier fegt man jeden Samstag. = Hier wird jeden Samstag gefegt.*
5. With a modal: *Die Lampen müssen noch aufgehängt werden.*

**Mitspielen**
- *Was wird gemacht?* Describe what is moving (neutral).
- *Aktiv ↔ Passiv:* the camera points at the person or at the thing; say the matching sentence (neutral).

Voices: Elisa, Anton (one line).

#### Kap 63 · Passiv in der Vergangenheit
**Idea:** ***Die Dorfchronik.*** At the festival Frau Adler unveils the bridge's story. It plays as a time-lapse.

**Film**
1. *Die Brücke wurde 1820 gebaut.*
2. *Im Sturm wurde sie zerstört.* Then *Sie ist neu gebaut worden.* The *ge* falls off *worden*.
3. The Passiv Perfekt always takes *sein*, even when the active verb takes *haben*.
4. With a modal: *Das Geländer musste neu gebaut werden.* A headline: *Neue Brücke eröffnet*.

**Mitspielen**
- *Chronik schreiben:* entries on the timeline, and each correct entry plays its time-lapse (neutral).

Voices: Frau Adler, Max (*Mein Fahrrad ist gestohlen worden!*).

### B1 · Nomen und Adjektive

#### Kap 43 · Superlativ
**Idea:** races at the *Brückenfest*, with a podium.

**Film**
1. Liv, Max, Finn and Mia run. *Finn läuft am schnellsten.* Then *Finn ist der schnellste Läufer.*
2. Two forms: with a noun (the article plus an ending) and with the verb (*am …sten*).
3. *der größte Kürbis*, *der zweitgrößte*. Irregular forms: *besser, am besten; mehr, am meisten*.

**Mitspielen**
- *Siegerehrung* (Regie): watch the race, then announce in both forms. The winners cheer (neutral; there are three
  fixed choices per announcement).

Voices: Frau Adler (the announcer), the children (cheers only).
Needs: the podium, a vertical camera move.

#### Kap 68 · Genitiv
**Idea:** ***Die Fotowand*** at the festival. Threads connect people and things: *Wessen …?*

**Film**
1. *Das ist das Werkzeug des Schreiners.* The ***s*** lights up on both the article and the noun.
2. *-es* after a sibilant: *das Dach des Hauses*. Feminine and plural: *die Tasche der Bäckerin* (no ending on the
   noun).
3. Names: *Lenas Fahrrad*, *Opas Bank*.
4. Spoken against written: Max says *das Fahrrad von Lena*, and the *Dorfzeitung* writes *Lenas Fahrrad*.

**Mitspielen**
- *Wessen ist das?* Pull a thread from a thing to its owner and say it in the Genitiv. Objects only, never hats or
  clothes (neutral).

Voices: Frau Adler, Max (one line), Berger.

### B1 · Nebensätze und Infinitive

#### Kap 72 · Indirekte Fragen
**Idea:** ***Am Schalter.*** Both questions get an answer. The indirect one also gets a smile.

**Film**
1. *Wann fährt der Zug?* Berger answers: correct, short and neutral.
2. *Können Sie mir sagen, wann der Zug fährt?* The verb engine uncouples and rolls to the end, and Berger smiles.
3. A yes/no question has no W-word, so *ob* comes in.
4. ***ob, dass* or *wenn*:** *Ich weiß nicht, ob … / Ich weiß, dass … / Wenn …, dann …*
5. *Keine Ahnung, ob …* (the staged shrug).

**Mitspielen**
- *Info-Schalter:* rephrase questions (neutral; the verb must reach the end).
- *ob, dass oder wenn?* (neutral)

Voices: Liv, Berger.

#### Kap 73 · Infinitiv mit zu
**Idea:** the saw splits the separable verb, and *zu* slides into the gap.

**Film**
1. Max: *Ich habe keine Lust, mein Zimmer aufzuräumen.* The *zu* group comes **after the comma, once the first
   clause's clamp has closed**.
2. *Ich hoffe, pünktlich zu sein* (the same person) against *Ich hoffe, dass du pünktlich bist* (another person).
3. The triggers: *es ist + Adjektiv*, *Lust / Zeit / Angst*, verbs like *versuchen, vergessen*.

**Mitspielen**
- *Ein Subjekt oder zwei?* (neutral). *empfehlen, bitten* and *raten* are left out of this round: they name the doer
  in a different way.
- *Einfädeln:* *anzurufen*, *zu verstehen* (neutral).

Voices: Max, Liv.

### B1 · Konnektoren und Vergleiche

#### Kap 80 · weder … noch, entweder … oder
**Idea:** ***Das Festbuffet.*** Frau Adler refuses everything; Max takes everything.

**Film**
1. Max: *Ich nehme sowohl Kuchen als auch Eis.* Both go onto his plate.
2. Frau Adler: *Ich nehme weder Kuchen noch Eis* (no extra *kein*).
3. Liv: *Ich nehme entweder Kuchen oder Eis.* She has to choose.
4. *Nicht nur Kuchen, sondern auch Eis*: the second item gets a spotlight.

**Mitspielen**
- *Bestellungen* (Regie): build the sentence, and the plate fills exactly as it says (**Folge**: the four pairs
  mean different things).

Voices: Max (short), Frau Adler, Liv.

#### Kap 81 · je … desto
**Idea:** ***Zwei Regler.*** Move one slider, and the other moves with it.

**Film**
1. Liv and Opa on the mountain path. The height slider goes up and the thermometer goes down: *Je höher wir
   steigen, desto kälter wird es.* The climb is a walk along a sloped path.
2. *Je mehr Gäste kommen, umso mehr Stühle brauchen wir.*
3. Word order: in the *je* part the verb goes to the end; in the *desto* part the verb follows the comparative
   at once.

**Mitspielen**
- *Regler:* drag A, and B reacts; build the sentence (neutral).

Voices: Liv, Opa, Anton.

### B1 · Genau sagen: Verneinung und Ortsadverbien

#### Kap 52 · nie, nichts, noch nicht, nicht mehr
**Idea:** ***Das Wetterhäuschen.*** A giant weather house on the square. A positive sentence sends Frau Sonnig
(Huber) out; a negative one sends Herr Grau (Berger) out.

**Film**
1. The pairs: *immer – nie, jemand – niemand, etwas / alles – nichts, mit – ohne*.
2. *schon → noch nicht*: the parcel van is still on its way.
3. *noch → nicht mehr*: Lena doesn't live in the city any more.
4. *noch nie*, and only one negative word per sentence.
5. *nicht* against *nichts*: can you put in *etwas*? Then it is *nichts*.

**Mitspielen**
- *Sonnig fragt, Grau antwortet:* give Herr Grau's negative answer (**Folge**: the right figure comes out).

Voices: Huber, Berger, Lena.

#### Kap 53 · Ortsadverbien
**Idea:** ***Anton's house*** in cross-section.

**Film**
1. *Anton ist oben* (a pin). *Anton geht nach oben* (an arrow, and *nach*). The movement uses doors and cuts.
2. *dort* against *dorthin*: Accra on Lena's map.
3. *drinnen / draußen*, *rein / raus*.

**Mitspielen**
- *Hausführung:* direct Max (*Geh nach unten!*), then *Wo ist Max? – Unten.* (neutral)

Voices: Anton, Max (one line).
Needs: the house cross-section, a vertical camera move.

### B1 · Präpositionen mit Genitiv und Zeit

#### Kap 82 · wegen, trotz, während, innerhalb, außerhalb
**Idea:** ***Das Fest im Regen.*** A split screen: *wegen des Regens* (inside) against *trotz des Regens* (dancing
outside).

**Film**
1. *wegen* (cause), *trotz* (it happens anyway), *während* (two parallel bars).
2. The Genitiv form: *des Regens, der Kälte, des Festes* (G ring, *-s* on both words).
3. *innerhalb / außerhalb des Festzelts* (place), *innerhalb einer Stunde* (time).
4. As a clause: *wegen des Regens* = *weil es regnet*; *trotz* = *obwohl*.

**Mitspielen**
- *Wetter-Regler:* set the weather, and the guests react; choose *wegen* or *trotz* (**Folge**).
- **Then build the Genitiv form** (neutral).

Voices: Liv, Max (one line), Opa.

#### Kap 83 · Zeitpräpositionen mit Dativ und Genitiv
**Idea:** ***Fünf vor zwölf*** — counting down to the opening of the bridge.

**Film**
1. From NOW: *vor* (a point behind), *in* (a point ahead), *seit* (a bar up to NOW).
2. The church clock: *fünf vor zwölf*, and the saying (it's urgent).
3. *beim Aufbauen* (the moment) against *während des Aufbaus* (the whole span).

**Mitspielen**
- *Countdown:* plan the setting-up jobs on the clock and the timeline with *vor / nach / in / innerhalb*. If they
  all fit, the bridge opens on time (neutral).

Voices: Frau Adler, Anton, Liv.

---

## 3. Production order and effort (the reviewers' estimate)

1. **Rive work:** carry-walk, seated gestures, the head joint, the sleep face, nod. That is 2–4 days each.
2. **The core:** M0, the tile component, feedback, the practice format and M1, built through the **Kap 5 pilot**
   (the most-used machine; the workshop set is reused about 7 times).
3. **The second pilot, Kap 17:** case rings, Regie and the animal kit.
4. **Then by part:** the strip chapters (8, 13, 44, 45, 11, 10), the timeline chapters (25, 26, 32, 55, 83), the
   word-machine chapters (14, 28, 51, 49, 54), the space chapters (36 once carry-walk exists, 37, 33, 53), and the
   rest.

**Effort:** the core is about 4–6 weeks. Each chapter is then about 2–4 days, with recording and phone testing.
All 44 chapters come to about 5–8 months of steady work.

## 4. Decisions needed from you

1. **The children's voices (Max, Mia, Finn).** ElevenLabs does not allow child voices, and Max's KidVoice may not
   be published (so his lines in *Im Dorf* are silent online now). The options are adult voices made lively, a
   licensed child-voice source, or keeping the children nearly silent.
2. **The new adult voices and names:** Meister Anton (A02) and Frau Adler (A06). Also the names Mia (C03) and Finn
   (C04).
3. **The Rive work in §1.6**, and whether to fix Opa's seated wave in the live *Im Dorf* now.
4. **The A1 "Video ansehen" button:** should the new film replace it or sit next to it?
5. **A paid Rive plan** to remove the 2.4 s logo screen on every figure.
6. **The pilots:** start with Kap 5 and Kap 17?

## 5. Progress

- **22 Nov 2026, the core and the Kap 5 pilot are built.** See `docs/buehne.md`.
  - The shared stage (M0), tiles (T), feedback and practice format (F, P), the sentence strip (M1) with the clamp
    and the vowel wheel, and Anton's workshop.
  - *Die Klammer-Werkstatt* has 6 scenes and 11 practice rounds, checked on desktop and on a 375-px phone.
  - Voices chosen for Anton, Frau Adler, Max, Mia and Finn (decisions 1 and 2, see `docs/buehne.md`); Kap 5 is fully
    recorded.
  - Not yet: the lesson-page button and audio upload, and the Rive work in §1.6. Nothing is committed or deployed.
- **22 Nov 2026, the second pilot, Kap 17 *Wer jagt wen?*, is built and recorded** (Max and Elisa, 30 lines): the
  animal kit (dog, Minka, ball, birds, backpack), the case rings (M2), Regie with its Folge feedback, and the strip's
  case colours. Checked on desktop and on a phone.
- **22 Nov 2026, after the review of Kap 5** (applied to both pilots): every example sentence shows its meaning in a
  bubble by the speaker (a picture, the modal verb's icon, and the sentence strip inside the bubble instead of below
  the picture); characters act where they can (Anton saws, the broom sweeps, the window opens, the sign has a
  pictogram); gestures only when they mean something (no raised hands on ordinary lines).
- **22 Nov 2026, second review** (both pilots): the narrator's explanations are drawn on a board in the picture, in
  time with her voice (`tafel.js`); the camera no longer zooms on speakers — a soft spotlight shows who speaks
  (`licht.js`; a round face window was tried and dropped).
- **Next:** the strip chapters that reuse the workshop and the strip (8, 13, 44, 45, 11, 10).
