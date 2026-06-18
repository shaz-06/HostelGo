import React from "react";
import { useNavigate } from "react-router-dom";
import { getOptimizedImageUrl } from "../../utils/imageOptimizer";

function MobileProductCard({
  product,
  addToCart,
  removeFromCart,
  cartItems,
  setSelectedProduct,
}) {
  const navigate = useNavigate();

  if (!product) return null;

  const productId = product._id || product.id;
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  
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

  const handleAdd = (e) => {
    e.stopPropagation();
    const productToCart = {
      ...product,
      selectedWeight: defaultWeight,
      price: product.variants && product.variants[0] ? product.variants[0].price : product.price
    };

    if (quantity >= (product.stock || 30)) {
      alert(`Only ${product.stock || 30} items available`);
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
        background: cardBg,
        borderRadius: "16px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        position: "relative",
        width: "115px",
        height: "170px",
        boxSizing: "border-box",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        flexShrink: 0,
        boxShadow: "0 2px 6px rgba(0,0,0,0.015)",
        border: "1px solid rgba(0,0,0,0.02)",
      }}
    >
      {/* Green Discount Badge (top right) */}
      {hasDiscount && (
        <div
          style={{
            position: "absolute",
            top: "6px",
            right: "6px",
            background: "#84cc16", // Lime green
            color: "white",
            padding: "2px 5px",
            borderRadius: "4px",
            fontSize: "8px",
            fontWeight: "800",
            zIndex: 10,
          }}
        >
          {discountPercentage}% OFF
        </div>
      )}

      {/* Product Image Area */}
      <div
        style={{
          width: "100%",
          height: "85px",
          background: "white",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          padding: "4px",
          boxSizing: "border-box",
        }}
      >
        <img
          src={getOptimizedImageUrl(product.image, "thumbnail", product)}
          alt={product.name}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            borderRadius: "6px",
          }}
          loading="lazy"
        />

        {/* Add/Quantity Capsule Button (overlapping bottom of image) */}
        <div
          style={{
            position: "absolute",
            bottom: "-10px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 15,
          }}
        >
          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              style={{
                background: "white",
                border: "1.5px solid #ef4444", // Red outline like reference
                color: "#ef4444",
                borderRadius: "20px",
                fontSize: "10px",
                fontWeight: "900",
                height: "22px",
                padding: "0 14px",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                whiteSpace: "nowrap",
                boxSizing: "border-box",
              }}
            >
              Buy
            </button>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                border: "1.5px solid #ef4444",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                height: "22px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                boxSizing: "border-box",
                padding: "0 4px",
              }}
            >
              <button
                onClick={handleDecrease}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  fontSize: "12px",
                  fontWeight: "900",
                  width: "16px",
                  height: "100%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                -
              </button>
              <span
                style={{
                  color: "#ef4444",
                  fontWeight: "900",
                  fontSize: "10px",
                  minWidth: "10px",
                  textAlign: "center",
                  padding: "0 2px",
                }}
              >
                {quantity}
              </span>
              <button
                onClick={handleAdd}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  fontSize: "12px",
                  fontWeight: "900",
                  width: "16px",
                  height: "100%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Text Details */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "12px",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "#374151",
            textAlign: "center",
            width: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: "1.2",
          }}
        >
          {product.name}
        </span>
        <span
          style={{
            fontSize: "9px",
            color: "#6b7280",
            fontWeight: "600",
            textAlign: "center",
            marginTop: "2px",
            width: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {weight ? `${weight} • ` : ""}₹{price}
        </span>
      </div>
    </div>
  );
}

export default React.memo(MobileProductCard);
