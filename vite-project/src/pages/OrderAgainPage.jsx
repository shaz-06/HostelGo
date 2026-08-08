import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import SEO from "../components/common/SEO";
import { ArrowLeft, ShoppingBag, AlertCircle, ShoppingCart, RefreshCw, Plus, Minus } from "lucide-react";

export default function OrderAgainPage({
  addToCart,
  removeFromCart,
  cart = {},
  getCartKey
}) {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [ordersLoading, setOrdersLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState({});
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const loadData = async () => {
    if (!token) {
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);
    setError(null);
    console.log("[OrderAgain] Loading previous orders...");

    try {
      // Step 1: Fetch order history from existing backend API
      const ordersRes = await fetch(`${window.API_BASE_URL || ""}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!ordersRes.ok) {
        throw new Error(`Failed to load order history (HTTP ${ordersRes.status})`);
      }
      const ordersData = await ordersRes.json();
      console.log("[OrderAgain] API response orders count:", ordersData?.orders?.length);

      const fetchedOrders = Array.isArray(ordersData.orders) ? ordersData.orders : [];
      setOrders(fetchedOrders);

      // Step 2: Extract unique product IDs from valid orders
      const activeStatuses = ["order placed", "confirmed", "processing", "shipped", "out for delivery", "delivered", "completed", "paid"];
      const successOrders = fetchedOrders.filter(o => {
        const status = String(o.orderStatus || o.status || "").toLowerCase().trim();
        return activeStatuses.includes(status) && !status.includes("cancel") && !status.includes("fail") && !status.includes("refund");
      });

      const productIds = new Set();
      successOrders.forEach(order => {
        const items = order.items || order.products || [];
        items.forEach(item => {
          if (item.productId) {
            productIds.add(String(item.productId));
          }
        });
      });

      const uniqueIds = Array.from(productIds);
      console.log("[OrderAgain] Extracted unique product IDs:", uniqueIds);
      console.log("[OrderAgain] Requested product IDs:", uniqueIds);
      console.log("[OrderAgain] Product ID count:", uniqueIds.length);
      console.log("[OrderAgain] Bulk URL:", `${window.API_BASE_URL || ""}/api/products?ids=${uniqueIds.join(",")}`);

      if (uniqueIds.length === 0) {
        setOrdersLoading(false);
        return;
      }

      // Step 3: ONE bulk request to fetch current details/stock
      setProductsLoading(true);
      const productsRes = await fetch(`${window.API_BASE_URL || ""}/api/products?ids=${uniqueIds.join(",")}`);
      if (!productsRes.ok) {
        throw new Error(`Failed to load current catalog products (HTTP ${productsRes.status})`);
      }
      const productsData = await productsRes.json();
      console.log("[OrderAgain] Bulk API returned count:", productsData?.length);
      console.log("[OrderAgain] Returned product IDs:", Array.isArray(productsData) ? productsData.map(p => p._id || p.id) : []);

      const productMap = {};
      if (Array.isArray(productsData)) {
        productsData.forEach(p => {
          const idKey = String(p._id || p.id);
          productMap[idKey] = p;
        });
      }
      setCatalogProducts(productMap);
    } catch (err) {
      console.error("[OrderAgain] Error during data fetch:", err);
      setError(err.message || "Unable to load your previous purchases.");
    } finally {
      setOrdersLoading(false);
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Extract and deduplicate products/variants based on history and catalog validation
  const reorderItems = useMemo(() => {
    const activeStatuses = ["order placed", "confirmed", "processing", "shipped", "out for delivery", "delivered", "completed", "paid"];
    const successOrders = orders.filter(o => {
      const status = String(o.orderStatus || o.status || "").toLowerCase().trim();
      return activeStatuses.includes(status) && !status.includes("cancel") && !status.includes("fail") && !status.includes("refund");
    });

    const itemsList = [];
    successOrders.forEach(order => {
      const items = order.items || order.products || [];
      items.forEach(item => {
        if (item.productId) {
          itemsList.push({
            ...item,
            purchasedAt: order.createdAt || order.date || ""
          });
        }
      });
    });

    // Group by productId + variant identifier to separate variants correctly
    const grouped = {};
    itemsList.forEach(item => {
      const variantKey = item.variant || item.weight || "";
      const groupKey = `${item.productId}_${variantKey}`;

      if (!grouped[groupKey] || new Date(item.purchasedAt) > new Date(grouped[groupKey].purchasedAt)) {
        grouped[groupKey] = item;
      }
    });

    // Map each group to its fresh catalog product information
    const result = [];
    Object.values(grouped).forEach(historyItem => {
      const freshProduct = catalogProducts[String(historyItem.productId)];
      if (!freshProduct) {
        // If product no longer exists in catalog, ignore it (graceful handling)
        return;
      }

      const variantKey = historyItem.variant || historyItem.weight || "";
      
      // Determine variant pricing & stock
      let currentPrice = freshProduct.price;
      let currentOriginalPrice = freshProduct.originalPrice || freshProduct.price;
      let currentStock = freshProduct.stock || 0;
      let matchingVariant = null;

      if (Array.isArray(freshProduct.variants) && freshProduct.variants.length > 0) {
        matchingVariant = freshProduct.variants.find(v => v.weight === variantKey);
        if (matchingVariant) {
          currentPrice = matchingVariant.price;
          currentOriginalPrice = matchingVariant.originalPrice || matchingVariant.price;
          currentStock = matchingVariant.stock !== undefined ? matchingVariant.stock : currentStock;
        } else {
          // Fallback to first available variant if historical variant does not match
          matchingVariant = freshProduct.variants[0];
          currentPrice = matchingVariant.price;
          currentOriginalPrice = matchingVariant.originalPrice || matchingVariant.price;
          currentStock = matchingVariant.stock !== undefined ? matchingVariant.stock : currentStock;
        }
      }

      result.push({
        productId: String(historyItem.productId),
        name: freshProduct.name,
        image: freshProduct.image || historyItem.image,
        weight: variantKey || freshProduct.weight,
        originalProduct: freshProduct,
        variantInfo: matchingVariant,
        currentPrice,
        currentOriginalPrice,
        currentStock,
        purchasedAt: historyItem.purchasedAt
      });
    });

    // Sort by purchase date descending (most recently purchased first)
    return result.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));
  }, [orders, catalogProducts]);

  // Add all currently available products to cart
  const handleAddAllAvailable = () => {
    let addedCount = 0;
    let unavailableCount = 0;

    reorderItems.forEach(item => {
      if (item.currentStock > 0) {
        const cartKey = getCartKey ? getCartKey({ ...item.originalProduct, selectedWeight: item.weight }) : `${item.productId}_${item.weight}`;
        const existingQty = cart[cartKey]?.quantity || 0;

        if (existingQty < item.currentStock) {
          addToCart({
            ...item.originalProduct,
            selectedWeight: item.weight,
            price: item.currentPrice
          });
          addedCount++;
        } else {
          // Already in cart up to stock limit
          unavailableCount++;
        }
      } else {
        unavailableCount++;
      }
    });

    if (addedCount > 0) {
      if (unavailableCount > 0) {
        showToast(`🛒 ${addedCount} items added • ${unavailableCount} unavailable`);
      } else {
        showToast(`🛒 ${addedCount} ${addedCount === 1 ? "item" : "items"} added to cart`);
      }
    } else {
      showToast("⚠️ All available items are already in your cart or out of stock");
    }
  };

  const handleSingleAdd = (item) => {
    if (item.currentStock <= 0) return;

    addToCart({
      ...item.originalProduct,
      selectedWeight: item.weight,
      price: item.currentPrice
    });
    showToast(`🛒 Added ${item.name} (${item.weight}) to cart`);
  };

  const renderSkeletons = () => {
    return (
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {[1, 2, 3, 4].map(idx => (
          <div key={idx} style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            display: "flex",
            gap: "16px",
            alignItems: "center"
          }}>
            <div style={{ width: "70px", height: "70px", background: "#f1f5f9", borderRadius: "10px", animation: "pulse 1.5s infinite" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ width: "60%", height: "16px", background: "#f1f5f9", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
              <div style={{ width: "30%", height: "12px", background: "#f1f5f9", borderRadius: "4px", animation: "pulse 1.5s infinite" }} />
            </div>
            <div style={{ width: "80px", height: "36px", background: "#f1f5f9", borderRadius: "8px", animation: "pulse 1.5s infinite" }} />
          </div>
        ))}
      </div>
    );
  };

  const isLoading = ordersLoading || productsLoading;

  return (
    <div style={{
      background: "#f8fafc",
      minHeight: "100vh",
      paddingBottom: "100px",
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      <SEO title="Order Again" description="Quickly reorder your previously purchased items on Buyto." />
      
      {/* CSS Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Toast popup */}
      {toastMsg && (
        <div style={{
          position: "fixed",
          top: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#1e293b",
          color: "white",
          padding: "12px 24px",
          borderRadius: "30px",
          fontWeight: "750",
          fontSize: "14px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          {toastMsg}
        </div>
      )}

      {/* Header Bar */}
      <div style={{
        background: "#ffffff",
        padding: "16px 24px",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => navigate("/profile")}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 150ms ease"
            }}
            aria-label="Go Back"
          >
            <ArrowLeft size={20} color="#1e293b" />
          </button>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Order Again</h1>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Your favorites, ready to reorder</p>
          </div>
        </div>

        {reorderItems.length > 0 && !isLoading && (
          <button
            onClick={handleAddAllAvailable}
            style={{
              background: "#318616",
              color: "#ffffff",
              border: "none",
              borderRadius: "18px",
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <ShoppingCart size={14} /> Add All Available
          </button>
        )}
      </div>

      {isLoading ? (
        renderSkeletons()
      ) : error ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 24px",
          textAlign: "center"
        }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: "16px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: "750", color: "#1e293b", marginBottom: "8px" }}>Unable to load your previous purchases</h3>
          <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "300px", marginBottom: "20px" }}>{error}</p>
          <button
            onClick={loadData}
            style={{
              background: "#318616",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            Try Again
          </button>
        </div>
      ) : reorderItems.length === 0 ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 24px",
          textAlign: "center"
        }}>
          <ShoppingBag size={64} color="#94a3b8" style={{ marginBottom: "20px" }} />
          <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1e293b", marginBottom: "8px" }}>No orders yet</h3>
          <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "280px", marginBottom: "28px", lineHeight: "1.5" }}>
            Your frequently purchased items will appear here after your first order.
          </p>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "#318616",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              padding: "12px 32px",
              fontSize: "14px",
              fontWeight: "750",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(49, 134, 22, 0.15)"
            }}
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "750", color: "#64748b", marginBottom: "4px" }}>Recently Ordered</h2>
          
          {reorderItems.map(item => {
            const cartKey = getCartKey ? getCartKey({ ...item.originalProduct, selectedWeight: item.weight }) : `${item.productId}_${item.weight}`;
            const cartQty = cart[cartKey]?.quantity || 0;
            const isOos = item.currentStock <= 0;

            return (
              <div
                key={`${item.productId}_${item.weight}`}
                style={{
                  background: "#ffffff",
                  padding: "16px",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  gap: "16px",
                  alignItems: "center",
                  position: "relative",
                  transition: "transform 150ms ease"
                }}
              >
                {/* Product Image */}
                <div style={{ position: "relative" }}>
                  <img
                    src={item.image || "https://res.cloudinary.com/dshelwy43/image/upload/v1783245601/66ea9503-f944-4f5f-bb44-8608a0355e3a_ee7d3d13-c857-4e5a-96b1-3c79da306b9e_j6uscb.png"}
                    alt={item.name}
                    style={{
                      width: "70px",
                      height: "70px",
                      objectFit: "contain",
                      borderRadius: "12px",
                      background: "#f8fafc",
                      opacity: isOos ? 0.6 : 1
                    }}
                  />
                  {isOos && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(255, 255, 255, 0.7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "12px"
                    }}>
                      <span style={{
                        background: "#ef4444",
                        color: "white",
                        fontSize: "9px",
                        fontWeight: "800",
                        padding: "2px 6px",
                        borderRadius: "4px"
                      }}>OUT OF STOCK</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "750", color: "#1e293b", margin: "0 0 4px 0" }}>{item.name}</h3>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 8px 0" }}>{item.weight}</p>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {item.currentOriginalPrice > item.currentPrice && (
                      <span style={{ fontSize: "12px", color: "#94a3b8", textDecoration: "line-through" }}>
                        ₹{item.currentOriginalPrice}
                      </span>
                    )}
                    <span style={{ fontSize: "14px", fontWeight: "800", color: "#1e293b" }}>
                      ₹{item.currentPrice}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div>
                  {isOos ? (
                    <button
                      disabled
                      style={{
                        background: "#e2e8f0",
                        color: "#94a3b8",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px 16px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "not-allowed"
                      }}
                    >
                      Add
                    </button>
                  ) : cartQty > 0 ? (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      background: "#318616",
                      borderRadius: "8px",
                      color: "white",
                      overflow: "hidden"
                    }}>
                      <button
                        onClick={() => removeFromCart({ ...item.originalProduct, selectedWeight: item.weight, price: item.currentPrice })}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "white",
                          padding: "8px 12px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontSize: "12px", fontWeight: "850", minWidth: "16px", textAlign: "center" }}>{cartQty}</span>
                      <button
                        onClick={() => handleSingleAdd(item)}
                        disabled={cartQty >= item.currentStock}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "white",
                          padding: "8px 12px",
                          cursor: cartQty >= item.currentStock ? "not-allowed" : "pointer",
                          opacity: cartQty >= item.currentStock ? 0.5 : 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSingleAdd(item)}
                      style={{
                        background: "#ffffff",
                        color: "#318616",
                        border: "1px solid #318616",
                        borderRadius: "8px",
                        padding: "8px 20px",
                        fontSize: "12px",
                        fontWeight: "750",
                        cursor: "pointer",
                        transition: "background-color 150ms ease"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#f0fdf4";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "#ffffff";
                      }}
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
