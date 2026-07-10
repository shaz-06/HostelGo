// Custom XSS Sanitization Middleware for Express 5.x compatibility
// Mutates request strings in-place to avoid re-assigning read-only properties

const sanitizeString = (str) => {
  if (typeof str !== "string") return str;
  // Strip script tags and their contents completely, then strip remaining HTML tags
  return str
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
    .replace(/<[^>]*>/g, "");
};

const sanitizeInPlace = (obj) => {
  if (!obj || typeof obj !== "object") return;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === "string") {
        obj[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitizeInPlace(obj[key]);
      }
    }
  }
};

const xssCleanMiddleware = () => {
  return (req, res, next) => {
    if (req.body) sanitizeInPlace(req.body);
    if (req.query) sanitizeInPlace(req.query);
    if (req.params) sanitizeInPlace(req.params);
    next();
  };
};

module.exports = xssCleanMiddleware;
