import { Router } from 'express';
import { query, get, run } from '../db/database';


const router = Router();

// Route 41: GET /api/reports/sales — Sales report
router.get('/sales', async (req, res) => {
  try {
    const { tenantId, outletId, dateFrom, dateTo } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let whereClause = "WHERE o.tenant_id = ? AND o.payment_status = 'paid'";
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

    // Daily breakdown
    const dailySales = await query(`
      SELECT 
        DATE(o.created_at, 'localtime') as date,
        COUNT(*) as order_count,
        COALESCE(SUM(o.subtotal), 0) as gross_sales,
        COALESCE(SUM(o.discount), 0) as total_discount,
        COALESCE(SUM(o.tax), 0) as total_tax,
        COALESCE(SUM(o.service_charge), 0) as total_sc,
        COALESCE(SUM(o.total), 0) as net_sales,
        COALESCE(AVG(o.total), 0) as avg_order_value
      FROM orders o
      ${whereClause}
      GROUP BY DATE(o.created_at, 'localtime')
      ORDER BY date DESC
      LIMIT 30
    `, params);

    // Summary totals
    const summary = await get(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(o.subtotal), 0) as gross_sales,
        COALESCE(SUM(o.discount), 0) as total_discount,
        COALESCE(SUM(o.tax), 0) as total_tax,
        COALESCE(SUM(o.service_charge), 0) as total_sc,
        COALESCE(SUM(o.total), 0) as net_sales,
        COALESCE(AVG(o.total), 0) as avg_order_value
      FROM orders o
      ${whereClause}
    `, params);

    // By order type
    const byOrderType = await query(`
      SELECT 
        o.order_type,
        COUNT(*) as order_count,
        COALESCE(SUM(o.total), 0) as total_sales
      FROM orders o
      ${whereClause}
      GROUP BY o.order_type
      ORDER BY total_sales DESC
    `, params);

    res.json({ success: true, data: { summary, dailySales, byOrderType } });
  } catch (error: any) {
    console.error('Sales report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 42: GET /api/reports/products — Product performance report
router.get('/products', async (req, res) => {
  try {
    const { tenantId, outletId, dateFrom, dateTo, limit = 50 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let whereClause = "WHERE o.tenant_id = ? AND o.payment_status = 'paid'";
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

    params.push(Number(limit));

    const products = await query(`
      SELECT 
        oi.product_id,
        oi.product_name,
        p.category_id,
        c.name as category_name,
        SUM(oi.quantity) as total_qty,
        SUM(oi.subtotal) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count,
        AVG(oi.unit_price) as avg_price,
        p.cost,
        SUM(oi.subtotal) - (COALESCE(p.cost, 0) * SUM(oi.quantity)) as estimated_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_revenue DESC
      LIMIT ?
    `, params);

    res.json({ success: true, data: { products } });
  } catch (error: any) {
    console.error('Product report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 43: GET /api/reports/cashiers — Cashier performance report
router.get('/cashiers', async (req, res) => {
  try {
    const { tenantId, outletId, dateFrom, dateTo } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let whereClause = "WHERE o.tenant_id = ? AND o.payment_status = 'paid'";
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

    const cashiers = await query(`
      SELECT 
        u.id,
        u.name,
        u.role,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_sales,
        COALESCE(AVG(o.total), 0) as avg_order_value,
        COALESCE(SUM(o.discount), 0) as total_discount_given,
        SUM(CASE WHEN o.order_status = 'cancelled' THEN 1 ELSE 0 END) as void_count
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id AND o.payment_status = 'paid'
      WHERE u.tenant_id = ? AND u.role IN ('cashier', 'manager')
      ${outletId ? 'AND u.outlet_id = ?' : ''}
      GROUP BY u.id, u.name
      ORDER BY total_sales DESC
    `, outletId ? [tenantId, outletId] : [tenantId]);

    res.json({ success: true, data: { cashiers } });
  } catch (error: any) {
    console.error('Cashier report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 44: GET /api/reports/menu-engineering — Menu engineering analysis (BCG Matrix)
router.get('/menu-engineering', async (req, res) => {
  try {
    const { tenantId, outletId, dateFrom, dateTo } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    let whereClause = "WHERE o.tenant_id = ? AND o.payment_status = 'paid'";
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

    const products = await query(`
      SELECT 
        oi.product_id,
        oi.product_name,
        c.name as category_name,
        SUM(oi.quantity) as total_qty,
        SUM(oi.subtotal) as total_revenue,
        AVG(oi.unit_price) as avg_price,
        p.cost as unit_cost,
        (AVG(oi.unit_price) - COALESCE(p.cost, 0)) as profit_margin,
        SUM(oi.subtotal) - (COALESCE(p.cost, 0) * SUM(oi.quantity)) as total_profit
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_qty DESC
    `, params);

    // Calculate averages for classification
    const avgQty = products.length > 0
      ? (products as any[]).reduce((sum: number, p: any) => sum + (p.total_qty || 0), 0) / products.length
      : 0;
    const avgProfit = products.length > 0
      ? (products as any[]).reduce((sum: number, p: any) => sum + (p.profit_margin || 0), 0) / products.length
      : 0;

    // Fix division by zero if products.length is 0
    if (products.length === 0) {
      return res.json({
        success: true,
        data: { products: [], averages: { avgQty: 0, avgProfitMargin: 0 }, summary: { stars: 0, plowhorses: 0, puzzles: 0, dogs: 0 } }
      });
    }

    // Classify products (Menu Engineering BCG Matrix)
    const classified = (products as any[]).map(p => {
      const highPopularity = p.total_qty >= avgQty;
      const highProfitability = p.profit_margin >= avgProfit;

      let classification: string;
      if (highPopularity && highProfitability) classification = 'star';       // ⭐ Stars
      else if (highPopularity && !highProfitability) classification = 'plowhorse'; // 🐴 Plowhorses
      else if (!highPopularity && highProfitability) classification = 'puzzle';    // 🧩 Puzzles
      else classification = 'dog';                                                  // 🐕 Dogs

      return { ...p, classification };
    });

    res.json({
      success: true,
      data: {
        products: classified,
        averages: { avgQty: Math.round(avgQty), avgProfitMargin: Math.round(avgProfit) },
        summary: {
          stars: classified.filter(p => p.classification === 'star').length,
          plowhorses: classified.filter(p => p.classification === 'plowhorse').length,
          puzzles: classified.filter(p => p.classification === 'puzzle').length,
          dogs: classified.filter(p => p.classification === 'dog').length,
        }
      }
    });
  } catch (error: any) {
    console.error('Menu engineering error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
