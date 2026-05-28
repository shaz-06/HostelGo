const riderMiddleware = (req, res, next) => {
  if (req.user && req.user.role === "rider") {
    if (req.user.isSuspended) {
      console.error("❌ === [RIDER ACCESS DENIED: SUSPENDED] ===");
      console.error(`Rider: ${req.user.name} | ID: ${req.user._id}`);
      return res.status(403).json({ message: "Rider account is suspended" });
    }

    console.log("=== [RIDER ACCESS GRANTED] ===");
    console.log(`Rider Name: ${req.user.name} | Online: ${req.user.isOnline}`);
    return next();
  }

  console.error("❌ === [RIDER ACCESS DENIED] ===");
  console.error(`User: ${req.user ? req.user.name : "Guest"} | Role: ${req.user ? req.user.role : "None"}`);
  return res.status(403).json({ message: "Access denied, rider privileges required" });
};

module.exports = riderMiddleware;
