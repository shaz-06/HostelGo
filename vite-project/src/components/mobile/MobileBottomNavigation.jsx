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
    if (path === "/orders" || path === "/my-orders") return "orders";
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
      navigate("/orders");
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
          <svg
            width="26"
            height="26"
            viewBox="0 0 28 28"
            fill="none"
            filter="url(#clay-shadow)"
            style={{
              perspective: "100px",
              overflow: "visible"
            }}
          >
            {/* House body with clay yellow fill */}
            <path
              d="M5 12.5L14 4.5L23 12.5V22C23 23.1 22.1 24 21 24H7C5.9 24 5 23.1 5 22V12.5Z"
              stroke={currentActive === "home" ? "#2F2F2F" : "#9CA3AF"}
              strokeWidth="2.4"
              strokeLinejoin="round"
              fill={currentActive === "home" ? "url(#clay-yellow)" : "url(#clay-grey)"}
            />
            {/* Chimney */}
            <path
              d="M19.5 6.5V9.5"
              stroke={currentActive === "home" ? "#2F2F2F" : "#9CA3AF"}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* Static Dark Doorway Opening */}
            <path
              d="M11.5 24V18.5C11.5 17.1 12.6 16 14 16C15.4 16 16.5 17.1 16.5 18.5V24"
              fill="#2F2F2F"
            />
            {/* Animated Door Panel */}
            <g
              style={{
                transformOrigin: "11.5px 20px",
                transform: currentActive === "home" ? "rotateY(-70deg)" : "rotateY(0deg)",
                transition: "transform 280ms cubic-bezier(0.25, 1, 0.5, 1)",
                transformStyle: "preserve-3d"
              }}
            >
              <path
                d="M11.5 24V18.5C11.5 17.1 12.6 16 14 16C15.4 16 16.5 17.1 16.5 18.5V24"
                stroke={currentActive === "home" ? "#2F2F2F" : "#9CA3AF"}
                strokeWidth="2.4"
                fill={currentActive === "home" ? "url(#clay-yellow)" : "url(#clay-grey)"}
              />
            </g>
          </svg>
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
          <svg
            width="26"
            height="26"
            viewBox="0 0 28 28"
            fill="none"
            filter="url(#clay-shadow)"
            style={{ overflow: "visible" }}
          >
            {/* Bag Body with clay fill and bounce animation */}
            <g className={currentActive === "orders" && ordersAnimKey > 0 ? "bag-bounce-anim" : ""}>
              {/* Animated fill layer */}
              <rect
                x="6"
                y="10"
                width="16"
                height="13"
                rx="4"
                stroke={currentActive === "orders" ? "#2F2F2F" : "#9CA3AF"}
                strokeWidth="2.4"
                fill="none"
                className={currentActive === "orders" && ordersAnimKey > 0 ? "bag-fill-anim" : ""}
                style={{
                  fill: currentActive === "orders" ? "url(#clay-green)" : "url(#clay-grey)"
                }}
              />
              {/* Handle */}
              <path
                d="M10 10V8C10 5.8 11.8 4 14 4C16.2 4 18 5.8 18 8V10"
                stroke={currentActive === "orders" ? "#2F2F2F" : "#9CA3AF"}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </g>

            {/* Heart Element - only visible when active with drop animation */}
            {currentActive === "orders" && (
              <path
                key={`heart-${ordersAnimKey}`}
                className="heart-drop-anim"
                d="M14.5 18.5 C13.0 17.1 11.7 15.8 11.7 14.6 C11.7 13.5 12.5 12.7 13.6 12.7 C14.2 12.7 14.7 13.0 15.0 13.5 C15.3 13.0 15.8 12.7 16.4 12.7 C17.5 12.7 18.3 13.5 18.3 14.6 C18.3 15.8 17.0 17.1 15.5 18.5 Z"
                fill="url(#clay-yellow)"
                stroke="#2F2F2F"
                strokeWidth="1.2"
              />
            )}
          </svg>
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
          <svg
            width="26"
            height="26"
            viewBox="0 0 28 28"
            fill="none"
            filter="url(#clay-shadow)"
          >
            <g className={categoriesAnimKey > 0 ? "clay-group-anim" : ""}>
              {/* Top Left Circle - Yellow */}
              <circle
                key={`tl-${categoriesAnimKey}`}
                className={categoriesAnimKey > 0 ? "shuffle-tl-anim-premium" : ""}
                cx="9.5"
                cy="9.5"
                r="3.5"
                stroke={currentActive === "categories" ? "#2F2F2F" : "#9CA3AF"}
                strokeWidth="2.4"
                fill="url(#clay-yellow)"
              />
              {/* Top Right Circle - Green */}
              <circle
                key={`tr-${categoriesAnimKey}`}
                className={categoriesAnimKey > 0 ? "shuffle-tr-anim-premium" : ""}
                cx="18.5"
                cy="9.5"
                r="3.5"
                stroke={currentActive === "categories" ? "#2F2F2F" : "#9CA3AF"}
                strokeWidth="2.4"
                fill="url(#clay-green)"
              />
              {/* Bottom Left Circle - Green */}
              <circle
                key={`bl-${categoriesAnimKey}`}
                className={categoriesAnimKey > 0 ? "shuffle-bl-anim-premium" : ""}
                cx="9.5"
                cy="18.5"
                r="3.5"
                stroke={currentActive === "categories" ? "#2F2F2F" : "#9CA3AF"}
                strokeWidth="2.4"
                fill="url(#clay-green)"
              />
              {/* Bottom Right Circle - Yellow */}
              <circle
                key={`br-${categoriesAnimKey}`}
                className={categoriesAnimKey > 0 ? "shuffle-br-anim-premium" : ""}
                cx="18.5"
                cy="18.5"
                r="3.5"
                stroke={currentActive === "categories" ? "#2F2F2F" : "#9CA3AF"}
                strokeWidth="2.4"
                fill="url(#clay-yellow)"
              />
            </g>
          </svg>
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
          <svg
            width="26"
            height="26"
            viewBox="0 0 28 28"
            fill="none"
            filter="url(#clay-shadow)"
          >
            {/* User Head with clay fill */}
            <circle
              cx="14"
              cy="9"
              r="4.5"
              stroke={currentActive === "profile" ? "#2F2F2F" : "#9CA3AF"}
              strokeWidth="2.4"
              fill={currentActive === "profile" ? "url(#clay-green)" : "url(#clay-grey)"}
            />
            {/* User Shoulders with clay fill */}
            <path
              d="M5 22.5C5 18.9 7.9 16 11.5 16H16.5C20.1 16 23 18.9 23 22.5"
              stroke={currentActive === "profile" ? "#2F2F2F" : "#9CA3AF"}
              strokeWidth="2.4"
              strokeLinecap="round"
              fill={currentActive === "profile" ? "url(#clay-green)" : "url(#clay-grey)"}
            />
          </svg>
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
