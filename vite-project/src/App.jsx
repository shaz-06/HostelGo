import React, { useEffect, useState, useContext, useMemo, useRef, useCallback, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { BRANDING } from "./config/branding";
import BuytoLogo from "./components/common/BuytoLogo";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import RiderProtectedRoute from "./components/RiderProtectedRoute";
import CategoryDiscovery from "./components/CategoryDiscovery";
import { classifyProduct, canonicalCategory } from "./utils/productClassifier";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { io } from "socket.io-client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import HorizontalProductSection from "./HorizontalProductSection";
import TrendingThisWeek from "./components/TrendingThisWeek";
import MobileBannerCarousel from "./components/mobile/MobileBannerCarousel";
import Header, { CategoryStrip } from "./components/common/Header";

// Lazy-loaded components & pages
const AddressSelectorModal = lazy(() => import("./components/common/AddressSelectorModal"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const UserDetails = lazy(() => import("./pages/UserDetails"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const SuccessPage = lazy(() => import("./pages/SuccessPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const SectionProductsPage = lazy(() => import("./pages/SectionProductsPage"));
const ProductDetailsPage = lazy(() => import("./pages/ProductDetailsPage"));
const CategoryProductsPage = lazy(() => import("./pages/CategoryProductsPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminOrdersPage = lazy(() => import("./pages/AdminOrdersPage"));
const AdminProductsPage = lazy(() => import("./pages/AdminProductsPage"));
const AdminRidersPage = lazy(() => import("./pages/AdminRidersPage"));
const RiderDashboard = lazy(() => import("./pages/RiderDashboard"));
const RiderLogin = lazy(() => import("./pages/RiderLogin"));
const RiderSignup = lazy(() => import("./pages/RiderSignup"));
const OrderTrackingPage = lazy(() => import("./pages/OrderTrackingPage"));
const SupportChatPage = lazy(() => import("./pages/SupportChatPage"));
const AdminSupportPage = lazy(() => import("./pages/AdminSupportPage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const ShoppingListPage = lazy(() => import("./pages/ShoppingListPage"));
const ShoppingListResultsPage = lazy(() => import("./pages/ShoppingListResultsPage"));
const SmartMatchingPage = lazy(() => import("./pages/SmartMatchingPage"));
const SavedListsPage = lazy(() => import("./pages/SavedListsPage"));
const SaveForLaterPage = lazy(() => import("./pages/SaveForLaterPage"));

// API Cache & Performance Logger
import { cachedFetch } from "./utils/apiCache";
import { usePerfLogger } from "./utils/perfLogger";

const CORE_ORDER = [
  "All Items",
  "Fresh Items",
  "The Fruit Store",
  "The Veggie Store",
  "Dairy, Bread & Eggs",
  "Meat and Seafood",
  "Snacks",
  "Beverages",
  "Atta, Rice and Dal",
  "Electronics & Appliances",
  "Fashion",
  "Hostel Essentials",
  "Beauty & Personal Care",
  "Emergency Items",
  "Daily Needs"
];

const getPriorityIndex = (name) => {
  const idx = CORE_ORDER.findIndex(item => {
    const n1 = item.toLowerCase().trim().replace(/[&,]/g, "");
    const n2 = name.toLowerCase().trim().replace(/[&,]/g, "");
    return n1.includes(n2) || n2.includes(n1);
  });
  return idx === -1 ? 9999 : idx;
};

const generateSlug = (name) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const getCategorySlug = (cat) => {
  if (!cat) return "";
  return cat.toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const getCategoryRoute = (categoryName) => {
  const norm = categoryName.toLowerCase().trim();
  if (norm.includes("all")) return "/";
  if (norm.includes("fruit")) return "/section/fruits";
  if (norm.includes("veggie") || norm.includes("vegetable")) return "/section/veggies";
  if (norm.includes("dairy") || norm.includes("egg")) return "/section/dairy";
  if (norm.includes("meat") || norm.includes("seafood")) return "/section/meat";
  if (norm.includes("atta") || norm.includes("rice") || norm.includes("dal")) return "/section/grocery";
  if (norm.includes("beverage") || norm.includes("drink")) return "/section/cold-drinks";
  if (norm.includes("snack") || norm.includes("munchies")) return "/section/chips-namkeens";
  if (norm.includes("bread store")) return "/section/bread-store";
  if (norm.includes("pickle")) return "/section/pickles";
  if (norm.includes("sexual") || norm.includes("wellness")) return "/section/sexual-wellness";
  if (norm.includes("cleaner") || norm.includes("repellent")) return "/section/cleaners-repellents";
  if (norm.includes("electronic") || norm.includes("appliance")) return "/section/electronics-appliances";
  return `/section/${getCategorySlug(categoryName)}`;
};

const getSectionIdForTitle = (title) => {
  switch (title) {
    case "Exclusive Deals For You": return "section-exclusive-deals";
    case "No more mosquitoes!": return "section-cleaners-and-repellents";
    case "The Bread Store": return "section-the-bread-store";
    case "Premium Pickles": return "section-premium-pickles";
    case "Sexual wellness": return "section-sexual-wellness";
    default: return `section-${getCategorySlug(title)}`;
  }
};
import MobileHome from "./components/mobile/MobileHome";
import MobileBottomNavigation from "./components/mobile/MobileBottomNavigation";
import { MOBILE_NAV_TOTAL_OFFSET } from "./constants/layoutConstants";

const destinationIcon = new L.DivIcon({
  html: `
    <div
      style="
        width:12px;
        height:12px;
        background:#ef4444;
        border-radius:3px;
        border:2px solid white;
        box-shadow:0 1px 6px rgba(0,0,0,0.2);
      "
    ></div>
  `,
  className: "",
  iconSize: [12, 12],
});

const riderIcon = new L.DivIcon({
  html: `
    <div
      style="
        font-size:22px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
      "
    >
      🛵
    </div>
  `,
  className: "",
  iconSize: [22, 22],
});

// Custom map viewer helper to keep viewport dynamically focused on both rider and user location in global popup
function ChangePopupMapView({ center, userPos }) {
  const map = useMap();
  useEffect(() => {
    if (center && userPos) {
      console.log("=== MAP CENTER ===");
      console.log(center);
      map.fitBounds([center, userPos], { padding: [20, 20] });
    }
  }, [center, userPos, map]);
  return null;
}

function GlobalLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [hideTrackingCard, setHideTrackingCard] = useState(!!localStorage.getItem("hideTrackingCard"));

  const handleAppBack = () => {
    const currentPath = window.location.pathname;
    if (currentPath.startsWith("/payment") || currentPath.startsWith("/checkout")) {
      navigate("/cart");
    } else if (currentPath.startsWith("/track-order/")) {
      navigate("/profile");
    } else {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/");
      }
    }
  };

  // Capacitor native hardware back button handler
  useEffect(() => {
    const listenerPromise = CapApp.addListener("backButton", (event) => {
      const currentPath = window.location.pathname;
      if (currentPath === "/" || currentPath === "/home") {
        CapApp.exitApp();
      } else {
        handleAppBack();
      }
    });

    return () => {
      listenerPromise.then((l) => l.remove());
    };
  }, [navigate]);

  useEffect(() => {
    setHideTrackingCard(!!localStorage.getItem("hideTrackingCard"));
  }, [location.pathname]);

  const isLiveTrackingEnabled = false;

  const activeOrder = localStorage.getItem("activeOrder") === "true";
  const latestOrderId = localStorage.getItem("latestOrderId");

  const shouldShowFloatingCard =
    isLiveTrackingEnabled &&
    activeOrder &&
    latestOrderId &&
    !hideTrackingCard &&
    location.pathname !== "/success" &&
    location.pathname !== "/order-success";

  const [riderPos, setRiderPos] = useState([13.628, 74.693]);
  const [userPos, setUserPos] = useState([13.628, 74.693]);
  const [currentETA, setCurrentETA] = useState(30);

  useEffect(() => {
    if (!isLiveTrackingEnabled) return;
    if (!latestOrderId || !activeOrder) return;

    const fetchOrderDetails = async () => {
      const token = localStorage.getItem("buyto_token");
      if (!token) return;
      try {
        const res = await fetch(window.API_BASE_URL + `/api/orders/track/${latestOrderId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          const uLat = data.order?.deliveryLatitude || data.order?.user?.latitude || 13.628;
          const uLng = data.order?.deliveryLongitude || data.order?.user?.longitude || 74.693;
          setUserPos([uLat, uLng]);

          const rLat = data.rider?.latitude || data.rider?.currentLocation?.lat || (uLat + 0.005);
          const rLng = data.rider?.longitude || data.rider?.currentLocation?.lng || (uLng + 0.005);
          setRiderPos([rLat, rLng]);

          // Haversine dynamic ETA
          const R = 6371; // km
          const dLat = (uLat - rLat) * Math.PI / 180;
          const dLon = (uLng - rLng) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rLat * Math.PI / 180) * Math.cos(uLat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          const minutes = Math.max(1, Math.round(distance * 2.4 + 2));
          setCurrentETA(data.order?.orderStatus === "Delivered" ? 0 : minutes);

          console.log("=== CUSTOMER GPS ===");
          console.log(uLat, uLng);
          console.log("=== RIDER GPS UPDATE ===");
          console.log(rLat, rLng);
        }
      } catch (err) {
        console.error("Error fetching order in popup:", err);
      }
    };

    fetchOrderDetails();
    const interval = setInterval(fetchOrderDetails, 8000);
    return () => clearInterval(interval);
  }, [latestOrderId, activeOrder]);

  useEffect(() => {
    if (!isLiveTrackingEnabled) return;
    if (!latestOrderId || !activeOrder) return;

    const socket = io(window.API_BASE_URL);

    socket.on("connect", () => {
      console.log("🔌 Popup connected to Socket.IO. Joining room:", latestOrderId);
      socket.emit("joinOrderRoom", latestOrderId);
    });

    socket.on("riderLocationUpdated", (data) => {
      console.log("=== SOCKET LOCATION EVENT ===");
      console.log(data);
      setRiderPos([data.latitude, data.longitude]);

      const R = 6371; // km
      const dLat = (userPos[0] - data.latitude) * Math.PI / 180;
      const dLon = (userPos[1] - data.longitude) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(data.latitude * Math.PI / 180) * Math.cos(userPos[0] * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      const minutes = Math.max(1, Math.round(distance * 2.4 + 2));
      setCurrentETA(minutes);
    });

    return () => {
      socket.disconnect();
    };
  }, [latestOrderId, activeOrder, userPos]);

  return (
    <>
      {children}
      {shouldShowFloatingCard && (
        <div
          onClick={() => {
            const latestId = localStorage.getItem("latestOrderId");
            if (latestId) {
              navigate(`/track-order/${latestId}`);
            } else {
              navigate("/success");
            }
          }}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "280px",
            background: "white",
            borderRadius: "24px",
            overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0,0,0,0.16)",
            zIndex: 9999,
            cursor: "pointer",
            border: "1px solid #e5e7eb",
            fontFamily: "'Outfit', 'Inter', sans-serif",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 18px 48px rgba(0,0,0,0.22)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.16)";
          }}
        >
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              localStorage.setItem("hideTrackingCard", "true");
              setHideTrackingCard(true);
            }}
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              border: "none",
              background: "#f3f4f6",
              color: "#4b5563",
              fontSize: "10px",
              fontWeight: "800",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
            }}
          >
            ✕
          </button>

          {/* Top Info */}
          <div style={{ padding: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#1f2937", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🛵</span> Arriving in {currentETA} mins
            </h3>
            <p style={{ color: "#6b7280", marginTop: "4px", fontSize: "12px", margin: 0, fontWeight: "600" }}>
              📍 Tap to open live tracking
            </p>
          </div>

          {/* Mini Map */}
          <div style={{ height: "130px", width: "100%", position: "relative" }}>
            <MapContainer
              center={riderPos}
              zoom={13}
              style={{
                height: "100%",
                width: "100%",
              }}
              zoomControl={false}
              attributionControl={false}
              dragging={false}
              doubleClickZoom={false}
              scrollWheelZoom={false}
            >
              <ChangePopupMapView center={riderPos} userPos={userPos} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={userPos} icon={destinationIcon} />
              <Marker position={riderPos} icon={riderIcon} />
            </MapContainer>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashFade, setSplashFade] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide().catch((err) => console.warn("Native SplashScreen.hide failed:", err));
    }
  }, []);

  useEffect(() => {
    if (!appReady) return;

    const timerFade = setTimeout(() => {
      setSplashFade(true);
      document.body.classList.add("app-ready");
    }, 1500);
    const timerDismiss = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => {
      clearTimeout(timerFade);
      clearTimeout(timerDismiss);
    };
  }, [appReady]);

  return (
    <AuthProvider>
      <BrowserRouter>
        {showSplash && (
          <div
            onClick={() => {
              setSplashFade(true);
              setTimeout(() => setShowSplash(false), 500);
            }}
            className="splash-bg"
            style={{
              opacity: splashFade ? 0 : 1,
              transition: "opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          >
            {/* The main relative 1024x1024 canvas wrapper */}
            <div className="splash-canvas">
              
              {/* Slogan Main */}
              <img src="/images/splash/slogan_main.png" className="splash-slogan-main" alt="Buy Smart Delivered Fast" />

              {/* Slogan Sub */}
              <img src="/images/splash/slogan_sub.png" className="splash-slogan-sub" alt="Your One-Stop Online Store" />

              {/* Buyto Cart (B logo) */}
              <img src="/images/splash/cart_b.png" className="splash-cart-b" alt="Buyto Cart" />

              {/* Scooter Wrapper (to hold wheels relative to body) */}
              <div className="splash-scooter-container">
                <img src="/images/splash/scooter_no_wheels.png" className="splash-scooter-body" alt="Scooter Body" />
                <img src="/images/splash/wheel_front.png" className="splash-wheel-front" alt="Front Wheel" />
                <img src="/images/splash/wheel_back.png" className="splash-wheel-back" alt="Back Wheel" />
              </div>

              {/* Shopping Bag */}
              <img src="/images/splash/shopping_bag.png" className="splash-shopping-bag" alt="Shopping Bag" />

              {/* Mobile Phone */}
              <img src="/images/splash/phone.png" className="splash-phone" alt="Mobile Phone" />
            </div>

            {/* Bottom Trust Badges */}
            <div className="splash-badges">
              <img src="/images/splash/badge_secure.png" className="splash-badge badge-1" alt="100% Secure" />
              <img src="/images/splash/badge_quality.png" className="splash-badge badge-2" alt="Best Quality" />
              <img src="/images/splash/badge_delivery.png" className="splash-badge badge-3" alt="Fast Delivery" />
              <img src="/images/splash/badge_support.png" className="splash-badge badge-4" alt="24/7 Support" />
            </div>

            <style>{`
              .splash-bg {
                position: fixed;
                inset: 0;
                background: radial-gradient(circle, #fbc607 0%, #f7a80a 100%);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 999999;
                user-select: none;
                overflow: hidden;
                will-change: opacity;
              }

              .splash-canvas {
                position: relative;
                width: 90vw;
                max-width: 500px;
                aspect-ratio: 1;
              }

              .splash-slogan-main {
                position: absolute;
                left: 17.6%;
                top: 3.2%;
                width: 64.5%;
                opacity: 0;
                transform: translate3d(0, 15px, 0) scale(0.95);
                animation: sloganReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                animation-delay: 1.8s;
                will-change: transform, opacity;
              }

              .splash-slogan-sub {
                position: absolute;
                left: 27.3%;
                top: 17.1%;
                width: 46.9%;
                opacity: 0;
                transform: translate3d(0, 10px, 0) scale(0.95);
                animation: sloganReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                animation-delay: 2.1s;
                will-change: transform, opacity;
              }

              .splash-cart-b {
                position: absolute;
                left: 19.5%;
                top: 23.4%;
                width: 60.5%;
                transform: translate3d(-200%, 0, 0);
                animation: cartEnter 0.8s cubic-bezier(0.25, 1.1, 0.5, 1.1) forwards, pulseCart 3s infinite ease-in-out;
                animation-delay: 0.6s, 2.8s;
                will-change: transform;
              }

              .splash-scooter-container {
                position: absolute;
                left: 5.8%;
                top: 42%;
                width: 38.1%;
                aspect-ratio: 0.85; /* width 390, height 460 */
                transform: translate3d(250%, 0, 0);
                animation: scooterEnter 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                animation-delay: 0.2s;
                will-change: transform, filter;
              }

              .splash-scooter-body {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                object-fit: contain;
              }

              .splash-wheel-front {
                position: absolute;
                left: 22%;
                top: 80.4%;
                width: 30.2%;
                transform: translate(-50%, -50%);
                transform-origin: center;
                animation: wheelRotate 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                animation-delay: 0.2s;
                will-change: transform;
              }

              .splash-wheel-back {
                position: absolute;
                left: 79.5%;
                top: 75%;
                width: 20.5%;
                transform: translate(-50%, -50%);
                transform-origin: center;
                animation: wheelRotate 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                animation-delay: 0.2s;
                will-change: transform;
              }

              .splash-shopping-bag {
                position: absolute;
                left: 56.6%;
                top: 58.6%;
                width: 21.5%;
                transform: translate3d(0, -250%, 0);
                animation: bagEnter 0.7s cubic-bezier(0.25, 1.25, 0.5, 1.25) forwards;
                animation-delay: 1.0s;
                will-change: transform;
              }

              .splash-phone {
                position: absolute;
                left: 71.8%;
                top: 42%;
                width: 21.5%;
                transform: translate3d(0, 200%, 0);
                animation: phoneEnter 0.7s cubic-bezier(0.25, 1, 0.5, 1.1) forwards;
                animation-delay: 1.3s;
                will-change: transform;
              }

              .splash-badges {
                position: absolute;
                bottom: 6%;
                left: 5%;
                right: 5%;
                display: flex;
                justify-content: space-around;
                align-items: center;
                gap: 12px;
              }

              .splash-badge {
                height: 38px;
                object-fit: contain;
                opacity: 0;
                transform: translate3d(0, 15px, 0);
                animation: badgeReveal 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                will-change: transform, opacity;
              }

              .splash-badge.badge-1 { animation-delay: 2.4s; }
              .splash-badge.badge-2 { animation-delay: 2.5s; }
              .splash-badge.badge-3 { animation-delay: 2.6s; }
              .splash-badge.badge-4 { animation-delay: 2.7s; }

              /* Animation Keyframes */
              @keyframes sloganReveal {
                0% {
                  opacity: 0;
                  transform: translate3d(0, 15px, 0) scale(0.95);
                }
                100% {
                  opacity: 1;
                  transform: translate3d(0, 0, 0) scale(1);
                }
              }

              @keyframes badgeReveal {
                0% {
                  opacity: 0;
                  transform: translate3d(0, 15px, 0);
                }
                100% {
                  opacity: 1;
                  transform: translate3d(0, 0, 0);
                }
              }

              @keyframes cartEnter {
                0% {
                  transform: translate3d(-200%, 0, 0) scale(0.9);
                }
                60% {
                  transform: translate3d(5%, 0, 0) scale(1.02);
                }
                80% {
                  transform: translate3d(-2%, 0, 0) scale(0.99);
                }
                100% {
                  transform: translate3d(0, 0, 0) scale(1);
                }
              }

              @keyframes pulseCart {
                0%, 100% {
                  transform: scale(1);
                }
                50% {
                  transform: scale(1.02);
                }
              }

              @keyframes scooterEnter {
                0% {
                  transform: translate3d(250%, 0, 0);
                  filter: blur(8px);
                }
                75% {
                  transform: translate3d(-8%, 0, 0);
                  filter: blur(2px);
                }
                100% {
                  transform: translate3d(0, 0, 0);
                  filter: blur(0px);
                }
              }

              @keyframes wheelRotate {
                0% {
                  transform: translate(-50%, -50%) rotate(0deg);
                }
                100% {
                  transform: translate(-50%, -50%) rotate(-1080deg);
                }
              }

              @keyframes bagEnter {
                0% {
                  transform: translate3d(0, -250%, 0) scaleY(1.2);
                }
                65% {
                  transform: translate3d(0, 6%, 0) scaleY(0.85);
                }
                85% {
                  transform: translate3d(0, -2%, 0) scaleY(1.02);
                }
                100% {
                  transform: translate3d(0, 0, 0) scaleY(1);
                }
              }

              @keyframes phoneEnter {
                0% {
                  transform: translate3d(0, 200%, 0);
                }
                100% {
                  transform: translate3d(0, 0, 0);
                }
              }
            `}</style>
          </div>
        )}
        <GlobalLayout>
          <Suspense fallback={
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", fontFamily: "'Outfit', sans-serif" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  border: "3px solid #f3f4f6",
                  borderTop: "3px solid #318616",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 12px auto"
                }} />
                <p style={{ color: "#6b7280", fontSize: "14px", fontWeight: "600" }}>Loading...</p>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            </div>
          }>
            <AppContent onReady={() => setAppReady(true)} />
          </Suspense>
        </GlobalLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}



function AppContent({ onReady }) {
  usePerfLogger("AppContent");

  const FREE_DELIVERY_THRESHOLD = 99;
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem("buyto_cart") || localStorage.getItem("cart");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        } else {
          return Object.values(parsed).map((item) => ({
            ...item.product,
            quantity: item.quantity,
          }));
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const cart = cartItems.reduce((acc, item) => {
    const key = item._id || item.id;
    const suffix = item.selectedWeight ? `_${item.selectedWeight}` : "";
    const cartKey = `${key}${suffix}`;
    acc[cartKey] = { product: item, quantity: item.quantity };
    return acc;
  }, {});

  // Sync cartItems state with localStorage
  useEffect(() => {
    localStorage.setItem("buyto_cart", JSON.stringify(cartItems));
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Sync cartItems state from localStorage custom events (e.g. from SectionPages)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("buyto_cart") || localStorage.getItem("cart");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          let parsedArray = [];
          if (Array.isArray(parsed)) {
            parsedArray = parsed;
          } else {
            parsedArray = Object.values(parsed).map((item) => ({
              ...item.product,
              quantity: item.quantity,
            }));
          }
          if (JSON.stringify(parsedArray) !== JSON.stringify(cartItems)) {
            setCartItems(parsedArray);
          }
        } catch (e) { }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-cart-updated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-cart-updated", handleStorageChange);
    };
  }, [cartItems]);

  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMobileTab, setActiveMobileTab] = useState("home");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categories, setCategories] = useState([
    { name: "The Fruit Store", icon: "🍎", image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&auto=format&fit=crop&q=80", priority: 10, showInHeader: true },
    { name: "The Veggie Store", icon: "🥬", image: "https://images.unsplash.com/photo-1566385278603-605b637d384c?w=200&auto=format&fit=crop&q=80", priority: 9, showInHeader: true },
    { name: "Dairy, Bread & Eggs", icon: "🥛", image: "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=200&auto=format&fit=crop&q=80", priority: 8, showInHeader: true },
    { name: "Meat and Seafood", icon: "🥩", image: "https://images.unsplash.com/photo-1532407191490-e847be1540c6?w=200&auto=format&fit=crop&q=80", priority: 7, showInHeader: true },
    { name: "Snacks", icon: "🍿", image: "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=200&auto=format&fit=crop&q=80", priority: 6, showInHeader: true },
    { name: "Beverages", icon: "🥤", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&auto=format&fit=crop&q=80", priority: 5, showInHeader: true },
    { name: "Atta, Rice and Dal", icon: "🌾", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&auto=format&fit=crop&q=80", priority: 4, showInHeader: true },
    { name: "Exclusive Deals", icon: "🔥", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80", priority: 3, showInHeader: true },
    { name: "Cleaners & Repellents", icon: "🧹", image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=200&auto=format&fit=crop&q=80", priority: 2, showInHeader: true },
    { name: "The Bread Store", icon: "🍞", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&auto=format&fit=crop&q=80", priority: 1, showInHeader: true },
    { name: "Premium Pickles", icon: "🥒", image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&auto=format&fit=crop&q=80", priority: 0, showInHeader: true },
    { name: "Sexual Wellness", icon: "❤️", image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=200&auto=format&fit=crop&q=80", priority: -1, showInHeader: true }
  ]);

  useEffect(() => {
    cachedFetch(window.API_BASE_URL + "/api/categories")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load categories in frontend App.jsx:", err);
      });
  }, []);

  const categoryCounts = useMemo(() => {
    const counts = {};
    (products || []).forEach(p => {
      const classified = classifyProduct(p);
      const canonicalClassified = canonicalCategory(classified);
      counts[canonicalClassified] = (counts[canonicalClassified] || 0) + 1;
    });

    const headerCounts = { "All": (products || []).length };
    (categories || []).forEach(c => {
      const canon = canonicalCategory(c.name);
      headerCounts[c.name] = counts[canon] || 0;
    });

    return headerCounts;
  }, [products, categories]);

  const displayCats = useMemo(() => {
    const filtered = categories.map(c => {
      const slug = c.slug || generateSlug(c.name);
      const id = c._id || c.id || slug;
      return { ...c, id, slug };
    }).filter(c => c.showInHeader !== false);

    filtered.sort((a, b) => {
      const pA = getPriorityIndex(a.name);
      const pB = getPriorityIndex(b.name);
      if (pA !== pB) return pA - pB;
      return a.name.localeCompare(b.name);
    });

    const allCat = { id: "all", name: "All", icon: "🧺", image: "", slug: "all", showInHeader: true };
    return [allCat, ...filtered];
  }, [categories]);

  const handleCategoryClick = useCallback((cat) => {
    const category = cat;
    const name = category.name;
    const slug = category.slug || generateSlug(name);
    console.log('Category Clicked:', category);
    console.log('Generated Slug:', slug);

    const sectionMap = {
      "The Fruit Store": "fresh-fruits",
      "Fresh Fruits": "fresh-fruits",
      "Fruit Store": "fresh-fruits",

      "The Veggie Store": "fresh-vegetables",
      "Fresh Vegetables": "fresh-vegetables",
      "Veggie Store": "fresh-vegetables",

      "Dairy, Bread & Eggs": "dairy-bread-eggs",
      "Dairy, Bread and Eggs": "dairy-bread-eggs",

      "Meat and Seafood": "meat-seafood",
      "Meat & Seafood": "meat-seafood",

      "Beverages": "cold-drinks-juices",
      "Cold Drinks & Juices": "cold-drinks-juices",

      "Electronics & Appliances": "mobiles-electronics",
      "Mobiles & Electronics": "mobiles-electronics",

      "Snacks": "snacks",
      "Atta, Rice and Dal": "atta-rice-and-dal",
      "Atta, Rice & Dal": "atta-rice-and-dal"
    };

    const targetId = sectionMap[name];

    if (location.pathname !== "/") {
      setSelectedCategory(name);
      navigate("/", { state: { scrollToSectionId: targetId, categoryName: name } });
      return;
    }

    if (name === "All") {
      setSelectedCategory("All");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (targetId) {
      setSelectedCategory(name);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [location.pathname, navigate]);

  const memoizedDisplayCats = useMemo(
    () => displayCats,
    [displayCats]
  );

  // Scroll Redirect Handler when coming back to Home Page
  useEffect(() => {
    if (location.pathname === "/" && location.state?.scrollToSectionId) {
      const targetId = location.state.scrollToSectionId;
      const catName = location.state.categoryName;
      if (catName) {
        setSelectedCategory(catName);
      }
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Scroll Intersection Observer for Bidirectional Category Sync
  useEffect(() => {
    if (location.pathname !== "/") return;

    const sectionIds = [
      "fresh-fruits",
      "fresh-vegetables",
      "dairy-bread-eggs",
      "meat-seafood",
      "cold-drinks-juices",
      "mobiles-electronics",
      "snacks",
      "atta-rice-and-dal"
    ];

    const observerOptions = {
      root: null,
      rootMargin: "-150px 0px -60% 0px",
      threshold: 0
    };

    const idToCategoryMap = {
      "fresh-fruits": "The Fruit Store",
      "fresh-vegetables": "The Veggie Store",
      "dairy-bread-eggs": "Dairy, Bread & Eggs",
      "meat-seafood": "Meat and Seafood",
      "cold-drinks-juices": "Beverages",
      "mobiles-electronics": "Electronics & Appliances",
      "snacks": "Snacks",
      "atta-rice-and-dal": "Atta, Rice and Dal"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const categoryName = idToCategoryMap[entry.target.id];
          if (categoryName) {
            setSelectedCategory(categoryName);
          }
        }
      });
    }, observerOptions);

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [location.pathname, products]);

  const { user, token, logout } = useContext(AuthContext);
  const isLoggedIn = !!user;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [activeCoupons, setActiveCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [appliedCouponCelebration, setAppliedCouponCelebration] = useState(null);

  const handleSetSelectedCoupon = (coupon, source) => {
    setSelectedCoupon(coupon);
    if (coupon && source === "payment") {
      setAppliedCouponCelebration(coupon);
    }
  };

  useEffect(() => {
    if (!token) {
      setActiveCoupons([]);
      setSelectedCoupon(null);
      return;
    }
    const fetchActiveCoupons = async () => {
      try {
        const couponRes = await fetch(window.API_BASE_URL + "/api/auth/coupons/active", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (couponRes.ok) {
          const couponData = await couponRes.json();
          if (couponData.success && couponData.coupons) {
            setActiveCoupons(couponData.coupons);
          }
        }
      } catch (err) {
        console.error("Error fetching active coupons in App:", err);
      }
    };
    fetchActiveCoupons();
  }, [token]);
  const firstName = user?.name?.split(" ")[0] || "";
  const [showMenu, setShowMenu] = useState(false);
  const [userLocation, setUserLocation] = useState(() => localStorage.getItem("userLocation") || "Apartment 101, Central Tower");
  const [roomNumber, setRoomNumber] = useState(() => localStorage.getItem("roomNumber") || "Floor 1");
  const [showAddressModal, setShowAddressModal] = useState(false);

  const searchSuggestions = products.length > 0
    ? products.map(item => item.name)
    : ["fresh fruits", "organic veggies", "fresh milk", "bread & eggs", "ice cream", "potato chips", "cold drinks"];

  const [searchIndex, setSearchIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSearchIndex((prev) => (prev + 1) % searchSuggestions.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [searchSuggestions.length]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchDefaultAddress = async () => {
      if (isLoggedIn && token) {
        try {
          const res = await fetch(window.API_BASE_URL + "/api/addresses", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.addresses && data.addresses.length > 0) {
              const def = data.addresses.find(a => a.isDefault) || data.addresses[0];
              const addressLineText = def.addressLine + (def.landmark ? `, ${def.landmark}` : "");
              localStorage.setItem("userLocation", addressLineText);
              localStorage.setItem("roomNumber", def.roomNumber || "");
              localStorage.setItem("buyto_selected_address_id", def._id);
              setUserLocation(addressLineText);
              setRoomNumber(def.roomNumber || "");
            }
          }
        } catch (e) {
          console.error("Error fetching default address on mount:", e);
        }
      } else {
        const guestAddresses = localStorage.getItem("buyto_guest_addresses");
        if (guestAddresses) {
          try {
            const parsed = JSON.parse(guestAddresses);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const def = parsed.find(a => a.isDefault) || parsed[0];
              const addressLineText = def.addressLine + (def.landmark ? `, ${def.landmark}` : "");
              localStorage.setItem("userLocation", addressLineText);
              localStorage.setItem("roomNumber", def.roomNumber || "");
              localStorage.setItem("buyto_selected_address_id", def._id);
              setUserLocation(addressLineText);
              setRoomNumber(def.roomNumber || "");
            }
          } catch (e) {}
        }
      }
    };
    fetchDefaultAddress();
  }, [isLoggedIn, token]);

  useEffect(() => {
    if (windowWidth < 768 && !location.search.includes("tab=search") && searchQuery !== "") {
      setSearchQuery("");
    }
  }, [location.pathname, location.search, windowWidth]);

  useEffect(() => {
    console.log("=== API FETCH INITIATED ===", window.API_BASE_URL + "/api/products");
    cachedFetch(window.API_BASE_URL + "/api/products")
      .then((data) => {
        console.log("=== API FETCH SUCCESS ===", data.length, "products loaded");
        const preClassified = (data || []).map(p => ({
          ...p,
          _classifiedCategory: canonicalCategory(classifyProduct(p))
        }));
        setProducts(preClassified);
        setApiError(null);
        setLoading(false);
        if (onReady) onReady();
      })
      .catch((err) => {
        console.error("=== API FETCH FAILED ===", err);
        setApiError(`Failed to load products: ${err.message}. Resolved URL: ${window.API_BASE_URL}/api/products`);
        setLoading(false);
        if (onReady) onReady();
      });
  }, [onReady]);

  useEffect(() => {
    const detectOverflow = () => {
      const elements = document.querySelectorAll('*');
      elements.forEach((el) => {
        if (el.scrollWidth > window.innerWidth) {
          console.warn(
            "⚠️ OVERFLOW OFFENDER:", 
            el.tagName, 
            el.className ? `.${el.className.split(' ').join('.')}` : '', 
            el.id ? `#${el.id}` : '',
            `(${el.scrollWidth}px > ${window.innerWidth}px)`
          );
        }
      });
    };
    const timer = setTimeout(detectOverflow, 2000);
    window.addEventListener("resize", detectOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", detectOverflow);
    };
  }, []);

  // Helper to generate cart keys
  const getCartKey = (product) => {
    const suffix = product.selectedWeight ? `_${product.selectedWeight}` : "";
    return `${product._id || product.id}${suffix}`;
  };

  const getProductId = (product) => {
    return String(product._id || product.id);
  };

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const productId = getProductId(product);

      const existingItem = prevItems.find(
        (item) => getProductId(item) === productId
      );

      if (existingItem) {
        return prevItems.map((item) =>
          getProductId(item) === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prevItems,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (product) => {
    setCartItems((prevItems) => {
      const productId = getProductId(product);

      const existingItem = prevItems.find(
        (item) => getProductId(item) === productId
      );

      if (!existingItem) return prevItems;

      if (existingItem.quantity === 1) {
        return prevItems.filter(
          (item) => getProductId(item) !== productId
        );
      }

      return prevItems.map((item) =>
        getProductId(item) === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  const setCart = (val) => {
    if (typeof val === "function") {
      setCartItems((prevItems) => {
        const prevCart = prevItems.reduce((acc, item) => {
          const key = item._id || item.id;
          const suffix = item.selectedWeight ? `_${item.selectedWeight}` : "";
          const cartKey = `${key}${suffix}`;
          acc[cartKey] = { product: item, quantity: item.quantity };
          return acc;
        }, {});
        const updatedCart = val(prevCart);
        if (!updatedCart || Object.keys(updatedCart).length === 0) return [];
        return Object.values(updatedCart).map(item => ({
          ...item.product,
          quantity: item.quantity
        }));
      });
    } else {
      if (!val || Object.keys(val).length === 0) {
        setCartItems([]);
      } else {
        const items = Object.values(val).map(item => ({
          ...item.product,
          quantity: item.quantity
        }));
        setCartItems(items);
      }
    }
  };

  // Helper calculations for cart summary
  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = Object.values(cart).reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  // Dynamic enrichment for product details page
  const enrichProduct = (product) => {
    if (!product) return null;
    const defaults = {
      description: "Fresh and premium quality, sourced directly from trusted local farms. Rich in essential vitamins and nutrients for a healthy lifestyle.",
      nutrition: {
        "Energy": "45 kcal",
        "Carbs": "10g",
        "Proteins": "1g",
        "Fats": "0.2g"
      },
      highlights: ["Sourced Locally", "Premium Grade", "Freshly Packed", "100% Organic"]
    };

    if (product.category === "The Fruit Store") {
      return {
        ...product,
        description: "Sweet, juicy, and packed with essential vitamins. Perfect for fresh fruit bowls, smoothies, salads, or a healthy natural snack anytime of the day.",
        nutrition: {
          "Energy": "60 kcal",
          "Vitamin C": "45%",
          "Carbs": "14g",
          "Fiber": "2.4g"
        },
        highlights: ["Naturally Sweet", "High in Fiber", "Rich in Vitamin C", "No Additives"]
      };
    } else if (product.category === "The Veggie Store") {
      return {
        ...product,
        description: "Crisp, premium, and nutrient-dense farm veggies. Harvested at the peak of freshness, clean-washed, and graded for optimal culinary experience.",
        nutrition: {
          "Energy": "25 kcal",
          "Iron": "12%",
          "Carbs": "5g",
          "Vitamin A": "15%"
        },
        highlights: ["Farm Fresh", "Pesticide-Free", "Rich in Antioxidants", "Triple Washed"]
      };
    } else if (product.category === "Dairy, Bread & Eggs") {
      return {
        ...product,
        description: "Freshly sourced, rich in proteins and calcium. Handled with extreme hygiene standards and delivered using strict cold-chain refrigeration.",
        nutrition: {
          "Energy": "120 kcal",
          "Protein": "6g",
          "Calcium": "20%",
          "Healthy Fats": "5g"
        },
        highlights: ["Freshly Sourced", "High Protein", "Cold Chain Standard", "Quality Audited"]
      };
    }

    return { ...defaults, ...product };
  };

  const openProduct = (productId) => {
    setSelectedProductId(productId);
    setSelectedVariantIndex(0);
  };

  const activeProduct = enrichProduct(products.find(p => p._id === selectedProductId));

  // Similar Products Filter (same category, excluding current product)
  const similarProducts = activeProduct
    ? products.filter(p => p.category === activeProduct.category && p._id !== activeProduct._id).slice(0, 4)
    : [];

  const normalizeCategoryName = (cat) => {
    if (!cat) return "";
    return cat.toLowerCase()
      .replace(/&/g, "and")
      .replace(/,/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const getCategoryMatch = (productCategory, targetCategory) => {
    if (!productCategory || !targetCategory) return false;
    const normProd = normalizeCategoryName(productCategory);
    const normTarget = normalizeCategoryName(targetCategory);

    const stripS = (str) => str.endsWith("s") ? str.slice(0, -1) : str;
    const prodSingular = stripS(normProd);
    const targetSingular = stripS(normTarget);

    return normProd === normTarget ||
      prodSingular === targetSingular ||
      normProd.includes(targetSingular) ||
      normTarget.includes(prodSingular);
  };

  // Filter products based on search query and category (Optimized with useMemo)
  const filteredProducts = React.useMemo(() => {
    return products.filter((product) => {
      if (!product) return false;
      const classified = product._classifiedCategory || canonicalCategory(classifyProduct(product));
      const matchesCategory = selectedCategory === "All" ||
        searchQuery.trim() !== "" ||
        classified === canonicalCategory(selectedCategory) ||
        getCategoryMatch(product.category, selectedCategory);

      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesSearch =
        (product.name && product.name.toLowerCase().includes(query)) ||
        (product.brand && product.brand.toLowerCase().includes(query)) ||
        (product.category && product.category.toLowerCase().includes(query)) ||
        (product.subCategory && product.subCategory.toLowerCase().includes(query)) ||
        (product.subcategory && product.subcategory.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (product.weight && product.weight.toLowerCase().includes(query)) ||
        (Array.isArray(product.tags) && product.tags.some(tag => tag && tag.toLowerCase().includes(query)));

      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  // Derive autocomplete suggestions from matching products
  const suggestions = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];

    return products.filter((product) => {
      if (!product) return false;
      return (
        (product.name && product.name.toLowerCase().includes(query)) ||
        (product.brand && product.brand.toLowerCase().includes(query)) ||
        (product.category && product.category.toLowerCase().includes(query)) ||
        (product.subCategory && product.subCategory.toLowerCase().includes(query)) ||
        (product.subcategory && product.subcategory.toLowerCase().includes(query)) ||
        (Array.isArray(product.tags) && product.tags.some(tag => tag && tag.toLowerCase().includes(query)))
      );
    }).slice(0, 8);
  }, [products, searchQuery]);

  // Group products into lists by category for the "All" view with section headings (Optimized via single useMemo)
  const {
    trendingProducts,
    fruitProducts,
    veggieProducts,
    dairyProducts,
    meatProducts,
    snackProducts,
    beverageProducts,
    groceryProducts,
    exclusiveDeals,
    mosquitoProducts,
    breadProducts,
    pickleProducts,
    wellnessProducts,
    electronicsProducts
  } = React.useMemo(() => {
    const fruits = [];
    const veggies = [];
    const dairy = [];
    const meat = [];
    const snacks = [];
    const beverages = [];
    const grocery = [];
    const electronics = [];

    filteredProducts.forEach(p => {
      const canon = p._classifiedCategory || canonicalCategory(classifyProduct(p));
      if (canon === "Fresh Fruits") fruits.push(p);
      else if (canon === "Fresh Vegetables") veggies.push(p);
      else if (canon === "Dairy, Bread & Eggs") dairy.push(p);
      else if (canon === "Meat & Seafood") meat.push(p);
      else if (canon === "Chips & Namkeens") snacks.push(p);
      else if (canon === "Cold Drinks & Juices") beverages.push(p);
      else if (canon === "Atta, Rice and Dal") grocery.push(p);
      else if (canon === "Mobiles & Electronics") electronics.push(p);
    });

    const exclusive = [];
    const mosquito = [];
    const bread = [];
    const pickle = [];
    const wellness = [];
    const trending = [];

    products.forEach(p => {
      if (p.isTrending) trending.push(p);
      const canon = p._classifiedCategory || canonicalCategory(classifyProduct(p));
      if (canon === "Exclusive Deals") exclusive.push(p);
      else if (canon === "Cleaning Essentials") mosquito.push(p);
      else if (canon === "The Bread Store") bread.push(p);
      else if (canon === "Premium Pickles") pickle.push(p);
      else if (canon === "Sexual Wellness") wellness.push(p);
    });

    return {
      trendingProducts: trending,
      fruitProducts: fruits,
      veggieProducts: veggies,
      dairyProducts: dairy,
      meatProducts: meat,
      snackProducts: snacks,
      beverageProducts: beverages,
      groceryProducts: grocery,
      exclusiveDeals: exclusive,
      mosquitoProducts: mosquito,
      breadProducts: bread,
      pickleProducts: pickle,
      wellnessProducts: wellness,
      electronicsProducts: electronics
    };
  }, [products, filteredProducts]);

  const sections = [
    {
      title: "Exclusive Deals For You",
      emoji: "🔥",
      products: exclusiveDeals,
    },
    {
      title: "No more mosquitoes!",
      subtitle: "Insect repellents, sprays and more.",
      emoji: "🦟",
      products: mosquitoProducts,
    },
    {
      title: "The Bread Store",
      subtitle: "With butter, cheese and more",
      emoji: "🍞",
      products: breadProducts,
    },
    {
      title: "Premium Pickles",
      subtitle: "Take your meals to a new level",
      emoji: "🥒",
      products: pickleProducts,
    },
    {
      title: "Sexual wellness",
      subtitle: "Condoms, lubricants and more",
      emoji: "❤️",
      products: wellnessProducts,
    },
  ];

  const recommendedList = useMemo(() => {
    if (!products || products.length === 0) return [];
    const lastRenderedProducts = wellnessProducts.length > 0 ? wellnessProducts : (pickleProducts.length > 0 ? pickleProducts : breadProducts);
    const excludeIds = new Set(lastRenderedProducts.map(p => p._id || p.id));
    const pool = products.filter(p => !excludeIds.has(p._id || p.id));
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 16);
  }, [products, wellnessProducts, pickleProducts, breadProducts]);

  const trendingList = useMemo(() => {
    if (!products || products.length === 0) return [];
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 16);
  }, [products]);

  const bestDealsList = useMemo(() => {
    if (!products || products.length === 0) return [];
    const getDiscountPercent = (product) => {
      let price = product.price || 0;
      let originalPrice = product.originalPrice || price;
      if (product.variants && product.variants.length > 0) {
        const firstVariant = product.variants[0];
        price = firstVariant.price || price;
        originalPrice = firstVariant.originalPrice || originalPrice;
      }
      if (originalPrice > price && originalPrice > 0) {
        return ((originalPrice - price) / originalPrice) * 100;
      }
      return 0;
    };
    const deals = products
      .map(p => ({ product: p, discount: getDiscountPercent(p) }))
      .filter(item => item.discount > 0)
      .sort((a, b) => b.discount - a.discount)
      .map(item => item.product);
    if (deals.length === 0) {
      return [...products].sort(() => 0.5 - Math.random()).slice(0, 16);
    }
    return deals.slice(0, 16);
  }, [products]);

  console.log("sections:", sections);
  console.log("wellnessProducts:", wellnessProducts);
  console.log("SECTIONS LENGTH:", sections.length);
  console.log(sections);
  console.log("exclusiveDeals:", exclusiveDeals);
  console.log("mosquitoProducts:", mosquitoProducts);
  console.log("breadProducts:", breadProducts);
  console.log("pickleProducts:", pickleProducts);
  console.log("wellnessProducts array:", wellnessProducts);

  const renderProductCard = (product) => (
    <ProductCard
      key={product._id}
      product={product}
      openProduct={openProduct}
      setSelectedProduct={setSelectedProduct}
      addToCart={addToCart}
      removeFromCart={removeFromCart}
      cart={cart}
      cartItems={cartItems}
      windowWidth={windowWidth}
      getCartKey={getCartKey}
    />
  );

  const computedCartItems = Object.values(cart).map(item => {
    const variant = item.product.variants?.find(v => v.weight === item.product.selectedWeight);
    const originalPrice = variant ? variant.originalPrice : (item.product.originalPrice || item.product.price);
    return {
      ...item.product,
      id: getCartKey(item.product),
      name: item.product.name,
      weight: item.product.selectedWeight || item.product.weight,
      price: item.product.price,
      image: item.product.image,
      quantity: item.quantity,
      originalPrice: originalPrice,
    };
  });

  const increaseQty = (id) => {
    const item = cart[id];
    if (item) {
      addToCart(item.product);
    }
  };

  const decreaseQty = (id) => {
    const item = cart[id];
    if (item) {
      removeFromCart(item.product);
    }
  };

  const removeFromCartCompletely = (id) => {
    setCartItems((prevItems) => {
      return prevItems.filter((item) => {
        const key = item._id || item.id;
        const suffix = item.selectedWeight ? `_${item.selectedWeight}` : "";
        const cartKey = `${key}${suffix}`;
        return cartKey !== id;
      });
    });
  };

  const getAppBackground = () => {
    const path = location.pathname;
    if (
      path === "/cart" ||
      path === "/details" ||
      path === "/payment" ||
      path.startsWith("/track-order/") ||
      path === "/success" ||
      path === "/order-success"
    ) {
      return "#ffffff";
    }
    return "linear-gradient(180deg, rgba(46, 125, 50, 0.08) 0%, rgba(76, 175, 80, 0.04) 15%, rgba(245, 255, 245, 0.55) 50%, #ffffff 100%)";
  };

  if (location.pathname === "/admin") {
    return (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    );
  }

  if (location.pathname === "/admin/orders") {
    return (
      <AdminRoute>
        <AdminOrdersPage />
      </AdminRoute>
    );
  }

  if (location.pathname === "/admin/products") {
    return (
      <AdminRoute>
        <AdminProductsPage />
      </AdminRoute>
    );
  }

  if (location.pathname === "/admin/riders") {
    return (
      <AdminRoute>
        <AdminRidersPage />
      </AdminRoute>
    );
  }

  if (location.pathname === "/admin/support") {
    return (
      <AdminRoute>
        <AdminSupportPage />
      </AdminRoute>
    );
  }

  if (location.pathname === "/rider/login") {
    return <RiderLogin />;
  }

  if (location.pathname === "/rider/signup") {
    return <RiderSignup />;
  }

  if (location.pathname === "/rider/dashboard" || location.pathname === "/rider/orders") {
    return (
      <RiderProtectedRoute>
        <RiderDashboard />
      </RiderProtectedRoute>
    );
  }

  if (location.pathname === "/login") {
    return <LoginPage />;
  }

  if (location.pathname === "/signup") {
    return <SignupPage />;
  }

  if (location.pathname === "/details") {
    return <UserDetails />;
  }

  if (location.pathname === "/payment") {
    const el = (
      <ProtectedRoute>
        <PaymentPage
          cart={cart}
          setCart={setCart}
          activeCoupons={activeCoupons}
          selectedCoupon={selectedCoupon}
          setSelectedCoupon={handleSetSelectedCoupon}
        />
      </ProtectedRoute>
    );
    if (windowWidth < 768) {
      return (
        <div style={{ minHeight: "100vh", paddingBottom: `${MOBILE_NAV_TOTAL_OFFSET}px` }}>
          {el}
          <MobileBottomNavigation />
        </div>
      );
    }
    return el;
  }

  if (location.pathname.startsWith("/track-order/")) {
    const orderId = location.pathname.split("/track-order/")[1];
    return (
      <ProtectedRoute>
        <OrderTrackingPage orderId={orderId} />
      </ProtectedRoute>
    );
  }

  if (location.pathname === "/success") {
    const el = (
      <ProtectedRoute>
        <SuccessPage />
      </ProtectedRoute>
    );
    if (windowWidth < 768) {
      return (
        <div style={{ minHeight: "100vh" }}>
          {el}
        </div>
      );
    }
    return el;
  }

  if (location.pathname === "/profile" || location.pathname === "/my-orders") {
    const el = (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    );
    if (windowWidth < 768) {
      return (
        <div style={{ minHeight: "100vh", paddingBottom: `${MOBILE_NAV_TOTAL_OFFSET}px` }}>
          {el}
          <MobileBottomNavigation />
        </div>
      );
    }
    return el;
  }

  if (location.pathname === "/categories") {
    const el = <CategoriesPage />;
    if (windowWidth < 768) {
      return (
        <div style={{ minHeight: "100vh", paddingBottom: `${MOBILE_NAV_TOTAL_OFFSET}px` }}>
          {el}
          <MobileBottomNavigation />
        </div>
      );
    }
    return el;
  }

  if (location.pathname === "/help") {
    const el = <HelpPage />;
    if (windowWidth < 768) {
      return (
        <div style={{ minHeight: "100vh", paddingBottom: `${MOBILE_NAV_TOTAL_OFFSET}px` }}>
          {el}
          <MobileBottomNavigation />
        </div>
      );
    }
    return el;
  }

  if (location.pathname === "/support/chat") {
    const el = (
      <ProtectedRoute>
        <SupportChatPage />
      </ProtectedRoute>
    );
    if (windowWidth < 768) {
      return (
        <div style={{ minHeight: "100vh", paddingBottom: `${MOBILE_NAV_TOTAL_OFFSET}px` }}>
          {el}
          <MobileBottomNavigation />
        </div>
      );
    }
    return el;
  }

  if (location.pathname.startsWith("/section/")) {
    const el = (
      <SectionProductsPage
        cart={cart}
        setCart={setCart}
        cartItems={cartItems}
        setCartItems={setCartItems}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
      />
    );
    if (windowWidth < 768) {
      return (
        <div style={{ minHeight: "100vh", paddingBottom: `${MOBILE_NAV_TOTAL_OFFSET}px` }}>
          {el}
          <MobileBottomNavigation />
        </div>
      );
    }
    return el;
  }

  if (location.pathname === "/shopping-list") {
    const el = (
      <ShoppingListPage
        products={products}
        token={token}
        isLoggedIn={isLoggedIn}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        cartItems={cartItems}
        setCartItems={setCartItems}
      />
    );
    if (windowWidth < 768) {
      return (
        <div style={{ minHeight: "100vh", paddingBottom: `${MOBILE_NAV_TOTAL_OFFSET}px` }}>
          {el}
          <MobileBottomNavigation />
        </div>
      );
    }
    return el;
  }

  if (location.pathname === "/shopping-list/results") {
    const el = (
      <ShoppingListResultsPage
        products={products}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        cartItems={cartItems}
        setCartItems={setCartItems}
        cart={cart}
        setCart={setCart}
      />
    );
    if (windowWidth < 768) {
      return (
        <div style={{ minHeight: "100vh", paddingBottom: `${MOBILE_NAV_TOTAL_OFFSET}px` }}>
          {el}
          <MobileBottomNavigation />
        </div>
      );
    }
    return el;
  }

  if (location.pathname === "/shopping-list/smart-matching") {
    const el = (
      <SmartMatchingPage
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        cartItems={cartItems}
        setCartItems={setCartItems}
      />
    );
    if (windowWidth < 768) {
      return (
        <div style={{ minHeight: "100vh", paddingBottom: `${MOBILE_NAV_TOTAL_OFFSET}px` }}>
          {el}
          <MobileBottomNavigation />
        </div>
      );
    }
    return el;
  }

  if (location.pathname === "/save-for-later") {
    const el = (
      <SaveForLaterPage
        products={products}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        cart={cart}
        cartItems={cartItems}
        windowWidth={windowWidth}
        getCartKey={getCartKey}
        setSelectedProduct={setSelectedProduct}
      />
    );
    if (windowWidth < 768) {
      return (
        <div style={{ minHeight: "100vh", paddingBottom: `${MOBILE_NAV_TOTAL_OFFSET}px` }}>
          {el}
          <MobileBottomNavigation />
        </div>
      );
    }
    return el;
  }

  if (location.pathname === "/saved-lists") {
    const el = (
      <ProtectedRoute>
        <SavedListsPage />
      </ProtectedRoute>
    );
    if (windowWidth < 768) {
      return (
        <div style={{ minHeight: "100vh", paddingBottom: `${MOBILE_NAV_TOTAL_OFFSET}px` }}>
          {el}
          <MobileBottomNavigation />
        </div>
      );
    }
    return el;
  }

  if (location.pathname === "/cart") {
    const el = (
      <CartPage
        cartItems={computedCartItems}
        increaseQty={increaseQty}
        decreaseQty={decreaseQty}
        removeFromCart={removeFromCart}
        removeFromCartCompletely={removeFromCartCompletely}
        isLoggedIn={isLoggedIn}
        activeCoupons={activeCoupons}
        selectedCoupon={selectedCoupon}
        setSelectedCoupon={handleSetSelectedCoupon}
        products={products}
        cart={cart}
        addToCart={addToCart}
      />
    );
    if (windowWidth < 768) {
      return (
        <div style={{ minHeight: "100vh", paddingBottom: `${MOBILE_NAV_TOTAL_OFFSET}px` }}>
          {el}
          <MobileBottomNavigation />
        </div>
      );
    }
    return el;
  }

  if (windowWidth < 768) {
    return (
      <div style={{ background: getAppBackground(), minHeight: "100vh", fontFamily: "'Outfit', 'Inter', sans-serif", width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
        <Routes>
          <Route
            path="/category/:slug"
            element={
              <div style={{ paddingBottom: `${MOBILE_NAV_TOTAL_OFFSET}px` }}>
                <div style={{ position: "sticky", top: 0, zIndex: 1000, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", background: "white", padding: "10px 16px", width: "100%", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}>
                  <CategoryStrip
                    displayCats={memoizedDisplayCats}
                    selectedCategory={selectedCategory}
                    onCategoryClick={handleCategoryClick}
                  />
                </div>
                <div style={{ padding: "12px" }}>
                  <CategoryProductsPage
                    products={products}
                    categories={displayCats}
                    addToCart={addToCart}
                    removeFromCart={removeFromCart}
                    cart={cart}
                    cartItems={cartItems}
                    windowWidth={windowWidth}
                    getCartKey={getCartKey}
                    setSelectedProduct={setSelectedProduct}
                    loading={loading}
                  />
                </div>
                <MobileBottomNavigation />
              </div>
            }
          />
          <Route
            path="/product/:id"
            element={
              <div style={{ paddingBottom: `${MOBILE_NAV_TOTAL_OFFSET}px` }}>
                <ProductDetailsPage
                  products={products}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  cart={cart}
                  cartItems={cartItems}
                  windowWidth={windowWidth}
                  getCartKey={getCartKey}
                  setSelectedProduct={setSelectedProduct}
                />
                <MobileBottomNavigation />
              </div>
            }
          />
          <Route
            path="*"
            element={
              <>
                <MobileHome
                  products={products}
                  filteredProducts={filteredProducts}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  cartItems={cartItems}
                  setSelectedProduct={setSelectedProduct}
                  userLocation={userLocation}
                  roomNumber={roomNumber}
                  totalItems={totalItems}
                  isLoggedIn={isLoggedIn}
                  onOpenAddressModal={() => setShowAddressModal(true)}
                  displayCats={memoizedDisplayCats}
                  selectedCategory={selectedCategory}
                  onCategoryClick={handleCategoryClick}
                />
                <MobileBottomNavigation />
              </>
            }
          />
        </Routes>

        {/* Floating premium cart banner (visible on mobile home/product pages when cart has items) */}
        {totalItems > 0 && location.pathname !== "/cart" && (
          <div
            onClick={() => navigate("/cart")}
            style={{
              background: totalPrice >= FREE_DELIVERY_THRESHOLD ? "#16a34a" : "#318616",
              color: "white",
              padding: "12px 16px",
              position: "fixed",
              bottom: `${MOBILE_NAV_TOTAL_OFFSET}px`, // Sits right above bottom navigation
              left: "0",
              right: "0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 -4px 12px rgba(0,0,0,0.1)",
              zIndex: 999,
              boxSizing: "border-box",
            }}
          >
            <div>
              {totalPrice < FREE_DELIVERY_THRESHOLD ? (
                <p style={{ fontWeight: "600", margin: 0, fontSize: "12px" }}>
                  Add ₹{FREE_DELIVERY_THRESHOLD - totalPrice} more for FREE delivery 🚚
                </p>
              ) : (
                <p style={{ color: "#bbf7d0", fontWeight: "700", margin: 0, fontSize: "12px" }}>
                  FREE Delivery Unlocked 🎉
                </p>
              )}
              <p style={{ opacity: 0.9, margin: "2px 0 0 0", fontSize: "11px" }}>
                Buyto Instant Delivery
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>₹{totalPrice}</h2>
              <span style={{ fontWeight: "700", fontSize: "12px", background: "white", color: "#318616", padding: "6px 12px", borderRadius: "8px" }}>
                View Cart
              </span>
            </div>
          </div>
        )}

        {/* GLOBAL COUPON CELEBRATION MODAL */}
        {appliedCouponCelebration && (
          <CouponCelebrationModal
            coupon={appliedCouponCelebration}
            onClose={() => setAppliedCouponCelebration(null)}
          />
        )}

        {/* LAZY LOADED ADDRESS SELECTOR MODAL */}
        {showAddressModal && (
          <Suspense fallback={null}>
            <AddressSelectorModal
              isLoggedIn={isLoggedIn}
              onClose={() => setShowAddressModal(false)}
              onSelectAddress={(addr) => {
                const addressLineText = addr.addressLine + (addr.landmark ? `, ${addr.landmark}` : "");
                localStorage.setItem("userLocation", addressLineText);
                localStorage.setItem("roomNumber", addr.roomNumber || "");
                localStorage.setItem("buyto_selected_address_id", addr._id);
                setUserLocation(addressLineText);
                setRoomNumber(addr.roomNumber || "");
                setShowAddressModal(false);
              }}
            />
          </Suspense>
        )}
      </div>
    );
  }

  return (

    <div style={{ background: getAppBackground(), minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Hide Scrollbars Global CSS injection */}
      <style>{`
        ::-webkit-scrollbar {
          display: none !important;
        }
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .search-slide {
          position: absolute;
          width: 100%;
          animation: slideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          color: #9ca3af;
          font-family: inherit;
          white-space: nowrap;
        }
        @keyframes slideUp {
          0% {
            opacity: 0;
            transform: translateY(70%);
          }
          100% {
            opacity: 1;
            transform: translateY(0%);
          }
        }
      `}</style>

      <Header
        userLocation={userLocation}
        roomNumber={roomNumber}
        totalItems={totalItems}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isLoggedIn={isLoggedIn}
        onOpenAddressModal={() => setShowAddressModal(true)}
        eta={7}
        displayCats={memoizedDisplayCats}
        selectedCategory={selectedCategory}
        onCategoryClick={handleCategoryClick}
      />

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: windowWidth < 768 ? "12px" : "24px", paddingBottom: "100px" }}>

        <Routes>
          <Route
            path="/category/:slug"
            element={
              <CategoryProductsPage
                products={products}
                categories={displayCats}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                cartItems={cartItems}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                setSelectedProduct={setSelectedProduct}
                loading={loading}
              />
            }
          />
          <Route
            path="/product/:id"
            element={
              <ProductDetailsPage
                products={products}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                cartItems={cartItems}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                setSelectedProduct={setSelectedProduct}
              />
            }
          />
          <Route
            path="*"
            element={
              <div>
                {loading ? (
                  <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#4b5563", marginTop: "40px" }}>
                    Loading Products...
                  </h2>
                ) : (
                  /* PRODUCT CATALOG PAGE */
                  <div>
                    {apiError && (
                      <div
                        style={{
                          background: "#fef2f2",
                          border: "1px solid #fee2e2",
                          borderRadius: "16px",
                          padding: "16px",
                          color: "#991b1b",
                          marginBottom: "24px",
                          textAlign: "left",
                          fontFamily: "'Outfit', 'Inter', sans-serif"
                        }}
                      >
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>⚠️</span> Connection Error
                        </h3>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "500", opacity: 0.9 }}>
                          {apiError}
                        </p>
                      </div>
                    )}
                    {!searchQuery ? (
                      <div>
                        <TrendingThisWeek />
                        <div style={{ padding: "0 4px" }}>
                          <MobileBannerCarousel />
                        </div>
                        <CategoryDiscovery products={products} />
                        <div id="product-listings-anchor" style={{ height: "1px", margin: "16px 0" }} />

                        {trendingProducts.length > 0 && (
                          <HorizontalProductSection
                            title="Trending Near You"
                            emoji="⚡"
                            products={trendingProducts.slice(0, 6)}
                            onShowAll={() => navigate("/section/trending")}
                            openProduct={openProduct}
                            setSelectedProduct={setSelectedProduct}
                            addToCart={addToCart}
                            removeFromCart={removeFromCart}
                            cart={cart}
                            windowWidth={windowWidth}
                            getCartKey={getCartKey}
                          />
                        )}

                        {fruitProducts.length > 0 && (
                          <div id="fresh-fruits" style={{ scrollMarginTop: "140px" }}>
                            <HorizontalProductSection
                              title="Fresh Fruits"
                              emoji="🍎"
                              products={fruitProducts.slice(0, 6)}
                              onShowAll={() => navigate("/category/fresh-fruits")}
                              openProduct={openProduct}
                              setSelectedProduct={setSelectedProduct}
                              addToCart={addToCart}
                              removeFromCart={removeFromCart}
                              cart={cart}
                              windowWidth={windowWidth}
                              getCartKey={getCartKey}
                            />
                          </div>
                        )}

                        {veggieProducts.length > 0 && (
                          <div id="fresh-vegetables" style={{ scrollMarginTop: "140px" }}>
                            <HorizontalProductSection
                              title="Fresh Vegetables"
                              emoji="🥦"
                              products={veggieProducts}
                              onShowAll={() => navigate("/category/fresh-vegetables")}
                              openProduct={openProduct}
                              setSelectedProduct={setSelectedProduct}
                              addToCart={addToCart}
                              removeFromCart={removeFromCart}
                              cart={cart}
                              windowWidth={windowWidth}
                              getCartKey={getCartKey}
                            />
                          </div>
                        )}

                        {dairyProducts.length > 0 && (
                          <div id="dairy-bread-eggs" style={{ scrollMarginTop: "140px" }}>
                            <HorizontalProductSection
                              title="Dairy, Bread & Eggs"
                              emoji="🥛"
                              products={dairyProducts.slice(0, 6)}
                              onShowAll={() => navigate("/category/dairy-bread-eggs")}
                              openProduct={openProduct}
                              setSelectedProduct={setSelectedProduct}
                              addToCart={addToCart}
                              removeFromCart={removeFromCart}
                              cart={cart}
                              windowWidth={windowWidth}
                              getCartKey={getCartKey}
                            />
                          </div>
                        )}

                        {meatProducts.length > 0 && (
                          <div id="meat-seafood" style={{ scrollMarginTop: "140px" }}>
                            <HorizontalProductSection
                              title="Meat & Seafood"
                              emoji="🥩"
                              products={meatProducts.slice(0, 6)}
                              onShowAll={() => navigate("/category/meat-and-seafood")}
                              openProduct={openProduct}
                              setSelectedProduct={setSelectedProduct}
                              addToCart={addToCart}
                              removeFromCart={removeFromCart}
                              cart={cart}
                              windowWidth={windowWidth}
                              getCartKey={getCartKey}
                            />
                          </div>
                        )}

                        {snackProducts.length > 0 && (
                          <div id="snacks" style={{ scrollMarginTop: "140px" }}>
                            <HorizontalProductSection
                              title="Snacks & Munchies"
                              emoji="🍟"
                              products={snackProducts.slice(0, 6)}
                              onShowAll={() => navigate("/category/chips-namkeens")}
                              openProduct={openProduct}
                              setSelectedProduct={setSelectedProduct}
                              addToCart={addToCart}
                              removeFromCart={removeFromCart}
                              cart={cart}
                              windowWidth={windowWidth}
                              getCartKey={getCartKey}
                            />
                          </div>
                        )}

                        {beverageProducts.length > 0 && (
                          <div id="cold-drinks-juices" style={{ scrollMarginTop: "140px" }}>
                            <HorizontalProductSection
                              title="Cold Drinks & Beverages"
                              emoji="🥤"
                              products={beverageProducts.slice(0, 6)}
                              onShowAll={() => navigate("/category/cold-drinks-juices")}
                              openProduct={openProduct}
                              setSelectedProduct={setSelectedProduct}
                              addToCart={addToCart}
                              removeFromCart={removeFromCart}
                              cart={cart}
                              windowWidth={windowWidth}
                              getCartKey={getCartKey}
                            />
                          </div>
                        )}

                        {groceryProducts.length > 0 && (
                          <div id="atta-rice-and-dal" style={{ scrollMarginTop: "140px" }}>
                            <HorizontalProductSection
                              title="Atta, Rice & Dal"
                              emoji="🌾"
                              products={groceryProducts.slice(0, 6)}
                              onShowAll={() => navigate("/category/atta-rice-and-dal")}
                              openProduct={openProduct}
                              setSelectedProduct={setSelectedProduct}
                              addToCart={addToCart}
                              removeFromCart={removeFromCart}
                              cart={cart}
                              windowWidth={windowWidth}
                              getCartKey={getCartKey}
                            />
                          </div>
                        )}

                        {electronicsProducts.length > 0 && (
                          <div id="mobiles-electronics" style={{ scrollMarginTop: "140px" }}>
                            <HorizontalProductSection
                              title="Mobiles & Electronics"
                              emoji="💻"
                              products={electronicsProducts.slice(0, 6)}
                              onShowAll={() => navigate("/category/mobiles-electronics")}
                              openProduct={openProduct}
                              setSelectedProduct={setSelectedProduct}
                              addToCart={addToCart}
                              removeFromCart={removeFromCart}
                              cart={cart}
                              windowWidth={windowWidth}
                              getCartKey={getCartKey}
                            />
                          </div>
                        )}

                        {sections
                          .filter((section) =>
                            section &&
                            section.products &&
                            Array.isArray(section.products) &&
                            section.products.length > 0
                          )
                          .map((section, index) => {
                            console.log("RENDERING:", section.title);
                            const sectionId = getSectionIdForTitle(section.title);

                            return (
                              <div id={sectionId} key={index}>
                                <HorizontalProductSection
                                  title={section.title}
                                  subtitle={section.subtitle}
                                  emoji={section.emoji}
                                  products={section.products || []}
                                  onShowAll={() => {
                                    const getSectionRoute = (title) => {
                                      switch (title) {
                                        case "Exclusive Deals For You": return "/section/exclusive-deals";
                                        case "No more mosquitoes!": return "/section/mosquitoes";
                                        case "The Bread Store": return "/section/bread-store";
                                        case "Premium Pickles": return "/section/pickles";
                                        case "Sexual wellness": return "/section/sexual-wellness";
                                        default: return "";
                                      }
                                    };
                                    navigate(getSectionRoute(section.title));
                                  }}
                                  openProduct={openProduct}
                                  setSelectedProduct={setSelectedProduct}
                                  addToCart={addToCart}
                                  removeFromCart={removeFromCart}
                                  cart={cart}
                                  windowWidth={windowWidth}
                                  getCartKey={getCartKey}
                                />
                              </div>
                            );
                          })
                        }

                        {recommendedList.length > 0 && (
                          <HorizontalProductSection
                            title="Recommended For You"
                            emoji="✨"
                            products={recommendedList}
                            openProduct={openProduct}
                            setSelectedProduct={setSelectedProduct}
                            addToCart={addToCart}
                            removeFromCart={removeFromCart}
                            cart={cart}
                            windowWidth={windowWidth}
                            getCartKey={getCartKey}
                          />
                        )}

                        {trendingList.length > 0 && (
                          <HorizontalProductSection
                            title="Trending Near You"
                            emoji="🔥"
                            products={trendingList}
                            openProduct={openProduct}
                            setSelectedProduct={setSelectedProduct}
                            addToCart={addToCart}
                            removeFromCart={removeFromCart}
                            cart={cart}
                            windowWidth={windowWidth}
                            getCartKey={getCartKey}
                          />
                        )}

                        {bestDealsList.length > 0 && (
                          <HorizontalProductSection
                            title="Best Deals Today"
                            emoji="💸"
                            products={bestDealsList}
                            openProduct={openProduct}
                            setSelectedProduct={setSelectedProduct}
                            addToCart={addToCart}
                            removeFromCart={removeFromCart}
                            cart={cart}
                            windowWidth={windowWidth}
                            getCartKey={getCartKey}
                          />
                        )}

                        <div style={{ textAlign: "center", marginTop: "64px", marginBottom: "40px", padding: "24px 0", borderTop: "1px solid rgba(0,0,0,0.06)", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
                          <p style={{ margin: 0, fontSize: "16px", fontWeight: "750", color: "#1b4314" }}>💚 Thank you for choosing Buyto</p>
                          <p style={{ margin: "4px 0 16px 0", fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>Built by Students, for Students.</p>
                          <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: "transparent", border: "none", color: "#318616", fontWeight: "800", fontSize: "14px", cursor: "pointer" }}>Continue Exploring →</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "16px", color: "#1f2937" }}>
                          {searchQuery ? `Search Results for "${searchQuery}"` : selectedCategory}
                        </h2>
                        {filteredProducts.length === 0 ? (
                          <p style={{ color: "#6b7280", fontSize: "16px", marginTop: "20px" }}>
                            No products found.
                          </p>
                        ) : (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                windowWidth < 768
                                  ? "repeat(2, 1fr)"
                                  : windowWidth < 1024
                                    ? "repeat(4, 1fr)"
                                    : "repeat(6, 1fr)",
                              gap: windowWidth < 768 ? "12px" : "20px",
                            }}
                          >
                            {filteredProducts.map(renderProductCard)}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Floating Premium Cart Summary Banner */}
                    {totalItems > 0 && (
                      <div
                        style={{
                          background: totalPrice >= FREE_DELIVERY_THRESHOLD ? "#16a34a" : "#318616",
                          color: "white",
                          padding: windowWidth < 768 ? "12px 16px" : "16px 24px",
                          borderRadius: windowWidth < 768 ? "0" : "18px",
                          position: "fixed",
                          bottom: windowWidth < 768 ? "64px" : "20px",
                          left: windowWidth < 768 ? "0" : "50%",
                          right: windowWidth < 768 ? "0" : "auto",
                          transform: windowWidth < 768 ? "none" : "translateX(-50%)",
                          width: windowWidth < 768 ? "100%" : "640px",
                          maxWidth: windowWidth < 768 ? "100%" : "calc(100% - 40px)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          boxShadow: windowWidth < 768 ? "0 -4px 12px rgba(0,0,0,0.1)" : "0 10px 30px rgba(0,0,0,0.2)",
                          zIndex: 999,
                          boxSizing: "border-box",
                        }}
                      >
                        <div>
                          {
                            totalPrice < FREE_DELIVERY_THRESHOLD ? (
                              <p style={{ fontWeight: "600", margin: 0 }}>
                                Add ₹{FREE_DELIVERY_THRESHOLD - totalPrice} more to unlock FREE delivery 🚚
                              </p>
                            ) : (
                              <p
                                style={{
                                  color: "#bbf7d0",
                                  fontWeight: "700",
                                  margin: 0
                                }}
                              >
                                FREE Delivery Unlocked 🎉
                              </p>
                            )
                          }

                          <p style={{ opacity: 0.9, margin: "4px 0 0 0", fontSize: "13px" }}>
                            Buyto Instant Delivery
                          </p>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "18px",
                          }}
                        >
                          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "800" }}>₹{totalPrice}</h2>

                          <button
                            onClick={() => navigate("/cart")}
                            onMouseOver={(e) => {
                              e.currentTarget.style.color = totalPrice >= FREE_DELIVERY_THRESHOLD ? "#15803d" : "#286f12";
                              e.currentTarget.style.transform = "scale(1.03)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.color = totalPrice >= FREE_DELIVERY_THRESHOLD ? "#16a34a" : "#318616";
                              e.currentTarget.style.transform = "none";
                            }}
                            style={{
                              background: "white",
                              color: totalPrice >= FREE_DELIVERY_THRESHOLD ? "#16a34a" : "#318616",
                              border: "none",
                              padding: "12px 22px",
                              borderRadius: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                          >
                            View Cart →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            }
          />
        </Routes>
      </main>


      {/* STEP 4 — POPUP SELECTOR FOR MULTI-VARIANT PRODUCTS */}
      {selectedProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            style={{
              width: "500px",
              background: "white",
              borderRadius: "20px",
              padding: "20px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-extrabold text-gray-800 mb-2">
              {selectedProduct.name}
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Select a weight variant to add to your cart:
            </p>

            <div style={{ marginTop: "20px" }}>
              {selectedProduct.variants.map((variant, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "15px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "15px",
                      alignItems: "center",
                    }}
                  >
                    <img
                      src={selectedProduct.image}
                      alt=""
                      style={{
                        width: "70px",
                        height: "70px",
                        objectFit: "cover",
                        borderRadius: "10px",
                      }}
                    />

                    <div>
                      <h3 className="font-extrabold text-gray-800 text-base">
                        {variant.weight}
                      </h3>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "center",
                        }}
                      >
                        <s style={{ color: "gray", fontSize: "14px" }}>
                          ₹{variant.originalPrice}
                        </s>
                        <b className="text-gray-900 text-base">
                          ₹{variant.price}
                        </b>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      addToCart({
                        ...selectedProduct,
                        selectedWeight: variant.weight,
                        price: variant.price,
                      });
                      setSelectedProduct(null);
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#286f12")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "#318616")}
                    style={{
                      background: "#318616",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      transition: "background 0.2s",
                    }}
                  >
                    ADD
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {windowWidth < 768 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "64px",
            background: "white",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            zIndex: 999,
            boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
            paddingBottom: "env(safe-area-inset-bottom)"
          }}
        >
          <div
            onClick={() => { setSelectedCategory("All"); setSelectedProductId(null); navigate("/"); }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: "4px" }}
          >
            <span style={{ fontSize: "20px" }}>🏠</span>
            <span style={{ fontSize: "10px", fontWeight: "700", color: selectedCategory === "All" && location.pathname === "/" ? "#318616" : "#6b7280" }}>Shop</span>
          </div>

          <div
            onClick={() => {
              setSelectedCategory("All"); setSelectedProductId(null); navigate("/");
              setTimeout(() => {
                const el = document.getElementById("product-listings-anchor");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: "4px" }}
          >
            <span style={{ fontSize: "20px" }}>🗂️</span>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "#6b7280" }}>Categories</span>
          </div>

          <div
            onClick={() => navigate("/cart")}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: "4px", position: "relative" }}
          >
            <span style={{ fontSize: "20px" }}>🧺</span>
            {totalItems > 0 && (
              <span style={{
                position: "absolute",
                top: "-4px",
                right: "-6px",
                background: "#ef4444",
                color: "white",
                fontSize: "9px",
                fontWeight: "800",
                borderRadius: "50%",
                width: "16px",
                height: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {totalItems}
              </span>
            )}
            <span style={{ fontSize: "10px", fontWeight: "700", color: location.pathname === "/cart" ? "#318616" : "#6b7280" }}>Cart</span>
          </div>

          <div
            onClick={() => navigate(isLoggedIn ? "/profile" : "/login")}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: "4px" }}
          >
            <span style={{ fontSize: "20px" }}>👤</span>
            <span style={{ fontSize: "10px", fontWeight: "700", color: location.pathname === "/profile" ? "#318616" : "#6b7280" }}>Profile</span>
          </div>

          <div
            onClick={() => navigate(isLoggedIn ? "/support/chat" : "/login")}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: "4px" }}
          >
            <span style={{ fontSize: "20px" }}>🎧</span>
            <span style={{ fontSize: "10px", fontWeight: "700", color: location.pathname === "/support/chat" ? "#318616" : "#6b7280" }}>Support</span>
          </div>
        </div>
      )}

      {/* GLOBAL COUPON CELEBRATION MODAL */}
      {appliedCouponCelebration && (
        <CouponCelebrationModal
          coupon={appliedCouponCelebration}
          onClose={() => setAppliedCouponCelebration(null)}
        />
      )}

      {/* LAZY LOADED ADDRESS SELECTOR MODAL */}
      {showAddressModal && (
        <Suspense fallback={null}>
          <AddressSelectorModal
            isLoggedIn={isLoggedIn}
            onClose={() => setShowAddressModal(false)}
            onSelectAddress={(addr) => {
              const addressLineText = addr.addressLine + (addr.landmark ? `, ${addr.landmark}` : "");
              localStorage.setItem("userLocation", addressLineText);
              localStorage.setItem("roomNumber", addr.roomNumber || "");
              localStorage.setItem("buyto_selected_address_id", addr._id);
              setUserLocation(addressLineText);
              setRoomNumber(addr.roomNumber || "");
              setShowAddressModal(false);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}

function CouponCelebrationModal({ coupon, onClose }) {
  const [fade, setFade] = React.useState(false);

  React.useEffect(() => {
    // Fade in
    setTimeout(() => setFade(true), 50);

    // Auto dismiss after 2.5 seconds
    const timer = setTimeout(() => {
      setFade(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 2500);

    return () => clearTimeout(timer);
  }, [onClose]);

  // Generate some random confetti particles
  const confettiArray = Array.from({ length: 40 });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        opacity: fade ? 1 : 0,
        transition: "opacity 0.3s ease-in-out",
        fontFamily: "'Outfit', 'Inter', sans-serif",
      }}
    >
      {/* Confetti Container */}
      <div style={{ position: "absolute", width: "100%", height: "100%", pointerEvents: "none", overflow: "hidden" }}>
        {confettiArray.map((_, i) => {
          const size = Math.random() * 8 + 6;
          const left = Math.random() * 100;
          const delay = Math.random() * 0.5;
          const colors = ["#22c55e", "#3b82f6", "#eab308", "#ef4444", "#a855f7", "#ec4899"];
          const color = colors[Math.floor(Math.random() * colors.length)];
          const rotation = Math.random() * 360;
          const duration = Math.random() * 1.5 + 1.5;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "-20px",
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                borderRadius: Math.random() > 0.5 ? "50%" : "3px",
                transform: `rotate(${rotation}deg)`,
                opacity: 0.8,
                animation: `confettiFall ${duration}s linear ${delay}s infinite`,
              }}
            />
          );
        })}
      </div>

      {/* Modal Dialog Card */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "28px",
          padding: "36px 40px",
          maxWidth: "400px",
          width: "90%",
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1.5px solid #22c55e",
          transform: fade ? "scale(1)" : "scale(0.85)",
          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Animated Checkmark Badge */}
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            border: "3px solid #22c55e",
            color: "#22c55e",
            fontSize: "36px",
            fontWeight: "900",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            animation: "checkmarkPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
          }}
        >
          ✓
        </div>

        <h2 style={{ margin: "0 0 10px 0", fontSize: "22px", fontWeight: "900", color: "#0f172a" }}>
          🎉 Coupon Applied!
        </h2>
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: "18px",
            fontWeight: "800",
            color: "#22c55e",
            fontFamily: "monospace",
            backgroundColor: "rgba(34, 197, 94, 0.08)",
            padding: "6px 12px",
            borderRadius: "8px",
            display: "inline-block"
          }}
        >
          {coupon.couponCode} Applied
        </h3>
        <p style={{ margin: 0, fontSize: "15px", color: "#64748b", fontWeight: "600" }}>
          You saved <span style={{ color: "#0f172a", fontWeight: "800" }}>₹{coupon.discountAmount}</span> on this order.
        </p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          100% {
            transform: translateY(105vh) rotate(360deg);
          }
        }
        @keyframes checkmarkPop {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}} />
    </div>
  );
}


const menuItemStyle = {
  padding: "16px 18px",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: "500",
  borderBottom: "1px solid #f3f4f6",
  transition: "all 0.15s ease",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  boxSizing: "border-box",
};

export default App;