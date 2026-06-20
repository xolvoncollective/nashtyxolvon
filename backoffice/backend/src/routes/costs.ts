import { Router } from 'express';
import { query, get, run } from '../db/database';
import { randomUUID } from 'crypto';

const router = Router();

// GET /api/costs — List costs
router.get('/', async (req, res) => {
  try {
    const { tenantId, outletId, category, dateFrom, dateTo } = req.query;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let whereClause = 'WHERE c.tenant_id = ?';
    const params: any[] = [tenantId];

    if (outletId) {
      whereClause += ' AND c.outlet_id = ?';
      params.push(outletId);
    }
    if (category) {
      whereClause += ' AND c.category = ?';
      params.push(category);
    }
    if (dateFrom) {
      whereClause += ' AND DATE(c.created_at) >= DATE(?)';
      params.push(dateFrom);
    }
    if (dateTo) {
      whereClause += ' AND DATE(c.created_at) <= DATE(?)';
      params.push(dateTo);
    }

    const costs = await query(`
      SELECT c.*, o.name as outlet_name
      FROM nashtycosts c
      LEFT JOIN outlets o ON c.outlet_id = o.id
      ${whereClause}
      ORDER BY c.created_at DESC
    `, params);

    res.json({ success: true, costs });
  } catch (error: any) {
    console.error('List costs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/costs — Create cost
router.post('/', async (req, res) => {
  try {
    const { tenantId, outletId, amount, category, description } = req.body;
    if (!tenantId || amount === undefined || !category) {
      return res.status(400).json({ error: 'tenantId, amount, and category are required' });
    }

    const validCategories = ['bahan-baku', 'operasional', 'gaji', 'utilitas', 'sewa', 'lainnya'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
    }

    const costId = randomUUID();
    await run(`
      INSERT INTO nashtycosts (id, tenant_id, outlet_id, amount, category, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [costId, tenantId, outletId || null, Number(amount), category, description || null]);

    const cost = await get('SELECT * FROM nashtycosts WHERE id = ?', [costId]);

    // Log activity
    await run(`
      INSERT INTO activity_logs (id, tenant_id, action, entity_type, entity_id, description)
      VALUES (?, ?, 'create_cost', 'cost', ?, ?)
    `, [randomUUID(), tenantId, costId, `Biaya ${category} sebesar Rp ${Number(amount).toLocaleString('id-ID')} ditambahkan`]);

    res.status(201).json({ success: true, cost });
  } catch (error: any) {
    console.error('Create cost error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/costs/:id — Update cost
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, description, outletId } = req.body;

    const existing = await get('SELECT * FROM nashtycosts WHERE id = ?', [id]) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Cost not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (amount !== undefined) { updates.push('amount = ?'); params.push(Number(amount)); }
    if (category) {
      const validCategories = ['bahan-baku', 'operasional', 'gaji', 'utilitas', 'sewa', 'lainnya'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
      }
      updates.push('category = ?');
      params.push(category);
    }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (outletId !== undefined) { updates.push('outlet_id = ?'); params.push(outletId); }

    if (updates.length > 0) {
      params.push(id);
      await run(`UPDATE nashtycosts SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const cost = await get('SELECT * FROM nashtycosts WHERE id = ?', [id]);

    res.json({ success: true, cost });
  } catch (error: any) {
    console.error('Update cost error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/costs/:id — Delete cost
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await get('SELECT * FROM nashtycosts WHERE id = ?', [id]) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Cost not found' });
    }

    await run('DELETE FROM nashtycosts WHERE id = ?', [id]);

    // Log activity
    await run(`
      INSERT INTO activity_logs (id, tenant_id, action, entity_type, entity_id, description)
      VALUES (?, ?, 'delete_cost', 'cost', ?, ?)
    `, [randomUUID(), existing.tenant_id, id, `Biaya ${existing.category} sebesar Rp ${Number(existing.amount).toLocaleString('id-ID')} dihapus`]);

    res.json({ success: true, message: 'Cost deleted successfully' });
  } catch (error: any) {
    console.error('Delete cost error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
