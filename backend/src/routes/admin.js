import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import db from '../database/index.js';
import { extractEventPosterDetails } from '../services/gemini.js';
import { JWT_SECRET, loginRateLimiter } from '../middleware/auth.js';

const router = express.Router();

const detectFileType = (mimeType, filename) => {
  const ext = filename ? filename.split('.').pop().toLowerCase() : '';
  const mime = mimeType ? mimeType.toLowerCase() : '';
  
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
    return 'image';
  }
  if (mime === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'].includes(ext) || mime.includes('word') || mime.includes('presentation')) {
    return 'document';
  }
  return 'generic';
};

const processAttachment = (noticeId, fileData) => {
  if (fileData.storage_url && !fileData.data_base64) {
    const originalName = fileData.original_name || fileData.name || 'Attachment';
    const mimeType = fileData.mime_type || 'application/octet-stream';
    return {
      file_name: originalName,
      original_name: originalName,
      file_type: detectFileType(mimeType, originalName),
      mime_type: mimeType,
      file_size: fileData.file_size || 0,
      storage_url: fileData.storage_url
    };
  }

  const uploadsDir = path.join(process.cwd(), 'backend', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const originalName = fileData.original_name || fileData.name || `file_${Date.now()}`;
  const ext = originalName.includes('.') ? originalName.split('.').pop() : 'bin';
  const fileName = `notice_${noticeId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
  const filePath = path.join(uploadsDir, fileName);

  let buffer = Buffer.from('');
  if (fileData.data_base64) {
    const base64Data = fileData.data_base64.replace(/^data:[^;]+;base64,/, '');
    buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
  }

  const fileSize = buffer.length || fileData.file_size || 0;
  const mimeType = fileData.mime_type || (ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'application/octet-stream');
  const fileType = detectFileType(mimeType, originalName);
  const storageUrl = `/uploads/${fileName}`;

  return {
    file_name: fileName,
    original_name: originalName,
    file_type: fileType,
    mime_type: mimeType,
    file_size: fileSize,
    storage_url: storageUrl
  };
};

// Helper: Log admin activity
const logActivity = async (adminId, actionType, description) => {
  try {
    await db.query(
      'INSERT INTO activity_logs (action_type, description, admin_id) VALUES ($1, $2, $3)',
      [actionType, description, adminId || null]
    );
  } catch (err) {
    console.warn('Failed to log admin activity:', err.message);
  }
};

// ----------------------------------------------------
// PUBLIC / AUTHENTICATION ENDPOINTS
// ----------------------------------------------------

// POST /api/admin/auth/login
router.post('/auth/login', loginRateLimiter, async (req, res) => {
  const { username, password } = req.body;
  try {
    const userRes = await db.query('SELECT * FROM admin_users WHERE username = $1 AND is_active = true', [username]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Update last login
    await db.query('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    await logActivity(user.id, 'admin_login', `Admin ${user.username} logged into control center`);

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role || 'SUPER_ADMIN',
      fullName: user.full_name
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: payload });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware to verify Admin JWT & Role
export const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'HOD', 'FACULTY_ADMIN'];
    if (!decoded.role || !adminRoles.includes(decoded.role.toUpperCase())) {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }

    req.admin = decoded;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired admin token' });
  }
};

// Apply verifyAdmin to all subsequent routes in this file
router.use(verifyAdmin);

// ----------------------------------------------------
// 1. DASHBOARD & STATS
// ----------------------------------------------------

router.get('/stats/dashboard', async (req, res) => {
  try {
    const [
      studentsRes,
      deptsRes,
      eventsRes,
      clubsRes,
      committeesRes,
      volunteersRes,
      seniorsRes,
      noticesRes,
      docsRes,
      faqsRes,
      chatsTodayRes,
      pendingVolRes,
      activityRes
    ] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users'),
      db.query('SELECT COUNT(*) FROM departments'),
      db.query('SELECT COUNT(*) FROM events'),
      db.query('SELECT COUNT(*) FROM clubs'),
      db.query('SELECT COUNT(*) FROM committees'),
      db.query('SELECT COUNT(*) FROM volunteers'),
      db.query('SELECT COUNT(*) FROM seniors'),
      db.query('SELECT COUNT(*) FROM notices'),
      db.query('SELECT COUNT(*) FROM chatbot_documents'),
      db.query('SELECT COUNT(*) FROM faqs'),
      db.query('SELECT COUNT(*) FROM chat_messages WHERE created_at >= CURRENT_DATE'),
      db.query("SELECT COUNT(*) FROM volunteers WHERE status = 'pending'"),
      db.query(`
        SELECT a.id, a.action_type, a.description, a.created_at, COALESCE(u.username, 'System Admin') as admin_name
        FROM activity_logs a
        LEFT JOIN admin_users u ON a.admin_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 10
      `)
    ]);

    const totalStudents = parseInt(studentsRes.rows[0]?.count || 0);
    const totalDocs = parseInt(docsRes.rows[0]?.count || 0);
    const totalFaqs = parseInt(faqsRes.rows[0]?.count || 0);

    res.json({
      totalStudents,
      departments: parseInt(deptsRes.rows[0]?.count || 0),
      upcomingEvents: parseInt(eventsRes.rows[0]?.count || 0),
      registeredClubs: parseInt(clubsRes.rows[0]?.count || 0),
      committees: parseInt(committeesRes.rows[0]?.count || 0),
      volunteers: parseInt(volunteersRes.rows[0]?.count || 0),
      seniorMentors: parseInt(seniorsRes.rows[0]?.count || 0),
      unreadNotices: parseInt(noticesRes.rows[0]?.count || 0),
      noticesPublished: parseInt(noticesRes.rows[0]?.count || 0),
      studyMaterials: totalDocs,
      aiDocs: totalDocs,
      aiKnowledgeEntries: totalDocs + totalFaqs,
      aiChatsToday: parseInt(chatsTodayRes.rows[0]?.count || 0),
      pendingRegistrations: parseInt(pendingVolRes.rows[0]?.count || 0),
      recentActivity: activityRes.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET Activity Stream
router.get('/activity', async (req, res) => {
  try {
    const activityRes = await db.query(`
      SELECT a.id, a.action_type, a.description, a.created_at, COALESCE(u.username, 'System Admin') as admin_name
      FROM activity_logs a
      LEFT JOIN admin_users u ON a.admin_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 50
    `);
    res.json(activityRes.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 2. STUDENT MANAGEMENT
// ----------------------------------------------------

// GET Students with search and filter
router.get('/students', async (req, res) => {
  try {
    const { search, department, status } = req.query;
    let sql = `
      SELECT 
        u.id, u.username, u.name, u.full_name, u.register_number, u.roll_number,
        u.email, u.department_id, d.name as department_name, 
        u.stay_type, u.hostel_block, u.language_pref, u.preferred_language,
        COALESCE(u.role, 'student') as role, COALESCE(u.status, 'active') as status,
        u.created_at, u.last_login
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(u.name) LIKE $${params.length} OR LOWER(u.full_name) LIKE $${params.length} OR LOWER(u.username) LIKE $${params.length} OR LOWER(u.register_number) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`;
    }

    if (department) {
      params.push(department);
      sql += ` AND (d.name = $${params.length} OR d.full_name = $${params.length})`;
    }

    if (status) {
      params.push(status);
      sql += ` AND LOWER(u.status) = LOWER($${params.length})`;
    }

    sql += ` ORDER BY u.created_at DESC`;
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Create new student
router.post('/students', async (req, res) => {
  try {
    const { full_name, register_number, username, email, department, password, stay_type = 'day_scholar', hostel_block } = req.body;
    if (!full_name || !register_number || !username || !password || !department) {
      return res.status(400).json({ error: 'Full name, register number, username, password, and department are required' });
    }

    const deptRes = await db.query('SELECT id FROM departments WHERE name ILIKE $1 OR full_name ILIKE $1', [`%${department}%`]);
    const deptId = deptRes.rows[0]?.id || 1;

    const hash = await bcrypt.hash(password, 12);

    const userRes = await db.query(
      `INSERT INTO users (full_name, name, register_number, roll_number, username, email, department_id, password_hash, stay_type, hostel_block, hosteller, role, status)
       VALUES ($1, $1, $2, $2, $3, $4, $5, $6, $7, $8, $9, 'student', 'active')
       RETURNING id, full_name, username, register_number, email, status, role, created_at`,
      [full_name, register_number, username, email, deptId, hash, stay_type, hostel_block || null, stay_type === 'hostel']
    );

    // Upsert into official_students
    await db.query(
      `INSERT INTO official_students (register_number, full_name, email, department, is_registered)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (register_number) DO UPDATE SET is_registered = true`,
      [register_number, full_name, email || `${username}@saranathan.ac.in`, department]
    );

    await logActivity(req.admin?.id, 'student_created', `Created student: ${full_name} (${register_number})`);
    res.status(201).json(userRes.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT Update student details & status
router.put('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, status, role, stay_type, hostel_block, department } = req.body;

    let deptId = null;
    if (department) {
      const deptRes = await db.query('SELECT id FROM departments WHERE name ILIKE $1 OR full_name ILIKE $1', [`%${department}%`]);
      deptId = deptRes.rows[0]?.id;
    }

    const updateRes = await db.query(
      `UPDATE users SET 
        full_name = COALESCE($1, full_name),
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        status = COALESCE($3, status),
        role = COALESCE($4, role),
        stay_type = COALESCE($5, stay_type),
        hostel_block = COALESCE($6, hostel_block),
        department_id = COALESCE($7, department_id),
        updated_at = NOW()
       WHERE id = $8
       RETURNING id, full_name, username, register_number, email, status, role`,
      [full_name, email, status, role, stay_type, hostel_block, deptId, id]
    );

    if (updateRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });

    await logActivity(req.admin?.id, 'student_updated', `Updated student ID ${id}: status=${status || 'unchanged'}`);
    res.json(updateRes.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Reset Student Password
router.post('/students/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, id]);
    await logActivity(req.admin?.id, 'password_reset', `Reset password for student ID: ${id}`);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE Student
router.delete('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    await logActivity(req.admin?.id, 'student_deleted', `Deleted student ID: ${id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 3. AI KNOWLEDGE BASE & FAQs
// ----------------------------------------------------

// GET FAQs
router.get('/knowledge/faqs', async (req, res) => {
  try {
    const faqs = await db.query('SELECT * FROM faqs ORDER BY id DESC');
    res.json(faqs.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Create FAQ
router.post('/knowledge/faqs', async (req, res) => {
  try {
    const { question, answer, category = 'General' } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'Question and Answer are required' });

    const result = await db.query(
      'INSERT INTO faqs (question, answer, category) VALUES ($1, $2, $3) RETURNING *',
      [question, answer, category]
    );

    await logActivity(req.admin?.id, 'faq_created', `Added FAQ: ${question.slice(0, 40)}...`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT Update FAQ
router.put('/knowledge/faqs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, is_approved } = req.body;

    const result = await db.query(
      `UPDATE faqs SET 
        question = COALESCE($1, question),
        answer = COALESCE($2, answer),
        category = COALESCE($3, category),
        is_approved = COALESCE($4, is_approved),
        updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [question, answer, category, is_approved, id]
    );

    await logActivity(req.admin?.id, 'faq_updated', `Updated FAQ ID: ${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE FAQ
router.delete('/knowledge/faqs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM faqs WHERE id = $1', [id]);
    await logActivity(req.admin?.id, 'faq_deleted', `Deleted FAQ ID: ${id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET Unknown Questions
router.get('/knowledge/unknown-questions', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.question, u.status, u.answer, u.created_at, us.full_name as student_name
      FROM unknown_questions u
      LEFT JOIN users us ON u.user_id = us.id
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Approve & Convert Unknown Question to FAQ
router.post('/knowledge/unknown-questions/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { answer, category = 'General' } = req.body;

    const uqRes = await db.query('SELECT question FROM unknown_questions WHERE id = $1', [id]);
    if (uqRes.rows.length === 0) return res.status(404).json({ error: 'Unknown question not found' });

    const questionText = uqRes.rows[0].question;

    // Insert into FAQs
    const faqRes = await db.query(
      'INSERT INTO faqs (question, answer, category, is_approved) VALUES ($1, $2, $3, true) RETURNING *',
      [questionText, answer, category]
    );

    // Update unknown_questions status
    await db.query("UPDATE unknown_questions SET status = 'answered', answer = $1 WHERE id = $2", [answer, id]);

    await logActivity(req.admin?.id, 'knowledge_approved', `Approved & converted unknown question to FAQ: ${questionText.slice(0, 40)}...`);
    res.json({ success: true, faq: faqRes.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET Chatbot Documents
router.get('/documents', async (req, res) => {
  try {
    const docs = await db.query('SELECT id, title, type, url, uploaded_at FROM chatbot_documents ORDER BY uploaded_at DESC');
    res.json(docs.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE Document
router.delete('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM chatbot_documents WHERE id = $1', [id]);
    await logActivity(req.admin?.id, 'document_deleted', `Deleted AI Document ID: ${id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 4. EVENTS MODULE
// ----------------------------------------------------

router.get('/events', async (req, res) => {
  try {
    const events = await db.query(`
      SELECT e.id, e.name as title, e.description, e.event_date as date, 
             e.location_text as location, e.status, 
             COALESCE(e.pin_color, '#F59E0B') as pin_color,
             (SELECT COUNT(*) FROM volunteers v WHERE v.event_id = e.id) as attendees, 
             rp.raw_process_text as registration_steps
      FROM events e
      LEFT JOIN registration_process rp ON e.id = rp.club_or_event_id AND rp.club_or_event_type = 'event'
      ORDER BY e.event_date ASC
    `);
    res.json(events.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/events', async (req, res) => {
  try {
    const { title, description, date, location, status, registration_steps } = req.body;
    if (!title || !date || !location) return res.status(400).json({ error: 'Title, date, and location are required' });

    const result = await db.query(
      'INSERT INTO events (name, description, event_date, location_text, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description || title, date, location, status || 'upcoming']
    );

    const eventId = result.rows[0].id;
    if (registration_steps) {
      await db.query(
        'INSERT INTO registration_process (club_or_event_type, club_or_event_id, raw_process_text) VALUES ($1, $2, $3)',
        ['event', eventId, registration_steps]
      );
    }

    await logActivity(req.admin?.id, 'event_created', `Created event: ${title}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, location, status, registration_steps } = req.body;

    const result = await db.query(
      `UPDATE events SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        event_date = COALESCE($3, event_date),
        location_text = COALESCE($4, location_text),
        status = COALESCE($5, status),
        updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [title, description, date, location, status, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    if (registration_steps) {
      await db.query(
        `INSERT INTO registration_process (club_or_event_type, club_or_event_id, raw_process_text)
         VALUES ('event', $1, $2)
         ON CONFLICT (id) DO UPDATE SET raw_process_text = $2`,
        [id, registration_steps]
      );
    }

    await logActivity(req.admin?.id, 'event_updated', `Updated event ID: ${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM events WHERE id = $1', [id]);
    await logActivity(req.admin?.id, 'event_deleted', `Deleted event ID: ${id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Poster AI Scanner
router.post('/events/vision', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });

  try {
    const extractedData = await extractEventPosterDetails(imageUrl);
    res.json(extractedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 5. CLUBS MODULE
// ----------------------------------------------------

router.get('/clubs', async (req, res) => {
  try {
    const clubs = await db.query(`
      SELECT c.id, c.name, c.description, c.location_text as location, c.eligibility, c.status, 
             COALESCE(c.requirements, 'Open to all students') as requirements,
             (SELECT COUNT(*) FROM user_registrations r WHERE r.club_or_event_id = c.id AND r.club_or_event_type = 'club') as members, 
             rp.raw_process_text as registration_steps
      FROM clubs c
      LEFT JOIN registration_process rp ON c.id = rp.club_or_event_id AND rp.club_or_event_type = 'club'
      ORDER BY c.created_at DESC
    `);
    res.json(clubs.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/clubs', async (req, res) => {
  try {
    const { name, description, location, eligibility, status, registration_steps } = req.body;
    if (!name || !description) return res.status(400).json({ error: 'Club name and description are required' });

    const result = await db.query(
      'INSERT INTO clubs (name, description, location_text, eligibility, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, location, eligibility, status || 'active']
    );

    const clubId = result.rows[0].id;
    if (registration_steps) {
      await db.query(
        'INSERT INTO registration_process (club_or_event_type, club_or_event_id, raw_process_text) VALUES ($1, $2, $3)',
        ['club', clubId, registration_steps]
      );
    }

    await logActivity(req.admin?.id, 'club_created', `Created club: ${name}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/clubs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, location, eligibility, status, registration_steps } = req.body;

    const result = await db.query(
      `UPDATE clubs SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        location_text = COALESCE($3, location_text),
        eligibility = COALESCE($4, eligibility),
        status = COALESCE($5, status),
        updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, description, location, eligibility, status, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Club not found' });

    if (registration_steps) {
      await db.query(
        `INSERT INTO registration_process (club_or_event_type, club_or_event_id, raw_process_text)
         VALUES ('club', $1, $2)
         ON CONFLICT (id) DO UPDATE SET raw_process_text = $2`,
        [id, registration_steps]
      );
    }

    await logActivity(req.admin?.id, 'club_updated', `Updated club ID: ${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/clubs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM clubs WHERE id = $1', [id]);
    await logActivity(req.admin?.id, 'club_deleted', `Deleted club ID: ${id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 6. NOTICE BOARD MODULE
// ----------------------------------------------------

router.get('/notices', async (req, res) => {
  try {
    const notices = await db.query(`
      SELECT 
        n.id, n.title, n.content, n.target_audience as target, n.priority, n.category, n.status,
        n.author, n.attachment_url, n.published_at as "publishedAt", n.created_at, n.expiry_date,
        (n.priority = 'urgent') as urgent, 0 as views,
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
      ORDER BY n.created_at DESC
    `);
    res.json(notices.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/notices', async (req, res) => {
  try {
    const { title, content, target, urgent, priority, category, author, expiry_date, attachments = [] } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

    const finalPriority = urgent ? 'urgent' : priority || 'normal';
    const finalTarget = target || 'All Students';
    const finalCategory = category || 'General';
    const finalAuthor = author || req.admin?.username || 'Admin';

    const insertRes = await db.query(
      `INSERT INTO notices (title, content, target_audience, priority, category, author, expiry_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'published')
       RETURNING id, title, content, target_audience as target, priority, category, author, created_at as "publishedAt", (priority = 'urgent') as urgent`,
      [title, content, finalTarget, finalPriority, finalCategory, finalAuthor, expiry_date || null]
    );

    const notice = insertRes.rows[0];
    const savedAttachments = [];

    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const fileItem of attachments) {
        const processed = processAttachment(notice.id, fileItem);
        const attRes = await db.query(
          `INSERT INTO notice_attachments (notice_id, file_name, original_name, file_type, mime_type, file_size, storage_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [notice.id, processed.file_name, processed.original_name, processed.file_type, processed.mime_type, processed.file_size, processed.storage_url]
        );
        savedAttachments.push(attRes.rows[0]);
      }
    }

    if (savedAttachments.length > 0) {
      await db.query(`UPDATE notices SET attachment_url = $1 WHERE id = $2`, [savedAttachments[0].storage_url, notice.id]);
    }

    await logActivity(req.admin?.id, 'notice_published', `Published notice: ${title}`);
    res.status(201).json({ ...notice, attachments: savedAttachments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/notices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, target, urgent, priority, category, author, expiry_date } = req.body;

    const finalPriority = urgent ? 'urgent' : priority || 'normal';

    const result = await db.query(
      `UPDATE notices SET 
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        target_audience = COALESCE($3, target_audience),
        priority = COALESCE($4, priority),
        category = COALESCE($5, category),
        author = COALESCE($6, author),
        expiry_date = COALESCE($7, expiry_date),
        updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [title, content, target, finalPriority, category, author, expiry_date, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Notice not found' });

    await logActivity(req.admin?.id, 'notice_updated', `Updated notice ID: ${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/notices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM notices WHERE id = $1', [id]);
    await logActivity(req.admin?.id, 'notice_deleted', `Deleted notice ID: ${id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 7. COMMITTEES MODULE
// ----------------------------------------------------

router.get('/committees', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM committees ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/committees', async (req, res) => {
  try {
    const { name, description, faculty_name, student_coordinators, location_text, status = 'active' } = req.body;
    if (!name) return res.status(400).json({ error: 'Committee name is required' });

    const result = await db.query(
      `INSERT INTO committees (name, description, faculty_name, student_coordinators, location_text, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description || '', faculty_name || null, student_coordinators || null, location_text || null, status]
    );

    await logActivity(req.admin?.id, 'committee_created', `Created committee: ${name}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/committees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const committeeId = parseInt(id, 10);
    if (isNaN(committeeId)) return res.status(400).json({ error: 'Invalid committee ID' });

    const { name, description, faculty_name, student_coordinators, location_text, status } = req.body;

    await db.query('ALTER TABLE committees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP');

    const result = await db.query(
      `UPDATE committees SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        faculty_name = COALESCE($3, faculty_name),
        student_coordinators = COALESCE($4, student_coordinators),
        location_text = COALESCE($5, location_text),
        status = COALESCE($6, status),
        updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [name, description, faculty_name, student_coordinators, location_text, status, committeeId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Committee not found' });

    await logActivity(req.admin?.id, 'committee_updated', `Updated committee ID: ${committeeId}`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/committees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const committeeId = parseInt(id, 10);
    if (isNaN(committeeId)) return res.status(400).json({ error: 'Invalid committee ID' });

    await db.query('DELETE FROM committees WHERE id = $1', [committeeId]);
    await logActivity(req.admin?.id, 'committee_deleted', `Deleted committee ID: ${committeeId}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 8. VOLUNTEERS MODULE
// ----------------------------------------------------

router.get('/volunteers', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        v.id, v.user_id, v.event_id, v.role, v.status, v.name as volunteer_name,
        e.name as event_name, u.full_name as student_full_name, u.username as student_username
      FROM volunteers v
      LEFT JOIN events e ON v.event_id = e.id
      LEFT JOIN users u ON v.user_id = u.id
      ORDER BY v.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/volunteers', async (req, res) => {
  try {
    const { user_id, event_id, role, name, status = 'pending' } = req.body;
    if (!role) return res.status(400).json({ error: 'Volunteer role is required' });

    const result = await db.query(
      'INSERT INTO volunteers (user_id, event_id, role, name, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id || null, event_id || null, role, name || 'Student Volunteer', status]
    );

    await logActivity(req.admin?.id, 'volunteer_created', `Added volunteer role: ${role}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/volunteers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status, name, event_id } = req.body;

    const result = await db.query(
      `UPDATE volunteers SET 
        role = COALESCE($1, role),
        status = COALESCE($2, status),
        name = COALESCE($3, name),
        event_id = COALESCE($4, event_id),
        updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [role, status, name, event_id, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Volunteer record not found' });

    await logActivity(req.admin?.id, 'volunteer_updated', `Updated volunteer ID ${id} status to ${status || 'updated'}`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/volunteers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM volunteers WHERE id = $1', [id]);
    await logActivity(req.admin?.id, 'volunteer_deleted', `Deleted volunteer ID: ${id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 9. SENIOR CONNECT MODULE
// ----------------------------------------------------

router.get('/seniors', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM seniors ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/seniors', async (req, res) => {
  try {
    const { name, department, year = 'Final Year', languages, skills, domains, linkedin_url, email, phone, availability, mentor_status = 'active' } = req.body;
    if (!name || !department) return res.status(400).json({ error: 'Senior name and department are required' });

    const result = await db.query(
      `INSERT INTO seniors (
        student_id, name, department, year, languages, skills, domains, linkedin_url, email, phone, availability, mentor_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        `SCE${Date.now().toString().slice(-6)}`,
        name, department, year,
        JSON.stringify(Array.isArray(languages) ? languages : [languages || 'English']),
        JSON.stringify(Array.isArray(skills) ? skills : [skills || 'General']),
        JSON.stringify(Array.isArray(domains) ? domains : [domains || 'Mentorship']),
        linkedin_url || null, email || null, phone || null,
        availability || 'Weekdays & Evenings', mentor_status
      ]
    );

    await logActivity(req.admin?.id, 'senior_created', `Added senior mentor: ${name}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/seniors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const seniorId = parseInt(id, 10);
    if (isNaN(seniorId)) return res.status(400).json({ error: 'Invalid senior ID' });

    const { name, department, year, languages, skills, domains, linkedin_url, email, phone, availability, mentor_status } = req.body;

    // Ensure updated_at column exists
    await db.query('ALTER TABLE seniors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP');

    const result = await db.query(
      `UPDATE seniors SET 
        name = COALESCE($1, name),
        department = COALESCE($2, department),
        year = COALESCE($3, year),
        languages = COALESCE($4, languages),
        skills = COALESCE($5, skills),
        domains = COALESCE($6, domains),
        linkedin_url = COALESCE($7, linkedin_url),
        email = COALESCE($8, email),
        phone = COALESCE($9, phone),
        availability = COALESCE($10, availability),
        mentor_status = COALESCE($11, mentor_status),
        updated_at = NOW()
       WHERE id = $12 RETURNING *`,
      [
        name, department, year,
        languages ? JSON.stringify(languages) : null,
        skills ? JSON.stringify(skills) : null,
        domains ? JSON.stringify(domains) : null,
        linkedin_url, email, phone, availability, mentor_status, seniorId
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Senior record not found' });

    await logActivity(req.admin?.id, 'senior_updated', `Updated senior mentor ID: ${seniorId}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating senior:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/seniors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM seniors WHERE id = $1', [id]);
    await logActivity(req.admin?.id, 'senior_deleted', `Deleted senior mentor ID: ${id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
