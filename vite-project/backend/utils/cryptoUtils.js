const crypto = require("crypto");

/**
 * Generates a cryptographically secure random token of specified byte length, returned as a hex string.
 * @param {number} length - Byte length of the token (default: 32)
 * @returns {string} Hex representation of the secure token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

/**
 * Generates a SHA-256 hash of the input data.
 * @param {string} data - Input string to hash
 * @returns {string} Hex representation of the SHA-256 hash
 */
const createHashSha256 = (data) => {
  if (!data) return "";
  return crypto.createHash("sha256").update(data).digest("hex");
};

/**
 * Generates an HMAC SHA-256 signature using a secret key.
 * @param {string} data - Payload data
 * @param {string} [secret] - Secret key (defaults to process.env.SECRET_KEY)
 * @returns {string} Hex representation of the HMAC signature
 */
const createHmacSha256 = (data, secret) => {
  const key = secret || process.env.SECRET_KEY;
  if (!key) {
    throw new Error("HMAC secret key is not configured.");
  }
  return crypto.createHmac("sha256", key).update(data).digest("hex");
};

/**
 * Performs a timing-safe comparison between two strings/buffers of equal length.
 * @param {string} a - First value
 * @param {string} b - Second value
 * @returns {boolean} True if they match, false otherwise
 */
const timingSafeCompare = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  
  if (bufA.length !== bufB.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(bufA, bufB);
};

module.exports = {
  generateSecureToken,
  createHashSha256,
  createHmacSha256,
  timingSafeCompare
};
