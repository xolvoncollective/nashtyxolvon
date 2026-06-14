import { Router } from 'express';
import { query, get } from '../db/database';

const router = Router();

// GET /api/dashboard/kpi — Dashboard KPIs
router.get('/kpi', (req, res) => {
  try {
    const { tenantId, outletId, dateFrom, dateTo } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let whereClause = 'WHERE o.tenant_id = ? AND o.payment_status = "paid" AND o.order_status != "cancelled"';
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

    // Today's sales
    const todaySales = get(`
      SELECT 
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as total_sales,
        COALESCE(SUM(subtotal), 0) as gross_sales,
        COALESCE(SUM(discount), 0) as total_discount,
        COALESCE(AVG(total), 0) as avg_order_value
      FROM orders o
      ${whereClause} AND DATE(o.created_at) = DATE('now')
    `, params);

    // Yesterday's sales for comparison
    const yesterdaySales = get(`
      SELECT COALESCE(SUM(total), 0) as total_sales
      FROM orders o
      ${whereClause} AND DATE(o.created_at) = DATE('now', '-1 day')
    `, params) as any;

    // Top products
    const topProducts = query(`
      SELECT 
        oi.product_name,
        SUM(oi.quantity) as total_qty,
        SUM(oi.subtotal) as total_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      ${whereClause}
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_sales DESC
      LIMIT 10
    `, params);

    // Sales by order type
    const salesByType = query(`
      SELECT 
        order_type,
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as total_sales
      FROM orders o
      ${whereClause}
      GROUP BY order_type
    `, params);

    // Calculate growth
    const todayTotal = (todaySales as any).total_sales;
    const yesterdayTotal = yesterdaySales.total_sales;
    let growth = 0;
    if (yesterdayTotal > 0) {
      growth = Number(((todayTotal - yesterdayTotal) / yesterdayTotal * 100).toFixed(1));
    } else if (todayTotal > 0) {
      growth = 100; // If yesterday was 0 and today has sales, growth is 100%
    }

    res.json({
      success: true,
      data: {
        date: new Date().toISOString().split('T')[0],
        totalOrders: (todaySales as any).order_count,
        grossRevenue: (todaySales as any).gross_sales,
        netRevenue: (todaySales as any).total_sales,
        totalDiscounts: (todaySales as any).total_discount,
        averageOrderValue: (todaySales as any).avg_order_value,
        paymentMethods: [],
        yesterday: yesterdaySales,
        growth,
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

// Route 37: GET /api/dashboard/weekly-chart — 7-day revenue chart
router.get('/weekly-chart', (req, res) => {
  try {
    const { tenantId, outletId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let whereClause = 'WHERE o.tenant_id = ? AND o.payment_status = "paid" AND o.order_status != "cancelled"';
    const params: any[] = [tenantId];

    if (outletId) {
      whereClause += ' AND o.outlet_id = ?';
      params.push(outletId);
    }

    const weeklyData = query(`
      SELECT 
        DATE(o.created_at, 'localtime') as date,
        strftime('%w', o.created_at, 'localtime') as day_of_week,
        COUNT(*) as order_count,
        COALESCE(SUM(o.total), 0) as revenue,
        COALESCE(AVG(o.total), 0) as avg_order_value
      FROM orders o
      ${whereClause}
        AND DATE(o.created_at, 'localtime') >= DATE('now', '-6 days', 'localtime')
        AND DATE(o.created_at, 'localtime') <= DATE('now', 'localtime')
      GROUP BY DATE(o.created_at, 'localtime')
      ORDER BY date ASC
    `, params);

    // Fill in missing days with zeros
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const existing = (weeklyData as any[]).find(w => w.date === dateStr);
      result.push({
        date: dateStr,
        dayName: dayNames[d.getDay()],
        order_count: existing?.order_count || 0,
        revenue: existing?.revenue || 0,
        avg_order_value: existing?.avg_order_value || 0,
      });
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Weekly chart error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 38: GET /api/dashboard/payment-distribution — Payment method distribution
router.get('/payment-distribution', (req, res) => {
  try {
    const { tenantId, outletId, dateFrom, dateTo } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let whereClause = 'WHERE o.tenant_id = ? AND o.payment_status = "paid" AND o.order_status != "cancelled"';
    const params: any[] = [tenantId];

    if (outletId) { whereClause += ' AND o.outlet_id = ?'; params.push(outletId); }
    if (dateFrom) { whereClause += ' AND DATE(o.created_at) >= DATE(?)'; params.push(dateFrom); }
    if (dateTo) { whereClause += ' AND DATE(o.created_at) <= DATE(?)'; params.push(dateTo); }

    // Default to today if no date filter
    if (!dateFrom && !dateTo) {
      whereClause += ' AND DATE(o.created_at) = DATE("now")';
    }

    const distribution = query(`
      SELECT 
        o.payment_method as method,
        COUNT(*) as count,
        COALESCE(SUM(o.total), 0) as total_amount
      FROM orders o
      ${whereClause}
      GROUP BY o.payment_method
      ORDER BY total_amount DESC
    `, params);

    const total = (distribution as any[]).reduce((sum, d) => sum + (d.total_amount || 0), 0);

    const result = (distribution as any[]).map(d => ({
      ...d,
      percentage: total > 0 ? Math.round(d.total_amount / total * 100) : 0
    }));

    res.json({ success: true, data: result, total });
  } catch (error: any) {
    console.error('Payment distribution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 39: GET /api/dashboard/top-products — Top 10 products
router.get('/top-products', (req, res) => {
  try {
    const { tenantId, outletId, period = 'today' } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let whereClause = 'WHERE o.tenant_id = ? AND o.payment_status = "paid" AND o.order_status != "cancelled"';
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

    const products = query(`
      SELECT 
        oi.product_name as name,
        oi.product_id,
        SUM(oi.quantity) as total_qty,
        SUM(oi.subtotal) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      ${whereClause}
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_qty DESC
      LIMIT 10
    `, params);

    res.json({ success: true, data: products });
  } catch (error: any) {
    console.error('Top products error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 40: GET /api/dashboard/hourly-sales — Hourly sales heatmap
router.get('/hourly-sales', (req, res) => {
  try {
    const { tenantId, outletId, date } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    let whereClause = 'WHERE o.tenant_id = ? AND o.payment_status = "paid" AND o.order_status != "cancelled" AND DATE(o.created_at) = DATE(?)';
    const params: any[] = [tenantId, targetDate];

    if (outletId) {
      whereClause += ' AND o.outlet_id = ?';
      params.push(outletId);
    }

    const hourlyData = query(`
      SELECT 
        CAST(strftime('%H', o.created_at, 'localtime') AS INTEGER) as hour,
        COUNT(*) as order_count,
        COALESCE(SUM(o.total), 0) as revenue
      FROM orders o
      ${whereClause}
      GROUP BY CAST(strftime('%H', o.created_at, 'localtime') AS INTEGER)
      ORDER BY hour
    `, params);

    // Fill in all 24 hours
    const result = [];
    for (let h = 0; h < 24; h++) {
      const existing = (hourlyData as any[]).find(d => d.hour === h);
      result.push({
        hour: h,
        label: `${String(h).padStart(2, '0')}:00`,
        order_count: existing?.order_count || 0,
        revenue: existing?.revenue || 0
      });
    }

    res.json({ success: true, date: targetDate, data: result });
  } catch (error: any) {
    console.error('Hourly sales error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
