import { Router } from 'express';
import { query, get, run } from '../db/database';
import { insert, update, softDelete } from '../db/persistence';
import crypto from 'crypto';

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
      LEFT JOIN products p ON c.id = p.category_id AND p.deleted_at IS NULL
      WHERE c.tenant_id = ? AND c.deleted_at IS NULL
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

    const category = get('SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const products = query(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.deleted_at IS NULL
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

    const category = get('SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL', [id]);

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

    const categoryId = crypto.randomUUID();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Get next display order
    const lastOrder = get('SELECT MAX(display_order) as max_order FROM categories WHERE tenant_id = ? AND deleted_at IS NULL', [tenantId]);
    const nextOrder = ((lastOrder as any)?.max_order || 0) + 1;

    insert('categories', {
      id: categoryId,
      tenant_id: tenantId,
      name,
      slug,
      description: description || null,
      icon: icon || null,
      color: color || null,
      display_order: nextOrder,
      status: 'active'
    });

    const category = get('SELECT * FROM categories WHERE id = ?', [categoryId]);

    // Log activity
    insert('activity_logs', {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      user_id: (req as any).user?.id || null,
      action: 'create',
      entity_type: 'category',
      entity_id: categoryId,
      description: `Kategori "${name}" ditambahkan`
    });

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

    const existing = get('SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updates: Record<string, any> = {};

    if (name) {
      updates['name'] = name;
      updates['slug'] = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) updates['description'] = description;
    if (icon !== undefined) updates['icon'] = icon;
    if (color !== undefined) updates['color'] = color;

    update('categories', id, updates);

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

    const existing = get('SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    update('categories', id, { status });

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

    const existing = get('SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Soft delete the category
    softDelete('categories', id);

    // Also soft delete all products in this category
    run('UPDATE products SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE category_id = ? AND deleted_at IS NULL', [id]);

    res.json({ success: true, message: 'Kategori dan produk di dalamnya berhasil dihapus' });
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
      update('categories', item.id, { display_order: item.order });
    }

    res.json({ success: true, message: 'Urutan kategori berhasil diperbarui' });
  } catch (error: any) {
    console.error('Reorder categories error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
