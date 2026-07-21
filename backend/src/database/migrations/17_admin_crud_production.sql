-- Migration 17: Admin Management System Production Schema & Single Source of Truth

-- 1. FAQs Reference Table for AI Knowledge Base Grounding
CREATE TABLE IF NOT EXISTS faqs (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE faqs ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

-- 2. Unknown Questions Table (Unanswered student AI queries requiring Admin review)
CREATE TABLE IF NOT EXISTS unknown_questions (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, answered, rejected
    answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial production FAQs for Saranathan College of Engineering if empty
INSERT INTO faqs (question, answer, category, is_approved)
SELECT 'How can I join Coding Ninjas or IEEE student chapters?', 'You can explore requirements and register through the Clubs & Events section on your Student Dashboard, or meet the coordinators at RV Block.', 'Clubs & Events', true
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE question ILIKE '%Coding Ninjas%');

INSERT INTO faqs (question, answer, category, is_approved)
SELECT 'Where is the Central Library located?', 'The Central Library is located on the 1st Floor of the Santhanam Block. It houses 45,000+ volumes, digital journals, and silent reading zones.', 'Campus & Wayfinding', true
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE question ILIKE '%Central Library%');

INSERT INTO faqs (question, answer, category, is_approved)
SELECT 'What are the hostel dining timings?', 'Breakfast: 7:30 AM - 8:30 AM, Lunch: 12:30 PM - 1:30 PM, Snacks: 4:30 PM - 5:15 PM, Dinner: 7:30 PM - 8:45 PM.', 'Hostel', true
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE question ILIKE '%dining timings%');

INSERT INTO faqs (question, answer, category, is_approved)
SELECT 'How do I request senior mentorship for career guidance?', 'Navigate to the Connect page on your Student Dashboard, search Senior Mentors by department or domain skills, and click Connect.', 'Mentorship', true
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE question ILIKE '%senior mentorship%');

-- 3. Enhance Committees Table Columns
ALTER TABLE committees ADD COLUMN IF NOT EXISTS faculty_name TEXT;
ALTER TABLE committees ADD COLUMN IF NOT EXISTS student_coordinators TEXT;
ALTER TABLE committees ADD COLUMN IF NOT EXISTS location_text TEXT;
ALTER TABLE committees ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- 4. Enhance Volunteers & Seniors Table Columns
ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE seniors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 5. Seed Initial Committees if empty
INSERT INTO committees (name, description, faculty_name, student_coordinators, location_text, status)
SELECT 'Disciplinary Committee', 'Maintains campus code of conduct and student discipline across all blocks.', 'Dr. M. Santhi (HOD ECE)', 'Karthik S. (Final CSE)', 'Santhanam Block - Main Office', 'active'
WHERE NOT EXISTS (SELECT 1 FROM committees WHERE name = 'Disciplinary Committee');

INSERT INTO committees (name, description, faculty_name, student_coordinators, location_text, status)
SELECT 'Cultural Committee', 'Coordinates annual college cultural festivals, music, dance, and fine arts events.', 'Prof. R. Venkatesh', 'Priya S. (Final ECE), Arun K. (Final IT)', 'RV Block Auditorium', 'active'
WHERE NOT EXISTS (SELECT 1 FROM committees WHERE name = 'Cultural Committee');

INSERT INTO committees (name, description, faculty_name, student_coordinators, location_text, status)
SELECT 'Sports Committee', 'Organizes inter-departmental and intra-collegiate sports tournaments.', 'Physical Director Mr. K. Rajan', 'Deepak R. (Final EEE)', 'College Sports Ground & Indoor Hall', 'active'
WHERE NOT EXISTS (SELECT 1 FROM committees WHERE name = 'Sports Committee');

-- 6. Indexes for Fast Admin Searches & Aggregations
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_approved ON faqs(is_approved);
CREATE INDEX IF NOT EXISTS idx_unknown_q_status ON unknown_questions(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
