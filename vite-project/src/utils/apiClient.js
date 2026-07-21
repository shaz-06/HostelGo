let apiFetchRegister = null;

/**
 * Register the loader-aware fetch handler from the LoaderContext.
 */
export function registerLoaderFetch(handler) {
  apiFetchRegister = handler;
}

/**
 * Branded Fetch Client wrapper that supports blocking/background classifications.
 */
export async function apiFetch(url, options = {}) {
  const isBlocking = options.blocking === true;

  if (isBlocking && apiFetchRegister) {
    return apiFetchRegister(url, options);
  }

  // Fallback to standard fetch for non-blocking/silent/background requests
  return fetch(url, options);
}
