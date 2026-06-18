import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../backoffice/backend/src/index';
import { seedTestData, generateTestToken } from './utils/test-helpers';

describe('Menu API Integration Tests', () => {
  let adminToken: string;
  let testCategoryId: string;
  let testProductId: string;

  beforeAll(async () => {
    seedTestData();
    adminToken = generateTestToken('test-user-id', 'admin', 'test-outlet-id');
  });

  describe('Categories API', () => {
    describe('POST /api/categories', () => {
      it('should create a new category', async () => {
        const res = await request(app)
          .post('/api/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            tenantId: 'demo-tenant',
            name: 'Beverages',
            slug: 'beverages-123'
          });
        
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.category.name).toBe('Beverages');
        
        testCategoryId = res.body.category.id;
      });

      it('should fail with missing tenantId or name', async () => {
        const res = await request(app)
          .post('/api/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Food' }); // missing tenantId
        
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('tenantId and name are required');
      });

      it('should fail with duplicate slug for the same tenant', async () => {
        const res = await request(app)
          .post('/api/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            tenantId: 'demo-tenant',
            name: 'Beverages', // same name will generate same slug 'beverages'
          });
        
        expect(res.status).toBe(500); // Because of unique constraint in SQLite
        expect(res.body.error).toContain('UNIQUE constraint failed');
      });
    });

    describe('GET /api/categories', () => {
      it('should list categories for a tenant', async () => {
        const res = await request(app)
          .get('/api/categories?tenantId=demo-tenant')
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.categories)).toBe(true);
        expect(res.body.categories.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Products API', () => {
    describe('POST /api/products', () => {
      it('should create a new product', async () => {
        const res = await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            tenantId: 'demo-tenant',
            categoryId: testCategoryId,
            name: 'Iced Tea',
            price: 15000,
            cost: 5000
          });
        
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.product.name).toBe('Iced Tea');
        
        testProductId = res.body.product.id;
      });

      it('should fail if missing required fields', async () => {
        const res = await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            tenantId: 'demo-tenant',
            categoryId: testCategoryId,
            name: 'Water'
            // missing price
          });
        
        expect(res.status).toBe(400);
        expect(res.body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: expect.stringContaining('Required')
            })
          ])
        );
      });
    });

    describe('GET /api/products', () => {
      it('should list products for a tenant', async () => {
        const res = await request(app)
          .get('/api/products?tenantId=demo-tenant')
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.products)).toBe(true);
        expect(res.body.products.length).toBeGreaterThan(0);
      });
    });

    describe('PUT /api/products/:id', () => {
      it('should update a product', async () => {
        const res = await request(app)
          .put(`/api/products/${testProductId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            price: 20000
          });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.product.price).toBe(20000);
      });
    });

    describe('DELETE /api/products/:id', () => {
      it('should soft delete a product', async () => {
        const res = await request(app)
          .delete(`/api/products/${testProductId}`)
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        const getRes = await request(app)
          .get('/api/products?tenantId=demo-tenant')
          .set('Authorization', `Bearer ${adminToken}`);
        
        const deletedProduct = getRes.body.products.find((p: any) => p.id === testProductId);
        // It might be 'inactive' or not returned if filtered
        if (deletedProduct) {
          expect(deletedProduct.status).toBe('inactive');
        }
      });
    });
  });
});
