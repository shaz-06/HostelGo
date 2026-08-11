const User = require("../models/User");
const Coupon = require("../models/Coupon");
const BuyCoinWallet = require("../models/BuyCoinWallet");
const BuyCoinTransaction = require("../models/BuyCoinTransaction");

const WalletService = require("../services/WalletService");

// Helper function to recalculate wallet available balance and lifetime stats
async function recalculateWallet(userId, email) {
  try {
    return await WalletService.recalculate(userId, email);
  } catch (error) {
    console.error("Error recalculating wallet:", error);
    throw error;
  }
}

async function handleOrderCheckoutRewards(order) {
  try {
    // Publish order.delivered event post-commit
    try {
      const EventBus = require("../services/EventBus");
      const crypto = require("crypto");
      const eventId = crypto.randomUUID();
      const correlationId = order.correlationId || crypto.randomUUID();
      
      EventBus.publish("order.delivered", {
        eventId,
        eventType: "order.delivered",
        correlationId,
        occurredAt: new Date().toISOString(),
        orderId: order._id ? order._id.toString() : "",
        userId: order.userId ? order.userId.toString() : "",
        orderTotal: Number(order.totalAmount || 0)
      });
      console.log(`[EventBus] Published order.delivered event for Order ID: ${order._id}`);
    } catch (eventErr) {
      console.error("Failed to publish order.delivered event:", eventErr);
    }

    await WalletService.rewardOrder(order);

    // After rewarding, we need to handle generation of AGAIN15 Coupon for the first successfully placed/paid order
    const userId = order.userId;
    if (!userId) return;

    const user = await User.findById(userId);
    if (!user) return;
    const email = user.email ? user.email.toLowerCase() : "";

    const Order = require("../models/Order");
    const orderCount = await Order.countDocuments({
      $or: [
        { userId },
        { "user.phone": user.phone }
      ],
      $or: [
        { paymentStatus: "Paid" },
        { paymentMethod: "cod" }
      ]
    });

    if (email && orderCount === 1) {
      const existingAgainCoupon = await Coupon.findOne({
        email,
        source: "AGAIN15"
      });

      if (!existingAgainCoupon) {
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 Hours
        const coupon = new Coupon({
          userId,
          email,
          couponCode: "AGAIN15",
          discountAmount: 15,
          minimumOrderValue: 149,
          issuedAt: new Date(),
          expiresAt: expiresAt,
          isRedeemed: false,
          source: "AGAIN15",
          isUsed: false,
          expiryDate: expiresAt,
          generatedFromOrderId: order._id
        });
        await coupon.save();
        console.log(`Generated AGAIN15 coupon for user ${user.name} (${email}) expiring at ${expiresAt}`);
      }
    }
  } catch (error) {
    console.error("Error handling order rewards:", error);
  }
}

async function consumeOrderDiscounts(order) {
  if (!order) return;

  const userId = order.userId;
  if (!userId) return;

  console.log(`=== CONSUMING DISCOUNTS FOR USER ${userId} (ORDER ${order._id}) ===`);

  try {
    const user = await User.findById(userId);
    if (!user) return;
    const email = user.email ? user.email.toLowerCase() : "";

    // 1. Consume Coupon if applied
    if (order.couponId) {
      const coupon = await Coupon.findOne({
        _id: order.couponId
      });
      if (coupon) {
        coupon.isRedeemed = true;
        coupon.redeemedAt = new Date();
        coupon.isUsed = true;
        await coupon.save();
        console.log(`Coupon ${coupon.couponCode} marked as redeemed/used.`);
      } else {
        const PromotionCoupon = require("../models/PromotionCoupon");
        const promoCoupon = await PromotionCoupon.findById(order.couponId);
        if (promoCoupon) {
          promoCoupon.usedCount += 1;
          promoCoupon.ordersCount += 1;
          promoCoupon.totalDiscountGiven += Number(order.couponDiscount || 0);
          promoCoupon.revenueGenerated += Number(order.totalAmount || 0);
          await promoCoupon.save();
          console.log(`Promo coupon ${promoCoupon.code} usage metrics updated.`);
        }
      }
    }

    // 2. Deduct BuyCoins if redeemed
    if (order.buyCoinsRedeemed > 0) {
      const redeemTx = new BuyCoinTransaction({
        userId,
        email,
        type: "redeem",
        amount: order.buyCoinsRedeemed,
        coins: order.buyCoinsRedeemed,
        orderId: order._id,
        description: "Redeemed during checkout"
      });
      await redeemTx.save();
      console.log(`Created spent transaction for -${order.buyCoinsRedeemed} coins (Order ID: ${order._id})`);
      
      // Recalculate wallet balance and sync
      await recalculateWallet(userId, email);
    }

    // 3. Consume Birthday Reward if applied (atomic and idempotent)
    if (order.birthdayReward && order.birthdayReward.applied) {
      const year = order.birthdayReward.year;
      const alreadyConsumedByThisOrder = user.birthdayRedemptions && user.birthdayRedemptions.some(r => r.year === year && r.orderId === order._id.toString());
      if (!alreadyConsumedByThisOrder) {
        const result = await User.updateOne(
          {
            _id: userId,
            "birthdayRedemptions.year": { $ne: year }
          },
          {
            $addToSet: {
              birthdayRedemptions: { year, orderId: order._id.toString() }
            }
          }
        );
        if (result.modifiedCount === 0) {
          throw new Error("Double redemption race condition detected. Birthday reward was already consumed for this year.");
        }
        console.log(`Birthday reward for year ${year} atomically consumed by Order ${order._id}`);
      } else {
        console.log(`Birthday reward for year ${year} was already consumed by this Order ${order._id} (idempotent bypass)`);
      }
    }
  } catch (error) {
    console.error("Error consuming order discounts:", error);
  }
}

async function handleOrderCancellationReversal(order) {
  if (!order || !["Cancelled", "Delivery Failed"].includes(order.orderStatus)) return;

  // Publish order.cancelled event post-commit
  try {
    const EventBus = require("../services/EventBus");
    const crypto = require("crypto");
    const eventId = crypto.randomUUID();
    const correlationId = order.correlationId || crypto.randomUUID();
    
    EventBus.publish("order.cancelled", {
      eventId,
      eventType: "order.cancelled",
      correlationId,
      occurredAt: new Date().toISOString(),
      orderId: order._id ? order._id.toString() : "",
      userId: order.userId ? order.userId.toString() : ""
    });
    console.log(`[EventBus] Published order.cancelled event for Order ID: ${order._id}`);
  } catch (eventErr) {
    console.error("Failed to publish order.cancelled event:", eventErr);
  }

  const userId = order.userId;
  if (!userId) return;

  console.log(`=== PROCESSING CANCELLATION REVERSAL FOR USER ${userId} (ORDER ${order._id}) ===`);

  try {
    const user = await User.findById(userId);
    if (!user) return;
    const email = user.email ? user.email.toLowerCase() : "";

    // 1. Reverse earned coins (if they were already credited)
    if (order.buyCoinsCredited && order.buyCoinsEarned > 0) {
      const existingReversal = await BuyCoinTransaction.findOne({
        userId,
        orderId: order._id,
        type: "reversal"
      });

      if (!existingReversal) {
        const reversalTx = new BuyCoinTransaction({
          userId,
          email,
          type: "reversal",
          amount: order.buyCoinsEarned,
          coins: order.buyCoinsEarned,
          orderId: order._id,
          description: `Reversal for cancelled order #${order._id.toString().substring(0, 8)}`
        });
        await reversalTx.save();
        console.log(`Created reversal transaction for -${order.buyCoinsEarned} coins (Order ID: ${order._id})`);
      }
    }

    // 2. Refund redeemed coins (if any were spent/redeemed during checkout)
    if (order.buyCoinsRedeemed > 0) {
      const existingRefund = await BuyCoinTransaction.findOne({
        userId,
        orderId: order._id,
        type: "refund"
      });

      if (!existingRefund) {
        const refundTx = new BuyCoinTransaction({
          userId,
          email,
          type: "refund",
          amount: order.buyCoinsRedeemed,
          coins: order.buyCoinsRedeemed,
          orderId: order._id,
          description: `Refund of redeemed coins for cancelled order #${order._id.toString().substring(0, 8)}`
        });
        await refundTx.save();
        console.log(`Created refund transaction for +${order.buyCoinsRedeemed} coins (Order ID: ${order._id})`);
      }
    }

    // Update flags and save
    order.buyCoinsCredited = false;
    await order.save();

    // Recalculate wallet
    await recalculateWallet(userId, email);

    // 3. Refund / Revert Birthday Reward if applied to this order
    if (order.birthdayReward && order.birthdayReward.applied) {
      const year = order.birthdayReward.year;
      const result = await User.updateOne(
        { _id: userId },
        {
          $pull: {
            birthdayRedemptions: { year, orderId: order._id.toString() }
          }
        }
      );
      if (result.modifiedCount > 0) {
        console.log(`Birthday reward for year ${year} reversed and restored from cancelled Order ${order._id}`);
      } else {
        console.log(`Birthday reward for year ${year} was not associated/restored from Order ${order._id} (idempotent or already reversed)`);
      }
    }
  } catch (error) {
    console.error("Error handling order cancellation reversal:", error);
  }
}

async function handlePartialRefundReversal(order, refundedAmount) {
  if (!order || !order.userId || refundedAmount <= 0) return;
  const userId = order.userId;
  
  try {
    const user = await User.findById(userId);
    if (!user) return;
    const email = user.email ? user.email.toLowerCase() : "";

    if (order.buyCoinsCredited && order.buyCoinsEarned > 0) {
      const proportion = refundedAmount / (order.totalAmount || 1);
      const coinsToReverse = Math.floor(order.buyCoinsEarned * proportion);

      if (coinsToReverse > 0) {
        const reversalTx = new BuyCoinTransaction({
          userId,
          email,
          type: "reversal",
          amount: coinsToReverse,
          coins: coinsToReverse,
          orderId: order._id,
          description: `Partial refund reversal for order #${order._id.toString().substring(0, 8)}`
        });
        await reversalTx.save();
        console.log(`Created partial refund reversal transaction for -${coinsToReverse} coins (Order ID: ${order._id})`);

        // Deduct from buyCoinsEarned so future refunds/cancellations only reverse the remainder
        order.buyCoinsEarned = Math.max(0, order.buyCoinsEarned - coinsToReverse);
        await order.save();

        await recalculateWallet(userId, email);
      }
    }
  } catch (error) {
    console.error("Error handling partial refund reversal:", error);
  }
}

module.exports = { 
  handleOrderCheckoutRewards, 
  consumeOrderDiscounts, 
  recalculateWallet, 
  handleOrderCancellationReversal,
  handlePartialRefundReversal
};