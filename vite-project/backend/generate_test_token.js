const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const JWT_SECRET = process.env.JWT_SECRET || "buyto_super_secret_key";

// Test User info
const userId = "6a2d48472e4e359fb2e009e5";
const userObj = {
  _id: userId,
  name: "Test User",
  phone: "9876500001",
  role: "customer"
};

const token = jwt.sign(
  { id: userId, email: "", role: "customer" },
  JWT_SECRET,
  { expiresIn: "7d" }
);

console.log("=== GENERATED TOKEN ===");
console.log("JWT_TOKEN:", token);
console.log("USER_JSON:", JSON.stringify(userObj));
