import request from 'supertest';
import express from 'express';
import ordersRouter from './orders';
import { initDatabase } from '../db/database';

import crypto from 'crypto';
// Mock crypto.randomUUID to avoid ESM issues in Jest
jest.spyOn(crypto, 'randomUUID').mockImplementation((() => 'test-id-' + Date.now()) as any);

const app = express();
app.use(express.json());
app.use('/api/orders', ordersRouter);

describe('POST /api/orders - Validation Tests', () => {
  beforeAll(() => {
    initDatabase();
  });

  describe('Request Body Validation', () => {
    it('should return 400 when tenantId is missing', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          outletId: 'outlet-1',
          userId: 'user-1',
          orderType: 'dine-in',
          items: [{
            productId: 'prod-1',
            productName: 'Test Product',
            quantity: 1,
            unitPrice: 10000,
            subtotal: 10000
          }],
          subtotal: 10000,
          total: 10000,
          payments: [{
            method: 'cash',
            amount: 10000
          }]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'tenantId',
            message: 'Required'  // Zod's default required message
          })
        ])
      );
    });

    it('should return 400 when items array is empty', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          tenantId: 'tenant-1',
          outletId: 'outlet-1',
          userId: 'user-1',
          orderType: 'dine-in',
          items: [],
          subtotal: 0,
          total: 0,
          payments: [{
            method: 'cash',
            amount: 0
          }]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'items',
            message: expect.stringContaining('At least one item')
          })
        ])
      );
    });

    it('should return 400 when orderType is invalid', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          tenantId: 'tenant-1',
          outletId: 'outlet-1',
          userId: 'user-1',
          orderType: 'invalid-type',
          items: [{
            productId: 'prod-1',
            productName: 'Test Product',
            quantity: 1,
            unitPrice: 10000,
            subtotal: 10000
          }],
          subtotal: 10000,
          total: 10000,
          payments: [{
            method: 'cash',
            amount: 10000
          }]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'orderType',
            message: expect.stringContaining('Invalid order type')
          })
        ])
      );
    });

    it('should return 400 when quantity is not positive', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          tenantId: 'tenant-1',
          outletId: 'outlet-1',
          userId: 'user-1',
          orderType: 'dine-in',
          items: [{
            productId: 'prod-1',
            productName: 'Test Product',
            quantity: 0,
            unitPrice: 10000,
            subtotal: 0
          }],
          subtotal: 0,
          total: 0,
          payments: [{
            method: 'cash',
            amount: 0
          }]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: expect.stringContaining('quantity'),
            message: expect.stringContaining('positive')
          })
        ])
      );
    });

    it('should return 400 when payments array is empty', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          tenantId: 'tenant-1',
          outletId: 'outlet-1',
          userId: 'user-1',
          orderType: 'dine-in',
          items: [{
            productId: 'prod-1',
            productName: 'Test Product',
            quantity: 1,
            unitPrice: 10000,
            subtotal: 10000
          }],
          subtotal: 10000,
          total: 10000,
          payments: []
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'payments',
            message: expect.stringContaining('At least one payment')
          })
        ])
      );
    });

    it('should return 400 for multiple validation errors', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          // Missing tenantId, outletId, userId
          orderType: 'invalid-type',
          items: [],
          payments: []
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(1);
    });

    it('should return 400 when modifier fields are invalid', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          tenantId: 'tenant-1',
          outletId: 'outlet-1',
          userId: 'user-1',
          orderType: 'dine-in',
          items: [{
            productId: 'prod-1',
            productName: 'Test Product',
            quantity: 1,
            unitPrice: 10000,
            subtotal: 11000,
            modifiers: [{
              groupId: '',  // Invalid: empty string
              groupName: 'Size',
              optionId: 'opt-1',
              optionName: 'Large',
              priceAdjustment: 1000
            }]
          }],
          subtotal: 11000,
          total: 11000,
          payments: [{
            method: 'cash',
            amount: 11000
          }]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: expect.stringContaining('groupId'),
            message: expect.stringContaining('required')
          })
        ])
      );
    });

    it('should return 400 when total is zero or negative', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          tenantId: 'tenant-1',
          outletId: 'outlet-1',
          userId: 'user-1',
          orderType: 'dine-in',
          items: [{
            productId: 'prod-1',
            productName: 'Test Product',
            quantity: 1,
            unitPrice: 10000,
            subtotal: 10000
          }],
          subtotal: 10000,
          total: 0,  // Invalid: must be positive
          payments: [{
            method: 'cash',
            amount: 10000
          }]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'total',
            message: expect.stringContaining('positive')
          })
        ])
      );
    });
  });

  describe('Valid Request Handling', () => {
    it('should accept a valid order with all required fields', async () => {
      const validOrder = {
        tenantId: 'tenant-test-123',
        outletId: 'outlet-test-123',
        userId: 'user-test-123',
        orderType: 'dine-in',
        items: [{
          productId: 'prod-test-123',
          productName: 'Test Nasi Goreng',
          quantity: 2,
          unitPrice: 25000,
          subtotal: 50000
        }],
        subtotal: 50000,
        total: 50000,
        payments: [{
          method: 'cash',
          amount: 50000
        }]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(validOrder);

      // It passes Zod validation, but fails business validation because product is not found
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not found');
    });

    it('should accept order with modifiers', async () => {
      const validOrder = {
        tenantId: 'tenant-test-123',
        outletId: 'outlet-test-123',
        userId: 'user-test-123',
        orderType: 'takeaway',
        items: [{
          productId: 'prod-test-123',
          productName: 'Test Coffee',
          quantity: 1,
          unitPrice: 15000,
          subtotal: 17000,
          modifiers: [{
            groupId: 'group-1',
            groupName: 'Size',
            optionId: 'opt-1',
            optionName: 'Large',
            priceAdjustment: 2000
          }]
        }],
        subtotal: 17000,
        total: 17000,
        payments: [{
          method: 'debit',
          amount: 17000
        }]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(validOrder);

      // It passes Zod validation, but fails business validation because product is not found
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not found');
    });

    it('should accept order with multiple payments (split payment)', async () => {
      const validOrder = {
        tenantId: 'tenant-test-123',
        outletId: 'outlet-test-123',
        userId: 'user-test-123',
        orderType: 'dine-in',
        tableNumber: 'T-05',
        items: [{
          productId: 'prod-test-123',
          productName: 'Test Meal',
          quantity: 1,
          unitPrice: 100000,
          subtotal: 100000
        }],
        subtotal: 100000,
        total: 100000,
        payments: [
          {
            method: 'cash',
            amount: 50000
          },
          {
            method: 'debit',
            amount: 50000
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(validOrder);

      // It passes Zod validation, but fails business validation because product is not found
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not found');
    });

    it('should accept all valid orderType variations', async () => {
      const orderTypes = ['dine-in', 'takeaway', 'gofood', 'grabfood', 'shopeefood', 'dine_in', 'take_away', 'shopee'];

      for (const orderType of orderTypes) {
        const validOrder = {
          tenantId: 'tenant-test-123',
          outletId: 'outlet-test-123',
          userId: 'user-test-123',
          orderType,
          items: [{
            productId: 'prod-test-123',
            productName: 'Test Product',
            quantity: 1,
            unitPrice: 10000,
            subtotal: 10000
          }],
          subtotal: 10000,
          total: 10000,
          payments: [{
            method: 'cash',
            amount: 10000
          }]
        };

        const response = await request(app)
          .post('/api/orders')
          .send(validOrder);

        // Should pass validation, but fails business validation because product is not found
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('not found');
      }
    });
  });
});
