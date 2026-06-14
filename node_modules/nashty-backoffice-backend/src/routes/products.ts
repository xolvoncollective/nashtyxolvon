import { Router } from 'express';
import { query, get, run } from '../db/database';
import { nanoid } from 'nanoid';

const router = Router();

// GET /api/products — Get all products with filters
router.get('/', (req, res) => {
  try {
    const { tenantId, categoryId, search, status = 'active' } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let sql = `
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.tenant_id = ?
    `;

    const params: any[] = [tenantId];

    if (categoryId) {
      sql += ` AND p.category_id = ?`;
      params.push(categoryId);
    }

    if (status) {
      sql += ` AND p.status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += ` ORDER BY p.is_favorite DESC, p.name`;

    const products = query(sql, params);

    res.json({ products });
  } catch (error: any) {
    console.error('Get products error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id — Get product by ID with modifiers
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const product = get(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get modifiers if product has them
    if ((product as any).has_modifiers) {
      (product as any).modifiers = query(`
        SELECT mg.*, pm.display_order as pm_order
        FROM modifier_groups mg
        JOIN product_modifiers pm ON mg.id = pm.modifier_group_id
        WHERE pm.product_id = ? AND mg.status = 'active'
        ORDER BY pm.display_order, mg.display_order
      `, [id]);

      for (const modifier of (product as any).modifiers as any[]) {
        modifier.options = query(`
          SELECT * FROM modifier_options
          WHERE group_id = ? AND status = 'active'
          ORDER BY display_order, name
        `, [modifier.id]);
      }
    }

    res.json({ product });
  } catch (error: any) {
    console.error('Get product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/products/:id/favorite — Toggle favorite
router.patch('/:id/favorite', (req, res) => {
  try {
    const { id } = req.params;

    const product = get('SELECT is_favorite FROM products WHERE id = ?', [id]) as any;

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newValue = product.is_favorite ? 0 : 1;
    run('UPDATE products SET is_favorite = ? WHERE id = ?', [newValue, id]);

    res.json({ success: true, is_favorite: newValue });
  } catch (error: any) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 12: POST /api/products — Create product
router.post('/', (req, res) => {
  try {
    const { tenantId, categoryId, name, description, price, cost, imageUrl, hasModifiers, modifierGroupIds, productionTime, stockTracking, stockQty } = req.body;

    if (!tenantId || !categoryId || !name || price === undefined) {
      return res.status(400).json({ error: 'tenantId, categoryId, name, and price are required' });
    }

    const productId = nanoid();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    run(`
      INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, image_url, has_modifiers, production_time, status, stock_tracking, stock_qty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `, [productId, tenantId, categoryId, name, slug, description || null, price, cost || 0, imageUrl || null, hasModifiers ? 1 : 0, productionTime || 10, stockTracking ? 1 : 0, stockQty || 0]);

    // Link modifier groups if provided
    if (modifierGroupIds && Array.isArray(modifierGroupIds)) {
      for (let i = 0; i < modifierGroupIds.length; i++) {
        run(`
          INSERT INTO product_modifiers (product_id, modifier_group_id, display_order)
          VALUES (?, ?, ?)
        `, [productId, modifierGroupIds[i], i + 1]);
      }
    }

    const product = get('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [productId]);

    // Log activity
    run(`
      INSERT INTO activity_logs (id, tenant_id, action, entity_type, entity_id, description)
      VALUES (?, ?, 'create', 'product', ?, ?)
    `, [nanoid(), tenantId, productId, `Produk "${name}" ditambahkan (Rp ${price.toLocaleString()})`]);

    res.status(201).json({ success: true, product });
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 13: PUT /api/products/:id — Update product
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryId, description, price, cost, imageUrl, hasModifiers, modifierGroupIds, productionTime, stockTracking, stockQty } = req.body;

    const existing = get('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
      updates.push('slug = ?');
      params.push(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
    if (categoryId) { updates.push('category_id = ?'); params.push(categoryId); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (price !== undefined) { updates.push('price = ?'); params.push(price); }
    if (cost !== undefined) { updates.push('cost = ?'); params.push(cost); }
    if (imageUrl !== undefined) { updates.push('image_url = ?'); params.push(imageUrl); }
    if (hasModifiers !== undefined) { updates.push('has_modifiers = ?'); params.push(hasModifiers ? 1 : 0); }
    if (productionTime !== undefined) { updates.push('production_time = ?'); params.push(productionTime); }
    if (stockTracking !== undefined) { updates.push('stock_tracking = ?'); params.push(stockTracking ? 1 : 0); }
    if (stockQty !== undefined) { updates.push('stock_qty = ?'); params.push(stockQty); }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    run(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);

    // Update modifier group links if provided
    if (modifierGroupIds && Array.isArray(modifierGroupIds)) {
      run('DELETE FROM product_modifiers WHERE product_id = ?', [id]);
      for (let i = 0; i < modifierGroupIds.length; i++) {
        run(`
          INSERT INTO product_modifiers (product_id, modifier_group_id, display_order)
          VALUES (?, ?, ?)
        `, [id, modifierGroupIds[i], i + 1]);
      }
    }

    const product = get('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [id]);

    // Log activity
    run(`
      INSERT INTO activity_logs (id, tenant_id, action, entity_type, entity_id, description)
      VALUES (?, ?, 'update', 'product', ?, ?)
    `, [nanoid(), (existing as any).tenant_id, id, `Produk "${(existing as any).name}" diperbarui`]);

    res.json({ success: true, product });
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 14: PATCH /api/products/:id/status — Update product status
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive', 'soldout'].includes(status)) {
      return res.status(400).json({ error: 'status must be "active", "inactive", or "soldout"' });
    }

    const existing = get('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    run('UPDATE products SET status = ?, updated_at = ? WHERE id = ?', [status, new Date().toISOString(), id]);

    const statusLabels: Record<string, string> = { active: 'diaktifkan', inactive: 'dinonaktifkan', soldout: 'ditandai habis' };

    // Log activity
    run(`
      INSERT INTO activity_logs (id, tenant_id, action, entity_type, entity_id, description)
      VALUES (?, ?, 'update', 'product', ?, ?)
    `, [nanoid(), (existing as any).tenant_id, id, `Produk "${(existing as any).name}" ${statusLabels[status]}`]);

    res.json({ success: true, message: `Produk ${statusLabels[status]}` });
  } catch (error: any) {
    console.error('Update product status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 15: DELETE /api/products/:id — Delete product (soft)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = get('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    run('UPDATE products SET status = ?, updated_at = ? WHERE id = ?', ['inactive', new Date().toISOString(), id]);

    res.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (error: any) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 16: POST /api/products/:id/duplicate — Duplicate product
router.post('/:id/duplicate', (req, res) => {
  try {
    const { id } = req.params;

    const original = get('SELECT * FROM products WHERE id = ?', [id]) as any;
    if (!original) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newId = nanoid();
    const newName = `${original.name} (Copy)`;
    const newSlug = `${original.slug}-copy-${Date.now()}`;

    run(`
      INSERT INTO products (id, tenant_id, category_id, name, slug, description, price, cost, image_url, has_modifiers, production_time, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [newId, original.tenant_id, original.category_id, newName, newSlug, original.description, original.price, original.cost, original.image_url, original.has_modifiers, original.production_time]);

    // Copy modifier links
    const modLinks = query('SELECT * FROM product_modifiers WHERE product_id = ?', [id]);
    for (const link of modLinks as any[]) {
      run(`
        INSERT INTO product_modifiers (product_id, modifier_group_id, display_order)
        VALUES (?, ?, ?)
      `, [newId, link.modifier_group_id, link.display_order]);
    }

    const product = get('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [newId]);

    res.status(201).json({ success: true, product });
  } catch (error: any) {
    console.error('Duplicate product error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
