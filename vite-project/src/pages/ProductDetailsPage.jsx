import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductCard from "../ProductCard";
import MobileProductCard from "../components/mobile/MobileProductCard";
import { cachedFetch } from "../utils/apiCache";
import { usePerfLogger, measureLoadingOperation } from "../utils/perfLogger";
import { AuthContext } from "../context/AuthContext";
import { getOptimizedImageUrl } from "../utils/imageOptimizer";
import SEO from "../components/common/SEO";
import ProductDetailsSkeleton from "../components/common/ProductDetailsSkeleton";
import {
  ChevronUp,
  ChevronDown,
  ShoppingBag,
  Heart,
  Share2,
  Clock,
  Truck,
  Shield,
  ShieldCheck,
  RotateCcw,
  Star,
  Info,
  ThumbsUp,
  Plus,
  Check
} from "lucide-react";

// --- Accordion Section Component ---
function AccordionSection({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #f3f4f6", padding: "16px 0" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "none",
          border: "none",
          textAlign: "left",
          fontSize: "16px",
          fontWeight: "700",
          color: "#1f2937",
          cursor: "pointer",
          padding: 0
        }}
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp size={20} color="#4b5563" /> : <ChevronDown size={20} color="#4b5563" />}
      </button>
      {isOpen && (
        <div style={{ marginTop: "12px", fontSize: "14px", color: "#4b5563", lineHeight: "1.6" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function ProductDetailsPage({
  products = [],
  addToCart,
  removeFromCart,
  cart = {},
  cartItems = [],
  windowWidth,
  getCartKey,
  setSelectedProduct,
}) {
  usePerfLogger("ProductDetailsPage");
  const { id } = useParams();
  const navigate = useNavigate();
  const { saveForLaterIds, toggleSaveForLater } = useContext(AuthContext);

  const [activeProduct, setActiveProduct] = useState(null);
  const [allProducts, setAllProducts] = useState(products);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [activeTab, setActiveTab] = useState(0); // For alternate gallery views
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const saved = localStorage.getItem("buyto_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [toastMsg, setToastMsg] = useState("");
  const [isSavedIconAnimating, setIsSavedIconAnimating] = useState(false);
  const toastTimeoutRef = useRef(null);

  const isMobile = windowWidth < 768;

  // Strikethrough pricing logic helper
  const hasVariants = activeProduct && Array.isArray(activeProduct.variants) && activeProduct.variants.length > 0;
  const currentVariant = hasVariants ? activeProduct.variants[selectedVariantIndex] : null;

  const currentPrice = currentVariant ? currentVariant.price : (activeProduct ? activeProduct.price : 0);
  const currentOriginalPrice = currentVariant && currentVariant.originalPrice !== undefined
    ? currentVariant.originalPrice
    : (activeProduct ? activeProduct.originalPrice || activeProduct.price : 0);
  const currentWeight = currentVariant ? currentVariant.weight : (activeProduct ? activeProduct.weight : "");

  const hasDiscount = currentOriginalPrice > currentPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
    : 0;

  const isWishlisted = wishlistIds.includes(id);

  // Dynamic enrichment for product details page
  const enrichProduct = (product) => {
    if (!product) return null;
    const defaults = {
      brand: "Buyto Fresh",
      description: "Fresh and premium quality, sourced directly from trusted local farms. Rich in essential vitamins and nutrients for a healthy lifestyle.",
      highlights: ["Sourced Locally", "Premium Grade", "Freshly Packed", "100% Organic"],
      nutrition: {
        "Energy": "45 kcal",
        "Carbs": "10g",
        "Proteins": "1g",
        "Fats": "0.2g"
      },
      storage: "Store in a cool, dry place away from direct sunlight. Refrigerate leafy vegetables and dairy items to maintain crispness and freshness.",
      disclaimer: "Every effort is made to maintain accuracy of all information. However, actual product packaging and materials may contain more and/or different information. It is recommended not to solely rely on the information presented."
    };

    if (product.category === "The Fruit Store" || product.category === "Fresh Fruits") {
      return {
        ...defaults,
        ...product,
        brand: "Buyto Organic",
        description: "Juicy and delicious, packed at source for optimum shelf life. Harvested at the perfect stage of ripening to deliver natural sweetness.",
        highlights: ["Farm Fresh", "Organic Sourced", "Naturally Ripened", "High in Vitamin C"],
        nutrition: {
          "Energy": "89 kcal",
          "Carbs": "22.8g",
          "Proteins": "1.1g",
          "Fiber": "2.6g"
        }
      };
    } else if (product.category === "The Veggie Store" || product.category === "Fresh Vegetables") {
      return {
        ...defaults,
        ...product,
        brand: "Buyto Fresh",
        description: "Farm-fresh vegetables handpicked daily. Cleaned, graded, and carefully packed under high hygienic standards to keep nutritive value intact.",
        highlights: ["100% Organic", "Directly from Farms", "Pesticide-Free", "Rich in Fiber"],
        nutrition: {
          "Energy": "22 kcal",
          "Carbs": "4.5g",
          "Proteins": "2g",
          "Vitamin A": "18%"
        }
      };
    } else if (product.category === "Dairy, Bread & Eggs") {
      return {
        ...defaults,
        ...product,
        brand: "Buyto Dairy",
        highlights: ["Pasteurized", "High Calcium", "Freshly Processed", "No Preservatives"],
        nutrition: {
          "Energy": "140 kcal",
          "Proteins": "6.2g",
          "Calcium": "24%",
          "Fats": "7.5g"
        }
      };
    }

    return { ...defaults, ...product };
  };

  // Wishlist handler
  const handleToggleWishlist = () => {
    let updated;
    if (isWishlisted) {
      updated = wishlistIds.filter((item) => item !== id);
      setToastMsg("Removed from Wishlist");
    } else {
      updated = [...wishlistIds, id];
      setToastMsg("✓ Added to Wishlist");
    }
    setWishlistIds(updated);
    localStorage.setItem("buyto_wishlist", JSON.stringify(updated));
    setTimeout(() => setToastMsg(""), 1500);
  };

  // Save for Later handler
  const handleToggleSaveForLater = async () => {
    if (toggleSaveForLater && activeProduct) {
      const result = await toggleSaveForLater(activeProduct);
      if (result && result.success) {
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        if (result.isSaved) {
          setToastMsg("✓ Saved for Later");
          setIsSavedIconAnimating(true);
          setTimeout(() => setIsSavedIconAnimating(false), 150);
        } else {
          setToastMsg("Removed from Saved for Later");
        }
        toastTimeoutRef.current = setTimeout(() => {
          setToastMsg("");
        }, 1500);
      }
    }
  };

  // Fetch Product Data
  useEffect(() => {
    const fetchStart = performance.now();
    let found = null;
    if (products && products.length > 0) {
      found = products.find((p) => String(p._id || p.id) === String(id));
    }
    if (found) {
      const enriched = enrichProduct(found);
      setActiveProduct(enriched);
      setSelectedImage(enriched.image);
      setLoading(false);
      measureLoadingOperation(`ProductDetailsPage (${id})`, fetchStart);

      // PERSIST RECENTLY VIEWED (Keep last 10)
      try {
        const viewedStr = localStorage.getItem("buyto_recently_viewed");
        let viewed = viewedStr ? JSON.parse(viewedStr) : [];
        viewed = viewed.filter((item) => String(item._id || item.id) !== String(found._id || found.id));
        viewed.unshift(found);
        if (viewed.length > 10) {
          viewed = viewed.slice(0, 10);
        }
        localStorage.setItem("buyto_recently_viewed", JSON.stringify(viewed));
      } catch (e) {
        console.error("Failed to save recently viewed:", e);
      }
    } else {
      // Fetch product by ID from backend
      setLoading(true);
      cachedFetch((window.API_BASE_URL || "") + `/api/products/${id}`, { minDelay: 700 })
        .then((data) => {
          const raw = data.product || data;
          const enriched = enrichProduct(raw);
          setActiveProduct(enriched);
          setSelectedImage(enriched.image);
          setLoading(false);
          measureLoadingOperation(`ProductDetailsPage API (${id})`, fetchStart);
        })
        .catch((err) => {
          console.error("PDP Fetch Error:", err);
          setApiError("Failed to load product. Please try again.");
          setLoading(false);
        });
    }
  }, [id, products]);



  // Image Hover Zoom
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomPos({ x, y });
  };

  // --- RELATED PRODUCTS ALGORITHM ---
  // Same category first, then same subcategory (or random), then remaining random products.
  const relatedProducts = useMemo(() => {
    if (!activeProduct || allProducts.length === 0) return [];

    // Filter out current product
    const otherProducts = allProducts.filter(
      (p) => String(p._id || p.id) !== String(activeProduct._id || activeProduct.id)
    );

    const sameCategory = otherProducts.filter((p) => p.category === activeProduct.category);
    const diffCategory = otherProducts.filter((p) => p.category !== activeProduct.category);

    // Shuffle helper
    const shuffle = (arr) => [...arr].sort(() => 0.5 - Math.random());

    const result = [...shuffle(sameCategory), ...shuffle(diffCategory)].slice(0, 8);
    return result;
  }, [activeProduct, allProducts]);

  // Frequently Bought Together Products (Select 2 from same category)
  const frequentlyBoughtTogether = useMemo(() => {
    if (!activeProduct || allProducts.length === 0) return [];
    const candidates = allProducts.filter(
      (p) =>
        p.category === activeProduct.category &&
        String(p._id || p.id) !== String(activeProduct._id || activeProduct.id)
    );
    return candidates.slice(0, 2);
  }, [activeProduct, allProducts]);

  const fbtTotalPrice = useMemo(() => {
    if (!activeProduct) return 0;
    let sum = currentPrice;
    frequentlyBoughtTogether.forEach((p) => {
      sum += p.price || 0;
    });
    return sum;
  }, [activeProduct, currentPrice, frequentlyBoughtTogether]);

  const handleAddAllFbt = () => {
    if (!activeProduct) return;

    // Add active product variant
    const currentVariantWeight = currentVariant ? currentVariant.weight : activeProduct.weight;
    addToCart({
      ...activeProduct,
      selectedWeight: currentVariantWeight,
      price: currentPrice
    });

    // Add others
    frequentlyBoughtTogether.forEach((p) => {
      const defaultWeight = p.variants && p.variants[0] ? p.variants[0].weight : p.weight || "";
      addToCart({
        ...p,
        selectedWeight: defaultWeight,
        price: p.variants && p.variants[0] ? p.variants[0].price : p.price
      });
    });

    setToastMsg("✓ Added all bundle products!");
    setTimeout(() => setToastMsg(""), 2000);
  };

  // Recently Viewed Products from localStorage
  const recentlyViewed = useMemo(() => {
    try {
      const items = localStorage.getItem("buyto_recently_viewed");
      if (!items) return [];
      const parsed = JSON.parse(items);
      // Filter out current active product
      return parsed.filter((p) => String(p._id || p.id) !== String(id)).slice(0, 6);
    } catch (e) {
      return [];
    }
  }, [id, activeProduct]);

  // Alternate Image Thumbnails Generator
  const thumbnails = useMemo(() => {
    if (!activeProduct) return [];
    return [
      activeProduct.image,
      // Generic alternate placeholders representing fresh assurance & packing
      "/dist/assets/buyto-logo-BSf2RyPW.png",
      activeProduct.image,
    ].filter(Boolean);
  }, [activeProduct]);

  if (loading) return <ProductDetailsSkeleton />;

  if (apiError || !activeProduct) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h3 style={{ color: "#ef4444", fontWeight: "700" }}>{apiError || "Product Not Found"}</h3>
        <button onClick={() => navigate("/")} style={{ marginTop: "16px", background: "#318616", color: "white", border: "none", padding: "10px 20px", borderRadius: "12px", cursor: "pointer" }}>
          Go Back Home
        </button>
      </div>
    );
  }

  // Cart Qty Calculation
  const activeItems = Array.isArray(cartItems) ? cartItems : [];
  const currentCartKey = activeProduct._id + (currentWeight ? `_${currentWeight}` : "");
  const cartItem = activeItems.find(
    (item) =>
      String(item._id || item.id) === String(activeProduct._id || activeProduct.id) &&
      (item.selectedWeight === currentWeight || !item.selectedWeight)
  );
  const cartQty = cartItem ? cartItem.quantity : 0;

  return (
    <div className="page-with-bottom-nav" style={{ background: "#f7f8fa", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      <SEO 
        title={activeProduct ? activeProduct.name : "Product Details"} 
        description={activeProduct ? activeProduct.description || `Buy fresh ${activeProduct.name} online from Buyto with fast delivery.` : "View product details on Buyto."} 
        image={activeProduct ? activeProduct.image : undefined} 
      />
      {/* Top Breadcrumb */}
      <div style={{ padding: "12px 0", fontSize: "14px", color: "#6b7280", fontWeight: "500", display: "flex", gap: "6px" }}>
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>Home</span>
        <span>/</span>
        <span>{activeProduct.category}</span>
        <span>/</span>
        <span style={{ color: "#1f2937", fontWeight: "600" }}>{activeProduct.name}</span>
      </div>

      <div style={{ background: "white", borderRadius: "24px", padding: isMobile ? "16px" : "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
        {/* Main Product Layout */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr", gap: isMobile ? "24px" : "48px" }}>

          {/* LEFT COLUMN: Gallery & Zoom */}
          <div style={{ display: "flex", gap: "16px", flexDirection: isMobile ? "column-reverse" : "row" }}>
            {/* Gallery Thumbnails */}
            <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: "10px", justifyContent: "center" }}>
              {thumbnails.map((thumb, idx) => (
                <div
                  key={`${thumb}-${idx}`}
                  onClick={() => {
                    setSelectedImage(thumb);
                    setActiveTab(idx);
                  }}
                  style={{
                    width: "64px",
                    height: "64px",
                    border: activeTab === idx ? "2px solid #318616" : "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "4px",
                    cursor: "pointer",
                    background: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s"
                  }}
                >
                  <img src={thumb} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
              ))}
            </div>

            {/* Main Product Image Container */}
            <div
              onMouseMove={!isMobile ? handleMouseMove : undefined}
              onMouseEnter={!isMobile ? () => setIsZooming(true) : undefined}
              onMouseLeave={!isMobile ? () => setIsZooming(false) : undefined}
              style={{
                flexGrow: 1,
                height: isMobile ? "280px" : "420px",
                borderRadius: "16px",
                border: "1px solid #f3f4f6",
                background: "#f9fafb",
                position: "relative",
                cursor: !isMobile ? "zoom-in" : "default",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {isZooming ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${selectedImage})`,
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                    backgroundSize: "220%",
                    backgroundRepeat: "no-repeat"
                  }}
                />
              ) : (
                <img
                  src={selectedImage}
                  alt={activeProduct.name}
                  style={{
                    maxWidth: "90%",
                    maxHeight: "90%",
                    objectFit: "contain",
                    transition: "transform 0.2s"
                  }}
                  loading="eager"
                />
              )}

              {/* Discount Tag on Image */}
              {hasDiscount && (
                <div
                  style={{
                    position: "absolute",
                    top: "16px",
                    left: "16px",
                    background: "#F59E0B",
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "900"
                  }}
                >
                  {discountPercentage}% OFF
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Brand & Details Info */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span style={{ color: "#318616", fontSize: "14px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {activeProduct.brand}
              </span>

              <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: "900", color: "#111827", marginTop: "6px", marginBottom: "8px", lineHeight: "1.2" }}>
                {activeProduct.name}
              </h1>

              {/* ETA & Delivery badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#fef3c7", padding: "4px 10px", borderRadius: "20px", width: "fit-content", marginBottom: "16px" }}>
                <Clock size={14} color="#d97706" strokeWidth={2.5} />
                <span style={{ fontSize: "11px", color: "#d97706", fontWeight: "800" }}>
                  ⚡ 10 MINS DELIVERY
                </span>
              </div>

              {/* Strikethrough Price block */}
              <div style={{ borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", padding: "16px 0", marginBottom: "16px" }}>
                {activeProduct.isFestivalPrice && (
                  <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "10px 14px", borderRadius: "12px", marginBottom: "12px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "900", color: "#d97706" }}>
                      {activeProduct.pricingBadge || "🎉 Festival Price Active"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px", fontSize: "12px", color: "#475569" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Original Base Price:</span>
                        <strong>₹{activeProduct.originalPrice || currentOriginalPrice}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Pricing Rule Adjustment:</span>
                        <strong style={{ color: activeProduct.adjustmentAmount >= 0 ? "#dc2626" : "#16a34a" }}>
                          {activeProduct.adjustmentAmount >= 0 ? `+₹${activeProduct.adjustmentAmount}` : `-₹${Math.abs(activeProduct.adjustmentAmount)}`}
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #cbd5e1", paddingTop: "4px" }}>
                        <span>Festival Selling Price:</span>
                        <strong style={{ color: "#d97706" }}>₹{currentPrice}</strong>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ fontSize: "28px", fontWeight: "900", color: activeProduct.isFestivalPrice ? "#d97706" : "#111827" }}>₹{currentPrice}</span>
                  {(hasDiscount || activeProduct.isFestivalPrice) && (
                    <span style={{ fontSize: "18px", textDecoration: "line-through", color: "#9ca3af", fontWeight: "600" }}>
                      MRP: ₹{currentOriginalPrice}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0" }}>(inclusive of all taxes)</p>
              </div>

              {/* Pack Sizes Selector */}
              {activeProduct.variants && activeProduct.variants.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: "800", color: "#6b7280", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Pack Sizes
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {activeProduct.variants.map((v, idx) => (
                      <div
                        key={v._id || `${activeProduct._id}-${v.weight || idx}`}
                        onClick={() => setSelectedVariantIndex(idx)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 16px",
                          borderRadius: "14px",
                          border: selectedVariantIndex === idx ? "2px solid #318616" : "1px solid #e5e7eb",
                          background: selectedVariantIndex === idx ? "#f0fdf4" : "white",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "14px", fontWeight: "800", color: "#1f2937" }}>{v.weight}</span>
                          {v.originalPrice > v.price && (
                            <span style={{ fontSize: "11px", color: "#9ca3af", textDecoration: "line-through" }}>MRP: ₹{v.originalPrice}</span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "16px", fontWeight: "900", color: "#111827" }}>₹{v.price}</span>
                          {selectedVariantIndex === idx && (
                            <div style={{ width: "20px", height: "20px", background: "#318616", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Check size={12} color="white" style={{ margin: "auto" }} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CTA action buttons */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "16px" }}>
              {/* Wishlist Icon Button */}
              <button
                onClick={handleToggleWishlist}
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "16px",
                  border: "1.5px solid #e5e7eb",
                  background: isWishlisted ? "#fee2e2" : "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
              >
                <Heart size={20} fill={isWishlisted ? "#ef4444" : "none"} color={isWishlisted ? "#ef4444" : "#4b5563"} />
              </button>

              {/* Add to Cart button */}
              <div style={{ flexGrow: 1 }}>
                {cartQty === 0 ? (
                  <button
                    onClick={() => {
                      if (cartQty >= (activeProduct.stock || 30)) {
                        alert(`Only ${activeProduct.stock || 30} items available`);
                        return;
                      }
                      addToCart({
                        ...activeProduct,
                        selectedWeight: currentWeight,
                        price: currentPrice
                      });
                    }}
                    style={{
                      width: "100%",
                      height: "52px",
                      background: "#318616",
                      color: "white",
                      border: "none",
                      borderRadius: "16px",
                      fontSize: "15px",
                      fontWeight: "800",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 4px 12px rgba(49, 134, 22, 0.2)"
                    }}
                  >
                    <ShoppingBag size={18} />
                    ADD TO CART
                  </button>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "52px",
                      background: "#318616",
                      borderRadius: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0 16px",
                      boxSizing: "border-box"
                    }}
                  >
                    <button
                      onClick={() =>
                        removeFromCart({
                          ...activeProduct,
                          selectedWeight: currentWeight,
                          price: currentPrice
                        })
                      }
                      style={{ background: "none", border: "none", color: "white", fontSize: "24px", fontWeight: "800", cursor: "pointer", padding: "0 12px" }}
                    >
                      -
                    </button>
                    <span style={{ color: "white", fontWeight: "800", fontSize: "15px" }}>{cartQty} Items in Cart</span>
                    <button
                      onClick={() => {
                        if (cartQty >= (activeProduct.stock || 30)) {
                          alert(`Only ${activeProduct.stock || 30} items available`);
                          return;
                        }
                        addToCart({
                          ...activeProduct,
                          selectedWeight: currentWeight,
                          price: currentPrice
                        });
                      }}
                      style={{ background: "none", border: "none", color: "white", fontSize: "24px", fontWeight: "800", cursor: "pointer", padding: "0 12px" }}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Info */}
            <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px", background: "#f9fafb", borderRadius: "16px", padding: "16px", border: "1px solid #f3f4f6" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <Truck size={18} color="#4b5563" />
                <span style={{ fontSize: "13px", color: "#4b5563", fontWeight: "600" }}>Superfast delivery in 10 minutes</span>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <ShieldCheck size={18} color="#4b5563" />
                <span style={{ fontSize: "13px", color: "#4b5563", fontWeight: "600" }}>100% Quality Assurance & Safe Packing</span>
              </div>
            </div>

          </div>
        </div>

        {/* Highlights Chips */}
        <div style={{ marginTop: "32px", borderTop: "1px solid #f3f4f6", paddingTop: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1f2937", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Highlights
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {(activeProduct.highlights || []).map((h, i) => (
              <span
                key={h || i}
                style={{
                  background: "#f0fdf4",
                  color: "#166534",
                  border: "1px solid #dcfce7",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "700"
                }}
              >
                ★ {h}
              </span>
            ))}
          </div>
        </div>

        {/* Why choose Buyto? Cards */}
        <div style={{ marginTop: "32px", borderTop: "1px solid #f3f4f6", paddingTop: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1f2937", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Why choose Buyto?
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: "16px" }}>
            {[
              { title: "Quality products", desc: "You can trust", icon: <ShieldCheck size={24} color="#16a34a" /> },
              { title: "10 min delivery*", desc: "On selected locations", icon: <Clock size={24} color="#16a34a" /> },
              { title: "On time", desc: "Guarantee", icon: <ThumbsUp size={24} color="#16a34a" /> },
              { title: "Free delivery*", desc: "No extra cost", icon: <Truck size={24} color="#16a34a" /> },
              { title: "Return Policy", desc: "No Question asked", icon: <RotateCcw size={24} color="#16a34a" /> }
            ].map((card, i) => (
              <div
                key={card.title}
                style={{
                  background: "#f9fafb",
                  border: "1px solid #f3f4f6",
                  borderRadius: "16px",
                  padding: "16px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <div style={{ width: "48px", height: "48px", background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
                  {card.icon}
                </div>
                <h4 style={{ fontSize: "13px", fontWeight: "800", color: "#1f2937", margin: 0 }}>{card.title}</h4>
                <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Expandable Accordions */}
        <div style={{ marginTop: "32px", borderTop: "1px solid #f3f4f6", paddingTop: "16px" }}>
          <AccordionSection title="About the Product">
            <p>{activeProduct.description}</p>
          </AccordionSection>
          <AccordionSection title="Nutritional Information">
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "12px", marginTop: "8px" }}>
              {Object.entries(activeProduct.nutrition || {}).map(([key, val]) => (
                <div key={key} style={{ background: "#f9fafb", padding: "12px", borderRadius: "10px", border: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "700", textTransform: "uppercase" }}>{key}</span>
                  <p style={{ fontSize: "15px", color: "#1f2937", fontWeight: "800", margin: "4px 0 0 0" }}>{val}</p>
                </div>
              ))}
            </div>
          </AccordionSection>
          <AccordionSection title="Storage Information">
            <p>{activeProduct.storage}</p>
          </AccordionSection>
          <AccordionSection title="Product Details">
            <p style={{ margin: 0 }}><strong>Category:</strong> {activeProduct.category}</p>
            <p style={{ marginTop: "8px", margin: 0 }}><strong>Seller:</strong> Buyto Retail Logistics</p>
          </AccordionSection>
          <AccordionSection title="Disclaimer">
            <p style={{ fontStyle: "italic" }}>{activeProduct.disclaimer}</p>
          </AccordionSection>
        </div>

        {/* Frequently Bought Together Bundle */}
        {frequentlyBoughtTogether.length > 0 && (
          <div style={{ marginTop: "40px", background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "20px", padding: "24px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#166534", marginBottom: "16px" }}>
              Frequently Bought Together
            </h3>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
              {/* Active Product */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "white", padding: "10px 16px", borderRadius: "14px", border: "1px solid #e5e7eb" }}>
                <img src={activeProduct.image} alt="" style={{ width: "40px", height: "40px", objectFit: "contain" }} />
                <div>
                  <h4 style={{ fontSize: "13px", fontWeight: "800", margin: 0 }}>{activeProduct.name}</h4>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>₹{currentPrice}</span>
                </div>
              </div>

              {frequentlyBoughtTogether.map((p, i) => (
                <React.Fragment key={p._id || p.id}>
                  <Plus size={20} color="#166534" strokeWidth={3} />
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "white", padding: "10px 16px", borderRadius: "14px", border: "1px solid #e5e7eb" }}>
                    <img src={p.image} alt="" style={{ width: "40px", height: "40px", objectFit: "contain" }} />
                    <div>
                      <h4 style={{ fontSize: "13px", fontWeight: "800", margin: 0 }}>{p.name}</h4>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>₹{p.price}</span>
                    </div>
                  </div>
                </React.Fragment>
              ))}

              {/* Total & Action */}
              <div style={{ marginLeft: isMobile ? "0" : "auto", display: "flex", alignItems: "center", gap: "16px", marginTop: isMobile ? "12px" : "0" }}>
                <div>
                  <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>Bundle Price</p>
                  <p style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#166534" }}>₹{fbtTotalPrice}</p>
                </div>
                <button
                  onClick={handleAddAllFbt}
                  style={{
                    background: "#16a34a",
                    color: "white",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "14px",
                    fontWeight: "800",
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(22, 163, 74, 0.15)"
                  }}
                >
                  Add Bundle to Cart
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RELATED PRODUCTS ("You may also like") */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: "40px", borderTop: "1px solid #f3f4f6", paddingTop: "24px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#1f2937", marginBottom: "16px" }}>
              You may also like
            </h3>
            {isMobile ? (
              // Horizontally scrollable list on mobile
              <div className="hide-scrollbar" style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "10px" }}>
                {relatedProducts.map((prod) => (
                  <MobileProductCard
                    key={prod._id || prod.id}
                    product={prod}
                    addToCart={addToCart}
                    removeFromCart={removeFromCart}
                    cartItems={cartItems}
                    setSelectedProduct={setSelectedProduct}
                  />
                ))}
              </div>
            ) : (
              // Grid on desktop
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
                {relatedProducts.map((prod) => (
                  <ProductCard
                    key={prod._id || prod.id}
                    product={prod}
                    addToCart={addToCart}
                    removeFromCart={removeFromCart}
                    cart={cart}
                    cartItems={cartItems}
                    windowWidth={windowWidth}
                    getCartKey={getCartKey}
                    setSelectedProduct={setSelectedProduct}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recently Viewed Products */}
        {recentlyViewed.length > 0 && (
          <div style={{ marginTop: "40px", borderTop: "1px solid #f3f4f6", paddingTop: "24px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#1f2937", marginBottom: "16px" }}>
              Recently Viewed
            </h3>
            <div className="hide-scrollbar" style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "10px" }}>
              {recentlyViewed.map((prod) => (
                <MobileProductCard
                  key={prod._id || prod.id}
                  product={prod}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  cartItems={cartItems}
                  setSelectedProduct={setSelectedProduct}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Sticky Bottom CTA for Mobile */}
      {isMobile && cartQty === 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "0",
            left: "0",
            right: "0",
            background: "white",
            padding: "12px 16px",
            boxShadow: "0 -4px 15px rgba(0,0,0,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 9999
          }}
        >
          <div>
            <span style={{ fontSize: "18px", fontWeight: "900", color: "#1f2937" }}>₹{currentPrice}</span>
            <span style={{ fontSize: "11px", color: "#6b7280", display: "block" }}>{currentWeight}</span>
          </div>
          <button
            onClick={() =>
              addToCart({
                ...activeProduct,
                selectedWeight: currentWeight,
                price: currentPrice
              })
            }
            style={{
              background: "#318616",
              color: "white",
              border: "none",
              padding: "10px 24px",
              borderRadius: "12px",
              fontWeight: "800",
              fontSize: "14px",
              boxShadow: "0 4px 10px rgba(49, 134, 22, 0.15)"
            }}
          >
            Add to Cart
          </button>
        </div>
      )}

      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: "100px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(30, 41, 59, 0.95)",
            color: "white",
            padding: "10px 20px",
            borderRadius: "999px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            zIndex: 99999,
            fontSize: "13px",
            fontWeight: "600",
            pointerEvents: "none",
            textAlign: "center"
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}