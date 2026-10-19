const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const { applyPricingRulesToProducts } = require("../services/pricingEngine");
const { buildProductFilters, buildProductSort } = require("../utils/productQueryBuilder");
const cacheService = require("../utils/cacheService");

const getBestsellers = async () => {
  const bestsellerMappings = [
    { name: "Vegetables & Fruits", categories: ["The Veggie Store", "The Fruit Store"], slug: "fresh-vegetables" },
    { name: "Chips & Namkeen", categories: ["Chips and Namkeens"], slug: "chips-and-namkeens" },
    { name: "Dairy, Bread & Eggs", categories: ["Dairy, Bread & Eggs"], slug: "dairy-bread-and-eggs" },
    { name: "Oil, Ghee & Masala", categories: ["Oils and Ghee", "Masalas"], slug: "oils-and-ghee" },
    { name: "Drinks & Juices", categories: ["Cold Drinks and Juices", "Beverages"], slug: "cold-drinks-and-juices" },
    { name: "Ice Creams & More", categories: ["Ice Creams & Desserts", "Ice-Cream"], slug: "ice-creams-and-desserts" }
  ];

  const promises = bestsellerMappings.map(async (mapping) => {
    const [count, sampleProducts] = await Promise.all([
      Product.countDocuments({ category: { $in: mapping.categories } }),
      Product.find({ category: { $in: mapping.categories }, image: { $regex: /^https?:\/\//i } }, "image")
        .limit(4)
        .lean()
    ]);
    return {
      name: mapping.name,
      slug: mapping.slug,
      count,
      previewImages: sampleProducts.map(p => p.image)
    };
  });

  return Promise.all(promises);
};

const getInitialProducts = async (limit = 40) => {
  let pipeline = [];
  pipeline.push({ $limit: limit });
  pipeline.push({
    $project: {
      id: 1, name: 1, category: 1, subCategory: 1, brand: 1, price: 1,
      originalPrice: 1, weight: 1, image: 1, stock: 1, eta: 1,
      rating: 1, isAd: 1, variants: 1, tags: 1
    }
  });

  const products = await Product.aggregate(pipeline);
  return applyPricingRulesToProducts(products);
};

exports.getHomeData = async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    if (!isConnected) {
      return res.status(503).json({ success: false, message: "Database offline" });
    }

    const categoriesPromise = cacheService.fetchWithCache(
      "home:categories", 
      15 * 60, 
      () => Category.find().lean()
    );

    const bestsellersPromise = cacheService.fetchWithCache(
      "home:bestsellers",
      5 * 60,
      () => getBestsellers()
    );

    const [categoriesResult, bestsellersResult] = await Promise.allSettled([
      categoriesPromise,
      bestsellersPromise
    ]);

    if (categoriesResult.status === "rejected") {
      throw new Error("Critical data (categories) failed to load");
    }

    res.json({
      success: true,
      data: {
        categories: categoriesResult.value,
        bestsellers: bestsellersResult.status === "fulfilled" ? bestsellersResult.value : [],
        products: [] // We no longer send the giant generic product array!
      }
    });
  } catch (error) {
    console.error("Error in /api/home aggregation:", error);
    res.status(500).json({ success: false, message: "Server error fetching home data" });
  }
};

exports.getCategoryData = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const isConnected = mongoose.connection.readyState === 1;
    if (!isConnected) {
      return res.status(503).json({ success: false, message: "Database offline" });
    }

    const categoryQuery = req.query.category || slug; 

    // Extract other filter/sort params to pass to query builder (preserving existing logic)
    const filter = buildProductFilters(req.query);
    const sort = buildProductSort(req.query);

    // We no longer convert filter.category to a Regex here,
    // we will rely on the exact match provided by productQueryBuilder
    // or by resolving the canonical category name via Category.findOne

    // Deterministic query key
    const queryKeys = Object.keys(req.query).sort();
    const queryStr = queryKeys.map(k => `${k}=${req.query[k]}`).join('&');
    
    const metaCacheKey = `category:${slug}:meta:${categoryQuery}`;
    const metaPromise = cacheService.fetchWithCache(
      metaCacheKey,
      15 * 60,
      async () => {
        const { buildProductFilters } = require("../utils/productQueryBuilder");
        // Resolve all alias names for this category
        const resolvedNames = (() => {
          const CATEGORY_ALIASES = {
            "Makeups":          ["Makeups", "Makeup & Beauty", "Makeup and Beauty", "Skincare"],
            "Makeup & Beauty":  ["Makeup & Beauty", "Makeup and Beauty", "Makeups"],
            "Female Hygiene":   ["Female Hygiene", "Health and Pharma", "Feminine Hygiene"],
            "Feminine Hygiene": ["Feminine Hygiene", "Health and Pharma", "Female Hygiene"],
            "Bath and Body":    ["Bath and Body", "Bath & Body"],
            "Bath & Body":      ["Bath and Body", "Bath & Body"],
            "Health and Pharma":["Health and Pharma", "Pharmacy"],
            "Pharmacy":         ["Health and Pharma", "Pharmacy"],
          };
          const base = new Set([categoryQuery, categoryQuery.replace("&","and"), categoryQuery.replace("and","&")]);
          const aliased = CATEGORY_ALIASES[categoryQuery];
          if (aliased) aliased.forEach(a => base.add(a));
          return [...base];
        })();

        const [categoryInfo, subcategoriesResult] = await Promise.allSettled([
          Category.findOne({ $or: [{ slug }, { name: { $in: resolvedNames } }] }).lean(),
          Product.aggregate([
            { $match: { category: { $in: resolvedNames }, subCategory: { $nin: [null, "", undefined] } } },
            { $group: { _id: "$subCategory" } },
            { $project: { name: "$_id", _id: 0 } },
            { $sort: { name: 1 } }
          ])
        ]);
        return { categoryInfo, subcategoriesResult };
      }
    );

    const productCacheKey = `category_v2:${slug}:products:q:${queryStr}`;
    const productsPromise = cacheService.fetchWithCache(
      productCacheKey,
      5 * 60,
      async () => {
        const projection = "id name slug image price originalPrice stock variants weight brand category subCategory";

        let pPromise;

        if (sort && Object.keys(sort).length > 0) {
          pPromise = Product.find(filter).select(projection).sort(sort).skip(skip).limit(limit).lean();
        } else {
          pPromise = Product.find(filter).select(projection).skip(skip).limit(limit).lean();
        }

        const [countResult, productsResult] = await Promise.allSettled([
          Product.countDocuments(filter),
          pPromise
        ]);

        const products = productsResult.status === "fulfilled" ? await applyPricingRulesToProducts(productsResult.value) : [];
        const total = countResult.status === "fulfilled" ? countResult.value : 0;
        return { products, total };
      }
    );

    const [metaData, prodData] = await Promise.all([metaPromise, productsPromise]);

    res.json({
      success: true,
      data: {
        category: metaData.categoryInfo.status === "fulfilled" ? metaData.categoryInfo.value : null,
        subcategories: metaData.subcategoriesResult.status === "fulfilled" ? metaData.subcategoriesResult.value.map(s => s.name) : [],
        products: prodData.products,
        pagination: {
          page,
          limit,
          total: prodData.total,
          hasMore: skip + limit < prodData.total
        }
      }
    });
  } catch (error) {
    console.error(`Error in /api/category/${req.params.slug} aggregation:`, error);
    res.status(500).json({ success: false, message: "Server error fetching category data" });
  }
};
