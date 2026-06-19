import { Router } from 'express';
import { query } from '../db/database';

const router = Router();

// Route 50: GET /api/activity-logs — Activity logs with filters
router.get('/', async (req, res) => {
  try {
    const { tenantId, userId, entityType, action, dateFrom, dateTo, page = 1, limit = 50 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId required' });
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit))); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE al.tenant_id = ?';
    const params: any[] = [tenantId];

    if (userId) {
      whereClause += ' AND al.user_id = ?';
      params.push(userId);
    }

    if (entityType) {
      whereClause += ' AND al.entity_type = ?';
      params.push(entityType);
    }

    if (action) {
      whereClause += ' AND al.action = ?';
      params.push(action);
    }

    if (dateFrom) {
      whereClause += ' AND DATE(al.created_at) >= DATE(?)';
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND DATE(al.created_at) <= DATE(?)';
      params.push(dateTo);
    }

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total FROM activity_logs al ${whereClause}
    `, params);
    const total = (countResult[0] as any)?.total || 0;

    // Get paginated results
    params.push(Number(limit), Number(offset));

    const logs = await query(`
      SELECT al.*, u.name as user_name, u.role as user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, params);

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < total
      }
    });
  } catch (error: any) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
