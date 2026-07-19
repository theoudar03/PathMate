-- Migration 07: Add Indexes for Performance Optimization
-- Ensures indexes on frequently queried columns to improve lookup speed and avoid full table scans.

-- 1. Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 2. Foreign keys and reference indexes
CREATE INDEX IF NOT EXISTS idx_user_registrations_user_id ON user_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_registrations_created_at ON user_registrations(created_at);

CREATE INDEX IF NOT EXISTS idx_roommate_match_requests_requester_id ON roommate_match_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_roommate_match_requests_requested_id ON roommate_match_requests(requested_id);
CREATE INDEX IF NOT EXISTS idx_roommate_match_requests_created_at ON roommate_match_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_faculty_department_id ON faculty(department_id);
CREATE INDEX IF NOT EXISTS idx_senior_volunteers_department_id ON senior_volunteers(department_id);
