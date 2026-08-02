const isDev = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV;

let traceCounter = 0;
const traceMap = new WeakMap();

function getOrCreateTraceId(product) {
  if (!product || typeof product !== "object") return "N/A";
  
  // Try to find if we already assigned a traceId in our WeakMap
  if (traceMap.has(product)) {
    return traceMap.get(product);
  }
  
  traceCounter += 1;
  const newTraceId = `cart-${traceCounter}`;
  traceMap.set(product, newTraceId);
  return newTraceId;
}

export const cartDebug = {
  logLifecycle(stage, item, additionalInfo = {}) {
    if (!isDev) return;

    const traceId = getOrCreateTraceId(item);
    console.log(`[Cart Lifecycle] [${stage}]`, {
      traceId,
      name: item?.name || "Unknown Name",
      id: item?.id || "N/A",
      _id: item?._id || "N/A",
      quantity: item?.quantity || 1,
      ...additionalInfo
    });

    this.assertIntegrity(stage, item);
  },

  validateProductResponse(product) {
    if (!isDev) return;

    if (!product || typeof product !== "object") return;
    if (!product._id) {
      console.warn("⚠️ [API Response Validation] Catalog product is missing MongoDB _id:", {
        id: product.id,
        name: product.name,
        category: product.category
      });
    }
  },

  assertIntegrity(stage, product) {
    if (!isDev) return;

    if (!product || typeof product !== "object") return;
    if (!product._id) {
      const traceId = getOrCreateTraceId(product);
      console.groupCollapsed(`🚨 Cart Integrity Violation at [${stage}]`);
      console.error({
        stage,
        traceId,
        name: product.name,
        id: product.id,
        _id: product._id,
        product
      });
      console.assert(false, `Product "${product.name || product.id}" is missing MongoDB _id at stage "${stage}"`);
      console.groupEnd();
    }
  }
};
