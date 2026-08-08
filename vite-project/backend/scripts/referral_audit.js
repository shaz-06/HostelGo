const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.model("User");

  const totalCustomers = await User.countDocuments({ role: "customer" });
  const totalUsers = await User.countDocuments();
  const withCode = await User.countDocuments({ referralCode: { $ne: null, $exists: true } });
  const withoutCode = await User.countDocuments({ 
    $or: [
      { referralCode: { $eq: null } },
      { referralCode: { $exists: false } }
    ]
  });

  const duplicatesAgg = await User.aggregate([
    { $match: { referralCode: { $ne: null, $exists: true } } },
    { $group: { _id: "$referralCode", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);

  console.log(`TOTAL_USERS: ${totalUsers}`);
  console.log(`TOTAL_CUSTOMERS: ${totalCustomers}`);
  console.log(`WITH_CODE: ${withCode}`);
  console.log(`WITHOUT_CODE: ${withoutCode}`);
  console.log(`DUPLICATES_COUNT: ${duplicatesAgg.length}`);

  await mongoose.disconnect();
}

run().catch(console.error);
