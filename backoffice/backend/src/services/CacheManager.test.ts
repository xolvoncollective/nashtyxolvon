import { CacheManager } from './CacheManager';

/**
 * Test suite for CacheManager
 * 
 * **Validates: Requirements 10.1, 10.8, 10.9**
 */

describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager();
  });

  describe('get and set operations', () => {
    it('should store and retrieve values', () => {
      cache.set('test-key', 'test-value');
      const result = cache.get('test-key');
      expect(result).toBe('test-value');
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should handle different data types', () => {
      cache.set('string', 'hello');
      cache.set('number', 42);
      cache.set('boolean', true);
      cache.set('object', { name: 'test', value: 123 });
      cache.set('array', [1, 2, 3]);

      expect(cache.get('string')).toBe('hello');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('boolean')).toBe(true);
      expect(cache.get('object')).toEqual({ name: 'test', value: 123 });
      expect(cache.get('array')).toEqual([1, 2, 3]);
    });

    it('should overwrite existing keys', () => {
      cache.set('key', 'value1');
      cache.set('key', 'value2');
      expect(cache.get('key')).toBe('value2');
    });
  });

  describe('TTL (time-to-live) functionality', () => {
    it('should return null for expired entries', async () => {
      cache.set('short-lived', 'value', 0.1); // 100ms TTL
      
      // Should exist immediately
      expect(cache.get('short-lived')).toBe('value');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be expired
      expect(cache.get('short-lived')).toBeNull();
    });

    it('should use default TTL of 300 seconds when not specified', () => {
      const now = Date.now();
      cache.set('key', 'value');
      
      // Access internal state to verify TTL
      const entry = (cache as any).cache.get('key');
      const expectedExpiry = now + 300000; // 300 seconds in ms
      
      // Allow 10ms tolerance for execution time
      expect(entry.expiresAt).toBeGreaterThanOrEqual(expectedExpiry - 10);
      expect(entry.expiresAt).toBeLessThanOrEqual(expectedExpiry + 10);
    });

    it('should respect custom TTL values', () => {
      const now = Date.now();
      cache.set('key', 'value', 600); // 10 minutes
      
      const entry = (cache as any).cache.get('key');
      const expectedExpiry = now + 600000;
      
      expect(entry.expiresAt).toBeGreaterThanOrEqual(expectedExpiry - 10);
      expect(entry.expiresAt).toBeLessThanOrEqual(expectedExpiry + 10);
    });

    it('should automatically cleanup expired entries on get', async () => {
      cache.set('key1', 'value1', 0.1);
      cache.set('key2', 'value2', 10);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Accessing expired key should remove it
      cache.get('key1');
      
      const stats = cache.getStats();
      expect(stats.size).toBe(1); // Only key2 remains
    });
  });

  describe('invalidate operations', () => {
    it('should invalidate a single key', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      cache.invalidate('key1');
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });

    it('should handle invalidating non-existent keys', () => {
      expect(() => cache.invalidate('non-existent')).not.toThrow();
    });
  });

  describe('invalidatePattern operations', () => {
    beforeEach(() => {
      cache.set('menu:outlet-1', 'menu1');
      cache.set('menu:outlet-2', 'menu2');
      cache.set('config:outlet-1', 'config1');
      cache.set('config:outlet-2', 'config2');
      cache.set('orders:pending:outlet-1', 'orders1');
    });

    it('should invalidate keys matching prefix pattern', () => {
      cache.invalidatePattern('menu:*');
      
      expect(cache.get('menu:outlet-1')).toBeNull();
      expect(cache.get('menu:outlet-2')).toBeNull();
      expect(cache.get('config:outlet-1')).toBe('config1');
      expect(cache.get('config:outlet-2')).toBe('config2');
    });

    it('should invalidate keys matching suffix pattern', () => {
      cache.invalidatePattern('*:outlet-1');
      
      expect(cache.get('menu:outlet-1')).toBeNull();
      expect(cache.get('config:outlet-1')).toBeNull();
      expect(cache.get('orders:pending:outlet-1')).toBeNull();
      expect(cache.get('menu:outlet-2')).toBe('menu2');
      expect(cache.get('config:outlet-2')).toBe('config2');
    });

    it('should invalidate keys matching middle pattern', () => {
      cache.invalidatePattern('*:pending:*');
      
      expect(cache.get('orders:pending:outlet-1')).toBeNull();
      expect(cache.get('menu:outlet-1')).toBe('menu1');
      expect(cache.get('config:outlet-1')).toBe('config1');
    });

    it('should handle exact match pattern', () => {
      cache.invalidatePattern('menu:outlet-1');
      
      expect(cache.get('menu:outlet-1')).toBeNull();
      expect(cache.get('menu:outlet-2')).toBe('menu2');
    });

    it('should handle pattern with multiple wildcards', () => {
      cache.invalidatePattern('*:outlet-*');
      
      expect(cache.get('menu:outlet-1')).toBeNull();
      expect(cache.get('menu:outlet-2')).toBeNull();
      expect(cache.get('config:outlet-1')).toBeNull();
      expect(cache.get('config:outlet-2')).toBeNull();
      expect(cache.get('orders:pending:outlet-1')).toBeNull();
    });

    it('should handle special regex characters in pattern', () => {
      cache.set('price.$usd', 'value1');
      cache.set('price.eur', 'value2');
      
      // Should treat . as literal, not regex wildcard
      cache.invalidatePattern('price.$usd');
      
      expect(cache.get('price.$usd')).toBeNull();
      expect(cache.get('price.eur')).toBe('value2');
    });

    it('should not match anything when pattern does not match', () => {
      cache.invalidatePattern('nonexistent:*');
      
      // All keys should still exist
      expect(cache.get('menu:outlet-1')).toBe('menu1');
      expect(cache.get('config:outlet-1')).toBe('config1');
    });
  });

  describe('clear operation', () => {
    it('should clear all cache entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      cache.clear();
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
      expect(cache.getStats().size).toBe(0);
    });

    it('should work on empty cache', () => {
      expect(() => cache.clear()).not.toThrow();
      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('getStats operation', () => {
    it('should return correct cache size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      const stats = cache.getStats();
      expect(stats.size).toBe(3);
    });

    it('should count expired entries', async () => {
      cache.set('key1', 'value1', 0.1);
      cache.set('key2', 'value2', 10);
      cache.set('key3', 'value3', 0.1);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const stats = cache.getStats();
      expect(stats.size).toBe(3); // All still in map
      expect(stats.expired).toBe(2); // But 2 are expired
    });

    it('should return zero for empty cache', () => {
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.expired).toBe(0);
    });
  });

  describe('cleanupExpired operation', () => {
    it('should remove expired entries and return count', async () => {
      cache.set('key1', 'value1', 0.1);
      cache.set('key2', 'value2', 10);
      cache.set('key3', 'value3', 0.1);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const removed = cache.cleanupExpired();
      
      expect(removed).toBe(2);
      expect(cache.getStats().size).toBe(1);
      expect(cache.get('key2')).toBe('value2');
    });

    it('should return zero when no entries are expired', () => {
      cache.set('key1', 'value1', 10);
      cache.set('key2', 'value2', 10);
      
      const removed = cache.cleanupExpired();
      
      expect(removed).toBe(0);
      expect(cache.getStats().size).toBe(2);
    });

    it('should work on empty cache', () => {
      const removed = cache.cleanupExpired();
      expect(removed).toBe(0);
    });
  });

  describe('real-world usage scenarios', () => {
    it('should handle menu caching scenario', () => {
      const menuData = {
        categories: ['Beverages', 'Food'],
        items: [
          { id: '1', name: 'Coffee', price: 25000 },
          { id: '2', name: 'Tea', price: 20000 }
        ]
      };

      // Cache menu with 5 minute TTL
      cache.set('menu:outlet-1', menuData, 300);
      
      // Retrieve cached menu
      const cached = cache.get('menu:outlet-1');
      expect(cached).toEqual(menuData);
      
      // Invalidate when menu is updated
      cache.invalidate('menu:outlet-1');
      expect(cache.get('menu:outlet-1')).toBeNull();
    });

    it('should handle outlet configuration caching', () => {
      const outletConfig = {
        taxRate: 0.1,
        serviceChargeRate: 0.05,
        name: 'Outlet 1'
      };

      // Cache config with 10 minute TTL
      cache.set('config:outlet-1', outletConfig, 600);
      
      const cached = cache.get('config:outlet-1');
      expect(cached).toEqual(outletConfig);
    });

    it('should handle multiple outlet isolation', () => {
      cache.set('menu:outlet-1', 'menu1');
      cache.set('menu:outlet-2', 'menu2');
      cache.set('config:outlet-1', 'config1');
      
      // Invalidate all cache for outlet-1
      cache.invalidatePattern('*:outlet-1');
      
      expect(cache.get('menu:outlet-1')).toBeNull();
      expect(cache.get('config:outlet-1')).toBeNull();
      expect(cache.get('menu:outlet-2')).toBe('menu2');
    });

    it('should handle concurrent operations', () => {
      // Simulate concurrent set operations
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // Simulate concurrent get operations
      const results = [
        cache.get('key1'),
        cache.get('key2'),
        cache.get('key3')
      ];
      
      expect(results).toEqual(['value1', 'value2', 'value3']);
    });
  });

  describe('edge cases', () => {
    it('should handle very large values', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);
      cache.set('large-data', largeArray);
      
      const result = cache.get('large-data');
      expect(result).toEqual(largeArray);
    });

    it('should handle empty string as key', () => {
      cache.set('', 'empty-key-value');
      expect(cache.get('')).toBe('empty-key-value');
    });

    it('should handle null and undefined values', () => {
      cache.set('null-value', null);
      cache.set('undefined-value', undefined);
      
      // Both should be stored and retrieved
      expect(cache.get('null-value')).toBeNull();
      expect(cache.get('undefined-value')).toBeUndefined();
    });

    it('should handle very short TTL', async () => {
      cache.set('instant-expire', 'value', 0.001); // 1ms
      
      await new Promise(resolve => setTimeout(resolve, 5));
      
      expect(cache.get('instant-expire')).toBeNull();
    });

    it('should handle pattern with no wildcards', () => {
      cache.set('exact-key', 'value');
      cache.invalidatePattern('exact-key');
      
      expect(cache.get('exact-key')).toBeNull();
    });

    it('should handle pattern that is all wildcards', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      cache.invalidatePattern('*');
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });
});
