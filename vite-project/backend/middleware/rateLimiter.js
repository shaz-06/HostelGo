const rateLimit = require("express-rate-limit");

// Custom handler to log rate limits and return JSON responses
const customHandler = (req, res, next, options) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.warn(`[RATE LIMIT EXCEEDED] IP: ${ip} | Endpoint: ${req.originalUrl} | Timestamp: ${new Date().toISOString()}`);
  res.status(options.statusCode).json({
    success: false,
    message: "Too many requests. Please try again later."
  });
};

// Global API Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const url = req.originalUrl;
    return (
      url.startsWith("/api/products") ||
      url.startsWith("/api/categories") ||
      url.startsWith("/api/search") ||
      url.startsWith("/api/banners") ||
      url.startsWith("/api/promotions")
    );
  },
  handler: customHandler
});

// Catalog Limiter (Permissive: 400 requests per 1 minute per IP)
const catalogLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler
});

// Authentication Limiter (general fallback)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler
});

// OTP Limiter
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler
});

// Admin Login Limiter
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler
});

// --- NEW SPECIFIC RATE LIMITERS ---

// Login: 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler
});

// Forgot password: 3 requests per hour per account/IP
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: (req) => {
    return req.body.email ? req.body.email.toLowerCase().trim() : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler
});

// Reset password: 5 attempts per hour
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler
});

// Change password: 5 attempts per hour per account
const changePasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => {
    return req.user ? req.user.id || req.user._id : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler
});

// Email verification: 5 requests per day per IP/account
const emailVerificationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler
});

// Send verification: 5 requests per hour per account
const sendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  keyGenerator: (req) => {
    return req.user ? req.user.id || req.user._id : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler
});

module.exports = {
  globalLimiter,
  authLimiter,
  otpLimiter,
  adminLimiter,
  loginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  changePasswordLimiter,
  emailVerificationLimiter,
  sendVerificationLimiter,
  catalogLimiter
};
