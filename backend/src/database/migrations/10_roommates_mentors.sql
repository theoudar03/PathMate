CREATE TABLE IF NOT EXISTS roommates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  branch TEXT,
  origin TEXT,
  sleep_habits TEXT,
  interests JSONB,
  hostel_block TEXT,
  lifestyle TEXT,
  contact TEXT
);

CREATE TABLE IF NOT EXISTS mentors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  branch TEXT,
  year TEXT,
  areas JSONB,
  contact TEXT,
  tip TEXT
);

CREATE TABLE IF NOT EXISTS campus_blocks (
  id SERIAL PRIMARY KEY,
  block_name TEXT NOT NULL,
  svg_id TEXT NOT NULL,
  block_type TEXT
);



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
('Tennis Court', 'tennis-court', 'facility')
ON CONFLICT DO NOTHING;
