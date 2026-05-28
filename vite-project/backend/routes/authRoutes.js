const express = require("express");
const router = express.Router();
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const authMiddleware = require("../middleware/authMiddleware");

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

module.exports = router;
