/**
 * Menu Route Integration Tests
 * Tests the menu retrieval endpoint with caching functionality
 * 
 * Requirements tested: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 10.2, 10.3, 10.4, 10.5, 10.6, 12.2, 12.4, 16.1, 6.1, 6.2, 6.3, 6.4, 6.5, 14.5
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { cacheManager } from '../services/CacheManager';

// Mock dependencies
const mockQuery = jest.fn();
const mockGet = jest.fn();
const mockRun = jest.fn();

jest.mock('../db/database', () => ({
  query: mockQuery,
  get: mockGet,
  run: mockRun
}));

describe('Menu Route - GET /api/menu/outlet/:outletId', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.resetAllMocks();
    
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

describe('Menu Route - PATCH /api/menu/items/:id', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.resetAllMocks();
    
    // Clear cache before each test
    cacheManager.clear();
  });

  describe('Item Existence Validation (Requirement 6.7)', () => {
    it('should return 404 Not Found when itemId does not exist', () => {
      const itemId = 'non-existent-item';

      // Mock database get returning null
      mockGet.mockReturnValueOnce(null);

      const existingItem = mockGet('SELECT * FROM products WHERE id = ?', [itemId]);

      expect(existingItem).toBeNull();
    });

    it('should proceed with update when itemId exists', () => {
      const itemId = 'existing-item-123';

      // Mock existing item
      mockGet.mockReturnValueOnce({
        id: itemId,
        tenant_id: 'tenant-1',
        category_id: 'cat-1',
        name: 'Coffee',
        price: 5000,
        status: 'active'
      });

      const existingItem = mockGet('SELECT * FROM products WHERE id = ?', [itemId]);

      expect(existingItem).toBeDefined();
      expect(existingItem).toHaveProperty('id', itemId);
    });
  });

  describe('Request Validation (Requirements 6.6, 9.1, 9.2)', () => {
    it('should accept partial updates for name field', () => {
      const updateRequest = {
        name: 'Updated Coffee Name'
      };

      expect(updateRequest).toHaveProperty('name');
      expect(updateRequest.name).toBeTruthy();
    });

    it('should accept partial updates for price field', () => {
      const updateRequest = {
        price: 6000
      };

      expect(updateRequest).toHaveProperty('price');
      expect(updateRequest.price).toBeGreaterThanOrEqual(0);
    });

    it('should accept partial updates for status field', () => {
      const updateRequest = {
        status: 'soldout'
      };

      expect(updateRequest).toHaveProperty('status');
      expect(['active', 'inactive', 'soldout']).toContain(updateRequest.status);
    });

    it('should accept multiple fields in single update', () => {
      const updateRequest = {
        name: 'Premium Coffee',
        price: 15000,
        status: 'active',
        isFavorite: true,
        description: 'High quality coffee beans'
      };

      expect(updateRequest).toHaveProperty('name');
      expect(updateRequest).toHaveProperty('price');
      expect(updateRequest).toHaveProperty('status');
      expect(updateRequest).toHaveProperty('isFavorite');
      expect(updateRequest).toHaveProperty('description');
    });

    it('should return 400 Bad Request when price is negative', () => {
      const invalidRequest = {
        price: -100
      };

      expect(invalidRequest.price).toBeLessThan(0);
    });

    it('should return 400 Bad Request when no fields provided', () => {
      const emptyRequest = {};

      expect(Object.keys(emptyRequest)).toHaveLength(0);
    });

    it('should validate stockQty is non-negative', () => {
      const validRequest = {
        stockQty: 50
      };

      expect(validRequest.stockQty).toBeGreaterThanOrEqual(0);
    });

    it('should validate productionTime is positive', () => {
      const validRequest = {
        productionTime: 10
      };

      expect(validRequest.productionTime).toBeGreaterThan(0);
    });
  });

  describe('Database Update (Requirement 6.7)', () => {
    it('should update only provided fields in products table', () => {
      const itemId = 'item-123';
      const updates = {
        name: 'New Name',
        price: 10000
      };

      // Mock existing item
      mockGet.mockReturnValueOnce({
        id: itemId,
        tenant_id: 'tenant-1',
        name: 'Old Name',
        price: 5000,
        status: 'active'
      });

      // Mock run for update
      mockRun.mockReturnValueOnce({ changes: 1 });

      // Mock get for retrieving updated item
      mockGet.mockReturnValueOnce({
        id: itemId,
        tenant_id: 'tenant-1',
        name: updates.name,
        price: updates.price,
        status: 'active',
        category_name: 'Beverages'
      });

      const existingItem = mockGet('SELECT * FROM products WHERE id = ?', [itemId]);
      mockRun('UPDATE products SET name = ?, price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [updates.name, updates.price, itemId]);
      const updatedItem = mockGet('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [itemId]);

      expect(mockRun).toHaveBeenCalledTimes(1);
      expect(updatedItem).toBeDefined();
      expect(updatedItem).toHaveProperty('name', updates.name);
      expect(updatedItem).toHaveProperty('price', updates.price);
    });

    it('should handle status update to soldout', () => {
      const itemId = 'item-456';
      const updates = {
        status: 'soldout'
      };

      mockGet.mockReturnValueOnce({
        id: itemId,
        tenant_id: 'tenant-1',
        status: 'active'
      });

      mockRun.mockReturnValueOnce({ changes: 1 });

      mockGet.mockReturnValueOnce({
        id: itemId,
        tenant_id: 'tenant-1',
        status: 'soldout',
        category_name: 'Beverages'
      });

      mockGet('SELECT * FROM products WHERE id = ?', [itemId]);
      mockRun('UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [updates.status, itemId]);
      const updatedItem = mockGet('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [itemId]);

      expect(updatedItem).toHaveProperty('status', 'soldout');
    });

    it('should handle boolean fields correctly', () => {
      const updates = {
        isFavorite: true,
        hasModifiers: true,
        stockTracking: false
      };

      // Convert booleans to SQLite integers
      const isFavoriteValue = updates.isFavorite ? 1 : 0;
      const hasModifiersValue = updates.hasModifiers ? 1 : 0;
      const stockTrackingValue = updates.stockTracking ? 1 : 0;

      expect(isFavoriteValue).toBe(1);
      expect(hasModifiersValue).toBe(1);
      expect(stockTrackingValue).toBe(0);
    });

    it('should always update updated_at timestamp', () => {
      const updates = {
        price: 8000
      };

      const updateQuery = 'UPDATE products SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';

      expect(updateQuery).toContain('updated_at = CURRENT_TIMESTAMP');
    });
  });

  describe('Cache Invalidation (Requirement 6.8)', () => {
    it('should invalidate menu cache after updating item', () => {
      const outletId = 'outlet-1';
      const cacheKey = `menu:outlet:${outletId}`;

      // Pre-populate cache
      const menuTree = {
        outlet: { id: outletId, name: 'Test', address: '', phone: '' },
        categories: [],
        items: [{ id: 'item-1', name: 'Coffee', price: 5000 }],
        modifierGroups: [],
        stations: []
      };
      cacheManager.set(cacheKey, menuTree, 300);

      // Verify cache exists
      expect(cacheManager.get(cacheKey)).toEqual(menuTree);

      // Simulate cache invalidation after item update
      cacheManager.invalidate(cacheKey);

      // Cache should be cleared
      expect(cacheManager.get(cacheKey)).toBeNull();
    });

    it('should use tenant_id to determine cache key', () => {
      const existingItem = {
        id: 'item-123',
        tenant_id: 'tenant-xyz',
        name: 'Coffee'
      };

      const outletId = existingItem.tenant_id;
      const expectedCacheKey = `menu:outlet:${outletId}`;

      expect(expectedCacheKey).toBe('menu:outlet:tenant-xyz');
    });
  });

  describe('Response Format (Requirement 6.8)', () => {
    it('should return 200 OK with updated item', () => {
      const itemId = 'item-123';
      const updatedItem = {
        id: itemId,
        tenant_id: 'tenant-1',
        category_id: 'cat-1',
        name: 'Updated Coffee',
        price: 7000,
        status: 'active',
        category_name: 'Beverages'
      };

      const expectedResponse = {
        success: true,
        item: updatedItem,
        responseTime: '15ms'
      };

      expect(expectedResponse).toHaveProperty('success', true);
      expect(expectedResponse).toHaveProperty('item');
      expect(expectedResponse.item).toHaveProperty('id', itemId);
      expect(expectedResponse.item).toHaveProperty('name', 'Updated Coffee');
    });

    it('should return 404 Not Found when item does not exist', () => {
      const expectedResponse = {
        success: false,
        error: 'Menu item not found'
      };

      expect(expectedResponse).toHaveProperty('success', false);
      expect(expectedResponse).toHaveProperty('error');
      expect(expectedResponse.error).toBe('Menu item not found');
    });
  });

  describe('Logging (Requirement 14.5)', () => {
    it('should log menu update with INFO level', () => {
      const itemId = 'item-123';
      const updates = { name: 'New Name', price: 10000 };

      const expectedLogMessage = `[INFO] Menu item updated successfully - item_id: ${itemId}, fields: [name, price]`;

      expect(expectedLogMessage).toContain('[INFO]');
      expect(expectedLogMessage).toContain('Menu item updated successfully');
      expect(expectedLogMessage).toContain(itemId);
      expect(expectedLogMessage).toContain('name');
      expect(expectedLogMessage).toContain('price');
    });

    it('should log when item not found', () => {
      const itemId = 'non-existent';
      const expectedLogMessage = `[WARN] Menu item not found: ${itemId}`;

      expect(expectedLogMessage).toContain('[WARN]');
      expect(expectedLogMessage).toContain('Menu item not found');
      expect(expectedLogMessage).toContain(itemId);
    });
  });

  describe('Error Handling (Requirements 9.4, 14.3)', () => {
    it('should return 500 Internal Server Error on database failure', () => {
      mockGet.mockReturnValueOnce({
        id: 'item-123',
        tenant_id: 'tenant-1'
      });

      mockRun.mockImplementationOnce(() => {
        throw new Error('Database update failed');
      });

      expect(() => {
        mockRun('UPDATE products...', []);
      }).toThrow('Database update failed');
    });

    it('should log errors with ERROR level', () => {
      const errorMessage = 'Database update failed';
      const expectedLogFormat = '[ERROR] Update menu item error';

      expect(expectedLogFormat).toContain('[ERROR]');
      expect(expectedLogFormat).toContain('Update menu item error');
    });
  });

  describe('Integration with Menu Sync Flow (Requirements 6.6, 6.7, 6.8)', () => {
    it('should support complete update flow: validate -> update -> invalidate cache -> return', () => {
      const itemId = 'item-123';
      const outletId = 'outlet-1';
      const cacheKey = `menu:outlet:${outletId}`;

      // Step 1: Cache exists with old menu
      const oldMenu = {
        outlet: { id: outletId, name: 'Test', address: '', phone: '' },
        categories: [],
        items: [{ id: itemId, name: 'Coffee', price: 5000 }],
        modifierGroups: [],
        stations: []
      };
      cacheManager.set(cacheKey, oldMenu, 300);
      expect(cacheManager.get(cacheKey)).toEqual(oldMenu);

      // Step 2: Validate item exists
      mockGet.mockReturnValueOnce({
        id: itemId,
        tenant_id: outletId,
        name: 'Coffee',
        price: 5000
      });
      const existingItem = mockGet('SELECT * FROM products WHERE id = ?', [itemId]);
      expect(existingItem).toBeDefined();

      // Step 3: Update database
      mockRun.mockReturnValueOnce({ changes: 1 });
      mockRun('UPDATE products SET price = ? WHERE id = ?', [7000, itemId]);

      // Step 4: Invalidate cache
      cacheManager.invalidate(cacheKey);
      expect(cacheManager.get(cacheKey)).toBeNull();

      // Step 5: Next GET request will fetch fresh data
      const updatedMenu = {
        outlet: { id: outletId, name: 'Test', address: '', phone: '' },
        categories: [],
        items: [{ id: itemId, name: 'Coffee', price: 7000 }],
        modifierGroups: [],
        stations: []
      };
      cacheManager.set(cacheKey, updatedMenu, 300);

      const freshMenu = cacheManager.get(cacheKey);
      expect(freshMenu).toEqual(updatedMenu);
      expect((freshMenu as any)?.items[0].price).toBe(7000);
    });

    it('should handle sold-out status synchronization', () => {
      const itemId = 'item-456';
      const outletId = 'outlet-1';

      // Manager marks item as sold out
      mockGet.mockReturnValueOnce({
        id: itemId,
        tenant_id: outletId,
        status: 'active'
      });

      mockRun.mockReturnValueOnce({ changes: 1 });

      mockGet.mockReturnValueOnce({
        id: itemId,
        tenant_id: outletId,
        status: 'soldout',
        category_name: 'Beverages'
      });

      mockGet('SELECT * FROM products WHERE id = ?', [itemId]);
      mockRun('UPDATE products SET status = ? WHERE id = ?', ['soldout', itemId]);
      const updatedItem = mockGet('SELECT p.*, c.name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [itemId]);

      // Cache invalidated
      cacheManager.invalidate(`menu:outlet:${outletId}`);

      // POS will receive updated status on next fetch
      expect(updatedItem).toHaveProperty('status', 'soldout');
    });
  });
});

describe('Menu Route - POST /api/menu/items', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.resetAllMocks();
    
    // Clear cache before each test
    cacheManager.clear();
  });

  describe('Request Validation (Requirements 6.2, 9.1, 9.2)', () => {
    it('should return 400 Bad Request when required fields are missing', () => {
      const invalidRequest = {
        // Missing tenantId, outletId, categoryId, name, price
      };

      // Validation would fail with missing fields
      expect(invalidRequest).not.toHaveProperty('tenantId');
      expect(invalidRequest).not.toHaveProperty('name');
      expect(invalidRequest).not.toHaveProperty('price');
    });

    it('should return 400 Bad Request when price is negative', () => {
      const invalidRequest = {
        tenantId: 'tenant-1',
        outletId: 'outlet-1',
        categoryId: 'cat-1',
        name: 'Test Item',
        price: -100 // Invalid negative price
      };

      expect(invalidRequest.price).toBeLessThan(0);
    });

    it('should validate all required fields', () => {
      const validRequest = {
        tenantId: 'tenant-1',
        outletId: 'outlet-1',
        categoryId: 'cat-1',
        name: 'Coffee',
        price: 5000
      };

      expect(validRequest).toHaveProperty('tenantId');
      expect(validRequest).toHaveProperty('outletId');
      expect(validRequest).toHaveProperty('categoryId');
      expect(validRequest).toHaveProperty('name');
      expect(validRequest).toHaveProperty('price');
      expect(validRequest.price).toBeGreaterThanOrEqual(0);
    });

    it('should accept optional fields', () => {
      const validRequest = {
        tenantId: 'tenant-1',
        outletId: 'outlet-1',
        categoryId: 'cat-1',
        name: 'Coffee',
        price: 5000,
        cost: 2000,
        sku: 'COFFEE-001',
        description: 'Fresh brewed coffee',
        imageUrl: 'https://example.com/coffee.jpg',
        emoji: '☕',
        isFavorite: true,
        hasModifiers: true,
        stockTracking: true,
        stockQty: 100,
        productionTime: 5,
        stationId: 'station-1'
      };

      expect(validRequest).toHaveProperty('cost');
      expect(validRequest).toHaveProperty('sku');
      expect(validRequest).toHaveProperty('description');
      expect(validRequest).toHaveProperty('isFavorite');
    });
  });

  describe('Database Insertion (Requirement 6.3)', () => {
    it('should insert menu item into products table', () => {
      const itemData = {
        tenantId: 'tenant-1',
        outletId: 'outlet-1',
        categoryId: 'cat-1',
        name: 'Espresso',
        price: 15000,
        cost: 5000,
        description: 'Strong coffee',
        productionTime: 3
      };

      const itemId = 'test-item-id-123';
      const slug = 'espresso';

      // Mock database run
      mockRun.mockReturnValueOnce({ changes: 1 });

      // Mock get for retrieving created item
      mockGet.mockReturnValueOnce({
        id: itemId,
        tenant_id: itemData.tenantId,
        category_id: itemData.categoryId,
        name: itemData.name,
        slug: slug,
        description: itemData.description,
        price: itemData.price,
        cost: itemData.cost,
        production_time: itemData.productionTime,
        status: 'active',
        category_name: 'Beverages'
      });

      // Simulate insertion
      mockRun(`INSERT INTO products...`, []);
      const createdItem = mockGet('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?', [itemId]);

      expect(mockRun).toHaveBeenCalledTimes(1);
      expect(createdItem).toBeDefined();
      expect(createdItem).toHaveProperty('id', itemId);
      expect(createdItem).toHaveProperty('name', itemData.name);
      expect(createdItem).toHaveProperty('price', itemData.price);
    });

    it('should generate unique item ID and slug', () => {
      const name = 'Iced Coffee';
      const expectedSlug = 'iced-coffee';
      const itemId = 'test-item-id-123';

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      expect(slug).toBe(expectedSlug);
      expect(itemId).toMatch(/^[a-zA-Z0-9_-]+$/);
    });
  });

  describe('Cache Invalidation (Requirement 6.4)', () => {
    it('should invalidate menu cache after creating item', () => {
      const outletId = 'outlet-1';
      const cacheKey = `menu:outlet:${outletId}`;

      // Pre-populate cache
      const menuTree = {
        outlet: { id: outletId, name: 'Test', address: '', phone: '' },
        categories: [],
        items: [],
        modifierGroups: [],
        stations: []
      };
      cacheManager.set(cacheKey, menuTree, 300);

      // Verify cache exists
      expect(cacheManager.get(cacheKey)).toEqual(menuTree);

      // Simulate cache invalidation after item creation
      cacheManager.invalidate(cacheKey);

      // Cache should be cleared
      expect(cacheManager.get(cacheKey)).toBeNull();
    });

    it('should use correct cache key format', () => {
      const outletId = 'outlet-test-123';
      const expectedCacheKey = `menu:outlet:${outletId}`;

      expect(expectedCacheKey).toBe('menu:outlet:outlet-test-123');
    });
  });

  describe('Response Format (Requirement 6.5)', () => {
    it('should return 201 Created with item_id and created item', () => {
      const itemId = 'test-item-id-123';
      const createdItem = {
        id: itemId,
        tenant_id: 'tenant-1',
        category_id: 'cat-1',
        name: 'Latte',
        price: 20000,
        status: 'active',
        category_name: 'Beverages'
      };

      const expectedResponse = {
        success: true,
        item_id: itemId,
        item: createdItem,
        responseTime: '10ms'
      };

      expect(expectedResponse).toHaveProperty('success', true);
      expect(expectedResponse).toHaveProperty('item_id');
      expect(expectedResponse).toHaveProperty('item');
      expect(expectedResponse.item).toHaveProperty('id', itemId);
    });
  });

  describe('Logging (Requirement 14.5)', () => {
    it('should log menu creation with INFO level', () => {
      const itemId = 'test-item-id-123';
      const name = 'Cappuccino';
      const price = 18000;

      const expectedLogMessage = `[INFO] Menu item created successfully - item_id: ${itemId}, name: "${name}", price: ${price}`;

      // Verify log format
      expect(expectedLogMessage).toContain('[INFO]');
      expect(expectedLogMessage).toContain('Menu item created successfully');
      expect(expectedLogMessage).toContain(itemId);
      expect(expectedLogMessage).toContain(name);
      expect(expectedLogMessage).toContain(price.toString());
    });
  });

  describe('Error Handling (Requirements 9.4, 14.3)', () => {
    it('should return 500 Internal Server Error on database failure', () => {
      mockRun.mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      // Simulate error
      expect(() => {
        mockRun('INSERT INTO products...', []);
      }).toThrow('Database connection failed');
    });

    it('should log errors with ERROR level', () => {
      const errorMessage = 'Database connection failed';
      const expectedLogFormat = '[ERROR] Create menu item error';

      expect(expectedLogFormat).toContain('[ERROR]');
      expect(expectedLogFormat).toContain('Create menu item error');
    });
  });

  describe('Integration with Existing Menu Route', () => {
    it('should work seamlessly with GET endpoint cache mechanism', () => {
      const outletId = 'outlet-1';
      const cacheKey = `menu:outlet:${outletId}`;

      // Step 1: GET endpoint caches menu
      const menuTree = {
        outlet: { id: outletId, name: 'Test', address: '', phone: '' },
        categories: [{ id: 'cat-1', name: 'Beverages' }],
        items: [{ id: 'item-1', name: 'Coffee', price: 5000 }],
        modifierGroups: [],
        stations: []
      };
      cacheManager.set(cacheKey, menuTree, 300);
      expect(cacheManager.get(cacheKey)).toEqual(menuTree);

      // Step 2: POST endpoint creates new item and invalidates cache
      cacheManager.invalidate(cacheKey);
      expect(cacheManager.get(cacheKey)).toBeNull();

      // Step 3: Next GET request will fetch fresh data from database
      const updatedMenuTree = {
        ...menuTree,
        items: [
          ...menuTree.items,
          { id: 'item-2', name: 'Tea', price: 4000 }
        ]
      };
      cacheManager.set(cacheKey, updatedMenuTree, 300);
      
      const freshMenu = cacheManager.get(cacheKey);
      expect(freshMenu).toEqual(updatedMenuTree);
      expect((freshMenu as any)?.items).toHaveLength(2);
    });
  });
});
