import { get, query } from '../db/database';

export class FinancialCalculationService {
  /**
   * Summarizes shift data including gross, net, tax, discount, etc.
   */
  static getShiftSummary(shiftId: string) {
    const shift = get(`
      SELECT s.*, u.name as user_name, o.name as outlet_name
      FROM shifts s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN outlets o ON s.outlet_id = o.id
      WHERE s.id = ?
    `, [shiftId]);

    if (!shift) return null;

    const orderSummary = get(`
      SELECT
        COUNT(*) as total_orders,
        COUNT(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as void_count,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN subtotal ELSE 0 END), 0) as gross_sales,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN discount ELSE 0 END), 0) as total_discount,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN tax ELSE 0 END), 0) as total_tax,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN service_charge ELSE 0 END), 0) as total_sc,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN total + COALESCE((SELECT SUM(amount) FROM payments p WHERE p.order_id = orders.id AND amount < 0), 0) ELSE 0 END), 0) as net_sales,
        COALESCE(AVG(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN total ELSE NULL END), 0) as avg_order_value
      FROM orders WHERE shift_id = ?
    `, [shiftId]);

    const paymentBreakdown = query(`
      SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total), 0) as total_amount
      FROM orders
      WHERE shift_id = ? AND payment_status = 'paid' AND order_status != 'cancelled'
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `, [shiftId]);

    const orderTypeBreakdown = query(`
      SELECT order_type, COUNT(*) as count, COALESCE(SUM(total), 0) as total_amount
      FROM orders
      WHERE shift_id = ? AND payment_status = 'paid' AND order_status != 'cancelled'
      GROUP BY order_type
      ORDER BY total_amount DESC
    `, [shiftId]);

    const topProducts = query(`
      SELECT oi.product_name, SUM(oi.quantity) as total_qty, SUM(oi.subtotal) as total_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.shift_id = ? AND o.payment_status = 'paid' AND o.order_status != 'cancelled'
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_sales DESC LIMIT 10
    `, [shiftId]);

    return { shift, summary: orderSummary, paymentBreakdown, orderTypeBreakdown, topProducts };
  }

  static getSalesSummary(tenantId: string, params: any[]) {
    return get(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(o.subtotal), 0) as gross_sales,
        COALESCE(SUM(o.discount), 0) as total_discount,
        COALESCE(SUM(o.tax), 0) as total_tax,
        COALESCE(SUM(o.service_charge), 0) as total_sc,
        COALESCE(SUM(o.total + COALESCE((SELECT SUM(amount) FROM payments p WHERE p.order_id = o.id AND amount < 0), 0)), 0) as net_sales,
        COALESCE(AVG(o.total), 0) as avg_order_value
      FROM orders o
      ${params[0]}
    `, params[1]);
  }

  static getSalesBreakdown(tenantId: string, params: any[]) {
     return query(`
      SELECT 
        DATE(o.created_at, 'localtime') as date,
        COUNT(*) as order_count,
        COALESCE(SUM(o.subtotal), 0) as gross_sales,
        COALESCE(SUM(o.discount), 0) as total_discount,
        COALESCE(SUM(o.tax), 0) as total_tax,
        COALESCE(SUM(o.service_charge), 0) as total_sc,
        COALESCE(SUM(o.total + COALESCE((SELECT SUM(amount) FROM payments p WHERE p.order_id = o.id AND amount < 0), 0)), 0) as net_sales,
        COALESCE(AVG(o.total), 0) as avg_order_value
      FROM orders o
      ${params[0]}
      GROUP BY DATE(o.created_at, 'localtime')
      ORDER BY date DESC
      LIMIT 30
    `, params[1]);
  }

  static getSalesByOrderType(tenantId: string, params: any[]) {
     return query(`
      SELECT 
        o.order_type,
        COUNT(*) as order_count,
        COALESCE(SUM(o.total), 0) as total_sales
      FROM orders o
      ${params[0]}
      GROUP BY o.order_type
      ORDER BY total_sales DESC
    `, params[1]);
  }

  static getDashboardKpi(tenantId: string, params: any[], yesterdayParams: any[]) {
    const todaySales = this.getSalesSummary(tenantId, params) as any;
    const yesterdaySales = this.getSalesSummary(tenantId, yesterdayParams) as any;
    
    const todayTotal = todaySales?.net_sales || 0;
    const yesterdayTotal = yesterdaySales?.net_sales || 0;
    let growth = 0;
    if (yesterdayTotal > 0) {
      growth = Number(((todayTotal - yesterdayTotal) / yesterdayTotal * 100).toFixed(1));
    } else if (todayTotal > 0) {
      growth = 100;
    }

    return {
      today: todaySales,
      yesterday: yesterdaySales,
      growth
    };
  }

  static getTopProducts(tenantId: string, params: any[], limit: number = 10) {
    return query(`
      SELECT 
        oi.product_id,
        oi.product_name as name,
        SUM(oi.quantity) as total_qty,
        SUM(oi.subtotal) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      ${params[0]}
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_qty DESC
      LIMIT ${limit}
    `, params[1]);
  }

  static getWeeklyChart(tenantId: string, params: any[]) {
    const weeklyData = query(`
      SELECT 
        DATE(o.created_at, 'localtime') as date,
        strftime('%w', o.created_at, 'localtime') as day_of_week,
        COUNT(*) as order_count,
        COALESCE(SUM(o.total), 0) as revenue,
        COALESCE(AVG(o.total), 0) as avg_order_value
      FROM orders o
      ${params[0]}
        AND DATE(o.created_at, 'localtime') >= DATE('now', '-6 days', 'localtime')
        AND DATE(o.created_at, 'localtime') <= DATE('now', 'localtime')
      GROUP BY DATE(o.created_at, 'localtime')
      ORDER BY date ASC
    `, params[1]);

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
    return result;
  }

  static getPaymentDistribution(tenantId: string, params: any[]) {
    const distribution = query(`
      SELECT 
        o.payment_method as method,
        COUNT(*) as count,
        COALESCE(SUM(o.total), 0) as total_amount
      FROM orders o
      ${params[0]}
      GROUP BY o.payment_method
      ORDER BY total_amount DESC
    `, params[1]);

    const total = (distribution as any[]).reduce((sum, d) => sum + ((d as any).total_amount || 0), 0);

    return (distribution as any[]).map(d => ({
      ...d,
      percentage: total > 0 ? Math.round(d.total_amount / total * 100) : 0
    }));
  }

  static getHourlySales(tenantId: string, params: any[]) {
    const hourlyData = query(`
      SELECT 
        CAST(strftime('%H', o.created_at, 'localtime') AS INTEGER) as hour,
        COUNT(*) as order_count,
        COALESCE(SUM(o.total), 0) as revenue
      FROM orders o
      ${params[0]}
      GROUP BY CAST(strftime('%H', o.created_at, 'localtime') AS INTEGER)
      ORDER BY hour
    `, params[1]);

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
    return result;
  }

  static getProductPerformanceReport(tenantId: string, params: any[], limit: number = 50) {
    return query(`
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
      ${params[0]}
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_revenue DESC
      LIMIT ${limit}
    `, params[1]);
  }

  static getCashierPerformanceReport(tenantId: string, outletId?: string) {
    return query(`
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
  }

  static getMenuEngineeringReport(tenantId: string, params: any[]) {
    const products = query(`
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
      ${params[0]}
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_qty DESC
    `, params[1]);

    const avgQty = products.length > 0
      ? (products as any[]).reduce((sum: number, p: any) => sum + (p.total_qty || 0), 0) / products.length
      : 0;
    const avgProfit = products.length > 0
      ? (products as any[]).reduce((sum: number, p: any) => sum + (p.profit_margin || 0), 0) / products.length
      : 0;

    if (products.length === 0) {
      return { products: [], averages: { avgQty: 0, avgProfitMargin: 0 }, summary: { stars: 0, plowhorses: 0, puzzles: 0, dogs: 0 } };
    }

    const classified = (products as any[]).map(p => {
      const highPopularity = p.total_qty >= avgQty;
      const highProfitability = p.profit_margin >= avgProfit;

      let classification: string;
      if (highPopularity && highProfitability) classification = 'star';       
      else if (highPopularity && !highProfitability) classification = 'plowhorse'; 
      else if (!highPopularity && highProfitability) classification = 'puzzle';    
      else classification = 'dog';                                                  

      return { ...p, classification };
    });

    return {
      products: classified,
      averages: { avgQty: Math.round(avgQty), avgProfitMargin: Math.round(avgProfit) },
      summary: {
        stars: classified.filter((p: any) => p.classification === 'star').length,
        plowhorses: classified.filter((p: any) => p.classification === 'plowhorse').length,
        puzzles: classified.filter((p: any) => p.classification === 'puzzle').length,
        dogs: classified.filter((p: any) => p.classification === 'dog').length,
      }
    };
  }
}
