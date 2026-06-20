import { Router } from 'express';
import { supabase } from '../supabase';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { logger } from '../middleware/logger';
import { z } from 'zod';

const router = Router();

// ─── Helper: Generate Order Number ───────────────────────────────────────────
function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let num = 'ORD-';
  for (let i = 0; i < 6; i++) {
    num += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return num;
}

// ─── Validation Schema ────────────────────────────────────────────────────────
const createOrderSchema = z.object({
  orderType: z.enum(['dine-in', 'takeaway', 'delivery']).default('dine-in'),
  tableNumber: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    name: z.string(),
    qty: z.number().int().min(1),
    price: z.number().min(0),
    notes: z.string().optional().default(''),
    modifiers: z.array(z.any()).optional().default([])
  })).min(1),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  total: z.number().min(0),
  paymentMethod: z.enum(['cash', 'qris', 'transfer', 'card', 'other']).default('cash'),
  paymentStatus: z.enum(['paid', 'pending', 'partial']).default('paid'),
  customerName: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  shiftId: z.string().uuid().optional().nullable()
});

// ─── Create Order ─────────────────────────────────────────────────────────────
router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const validated = createOrderSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    const outletId = req.body.outletId || req.user!.outletId;
    const userId = req.user!.id;

    const orderNumber = generateOrderNumber();

    // Normalize order type
    let validOrderType: 'dine-in' | 'takeaway' = 'dine-in';
    if (validated.orderType === 'takeaway' || validated.orderType === 'delivery') {
      validOrderType = 'takeaway';
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        tenant_id: tenantId,
        outlet_id: outletId,
        user_id: userId,
        shift_id: validated.shiftId || null,
        order_number: orderNumber,
        order_type: validOrderType,
        table_number: validated.tableNumber,
        subtotal: validated.subtotal,
        tax: validated.tax,
        discount: validated.discount,
        total: validated.total,
        payment_method: validated.paymentMethod,
        payment_status: validated.paymentStatus,
        order_status: 'pending',
        kitchen_status: 'pending',
        customer_name: validated.customerName,
        customer_phone: validated.customerPhone
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    if (validated.items.length > 0) {
      const orderItems = validated.items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        quantity: item.qty,
        unit_price: item.price,
        subtotal: item.price * item.qty,
        notes: item.notes || '',
        modifier_options: item.modifiers || []
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;
    }

    logger.info('Order created', { orderId: order.id, orderNumber, tenantId, outletId });

    res.status(201).json({ success: true, order, orderNumber });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    logger.error('Create order error', { error });
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// ─── Get Orders List ──────────────────────────────────────────────────────────
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { outletId, status, dateFrom, dateTo, page = '1', limit = '20' } = req.query;
    const tenantId = req.user!.tenantId;
    const effectiveOutletId = (outletId as string) || req.user!.outletId;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let q = supabase
      .from('orders')
      .select('*, order_items(product_id, product_name, quantity, unit_price, subtotal, notes)', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (effectiveOutletId) q = q.eq('outlet_id', effectiveOutletId);
    if (status) q = q.eq('order_status', status);
    if (dateFrom) q = q.gte('created_at', `${dateFrom}T00:00:00Z`);
    if (dateTo) q = q.lte('created_at', `${dateTo}T23:59:59Z`);

    const { data, error, count } = await q;
    if (error) throw error;

    res.json({
      success: true,
      orders: data || [],
      pagination: {
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (error) {
    logger.error('Get orders error', { error });
    res.status(500).json({ success: false, error: 'Failed to get orders' });
  }
});

// ─── Get Order by ID ──────────────────────────────────────────────────────────
router.get('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
      throw error;
    }

    res.json({ success: true, order: data });
  } catch (error) {
    logger.error('Get order by ID error', { error });
    res.status(500).json({ success: false, error: 'Failed to get order' });
  }
});

// ─── Update Order Status ──────────────────────────────────────────────────────
router.patch('/:id/status', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, kitchenStatus } = req.body;
    const tenantId = req.user!.tenantId;

    const updates: Record<string, string> = {};
    if (orderStatus) updates.order_status = orderStatus;
    if (kitchenStatus) updates.kitchen_status = kitchenStatus;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'At least one status field required' });
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Order status updated', { orderId: id, updates });

    res.json({ success: true, order: data });
  } catch (error) {
    logger.error('Update order status error', { error });
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
});

export default router;
