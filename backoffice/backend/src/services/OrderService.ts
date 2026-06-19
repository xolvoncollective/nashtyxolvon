import { get, query, run, transaction } from '../db/database';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { ProductService } from './ProductService';
import { SettingsService } from './SettingsService';
import { logOrderCreation, logOrderStatusUpdate } from '../middleware/logging';

export class OrderService {
  
  static createOrder(data: any) {
    const {
      tenantId, outletId, shiftId = null, userId,
      orderType, tableNumber = null, customerName = null, customerPhone = null, items,
      discount = 0, paymentMethod = null, payments, notes = null
    } = data;

    // Generate sequential order number
    const seqResult = get(`
      SELECT COUNT(*) as count FROM orders 
      WHERE outlet_id = ? AND DATE(created_at, 'localtime') = DATE('now', 'localtime')
    `, [outletId]) as any;
    const seq = ((seqResult?.count || 0) + 1).toString().padStart(4, '0');
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const orderNumber = `SNY-${dateStr}-${seq}`;
    const orderId = crypto.randomUUID();

    // Calculate subtotal and validate items
    let calculatedSubtotal = 0;
    for (const item of items) {
      const product = ProductService.checkAvailability(item.productId, item.quantity);

      let itemPrice = product.price;
      if (item.modifiers) {
        for (const mod of item.modifiers) {
          itemPrice += mod.priceAdjustment || 0;
        }
      }
      item.unitPrice = itemPrice;
      item.subtotal = itemPrice * item.quantity;
      calculatedSubtotal += item.subtotal;
    }

    const validDiscount = Math.min(discount, calculatedSubtotal);
    const baseAmount = calculatedSubtotal - validDiscount;

    const { taxRate, scRate } = SettingsService.getTaxAndServiceChargeRate(tenantId, outletId);
    const calculatedTax = Math.round(baseAmount * (taxRate / 100));
    const calculatedServiceCharge = Math.round(baseAmount * (scRate / 100));
    const calculatedTotal = baseAmount + calculatedTax + calculatedServiceCharge;

    const totalPaid = payments ? payments.reduce((sum: number, p: any) => sum + p.amount - (p.change || 0), 0) : 0;
    const paymentStatus = totalPaid >= calculatedTotal ? 'paid' : 'pending';

    const orderTypeMap: Record<string, string> = {
      'dine_in': 'dine-in', 'take_away': 'takeaway',
      'gofood': 'gofood', 'grabfood': 'grabfood',
      'shopee': 'shopeefood', 'shopeefood': 'shopeefood',
      'dine-in': 'dine-in', 'takeaway': 'takeaway',
      'dine': 'dine-in', 'take': 'takeaway'
    };
    const mappedOrderType = orderTypeMap[orderType] || orderType;

    const doTransaction = transaction(() => {
      run(`
        INSERT INTO orders (
          id, tenant_id, outlet_id, shift_id, user_id, order_number,
          order_type, table_number, customer_name, customer_phone, subtotal, discount, tax, service_charge,
          total, payment_method, payment_status, order_status, kitchen_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId, tenantId, outletId, shiftId, userId, orderNumber,
        mappedOrderType, tableNumber, customerName, customerPhone, calculatedSubtotal, validDiscount, calculatedTax, calculatedServiceCharge,
        calculatedTotal, paymentMethod, paymentStatus, 'confirmed', 'pending', notes
      ]);

      for (const item of items) {
        const itemId = crypto.randomUUID();
        run(`
          INSERT INTO order_items (
            id, order_id, product_id, product_name, quantity, unit_price, subtotal, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [itemId, orderId, item.productId, item.productName, item.quantity, item.unitPrice, item.subtotal, item.notes || null]);

        if (item.modifiers && item.modifiers.length > 0) {
          for (const mod of item.modifiers) {
            run(`
              INSERT INTO order_item_modifiers (
                id, order_item_id, modifier_group_id, modifier_group_name,
                modifier_option_id, modifier_option_name, price_adjustment
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [crypto.randomUUID(), itemId, mod.groupId, mod.groupName, mod.optionId, mod.optionName, mod.priceAdjustment || 0]);
          }
        }

        ProductService.deductStock(item.productId, item.quantity);
      }

      if (payments && Array.isArray(payments)) {
        for (const payment of payments) {
          run(`
            INSERT INTO payments (id, order_id, method, amount, change_amount, platform_ref)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [crypto.randomUUID(), orderId, payment.method, payment.amount, payment.change || 0, payment.platformRef || null]);
        }
      }
    });

    doTransaction();
    logOrderCreation(orderNumber, orderId, calculatedTotal);

    const order = get(`
      SELECT o.*, u.name as cashier_name
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    const orderItems = query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    for (const item of orderItems as any[]) {
      item.modifiers = query('SELECT * FROM order_item_modifiers WHERE order_item_id = ?', [item.id]);
    }
    (order as any).items = orderItems;

    return order;
  }

  static updateOrderStatus(id: string, orderStatus?: string, kitchenStatus?: string) {
    const currentOrder = get('SELECT * FROM orders WHERE id = ?', [id]) as any;
    if (!currentOrder) throw new Error('Order not found');

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

    run(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params);

    // CRM Integration: Award Points
    const isNowCompleted = (orderStatus === 'completed' || kitchenStatus === 'served' || kitchenStatus === 'ready');
    const wasCompleted = (currentOrder.order_status === 'completed' || currentOrder.kitchen_status === 'served' || currentOrder.kitchen_status === 'ready');
    if (isNowCompleted && !wasCompleted && currentOrder.customer_phone) {
      try {
        const member = require('./MemberService').MemberService.validateOrRegisterMember(currentOrder.tenant_id, currentOrder.customer_phone, currentOrder.customer_name);
        const pointsToAward = Math.floor(currentOrder.total / 1000); // 1 point per Rp 1000
        if (pointsToAward > 0) {
          require('./MemberService').MemberService.handlePointTransaction(
            currentOrder.tenant_id,
            member.id,
            pointsToAward,
            'earn',
            `Award points for order ${currentOrder.order_number}`
          );
        }
      } catch (err) {
        console.error('Failed to award points:', err);
      }
    }

    if (kitchenStatus) {
      logOrderStatusUpdate(id, currentOrder.kitchen_status, kitchenStatus);
    }
  }

  static async voidOrder(id: string, reason: string, voidBy: string, managerPin: string) {
    const order = get('SELECT * FROM orders WHERE id = ?', [id]) as any;
    if (!order) throw new Error('Order not found');
    if (order.order_status === 'cancelled') throw new Error('Order sudah di-void sebelumnya');

    const managers = query('SELECT * FROM users WHERE tenant_id = ? AND role IN (\'manager\', \'owner\')', [order.tenant_id]) as any[];
    let validManager = null;
    
    for (const mgr of managers) {
      if (mgr.pin && await bcrypt.compare(managerPin, mgr.pin)) {
        validManager = mgr;
        break;
      }
    }

    if (!validManager) throw new Error('PIN tidak valid atau Anda tidak memiliki akses Manager');

    run(`
      UPDATE orders SET
        order_status = 'cancelled',
        kitchen_status = 'served',
        payment_status = 'cancelled',
        notes = COALESCE(notes || ' | ', '') || ?,
        updated_at = ?
      WHERE id = ?
    `, [`VOID: ${reason} (by: ${voidBy || 'Manager'})`, new Date().toISOString(), id]);

    // Wave 2: Inventory Restoration
    const items = query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]) as any[];
    for (const item of items) {
      ProductService.restoreStock(item.product_id, item.quantity, `Void: ${order.order_number}`);
    }

    run(`
      INSERT INTO activity_logs (id, tenant_id, user_id, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, 'void', 'order', ?, ?)
    `, [crypto.randomUUID(), order.tenant_id, voidBy || null, id, `Void order ${order.order_number} — ${reason} (Rp ${order.total.toLocaleString()})`]);

    return order;
  }

  static refundOrder(id: string, reason: string, refundAmount: number, refundBy: string) {
    const order = get('SELECT * FROM orders WHERE id = ?', [id]) as any;
    if (!order) throw new Error('Order not found');

    const amount = refundAmount || order.total;

    run(`
      UPDATE orders SET
        notes = COALESCE(notes || ' | ', '') || ?,
        updated_at = ?
      WHERE id = ?
    `, [`REFUND: Rp ${amount.toLocaleString()} — ${reason} (by: ${refundBy || 'Manager'})`, new Date().toISOString(), id]);

    run(`
      INSERT INTO payments (id, order_id, method, amount, change_amount, platform_ref)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [crypto.randomUUID(), id, order.payment_method || 'tunai', -Math.abs(amount), 0, 'REFUND']);

    if (amount >= order.total) {
      run(`UPDATE orders SET order_status = 'cancelled', payment_status = 'cancelled' WHERE id = ?`, [id]);
    }

    // Wave 3: Point Reversal
    if (order.customer_phone) {
      try {
        const member = require('./MemberService').MemberService.validateOrRegisterMember(order.tenant_id, order.customer_phone, order.customer_name);
        const pointsReversed = Math.floor(amount / 1000);
        if (pointsReversed > 0) {
          require('./MemberService').MemberService.handlePointTransaction(
            order.tenant_id,
            member.id,
            pointsReversed,
            'redeem',
            `Point reversal for refunded order ${order.order_number}`
          );
        }
      } catch (err) {
        console.error('Failed to reverse points:', err);
      }
    }

    run(`
      INSERT INTO activity_logs (id, tenant_id, user_id, action, entity_type, entity_id, description)
      VALUES (?, ?, ?, 'refund', 'order', ?, ?)
    `, [crypto.randomUUID(), order.tenant_id, refundBy || null, id, `Refund order ${order.order_number} — Rp ${amount.toLocaleString()} — ${reason}`]);
  
    return { order, amount };
  }

  static updateOrderItemStatus(id: string, itemId: string, status: string) {
    if (!['pending', 'preparing', 'ready', 'served'].includes(status)) {
      throw new Error('Invalid item status');
    }

    // Update item status
    run('UPDATE order_items SET kitchen_status = ? WHERE id = ? AND order_id = ?', [status, itemId, id]);

    // Check if all items are ready/served — auto-update order kitchen_status
    const pendingItems = query(`
      SELECT COUNT(*) as count FROM order_items
      WHERE order_id = ? AND kitchen_status IN ('pending', 'preparing')
    `, [id]);

    if ((pendingItems[0] as any).count === 0) {
      // All items are ready or served -> delegate to the main updateOrderStatus to ensure logging
      this.updateOrderStatus(id, 'ready', 'ready');
    }
  }

  static getKitchenQueue(tenantId: string, outletId?: string, stationId?: string) {
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

    const orders = query(sql, params) as any[];

    // Get pending items for each order
    for (const order of orders) {
      order.items = query(`
        SELECT oi.id, oi.product_name as name, oi.quantity, oi.notes,
               oi.kitchen_status as item_status,
               p.production_time,
               (SELECT GROUP_CONCAT(modifier_option_name, ', ')
                FROM order_item_modifiers WHERE order_item_id = oi.id) as modifier_names,
               (SELECT json_group_array(json_object('optionName', modifier_option_name, 'priceAdjustment', price_adjustment))
                FROM order_item_modifiers WHERE order_item_id = oi.id) as modifiers
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
    }

    // Filter out orders with no pending items
    const activeOrders = orders.filter(o => 
      o.items.some((i: any) => i.item_status === 'pending' || i.item_status === 'preparing')
    );

    return { orders: activeOrders, total: activeOrders.length };
  }

  static getKitchenStats(tenantId: string, outletId?: string) {
    let whereClause = 'WHERE o.tenant_id = ?';
    const params: any[] = [tenantId];

    if (outletId) {
      whereClause += ' AND o.outlet_id = ?';
      params.push(outletId);
    }

    const todayStats = get(`
      SELECT
        COUNT(CASE WHEN o.kitchen_status IN ('pending', 'preparing') AND o.order_status != 'cancelled' THEN 1 END) as active_orders,
        COUNT(CASE WHEN o.kitchen_status = 'ready' AND DATE(o.created_at, 'localtime') = DATE('now', 'localtime') THEN 1 END) as completed_today,
        COUNT(CASE WHEN o.kitchen_status IN ('pending', 'preparing') AND o.order_status != 'cancelled'
          AND (julianday('now') - julianday(o.created_at)) * 24 * 60 > 20 THEN 1 END) as urgent_count,
        COUNT(CASE WHEN o.kitchen_status IN ('pending', 'preparing') AND o.order_status != 'cancelled'
          AND (julianday('now') - julianday(o.created_at)) * 24 * 60 BETWEEN 10 AND 20 THEN 1 END) as warning_count
      FROM orders o
      ${whereClause}
    `, params) as any;

    const avgTime = get(`
      SELECT AVG(
        (julianday(o.completed_at) - julianday(o.created_at)) * 24 * 60
      ) as avg_minutes
      FROM orders o
      ${whereClause}
        AND o.completed_at IS NOT NULL
        AND DATE(o.created_at, 'localtime') = DATE('now', 'localtime')
    `, params) as any;

    const itemStats = get(`
      SELECT COUNT(oi.id) as total_items
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      ${whereClause}
        AND o.kitchen_status IN ('pending', 'preparing')
        AND o.order_status != 'cancelled'
        AND oi.kitchen_status IN ('pending', 'preparing')
    `, params) as any;

    return {
      ...todayStats,
      ...itemStats,
      avg_completion_minutes: Math.round(avgTime?.avg_minutes || 0)
    };
  }

  static getCompletedOrders(tenantId: string, outletId?: string, limit: number = 20) {
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

    return query(sql, params);
  }

  static getOrdersByShift(shiftId: string) {
    const orders = query(`
      SELECT o.*, u.name as cashier_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.shift_id = ?
      ORDER BY o.created_at DESC
    `, [shiftId]) as any[];

    for (const order of orders) {
      order.items = query(`
        SELECT oi.product_name, oi.quantity, oi.unit_price, oi.subtotal
        FROM order_items oi WHERE oi.order_id = ?
      `, [order.id]);
    }

    return orders;
  }
}
