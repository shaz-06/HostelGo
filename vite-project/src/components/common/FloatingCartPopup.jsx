import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";

const ScooterSVG = ({ isUnlocking }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    style={{
      transformOrigin: "bottom center",
      animation: isUnlocking 
        ? "scooter-accelerate 1.5s cubic-bezier(0.25, 1, 0.5, 1) infinite" 
        : "scooter-drift 3s ease-in-out infinite",
    }}
  >
    <style>{`
      @keyframes scooter-drift {
        0%, 100% { transform: translateY(0) translateX(0); }
        50% { transform: translateY(-1px) translateX(0.5px); }
      }
      @keyframes scooter-accelerate {
        0% { transform: translateX(0) scale(1); }
        30% { transform: translateX(-2px) scale(0.95) skewX(4deg); }
        100% { transform: translateX(45px) scale(1.05); opacity: 0; }
      }
      @keyframes wheel-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
    {/* Scooter Body */}
    <path
      d="M19 17h2c.6 0 1-.4 1-1v-3c0-.6-.4-1-1-1h-2v5zM5 17h10v-4H5v4z"
      fill="#318616"
    />
    <path
      d="M17 11V7c0-1.1-.9-2-2-2h-3v6h5z"
      fill="#F59E0B"
    />
    {/* Wheels */}
    <circle
      cx="6"
      cy="18"
      r="2.5"
      fill="#1E293B"
      stroke="#FFFFFF"
      strokeWidth="1"
      style={{
        transformOrigin: "6px 18px",
        animation: "wheel-spin 1s linear infinite"
      }}
    />
    <circle
      cx="18"
      cy="18"
      r="2.5"
      fill="#1E293B"
      stroke="#FFFFFF"
      strokeWidth="1"
      style={{
        transformOrigin: "18px 18px",
        animation: "wheel-spin 1s linear infinite"
      }}
    />
    {/* Box on back */}
    <rect
      x="3"
      y="8"
      width="6"
      height="6"
      rx="1"
      fill="#16A34A"
    />
  </svg>
);

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
  const [justUnlocked, setJustUnlocked] = useState(false);

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

  useEffect(() => {
    if (isFree) {
      setJustUnlocked(true);
      const timer = setTimeout(() => setJustUnlocked(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isFree]);

  // Determine if bottom navigation is currently active on the page
  const hasBottomNav = !(
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/rider") ||
    ["/login", "/signup", "/checkout", "/payment", "/success", "/order-success"].includes(location.pathname)
  );

  // Determine pill sizes
  const greenPillWidth = isMobile ? 110 : 120;
  const progressPercent = Math.min(100, Math.max(0, (totalPrice / freeDeliveryThreshold) * 100));

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
            maxWidth: isMobile ? "98vw" : "540px",
          }}
        >
          {/* Confetti & Glow styles */}
          <style>{`
            @keyframes confetti-pop-1 {
              0% { transform: translate(0, 0) scale(1); opacity: 1; }
              100% { transform: translate(-40px, -30px) scale(0.5); opacity: 0; }
            }
            @keyframes confetti-pop-2 {
              0% { transform: translate(0, 0) scale(1); opacity: 1; }
              100% { transform: translate(35px, -40px) scale(0.5); opacity: 0; }
            }
            @keyframes confetti-pop-3 {
              0% { transform: translate(0, 0) scale(1); opacity: 1; }
              100% { transform: translate(-25px, 35px) scale(0.5); opacity: 0; }
            }
            @keyframes confetti-pop-4 {
              0% { transform: translate(0, 0) scale(1); opacity: 1; }
              100% { transform: translate(45px, 25px) scale(0.5); opacity: 0; }
            }
            @keyframes shimmer {
              0% { left: -35%; }
              100% { left: 100%; }
            }
          `}</style>

          {/* STEP 2: Floating Glass Card (Free Delivery Progress Tracker) */}
          <motion.div
            key="white-message-pill"
            initial={{ y: 100, opacity: 0, width: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              width: isMobile ? 240 : 360,
              height: 72,
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
              background: isFree ? "#ECFDF3" : "linear-gradient(135deg, #F8FFF7 0%, #F1FFF4 50%, #ECFFF2 100%)",
              border: "1px solid rgba(49, 134, 22, 0.12)",
              borderRadius: "999px",
              backdropFilter: "blur(16px)",
              boxShadow: "0 15px 40px rgba(49, 134, 22, 0.12)",
              display: "flex",
              flexDirection: "column",
              padding: "10px 20px",
              cursor: "pointer",
              pointerEvents: "auto",
              overflow: "hidden",
              position: "relative",
              boxSizing: "border-box",
              justifyContent: "space-between",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Confetti items */}
            {justUnlocked && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 10 }}>
                <div style={{ position: "absolute", top: "25%", left: "40%", width: "5px", height: "5px", background: "#facc15", borderRadius: "50%", animation: "confetti-pop-1 1.2s ease-out forwards" }} />
                <div style={{ position: "absolute", top: "35%", right: "45%", width: "5px", height: "5px", background: "#f43f5e", borderRadius: "50%", animation: "confetti-pop-2 1.2s ease-out forwards" }} />
                <div style={{ position: "absolute", bottom: "35%", left: "45%", width: "4px", height: "4px", background: "#3b82f6", borderRadius: "50%", animation: "confetti-pop-3 1.2s ease-out forwards" }} />
                <div style={{ position: "absolute", top: "20%", right: "30%", width: "5px", height: "5px", background: "#10b981", borderRadius: "50%", animation: "confetti-pop-4 1.2s ease-out forwards" }} />
              </div>
            )}

            {/* Row 1: Icon, Headline message, and percentage */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "14px" }}>🚚</span>
                <span style={{ fontSize: isMobile ? "11px" : "13px", fontWeight: "700", color: "#1F2937", letterSpacing: "-0.3px" }}>
                  {isFree ? (
                    <span>FREE Delivery Unlocked! 🎉</span>
                  ) : (
                    <span><span style={{ color: "#318616", fontWeight: "900" }}>₹{diff}</span> left for FREE Delivery</span>
                  )}
                </span>
              </div>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#318616" }}>
                {Math.round(progressPercent)}%
              </span>
            </div>

            {/* Row 2: Progress bar, scooter track, and spent info */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
              {/* Progress Bar Track with moving scooter */}
              <div style={{ position: "relative", flexGrow: 1, height: "18px", display: "flex", alignItems: "center" }}>
                {/* Progress Bar Line */}
                <div style={{ position: "relative", width: "100%", height: "6px", background: "#E6F6E6", borderRadius: "999px", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                    style={{
                      height: "100%",
                      background: "linear-gradient(90deg, #34D399, #16A34A)",
                      borderRadius: "999px",
                      position: "relative"
                    }}
                  >
                    {/* Glossy highlight shimmer */}
                    <div style={{
                      position: "absolute",
                      top: 0, left: 0, bottom: 0, width: "30%",
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                      animation: "shimmer 3.5s infinite linear"
                    }} />
                  </motion.div>
                </div>

                {/* Scooter positioned at progressPercent */}
                <motion.div
                  animate={{ left: `${Math.max(0, Math.min(92, progressPercent))}%` }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                  style={{
                    position: "absolute",
                    bottom: "1px",
                    transform: "translateX(-50%)",
                    pointerEvents: "none",
                    zIndex: 2
                  }}
                >
                  {isFree ? (
                    <span style={{ fontSize: "11px" }}>🏁</span>
                  ) : (
                    <ScooterSVG isUnlocking={isFree} />
                  )}
                </motion.div>

                {/* Finish Flag at the right end of the bar */}
                {!isFree && (
                  <div style={{ position: "absolute", right: "-2px", top: "-3px", zIndex: 1, fontSize: "11px" }}>
                    🏁
                  </div>
                )}
              </div>

              {/* Progress Label */}
              <span style={{ fontSize: "10px", fontWeight: "750", color: "#318616", flexShrink: 0 }}>
                ₹{totalPrice} / ₹{freeDeliveryThreshold}
              </span>
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
              height: "56px",
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
              boxSizing: "border-box",
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
