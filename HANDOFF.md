# HANDOFF – Deutschklinik (repo: woerterbuch)

> **Historical snapshot — archived 5 November 2026.** The original handoff below
> describes baseline commit `898b89a`; its **[confirmed]** labels refer to that
> earlier review, not the current application. Its setup commands, deployment
> guidance and conversation instructions are historical context. Consult the
> current README, implementation and migration history before acting on them.
>
> **Current grammar checkpoint:** the five native-grammar commits from `ea78bb0`
> through `0f77849` are included in `cd8d2be`, which also adds the independently
> authored A1 video explainers. The advanced rebuild covers source chapters
> 1–54 of 88, partner activities 1–6 and the irregular-verb trainer: 69 native
> units, 3,822 question rows and 4,462 graded answer points. Chapters 55–88 and
> the remaining supplementary material still need work. The protected lesson
> bundle was prepared locally; this checkpoint does not establish its deployment.
>
> The primary domain is now `deutschklinik.com`; Worker code and automated tests
> are in this repository. Lesson bodies are private and served through the
> enrolment-checking lessons function. Native lessons use app tables, exercises
> and original SVG illustrations. The rejected page-image workbook and its
> unused `grammar-source` bucket are not part of the current lesson design.
>
> **Verified 5 November 2026:** Supabase migration history contains
> `20261104232256_protect_grammar_source_assets`. The accompanying SQL records
> protection for that legacy bucket. Committing it does not apply a migration
> or deploy lesson content.

---

Written for a coding agent who will review this project. Facts marked **[confirmed]** were checked in the code, git, the browser or a local database during the last session. Items marked **[assumption]** are inferred and not verified. No secrets, passwords, keys or environment values are included here.

---

## 1. What the project is

**[confirmed]** A German-learning website, now branded **Deutschklinik** (the GitHub repo and many code names still say "Wörterbuch"/"woerterbuch").

- Live: https://edwink-ug.github.io/woerterbuch/ (GitHub Pages, branch `main`, repo `EdwinK-UG/woerterbuch`).
- Owner: Edwin (site founder). Target users are mainly English speakers learning German (context suggests Uganda/East Africa), plus language schools and teachers.

### Intended users and roles
| Role | What they do |
|---|---|
| Visitor (not signed in) | Sees the Deutschklinik home page (English), the dictionary and the games. Everything else is locked by default. |
| Learner (independent) | Signs up, enrolls in one or more levels (A1–C1), learns vocabulary and grammar for **only** the enrolled levels, uses lists, flashcards and games, and has a learner dashboard. |
| Learner (in a school) | Joins through an invite link. Chooses a desired level, but a teacher/school must enroll (unlock) it. They can unenroll themselves. |
| Teacher | Approved by the founder (or invited by the founder). Has their own branded "teacher page" (org of kind `teacher`), classes, invite links, assignments with deadlines, their own pass mark, and a dashboard of learners grouped by level. |
| School | Like a teacher, plus teacher invites. Branding (logo, colour, welcome text) is shown site-wide to its learners. |
| Founder (owner) | Site statistics dashboard, approves teacher/school requests, sends invitations, and sets feature access for the whole site. |

### Core workflows
1. A visitor lands on `#/start` (Deutschklinik home) and can search the dictionary or play games.
2. Sign-up uses a role-aware form (learner / teacher / school details + optional logo). The data goes into Supabase `user_metadata`, and a DB trigger builds the profile.
3. A learner enrolls in a level. An independent learner does it in one click; a school learner needs the teacher to unlock the level.
4. The learner works through Wortschatz topics (vocabulary) and Grammatik chapters (grammar). Results are saved to `grammar_results`.
5. A teacher or school creates classes and invite links (`?join=CODE`), unlocks levels, sets assignments and sees results.
6. The founder approves requests (which creates the org/home page from the sign-up details), invites people (`?invite=CODE`) and changes feature access in Settings.

---

## 2. Tech stack and architecture

**[confirmed]**
- **Frontend:** static site, no build step, plain JS (no framework). Lucide icons are loaded from unpkg (`lucide@0.454.0`). It is hosted on GitHub Pages.
- **Backend:** Supabase (Postgres, Auth, Storage, PostgREST). It is called directly from the browser with the public publishable key. Row-level security (RLS) and `security definer` RPC functions protect the data.
- **Cloudflare Worker** (`woerterbuch-bilder.edwin1kitaka.workers.dev`, source in `/Users/edwin/Downloads/Worte/bild-worker`, **outside this repo**) handles:
  - AI word pictures (`/pic`, KV-cached, Workers AI)
  - AI dictionary entries (`/entries`, `/entry`, D1 database)
  - photo search (`/photos`)
  - the welcome e-mail (`/welcome`, sent through Gmail SMTP with worker secrets)
- **Content pipeline** (Python, **outside this repo**, at `/Users/edwin/Downloads/Worte/vokabel`) builds the Wortschatz topic files from Wiktionary (via kaikki.org), Tatoeba example sentences and hand-written templates.

### How the pieces connect
```
index.html  (dictionary app, router, account/auth code, Spiele/games, promo popup)
  ├─ core.bin / defs.bin        packed dictionary data (loaded in two parts)
  ├─ sw.js                      service worker (offline cache: data + pictures; page network-first)
  ├─ grammatik/grammatik.js     grammar + vocabulary engine (GRAM), loaded on demand
  │    └─ grammatik/k<N>.js     one file per chapter/topic (GRAM.add({...}))
  ├─ konto.js                   accounts layer (KONTO): roles, levels, dashboards, settings, invites, gating
  └─ Supabase (REST + Auth + Storage)   ← accounts_setup.sql + supabase_setup.sql define the schema
Cloudflare Worker  ← pictures, AI entries, welcome e-mail
```

### Globals used between files
**[confirmed]**
- `window.ACCT` (index.html): `user()`, `token()`, `api(path, opts)`, `sheet(mode)`, `submit`, `signOut`, `upload(bucket, path, blob)`. It fires the events `acct:in` and `acct:out`.
- `window.GRAM` (grammatik.js): `view`, `list` (chapters for games; filtered by level), `chapters()` (all ready chapters with level), `results()`, `allowed`, `chLevel`, `setPass`, `refresh`, `kit` (drawing kit + exercise helpers), `_test.check([n…])`.
- `window.KONTO` (konto.js): `can(feature)`, `gate(feature)`, `featureOf(route)`, `canOpen(level)`, `lvState`, `level()`, `lang()`, `view(route,arg)`, and the sign-up hooks `signupFields`, `signupCheck`, `signupData`, plus many UI actions.
- The router in `index.html` (`route()`) asks `KONTO.can(featureOf(p))` before rendering. If the answer is no, it shows `KONTO.gate(f)`. KONTO handles the routes `start`, `kurs`, `settings`, `schule`, `klasse`, `admin`, `aufgaben`.

---

## 3. Important files

| File | Purpose |
|---|---|
| `index.html` (~2.8k lines) | The whole dictionary app, the router, the Supabase auth/account sheet (`ACCT`), the promo popup and the Spiele (games). The account section starts at the comment `Konten (Supabase)`. |
| `konto.js` (~1k long lines) | Accounts layer. It contains: the language rule, feature gating, level enrollment, the sign-up form, invitations, the learner/teacher/founder dashboards, the course page, the school home page, settings, the bar charts, and its injected CSS. |
| `grammatik/grammatik.js` | Grammar/vocabulary engine. `GROUPS` = table of contents with a level per chapter. `READY` = chapters that exist. Also: level gating (`allowed`, which delegates to `KONTO.canOpen`), locked group rows, exercise renderer, results sync, self-test. |
| `grammatik/k1.js … k104.js` | Grammar chapters (A1–B1) and verb lists. |
| `grammatik/k201–216, k221–233, k241–250, k261–273` | Wortschatz topics: A1 (16), A2 (13), B1 (10), C1 (13). **B2 is empty.** These files are generated; don't hand-edit them (see the pipeline). |
| `accounts_setup.sql` | Full, re-runnable schema for accounts: tables, RLS, helper functions, RPCs, triggers, storage bucket, site settings. It is run by hand in the Supabase SQL editor. |
| `supabase_setup.sql` | The older base schema: `user_data` (lists/decks) and `grammar_results`. |
| `sw.js` | Service worker. |
| `core.bin`, `defs.bin` | Packed dictionary data. `data.bin` also exists **[assumption: legacy/unused, not verified]**. |

Outside the repo (not version-controlled here):
- `/Users/edwin/Downloads/Worte/vokabel/`: the pipeline.
  - Scripts: `auto.py` (fetch Wiktionary, auto-pick examples, review sheet), `setpicks.py` (apply hand fixes), `build_topic.py` (write `grammatik/k<N>.js`), `grep_pairs.py` (search Tatoeba).
  - Per topic: `kNNN.tpl.js` templates and `<lvl>_<N>_words.txt`, `_picks.txt`, `_curated.json`, `.entries.json`.
  - Raw Tatoeba data is in `vokabel-daten/raw`.
- `/Users/edwin/Downloads/Worte/bild-worker/`: the Cloudflare Worker (`src/index.js`, `src/welcome.js`, `wrangler.toml`).
- `/Users/edwin/Downloads/Worte/pipeline/`: the dictionary build pipeline **[assumption: produces core/defs.bin]**.

---

## 4. Setup, run, build, test

**[confirmed]**
- **Run locally:** `python3 -m http.server 8765 --bind 127.0.0.1 --directory /Users/edwin/woerterbuch`, then open http://localhost:8765. There is no build step. The local site uses the **real** Supabase project.
- **Deploy the site:** `git push` to `main`. GitHub Pages updates in about 1 minute, and pages are cached for up to 10 minutes (`cache-control: max-age=600`).
  - Bump the `?v=` query strings in `index.html` (`konto.js?v=`, `grammatik.js?v=`) whenever those files change.
  - `VER` in grammatik.js versions the chapter files.
- **Database:** paste `accounts_setup.sql` into Supabase → SQL Editor → Run. It is idempotent and safe to re-run. The founder rows are at the end of the file as comments.
- **Worker:** `cd /Users/edwin/Downloads/Worte/bild-worker && npx wrangler deploy`. Always ask the owner before deploying.
- **Build a Wortschatz topic:** run these in `vokabel/`:
  1. `python3 auto.py c1_261`
  2. review `c1_261.review.txt`
  3. `python3 setpicks.py c1_261 spec.json`
  4. `python3 build_topic.py c1_261` (writes `grammatik/k261.js`)
- **Content self-test (browser console):** `await GRAM._test.check([261,262,263])`.
  - Run in chunks of about 3; a JS call longer than 45 s times out in the tool.
  - It answers every exercise with its key and checks the word-list rows.
- **SQL test (local):** Postgres 16 via the pip package `pgserver` (installed in a scratch venv under Python 3.10).
  - It used a Supabase-like stub: `auth.users`, `auth.uid()` from `request.jwt.claim.sub`, the roles `anon`/`authenticated`, and `storage.buckets`/`objects`.
  - These test scripts lived in a temp folder and are **not** in the repo.
- **Account UI test:** an in-browser mock of PostgREST/RPCs that replaced `ACCT.api`/`user`. It was temporary and has been deleted.

No automated test suite exists in the repo.

---

## 5. Major design decisions (and why)

**[confirmed]** unless marked otherwise.

1. **Static site + Supabase from the browser.** There is no server to run, and security comes from RLS and `security definer` RPCs. All writes that cross users (unlocking levels, joining, approving, stats) go through RPCs that check permissions.
2. **The profile is created by a DB trigger** (`handle_new_user` on `auth.users`), built from `raw_user_meta_data`. The reason: with e-mail confirmation on, the user may confirm on another device, so localStorage can't be trusted. Invite codes (`join` for schools, `invite` for founder invites) travel in the metadata and are redeemed in the trigger.
   - Each step sits in its own exception block, so a failure never blocks sign-up.
   - Teacher/school details go to `profiles.request_info`. When approved (`decide_request`) or invited, `_make_org` builds the org/home page from them.
3. **Enrollment:** `profiles.unlocked text[]` lists the enrolled levels. **A learner opens exactly these levels** (changed last; lower levels are no longer open automatically). `profiles.level` is the "current course" or the requested level.
   - School learners cannot *add* to `unlocked` (trigger `lock_level`), but they can remove levels (unenroll).
   - Staff and the founder see all levels.
4. **Feature gating** uses `site_settings.features` (one row, readable by anon, writable by the founder). Each feature has one of the modes `everyone | account | enrolled | off`.
   - The defaults are: dict and games `everyone`; lists, cards, vocab and grammar `enrolled`. The owner asked for this: only enrolled learners see content beyond the dictionary, but games are open.
5. **Language:** menus and account pages default to **English**. The course content (topics, exercises) is always German, and users can switch the menus to German in Settings. The owner asked for this, especially for people arriving through invite links.
6. **Landing:** on first load with an empty hash, everyone is sent to `#/start`. Visitors see the Deutschklinik home; signed-in users see their dashboard (learner / staff / founder). `#/` is still the dictionary search.
7. **Branding:** an org's `theme` overrides the CSS `--ac` site-wide for its members. The logo goes in the header (`#orgbrand`) and on dashboard banners. Logos are uploaded to the public Storage bucket `logos/<uid>/…`; uploads are allowed only into one's own folder.
8. **Wortschatz content:** the words are the author's own selection, following the *structure* (chapter themes) of Klett "Wortschatz" books, with original content. Examples come from Tatoeba, and translations and forms from Wiktionary (licences are noted in each file header).
   - The owner's rule: **never write our own definitions into dictionary entries**.
9. **Pass mark:** the assignment's pass mark wins, then the class's, then the org's, then 70 %. Only results at the learner's level (plus assignments) count toward the grade.

---

## 6. Status

### Completed and pushed
**[confirmed: `main` = `898b89a`, live site serves `konto.js?v=7`]**
- Grammar chapters 1–85 plus verb lists, and Wortschatz A1, A2, B1 and C1 (52 topics).
  - All 13 C1 topics passed `GRAM._test.check`, and their examples were reviewed and fixed by hand.
- Accounts: roles, approvals, orgs/classes/invites/assignments, pass marks.
- Dashboards: learner, teacher/school (learners grouped by level, unlock queue), founder (stats with charts, approvals, invitations, orgs list).
- Course page per level, school/teacher public home page (`#/schule/<id>`), Settings page, founder invitations, feature-access settings, the Deutschklinik visitor home page.
- Enroll-only access to levels, plus unenroll.
- The worker's welcome e-mail was rewritten in English as Deutschklinik and **deployed** (version `a776ad40…`).

### Unfinished / owner to-do
- **[confirmed]** Wortschatz **B2** has no topics yet; it shows as "coming soon".
- **[unknown]** Whether the owner has run the latest `accounts_setup.sql` and the founder lines in Supabase. They copied it to the clipboard twice, and no error was reported.
- **[confirmed, not done]** Supabase **custom SMTP** and **"Confirm email"** still need to be set up by the owner. The built-in mailer only delivers to team members. The recommended options:
  - now: Gmail SMTP with an app password
  - later: Resend with the domain `deutschklinik.com`
- **[confirmed]** The domain `deutschklinik.com` looked unregistered (Verisign RDAP returned 404); `deutschklinik.de` is taken. The recommendation is Cloudflare Registrar, Zoho Mail Lite for mailboxes and Resend for transactional mail. Nothing has been bought.
- The Supabase "Site URL / Redirect URLs" need to change when the domain moves.

### Known bugs / open reports
- **[open]** The owner reports that on a **laptop** a learner still sees lower levels, while it works on the phone.
  - **[assumption]** Either the laptop runs the cached old page (GitHub max-age 600 s), or the laptop is signed in as founder/staff, who see all levels by design. The owner was asked to hard-reload and check the role. This is not yet confirmed.
- **[confirmed]** Feature gating and level locks are **client-side UI only**. Chapter files (`grammatik/k*.js`) are public static files, so anyone can fetch them. Only Supabase data is protected server-side.
- **[confirmed]** The dictionary's "add to list" action is not gated, even when the `lists` feature is locked.
- **[confirmed]** The `/welcome` worker only mails accounts younger than 15 minutes. With e-mail confirmation on, a user who confirms later gets no welcome e-mail.
- **[confirmed]** Assignment items with `ex: null` (a whole chapter) count as done when **any** exercise of that chapter is passed. This is a weak definition.
- **[confirmed]** Between about 641 and 1100 px wide, the 8-tab nav scrolls horizontally. On org accounts the header shows only the logo below 1360 px.
- **[confirmed]** The dictionary pages, lists, decks and games UI are still German. Only the nav, account pages, dashboards, sign-up, promo and lock pages follow the English/German setting.
- **[confirmed]** `invite_preview` (callable by anon) returns the invitee's name and e-mail for a valid site-invite code (12 hex characters). This is intended for pre-filling the form, but it is a privacy trade-off.
- **[assumption]** The `handle_new_user` trigger and the logo uploads to Storage have never been exercised against the real Supabase. They were tested only on the local Postgres stub (trigger) and the in-browser mock (upload).

---

## 7. Context from the conversation (not in the code)

- **Hard rules from the owner:**
  - Ask before `git push` and before deploying the worker. The owner usually pushes themselves.
  - Never create real or test accounts on the live site.
  - Never use the Supabase DB password the owner once posted.
  - Keys and secrets live only as Cloudflare worker secrets, never in the public site.
  - No interactive git.
  - Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
  - Don't add our own definitions to dictionary entries.
- The founder account e-mail is the owner's Gmail (it is used in the founder SQL lines at the end of `accounts_setup.sql`).
- **Level gating history:** at first, "level X = X and all lower levels open". The owner then changed it to "**only enrolled levels**, open until unenrolled; the dictionary always open".
- **The owner's requests for organisations:**
  - Orgs give details and an optional logo at sign-up, and those details build the org's home page. Teachers give details but no logo.
  - Orgs and teachers are not asked for a level.
  - Students of a school should feel the site is their school's.
- **Dashboards** were requested for every role, "inspired by edu platforms". The owner dashboard shows sign-ups and activity.
- The C1 source was a phone-photo PDF of Klett "Wortschatz C1" (13 chapters × 2 sub-units). Only its table of contents and structure were used.

---

## 8. Branch, recent changes, uncommitted work

**[confirmed at time of writing]**
- Repo `/Users/edwin/woerterbuch`, branch **`main`**, in sync with `origin/main` at **`898b89a`**.
  - Only this `HANDOFF.md` is new and uncommitted.
- Recent commits:
  - `898b89a` Open only the levels a learner is enrolled in; allow unenrolling
  - `a48b617` Add C1 vocabulary, Deutschklinik home page, dashboards and feature access
  - `54f3994` Add Wortschatz A1–B1 (39 topics) and roles, levels, classes for accounts
- **Outside the repo:**
  - `bild-worker/src/welcome.js` was changed and **deployed**, but it is not committed anywhere. That folder sits inside a parent git repo at `/Users/edwin/Downloads` with many unrelated untracked files.
  - The `vokabel/` pipeline files (C1 word lists, picks, templates) are likewise not committed.

---

## 9. Areas that most need review

1. **`accounts_setup.sql` security:**
   - every `security definer` function (checks on `auth.uid()`, `search_path`, grants/revokes)
   - `handle_new_user` (it trusts user metadata; role escalation should only be possible with a valid invite code)
   - the `lock_level` trigger logic (add vs. remove)
   - `invite_preview` / `org_page` exposure to anon
   - the storage policies
2. **Running the SQL on real Supabase:**
   - creating a trigger on `auth.users` from the SQL editor
   - the `storage.buckets` insert
   - `drop function pending_requests()` (its return type changed)
3. **`konto.js` correctness:**
   - `can()` / `gateCheck()` re-routing while the profile is loading (possible flashes or loops)
   - `handleInvite` double-redeeming an invite (an invite's `uses_left` may drop twice if the trigger already redeemed it and the client calls the RPC again)
   - the `unlockedSet()` fallback `_noUnl`
4. **Client-only gating** (see the known bugs). Decide whether the course content needs real protection.
5. **The laptop vs phone report** in section 6.
6. **Accessibility and mobile:**
   - dashboard tables
   - chart tooltips (hover only; there is a "Show numbers" table fallback)
   - nav width on tablets
7. **Content quality of C1 topics:**
   - exercises are hand-written German; a native-speaker review is advisable
   - the auto-chosen English translations of Tatoeba sentences
