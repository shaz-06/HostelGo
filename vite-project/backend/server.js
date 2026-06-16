const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const compression = require("compression");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

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
const authMiddleware = require("./middleware/authMiddleware");
const adminMiddleware = require("./middleware/adminMiddleware");

const app = express();

app.use(compression());
app.use(cors());
app.use(express.json());

// Development Response Time Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[PERF] ${req.method} ${req.originalUrl} - ${duration}ms`);
  });
  next();
});

// In-memory fallback data for development if MongoDB Atlas is unreachable
const mockProducts = require("./seed");

let isConnected = false;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
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
          { name: "The Fruit Store", icon: "🍎", image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&auto=format&fit=crop&q=80", priority: 10 },
          { name: "The Veggie Store", icon: "🥬", image: "https://images.unsplash.com/photo-1566385278603-605b637d384c?w=200&auto=format&fit=crop&q=80", priority: 9 },
          { name: "Dairy, Bread & Eggs", icon: "🥛", image: "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=200&auto=format&fit=crop&q=80", priority: 8 },
          { name: "Meat and Seafood", icon: "🥩", image: "https://images.unsplash.com/photo-1532407191490-e847be1540c6?w=200&auto=format&fit=crop&q=80", priority: 7 },
          { name: "Snacks", icon: "🍿", image: "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=200&auto=format&fit=crop&q=80", priority: 6 },
          { name: "Beverages", icon: "🥤", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&auto=format&fit=crop&q=80", priority: 5 },
          { name: "Atta, Rice and Dal", icon: "🌾", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&auto=format&fit=crop&q=80", priority: 4 },
          { name: "Exclusive Deals", icon: "🔥", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80", priority: 3 },
          { name: "Cleaners & Repellents", icon: "🧹", image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=200&auto=format&fit=crop&q=80", priority: 2 },
          { name: "The Bread Store", icon: "🍞", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80", priority: 1 },
          { name: "Premium Pickles", icon: "🥒", image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&auto=format&fit=crop&q=80", priority: 0 },
          { name: "Sexual Wellness", icon: "❤️", image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=200&auto=format&fit=crop&q=80", priority: -1 }
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
    console.warn("⚠️ MongoDB Connection Failed! Falling back to local in-memory products list.");
    console.error("Reason:", err.message);
    isConnected = false;
  });

app.get("/", (req, res) => {
  res.send("API Running");
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

app.use("/api", paymentRoutes);
app.use("/api", supportRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/rider", riderRoutes);
app.use("/api/admin", authMiddleware, adminMiddleware, adminRoutes);
app.use("/api/buycoins", buyCoinRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/save-for-later", saveForLaterRoutes);

server.listen(PORT, () => {
  console.log(`Server Started on port ${PORT}`);

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