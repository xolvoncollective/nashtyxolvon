import { Router } from 'express';
import { query, get, run } from '../db/database';
import { insert, update, softDelete } from '../db/persistence';
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
        (SELECT COUNT(*) FROM modifier_options mo WHERE mo.group_id = mg.id AND mo.status = 'active' AND mo.deleted_at IS NULL) as option_count,
        (SELECT COUNT(*) FROM product_modifiers pm JOIN products p ON pm.product_id = p.id WHERE pm.modifier_group_id = mg.id AND p.deleted_at IS NULL) as product_count
      FROM modifier_groups mg
      WHERE mg.tenant_id = ? AND mg.status = 'active' AND mg.deleted_at IS NULL
      ORDER BY mg.display_order, mg.name
    `, [tenantId]);

    // Get options for each group
    for (const group of groups as any[]) {
      group.options = query(`
        SELECT id, name, price_adjustment, display_order, status
        FROM modifier_options
        WHERE group_id = ? AND status = 'active' AND deleted_at IS NULL
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

    insert('modifier_groups', {
      id: groupId,
      tenant_id: tenantId,
      name,
      description: description || null,
      type,
      required: required ? 1 : 0,
      min_select: minSelect || 0,
      max_select: maxSelect || 1
    });

    // Insert options if provided
    if (options && Array.isArray(options)) {
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        insert('modifier_options', {
          id: crypto.randomUUID(),
          group_id: groupId,
          name: opt.name,
          price_adjustment: opt.priceAdjustment || 0,
          display_order: i + 1
        });
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

    const existing = get('SELECT * FROM modifier_groups WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Modifier group not found' });
    }

    const updates: Record<string, any> = {};

    if (name) updates['name'] = name;
    if (description !== undefined) updates['description'] = description;
    if (type) updates['type'] = type;
    if (required !== undefined) updates['required'] = required ? 1 : 0;
    if (minSelect !== undefined) updates['min_select'] = minSelect;
    if (maxSelect !== undefined) updates['max_select'] = maxSelect;

    update('modifier_groups', id, updates);

    const group = get('SELECT * FROM modifier_groups WHERE id = ?', [id]);
    (group as any).options = query('SELECT * FROM modifier_options WHERE group_id = ? AND status = \'active\' AND deleted_at IS NULL ORDER BY display_order', [id]);

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

    const existing = get('SELECT * FROM modifier_groups WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Modifier group not found' });
    }

    softDelete('modifier_groups', id);
    run('UPDATE modifier_options SET deleted_at = CURRENT_TIMESTAMP WHERE group_id = ? AND deleted_at IS NULL', [id]);

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

    const existing = get('SELECT * FROM modifier_groups WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Modifier group not found' });
    }

    // Get next display order
    const lastOrder = get('SELECT MAX(display_order) as max_order FROM modifier_options WHERE group_id = ? AND deleted_at IS NULL', [id]);
    const nextOrder = ((lastOrder as any)?.max_order || 0) + 1;

    const optionId = crypto.randomUUID();
    insert('modifier_options', {
      id: optionId,
      group_id: id,
      name,
      price_adjustment: priceAdjustment || 0,
      display_order: nextOrder
    });

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

    const existing = get('SELECT * FROM modifier_options WHERE id = ? AND deleted_at IS NULL', [optionId]);
    if (!existing) {
      return res.status(404).json({ error: 'Modifier option not found' });
    }

    softDelete('modifier_options', optionId);

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

    const existing = get('SELECT * FROM modifier_groups WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Modifier group not found' });
    }

    const products = query(`
      SELECT p.id, p.name, p.price, p.status, c.name as category_name
      FROM products p
      JOIN product_modifiers pm ON p.id = pm.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE pm.modifier_group_id = ? AND p.deleted_at IS NULL
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

    const existing = get('SELECT * FROM modifier_groups WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Modifier group not found' });
    }

    const product = get('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL', [productId]);
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

    insert('product_modifiers', {
      product_id: productId,
      modifier_group_id: id,
      display_order: nextOrder
    });

    // Mark product as has_modifiers = 1
    update('products', productId, { has_modifiers: 1 });

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
      update('products', productId, { has_modifiers: 0 });
    }

    res.json({ success: true, message: 'Product unassigned from modifier group' });
  } catch (error: any) {
    console.error('Unassign product from modifier error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
