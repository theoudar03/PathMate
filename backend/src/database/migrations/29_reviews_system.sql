-- Migration 29: Review & Rating System for PathMate

-- 1. Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    student_name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL DEFAULT 1,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    featured BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    admin_notes TEXT,
    admin_reply TEXT,
    visibility VARCHAR(50) DEFAULT 'public', -- 'anonymous', 'public'
    helpful_count INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create review helpful votes table
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (review_id, student_id)
);

-- 3. Create review reports table
CREATE TABLE IF NOT EXISTS review_reports (
    id SERIAL PRIMARY KEY,
    review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL, -- 'Spam', 'Abusive', 'Fake', 'Offensive', 'Other'
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (review_id, student_id)
);

-- 4. Create student notifications table
CREATE TABLE IF NOT EXISTS student_notifications (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Seed initial approved public reviews linked to existing user IDs (10, 3, 1, 6)
-- Check users 10, 3, 1, 6 from list_users:
-- 10: C Joseph Vijay (student, active)
-- 3: Vijaiaadhavan Y (student, active)
-- 1: Theoudar Doss D (student, active)
-- 6: TestFemale (student, active)

INSERT INTO reviews (student_id, student_name, department, year, rating, title, description, category, status, featured, visibility, helpful_count)
SELECT 10, 'C Joseph Vijay', 'Computer Science & Engineering', 1, 5, 'Highly recommend the AI Assistant!', 'The AI Assistant helped me clarify all my doubts about the curriculum and hostel schedules instantly. No more waiting outside department offices. Dynamic and helpful!', 'AI Assistant', 'approved', true, 'public', 12
WHERE EXISTS (SELECT 1 FROM users WHERE id = 10)
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO reviews (student_id, student_name, department, year, rating, title, description, category, status, featured, visibility, helpful_count)
SELECT 3, 'Vijaiaadhavan Y', 'Information Technology', 1, 4, 'Very helpful Campus Maps', 'Wayfinding is top tier! It maps out Santhanam block and all the labs with detailed floor routes. Highly recommend for freshers who get lost easily.', 'Campus Navigation', 'approved', false, 'public', 5
WHERE EXISTS (SELECT 1 FROM users WHERE id = 3)
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO reviews (student_id, student_name, department, year, rating, title, description, category, status, featured, visibility, helpful_count)
SELECT 1, 'Theoudar Doss D', 'Computer Science & Engineering', 1, 5, 'Excellent Freshers Companion', 'PathMate is literally the best tool for onboarding. From document verification checklist steps to finding local transit guides, everything is integrated here.', 'Overall Experience', 'approved', true, 'public', 8
WHERE EXISTS (SELECT 1 FROM users WHERE id = 1)
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO reviews (student_id, student_name, department, year, rating, title, description, category, status, featured, visibility, helpful_count)
SELECT 6, 'TestFemale', 'Electronics & Communication Engineering', 1, 4, 'Great study resources on the hub', 'Found all semester-1 reference texts and Anna University regulations in one place. No need to hunt elsewhere. Excellent design.', 'Study Hub', 'approved', false, 'public', 2
WHERE EXISTS (SELECT 1 FROM users WHERE id = 6)
ON CONFLICT (student_id) DO NOTHING;
