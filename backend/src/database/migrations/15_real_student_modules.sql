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

-- Seed initial real SCE senior mentor roster if table is empty
INSERT INTO seniors (student_id, name, department, year, languages, skills, domains, interests, linkedin_url, email, phone, availability, mentor_status)
SELECT 'SCE2022CSE045', 'Karthik Subramanian', 'Computer Science & Engineering', 'Final Year', '["English", "Tamil"]'::jsonb, '["Python", "React", "Node.js", "System Design"]'::jsonb, '["Full Stack Development", "Competitive Programming"]'::jsonb, '["Open Source", "Hackathons"]'::jsonb, 'https://linkedin.com/in/karthik-sce', 'karthik.s@saranathan.ac.in', '+91 98765 43210', 'Mon-Fri after 5 PM', 'active'
WHERE NOT EXISTS (SELECT 1 FROM seniors WHERE student_id = 'SCE2022CSE045');

INSERT INTO seniors (student_id, name, department, year, languages, skills, domains, interests, linkedin_url, email, phone, availability, mentor_status)
SELECT 'SCE2022ECE012', 'Priya Sundaram', 'Electronics & Communication', 'Final Year', '["English", "Tamil", "Hindi"]'::jsonb, '["Embedded Systems", "MATLAB", "Arduino", "IoT"]'::jsonb, '["Robotics", "Signal Processing"]'::jsonb, '["IEEE Society", "Circuit Design"]'::jsonb, 'https://linkedin.com/in/priya-sundaram-sce', 'priya.s@saranathan.ac.in', '+91 98765 43211', 'Weekends 10 AM - 4 PM', 'active'
WHERE NOT EXISTS (SELECT 1 FROM seniors WHERE student_id = 'SCE2022ECE012');

INSERT INTO seniors (student_id, name, department, year, languages, skills, domains, interests, linkedin_url, email, phone, availability, mentor_status)
SELECT 'SCE2022IT088', 'Arun Kumar', 'Information Technology', 'Final Year', '["English", "Tamil"]'::jsonb, '["Cybersecurity", "Java", "Linux", "Docker"]'::jsonb, '["Cloud & Security", "Backend Dev"]'::jsonb, '["CTF Challenges", "DevOps"]'::jsonb, 'https://linkedin.com/in/arun-kumar-sce', 'arun.k@saranathan.ac.in', '+91 98765 43212', 'Wed & Sat Evenings', 'active'
WHERE NOT EXISTS (SELECT 1 FROM seniors WHERE student_id = 'SCE2022IT088');

INSERT INTO seniors (student_id, name, department, year, languages, skills, domains, interests, linkedin_url, email, phone, availability, mentor_status)
SELECT 'SCE2022EEE034', 'Deepak Raja', 'Electrical & Electronics', 'Final Year', '["English", "Tamil"]'::jsonb, '["PLC Programming", "Power Systems", "AutoCAD"]'::jsonb, '["Renewable Energy", "Industrial Automation"]'::jsonb, '["Solar Power Labs", "Project Guidance"]'::jsonb, 'https://linkedin.com/in/deepak-raja-sce', 'deepak.r@saranathan.ac.in', '+91 98765 43213', 'Weekdays 4 PM - 6 PM', 'active'
WHERE NOT EXISTS (SELECT 1 FROM seniors WHERE student_id = 'SCE2022EEE034');

-- Seed initial SCE roommate profiles if table is empty
INSERT INTO roommates (user_id, student_id, name, gender, department, year, hostel_block, preferred_language, sleep_schedule, study_habits, cleanliness, smoking_preference, food_preference, interests, hobbies, room_preference, is_visible, contact_email, phone)
SELECT 101, 'SCE2025CSE019', 'Rohan Ramachandran', 'Male', 'Computer Science & Engineering', '1st Year', 'Boys Hostel Block A', 'English / Tamil', '10 PM - 6 AM', 'Group Study & Late Night Coding', 'Very Neat', 'Non-Smoker', 'Vegetarian', '["AI & ML", "Gaming"]'::jsonb, '["Chess", "Badminton"]'::jsonb, '2 Sharing (Non-AC)', true, 'rohan.ram@saranathan.ac.in', '+91 94433 11223'
WHERE NOT EXISTS (SELECT 1 FROM roommates WHERE student_id = 'SCE2025CSE019');

INSERT INTO roommates (user_id, student_id, name, gender, department, year, hostel_block, preferred_language, sleep_schedule, study_habits, cleanliness, smoking_preference, food_preference, interests, hobbies, room_preference, is_visible, contact_email, phone)
SELECT 102, 'SCE2025ECE042', 'Sanjay Viswanathan', 'Male', 'Electronics & Communication', '1st Year', 'Boys Hostel Block B', 'English / Tamil', '11 PM - 7 AM', 'Quiet Library Reader', 'Moderate', 'Non-Smoker', 'Non-Vegetarian', '["Robotics", "IoT Devices"]'::jsonb, '["Guitar", "Photography"]'::jsonb, '2 Sharing (AC)', true, 'sanjay.v@saranathan.ac.in', '+91 94433 44556'
WHERE NOT EXISTS (SELECT 1 FROM roommates WHERE student_id = 'SCE2025ECE042');

INSERT INTO roommates (user_id, student_id, name, gender, department, year, hostel_block, preferred_language, sleep_schedule, study_habits, cleanliness, smoking_preference, food_preference, interests, hobbies, room_preference, is_visible, contact_email, phone)
SELECT 103, 'SCE2025AIDS008', 'Ananya Sridhar', 'Female', 'AI & Data Science', '1st Year', 'Girls Hostel Block A', 'English / Tamil', '10 PM - 6 AM', 'Early Morning Study', 'Very Neat', 'Non-Smoker', 'Vegetarian', '["Data Science", "Web Dev"]'::jsonb, '["Reading", "Painting"]'::jsonb, '2 Sharing (Non-AC)', true, 'ananya.s@saranathan.ac.in', '+91 94433 77889'
WHERE NOT EXISTS (SELECT 1 FROM roommates WHERE student_id = 'SCE2025AIDS008');
