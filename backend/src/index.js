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

// Ensure uploads directory exists safely (prevents ENOENT / read-only filesystem crash on Vercel)
try {
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));
} catch (fsErr) {
  console.warn("Uploads folder setup note (serverless/read-only environment):", fsErr.message);
}

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

// Helper function to safely run SQL migrations if files exist
const runMigrationsSafely = async () => {
  try {
    const migrationFiles = [
      '13_activity_manager.sql',
      '14_notice_attachments.sql',
      '15_real_student_modules.sql',
      '16_production_auth_security.sql',
      '17_admin_crud_production.sql'
    ];

    for (const file of migrationFiles) {
      try {
        const sqlPath = path.join(__dirname, 'database', 'migrations', file);
        if (fs.existsSync(sqlPath)) {
          const sql = fs.readFileSync(sqlPath, 'utf8');
          await db.query(sql);
          console.log(`✓ Migration ${file} initialized successfully`);
        }
      } catch (migFileErr) {
        // Suppress ENOENT errors on serverless Vercel runtime
        if (migFileErr.code !== 'ENOENT') {
          console.warn(`Migration ${file} note:`, migFileErr.message);
        }
      }
    }
  } catch (err) {
    console.warn("Database migration execution note:", err.message);
  }
};

// Start Server listening (for local development)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`PathMate API Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to verify operational status.`);

    // Verify database connectivity on startup
    try {
      await db.query('SELECT NOW()');
      console.log('✓ Connected to PostgreSQL');
      await runMigrationsSafely();
    } catch (err) {
      console.warn('PostgreSQL connection note:', err.message);
    }
  });
}

// Export the Express API for Vercel Serverless
export default app;

