-- Seed departments
INSERT INTO departments (id, name, full_name) VALUES
(1, 'CSE', 'Computer Science & Engineering'),
(2, 'CSE(AI&ML)', 'Computer Science & Engineering (Artificial Intelligence and Machine Learning)'),
(3, 'AI&DS', 'Artificial Intelligence & Data Science'),
(4, 'CSBS', 'Computer Science and Business Systems'),
(5, 'ECE', 'Electronics & Communication Engineering'),
(6, 'EEE', 'Electrical & Electronics Engineering'),
(7, 'ICE', 'Instrumentation & Control Engineering'),
(8, 'Civil', 'Civil Engineering'),
(9, 'IT', 'Information Technology')
ON CONFLICT (name) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Seed interests
INSERT INTO interests (id, label) VALUES
(1, 'Coding'),
(2, 'Robotics & Hardware'),
(3, 'Arts & Crafts'),
(4, 'Debate & Public Speaking'),
(5, 'Sports & Athletics'),
(6, 'Volunteering'),
(7, 'Tamil Culture')
ON CONFLICT (label) DO NOTHING;

-- Seed locations
INSERT INTO locations (id, name, block, floor, directions_text) VALUES
(1, 'Santhanam Block, Lab 2 (1st Floor)', 'Santhanam Block', '1st Floor', 'Walk into Santhanam Block entrance, take the central stairs to the 1st floor, turn left.'),
(2, 'Santhanam Block, Lab 3 (2nd Floor)', 'Santhanam Block', '2nd Floor', 'Go to Santhanam Block, take the stairs to the 2nd floor, coding lab is straight ahead.'),
(3, 'Main Lab Block, Embedded Systems Lab (Ground Floor)', 'Main Lab Block', 'Ground Floor', 'Enter Main Lab Block, take immediate right pathway past the foyer.'),
(4, 'Library Seminar Hall (1st Floor)', 'Central Library', '1st Floor', 'Walk to Library Building, go up one floor, room is on the right side of the main hall.'),
(5, 'RV Auditorium (Admin Block)', 'Administrative Block', 'Ground Floor', 'Inside the Admin Block ground floor, adjacent to HOD offices.'),
(6, 'Open Air Theatre (OAT)', 'OAT Block', 'Ground Floor', 'Behind the Administrative Block, near sports grounds.'),
(7, 'NSS Office (Civil Block Ground Floor)', 'Civil Block', 'Ground Floor', 'Go to Civil block ground floor, past the environmental lab window.'),
(8, 'Sports Office, near Playgrounds', 'Sports Complex', 'Ground Floor', 'Cross the football field towards the fitness center door.'),
(9, 'Main Administrative Block Ground Floor Counters', 'Administrative Block', 'Ground Floor', 'Main foyer entry gates, look for counter signs 1 through 4.'),
(10, 'Accounts Desk, Administrative Block (1st Floor)', 'Administrative Block', '1st Floor', 'Go up stairs from Admin Block lobby, accounts cabin is on the immediate left.'),
(11, 'Library Main Desk (Library Building Ground Floor)', 'Central Library', 'Ground Floor', 'Main entry gate of the Library block.'),
(12, 'Chief Wardens Office, Boys Hostel Block B', 'Boys Hostel Block B', 'Ground Floor', 'Adjacent to block B reception area.'),
(13, 'Chief Wardens Office, Girls Hostel Block A', 'Girls Hostel Block A', 'Ground Floor', 'Beside Block A secure lobby gates.'),
(14, 'Main Canteen', 'Canteen Block', 'Ground Floor', 'Behind the ECE department building.'),
(15, 'ECE Labs, Main Lab Block (1st Floor)', 'Main Lab Block', '1st Floor', 'ECE main workspace wing.')
ON CONFLICT (id) DO NOTHING;

-- Seed clubs
INSERT INTO clubs (id, name, description, location_id) VALUES
(1, 'SCE Coding Club', 'A community of passionate programmers and developers at SCE. We host hackathons, codathons, and weekly programming workshops.', 2),
(2, 'SCE Robotics & Automation Society', 'Build robots, micro-controllers, and automation systems. Combines hardware development, embedded coding, and structural design.', 3),
(3, 'SCE Fine Arts Club (FAC)', 'Creative hub of Saranathan College. Focuses on painting, sketching, music, photography, and theater performances.', 6),
(4, 'English Literary Club (ELC)', 'Enhances public speaking, debate, creative writing, and group discussions.', 4),
(5, 'தமிழ் இலக்கிய மன்றம்', 'Celebrating the richness of Tamil language, poetry, drama, and debating. We organize annual state-level competitions.', 5),
(6, 'NSS & Youth Red Cross (YRC)', 'Dedicated to community service, blood donation camps, environmental awareness drives, and rural development.', 7),
(7, 'SCE Sports Council', 'Oversees college sports teams and fitness facilities.', 8)
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, location_id = EXCLUDED.location_id;

-- Seed club_interests
INSERT INTO club_interests (club_id, interest_id) VALUES
(1, 1), -- Coding club -> Coding
(2, 2), -- Robotics -> Robotics & Hardware
(2, 1), -- Robotics -> Coding
(3, 3), -- Fine Arts -> Arts & Crafts
(4, 4), -- English Literary -> Debate & Public Speaking
(5, 7), -- Tamil Mandram -> Tamil Culture
(5, 4), -- Tamil Mandram -> Debate & Public Speaking
(6, 6), -- NSS -> Volunteering
(7, 5)  -- Sports Council -> Sports & Athletics
ON CONFLICT (club_id, interest_id) DO NOTHING;

-- Seed events
INSERT INTO events (id, name, description, club_id, location_id, event_date, registration_deadline) VALUES
(1, 'Freshers Hackathon 2026', 'A 12-hour prototyping and programming hackathon for first year students.', 1, 2, '2026-08-20 09:00:00', '2026-08-15 17:00:00'),
(2, 'RoboSoccer Workshop', 'Introduction to motor controllers, Bluetooth modules, and basic soccer bot hardware assembly.', 2, 3, '2026-08-22 13:30:00', '2026-08-18 17:00:00'),
(3, 'Aadhavan Cultural Fest Auditions', 'Auditions for music, dance, and theater performance rosters.', 3, 6, '2026-08-25 15:30:00', '2026-08-21 17:00:00')
ON CONFLICT (id) DO NOTHING;

-- Seed registration process
INSERT INTO registration_process (id, club_or_event_type, club_or_event_id, raw_process_text) VALUES
(1, 'club', 1, 'Students interested in joining the SCE Coding Club must register online via their student portal and complete the programming assessment. After passing, visit Lab 3 in Santhanam Block to collect your welcome badge from the student treasurer and pay a 50 INR registration fee.'),
(2, 'club', 2, 'To register for the Robotics Society, obtain the enrollment slip from the Embedded Systems Lab (Main Lab Block ground floor). Fill in your hardware interest tags, secure HOD signature for clearance, and submit the slip to the student secretary at the lab during the afternoon session.'),
(3, 'club', 6, 'Go to the NSS Office on the ground floor of Civil Block. Fill out the volunteer enrollment form with your blood group, parent contact detail, and anti-ragging declaration. Submit it to the HOD Civil for final registration approval and receive your NSS badges.'),
(4, 'event', 1, 'Submit your project team details (max 3 students) using the online Hackathon registry form. Take the printout of the registration confirmation mail to Santhanam Block Lab 2 coordinator by Aug 15. The entry fee is 100 INR per team.')
ON CONFLICT (id) DO NOTHING;

-- Seed faculty
INSERT INTO faculty (id, name, department_id, designation, office_location_id, contact_email) VALUES
(1, 'Dr. S. M. Giriraj', 1, 'Professor & Head', 2, 'giriraj.cse@saranathan.ac.in'),
(2, 'Dr. P. V. Raman', 5, 'Assistant Professor', 15, 'raman.ece@saranathan.ac.in'),
(3, 'Dr. Archana K.', 9, 'Senior Lecturer', 11, 'archana.it@saranathan.ac.in')
ON CONFLICT (id) DO NOTHING;

-- Seed timetable
INSERT INTO timetable (id, department_id, section, day_of_week, start_time, end_time, subject, faculty_id) VALUES
(1, 1, 'A', 'Monday', '09:00:00', '09:50:00', 'Problem Solving and Python Programming', 1),
(2, 1, 'A', 'Monday', '09:50:00', '10:40:00', 'Basic Electrical Engineering', 2),
(3, 1, 'A', 'Monday', '10:40:00', '11:30:00', 'Engineering Physics', 3),
(4, 5, 'B', 'Tuesday', '09:00:00', '09:50:00', 'Basic Electronics Workshop', 2),
(5, 9, 'A', 'Wednesday', '10:40:00', '11:30:00', 'Object Oriented Programming in Java', 3)
ON CONFLICT (id) DO NOTHING;

-- Seed emergency_contacts
INSERT INTO emergency_contacts (id, label, contact_value, notes) VALUES
(1, 'Hostel Chief Warden (Boys)', '[ADD REAL BOYS WARDEN NUMBER]', 'Welfare contact and room allotment issues'),
(2, 'Hostel Chief Warden (Girls)', '[ADD REAL GIRLS WARDEN NUMBER]', 'Welfare contact and room safety'),
(3, 'SCE Campus Medical Room', '[ADD REAL MEDICAL Desk NUMBER]', 'First aid desk and ambulance dispatch'),
(4, 'SCE Anti-Ragging Committee', '[ADD REAL ANTI-RAGGING HOTLINE]', 'Zero tolerance harassment reporting cell')
ON CONFLICT (id) DO NOTHING;
