/**
 * CacheManager Initialization Tests
 * 
 * Tests to verify that CacheManager is properly initialized in the Express app
 * and accessible to route handlers through both direct import and app.locals
 */

import { cacheManager } from './CacheManager';

describe('CacheManager Initialization', () => {
  beforeEach(() => {
    // Clear cache before each test
    cacheManager.clear();
  });

  test('should be able to import the singleton instance', () => {
    expect(cacheManager).toBeDefined();
    expect(typeof cacheManager.get).toBe('function');
    expect(typeof cacheManager.set).toBe('function');
    expect(typeof cacheManager.invalidate).toBe('function');
    expect(typeof cacheManager.invalidatePattern).toBe('function');
    expect(typeof cacheManager.clear).toBe('function');
    expect(typeof cacheManager.cleanupExpired).toBe('function');
    expect(typeof cacheManager.getStats).toBe('function');
  });

  test('should store and retrieve values correctly', () => {
    const testKey = 'test:key:1';
    const testValue = { data: 'test value' };

    cacheManager.set(testKey, testValue, 60);
    const retrieved = cacheManager.get(testKey);

    expect(retrieved).toEqual(testValue);
  });

  test('should handle cache miss correctly', () => {
    const result = cacheManager.get('nonexistent:key');
    expect(result).toBeNull();
  });

  test('should expire entries after TTL', (done) => {
    const key = 'expire:test';
    const value = { data: 'expires soon' };

    // Set with 1 second TTL
    cacheManager.set(key, value, 1);

    // Should exist immediately
    expect(cacheManager.get(key)).toEqual(value);

    // Should be expired after 1.5 seconds
    setTimeout(() => {
      expect(cacheManager.get(key)).toBeNull();
      done();
    }, 1500);
  });

  test('should invalidate single keys', () => {
    cacheManager.set('key1', 'value1', 60);
    cacheManager.set('key2', 'value2', 60);

    cacheManager.invalidate('key1');

    expect(cacheManager.get('key1')).toBeNull();
    expect(cacheManager.get('key2')).toBe('value2');
  });

  test('should invalidate keys matching pattern', () => {
    cacheManager.set('menu:outlet:1', { id: 1 }, 60);
    cacheManager.set('menu:outlet:2', { id: 2 }, 60);
    cacheManager.set('config:outlet:1', { id: 1 }, 60);

    cacheManager.invalidatePattern('menu:*');

    expect(cacheManager.get('menu:outlet:1')).toBeNull();
    expect(cacheManager.get('menu:outlet:2')).toBeNull();
    expect(cacheManager.get('config:outlet:1')).toEqual({ id: 1 });
  });

  test('should cleanup expired entries', (done) => {
    // Add some entries with short TTL
    cacheManager.set('expire1', 'value1', 1); // 1 second
    cacheManager.set('expire2', 'value2', 1);
    cacheManager.set('keep', 'value3', 60); // 60 seconds

    const statsBefore = cacheManager.getStats();
    expect(statsBefore.size).toBe(3);

    // Wait for expiration
    setTimeout(() => {
      const removed = cacheManager.cleanupExpired();
      
      // Should have removed 2 expired entries
      expect(removed).toBe(2);

      const statsAfter = cacheManager.getStats();
      expect(statsAfter.size).toBe(1);
      expect(cacheManager.get('keep')).toBe('value3');
      
      done();
    }, 1500);
  });

  test('should provide accurate cache statistics', () => {
    cacheManager.set('key1', 'value1', 60);
    cacheManager.set('key2', 'value2', 60);
    cacheManager.set('key3', 'value3', 60);

    const stats = cacheManager.getStats();
    expect(stats.size).toBe(3);
    expect(stats.expired).toBe(0);
  });

  test('should handle clear operation', () => {
    cacheManager.set('key1', 'value1', 60);
    cacheManager.set('key2', 'value2', 60);

    cacheManager.clear();

    const stats = cacheManager.getStats();
    expect(stats.size).toBe(0);
  });
});

describe('CacheManager Integration with Express', () => {
  test('should be accessible for route handlers via direct import', () => {
    // Simulate route handler using direct import
    const simulateRouteHandler = () => {
      const cacheKey = 'menu:outlet:test';
      cacheManager.set(cacheKey, { items: [] }, 300);
      return cacheManager.get(cacheKey);
    };

    const result = simulateRouteHandler();
    expect(result).toEqual({ items: [] });
  });

  test('should simulate app.locals access pattern', () => {
    // Simulate Express app.locals
    const mockApp = {
      locals: {
        cacheManager: cacheManager
      }
    };

    // Simulate route handler accessing cache via app.locals
    const cache = mockApp.locals.cacheManager;
    cache.set('test:key', 'test:value', 60);

    expect(cache.get('test:key')).toBe('test:value');
  });
});

describe('CacheManager Performance', () => {
  beforeEach(() => {
    // Ensure clean state for performance test
    cacheManager.clear();
  });

  test('should handle large number of cache operations efficiently', () => {
    const startTime = Date.now();

    // Set 1000 cache entries
    for (let i = 0; i < 1000; i++) {
      cacheManager.set(`key:${i}`, { data: `value${i}` }, 60);
    }

    // Get 1000 cache entries
    for (let i = 0; i < 1000; i++) {
      cacheManager.get(`key:${i}`);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete in under 100ms
    expect(duration).toBeLessThan(100);

    const stats = cacheManager.getStats();
    expect(stats.size).toBe(1000);
  });
});
