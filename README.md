# Deutschklinik

Primary website: https://deutschklinik.com/ . The root CNAME file configures the GitHub Pages custom domain. Cloudflare DNS points the apex and www to GitHub Pages; GitHub redirects www and the old Pages URL to the primary domain. Worker allowed origins include the new domain and the old origin during transition; its SITE_URL must point to the new root. Supabase Auth Site URL and allowed redirects must include the new domain. Users sign in again on the new origin to restore cloud-saved work.

A static German-learning site with a dictionary, vocabulary topics, grammar exercises, flashcards, practice games and school accounts.

The browser runs plain JavaScript. GitHub Pages serves the files. Supabase provides authentication, database permissions and account storage. The separately deployed Cloudflare Worker supplies AI, photo and welcome-email functions.

## Develop and verify

Use Node 24 and Python 3. Node 24 is what CI runs, and the `.nvmrc` file pins it (`nvm use` picks it up). Older versions can fail: Node 18.8, for example, cannot read the JSON import syntax in `worker/src/english.js`, so the syntax test fails there. Check with `node --version` before running `npm run check`.

```sh
npm ci --ignore-scripts
npm run check
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/`. The default local preview allows public reads. Account writes, uploads, live-game connections and AI generation require isolated staging configuration.

Copy `config.local.example.json` to the ignored `config.local.json`. Supply a separate staging Supabase URL, its public browser key and a staging Worker URL. Keep both URLs different from production. The staging configuration enables local account tests after validation. Deploy staging services and configure their allowed origins first.

The automated tests run in a simulated browser, local PostgreSQL via PGlite, and disposable SQLite. Auth, AI and SMTP are mocked. A production database or real learner account is unnecessary for these checks. GitHub runs the same check command on pushes and pull requests.

After changing JavaScript or lesson content, run `npm run assets` before committing. It generates the exercise catalog and content-based asset versions. CI detects stale generated files.

## Find the code

| File or folder | Responsibility |
| --- | --- |
| `index.html` | Page shell, navigation, dictionary, account synchronization and games |
| `konto.js` | Enrollment, schools, invitations, dashboards and settings |
| `grammatik/grammatik.js` | Shared lesson renderer and practice result synchronization |
| `.local/lessons/k*.js` (private, ignored) | Individual lesson sources |
| `supabase/functions/lessons/` | Server checks enrolment before sending lesson code |
| `grammatik/catalog.js` | Generated exercise IDs and titles for progress and assignments |
| `js/` | Rendering safety, message validation, save merging and shared pages |
| `config.js` | Public service addresses and the local preview guard |
| `supabase/migrations/` | Additive database upgrades |
| `worker/` | Worker source, migrations, isolated tests and example configuration |
| `tools/vocabulary/` | Portable vocabulary authoring tools |
| `tests/` | Regression and permissions checks |

Grammar covers A1, A2 and B1. Vocabulary currently has 16 A1, 13 A2, 10 B1 and 13 C1 topics. B2 is shown as coming soon.

## Database rollout

For a fresh staging project, apply `supabase_setup.sql` followed by `accounts_setup.sql`.

For an existing database matching the reviewed baseline commit `898b89a`, apply these migrations in order after checking the installed schema and taking a restorable backup.

1. `supabase/migrations/20261102_school_security.sql`
2. `supabase/migrations/20261102_study_data.sql`
3. `supabase/migrations/20261102_practice_results.sql`

The school upgrade stops if existing class references cross school boundaries. Inspect the records with the school before correcting them. Details and local tests are in `docs/school-security-rollout.md`.

The study-data upgrade adds preferences and revision checks. Practice results gain stable attempt IDs and a permission-preserving summary function. Apply the migrations before releasing the updated site. An old database leaves account edits pending in the device cache and displays a synchronization error.

Validate Auth confirmation, password reset, custom SMTP, allowed redirects, Storage and Realtime settings in staging. Database source and local tests do not establish the hosted project's settings.

For hosted welcome delivery, store the Worker's `WELCOME_HOOK_SECRET` in Supabase Vault as `deutschklinik_welcome_hook`, then apply `supabase/migrations/20261102_welcome_delivery.sql`. This enables pg_net and queues a small confirmation event asynchronously. It sends only the account ID, email address and confirmation time to the existing Worker. It never sends the Auth row's password hash or tokens. Trigger permissions exclude browser callers. Browser sign-in remains a fallback if the initial notification cannot be queued. See the [Supabase webhook](https://supabase.com/docs/guides/database/webhooks) and [Vault](https://supabase.com/docs/guides/database/vault) documentation.

The dictionary corrections in `tools/dictionary-corrections.json` record their sources. Run `npm run dictionary:correct` after a source rebuild to reapply them. It preserves entry order and saved-word aliases across the split and legacy data files. Asset versions follow the actual file contents. Game interface strings live in `js/game-i18n.js`; authored questions, dictionary meanings and German lessons retain their own language.

## Worker and site release

Follow `worker/README.md` for D1 migration, quotas, Auth verification, editorial publishing, welcome queue and mail secrets. Existing AI entries move into the draft queue until reviewed.

Run `npm run check`, review the site at phone and tablet widths, apply validated database upgrades, and then publish the site and Worker through their normal release processes. Reopen older tabs after a release so they load the same asset versions. Hosted-service checks remain a separate release step.

## Content and recovery

Generate vocabulary from private reviewed inputs using `tools/vocabulary/README.md`. The authoring backup delivered with this review preserves the selected inputs and example corpus. A restored copy rebuilt all 52 vocabulary topics byte for byte after three existing English sentence choices were pinned in the family topic.

The dictionary identifies Langenscheidt as its source. Confirm redistribution permissions before expanding publication. Keep Wiktionary, Tatoeba and image/audio attribution with generated lessons. Fluency, translation quality and level suitability need editorial review.

The service worker caches the page shell. The dictionary search page offers an explicit offline download. Lessons require an online account and a current enrolment check. The release deletes the old public lesson cache. A signed-in account's pending saves stay in its own local cache after sign-out. Browser storage can be cleared or evicted, so synchronize before moving devices.

## Private lessons

Lesson source files are no longer published through GitHub Pages. Restore the private lesson archive into `.local/lessons/`, or set `LESSON_SOURCE_DIR` to its location. `npm run lessons:bundle` checks all ready sources against the public exercise catalog and builds `.local/lesson-bundle/lessons.json`. Deploy that file with `supabase/functions/lessons/index.ts` and `handler.mjs` as the `lessons` Edge Function, keeping JWT verification enabled. Deploy the function before publishing a site that uses it. Never commit the generated bundle or private lesson sources.

The function verifies the account with Supabase Auth and reads its current profile using that account's JWT and database policies. Learners receive only their unlocked levels. Teachers, schools and the founder can receive all lessons. Reference lessons require at least one unlocked level for learners. The public catalog contains titles and exercise IDs, without lesson bodies or answers. Marking a course as visible to everyone affects its overview, while opening a lesson always requires enrolment. Account changes discard lessons held in browser memory.

Public Git history may retain earlier copies of lessons. They cannot be recalled from existing clones or downloads. B2 remains empty until the owner supplies its content.

Public CI validates the catalog, engine and access rules without private content. A release also requires `npm run lessons:bundle` with the restored private sources. Back up private source changes separately before deploying a new lesson bundle.

Maintain independent exports of Supabase and Worker data. Test restoration into separate projects. The source bundle backs up authoring inputs, while account and service data need their own backup process.
