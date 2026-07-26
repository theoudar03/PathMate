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
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Authentication required. Missing admin authorization token.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'HOD', 'FACULTY_ADMIN'];
    const userRole = (decoded.role || '').toUpperCase();

    if (!adminRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }

    req.admin = decoded;
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Admin session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid admin token. Please log in again.' });
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
        u.created_at, u.last_login, u.gender, u.travel_mode
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
    const { full_name, register_number: rawRegNum, username, email, department, password, stay_type = 'day_scholar', hostel_block, gender = 'Male', travel_mode = 'own_transport' } = req.body;
    if (!full_name || !username || !password || !department) {
      return res.status(400).json({ error: 'Full name, username, password, and department are required' });
    }
    const register_number = (rawRegNum || '').trim() || `TEMP_${username.toLowerCase().trim()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const deptRes = await db.query('SELECT id FROM departments WHERE name ILIKE $1 OR full_name ILIKE $1', [`%${department}%`]);
    const deptId = deptRes.rows[0]?.id || 1;

    const hash = await bcrypt.hash(password, 12);

    const userRes = await db.query(
      `INSERT INTO users (full_name, name, register_number, roll_number, username, email, department_id, password_hash, stay_type, hostel_block, hosteller, role, status, gender, travel_mode)
       VALUES ($1, $1, $2, $2, $3, $4, $5, $6, $7, $8, $9, 'student', 'active', $10, $11)
       RETURNING id, full_name, username, register_number, email, status, role, created_at, gender, travel_mode`,
      [full_name, register_number, username, email, deptId, hash, stay_type, hostel_block || null, stay_type === 'hostel', gender, travel_mode]
    );

    // Upsert into official_students
    try {
      await db.query(
        `INSERT INTO official_students (register_number, full_name, email, department, is_registered, gender, travel_mode)
         VALUES ($1, $2, $3, $4, true, $5, $6)
         ON CONFLICT (register_number) DO UPDATE SET is_registered = true, gender = EXCLUDED.gender, travel_mode = EXCLUDED.travel_mode`,
        [register_number, full_name, email || `${username}@saranathan.ac.in`, department, gender, travel_mode]
      );
    } catch (insertErr) {
      if (insertErr.code === '23505' || insertErr.message.includes('unique constraint')) {
        const uniqueEmail = `dup_${Date.now()}_${email || `${username}@saranathan.ac.in`}`;
        await db.query(
          `INSERT INTO official_students (register_number, full_name, email, department, is_registered, gender, travel_mode)
           VALUES ($1, $2, $3, $4, true, $5, $6)
           ON CONFLICT (register_number) DO UPDATE SET is_registered = true, gender = EXCLUDED.gender, travel_mode = EXCLUDED.travel_mode`,
          [register_number, full_name, uniqueEmail, department, gender, travel_mode]
        );
      } else {
        throw insertErr;
      }
    }

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
    const { full_name, email, status, role, stay_type, hostel_block, department, register_number, username, gender, travel_mode } = req.body;

    const userBeforeRes = await db.query('SELECT register_number, username FROM users WHERE id = $1', [id]);
    if (userBeforeRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    const oldRegNumber = userBeforeRes.rows[0].register_number;
    const oldUsername = userBeforeRes.rows[0].username;

    let deptId = null;
    if (department) {
      const deptRes = await db.query('SELECT id FROM departments WHERE name ILIKE $1 OR full_name ILIKE $1', [`%${department}%`]);
      deptId = deptRes.rows[0]?.id;
    }

    // Check for unique constraint conflicts BEFORE attempting the update
    if (username && username !== oldUsername) {
      const usernameConflict = await db.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, id]);
      if (usernameConflict.rows.length > 0) {
        return res.status(409).json({ error: `Username "${username}" is already taken by another student.` });
      }
    }

    const newRegNumber = (register_number || '').trim() || oldRegNumber;
    if (newRegNumber && newRegNumber !== oldRegNumber) {
      const regConflict = await db.query('SELECT id FROM users WHERE register_number = $1 AND id != $2', [newRegNumber, id]);
      if (regConflict.rows.length > 0) {
        return res.status(409).json({ error: `Register number "${newRegNumber}" is already assigned to another student.` });
      }
    }

    if (email) {
      const emailConflict = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2', [email, id]);
      if (emailConflict.rows.length > 0) {
        return res.status(409).json({ error: `Email "${email}" is already registered by another student.` });
      }
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
        hosteller = COALESCE($7, hosteller),
        department_id = COALESCE($8, department_id),
        register_number = COALESCE($9, register_number),
        roll_number = COALESCE($9, roll_number),
        username = COALESCE($10, username),
        gender = COALESCE($11, gender),
        travel_mode = COALESCE($12, travel_mode),
        updated_at = NOW()
       WHERE id = $13
       RETURNING id, full_name, username, register_number, email, status, role, gender, travel_mode`,
      [
        full_name, 
        email, 
        status, 
        role, 
        stay_type, 
        stay_type === 'hostel' ? hostel_block : null,
        stay_type === 'hostel',
        deptId, 
        newRegNumber, 
        username, 
        gender, 
        travel_mode,
        id
      ]
    );

    if (updateRes.rows.length === 0) return res.status(404).json({ error: 'Student not found' });

    const finalRegNum = newRegNumber;

    // Update official_students registry in sync (silently — don't block update if registry sync fails)
    try {
      if (oldRegNumber) {
        await db.query(
          `UPDATE official_students SET 
            register_number = $1, 
            full_name = $2, 
            email = $3, 
            department = $4,
            gender = $5,
            travel_mode = $6
           WHERE LOWER(register_number) = LOWER($7)`,
          [finalRegNum, full_name, email || `${username || finalRegNum}@saranathan.ac.in`, department, gender, travel_mode, oldRegNumber]
        );
      }
    } catch (syncErr) {
      console.warn('official_students sync skipped:', syncErr.message);
    }

    // Update roommate profile in sync (silently)
    try {
      await db.query(
        `UPDATE roommates SET 
          name = $1,
          gender = $2,
          department = $3,
          hostel_block = $4,
          contact_email = $5,
          student_id = $6,
          is_visible = $7
         WHERE user_id = $8`,
        [full_name, gender, department, stay_type === 'hostel' ? hostel_block : null, email, finalRegNum, stay_type === 'hostel', id]
      );
    } catch (roommateErr) {
      console.warn('roommates sync skipped:', roommateErr.message);
    }

    await logActivity(req.admin?.id, 'student_updated', `Updated student ID ${id}: status=${status || 'unchanged'}`);
    res.json(updateRes.rows[0]);
  } catch (error) {
    // Catch any remaining unique constraint violations and return a user-friendly message
    if (error.code === '23505') {
      const detail = error.detail || '';
      if (detail.includes('username')) return res.status(409).json({ error: 'Username is already taken by another student.' });
      if (detail.includes('email')) return res.status(409).json({ error: 'Email is already registered by another student.' });
      if (detail.includes('register_number')) return res.status(409).json({ error: 'Register number is already assigned to another student.' });
      return res.status(409).json({ error: `Duplicate value conflict: ${detail}` });
    }
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
    const { question, answer, category = 'General', is_suggested = false, icon = 'help' } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'Question and Answer are required' });

    const result = await db.query(
      'INSERT INTO faqs (question, answer, category, is_suggested, icon) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [question, answer, category, is_suggested, icon]
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
    const { question, answer, category, is_approved, is_suggested, icon } = req.body;

    const result = await db.query(
      `UPDATE faqs SET 
        question = COALESCE($1, question),
        answer = COALESCE($2, answer),
        category = COALESCE($3, category),
        is_approved = COALESCE($4, is_approved),
        is_suggested = COALESCE($5, is_suggested),
        icon = COALESCE($6, icon),
        updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [question, answer, category, is_approved, is_suggested, icon, id]
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
// 8. ROOMMATE MATCHER MODULE
// ----------------------------------------------------

router.get('/roommates', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM roommates ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/roommates', async (req, res) => {
  try {
    const {
      name, gender = 'Male', department, year = '1st Year', hostel_block,
      preferred_language = 'English', sleep_schedule = '10 PM - 6 AM',
      study_habits = 'Quiet Study', cleanliness = 'Very Neat',
      smoking_preference = 'Non-Smoker', food_preference = 'Vegetarian',
      interests = [], hobbies = [], room_preference = '2 Sharing (Non-AC)',
      profile_photo, is_visible = true, contact_email, phone
    } = req.body;

    if (!name || !department || !hostel_block) {
      return res.status(400).json({ error: 'Name, Department, and Hostel Block are required' });
    }

    const result = await db.query(
      `INSERT INTO roommates (
        student_id, name, gender, department, year, hostel_block,
        preferred_language, sleep_schedule, study_habits, cleanliness,
        smoking_preference, food_preference, interests, hobbies,
        room_preference, profile_photo, is_visible, contact_email, phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        `SCE${Date.now().toString().slice(-6)}`,
        name, gender, department, year, hostel_block,
        preferred_language, sleep_schedule, study_habits, cleanliness,
        smoking_preference, food_preference,
        JSON.stringify(Array.isArray(interests) ? interests : [interests]),
        JSON.stringify(Array.isArray(hobbies) ? hobbies : [hobbies]),
        room_preference, profile_photo || null, is_visible,
        contact_email || null, phone || null
      ]
    );

    await logActivity(req.admin?.id, 'roommate_created', `Added roommate profile: ${name}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/roommates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, gender, department, year, hostel_block,
      preferred_language, sleep_schedule, study_habits, cleanliness,
      smoking_preference, food_preference, interests, hobbies,
      room_preference, profile_photo, is_visible, contact_email, phone
    } = req.body;

    const result = await db.query(
      `UPDATE roommates SET 
        name = COALESCE($1, name),
        gender = COALESCE($2, gender),
        department = COALESCE($3, department),
        year = COALESCE($4, year),
        hostel_block = COALESCE($5, hostel_block),
        preferred_language = COALESCE($6, preferred_language),
        sleep_schedule = COALESCE($7, sleep_schedule),
        study_habits = COALESCE($8, study_habits),
        cleanliness = COALESCE($9, cleanliness),
        smoking_preference = COALESCE($10, smoking_preference),
        food_preference = COALESCE($11, food_preference),
        interests = COALESCE($12, interests),
        hobbies = COALESCE($13, hobbies),
        room_preference = COALESCE($14, room_preference),
        profile_photo = COALESCE($15, profile_photo),
        is_visible = COALESCE($16, is_visible),
        contact_email = COALESCE($17, contact_email),
        phone = COALESCE($18, phone)
       WHERE id = $19 RETURNING *`,
      [
        name, gender, department, year, hostel_block,
        preferred_language, sleep_schedule, study_habits, cleanliness,
        smoking_preference, food_preference,
        interests ? JSON.stringify(Array.isArray(interests) ? interests : [interests]) : null,
        hobbies ? JSON.stringify(Array.isArray(hobbies) ? hobbies : [hobbies]) : null,
        room_preference, profile_photo, is_visible, contact_email, phone, id
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Roommate profile not found' });

    await logActivity(req.admin?.id, 'roommate_updated', `Updated roommate profile ID: ${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/roommates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM roommates WHERE id = $1', [id]);
    await logActivity(req.admin?.id, 'roommate_deleted', `Deleted roommate profile ID: ${id}`);
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

// ----------------------------------------------------
// 10. BUS ROUTES MANAGEMENT MODULE
// ----------------------------------------------------

router.get('/bus-routes', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM bus_routes ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bus-routes', async (req, res) => {
  try {
    const {
      title, description, route_date, session = 'morning', image_url, status = 'active', uploaded_by = 'College Administration'
    } = req.body;

    if (!title || !image_url) {
      return res.status(400).json({ error: 'Title and high-resolution Image URL are required' });
    }

    const sess = session.toLowerCase();
    if (!['morning', 'evening'].includes(sess)) {
      return res.status(400).json({ error: 'Session must be either morning or evening' });
    }

    // If publishing as active, archive previous active routes for the same session
    if (status === 'active') {
      await db.query(
        "UPDATE bus_routes SET status = 'archived', updated_at = NOW() WHERE session = $1 AND status = 'active'",
        [sess]
      );
    }

    const result = await db.query(
      `INSERT INTO bus_routes (
        title, description, route_date, session, image_url, status, uploaded_by
      ) VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, $5, $6, $7)
      RETURNING *`,
      [
        title, description || null, route_date || null, sess, image_url, status, uploaded_by
      ]
    );

    await logActivity(req.admin?.id, 'bus_route_created', `Published bus route board (${sess}): ${title}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/bus-routes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, route_date, session, image_url, status, uploaded_by } = req.body;

    // If changing status to active, auto-archive existing active routes for this session
    if (status === 'active' && session) {
      await db.query(
        "UPDATE bus_routes SET status = 'archived', updated_at = NOW() WHERE session = $1 AND status = 'active' AND id != $2",
        [session.toLowerCase(), id]
      );
    }

    const result = await db.query(
      `UPDATE bus_routes SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        route_date = COALESCE($3, route_date),
        session = COALESCE($4, session),
        image_url = COALESCE($5, image_url),
        status = COALESCE($6, status),
        uploaded_by = COALESCE($7, uploaded_by),
        updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [title, description, route_date, session ? session.toLowerCase() : null, image_url, status, uploaded_by, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Bus route record not found' });

    await logActivity(req.admin?.id, 'bus_route_updated', `Updated bus route ID: ${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/bus-routes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM bus_routes WHERE id = $1', [id]);
    await logActivity(req.admin?.id, 'bus_route_deleted', `Deleted bus route ID: ${id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/campus-stats
router.get('/campus-stats', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM campus_stats WHERE id = 1');
    const stats = result.rows[0] || { students_guided: 1485, campus_locations: 25, active_services: 8 };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/campus-stats
router.post('/campus-stats', async (req, res) => {
  try {
    const { students_guided, campus_locations, active_services } = req.body;
    
    const result = await db.query(
      `INSERT INTO campus_stats (id, students_guided, campus_locations, active_services, updated_at)
       VALUES (1, $1, $2, $3, NOW())
       ON CONFLICT (id) DO UPDATE SET
         students_guided = EXCLUDED.students_guided,
         campus_locations = EXCLUDED.campus_locations,
         active_services = EXCLUDED.active_services,
         updated_at = NOW()
       RETURNING *`,
      [parseInt(students_guided, 10) || 0, parseInt(campus_locations, 10) || 0, parseInt(active_services, 10) || 0]
    );
    
    await logActivity(req.admin?.id, 'update_campus_stats', `Updated campus stats: Students Guided=${students_guided}, Locations=${campus_locations}, Services=${active_services}`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 11. AI INCORRECT ANSWERS REPORTS MANAGEMENT MODULE
// ----------------------------------------------------

router.get('/ai-reports', async (req, res) => {
  try {
    const { department, source, severity, status, search, date } = req.query;
    let queryStr = 'SELECT * FROM ai_reports WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (department && department !== 'All') {
      queryStr += ` AND user_department = $${paramIndex}`;
      params.push(department);
      paramIndex++;
    }
    if (source && source !== 'All') {
      queryStr += ` AND source = $${paramIndex}`;
      params.push(source);
      paramIndex++;
    }
    if (severity && severity !== 'All') {
      queryStr += ` AND severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }
    if (status && status !== 'All') {
      queryStr += ` AND resolution_status = $${paramIndex}`;
      params.push(status.toLowerCase());
      paramIndex++;
    }
    if (date) {
      queryStr += ` AND timestamp::date = $${paramIndex}::date`;
      params.push(date);
      paramIndex++;
    }
    if (search) {
      queryStr += ` AND (question ILIKE $${paramIndex} OR ai_answer ILIKE $${paramIndex} OR reported_reason ILIKE $${paramIndex} OR student_comments ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    queryStr += ' ORDER BY timestamp DESC';
    const reports = await db.query(queryStr, params);
    res.json(reports.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/ai-reports/:id', async (req, res) => {
  const { id } = req.params;
  const { resolution_status, admin_notes, correctedAnswer } = req.body;

  try {
    // 1. Update the report details
    const result = await db.query(
      `UPDATE ai_reports SET 
         resolution_status = COALESCE($1, resolution_status),
         admin_notes = COALESCE($2, admin_notes),
         timestamp = timestamp
       WHERE id = $3 RETURNING *`,
      [resolution_status, admin_notes || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = result.rows[0];

    // 2. If corrected answer is supplied and status is resolved, insert/update in faqs table
    if (correctedAnswer && resolution_status === 'resolved') {
      const faqCheck = await db.query(
        'SELECT id FROM faqs WHERE TRIM(LOWER(question)) = TRIM(LOWER($1)) LIMIT 1',
        [report.question]
      );

      if (faqCheck.rows.length > 0) {
        // Update existing FAQ
        await db.query(
          `UPDATE faqs SET 
             answer = $1, 
             is_approved = true, 
             updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2`,
          [correctedAnswer, faqCheck.rows[0].id]
        );
      } else {
        // Insert new approved FAQ
        await db.query(
          `INSERT INTO faqs (question, answer, category, is_approved, is_suggested, icon, created_at, updated_at)
           VALUES ($1, $2, 'AI Correction', true, false, 'star', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [report.question, correctedAnswer]
        );
      }
    }

    await logActivity(req.admin?.id, 'resolve_ai_report', `Resolved AI report ID: ${id} with status ${resolution_status}`);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// CAMPUS CONTROL CENTER ADDED Rest ENDPOINTS (Task CRUDs)
// ----------------------------------------------------

// 1. FACULTY CRUD
router.get('/faculty', async (req, res) => {
  try {
    const { search, deptId } = req.query;
    let queryStr = 'SELECT f.*, d.name as department_name FROM faculty f LEFT JOIN departments d ON f.department_id = d.id WHERE 1=1';
    const params = [];
    let idx = 1;
    if (deptId && deptId !== 'All') {
      queryStr += ` AND f.department_id = $${idx}`;
      params.push(deptId);
      idx++;
    }
    if (search) {
      queryStr += ` AND (f.name ILIKE $${idx} OR f.designation ILIKE $${idx} OR f.contact_email ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    queryStr += ' ORDER BY f.hod_status DESC, f.name ASC';
    const result = await db.query(queryStr, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/faculty', async (req, res) => {
  const { name, department_id, designation, contact_email, photo, office_hours, hod_status, principal_status, cabin } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO faculty (name, department_id, designation, contact_email, photo, office_hours, hod_status, principal_status, cabin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, department_id, designation, contact_email, photo || null, office_hours || null, hod_status || false, principal_status || false, cabin || null]
    );
    // Auto index AI Knowledge Trigger
    await db.query(`INSERT INTO chatbot_documents (title, type, url) VALUES ($1, 'handbook', $2)`, [`Faculty Directory Update: ${name}`, `/faculty`]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/faculty/:id', async (req, res) => {
  const { id } = req.params;
  const { name, department_id, designation, contact_email, photo, office_hours, hod_status, principal_status, cabin } = req.body;
  try {
    const result = await db.query(
      `UPDATE faculty SET name = $1, department_id = $2, designation = $3, contact_email = $4, photo = $5, office_hours = $6, hod_status = $7, principal_status = $8, cabin = $9
       WHERE id = $10 RETURNING *`,
      [name, department_id, designation, contact_email, photo, office_hours, hod_status, principal_status, cabin, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/faculty/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM faculty WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. DEPARTMENT CRUD
router.get('/departments', async (req, res) => {
  try {
    const result = await db.query('SELECT d.*, f.name as hod_name FROM departments d LEFT JOIN faculty f ON d.hod_id = f.id ORDER BY d.name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/departments', async (req, res) => {
  const { name, intake, hod_id, vision, mission, programme_outcomes, images } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO departments (name, intake, hod_id, vision, mission, programme_outcomes, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, intake || 60, hod_id || null, vision || null, mission || null, programme_outcomes || null, images || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/departments/:id', async (req, res) => {
  const { id } = req.params;
  const { name, intake, hod_id, vision, mission, programme_outcomes, images } = req.body;
  try {
    const result = await db.query(
      `UPDATE departments SET name = $1, intake = $2, hod_id = $3, vision = $4, mission = $5, programme_outcomes = $6, images = $7
       WHERE id = $8 RETURNING *`,
      [name, intake, hod_id, vision, mission, programme_outcomes, images, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/departments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM departments WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. PLACEMENT CRUD
router.get('/placements', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM placements ORDER BY drive_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/placements', async (req, res) => {
  const { company, package_details, eligibility, registration_link, drive_date, venue, rounds } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO placements (company, package_details, eligibility, registration_link, drive_date, venue, rounds)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [company, package_details, eligibility, registration_link, drive_date, venue, rounds || []]
    );
    // Index placement details to chatbot automatically
    await db.query(`INSERT INTO chatbot_documents (title, type, url) VALUES ($1, 'handbook', $2)`, [`Placement Drive: ${company}`, `/study-hub`]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/placements/:id', async (req, res) => {
  const { id } = req.params;
  const { company, package_details, eligibility, registration_link, drive_date, venue, rounds, is_active } = req.body;
  try {
    const result = await db.query(
      `UPDATE placements SET company = $1, package_details = $2, eligibility = $3, registration_link = $4, drive_date = $5, venue = $6, rounds = $7, is_active = $8
       WHERE id = $9 RETURNING *`,
      [company, package_details, eligibility, registration_link, drive_date, venue, rounds, is_active, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/placements/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM placements WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. STUDY HUB NOTES CRUD
router.get('/study-materials', async (req, res) => {
  try {
    const { departmentId, semester } = req.query;
    let queryStr = 'SELECT s.*, d.name as department_name FROM study_materials s LEFT JOIN departments d ON s.department_id = d.id WHERE 1=1';
    const params = [];
    let idx = 1;
    if (departmentId) {
      queryStr += ` AND s.department_id = $${idx}`;
      params.push(departmentId);
      idx++;
    }
    if (semester) {
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

router.post('/study-materials', async (req, res) => {
  const { title, file_url, document_type, department_id, semester, subject } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO study_materials (title, file_url, document_type, department_id, semester, subject)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, file_url, document_type, department_id, semester, subject]
    );
    // Index file automatically for chatbot
    await db.query(`INSERT INTO chatbot_documents (title, type, url) VALUES ($1, 'handbook', $2)`, [`Study Material: ${title} (${subject})`, file_url]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/study-materials/:id', async (req, res) => {
  const { id } = req.params;
  const { title, file_url, document_type, department_id, semester, subject } = req.body;
  try {
    const result = await db.query(
      `UPDATE study_materials SET title = $1, file_url = $2, document_type = $3, department_id = $4, semester = $5, subject = $6
       WHERE id = $7 RETURNING *`,
      [title, file_url, document_type, department_id, semester, subject, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/study-materials/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM study_materials WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. HOSTEL MANAGEMENT CRUD
router.get('/hostel', async (req, res) => {
  try {
    const info = await db.query('SELECT * FROM hostel_info ORDER BY info_type ASC, id DESC');
    const rooms = await db.query('SELECT r.*, u.name as student_name FROM hostel_room_allocations r LEFT JOIN users u ON r.student_id = u.id ORDER BY room_number ASC');
    res.json({ info: info.rows, rooms: rooms.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/hostel/info', async (req, res) => {
  const { info_type, title, content } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO hostel_info (info_type, title, content) VALUES ($1, $2, $3) RETURNING *',
      [info_type, title, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/hostel/info/:id', async (req, res) => {
  const { id } = req.params;
  const { info_type, title, content } = req.body;
  try {
    const result = await db.query(
      'UPDATE hostel_info SET info_type = $1, title = $2, content = $3 WHERE id = $4 RETURNING *',
      [info_type, title, content, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/hostel/info/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM hostel_info WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/hostel/rooms', async (req, res) => {
  const { student_id, room_number, block_name } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO hostel_room_allocations (student_id, room_number, block_name) VALUES ($1, $2, $3) RETURNING *',
      [student_id, room_number, block_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/hostel/rooms/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM hostel_room_allocations WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. ACADEMIC CALENDAR CRUD
router.get('/academic-calendar', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM academic_calendar ORDER BY start_date ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/academic-calendar', async (req, res) => {
  const { event_name, start_date, end_date, description } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO academic_calendar (event_name, start_date, end_date, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [event_name, start_date, end_date || null, description || null]
    );
    // Index calendar in AI
    await db.query(`INSERT INTO chatbot_documents (title, type, url) VALUES ($1, 'handbook', $2)`, [`Academic Calendar: ${event_name}`, `/student/home`]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/academic-calendar/:id', async (req, res) => {
  const { id } = req.params;
  const { event_name, start_date, end_date, description } = req.body;
  try {
    const result = await db.query(
      'UPDATE academic_calendar SET event_name = $1, start_date = $2, end_date = $3, description = $4 WHERE id = $5 RETURNING *',
      [event_name, start_date, end_date, description, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/academic-calendar/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM academic_calendar WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. ANNA UNIVERSITY CRUDS
router.get('/anna-university', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM anna_university_rules ORDER BY regulation_year DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/anna-university', async (req, res) => {
  const { regulation_year, curriculum_details, question_pattern_description, credits_structure, academic_rules_text } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO anna_university_rules (regulation_year, curriculum_details, question_pattern_description, credits_structure, academic_rules_text)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [regulation_year, curriculum_details, question_pattern_description, credits_structure, academic_rules_text]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/anna-university/:id', async (req, res) => {
  const { id } = req.params;
  const { regulation_year, curriculum_details, question_pattern_description, credits_structure, academic_rules_text } = req.body;
  try {
    const result = await db.query(
      `UPDATE anna_university_rules SET regulation_year = $1, curriculum_details = $2, question_pattern_description = $3, credits_structure = $4, academic_rules_text = $5
       WHERE id = $6 RETURNING *`,
      [regulation_year, curriculum_details, question_pattern_description, credits_structure, academic_rules_text, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/anna-university/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM anna_university_rules WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. WEBSITE SYNC MONITORING & SCRAPER LOGS
router.get('/web-sync/logs', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM website_sync_logs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/web-sync/trigger', async (req, res) => {
  try {
    // Generate a Mock scraper change detection to be approved by admin
    const newItems = [
      { url: 'https://www.saranathan.ac.in/news/1', type: 'notice', title: 'Anna University Semester Fee Extension Announcement' },
      { url: 'https://www.saranathan.ac.in/faculty/ece-hod', type: 'faculty', title: 'HOD ECE Designation Upgrade - Dr. M. Santhi' }
    ];
    const created = [];
    for (const item of newItems) {
      const resDb = await db.query(
        `INSERT INTO website_sync_logs (source_url, content_type, scraped_content, status)
         VALUES ($1, $2, $3, 'pending_approval') RETURNING *`,
        [item.url, item.type, JSON.stringify(item)]
      );
      created.push(resDb.rows[0]);
    }
    res.json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/web-sync/approve/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const syncRes = await db.query('UPDATE website_sync_logs SET status = \'approved\', approved_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *', [id]);
    if (syncRes.rows.length === 0) return res.status(404).json({ error: 'Log not found' });
    
    const record = syncRes.rows[0];
    const info = record.scraped_content;
    
    // Auto-update PostgreSQL directly depending on content type
    if (record.content_type === 'notice') {
      await db.query(
        'INSERT INTO notices (title, content, author, priority) VALUES ($1, $2, \'System Scraper\', \'normal\')',
        [info.title, `Imported from Saranathan Official Website: ${record.source_url}`]
      );
    }
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/web-sync/reject/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE website_sync_logs SET status = \'rejected\' WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. CENTRAL MEDIA LIBRARY MANAGER
router.get('/media-library', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM media_library ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/media-library/upload', async (req, res) => {
  const { data_base64, original_name, mime_type, folder_name } = req.body;
  try {
    const uploadsDir = path.join(process.cwd(), 'backend', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = original_name.split('.').pop() || 'png';
    const filename = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    const base64Data = data_base64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    const storage_url = `/uploads/${filename}`;
    const file_size = buffer.length;

    // Detect type
    let file_type = 'generic';
    if (mime_type?.startsWith('image/')) file_type = 'image';
    else if (mime_type === 'application/pdf') file_type = 'pdf';

    const result = await db.query(
      `INSERT INTO media_library (filename, original_name, file_type, mime_type, file_size, storage_url, folder_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [filename, original_name, file_type, mime_type, file_size, storage_url, folder_name || 'general']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/media-library/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const check = await db.query('SELECT filename FROM media_library WHERE id = $1', [id]);
    if (check.rows.length > 0) {
      const filePath = path.join(process.cwd(), 'backend', 'uploads', check.rows[0].filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await db.query('DELETE FROM media_library WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. SYSTEM SETTINGS PANEL
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

router.post('/settings', async (req, res) => {
  const settings = req.body; // key-value pairs object
  try {
    for (const [key, value] of Object.entries(settings)) {
      await db.query(
        `INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
        [key, String(value)]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. AUDIT LOGS LIST
router.get('/audit-logs', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, COALESCE(u.username, 'System') as admin_username
      FROM activity_logs a
      LEFT JOIN admin_users u ON a.admin_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. PUSH NOTIFICATIONS BROADCAST
router.get('/notifications', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM push_notifications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notifications', async (req, res) => {
  const { title, message, target_audience, target_value, priority, scheduled_time } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO push_notifications (title, message, target_audience, target_value, priority, scheduled_time, is_sent)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, message, target_audience || 'everyone', target_value || null, priority || 'normal', scheduled_time || null, scheduled_time ? false : true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. ROLE MANAGEMENT (ADMIN USERS)
router.get('/roles/users', async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, full_name, role, email, is_active, created_at FROM admin_users ORDER BY username ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/roles/users', async (req, res) => {
  const { username, password, full_name, role, email } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO admin_users (username, password_hash, full_name, role, email, is_active)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING id, username, full_name, role, email`,
      [username, hash, full_name, role, email || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/roles/users/:id', async (req, res) => {
  const { id } = req.params;
  const { full_name, role, email, is_active } = req.body;
  try {
    const result = await db.query(
      `UPDATE admin_users SET full_name = $1, role = $2, email = $3, is_active = $4
       WHERE id = $5 RETURNING id, username, full_name, role, email, is_active`,
      [full_name, role, email, is_active, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/roles/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM admin_users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14. CAMPUS NAVIGATION MARKERS
router.get('/navigation/locations', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM locations ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/navigation/locations', async (req, res) => {
  const { name, latitude, longitude, altitude, floor, category, description, office_hours, tags, images } = req.body;
  
  // Validation coordinates checks
  const latVal = parseFloat(latitude);
  const lngVal = parseFloat(longitude);
  if (isNaN(latVal) || latVal < -90 || latVal > 90) {
    return res.status(400).json({ error: 'Invalid latitude value. Must be between -90 and 90.' });
  }
  if (isNaN(lngVal) || lngVal < -180 || lngVal > 180) {
    return res.status(400).json({ error: 'Invalid longitude value. Must be between -180 and 180.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO locations (name, latitude, longitude, altitude, floor, category, description, office_hours, tags, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, latVal, lngVal, altitude || 0, floor || 0, category || 'Academic', description || null, office_hours || null, tags || [], images || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/navigation/locations/:id', async (req, res) => {
  const { id } = req.params;
  const { name, latitude, longitude, altitude, floor, category, description, office_hours, tags, images } = req.body;

  const latVal = parseFloat(latitude);
  const lngVal = parseFloat(longitude);
  if (isNaN(latVal) || latVal < -90 || latVal > 90) {
    return res.status(400).json({ error: 'Invalid latitude value.' });
  }
  if (isNaN(lngVal) || lngVal < -180 || lngVal > 180) {
    return res.status(400).json({ error: 'Invalid longitude value.' });
  }

  try {
    const result = await db.query(
      `UPDATE locations SET name = $1, latitude = $2, longitude = $3, altitude = $4, floor = $5, category = $6, description = $7, office_hours = $8, tags = $9, images = $10
       WHERE id = $11 RETURNING *`,
      [name, latVal, lngVal, altitude, floor, category, description, office_hours, tags, images, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/navigation/locations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM locations WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// REVIEW MODERATION & ANALYTICS SYSTEM
// ----------------------------------------------------

/**
 * 1. GET /api/admin/reviews
 * Fetches all reviews with filtering, searching, and pagination.
 */
router.get('/reviews', async (req, res) => {
  const { status, department, rating, category, search, date, limit = 50, offset = 0 } = req.query;

  try {
    let sql = `
      SELECT r.*, u.email AS student_email, u.roll_number
      FROM reviews r
      LEFT JOIN users u ON r.student_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      params.push(status.toLowerCase());
      if (status.toLowerCase() === 'featured') {
        sql += ` AND r.featured = true`;
        params.pop(); // Remove since we do hardcoded boolean comparison
      } else if (status.toLowerCase() === 'reported') {
        sql += ` AND r.report_count > 0`;
        params.pop();
      } else {
        sql += ` AND r.status = $${params.length}`;
      }
    }

    if (department && department !== 'All') {
      params.push(department);
      sql += ` AND r.department = $${params.length}`;
    }

    if (rating && rating !== 'All') {
      params.push(parseInt(rating, 10));
      sql += ` AND r.rating = $${params.length}`;
    }

    if (category && category !== 'All') {
      params.push(category);
      sql += ` AND r.category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(r.title) LIKE $${params.length} OR LOWER(r.description) LIKE $${params.length} OR LOWER(r.student_name) LIKE $${params.length})`;
    }

    if (date) {
      params.push(date);
      sql += ` AND DATE(r.created_at) = $${params.length}`;
    }

    sql += ` ORDER BY r.is_pinned DESC, r.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    
    const limitVal = parseInt(limit, 10);
    const offsetVal = parseInt(offset, 10);
    params.push(limitVal, offsetVal);

    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. GET /api/admin/reviews/analytics
 * Returns summary stats, rating distribution, category averages, and sentiment metrics.
 */
router.get('/reviews/analytics', async (req, res) => {
  try {
    // Basic Counts
    const countsRes = await db.query(
      `SELECT 
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'pending') AS pending,
         COUNT(*) FILTER (WHERE status = 'approved') AS approved,
         COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
         COUNT(*) FILTER (WHERE featured = true) AS featured,
         COUNT(*) FILTER (WHERE report_count > 0) AS reported,
         COALESCE(AVG(rating) FILTER (WHERE status = 'approved'), 0) AS avg_rating
       FROM reviews`
    );

    const counts = countsRes.rows[0];

    // Rating Distribution (1-5 stars)
    const distRes = await db.query(
      `SELECT rating, COUNT(*)::integer AS count 
       FROM reviews 
       WHERE status = 'approved' 
       GROUP BY rating 
       ORDER BY rating DESC`
    );

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distRes.rows.forEach(r => {
      distribution[r.rating] = r.count;
    });

    // Category Distribution & Rating Average
    const catRes = await db.query(
      `SELECT category, COUNT(*)::integer AS count, COALESCE(AVG(rating), 0) AS avg_rating
       FROM reviews
       WHERE status = 'approved'
       GROUP BY category
       ORDER BY count DESC`
    );

    const categories = catRes.rows.map(r => ({
      category: r.category,
      count: r.count,
      avgRating: parseFloat(r.avg_rating).toFixed(1)
    }));

    // Dynamic Sentiment Analysis
    // Rating 4-5 = Positive, 3 = Neutral, 1-2 or reported = Needs Attention
    const sentimentRes = await db.query(
      `SELECT 
         COUNT(*) FILTER (WHERE rating >= 4 AND status = 'approved') AS positive,
         COUNT(*) FILTER (WHERE rating = 3 AND status = 'approved') AS neutral,
         COUNT(*) FILTER (WHERE (rating <= 2 AND status = 'approved') OR report_count > 0) AS needs_attention
       FROM reviews`
    );

    const sentiment = sentimentRes.rows[0];

    // Recent reported details
    const recentReportedRes = await db.query(
      `SELECT rr.*, r.title, r.student_name 
       FROM review_reports rr
       JOIN reviews r ON rr.review_id = r.id
       ORDER BY rr.created_at DESC LIMIT 5`
    );

    res.json({
      success: true,
      summary: {
        totalReviews: parseInt(counts.total || 0, 10),
        pending: parseInt(counts.pending || 0, 10),
        approved: parseInt(counts.approved || 0, 10),
        rejected: parseInt(counts.rejected || 0, 10),
        featured: parseInt(counts.featured || 0, 10),
        reported: parseInt(counts.reported || 0, 10),
        averageRating: parseFloat(counts.avg_rating || 0).toFixed(1)
      },
      distribution,
      categories,
      sentiment: {
        positive: parseInt(sentiment.positive || 0, 10),
        neutral: parseInt(sentiment.neutral || 0, 10),
        needsAttention: parseInt(sentiment.needs_attention || 0, 10)
      },
      recentReports: recentReportedRes.rows
    });
  } catch (error) {
    console.error('Error generating reviews analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. PUT /api/admin/reviews/:id
 * Updates status, features, pins, reply, notes, and triggers notifications.
 */
router.put('/reviews/:id', async (req, res) => {
  const { id } = req.params;
  const { status, featured, is_pinned, rating, title, description, admin_notes, admin_reply } = req.body;

  try {
    const checkRes = await db.query('SELECT * FROM reviews WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    const oldReview = checkRes.rows[0];

    // Build updates dynamic query
    let sql = 'UPDATE reviews SET ';
    const params = [];
    const updates = [];

    if (status !== undefined) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }
    if (featured !== undefined) {
      params.push(featured);
      updates.push(`featured = $${params.length}`);
    }
    if (is_pinned !== undefined) {
      params.push(is_pinned);
      updates.push(`is_pinned = $${params.length}`);
    }
    if (rating !== undefined) {
      params.push(parseInt(rating, 10));
      updates.push(`rating = $${params.length}`);
    }
    if (title !== undefined) {
      params.push(title.trim());
      updates.push(`title = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description.trim());
      updates.push(`description = $${params.length}`);
    }
    if (admin_notes !== undefined) {
      params.push(admin_notes.trim());
      updates.push(`admin_notes = $${params.length}`);
    }
    if (admin_reply !== undefined) {
      params.push(admin_reply.trim());
      updates.push(`admin_reply = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    params.push(id);
    sql += updates.join(', ') + `, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length} RETURNING *`;

    const result = await db.query(sql, params);
    const updatedReview = result.rows[0];

    // Triggers notifications in student_notifications
    const studentId = updatedReview.student_id;

    // A. Status change notifications
    if (status !== undefined && status !== oldReview.status) {
      if (status === 'approved') {
        await db.query(
          `INSERT INTO student_notifications (student_id, title, message)
           VALUES ($1, 'Review Approved', 'Your review of PathMate has been approved by the administrators! Thank you for sharing your experience.')`,
          [studentId]
        );
      } else if (status === 'rejected') {
        const reasonStr = admin_notes ? `Reason: ${admin_notes}` : 'It did not comply with our community standard guidelines.';
        await db.query(
          `INSERT INTO student_notifications (student_id, title, message)
           VALUES ($1, 'Review Moderation Update', 'Your review was rejected. ${reasonStr}')`,
          [studentId]
        );
      }
    }

    // B. Admin reply notification
    if (admin_reply !== undefined && admin_reply !== oldReview.admin_reply && admin_reply.trim().length > 0) {
      await db.query(
        `INSERT INTO student_notifications (student_id, title, message)
         VALUES ($1, 'Admin Replied to Review', 'An administrator replied to your review: "${admin_reply.substring(0, 60)}..."')`,
        [studentId]
      );
    }

    await logActivity(req.admin?.id, 'moderate_review', `Moderated review ID: ${id} (status: ${status || updatedReview.status})`);
    res.json({ success: true, review: updatedReview });
  } catch (error) {
    console.error('Error moderating review:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 4. DELETE /api/admin/reviews/:id
 * Deletes a review permanently.
 */
router.delete('/reviews/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM reviews WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    await logActivity(req.admin?.id, 'delete_review', `Permanently deleted review ID: ${id}`);
    res.json({ success: true, message: 'Review deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
