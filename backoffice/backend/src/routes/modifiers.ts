import { Router } from 'express';
import { query, get, run } from '../db/database';
import crypto from 'crypto';

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

    const groupId = crypto.randomUUID();

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
        `, [crypto.randomUUID(), groupId, opt.name, opt.priceAdjustment || 0, i + 1]);
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

    const optionId = crypto.randomUUID();
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

// Route 23: DELETE /api/modifiers/options/:optionId — Delete modifier option (must be before /:id routes)
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

// Route 24: GET /api/modifiers/:id/products — Get products using this modifier group
router.get('/:id/products', (req, res) => {
  try {
    const { id } = req.params;

    const existing = get('SELECT * FROM modifier_groups WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Modifier group not found' });
    }

    const products = query(`
      SELECT p.id, p.name, p.price, p.status, c.name as category_name
      FROM products p
      JOIN product_modifiers pm ON p.id = pm.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE pm.modifier_group_id = ?
      ORDER BY p.name
    `, [id]);

    res.json({ success: true, products });
  } catch (error: any) {
    console.error('Get modifier products error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 25: POST /api/modifiers/:id/assign-product — Assign a product to this modifier group
router.post('/:id/assign-product', (req, res) => {
  try {
    const { id } = req.params;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    const existing = get('SELECT * FROM modifier_groups WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Modifier group not found' });
    }

    const product = get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if already assigned
    const alreadyLinked = get('SELECT * FROM product_modifiers WHERE product_id = ? AND modifier_group_id = ?', [productId, id]);
    if (alreadyLinked) {
      return res.json({ success: true, message: 'Already assigned' });
    }

    // Get next display order for this product
    const lastOrder = get('SELECT MAX(display_order) as max_order FROM product_modifiers WHERE product_id = ?', [productId]);
    const nextOrder = ((lastOrder as any)?.max_order || 0) + 1;

    run('INSERT INTO product_modifiers (product_id, modifier_group_id, display_order) VALUES (?, ?, ?)', [productId, id, nextOrder]);

    // Mark product as has_modifiers = 1
    run('UPDATE products SET has_modifiers = 1, updated_at = ? WHERE id = ?', [new Date().toISOString(), productId]);

    res.json({ success: true, message: 'Product assigned to modifier group' });
  } catch (error: any) {
    console.error('Assign product to modifier error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 26: DELETE /api/modifiers/:id/unassign-product/:productId — Unassign a product from this modifier group
router.delete('/:id/unassign-product/:productId', (req, res) => {
  try {
    const { id, productId } = req.params;

    run('DELETE FROM product_modifiers WHERE modifier_group_id = ? AND product_id = ?', [id, productId]);

    // If product has no more modifiers, set has_modifiers = 0
    const remaining = get('SELECT COUNT(*) as cnt FROM product_modifiers WHERE product_id = ?', [productId]);
    if ((remaining as any)?.cnt === 0) {
      run('UPDATE products SET has_modifiers = 0, updated_at = ? WHERE id = ?', [new Date().toISOString(), productId]);
    }

    res.json({ success: true, message: 'Product unassigned from modifier group' });
  } catch (error: any) {
    console.error('Unassign product from modifier error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
