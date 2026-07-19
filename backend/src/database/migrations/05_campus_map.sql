-- Migration 05: Campus Map Schema & Seed
-- Adds tables campus_blocks and block_floor_details
-- Seeds details for KS Block, RV Block, JS Block, BD Block, ME Block, and Cafeteria

CREATE TABLE IF NOT EXISTS campus_blocks (
  id SERIAL PRIMARY KEY,
  block_name TEXT NOT NULL UNIQUE,   -- e.g. 'KS Block', 'RV Block'
  svg_id TEXT NOT NULL,              -- matches the id used in the SVG map, e.g. 'ks-block'
  block_type TEXT NOT NULL           -- 'academic' (shows floor breakdown) or 'facility' (shows simple info) or 'landmark' (label only, no popup)
);

CREATE TABLE IF NOT EXISTS block_floor_details (
  id SERIAL PRIMARY KEY,
  block_id INTEGER REFERENCES campus_blocks(id) ON DELETE CASCADE,
  floor_label TEXT NOT NULL,   -- 'Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', or 'Hours' for facilities
  detail_text TEXT NOT NULL    -- what's on that floor, or the facility detail
);

-- Seed campus blocks
INSERT INTO campus_blocks (block_name, svg_id, block_type) VALUES
('KS Block', 'ks-block', 'academic'),
('RV Block', 'rv-block', 'academic'),
('JS Block', 'js-block', 'academic'),
('BD Block', 'bd-block', 'academic'),
('ME Block', 'me-block', 'academic'),
('Cafeteria', 'cafeteria', 'facility'),
('Boys Hostel', 'boys-hostel', 'facility'),
('TNSCA Trichy Office', 'tnsca-office', 'facility'),
('Main Cricket Ground', 'main-cricket', 'facility'),
('Cricket Ground 2', 'cricket-ground-2', 'facility'),
('Cricket Ground 1', 'cricket-ground-1', 'facility'),
('Mechanical Workshop', 'mech-workshop', 'academic'),
('Stationery Shop', 'stationery', 'facility'),
('Generator Room', 'generator-room', 'facility'),
('Mechanical Lab', 'mech-lab', 'academic'),
('Bus Boarding Point', 'bus-boarding', 'facility'),
('Ganesha Temple', 'temple', 'facility'),
('Volleyball Court', 'volleyball-court', 'facility'),
('Basketball Court', 'basketball-court', 'facility'),
('Football Ground', 'football-ground', 'facility'),
('Tennis Court', 'tennis-court', 'facility'),
('Security Room', 'security-room', 'facility'),
('Parking Lot', 'parking-lot', 'facility'),
('Toilet Block', 'toilet', 'facility')
ON CONFLICT (block_name) DO NOTHING;

-- Seed floor/facility details
-- Delete first to ensure re-runs don't duplicate rows
DELETE FROM block_floor_details;

-- KS Block (Secretary K. Santhanam Block)
INSERT INTO block_floor_details (block_id, floor_label, detail_text) VALUES
((SELECT id FROM campus_blocks WHERE svg_id = 'ks-block'), 'Ground Floor', 'EEE, ICE'),
((SELECT id FROM campus_blocks WHERE svg_id = 'ks-block'), '1st Floor', 'IT'),
((SELECT id FROM campus_blocks WHERE svg_id = 'ks-block'), '2nd Floor', 'ECE');

-- RV Block
INSERT INTO block_floor_details (block_id, floor_label, detail_text) VALUES
((SELECT id FROM campus_blocks WHERE svg_id = 'rv-block'), 'Ground Floor', 'CSE Labs, Chemistry Department'),
((SELECT id FROM campus_blocks WHERE svg_id = 'rv-block'), '1st Floor', 'English Department, Communication Lab, Main Administration Office, Principal Office'),
((SELECT id FROM campus_blocks WHERE svg_id = 'rv-block'), '2nd Floor', 'Maths Department, 1st Year Classes, COE Room'),
((SELECT id FROM campus_blocks WHERE svg_id = 'rv-block'), '3rd Floor', 'CSE Department, 1st Year Classes');

-- JS Block
INSERT INTO block_floor_details (block_id, floor_label, detail_text) VALUES
((SELECT id FROM campus_blocks WHERE svg_id = 'js-block'), 'Ground Floor', 'Civil Department'),
((SELECT id FROM campus_blocks WHERE svg_id = 'js-block'), '2nd Floor', 'Auditorium');

-- BD Block
INSERT INTO block_floor_details (block_id, floor_label, detail_text) VALUES
((SELECT id FROM campus_blocks WHERE svg_id = 'bd-block'), 'Ground Floor', 'AIML Department, Main Library, PET Room'),
((SELECT id FROM campus_blocks WHERE svg_id = 'bd-block'), '1st Floor', 'AIDS Department, CSBS, AIDS Labs'),
((SELECT id FROM campus_blocks WHERE svg_id = 'bd-block'), '2nd Floor', 'CSBS Department');

-- ME Block
INSERT INTO block_floor_details (block_id, floor_label, detail_text) VALUES
((SELECT id FROM campus_blocks WHERE svg_id = 'me-block'), 'Ground Floor', 'Mechanical Department, All ME Branches, Workshop, EG Drawing Hall');

-- Cafeteria (facility type)
INSERT INTO block_floor_details (block_id, floor_label, detail_text) VALUES
((SELECT id FROM campus_blocks WHERE svg_id = 'cafeteria'), 'Hours', '8:00 AM - 5:00 PM');

-- Add new blocks floor/facility details
INSERT INTO block_floor_details (block_id, floor_label, detail_text) VALUES
((SELECT id FROM campus_blocks WHERE svg_id = 'boys-hostel'), 'Warden Room', 'Ground Floor Foyer (Boys Hostel)'),
((SELECT id FROM campus_blocks WHERE svg_id = 'boys-hostel'), 'Facilities', 'Mess hall, Study rooms, TV recreation space'),
((SELECT id FROM campus_blocks WHERE svg_id = 'tnsca-office'), 'Contact', 'office@tnscatrichy.org'),
((SELECT id FROM campus_blocks WHERE svg_id = 'tnsca-office'), 'Details', 'District Cricket Association Office'),
((SELECT id FROM campus_blocks WHERE svg_id = 'main-cricket'), 'Facilities', 'Turf pitch, practice nets, pavilion seats'),
((SELECT id FROM campus_blocks WHERE svg_id = 'cricket-ground-2'), 'Usage', 'Nets training sessions and practice matches'),
((SELECT id FROM campus_blocks WHERE svg_id = 'cricket-ground-1'), 'Usage', 'Junior sports meets and athletics track boundary'),
((SELECT id FROM campus_blocks WHERE svg_id = 'mech-workshop'), 'Ground Floor', 'Carpentry, Welding, Fitting, Lathe Machining shops'),
((SELECT id FROM campus_blocks WHERE svg_id = 'stationery'), 'Hours', '8:30 AM - 4:30 PM'),
((SELECT id FROM campus_blocks WHERE svg_id = 'stationery'), 'Facilities', 'Records printing, blueprints, engineering drafts copying'),
((SELECT id FROM campus_blocks WHERE svg_id = 'generator-room'), 'Details', 'High-voltage grid supply backups'),
((SELECT id FROM campus_blocks WHERE svg_id = 'mech-lab'), 'Ground Floor', 'Thermal lab, Fluid dynamics test engines'),
((SELECT id FROM campus_blocks WHERE svg_id = 'bus-boarding'), 'Departure', 'Morning: 7:35 AM, Evening: 4:30 PM (25+ Routes)'),
((SELECT id FROM campus_blocks WHERE svg_id = 'temple'), 'Details', 'Sri Ganesha Shrine - Entrance Walkway'),
((SELECT id FROM campus_blocks WHERE svg_id = 'volleyball-court'), 'Type', 'Sand Pit Court'),
((SELECT id FROM campus_blocks WHERE svg_id = 'basketball-court'), 'Type', 'Synthetic Court with floodlights'),
((SELECT id FROM campus_blocks WHERE svg_id = 'football-ground'), 'Type', 'Natural grass field'),
((SELECT id FROM campus_blocks WHERE svg_id = 'tennis-court'), 'Type', 'Acrylic hard court'),
((SELECT id FROM campus_blocks WHERE svg_id = 'security-room'), 'Hours', '24 x 7 security assistance'),
((SELECT id FROM campus_blocks WHERE svg_id = 'parking-lot'), 'Type', 'Covered staff and student two-wheeler / car bays'),
((SELECT id FROM campus_blocks WHERE svg_id = 'toilet'), 'Type', 'Restrooms adjacent to Cricket Ground 1');
