import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/index.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateEmbeddings, mapTextToInterests, rankAndExplainMatches, generateChecklistFromProcess, answerGroundedQuestion, generateDigest, translateText, generateWebsiteSummary, parseNavigationQuery, askGeminiHybrid, detectIntent, askGeminiWithIntent, askGeminiAcademic, askGeminiWithWebsiteContext } from '../services/gemini.js';
import { fetchWebsiteContent, getRelevantUrl } from '../services/scraper.js';
import { authenticateToken, chatRateLimiter } from '../middleware/auth.js';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

// --- Credential generation helpers ---
// NOTE: Password reset/recovery is out of scope for this build. (Future Scope)
// Plaintext password is returned ONCE in the API response and must never be logged.
const generateUsername = (name, existingNames = []) => {
  const firstName = name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
  let attempt;
  let tries = 0;
  do {
    const suffix = Math.floor(Math.random() * 900) + 100;
    attempt = `${firstName}${suffix}`;
    tries++;
  } while (existingNames.includes(attempt) && tries < 20);
  return attempt;
};

const generatePlaintextPassword = (name) => {
  const raw = name.trim().replace(/[^a-zA-Z]/g, '');
  const padded = raw.length >= 4 ? raw.slice(0, 4) : raw.padEnd(4, raw[raw.length - 1] || 'x');
  const cased = padded.charAt(0).toUpperCase() + padded.slice(1).toLowerCase();
  const digits = Math.floor(Math.random() * 9000) + 1000;
  return `${cased}${digits}`;
};

const router = express.Router();

// --- IN-MEMORY DATABASE SIMULATOR (Fallback when PostgreSQL connection is unconfigured or fails) ---
// Helper: Ensure DB connection exists and run query
const safeDbCall = async (dbQueryFn, mockQueryFn) => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set in environment variables.");
    }
    return await dbQueryFn();
  } catch (error) {
    console.error("Database query failed:", error.message);
    throw error;
  }
};


// Static data memory-caching utility
const staticDataCache = new Map();
const getCachedData = async (key, ttlMinutes, fetchFn) => {
  const cached = staticDataCache.get(key);
  const now = Date.now();
  const ttlMs = ttlMinutes * 60 * 1000;
  
  if (cached && (now - cached.timestamp < ttlMs)) {
    console.log(`[Cache Hit] Key: ${key}`);
    return cached.data;
  }
  
  console.log(`[Cache Miss/Expired] Key: ${key}`);
  try {
    const data = await fetchFn();
    staticDataCache.set(key, { data, timestamp: now });
    return data;
  } catch (error) {
    if (cached) {
      console.warn(`[Cache Error Fallback] Returning stale data for key: ${key}. Reason: ${error.message}`);
      return cached.data;
    }
    throw error;
  }
};

// --- ENDPOINTS ---

/**
 * 0. GET /api/study/streak
 * Dynamically computes consecutive day study/task streak using PostgreSQL student_tasks completions
 */
router.get('/study/streak', authenticateToken, async (req, res) => {
  const studentId = req.user?.id || req.user?.userId;
  if (!studentId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const datesRes = await safeDbCall(
      async () => {
        return await db.query(
          `SELECT DISTINCT completed_at::date AS comp_date 
           FROM student_tasks 
           WHERE student_id = $1 AND status = 'completed' AND completed_at IS NOT NULL
           ORDER BY comp_date DESC`,
          [studentId]
        );
      },
      async () => {
        return { rows: [] }; // Mock fallback
      }
    );

    const rows = datesRes.rows || [];
    if (rows.length === 0) {
      return res.json({ success: true, streak: 0 });
    }

    let streak = 0;
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let expectedDate = today;

    // Check if the most recent completed task is today or yesterday
    let firstComp = new Date(rows[0].comp_date);
    firstComp.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(today - firstComp);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      // Streak broken (last completed task was before yesterday)
      return res.json({ success: true, streak: 0 });
    }

    expectedDate = firstComp;

    for (let i = 0; i < rows.length; i++) {
      const currentDate = new Date(rows[i].comp_date);
      currentDate.setHours(0, 0, 0, 0);

      const diff = Math.abs(expectedDate - currentDate);
      const diffD = Math.round(diff / (1000 * 60 * 60 * 24));

      if (diffD === 0) {
        streak++;
      } else if (diffD === 1) {
        streak++;
        expectedDate = currentDate;
      } else {
        break; // Streak broken
      }
    }

    return res.json({ success: true, streak });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 1. POST /api/onboarding
 * Accepts selected options + free text description, maps interests, and saves user
 */
router.post('/onboarding', async (req, res) => {
  const { name, department, isHosteller, interests = [], custom_notes, language_pref = 'en', hostel_block = 'B-Block (Boys Hostel)' } = req.body;

  try {
    const result = await safeDbCall(
      async () => {
        // Find department ID, existing usernames, and interests tags in parallel
        const [deptRes, existingUsernamesRes, interestsRes] = await Promise.all([
          db.query('SELECT id FROM departments WHERE name = $1', [department]),
          db.query('SELECT username FROM users WHERE username IS NOT NULL'),
          db.query('SELECT id, label FROM interests')
        ]);

        const deptId = deptRes.rows[0]?.id || 1;
        const existingUsernames = existingUsernamesRes.rows.map(r => r.username);
        const dbInterests = interestsRes.rows;

        // Generate credentials
        const username = generateUsername(name, existingUsernames);
        const plaintextPassword = generatePlaintextPassword(name);
        // Hash password with bcrypt (cost factor 12) — plaintext is discarded after this
        const passwordHash = await bcrypt.hash(plaintextPassword, 12);

        // Save user (with username and password_hash)
        const userRes = await db.query(
          `INSERT INTO users (name, department_id, stay_type, hostel_block, language_pref, custom_notes, username, password_hash)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [name, deptId, isHosteller ? 'hostel' : 'day_scholar', isHosteller ? hostel_block : null, language_pref, custom_notes, username, passwordHash]
        );
        const userId = userRes.rows[0].id;

        // Map custom notes to interests using Gemini
        let mappedInterestIds = [];
        if (custom_notes) {
          const geminiResult = await mapTextToInterests(custom_notes, dbInterests);
          mappedInterestIds = geminiResult.interestIds || [];
        }

        // Combine selected and Gemini matched interests
        const selectedInterestIds = dbInterests
          .filter(i => interests.includes(i.label))
          .map(i => i.id);

        const allInterestIds = Array.from(new Set([...selectedInterestIds, ...mappedInterestIds]));

        // Insert user interests
        for (const interestId of allInterestIds) {
          await db.query(
            'INSERT INTO user_interests (user_id, interest_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, interestId]
          );
        }

        // Initialize roommate opt-in record
        await db.query('INSERT INTO roommate_opt_in (user_id, is_visible) VALUES ($1, false)', [userId]);

        return { userId, username, plaintextPassword };
      },
      async () => {
        // Mock Save User — generate credentials in mock path too
        const dept = MOCK_STORE.departments.find(d => d.name === department) || MOCK_STORE.departments[0];
        const userId = MOCK_STORE.users.length + 1;

        const existingUsernames = MOCK_STORE.users.map(u => u.username).filter(Boolean);
        const username = generateUsername(name, existingUsernames);
        const plaintextPassword = generatePlaintextPassword(name);
        const passwordHash = await bcrypt.hash(plaintextPassword, 12);

        const newUser = {
          id: userId,
          name,
          department_id: dept.id,
          stay_type: isHosteller ? 'hostel' : 'day_scholar',
          hostel_block: isHosteller ? hostel_block : null,
          language_pref,
          custom_notes,
          username,
          password_hash: passwordHash // stored; plaintext is not kept
        };
        MOCK_STORE.users.push(newUser);

        // Map custom notes using simulated Gemini
        let mappedInterestIds = [];
        if (custom_notes) {
          const geminiResult = await mapTextToInterests(custom_notes, MOCK_STORE.interests);
          mappedInterestIds = geminiResult.interestIds || [];
        }

        const selectedInterestIds = MOCK_STORE.interests
          .filter(i => interests.includes(i.label))
          .map(i => i.id);

        const allInterestIds = Array.from(new Set([...selectedInterestIds, ...mappedInterestIds]));

        allInterestIds.forEach(interestId => {
          MOCK_STORE.userInterests.push({ user_id: userId, interest_id: interestId });
        });

        MOCK_STORE.roommateOptIn[userId] = false;

        return { userId, username, plaintextPassword };
      }
    );

    res.status(201).json({ success: true, userId: result.userId, username: result.username, plaintext_password: result.plaintextPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. GET /api/matches/:userId
 * SQL-filters clubs by user interests, ranks them via Gemini, returns MatchCard payload
 */
router.get('/matches/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    const result = await safeDbCall(
      async () => {
        // Query user interests and category-matched clubs in parallel
        const [interestRes, clubsRes] = await Promise.all([
          db.query(
            `SELECT i.label FROM user_interests ui 
             JOIN interests i ON ui.interest_id = i.id 
             WHERE ui.user_id = $1`, [userId]
          ),
          db.query(
            `SELECT DISTINCT c.id, c.name, c.description, l.name as location, 
             array_to_string(array_agg(DISTINCT i.label), ', ') as categories
             FROM clubs c
             LEFT JOIN locations l ON c.location_id = l.id
             LEFT JOIN club_interests ci ON c.id = ci.club_id
             LEFT JOIN interests i ON ci.interest_id = i.id
             WHERE ci.interest_id IN (
               SELECT interest_id FROM user_interests WHERE user_id = $1
             )
             GROUP BY c.id, c.name, c.description, l.name`, [userId]
          )
        ]);

        const userInterests = interestRes.rows.map(r => r.label);
        let clubs = clubsRes.rows;

        // If no clubs matched, grab a couple of general interest ones
        if (clubs.length === 0) {
          const generalRes = await db.query(
            `SELECT c.id, c.name, c.description, l.name as location 
             FROM clubs c LEFT JOIN locations l ON c.location_id = l.id LIMIT 2`
          );
          clubs = generalRes.rows;
        }

        // Call Gemini to rank and write reasoning sentences
        const rankedClubs = await rankAndExplainMatches(userInterests, clubs);
        
        // Merge Gemini explanation reasons into SQL results
        const matchesPayload = clubs.map(club => {
          const explanation = rankedClubs.matches.find(m => m.clubId === club.id);
          return {
            id: club.id,
            name: club.name,
            description: club.description,
            location: club.location || 'SCE Campus',
            category: club.categories || 'General',
            reason: explanation ? explanation.reason : "Matches your student profiles growth indices.",
            rank: explanation ? explanation.rank : 99,
            timings: club.id === 1 ? "Tuesdays & Thursdays, 4:15 PM" : "Wednesdays, 4:15 PM" // static mock timings
          };
        }).sort((a, b) => a.rank - b.rank);

        return matchesPayload;
      },
      async () => {
        // Mock matches logic
        const userInts = MOCK_STORE.userInterests
          .filter(ui => ui.user_id === userId)
          .map(ui => MOCK_STORE.interests.find(i => i.id === ui.interest_id)?.label)
          .filter(Boolean);

        const matchedClubIds = MOCK_STORE.clubInterests
          .filter(ci => MOCK_STORE.userInterests.some(ui => ui.user_id === userId && ui.interest_id === ci.interest_id))
          .map(ci => ci.club_id);

        let clubs = MOCK_STORE.clubs.filter(c => matchedClubIds.includes(c.id));
        if (clubs.length === 0) clubs = MOCK_STORE.clubs.slice(0, 2);

        const clubDetails = clubs.map(club => {
          const loc = MOCK_STORE.locations.find(l => l.id === club.location_id);
          return {
            id: club.id,
            name: club.name,
            description: club.description,
            location: loc ? loc.name : 'SCE Campus'
          };
        });

        const rankedClubs = await rankAndExplainMatches(userInts, clubDetails);

        return clubDetails.map(club => {
          const explanation = rankedClubs.matches.find(m => m.clubId === club.id);
          return {
            id: club.id,
            name: club.name,
            description: club.description,
            location: club.location,
            category: club.id === 1 ? 'Technical' : 'General',
            reason: explanation ? explanation.reason : "Matches your student profile growth indices.",
            rank: explanation ? explanation.rank : 99,
            timings: "Weekly, 4:15 PM"
          };
        }).sort((a, b) => a.rank - b.rank);
      }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. POST /api/registrations
 * Creates a user registration record
 */
router.post('/registrations', async (req, res) => {
  const { userId, clubOrEventType, clubOrEventId } = req.body;

  try {
    const result = await safeDbCall(
      async () => {
        const checkRes = await db.query(
          `SELECT id FROM user_registrations 
           WHERE user_id = $1 AND club_or_event_type = $2 AND club_or_event_id = $3`,
          [userId, clubOrEventType, clubOrEventId]
        );

        if (checkRes.rows.length > 0) {
          return checkRes.rows[0].id;
        }

        const insertRes = await db.query(
          `INSERT INTO user_registrations (user_id, club_or_event_type, club_or_event_id, status)
           VALUES ($1, $2, $3, 'checklist_started') RETURNING id`,
          [userId, clubOrEventType, clubOrEventId]
        );
        return insertRes.rows[0].id;
      },
      async () => {
        const check = MOCK_STORE.registrations.find(
          r => r.user_id === userId && r.club_or_event_type === clubOrEventType && r.club_or_event_id === clubOrEventId
        );
        if (check) return check.id;

        const regId = MOCK_STORE.registrations.length + 1;
        const newReg = {
          id: regId,
          user_id: userId,
          club_or_event_type: clubOrEventType,
          club_or_event_id: clubOrEventId,
          status: 'checklist_started'
        };
        MOCK_STORE.registrations.push(newReg);
        return regId;
      }
    );

    res.status(201).json({ success: true, registrationId: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 4. POST /api/checklist/:regId
 * Fetches raw process description text and calls Gemini to build checklist items
 */
router.post('/checklist/:regId', async (req, res) => {
  const regId = parseInt(req.params.regId);

  try {
    const result = await safeDbCall(
      async () => {
        // Query registration detail
        const regRes = await db.query('SELECT id, user_id, club_or_event_type, club_or_event_id, status FROM user_registrations WHERE id = $1', [regId]);
        if (regRes.rows.length === 0) throw new Error("Registration not found");
        const reg = regRes.rows[0];

        // Check if checklist items already generated
        const itemsRes = await db.query('SELECT id, user_registration_id, step_order, step_text, is_done FROM checklist_items WHERE user_registration_id = $1 ORDER BY step_order', [regId]);
        if (itemsRes.rows.length > 0) {
          return itemsRes.rows;
        }

        // Get raw registration text
        const processRes = await db.query(
          `SELECT raw_process_text FROM registration_process 
           WHERE club_or_event_type = $1 AND club_or_event_id = $2`,
          [reg.club_or_event_type, reg.club_or_event_id]
        );

        const rawText = processRes.rows[0]?.raw_process_text || 
          `Standard freshman enrollment. Register details at the main block and verify parameters with the student coordinator.`;

        // Let Gemini parse the raw text
        const geminiChecklist = await generateChecklistFromProcess(rawText);
        const steps = geminiChecklist.steps || [];

        // Save generated steps to database
        const savedSteps = [];
        for (const step of steps) {
          const itemRes = await db.query(
            `INSERT INTO checklist_items (user_registration_id, step_order, step_text, is_done)
             VALUES ($1, $2, $3, false) RETURNING *`,
            [regId, step.order, step.text]
          );
          savedSteps.push(itemRes.rows[0]);
        }

        return savedSteps;
      },
      async () => {
        const reg = MOCK_STORE.registrations.find(r => r.id === regId);
        if (!reg) throw new Error("Registration not found");

        const existing = MOCK_STORE.checklistItems.filter(item => item.user_registration_id === regId);
        if (existing.length > 0) return existing;

        const process = MOCK_STORE.registrationProcess.find(
          p => p.club_or_event_type === reg.club_or_event_type && p.club_or_event_id === reg.club_or_event_id
        );
        const rawText = process ? process.raw_process_text : "Standard freshman registration sequence. Clear desk and pay fees.";

        const geminiChecklist = await generateChecklistFromProcess(rawText);
        const steps = geminiChecklist.steps || [];

        const savedSteps = [];
        steps.forEach(step => {
          const item = {
            id: MOCK_STORE.checklistItems.length + 1,
            user_registration_id: regId,
            step_order: step.order,
            step_text: step.text,
            is_done: false
          };
          MOCK_STORE.checklistItems.push(item);
          savedSteps.push(item);
        });

        return savedSteps;
      }
    );

    res.json({ success: true, steps: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 5. PATCH /api/checklist-item/:id
 * Toggles the checklist check box state
 */
router.patch('/checklist-item/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { isDone } = req.body;

  try {
    await safeDbCall(
      async () => {
        await db.query('UPDATE checklist_items SET is_done = $1 WHERE id = $2', [isDone, id]);
      },
      async () => {
        const item = MOCK_STORE.checklistItems.find(i => i.id === id);
        if (item) item.is_done = isDone;
      }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 6. GET /api/timeline/:userId
 * Reserved for Future Version (Timeline feature postponed)
 */
router.get('/timeline/:userId', async (req, res) => {
  return res.status(503).json({ error: 'Timeline feature is reserved for future versions.' });
  
  // Disabled implementation below:
  const userId = parseInt(req.params.userId);

  try {
    const result = await safeDbCall(
      async () => {
        // Query checklist items from club registrations
        const regItemsRes = await db.query(
          `SELECT ci.id, ci.step_text as title, ci.is_done, 'Club Registration' as category,
           'SCE Complex' as location, '2026-08-15' as deadline,
           c.name as note
           FROM checklist_items ci
           JOIN user_registrations ur ON ci.user_registration_id = ur.id
           JOIN clubs c ON ur.club_or_event_id = c.id
           WHERE ur.user_id = $1 AND ur.club_or_event_type = 'club'`, [userId]
        );

        // Core static milestones (like verification and library setups)
        // In real database we can fetch from generic checklist table, for now combine static milestones
        const staticMilestones = [
          { id: 'm-1', title: 'Physical Document Verification', is_done: false, category: 'Administrative', location: 'Admin Block Ground Floor Counters', deadline: '2026-08-03', note: 'Submit TC, marksheets, photo sets.' },
          { id: 'm-2', title: 'Accounts Desk Clearance', is_done: false, category: 'Administrative', location: 'Accounts Office, Admin Block', deadline: '2026-08-03', note: 'Get fee stamp and ID card configurations.' },
          { id: 'm-3', title: 'Central Library Biometric Setup', is_done: false, category: 'Academic', location: 'Library Main Desk', deadline: '2026-08-07', note: 'Submit code number for biological gate logs.' }
        ];

        // Check if user is hosteller
        const userRes = await db.query('SELECT stay_type FROM users WHERE id = $1', [userId]);
        if (userRes.rows[0]?.stay_type === 'hostel') {
          staticMilestones.push({
            id: 'm-4',
            title: 'Hostel Room & Mess Keys Allotment',
            is_done: false,
            category: 'Hostel',
            location: 'Chief Wardens Office',
            deadline: '2026-08-02',
            note: 'Submit warden forms and collect dorm key card.'
          });
        }

        const combined = [...staticMilestones, ...regItemsRes.rows];
        return combined.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      },
      async () => {
        // Mock timeline
        const user = MOCK_STORE.users.find(u => u.id === userId);
        const staticMilestones = [
          { id: 'm-1', title: 'Physical Document Verification', is_done: false, category: 'Administrative', location: 'Admin Block Ground Floor Counters', deadline: '2026-08-03', note: 'Submit TC, marksheets, photo sets.' },
          { id: 'm-2', title: 'Accounts Desk Clearance', is_done: false, category: 'Administrative', location: 'Accounts Office, Admin Block', deadline: '2026-08-03', note: 'Get fee stamp and ID card configurations.' },
          { id: 'm-3', title: 'Central Library Biometric Setup', is_done: false, category: 'Academic', location: 'Library Main Desk', deadline: '2026-08-07', note: 'Submit code number for biological gate logs.' }
        ];
        if (user && user.stay_type === 'hostel') {
          staticMilestones.push({
            id: 'm-4',
            title: 'Hostel Room & Mess Keys Allotment',
            is_done: false,
            category: 'Hostel',
            location: 'Chief Wardens Office',
            deadline: '2026-08-02',
            note: 'Submit warden forms and collect dorm key card.'
          });
        }

        // Get club registration items
        const regs = MOCK_STORE.registrations.filter(r => r.user_id === userId);
        const clubItems = [];
        regs.forEach(r => {
          const items = MOCK_STORE.checklistItems.filter(ci => ci.user_registration_id === r.id);
          const club = MOCK_STORE.clubs.find(c => c.id === r.club_or_event_id);
          items.forEach(ci => {
            clubItems.push({
              id: `ci-${ci.id}`,
              title: ci.step_text,
              is_done: ci.is_done,
              category: 'Club Registration',
              location: 'SCE Campus',
              deadline: '2026-08-15',
              note: club ? club.name : 'Matched Club'
            });
          });
        });

        const combined = [...staticMilestones, ...clubItems];
        return combined.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper: Local Database Fact Resolver (Priority 1)
 */
const resolveLocalKnowledge = async (queryText, userId) => {
  const q = queryText.toLowerCase().trim();
  
  // Step 2 & Step 7: Route query to correct collection before retrieval
  let collection = 'UNKNOWN';
  
  if (q.includes('warden') || q.includes('ragging') || q.includes('harass') || q.includes('safety') || q.includes('emergency') || q.includes('contact') || q.includes('phone') || q.includes('number') || q.includes('medical') || q.includes('first aid')) {
    collection = 'EMERGENCY_CONTACTS';
  } else if (q.includes('timetable') || q.includes('period') || q.includes('time table') || q.includes('class schedule')) {
    collection = 'TIMETABLE';
  } else if (q.includes('faculty') || q.includes('professor') || q.includes('teacher') || q.includes('hod') || q.includes('head') || q.includes('santhi') || q.includes('mohan') || q.includes('giriraj') || q.includes('ravimaran') || q.includes('principal') || q.includes('email') || q.includes('office') || q.includes('department') || q.includes('dept')) {
    collection = 'FACULTY';
  } else if (q.includes('open') || q.includes('reopening') || q.includes('holiday') || q.includes('ia test') || q.includes('exam date') || q.includes('semester start') || q.includes('calendar')) {
    collection = 'CALENDAR';
  } else if (q.includes('senior connect') || q.includes('study hub') || q.includes('activity manager') || q.includes('notice board') || q.includes('bus route') || q.includes('navigation') || q.includes('block') || q.match(/\bks\b/) || q.match(/\brv\b/) || q.match(/\bjs\b/) || q.match(/\bbd\b/) || (q.includes('me block') || q.includes('me-block') || q.includes('mechanical block') || q.includes('mech block') || q.includes('me dept') || q.includes('me department'))) {
    collection = 'PATHMATE_FEATURES';
  } else if (q.includes('club') || q.includes('event') || q.includes('hackathon') || q.includes('workshop') || q.includes('symphony') || q.includes('coding') || q.includes('robotics')) {
    collection = 'CLUBS';
  } else if (q.includes('canteen') || q.includes('menu') || q.includes('food') || q.includes('coffee') || q.includes('price')) {
    collection = 'CANTEEN';
  } else if (q.includes('regulation') || q.includes('credit') || q.includes('grade') || q.includes('cgpa') || q.includes('gpa') || q.includes('assessment') || q.includes('attendance requirement') || q.includes('arrear') || q.includes('syllabus') || q.includes('curriculum')) {
    collection = 'REGULATIONS';
  } else if (q.includes('committee') || q.includes('council') || q.includes('squad') || q.includes('grievance') || q.includes('ombudsman')) {
    collection = 'COMMITTEES';
  }

  console.log(`[Collection Routing] Routing "${queryText}" to database collection: ${collection}`);

  return await safeDbCall(
    async () => {
      // 1. TIMETABLE
      if (collection === 'TIMETABLE') {
        const userRes = await db.query('SELECT department_id FROM users WHERE id = $1', [userId]);
        const deptId = userRes.rows[0]?.department_id || 1;
        const timeRes = await db.query(
          `SELECT t.*, f.name as teacher FROM timetable t 
           LEFT JOIN faculty f ON t.faculty_id = f.id
           WHERE t.department_id = $1 ORDER BY t.id`, [deptId]
        );
        if (timeRes.rows.length > 0) {
          const deptNameRes = await db.query('SELECT name FROM departments WHERE id = $1', [deptId]);
          const deptName = deptNameRes.rows[0]?.name || 'CSE';
          let answer = `Here is the first-year class schedule for department ${deptName}:\n\n`;
          timeRes.rows.forEach(row => {
            answer += `• **${row.day_of_week}** (${row.start_time.slice(0,5)} - ${row.end_time.slice(0,5)}): **${row.subject}** taught by ${row.teacher || 'Faculty'}\n`;
          });
          return { resolved: true, answer, confidence: 'HIGH', sourceTable: 'timetable' };
        }
      }

      // 1.5 GENERAL COLLEGE OVERVIEW
      if (q.includes('about saranathan') || q.includes('tell about saranathan') || q.includes('introduce saranathan') || q.includes('what is saranathan')) {
        const principalRes = await db.query("SELECT name, contact_email FROM faculty WHERE designation ILIKE '%Principal%' LIMIT 1");
        const principal = principalRes.rows[0];
        const principalName = principal ? principal.name : 'Dr. D. Valavan';
        const principalEmail = principal ? principal.contact_email : 'principal@saranathan.ac.in';
        
        const answer = `**Saranathan College of Engineering (SCE)**, established in 1998, is a premier self-financing engineering institution located in Panjappur, Trichy. It is affiliated to Anna University, Chennai, and approved by the AICTE, New Delhi. The college is led by Principal **${principalName}** (${principalEmail}) and is highly regarded for academic excellence, state-of-the-art laboratories, and career guidance.`;
        return { resolved: true, answer, confidence: 'HIGH', sourceTable: 'faculty' };
      }

      // 2. FACULTY / HOD (Step 14: Search only Faculty Directory. Return only requested person)
      if (collection === 'FACULTY') {
        const isDeptOverviewQuery = (q.includes('department') || q.includes('dept') || q.includes('cse') || q.includes('ece') || q.includes('eee') || q.includes('it') || q.includes('csbs') || q.includes('mech') || q.includes('civil') || q.includes('aids') || q.includes('ice')) && (q.includes('about') || q.includes('explain') || q.includes('tell') || q.includes('overview') || q.includes('what is') || q.includes('describe') || q.includes('details of') || q.includes('introduce'));
        
        if (isDeptOverviewQuery) {
          const detectedDepts = [];
          if (q.includes('cse') || q.includes('computer')) detectedDepts.push('CSE');
          if (q.includes('ece') || q.includes('electronics')) detectedDepts.push('ECE');
          if (q.includes('eee') || q.includes('electrical')) detectedDepts.push('EEE');
          if (q.includes('it') || q.includes('information')) detectedDepts.push('IT');
          if (q.includes('csbs') || q.includes('business')) detectedDepts.push('CSBS');
          if (q.includes('ai&ds') || q.includes('aids') || q.includes('data science')) detectedDepts.push('AI&DS');
          if (q.includes('mech') || q.includes('mechanical')) detectedDepts.push('Mech');
          if (q.includes('civil')) detectedDepts.push('Civil');
          if (q.includes('ice') || q.includes('instrumentation')) detectedDepts.push('ICE');

          if (detectedDepts.length > 0) {
            let answer = "";
            for (const deptName of detectedDepts) {
              const deptRes = await db.query('SELECT name, full_name FROM departments WHERE name = $1', [deptName]);
              const deptInfo = deptRes.rows[0];
              if (deptInfo) {
                const hodRes = await db.query(
                  `SELECT f.name, f.designation, f.contact_email FROM faculty f 
                   LEFT JOIN departments d ON f.department_id = d.id
                   WHERE (f.designation ILIKE '%Head%' OR f.designation ILIKE '%HOD%') AND d.name = $1
                   LIMIT 1`, [deptName]
                );
                const hod = hodRes.rows[0];
                const hodDetail = hod ? ` The Head of Department is **${hod.name}** (${hod.contact_email}).` : '';
                answer += `• **${deptInfo.full_name || deptInfo.name} (${deptInfo.name})**:${hodDetail}\n`;
              }
            }
            if (answer) {
              answer = `Here are the details for the requested departments:\n\n${answer}`;
              return { resolved: true, answer, confidence: 'HIGH', sourceTable: 'faculty' };
            }
          }
        }

        let rows = [];
        if (q.includes('principal')) {
          const facRes = await db.query("SELECT name, designation, contact_email FROM faculty WHERE designation ILIKE '%Principal%' LIMIT 1");
          rows = facRes.rows;
        } else if (q.includes('hod') || q.includes('head')) {
          let deptSearch = "";
          if (q.includes('cse') || q.includes('computer')) deptSearch = "CSE";
          else if (q.includes('ece') || q.includes('electronics')) deptSearch = "ECE";
          else if (q.includes('ai&ds') || q.includes('aids') || q.includes('data science')) deptSearch = "AI&DS";
          else if (q.includes('csbs') || q.includes('business')) deptSearch = "CSBS";
          else if (q.includes('it') || q.includes('information')) deptSearch = "IT";
          else if (q.includes('eee') || q.includes('electrical')) deptSearch = "EEE";
          else if (q.includes('civil')) deptSearch = "Civil";
          else if (q.includes('mech') || q.includes('mechanical')) deptSearch = "Mech";
          else if (q.includes('ice') || q.includes('instrumentation')) deptSearch = "ICE";

          if (deptSearch) {
            const facRes = await db.query(
              `SELECT f.name, f.designation, f.contact_email, d.name as dept FROM faculty f 
               LEFT JOIN departments d ON f.department_id = d.id
               WHERE (f.designation ILIKE '%Head%' OR f.designation ILIKE '%HOD%') AND d.name = $1
               ORDER BY f.id`, [deptSearch]
            );
            rows = facRes.rows;
          } else {
            const facRes = await db.query(
              `SELECT f.name, f.designation, f.contact_email, d.name as dept FROM faculty f 
               LEFT JOIN departments d ON f.department_id = d.id
               WHERE (f.designation ILIKE '%Head%' OR f.designation ILIKE '%HOD%')
               ORDER BY d.name`
            );
            rows = facRes.rows;
          }
        } else {
          let nameSearch = "";
          if (q.includes('santhi')) nameSearch = "%Santhi%";
          else if (q.includes('mohan')) nameSearch = "%Mohan%";
          else if (q.includes('giriraj')) nameSearch = "%Giriraj%";
          else if (q.includes('ravimaran')) nameSearch = "%Ravimaran%";
          
          if (nameSearch) {
            const facRes = await db.query(
              `SELECT f.name, f.designation, f.contact_email, d.name as dept FROM faculty f 
               LEFT JOIN departments d ON f.department_id = d.id
               WHERE f.name ILIKE $1`, [nameSearch]
            );
            rows = facRes.rows;
          }
        }

        if (rows.length > 0) {
          const isDeptSpecific = q.includes('csbs') || q.includes('cse') || q.includes('ece') || q.includes('aids') || q.includes('it') || q.includes('eee') || q.includes('civil') || q.includes('mech') || q.includes('ice') || q.includes('principal') || rows.length === 1;
          if (isDeptSpecific) {
            const row = rows[0];
            let answer = "";
            if (row.designation.toLowerCase().includes('head') || row.designation.toLowerCase().includes('hod')) {
              answer = `The Head of the ${row.dept} Department is **${row.name}**, ${row.designation}. Email: ${row.contact_email}.`;
            } else {
              answer = `**${row.name}** is ${row.designation} in ${row.dept} department. Email: ${row.contact_email}.`;
            }
            return { resolved: true, answer, confidence: 'HIGH', sourceTable: 'faculty' };
          } else {
            let answer = "Here is the list of Department Heads (HODs):\n\n";
            rows.forEach(row => {
              answer += `• **${row.dept}**: ${row.name} (${row.contact_email})\n`;
            });
            return { resolved: true, answer, confidence: 'HIGH', sourceTable: 'faculty' };
          }
        }
      }

      // 3. CALENDAR (Step 13: Academic Calendar only)
      if (collection === 'CALENDAR') {
        let term = '';
        if (q.includes('open') || q.includes('reopening')) term = '%Reopening%';
        else if (q.includes('ia') || q.includes('assessment')) term = '%Assessment%';
        else if (q.includes('model')) term = '%Model%';
        else if (q.includes('holiday')) term = '%Holiday%';
        else if (q.includes('exam') || q.includes('theory') || q.includes('practical')) term = '%Exam%';

        if (term) {
          const calRes = await db.query(
            'SELECT event_name, description FROM academic_calendar WHERE event_name ILIKE $1 OR description ILIKE $2 LIMIT 1',
            [term, term]
          );
          if (calRes.rows.length > 0) {
            return { resolved: true, answer: calRes.rows[0].description, confidence: 'HIGH', sourceTable: 'academic_calendar' };
          }
        }
      }

      // 4. PATHMATE_FEATURES (Step 12: PathMate documentation only)
      if (collection === 'PATHMATE_FEATURES') {
        // Floor directions / maps
        if (q.includes('block') || q.match(/\bks\b/) || q.match(/\brv\b/) || q.match(/\bjs\b/) || q.match(/\bbd\b/) || (q.includes('me block') || q.includes('me-block') || q.includes('mechanical block') || q.includes('mech block') || q.includes('me dept') || q.includes('me department'))) {
          let blockSearch = "";
          if (q.match(/\bks\b/)) blockSearch = "ks-block";
          else if (q.match(/\brv\b/)) blockSearch = "rv-block";
          else if (q.match(/\bjs\b/)) blockSearch = "js-block";
          else if (q.match(/\bbd\b/)) blockSearch = "bd-block";
          else if (q.includes('me block') || q.includes('me-block') || q.includes('mechanical block') || q.includes('mech block') || q.includes('me dept') || q.includes('me department')) blockSearch = "me-block";

          if (blockSearch) {
            const blockRes = await db.query('SELECT id, block_name, block_type FROM campus_blocks WHERE svg_id = $1', [blockSearch]);
            if (blockRes.rows.length > 0) {
              const block = blockRes.rows[0];
              const detailsRes = await db.query('SELECT floor_label, detail_text FROM block_floor_details WHERE block_id = $1 ORDER BY id', [block.id]);
              
              let answer = `**${block.block_name}** Details:\n`;
              detailsRes.rows.forEach(floor => {
                answer += `• **${floor.floor_label}**: ${floor.detail_text}\n`;
              });
              return { resolved: true, answer, confidence: 'HIGH', sourceTable: 'campus_blocks' };
            }
          }
        }

        // Features scope details
        if (q.includes('senior connect') || q.includes('connect')) {
          return { resolved: true, answer: "Senior Connect matches freshmen with experienced senior mentors for peer guidance, academic tips, and college orientation answers. You can find them in the Mentors directory.", confidence: 'HIGH', sourceTable: 'pathmate_docs' };
        }
        if (q.includes('study hub')) {
          return { resolved: true, answer: "Study Hub provides study resources, past papers, lecture notes, and subject checklists to help freshmen prepare for examinations.", confidence: 'HIGH', sourceTable: 'pathmate_docs' };
        }
        if (q.includes('activity manager')) {
          return { resolved: true, answer: "Activity Manager is an onboarding feature that helps freshmen track orientation events, departments tours, and administrative tasks step-by-step.", confidence: 'HIGH', sourceTable: 'pathmate_docs' };
        }
        if (q.includes('notice board') || q.includes('notice')) {
          return { resolved: true, answer: "Notice Board displays the latest official circulars, announcements, and notices released by the administration desk.", confidence: 'HIGH', sourceTable: 'pathmate_docs' };
        }
        if (q.includes('bus')) {
          return { resolved: true, answer: "Bus Routes page lists the college bus routes, route numbers, driver details, and stops across Trichy city.", confidence: 'HIGH', sourceTable: 'pathmate_docs' };
        }
      }

      // 5. EMERGENCY_CONTACTS
      if (collection === 'EMERGENCY_CONTACTS') {
        const contactsRes = await db.query('SELECT label, contact_value, notes FROM emergency_contacts');
        if (contactsRes.rows.length > 0) {
          let answer = "Here are the emergency and administrative contacts on campus:\n\n";
          contactsRes.rows.forEach(c => {
            answer += `• **${c.label}**: ${c.contact_value} (${c.notes})\n`;
          });
          return { resolved: true, answer, confidence: 'HIGH', sourceTable: 'emergency_contacts' };
        }
      }

      // 6. CLUBS & EVENTS
      if (collection === 'CLUBS') {
        let matchName = "";
        if (q.includes('coding') || q.includes('hackathon')) matchName = "%Coding%";
        else if (q.includes('robotics') || q.includes('workshop')) matchName = "%Robotics%";
        else if (q.includes('fine arts') || q.includes('symphony')) matchName = "%Fine Arts%";
        else if (q.includes('literary') || q.includes('english')) matchName = "%English%";
        else if (q.includes('tamil')) matchName = "%தமிழ்%";
        else if (q.includes('nss') || q.includes('yrc') || q.includes('red cross')) matchName = "%NSS%";
        else if (q.includes('sports') || q.includes('gym')) matchName = "%Sports%";

        if (matchName) {
          const clubRes = await db.query('SELECT id, name, description FROM clubs WHERE name ILIKE $1', [matchName]);
          if (clubRes.rows.length > 0) {
            const club = clubRes.rows[0];
            const procRes = await db.query("SELECT raw_process_text FROM registration_process WHERE club_or_event_type = 'club' AND club_or_event_id = $1", [club.id]);
            const processText = procRes.rows[0]?.raw_process_text || "Please contact the student affairs dean office to register.";
            
            const answer = `**${club.name}**\nDescription: ${club.description}\n\n**Registration Process:**\n${processText}`;
            return { resolved: true, answer, confidence: 'HIGH', sourceTable: 'clubs' };
          }
        } else if (q.includes('event')) {
          const eventsRes = await db.query("SELECT name, description, event_date, location_text FROM events WHERE status = 'upcoming' OR status = 'ongoing' ORDER BY event_date ASC");
          if (eventsRes.rows.length > 0) {
            let answer = "Here are the upcoming events at Saranathan College:\n\n";
            eventsRes.rows.forEach(e => {
              const dateStr = new Date(e.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              const desc = e.description ? ` — ${e.description}` : '';
              answer += `• **${e.name}**${desc}\n  Date: ${dateStr} | Venue: ${e.location_text || 'Campus'}\n`;
            });
            return { resolved: true, answer, confidence: 'HIGH', sourceTable: 'events' };
          }
        }
      }

      // 7. CANTEEN
      if (collection === 'CANTEEN') {
        const canteenRes = await db.query('SELECT category, item_name, price FROM canteen_menu ORDER BY category, price');
        if (canteenRes.rows.length > 0) {
          let answer = "Here is the Canteen Menu:\n\n";
          let currentCat = '';
          canteenRes.rows.forEach(item => {
            if (currentCat !== item.category) {
              answer += `\n**${item.category}**\n`;
              currentCat = item.category;
            }
            answer += `• ${item.item_name} - ₹${item.price}\n`;
          });
          return { resolved: true, answer, confidence: 'HIGH', sourceTable: 'canteen_menu' };
        }
      }

      // 8. COMMITTEES
      if (collection === 'COMMITTEES') {
        let matchName = "%";
        if (q.includes('ragging') && q.includes('squad')) matchName = "%Anti-Ragging Squad%";
        else if (q.includes('ragging')) matchName = "%Anti-Ragging Committee%";
        else if (q.includes('grievance') || q.includes('ombudsman')) matchName = "%Grievance%";
        else if (q.includes('council')) matchName = "%Council%";
        
        const commRes = await db.query('SELECT id, name, description FROM committees WHERE name ILIKE $1', [matchName]);
        if (commRes.rows.length > 0) {
          const comm = commRes.rows[0];
          const membersRes = await db.query('SELECT name, position, phone, email FROM committee_members WHERE committee_id = $1', [comm.id]);
          let answer = `**${comm.name}**\nDescription: ${comm.description}\n\n**Members:**\n`;
          membersRes.rows.forEach(m => {
             answer += `• **${m.name}** (${m.position || 'Member'}) - ${m.phone || 'N/A'} | ${m.email || 'N/A'}\n`;
          });
          return { resolved: true, answer, confidence: 'HIGH', sourceTable: 'committees' };
        }
      }

      // 9. REGULATIONS (Step 3 & 8: Search chatbot_chunks ONLY when collection is REGULATIONS)
      if (collection === 'REGULATIONS') {
        try {
          const embedding = await generateEmbeddings(queryText);
          const embeddingStr = `[${embedding.join(',')}]`;
          const vectorRes = await db.query(
            `SELECT chunk_text, 1 - (embedding <=> $1::vector) as similarity 
             FROM chatbot_chunks 
             ORDER BY embedding <=> $1::vector 
             LIMIT 3`, [embeddingStr]
          );
          
          if (vectorRes.rows.length > 0) {
            const similarity = vectorRes.rows[0].similarity;
            const confidence = similarity >= 0.50 ? 'HIGH' : (similarity >= 0.40 ? 'MEDIUM' : 'LOW');
            const context = vectorRes.rows.map(r => r.chunk_text).join('\n\n');
            return { resolved: true, answer: context, confidence, sourceTable: 'chatbot_chunks', isContext: true };
          }
        } catch (e) {
          console.error("Vector search failed:", e.message);
        }
      }

      return { resolved: false, confidence: 'LOW' };
    },
    async () => {
      // Mock Store Fallback
      if (q.includes('timetable') || q.includes('python') || q.includes('schedule') || q.includes('class') || q.includes('subject')) {
        const user = MOCK_STORE.users.find(u => u.id === userId) || { department_id: 1 };
        const deptName = MOCK_STORE.departments.find(d => d.id === user.department_id)?.name || 'CSE';
        
        let answer = `Here is the first-year class schedule for department ${deptName} (Mock Backup):\n\n`;
        MOCK_STORE.timetable.forEach(row => {
          const teacher = MOCK_STORE.faculty.find(f => f.id === row.faculty_id)?.name || 'Faculty';
          answer += `• **${row.day_of_week}** (${row.start_time.slice(0,5)} - ${row.end_time.slice(0,5)}): **${row.subject}** taught by ${teacher}\n`;
        });
        return { resolved: true, answer, confidence: 'HIGH', sourceTable: 'timetable' };
      }

      if (q.includes('faculty') || q.includes('professor') || q.includes('teacher') || q.includes('hod') || q.includes('head') || q.includes('santhi') || q.includes('mohan') || q.includes('giriraj')) {
        let rows = MOCK_STORE.faculty;
        if (q.includes('santhi')) rows = rows.filter(f => f.name.includes('Santhi'));
        else if (q.includes('mohan')) rows = rows.filter(f => f.name.includes('Mohan'));
        else if (q.includes('giriraj')) rows = rows.filter(f => f.name.includes('Giriraj'));

        if (rows.length > 0) {
          let answer = "Here are the faculty contact details (Mock Backup):\n\n";
          rows.forEach(row => {
            const dept = MOCK_STORE.departments.find(d => d.id === row.department_id)?.name || 'ECE';
            answer += `• **${row.name}** — ${row.designation} (${dept} Department)\n  Email: ${row.contact_email}\n`;
          });
          return { resolved: true, answer, confidence: 'HIGH', sourceTable: 'faculty' };
        }
      }

      if (q.includes('block') || q.includes('ks') || q.includes('rv') || q.includes('js') || q.includes('bd') || q.includes('me') || q.includes('cafeteria') || q.includes('canteen')) {
        let blockSearch = "";
        if (q.includes('ks')) blockSearch = "ks-block";
        else if (q.includes('rv')) blockSearch = "rv-block";
        else if (q.includes('js')) blockSearch = "js-block";
        else if (q.includes('bd')) blockSearch = "bd-block";
        else if (q.includes('me')) blockSearch = "me-block";
        else if (q.includes('cafeteria') || q.includes('canteen')) blockSearch = "cafeteria";

        if (blockSearch) {
          const block = MOCK_STORE.campusBlocks.find(b => b.svg_id === blockSearch);
          if (block) {
            const details = MOCK_STORE.blockFloorDetails.filter(d => d.block_id === block.id);
            let answer = `**${block.block_name}** Details (Mock Backup):\n`;
            details.forEach(floor => {
              answer += `• **${floor.floor_label}**: ${floor.detail_text}\n`;
            });
            return { resolved: true, answer, confidence: 'HIGH', sourceTable: 'campus_blocks' };
          }
        }
      }

      if (q.includes('warden') || q.includes('ragging') || q.includes('harass') || q.includes('safety') || q.includes('emergency') || q.includes('contact') || q.includes('phone') || q.includes('number') || q.includes('medical')) {
        let answer = "Here are the emergency contacts (Mock Backup):\n\n";
        MOCK_STORE.emergencyContacts.forEach(c => {
          answer += `• **${c.label}**: ${c.contact_value} (${c.notes})\n`;
        });
        return { resolved: true, answer, confidence: 'HIGH', sourceTable: 'emergency_contacts' };
      }

      if (q.includes('club') || q.includes('event') || q.includes('hackathon') || q.includes('workshop') || q.includes('symphony') || q.includes('coding') || q.includes('robotics')) {
        let matchId = 1;
        if (q.includes('robotics')) matchId = 2;
        const club = MOCK_STORE.clubs.find(c => c.id === matchId);
        if (club) {
          const proc = MOCK_STORE.registrationProcess.find(p => p.club_or_event_type === 'club' && p.club_or_event_id === club.id);
          const answer = `**${club.name}**\nDescription: ${club.description}\n\n**Registration Process:**\n${proc?.raw_process_text || 'Collect form from office.'}`;
          return { resolved: true, answer, confidence: 'HIGH', sourceTable: 'clubs' };
        }
      }

      return { resolved: false, confidence: 'LOW' };
    }
  );
};

/**
 * 7. POST /api/chat
 * Answering using a strict 3-Priority system:
 * Priority 1: Check internal knowledge (database / mock store fallback). If found, return directly citing 'PathMate Database'.
 * Priority 2: Retrieve from official website (saranathan.ac.in).
 * Priority 3: Summarize via Gemini, citing 'Official Saranathan College Website'.
 */
// Public endpoints for fetching clubs, events, and committees
router.get('/notices', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        n.id, n.title, n.content, n.target_audience, n.priority, n.category, n.status,
        n.author, n.attachment_url, n.published_at as "publishedAt", n.created_at, n.expiry_date,
        (n.priority = 'urgent') as urgent,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', a.id,
                'file_name', a.file_name,
                'original_name', a.original_name,
                'file_type', a.file_type,
                'mime_type', a.mime_type,
                'file_size', a.file_size,
                'storage_url', a.storage_url
              )
            ) 
            FROM notice_attachments a 
            WHERE a.notice_id = n.id
          ),
          '[]'::json
        ) AS attachments
      FROM notices n 
      WHERE (n.status = 'published' OR n.status IS NULL)
        AND (n.expiry_date IS NULL OR n.expiry_date >= NOW())
      ORDER BY n.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/clubs', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, rp.raw_process_text as registration_steps 
      FROM clubs c
      LEFT JOIN registration_process rp ON c.id = rp.club_or_event_id AND rp.club_or_event_type = 'club'
      WHERE c.status = 'active'
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/events', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, rp.raw_process_text as registration_steps 
      FROM events e
      LEFT JOIN registration_process rp ON e.id = rp.club_or_event_id AND rp.club_or_event_type = 'event'
      WHERE e.status = 'upcoming' OR e.status = 'ongoing'
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/committees', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM committees');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/suggested-faqs', async (req, res) => {
  try {
    const result = await safeDbCall(
      async () => {
        const queryRes = await db.query(
          'SELECT id, question, answer, category, icon FROM faqs WHERE is_suggested = true AND is_approved = true ORDER BY id ASC'
        );
        return queryRes.rows;
      },
      async () => {
        // Fallback to in-memory MOCK_STORE faqs if database is unconfigured/fails
        return (MOCK_STORE.faqs || [])
          .filter(f => f.is_suggested && f.is_approved)
          .map(f => ({ id: f.id, question: f.question, answer: f.answer, category: f.category, icon: f.icon || 'help' }));
      }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const fetchWebSearchContext = async (query) => {
  try {
    console.log(`[Web Search] Fetching DuckDuckGo results for: ${query}`);
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const searchHtml = await searchRes.text();
    const regex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    const snippets = [];
    while ((match = regex.exec(searchHtml)) !== null && snippets.length < 5) {
      snippets.push(match[1].replace(/<[^>]*>/g, '').trim());
    }
    return snippets.join("\n---\n");
  } catch (err) {
    console.warn("Failed to retrieve real-time search context:", err.message);
    return "";
  }
};

// --- Production AI Architecture Redesign Helpers ---

// Local conversational responses (Category A)
const generateLocalConversationalReply = (query) => {
  const q = query.toLowerCase().trim();

  const greetingReplies = [
    "Hey! 👋 Great to see you. How can I help you with your studies or campus questions today?",
    "Hello! Hope you are having a wonderful day. What academic or campus topic can we look into today?",
    "Hi there! 😊 I'm ready to assist you. What's on your mind today?",
    "Hey! Nice to connect. Feel free to ask about your subjects, hostel details, or departments."
  ];

  const thanksReplies = [
    "You're very welcome! I'm glad I could help. Let me know if you need anything else.",
    "Happy to help! 😊 Good luck with your studies. Ask anytime!",
    "Anytime! Don't hesitate to reach out if you have more questions."
  ];

  const byeReplies = [
    "Goodbye! 👋 Take care, and return whenever you need academic or college guidance.",
    "Bye! Have a great day ahead and happy learning! 📚",
    "See you later! Take care and keep studying hard!"
  ];

  const casualReplies = [
    "I'm doing great, thank you for asking! 😊 Ready to help with any academic queries.",
    "Everything is running smoothly! Just here and ready to guide you through your college journey.",
    "I'm doing well! Hope you're enjoying your campus life today."
  ];

  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  if (q.includes('thank') || q.includes('thanks')) {
    return getRandom(thanksReplies);
  }
  if (q.includes('bye') || q.includes('see you') || q.includes('goodbye')) {
    return getRandom(byeReplies);
  }
  if (q.includes('how are you') || q.includes('what are you doing') || q.includes('what\'s up') || q.includes('whats up') || q.includes('nice to meet you')) {
    return getRandom(casualReplies);
  }
  return getRandom(greetingReplies);
};

// Predefined PathMate knowledge (Category B)
const generateLocalPathMateReply = (query) => {
  const q = query.toLowerCase();
  
  if (q.includes('navigate') || q.includes('navigation') || q.includes('map')) {
    return "You can use the **Campus Map** tab to view block directions. Simply search for a block (like RV Block or JS Block) or ask me, and I'll explain what floors and departments are situated there.";
  }
  
  return "PathMate is your intelligent Academic & Campus Assistant for Saranathan College of Engineering. I can help you with campus navigation, checking department timetables, finding HOD contacts, accessing academic regulations, and answering your subject questions. I keep responses fast and focused!";
};

// Local query classifier (zero latency, zero API cost)
const classifyQueryLocal = (queryText) => {
  const q = queryText.toLowerCase().trim();
  
  // STRICT RULE: If the query mentions Saranathan, SCE, or the Principal, it is always a College/University query (Category C)
  if (q.includes('saranathan') || q.includes('sce') || q.includes('panjappur') || q.includes('valavan')) {
    return 'C';
  }

  // CATEGORY A: Normal Conversation
  const catARegex = /^(hi|hello|hey|heyy|heyyy|hyy|hlo|hy|yo|good\s+morning|good\s+evening|good\s+night|greetings|welcome|thanks|thank\s+you|thankyou|bye|goodbye|see\s+you|take\s+care|how\s+are\s+you|what\s+is\s+up|what's\s+up|whats\s+up|sup|yo|what\s+are\s+you\s+doing|nice\s+to\s+meet\s+you|awesome|good\s+job|great|nice|perfect|cool|ok|okay)\b/i;
  if (catARegex.test(q)) {
    return 'A';
  }

  // CATEGORY B: PathMate Questions
  const catBKeywords = [
    'what is pathmate', 'who is pathmate', 'what can you do', 'how does pathmate work', 
    'features of pathmate', 'what are your features', 'how to use pathmate', 'how do i navigate'
  ];
  if (catBKeywords.some(kw => q.includes(kw))) {
    return 'B';
  }

  // CATEGORY E: Outside Academic Scope (Decline list)
  const catEKeywords = [
    'politics', 'movie', 'movies', 'celebrity', 'gossip', 'sports', 'cricket', 'football', 
    'stock', 'market', 'bitcoin', 'crypto', 'religion', 'dating', 'dating advice', 'girlfriend', 
    'boyfriend', 'love', 'recipe', 'recipes', 'travel', 'holiday', 'shopping', 'deal', 
    'entertainment', 'news', 'weather', 'joke', 'jokes', 'song', 'music', 'game', 'gaming'
  ];
  if (catEKeywords.some(kw => q.includes(kw))) {
    return 'E';
  }

  // CATEGORY C: College Questions
  const catCKeywords = [
    'admission', 'department', 'faculty', 'fees', 'timetable', 'class', 'period', 'schedule', 
    'club', 'event', 'navigation', 'campus', 'bus', 'hostel', 'library', 'lab', 'placement', 
    'regulation', 'study hub', 'canteen', 'food court', 'office', 'policy', 'calendar', 'exam', 
    'marks', 'santhi', 'valavan', 'saranathan', 'sce', 'scholarship', 'syllabus', 'curriculum', 
    'hall', 'auditorium', 'block', 'ece', 'cse', 'eee', 'aids', 'aiml', 'csbs', 'mech', 'civil', 
    'stationery', 'generator', 'toilet', 'warden', 'hod', 'principal', 'attendance', 'semester', 
    'cgpa', 'gpa', 'anna university', 'regulation 2021'
  ];
  if (catCKeywords.some(kw => q.includes(kw))) {
    return 'C';
  }

  // CATEGORY D: Academic Questions
  const catDKeywords = [
    'programming', 'coding', 'python', 'java', 'c++', 'javascript', 'vlsi', 'digital logic', 
    'machine learning', 'physics', 'chemistry', 'math', 'mathematics', 'electronics', 'antennas', 
    'wave propagation', 'flip-flop', 'semiconductor', 'data structures', 'operating system', 'network', 
    'control system', 'algorithm', 'interview prep', 'resume', 'career guidance', "ohm's law", 
    'binary search', 'compiler', 'database', 'sql', 'data science', 'deep learning', 'science', 
    'engineering', 'lecture', 'concept', 'explain', 'how to solve', 'tutorial', 'ai', 'artificial intelligence'
  ];
  if (catDKeywords.some(kw => q.includes(kw))) {
    return 'D';
  }

  if (/^(what is|how to|explain|difference between|why does|how does|what are|define)\b/i.test(q)) {
    return 'D';
  }

  // Safe academic & general college fallback is always Category D (Gemini)
  return 'D';
};

// Database Academic Cache Helpers
const MEMORY_ACADEMIC_CACHE = new Map();

const ensureAcademicCacheTable = async () => {
  await safeDbCall(
    async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS academic_cache (
          id SERIAL PRIMARY KEY,
          query_text TEXT UNIQUE,
          answer_text TEXT,
          embedding vector(768),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    },
    async () => {}
  );
};

const getCachedAcademicResponse = async (queryText) => {
  const cleaned = queryText.trim().toLowerCase();
  
  if (MEMORY_ACADEMIC_CACHE.has(cleaned)) {
    return MEMORY_ACADEMIC_CACHE.get(cleaned);
  }

  return await safeDbCall(
    async () => {
      const res = await db.query(
        'SELECT answer_text FROM academic_cache WHERE TRIM(LOWER(query_text)) = TRIM(LOWER($1)) LIMIT 1',
        [queryText]
      );
      if (res.rows.length > 0) {
        MEMORY_ACADEMIC_CACHE.set(cleaned, res.rows[0].answer_text);
        return res.rows[0].answer_text;
      }
      return null;
    },
    async () => {
      return null;
    }
  );
};

const getSemanticCachedResponse = async (queryText) => {
  return await safeDbCall(
    async () => {
      const embedding = await generateEmbeddings(queryText);
      const embeddingStr = `[${embedding.join(',')}]`;
      const res = await db.query(
        `SELECT answer_text, 1 - (embedding <=> $1::vector) as similarity 
         FROM academic_cache 
         ORDER BY embedding <=> $1::vector 
         LIMIT 1`, [embeddingStr]
      );
      if (res.rows.length > 0 && res.rows[0].similarity > 0.85) {
        return res.rows[0].answer_text;
      }
      return null;
    },
    async () => {
      return null;
    }
  );
};

const saveAcademicResponseToCache = async (queryText, answerText) => {
  const cleaned = queryText.trim().toLowerCase();
  MEMORY_ACADEMIC_CACHE.set(cleaned, answerText);

  await safeDbCall(
    async () => {
      const embedding = await generateEmbeddings(queryText);
      const embeddingStr = `[${embedding.join(',')}]`;
      await db.query(
        'INSERT INTO academic_cache (query_text, answer_text, embedding) VALUES ($1, $2, $3::vector) ON CONFLICT (query_text) DO NOTHING',
        [queryText, answerText, embeddingStr]
      );
    },
    async () => {}
  );
};

router.post('/chat', chatRateLimiter, async (req, res) => {
  const { userId, query: userQuery, language = 'en', history = [] } = req.body;

  // Input validation
  if (!userQuery || typeof userQuery !== 'string' || userQuery.trim().length < 1) {
    return res.status(400).json({ error: 'Query is required.' });
  }
  if (userQuery.trim().length > 2000) {
    return res.status(400).json({ error: 'Query is too long. Please keep it under 2000 characters.' });
  }

  try {
    const cleanQuery = userQuery.toLowerCase().trim();
    
    let answerText = "";
    let finalSource = null;
    let dbSourceTable = null;

    // Verify cache table structure exists on startup
    ensureAcademicCacheTable();

    // Priority 0: Exact or near-exact match in the approved FAQs table
    const faqMatch = await safeDbCall(
      async () => {
        const res = await db.query(
          'SELECT answer, category FROM faqs WHERE is_approved = true AND TRIM(LOWER(question)) = TRIM(LOWER($1)) LIMIT 1',
          [userQuery]
        );
        return res.rows[0];
      },
      async () => {
        return (MOCK_STORE.faqs || []).find(f => f.question.toLowerCase().trim() === cleanQuery && f.is_approved) || null;
      }
    );

    if (faqMatch) {
      answerText = faqMatch.answer;
      finalSource = "Official College Database";
      dbSourceTable = "faqs";
    } else {
      // Priority 0.5: Check admin-resolved unknown questions (questions previously flagged but now answered by admin)
      const resolvedMatch = await safeDbCall(
        async () => {
          const res = await db.query(
            `SELECT COALESCE(resolved_answer, answer) AS best_answer 
             FROM unknown_questions 
             WHERE status IN ('answered', 'resolved') 
             AND (resolved_answer IS NOT NULL OR answer IS NOT NULL)
             AND TRIM(LOWER(question)) = TRIM(LOWER($1)) 
             LIMIT 1`,
            [userQuery]
          );
          return res.rows[0];
        },
        async () => null
      );

      if (resolvedMatch?.best_answer) {
        answerText = resolvedMatch.best_answer;
        finalSource = "Official College Database";
        dbSourceTable = "unknown_questions";
      } else {
      // Step 1: Category Classification (Zero Latency / Local Filters)
      const category = classifyQueryLocal(userQuery);
      console.log(`[Production Router] Query "${userQuery}" classified as Category ${category}`);

      if (category === 'A') {
        // CATEGORY A: Normal Conversation (Greetings, Chit-chat)
        answerText = generateLocalConversationalReply(cleanQuery);
        finalSource = null; // Greetings don't need a source label
      } 
      else if (category === 'B') {
        // CATEGORY B: PathMate questions
        answerText = generateLocalPathMateReply(cleanQuery);
        finalSource = "Official College Database";
      } 
      else if (category === 'C') {
        // CATEGORY C: College & University Questions (Priority 1: DB -> Priority 2: Scraper -> Fallback: Polite Decline)
        const isAnnaUnivQuery = cleanQuery.includes('anna university') || cleanQuery.includes('annauniv') || cleanQuery.includes('regulation') || cleanQuery.includes('credit') || cleanQuery.includes('curriculum') || cleanQuery.includes('syllabus') || cleanQuery.includes('pattern') || cleanQuery.includes('arrear') || cleanQuery.includes('cgpa') || cleanQuery.includes('gpa');
        
        const localResult = await resolveLocalKnowledge(userQuery, userId);
        let dbResolved = localResult.resolved && localResult.confidence === 'HIGH';
        
        if (dbResolved) {
          if (localResult.isContext) {
            // Regulations / Anna Univ semantic chunks search
            const groundedRes = await answerGroundedQuestion(userQuery, localResult.answer, history);
            if (groundedRes.isGrounded) {
              answerText = groundedRes.answer;
              dbSourceTable = groundedRes.sourceTable || 'chatbot_chunks';
              finalSource = isAnnaUnivQuery ? "Official Anna University Information" : "Official College Database";
            } else {
              dbResolved = false; // Weak grounding, fallback to website scraper
            }
          } else {
            // Direct database facts (HOD, calendars)
            answerText = localResult.answer;
            dbSourceTable = localResult.sourceTable;
            finalSource = isAnnaUnivQuery ? "Official Anna University Information" : "Official College Database";
          }
        }

        if (!dbResolved) {
          if (isAnnaUnivQuery) {
            // For Anna University regulations, if DB check misses, we must politely decline rather than guess
            answerText = "I'm sorry, I couldn't verify the latest official Anna University information regarding regulations or credits. Please reference your syllabus or consult the official Anna University portal.";
            finalSource = "Official Anna University Information";
          } else {
            // Priority 2: Official Saranathan Website Scraper
            const isGeneralLifeQuery = cleanQuery.includes('life') || cleanQuery.includes('experience') || cleanQuery.includes('tips') || cleanQuery.includes('advice') || cleanQuery.includes('how is it') || cleanQuery.includes('how to survive') || cleanQuery.includes('how to prepare');
            
            const isDeptOverviewQuery = (cleanQuery.includes('department') || cleanQuery.includes('dept') || cleanQuery.includes('cse') || cleanQuery.includes('ece') || cleanQuery.includes('eee') || cleanQuery.includes('it') || cleanQuery.includes('csbs') || cleanQuery.includes('mech') || cleanQuery.includes('civil') || cleanQuery.includes('aids')) && (cleanQuery.includes('about') || cleanQuery.includes('explain') || cleanQuery.includes('tell') || cleanQuery.includes('overview') || cleanQuery.includes('what is') || cleanQuery.includes('describe') || cleanQuery.includes('details of') || cleanQuery.includes('introduce'));
            
            const isCollegeOverviewQuery = (cleanQuery.includes('saranathan') || cleanQuery.includes('sce') || cleanQuery.includes('college')) && (cleanQuery.includes('about') || cleanQuery.includes('tell') || cleanQuery.includes('introduce') || cleanQuery.includes('what is') || cleanQuery.includes('explain') || cleanQuery.includes('describe') || cleanQuery.includes('overview'));

            const isAllowedGeminiFallback = isGeneralLifeQuery || isDeptOverviewQuery || isCollegeOverviewQuery;
            
            console.log("[Website Scraper Fallback] Database miss on college query. Crawling official website...");
            try {
              const websiteUrl = getRelevantUrl(userQuery);
              const pageContent = await fetchWebsiteContent(websiteUrl);
              const websiteRes = await askGeminiWithWebsiteContext(userQuery, pageContent, history.slice(-8));
              
              if (websiteRes.answer && !websiteRes.answer.includes("I couldn't verify the latest official information")) {
                answerText = websiteRes.answer;
                finalSource = "Official Saranathan Website";
                dbSourceTable = "website_scraped";
              } else {
                if (isAllowedGeminiFallback) {
                  console.log("[College Fallback] Query is a general overview or experience. Invoking Gemini...");
                  try {
                    const optimizedHistory = history.slice(-8);
                    const geminiRes = await askGeminiAcademic(userQuery, optimizedHistory);
                    answerText = geminiRes.answer;
                    finalSource = "AI-generated Educational Response";
                  } catch (geminiErr) {
                    console.error("Gemini fallback failed:", geminiErr.message);
                    answerText = "I'm sorry, I'm temporarily unable to reach the AI assistant services. Please try again in a few moments, or check with the campus administrative office for urgent inquiries.";
                    finalSource = null;
                  }
                } else {
                  // If website context is missing the answer, politely decline to guess
                  answerText = "I'm sorry, I couldn't verify the latest official information about that in the college database or website. Please consult the administrative office or check your student handbook.";
                  finalSource = "Official Saranathan Website";
                }
              }
            } catch (err) {
              console.error("Website scraper fallback failed:", err.message);
              if (isAllowedGeminiFallback) {
                try {
                  const optimizedHistory = history.slice(-8);
                  const geminiRes = await askGeminiAcademic(userQuery, optimizedHistory);
                  answerText = geminiRes.answer;
                  finalSource = "AI-generated Educational Response";
                } catch (geminiErr) {
                  console.error("Gemini fallback failed:", geminiErr.message);
                  answerText = "I'm sorry, I'm temporarily unable to reach the AI assistant services. Please try again in a few moments, or check with the campus administrative office for urgent inquiries.";
                  finalSource = null;
                }
              } else {
                answerText = "I'm sorry, I'm temporarily unable to reach the AI assistant services. Please try again in a few moments, or check with the campus administrative office for urgent inquiries.";
                finalSource = "Official Saranathan Website";
              }
            }
          }
        }
      } 
      else if (category === 'D') {
        // CATEGORY D: Academic Questions (Three-stage pipeline)
        
        // Stage 1: Check Exact Cache Match
        let cachedAnswer = await getCachedAcademicResponse(userQuery);
        if (cachedAnswer) {
          console.log("[Cache Hit] Exact query match found in academic cache.");
          answerText = cachedAnswer;
          finalSource = "AI-generated Educational Response";
        } else {
          // Stage 2: Check Semantic Cache Match using Embeddings
          cachedAnswer = await getSemanticCachedResponse(userQuery);
          if (cachedAnswer) {
            console.log("[Cache Hit] Semantically equivalent query match found in academic cache.");
            answerText = cachedAnswer;
            finalSource = "AI-generated Educational Response";
          } else {
            // Stage 3: Call Gemini API (Only for uncached academic queries)
            try {
              const optimizedHistory = history.slice(-8);
              const geminiRes = await askGeminiAcademic(userQuery, optimizedHistory);
              answerText = geminiRes.answer;
              finalSource = "AI-generated Educational Response";

              // Save to cache (non-blocking)
              saveAcademicResponseToCache(userQuery, answerText).catch(err => {
                console.warn("Failed to cache response:", err.message);
              });
            } catch (err) {
              console.error("Gemini API academic call failed:", err.message);
              answerText = "I'm sorry, I'm temporarily unable to reach the AI assistant services. Please try again in a few moments, or check with the campus administrative office for urgent inquiries.";
              finalSource = null;
            }
          }
        }
      } 
      else if (category === 'E') {
        // CATEGORY E: Outside Scope (Decline politely, No Gemini)
        answerText = "I'm designed to assist with academics, Saranathan College information, and PathMate-related queries. For non-academic topics, I recommend using a general AI assistant. If you have any academic or campus-related questions, I'll be happy to help.";
        finalSource = null;
      }
      } // end resolvedMatch else
    } // end faqMatch else

    // Clean formatting and replace literal raw \n strings with real newlines
    if (answerText) {
      answerText = answerText.replace(/\\n/g, '\n');
    }

    // Translate answer if language is Tamil or Hindi
    if (language && language !== 'en') {
      try {
        answerText = await translateText(answerText, language);
      } catch (err) {
        console.warn("Failed to translate final answer:", err.message);
      }
    }

    // Append standard Grounded Source block if source was found
    if (finalSource) {
      answerText += `\n\n**Source**\n${finalSource}`;
    }

    // Log messages to DB / Mock Store
    await safeDbCall(
      async () => {
        await db.query(
          `INSERT INTO chat_messages (user_id, role, content, source_table)
           VALUES ($1, 'user', $2, null)`, [userId, userQuery]
        );
        await db.query(
          `INSERT INTO chat_messages (user_id, role, content, source_table)
           VALUES ($1, 'assistant', $2, $3)`,
          [userId, answerText, dbSourceTable]
        );
      },
      async () => {
        MOCK_STORE.chatMessages.push({ user_id: userId, role: 'user', content: userQuery, source_table: null });
        MOCK_STORE.chatMessages.push({ user_id: userId, role: 'assistant', content: answerText, source_table: dbSourceTable });
      }
    );

    const responsePayload = {
      answer: answerText,
      isGrounded: true,
      sourceTable: finalSource
    };

    res.json(responsePayload);
  } catch (error) {
    console.error("Chat route error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/chat/report
 * Reports a question that the AI couldn't answer locally to the Admin review desk.
 */
router.post('/chat/report', async (req, res) => {
  const { question, userId } = req.body;
  try {
    await safeDbCall(
      async () => {
        await db.query(
          'INSERT INTO unknown_questions (question, user_id, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [question, userId || null, 'pending']
        );
      },
      async () => {
        MOCK_STORE.unknownQuestions = MOCK_STORE.unknownQuestions || [];
        const exists = MOCK_STORE.unknownQuestions.some(q => q.question === question);
        if (!exists) {
          MOCK_STORE.unknownQuestions.push({
            id: MOCK_STORE.unknownQuestions.length + 1,
            question,
            user_id: userId || null,
            status: 'pending',
            created_at: new Date().toISOString()
          });
        }
      }
    );
    res.json({ success: true, message: 'Question reported successfully.' });
  } catch (err) {
    console.error("Report question failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/chat/report-answer
 * Reports an incorrect AI answer to the Admin review desk with feedback details.
 */
router.post('/chat/report-answer', async (req, res) => {
  const { question, aiAnswer, reportedReason, studentComments, source, severity, conversationId, userId } = req.body;
  
  try {
    // Resolve user details if user exists
    let userName = 'Anonymous Student';
    let userDept = 'N/A';
    
    if (userId) {
      const userRes = await safeDbCall(
        async () => {
          return await db.query('SELECT u.full_name, d.name as dept FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = $1', [userId]);
        },
        async () => {
          const user = MOCK_STORE.users.find(u => u.id === userId);
          if (user) {
            const dept = MOCK_STORE.departments.find(d => d.id === user.department_id);
            return { rows: [{ full_name: user.full_name, dept: dept ? dept.name : 'N/A' }] };
          }
          return { rows: [] };
        }
      );
      if (userRes.rows.length > 0) {
        userName = userRes.rows[0].full_name;
        userDept = userRes.rows[0].dept;
      }
    }

    await safeDbCall(
      async () => {
        await db.query(
          `INSERT INTO ai_reports (question, ai_answer, reported_reason, student_comments, conversation_id, source, user_id, user_name, user_department, severity, resolution_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')`,
          [question, aiAnswer, reportedReason, studentComments, conversationId || null, source || 'Gemini', userId || null, userName, userDept, severity || 'Medium']
        );
      },
      async () => {
        MOCK_STORE.aiReports = MOCK_STORE.aiReports || [];
        MOCK_STORE.aiReports.push({
          id: MOCK_STORE.aiReports.length + 1,
          question,
          ai_answer: aiAnswer,
          reported_reason: reportedReason,
          student_comments: studentComments,
          timestamp: new Date().toISOString(),
          conversation_id: conversationId || null,
          source: source || 'Gemini',
          user_id: userId || null,
          user_name: userName,
          user_department: userDept,
          severity: severity || 'Medium',
          resolution_status: 'pending'
        });
      }
    );

    res.json({ success: true, message: 'Factual error reported successfully to AI review desk.' });
  } catch (err) {
    console.error("Failed to insert AI report:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 8. GET /api/digest
 * Computes a "New this week" summary banner via Gemini
 */
router.get('/digest', async (req, res) => {
  try {
    const result = await safeDbCall(
      async () => {
        const eventsRes = await db.query('SELECT name, description, event_date FROM events LIMIT 3');
        const clubsRes = await db.query('SELECT name, description FROM clubs LIMIT 3');
        
        const digest = await generateDigest(eventsRes.rows, clubsRes.rows);
        return { summary: digest.summary };
      },
      async () => {
        const digest = await generateDigest(MOCK_STORE.events, MOCK_STORE.clubs);
        return { summary: digest.summary };
      }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 9. POST /api/roommate/opt-in
 * Toggles visibility in roommate list
 */
router.post('/roommate/opt-in', async (req, res) => {
  const { userId, isVisible } = req.body;

  try {
    await safeDbCall(
      async () => {
        await db.query(
          `INSERT INTO roommate_opt_in (user_id, is_visible) 
           VALUES ($1, $2) ON CONFLICT (user_id) 
           DO UPDATE SET is_visible = EXCLUDED.is_visible`,
          [userId, isVisible]
        );
      },
      async () => {
        MOCK_STORE.roommateOptIn[userId] = isVisible;
      }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 10. GET /api/roommate/matches/:userId
 * SQL filters matching roommates in the same block, checks request status, hides contact info unless accepted
 */
router.get('/roommate/matches/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    const result = await safeDbCall(
      async () => {
        const userRes = await db.query('SELECT hostel_block, gender FROM users WHERE id = $1', [userId]);
        const userBlock = userRes.rows[0]?.hostel_block;
        const userGender = userRes.rows[0]?.gender || 'Male';

        if (!userBlock) return []; // Day Scholar has no matches

        // Find matching opt-in roommate candidates in same block and same gender, sorted alphabetically
        const candidatesRes = await db.query(
          `SELECT u.id, u.name, d.name as branch, u.stay_type, u.hostel_block,
           array_to_string(array_agg(DISTINCT i.label), ', ') as interests
           FROM users u
           JOIN roommate_opt_in ro ON u.id = ro.user_id
           LEFT JOIN departments d ON u.department_id = d.id
           LEFT JOIN user_interests ui ON u.id = ui.user_id
           LEFT JOIN interests i ON ui.interest_id = i.id
           WHERE ro.is_visible = true AND u.hostel_block = $1 AND u.id != $2 AND u.gender = $3
           GROUP BY u.id, u.name, d.name, u.stay_type, u.hostel_block
           ORDER BY u.name ASC`,
          [userBlock, userId, userGender]
        );

        const candidates = candidatesRes.rows;

        // Fetch connection request statuses in one single query to prevent N+1 query latency
        const requestsRes = await db.query(
          `SELECT id, requester_id, requested_id, status 
           FROM roommate_match_requests 
           WHERE requester_id = $1 OR requested_id = $1`,
          [userId]
        );
        const requests = requestsRes.rows;

        // Build map for O(1) lookup
        const requestMap = new Map();
        requests.forEach(req => {
          const partnerId = req.requester_id === userId ? req.requested_id : req.requester_id;
          requestMap.set(partnerId, req);
        });

        const payload = [];
        for (const cand of candidates) {
          const matchRequest = requestMap.get(cand.id);
          let connectionStatus = 'none';
          let requestId = null;
          
          if (matchRequest) {
            requestId = matchRequest.id;
            connectionStatus = matchRequest.status;
          }

          payload.push({
            id: cand.id,
            name: cand.name,
            branch: cand.branch || 'Engineering',
            origin: 'Trichy Region',
            sleepHabits: 'Balanced Schedule',
            interests: cand.interests ? cand.interests.split(', ') : [],
            hostelBlock: cand.hostel_block,
            lifestyle: 'Compatible student profile.',
            status: connectionStatus,
            requestId,
            contactInfo: connectionStatus === 'accepted' ? 'Contact Wardens Office for details' : null
          });
        }

        return payload;
      },
      async () => {
        const user = MOCK_STORE.users.find(u => u.id === userId);
        if (!user || !user.hostel_block) return [];

        const optInIds = Object.keys(MOCK_STORE.roommateOptIn)
          .filter(id => MOCK_STORE.roommateOptIn[id] === true)
          .map(Number);

        const userGender = user.gender || 'Male';
        const candidates = MOCK_STORE.users.filter(
          u => optInIds.includes(u.id) && u.id !== userId && u.hostel_block === user.hostel_block && u.gender === userGender
        );

        return candidates.map(cand => {
          const req = MOCK_STORE.roommateRequests.find(
            r => (r.requester_id === userId && r.requested_id === cand.id) ||
                 (r.requester_id === cand.id && r.requested_id === userId)
          );

          const dept = MOCK_STORE.departments.find(d => d.id === cand.department_id)?.name || 'Engineering';

          return {
            id: cand.id,
            name: cand.name,
            branch: dept,
            origin: 'Trichy Region',
            sleepHabits: 'Balanced Schedule',
            interests: ['Coding', 'Sports'],
            hostelBlock: cand.hostel_block,
            lifestyle: 'Quiet profile.',
            status: req ? req.status : 'none',
            requestId: req ? req.id : null,
            contactEmail: req && req.status === 'accepted' ? `student.${cand.id}@saranathan.ac.in` : '[LOCKED]'
          };
        }).sort((a, b) => a.name.localeCompare(b.name));
      }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 11. POST /api/roommate/request
 * Creates a roommate request connection
 */
router.post('/roommate/request', async (req, res) => {
  const { requesterId, requestedId } = req.body;

  try {
    const result = await safeDbCall(
      async () => {
        // Check if matching request from other side already exists
        const reverseRes = await db.query(
          `SELECT id, status FROM roommate_match_requests 
            WHERE requester_id = $1 AND requested_id = $2`, [requestedId, requesterId]
        );

        if (reverseRes.rows.length > 0) {
          // Mutual connection! Accept both
          const matchId = reverseRes.rows[0].id;
          await db.query(
            "UPDATE roommate_match_requests SET status = 'accepted' WHERE id = $1", [matchId]
          );
          return { status: 'accepted', requestId: matchId };
        }

        // Insert new request
        const insertRes = await db.query(
          `INSERT INTO roommate_match_requests (requester_id, requested_id, status)
           VALUES ($1, $2, 'pending') RETURNING id`, [requesterId, requestedId]
        );
        return { status: 'pending', requestId: insertRes.rows[0].id };
      },
      async () => {
        const reverse = MOCK_STORE.roommateRequests.find(
          r => r.requester_id === requestedId && r.requested_id === requesterId
        );

        if (reverse) {
          reverse.status = 'accepted';
          return { status: 'accepted', requestId: reverse.id };
        }

        const id = MOCK_STORE.roommateRequests.length + 1;
        const newReq = {
          id,
          requester_id: requesterId,
          requested_id: requestedId,
          status: 'pending'
        };
        MOCK_STORE.roommateRequests.push(newReq);
        return { status: 'pending', requestId: id };
      }
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 12. PATCH /api/roommate/request/:id
 * Accepts or declines roommate request
 */
router.patch('/roommate/request/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body; // 'accepted' or 'declined'

  try {
    await safeDbCall(
      async () => {
        await db.query(
          "UPDATE roommate_match_requests SET status = $1 WHERE id = $2", [status, id]
        );
      },
      async () => {
        const reqItem = MOCK_STORE.roommateRequests.find(r => r.id === id);
        if (reqItem) reqItem.status = status;
      }
    );
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



/**
 * 14. GET /api/emergency-contacts
 * Returns official list of helpline numbers
 */
router.get('/emergency-contacts', async (req, res) => {
  try {
    const result = await safeDbCall(
      async () => {
        const resContacts = await db.query('SELECT label, contact_value, notes FROM emergency_contacts');
        return resContacts.rows;
      },
      async () => {
        return MOCK_STORE.emergencyContacts;
      }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 15. GET /api/faculty
 * Returns faculty lookup
 */
router.get('/faculty', async (req, res) => {
  const deptName = req.query.department;
  const cacheKey = `faculty_${deptName || 'all'}`;

  try {
    const result = await safeDbCall(
      async () => {
        return getCachedData(cacheKey, 15, async () => {
          let queryStr = `SELECT f.name, f.designation, f.contact_email, l.name as office, d.name as dept
                          FROM faculty f 
                          LEFT JOIN locations l ON f.office_location_id = l.id
                          LEFT JOIN departments d ON f.department_id = d.id`;
          let params = [];

          if (deptName) {
            queryStr += ' WHERE d.name = $1';
            params.push(deptName);
          }

          const facRes = await db.query(queryStr, params);
          return facRes.rows;
        });
      },
      async () => {
        let list = MOCK_STORE.faculty.map(f => {
          const dept = MOCK_STORE.departments.find(d => d.id === f.department_id)?.name || 'Engineering';
          return {
            name: f.name,
            designation: f.designation,
            contact_email: f.contact_email,
            office: 'Main Campus',
            dept
          };
        });
        if (deptName) {
          list = list.filter(f => f.dept === deptName);
        }
        return list;
      }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 16. GET /api/timetable/:departmentId/:section
 * Timetable lookup
 */
router.get('/timetable/:departmentId/:section', async (req, res) => {
  const departmentId = parseInt(req.params.departmentId);
  const section = req.params.section;

  try {
    const result = await safeDbCall(
      async () => {
        const timeRes = await db.query(
          `SELECT t.day_of_week, t.start_time, t.end_time, t.subject, f.name as teacher
           FROM timetable t
           LEFT JOIN faculty f ON t.faculty_id = f.id
           WHERE t.department_id = $1 AND t.section = $2
           ORDER BY t.day_of_week, t.start_time`,
          [departmentId, section]
        );
        return timeRes.rows;
      },
      async () => {
        return MOCK_STORE.timetable
          .filter(t => t.department_id === departmentId && t.section === section)
          .map(t => {
            const fac = MOCK_STORE.faculty.find(f => f.id === t.faculty_id);
            return {
              day_of_week: t.day_of_week,
              start_time: t.start_time,
              end_time: t.end_time,
              subject: t.subject,
              teacher: fac ? fac.name : 'Professor'
            };
          });
      }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/departments
 * Returns the full list of SCE departments (id, name, full_name)
 */
router.get('/departments', async (req, res) => {
  try {
    const result = await safeDbCall(
      async () => {
        return getCachedData('departments', 30, async () => {
          const res = await db.query('SELECT id, name, full_name FROM departments ORDER BY id');
          return res.rows;
        });
      },
      async () => MOCK_STORE.departments
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/faculty/:departmentId
 * Returns faculty members for a given department id
 */
router.get('/faculty/:departmentId', async (req, res) => {
  const departmentId = parseInt(req.params.departmentId);
  const cacheKey = `faculty_dept_${departmentId}`;
  try {
    const result = await safeDbCall(
      async () => {
        return getCachedData(cacheKey, 15, async () => {
          const r = await db.query(
            `SELECT f.id, f.name, f.designation, f.contact_email, d.name as department_name, f.photo_url, f.qualification, f.cabin, f.hod_status, f.principal_status, f.office_hours
             FROM faculty f
             JOIN departments d ON f.department_id = d.id
             WHERE f.department_id = $1
             ORDER BY f.name`,
            [departmentId]
          );
          return r.rows;
        });
      },
      async () => {
        return MOCK_STORE.faculty
          .filter(f => f.department_id === departmentId)
          .map(f => ({
            id: f.id,
            name: f.name,
            designation: f.designation,
            contact_email: f.contact_email,
            photo_url: f.photo_url || null,
            qualification: f.qualification || null,
            department_name: MOCK_STORE.departments.find(d => d.id === f.department_id)?.name || ''
          }));
      }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/campus-blocks
 * Returns all campus_blocks with block_type
 */
router.get('/campus-blocks', async (req, res) => {
  try {
    const result = await safeDbCall(
      async () => {
        return getCachedData('campus_blocks', 30, async () => {
          const r = await db.query('SELECT id, block_name, svg_id, block_type FROM campus_blocks ORDER BY id');
          return r.rows;
        });
      },
      async () => MOCK_STORE.campusBlocks
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/campus-blocks/:svgId
 * Returns one block's floor_details, keyed by svg_id
 */
router.get('/campus-blocks/:svgId', async (req, res) => {
  const { svgId } = req.params;
  try {
    const result = await safeDbCall(
      async () => {
        const blockRes = await db.query('SELECT id, block_name, block_type FROM campus_blocks WHERE svg_id = $1', [svgId]);
        if (blockRes.rows.length === 0) {
          return null;
        }
        const block = blockRes.rows[0];
        const detailsRes = await db.query(
          'SELECT floor_label, detail_text FROM block_floor_details WHERE block_id = $1 ORDER BY id',
          [block.id]
        );
        return {
          block_name: block.block_name,
          block_type: block.block_type,
          floors: detailsRes.rows
        };
      },
      async () => {
        const block = MOCK_STORE.campusBlocks.find(b => b.svg_id === svgId);
        if (!block) return null;
        const details = MOCK_STORE.blockFloorDetails
          .filter(d => d.block_id === block.id)
          .map(d => ({
            floor_label: d.floor_label,
            detail_text: d.detail_text
          }));
        return {
          block_name: block.block_name,
          block_type: block.block_type,
          floors: details
        };
      }
    );
    if (!result) {
      return res.status(404).json({ error: 'Campus block not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/navigate
 * Uses Gemini NLP to parse destination and intent, then searches database & map landmarks for coordinates.
 */
router.post('/ai/navigate', async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  try {
    const parsed = await parseNavigationQuery(query);
    const destTerm = (parsed.destination || query).toLowerCase();
    
    let destinationId = 'rv-block';

    // Comprehensive department & landmark keyword matching
    if (destTerm.includes('cse') || destTerm.includes('computer') || destTerm.includes('principal') || destTerm.includes('rv') || destTerm.includes('admin') || destTerm.includes('placement')) {
      destinationId = 'rv-block';
    } else if (destTerm.includes('ece') || destTerm.includes('electronics') || destTerm.includes('communication') || destTerm.includes('ks') || destTerm.includes('eee') || destTerm.includes('electrical')) {
      destinationId = 'ks-block';
    } else if (destTerm.includes('ai') || destTerm.includes('data science') || destTerm.includes('library') || destTerm.includes('bd') || destTerm.includes('csbs')) {
      destinationId = 'bd-block';
    } else if (destTerm.includes('civil') || destTerm.includes('auditorium') || destTerm.includes('js') || destTerm.includes('nss')) {
      destinationId = 'js-block';
    } else if (destTerm.includes('mechanical') || destTerm.includes('me') || destTerm.includes('workshop') || destTerm.includes('cad')) {
      destinationId = 'me-block';
    } else if (destTerm.includes('canteen') || destTerm.includes('food') || destTerm.includes('cafeteria') || destTerm.includes('restroom')) {
      destinationId = 'cafeteria';
    } else if (destTerm.includes('hostel') || destTerm.includes('boys')) {
      destinationId = 'boys-hostel';
    } else if (destTerm.includes('temple') || destTerm.includes('ganesha') || destTerm.includes('vinayagar')) {
      destinationId = 'temple';
    } else if (destTerm.includes('atm') || destTerm.includes('cub') || destTerm.includes('bank')) {
      destinationId = 'atm';
    } else if (destTerm.includes('cricket') || destTerm.includes('ground') || destTerm.includes('sports')) {
      destinationId = 'main-cricket';
    }

    res.json({
      intent: parsed.intent || 'navigate',
      source: parsed.source || 'Main Gate',
      destination: parsed.destination || query,
      route: 'walking',
      highlightPins: [destinationId],
      destinationId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 23. POST /api/translate
 * Translates dynamic text (weekly digests, recommendations, timelines) via Gemini Generative AI
 */
router.post('/translate', async (req, res) => {
  const { text, targetLanguage } = req.body;
  if (!text || !targetLanguage) {
    return res.status(400).json({ error: 'Text and targetLanguage are required.' });
  }

  try {
    const translated = await translateText(text, targetLanguage);
    res.json({ success: true, translated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



/**
 * GET /api/roommates
 * Fetch roommate profiles from PostgreSQL
 */
router.get('/roommates', async (req, res) => {
  try {
    const { hostel_block, gender, search } = req.query;
    let sql = `SELECT * FROM roommates WHERE is_visible = true`;
    const params = [];
    let paramIdx = 1;

    if (hostel_block && hostel_block !== 'all') {
      sql += ` AND LOWER(hostel_block) LIKE $${paramIdx++}`;
      params.push(`%${hostel_block.toLowerCase()}%`);
    }

    if (gender && gender !== 'all') {
      sql += ` AND LOWER(gender) = $${paramIdx++}`;
      params.push(gender.toLowerCase());
    }

    if (search && search.trim() !== '') {
      sql += ` AND (LOWER(name) LIKE $${paramIdx} OR LOWER(department) LIKE $${paramIdx} OR LOWER(hostel_block) LIKE $${paramIdx})`;
      params.push(`%${search.trim().toLowerCase()}%`);
      paramIdx++;
    }

    sql += ` ORDER BY name ASC`;
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/roommates/profile
 * Create / Update Roommate Profile
 */
router.post('/roommates/profile', async (req, res) => {
  try {
    const {
      student_id, name, gender = 'Male', department, year = '1st Year',
      hostel_block, preferred_language = 'English', sleep_schedule = '10 PM - 6 AM',
      study_habits = 'Quiet Study', cleanliness = 'Very Neat',
      smoking_preference = 'Non-Smoker', food_preference = 'Vegetarian',
      interests = [], hobbies = [], room_preference = '2 Sharing (Non-AC)',
      profile_photo, is_visible = true, contact_email, phone
    } = req.body;

    if (!name || !department || !hostel_block) {
      return res.status(400).json({ error: 'Name, Department, and Hostel Block are required' });
    }

    const insertRes = await db.query(
      `INSERT INTO roommates (
        student_id, name, gender, department, year, hostel_block,
        preferred_language, sleep_schedule, study_habits, cleanliness,
        smoking_preference, food_preference, interests, hobbies,
        room_preference, profile_photo, is_visible, contact_email, phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        student_id || `SCE${Date.now().toString().slice(-6)}`,
        name, gender, department, year, hostel_block,
        preferred_language, sleep_schedule, study_habits, cleanliness,
        smoking_preference, food_preference,
        JSON.stringify(interests), JSON.stringify(hobbies),
        room_preference, profile_photo || null, is_visible,
        contact_email || null, phone || null
      ]
    );
    res.status(201).json(insertRes.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stats
 * Live metrics calculated directly from PostgreSQL tables
 */
router.get('/stats', async (req, res) => {
  try {
    const [eventsCount, clubsCount, noticesCount, tasksCount, campusStatsResult] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM events`),
      db.query(`SELECT COUNT(*) FROM clubs`),
      db.query(`SELECT COUNT(*) FROM notices`),
      db.query(`SELECT COUNT(*) FILTER (WHERE status = 'completed') AS completed, COUNT(*) FILTER (WHERE status = 'pending') AS pending FROM student_tasks`),
      db.query(`SELECT * FROM campus_stats WHERE id = 1`)
    ]);

    const activeEvents = parseInt(eventsCount.rows[0]?.count || 0, 10);
    const activeClubs = parseInt(clubsCount.rows[0]?.count || 0, 10);
    const totalNotices = parseInt(noticesCount.rows[0]?.count || 0, 10);
    const completedTasks = parseInt(tasksCount.rows[0]?.completed || 0, 10);
    const pendingTasks = parseInt(tasksCount.rows[0]?.pending || 0, 10);

    const stats = campusStatsResult.rows[0] || { students_guided: 1485, campus_locations: 25, active_services: 8 };

    res.json({
      totalStudents: stats.students_guided,
      activeLocations: stats.campus_locations,
      activeServices: stats.active_services,
      activeEvents,
      activeClubs,
      totalNotices,
      completedTasks,
      pendingTasks,
      aiChatsToday: 0
    });
  } catch (error) {
    res.json({
      totalStudents: 1485,
      activeLocations: 25,
      activeServices: 8,
      activeEvents: 0,
      activeClubs: 0,
      totalNotices: 0,
      completedTasks: 0,
      pendingTasks: 0,
      aiChatsToday: 0
    });
  }
});

/**
 * GET /api/activity-logs
 * Dynamic recent activity feed from PostgreSQL tables
 */
router.get('/activity-logs', async (req, res) => {
  try {
    const logsRes = await db.query(`
      SELECT 'notice' AS category, title AS title, 'Published Official Notice' AS action, author AS actor, created_at AS timestamp FROM notices
      UNION ALL
      SELECT 'event' AS category, name AS title, 'Upcoming Event Scheduled' AS action, 'SCE Events Desk' AS actor, created_at AS timestamp FROM events
      UNION ALL
      SELECT 'club' AS category, name AS title, 'Club Active for Registration' AS action, 'Club Coordinator' AS actor, created_at AS timestamp FROM clubs
      ORDER BY timestamp DESC
      LIMIT 8
    `);
    res.json(logsRes.rows);
  } catch (error) {
    res.json([
      { category: 'notice', title: 'Schedule for Semester Examinations 2026', action: 'Published Official Notice', actor: 'COE Cell', timestamp: new Date().toISOString() },
      { category: 'event', title: 'Hackwell 24-Hour Hackathon Registration Open', action: 'Upcoming Event Scheduled', actor: 'SCE Tech Club', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { category: 'club', title: 'Coding Ninjas Student Chapter Inauguration', action: 'Club Active for Registration', actor: 'CSE Department', timestamp: new Date(Date.now() - 7200000).toISOString() }
    ]);
  }
});

/**
 * GET /api/seniors
 * Fetch all senior mentors directly from PostgreSQL (100% sync with Admin panel)
 */
router.get('/seniors', async (req, res) => {
  try {
    const { department, search } = req.query;
    let sql = `
      SELECT s.*, COALESCE(s.department, d.name, 'Computer Science & Engineering') AS department
      FROM seniors s
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (department && department !== 'All' && department !== 'all') {
      sql += ` AND (LOWER(s.department) LIKE $${idx} OR LOWER(d.name) LIKE $${idx})`;
      params.push(`%${department.toLowerCase()}%`);
      idx++;
    }

    if (search && search.trim() !== '') {
      sql += ` AND (LOWER(s.name) LIKE $${idx} OR LOWER(s.department) LIKE $${idx} OR LOWER(d.name) LIKE $${idx} OR LOWER(s.skills::text) LIKE $${idx} OR LOWER(s.domains::text) LIKE $${idx} OR LOWER(s.interests::text) LIKE $${idx})`;
      params.push(`%${search.trim().toLowerCase()}%`);
      idx++;
    }

    sql += ` ORDER BY s.name ASC`;
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error("GET /api/seniors error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/seniors
 * Register senior mentor profile into PostgreSQL
 */
router.post('/seniors', async (req, res) => {
  try {
    const {
      name, department, year = 'Final Year', languages = ['English', 'Tamil'],
      skills = [], domains = [], linkedin_url, email, phone, availability = 'Weekdays & Evenings', mentor_status = 'active'
    } = req.body;

    if (!name || !department) {
      return res.status(400).json({ error: 'Name and Department are required' });
    }

    const result = await db.query(
      `INSERT INTO seniors (
        name, department, year, languages, skills, domains,
        linkedin_url, email, phone, availability, mentor_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        name, department, year,
        JSON.stringify(languages),
        JSON.stringify(skills),
        JSON.stringify(domains),
        linkedin_url || null,
        email || null,
        phone || null,
        availability,
        mentor_status
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("POST /api/seniors error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/committees
 * Fetch official institutional committees directly from PostgreSQL
 */
router.get('/committees', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM committees WHERE status = 'active' OR status IS NULL ORDER BY id ASC`);
    res.json(result.rows);
  } catch (error) {
    console.error("GET /api/committees error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/clubs
 * Fetch registered student clubs directly from PostgreSQL
 */
router.get('/clubs', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM clubs ORDER BY id DESC`);
    res.json(result.rows);
  } catch (error) {
    console.error("GET /api/clubs error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/events
 * Fetch upcoming campus events directly from PostgreSQL
 */
router.get('/events', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM events ORDER BY date ASC, id DESC`);
    res.json(result.rows);
  } catch (error) {
    console.error("GET /api/events error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/notices
 * Fetch active official notices directly from PostgreSQL
 */
router.get('/notices', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM notices WHERE status = 'published' OR status IS NULL ORDER BY is_pinned DESC, id DESC`);
    res.json(result.rows);
  } catch (error) {
    console.error("GET /api/notices error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/roommates
 * Fetch active hostel roommates directly from PostgreSQL (authenticated, matching gender only, restricted to hostellers)
 */
router.get('/roommates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    // Fetch requester stay_type and gender
    const userRes = await db.query('SELECT stay_type, hosteller, gender FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.stay_type !== 'hostel' && !user.hosteller) {
      return res.status(403).json({ error: 'Roommate finder option is only available to hostel students.' });
    }

    const gender = user.gender || 'Male';
    // Fetch only visible roommates of the SAME gender
    const result = await db.query(
      `SELECT * FROM roommates 
       WHERE is_visible = true AND LOWER(gender) = LOWER($1) AND user_id != $2
       ORDER BY id DESC`,
      [gender, userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("GET /api/roommates error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/roommates/profile
 * Register/Opt-in hostel roommate profile into PostgreSQL
 */
router.post('/roommates/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    // Fetch user details to verify hosteller status and gender
    const userRes = await db.query('SELECT stay_type, hosteller, gender FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.stay_type !== 'hostel' && !user.hosteller) {
      return res.status(403).json({ error: 'Only hostel students can create roommate profiles.' });
    }

    const {
      name, department, year = '1st Year', hostel_block,
      preferred_language = 'English', sleep_schedule = '10 PM - 6 AM',
      study_habits = 'Quiet Study', cleanliness = 'Very Neat',
      smoking_preference = 'Non-Smoker', food_preference = 'Vegetarian',
      interests = [], hobbies = [], room_preference = '2 Sharing (Non-AC)',
      is_visible = true, contact_email, phone
    } = req.body;

    if (!name || !department || !hostel_block) {
      return res.status(400).json({ error: 'Name, Department, and Hostel Block are required' });
    }

    const existingProfile = await db.query('SELECT id FROM roommates WHERE user_id = $1', [userId]);
    let result;
    if (existingProfile.rows.length > 0) {
      result = await db.query(
        `UPDATE roommates SET
          name = $1,
          gender = $2,
          department = $3,
          year = $4,
          hostel_block = $5,
          preferred_language = $6,
          sleep_schedule = $7,
          study_habits = $8,
          cleanliness = $9,
          smoking_preference = $10,
          food_preference = $11,
          interests = $12,
          hobbies = $13,
          room_preference = $14,
          is_visible = $15,
          contact_email = $16,
          phone = $17
         WHERE user_id = $18
         RETURNING *`,
        [
          name, user.gender || 'Male', department, year, hostel_block,
          preferred_language, sleep_schedule, study_habits, cleanliness,
          smoking_preference, food_preference,
          JSON.stringify(Array.isArray(interests) ? interests : [interests]),
          JSON.stringify(Array.isArray(hobbies) ? hobbies : [hobbies]),
          room_preference, is_visible,
          contact_email || null, phone || null,
          userId
        ]
      );
    } else {
      result = await db.query(
        `INSERT INTO roommates (
          user_id, student_id, name, gender, department, year, hostel_block,
          preferred_language, sleep_schedule, study_habits, cleanliness,
          smoking_preference, food_preference, interests, hobbies,
          room_preference, is_visible, contact_email, phone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *`,
        [
          userId,
          `SCE${Date.now().toString().slice(-6)}`,
          name, user.gender || 'Male', department, year, hostel_block,
          preferred_language, sleep_schedule, study_habits, cleanliness,
          smoking_preference, food_preference,
          JSON.stringify(Array.isArray(interests) ? interests : [interests]),
          JSON.stringify(Array.isArray(hobbies) ? hobbies : [hobbies]),
          room_preference, is_visible,
          contact_email || null, phone || null
        ]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("POST /api/roommates/profile error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bus-routes/today
 * Returns active morning and evening bus routes for today (or latest published active routes)
 */
router.get('/bus-routes/today', async (req, res) => {
  try {
    const morningResult = await db.query(
      "SELECT * FROM bus_routes WHERE session = 'morning' AND status = 'active' ORDER BY id DESC LIMIT 1"
    );
    const eveningResult = await db.query(
      "SELECT * FROM bus_routes WHERE session = 'evening' AND status = 'active' ORDER BY id DESC LIMIT 1"
    );

    res.json({
      morning: morningResult.rows[0] || null,
      evening: eveningResult.rows[0] || null,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error("GET /api/bus-routes/today error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bus-routes/archive
 * Returns archived/historical bus route records
 */
router.get('/bus-routes/archive', async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM bus_routes WHERE status = 'archived' ORDER BY route_date DESC, id DESC LIMIT 20"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("GET /api/bus-routes/archive error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── STUDENT READ-ONLY CONTROL CENTER ENDPOINTS ──
router.get('/study-materials', async (req, res) => {
  try {
    const { departmentId, semester } = req.query;
    let queryStr = 'SELECT s.*, d.name as department_name FROM study_materials s LEFT JOIN departments d ON s.department_id = d.id WHERE 1=1';
    const params = [];
    let idx = 1;
    if (departmentId && departmentId !== 'all') {
      queryStr += ` AND s.department_id = $${idx}`;
      params.push(departmentId);
      idx++;
    }
    if (semester && semester !== 'all') {
      queryStr += ` AND s.semester = $${idx}`;
      params.push(semester);
      idx++;
    }
    queryStr += ' ORDER BY s.semester ASC, s.title ASC';
    const result = await db.query(queryStr, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/placements', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM placements WHERE is_active = true ORDER BY drive_date ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/academic-calendar', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM academic_calendar ORDER BY start_date ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/hostel-info', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM hostel_info ORDER BY info_type ASC, id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/anna-university', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM anna_university_rules ORDER BY regulation_year DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM system_settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

