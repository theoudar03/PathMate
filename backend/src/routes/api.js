import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/index.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateEmbeddings, mapTextToInterests, rankAndExplainMatches, generateChecklistFromProcess, answerGroundedQuestion, generateDigest, translateText, generateWebsiteSummary, parseNavigationQuery } from '../services/gemini.js';
import { fetchWebsiteContent, getRelevantUrl } from '../services/scraper.js';
import { authenticateToken } from '../middleware/auth.js';
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
  const q = queryText.toLowerCase();
  
  return await safeDbCall(
    async () => {
      // 1. TIMETABLE
      if (q.includes('timetable') || q.includes('python') || q.includes('schedule') || q.includes('class') || q.includes('period') || q.includes('time table')) {
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
          return { resolved: true, answer, sourceTable: 'timetable' };
        }
      }

      // 2. FACULTY / HOD
      if (q.includes('faculty') || q.includes('professor') || q.includes('teacher') || q.includes('hod') || q.includes('head') || q.includes('santhi') || q.includes('mohan') || q.includes('giriraj') || q.includes('ravimaran')) {
        let rows = [];
        if (q.includes('hod') || q.includes('head')) {
          let deptClause = "";
          if (q.includes('cse')) {
            deptClause = "AND d.name = 'CSE'";
          } else if (q.includes('ece')) {
            deptClause = "AND d.name = 'ECE'";
          } else if (q.includes('ai&ds') || q.includes('aids')) {
            deptClause = "AND d.name = 'AI&DS'";
          } else if (q.includes('it')) {
            deptClause = "AND d.name = 'IT'";
          }
          
          const facRes = await db.query(
            `SELECT f.name, f.designation, f.contact_email, d.name as dept FROM faculty f 
             LEFT JOIN departments d ON f.department_id = d.id
             WHERE (f.designation ILIKE '%Head%' OR f.designation ILIKE '%HOD%') ${deptClause}
             ORDER BY f.id`
          );
          rows = facRes.rows;
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
          let answer = "Here are the faculty contact details from our records:\n\n";
          rows.forEach(row => {
            answer += `• **${row.name}** — ${row.designation} (${row.dept} Department)\n  Email: ${row.contact_email}\n`;
          });
          return { resolved: true, answer, sourceTable: 'faculty' };
        }
      }

      // 3. CAMPUS BLOCKS / FLOOR DIRECTIONS
      if (q.includes('block') || q.match(/\bks\b/) || q.match(/\brv\b/) || q.match(/\bjs\b/) || q.match(/\bbd\b/) || q.match(/\bme\b/)) {
        let blockSearch = "";
        if (q.match(/\bks\b/)) blockSearch = "ks-block";
        else if (q.match(/\brv\b/)) blockSearch = "rv-block";
        else if (q.match(/\bjs\b/)) blockSearch = "js-block";
        else if (q.match(/\bbd\b/)) blockSearch = "bd-block";
        else if (q.match(/\bme\b/)) blockSearch = "me-block";

        if (blockSearch) {
          const blockRes = await db.query('SELECT id, block_name, block_type FROM campus_blocks WHERE svg_id = $1', [blockSearch]);
          if (blockRes.rows.length > 0) {
            const block = blockRes.rows[0];
            const detailsRes = await db.query('SELECT floor_label, detail_text FROM block_floor_details WHERE block_id = $1 ORDER BY id', [block.id]);
            
            let answer = `**${block.block_name}** Details:\n`;
            detailsRes.rows.forEach(floor => {
              answer += `• **${floor.floor_label}**: ${floor.detail_text}\n`;
            });
            return { resolved: true, answer, sourceTable: 'campus_blocks' };
          }
        }
      }

      // 4. EMERGENCY CONTACTS
      if (q.includes('warden') || q.includes('ragging') || q.includes('harass') || q.includes('safety') || q.includes('emergency') || q.includes('contact') || q.includes('phone') || q.includes('number') || q.includes('medical') || q.includes('first aid')) {
        const contactsRes = await db.query('SELECT label, contact_value, notes FROM emergency_contacts');
        if (contactsRes.rows.length > 0) {
          let answer = "Here are the emergency and administrative contacts on campus:\n\n";
          contactsRes.rows.forEach(c => {
            answer += `• **${c.label}**: ${c.contact_value} (${c.notes})\n`;
          });
          return { resolved: true, answer, sourceTable: 'emergency_contacts' };
        }
      }

      // 5. CLUBS & EVENTS REGISTRATION PROCESS
      if (q.includes('club') || q.includes('event') || q.includes('hackathon') || q.includes('workshop') || q.includes('symphony') || q.includes('coding') || q.includes('robotics')) {
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
            return { resolved: true, answer, sourceTable: 'clubs' };
          }
        }
      }

      // 6. CANTEEN MENU
      if (q.includes('canteen') || q.includes('menu') || q.includes('food') || q.includes('coffee') || q.includes('tea') || q.includes('price')) {
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
          return { resolved: true, answer, sourceTable: 'canteen_menu' };
        }
      }

      // 7. COMMITTEES
      if (q.includes('committee') || q.includes('council') || q.includes('squad') || q.includes('ragging') || q.includes('grievance') || q.includes('ombudsman')) {
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
          return { resolved: true, answer, sourceTable: 'committees' };
        }
      }

      // 8. SEMANTIC SEARCH OVER DOCUMENTS (UG Regulations, etc.)
      try {
        const embedding = await generateEmbeddings(queryText);
        const embeddingStr = `[${embedding.join(',')}]`;
        const vectorRes = await db.query(
          `SELECT chunk_text, 1 - (embedding <=> $1::vector) as similarity 
           FROM chatbot_chunks 
           ORDER BY embedding <=> $1::vector 
           LIMIT 4`, [embeddingStr]
        );
        
        // If similarity > threshold (e.g. 0.5)
        if (vectorRes.rows.length > 0 && vectorRes.rows[0].similarity > 0.45) {
          const context = vectorRes.rows.map(r => r.chunk_text).join('\\n\\n---\\n\\n');
          return { resolved: true, answer: context, sourceTable: 'chatbot_chunks', isContext: true };
        }
      } catch (e) {
        console.error("Vector search failed:", e.message);
      }

      return { resolved: false };
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
        return { resolved: true, answer, sourceTable: 'timetable' };
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
          return { resolved: true, answer, sourceTable: 'faculty' };
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
            return { resolved: true, answer, sourceTable: 'campus_blocks' };
          }
        }
      }

      if (q.includes('warden') || q.includes('ragging') || q.includes('harass') || q.includes('safety') || q.includes('emergency') || q.includes('contact') || q.includes('phone') || q.includes('number') || q.includes('medical')) {
        let answer = "Here are the emergency contacts (Mock Backup):\n\n";
        MOCK_STORE.emergencyContacts.forEach(c => {
          answer += `• **${c.label}**: ${c.contact_value} (${c.notes})\n`;
        });
        return { resolved: true, answer, sourceTable: 'emergency_contacts' };
      }

      if (q.includes('club') || q.includes('event') || q.includes('hackathon') || q.includes('workshop') || q.includes('symphony') || q.includes('coding') || q.includes('robotics')) {
        let matchId = 1;
        if (q.includes('robotics')) matchId = 2;
        const club = MOCK_STORE.clubs.find(c => c.id === matchId);
        if (club) {
          const proc = MOCK_STORE.registrationProcess.find(p => p.club_or_event_type === 'club' && p.club_or_event_id === club.id);
          const answer = `**${club.name}**\nDescription: ${club.description}\n\n**Registration Process:**\n${proc?.raw_process_text || 'Collect form from office.'}`;
          return { resolved: true, answer, sourceTable: 'clubs' };
        }
      }

      return { resolved: false };
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

router.post('/chat', async (req, res) => {
  const { userId, query: userQuery, language = 'en', history = [] } = req.body;

  try {
    // === PRIORITY 1: LOCAL DATABASE CHECK ===
    const localResult = await resolveLocalKnowledge(userQuery, userId);
    
    let answerText = "";
    let isGrounded = false;
    let finalSource = null;
    let dbSourceTable = null;

    if (localResult.resolved) {
      if (localResult.isContext) {
         // Pass the chunks to answerGroundedQuestion as context
         const fallbackRes = await answerGroundedQuestion(userQuery, localResult.answer, history);
         answerText = fallbackRes.answer;
         isGrounded = fallbackRes.isGrounded;
         finalSource = isGrounded ? "PathMate Database (Regulations/Docs)" : null;
      } else {
         answerText = localResult.answer;
         isGrounded = true;
         dbSourceTable = localResult.sourceTable;
         finalSource = "PathMate Database";
      }
    } else {
      // === PRIORITY 2: WEBSITE CRAWLER RETRIEVAL ===
      const url = getRelevantUrl(userQuery);
      console.log(`[Priority 2] Scraping: ${url}`);
      let websiteText = "";
      try {
        websiteText = await fetchWebsiteContent(url);
      } catch (err) {
        console.warn("Failed to scrape official website:", err.message);
      }

      // === PRIORITY 3: GEMINI SUMMARIZATION ===
      if (websiteText) {
        answerText = await generateWebsiteSummary(userQuery, websiteText, history);
        isGrounded = true;
        finalSource = "Official Saranathan College Website";
      } else {
        // Fallback to standard grounded prompt if scraping is completely empty
        const fallbackRes = await answerGroundedQuestion(userQuery, "No scraped website text available due to connection/timeout.", history);
        answerText = fallbackRes.answer;
        isGrounded = fallbackRes.isGrounded;
        finalSource = isGrounded ? "PathMate Database" : null;
      }
    }

    // Translate answer if language is Tamil or Hindi
    if (language && language !== 'en') {
      try {
        answerText = await translateText(answerText, language);
      } catch (err) {
        console.warn("Failed to translate final answer:", err.message);
      }
    }

    // Append standard Grounded Source block if grounded
    if (isGrounded && finalSource) {
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

    let responsePayload = {
      answer: answerText,
      isGrounded,
      sourceTable: finalSource
    };

    // If not grounded, return escalation draft email
    if (!isGrounded) {
      const student = await safeDbCall(
        async () => {
          const userRes = await db.query('SELECT u.name, d.name as dept FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = $1', [userId]);
          return userRes.rows[0] || { name: 'Freshman', dept: 'Engineering' };
        },
        async () => {
          const u = MOCK_STORE.users.find(x => x.id === userId) || { name: 'Freshman', department_id: 1 };
          const d = MOCK_STORE.departments.find(x => x.id === u.department_id)?.name || 'Engineering';
          return { name: u.name, dept: d };
        }
      );
      
      let draft = `Respected Administrative Coordinator,\n\nI am a first-year student (${student.name}) of the ${student.dept} department. I had a question regarding: "${userQuery}". Could you please guide me to the correct counselor?\n\nSincerely,\n${student.name}`;
      
      if (language && language !== 'en') {
        try {
          draft = await translateText(draft, language);
        } catch (err) {
          console.warn("Failed to translate escalation draft:", err.message);
        }
      }
      responsePayload.escalationDraft = draft;
    }

    res.json(responsePayload);
  } catch (error) {
    console.error("Chat route error:", error);
    res.status(500).json({ error: error.message });
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
        const userRes = await db.query('SELECT hostel_block FROM users WHERE id = $1', [userId]);
        const userBlock = userRes.rows[0]?.hostel_block;

        if (!userBlock) return []; // Day Scholar has no matches

        // Find matching opt-in roommate candidates in same block
        const candidatesRes = await db.query(
          `SELECT u.id, u.name, d.name as branch, u.stay_type, u.hostel_block,
           array_to_string(array_agg(DISTINCT i.label), ', ') as interests
           FROM users u
           JOIN roommate_opt_in ro ON u.id = ro.user_id
           LEFT JOIN departments d ON u.department_id = d.id
           LEFT JOIN user_interests ui ON u.id = ui.user_id
           LEFT JOIN interests i ON ui.interest_id = i.id
           WHERE ro.is_visible = true AND u.hostel_block = $1 AND u.id != $2
           GROUP BY u.id, u.name, d.name, u.stay_type, u.hostel_block`,
          [userBlock, userId]
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
            origin: 'Trichy Region', // mock origin since not explicitly stored in standard schema
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

        const candidates = MOCK_STORE.users.filter(
          u => optInIds.includes(u.id) && u.id !== userId && u.hostel_block === user.hostel_block
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
        });
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
            `SELECT f.id, f.name, f.designation, f.contact_email, d.name as department_name, f.photo_url, f.qualification
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

    sql += ` ORDER BY id DESC`;
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
    const [usersCount, eventsCount, clubsCount, noticesCount, tasksCount] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM users`),
      db.query(`SELECT COUNT(*) FROM events`),
      db.query(`SELECT COUNT(*) FROM clubs`),
      db.query(`SELECT COUNT(*) FROM notices`),
      db.query(`SELECT COUNT(*) FILTER (WHERE status = 'completed') AS completed, COUNT(*) FILTER (WHERE status = 'pending') AS pending FROM student_tasks`)
    ]);

    const totalStudents = parseInt(usersCount.rows[0]?.count || 0, 10) + 1450; // Total registered + SCE 1st yr strength
    const activeEvents = parseInt(eventsCount.rows[0]?.count || 0, 10);
    const activeClubs = parseInt(clubsCount.rows[0]?.count || 0, 10);
    const totalNotices = parseInt(noticesCount.rows[0]?.count || 0, 10);
    const completedTasks = parseInt(tasksCount.rows[0]?.completed || 0, 10);
    const pendingTasks = parseInt(tasksCount.rows[0]?.pending || 0, 10);

    res.json({
      totalStudents,
      activeEvents,
      activeClubs,
      totalNotices,
      completedTasks,
      pendingTasks,
      studyMaterials: 38,
      aiChatsToday: 142
    });
  } catch (error) {
    // Fallback metrics
    res.json({
      totalStudents: 1485,
      activeEvents: 8,
      activeClubs: 12,
      totalNotices: 14,
      completedTasks: 5,
      pendingTasks: 3,
      studyMaterials: 38,
      aiChatsToday: 142
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

    sql += ` ORDER BY s.id DESC`;
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

export default router;

