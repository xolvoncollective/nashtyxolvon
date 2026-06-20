import { Router } from 'express';
import { supabase } from '../supabase';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { logger } from '../middleware/logger';

const router = Router();

// ─── Get Dashboard KPI ────────────────────────────────────────────────────────
router.get('/kpi', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { outletId, tenantId: queryTenantId } = req.query;
    const tenantId = (queryTenantId as string) || req.user!.tenantId;
    const effectiveOutletId = (outletId as string) || req.user!.outletId;

    const todayString = new Date().toISOString().split('T')[0];
    const startOfDay = `${todayString}T00:00:00.000Z`;
    const startOfYesterday = new Date(new Date().getTime() - 86400000).toISOString().split('T')[0] + 'T00:00:00.000Z';
    const endOfYesterday = `${todayString}T00:00:00.000Z`;

    // Today's orders
    let q = supabase
      .from('orders')
      .select('subtotal, discount, total, order_type, payment_method')
      .eq('tenant_id', tenantId)
      .eq('payment_status', 'paid')
      .neq('order_status', 'cancelled')
      .gte('created_at', startOfDay);

    if (effectiveOutletId) q = q.eq('outlet_id', effectiveOutletId);
    const { data: todayOrders, error } = await q;
    if (error) throw error;

    // Yesterday's orders (for growth calc)
    let yq = supabase
      .from('orders')
      .select('total')
      .eq('tenant_id', tenantId)
      .eq('payment_status', 'paid')
      .neq('order_status', 'cancelled')
      .gte('created_at', startOfYesterday)
      .lt('created_at', endOfYesterday);

    if (effectiveOutletId) yq = yq.eq('outlet_id', effectiveOutletId);
    const { data: yesterdayOrders } = await yq;

    const grossRevenue = todayOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
    const totalDiscounts = todayOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
    const netRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const yesterdayRevenue = (yesterdayOrders || []).reduce((sum, o) => sum + (o.total || 0), 0);
    const growth = yesterdayRevenue > 0 ? ((netRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

    // Sales by type
    const salesByType: Record<string, { count: number; revenue: number }> = {};
    todayOrders.forEach(o => {
      const type = o.order_type || 'dine-in';
      if (!salesByType[type]) salesByType[type] = { count: 0, revenue: 0 };
      salesByType[type].count++;
      salesByType[type].revenue += o.total || 0;
    });

    // Sales by payment method
    const salesByPayment: Record<string, { count: number; revenue: number }> = {};
    todayOrders.forEach(o => {
      const method = o.payment_method || 'cash';
      if (!salesByPayment[method]) salesByPayment[method] = { count: 0, revenue: 0 };
      salesByPayment[method].count++;
      salesByPayment[method].revenue += o.total || 0;
    });

    res.json({
      success: true,
      data: {
        date: todayString,
        totalOrders: todayOrders.length,
        grossRevenue,
        netRevenue,
        totalDiscounts,
        averageOrderValue: todayOrders.length ? netRevenue / todayOrders.length : 0,
        growth: Math.round(growth * 10) / 10,
        yesterday: { totalOrders: (yesterdayOrders || []).length, revenue: yesterdayRevenue },
        salesByType: Object.entries(salesByType).map(([type, data]) => ({ type, ...data })),
        salesByPayment: Object.entries(salesByPayment).map(([method, data]) => ({ method, ...data }))
      }
    });
  } catch (error) {
    logger.error('Dashboard KPI error', { error });
    res.status(500).json({ success: false, error: 'Failed to get KPI data' });
  }
});

// ─── Recent Orders ────────────────────────────────────────────────────────────
router.get('/recent-orders', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { outletId, limit = '10' } = req.query;
    const tenantId = req.user!.tenantId;
    const effectiveOutletId = (outletId as string) || req.user!.outletId;

    let q = supabase
      .from('orders')
      .select('id, order_number, order_type, total, payment_status, order_status, created_at, table_number, customer_name')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string, 10));

    if (effectiveOutletId) q = q.eq('outlet_id', effectiveOutletId);

    const { data, error } = await q;
    if (error) throw error;

    res.json({ success: true, orders: data || [] });
  } catch (error) {
    logger.error('Recent orders error', { error });
    res.status(500).json({ success: false, error: 'Failed to get recent orders' });
  }
});

// ─── Weekly Revenue Chart ─────────────────────────────────────────────────────
router.get('/weekly-chart', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { outletId } = req.query;
    const tenantId = req.user!.tenantId;
    const effectiveOutletId = (outletId as string) || req.user!.outletId;

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const startDate = sevenDaysAgo.toISOString().split('T')[0] + 'T00:00:00.000Z';

    let q = supabase
      .from('orders')
      .select('total, created_at')
      .eq('tenant_id', tenantId)
      .eq('payment_status', 'paid')
      .neq('order_status', 'cancelled')
      .gte('created_at', startDate);

    if (effectiveOutletId) q = q.eq('outlet_id', effectiveOutletId);
    const { data, error } = await q;
    if (error) throw error;

    // Build day labels and data
    const chartData: number[] = [0, 0, 0, 0, 0, 0, 0];
    const dayLabels: string[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      dayLabels.push(d.toLocaleDateString('id-ID', { weekday: 'short' }));
    }

    (data || []).forEach(o => {
      const orderDate = new Date(o.created_at);
      const diffDays = Math.floor((today.getTime() - orderDate.getTime()) / 86400000);
      if (diffDays < 7) {
        chartData[6 - diffDays] += o.total || 0;
      }
    });

    res.json({ success: true, data: chartData, labels: dayLabels });
  } catch (error) {
    logger.error('Weekly chart error', { error });
    res.status(500).json({ success: false, error: 'Failed to get weekly chart data' });
  }
});

export default router;
