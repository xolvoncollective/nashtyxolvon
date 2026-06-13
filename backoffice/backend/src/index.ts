import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase } from './db/database';

// Routes
import authRoutes from './routes/auth';
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
import { requireAuth } from './middleware/auth';
import xss from 'xss';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Serve static files (HTML mockups)
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

// Initialize database
initDatabase();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
╔═══════════════════════════════════════════╗
║   NASHTY OS Backend Server Started        ║
╠═══════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(34)} ║
║  Env:  ${(process.env.NODE_ENV || 'development').padEnd(34)} ║
║  DB:   SQLite (data/nashtypos.db)         ║
╠═══════════════════════════════════════════╣
║  Routes:                                  ║
║  • /api/auth     — Auth & PIN             ║
║  • /api/users    — User Management        ║
║  • /api/categories — Categories CRUD      ║
║  • /api/products — Products CRUD          ║
║  • /api/menu     — Full Menu Tree         ║
║  • /api/modifiers — Modifier Groups       ║
║  • /api/orders   — Orders + KDS           ║
║  • /api/shifts   — Shift Management       ║
║  • /api/dashboard — Dashboard KPIs        ║
║  • /api/reports  — Reports & Analytics    ║
║  • /api/outlets  — Outlet Management      ║
║  • /api/settings — Settings per Outlet    ║
║  • /api/activity-logs — Activity Logs     ║
╚═══════════════════════════════════════════╝
  `);
});
