import React, { useEffect, useState, useContext, useMemo, useRef, useCallback, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useSearchParams, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { initializePushNotifications, retrySyncIfNeeded } from "./services/pushNotifications";
import { BRANDING } from "./config/branding";
import BuytoLogo from "./components/common/BuytoLogo";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import RiderProtectedRoute from "./components/RiderProtectedRoute";
import GTMRouteTracker from "./components/GTMRouteTracker";
import CategoryDiscovery from "./components/CategoryDiscovery";
import { initializeAnalytics, trackPageView } from "./utils/analytics";
import PromoBannerCarousel from "./components/PromoBannerCarousel";
import DynamicNewBanners from "./components/DynamicNewBanners";
import { classifyProduct, canonicalCategory } from "./utils/productClassifier";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { io } from "socket.io-client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Footer from "./components/Footer";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import RefundPolicyPage from "./pages/RefundPolicyPage";
import ShippingPolicyPage from "./pages/ShippingPolicyPage";
import FAQPage from "./pages/FAQPage";
import HorizontalProductSection from "./HorizontalProductSection";
import TrendingThisWeek from "./components/TrendingThisWeek";
import MobileBannerCarousel from "./components/mobile/MobileBannerCarousel";
import Header, { CategoryStrip } from "./components/common/Header";
import { useHeaderTheme } from "./hooks/useHeaderTheme";

import ProductCard from "./ProductCard";
import OtpLoginBottomSheet from "./components/common/OtpLoginBottomSheet";
import OnboardingBottomSheet from "./components/common/OnboardingBottomSheet";
import WelcomeRewardModal from "./components/common/WelcomeRewardModal";
import ForegroundNotificationBanner from "./components/common/ForegroundNotificationBanner";
import { LoaderProvider } from "./context/LoaderContext";
import BuytoLoader from "./components/common/BuytoLoader";
import SearchResultsView from "./components/SearchResultsView";
import SEO from "./components/common/SEO";
import OfflineScreen from "./components/common/OfflineScreen";

// Lazy-loaded components & pages
const AddressSelectorModal = lazy(() => import("./components/common/AddressSelectorModal"));

const CartPage = lazy(() => import("./pages/CartPage"));
const UserDetails = lazy(() => import("./pages/UserDetails"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const SuccessPage = lazy(() => import("./pages/SuccessPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const EditProfilePage = lazy(() => import("./pages/EditProfilePage"));
const MyOrdersPage = lazy(() => import("./pages/MyOrdersPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const BuyCoinsTransactionsPage = lazy(() => import("./pages/BuyCoinsTransactionsPage"));
const BuyCoinsRewardsPage = lazy(() => import("./pages/BuyCoinsRewardsPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const SectionProductsPage = lazy(() => import("./pages/SectionProductsPage"));
const ProductDetailsPage = lazy(() => import("./pages/ProductDetailsPage"));
const CategoryProductsPage = lazy(() => import("./pages/CategoryProductsPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminVerification = lazy(() => import("./pages/AdminVerification"));
const AdminOrdersPage = lazy(() => import("./pages/AdminOrdersPage"));
const AdminProductsPage = lazy(() => import("./pages/AdminProductsPage"));
const AdminRidersPage = lazy(() => import("./pages/AdminRidersPage"));
const RiderDashboard = lazy(() => import("./pages/RiderDashboard"));
const RiderLogin = lazy(() => import("./pages/RiderLogin"));
const RiderSignup = lazy(() => import("./pages/RiderSignup"));
const OrderTrackingPage = lazy(() => import("./pages/OrderTrackingPage"));
const SupportChatPage = lazy(() => import("./pages/SupportChatPage"));
const AdminSupportPage = lazy(() => import("./pages/AdminSupportPage"));
const AdminNotificationsPage = lazy(() => import("./pages/AdminNotificationsPage"));

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
import FloatingCartPopup from "./components/common/FloatingCartPopup";
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
      <ForegroundNotificationBanner />
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

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant"
    });
  }, [pathname]);

  return null;
}

function App() {
  const [appReady, setAppReady] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      alert("✅ You're back online!");
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    if (!appReady) return;
    document.body.classList.add("app-ready");
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide({
        fadeOutDuration: 250
      }).catch((err) => {
        console.warn("Failed to hide native splash screen:", err);
      });
    }
  }, [appReady]);

  return (
    <LoaderProvider>
      {isOffline && <OfflineScreen onRetry={() => setIsOffline(false)} />}
      <AuthProvider>
        <BrowserRouter>
          <GTMRouteTracker />
          <ScrollToTop />
          <GlobalLayout>
            <Suspense fallback={
              <div style={{ width: "100%", height: "3px", background: "#e5e7eb", position: "fixed", top: 0, left: 0, zIndex: 99999 }}>
                <div style={{
                  height: "100%",
                  background: "#318616",
                  width: "40%",
                  animation: "routeProgress 0.8s ease-in-out infinite"
                }} />
                <style>{`
                  @keyframes routeProgress {
                    0% { margin-left: 0%; width: 20%; }
                    50% { margin-left: 40%; width: 50%; }
                    100% { margin-left: 100%; width: 10%; }
                  }
                `}</style>
              </div>
            }>
              <AppContent onReady={() => setAppReady(true)} />
            </Suspense>
          </GlobalLayout>
          <BuytoLoader />
        </BrowserRouter>
      </AuthProvider>
    </LoaderProvider>
  );
}



function AppContent({ onReady }) {
  usePerfLogger("AppContent");
  useHeaderTheme();
  const [bottomNavVisible, setBottomNavVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    let ticking = false;

    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

      const diff = scrollY - lastScrollY;

      if (scrollY <= 10) {
        setBottomNavVisible(true);
      } else if (Math.abs(diff) > 5) {
        // Scroll Up -> Show (true)
        // Scroll Down -> Hide (false)
        setBottomNavVisible(scrollY < lastScrollY);
      }
      lastScrollY = scrollY;
      ticking = false;
    };

    const onScroll = (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => handleScroll(e));
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, []);

  useEffect(() => {
    console.log({
      innerWidth: window.innerWidth,
      screenWidth: window.screen.width,
      documentWidth: document.documentElement.clientWidth,
      userAgent: navigator.userAgent
    });

    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true })
        .then(() => {
          return StatusBar.setBackgroundColor({ color: "#00000000" });
        })
        .catch((err) => console.error("Error setting status bar:", err));
    }

    // Initialize Google Analytics 4
    initializeAnalytics();

    // Initialize push notifications & check if pending tokens need syncing
    initializePushNotifications();
    retrySyncIfNeeded();

    const handleOnlineStatus = () => {
      console.log("[App] Network is back online. Checking token sync status...");
      retrySyncIfNeeded();
    };
    window.addEventListener("online", handleOnlineStatus);

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
    };
  }, []);

  const FREE_DELIVERY_THRESHOLD = 99;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Track page view in GA4
    trackPageView(location.pathname);
  }, [location.pathname]);

  const { user, token, logout } = useContext(AuthContext);
  const isLoggedIn = !!user && !user.isGuest;
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
  const cart = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const key = item._id || item.id;
      const suffix = item.selectedWeight ? `_${item.selectedWeight}` : "";
      const cartKey = `${key}${suffix}`;
      acc[cartKey] = { product: item, quantity: item.quantity };
      return acc;
    }, {});
  }, [cartItems]);

  const [pushToast, setPushToast] = useState({ title: "", body: "", deepLink: null, visible: false });

  // Sync cartItems state with localStorage & sync with backend
  useEffect(() => {
    localStorage.setItem("buyto_cart", JSON.stringify(cartItems));
    localStorage.setItem("cart", JSON.stringify(cartItems));

    if (token) {
      const delayDebounce = setTimeout(async () => {
        try {
          await fetch(window.API_BASE_URL + "/api/users/cart-activity", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ hasItems: cartItems.length > 0 })
          });
        } catch (err) {
          console.error("Failed to sync cart activity to backend:", err);
        }
      }, 2000);

      return () => clearTimeout(delayDebounce);
    }
  }, [cartItems, token]);

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
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const setSearchQuery = (val) => {
    console.log("setSearchQuery called with value:", val);
    if (val) {
      if (location.pathname !== "/search") {
        navigate(`/search?q=${encodeURIComponent(val)}`, { replace: true });
      } else {
        setSearchParams({ q: val });
      }
    } else {
      if (location.pathname === "/search") {
        navigate("/");
      } else {
        setSearchParams({});
      }
    }
  };
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
    }).filter(c => 
      c.showInHeader !== false &&
      c.image &&
      c.image.trim() !== "" &&
      c.icon !== "🛍️"
    );

    filtered.sort((a, b) => {
      const pA = getPriorityIndex(a.name);
      const pB = getPriorityIndex(b.name);
      if (pA !== pB) return pA - pB;
      return a.name.localeCompare(b.name);
    });

    const allCat = { id: "all", name: "All", icon: "🧺", image: "", slug: "all", showInHeader: true };
    return [allCat, ...filtered];
  }, [categories]);

  const handleCategoryClick = useCallback((category) => {
    navigate(`/products/${getCategorySlug(category.name)}`);
  }, [navigate]);

  useEffect(() => {
    const match = location.pathname.match(/^\/(?:products|category)\/([^/]+)/);
    if (match) {
      const slug = match[1];
      if (slug === "all") {
        setSelectedCategory("All");
      } else {
        const found = displayCats.find(c => {
          const cSlug = c.slug || generateSlug(c.name);
          return cSlug.toLowerCase() === slug.toLowerCase();
        });
        if (found) {
          setSelectedCategory(found.name);
        }
      }
    } else if (location.pathname === "/") {
      setSelectedCategory("All");
    }
  }, [location.pathname, displayCats]);

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
          } catch (e) { }
        }
      }
    };
    fetchDefaultAddress();
  }, [isLoggedIn, token]);

  useEffect(() => {
    if (windowWidth < 768 && location.pathname !== "/search" && !location.search.includes("tab=search") && searchQuery !== "") {
      console.log("Clearing search query on mobile because path is not /search and does not contain tab=search. Path:", location.pathname, "Search:", location.search);
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
    if (import.meta.env.PROD) return;
    const detectOverflow = () => {
      const runCheck = () => {
        const width = window.innerWidth;
        const elements = document.querySelectorAll('*');
        
        const hasClippingAncestor = (el) => {
          let parent = el.parentElement;
          while (parent) {
            if (parent.tagName === "HTML" || parent.tagName === "BODY" || parent.id === "root") {
              parent = parent.parentElement;
              continue;
            }
            const style = window.getComputedStyle(parent);
            if (
              style.overflowX === "auto" ||
              style.overflowX === "scroll" ||
              style.overflowX === "hidden" ||
              style.overflow === "auto" ||
              style.overflow === "scroll" ||
              style.overflow === "hidden"
            ) {
              return true;
            }
            parent = parent.parentElement;
          }
          return false;
        };

        elements.forEach((el) => {
          if (el.id === "root" || el.tagName === "HTML" || el.tagName === "BODY") return;
          const rect = el.getBoundingClientRect();
          if (rect.right > width + 1 && !hasClippingAncestor(el)) {
            const classNameStr = el.getAttribute('class') || '';
            const classes = classNameStr.split(/\s+/).filter(Boolean).join(".");
            console.warn(
              "⚠️ OVERFLOW OFFENDER:",
              el.tagName,
              classes ? `.${classes}` : '',
              el.id ? `#${el.id}` : '',
              `(${Math.round(rect.right)}px > ${width}px)`
            );
          }
        });
      };
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(runCheck);
      } else {
        setTimeout(runCheck, 0);
      }
    };
    const timer = setTimeout(detectOverflow, 2000);
    window.addEventListener("resize", detectOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", detectOverflow);
    };
  }, []);

  // Helper to generate cart keys
  const getCartKey = React.useCallback((product) => {
    const suffix = product.selectedWeight ? `_${product.selectedWeight}` : "";
    return `${product._id || product.id}${suffix}`;
  }, []);

  const getProductId = React.useCallback((product) => {
    return String(product._id || product.id);
  }, []);

  const addToCart = React.useCallback((product) => {
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
  }, [getProductId]);

  const removeFromCart = React.useCallback((product) => {
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
  }, [getProductId]);

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

  const clearCartAfterDelivery = () => {
    setCartItems([]);
    localStorage.removeItem("buyto_cart");
    localStorage.removeItem("cart");
    sessionStorage.removeItem("buyto_cart");
    sessionStorage.removeItem("buyto_applied_coupon_code");
    localStorage.removeItem("buyto_coins_redeem");
    localStorage.removeItem("buyto_checkout_summary");
    localStorage.removeItem("buyto_selected_address_id");
    console.log("[CartCleanup] Frontend cart and checkout storage cleared successfully.");
  };

  useEffect(() => {
    window.clearCartAfterDelivery = clearCartAfterDelivery;
    return () => {
      delete window.clearCartAfterDelivery;
    };
  }, []);

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

  const openProduct = React.useCallback((productId) => {
    setSelectedProductId(productId);
    setSelectedVariantIndex(0);
  }, []);

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

    const sourceList = searchQuery.trim() !== "" ? filteredProducts : products;

    sourceList.forEach(p => {
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

  const sections = React.useMemo(() => [
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
  ], [exclusiveDeals, mosquitoProducts, breadProducts, pickleProducts, wellnessProducts]);

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
    return "#f7f8fa";
  };

  const wrapCustomerLayout = (element, showHeader = true) => {
    return (
      <div style={{
        background: getAppBackground(),
        minHeight: "100vh",
        fontFamily: windowWidth < 768 ? "'Outfit', 'Inter', sans-serif" : "Inter, system-ui, sans-serif",
        width: "100%",
        maxWidth: "100%",
        overflowX: "clip",
        position: "relative",
        boxSizing: "border-box"
      }}>
        {location.pathname === "/" && <SEO isHome={true} />}
        {location.pathname === "/login" && <SEO title="Login" description="Login to your Buyto account." />}
        {location.pathname === "/signup" && <SEO title="Create Account" description="Create a new Buyto account." />}
        {!["/", "/login", "/signup", "/search", "/categories", "/cart", "/payment", "/success", "/profile/edit", "/profile", "/orders", "/my-orders", "/address", "/wishlist", "/buycoins", "/wallet", "/notifications", "/help", "/about", "/contact", "/settings", "/buycoins/transactions", "/buycoins/rewards", "/privacy-policy", "/terms", "/refund-policy", "/shipping-policy", "/faq", "/support/chat", "/shopping-list", "/shopping-list/results", "/shopping-list/smart-matching", "/save-for-later", "/saved-lists"].includes(location.pathname) && 
          !location.pathname.startsWith("/category/") && 
          !location.pathname.startsWith("/products/") && 
          !location.pathname.startsWith("/product/") && 
          !location.pathname.startsWith("/track-order/") && 
          !location.pathname.startsWith("/orders/") && 
          !location.pathname.startsWith("/section/") && 
          !location.pathname.startsWith("/admin") && 
          !location.pathname.startsWith("/rider") && 
          <SEO title="404 - Page Not Found" description="Page not found." />
        }

        {showHeader && (
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
        )}
        <div style={{
          paddingBottom: "140px",
          boxSizing: "border-box",
          width: "100%",
          maxWidth: "100%",
          overflowX: "clip"
        }}>
          {element}
          <Footer />
        </div>
        <FloatingCartPopup totalItems={totalItems} totalPrice={totalPrice} bottomNavVisible={bottomNavVisible} />
        <MobileBottomNavigation isVisible={bottomNavVisible} />

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
                    key={variant._id || `${selectedProduct._id}-${variant.weight || index}`}
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
        <OtpLoginBottomSheet />
        <OnboardingBottomSheet />
      </div>
    );
  };

  if (location.pathname === "/admin-verify") {
    return <AdminVerification />;
  }

  if (location.pathname === "/admin") {
    return (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    );
  }

  if (location.pathname === "/admin/notifications") {
    return (
      <AdminRoute>
        <AdminNotificationsPage />
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
          <MobileBottomNavigation isVisible={bottomNavVisible} />
        </div>
      );
    }
    return el;
  }

  if (location.pathname.startsWith("/track-order/") || location.pathname.startsWith("/orders/")) {
    const prefix = location.pathname.startsWith("/track-order/") ? "/track-order/" : "/orders/";
    let orderId = location.pathname.split(prefix)[1];
    if (orderId && orderId.endsWith("/tracking")) {
      orderId = orderId.replace("/tracking", "");
    }
    return (
      <ProtectedRoute>
        <OrderTrackingPage orderId={orderId} />
      </ProtectedRoute>
    );
  }

  if (location.pathname === "/success" || location.pathname.startsWith("/success/")) {
    const orderId = location.pathname.startsWith("/success/") ? location.pathname.split("/success/")[1] : null;
    const el = (
      <ProtectedRoute>
        <SuccessPage orderId={orderId} />
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

  if (location.pathname === "/profile/edit") {
    return wrapCustomerLayout(
      <ProtectedRoute>
        <EditProfilePage />
      </ProtectedRoute>
    );
  }

  if (location.pathname === "/profile") {
    return wrapCustomerLayout(
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    );
  }

  if (location.pathname === "/orders" || location.pathname === "/my-orders") {
    return wrapCustomerLayout(
      <ProtectedRoute>
        <MyOrdersPage />
      </ProtectedRoute>
    );
  }

  if (location.pathname === "/address") {
    return wrapCustomerLayout(
      <ProtectedRoute>
        <ProfilePage defaultTab="addresses" />
      </ProtectedRoute>
    );
  }

  if (location.pathname === "/wishlist") {
    return wrapCustomerLayout(
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
  }

  if (location.pathname === "/buycoins" || location.pathname === "/wallet") {
    return wrapCustomerLayout(
      <ProtectedRoute>
        <WalletPage />
      </ProtectedRoute>
    );
  }

  if (location.pathname === "/notifications") {
    return wrapCustomerLayout(
      <ProtectedRoute>
        <NotificationsPage />
      </ProtectedRoute>
    );
  }

  if (location.pathname === "/categories") {
    return wrapCustomerLayout(
      <CategoriesPage
        products={products}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />,
      false
    );
  }

  if (location.pathname === "/help") {
    return wrapCustomerLayout(<HelpPage />);
  }

  if (location.pathname === "/about") {
    return wrapCustomerLayout(<AboutPage />);
  }

  if (location.pathname === "/contact") {
    return wrapCustomerLayout(<ContactPage />);
  }

  if (location.pathname === "/settings") {
    return wrapCustomerLayout(<SettingsPage />);
  }

  if (location.pathname === "/buycoins/transactions") {
    return wrapCustomerLayout(<BuyCoinsTransactionsPage />);
  }

  if (location.pathname === "/buycoins/rewards") {
    return wrapCustomerLayout(<BuyCoinsRewardsPage />);
  }

  if (location.pathname === "/privacy-policy") {
    return wrapCustomerLayout(<PrivacyPolicyPage />);
  }

  if (location.pathname === "/terms") {
    return wrapCustomerLayout(<TermsPage />);
  }

  if (location.pathname === "/refund-policy") {
    return wrapCustomerLayout(<RefundPolicyPage />);
  }

  if (location.pathname === "/shipping-policy") {
    return wrapCustomerLayout(<ShippingPolicyPage />);
  }

  if (location.pathname === "/faq") {
    return wrapCustomerLayout(<FAQPage />);
  }

  if (location.pathname === "/support/chat") {
    return wrapCustomerLayout(
      <ProtectedRoute>
        <SupportChatPage />
      </ProtectedRoute>
    );
  }

  if (location.pathname.startsWith("/section/")) {
    return wrapCustomerLayout(
      <SectionProductsPage
        cart={cart}
        setCart={setCart}
        cartItems={cartItems}
        setCartItems={setCartItems}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
      />,
      false
    );
  }

  if (location.pathname === "/shopping-list") {
    return wrapCustomerLayout(
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
  }

  if (location.pathname === "/shopping-list/results") {
    return wrapCustomerLayout(
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
  }

  if (location.pathname === "/shopping-list/smart-matching") {
    return wrapCustomerLayout(
      <SmartMatchingPage
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        cartItems={cartItems}
        setCartItems={setCartItems}
      />
    );
  }

  if (location.pathname === "/save-for-later") {
    return wrapCustomerLayout(
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
  }

  if (location.pathname === "/saved-lists") {
    return wrapCustomerLayout(
      <ProtectedRoute>
        <SavedListsPage />
      </ProtectedRoute>
    );
  }

  if (location.pathname === "/cart") {
    return wrapCustomerLayout(
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
  }

  if (windowWidth < 768) {
    return wrapCustomerLayout(
      <div style={{ background: getAppBackground(), width: "100%", maxWidth: "100%", overflowX: "clip" }}>
        <Routes>
          <Route
            path="/category/:slug"
            element={
              <div>
                <div style={{ position: "sticky", top: "var(--header-height, 60px)", zIndex: 1000, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", background: "white", padding: "10px 16px", width: "100%", maxWidth: "100%", overflowX: "clip", boxSizing: "border-box" }}>
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
              </div>
            }
          />
          <Route
            path="/products/all"
            element={<Navigate to="/" replace />}
          />
          <Route
            path="/products/:slug"
            element={
              <div>
                <div style={{ position: "sticky", top: "var(--header-height, 60px)", zIndex: 1000, boxShadow: "0 4px 20px rgba(0,0,0,0.03)", background: "white", padding: "10px 16px", width: "100%", maxWidth: "100%", overflowX: "clip", boxSizing: "border-box" }}>
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
              </div>
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
            path="/search"
            element={
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
                forceSearchTab={true}
              />
            }
          />
          <Route
            path="*"
            element={
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
            }
          />
        </Routes>
      </div>,
      true
    );
  }

  const desktopEl = (
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

      <main style={{
        maxWidth: "1280px",
        margin: "0 auto",
        paddingTop: windowWidth < 768 ? "12px" : "24px",
        paddingLeft: windowWidth < 768 ? "12px" : "24px",
        paddingRight: windowWidth < 768 ? "12px" : "24px",
        paddingBottom: "100px"
      }}>

        <Routes>
          <Route
            path="/search"
            element={
              <SearchResultsView
                searchQuery={searchQuery}
                filteredProducts={filteredProducts}
                allProducts={products}
                isMobile={false}
                windowWidth={windowWidth}
                renderProductCard={renderProductCard}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cartItems={cartItems}
                setSelectedProduct={setSelectedProduct}
                setSearchQuery={setSearchQuery}
                openProduct={openProduct}
                getCartKey={getCartKey}
              />
            }
          />
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
            path="/products/all"
            element={<Navigate to="/" replace />}
          />
          <Route
            path="/products/:slug"
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
                        <PromoBannerCarousel />
                        <DynamicNewBanners />
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
                          <div id="fresh-fruits" style={{ scrollMarginTop: "140px", transition: "all 0.5s ease", borderRadius: "16px" }}>
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
                            const sectionId = getSectionIdForTitle(section.title);

                            return (
                              <div id={sectionId} key={section.title || index}>
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
                          <div id="recommended-for-you" style={{ scrollMarginTop: "140px", transition: "all 0.5s ease", borderRadius: "16px" }}>
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
                          </div>
                        )}

                        {trendingList.length > 0 && (
                          <div id="trending-near-you" style={{ scrollMarginTop: "140px", transition: "all 0.5s ease", borderRadius: "16px" }}>
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
                          </div>
                        )}

                        {bestDealsList.length > 0 && (
                          <div id="best-deals-today" style={{ scrollMarginTop: "140px", transition: "all 0.5s ease", borderRadius: "16px" }}>
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
                          </div>
                        )}

                        <div style={{
                          background: "#FFFFFF",
                          border: "1px solid rgba(49,134,22,.08)",
                          borderRadius: "32px",
                          padding: "36px",
                          boxShadow: "0 12px 40px rgba(49,134,22,.08)",
                          margin: "64px auto 40px auto",
                          maxWidth: "800px",
                          textAlign: "center",
                          fontFamily: "'Outfit', 'Inter', sans-serif",
                          boxSizing: "border-box"
                        }}>
                          <style>{`
                            .premium-footer-heading {
                              font-size: 32px;
                              font-weight: 800;
                              color: #1E293B;
                              margin: 0;
                            }
                            .premium-footer-subtitle {
                              color: #64748B;
                              font-size: 18px;
                              margin: 8px 0 28px 0;
                            }
                            .premium-action-btn {
                              background: #F8FFF5;
                              border: 1px solid rgba(49,134,22,.10);
                              border-radius: 999px;
                              padding: 14px 22px;
                              font-weight: 600;
                              font-size: 14px;
                              color: #318616;
                              cursor: pointer;
                              transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                              display: inline-flex;
                              align-items: center;
                              gap: 8px;
                              outline: none;
                              user-select: none;
                            }
                            .premium-action-btn:hover {
                              background: #318616;
                              color: white;
                              transform: translateY(-2px);
                              box-shadow: 0 12px 24px rgba(49,134,22,.18);
                            }
                            .premium-action-btn:active {
                              transform: scale(0.95) translateY(0);
                            }
                            @media (max-width: 768px) {
                              .premium-footer-heading {
                                font-size: 24px;
                              }
                              .premium-footer-subtitle {
                                font-size: 15px;
                                margin: 6px 0 20px 0;
                              }
                              .premium-action-btn {
                                padding: 10px 18px;
                                font-size: 13px;
                              }
                            }
                          `}</style>
                          <h2 className="premium-footer-heading">💚 Thank you for choosing Buyto</h2>
                          <p className="premium-footer-subtitle">Built by Students, for Students.</p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "center" }}>
                            <button
                              className="premium-action-btn"
                              onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                setTimeout(() => {
                                  const searchInput = document.getElementById('main-search-input');
                                  if (searchInput) {
                                    searchInput.focus();
                                    searchInput.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
                                    searchInput.style.boxShadow = '0 0 15px rgba(49, 134, 22, 0.6)';
                                    searchInput.style.borderColor = '#318616';
                                    setTimeout(() => {
                                      searchInput.style.boxShadow = '';
                                      searchInput.style.borderColor = '';
                                    }, 800);
                                  }
                                  const catStrip = document.getElementById('category-strip-container');
                                  if (catStrip) {
                                    catStrip.style.transition = 'transform 0.4s ease';
                                    catStrip.style.transform = 'scale(1.03)';
                                    setTimeout(() => {
                                      catStrip.style.transform = 'scale(1)';
                                    }, 400);
                                  }
                                }, 800);
                              }}
                            >
                              <span>🛒</span> Continue Shopping
                            </button>
                            
                            <button
                              className="premium-action-btn"
                              onClick={() => {
                                const el = document.getElementById('best-deals-today');
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth' });
                                  setTimeout(() => {
                                    el.style.boxShadow = '0 0 30px rgba(245, 158, 11, 0.4)';
                                    el.style.borderColor = 'rgba(245, 158, 11, 0.6)';
                                    setTimeout(() => {
                                      el.style.boxShadow = '';
                                      el.style.borderColor = '';
                                    }, 1000);
                                  }, 800);
                                }
                              }}
                            >
                              <span>🔥</span> Best Deals
                            </button>

                            <button
                              className="premium-action-btn"
                              onClick={() => {
                                const el = document.getElementById('fresh-fruits');
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth' });
                                  setTimeout(() => {
                                    el.style.boxShadow = '0 0 30px rgba(49, 134, 22, 0.4)';
                                    el.style.borderColor = 'rgba(49, 134, 22, 0.6)';
                                    setTimeout(() => {
                                      el.style.boxShadow = '';
                                      el.style.borderColor = '';
                                    }, 1000);
                                  }, 800);
                                }
                              }}
                            >
                              <span>🍎</span> Fresh Fruits
                            </button>

                            <button
                              className="premium-action-btn"
                              onClick={() => {
                                const showSurpriseToast = () => {
                                  const toast = document.createElement("div");
                                  toast.innerHTML = "✨ Today's Pick for You";
                                  toast.style.position = "fixed";
                                  toast.style.bottom = "100px";
                                  toast.style.left = "50%";
                                  toast.style.transform = "translateX(-50%) translateY(20px)";
                                  toast.style.background = "rgba(17, 24, 39, 0.9)";
                                  toast.style.color = "white";
                                  toast.style.padding = "12px 24px";
                                  toast.style.borderRadius = "50px";
                                  toast.style.fontSize = "14px";
                                  toast.style.fontWeight = "600";
                                  toast.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
                                  toast.style.zIndex = "9999";
                                  toast.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
                                  toast.style.opacity = "0";
                                  document.body.appendChild(toast);
                                  
                                  requestAnimationFrame(() => {
                                    toast.style.transform = "translateX(-50%) translateY(0)";
                                    toast.style.opacity = "1";
                                  });
                                  
                                  setTimeout(() => {
                                    toast.style.transform = "translateX(-50%) translateY(-20px)";
                                    toast.style.opacity = "0";
                                    setTimeout(() => {
                                      toast.remove();
                                    }, 300);
                                  }, 2000);
                                };

                                const targetSections = [
                                  { id: 'trending-near-you', color: 'rgba(49, 134, 22, 0.4)', border: 'rgba(49, 134, 22, 0.6)' },
                                  { id: 'fresh-fruits', color: 'rgba(49, 134, 22, 0.4)', border: 'rgba(49, 134, 22, 0.6)' },
                                  { id: 'best-deals-today', color: 'rgba(245, 158, 11, 0.4)', border: 'rgba(245, 158, 11, 0.6)' },
                                  { id: 'fresh-vegetables', color: 'rgba(49, 134, 22, 0.4)', border: 'rgba(49, 134, 22, 0.6)' },
                                  { id: 'dairy-bread-eggs', color: 'rgba(49, 134, 22, 0.4)', border: 'rgba(49, 134, 22, 0.6)' },
                                  { id: 'snacks', color: 'rgba(245, 158, 11, 0.4)', border: 'rgba(245, 158, 11, 0.6)' }
                                ];
                                const available = targetSections.filter(s => document.getElementById(s.id));
                                if (available.length > 0) {
                                  const randomSec = available[Math.floor(Math.random() * available.length)];
                                  const el = document.getElementById(randomSec.id);
                                  if (el) {
                                    el.scrollIntoView({ behavior: 'smooth' });
                                    showSurpriseToast();
                                    setTimeout(() => {
                                      el.style.boxShadow = `0 0 30px ${randomSec.color}`;
                                      el.style.borderColor = randomSec.border;
                                      setTimeout(() => {
                                        el.style.boxShadow = '';
                                        el.style.borderColor = '';
                                      }, 1000);
                                    }, 800);
                                  }
                                }
                              }}
                            >
                              <span>🎲</span> Surprise Me
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <SearchResultsView
                        searchQuery={searchQuery}
                        filteredProducts={filteredProducts}
                        allProducts={products}
                        isMobile={false}
                        windowWidth={windowWidth}
                        renderProductCard={renderProductCard}
                        addToCart={addToCart}
                        removeFromCart={removeFromCart}
                        cartItems={cartItems}
                        setSelectedProduct={setSelectedProduct}
                        setSearchQuery={setSearchQuery}
                        openProduct={openProduct}
                        getCartKey={getCartKey}
                      />
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
                  key={variant._id || `${selectedProduct._id}-${variant.weight || index}`}
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

      {/* GLOBAL COUPON CELEBRATION MODAL */}
      {appliedCouponCelebration && (
        <CouponCelebrationModal
          coupon={appliedCouponCelebration}
          onClose={() => setAppliedCouponCelebration(null)}
        />
      )}

      {/* WELCOME REWARD MODAL */}
      <WelcomeRewardModal />

      {/* GLOBAL FOREGROUND PUSH NOTIFICATION TOAST */}
      {pushToast.visible && (
        <div
          onClick={() => {
            if (pushToast.deepLink) navigate(pushToast.deepLink);
            setPushToast(prev => ({ ...prev, visible: false }));
          }}
          style={{
            position: "fixed",
            top: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 32px)",
            maxWidth: "420px",
            backgroundColor: "white",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            borderRadius: "16px",
            borderLeft: "6px solid #318616",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            zIndex: 999999,
            cursor: "pointer",
            animation: "toastEnter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            fontFamily: "'Outfit', 'Inter', sans-serif"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <span style={{ fontWeight: "800", color: "#111827", fontSize: "15px" }}>{pushToast.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPushToast(prev => ({ ...prev, visible: false }));
              }}
              style={{
                background: "none",
                border: "none",
                color: "#9CA3AF",
                fontSize: "16px",
                cursor: "pointer",
                padding: "4px",
                lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "#4B5563", fontWeight: "600", lineHeight: "1.4" }}>
            {pushToast.body}
          </p>
          <style dangerouslySetInnerHTML={{ __html: '@keyframes toastEnter { 0% { transform: translate(-50%, -50px); opacity: 0; } 100% { transform: translate(-50%, 0); opacity: 1; } }' }} />
        </div>
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

  const debugPanel = !import.meta.env.PROD && (
    <div style={{
      position: "fixed",
      bottom: "10px",
      left: "10px",
      zIndex: 99999,
      background: "rgba(0, 0, 0, 0.85)",
      color: "#fff",
      padding: "8px 12px",
      borderRadius: "8px",
      fontSize: "11px",
      fontFamily: "monospace",
      pointerEvents: "none",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      border: "1px solid rgba(255,255,255,0.2)"
    }}>
      <div>Env: DEV</div>
      <div>API: {window.API_BASE_URL}</div>
      <div>Platform: {Capacitor.getPlatform()}</div>
    </div>
  );

  return wrapCustomerLayout(<>{desktopEl}{debugPanel}</>, true);
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
