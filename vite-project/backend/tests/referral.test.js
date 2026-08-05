const mongoose = require("mongoose");
const assert = require("assert");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const Referral = require("../models/Referral");
const ReferralAuditLog = require("../models/ReferralAuditLog");
const Order = require("../models/Order");
const Config = require("../models/Config");
const BuyCoinTransaction = require("../models/BuyCoinTransaction");

const referralCodeService = require("../services/referralCodeService");
const referralService = require("../services/referralService");
const EventBus = require("../services/EventBus");

async function runTests() {
  console.log("🚀 Starting Refer & Earn Integration & Recovery Test Suite...");

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database.");

    // Initialize EventBus subscriptions for the test run
    EventBus.subscribe("order.delivered", async (payload) => {
      await referralService.processOrderDelivery(payload);
    });
    EventBus.subscribe("order.cancelled", async (payload) => {
      await referralService.processOrderCancellation(payload);
    });

    // Clean up previous test users and referrals
    const testSuffix = `ref-test-${Date.now()}`;
    
    // Helper to create test user
    const createTestUser = async (name, emailSuffix) => {
      const uniquePhone = "99" + String(Math.floor(10000000 + Math.random() * 90000000));
      const u = new User({
        name,
        email: `${name.toLowerCase()}-${emailSuffix}-${Math.floor(Math.random() * 1000)}@example.com`,
        phone: uniquePhone,
        password: "testPassword123"
      });
      u.referralCode = await referralCodeService.generateUniqueCode(name);
      return await u.save();
    };

    // Initialize/reset referral settings config document
    let config = await Config.findOne({ key: "referral_config" });
    if (!config) {
      config = new Config({ key: "referral_config" });
    }
    config.referralEnabled = true;
    config.referralMinOrder = 199;
    config.referrerReward = 75;
    config.referredUserReward = 50;
    config.referralConfigVersion = 1;
    config.referralExpiryDays = 90;
    await config.save();
    referralService.clearConfigCache();

    // ==========================================
    // TEST 1: Referral Code Generation
    // ==========================================
    console.log("\n🧪 Test 1: Code generation and collision retry...");
    const userA = await createTestUser("UserA", testSuffix);
    assert.ok(userA.referralCode, "Referral code should be generated");
    assert.strictEqual(userA.referralCode.startsWith("USER"), true, "Code should start with name prefix");
    console.log(`Generated code: ${userA.referralCode}`);
    console.log("✅ Test 1 passed.");

    // ==========================================
    // TEST 2: Self Referral Prevention
    // ==========================================
    console.log("\n🧪 Test 2: Self referral prevention...");
    const selfLinkResult = await referralService.linkReferral(userA, userA.referralCode, "corr-self");
    assert.strictEqual(selfLinkResult.success, false, "Should block self-referrals");
    assert.strictEqual(selfLinkResult.message.includes("yourself"), true);
    console.log("✅ Test 2 passed.");

    // ==========================================
    // TEST 3: Linking Referrer & Expiry snapshot
    // ==========================================
    console.log("\n🧪 Test 3: Link referrer & save snapshot values...");
    const userB = await createTestUser("UserB", testSuffix);
    const linkResult = await referralService.linkReferral(userB, userA.referralCode, "corr-link");
    assert.strictEqual(linkResult.success, true, "Should link successfully");

    const refDoc = await Referral.findOne({ referredUser: userB._id });
    assert.ok(refDoc, "Referral document should be created in DB");
    assert.strictEqual(refDoc.status, "PENDING", "Status should be PENDING");
    assert.strictEqual(refDoc.campaignSnapshot.minOrder, 199, "Snapshot minOrder should match current config");
    assert.strictEqual(refDoc.campaignSnapshot.referrerReward, 75, "Snapshot referrerReward should match config");

    const refUser = await User.findById(userB._id);
    assert.strictEqual(String(refUser.referredBy), String(userA._id), "UserB referredBy should be set to UserA");
    
    const referrerUser = await User.findById(userA._id);
    assert.strictEqual(referrerUser.pendingReferrals, 1, "Referrer pendingReferrals cached counter should increment");
    console.log("✅ Test 3 passed.");

    // ==========================================
    // TEST 4: Circular referral loop check
    // ==========================================
    console.log("\n🧪 Test 4: Circular referral loop check...");
    const circularResult = await referralService.linkReferral(userA, userB.referralCode, "corr-circular");
    assert.strictEqual(circularResult.success, false, "Should block circular referral loop");
    console.log("✅ Test 4 passed.");

    const createTestOrder = async (uid, totalAmt) => {
      const ord = new Order({
        userId: uid,
        totalAmount: totalAmt,
        orderStatus: "Delivered",
        paymentStatus: "Paid",
        deliveryAddress: "Test Address, Room 101, Aravali Hostel",
        paymentMethod: "cod",
        orderId: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        user: {
          name: "Test User B",
          phone: "9988776655",
          location: "Aravali Hostel"
        }
      });
      return await ord.save();
    };

    // ==========================================
    // TEST 5: Order threshold delivery qualification
    // ==========================================
    console.log("\n🧪 Test 5: Qualifying order delivery triggers event...");

    // 5a. Order below ₹199 (should not qualify)
    const order1 = await createTestOrder(userB._id, 100);

    // Emit delivered event
    EventBus.publish("order.delivered", {
      eventId: `ev-${order1._id}-small`,
      eventType: "order.delivered",
      correlationId: `corr-${order1._id}`,
      occurredAt: new Date().toISOString(),
      orderId: order1._id.toString(),
      userId: userB._id.toString(),
      orderTotal: 100
    });

    // Wait a brief moment for async event dispatcher
    await new Promise(r => setTimeout(r, 300));
    
    let checkRef = await Referral.findOne({ referredUser: userB._id });
    assert.strictEqual(checkRef.status, "PENDING", "Should remain pending since order is below 199 threshold");

    // 5b. Order matching/exceeding ₹199 (should qualify & complete)
    const order2 = await createTestOrder(userB._id, 250);

    EventBus.publish("order.delivered", {
      eventId: `ev-${order2._id}-qualify`,
      eventType: "order.delivered",
      correlationId: `corr-${order2._id}`,
      occurredAt: new Date().toISOString(),
      orderId: order2._id.toString(),
      userId: userB._id.toString(),
      orderTotal: 250
    });

    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 200));
      checkRef = await Referral.findOne({ referredUser: userB._id });
      if (checkRef.status === "COMPLETED") break;
    }
    assert.strictEqual(checkRef.status, "COMPLETED", "Referral should transition to COMPLETED");
    assert.strictEqual(checkRef.rewardCredited, true, "Reward should be marked credited");

    // Verify wallet credits
    const referrerWal = await User.findById(userA._id);
    assert.strictEqual(referrerWal.successfulReferrals, 1, "Referrer successfulReferrals cached counter should increment");
    assert.strictEqual(referrerWal.pendingReferrals, 0, "Referrer pendingReferrals cached counter should decrement");
    assert.strictEqual(referrerWal.referralWalletEarned, 75, "Referrer wallet earned cached counter should set to 75");

    const referredWal = await User.findById(userB._id);
    assert.strictEqual(referredWal.referralRewardClaimed, true, "Referred user referralRewardClaimed should be true");
    console.log("✅ Test 5 passed.");

    // ==========================================
    // TEST 6: Double Spend / Idempotency Prevention
    // ==========================================
    console.log("\n🧪 Test 6: Idempotency check prevents duplicate payouts...");
    // Simulate duplicate delivery event processing for the same order
    await referralService.processOrderDelivery({
      orderId: order2._id.toString(),
      userId: userB._id.toString(),
      orderTotal: 250,
      correlationId: "corr-duplicate"
    });

    const finalReferrer = await User.findById(userA._id);
    assert.strictEqual(finalReferrer.referralWalletEarned, 75, "Referrer earnings should remain at 75");
    console.log("✅ Test 6 passed.");

    // ==========================================
    // TEST 7: Expiration Enforcement
    // ==========================================
    console.log("\n🧪 Test 7: Expiry enforcement blocks qualification...");
    const userC = await createTestUser("UserC", testSuffix);
    const userD = await createTestUser("UserD", testSuffix);

    // Link
    await referralService.linkReferral(userD, userC.referralCode, "corr-exp-link");
    
    // Artificially modify expiresAt to past
    const expRef = await Referral.findOne({ referredUser: userD._id });
    expRef.expiresAt = new Date(Date.now() - 1000);
    await expRef.save();

    // Attempt delivery qualification
    const orderExpired = await createTestOrder(userD._id, 300);

    await referralService.processOrderDelivery({
      orderId: orderExpired._id.toString(),
      userId: userD._id.toString(),
      orderTotal: 300,
      correlationId: "corr-expired-try"
    });

    const expiredRef = await Referral.findOne({ referredUser: userD._id });
    assert.strictEqual(expiredRef.status, "EXPIRED", "Referral should transition to EXPIRED status");
    assert.strictEqual(expiredRef.rewardCredited, false, "No reward should be issued");
    console.log("✅ Test 7 passed.");

    // ==========================================
    // TEST 8: Reconciliation Utility Repair
    // ==========================================
    console.log("\n🧪 Test 8: Reconciliation utility repairs inconsistent cached stats...");
    // Corrupt referrer statistics
    const userA_corrupted = await User.findById(userA._id);
    userA_corrupted.successfulReferrals = 99;
    userA_corrupted.pendingReferrals = 99;
    userA_corrupted.referralWalletEarned = 999;
    await userA_corrupted.save();

    // Trigger maintenance reconciliation
    const { rebuildUserStats } = require("../services/referralService");
    await rebuildUserStats(userA._id);

    const userA_repaired = await User.findById(userA._id);
    assert.strictEqual(userA_repaired.successfulReferrals, 1, "Should rebuild correct completed count");
    assert.strictEqual(userA_repaired.pendingReferrals, 0, "Should rebuild correct pending count");
    assert.strictEqual(userA_repaired.referralWalletEarned, 75, "Should rebuild correct earned sum");
    console.log("✅ Test 8 passed.");

    console.log("\n🎉 All Referral system backend integration tests PASSED successfully!");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Test Suite Failed with exception:", err);
    process.exit(1);
  }
}

runTests();
