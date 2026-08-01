import { apiFetch } from "./apiClient";

const cache = new Map();
const inFlightRequests = new Map();

/**
 * Custom fetch wrapper that handles request caching and deduplication.
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options.
 * @param {number} ttlMs - Cache expiration duration in milliseconds (default 2 minutes).
 */
export async function cachedFetch(url, options = {}, ttlMs = 120000) {
  // Automatically apply 700ms minDelay for product-related GET API requests to ensure skeleton display consistency
  if (url.includes("/api/products") && options.minDelay === undefined) {
    options.minDelay = 700;
  }

  // Only cache GET requests
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    return apiFetch(url, options).then(res => res.json());
  }

  const cacheKey = JSON.stringify({ url, options });

  // 1. Check if we have a valid cached response
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.data;
  }

  // 2. Check if there is already a matching request in flight
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  // 3. Initiate the request with timing instrumentation
  const reqStart = performance.now();
  const requestPromise = apiFetch(url, options)
    .then(async (res) => {
      const durationMs = (performance.now() - reqStart).toFixed(2);
      const contentLength = res.headers.get("content-length") || "0";
      const payloadKb = (Number(contentLength) / 1024).toFixed(2);

      if (durationMs > 500) {
        console.warn(`⚠️ [SLOW API] ${method} ${url} - ${durationMs}ms | Status: ${res.status} | Size: ${payloadKb}KB`);
      } else {
        console.log(`⚡ [API PERF] ${method} ${url} - ${durationMs}ms | Status: ${res.status} | Size: ${payloadKb}KB`);
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      // Store in cache
      cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
      return data;
    })
    .finally(() => {
      // Clean up in-flight tracker
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Manually invalidate cached responses by URL prefix or purge entire cache.
 * @param {string} [urlPrefix] - Optional URL prefix to match for invalidation.
 */
export function invalidateApiCache(urlPrefix) {
  if (!urlPrefix) {
    cache.clear();
    console.log("🧹 [API CACHE] Cleared all cached endpoints.");
    return;
  }
  let count = 0;
  for (const key of cache.keys()) {
    if (key.includes(urlPrefix)) {
      cache.delete(key);
      count++;
    }
  }
  console.log(`🧹 [API CACHE] Invalidated ${count} cache entries for prefix: "${urlPrefix}"`);
}
