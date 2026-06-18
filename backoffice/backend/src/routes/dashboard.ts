import { Router } from 'express';
import { query } from '../db/database';
import { FinancialCalculationService } from '../services/FinancialCalculationService';

const router = Router();

// GET /api/dashboard/kpi — Dashboard KPIs
router.get('/kpi', (req, res) => {
  try {
    const { tenantId, outletId, dateFrom, dateTo } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let whereClause = "WHERE o.tenant_id = ? AND o.payment_status = 'paid' AND o.order_status != 'cancelled'";
    const params: any[] = [tenantId];

    if (outletId) {
      whereClause += ' AND o.outlet_id = ?';
      params.push(outletId);
    }
    if (dateFrom) {
      whereClause += ' AND DATE(o.created_at) >= DATE(?)';
      params.push(dateFrom);
    }
    if (dateTo) {
      whereClause += ' AND DATE(o.created_at) <= DATE(?)';
      params.push(dateTo);
    }

    const todayParams = [`${whereClause} AND DATE(o.created_at, 'localtime') = DATE('now', 'localtime')`, params];
    const yesterdayParams = [`${whereClause} AND DATE(o.created_at, 'localtime') = DATE('now', '-1 day', 'localtime')`, params];

    const kpi = FinancialCalculationService.getDashboardKpi(tenantId as string, todayParams, yesterdayParams);
    const topProducts = FinancialCalculationService.getTopProducts(tenantId as string, todayParams, 10);
    const salesByType = FinancialCalculationService.getSalesByOrderType(tenantId as string, todayParams);

    res.json({
      success: true,
      data: {
        date: new Date().toISOString().split('T')[0],
        totalOrders: kpi.today?.total_orders || 0,
        grossRevenue: kpi.today?.gross_sales || 0,
        netRevenue: kpi.today?.net_sales || 0,
        totalDiscounts: kpi.today?.total_discount || 0,
        averageOrderValue: kpi.today?.avg_order_value || 0,
        paymentMethods: [],
        yesterday: kpi.yesterday,
        growth: kpi.growth,
        topProducts,
        salesByType
      }
    });
  } catch (error: any) {
    console.error('Get KPI error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/recent-orders — Recent orders
router.get('/recent-orders', (req, res) => {
  try {
    const { tenantId, outletId, limit = 10 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let sql = `
      SELECT o.id, o.order_number, o.order_type, o.table_number,
             o.total, o.payment_method, o.order_status, o.created_at,
             u.name as cashier_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.tenant_id = ?
    `;
    const params: any[] = [tenantId];

    if (outletId) {
      sql += ' AND o.outlet_id = ?';
      params.push(outletId);
    }

    sql += ' ORDER BY o.created_at DESC LIMIT ?';
    params.push(Number(limit));

    const orders = query(sql, params);

    res.json({ success: true, orders });
  } catch (error: any) {
    console.error('Get recent orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/weekly-chart — 7-day revenue chart
router.get('/weekly-chart', (req, res) => {
  try {
    const { tenantId, outletId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let whereClause = "WHERE o.tenant_id = ? AND o.payment_status = 'paid' AND o.order_status != 'cancelled'";
    const params: any[] = [tenantId];

    if (outletId) {
      whereClause += ' AND o.outlet_id = ?';
      params.push(outletId);
    }

    const result = FinancialCalculationService.getWeeklyChart(tenantId as string, [whereClause, params]);

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Weekly chart error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/payment-distribution — Payment method distribution
router.get('/payment-distribution', (req, res) => {
  try {
    const { tenantId, outletId, dateFrom, dateTo } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let whereClause = "WHERE o.tenant_id = ? AND o.payment_status = 'paid' AND o.order_status != 'cancelled'";
    const params: any[] = [tenantId];

    if (outletId) { whereClause += ' AND o.outlet_id = ?'; params.push(outletId); }
    if (dateFrom) { whereClause += ' AND DATE(o.created_at) >= DATE(?)'; params.push(dateFrom); }
    if (dateTo) { whereClause += ' AND DATE(o.created_at) <= DATE(?)'; params.push(dateTo); }

    if (!dateFrom && !dateTo) {
      whereClause += ' AND DATE(o.created_at) = DATE("now")';
    }

    const result = FinancialCalculationService.getPaymentDistribution(tenantId as string, [whereClause, params]);
    const total = result.reduce((sum: number, d: any) => sum + (d.total_amount || 0), 0);

    res.json({ success: true, data: result, total });
  } catch (error: any) {
    console.error('Payment distribution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/top-products — Top 10 products
router.get('/top-products', (req, res) => {
  try {
    const { tenantId, outletId, period = 'today' } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let whereClause = "WHERE o.tenant_id = ? AND o.payment_status = 'paid' AND o.order_status != 'cancelled'";
    const params: any[] = [tenantId];

    if (outletId) { whereClause += ' AND o.outlet_id = ?'; params.push(outletId); }

    switch (period) {
      case 'today':
        whereClause += ' AND DATE(o.created_at) = DATE("now")';
        break;
      case 'week':
        whereClause += ' AND DATE(o.created_at) >= DATE("now", "-7 days")';
        break;
      case 'month':
        whereClause += ' AND DATE(o.created_at) >= DATE("now", "-30 days")';
        break;
    }

    const products = FinancialCalculationService.getTopProducts(tenantId as string, [whereClause, params], 10);

    res.json({ success: true, data: products });
  } catch (error: any) {
    console.error('Top products error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dashboard/hourly-sales — Hourly sales heatmap
router.get('/hourly-sales', (req, res) => {
  try {
    const { tenantId, outletId, date } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    let whereClause = "WHERE o.tenant_id = ? AND o.payment_status = 'paid' AND o.order_status != 'cancelled' AND DATE(o.created_at) = DATE(?)";
    const params: any[] = [tenantId, targetDate];

    if (outletId) {
      whereClause += ' AND o.outlet_id = ?';
      params.push(outletId);
    }

    const result = FinancialCalculationService.getHourlySales(tenantId as string, [whereClause, params]);

    res.json({ success: true, date: targetDate, data: result });
  } catch (error: any) {
    console.error('Hourly sales error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
