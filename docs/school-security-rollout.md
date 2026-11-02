# School and invitation security upgrade (2026-11-02)

Use PostgreSQL 15 or later. For a fresh staging database, run `supabase_setup.sql` first, then `accounts_setup.sql`. Existing installations matching baseline `898b89a` can run `supabase/migrations/20261102_school_security.sql` as one transaction. The two paths install the same school authorization rules. No production service is contacted by the test runner.

**Before applying:** compare the installed schema with the baseline, take a restorable backup, and run the SQL below with a database administrator in staging. Each count should be zero. A nonzero count also makes the migration stop. Identify the intended class with the school before correcting a membership; revoke or replace unintended invites. Do not guess the correct organization or publish invite codes.

```sql
select count(*) as wrong_school_members
from public.org_members m join public.classes c on c.id=m.class_id where c.org_id<>m.org_id;
select count(*) as wrong_school_invites
from public.invites i join public.classes c on c.id=i.class_id where c.org_id<>i.org_id;
```

The migration preserves class deletion behavior: deleting a class leaves its students in the school without a class and removes links to that class. It leaves historical memberships in place, but a learner's active school controls access to their profile, attempts and level. Transferring to a new school removes the former school's access to those records and hides the old assignments from the learner. Explicit teacher memberships can still span schools. A current teacher can still read the learner's earlier practice history: attempts have no historical school ID. Decide retention and history-sharing policy separately before using this for formal assessment.

New receipts make repeated redemptions of one link by one account consume only one use, including signup/confirmation retries. An old link can't restore a member removed after its recorded redemption. Joining a new class or rejoining after removal requires a fresh invitation. There is no reliable list of accounts that previously used a legacy link, so the migration doesn't invent receipts or refund counts. Revoke and replace outstanding privileged or widely shared legacy invitations before expansion.

An address on a founder invitation now binds it to the matching confirmed Auth account. Anonymous previews return the purpose/role/level but no invitee name or address. A matching confirmation can happen on a different device. Turn on real e-mail confirmation and verify delivery in staging: an Auth installation that auto-confirms addresses does not prove mailbox ownership. Invitations with no address remain bearer links by design. Organization/class invites likewise remain bearer links. The migration cannot retroactively revoke already issued teacher or school roles; review known privileged accounts before rollout.

Run `tests/school-security.sh` with `initdb`, `pg_ctl` and `psql` from PostgreSQL 15+ on PATH, using a local non-root account. The runner creates an empty temporary cluster with a private Unix socket and no TCP listener, installs a minimal Auth stub, applies the schemas, and exercises both positive and negative permission cases. Run sign-up, link confirmation, transfers, ordinary dashboard reads and API schema-cache refresh against provisioned staging before production rollout. If the migration stops, its transaction rolls back; if a completed deployment needs reversal, do not automatically restore the insecure policies.
