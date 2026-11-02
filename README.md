# Deutschklinik

A static German-learning site with a dictionary, vocabulary topics, grammar exercises, flashcards, practice games and school accounts.

The browser runs plain JavaScript. GitHub Pages serves the files. Supabase provides authentication, database permissions and account storage. The separately deployed Cloudflare Worker supplies AI, photo and welcome-email functions.

## Develop and verify

Use Node 18 or later and Python 3. Node 24 is selected in CI.

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
| `grammatik/k*.js` | Individual lessons |
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

## Worker and site release

Follow `worker/README.md` for D1 migration, quotas, Auth verification, editorial publishing, welcome queue and mail secrets. Existing AI entries move into the draft queue until reviewed.

Run `npm run check`, review the site at phone and tablet widths, apply validated database upgrades, and then publish the site and Worker through their normal release processes. Reopen older tabs after a release so they load the same asset versions. Hosted-service checks remain a separate release step.

## Content and recovery

Generate vocabulary from private reviewed inputs using `tools/vocabulary/README.md`. The authoring backup delivered with this review preserves the selected inputs and example corpus. A restored copy rebuilt all 52 vocabulary topics byte for byte after three existing English sentence choices were pinned in the family topic.

The dictionary identifies Langenscheidt as its source. Confirm redistribution permissions before expanding publication. Keep Wiktionary, Tatoeba and image/audio attribution with generated lessons. Fluency, translation quality and level suitability need editorial review.

The service worker caches the page shell and visited lessons. The dictionary search page offers an explicit offline download. A signed-in account's pending saves stay in its own local cache after sign-out. Browser storage can be cleared or evicted, so synchronize before moving devices.

Maintain independent exports of Supabase and Worker data. Test restoration into separate projects. The source bundle backs up authoring inputs, while account and service data need their own backup process.
