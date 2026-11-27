/* "Lenas Umzug auf dem Zeitband" – C1 (internal id 439, Futur II: Vermutungen über Vergangenes und Abschlüsse in der
   Zukunft). Moving day: in Antons Werkstatt and in Lena's new flat a glowing time band lies on the floor; guesses about
   what has happened float as see-through bubbles that fill in when they turn out true, and the camera flies ahead to
   Friday to look back at what will be done. Everything the scene does – sets, cast, props, film, practice – is data in
   its private file (.local/scenes/k439-long/lines.json with ?local, or from the lesson page when embedded), played by
   the shared player (grammatik/buehne/szene.js, format v1: docs/scene-format.md). This file only names the scene. */
import { playScene } from '../buehne/szene.js?v=9';

playScene({ base: 'k439', set: 'wohnung', cast: ['lena', 'huber', 'anton'], sets: ['werkstatt'], feedback: 'k439', langs: ['de', 'en'], hook: '__futur2' });
