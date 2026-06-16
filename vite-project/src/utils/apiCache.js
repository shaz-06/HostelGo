const cache = new Map();
const inFlightRequests = new Map();

/**
 * Custom fetch wrapper that handles request caching and deduplication.
 * @param {string} url - The URL to fetch.
 * @param {object} options - Fetch options.
 * @param {number} ttlMs - Cache expiration duration in milliseconds (default 2 minutes).
 */
export async function cachedFetch(url, options = {}, ttlMs = 120000) {
  // Only cache GET requests
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    return fetch(url, options).then(res => res.json());
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

  // 3. Initiate the request
  const requestPromise = fetch(url, options)
    .then(async (res) => {
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
