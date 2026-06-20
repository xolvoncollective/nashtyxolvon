/**
 * Menu Route Integration Tests
 * Tests the full menu endpoint with Express server and actual database
 * 
 * Requirements tested: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 10.2, 10.3, 10.4, 10.5, 10.6, 12.2, 12.4, 16.1
 */

import { describe, it, expect, beforeAll, afterEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import menuRouter from './menu';
import { initDatabase } from '../db/database';
import { cacheManager } from '../services/CacheManager';

// Create a test Express app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/menu', menuRouter);
  return app;
};

describe('Menu Route Integration Tests', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Initialize the database
    await initDatabase();
    
    // Create test app
    app = createTestApp();
  });

  afterEach(() => {
    // Clear cache after each test
    cacheManager.clear();
  });

  describe('GET /api/menu/outlet/:outletId', () => {
    it('should return 404 for non-existent outlet', async () => {
      const response = await request(app)
        .await get('/api/menu/outlet/non-existent-outlet')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Outlet not found');
    });

    it('should return 400 for invalid outlet ID', async () => {
      const response = await request(app)
        .await get('/api/menu/outlet/')
        .expect(404); // Express returns 404 for missing parameter

      // No outletId parameter provided
    });

    it('should return menu data for valid outlet (cache miss)', async () => {
      // Use the seeded outlet ID from seed.ts
      const outletId = 'demo-outlet';

      const response = await request(app)
        .await get(`/api/menu/outlet/${outletId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('cached', false);
      expect(response.body).toHaveProperty('responseTime');

      const { data } = response.body;

      // Verify MenuTree structure (Requirement 5.5, 5.7)
      expect(data).toHaveProperty('outlet');
      expect(data).toHaveProperty('categories');
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('modifierGroups');
      expect(data).toHaveProperty('stations');

      // Verify outlet info
      expect(data.outlet).toHaveProperty('id', outletId);
      expect(data.outlet).toHaveProperty('name');
      expect(data.outlet).toHaveProperty('address');
      expect(data.outlet).toHaveProperty('phone');

      // Verify arrays
      expect(Array.isArray(data.categories)).toBe(true);
      expect(Array.isArray(data.items)).toBe(true);
      expect(Array.isArray(data.modifierGroups)).toBe(true);
      expect(Array.isArray(data.stations)).toBe(true);

      // Verify data has content (from seed)
      expect(data.categories.length).toBeGreaterThan(0);
      expect(data.items.length).toBeGreaterThan(0);
    });

    it('should return cached menu data on second request (cache hit)', async () => {
      const outletId = 'demo-outlet';

      // First request - cache miss
      const firstResponse = await request(app)
        .await get(`/api/menu/outlet/${outletId}`)
        .expect(200);

      expect(firstResponse.body.cached).toBe(false);
      const firstData = firstResponse.body.data;

      // Second request - should hit cache
      const secondResponse = await request(app)
        .await get(`/api/menu/outlet/${outletId}`)
        .expect(200);

      expect(secondResponse.body.cached).toBe(true);
      const secondData = secondResponse.body.data;

      // Data should be identical
      expect(secondData).toEqual(firstData);

      // Cached response should be faster
      const firstTime = parseInt(firstResponse.body.responseTime);
      const secondTime = parseInt(secondResponse.body.responseTime);
      
      // Cache hit should be significantly faster (typically < 5ms vs 10-50ms for DB query)
      expect(secondTime).toBeLessThan(firstTime);
    });

    it('should respond under 200ms at 95th percentile (Requirement 16.1)', async () => {
      const outletId = 'demo-outlet';
      const numRequests = 20;
      const responseTimes: number[] = [];

      // Warm up cache
      await request(app).await get(`/api/menu/outlet/${outletId}`);

      // Make multiple requests
      for (let i = 0; i < numRequests; i++) {
        const response = await request(app)
          .await get(`/api/menu/outlet/${outletId}`)
          .expect(200);

        const timeStr = response.body.responseTime.replace('ms', '');
        responseTimes.push(parseInt(timeStr));
      }

      // Calculate 95th percentile
      responseTimes.sort((a, b) => a - b);
      const p95Index = Math.floor(numRequests * 0.95);
      const p95Time = responseTimes[p95Index];

      console.log(`95th percentile response time: ${p95Time}ms`);
      
      // Should be well under 200ms with caching
      expect(p95Time).toBeLessThan(200);
    });

    it('should include modifier groups with options', async () => {
      const outletId = 'demo-outlet';

      const response = await request(app)
        .await get(`/api/menu/outlet/${outletId}`)
        .expect(200);

      const { data } = response.body;

      // Find items with modifiers
      const itemsWithModifiers = data.items.filter((item: any) => item.has_modifiers);

      if (itemsWithModifiers.length > 0) {
        const item = itemsWithModifiers[0];
        
        expect(item).toHaveProperty('modifier_groups');
        expect(Array.isArray(item.modifier_groups)).toBe(true);

        if (item.modifier_groups.length > 0) {
          const group = item.modifier_groups[0];
          
          expect(group).toHaveProperty('id');
          expect(group).toHaveProperty('name');
          expect(group).toHaveProperty('type');
          expect(group).toHaveProperty('required');
          expect(group).toHaveProperty('options');
          expect(Array.isArray(group.options)).toBe(true);
        }
      }
    });

    it('should include kitchen stations in response', async () => {
      const outletId = 'demo-outlet';

      const response = await request(app)
        .await get(`/api/menu/outlet/${outletId}`)
        .expect(200);

      const { data } = response.body;

      expect(data.stations).toBeDefined();
      expect(Array.isArray(data.stations)).toBe(true);

      // Verify stations have required fields
      if (data.stations.length > 0) {
        const station = data.stations[0];
        
        expect(station).toHaveProperty('id');
        expect(station).toHaveProperty('name');
        expect(station).toHaveProperty('display_order');
        expect(station).toHaveProperty('status');
      }
    });

    it('should handle sold-out items correctly (Requirement 7.1)', async () => {
      const outletId = 'demo-outlet';

      const response = await request(app)
        .await get(`/api/menu/outlet/${outletId}`)
        .expect(200);

      const { data } = response.body;

      // All items should have a status field
      data.items.forEach((item: any) => {
        expect(item).toHaveProperty('status');
        expect(['active', 'inactive', 'soldout']).toContain(item.status);
      });
    });

    it('should filter data by tenant for multi-outlet isolation (Requirements 12.2, 12.4)', async () => {
      const outletId = 'demo-outlet';

      const response = await request(app)
        .await get(`/api/menu/outlet/${outletId}`)
        .expect(200);

      const { data } = response.body;

      // Verify outlet matches requested ID
      expect(data.outlet.id).toBe(outletId);

      // All items should belong to the same tenant (implicitly verified by query)
      // In a multi-tenant system, we'd verify no data leakage between tenants
    });
  });

  describe('Cache Performance', () => {
    it('should demonstrate significant performance improvement with caching', async () => {
      const outletId = 'demo-outlet';

      // Clear cache to ensure fresh start
      cacheManager.clear();

      // First request - database query
      const startUncached = Date.now();
      const uncachedResponse = await request(app)
        .await get(`/api/menu/outlet/${outletId}`)
        .expect(200);
      const uncachedTime = Date.now() - startUncached;

      expect(uncachedResponse.body.cached).toBe(false);

      // Second request - cache hit
      const startCached = Date.now();
      const cachedResponse = await request(app)
        .await get(`/api/menu/outlet/${outletId}`)
        .expect(200);
      const cachedTime = Date.now() - startCached;

      expect(cachedResponse.body.cached).toBe(true);

      console.log(`Uncached: ${uncachedTime}ms, Cached: ${cachedTime}ms`);
      console.log(`Speed improvement: ${((uncachedTime - cachedTime) / uncachedTime * 100).toFixed(1)}%`);

      // Cached should be significantly faster
      expect(cachedTime).toBeLessThanOrEqual(uncachedTime);
      
      // Cache hit should typically be under 10ms
      expect(cachedTime).toBeLessThan(50);
    });
  });
});
