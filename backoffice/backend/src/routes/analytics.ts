import { Router } from 'express';
import { supabase } from '../supabase';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { config } from '../config';
import { logger } from '../middleware/logger';

const router = Router();

// Cache for analytics
const analyticsCache = new Map<string, { data: any; timestamp: number }>();

// Get top products
router.get('/top-products', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const { outletId, days = '7', limit = '20' } = req.query;

    if (!outletId) {
      return res.status(400).json({ success: false, error: 'outletId is required' });
    }

    const daysInt = parseInt(days as string, 10);
    const limitInt = parseInt(limit as string, 10);

    // Check cache
    const cacheKey = `top-products-${outletId}-${days}-${limit}`;
    const cached = analyticsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < config.analytics.cacheTTL * 1000) {
      return res.json(cached.data);
    }

    const now = new Date();
    const fromDate = new Date(now.getTime() - daysInt * 24 * 60 * 60 * 1000);

    // Fallback to manual query
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        product_id,
        product_name,
        quantity,
        unit_price,
        orders!inner(
          outlet_id,
          created_at,
          order_status,
          tenant_id
        )
      `)
      .eq('orders.outlet_id', outletId)
      .eq('orders.tenant_id', req.user!.tenantId)
      .eq('orders.order_status', 'completed')
      .gte('orders.created_at', fromDate.toISOString())
      .lte('orders.created_at', now.toISOString());

    if (error) {
      throw error;
    }

    // Aggregate manually
    const aggregated = new Map<string, any>();
    orderItems?.forEach(item => {
      const existing = aggregated.get(item.product_id);
      if (existing) {
        existing.salesCount += item.quantity;
        existing.revenue += item.unit_price * item.quantity;
      } else {
        aggregated.set(item.product_id, {
          productId: item.product_id,
          name: item.product_name || 'Unknown Product',
          salesCount: item.quantity,
          revenue: item.unit_price * item.quantity
        });
      }
    });

    const products = Array.from(aggregated.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limitInt)
      .map(p => ({
        ...p,
        trend: 'stable',
        trendPercentage: 0
      }));

    const response = {
      success: true,
      period: {
        days: daysInt,
        from: fromDate.toISOString(),
        to: now.toISOString()
      },
      products,
      totalSales: products.reduce((sum, p) => sum + p.salesCount, 0),
      totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0)
    };

    analyticsCache.set(cacheKey, { data: response, timestamp: Date.now() });
    
    // Store in DB Cache for cross-instance consistency
    supabase.from('analytics_cache').upsert({
      cache_key: cacheKey,
      outlet_id: outletId,
      data: response,
      expires_at: new Date(Date.now() + config.analytics.cacheTTL * 1000).toISOString()
    }).then(() => {});

    return res.json(response);

  } catch (error) {
    logger.error('Get top products error', { error });
    res.status(500).json({ success: false, error: 'Failed to get top products' });
  }
});

export default router;
