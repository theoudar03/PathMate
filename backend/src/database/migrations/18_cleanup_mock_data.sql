-- Migration 18: Remove all fake/mock senior mentors, senior volunteers, and roommate profiles from database

DELETE FROM seniors WHERE name IN (
  'Hariharan G.', 'Nithya Sri S.', 'Rohan Jacob', 'Archana R.',
  'Karthik Subramanian', 'Priya Sundaram', 'Arun Kumar', 'Deepak Raja'
);

DELETE FROM senior_volunteers WHERE name IN (
  'Hariharan G.', 'Nithya Sri S.', 'Rohan Jacob', 'Archana R.'
);

DELETE FROM mentors WHERE name IN (
  'Hariharan G.', 'Nithya Sri S.', 'Rohan Jacob', 'Archana R.'
);

DELETE FROM roommates WHERE name IN (
  'Karthikeyan S.', 'Abishek R.', 'Priyanka M.', 'Siddharth V.',
  'Divya Dharshini K.', 'Ananya Sridhar', 'Sanjay Viswanathan', 'Rohan Ramachandran'
);
