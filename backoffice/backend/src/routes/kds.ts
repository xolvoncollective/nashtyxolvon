import { Router } from 'express';
import { query, get, run } from '../db/database';

const router = Router();

// GET /api/kds/analytics — Get KDS KPI metrics for a tenant/outlet for today
router.get('/analytics', async (req, res) => {
  try {
    const { tenantId, outletId } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    // Get today's bounds
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.toISOString();
    
    const params: any[] = [tenantId, startOfDay];
    let outletFilter = '';
    
    if (outletId) {
      outletFilter = ' AND outlet_id = ?';
      params.push(outletId);
    }

    // Orders completed today
    const completedOrdersQuery = `
      SELECT id, created_at, completed_at
      FROM orders
      WHERE tenant_id = ? AND created_at >= ? ${outletFilter} AND kitchen_status IN ('ready', 'served')
    `;
    const completedOrders = await query(completedOrdersQuery, params) as any[];

    // Calculate Average Prep Time
    let totalSeconds = 0;
    for (const o of completedOrders) {
      if (o.completed_at) {
        const diff = new Date(o.completed_at + (o.completed_at.includes('Z') ? '' : 'Z')).getTime() - new Date(o.created_at + (o.created_at.includes('Z') ? '' : 'Z')).getTime();
        totalSeconds += Math.max(0, diff / 1000);
      }
    }
    const avgPrepTimeSeconds = completedOrders.length > 0 ? totalSeconds / completedOrders.length : 0;
    
    // Total Orders Today
    const totalOrdersResult = await get(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE tenant_id = ? AND created_at >= ? ${outletFilter}
    `, params) as { count: number } | null | undefined;
    const totalOrders = totalOrdersResult || { count: 0 };

    // Over SLA (We need items to calculate this precisely, or we can just proxy it for now)
    // For analytics proxy: count order items where completed_at > created_at + production_time
    // Since production_time is in products, we join.
    const overSlaItemsQuery = `
      SELECT oi.id 
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.tenant_id = ? AND o.created_at >= ? ${outletFilter}
        AND o.completed_at IS NOT NULL
        AND (julianday(o.completed_at) - julianday(o.created_at)) * 24 * 60 > p.production_time
    `;
    const overSlaItemsCount = (await query(overSlaItemsQuery, params) as any[]).length;
    const totalItemsCount = (await query(`SELECT oi.id FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.tenant_id = ? AND o.created_at >= ? ${outletFilter}`, params) as any[]).length;

    // Fastest products
    const productStats = await query(`
      SELECT p.name, 
             AVG((julianday(o.completed_at) - julianday(o.created_at)) * 24 * 60) as avg_prep_minutes,
             COUNT(oi.id) as orders_count,
             p.production_time
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.tenant_id = ? AND o.created_at >= ? ${outletFilter} AND o.completed_at IS NOT NULL
      GROUP BY p.id
      ORDER BY avg_prep_minutes ASC
    `, params) as any[];

    // Slowest / Over SLA products
    const slowestProducts = [...productStats].sort((a, b) => b.avg_prep_minutes - a.avg_prep_minutes);

    res.json({
      success: true,
      data: {
        avgPrepTimeSeconds,
        completedOrders: completedOrders?.length || 0,
        totalOrders: totalOrders?.count || 0,
        overSlaItemsCount: overSlaItemsCount || 0,
        totalItemsCount: totalItemsCount || 0,
        fastestProducts: (productStats || []).slice(0, 5),
        slowestProducts: (slowestProducts || []).slice(0, 5)
      }
    });
  } catch (error: any) {
    console.error('KDS Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/kds/production-time/category/:categoryId — Bulk update production time for category
router.put('/production-time/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { timeMinutes } = req.body;

    if (timeMinutes === undefined || typeof timeMinutes !== 'number') {
      return res.status(400).json({ error: 'timeMinutes is required and must be a number' });
    }

    // Just update all products in the category
    await run('UPDATE products SET production_time = ?, updated_at = ? WHERE category_id = ?', [
      timeMinutes,
      new Date().toISOString(),
      categoryId
    ]);

    res.json({ success: true, message: 'Waktu produksi berhasil diperbarui' });
  } catch (error: any) {
    console.error('Update production time error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
