module.exports = {
  WELCOME_BONUS: Number(process.env.WELCOME_BONUS) || 20,
  MIN_BUYCOINS_ORDER: Number(process.env.MIN_BUYCOINS_ORDER) || 99,
  MAX_REDEMPTION_PERCENT: Number(process.env.MAX_REDEMPTION_PERCENT) || 20,
  BUYCOINS_EARNING_RATE: Number(process.env.BUYCOINS_EARNING_RATE) || 100
};
