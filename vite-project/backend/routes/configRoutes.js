const express = require("express");
const router = express.Router();
const constants = require("../config/constants");

// GET /api/config
router.get("/", (req, res) => {
  return res.json({
    configVersion: 1,
    buyCoins: {
      welcomeBonus: constants.WELCOME_BONUS,
      minBuyCoinsOrder: constants.MIN_BUYCOINS_ORDER,
      maxRedemptionPercent: constants.MAX_REDEMPTION_PERCENT,
      buyCoinsEarningRate: constants.BUYCOINS_EARNING_RATE
    }
  });
});

module.exports = router;
