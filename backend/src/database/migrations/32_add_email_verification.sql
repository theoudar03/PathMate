-- Migration 32: Add Email OTP Verification System Infrastructure

-- 1. Modify users table to support verification status
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Convert empty emails to NULL so they don't violate unique constraints
UPDATE users SET email = NULL WHERE TRIM(email) = '';

-- 3. Safely add unique constraint to users.email (ignoring duplicates by first cleaning if any exist)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT email, COUNT(*) as cnt 
        FROM users 
        WHERE email IS NOT NULL AND email <> ''
        GROUP BY email 
        HAVING COUNT(*) > 1
    ) LOOP
        -- Append unique suffix to duplicates so they don't violate constraint
        UPDATE users 
        SET email = email || '_dup_' || floor(random() * 1000000)::text 
        WHERE email = r.email;
    END LOOP;
END;
$$;

-- Add the unique constraint to users.email
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'users_email_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
END;
$$;

-- 4. Create OTP Verifications table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    hashed_otp VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempt_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON otp_verifications (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires ON otp_verifications (expires_at);

-- 5. Create OTP Audit Logs table
CREATE TABLE IF NOT EXISTS otp_audit_logs (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'OTP_SENT', 'OTP_VERIFIED', 'OTP_FAILED', 'OTP_RESEND_REQUESTED', 'ACCOUNT_CREATED'
    ip_address VARCHAR(45),
    user_agent TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_audit_logs_email ON otp_audit_logs (LOWER(email));
