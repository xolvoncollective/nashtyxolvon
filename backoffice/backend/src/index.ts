import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase, get as dbGet } from './db/database';
import { testConnection as testSupabaseConnection } from './supabase/supabase-client';

// Routes
import authRoutes from './routes/auth';
import mainAuthRoutes from './routes/main-auth';
import categoriesRoutes from './routes/categories';
import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';
import shiftsRoutes from './routes/shifts';
import dashboardRoutes from './routes/dashboard';
import usersRoutes from './routes/users';
import menuRoutes from './routes/menu';
import modifiersRoutes from './routes/modifiers';
import reportsRoutes from './routes/reports';
import outletsRoutes from './routes/outlets';
import settingsRoutes from './routes/settings';
import activityLogsRoutes from './routes/activity-logs';
import membersRoutes from './routes/members';
import { requireAuth } from './middleware/auth';
import xss from 'xss';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3099;
const SERVER_START_TIME = Date.now();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Serve static files for frontend modules
// POS frontend
app.use('/pos', express.static(path.join(__dirname, '../../../pos/frontend')));

// KDS frontend
app.use('/kds', express.static(path.join(__dirname, '../../../kds/frontend')));

// Backoffice frontend
app.use('/backoffice', express.static(path.join(__dirname, '../../../backoffice/frontend')));

// Serve root static files (includes index.html launcher)
app.use(express.static(path.join(__dirname, '../../../')));

// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../../data/uploads')));

// Simple XSS Sanitization Middleware
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
});

// Initialize databases
initDatabase();

// Test Supabase connection on startup
const initializeSupabase = async () => {
  console.log('🔌 Testing Supabase connection...');
  const supabaseConnected = await testSupabaseConnection();
  
  if (supabaseConnected) {
    console.log('✅ Supabase connected successfully');
  } else {
    console.log('⚠️  Supabase connection failed, falling back to local SQLite');
  }
};

initializeSupabase();

// Health check (legacy endpoint for backward compatibility)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0',
    features: ['sqlite', 'supabase-ready', 'jwt-auth']
  });
});

// API Health check with database connectivity check (Requirement 11)
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  let databaseStatus = 'disconnected';
  let error: string | undefined;
  
  try {
    // Check database connectivity by executing a simple query
    const result = dbGet('SELECT 1 as test');
    if (result && result.test === 1) {
      databaseStatus = 'connected';
    }
  } catch (dbError: any) {
    error = dbError.message || 'Database query failed';
    console.error('Health check database error:', dbError);
  }
  
  const responseTime = Date.now() - startTime;
  const uptime = Math.floor((Date.now() - SERVER_START_TIME) / 1000);
  
  // Return 503 if database is not accessible (Requirement 11.4)
  if (databaseStatus === 'disconnected') {
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      uptime,
      database: databaseStatus,
      error,
      responseTime: `${responseTime}ms`
    });
  }
  
  // Return 200 if all systems operational (Requirement 11.3)
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime,
    database: databaseStatus,
    features: ['sqlite', 'supabase-ready', 'jwt-auth', 'wal-mode'],
    responseTime: `${responseTime}ms`
  });
});

// Main auth API (no auth required)
app.use('/api/main/auth', mainAuthRoutes);

// API Routes — Auth & Users
app.use('/api/auth', authRoutes);
app.use('/api/users', requireAuth, usersRoutes);

// API Routes — Menu Management
app.use('/api/categories', requireAuth, categoriesRoutes);
app.use('/api/products', requireAuth, productsRoutes);
app.use('/api/menu', requireAuth, menuRoutes);
app.use('/api/modifiers', requireAuth, modifiersRoutes);

// API Routes — Orders & Shifts
app.use('/api/orders', requireAuth, ordersRoutes);
app.use('/api/shifts', requireAuth, shiftsRoutes);

// API Routes — Dashboard & Reports
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/reports', requireAuth, reportsRoutes);

// API Routes — CRM / Members
app.use('/api/members', membersRoutes);

// API Routes — Outlets, Settings & Logs
app.use('/api/outlets', requireAuth, outletsRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);
app.use('/api/activity-logs', requireAuth, activityLogsRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║   NASHTY OS Backend Server Started (v2.0)                ║
╠══════════════════════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(42)} ║
║  Env:  ${(process.env.NODE_ENV || 'development').padEnd(42)} ║
║  DB:   SQLite + Supabase Ready                          ║
╠══════════════════════════════════════════════════════════╣
║  Main Features:                                          ║
║  • Main Login Page (/)                                  ║
║  • Admin Authentication (admin/admin)                   ║
║  • 12-hour Session Management                           ║
║  • Supabase Cloud Integration                           ║
║  • Cloudflare Hosting Ready                             ║
╠══════════════════════════════════════════════════════════╣
║  Routes:                                                ║
║  • /api/main/auth   — Main Admin Auth                  ║
║  • /api/auth        — Staff PIN Auth                   ║
║  • /api/users       — User Management                  ║
║  • /api/categories  — Categories CRUD                  ║
║  • /api/products    — Products CRUD                    ║
║  • /api/menu        — Full Menu Tree                   ║
║  • /api/modifiers   — Modifier Groups                  ║
║  • /api/orders      — Orders + KDS                     ║
║  • /api/shifts      — Shift Management                 ║
║  • /api/dashboard   — Dashboard KPIs                   ║
║  • /api/reports     — Reports & Analytics              ║
║  • /api/outlets     — Outlet Management                ║
║  • /api/settings    — Settings per Outlet              ║
║  • /api/activity-logs — Activity Logs                  ║
╚══════════════════════════════════════════════════════════╝
  `);
});
