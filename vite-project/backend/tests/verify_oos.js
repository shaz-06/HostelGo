const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Product = require("../models/Product");
const Order = require("../models/Order");

async function runTests() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Clean up any old test documents
  await Product.deleteMany({ name: /Test OOS Product/ });
  await Order.deleteMany({ "user.name": "Test OOS User" });

  try {
    console.log("\n--- TEST CASE 1: Product availability & stock checks ---");
    // Non-variant product
    const p1 = new Product({
      name: "Test OOS Product 1",
      price: 100,
      stock: 3,
      category: "Test",
      subCategory: "TestSub",
      image: "test.png"
    });
    await p1.save();

    // Variant product
    const p2 = new Product({
      name: "Test OOS Product 2",
      price: 200,
      stock: 10,
      category: "Test",
      subCategory: "TestSub",
      image: "test2.png",
      variants: [
        { weight: "500g", price: 100, originalPrice: 120, stock: 5 },
        { weight: "1kg", price: 200, originalPrice: 240, stock: 0 }
      ]
    });
    await p2.save();

    // Verify p1 availability rules
    console.log(`Product 1 (stock: 3) OOS? ${p1.stock <= 0 ? "YES" : "NO"}`);
    if (p1.stock <= 0) throw new Error("Product 1 should not be OOS");

    // Verify p2 variant availability rules
    const v1_OOS = p2.variants[0].stock <= 0;
    const v2_OOS = p2.variants[1].stock <= 0;
    const p2_OOS = p2.variants.every(v => v.stock <= 0);
    console.log(`Product 2 Variant 500g (stock: 5) OOS? ${v1_OOS ? "YES" : "NO"}`);
    console.log(`Product 2 Variant 1kg (stock: 0) OOS? ${v2_OOS ? "YES" : "NO"}`);
    console.log(`Product 2 (all variants OOS?)? ${p2_OOS ? "YES" : "NO"}`);
    if (v1_OOS || !v2_OOS || p2_OOS) throw new Error("Variant stock rules violated");

    console.log("\n--- TEST CASE 2: Atomic non-variant stock decrement ---");
    // Decrement 2 from p1
    let decResult = await Product.updateOne(
      { _id: p1._id, stock: { $gte: 2 } },
      { $inc: { stock: -2 } }
    );
    let updatedP1 = await Product.findById(p1._id);
    console.log(`Decremented 2 units. Modified count: ${decResult.modifiedCount}, New stock: ${updatedP1.stock}`);
    if (decResult.modifiedCount !== 1 || updatedP1.stock !== 1) throw new Error("Decrement failed");

    // Attempt to decrement 2 again (should fail because stock is 1)
    let decResultFail = await Product.updateOne(
      { _id: p1._id, stock: { $gte: 2 } },
      { $inc: { stock: -2 } }
    );
    let updatedP1Fail = await Product.findById(p1._id);
    console.log(`Attempted to decrement 2 units (needs 2, has 1). Modified count: ${decResultFail.modifiedCount}, Stock remained: ${updatedP1Fail.stock}`);
    if (decResultFail.modifiedCount !== 0) throw new Error("Allowed negative/oversell stock decrement");

    console.log("\n--- TEST CASE 3: Atomic variant stock decrement ($elemMatch) ---");
    // Decrement 3 from 500g variant
    let varResult = await Product.updateOne(
      {
        _id: p2._id,
        variants: {
          $elemMatch: {
            weight: "500g",
            stock: { $gte: 3 }
          }
        }
      },
      {
        $inc: { "variants.$.stock": -3 }
      }
    );
    let updatedP2 = await Product.findById(p2._id);
    console.log(`Decremented 3 units from 500g. Modified count: ${varResult.modifiedCount}, New stock: ${updatedP2.variants[0].stock}`);
    if (varResult.modifiedCount !== 1 || updatedP2.variants[0].stock !== 2) throw new Error("Variant decrement failed");

    // Attempt to decrement 3 units from 500g again (should fail, has 2)
    let varResultFail = await Product.updateOne(
      {
        _id: p2._id,
        variants: {
          $elemMatch: {
            weight: "500g",
            stock: { $gte: 3 }
          }
        }
      },
      {
        $inc: { "variants.$.stock": -3 }
      }
    );
    let updatedP2Fail = await Product.findById(p2._id);
    console.log(`Attempted to decrement 3 units from 500g (has 2). Modified count: ${varResultFail.modifiedCount}, Stock remained: ${updatedP2Fail.variants[0].stock}`);
    if (varResultFail.modifiedCount !== 0) throw new Error("Allowed negative variant stock");

    console.log("\n--- TEST CASE 4: Rollback logic on partial order stock failure ---");
    const orderItems = [
      { productId: p1._id, quantity: 1, hasVariants: false },
      { productId: p2._id, weight: "500g", quantity: 3, hasVariants: true }
    ];

    let allSuccess = true;
    const rollbacks = [];
    for (const item of orderItems) {
      let result;
      if (item.hasVariants) {
        result = await Product.updateOne(
          {
            _id: item.productId,
            variants: {
              $elemMatch: {
                weight: item.weight,
                stock: { $gte: item.quantity }
              }
            }
          },
          { $inc: { "variants.$.stock": -item.quantity } }
        );
      } else {
        result = await Product.updateOne(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );
      }

      if (result.modifiedCount === 0) {
        console.log(`Stock reduction failed for item: ${item.productId}. Triggering rollbacks...`);
        allSuccess = false;
        break;
      } else {
        rollbacks.push(item);
      }
    }

    if (!allSuccess) {
      for (const rb of rollbacks) {
        if (rb.hasVariants) {
          await Product.updateOne(
            { _id: rb.productId, "variants.weight": rb.weight },
            { $inc: { "variants.$.stock": rb.quantity } }
          );
        } else {
          await Product.updateOne(
            { _id: rb.productId },
            { $inc: { stock: rb.quantity } }
          );
        }
      }
      console.log("Rollback completed successfully.");
    }

    const p1PostRollback = await Product.findById(p1._id);
    const p2PostRollback = await Product.findById(p2._id);
    console.log(`Product 1 stock post-rollback (expected 1): ${p1PostRollback.stock}`);
    console.log(`Product 2 500g variant stock post-rollback (expected 2): ${p2PostRollback.variants[0].stock}`);
    if (p1PostRollback.stock !== 1 || p2PostRollback.variants[0].stock !== 2) {
      throw new Error("Rollback failed to restore correct stock levels");
    }

    console.log("\n--- TEST CASE 5: Idempotency of stock decrement ---");
    const mockOrder = new Order({
      orderId: "TEST-OOS-ORDER-123",
      user: { name: "Test OOS User", phone: "1234567890", location: "Room 101" },
      products: [],
      totalAmount: 100,
      paymentMethod: "cod",
      deliveryAddress: "Test Address",
      inventoryDeducted: false
    });
    await mockOrder.save();

    console.log(`Order inventoryDeducted initially: ${mockOrder.inventoryDeducted}`);
    let wasDeductedFirst = false;
    if (!mockOrder.inventoryDeducted) {
      await Order.updateOne({ _id: mockOrder._id }, { $set: { inventoryDeducted: true } });
      wasDeductedFirst = true;
    }
    console.log(`First deduction processed: ${wasDeductedFirst}`);

    const updatedOrder = await Order.findById(mockOrder._id);
    let wasDeductedSecond = false;
    if (!updatedOrder.inventoryDeducted) {
      wasDeductedSecond = true;
    }
    console.log(`Second deduction processed (should be false): ${wasDeductedSecond}`);
    if (!wasDeductedFirst || wasDeductedSecond) {
      throw new Error("Idempotency check failed");
    }

    console.log("\n✅ ALL DATABASE TESTS PASSED SUCCESSFULLY!");

  } finally {
    console.log("Cleaning up test documents...");
    await Product.deleteMany({ name: /Test OOS Product/ });
    await Order.deleteMany({ "user.name": "Test OOS User" });
    await mongoose.disconnect();
    console.log("Database connection closed.");
  }
}

runTests().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
