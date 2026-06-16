const User = require("../models/User");
const Coupon = require("../models/Coupon");
const BuyCoinWallet = require("../models/BuyCoinWallet");
const BuyCoinTransaction = require("../models/BuyCoinTransaction");

// Helper function to recalculate wallet available balance and lifetime stats
async function recalculateWallet(userId, email) {
  try {
    const transactions = await BuyCoinTransaction.find({ userId }).sort({ issuedAt: 1 }).lean();
    
    let lifetimeEarned = 0;
    let lifetimeRedeemed = 0;
    
    // Calculate total redeemed
    for (const tx of transactions) {
      if (tx.type === "redeem") {
        lifetimeRedeemed += tx.coins;
      } else if (tx.type === "earn" || tx.type === "bonus") {
        lifetimeEarned += tx.coins;
      }
    }
    
    // Calculate available balance accounting for FIFO consumption and 90-day expiry
    let remainingRedeemed = lifetimeRedeemed;
    let availableCoins = 0;
    const now = new Date();
    
    for (const tx of transactions) {
      if (tx.type === "earn" || tx.type === "bonus") {
        const coins = tx.coins;
        let unredeemedCoins = coins;
        
        if (remainingRedeemed > 0) {
          if (remainingRedeemed >= coins) {
            remainingRedeemed -= coins;
            unredeemedCoins = 0;
          } else {
            unredeemedCoins -= remainingRedeemed;
            remainingRedeemed = 0;
          }
        }
        
        // If there are unredeemed coins from this transaction, check if they are expired
        if (unredeemedCoins > 0) {
          const expiry = tx.expiresAt || new Date(tx.issuedAt.getTime() + 90 * 24 * 60 * 60 * 1000);
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
        email: email.toLowerCase()
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
      await user.save();
    }
    
    return wallet;
  } catch (error) {
    console.error("Error recalculating wallet:", error);
    throw error;
  }
}

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

    const email = user.email.toLowerCase();

    // 1. Award BuyCoins
    // Rule: ₹100 spent = 1 BuyCoin
    const orderTotal = order.totalAmount || 0;
    const coinsEarned = Math.floor(orderTotal / 100);

    if (coinsEarned > 0) {
      // Create transaction
      const earnTx = new BuyCoinTransaction({
        userId,
        email,
        type: "earn",
        coins: coinsEarned,
        orderId: order._id,
        source: `order_delivered`
      });
      await earnTx.save();
      console.log(`Created earn transaction for +${coinsEarned} coins (Order ID: ${order._id})`);
    }

    // 1.5 Award +2 BuyCoins for Green Initiative (No Bag Pledge)
    if (order.noBagPledge) {
      const greenTx = new BuyCoinTransaction({
        userId,
        email,
        type: "bonus",
        coins: 2,
        orderId: order._id,
        source: "no_bag_pledge"
      });
      await greenTx.save();
      console.log(`Awarded +2 BuyCoins for No Bag Pledge (Order ID: ${order._id})`);
    }

    // 2. First Order Bonus Check
    const Order = require("../models/Order");
    
    // Count how many orders have been successfully delivered for this user/email
    const deliveredCount = await Order.countDocuments({
      $or: [
        { userId },
        { "user.email": email }
      ],
      orderStatus: "Delivered"
    });

    if (deliveredCount === 1) {
      // Check if they already have a first order bonus transaction to be safe
      const existingBonus = await BuyCoinTransaction.findOne({
        userId,
        type: "bonus",
        source: "first_order_bonus"
      });

      if (!existingBonus) {
        const bonusTx = new BuyCoinTransaction({
          userId,
          email,
          type: "bonus",
          coins: 10,
          orderId: order._id,
          source: "first_order_bonus"
        });
        await bonusTx.save();
        console.log(`Created first order bonus transaction for +10 coins`);
      }
    }

    // Recalculate wallet balance and sync
    await recalculateWallet(userId, email);

    // 3. Generate AGAIN15 Coupon for the first successfully delivered order
    const existingAgainCoupon = await Coupon.findOne({
      email,
      source: "AGAIN15"
    });

    if (deliveredCount === 1 && !existingAgainCoupon) {
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
    } else {
      console.log(`AGAIN15 coupon check: deliveredCount=${deliveredCount}, alreadyExists=${!!existingAgainCoupon}`);
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
    const user = await User.findById(userId);
    if (!user) return;
    const email = user.email.toLowerCase();

    // 1. Consume Coupon if applied
    if (order.couponId) {
      const coupon = await Coupon.findOne({
        _id: order.couponId,
        $or: [
          { userId },
          { email: order.user?.email?.toLowerCase() }
        ]
      });
      if (coupon) {
        coupon.isRedeemed = true;
        coupon.redeemedAt = new Date();
        coupon.isUsed = true;
        await coupon.save();
        console.log(`Coupon ${coupon.couponCode} marked as redeemed/used.`);
      } else {
        console.warn(`Coupon ${order.couponId} not found for user.`);
      }
    }

    // 2. Deduct BuyCoins if redeemed
    if (order.buyCoinsRedeemed > 0) {
      const redeemTx = new BuyCoinTransaction({
        userId,
        email,
        type: "redeem",
        coins: order.buyCoinsRedeemed,
        orderId: order._id,
        source: "checkout_redemption"
      });
      await redeemTx.save();
      console.log(`Created redeem transaction for -${order.buyCoinsRedeemed} coins (Order ID: ${order._id})`);
      
      // Recalculate wallet balance and sync
      await recalculateWallet(userId, email);
    }
  } catch (error) {
    console.error("Error consuming order discounts:", error);
  }
}

module.exports = { handleOrderDeliveredRewards, consumeOrderDiscounts, recalculateWallet };