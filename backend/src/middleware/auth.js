import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

export const JWT_SECRET = process.env.JWT_SECRET || 'pathmate-production-auth-secret-2026';

/**
 * Middleware to strictly verify JWT access token.
 * Rejects unauthenticated requests with HTTP 401 Unauthorized.
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in to access this resource.'
    });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    
    // Account Status Guard
    if (verified.status && verified.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: `Account is currently ${verified.status}. Access is restricted.`
      });
    }

    const id = verified.id || verified.userId;
    req.user = { ...verified, id, userId: id };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token.'
    });
  }
};

/**
 * Middleware to enforce Role-Based Access Control (RBAC).
 * Checks if authenticated req.user role matches allowed roles.
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    const userRole = (req.user.role || 'student').toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

    if (!normalizedAllowed.includes(userRole) && !normalizedAllowed.includes('super_admin')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have the required permissions for this action.'
      });
    }

    next();
  };
};

/**
 * Rate limiter middleware for login endpoints to prevent brute-force attacks.
 * Limits to 5 failed/attempts per 15 minutes per IP.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many login attempts from this IP. Please try again after 15 minutes.'
  }
});
