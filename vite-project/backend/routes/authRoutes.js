const express = require("express");
const router = express.Router();
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const authMiddleware = require("../middleware/authMiddleware");
const DeliveryServiceZone = require("../models/DeliveryServiceZone");
const UnserviceableRequest = require("../models/UnserviceableRequest");

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  console.log("=== [AUTH SIGNUP] ===");
  console.log("Body:", JSON.stringify(req.body, null, 2));

  try {
    const { name, email, phone, password } = req.body;

    // 1. Validation
    if (!name || !email || !phone || !password) {
      console.error("❌ Signup Error: Missing required fields");
      return res.status(400).json({ message: "All fields (name, email, phone, password) are required" });
    }

    if (password.length < 6) {
      console.error("❌ Signup Error: Password too short");
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("❌ Signup Error: Invalid email format");
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    // 2. Check duplicate accounts
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      console.error(`❌ Signup Error: Email already registered: ${email}`);
      return res.status(400).json({ message: "Email is already registered" });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      console.error(`❌ Signup Error: Phone already registered: ${phone}`);
      return res.status(400).json({ message: "Phone number is already registered" });
    }

    // 3. Create new User (password is hashed in pre-save hook)
    const user = new User({
      name,
      email,
      phone,
      password
    });

    const savedUser = await user.save();
    console.log("=== [AUTH SIGNUP SUCCESS] ===");
    console.log("Saved User Document ID:", savedUser._id);

    // Generate FIRST20 Coupon for newly registered user
    try {
      const Coupon = require("../models/Coupon");
      const existingFirstCoupon = await Coupon.findOne({
        email: savedUser.email.toLowerCase(),
        source: "FIRST20"
      });
      if (!existingFirstCoupon) {
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 Hours
        const coupon = new Coupon({
          userId: savedUser._id,
          email: savedUser.email.toLowerCase(),
          couponCode: "FIRST20",
          discountAmount: 20,
          minimumOrderValue: 149,
          issuedAt: new Date(),
          expiresAt: expiresAt,
          isRedeemed: false,
          source: "FIRST20",
          isUsed: false,
          expiryDate: expiresAt
        });
        await coupon.save();
        console.log(`Generated FIRST20 coupon for newly registered user: ${savedUser.email}`);
      }
    } catch (couponErr) {
      console.error("❌ Error generating FIRST20 coupon on signup:", couponErr.message);
    }

    // 4. Generate token
    const token = generateToken(savedUser._id, savedUser.email, savedUser.role);

    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
        addresses: savedUser.addresses
      }
    });

  } catch (error) {
    console.error("❌ Signup Exception:", error);
    return res.status(500).json({
      message: "Signup failed",
      error: error.message,
      stack: error.stack
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  console.log("=== [AUTH LOGIN] ===");
  console.log(`Body: { email: ${req.body.email}, password: '***' }`);

  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      console.error("❌ Login Error: Missing email or password");
      return res.status(400).json({ message: "Email and password are required" });
    }

    // 2. Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.error(`❌ Login Error: Account not found for email: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3. Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.error(`❌ Login Error: Incorrect password for account: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("=== [AUTH LOGIN SUCCESS] ===");
    console.log("Authenticated User ID:", user._id);

    // 4. Generate token
    const token = generateToken(user._id, user.email, user.role);

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses
      }
    });

  } catch (error) {
    console.error("❌ Login Exception:", error);
    return res.status(500).json({
      message: "Login failed",
      error: error.message,
      stack: error.stack
    });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  console.log("=== [AUTH PROFILE LOAD] ===");
  console.log("User Loaded ID:", req.user._id);
  return res.status(200).json({
    success: true,
    user: req.user
  });
});

// GET /api/auth/coupons
router.get("/coupons", authMiddleware, async (req, res) => {
  try {
    const Coupon = require("../models/Coupon");
    const coupons = await Coupon.find({
      $or: [
        { userId: req.user._id },
        { email: req.user.email.toLowerCase() }
      ]
    }).sort({ issuedAt: -1 });
    return res.status(200).json({ success: true, coupons });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch coupons", error: error.message });
  }
});

// GET /api/auth/coupons/active
router.get("/coupons/active", authMiddleware, async (req, res) => {
  try {
    const Coupon = require("../models/Coupon");
    const now = new Date();
    const coupons = await Coupon.find({
      $or: [
        { userId: req.user._id },
        { email: req.user.email.toLowerCase() }
      ],
      isRedeemed: false,
      expiresAt: { $gt: now }
    }).sort({ issuedAt: -1 });
    return res.status(200).json({ success: true, coupons });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch active coupons", error: error.message });
  }
});

// POST /api/auth/coupons/validate
router.post("/coupons/validate", authMiddleware, async (req, res) => {
  console.log("=== [COUPON VALIDATION] ===");
  try {
    const { couponCode, cartValue } = req.body;
    const email = req.user.email.toLowerCase();

    if (!couponCode) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    const Coupon = require("../models/Coupon");
    const coupon = await Coupon.findOne({
      couponCode: couponCode.toUpperCase().trim(),
      email
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found or does not belong to you" });
    }

    if (coupon.isRedeemed) {
      return res.status(400).json({ success: false, message: "Coupon has already been redeemed" });
    }

    const now = new Date();
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return res.status(400).json({ success: false, message: "Coupon has expired" });
    }

    const numericCartValue = Number(cartValue || 0);
    if (numericCartValue < coupon.minimumOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${coupon.minimumOrderValue} required for this coupon`
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon is valid",
      coupon: {
        _id: coupon._id,
        couponCode: coupon.couponCode,
        discountAmount: coupon.discountAmount,
        minimumOrderValue: coupon.minimumOrderValue
      }
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return res.status(500).json({ success: false, message: "Server error during coupon validation", error: error.message });
  }
});

// Haversine helper
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// POST /api/auth/verify-serviceability
router.post("/verify-serviceability", async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: "Latitude and longitude are required" });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    const activeZones = await DeliveryServiceZone.find({ active: true }).lean();
    if (activeZones.length === 0) {
      return res.json({ success: true, serviceable: false, message: "No active delivery zones configured" });
    }

    const matchedZone = activeZones.find(zone => {
      const dist = haversineDistance(lat, lng, zone.latitude, zone.longitude);
      return dist <= zone.radiusKm;
    });

    if (matchedZone) {
      return res.json({
        success: true,
        serviceable: true,
        zone: matchedZone
      });
    }

    return res.json({
      success: true,
      serviceable: false,
      message: "Location falls outside all active delivery service zones"
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error during serviceability check", error: error.message });
  }
});

// POST /api/auth/notify-me
router.post("/notify-me", async (req, res) => {
  try {
    const { name, email, phone, address, latitude, longitude } = req.body;
    if (!name || !email || !phone || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: "Name, email, phone, address, latitude, and longitude are required" });
    }

    const request = new UnserviceableRequest({
      name,
      email,
      phone,
      address,
      latitude: Number(latitude),
      longitude: Number(longitude)
    });

    await request.save();
    return res.status(201).json({ success: true, message: "Thank you! We've registered your interest and will notify you when we expand to your area." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error registering notification interest", error: error.message });
  }
});

// GET /api/auth/shopping-lists
router.get("/shopping-lists", authMiddleware, async (req, res) => {
  try {
    return res.status(200).json({ success: true, savedLists: req.user.savedLists || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch shopping lists", error: error.message });
  }
});

// POST /api/auth/shopping-lists
router.post("/shopping-lists", authMiddleware, async (req, res) => {
  try {
    const { name, items } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "List name is required" });
    }
    const newList = {
      name,
      items: items || []
    };
    req.user.savedLists.push(newList);
    await req.user.save();
    return res.status(201).json({ success: true, savedLists: req.user.savedLists, list: req.user.savedLists[req.user.savedLists.length - 1] });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to save shopping list", error: error.message });
  }
});

// PUT /api/auth/shopping-lists/:listId
router.put("/shopping-lists/:listId", authMiddleware, async (req, res) => {
  try {
    const { listId } = req.params;
    const { name, items } = req.body;
    const listIndex = req.user.savedLists.findIndex(l => String(l._id) === String(listId));
    if (listIndex === -1) {
      return res.status(404).json({ success: false, message: "Shopping list not found" });
    }
    if (name !== undefined) req.user.savedLists[listIndex].name = name;
    if (items !== undefined) req.user.savedLists[listIndex].items = items;

    await req.user.save();
    return res.status(200).json({ success: true, savedLists: req.user.savedLists, list: req.user.savedLists[listIndex] });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update shopping list", error: error.message });
  }
});

// DELETE /api/auth/shopping-lists/:listId
router.delete("/shopping-lists/:listId", authMiddleware, async (req, res) => {
  try {
    const { listId } = req.params;
    req.user.savedLists = req.user.savedLists.filter(l => String(l._id) !== String(listId));
    await req.user.save();
    return res.status(200).json({ success: true, savedLists: req.user.savedLists });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete shopping list", error: error.message });
  }
});

// POST /api/auth/firebase-login
router.post("/firebase-login", async (req, res) => {
  console.log("=== [FIREBASE LOGIN] ===");
  console.log("Body:", JSON.stringify(req.body, null, 2));

  try {
    const { firebaseUid, phoneNumber, email } = req.body;

    if (!phoneNumber) {
      console.error("❌ Firebase Login Error: Missing phone number");
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Clean phone number (keep only digits)
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    // Support formats with or without country code
    const searchPhone = cleanPhone.length > 10 ? cleanPhone.substring(cleanPhone.length - 10) : cleanPhone;

    // Search by matching last 10 digits to be flexible
    let user = await User.findOne({ 
      phone: { $regex: new RegExp(searchPhone + "$") }
    });

    if (!user) {
      console.log(`Creating new account for phone: ${phoneNumber}`);
      user = new User({
        name: "Instamart User",
        phone: phoneNumber,
        email: email || undefined,
        role: "customer"
      });
      await user.save();
    } else {
      console.log(`Logging in existing user: ${user._id}`);
      // Optionally update email if provided and not set
      if (email && !user.email) {
        user.email = email;
        await user.save();
      }
    }

    // Crediting welcome bonus for newly registered users or if not already given
    if (!user.welcomeBonusGiven) {
      console.log(`Crediting welcome bonus for user ${user._id}`);
      user.welcomeBonusGiven = true;
      user.buyCoins = (user.buyCoins || 0) + 20;
      user.totalBuyCoinsEarned = (user.totalBuyCoinsEarned || 0) + 20;
      await user.save();

      const BuyCoinTransaction = require("../models/BuyCoinTransaction");
      const bonusTx = new BuyCoinTransaction({
        userId: user._id,
        email: user.email || "",
        type: "bonus",
        amount: 20,
        coins: 20,
        description: "Welcome Bonus"
      });
      await bonusTx.save();

      const { recalculateWallet } = require("../utils/rewards");
      await recalculateWallet(user._id, user.email || "");
    }

    // Generate JWT token
    const token = generateToken(user._id, user.email || "", user.role);

    console.log("=== [FIREBASE LOGIN SUCCESS] ===");
    console.log("Token generated:", token);

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email || "",
        phone: user.phone,
        role: user.role,
        addresses: user.addresses
      }
    });

  } catch (error) {
    console.error("❌ Firebase Login Exception:", error);
    return res.status(500).json({
      message: "Firebase login failed",
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;