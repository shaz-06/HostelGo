import React, { useState, useEffect, useMemo, useContext, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BuytoLogo from "./BuytoLogo";
import { AuthContext } from "../../context/AuthContext";
import { logoPath } from "../../config/branding";
import { useHeaderTheme } from "../../hooks/useHeaderTheme";
import { useCollapsingHeader } from "../../hooks/useCollapsingHeader";

const searchSuggestions = [
  "Milk",
  "Curd",
  "Rice",
  "Atta",
  "Chocolates",
  "Ice Cream",
  "Shampoo",
  "Face Wash",
  "Cold Drinks",
  "Bread",
  "Eggs",
  "Snacks"
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
        gap: "22px",
        overflowX: "auto",
        overflowY: "hidden",
        scrollBehavior: "smooth",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        padding: "8px 0 10px 0",
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
                border: isActive ? "2px solid #589f42ff" : "1px solid #e5e7eb",
                background: isActive ? "#f0fdf4" : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                transition: "all 0.2s ease",
                transform: isActive ? "scale(1.08)" : "scale(1)",
                boxShadow: isActive ? "0 8px 24px rgba(49,134,22,0.25)" : "none"
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

  const { headerColor, textColor, isGreenTheme } = useHeaderTheme();

  const { saveForLaterIds } = useContext(AuthContext) || { saveForLaterIds: [] };
  const savedCount = saveForLaterIds ? saveForLaterIds.length : 0;
  const [searchIndex, setSearchIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const isCollapsed = useCollapsingHeader();
  const [collapsibleHeight, setCollapsibleHeight] = useState(80);
  const collapsibleRef = useRef(null);
  const promos = [
    { text: "Flat ₹100 OFF", sub: "on first order", icon: "🎁" },
    { text: "Free Delivery", sub: "above ₹99", icon: "⚡" },
    { text: "Up to 50% OFF", sub: "on snacks", icon: "🔥" }
  ];
  const [promoIdx, setPromoIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIdx((prev) => (prev + 1) % promos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    if (!isFocused || searchQuery === "") {
      setLocalQuery(searchQuery);
    }
  }, [searchQuery, isFocused]);

  useEffect(() => {
    if (localQuery === searchQuery) return;
    const handler = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [localQuery, searchQuery, setSearchQuery]);

  useEffect(() => {
    if (collapsibleRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setCollapsibleHeight(entry.target.offsetHeight);
        }
      });
      observer.observe(collapsibleRef.current);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    if (isFocused) return;
    const interval = setInterval(() => {
      setSearchIndex((prev) => (prev + 1) % searchSuggestions.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isFocused]);

  const addressText = useMemo(() => {
    return userLocation
      ? `${userLocation}${roomNumber ? `, Room ${roomNumber}` : ""}`
      : "Select Delivery Address";
  }, [userLocation, roomNumber]);

  // Lazy load speech recognition helper when voice search is clicked
  const handleVoiceSearch = async () => {
    console.log("Mic clicked");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported on this device.");
      console.log("Speech error: SpeechRecognition not supported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Permission granted");
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error("Microphone permission error:", err);
      console.log("Speech error: Permission denied");
      alert("Microphone access is required for voice search.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
      console.log("Listening started");
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Speech result:", transcript);
      setSearchQuery(transcript);
      if (location.pathname !== "/") {
        navigate("/");
      }
    };

    recognition.onerror = (event) => {
      console.log("Speech error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log("Listening ended");
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.log("Speech error on start:", err);
      setIsListening(false);
    }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning 👋";
    if (hr < 17) return "Good Afternoon 👋";
    return "Good Evening 👋";
  };

  const isDown = isCollapsed;
  const headerRef = React.useRef(null);

  useEffect(() => {
    if (!headerRef.current) return;
    const updateHeight = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect();
        const visualHeight = isDown ? rect.height - (collapsibleHeight + 10) : rect.height;
        document.documentElement.style.setProperty("--header-height", `${visualHeight}px`);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [isDown, collapsibleHeight]);

  return (
    <div
      ref={headerRef}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "linear-gradient(135deg, #D8F0B4 0%, #BEE08A 100%)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        paddingTop: "calc(env(safe-area-inset-top) + 24px)",
        paddingBottom: "20px",
        paddingLeft: "16px",
        paddingRight: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transform: isDown ? `translate3d(0, -${collapsibleHeight + 10}px, 0)` : "translate3d(0, 0, 0)",
        willChange: "transform",
        transition: isDown
          ? "transform 300ms cubic-bezier(0.22, 1, 0.36, 1), background 300ms ease"
          : "transform 320ms ease-in-out, background 300ms ease",
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        boxSizing: "border-box",
        borderBottomLeftRadius: isDown ? "20px" : "36px",
        borderBottomRightRadius: isDown ? "20px" : "36px",
        minHeight: isDown ? "auto" : "280px"
      }}
    >
      {/* Background blobs for premium depth */}
      <div
        style={{
          position: "absolute",
          top: "-80px",
          right: "-60px",
          width: "288px",
          height: "288px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.15)",
          filter: "blur(48px)",
          pointerEvents: "none",
          zIndex: 1
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-60px",
          left: "-60px",
          width: "256px",
          height: "256px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.10)",
          filter: "blur(48px)",
          pointerEvents: "none",
          zIndex: 1
        }}
      />

      <div
        ref={collapsibleRef}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          transform: isDown ? "translate3d(0, -100%, 0)" : "translate3d(0, 0, 0)",
          opacity: isDown ? 0 : 1,
          willChange: "transform",
          transition: isDown
            ? "transform 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms cubic-bezier(0.22, 1, 0.36, 1)"
            : "transform 320ms ease-in-out, opacity 320ms ease-in-out",
          pointerEvents: isDown ? "none" : "auto"
        }}
      >
        {/* Row 1: Pills, Greetings, and Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", zIndex: 2 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-start" }}>
            
            {/* Pills Container (Side-by-Side) */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Delivery Pill */}
              <div
                style={{
                  padding: "6px 16px",
                  borderRadius: "999px",
                  background: "#1F2937",
                  color: "white",
                  fontWeight: "750",
                  fontSize: "13px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  display: "inline-flex",
                  alignItems: "center"
                }}
              >
                ⚡ Delivery in {eta} mins
              </div>

              {/* Buyto Minutes Pill */}
              <div
                style={{
                  padding: "6px 16px",
                  borderRadius: "999px",
                  background: "rgba(255, 255, 255, 0.7)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  fontSize: "13px",
                  fontWeight: "750",
                  color: "#318616",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  display: "inline-flex",
                  alignItems: "center"
                }}
              >
                🛒 Buyto Minutes
              </div>
            </div>

            {/* Greeting */}
            <div style={{ marginTop: "4px" }}>
              <p style={{ fontSize: "13px", color: "#374151", margin: 0, fontWeight: "500" }}>
                {getGreeting()}
              </p>
              <h2
                style={{
                  fontSize: "clamp(18px, 5vw, 24px)",
                  fontWeight: "800",
                  color: "#1F2937",
                  margin: "4px 0 0 0",
                  lineHeight: "1.2"
                }}
              >
                What can we get for you today?
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "rgba(31, 41, 55, 0.65)",
                  fontWeight: "500",
                  margin: "4px 0 0 0"
                }}
              >
                Fresh groceries, essentials & more delivered fast.
              </p>
            </div>
          </div>

          {/* Right Column: Action Icons on top, and Rotating Offer Pill below them */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
            {/* Action Icons */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Bell Icon */}
              <div
                onClick={() => navigate("/notifications")}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "20px",
                  background: "rgba(255, 255, 255, 0.75)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                title="Notifications"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>

              {/* Profile Avatar */}
              <div
                onClick={() => navigate("/profile")}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "20px",
                  background: "rgba(255, 255, 255, 0.75)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                title="Profile"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>

            {/* Rotating Offer Pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255, 255, 255, 0.65)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                padding: "8px 12px",
                borderRadius: "18px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                fontSize: "12px",
                fontWeight: "600",
                color: "#1F2937",
                height: "44px",
                boxSizing: "border-box",
                transition: "all 0.3s ease",
                maxWidth: "160px",
                cursor: "default"
              }}
            >
              <span style={{ fontSize: "16px" }}>{promos[promoIdx].icon}</span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: "1.2" }}>
                <span style={{ fontWeight: "750", color: "#318616", whiteSpace: "nowrap" }}>
                  {promos[promoIdx].text}
                </span>
                <span style={{ fontSize: "9px", color: "#4b5563", whiteSpace: "nowrap" }}>
                  {promos[promoIdx].sub}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Location Card */}
        <div
          onClick={onOpenAddressModal}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            background: "rgba(255, 255, 255, 0.5)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            padding: "10px 14px",
            borderRadius: "18px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
            cursor: "pointer",
            zIndex: 2,
            alignSelf: "flex-start",
            marginTop: "6px",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            fontSize: "13px"
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              fontSize: "16px"
            }}
          >
            📍
          </div>
          <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
            <p style={{ fontSize: "11px", color: "#4b5563", margin: 0, fontWeight: "500" }}>
              Delivering to
            </p>
            <p style={{ fontSize: "13px", fontWeight: "800", color: "#111827", margin: 0 }}>
              {addressText} <span style={{ fontSize: "8px", color: "#4b5563" }}>▼</span>
            </p>
          </div>
        </div>
      </div>

      {/* STICKY/SEARCH/CATEGORY SECTION */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "100%",
          maxWidth: "100%"
        }}
      >
        {/* ROW 3: Full-width Search Bar and Side Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
        {/* Search Input Container */}
        <div style={{ position: "relative", flexGrow: 1 }}>
          <input
            type="text"
            placeholder=""
            value={localQuery}
            onChange={(e) => {
              const val = e.target.value;
              setLocalQuery(val);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: "30px",
              padding: "12px 40px",
              width: "100%",
              border: "1px solid rgba(255, 255, 255, 0.7)",
              fontSize: "14px",
              fontWeight: "600",
              color: "#1f2937",
              outline: "none",
              boxSizing: "border-box",
              boxShadow: "0 12px 35px rgba(0,0,0,0.08)"
            }}
          />
          {(!localQuery && !isFocused) && (
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
    </div>
  );
});

export default Header;
