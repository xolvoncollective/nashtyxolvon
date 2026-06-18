import express from 'express';
import db from '../db/database';
import { CostService } from '../services/CostService';

const router = express.Router();

router.get('/bahan', (req, res) => {
  const tenantId = req.query.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
  const list = db.query('SELECT * FROM cost_bahan WHERE tenant_id = ? AND deleted_at IS NULL ORDER BY created_at DESC', [tenantId]);
  res.json({ success: true, list });
});

router.post('/bahan', (req, res) => {
  try {
    const { tenantId, nama } = req.body;
    if (!tenantId || !nama) return res.status(400).json({ error: 'tenantId and nama are required' });
    const id = CostService.addBahan(req.body);
    res.json({ success: true, message: 'Bahan added', id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/bahan/:id', (req, res) => {
  try {
    const { tenantId } = req.body;
    CostService.updateBahan(req.params.id, tenantId, req.body);
    res.json({ success: true, message: 'Bahan updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/bahan/:id', (req, res) => {
  const tId = req.query.tenantId || req.body?.tenantId;
  db.run('UPDATE cost_bahan SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?', [req.params.id, tId]);
  res.json({ success: true, message: 'Bahan deleted' });
});

router.post('/bahan/:id/stok', (req, res) => {
  const { tenantId, stok } = req.body;
  db.run('UPDATE cost_bahan SET stok = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?', [stok, req.params.id, tenantId]);
  res.json({ success: true, message: 'Stok updated' });
});

router.get('/riwayat-harga', (req, res) => {
  const tenantId = req.query.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
  const list = db.query('SELECT * FROM cost_riwayat_harga WHERE tenant_id = ? AND deleted_at IS NULL ORDER BY created_at DESC', [tenantId]);
  res.json({ success: true, list });
});

router.get('/recipes', (req, res) => {
  const tenantId = req.query.tenantId;
  if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });
  const list = db.query('SELECT * FROM cost_recipes WHERE tenant_id = ? AND deleted_at IS NULL ORDER BY created_at DESC', [tenantId]);
  res.json({ success: true, list });
});

router.post('/recipes', (req, res) => {
  try {
    const { tenantId, nama } = req.body;
    if (!tenantId || !nama) return res.status(400).json({ error: 'tenantId and nama are required' });
    const id = CostService.addRecipe(req.body);
    res.json({ success: true, message: 'Recipe added', id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/recipes/:id', (req, res) => {
  try {
    const { tenantId } = req.body;
    CostService.updateRecipe(req.params.id, tenantId, req.body);
    res.json({ success: true, message: 'Recipe updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/recipes/:id/promote', (req, res) => {
  try {
    const { tenantId } = req.body;
    CostService.updateRecipe(req.params.id, tenantId, { status: 'final' });
    res.json({ success: true, message: 'Recipe promoted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/recipes/:id', (req, res) => {
  const tId = req.query.tenantId || req.body?.tenantId;
  db.run('UPDATE cost_recipes SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND tenant_id = ?', [req.params.id, tId]);
  res.json({ success: true, message: 'Recipe deleted' });
});

export default router;
