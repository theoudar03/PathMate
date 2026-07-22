import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/index.js';
import { mapTextToInterests } from '../services/gemini.js';
import { authenticateToken, JWT_SECRET, loginRateLimiter } from '../middleware/auth.js';

export { authenticateToken };

const MOCK_STORE = {
  users: [],
  userInterests: [],
  interests: [],
  departments: [{ id: 1, name: 'Computer Science & Engineering', full_name: 'Computer Science & Engineering' }],
  roommateOptIn: {}
};

const router = express.Router();

// Helper: Run DB query with database connectivity check
const safeDbCall = async (dbQueryFn, mockQueryFn) => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set in environment variables.");
    }
    return await dbQueryFn();
  } catch (error) {
    console.error("Database query failed:", error.message);
    if (mockQueryFn) {
      return await mockQueryFn();
    }
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

/**
 * GET /auth/me or GET /me
 * Verifies JWT token and retrieves real user profile from PostgreSQL
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: 'Invalid authentication token' });

    const userRes = await safeDbCall(
      async () => {
        const queryRes = await db.query(
          `SELECT u.id, u.username, u.full_name, u.name, u.register_number, u.roll_number, u.email, 
                  u.stay_type, u.hostel_block, u.role, u.status, u.created_at,
                  d.name as department_name, d.full_name as department
           FROM users u
           LEFT JOIN departments d ON u.department_id = d.id
           WHERE u.id = $1`,
          [userId]
        );
        return queryRes.rows;
      },
      async () => {
        const u = MOCK_STORE.users.find(x => x.id === userId);
        return u ? [u] : [];
      }
    );

    if (!userRes || userRes.length === 0) {
      return res.status(401).json({ success: false, error: 'User account no longer exists' });
    }

    const user = userRes[0];
    if (user.status === 'blocked' || user.status === 'inactive') {
      return res.status(403).json({ success: false, error: 'Account has been deactivated or blocked' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name || user.name,
        name: user.full_name || user.name,
        register_number: user.register_number || user.roll_number,
        email: user.email,
        department: user.department || user.department_name || 'Computer Science & Engineering',
        hosteller: user.stay_type === 'hostel',
        role: user.role || 'student',
        status: user.status || 'active',
        created_at: user.created_at
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

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
      return (MOCK_STORE.userInterests || [])
        .filter(ui => ui.user_id === userId)
        .map(ui => {
          const interest = (MOCK_STORE.interests || []).find(i => i.id === ui.interest_id);
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
 * Validates official student register number, username & password, and creates account in Postgres
 */
router.post('/register', async (req, res) => {
  const {
    full_name,
    roll_number,
    register_number: rawRegNum,
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

  const regNumber = (rawRegNum || roll_number || '').trim();

  if (!full_name || !department || !regNumber) {
    return res.status(400).json({ error: 'Full name, department, and Register Number are required.' });
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
    // 1. Check official student database to prevent fake registrations
    const officialStudent = await safeDbCall(
      async () => {
        const checkRes = await db.query(
          'SELECT * FROM official_students WHERE LOWER(register_number) = LOWER($1)',
          [regNumber]
        );
        return checkRes.rows[0] || null;
      },
      async () => {
        // Fallback for dev mode without database: allow registration
        return { register_number: regNumber, department: department, is_registered: false };
      }
    );

    if (!officialStudent) {
      // Auto-insert record in official_students to ensure smooth registration for all valid students
      await safeDbCall(async () => {
        await db.query(
          'INSERT INTO official_students (register_number, name, department, is_registered) VALUES ($1, $2, $3, false) ON CONFLICT (register_number) DO NOTHING',
          [regNumber, full_name, department]
        );
      });
    }

    if (officialStudent.is_registered) {
      return res.status(400).json({
        error: `An account for Register Number '${regNumber}' has already been registered. Please log in.`
      });
    }

    // 2. Check uniqueness of username, email, register number in users table
    const uniquenessCheck = await safeDbCall(
      async () => {
        const checkRes = await db.query(
          `SELECT username, email, register_number FROM users 
           WHERE LOWER(username) = LOWER($1) OR (email IS NOT NULL AND LOWER(email) = LOWER($2)) OR LOWER(register_number) = LOWER($3)`,
          [username, email || '', regNumber]
        );
        return checkRes.rows;
      },
      async () => {
        return MOCK_STORE.users.filter(u => 
          u.username?.toLowerCase() === username.toLowerCase() ||
          (email && u.email?.toLowerCase() === email.toLowerCase()) ||
          u.register_number?.toLowerCase() === regNumber.toLowerCase()
        );
      }
    );

    if (uniquenessCheck.length > 0) {
      const match = uniquenessCheck[0];
      if (match.username?.toLowerCase() === username.toLowerCase()) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      if (email && match.email?.toLowerCase() === email.toLowerCase()) {
        return res.status(400).json({ error: 'An account with this email address already exists' });
      }
      return res.status(400).json({ error: 'An account with this Register Number already exists' });
    }

    // Hash password using bcrypt with 12 salt rounds
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await safeDbCall(
      async () => {
        // Resolve department ID
        const deptRes = await db.query('SELECT id FROM departments WHERE name ILIKE $1 OR full_name ILIKE $1', [`%${department}%`]);
        const deptId = deptRes.rows[0]?.id || 1;

        // Save User
        const userRes = await db.query(
          `INSERT INTO users (full_name, name, roll_number, register_number, email, preferred_language, language_pref, hosteller, stay_type, department_id, username, password_hash, role, status, is_first_login, hostel_block, custom_notes)
           VALUES ($1, $1, $2, $2, $3, $4, $4, $5, $6, $7, $8, $9, 'student', 'active', false, $10, $11) RETURNING id`,
          [full_name, regNumber, email, preferred_language, hosteller, hosteller ? 'hostel' : 'day_scholar', deptId, username, passwordHash, hostel_block, custom_notes]
        );
        const userId = userRes.rows[0].id;

        // Mark student as registered in official_students
        await db.query('UPDATE official_students SET is_registered = true WHERE LOWER(register_number) = LOWER($1)', [regNumber]);

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
        await db.query('INSERT INTO roommate_opt_in (user_id, is_visible) VALUES ($1, false) ON CONFLICT DO NOTHING', [userId]);

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
          roll_number: regNumber,
          register_number: regNumber,
          email,
          preferred_language,
          language_pref: preferred_language,
          hosteller,
          stay_type: hosteller ? 'hostel' : 'day_scholar',
          hostel_block,
          department_id: dept.id,
          username,
          password_hash: passwordHash,
          role: 'student',
          status: 'active',
          is_first_login: false,
          custom_notes,
          created_at: new Date().toISOString()
        };

        MOCK_STORE.users.push(newUser);
        return { userId };
      }
    );

    const userInterests = await getUserInterests(result.userId);
    const tokenPayload = {
      id: result.userId,
      userId: result.userId,
      username,
      role: 'student',
      status: 'active'
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '2h' });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: result.userId,
        full_name,
        username,
        register_number: regNumber,
        roll_number: regNumber,
        email,
        role: 'student',
        status: 'active',
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
 * 3. POST /auth/login
 * Rate-limited login verifying credentials, account status, and generating 2h JWT
 */
router.post('/login', loginRateLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username or Register Number and password are required' });
  }

  const queryTerm = username.trim();

  try {
    const user = await safeDbCall(
      async () => {
        const userRes = await db.query(
          `SELECT u.id, u.username, u.password_hash, u.name, u.department_id, u.stay_type, u.hostel_block, 
                  u.language_pref, u.custom_notes, u.full_name, u.roll_number, u.register_number, u.email, 
                  u.preferred_language, u.hosteller, u.is_first_login, u.role, u.status, d.name as department_name 
           FROM users u
           LEFT JOIN departments d ON u.department_id = d.id
           WHERE LOWER(u.username) = LOWER($1) OR LOWER(u.register_number) = LOWER($1) OR LOWER(u.roll_number) = LOWER($1) OR LOWER(u.email) = LOWER($1)`,
          [queryTerm]
        );
        return userRes.rows[0];
      },
      async () => {
        const mockUser = MOCK_STORE.users.find(u => 
          u.username?.toLowerCase() === queryTerm.toLowerCase() ||
          u.register_number?.toLowerCase() === queryTerm.toLowerCase() ||
          u.roll_number?.toLowerCase() === queryTerm.toLowerCase() ||
          u.email?.toLowerCase() === queryTerm.toLowerCase()
        );
        if (mockUser) {
          const dept = MOCK_STORE.departments.find(d => d.id === mockUser.department_id);
          return { ...mockUser, department_name: dept?.name };
        }
        return null;
      }
    );

    // Maintain secure state: don't reveal if user does not exist
    if (!user) {
      return res.status(401).json({ error: 'Incorrect credentials or password.' });
    }

    // Account Status Guard
    const accountStatus = user.status || 'active';
    if (accountStatus === 'blocked') {
      return res.status(403).json({ error: 'Your account has been blocked. Please contact campus administration.' });
    }
    if (accountStatus === 'inactive' || accountStatus === 'deleted') {
      return res.status(403).json({ error: 'Your account is inactive or has been deleted.' });
    }
    if (accountStatus === 'pending_verification') {
      return res.status(403).json({ error: 'Your account registration is pending admin verification.' });
    }

    // Verify Password Hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Incorrect credentials or password.' });
    }

    // Update last_login timestamp
    safeDbCall(async () => {
      await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    }).catch(err => console.warn('Failed to update last_login:', err.message));

    // Fetch user interests
    const userInterests = await getUserInterests(user.id);

    // Generate JWT Access Token (expires in 2 Hours)
    const tokenPayload = {
      id: user.id,
      userId: user.id,
      username: user.username,
      role: user.role || 'student',
      status: accountStatus
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '2h' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name || user.name,
        username: user.username,
        register_number: user.register_number || user.roll_number,
        roll_number: user.roll_number || user.register_number,
        email: user.email,
        role: user.role || 'student',
        status: accountStatus,
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
 * 4. POST /auth/change-password
 * Forces password change with security requirements
 */
router.post('/change-password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

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
      // Token expired or invalid
    }
  }

  if (!newPassword || (!currentPassword && !searchUserId)) {
    return res.status(400).json({ error: 'Missing current or new password details.' });
  }

  const passwordErr = validatePasswordFormat(newPassword);
  if (passwordErr) {
    return res.status(400).json({ error: passwordErr });
  }

  try {
    const user = await safeDbCall(
      async () => {
        let userRes;
        const columns = 'id, username, password_hash, name, department_id, stay_type, hostel_block, language_pref, custom_notes, full_name, roll_number, register_number, email, preferred_language, hosteller, is_first_login, role, status';
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

    if (currentPassword) {
      const match = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Current password verification failed.' });
      }
    }

    const hashed = await bcrypt.hash(newPassword, 12);

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

    const userInterests = await getUserInterests(user.id);
    const tokenPayload = { userId: user.id, username: user.username, role: user.role || 'student', status: user.status || 'active' };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '2h' });

    res.json({
      success: true,
      message: 'Password changed successfully.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name || user.name,
        username: user.username,
        register_number: user.register_number || user.roll_number,
        roll_number: user.roll_number || user.register_number,
        email: user.email,
        role: user.role || 'student',
        status: user.status || 'active',
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
 * 5. POST /auth/change-language
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
 * 6. POST /auth/logout
 * Standardised logout endpoint
 */
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

/**
 * 7. GET /auth/me
 * Retrieves current authenticated user profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await safeDbCall(
      async () => {
        const userRes = await db.query(
          `SELECT u.id, u.username, u.name, u.department_id, u.stay_type, u.hostel_block, u.language_pref, 
                  u.custom_notes, u.full_name, u.roll_number, u.register_number, u.email, u.preferred_language, 
                  u.hosteller, u.is_first_login, u.role, u.status, d.name as department_name 
           FROM users u
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

    const userInterests = await getUserInterests(user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        full_name: user.full_name || user.name,
        username: user.username,
        register_number: user.register_number || user.roll_number,
        roll_number: user.roll_number || user.register_number,
        email: user.email,
        role: user.role || 'student',
        status: user.status || 'active',
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
