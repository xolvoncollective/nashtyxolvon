import { Router } from 'express';
import { query, get, run } from '../db/database';
import { cacheManager } from '../services/CacheManager';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { logMenuOperation } from '../middleware/logging';

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
router.get('/outlet/:outletId', async (req, res) => {
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
    const outlet = await get('SELECT * FROM outlets WHERE id = ?', [outletId]);
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
    const categories = await query(`
      SELECT id, name, slug, description, icon, color, display_order, status
      FROM categories
      WHERE tenant_id = ? AND status = 'active'
      ORDER BY display_order, name
    `, [tenantId]);

    // Get all products (including sold out for POS to show as disabled)
    const items = await query(`
      SELECT p.id, p.name, p.slug, p.description, p.price, p.cost, p.image_url,
             p.category_id, p.is_favorite, p.has_modifiers, p.stock_tracking,
             p.stock_qty, p.production_time, p.status
      FROM products p
      WHERE p.tenant_id = ? AND p.status IN ('active', 'soldout')
      ORDER BY p.is_favorite DESC, p.name
    `, [tenantId]);

    // Get all modifier groups for the tenant
    const modifierGroups = await query(`
      SELECT mg.id, mg.name, mg.description, mg.type, mg.required,
             mg.min_select, mg.max_select, mg.display_order
      FROM modifier_groups mg
      WHERE mg.tenant_id = ? AND mg.status = 'active'
      ORDER BY mg.display_order, mg.name
    `, [tenantId]);

    // Get modifier options for each group
    for (const group of modifierGroups as any[]) {
      group.options = await query(`
        SELECT id, name, price_adjustment, display_order
        FROM modifier_options
        WHERE group_id = ? AND status = 'active'
        ORDER BY display_order, name
      `, [group.id]);
    }

    // Map modifier groups to products that have modifiers
    for (const item of items as any[]) {
      if (item.has_modifiers) {
        item.modifier_groups = await query(`
          SELECT mg.id, mg.name, mg.description, mg.type, mg.required,
                 mg.min_select, mg.max_select
          FROM modifier_groups mg
          JOIN product_modifiers pm ON mg.id = pm.modifier_group_id
          WHERE pm.product_id = ? AND mg.status = 'active'
          ORDER BY pm.display_order, mg.display_order
        `, [item.id]);

        for (const group of item.modifier_groups) {
          group.options = await query(`
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
    const stations = await query(`
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

// Zod schema for menu item creation (Requirements 6.2, 9.7)
const CreateMenuItemSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  outletId: z.string().min(1, 'Outlet ID is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
  name: z.string().min(1, 'Item name is required'),
  price: z.number().nonnegative('Price cannot be negative'),
  cost: z.number().nonnegative('Cost cannot be negative').optional().nullable(),
  sku: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  emoji: z.string().optional().nullable(),
  isFavorite: z.boolean().optional().default(false),
  hasModifiers: z.boolean().optional().default(false),
  stockTracking: z.boolean().optional().default(false),
  stockQty: z.number().int().nonnegative('Stock quantity cannot be negative').optional().default(0),
  productionTime: z.number().int().positive('Production time must be positive').optional().default(10),
  stationId: z.string().optional().nullable()
});

// Route 18: POST /api/menu/items — Create menu item
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 14.5
router.post('/items', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('[INFO] POST /api/menu/items - Creating menu item');

    // Validate request body against Zod schema (Requirement 6.2)
    const validationResult = CreateMenuItemSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      // Return 400 Bad Request with structured validation errors (Requirement 6.2, 9.1, 9.2)
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      console.log('[WARN] Menu item validation failed:', errors);
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errors 
      });
    }

    // Extract validated data
    const {
      tenantId,
      outletId,
      categoryId,
      name,
      price,
      cost = null,
      sku = null,
      description = null,
      imageUrl = null,
      emoji = null,
      isFavorite = false,
      hasModifiers = false,
      stockTracking = false,
      stockQty = 0,
      productionTime = 10,
      stationId = null
    } = validationResult.data;

    // Generate unique item ID and slug
    const itemId = randomUUID();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Insert item into menu_items (products) table (Requirement 6.3)
    await run(`
      INSERT INTO products (
        id, tenant_id, category_id, name, slug, description, 
        price, cost, sku, image_url, is_favorite, has_modifiers, 
        stock_tracking, stock_qty, production_time, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [
      itemId, tenantId, categoryId, name, slug, description,
      price, cost || 0, sku, imageUrl, isFavorite ? 1 : 0, hasModifiers ? 1 : 0,
      stockTracking ? 1 : 0, stockQty, productionTime
    ]);

    // Invalidate all menu caches across outlets since products are tenant-wide
    // (Requirement 6.4)
    cacheManager.invalidatePattern('menu:*');
    console.log(`[INFO] All menu caches invalidated after menu item creation`);

    // Retrieve the created item with category information
    const createdItem = await get(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `, [itemId]);

    const responseTime = Date.now() - startTime;

    // Log menu creation (Task 22.3 - Requirement 14.5)
    logMenuOperation(itemId, name, 'create');

    // Return 201 Created with item_id and created item (Requirement 6.5)
    res.status(201).json({
      success: true,
      item_id: itemId,
      item: createdItem,
      responseTime: `${responseTime}ms`
    });

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    // Log error (Requirement 14.3)
    console.error(`[ERROR] Create menu item error (${responseTime}ms):`, error);
    
    // Return 500 Internal Server Error (Requirement 9.4)
    res.status(500).json({ 
      success: false,
      error: error.message,
      responseTime: `${responseTime}ms`
    });
  }
});

// Zod schema for menu item updates (Requirements 6.6, 6.7, 6.8, 9.7)
const UpdateMenuItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').optional(),
  price: z.number().nonnegative('Price cannot be negative').optional(),
  cost: z.number().nonnegative('Cost cannot be negative').optional().nullable(),
  sku: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  emoji: z.string().optional().nullable(),
  isFavorite: z.boolean().optional(),
  hasModifiers: z.boolean().optional(),
  stockTracking: z.boolean().optional(),
  stockQty: z.number().int().nonnegative('Stock quantity cannot be negative').optional(),
  productionTime: z.number().int().positive('Production time must be positive').optional(),
  status: z.enum(['active', 'inactive', 'soldout']).optional(),
  categoryId: z.string().optional()
}).strict();

// Route 19: PATCH /api/menu/items/:id — Update menu item
// Requirements: 6.6, 6.7, 6.8, 14.5
router.patch('/items/:id', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { id: itemId } = req.params;

    console.log(`[INFO] PATCH /api/menu/items/${itemId} - Updating menu item`);

    // Validate itemId exists in database (Requirement 6.7)
    const existingItem = await get('SELECT * FROM products WHERE id = ?', [itemId]);
    
    if (!existingItem) {
      console.log(`[WARN] Menu item not found: ${itemId}`);
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    // Validate request body against Zod schema (Requirement 6.6)
    const validationResult = UpdateMenuItemSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      // Return 400 Bad Request with structured validation errors (Requirement 6.6, 9.1, 9.2)
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      console.log('[WARN] Menu item update validation failed:', errors);
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errors 
      });
    }

    const updates = validationResult.data;

    // Build dynamic UPDATE query with only provided fields
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updates.name);
    }
    if (updates.price !== undefined) {
      updateFields.push('price = ?');
      updateValues.push(updates.price);
    }
    if (updates.cost !== undefined) {
      updateFields.push('cost = ?');
      updateValues.push(updates.cost || 0);
    }
    if (updates.sku !== undefined) {
      updateFields.push('sku = ?');
      updateValues.push(updates.sku);
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(updates.description);
    }
    if (updates.imageUrl !== undefined) {
      updateFields.push('image_url = ?');
      updateValues.push(updates.imageUrl);
    }
    if (updates.emoji !== undefined) {
      updateFields.push('emoji = ?');
      updateValues.push(updates.emoji);
    }
    if (updates.isFavorite !== undefined) {
      updateFields.push('is_favorite = ?');
      updateValues.push(updates.isFavorite ? 1 : 0);
    }
    if (updates.hasModifiers !== undefined) {
      updateFields.push('has_modifiers = ?');
      updateValues.push(updates.hasModifiers ? 1 : 0);
    }
    if (updates.stockTracking !== undefined) {
      updateFields.push('stock_tracking = ?');
      updateValues.push(updates.stockTracking ? 1 : 0);
    }
    if (updates.stockQty !== undefined) {
      updateFields.push('stock_qty = ?');
      updateValues.push(updates.stockQty);
    }
    if (updates.productionTime !== undefined) {
      updateFields.push('production_time = ?');
      updateValues.push(updates.productionTime);
    }
    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(updates.status);
    }
    if (updates.categoryId !== undefined) {
      updateFields.push('category_id = ?');
      updateValues.push(updates.categoryId);
    }

    // Always update updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    // If no fields to update, return early
    if (updateFields.length === 1) { // Only updated_at
      console.log(`[WARN] No fields provided for update: ${itemId}`);
      return res.status(400).json({
        success: false,
        error: 'No update fields provided'
      });
    }

    // Update menu_items table with provided fields (Requirement 6.7)
    const updateQuery = `
      UPDATE products
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    updateValues.push(itemId);

    await run(updateQuery, updateValues);

    // Invalidate all menu caches across outlets since products are tenant-wide
    // (Requirement 6.8, 7.3)
    cacheManager.invalidatePattern('menu:*');
    console.log(`[INFO] All menu caches invalidated after menu item update`);

    // Retrieve the updated item with category information
    const updatedItem = await get(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `, [itemId]);

    const responseTime = Date.now() - startTime;

    // Log menu update (Task 22.3 - Requirement 14.5)
    const itemName = updates.name || (existingItem as any).name;
    logMenuOperation(itemId, itemName, 'update');

    // Return 200 OK with updated item (Requirement 6.8)
    res.status(200).json({
      success: true,
      item: updatedItem,
      responseTime: `${responseTime}ms`
    });

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    // Log error (Requirement 14.3)
    console.error(`[ERROR] Update menu item error (${responseTime}ms):`, error);
    
    // Return 500 Internal Server Error (Requirement 9.4)
    res.status(500).json({ 
      success: false,
      error: error.message,
      responseTime: `${responseTime}ms`
    });
  }
});

export default router;
