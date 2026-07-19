-- Enable vector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Canteen Menu
CREATE TABLE IF NOT EXISTS canteen_menu (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,       -- e.g. 'Main Course', 'Beverages', 'Snacks'
  item_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  availability_time TEXT        -- optional
);

-- FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  category TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL
);

-- Committees
CREATE TABLE IF NOT EXISTS committees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Committee Members
CREATE TABLE IF NOT EXISTS committee_members (
  id SERIAL PRIMARY KEY,
  committee_id INTEGER REFERENCES committees(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT,
  category TEXT,
  representing TEXT,
  phone TEXT,
  email TEXT,
  address TEXT
);

-- Regulations
CREATE TABLE IF NOT EXISTS regulations (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  version TEXT,
  year TEXT
);

CREATE TABLE IF NOT EXISTS regulation_sections (
  id SERIAL PRIMARY KEY,
  regulation_id INTEGER REFERENCES regulations(id) ON DELETE CASCADE,
  section_number TEXT,
  title TEXT,
  content TEXT NOT NULL
);

-- Facilities & Services
CREATE TABLE IF NOT EXISTS facilities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,           -- 'Hostel', 'Library', 'Transport', 'Laboratory'
  description TEXT NOT NULL,
  location_id INTEGER REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS office_contacts (
  id SERIAL PRIMARY KEY,
  office_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  timing TEXT
);

-- Policies
CREATE TABLE IF NOT EXISTS policies (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL
);

-- Academic Calendar
CREATE TABLE IF NOT EXISTS academic_calendar (
  id SERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  description TEXT
);

-- Chatbot Documents for Vector Search
CREATE TABLE IF NOT EXISTS chatbot_documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT,               -- 'pdf', 'webpage', 'handbook'
  url TEXT,
  uploaded_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chatbot_chunks (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES chatbot_documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding vector(768)
);

-- Create HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS chatbot_chunks_embedding_idx ON chatbot_chunks USING hnsw (embedding vector_cosine_ops);
