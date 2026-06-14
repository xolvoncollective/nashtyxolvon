import { Router } from 'express';
import { query, get, run } from '../db/database';
import { nanoid } from 'nanoid';

const router = Router();

// Route 48: GET /api/settings/:outletId — Get all settings for outlet
router.get('/:outletId', (req, res) => {
  try {
    const { outletId } = req.params;

    const outlet = get('SELECT * FROM outlets WHERE id = ?', [outletId]);
    if (!outlet) {
      return res.status(404).json({ error: 'Outlet not found' });
    }

    const tenantId = (outlet as any).tenant_id;

    // Get outlet-level settings first, then tenant-level as fallback
    const outletSettings = query(`
      SELECT key, value, type
      FROM settings
      WHERE tenant_id = ? AND outlet_id = ?
      ORDER BY key
    `, [tenantId, outletId]);

    const tenantSettings = query(`
      SELECT key, value, type
      FROM settings
      WHERE tenant_id = ? AND outlet_id IS NULL
      ORDER BY key
    `, [tenantId]);

    // Merge: outlet settings override tenant settings
    const settingsMap: Record<string, any> = {};
    for (const s of tenantSettings as any[]) {
      settingsMap[s.key] = parseSettingValue(s.value, s.type);
    }
    for (const s of outletSettings as any[]) {
      settingsMap[s.key] = parseSettingValue(s.value, s.type);
    }

    // Get payment methods
    const paymentMethods = query(`
      SELECT id, name, type, icon, status, display_order
      FROM payment_methods
      WHERE tenant_id = ? AND status = 'active'
      ORDER BY display_order
    `, [tenantId]);

    res.json({
      success: true,
      settings: settingsMap,
      paymentMethods,
      outlet: {
        id: (outlet as any).id,
        name: (outlet as any).name,
        address: (outlet as any).address,
        phone: (outlet as any).phone
      }
    });
  } catch (error: any) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 49: PUT /api/settings/:outletId — Update settings
router.put('/:outletId', (req, res) => {
  try {
    const { outletId } = req.params;
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'settings object required' });
    }

    const outlet = get('SELECT * FROM outlets WHERE id = ?', [outletId]);
    if (!outlet) {
      return res.status(404).json({ error: 'Outlet not found' });
    }

    const tenantId = (outlet as any).tenant_id;

    for (const [key, value] of Object.entries(settings)) {
      const type = typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string';
      const stringValue = String(value);

      // Upsert setting
      const existing = get(
        'SELECT id FROM settings WHERE tenant_id = ? AND outlet_id = ? AND key = ?',
        [tenantId, outletId, key]
      );

      if (existing) {
        run(
          'UPDATE settings SET value = ?, type = ?, updated_at = ? WHERE id = ?',
          [stringValue, type, new Date().toISOString(), (existing as any).id]
        );
      } else {
        run(
          'INSERT INTO settings (id, tenant_id, outlet_id, key, value, type) VALUES (?, ?, ?, ?, ?, ?)',
          [nanoid(), tenantId, outletId, key, stringValue, type]
        );
      }
    }

    // Log activity
    run(`
      INSERT INTO activity_logs (id, tenant_id, action, entity_type, entity_id, description)
      VALUES (?, ?, 'update', 'settings', ?, ?)
    `, [nanoid(), tenantId, outletId, `Settings diperbarui: ${Object.keys(settings).join(', ')}`]);

    res.json({ success: true, message: 'Settings berhasil diperbarui' });
  } catch (error: any) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to parse setting values by type
function parseSettingValue(value: string, type: string): any {
  switch (type) {
    case 'boolean':
      return value === 'true' || value === '1';
    case 'number':
      return Number(value);
    case 'json':
      try { return JSON.parse(value); } catch { return value; }
    default:
      return value;
  }
}

export default router;
