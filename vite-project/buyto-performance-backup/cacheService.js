/**
 * cacheService.js
 * In-memory caching service with TTL, cache stampede prevention,
 * and max entry limits to prevent unbounded memory growth.
 * Designed to easily swap with Redis in the future.
 */

const CACHE_MAX_ENTRIES = 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

class CacheService {
  constructor() {
    this.cache = new Map(); // key -> { value, expiresAt }
    this.inFlight = new Map(); // key -> Promise (stampede prevention)
    
    // Periodically clean up expired entries
    setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS).unref();
  }

  /**
   * Internal method to remove expired entries and enforce size limits
   */
  cleanup() {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < now) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`[CACHE CLEANUP] Evicted ${expiredCount} expired entries`);
    }

    // LRU-like eviction if we exceed max capacity
    if (this.cache.size > CACHE_MAX_ENTRIES) {
      const overage = this.cache.size - CACHE_MAX_ENTRIES;
      let evicted = 0;
      
      // Since Maps iterate in insertion order, deleting the first items acts like FIFO/LRU-ish
      for (const [key] of this.cache.entries()) {
        if (evicted >= overage) break;
        this.cache.delete(key);
        evicted++;
      }
      console.log(`[CACHE MEMORY PROTECT] Evicted ${evicted} oldest entries`);
    }
  }

  /**
   * Fetch data with caching and stampede prevention
   * @param {string} key - Cache key
   * @param {number} ttlSeconds - Time to live in seconds
   * @param {Function} fetchFn - Function returning a Promise that resolves to the data
   * @returns {Promise<any>}
   */
  async fetchWithCache(key, ttlSeconds, fetchFn) {
    const now = Date.now();
    const cachedItem = this.cache.get(key);

    // 1. Cache HIT
    if (cachedItem && cachedItem.expiresAt > now) {
      console.log(`[CACHE HIT] ${key}`);
      return cachedItem.value;
    }

    // 2. Cache STALE/MISS - check for in-flight requests (Stampede prevention)
    if (this.inFlight.has(key)) {
      console.log(`[CACHE IN-FLIGHT] Waiting for existing request for ${key}`);
      return this.inFlight.get(key);
    }

    // 3. Cache MISS - execute fetch function
    console.log(cachedItem ? `[CACHE STALE] ${key}` : `[CACHE MISS] ${key}`);
    
    const promise = fetchFn()
      .then((data) => {
        // SET cache
        this.cache.set(key, {
          value: data,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
        console.log(`[CACHE SET] ${key} (TTL: ${ttlSeconds}s)`);
        return data;
      })
      .catch((err) => {
        // If fetch fails, don't cache the error, but we might want to serve stale data if available
        if (cachedItem) {
          console.error(`[CACHE ERROR] Fetch failed for ${key}, serving stale data`, err.message);
          return cachedItem.value;
        }
        throw err;
      })
      .finally(() => {
        // Remove from in-flight regardless of success/failure
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Invalidate specific keys or keys matching a pattern
   * @param {string|RegExp} pattern - String prefix or RegExp to match
   */
  invalidate(pattern) {
    let invalidatedCount = 0;
    
    for (const key of this.cache.keys()) {
      const matches = typeof pattern === 'string' 
        ? key.startsWith(pattern)
        : pattern.test(key);
        
      if (matches) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    console.log(`[CACHE INVALIDATE] Pattern: ${pattern} - Removed ${invalidatedCount} entries`);
  }

  /**
   * For testing/debugging purposes
   */
  getStats() {
    return {
      size: this.cache.size,
      inFlight: this.inFlight.size
    };
  }
}

// Export a singleton instance
module.exports = new CacheService();
