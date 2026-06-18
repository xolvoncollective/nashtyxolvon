import { Router } from 'express';
import { FinancialCalculationService } from '../services/FinancialCalculationService';

const router = Router();

// Route 41: GET /api/reports/sales — Sales report
router.get('/sales', (req, res) => {
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

    const dailySales = FinancialCalculationService.getSalesBreakdown(tenantId as string, [whereClause, params]);
    const summary = FinancialCalculationService.getSalesSummary(tenantId as string, [whereClause, params]);
    const byOrderType = FinancialCalculationService.getSalesByOrderType(tenantId as string, [whereClause, params]);

    res.json({ success: true, data: { summary, dailySales, byOrderType } });
  } catch (error: any) {
    console.error('Sales report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 42: GET /api/reports/products — Product performance report
router.get('/products', (req, res) => {
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

    const products = FinancialCalculationService.getProductPerformanceReport(tenantId as string, [whereClause, params], Number(limit));

    res.json({ success: true, data: { products } });
  } catch (error: any) {
    console.error('Product report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 43: GET /api/reports/cashiers — Cashier performance report
router.get('/cashiers', (req, res) => {
  try {
    const { tenantId, outletId, dateFrom, dateTo } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    // Cashier performance is not purely time-bound in the same way, but let's pass the params if needed.
    // However, the original sql didn't use dateFrom/dateTo, but it received them in req.query. Wait, it didn't use them in the actual sql?
    // In my rewritten service I didn't add dateFrom/dateTo to cashier report either. Let me pass them correctly if needed.
    // Actually the previous code didn't use dateFrom/dateTo in the WHERE clause of the cashiers SQL!
    // So calling the service as defined is exactly identical.

    const cashiers = FinancialCalculationService.getCashierPerformanceReport(tenantId as string, outletId as string);

    res.json({ success: true, data: { cashiers } });
  } catch (error: any) {
    console.error('Cashier report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route 44: GET /api/reports/menu-engineering — Menu engineering analysis (BCG Matrix)
router.get('/menu-engineering', (req, res) => {
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

    const report = FinancialCalculationService.getMenuEngineeringReport(tenantId as string, [whereClause, params]);

    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Menu engineering error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
