# CacheManager

In-memory caching service with TTL support for the NASHTY OS backend.

## Overview

The CacheManager provides a simple, efficient way to cache frequently accessed data in memory, reducing database queries and improving API response times. It supports automatic expiration (TTL), pattern-based invalidation, and automatic cleanup of expired entries.

## Features

- ✅ **In-memory Map storage** - Fast O(1) access times
- ✅ **TTL support** - Automatic expiration of cached entries
- ✅ **Pattern-based invalidation** - Invalidate multiple related keys with wildcards
- ✅ **Automatic cleanup** - Expired entries are removed on access
- ✅ **Type-safe** - Full TypeScript support with generics
- ✅ **Singleton pattern** - Single shared instance across application
- ✅ **Zero dependencies** - Built with native JavaScript Map

## Installation

The CacheManager is already included in the backend. Simply import it:

```typescript
import { cacheManager } from './services/CacheManager';
```

## API Reference

### `get<T>(key: string): T | null`

Retrieves a value from the cache. Returns `null` if the key doesn't exist or has expired.

```typescript
const menu = cacheManager.get<MenuData>('menu:outlet:1');
if (menu) {
  console.log('Cache hit');
} else {
  console.log('Cache miss');
}
```

### `set<T>(key: string, value: T, ttl?: number): void`

Stores a value in the cache with an optional TTL (in seconds). Default TTL is 300 seconds (5 minutes).

```typescript
// Cache with default 5-minute TTL
cacheManager.set('menu:outlet:1', menuData);

// Cache with custom 10-minute TTL
cacheManager.set('config:outlet:1', configData, 600);
```

### `invalidate(key: string): void`

Removes a single entry from the cache.

```typescript
cacheManager.invalidate('menu:outlet:1');
```

### `invalidatePattern(pattern: string): void`

Removes all entries matching a pattern. Supports `*` wildcard.

```typescript
// Invalidate all menu caches
cacheManager.invalidatePattern('menu:*');

// Invalidate all caches for outlet 1
cacheManager.invalidatePattern('*:outlet:1');

// Invalidate all pending orders
cacheManager.invalidatePattern('orders:pending:*');
```

### `clear(): void`

Removes all entries from the cache.

```typescript
cacheManager.clear();
```

### `getStats(): { size: number; expired: number }`

Returns statistics about the cache.

```typescript
const stats = cacheManager.getStats();
console.log(`Cache has ${stats.size} entries, ${stats.expired} expired`);
```

### `cleanupExpired(): number`

Manually removes all expired entries. Returns the number of entries removed.

```typescript
const removed = cacheManager.cleanupExpired();
console.log(`Cleaned up ${removed} expired entries`);
```

## Usage Patterns

### Cache-Aside Pattern

The most common caching pattern: check cache first, then fetch from database on miss.

```typescript
async function getMenu(outletId: string) {
  const cacheKey = `menu:outlet:${outletId}`;
  
  // Try cache first
  let menu = cacheManager.get(cacheKey);
  if (menu) return menu;
  
  // Cache miss - fetch from database
  menu = await db.fetchMenu(outletId);
  
  // Store in cache with 5-minute TTL
  cacheManager.set(cacheKey, menu, 300);
  
  return menu;
}
```

### Write-Through Pattern

Update database and invalidate cache immediately.

```typescript
async function updateMenuItem(outletId: string, itemId: string, updates: any) {
  // Update database
  await db.updateMenuItem(itemId, updates);
  
  // Invalidate cache to force fresh fetch
  cacheManager.invalidate(`menu:outlet:${outletId}`);
}
```

## Cache Key Conventions

Use a consistent naming scheme for cache keys:

- **Menu data**: `menu:outlet:{outletId}`
- **Outlet config**: `config:outlet:{outletId}`
- **Pending orders**: `orders:pending:{outletId}`
- **Products**: `product:{productId}`
- **User sessions**: `session:{userId}`

This convention makes pattern-based invalidation easier.

## TTL Guidelines

Choose appropriate TTL values based on data freshness requirements:

| Data Type | Recommended TTL | Reasoning |
|-----------|----------------|-----------|
| Menu items | 300s (5 min) | Changes infrequently, but needs to reflect updates |
| Outlet config | 600s (10 min) | Rarely changes |
| Order queue | 5s | Near real-time updates required |
| Product prices | 300s (5 min) | Balance between freshness and performance |
| User sessions | 3600s (1 hour) | Long-lived but should expire eventually |

## Performance Considerations

- **Memory usage**: Each cached entry consumes memory. Monitor with `getStats()`
- **Cleanup**: Expired entries are automatically removed on `get()` calls
- **Pattern matching**: `invalidatePattern()` iterates all keys - use sparingly
- **TTL precision**: TTL is checked in milliseconds, but practical precision is ~100ms

## Testing

Run the test suite:

```bash
npm test -- CacheManager.test.ts
```

The test suite includes:
- 35 test cases
- Unit tests for all methods
- TTL and expiration tests
- Pattern matching tests
- Real-world usage scenarios
- Edge case handling

## Example: Menu Caching in Express Route

```typescript
import { Router } from 'express';
import { cacheManager } from './services/CacheManager';

const router = Router();

// GET /api/menu/:outletId
router.get('/menu/:outletId', async (req, res) => {
  const { outletId } = req.params;
  const cacheKey = `menu:outlet:${outletId}`;
  
  try {
    // Check cache
    let menu = cacheManager.get(cacheKey);
    
    if (!menu) {
      // Cache miss - fetch from database
      menu = await db.query(`
        SELECT * FROM menu_items 
        WHERE outlet_id = ? AND status = 'active'
      `, [outletId]);
      
      // Cache with 5-minute TTL
      cacheManager.set(cacheKey, menu, 300);
    }
    
    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// POST /api/menu/items
router.post('/menu/items', async (req, res) => {
  const { outletId, ...itemData } = req.body;
  
  try {
    // Insert into database
    const result = await db.query(
      'INSERT INTO menu_items SET ?',
      [{ outlet_id: outletId, ...itemData }]
    );
    
    // Invalidate cache
    cacheManager.invalidate(`menu:outlet:${outletId}`);
    
    res.json({ success: true, itemId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

export default router;
```

## Maintenance

### Periodic Cleanup

Set up periodic cleanup to prevent memory leaks:

```typescript
// In your index.ts
import { cacheManager } from './services/CacheManager';

// Run cleanup every 5 minutes
setInterval(() => {
  const removed = cacheManager.cleanupExpired();
  console.log(`[Cache] Cleaned up ${removed} expired entries`);
}, 5 * 60 * 1000);
```

### Monitoring

Add monitoring to track cache performance:

```typescript
// Middleware to log cache hits/misses
app.use((req, res, next) => {
  const stats = cacheManager.getStats();
  console.log(`[Cache] Size: ${stats.size}, Expired: ${stats.expired}`);
  next();
});
```

## Requirements Validation

This implementation satisfies the following requirements from the spec:

- **Requirement 10.1**: In-memory cache manager initialized on backend start
- **Requirement 10.8**: Cache manager provides get, set, invalidate, invalidatePattern, and clear methods
- **Requirement 10.9**: Automatic cleanup of expired entries to prevent memory leaks

## Related Files

- `CacheManager.ts` - Main implementation
- `CacheManager.test.ts` - Test suite
- `CacheManager.usage.example.ts` - Usage examples

## License

Internal use only - NASHTY OS Backend
