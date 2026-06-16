import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../ProductCard";
import { MOBILE_NAV_TOTAL_OFFSET } from "../constants/layoutConstants";

export default function ShoppingListResultsPage({
  products = [],
  addToCart,
  removeFromCart,
  cartItems = [],
  setCartItems
}) {
  const navigate = useNavigate();
  const [listItems, setListItems] = useState([]);
  const [toastMessage, setToastMessage] = useState("");

  // Load proceed items on mount
  useEffect(() => {
    const saved = localStorage.getItem("buyto_proceed_items");
    if (saved) {
      setListItems(JSON.parse(saved));
    }
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Group fuzzy matches by shopping list item
  const groupedResults = useMemo(() => {
    return listItems.map(item => {
      const query = item.name.toLowerCase().trim();
      if (!query) {
        return { item, matches: [] };
      }

      // Exact, partial name, category keywords, and tags match with word boundary safety
      const matches = products.filter(p => {
        const name = (p.name || "").toLowerCase();
        const category = (p.category || "").toLowerCase();
        const subCategory = (p.subCategory || p.subcategory || "").toLowerCase();
        const tags = Array.isArray(p.tags) ? p.tags.map(t => (t || "").toLowerCase()) : [];
        const brand = (p.brand || "").toLowerCase();

        // Helper to check if a target string contains the query as a whole word/phrase
        const containsPhrase = (target, phrase) => {
          if (!target || !phrase) return false;
          if (target === phrase) return true;
          const escaped = phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(`\\b${escaped}\\b`, 'i');
          return regex.test(target);
        };

        // Helper to check if all words in query are present as whole words in target list
        const queryWords = query.split(/\s+/).filter(w => w.length > 1);
        const matchAllQueryWords = (targetList) => {
          return queryWords.every(word => {
            const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`\\b${escaped}\\b`, 'i');
            return targetList.some(t => regex.test(t));
          });
        };

        // 1. Exact or whole-phrase name match
        if (containsPhrase(name, query)) return true;

        // 2. Category / subcategory keywords match as whole phrase
        if (containsPhrase(category, query) || containsPhrase(subCategory, query)) return true;

        // 3. Tags match as whole phrase
        if (tags.some(tag => tag === query || containsPhrase(tag, query))) return true;

        // 4. Word-level matching (all query words present as whole words in the product details)
        const allTargets = [name, category, subCategory, ...tags, brand];
        if (queryWords.length > 0 && matchAllQueryWords(allTargets)) {
          return true;
        }

        return false;
      });

      return {
        item,
        matches
      };
    });
  }, [listItems, products]);

  // Track all matched products (flattened list)
  const allMatchedProducts = useMemo(() => {
    const list = [];
    const seen = new Set();
    groupedResults.forEach(group => {
      group.matches.forEach(p => {
        const id = p._id || p.id;
        if (!seen.has(id)) {
          seen.add(id);
          list.push(p);
        }
      });
    });
    return list;
  }, [groupedResults]);

  // Add All Matching Products to Cart
  const handleAddAll = () => {
    if (allMatchedProducts.length === 0) {
      alert("No matching products found to add!");
      return;
    }

    setCartItems(prev => {
      let next = [...prev];
      allMatchedProducts.forEach(p => {
        const productId = String(p._id || p.id);
        const existingIdx = next.findIndex(item => String(item._id || item.id) === productId);
        if (existingIdx !== -1) {
          next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + 1 };
        } else {
          next.push({ ...p, quantity: 1 });
        }
      });
      return next;
    });

    showToast(`Added all ${allMatchedProducts.length} matching products to cart!`);
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
        <div style={headerTextContainerStyle}>
          <h1 style={titleStyle}>Products From Your List</h1>
          <span style={subtitleStyle}>
            {listItems.length} items searched • {allMatchedProducts.length} products found
          </span>
        </div>
        <button onClick={() => navigate("/cart")} style={cartBtnStyle}>
          🛒 Cart ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})
        </button>
      </header>

      {/* Action panel */}
      <div style={actionPanelStyle}>
        <button onClick={handleAddAll} style={addAllBtnStyle}>
          Add All Matching Products to Cart
        </button>
        <button onClick={() => navigate("/")} style={continueShoppingBtnStyle}>
          Continue Shopping
        </button>
      </div>

      {/* Grouped matches list */}
      <main style={{ maxWidth: "700px", margin: "0 auto", paddingBottom: `${MOBILE_NAV_TOTAL_OFFSET + 24}px` }}>
        {groupedResults.map((group, groupIdx) => {
          const hasMatches = group.matches.length > 0;
          return (
            <div key={groupIdx} style={groupContainerStyle}>
              <h2 style={groupTitleStyle}>
                {group.item.name}
              </h2>

              {!hasMatches ? (
                <div style={noMatchCardStyle}>
                  No matching products available
                </div>
              ) : (
                <div style={matchesGridStyle}>
                  {group.matches.map((product) => {
                    const productId = product._id || product.id;
                    return (
                      <div key={productId} style={itemCardContainerStyle}>
                        {/* Product Card wrapper */}
                        <div style={{ flexGrow: 1 }}>
                          <ProductCard
                            product={product}
                            addToCart={addToCart}
                            removeFromCart={removeFromCart}
                            cartItems={cartItems}
                            windowWidth={window.innerWidth}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </main>
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

const headerTextContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};

const subtitleStyle = {
  fontSize: "11px",
  color: "#64748b",
  fontWeight: "700",
  marginTop: "2px",
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

const actionPanelStyle = {
  maxWidth: "700px",
  margin: "0 auto 24px auto",
  background: "white",
  borderRadius: "20px",
  padding: "16px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  alignItems: "center",
};

const addAllBtnStyle = {
  width: "100%",
  background: "linear-gradient(135deg, #10b981, #059669)",
  color: "white",
  border: "none",
  borderRadius: "14px",
  height: "46px",
  fontSize: "14px",
  fontWeight: "850",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
};

const continueShoppingBtnStyle = {
  width: "100%",
  background: "#f1f5f9",
  color: "#475569",
  border: "none",
  borderRadius: "14px",
  height: "46px",
  fontSize: "14px",
  fontWeight: "750",
  cursor: "pointer",
};

const groupContainerStyle = {
  background: "white",
  borderRadius: "24px",
  padding: "20px",
  marginBottom: "20px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
  border: "1px solid #f1f5f9",
};

const groupTitleStyle = {
  margin: "0 0 16px 0",
  fontSize: "18px",
  color: "#1e293b",
  fontWeight: "900",
};

const noMatchCardStyle = {
  background: "#fffbeb",
  border: "1px solid #fef3c7",
  borderRadius: "16px",
  padding: "16px",
  color: "#d97706",
  fontSize: "13px",
  fontWeight: "600",
  textAlign: "center",
};

const matchesGridStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const itemCardContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
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
