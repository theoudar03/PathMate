-- Migration 15: Real Student Modules (Senior Connect & Safe Roommate Finder)

CREATE TABLE IF NOT EXISTS seniors (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50),
    name VARCHAR(150) NOT NULL,
    department VARCHAR(100),
    year VARCHAR(50) DEFAULT 'Final Year',
    languages JSONB DEFAULT '["English", "Tamil"]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    domains JSONB DEFAULT '[]'::jsonb,
    interests JSONB DEFAULT '[]'::jsonb,
    linkedin_url TEXT,
    email VARCHAR(150),
    phone VARCHAR(50),
    availability VARCHAR(100) DEFAULT 'Weekdays & Evenings',
    is_available BOOLEAN DEFAULT true,
    mentor_status VARCHAR(50) DEFAULT 'active',
    profile_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure all required columns & sequence exist in seniors if created in previous migration
CREATE SEQUENCE IF NOT EXISTS seniors_id_seq;
ALTER TABLE seniors ALTER COLUMN id SET DEFAULT nextval('seniors_id_seq');
ALTER TABLE seniors ADD COLUMN IF NOT EXISTS student_id VARCHAR(50);
ALTER TABLE seniors ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE seniors ADD COLUMN IF NOT EXISTS year VARCHAR(50) DEFAULT 'Final Year';
ALTER TABLE seniors ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE seniors ADD COLUMN IF NOT EXISTS domains JSONB DEFAULT '[]'::jsonb;
ALTER TABLE seniors ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE seniors ADD COLUMN IF NOT EXISTS mentor_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE seniors ADD COLUMN IF NOT EXISTS profile_photo TEXT;

CREATE TABLE IF NOT EXISTS roommates (
    id SERIAL PRIMARY KEY,
    user_id INT,
    student_id VARCHAR(50),
    name VARCHAR(150) NOT NULL,
    gender VARCHAR(20) DEFAULT 'Male',
    department VARCHAR(100),
    year VARCHAR(50) DEFAULT '1st Year',
    hostel_block VARCHAR(100),
    preferred_language VARCHAR(50) DEFAULT 'English',
    sleep_schedule VARCHAR(50) DEFAULT '10 PM - 6 AM',
    study_habits VARCHAR(50) DEFAULT 'Quiet Study',
    cleanliness VARCHAR(50) DEFAULT 'Very Neat',
    smoking_preference VARCHAR(50) DEFAULT 'Non-Smoker',
    food_preference VARCHAR(50) DEFAULT 'Vegetarian',
    interests JSONB DEFAULT '[]'::jsonb,
    hobbies JSONB DEFAULT '[]'::jsonb,
    room_preference VARCHAR(100) DEFAULT '2 Sharing (Non-AC)',
    profile_photo TEXT,
    is_visible BOOLEAN DEFAULT true,
    contact_email VARCHAR(150),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure sequence & columns exist for roommates
CREATE SEQUENCE IF NOT EXISTS roommates_id_seq;
ALTER TABLE roommates ALTER COLUMN id SET DEFAULT nextval('roommates_id_seq');
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS user_id INT;
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS student_id VARCHAR(50);
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'Male';
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS year VARCHAR(50) DEFAULT '1st Year';
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS hostel_block VARCHAR(100);
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(50);
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS sleep_schedule VARCHAR(50);
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS study_habits VARCHAR(50);
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS cleanliness VARCHAR(50);
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS smoking_preference VARCHAR(50);
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS food_preference VARCHAR(50);
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]'::jsonb;
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS hobbies JSONB DEFAULT '[]'::jsonb;
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS room_preference VARCHAR(100);
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS contact_email VARCHAR(150);
ALTER TABLE roommates ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Indexes for fast searching and filtering
CREATE INDEX IF NOT EXISTS idx_seniors_department ON seniors(department);
CREATE INDEX IF NOT EXISTS idx_seniors_mentor_status ON seniors(mentor_status);
CREATE INDEX IF NOT EXISTS idx_roommates_hostel ON roommates(hostel_block);
CREATE INDEX IF NOT EXISTS idx_roommates_gender ON roommates(gender);


