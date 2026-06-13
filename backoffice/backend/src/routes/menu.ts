import { Router } from 'express';
import { query, get } from '../db/database';

const router = Router();

// Route 17: GET /api/menu/outlet/:outletId — Full menu tree for POS
router.get('/outlet/:outletId', (req, res) => {
  try {
    const { outletId } = req.params;

    // Get tenant from outlet
    const outlet = get('SELECT * FROM outlets WHERE id = ?', [outletId]);
    if (!outlet) {
      return res.status(404).json({ error: 'Outlet not found' });
    }

    const tenantId = (outlet as any).tenant_id;

    // Get all active categories
    const categories = query(`
      SELECT id, name, slug, description, icon, color, display_order
      FROM categories
      WHERE tenant_id = ? AND status = 'active'
      ORDER BY display_order, name
    `, [tenantId]);

    // Get all active products
    const items = query(`
      SELECT p.id, p.name, p.slug, p.description, p.price, p.cost, p.image_url,
             p.category_id, p.is_favorite, p.has_modifiers, p.stock_tracking,
             p.stock_qty, p.production_time, p.status
      FROM products p
      WHERE p.tenant_id = ? AND p.status = 'active'
      ORDER BY p.is_favorite DESC, p.name
    `, [tenantId]);

    // Get modifier groups and options for products that have modifiers
    for (const item of items as any[]) {
      if (item.has_modifiers) {
        item.modifier_groups = query(`
          SELECT mg.id, mg.name, mg.description, mg.type, mg.required,
                 mg.min_select, mg.max_select
          FROM modifier_groups mg
          JOIN product_modifiers pm ON mg.id = pm.modifier_group_id
          WHERE pm.product_id = ? AND mg.status = 'active'
          ORDER BY pm.display_order, mg.display_order
        `, [item.id]);

        for (const group of item.modifier_groups) {
          group.options = query(`
            SELECT id, name, price_adjustment, display_order
            FROM modifier_options
            WHERE group_id = ? AND status = 'active'
            ORDER BY display_order, name
          `, [group.id]);
        }
      } else {
        item.modifier_groups = [];
      }
    }

    res.json({
      success: true,
      data: {
        outlet: {
          id: (outlet as any).id,
          name: (outlet as any).name,
          address: (outlet as any).address,
          phone: (outlet as any).phone
        },
        categories,
        items
      }
    });
  } catch (error: any) {
    console.error('Get menu error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
