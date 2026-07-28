-- Migration 31: Add preferred_theme to users table for syncable interface states
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_theme VARCHAR(20) DEFAULT 'light';
