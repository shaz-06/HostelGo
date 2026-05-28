const jwt = require("jsonwebtoken");

const generateToken = (id, email, role) => {
  return jwt.sign({ id, email, role }, process.env.JWT_SECRET || "buyto_super_secret_key", {
    expiresIn: "7d"
  });
};

module.exports = generateToken;
