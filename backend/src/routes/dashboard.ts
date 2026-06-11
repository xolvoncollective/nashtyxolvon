import { Router } from 'express';
import db from '../db/database';

const router = Router();

// Dashboard KPIs and metrics
router.get('/kpi', (req, res) => {
  try {
    const { tenantId, outletId, dateFrom, dateTo } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let whereClause = 'WHERE o.tenant_id = ? AND o.payment_status = "paid"';
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
    const todaySales = db.prepare(`
      SELECT 
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as total_sales,
        COALESCE(AVG(total), 0) as avg_order_value
      FROM orders o
      ${whereClause} AND DATE(o.created_at) = DATE('now')
    `).get(...params);

    // Yesterday's sales for comparison
    const yesterdaySales = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total_sales
      FROM orders o
      ${whereClause} AND DATE(o.created_at) = DATE('now', '-1 day')
    `).get(...params) as any;

    // Top products
    const topProducts = db.prepare(`
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
    `).all(...params);

    // Sales by order type
    const salesByType = db.prepare(`
      SELECT 
        order_type,
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as total_sales
      FROM orders o
      ${whereClause}
      GROUP BY order_type
    `).all(...params);

    // Calculate growth
    const todayTotal = (todaySales as any).total_sales;
    const yesterdayTotal = yesterdaySales.total_sales;
    const growth = yesterdayTotal > 0 
      ? ((todayTotal - yesterdayTotal) / yesterdayTotal * 100).toFixed(1)
      : 0;

    res.json({
      kpi: {
        today: todaySales,
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

// Recent orders
router.get('/recent-orders', (req, res) => {
  try {
    const { tenantId, outletId, limit = 10 } = req.query;

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

    query += ` ORDER BY o.created_at DESC LIMIT ?`;
    params.push(Number(limit));

    const orders = db.prepare(query).all(...params);

    res.json({ orders });
  } catch (error: any) {
    console.error('Get recent orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
