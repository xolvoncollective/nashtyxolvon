import { Router } from 'express';
import db from '../db/database';
import bcrypt from 'bcryptjs';

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
        // Return user data (no JWT for now, will add later)
        return res.json({
          success: true,
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

export default router;
