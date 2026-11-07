/* Shared ElevenLabs client for tools/watch-audio.cjs and tools/film-audio.cjs.
   The API key is read only from the environment (ELEVENLABS_API_KEY). It is never printed, saved or put on the
   command line. */
"use strict";
const BASE = (process.env.ELEVENLABS_BASE_URL || "https://api.elevenlabs.io").replace(/\/$/, "");
const FORMAT = "mp3_44100_96";                       // speech does not need more; 192 needs a higher plan
const DEFAULT_MODEL = "eleven_multilingual_v2";
// Node 18 prints a warning for the built-in fetch; hide only that one
const emit = process.emitWarning;
process.emitWarning = (w, ...rest) => (/Fetch API/.test(String(w)) ? undefined : emit.call(process, w, ...rest));

const die = (msg) => { console.error("\n" + String(msg).replace(/xi-api-key[^\s]*/gi, "[key]") + "\n"); process.exit(1); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function apiKey() {
  const key = (process.env.ELEVENLABS_API_KEY || "").trim();
  if (!key) die("No API key found. In your own terminal run:\n  read -rs \"ELEVENLABS_API_KEY?Paste key (hidden): \" && export ELEVENLABS_API_KEY\nthen run this command again in the same terminal window.");
  return key;
}

async function call(pathAndQuery, init = {}, soft = false) {
  const bail = (msg) => { if (soft) throw new Error(msg); die(msg); };
  const url = BASE + pathAndQuery;
  for (let attempt = 1; ; attempt++) {
    let response;
    try { response = await fetch(url, { ...init, headers: { "xi-api-key": apiKey(), ...(init.headers || {}) } }); }
    catch (e) { if (attempt < 3) { await sleep(1500 * attempt); continue; } bail("Could not reach " + BASE + " (" + (e.cause && e.cause.code || e.message) + "). Check the internet connection."); }
    if (response.ok) return response;
    const detail = (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 300);
    const lacks = response.status === 401 && /missing_permissions[\s\S]*?permission ([a-z_]+)|permission ([a-z_]+) to execute/i.exec(detail);
    if (lacks) bail("The key works, but it is limited and lacks the permission \"" + (lacks[1] || lacks[2]) + "\".\nIn ElevenLabs open the API key's settings and allow: Text to Speech (access), Voices (read) and Models (read), then run this again.\n" + detail);
    if (response.status === 401) bail("ElevenLabs rejected the API key (401). Check that you pasted the full key and that the plan is active.\n" + detail);
    if (response.status === 429 && attempt < 4) { const wait = Math.min(30, +response.headers.get("retry-after") || 4 * attempt); console.log(`  busy (429) – waiting ${wait}s …`); await sleep(wait * 1000); continue; }
    if (response.status >= 500 && attempt < 3) { await sleep(2000 * attempt); continue; }
    if (/paid_plan_required|library voices/i.test(detail)) bail("This voice comes from the Voice Library, and free plans cannot use those through the API.\nUse a premade voice for testing, or upgrade the plan to use a library voice.\n" + detail);
    if (response.status === 402 || /quota|credit|limit/i.test(detail)) bail("ElevenLabs says the credits or plan do not allow this (" + response.status + "). A free plan cannot use every voice or model.\n" + detail);
    bail(`ElevenLabs returned ${response.status} for ${pathAndQuery.split("?")[0]}.\n${detail}`);
  }
}

// extra: optional request fields, e.g. voice_settings, previous_text and next_text (context only, never spoken)
async function speak(text, voiceId, model = DEFAULT_MODEL, extra = {}) {
  const response = await call(`/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${FORMAT}`, {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "audio/mpeg" }, body: JSON.stringify({ text, model_id: model, ...extra }),
  });
  const type = response.headers.get("content-type") || "";
  return { bytes: Buffer.from(await response.arrayBuffer()), ext: /wav/i.test(type) ? "wav" : "mp3" };
}

const credits = (chars) => `${chars.toLocaleString()} characters (about ${chars.toLocaleString()} credits on the multilingual model)`;

module.exports = { BASE, FORMAT, DEFAULT_MODEL, die, sleep, call, speak, credits };
