-- 27_campus_management_upgrades.sql

-- 1. Alter faculty table
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS photo TEXT;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS office_hours TEXT;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS hod_status BOOLEAN DEFAULT false;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS principal_status BOOLEAN DEFAULT false;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS cabin TEXT;

-- 2. Alter departments table
ALTER TABLE departments ADD COLUMN IF NOT EXISTS intake INTEGER DEFAULT 60;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS hod_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS vision TEXT;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS mission TEXT;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS programme_outcomes TEXT;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS images TEXT[];

-- 3. Alter events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS poster TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_link TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'all';
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery TEXT[];

-- 4. Alter clubs table
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS coordinator TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS faculty_advisor_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS president TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS gallery TEXT[];
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS registration_link TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS social_links JSONB;

-- 5. Alter bus_routes table
ALTER TABLE bus_routes ADD COLUMN IF NOT EXISTS route_images TEXT[];
ALTER TABLE bus_routes ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE bus_routes ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- 6. Alter locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE locations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS office_hours TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 7. Create study_materials table
CREATE TABLE IF NOT EXISTS study_materials (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    document_type TEXT NOT NULL, -- 'note', 'question_bank', 'syllabus', 'curriculum', 'lab_manual', 'book'
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    subject TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create placements table
CREATE TABLE IF NOT EXISTS placements (
    id SERIAL PRIMARY KEY,
    company TEXT NOT NULL,
    package_details TEXT,
    eligibility TEXT,
    registration_link TEXT,
    drive_date TIMESTAMP,
    venue TEXT,
    rounds TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Create hostel_info table
CREATE TABLE IF NOT EXISTS hostel_info (
    id SERIAL PRIMARY KEY,
    info_type TEXT NOT NULL, -- 'notice', 'mess_menu', 'rules', 'warden', 'emergency'
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Mess menu (JSON) or Rules list (text) or contact info
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Create hostel_room_allocations table
CREATE TABLE IF NOT EXISTS hostel_room_allocations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    room_number VARCHAR(20) NOT NULL,
    block_name VARCHAR(50) NOT NULL,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Create anna_university_rules table
CREATE TABLE IF NOT EXISTS anna_university_rules (
    id SERIAL PRIMARY KEY,
    regulation_year VARCHAR(10) NOT NULL, -- e.g. '2021', '2024'
    curriculum_details TEXT,
    question_pattern_description TEXT,
    credits_structure TEXT,
    academic_rules_text TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Create website_sync_logs table
CREATE TABLE IF NOT EXISTS website_sync_logs (
    id SERIAL PRIMARY KEY,
    source_url TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'faculty', 'department', 'announcement', 'notice', 'academic_calendar'
    scraped_content JSONB NOT NULL,
    status VARCHAR(30) DEFAULT 'pending_approval', -- 'pending_approval', 'approved', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP
);

-- 13. Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Create media_library table
CREATE TABLE IF NOT EXISTS media_library (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'pdf', 'document'
    mime_type VARCHAR(100),
    file_size INTEGER DEFAULT 0,
    storage_url TEXT NOT NULL,
    folder_name VARCHAR(100) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Create push_notifications table
CREATE TABLE IF NOT EXISTS push_notifications (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_audience VARCHAR(50) DEFAULT 'everyone', -- 'everyone', 'department', 'year'
    target_value VARCHAR(100), -- department_id or year value
    priority VARCHAR(20) DEFAULT 'normal', -- 'normal', 'high', 'urgent'
    scheduled_time TIMESTAMP,
    is_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
