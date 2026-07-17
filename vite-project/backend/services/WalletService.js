const mongoose = require("mongoose");
const User = require("../models/User");
const BuyCoinWallet = require("../models/BuyCoinWallet");
const BuyCoinTransaction = require("../models/BuyCoinTransaction");
const { WELCOME_BONUS, BUYCOINS_EARNING_RATE } = require("../config/constants");

class WalletService {
  /**
   * Recalculates user's cached wallet balances based strictly on transaction history.
   * Leverages optimistic concurrency for cache state safety.
   */
  static async recalculate(userId, email, session = null) {
    // 1. Fetch all completed/non-failed transactions
    const query = BuyCoinTransaction.find({ 
      userId, 
      status: { $in: ["COMPLETED", "REVERSED"] } 
    }).sort({ createdAt: 1 });
    
    if (session) {
      query.session(session);
    }
    const transactions = await query.lean();

    let lifetimeEarned = 0;
    let lifetimeRedeemed = 0;

    // Define credit & debit categories based on legacy & enforced types
    const creditTypes = ["earned", "earn", "bonus", "admin", "refund", "WELCOME_BONUS", "ORDER_REWARD", "CASHBACK", "ADMIN_CREDIT"];
    const debitTypes = ["spent", "redeem", "reversal", "ADMIN_DEBIT", "REDEMPTION", "REVERSAL", "EXPIRY"];

    for (const tx of transactions) {
      // Ignore failed transactions
      if (tx.status === "FAILED") continue;

      const val = Math.round(tx.amount !== undefined ? tx.amount : (tx.coins !== undefined ? tx.coins : 0));
      
      if (debitTypes.includes(tx.type)) {
        lifetimeRedeemed += val;
      } else if (creditTypes.includes(tx.type)) {
        lifetimeEarned += val;
      }
    }

    // FIFO Consumption and 90-day expiry calculation
    let remainingRedeemed = lifetimeRedeemed;
    let availableCoins = 0;
    const now = new Date();

    for (const tx of transactions) {
      if (tx.status === "FAILED") continue;

      if (creditTypes.includes(tx.type)) {
        const val = Math.round(tx.amount !== undefined ? tx.amount : (tx.coins !== undefined ? tx.coins : 0));
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

        if (unredeemedCoins > 0) {
          const expiry = tx.buyCoinExpiryDate || new Date(tx.createdAt.getTime() + 90 * 24 * 60 * 60 * 1000);
          if (expiry > now) {
            availableCoins += unredeemedCoins;
          }
        }
      }
    }

    // Update User model with optimistic concurrency control
    const user = session 
      ? await User.findById(userId).session(session) 
      : await User.findById(userId);

    if (user) {
      const hasWelcomeBonusTx = transactions.some(tx => tx.type === "WELCOME_BONUS");
      const userUpdateQuery = { _id: userId };
      const userUpdateData = {
        $set: {
          buyCoins: availableCoins,
          buyCoinsLifetimeEarned: lifetimeEarned,
          buyCoinsRedeemed: lifetimeRedeemed,
          totalBuyCoinsEarned: lifetimeEarned,
          totalBuyCoinsSpent: lifetimeRedeemed,
          "buyCoinsStats.totalEarned": lifetimeEarned,
          "buyCoinsStats.totalRedeemed": lifetimeRedeemed,
          "buyCoinsStats.welcomeBonusClaimed": hasWelcomeBonusTx,
          welcomeBonusGiven: hasWelcomeBonusTx
        }
      };

      const updatedUser = session
        ? await User.findOneAndUpdate(userUpdateQuery, userUpdateData, { new: true, session })
        : await User.findOneAndUpdate(userUpdateQuery, userUpdateData, { new: true });

      if (!updatedUser) {
        throw new Error(`Failed to update User ${userId} cache.`);
      }
    }

    // Update BuyCoinWallet model
    const walletQuery = BuyCoinWallet.findOne({ userId });
    if (session) walletQuery.session(session);
    let wallet = await walletQuery;

    if (!wallet) {
      wallet = new BuyCoinWallet({
        userId,
        email: email ? email.toLowerCase() : "",
        availableCoins,
        lifetimeEarned,
        lifetimeRedeemed
      });
      if (session) {
        await wallet.save({ session });
      } else {
        await wallet.save();
      }
    } else {
      const walletUpdateQuery = { _id: wallet._id };
      const walletUpdateData = {
        $set: {
          availableCoins,
          lifetimeEarned,
          lifetimeRedeemed,
          email: email ? email.toLowerCase() : wallet.email
        }
      };

      const updatedWallet = session
        ? await BuyCoinWallet.findOneAndUpdate(walletUpdateQuery, walletUpdateData, { new: true, session })
        : await BuyCoinWallet.findOneAndUpdate(walletUpdateQuery, walletUpdateData, { new: true });

      if (!updatedWallet) {
        throw new Error(`Failed to update BuyCoinWallet for User ${userId}.`);
      }
      wallet = updatedWallet;
    }

    return wallet;
  }

  /**
   * Idempotently grants a Welcome Bonus to a new user.
   */
  static async grantWelcomeBonus(userId, email, session = null) {
    const idempotencyKey = `welcome:${userId}`;

    const executeGrant = async (sess) => {
      // 1. Check user welcomeBonusClaimed status
      const userDoc = sess
        ? await User.findById(userId).session(sess)
        : await User.findById(userId);
      if (!userDoc || userDoc.buyCoinsStats?.welcomeBonusClaimed) {
        return;
      }

      // 2. Insert the transaction
      const initialBalanceAfter = (userDoc.buyCoins || 0) + WELCOME_BONUS;

      const bonusTx = new BuyCoinTransaction({
        userId,
        email: email || userDoc.email || "",
        type: "WELCOME_BONUS",
        status: "COMPLETED",
        amount: WELCOME_BONUS,
        coins: WELCOME_BONUS,
        description: "Welcome Bonus",
        source: "Buyto",
        balanceAfter: initialBalanceAfter,
        idempotencyKey
      });

      try {
        if (sess) {
          await bonusTx.save({ session: sess });
        } else {
          await bonusTx.save();
        }
      } catch (err) {
        if (err.code === 11000 || err.message?.includes("E11000")) {
          console.log(`[Idempotency] Welcome bonus transaction already exists for user ${userId}. Skipping.`);
          return;
        }
        throw err;
      }

      // 3. Update the user atomically
      const userUpdateQuery = { _id: userId, "buyCoinsStats.welcomeBonusClaimed": { $ne: true } };
      const userUpdateData = {
        $inc: {
          buyCoins: WELCOME_BONUS,
          "buyCoinsStats.totalEarned": WELCOME_BONUS,
          buyCoinsLifetimeEarned: WELCOME_BONUS,
          totalBuyCoinsEarned: WELCOME_BONUS
        },
        $set: {
          "buyCoinsStats.welcomeBonusClaimed": true,
          welcomeBonusGiven: true
        }
      };

      const updatedUser = sess
        ? await User.findOneAndUpdate(userUpdateQuery, userUpdateData, { new: true, session: sess })
        : await User.findOneAndUpdate(userUpdateQuery, userUpdateData, { new: true });

      if (!updatedUser) {
        throw new Error(`Welcome bonus already claimed or user ${userId} not found.`);
      }

      // 4. Update transaction balanceAfter if it differs
      if (bonusTx.balanceAfter !== updatedUser.buyCoins) {
        bonusTx.balanceAfter = updatedUser.buyCoins;
        if (sess) {
          await BuyCoinTransaction.updateOne({ _id: bonusTx._id }, { $set: { balanceAfter: updatedUser.buyCoins } }).session(sess);
        } else {
          await BuyCoinTransaction.updateOne({ _id: bonusTx._id }, { $set: { balanceAfter: updatedUser.buyCoins } });
        }
      }

      // 5. Update BuyCoinWallet
      await WalletService.recalculate(userId, email || userDoc.email || "", sess);

      // 6. Log welcome bonus event
      console.log(`[AUDIT] Welcome bonus granted. User ID: ${userId}, Amount: ${WELCOME_BONUS}, Transaction ID: ${bonusTx._id}, Timestamp: ${new Date().toISOString()}`);
    };

    if (session) {
      await executeGrant(session);
    } else {
      const newSession = await mongoose.startSession();
      await newSession.withTransaction(async () => {
        await executeGrant(newSession);
      });
      await newSession.endSession();
    }
  }

  /**
   * Idempotently rewards order checkouts.
   */
  static async rewardOrder(order, session = null) {
    if (!order || order.orderStatus !== "Delivered") return;

    const userId = order.userId;
    if (!userId) return;

    const idempotencyKey = `order:${order._id}`;

    const executeReward = async (sess) => {
      // Check for existing transaction
      const existingTxQuery = BuyCoinTransaction.findOne({ idempotencyKey });
      if (sess) existingTxQuery.session(sess);
      const existingTx = await existingTxQuery;
      if (existingTx) return;

      // Fetch user
      const userQuery = User.findById(userId);
      if (sess) userQuery.session(sess);
      const user = await userQuery;
      if (!user) return;

      const email = user.email ? user.email.toLowerCase() : "";

      // Calculate coins earned
      const productSubtotal = order.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const finalProductTotal = Math.max(0, productSubtotal - (order.couponDiscount || 0) - (order.buyCoinsDiscount || 0));
      const coinsEarned = Math.floor(finalProductTotal / BUYCOINS_EARNING_RATE);

      if (coinsEarned > 0) {
        const earnTx = new BuyCoinTransaction({
          userId,
          email,
          type: "ORDER_REWARD",
          status: "COMPLETED",
          amount: coinsEarned,
          coins: coinsEarned,
          orderId: order._id,
          description: `Earned from Order #${order._id.toString().substring(0, 8)}`,
          idempotencyKey
        });

        if (sess) {
          await earnTx.save({ session: sess });
        } else {
          await earnTx.save();
        }

        order.buyCoinsEarned = coinsEarned;
      }

      // green pledge bonus
      if (order.noBagPledge) {
        const greenIdempotencyKey = `order-green:${order._id}`;
        const greenTxQuery = BuyCoinTransaction.findOne({ idempotencyKey: greenIdempotencyKey });
        if (sess) greenTxQuery.session(sess);
        const existingGreen = await greenTxQuery;

        if (!existingGreen) {
          const greenTx = new BuyCoinTransaction({
            userId,
            email,
            type: "CASHBACK",
            status: "COMPLETED",
            amount: 2,
            coins: 2,
            orderId: order._id,
            description: "Green Initiative (No Bag Pledge)",
            idempotencyKey: greenIdempotencyKey
          });

          if (sess) {
            await greenTx.save({ session: sess });
          } else {
            await greenTx.save();
          }
        }
      }

      order.buyCoinsCredited = true;
      if (sess) {
        await order.save({ session: sess });
      } else {
        await order.save();
      }

      // Recalculate
      await WalletService.recalculate(userId, email, sess);
    };

    if (session) {
      await executeReward(session);
    } else {
      const newSession = await mongoose.startSession();
      await newSession.withTransaction(async () => {
        await executeReward(newSession);
      });
      await newSession.endSession();
    }
  }

  /**
   * Administrative adjustment - Credit.
   */
  static async credit(userId, email, amount, type, description, auditMetadata, idempotencyKey, session = null) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("Amount must be a positive integer.");
    }

    const executeCredit = async (sess) => {
      // 1. Idempotency Check
      if (idempotencyKey) {
        const existingQuery = BuyCoinTransaction.findOne({ idempotencyKey });
        if (sess) existingQuery.session(sess);
        const existing = await existingQuery;
        if (existing) return existing;
      }

      // 2. Fetch user to confirm existence and current balance
      const userQuery = User.findById(userId);
      if (sess) userQuery.session(sess);
      const user = await userQuery;
      if (!user) throw new Error("User not found.");

      const previousBalance = user.buyCoins || 0;
      const newBalance = previousBalance + amount;

      // 3. Create Transaction
      const tx = new BuyCoinTransaction({
        userId,
        email: email || user.email || "",
        type: type || "ADMIN_CREDIT",
        status: "COMPLETED",
        amount,
        coins: amount,
        description,
        idempotencyKey,
        audit: {
          ...auditMetadata,
          previousBalance,
          newBalance,
          actionName: "CREDIT",
          outcome: "SUCCESS"
        }
      });

      if (sess) {
        await tx.save({ session: sess });
      } else {
        await tx.save();
      }

      // 4. Update cached balance
      await WalletService.recalculate(userId, email || user.email || "", sess);
      return tx;
    };

    if (session) {
      return await executeCredit(session);
    } else {
      let result;
      const newSession = await mongoose.startSession();
      await newSession.withTransaction(async () => {
        result = await executeCredit(newSession);
      });
      await newSession.endSession();
      return result;
    }
  }

  /**
   * Administrative adjustment - Debit.
   */
  static async debit(userId, email, amount, type, description, auditMetadata, idempotencyKey, session = null) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("Amount must be a positive integer.");
    }

    const executeDebit = async (sess) => {
      // 1. Idempotency Check
      if (idempotencyKey) {
        const existingQuery = BuyCoinTransaction.findOne({ idempotencyKey });
        if (sess) existingQuery.session(sess);
        const existing = await existingQuery;
        if (existing) return existing;
      }

      // 2. Fetch user and check balance
      const userQuery = User.findById(userId);
      if (sess) userQuery.session(sess);
      const user = await userQuery;
      if (!user) throw new Error("User not found.");

      // Make sure we have the latest recalculated balance
      const walletQuery = BuyCoinWallet.findOne({ userId });
      if (sess) walletQuery.session(sess);
      const wallet = await walletQuery;
      const previousBalance = wallet ? wallet.availableCoins : (user.buyCoins || 0);

      if (previousBalance < amount) {
        throw new Error(`Insufficient BuyCoins balance. Available: ${previousBalance}, Requested debit: ${amount}`);
      }

      const newBalance = previousBalance - amount;

      // 3. Create Transaction
      const tx = new BuyCoinTransaction({
        userId,
        email: email || user.email || "",
        type: type || "ADMIN_DEBIT",
        status: "COMPLETED",
        amount,
        coins: amount,
        description,
        idempotencyKey,
        audit: {
          ...auditMetadata,
          previousBalance,
          newBalance,
          actionName: "DEBIT",
          outcome: "SUCCESS"
        }
      });

      if (sess) {
        await tx.save({ session: sess });
      } else {
        await tx.save();
      }

      // 4. Update cache
      await WalletService.recalculate(userId, email || user.email || "", sess);
      return tx;
    };

    if (session) {
      return await executeDebit(session);
    } else {
      let result;
      const newSession = await mongoose.startSession();
      await newSession.withTransaction(async () => {
        result = await executeDebit(newSession);
      });
      await newSession.endSession();
      return result;
    }
  }

  /**
   * Run balance reconciliation for single user, multiple users, or all users.
   */
  static async reconcile(options = {}, session = null) {
    const { userId, userIds, mode = "DRY_RUN" } = options; // mode: "DRY_RUN" or "REPAIR"
    const report = {
      timestamp: new Date(),
      mode,
      totalChecked: 0,
      mismatchesCount: 0,
      repairedCount: 0,
      mismatches: []
    };

    const processReconciliation = async (sess) => {
      let usersQuery = {};
      if (userId) {
        usersQuery = { _id: userId };
      } else if (userIds && userIds.length > 0) {
        usersQuery = { _id: { $in: userIds } };
      }

      const users = sess
        ? await User.find(usersQuery).session(sess).lean()
        : await User.find(usersQuery).lean();

      for (const u of users) {
        report.totalChecked++;

        // 1. Fetch cached state
        const cachedBalance = u.buyCoins || 0;

        // 2. Fetch current ledger calculation
        const txQuery = BuyCoinTransaction.find({ 
          userId: u._id, 
          status: { $in: ["COMPLETED", "REVERSED"] } 
        }).sort({ createdAt: 1 });
        if (sess) txQuery.session(sess);
        const transactions = await txQuery.lean();

        let lifetimeEarned = 0;
        let lifetimeRedeemed = 0;
        const creditTypes = ["earned", "earn", "bonus", "admin", "refund", "WELCOME_BONUS", "ORDER_REWARD", "CASHBACK", "ADMIN_CREDIT"];
        const debitTypes = ["spent", "redeem", "reversal", "ADMIN_DEBIT", "REDEMPTION", "REVERSAL", "EXPIRY"];

        for (const tx of transactions) {
          if (tx.status === "FAILED") continue;
          const val = Math.round(tx.amount !== undefined ? tx.amount : (tx.coins !== undefined ? tx.coins : 0));
          if (debitTypes.includes(tx.type)) {
            lifetimeRedeemed += val;
          } else if (creditTypes.includes(tx.type)) {
            lifetimeEarned += val;
          }
        }

        // FIFO consumption & expiry
        let remainingRedeemed = lifetimeRedeemed;
        let calculatedBalance = 0;
        const now = new Date();

        for (const tx of transactions) {
          if (tx.status === "FAILED") continue;
          if (creditTypes.includes(tx.type)) {
            const val = Math.round(tx.amount !== undefined ? tx.amount : (tx.coins !== undefined ? tx.coins : 0));
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

            if (unredeemedCoins > 0) {
              const expiry = tx.buyCoinExpiryDate || new Date(tx.createdAt.getTime() + 90 * 24 * 60 * 60 * 1000);
              if (expiry > now) {
                calculatedBalance += unredeemedCoins;
              }
            }
          }
        }

        // 3. Detect Mismatch
        if (cachedBalance !== calculatedBalance) {
          report.mismatchesCount++;
          report.mismatches.push({
            userId: u._id,
            email: u.email,
            cachedBalance,
            calculatedBalance
          });

          // 4. Repair if mode is REPAIR
          if (mode === "REPAIR") {
            await WalletService.recalculate(u._id, u.email, sess);
            report.repairedCount++;
          }
        }
      }
    };

    if (session) {
      await processReconciliation(session);
    } else {
      const newSession = await mongoose.startSession();
      await newSession.withTransaction(async () => {
        await processReconciliation(newSession);
      });
      await newSession.endSession();
    }

    return report;
  }
}

module.exports = WalletService;
