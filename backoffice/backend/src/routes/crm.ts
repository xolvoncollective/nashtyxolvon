import express from 'express';
import db from '../db/database';
import { nanoid } from 'nanoid';
import { MemberService } from '../services/MemberService';

const router = express.Router();

// --- CUSTOMERS ---

router.get('/customers', async (req, res) => {
  const tenantId = req.query.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
  const list = db.query('SELECT * FROM crm_customers WHERE tenant_id = ? AND deleted_at IS NULL ORDER BY created_at DESC', [tenantId]);
  res.json({ success: true, list });
});

router.post('/customers', async (req, res) => {
  const { tenantId, name, phone, email, points, total_spent, visit_count } = req.body;
  if (!tenantId || !name) return res.status(400).json({ error: 'tenantId and name are required' });
  const id = nanoid();
  db.run(`INSERT INTO crm_customers (id, tenant_id, name, phone, email, points, total_spent, visit_count) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
          [id, tenantId, name, phone, email, points || 0, total_spent || 0, visit_count || 0]);
  res.json({ success: true, message: 'Customer added', id });
});

router.put('/customers/:id', async (req, res) => {
  const { tenantId, name, phone, email, points, total_spent, visit_count } = req.body;
  const { id } = req.params;
  db.run(`UPDATE crm_customers SET 
          name = COALESCE(?, name), 
          phone = COALESCE(?, phone), 
          email = COALESCE(?, email), 
          points = COALESCE(?, points), 
          total_spent = COALESCE(?, total_spent), 
          visit_count = COALESCE(?, visit_count),
          updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND tenant_id = ?`, 
          [name, phone, email, points, total_spent, visit_count, id, tenantId]);
  res.json({ success: true, message: 'Customer updated' });
});

router.delete('/customers/:id', async (req, res) => {
  const tId = req.query.tenantId || req.body?.tenantId;
  db.run('UPDATE crm_customers SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?', [req.params.id, tId]);
  res.json({ success: true, message: 'Customer deleted' });
});


// --- REWARDS ---

router.get('/rewards', async (req, res) => {
  const tenantId = req.query.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
  const list = db.query('SELECT * FROM crm_rewards WHERE tenant_id = ? AND deleted_at IS NULL ORDER BY created_at DESC', [tenantId]);
  res.json({ success: true, list });
});

router.post('/rewards', async (req, res) => {
  const { tenantId, title, points_required, description, is_active } = req.body;
  if (!tenantId || !title) return res.status(400).json({ error: 'tenantId and title are required' });
  const id = nanoid();
  db.run(`INSERT INTO crm_rewards (id, tenant_id, title, points_required, description, is_active) 
          VALUES (?, ?, ?, ?, ?, ?)`, 
          [id, tenantId, title, points_required || 0, description, is_active !== undefined ? is_active : 1]);
  res.json({ success: true, message: 'Reward added', id });
});

router.put('/rewards/:id', async (req, res) => {
  const { tenantId, title, points_required, description, is_active } = req.body;
  const { id } = req.params;
  db.run(`UPDATE crm_rewards SET 
          title = COALESCE(?, title), 
          points_required = COALESCE(?, points_required), 
          description = COALESCE(?, description), 
          is_active = COALESCE(?, is_active)
          WHERE id = ? AND tenant_id = ?`, 
          [title, points_required, description, is_active, id, tenantId]);
  res.json({ success: true, message: 'Reward updated' });
});

router.delete('/rewards/:id', async (req, res) => {
  const tId = req.query.tenantId || req.body?.tenantId;
  db.run('UPDATE crm_rewards SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?', [req.params.id, tId]);
  res.json({ success: true, message: 'Reward deleted' });
});


// --- POINT TRANSACTIONS ---

router.get('/point-transactions', async (req, res) => {
  const { tenantId, customerId } = req.query;
  if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
  
  let list;
  if (customerId) {
      list = db.query('SELECT * FROM crm_point_transactions WHERE tenant_id = ? AND customer_id = ? AND deleted_at IS NULL ORDER BY created_at DESC', [tenantId, customerId]);
  } else {
      list = db.query('SELECT * FROM crm_point_transactions WHERE tenant_id = ? AND deleted_at IS NULL ORDER BY created_at DESC', [tenantId]);
  }
  
  res.json({ success: true, list });
});

router.post('/point-transactions', async (req, res) => {
  const { tenantId, customerId, points, type, description } = req.body;
  if (!tenantId || !customerId) return res.status(400).json({ error: 'tenantId and customerId are required' });
  
  const id = MemberService.handlePointTransaction(tenantId, customerId, points, type, description);
  
  res.json({ success: true, message: 'Point transaction added', id });
});

export default router;
