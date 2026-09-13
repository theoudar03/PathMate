-- Migration 36: Real Walkable Campus Routing Graph & Obstacle Boundaries

-- 1. Map Nodes Table (Graph Vertices)
CREATE TABLE IF NOT EXISTS map_nodes (
  id SERIAL PRIMARY KEY,
  node_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  latitude NUMERIC(10,6) NOT NULL,
  longitude NUMERIC(10,6) NOT NULL,
  node_type TEXT DEFAULT 'junction', -- 'entrance', 'junction', 'gate', 'stair', 'crossing'
  is_accessible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Map Edges Table (Graph Segments)
CREATE TABLE IF NOT EXISTS map_edges (
  id SERIAL PRIMARY KEY,
  source_node_key TEXT NOT NULL REFERENCES map_nodes(node_key) ON DELETE CASCADE,
  target_node_key TEXT NOT NULL REFERENCES map_nodes(node_key) ON DELETE CASCADE,
  distance_meters INTEGER NOT NULL,
  segment_type TEXT DEFAULT 'footpath', -- 'footpath', 'road', 'crossing', 'stairs'
  bearing_deg INTEGER DEFAULT 0,
  is_accessible BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  allowed_modes TEXT[] DEFAULT ARRAY['walking', 'cycling', 'wheelchair']
);

-- 3. Building Entrances Table
CREATE TABLE IF NOT EXISTS building_entrances (
  id SERIAL PRIMARY KEY,
  location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
  building_code TEXT,
  entrance_name TEXT NOT NULL,
  latitude NUMERIC(10,6) NOT NULL,
  longitude NUMERIC(10,6) NOT NULL,
  node_key TEXT REFERENCES map_nodes(node_key) ON DELETE SET NULL,
  is_primary BOOLEAN DEFAULT true,
  is_accessible BOOLEAN DEFAULT true
);

-- 4. Campus Obstacle Polygons & Bounding Boxes
CREATE TABLE IF NOT EXISTS campus_obstacles (
  id SERIAL PRIMARY KEY,
  obstacle_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  obstacle_type TEXT DEFAULT 'building', -- 'building', 'restricted', 'construction', 'highway'
  polygon_coords JSONB NOT NULL, -- Array of [lng, lat] vertices forming closed polygon boundary
  is_active BOOLEAN DEFAULT true
);

-- Indices for spatial queries
CREATE INDEX IF NOT EXISTS idx_map_nodes_key ON map_nodes(node_key);
CREATE INDEX IF NOT EXISTS idx_map_edges_source ON map_edges(source_node_key);
CREATE INDEX IF NOT EXISTS idx_map_edges_target ON map_edges(target_node_key);
CREATE INDEX IF NOT EXISTS idx_building_entrances_loc ON building_entrances(location_id);

-- 5. Seed Core Campus Graph Nodes (Walkable pedestrian junctions)
INSERT INTO map_nodes (node_key, name, latitude, longitude, node_type, is_accessible) VALUES
('n_main_gate', 'Main Security Entrance Gate', 10.754300, 78.652800, 'gate', true),
('n_parking_junc', 'Student Parking Waypoint', 10.754800, 78.651400, 'junction', true),
('n_sports_junc', 'Sports Complex Crossing', 10.754800, 78.650400, 'junction', true),
('n_volleyball_junc', 'Volleyball Sand Quad Crossing', 10.755200, 78.651200, 'junction', true),
('n_ks_block_front', 'KS Block West Main Entrance', 10.756000, 78.651000, 'entrance', true),
('n_academic_cross_1', 'Academic Quad Crossway 1', 10.756000, 78.651300, 'junction', true),
('n_temple_foyer', 'Ganesha Temple Walkway', 10.756600, 78.651600, 'entrance', true),
('n_rv_block_front', 'RV Block Main Foyer Entrance', 10.756400, 78.651600, 'entrance', true),
('n_generator_junc', 'Power Supply & Generator Pathway', 10.756800, 78.651000, 'junction', true),
('n_js_block_front', 'JS Block Auditorium Entrance', 10.757200, 78.651600, 'entrance', true),
('n_academic_cross_2', 'Academic Quad Crossway 2', 10.756800, 78.651300, 'junction', true),
('n_cafeteria_junc', 'Main Canteen Courtyard Crossing', 10.757200, 78.651000, 'junction', true),
('n_academic_cross_3', 'Academic Quad Crossway 3', 10.757200, 78.651300, 'junction', true),
('n_bd_block_front', 'BD Block Central Library Foyer', 10.757600, 78.651600, 'entrance', true),
('n_me_block_front', 'ME Block Main Entrance', 10.757600, 78.651000, 'entrance', true),
('n_workshop_junc', 'Mechanical Workshop Entranceway', 10.758000, 78.651000, 'entrance', true),
('n_eastern_road_4', 'Staff Parking Waypoint', 10.758000, 78.651600, 'junction', true),
('n_eastern_road_5', 'Central Bus Boarding Waypoint', 10.758400, 78.651600, 'junction', true),
('n_hostel_junc', 'Residential Hostels Quad Crossing', 10.758400, 78.651200, 'junction', true),
('n_boys_hostel_gate', 'Boys Hostel Main Security Foyer', 10.758400, 78.651400, 'entrance', true),
('n_girls_hostel_gate', 'Girls Hostel Main Gate', 10.758000, 78.652200, 'entrance', true),
('n_cricket_main', 'Main Pavilion Grounds Entrance', 10.758200, 78.650400, 'junction', true)
ON CONFLICT (node_key) DO UPDATE SET 
  latitude = EXCLUDED.latitude, 
  longitude = EXCLUDED.longitude;

-- 6. Seed Graph Edges (Undirected bidirectional connected pedestrian segments)
INSERT INTO map_edges (source_node_key, target_node_key, distance_meters, segment_type, bearing_deg, is_accessible, is_active, allowed_modes) VALUES
('n_main_gate', 'n_parking_junc', 180, 'road', 320, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_parking_junc', 'n_main_gate', 180, 'road', 140, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_parking_junc', 'n_sports_junc', 110, 'footpath', 270, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_sports_junc', 'n_parking_junc', 110, 'footpath', 90, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_parking_junc', 'n_volleyball_junc', 60, 'footpath', 0, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_volleyball_junc', 'n_parking_junc', 60, 'footpath', 180, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_volleyball_junc', 'n_ks_block_front', 90, 'footpath', 0, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_ks_block_front', 'n_volleyball_junc', 90, 'footpath', 180, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_ks_block_front', 'n_academic_cross_1', 35, 'footpath', 90, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_academic_cross_1', 'n_ks_block_front', 35, 'footpath', 270, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_academic_cross_1', 'n_temple_foyer', 70, 'footpath', 90, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_temple_foyer', 'n_academic_cross_1', 70, 'footpath', 270, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_temple_foyer', 'n_rv_block_front', 30, 'footpath', 0, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_rv_block_front', 'n_temple_foyer', 30, 'footpath', 180, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_ks_block_front', 'n_generator_junc', 90, 'footpath', 0, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_generator_junc', 'n_ks_block_front', 90, 'footpath', 180, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_generator_junc', 'n_academic_cross_2', 35, 'footpath', 90, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_academic_cross_2', 'n_generator_junc', 35, 'footpath', 270, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_academic_cross_2', 'n_js_block_front', 35, 'footpath', 90, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_js_block_front', 'n_academic_cross_2', 35, 'footpath', 270, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_generator_junc', 'n_cafeteria_junc', 50, 'footpath', 0, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_cafeteria_junc', 'n_generator_junc', 50, 'footpath', 180, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_cafeteria_junc', 'n_academic_cross_3', 35, 'footpath', 90, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_academic_cross_3', 'n_cafeteria_junc', 35, 'footpath', 270, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_academic_cross_3', 'n_bd_block_front', 40, 'footpath', 0, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_bd_block_front', 'n_academic_cross_3', 40, 'footpath', 180, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_cafeteria_junc', 'n_me_block_front', 50, 'footpath', 0, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_me_block_front', 'n_cafeteria_junc', 50, 'footpath', 180, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_me_block_front', 'n_workshop_junc', 45, 'footpath', 0, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_workshop_junc', 'n_me_block_front', 45, 'footpath', 180, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_bd_block_front', 'n_eastern_road_4', 50, 'footpath', 0, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_eastern_road_4', 'n_bd_block_front', 50, 'footpath', 180, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_eastern_road_4', 'n_eastern_road_5', 50, 'road', 0, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_eastern_road_5', 'n_eastern_road_4', 50, 'road', 180, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_workshop_junc', 'n_hostel_junc', 50, 'footpath', 0, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_hostel_junc', 'n_workshop_junc', 50, 'footpath', 180, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_hostel_junc', 'n_boys_hostel_gate', 25, 'footpath', 90, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_boys_hostel_gate', 'n_hostel_junc', 25, 'footpath', 270, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_eastern_road_5', 'n_girls_hostel_gate', 60, 'footpath', 90, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_girls_hostel_gate', 'n_eastern_road_5', 60, 'footpath', 270, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_hostel_junc', 'n_cricket_main', 90, 'footpath', 270, true, true, ARRAY['walking', 'cycling', 'wheelchair']),
('n_cricket_main', 'n_hostel_junc', 90, 'footpath', 90, true, true, ARRAY['walking', 'cycling', 'wheelchair'])
ON CONFLICT DO NOTHING;

-- 7. Seed Building Entrances (Verified pedestrian entrances mapped to nodes)
INSERT INTO building_entrances (building_code, entrance_name, latitude, longitude, node_key, is_primary, is_accessible) VALUES
('KS', 'KS Block West Main Entrance', 10.756000, 78.651000, 'n_ks_block_front', true, true),
('RV', 'RV Block Foyer Main Entrance', 10.756400, 78.651600, 'n_rv_block_front', true, true),
('BD', 'BD Block Central Library Entrance', 10.757600, 78.651600, 'n_bd_block_front', true, true),
('JS', 'JS Block Auditorium Entrance', 10.757200, 78.651600, 'n_js_block_front', true, true),
('ME', 'ME Block Main Foyer', 10.757600, 78.651000, 'n_me_block_front', true, true),
('CAN', 'Main Canteen Courtyard Entrance', 10.757200, 78.651000, 'n_cafeteria_junc', true, true),
('BH', 'Boys Hostel Security Foyer', 10.758400, 78.651400, 'n_boys_hostel_gate', true, true),
('GH', 'Girls Hostel Entrance Gate', 10.758000, 78.652200, 'n_girls_hostel_gate', true, true),
('GATE', 'Main Entrance Security Checkpoint', 10.754300, 78.652800, 'n_main_gate', true, true),
('TMPL', 'Ganesha Temple Walkway Entrance', 10.756600, 78.651600, 'n_temple_foyer', true, true)
ON CONFLICT DO NOTHING;

-- 8. Seed Polygon Obstacle Boundaries (Campus buildings and restricted areas)
INSERT INTO campus_obstacles (obstacle_key, name, obstacle_type, polygon_coords, is_active) VALUES
('obs_ks_block', 'KS Block Quad Polygon', 'building', '[[78.6510, 10.7562], [78.6515, 10.7562], [78.6515, 10.7566], [78.6510, 10.7566], [78.6510, 10.7562]]'::jsonb, true),
('obs_rv_block', 'RV Block Quad Polygon', 'building', '[[78.6515, 10.7562], [78.6520, 10.7562], [78.6520, 10.7566], [78.6515, 10.7566], [78.6515, 10.7562]]'::jsonb, true),
('obs_bd_block', 'BD Block Quad Polygon', 'building', '[[78.6515, 10.7574], [78.6520, 10.7574], [78.6520, 10.7578], [78.6515, 10.7578], [78.6515, 10.7574]]'::jsonb, true),
('obs_js_block', 'JS Block Quad Polygon', 'building', '[[78.6515, 10.7570], [78.6520, 10.7570], [78.6520, 10.7574], [78.6515, 10.7574], [78.6515, 10.7570]]'::jsonb, true)
ON CONFLICT (obstacle_key) DO NOTHING;
