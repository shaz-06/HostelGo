import React, { useState, useContext, useRef } from "react";
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

  if (windowWidth < 768) {
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
          transition: "transform 0.2s ease",
          position: "relative",
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        <button
          onClick={handleSaveClick}
          style={bookmarkBtnStyle(isSaved, isSavedIconAnimating)}
          title="Save for Later"
        >
          <BookmarkIcon filled={isSaved} color={isSaved ? "#10b981" : "#94a3b8"} />
        </button>
        {hasDiscount && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              background: "#2563eb",
              color: "white",
              padding: "2px 6px",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: "800",
              zIndex: 10,
            }}
          >
            {discountPercentage}% OFF
          </div>
        )}

        {/* Upper content section */}
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <div style={{ width: "100%", textAlign: "center", background: "#f9fafb", borderRadius: "12px", padding: "8px 0", display: "flex", alignItems: "center", justifyContent: "center", height: "110px" }}>
            <img
              src={getOptimizedImageUrl(product.image, "thumbnail", product)}
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

          <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px", width: "fit-content", marginTop: "8px" }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="3">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span style={{ fontSize: "9px", color: "#6b7280", fontWeight: "700" }}>
              {product.eta || "30 MINS"}
            </span>
          </div>

          <h2
            style={{
              fontSize: "13px",
              fontWeight: "600",
              lineHeight: "16px",
              color: "#1f2937",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              marginTop: "8px",
              height: "32px",
              margin: "8px 0 2px 0",
            }}
          >
            {product.name}
          </h2>

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
              fontWeight: "500",
              marginBottom: "8px",
            }}
          >
            <span>{weight}</span>
            {product.variants?.length > 1 && (
              <span style={{ color: "#2563eb", fontSize: "9px" }}>
                ▼
              </span>
            )}
          </div>
        </div>

        {/* Separator line */}
        <div
          style={{
            borderTop: "1px dashed #e5e7eb",
            margin: "8px 0",
          }}
        />

        {/* Price and ADD button section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            minHeight: "44px",
          }}
        >
          <div>
            {hasDiscount && (
              <p style={{ color: "#00a05a", fontWeight: "700", fontSize: "10px", margin: 0 }}>
                {discountPercentage}% OFF
              </p>
            )}
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: "2px" }}>
              <span style={{ fontWeight: "800", fontSize: "15px", color: "#1f2937" }}>
                ₹{price}
              </span>
              {originalPrice > price && (
                <span
                  style={{
                    textDecoration: "line-through",
                    color: "#9ca3af",
                    fontSize: "11px",
                  }}
                >
                  ₹{originalPrice}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            {quantity === 0 ? (
              <button
                onClick={handleAdd}
                className="active:scale-95 transition-transform"
                style={{
                  background: "white",
                  border: "1.5px solid #12C24B",
                  color: "#12C24B",
                  minHeight: "44px",
                  minWidth: "76px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "800",
                  boxShadow: "0 2px 4px rgba(18,194,75,0.08)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                }}
              >
                ADD
              </button>
            ) : (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#12C24B",
                  borderRadius: "8px",
                  minHeight: "44px",
                  minWidth: "76px",
                  boxShadow: "0 2px 4px rgba(18,194,75,0.08)",
                  boxSizing: "border-box",
                }}
              >
                <button
                  onClick={handleDecrease}
                  style={{
                    flex: 1,
                    height: "100%",
                    minHeight: "44px",
                    background: "transparent",
                    border: "none",
                    color: "white",
                    fontSize: "18px",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  -
                </button>
                <span style={{ color: "white", fontWeight: "800", fontSize: "13px", minWidth: "16px", textAlign: "center" }}>
                  {quantity}
                </span>
                <button
                  onClick={handleIncrease}
                  style={{
                    flex: 1,
                    height: "100%",
                    minHeight: "44px",
                    background: "transparent",
                    border: "none",
                    color: "white",
                    fontSize: "18px",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  +
                </button>
              </div>
            )}
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

  return (
    <div
      onClick={handleCardClick}
      style={{
        background: "white",
        borderRadius: windowWidth < 768 ? "16px" : "24px",
        padding: windowWidth < 768 ? "10px" : "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        border: "1px solid #f3f4f6",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        transition: "0.2s",
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
      }}
      className="hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
    >
      <button
        onClick={handleSaveClick}
        style={bookmarkBtnStyle(isSaved, isSavedIconAnimating)}
        title="Save for Later"
      >
        <BookmarkIcon filled={isSaved} color={isSaved ? "#10b981" : "#94a3b8"} />
      </button>
      {hasDiscount && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "#2563eb",
            color: "white",
            padding: "4px 8px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            zIndex: 10,
          }}
        >
          {discountPercentage}% OFF
        </div>
      )}
      <div>
        <div style={{ position: "relative" }}>
          <img
            src={getOptimizedImageUrl(product.image, "medium", product)}
            alt={product.name || "Product"}
            style={{
              width: "100%",
              height: windowWidth < 768 ? "90px" : "120px",
              objectFit: "contain",
              borderRadius: "12px",
              background: "#f9fafb"
            }}
          />

          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="hover:scale-105 transition-transform"
              style={{
                position: "absolute",
                bottom: "-6px",
                right: "6px",
                background: "white",
                border: "1px solid #e5e7eb",
                color: "#2563eb",
                padding: "4px 10px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: "800",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              + ADD
            </button>
          ) : (
            <div
              className="quantity-controls"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                bottom: "-6px",
                right: "6px",
                display: "flex",
                alignItems: "center",
                background: "white",
                border: "1px solid #2563eb",
                borderRadius: "8px",
                height: "22px",
                overflow: "hidden",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <button
                onClick={handleDecrease}
                style={{
                  width: "20px",
                  height: "100%",
                  background: "white",
                  border: "none",
                  color: "#2563eb",
                  fontSize: "12px",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                -
              </button>
              <span style={{ color: "#2563eb", fontWeight: "800", fontSize: "11px", minWidth: "12px", textAlign: "center" }}>
                {quantity}
              </span>
              <button
                onClick={handleIncrease}
                style={{
                  width: "20px",
                  height: "100%",
                  background: "white",
                  border: "none",
                  color: "#2563eb",
                  fontSize: "12px",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                +
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px", width: "fit-content", marginTop: "8px" }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="3">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span style={{ fontSize: "8px", color: "#6b7280", fontWeight: "700" }}>
            30 MINS
          </span>
        </div>

        <h2
          style={{
            fontSize: "13px",
            fontWeight: "600",
            lineHeight: "16px",
            color: "#1f2937",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginTop: "6px",
            height: "32px"
          }}
        >
          {product.name}
        </h2>

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
            fontWeight: "500",
            marginTop: "4px",
          }}
        >
          <span>{weight}</span>
          {product.variants?.length > 1 && (
            <span style={{ color: "#2563eb", fontSize: "9px" }}>
              ▼
            </span>
          )}
        </div>

        <div
          style={{
            borderTop: "1px dashed #00a05a",
            marginTop: "6px",
            marginBottom: "6px",
          }}
        />

        <div style={{ marginTop: "4px" }}>
          {hasDiscount && (
            <p style={{ color: "#00a05a", fontWeight: "700", fontSize: "11px", margin: 0 }}>
              {discountPercentage}% OFF
            </p>
          )}

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "2px" }}>
            <span style={{ fontWeight: "800", fontSize: "15px", color: "#1f2937" }}>
              ₹{price}
            </span>
            {originalPrice > price && (
              <span
                style={{
                  textDecoration: "line-through",
                  color: "#9ca3af",
                  fontSize: "11px",
                }}
              >
                ₹{originalPrice}
              </span>
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
