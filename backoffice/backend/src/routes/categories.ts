import { Router } from 'express';
import { query, get, run } from '../db/database';
import { nanoid } from 'nanoid';

const router = Router();

// GET /api/categories — Get all categories
router.get('/', (req, res) => {
  try {
    const { tenantId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    const categories = query(`
      SELECT c.*, 
        COUNT(DISTINCT p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
      WHERE c.tenant_id = ? AND c.status = 'active'
      GROUP BY c.id
      ORDER BY c.display_order, c.name
    `, [tenantId]);

    res.json({ categories });
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/categories/:id/products — Get all products in a category (all statuses)
router.get('/:id/products', (req, res) => {
  try {
    const { id } = req.params;

    const category = get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const products = query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ?
      ORDER BY p.status, p.name
    `, [id]);

    res.json({ success: true, category, products });
  } catch (error: any) {
    console.error('Get category products error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/categories/:id — Get category by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const category = get('SELECT * FROM categories WHERE id = ?', [id]);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error: any) {
    console.error('Get category error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 7: POST /api/categories — Create category
router.post('/', (req, res) => {
  try {
    const { tenantId, name, description, icon, color } = req.body;

    if (!tenantId || !name) {
      return res.status(400).json({ error: 'tenantId and name are required' });
    }

    const categoryId = nanoid();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Get next display order
    const lastOrder = get('SELECT MAX(display_order) as max_order FROM categories WHERE tenant_id = ?', [tenantId]);
    const nextOrder = ((lastOrder as any)?.max_order || 0) + 1;

    run(`
      INSERT INTO categories (id, tenant_id, name, slug, description, icon, color, display_order, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [categoryId, tenantId, name, slug, description || null, icon || null, color || null, nextOrder]);

    const category = get('SELECT * FROM categories WHERE id = ?', [categoryId]);

    // Log activity
    run(`
      INSERT INTO activity_logs (id, tenant_id, action, entity_type, entity_id, description)
      VALUES (?, ?, 'create', 'category', ?, ?)
    `, [nanoid(), tenantId, categoryId, `Kategori "${name}" ditambahkan`]);

    res.status(201).json({ success: true, category });
  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 8: PUT /api/categories/:id — Update category
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color } = req.body;

    const existing = get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
      updates.push('slug = ?');
      params.push(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (icon !== undefined) { updates.push('icon = ?'); params.push(icon); }
    if (color !== undefined) { updates.push('color = ?'); params.push(color); }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    run(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, params);

    const category = get('SELECT * FROM categories WHERE id = ?', [id]);

    res.json({ success: true, category });
  } catch (error: any) {
    console.error('Update category error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 9: PATCH /api/categories/:id/status — Toggle category status
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'status must be "active" or "inactive"' });
    }

    const existing = get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    run('UPDATE categories SET status = ?, updated_at = ? WHERE id = ?', [status, new Date().toISOString(), id]);

    res.json({ success: true, message: `Kategori ${status === 'active' ? 'diaktifkan' : 'dinonaktifkan'}` });
  } catch (error: any) {
    console.error('Update category status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 10: DELETE /api/categories/:id — Delete category (soft)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Soft delete the category
    run('UPDATE categories SET status = ?, updated_at = ? WHERE id = ?', ['inactive', new Date().toISOString(), id]);

    // Also soft delete all products in this category
    run('UPDATE products SET status = ?, updated_at = ? WHERE category_id = ? AND status != ?', ['inactive', new Date().toISOString(), id, 'inactive']);

    res.json({ success: true, message: 'Kategori dan produk di dalamnya berhasil dihapus (nonaktif)' });
  } catch (error: any) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 11: PUT /api/categories/reorder — Reorder categories
router.put('/reorder', (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'items array required: [{ id, order }]' });
    }

    for (const item of items) {
      run('UPDATE categories SET display_order = ?, updated_at = ? WHERE id = ?',
        [item.order, new Date().toISOString(), item.id]);
    }

    res.json({ success: true, message: 'Urutan kategori berhasil diperbarui' });
  } catch (error: any) {
    console.error('Reorder categories error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
