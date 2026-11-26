/* "Wer jagt wen?" – A1 · Kapitel 13 on the site (internal id 17, Der Akkusativ). On the village meadow Max meets a dog;
   coloured case rings at their feet show who is the subject (N, amber) and who the object (A, teal), and in the practice
   the learner's sentence is acted out exactly as its articles say. Everything the scene does – set, cast, animals, film,
   practice – is data in its private file (.local/scenes/k17-long/lines.json with ?local, or from the lesson page when
   embedded), played by the shared player (grammatik/buehne/szene.js, format v1: docs/scene-format.md). */
import { playScene } from '../buehne/szene.js?v=8';

playScene({ base: 'k17', set: 'dorf', cast: ['max'], cases: true, feedback: 'k17', hook: '__jagd' });
