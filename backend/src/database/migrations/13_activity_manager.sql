-- 13_activity_manager.sql: Database tables for Personal To-Do & Activity Manager

-- 1. Create student_tasks table
CREATE TABLE IF NOT EXISTS student_tasks (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_id INTEGER,
    activity_type VARCHAR(50), -- 'event', 'club', 'committee', 'volunteer', 'workshop', 'hackathon', 'nss'
    task_type VARCHAR(50) NOT NULL DEFAULT 'personal_task', -- 'college_activity', 'personal_task'
    title TEXT NOT NULL,
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'overdue', 'cancelled'
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'
    category VARCHAR(50) DEFAULT 'General',
    due_date DATE,
    due_time TIME,
    reminder VARCHAR(50),
    notes TEXT,
    color VARCHAR(30) DEFAULT '#1B4DA6',
    icon VARCHAR(50) DEFAULT 'task_alt',
    is_archived BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create student_task_activity_mapping table
CREATE TABLE IF NOT EXISTS student_task_activity_mapping (
    id SERIAL PRIMARY KEY,
    task_id INTEGER UNIQUE NOT NULL REFERENCES student_tasks(id) ON DELETE CASCADE,
    activity_id INTEGER NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    original_title TEXT,
    original_category TEXT,
    original_venue TEXT,
    original_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create task_categories table
CREATE TABLE IF NOT EXISTS task_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    color VARCHAR(30) DEFAULT '#1B4DA6',
    icon VARCHAR(50) DEFAULT 'folder'
);

-- 4. Create task_logs table
CREATE TABLE IF NOT EXISTS task_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES student_tasks(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'completed', 'uncompleted', 'archived', 'restored', 'deleted'
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Seed default task categories
INSERT INTO task_categories (name, color, icon) VALUES 
('Academic', '#1B4DA6', 'school'),
('College Activity', '#7C3AED', 'event'),
('Club Registration', '#0284C7', 'groups'),
('Workshops & Events', '#D97706', 'event_seat'),
('Personal', '#16A34A', 'person'),
('Career & Internship', '#0891B2', 'work')
ON CONFLICT (name) DO NOTHING;

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_student_tasks_student_id ON student_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_student_tasks_status ON student_tasks(status);
CREATE INDEX IF NOT EXISTS idx_student_tasks_due_date ON student_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_logs_student_id ON task_logs(student_id);
