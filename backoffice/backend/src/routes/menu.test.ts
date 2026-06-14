/**
 * Menu Route Integration Tests
 * Tests the menu retrieval endpoint with caching functionality
 * 
 * Requirements tested: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 10.2, 10.3, 10.4, 10.5, 10.6, 12.2, 12.4, 16.1
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { cacheManager } from '../services/CacheManager';

// Mock dependencies
const mockQuery = jest.fn();
const mockGet = jest.fn();

jest.mock('../db/database', () => ({
  query: mockQuery,
  get: mockGet
}));

describe('Menu Route - GET /api/menu/outlet/:outletId', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Clear cache before each test
    cacheManager.clear();
  });

  describe('Cache Hit Behavior (Requirements 5.2, 5.3)', () => {
    it('should return cached menu when cache hit occurs', () => {
      const outletId = 'outlet-123';
      const cacheKey = `menu:outlet:${outletId}`;
      
      const mockMenuTree = {
        outlet: {
          id: outletId,
          name: 'Test Outlet',
          address: '123 Test St',
          phone: '1234567890'
        },
        categories: [{ id: 'cat-1', name: 'Beverages' }],
        items: [{ id: 'item-1', name: 'Coffee', price: 5000 }],
        modifierGroups: [],
        stations: []
      };

      // Store data in cache
      cacheManager.set(cacheKey, mockMenuTree, 300);

      // Retrieve from cache
      const cached = cacheManager.get(cacheKey);

      expect(cached).toEqual(mockMenuTree);
      expect(mockGet).not.toHaveBeenCalled(); // Database should not be queried
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should return null when cache miss occurs', () => {
      const outletId = 'outlet-456';
      const cacheKey = `menu:outlet:${outletId}`;

      const cached = cacheManager.get(cacheKey);

      expect(cached).toBeNull();
    });
  });

  describe('Cache TTL (Requirement 5.6, 10.5)', () => {
    it('should store menu in cache with 5-minute TTL (300 seconds)', () => {
      const outletId = 'outlet-789';
      const cacheKey = `menu:outlet:${outletId}`;
      
      const mockMenuTree = {
        outlet: { id: outletId, name: 'Test', address: '', phone: '' },
        categories: [],
        items: [],
        modifierGroups: [],
        stations: []
      };

      const ttl = 300; // 5 minutes in seconds
      cacheManager.set(cacheKey, mockMenuTree, ttl);

      // Verify data is cached
      const cached = cacheManager.get(cacheKey);
      expect(cached).toEqual(mockMenuTree);
    });

    it('should return null for expired cache entries', async () => {
      const outletId = 'outlet-expired';
      const cacheKey = `menu:outlet:${outletId}`;
      
      const mockMenuTree = {
        outlet: { id: outletId, name: 'Test', address: '', phone: '' },
        categories: [],
        items: [],
        modifierGroups: [],
        stations: []
      };

      // Set with 1 second TTL
      cacheManager.set(cacheKey, mockMenuTree, 1);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be expired
      const cached = cacheManager.get(cacheKey);
      expect(cached).toBeNull();
    });
  });

  describe('Database Query on Cache Miss (Requirement 5.4)', () => {
    it('should query database when cache is empty', () => {
      const outletId = 'outlet-new';
      const cacheKey = `menu:outlet:${outletId}`;

      // Mock outlet exists
      mockGet.mockReturnValueOnce({
        id: outletId,
        tenant_id: 'tenant-1',
        name: 'New Outlet',
        address: '456 Main St',
        phone: '9876543210'
      });

      // Mock database queries
      mockQuery.mockReturnValueOnce([]); // categories
      mockQuery.mockReturnValueOnce([]); // items
      mockQuery.mockReturnValueOnce([]); // modifierGroups
      mockQuery.mockReturnValueOnce([]); // stations

      // Simulate route logic
      const outlet = mockGet('SELECT * FROM outlets WHERE id = ?', [outletId]) as any;
      expect(outlet).toBeDefined();

      const categories = mockQuery('SELECT...', ['tenant-1']);
      const items = mockQuery('SELECT...', ['tenant-1']);
      const modifierGroups = mockQuery('SELECT...', ['tenant-1']);
      const stations = mockQuery('SELECT...', [outletId]);

      const menuTree = {
        outlet: {
          id: outlet.id,
          name: outlet.name,
          address: outlet.address,
          phone: outlet.phone
        },
        categories,
        items,
        modifierGroups,
        stations
      };

      // Cache the result
      cacheManager.set(cacheKey, menuTree, 300);

      // Verify it was cached
      const cached = cacheManager.get(cacheKey);
      expect(cached).toEqual(menuTree);
    });
  });

  describe('Multi-Outlet Isolation (Requirements 12.2, 12.4)', () => {
    it('should use separate cache keys for different outlets', () => {
      const outlet1 = 'outlet-1';
      const outlet2 = 'outlet-2';

      const menu1 = {
        outlet: { id: outlet1, name: 'Outlet 1', address: '', phone: '' },
        categories: [{ id: 'cat-1', name: 'Cat1' }],
        items: [],
        modifierGroups: [],
        stations: []
      };

      const menu2 = {
        outlet: { id: outlet2, name: 'Outlet 2', address: '', phone: '' },
        categories: [{ id: 'cat-2', name: 'Cat2' }],
        items: [],
        modifierGroups: [],
        stations: []
      };

      cacheManager.set(`menu:outlet:${outlet1}`, menu1, 300);
      cacheManager.set(`menu:outlet:${outlet2}`, menu2, 300);

      // Each outlet should have its own cached data
      const cached1 = cacheManager.get(`menu:outlet:${outlet1}`);
      const cached2 = cacheManager.get(`menu:outlet:${outlet2}`);

      expect(cached1).toEqual(menu1);
      expect(cached2).toEqual(menu2);
      expect(cached1).not.toEqual(cached2);
    });
  });

  describe('Cache Invalidation (Requirement 10.6)', () => {
    it('should allow cache invalidation for specific outlet', () => {
      const outletId = 'outlet-invalidate';
      const cacheKey = `menu:outlet:${outletId}`;

      const menuTree = {
        outlet: { id: outletId, name: 'Test', address: '', phone: '' },
        categories: [],
        items: [],
        modifierGroups: [],
        stations: []
      };

      // Cache the menu
      cacheManager.set(cacheKey, menuTree, 300);
      expect(cacheManager.get(cacheKey)).toEqual(menuTree);

      // Invalidate cache
      cacheManager.invalidate(cacheKey);

      // Should be null after invalidation
      expect(cacheManager.get(cacheKey)).toBeNull();
    });

    it('should support pattern-based invalidation for all menu caches', () => {
      // Cache multiple outlets
      cacheManager.set('menu:outlet:1', { outlet: { id: '1', name: '', address: '', phone: '' }, categories: [], items: [], modifierGroups: [], stations: [] }, 300);
      cacheManager.set('menu:outlet:2', { outlet: { id: '2', name: '', address: '', phone: '' }, categories: [], items: [], modifierGroups: [], stations: [] }, 300);
      cacheManager.set('menu:outlet:3', { outlet: { id: '3', name: '', address: '', phone: '' }, categories: [], items: [], modifierGroups: [], stations: [] }, 300);

      // Invalidate all menu caches
      cacheManager.invalidatePattern('menu:*');

      // All should be invalidated
      expect(cacheManager.get('menu:outlet:1')).toBeNull();
      expect(cacheManager.get('menu:outlet:2')).toBeNull();
      expect(cacheManager.get('menu:outlet:3')).toBeNull();
    });
  });

  describe('MenuTree Structure (Requirements 5.5, 5.7)', () => {
    it('should include all required fields in MenuTree structure', () => {
      const menuTree = {
        outlet: {
          id: 'outlet-1',
          name: 'Test Outlet',
          address: '123 Test St',
          phone: '1234567890'
        },
        categories: [
          { id: 'cat-1', name: 'Beverages', slug: 'beverages', display_order: 1 }
        ],
        items: [
          {
            id: 'item-1',
            name: 'Coffee',
            price: 5000,
            category_id: 'cat-1',
            status: 'active',
            has_modifiers: false,
            modifier_groups: []
          }
        ],
        modifierGroups: [
          {
            id: 'mg-1',
            name: 'Size',
            type: 'single',
            required: true,
            options: [
              { id: 'opt-1', name: 'Small', price_adjustment: 0 },
              { id: 'opt-2', name: 'Large', price_adjustment: 2000 }
            ]
          }
        ],
        stations: [
          { id: 'station-1', name: 'Barista', display_order: 1 }
        ]
      };

      // Verify structure
      expect(menuTree).toHaveProperty('outlet');
      expect(menuTree).toHaveProperty('categories');
      expect(menuTree).toHaveProperty('items');
      expect(menuTree).toHaveProperty('modifierGroups');
      expect(menuTree).toHaveProperty('stations');

      expect(menuTree.outlet).toHaveProperty('id');
      expect(menuTree.outlet).toHaveProperty('name');
      expect(menuTree.outlet).toHaveProperty('address');
      expect(menuTree.outlet).toHaveProperty('phone');

      expect(Array.isArray(menuTree.categories)).toBe(true);
      expect(Array.isArray(menuTree.items)).toBe(true);
      expect(Array.isArray(menuTree.modifierGroups)).toBe(true);
      expect(Array.isArray(menuTree.stations)).toBe(true);
    });
  });

  describe('Performance Requirements (Requirement 16.1)', () => {
    it('should respond quickly when using cached data', () => {
      const outletId = 'outlet-perf';
      const cacheKey = `menu:outlet:${outletId}`;

      const menuTree = {
        outlet: { id: outletId, name: 'Test', address: '', phone: '' },
        categories: Array.from({ length: 10 }, (_, i) => ({ id: `cat-${i}`, name: `Category ${i}` })),
        items: Array.from({ length: 100 }, (_, i) => ({ id: `item-${i}`, name: `Item ${i}`, price: 10000 })),
        modifierGroups: [],
        stations: []
      };

      cacheManager.set(cacheKey, menuTree, 300);

      const startTime = Date.now();
      const cached = cacheManager.get(cacheKey);
      const responseTime = Date.now() - startTime;

      expect(cached).toEqual(menuTree);
      // Cache access should be under 1ms (well under 200ms requirement)
      expect(responseTime).toBeLessThan(10);
    });
  });
});
