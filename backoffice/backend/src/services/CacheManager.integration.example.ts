/**
 * CacheManager Integration Example
 * 
 * This file demonstrates how to access and use the CacheManager
 * in Express route handlers after it has been initialized in index.ts
 */

import { Request, Response } from 'express';
import { cacheManager } from './CacheManager';

/**
 * Example 1: Direct import of the singleton instance
 * This is the recommended approach for most use cases
 */
export const exampleRouteWithDirectImport = async (req: Request, res: Response) => {
  const outletId = req.params.outletId;
  const cacheKey = `menu:outlet:${outletId}`;

  // Try to get from cache
  const cachedMenu = cacheManager.get(cacheKey);

  if (cachedMenu) {
    console.log('Cache hit for', cacheKey);
    return res.json({ success: true, data: cachedMenu, cached: true });
  }

  // Cache miss - fetch from database
  console.log('Cache miss for', cacheKey);
  const menu = await fetchMenuFromDatabase(outletId);

  // Store in cache with 5-minute TTL (300 seconds)
  cacheManager.set(cacheKey, menu, 300);

  return res.json({ success: true, data: menu, cached: false });
};

/**
 * Example 2: Access via app.locals (available in route handlers)
 * This is an alternative approach if you need dependency injection
 */
export const exampleRouteWithAppLocals = async (req: Request, res: Response) => {
  // Access cache manager from app.locals
  const cache = req.app.locals.cacheManager;

  const configKey = `config:outlet:${req.params.outletId}`;
  
  // Check cache
  let config = cache.get(configKey);
  
  if (!config) {
    // Fetch and cache
    config = await fetchOutletConfig(req.params.outletId);
    cache.set(configKey, config, 600); // 10-minute TTL
  }

  return res.json({ success: true, data: config });
};

/**
 * Example 3: Cache invalidation on data updates
 */
export const exampleUpdateMenuRoute = async (req: Request, res: Response) => {
  const { itemId, outletId } = req.params;

  // Update the menu item in database
  await updateMenuItem(itemId, req.body);

  // Invalidate the cache for this outlet's menu
  cacheManager.invalidate(`menu:outlet:${outletId}`);

  return res.json({ success: true, message: 'Menu updated and cache invalidated' });
};

/**
 * Example 4: Pattern-based cache invalidation
 */
export const exampleInvalidateAllMenuCaches = async (req: Request, res: Response) => {
  // Invalidate all menu caches across all outlets
  cacheManager.invalidatePattern('menu:*');

  return res.json({ success: true, message: 'All menu caches invalidated' });
};

/**
 * Example 5: Get cache statistics
 */
export const exampleCacheStatsRoute = async (req: Request, res: Response) => {
  const stats = cacheManager.getStats();

  return res.json({
    success: true,
    data: {
      totalEntries: stats.size,
      expiredEntries: stats.expired,
      healthStatus: stats.expired > stats.size * 0.5 ? 'degraded' : 'healthy'
    }
  });
};

// Mock database functions (replace with actual implementation)
async function fetchMenuFromDatabase(outletId: string) {
  // TODO: Implement actual database query
  return { categories: [], items: [], modifierGroups: [] };
}

async function fetchOutletConfig(outletId: string) {
  // TODO: Implement actual database query
  return { outletId, taxRate: 0.11, serviceChargeRate: 0.05 };
}

async function updateMenuItem(itemId: string, data: any) {
  // TODO: Implement actual database update
  return true;
}
