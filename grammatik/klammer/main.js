/* "Die Klammer-Werkstatt" – A1 · Kapitel 18 on the site (internal id 5, Modalverben: Formen und Satzklammer). In Meister
   Anton's workshop the sentence strip shows the clamp: the modal verb takes seat 2, the infinitive rides to the last
   wagon, and the jaws click. Everything the scene does – set, cast, film, practice – is data in its private file
   (.local/scenes/k05-long/lines.json with ?local, or from the lesson page when embedded), played by the shared player
   (grammatik/buehne/szene.js, format v1: docs/scene-format.md). This file only names the scene. */
import { playScene } from '../buehne/szene.js?v=7';

playScene({ base: 'k05', set: 'werkstatt', cast: ['anton', 'liv', 'lena'], feedback: 'k05', hook: '__klammer' });
