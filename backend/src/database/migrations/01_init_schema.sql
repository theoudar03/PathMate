-- Core reference data
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,       -- e.g. 'CSE', 'AI&DS', 'ECE'
  full_name TEXT
);

CREATE TABLE IF NOT EXISTS interests (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL UNIQUE       -- e.g. 'Coding & Tech', 'Photography'
);

CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,        -- e.g. 'Seminar Hall, Santhanam Block, 2nd floor'
  block TEXT,
  floor TEXT,
  directions_text TEXT       -- plain-language wayfinding, no coordinates needed
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  department_id INTEGER REFERENCES departments(id),
  stay_type TEXT,             -- 'hostel' or 'day_scholar'
  hostel_block TEXT,
  language_pref TEXT DEFAULT 'en',
  custom_notes TEXT,          -- free text/"Other" answers, pre-Gemini-mapping
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_interests (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  interest_id INTEGER REFERENCES interests(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, interest_id)
);

-- Clubs and events
CREATE TABLE IF NOT EXISTS clubs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  location_id INTEGER REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS club_interests (
  club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
  interest_id INTEGER REFERENCES interests(id) ON DELETE CASCADE,
  PRIMARY KEY (club_id, interest_id)
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
  location_id INTEGER REFERENCES locations(id),
  event_date TIMESTAMP,
  registration_deadline TIMESTAMP
);

-- Registration process, source of the generated checklist
CREATE TABLE IF NOT EXISTS registration_process (
  id SERIAL PRIMARY KEY,
  club_or_event_type TEXT,     -- 'club' or 'event'
  club_or_event_id INTEGER,
  raw_process_text TEXT NOT NULL   -- real, unedited process description; Gemini turns this into steps at request time
);

-- Faculty and timetable (mandatory requirements)
CREATE TABLE IF NOT EXISTS faculty (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  designation TEXT,
  office_location_id INTEGER REFERENCES locations(id),
  contact_email TEXT
);

CREATE TABLE IF NOT EXISTS timetable (
  id SERIAL PRIMARY KEY,
  department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
  section TEXT,
  day_of_week TEXT,
  start_time TIME,
  end_time TIME,
  subject TEXT,
  faculty_id INTEGER REFERENCES faculty(id) ON DELETE SET NULL
);

-- User-facing tracking
CREATE TABLE IF NOT EXISTS user_registrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  club_or_event_type TEXT,
  club_or_event_id INTEGER,
  status TEXT DEFAULT 'interested',   -- interested / checklist_started / completed
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id SERIAL PRIMARY KEY,
  user_registration_id INTEGER REFERENCES user_registrations(id) ON DELETE CASCADE,
  step_order INTEGER,
  step_text TEXT,
  is_done BOOLEAN DEFAULT false
);

-- Hostel-mate finder (opt-in, restricted, privacy-first)
CREATE TABLE IF NOT EXISTS roommate_opt_in (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_visible BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS roommate_match_requests (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  requested_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',   -- pending / accepted / declined
  created_at TIMESTAMP DEFAULT now()
);

-- Senior volunteers
CREATE TABLE IF NOT EXISTS senior_volunteers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
  year INTEGER,
  topics TEXT,                -- what they're open to advise on
  contact_method TEXT,        -- how they've agreed to be reached
  is_active BOOLEAN DEFAULT true
);

-- Chat + grounding
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  role TEXT,                  -- 'user' or 'assistant'
  content TEXT,
  source_table TEXT,          -- null if not grounded in a specific table
  created_at TIMESTAMP DEFAULT now()
);

-- Emergency contacts (real data must be filled in before demo)
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,        -- 'Hostel Warden', 'Medical Center', 'Anti-Ragging Cell', 'Women Empowerment Cell'
  contact_value TEXT NOT NULL,
  notes TEXT
);
