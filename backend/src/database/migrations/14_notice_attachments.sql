-- 14_notice_attachments.sql: Notice Board upgrades and Attachment storage tables

-- 1. Upgrade notices table with additional metadata fields
ALTER TABLE notices 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'General',
ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'published',
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Create notice_attachments table
CREATE TABLE IF NOT EXISTS notice_attachments (
    id SERIAL PRIMARY KEY,
    notice_id INTEGER NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'image', 'pdf', 'document', 'generic'
    mime_type VARCHAR(100),
    file_size INTEGER DEFAULT 0,
    storage_url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_notice_attachments_notice_id ON notice_attachments(notice_id);
CREATE INDEX IF NOT EXISTS idx_notices_status ON notices(status);
CREATE INDEX IF NOT EXISTS idx_notices_published_at ON notices(published_at DESC);
