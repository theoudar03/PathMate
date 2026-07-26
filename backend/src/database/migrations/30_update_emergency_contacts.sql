-- Update emergency_contacts table with real campus contacts
TRUNCATE TABLE emergency_contacts RESTART IDENTITY;

INSERT INTO emergency_contacts (id, label, contact_value, notes) VALUES
(1, 'Mr. Senthil Balaji (Boys Hostel)', '9786602444', 'Contact person for Boys Hostel'),
(2, 'Mr. Ganapathy (Boys Hostel)', '8056378804', 'Contact person for Boys Hostel'),
(3, 'Dr. M.Santhi (Girls Hostel)', '9443247249', 'Contact person for Girls Hostel'),
(4, 'Ms.Kalpana (Girls Hostel)', '8667861938', 'Contact person for Girls Hostel'),
(5, 'Ms. Sarojini (Girls Hostel)', '7708032282', 'Contact person for Girls Hostel'),
(6, 'Dr.D.Valavan (Anti-Ragging Committee)', '8489915201', 'Contact person for Anti-Ragging Committee'),
(7, 'Dr.L.Muruganandam (Anti-Ragging Committee)', '9486606545', 'Contact person for Anti-Ragging Committee'),
(8, 'Dr.M.Padmaa (Anti-Ragging Committee)', '9894055910', 'Contact person for Anti-Ragging Committee'),
(9, 'Mr.P.Nixon (Inspector of Police) (Anti-Ragging)', '9498164033', 'Police inspector anti-ragging representative'),
(10, 'SCE Campus Medical Room', '+91-8765432109', 'First aid desk and ambulance dispatch');
