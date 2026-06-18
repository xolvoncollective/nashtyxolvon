import { Router } from 'express';
import db from '../db/database';
import crypto from 'crypto';

const router = Router();

// Start shift
router.post('/start', (req, res) => {
  try {
    const { outletId, userId, startCash } = req.body;

    if (!outletId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already has an open shift
    const existingShift = db.prepare(`
      SELECT id FROM shifts
      WHERE user_id = ? AND status = 'open'
      ORDER BY started_at DESC LIMIT 1
    `).get(userId);

    if (existingShift) {
      return res.status(400).json({ 
        error: 'User already has an open shift',
        shiftId: (existingShift as any).id
      });
    }

    const shiftId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO shifts (id, outlet_id, user_id, start_cash, status)
      VALUES (?, ?, ?, ?, 'open')
    `).run(shiftId, outletId, userId, startCash || 0);

    const shift = db.prepare(`
      SELECT s.*, u.name as user_name, o.name as outlet_name
      FROM shifts s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN outlets o ON s.outlet_id = o.id
      WHERE s.id = ?
    `).get(shiftId);

    res.status(201).json({ success: true, shift });
  } catch (error: any) {
    console.error('Start shift error:', error);
    res.status(500).json({ error: error.message });
  }
});

// End shift
router.post('/:id/end', (req, res) => {
  try {
    const { id } = req.params;
    const { endCash, notes } = req.body;

    const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(id) as any;

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    if (shift.status === 'closed') {
      return res.status(400).json({ error: 'Shift already closed' });
    }

    // Calculate expected cash from orders in this shift
    const result = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total_sales
      FROM orders
      WHERE shift_id = ? AND payment_method = 'cash' AND payment_status = 'paid'
    `).get(id) as any;

    const expectedCash = shift.start_cash + result.total_sales;
    const variance = endCash - expectedCash;

    db.prepare(`
      UPDATE shifts
      SET end_cash = ?, expected_cash = ?, variance = ?, notes = ?,
          ended_at = ?, status = 'closed'
      WHERE id = ?
    `).run(endCash, expectedCash, variance, notes, new Date().toISOString(), id);

    const updatedShift = db.prepare(`
      SELECT s.*, u.name as user_name, o.name as outlet_name
      FROM shifts s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN outlets o ON s.outlet_id = o.id
      WHERE s.id = ?
    `).get(id);

    res.json({ success: true, shift: updatedShift });
  } catch (error: any) {
    console.error('End shift error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active shift for user
router.get('/active', (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const shift = db.prepare(`
      SELECT s.*, u.name as user_name, o.name as outlet_name
      FROM shifts s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN outlets o ON s.outlet_id = o.id
      WHERE s.user_id = ? AND s.status = 'open'
      ORDER BY s.started_at DESC LIMIT 1
    `).get(userId);

    if (!shift) {
      return res.json({ shift: null });
    }

    res.json({ shift });
  } catch (error: any) {
    console.error('Get active shift error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get shift history
router.get('/', (req, res) => {
  try {
    const { outletId, userId, limit = 20 } = req.query;

    let query = `
      SELECT s.*, u.name as user_name, o.name as outlet_name,
        (SELECT COUNT(*) FROM orders WHERE shift_id = s.id) as order_count,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE shift_id = s.id) as total_sales
      FROM shifts s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN outlets o ON s.outlet_id = o.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (outletId) {
      query += ` AND s.outlet_id = ?`;
      params.push(outletId);
    }

    if (userId) {
      query += ` AND s.user_id = ?`;
      params.push(userId);
    }

    query += ` ORDER BY s.started_at DESC LIMIT ?`;
    params.push(Number(limit));

    const shifts = db.prepare(query).all(...params);

    res.json({ shifts });
  } catch (error: any) {
    console.error('Get shifts error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
