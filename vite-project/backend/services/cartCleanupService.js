const Cart = require("../models/Cart");

/**
 * Idempotently clears a customer's cart in MongoDB.
 * @param {string} userId - The ID of the customer.
 */
async function clearCustomerCart(userId) {
  if (!userId) {
    console.warn("[CartCleanup] userId is null or undefined, skipping cart clear");
    return;
  }
  try {
    // Clear user's cart items idempotently
    await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: [] } },
      { new: true, upsert: true }
    );
    console.log(`[CartCleanup] Cart cleared successfully for user: ${userId}`);
  } catch (error) {
    console.error(`[CartCleanup] Error clearing cart for user ${userId}:`, error);
    throw error;
  }
}

module.exports = { clearCustomerCart };
