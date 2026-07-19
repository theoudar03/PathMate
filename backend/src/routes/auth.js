import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/index.js';
const MOCK_STORE = {};
import { mapTextToInterests } from '../services/gemini.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pathmate-secret';

// Helper: Run DB query
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

// --- Username & Password format checkers ---
const validateUsernameFormat = (username) => {
  if (!username) return 'Username is required';
  if (username.length < 4 || username.length > 20) return 'Username must be between 4 and 20 characters';
  if (!/^[a-z0-9_.]+$/.test(username)) return 'Username can only contain lowercase letters, numbers, underscores, and periods';
  if (/^[0-9]/.test(username)) return 'Username cannot start with a number';
  if (/[._]$/.test(username)) return 'Username cannot end with a period or underscore';
  if (/\.\./.test(username) || /__/.test(username) || /\._/.test(username) || /_\./.test(username)) {
    return 'Username cannot contain consecutive periods or underscores';
  }
  const reserved = ['admin', 'administrator', 'support', 'system', 'sce', 'pathmate', 'root'];
  if (reserved.includes(username.toLowerCase())) return 'This username is reserved';
  return null;
};

const validatePasswordFormat = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  if (!hasUpper || !hasLower || !hasNumbers || !hasSpecial) {
    return 'Password must contain uppercase, lowercase, numbers, and special characters';
  }
  return null;
};

// --- Middleware: Verify Auth Token ---
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Authentication token missing.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // contains userId and username
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token.' });
  }
};

// Helper: Fetch interest labels for a user
const getUserInterests = async (userId) => {
  return await safeDbCall(
    async () => {
      const res = await db.query(
        `SELECT i.label FROM user_interests ui
         JOIN interests i ON ui.interest_id = i.id
         WHERE ui.user_id = $1`,
        [userId]
      );
      return res.rows.map(r => r.label);
    },
    async () => {
      return MOCK_STORE.userInterests
        .filter(ui => ui.user_id === userId)
        .map(ui => {
          const interest = MOCK_STORE.interests.find(i => i.id === ui.interest_id);
          return interest ? interest.label : null;
        })
        .filter(Boolean);
    }
  );
};

// --- ROUTES ---

/**
 * 1. GET /auth/check-username
 * Checks if username is format-valid and available
 */
router.get('/check-username', async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ success: false, error: 'Username parameter is required' });
  }

  const formatError = validateUsernameFormat(username);
  if (formatError) {
    return res.json({ success: true, available: false, reason: formatError });
  }

  try {
    const isTaken = await safeDbCall(
      async () => {
        const checkRes = await db.query('SELECT COUNT(*) FROM users WHERE LOWER(username) = LOWER($1)', [username]);
        return parseInt(checkRes.rows[0].count) > 0;
      },
      async () => {
        return MOCK_STORE.users.some(u => u.username?.toLowerCase() === username.toLowerCase());
      }
    );

    if (isTaken) {
      return res.json({ success: true, available: false, reason: 'Username already taken' });
    }

    return res.json({ success: true, available: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 2. POST /auth/register
 * Onboards first-time student, validates username and password, and stores user in Postgres
 */
router.post('/register', async (req, res) => {
  const {
    full_name,
    roll_number,
    email,
    preferred_language = 'en',
    hosteller = false,
    department,
    interests = [],
    custom_notes,
    hostel_block,
    username,
    password
  } = req.body;

  if (!full_name || !department) {
    return res.status(400).json({ error: 'Full name and department are required' });
  }

  const usernameError = validateUsernameFormat(username);
  if (usernameError) {
    return res.status(400).json({ error: usernameError });
  }

  const passwordError = validatePasswordFormat(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  try {
    // Check uniqueness
    const usernameTaken = await safeDbCall(
      async () => {
        const checkRes = await db.query('SELECT COUNT(*) FROM users WHERE LOWER(username) = LOWER($1)', [username]);
        return parseInt(checkRes.rows[0].count) > 0;
      },
      async () => {
        return MOCK_STORE.users.some(u => u.username?.toLowerCase() === username.toLowerCase());
      }
    );

    if (usernameTaken) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await safeDbCall(
      async () => {
        // Resolve department ID
        const deptRes = await db.query('SELECT id FROM departments WHERE name = $1 OR full_name = $1', [department]);
        const deptId = deptRes.rows[0]?.id || 1;

        // Save User
        const userRes = await db.query(
          `INSERT INTO users (full_name, name, roll_number, email, preferred_language, language_pref, hosteller, stay_type, department_id, username, password_hash, is_first_login, hostel_block, custom_notes)
           VALUES ($1, $1, $2, $3, $4, $4, $5, $6, $7, $8, $9, false, $10, $11) RETURNING id`,
          [full_name, roll_number, email, preferred_language, hosteller, hosteller ? 'hostel' : 'day_scholar', deptId, username, passwordHash, hostel_block, custom_notes]
        );
        const userId = userRes.rows[0].id;

        // Map interests using Gemini
        const interestsRes = await db.query('SELECT id, label FROM interests');
        const dbInterests = interestsRes.rows;

        let mappedInterestIds = [];
        if (custom_notes) {
          const geminiResult = await mapTextToInterests(custom_notes, dbInterests);
          mappedInterestIds = geminiResult.interestIds || [];
        }

        const selectedInterestIds = dbInterests
          .filter(i => interests.includes(i.label))
          .map(i => i.id);

        const allInterestIds = Array.from(new Set([...selectedInterestIds, ...mappedInterestIds]));

        for (const interestId of allInterestIds) {
          await db.query(
            'INSERT INTO user_interests (user_id, interest_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, interestId]
          );
        }

        // Initialize roommate opt-in
        await db.query('INSERT INTO roommate_opt_in (user_id, is_visible) VALUES ($1, false)', [userId]);

        return { userId };
      },
      async () => {
        // Fallback Mock Register
        const dept = MOCK_STORE.departments.find(d => d.name === department || d.full_name === department) || MOCK_STORE.departments[0];
        const userId = MOCK_STORE.users.length + 1;

        const newUser = {
          id: userId,
          full_name,
          name: full_name,
          roll_number,
          email,
          preferred_language,
          language_pref: preferred_language,
          hosteller,
          stay_type: hosteller ? 'hostel' : 'day_scholar',
          hostel_block,
          department_id: dept.id,
          username,
          password_hash: passwordHash,
          is_first_login: false,
          custom_notes,
          created_at: new Date().toISOString()
        };

        MOCK_STORE.users.push(newUser);

        // Map mock interests
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

        return { userId };
      }
    );

    const userInterests = await getUserInterests(result.userId);
    const token = jwt.sign({ userId: result.userId, username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: result.userId,
        full_name,
        username,
        roll_number,
        email,
        preferred_language,
        hosteller,
        department,
        is_first_login: false,
        interests: userInterests
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 2. POST /auth/login
 * Validates credentials against DB and returns a JWT token
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await safeDbCall(
      async () => {
        const userRes = await db.query(
          `SELECT u.id, u.username, u.password_hash, u.name, u.department_id, u.stay_type, u.hostel_block, u.language_pref, u.custom_notes, u.full_name, u.roll_number, u.email, u.preferred_language, u.hosteller, u.is_first_login, d.name as department_name FROM users u
           LEFT JOIN departments d ON u.department_id = d.id
           WHERE LOWER(u.username) = LOWER($1)`,
          [username]
        );
        return userRes.rows[0];
      },
      async () => {
        const mockUser = MOCK_STORE.users.find(u => u.username?.toLowerCase() === username.toLowerCase());
        if (mockUser) {
          const dept = MOCK_STORE.departments.find(d => d.id === mockUser.department_id);
          return { ...mockUser, department_name: dept?.name };
        }
        return null;
      }
    );

    // Maintain secure state: don't reveal if user does not exist
    if (!user) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    // Fetch user interests
    const userInterests = await getUserInterests(user.id);

    // Generate JWT
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name || user.name,
        username: user.username,
        roll_number: user.roll_number,
        email: user.email,
        preferred_language: user.preferred_language || user.language_pref,
        hosteller: user.hosteller || (user.stay_type === 'hostel'),
        department: user.department_name,
        is_first_login: user.is_first_login,
        interests: userInterests
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. POST /auth/change-password
 * Forces password change and turns off first login flag
 */
router.post('/change-password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  // Can be called authenticated or anonymous (for onboarding flow before login)
  let searchUsername = username;
  let searchUserId = null;

  // Extract from JWT if present
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const verified = jwt.verify(token, JWT_SECRET);
      searchUserId = verified.userId;
    } catch (err) {
      // Ignored for step 4 password change where token is not created yet
    }
  }

  if (!newPassword || (!currentPassword && !searchUserId)) {
    return res.status(400).json({ error: 'Missing current or new password details.' });
  }

  try {
    const user = await safeDbCall(
      async () => {
        let userRes;
        const columns = 'id, username, password_hash, name, department_id, stay_type, hostel_block, language_pref, custom_notes, full_name, roll_number, email, preferred_language, hosteller, is_first_login';
        if (searchUserId) {
          userRes = await db.query(`SELECT ${columns} FROM users WHERE id = $1`, [searchUserId]);
        } else {
          userRes = await db.query(`SELECT ${columns} FROM users WHERE LOWER(username) = LOWER($1)`, [searchUsername]);
        }
        return userRes.rows[0];
      },
      async () => {
        if (searchUserId) {
          return MOCK_STORE.users.find(u => u.id === searchUserId);
        } else {
          return MOCK_STORE.users.find(u => u.username?.toLowerCase() === searchUsername.toLowerCase());
        }
      }
    );

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Current password verification failed.' });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 12);

    // Save password change and toggle first login off
    await safeDbCall(
      async () => {
        await db.query(
          'UPDATE users SET password_hash = $1, is_first_login = false, updated_at = now() WHERE id = $2',
          [hashed, user.id]
        );
      },
      async () => {
        const u = MOCK_STORE.users.find(u => u.id === user.id);
        if (u) {
          u.password_hash = hashed;
          u.is_first_login = false;
        }
      }
    );

    // Fetch interests
    const userInterests = await getUserInterests(user.id);

    // Generate new JWT session
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Password changed successfully.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name || user.name,
        username: user.username,
        roll_number: user.roll_number,
        email: user.email,
        preferred_language: user.preferred_language || user.language_pref,
        hosteller: user.hosteller || (user.stay_type === 'hostel'),
        department: user.department_name,
        is_first_login: false,
        interests: userInterests
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 4. POST /auth/change-language
 * Updates preferred language for the authenticated user
 */
router.post('/change-language', authenticateToken, async (req, res) => {
  const { language } = req.body;
  if (!language || !['en', 'ta', 'hi'].includes(language)) {
    return res.status(400).json({ error: 'Valid language code (en, ta, hi) is required.' });
  }

  try {
    await safeDbCall(
      async () => {
        await db.query(
          'UPDATE users SET preferred_language = $1, language_pref = $1, updated_at = now() WHERE id = $2',
          [language, req.user.userId]
        );
      },
      async () => {
        const u = MOCK_STORE.users.find(u => u.id === req.user.userId);
        if (u) {
          u.preferred_language = language;
          u.language_pref = language;
        }
      }
    );

    res.json({ success: true, message: 'Language preference updated.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 5. POST /auth/logout
 * Dummy endpoint to standardise logout
 */
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

/**
 * 5. GET /auth/me
 * Retrieves current authenticated user profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await safeDbCall(
      async () => {
        const userRes = await db.query(
          `SELECT u.id, u.username, u.name, u.department_id, u.stay_type, u.hostel_block, u.language_pref, u.custom_notes, u.full_name, u.roll_number, u.email, u.preferred_language, u.hosteller, u.is_first_login, d.name as department_name FROM users u
           LEFT JOIN departments d ON u.department_id = d.id
           WHERE u.id = $1`,
          [req.user.userId]
        );
        return userRes.rows[0];
      },
      async () => {
        const mockUser = MOCK_STORE.users.find(u => u.id === req.user.userId);
        if (mockUser) {
          const dept = MOCK_STORE.departments.find(d => d.id === mockUser.department_id);
          return { ...mockUser, department_name: dept?.name };
        }
        return null;
      }
    );

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // Fetch interests
    const userInterests = await getUserInterests(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        full_name: user.full_name || user.name,
        username: user.username,
        roll_number: user.roll_number,
        email: user.email,
        preferred_language: user.preferred_language || user.language_pref,
        hosteller: user.hosteller || (user.stay_type === 'hostel'),
        department: user.department_name,
        is_first_login: user.is_first_login,
        interests: userInterests
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

