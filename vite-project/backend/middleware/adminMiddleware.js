const adminMiddleware = (req, res, next) => {
  const tokenPayload = req.tokenPayload || {};
  if (req.user && req.user.role === "admin" && tokenPayload.isAdminVerified === true) {
    console.log("=== [ADMIN ACCESS GRANTED] ===");
    console.log(`User Name: ${req.user.name} | Role: ${req.user.role}`);
    next();
  } else {
    console.error("❌ === [ADMIN ACCESS DENIED] ===");
    console.error(`User: ${req.user ? req.user.name : "Guest"} | Role: ${req.user ? req.user.role : "None"}`);
    return res.status(403).json({ message: "Access denied, administrative privileges required" });
  }
};

module.exports = adminMiddleware;