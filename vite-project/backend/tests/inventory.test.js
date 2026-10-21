const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertInventoryAvailable,
  getInventoryTarget,
} = require("../utils/inventory");

test("variant catalog options use shared product stock when variants have no stock", () => {
  const product = {
    name: "Shared-stock oil",
    stock: 5,
    variants: [
      { weight: "1 Ltr", price: 178 },
      { weight: "2 Ltr", price: 356 },
    ],
  };

  assert.deepEqual(assertInventoryAvailable(product, "1 Ltr", 3), {
    type: "product",
    stock: 5,
    quantity: 3,
  });
});

test("numeric variant stock takes precedence over product stock", () => {
  const product = {
    name: "Per-variant ice cream",
    stock: 99,
    variants: [{ weight: "125 ml", stock: 2 }],
  };

  assert.deepEqual(getInventoryTarget(product, "125 ml"), {
    type: "variant",
    weight: "125 ml",
    stock: 2,
  });
  assert.throws(
    () => assertInventoryAvailable(product, "125 ml", 3),
    /Only 2 units/,
  );
});

test("missing and insufficient inventory are rejected before payment", () => {
  assert.throws(
    () =>
      assertInventoryAvailable(
        { name: "Unconfigured", variants: [{ weight: "500 g" }] },
        "500 g",
        1,
      ),
    /Inventory is not configured/,
  );
  assert.throws(
    () =>
      assertInventoryAvailable({ name: "Sold out", stock: 0, variants: [] }, undefined, 1),
    /Only 0 units/,
  );
});
