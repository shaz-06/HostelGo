import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getOptimizedImageUrl } from "../../utils/imageOptimizer";
import { useTheme } from "../../context/ThemeContext";
import { AuthContext } from "../../context/AuthContext";
import { isProductSensitive } from "../../utils/productPrivacy";
import { UIContext } from '../../context/UIContext';

function MobileProductCard({
  product,
  addToCart,
  removeFromCart,
  cartItems,
  quantity: propQuantity,
  setSelectedProduct,
  searchQuery = "",
}) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { hideSensitive } = useContext(UIContext);
  const [isRevealed, setIsRevealed] = useState(false);

  // Support both backend/database 'id' and frontend '_id'
  const productId = product?._id || product?.id || String(Math.random());

  useEffect(() => {
    setIsRevealed(false);
  }, [productId]);

  if (!product) return null;
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const isOutOfStock = hasVariants
    ? product.variants.every(v => v.stock === undefined ? false : v.stock <= 0)
    : (product.stock !== undefined && product.stock <= 0);

  const price = product.price !== undefined && product.price !== null
    ? product.price
    : (hasVariants && product.variants[0] ? product.variants[0].price : 0);

  const originalPrice = product.originalPrice !== undefined && product.originalPrice !== null
    ? product.originalPrice
    : (hasVariants && product.variants[0] && product.variants[0].originalPrice !== undefined
      ? product.variants[0].originalPrice
      : price);

  const weight = product.weight || (hasVariants && product.variants[0] ? product.variants[0].weight : "");
  const defaultWeight = hasVariants && product.variants[0] ? product.variants[0].weight : "";

  const activeItems = Array.isArray(cartItems) ? cartItems : [];
  const productIds = new Set(
    [product._id, product.id, product.productId]
      .filter((id) => id !== undefined && id !== null)
      .map(String),
  );
  const cartItem = activeItems.find((item) => {
    const itemIds = [
      item._id,
      item.id,
      item.productId,
      item.product?._id,
      item.product?.id,
      item.product?.productId,
    ]
      .filter((id) => id !== undefined && id !== null)
      .map(String);
    const itemWeight = item.selectedWeight || "";
    return itemIds.some((id) => productIds.has(id)) && itemWeight === defaultWeight;
  });
  const quantity = propQuantity !== undefined ? propQuantity : (cartItem ? cartItem.quantity : 0);

  const hasDiscount = originalPrice > price;
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  // Map category to a soft pastel background tint
  const getPastelBg = (category) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("fruit")) return "#fff5f5"; // light pink/red
    if (cat.includes("veggie") || cat.includes("vegetable")) return "#eefaf2"; // light green
    if (cat.includes("dairy") || cat.includes("milk") || cat.includes("bread")) return "#f0f7ff"; // light blue
    if (cat.includes("snack") || cat.includes("munchies")) return "#fff1f2"; // light red/pink
    if (cat.includes("drink") || cat.includes("beverage")) return "#f0fdf4"; // light green/cyan
    if (cat.includes("meat") || cat.includes("fish") || cat.includes("seafood")) return "#fff7ed"; // light orange
    return "#fafaf9"; // light grey/beige
  };

  const cardBg = getPastelBg(product.category);

  const handleCardClick = () => {
    navigate(`/product/${productId}`);
  };

  const [prevQty, setPrevQty] = useState(quantity);
  const [isAnimatingQty, setIsAnimatingQty] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (quantity !== prevQty) {
      setIsAnimatingQty(true);
      const timer = setTimeout(() => setIsAnimatingQty(false), 200);
      setPrevQty(quantity);
      return () => clearTimeout(timer);
    }
  }, [quantity, prevQty]);

  const handleButtonClick = (e) => {
    e.stopPropagation();
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(15);
    }
    if (quantity === 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    }
    handleAdd(e);
  };

  const handleDecreaseClick = (e) => {
    e.stopPropagation();
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
    handleDecrease(e);
  };

  const handleIncreaseClick = (e) => {
    e.stopPropagation();
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
    handleAdd(e); // Mobile uses handleAdd for increase
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    const productToCart = {
      ...product,
      selectedWeight: defaultWeight,
      price: product.variants && product.variants[0] ? product.variants[0].price : product.price
    };

    const maxAvailable = hasVariants
      ? (product.variants[0] && product.variants[0].stock !== undefined ? product.variants[0].stock : 30)
      : (product.stock !== undefined ? product.stock : 30);
    if (quantity >= maxAvailable) {
      window.dispatchEvent(new CustomEvent("showGlobalToast", {
        detail: { message: `Only ${maxAvailable} items available` }
      }));
      return;
    }

    if (product.variants && product.variants.length > 1 && setSelectedProduct) {
      setSelectedProduct(product);
    } else if (addToCart) {
      addToCart(productToCart);
    }
  };

  const handleDecrease = (e) => {
    e.stopPropagation();
    const productToCart = {
      ...product,
      selectedWeight: defaultWeight,
      price: product.variants && product.variants[0] ? product.variants[0].price : product.price
    };

    if (removeFromCart) {
      removeFromCart(productToCart);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      style={{
        background: isDark ? "var(--bg-card)" : "white",
        borderRadius: "12px",
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        position: "relative",
        width: "120px",
        height: "210px",
        boxSizing: "border-box",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        flexShrink: 0,
        boxShadow: isDark ? "0 4px 10px rgba(0,0,0,0.3)" : "0 2px 6px rgba(0,0,0,0.02)",
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f0f0f0",
      }}
    >
      <div>
        {/* Product Image Area */}
        <div
          style={{
            width: "100%",
            height: "75px",
            background: isDark ? "var(--bg-secondary)" : "#f9fafb",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            padding: "4px",
            boxSizing: "border-box",
          }}
        >
          {isOutOfStock && (
            <span style={{
              position: "absolute",
              zIndex: 10,
              background: "#ef4444",
              color: "white",
              padding: "2px 4px",
              borderRadius: "4px",
              fontSize: "8px",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              boxShadow: "0 1.5px 4px rgba(239, 68, 68, 0.3)"
            }}>
              Out of Stock
            </span>
          )}
          {isProductSensitive(product) && hideSensitive && !isRevealed ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsRevealed(true);
              }}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: isDark ? "rgba(17, 24, 39, 0.95)" : "rgba(249, 250, 251, 0.98)",
                borderRadius: "8px",
                padding: "4px",
                boxSizing: "border-box",
                cursor: "pointer",
                userSelect: "none",
                zIndex: 10
              }}
            >
              <div style={{ fontSize: "12px", marginBottom: "2px" }}>🔒</div>
              <div style={{ fontSize: "8px", fontWeight: "900", color: isDark ? "#F3F4F6" : "#1F2937", textAlign: "center", lineHeight: "1" }}>
                Sensitive Product
              </div>
              <div style={{ fontSize: "6px", fontWeight: "800", color: "#318616", marginTop: "2px", textDecoration: "underline" }}>
                Tap to view
              </div>
            </div>
          ) : (
            <img loading="lazy" decoding="async"
              src={getOptimizedImageUrl(product.image, "thumbnail", product)}
              alt={product.name}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: "6px",
                filter: isOutOfStock ? "grayscale(40%) opacity(0.6)" : "none",
              }}
              loading="lazy"
            />
          )}
          {/* ADD/Quantity Selector overlapping the bottom-right edge of the image container */}
          <div style={{
            position: "absolute",
            bottom: "-8px",
            right: "6px",
            zIndex: 30,
            boxSizing: "border-box",
          }} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                width: (quantity === 0 && !isAnimating) ? "54px" : "64px",
                height: "22px",
                position: "relative",
                transition: "all 200ms ease-in-out",
                borderRadius: "6px",
                overflow: "hidden",
                border: isOutOfStock ? "1px solid #d1d5db" : "1px solid #318616",
                backgroundColor: isOutOfStock ? "#f3f4f6" : ((quantity > 0 && !isAnimating) ? "#318616" : "white"),
                boxShadow: "0 1.5px 4px rgba(0,0,0,0.06)",
                boxSizing: "border-box",
                willChange: "width, background-color, border-color",
              }}
            >
              {/* Custom rising line element */}
              {isAnimating && (
                <div style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  background: "#318616",
                  transformOrigin: "bottom center",
                  animation: "buytoLineGrow 450ms forwards cubic-bezier(0.25, 1, 0.5, 1)",
                  zIndex: 2,
                  willChange: "transform, opacity",
                }} />
              )}

              {/* ADD or Options Button */}
              {isOutOfStock ? (
                <button
                  disabled
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "transparent",
                    border: "none",
                    color: "#9ca3af",
                    fontSize: "7px",
                    fontWeight: "900",
                    cursor: "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 3,
                    boxSizing: "border-box",
                  }}
                >
                  OUT
                </button>
              ) : ((quantity === 0 || isAnimating) && (
                <button
                  onClick={handleButtonClick}
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "transparent",
                    border: "none",
                    color: "#318616",
                    fontSize: "8.5px",
                    fontWeight: "900",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 3,
                    pointerEvents: quantity === 0 ? "auto" : "none",
                    animation: isAnimating ? "buytoTextFade 450ms forwards ease-in-out" : "none",
                    boxSizing: "border-box",
                  }}
                  className="active:scale-95"
                >
                  {hasVariants ? (
                    <span style={{ fontSize: "7px", fontWeight: "800", whiteSpace: "nowrap" }}>
                      {product.variants.length} options
                    </span>
                  ) : "ADD"}
                </button>
              ))}

              {/* Quantity Selector */}
              {(quantity > 0 || isAnimating) && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 3px",
                    boxSizing: "border-box",
                    zIndex: 4,
                    animation: isAnimating ? "buytoQtySelectorFade 450ms forwards cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
                    opacity: isAnimating ? 0 : 1,
                  }}
                >
                  <button
                    onClick={handleDecreaseClick}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "white",
                      fontSize: "11px",
                      fontWeight: "900",
                      cursor: "pointer",
                      width: "14px",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 100ms ease",
                    }}
                    className="active:scale-75"
                  >
                    -
                  </button>
                  <span
                    style={{
                      color: "white",
                      fontWeight: "900",
                      fontSize: "9px",
                      display: "inline-block",
                      transform: isAnimatingQty ? "scale(1.2)" : "scale(1)",
                      transition: "transform 150ms cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    }}
                  >
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncreaseClick}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "white",
                      fontSize: "11px",
                      fontWeight: "900",
                      cursor: "pointer",
                      width: "14px",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 100ms ease",
                    }}
                    className="active:scale-75"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Discount Badge & Price */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", marginTop: "6px" }}>
          {hasDiscount && (
            <span style={{ color: "#318616", fontWeight: "800", fontSize: "8px", textTransform: "uppercase" }}>
              {discountPercentage}% OFF
            </span>
          )}
          <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
            <span style={{ fontWeight: "900", fontSize: "12px", color: isDark ? "var(--text-primary)" : "#1f2937" }}>
              ₹{price}
            </span>
            {originalPrice > price && (
              <span style={{ textDecoration: "line-through", color: isDark ? "var(--text-secondary)" : "#9ca3af", fontSize: "10px", fontWeight: "500" }}>
                ₹{originalPrice}
              </span>
            )}
          </div>
        </div>

        {/* Brand name (subtle grey text) */}
        <div style={{ fontSize: "8px", color: isDark ? "var(--text-secondary)" : "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.2px", marginTop: "4px" }}>
          {product.brand || "Buyto Fresh"}
        </div>

        {/* Product Name */}
        <span
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: isDark ? "var(--text-primary)" : "#1f2937",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            height: "28px",
            margin: "2px 0",
            lineHeight: "14px",
          }}
        >
          {searchQuery && searchQuery.trim() !== "" ? (
            product.name.split(new RegExp(`(${searchQuery.trim()})`, "gi")).map((part, pIdx) =>
              part.toLowerCase() === searchQuery.trim().toLowerCase() ? (
                <span key={pIdx} style={{ background: "#fef08a", color: "#15803d", padding: "0 2px", borderRadius: "3px", fontWeight: "900" }}>
                  {part}
                </span>
              ) : (
                part
              )
            )
          ) : (
            product.name
          )}
        </span>

        {/* Weight selector */}
        <span
          style={{
            fontSize: "9px",
            color: isDark ? "var(--text-secondary)" : "#6b7280",
            fontWeight: "700",
            display: "block",
            marginTop: "2px",
          }}
        >
          {weight}
        </span>
      </div>
    </div>
  );
}

export default React.memo(MobileProductCard);
