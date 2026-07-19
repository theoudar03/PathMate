-- Migration 08: Add Indexes for Optimized Lookups
-- Adds indexes on fields targeted in chatbot or student registry search criteria.

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
