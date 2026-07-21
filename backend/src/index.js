import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';

import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import tasksRouter from './routes/tasks.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Global CORS & OPTIONS preflight handler (Must run before Helmet)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Origin');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Security Headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Root path diagnostic greeting
app.get('/', (req, res) => {
  res.json({
    message: "Welcome to the PathMate SCE Freshers Portal API Service",
    status: "Operational",
    version: "1.0.0"
  });
});

// Ensure uploads directory exists and serve static files
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Mount the Routers
app.use('/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/tasks', tasksRouter);
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

    // Run migrations automatically
    try {
      const sql13 = path.join(__dirname, 'database', 'migrations', '13_activity_manager.sql');
      if (fs.existsSync(sql13)) {
        await db.query(fs.readFileSync(sql13, 'utf8'));
        console.log('✓ Activity Manager PostgreSQL schema initialized');
      }

      const sql14 = path.join(__dirname, 'database', 'migrations', '14_notice_attachments.sql');
      if (fs.existsSync(sql14)) {
        await db.query(fs.readFileSync(sql14, 'utf8'));
        console.log('✓ Notice Attachments PostgreSQL schema initialized');
      }

      const sql15 = path.join(__dirname, 'database', 'migrations', '15_real_student_modules.sql');
      if (fs.existsSync(sql15)) {
        await db.query(fs.readFileSync(sql15, 'utf8'));
        console.log('✓ Real Student Modules (Seniors & Roommates) schema initialized');
      }

      const sql16 = path.join(__dirname, 'database', 'migrations', '16_production_auth_security.sql');
      if (fs.existsSync(sql16)) {
        await db.query(fs.readFileSync(sql16, 'utf8'));
        console.log('✓ Production Auth & Security Infrastructure schema initialized');
      }

      const sql17 = path.join(__dirname, 'database', 'migrations', '17_admin_crud_production.sql');
      if (fs.existsSync(sql17)) {
        await db.query(fs.readFileSync(sql17, 'utf8'));
        console.log('✓ Admin CRUD Production & AI FAQs schema initialized');
      }
    } catch (err) {
      console.error("Failed to run database migrations on startup:", err.message);
    }
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

    console.warn('NOTE: Operating in fallback memory mode. Configure DATABASE_URL in .env to connect to PostgreSQL.');
  }
});

// Export the Express API for Vercel Serverless
export default app;

