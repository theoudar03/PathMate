import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';

import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS so the React frontend (running on e.g. localhost:5173) can query this server
app.use(cors({
  origin: '*', // Allow all origins for development testing
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Root path diagnostic greeting
app.get('/', (req, res) => {
  res.json({
    message: "Welcome to the PathMate SCE Freshers Portal API Service",
    status: "Operational",
    version: "1.0.0"
  });
});

// Mount the Routers
app.use('/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', apiRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    details: err.message
  });
});

import db from './database/index.js';

// Start Server listening
app.listen(PORT, async () => {
  console.log(`PathMate API Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to verify operational status.`);

  // Verify database connectivity on startup
  try {
    await db.query('SELECT NOW()');
    console.log('✓ Connected to PostgreSQL');
  } catch (err) {
    console.error(`
======================================================================
Unable to connect to PostgreSQL.

Check:
- DATABASE_URL: ${process.env.DATABASE_URL ? 'Configured (hidden for safety)' : 'Not Configured'}
- Network connectivity
- Supabase database status and connection limits
- SSL configuration

Reason: ${err.message}
======================================================================
    `);

    // In production, exit if database is offline and mock fallback is not explicitly permitted
    if (process.env.ALLOW_MOCK_DATA !== 'true') {
      console.error('CRITICAL ERROR: ALLOW_MOCK_DATA is false and PostgreSQL is unreachable. Exiting server...');
      process.exit(1);
    }
  }
});

// Export the Express API for Vercel Serverless
export default app;

