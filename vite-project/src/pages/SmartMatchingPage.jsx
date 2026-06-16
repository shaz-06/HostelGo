import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MOBILE_NAV_TOTAL_OFFSET } from "../constants/layoutConstants";
import ProductCard from "../ProductCard";

export default function SmartMatchingPage({
  addToCart,
  removeFromCart,
  cartItems = [],
  setCartItems
}) {
  const navigate = useNavigate();
  const [unresolvedItems, setUnresolvedItems] = useState([]);
  const [selections, setSelections] = useState({}); // { itemIndex: selectedProductId }
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("buyto_proceed_items");
    if (saved) {
      setUnresolvedItems(JSON.parse(saved));
    }
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleSelectProduct = (itemIdx, productId) => {
    setSelections(prev => ({
      ...prev,
      [itemIdx]: productId
    }));
  };

  const handleAddSelection = (idx, res) => {
    const selectedId = selections[idx];
    if (!selectedId) {
      alert("Please select a product first!");
      return;
    }

    const matchedProduct = res.matchedList.find(p => String(p._id || p.id) === String(selectedId));
    if (!matchedProduct) return;

    // Add to cart
    setCartItems(prev => {
      let next = [...prev];
      const productId = String(matchedProduct._id || matchedProduct.id);
      const existingIdx = next.findIndex(item => String(item._id || item.id) === productId);
      if (existingIdx !== -1) {
        next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + 1 };
      } else {
        next.push({
          ...matchedProduct,
          addedFromShoppingList: true,
          originalShoppingListName: res.item.name,
          quantity: 1
        });
      }
      localStorage.setItem("cart", JSON.stringify(next));
      return next;
    });

    // Mark as added in UI (remove from unresolved or change status)
    showToast(`Added ${matchedProduct.name} to cart!`);
    setUnresolvedItems(prev => prev.map((item, i) => {
      if (i === idx) {
        return { ...item, status: "resolved_picked", pickedProduct: matchedProduct };
      }
      return item;
    }));
  };

  const handleAddAlternative = (resIdx, product, originalName) => {
    setCartItems(prev => {
      let next = [...prev];
      const productId = String(product._id || product.id);
      const existingIdx = next.findIndex(item => String(item._id || item.id) === productId);
      if (existingIdx !== -1) {
        next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + 1 };
      } else {
        next.push({
          ...product,
          addedFromShoppingList: true,
          originalShoppingListName: originalName,
          quantity: 1
        });
      }
      localStorage.setItem("cart", JSON.stringify(next));
      return next;
    });

    showToast(`Added alternative: ${product.name} to cart!`);
    
    // Mark as resolved
    setUnresolvedItems(prev => prev.map((item, i) => {
      if (i === resIdx) {
        return { ...item, status: "resolved_picked", pickedProduct: product };
      }
      return item;
    }));
  };

  return (
    <div style={containerStyle}>
      {toastMessage && (
        <div style={toastStyle}>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header style={headerStyle}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>
          ← Edit List
        </button>
        <h1 style={titleStyle}>Smart Matching</h1>
        <button onClick={() => navigate("/cart")} style={cartBtnStyle}>
          🛒 Cart ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})
        </button>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: `${MOBILE_NAV_TOTAL_OFFSET + 24}px` }}>
        <p style={subtextStyle}>
          Resolve the items below to complete your shopping list order.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {unresolvedItems.map((res, idx) => {
            const isResolvedPicked = res.status === "resolved_picked";
            
            return (
              <div key={idx} style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <h3 style={itemTitleStyle}>{res.item.name}</h3>
                  <span style={badgeStyle(res.status)}>
                    {isResolvedPicked && "✓ Resolved"}
                    {res.status === "needs_selection" && "⚠ Needs Selection"}
                    {res.status === "not_available" && "✗ Not Available"}
                  </span>
                </div>

                {isResolvedPicked && res.pickedProduct && (
                  <div style={resolvedPickStyle}>
                    Selected: <b>{res.pickedProduct.name}</b> (₹{res.pickedProduct.price})
                  </div>
                )}

                {res.status === "needs_selection" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={radioContainerStyle}>
                      {res.matchedList.map((product) => {
                        const productId = product._id || product.id;
                        const isSelected = selections[idx] === productId;

                        return (
                          <label key={productId} style={radioLabelStyle(isSelected)}>
                            <input
                              type="radio"
                              name={`item-${idx}`}
                              checked={isSelected}
                              onChange={() => handleSelectProduct(idx, productId)}
                              style={radioInputStyle}
                            />
                            <div style={{ flexGrow: 1 }}>
                              <div style={productNameStyle}>{product.name}</div>
                              <div style={productMetaStyle}>{product.weight} • ₹{product.price}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handleAddSelection(idx, res)}
                      style={addSelectionBtnStyle}
                    >
                      Add Selected Product
                    </button>
                  </div>
                )}

                {res.status === "not_available" && (
                  <div>
                    <div style={notAvailableTextStyle}>
                      This item is currently out of stock.
                    </div>
                    
                    {res.alternatives && res.alternatives.length > 0 && (
                      <div style={{ marginTop: "14px" }}>
                        <div style={alternativeHeaderStyle}>Suggested Alternatives:</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                          {res.alternatives.map((alt) => (
                            <div key={alt._id || alt.id} style={altRowStyle}>
                              <div style={{ flexGrow: 1 }}>
                                <div style={altNameStyle}>{alt.name}</div>
                                <div style={altMetaStyle}>{alt.weight} • ₹{alt.price}</div>
                              </div>
                              <button
                                onClick={() => handleAddAlternative(idx, alt, res.item.name)}
                                style={addAltBtnStyle}
                              >
                                ＋ Add
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Sticky Bottom Footer */}
      <div style={{ ...stickyFooterStyle, bottom: window.innerWidth < 768 ? `${MOBILE_NAV_TOTAL_OFFSET}px` : "0px" }}>
        <button onClick={() => navigate("/cart")} style={goToCartBtnStyle}>
          Go to Cart →
        </button>
      </div>
    </div>
  );
}

// STYLES
const containerStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, rgba(46, 125, 50, 0.08) 0%, rgba(76, 175, 80, 0.04) 15%, #ffffff 100%)",
  padding: "16px",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  boxSizing: "border-box",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
  background: "white",
  padding: "12px 16px",
  borderRadius: "20px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
};

const backBtnStyle = {
  background: "transparent",
  border: "none",
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
};

const titleStyle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: "900",
  color: "#1e293b",
};

const cartBtnStyle = {
  background: "#f0fdf4",
  border: "1.5px solid #10b981",
  color: "#10b981",
  padding: "6px 14px",
  borderRadius: "14px",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer",
};

const subtextStyle = {
  textAlign: "center",
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 20px 0"
};

const cardStyle = {
  background: "white",
  borderRadius: "24px",
  padding: "20px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
  border: "1px solid #f1f5f9",
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "14px"
};

const itemTitleStyle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: "900",
  color: "#1e293b"
};

const badgeStyle = (status) => ({
  fontSize: "11px",
  fontWeight: "850",
  padding: "4px 10px",
  borderRadius: "20px",
  color: status === "resolved_picked" ? "#15803d" : status === "needs_selection" ? "#b45309" : "#b91c1c",
  background: status === "resolved_picked" ? "#dcfce7" : status === "needs_selection" ? "#fef3c7" : "#fee2e2",
});

const resolvedPickStyle = {
  fontSize: "13px",
  color: "#15803d",
  background: "#f0fdf4",
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid #dcfce7",
  fontWeight: "600"
};

const radioContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px"
};

const radioLabelStyle = (isSelected) => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "12px 14px",
  borderRadius: "14px",
  border: isSelected ? "2.5px solid #10b981" : "1.5px solid #cbd5e1",
  background: isSelected ? "#f0fdf4" : "white",
  cursor: "pointer",
  transition: "all 0.1s ease",
  boxSizing: "border-box"
});

const radioInputStyle = {
  accentColor: "#10b981",
  width: "18px",
  height: "18px",
  cursor: "pointer"
};

const productNameStyle = {
  fontSize: "14px",
  fontWeight: "800",
  color: "#1e293b"
};

const productMetaStyle = {
  fontSize: "12px",
  color: "#64748b",
  fontWeight: "600",
  marginTop: "2px"
};

const addSelectionBtnStyle = {
  background: "linear-gradient(135deg, #10b981, #059669)",
  color: "white",
  border: "none",
  borderRadius: "12px",
  height: "38px",
  fontSize: "13px",
  fontWeight: "800",
  cursor: "pointer",
  marginTop: "6px",
  boxShadow: "0 4px 10px rgba(16, 185, 129, 0.15)"
};

const notAvailableTextStyle = {
  fontSize: "13px",
  color: "#b91c1c",
  background: "#fef2f2",
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid #fee2e2",
  fontWeight: "600"
};

const alternativeHeaderStyle = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const altRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 14px",
  borderRadius: "12px",
  background: "#f8fafc",
  border: "1px solid #cbd5e1"
};

const altNameStyle = {
  fontSize: "13px",
  fontWeight: "750",
  color: "#1e293b"
};

const altMetaStyle = {
  fontSize: "11px",
  color: "#64748b",
  fontWeight: "600"
};

const addAltBtnStyle = {
  background: "white",
  border: "1.5px solid #10b981",
  color: "#10b981",
  padding: "4px 12px",
  borderRadius: "10px",
  fontSize: "12px",
  fontWeight: "800",
  cursor: "pointer",
  boxShadow: "0 2px 5px rgba(16, 185, 129, 0.05)"
};

const stickyFooterStyle = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  background: "white",
  boxShadow: "0 -8px 24px rgba(0,0,0,0.06)",
  padding: "16px 20px",
  zIndex: 1000,
  borderTop: "1px solid #e2e8f0",
  display: "flex",
  justifyContent: "center"
};

const goToCartBtnStyle = {
  maxWidth: "600px",
  width: "100%",
  background: "linear-gradient(135deg, #10b981, #059669)",
  color: "white",
  border: "none",
  borderRadius: "14px",
  height: "46px",
  fontSize: "15px",
  fontWeight: "850",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
};

const toastStyle = {
  position: "fixed",
  top: "20px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#1e293b",
  color: "white",
  padding: "12px 24px",
  borderRadius: "12px",
  zIndex: 10000,
  fontSize: "13px",
  fontWeight: "700",
  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
};
