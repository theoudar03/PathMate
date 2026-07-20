-- 12_campus_routing.sql

-- 1. Create tables for graph routing
CREATE TABLE IF NOT EXISTS map_nodes (
    id SERIAL PRIMARY KEY,
    name TEXT,
    type TEXT, -- 'entrance', 'corridor', 'intersection'
    svg_x INTEGER NOT NULL,
    svg_y INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS map_edges (
    id SERIAL PRIMARY KEY,
    source_node INTEGER REFERENCES map_nodes(id) ON DELETE CASCADE,
    target_node INTEGER REFERENCES map_nodes(id) ON DELETE CASCADE,
    distance INTEGER NOT NULL,
    is_accessible BOOLEAN DEFAULT true
);

-- 2. Alter campus_blocks to link to map_nodes
ALTER TABLE campus_blocks 
ADD COLUMN IF NOT EXISTS entrance_node_id INTEGER REFERENCES map_nodes(id) ON DELETE SET NULL;

-- 3. Alter events for map pins
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS pin_x INTEGER,
ADD COLUMN IF NOT EXISTS pin_y INTEGER,
ADD COLUMN IF NOT EXISTS pin_color TEXT DEFAULT 'red',
ADD COLUMN IF NOT EXISTS organizer TEXT,
ADD COLUMN IF NOT EXISTS target_audience TEXT;

-- 4. Translation Cache
CREATE TABLE IF NOT EXISTS translations (
    id SERIAL PRIMARY KEY,
    language_code TEXT NOT NULL,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    UNIQUE(language_code, md5(original_text))
);
