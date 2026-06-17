import { Router } from 'express';
import { query, get, run } from '../db/database';
import { randomUUID } from 'crypto';

const router = Router();

// Route 45: GET /api/outlets — List all outlets with revenue summary
router.get('/', (req, res) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    const outlets = query(`
      SELECT o.*,
        (SELECT COUNT(*) FROM orders ord WHERE ord.outlet_id = o.id AND DATE(ord.created_at) = DATE('now') AND ord.payment_status = 'paid') as today_orders,
        (SELECT COALESCE(SUM(total), 0) FROM orders ord WHERE ord.outlet_id = o.id AND DATE(ord.created_at) = DATE('now') AND ord.payment_status = 'paid') as today_revenue,
        (SELECT COUNT(*) FROM users u WHERE u.outlet_id = o.id AND u.status = 'active') as staff_count
      FROM outlets o
      WHERE o.tenant_id = ?
      ORDER BY o.name
    `, [tenantId]);

    res.json({ success: true, outlets });
  } catch (error: any) {
    console.error('List outlets error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 46: POST /api/outlets — Create new outlet
router.post('/', (req, res) => {
  try {
    const { tenantId, name, address, phone } = req.body;

    if (!tenantId || !name) {
      return res.status(400).json({ error: 'tenantId and name are required' });
    }

    const outletId = randomUUID();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    run(`
      INSERT INTO outlets (id, tenant_id, name, slug, address, phone, status)
      VALUES (?, ?, ?, ?, ?, ?, 'active')
    `, [outletId, tenantId, name, slug, address || null, phone || null]);

    // Create default settings for this outlet
    const defaultSettings = [
      { key: 'tax_rate', value: '11', type: 'number' },
      { key: 'tax_enabled', value: 'true', type: 'boolean' },
      { key: 'service_charge_rate', value: '5', type: 'number' },
      { key: 'service_charge_enabled', value: 'false', type: 'boolean' },
      { key: 'kds_warn_minutes', value: '10', type: 'number' },
      { key: 'kds_urgent_minutes', value: '20', type: 'number' },
      { key: 'kds_sound_enabled', value: 'true', type: 'boolean' },
      { key: 'kds_auto_sort', value: 'true', type: 'boolean' },
      { key: 'receipt_header', value: name, type: 'string' },
      { key: 'receipt_footer', value: 'Terima kasih!', type: 'string' },
    ];

    for (const setting of defaultSettings) {
      run(`
        INSERT OR IGNORE INTO settings (id, tenant_id, outlet_id, key, value, type)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [randomUUID(), tenantId, outletId, setting.key, setting.value, setting.type]);
    }

    const outlet = get('SELECT * FROM outlets WHERE id = ?', [outletId]);

    // Log activity
    run(`
      INSERT INTO activity_logs (id, tenant_id, action, entity_type, entity_id, description)
      VALUES (?, ?, 'create', 'outlet', ?, ?)
    `, [randomUUID(), tenantId, outletId, `Outlet ${name} ditambahkan`]);

    res.status(201).json({ success: true, outlet });
  } catch (error: any) {
    console.error('Create outlet error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 47: PUT /api/outlets/:id — Update outlet
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, status } = req.body;

    const existing = get('SELECT * FROM outlets WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Outlet not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (status) { updates.push('status = ?'); params.push(status); }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    run(`UPDATE outlets SET ${updates.join(', ')} WHERE id = ?`, params);

    const outlet = get('SELECT * FROM outlets WHERE id = ?', [id]);

    res.json({ success: true, outlet });
  } catch (error: any) {
    console.error('Update outlet error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
