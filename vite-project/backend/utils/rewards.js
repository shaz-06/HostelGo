const User = require("../models/User");
const Coupon = require("../models/Coupon");

async function handleOrderDeliveredRewards(order) {
  // Defensive check: only award if status is Delivered
  if (!order || order.orderStatus !== "Delivered") return;

  const userId = order.userId;
  if (!userId) return;

  console.log(`=== PROCESSING DELIVERED REWARDS FOR USER ${userId} (ORDER ${order._id}) ===`);

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`User ${userId} not found for order rewards.`);
      return;
    }

    // 1. Award BuyCoins
    // Rule: ₹100 spent = 1 BuyCoin
    const orderTotal = order.totalAmount || 0;
    const coinsEarned = Math.floor(orderTotal / 100);

    if (coinsEarned > 0) {
      user.buyCoins = (user.buyCoins || 0) + coinsEarned;
      user.buyCoinsLifetimeEarned = (user.buyCoinsLifetimeEarned || 0) + coinsEarned;
      await user.save();
      console.log(`Awarded +${coinsEarned} BuyCoins to user ${user.name}. Balance: ${user.buyCoins}`);
    }

    // 2. Generate AGAIN20 Coupon
    // Check if user already has an active AGAIN20 coupon (isUsed: false, expiryDate > now)
    const now = new Date();
    const activeCoupon = await Coupon.findOne({
      userId,
      couponCode: "AGAIN20",
      isUsed: false,
      expiryDate: { $gt: now }
    });

    if (!activeCoupon) {
      const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 Hours
      const coupon = new Coupon({
        userId,
        couponCode: "AGAIN20",
        discountAmount: 20,
        minOrderValue: 199,
        expiryDate: expiry,
        isUsed: false,
        generatedFromOrderId: order._id
      });
      await coupon.save();
      console.log(`Generated AGAIN20 coupon for user ${user.name} expiring at ${expiry}`);
    } else {
      console.log(`User already has active AGAIN20 coupon: ${activeCoupon._id}`);
    }

  } catch (error) {
    console.error("Error handling order delivered rewards:", error);
  }
}

async function consumeOrderDiscounts(order) {
  if (!order) return;

  const userId = order.userId;
  if (!userId) return;

  console.log(`=== CONSUMING DISCOUNTS FOR USER ${userId} (ORDER ${order._id}) ===`);

  try {
    // 1. Consume Coupon if applied
    if (order.couponId) {
      const coupon = await Coupon.findOne({ _id: order.couponId, userId });
      if (coupon) {
        coupon.isUsed = true;
        await coupon.save();
        console.log(`Coupon ${coupon.couponCode} marked as used.`);
      } else {
        console.warn(`Coupon ${order.couponId} not found for user.`);
      }
    }

    // 2. Deduct BuyCoins if redeemed
    if (order.buyCoinsRedeemed > 0) {
      const user = await User.findById(userId);
      if (user) {
        user.buyCoins = Math.max(0, (user.buyCoins || 0) - order.buyCoinsRedeemed);
        user.buyCoinsRedeemed = (user.buyCoinsRedeemed || 0) + order.buyCoinsRedeemed;
        await user.save();
        console.log(`Deducted ${order.buyCoinsRedeemed} BuyCoins from user ${user.name}. New Balance: ${user.buyCoins}`);
      }
    }
  } catch (error) {
    console.error("Error consuming order discounts:", error);
  }
}

module.exports = { handleOrderDeliveredRewards, consumeOrderDiscounts };