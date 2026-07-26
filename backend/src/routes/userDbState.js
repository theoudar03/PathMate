import express from 'express';
import db from '../database/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper to log activities
const logUserActivity = async (userId, actionText, icon = 'info') => {
  try {
    await db.query(
      'INSERT INTO activity_timeline (user_id, action_text, icon) VALUES ($1, $2, $3)',
      [userId, actionText, icon]
    );
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

// Helper to grant achievements
const checkAndGrantAchievement = async (userId, achievementId, title, description, badgeIcon) => {
  try {
    await db.query(
      `INSERT INTO student_achievements (user_id, achievement_id, title, description, badge_icon)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, achievement_id) DO NOTHING`,
      [userId, achievementId, title, description, badgeIcon]
    );
  } catch (err) {
    console.error('Failed to grant achievement:', err.message);
  }
};

/**
 * GET /api/user-state
 * Fetches notice reads, bookmarks, checklists, and preferences for the logged-in user.
 */
router.get('/user-state', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const readsRes = await db.query('SELECT notice_id FROM notice_reads WHERE user_id = $1', [userId]);
    const bookmarksRes = await db.query('SELECT notice_id FROM notice_bookmarks WHERE user_id = $1', [userId]);
    const checklistRes = await db.query('SELECT task_id, is_done FROM fresher_checklist WHERE user_id = $1', [userId]);
    const prefsRes = await db.query('SELECT key, value FROM user_preferences WHERE user_id = $1', [userId]);

    const readNotices = readsRes.rows.map(r => r.notice_id);
    const bookmarkedNotices = bookmarksRes.rows.map(r => r.notice_id);

    const fresherChecklist = {};
    checklistRes.rows.forEach(r => {
      fresherChecklist[r.task_id] = r.is_done;
    });

    const preferences = {};
    prefsRes.rows.forEach(r => {
      try {
        preferences[r.key] = JSON.parse(r.value);
      } catch {
        preferences[r.key] = r.value;
      }
    });

    // Also dynamic check: if user logged in today, grant "Daily Login" achievement
    await checkAndGrantAchievement(
      userId, 
      'daily_login', 
      'Daily Login', 
      'Logged in to PathMate to check academic schedules.', 
      'login'
    );

    res.json({
      success: true,
      readNotices,
      bookmarkedNotices,
      fresherChecklist,
      preferences
    });
  } catch (error) {
    console.error('Failed to fetch user state:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/user-state/read-notice
 * Persistently logs a read notice action.
 */
router.post('/user-state/read-notice', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { noticeId } = req.body;

  if (!noticeId) {
    return res.status(400).json({ error: 'noticeId is required' });
  }

  try {
    await db.query(
      'INSERT INTO notice_reads (user_id, notice_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, noticeId]
    );

    // Get notice title for logs
    const noticeRes = await db.query('SELECT title FROM notices WHERE id = $1', [noticeId]);
    const title = noticeRes.rows[0]?.title || `Notice #${noticeId}`;

    await logUserActivity(userId, `Read Notice: ${title}`, 'drafts');

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save notice read status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/user-state/bookmark-notice
 * Toggles a notice bookmark.
 */
router.post('/user-state/bookmark-notice', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { noticeId, action } = req.body; // 'bookmark' or 'unbookmark'

  if (!noticeId) {
    return res.status(400).json({ error: 'noticeId is required' });
  }

  try {
    const noticeRes = await db.query('SELECT title FROM notices WHERE id = $1', [noticeId]);
    const title = noticeRes.rows[0]?.title || `Notice #${noticeId}`;

    if (action === 'bookmark') {
      await db.query(
        'INSERT INTO notice_bookmarks (user_id, notice_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, noticeId]
      );
      await logUserActivity(userId, `Bookmarked Notice: ${title}`, 'bookmark');
    } else {
      await db.query(
        'DELETE FROM notice_bookmarks WHERE user_id = $1 AND notice_id = $2',
        [userId, noticeId]
      );
      await logUserActivity(userId, `Removed Bookmark: ${title}`, 'bookmark_border');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to toggle notice bookmark:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/user-state/checklist
 * Completes or resets a onboarding checklist item.
 */
router.post('/user-state/checklist', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { taskId, isDone } = req.body;

  if (!taskId) {
    return res.status(400).json({ error: 'taskId is required' });
  }

  try {
    await db.query(
      `INSERT INTO fresher_checklist (user_id, task_id, is_done, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, task_id)
       DO UPDATE SET is_done = EXCLUDED.is_done, updated_at = NOW()`,
      [userId, taskId, isDone]
    );

    const taskTitles = {
      docs: 'Document Verification',
      mentor: 'Mentor Introductions',
      campus: 'Campus Exploration Map',
      clubs: 'Student Clubs Orientation',
      library: 'Central Library Biometrics',
      class: 'Classroom Navigation Finder'
    };

    const title = taskTitles[taskId] || taskId;
    await logUserActivity(
      userId, 
      isDone ? `Completed Setup: ${title}` : `Undid Setup: ${title}`, 
      isDone ? 'task_alt' : 'restart_alt'
    );

    // Achievements calculation
    if (isDone) {
      // Check if all 6 fresher tasks are completed
      const countRes = await db.query(
        "SELECT COUNT(*) FROM fresher_checklist WHERE user_id = $1 AND is_done = true", 
        [userId]
      );
      const doneCount = parseInt(countRes.rows[0]?.count || 0);
      if (doneCount === 6) {
        await checkAndGrantAchievement(
          userId,
          'campus_explorer',
          'Campus Explorer',
          'Successfully completed all fresher orientation onboarding checklist steps.',
          'explore'
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save checklist state:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/user-state/preference
 * Saves user personalization preferences (e.g. customized dashboard configurations).
 */
router.post('/user-state/preference', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { key, value } = req.body;

  if (!key) {
    return res.status(400).json({ error: 'key is required' });
  }

  try {
    const valueStr = typeof value === 'object' ? JSON.stringify(value) : value;

    await db.query(
      `INSERT INTO user_preferences (user_id, key, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, key)
       DO UPDATE SET value = EXCLUDED.value`,
      [userId, key, valueStr]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save user preference:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/activity-timeline/:userId
 * Returns personal student activity history feed logs.
 */
router.get('/activity-timeline/:userId', authenticateToken, async (req, res) => {
  const userId = req.params.userId;
  
  // Guard access to self
  if (parseInt(req.user.id) !== parseInt(userId)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  try {
    const logs = await db.query(
      'SELECT action_text as title, icon, created_at FROM activity_timeline WHERE user_id = $1 ORDER BY created_at DESC LIMIT 25',
      [userId]
    );
    res.json(logs.rows);
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/achievements/:userId
 * Returns earned student badges.
 */
router.get('/achievements/:userId', authenticateToken, async (req, res) => {
  const userId = req.params.userId;

  // Guard access to self
  if (parseInt(req.user.id) !== parseInt(userId)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  try {
    const badges = await db.query(
      'SELECT achievement_id, title, description, badge_icon, earned_at FROM student_achievements WHERE user_id = $1 ORDER BY earned_at DESC',
      [userId]
    );
    res.json(badges.rows);
  } catch (error) {
    console.error('Failed to fetch achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/state/notifications
 * Fetches notifications for the logged-in student.
 */
router.get('/notifications', authenticateToken, async (req, res) => {
  const studentId = req.user.id;
  try {
    const result = await db.query(
      'SELECT * FROM student_notifications WHERE student_id = $1 ORDER BY created_at DESC LIMIT 50',
      [studentId]
    );
    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    console.error('Failed to fetch student notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/state/notifications/:id/read
 * Marks a notification as read.
 */
router.post('/notifications/:id/read', authenticateToken, async (req, res) => {
  const studentId = req.user.id;
  const notificationId = req.params.id;

  try {
    const result = await db.query(
      'UPDATE student_notifications SET is_read = true WHERE id = $1 AND student_id = $2 RETURNING id',
      [notificationId, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found or access denied.' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
