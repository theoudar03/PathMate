-- Migration 03: Add credential columns to the users table
-- These columns support the auto-generated login credentials feature added in the freshers portal.
-- username is generated from the first name + random 3-digit suffix.
-- password_hash stores the bcrypt hash (cost 12). The plaintext is never stored.
-- NOTE: Password reset/recovery is out of scope for this build. (Future Scope)

ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
