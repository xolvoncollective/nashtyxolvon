import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../backoffice/backend/src/index';
import { seedTestData, generateTestToken } from './utils/test-helpers';

describe('Users API Integration Tests', () => {
  let adminToken: string;
  let testUserId: string;

  beforeAll(async () => {
    seedTestData();
    adminToken = generateTestToken('test-user-id', 'owner', 'test-outlet-id');
  });

  describe('POST /api/users', () => {
    it('should create a new user successfully', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tenantId: 'demo-tenant',
          outletId: 'test-outlet-id',
          name: 'New Cashier',
          role: 'cashier',
          pin: '9999'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe('New Cashier');
      
      testUserId = res.body.user.id;
    });

    it('should fail when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tenantId: 'demo-tenant',
          // missing name, role, pin
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('are required');
    });

    it('should fail when role is invalid', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tenantId: 'demo-tenant',
          name: 'Hacker',
          role: 'superadmin', // Invalid
          pin: '1234'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid role');
    });
  });

  describe('GET /api/users', () => {
    it('should list users for a tenant', async () => {
      const res = await request(app)
        .get('/api/users?tenantId=demo-tenant')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThan(0);
    });

    it('should fail if tenantId is missing', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('tenantId required');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user data successfully', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Cashier',
          pin: '8888' // should hash new pin
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('Updated Cashier');
    });

    it('should fail if user not found', async () => {
      const res = await request(app)
        .put('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Ghost' });
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });
  });

  describe('PATCH /api/users/:id/status', () => {
    it('should deactivate user', async () => {
      const res = await request(app)
        .patch(`/api/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should fail with invalid status', async () => {
      const res = await request(app)
        .patch(`/api/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'deleted' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('status must be');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should soft delete user', async () => {
      const res = await request(app)
        .delete(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify soft delete via GET
      const getRes = await request(app)
        .get('/api/users?tenantId=demo-tenant')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const deletedUser = getRes.body.users.find((u: any) => u.id === testUserId);
      expect(deletedUser.status).toBe('inactive'); // soft delete sets status to inactive
    });
  });
});
