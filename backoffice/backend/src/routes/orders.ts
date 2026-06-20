import { Router } from 'express';
import { query, get, run, transaction } from '../db/database';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { logOrderCreation, logOrderStatusUpdate } from '../middleware/logging';

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
  items: z.array(OrderItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().nonnegative('Subtotal cannot be negative'),
  discount: z.number().nonnegative('Discount cannot be negative').optional().default(0),
  tax: z.number().nonnegative('Tax cannot be negative').optional().default(0),
  serviceCharge: z.number().nonnegative('Service charge cannot be negative').optional().default(0),
  total: z.number().positive('Total must be positive'),
  paymentMethod: z.string().optional().nullable(),
  isOpenBill: z.boolean().optional().default(false),
  payments: z.array(PaymentSchema).optional().default([]),
  notes: z.string().optional().nullable(),
  customerName: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable()
});

// Helper removed, using inline sequence generator in route

// POST /api/orders — Create new order with validation
router.post('/', async (req, res) => {
  try {
    console.log('--- POST /api/orders PAYLOAD ---', JSON.stringify(req.body, null, 2));
    // Validate request body against Zod schema
    const validationResult = CreateOrderSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      // Return structured validation errors
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed',
        errors 
      });
    }

    // Extract validated data
    const {
      tenantId, outletId, shiftId = null, userId,
      orderType, tableNumber = null, items,
      subtotal, discount = 0, tax = 0, serviceCharge = 0, total,
      paymentMethod = null, payments, notes = null,
      customerName = null, customerPhone = null
    } = validationResult.data;

    // Generate sequential order number
    const seqResult = await get(`
      SELECT COUNT(*) as count FROM orders 
      WHERE outlet_id = ? AND DATE(created_at, 'localtime') = DATE('now', 'localtime')
    `, [outletId]) as any;
    const seq = ((seqResult?.count || 0) + 1).toString().padStart(4, '0');
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const orderNumber = `SNY-${dateStr}-${seq}`;
    const orderId = randomUUID();

    // SERVER-SIDE RECALCULATION TO PREVENT PRICE MANIPULATION
    let calculatedSubtotal = 0;
    for (const item of items) {
      const product = await get('SELECT price, stock_tracking, stock_qty FROM products WHERE id = ?', [item.productId]) as any;
      
      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Product with ID ${item.productId} (${item.productName}) not found or unavailable.`
        });
      }

      let itemPrice = product.price;
      if (item.modifiers) {
        for (const mod of item.modifiers) {
          itemPrice += mod.priceAdjustment || 0;
        }
      }
      item.unitPrice = itemPrice;
      item.subtotal = itemPrice * item.quantity;
      
      // Negative stock validation
      if (product.stock_tracking === 1 && product.stock_qty < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          error: `Stok tidak mencukupi untuk ${item.productName}. Sisa stok: ${product.stock_qty}` 
        });
      }

      calculatedSubtotal += item.subtotal;
    }
    const validDiscount = Math.min(discount, calculatedSubtotal);
    const baseAmount = calculatedSubtotal - validDiscount;

    // Fetch tax and service charge config
    const settings = await query(`
      SELECT key, value, type FROM settings
      WHERE (tenant_id = ? AND outlet_id = ?) OR (tenant_id = ? AND outlet_id IS NULL)
    `, [tenantId, outletId, tenantId]) as any[];

    const settingsMap: Record<string, any> = {};
    for (const s of settings) {
      if (s.type === 'boolean') settingsMap[s.key] = s.value === 'true';
      else if (s.type === 'number') settingsMap[s.key] = Number(s.value);
      else settingsMap[s.key] = s.value;
    }

    const taxRate = settingsMap.tax_enabled !== false ? (settingsMap.tax_rate || 11) : 0;
    const scRate = settingsMap.service_charge_enabled ? (settingsMap.service_charge_rate || 0) : 0;

    const calculatedTax = Math.round(baseAmount * (taxRate / 100));
    const calculatedServiceCharge = Math.round(baseAmount * (scRate / 100));
    
    const calculatedTotal = baseAmount + calculatedTax + calculatedServiceCharge;

    // Open bill: no payment required yet
    const isOpenBill = validationResult.data.isOpenBill || false;

    // Validate payment amounts
    const totalPaid = (payments && payments.length > 0) ? payments.reduce((sum, p) => sum + p.amount - (p.change || 0), 0) : 0;
    const paymentStatus = isOpenBill ? 'pending' : (totalPaid >= calculatedTotal ? 'paid' : 'pending');
    const orderStatus = isOpenBill ? 'open_bill' : 'confirmed';
    const kitchenStatus = isOpenBill ? 'pending' : 'pending';

    // Map order type
    const orderTypeMap: Record<string, string> = {
      'dine_in': 'dine-in', 'take_away': 'takeaway',
      'gofood': 'gofood', 'grabfood': 'grabfood',
      'shopee': 'shopeefood', 'shopeefood': 'shopeefood',
      'dine-in': 'dine-in', 'takeaway': 'takeaway',
      'dine': 'dine-in', 'take': 'takeaway'
    };
    const mappedOrderType = orderTypeMap[orderType] || orderType;

    const doTransaction = async () => {
      // Insert order
      await run(`
        INSERT INTO orders (
          id, tenant_id, outlet_id, shift_id, user_id, order_number,
          order_type, table_number, customer_name, customer_phone, subtotal, discount, tax, service_charge,
          total, payment_method, payment_status, order_status, kitchen_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId, tenantId, outletId, shiftId, userId, orderNumber,
        mappedOrderType, tableNumber, customerName, customerPhone, calculatedSubtotal, validDiscount, calculatedTax, calculatedServiceCharge,
        calculatedTotal, paymentMethod, paymentStatus, orderStatus, kitchenStatus, notes
      ]);

      // CRM points / member registration
      if (customerPhone) {
        const cleanPhone = customerPhone.replace(/\D/g, '');
        if (cleanPhone) {
          let member = await get('SELECT id, points, total_spent, visit_count FROM members WHERE tenant_id = ? AND phone = ?', [tenantId, cleanPhone]) as any;
          const pointsEarned = Math.floor(calculatedTotal / 10000); // 1 point for every Rp 10.000 spent
          
          if (!member) {
            const memberId = randomUUID();
            const defaultName = customerName || 'Pelanggan Baru';
            await run(`
              INSERT INTO members (id, tenant_id, name, phone, points, total_spent, visit_count, segment, status)
              VALUES (?, ?, ?, ?, ?, ?, 1, 'new', 'active')
            `, [memberId, tenantId, defaultName, cleanPhone, pointsEarned, calculatedTotal]);
            
            await run(`
              INSERT INTO activity_logs (id, tenant_id, action, entity_type, entity_id, description)
              VALUES (?, ?, 'member_registered', 'member', ?, ?)
            `, [randomUUID(), tenantId, memberId, `Member baru terdaftar via POS checkout: ${defaultName} (${cleanPhone})`]);
          } else {
            const newSpent = (member.total_spent || 0) + calculatedTotal;
            const newVisits = (member.visit_count || 0) + 1;
            const newPoints = (member.points || 0) + pointsEarned;
            
            let newSegment = 'new';
            if (newVisits > 30) newSegment = 'vip';
            else if (newVisits > 15) newSegment = 'loyal';
            else if (newVisits > 5) newSegment = 'regular';
            
            await run(`
              UPDATE members
              SET points = ?,
                  total_spent = ?,
                  visit_count = ?,
                  segment = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `, [newPoints, newSpent, newVisits, newSegment, member.id]);
          }
        }
      }

      // Insert order items
      for (const item of items) {
        const itemId = randomUUID();
        await run(`
          INSERT INTO order_items (
            id, order_id, product_id, product_name, quantity, unit_price, subtotal, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [itemId, orderId, item.productId, item.productName, item.quantity, item.unitPrice, item.subtotal, item.notes || null]);

        // Insert modifiers if any
        if (item.modifiers && item.modifiers.length > 0) {
          for (const mod of item.modifiers) {
            await run(`
              INSERT INTO order_item_modifiers (
                id, order_item_id, modifier_group_id, modifier_group_name,
                modifier_option_id, modifier_option_name, price_adjustment
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [randomUUID(), itemId, mod.groupId, mod.groupName, mod.optionId, mod.optionName, mod.priceAdjustment || 0]);
          }
        }

        // Decrement stock if tracking is enabled
        const product = await get('SELECT stock_tracking FROM products WHERE id = ?', [item.productId]) as any;
        if (product && product.stock_tracking === 1) {
           await run(`
             UPDATE products SET stock_qty = stock_qty - ?, updated_at = ?
             WHERE id = ?
           `, [item.quantity, new Date().toISOString(), item.productId]);
        }
      }

      // Insert payments if not open bill
      if (!isOpenBill && payments && Array.isArray(payments) && payments.length > 0) {
        for (const payment of payments) {
          await run(`
            INSERT INTO payments (id, order_id, method, amount, change_amount, platform_ref)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [randomUUID(), orderId, payment.method, payment.amount, payment.change || 0, payment.platformRef || null]);
        }
      }
    };

    await doTransaction();

    // Log order creation to activity_logs
    try {
      await run(`
        INSERT INTO activity_logs (id, tenant_id, user_id, action, entity_type, entity_id, description, metadata)
        VALUES (?, ?, ?, 'order_created', 'order', ?, ?, ?)
      `, [
        randomUUID(), tenantId, userId, orderId,
        `Order ${orderNumber} dibuat dengan total Rp ${calculatedTotal.toLocaleString()}`,
        JSON.stringify({ orderNumber, total: calculatedTotal })
      ]);

      if (paymentStatus === 'paid') {
        await run(`
          INSERT INTO activity_logs (id, tenant_id, user_id, action, entity_type, entity_id, description, metadata)
          VALUES (?, ?, ?, 'order_paid', 'order', ?, ?, ?)
        `, [
          randomUUID(), tenantId, userId, orderId,
          `Order ${orderNumber} dibayar penuh sebesar Rp ${totalPaid.toLocaleString()} menggunakan ${paymentMethod || 'manual'}`,
          JSON.stringify({ orderNumber, totalPaid, paymentMethod })
        ]);
      }
    } catch (logErr) {
      console.error('Error logging order creation to db:', logErr);
    }

    // Log order creation (Task 22.3 - Requirement 14.4)
    logOrderCreation(orderNumber, orderId, calculatedTotal);

    // Get complete order with items
    const order = await get(`
      SELECT o.*, u.name as cashier_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (!order) {
      // Order was created but couldn't be fetched — return minimal response
      console.error('Order inserted but not found on SELECT. orderId:', orderId);
      return res.status(201).json({ 
        success: true, 
        order: { id: orderId, order_number: orderNumber, total: calculatedTotal, order_status: orderStatus } 
      });
    }

    const orderItems = await query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    for (const item of orderItems as any[]) {
      item.modifiers = await query('SELECT * FROM order_item_modifiers WHERE order_item_id = ?', [item.id]);
    }

    (order as any).items = orderItems;

    res.status(201).json({ success: true, order });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/orders/:id/close-bill — Close an open bill with payment
router.patch('/:id/close-bill', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, payments: billPayments, userId } = req.body;

    const order = await get('SELECT * FROM orders WHERE id = ?', [id]) as any;
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    if (order.order_status !== 'open_bill') {
      return res.status(400).json({ success: false, error: 'Order ini bukan Open Bill' });
    }

    const now = new Date().toISOString();
    await run(`
      UPDATE orders SET
        order_status = 'confirmed',
        payment_status = 'paid',
        payment_method = ?,
        updated_at = ?
      WHERE id = ?
    `, [paymentMethod || (billPayments?.[0]?.method) || 'tunai', now, id]);

    // Insert payment records
    if (billPayments && Array.isArray(billPayments)) {
      for (const payment of billPayments) {
        await run(`
          INSERT INTO payments (id, order_id, method, amount, change_amount, platform_ref)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [randomUUID(), id, payment.method, payment.amount, payment.change || 0, payment.platformRef || null]);
      }
    }

    // Log activity
    await run(`
      INSERT INTO activity_logs (id, tenant_id, user_id, action, entity_type, entity_id, description, metadata)
      VALUES (?, ?, ?, 'open_bill_closed', 'order', ?, ?, ?)
    `, [
      randomUUID(), order.tenant_id, userId || order.user_id, id,
      `Open Bill ${order.order_number} dibayar sebesar Rp ${order.total.toLocaleString()} via ${paymentMethod || 'tunai'}`,
      JSON.stringify({ orderNumber: order.order_number, paymentMethod, total: order.total })
    ]);

    res.json({ success: true, message: `Open Bill ${order.order_number} berhasil dibayar` });
  } catch (error: any) {
    console.error('Close bill error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders — Get orders (for history and KDS)
router.get('/', async (req, res) => {
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

    const orders = await query(sql, params);

    // Get items for each order
    for (const order of orders as any[]) {
      order.items = await query(`
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
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await get(`
      SELECT o.*, u.name as cashier_name
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [id]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get items
    const items = await query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    for (const item of items as any[]) {
      item.modifiers = await query('SELECT * FROM order_item_modifiers WHERE order_item_id = ?', [item.id]);
    }
    (order as any).items = items;

    // Get payments
    (order as any).payments = await query('SELECT * FROM payments WHERE order_id = ?', [id]);

    res.json({ order });
  } catch (error: any) {
    console.error('Get order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/orders/:id/status — Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, kitchenStatus } = req.body;

    // Get current status for logging (Task 22.3 - Requirement 14.4)
    const currentOrder = await get('SELECT kitchen_status, order_status FROM orders WHERE id = ?', [id]) as any;
    if (!currentOrder) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (orderStatus) {
      updates.push('order_status = ?');
      params.push(orderStatus);
    }

    if (kitchenStatus) {
      updates.push('kitchen_status = ?');
      params.push(kitchenStatus);
      if (kitchenStatus === 'ready') {
        updates.push('completed_at = ?');
        params.push(new Date().toISOString());
      }
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await run(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params);

    // Log status update (Task 22.3 - Requirement 14.4)
    if (kitchenStatus) {
      logOrderStatusUpdate(id, currentOrder.kitchen_status, kitchenStatus);
      if (kitchenStatus === 'ready') {
        logKitchenStatusUpdate(id);
      }
    }

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

    const order = await get('SELECT * FROM orders WHERE id = ?', [id]) as any;
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.order_status === 'cancelled') {
      return res.status(400).json({ error: 'Order sudah di-void sebelumnya' });
    }

    // Verify Manager PIN
    const managers = await query('SELECT * FROM users WHERE tenant_id = ? AND role IN (\'manager\', \'owner\')', [order.tenant_id]) as any[];
    let validManager = null;
    
    for (const mgr of managers) {
      if (mgr.pin && await bcrypt.compare(managerPin, mgr.pin)) {
        validManager = mgr;
        break;
      }
    }

    if (!validManager) {
      return res.status(403).json({ error: 'PIN tidak valid atau Anda tidak memiliki akses Manager' });
    }

    await run(`
      UPDATE orders SET
        order_status = 'cancelled',
        kitchen_status = 'served',
        payment_status = 'cancelled',
        notes = COALESCE(notes || ' | ', '') || ?,
        updated_at = ?
      WHERE id = ?
    `, [`VOID: ${reason} (by: ${voidBy || 'Manager'})`, new Date().toISOString(), id]);

    // Log activity
    await run(`
      INSERT INTO activity_logs (id, tenant_id, user_id, action, entity_type, entity_id, description, metadata)
      VALUES (?, ?, ?, 'order_cancelled', 'order', ?, ?, ?)
    `, [randomUUID(), order.tenant_id, voidBy || null, id, `Order ${order.order_number} dibatalkan (void) — ${reason} (Rp ${order.total.toLocaleString()})`, JSON.stringify({ orderNumber: order.order_number, reason, total: order.total })]);

    res.json({ success: true, message: `Order ${order.order_number} berhasil di-void` });
  } catch (error: any) {
    console.error('Void order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 25: GET /api/orders/shift/:shiftId — Orders per shift
router.get('/shift/:shiftId', async (req, res) => {
  try {
    const { shiftId } = req.params;

    const orders = await query(`
      SELECT o.*, u.name as cashier_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.shift_id = ?
      ORDER BY o.created_at DESC
    `, [shiftId]);

    // Get items for each order
    for (const order of orders as any[]) {
      order.items = await query(`
        SELECT oi.product_name, oi.quantity, oi.unit_price, oi.subtotal
        FROM order_items oi WHERE oi.order_id = ?
      `, [order.id]);
    }

    res.json({ success: true, orders });
  } catch (error: any) {
    console.error('Get shift orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 26: GET /api/orders/config/:outletId — POS config
router.get('/config/:outletId', async (req, res) => {
  try {
    const { outletId } = req.params;

    const outlet = await get('SELECT * FROM outlets WHERE id = ?', [outletId]) as any;
    if (!outlet) {
      return res.status(404).json({ error: 'Outlet not found' });
    }

    // Get settings
    const settings = await query(`
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
    const paymentMethods = await query(`
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
router.patch('/:id/items/:itemId/status', async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'preparing', 'ready', 'served'].includes(status)) {
      return res.status(400).json({ error: 'Invalid item status' });
    }

    // Update item status
    await run('UPDATE order_items SET kitchen_status = ? WHERE id = ? AND order_id = ?', [status, itemId, id]);

    // Check if all items are ready/served — auto-update order kitchen_status
    const pendingItems = await query(`
      SELECT COUNT(*) as count FROM order_items
      WHERE order_id = ? AND kitchen_status IN ('pending', 'preparing')
    `, [id]);

    if ((pendingItems[0] as any).count === 0) {
      // All items are ready or served
      await run(`
        UPDATE orders SET
          kitchen_status = 'ready',
          order_status = 'ready',
          completed_at = ?,
          updated_at = ?
        WHERE id = ?
      `, [new Date().toISOString(), new Date().toISOString(), id]);

      logKitchenStatusUpdate(id);
    }

    res.json({ success: true, message: 'Item status berhasil diperbarui' });
  } catch (error: any) {
    console.error('Update item status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 28: GET /api/orders/kitchen/queue — Optimized KDS queue
router.get('/kitchen/queue', async (req, res) => {
  try {
    const { tenantId, outletId, stationId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let sql = `
      SELECT o.id, o.order_number, o.order_type, o.table_number,
             o.kitchen_status, o.order_status, o.created_at, o.notes,
             u.name as cashier_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.tenant_id = ? AND o.kitchen_status IN ('pending', 'preparing')
        AND o.order_status NOT IN ('cancelled')
    `;
    const params: any[] = [tenantId];

    if (outletId) { sql += ' AND o.outlet_id = ?'; params.push(outletId); }

    sql += ' ORDER BY o.created_at ASC';

    const orders = await query(sql, params);

    // Get pending items for each order
    for (const order of orders as any[]) {
      order.items = await query(`
        SELECT oi.id, oi.product_name as name, oi.quantity, oi.notes,
               oi.kitchen_status as item_status,
               (SELECT GROUP_CONCAT(modifier_option_name, ', ')
                FROM order_item_modifiers WHERE order_item_id = oi.id) as modifier_names,
               (SELECT json_group_array(json_object('optionName', modifier_option_name, 'priceAdjustment', price_adjustment))
                FROM order_item_modifiers WHERE order_item_id = oi.id) as modifiers
        FROM order_items oi
        WHERE oi.order_id = ?
      `, [order.id]);
    }

    // Filter out orders with no pending items
    const activeOrders = (orders as any[]).filter(o => 
      o.items.some((i: any) => i.item_status === 'pending' || i.item_status === 'preparing')
    );

    res.json({ success: true, orders: activeOrders, total: activeOrders.length });
  } catch (error: any) {
    console.error('Kitchen queue error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 29: GET /api/orders/kitchen/stats — Kitchen stats
router.get('/kitchen/stats', async (req, res) => {
  try {
    const { tenantId, outletId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let whereClause = 'WHERE o.tenant_id = ?';
    const params: any[] = [tenantId];

    if (outletId) {
      whereClause += ' AND o.outlet_id = ?';
      params.push(outletId);
    }

    // Today's stats
    const todayStats = await get(`
      SELECT
        COUNT(CASE WHEN o.kitchen_status IN ('pending', 'preparing') AND o.order_status != 'cancelled' THEN 1 END) as active_orders,
        COUNT(CASE WHEN o.kitchen_status = 'ready' AND DATE(o.created_at, 'localtime') = DATE('now', 'localtime') THEN 1 END) as completed_today,
        COUNT(CASE WHEN o.kitchen_status IN ('pending', 'preparing') AND o.order_status != 'cancelled'
          AND (julianday('now') - julianday(o.created_at)) * 24 * 60 > 20 THEN 1 END) as urgent_count,
        COUNT(CASE WHEN o.kitchen_status IN ('pending', 'preparing') AND o.order_status != 'cancelled'
          AND (julianday('now') - julianday(o.created_at)) * 24 * 60 BETWEEN 10 AND 20 THEN 1 END) as warning_count
      FROM orders o
      ${whereClause}
    `, params);

    // Average completion time today
    const avgTime = await get(`
      SELECT AVG(
        (julianday(o.completed_at) - julianday(o.created_at)) * 24 * 60
      ) as avg_minutes
      FROM orders o
      ${whereClause}
        AND o.completed_at IS NOT NULL
        AND DATE(o.created_at, 'localtime') = DATE('now', 'localtime')
    `, params);

    // Total items in queue
    const itemStats = await get(`
      SELECT COUNT(oi.id) as total_items
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      ${whereClause}
        AND o.kitchen_status IN ('pending', 'preparing')
        AND o.order_status != 'cancelled'
        AND oi.kitchen_status IN ('pending', 'preparing')
    `, params);

    res.json({
      success: true,
      stats: {
        ...todayStats as any,
        ...itemStats as any,
        avg_completion_minutes: Math.round((avgTime as any)?.avg_minutes || 0)
      }
    });
  } catch (error: any) {
    console.error('Kitchen stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 30: GET /api/orders/kitchen/completed — Completed orders today
router.get('/kitchen/completed', async (req, res) => {
  try {
    const { tenantId, outletId, limit = 20 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let sql = `
      SELECT o.id, o.order_number, o.order_type, o.table_number,
             o.kitchen_status, o.created_at, o.completed_at,
             u.name as cashier_name,
             ROUND((julianday(o.completed_at) - julianday(o.created_at)) * 24 * 60, 1) as completion_minutes
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.tenant_id = ? AND o.kitchen_status IN ('ready', 'served')
        AND DATE(o.created_at, 'localtime') = DATE('now', 'localtime')
    `;
    const params: any[] = [tenantId];

    if (outletId) { sql += ' AND o.outlet_id = ?'; params.push(outletId); }

    sql += ' ORDER BY o.completed_at DESC LIMIT ?';
    params.push(Number(limit));

    const orders = await query(sql, params);

    res.json({ success: true, orders });
  } catch (error: any) {
    console.error('Completed orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 31: POST /api/orders/:id/refund — Refund order
router.post('/:id/refund', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, refundAmount, refundBy } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required for refund' });
    }

    const order = await get('SELECT * FROM orders WHERE id = ?', [id]) as any;
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const amount = refundAmount || order.total;

    await run(`
      UPDATE orders SET
        notes = COALESCE(notes || ' | ', '') || ?,
        updated_at = ?
      WHERE id = ?
    `, [`REFUND: Rp ${amount.toLocaleString()} — ${reason} (by: ${refundBy || 'Manager'})`, new Date().toISOString(), id]);

    // Insert negative payment to correctly reduce shift omzet
    await run(`
      INSERT INTO payments (id, order_id, method, amount, change_amount, platform_ref)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [randomUUID(), id, order.payment_method || 'tunai', -Math.abs(amount), 0, 'REFUND']);

    // If full refund, void the order
    if (amount >= order.total) {
      await run(`UPDATE orders SET order_status = 'cancelled', payment_status = 'cancelled' WHERE id = ?`, [id]);
      
      await run(`
        INSERT INTO activity_logs (id, tenant_id, user_id, action, entity_type, entity_id, description, metadata)
        VALUES (?, ?, ?, 'order_cancelled', 'order', ?, ?, ?)
      `, [randomUUID(), order.tenant_id, refundBy || null, id, `Order ${order.order_number} dibatalkan (refund penuh sebesar Rp ${amount.toLocaleString()}) — ${reason}`, JSON.stringify({ orderNumber: order.order_number, reason, amount })]);
    }

    // Log activity
    await run(`
      INSERT INTO activity_logs (id, tenant_id, user_id, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, 'refund', 'order', ?, ?)
    `, [randomUUID(), order.tenant_id, refundBy || null, id, `Refund order ${order.order_number} — Rp ${amount.toLocaleString()} — ${reason}`]);

    res.json({ success: true, message: `Refund Rp ${amount.toLocaleString()} untuk order ${order.order_number} berhasil diproses` });
  } catch (error: any) {
    console.error('Refund order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper for kitchen completed & late logging
async function logKitchenStatusUpdate(orderId: string) {
  try {
    const order = await get('SELECT tenant_id, order_number, created_at, completed_at FROM orders WHERE id = ?', [orderId]) as any;
    if (!order) return;
    
    const startTime = new Date(order.created_at).getTime();
    const endTime = order.completed_at ? new Date(order.completed_at).getTime() : Date.now();
    const durationMinutes = Math.round((endTime - startTime) / (60 * 1000));
    
    // Get maximum production time for items in this order
    const prodResult = await get(`
      SELECT MAX(COALESCE(p.production_time, 10)) as max_time
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]) as any;
    
    const maxProductionTime = prodResult?.max_time || 10;
    
    // Log kitchen completed
    await run(`
      INSERT INTO activity_logs (id, tenant_id, action, entity_type, entity_id, description, metadata)
      VALUES (?, ?, 'kitchen_completed', 'order', ?, ?, ?)
    `, [
      randomUUID(),
      order.tenant_id,
      orderId,
      `Pesanan dapur ${order.order_number} selesai dalam ${durationMinutes} menit (Target: ${maxProductionTime} m)`,
      JSON.stringify({ orderNumber: order.order_number, durationMinutes, maxProductionTime })
    ]);
    
    // Check if late
    if (durationMinutes > maxProductionTime) {
      await run(`
        INSERT INTO activity_logs (id, tenant_id, action, entity_type, entity_id, description, metadata)
        VALUES (?, ?, 'kitchen_late', 'order', ?, ?, ?)
      `, [
        randomUUID(),
        order.tenant_id,
        orderId,
        `Dapur TERLAMBAT untuk pesanan ${order.order_number}: selesai dalam ${durationMinutes} menit (Target: ${maxProductionTime} m)`,
        JSON.stringify({ orderNumber: order.order_number, durationMinutes, maxProductionTime, delay: durationMinutes - maxProductionTime })
      ]);
    }
  } catch (err) {
    console.error('Error logging kitchen status update:', err);
  }
}

// POST /api/orders/payment-failed — Log failed static QRIS/manual EDC payments
router.post('/payment-failed', async (req, res) => {
  try {
    const { tenantId, userId, paymentMethod, amount, error } = req.body;
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }
    const logId = randomUUID();
    await run(`
      INSERT INTO activity_logs (id, tenant_id, user_id, action, entity_type, description, metadata)
      VALUES (?, ?, ?, 'payment_failed', 'payment', ?, ?)
    `, [
      logId,
      tenantId,
      userId || null,
      `Pembayaran ${paymentMethod || 'QRIS'} sebesar Rp ${Number(amount || 0).toLocaleString()} gagal: ${error || 'Transaksi didecline/dana kurang'}`,
      JSON.stringify({ paymentMethod, amount, error })
    ]);
    res.json({ success: true, logId });
  } catch (err: any) {
    console.error('Log payment failure error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
