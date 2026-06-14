/**
 * CacheManager - In-memory caching service with TTL support
 * 
 * Provides methods to cache frequently accessed data with automatic expiration
 * Supports pattern-based invalidation for related cache entries
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get a value from the cache
   * @param key - Cache key
   * @returns Cached value or null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      // Clean up expired entry
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set a value in the cache with optional TTL
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time-to-live in seconds (default: 300 seconds / 5 minutes)
   */
  set<T>(key: string, value: T, ttl: number = 300): void {
    const expiresAt = Date.now() + (ttl * 1000);
    
    this.cache.set(key, {
      value,
      expiresAt
    });
  }

  /**
   * Invalidate a single cache entry
   * @param key - Cache key to invalidate
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   * @param pattern - Pattern to match (supports * wildcard)
   * @example
   * invalidatePattern("menu:*") // Invalidates all keys starting with "menu:"
   * invalidatePattern("*:outlet-1") // Invalidates all keys ending with ":outlet-1"
   */
  invalidatePattern(pattern: string): void {
    // Convert pattern to regex
    // Escape special regex characters except *
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    
    const regex = new RegExp(`^${regexPattern}$`);

    // Find and delete all matching keys
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns Object with cache size and expired entries count
   */
  getStats(): { size: number; expired: number } {
    let expired = 0;
    const now = Date.now();

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      }
    }

    return {
      size: this.cache.size,
      expired
    };
  }

  /**
   * Clean up expired entries from the cache
   * This is called automatically on get(), but can also be called manually
   * @returns Number of entries removed
   */
  cleanupExpired(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
