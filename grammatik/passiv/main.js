/* "Die Werkstatt der unsichtbaren Hände" – B2 (internal id 99, Passiv: Formen, Gebrauch und der Handelnde). In Meister
   Anton's workshop glowing gloves do the work while nobody is named; the doer fades to an outline and comes back with
   "von". Everything the scene does – set, cast, props, film, practice – is data in its private file
   (.local/scenes/k99-long/lines.json with ?local, or from the lesson page when embedded), played by the shared player
   (grammatik/buehne/szene.js, format v1: docs/scene-format.md). This file only names the scene. */
import { playScene } from '../buehne/szene.js?v=8';

playScene({ base: 'k99', set: 'werkstatt', cast: ['anton', 'lena', 'huber'], cases: true, feedback: 'k99', langs: ['de', 'en'], hook: '__passiv' });
