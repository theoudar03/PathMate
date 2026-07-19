import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/index.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_pathmate';

// ----------------------------------------------------
// AUTHENTICATION & MIDDLEWARE
// ----------------------------------------------------

// POST /api/admin/auth/login
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userRes = await db.query('SELECT * FROM admin_users WHERE username = $1 AND is_active = true', [username]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await db.query('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.full_name
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: payload });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware to verify Admin JWT
export const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Apply verifyAdmin to all subsequent routes in this file
router.use(verifyAdmin);

// ----------------------------------------------------
// ADMIN ROUTES (Protected)
// ----------------------------------------------------

// GET all documents
router.get('/documents', async (req, res) => {
  try {
    const docs = await db.query('SELECT id, title, type, url, uploaded_at FROM chatbot_documents ORDER BY uploaded_at DESC');
    res.json(docs.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET status summary (Legacy)
router.get('/status', async (req, res) => {
  try {
    const docsRes = await db.query('SELECT COUNT(*) FROM chatbot_documents');
    const chunksRes = await db.query('SELECT COUNT(*) FROM chatbot_chunks');
    const faqsRes = await db.query('SELECT COUNT(*) FROM faqs');
    res.json({
      documents: parseInt(docsRes.rows[0].count),
      chunks: parseInt(chunksRes.rows[0].count),
      faqs: parseInt(faqsRes.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET Admin Dashboard stats
router.get('/stats/dashboard', async (req, res) => {
  try {
    const studentsRes = await db.query('SELECT COUNT(*) FROM users');
    const clubsRes = await db.query('SELECT COUNT(*) FROM clubs');
    const eventsRes = await db.query("SELECT COUNT(*) FROM events");
    const docsRes = await db.query('SELECT COUNT(*) FROM chatbot_documents');
    const volunteersRes = await db.query('SELECT COUNT(*) FROM volunteers');
    const noticesRes = await db.query('SELECT COUNT(*) FROM notices');
    
    const activityRes = await db.query(`
      SELECT a.id, a.action_type, a.description, a.created_at, u.username as admin_name
      FROM activity_logs a
      LEFT JOIN admin_users u ON a.admin_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 5
    `);

    res.json({
      totalStudents: parseInt(studentsRes.rows[0]?.count || 0),
      activeUsersToday: parseInt(studentsRes.rows[0]?.count || 0),
      aiChatsToday: 0,
      voiceQueries: 0,
      registeredClubs: parseInt(clubsRes.rows[0]?.count || 0),
      upcomingEvents: parseInt(eventsRes.rows[0]?.count || 0),
      pendingRegistrations: parseInt(volunteersRes.rows[0]?.count || 0), 
      studyMaterials: parseInt(docsRes.rows[0]?.count || 0), 
      noticesPublished: parseInt(noticesRes.rows[0]?.count || 0),
      todaysVisitors: 0,
      geminiRequests: 0, 
      databaseHealth: 'Healthy',
      aiDocs: parseInt(docsRes.rows[0]?.count || 0),
      recentActivity: activityRes.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all students (users)
router.get('/students', async (req, res) => {
  try {
    const students = await db.query(`
      SELECT 
        u.id, u.username, u.name, 
        u.department_id, d.name as department_name, 
        u.stay_type, u.hostel_block, u.language_pref, u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.created_at DESC
    `);
    res.json(students.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all events
router.get('/events', async (req, res) => {
  try {
    const events = await db.query(`
      SELECT id, name as title, event_date as date, location_text as location, status, 0 as attendees 
      FROM events 
      ORDER BY event_date ASC
    `);
    res.json(events.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new event
router.post('/events', async (req, res) => {
  try {
    const { title, date, location, status } = req.body;
    // Basic validation
    if (!title || !date || !location) return res.status(400).json({ error: 'Missing required fields' });
    
    // Check for duplicates
    const check = await db.query('SELECT id FROM events WHERE name = $1', [title]);
    if (check.rows.length > 0) return res.status(400).json({ error: 'Event already exists' });
    
    const result = await db.query(
      'INSERT INTO events (name, event_date, location_text, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, date, location, status || 'upcoming']
    );
    
    // Log activity
    if (req.user?.id) {
      await db.query('INSERT INTO activity_logs (action_type, description, admin_id) VALUES ($1, $2, $3)', ['event_created', `Created event: ${title}`, req.user.id]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE event
router.delete('/events/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    if (req.user?.id) {
      await db.query('INSERT INTO activity_logs (action_type, description, admin_id) VALUES ($1, $2, $3)', ['event_deleted', `Deleted event ID: ${req.params.id}`, req.user.id]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all clubs
router.get('/clubs', async (req, res) => {
  try {
    const clubs = await db.query(`
      SELECT id, name, description, location_text, eligibility, status, 0 as members, 'Just now' as "lastActivity"
      FROM clubs 
      ORDER BY created_at DESC
    `);
    res.json(clubs.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new club
router.post('/clubs', async (req, res) => {
  try {
    const { name, description, location, eligibility, status } = req.body;
    if (!name || !description) return res.status(400).json({ error: 'Missing required fields' });
    
    const check = await db.query('SELECT id FROM clubs WHERE name = $1', [name]);
    if (check.rows.length > 0) return res.status(400).json({ error: 'Club already exists' });
    
    const result = await db.query(
      'INSERT INTO clubs (name, description, location_text, eligibility, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, location, eligibility, status || 'active']
    );
    
    if (req.user?.id) {
      await db.query('INSERT INTO activity_logs (action_type, description, admin_id) VALUES ($1, $2, $3)', ['club_created', `Created club: ${name}`, req.user.id]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE club
router.delete('/clubs/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM clubs WHERE id = $1', [req.params.id]);
    if (req.user?.id) {
      await db.query('INSERT INTO activity_logs (action_type, description, admin_id) VALUES ($1, $2, $3)', ['club_deleted', `Deleted club ID: ${req.params.id}`, req.user.id]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all notices
router.get('/notices', async (req, res) => {
  try {
    const notices = await db.query(`
      SELECT id, title, target_audience as target, created_at as "publishedAt", 0 as views, (priority = 'urgent') as urgent
      FROM notices 
      ORDER BY created_at DESC
    `);
    res.json(notices.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- COMMITTEES ---
router.get('/committees', async (req, res) => {
  try { res.json((await db.query('SELECT * FROM committees ORDER BY created_at DESC')).rows); } catch (e) { res.status(500).json({error: e.message}); }
});
router.post('/committees', async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await db.query('INSERT INTO committees (name, description) VALUES ($1, $2) RETURNING *', [name, description]);
    if (req.user?.id) await db.query('INSERT INTO activity_logs (action_type, description, admin_id) VALUES ($1, $2, $3)', ['committee_created', `Created committee: ${name}`, req.user.id]);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({error: e.message}); }
});
router.delete('/committees/:id', async (req, res) => {
  try { await db.query('DELETE FROM committees WHERE id = $1', [req.params.id]); res.json({success: true}); } catch (e) { res.status(500).json({error: e.message}); }
});

// --- VOLUNTEERS ---
router.get('/volunteers', async (req, res) => {
  try { res.json((await db.query('SELECT * FROM volunteers ORDER BY created_at DESC')).rows); } catch (e) { res.status(500).json({error: e.message}); }
});
router.post('/volunteers', async (req, res) => {
  try {
    const { user_id, event_id, role } = req.body;
    const result = await db.query('INSERT INTO volunteers (user_id, event_id, role) VALUES ($1, $2, $3) RETURNING *', [user_id, event_id, role]);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({error: e.message}); }
});
router.delete('/volunteers/:id', async (req, res) => {
  try { await db.query('DELETE FROM volunteers WHERE id = $1', [req.params.id]); res.json({success: true}); } catch (e) { res.status(500).json({error: e.message}); }
});

// --- SENIORS ---
router.get('/seniors', async (req, res) => {
  try { res.json((await db.query('SELECT * FROM seniors ORDER BY created_at DESC')).rows); } catch (e) { res.status(500).json({error: e.message}); }
});
router.post('/seniors', async (req, res) => {
  try {
    const { name, department_id, interests, linkedin_url } = req.body;
    const result = await db.query('INSERT INTO seniors (name, department_id, interests, linkedin_url) VALUES ($1, $2, $3, $4) RETURNING *', [name, department_id, interests, linkedin_url]);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({error: e.message}); }
});
router.delete('/seniors/:id', async (req, res) => {
  try { await db.query('DELETE FROM seniors WHERE id = $1', [req.params.id]); res.json({success: true}); } catch (e) { res.status(500).json({error: e.message}); }
});

// POST new notice
router.post('/notices', async (req, res) => {
  try {
    const { title, content, target, urgent } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Missing required fields' });
    
    // Check for duplicates
    const check = await db.query('SELECT id FROM notices WHERE title = $1', [title]);
    if (check.rows.length > 0) return res.status(400).json({ error: 'Notice already exists' });
    
    const result = await db.query(
      "INSERT INTO notices (title, content, target_audience, priority, author) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, target_audience as target, created_at as \"publishedAt\", 0 as views, (priority = 'urgent') as urgent",
      [title, content, target || 'All', urgent ? 'urgent' : 'normal', req.user?.username || 'Admin']
    );
    
    if (req.user?.id) {
      await db.query('INSERT INTO activity_logs (action_type, description, admin_id) VALUES ($1, $2, $3)', ['notice_published', `Published notice: ${title}`, req.user.id]);
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE notice
router.delete('/notices/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM notices WHERE id = $1', [req.params.id]);
    if (req.user?.id) {
      await db.query('INSERT INTO activity_logs (action_type, description, admin_id) VALUES ($1, $2, $3)', ['notice_deleted', `Deleted notice ID: ${req.params.id}`, req.user.id]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE document
router.delete('/documents/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // chatbot_chunks will be deleted via ON DELETE CASCADE
    await db.query('DELETE FROM chatbot_documents WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MOCK: Upload document & index
router.post('/upload', async (req, res) => {
  const { title, type } = req.body;
  try {
    // For demo purposes, we just insert a mock document and a dummy chunk
    const docRes = await db.query(
      'INSERT INTO chatbot_documents (title, type) VALUES ($1, $2) RETURNING id',
      [title, type]
    );
    const docId = docRes.rows[0].id;
    
    // Insert dummy chunk
    const dummyEmbedding = `[${Array(768).fill(0.01).join(',')}]`;
    await db.query(
      'INSERT INTO chatbot_chunks (document_id, chunk_text, embedding) VALUES ($1, $2, $3)',
      [docId, `This is a mock indexed text block for ${title}`, dummyEmbedding]
    );
    
    res.json({ success: true, id: docId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MOCK: Re-index Knowledge Base
router.post('/reindex', async (req, res) => {
  try {
    // Normally this would trigger node scripts/seed_embeddings.js via child_process
    // Or call a specialized service
    setTimeout(() => {
      console.log('Re-indexing complete.');
    }, 2000);
    res.json({ success: true, message: "Re-indexing started in the background." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

