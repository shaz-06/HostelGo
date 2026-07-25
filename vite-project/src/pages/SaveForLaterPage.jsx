import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ProductCard from "../ProductCard";
import SEO from "../components/common/SEO";

export default function SaveForLaterPage({
  products = [],
  addToCart,
  removeFromCart,
  cart = {},
  cartItems = [],
  windowWidth,
  getCartKey,
  setSelectedProduct
}) {
  const navigate = useNavigate();
  const { token, isLoggedIn } = useContext(AuthContext);

  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recently-saved");

  // Fetch / Load saved products
  useEffect(() => {
    const loadSavedProducts = async () => {
      if (token) {
        // Authenticated: load from backend DB
        try {
          const res = await fetch(window.API_BASE_URL + "/api/save-for-later", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.savedProducts) {
              setSavedItems(data.savedProducts);
            }
          }
        } catch (err) {
          console.error("Failed to load saved products:", err);
        } finally {
          setLoading(false);
        }
      } else {
        // Guest: load IDs from localStorage and map against all products catalog
        const local = localStorage.getItem("buyto_save_for_later");
        if (local) {
          try {
            const ids = JSON.parse(local);
            if (Array.isArray(ids)) {
              const mapped = ids.map(id => {
                const found = products.find(p => String(p._id || p.id) === String(id));
                if (found) {
                  return {
                    productId: found,
                    addedAt: new Date()
                  };
                }
                return null;
              }).filter(Boolean);
              setSavedItems(mapped);
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          setSavedItems([]);
        }
        setLoading(false);
      }
    };

    loadSavedProducts();
  }, [token, products]);

  // Search and Sort logic
  const processedItems = useMemo(() => {
    let items = savedItems.filter(item => item && item.productId);

    const query = searchQuery.toLowerCase().trim();
    if (query) {
      items = items.filter(item => {
        const p = item.productId;
        return (
          (p.name || "").toLowerCase().includes(query) ||
          (p.brand || "").toLowerCase().includes(query) ||
          (p.category || "").toLowerCase().includes(query)
        );
      });
    }

    items = [...items].sort((a, b) => {
      const pA = a.productId;
      const pB = b.productId;
      const priceA = pA.price || 0;
      const priceB = pB.price || 0;

      if (sortBy === "price-asc") {
        return priceA - priceB;
      } else if (sortBy === "price-desc") {
        return priceB - priceA;
      } else {
        return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
      }
    });

    return items;
  }, [savedItems, searchQuery, sortBy]);

  return (
    <div style={containerStyle}>
      <SEO title="Wishlist" description="View your saved products and favorite items on Buyto." />
      {/* Header */}
      <header style={headerStyle}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>
          ← Back
        </button>
        <h1 style={titleStyle}>📌 Save For Later</h1>
        <div style={{ width: "60px" }} />
      </header>

      <main style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "80px" }}>
        {/* Search & Sort Controls */}
        <div style={controlsContainerStyle}>
          <input
            type="text"
            placeholder="Search saved products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchStyle}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={selectStyle}
          >
            <option value="recently-saved">Recently Saved</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ color: "#64748b", fontWeight: "600" }}>Loading saved items...</p>
          </div>
        ) : processedItems.length === 0 ? (
          <div style={emptyStateStyle}>
            <span style={{ fontSize: "48px" }}>📌</span>
            <h3 style={{ margin: "12px 0 6px 0", fontSize: "16px", fontWeight: "800", color: "#1e293b" }}>
              No saved products
            </h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
              Bookmark items across our catalog to view them here later!
            </p>
            <button onClick={() => navigate("/")} style={browseBtnStyle}>
              Browse Products
            </button>
          </div>
        ) : (
          <div style={gridStyle}>
            {processedItems.map(item => (
              <ProductCard
                key={item.productId._id || item.productId.id}
                product={item.productId}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                cart={cart}
                cartItems={cartItems}
                windowWidth={windowWidth}
                getCartKey={getCartKey}
                setSelectedProduct={setSelectedProduct}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Styling
const containerStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "16px",
  fontFamily: "'Outfit', 'Inter', sans-serif"
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  background: "white",
  padding: "12px 16px",
  borderRadius: "20px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.03)"
};

const backBtnStyle = {
  background: "transparent",
  border: "none",
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer"
};

const titleStyle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: "900",
  color: "#1e293b"
};

const controlsContainerStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "20px",
  flexWrap: "wrap"
};

const searchStyle = {
  flexGrow: 1,
  minWidth: "200px",
  padding: "12px 16px",
  borderRadius: "14px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  fontWeight: "600",
  outline: "none",
  background: "white",
  boxShadow: "0 2px 8px rgba(0,0,0,0.01)"
};

const selectStyle = {
  padding: "12px 16px",
  borderRadius: "14px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  fontWeight: "700",
  color: "#475569",
  outline: "none",
  cursor: "pointer",
  background: "white"
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: "16px"
};

const emptyStateStyle = {
  background: "white",
  borderRadius: "24px",
  padding: "48px 24px",
  textAlign: "center",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
};

const browseBtnStyle = {
  marginTop: "16px",
  background: "#10b981",
  color: "white",
  border: "none",
  borderRadius: "12px",
  padding: "10px 20px",
  fontSize: "13px",
  fontWeight: "800",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
};
