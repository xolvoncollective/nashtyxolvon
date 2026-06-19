import { Router } from 'express';
import db, { query, get, run } from '../db/database';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const router = Router();

// Route 3: POST /api/users — Create new user (cashier/manager/chef)
router.post('/', async (req, res) => {
  try {
    const { tenantId, outletId, name, email, phone, role, pin } = req.body;

    if (!tenantId || !name || !role || !pin) {
      return res.status(400).json({ error: 'tenantId, name, role, and pin are required' });
    }

    const validRoles = ['owner', 'manager', 'cashier', 'kitchen'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Hash the PIN
    const pinHash = await bcrypt.hash(pin, 10);
    const userId = randomUUID();

    await run(`
      INSERT INTO users (id, tenant_id, outlet_id, name, email, phone, role, pin, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [userId, tenantId, outletId || null, name, email || null, phone || null, role, pinHash]);

    const user = get('SELECT id, name, email, phone, role, outlet_id, status, created_at FROM users WHERE id = ?', [userId]);

    // Log activity
    await run(`
      INSERT INTO activity_logs (id, tenant_id, user_id, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, 'create', 'user', ?, ?)
    `, [randomUUID(), tenantId, null, userId, `User ${name} (${role}) ditambahkan`]);

    res.status(201).json({ success: true, user });
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 4: PUT /api/users/:id — Update user data
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, pin, outletId } = req.body;

    const existing = get('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email || null); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone || null); }
    if (role) { updates.push('role = ?'); params.push(role); }
    if (outletId !== undefined) { updates.push('outlet_id = ?'); params.push(outletId || null); }

    if (pin) {
      const pinHash = await bcrypt.hash(pin, 10);
      updates.push('pin = ?');
      params.push(pinHash);
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    if (updates.length > 1) {
      await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const user = get('SELECT id, name, email, phone, role, outlet_id, status, created_at FROM users WHERE id = ?', [id]);

    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 5: PATCH /api/users/:id/status — Activate/deactivate user
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'status must be "active" or "inactive"' });
    }

    const existing = get('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    await run('UPDATE users SET status = ?, updated_at = ? WHERE id = ?', [status, new Date().toISOString(), id]);

    res.json({ success: true, message: `User ${status === 'active' ? 'diaktifkan' : 'dinonaktifkan'}` });
  } catch (error: any) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 6: DELETE /api/users/:id — Soft delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = get('SELECT * FROM users WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete by setting status to deleted
    await run('UPDATE users SET status = ?, updated_at = ? WHERE id = ?', ['deleted', new Date().toISOString(), id]);

    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users — List users with filters
router.get('/', async (req, res) => {
  try {
    const { tenantId, outletId, role, status } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let sql = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.outlet_id, u.status, u.avatar, u.created_at,
             o.name as outlet_name
      FROM users u
      LEFT JOIN outlets o ON u.outlet_id = o.id
      WHERE u.tenant_id = ? AND u.status != 'deleted'
    `;
    const params: any[] = [tenantId];

    if (outletId) { sql += ' AND u.outlet_id = ?'; params.push(outletId); }
    if (role) { sql += ' AND u.role = ?'; params.push(role); }
    if (status) { sql += ' AND u.status = ?'; params.push(status); }

    sql += ' ORDER BY u.role, u.name';

    const users = await query(sql, params);

    res.json({ success: true, users });
  } catch (error: any) {
    console.error('List users error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
