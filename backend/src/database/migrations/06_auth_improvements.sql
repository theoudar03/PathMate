-- Migration 06: Auth Improvements
-- Adds missing columns to the users table to support the new secure auth onboarding flow

ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS hosteller BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- Copy existing data from old columns to maintain backward compatibility
UPDATE users SET full_name = name WHERE full_name IS NULL AND name IS NOT NULL;
UPDATE users SET preferred_language = language_pref WHERE preferred_language IS NULL AND language_pref IS NOT NULL;
UPDATE users SET hosteller = (stay_type = 'hostel') WHERE stay_type IS NOT NULL;
