const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (process.env.NODE_ENV !== "production") {
        console.log("=== [JWT VERIFY SUCCESS] ===");
      }

      req.user = await User.findById(decoded.id).select("-password");
      req.tokenPayload = decoded;

      if (!req.user) {
        console.error("❌ JWT Verify: User not found in database for ID in token");
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      if (req.user.passwordChangedAt) {
        const changedTimestamp = Math.floor(req.user.passwordChangedAt.getTime() / 1000);
        if (decoded.iat < (changedTimestamp - 30)) {
          console.error("❌ JWT Verify: Token rejected because password was changed since issuance");
          return res.status(401).json({ message: "Not authorized, session expired due to password change" });
        }
      }

      next();
    } catch (error) {
      console.error("❌ === [JWT VERIFY ERROR] ===");
      console.error(error.message);
      return res.status(401).json({
        message: "Not authorized, token failed"
      });
    }
  } else {
    console.error("❌ JWT Verify: Bearer token is missing in request headers");
    return res.status(401).json({ message: "Not authorized, token is missing" });
  }
};

module.exports = authMiddleware;