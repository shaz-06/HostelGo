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
  console.log("SECTION PRODUCTS:", title, products);

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

  return (
    <div
      style={{
        marginTop: "42px",
        marginBottom: "36px",
      }}
    >
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
          <h2
            style={{
              fontSize: windowWidth < 768 ? "20px" : "28px",
              fontWeight: "850",
              color: "#1f2937",
              margin: 0,
            }}
          >
            {emoji} {title}
          </h2>
          {subtitle && (
            <p
              style={{
                color: "#6b7280",
                marginTop: "-10px",
                marginBottom: "18px",
                fontSize: "16px",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {onShowAll && (
          <button
            onClick={onShowAll}
            style={{
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
            }}
            onMouseOver={(e) => (e.target.style.color = "#1d4ed8")}
            onMouseOut={(e) => (e.target.style.color = "#2563eb")}
          >
            See All <span style={{ fontSize: "16px", marginLeft: "2px", fontWeight: "900", color: "#2563eb" }}>&gt;</span>
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
