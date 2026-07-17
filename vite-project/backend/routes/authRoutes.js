const express = require("express");
const router = express.Router();
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { WELCOME_BONUS } = require("../config/constants");
const authMiddleware = require("../middleware/authMiddleware");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const DeliveryServiceZone = require("../models/DeliveryServiceZone");
const UnserviceableRequest = require("../models/UnserviceableRequest");
const { body, param, validationResult } = require("express-validator");
const { 
  loginLimiter, 
  forgotPasswordLimiter, 
  resetPasswordLimiter, 
  changePasswordLimiter, 
  emailVerificationLimiter, 
  sendVerificationLimiter 
} = require("../middleware/rateLimiter");
const { generateSecureToken, createHashSha256, timingSafeCompare } = require("../utils/cryptoUtils");
const { logAuditEvent } = require("../utils/auditLogger");

// Validation result helper
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Reusable password validator following policy
const passwordDenylist = ["password123", "1234567890", "12345678", "qwertyuiop", "admin12345"];
const passwordDenylistCheck = (value) => {
  if (passwordDenylist.includes(value.toLowerCase())) {
    throw new Error("Password is too common and insecure.");
  }
  return true;
};

const passwordValidator = body("password")
  .isLength({ min: 12 })
  .withMessage("Password must be at least 12 characters long.")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter.")
  .matches(/[a-z]/)
  .withMessage("Password must contain at least one lowercase letter.")
  .matches(/[0-9]/)
  .withMessage("Password must contain at least one number.")
  .matches(/[^A-Za-z0-9]/)
  .withMessage("Password must contain at least one special character.");

// POST /api/auth/signup
router.post("/signup", [
  body("name").isString().trim().notEmpty().withMessage("Name is required").escape(),
  body("email").isEmail().withMessage("Provide a valid email address").normalizeEmail(),
  body("phone").isString().trim().isLength({ min: 10, max: 15 }).withMessage("Provide a valid phone number"),
  passwordValidator.custom(passwordDenylistCheck),
  validate
], async (req, res) => {
  console.log("=== [AUTH SIGNUP] ===");
  try {
    const { name, email, phone, password } = req.body;

    // Check duplicate accounts
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

    // Create new User (password is hashed in pre-save hook)
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

    // Grant welcome bonus using WalletService
    try {
      const WalletService = require("../services/WalletService");
      await WalletService.grantWelcomeBonus(savedUser._id, savedUser.email);
    } catch (welcomeErr) {
      console.error("❌ Error granting welcome bonus on signup:", welcomeErr.message);
    }

    // Fetch the updated user document to get populated buyCoins and buyCoinsStats
    const updatedUser = await User.findById(savedUser._id);

    // Generate token
    const token = generateToken(updatedUser._id, updatedUser.email, updatedUser.role);

    logAuditEvent({
      eventType: "USER_REGISTRATION",
      userId: updatedUser._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS"
    });

    return res.status(201).json({
      success: true,
      isNewUser: true,
      welcomeBonus: WELCOME_BONUS,
      message: "Welcome bonus credited successfully.",
      token,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        addresses: updatedUser.addresses,
        buyCoins: updatedUser.buyCoins,
        buyCoinsStats: updatedUser.buyCoinsStats
      }
    });

  } catch (error) {
    console.error("❌ Signup Exception:", error);
    return res.status(500).json({
      message: "Signup failed"
    });
  }
});

// POST /api/auth/login
router.post("/login", loginLimiter, [
  body("email").isEmail().withMessage("Provide a valid email address").normalizeEmail(),
  body("password").isString().notEmpty().withMessage("Password is required"),
  validate
], async (req, res) => {
  console.log("=== [AUTH LOGIN] ===");
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Lockout verification
    if (user) {
      if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
        logAuditEvent({
          eventType: "LOGIN_LOCKED_ACCOUNT",
          userId: user._id,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          status: "FAILURE",
          details: { email }
        });
        return res.status(401).json({ message: "Invalid credentials" });
      } else if (user.accountLockedUntil && user.accountLockedUntil <= new Date()) {
        // Lock has expired, reset counter and clear lock atomically
        await User.updateOne(
          { _id: user._id },
          { $set: { failedLoginAttempts: 0, accountLockedUntil: null } }
        );
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = null;
      }
    }

    // Compare password (using dummy compare if user doesn't exist)
    const dummyHash = "$2b$12$1234567890123456789012345678901234567890123456789012";
    const valid = user ? await bcrypt.compare(password, user.password) : await bcrypt.compare(password, dummyHash);

    if (!user || !valid) {
      if (user) {
        // Increment attempts atomically
        const updates = { $inc: { failedLoginAttempts: 1 } };
        if (user.failedLoginAttempts + 1 >= 5) {
          updates.$set = { accountLockedUntil: new Date(Date.now() + 15 * 60 * 1000) };
          logAuditEvent({
            eventType: "ACCOUNT_LOCK",
            userId: user._id,
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            status: "FAILURE",
            details: { email }
          });
        }
        await User.updateOne({ _id: user._id }, updates);
      }

      logAuditEvent({
        eventType: "LOGIN_FAILED",
        userId: user ? user._id : null,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        status: "FAILURE",
        details: { email }
      });

      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("=== [AUTH LOGIN SUCCESS] ===");
    console.log("Authenticated User ID:", user._id);

    // Reset attempts and clear lock atomically on success
    await User.updateOne(
      { _id: user._id },
      { $set: { failedLoginAttempts: 0, accountLockedUntil: null } }
    );

    const token = generateToken(user._id, user.email, user.role);

    logAuditEvent({
      eventType: "LOGIN_SUCCESS",
      userId: user._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS"
    });

    return res.status(200).json({
      success: true,
      isNewUser: false,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        buyCoins: user.buyCoins,
        buyCoinsStats: user.buyCoinsStats
      }
    });

  } catch (error) {
    console.error("❌ Login Exception:", error);
    return res.status(500).json({
      message: "Login failed"
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
      buyCoins: userObj.buyCoins || 0,
      buyCoinsStats: userObj.buyCoinsStats
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

    let isNewUser = false;
    if (!user) {
      console.log(`Creating new account for verified phone: ${normalizedPhone}`);
      user = new User({
        name: "Buyto User",
        phone: normalizedPhone,
        role: "customer"
      });
      await user.save();
      isNewUser = true;

      // Atomically grant welcome bonus ONLY for newly created accounts
      console.log(`Crediting welcome bonus for new user ${user._id}`);
      try {
        const WalletService = require("../services/WalletService");
        await WalletService.grantWelcomeBonus(user._id, user.email || "");
      } catch (welcomeErr) {
        console.error("❌ Error granting welcome bonus on OTP verification:", welcomeErr.message);
      }
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

    // Fetch the updated user document to get populated buyCoins and buyCoinsStats
    const updatedUser = await User.findById(user._id);

    // Generate JWT token
    const token = generateToken(updatedUser._id, updatedUser.email || "", updatedUser.role);

    console.log("=== [MSG91 LOGIN SUCCESS] ===");
    console.log("Token generated:", token);

    const responsePayload = {
      success: true,
      token,
      profileCompleted: !!updatedUser.profileCompleted,
      isNewUser: isNewUser,
      ...(isNewUser ? { welcomeBonus: WELCOME_BONUS, message: "Welcome bonus credited successfully." } : {}),
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email || "",
        phone: updatedUser.phone,
        role: updatedUser.role,
        isFounder: !!updatedUser.isFounder,
        hasAdminPin: !!updatedUser.adminPin,
        gender: updatedUser.gender || "",
        profileCompleted: !!updatedUser.profileCompleted,
        addresses: updatedUser.addresses,
        buyCoins: updatedUser.buyCoins,
        buyCoinsStats: updatedUser.buyCoinsStats
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

// --- NEW SECURITY ENDPOINTS ---

// Helper to execute MongoDB operations in a transaction with fallback
const runInTransaction = async (work) => {
  const mongoose = require("mongoose");
  const conn = mongoose.connection;
  let session = null;
  try {
    session = await conn.startSession();
    session.startTransaction();
    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    // Check if error is related to replica sets or transaction support
    const isUnsupported = err.message && (
      err.message.includes("transaction") || 
      err.message.includes("replica set") || 
      err.message.includes("sessions are not supported") ||
      err.code === 20
    );
    if (isUnsupported) {
      console.warn("⚠️ MongoDB Transactions not supported. Falling back to non-transactional execution.");
      return await work(null);
    }
    throw err;
  } finally {
    if (session) session.endSession();
  }
};

// POST /api/auth/forgot-password
router.post("/forgot-password", forgotPasswordLimiter, [
  body("email").isEmail().withMessage("Provide a valid email address").normalizeEmail(),
  validate
], async (req, res) => {
  console.log("=== [AUTH FORGOT PASSWORD] ===");
  try {
    const { email } = req.body;
    const genericResponse = { success: true, message: "If an account exists, a password reset link has been sent." };

    const user = await User.findOne({ email });
    if (!user) {
      logAuditEvent({
        eventType: "PASSWORD_RESET_REQUEST_NO_USER",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        status: "FAILURE",
        details: { email }
      });
      return res.status(200).json(genericResponse);
    }

    const token = generateSecureToken();
    const hash = createHashSha256(token);

    user.passwordResetTokenHash = hash;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    logAuditEvent({
      eventType: "PASSWORD_RESET_REQUEST",
      userId: user._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS",
      details: { email }
    });

    console.log(`[SECURITY RESET DEV ONLY] Reset Token: ${token} | Hash: ${hash}`);

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/auth/reset-password/:token
router.post("/reset-password/:token", resetPasswordLimiter, [
  param("token").isString().notEmpty().withMessage("Token is required"),
  passwordValidator.custom(passwordDenylistCheck),
  validate
], async (req, res) => {
  console.log("=== [AUTH RESET PASSWORD] ===");
  try {
    const { token } = req.params;
    const { password } = req.body;
    const hash = createHashSha256(token);

    const result = await runInTransaction(async (session) => {
      const user = await User.findOne({
        passwordResetTokenHash: hash,
        passwordResetExpires: { $gt: new Date() }
      }).session(session);

      if (!user) {
        return { success: false, status: 400, message: "Invalid or expired token" };
      }

      // Defense-in-depth timing-safe validation
      const match = timingSafeCompare(user.passwordResetTokenHash, hash);
      if (!match) {
        return { success: false, status: 400, message: "Invalid or expired token" };
      }

      // Check password history reuse
      for (const entry of user.passwordHistory) {
        if (await bcrypt.compare(password, entry.hash)) {
          return { success: false, status: 400, message: "You cannot reuse a recent password." };
        }
      }
      if (await bcrypt.compare(password, user.password)) {
        return { success: false, status: 400, message: "New password must differ from the current password." };
      }

      // Push current password to history
      user.passwordHistory.push({ hash: user.password, changedAt: new Date() });
      if (user.passwordHistory.length > 5) {
        user.passwordHistory.shift();
      }

      user.password = password; // Hashed in pre-save hook
      user.passwordChangedAt = new Date();
      user.passwordResetTokenHash = null;
      user.passwordResetExpires = null;
      user.failedLoginAttempts = 0;
      user.accountLockedUntil = null;

      await user.save({ session });

      logAuditEvent({
        eventType: "PASSWORD_RESET_SUCCESS",
        userId: user._id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        status: "SUCCESS"
      });

      return { success: true };
    });

    if (!result.success) {
      logAuditEvent({
        eventType: "PASSWORD_RESET_FAILED",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        status: "FAILURE",
        details: { message: result.message }
      });
      return res.status(result.status).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/auth/change-password
router.post("/change-password", authMiddleware, changePasswordLimiter, [
  body("currentPassword").isString().notEmpty().withMessage("Current password is required"),
  passwordValidator.custom(passwordDenylistCheck),
  validate
], async (req, res) => {
  console.log("=== [AUTH CHANGE PASSWORD] ===");
  try {
    const { currentPassword, password } = req.body;

    const result = await runInTransaction(async (session) => {
      const user = await User.findById(req.user._id).session(session);
      if (!user) {
        return { success: false, status: 404, message: "User not found" };
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return { success: false, status: 400, message: "Incorrect current password" };
      }

      // Check history reuse
      for (const entry of user.passwordHistory) {
        if (await bcrypt.compare(password, entry.hash)) {
          return { success: false, status: 400, message: "You cannot reuse a recent password." };
        }
      }
      if (await bcrypt.compare(password, user.password)) {
        return { success: false, status: 400, message: "New password must differ from the current password." };
      }

      // Push current password to history
      user.passwordHistory.push({ hash: user.password, changedAt: new Date() });
      if (user.passwordHistory.length > 5) {
        user.passwordHistory.shift();
      }

      user.password = password; // Hashed in pre-save hook
      user.passwordChangedAt = new Date();
      user.passwordResetTokenHash = null;
      user.passwordResetExpires = null;

      await user.save({ session });

      logAuditEvent({
        eventType: "PASSWORD_CHANGE_SUCCESS",
        userId: user._id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        status: "SUCCESS"
      });

      return { success: true };
    });

    if (!result.success) {
      logAuditEvent({
        eventType: "PASSWORD_CHANGE_FAILED",
        userId: req.user._id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        status: "FAILURE",
        details: { message: result.message }
      });
      return res.status(result.status).json({ success: false, message: result.message });
    }

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/auth/send-verification
router.post("/send-verification", authMiddleware, sendVerificationLimiter, async (req, res) => {
  console.log("=== [AUTH SEND VERIFICATION] ===");
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const token = generateSecureToken();
    const hash = createHashSha256(token);

    user.verificationTokenHash = hash;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    logAuditEvent({
      eventType: "EMAIL_VERIFICATION_SENT",
      userId: user._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS"
    });

    console.log(`[SECURITY VERIFICATION DEV ONLY] Verification Token: ${token} | Hash: ${hash}`);

    return res.status(200).json({ success: true, message: "Verification link generated successfully" });
  } catch (error) {
    console.error("Send verification error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/auth/verify-email/:token
router.post("/verify-email/:token", emailVerificationLimiter, [
  param("token").isString().notEmpty().withMessage("Token is required"),
  validate
], async (req, res) => {
  console.log("=== [AUTH VERIFY EMAIL] ===");
  try {
    const { token } = req.params;
    const hash = createHashSha256(token);

    const user = await User.findOne({
      verificationTokenHash: hash,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      logAuditEvent({
        eventType: "EMAIL_VERIFICATION_FAILED",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        status: "FAILURE",
        details: { reason: "Invalid or expired token" }
      });
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    const match = timingSafeCompare(user.verificationTokenHash, hash);
    if (!match) {
      logAuditEvent({
        eventType: "EMAIL_VERIFICATION_FAILED",
        userId: user._id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        status: "FAILURE",
        details: { reason: "Token timing compare failed" }
      });
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    user.verificationTokenHash = null;
    user.verificationTokenExpires = null;
    user.emailVerified = true;

    await user.save();

    logAuditEvent({
      eventType: "EMAIL_VERIFIED",
      userId: user._id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      status: "SUCCESS"
    });

    return res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;