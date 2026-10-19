require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const User = require('./models/User');
const { clearPurchasedItemsFromCart } = require('./services/cartCleanupService');

async function runTests() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB for Testing");

  // TEST 1: Concurrency / Race Condition on Payment Verify
  console.log("\\n--- TEST 1: Atomic State Transition ---");
  const testOrderId = "order_rc_" + Date.now();
  const order1 = new Order({
    orderId: testOrderId,
    razorpayOrderId: testOrderId,
    paymentStatus: "Pending",
    paymentMethod: "razorpay",
    deliveryAddress: "Test Address",
    totalAmount: 100,
    user: { name: "Test", phone: "123", location: "test loc" }
  });
  await order1.save();
  console.log("Created Pending Order");

  async function simulatePaymentVerify() {
    const lockedOrder = await Order.findOneAndUpdate(
      { razorpayOrderId: testOrderId, paymentStatus: "Pending" },
      { $set: { paymentStatus: "Processing" } },
      { new: true }
    );
    return lockedOrder ? true : false;
  }

  const results = await Promise.all([
    simulatePaymentVerify(),
    simulatePaymentVerify(),
    simulatePaymentVerify(),
    simulatePaymentVerify(),
    simulatePaymentVerify()
  ]);

  const successCount = results.filter(r => r).length;
  console.log("5 concurrent requests fired.");
  console.log(`Successful Pending->Processing transitions: ${successCount}`);
  if (successCount === 1) console.log("✅ TEST 1 PASSED");
  else console.log("❌ TEST 1 FAILED");

  // TEST 2: Transaction Rollback
  console.log("\\n--- TEST 2: Transaction Rollback ---");
  const prodA = new Product({ name: "Prod A", stock: 10, price: 10, images: ["a.jpg"], category: new mongoose.Types.ObjectId() });
  const prodB = new Product({ name: "Prod B", stock: 1, price: 10, images: ["b.jpg"], category: new mongoose.Types.ObjectId() });
  await prodA.save();
  await prodB.save();

  const session = await mongoose.startSession();
  let txnAborted = false;
  try {
    await session.withTransaction(async () => {
      const rA = await Product.updateOne(
        { _id: prodA._id, stock: { $gte: 5 } },
        { $inc: { stock: -5 } },
        { session }
      );
      if (rA.modifiedCount === 0) throw new Error("A failed");

      const rB = await Product.updateOne(
        { _id: prodB._id, stock: { $gte: 2 } },
        { $inc: { stock: -2 } },
        { session }
      );
      if (rB.modifiedCount === 0) throw new Error("Insufficient stock for B");
    });
  } catch (err) {
    txnAborted = true;
    console.log("Transaction aborted as expected due to:", err.message);
  } finally {
    session.endSession();
  }

  const checkA = await Product.findById(prodA._id);
  console.log("Prod A stock after rollback (expected 10):", checkA.stock);
  if (txnAborted && checkA.stock === 10) console.log("✅ TEST 2 PASSED");
  else console.log("❌ TEST 2 FAILED");

  // TEST 3: Borzo Idempotency & Retries Claim
  console.log("\\n--- TEST 3: Borzo Retry Claim ---");
  const borzoOrderId = "order_bz_" + Date.now();
  const order3 = new Order({
    orderId: borzoOrderId,
    borzoDeliveryStatus: "pending_dispatch",
    paymentStatus: "Paid",
    orderStatus: "Order Placed",
    paymentMethod: "razorpay",
    deliveryAddress: "Test Address",
    totalAmount: 200,
    user: { name: "Test", phone: "123", location: "test loc" }
  });
  await order3.save();
  
  async function simulateWorkerClaim() {
    const claimed = await Order.findOneAndUpdate(
      { _id: order3._id, borzoDeliveryStatus: "pending_dispatch" },
      { $set: { borzoDeliveryStatus: "dispatching" } },
      { new: true }
    );
    return claimed ? true : false;
  }

  const claimResults = await Promise.all([
    simulateWorkerClaim(),
    simulateWorkerClaim(),
    simulateWorkerClaim()
  ]);
  const claimCount = claimResults.filter(r => r).length;
  console.log(`Concurrent workers claiming dispatch. Successful claims: ${claimCount}`);
  if (claimCount === 1) console.log("✅ TEST 3 PASSED");
  else console.log("❌ TEST 3 FAILED");

  // TEST 4: Quantity-Aware Cart Race
  console.log("\\n--- TEST 4: Quantity-Aware Cart Race ---");
  const testUserId = new mongoose.Types.ObjectId();
  const cartProdId = new mongoose.Types.ObjectId();
  const cart = new Cart({
    userId: testUserId.toString(),
    items: [{ productId: cartProdId.toString(), quantity: 5 }]
  });
  await cart.save();

  console.log("Cart initial quantity: 5. Purchasing 2...");
  await clearPurchasedItemsFromCart(testUserId.toString(), [{ productId: cartProdId.toString(), quantity: 2 }]);
  
  await Cart.updateOne(
    { userId: testUserId.toString(), "items.productId": cartProdId.toString() },
    { $inc: { "items.$.quantity": 3 } }
  );

  const finalCart = await Cart.findOne({ userId: testUserId.toString() });
  const finalQty = finalCart.items[0].quantity;
  console.log(`Final Cart Quantity (5 - 2 + 3): ${finalQty}`);
  if (finalQty === 6) console.log("✅ TEST 4 PASSED");
  else console.log("❌ TEST 4 FAILED");

  // Clean up
  await Order.deleteMany({ orderId: { $in: [testOrderId, borzoOrderId] } });
  await Product.deleteMany({ _id: { $in: [prodA._id, prodB._id] } });
  await Cart.deleteOne({ userId: testUserId.toString() });
  
  mongoose.disconnect();
}

runTests().catch(console.error);
