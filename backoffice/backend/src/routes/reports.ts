import { Router } from 'express';
import { supabase } from '../supabase';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { logger } from '../middleware/logger';

const router = Router();

// ─── Sales Report ─────────────────────────────────────────────────────────────
router.get('/sales', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { outletId, dateFrom, dateTo, groupBy = 'day' } = req.query;
    const tenantId = req.user!.tenantId;
    const effectiveOutletId = (outletId as string) || req.user!.outletId;

    let q = supabase
      .from('orders')
      .select('id, order_number, total, subtotal, discount, tax, payment_method, order_type, created_at, order_status')
      .eq('tenant_id', tenantId)
      .eq('payment_status', 'paid')
      .neq('order_status', 'cancelled')
      .order('created_at', { ascending: true });

    if (effectiveOutletId) q = q.eq('outlet_id', effectiveOutletId);
    if (dateFrom) q = q.gte('created_at', `${dateFrom}T00:00:00Z`);
    if (dateTo) q = q.lte('created_at', `${dateTo}T23:59:59Z`);

    const { data: orders, error } = await q;
    if (error) throw error;

    // Group by day/week/month
    const grouped: Record<string, { date: string; count: number; revenue: number; discount: number; avgOrder: number }> = {};
    const allOrders = orders || [];

    allOrders.forEach(o => {
      let key: string;
      const date = new Date(o.created_at);

      if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = o.created_at.split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = { date: key, count: 0, revenue: 0, discount: 0, avgOrder: 0 };
      }
      grouped[key].count++;
      grouped[key].revenue += o.total || 0;
      grouped[key].discount += o.discount || 0;
    });

    // Calculate averages
    Object.values(grouped).forEach(g => {
      g.avgOrder = g.count > 0 ? g.revenue / g.count : 0;
    });

    const reportData = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));

    // Summary
    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalDiscount = allOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
    const totalOrders = allOrders.length;

    // Payment method breakdown
    const byPaymentMethod: Record<string, { count: number; revenue: number }> = {};
    allOrders.forEach(o => {
      const method = o.payment_method || 'cash';
      if (!byPaymentMethod[method]) byPaymentMethod[method] = { count: 0, revenue: 0 };
      byPaymentMethod[method].count++;
      byPaymentMethod[method].revenue += o.total || 0;
    });

    // Order type breakdown
    const byOrderType: Record<string, { count: number; revenue: number }> = {};
    allOrders.forEach(o => {
      const type = o.order_type || 'dine-in';
      if (!byOrderType[type]) byOrderType[type] = { count: 0, revenue: 0 };
      byOrderType[type].count++;
      byOrderType[type].revenue += o.total || 0;
    });

    res.json({
      success: true,
      summary: {
        totalRevenue,
        totalOrders,
        totalDiscount,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        dateRange: { from: dateFrom || 'all', to: dateTo || 'all' }
      },
      data: reportData,
      byPaymentMethod: Object.entries(byPaymentMethod).map(([method, data]) => ({ method, ...data })),
      byOrderType: Object.entries(byOrderType).map(([type, data]) => ({ type, ...data }))
    });
  } catch (error) {
    logger.error('Sales report error', { error });
    res.status(500).json({ success: false, error: 'Failed to get sales report' });
  }
});

// ─── Product Performance Report ───────────────────────────────────────────────
router.get('/products', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { outletId, dateFrom, dateTo, limit = '20' } = req.query;
    const tenantId = req.user!.tenantId;
    const effectiveOutletId = (outletId as string) || req.user!.outletId;

    let q = supabase
      .from('order_items')
      .select(`
        product_id,
        product_name,
        quantity,
        unit_price,
        subtotal,
        orders!inner(
          outlet_id,
          created_at,
          order_status,
          payment_status,
          tenant_id
        )
      `)
      .eq('orders.tenant_id', tenantId)
      .eq('orders.payment_status', 'paid')
      .neq('orders.order_status', 'cancelled');

    if (effectiveOutletId) q = q.eq('orders.outlet_id', effectiveOutletId);
    if (dateFrom) q = q.gte('orders.created_at', `${dateFrom}T00:00:00Z`);
    if (dateTo) q = q.lte('orders.created_at', `${dateTo}T23:59:59Z`);

    const { data: items, error } = await q;
    if (error) throw error;

    // Aggregate by product
    const productMap: Record<string, { productId: string; name: string; quantity: number; revenue: number; orders: number }> = {};
    (items || []).forEach(item => {
      const pid = item.product_id;
      if (!productMap[pid]) {
        productMap[pid] = {
          productId: pid,
          name: item.product_name || 'Unknown',
          quantity: 0,
          revenue: 0,
          orders: 0
        };
      }
      productMap[pid].quantity += item.quantity || 0;
      productMap[pid].revenue += item.subtotal || 0;
      productMap[pid].orders++;
    });

    const products = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, parseInt(limit as string, 10));

    res.json({ success: true, products, total: Object.keys(productMap).length });
  } catch (error) {
    logger.error('Product report error', { error });
    res.status(500).json({ success: false, error: 'Failed to get product report' });
  }
});

export default router;
