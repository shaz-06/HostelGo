import React from "react";
import ProductCard from "./ProductCard";

function HorizontalProductSection({
  title,
  products,
  emoji,
  subtitle,
  onShowAll,
  openProduct,
  setSelectedProduct,
  addToCart,
  removeFromCart,
  cart,
  windowWidth,
  getCartKey,
  cartItems,
}) {
  const [isSeeAllHovered, setIsSeeAllHovered] = React.useState(false);
  const isTrendingNearYou = title && title.toLowerCase().includes("trending near you");
  const isBestDeals = title && title.toLowerCase().includes("best deals");
  const isFruits = title && title.toLowerCase().includes("fresh fruits");
  const isMosquitoes = title && title.toLowerCase().includes("mosquito");
  const isSexualWellness = title && title.toLowerCase().includes("sexual wellness");
  const isRecommended = title && title.toLowerCase().includes("recommended");

  if (!products || !products.length) {
     return (
        <div style={{padding:"20px",color:"red"}}>
           No products found for {title}
        </div>
     );
  }

  const resolvedCartItems = cartItems || (cart ? Object.values(cart).map(item => {
    const variant = item.product?.variants?.find(v => v.weight === item.product.selectedWeight);
    const originalPrice = variant ? variant.originalPrice : (item.product?.originalPrice || item.product?.price);
    return {
      id: getCartKey ? getCartKey(item.product) : item.product?._id || item.product?.id,
      _id: item.product?._id || item.product?.id,
      name: item.product?.name,
      weight: item.product?.selectedWeight || item.product?.weight,
      price: item.product?.price,
      image: item.product?.image,
      quantity: item.quantity,
      originalPrice: originalPrice,
    };
  }) : []);

  const containerStyle = isTrendingNearYou
    ? {
        marginTop: windowWidth < 768 ? "24px" : "32px",
        marginBottom: "36px",
        background: "#F5FCF4",
        border: "1px solid #E7F5E5",
        borderRadius: "28px",
        padding: "24px",
        boxShadow: "0 8px 30px rgba(49,134,22,0.06)",
        position: "relative",
      }
    : isBestDeals
    ? {
        marginTop: windowWidth < 768 ? "24px" : "32px",
        marginBottom: "36px",
        background:
          "radial-gradient(circle at top right, rgba(255,255,255,.35), transparent 30%), " +
          "radial-gradient(circle at bottom left, rgba(245,158,11,.08), transparent 35%), " +
          "linear-gradient(135deg, #FFF6D8 0%, #FFF3C4 40%, #FFEFB5 70%, #FFF6D8 100%)",
        border: "1px solid rgba(245, 158, 11, 0.15)",
        borderRadius: "28px",
        padding: "24px",
        boxShadow: "0 8px 30px rgba(245, 158, 11, 0.08)",
        position: "relative",
        animation: "gentle-shimmer 25s ease-in-out infinite",
      }
    : isFruits
    ? {
        marginTop: windowWidth < 768 ? "24px" : "32px",
        marginBottom: "36px",
        background: "#DDF8D4",
        border: "1px solid rgba(49, 134, 22, 0.12)",
        borderRadius: "28px",
        padding: "24px",
        boxShadow: "0 8px 30px rgba(49, 134, 22, 0.06)",
        position: "relative",
      }
    : isMosquitoes
    ? {
        marginTop: windowWidth < 768 ? "24px" : "32px",
        marginBottom: "36px",
        background: "#F3ECFF",
        border: "1px solid rgba(147, 112, 219, 0.12)",
        borderRadius: "28px",
        padding: "24px",
        boxShadow: "0 8px 30px rgba(147, 112, 219, 0.06)",
        position: "relative",
      }
    : isSexualWellness
    ? {
        marginTop: windowWidth < 768 ? "24px" : "32px",
        marginBottom: "36px",
        background: "#FCEFF5",
        border: "1px solid rgba(233, 167, 197, 0.15)",
        borderRadius: "28px",
        padding: "24px",
        boxShadow: "0 8px 30px rgba(233, 167, 197, 0.08)",
        position: "relative",
      }
    : isRecommended
    ? {
        marginTop: windowWidth < 768 ? "24px" : "32px",
        marginBottom: "36px",
        background: "#FFF8D9",
        border: "1px solid rgba(245, 158, 11, 0.12)",
        borderRadius: "28px",
        padding: "24px",
        boxShadow: "0 8px 30px rgba(245, 158, 11, 0.06)",
        position: "relative",
      }
    : {
        marginTop: "42px",
        marginBottom: "36px",
        position: "relative",
      };

  const headingStyle = {
    fontSize: windowWidth < 768 ? "20px" : "28px",
    fontWeight: "850",
    color: (isTrendingNearYou || isBestDeals || isFruits || isMosquitoes || isSexualWellness || isRecommended) ? "#1b4314" : "#1f2937",
    margin: 0,
    zIndex: 1,
    position: "relative",
  };

  const seeAllStyle = (isTrendingNearYou || isBestDeals || isFruits || isMosquitoes || isSexualWellness || isRecommended)
    ? {
        border: "none",
        background: "transparent",
        color: isSeeAllHovered ? "#286F12" : "#318616",
        fontWeight: "600",
        fontSize: windowWidth < 768 ? "14px" : "18px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        transition: "color 0.2s",
        marginTop: "4px",
        zIndex: 1,
        position: "relative",
      }
    : {
        border: "none",
        background: "transparent",
        color: "#2563eb",
        fontWeight: "800",
        fontSize: windowWidth < 768 ? "14px" : "18px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        transition: "color 0.2s",
        marginTop: "4px",
      };

  return (
    <div style={containerStyle}>
      {/* Dynamic Keyframes for animations */}
      <style>{`
        @keyframes float-ambient {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(6deg); }
        }
        @keyframes gentle-shimmer {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.015); }
        }
      `}</style>

      {/* Ambient background decorations for Best Deals */}
      {isBestDeals && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none", borderRadius: "28px", zIndex: 0 }}>
          <div style={{ position: "absolute", top: "15%", left: "8%", fontSize: "24px", opacity: 0.03, animation: "float-ambient 8s ease-in-out infinite" }}>%</div>
          <div style={{ position: "absolute", bottom: "20%", right: "12%", fontSize: "32px", opacity: 0.04, animation: "float-ambient 12s ease-in-out infinite" }}>✨</div>
          <div style={{ position: "absolute", top: "40%", right: "25%", fontSize: "20px", opacity: 0.03, animation: "float-ambient 10s ease-in-out infinite" }}>%</div>
          <div style={{ position: "absolute", bottom: "10%", left: "30%", fontSize: "28px", opacity: 0.03, animation: "float-ambient 14s ease-in-out infinite" }}>🪙</div>
          <div style={{ position: "absolute", top: "20%", right: "50%", fontSize: "24px", opacity: 0.02, animation: "float-ambient 16s ease-in-out infinite" }}>🏷️</div>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2 style={headingStyle}>
            {emoji} {title}
          </h2>
          {subtitle && (
            <p
              style={{
                color: "#6b7280",
                marginTop: "-10px",
                marginBottom: "18px",
                fontSize: "16px",
                zIndex: 1,
                position: "relative",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {onShowAll && (
          <button
            onClick={onShowAll}
            style={seeAllStyle}
            onMouseEnter={() => setIsSeeAllHovered(true)}
            onMouseLeave={() => setIsSeeAllHovered(false)}
          >
            See All <span style={{ fontSize: (isTrendingNearYou || isBestDeals || isFruits) ? (windowWidth < 768 ? "14px" : "18px") : "16px", marginLeft: "2px", fontWeight: (isTrendingNearYou || isBestDeals || isFruits) ? "600" : "900", color: (isTrendingNearYou || isBestDeals || isFruits) ? (isSeeAllHovered ? "#286F12" : "#318616") : "#2563eb" }}>&gt;</span>
          </button>
        )}
      </div>

      {/* Products Slider */}
      <div
        style={{
          display: "flex",
          gap: "18px",
          overflowX: "auto",
          paddingBottom: "16px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollBehavior: "smooth",
        }}
        className="hide-scrollbar"
      >
        {(products || []).map((product) => (
          <div
            key={product._id || product.id}
            style={{
              width: windowWidth < 768 ? "160px" : "210px",
              flexShrink: 0,
            }}
          >
            <ProductCard
              product={product}
              openProduct={openProduct}
              setSelectedProduct={setSelectedProduct}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              cart={cart}
              cartItems={resolvedCartItems}
              windowWidth={windowWidth}
              getCartKey={getCartKey}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default HorizontalProductSection;