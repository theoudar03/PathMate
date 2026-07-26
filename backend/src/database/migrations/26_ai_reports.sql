-- Migration 26: Create ai_reports table for student-reported incorrect chatbot answers
CREATE TABLE IF NOT EXISTS ai_reports (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  ai_answer TEXT NOT NULL,
  reported_reason TEXT NOT NULL,
  student_comments TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  conversation_id VARCHAR(100),
  source VARCHAR(100), -- 'Database', 'Gemini', 'Website', etc.
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(150),
  user_department VARCHAR(150),
  admin_notes TEXT,
  severity VARCHAR(50) DEFAULT 'Medium', -- 'Low', 'Medium', 'High'
  resolution_status VARCHAR(50) DEFAULT 'pending' -- 'pending', 'verified', 'resolved', 'rejected'
);

-- Index for status filters and search querying
CREATE INDEX IF NOT EXISTS idx_ai_reports_status ON ai_reports(resolution_status);
CREATE INDEX IF NOT EXISTS idx_ai_reports_user ON ai_reports(user_id);
