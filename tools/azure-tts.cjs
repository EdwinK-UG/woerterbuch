/* Azure neural voices for the film narration (since 25 Nov 2026 the English and French narrators: German voices,
   "a German teaching German"; .local/scenes/audition/narrators-azure-2026-11.md).
   A voice in .local/scenes/voices.json is written  azure:<voice>[:tagged]  e.g. "azure:de-DE-KatjaNeural".
   A narrator line is spoken in ONE request (no splitting and joining as with ElevenLabs): its German runs ({de:…},
   any {x:…} mark) go inside <lang xml:lang='de-DE'>; with :tagged the explaining language's runs go inside
   <lang xml:lang='en-US' | 'fr-FR'> too (multilingual voices: a lighter accent). Without it a German-only voice reads
   them as a German would, which is the point for Katja.
   The key is read from .env.azure (AZURE_SPEECH_KEY, AZURE_SPEECH_REGION) and never printed. */
"use strict";
const fs = require("fs"), path = require("path");

const LOCALE = { en: "en-US", fr: "fr-FR", sw: "sw-KE", de: "de-DE" };
let env = null;
function key() {
  if (env) return env;
  const f = path.join(__dirname, "..", ".env.azure");
  if (!fs.existsSync(f)) throw new Error("no .env.azure (AZURE_SPEECH_KEY, AZURE_SPEECH_REGION)");
  env = Object.fromEntries(fs.readFileSync(f, "utf8").split(/\n/).filter((l) => /=/.test(l)).map((l) => [l.split("=")[0].trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")]));
  if (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) throw new Error(".env.azure needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION");
  return env;
}
const isAzure = (voice) => typeof voice === "string" && voice.startsWith("azure:");
const parse = (voice) => { const [, name, mode = ""] = voice.split(":"); return { name, tagged: mode === "tagged" }; };
const x = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// runs: [{ lang, t }] as tools/split-voice.cjs cuts a line; base: the explaining language
function ssml(runs, voice, base = "en") {
  const { name, tagged } = parse(voice);
  const body = runs.map((r) => (r.lang === "de" ? `<lang xml:lang='de-DE'>${x(r.t.trim())}</lang>` : tagged && LOCALE[base] ? `<lang xml:lang='${LOCALE[base]}'>${x(r.t.trim())}</lang>` : x(r.t.trim()))).join(" ");
  // Azure leaves about 0.85 s of silence after every clip (and a little before): set the edges exactly, so the film keeps
  // its natural pace and the Swahili duet has no gap after each German example
  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='de-DE'><voice name='${name}'><mstts:silence type='Leading-exact' value='50ms'/><mstts:silence type='Tailing-exact' value='150ms'/>${body}</voice></speak>`;
}
async function say(doc) {
  const { AZURE_SPEECH_KEY: K, AZURE_SPEECH_REGION: R } = key();
  for (let a = 1; ; a++) {
    const r = await fetch(`https://${R}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: "POST", body: doc,
      headers: { "Ocp-Apim-Subscription-Key": K, "User-Agent": "film-narration", "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3" } });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if ((r.status === 429 || r.status >= 500) && a < 5) { await new Promise((s) => setTimeout(s, 2000 * a)); continue; }
    throw new Error("azure tts " + r.status + " " + (await r.text()).slice(0, 200));
  }
}
// one line (or one run) into an mp3 file
async function speakAzure(runs, voice, file, base = "en") { fs.writeFileSync(file, await say(ssml(runs, voice, base))); return runs.reduce((s, r) => s + r.t.length, 0); }

module.exports = { isAzure, ssml, say, speakAzure };
