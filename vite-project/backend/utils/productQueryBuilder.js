const mongoose = require("mongoose");

const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

/**
 * Category alias map: maps frontend-facing category names / slug-derived names
 * to all stored category names in MongoDB.
 */
const CATEGORY_ALIASES = {
  "Makeups":          ["Makeups", "Makeup & Beauty", "Makeup and Beauty", "Skincare"],
  "Makeup & Beauty":  ["Makeup & Beauty", "Makeup and Beauty", "Makeups"],
  "Makeup and Beauty":["Makeup & Beauty", "Makeup and Beauty", "Makeups"],
  "Female Hygiene":   ["Female Hygiene", "Health and Pharma", "Feminine Hygiene"],
  "Feminine Hygiene": ["Feminine Hygiene", "Health and Pharma", "Female Hygiene"],
  "Bath and Body":    ["Bath and Body", "Bath & Body"],
  "Bath & Body":      ["Bath and Body", "Bath & Body"],
  "Hair Care":        ["Hair Care"],
  "Health and Pharma":["Health and Pharma", "Pharmacy"],
  "Pharmacy":         ["Health and Pharma", "Pharmacy"],
};

/**
 * Returns all category names to match for a given query string.
 */
const resolveCategoryNames = (categoryQuery) => {
  // Build possible expansions
  const expansions = new Set([
    categoryQuery,
    categoryQuery.replace("&", "and"),
    categoryQuery.replace("and", "&"),
  ]);
  const aliased = CATEGORY_ALIASES[categoryQuery];
  if (aliased) aliased.forEach(a => expansions.add(a));
  return [...expansions];
};

/**
 * Builds the MongoDB filter/match conditions for products
 * @param {Object} query - The req.query object
 * @returns {Object} MongoDB filter object
 */
const buildProductFilters = (query) => {
  const filter = {};
  const andConditions = [];

  // 1. Basic category filtering
  const categoryQuery = (query.category || "").toString().trim();
  const subCategoryQuery = (query.subCategory || query.sub || "").toString().trim();

  if (categoryQuery && categoryQuery !== "All") {
    const resolvedNames = resolveCategoryNames(categoryQuery);
    andConditions.push({
      $or: resolvedNames.map(name => ({ category: name }))
    });
  }

  // Note: Detailed subcategory business logic (e.g. matching "mom-hygiene")
  // will be handled in the main query executor or by extending this function,
  // but for basic fallback:
  if (subCategoryQuery && subCategoryQuery !== "Show All") {
    andConditions.push({
      $or: [
        { subCategory: subCategoryQuery },
        { subcategory: subCategoryQuery }
      ]
    });
  }

  // 2. IDs filter
  if (query.ids) {
    const idList = query.ids.split(",").filter(Boolean);
    const validObjectIds = idList.filter(id => mongoose.Types.ObjectId.isValid(id));
    andConditions.push({
      $or: [
        { _id: { $in: validObjectIds } },
        { id: { $in: idList } }
      ]
    });
  }

  // 3. Dynamic Filters (from `selectedFilters` on frontend)
  if (query.filters) {
    try {
      const selectedFilters = JSON.parse(query.filters);
      Object.entries(selectedFilters).forEach(([section, selectedOptions]) => {
        if (!selectedOptions || selectedOptions.length === 0) return;

        const sectionOrConditions = [];

        selectedOptions.forEach(option => {
          const lowerSection = section.toLowerCase();

          if (lowerSection === "price") {
            const matchUnder = option.match(/Under\s*₹\s*(\d+)/i);
            if (matchUnder) {
              sectionOrConditions.push({ price: { $lt: parseInt(matchUnder[1], 10) } });
            } else {
              const matchRange = option.match(/₹\s*(\d+)\s*-\s*₹\s*(\d+)/i);
              if (matchRange) {
                sectionOrConditions.push({ price: { $gte: parseInt(matchRange[1], 10), $lte: parseInt(matchRange[2], 10) } });
              } else {
                const matchPlus = option.match(/₹\s*(\d+)\s*\+/i);
                if (matchPlus) {
                  sectionOrConditions.push({ price: { $gte: parseInt(matchPlus[1], 10) } });
                }
              }
            }
          }
          else if (lowerSection === "offers") {
            const matchPct = option.match(/(\d+)%\+\s*OFF/i);
            if (matchPct) {
              const pct = parseInt(matchPct[1], 10);
              sectionOrConditions.push({
                $expr: {
                  $and: [
                    { $gt: ["$originalPrice", "$price"] },
                    {
                      $gte: [
                        { $multiply: [{ $divide: [{ $subtract: ["$originalPrice", "$price"] }, "$originalPrice"] }, 100] },
                        pct
                      ]
                    }
                  ]
                }
              });
            } else if (option.toLowerCase().includes("buy 1 get 1")) {
              sectionOrConditions.push({
                $or: [
                  { name: { $regex: "buy 1 get 1", $options: "i" } },
                  { description: { $regex: "bogo", $options: "i" } },
                  { tags: { $regex: "bogo", $options: "i" } }
                ]
              });
            }
          }
          else if (lowerSection === "type") {
            const val = escapeRegex(option.toLowerCase());
            sectionOrConditions.push({
              $or: [
                { name: { $regex: val, $options: "i" } },
                { subCategory: { $regex: val, $options: "i" } },
                { subcategory: { $regex: val, $options: "i" } },
                { description: { $regex: val, $options: "i" } },
                { tags: { $regex: val, $options: "i" } }
              ]
            });
          }
          else if (lowerSection === "brand") {
            const val = escapeRegex(option.toLowerCase());
            sectionOrConditions.push({
              $or: [
                { brand: { $regex: val, $options: "i" } },
                { name: { $regex: val, $options: "i" } }
              ]
            });
          }
          else if (lowerSection === "freshness") {
            const val = escapeRegex(option.toLowerCase());
            sectionOrConditions.push({
              $or: [
                { name: { $regex: val, $options: "i" } },
                { description: { $regex: val, $options: "i" } },
                { tags: { $regex: val, $options: "i" } }
              ]
            });
          }
          else if (lowerSection === "cuts") {
            const val = escapeRegex(option.toLowerCase());
            sectionOrConditions.push({
              $or: [
                { name: { $regex: val, $options: "i" } },
                { description: { $regex: val, $options: "i" } }
              ]
            });
          }
        });

        if (sectionOrConditions.length > 0) {
          andConditions.push({ $or: sectionOrConditions });
        }
      });
    } catch (e) {
      console.error("Error parsing filters:", e);
    }
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  return filter;
};

/**
 * Builds the MongoDB sort condition
 * @param {Object} query - The req.query object
 * @returns {Object} MongoDB sort object, or null if no explicit sort
 */
const buildProductSort = (query) => {
  const sortBy = query.sortBy || "";

  if (sortBy === "price-asc") {
    return { price: 1 };
  } else if (sortBy === "price-desc") {
    return { price: -1 };
  } else if (sortBy === "discount") {
    return { _computedDiscount: -1 }; // Handled by executor
  }

  return null;
};

module.exports = {
  buildProductFilters,
  buildProductSort
};
