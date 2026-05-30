import React from "react";
import { useNavigate } from "react-router-dom";

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
            src={product.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"}
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
    </div>
  );
}

export default ProductCard;
