function isStockNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function getRequestedQuantity(quantity) {
  const normalizedQuantity = Number(quantity);
  if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) {
    throw new Error("Product quantity must be a positive whole number.");
  }
  return normalizedQuantity;
}

/**
 * Products support two inventory layouts:
 * - per-variant inventory: variants[].stock is a number
 * - shared inventory: product.stock is a number, even if variants are present
 *
 * Variants without a numeric stock are catalogue/price options, not inventory
 * buckets.  This distinction must be made before constructing the atomic query.
 */
function getInventoryTarget(product, requestedWeight) {
  const variants = Array.isArray(product.variants) ? product.variants : [];

  if (variants.length > 0) {
    const variant = variants.find((entry) => entry.weight === requestedWeight);
    if (!variant) {
      throw new Error(
        `The selected variant of "${product.name}" is no longer available.`,
      );
    }

    if (isStockNumber(variant.stock)) {
      return { type: "variant", weight: variant.weight, stock: variant.stock };
    }
  }

  if (isStockNumber(product.stock)) {
    return { type: "product", stock: product.stock };
  }

  throw new Error(`Inventory is not configured for "${product.name}".`);
}

function assertInventoryAvailable(product, requestedWeight, quantity) {
  const normalizedQuantity = getRequestedQuantity(quantity);
  const target = getInventoryTarget(product, requestedWeight);

  if (target.stock < normalizedQuantity) {
    const itemDescription =
      target.type === "variant" ? "selected variant" : "product";
    throw new Error(
      `Only ${target.stock} units of "${product.name}" ${itemDescription} are available.`,
    );
  }

  return { ...target, quantity: normalizedQuantity };
}

module.exports = {
  assertInventoryAvailable,
  getInventoryTarget,
  getRequestedQuantity,
};
