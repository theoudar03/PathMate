-- Migration 04: Full faculty seed — all SCE departments
-- Source: saranathan.ac.in faculty pages, scraped 2026-07-18
-- Run this AFTER migration 03.
-- This migration is safe to re-run (idempotent for schema/dept changes; faculty is wiped+reseeded each run).

-- 1. Add new columns to faculty table (safe: IF NOT EXISTS)
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS qualification TEXT;

-- 2. Add departments not in the original 9 UG list (idempotent via ON CONFLICT)
INSERT INTO departments (name, full_name) VALUES
  ('MECH', 'Mechanical Engineering'),
  ('MBA',  'Master of Business Administration'),
  ('CHE',  'Chemistry'),
  ('ENG',  'English'),
  ('MAT',  'Mathematics'),
  ('PHY',  'Physics'),
  ('TAM',  'Tamil')
ON CONFLICT (name) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 3. Wipe old mock/stale faculty and reset ID sequence
DELETE FROM faculty;
ALTER SEQUENCE faculty_id_seq RESTART WITH 1;

-- 4. Insert all real faculty
-- office_location_id left NULL — real room assignments not in scope for this release

-- ===================== ECE =====================
INSERT INTO faculty (name, department_id, designation, qualification, photo_url, contact_email) VALUES
('Dr. M Santhi',            (SELECT id FROM departments WHERE name='ECE'), 'Professor & Head',    'M.E., Ph.D',             'https://saranathan.ac.in/images/santhim.jpg',              'santhim@saranathan.ac.in'),
('Dr. V Mohan',             (SELECT id FROM departments WHERE name='ECE'), 'Professor',           'M.E., Ph.D',             'https://saranathan.ac.in/images/mohan-ece.jpg',            'mohan-ece@saranathan.ac.in'),
('Dr. P Shanmugapriya',     (SELECT id FROM departments WHERE name='ECE'), 'Professor',           'M.Tech., Ph.D',          'https://saranathan.ac.in/images/shanmugapriya-ece.jpg',    'shanmugapriya-ece@saranathan.ac.in'),
('Dr. M Padmaa',            (SELECT id FROM departments WHERE name='ECE'), 'Professor',           'M.E., Ph.D',             'https://saranathan.ac.in/images/padmaa-ece.jpg',           'padmaa-ece@saranathan.ac.in'),
('Dr. R Mukesh',            (SELECT id FROM departments WHERE name='ECE'), 'Professor',           'M.E., M.S., Ph.D., Ph.D','https://saranathan.ac.in/images/mukesh7131.jpg',           'mukesh7131@saranathan.ac.in'),
('Dr. S.A Arunmozhi',       (SELECT id FROM departments WHERE name='ECE'), 'Associate Professor', 'M.B.A, M.Tech., Ph.D',   'https://saranathan.ac.in/images/arunmozhi-ece.jpg',        'arunmozhi-ece@saranathan.ac.in'),
('Dr. S Rajeswari',         (SELECT id FROM departments WHERE name='ECE'), 'Associate Professor', 'M.Tech., Ph.D',          'https://saranathan.ac.in/images/rajeswaris-ece.jpg',       'rajeswaris-ece@saranathan.ac.in'),
('Dr. M Baritha Begum',     (SELECT id FROM departments WHERE name='ECE'), 'Associate Professor', 'M.E., Ph.D',             'https://saranathan.ac.in/images/barithabegum-ece.jpg',     'barithabegum-ece@saranathan.ac.in'),
('Dr. K Malaisamy',         (SELECT id FROM departments WHERE name='ECE'), 'Assistant Professor', 'M.E., Ph.D',             'https://saranathan.ac.in/images/malaisamy-ece.jpg',        'malaisamy-ece@saranathan.ac.in'),
('Dr. G Sivakannu',         (SELECT id FROM departments WHERE name='ECE'), 'Assistant Professor', 'M.E., Ph.D',             'https://saranathan.ac.in/images/sivakannu-ece.jpg',        'sivakannu-ece@saranathan.ac.in'),
('Dr. S Kiruthiga',         (SELECT id FROM departments WHERE name='ECE'), 'Assistant Professor', 'M.E., Ph.D',             'https://saranathan.ac.in/images/kiruthiga-ece.jpg',        'kiruthiga-ece@saranathan.ac.in'),
('Dr. N Preethi Elizabeth', (SELECT id FROM departments WHERE name='ECE'), 'Assistant Professor', 'M.E., Ph.D',             'https://saranathan.ac.in/images/preethielizabeth-ece.jpg', 'preethielizabeth-ece@saranathan.ac.in'),
('Dr. B Divya',             (SELECT id FROM departments WHERE name='ECE'), 'Assistant Professor', 'M.E., Ph.D',             'https://saranathan.ac.in/images/divyab-ece.jpg',           'divyab-ece@saranathan.ac.in'),
('Mr. S Hariprasath',       (SELECT id FROM departments WHERE name='ECE'), 'Assistant Professor', 'M.E.',                   'https://saranathan.ac.in/images/hariprasath-ece.jpg',       'hariprasath-ece@saranathan.ac.in'),
('Ms. P Sivagamasundhari',  (SELECT id FROM departments WHERE name='ECE'), 'Assistant Professor', 'M.E.',                   'https://saranathan.ac.in/images/sivagamasundhari-ece.jpg', 'sivagamasundhari-ece@saranathan.ac.in'),
('Ms. J Eindhumathy',       (SELECT id FROM departments WHERE name='ECE'), 'Assistant Professor', 'M.E.',                   'https://saranathan.ac.in/images/eindhumathy-ece.jpg',       'eindhumathy-ece@saranathan.ac.in'),
('Mr. M Mahendran',         (SELECT id FROM departments WHERE name='ECE'), 'Assistant Professor', 'M.Tech.',                'https://saranathan.ac.in/images/mahendran-ece.jpg',         'mahendran-ece@saranathan.ac.in'),
('Ms. M Anthuvan Lydia',    (SELECT id FROM departments WHERE name='ECE'), 'Assistant Professor', 'M.E.',                   'https://saranathan.ac.in/images/anthuvanlydia-ece.jpg',     'anthuvanlydia-ece@saranathan.ac.in');

-- ===================== AI&DS =====================
INSERT INTO faculty (name, department_id, designation, qualification, photo_url, contact_email) VALUES
('Dr. S Ravimaran',             (SELECT id FROM departments WHERE name='AI&DS'), 'Professor & Head',    'M.E., Ph.D',         'https://saranathan.ac.in/images/ravimaran-aid.jpg',             'ravimaran-aid@saranathan.ac.in'),
('Dr. P D Sheba Kezia Malarchelvi',(SELECT id FROM departments WHERE name='AI&DS'),'Professor',         'M.E., Ph.D',         'https://saranathan.ac.in/images/pdsheba-cse.jpg',               'pdsheba-cse@saranathan.ac.in'),
('Dr. A Kavitha',               (SELECT id FROM departments WHERE name='AI&DS'), 'Professor',           'M.E., Ph.D',         'https://saranathan.ac.in/images/kavitha7185.jpg',               'kavitha7185@saranathan.ac.in'),
('Ms. A Sridevi',               (SELECT id FROM departments WHERE name='AI&DS'), 'Assistant Professor', 'M.E',                'https://saranathan.ac.in/images/sridevi-aid.jpg',               'sridevi-aid@saranathan.ac.in'),
('Mr. M Arunprakash',           (SELECT id FROM departments WHERE name='AI&DS'), 'Assistant Professor', 'M.Tech',             'https://saranathan.ac.in/images/arunprakash7134.jpg',           'arunprakash7134@saranathan.ac.in'),
('Ms. T Shanmuga Sundari',      (SELECT id FROM departments WHERE name='AI&DS'), 'Assistant Professor', 'M.E',                'https://saranathan.ac.in/images/shanmugasundari7159.jpg',       'shanmugasundari7159@saranathan.ac.in'),
('Mr. S Sadeesh',               (SELECT id FROM departments WHERE name='AI&DS'), 'Assistant Professor', 'M.E',                'https://saranathan.ac.in/images/sadeesh7141.jpg',               'sadeesh7141@saranathan.ac.in'),
('Ms. J Ambika',                (SELECT id FROM departments WHERE name='AI&DS'), 'Assistant Professor', 'M.E.',               'https://saranathan.ac.in/images/ambika7173.jpg',                'ambika7173@saranathan.ac.in'),
('Mr. R Vetrivendan',           (SELECT id FROM departments WHERE name='AI&DS'), 'Assistant Professor', 'M.Tech.',            'https://saranathan.ac.in/images/vetrivendan7177.jpg',           'vetrivendan7177@saranathan.ac.in'),
('Mr. S Ponnuthurai',           (SELECT id FROM departments WHERE name='AI&DS'), 'Assistant Professor', 'M.E',                'https://saranathan.ac.in/images/ponnuthurai7122.jpg',           'ponnuthurai7122@saranathan.ac.in'),
('Mr. P Dineshkumar',           (SELECT id FROM departments WHERE name='AI&DS'), 'Assistant Professor', 'M.Tech.',            'https://saranathan.ac.in/images/dineshkumar7181.jpg',           'dineshkumar7181@saranathan.ac.in'),
('Ms. T Anita Dorothy',         (SELECT id FROM departments WHERE name='AI&DS'), 'Assistant Professor', 'M.E.',               'https://saranathan.ac.in/images/anitadorothy-aid.jpg',          'anitadorothy-aid@saranathan.ac.in'),
('Ms. P Preethy Janet',         (SELECT id FROM departments WHERE name='AI&DS'), 'Assistant Professor', 'M.E',                'https://saranathan.ac.in/images/preethyjanet7134.jpg',          'preethyjanet7134@saranathan.ac.in'),
('Ms. D Mangalambigai',         (SELECT id FROM departments WHERE name='AI&DS'), 'Assistant Professor', 'M.E',                'https://saranathan.ac.in/images/mangalambigai7126.jpg',         'mangalambigai7126@saranathan.ac.in'),
('Ms. S Renganayaki',           (SELECT id FROM departments WHERE name='AI&DS'), 'Assistant Professor', 'M.Sc., M.Phil., M.E','https://saranathan.ac.in/images/renganayaki7142.jpg',           'renganayaki7142@saranathan.ac.in'),
('Ms. A Kayal',                 (SELECT id FROM departments WHERE name='AI&DS'), 'Assistant Professor', 'M.E.',               'https://saranathan.ac.in/images/kayal-aid.jpg',                 'kayal-aid@saranathan.ac.in'),
('Ms. G Nithyalakshmi',         (SELECT id FROM departments WHERE name='AI&DS'), 'Assistant Professor', 'M.E.',               'https://saranathan.ac.in/images/nithyalakshmi-aid.jpg',         'nithyalakshmi-aid@saranathan.ac.in'),
('Ms. C Gohila Priyadharshini', (SELECT id FROM departments WHERE name='AI&DS'), 'Assistant Professor', 'M.E',                'https://saranathan.ac.in/images/gohila%20priyadharshini7130.jpg','gohila priyadharshini7130@saranathan.ac.in'),
('Ms. A Pushpa',                (SELECT id FROM departments WHERE name='AI&DS'), 'Assistant Professor', 'M.Tech',             'https://saranathan.ac.in/images/pushpa7140.jpg',                'pushpa7140@saranathan.ac.in');

-- ===================== Civil =====================
INSERT INTO faculty (name, department_id, designation, qualification, photo_url, contact_email) VALUES
('Dr. A Belin Jude',    (SELECT id FROM departments WHERE name='Civil'), 'Associate Professor & Head', 'M.Tech., Ph.D', 'https://saranathan.ac.in/images/belin-ce.jpg',         'belin-ce@saranathan.ac.in'),
('Ms. K Sathya Prabha', (SELECT id FROM departments WHERE name='Civil'), 'Assistant Professor',        'M.E',           'https://saranathan.ac.in/images/sathyaprabha-ce.jpg',  'sathyaprabha-ce@saranathan.ac.in'),
('Mr. A Anandraj',      (SELECT id FROM departments WHERE name='Civil'), 'Assistant Professor',        'M.Tech.',       'https://saranathan.ac.in/images/anandraj-ce.jpg',      'anandraj-ce@saranathan.ac.in'),
('Mr. B Sekar',         (SELECT id FROM departments WHERE name='Civil'), 'Assistant Professor',        'M.E.',          'https://saranathan.ac.in/images/sekar7132.jpg',        'sekar7132@saranathan.ac.in'),
('Mr. C Kesava Raja',   (SELECT id FROM departments WHERE name='Civil'), 'Assistant Professor',        'M.E.',          'https://saranathan.ac.in/images/kesavaraja-ce.jpg',    'kesavaraja-ce@saranathan.ac.in'),
('Mr. G Venkatesan',    (SELECT id FROM departments WHERE name='Civil'), 'Assistant Professor',        'M.Tech.',       'https://saranathan.ac.in/images/venkatesan-ce.jpg',    'venkatesan-ce@saranathan.ac.in'),
('Mr. S Kannan',        (SELECT id FROM departments WHERE name='Civil'), 'Assistant Professor',        'M.E.',          'https://saranathan.ac.in/images/kannan7154.jpg',       'kannan7154@saranathan.ac.in');

-- ===================== CSBS =====================
INSERT INTO faculty (name, department_id, designation, qualification, photo_url, contact_email) VALUES
('Dr. S Venkatasubramanian',(SELECT id FROM departments WHERE name='CSBS'), 'Associate Professor & Head','M.E., Ph.D', 'https://saranathan.ac.in/images/veeyes.jpg',           'veeyes@saranathan.ac.in'),
('Ms. A Subasri',           (SELECT id FROM departments WHERE name='CSBS'), 'Assistant Professor',       'M.E',        'https://saranathan.ac.in/images/subasri7117.jpg',      'subasri7117@saranathan.ac.in'),
('Mr. R Kannan',            (SELECT id FROM departments WHERE name='CSBS'), 'Assistant Professor',       'M.E',        'https://saranathan.ac.in/images/kannan7137.jpg',       'kannan7137@saranathan.ac.in'),
('Mr. K Vijayaragavan',     (SELECT id FROM departments WHERE name='CSBS'), 'Assistant Professor',       'MCA., M.E.', 'https://saranathan.ac.in/images/vijayaragavan7156.jpg', 'vijayaragavan7156@saranathan.ac.in'),
('Mr. S Senthil',           (SELECT id FROM departments WHERE name='CSBS'), 'Assistant Professor',       'M.E',        'https://saranathan.ac.in/images/senthil7111.jpg',      'senthil7111@saranathan.ac.in'),
('Ms. V Ranjani',           (SELECT id FROM departments WHERE name='CSBS'), 'Assistant Professor',       'M.E.',       'https://saranathan.ac.in/images/ranjani-aiml.jpg',     'ranjani-aiml@saranathan.ac.in'),
('Ms. M Arunadevi',         (SELECT id FROM departments WHERE name='CSBS'), 'Assistant Professor',       'M.E.',       'https://saranathan.ac.in/images/arunadevi7171.jpg',    'arunadevi7171@saranathan.ac.in'),
('Ms. A Abirami',           (SELECT id FROM departments WHERE name='CSBS'), 'Assistant Professor',       'M.E',        'https://saranathan.ac.in/images/abirami7123.jpg',      'abirami7123@saranathan.ac.in'),
('Ms. A Thenmozhi',         (SELECT id FROM departments WHERE name='CSBS'), 'Assistant Professor',       'M.E.',       'https://saranathan.ac.in/images/thenmozhi-it.jpg',     'thenmozhi-it@saranathan.ac.in'),
('Ms. S Subiksha',          (SELECT id FROM departments WHERE name='CSBS'), 'Assistant Professor',       'M.Tech.',    'https://saranathan.ac.in/images/subiksha7187.jpg',     'subiksha7187@saranathan.ac.in');

-- ===================== CSE =====================
INSERT INTO faculty (name, department_id, designation, qualification, photo_url, contact_email) VALUES
('Dr. V Punitha',          (SELECT id FROM departments WHERE name='CSE'), 'Professor & Head',    'M.E., Ph.D',  'https://saranathan.ac.in/images/punitha-it.jpg',                'punitha-it@saranathan.ac.in'),
('Dr. R Senthamil Selvi',  (SELECT id FROM departments WHERE name='CSE'), 'Professor',           'M.E., Ph.D.', 'https://saranathan.ac.in/images/senthamilselvi-cse.jpg',         'senthamilselvi-cse@saranathan.ac.in'),
('Dr. S Mohana',           (SELECT id FROM departments WHERE name='CSE'), 'Professor',           'M.E., Ph.D',  'https://saranathan.ac.in/images/mohana-cse.jpg',                'mohana-cse@saranathan.ac.in'),
('Dr. K.S Chandrasekaran', (SELECT id FROM departments WHERE name='CSE'), 'Associate Professor', 'M.E., Ph.D.', 'https://saranathan.ac.in/images/chandrasekaran-cse.jpg',         'chandrasekaran-cse@saranathan.ac.in'),
('Dr. S Rajalakshmi',      (SELECT id FROM departments WHERE name='CSE'), 'Assistant Professor', 'M.E., Ph.D',  'https://saranathan.ac.in/images/rajalakshmi7103.jpg',            'rajalakshmi7103@saranathan.ac.in'),
('Mr. D Boobala Muralitharan',(SELECT id FROM departments WHERE name='CSE'),'Assistant Professor','M.E.',       'https://saranathan.ac.in/images/boobala-cse.jpg',               'boobala-cse@saranathan.ac.in'),
('Ms. R Sugantha Lakshmi', (SELECT id FROM departments WHERE name='CSE'), 'Assistant Professor', 'M.E',         'https://saranathan.ac.in/images/sugantha%20lakshmi7127.jpg',     'sugantha lakshmi7127@saranathan.ac.in'),
('Ms. T Nagalakshmi',      (SELECT id FROM departments WHERE name='CSE'), 'Assistant Professor', 'M.E',         'https://saranathan.ac.in/images/nagalakshmi7160.jpg',            'nagalakshmi7160@saranathan.ac.in'),
('Mr. R Karthik',          (SELECT id FROM departments WHERE name='CSE'), 'Assistant Professor', 'M.E.',        'https://saranathan.ac.in/images/karthik-cse.jpg',               'karthik-cse@saranathan.ac.in'),
('Ms. K Mohanappriya',     (SELECT id FROM departments WHERE name='CSE'), 'Assistant Professor', 'M.E.',        'https://saranathan.ac.in/images/mohanapriya-cse.jpg',            'mohanapriya-cse@saranathan.ac.in'),
('Ms. J Sathiaparkavi',    (SELECT id FROM departments WHERE name='CSE'), 'Assistant Professor', 'M.E.',        'https://saranathan.ac.in/images/parkavi-cse.jpg',               'parkavi-cse@saranathan.ac.in'),
('Ms. E Shapna Rani',      (SELECT id FROM departments WHERE name='CSE'), 'Assistant Professor', 'M.E',         'https://saranathan.ac.in/images/shapnarani-cse.jpg',             'shapnarani-cse@saranathan.ac.in'),
('Ms. P Rohini',           (SELECT id FROM departments WHERE name='CSE'), 'Assistant Professor', 'M.E',         'https://saranathan.ac.in/images/rohini%207133.jpg',              'rohini 7133@saranathan.ac.in'),
('Ms. C Maria Rhythm',     (SELECT id FROM departments WHERE name='CSE'), 'Assistant Professor', 'M.E.',        'https://saranathan.ac.in/images/mariarhythm7182.jpg',            'mariarhythm7182@saranathan.ac.in'),
('Ms. A Rachel Roselin',   (SELECT id FROM departments WHERE name='CSE'), 'Assistant Professor', 'M.E',         'https://saranathan.ac.in/images/rachelroselin7158.jpg',          'rachelroselin7158@saranathan.ac.in'),
('Ms. N Ramya',            (SELECT id FROM departments WHERE name='CSE'), 'Assistant Professor', 'M.E',         'https://saranathan.ac.in/images/ramya-cse.jpg',                 'ramya-cse@saranathan.ac.in'),
('Mr. L Parthipan',        (SELECT id FROM departments WHERE name='CSE'), 'Assistant Professor', 'M.E',         'https://saranathan.ac.in/images/parthipan7129.jpg',              'parthipan7129@saranathan.ac.in'),
('Ms. G Sathya',           (SELECT id FROM departments WHERE name='CSE'), 'Assistant Professor', 'M.E',         'https://saranathan.ac.in/images/sathya7144.jpg',                'sathya7144@saranathan.ac.in'),
('Ms. G Roshini',          (SELECT id FROM departments WHERE name='CSE'), 'Assistant Professor', 'M.Tech.',     'https://saranathan.ac.in/images/roshini7146.jpg',               'roshini7146@saranathan.ac.in');

-- ===================== CSE(AI&ML) =====================
INSERT INTO faculty (name, department_id, designation, qualification, photo_url, contact_email) VALUES
('Dr. A Delphin Carolina Rani',(SELECT id FROM departments WHERE name='CSE(AI&ML)'), 'Professor & Head',    'M.E., Ph.D', 'https://saranathan.ac.in/images/delphincarolinarani7163.jpg','delphincarolinarani7163@saranathan.ac.in'),
('Dr. B Rethina Kumar',        (SELECT id FROM departments WHERE name='CSE(AI&ML)'), 'Assistant Professor', 'M.E., Ph.D', 'https://saranathan.ac.in/images/rethinakumar-cse.jpg',       'rethinakumar-cse@saranathan.ac.in'),
('Ms. S Puvaneswari',          (SELECT id FROM departments WHERE name='CSE(AI&ML)'), 'Assistant Professor', 'M.E',        'https://saranathan.ac.in/images/puvaneswari7125.jpg',        'puvaneswari7125@saranathan.ac.in'),
('Mr. S Amirthalingam',        (SELECT id FROM departments WHERE name='CSE(AI&ML)'), 'Assistant Professor', 'M.E',        'https://saranathan.ac.in/images/amirthalingam7148.jpg',      'amirthalingam7148@saranathan.ac.in'),
('Mr. P Manikandan',           (SELECT id FROM departments WHERE name='CSE(AI&ML)'), 'Assistant Professor', 'M.E',        'https://saranathan.ac.in/images/manikandan7153.jpg',         'manikandan7153@saranathan.ac.in'),
('Ms. L Manimegalai',          (SELECT id FROM departments WHERE name='CSE(AI&ML)'), 'Assistant Professor', 'M.E.',       'https://saranathan.ac.in/images/manimegalai7178.jpg',        'manimegalai7178@saranathan.ac.in'),
('Ms. S Srimathi',             (SELECT id FROM departments WHERE name='CSE(AI&ML)'), 'Assistant Professor', 'M.Tech.',    'https://saranathan.ac.in/images/srimathi7168.jpg',           'srimathi7168@saranathan.ac.in'),
('Ms. P Kaviya',               (SELECT id FROM departments WHERE name='CSE(AI&ML)'), 'Assistant Professor', 'M.E.',       'https://saranathan.ac.in/images/kaviya-cse.jpg',             'kaviya-cse@saranathan.ac.in'),
('Ms. J J Arulsheela',         (SELECT id FROM departments WHERE name='CSE(AI&ML)'), 'Assistant Professor', 'M.Tech.',    'https://saranathan.ac.in/images/arulsheela7157.jpg',         'arulsheela7157@saranathan.ac.in');

-- ===================== EEE =====================
INSERT INTO faculty (name, department_id, designation, qualification, photo_url, contact_email) VALUES
('Dr. C Krishnakumar',     (SELECT id FROM departments WHERE name='EEE'), 'Professor & Head',    'M.Tech., Ph.D', 'https://saranathan.ac.in/images/krishnakumar-eee.jpg',     'krishnakumar-eee@saranathan.ac.in'),
('Dr. M.V Suganyadevi',    (SELECT id FROM departments WHERE name='EEE'), 'Professor',           'M.E., Ph.D',    'https://saranathan.ac.in/images/suganyadevi-eee.jpg',       'suganyadevi-eee@saranathan.ac.in'),
('Dr. D Kalyana Kumar',    (SELECT id FROM departments WHERE name='EEE'), 'Professor',           'M.Tech., Ph.D', 'https://saranathan.ac.in/images/kalyanakumar-eee.jpg',      'kalyanakumar-eee@saranathan.ac.in'),
('Dr. M Marimuthu',        (SELECT id FROM departments WHERE name='EEE'), 'Associate Professor', 'M.E., Ph.D',    'https://saranathan.ac.in/images/marimuthu-eee.jpg',         'marimuthu-eee@saranathan.ac.in'),
('Dr. S Ram Prasath',      (SELECT id FROM departments WHERE name='EEE'), 'Assistant Professor', 'M.Tech., Ph.D', 'https://saranathan.ac.in/images/ramprasath-eee.jpg',        'ramprasath-eee@saranathan.ac.in'),
('Dr. P Ram Prakash',      (SELECT id FROM departments WHERE name='EEE'), 'Assistant Professor', 'M.E., Ph.D',    'https://saranathan.ac.in/images/ramprakash-eee.jpg',        'ramprakash-eee@saranathan.ac.in'),
('Dr. R Vijay',            (SELECT id FROM departments WHERE name='EEE'), 'Assistant Professor', 'M.Tech., Ph.D', 'https://saranathan.ac.in/images/vijay-eee.jpg',             'vijay-eee@saranathan.ac.in'),
('Dr. N Gayathri',         (SELECT id FROM departments WHERE name='EEE'), 'Assistant Professor', 'M.E., Ph.D',    'https://saranathan.ac.in/images/gayathri-eee.jpg',          'gayathri-eee@saranathan.ac.in'),
('Ms. C Pearline Kamalini',(SELECT id FROM departments WHERE name='EEE'), 'Assistant Professor', 'M.E.',          'https://saranathan.ac.in/images/pearline-eee.jpg',          'pearline-eee@saranathan.ac.in'),
('Mr. B Paranthagan',      (SELECT id FROM departments WHERE name='EEE'), 'Assistant Professor', 'M.E.',          'https://saranathan.ac.in/images/paranthagan-eee.jpg',       'paranthagan-eee@saranathan.ac.in'),
('Mr. R Balasubramanian',  (SELECT id FROM departments WHERE name='EEE'), 'Assistant Professor', 'M.E.',          'https://saranathan.ac.in/images/balasubramanian-eee.jpg',   'balasubramanian-eee@saranathan.ac.in'),
('Mr. P Rameshbabu',       (SELECT id FROM departments WHERE name='EEE'), 'Assistant Professor', 'M.E.',          'https://saranathan.ac.in/images/rameshbabu-eee.jpg',        'rameshbabu-eee@saranathan.ac.in'),
('Mr. R Sridhar',          (SELECT id FROM departments WHERE name='EEE'), 'Assistant Professor', 'M.Tech.',       'https://saranathan.ac.in/images/sridhar-eee.jpg',           'sridhar-eee@saranathan.ac.in'),
('Mr. S Vigneshwaran',     (SELECT id FROM departments WHERE name='EEE'), 'Assistant Professor', 'M.E',           'https://saranathan.ac.in/images/vigneshwarans-ice.jpg',     'vigneshwarans-ice@saranathan.ac.in');

-- ===================== ICE =====================
INSERT INTO faculty (name, department_id, designation, qualification, photo_url, contact_email) VALUES
('Dr. K Gaayathry',         (SELECT id FROM departments WHERE name='ICE'), 'Associate Professor & Head', 'M.E., Ph.D',    'https://saranathan.ac.in/images/gaayathry-ice.jpg',     'gaayathry-ice@saranathan.ac.in'),
('Dr. M Shanmugavalli',     (SELECT id FROM departments WHERE name='ICE'), 'Professor',                  'M.Tech., Ph.D', 'https://saranathan.ac.in/images/shanmugavalli-ice.jpg', 'shanmugavalli-ice@saranathan.ac.in'),
('Dr. A Gopikrishnan',      (SELECT id FROM departments WHERE name='ICE'), 'Assistant Professor',         'M.E., Ph.D',    'https://saranathan.ac.in/images/gopi-ice.jpg',          'gopi-ice@saranathan.ac.in'),
('Mr. R Satheesh',          (SELECT id FROM departments WHERE name='ICE'), 'Assistant Professor',         'M.E.',          'https://saranathan.ac.in/images/satheesh-eee.jpg',      'satheesh-eee@saranathan.ac.in'),
('Mr. R Seetharaman',       (SELECT id FROM departments WHERE name='ICE'), 'Assistant Professor',         'M.Tech.',       'https://saranathan.ac.in/images/seetharaman-ice.jpg',   'seetharaman-ice@saranathan.ac.in'),
('Mr. S Prassanna Perumal', (SELECT id FROM departments WHERE name='ICE'), 'Assistant Professor',         'M.E.',          'https://saranathan.ac.in/images/prassanna-ice.jpg',     'prassanna-ice@saranathan.ac.in');

-- ===================== IT =====================
INSERT INTO faculty (name, department_id, designation, qualification, photo_url, contact_email) VALUES
('Dr. R Thillaikarasi',             (SELECT id FROM departments WHERE name='IT'), 'Professor & Head',    'M.Tech., Ph.D', 'https://saranathan.ac.in/images/thillai-cse.jpg',         'thillai-cse@saranathan.ac.in'),
('Dr. R Rengaraj alias Muralidharan',(SELECT id FROM departments WHERE name='IT'),'Assistant Professor', 'M.E., Ph.D',    'https://saranathan.ac.in/images/rengaraj-it.jpg',         'rengaraj-it@saranathan.ac.in'),
('Ms. J Sangeethapriya',            (SELECT id FROM departments WHERE name='IT'), 'Assistant Professor', 'M.Tech.',       'https://saranathan.ac.in/images/jspriya-it.jpg',          'jspriya-it@saranathan.ac.in'),
('Mr. V Senthil Balaji',            (SELECT id FROM departments WHERE name='IT'), 'Assistant Professor', 'M.E.',          'https://saranathan.ac.in/images/senthilbalaji-it.jpg',    'senthilbalaji-it@saranathan.ac.in'),
('Ms. A Sheelavathi',               (SELECT id FROM departments WHERE name='IT'), 'Assistant Professor', 'M.E.',          'https://saranathan.ac.in/images/sheelavathi-it.jpg',      'sheelavathi-it@saranathan.ac.in'),
('Mr. D Raghu Raman',               (SELECT id FROM departments WHERE name='IT'), 'Assistant Professor', 'M.E.',          'https://saranathan.ac.in/images/raghuraman7188.jpg',      'raghuraman7188@saranathan.ac.in'),
('Ms. K Muthukarupaee',             (SELECT id FROM departments WHERE name='IT'), 'Assistant Professor', 'M.E.',          'https://saranathan.ac.in/images/muthukarupaee-it.jpg',    'muthukarupaee-it@saranathan.ac.in'),
('Ms. M Jebarani',                  (SELECT id FROM departments WHERE name='IT'), 'Assistant Professor', 'M.E',           'https://saranathan.ac.in/images/jebarani7104.jpg',        'jebarani7104@saranathan.ac.in'),
('Ms. G Sathiya',                   (SELECT id FROM departments WHERE name='IT'), 'Assistant Professor', 'M.E',           'https://saranathan.ac.in/images/sathiya-cse.jpg',         'sathiya-cse@saranathan.ac.in'),
('Ms. S Angel Sweety Sheeba',       (SELECT id FROM departments WHERE name='IT'), 'Assistant Professor', 'M.E.',          'https://saranathan.ac.in/images/angel-it.jpg',            'angel-it@saranathan.ac.in');

-- ===================== MECH =====================
INSERT INTO faculty (name, department_id, designation, qualification, photo_url, contact_email) VALUES
('Dr. R Rekha',               (SELECT id FROM departments WHERE name='MECH'), 'Professor & HoD i/c', 'M.Tech., Ph.D', 'https://saranathan.ac.in/images/rekha-mech.jpg',          'rekha-mech@saranathan.ac.in'),
('Dr. D Valavan',             (SELECT id FROM departments WHERE name='MECH'), 'Professor',           'M.Tech., Ph.D', 'https://saranathan.ac.in/images/principal.jpg',            'principal@saranathan.ac.in'),
('Dr. N Baskar',              (SELECT id FROM departments WHERE name='MECH'), 'Professor',           'M.E., Ph.D',    'https://saranathan.ac.in/images/baskar-mech.jpg',          'baskar-mech@saranathan.ac.in'),
('Dr. M R Anantha Padmanaban',(SELECT id FROM departments WHERE name='MECH'), 'Associate Professor', 'M.E., Ph.D',    'https://saranathan.ac.in/images/mrpadmanaban-mech.jpg',    'mrpadmanaban-mech@saranathan.ac.in'),
('Dr. G Mahesh',              (SELECT id FROM departments WHERE name='MECH'), 'Associate Professor', 'M.Tech., Ph.D', 'https://saranathan.ac.in/images/mahesh-mech.jpg',          'mahesh-mech@saranathan.ac.in'),
('Dr. A Mercy Vasan',         (SELECT id FROM departments WHERE name='MECH'), 'Associate Professor', 'M.E., Ph.D',    'https://saranathan.ac.in/images/mercyvasan-mech.jpg',      'mercyvasan-mech@saranathan.ac.in'),
('Dr. M Ganesan',             (SELECT id FROM departments WHERE name='MECH'), 'Associate Professor', 'M.E., Ph.D',    'https://saranathan.ac.in/images/ganesan-mech.jpg',         'ganesan-mech@saranathan.ac.in'),
('Dr. M Varatharajulu',       (SELECT id FROM departments WHERE name='MECH'), 'Associate Professor', 'M.Tech., Ph.D', 'https://saranathan.ac.in/images/varatharajulu7110.jpg',     'varatharajulu7110@saranathan.ac.in'),
('Dr. S Karthikeyan',         (SELECT id FROM departments WHERE name='MECH'), 'Assistant Professor', 'M.E., Ph.D',    'https://saranathan.ac.in/images/karthikeyan-mech.jpg',     'karthikeyan-mech@saranathan.ac.in'),
('Mr. R Sureshbabu',          (SELECT id FROM departments WHERE name='MECH'), 'Assistant Professor', 'M.Tech.',       'https://saranathan.ac.in/images/sureshbabu-mech.jpg',      'sureshbabu-mech@saranathan.ac.in'),
('Mr. P Sathis Kumar',        (SELECT id FROM departments WHERE name='MECH'), 'Assistant Professor', 'M.E',           'https://saranathan.ac.in/images/sathiskumar7112.jpg',      'sathiskumar7112@saranathan.ac.in'),
('Mr. A Ravindran',           (SELECT id FROM departments WHERE name='MECH'), 'Assistant Professor', 'M.E.',          'https://saranathan.ac.in/images/ravindran7099.jpg',        'ravindran7099@saranathan.ac.in'),
('Mr. P V Rajesh',            (SELECT id FROM departments WHERE name='MECH'), 'Assistant Professor', 'M.E.',          'https://saranathan.ac.in/images/rajesh-mech.jpg',          'rajesh-mech@saranathan.ac.in'),
('Mr. S Vinoth Kumar',        (SELECT id FROM departments WHERE name='MECH'), 'Assistant Professor', 'M.Tech.',       'https://saranathan.ac.in/images/vinothkumar-mech.jpg',     'vinothkumar-mech@saranathan.ac.in'),
('Mr. P Vigneshwar',          (SELECT id FROM departments WHERE name='MECH'), 'Assistant Professor', 'M.E',           'https://saranathan.ac.in/images/vigneshwar-mech.jpg',      'vigneshwar-mech@saranathan.ac.in'),
('Mr. K Amarnath',            (SELECT id FROM departments WHERE name='MECH'), 'Assistant Professor', 'M.E',           'https://saranathan.ac.in/images/amar-mech.jpg',            'amar-mech@saranathan.ac.in');

-- ===================== MBA =====================
INSERT INTO faculty (name, department_id, designation, qualification, photo_url, contact_email) VALUES
('Dr. K Karthikeyan',    (SELECT id FROM departments WHERE name='MBA'), 'Professor & Head',    'M.B.A., Ph.D. (NET Qualified)', 'https://saranathan.ac.in/images/karthikeyan-mba.jpg', 'karthikeyan-mba@saranathan.ac.in'),
('Dr. V Mahalakshmi',    (SELECT id FROM departments WHERE name='MBA'), 'Associate Professor', 'MBA, M.Phil, Ph.D',             'https://saranathan.ac.in/images/mahalakshmi-mba.jpg', 'mahalakshmi-mba@saranathan.ac.in'),
('Dr. S Saravanan',      (SELECT id FROM departments WHERE name='MBA'), 'Assistant Professor', 'B.E., M.B.A., Ph.D',           'https://saranathan.ac.in/images/saravanan-mba.jpg',   'saravanan-mba@saranathan.ac.in'),
('Mr. S Syed Muthaliff', (SELECT id FROM departments WHERE name='MBA'), 'Assistant Professor', 'M.B.A., M.Phil.',              'https://saranathan.ac.in/images/syed-mba.jpg',        'syed-mba@saranathan.ac.in'),
('Ms. C R Surekha',      (SELECT id FROM departments WHERE name='MBA'), 'Assistant Professor', 'M.B.A',                        'https://saranathan.ac.in/images/surekha7139.jpg',     'surekha7139@saranathan.ac.in'),
('Mr. M Ashwin',         (SELECT id FROM departments WHERE name='MBA'), 'Assistant Professor', 'B.E., M.B.A',                  'https://saranathan.ac.in/images/ashwin7162.jpg',      'ashwin7162@saranathan.ac.in');

-- ===================== Chemistry =====================
INSERT INTO faculty (name, department_id, designation, qualification, photo_url, contact_email) VALUES
('Dr. L Muruganandam', (SELECT id FROM departments WHERE name='CHE'), 'Associate Professor & Head', 'M.Sc., M.Phil., B.Ed., Ph.D', 'https://saranathan.ac.in/images/muruganandam-che.jpg', 'muruganandam-che@saranathan.ac.in'),
('Dr. V Balamurugan',  (SELECT id FROM departments WHERE name='CHE'), 'Assistant Professor',        'M.Sc., M.Phil., Ph.D',        'https://saranathan.ac.in/images/balamurugan-che.jpg', 'balamurugan-che@saranathan.ac.in'),
('Dr. G Thulasi',      (SELECT id FROM departments WHERE name='CHE'), 'Assistant Professor',        'M.Sc., M.Phil., Ph.D',        'https://saranathan.ac.in/images/thulasi-che.jpg',     'thulasi-che@saranathan.ac.in'),
('Dr. S Priyarega',    (SELECT id FROM departments WHERE name='CHE'), 'Assistant Professor',        'M.Sc., M.Phil., Ph.D',        'https://saranathan.ac.in/images/priyarega-che.jpg',   'priyarega-che@saranathan.ac.in'),
('Mr. A Lakshmanan',   (SELECT id FROM departments WHERE name='CHE'), 'Assistant Professor',        'M.Sc., M.Phil.',              'https://saranathan.ac.in/images/lakshmanan-che.jpg',  'lakshmanan-che@saranathan.ac.in');

-- ===================== English =====================
INSERT INTO faculty (name, department_id, designation, qualification, photo_url, contact_email) VALUES
('Dr. M Bhuvaneswari',      (SELECT id FROM departments WHERE name='ENG'), 'Assistant Professor & HOD', 'M.A., M.Phil., B.Ed., Ph.D', 'https://saranathan.ac.in/images/bhuvaneswari-eng.jpg',     'bhuvaneswari-eng@saranathan.ac.in'),
('Dr. A Lakshmi',           (SELECT id FROM departments WHERE name='ENG'), 'Assistant Professor',       'M.A., M.Phil., Ph.D',        'https://saranathan.ac.in/images/lakshmi-eng.jpg',          'lakshmi-eng@saranathan.ac.in'),
('Dr. G Sriram',            (SELECT id FROM departments WHERE name='ENG'), 'Assistant Professor',       'M.A., M.Phil., PGDCA., Ph.D','https://saranathan.ac.in/images/sriram-eng.jpg',           'sriram-eng@saranathan.ac.in'),
('Dr. G Vijayarenganayaki', (SELECT id FROM departments WHERE name='ENG'), 'Assistant Professor',       'M.A., M.Phil.',              'https://saranathan.ac.in/images/vijayarenganayaki7164.jpg','vijayarenganayaki7164@saranathan.ac.in'),
('Mr. C Gnanadesikan',      (SELECT id FROM departments WHERE name='ENG'), 'Assistant Professor',       'M.A., M.Phil.',              'https://saranathan.ac.in/images/gnanadesikan-eng.jpg',     'gnanadesikan-eng@saranathan.ac.in');

-- ===================== Mathematics =====================
INSERT INTO faculty (name, department_id, designation, qualification, photo_url, contact_email) VALUES
('Dr. R Neelambari',      (SELECT id FROM departments WHERE name='MAT'), 'Associate Professor',       'M.Sc., M.Phil., TNSET Qualified, Ph.D',         'https://saranathan.ac.in/images/neelambari-mat.jpg',    'neelambari-mat@saranathan.ac.in'),
('Dr. G Ravichandran',    (SELECT id FROM departments WHERE name='MAT'), 'Assistant Professor & HOD', 'M.Sc., M.Phil., PGDCA, Ph.D',                   'https://saranathan.ac.in/images/ravichandran-mat.jpg',  'ravichandran-mat@saranathan.ac.in'),
('Dr. D Geetha',          (SELECT id FROM departments WHERE name='MAT'), 'Assistant Professor',       'M.Sc., M.Phil., Ph.D',                          'https://saranathan.ac.in/images/geetha-mat.jpg',        'geetha-mat@saranathan.ac.in'),
('Dr. S Anupriya',        (SELECT id FROM departments WHERE name='MAT'), 'Assistant Professor',       'M.Sc., M.Phil., Ph.D',                          'https://saranathan.ac.in/images/anu-mat.jpg',           'anu-mat@saranathan.ac.in'),
('Dr. S Sivamani',        (SELECT id FROM departments WHERE name='MAT'), 'Assistant Professor',       'M.Sc., M.Phil., PGDAOR, TNSET Qualified, Ph.D', 'https://saranathan.ac.in/images/sivamani-mat.jpg',      'sivamani-mat@saranathan.ac.in'),
('Dr. S Revathi',         (SELECT id FROM departments WHERE name='MAT'), 'Assistant Professor',       'M.Sc., M.Phil., TNSET Qualified, Ph.D',         'https://saranathan.ac.in/images/revathi-mat.jpg',       'revathi-mat@saranathan.ac.in'),
('Dr. S Arunkumar',       (SELECT id FROM departments WHERE name='MAT'), 'Assistant Professor',       'M.Sc., M.Phil., Ph.D',                          'https://saranathan.ac.in/images/arunkumar-mat.jpg',     'arunkumar-mat@saranathan.ac.in'),
('Dr. P.K Lakshmidevi',   (SELECT id FROM departments WHERE name='MAT'), 'Assistant Professor',       'M.Sc., M.Phil., TNSET Qualified, Ph.D',         'https://saranathan.ac.in/images/lakshmidevi-mat.jpg',   'lakshmidevi-mat@saranathan.ac.in'),
('Dr. T Prabha',          (SELECT id FROM departments WHERE name='MAT'), 'Assistant Professor',       'M.Sc., M.Phil., Ph.D',                          'https://saranathan.ac.in/images/prabha-mat.jpg',        'prabha-mat@saranathan.ac.in'),
('Dr. N Subashini',       (SELECT id FROM departments WHERE name='MAT'), 'Assistant Professor',       'M.Sc., M.Phil., TNSET Qualified, Ph.D',         'https://saranathan.ac.in/images/subhashini-mat.jpg',    'subhashini-mat@saranathan.ac.in'),
('Dr. V.S Akilandeswari', (SELECT id FROM departments WHERE name='MAT'), 'Assistant Professor',       'M.Sc., TNSET Qualified, Ph.D',                  'https://saranathan.ac.in/images/akilandeswari-mat.jpg', 'akilandeswari-mat@saranathan.ac.in'),
('Dr. R Buvaneswari',     (SELECT id FROM departments WHERE name='MAT'), 'Assistant Professor',       'M.Sc., M.Phil., Ph.D',                          'https://saranathan.ac.in/images/buvaneswari-mat.jpg',   'buvaneswari-mat@saranathan.ac.in'),
('Dr. S Dinesh',          (SELECT id FROM departments WHERE name='MAT'), 'Assistant Professor',       'M.Sc., Ph.D',                                   'https://saranathan.ac.in/images/dinesh-mat.jpg',        'dinesh-mat@saranathan.ac.in');

-- ===================== Physics =====================
INSERT INTO faculty (name, department_id, designation, qualification, photo_url, contact_email) VALUES
('Dr. R Mariappan',        (SELECT id FROM departments WHERE name='PHY'), 'Assistant Professor & Head', 'M.Sc., M.E, Ph.D',                     'https://saranathan.ac.in/images/mariappan-phy.jpg',       'mariappan-phy@saranathan.ac.in'),
('Dr. P Senthilkumar',     (SELECT id FROM departments WHERE name='PHY'), 'Assistant Professor',        'M.Sc., M.Phil, Ph.D',                  'https://saranathan.ac.in/images/senthilkumar-phy.jpg',    'senthilkumar-phy@saranathan.ac.in'),
('Dr. K Karthikeyan',      (SELECT id FROM departments WHERE name='PHY'), 'Assistant Professor',        'M.Sc., M.Phil, Ph.D',                  'https://saranathan.ac.in/images/karthikeyan-phy.jpg',     'karthikeyan-phy@saranathan.ac.in'),
('Dr. M Murali',           (SELECT id FROM departments WHERE name='PHY'), 'Assistant Professor',        'M.Sc., M.Phil., TNSET Qualified, Ph.D','https://saranathan.ac.in/images/murali-phy.jpg',           'murali-phy@saranathan.ac.in'),
('Dr. M Nidya',            (SELECT id FROM departments WHERE name='PHY'), 'Assistant Professor',        'M.Sc., M.Phil., Ph.D',                 'https://saranathan.ac.in/images/nidya-phy.jpg',           'nidya-phy@saranathan.ac.in'),
('Mr. G Anantha Krishnan', (SELECT id FROM departments WHERE name='PHY'), 'Assistant Professor',        'M.Sc., M.Phil.',                       'https://saranathan.ac.in/images/ananthakrishnan-phy.jpg', 'ananthakrishnan-phy@saranathan.ac.in'),
('Ms. P Saravana Devi',    (SELECT id FROM departments WHERE name='PHY'), 'Assistant Professor',        'M.Sc., M.Phil.',                       'https://saranathan.ac.in/images/saravanadevi-phy.jpg',    'saravanadevi-phy@saranathan.ac.in');

-- ===================== Tamil =====================
INSERT INTO faculty (name, department_id, designation, qualification, photo_url, contact_email) VALUES
('Dr. M Thangam', (SELECT id FROM departments WHERE name='TAM'), 'Assistant Professor', 'M.Phil., Ph.D', 'https://saranathan.ac.in/images/thangam7092.jpg', 'thangam7092@saranathan.ac.in');
