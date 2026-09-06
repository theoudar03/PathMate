-- Migration 33: Events & Clubs Production Overhaul
-- Single Source of Truth schema upgrades for Saranathan College of Engineering

-- 1. Enhance events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS title VARCHAR(255);
UPDATE events SET title = name WHERE title IS NULL AND name IS NOT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type VARCHAR(100) DEFAULT 'General';
ALTER TABLE events ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer VARCHAR(255) DEFAULT 'Saranathan College of Engineering';
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue VARCHAR(255);
UPDATE events SET venue = location_text WHERE venue IS NULL AND location_text IS NOT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 100;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_count INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;
UPDATE events SET image_url = poster WHERE image_url IS NULL AND poster IS NOT NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PUBLISHED';
UPDATE events SET status = 'PUBLISHED' WHERE status IS NULL OR status = 'upcoming' OR status = 'ongoing' OR status = 'active';
ALTER TABLE events ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
UPDATE events SET featured = is_featured WHERE is_featured IS NOT NULL AND featured IS FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_registration_open BOOLEAN DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE events ADD COLUMN IF NOT EXISTS published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Enhance clubs table
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS department VARCHAR(255) DEFAULT 'All Departments';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS faculty_coordinator VARCHAR(255);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS student_coordinator VARCHAR(255);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS meeting_location VARCHAR(255);
UPDATE clubs SET meeting_location = location_text WHERE meeting_location IS NULL AND location_text IS NOT NULL;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS meeting_schedule VARCHAR(255);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS membership_status VARCHAR(50) DEFAULT 'open';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS membership_url TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PUBLISHED';
UPDATE clubs SET status = 'PUBLISHED' WHERE status IS NULL OR status = 'active';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 3. Create event_registrations table for database-backed student event registrations
CREATE TABLE IF NOT EXISTS event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'registered',
  CONSTRAINT unique_event_student UNIQUE(event_id, student_id)
);

-- 4. Create indexes for high performance filtering
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_clubs_status ON clubs(status);
CREATE INDEX IF NOT EXISTS idx_clubs_category ON clubs(category);
