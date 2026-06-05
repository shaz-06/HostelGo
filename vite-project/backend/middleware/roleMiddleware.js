const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (req.user && allowedRoles.includes(req.user.role)) {
      console.log("=== [ROLE ACCESS GRANTED] ===");
      console.log(`User Name: ${req.user.name} | Role: ${req.user.role}`);
      return next();
    }

    console.error("❌ === [ROLE ACCESS DENIED] ===");
    console.error(`User: ${req.user ? req.user.name : "Guest"} | Role: ${req.user ? req.user.role : "None"}`);
    return res.status(403).json({ message: "Access denied, insufficient role permissions" });
  };
};

module.exports = roleMiddleware;