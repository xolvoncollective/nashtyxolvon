import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase } from './db/database';

// Routes
import authRoutes from './routes/auth';
import ordersRoutes from './routes/orders';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Serve static files (HTML mockups)
app.use(express.static(path.join(__dirname, '../../')));

// Initialize database
initDatabase();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);

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
╔═══════════════════════════════════════╗
║    NASHTY KDS Backend Server Started  ║
╠═══════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(30)} ║
║  Env:  ${(process.env.NODE_ENV || 'development').padEnd(30)} ║
║  DB:   SQLite (Local)                 ║
╚═══════════════════════════════════════╝
  `);
});
