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
// Window: 15 minutes
// Max requests: 300 per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler
});

// Authentication Limiter
// Window: 15 minutes
// Max requests: 10 per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler
});

// OTP Limiter
// Window: 10 minutes
// Max requests: 5 per IP
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler
});

// Admin Login Limiter
// Window: 15 minutes
// Max requests: 5 per IP
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: customHandler
});

module.exports = {
  globalLimiter,
  authLimiter,
  otpLimiter,
  adminLimiter
};
