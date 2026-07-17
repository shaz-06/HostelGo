const mongoose = require("mongoose");
const assert = require("assert");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const BuyCoinWallet = require("../models/BuyCoinWallet");
const BuyCoinTransaction = require("../models/BuyCoinTransaction");
const WalletService = require("../services/WalletService");

async function runTests() {
  console.log("🚀 Starting BuyCoins Integration Test Suite...");
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to test database.");

    // Clean up or prepare a test user prefix
    const testEmailPrefix = `test-loyalty-${Date.now()}`;
    
    // Helper to create test user
    const createTestUser = async (phoneSuffix) => {
      // Dynamic suffix based on timestamp
      const uniqueSuffix = String(Date.now()).slice(-4) + phoneSuffix;
      const u = new User({
        name: "Test Loyalty User",
        email: `${testEmailPrefix}-${phoneSuffix}@example.com`,
        phone: `99${uniqueSuffix.slice(-8)}`,
        password: "testPassword123"
      });
      return await u.save();
    };

    // --- TEST 1: Welcome Bonus & Concurrency Race Condition ---
    console.log("\n🧪 Test 1: Welcome Bonus & Concurrency...");
    const user1 = await createTestUser("111101");
    
    // Call grantWelcomeBonus simultaneously to simulate concurrent logins
    await Promise.all([
      WalletService.grantWelcomeBonus(user1._id, user1.email),
      WalletService.grantWelcomeBonus(user1._id, user1.email),
      WalletService.grantWelcomeBonus(user1._id, user1.email)
    ]);

    // Verify exactly one Welcome Bonus transaction exists
    const txs = await BuyCoinTransaction.find({ userId: user1._id, type: "WELCOME_BONUS" });
    assert.strictEqual(txs.length, 1, "Duplicate welcome bonuses were created!");
    
    // Verify wallet balance is exactly 20
    const wallet1 = await WalletService.recalculate(user1._id, user1.email);
    assert.strictEqual(wallet1.availableCoins, 20, "Wallet balance should be 20 after welcome bonus.");
    console.log("✅ Welcome Bonus & Concurrency passed.");

    // --- TEST 2: Order Rewards Idempotency & Green Pledge ---
    console.log("\n🧪 Test 2: Order Rewards & Idempotency...");
    const user2 = await createTestUser("111102");
    
    const fakeOrder = {
      _id: new mongoose.Types.ObjectId(),
      userId: user2._id,
      orderStatus: "Delivered",
      products: [
        { price: 150, quantity: 2 }, // 300 subtotal
        { price: 50, quantity: 4 }  // 200 subtotal -> total subtotal = 500
      ],
      noBagPledge: true,
      buyCoinsDiscount: 0,
      couponDiscount: 0,
      save: async function() { return this; }
    };

    // Run rewardOrder twice concurrently to simulate webhook retries
    await Promise.all([
      WalletService.rewardOrder(fakeOrder),
      WalletService.rewardOrder(fakeOrder)
    ]);

    // Order of 500 should earn 5 coins. Green Pledge earns 2. Total = 7 coins.
    const wallet2 = await WalletService.recalculate(user2._id, user2.email);
    assert.strictEqual(wallet2.availableCoins, 7, `Expected 7 coins, got ${wallet2.availableCoins}`);

    // Verify transaction list count
    const txCount = await BuyCoinTransaction.countDocuments({ userId: user2._id });
    assert.strictEqual(txCount, 2, "Expected exactly 2 transactions (Order Reward + Green Pledge).");
    console.log("✅ Order Rewards & Idempotency passed.");

    // --- TEST 3: Redemptions & Negative Balances Prevention ---
    console.log("\n🧪 Test 3: Redemptions & Insufficient Balance...");
    const user3 = await createTestUser("111103");
    await WalletService.grantWelcomeBonus(user3._id, user3.email); // Starts at 20 coins
    
    // Attempt to debit 25 coins (must fail)
    try {
      await WalletService.debit(user3._id, user3.email, 25, "REDEMPTION", "Over-redeeming test", { source: "API" }, `${testEmailPrefix}-debit-fail`);
      assert.fail("Debit should have failed due to insufficient balance.");
    } catch (err) {
      assert.ok(err.message.includes("Insufficient BuyCoins balance"), "Unexpected error message: " + err.message);
    }

    // Debit 15 coins (must succeed)
    await WalletService.debit(user3._id, user3.email, 15, "REDEMPTION", "Valid redemption test", { source: "API" }, `${testEmailPrefix}-debit-success`);
    const wallet3 = await WalletService.recalculate(user3._id, user3.email);
    
    // Print diagnostics
    const test3Txs = await BuyCoinTransaction.find({ userId: user3._id }).lean();
    console.log("TEST 3 DIAGNOSTICS:");
    console.log("Wallet Cached:", wallet3);
    console.log("Transactions:", JSON.stringify(test3Txs, null, 2));

    assert.strictEqual(wallet3.availableCoins, 5, "Wallet balance should be 5 after debiting 15 from 20.");
    console.log("✅ Redemptions & Negative Balances passed.");

    // --- TEST 4: Admin Adjustments & Auditing ---
    console.log("\n🧪 Test 4: Admin Adjustments & Audit Logs...");
    const user4 = await createTestUser("111104");
    await WalletService.grantWelcomeBonus(user4._id, user4.email); // Starts at 20

    const auditMetadata = {
      adminId: new mongoose.Types.ObjectId(),
      adminName: "Senior Admin",
      source: "ADMIN_DASHBOARD",
      requestId: "REQ-XYZ-123",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0"
    };

    // Admin credits 10 coins
    const creditTx = await WalletService.credit(
      user4._id,
      user4.email,
      10,
      "ADMIN_CREDIT",
      "Compensation for cold food",
      auditMetadata,
      `${testEmailPrefix}-admin-credit-1`
    );

    assert.strictEqual(creditTx.audit.adminName, "Senior Admin");
    assert.strictEqual(creditTx.audit.previousBalance, 20);
    assert.strictEqual(creditTx.audit.newBalance, 30);
    assert.strictEqual(creditTx.audit.ipAddress, "192.168.1.1");

    const wallet4 = await WalletService.recalculate(user4._id, user4.email);
    assert.strictEqual(wallet4.availableCoins, 30, "Expected balance to be 30 after admin credit.");
    console.log("✅ Admin Adjustments & Audit Logs passed.");

    // --- TEST 5: Transactions Rollbacks ---
    console.log("\n🧪 Test 5: Transactional Rollback...");
    const user5 = await createTestUser("111105");
    await WalletService.grantWelcomeBonus(user5._id, user5.email); // 20 coins
    
    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        // Step 1: Valid credit
        await WalletService.credit(user5._id, user5.email, 15, "ADMIN_CREDIT", "Good credit", {}, `${testEmailPrefix}-rollback-c1`, dbSession);
        
        // Step 2: Trigger error (e.g. non-integer amount)
        await WalletService.credit(user5._id, user5.email, 5.5, "ADMIN_CREDIT", "Invalid floating amount", {}, `${testEmailPrefix}-rollback-c2`, dbSession);
      });
    } catch (err) {
      // Expect validation error
      assert.ok(
        err.message.includes("is not an integer value") || 
        err.message.includes("positive integer") || 
        err.name === "ValidationError", 
        "Unexpected error: " + err.message
      );
    } finally {
      await dbSession.endSession();
    }

    // Verify balance remains exactly 20 (rolled back the valid credit)
    const wallet5 = await WalletService.recalculate(user5._id, user5.email);
    assert.strictEqual(wallet5.availableCoins, 20, "Expected rolled back balance to remain at 20.");
    console.log("✅ Transactional Rollback passed.");

    // --- TEST 6: Reconciliation Tooling ---
    console.log("\n🧪 Test 6: Wallet Cache Reconciliation...");
    const user6 = await createTestUser("111106");
    await WalletService.grantWelcomeBonus(user6._id, user6.email); // 20 coins
    
    // Corrupt cached value on User document
    await User.updateOne({ _id: user6._id }, { $set: { buyCoins: 999 } });

    // Run reconciliation in DRY_RUN mode
    const dryRunReport = await WalletService.reconcile({ userId: user6._id, mode: "DRY_RUN" });
    assert.strictEqual(dryRunReport.mismatchesCount, 1, "Dry Run should have detected one mismatch.");
    assert.strictEqual(dryRunReport.repairedCount, 0, "Dry Run should not repair mismatches.");

    // Corrupt check again (verify it is still corrupted)
    const userCorrupted = await User.findById(user6._id);
    assert.strictEqual(userCorrupted.buyCoins, 999, "Cached balance should still be corrupted.");

    // Run reconciliation in REPAIR mode
    const repairReport = await WalletService.reconcile({ userId: user6._id, mode: "REPAIR" });
    assert.strictEqual(repairReport.mismatchesCount, 1, "Repair Mode should detect the mismatch.");
    assert.strictEqual(repairReport.repairedCount, 1, "Repair Mode should repair the mismatch.");

    // Verify it is repaired
    const userRepaired = await User.findById(user6._id);
    assert.strictEqual(userRepaired.buyCoins, 20, "Cached balance should be repaired to 20.");
    console.log("✅ Wallet Cache Reconciliation passed.");

    // Clean up test data
    console.log("\n🧹 Cleaning up test data...");
    await User.deleteMany({ email: { $regex: new RegExp("^" + testEmailPrefix) } });
    await BuyCoinWallet.deleteMany({ email: { $regex: new RegExp("^" + testEmailPrefix) } });
    await BuyCoinTransaction.deleteMany({ email: { $regex: new RegExp("^" + testEmailPrefix) } });
    console.log("✅ Cleanup completed.");

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉\n");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Test execution failed with error:", error);
    process.exit(1);
  }
}

runTests();
