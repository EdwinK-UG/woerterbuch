/* "Die Spalte ist zu schmal" – C1 (internal id 482, Nominalstil: Verben werden zu Nomen). The newsroom of a local
   paper, just before the deadline: Lena's news items are too wide for the narrow column on tomorrow's front page, and
   Frau Adler's red pen folds verbs into nouns until whole sentences shrink into noun phrases that fit. Everything the
   scene does – set, cast, props, film, practice – is data in its private file (.local/scenes/k482-long/lines.json with
   ?local, or from the lesson page when embedded), played by the shared player (grammatik/buehne/szene.js, format v1:
   docs/scene-format.md). This file only names the scene. */
import { playScene } from '../buehne/szene.js?v=8';

playScene({ base: 'k482', set: 'redaktion', cast: ['lena', 'adler', 'berger'], feedback: 'k482', langs: ['de', 'en'], hook: '__nominalstil' });
