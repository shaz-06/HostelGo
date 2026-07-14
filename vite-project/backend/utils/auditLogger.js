const fs = require("fs");
const path = require("path");

// Logging configurations via env variables
const LOG_TARGET = process.env.AUDIT_LOG_TARGET || "console"; // "console", "file", "both"
const LOG_FILE_PATH = process.env.AUDIT_LOG_FILE_PATH || path.join(__dirname, "../logs/audit.log");

// Ensure logs directory exists if logging to file
if (LOG_TARGET === "file" || LOG_TARGET === "both") {
  const dir = path.dirname(LOG_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Deep masks sensitive keys in payloads with asterisks
 */
const maskSensitiveData = (data) => {
  if (!data) return data;
  if (typeof data === "string") return data;
  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item));
  }
  if (typeof data === "object") {
    const masked = {};
    const sensitivePattern = /password|otp|token|jwt|secret|key|pin|cookie|authorization|auth|razorpay|msg91/i;
    for (const [k, v] of Object.entries(data)) {
      if (sensitivePattern.test(k)) {
        masked[k] = "********";
      } else if (typeof v === "object") {
        masked[k] = maskSensitiveData(v);
      } else {
        masked[k] = v;
      }
    }
    return masked;
  }
  return data;
};

/**
 * Write a formatted message with a log level to the configured targets
 */
const writeLog = (level, message, data = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  };

  const logLine = JSON.stringify(entry);

  if (LOG_TARGET === "console" || LOG_TARGET === "both") {
    console.log(`[${level}] ${message} ${Object.keys(data).length ? JSON.stringify(data) : ""}`);
  }

  if (LOG_TARGET === "file" || LOG_TARGET === "both") {
    try {
      fs.appendFileSync(LOG_FILE_PATH, logLine + "\n", "utf8");
    } catch (err) {
      console.error("❌ Failed to write to audit log file:", err.message);
    }
  }
};

/**
 * Reusable Audit Logger for security-sensitive events
 */
const logAuditEvent = ({ eventType, userId, userRole = "none", requestId = "none", ip, userAgent, status, details = {} }) => {
  const level = status === "SUCCESS" ? "INFO" : "WARN";
  writeLog(level, `Audit Event: ${eventType}`, {
    eventType,
    userId: userId || "anonymous",
    userRole,
    requestId,
    ip: ip || "unknown",
    userAgent: userAgent || "unknown",
    status,
    details: maskSensitiveData(details)
  });
};

/**
 * Performance Logger to track requests and duration
 */
const logRequestPerformance = (req, res, durationMs) => {
  const url = req.originalUrl || req.url;

  // 1. Log Only Meaningful Requests (ignore noisy static assets & checks)
  const isStaticAsset = /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff2|txt|html)$/i.test(url);
  const isHealthCheck = url === "/health" || url === "/ping" || url === "/";
  const isPreflight = req.method === "OPTIONS";

  if ((isStaticAsset || isHealthCheck || isPreflight) && process.env.DEBUG_LOGS !== "true") {
    return;
  }

  const userId = req.user ? req.user.id || req.user._id || req.user : "Guest";
  const userRole = req.user ? req.user.role : "none";
  const statusCode = res.statusCode;

  // Determine appropriate log level based on HTTP status
  let level = "INFO";
  if (statusCode >= 400 && statusCode < 500) {
    level = "WARN";
  } else if (statusCode >= 500) {
    level = "ERROR";
  }

  writeLog(level, `${req.method} ${url} completed in ${durationMs}ms`, {
    requestId: req.id || "none",
    method: req.method,
    url,
    status: statusCode,
    durationMs,
    userId,
    userRole,
    ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress
  });
};

/**
 * Detailed Centralized Error Logger
 */
const logErrorEvent = (err, req, errorId, statusCode) => {
  const userId = req.user ? req.user.id || req.user._id : "anonymous";
  const userRole = req.user ? req.user.role : "none";

  writeLog("ERROR", `Server Error: ${err.message}`, {
    errorId,
    requestId: req.id || "none",
    userId,
    userRole,
    ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"] || "unknown",
    method: req.method,
    url: req.originalUrl || req.url,
    routeParams: maskSensitiveData(req.params),
    queryParams: maskSensitiveData(req.query),
    body: maskSensitiveData(req.body),
    statusCode,
    originalMessage: err.message,
    stack: err.stack,
    env: process.env.NODE_ENV || "development"
  });
};

/**
 * Log server shutdown steps
 */
const logShutdownEvent = (level, message) => {
  writeLog(level, `[SHUTDOWN] ${message}`);
};

/**
 * Log fatal Node.js process errors
 */
const logFatalProcessError = (err, errorId) => {
  writeLog("ERROR", `Fatal Process Error: ${err.message}`, {
    errorId,
    pid: process.pid,
    nodeVersion: process.version,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    stack: err.stack,
    env: process.env.NODE_ENV || "development"
  });
};

module.exports = {
  logAuditEvent,
  logRequestPerformance,
  logErrorEvent,
  logShutdownEvent,
  logFatalProcessError,
  maskSensitiveData
};
