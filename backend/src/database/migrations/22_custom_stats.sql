-- Migration 22: Create campus_stats table for custom metrics
CREATE TABLE IF NOT EXISTS campus_stats (
    id INT PRIMARY KEY DEFAULT 1,
    students_guided INT DEFAULT 1485,
    campus_locations INT DEFAULT 25,
    active_services INT DEFAULT 8,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed with a single config row if not exists
INSERT INTO campus_stats (id, students_guided, campus_locations, active_services)
VALUES (1, 1485, 25, 8)
ON CONFLICT (id) DO NOTHING;
