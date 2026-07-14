/**
 * Safe helper to push events to the Google Tag Manager dataLayer.
 * If GTM fails to load or is blocked, this prevents any runtime crashes.
 * @param {string} event - The event name
 * @param {Object} [data] - Optional structured event details
 */
export const pushToDataLayer = (event, data = {}) => {
  try {
    if (typeof window !== "undefined") {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event,
        ...data
      });
      if (import.meta.env.DEV) {
        console.log(`[GTM] Pushed event: "${event}"`, data);
      }
    }
  } catch (error) {
    console.error("❌ Google Tag Manager push failed:", error);
  }
};

/**
 * Tracks SPA virtual page view events
 * @param {string} path - The page path (e.g. location.pathname)
 * @param {string} title - The page document title
 */
export const trackPageView = (path, title) => {
  pushToDataLayer("page_view", {
    page_path: path,
    page_title: title
  });
};

/**
 * Tracks item view details (GA4 compatible)
 * @param {Object} product - Product details
 */
export const trackProductView = (product) => {
  if (!product) return;
  pushToDataLayer("product_view", {
    ecommerce: {
      items: [{
        item_id: product._id || product.id,
        item_name: product.name,
        price: product.price,
        item_brand: product.brand || "Buyto",
        item_category: product.category,
        quantity: 1
      }]
    }
  });
};

/**
 * Tracks search actions
 * @param {string} query - The search query term
 */
export const trackSearch = (query) => {
  pushToDataLayer("search", {
    search_term: query
  });
};

/**
 * Tracks adding items to cart
 * @param {Object} product - Product details
 * @param {number} [quantity=1] - Quantity added
 */
export const trackAddToCart = (product, quantity = 1) => {
  if (!product) return;
  pushToDataLayer("add_to_cart", {
    ecommerce: {
      items: [{
        item_id: product._id || product.id,
        item_name: product.name,
        price: product.price,
        item_brand: product.brand || "Buyto",
        item_category: product.category,
        quantity: Number(quantity)
      }]
    }
  });
};

/**
 * Tracks removing items from cart
 * @param {Object} product - Product details
 * @param {number} [quantity=1] - Quantity removed
 */
export const trackRemoveFromCart = (product, quantity = 1) => {
  if (!product) return;
  pushToDataLayer("remove_from_cart", {
    ecommerce: {
      items: [{
        item_id: product._id || product.id,
        item_name: product.name,
        price: product.price,
        item_brand: product.brand || "Buyto",
        item_category: product.category,
        quantity: Number(quantity)
      }]
    }
  });
};

/**
 * Tracks commencement of the checkout flow
 * @param {Array} cartItems - Array of products in cart
 * @param {number} totalValue - Total value of items
 */
export const trackBeginCheckout = (cartItems = [], totalValue = 0) => {
  const items = cartItems.map(item => ({
    item_id: item.productId?._id || item.productId?.id || item._id || item.id,
    item_name: item.name || item.productId?.name,
    price: item.price || item.productId?.price,
    item_brand: item.brand || item.productId?.brand || "Buyto",
    item_category: item.category || item.productId?.category,
    quantity: Number(item.quantity || 1)
  }));

  pushToDataLayer("begin_checkout", {
    ecommerce: {
      value: totalValue,
      currency: "INR",
      items
    }
  });
};

/**
 * Tracks successful order purchases
 * @param {Object} order - Order details from server response
 */
export const trackPurchase = (order) => {
  if (!order) return;
  const items = (order.items || []).map(item => ({
    item_id: item.productId?._id || item.productId?.id || item.productId,
    item_name: item.name,
    price: item.price,
    quantity: Number(item.quantity)
  }));

  pushToDataLayer("purchase", {
    ecommerce: {
      transaction_id: order._id || order.id,
      value: order.totalAmount || order.finalAmount,
      tax: order.gstCharges || 0,
      shipping: order.deliveryFee || 0,
      currency: "INR",
      items
    }
  });
};

/**
 * Tracks user logins
 * @param {string} method - Login method (e.g. "otp", "password")
 */
export const trackLogin = (method) => {
  pushToDataLayer("login", {
    method
  });
};

/**
 * Tracks user signups
 * @param {string} method - Registration method (e.g. "email", "phone")
 */
export const trackSignup = (method) => {
  pushToDataLayer("signup", {
    method
  });
};

/**
 * Tracks user wallet recharge actions
 * @param {number} amount - Recharge amount
 */
export const trackWalletRecharge = (amount) => {
  pushToDataLayer("wallet_recharge", {
    value: Number(amount),
    currency: "INR"
  });
};

/**
 * Tracks buycoins purchases
 * @param {number} coins - Amount of BuyCoins purchased
 * @param {number} amount - Cost of BuyCoins
 */
export const trackBuycoinsPurchase = (coins, amount) => {
  pushToDataLayer("buycoins_purchase", {
    coins: Number(coins),
    value: Number(amount),
    currency: "INR"
  });
};

/**
 * Tracks applied coupons
 * @param {string} couponCode - Coupon code name
 * @param {number} discount - Discount amount
 */
export const trackCouponApplied = (couponCode, discount) => {
  pushToDataLayer("coupon_applied", {
    coupon_code: couponCode,
    discount_amount: Number(discount)
  });
};

/**
 * Tracks category grid view actions
 * @param {string} categoryName - Category name
 */
export const trackCategoryView = (categoryName) => {
  pushToDataLayer("category_view", {
    item_category: categoryName
  });
};
