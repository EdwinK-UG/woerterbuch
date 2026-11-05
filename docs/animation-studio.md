# Authored animation studio

This replaces picture-type guessing with explicitly authored teaching films. The public player reads film metadata from protected lesson bodies. The eight initial films are delivered by the authenticated `lessons` Edge Function, with JWT verification and the existing enrolment checks enabled.

## What is finished

Eight storyboards, 84 scenes: B2 chapters 88 (object order), 91 (negation), 99 (passive), 109 (two-way prepositions), 144 (adjective endings), 148 (reported speech), and C1 chapters 482 (nominalisation), 487 (commas). Each scene has original examples, explicit token roles, a meaningful visual transition, a text alternative, a takeaway and authored German narration. Selected checkpoints give explanatory feedback. The location, negation and reported-speech studios have user-controlled visual transformations; the adjective studio has 80 manually specified paradigm cells.

These are eight authored films, **not completed animation coverage of all 114 B2/C1 chapters**. Other B2/C1 chapters keep their written lessons and graded exercises. Their automatic legacy “video” button is hidden until an authored `film` is present. A1 keeps its existing player.

## Private data and local preview

Public renderer: `grammatik/film.js`, `grammatik/film.css`. Private storyboards: `.local/animation-scripts/stories.cjs` (gitignored). Compiled review lessons: `.local/animation-lessons/` (gitignored). Do not publish these directories as static public assets.

```sh
node tools/build-film-lessons.cjs
python3 -m http.server 8766 --bind 127.0.0.1
```

Open `http://127.0.0.1:8766/prototypes/film/preview.html`. No account, remote backend or live sign-in is used. The compiler reads `.local/lessons` and writes separate copies. It refuses a symlink output or an output overlapping the source directory. It wraps the original lesson source, preserving functions and exercises, then adds `film` metadata.

For each release, include the enriched private lesson bodies in the **authenticated** lesson bundle. A git push alone does not ship the private storyboards. Set `LESSON_SOURCE_DIR` to the complete enriched source archive, run `npm run lessons:bundle`, and deploy the resulting JSON alongside the existing `lessons` function entrypoint and handler, with JWT verification enabled. Preserve the current deployed lessons when adding film metadata; do not rebuild production from a stale or partial archive. No database migration is required.

An offline review artifact can be built outside the checkout:

```sh
node tools/package-film-preview.cjs .local/animation-scripts/stories.cjs /ABSOLUTE/PRIVATE/OUTPUT/studio.html
```

## Timing and recorded voice

`compile(story, durations)` creates one timeline. `frame(timeline, seconds)` is a pure SVG frame renderer used by the player, scrubbing, experiments and offline export. It does not use CSS animation, browser voices, grammatical string guesses or independent illustration timers.

Each scene has three narrated beats. A beat declares text, a planned duration and a semantic stage. Movement happens at the start of the relevant beat, then holds while the explanation continues. Export the speaking plan under “Stimme & Video”; it supplies German text and filenames such as `space-park-location--1.mp3`.

Make recordings with the voice service of your choice, then import the audio files into the studio. Each clip's measured duration replaces the corresponding planned duration. During that cue, the audio element's `currentTime` is the playback clock. The visible animation pauses with the recording and seeks through the same timeline. The files remain local; the application sends no audio or text to ElevenLabs and spends no API credits.

This provides cue-level synchronisation. It does not perform word-level forced alignment or lip sync. A voice actor should record one cue per file and avoid long silence at the start. Re-export the speaking plan and subtitles after loading the final voice files, since the total length changes.

## MP4 export

Install `@resvg/resvg-js` in a separate tooling directory and obtain ffmpeg from its official project or the `ffmpeg-static` npm package. The application itself has no new runtime dependency. Node 24 is recommended, matching the repository.

```sh
node tools/render-film.cjs \
  --lesson .local/animation-lessons/k109.js \
  --out /ABSOLUTE/NEW/OUTPUT/DIRECTORY \
  --resvg /ABSOLUTE/TOOLS/node_modules/@resvg/resvg-js \
  --ffmpeg /ABSOLUTE/TOOLS/node_modules/ffmpeg-static/ffmpeg
```

The exporter uses the same SVG frames as the player and produces a silent 1920×1080 MP4, subtitle VTT, narration manifest, storyboard JSON and poster SVG. Add `--audio /ABSOLUTE/CLIPS` for a narrated MP4; all cue files must be present. Mixed input audio formats are converted before concatenation. Existing output directories are refused to prevent accidental overwrites.

Use `--start 8 --seconds 36` for a sample and `--frames-only` to render without ffmpeg. `--portrait` uses the mobile composition. `--width`, `--fps` and `--font` allow controlled production output. The exporter selects common local font files when available; a comma-separated `--font` list gives explicit control and avoids expensive system-font discovery on every frame. Use fonts licensed for your intended video distribution.

## Review gates before release

The eight scripts have been checked against the current lesson concepts, with original examples rather than source-page crops. The comma explanation uses the 2024 official rules. A German-language editorial pass and a final viewing with the chosen recorded voice should still precede publication. Diagrams simplify spatial relationships and use objects schematically; the written lesson remains the detailed reference.

Tests cover deterministic timing, audio-clock behaviour, subtitle clipping, validation, escaping, native interactions and source preservation. Browser checks cover the local preview, desktop and 390-pixel mobile layout. No iPhone/Safari hardware test, full screen-reader audit or low-end-device performance benchmark has been claimed.

Run `node tools/version-assets.cjs` after renderer or integration changes. Run `npm run check` in an isolated public snapshot if `.local/lessons` is a symlink; do not move or rewrite another checkout's lesson folder.
