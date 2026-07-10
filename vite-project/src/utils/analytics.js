/**
 * Google Analytics 4 (GA4) Utility for Buyto React SPA.
 * Handles initialization, page tracking, and custom event dispatching safely.
 */

let isInitialized = false;

// Safe wrapper to prevent crashes if GA is blocked by ad-blockers or connection fails
const safeGtag = (...args) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    try {
      window.gtag(...args);
    } catch (err) {
      console.warn("[Analytics] Error calling gtag:", err);
    }
  }
};

/**
 * Initializes Google Analytics 4 by dynamically loading gtag.js.
 * Only runs in production environment to avoid developer noise.
 */
export const initializeAnalytics = () => {
  if (isInitialized) return;

  // Enforce production-only tracking
  if (!import.meta.env.PROD) {
    console.log("[Analytics] Development mode: Analytics tracking is disabled.");
    return;
  }

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) {
    console.warn("[Analytics] Missing VITE_GA_MEASUREMENT_ID environment variable. Skipping initialization.");
    return;
  }

  try {
    // 1. Inject script tag asynchronously
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // 2. Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    // 3. Configure defaults (disable default pageview to handle manually in SPA)
    safeGtag("js", new Date());
    safeGtag("config", measurementId, {
      send_page_view: false,
      cookie_flags: "SameSite=None;Secure"
    });

    isInitialized = true;
    console.log(`[Analytics] Google Analytics 4 initialized successfully with ID: ${measurementId}`);
  } catch (err) {
    console.error("[Analytics] Failed to initialize Google Analytics:", err);
  }
};

/**
 * Tracks a page view event manually.
 * @param {string} path - The relative URL path (e.g. /about).
 */
export const trackPageView = (path) => {
  if (!import.meta.env.PROD) return;
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;

  const fullPath = path || window.location.pathname;
  safeGtag("event", "page_view", {
    page_path: fullPath,
    page_location: window.location.href,
    page_title: document.title,
    send_to: measurementId
  });
  console.log(`[Analytics] Tracked Page View: ${fullPath}`);
};

/**
 * Tracks a custom event.
 * @param {string} name - Event name (e.g. 'add_to_cart').
 * @param {object} [parameters] - Event metadata parameters.
 */
export const trackEvent = (name, parameters = {}) => {
  if (!import.meta.env.PROD) return;
  safeGtag("event", name, parameters);
  console.log(`[Analytics] Tracked Event: ${name}`, parameters);
};

/* ==========================================================================
   Ecommerce & Action Event Helpers
   ========================================================================== */

/**
 * Tracks when a user views a product detail page.
 * @param {object} product - The product details.
 */
export const trackProductView = (product) => {
  trackEvent("view_item", {
    currency: "INR",
    value: product.price || 0,
    items: [
      {
        item_id: product._id || product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category,
        item_brand: product.brand || "Generic"
      }
    ]
  });
};

/**
 * Tracks when a user adds a product to their shopping cart.
 * @param {object} product - The product details.
 * @param {number} quantity - Quantity added.
 */
export const trackAddToCart = (product, quantity = 1) => {
  trackEvent("add_to_cart", {
    currency: "INR",
    value: (product.price || 0) * quantity,
    items: [
      {
        item_id: product._id || product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category,
        item_brand: product.brand || "Generic",
        quantity: quantity
      }
    ]
  });
};

/**
 * Tracks when a user removes an item from their cart.
 * @param {object} product - The product details.
 * @param {number} quantity - Quantity removed.
 */
export const trackRemoveFromCart = (product, quantity = 1) => {
  trackEvent("remove_from_cart", {
    currency: "INR",
    value: (product.price || 0) * quantity,
    items: [
      {
        item_id: product._id || product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category,
        item_brand: product.brand || "Generic",
        quantity: quantity
      }
    ]
  });
};

/**
 * Tracks when a user begins the checkout process.
 * @param {Array} cartItems - Array of products in cart.
 * @param {number} totalValue - Total cart value.
 */
export const trackCheckoutStarted = (cartItems = [], totalValue = 0) => {
  trackEvent("begin_checkout", {
    currency: "INR",
    value: totalValue,
    items: cartItems.map((item) => ({
      item_id: item._id || item.id,
      item_name: item.name,
      price: item.price,
      item_category: item.category,
      item_brand: item.brand || "Generic",
      quantity: item.quantity || 1
    }))
  });
};

/**
 * Tracks when a user successfully completes a purchase.
 * @param {object} order - Order details containing id, revenue, items, etc.
 */
export const trackPurchase = (order) => {
  trackEvent("purchase", {
    transaction_id: order.id || order.orderId,
    value: order.total || order.amount,
    currency: "INR",
    tax: order.tax || 0,
    shipping: order.deliveryCharge || 0,
    items: (order.items || []).map((item) => ({
      item_id: item.productId || item.id || item._id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity || 1
    }))
  });
};

/**
 * Tracks search query submissions.
 * @param {string} query - The search query term.
 */
export const trackSearch = (query) => {
  trackEvent("search", {
    search_term: query
  });
};

/**
 * Tracks user logins.
 * @param {string} [method='otp'] - Login method (e.g. 'otp', 'google').
 */
export const trackLogin = (method = "otp") => {
  trackEvent("login", {
    method: method
  });
};

/**
 * Tracks user signups.
 * @param {string} [method='otp'] - Signup method (e.g. 'otp', 'google').
 */
export const trackSignup = (method = "otp") => {
  trackEvent("sign_up", {
    method: method
  });
};

/**
 * Tracks content share actions.
 * @param {string} method - Share method (e.g. 'copy_link', 'native_share').
 * @param {string} contentId - Content ID shared.
 */
export const trackShare = (method, contentId) => {
  trackEvent("share", {
    method: method,
    content_type: "product",
    item_id: contentId
  });
};
