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

INSERT INTO roommates (id, name, branch, origin, sleep_habits, interests, hostel_block, lifestyle, contact) VALUES
('rm-1', 'Karthikeyan S.', 'CSE', 'Madurai', 'Early riser (10 PM - 5 AM)', '["Coding", "Chess", "Football"]', 'B-Block (Boys Hostel)', 'Vegetarian, quiet study preference', 'karthikeyan.s26@saranathan.ac.in'),
('rm-2', 'Abishek R.', 'ECE', 'Chennai', 'Night owl (12 AM - 7 AM)', '["Guitar", "PC Gaming", "Robotics"]', 'B-Block (Boys Hostel)', 'Prefers listening to music with headphones, active learner', 'abishek.r26@saranathan.ac.in'),
('rm-3', 'Priyanka M.', 'AI&DS', 'Coimbatore', 'Balanced (11 PM - 6 AM)', '["Dancing", "Novels", "Volunteering"]', 'A-Block (Girls Hostel)', 'Loves group discussion, tidy space preference', 'priyanka.m26@saranathan.ac.in'),
('rm-4', 'Siddharth V.', 'CSBS', 'Salem', 'Early riser (9:30 PM - 5 AM)', '["Badminton", "Finance podcasts", "Movies"]', 'C-Block (Boys Hostel)', 'Organized and strict schedule', 'siddharth.v26@saranathan.ac.in'),
('rm-5', 'Divya Dharshini K.', 'IT', 'Tirunelveli', 'Night owl (12:30 AM - 7 AM)', '["Web dev", "Photography", "Anime"]', 'A-Block (Girls Hostel)', 'Flexible, loves working on creative UI layouts', 'divyadharshini.k26@saranathan.ac.in')
ON CONFLICT (id) DO NOTHING;

INSERT INTO mentors (id, name, branch, year, areas, contact, tip) VALUES
('sr-1', 'Hariharan G.', 'CSE', '4th Year', '["Placement Prep", "Web Projects", "Hackathons"]', 'hariharan.g23@saranathan.ac.in', 'Make sure to finish your lab manuals before every session. It saves a lot of last-minute pressure!'),
('sr-2', 'Nithya Sri S.', 'ECE', '3rd Year', '["Club Activities (Fine Arts)", "DSP Lab Assistance", "ECE Electives"]', 'nithyasri.s24@saranathan.ac.in', 'Santhanam Block has the best Wi-Fi coverage. Spend your free hours in the central library for quiet prep.'),
('sr-3', 'Rohan Jacob', 'EEE', '4th Year', '["Gate Preparation", "Robotics Society", "Hostel Life Hacks"]', 'rohan.j23@saranathan.ac.in', 'Hostel mess food is best on Wednesdays (special dinner). Be there early to skip the queue.'),
('sr-4', 'Archana R.', 'IT', '3rd Year', '["NSS Volunteering", "Java Programming", "Placement Internships"]', 'archana.r24@saranathan.ac.in', 'Do not hesitate to reach out to the heads of departments. They are very friendly and guide you well.')
ON CONFLICT (id) DO NOTHING;

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
