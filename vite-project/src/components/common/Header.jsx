import React, { useState, useEffect, useMemo, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BuytoLogo from "./BuytoLogo";
import { AuthContext } from "../../context/AuthContext";
import { logoPath } from "../../config/branding";

const searchSuggestions = [
  "Fresh Fruits",
  "Vegetables",
  "Snacks",
  "Cold Drinks",
  "Dairy Products",
  "Ice Creams",
  "Bakery Items"
];

export const CategoryStrip = React.memo(({ displayCats = [], selectedCategory, onCategoryClick }) => {
  const scrollerRef = React.useRef(null);

  if (!displayCats || displayCats.length === 0) return null;
  return (
    <div
      ref={scrollerRef}
      className="hide-scrollbar"
      style={{
        display: "flex",
        gap: "12px",
        overflowX: "auto",
        overflowY: "hidden",
        scrollBehavior: "smooth",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        padding: "8px 0 4px 0",
        transform: "translate3d(0, 0, 0)",
        willChange: "transform",
        userSelect: "none",
        WebkitOverflowScrolling: "touch"
      }}
    >
      {displayCats.map((cat) => {
        const isActive = selectedCategory === cat.name;
        return (
          <div
            key={cat.name}
            onClick={() => onCategoryClick(cat)}
            style={{
              width: "78px",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              cursor: "pointer"
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                border: isActive ? "2px solid #318616" : "1px solid #e5e7eb",
                background: isActive ? "#f0fdf4" : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                transition: "all 0.2s ease",
                transform: isActive ? "scale(1.05)" : "scale(1)",
                boxShadow: isActive ? "0 4px 10px rgba(49, 134, 22, 0.15)" : "none"
              }}
            >
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span style={{ fontSize: "24px" }}>{cat.icon || "🛍️"}</span>
              )}
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: isActive ? "700" : "500",
                color: isActive ? "#318616" : "#374151",
                textAlign: "center",
                lineHeight: "1.2",
                maxWidth: "72px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                marginTop: "6px",
                transition: "color 0.2s ease"
              }}
            >
              {cat.name}
            </span>
          </div>
        );
      })}
    </div>
  );
});

const Header = React.memo(({
  userLocation,
  roomNumber,
  totalItems,
  searchQuery,
  setSearchQuery,
  isLoggedIn,
  onOpenAddressModal,
  eta = 7,
  displayCats = [],
  selectedCategory = "All",
  onCategoryClick = () => { }
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const headerGradients = [
    "linear-gradient(135deg, #edf7e5 0%, #e6f2db 60%, #dceccf 100%)",
    "linear-gradient(135deg, #fff4e5 0%, #ffe7c7 50%, #ffd08a 100%)",
  ];

  const [headerGradient] = React.useState(() => {
    try {
      const saved = sessionStorage.getItem("buyto-header-gradient");
      if (saved) return saved;
      const random = headerGradients[Math.floor(Math.random() * headerGradients.length)];
      sessionStorage.setItem("buyto-header-gradient", random);
      return random;
    } catch (e) {
      return "linear-gradient(135deg, #edf7e5 0%, #e6f2db 60%, #dceccf 100%)";
    }
  });

  const { saveForLaterIds } = useContext(AuthContext) || { saveForLaterIds: [] };
  const savedCount = saveForLaterIds ? saveForLaterIds.length : 0;
  const [searchIndex, setSearchIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = (e) => {
      const target = e.target;
      const scrollY = target === document || target === window
        ? (window.scrollY || document.documentElement.scrollTop || document.body.scrollTop)
        : (target.scrollTop || 0);

      if (scrollY > 50) {
        setIsCollapsed(true);
      } else if (scrollY <= 10) {
        setIsCollapsed(false);
      }
      ticking = false;
    };

    const onScroll = (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => handleScroll(e));
        ticking = true;
      }
    };

    // Use capture phase (third argument = true) to catch scroll events on scrollable children like #root
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSearchIndex((prev) => (prev + 1) % searchSuggestions.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const addressText = useMemo(() => {
    return userLocation
      ? `${userLocation}${roomNumber ? `, Room ${roomNumber}` : ""}`
      : "Select Delivery Address";
  }, [userLocation, roomNumber]);

  // Lazy load speech recognition helper when voice search is clicked
  const handleVoiceSearch = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice Search is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      if (location.pathname !== "/") {
        navigate("/");
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const isDown = isCollapsed;
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: headerGradient || "linear-gradient(135deg, #edf7e5 0%, #e6f2db 60%, #dceccf 100%)",
        boxShadow: "0 2px 12px rgba(49, 134, 22, 0.08)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        transform: "translate3d(0, 0, 0)",
        willChange: "transform",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        padding: isDown ? "6px 16px" : "10px 16px",
        display: "flex",
        flexDirection: "column",
        gap: isDown ? "0px" : "10px",
        transition: "padding 300ms cubic-bezier(0.4, 0, 0.2, 1), gap 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        boxSizing: "border-box"
      }}
    >
      {/* COLLAPSIBLE HEADER BLOCK */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          transition: "max-height 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease, transform 300ms cubic-bezier(0.4, 0, 0.2, 1), margin-bottom 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          maxHeight: isDown ? "0px" : "100px",
          opacity: isDown ? 0 : 1,
          transform: isDown ? "translateY(-30px)" : "translateY(0)",
          overflow: "hidden",
          pointerEvents: isDown ? "none" : "auto",
          marginBottom: isDown ? "0px" : "4px"
        }}
      >
        {/* ROW 1: ETA Badge, Branding, and Profile Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Branding & ETA Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Buyto Logo and Text */}
            <div
              onClick={() => {
                if (location.pathname === "/") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  navigate("/");
                }
              }}
              style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            >
              {/* Desktop/Tablet Logo Image (width >= 768px) */}
              <img
                src={logoPath}
                alt="Buyto Minutes"
                className="brand-logo-desktop"
                style={{
                  height: "36px",
                  width: "auto",
                  objectFit: "contain",
                }}
              />
              {/* Mobile Text Branding (width < 768px) */}
              <span
                className="brand-text-mobile"
                style={{
                  fontWeight: "900",
                  letterSpacing: "-0.5px",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "clamp(15px, 4.8vw, 19px)",
                }}
              >
                <span style={{ color: "#f59e0b" }}>Buyto</span>
                <span
                  style={{
                    color: "#318616",
                    marginLeft: "2px",
                    fontSize: "0.9em"
                  }}
                >
                  Minutes
                </span>
              </span>
            </div>

            {/* Dynamic ETA Badge */}
            <div
              style={{
                background: "#1e293b",
                color: "white",
                padding: "4px clamp(6px, 2.5vw, 10px)",
                borderRadius: "20px",
                fontSize: "clamp(10px, 3.2vw, 12px)",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                minWidth: "clamp(90px, 32vw, 120px)", // Avoid layout shift while staying responsive
                justifyContent: "center"
              }}
            >
              ⚡ {eta} mins delivery
            </div>
          </div>

          {/* Profile/Avatar Circle */}
          <div
            onClick={() => navigate("/profile")}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
              cursor: "pointer",
              transition: "transform 0.15s ease",
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>

        {/* ROW 2: Location Selector */}
        <div
          onClick={onOpenAddressModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
            maxWidth: "100%"
          }}
        >
          <span style={{ fontSize: "14px", display: "flex", alignItems: "center" }}>📍</span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: "750",
              color: "#1f2937",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "calc(100% - 30px)"
            }}
          >
            {addressText}
          </span>
          <span style={{ fontSize: "9px", color: "#4b5563" }}>▼</span>
        </div>
      </div>

      {/* ROW 3: Full-width Search Bar and Side Action Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
        {/* Search Input Container */}
        <div style={{ position: "relative", flexGrow: 1 }}>
          <input
            type="text"
            placeholder=""
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (location.pathname !== "/") {
                navigate("/");
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "12px 40px",
              width: "100%",
              border: "none",
              fontSize: "14px",
              fontWeight: "600",
              color: "#1f2937",
              outline: "none",
              boxSizing: "border-box",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}
          />
          {(!searchQuery && !isFocused) && (
            <div
              style={{
                position: "absolute",
                left: "40px",
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
                fontSize: "14px",
                fontWeight: "600",
                color: "#9ca3af",
                fontFamily: "inherit",
                height: "24px",
                overflow: "hidden"
              }}
            >
              <span>Search for&nbsp;</span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: `translateY(-${searchIndex * 24}px)`,
                  height: "24px"
                }}
              >
                {searchSuggestions.map((sug, idx) => (
                  <span
                    key={idx}
                    style={{
                      height: "24px",
                      lineHeight: "24px",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    '{sug}'
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Left search icon */}
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", display: "flex", alignItems: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          {/* Right mic icon */}
          <button
            onClick={handleVoiceSearch}
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: isListening ? "#ef4444" : "#4b5563",
              display: "flex",
              alignItems: "center",
              padding: "4px"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v1a7 7 0 0 1-14 0v-1"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
        </div>

        {/* Action Buttons: Orders | Wishlist */}
        <div
          style={{
            background: "white",
            borderRadius: "24px",
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
            gap: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            height: "42px",
            boxSizing: "border-box"
          }}
        >
          {/* Shopping List Note Icon */}
          <button
            onClick={() => navigate("/shopping-list")}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
            title="Shopping List"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>

          {/* Divider */}
          <div style={{ width: "1px", height: "16px", background: "#cbd5e1" }}></div>

          {/* Save For Later Badge */}
          <button
            onClick={() => navigate("/save-for-later")}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              position: "relative"
            }}
            title="Save for Later"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {savedCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-8px",
                  background: "#10b981",
                  color: "white",
                  fontSize: "8px",
                  fontWeight: "900",
                  borderRadius: "50%",
                  width: "14px",
                  height: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.15)"
                }}
              >
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ROW 4: Category Quick Access Strip */}
      {location.pathname === "/" && (
        <CategoryStrip
          displayCats={displayCats}
          selectedCategory={selectedCategory}
          onCategoryClick={onCategoryClick}
        />
      )}
    </div>
  );
});

export default Header;
