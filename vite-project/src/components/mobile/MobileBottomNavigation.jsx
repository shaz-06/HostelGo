import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MOBILE_NAV_HEIGHT } from "../../constants/layoutConstants";

const MobileBottomNavigation = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  const [supportsBlur, setSupportsBlur] = useState(true);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const supports =
        window.CSS?.supports?.("backdrop-filter", "blur(20px)") ||
        window.CSS?.supports?.("-webkit-backdrop-filter", "blur(20px)");
      setSupportsBlur(!!supports);
    }
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const diff = scrollY - lastScrollY;
      
      if (scrollY <= 10) {
        setIsVisible(true);
        lastScrollY = scrollY;
        return;
      }

      if (Math.abs(diff) > 5) {
        setIsVisible(scrollY > lastScrollY);
        lastScrollY = scrollY;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getActiveTab = () => {
    const path = location.pathname;
    const search = location.search;

    if (search.includes("scroll=categories") || path === "/categories") return "categories";
    if (path.startsWith("/section/trending")) return "top-picks";
    if (
      path === "/" ||
      path === "/shopping-list" ||
      path === "/shopping-list/results" ||
      path === "/saved-lists" ||
      path === "/save-for-later" ||
      path.startsWith("/product/") ||
      path === "/cart" ||
      path === "/payment"
    ) {
      return "home";
    }
    return "";
  };

  const currentActive = getActiveTab();

  const handleTabPress = (tab) => {
    if (tab === "home") {
      navigate("/");
    } else if (tab === "categories") {
      navigate("/?scroll=categories");
      setTimeout(() => {
        const el = document.getElementById("mobile-categories-anchor") || document.getElementById("product-listings-anchor");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } else if (tab === "top-picks") {
      navigate("/section/trending");
    }
  };

  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3L21 9.5V20C21 20.5 20.5 21 20 21H4C3.5 21 3 20.5 3 20V9.5Z"></path>
          <path d="M9 21V12H15V21"></path>
        </svg>
      )
    },
    {
      id: "categories",
      label: "Categories",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
          <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
          <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
        </svg>
      )
    },
    {
      id: "top-picks",
      label: "Top picks",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L14.7 4.7L18.5 3.8L19.4 7.6L22.8 9.3L21.1 12.8L22.8 16.3L19.4 18L18.5 21.8L14.7 20.9L12 23.6L9.3 20.9L5.5 21.8L4.6 18L1.2 16.3L2.9 12.8L1.2 9.3L4.6 7.6L5.5 3.8L9.3 4.7L12 2Z"></path>
          <circle cx="9.5" cy="9.5" r="1.5" fill="currentColor"></circle>
          <circle cx="14.5" cy="14.5" r="1.5" fill="currentColor"></circle>
          <line x1="14" y1="10" x2="10" y2="14"></line>
        </svg>
      )
    }
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        left: "16px",
        right: "16px",
        maxWidth: "calc(100vw - 32px)",
        transform: isVisible ? "translate3d(0, 0, 0)" : "translate3d(0, 150px, 0)",
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
        width: "auto",
        height: `${MOBILE_NAV_HEIGHT}px`,
        background: supportsBlur ? "rgba(49, 134, 22, 0.15)" : "rgba(255, 255, 255, 0.92)",
        backdropFilter: supportsBlur ? "blur(20px)" : "none",
        WebkitBackdropFilter: supportsBlur ? "blur(20px)" : "none",
        borderRadius: "999px",
        border: "1px solid rgba(255, 255, 255, 0.25)",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 6px",
        boxSizing: "border-box",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        transition: "transform 0.25s ease, opacity 0.25s ease"
      }}
    >
      {navItems.map((item) => {
        const isActive = currentActive === item.id;
        return (
          <div
            key={item.id}
            onClick={() => handleTabPress(item.id)}
            style={{
              flex: isActive ? "0 0 auto" : "1",
              minWidth: 0,
              height: "calc(100% - 12px)",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: isActive ? "rgba(255, 255, 255, 0.35)" : "transparent",
              backdropFilter: isActive && supportsBlur ? "blur(15px)" : "none",
              WebkitBackdropFilter: isActive && supportsBlur ? "blur(15px)" : "none",
              color: isActive ? "#318616" : "#1f2937",
              borderRadius: "999px",
              transform: isActive ? "scale(1.04)" : "scale(1)",
              padding: isActive ? "8px 18px" : "0 8px",
              margin: "2px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {item.icon}
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: isActive ? "600" : "500",
                color: isActive ? "#318616" : "#1f2937",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
});

MobileBottomNavigation.displayName = "MobileBottomNavigation";
export default MobileBottomNavigation;
