# Mit Liv sprechen: the grammar speaking trainer (experiment)

Liv talks with the learner about one grammar chapter. She asks a question that needs the chapter's grammar, the
learner answers aloud (or types), and Liv reacts like a friend. When the answer has a mistake in the target grammar, she
repeats it correctly in her reply, and a small card shows **Besser: …** with a short English reason. After about eight
answers she says goodbye. The first chapter is **A1 · Kapitel 18, Modalverben** (`#/g/5`, internal id 5).

Only the founder and people who redeemed one of the founder's access codes can see and use it.

## Where it comes from

No written design was found. Past sessions and `docs/` hold no plan for a "speaking trainer"; the owner's request
(22 Nov 2026) is its first mention in the transcripts. It builds on what each chapter already has:
- **"Sprechen"**: the speaking cards in every grammar chapter ("Erst laut sagen – dann aufdecken"). The trainer sits at
  the top of this section.
- **"Selbst sprechen" in *Im Dorf*** (`grammatik/dorf/`): you tap Liv, she asks *Wie heißt du?*, and you answer by
  microphone (the browser's speech recognition) or by typing. The trainer is the open version of this: free answers,
  with Claude and Liv's own voice.
- **The pilots' stage** (`grammatik/buehne/`, `docs/buehne.md`): Liv is the same 2D Rive figure, in Meister Anton's
  workshop (Kapitel 18's set). She talks while her voice plays, thinks while she waits, cheers when an answer is right,
  and waves at the end. The camera stays still (the owner's rule).

## Speech: ElevenLabs both ways, Claude in the middle

| Step | Service | Why |
|---|---|---|
| Learner → text | **ElevenLabs Scribe** (`scribe_v2`, German, batch) | It writes down what was said, mistakes included. A grammar trainer needs exactly that. The browser's speech recognition (Google on Android, Siri on iPhone) "corrects" learners towards fluent German (*Ich kann schwimmen gut* comes back as the right sentence), so their errors disappear. It is missing in Firefox, and on many phones it needs the Google app. |
| Liv's answer | **Claude Opus 5.5** (`claude-opus-5-5`, effort `low`, JSON output, `fallbacks: "default"`) | It plays Liv, keeps to A1 German, judges the target grammar and writes the recast. |
| Text → Liv's voice | **ElevenLabs Flash v2.5** (`eleven_flash_v2_5`, `language_code: de`, mp3 22 kHz 32 kbps) | Liv keeps the voice she has in the lessons (Lucy), at about 75 ms model latency. The browser's own voices differ on every phone, are robotic, and many Android phones have no German voice installed. |

**Costs per learner answer** (ElevenLabs API prices, Nov 2026):
- Scribe: 6 s of speech ≈ $0.0003 ($0.20 an hour).
- Flash: Liv's reply of about 80 characters ≈ $0.003 ($0.04 per 1,000 characters).
- Claude Opus 5.5: about 2,500 tokens in and 300 out ≈ $0.015.

So one answer costs about **2 US cents**, and a full conversation of eight answers about **15 cents**. The daily
limits cap this (below). If cost matters more than quality later, the Worker variable `SPEAK_MODEL=claude-haiku-5-5`
cuts Claude's share by about 95%; that is the owner's call.

**On a phone in Kenya or Uganda:** each answer sends about 15–20 KB of audio (Opus or AAC at 24 kbps). Liv's reply comes
back as about 20 KB of mp3 inside the same response, so one round trip covers everything. A turn takes about 3–5
seconds, and Liv's thinking pose covers the wait.

## How it works

```
chapter page (grammatik.js)                   Worker (worker/src/speak.js)                    outside
  GET /speak/access → card "Mit Liv sprechen"   checks the sign-in, then speak_access (D1),
  iframe grammatik/sprechen/?ch=5               then is_founder (Supabase)
  POST /speak/turn (multipart)        ───────►  counts the turn (limits) ──► Scribe (if audio)
    chapter, history, text | audio              brief for the chapter     ──► Claude (Liv's JSON)
  ◄─ { heard, say, verdict, fix, why, done,     ◄────────────────────────────  ElevenLabs Flash (voice)
       audio (base64), left }
```

- **Keys** live only in the Worker as secrets: `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, and `SPEAK_VOICE_ID` (Liv's
  voice id, kept private like `.local/scenes/voices.json`). The page gets the learner's sign-in from the lesson page
  (`parent.ACCT.token()`).
- **Chapters**: `worker/src/speak-briefs.js` (grammar target, typical errors, situation) and `SPEAK` in
  `grammatik/grammatik.js` (which chapter page shows the card). To add a chapter, write a brief, add it to `SPEAK`, and
  give the page `?ch=<id>`. The set is the workshop for now; another chapter may want its own.
- **Prompt**: `systemPrompt()` in `speak.js`. The learner's words are passed as quoted transcripts and are never
  treated as instructions. Liv stays on topic. Claude's answer is a JSON schema (`say`, `verdict` good/fix/none,
  `fix`, `why`, `done`).
- **Limits** (Worker vars): `SPEAK_USER_DAILY` 40 turns per account per day, `SPEAK_FOUNDER_DAILY` 200,
  `SPEAK_GLOBAL_DAILY` 600 for the whole site. Turns must be at least 1.5 s apart, a recording can be at most 1.5 MB
  (the page stops at 20 s), and typed answers at most 300 characters. A turn counts before the paid calls run.
  `SPEAK_ENABLED="true"` switches the trainer on; anything else pauses it.

## Access codes

- **The founder**: Owner dashboard (`#/admin`) → **Sprechtrainer-Codes**. Pick who a code is for (optional) and how many
  people may use it (1, 5, 20 or 50), then press **Code erstellen**. The share link
  `https://deutschklinik.com/?sprechen=LIV-XXXX-XXXX` is copied straight away. The list shows each code, how many people
  used it, their emails, and **Zurückziehen** (withdraw: everyone who used that code loses the trainer).
- **A learner**: opens the link, or types the code into the account panel's **Einladungscode** field. If they are not
  signed in, the code waits until they sign in (and confirm their email).
- Codes are `LIV-` plus 8 letters or digits without look-alikes (no 0/O, 1/I/L). An account may try at most 10 codes a
  day.
- D1 tables (`worker/migrations/0009_speak_trainer.sql`): `speak_codes`, `speak_access`, `speak_usage`, `speak_tries`.

## Try it

- **Without the Worker** (no costs): `http://localhost:8802/grammatik/sprechen/index.html?local` (launch config
  `woerterbuch-speak`). A pretend Liv answers. Typing *Ich kann schwimmen gut* shows the correction card.
  `window.__sprechen` holds the state.
- **The voices** with the real key: `node tools/speak-check.cjs` in the terminal where `ELEVENLABS_API_KEY` is set.
  Liv says one sentence with Flash, Scribe writes it down again, and the script prints how long each step took.
- **Tests**: `worker/tests/speak.test.mjs` (codes, access, limits, the calls to Claude, Scribe and Flash with stand-ins)
  and `tests/speak-trainer.test.cjs` (no keys on the page; the card only with access; LIV codes in the account panel).

## Going live (only with the owner's go-ahead)

From a temporary worktree of `origin/main` with only these files copied in (the local `main` has an unpushed commit that
must not go out):
1. Create an Anthropic API key for the Worker, then `cd worker`.
2. Run `npx wrangler secret put ANTHROPIC_API_KEY`, then `ELEVENLABS_API_KEY`, then `SPEAK_VOICE_ID` (Liv's id from
   `.local/scenes/voices.json`).
3. Run `npx wrangler d1 migrations apply woerterbuch-eintraege --remote` (adds 0009).
4. Run `npm ci` at the repo root (the Worker bundles `@anthropic-ai/sdk` from there), copy the local `worker/wrangler.toml`
   (it has the `SPEAK_*` vars), then run `npx wrangler deploy`.
5. Push the site files (`grammatik/sprechen/`, `grammatik/grammatik.js`, `grammatik/buehne/stage.js`, `konto.js`,
   `index.html`, `release.js`).
