-- Migration 16: Production Auth & Security Infrastructure

-- 1. Official Students Verification Registry
CREATE TABLE IF NOT EXISTS official_students (
    id SERIAL PRIMARY KEY,
    register_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    year VARCHAR(20) DEFAULT '1st Year',
    is_registered BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial official student roster for Saranathan College of Engineering
INSERT INTO official_students (register_number, full_name, email, department, year)
VALUES
  ('SCE2025CSE001', 'Aravind Swaminathan', 'aravind.s@saranathan.ac.in', 'Computer Science & Engineering', '1st Year'),
  ('SCE2025CSE002', 'Bavanya Ramesh', 'bavanya.r@saranathan.ac.in', 'Computer Science & Engineering', '1st Year'),
  ('SCE2025ECE015', 'Chandran Venkatesh', 'chandran.v@saranathan.ac.in', 'Electronics & Communication', '1st Year'),
  ('SCE2025AIDS010', 'Divya Murali', 'divya.m@saranathan.ac.in', 'AI & Data Science', '1st Year'),
  ('SCE2025IT005', 'Elango Natarajan', 'elango.n@saranathan.ac.in', 'Information Technology', '1st Year'),
  ('SCE2025EEE012', 'Fathima Zohra', 'fathima.z@saranathan.ac.in', 'Electrical & Electronics', '1st Year'),
  ('SCE2025MECH008', 'Gowtham Raj', 'gowtham.r@saranathan.ac.in', 'Mechanical Engineering', '1st Year'),
  ('SCE2025CIVIL003', 'Harini Sekar', 'harini.s@saranathan.ac.in', 'Civil Engineering', '1st Year'),
  ('2025CSE101', 'Test Student One', 'student1@saranathan.ac.in', 'Computer Science & Engineering', '1st Year'),
  ('2025ECE102', 'Test Student Two', 'student2@saranathan.ac.in', 'Electronics & Communication', '1st Year')
ON CONFLICT (register_number) DO NOTHING;

-- 2. Enhance Users Table with Production Security & RBAC Columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS register_number TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now();

-- Synchronize roll_number to register_number if null
UPDATE users SET register_number = roll_number WHERE register_number IS NULL AND roll_number IS NOT NULL;

-- 3. Production Security Indexes for Fast Authentication & Verification
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_register_number ON users (register_number);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
CREATE INDEX IF NOT EXISTS idx_official_students_reg_num ON official_students (register_number);
