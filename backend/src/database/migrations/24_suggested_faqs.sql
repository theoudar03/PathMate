-- Migration 24: Add suggested FAQ support columns and seed predefined chatbot questions
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS is_suggested BOOLEAN DEFAULT false;
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'help';

-- Seed 6 predefined suggested FAQ questions with answers
INSERT INTO faqs (question, answer, category, is_approved, is_suggested, icon)
SELECT 'When does first-year orientation start?',
       'First-year orientation at Saranathan College of Engineering typically begins in the first week of August, right after the admission process is completed. You will receive an official communication via email or SMS with the exact date, time, and venue. Orientation usually includes campus tours, department introductions, hostel allocation briefings, and a welcome address by the Principal.',
       'Orientation', true, true, 'event'
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE question = 'When does first-year orientation start?' AND is_suggested = true);

INSERT INTO faqs (question, answer, category, is_approved, is_suggested, icon)
SELECT 'Where is hostel room allocation conducted?',
       'Hostel room allocation is conducted at the Administrative Block (Ground Floor) of Saranathan College of Engineering. Boys Hostel allocation is handled by the Boys Hostel Warden, and Girls Hostel allocation by the Girls Hostel Warden. You need to bring your admission receipt, ID proof, and 2 passport-size photographs. Allocation is done on a first-come, first-served basis during orientation week.',
       'Hostel', true, true, 'bed'
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE question = 'Where is hostel room allocation conducted?' AND is_suggested = true);

INSERT INTO faqs (question, answer, category, is_approved, is_suggested, icon)
SELECT 'What documents do I need to bring for verification?',
       'For document verification at SCE, you need to bring:\n• Original and 2 photocopies of 10th Mark Sheet\n• Original and 2 photocopies of 12th Mark Sheet\n• Transfer Certificate (TC) from previous institution\n• Community Certificate (if applicable)\n• Income Certificate\n• Aadhaar Card (original + copy)\n• 6 passport-size photographs\n• Allotment Order from TNEA counseling\n• Medical Fitness Certificate\n\nVerification is conducted at the Admission Office in the Administrative Block.',
       'Verification', true, true, 'task'
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE question = 'What documents do I need to bring for verification?' AND is_suggested = true);

INSERT INTO faqs (question, answer, category, is_approved, is_suggested, icon)
SELECT 'How is ragging reported on campus?',
       'Saranathan College of Engineering maintains a strict zero-tolerance anti-ragging policy. If you face or witness ragging:\n• Contact the Anti-Ragging Committee immediately\n• Call the National Anti-Ragging Helpline: 1800-180-5522\n• Email: antiragging@saranathan.ac.in\n• Use the UGC Anti-Ragging Portal: antiragging.in\n• Approach any faculty member, warden, or the Dean of Student Affairs\n• Anonymous complaints can be submitted via the college grievance box near the Administrative Block\n\nAll complaints are treated with strict confidentiality and immediate action is taken.',
       'Safety', true, true, 'shield'
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE question = 'How is ragging reported on campus?' AND is_suggested = true);

INSERT INTO faqs (question, answer, category, is_approved, is_suggested, icon)
SELECT 'What are the main campus canteen timings?',
       'The SCE Main Canteen operates on the following schedule:\n• **Breakfast**: 7:30 AM – 9:00 AM\n• **Lunch**: 12:00 PM – 2:00 PM\n• **Snacks/Tea**: 3:30 PM – 5:00 PM\n• **Dinner** (Hostel students): 7:00 PM – 8:30 PM\n\nThe canteen is located behind the ECE department building. A food court with additional vendors is available near the KS Block. Vegetarian and non-vegetarian options are available. Prices are subsidized for students.',
       'Dining', true, true, 'restaurant'
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE question = 'What are the main campus canteen timings?' AND is_suggested = true);

INSERT INTO faqs (question, answer, category, is_approved, is_suggested, icon)
SELECT 'How do I sign up for the Central Library card?',
       'To get your Central Library card at SCE:\n1. Visit the Central Library on the 1st floor of the KS Block\n2. Fill out the Library Membership Form (available at the counter)\n3. Submit 1 passport-size photograph\n4. Show your college ID card or admission receipt\n5. The librarian will issue your library card within 2-3 working days\n\n**Library Timings**: Monday to Saturday, 8:30 AM – 6:00 PM\n**Digital Library**: Available with separate login credentials\n**Books allowed**: Up to 3 books for 14 days (renewable once)',
       'Academics', true, true, 'menu_book'
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE question = 'How do I sign up for the Central Library card?' AND is_suggested = true);

-- Create index for fast suggested FAQ lookups
CREATE INDEX IF NOT EXISTS idx_faqs_suggested ON faqs(is_suggested) WHERE is_suggested = true;
