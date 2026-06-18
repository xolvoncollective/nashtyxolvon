import { Router } from 'express';
import { query, get, run } from '../db/database';
import { insert, update, softDelete } from '../db/persistence';
import crypto from 'crypto';
import { z } from 'zod';

const router = Router();

// Zod validation schemas for product operations (Requirement 9.1, 9.2, 9.7)
const CreateProductSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional().nullable(),
  price: z.number().nonnegative('Price cannot be negative'),
  cost: z.number().nonnegative('Cost cannot be negative').optional().default(0),
  imageUrl: z.string().optional().nullable(),
  hasModifiers: z.boolean().optional().default(false),
  modifierGroupIds: z.array(z.string()).optional().default([]),
  productionTime: z.number().int().positive('Production time must be positive').optional().default(10),
  stockTracking: z.boolean().optional().default(false),
  stockQty: z.number().int().nonnegative('Stock quantity cannot be negative').optional().default(0)
});

const UpdateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  categoryId: z.string().nullable().optional(),
  description: z.string().optional().nullable(),
  price: z.number().nonnegative('Price cannot be negative').optional(),
  cost: z.number().nonnegative('Cost cannot be negative').optional(),
  imageUrl: z.string().optional().nullable(),
  hasModifiers: z.boolean().optional(),
  modifierGroupIds: z.array(z.string()).optional(),
  productionTime: z.number().int().positive('Production time must be positive').optional(),
  stockTracking: z.boolean().optional(),
  stockQty: z.number().int().nonnegative('Stock quantity cannot be negative').optional()
}).strict();

// GET /api/products — Get all products with filters
router.get('/', (req, res) => {
  try {
    const { tenantId, categoryId, search, status = 'all' } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let sql = `
      SELECT p.*, c.name as category_name, c.color as category_color
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.tenant_id = ? AND p.deleted_at IS NULL
    `;

    const params: any[] = [tenantId];

    if (categoryId) {
      sql += ` AND p.category_id = ?`;
      params.push(categoryId);
    }

    if (status && status !== 'all') {
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
      WHERE p.id = ? AND p.deleted_at IS NULL
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
        WHERE pm.product_id = ? AND mg.status = 'active' AND mg.deleted_at IS NULL
        ORDER BY pm.display_order, mg.display_order
      `, [id]);

      for (const modifier of (product as any).modifiers as any[]) {
        modifier.options = query(`
          SELECT * FROM modifier_options
          WHERE group_id = ? AND status = 'active' AND deleted_at IS NULL
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

    const product = get('SELECT is_favorite FROM products WHERE id = ? AND deleted_at IS NULL', [id]) as any;

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newValue = product.is_favorite ? 0 : 1;
    update('products', id, { is_favorite: newValue });

    res.json({ success: true, is_favorite: newValue });
  } catch (error: any) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 12: POST /api/products — Create product
router.post('/', (req, res) => {
  try {
    console.log('[INFO] POST /api/products - Creating product');

    // Validate request body against Zod schema (Requirement 9.1, 9.2)
    const validationResult = CreateProductSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      // Return structured validation errors (Requirement 9.1, 9.2)
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      console.log('[WARN] Product validation failed:', errors);
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errors 
      });
    }

    const { tenantId, categoryId, name, description, price, cost, imageUrl, hasModifiers, modifierGroupIds, productionTime, stockTracking, stockQty } = validationResult.data;

    const productId = crypto.randomUUID();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    insert('products', {
      id: productId,
      tenant_id: tenantId,
      category_id: categoryId,
      name,
      slug,
      description: description || null,
      price,
      cost,
      image_url: imageUrl || null,
      has_modifiers: hasModifiers ? 1 : 0,
      production_time: productionTime,
      status: 'active',
      stock_tracking: stockTracking ? 1 : 0,
      stock_qty: stockQty
    });

    // Link modifier groups if provided
    if (modifierGroupIds && modifierGroupIds.length > 0) {
      for (let i = 0; i < modifierGroupIds.length; i++) {
        insert('product_modifiers', {
          product_id: productId,
          modifier_group_id: modifierGroupIds[i],
          display_order: i + 1
        });
      }
    }

    const product = get('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [productId]);

    // Log activity (Requirement 14.5)
    console.log(`[INFO] Product created - product_id: ${productId}, name: "${name}", price: ${price}`);
    insert('activity_logs', {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      user_id: (req as any).user?.id || null,
      action: 'create',
      entity_type: 'product',
      entity_id: productId,
      description: `Produk "${name}" ditambahkan (Rp ${price.toLocaleString()})`
    });

    res.status(201).json({ success: true, product });
  } catch (error: any) {
    console.error('[ERROR] Create product error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Route 13: PUT /api/products/:id — Update product
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;

    console.log(`[INFO] PUT /api/products/${id} - Updating product`);

    const existing = get('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing) {
      console.log(`[WARN] Product not found: ${id}`);
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }

    // Validate request body against Zod schema (Requirement 9.1, 9.2)
    const validationResult = UpdateProductSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      // Return structured validation errors (Requirement 9.1, 9.2)
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      console.log('[WARN] Product update validation failed:', errors);
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errors 
      });
    }

    const { name, categoryId, description, price, cost, imageUrl, hasModifiers, modifierGroupIds, productionTime, stockTracking, stockQty } = validationResult.data;

    const updates: Record<string, any> = {};

    if (name) {
      updates['name'] = name;
      updates['slug'] = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (categoryId !== undefined) updates['category_id'] = categoryId || null;
    if (description !== undefined) updates['description'] = description;
    if (price !== undefined) updates['price'] = price;
    if (cost !== undefined) updates['cost'] = cost;
    if (imageUrl !== undefined) updates['image_url'] = imageUrl;
    if (hasModifiers !== undefined) updates['has_modifiers'] = hasModifiers ? 1 : 0;
    if (productionTime !== undefined) updates['production_time'] = productionTime;
    if (stockTracking !== undefined) updates['stock_tracking'] = stockTracking ? 1 : 0;
    if (stockQty !== undefined) updates['stock_qty'] = stockQty;

    update('products', id, updates);

    // Update modifier group links if provided
    if (modifierGroupIds && Array.isArray(modifierGroupIds)) {
      run('DELETE FROM product_modifiers WHERE product_id = ?', [id]);
      for (let i = 0; i < modifierGroupIds.length; i++) {
        insert('product_modifiers', {
          product_id: id,
          modifier_group_id: modifierGroupIds[i],
          display_order: i + 1
        });
      }
    }

    const product = get('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [id]);

    // Log activity (Requirement 14.5)
    console.log(`[INFO] Product updated - product_id: ${id}, name: "${(existing as any).name}"`);
    insert('activity_logs', {
      id: crypto.randomUUID(),
      tenant_id: (existing as any).tenant_id,
      user_id: (req as any).user?.id || null,
      action: 'update',
      entity_type: 'product',
      entity_id: id,
      description: `Produk "${(existing as any).name}" diperbarui`
    });

    res.json({ success: true, product });
  } catch (error: any) {
    console.error('[ERROR] Update product error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
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

    const existing = get('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    update('products', id, { status });

    const statusLabels: Record<string, string> = { active: 'diaktifkan', inactive: 'dinonaktifkan', soldout: 'ditandai habis' };

    // Log activity
    insert('activity_logs', {
      id: crypto.randomUUID(),
      tenant_id: (existing as any).tenant_id,
      user_id: (req as any).user?.id || null,
      action: 'update',
      entity_type: 'product',
      entity_id: id,
      description: `Produk "${(existing as any).name}" ${statusLabels[status]}`
    });

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

    const existing = get('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    softDelete('products', id);

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

    const original = get('SELECT * FROM products WHERE id = ? AND deleted_at IS NULL', [id]) as any;
    if (!original) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newId = crypto.randomUUID();
    const newName = `${original.name} (Copy)`;
    const newSlug = `${original.slug}-copy-${Date.now()}`;

    insert('products', {
      id: newId,
      tenant_id: original.tenant_id,
      category_id: original.category_id,
      name: newName,
      slug: newSlug,
      description: original.description,
      price: original.price,
      cost: original.cost,
      image_url: original.image_url,
      has_modifiers: original.has_modifiers,
      production_time: original.production_time,
      status: 'active'
    });

    // Copy modifier links
    const modLinks = query('SELECT * FROM product_modifiers WHERE product_id = ?', [id]);
    for (const link of modLinks as any[]) {
      insert('product_modifiers', {
        product_id: newId,
        modifier_group_id: link.modifier_group_id,
        display_order: link.display_order
      });
    }

    const product = get('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [newId]);

    res.status(201).json({ success: true, product });
  } catch (error: any) {
    console.error('Duplicate product error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
