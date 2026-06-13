import { Router } from 'express';
import { query } from '../db/database';

const router = Router();

// Get all categories
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

// Get category by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const category = query(`
      SELECT * FROM categories WHERE id = ?
    `, [id])[0] || null;

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error: any) {
    console.error('Get category error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
