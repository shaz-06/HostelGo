const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const { getOrCreateReferralCode } = require("../services/referralCodeService");

async function run() {
  console.log("=== [STARTING REFERRAL CODE BACKFILL MIGRATION] ===");
  await mongoose.connect(process.env.MONGODB_URI);

  const usersToUpdate = await User.find({
    $or: [
      { referralCode: { $eq: null } },
      { referralCode: { $exists: false } }
    ]
  });

  console.log(`Found ${usersToUpdate.length} users with missing referral codes.`);
  let updatedCount = 0;

  for (const user of usersToUpdate) {
    try {
      const code = await getOrCreateReferralCode(user);
      console.log(`Updated User ID: ${user._id} (${user.name}) -> Code: ${code}`);
      updatedCount++;
    } catch (err) {
      console.error(`❌ Failed to update User ID: ${user._id}:`, err.message);
    }
  }

  console.log(`=== [MIGRATION COMPLETE. Backfilled: ${updatedCount}/${usersToUpdate.length} users] ===`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Migration crashed:", err);
  await mongoose.disconnect();
});
