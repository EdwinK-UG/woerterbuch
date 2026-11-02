-- Run in an isolated D1 database first. Safe on both fresh and existing entry databases.
CREATE TABLE IF NOT EXISTS entries(lemma TEXT PRIMARY KEY COLLATE NOCASE,queries TEXT NOT NULL DEFAULT '',data TEXT NOT NULL,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS entry_drafts(lemma TEXT PRIMARY KEY COLLATE NOCASE,queries TEXT NOT NULL,data TEXT NOT NULL,created TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','rejected')));
CREATE TABLE IF NOT EXISTS entry_publications(lemma TEXT PRIMARY KEY COLLATE NOCASE,queries TEXT NOT NULL,data TEXT NOT NULL,reviewed_at TEXT NOT NULL);
INSERT INTO entry_drafts(lemma,queries,data,created) SELECT lemma,queries,data,created FROM entries WHERE 1 ON CONFLICT(lemma) DO NOTHING;
CREATE TABLE IF NOT EXISTS generation_jobs(id TEXT PRIMARY KEY,day TEXT NOT NULL,actor TEXT NOT NULL,lease_key TEXT UNIQUE,lease_until INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS generation_day_actor ON generation_jobs(day,actor);
CREATE TABLE IF NOT EXISTS welcome_jobs(user_id TEXT PRIMARY KEY,email TEXT,state TEXT NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','sent','failed')),attempts INTEGER NOT NULL DEFAULT 0,next_try INTEGER NOT NULL,claim TEXT);
CREATE INDEX IF NOT EXISTS welcome_due ON welcome_jobs(state,next_try);
CREATE TABLE IF NOT EXISTS entry_flags(lemma TEXT NOT NULL COLLATE NOCASE,day TEXT NOT NULL,actor TEXT NOT NULL,reason TEXT NOT NULL,PRIMARY KEY(lemma,day,actor,reason));
CREATE INDEX IF NOT EXISTS entry_flags_actor ON entry_flags(day,actor);
