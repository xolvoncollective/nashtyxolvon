import { Router } from 'express';
import { query, get, run, transaction } from '../db/database';
import crypto from 'crypto';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { logOrderCreation, logOrderStatusUpdate } from '../middleware/logging';
import { OrderService } from '../services/OrderService';

const router = Router();

// Zod validation schemas for order creation
const OrderItemModifierSchema = z.object({
  groupId: z.string().min(1, 'Modifier group ID is required'),
  groupName: z.string().min(1, 'Modifier group name is required'),
  optionId: z.string().min(1, 'Modifier option ID is required'),
  optionName: z.string().min(1, 'Modifier option name is required'),
  priceAdjustment: z.number().optional().default(0)
});

const OrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  subtotal: z.number().nonnegative('Subtotal cannot be negative'),
  notes: z.string().optional().nullable(),
  modifiers: z.array(OrderItemModifierSchema).optional().default([])
});

const PaymentSchema = z.object({
  method: z.string().min(1, 'Payment method is required'),
  amount: z.number().nonnegative('Payment amount cannot be negative'),
  change: z.number().nonnegative('Change amount cannot be negative').optional().default(0),
  platformRef: z.string().optional()
});

const CreateOrderSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  outletId: z.string().min(1, 'Outlet ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  shiftId: z.string().optional().nullable(),
  orderType: z.enum(['dine-in', 'takeaway', 'gofood', 'grabfood', 'shopeefood', 'dine_in', 'take_away', 'shopee', 'dine', 'take'], {
    errorMap: () => ({ message: 'Invalid order type' })
  }),
  tableNumber: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  items: z.array(OrderItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().nonnegative('Subtotal cannot be negative'),
  discount: z.number().nonnegative('Discount cannot be negative').optional().default(0),
  tax: z.number().nonnegative('Tax cannot be negative').optional().default(0),
  serviceCharge: z.number().nonnegative('Service charge cannot be negative').optional().default(0),
  total: z.number().positive('Total must be positive'),
  paymentMethod: z.string().optional().nullable(),
  payments: z.array(PaymentSchema).min(1, 'At least one payment is required'),
  notes: z.string().optional().nullable()
});

// Helper removed, using inline sequence generator in route

// POST /api/orders — Create new order with validation
router.post('/', (req, res) => {
  try {
    console.log('--- POST /api/orders PAYLOAD ---', JSON.stringify(req.body, null, 2));
    // Hack: bypassing strict schema for now as we added customerPhone
    // but the schema might reject it. So we pass req.body directly to OrderService
    const validationResult = CreateOrderSchema.safeParse(req.body);
    
    // Merge customerPhone from req.body since schema doesn't have it
    let dataToPass = req.body;
    if (validationResult.success) {
      dataToPass = validationResult.data;
      dataToPass.customerPhone = req.body.customerPhone;
    } else {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return res.status(400).json({ success: false, error: 'Validation failed', errors });
    }

    const order = OrderService.createOrder(dataToPass);
    res.status(201).json({ success: true, order });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/orders — Get orders (for history and KDS)
router.get('/', (req, res) => {
  try {
    const { tenantId, outletId, status, kitchenStatus, limit = 50, offset = 0, dateFrom, dateTo } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let sql = `
      SELECT o.*, u.name as cashier_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.tenant_id = ?
    `;
    const params: any[] = [tenantId];

    if (outletId) { sql += ' AND o.outlet_id = ?'; params.push(outletId); }
    if (status) { sql += ' AND o.order_status = ?'; params.push(status); }
    if (kitchenStatus) { sql += ' AND o.kitchen_status = ?'; params.push(kitchenStatus); }
    if (dateFrom) { sql += ' AND DATE(o.created_at) >= DATE(?)'; params.push(dateFrom); }
    if (dateTo) { sql += ' AND DATE(o.created_at) <= DATE(?)'; params.push(dateTo); }

    sql += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const orders = query(sql, params);

    // Get items for each order
    for (const order of orders as any[]) {
      order.items = query(`
        SELECT oi.id, oi.product_id, oi.product_name as name, oi.quantity,
               oi.unit_price, oi.subtotal, oi.notes, oi.kitchen_status as item_status,
               (SELECT GROUP_CONCAT(modifier_option_name, ', ')
                FROM order_item_modifiers WHERE order_item_id = oi.id) as modifier_names,
               (SELECT json_group_array(json_object('optionName', modifier_option_name, 'priceAdjustment', price_adjustment))
                FROM order_item_modifiers WHERE order_item_id = oi.id) as modifiers
        FROM order_items oi
        WHERE oi.order_id = ?
      `, [order.id]);
    }

    res.json({ success: true, orders });
  } catch (error: any) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/:id — Get order by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const order = get(`
      SELECT o.*, u.name as cashier_name
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [id]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get items
    const items = query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    for (const item of items as any[]) {
      item.modifiers = query('SELECT * FROM order_item_modifiers WHERE order_item_id = ?', [item.id]);
    }
    (order as any).items = items;

    // Get payments
    (order as any).payments = query('SELECT * FROM payments WHERE order_id = ?', [id]);

    res.json({ order });
  } catch (error: any) {
    console.error('Get order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/orders/:id/status — Update order status
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, kitchenStatus } = req.body;

    OrderService.updateOrderStatus(id, orderStatus, kitchenStatus);

    res.json({ success: true, message: 'Status berhasil diperbarui' });
  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 24: PUT /api/orders/:id/void — Void order
router.put('/:id/void', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, voidBy, managerPin } = req.body;

    if (!reason || !managerPin) {
      return res.status(400).json({ error: 'Reason and Manager PIN are required for voiding an order' });
    }

    const order = await OrderService.voidOrder(id, reason, voidBy, managerPin);

    res.json({ success: true, message: `Order ${order.order_number} berhasil di-void` });
  } catch (error: any) {
    console.error('Void order error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Route 25: GET /api/orders/shift/:shiftId — Orders per shift
router.get('/shift/:shiftId', (req, res) => {
  try {
    const { shiftId } = req.params;

    const orders = OrderService.getOrdersByShift(shiftId);

    res.json({ success: true, orders });
  } catch (error: any) {
    console.error('Get shift orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 26: GET /api/orders/config/:outletId — POS config
router.get('/config/:outletId', (req, res) => {
  try {
    const { outletId } = req.params;

    const outlet = get('SELECT * FROM outlets WHERE id = ?', [outletId]) as any;
    if (!outlet) {
      return res.status(404).json({ error: 'Outlet not found' });
    }

    // Get settings
    const settings = query(`
      SELECT key, value, type FROM settings
      WHERE (tenant_id = ? AND outlet_id = ?) OR (tenant_id = ? AND outlet_id IS NULL)
      ORDER BY key
    `, [outlet.tenant_id, outletId, outlet.tenant_id]);

    const settingsMap: Record<string, any> = {};
    for (const s of settings as any[]) {
      if (s.type === 'boolean') settingsMap[s.key] = s.value === 'true';
      else if (s.type === 'number') settingsMap[s.key] = Number(s.value);
      else settingsMap[s.key] = s.value;
    }

    // Get active payment methods
    const paymentMethods = query(`
      SELECT id, name, type, icon, display_order
      FROM payment_methods
      WHERE tenant_id = ? AND status = 'active'
      ORDER BY display_order
    `, [outlet.tenant_id]);

    res.json({
      success: true,
      config: {
        outlet: { id: outlet.id, name: outlet.name, address: outlet.address, phone: outlet.phone },
        taxRate: settingsMap.tax_rate || 11,
        taxEnabled: settingsMap.tax_enabled !== false,
        serviceChargeRate: settingsMap.service_charge_rate || 0,
        serviceChargeEnabled: settingsMap.service_charge_enabled || false,
        receiptHeader: settingsMap.receipt_header || outlet.name,
        receiptFooter: settingsMap.receipt_footer || 'Terima kasih!',
        kdsWarnThreshold: settingsMap.kds_warn_threshold || 10,
        kdsUrgentThreshold: settingsMap.kds_urgent_threshold || 20,
        paymentMethods
      }
    });
  } catch (error: any) {
    console.error('Get POS config error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 27: PATCH /api/orders/:id/items/:itemId/status — Update per-item KDS status
router.patch('/:id/items/:itemId/status', (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { status } = req.body;

    OrderService.updateOrderItemStatus(id, itemId, status);

    res.json({ success: true, message: 'Item status berhasil diperbarui' });
  } catch (error: any) {
    console.error('Update item status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 28: GET /api/orders/kitchen/queue — Optimized KDS queue
router.get('/kitchen/queue', (req, res) => {
  try {
    const { tenantId, outletId, stationId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    const { orders, total } = OrderService.getKitchenQueue(tenantId as string, outletId as string, stationId as string);

    res.json({ success: true, orders, total });
  } catch (error: any) {
    console.error('Kitchen queue error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 29: GET /api/orders/kitchen/stats — Kitchen stats
router.get('/kitchen/stats', (req, res) => {
  try {
    const { tenantId, outletId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    const stats = OrderService.getKitchenStats(tenantId as string, outletId as string);

    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error('Kitchen stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 30: GET /api/orders/kitchen/completed — Completed orders today
router.get('/kitchen/completed', (req, res) => {
  try {
    const { tenantId, outletId, limit = 20 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    const orders = OrderService.getCompletedOrders(tenantId as string, outletId as string, Number(limit));

    res.json({ success: true, orders });
  } catch (error: any) {
    console.error('Completed orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 31: POST /api/orders/:id/refund — Refund order
router.post('/:id/refund', (req, res) => {
  try {
    const { id } = req.params;
    const { reason, refundAmount, refundBy } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required for refund' });
    }

    const result = OrderService.refundOrder(id, reason, refundAmount, refundBy);

    res.json({ success: true, message: `Refund Rp ${result.amount.toLocaleString()} untuk order ${result.order.order_number} berhasil diproses` });
  } catch (error: any) {
    console.error('Refund order error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
