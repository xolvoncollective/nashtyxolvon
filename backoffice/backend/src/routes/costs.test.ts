import { describe, it, expect, beforeAll } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import costsRouter from './costs';
import { initDatabase, run, get, query } from '../db/database';
import { randomUUID } from 'crypto';

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/costs', costsRouter);
  return app;
};

describe('Costs Route Integration Tests', () => {
  let app: express.Application;
  const tenantId = '00000000-0000-0000-0000-000000000001'; // Default test tenant from schema/migration

  beforeAll(async () => {
    await initDatabase();
    try {
      await run(`INSERT OR IGNORE INTO tenants (id, name, slug) VALUES (?, 'Test Tenant', 'costs-test-tenant')`, [tenantId]);
    } catch (e) {
      console.error('Failed to seed mock tenant in costs.test.ts:', e);
    }
    app = createTestApp();
  });

  describe('POST /api/costs', () => {
    it('should create a new cost item and log it', async () => {
      const payload = {
        tenantId,
        amount: 250000,
        category: 'bahan-baku',
        description: 'Beli cabai dan ayam'
      };

      const res = await request(app)
        .post('/api/costs')
        .send(payload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.cost).toHaveProperty('id');
      expect(res.body.cost.amount).toBe(250000);
      expect(res.body.cost.category).toBe('bahan-baku');
      expect(res.body.cost.description).toBe('Beli cabai dan ayam');

      // Check log
      const log = await get(`
        SELECT * FROM activity_logs 
        WHERE tenant_id = ? AND action = 'create_cost' 
        ORDER BY created_at DESC LIMIT 1
      `, [tenantId]) as any;
      expect(log).toBeDefined();
      expect(log.description).toContain('bahan-baku');
      expect(log.description).toContain('250.000');
    });

    it('should return 400 for invalid category', async () => {
      const payload = {
        tenantId,
        amount: 50000,
        category: 'invalid-category',
        description: 'Test'
      };

      const res = await request(app)
        .post('/api/costs')
        .send(payload)
        .expect(400);

      expect(res.body.error).toContain('Invalid category');
    });
  });

  describe('GET /api/costs', () => {
    it('should list all costs for tenant', async () => {
      const res = await request(app)
        .await get(`/api/costs?tenantId=${tenantId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.costs)).toBe(true);
      expect(res.body.costs.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/costs/:id', () => {
    it('should update an existing cost', async () => {
      // Find the cost created in the first test
      const latestCost = await get('SELECT id FROM nashtycosts WHERE tenant_id = ? LIMIT 1', [tenantId]) as any;
      expect(latestCost).toBeDefined();

      const payload = {
        amount: 300000,
        description: 'Beli cabai super pedas'
      };

      const res = await request(app)
        .put(`/api/costs/${latestCost.id}`)
        .send(payload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.cost.amount).toBe(300000);
      expect(res.body.cost.description).toBe('Beli cabai super pedas');
    });
  });

  describe('DELETE /api/costs/:id', () => {
    it('should delete a cost and log it', async () => {
      const latestCost = await get('SELECT id FROM nashtycosts WHERE tenant_id = ? LIMIT 1', [tenantId]) as any;
      expect(latestCost).toBeDefined();

      const res = await request(app)
        .delete(`/api/costs/${latestCost.id}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      const deletedCost = await get('SELECT * FROM nashtycosts WHERE id = ?', [latestCost.id]);
      expect(deletedCost).toBeNull();
    });
  });
});
