-- Migration 35: Master Locations Table Schema Upgrade & Synchronization

ALTER TABLE locations ADD COLUMN IF NOT EXISTS building_code TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS search_keywords TEXT[];
ALTER TABLE locations ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,6);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,6);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Seed / Update initial core locations if missing lat/lng
INSERT INTO locations (name, building_code, category, latitude, longitude, description, search_keywords, is_published, is_archived)
VALUES
('KS Block (Santhanam Block)', 'KS', 'Academic', 10.756400, 78.651200, 'Secretary K. Santhanam Block. Key academic quad block hosting Communication Systems Lab, VLSI Lab, ECE/EEE chambers.', ARRAY['ece', 'eee', 'ice', 'vlsi', 'communication', 'santhanam'], true, false),
('RV Block (Main Block)', 'RV', 'Academic', 10.756400, 78.651600, 'RV Block (CSE Department / Main Block). Houses administrative services, Principal chamber, COE exam cell, Placement Cell, and main CSE labs.', ARRAY['cse', 'it', 'principal', 'coe', 'administration', 'placement'], true, false),
('BD Block (Computing Hub)', 'BD', 'Academic', 10.757600, 78.651600, 'BD Block. The computing innovation hub. Houses AI&DS research labs, CSBS wing, and Central Library.', ARRAY['aids', 'aiml', 'csbs', 'library', 'computing'], true, false),
('JS Block (Civil & Auditorium)', 'JS', 'Academic', 10.757200, 78.651600, 'JS Block. Dedicated to Civil Engineering classrooms, structural design labs, and the 1200-capacity Santhanam Auditorium.', ARRAY['civil', 'auditorium', 'santhanam auditorium'], true, false),
('ME Block (Mechanical)', 'ME', 'Academic', 10.757600, 78.651000, 'ME Block. Mechanical Engineering classrooms, CAD/CAM labs, and Drawing Hall.', ARRAY['mechanical', 'mech', 'cad', 'drawing hall'], true, false),
('Ganesha Temple', 'TMPL', 'Religious', 10.756000, 78.651600, 'Ganesha Temple (Vinayagar Temple). Campus shrine near main walkway.', ARRAY['temple', 'shrine', 'vinayagar', 'prayer'], true, false),
('CUB ATM', 'ATM', 'Services', 10.755800, 78.651300, 'City Union Bank 24x7 ATM Kiosk near KS Block entrance.', ARRAY['atm', 'bank', 'cash', 'cub'], true, false),
('Main Canteen & Cafeteria', 'CAN', 'Dining', 10.757200, 78.651200, 'Main campus canteen serving hot vegetarian meals, snacks, fresh juice, and beverages.', ARRAY['canteen', 'food', 'cafeteria', 'lunch', 'snacks'], true, false),
('Boys Hostel', 'BH', 'Hostel', 10.758400, 78.651400, 'On-campus residential block for male students with mess hall and study rooms.', ARRAY['hostel', 'boys hostel', 'residence'], true, false),
('Girls Hostel', 'GH', 'Hostel', 10.758000, 78.652200, 'On-campus secure residential block for female students.', ARRAY['girls hostel', 'female hostel', 'residence'], true, false),
('Main Entrance Gate', 'GATE', 'Landmark', 10.754300, 78.652800, 'Primary security checkpoint and visitor entrance on Trichy-Madurai Expressway.', ARRAY['gate', 'entrance', 'security', 'main gate'], true, false),
('Bus Boarding Bay', 'BUS', 'Services', 10.758400, 78.651600, 'Central bus pickup and drop-off bay for 25+ college bus routes.', ARRAY['bus', 'transport', 'boarding', 'routes'], true, false)
ON CONFLICT DO NOTHING;
