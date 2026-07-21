import React, { useEffect } from "react";
import { useLocation, useSearchParams, useParams } from "react-router-dom";

export default function SEOHeadManager({ cartItemsCount = 0 }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const params = useParams();

  useEffect(() => {
    const path = location.pathname;
    const searchQuery = searchParams.get("q") || "";

    let title = "Buyto – Instant Grocery & Daily Essentials Delivery";
    let description = "Buyto delivers fresh groceries, daily essentials, snacks, and beverages right to your doorstep in minutes.";
    let ogType = "website";
    let canonical = window.location.origin + path + (location.search || "");

    if (path === "/") {
      title = "Buyto – Instant Grocery & Daily Essentials Delivery";
      description = "Fastest 10-minute grocery delivery app. Order fresh fruits, vegetables, dairy, eggs, and snacks online on Buyto.";
    } else if (path === "/profile/edit") {
      title = "Edit Profile • Buyto";
      description = "Update your personal details, avatar photo, and mobile contact number on Buyto.";
    } else if (path === "/profile") {
      title = "My Account • Buyto";
      description = "Manage your account profile, addresses, and settings on Buyto.";
    } else if (path === "/orders" || path === "/my-orders") {
      title = "My Orders • Buyto";
      description = "View your past orders, active deliveries, and receipts on Buyto.";
    } else if (path.startsWith("/orders/") || path.startsWith("/track-order/")) {
      const orderId = path.split("/").pop();
      title = `Order #${orderId ? orderId.slice(-6).toUpperCase() : ""} • Buyto`;
      description = `Track live delivery status and location for order #${orderId}.`;
    } else if (path === "/cart") {
      const count = cartItemsCount || 0;
      title = count > 0 ? `Cart (${count} ${count === 1 ? "Item" : "Items"}) • Buyto` : "Cart • Buyto";
      description = "Review your items, apply discount coupons, and checkout securely on Buyto.";
    } else if (path === "/categories") {
      title = "Categories • Buyto";
      description = "Explore fresh grocery categories including Fruits, Vegetables, Dairy, Meat, Snacks, and Beverages on Buyto.";
    } else if (path.startsWith("/category/") || path.startsWith("/products/")) {
      const categorySlug = path.split("/").pop();
      const formattedCategory = categorySlug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      title = `${formattedCategory} • Buyto`;
      description = `Shop top quality ${formattedCategory} online with fast 10-minute delivery on Buyto.`;
    } else if (path === "/search") {
      title = searchQuery ? `Search: ${searchQuery} • Buyto` : "Search Products • Buyto";
      description = searchQuery ? `Search results for "${searchQuery}" on Buyto.` : "Search across thousands of daily essentials and groceries on Buyto.";
    } else if (path.startsWith("/product/")) {
      // ProductDetailsPage updates its own title with product name dynamically
      return;
    } else if (path === "/wishlist" || path === "/save-for-later") {
      title = "Wishlist • Buyto";
      description = "View your saved products and favorite items on Buyto.";
    } else if (path === "/buycoins" || path === "/wallet") {
      title = "BuyCoins Wallet • Buyto";
      description = "Check your BuyCoins balance, cashback earnings, and loyalty rewards on Buyto.";
    } else if (path === "/settings") {
      title = "Settings • Buyto";
      description = "Update your application preferences and security settings on Buyto.";
    } else if (path === "/notifications") {
      title = "Notifications • Buyto";
      description = "View your order alerts, delivery notifications, and special offers on Buyto.";
    } else if (path === "/address") {
      title = "Saved Addresses • Buyto";
      description = "Manage your saved hostel and campus delivery addresses on Buyto.";
    } else if (path === "/about") {
      title = "About Us • Buyto";
    } else if (path === "/contact") {
      title = "Contact Support • Buyto";
    } else if (path === "/privacy-policy") {
      title = "Privacy Policy • Buyto";
    } else if (path === "/terms") {
      title = "Terms & Conditions • Buyto";
    } else if (path === "/faq") {
      title = "Frequently Asked Questions • Buyto";
    }

    // Update document title
    document.title = title;

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", description);

    // Update Open Graph Title & Description
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", title);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute("content", description);

    // Update Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonical);

  }, [location.pathname, location.search, searchParams, params, cartItemsCount]);

  return null;
}
