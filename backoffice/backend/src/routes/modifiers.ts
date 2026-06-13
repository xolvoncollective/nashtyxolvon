import { Router } from 'express';
import { query, get, run } from '../db/database';
import { nanoid } from 'nanoid';

const router = Router();

// Route 18: GET /api/modifiers — List all modifier groups
router.get('/', (req, res) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    const groups = query(`
      SELECT mg.*,
        (SELECT COUNT(*) FROM modifier_options mo WHERE mo.group_id = mg.id AND mo.status = 'active') as option_count,
        (SELECT COUNT(*) FROM product_modifiers pm WHERE pm.modifier_group_id = mg.id) as product_count
      FROM modifier_groups mg
      WHERE mg.tenant_id = ? AND mg.status = 'active'
      ORDER BY mg.display_order, mg.name
    `, [tenantId]);

    // Get options for each group
    for (const group of groups as any[]) {
      group.options = query(`
        SELECT id, name, price_adjustment, display_order, status
        FROM modifier_options
        WHERE group_id = ? AND status = 'active'
        ORDER BY display_order, name
      `, [group.id]);
    }

    res.json({ success: true, modifiers: groups });
  } catch (error: any) {
    console.error('Get modifiers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 19: POST /api/modifiers — Create modifier group
router.post('/', (req, res) => {
  try {
    const { tenantId, name, description, type, required, minSelect, maxSelect, options } = req.body;

    if (!tenantId || !name || !type) {
      return res.status(400).json({ error: 'tenantId, name, and type are required' });
    }

    const groupId = nanoid();

    run(`
      INSERT INTO modifier_groups (id, tenant_id, name, description, type, required, min_select, max_select)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [groupId, tenantId, name, description || null, type, required ? 1 : 0, minSelect || 0, maxSelect || 1]);

    // Insert options if provided
    if (options && Array.isArray(options)) {
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        run(`
          INSERT INTO modifier_options (id, group_id, name, price_adjustment, display_order)
          VALUES (?, ?, ?, ?, ?)
        `, [nanoid(), groupId, opt.name, opt.priceAdjustment || 0, i + 1]);
      }
    }

    const group = get('SELECT * FROM modifier_groups WHERE id = ?', [groupId]);
    (group as any).options = query('SELECT * FROM modifier_options WHERE group_id = ? ORDER BY display_order', [groupId]);

    res.status(201).json({ success: true, modifier: group });
  } catch (error: any) {
    console.error('Create modifier error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 20: PUT /api/modifiers/:id — Update modifier group
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, required, minSelect, maxSelect } = req.body;

    const existing = get('SELECT * FROM modifier_groups WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Modifier group not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (type) { updates.push('type = ?'); params.push(type); }
    if (required !== undefined) { updates.push('required = ?'); params.push(required ? 1 : 0); }
    if (minSelect !== undefined) { updates.push('min_select = ?'); params.push(minSelect); }
    if (maxSelect !== undefined) { updates.push('max_select = ?'); params.push(maxSelect); }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    run(`UPDATE modifier_groups SET ${updates.join(', ')} WHERE id = ?`, params);

    const group = get('SELECT * FROM modifier_groups WHERE id = ?', [id]);
    (group as any).options = query('SELECT * FROM modifier_options WHERE group_id = ? AND status = \'active\' ORDER BY display_order', [id]);

    res.json({ success: true, modifier: group });
  } catch (error: any) {
    console.error('Update modifier error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 21: DELETE /api/modifiers/:id — Delete modifier group (soft)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = get('SELECT * FROM modifier_groups WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Modifier group not found' });
    }

    run('UPDATE modifier_groups SET status = ?, updated_at = ? WHERE id = ?', ['inactive', new Date().toISOString(), id]);

    res.json({ success: true, message: 'Modifier group berhasil dihapus' });
  } catch (error: any) {
    console.error('Delete modifier error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 22: POST /api/modifiers/:id/options — Add option to modifier group
router.post('/:id/options', (req, res) => {
  try {
    const { id } = req.params;
    const { name, priceAdjustment } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const existing = get('SELECT * FROM modifier_groups WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Modifier group not found' });
    }

    // Get next display order
    const lastOrder = get('SELECT MAX(display_order) as max_order FROM modifier_options WHERE group_id = ?', [id]);
    const nextOrder = ((lastOrder as any)?.max_order || 0) + 1;

    const optionId = nanoid();
    run(`
      INSERT INTO modifier_options (id, group_id, name, price_adjustment, display_order)
      VALUES (?, ?, ?, ?, ?)
    `, [optionId, id, name, priceAdjustment || 0, nextOrder]);

    const option = get('SELECT * FROM modifier_options WHERE id = ?', [optionId]);

    res.status(201).json({ success: true, option });
  } catch (error: any) {
    console.error('Add modifier option error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 23: DELETE /api/modifiers/options/:optionId — Delete modifier option
router.delete('/options/:optionId', (req, res) => {
  try {
    const { optionId } = req.params;

    const existing = get('SELECT * FROM modifier_options WHERE id = ?', [optionId]);
    if (!existing) {
      return res.status(404).json({ error: 'Modifier option not found' });
    }

    run('UPDATE modifier_options SET status = ? WHERE id = ?', ['inactive', optionId]);

    res.json({ success: true, message: 'Modifier option berhasil dihapus' });
  } catch (error: any) {
    console.error('Delete modifier option error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
