import crypto from 'crypto';
import db from '../database/index.js';

// In-memory fallback stores for when PostgreSQL connection is down or timeouts
const MOCK_OTP_STORE = new Map(); // email (lowercase) -> { hashedOtp, expiresAt, attemptCount, isVerified, ipAddress, userAgent }
const MOCK_OTP_AUDIT = []; // Array of { email, event, ip, userAgent, details, created_at }

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 * 
 * @returns {string} - 6-digit numeric string
 */
export const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hashes the raw OTP using SHA-256 with a static salt for database storage.
 * 
 * @param {string} otp - 6-digit numeric OTP
 * @returns {string} - SHA-256 hash hex string
 */
export const hashOtp = (otp) => {
  const salt = 'pathmate_otp_salt_2026';
  return crypto.createHmac('sha256', salt).update(otp).digest('hex');
};

/**
 * Checks if the email or IP has exceeded 5 OTP requests per hour.
 * 
 * @param {string} email - Destination email address
 * @param {string} ip - Requesting IP address
 * @returns {Promise<boolean>} - True if rate limit is exceeded, false otherwise
 */
export const checkRateLimit = async (email, ip) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  try {
    // Count sent OTPs for the email in the last hour
    const countRes = await db.query(
      `SELECT COUNT(*) FROM otp_audit_logs 
       WHERE (LOWER(email) = LOWER($1) OR ip_address = $2)
         AND event_type IN ('OTP_SENT', 'OTP_RESEND_REQUESTED')
         AND created_at >= $3`,
      [email, ip, oneHourAgo]
    );
    
    const count = parseInt(countRes.rows[0].count || 0);
    return count >= 5;
  } catch (error) {
    console.warn("[OtpService] DB error in rate limiting, falling back to mock memory check:", error.message);
    const mockCount = MOCK_OTP_AUDIT.filter(log => 
      (log.email.toLowerCase() === email.toLowerCase() || log.ip === ip) &&
      log.created_at >= oneHourAgo &&
      (log.event === 'OTP_SENT' || log.event === 'OTP_RESEND_REQUESTED')
    ).length;
    return mockCount >= 5;
  }
};

/**
 * Creates, stores, and returns a new OTP for the email, invalidating previous ones.
 * 
 * @param {string} email - Destination email address
 * @param {string} ip - Requesting IP address
 * @param {string} ua - Requesting user agent string
 * @returns {Promise<string>} - The raw 6-digit OTP string
 */
export const requestNewOtp = async (email, ip, ua) => {
  // 1. Check rate limiting (max 5 per hour)
  const isRateLimited = await checkRateLimit(email, ip);
  if (isRateLimited) {
    throw new Error('Too many verification codes requested. Max 5 requests per hour. Please try again later.');
  }

  const rawOtp = generateOtp();
  const hashedOtp = hashOtp(rawOtp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

  try {
    // 2. Invalidate any previous unused OTP codes for this email
    await db.query(
      `UPDATE otp_verifications 
       SET expires_at = NOW() - INTERVAL '1 second'
       WHERE LOWER(email) = LOWER($1) AND is_verified = FALSE AND expires_at > NOW()`,
      [email]
    );

    // 3. Save to database
    await db.query(
      `INSERT INTO otp_verifications (email, hashed_otp, expires_at, attempt_count, is_verified, ip_address, user_agent)
       VALUES ($1, $2, $3, 0, FALSE, $4, $5)`,
      [email, hashedOtp, expiresAt, ip, ua]
    );

    // 4. Determine if it is a resend
    const prevLogsRes = await db.query(
      `SELECT COUNT(*) FROM otp_audit_logs WHERE LOWER(email) = LOWER($1)`,
      [email]
    );
    const isResend = parseInt(prevLogsRes.rows[0].count || 0) > 0;
    const eventType = isResend ? 'OTP_RESEND_REQUESTED' : 'OTP_SENT';

    // 5. Log audit event
    await db.query(
      `INSERT INTO otp_audit_logs (email, event_type, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [email, eventType, ip, ua, `OTP generated and saved. Expires at: ${expiresAt.toISOString()}`]
    );
  } catch (error) {
    console.warn("[OtpService] DB error in requestNewOtp, falling back to mock memory storage:", error.message);
  }

  // Always write/sync to memory store as fallback
  MOCK_OTP_STORE.set(email.toLowerCase(), {
    hashedOtp,
    expiresAt,
    attemptCount: 0,
    isVerified: false,
    ipAddress: ip,
    userAgent: ua
  });

  const prevMockCount = MOCK_OTP_AUDIT.filter(log => log.email.toLowerCase() === email.toLowerCase()).length;
  const mockEventType = prevMockCount > 0 ? 'OTP_RESEND_REQUESTED' : 'OTP_SENT';
  MOCK_OTP_AUDIT.push({
    email,
    event: mockEventType,
    ip,
    userAgent: ua,
    details: `OTP generated and saved to memory. Expires at: ${expiresAt.toISOString()}`,
    created_at: new Date()
  });

  return rawOtp;
};

/**
 * Validates a submitted OTP code.
 * 
 * @param {string} email - Student email address
 * @param {string} otpCode - Submitted 6-digit OTP code
 * @param {string} ip - Requesting IP address
 * @param {string} ua - Requesting User Agent
 * @returns {Promise<{success: boolean, error?: string}>} - Verification result status
 */
export const verifyOtpCode = async (email, otpCode, ip, ua) => {
  if (!otpCode || otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
    return { success: false, error: 'Verification code must be exactly 6 digits.' };
  }

  let record = null;
  let useFallback = false;

  try {
    // 1. Fetch latest active verification record for the email
    const verifyRes = await db.query(
      `SELECT * FROM otp_verifications 
       WHERE LOWER(email) = LOWER($1) 
         AND is_verified = FALSE 
         AND expires_at > NOW()
       ORDER BY created_at DESC 
       LIMIT 1`,
      [email]
    );
    if (verifyRes.rows.length > 0) {
      record = verifyRes.rows[0];
    }
  } catch (error) {
    console.warn("[OtpService] DB error in verifyOtpCode, falling back to mock memory check:", error.message);
    useFallback = true;
  }

  if (useFallback || !record) {
    const mockRecord = MOCK_OTP_STORE.get(email.toLowerCase());
    if (mockRecord && !mockRecord.isVerified && mockRecord.expiresAt > new Date()) {
      record = mockRecord;
      useFallback = true; // ensure fallback path is followed
    }
  }

  if (!record) {
    if (!useFallback) {
      try {
        // Audit failed verification
        await db.query(
          `INSERT INTO otp_audit_logs (email, event_type, ip_address, user_agent, details)
           VALUES ($1, 'OTP_FAILED', $2, $3, $4)`,
          [email, ip, ua, 'Failed OTP attempt: Code expired, invalid, or already verified']
        );
      } catch (err) {}
    }
    MOCK_OTP_AUDIT.push({
      email,
      event: 'OTP_FAILED',
      ip,
      userAgent: ua,
      details: 'Failed OTP attempt: Code expired, invalid, or already verified',
      created_at: new Date()
    });
    return { success: false, error: 'Verification code is expired or invalid. Please request a new code.' };
  }

  // 2. Check validation attempts limitation (max 3 attempts)
  if (record.attemptCount !== undefined ? record.attemptCount >= 3 : record.attempt_count >= 3) {
    if (!useFallback) {
      try {
        // Invalidate the OTP record due to too many attempts
        await db.query(
          `UPDATE otp_verifications SET expires_at = NOW() - INTERVAL '1 second' WHERE id = $1`,
          [record.id]
        );
        await db.query(
          `INSERT INTO otp_audit_logs (email, event_type, ip_address, user_agent, details)
           VALUES ($1, 'OTP_FAILED', $2, $3, $4)`,
          [email, ip, ua, `Failed OTP attempt: Too many attempts (ID: ${record.id})`]
        );
      } catch (err) {}
    }
    // Update local memory too
    const mockRecord = MOCK_OTP_STORE.get(email.toLowerCase());
    if (mockRecord) mockRecord.expiresAt = new Date(0); // invalidate
    MOCK_OTP_AUDIT.push({
      email,
      event: 'OTP_FAILED',
      ip,
      userAgent: ua,
      details: 'Failed OTP attempt: Too many attempts',
      created_at: new Date()
    });
    return { success: false, error: 'Too many incorrect attempts. This verification code has been invalidated. Please request a new one.' };
  }

  // 3. Increment validation attempts
  const currentAttempts = (record.attemptCount !== undefined ? record.attemptCount : record.attempt_count) + 1;
  if (record.attemptCount !== undefined) record.attemptCount = currentAttempts;
  if (record.attempt_count !== undefined) record.attempt_count = currentAttempts;
  
  if (!useFallback) {
    try {
      await db.query(
        `UPDATE otp_verifications SET attempt_count = $1 WHERE id = $2`,
        [currentAttempts, record.id]
      );
    } catch (err) {}
  }
  const mockRecord = MOCK_OTP_STORE.get(email.toLowerCase());
  if (mockRecord) mockRecord.attemptCount = currentAttempts;

  // 4. Compare OTP hashes
  const hashedInput = hashOtp(otpCode);
  if (hashedInput !== (record.hashedOtp || record.hashed_otp)) {
    if (!useFallback) {
      try {
        await db.query(
          `INSERT INTO otp_audit_logs (email, event_type, ip_address, user_agent, details)
           VALUES ($1, 'OTP_FAILED', $2, $3, $4)`,
          [email, ip, ua, `Failed OTP attempt: Incorrect code (Attempt ${currentAttempts}/3)`]
        );
      } catch (err) {}
    }
    MOCK_OTP_AUDIT.push({
      email,
      event: 'OTP_FAILED',
      ip,
      userAgent: ua,
      details: `Failed OTP attempt: Incorrect code (Attempt ${currentAttempts}/3)`,
      created_at: new Date()
    });

    const attemptsLeft = 3 - currentAttempts;
    const errorMsg = attemptsLeft > 0 
      ? `Incorrect verification code. You have ${attemptsLeft} attempts remaining.`
      : 'Too many incorrect attempts. This verification code has been invalidated. Please request a new one.';
      
    if (attemptsLeft === 0) {
      if (!useFallback) {
        try {
          // Invalidate the OTP record
          await db.query(
            `UPDATE otp_verifications SET expires_at = NOW() - INTERVAL '1 second' WHERE id = $1`,
            [record.id]
          );
        } catch (err) {}
      }
      if (mockRecord) mockRecord.expiresAt = new Date(0); // invalidate in memory
    }
    
    return { success: false, error: errorMsg };
  }

  // 5. Success! Mark verified
  if (!useFallback) {
    try {
      await db.query(
        `UPDATE otp_verifications 
         SET is_verified = TRUE, used_at = NOW() 
         WHERE id = $1`,
        [record.id]
      );

      await db.query(
        `INSERT INTO otp_audit_logs (email, event_type, ip_address, user_agent, details)
         VALUES ($1, 'OTP_VERIFIED', $2, $3, $4)`,
        [email, ip, ua, `OTP verified successfully (ID: ${record.id})`]
      );
    } catch (err) {}
  }
  if (mockRecord) {
    mockRecord.isVerified = true;
  }
  MOCK_OTP_AUDIT.push({
    email,
    event: 'OTP_VERIFIED',
    ip,
    userAgent: ua,
    details: 'OTP verified successfully in memory fallback',
    created_at: new Date()
  });

  return { success: true };
};

/**
 * Logs account created audit event.
 * 
 * @param {string} email - Student email address
 * @param {string} ip - IP address
 * @param {string} ua - User Agent
 */
export const logAccountCreated = async (email, ip, ua) => {
  try {
    await db.query(
      `INSERT INTO otp_audit_logs (email, event_type, ip_address, user_agent, details)
       VALUES ($1, 'ACCOUNT_CREATED', $2, $3, 'Student account registration created successfully after email verification')`,
      [email, ip, ua]
    );
  } catch (error) {
    console.warn("[OtpService] DB error in logging account creation, using memory fallback");
  }
  MOCK_OTP_AUDIT.push({
    email,
    event: 'ACCOUNT_CREATED',
    ip,
    userAgent: ua,
    details: 'Student account registration created successfully after email verification in memory fallback',
    created_at: new Date()
  });
};

export default {
  generateOtp,
  hashOtp,
  checkRateLimit,
  requestNewOtp,
  verifyOtpCode,
  logAccountCreated
};
