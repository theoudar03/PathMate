-- Migration 21: Add Travel Mode Column to Users and Official Students

-- 1. Add travel_mode to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS travel_mode VARCHAR(50) DEFAULT 'own_transport';

-- 2. Add travel_mode to official_students table
ALTER TABLE official_students ADD COLUMN IF NOT EXISTS travel_mode VARCHAR(50) DEFAULT 'own_transport';
