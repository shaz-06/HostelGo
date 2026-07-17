const mongoose = require("mongoose");
const assert = require("assert");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const BuyCoinTransaction = require("../models/BuyCoinTransaction");
const WalletService = require("../services/WalletService");
const { WELCOME_BONUS } = require("../config/constants");

async function runTests() {
  console.log("🚀 Starting Welcome Bonus Integration & Recovery Test Suite...");

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database.");

    const testEmailPrefix = `welcome-bonus-test-${Date.now()}`;

    // Helper to create test user
    const createTestUser = async (phoneSuffix) => {
      const uniqueSuffix = String(Date.now()).slice(-4) + phoneSuffix;
      const u = new User({
        name: "Test Welcome User",
        email: `${testEmailPrefix}-${phoneSuffix}@example.com`,
        phone: `98${uniqueSuffix.slice(-8)}`,
        password: "testPassword123"
      });
      return await u.save();
    };

    // --- TEST 1: Happy Path Signup ---
    console.log("\n🧪 Test 1: Happy Path Signup (Welcome Bonus given once)...");
    const user1 = await createTestUser("100001");
    await WalletService.grantWelcomeBonus(user1._id, user1.email);

    // Verify user balance & claim status
    const updatedUser1 = await User.findById(user1._id);
    assert.strictEqual(updatedUser1.buyCoins, WELCOME_BONUS, "User balance should match WELCOME_BONUS.");
    assert.strictEqual(updatedUser1.buyCoinsStats.welcomeBonusClaimed, true, "welcomeBonusClaimed must be true.");

    // Verify transaction record & balanceAfter
    const txs1 = await BuyCoinTransaction.find({ userId: user1._id, type: "WELCOME_BONUS" });
    assert.strictEqual(txs1.length, 1, "Expected exactly 1 WELCOME_BONUS transaction.");
    assert.strictEqual(txs1[0].amount, WELCOME_BONUS, `Expected amount to be ${WELCOME_BONUS}.`);
    assert.strictEqual(txs1[0].balanceAfter, WELCOME_BONUS, `Expected balanceAfter to be ${WELCOME_BONUS}.`);
    console.log("✅ Test 1 passed.");

    // --- TEST 2: Existing User Login / Retry ---
    console.log("\n🧪 Test 2: Existing User Login (no welcome bonus awarded again)...");
    await WalletService.grantWelcomeBonus(user1._id, user1.email);
    
    // Verify no new transaction and balance unchanged
    const txCount2 = await BuyCoinTransaction.countDocuments({ userId: user1._id, type: "WELCOME_BONUS" });
    assert.strictEqual(txCount2, 1, "Should still have exactly 1 welcome bonus transaction.");
    
    const reFetchedUser1 = await User.findById(user1._id);
    assert.strictEqual(reFetchedUser1.buyCoins, WELCOME_BONUS, "Balance should remain unchanged.");
    console.log("✅ Test 2 passed.");

    // --- TEST 3: Concurrency Race Condition ---
    console.log("\n🧪 Test 3: Concurrency Race Condition...");
    const user3 = await createTestUser("100003");
    
    // Run multiple grant attempts simultaneously
    await Promise.all([
      WalletService.grantWelcomeBonus(user3._id, user3.email),
      WalletService.grantWelcomeBonus(user3._id, user3.email),
      WalletService.grantWelcomeBonus(user3._id, user3.email)
    ]);

    const txs3 = await BuyCoinTransaction.find({ userId: user3._id, type: "WELCOME_BONUS" });
    assert.strictEqual(txs3.length, 1, "Duplicate welcome bonuses created concurrently!");
    
    const updatedUser3 = await User.findById(user3._id);
    assert.strictEqual(updatedUser3.buyCoins, WELCOME_BONUS, "Concurrency balance should be exactly WELCOME_BONUS.");
    console.log("✅ Test 3 passed.");

    // --- TEST 4: Transaction Rollback ---
    console.log("\n🧪 Test 4: Transaction Rollback...");
    const user4 = await createTestUser("100004");

    // Force an error inside a custom execution block that acts like grantWelcomeBonus
    try {
      const session = await mongoose.startSession();
      await session.withTransaction(async () => {
        // 1. Insert transaction
        const bonusTx = new BuyCoinTransaction({
          userId: user4._id,
          email: user4.email,
          type: "WELCOME_BONUS",
          status: "COMPLETED",
          amount: WELCOME_BONUS,
          coins: WELCOME_BONUS,
          description: "Welcome Bonus",
          source: "Buyto",
          balanceAfter: WELCOME_BONUS,
          idempotencyKey: `welcome:${user4._id}`
        });
        await bonusTx.save({ session });

        // 2. Update user
        await User.findOneAndUpdate(
          { _id: user4._id },
          { $inc: { buyCoins: WELCOME_BONUS }, $set: { "buyCoinsStats.welcomeBonusClaimed": true } },
          { session }
        );

        // 3. Force throw error to abort transaction
        throw new Error("Forced transaction rollback test error");
      });
      session.endSession();
      assert.fail("Should have thrown error and rolled back.");
    } catch (err) {
      assert.strictEqual(err.message, "Forced transaction rollback test error");
    }

    // Verify user balance & claim status was NOT modified
    const rolledBackUser = await User.findById(user4._id);
    assert.strictEqual(rolledBackUser.buyCoins, 0, "User balance should remain 0 after rollback.");
    assert.strictEqual(rolledBackUser.buyCoinsStats.welcomeBonusClaimed, false, "welcomeBonusClaimed should remain false.");

    // Verify transaction was NOT created
    const rolledBackTxCount = await BuyCoinTransaction.countDocuments({ userId: user4._id });
    assert.strictEqual(rolledBackTxCount, 0, "No transactions should exist for rolled back signup.");
    console.log("✅ Test 4 passed.");

    // --- TEST 5: Recovery and Retry Scenario ---
    console.log("\n🧪 Test 5: Recovery and Retry Scenario...");
    const user5 = await createTestUser("100005");

    // 1. First run fails mid-way (due to connection error or mock error)
    let failedOnce = false;
    try {
      const session = await mongoose.startSession();
      await session.withTransaction(async () => {
        // Create transaction
        const bonusTx = new BuyCoinTransaction({
          userId: user5._id,
          email: user5.email,
          type: "WELCOME_BONUS",
          status: "COMPLETED",
          amount: WELCOME_BONUS,
          coins: WELCOME_BONUS,
          description: "Welcome Bonus",
          source: "Buyto",
          balanceAfter: WELCOME_BONUS,
          idempotencyKey: `welcome:${user5._id}`
        });
        await bonusTx.save({ session });

        // Throw error before updating user balance (mimicking a mid-request crash/failure)
        throw new Error("Simulated connection crash mid-transaction");
      });
      session.endSession();
    } catch (err) {
      assert.strictEqual(err.message, "Simulated connection crash mid-transaction");
      failedOnce = true;
    }

    assert.ok(failedOnce, "Simulation of first failure failed.");

    // 2. Retry the operation
    await WalletService.grantWelcomeBonus(user5._id, user5.email);

    // 3. Verify exactly 1 transaction successfully created and balance correct
    const txs5 = await BuyCoinTransaction.find({ userId: user5._id, type: "WELCOME_BONUS" });
    assert.strictEqual(txs5.length, 1, "Exactly one transaction should succeed after retry.");
    
    const reFetchedUser5 = await User.findById(user5._id);
    assert.strictEqual(reFetchedUser5.buyCoins, WELCOME_BONUS, "User should end up with welcome bonus balance.");
    assert.strictEqual(reFetchedUser5.buyCoinsStats.welcomeBonusClaimed, true, "welcomeBonusClaimed should be true after retry.");
    console.log("✅ Test 5 passed.");

    console.log("\n🎉 All integration and recovery tests passed successfully!");
    process.exit(0);

  } catch (err) {
    console.error("❌ Test Suite failed:", err);
    process.exit(1);
  }
}

runTests();
