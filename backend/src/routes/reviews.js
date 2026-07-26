import express from 'express';
import db from '../database/index.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const APPROVED_CATEGORIES = [
  'Overall Experience',
  'AI Assistant',
  'Campus Navigation',
  'Study Hub',
  'Student Dashboard',
  'Events',
  'Clubs',
  'Senior Connect',
  'Bus Routes',
  'General Feedback'
];

/**
 * 1. POST /api/reviews
 * Creates a new review for the logged-in student.
 * Enforces: One review per student constraint.
 */
router.post('/', authenticateToken, async (req, res) => {
  const studentId = req.user.id;
  const { rating, title, description, category, visibility = 'public' } = req.body;

  // Enforce one review per student limit
  try {
    const existing = await db.query('SELECT id FROM reviews WHERE student_id = $1', [studentId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You have already submitted a review. You can edit your existing review instead.' });
    }

    // Validation
    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    if (!title || title.trim().length < 3 || title.trim().length > 100) {
      return res.status(400).json({ error: 'Title must be between 3 and 100 characters.' });
    }

    if (!description || description.trim().length < 10 || description.trim().length > 1000) {
      return res.status(400).json({ error: 'Review text must be between 10 and 1000 characters.' });
    }

    if (!APPROVED_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid review category selected.' });
    }

    if (!['public', 'anonymous'].includes(visibility)) {
      return res.status(400).json({ error: 'Visibility must be either public or anonymous.' });
    }

    // Fetch student profile details from users and departments tables
    const userRes = await db.query(
      `SELECT u.full_name, u.semester, d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [studentId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const student = userRes.rows[0];
    const studentName = student.full_name || 'Verified Student';
    const department = student.department_name || 'General';
    // Calculate year from semester (defaults to 1st year)
    const semester = student.semester || 1;
    const year = Math.ceil(semester / 2) || 1;

    // Insert review
    const result = await db.query(
      `INSERT INTO reviews (
        student_id, student_name, department, year, rating, title, description, category, visibility, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
       RETURNING *`,
      [studentId, studentName, department, year, ratingVal, title.trim(), description.trim(), category, visibility]
    );

    res.status(201).json({ success: true, review: result.rows[0] });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. GET /api/reviews/my
 * Fetches the logged-in student's review, if any.
 */
router.get('/my', authenticateToken, async (req, res) => {
  const studentId = req.user.id;
  try {
    const result = await db.query('SELECT * FROM reviews WHERE student_id = $1', [studentId]);
    if (result.rows.length === 0) {
      return res.json({ success: true, review: null });
    }
    res.json({ success: true, review: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. PUT /api/reviews/my
 * Updates the logged-in student's review.
 * Enforces: Re-modulates status to 'pending'.
 */
router.put('/my', authenticateToken, async (req, res) => {
  const studentId = req.user.id;
  const { rating, title, description, category, visibility } = req.body;

  try {
    const existing = await db.query('SELECT id FROM reviews WHERE student_id = $1', [studentId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'You have not submitted a review yet.' });
    }

    // Validation
    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    if (!title || title.trim().length < 3 || title.trim().length > 100) {
      return res.status(400).json({ error: 'Title must be between 3 and 100 characters.' });
    }

    if (!description || description.trim().length < 10 || description.trim().length > 1000) {
      return res.status(400).json({ error: 'Review text must be between 10 and 1000 characters.' });
    }

    if (!APPROVED_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid review category.' });
    }

    if (!['public', 'anonymous'].includes(visibility)) {
      return res.status(400).json({ error: 'Visibility must be public or anonymous.' });
    }

    // Update and reset status to pending
    const result = await db.query(
      `UPDATE reviews 
       SET rating = $1, title = $2, description = $3, category = $4, visibility = $5, status = 'pending', updated_at = CURRENT_TIMESTAMP
       WHERE student_id = $6
       RETURNING *`,
      [ratingVal, title.trim(), description.trim(), category, visibility, studentId]
    );

    res.json({ success: true, review: result.rows[0] });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 4. DELETE /api/reviews/my
 * Deletes the student's review.
 */
router.delete('/my', authenticateToken, async (req, res) => {
  const studentId = req.user.id;
  try {
    const result = await db.query('DELETE FROM reviews WHERE student_id = $1 RETURNING id', [studentId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No review found to delete.' });
    }
    res.json({ success: true, message: 'Review deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 5. POST /api/reviews/:id/helpful
 * Toggles a "Helpful" vote on a review.
 */
router.post('/:id/helpful', authenticateToken, async (req, res) => {
  const studentId = req.user.id;
  const reviewId = parseInt(req.params.id, 10);

  if (isNaN(reviewId)) {
    return res.status(400).json({ error: 'Invalid review ID.' });
  }

  try {
    // Check if review exists
    const reviewRes = await db.query('SELECT id, student_id FROM reviews WHERE id = $1', [reviewId]);
    if (reviewRes.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    // Students cannot mark their own review as helpful
    if (reviewRes.rows[0].student_id === studentId) {
      return res.status(400).json({ error: 'You cannot vote on your own review.' });
    }

    // Toggle logic
    const voteCheck = await db.query(
      'SELECT 1 FROM review_helpful_votes WHERE review_id = $1 AND student_id = $2',
      [reviewId, studentId]
    );

    let helpfulDelta = 0;
    let hasVoted = false;

    if (voteCheck.rows.length > 0) {
      // Remove helpful vote
      await db.query(
        'DELETE FROM review_helpful_votes WHERE review_id = $1 AND student_id = $2',
        [reviewId, studentId]
      );
      helpfulDelta = -1;
    } else {
      // Add helpful vote
      await db.query(
        'INSERT INTO review_helpful_votes (review_id, student_id) VALUES ($1, $2)',
        [reviewId, studentId]
      );
      helpfulDelta = 1;
      hasVoted = true;
    }

    // Update helpful count on the reviews table
    const result = await db.query(
      'UPDATE reviews SET helpful_count = GREATEST(0, helpful_count + $1) WHERE id = $2 RETURNING helpful_count',
      [helpfulDelta, reviewId]
    );

    res.json({ success: true, helpfulCount: result.rows[0].helpful_count, hasVoted });
  } catch (error) {
    console.error('Error toggling helpful vote:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 6. POST /api/reviews/:id/report
 * Submits a report for a review.
 */
router.post('/:id/report', authenticateToken, async (req, res) => {
  const studentId = req.user.id;
  const reviewId = parseInt(req.params.id, 10);
  const { reason, details } = req.body;

  if (isNaN(reviewId)) {
    return res.status(400).json({ error: 'Invalid review ID.' });
  }

  const validReasons = ['Spam', 'Abusive', 'Fake', 'Offensive', 'Other'];
  if (!validReasons.includes(reason)) {
    return res.status(400).json({ error: 'Invalid report reason.' });
  }

  try {
    const reviewRes = await db.query('SELECT id FROM reviews WHERE id = $1', [reviewId]);
    if (reviewRes.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    // Check duplicate report
    const existing = await db.query(
      'SELECT 1 FROM review_reports WHERE review_id = $1 AND student_id = $2',
      [reviewId, studentId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You have already reported this review.' });
    }

    // Insert report
    await db.query(
      'INSERT INTO review_reports (review_id, student_id, reason, details) VALUES ($1, $2, $3, $4)',
      [reviewId, studentId, reason, details || null]
    );

    // Increment report count on reviews
    await db.query('UPDATE reviews SET report_count = report_count + 1 WHERE id = $1', [reviewId]);

    res.json({ success: true, message: 'Review reported successfully for admin moderation.' });
  } catch (error) {
    console.error('Error reporting review:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 7. GET /api/reviews/public
 * Returns approved and public reviews for the welcome page.
 * Returns overall statistics: total reviews, average rating, and category breakdown.
 */
router.get('/public', async (req, res) => {
  try {
    // 1. Fetch public approved reviews
    const reviewsRes = await db.query(
      `SELECT id, student_name, department, year, rating, title, description, category, visibility, helpful_count, created_at, featured, is_pinned
       FROM reviews 
       WHERE status = 'approved' AND visibility = 'public'
       ORDER BY is_pinned DESC, created_at DESC`
    );

    // For anonymous ones, hide student_name
    const reviews = reviewsRes.rows.map(r => ({
      ...r,
      student_name: r.visibility === 'anonymous' ? 'Anonymous Student' : r.student_name
    }));

    // 2. Fetch overall metrics
    const statsRes = await db.query(
      `SELECT 
         COUNT(*)::integer AS total_count,
         COALESCE(AVG(rating), 0)::numeric AS avg_rating
       FROM reviews 
       WHERE status = 'approved'`
    );

    const totalCount = statsRes.rows[0]?.total_count || 0;
    const avgRating = parseFloat(statsRes.rows[0]?.avg_rating || 0).toFixed(1);

    // 3. Fetch category breakdown
    const categoryRes = await db.query(
      `SELECT 
         category,
         COUNT(*)::integer AS count,
         AVG(rating)::numeric AS avg_rating
       FROM reviews 
       WHERE status = 'approved'
       GROUP BY category`
    );

    const categoriesBreakdown = categoryRes.rows.map(c => ({
      category: c.category,
      count: c.count,
      avg_rating: parseFloat(c.avg_rating || 0).toFixed(1)
    }));

    res.json({
      success: true,
      reviews,
      stats: {
        totalReviews: totalCount,
        averageRating: parseFloat(avgRating),
        categories: categoriesBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching public reviews:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
