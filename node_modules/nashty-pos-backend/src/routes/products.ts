import { Router } from 'express';
import db from '../db/database';

const router = Router();

// Get all products with filters
router.get('/', (req, res) => {
  try {
    const { tenantId, categoryId, search, status = 'active' } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let query = `
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.tenant_id = ?
    `;

    const params: any[] = [tenantId];

    if (categoryId) {
      query += ` AND p.category_id = ?`;
      params.push(categoryId);
    }

    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ` ORDER BY p.is_favorite DESC, p.name`;

    const products = db.prepare(query).all(...params);

    res.json({ products });
  } catch (error: any) {
    console.error('Get products error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get product by ID with modifiers
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const product = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get modifiers if product has them
    if ((product as any).has_modifiers) {
      const modifiers = db.prepare(`
        SELECT mg.*, pm.display_order as pm_order
        FROM modifier_groups mg
        JOIN product_modifiers pm ON mg.id = pm.modifier_group_id
        WHERE pm.product_id = ? AND mg.status = 'active'
        ORDER BY pm.display_order, mg.display_order
      `).all(id);

      for (const modifier of modifiers as any[]) {
        modifier.options = db.prepare(`
          SELECT * FROM modifier_options
          WHERE group_id = ? AND status = 'active'
          ORDER BY display_order, name
        `).all(modifier.id);
      }

      (product as any).modifiers = modifiers;
    }

    res.json({ product });
  } catch (error: any) {
    console.error('Get product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle favorite
router.patch('/:id/favorite', (req, res) => {
  try {
    const { id } = req.params;

    const product = db.prepare('SELECT is_favorite FROM products WHERE id = ?').get(id) as any;

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newValue = product.is_favorite ? 0 : 1;

    db.prepare('UPDATE products SET is_favorite = ? WHERE id = ?').run(newValue, id);

    res.json({ success: true, is_favorite: newValue });
  } catch (error: any) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
