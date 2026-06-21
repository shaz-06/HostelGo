export function calculateBill(subtotal, originalSubtotal, config = {}, deliverySettings = {}, couponApplied = null, buyCoinsToRedeem = 0) {
  const cfg = {
    handlingFee: typeof config.handlingFee === "number" ? config.handlingFee : 0, // Default handling fee: ₹0
    gstPercentage: typeof config.gstPercentage === "number" ? config.gstPercentage : 5,
    gstFixedCharges: typeof config.gstFixedCharges === "number" ? config.gstFixedCharges : 2,
  };

  const itemTotal = subtotal;
  const originalItemTotal = typeof originalSubtotal === "number" ? originalSubtotal : subtotal;

  const handling = itemTotal > 0 ? cfg.handlingFee : 0;
  
  // Rule 3: Small Cart Fee
  // If Item Total < ₹149 → Apply ₹20.
  // If Item Total ≥ ₹149 → Apply ₹0 (do not show)
  const smallCart = (itemTotal > 0 && itemTotal < 149) ? 20 : 0;
  
  // Rule 4: Delivery Partner Fee
  // If Item Total < ₹200 → Apply ₹28.
  // If Item Total ≥ ₹200 → Apply ₹20.
  const delivery = itemTotal > 0 ? (itemTotal < 200 ? 28 : 20) : 0;

  // Rule 5: Rain Fee
  // If rainyDeliveryEnabled is true → Apply ₹30. Otherwise ₹0.
  const isRainyEnabled = Boolean(deliverySettings.rainyDeliveryEnabled);
  const rain = (itemTotal > 0 && isRainyEnabled) ? 30 : 0;

  // Rule 6: Late Night Fee
  // If lateNightDeliveryEnabled is true AND time is 10:00 PM or later (hours >= 22 or hours < 6) → Apply ₹30. Otherwise ₹0.
  const isLateNightEnabled = Boolean(deliverySettings.lateNightDeliveryEnabled);
  const now = new Date();
  const hours = now.getHours();
  const isLateNightTime = hours >= 22 || hours < 6;
  const lateNight = (itemTotal > 0 && isLateNightEnabled && isLateNightTime) ? 30 : 0;

  // GST
  const gst = itemTotal > 0 ? Math.round(itemTotal * (cfg.gstPercentage / 100) + cfg.gstFixedCharges) : 0;

  // Pre-discount total
  const preDiscountTotal = itemTotal > 0 
    ? itemTotal + handling + smallCart + delivery + rain + lateNight + gst 
    : 0;

  // Coupon discount
  let couponDiscount = 0;
  let appliedCouponCode = "";
  let appliedCouponId = null;
  if (couponApplied && itemTotal >= (couponApplied.minimumOrderValue || couponApplied.minOrderValue || 149)) {
    couponDiscount = Math.min(couponApplied.discountAmount || 20, preDiscountTotal);
    appliedCouponCode = couponApplied.couponCode;
    appliedCouponId = couponApplied._id;
  }

  // BuyCoins discount (1 coin = ₹1 discount, capped at 20% of product subtotal, must not reduce order value below platform minimum of ₹1)
  const remaining = Math.max(0, preDiscountTotal - couponDiscount);
  const maxRedemption = Math.floor(itemTotal * 0.20);
  const coinsRedeemed = Math.min(buyCoinsToRedeem, maxRedemption, Math.max(0, remaining - 1));
  const buyCoinsDiscount = coinsRedeemed;

  const total = itemTotal > 0 ? Math.max(1, remaining - buyCoinsDiscount) : 0;

  // Original total calculation (for visual styling/crossed-out comparisons)
  const originalSmallCart = (originalItemTotal > 0 && originalItemTotal < 149) ? 20 : 0;
  const originalDelivery = originalItemTotal > 0 ? (originalItemTotal < 200 ? 28 : 20) : 0;
  const originalTotal = originalItemTotal > 0
    ? originalItemTotal + handling + originalSmallCart + originalDelivery + rain + lateNight + gst
    : 0;

  return {
    itemTotal,
    originalItemTotal,
    handlingFee: handling,
    smallCartFee: smallCart,
    deliveryFee: delivery,
    configuredDeliveryFee: delivery,
    isDeliveryFree: false,
    rainFee: rain,
    lateNightFee: lateNight,
    gstAndCharges: gst,
    couponDiscount,
    couponCode: appliedCouponCode,
    couponId: appliedCouponId,
    buyCoinsRedeemed: coinsRedeemed,
    buyCoinsDiscount,
    total,
    originalTotal,
  };
}