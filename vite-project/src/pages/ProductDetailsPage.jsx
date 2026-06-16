import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductCard from "../ProductCard";
import { cachedFetch } from "../utils/apiCache";
import { usePerfLogger } from "../utils/perfLogger";
import { AuthContext } from "../context/AuthContext";

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

  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const saved = localStorage.getItem("buyto_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [toastMsg, setToastMsg] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [isSavedIconAnimating, setIsSavedIconAnimating] = useState(false);
  const toastTimeoutRef = useRef(null);

  const isSaved = Array.isArray(saveForLaterIds) && activeProduct && saveForLaterIds.includes(String(activeProduct._id || activeProduct.id));
  const isWishlisted = wishlistIds.includes(id);

  const handleToggleWishlist = () => {
    let updated;
    if (isWishlisted) {
      updated = wishlistIds.filter((item) => item !== id);
    } else {
      updated = [...wishlistIds, id];
    }
    setWishlistIds(updated);
    localStorage.setItem("buyto_wishlist", JSON.stringify(updated));
  };

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

  const handleAddToList = () => {
    try {
      const active = localStorage.getItem("shoppingListItems");
      const list = active ? JSON.parse(active) : [];
      list.push({ name: activeProduct.name, completed: false });
      localStorage.setItem("shoppingListItems", JSON.stringify(list));
      setToastMsg("✓ Added to Shopping List!");
      setShowActions(false);
      setTimeout(() => setToastMsg(""), 2000);
    } catch (err) {
      console.error(err);
    }
  };

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

  useEffect(() => {
    if (products && products.length > 0) {
      setAllProducts(products);
    }
  }, [products]);

  useEffect(() => {
    let found = null;
    if (products && products.length > 0) {
      found = products.find((p) => p._id === id || p.id === id);
    }
    if (found) {
      setActiveProduct(enrichProduct(found));
      setLoading(false);
    } else {
      setLoading(true);
      console.log("=== DETAILS API FETCH INITIATED ===", window.API_BASE_URL + "/api/products");
      cachedFetch(window.API_BASE_URL + "/api/products")
        .then((data) => {
          console.log("=== DETAILS API FETCH SUCCESS ===", data.length, "products loaded");
          setAllProducts(data);
          const item = data.find((p) => p._id === id || p.id === id);
          if (item) {
            setActiveProduct(enrichProduct(item));
          }
          setApiError(null);
          setLoading(false);
        })
        .catch((err) => {
          console.error("=== DETAILS API FETCH FAILED ===", err);
          setApiError(`Failed to load product details: ${err.message}`);
          setLoading(false);
        });
    }
  }, [id, products]);

  // Similar Products Filter (same category, excluding current product)
  const similarProducts = activeProduct
    ? allProducts.filter(p => p.category === activeProduct.category && (p._id !== activeProduct._id && p.id !== activeProduct.id)).slice(0, 4)
    : [];

  const renderProductCard = (prod) => (
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
  );

  if (apiError) {
    return (
      <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.03)", marginTop: "24px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#318616",
            fontWeight: "700",
            fontSize: "15px",
            cursor: "pointer",
            border: "none",
            background: "none",
            padding: 0,
          }}
        >
          ← Back
        </button>
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            borderRadius: "16px",
            padding: "16px",
            color: "#991b1b",
            textAlign: "left",
            fontFamily: "'Outfit', 'Inter', sans-serif"
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⚠️</span> Connection Error
          </h3>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: "500", opacity: 0.9 }}>
            {apiError}. Resolved URL: {window.API_BASE_URL}/api/products
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#4b5563" }}>
          Loading Product Details...
        </h2>
      </div>
    );
  }

  if (!activeProduct) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#ef4444" }}>
          Product Not Found
        </h2>
        <button
          onClick={() => navigate("/")}
          onMouseOver={(e) => (e.currentTarget.style.background = "#286f12")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#318616")}
          style={{
            marginTop: "16px",
            background: "#318616",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "12px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "white", borderRadius: "24px", padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.03)", marginTop: "24px" }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        onMouseOver={(e) => (e.currentTarget.style.color = "#286f12")}
        onMouseOut={(e) => (e.currentTarget.style.color = "#318616")}
        style={{
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#318616",
          fontWeight: "700",
          fontSize: "15px",
          cursor: "pointer",
          border: "none",
          background: "none",
          padding: 0,
          transition: "color 0.2s",
        }}
      >
        ← Back
      </button>

      <div style={{ display: "grid", gridTemplateColumns: windowWidth < 768 ? "1fr" : "1fr 1fr", gap: "32px" }}>
        {/* Left Column: Big Image & Top-Right Button */}
        <div style={{ position: "relative", height: "fit-content" }}>
          <img
            src={getOptimizedImageUrl(activeProduct.image, "full")}
            fetchpriority="high"
            loading="eager"
            alt={activeProduct.name}
            style={{
              width: "100%",
              height: windowWidth < 768 ? "280px" : "360px",
              objectFit: "contain",
              borderRadius: "16px",
              border: "1px solid #f3f4f6",
              background: "#f9fafb",
            }}
          />

          {/* Floating Overlay Button */}
          {(() => {
            const currentWeight = activeProduct.variants && activeProduct.variants[selectedVariantIndex]
              ? activeProduct.variants[selectedVariantIndex].weight
              : activeProduct.weight;

            const productToCart = {
              ...activeProduct,
              selectedWeight: currentWeight,
              price: activeProduct.variants && activeProduct.variants[selectedVariantIndex]
                ? activeProduct.variants[selectedVariantIndex].price
                : activeProduct.price
            };

            const cartItem = cartItems.find(
              (item) =>
                String(item._id || item.id) ===
                String(productToCart._id || productToCart.id)
            );
            const quantity = cartItem ? cartItem.quantity : 0;

            return quantity === 0 ? (
              <button
                onClick={() => {
                  if (quantity >= activeProduct.stock) {
                    alert(`Only ${activeProduct.stock} items available`);
                    return;
                  }
                  addToCart(productToCart);
                }}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "white",
                  border: "2px solid #318616",
                  color: "#318616",
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  fontSize: "24px",
                  fontWeight: "bold",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                +
              </button>
            ) : (
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  display: "flex",
                  alignItems: "center",
                  background: "white",
                  border: "1px solid #318616",
                  borderRadius: "12px",
                  height: "48px",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              >
                <button
                  onClick={() => removeFromCart(productToCart)}
                  style={{
                    width: "40px",
                    height: "100%",
                    background: "white",
                    border: "none",
                    color: "#318616",
                    fontSize: "20px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  -
                </button>
                <span style={{ color: "#318616", fontWeight: "800", fontSize: "16px", padding: "0 8px", minWidth: "20px", textAlign: "center" }}>
                  {quantity}
                </span>
                <button
                  onClick={() => {
                    if (quantity >= activeProduct.stock) {
                      alert(`Only ${activeProduct.stock} items available`);
                      return;
                    }
                    addToCart(productToCart);
                  }}
                  style={{
                    width: "40px",
                    height: "100%",
                    background: "white",
                    border: "none",
                    color: "#318616",
                    fontSize: "20px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  +
                </button>
              </div>
            );
          })()}
        </div>

        {/* Right Column: Details Info */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <span style={{ background: "#EBF5EA", color: "#318616", fontSize: "12px", fontWeight: "700", padding: "6px 12px", borderRadius: "9999px", textTransform: "uppercase", tracking: "wider" }}>
              {activeProduct.category}
            </span>

            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#1f2937", marginTop: "12px", marginBottom: "8px", lineHeight: "1.2" }}>
              {activeProduct.name}
            </h2>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", background: "#f3f4f6", padding: "6px 12px", borderRadius: "12px", width: "fit-content" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#318616" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <p style={{ fontSize: "11px", color: "#6b7280", fontWeight: "700", margin: 0 }}>
                30 MINS DELIVERY
              </p>
            </div>

            {/* Variant Selector */}
            {activeProduct.variants && activeProduct.variants.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: "700", color: "#9ca3af", uppercase: "true", letterSpacing: "1px", marginBottom: "8px" }}>SELECT VARIANT</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {activeProduct.variants.map((variant, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariantIndex(idx)}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "12px",
                        border: selectedVariantIndex === idx ? "1.5px solid #318616" : "1px solid #e5e7eb",
                        background: selectedVariantIndex === idx ? "#EBF5EA" : "white",
                        color: selectedVariantIndex === idx ? "#318616" : "#4b5563",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "0.2s",
                      }}
                    >
                      {variant.weight} — ₹{variant.price}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price and Discount Info */}
            {(() => {
              const currentPrice = activeProduct.variants && activeProduct.variants[selectedVariantIndex]
                ? activeProduct.variants[selectedVariantIndex].price
                : activeProduct.price;
              const currentOriginalPrice = activeProduct.variants && activeProduct.variants[selectedVariantIndex]
                ? activeProduct.variants[selectedVariantIndex].originalPrice
                : activeProduct.originalPrice;
              const currentWeight = activeProduct.variants && activeProduct.variants[selectedVariantIndex]
                ? activeProduct.variants[selectedVariantIndex].weight
                : activeProduct.weight;

              const hasDiscount = currentOriginalPrice > currentPrice;
              const discountPercent = hasDiscount
                ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
                : 0;

              return (
                <>
                  <div style={{ marginTop: "16px" }}>
                    {hasDiscount && (
                      <p style={{ color: "#00a05a", fontWeight: "700", fontSize: "14px", margin: "0 0 4px 0" }}>
                        {discountPercent}% OFF
                      </p>
                    )}

                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                      <span style={{ fontWeight: "800", fontSize: "28px", color: "#1f2937" }}>
                        ₹{currentPrice}
                      </span>
                      {hasDiscount && (
                        <span style={{ textDecoration: "line-through", color: "#9ca3af", fontSize: "18px" }}>
                          ₹{currentOriginalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Weight & Stock info */}
                  <div style={{ marginTop: "12px", fontSize: "13px", color: "#6b7280" }}>
                    <p style={{ margin: 0, fontWeight: "500" }}>
                      Weight: <span style={{ color: "#1f2937", fontWeight: "700" }}>{currentWeight}</span> | Stock: <span style={{ color: "#1f2937", fontWeight: "700" }}>{activeProduct.stock} left</span>
                    </p>
                  </div>
                </>
              );
            })()}

            {/* Description */}
            <div style={{ marginTop: "16px", borderTop: "1px solid #f3f4f6", paddingTop: "16px" }}>
              <h3 style={{ fontSize: "12px", fontWeight: "700", color: "#9ca3af", letterSpacing: "1px", margin: 0 }}>DESCRIPTION</h3>
              <p style={{ color: "#4b5563", fontSize: "14px", marginTop: "6px", lineHeight: "1.6" }}>
                {activeProduct.description}
              </p>
            </div>

            {/* Highlights */}
            {activeProduct.highlights && Array.isArray(activeProduct.highlights) && activeProduct.highlights.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: "700", color: "#9ca3af", letterSpacing: "1px", marginBottom: "8px" }}>HIGHLIGHTS</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {activeProduct.highlights.map((h, i) => (
                    <span key={i} style={{ background: "#f0fdf4", color: "#15803d", fontSize: "12px", fontWeight: "700", padding: "6px 12px", borderRadius: "8px" }}>
                      ✓ {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Nutrition */}
            {activeProduct.nutrition && typeof activeProduct.nutrition === "object" && Object.keys(activeProduct.nutrition).length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <h3 style={{ fontSize: "12px", fontWeight: "700", color: "#9ca3af", letterSpacing: "1px", marginBottom: "8px" }}>NUTRITION INFO (approx.)</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                  {Object.entries(activeProduct.nutrition).map(([key, val]) => (
                    <div key={key} style={{ background: "#f9fafb", borderRadius: "12px", padding: "10px", textAlign: "center", border: "1px solid #f3f4f6" }}>
                      <p style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "700", textTransform: "uppercase", margin: 0 }}>{key}</p>
                      <p style={{ fontSize: "13px", color: "#1f2937", fontWeight: "800", marginTop: "4px", margin: 0 }}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Button */}
          <div style={{ marginTop: "24px", borderTop: "1px solid #f3f4f6", paddingTop: "16px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", width: "100%" }}>
              {/* Wishlist Button */}
              <button
                onClick={handleToggleWishlist}
                style={{
                  flex: "0 0 52px",
                  height: "52px",
                  borderRadius: "16px",
                  border: "1.5px solid #f3f4f6",
                  background: isWishlisted ? "#fee2e2" : "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                }}
                title="Wishlist"
              >
                {isWishlisted ? "❤️" : "♡"}
              </button>

              {/* Save For Later Button */}
              <button
                onClick={handleToggleSaveForLater}
                style={{
                  flex: "0 0 52px",
                  height: "52px",
                  borderRadius: "16px",
                  border: "1.5px solid #f3f4f6",
                  background: isSaved ? "#ebf5ea" : "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 150ms ease, background 0.2s ease, border 0.2s ease",
                  transform: isSavedIconAnimating ? "scale(1.15)" : "scale(1)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                }}
                title="Save for Later"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={isSaved ? "#10b981" : "none"}
                  stroke={isSaved ? "#10b981" : "#94a3b8"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>

              {/* Cart Button wrapper */}
              <div style={{ flexGrow: 1 }}>
                {(() => {
                  const currentWeight = activeProduct.variants && activeProduct.variants[selectedVariantIndex]
                    ? activeProduct.variants[selectedVariantIndex].weight
                    : activeProduct.weight;

                  const productToCart = {
                    ...activeProduct,
                    selectedWeight: currentWeight,
                    price: activeProduct.variants && activeProduct.variants[selectedVariantIndex]
                      ? activeProduct.variants[selectedVariantIndex].price
                      : activeProduct.price
                  };

                  const cartItem = cartItems.find(
                    (item) =>
                      String(item._id || item.id) ===
                      String(productToCart._id || productToCart.id)
                  );
                  const quantity = cartItem ? cartItem.quantity : 0;

                  return quantity === 0 ? (
                    <button
                      onClick={() => {
                        if (quantity >= activeProduct.stock) {
                          alert(`Only ${activeProduct.stock} items available`);
                          return;
                        }
                        addToCart(productToCart);
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "#286f12")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "#318616")}
                      style={{
                        background: "#318616",
                        color: "white",
                        width: "100%",
                        padding: "16px",
                        borderRadius: "16px",
                        border: "none",
                        fontWeight: "bold",
                        fontSize: "15px",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(49, 134, 22, 0.15)",
                        transition: "all 0.2s",
                        height: "52px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      ADD TO CART
                    </button>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#318616",
                        borderRadius: "16px",
                        width: "100%",
                        overflow: "hidden",
                        boxShadow: "0 4px 12px rgba(49, 134, 22, 0.15)",
                        height: "52px"
                      }}
                    >
                      <button
                        onClick={() => removeFromCart(productToCart)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "white",
                          fontSize: "24px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          padding: "0 24px",
                          height: "100%"
                        }}
                      >
                        -
                      </button>
                      <span style={{ color: "white", fontWeight: "800", fontSize: "15px" }}>
                        {quantity} Items In Cart
                      </span>
                      <button
                        onClick={() => {
                          if (quantity >= activeProduct.stock) {
                            alert(`Only ${activeProduct.stock} items available`);
                            return;
                          }
                          addToCart(productToCart);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "white",
                          fontSize: "24px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          padding: "0 24px",
                          height: "100%"
                        }}
                      >
                        +
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {toastMsg && (
        <>
          <style>{`
            @keyframes toastSlideUp {
              0% { transform: translate(-50%, 10px); opacity: 0; }
              15% { transform: translate(-50%, 0); opacity: 1; }
              85% { transform: translate(-50%, 0); opacity: 1; }
              100% { transform: translate(-50%, -10px); opacity: 0; }
            }
          `}</style>
          <div
            style={{
              position: "fixed",
              bottom: (cartItems && cartItems.reduce((sum, item) => sum + item.quantity, 0) > 0) ? "130px" : "90px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(30, 41, 59, 0.95)",
              color: "white",
              padding: "10px 20px",
              borderRadius: "999px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
              zIndex: 99999,
              fontFamily: "'Outfit', sans-serif",
              fontSize: "13px",
              fontWeight: "600",
              pointerEvents: "none",
              animation: "toastSlideUp 1500ms ease-in-out forwards",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              whiteSpace: "nowrap"
            }}
          >
            {toastMsg}
          </div>
        </>
      )}

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div style={{ marginTop: "32px", borderTop: "1px solid #f3f4f6", paddingTop: "24px" }}>
          <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#1f2937", marginBottom: "16px" }}>
            Similar Products
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                windowWidth < 768
                  ? "repeat(2, 1fr)"
                  : windowWidth < 1024
                    ? "repeat(4, 1fr)"
                    : "repeat(4, 1fr)",
              gap: windowWidth < 768 ? "12px" : "20px",
            }}
          >
            {similarProducts.map(renderProductCard)}
          </div>
        </div>
      )}
    </div>
  );
}