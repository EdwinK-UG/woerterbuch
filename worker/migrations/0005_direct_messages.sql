-- Delivery receipts only: no addresses, subject, body or SMTP credentials.
CREATE TABLE IF NOT EXISTS direct_messages (
 id TEXT PRIMARY KEY,
 sender TEXT NOT NULL,
 day TEXT NOT NULL,
 payload_hash TEXT NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('sending','sent','failed','unknown')),
 attempts INTEGER NOT NULL DEFAULT 1,
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS direct_messages_sender_day ON direct_messages(sender,day);
