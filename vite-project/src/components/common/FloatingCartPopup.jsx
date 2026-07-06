import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight, Check } from "lucide-react";

export default function FloatingCartPopup({
  totalItems = 0,
  totalPrice = 0,
  freeDeliveryThreshold = 99,
  mobileOffset = 80,
  bottomNavVisible = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Do not show on checkout, payment, success, login, signup, admin, or rider pages, or on the cart page itself
  const isVisible =
    totalItems > 0 &&
    location.pathname !== "/cart" &&
    location.pathname !== "/success" &&
    location.pathname !== "/payment" &&
    location.pathname !== "/checkout" &&
    location.pathname !== "/login" &&
    location.pathname !== "/signup" &&
    !location.pathname.startsWith("/admin") &&
    !location.pathname.startsWith("/rider");

  const diff = freeDeliveryThreshold - totalPrice;
  const isFree = diff <= 0;

  // Determine if bottom navigation is currently active on the page
  const hasBottomNav = !(
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/rider") ||
    ["/login", "/signup", "/checkout", "/payment", "/success", "/order-success"].includes(location.pathname)
  );

  // Determine pill sizes
  const greenPillWidth = isMobile ? 120 : 130;
  const whitePillWidth = isMobile ? 220 : 340;

  const content = (
    <AnimatePresence>
      {isVisible && (
        <div
          style={{
            position: "fixed",
            bottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
            left: "50%",
            transform: `translate3d(-50%, ${hasBottomNav && bottomNavVisible ? -56 : 0}px, 0)`,
            transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            zIndex: 9999, // Ensure it stays above bottom navigation, product cards, sticky headers, banners
            pointerEvents: "none",
            width: "max-content",
            maxWidth: isMobile ? "95vw" : "520px",
          }}
        >
          {/* STEP 2: White/Light-green Message Pill */}
          <motion.div
            key="white-message-pill"
            initial={{ y: 100, opacity: 0, width: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              width: whitePillWidth,
              transition: {
                delay: 0.15,
                duration: 0.3,
                ease: "easeOut",
              },
            }}
            exit={{
              width: 0,
              y: 100,
              opacity: 0,
              transition: {
                duration: 0.3,
                ease: "easeIn",
              },
            }}
            onClick={() => navigate("/cart")}
            style={{
              height: "56px",
              background: "rgba(240, 253, 244, 0.98)", // Minty light green
              border: "1px solid #bbf7d0",
              borderRadius: "28px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              cursor: "pointer",
              pointerEvents: "auto",
              overflow: "hidden",
              whiteSpace: "nowrap",
              gap: "8px",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Scalloped checkmark circle */}
            <div
              style={{
                width: "28px",
                height: "28px",
                background: "#16a34a",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 2px 6px rgba(22, 163, 74, 0.2)",
              }}
            >
              {isFree ? (
                <Check size={16} color="white" strokeWidth={3} />
              ) : (
                <span style={{ fontSize: "14px", fontWeight: "900", color: "white" }}>ℹ</span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {isFree ? (
                <span
                  style={{
                    fontSize: isMobile ? "11px" : "13px",
                    fontWeight: "800",
                    color: "#166534",
                  }}
                >
                  You've unlocked FREE delivery
                </span>
              ) : (
                <span
                  style={{
                    fontSize: isMobile ? "11px" : "13px",
                    fontWeight: "800",
                    color: "#166534",
                  }}
                >
                  Add ₹{diff} more for FREE delivery
                </span>
              )}
            </div>
          </motion.div>

          {/* STEP 1: Dark Green Cart Pill */}
          <motion.div
            key="dark-green-cart-pill"
            initial={{ y: 100, opacity: 0, width: 56, borderRadius: "50%" }}
            animate={{
              y: 0,
              opacity: 1,
              width: greenPillWidth,
              borderRadius: "28px",
              transition: {
                duration: 0.3,
                ease: "easeOut",
              },
            }}
            exit={{
              width: 56,
              borderRadius: "50%",
              y: 100,
              opacity: 0,
              transition: {
                delay: 0.15,
                duration: 0.3,
                ease: "easeIn",
              },
            }}
            onClick={() => navigate("/cart")}
            style={{
              height: "56px",
              background: "#064e3b", // Dark green
              boxShadow: "0 10px 25px -5px rgba(6, 78, 59, 0.3), 0 8px 10px -6px rgba(6, 78, 59, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 14px",
              cursor: "pointer",
              pointerEvents: "auto",
              overflow: "hidden",
              whiteSpace: "nowrap",
              gap: "8px",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Cart Icon in transparent circle */}
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "rgba(52, 211, 153, 0.15)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShoppingBag size={18} color="#34d399" />
            </div>

            {/* Item count & Arrow */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "white",
                fontWeight: "800",
                fontSize: "16px",
              }}
            >
              <span>{totalItems}</span>
              <ArrowRight size={18} color="white" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
