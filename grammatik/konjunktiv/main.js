/* "Wunschblasen am See" – B2 (internal id 97, Konjunktiv II: Wünsche und irreale Bedingungen). At the lake the ferry
   has just left; Lena and Opa Sepp wish, regret and imagine. Whatever is only wished shimmers lilac and pops when
   reality returns. Everything the scene does – set, cast, props, film, practice – is data in its private file
   (.local/scenes/k97-long/lines.json with ?local, or from the lesson page when embedded), played by the shared player
   (grammatik/buehne/szene.js, format v1: docs/scene-format.md). This file only names the scene. */
import { playScene } from '../buehne/szene.js?v=8';

playScene({ base: 'k97', set: 'see', cast: ['lena', 'opa'], feedback: 'k97', langs: ['de', 'en'], hook: '__konjunktiv' });
