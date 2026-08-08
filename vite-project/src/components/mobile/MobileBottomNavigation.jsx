import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const MobileBottomNavigation = React.memo(({ isVisible = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [categoriesAnimKey, setCategoriesAnimKey] = useState(0);
  const [ordersAnimKey, setOrdersAnimKey] = useState(0);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path === "/orders" || path === "/my-orders" || path === "/order-again") return "orders";
    if (path === "/categories") return "categories";
    if (path === "/profile" || path === "/profile/edit") return "profile";
    return "";
  };

  const currentActive = getActiveTab();

  useEffect(() => {
    if (currentActive === "categories") {
      setCategoriesAnimKey(prev => prev + 1);
    }
    if (currentActive === "orders") {
      setOrdersAnimKey(prev => prev + 1);
    }
  }, [currentActive]);

  const handleTabPress = (tab) => {
    if (tab === "home") {
      navigate("/");
    } else if (tab === "orders") {
      setOrdersAnimKey(prev => prev + 1);
      navigate("/order-again");
    } else if (tab === "categories") {
      setCategoriesAnimKey(prev => prev + 1);
      navigate("/categories");
    } else if (tab === "profile") {
      navigate("/profile");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: isVisible ? "translate3d(-50%, 0, 0)" : "translate3d(-50%, 100%, 0)",
        width: "100%",
        maxWidth: "480px",
        height: "calc(70px + env(safe-area-inset-bottom, 0px))",
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid #E5E7EB",
        boxSizing: "border-box",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        fontFamily: "'Outfit', 'Inter', sans-serif",
      }}
    >
      {/* CSS Animation Keyframes Injector */}
      <style>{`
        /* Categories Animations */
        @keyframes clay-icon-scale {
          0% { transform: scale(1); }
          15% { transform: scale(0.86); }
          85% { transform: scale(0.86); }
          100% { transform: scale(1); }
        }
        @keyframes shuffle-tl-premium {
          0% { transform: translate(0, 0); }
          15% { transform: translate(2px, 2px); }
          35% { transform: translate(7px, 2px); }
          55% { transform: translate(7px, 7px); }
          75% { transform: translate(2px, 7px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes shuffle-tr-premium {
          0% { transform: translate(0, 0); }
          15% { transform: translate(-2px, 2px); }
          35% { transform: translate(-2px, 7px); }
          55% { transform: translate(-7px, 7px); }
          75% { transform: translate(-7px, 2px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes shuffle-br-premium {
          0% { transform: translate(0, 0); }
          15% { transform: translate(-2px, -2px); }
          35% { transform: translate(-7px, -2px); }
          55% { transform: translate(-7px, -7px); }
          75% { transform: translate(-2px, -7px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes shuffle-bl-premium {
          0% { transform: translate(0, 0); }
          15% { transform: translate(2px, -2px); }
          35% { transform: translate(2px, -7px); }
          55% { transform: translate(7px, -7px); }
          75% { transform: translate(7px, -2px); }
          100% { transform: translate(0, 0); }
        }
        .clay-group-anim {
          transform-origin: 14px 14px;
          animation: clay-icon-scale 450ms cubic-bezier(0.25, 1, 0.5, 1);
        }
        .shuffle-tl-anim-premium {
          animation: shuffle-tl-premium 450ms cubic-bezier(0.25, 1, 0.5, 1);
        }
        .shuffle-tr-anim-premium {
          animation: shuffle-tr-premium 450ms cubic-bezier(0.25, 1, 0.5, 1);
        }
        .shuffle-br-anim-premium {
          animation: shuffle-br-premium 450ms cubic-bezier(0.25, 1, 0.5, 1);
        }
        .shuffle-bl-anim-premium {
          animation: shuffle-bl-premium 450ms cubic-bezier(0.25, 1, 0.5, 1);
        }

        /* Order Again animations */
        @keyframes heart-enter-and-drop {
          0% { transform: translate(1px, -12px) scale(0); opacity: 0; }
          22% { transform: translate(2px, -9px) scale(1.2); opacity: 1; }
          70% { transform: translate(0.5px, 0.5px) scale(0.9); opacity: 1; }
          100% { transform: translate(0, 0) scale(1); opacity: 1; }
        }
        @keyframes bag-impact-bounce {
          0% { transform: scale(1); }
          70% { transform: scale(1); }
          85% { transform: scale(0.93); }
          100% { transform: scale(1); }
        }
        @keyframes bag-fill-green {
          0% { fill: none; }
          70% { fill: none; }
          85% { fill: url(#clay-green); }
          100% { fill: url(#clay-green); }
        }
        .heart-drop-anim {
          transform-origin: 14px 15px;
          animation: heart-enter-and-drop 420ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .bag-bounce-anim {
          transform-origin: 14px 16px;
          animation: bag-impact-bounce 420ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .bag-fill-anim {
          animation: bag-fill-green 420ms cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>

      {/* SVG Claymorphism Gradients and Filter Definition */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          {/* Soft Clay Shadow Filter */}
          <filter id="clay-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.08" />
          </filter>

          {/* Home Active Yellow Clay Gradient */}
          <linearGradient id="clay-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="40%" stopColor="#F7C948" />
            <stop offset="100%" stopColor="#E0B02F" />
          </linearGradient>

          {/* Inactive Tab Grey Clay Gradient */}
          <linearGradient id="clay-grey" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9FAFB" />
            <stop offset="50%" stopColor="#E5E7EB" />
            <stop offset="100%" stopColor="#D1D5DB" />
          </linearGradient>

          {/* Active Tab Buyto Green Clay Gradient */}
          <linearGradient id="clay-green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A7F3D0" />
            <stop offset="40%" stopColor="#318616" />
            <stop offset="100%" stopColor="#1E5C0D" />
          </linearGradient>
        </defs>
      </svg>

      {/* 1. HOME TAB */}
      <div
        onClick={() => handleTabPress("home")}
        style={tabStyle}
        role="button"
        tabIndex={0}
        aria-label="Home"
      >
        <div style={{
          ...iconContainerStyle,
          transform: currentActive === "home" ? "scale(1.1)" : "scale(1)"
        }}>
          <img
            src={currentActive === "home" ? "https://img.icons8.com/?size=100&id=42814&format=png&color=318616" : "https://img.icons8.com/?size=100&id=42814&format=png&color=6B7280"}
            alt="Home"
            style={{
              width: "26px",
              height: "26px",
              objectFit: "contain",
              transition: "transform 0.2s ease"
            }}
          />
        </div>
        <span style={{
          ...labelStyle,
          color: currentActive === "home" ? "#318616" : "#6B7280",
          fontWeight: currentActive === "home" ? "600" : "500"
        }}>
          Home
        </span>
      </div>

      {/* 2. ORDER AGAIN TAB */}
      <div
        onClick={() => handleTabPress("orders")}
        style={tabStyle}
        role="button"
        tabIndex={0}
        aria-label="Order Again"
      >
        <div style={{
          ...iconContainerStyle,
          transform: currentActive === "orders" ? "scale(1.1)" : "scale(1)"
        }}>
          <img
            src={currentActive === "orders" ? "https://img.icons8.com/?size=100&id=55375&format=png&color=318616" : "https://img.icons8.com/?size=100&id=55375&format=png&color=6B7280"}
            alt="Order Again"
            style={{
              width: "26px",
              height: "26px",
              objectFit: "contain",
              transition: "transform 0.2s ease"
            }}
          />
        </div>
        <span style={{
          ...labelStyle,
          color: currentActive === "orders" ? "#318616" : "#6B7280",
          fontWeight: currentActive === "orders" ? "600" : "500"
        }}>
          Order Again
        </span>
      </div>

      {/* 3. CATEGORIES TAB */}
      <div
        onClick={() => handleTabPress("categories")}
        style={tabStyle}
        role="button"
        tabIndex={0}
        aria-label="Categories"
      >
        <div style={{
          ...iconContainerStyle,
          transform: currentActive === "categories" ? "scale(1.1)" : "scale(1)"
        }}>
          <img
            src={currentActive === "categories" ? "https://img.icons8.com/?size=100&id=Vv26Jlx7etIU&format=png&color=318616" : "https://img.icons8.com/?size=100&id=Vv26Jlx7etIU&format=png&color=6B7280"}
            alt="Categories"
            style={{
              width: "26px",
              height: "26px",
              objectFit: "contain",
              transition: "transform 0.2s ease"
            }}
          />
        </div>
        <span style={{
          ...labelStyle,
          color: currentActive === "categories" ? "#318616" : "#6B7280",
          fontWeight: currentActive === "categories" ? "600" : "500"
        }}>
          Categories
        </span>
      </div>

      {/* 4. PROFILE TAB */}
      <div
        onClick={() => handleTabPress("profile")}
        style={tabStyle}
        role="button"
        tabIndex={0}
        aria-label="Profile"
      >
        <div style={{
          ...iconContainerStyle,
          transform: currentActive === "profile" ? "scale(1.1)" : "scale(1)"
        }}>
          <img
            src={currentActive === "profile" ? "https://img.icons8.com/?size=100&id=42865&format=png&color=318616" : "https://img.icons8.com/?size=100&id=42865&format=png&color=6B7280"}
            alt="Profile"
            style={{
              width: "26px",
              height: "26px",
              objectFit: "contain",
              transition: "transform 0.2s ease"
            }}
          />
        </div>
        <span style={{
          ...labelStyle,
          color: currentActive === "profile" ? "#318616" : "#6B7280",
          fontWeight: currentActive === "profile" ? "600" : "500"
        }}>
          Profile
        </span>
      </div>
    </div>
  );
});

const tabStyle = {
  flex: 1,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  userSelect: "none",
  WebkitTapHighlightColor: "transparent",
  minWidth: "48px",
  minHeight: "48px",
};

const iconContainerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "transform 220ms ease",
  marginBottom: "4px",
};

const labelStyle = {
  fontSize: "12px",
  transition: "color 220ms ease, font-weight 220ms ease",
  whiteSpace: "nowrap",
};

MobileBottomNavigation.displayName = "MobileBottomNavigation";
export default MobileBottomNavigation;
