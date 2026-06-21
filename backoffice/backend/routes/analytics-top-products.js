/**
 * AUTO-SUGGEST ANALYTICS - TOP PRODUCTS ENDPOINT
 * Task 12: Analyze sales data to identify top-selling products
 * Returns top 20 products based on last 7 days of sales
 */

const { createClient } = require('@supabase/supabase-js');

module.exports = function(app, supabase) {
  /**
   * GET /api/analytics/top-products
   * Query Parameters:
   * - outletId: Filter by specific outlet
   * - days: Number of days to analyze (default: 7)
   * - limit: Number of products to return (default: 20, max: 50)
   * 
   * Response: Array of top products with sales count and trend indicator
   */
  app.get('/api/analytics/top-products', async (req, res) => {
    try {
      const { outletId, days = 7, limit = 20 } = req.query;
      const daysInt = parseInt(days);
      const limitInt = Math.min(parseInt(limit), 50); // Cap at 50

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysInt);

      // Build query based on outlet scope
      let query = supabase
        .from('order_items')
        .select(`
          productId,
          quantity,
          orders!inner(
            outletId,
            status,
            createdAt
          ),
          products(
            name,
            price,
            imageUrl,
            categoryId
          )
        `)
        .gte('orders.createdAt', startDate.toISOString())
        .lte('orders.createdAt', endDate.toISOString())
        .in('orders.status', ['completed', 'paid']);

      // Filter by outlet if specified
      if (outletId) {
        query = query.eq('orders.outletId', outletId);
      }

      const { data: orderItems, error } = await query;

      if (error) {
        console.error('[Analytics] Error fetching order items:', error);
        return res.status(500).json({ error: 'Failed to fetch analytics data' });
      }

      // If insufficient data (<100 transactions), fallback to tenant-level
      if (!outletId && orderItems.length < 100) {
        console.log('[Analytics] Insufficient outlet data, using tenant-level aggregation');
        // Re-query without outlet filter
        const { data: tenantData } = await supabase
          .from('order_items')
          .select(`
            productId,
            quantity,
            orders!inner(status, createdAt),
            products(name, price, imageUrl, categoryId)
          `)
          .gte('orders.createdAt', startDate.toISOString())
          .lte('orders.createdAt', endDate.toISOString())
          .in('orders.status', ['completed', 'paid']);
        
        if (tenantData && tenantData.length >= orderItems.length) {
          orderItems.length = 0;
          orderItems.push(...tenantData);
        }
      }

      // Aggregate sales by product
      const productSales = {};
      orderItems.forEach(item => {
        if (!item.products) return; // Skip if product deleted

        const pid = item.productId;
        if (!productSales[pid]) {
          productSales[pid] = {
            productId: pid,
            name: item.products.name,
            price: item.products.price,
            imageUrl: item.products.imageUrl,
            categoryId: item.products.categoryId,
            totalQuantity: 0,
            orderCount: 0,
            recentSales: [] // Track by day for trend
          };
        }

        productSales[pid].totalQuantity += item.quantity;
        productSales[pid].orderCount += 1;

        // Track daily sales for trend calculation
        const orderDate = new Date(item.orders.createdAt).toDateString();
        if (!productSales[pid].recentSales.includes(orderDate)) {
          productSales[pid].recentSales.push(orderDate);
        }
      });

      // Convert to array and sort by total quantity
      let topProducts = Object.values(productSales)
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, limitInt);

      // Calculate trend indicators (up/down/stable)
      // Compare first half vs second half of period
      const midDate = new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2);

      topProducts = topProducts.map(product => {
        const firstHalfSales = product.recentSales.filter(d => new Date(d) < midDate).length;
        const secondHalfSales = product.recentSales.filter(d => new Date(d) >= midDate).length;
        
        let trend = 'stable';
        if (secondHalfSales > firstHalfSales * 1.2) trend = 'up';
        else if (secondHalfSales < firstHalfSales * 0.8) trend = 'down';

        return {
          productId: product.productId,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          categoryId: product.categoryId,
          totalSales: product.totalQuantity,
          orderCount: product.orderCount,
          trend, // 'up', 'down', 'stable'
          averagePerOrder: Math.round(product.totalQuantity / product.orderCount * 10) / 10
        };
      });

      // Cache control: 6 hours
      res.set('Cache-Control', 'public, max-age=21600');

      res.json({
        success: true,
        data: topProducts,
        meta: {
          period: `Last ${daysInt} days`,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          totalProducts: topProducts.length,
          dataSource: orderItems.length < 100 ? 'tenant-level' : 'outlet-specific'
        }
      });

    } catch (err) {
      console.error('[Analytics] Unexpected error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  console.log('✅ Analytics: Top Products endpoint registered');
};
