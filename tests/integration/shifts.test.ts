import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../backoffice/backend/src/index';
import { seedTestData, generateTestToken } from './utils/test-helpers';

describe('Shifts API Integration Tests', () => {
  let adminToken: string;
  let testShiftId: string;

  beforeAll(async () => {
    seedTestData();
    adminToken = generateTestToken('test-user-id', 'admin', 'test-outlet-id');
  });

  describe('POST /api/shifts/start', () => {
    it('should start a new shift successfully', async () => {
      const res = await request(app)
        .post('/api/shifts/start')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          outletId: 'test-outlet-id',
          userId: 'test-user-id',
          startCash: 500000
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.shift.status).toBe('open');
      expect(res.body.shift.start_cash).toBe(500000);
      
      testShiftId = res.body.shift.id;
    });

    it('should fail if user already has open shift', async () => {
      const res = await request(app)
        .post('/api/shifts/start')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          outletId: 'test-outlet-id',
          userId: 'test-user-id',
          startCash: 100000
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already has an open shift');
    });
  });

  describe('GET /api/shifts/active', () => {
    it('should return active shift for user', async () => {
      const res = await request(app)
        .get('/api/shifts/active?userId=test-user-id')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.shift).toBeDefined();
      expect(res.body.shift.id).toBe(testShiftId);
    });
  });

  describe('GET /api/shifts/:id/summary', () => {
    it('should get shift summary', async () => {
      const res = await request(app)
        .get(`/api/shifts/${testShiftId}/summary`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
    });
  });

  describe('POST /api/shifts/:id/end', () => {
    it('should end shift successfully', async () => {
      const res = await request(app)
        .post(`/api/shifts/${testShiftId}/end`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          endCash: 500000,
          notes: 'Ended correctly'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.shift.status).toBe('closed');
      expect(res.body.shift.variance).toBe(0); // Assuming no cash orders were made during this test
    });

    it('should fail if shift is already closed', async () => {
      const res = await request(app)
        .post(`/api/shifts/${testShiftId}/end`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ endCash: 500000 });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Shift already closed');
    });
  });
});
