-- Apply once after 0001. Store only a protocol stage/status, never SMTP replies or credentials.
ALTER TABLE welcome_jobs ADD COLUMN last_error TEXT;
