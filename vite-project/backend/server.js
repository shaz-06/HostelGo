require("./firebase");

const express = require("express");
const mongoose = require("mongoose");
const mongoSanitize = require("./middleware/mongoSanitize");
const xss = require("./middleware/xssClean");
const cors = require("cors");

const path = require("path");
const compression = require("compression");
const helmet = require("helmet");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Validate required environment variables on startup
const requiredEnvVars = ["JWT_SECRET", "SECRET_KEY", "MONGODB_URI", "RAZORPAY_KEY_SECRET", "MSG91_AUTH_KEY"];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`❌ CRITICAL STARTUP FAILURE: Required environment variables are missing: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

const Product = require("./models/Product");
const User = require("./models/User");
const Order = require("./models/Order");
const Config = require("./models/Config");
const DeliverySettings = require("./models/DeliverySettings");
const Category = require("./models/Category");
const GiftCard = require("./models/GiftCard");
const bcrypt = require("bcrypt");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const riderRoutes = require("./routes/riderRoutes");
const supportRoutes = require("./routes/supportRoutes");
const buyCoinRoutes = require("./routes/buyCoinRoutes");
const addressRoutes = require("./routes/addressRoutes");
const addressShareRoutes = require("./routes/addressShareRoutes");
const addressRequestRoutes = require("./routes/addressRequestRoutes");
const saveForLaterRoutes = require("./routes/saveForLaterRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const configRoutes = require("./routes/configRoutes");
const cron = require("node-cron");
const { sendCartReminder } = require("./services/notificationService");
const userRoutes = require("./routes/userRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const adminMiddleware = require("./middleware/adminMiddleware");
const {
  globalLimiter,
  authLimiter,
  otpLimiter,
  adminLimiter,
  catalogLimiter
} = require("./middleware/rateLimiter");

const app = express();

// Trust reverse proxy (e.g. Render, AWS Load Balancer) to properly parse X-Forwarded-* headers
app.set("trust proxy", true);

global.isShuttingDown = false;

// Reject any incoming requests with 503 if server is shutting down
app.use((req, res, next) => {
  if (global.isShuttingDown) {
    res.setHeader("Connection", "close");
    return res.status(503).json({
      success: false,
      message: "Server is restarting. Please try again in a few moments."
    });
  }
  next();
});

// Request Tracing (Request ID) Middleware
app.use((req, res, next) => {
  const crypto = require("crypto");
  req.id = "REQ-" + crypto.randomBytes(3).toString("hex").toUpperCase();
  res.setHeader("X-Request-ID", req.id);

  // Safely inject requestId and success: false to all error JSON responses
  const originalJson = res.json;
  res.json = function (body) {
    if (res.statusCode >= 400 && body && typeof body === "object" && !Array.isArray(body)) {
      body.requestId = req.id;
      if (body.success === undefined) {
        body.success = false;
      }
    }
    return originalJson.call(this, body);
  };

  next();
});

// Performance Profiler Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { logRequestPerformance } = require("./utils/auditLogger");
    logRequestPerformance(req, res, duration);
  });
  next();
});

// 301 Redirect from non-www to www, and enforce HTTPS in production
app.use((req, res, next) => {
  const canonicalHost = "www.buyto.co.in";

  // Use Express proxy-aware request APIs
  const hostname = req.hostname.toLowerCase();
  const protocol = req.protocol.toLowerCase();

  // Match production domains only
  const isTargetDomain = hostname === "buyto.co.in" || hostname === "www.buyto.co.in";

  if (isTargetDomain) {
    const needsWww = hostname === "buyto.co.in";
    const needsHttps = protocol === "http";

    if (needsWww || needsHttps) {
      const redirectUrl = `https://${canonicalHost}${req.originalUrl}`;

      // Temporary debug logging around redirect decisions
      if (process.env.DEBUG_REDIRECTS === "true" || process.env.NODE_ENV !== "production") {
        console.log(`[Redirect Debug] Incoming: ${protocol}://${req.get("host")}${req.originalUrl} | Hostname: ${hostname} | protocol: ${protocol} | redirecting to -> ${redirectUrl} | Reason: needsWww=${needsWww}, needsHttps=${needsHttps}`);
      }

      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      return res.redirect(301, redirectUrl);
    }
  }

  next();
});

const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
  connectSrc: ["'self'", "https://api.razorpay.com"],
  frameSrc: ["'self'", "https://api.razorpay.com"],
  objectSrc: ["'none'"],
  upgradeInsecureRequests: [],
};

// Allow extension via env variables
if (process.env.CSP_CONNECT_SRC) {
  cspDirectives.connectSrc.push(...process.env.CSP_CONNECT_SRC.split(","));
}
if (process.env.CSP_IMG_SRC) {
  cspDirectives.imgSrc.push(...process.env.CSP_IMG_SRC.split(","));
}
if (process.env.CSP_SCRIPT_SRC) {
  cspDirectives.scriptSrc.push(...process.env.CSP_SCRIPT_SRC.split(","));
}

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: cspDirectives
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin"
  },
  xContentTypeOptions: true,
  xFrameOptions: {
    action: "deny"
  },
  crossOriginResourcePolicy: {
    policy: "same-site"
  }
}));
app.use(compression());
app.use(cors());
app.use(express.json());

// Prevent NoSQL injection attacks by sanitizing body, query, and params
app.use(mongoSanitize);

// Prevent cross-site scripting (XSS) attacks by sanitizing body, query, and params
app.use(xss());

// Apply rate limiters
app.use("/api", globalLimiter);
app.use("/api/products", catalogLimiter);
app.use("/api/categories", catalogLimiter);
app.use("/api/search", catalogLimiter);
app.use("/api/banners", catalogLimiter);
app.use("/api/promotions", catalogLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/send-otp", otpLimiter);
app.use("/api/auth/verify-otp", otpLimiter);
app.use("/api/admin/login", adminLimiter);



// In-memory fallback data for development if MongoDB Atlas is unreachable
const mockProducts = require("./seed");

console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);

let isConnected = false;

if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log("✅ MongoDB Connected");
      console.log("Database: buyto");
      isConnected = true;

      // Auto-seed default Admin account if missing or incorrect
      try {
        let admin = await User.findOne({ email: "admin@buyto.com" });
        if (!admin) {
          console.log("Creating default administrator account...");
          admin = new User({
            name: "Buyto Admin",
            email: "admin@buyto.com",
            phone: "9999999999",
            password: "Admin123", // Hashes in pre-save hook
            role: "admin"
          });
          await admin.save();
          console.log("=== ADMIN SEED CHECK ===");
          console.log("Admin created successfully");
          console.log("Document:", JSON.stringify(admin, null, 2));
        } else {
          const isPasswordMatch = await admin.comparePassword("Admin123");
          if (!isPasswordMatch || admin.role !== "admin" || admin.phone !== "9999999999") {
            console.log("Admin exists but has outdated/invalid password, role, or phone. Repairing admin account...");
            admin.password = "Admin123";
            admin.role = "admin";
            admin.phone = "9999999999";
            await admin.save();
            console.log("=== ADMIN SEED CHECK ===");
            console.log("Admin created successfully");
            console.log("Document:", JSON.stringify(admin, null, 2));
          } else {
            console.log("=== ADMIN SEED CHECK ===");
            console.log("Admin exists");
            console.log("Document:", JSON.stringify(admin, null, 2));
          }
        }
      } catch (seedErr) {
        console.error("❌ Mongoose: Failed to seed default admin:", seedErr.message);
      }

      // Auto-seed default dynamic fees configuration if missing
      try {
        let feeConfig = await Config.findOne({ key: "fees_config" });
        if (!feeConfig) {
          console.log("Creating default dynamic fees config...");
          feeConfig = new Config({
            key: "fees_config",
            handlingFee: 4,
            smallCartThreshold: 150,
            smallCartFee: 15,
            deliveryFee: 29,
            freeDeliveryThreshold: 99,
            rainFee: 0,
            lateNightFee: 0,
            gstPercentage: 5,
            gstFixedCharges: 2,
            codConvenienceFee: 14,
            codConvenienceFeeEnabled: true
          });
          await feeConfig.save();
          console.log("=== FEE CONFIG SEED SUCCESS ===");
          console.log("Config document:", JSON.stringify(feeConfig, null, 2));
        } else {
          console.log("=== FEE CONFIG SEED CHECK ===");
          console.log("Config exists");
          console.log("Config document:", JSON.stringify(feeConfig, null, 2));
        }
      } catch (configSeedErr) {
        console.error("❌ Mongoose: Failed to seed dynamic fees config:", configSeedErr.message);
      }

      // Auto-seed default delivery settings if missing
      try {
        let deliverySettings = await DeliverySettings.findOne({ key: "delivery_settings" });
        if (!deliverySettings) {
          console.log("Creating default delivery settings...");
          deliverySettings = new DeliverySettings({
            key: "delivery_settings",
            lateNightDeliveryEnabled: false,
            rainyDeliveryEnabled: false
          });
          await deliverySettings.save();
          console.log("=== DELIVERY SETTINGS SEED SUCCESS ===");
          console.log("Settings document:", JSON.stringify(deliverySettings, null, 2));
        } else {
          console.log("=== DELIVERY SETTINGS SEED CHECK ===");
          console.log("Settings exists");
          console.log("Settings document:", JSON.stringify(deliverySettings, null, 2));
        }
      } catch (deliverySeedErr) {
        console.error("❌ Mongoose: Failed to seed delivery settings config:", deliverySeedErr.message);
      }

      // Auto-seed Categories if missing
      try {
        const defaultCategories = [
          { name: "All", icon: "🍎", image: "https://img.icons8.com/?size=100&id=AIuc7Bz9E3LA&format=png&color=000000", priority: 10 },
          { name: "Electronics", icon: "🎧", image: "https://img.icons8.com/?size=100&id=8ftcmh3OgI9D&format=png&color=000000", priority: 9 },
          { name: "Beauty", icon: "💄", image: "/images/cosmetics.png", priority: 8 },
          { name: "Pharmacy", icon: "🥩", image: "https://img.icons8.com/?size=100&id=14RbGHKRk5fv&format=png&color=000000", priority: 7 },
          { name: "Kids", icon: "🍿", image: "https://img.icons8.com/?size=100&id=gXvvFM28Mjvd&format=png&color=000000", priority: 6 },
          { name: "Gift", icon: "🥤", image: "https://img.icons8.com/?size=100&id=_fo_sHSTUNz-&format=png&color=000000", priority: 5 },
        ];

        let categoryCount = await Category.countDocuments();
        if (categoryCount === 0) {
          console.log("Creating default category list...");
          // Also check existing products for other categories not in default list
          const products = await Product.find({}, "category").lean();
          const existingCatNames = new Set(products.map(p => p.category).filter(Boolean));
          const defaultCatNames = new Set(defaultCategories.map(c => c.name));

          for (const catName of existingCatNames) {
            if (!defaultCatNames.has(catName)) {
              defaultCategories.push({
                name: catName,
                icon: "🛍️",
                image: "",
                priority: -2
              });
            }
          }

          await Category.insertMany(defaultCategories);
          console.log("=== CATEGORY SEED SUCCESS ===");
        } else {
          console.log("=== CATEGORY SEED CHECK ===");
          console.log("Categories exist count:", categoryCount);
          for (const cat of defaultCategories) {
            await Category.updateOne(
              { name: cat.name },
              { $set: { image: cat.image, icon: cat.icon, priority: cat.priority } }
            );
          }
          console.log("=== CATEGORY SYNC SUCCESS ===");
        }
      } catch (catSeedErr) {
        console.error("❌ Mongoose: Failed to seed categories:", catSeedErr.message);
      }

      // Seeding Gift Cards for testing
      try {
        const giftCardCount = await GiftCard.countDocuments();
        if (giftCardCount === 0) {
          console.log("Seeding test gift cards...");
          const saltRounds = 10;
          const cardsToSeed = [
            {
              code: "9999888899998888",
              pinHash: await bcrypt.hash("123456", saltRounds),
              amount: 500,
              status: "ACTIVE",
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            },
            {
              code: "1111222233334444",
              pinHash: await bcrypt.hash("111111", saltRounds),
              amount: 1000,
              status: "REDEEMED",
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            {
              code: "5555666677778888",
              pinHash: await bcrypt.hash("222222", saltRounds),
              amount: 250,
              status: "EXPIRED",
              expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // expired yesterday
            }
          ];
          await GiftCard.insertMany(cardsToSeed);
          console.log("=== GIFT CARD SEED SUCCESS ===");
        } else {
          console.log("=== GIFT CARD SEED CHECK ===");
          console.log("Gift cards exist count:", giftCardCount);
        }
      } catch (gcSeedErr) {
        console.error("❌ Mongoose: Failed to seed gift cards:", gcSeedErr.message);
      }
    })
    .catch((err) => {
      console.error("❌ MongoDB Connection Failed:", err);

      if (process.env.NODE_ENV === "production") {
        process.exit(1);
      } else {
        console.warn(
          "⚠️ MongoDB unavailable. Using in-memory fallback in development."
        );
        isConnected = false;
      }
    });
} else {
  console.error("❌ MONGODB_URI environment variable is missing.");

  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  } else {
    console.warn(
      "⚠️ No MongoDB URI configured. Using in-memory fallback in development."
    );
  }
}

app.get("/", (req, res) => {
  res.send("API Running");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get("/debug-ping", (req, res) => {
  res.json({
    success: true,
    message: "ping ok",
    time: new Date()
  });
});

const { applyPricingRulesToProducts, calculateSellingPrice } = require("./services/pricingEngine");
const pricingRuleRoutes = require("./routes/pricingRuleRoutes");

app.use("/api/pricing-rules", pricingRuleRoutes);
app.use("/api", paymentRoutes);
app.use("/api/users", userRoutes);
app.put("/api/profile", require("./middleware/authMiddleware"), (req, res, next) => {
  req.url = "/profile";
  userRoutes(req, res, next);
});

app.get("/api/subcategories", async (req, res) => {
  try {
    const categoryName = (req.query.category || "").toString().trim();
    if (!categoryName) {
      return res.status(400).json({ success: false, message: "Category query parameter is required" });
    }

    if (isConnected) {
      const catRegex = new RegExp("^" + categoryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i");
      const rawSubcategories = await Product.distinct("subCategory", {
        category: catRegex,
        subCategory: { $exists: true, $nin: ["", null, "undefined"] }
      });

      const seen = new Set();
      const normalized = [];
      for (const sub of rawSubcategories) {
        const trimmed = sub.trim();
        if (!trimmed) continue;
        const lower = trimmed.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          normalized.push(trimmed);
        }
      }

      res.json({
        success: true,
        category: categoryName,
        subcategories: normalized
      });
    } else {
      res.json({
        success: true,
        category: categoryName,
        subcategories: []
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const searchQuery = (req.query.search || req.query.q || req.query.query || "").toString().trim();
    const categoryQuery = (req.query.category || "").toString().trim();
    const subCategoryQuery = (req.query.subCategory || req.query.sub || "").toString().trim();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 0;
    const skip = (page - 1) * limit;

    let products = [];
    if (isConnected) {
      const filter = {};

      if (searchQuery) {
        const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i");
        filter.$or = [
          { name: regex },
          { brand: regex },
          { category: regex },
          { subCategory: regex },
          { subcategory: regex },
          { tags: regex }
        ];
      }

      if (categoryQuery && categoryQuery !== "All") {
        filter.category = new RegExp("^" + categoryQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i");
      }

      if (subCategoryQuery && subCategoryQuery !== "Show All") {
        filter.subCategory = new RegExp("^" + subCategoryQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i");
      }

      if (limit > 0) {
        products = await Product.find(filter, "id name category subCategory brand price originalPrice weight image stock eta rating isAd variants tags").skip(skip).limit(limit).lean();
      } else {
        products = await Product.find(filter, "id name category subCategory brand price originalPrice weight image stock eta rating isAd variants tags").lean();
      }

      // Merge fallback mock products only if MongoDB returned no results (unseeded or empty database)
      if (products.length === 0 && !searchQuery && !categoryQuery) {
        const productIds = new Set(products.map((product) => product.id || String(product._id)));
        let missingFallbackProducts = mockProducts.filter((product) => !productIds.has(product.id));
        if (limit > 0) {
          missingFallbackProducts = missingFallbackProducts.slice(skip, skip + limit);
        }
        products = [...products, ...missingFallbackProducts];
      }
    } else {
      console.log("ℹ️ Serving local in-memory products (database offline/unreachable)");
      products = mockProducts;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        products = products.filter(p =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
          (Array.isArray(p.tags) && p.tags.some(t => t && t.toLowerCase().includes(q)))
        );
      }
      if (categoryQuery && categoryQuery !== "All") {
        const cat = categoryQuery.toLowerCase();
        products = products.filter(p => p.category && p.category.toLowerCase().includes(cat));
      }
      if (limit > 0) {
        products = products.slice(skip, skip + limit);
      }
    }

    // Calculate dynamic selling price using active pricing rules
    const dynamicallyPriced = await applyPricingRulesToProducts(products);
    res.json(dynamicallyPriced);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error"
    });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;
    if (isConnected) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        product = await Product.findById(id).lean();
      }
      if (!product) {
        product = await Product.findOne({ id }).lean();
      }
    }
    if (!product) {
      product = mockProducts.find(p => String(p._id || p.id) === String(id));
    }
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const priceCalc = await calculateSellingPrice(product);
    if (priceCalc.isFestivalPrice) {
      product.originalPrice = priceCalc.originalBasePrice;
      product.price = priceCalc.finalPrice;
      product.isFestivalPrice = true;
      product.pricingBadge = priceCalc.badgeText;
      product.pricingRule = priceCalc.activeRule;
      product.adjustmentAmount = priceCalc.adjustmentAmount;
    }
    res.json({ success: true, product });
  } catch (error) {
    console.error("Error fetching single product:", error);
    res.status(500).json({ message: "Server error fetching product" });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    if (isConnected) {
      const categories = await Category.find().lean();
      res.json(categories);
    } else {
      // Fallback for offline mode
      const defaultCategories = [
        { name: "The Fruit Store", icon: "🍎", image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&auto=format&fit=crop&q=80", priority: 10, showInHeader: true },
        { name: "The Veggie Store", icon: "🥬", image: "https://images.unsplash.com/photo-1566385278603-605b637d384c?w=200&auto=format&fit=crop&q=80", priority: 9, showInHeader: true },
        { name: "Dairy, Bread & Eggs", icon: "🥛", image: "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=200&auto=format&fit=crop&q=80", priority: 8, showInHeader: true },
        { name: "Meat and Seafood", icon: "🥩", image: "https://images.unsplash.com/photo-1532407191490-e847be1540c6?w=200&auto=format&fit=crop&q=80", priority: 7, showInHeader: true },
        { name: "Snacks", icon: "🍿", image: "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=200&auto=format&fit=crop&q=80", priority: 6, showInHeader: true },
        { name: "Beverages", icon: "🥤", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&auto=format&fit=crop&q=80", priority: 5, showInHeader: true },
        { name: "Atta, Rice and Dal", icon: "🌾", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&auto=format&fit=crop&q=80", priority: 4, showInHeader: true },
        { name: "Exclusive Deals", icon: "🔥", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80", priority: 3, showInHeader: true },
        { name: "Cleaners & Repellents", icon: "🧹", image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=200&auto=format&fit=crop&q=80", priority: 2, showInHeader: true },
        { name: "The Bread Store", icon: "🍞", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80", priority: 1, showInHeader: true },
        { name: "Premium Pickles", icon: "🥒", image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&auto=format&fit=crop&q=80", priority: 0, showInHeader: true },
        { name: "Sexual Wellness", icon: "❤️", image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=200&auto=format&fit=crop&q=80", priority: -1, showInHeader: true }
      ];
      res.json(defaultCategories);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

const PORT = 8000;

// Setup HTTP server defensively to support Socket.IO if installed
const http = require("http");
const server = http.createServer(app);

let io = null;
const associatePresence = new Map();

const getAssociateSnapshot = () => {
  const associates = Array.from(associatePresence.values());
  const availableAssociates = associates.filter((associate) => (
    associate.connected &&
    associate.inSupportPanel &&
    ["online", "waiting"].includes(associate.state)
  ));

  return {
    associates,
    availableCount: availableAssociates.length,
    hasAvailableAssociate: availableAssociates.length > 0
  };
};

try {
  const socketIo = require("socket.io");
  io = new socketIo.Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  global.io = io;

  const trackingService = require("./services/trackingService");
  trackingService.setSocketIO(io);

  io.on("connection", (socket) => {
    console.log("🔌 Socket.IO client connected:", socket.id);

    socket.on("registerUser", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`🔌 Socket.IO client ${socket.id} joined user_${userId}`);
    });

    socket.on("joinAddressRequestRoom", (requestId) => {
      socket.join(`address-request-${requestId}`);
      console.log(`🔌 Socket.IO client ${socket.id} joined address-request-${requestId}`);
    });

    socket.on("joinOrderRoom", async (data) => {
      const orderIdVal = typeof data === "object" ? data.orderId : data;
      const clientToken = typeof data === "object" ? data.token : null;

      let isAuthorized = false;
      const Order = require("./models/Order");
      const User = require("./models/User");
      const jwt = require("jsonwebtoken");

      try {
        if (!clientToken) {
          console.warn(`[SocketAuth] Missing token for joinOrderRoom on order: ${orderIdVal}`);
        } else {
          const decoded = jwt.verify(clientToken, process.env.JWT_SECRET || "buyto_super_secret_key");
          const user = await User.findById(decoded.id);
          if (user) {
            if (user.role === "admin") {
              isAuthorized = true;
            } else {
              const order = await Order.findOne({ orderId: orderIdVal });
              if (order && (String(order.userId) === String(user._id) || order.user?.phone === user.phone)) {
                isAuthorized = true;
              }
            }
          }
        }
      } catch (err) {
        console.error(`[SocketAuth] Error authorizing joinOrderRoom for order ${orderIdVal}:`, err.message);
      }

      if (!isAuthorized) {
        console.warn(`[SocketAuth] Rejecting unauthorized socket room join for order: ${orderIdVal}`);
        return;
      }

      const room1 = `order:${orderIdVal}`;
      const room2 = `order_${orderIdVal}`;
      socket.join(orderIdVal);
      socket.join(room1);
      socket.join(room2);
      console.log(`Customer joined room: order_${orderIdVal}`);
      console.log(`🔌 Socket client joined rooms: ${orderIdVal}, ${room1}, and ${room2}`);

      // Sync latest order state on join / reconnect
      try {
        const statePayload = await trackingService.getTrackingState(orderIdVal);
        if (statePayload && statePayload.order) {
          const currentVersion = statePayload.order.trackingVersion || 1;
          trackingService.emitStatusUpdated(String(orderIdVal), statePayload.order, currentVersion);
          if (statePayload.order.orderStatus !== "Order Placed" && statePayload.order.orderStatus !== "Packed") {
            trackingService.emitRiderAssigned(String(orderIdVal), currentVersion);
          }
        }
      } catch (err) {
        console.error(`[Socket server] Error sending initial snapshot on joinOrderRoom:`, err);
      }
    });

    socket.on("updateRiderLocation", async (data) => {
      const { orderId, latitude, longitude } = data;
      console.log("=== SOCKET LOCATION EVENT ===");
      console.log(`Order: ${orderId}, Rider Lat: ${latitude}, Lng: ${longitude}`);

      // Emit update to order room
      io.to(orderId).emit("riderLocationUpdated", { latitude, longitude });

      try {
        const order = await Order.findById(orderId);
        if (order && order.riderId) {
          await User.findByIdAndUpdate(order.riderId, {
            latitude,
            longitude,
            currentLocation: {
              lat: latitude,
              lng: longitude,
              address: "In Transit"
            }
          });
          console.log(`=== RIDER GPS UPDATE ===\nRider ID: ${order.riderId}, Lat: ${latitude}, Lng: ${longitude}`);
        }
      } catch (dbErr) {
        console.error("Failed to update rider location in DB on Socket event:", dbErr.message);
      }
    });

    // CUSTOMER SUPPORT CHAT EVENTS
    socket.on("joinSupportRoom", (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(`🔌 Socket client joined support room: chat_${chatId}`);
    });

    socket.on("supportTyping", (data) => {
      const { chatId, isTyping, senderName, role } = data;
      socket.to(`chat_${chatId}`).emit("supportTypingUpdated", { isTyping, senderName, role });
    });

    socket.on("supportTypingPreview", (data) => {
      const { chatId, text, senderName } = data;
      socket.to(`chat_${chatId}`).emit("supportTypingPreviewUpdated", { text, senderName });
    });

    socket.on("adminSupportPresence", (data = {}) => {
      const adminId = data.adminId || socket.id;
      const existing = associatePresence.get(adminId) || {};
      const nextPresence = {
        adminId,
        socketId: socket.id,
        name: data.name || existing.name || "Associate",
        connected: true,
        inSupportPanel: data.inSupportPanel !== false,
        state: data.state || existing.state || "online",
        updatedAt: new Date().toISOString()
      };

      associatePresence.set(adminId, nextPresence);
      socket.data.adminId = adminId;
      socket.join("support_admins");
      io.emit("associateAvailabilityChanged", getAssociateSnapshot());
    });

    socket.on("disconnect", () => {
      if (socket.data.adminId && associatePresence.has(socket.data.adminId)) {
        const previous = associatePresence.get(socket.data.adminId);
        associatePresence.set(socket.data.adminId, {
          ...previous,
          connected: false,
          inSupportPanel: false,
          state: "offline",
          updatedAt: new Date().toISOString()
        });
        io.emit("associateAvailabilityChanged", getAssociateSnapshot());
      }
      console.log("🔌 Socket.IO client disconnected:", socket.id);
    });
  });

  // Attach io to request globally so endpoints can emit updates
  app.set("io", io);
  app.set("associatePresence", associatePresence);
  app.set("getAssociateSnapshot", getAssociateSnapshot);
  app.use((req, res, next) => {
    req.io = io;
    req.associatePresence = associatePresence;
    req.getAssociateSnapshot = getAssociateSnapshot;
    next();
  });

  console.log("🔌 Socket.IO initialized successfully and attached to Express.");
} catch {
  console.log("ℹ️ Socket.IO package not installed. Skipping socket server initialization.");
}
app.use("/api/upload", uploadRoutes);
app.use("/api", paymentRoutes);
app.use("/api", supportRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/rider", riderRoutes);
app.use("/api/admin", authMiddleware, adminMiddleware, adminRoutes);
app.use("/api/buycoins", buyCoinRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/config", configRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/address-share", addressShareRoutes);
app.use("/api/address-request", addressRequestRoutes);
app.use("/api/save-for-later", saveForLaterRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", userRoutes);

// Initialize Refer & Earn EventBus subscriptions
const EventBus = require("./services/EventBus");
const referralService = require("./services/referralService");
EventBus.subscribe("order.delivered", async (payload) => {
  console.log(`[EventBus] Processing order.delivered event for Order: ${payload.orderId}, User: ${payload.userId}`);
  await referralService.processOrderDelivery(payload);
});
EventBus.subscribe("order.cancelled", async (payload) => {
  console.log(`[EventBus] Processing order.cancelled event for Order: ${payload.orderId}`);
  await referralService.processOrderCancellation(payload);
});


// Global Error Handler (Production Error Shield)
app.use((err, req, res, next) => {
  const crypto = require("crypto");
  const { logErrorEvent } = require("./utils/auditLogger");

  const status = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  // Separate Operational Errors from Programming Errors
  const isOperational = status >= 400 && status < 500;

  if (isOperational) {
    let message = err.message || "An error occurred.";
    if (isProduction) {
      if (status === 400) message = "Invalid request.";
      else if (status === 401) message = "Authentication failed.";
      else if (status === 403) message = "Access denied.";
      else if (status === 404) message = "Resource not found.";
      else if (status === 429) message = "Too many requests. Please try again later.";
    }

    return res.status(status).json({
      success: false,
      message,
      requestId: req.id
    });
  }

  // Programming Errors (Unexpected / 500)
  const errorId = "ERR-" + crypto.randomBytes(3).toString("hex").toUpperCase();
  logErrorEvent(err, req, errorId, status);

  return res.status(status).json({
    success: false,
    message: isProduction ? "Something went wrong. Please try again later." : err.message,
    requestId: req.id,
    errorId,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server Started and running on port ${PORT} bound to all interfaces`);

  // Start active tracking sessions recovery and completion cron
  try {
    const trackingService = require("./services/trackingService");
    trackingService.resumeActiveSessions();
    trackingService.initTrackingCron();
  } catch (err) {
    console.error("Failed to start tracking service:", err);
  }

  // Start the background outbox reconciler for admin notifications
  try {
    const { startReconciler } = require("./services/notificationReconciler");
    startReconciler();
  } catch (err) {
    console.error("Failed to start outbox reconciler:", err);
  }

  // One-time Wallet Recalculation repair migration for all users
  setTimeout(async () => {
    try {
      console.log("🛠️ Running one-time Wallet Recalculation repair migration for all users...");
      const WalletService = require("./services/WalletService");
      const users = await User.find({}, "_id email");
      let count = 0;
      for (const u of users) {
        await WalletService.recalculate(u._id, u.email);
        count++;
      }
      console.log(`✅ Completed Wallet Recalculation repair. Patched ${count} users.`);
    } catch (err) {
      console.error("❌ Failed to run wallet repair migration:", err);
    }
  }, 5000);

  // Schedule cart reminder check every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("[Cron] Running 1-hour cart inactivity checker...");
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const inactiveUsers = await User.find({
        cartHasItems: true,
        cartReminderSent: false,
        cartActivityAt: { $lte: oneHourAgo }
      });

      console.log(`[Cron] Found ${inactiveUsers.length} inactive carts to remind.`);
      for (const user of inactiveUsers) {
        await sendCartReminder(user);
        user.cartReminderSent = true;
        await user.save();
        console.log(`[Cron] Sent cart reminder and marked sent for user: ${user.email}`);
      }
    } catch (err) {
      console.error("[Cron Error] Cart reminder scheduler failed:", err.message);
    }
  });

  // Schedule address share request expiry check every hour
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("[Cron] Running Address Share request expiry job...");
      const AddressShare = require("./models/AddressShare");
      const result = await AddressShare.updateMany(
        { status: "pending", expiresAt: { $lte: new Date() } },
        { status: "expired" }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Cron] Expired ${result.modifiedCount} pending address share requests.`);
      }
    } catch (err) {
      console.error("[Cron Error] Address share expiry job failed:", err.message);
    }
  });

  // Schedule AddressRequest expiry and retention cleanup daily at midnight
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("[Cron] Running AddressRequest expiry and retention cleanup job...");
      const AddressRequest = require("./models/AddressRequest");
      
      // 1. Mark expired requests
      const expireResult = await AddressRequest.updateMany(
        { status: "pending", expiresAt: { $lte: new Date() } },
        { status: "expired" }
      );
      if (expireResult.modifiedCount > 0) {
        console.log(`[Cron] Lazy expired ${expireResult.modifiedCount} AddressRequests.`);
      }

      // 2. Retention policy cleanups
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const deleteCompleted = await AddressRequest.deleteMany({
        status: "completed",
        updatedAt: { $lte: thirtyDaysAgo }
      });
      const deleteCancelled = await AddressRequest.deleteMany({
        status: "cancelled",
        updatedAt: { $lte: thirtyDaysAgo }
      });
      const deleteExpired = await AddressRequest.deleteMany({
        status: "expired",
        updatedAt: { $lte: sevenDaysAgo }
      });

      console.log(`[Cron] AddressRequest retention cleanup: Deleted ${deleteCompleted.deletedCount} completed, ${deleteCancelled.deletedCount} cancelled, ${deleteExpired.deletedCount} expired requests.`);
    } catch (err) {
      console.error("[Cron Error] AddressRequest cleanup job failed:", err.message);
    }
  });

  // Schedule Referral Expiry & Retry cleanup daily at midnight
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("[Cron] Running Referral Expiry & retry cleanup job...");
      const referralService = require("./services/referralService");
      await referralService.runDailyCleanup();
    } catch (err) {
      console.error("[Cron Error] Daily referral cleanup failed:", err.message);
    }
  });

  // Borzo integration startup check
  const clientId = process.env.BORZO_CLIENT_ID;
  const apiToken = process.env.BORZO_API_TOKEN;
  const isTokenMock = !apiToken || apiToken === "mock_borzo_api_token_here" || apiToken.includes("[use token");
  const isEnabled = !!(clientId && apiToken && !isTokenMock);

  const maskedToken = apiToken && apiToken.length > 8
    ? `${apiToken.slice(0, 4)}...${apiToken.slice(-4)}`
    : "Not Configured/Invalid";

  console.log("\n=== [BORZO STARTUP AUDIT] ===");
  console.log("Borzo Enabled:", isEnabled);
  console.log("Client ID loaded:", clientId || "Not Configured");
  console.log("Token loaded:", maskedToken);
  console.log("==============================\n");
});

// Graceful Shutdown & Process Lifecycle Management
const { logShutdownEvent, logFatalProcessError } = require("./utils/auditLogger");

const shutdown = async (signal, exitCode) => {
  if (global.isShuttingDown) {
    logShutdownEvent("WARN", `Shutdown already in progress. Ignoring duplicate signal: ${signal}`);
    return;
  }

  global.isShuttingDown = true;
  logShutdownEvent("INFO", `Server shutting down via ${signal}...`);

  // Set timeout to force process exit if shutdown hangs
  const forceExitTimeout = setTimeout(() => {
    logShutdownEvent("WARN", "Graceful shutdown timed out. Forcing process exit.");
    process.exit(exitCode);
  }, 10000);

  // Unref the timer so it doesn't keep the process alive
  forceExitTimeout.unref();

  // 1. Stop accepting new HTTP requests
  if (server) {
    logShutdownEvent("INFO", "Closing HTTP server...");
    await new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          logShutdownEvent("ERROR", `Error closing HTTP server: ${err.message}`);
        } else {
          logShutdownEvent("INFO", "HTTP server closed.");
        }
        resolve();
      });
    });
  }

  // 2. Close Socket.IO server cleanly if active
  if (io) {
    logShutdownEvent("INFO", "Closing Socket.IO...");
    try {
      io.close();
      logShutdownEvent("INFO", "Socket.IO closed.");
    } catch (err) {
      logShutdownEvent("ERROR", `Error closing Socket.IO: ${err.message}`);
    }
  }

  // 3. Close Mongoose / MongoDB connections cleanly
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    logShutdownEvent("INFO", "Closing MongoDB connection...");
    try {
      await mongoose.disconnect();
      logShutdownEvent("INFO", "MongoDB connection closed.");
    } catch (err) {
      logShutdownEvent("ERROR", `Error closing MongoDB connection: ${err.message}`);
    }
  }

  logShutdownEvent("INFO", "Graceful shutdown completed.");

  // Flush stdout/stderr streams before exiting
  process.stdout.write("", () => {
    process.stderr.write("", () => {
      clearTimeout(forceExitTimeout);
      process.exit(exitCode);
    });
  });
};

// Handle OS signals
process.on("SIGINT", () => shutdown("SIGINT", 0));
process.on("SIGTERM", () => shutdown("SIGTERM", 0));

// Handle fatal runtime process errors
process.on("uncaughtException", (err) => {
  const crypto = require("crypto");
  const errorId = "ERR-" + crypto.randomBytes(3).toString("hex").toUpperCase();

  // Log fatal unhandled exception
  logFatalProcessError(err, errorId);

  // Begin graceful shutdown and exit with code 1
  shutdown(`uncaughtException (${errorId})`, 1);
});

process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  const crypto = require("crypto");
  const errorId = "ERR-" + crypto.randomBytes(3).toString("hex").toUpperCase();

  // Log unhandled promise rejection
  logFatalProcessError(err, errorId);

  // Begin graceful shutdown and exit with code 1
  shutdown(`unhandledRejection (${errorId})`, 1);
});