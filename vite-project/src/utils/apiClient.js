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
  const minDelay = options.minDelay;

  const reqStart = performance.now();
  let promise;

  if (isBlocking && apiFetchRegister) {
    promise = apiFetchRegister(url, options);
  } else {
    promise = fetch(url, options);
  }

  if (minDelay) {
    // Return a promise that resolves with the response only after minDelay ms
    return promise.then(async (res) => {
      const elapsed = performance.now() - reqStart;
      const remaining = minDelay - elapsed;
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }
      return res;
    });
  }

  return promise;
}
