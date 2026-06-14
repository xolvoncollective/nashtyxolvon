import { Router } from 'express';
import { query, get } from '../db/database';
import { cacheManager } from '../services/CacheManager';

const router = Router();

// Interface for MenuTree structure (Requirements 5.5, 5.7)
interface MenuTree {
  outlet: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  categories: any[];
  items: any[];
  modifierGroups: any[];
  stations: any[];
}

// Route 17: GET /api/menu/outlet/:outletId — Full menu tree for POS with caching
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 10.2, 10.3, 10.4, 10.5, 10.6, 12.2, 12.4, 16.1
router.get('/outlet/:outletId', (req, res) => {
  const startTime = Date.now();
  
  try {
    const { outletId } = req.params;

    // Validate outletId (Requirement 12.5)
    if (!outletId || typeof outletId !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid outlet ID' 
      });
    }

    // Check cache for menu data (Requirement 5.2)
    const cacheKey = `menu:outlet:${outletId}`;
    const cachedMenu = cacheManager.get<MenuTree>(cacheKey);

    // Return cached data if available and not expired (Requirement 5.3)
    if (cachedMenu) {
      const responseTime = Date.now() - startTime;
      console.log(`[INFO] Menu cache HIT for outlet ${outletId} - ${responseTime}ms`);
      
      return res.json({
        success: true,
        data: cachedMenu,
        cached: true,
        responseTime: `${responseTime}ms`
      });
    }

    // Cache miss - query database (Requirement 5.4)
    console.log(`[INFO] Menu cache MISS for outlet ${outletId} - querying database`);

    // Validate outlet exists and get tenant (Requirement 12.5)
    const outlet = get('SELECT * FROM outlets WHERE id = ?', [outletId]);
    if (!outlet) {
      return res.status(404).json({ 
        success: false,
        error: 'Outlet not found' 
      });
    }

    const tenantId = (outlet as any).tenant_id;

    // Query database for all menu components (Requirement 5.4)
    // Filter all data by tenant_id for multi-outlet isolation (Requirement 12.2, 12.4)
    
    // Get all active categories
    const categories = query(`
      SELECT id, name, slug, description, icon, color, display_order, status
      FROM categories
      WHERE tenant_id = ? AND status = 'active'
      ORDER BY display_order, name
    `, [tenantId]);

    // Get all products (including sold out for POS to show as disabled)
    const items = query(`
      SELECT p.id, p.name, p.slug, p.description, p.price, p.cost, p.image_url,
             p.category_id, p.is_favorite, p.has_modifiers, p.stock_tracking,
             p.stock_qty, p.production_time, p.status
      FROM products p
      WHERE p.tenant_id = ?
      ORDER BY p.is_favorite DESC, p.name
    `, [tenantId]);

    // Get all modifier groups for the tenant
    const modifierGroups = query(`
      SELECT mg.id, mg.name, mg.description, mg.type, mg.required,
             mg.min_select, mg.max_select, mg.display_order
      FROM modifier_groups mg
      WHERE mg.tenant_id = ? AND mg.status = 'active'
      ORDER BY mg.display_order, mg.name
    `, [tenantId]);

    // Get modifier options for each group
    for (const group of modifierGroups as any[]) {
      group.options = query(`
        SELECT id, name, price_adjustment, display_order
        FROM modifier_options
        WHERE group_id = ? AND status = 'active'
        ORDER BY display_order, name
      `, [group.id]);
    }

    // Map modifier groups to products that have modifiers
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

    // Get kitchen stations for the outlet (Requirement 5.7)
    const stations = query(`
      SELECT id, name, display_order, status
      FROM stations
      WHERE outlet_id = ? AND status = 'active'
      ORDER BY display_order, name
    `, [outletId]);

    // Assemble MenuTree structure (Requirement 5.5)
    const menuTree: MenuTree = {
      outlet: {
        id: (outlet as any).id,
        name: (outlet as any).name,
        address: (outlet as any).address,
        phone: (outlet as any).phone
      },
      categories,
      items,
      modifierGroups,
      stations
    };

    // Store in cache with 5-minute TTL (300 seconds) (Requirement 5.6, 10.5)
    const MENU_CACHE_TTL = 300; // 5 minutes in seconds (300000ms)
    cacheManager.set(cacheKey, menuTree, MENU_CACHE_TTL);

    const responseTime = Date.now() - startTime;
    console.log(`[INFO] Menu fetched from database for outlet ${outletId} - ${responseTime}ms`);
    
    // Log warning if response time exceeds 200ms (Requirement 16.1)
    if (responseTime > 200) {
      console.warn(`[WARN] Menu response time exceeded 200ms threshold: ${responseTime}ms for outlet ${outletId}`);
    }

    // Return MenuTree in response (Requirement 5.7)
    res.json({
      success: true,
      data: menuTree,
      cached: false,
      responseTime: `${responseTime}ms`
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error(`[ERROR] Get menu error (${responseTime}ms):`, error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      responseTime: `${responseTime}ms`
    });
  }
});

export default router;
