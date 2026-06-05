const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "buyto_super_secret_key");
      console.log("=== [JWT VERIFY SUCCESS] ===");
      console.log("Decoded Token Payload:", decoded);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        console.error("❌ JWT Verify: User not found in database for ID in token");
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      next();
    } catch (error) {
      console.error("❌ === [JWT VERIFY ERROR] ===");
      console.error(error.message);
      return res.status(401).json({ message: "Not authorized, token failed", error: error.message });
    }
  } else {
    console.error("❌ JWT Verify: Bearer token is missing in request headers");
    return res.status(401).json({ message: "Not authorized, token is missing" });
  }
};

module.exports = authMiddleware;