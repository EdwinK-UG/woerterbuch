# Email artwork

Announcement emails (new features, sneak peeks, calls to test) are designs in `worker/src/announce.js`; the founder
picks one in the email composer (Konto → Email users → Design). Their pictures live in `assets/mail/` and are made
here, from `kit.html`, with the brand: the round cat logo, the wordmark Deutsch**klinik** (Fraunces, "klinik" in
#1f6feb), paper #f6f4ef, ink #20242b, line #e7e2d7, light blue #e9f1ff.

1. Take screen pictures of the new feature (for a scene: `grammatik/<scene>/index.html?local&shot=<scene no>&at=<line id>&after=<s>` stops the film at that line, without controls):
   `node tools/shoot.cjs "<url>" .local/mail/<name>.png --size 960x700 --el "#stage" --ready "window.__shot===true"`
2. Put them into the kit and render the parts at 2× with transparent corners (server on port 8798):
   `node tools/shoot.cjs "http://localhost:8798/tools/mail/kit.html?clear&a=<picture 1>&b=<picture 2>" assets/mail/<name>-hero.png --size 700x900 --el "#hero" --ready "window.__ready" --transparent`
   (`#lockup` the logo, `#hero` the sneak-peek banner, `#cardA` / `#cardB` the feature pictures).
3. Add a design to `DESIGNS` in `worker/src/announce.js` (hero, items, tip, questions, call to action) and deploy the Worker.

Emails use tables, inline styles and images with a fixed width (464 px inside the 520 px card) so they look the same
in Gmail, Apple Mail and Outlook; text stays real text, only the artwork is pictures.
