const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const Product = require("./models/Product");
const User = require("./models/User");
const Order = require("./models/Order");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const riderRoutes = require("./routes/riderRoutes");
const supportRoutes = require("./routes/supportRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const adminMiddleware = require("./middleware/adminMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

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

server.listen(PORT, () => {
  console.log(`Server Started on port ${PORT}`);
});
