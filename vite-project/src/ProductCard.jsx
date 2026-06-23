import React, { useState, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getOptimizedImageUrl } from "./utils/imageOptimizer";
import { AuthContext } from "./context/AuthContext";

const BookmarkIcon = ({ filled, color }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill={filled ? color : "none"}
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const bookmarkBtnStyle = (isSaved, isAnimating) => ({
  position: "absolute",
  top: "10px",
  right: "10px",
  background: "rgba(255, 255, 255, 0.95)",
  border: "none",
  width: "30px",
  height: "30px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  cursor: "pointer",
  zIndex: 25,
  transition: "transform 150ms ease, background 0.2s ease",
  transform: isAnimating ? "scale(1.15)" : "scale(1)"
});

function ProductCard({
  product,
  openProduct,
  setSelectedProduct,
  addToCart,
  removeFromCart,
  cart,
  windowWidth,
  getCartKey,
  onAddToCart,
  navigate: propNavigate,
  cartItems,
}) {
  const navigate = useNavigate();
  const { saveForLaterIds, toggleSaveForLater } = useContext(AuthContext);
  const [toastMsg, setToastMsg] = useState("");
  const [isSavedIconAnimating, setIsSavedIconAnimating] = useState(false);
  const toastTimeoutRef = useRef(null);
  const [showActions, setShowActions] = useState(false);

  if (!product) return null;

  // Support both backend/database 'id' and frontend '_id'
  const productId = product._id || product.id || String(Math.random());

  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const price = product.price !== undefined && product.price !== null ? product.price : (hasVariants && product.variants[0] ? product.variants[0].price : 0);
  const originalPrice = product.originalPrice !== undefined && product.originalPrice !== null ? product.originalPrice : (hasVariants && product.variants[0] && product.variants[0].originalPrice !== undefined ? product.variants[0].originalPrice : price);
  const weight = product.weight || (hasVariants && product.variants[0] ? product.variants[0].weight : "");

  const defaultWeight = hasVariants && product.variants[0] ? product.variants[0].weight : "";
  const cartKey = productId + (defaultWeight ? `_${defaultWeight}` : "");

  const activeItems = Array.isArray(cartItems) ? cartItems : [];
  const cartItem = activeItems.find(
    (item) =>
      String(item._id || item.id) ===
      String(product._id || product.id)
  );
  const quantity = cartItem ? cartItem.quantity : 0;

  const hasDiscount = originalPrice > price;

  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const isSaved = Array.isArray(saveForLaterIds) && saveForLaterIds.includes(String(product._id || product.id));

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
    handleIncrease(e);
  };

  const handleSaveClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (toggleSaveForLater) {
      const result = await toggleSaveForLater(product);
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

  const handleAddToList = (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const active = localStorage.getItem("shoppingListItems");
      const list = active ? JSON.parse(active) : [];
      list.push({ name: product.name, completed: false });
      localStorage.setItem("shoppingListItems", JSON.stringify(list));
      setToastMsg("✓ Added to Shopping List!");
      setShowActions(false);
      setTimeout(() => setToastMsg(""), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCardClick = () => {
    console.log("Product clicked:", product);
    navigate(`/product/${productId}`);
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    const productToCart = {
      ...product,
      selectedWeight: defaultWeight,
      price: product.variants && product.variants[0] ? product.variants[0].price : product.price
    };

    // Check stock limit
    if (quantity >= (product.stock || 30)) {
      alert(`Only ${product.stock || 30} items available`);
      return;
    }

    if (onAddToCart) {
      onAddToCart(productToCart);
    } else if (addToCart) {
      if (product.variants && product.variants.length > 1 && setSelectedProduct) {
        setSelectedProduct(product);
      } else {
        addToCart(productToCart);
      }
    }
  };

  const handleRemove = (e) => {
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

  const handleIncrease = (e) => {
    e.stopPropagation();
    handleAdd(e);
  };

  const handleDecrease = (e) => {
    e.stopPropagation();
    handleRemove(e);
  };

  return (
    <div
      onClick={handleCardClick}
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        border: "1px solid #f0f0f0",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        transition: "all 0.2s ease",
        position: "relative",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        fontFamily: "'Outfit', 'Inter', sans-serif",
      }}
      className="hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
    >
      <button
        onClick={handleSaveClick}
        style={bookmarkBtnStyle(isSaved, isSavedIconAnimating)}
        title="Save for Later"
      >
        <BookmarkIcon filled={isSaved} color={isSaved ? "#318616" : "#94a3b8"} />
      </button>

      {/* Image container: occupies around 58-60% height visually */}
      <div style={{
        width: "100%",
        height: windowWidth < 768 ? "110px" : "150px",
        textAlign: "center",
        background: "#f9fafb",
        borderRadius: "12px",
        padding: "8px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        boxSizing: "border-box",
      }}>
        <img
          src={getOptimizedImageUrl(product.image, windowWidth < 768 ? "thumbnail" : "medium", product)}
          alt={product.name || "Product"}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            height: "auto",
            width: "auto",
            objectFit: "contain",
            borderRadius: "8px",
          }}
          loading="lazy"
        />
      </div>

      {/* Card Details Body */}
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, marginTop: "8px", justifyContent: "space-between" }}>
        <div>
          {/* Discount Badge & Price */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {hasDiscount && (
              <span style={{ color: "#318616", fontWeight: "800", fontSize: "10px", textTransform: "uppercase" }}>
                {discountPercentage}% OFF
              </span>
            )}
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span style={{ fontWeight: "900", fontSize: "16px", color: "#1f2937" }}>
                ₹{price}
              </span>
              {originalPrice > price && (
                <span style={{ textDecoration: "line-through", color: "#9ca3af", fontSize: "12px", fontWeight: "500" }}>
                  ₹{originalPrice}
                </span>
              )}
            </div>
          </div>

          {/* Brand name (subtle grey text) */}
          <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px", marginTop: "8px" }}>
            {product.brand || "Buyto Fresh"}
          </div>

          {/* Product Name */}
          <h2
            style={{
              fontSize: "13px",
              fontWeight: "700",
              lineHeight: "17px",
              color: "#1f2937",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              height: "34px",
              margin: "2px 0 6px 0",
            }}
          >
            {product.name}
          </h2>

          {/* Weight Display */}
          <div
            onClick={(e) => {
              if (product.variants && product.variants.length > 1) {
                e.stopPropagation();
                if (setSelectedProduct) {
                  setSelectedProduct(product);
                }
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: product.variants?.length > 1 ? "pointer" : "default",
              color: "#6b7280",
              fontSize: "12px",
              fontWeight: "700",
              marginBottom: "8px",
              width: "fit-content",
            }}
          >
            <span>{weight}</span>
            {product.variants?.length > 1 && (
              <span style={{ color: "#318616", fontSize: "8px" }}>
                ▼
              </span>
            )}
          </div>

          {/* ETA Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px", width: "fit-content", marginBottom: "12px" }}>
            <span style={{ fontSize: "9px", color: "#4b5563", fontWeight: "800" }}>
              ⚡ {product.eta || "7 mins"}
            </span>
          </div>
        </div>

        {/* Add/Quantity Button Container */}
        <div style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "36px",
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
              width: (quantity === 0 && !isAnimating) ? "80px" : "100%",
              height: "36px",
              position: "relative",
              transition: "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
              borderRadius: "8px",
              overflow: "hidden",
              border: "1.5px solid #318616",
              backgroundColor: (quantity > 0 && !isAnimating) ? "#318616" : "white",
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

            {/* ADD Text Button */}
            {(quantity === 0 || isAnimating) && (
              <button
                onClick={handleButtonClick}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "transparent",
                  border: "none",
                  color: "#318616",
                  fontSize: "12px",
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
            )}

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
                  padding: "0 8px",
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
                    fontSize: "18px",
                    fontWeight: "900",
                    cursor: "pointer",
                    width: "24px",
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
                    fontSize: "13px",
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
                    fontSize: "18px",
                    fontWeight: "900",
                    cursor: "pointer",
                    width: "24px",
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
    </div>
  );
}

export default React.memo(ProductCard);
