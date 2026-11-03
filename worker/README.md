# Dictionary Worker source

This folder brings the previously separate Worker into version control. It contains example configuration. Provision staging resources and supply credentials through Cloudflare secrets before deployment.

## Verify locally

From this folder run `npm test` with Node 18 or later and Python 3. The tests use a disposable SQLite database and fake Auth, AI and mail services. They exercise simultaneous generation, quotas, review visibility, correction reports and late-confirmation mail retries. Hosted D1, Workers AI and SMTP delivery still need a staging check.

## Configure staging

1. Copy `wrangler.example.toml` to the ignored `wrangler.toml` and select separate staging D1 and KV resources.
2. Set the real staging origins, site URL and Supabase URL. Keep `GENERATION_ENABLED = "false"` initially.
3. Add secrets named `SUPABASE_PUBLISHABLE_KEY`, `SMTP_USER`, `SMTP_PASSWORD` and `WELCOME_HOOK_SECRET` through the platform's secret interface. Credentials stay outside tracked files. For the current Zoho Mail setup, use `hello@deutschklinik.com` as `SMTP_USER`, its app password as `SMTP_PASSWORD`, and the tracked `smtppro.zoho.com:465` transport settings. Private teacher notifications reuse `WELCOME_HOOK_SECRET`, matched against `deutschklinik_welcome_hook` in Supabase Vault. Apply the `teacher_mail_context` migration; no service-role key is needed. Set `SUPPORT_EMAIL=support@deutschklinik.com` as a Worker variable if that address changes.
4. Apply `migrations/0001_review_and_operations.sql` to staging D1. Existing AI entries become drafts awaiting review. Keep a restorable D1 export before upgrading an existing database.
   Apply `migrations/0002_mail_diagnostics.sql` once afterward. The added `last_error` field records only a protocol stage and status category, without SMTP replies or credentials.
5. Set explicit global and per-user daily job limits. Enable generation after checking the Auth endpoint and quotas. Each reservation counts even if an upstream request fails. A job can make multiple AI calls, so job limits need to fit the provider allowance.
6. Test the five-minute scheduled mail handler. Set `WELCOME_FROM` to an explicit UTC rollout instant so existing users do not unexpectedly receive a new welcome campaign.
7. Optionally configure an Auth users INSERT/UPDATE database webhook to `/hooks/welcome`, with `Authorization: Bearer <WELCOME_HOOK_SECRET>`. The receiver checks that the event concerns confirmation. Browser sign-in also queues eligible accounts.

Confirmations and password resets still use Supabase's own mail configuration. The separate welcome queue does not replace it.

## Endpoint behavior

- Public cached pictures and approved entries remain readable.
- `GET /english?source=<sha256>&batch=N` reads cached English translations. `POST` fills a missing group of at most ten meanings/examples. Source text must match a generated fingerprint of the published dictionary, or an existing editorial publication; arbitrary prompts are rejected. Each new group uses the **existing** global/per-visitor generation limits (a daily hashed IP identifier, with no raw IP saved). Cached and curated translations need no AI call. This is progressive coverage, not a claim that all 37,739 entries have been pretranslated. Run `node tools/build-dictionary-fingerprints.cjs` from the repository root after dictionary edits; `npm run check` verifies source and curated-data consistency. Curated overrides live in `content/dictionary-english-reviewed.json`. Other output is machine translated, labelled in the UI and cached in KV under `english-v1|<source hash>|<group>`.
- New pictures and entry suggestions require a confirmed Supabase account.
- Picture generation reserves an atomic D1 budget and lease before calling AI. Visitors cannot change the shared latest-picture pointer. A returned `X-Seed` identifies the generated picture for that account's preferences.
- Suggestions return HTTP 202 and stay in `entry_drafts`. The site displays a review message.
- Authenticated correction reports accept one of `meaning`, `example`, `attribution` or `form`. The reports contain a category and a daily hashed actor identifier.
- Welcome jobs use a unique account ID, a claim lease, bounded retries and a stable mail Message-ID. A process failure after SMTP delivery can still cause a repeated delivery. Inspect failed jobs before retrying them.

## Review and publish

Inspect pending draft content and its sentence attribution with authorized D1 tooling. After checking a particular lemma, use a parameterized statement equivalent to the following inside an administrator-controlled transaction.

```sql
INSERT INTO entry_publications(lemma,queries,data,reviewed_at)
SELECT lemma,queries,data,datetime('now') FROM entry_drafts
WHERE lemma = ?1 AND state = 'pending'
ON CONFLICT(lemma) DO UPDATE SET
  queries=excluded.queries,data=excluded.data,reviewed_at=excluded.reviewed_at;
```

Set a rejected draft's state to `rejected`. Existing source-dictionary definitions stay in the site's dictionary files. Shared AI pictures require an explicit editorial publishing process before changing a latest pointer.

## Operations and recovery

Inspect counts in `generation_jobs`, pending/failed `welcome_jobs`, `entry_drafts` and `entry_flags`. These tables provide operational state without storing submitted exercise writing or browser session tokens. The scheduled task removes old generation reservations and clears failed-mail recipients after seven days.

For a failed welcome job, inspect `last_error` with its attempt count. `smtp_535_login_message` indicates rejected SMTP credentials. Transport categories identify the connection stage without storing the remote reply. Correct the service configuration, then reset `next_try` for the selected job to retry; keep the same job ID for deduplication.

The example disables image transformations until they are provisioned. Export D1 and inventory KV before a release. Test restoring them to separate resources. Roll back the Worker code through Cloudflare and retain the additive tables for diagnosis.

Cron invokes a scheduled Worker handler. Database webhooks can deliver row change events with configured headers. [Cloudflare Cron documentation](https://developers.cloudflare.com/workers/configuration/cron-triggers/), [Supabase webhook documentation](https://supabase.com/docs/guides/database/webhooks)
