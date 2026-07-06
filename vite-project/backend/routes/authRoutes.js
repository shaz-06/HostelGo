const express = require("express");
const router = express.Router();
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const authMiddleware = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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

  if (req.user.phone === "6363849864" && (req.user.role !== "admin" || !req.user.isFounder)) {
    console.log("Enforcing founder admin privileges in /me for:", req.user.phone);
    req.user.role = "admin";
    req.user.isFounder = true;
    await req.user.save();
  }

  const userObj = req.user.toObject();
  delete userObj.adminPin;
  
  return res.status(200).json({
    success: true,
    user: {
      _id: userObj._id,
      name: userObj.name,
      phone: userObj.phone,
      email: userObj.email || "",
      role: userObj.role,
      isFounder: !!userObj.isFounder,
      hasAdminPin: !!req.user.adminPin,
      gender: userObj.gender || "",
      profileCompleted: !!userObj.profileCompleted,
      addresses: userObj.addresses || [],
      buyCoins: userObj.buyCoins || 0
    }
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

const normalizePhone = (phone) => {
  if (!phone) return "";
  const clean = phone.toString().replace(/\D/g, "");
  return clean.length > 10 ? clean.substring(clean.length - 10) : clean;
};

const msg91LoginCache = new Map();

// Regularly clean up the cache to prevent memory leaks (keep entries for 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of msg91LoginCache.entries()) {
    if (now - value.timestamp > 300000) { // 5 minutes
      msg91LoginCache.delete(key);
    }
  }
}, 60000);

// POST /api/auth/msg91-login
router.post("/msg91-login", async (req, res) => {
  console.log("=== [AUTH MSG91 LOGIN] ===");
  try {
    const { accessToken } = req.body;
    console.log("ACCESS TOKEN RECEIVED:", accessToken);
    if (!accessToken) {
      return res.status(400).json({ success: false, message: "Access token is required" });
    }

    // Check if token has been verified and cached recently
    if (msg91LoginCache.has(accessToken)) {
      console.log("=== [MSG91 LOGIN DUPLICATE HIT - CACHED RESPONSE RETURNED] ===");
      const cached = msg91LoginCache.get(accessToken);
      return res.status(200).json(cached.response);
    }

    const msg91Service = require("../services/msg91Service");
    const verifiedData = await msg91Service.verifyAccessToken(accessToken);
    console.log("FULL VERIFIED DATA:", verifiedData);

    const rawPhone = verifiedData.message || (verifiedData.data && verifiedData.data.mobile);
    if (!rawPhone) {
      return res.status(400).json({ success: false, message: "Invalid verification token or missing phone number." });
    }

    const normalizedPhone = normalizePhone(rawPhone);
    const phone = normalizedPhone;
    console.log("PHONE EXTRACTION RESULT:", phone);
    if (normalizedPhone.length !== 10) {
      return res.status(400).json({ success: false, message: "Verified phone number format is invalid" });
    }

    // Find user by normalized phone
    let user = await User.findOne({
      phone: { $regex: new RegExp(normalizedPhone + "$") }
    });

    if (!user) {
      console.log(`Creating new account for verified phone: ${normalizedPhone}`);
      user = new User({
        name: "Buyto User",
        phone: normalizedPhone,
        role: "customer"
      });
      await user.save();
    }

    if (phone === "6363849864") {
      user.role = "admin";
      user.isFounder = true;
      await user.save();
    }

    console.log("=== MSG91 LOGIN PROCESS USER ===");
    console.log("PHONE:", user.phone);
    console.log("ROLE:", user.role);
    console.log("FOUNDER:", !!user.isFounder);
    console.log("REDIRECT TARGET:", (user.role === "admin" && user.isFounder) ? "/admin-verify" : "/");

    // Welcome bonus crediting if not already given
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

      try {
        const { recalculateWallet } = require("../utils/rewards");
        await recalculateWallet(user._id, user.email || "");
      } catch (err) {
        console.error("❌ Error recalculating wallet for welcome bonus:", err.message);
      }
    }

    // Generate JWT token
    const token = generateToken(user._id, user.email || "", user.role);

    console.log("=== [MSG91 LOGIN SUCCESS] ===");
    console.log("Token generated:", token);

    const responsePayload = {
      success: true,
      token,
      profileCompleted: !!user.profileCompleted,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email || "",
        phone: user.phone,
        role: user.role,
        isFounder: !!user.isFounder,
        hasAdminPin: !!user.adminPin,
        gender: user.gender || "",
        profileCompleted: !!user.profileCompleted,
        addresses: user.addresses
      }
    };

    // Cache successful payload for duplicate calls
    msg91LoginCache.set(accessToken, {
      timestamp: Date.now(),
      response: responsePayload
    });

    return res.status(200).json(responsePayload);

  } catch (error) {
    console.error("❌ MSG91 Login Exception:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Authentication failed"
    });
  }
});

// PUT /api/auth/update-profile
router.put("/update-profile", authMiddleware, async (req, res) => {
  try {
    const { name, gender } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Full Name is required" });
    }

    const user = req.user;
    user.name = name;
    if (gender) {
      user.gender = gender;
    }
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email || "",
        phone: user.phone,
        role: user.role,
        gender: user.gender || "",
        profileCompleted: !!user.profileCompleted,
        addresses: user.addresses
      }
    });
  } catch (error) {
    console.error("❌ Error updating onboarding profile:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update profile" });
  }
});

// POST /api/auth/save-onboarding-address
router.post("/save-onboarding-address", authMiddleware, async (req, res) => {
  try {
    const { apartment, room, floor, landmark } = req.body;
    if (!apartment || !room) {
      return res.status(400).json({ success: false, message: "Apartment/Hostel and Room Number are required" });
    }

    const user = req.user;

    // Generate address label automatically
    const label = `${apartment} - Room ${room}`;

    // Get a default zone coordinates if available, or fallback
    let latitude = 13.1007;
    let longitude = 74.6877;
    try {
      const DeliveryServiceZone = require("../models/DeliveryServiceZone");
      const zone = await DeliveryServiceZone.findOne({ active: true });
      if (zone) {
        latitude = zone.latitude;
        longitude = zone.longitude;
      }
    } catch (e) {
      console.warn("Could not retrieve DeliveryServiceZone for coordinates:", e);
    }

    // Save in standalone Address model
    const Address = require("../models/Address");
    // Remove other defaults
    await Address.updateMany({ userId: user._id }, { isDefault: false });

    const newAddress = new Address({
      userId: user._id,
      label: label,
      fullName: user.name || "Buyto User",
      phone: user.phone,
      addressLine: `${apartment}, Room ${room}${floor ? `, Floor ${floor}` : ""}`,
      landmark: landmark || "",
      roomNumber: room || "",
      latitude,
      longitude,
      isDefault: true,
      serviceable: true
    });
    await newAddress.save();

    // Save address in User document
    if (!user.addresses) {
      user.addresses = [];
    }
    user.addresses.push({
      label,
      apartment,
      room,
      floor: floor || "",
      landmark: landmark || ""
    });

    user.profileCompleted = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address saved and profile completed successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email || "",
        phone: user.phone,
        role: user.role,
        gender: user.gender || "",
        profileCompleted: !!user.profileCompleted,
        addresses: user.addresses
      }
    });
  } catch (error) {
    console.error("❌ Error saving onboarding address:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to save address" });
  }
});

// POST /api/auth/admin-verify
router.post("/admin-verify", authMiddleware, async (req, res) => {
  console.log("=== ADMIN PIN FLOW ===");
  console.log("USER:", req.user);
  console.log("BODY:", req.body);

  try {
    const user = await User.findById(req.user?.id || req.user?._id);
    console.log("FOUND USER:", user);

    if (!user) {
      console.error("❌ Admin PIN Flow Error: Authenticated user not found in database.");
      return res.status(404).json({ success: false, message: "Authenticated user not found in database." });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Administrative privileges required" });
    }

    // Check lockout status
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const timeLeft = Math.ceil((user.lockoutUntil - new Date()) / 1000 / 60);
      return res.status(429).json({
        success: false,
        message: `Too many incorrect attempts. Please try again in ${timeLeft} minutes.`
      });
    }

    const { pin, newPin } = req.body;

    // Handle setting a new PIN if not registered yet
    if (!user.adminPin) {
      if (!newPin || newPin.length !== 6 || isNaN(newPin)) {
        return res.status(400).json({ success: false, message: "A 6-digit PIN is required to initialize admin access." });
      }
      const salt = await bcrypt.genSalt(10);
      user.adminPin = await bcrypt.hash(newPin, salt);
      user.pinAttempts = 0;
      user.lockoutUntil = null;
      await user.save();
      
      // Successfully set, now proceed to generate the token
      const token = jwt.sign(
        { id: user._id, email: user.email || "", role: "admin", isAdminVerified: true },
        process.env.JWT_SECRET || "buyto_super_secret_key",
        { expiresIn: "12h" }
      );
      return res.status(200).json({ success: true, message: "Admin PIN created and session initialized", token });
    }

    // Standard PIN check
    if (!pin || pin.length !== 6 || isNaN(pin)) {
      return res.status(400).json({ success: false, message: "A valid 6-digit PIN is required." });
    }

    const isMatch = await bcrypt.compare(pin, user.adminPin);
    if (!isMatch) {
      user.pinAttempts = (user.pinAttempts || 0) + 1;
      if (user.pinAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
        await user.save();
        return res.status(429).json({
          success: false,
          message: "Too many incorrect attempts. Admin verification locked for 15 minutes."
        });
      }
      await user.save();
      return res.status(400).json({
        success: false,
        message: `Incorrect PIN. ${5 - user.pinAttempts} attempts remaining.`
      });
    }

    // Reset attempts on successful verify
    user.pinAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    // Generate short-lived token expiring in 12h
    const token = jwt.sign(
      { id: user._id, email: user.email || "", role: "admin", isAdminVerified: true },
      process.env.JWT_SECRET || "buyto_super_secret_key",
      { expiresIn: "12h" }
    );

    return res.status(200).json({
      success: true,
      message: "Admin verification successful",
      token
    });
  } catch (error) {
    console.error("Admin verification error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;