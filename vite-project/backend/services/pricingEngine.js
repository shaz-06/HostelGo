const PricingRule = require("../models/PricingRule");

/**
 * Service to calculate selling price for a product based on active pricing rules.
 * Does NOT overwrite original/base price.
 *
 * @param {Object} product - Product document or object containing price, category, etc.
 * @param {Array} activeRules - Optional array of active PricingRule documents. If omitted, will be fetched.
 * @param {Date} now - Reference timestamp.
 * @returns {Object} { finalPrice, originalBasePrice, activeRule, isFestivalPrice, badgeText, adjustmentAmount }
 */
async function calculateSellingPrice(product, activeRules = null, now = new Date()) {
  if (!product) return null;

  // Base price is immutable source of truth
  const basePrice = Number(product.originalPrice || product.price || 0);

  // If rules aren't passed in, fetch currently active rules from DB
  if (!activeRules) {
    try {
      activeRules = await PricingRule.find({
        status: "Enabled",
        startDate: { $lte: now },
        endDate: { $gte: now }
      })
      .sort({ priority: -1, createdAt: -1 })
      .lean();
    } catch (err) {
      console.error("Error fetching pricing rules in pricingEngine:", err);
      activeRules = [];
    }
  }

  if (!activeRules || activeRules.length === 0) {
    return {
      finalPrice: Number(product.price || basePrice),
      originalBasePrice: basePrice,
      activeRule: null,
      isFestivalPrice: false,
      badgeText: null,
      adjustmentAmount: 0
    };
  }

  const prodId = String(product._id || product.id || "");
  const category = (product.category || "").trim().toLowerCase();
  const subCategory = (product.subCategory || product.subcategory || "").trim().toLowerCase();
  const brand = (product.brand || "").trim().toLowerCase();

  // Find highest priority matching rule
  let matchedRule = null;

  for (const rule of activeRules) {
    if (rule.status !== "Enabled") continue;
    const ruleStart = new Date(rule.startDate);
    const ruleEnd = new Date(rule.endDate);
    if (now < ruleStart || now > ruleEnd) continue;

    const targets = (rule.targetValues || []).map(t => String(t).trim().toLowerCase());

    let isMatch = false;
    switch (rule.appliesTo) {
      case "Entire Store":
        isMatch = true;
        break;
      case "Category":
        isMatch = targets.includes(category);
        break;
      case "Subcategory":
        isMatch = targets.includes(subCategory);
        break;
      case "Brand":
        isMatch = targets.includes(brand);
        break;
      case "Product":
        isMatch = targets.some(t => t === prodId || t === String(product.id));
        break;
      default:
        isMatch = false;
    }

    if (isMatch) {
      matchedRule = rule;
      break; // Highest priority rule matched first due to sort
    }
  }

  if (!matchedRule) {
    return {
      finalPrice: Number(product.price || basePrice),
      originalBasePrice: basePrice,
      activeRule: null,
      isFestivalPrice: false,
      badgeText: null,
      adjustmentAmount: 0
    };
  }

  // Calculate price adjustment based on rule definition
  let adjustmentAmount = 0;
  const value = Number(matchedRule.adjustmentValue || 0);

  switch (matchedRule.adjustmentType) {
    case "Percentage Increase":
      adjustmentAmount = Math.round(basePrice * (value / 100));
      break;
    case "Percentage Decrease":
      adjustmentAmount = -Math.round(basePrice * (value / 100));
      break;
    case "Fixed Increase":
      adjustmentAmount = value;
      break;
    case "Fixed Decrease":
      adjustmentAmount = -value;
      break;
    default:
      adjustmentAmount = 0;
  }

  const finalPrice = Math.max(1, basePrice + adjustmentAmount);

  return {
    finalPrice,
    originalBasePrice: basePrice,
    activeRule: {
      _id: matchedRule._id,
      name: matchedRule.name,
      appliesTo: matchedRule.appliesTo,
      adjustmentType: matchedRule.adjustmentType,
      adjustmentValue: matchedRule.adjustmentValue,
      badgeText: matchedRule.badgeText
    },
    isFestivalPrice: true,
    badgeText: matchedRule.badgeText || "🎉 Festival Price",
    adjustmentAmount
  };
}

/**
 * Apply pricing engine rules across an array of product documents
 */
async function applyPricingRulesToProducts(products) {
  if (!Array.isArray(products) || products.length === 0) return products;

  const now = new Date();
  let activeRules = [];
  try {
    activeRules = await PricingRule.find({
      status: "Enabled",
      startDate: { $lte: now },
      endDate: { $gte: now }
    })
    .sort({ priority: -1, createdAt: -1 })
    .lean();
  } catch (err) {
    console.error("Failed to load active pricing rules:", err);
  }

  if (activeRules.length === 0) return products;

  return products.map(product => {
    // Standardize product object reference
    const calculated = calculateSellingPriceSync(product, activeRules, now);
    if (calculated.isFestivalPrice) {
      return {
        ...product,
        originalPrice: calculated.originalBasePrice,
        price: calculated.finalPrice,
        isFestivalPrice: true,
        pricingBadge: calculated.badgeText,
        pricingRule: calculated.activeRule
      };
    }
    return product;
  });
}

/**
 * Synchronous variant helper when rules are pre-loaded
 */
function calculateSellingPriceSync(product, activeRules = [], now = new Date()) {
  const basePrice = Number(product.originalPrice || product.price || 0);
  const prodId = String(product._id || product.id || "");
  const category = (product.category || "").trim().toLowerCase();
  const subCategory = (product.subCategory || product.subcategory || "").trim().toLowerCase();
  const brand = (product.brand || "").trim().toLowerCase();

  let matchedRule = null;

  for (const rule of activeRules) {
    if (rule.status !== "Enabled") continue;
    const ruleStart = new Date(rule.startDate);
    const ruleEnd = new Date(rule.endDate);
    if (now < ruleStart || now > ruleEnd) continue;

    const targets = (rule.targetValues || []).map(t => String(t).trim().toLowerCase());

    let isMatch = false;
    switch (rule.appliesTo) {
      case "Entire Store":
        isMatch = true;
        break;
      case "Category":
        isMatch = targets.includes(category);
        break;
      case "Subcategory":
        isMatch = targets.includes(subCategory);
        break;
      case "Brand":
        isMatch = targets.includes(brand);
        break;
      case "Product":
        isMatch = targets.some(t => t === prodId || t === String(product.id));
        break;
      default:
        isMatch = false;
    }

    if (isMatch) {
      matchedRule = rule;
      break;
    }
  }

  if (!matchedRule) {
    return {
      finalPrice: Number(product.price || basePrice),
      originalBasePrice: basePrice,
      activeRule: null,
      isFestivalPrice: false,
      badgeText: null,
      adjustmentAmount: 0
    };
  }

  let adjustmentAmount = 0;
  const value = Number(matchedRule.adjustmentValue || 0);

  switch (matchedRule.adjustmentType) {
    case "Percentage Increase":
      adjustmentAmount = Math.round(basePrice * (value / 100));
      break;
    case "Percentage Decrease":
      adjustmentAmount = -Math.round(basePrice * (value / 100));
      break;
    case "Fixed Increase":
      adjustmentAmount = value;
      break;
    case "Fixed Decrease":
      adjustmentAmount = -value;
      break;
    default:
      adjustmentAmount = 0;
  }

  const finalPrice = Math.max(1, basePrice + adjustmentAmount);

  return {
    finalPrice,
    originalBasePrice: basePrice,
    activeRule: {
      _id: matchedRule._id,
      name: matchedRule.name,
      appliesTo: matchedRule.appliesTo,
      adjustmentType: matchedRule.adjustmentType,
      adjustmentValue: matchedRule.adjustmentValue,
      badgeText: matchedRule.badgeText
    },
    isFestivalPrice: true,
    badgeText: matchedRule.badgeText || "🎉 Festival Price",
    adjustmentAmount
  };
}

module.exports = {
  calculateSellingPrice,
  applyPricingRulesToProducts,
  calculateSellingPriceSync
};
