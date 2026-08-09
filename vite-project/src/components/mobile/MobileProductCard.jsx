import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getOptimizedImageUrl } from "../../utils/imageOptimizer";
import { useTheme } from "../../context/ThemeContext";

function MobileProductCard({
  product,
  addToCart,
  removeFromCart,
  cartItems,
  setSelectedProduct,
  searchQuery = "",
}) {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  if (!product) return null;

  const productId = product._id || product.id;
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
  const cartItem = activeItems.find(
    (item) => String(item._id || item.id) === String(productId)
  );
  const quantity = cartItem ? cartItem.quantity : 0;

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
      alert(`Only ${maxAvailable} items available`);
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
          <img
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

      {/* Add / Qty button at the bottom */}
      <div style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "26px",
        position: "relative",
        marginTop: "4px"
      }}>
        <style>{`
          @keyframes buytoLineGrow {
            0% {
              transform: scaleX(0.015) scaleY(0);
              opacity: 1;
            }
            33% {
              transform: scaleX(0.015) scaleY(1);
              opacity: 1;
            }
            77% {
              transform: scaleX(1) scaleY(1);
              opacity: 1;
            }
            100% {
              transform: scaleX(1) scaleY(1);
              opacity: 0;
            }
          }
          @keyframes buytoContainerBg {
            0% {
              background-color: white;
              border-color: #318616;
            }
            77% {
              background-color: white;
              border-color: #318616;
            }
            100% {
              background-color: #318616;
              border-color: #318616;
            }
          }
          @keyframes buytoTextFade {
            0% {
              opacity: 1;
            }
            33% {
              opacity: 1;
            }
            77% {
              opacity: 0;
              transform: scale(0.9);
            }
            100% {
              opacity: 0;
              transform: scale(0.9);
            }
          }
          @keyframes buytoQtySelectorFade {
            0% {
              opacity: 0;
              transform: translateY(5px);
            }
            77% {
              opacity: 0;
              transform: translateY(5px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
        <div
          style={{
            width: (quantity === 0 && !isAnimating) ? "64px" : "100%",
            height: "26px",
            position: "relative",
            transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            borderRadius: "6px",
            overflow: "hidden",
            border: isOutOfStock ? (isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #d1d5db") : "1px solid #318616",
            backgroundColor: isOutOfStock ? (isDark ? "var(--bg-secondary)" : "#f3f4f6") : ((quantity > 0 && !isAnimating) ? "#318616" : (isDark ? "var(--bg-card)" : "white")),
            animation: isAnimating ? "buytoContainerBg 450ms forwards ease-out" : "none",
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

          {/* ADD Button */}
          {isOutOfStock ? (
            <button
              disabled
              style={{
                position: "absolute",
                inset: 0,
                background: "transparent",
                border: "none",
                color: "#9ca3af",
                borderRadius: "6px",
                fontSize: "8px",
                fontWeight: "900",
                cursor: "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 3,
                boxSizing: "border-box",
              }}
            >
              OOS
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
                borderRadius: "6px",
                fontSize: "10px",
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
              ADD
            </button>
          ))}

          {/* Qty Selector */}
          {!isOutOfStock && (quantity > 0 || isAnimating) && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 6px",
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
                  fontSize: "14px",
                  fontWeight: "900",
                  cursor: "pointer",
                  width: "16px",
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
                  fontSize: "10px",
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
                  fontSize: "14px",
                  fontWeight: "900",
                  cursor: "pointer",
                  width: "16px",
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
  );
}

export default React.memo(MobileProductCard);
