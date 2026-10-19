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

async function clearPurchasedItemsFromCart(userId, purchasedProducts) {
  if (!userId || !purchasedProducts || purchasedProducts.length === 0) {
    return;
  }
  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return;

    let cartUpdated = false;
    for (const purchased of purchasedProducts) {
      const pId = purchased.productId ? purchased.productId.toString() : purchased._id ? purchased._id.toString() : "";
      const cartItemIndex = cart.items.findIndex(item => item.productId.toString() === pId);
      
      if (cartItemIndex > -1) {
        cart.items[cartItemIndex].quantity -= purchased.quantity;
        if (cart.items[cartItemIndex].quantity <= 0) {
          cart.items.splice(cartItemIndex, 1);
        }
        cartUpdated = true;
      }
    }
    
    if (cartUpdated) {
      cart.updatedAt = new Date();
      await cart.save();
      console.log(`[CartCleanup] Cart updated specifically for purchased items for user: ${userId}`);
    }
  } catch (error) {
    console.error(`[CartCleanup] Error clearing specific purchased items for user ${userId}:`, error);
  }
}

module.exports = { clearCustomerCart, clearPurchasedItemsFromCart };
