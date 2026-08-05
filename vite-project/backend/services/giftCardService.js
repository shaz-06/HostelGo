const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const GiftCard = require("../models/GiftCard");
const WalletService = require("./WalletService");

class GiftCardService {
  /**
   * Redeems a gift card for a user within a Mongoose transaction session.
   * @param {string} userId - User ID
   * @param {string} email - User Email
   * @param {string} code - 16 digit gift card code
   * @param {string} pin - 6 digit PIN
   * @returns {Promise<object>} Result object containing success state or error code
   */
  static async redeemCard(userId, email, code, pin) {
    const session = await mongoose.startSession();
    try {
      let result = null;

      await session.withTransaction(async () => {
        // Normalize code
        const normalizedCode = code.replace(/\s+/g, "").trim();

        // 1. Find the card by code
        const card = await GiftCard.findOne({ code: normalizedCode }).session(session);

        // Security check: Generic INVALID_CODE_OR_PIN error to prevent enumeration attacks
        if (!card) {
          throw new Error("INVALID_CODE_OR_PIN");
        }

        // 2. Validate PIN hash
        const isPinValid = await bcrypt.compare(pin, card.pinHash);
        if (!isPinValid) {
          throw new Error("INVALID_CODE_OR_PIN");
        }

        // 3. Check status
        if (card.status === "REDEEMED") {
          throw new Error("ALREADY_REDEEMED");
        }

        // 4. Check expiry
        if (card.expiresAt < new Date()) {
          throw new Error("EXPIRED");
        }

        // 5. Atomic Update status to REDEEMED
        const updatedCard = await GiftCard.findOneAndUpdate(
          { _id: card._id, status: "ACTIVE" },
          {
            status: "REDEEMED",
            redeemedBy: userId,
            redeemedAt: new Date()
          },
          { session, new: true }
        );

        if (!updatedCard) {
          // Document modified count 0 means another process marked it redeemed first
          throw new Error("ALREADY_REDEEMED");
        }

        // 6. Credit wallet
        const idempotencyKey = `giftcard-redeem:${normalizedCode}:${userId}`;
        const maskedCode = "************" + normalizedCode.slice(-4);
        
        const tx = await WalletService.credit(
          userId,
          email,
          card.amount,
          "ADMIN_CREDIT",
          `Redeemed Gift Card ${maskedCode}`,
          {
            source: "GIFT_CARD",
            giftCardId: card._id,
            giftCardCode: maskedCode,
            timestamp: new Date()
          },
          idempotencyKey,
          session
        );

        // Calculate new balance
        const updatedWallet = await WalletService.recalculate(userId, email, session);

        result = {
          success: true,
          creditedAmount: card.amount,
          walletBalance: updatedWallet ? updatedWallet.availableCoins : 0,
          transactionId: tx ? tx._id : null
        };
      });

      return result;
    } catch (err) {
      // Errors thrown inside transaction block automatically abort transaction
      console.error("❌ Mongoose: Transaction error in redeemCard:", err.message);
      
      const errorCode = ["INVALID_CODE_OR_PIN", "ALREADY_REDEEMED", "EXPIRED"].includes(err.message)
        ? err.message
        : "SERVER_ERROR";

      return {
        success: false,
        code: errorCode,
        message: err.message
      };
    } finally {
      await session.endSession();
    }
  }
}

module.exports = GiftCardService;
