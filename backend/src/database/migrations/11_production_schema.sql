-- 11_production_schema.sql

-- 1. Purge all mock data from related tables
DELETE FROM user_registrations;
DELETE FROM club_interests;
DELETE FROM events;
DELETE FROM registration_process;
DELETE FROM clubs;

-- 2. Alter clubs table to match production requirements
ALTER TABLE clubs 
ADD COLUMN IF NOT EXISTS location_text TEXT,
ADD COLUMN IF NOT EXISTS eligibility TEXT,
ADD COLUMN IF NOT EXISTS requirements TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 3. Alter events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS location_text TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 4. Create Committees table (since user specified Task 6 separate from Clubs)
CREATE TABLE IF NOT EXISTS committees (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    faculty_id INTEGER REFERENCES faculty(id),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Volunteers table (Task 7)
CREATE TABLE IF NOT EXISTS volunteers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    role TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Seniors table (Task 8)
CREATE TABLE IF NOT EXISTS seniors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    year_of_study INTEGER,
    languages TEXT,
    interests TEXT,
    linkedin_url TEXT,
    email TEXT,
    availability TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Notices table (Task 9)
CREATE TABLE IF NOT EXISTS notices (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT,
    target_audience TEXT DEFAULT 'All', -- Could be 'All', 'Hostellers', 'CSE', etc.
    priority TEXT DEFAULT 'normal', -- normal, urgent
    is_pinned BOOLEAN DEFAULT false,
    expiry_date TIMESTAMP,
    attachment_url TEXT,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create Activity Logs (Task 13)
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    action_type TEXT NOT NULL, -- e.g., 'club_created', 'event_published'
    description TEXT NOT NULL,
    admin_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Insert the Real Production Clubs (Task 2)
INSERT INTO clubs (name, description, location_text, eligibility) VALUES 
('Coding Ninjas', 'Learn coding and problem solving', 'RV Block', '• Must be a current Saranathan College student\n• Basic programming knowledge in C/C++/Java/Python\n• Interest in coding and problem solving\n• Aptitude and logical reasoning\n• Screening test\n• Interview for core team\n• Programming fundamentals\n• DSA basics\n• Arrays\n• Strings\n• Loops\n• Functions'),

('IEEE', 'Institute of Electrical and Electronics Engineers', 'RV Block', 'Must be enrolled in at least 50% of a full-time UG/PG programme in\n\n• Electronics\n• Electrical\n• Computer Science\n• IT\n• AI\n• Mechanical\n\nECE students are fully eligible.'),

('IETE', 'Institution of Electronics and Telecommunication Engineers', 'KS Block', 'Recognized Diploma\n\nB.E.\n\nB.Tech.\n\nM.E.\n\nM.Tech.\n\nElectronics\n\nCommunication\n\nElectrical\n\nComputer Science\n\nIT\n\nRelated fields'),

('IEI', 'Institution of Engineers (India)', 'KS Block', 'Recognized Engineering Student\n\nB.E.\n\nB.Tech.\n\nDiploma\n\nEquivalent Programme'),

('NSS', 'National Service Scheme', 'RV Block', '• Bona fide student\n• Register through NSS Programme Officer\n• Voluntary service\n• No entrance exam\n• No coding test\n• No interview\n• No CGPA requirement');


-- 10. Insert the Real Production Events (Task 3)
INSERT INTO events (name, status, location_text, event_date) VALUES 
('Smart India Hackathon 2026', 'upcoming', 'JS Conference Hall, CSBS Computer Labs', '2026-08-25 09:00:00'),
('Hackwell 2026', 'upcoming', 'AIDS Labs', '2026-09-10 09:00:00'),
('Google × SARA Hackathon 2026', 'upcoming', 'Communication Lab', '2026-07-20 09:00:00');

