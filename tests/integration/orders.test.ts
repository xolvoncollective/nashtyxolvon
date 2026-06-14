import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../backoffice/backend/src/index';
import { seedTestData, generateTestToken } from './utils/test-helpers';

describe('Orders API Integration Tests', () => {
  let adminToken: string;
  let testOrderId: string;

  beforeAll(async () => {
    seedTestData();
    adminToken = generateTestToken('test-user-id', 'admin', 'test-outlet-id');
  });

  describe('POST /api/orders', () => {
    it('should create a new order successfully', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tenantId: 'demo-tenant',
          outletId: 'test-outlet-id',
          userId: 'test-user-id',
          orderType: 'dine-in',
          tableNumber: '1',
          items: [
            {
              productId: 'test-product-id',
              productName: 'Test Product',
              quantity: 2,
              unitPrice: 10000,
              subtotal: 20000
            }
          ],
          subtotal: 20000,
          total: 22200,
          payments: [
            {
              method: 'cash',
              amount: 22200
            }
          ]
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.order).toBeDefined();
      expect(res.body.order.order_status).toBe('confirmed');
      expect(res.body.order.payment_status).toBe('paid');
      
      testOrderId = res.body.order.id;
    });

    it('should fail with negative stock', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tenantId: 'demo-tenant',
          outletId: 'test-outlet-id',
          userId: 'test-user-id',
          orderType: 'dine-in',
          items: [
            {
              productId: 'test-product-id',
              productName: 'Test Product',
              quantity: 500, // Stock is 100 originally, minus 2 = 98
              unitPrice: 10000,
              subtotal: 5000000
            }
          ],
          subtotal: 5000000,
          total: 5000000,
          payments: [
            { method: 'cash', amount: 5000000 }
          ]
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Stok tidak mencukupi');
    });

    it('should fail with invalid payload (zod validation)', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tenantId: 'demo-tenant',
          outletId: 'test-outlet-id',
          userId: 'test-user-id',
          // missing items, total
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/orders', () => {
    it('should list orders for a tenant', async () => {
      const res = await request(app)
        .get('/api/orders?tenantId=demo-tenant')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.orders)).toBe(true);
      expect(res.body.orders.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should get order details', async () => {
      const res = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.order).toBeDefined();
      expect(res.body.order.id).toBe(testOrderId);
    });
  });

  describe('POST /api/orders/:id/refund', () => {
    it('should refund order partially', async () => {
      const res = await request(app)
        .post(`/api/orders/${testOrderId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Customer complaint',
          refundAmount: 5000
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Refund');
    });
  });

  describe('PUT /api/orders/:id/void', () => {
    it('should fail with invalid manager PIN', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrderId}/void`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Mistake',
          managerPin: 'wrongpin'
        });
      
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('PIN tidak valid');
    });

    it('should void order with valid manager PIN', async () => {
      const res = await request(app)
        .put(`/api/orders/${testOrderId}/void`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Mistake',
          managerPin: '1234'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Verify order status changed to cancelled
      const getRes = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getRes.body.order.order_status).toBe('cancelled');
    });
  });
});
