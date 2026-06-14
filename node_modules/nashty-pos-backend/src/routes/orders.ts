import { Router } from 'express';
import db from '../db/database';
import { nanoid } from 'nanoid';

const router = Router();

// Generate order number
function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${dateStr}${random}`;
}

// Create new order
router.post('/', (req, res) => {
  try {
    const {
      tenantId,
      outletId,
      shiftId,
      userId,
      orderType,
      tableNumber,
      items,
      subtotal,
      discount = 0,
      tax = 0,
      serviceCharge = 0,
      total,
      paymentMethod,
      notes
    } = req.body;

    if (!tenantId || !outletId || !userId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const orderId = nanoid();
    const orderNumber = generateOrderNumber();

    // Map order type from frontend format to database constraint format
    const orderTypeMap: Record<string, string> = {
      'dine_in': 'dine-in',
      'take_away': 'takeaway',
      'gofood': 'gofood',
      'grabfood': 'grabfood',
      'shopee': 'shopeefood',
      'shopeefood': 'shopeefood',
      'dine-in': 'dine-in',
      'takeaway': 'takeaway'
    };
    const mappedOrderType = orderTypeMap[orderType] || orderType;

    const transaction = db.transaction(() => {
      // Insert order
      db.prepare(`
        INSERT INTO orders (
          id, tenant_id, outlet_id, shift_id, user_id, order_number,
          order_type, table_number, subtotal, discount, tax, service_charge,
          total, payment_method, payment_status, order_status, kitchen_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId, tenantId, outletId, shiftId, userId, orderNumber,
        mappedOrderType, tableNumber, subtotal, discount, tax, serviceCharge,
        total, paymentMethod, 'paid', 'confirmed', 'pending', notes
      );

      // Insert order items
      const itemInsert = db.prepare(`
        INSERT INTO order_items (
          id, order_id, product_id, product_name, quantity, unit_price, subtotal, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const modifierInsert = db.prepare(`
        INSERT INTO order_item_modifiers (
          id, order_item_id, modifier_group_id, modifier_group_name,
          modifier_option_id, modifier_option_name, price_adjustment
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        const itemId = nanoid();
        itemInsert.run(
          itemId,
          orderId,
          item.productId,
          item.productName,
          item.quantity,
          item.unitPrice,
          item.subtotal,
          item.notes || null
        );

        // Insert modifiers if any
        if (item.modifiers && item.modifiers.length > 0) {
          for (const mod of item.modifiers) {
            modifierInsert.run(
              nanoid(),
              itemId,
              mod.groupId,
              mod.groupName,
              mod.optionId,
              mod.optionName,
              mod.priceAdjustment || 0
            );
          }
        }
      }
    });

    transaction();

    // Get complete order with items
    const order = db.prepare(`
      SELECT o.*, u.name as cashier_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(orderId);

    const orderItems = db.prepare(`
      SELECT * FROM order_items WHERE order_id = ?
    `).all(orderId);

    for (const item of orderItems as any[]) {
      item.modifiers = db.prepare(`
        SELECT * FROM order_item_modifiers WHERE order_item_id = ?
      `).all(item.id);
    }

    (order as any).items = orderItems;

    res.status(201).json({ success: true, order });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get orders (for history and KDS)
router.get('/', (req, res) => {
  try {
    const { tenantId, outletId, status, kitchenStatus, limit = 50 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let query = `
      SELECT o.*, u.name as cashier_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.tenant_id = ?
    `;

    const params: any[] = [tenantId];

    if (outletId) {
      query += ` AND o.outlet_id = ?`;
      params.push(outletId);
    }

    if (status) {
      query += ` AND o.order_status = ?`;
      params.push(status);
    }

    if (kitchenStatus) {
      query += ` AND o.kitchen_status = ?`;
      params.push(kitchenStatus);
    }

    query += ` ORDER BY o.created_at DESC LIMIT ?`;
    params.push(Number(limit));

    const orders = db.prepare(query).all(...params);

    // Get items for each order
    for (const order of orders as any[]) {
      order.items = db.prepare(`
        SELECT oi.*, 
          (SELECT json_group_array(
            json_object(
              'groupName', modifier_group_name,
              'optionName', modifier_option_name,
              'priceAdjustment', price_adjustment
            )
          ) FROM order_item_modifiers WHERE order_item_id = oi.id) as modifiers
        FROM order_items oi
        WHERE oi.order_id = ?
      `).all(order.id);
    }

    res.json({ orders });
  } catch (error: any) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get order by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const order = db.prepare(`
      SELECT o.*, u.name as cashier_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get items
    const items = db.prepare(`
      SELECT * FROM order_items WHERE order_id = ?
    `).all(id);

    for (const item of items as any[]) {
      item.modifiers = db.prepare(`
        SELECT * FROM order_item_modifiers WHERE order_item_id = ?
      `).all(item.id);
    }

    (order as any).items = items;

    res.json({ order });
  } catch (error: any) {
    console.error('Get order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update order status
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, kitchenStatus } = req.body;

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

    db.prepare(`
      UPDATE orders SET ${updates.join(', ')} WHERE id = ?
    `).run(...params);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
