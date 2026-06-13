import { Router } from 'express';
import { query, get, run } from '../db/database';
import { nanoid } from 'nanoid';

const router = Router();

// POST /api/shifts/start — Start shift
router.post('/start', (req, res) => {
  try {
    const { outletId, userId, startCash } = req.body;

    if (!outletId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already has an open shift
    const existingShift = get(`
      SELECT id FROM shifts WHERE user_id = ? AND status = 'open' ORDER BY started_at DESC LIMIT 1
    `, [userId]);

    if (existingShift) {
      return res.status(400).json({ error: 'User already has an open shift', shiftId: (existingShift as any).id });
    }

    const shiftId = nanoid();

    run(`
      INSERT INTO shifts (id, outlet_id, user_id, start_cash, status) VALUES (?, ?, ?, ?, 'open')
    `, [shiftId, outletId, userId, startCash || 0]);

    const shift = get(`
      SELECT s.*, u.name as user_name, o.name as outlet_name
      FROM shifts s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN outlets o ON s.outlet_id = o.id
      WHERE s.id = ?
    `, [shiftId]);

    res.status(201).json({ success: true, shift });
  } catch (error: any) {
    console.error('Start shift error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/shifts/:id/end — End shift
router.post('/:id/end', (req, res) => {
  try {
    const { id } = req.params;
    const { endCash, notes } = req.body;

    const shift = get('SELECT * FROM shifts WHERE id = ?', [id]) as any;
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    if (shift.status === 'closed') return res.status(400).json({ error: 'Shift already closed' });

    // Check if there are unclosed orders
    const pendingOrders = get(`
      SELECT COUNT(*) as count FROM orders
      WHERE shift_id = ? AND (payment_status = 'pending' OR order_status IN ('pending', 'confirmed', 'preparing'))
    `, [id]);
    
    if ((pendingOrders as any).count > 0) {
      return res.status(400).json({ error: `Tidak bisa menutup shift. Ada ${(pendingOrders as any).count} pesanan yang belum selesai atau belum dibayar.` });
    }

    // Calculate expected cash
    // Check payments table first
    let result = get(`
      SELECT COALESCE(SUM(p.amount), 0) as total_sales
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE o.shift_id = ? AND p.method = 'cash' AND o.order_status != 'cancelled'
    `, [id]) as any;

    // Fallback to orders table if no payments table records
    if (!result || result.total_sales === 0) {
      result = get(`
        SELECT COALESCE(SUM(total), 0) as total_sales
        FROM orders WHERE shift_id = ? AND payment_method = 'cash' AND payment_status = 'paid' AND order_status != 'cancelled'
      `, [id]) as any;
    }

    const expectedCash = shift.start_cash + result.total_sales;
    const variance = endCash - expectedCash;

    run(`
      UPDATE shifts SET end_cash = ?, expected_cash = ?, variance = ?, notes = ?,
        ended_at = ?, status = 'closed'
      WHERE id = ?
    `, [endCash, expectedCash, variance, notes, new Date().toISOString(), id]);

    const updatedShift = get(`
      SELECT s.*, u.name as user_name, o.name as outlet_name
      FROM shifts s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN outlets o ON s.outlet_id = o.id
      WHERE s.id = ?
    `, [id]);

    res.json({ success: true, shift: updatedShift });
  } catch (error: any) {
    console.error('End shift error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/shifts/active — Get active shift for user
router.get('/active', (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const shift = get(`
      SELECT s.*, u.name as user_name, o.name as outlet_name
      FROM shifts s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN outlets o ON s.outlet_id = o.id
      WHERE s.user_id = ? AND s.status = 'open' ORDER BY s.started_at DESC LIMIT 1
    `, [userId]);

    res.json({ shift: shift || null });
  } catch (error: any) {
    console.error('Get active shift error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/shifts — Shift history
router.get('/', (req, res) => {
  try {
    const { outletId, userId, limit = 20 } = req.query;

    let sql = `
      SELECT s.*, u.name as user_name, o.name as outlet_name,
        (SELECT COUNT(*) FROM orders WHERE shift_id = s.id) as order_count,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE shift_id = s.id AND payment_status = 'paid') as total_sales
      FROM shifts s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN outlets o ON s.outlet_id = o.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (outletId) { sql += ' AND s.outlet_id = ?'; params.push(outletId); }
    if (userId) { sql += ' AND s.user_id = ?'; params.push(userId); }

    sql += ' ORDER BY s.started_at DESC LIMIT ?';
    params.push(Number(limit));

    const shifts = query(sql, params);

    res.json({ shifts });
  } catch (error: any) {
    console.error('Get shifts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 32: GET /api/shifts/:id/summary — Shift summary with payment breakdown
router.get('/:id/summary', (req, res) => {
  try {
    const { id } = req.params;

    const shift = get(`
      SELECT s.*, u.name as user_name, o.name as outlet_name
      FROM shifts s LEFT JOIN users u ON s.user_id = u.id LEFT JOIN outlets o ON s.outlet_id = o.id
      WHERE s.id = ?
    `, [id]) as any;

    if (!shift) return res.status(404).json({ error: 'Shift not found' });

    // Order summary
    const orderSummary = get(`
      SELECT
        COUNT(*) as total_orders,
        COUNT(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as void_count,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN subtotal ELSE 0 END), 0) as gross_sales,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN discount ELSE 0 END), 0) as total_discount,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN tax ELSE 0 END), 0) as total_tax,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN service_charge ELSE 0 END), 0) as total_sc,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN total ELSE 0 END), 0) as net_sales,
        COALESCE(AVG(CASE WHEN payment_status = 'paid' AND order_status != 'cancelled' THEN total ELSE NULL END), 0) as avg_order_value
      FROM orders WHERE shift_id = ?
    `, [id]);

    // Payment method breakdown
    const paymentBreakdown = query(`
      SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total), 0) as total_amount
      FROM orders
      WHERE shift_id = ? AND payment_status = 'paid' AND order_status != 'cancelled'
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `, [id]);

    // Order type breakdown
    const orderTypeBreakdown = query(`
      SELECT order_type, COUNT(*) as count, COALESCE(SUM(total), 0) as total_amount
      FROM orders
      WHERE shift_id = ? AND payment_status = 'paid' AND order_status != 'cancelled'
      GROUP BY order_type
      ORDER BY total_amount DESC
    `, [id]);

    // Top products
    const topProducts = query(`
      SELECT oi.product_name, SUM(oi.quantity) as total_qty, SUM(oi.subtotal) as total_sales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.shift_id = ? AND o.payment_status = 'paid' AND o.order_status != 'cancelled'
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_sales DESC LIMIT 10
    `, [id]);

    res.json({
      success: true,
      data: {
        shift,
        summary: orderSummary,
        paymentBreakdown,
        orderTypeBreakdown,
        topProducts
      }
    });
  } catch (error: any) {
    console.error('Shift summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 33: GET /api/shifts/:id/orders — Orders in shift
router.get('/:id/orders', (req, res) => {
  try {
    const { id } = req.params;

    const orders = query(`
      SELECT o.id, o.order_number, o.order_type, o.table_number,
             o.subtotal, o.discount, o.tax, o.service_charge, o.total,
             o.payment_method, o.payment_status, o.order_status,
             o.created_at, u.name as cashier_name
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      WHERE o.shift_id = ?
      ORDER BY o.created_at DESC
    `, [id]);

    res.json({ success: true, orders });
  } catch (error: any) {
    console.error('Get shift orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 34: GET /api/shifts/outlet/:outletId/active — Active shift by outlet
router.get('/outlet/:outletId/active', (req, res) => {
  try {
    const { outletId } = req.params;

    const shifts = query(`
      SELECT s.*, u.name as user_name
      FROM shifts s LEFT JOIN users u ON s.user_id = u.id
      WHERE s.outlet_id = ? AND s.status = 'open'
      ORDER BY s.started_at DESC
    `, [outletId]);

    res.json({ success: true, shifts });
  } catch (error: any) {
    console.error('Get active shifts by outlet error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 35: GET /api/shifts/:id/payment-breakdown — Payment method breakdown
router.get('/:id/payment-breakdown', (req, res) => {
  try {
    const { id } = req.params;

    // Try payments table first, fallback to orders.payment_method
    let breakdown = query(`
      SELECT p.method, COUNT(*) as count, COALESCE(SUM(p.amount), 0) as total_amount
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE o.shift_id = ? AND o.payment_status = 'paid' AND o.order_status != 'cancelled'
      GROUP BY p.method ORDER BY total_amount DESC
    `, [id]);

    // Fallback to orders table if no payments records
    if (breakdown.length === 0) {
      breakdown = query(`
        SELECT payment_method as method, COUNT(*) as count, COALESCE(SUM(total), 0) as total_amount
        FROM orders
        WHERE shift_id = ? AND payment_status = 'paid' AND order_status != 'cancelled'
        GROUP BY payment_method ORDER BY total_amount DESC
      `, [id]);
    }

    const total = (breakdown as any[]).reduce((sum, b) => sum + (b.total_amount || 0), 0);

    res.json({
      success: true,
      data: {
        breakdown,
        total,
        methods: (breakdown as any[]).map(b => ({
          ...b,
          percentage: total > 0 ? Math.round(b.total_amount / total * 100) : 0
        }))
      }
    });
  } catch (error: any) {
    console.error('Payment breakdown error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 36: GET /api/shifts/report/daily — Daily shift report
router.get('/report/daily', (req, res) => {
  try {
    const { outletId, date } = req.query;

    if (!outletId) {
      return res.status(400).json({ error: 'outletId required' });
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    const shifts = query(`
      SELECT s.*, u.name as user_name,
        (SELECT COUNT(*) FROM orders WHERE shift_id = s.id AND payment_status = 'paid' AND order_status != 'cancelled') as order_count,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE shift_id = s.id AND payment_status = 'paid' AND order_status != 'cancelled') as total_sales,
        (SELECT COUNT(*) FROM orders WHERE shift_id = s.id AND order_status = 'cancelled') as void_count
      FROM shifts s LEFT JOIN users u ON s.user_id = u.id
      WHERE s.outlet_id = ? AND DATE(s.started_at) = DATE(?)
      ORDER BY s.started_at
    `, [outletId, targetDate]);

    // Daily totals
    const dailyTotal = get(`
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(AVG(total), 0) as avg_order_value
      FROM orders
      WHERE outlet_id = ? AND DATE(created_at) = DATE(?)
        AND payment_status = 'paid' AND order_status != 'cancelled'
    `, [outletId, targetDate]);

    res.json({
      success: true,
      data: {
        date: targetDate,
        shifts,
        daily: dailyTotal
      }
    });
  } catch (error: any) {
    console.error('Daily report error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
