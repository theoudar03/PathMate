-- Seed Academic Calendar events
INSERT INTO academic_calendar (event_name, start_date, end_date, description) VALUES
('Semester Reopening', '2026-08-10', '2026-08-10', 'The official reopening date for all classes is August 10, 2026.'),
('Internal Assessment (IA) Test 1', '2026-09-14', '2026-09-19', 'The first Internal Assessment (IA) Test is scheduled from September 14 to September 19, 2026.'),
('Internal Assessment (IA) Test 2', '2026-10-19', '2026-10-24', 'The second Internal Assessment (IA) Test is scheduled from October 19 to October 24, 2026.'),
('Model Examination', '2026-11-16', '2026-11-21', 'Model examinations will be conducted between November 16 and November 21, 2026.'),
('Semester End Practical Examinations', '2026-11-25', '2026-11-30', 'Practical Examinations will commence from November 25, 2026.'),
('Semester End Theory Examinations', '2026-12-05', '2026-12-23', 'Anna University Semester End Theory Examinations begin on December 5, 2026.'),
('Diwali Holiday', '2026-11-08', '2026-11-08', 'Diwali holiday is on November 8, 2026.')
ON CONFLICT DO NOTHING;
