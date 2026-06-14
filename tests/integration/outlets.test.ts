import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../backoffice/backend/src/index';
import { seedTestData, generateTestToken } from './utils/test-helpers';

describe('Outlets API Integration Tests', () => {
  let adminToken: string;
  let testOutletId: string;

  beforeAll(async () => {
    seedTestData();
    adminToken = generateTestToken('test-user-id', 'owner', 'test-outlet-id');
  });

  describe('POST /api/outlets', () => {
    it('should create a new outlet', async () => {
      const res = await request(app)
        .post('/api/outlets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tenantId: 'demo-tenant',
          name: 'New Outlet',
          address: 'Jl. Sudirman No 1',
          phone: '08111222333'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.outlet.name).toBe('New Outlet');
      
      testOutletId = res.body.outlet.id;
    });

    it('should fail if missing name', async () => {
      const res = await request(app)
        .post('/api/outlets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tenantId: 'demo-tenant'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('name are required');
    });
  });

  describe('GET /api/outlets', () => {
    it('should list outlets for a tenant', async () => {
      const res = await request(app)
        .get('/api/outlets?tenantId=demo-tenant')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.outlets)).toBe(true);
      expect(res.body.outlets.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/outlets/:id', () => {
    it('should update an outlet successfully', async () => {
      const res = await request(app)
        .put(`/api/outlets/${testOutletId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Outlet',
          status: 'inactive'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.outlet.name).toBe('Updated Outlet');
      expect(res.body.outlet.status).toBe('inactive');
    });
  });
});
