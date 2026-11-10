# Email selected users and learners

The founder opens **Owner dashboard → Email users**. Teachers and school owners
open **Dashboard → Email learners**, or **Teaching terms → Email learners** for
a specific class. Choose recipients, write a subject/message, then review it
before pressing Send. Selection survives directory search and pagination.

Each recipient gets an individual email. Founder messages use
`support@deutschklinik.com`; class messages use `hello@deutschklinik.com` with the
school/teacher branding. Replies to class messages go directly to the sending
teacher's verified account email. Founder replies go to support.

The composer supports up to 50 selected people per draft. Delivery uses two
concurrent, single-recipient requests, with a durable limit of 100 attempts per
sender per UTC day. These limits protect the existing mailbox; they do not
promise any particular Zoho quota. There are no attachments or marketing lists.

## Access and delivery

- Global selection requires `is_founder()` from the database, not user metadata.
- Class selection requires a confirmed teacher/school account, current class
  management permission, and current school staff membership or ownership.
- Learners must still be students in that class and their active profile must
  belong to the same school. Both listing and sending recheck these boundaries.
- Teacher directory results contain names/IDs, without private email addresses.
  The founder can search the existing account email directory.
- Only the Worker can resolve delivery addresses, through the existing
  `WELCOME_HOOK_SECRET` and its matching Vault entry. No service-role key or new
  secret is needed. Browsers submit user IDs, never delivery addresses.
- SMTP acceptance is reported as sent; it does not prove inbox delivery.
- Receipts keep IDs, state and a content hash, without storing recipient
  addresses or the message body. Reusing a draft ID cannot send a successful
  recipient twice or change the sent text. Safe failures can retry up to three
  attempts. Uncertain SMTP acceptance is not automatically retried.
- Closing the composer stops dispatching additional recipients; requests already
  in flight may finish. Reopen the same draft to see results. Signing out stops
  further dispatch. No messages are sent merely by opening the composer.

## Release order

1. Apply `supabase/migrations/20261110165617_founder_teacher_messages.sql` to the
   existing project. It preserves the existing welcome callback schema grants.
2. Apply `worker/migrations/0005_direct_messages.sql` to the existing D1 database.
3. Deploy the Worker with the new `/messages/send` route and existing bindings
   and secrets. **Retain the `FILM_AUDIO` R2 binding and
   `FILM_AUDIO_SIGNING_KEY`.** Do not replace configuration with a stripped-down
   test config. Confirm `WELCOME_HOOK_SECRET`, SMTP and allowed origins remain.
4. Publish the website code and regenerated asset hashes. Do not deploy lessons,
   narration, audio or other private assets for this feature.
5. Verify founder and teacher recipient lists while signed in. A real test email
   needs Edwin to specify/approve the recipient and content; automated tests use
   local SMTP stubs only.

The existing verification gate for sending mail is retained. Immediate sign-in
for learning is unaffected. This feature does not change enrolment or lessons.

## Validation

Use Node 24 (`/opt/homebrew/bin/node` on Edwin's Mac). Run `npm run assets` with
`LESSON_SOURCE_DIR` pointing to the complete released sources when private
lessons are not restored under `.local/lessons`, then `npm run check`.

Focused checks: `tests/course-mail.test.cjs`,
`tests/course-mail-security.test.cjs`, and `worker/tests/messages.test.mjs`.
They exercise UI selection/preview/retry/logout, SQL boundaries and private
addresses, SMTP acceptance/failure, payload changes, concurrent duplicates,
daily limits, HTML/header injection and the allowed-origin guard.

Local visual preview (fictional recipients; no real email):
`/Users/edwin/Documents/Codex/2026-11-02/i-x20/outputs/Selected-Email-Preview`.
