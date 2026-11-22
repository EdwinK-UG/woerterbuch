/* A check before the speaking trainer goes live (docs/speak-trainer.md): Liv says one German sentence with the
   trainer's voice model (eleven_flash_v2_5, as the Worker does), and Scribe (scribe_v2) writes it down again. It shows
   that the ElevenLabs key may use both, that Liv's voice works with the fast model, and how long each step takes.
   Costs: about 60 characters of speech and 4 seconds of transcription.
     node tools/speak-check.cjs            (ELEVENLABS_API_KEY in the environment; it is never printed)
   Writes the sample to .local/speak-check.mp3 to listen to. */
"use strict";
const fs = require("fs");
const path = require("path");
const { call } = require("./elevenlabs.cjs");

const SENTENCE = "Hallo! Ich bin Liv. Kannst du gut schwimmen?";
(async () => {
  const voices = JSON.parse(fs.readFileSync(path.join(__dirname, "../.local/scenes/voices.json"), "utf8"));
  const voice = voices.liv; if (!voice) throw Error("No voice for Liv in .local/scenes/voices.json");
  let t = Date.now();
  const tts = await call(`/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_22050_32`, {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text: SENTENCE, model_id: "eleven_flash_v2_5", language_code: "de", voice_settings: { stability: 0.5, similarity_boost: 0.8, speed: 0.92 } }),
  });
  const mp3 = Buffer.from(await tts.arrayBuffer());
  const out = path.join(__dirname, "../.local/speak-check.mp3"); fs.writeFileSync(out, mp3);
  console.log(`Liv's voice (Flash): ${(mp3.length / 1024).toFixed(1)} KB in ${Date.now() - t} ms -> ${path.relative(process.cwd(), out)}`);
  t = Date.now();
  const fd = new FormData();
  fd.append("model_id", "scribe_v2"); fd.append("language_code", "de"); fd.append("tag_audio_events", "false");
  fd.append("file", new Blob([mp3], { type: "audio/mpeg" }), "check.mp3");
  const stt = await (await call("/v1/speech-to-text", { method: "POST", body: fd })).json();
  console.log(`Scribe heard in ${Date.now() - t} ms: "${stt.text}" (${stt.language_code}, ${Math.round((stt.language_probability || 0) * 100)} %)`);
  console.log(stt.text && /schwimmen/i.test(stt.text) ? "Both work. The trainer can use this key." : "Scribe did not hear the sentence – check the key's Speech to Text permission.");
})().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
