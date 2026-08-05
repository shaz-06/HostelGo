const mongoose = require("mongoose");

/**
 * Generates an uppercase, human-readable, collision-resistant code.
 */
function generateRawCode(name) {
  const prefix = (name || "BUY").replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase();
  const randomChars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude ambiguous 1, 0, I, O
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  return `${prefix}${suffix}`;
}

/**
 * Generates a unique referral code by checking database records with a retry limit.
 */
async function generateUniqueCode(name) {
  const User = mongoose.model("User");
  let code = generateRawCode(name);
  let codeExists = await User.findOne({ referralCode: code });
  let attempts = 0;

  while (codeExists && attempts < 10) {
    code = generateRawCode(name);
    codeExists = await User.findOne({ referralCode: code });
    attempts++;
  }

  return code;
}

module.exports = {
  generateUniqueCode
};
