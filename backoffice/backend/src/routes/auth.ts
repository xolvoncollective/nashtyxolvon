import { Router } from 'express';
import db from '../db/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// Login with PIN
router.post('/login', async (req, res) => {
  try {
    const { pin, outletId } = req.body;

    if (!pin) {
      return res.status(400).json({ error: 'PIN required' });
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
      ? db.prepare(query).all(outletId)
      : db.prepare(query).all();

    // Check PIN against all active users
    for (const user of users as any[]) {
      const pinMatch = await bcrypt.compare(pin, user.pin);
      if (pinMatch) {
        const token = jwt.sign(
          { id: user.id, role: user.role, tenantId: user.tenant_id, outletId: user.outlet_id },
          process.env.JWT_SECRET || 'nashty-super-secret-key-2026',
          { expiresIn: '24h' }
        );

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

    return res.status(401).json({ error: 'Invalid PIN' });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available staff for PIN selection
router.get('/staff', (req, res) => {
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
      ? db.prepare(query).all(outletId)
      : db.prepare(query).all();

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
      SELECT u.id, u.name, u.role, u.pin, u.tenant_id
      FROM users u
      WHERE u.status = 'active' AND u.role IN ('manager', 'owner')
    `;

    const params: any[] = [];
    if (outletId) {
      query += ` AND (u.outlet_id = ? OR u.outlet_id IS NULL)`;
      params.push(outletId);
    }

    const managers = outletId
      ? db.prepare(query).all(outletId)
      : db.prepare(query).all();

    // Check PIN against managers
    for (const manager of managers as any[]) {
      const pinMatch = await bcrypt.compare(pin, manager.pin);
      if (pinMatch) {
        const token = jwt.sign(
          { id: manager.id, role: manager.role, tenantId: manager.tenant_id, outletId: manager.outlet_id, isManagerOverride: true },
          process.env.JWT_SECRET || 'nashty-super-secret-key-2026',
          { expiresIn: '15m' }
        );

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
router.get('/outlets', (req, res) => {
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
      ? db.prepare(query).all(...params)
      : db.prepare(query).all();

    res.json({ success: true, outlets });
  } catch (error: any) {
    console.error('Get outlets error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
