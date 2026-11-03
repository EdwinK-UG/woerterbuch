-- No recipient addresses, names, message bodies or credentials are kept here.
CREATE TABLE IF NOT EXISTS invitation_mail (
  id TEXT PRIMARY KEY,
  sender TEXT NOT NULL,
  day TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('sending','sent','failed')),
  updated_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  last_error TEXT
);
CREATE INDEX IF NOT EXISTS invitation_mail_sender_day ON invitation_mail(sender,day);
