import { Router } from 'express';
import db from '../db/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateToken } from '../middleware/auth';

const router = Router();

// Store failed login attempts in memory
const failedAttempts = new Map<string, { count: number, timestamp: number }>();
const LOCKOUT_MINUTES = 5;
const MAX_ATTEMPTS = 3;

// Login with PIN
// Returns JWT token for authentication across POS, KDS, and Backoffice modules
router.post('/login', async (req, res) => {
  try {
    const { pin, outletId } = req.body;

    if (!pin) {
      return res.status(400).json({ 
        success: false,
        error: 'PIN required' 
      });
    }

    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const lockout = failedAttempts.get(clientIp);

    // Check if client is currently locked out
    if (lockout && lockout.count >= MAX_ATTEMPTS) {
      if (now - lockout.timestamp < LOCKOUT_MINUTES * 60 * 1000) {
        return res.status(429).json({ 
          success: false, 
          error: 'Terlalu banyak percobaan gagal. Coba lagi dalam 5 menit.' 
        });
      } else {
        // Lockout expired, reset
        failedAttempts.delete(clientIp);
      }
    }

    // Get users for outlet (default to first outlet if not specified)
    let query = `
      SELECT u.*, o.name as outlet_name, t.name as tenant_name
      FROM users u
      LEFT JOIN outlets o ON u.outlet_id = o.id
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.status = 'active'
    `;

    if (outletId) {
      query += ` AND u.outlet_id = ?`;
    }

    const users = outletId 
      ? await db.prepare(query).all(outletId)
      : await db.prepare(query).all();

    // Check PIN against all active users
    for (const user of users as any[]) {
      const pinMatch = await bcrypt.compare(pin, user.pin);
      if (pinMatch) {
        // Generate JWT token using the generateToken function from middleware
        // Token expiration: 12 hours for POS roles (cashier, chef), 30 minutes for Backoffice roles
        const token = generateToken(user.id, user.role, user.outlet_id);

        // Log successful login
        console.log(`[INFO] User login successful - ID: ${user.id}, Role: ${user.role}, Outlet: ${user.outlet_id || 'none'}`);

        return res.json({
          success: true,
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: user.tenant_id,
            outletId: user.outlet_id,
            outletName: user.outlet_name,
            tenantName: user.tenant_name
          }
        });
      }
    }

    // Log failed login attempt and increment counter
    const current = failedAttempts.get(clientIp) || { count: 0, timestamp: now };
    failedAttempts.set(clientIp, { count: current.count + 1, timestamp: now });
    
    console.log(`[WARN] Failed login attempt - Invalid PIN for outlet: ${outletId || 'none'}, IP: ${clientIp}, Attempt: ${current.count + 1}`);
    
    return res.status(401).json({ 
      success: false,
      error: 'Invalid PIN' 
    });
  } catch (error: any) {
    console.error('[ERROR] Login error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get available staff for PIN selection
router.get('/staff', async (req, res) => {
  try {
    const { outletId } = req.query;

    let query = `
      SELECT id, name, role, avatar
      FROM users
      WHERE status = 'active'
    `;

    if (outletId) {
      query += ` AND outlet_id = ?`;
    }

    query += ` ORDER BY role, name`;

    const staff = outletId
      ? await db.prepare(query).all(outletId)
      : await db.prepare(query).all();

    res.json({ staff });
  } catch (error: any) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 1: POST /api/auth/verify-manager-pin — Verify manager PIN for void/discount
router.post('/verify-manager-pin', async (req, res) => {
  try {
    const { pin, outletId } = req.body;

    if (!pin) {
      return res.status(400).json({ error: 'PIN required' });
    }

    // Find managers and owners in this outlet
    let query = `
      SELECT u.id, u.name, u.role, u.pin, u.tenant_id, u.outlet_id
      FROM users u
      WHERE u.status = 'active' AND u.role IN ('manager', 'owner')
    `;

    const params: any[] = [];
    if (outletId) {
      query += ` AND (u.outlet_id = ? OR u.outlet_id IS NULL)`;
      params.push(outletId);
    }

    const managers = outletId
      ? await db.prepare(query).all(outletId)
      : await db.prepare(query).all();

    // Check PIN against managers
    for (const manager of managers as any[]) {
      const pinMatch = await bcrypt.compare(pin, manager.pin);
      if (pinMatch) {
        // Generate JWT token using the generateToken function from middleware
        const token = generateToken(manager.id, manager.role, manager.outlet_id);

        return res.json({
          success: true,
          verified: true,
          token,
          manager: {
            id: manager.id,
            name: manager.name,
            role: manager.role
          }
        });
      }
    }

    return res.status(401).json({ success: false, verified: false, error: 'PIN Manager tidak valid' });
  } catch (error: any) {
    console.error('Verify manager PIN error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 2: GET /api/auth/outlets — List all active outlets
router.get('/outlets', async (req, res) => {
  try {
    const { tenantId } = req.query;

    let query = `
      SELECT id, name, slug, address, phone, status
      FROM outlets
      WHERE status = 'active'
    `;
    const params: any[] = [];

    if (tenantId) {
      query += ` AND tenant_id = ?`;
      params.push(tenantId);
    }

    query += ` ORDER BY name`;

    const outlets = params.length > 0
      ? await db.prepare(query).all(...params)
      : await db.prepare(query).all();

    res.json({ success: true, outlets });
  } catch (error: any) {
    console.error('Get outlets error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
