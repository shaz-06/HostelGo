const assert = require("assert");

// Pure search filtering function matching backend & frontend logic
function searchProducts(products, query, categoryFilter = "All") {
  if (!query && (!categoryFilter || categoryFilter === "All")) {
    return products;
  }

  const cleanQuery = (query || "").toLowerCase().trim();
  const cleanCategory = (categoryFilter || "All").toLowerCase().trim();

  return products.filter((product) => {
    if (!product) return false;

    const matchesCategory =
      cleanCategory === "all" ||
      (product.category && product.category.toLowerCase().includes(cleanCategory));

    if (!cleanQuery) return matchesCategory;

    const matchesSearch =
      (product.name && product.name.toLowerCase().includes(cleanQuery)) ||
      (product.brand && product.brand.toLowerCase().includes(cleanQuery)) ||
      (product.category && product.category.toLowerCase().includes(cleanQuery)) ||
      (product.subCategory && product.subCategory.toLowerCase().includes(cleanQuery)) ||
      (product.subcategory && product.subcategory.toLowerCase().includes(cleanQuery)) ||
      (product.description && product.description.toLowerCase().includes(cleanQuery)) ||
      (product.weight && product.weight.toLowerCase().includes(cleanQuery)) ||
      (Array.isArray(product.tags) && product.tags.some(t => t && t.toLowerCase().includes(cleanQuery)));

    return matchesCategory && matchesSearch;
  });
}

function runSearchTests() {
  console.log("🧪 Starting Product Search & Filtering Unit Tests...");

  const mockCatalog = [
    { id: "1", name: "Amul Taaza Toned Milk", brand: "Amul", category: "Dairy, Bread & Eggs", subCategory: "Milk" },
    { id: "2", name: "Nandini Fresh Full Cream Milk", brand: "Nandini", category: "Dairy, Bread & Eggs", subCategory: "Milk" },
    { id: "3", name: "Hershey's Chocolate Milkshake", brand: "Hershey's", category: "Dairy, Bread & Eggs", subCategory: "Milkshake" },
    { id: "4", name: "Nandini Curd 500g", brand: "Nandini", category: "Dairy, Bread & Eggs", subCategory: "Curd" },
    { id: "5", name: "Farm Fresh Eggs 6 Pack", brand: "FarmFresh", category: "Dairy, Bread & Eggs", subCategory: "Eggs" },
    { id: "6", name: "Sunpure Sunflower Oil 1L", brand: "Sunpure", category: "Atta, Rice and Dal", subCategory: "Edible Oil" },
    { id: "7", name: "Brownie Fudge Ice Cream", brand: "Kwality Walls", category: "Ice Creams & Frozen", subCategory: "Tub Ice Cream" },
    { id: "8", name: "Cornetto Double Chocolate", brand: "Kwality Walls", category: "Ice Creams & Frozen", subCategory: "Cones" },
    { id: "9", name: "Chocolate Truffle Cake", brand: "Buyto Bakery", category: "Bakery & Cakes", subCategory: "Cakes" }
  ];

  // --- TEST 1: Exact Query Match ---
  console.log("\n1️⃣ Testing Exact Query Match: 'Amul Taaza Toned Milk'");
  const exactResults = searchProducts(mockCatalog, "Amul Taaza Toned Milk");
  assert.strictEqual(exactResults.length, 1);
  assert.strictEqual(exactResults[0].id, "1");
  console.log("  ✅ Exact match returned expected product.");

  // --- TEST 2: Partial Query Match ---
  console.log("\n2️⃣ Testing Partial Match: 'Milk'");
  const milkResults = searchProducts(mockCatalog, "Milk");
  assert.strictEqual(milkResults.length, 3);
  const milkNames = milkResults.map(p => p.name);
  assert.ok(milkNames.includes("Amul Taaza Toned Milk"));
  assert.ok(milkNames.includes("Nandini Fresh Full Cream Milk"));
  assert.ok(milkNames.includes("Hershey's Chocolate Milkshake"));
  assert.strictEqual(milkNames.includes("Nandini Curd 500g"), false, "Curd should NOT be returned when searching Milk");
  assert.strictEqual(milkNames.includes("Farm Fresh Eggs 6 Pack"), false, "Eggs should NOT be returned when searching Milk");
  assert.strictEqual(milkNames.includes("Sunpure Sunflower Oil 1L"), false, "Oil should NOT be returned when searching Milk");
  console.log("  ✅ Partial match for 'Milk' returned only milk-related items.");

  // --- TEST 3: Case-Insensitive Query Match ---
  console.log("\n3️⃣ Testing Case-Insensitive Match: 'mILk'");
  const caseInsensitiveResults = searchProducts(mockCatalog, "mILk");
  assert.strictEqual(caseInsensitiveResults.length, 3);
  console.log("  ✅ Case-insensitive search correctly matched.");

  // --- TEST 4: Zero-Result Match Scenario ---
  console.log("\n4️⃣ Testing Zero-Result Scenario: 'Smartphones'");
  const zeroResults = searchProducts(mockCatalog, "Smartphones");
  assert.strictEqual(zeroResults.length, 0, "Zero-result search MUST return empty array, NOT full catalog!");
  console.log("  ✅ Zero-result search correctly returned empty array without full catalog fallback.");

  // --- TEST 5: Brand Match ---
  console.log("\n5️⃣ Testing Brand Search: 'Kwality Walls'");
  const brandResults = searchProducts(mockCatalog, "Kwality Walls");
  assert.strictEqual(brandResults.length, 2);
  console.log("  ✅ Brand search correctly matched all Kwality Walls items.");

  console.log("\n🎉 ALL SEARCH UNIT TESTS PASSED SUCCESSFULLY!\n");
}

if (require.main === module) {
  runSearchTests();
}

module.exports = { searchProducts, runSearchTests };
