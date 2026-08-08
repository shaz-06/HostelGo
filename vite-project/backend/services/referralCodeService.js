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

/**
 * Concurrency-safe lazy referral-code generation.
 */
async function getOrCreateReferralCode(user) {
  if (user.referralCode) return user.referralCode;

  const User = mongoose.model("User");
  let attempts = 0;
  while (attempts < 5) {
    const candidate = await generateUniqueCode(user.name || "Buyto User");
    
    try {
      const updatedUser = await User.findOneAndUpdate(
        { 
          _id: user._id, 
          $or: [ { referralCode: null }, { referralCode: { $exists: false } } ] 
        },
        { $set: { referralCode: candidate } },
        { new: true }
      );
      
      if (updatedUser) {
        user.referralCode = updatedUser.referralCode;
        return updatedUser.referralCode;
      }
      
      const existingUser = await User.findById(user._id);
      if (existingUser && existingUser.referralCode) {
        user.referralCode = existingUser.referralCode;
        return existingUser.referralCode;
      }
    } catch (error) {
      if (error.code === 11000 || error.message.includes("E11000")) {
        attempts++;
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed to generate unique referral code after multiple attempts.");
}

module.exports = {
  generateUniqueCode,
  getOrCreateReferralCode
};
