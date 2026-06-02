import React, { useEffect, useState, useContext } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import RiderProtectedRoute from "./components/RiderProtectedRoute";
import SignupPage from "./pages/SignupPage";
import CartPage from "./pages/CartPage";
import UserDetails from "./pages/UserDetails";
import LoginPage from "./pages/LoginPage";
import PaymentPage from "./pages/PaymentPage";
import SuccessPage from "./pages/SuccessPage";
import ProfilePage from "./pages/ProfilePage";
import HelpPage from "./pages/HelpPage";
import SectionProductsPage from "./pages/SectionProductsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminRidersPage from "./pages/AdminRidersPage";
import RiderDashboard from "./pages/RiderDashboard";
import RiderLogin from "./pages/RiderLogin";
import RiderSignup from "./pages/RiderSignup";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import SupportChatPage from "./pages/SupportChatPage";
import AdminSupportPage from "./pages/AdminSupportPage";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { io } from "socket.io-client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import HorizontalProductSection from "./HorizontalProductSection";
import ProductCard from "./ProductCard";
import CategoryGridNavigator from "./CategoryGridNavigator";

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

  useEffect(() => {
    setHideTrackingCard(!!localStorage.getItem("hideTrackingCard"));
  }, [location.pathname]);

  const activeOrder = localStorage.getItem("activeOrder") === "true";
  const latestOrderId = localStorage.getItem("latestOrderId");

  const shouldShowFloatingCard =
    activeOrder &&
    latestOrderId &&
    !hideTrackingCard &&
    location.pathname !== "/success" &&
    location.pathname !== "/order-success";

  const [riderPos, setRiderPos] = useState([13.628, 74.693]);
  const [userPos, setUserPos] = useState([13.628, 74.693]);
  const [currentETA, setCurrentETA] = useState(30);

  useEffect(() => {
    if (!latestOrderId || !activeOrder) return;

    const fetchOrderDetails = async () => {
      const token = localStorage.getItem("buyto_token");
      if (!token) return;
      try {
        const res = await fetch(`http://localhost:8000/api/orders/track/${latestOrderId}`, {
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
    if (!latestOrderId || !activeOrder) return;

    const socket = io("http://localhost:8000");

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
  return (
    <AuthProvider>
      <BrowserRouter>
        <GlobalLayout>
          <AppContent />
        </GlobalLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppContent() {
  const FREE_DELIVERY_THRESHOLD = 99;
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
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
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { user, logout } = useContext(AuthContext);
  const isLoggedIn = !!user;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const firstName = user?.name?.split(" ")[0] || "";
  const [showMenu, setShowMenu] = useState(false);

  const userLocation = localStorage.getItem("userLocation") || "Apartment 101, Central Tower";
  const roomNumber = localStorage.getItem("roomNumber") || "Floor 1";

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
    fetch("http://localhost:8000/api/products")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
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
      const matchesCategory = selectedCategory === "All" || searchQuery.trim() !== "" || getCategoryMatch(product.category, selectedCategory);
      
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

  // Group products into lists by category for the "All" view with section headings
  const trendingProducts = products.filter(p => p.isTrending);
  const fruitProducts = filteredProducts.filter(p => getCategoryMatch(p.category, "The Fruit Store"));
  const veggieProducts = filteredProducts.filter(p => getCategoryMatch(p.category, "The Veggie Store"));
  const dairyProducts = filteredProducts.filter(p => getCategoryMatch(p.category, "Dairy, Bread & Eggs") || getCategoryMatch(p.category, "Dairy, Bread and Eggs") || getCategoryMatch(p.category, "Dairy Bread & Eggs"));
  const snackProducts = filteredProducts.filter(p => getCategoryMatch(p.category, "Snacks"));
  const beverageProducts = filteredProducts.filter(p => getCategoryMatch(p.category, "Beverages"));
  const exclusiveDeals = (products || []).filter(p => getCategoryMatch(p.category, "Exclusive Deals"));
  const mosquitoProducts = (products || []).filter(p => getCategoryMatch(p.category, "Cleaners & Repellents"));
  const breadProducts = (products || []).filter(p => getCategoryMatch(p.category, "The Bread Store"));
  const pickleProducts = (products || []).filter(p => getCategoryMatch(p.category, "Premium Pickles"));
  const wellnessProducts = (products || []).filter(p => getCategoryMatch(p.category, "Sexual Wellness"));

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
    return (
      <ProtectedRoute>
        <PaymentPage cart={cart} setCart={setCart} />
      </ProtectedRoute>
    );
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
    return (
      <ProtectedRoute>
        <SuccessPage />
      </ProtectedRoute>
    );
  }

  if (location.pathname === "/profile" || location.pathname === "/my-orders") {
    return (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    );
  }

  if (location.pathname === "/help") {
    return <HelpPage />;
  }

  if (location.pathname === "/support/chat") {
    return (
      <ProtectedRoute>
        <SupportChatPage />
      </ProtectedRoute>
    );
  }

  if (location.pathname.startsWith("/section/")) {
    return (
      <SectionProductsPage
        cart={cart}
        setCart={setCart}
        cartItems={cartItems}
        setCartItems={setCartItems}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
      />
    );
  }

  if (location.pathname === "/cart") {
    return (
      <CartPage
        cartItems={computedCartItems}
        increaseQty={increaseQty}
        decreaseQty={decreaseQty}
        removeFromCart={removeFromCartCompletely}
        isLoggedIn={isLoggedIn}
      />
    );
  }

  return (

    <div style={{ background: "#f9fafb", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
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

      {/* TOP STICKY NAVBAR */}
      <header
        style={{
          background: "white",
          display: "flex",
          flexDirection: windowWidth < 768 ? "column" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: windowWidth < 768 ? "10px 12px" : "16px 40px",
          gap: windowWidth < 768 ? "10px" : "20px",
          borderBottom: "1px solid #eee",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: windowWidth < 768 ? "12px" : "24px", width: windowWidth < 768 ? "100%" : "auto", justifyContent: "space-between" }}>
          {/* Logo */}
          <div
            onClick={() => { setSelectedProductId(null); setSelectedCategory("All"); }}
            style={{ display: "flex", flexDirection: "column", cursor: "pointer" }}
          >
            <span
              style={{
                fontSize: windowWidth < 768 ? "18px" : "22px",
                fontWeight: "900",
                letterSpacing: "-0.5px",
              }}
            >
              ⚡{" "}
              <span style={{ color: "#F8CB46" }}>
                Buyto
              </span>{" "}
              <span style={{ color: "#318616" }}>
                Instant
              </span>
            </span>
            <span style={{ fontSize: windowWidth < 768 ? "9px" : "11px", fontWeight: "800", color: "#6B7280", marginTop: "-1px", letterSpacing: "1px", textTransform: "uppercase" }}>
              Superfast Delivery
            </span>
          </div>

          <div style={{ height: "30px", width: "1px", background: "#e5e7eb", display: windowWidth < 768 ? "none" : "block" }} />

          {/* Delivery section */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: windowWidth < 768 ? "10px" : "12px", fontWeight: "700", color: "#1f2937" }}>
              30 mins delivery
            </span>
            <p
              style={{
                fontSize: windowWidth < 768 ? "9px" : "11px",
                color: "#6b7280",
                fontWeight: "500",
                margin: 0,
                marginTop: "2px",
              }}
            >
              {userLocation}
              {roomNumber && `, Room ${roomNumber}`}
            </p>
          </div>
        </div>

        {/* Search section */}
        <div style={{ position: "relative", width: windowWidth < 768 ? "100%" : "auto" }}>
          <input
            type="text"
            placeholder=""
            value={searchQuery}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (location.pathname !== "/") {
                navigate("/");
              }
            }}
            style={{
              background: "#f3f4f6",
              borderRadius: "14px",
              padding: windowWidth < 768 ? "10px 14px" : "14px 18px",
              paddingLeft: "44px",
              width: windowWidth < 768 ? "100%" : "500px",
              border: "none",
              fontSize: windowWidth < 768 ? "13px" : "15px",
              fontWeight: "500",
              color: "#1f2937",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {!searchQuery && (
            <div
              style={{
                position: "absolute",
                left: "44px",
                right: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "#9ca3af",
                fontSize: windowWidth < 768 ? "13px" : "15px",
                fontWeight: "500",
              }}
            >
              <span>Search</span>
              <div
                style={{
                  position: "relative",
                  height: "20px",
                  overflow: "hidden",
                  flexGrow: 1,
                  minWidth: "120px",
                }}
              >
                <div
                  key={searchIndex}
                  className="search-slide"
                  style={{
                    color: "#9ca3af",
                    fontSize: windowWidth < 768 ? "13px" : "15px",
                    fontWeight: "500",
                  }}
                >
                  "{searchSuggestions[searchIndex]}"
                </div>
              </div>
            </div>
          )}
          <svg
            style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "white",
                borderRadius: "14px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                border: "1px solid #e5e7eb",
                marginTop: "8px",
                zIndex: 99999,
                maxHeight: "320px",
                overflowY: "auto",
                padding: "8px 0",
              }}
            >
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion._id || suggestion.id}
                  onClick={() => {
                    setSearchQuery(suggestion.name);
                    navigate(`/product/${suggestion._id || suggestion.id}`);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 16px",
                    cursor: "pointer",
                    transition: "background 0.15s",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = "#f3f4f6"}
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <img
                    src={suggestion.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150"}
                    alt={suggestion.name}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "6px",
                      objectFit: "contain",
                      background: "#f9fafb",
                    }}
                  />
                  <div style={{ flexGrow: 1, overflow: "hidden", textAlign: "left" }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#1f2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {suggestion.name}
                    </p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#6b7280", fontWeight: "600" }}>
                      {suggestion.brand || "Fresh"} • {suggestion.weight} • <span style={{ color: "#318616" }}>₹{suggestion.price}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right section */}
        <div style={{ display: "flex", alignItems: "center", gap: windowWidth < 768 ? "12px" : "20px", width: windowWidth < 768 ? "100%" : "auto", justifyContent: windowWidth < 768 ? "space-between" : "flex-end" }}>
          {isLoggedIn && user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1f2937",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Welcome {firstName} 👋 <span style={{ fontSize: "10px" }}>▼</span>
              </button>

              {showMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "45px",
                    right: "0",
                    width: "220px",
                    background: "white",
                    borderRadius: "18px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                    zIndex: 9999,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  {/* Admin Dashboard Switcher */}
                  {user?.role === "admin" && (
                    <div
                      onClick={() => {
                        setShowMenu(false);
                        navigate("/admin");
                      }}
                      style={{
                        ...menuItemStyle,
                        color: "#318616",
                        fontWeight: "800",
                        borderBottom: "1px solid #f3f4f6"
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "#f0fdf4")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      📊 Admin Dashboard
                    </div>
                  )}

                  {/* Profile */}
                  <div
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/profile");
                    }}
                    style={menuItemStyle}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    👤 Profile
                  </div>

                  {/* Track Orders */}
                  <div
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/success");
                    }}
                    style={menuItemStyle}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    📦 Track Orders
                  </div>

                  {/* Help */}
                  <div
                    onClick={() => {
                      setShowMenu(false);
                      navigate("/help");
                    }}
                    style={menuItemStyle}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    🎧 Help
                  </div>

                  {/* Logout */}
                  <div
                    onClick={() => {
                      logout();
                      setShowMenu(false);
                      navigate("/");
                    }}
                    style={{
                      ...menuItemStyle,
                      color: "#ef4444",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#fef2f2")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    🚪 Logout
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              style={{
                border: "none",
                background: "transparent",
                fontSize: "16px",
                fontWeight: "600",
                color: "#1f2937",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseOver={(e) => (e.target.style.color = "#318616")}
              onMouseOut={(e) => (e.target.style.color = "#1f2937")}
            >
              Login
            </button>
          )}

          <button
            onClick={() => navigate("/cart")}
            onMouseOver={(e) => {
              if (totalItems > 0) {
                e.currentTarget.style.background = "#286f12";
              }
            }}
            onMouseOut={(e) => {
              if (totalItems > 0) {
                e.currentTarget.style.background = "#318616";
              }
            }}
            style={{
              background: totalItems > 0 ? "#318616" : "#f3f4f6",
              color: totalItems > 0 ? "white" : "#1f2937",
              border: "none",
              borderRadius: "14px",
              padding: windowWidth < 768 ? "8px 16px" : "12px 20px",
              fontSize: windowWidth < 768 ? "12px" : "14px",
              fontWeight: "800",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "0.2s",
            }}
          >
            <span style={{ fontSize: "16px" }}>🧺</span>
            <span>{totalItems > 0 ? `${totalItems} Items` : "Cart"}</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: windowWidth < 768 ? "12px" : "24px", paddingBottom: "100px" }}>

        <Routes>
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
                {/* Category Circle Strip (only visible on catalog page) */}
                <div
                  style={{
                    display: "flex",
                    gap: windowWidth < 768 ? "14px" : "24px",
                    overflowX: "auto",
                    padding: "20px 0",
                    scrollbarWidth: "none",
                  }}
                  className="hide-scrollbar"
                >
                  {[
                    {
                      name: "All",
                      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80",
                    },
                    {
                      name: "The Fruit Store",
                      image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&auto=format&fit=crop&q=80",
                    },
                    {
                      name: "The Veggie Store",
                      image: "https://images.unsplash.com/photo-1566385278603-605b637d384c?w=200&auto=format&fit=crop&q=80",
                    },
                    {
                      name: "Dairy, Bread & Eggs",
                      image: "https://images.unsplash.com/photo-1588710922810-ee4047b470d9?w=200&auto=format&fit=crop&q=80",
                    },
                    {
                      name: "Snacks",
                      image: "https://images.unsplash.com/photo-1599490659223-e1b97f530b6d?w=200&auto=format&fit=crop&q=80",
                    },
                    {
                      name: "Beverages",
                      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&auto=format&fit=crop&q=80",
                    }
                  ].map((cat) => (
                    <div
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        textAlign: "center"
                      }}
                    >
                      <div
                        style={{
                          width: "76px",
                          height: "76px",
                          borderRadius: "50%",
                          overflow: "hidden",
                          border: selectedCategory === cat.name ? "3px solid #318616" : "1px solid #e5e7eb",
                          padding: "2px",
                          background: "white",
                          transition: "0.2s",
                        }}
                        className="hover:scale-105 transition-transform"
                      >
                        <img
                          src={cat.image}
                          alt={cat.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: selectedCategory === cat.name ? "700" : "600",
                          color: selectedCategory === cat.name ? "#318616" : "#4b5563",
                          marginTop: "8px",
                          maxWidth: "80px",
                          lineHeight: "1.2"
                        }}
                      >
                        {cat.name === "All" ? "All Items" : cat.name.replace("The ", "")}
                      </span>
                    </div>
                  ))}
                </div>

                {loading ? (
                  <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#4b5563", marginTop: "40px" }}>
                    Loading Products...
                  </h2>
                ) : (
                  /* PRODUCT CATALOG PAGE */
                  <div>
                    {selectedCategory === "All" && !searchQuery ? (
                      <div>
                        <CategoryGridNavigator
                          setSelectedCategory={setSelectedCategory}
                          windowWidth={windowWidth}
                        />

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
                          <HorizontalProductSection
                            title="Fresh Fruits"
                            emoji="🍎"
                            products={fruitProducts.slice(0, 6)}
                            onShowAll={() => navigate("/section/fruits")}
                            openProduct={openProduct}
                            setSelectedProduct={setSelectedProduct}
                            addToCart={addToCart}
                            removeFromCart={removeFromCart}
                            cart={cart}
                            windowWidth={windowWidth}
                            getCartKey={getCartKey}
                          />
                        )}

                        {veggieProducts.length > 0 && (
                          <HorizontalProductSection
                            title="Fresh Vegetables"
                            emoji="🥦"
                            products={veggieProducts}
                            onShowAll={() => navigate("/section/veggies")}
                            openProduct={openProduct}
                            setSelectedProduct={setSelectedProduct}
                            addToCart={addToCart}
                            removeFromCart={removeFromCart}
                            cart={cart}
                            windowWidth={windowWidth}
                            getCartKey={getCartKey}
                          />
                        )}

                        {dairyProducts.length > 0 && (
                          <HorizontalProductSection
                            title="Dairy, Bread & Eggs"
                            emoji="🥛"
                            products={dairyProducts.slice(0, 6)}
                            onShowAll={() => navigate("/section/dairy")}
                            openProduct={openProduct}
                            setSelectedProduct={setSelectedProduct}
                            addToCart={addToCart}
                            removeFromCart={removeFromCart}
                            cart={cart}
                            windowWidth={windowWidth}
                            getCartKey={getCartKey}
                          />
                        )}

                        {snackProducts.length > 0 && (
                          <HorizontalProductSection
                            title="Snacks & Munchies"
                            emoji="🍟"
                            products={snackProducts.slice(0, 6)}
                            onShowAll={() => navigate("/section/snacks")}
                            openProduct={openProduct}
                            setSelectedProduct={setSelectedProduct}
                            addToCart={addToCart}
                            removeFromCart={removeFromCart}
                            cart={cart}
                            windowWidth={windowWidth}
                            getCartKey={getCartKey}
                          />
                        )}

                        {beverageProducts.length > 0 && (
                          <HorizontalProductSection
                            title="Cold Drinks & Beverages"
                            emoji="🥤"
                            products={beverageProducts.slice(0, 6)}
                            onShowAll={() => navigate("/section/beverages")}
                            openProduct={openProduct}
                            setSelectedProduct={setSelectedProduct}
                            addToCart={addToCart}
                            removeFromCart={removeFromCart}
                            cart={cart}
                            windowWidth={windowWidth}
                            getCartKey={getCartKey}
                          />
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

                            return (
                              <HorizontalProductSection
                                key={index}
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
                            );
                          })
                        }
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
                          bottom: windowWidth < 768 ? "0" : "20px",
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
