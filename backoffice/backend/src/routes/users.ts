import { Router } from 'express';
import db, { query, get, run } from '../db/database';
import { insert, update, softDelete } from '../db/persistence';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Route 3: POST /api/users — Create new user (cashier/manager/chef)
router.post('/', requireRole(['owner', 'manager']), async (req, res) => {
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
    const userId = crypto.randomUUID();

    insert('users', {
      id: userId,
      tenant_id: tenantId,
      outlet_id: outletId || null,
      name,
      email: email || null,
      phone: phone || null,
      role,
      pin: pinHash,
      status: 'active'
    });

    const user = get('SELECT id, name, email, phone, role, outlet_id, status, created_at FROM users WHERE id = ?', [userId]);

    // Log activity
    insert('activity_logs', {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      user_id: (req as any).user?.id || null,
      action: 'create',
      entity_type: 'user',
      entity_id: userId,
      description: `User ${name} (${role}) ditambahkan`
    });

    res.status(201).json({ success: true, user });
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 4: PUT /api/users/:id — Update user data
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Authorization check: User can only edit themselves unless they are owner/manager
    if (req.user && !['owner', 'manager'].includes(req.user.role.toLowerCase()) && req.user.id !== id) {
      return res.status(403).json({ error: 'Forbidden. You can only edit your own profile.' });
    }

    const { name, email, phone, role, pin, outletId } = req.body;

    const existing = get('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates: Record<string, any> = {};

    if (name) updates['name'] = name;
    if (email !== undefined) updates['email'] = email || null;
    if (phone !== undefined) updates['phone'] = phone || null;
    if (role) updates['role'] = role;
    if (outletId !== undefined) updates['outlet_id'] = outletId || null;

    if (pin) {
      const pinHash = await bcrypt.hash(pin, 10);
      updates['pin'] = pinHash;
    }

    if (Object.keys(updates).length > 0) {
      update('users', id, updates);
    }

    const user = get('SELECT id, name, email, phone, role, outlet_id, status, created_at FROM users WHERE id = ?', [id]);

    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 5: PATCH /api/users/:id/status — Activate/deactivate user
router.patch('/:id/status', requireRole(['owner', 'manager']), (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'status must be "active" or "inactive"' });
    }

    const existing = get('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    update('users', id, { status });

    res.json({ success: true, message: `User ${status === 'active' ? 'diaktifkan' : 'dinonaktifkan'}` });
  } catch (error: any) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 6: DELETE /api/users/:id — Soft delete user
router.delete('/:id', requireRole(['owner', 'manager']), (req, res) => {
  try {
    const { id } = req.params;

    const existing = get('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete by setting deleted_at
    softDelete('users', id);
    // Backward compatibility for UI that might check status = 'deleted'
    update('users', id, { status: 'deleted' });

    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users — List users with filters
router.get('/', (req, res) => {
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
      WHERE u.tenant_id = ? AND u.deleted_at IS NULL AND u.status != 'deleted'
    `;
    const params: any[] = [tenantId];

    if (outletId) { sql += ' AND u.outlet_id = ?'; params.push(outletId); }
    if (role) { sql += ' AND u.role = ?'; params.push(role); }
    if (status) { sql += ' AND u.status = ?'; params.push(status); }

    sql += ' ORDER BY u.role, u.name';

    const users = query(sql, params);

    res.json({ success: true, users });
  } catch (error: any) {
    console.error('List users error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
