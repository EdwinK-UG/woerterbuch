# B2/C1 narration and Elisa recording handoff

The `say` field is the recording script. Display labels, tables and grammatical notation may stay concise; the spoken version is written as German someone can follow without reading those labels. A beat contains one teaching step, which may use several short sentences. Transitions are varied rather than prepending “Schau mal” to every clip.

The November 7 pass refines 209 beats in 81 films. It retains all 114 films, 514 scene IDs and 1,542 beat positions. It leaves 1,333 spoken texts character-for-character unchanged. The complete script contains 152,119 Unicode characters; the changed clips contain 29,432 characters. These are script counts, not a promise about a provider invoice or free regenerations. Re-recording a changed clip costs its whole new text, not merely the character difference.

## Teaching and motion

Concrete examples lead the explanation. Formula-like lists become short explanations with enough grammatical context to pronounce them. Partizip eins, Konjunktiv zwei and spelled-out years are spoken words. Letters used as grammatical endings are introduced as endings, rather than unexplained notation. There are no spoken image tags or acting directions. Contextual cautions replace a few overly absolute grammar statements.

The nine spatial contrasts use different questions and explanations rather than repeating the same abstract template. A brief lead-in lets the listener hear the start of a change before movement begins. Movement then finishes early enough to leave a still frame for understanding. The takeaway appears with the final beat. Recorded audio supplies the actual clock; estimates are only for silent preview.

Every suitable scene now has a manual comparison slider, including scenes without specially authored variants. Existing perspective choices, the adjective matrix and quiz feedback remain. The interaction does not submit a graded exercise. Dense phone comparisons move upward to keep the takeaway clear. The participle contrast adds a child painting and the finished picture, while a small time axis retains simultaneity versus completed result. This illustration revision changes no audio text.

## Recording source of truth

Use the complete source folder named in the release handoff and its release manifest. It contains all 263 protected lessons, including C1 vocabulary and the latest grammar films. Do not use `.local/lessons` or an older authoring archive just because that path was once convenient. It can be a symlink into another checkout or an older release.

Load a lesson through `GRAM.add` and use its final `lesson.film`. Do not extract strings with a regular expression: historical source wrappers can contain other literal text. The recording-plan tool loads the final film object correctly.

```sh
node tools/film-recording-plan.cjs \
  /ABSOLUTE/RELEASE/complete-lessons \
  /ABSOLUTE/NEW/recording-plan \
  /ABSOLUTE/BASELINE/recording-plan.json
```

The final argument is optional. It compares texts by stable cue ID. The tool makes a complete JSON plan, a readable script and one chapter JSON per film, without calling ElevenLabs. Each cue has its exact text, filename, SHA-256 text fingerprint, planned duration, character count and adjacent text. The complete plan and each chapter plan are accepted by the local player and MP4 exporter.

Historical storyboards can be updated through reviewed exact-text edits:

```sh
node tools/revise-film-narration.cjs \
  /ABSOLUTE/CURRENT/complete-lessons \
  /ABSOLUTE/PRIVATE/narration-edits.json \
  /ABSOLUTE/NEW/complete-lessons
```

This checks the old text before applying a change, preserves original exercises and generators, and refuses overlapping or existing output folders. An optional fourth argument supplies reviewed visual edits with exact before/after descriptors. It does not publish anything.

## ElevenLabs

- Voice: **Elisa - Pleasant, Friendly & Familiar**, ID `Ew9k3hOjG0x2iTWems98`.
- Model: **`eleven_multilingual_v2`**, as requested. The web editor may default to another model; verify it before generating.
- The pilot uses the displayed defaults: speed 1.0, stability 0.5, similarity 0.75, style 0, speaker boost enabled. These are a reproducible starting point, not a claim of universally optimal settings.
- Record exactly `say`, one MP3 per cue. `space-0--2.mp3` means beat two of scene `space-0`. Do not add chapter headings or read metadata aloud.
- For API recording, `previous_text` and `next_text` may receive the plan's adjacent text to improve continuity between separate clips. They provide context; they must not be concatenated into the spoken `text`. Keep context inside the same film.
- Multilingual v2 does not support the API's `language_code` parameter. The plan's `language: de` is descriptive metadata. Do not add v3/v4 audio tags or unsupported phoneme markup to this script.
- Freeze the generation configuration after listening to a small test. A reuse receipt should include cue ID, exact text hash, voice ID, model, output format, voice settings, pronunciation dictionary version and any context/settings actually supplied. Record the audio-file hash too. A filename alone cannot prove that an MP3 still matches.

ElevenLabs references: [speech controls and pronunciation](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices), [speech API and adjacent-text context](https://elevenlabs.io/docs/api-reference/text-to-speech/convert).

## Import and export checks

Choose the MP3 files **together with their matching JSON plan** under “Stimme & Video”. The local player rejects a plan whose cue IDs or exact text differ from the current film, even if the MP3 filenames match. This protects against accidental stale recordings; it cannot establish what someone actually said inside an arbitrarily relabelled audio file.

For video export:

```sh
node tools/render-film.cjs \
  --lesson /ABSOLUTE/RELEASE/complete-lessons/k109.js \
  --audio /ABSOLUTE/RECORDED/CLIPS \
  --manifest /ABSOLUTE/recording-plan.json \
  --out /ABSOLUTE/NEW/VIDEO
```

Supply the existing local resvg and ffmpeg paths if they are not installed in the normal tooling location. The exporter validates the script plan before decoding and measures decoded audio samples, then uses that timing for the film and captions. This is cue-level synchronisation, not word-level alignment.

Use `--cue SCENE--NUMBER` to export one recorded beat without requiring recordings for the whole film. This retains the original animation state and measures that clip's duration.

Three pilot clips were generated through the web editor with the stated Elisa settings. The account balance changed from 126,926 to 126,520 credits: 406 credits, inside the user-approved 500-credit ceiling. No full-run generation was performed. The pilot receipt stores each exact script and audio hash.

Listen to the pilot for pronunciation, phrase stress and sentence endings before the full recording run. Keep full-run generation separate from a website deployment: deploying the scripts spends no ElevenLabs credits.
