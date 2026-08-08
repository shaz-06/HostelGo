const mongoose = require("mongoose");
const assert = require("assert");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Referral = require("../models/Referral");
const ReferralAuditLog = require("../models/ReferralAuditLog");
const Order = require("../models/Order");
const Config = require("../models/Config");
const BuyCoinTransaction = require("../models/BuyCoinTransaction");

const referralCodeService = require("../services/referralCodeService");
const referralService = require("../services/referralService");

async function run() {
  console.log("🚀 Starting OTP Referral Code Test Suite...");
  await mongoose.connect(process.env.MONGODB_URI);

  // Helper to generate unique phone/email
  const randSuffix = () => Math.floor(10000000 + Math.random() * 90000000);

  // Test 1 — Email user
  console.log("Running Test 1 - Email user...");
  const emailUser = new User({
    name: "Email User",
    email: `email-${randSuffix()}@test.com`,
    phone: `91${randSuffix()}`,
    password: "Password123!"
  });
  emailUser.referralCode = await referralCodeService.generateUniqueCode(emailUser.name);
  await emailUser.save();
  assert.ok(emailUser.referralCode, "Referral code should exist for email user");
  console.log("✅ Test 1 Passed.");

  // Test 2 — New MSG91 user
  console.log("Running Test 2 - New MSG91 user...");
  const otpCode = await referralCodeService.generateUniqueCode("Buyto User");
  const otpUser = new User({
    name: "Buyto User",
    phone: `92${randSuffix()}`,
    role: "customer",
    referralCode: otpCode
  });
  await otpUser.save();
  assert.ok(otpUser.referralCode, "Referral code should exist for OTP user");
  console.log("✅ Test 2 Passed.");

  // Test 3 — Two OTP users
  console.log("Running Test 3 - Two OTP users...");
  const otpCodeA = await referralCodeService.generateUniqueCode("Buyto User");
  const userA = new User({
    name: "Buyto User",
    phone: `93${randSuffix()}`,
    role: "customer",
    referralCode: otpCodeA
  });
  await userA.save();

  const otpCodeB = await referralCodeService.generateUniqueCode("Buyto User");
  const userB = new User({
    name: "Buyto User",
    phone: `94${randSuffix()}`,
    role: "customer",
    referralCode: otpCodeB
  });
  await userB.save();

  assert.notStrictEqual(userA.referralCode, userB.referralCode, "Referral codes must be unique");
  console.log("✅ Test 3 Passed.");

  // Test 4 — Login again (remains unchanged)
  console.log("Running Test 4 - Login again...");
  const originalCode = userA.referralCode;
  const fetchedUser = await User.findById(userA._id);
  assert.strictEqual(fetchedUser.referralCode, originalCode, "Referral code must not change on subsequent retrieval");
  console.log("✅ Test 4 Passed.");

  // Test 5 — Profile update (remains unchanged)
  console.log("Running Test 5 - Profile update...");
  userA.name = "Updated Name";
  await userA.save();
  const updatedUser = await User.findById(userA._id);
  assert.strictEqual(updatedUser.referralCode, originalCode, "Referral code must remain immutable on profile save");
  console.log("✅ Test 5 Passed.");

  // Test 8 — Existing OTP user without code gets one safely
  console.log("Running Test 8 - Existing OTP user without code...");
  // Create user bypassing the code generation
  const existingLegacyUser = new User({
    name: "Legacy User",
    phone: `95${randSuffix()}`,
    role: "customer"
  });
  // Bypass validation / hooks to save empty referralCode
  await User.collection.insertOne({
    name: existingLegacyUser.name,
    phone: existingLegacyUser.phone,
    role: existingLegacyUser.role
  });
  const savedLegacy = await User.findOne({ phone: existingLegacyUser.phone });
  assert.strictEqual(savedLegacy.referralCode, undefined, "Code should be initially undefined");

  // Call the lazy-generation helper
  const lazyCode = await referralCodeService.getOrCreateReferralCode(savedLegacy);
  assert.ok(lazyCode, "Lazy generation should return a code");
  const reFetchedLegacy = await User.findById(savedLegacy._id);
  assert.strictEqual(reFetchedLegacy.referralCode, lazyCode, "Code must be successfully persisted in DB");
  console.log("✅ Test 8 Passed.");

  // Test 9 — Existing user with referralCode must NOT be replaced
  console.log("Running Test 9 - Existing user with referralCode...");
  const savedCodeBefore = reFetchedLegacy.referralCode;
  const lazyCodeAfter = await referralCodeService.getOrCreateReferralCode(reFetchedLegacy);
  assert.strictEqual(lazyCodeAfter, savedCodeBefore, "Existing referral code must not be overwritten");
  console.log("✅ Test 9 Passed.");

  // Test 10 — Referral linking works correctly
  console.log("Running Test 10 - Referral linking...");
  const referrer = userB;
  const referred = userA;
  const linkRes = await referralService.linkReferral(referred, referrer.referralCode, "test-corr-link-10");
  assert.strictEqual(linkRes.success, true, "Linking should succeed");
  const referralDoc = await Referral.findOne({ referredUser: referred._id, referrer: referrer._id });
  assert.ok(referralDoc, "Referral document should be created");
  assert.strictEqual(referralDoc.status, "PENDING", "Initial status must be PENDING");
  console.log("✅ Test 10 Passed.");

  // Cleanup test documents
  await User.deleteMany({ _id: { $in: [emailUser._id, userA._id, userB._id, savedLegacy._id] } });
  await Referral.deleteMany({ _id: referralDoc._id });

  console.log("🎉 All 8 OTP Referral tests passed successfully!");
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("❌ Test suite failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
