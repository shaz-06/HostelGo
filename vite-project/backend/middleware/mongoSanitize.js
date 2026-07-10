// Custom NoSQL Injection Sanitization Middleware for Express 5.x compatibility
// Mutates query, body, and params objects in-place to avoid re-assigning read-only getter properties

const sanitizeInPlace = (obj) => {
  if (!obj || typeof obj !== "object") return;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // If the value is an object (nested), sanitize it first
      if (obj[key] && typeof obj[key] === "object") {
        sanitizeInPlace(obj[key]);
      }

      // If the key starts with $ or contains a dot, sanitize the key itself
      if (key.startsWith("$") || key.includes(".")) {
        const newKey = key.replace(/^\$/, "_").replace(/\./g, "_");
        obj[newKey] = obj[key];
        delete obj[key];
      }
    }
  }
};

const mongoSanitizeMiddleware = (req, res, next) => {
  if (req.body) sanitizeInPlace(req.body);
  if (req.query) sanitizeInPlace(req.query);
  if (req.params) sanitizeInPlace(req.params);
  next();
};

module.exports = mongoSanitizeMiddleware;
