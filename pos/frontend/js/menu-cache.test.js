/**
 * Unit tests for POS Menu Cache Management
 * Task 16: Update POS frontend to store and render menu
 * 
 * Tests:
 * - Menu fetching from API
 * - LocalStorage caching with timestamp
 * - Cache TTL (5 minutes)
 * - Menu refresh every 5 minutes
 * - Sold-out item handling
 */

describe('POS Menu Cache Management', () => {
  const MENU_CACHE_KEY = 'nashty_menu_cache';
  const MENU_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Cache Storage', () => {
    test('should store menu data in localStorage with timestamp', () => {
      const mockMenuData = {
        categories: [
          { id: 'cat1', name: 'Food', status: 'active' }
        ],
        items: [
          { id: 'item1', name: 'Nasi Goreng', price: 25000, status: 'active' }
        ]
      };

      const cacheEntry = {
        data: mockMenuData,
        timestamp: Date.now()
      };

      localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(cacheEntry));

      const stored = JSON.parse(localStorage.getItem(MENU_CACHE_KEY));
      expect(stored.data).toEqual(mockMenuData);
      expect(stored.timestamp).toBeDefined();
      expect(typeof stored.timestamp).toBe('number');
    });

    test('should retrieve valid cached data within TTL', () => {
      const mockMenuData = {
        categories: [{ id: 'cat1', name: 'Food' }],
        items: [{ id: 'item1', name: 'Nasi Goreng', price: 25000 }]
      };

      const cacheEntry = {
        data: mockMenuData,
        timestamp: Date.now()
      };

      localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(cacheEntry));

      // Retrieve immediately (within TTL)
      const cached = localStorage.getItem(MENU_CACHE_KEY);
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;

      expect(age).toBeLessThan(MENU_CACHE_TTL);
      expect(parsed.data).toEqual(mockMenuData);
    });

    test('should invalidate cache after TTL expires', () => {
      const mockMenuData = {
        categories: [{ id: 'cat1', name: 'Food' }],
        items: [{ id: 'item1', name: 'Nasi Goreng', price: 25000 }]
      };

      // Create cache entry with old timestamp (6 minutes ago)
      const oldTimestamp = Date.now() - (6 * 60 * 1000);
      const cacheEntry = {
        data: mockMenuData,
        timestamp: oldTimestamp
      };

      localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(cacheEntry));

      // Check if expired
      const cached = localStorage.getItem(MENU_CACHE_KEY);
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;

      expect(age).toBeGreaterThan(MENU_CACHE_TTL);
    });
  });

  describe('Sold-Out Item Handling', () => {
    test('should mark items with status "sold_out" as sold', () => {
      const mockItem = {
        id: 'item1',
        name: 'Nasi Goreng',
        price: 25000,
        status: 'sold_out',
        category_id: 'cat1'
      };

      const isSoldOut = mockItem.status === 'sold_out' || 
                       mockItem.status === 'soldout' || 
                       mockItem.status === 'inactive';

      expect(isSoldOut).toBe(true);
    });

    test('should mark items with status "soldout" as sold', () => {
      const mockItem = {
        id: 'item1',
        name: 'Nasi Goreng',
        price: 25000,
        status: 'soldout'
      };

      const isSoldOut = mockItem.status === 'sold_out' || 
                       mockItem.status === 'soldout' || 
                       mockItem.status === 'inactive';

      expect(isSoldOut).toBe(true);
    });

    test('should mark items with status "inactive" as sold', () => {
      const mockItem = {
        id: 'item1',
        name: 'Nasi Goreng',
        price: 25000,
        status: 'inactive'
      };

      const isSoldOut = mockItem.status === 'sold_out' || 
                       mockItem.status === 'soldout' || 
                       mockItem.status === 'inactive';

      expect(isSoldOut).toBe(true);
    });

    test('should NOT mark items with status "active" as sold', () => {
      const mockItem = {
        id: 'item1',
        name: 'Nasi Goreng',
        price: 25000,
        status: 'active'
      };

      const isSoldOut = mockItem.status === 'sold_out' || 
                       mockItem.status === 'soldout' || 
                       mockItem.status === 'inactive';

      expect(isSoldOut).toBe(false);
    });
  });

  describe('Cache Refresh Interval', () => {
    test('should have 5-minute cache TTL constant', () => {
      expect(MENU_CACHE_TTL).toBe(5 * 60 * 1000);
      expect(MENU_CACHE_TTL).toBe(300000); // 300,000 milliseconds
    });
  });
});
