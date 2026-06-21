const User = require("../models/User");
const Coupon = require("../models/Coupon");
const BuyCoinWallet = require("../models/BuyCoinWallet");
const BuyCoinTransaction = require("../models/BuyCoinTransaction");

// Helper function to recalculate wallet available balance and lifetime stats
async function recalculateWallet(userId, email) {
  try {
    const transactions = await BuyCoinTransaction.find({ userId }).sort({ createdAt: 1 }).lean();
    
    let lifetimeEarned = 0;
    let lifetimeRedeemed = 0;
    
    // Calculate total redeemed and earned based on new and legacy types
    // Credits: earned, earn, bonus, admin, refund
    // Debits: spent, redeem, reversal
    for (const tx of transactions) {
      const val = tx.amount !== undefined ? tx.amount : (tx.coins !== undefined ? tx.coins : 0);
      if (["spent", "redeem", "reversal"].includes(tx.type)) {
        lifetimeRedeemed += val;
      } else if (["earned", "earn", "bonus", "admin", "refund"].includes(tx.type)) {
        lifetimeEarned += val;
      }
    }
    
    // Calculate available balance accounting for FIFO consumption and 90-day expiry
    let remainingRedeemed = lifetimeRedeemed;
    let availableCoins = 0;
    const now = new Date();
    
    for (const tx of transactions) {
      if (["earned", "earn", "bonus", "admin", "refund"].includes(tx.type)) {
        const val = tx.amount !== undefined ? tx.amount : (tx.coins !== undefined ? tx.coins : 0);
        let unredeemedCoins = val;
        
        if (remainingRedeemed > 0) {
          if (remainingRedeemed >= val) {
            remainingRedeemed -= val;
            unredeemedCoins = 0;
          } else {
            unredeemedCoins -= remainingRedeemed;
            remainingRedeemed = 0;
          }
        }
        
        // If there are unredeemed coins from this transaction, check if they are expired
        if (unredeemedCoins > 0) {
          // Prepare expiry: 90 days from transaction creation (for earned/earn/bonus)
          const expiry = tx.buyCoinExpiryDate || tx.expiresAt || new Date(tx.createdAt.getTime() + 90 * 24 * 60 * 60 * 1000);
          if (expiry > now) {
            availableCoins += unredeemedCoins;
          }
        }
      }
    }
    
    // Update or Create Wallet
    let wallet = await BuyCoinWallet.findOne({ userId });
    if (!wallet) {
      wallet = new BuyCoinWallet({
        userId,
        email: email ? email.toLowerCase() : ""
      });
    }
    wallet.availableCoins = availableCoins;
    wallet.lifetimeEarned = lifetimeEarned;
    wallet.lifetimeRedeemed = lifetimeRedeemed;
    await wallet.save();
    
    // Sync to User model
    const user = await User.findById(userId);
    if (user) {
      user.buyCoins = availableCoins;
      user.buyCoinsLifetimeEarned = lifetimeEarned;
      user.buyCoinsRedeemed = lifetimeRedeemed;
      user.totalBuyCoinsEarned = lifetimeEarned;
      user.totalBuyCoinsSpent = lifetimeRedeemed;
      await user.save();
    }
    
    return wallet;
  } catch (error) {
    console.error("Error recalculating wallet:", error);
    throw error;
  }
}

async function handleOrderCheckoutRewards(order) {
  if (!order) return;

  // Double crediting safeguard
  if (order.buyCoinsCredited) {
    console.log(`=== BuyCoins already credited for order ${order._id}. Skipping. ===`);
    return;
  }

  const userId = order.userId;
  if (!userId) return;

  console.log(`=== PROCESSING CHECKOUT REWARDS FOR USER ${userId} (ORDER ${order._id}) ===`);

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`User ${userId} not found for order rewards.`);
      return;
    }

    const email = user.email ? user.email.toLowerCase() : "";

    // 1. Award BuyCoins
    // Rule: Math.floor(finalProductTotal / 100)
    // product subtotal = sum of product price * quantity
    const productSubtotal = order.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const finalProductTotal = Math.max(0, productSubtotal - (order.couponDiscount || 0) - (order.buyCoinsDiscount || 0));
    const coinsEarned = Math.floor(finalProductTotal / 100);

    if (coinsEarned > 0) {
      // Create transaction
      const earnTx = new BuyCoinTransaction({
        userId,
        email,
        type: "earned",
        amount: coinsEarned,
        coins: coinsEarned,
        orderId: order._id,
        description: `Earned from Order #${order._id.toString().substring(0, 8)}`
      });
      await earnTx.save();
      console.log(`Created earned transaction for +${coinsEarned} coins (Order ID: ${order._id})`);
      order.buyCoinsEarned = coinsEarned;
    }

    // 1.5 Award +2 BuyCoins for Green Initiative (No Bag Pledge)
    if (order.noBagPledge) {
      const greenTx = new BuyCoinTransaction({
        userId,
        email,
        type: "bonus",
        amount: 2,
        coins: 2,
        orderId: order._id,
        description: "Green Initiative (No Bag Pledge)"
      });
      await greenTx.save();
      console.log(`Awarded +2 BuyCoins for No Bag Pledge (Order ID: ${order._id})`);
    }

    // Mark order as credited
    order.buyCoinsCredited = true;
    await order.save();

    // 2. First Order Bonus Check
    const Order = require("../models/Order");
    
    // Count how many orders have been successfully placed/paid for this user/phone
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

    if (orderCount === 1) {
      // Check if they already have a first order bonus transaction to be safe
      const existingBonus = await BuyCoinTransaction.findOne({
        userId,
        type: "bonus",
        description: /First Order Bonus/i
      });

      if (!existingBonus) {
        const bonusTx = new BuyCoinTransaction({
          userId,
          email,
          type: "bonus",
          amount: 10,
          coins: 10,
          orderId: order._id,
          description: "First Order Bonus"
        });
        await bonusTx.save();
        console.log(`Created first order bonus transaction for +10 coins`);
      }
    }

    // Recalculate wallet balance and sync
    await recalculateWallet(userId, email);

    // 3. Generate AGAIN15 Coupon for the first successfully placed/paid order (only if email is available)
    if (email) {
      const existingAgainCoupon = await Coupon.findOne({
        email,
        source: "AGAIN15"
      });

      if (orderCount === 1 && !existingAgainCoupon) {
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
      }
    }

    // 2. Deduct BuyCoins if redeemed
    if (order.buyCoinsRedeemed > 0) {
      const redeemTx = new BuyCoinTransaction({
        userId,
        email,
        type: "spent",
        amount: order.buyCoinsRedeemed,
        coins: order.buyCoinsRedeemed,
        orderId: order._id,
        description: `Redeemed at checkout for Order #${order._id.toString().substring(0, 8)}`
      });
      await redeemTx.save();
      console.log(`Created spent transaction for -${order.buyCoinsRedeemed} coins (Order ID: ${order._id})`);
      
      // Recalculate wallet balance and sync
      await recalculateWallet(userId, email);
    }
  } catch (error) {
    console.error("Error consuming order discounts:", error);
  }
}

async function handleOrderCancellationReversal(order) {
  if (!order || !["Cancelled", "Delivery Failed"].includes(order.orderStatus)) return;

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