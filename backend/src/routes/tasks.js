import express from 'express';
import db from '../database/index.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Mock SCE Activities fallback
const MOCK_SCE_ACTIVITIES = [
  { id: 1, title: 'Hackwell 2026 24-Hour Hackathon', category: 'Hackathon', activity_type: 'event', venue: 'IT Block Lab 3', date: '2026-08-15', status: 'upcoming' },
  { id: 2, title: 'Smart India Hackathon Internal Selection', category: 'Hackathon', activity_type: 'event', venue: 'Main Auditorium', date: '2026-08-20', status: 'upcoming' },
  { id: 3, title: 'Google x SARA AI & Robotics Workshop', category: 'Workshop', activity_type: 'event', venue: 'ECE Seminar Hall', date: '2026-08-05', status: 'upcoming' },
  { id: 4, title: 'Symphony 2026 Cultural Fest', category: 'College Event', activity_type: 'event', venue: 'SCE Open Air Theatre', date: '2026-09-10', status: 'upcoming' },
  { id: 5, title: 'Coding Ninjas SCE Student Chapter', category: 'Club Registration', activity_type: 'club', venue: 'CSE Department Lab 1', date: null, status: 'active' },
  { id: 6, title: 'IEEE Student Branch & Robotics Society', category: 'Club Registration', activity_type: 'club', venue: 'ECE Lab 2', date: null, status: 'active' },
  { id: 7, title: 'IETE Students Forum', category: 'Club Registration', activity_type: 'club', venue: 'ECE Block', date: null, status: 'active' },
  { id: 8, title: 'IEI Engineering Association', category: 'Club Registration', activity_type: 'club', venue: 'Mechanical Block', date: null, status: 'active' },
  { id: 9, title: 'NSS Campus Cleanliness & Blood Donation Drive', category: 'NSS Activity', activity_type: 'club', venue: 'College Ground', date: '2026-08-12', status: 'active' },
  { id: 10, title: 'SCE Anti-Ragging & Welfare Committee', category: 'Committee', activity_type: 'committee', venue: 'Main Admin Block', date: null, status: 'active' },
  { id: 11, title: 'First-Year Academic Orientation & Mentor Meeting', category: 'Academic', activity_type: 'event', venue: 'MBA Block Auditorium', date: '2026-07-30', status: 'upcoming' }
];

// Memory store fallback for tasks when DB is unconfigured
let MOCK_STUDENT_TASKS = [
  {
    id: 101,
    student_id: 1,
    task_type: 'personal_task',
    title: 'Complete Mathematics-I Assignment 2',
    description: 'Solve problems on Calculus and Differential Equations.',
    status: 'pending',
    priority: 'high',
    category: 'Academic',
    due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    due_time: '17:00',
    reminder: '1 hour before',
    notes: 'Reference Chapter 4 in textbook',
    color: '#1B4DA6',
    icon: 'assignment',
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 102,
    student_id: 1,
    task_type: 'college_activity',
    title: 'Hackwell 2026 24-Hour Hackathon Registration',
    description: 'Linked Event: Hackwell 2026 at IT Block Lab 3',
    status: 'pending',
    priority: 'high',
    category: 'Hackathon',
    due_date: '2026-08-15',
    color: '#7C3AED',
    icon: 'event',
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Helper: Run DB query with fallback
const safeDbCall = async (dbQueryFn, fallbackFn) => {
  try {
    if (!process.env.DATABASE_URL) {
      if (fallbackFn) return await fallbackFn();
      throw new Error("DATABASE_URL is not set in environment variables.");
    }
    return await dbQueryFn();
  } catch (error) {
    console.warn("Task API DB Warning, switching to memory fallback:", error.message);
    if (fallbackFn) return await fallbackFn();
    throw error;
  }
};

/**
 * 1. GET /api/tasks
 * Fetch all tasks for authenticated student
 */
router.get('/', authenticateToken, async (req, res) => {
  const studentId = req.user?.userId || 1;
  const { search, priority, status, category, task_type, include_archived, sort_by } = req.query;

  try {
    const tasks = await safeDbCall(
      async () => {
        await db.query(
          `UPDATE student_tasks 
           SET status = 'overdue', updated_at = NOW() 
           WHERE student_id = $1 AND status = 'pending' AND due_date < CURRENT_DATE`,
          [studentId]
        );

        let sql = `
          SELECT 
            t.*,
            m.activity_id AS mapped_activity_id,
            m.activity_type AS mapped_activity_type,
            m.original_title,
            m.original_category,
            m.original_venue,
            m.original_date
          FROM student_tasks t
          LEFT JOIN student_task_activity_mapping m ON t.id = m.task_id
          WHERE t.student_id = $1
        `;
        const params = [studentId];
        let paramIdx = 2;

        if (include_archived !== 'true') {
          sql += ` AND t.is_archived = false`;
        }

        if (status && status !== 'all') {
          sql += ` AND t.status = $${paramIdx++}`;
          params.push(status);
        }

        if (category && category !== 'all') {
          sql += ` AND t.category = $${paramIdx++}`;
          params.push(category);
        }

        if (priority && priority !== 'all') {
          sql += ` AND t.priority = $${paramIdx++}`;
          params.push(priority);
        }

        if (task_type && task_type !== 'all') {
          sql += ` AND t.task_type = $${paramIdx++}`;
          params.push(task_type);
        }

        if (search && search.trim() !== '') {
          sql += ` AND (LOWER(t.title) LIKE $${paramIdx} OR LOWER(t.description) LIKE $${paramIdx} OR LOWER(t.notes) LIKE $${paramIdx})`;
          params.push(`%${search.trim().toLowerCase()}%`);
          paramIdx++;
        }

        sql += ` ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC`;
        const result = await db.query(sql, params);
        return result.rows;
      },
      async () => {
        let filtered = MOCK_STUDENT_TASKS.filter(t => t.student_id === studentId);
        if (include_archived !== 'true') filtered = filtered.filter(t => !t.is_archived);
        if (status && status !== 'all') filtered = filtered.filter(t => t.status === status);
        if (category && category !== 'all') filtered = filtered.filter(t => t.category === category);
        if (priority && priority !== 'all') filtered = filtered.filter(t => t.priority === priority);
        if (task_type && task_type !== 'all') filtered = filtered.filter(t => t.task_type === task_type);
        if (search && search.trim() !== '') {
          const q = search.trim().toLowerCase();
          filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
        }
        return filtered;
      }
    );

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. GET /api/tasks/summary
 */
router.get('/summary', authenticateToken, async (req, res) => {
  const studentId = req.user?.userId || 1;

  try {
    const summary = await safeDbCall(
      async () => {
        const statsRes = await db.query(
          `SELECT 
            COUNT(*) FILTER (WHERE is_archived = false) AS total,
            COUNT(*) FILTER (WHERE status = 'completed' AND is_archived = false) AS completed,
            COUNT(*) FILTER (WHERE status = 'pending' AND is_archived = false) AS pending,
            COUNT(*) FILTER (WHERE status = 'overdue' AND is_archived = false) AS overdue,
            COUNT(*) FILTER (WHERE due_date = CURRENT_DATE AND is_archived = false) AS due_today
           FROM student_tasks
           WHERE student_id = $1`,
          [studentId]
        );

        const stats = statsRes.rows[0];
        const total = parseInt(stats.total || 0, 10);
        const completed = parseInt(stats.completed || 0, 10);
        const pending = parseInt(stats.pending || 0, 10);
        const overdue = parseInt(stats.overdue || 0, 10);
        const dueToday = parseInt(stats.due_today || 0, 10);

        const previewRes = await db.query(
          `SELECT id, title, category, priority, due_date, due_time, color, icon, task_type
           FROM student_tasks
           WHERE student_id = $1 AND status IN ('pending', 'in_progress', 'overdue') AND is_archived = false
           ORDER BY CASE WHEN due_date = CURRENT_DATE THEN 0 ELSE 1 END, due_date ASC NULLS LAST, created_at DESC
           LIMIT 3`,
          [studentId]
        );

        return {
          total,
          pending,
          completed,
          overdue,
          dueToday,
          progressPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          previewTasks: previewRes.rows
        };
      },
      async () => {
        const list = MOCK_STUDENT_TASKS.filter(t => t.student_id === studentId && !t.is_archived);
        const total = list.length;
        const completed = list.filter(t => t.status === 'completed').length;
        const pending = list.filter(t => t.status === 'pending').length;
        const overdue = list.filter(t => t.status === 'overdue').length;
        const today = new Date().toISOString().split('T')[0];
        const dueToday = list.filter(t => t.due_date === today).length;

        return {
          total,
          pending,
          completed,
          overdue,
          dueToday,
          progressPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          previewTasks: list.slice(0, 3)
        };
      }
    );

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. GET /api/tasks/available-activities
 * Fetch active records across Events, Clubs, Committees, Workshops, Hackathons, NSS
 */
router.get('/available-activities', authenticateToken, async (req, res) => {
  try {
    const activities = await safeDbCall(
      async () => {
        const [eventsRes, clubsRes, committeesRes] = await Promise.all([
          db.query(`SELECT id, name AS title, 'Event' AS category, 'event' AS activity_type, location_text AS venue, event_date AS date, status FROM events ORDER BY created_at DESC`),
          db.query(`SELECT id, name AS title, 'Club' AS category, 'club' AS activity_type, location_text AS venue, created_at AS date, status FROM clubs ORDER BY name ASC`),
          db.query(`SELECT id, name AS title, 'Committee' AS category, 'committee' AS activity_type, 'Main Campus' AS venue, created_at AS date, status FROM committees ORDER BY name ASC`)
        ]);

        const events = eventsRes.rows.map(e => ({
          ...e,
          is_hackathon: e.title?.toLowerCase().includes('hackathon'),
          is_workshop: e.title?.toLowerCase().includes('workshop'),
          category: e.title?.toLowerCase().includes('hackathon') ? 'Hackathon' : e.title?.toLowerCase().includes('workshop') ? 'Workshop' : 'College Event'
        }));

        const clubs = clubsRes.rows.map(c => ({
          ...c,
          category: c.title === 'NSS' ? 'NSS Activity' : 'Club Registration'
        }));

        const committees = committeesRes.rows;

        const dbList = [...events, ...clubs, ...committees];
        return dbList.length > 0 ? dbList : MOCK_SCE_ACTIVITIES;
      },
      async () => MOCK_SCE_ACTIVITIES
    );

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 4. POST /api/tasks
 * Create personal task or task linked to college activity
 */
router.post('/', authenticateToken, async (req, res) => {
  const studentId = req.user?.userId || 1;
  const {
    title,
    description,
    task_type = 'personal_task',
    activity_id,
    activity_type,
    priority = 'medium',
    category = 'General',
    due_date,
    due_time,
    reminder,
    notes,
    color = '#1B4DA6',
    icon = 'task_alt'
  } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Task title is required.' });
  }

  try {
    const newTask = await safeDbCall(
      async () => {
        const insertRes = await db.query(
          `INSERT INTO student_tasks (
            student_id, activity_id, activity_type, task_type, title, description,
            priority, category, due_date, due_time, reminder, notes, color, icon
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *`,
          [
            studentId,
            activity_id || null,
            activity_type || null,
            task_type,
            title.trim(),
            description || null,
            priority,
            category,
            due_date || null,
            due_time || null,
            reminder || null,
            notes || null,
            color,
            icon
          ]
        );

        const task = insertRes.rows[0];

        if (activity_id && activity_type) {
          await db.query(
            `INSERT INTO student_task_activity_mapping (
              task_id, activity_id, activity_type, original_title, original_category
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (task_id) DO NOTHING`,
            [task.id, activity_id, activity_type, title, category]
          );
        }

        return task;
      },
      async () => {
        const createdTask = {
          id: Date.now(),
          student_id: studentId,
          activity_id: activity_id || null,
          activity_type: activity_type || null,
          task_type,
          title: title.trim(),
          description: description || null,
          status: 'pending',
          priority,
          category,
          due_date: due_date || null,
          due_time: due_time || null,
          reminder: reminder || null,
          notes: notes || null,
          color,
          icon,
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        MOCK_STUDENT_TASKS.unshift(createdTask);
        return createdTask;
      }
    );

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 5. PUT /api/tasks/:id
 * Edit existing task
 */
router.put('/:id', authenticateToken, async (req, res) => {
  const studentId = req.user?.userId || 1;
  const taskId = parseInt(req.params.id, 10);
  const { title, description, priority, category, due_date, due_time, reminder, notes, color, icon } = req.body;

  try {
    const updatedTask = await safeDbCall(
      async () => {
        const updateRes = await db.query(
          `UPDATE student_tasks
           SET title = COALESCE($1, title),
               description = COALESCE($2, description),
               priority = COALESCE($3, priority),
               category = COALESCE($4, category),
               due_date = $5,
               due_time = $6,
               reminder = $7,
               notes = COALESCE($8, notes),
               color = COALESCE($9, color),
               icon = COALESCE($10, icon),
               updated_at = NOW()
           WHERE id = $11 AND student_id = $12
           RETURNING *`,
          [title, description, priority, category, due_date || null, due_time || null, reminder || null, notes, color, icon, taskId, studentId]
        );
        return updateRes.rows[0];
      },
      async () => {
        const task = MOCK_STUDENT_TASKS.find(t => t.id === taskId);
        if (!task) return null;
        if (title) task.title = title;
        if (description !== undefined) task.description = description;
        if (priority) task.priority = priority;
        if (category) task.category = category;
        task.due_date = due_date || null;
        task.due_time = due_time || null;
        task.reminder = reminder || null;
        if (notes !== undefined) task.notes = notes;
        if (color) task.color = color;
        if (icon) task.icon = icon;
        task.updated_at = new Date().toISOString();
        return task;
      }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found or unauthorized.' });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 6. PATCH /api/tasks/:id/status
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const studentId = req.user?.userId || 1;
  const taskId = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  try {
    const updatedTask = await safeDbCall(
      async () => {
        const completedAt = status === 'completed' ? new Date() : null;
        const updateRes = await db.query(
          `UPDATE student_tasks
           SET status = $1, completed_at = $2, updated_at = NOW()
           WHERE id = $3 AND student_id = $4
           RETURNING *`,
          [status, completedAt, taskId, studentId]
        );
        return updateRes.rows[0];
      },
      async () => {
        const task = MOCK_STUDENT_TASKS.find(t => t.id === taskId);
        if (!task) return null;
        task.status = status;
        task.updated_at = new Date().toISOString();
        return task;
      }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found or unauthorized.' });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 7. PATCH /api/tasks/:id/archive
 */
router.patch('/:id/archive', authenticateToken, async (req, res) => {
  const studentId = req.user?.userId || 1;
  const taskId = parseInt(req.params.id, 10);
  const { is_archived } = req.body;

  try {
    const updated = await safeDbCall(
      async () => {
        const res = await db.query(
          `UPDATE student_tasks
           SET is_archived = $1, updated_at = NOW()
           WHERE id = $2 AND student_id = $3
           RETURNING *`,
          [!!is_archived, taskId, studentId]
        );
        return res.rows[0];
      },
      async () => {
        const task = MOCK_STUDENT_TASKS.find(t => t.id === taskId);
        if (!task) return null;
        task.is_archived = !!is_archived;
        return task;
      }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Task not found or unauthorized.' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 8. DELETE /api/tasks/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  const studentId = req.user?.userId || 1;
  const taskId = parseInt(req.params.id, 10);

  try {
    const deleted = await safeDbCall(
      async () => {
        const delRes = await db.query(`DELETE FROM student_tasks WHERE id = $1 AND student_id = $2 RETURNING id`, [taskId, studentId]);
        return delRes.rows.length > 0;
      },
      async () => {
        const idx = MOCK_STUDENT_TASKS.findIndex(t => t.id === taskId);
        if (idx !== -1) {
          MOCK_STUDENT_TASKS.splice(idx, 1);
          return true;
        }
        return false;
      }
    );

    if (!deleted) {
      return res.status(404).json({ error: 'Task not found or unauthorized.' });
    }

    res.json({ success: true, id: taskId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
