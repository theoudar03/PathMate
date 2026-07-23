-- Migration 20: Add Gender Column to Users, Seniors, Roommates, and Official Students

-- 1. Add gender to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'Male';

-- 2. Add gender to seniors table
ALTER TABLE seniors ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'Male';

-- 3. Add gender to roommates table
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'Male';
CREATE INDEX IF NOT EXISTS idx_roommates_gender ON roommates(gender);

-- 4. Add gender to official_students table
ALTER TABLE official_students ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'Male';

-- 5. Update genders for known female records based on names
UPDATE official_students SET gender = 'Female' WHERE name ILIKE '%Harini%' OR name ILIKE '%Divya%' OR name ILIKE '%Fathima%' OR name ILIKE '%Bavanya%' OR name ILIKE '%Ramesh%';
UPDATE users SET gender = 'Female' WHERE full_name ILIKE '%Harini%' OR full_name ILIKE '%Divya%' OR full_name ILIKE '%Fathima%' OR full_name ILIKE '%Bavanya%' OR name ILIKE '%Harini%' OR name ILIKE '%Divya%' OR name ILIKE '%Fathima%' OR name ILIKE '%Bavanya%';
UPDATE roommates SET gender = 'Female' WHERE name ILIKE '%Harini%' OR name ILIKE '%Divya%' OR name ILIKE '%Fathima%' OR name ILIKE '%Bavanya%';
UPDATE seniors SET gender = 'Female' WHERE name ILIKE '%Harini%' OR name ILIKE '%Divya%' OR name ILIKE '%Fathima%' OR name ILIKE '%Bavanya%';
