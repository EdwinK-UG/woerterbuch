-- The grammar speaking trainer (worker/src/speak.js, docs/speak-trainer.md): Liv talks with a learner about one
-- grammar chapter. Only the founder and people who redeemed one of the founder's access codes may use it.
--   speak_codes   the founder's codes (LIV-XXXX-XXXX): who it is for, how many people may redeem it, revoked or not
--   speak_access  who redeemed which code (one row per account; revoking the code ends their access)
--   speak_usage   turns per account per day, for the daily limits; last_at keeps turns at least a moment apart
--   speak_tries   code attempts per account per day, so codes cannot be guessed
CREATE TABLE IF NOT EXISTS speak_codes(
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  max_uses INTEGER NOT NULL DEFAULT 1 CHECK(max_uses BETWEEN 1 AND 500),
  uses INTEGER NOT NULL DEFAULT 0,
  created TEXT NOT NULL,
  created_by TEXT NOT NULL,
  revoked TEXT
);
CREATE TABLE IF NOT EXISTS speak_access(
  user_id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  redeemed TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS speak_access_code ON speak_access(code);
CREATE TABLE IF NOT EXISTS speak_usage(
  day TEXT NOT NULL,
  user_id TEXT NOT NULL,
  turns INTEGER NOT NULL DEFAULT 0,
  last_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(day, user_id)
);
CREATE TABLE IF NOT EXISTS speak_tries(
  day TEXT NOT NULL,
  user_id TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(day, user_id)
);
