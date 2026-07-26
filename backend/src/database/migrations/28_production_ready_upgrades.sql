-- 28_production_ready_upgrades.sql

-- 1. Create notice_reads table
CREATE TABLE IF NOT EXISTS notice_reads (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  notice_id INTEGER REFERENCES notices(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, notice_id)
);

-- 2. Create notice_bookmarks table
CREATE TABLE IF NOT EXISTS notice_bookmarks (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  notice_id INTEGER REFERENCES notices(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, notice_id)
);

-- 3. Create fresher_checklist table
CREATE TABLE IF NOT EXISTS fresher_checklist (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  task_id VARCHAR(50) NOT NULL,
  is_done BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, task_id)
);

-- 4. Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  value TEXT,
  PRIMARY KEY (user_id, key)
);

-- 5. Create activity_timeline table
CREATE TABLE IF NOT EXISTS activity_timeline (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  action_text TEXT NOT NULL,
  icon VARCHAR(50) DEFAULT 'info',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create student_achievements table
CREATE TABLE IF NOT EXISTS student_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(100) NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  badge_icon VARCHAR(50) DEFAULT 'emoji_events',
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

-- 7. Add columns to ai_reports table
ALTER TABLE ai_reports ADD COLUMN IF NOT EXISTS corrected_answer TEXT;
ALTER TABLE ai_reports ADD COLUMN IF NOT EXISTS knowledge_source TEXT;

-- 8. Add columns to users table for profile enhancement
ALTER TABLE users ADD COLUMN IF NOT EXISTS semester INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS section VARCHAR(10) DEFAULT 'A';
ALTER TABLE users ADD COLUMN IF NOT EXISTS batch VARCHAR(50) DEFAULT '2025-2029';
ALTER TABLE users ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS technical_skills TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS soft_skills TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS career_interests TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS achievements TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS github VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS resume VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_companies TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_higher_studies TEXT;

-- 9. Add resolved_answer column to unknown_questions for admin-approved answers
ALTER TABLE unknown_questions ADD COLUMN IF NOT EXISTS resolved_answer TEXT;
ALTER TABLE unknown_questions ADD COLUMN IF NOT EXISTS resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE unknown_questions ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
