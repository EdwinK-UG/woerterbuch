# Authored animation studio

This replaces picture-type guessing with explicitly authored teaching films. The public player reads film metadata from protected lesson bodies. The eight initial films are delivered by the authenticated `lessons` Edge Function, with JWT verification and the existing enrolment checks enabled.

## Authored coverage

All 114 B2/C1 grammar chapters have authored films: 514 scenes and 1,542 narrated beats. The initial eight detailed films cover B2 chapters 88, 91, 99, 109, 144, 148 and C1 chapters 482, 487. The remaining 106 films extend the same renderer to all other B2/C1 chapters. The protected complete lesson archive, rather than an old authoring directory, is the release source of truth.

The full November narration pass preserves every scene ID and beat count. All 1,542 lines were reviewed: 1,392 rewritten and 150 kept, for 151,689 characters. The complete `2026-11-07-narration-full/complete-lessons` archive was released as protected lesson function version 11 on 8 November. Its exact cue IDs and texts are now a recording contract: change narration only together with its matching re-recording. Historical scripts in `.local/animation-scripts/` and the earlier 209-line pass predate this release; rebuilding from those drafts would restore old text.

Seven picture families were added to the renderer for concepts the first nine could not show honestly: `slots` (topological sentence fields with configurable bracket pillars), `timeline` (events, span, now-marker, relation arrow), `scale` (an ordered gauge, e.g. certainty or degree), `link` (two propositions and their logical relation: cause, result, condition, concession, purpose, means, time, contrast, alternative, addition), `group` (authored items sorted into authored groups), `imagine` (reality card vs. thought cloud for Konjunktiv II) and `route` (to / at / from / along / through / around a room, surface, water, person, city or river). Like the others, they draw only authored data.

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

The current films each use three narrated beats per scene. The renderer also supports other authored counts. A beat declares text, a planned duration and a semantic stage. After a short opening breath, the relevant change moves, then holds while the explanation continues. The takeaway appears with the final beat. Scenes can also be explored with a keyboard-accessible transformation slider, without changing graded exercise results. Export the speaking plan under “Stimme & Video”; it supplies German text and filenames such as `space-park-location--1.mp3`.

Make recordings with the voice service of your choice, then import the audio files into the studio together with their matching JSON speaking plan. A filename alone cannot establish that a recording still matches the script. Each clip's measured duration replaces the corresponding planned duration. During that cue, the audio element's `currentTime` is the playback clock. The visible animation pauses with the recording and seeks through the same timeline. The files remain local; the application sends no audio or text to ElevenLabs and spends no API credits.

This provides cue-level synchronisation. It does not perform word-level forced alignment or lip sync. A voice actor should record one cue per file and avoid long silence at the start. Re-export the speaking plan and subtitles after loading the final voice files, since the total length changes.

## Screen layout and interactions

The lesson player uses `frame(..., {player:true})`, a compact screen composition with the same authored illustrations and examples. It removes duplicated video headings, brings captions directly above the picture, and wraps long example cards. The ordinary `frame()` API and its landscape/portrait export compositions remain unchanged.

A scene picker replaces the always-expanded contents list. The full list remains available under “Alle Szenen”. “Ausprobieren” pauses playback and places the perspective choices, transformation slider or adjective matrix directly with the picture. Entering the activity aligns that workspace once when necessary; slider input never scrolls the page. The selected perspective survives a responsive redraw. “Zurück zum Film” restores the exact recorded caption and playback controls without changing the cue or its audio identity.

The inline heading is explicitly static so the site's general sticky-header rule cannot pull it over the navigation. A modal heading stays within its own dialog scroll area. No lesson source, beat text, ID, duration, audio manifest, Worker route or enrolment rule is modified by these layout changes. Keep the compact composition out of the video exporter unless a separate export redesign is requested.

## MP4 export

Install `@resvg/resvg-js` in a separate tooling directory and obtain ffmpeg from its official project or the `ffmpeg-static` npm package. The application itself has no new runtime dependency. Node 24 is recommended, matching the repository.

```sh
node tools/render-film.cjs \
  --lesson .local/animation-lessons/k109.js \
  --out /ABSOLUTE/NEW/OUTPUT/DIRECTORY \
  --resvg /ABSOLUTE/TOOLS/node_modules/@resvg/resvg-js \
  --ffmpeg /ABSOLUTE/TOOLS/node_modules/ffmpeg-static/ffmpeg
```

The exporter uses the same SVG frames as the player and produces a silent 1920×1080 MP4, subtitle VTT, narration manifest, storyboard JSON and poster SVG. Add `--audio /ABSOLUTE/CLIPS --manifest /ABSOLUTE/recording-plan.json` for a narrated MP4; all cue files must be present and their plan must match the current cue IDs and exact texts. Mixed input audio formats are converted before concatenation. Existing output directories are refused to prevent accidental overwrites.

Use `--start 8 --seconds 36` for a sample and `--frames-only` to render without ffmpeg. `--portrait` uses the mobile composition. `--width`, `--fps` and `--font` allow controlled production output. The exporter selects common local font files when available; a comma-separated `--font` list gives explicit control and avoids expensive system-font discovery on every frame. Use fonts licensed for your intended video distribution.

## Review gates before release

The films use authored examples rather than source-page crops. The November spoken-language pass checks script clarity and the relation between script and diagram; it is not an independent native-speaker audit of every grammar claim. The comma explanation uses the 2024 official rules. A German-language editorial pass and a final viewing with the chosen recorded voice should still precede publication. Diagrams simplify spatial relationships and use objects schematically; the written lesson remains the detailed reference.

Tests cover deterministic timing, audio-clock behaviour, subtitle clipping, validation, escaping, native interactions and source preservation. Browser checks cover the local preview, desktop and 390-pixel mobile layout. No iPhone/Safari hardware test, full screen-reader audit or low-end-device performance benchmark has been claimed.

Run `node tools/version-assets.cjs` after renderer or integration changes. Run `npm run check` in an isolated public snapshot if `.local/lessons` is a symlink; do not move or rewrite another checkout's lesson folder.
