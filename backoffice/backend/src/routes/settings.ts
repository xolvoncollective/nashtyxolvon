import { Router } from 'express';
import { query, get, run } from '../db/database';
import { requireRole } from '../middleware/auth';
import { upsert, insert, update } from '../db/persistence';
import crypto from 'crypto';
import { SettingsService } from '../services/SettingsService';

const router = Router();

// Route 48: GET /api/settings/:outletId — Get all settings for outlet
router.get('/:outletId', (req, res) => {
  try {
    const { outletId } = req.params;

    const outlet = get('SELECT * FROM outlets WHERE id = ? AND deleted_at IS NULL', [outletId]);
    if (!outlet) {
      return res.status(404).json({ error: 'Outlet not found' });
    }

    const tenantId = (outlet as any).tenant_id;

    // Get merged settings from service
    const settingsMap = SettingsService.resolveSettings(tenantId, outletId);

    // Get payment methods
    const paymentMethods = query(`
      SELECT id, name, type, icon, status, display_order
      FROM payment_methods
      WHERE tenant_id = ? AND status = 'active' AND deleted_at IS NULL
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

// Internal domain-specific persistence functions
function savePaymentSettings(tenantId: string, outletId: string, settings: Record<string, any>) {
  for (const [key, value] of Object.entries(settings)) {
    saveSetting(tenantId, outletId, key, value);
  }
}

function saveReceiptSettings(tenantId: string, outletId: string, settings: Record<string, any>) {
  for (const [key, value] of Object.entries(settings)) {
    saveSetting(tenantId, outletId, key, value);
  }
}

function saveTaxSettings(tenantId: string, outletId: string, settings: Record<string, any>) {
  for (const [key, value] of Object.entries(settings)) {
    saveSetting(tenantId, outletId, key, value);
  }
}

function savePrinterSettings(tenantId: string, outletId: string, settings: Record<string, any>) {
  for (const [key, value] of Object.entries(settings)) {
    saveSetting(tenantId, outletId, key, value);
  }
}

function saveGeneralSettings(tenantId: string, outletId: string, settings: Record<string, any>) {
  for (const [key, value] of Object.entries(settings)) {
    saveSetting(tenantId, outletId, key, value);
  }
}

function saveSetting(tenantId: string, outletId: string, key: string, value: any) {
  let type = 'string';
  let stringValue = '';

  if (typeof value === 'boolean') {
    type = 'boolean';
    stringValue = String(value);
  } else if (typeof value === 'number') {
    type = 'number';
    stringValue = String(value);
  } else if (typeof value === 'object' && value !== null) {
    type = 'json';
    stringValue = JSON.stringify(value);
  } else {
    stringValue = String(value);
  }

  upsert(
    'settings',
    { tenant_id: tenantId, outlet_id: outletId, key: key },
    { value: stringValue, type: type },
    { id: crypto.randomUUID(), tenant_id: tenantId, outlet_id: outletId, key: key, value: stringValue, type: type }
  );
}

// Route 49: PUT /api/settings/:outletId — Update settings
router.put('/:outletId', requireRole(['owner', 'manager']), (req, res) => {
  try {
    const { outletId } = req.params;
    const { settings, paymentMethods } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'settings object required' });
    }

    const outlet = get('SELECT * FROM outlets WHERE id = ? AND deleted_at IS NULL', [outletId]);
    if (!outlet) {
      return res.status(404).json({ error: 'Outlet not found' });
    }

    const tenantId = (outlet as any).tenant_id;

    // Distribute settings to domain-specific handlers
    const paymentSettings: Record<string, any> = {};
    const receiptSettings: Record<string, any> = {};
    const taxSettings: Record<string, any> = {};
    const printerSettings: Record<string, any> = {};
    const generalSettings: Record<string, any> = {};

    for (const [key, value] of Object.entries(settings)) {
      if (key.startsWith('payment_')) paymentSettings[key] = value;
      else if (key.startsWith('receipt_')) receiptSettings[key] = value;
      else if (key.startsWith('tax_')) taxSettings[key] = value;
      else if (key.startsWith('printer_')) printerSettings[key] = value;
      else generalSettings[key] = value;
    }

    savePaymentSettings(tenantId, outletId, paymentSettings);
    saveReceiptSettings(tenantId, outletId, receiptSettings);
    saveTaxSettings(tenantId, outletId, taxSettings);
    savePrinterSettings(tenantId, outletId, printerSettings);
    saveGeneralSettings(tenantId, outletId, generalSettings);

    if (Array.isArray(paymentMethods)) {
      for (const pm of paymentMethods) {
        if (pm.id) {
          update('payment_methods', pm.id, {
            name: pm.name,
            type: pm.type,
            icon: pm.icon,
            status: pm.status,
            display_order: pm.display_order
          });
        } else {
          insert('payment_methods', {
            id: crypto.randomUUID(),
            tenant_id: tenantId,
            name: pm.name,
            type: pm.type,
            icon: pm.icon,
            status: pm.status || 'active',
            display_order: pm.display_order || 0
          });
        }
      }
    }

    // Log activity
    run(`
      INSERT INTO activity_logs (id, tenant_id, action, entity_type, entity_id, description)
      VALUES (?, ?, 'update', 'settings', ?, ?)
    `, [crypto.randomUUID(), tenantId, outletId, `Settings diperbarui: ${Object.keys(settings).join(', ')}`]);

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

// Route: POST /api/settings/:outletId/logo — Upload logo
router.post('/:outletId/logo', requireRole(['owner', 'manager']), (req, res) => {
  try {
    const { outletId } = req.params;
    const { base64Data } = req.body;
    
    if (!base64Data) {
      return res.status(400).json({ error: 'base64Data required' });
    }

    const fs = require('fs');
    const path = require('path');
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../../../data/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Extract base64 and save
    const matches = base64Data.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 string' });
    }
    
    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');
    
    const newFilename = 'logo_' + outletId + '_' + Date.now() + '.' + ext;
    const filepath = path.join(uploadsDir, newFilename);
    
    fs.writeFileSync(filepath, buffer);
    const logoUrl = '/uploads/' + newFilename;
    
    // Update setting in database using SettingsService
    // req.user contains tenantId if authenticateToken sets it, otherwise we can get it from outlet
    const tenant = get('SELECT tenant_id FROM outlets WHERE id = ?', [outletId]) as any;
    if (tenant) {
      run(`
        INSERT INTO settings (id, tenant_id, outlet_id, key, value, created_at, updated_at)
        VALUES (?, ?, ?, 'logo', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(tenant_id, outlet_id, key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
      `, [crypto.randomUUID(), tenant.tenant_id, outletId, logoUrl, logoUrl]);
    }
    
    res.json({ success: true, url: logoUrl });
  } catch (error: any) {
    console.error('Logo upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
