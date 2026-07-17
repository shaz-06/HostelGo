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
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const riderRoutes = require("./routes/riderRoutes");
const supportRoutes = require("./routes/supportRoutes");
const buyCoinRoutes = require("./routes/buyCoinRoutes");
const addressRoutes = require("./routes/addressRoutes");
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
            gstFixedCharges: 2
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
        let categoryCount = await Category.countDocuments();
        if (categoryCount === 0) {
          console.log("Creating default category list...");
          const defaultCategories = [
            { name: "The Fruit Store", icon: "🍎", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243231/09a3ae13-6792-479b-a564-bf116f84b317_068761a9-938f-4c18-bb9e-8e190bf57a45_wucu2q.png", priority: 10 },
            { name: "The Veggie Store", icon: "🥬", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243224/323b2564-9fa9-43dd-9755-b5df299797d7_a7f60fc5-47fa-429d-9fd1-5f0644c0d4e3_qoyjgq.png", priority: 9 },
            { name: "Dairy, Bread & Eggs", icon: "🥛", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243236/ceb53190-72a3-466b-a892-8989615788c9_fe00456c-3b5a-4e74-80e2-c274a4c9f818_gxviej.png", priority: 8 },
            { name: "Meat and Seafood", icon: "🥩", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243317/9c48b537-eef1-4047-becb-ddb7e79c373d_72aac542-4cef-4cf9-a9dd-5f1b862165c1_dxk14f.png", priority: 7 },
            { name: "Snacks", icon: "🍿", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243360/b654b666-43b5-4599-9919-98f9c7a924e9_cf31e6c0-a70b-4415-b702-3a622d866898_mijtiv.png", priority: 6 },
            { name: "Beverages", icon: "🥤", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243351/5bec1f84-4aa5-49ae-9c3d-9a0dcb9fe2ad_d990b4fc-4629-4cc6-bc7a-ace787fb378a_uftkev.png", priority: 5 },
            { name: "Atta, Rice and Dal", icon: "🌾", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243324/c65894e4-5b70-4b9d-9d87-baba38e0ef6e_0cdf10e3-6c7c-4deb-9dbc-dcf24cd11fca_dxfezf.png", priority: 4 },
            { name: "Masalas", icon: "🔥", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243329/e67eb511-3e25-460d-88ff-ca465b971a2b_874d876f-7cf8-433f-a960-ab659b9ef4a7_m6pusm.png", priority: 3 },
            { name: "Oil & Ghee", icon: "🥃", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243336/3bb2b2b7-d74b-4a29-825a-e94c6e1d86d5_52ee9f70-9928-46ee-804d-2f536fe1155c_jktwxe.png", priority: 2 },
            { name: "Breakfast", icon: "🥣", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243343/fe86cf80-90b0-49ea-b982-32c0e0373463_06d3ea4c-76e4-4a8e-b6c9-1917092bc0e7_opxeqt.png", priority: 1 },
            { name: "Ice-Cream", icon: "🍦", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243355/5b0984b8-303b-4a80-81b7-9656f1950b67_63aaae7c-1add-4357-8ae1-5a9662d6b240_jnbnil.png", priority: 0 },
            { name: "Chocolates", icon: "🍫", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243365/405730cd-115c-4530-8f32-74e50c09f378_1dab5493-a168-4485-a66f-da4bc7510de3_sr2cdg.png", priority: -1 },
            { name: "Noodles & Pasta", icon: "🍜", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243370/6a51d704-b2cc-4787-aced-162fae80a0ce_042fb322-f6db-412d-ba43-f83d090aa463_wiaglo.png", priority: -2 },
            { name: "Frozen Foods", icon: "❄️", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243375/bf978cbc-ab49-4a43-b23e-41352f4fe33d_dd569df9-8e7b-4e55-bc88-ef692b4d471f_juxpmp.png", priority: -3 },
            { name: "Cake Corner", icon: "🥮", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243380/baa03922-9920-4588-b397-a5faad7f4ff5_b2be157f-a054-402a-b5e6-dbb8eff8ae4a_f7elox.png", priority: -4 },
            { name: "Pan Centre", icon: "🥘", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243385/822a816f-42b1-44ea-a605-98936352f195_2cf4e5c9-61eb-4c20-91d3-5a3b04af44e8_b07nhs.png", priority: -5 },
            { name: "Bath & Body", icon: "🫧", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243391/46b1b550-1e5f-423e-967b-e1cf3a608bb8_13bc4f93-eab7-4263-a592-54f144d0eec6_ch3gzv.png", priority: -6 },
            { name: "Hair Care", icon: "🪮", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243395/73dd2be1-fd81-4540-8286-02db395de0e5_5da6d646-978e-4b00-bfd4-63cbe897c0b2_swk6ti.png", priority: -7 },
            { name: "Skin Care", icon: "🧴", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243400/d6930a4e-6a3c-44c9-8b6b-86f63e20434a_0c08d4e2-6423-4a9e-ad4b-35b339a149b0_jgix4i.png", priority: -8 },
            { name: "Makeups", icon: "💄", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243405/7c05fd2b-1ea8-4ce4-9b9e-0ba402d3f698_b802ea7a-3d08-44f0-ac8e-4793e4806f67_umsbw1.png", priority: -9 },
            { name: "Oral Care", icon: "🪥", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243410/d753ff8d-4cdb-4548-bba2-b10e480cc6b2_28cfcd55-1e7f-4333-a5d5-15c023b8b58d_dnl5uz.png", priority: -10 },
            { name: "Grooming", icon: "🪮", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243416/6fd76e5f-016b-4810-94fd-252eab4245a6_2edc9535-9e14-49cf-a05e-25fa4ca45cb8_cme6hr.png", priority: -11 },
            { name: "Baby Care", icon: "👶", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243421/838ef0d0-8687-447a-8520-95b6700b70f6_a08f1496-3e1f-425f-bdd5-90d1e2bfce5d_qgcvpf.png", priority: -12 },
            { name: "Perfumes", icon: "🍃", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243426/d0f1c0f3-5dc4-422e-9120-222c0afc4043_2588dd56-663e-43f0-a14b-1a537b8301a9_o6xokw.png", priority: -13 },
            { name: "Proteins", icon: "💪🏻", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243431/15c3c8f7-74df-4077-b436-bf499ddc1987_1472c5c1-badd-4a53-adef-74be13e84abc_n2qzfr.png", priority: -14 },
            { name: "Female Hygiene", icon: "👩🏻‍🦰", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243436/f9937881-a78c-4f8e-a381-e10a4fa26fde_b49bb726-58bd-4d38-b4d4-252d152c0b3e_qgzslz.png", priority: -15 },
            { name: "Health & Pharmacy", icon: "💊", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243445/e0c08b1d-acf8-4f07-b8b6-5195392cda43_2f75a368-330a-4237-afb8-30571efe666a_qztp09.png", priority: -16 },
            { name: "The Bread Store", icon: "🍞", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80", priority: -18 },
            { name: "Premium Pickles", icon: "🥒", image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&auto=format&fit=crop&q=80", priority: -19 },
            { name: "Sexual Wellness", icon: "❤️", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783243440/9961e13f-8231-419b-b36f-5a07bd1ddaed_4b1fd87f-e585-494a-88d0-fc87bdc10a6e_ivc8p1.png", priority: -21 },
            { name: "House Holds", icon: "🪷", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245595/28f9da5d-40d0-4791-9ad7-824e041320ff_dbef4796-189f-4a9f-86f7-f896aa5fddb2_sbqlin.png", priority: -22 },
            { name: "Kitchen & Cooking", icon: "🫙", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245601/66ea9503-f944-4f5f-bb44-8608a0355e3a_ee7d3d13-c857-4e5a-96b1-3c79da306b9e_j6uscb.png", priority: -23 },
            { name: "Cleaning Essentials", icon: "🪣", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245604/b332fa4a-4a15-4c32-8bb8-f46b34ef13d5_ff40260d-3a00-40e7-b019-69ecebed8a91_oio0of.png", priority: -24 },
            { name: "Clothing Section", icon: "🩳", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245609/93cce7bf-96cc-4ff6-adfc-a248c2a8cb94_783cd072-3e52-4daf-996a-4652d000d943_nuejlo.png", priority: -25 },
            { name: "Stationary", icon: "🧷", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245625/e1e37212-1b34-4711-927e-bce563247de7_60934c30-e762-4a81-ba56-8bf6f30b6766_aypair.png", priority: -26 },
            { name: "Pooja Essentials", icon: "🕉️", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245634/965c898a-bc67-4fe8-8fd4-d13e1eb79772_c38285f9-727d-422b-ad77-e1e22d4d251d_us2el2.png", priority: -27 },
            { name: "Toys and Games", icon: "🎲", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245639/79f943d8-2977-4753-bab0-1a74f582d6b8_7a341dcf-099f-4617-a44f-d28c55de560a_sjvrrs.png", priority: -28 },
            { name: "Sports Equipment", icon: "⚽", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245644/06414bae-6149-4a26-8ca5-a5afffb3f753_171a212b-1edd-4a68-a424-46e240270a3b_grkd9i.png", priority: -29 },
            { name: "Pet Shop", icon: "🐕", image: "https://res.cloudinary.com/dshelwy43/image/upload/v1783245650/b936925b-340a-4d1a-a423-0ecbc989d8ee_f70daa6c-8b2f-45d5-86e5-ced16b437ce4_axdbed.png", priority: -30 },
          ];

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
        }
      } catch (catSeedErr) {
        console.error("❌ Mongoose: Failed to seed categories:", catSeedErr.message);
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

app.get("/api/products", async (req, res) => {
  try {
    if (isConnected) {
      const products = await Product.find().lean();
      const productIds = new Set(products.map((product) => product.id || String(product._id)));
      const missingFallbackProducts = mockProducts.filter((product) => !productIds.has(product.id));
      res.json([...products, ...missingFallbackProducts]);
    } else {
      console.log("ℹ️ Serving local in-memory products (database offline/unreachable)");
      res.json(mockProducts);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error"
    });
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

  io.on("connection", (socket) => {
    console.log("🔌 Socket.IO client connected:", socket.id);

    socket.on("joinOrderRoom", (orderId) => {
      socket.join(orderId);
      console.log(`🔌 Socket client joined room: ${orderId}`);
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
app.use("/api/save-for-later", saveForLaterRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", userRoutes);

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