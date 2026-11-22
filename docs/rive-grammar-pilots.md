# Voiced Rive grammar pilots

Chapter 1 (A1 Personalpronomen) and chapter 54 (B1 Präteritum) open a Rive animation from their chapter header and Verstehen card. The existing A1 village scene is still available as **Im Dorf**. Each pilot has recorded captions, scene navigation, seeking and six practice items. The pilot practice is self-contained; its score does not update the chapter's saved exercise results.

The public player, licensed runtime and character exports live in `grammatik/rive-pilots/`. Authored scenes, answers and recordings stay in the private `grammar-pilots` Edge Function, outside GitHub Pages and Git history. The chapter page fetches one pilot with the caller's token and passes its payload only to its own same-origin frame. Closing the player, navigating or changing accounts removes the frame and recordings.

## Private build and release

Restore the recording source package to `.local/rive-pilots/source/`, or set `RIVE_PILOT_SOURCE_DIR` to its directory. It needs `lessons.js`, `recording-plan.csv`, and `recordings/` with its manifest. Run:

```sh
node tools/build-rive-pilots.cjs
```

The builder checks every script and recording fingerprint, duration, chapter mapping and selected voice before writing `.local/rive-pilots/pilots.json`. Elisa narrates, Alice plays Kathi, Cornelius plays Sepp and Azure `de-DE-GiselaNeural` in `eastus` plays Liv. The source also contains one Edwin cue using the existing Theo Teacher recording.

Deploy `supabase/functions/grammar-pilots/index.ts`, its dependency `supabase/functions/lessons/handler.mjs` and the generated JSON under `supabase/functions/grammar-pilots/pilots.json`. Do not commit or leave that JSON in the public function folder. The function applies the same fresh Auth/profile checks as lessons. Its gateway JWT check is disabled because the handler performs authentication and supports the site's current signed-out open access with a publishable API key.

Deploy the function before publishing the website. Run `npm run check` and regenerate asset versions before committing the player integration. Keep a private backup of the source, individual recordings and generated payload. No voice-service API keys are required at runtime.

When ending temporary open access, also set `OPEN_ACCESS` to `false` in this function and redeploy it before switching the site's `openAccess` off. Test `/functions/v1/grammar-pilots?chapter=1` and `?chapter=54` with the same headers as lesson loading. Unknown chapters must return 404; when access is restricted, signed-out or unenrolled requests must be refused.
