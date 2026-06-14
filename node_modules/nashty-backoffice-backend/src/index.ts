import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { initDatabase, get as dbGet } from './db/database';
import { testConnection as testSupabaseConnection } from './supabase/supabase-client';
import { cacheManager } from './services/CacheManager';

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
import { requestLoggingMiddleware } from './middleware/logging';
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

// Gzip compression for text-based assets (Task 23 - Requirement 15.9)
app.use(compression());

// Request logging middleware (Task 22.1 - Requirement 14.1, 14.9)
app.use(requestLoggingMiddleware);

// Rate Limiting Middleware (Task 21 - Requirement 9.6, 19.5)
// Apply rate limiting only in production mode
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting in development mode (Requirement 19.4)
    return process.env.NODE_ENV === 'development';
  }
});

// Apply rate limiter to all API routes
app.use('/api/', limiter);

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

// XSS Sanitization Middleware (Task 21 - Requirement 9.8, 19.5)
// Sanitizes all string inputs in request body to prevent XSS attacks
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

// Initialize CacheManager (Requirement 10.1)
// The singleton instance is already created, so we just set up periodic cleanup
console.log('🗄️  Initializing CacheManager...');

// Set up periodic cache cleanup every 5 minutes to prevent memory leaks
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
setInterval(() => {
  const removed = cacheManager.cleanupExpired();
  if (removed > 0) {
    console.log(`🧹 Cache cleanup: removed ${removed} expired entries`);
  }
}, CACHE_CLEANUP_INTERVAL);

console.log('✅ CacheManager initialized with periodic cleanup (every 5 minutes)');

// Make cache manager accessible through app.locals for route handlers
app.locals.cacheManager = cacheManager;

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

// API Routes — Auth & Users (AUTH BYPASSED IN DEV MODE)
app.use('/api/auth', authRoutes);
app.use('/api/users', requireAuth, usersRoutes);

// API Routes — Menu Management (AUTH BYPASSED IN DEV MODE)
app.use('/api/categories', requireAuth, categoriesRoutes);
app.use('/api/products', requireAuth, productsRoutes);
app.use('/api/menu', requireAuth, menuRoutes);
app.use('/api/modifiers', requireAuth, modifiersRoutes);

// API Routes — Orders & Shifts (AUTH BYPASSED IN DEV MODE)
app.use('/api/orders', requireAuth, ordersRoutes);
app.use('/api/shifts', requireAuth, shiftsRoutes);

// API Routes — Dashboard & Reports (AUTH BYPASSED IN DEV MODE)
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/reports', requireAuth, reportsRoutes);

// API Routes — CRM / Members
app.use('/api/members', membersRoutes);

// API Routes — Outlets, Settings & Logs (AUTH BYPASSED IN DEV MODE)
app.use('/api/outlets', requireAuth, outletsRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);
app.use('/api/activity-logs', requireAuth, activityLogsRoutes);

// Error handler (Task 21 - Requirement 9.5, 9.6, 19.5)
// Returns appropriate error messages based on environment mode
// In production: hides stack traces for security
// In development: includes full stack traces for debugging
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Determine if we're in production mode (Task 21, 24 - Requirement 19.5)
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Build error response
  const errorResponse: any = {
    success: false,
    error: err.message || 'Internal server error',
    status: err.status || 500
  };
  
  // Only include stack trace in development mode (Task 21 - Requirement 9.6, 19.5)
  if (!isProduction) {
    errorResponse.stack = err.stack;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    console.log(`
╔══════════════════════════════════════════════════════════╗
║   NASHTY OS Backend Server Started (v2.0)                ║
╠══════════════════════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(42)} ║
║  Env:  ${(process.env.NODE_ENV || 'development').padEnd(42)} ║
║  DB:   SQLite + Supabase Ready                          ║
║  Auth: ${isDev ? 'BYPASSED (Development Mode)              ' : 'REQUIRED (Production Mode)                '} ║
╠══════════════════════════════════════════════════════════╣
║  Main Features:                                          ║
║  • Main Login Page (/)                                  ║${isDev ? `
║  • 🔓 AUTH BYPASSED - All API routes accessible        ║` : ''}
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
║  • /api/activity-logs — Activity Logs                  ║${isDev ? `
╠══════════════════════════════════════════════════════════╣
║  🔧 DEVELOPMENT MODE FEATURES:                          ║
║  • Authentication bypassed for all API routes          ║
║  • Rate limiting disabled                              ║
║  • CORS accepts all origins                            ║
║  • Detailed error messages with stack traces           ║
║  • DEBUG logging enabled                               ║` : ''}
╚══════════════════════════════════════════════════════════╝
    `);
  });
}

export default app;
