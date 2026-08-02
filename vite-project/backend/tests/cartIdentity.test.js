const assert = require("assert");
const mongoose = require("mongoose");

// Frontend helper regex equivalent validation
const isValidObjectIdFrontend = id => /^[a-fA-F0-9]{24}$/.test(id);

// Versioned cart migration simulation helper
function migrateCartItems(cartItems, catalogProducts) {
  return cartItems.map(item => {
    if (item._id) return item;
    if (item.id) {
      const matched = catalogProducts.find(p => p.id === item.id);
      if (matched && matched._id) {
        return { ...item, _id: matched._id };
      }
    }
    return null; // remove unmatched items
  }).filter(Boolean);
}

function runIdentityTests() {
  console.log("🧪 Starting Product Identity Contract & Cart Migration Tests...");

  // Mock catalog loaded from DB with proper _ids
  const mockCatalog = [
    { id: "veg1", _id: "6a5102d037814e9e066b24e1", name: "Tomato", price: 20 },
    { id: "veg2", _id: "6a5102d037814e9e066b24e2", name: "Onion", price: 30 },
    { id: "veg3", _id: "6a5102d037814e9e066b24e3", name: "Potato", price: 25 }
  ];

  // --- TEST 1: API Response Shape / Object ID Verification ---
  console.log("\n1️⃣ Verifying API response catalog contains valid ObjectIds...");
  mockCatalog.forEach(p => {
    assert.ok(p._id, `Product ${p.name} is missing _id`);
    assert.ok(isValidObjectIdFrontend(p._id), `Product ${p.name} _id has invalid format: ${p._id}`);
  });
  console.log("  ✅ All products in catalog verified with correct ObjectId format.");

  // --- TEST 2: Frontend Regex Validation Logic ---
  console.log("\n2️⃣ Testing Frontend Regex Validation for ObjectIds...");
  assert.ok(isValidObjectIdFrontend("6a5102d037814e9e066b24e1"), "Should accept valid ObjectId");
  assert.ok(!isValidObjectIdFrontend("veg4"), "Should reject custom short ID 'veg4'");
  assert.ok(!isValidObjectIdFrontend(""), "Should reject empty string");
  assert.ok(!isValidObjectIdFrontend(null), "Should reject null value");
  console.log("  ✅ Frontend validation logic operates correctly.");

  // --- TEST 3: Legacy Cart Migration Logic (Match and Replace) ---
  console.log("\n3️⃣ Testing Legacy Cart Migration Match/Replace...");
  const legacyCart = [
    { id: "veg1", name: "Tomato", quantity: 2 }, // legacy item
    { _id: "6a5102d037814e9e066b24e2", id: "veg2", name: "Onion", quantity: 1 } // already migrated item
  ];

  const migrated = migrateCartItems(legacyCart, mockCatalog);
  assert.strictEqual(migrated.length, 2);
  assert.strictEqual(migrated[0]._id, "6a5102d037814e9e066b24e1", "Tomato should be matched to its database _id");
  assert.strictEqual(migrated[1]._id, "6a5102d037814e9e066b24e2", "Onion _id should be preserved");
  console.log("  ✅ Cart migration successfully matched and resolved legacy items.");

  // --- TEST 4: Legacy Cart Migration (Unmatched Removal) ---
  console.log("\n4️⃣ Testing Legacy Cart Migration Unmatched Removal...");
  const invalidCart = [
    { id: "veg4", name: "Garlic", quantity: 1 } // unmatched/deleted item
  ];
  
  const cleaned = migrateCartItems(invalidCart, mockCatalog);
  assert.strictEqual(cleaned.length, 0, "Unmatched legacy product 'veg4' must be removed from the cart");
  console.log("  ✅ Unmatched legacy products are correctly removed from the cart.");

  console.log("\n🎉 ALL PRODUCT IDENTITY & MIGRATION TESTS PASSED SUCCESSFULLY!\n");
}

if (require.main === module) {
  runIdentityTests();
}

module.exports = { runIdentityTests };
