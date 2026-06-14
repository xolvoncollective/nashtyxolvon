/**
 * CacheManager Usage Examples
 * 
 * This file demonstrates how to use the CacheManager in your application.
 * Import the singleton instance: import { cacheManager } from './services/CacheManager';
 */

import { cacheManager } from './CacheManager';

// ===========================
// Example 1: Menu Caching
// ===========================

async function getMenuForOutlet(outletId: string) {
  const cacheKey = `menu:outlet:${outletId}`;
  
  // Try to get from cache first
  let menu = cacheManager.get(cacheKey);
  
  if (menu) {
    console.log('Cache hit: Returning cached menu');
    return menu;
  }
  
  // Cache miss - fetch from database
  console.log('Cache miss: Fetching from database');
  const menuFromDb = await fetchMenuFromDatabase(outletId);
  
  // Store in cache with 5-minute TTL (300 seconds)
  cacheManager.set(cacheKey, menuFromDb, 300);
  
  return menuFromDb;
}

// When menu is updated in Backoffice
async function updateMenuItem(outletId: string, itemId: string, updates: any) {
  // Update in database
  await updateMenuItemInDatabase(itemId, updates);
  
  // Invalidate the cache so next request gets fresh data
  cacheManager.invalidate(`menu:outlet:${outletId}`);
  
  console.log(`Cache invalidated for outlet ${outletId}`);
}

// ===========================
// Example 2: Outlet Configuration
// ===========================

async function getOutletConfig(outletId: string) {
  const cacheKey = `config:outlet:${outletId}`;
  
  // Check cache first
  let config = cacheManager.get(cacheKey);
  
  if (config) {
    return config;
  }
  
  // Fetch from database
  const configFromDb = await fetchOutletConfigFromDatabase(outletId);
  
  // Cache with 10-minute TTL (600 seconds)
  cacheManager.set(cacheKey, configFromDb, 600);
  
  return configFromDb;
}

// ===========================
// Example 3: Pattern-Based Invalidation
// ===========================

// Invalidate all cache entries for a specific outlet
function invalidateOutletCache(outletId: string) {
  // This will invalidate: menu:outlet:123, config:outlet:123, etc.
  cacheManager.invalidatePattern(`*:outlet:${outletId}`);
  console.log(`All cache entries invalidated for outlet ${outletId}`);
}

// Invalidate all menu caches (across all outlets)
function invalidateAllMenus() {
  cacheManager.invalidatePattern('menu:*');
  console.log('All menu caches invalidated');
}

// ===========================
// Example 4: KDS Order Queue Cache
// ===========================

async function getKitchenQueue(outletId: string) {
  const cacheKey = `orders:pending:${outletId}`;
  
  // Check cache (short TTL for real-time data)
  let orders = cacheManager.get(cacheKey);
  
  if (orders) {
    return orders;
  }
  
  // Fetch pending orders
  const ordersFromDb = await fetchPendingOrders(outletId);
  
  // Cache with 5-second TTL for near-real-time updates
  cacheManager.set(cacheKey, ordersFromDb, 5);
  
  return ordersFromDb;
}

// When order status changes, invalidate KDS cache
async function updateOrderStatus(orderId: string, outletId: string, status: string) {
  await updateOrderInDatabase(orderId, status);
  
  // Invalidate KDS cache for this outlet
  cacheManager.invalidate(`orders:pending:${outletId}`);
}

// ===========================
// Example 5: Cache Maintenance
// ===========================

// Periodic cleanup of expired entries (run every 5 minutes)
function scheduleCacheCleanup() {
  setInterval(() => {
    const removed = cacheManager.cleanupExpired();
    console.log(`Cache cleanup: removed ${removed} expired entries`);
    
    const stats = cacheManager.getStats();
    console.log(`Cache stats: ${stats.size} entries, ${stats.expired} expired`);
  }, 5 * 60 * 1000); // 5 minutes
}

// ===========================
// Example 6: Express Middleware
// ===========================

import { Request, Response, NextFunction } from 'express';

// Middleware to cache API responses
function cacheMiddleware(ttl: number = 300) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const cacheKey = `api:${req.path}:${JSON.stringify(req.query)}`;
    
    // Check cache
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to cache response
    res.json = function(data: any) {
      cacheManager.set(cacheKey, data, ttl);
      return originalJson(data);
    };
    
    next();
  };
}

// Usage in routes:
// app.get('/api/menu/:outletId', cacheMiddleware(300), getMenuHandler);

// ===========================
// Example 7: Cache-Aside Pattern
// ===========================

async function cacheAside<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // Try cache first
  let data = cacheManager.get<T>(key);
  
  if (data !== null) {
    return data;
  }
  
  // Fetch from source
  data = await fetchFn();
  
  // Store in cache
  cacheManager.set(key, data, ttl);
  
  return data;
}

// Usage example:
async function getProductById(productId: string) {
  return cacheAside(
    `product:${productId}`,
    () => fetchProductFromDatabase(productId),
    600 // 10 minutes
  );
}

// ===========================
// Mock Database Functions (for examples)
// ===========================

async function fetchMenuFromDatabase(outletId: string): Promise<any> {
  // Simulated database fetch
  return {
    categories: [],
    items: [],
    modifiers: []
  };
}

async function updateMenuItemInDatabase(itemId: string, updates: any): Promise<void> {
  // Simulated database update
}

async function fetchOutletConfigFromDatabase(outletId: string): Promise<any> {
  // Simulated database fetch
  return {
    taxRate: 0.1,
    serviceCharge: 0.05
  };
}

async function fetchPendingOrders(outletId: string): Promise<any[]> {
  // Simulated database fetch
  return [];
}

async function updateOrderInDatabase(orderId: string, status: string): Promise<void> {
  // Simulated database update
}

async function fetchProductFromDatabase(productId: string): Promise<any> {
  // Simulated database fetch
  return {
    id: productId,
    name: 'Product',
    price: 10000
  };
}

// ===========================
// Export for testing
// ===========================

export {
  getMenuForOutlet,
  updateMenuItem,
  getOutletConfig,
  invalidateOutletCache,
  invalidateAllMenus,
  getKitchenQueue,
  updateOrderStatus,
  scheduleCacheCleanup,
  cacheMiddleware,
  cacheAside,
  getProductById
};
