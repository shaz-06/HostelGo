// Custom XSS Sanitization Middleware for Express 5.x compatibility
// Mutates request strings in-place to avoid re-assigning read-only properties

const sanitizeHtml = require("sanitize-html");

const sanitizeValue = (value) => {
  if (typeof value === "string") {
    return sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      value[key] = sanitizeValue(value[key]);
    }
  }

  return value;
};

const xssCleanMiddleware = () => {
  return (req, res, next) => {
    if (req.body) sanitizeValue(req.body);
    if (req.query) sanitizeValue(req.query);
    if (req.params) sanitizeValue(req.params);

    next();
  };
};

module.exports = xssCleanMiddleware;
