import React, { useState, useEffect, useMemo, useContext, useRef } from "react";

import { getCategoryFromPathname } from "../../config/categoryConfig";
import { categoryThemes } from "../../config/themeConfig";
import SearchBar from "./SearchBar";
import LocationBar from "./LocationBar";
import CategoryStrip from "./CategoryStrip";

import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import BuytoLogo from "../common/BuytoLogo";
import { AuthContext } from "../../context/AuthContext";
import { useAppStore, selectSearchQuery, selectUserLocation, selectRoomNumber, selectIsLoggedIn, selectCartItemsCount, selectSaveForLaterIds } from "../../store/appStore";
import { logoPath } from "../../config/branding";
import { useHeaderTheme } from "../../hooks/useHeaderTheme";
import { useCollapsingHeader } from "../../hooks/useCollapsingHeader";
import { useTheme } from "../../context/ThemeContext";

const LogoArea = ({ brandText = "Buyto", whiteText = false, brandColor = "#171614ff" }) => {
  const parts = brandText === "LetsBuyto" ? ["lets buy it", ""] : ["Buy", "to"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span className="premium-wordmark">
          <span style={{
            color: whiteText ? "#FFFFFF" : brandColor,
            transition: "color 350ms ease-in-out",
            marginRight: brandText === "LetsBuyto" ? "5px" : "0px"
          }}>{parts[0]}</span>
          <span style={{
            color: whiteText ? "#FFFFFF" : "#318616",
            transition: "color 350ms ease-in-out"
          }}>{parts[1]}</span>
        </span>
        {brandText === "LetsBuyto" && (
          <>
            <style dangerouslySetInnerHTML={{
              __html: `
                .header-brand-icon {
                  width: 30px;
                  height: 30px;
                }
                @media (min-width: 768px) {
                  .header-brand-icon {
                    width: 38px;
                    height: 38px;
                  }
                }
              `
            }} />
            <img
              src="https://img.icons8.com/?size=100&id=cy1AaYX56tTk&format=png&color=FFFFFF"
              alt="LetsBuyto Icon"
              className="header-brand-icon"
              style={{
                objectFit: "contain",
                flexShrink: 0
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

const WalletButton = ({ balance, onClick, compact = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "rgba(255, 255, 255, 0.45)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.45)",
        padding: compact ? "6px 12px" : "8px 14px",
        borderRadius: "20px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
        fontSize: compact ? "13px" : "14px",
        fontWeight: "750",
        color: "#1F2937",
        height: compact ? "36px" : "44px",
        boxSizing: "border-box",
        cursor: "pointer",
        transition: "transform 0.2s ease"
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
      onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
    >
      <img
        src="https://img.icons8.com/?size=100&id=MjAYkOMsbYOO&format=png&color=000000"
        alt="Wallet"
        style={{
          width: compact ? "18px" : "22px",
          height: compact ? "18px" : "22px",
          objectFit: "contain",
          flexShrink: 0
        }}
      />
      <span>₹{balance}</span>
    </button>
  );
};

const ProfileButton = ({ onClick, compact = false }) => {
  return (
    <div
      onClick={onClick}
      style={{
        width: compact ? "36px" : "44px",
        height: compact ? "36px" : "44px",
        borderRadius: "20px",
        background: "rgba(255, 255, 255, 0.45)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.45)",
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
      <img
        src="https://img.icons8.com/?size=100&id=42865&format=png&color=000000"
        alt="Profile"
        style={{
          width: compact ? "22px" : "26px",
          height: compact ? "22px" : "26px",
          objectFit: "contain"
        }}
      />
    </div>
  );
};

const Header = React.memo(({
  totalItems: providedTotalItems,
  authLoading = false,
  onOpenAddressModal,
  eta = 7,
  displayCats = [],
  selectedCategory = "All",
  onCategoryClick = () => { },
  themeOverride = null
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const userLocation = useAppStore(selectUserLocation);
  const roomNumber = useAppStore(selectRoomNumber);
  const storedTotalItems = useAppStore(selectCartItemsCount);
  const totalItems = providedTotalItems ?? storedTotalItems;
  const searchQuery = useAppStore(selectSearchQuery);
  const setSearchQueryStore = useAppStore((state) => state.setSearchQuery);

  const setSearchQuery = React.useCallback((val) => {
    setSearchQueryStore(val, searchParams, setSearchParams, navigate, location.pathname);
  }, [searchParams, setSearchParams, navigate, location.pathname, setSearchQueryStore]);

  const isLoggedIn = useAppStore(selectIsLoggedIn);
  const { isDark } = useTheme();
  const currentCategory = getCategoryFromPathname(location.pathname);
  const theme = categoryThemes[currentCategory] || categoryThemes.default;
  const isHomepage = currentCategory === "home";
  const isElectronicsPage = currentCategory === "electronics";
  const isCategoriesPage = currentCategory === "categories";
  const isBeautyPage = currentCategory === "beauty";
  const isPharmacyPage = currentCategory === "pharmacy";
  const isDecorPage = currentCategory === "decor";
  const isKidsPage = currentCategory === "kids";
  const isGiftPage = currentCategory === "gift";
  const useDarkAzure = !themeOverride && !isCategoriesPage && !isElectronicsPage && !isBeautyPage && !isPharmacyPage && !isDecorPage && !isKidsPage && !isGiftPage;

  const [welcomeBannerVisible, setWelcomeBannerVisible] = useState(() => {
    return location.pathname === "/";
  });

  useEffect(() => {
    let observer;
    let checkInterval;

    const setupObserver = () => {
      const banner = document.querySelector('[data-welcome-banner]');
      if (banner) {
        observer = new IntersectionObserver(
          ([entry]) => {
            setWelcomeBannerVisible(entry.isIntersecting);
          },
          {
            threshold: 0.05
          }
        );
        observer.observe(banner);
        if (checkInterval) clearInterval(checkInterval);
        return true;
      }
      return false;
    };

    // Try immediately
    const found = setupObserver();

    // If not found (e.g. data is loading), check periodically
    if (!found) {
      checkInterval = setInterval(() => {
        setupObserver();
      }, 300);
    }

    // Default to false if not on homepage so it uses cream header styling
    if (location.pathname !== "/") {
      setWelcomeBannerVisible(false);
    }

    return () => {
      if (observer) observer.disconnect();
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [location.pathname]);

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

  const { user, token } = useContext(AuthContext) || { saveForLaterIds: [], user: null, token: null };
  const saveForLaterIds = useAppStore(selectSaveForLaterIds);
  const savedCount = saveForLaterIds ? saveForLaterIds.length : 0;

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767px)").matches
      : true
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 767px)");
    const handleChange = (e) => setIsMobile(e.matches);
    setIsMobile(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (user) {
      setWalletBalance(user.buyCoins || 0);
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;
    const fetchWallet = async () => {
      try {
        const res = await fetch(window.API_BASE_URL + "/api/buycoins/wallet", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success && data.wallet) {
          setWalletBalance(data.wallet.availableCoins);
        }
      } catch (err) {
        console.error("Header wallet fetch error:", err);
      }
    };
    fetchWallet();
    window.addEventListener("focus", fetchWallet);
    return () => window.removeEventListener("focus", fetchWallet);
  }, [token]);

  const [addressExpanded, setAddressExpanded] = useState(false);

  const addressType = localStorage.getItem("buyto_selected_address_type") || "PG";

  const getTruncatedAddress = (fullText, wordCount = 7) => {
    if (!fullText) return "";
    const words = fullText.split(/\s+/);
    if (words.length <= wordCount) return fullText;
    return words.slice(0, wordCount).join(" ") + "...";
  };

  const fullAddressJson = localStorage.getItem("buyto_selected_address_full");
  let addressDetails = null;
  if (fullAddressJson) {
    try {
      addressDetails = JSON.parse(fullAddressJson);
    } catch (e) { }
  }

  const renderExpandedAddress = () => {
    if (!addressDetails) {
      return <div style={{ fontSize: "14px", color: isMobile ? "#FFFFFF" : "#374151", padding: "8px 0" }}>{addressText}</div>;
    }
    return (
      <div style={{
        fontSize: "14px",
        color: isMobile ? "#FFFFFF" : "#374151",
        lineHeight: "1.4",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "8px 12px",
        background: isMobile ? "rgba(0, 0, 0, 0.35)" : "rgba(255, 255, 255, 0.5)",
        borderRadius: "12px",
        border: isMobile ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.3)",
        marginTop: "6px",
        animation: "fadeIn 200ms ease-out"
      }}>
        <div style={{ fontWeight: "750", color: isMobile ? "#FFFFFF" : "#111827", fontSize: "15px" }}>{addressDetails.label || "Address"}</div>
        {addressDetails.fullName && <div>Name: {addressDetails.fullName}</div>}
        {addressDetails.phone && <div>Phone: {addressDetails.phone}</div>}
        {addressDetails.roomNumber && <div>Room / Flat: {addressDetails.roomNumber}</div>}
        {addressDetails.addressLine && <div>Address: {addressDetails.addressLine}</div>}
        {addressDetails.landmark && <div>Landmark: {addressDetails.landmark}</div>}
        {addressDetails.city && <div>City: {addressDetails.city}</div>}
        {addressDetails.pincode && <div>Pincode: {addressDetails.pincode}</div>}
      </div>
    );
  };

  const isCollapsed = useCollapsingHeader();
  const [collapsibleHeight, setCollapsibleHeight] = useState(80);
  const collapsibleRef = useRef(null);
  const overlayRef = useRef(null);
  const promos = [
    { text: "Flat ₹100 OFF", sub: "on first order", icon: "🎁" },
    { text: "Free Delivery", sub: "above 149", icon: "🛵" },
    { text: "Up to 50% OFF", sub: "on snacks", icon: "🔥" }
  ];
  const [promoIdx, setPromoIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIdx((prev) => (prev + 1) % promos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);



  useEffect(() => {
    if (collapsibleRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const sh = collapsibleRef.current ? collapsibleRef.current.scrollHeight : entry.target.offsetHeight;
          if (sh > 0) {
            setCollapsibleHeight(sh);
          }
        }
      });
      observer.observe(collapsibleRef.current);
      return () => observer.disconnect();
    }
  }, [isMobile]);



  const addressText = useMemo(() => {
    if (authLoading) {
      return "Loading location...";
    }
    if (!isLoggedIn) {
      return "Login · Your location will appear here";
    }
    return userLocation
      ? `${userLocation}${roomNumber ? `, Room ${roomNumber}` : ""}`
      : "Select Delivery Address";
  }, [authLoading, isLoggedIn, userLocation, roomNumber]);

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
        const visualHeight = (isDown && !isMobile) ? rect.height - (collapsibleHeight + 10) : rect.height;
        document.documentElement.style.setProperty("--header-height", `${visualHeight}px`);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [isDown, collapsibleHeight, isMobile]);



  useEffect(() => {
    if (!isHomepage) return;

    let heroEl = document.getElementById("home-hero-banner");
    let ticking = false;

    const updateOpacity = () => {
      // Scroll-based header background and color shifts are disabled to keep golden background active in all states
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateOpacity);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateOpacity();

    const timeoutId = setTimeout(updateOpacity, 100);
    const intervalId = setInterval(updateOpacity, 500);

    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isHomepage, isMobile, collapsibleHeight]);

  const renderDesktopActionButtons = () => {
    return (
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

        <div style={{ width: "1px", height: "16px", background: "#cbd5e1" }}></div>

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
    );
  };

  const DesktopHeaderContent = () => {
    return (
      <>


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
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" }}>
              <style dangerouslySetInnerHTML={{
                __html: `
                .premium-logo-container {
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  animation: fadeIn 200ms ease;
                }
                .premium-logo-img {
                  width: 48px !important;
                  height: 48px !important;
                  border-radius: 50% !important;
                  border: 1px solid rgba(0, 0, 0, 0.08) !important;
                  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06) !important;
                  object-fit: cover !important;
                  image-rendering: -webkit-optimize-contrast !important;
                  image-rendering: crisp-edges !important;
                  transition: transform 0.2s ease, opacity 0.2s ease;
                }
                .premium-wordmark {
                  font-family: 'Outfit', sans-serif;
                  font-weight: 600;
                  font-size: 22px;
                  line-height: 1;
                  letter-spacing: -0.5px;
                  display: inline-flex;
                  align-items: center;
                  align-self: center;
                  transition: transform 0.2s ease;
                }
                @media (min-width: 768px) {
                  .premium-logo-img {
                    width: 52px !important;
                    height: 52px !important;
                  }
                  .premium-wordmark {
                    font-size: 24px;
                  }
                }
                @media (min-width: 1024px) {
                  .premium-logo-img {
                    width: 56px !important;
                    height: 56px !important;
                  }
                  .premium-wordmark {
                    font-size: 26px;
                  }
                }
                .address-block:hover .address-chevron {
                  transform: rotate(180deg);
                }
                .address-block:hover .address-val {
                  color: #318616 !important;
                }
              `}} />
              <LogoArea brandText="Buyto" whiteText={useDarkAzure || welcomeBannerVisible || isHomepage || isElectronicsPage} />

              {/* Delivering Address (Directly Clickable Block) */}
              <LocationBar
                authLoading={authLoading}
                onOpenAddressModal={onOpenAddressModal}
                useDarkAzure={useDarkAzure}
                welcomeBannerVisible={welcomeBannerVisible}
                isHomepage={isHomepage}
                isMobile={false}
              />

              {/* Greeting */}
              <div style={{ marginTop: "16px" }}>
                <p style={{ fontSize: "13px", color: (useDarkAzure || welcomeBannerVisible || isHomepage) ? "#FFFFFF" : "#374151", margin: 0, fontWeight: "500" }}>
                  {getGreeting()}
                </p>
                <h2 style={{ fontSize: "clamp(18px, 5vw, 24px)", fontWeight: "800", color: (useDarkAzure || welcomeBannerVisible || isHomepage) ? "#FFFFFF" : "#1F2937", margin: "4px 0 0 0", lineHeight: "1.2" }}>
                  What can we get for you today?
                </h2>
                <p style={{ fontSize: "13px", color: (useDarkAzure || welcomeBannerVisible || isHomepage) ? "rgba(255, 255, 255, 0.85)" : "rgba(31, 41, 55, 0.65)", fontWeight: "500", margin: "4px 0 0 0" }}>
                  Fresh groceries, essentials & more delivered fast.
                </p>
              </div>
            </div>

            {/* Right Column: Action Icons on top, and Rotating Offer Pill below them */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* Bell Icon */}
                <button
                  type="button"
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
                  title="Notifications"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={(useDarkAzure || welcomeBannerVisible || isHomepage) ? "#FFFFFF" : "#374151"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </button>
                <ProfileButton onClick={() => navigate("/profile")} />
              </div>

              {/* Rotating Offer Pill */}
              <div style={{
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
                maxWidth: "135px"
              }}>
                <span style={{ fontSize: "16px" }}>{promos[promoIdx].icon}</span>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: "1.2" }}>
                  <span style={{ fontWeight: "750", color: "#318616", whiteSpace: "nowrap" }}>{promos[promoIdx].text}</span>
                  <span style={{ fontSize: "9px", color: "#4b5563", whiteSpace: "nowrap" }}>{promos[promoIdx].sub}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STICKY/SEARCH/CATEGORY SECTION */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
            <div style={{ position: "relative", flexGrow: 1 }}>
              <SearchBar
                useDarkAzure={useDarkAzure}
                welcomeBannerVisible={welcomeBannerVisible}
                isHomepage={isHomepage}
                isMobile={isMobile}
              />
            </div>
            {renderDesktopActionButtons()}
          </div>

          {location.pathname === "/" && (
            <CategoryStrip
              displayCats={displayCats}
              selectedCategory={selectedCategory}
              onCategoryClick={onCategoryClick}
              whiteText={useDarkAzure || welcomeBannerVisible || isHomepage}
            />
          )}
        </div>
      </>
    );
  };

  if (isMobile) {
    const hasCategoryStrip = isHomepage || isElectronicsPage || isBeautyPage || isPharmacyPage || isDecorPage || isKidsPage || isGiftPage;
    const stickyToolbarHeight = hasCategoryStrip ? 116 : 64;

    return (
      <div
        ref={headerRef}
        className="buyto-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          paddingTop: "env(safe-area-inset-top)",
          fontFamily: "'Outfit', 'Inter', sans-serif",
          backgroundImage: (useDarkAzure || welcomeBannerVisible || isHomepage) ? (isDark ? "none" : "radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.15) 0%, transparent 50%), linear-gradient(135deg, #075E7A 0%, #087EA4 45%, #1295B8 100%)") : theme.backgroundGradient,
          backgroundColor: (useDarkAzure || welcomeBannerVisible || isHomepage) ? (isDark ? "#181A20" : "transparent") : (isDark ? "#181A20" : theme.backgroundColor),
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          borderBottomLeftRadius: "0px",
          borderBottomRightRadius: "0px",
          boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.3)" : "0 10px 30px rgba(0,0,0,0.06)",
          overflow: "hidden",
          transition: "background-color 250ms ease, background-image 250ms ease",
          "--header-text-color": isElectronicsPage ? "#FFFFFF" : ((useDarkAzure || welcomeBannerVisible || isHomepage) ? (isDark ? "#F5F5F5" : "#FFFFFF") : (isDark ? "#F5F5F5" : "#000000")),
          "--logo-part1-color": isElectronicsPage ? "#FFFFFF" : ((useDarkAzure || welcomeBannerVisible || isHomepage) ? (isDark ? "#F5F5F5" : "#FFFFFF") : "#F59E0B"),
          "--logo-part2-color": isElectronicsPage ? "#FFFFFF" : ((useDarkAzure || welcomeBannerVisible || isHomepage) ? (isDark ? "#F5F5F5" : "#FFFFFF") : "#318616"),
          "--category-text-color": (useDarkAzure || welcomeBannerVisible || isHomepage) ? (isDark ? "#F5F5F5" : "#FFFFFF") : (isDark ? "#F5F5F5" : "#000000"),
          "--category-icon-filter": (useDarkAzure || welcomeBannerVisible || isHomepage) ? "brightness(0) invert(1)" : (isDark ? "brightness(0) invert(1)" : "brightness(0)")
        }}
      >
        {/* CSS for logos/wordmark in mobile */}
        <style dangerouslySetInnerHTML={{
          __html: `
          .premium-logo-container {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .premium-logo-img {
            width: 34px !important;
            height: 34px !important;
            border-radius: 50% !important;
            border: 1px solid rgba(0, 0, 0, 0.08) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06) !important;
            object-fit: cover !important;
          }
          .premium-wordmark {
            font-family: 'Outfit', sans-serif;
            font-weight: 600;
            font-size: 18px;
            line-height: 1;
            letter-spacing: -0.5px;
            display: inline-flex;
            align-items: center;
            align-self: center;
          }
        `}} />

        {/* 1. Collapsible Header (Row 1 + Row 2) */}
        <div
          ref={collapsibleRef}
          style={{
            position: "relative",
            zIndex: 1,
            background: "transparent",
            paddingTop: isDown ? "0px" : "8px",
            paddingBottom: isDown ? "0px" : "6px",
            paddingLeft: isDown ? "0px" : "16px",
            paddingRight: isDown ? "0px" : "16px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            opacity: isDown ? 0 : 1,
            height: isDown ? "0px" : `${collapsibleHeight || 70}px`,
            overflow: "hidden",
            transition: "height 200ms ease, opacity 200ms ease, padding 200ms ease",
            boxSizing: "border-box"
          }}
        >
          {/* Row 1: Logo, Wallet, Profile */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <LogoArea brandText="LetsBuyto" whiteText={useDarkAzure || welcomeBannerVisible || isHomepage || isElectronicsPage} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <WalletButton balance={walletBalance} onClick={() => navigate("/wallet")} compact={true} />
              <ProfileButton onClick={() => navigate("/profile")} compact={true} />
            </div>
          </div>

          {/* Row 2: Location */}
          <LocationBar
            authLoading={authLoading}
            onOpenAddressModal={onOpenAddressModal}
            useDarkAzure={useDarkAzure}
            welcomeBannerVisible={welcomeBannerVisible}
            isHomepage={isHomepage}
            isMobile={true}
          />
        </div>

        {/* 2. Sticky Toolbar (Row 3 + Row 4) */}
        <div
          className="sticky-toolbar"
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            background: "transparent",
            paddingTop: "6px",
            paddingBottom: "8px",
            paddingLeft: "16px",
            paddingRight: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            minHeight: `${stickyToolbarHeight}px`,
            boxSizing: "border-box"
          }}
        >
          {/* Row 3: Search Bar */}
          <div style={{ position: "relative", width: "100%", margin: "1px 0" }}>
            <SearchBar
              useDarkAzure={useDarkAzure}
              welcomeBannerVisible={welcomeBannerVisible}
              isHomepage={isHomepage}
              isMobile={isMobile}
            />
          </div>

          {/* Row 4: Category Strip */}
          {(isHomepage || isElectronicsPage || isBeautyPage || isPharmacyPage || isDecorPage || isKidsPage || isGiftPage) && (
            <div style={{ width: "100%", marginTop: "1px" }}>
              <CategoryStrip
                displayCats={displayCats}
                selectedCategory={selectedCategory}
                onCategoryClick={onCategoryClick}
                whiteText={isDark || useDarkAzure || welcomeBannerVisible || isHomepage || isElectronicsPage}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={headerRef}
      className="buyto-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backgroundImage: (useDarkAzure || welcomeBannerVisible || isHomepage) ? (isDark ? "none" : "radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.15) 0%, transparent 50%), linear-gradient(135deg, #075E7A 0%, #087EA4 45%, #1295B8 100%)") : theme.backgroundGradient,
        backgroundColor: (useDarkAzure || welcomeBannerVisible || isHomepage) ? (isDark ? "#181A20" : "transparent") : (isDark ? "#181A20" : theme.backgroundColor),
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.3)" : "0 10px 30px rgba(0,0,0,0.04)",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        paddingTop: "calc(env(safe-area-inset-top) + 24px)",
        paddingBottom: "20px",
        paddingLeft: "16px",
        paddingRight: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        transform: isDown ? `translate3d(0, -${collapsibleHeight + 10}px, 0)` : "translate3d(0, 0, 0)",
        willChange: "transform",
        transition: isDown
          ? "transform 300ms cubic-bezier(0.22, 1, 0.36, 1), background 300ms ease, background-color 250ms ease, background-image 250ms ease"
          : "transform 320ms ease-in-out, background 300ms ease, background-color 250ms ease, background-image 250ms ease",
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        boxSizing: "border-box",
        borderBottomLeftRadius: "0px",
        borderBottomRightRadius: "0px",
        minHeight: isDown ? "auto" : "280px",
        "--header-text-color": isElectronicsPage ? "#FFFFFF" : ((useDarkAzure || welcomeBannerVisible || isHomepage) ? (isDark ? "#F5F5F5" : "#FFFFFF") : (isDark ? "#F5F5F5" : "#000000")),
        "--logo-part1-color": isElectronicsPage ? "#FFFFFF" : ((useDarkAzure || welcomeBannerVisible || isHomepage) ? (isDark ? "#F5F5F5" : "#FFFFFF") : "#F59E0B"),
        "--logo-part2-color": isElectronicsPage ? "#FFFFFF" : ((useDarkAzure || welcomeBannerVisible || isHomepage) ? (isDark ? "#F5F5F5" : "#FFFFFF") : "#318616"),
        "--category-text-color": (useDarkAzure || welcomeBannerVisible || isHomepage) ? (isDark ? "#F5F5F5" : "#FFFFFF") : (isDark ? "#F5F5F5" : "#000000"),
        "--category-icon-filter": (useDarkAzure || welcomeBannerVisible || isHomepage) ? "brightness(0) invert(1)" : (isDark ? "brightness(0) invert(1)" : "brightness(0)")
      }}
    >
      <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
        <DesktopHeaderContent />
      </div>
    </div>
  );
});

export default Header;
