import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import DiscountIcon from "../../assets/illustrations/discount_offer_icon.png";
import DeliveryIllustration from "../../assets/illustrations/free_delivery_illustration.png";

// Centralized offers configuration for scalability
export const OFFERS = {
  discount: {
    id: "discount",
    badge: "FLAT ₹50 OFF",
    title: "Get FLAT ₹50 OFF",
    subtitle: "on your first order above ₹249",
    image: DiscountIcon,
    bullets: [
      "The offer will be auto-applied (minimum order value of ₹249)",
      "Offer not applicable on Atta, Oil, Gold & Silver coins, Milk, Tobacco, Cigarettes, Baby products & Gift cards",
      "Limited period offer valid for select customers"
    ],
    cta: "Got it, thanks!"
  },
  delivery: {
    id: "delivery",
    badge: "FREE Delivery",
    title: "Get FREE delivery",
    subtitle: "On all your orders!",
    image: DeliveryIllustration,
    bullets: [],
    cta: "Got it, thanks!"
  }
};

let ignoreNextPopState = false;

function OffersBottomDrawer({ offerId, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startYRef = useRef(0);
  const drawerRef = useRef(null);

  const offer = OFFERS[offerId];

  // Smooth slide-out closing mechanism before unmounting
  const handleClose = useCallback(() => {
    setMounted(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  // Handle ESC key for accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  // Lock background scrolling with iOS/Safari support
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);

  // Trap focus inside the drawer for accessibility
  useEffect(() => {
    if (drawerRef.current) {
      const focusableElements = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [mounted]);

  // Handle Android Back Button / Browser Back Button
  useEffect(() => {
    window.history.pushState({ drawerOpen: true }, "");

    const handlePopState = (e) => {
      if (ignoreNextPopState) {
        ignoreNextPopState = false;
        return;
      }
      handleClose();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (window.history.state?.drawerOpen) {
        ignoreNextPopState = true;
        window.history.back();
      }
    };
  }, [handleClose]);

  // Handle animation trigger on mount reliably
  useEffect(() => {
    console.log("[OffersBottomDrawer] Mounted, offerId:", offerId);
    const timer = setTimeout(() => {
      setMounted(true);
    }, 20);
    return () => clearTimeout(timer);
  }, [offerId]);

  // Touch Gesture Handlers (Swipe down to close)
  const handleTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 100) {
      handleClose();
    } else {
      setDragOffset(0);
    }
  };

  if (!offer) return null;

  // GPU accelerated style objects
  const backdropStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    backdropFilter: "blur(4px)",
    zIndex: 9998,
    opacity: mounted ? 1 : 0,
    transition: "opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    willChange: "opacity"
  };

  const sheetStyle = {
    backgroundColor: "#ffffff",
    background: offerId === "discount" ? "linear-gradient(180deg, #FFFDF0 0%, #FFFFFF 65%)" : "#ffffff",
    borderTopLeftRadius: "28px",
    borderTopRightRadius: "28px",
    width: "100%",
    maxWidth: "480px",
    padding: "24px 24px calc(env(safe-area-inset-bottom) + 24px) 24px",
    boxShadow: "0 -8px 30px rgba(0, 0, 0, 0.15)",
    position: "fixed",
    left: "50%",
    bottom: 0,
    transform: mounted ? `translate(-50%, ${dragOffset}px)` : "translate(-50%, 100%)",
    transition: dragOffset > 0 ? "none" : "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    willChange: "transform",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    touchAction: "pan-y",
    zIndex: 9999,
    boxSizing: "border-box"
  };

  const dragIndicatorStyle = {
    width: "48px",
    height: "5px",
    backgroundColor: offerId === "discount" ? "rgba(0,0,0,0.06)" : "#e5e7eb",
    borderRadius: "3px",
    margin: "0 auto 20px auto",
    cursor: "pointer"
  };

  const closeButtonStyle = {
    position: "absolute",
    top: "-56px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#1e293b",
    border: "none",
    borderRadius: "50%",
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
    transition: "transform 0.2s ease",
    zIndex: 10000
  };

  const iconContainerStyle = {
    position: "relative",
    width: "100%",
    height: "170px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  };

  const roundedBadgeBoxStyle = {
    width: "110px",
    height: "110px",
    backgroundColor: "#ffffff",
    border: "1.5px solid #f1f5f9",
    borderRadius: "28px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2
  };

  const scallopedCircleStyle = {
    width: "82px",
    height: "82px",
    backgroundColor: "#fed7aa", // soft orange/yellow scalloped shape
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f59e0b'%3E%3Cpath d='M12 1.5l1.6 2.1 2.6-.6.5 2.6 2.4.9-.7 2.5 1.9 1.8-1.8 1.9.8 2.5-2.4.9-.6 2.6-2.6-.5L12 22.5l-1.6-2.1-2.6.6-.5-2.6-2.4-.9.7-2.5-1.9-1.8 1.8-1.9-.8-2.5 2.4-.9.6-2.6 2.6.5L12 1.5z'/%3E%3C/svg%3E")`,
    backgroundSize: "cover",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
    fontWeight: "900",
    color: "#78350f"
  };

  const watermarkStyle = (left, top, rotation) => ({
    position: "absolute",
    left: left,
    top: top,
    width: "64px",
    height: "64px",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23fed7aa'%3E%3Cpath d='M12 1.5l1.6 2.1 2.6-.6.5 2.6 2.4.9-.7 2.5 1.9 1.8-1.8 1.9.8 2.5-2.4.9-.6 2.6-2.6-.5L12 22.5l-1.6-2.1-2.6.6-.5-2.6-2.4-.9.7-2.5-1.9-1.8 1.8-1.9-.8-2.5 2.4-.9.6-2.6 2.6.5L12 1.5z'/%3E%3C/svg%3E")`,
    backgroundSize: "cover",
    opacity: 0.14, // Subtle faded watermark matching the screenshot
    transform: `rotate(${rotation}deg)`,
    pointerEvents: "none",
    userSelect: "none",
    zIndex: 1
  });

  const offerImageStyle = {
    width: "240px",
    height: "auto",
    display: "block",
    margin: "12px auto",
    objectFit: "contain"
  };

  const titleStyle = {
    fontSize: "24px",
    fontWeight: "850",
    color: "#1e293b",
    textAlign: "center",
    margin: "16px 0 6px 0",
    letterSpacing: "-0.5px"
  };

  const subtitleStyle = {
    fontSize: "14.5px",
    color: "#64748b",
    textAlign: "center",
    margin: "0 0 24px 0",
    fontWeight: "600"
  };

  const bulletListStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    margin: "0 0 28px 0",
    padding: "0 4px",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "20px"
  };

  const bulletItemStyle = {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    fontSize: "13.5px",
    color: "#475569",
    lineHeight: "1.5",
    fontWeight: "550"
  };

  const checkIconStyle = {
    color: "#16a34a",
    backgroundColor: "#dcfce7",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "bold",
    flexShrink: 0,
    marginTop: "2px"
  };

  const ctaButtonStyle = {
    display: "block",
    width: "100%",
    backgroundColor: "#2e7d32",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "750",
    padding: "14px 0",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(46, 125, 50, 0.15)",
    outline: "none"
  };

  return createPortal(
    <>
      <div
        style={backdropStyle}
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
      />
      <div
        ref={drawerRef}
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle bar */}
        <div style={dragIndicatorStyle} onClick={handleClose}></div>

        {/* Close Button above sheet */}
        <button onClick={handleClose} style={closeButtonStyle} aria-label="Close drawer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Header Illustration / Badges */}
        {offerId === "discount" ? (
          <div style={iconContainerStyle}>
            {/* Watermark badges in background */}
            <div style={watermarkStyle("10%", "20px", -15)} />
            <div style={watermarkStyle("75%", "25px", 18)} />
            <div style={watermarkStyle("2%", "100px", 25)} />
            <div style={watermarkStyle("84%", "90px", -12)} />

            <div style={roundedBadgeBoxStyle}>
              <div style={scallopedCircleStyle}>
                %
              </div>
            </div>
          </div>
        ) : (
          <img src={offer.image} alt={offer.title} style={offerImageStyle} />
        )}

        {/* Offer Details */}
        <h2 style={titleStyle}>{offer.title}</h2>
        <p style={subtitleStyle}>{offer.subtitle}</p>

        {/* Bullet Points with Checkmarks */}
        {offer.bullets.length > 0 && (
          <div style={bulletListStyle}>
            {offer.bullets.map((bullet, idx) => (
              <div key={idx} style={bulletItemStyle}>
                <span style={checkIconStyle}>✓</span>
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleClose}
          style={ctaButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#1b5e20";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#2e7d32";
          }}
        >
          {offer.cta}
        </button>
      </div>
    </>,
    document.body
  );
}

export default React.memo(OffersBottomDrawer);
