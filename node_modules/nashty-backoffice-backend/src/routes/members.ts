import { Router } from 'express';
import { get, query, run } from '../db/database';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';

const router = Router();

// Token config
const JWT_SECRET = process.env.JWT_SECRET || 'nashty_secret_key_2026';
const JWT_EXPIRES_IN = '30d'; // Member tokens last longer

// POST /api/members/auth/login
// Mocking OTP/PIN. If member doesn't exist, auto-create them.
router.post('/auth/login', (req, res) => {
  try {
    const { phone, pin, name } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Nomor telepon wajib diisi' });
    }

    // For demo purposes, we will accept any PIN as long as it's not empty, 
    // or if it's '1234'. Let's enforce '1234' for simplicity unless specified.
    if (pin && pin !== '1234') {
      // Allow any PIN for new users, but '1234' is recommended for demo.
      // We will actually just auto-login for MVP if phone is provided.
    }

    // Find member by phone
    let member = get('SELECT * FROM members WHERE phone = ?', [phone]) as any;

    if (!member) {
      // Auto-register
      const memberId = nanoid();
      // Assume a default tenant for demo
      const tenant = get('SELECT id FROM tenants LIMIT 1') as any;
      if (!tenant) return res.status(500).json({ error: 'Sistem belum dikonfigurasi (No tenant found)' });

      run(`
        INSERT INTO members (id, tenant_id, name, phone, pin_hash, points, segment)
        VALUES (?, ?, ?, ?, ?, 0, 'new')
      `, [memberId, tenant.id, name || 'Member Baru', phone, '1234']); // store plain PIN for demo

      member = get('SELECT * FROM members WHERE id = ?', [memberId]);
    }

    // Generate JWT
    const token = jwt.sign(
      { id: member.id, phone: member.phone, role: 'member' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      member: {
        id: member.id,
        name: member.name,
        phone: member.phone,
        points: member.points,
        visitCount: member.visit_count,
        segment: member.segment
      }
    });
  } catch (error: any) {
    console.error('Member login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Middleware for member auth
const requireMemberAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.member = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/members/profile
router.get('/profile', requireMemberAuth, (req: any, res) => {
  try {
    const memberId = req.member.id;
    const member = get('SELECT * FROM members WHERE id = ?', [memberId]) as any;
    
    if (!member) {
      return res.status(404).json({ error: 'Member tidak ditemukan' });
    }

    res.json({
      success: true,
      member: {
        id: member.id,
        name: member.name,
        phone: member.phone,
        points: member.points,
        visitCount: member.visit_count,
        totalSpent: member.total_spent,
        segment: member.segment,
        createdAt: member.created_at
      }
    });
  } catch (error: any) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/members/history
router.get('/history', requireMemberAuth, (req: any, res) => {
  try {
    const phone = req.member.phone;
    
    // We match orders by customer_phone
    const orders = query(`
      SELECT o.id, o.order_number, o.created_at, o.total, o.outlet_id, 
             out.name as outlet_name
      FROM orders o
      LEFT JOIN outlets out ON o.outlet_id = out.id
      WHERE o.customer_phone = ?
      ORDER BY o.created_at DESC
      LIMIT 20
    `, [phone]);

    res.json({
      success: true,
      orders
    });
  } catch (error: any) {
    console.error('Fetch history error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
