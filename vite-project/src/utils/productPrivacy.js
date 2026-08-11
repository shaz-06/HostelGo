/**
 * Determines whether a product is sensitive based on explicit fields,
 * narrow categories/subcategories, or specific keywords.
 * @param {object} product - The product object to analyze.
 * @returns {boolean} True if the product is sensitive.
 */
export function isProductSensitive(product) {
  if (!product) return false;

  // 1. Explicit database classification fields
  if (product.isSensitive === true || product.sensitive === true) {
    return true;
  }

  // 2. Explicit sensitive category/subcategory matches
  const category = (product.category || "").toLowerCase();
  const subCategory = (product.subCategory || product.subcategory || "").toLowerCase();
  
  if (
    category.includes("sexual wellness") ||
    category.includes("intimate wellness") ||
    subCategory.includes("sexual wellness") ||
    subCategory.includes("intimate hygiene")
  ) {
    return true;
  }

  // 3. Explicit sensitive product name/tag keywords
  const name = (product.name || "").toLowerCase();
  const tags = Array.isArray(product.tags) ? product.tags.map(t => String(t).toLowerCase()) : [];

  const sensitiveKeywords = ["condom", "lube", "lubricant", "sexual wellness", "intimate wellness", "intimate hygiene"];
  
  if (sensitiveKeywords.some(keyword => name.includes(keyword))) {
    return true;
  }
  
  if (tags.some(tag => sensitiveKeywords.some(keyword => tag.includes(keyword)))) {
    return true;
  }

  return false;
}
