import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ProductCard from "../ProductCard";
import { MOBILE_NAV_TOTAL_OFFSET } from "../constants/layoutConstants";
import SEO from "../components/common/SEO";

const QUICK_TEMPLATES = [
  {
    name: "Hostel Essentials",
    items: ["Bed Sheet", "Extension Box", "Hanger", "Laundry Bag", "Pillow Cover"]
  },
  {
    name: "Monthly Grocery",
    items: ["Atta", "Rice", "Dal", "Oil", "Salt", "Sugar"]
  },
  {
    name: "Breakfast Items",
    items: ["Bread", "Butter", "Eggs", "Milk", "Jam"]
  },
  {
    name: "Exam Week Snacks",
    items: ["Maggi", "Chips", "Energy Drink", "Chocolate", "Biscuits"]
  },
  {
    name: "Fruits & Health",
    items: ["Apple", "Banana", "Orange", "Coconut Water"]
  }
];

export default function ShoppingListPage({
  products = [],
  addToCart,
  removeFromCart,
  cartItems = [],
  setCartItems
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listId = searchParams.get("listId");
  const { token, isLoggedIn } = useContext(AuthContext);

  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [items, setItems] = useState(() => {
    try {
      const savedItems = localStorage.getItem("shoppingListItems");
      return savedItems ? JSON.parse(savedItems) : [];
    } catch (e) {
      console.error("Error reading shoppingListItems:", e);
      return [];
    }
  });
  const [inputValue, setInputValue] = useState("");
  const [listName, setListName] = useState("My Shopping List");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Load active shopping list on mount (either from listId query param or localStorage shoppingListItems)
  useEffect(() => {
    if (listId) {
      // Load saved list by listId
      const localLists = localStorage.getItem("buyto_saved_lists");
      if (localLists) {
        const lists = JSON.parse(localLists);
        const matched = lists.find(l => String(l._id) === String(listId) || String(l.id) === String(listId));
        if (matched) {
          setListName(matched.name);
          setItems(matched.items || []);
          return;
        }
      }
      
      // Fetch from backend as fallback if logged in
      if (isLoggedIn && token) {
        fetch(window.API_BASE_URL + "/api/auth/shopping-lists", {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.savedLists) {
              const matched = data.savedLists.find(l => String(l._id) === String(listId));
              if (matched) {
                setListName(matched.name);
                setItems(matched.items || []);
              }
            }
          })
          .catch(err => console.error("Error loading list:", err));
      }
    } else {
      // Restore On Page Load
      const savedItems = localStorage.getItem("shoppingListItems");
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }
    }
  }, [listId, token, isLoggedIn]);

  // Auto Save
  useEffect(() => {
    localStorage.setItem("shoppingListItems", JSON.stringify(items));
  }, [items]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Fuzzy matching logic to calculate analytics
  const analytics = useMemo(() => {
    let estimatedCost = 0;
    let availableCount = 0;

    items.forEach(item => {
      if (item.completed) return;
      const query = item.name.toLowerCase().trim();
      if (!query) return;

      // Simple fuzzy matching
      const matches = products.filter(p => {
        const name = (p.name || "").toLowerCase();
        return name.includes(query) || query.includes(name);
      });

      if (matches.length > 0) {
        availableCount += 1;
        // Take cheapest match price
        const prices = matches.map(m => m.price || 0);
        estimatedCost += Math.min(...prices);
      } else {
        // Assume default minimal cost if no match
        estimatedCost += 40;
      }
    });

    return {
      totalItems: items.length,
      estimatedCost,
      availableProducts: availableCount
    };
  }, [items, products]);

  // Memoized catalog filtering/matching for the View Products feature
  const matchedProductsByItem = useMemo(() => {
    if (items.length === 0 || products.length === 0) return {};
    const result = {};

    items.forEach(item => {
      const query = item.name.toLowerCase().trim();
      if (!query) return;

      const matches = products.filter(p => {
        const name = (p.name || "").toLowerCase();
        const brand = (p.brand || "").toLowerCase();
        const category = (p.category || "").toLowerCase();
        const subcategory = (p.subcategory || "").toLowerCase();
        
        let keywordsMatch = false;
        if (p.keywords) {
          if (Array.isArray(p.keywords)) {
            keywordsMatch = p.keywords.some(k => (k || "").toLowerCase().includes(query) || query.includes((k || "").toLowerCase()));
          } else if (typeof p.keywords === "string") {
            keywordsMatch = p.keywords.toLowerCase().includes(query) || query.includes(p.keywords.toLowerCase());
          }
        }

        return (
          name.includes(query) || query.includes(name) ||
          brand.includes(query) || query.includes(brand) ||
          category.includes(query) || query.includes(category) ||
          subcategory.includes(query) || query.includes(subcategory) ||
          keywordsMatch
        );
      });

      result[item.name] = matches;
    });

    return result;
  }, [items, products]);

  // Add Item Logic
  const handleAddItem = () => {
    if (!inputValue.trim()) return;

    // Support comma-separated entries
    const newNames = inputValue.split(",").map(name => name.trim()).filter(Boolean);
    const newItems = newNames.map(name => ({
      name,
      completed: false
    }));

    setItems(prev => [...prev, ...newItems]);
    setInputValue("");
  };

  // Toggle Checkbox
  const handleToggleComplete = (index) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, completed: !item.completed };
      }
      return item;
    }));
  };

  // Delete Item
  const handleDeleteItem = (index) => {
    const updated = items.filter((_, idx) => idx !== index);
    setItems(updated);
    localStorage.setItem("shoppingListItems", JSON.stringify(updated));
  };

  // Clear List
  const handleClearList = () => {
    setItems([]);
    localStorage.removeItem("shoppingListItems");
  };

  // Apply Quick Template
  const handleApplyTemplate = (template) => {
    const newItems = template.items.map(name => ({
      name,
      completed: false
    }));
    setItems(prev => [...prev, ...newItems]);
    showToast(`Added items from ${template.name}!`);
  };

  // Save List Action
  const handleSaveListClick = () => {
    if (items.length === 0) {
      alert("Please add some items to your list first!");
      return;
    }
    setShowSaveModal(true);
  };

  // Save List Submit
  const handleSaveListSubmit = async () => {
    if (!listName.trim()) return;

    const listData = {
      name: listName.trim(),
      items
    };

    // Update locally
    let localLists = [];
    const local = localStorage.getItem("buyto_saved_lists");
    if (local) {
      localLists = JSON.parse(local);
    }

    if (listId) {
      // Overwrite existing
      localLists = localLists.map(l => {
        if (String(l._id) === String(listId) || String(l.id) === String(listId)) {
          return { ...l, name: listName.trim(), items };
        }
        return l;
      });
    } else {
      // Add new
      const tempId = String(Date.now());
      localLists.push({
        _id: tempId,
        id: tempId,
        ...listData
      });
    }
    localStorage.setItem("buyto_saved_lists", JSON.stringify(localLists));

    // Save to backend if logged in
    if (isLoggedIn && token) {
      try {
        let res;
        if (listId) {
          res = await fetch(window.API_BASE_URL + `/api/auth/shopping-lists/${listId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(listData)
          });
        } else {
          res = await fetch(window.API_BASE_URL + "/api/auth/shopping-lists", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(listData)
          });
        }
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            localStorage.setItem("buyto_saved_lists", JSON.stringify(data.savedLists));
          }
        }
      } catch (err) {
        console.error("Failed to save list to backend user profile:", err);
      }
    }

    setShowSaveModal(false);
    showToast("Shopping list saved successfully!");
    setTimeout(() => navigate("/saved-lists"), 800);
  };

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewResults, setPreviewResults] = useState([]);

  // Normalize string for plural/singular word matching
  const normalizePlural = (w) => {
    if (w.endsWith("ies")) return w.slice(0, -3) + "y";
    if (w.endsWith("es")) return w.slice(0, -2);
    if (w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
    return w;
  };

  const normalizeString = (str) => {
    return (str || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map(normalizePlural)
      .join(" ");
  };

  const calculateConfidence = (p, query) => {
    const name = (p.name || "").toLowerCase().trim();
    const category = (p.category || "").toLowerCase().trim();
    const subCategory = (p.subCategory || p.subcategory || "").toLowerCase().trim();
    const tags = Array.isArray(p.tags) ? p.tags.map(t => (t || "").toLowerCase().trim()) : [];
    const brand = (p.brand || "").toLowerCase().trim();

    const normName = normalizeString(name);
    const normQuery = normalizeString(query);

    // 1. Exact name match
    if (name === query || normName === normQuery) return 100;

    // 2. Space/Punctuation removed match
    const cleanName = name.replace(/[^a-z0-9]/g, "");
    const cleanQuery = query.replace(/[^a-z0-9]/g, "");
    if (cleanName === cleanQuery) return 95;

    // 3. Whole phrase match on normalized strings
    const escaped = normQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const wholeWordRegex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (wholeWordRegex.test(normName)) {
      if (normName.startsWith(normQuery) || normName.endsWith(normQuery)) {
        return 90;
      }
      return 88;
    }

    // 4. Exact tag match
    if (tags.includes(query) || tags.includes(normQuery)) return 85;

    // 5. Brand match
    if (brand && query.includes(brand)) {
      const remainingQuery = query.replace(brand, "").trim();
      const normRemaining = normalizeString(remainingQuery);
      if (normRemaining && normName.includes(normRemaining)) {
        return 85;
      }
    }

    // 6. Word level matches
    const queryWords = query.split(/\s+/).filter(w => w.length > 1);
    if (queryWords.length > 0) {
      const matchingWords = queryWords.filter(word => {
        const wEscaped = normalizePlural(word).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const wRegex = new RegExp(`\\b${wEscaped}\\b`, 'i');
        return wRegex.test(normName) || wRegex.test(category) || wRegex.test(subCategory) || tags.some(t => wRegex.test(t));
      });
      if (matchingWords.length === queryWords.length) {
        const nameWordCount = name.split(/\s+/).length;
        const ratio = queryWords.length / nameWordCount;
        return Math.min(84, Math.round(60 + ratio * 24));
      }
    }

    // 7. Category / Subcategory exact matches
    if (category === query || subCategory === query) return 50;

    // 8. Tag contains query
    if (tags.some(tag => tag.includes(query) || query.includes(tag))) return 70;

    // 9. Name contains query substring
    if (name.includes(query)) return 60;

    return 0;
  };

  const getSuggestedAlternatives = (products, query) => {
    const queryWords = query.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) return [];
    
    // Find products containing any query word, sorting by how many match
    const scored = products.map(p => {
      const name = (p.name || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      const tags = Array.isArray(p.tags) ? p.tags.map(t => (t || "").toLowerCase()) : [];
      let score = 0;
      queryWords.forEach(word => {
        if (name.includes(word)) score += 3;
        if (category.includes(word)) score += 1;
        if (tags.some(t => t.includes(word))) score += 2;
      });
      return { product: p, score };
    }).filter(s => s.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map(s => s.product);
  };

  const handleViewProducts = () => {
    if (items.length === 0) {
      alert("Please add some items to your list first!");
      return;
    }
    localStorage.setItem("buyto_proceed_items", JSON.stringify(items));
    navigate("/shopping-list/results");
  };

  // Proceed Action (Smart Checkout Helper)
  const handleProceed = () => {
    if (items.length === 0) {
      alert("Please add some items to your list first!");
      return;
    }

    // Analyze list items
    const results = items.map(item => {
      const query = item.name.toLowerCase().trim();
      
      const candidates = products.map(p => ({
        product: p,
        confidence: calculateConfidence(p, query)
      })).filter(c => c.confidence > 50);

      // Sort by confidence descending
      candidates.sort((a, b) => b.confidence - a.confidence);

      const strongCandidates = candidates.filter(c => c.confidence > 85);
      
      let status = "";
      let matchedProduct = null;
      let score = 0;
      let matchedList = [];

      // Check if already in cart
      const checkCartStatus = (prod) => {
        if (!prod) return false;
        const prodId = String(prod._id || prod.id);
        return cartItems.some(ci => String(ci._id || ci.id) === prodId);
      };

      if (strongCandidates.length === 1) {
        matchedProduct = strongCandidates[0].product;
        score = strongCandidates[0].confidence;
        const alreadyInCart = checkCartStatus(matchedProduct);
        status = alreadyInCart ? "already_in_cart" : "auto_added";
      } else if (strongCandidates.length > 1) {
        status = "needs_selection";
        matchedList = strongCandidates.map(c => c.product);
      } else {
        // No strong candidates (confidence > 85)
        if (candidates.length > 0) {
          status = "needs_selection";
          matchedList = candidates.map(c => c.product);
        } else {
          status = "not_available";
        }
      }

      const alternatives = status === "not_available" ? getSuggestedAlternatives(products, item.name) : [];

      return {
        item,
        status,
        matchedProduct,
        confidence: score,
        matchedList,
        alternatives
      };
    });

    setPreviewResults(results);
    setShowPreviewModal(true);
  };

  const handleConfirmProceed = () => {
    setShowPreviewModal(false);

    // 1. Gather all products that were resolved and need to be auto-added
    const toAdd = [];
    previewResults.forEach(res => {
      if (res.status === "auto_added" && res.matchedProduct) {
        toAdd.push({
          ...res.matchedProduct,
          addedFromShoppingList: true,
          originalShoppingListName: res.item.name,
          quantity: 1
        });
      }
    });

    // 2. Add them to cartItems
    if (toAdd.length > 0) {
      setCartItems(prev => {
        let next = [...prev];
        toAdd.forEach(newProduct => {
          const productId = String(newProduct._id || newProduct.id);
          const existingIdx = next.findIndex(item => String(item._id || item.id) === productId);
          if (existingIdx !== -1) {
            next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + 1 };
          } else {
            next.push(newProduct);
          }
        });
        localStorage.setItem("cart", JSON.stringify(next));
        return next;
      });
    }

    // 3. Identify unresolved items to send to Smart Matching page
    const unresolved = previewResults.filter(res => res.status === "needs_selection" || res.status === "not_available");
    
    // Save metadata about original list for summary:
    const checkoutSummary = {
      totalItems: items.length,
      matchedCount: previewResults.filter(res => res.status === "auto_added" || res.status === "already_in_cart").length,
      unavailableCount: previewResults.filter(res => res.status === "not_available").length,
      needsSelectionCount: unresolved.filter(res => res.status === "needs_selection").length,
      originalList: items.map(it => it.name)
    };
    localStorage.setItem("buyto_checkout_summary", JSON.stringify(checkoutSummary));

    if (unresolved.length > 0) {
      localStorage.setItem("buyto_proceed_items", JSON.stringify(unresolved));
      navigate("/shopping-list/smart-matching");
    } else {
      navigate("/cart");
    }
  };

  return (
    <div style={containerStyle}>
      <SEO title="Shopping List" description="Create, manage and save your shopping lists on Buyto." />
      {toastMessage && (
        <div style={toastStyle}>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header style={headerStyle}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>
          ← Back
        </button>
        <h1 style={titleStyle}>Shopping List</h1>
        <button onClick={() => navigate("/saved-lists")} style={shareBtnStyle}>
          ❤️ Lists
        </button>
      </header>

      {/* Main Form */}
      <main style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: "160px" }}>
        
        {/* Input Section */}
        <div style={inputContainerStyle}>
          <input
            type="text"
            placeholder="Enter new item (e.g. Milk, Bread)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddItem();
            }}
            style={inputStyle}
          />
          <button onClick={handleAddItem} style={addBtnStyle}>
            ＋
          </button>
        </div>

        {/* Quick Templates */}
        <div style={{ marginBottom: "24px" }}>
          <h4 style={sectionHeaderStyle}>💡 Quick Templates</h4>
          <div style={templateGridStyle}>
            {QUICK_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                onClick={() => handleApplyTemplate(tmpl)}
                style={tmplBtnStyle}
              >
                ＋ {tmpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Shopping List Rows */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h4 style={{ ...sectionHeaderStyle, margin: 0 }}>🛒 Items ({items.length})</h4>
            {items.length > 0 && (
              <button
                onClick={handleClearList}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ef4444",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                Clear List
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div style={emptyStateStyle}>
              <span style={{ fontSize: "36px" }}>📝</span>
              <p style={{ margin: "8px 0 0 0", color: "#64748b", fontSize: "13px" }}>
                List is empty. Enter items above or use a quick template!
              </p>
            </div>
          ) : (
            <div style={listContainerStyle}>
              {items.map((item, idx) => (
                <div key={idx} style={itemRowStyle}>
                  {/* Left Checkbox */}
                  <div
                    onClick={() => handleToggleComplete(idx)}
                    style={checkboxStyle(item.completed)}
                  >
                    {item.completed && "✓"}
                  </div>

                  {/* Right Card Container */}
                  <div style={cardContentStyle(item.completed)}>
                    <span style={itemTextStyle(item.completed)}>
                      {item.name}
                    </span>
                    <button onClick={() => handleDeleteItem(idx)} style={deleteBtnStyle}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Sticky Action Bar & Analytics */}
      <div style={{ ...stickyFooterStyle, bottom: windowWidth < 768 ? `${MOBILE_NAV_TOTAL_OFFSET}px` : "0px" }}>
        {/* Analytics Block */}
        <div style={analyticsContainerStyle}>
          <div style={analyticItemStyle}>
            <span style={analyticValStyle}>{analytics.totalItems}</span>
            <span style={analyticLabelStyle}>Items</span>
          </div>
          <div style={dividerStyle} />
          <div style={analyticItemStyle}>
            <span style={analyticValStyle}>₹{analytics.estimatedCost}</span>
            <span style={analyticLabelStyle}>Est. Cost</span>
          </div>
          <div style={dividerStyle} />
          <div style={analyticItemStyle}>
            <span style={analyticValStyle}>{analytics.availableProducts}</span>
            <span style={analyticLabelStyle}>Available</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={buttonContainerStyle}>
          <button onClick={handleSaveListClick} style={saveListBtnStyle}>
            Save List
          </button>
          <button onClick={handleViewProducts} style={viewProductsBtnStyle}>
            View Products
          </button>
          <button onClick={handleProceed} style={proceedBtnStyle}>
            Proceed →
          </button>
        </div>
      </div>

      {/* Save List Name Modal */}
      {showSaveModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "850", color: "#1e293b" }}>
              Save Shopping List
            </h3>
            <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 16px 0" }}>
              Give your shopping list a name to save it to your wishlist.
            </p>
            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              style={modalInputStyle}
              placeholder="List Name"
              autoFocus
            />
            <div style={modalActionsStyle}>
              <button onClick={() => setShowSaveModal(false)} style={modalCancelBtnStyle}>
                Cancel
              </button>
              <button onClick={handleSaveListSubmit} style={modalSaveBtnStyle}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Preview Modal */}
      {showPreviewModal && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: "450px" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "900", color: "#1e293b", textAlign: "center" }}>
              Smart Match Preview
            </h3>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 16px 0", textAlign: "center", fontWeight: "600" }}>
              {items.length} Items Searched
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto", marginBottom: "20px", paddingRight: "4px" }}>
              {previewResults.map((res, idx) => (
                <div key={idx} style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: "1px solid",
                  borderColor: res.status === "auto_added" || res.status === "already_in_cart" ? "#dcfce7" : res.status === "needs_selection" ? "#fef3c7" : "#fee2e2",
                  background: res.status === "auto_added" || res.status === "already_in_cart" ? "#f0fdf4" : res.status === "needs_selection" ? "#fffbeb" : "#fef2f2",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "14px", fontWeight: "800", color: "#1e293b" }}>
                      {res.item.name}
                    </span>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: "900",
                      padding: "2px 8px",
                      borderRadius: "20px",
                      color: res.status === "auto_added" || res.status === "already_in_cart" ? "#15803d" : res.status === "needs_selection" ? "#b45309" : "#b91c1c",
                      background: res.status === "auto_added" || res.status === "already_in_cart" ? "#dcfce7" : res.status === "needs_selection" ? "#fef3c7" : "#fee2e2",
                    }}>
                      {res.status === "already_in_cart" && "Already in Cart"}
                      {res.status === "auto_added" && "Auto-Added"}
                      {res.status === "needs_selection" && "Needs Selection"}
                      {res.status === "not_available" && "Not Available"}
                    </span>
                  </div>

                  {/* Match detail text */}
                  {(res.status === "auto_added" || res.status === "already_in_cart") && res.matchedProduct && (
                    <div style={{ fontSize: "12px", color: "#475569", fontWeight: "600", display: "flex", justifyContent: "space-between" }}>
                      <span>✓ {res.matchedProduct.name}</span>
                      <span style={{ color: "#10b981", fontWeight: "800" }}>({res.confidence}%)</span>
                    </div>
                  )}

                  {res.status === "needs_selection" && (
                    <div style={{ fontSize: "12px", color: "#b45309", fontWeight: "600" }}>
                      ⚠ {res.matchedList.length} possible matches found
                    </div>
                  )}

                  {res.status === "not_available" && (
                    <div style={{ fontSize: "12px", color: "#b91c1c", fontWeight: "600" }}>
                      ✗ No matches available
                      {res.alternatives.length > 0 && (
                        <div style={{ marginTop: "4px", color: "#475569", fontSize: "11px", fontWeight: "700" }}>
                          Suggested: {res.alternatives.map(alt => alt.name).join(", ")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={modalActionsStyle}>
              <button onClick={() => setShowPreviewModal(false)} style={modalCancelBtnStyle}>
                Cancel
              </button>
              <button onClick={handleConfirmProceed} style={modalSaveBtnStyle}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
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
  marginBottom: "20px",
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

const shareBtnStyle = {
  background: "transparent",
  border: "none",
  color: "#FF4D4F",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
};

const inputContainerStyle = {
  display: "flex",
  gap: "10px",
  marginBottom: "24px",
};

const inputStyle = {
  flexGrow: 1,
  padding: "14px 20px",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  fontSize: "14px",
  fontWeight: "600",
  outline: "none",
  background: "white",
  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
};

const addBtnStyle = {
  background: "#10b981",
  color: "white",
  border: "none",
  width: "50px",
  borderRadius: "16px",
  fontSize: "18px",
  fontWeight: "800",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
};

const sectionHeaderStyle = {
  margin: "0 0 12px 0",
  fontSize: "13px",
  fontWeight: "800",
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const templateGridStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const tmplBtnStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "700",
  color: "#475569",
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(0,0,0,0.01)",
};

const listContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const itemRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const checkboxStyle = (completed) => ({
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  border: completed ? "2px solid #10b981" : "2px solid #cbd5e1",
  background: completed ? "#10b981" : "white",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: "900",
  cursor: "pointer",
  transition: "all 0.15s ease",
});

const cardContentStyle = (completed) => ({
  flexGrow: 1,
  background: "white",
  borderRadius: "16px",
  padding: "12px 16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
  border: "1px solid #f1f5f9",
  opacity: completed ? 0.7 : 1,
  transition: "opacity 0.15s ease",
});

const itemTextStyle = (completed) => ({
  fontSize: "14px",
  fontWeight: "700",
  color: completed ? "#94a3b8" : "#1e293b",
  textDecoration: completed ? "line-through" : "none",
});

const deleteBtnStyle = {
  background: "transparent",
  border: "none",
  fontSize: "14px",
  cursor: "pointer",
  padding: "4px",
};

const emptyStateStyle = {
  background: "white",
  borderRadius: "16px",
  padding: "32px 16px",
  textAlign: "center",
  border: "1px solid #e2e8f0",
};

const stickyFooterStyle = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  background: "white",
  boxShadow: "0 -8px 24px rgba(0,0,0,0.06)",
  padding: "16px 20px 24px 20px",
  zIndex: 1000,
  borderTop: "1px solid #e2e8f0",
};

const analyticsContainerStyle = {
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  background: "#f8fafc",
  padding: "12px 8px",
  borderRadius: "16px",
  marginBottom: "14px",
  border: "1px solid #f1f5f9",
};

const analyticItemStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const analyticValStyle = {
  fontSize: "15px",
  fontWeight: "900",
  color: "#1e293b",
};

const analyticLabelStyle = {
  fontSize: "10px",
  color: "#64748b",
  fontWeight: "700",
  marginTop: "2px",
};

const dividerStyle = {
  width: "1px",
  height: "20px",
  background: "#e2e8f0",
};

const buttonContainerStyle = {
  display: "flex",
  gap: "12px",
};

const saveListBtnStyle = {
  flex: 1,
  background: "#f1f5f9",
  color: "#475569",
  border: "none",
  borderRadius: "14px",
  height: "46px",
  fontSize: "14px",
  fontWeight: "750",
  cursor: "pointer",
};

const proceedBtnStyle = {
  flex: 1.5,
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

// Modal styles
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100000,
  padding: "16px",
  backdropFilter: "blur(4px)",
};

const modalContentStyle = {
  background: "white",
  borderRadius: "24px",
  padding: "24px",
  width: "100%",
  maxWidth: "340px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
  boxSizing: "border-box",
};

const modalInputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1.5px solid #cbd5e1",
  fontSize: "14px",
  fontWeight: "600",
  color: "#1e293b",
  outline: "none",
  boxSizing: "border-box",
  marginBottom: "20px",
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
};

const modalCancelBtnStyle = {
  background: "#f1f5f9",
  border: "none",
  borderRadius: "12px",
  padding: "10px 18px",
  fontSize: "13px",
  fontWeight: "700",
  color: "#475569",
  cursor: "pointer",
};

const modalSaveBtnStyle = {
  background: "linear-gradient(135deg, #10b981, #059669)",
  border: "none",
  borderRadius: "12px",
  padding: "10px 18px",
  fontSize: "13px",
  fontWeight: "800",
  color: "white",
  cursor: "pointer",
};

const viewProductsBtnStyle = {
  flex: 1.2,
  background: "#10b981",
  color: "white",
  border: "none",
  borderRadius: "14px",
  height: "46px",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
};

const productsModalContentStyle = {
  background: "white",
  borderRadius: "28px",
  padding: "24px",
  width: "100%",
  maxWidth: "600px",
  maxHeight: "85vh",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 25px 60px rgba(0,0,0,0.18)",
  boxSizing: "border-box",
};

const productsModalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
};

const closeProductsModalBtnStyle = {
  background: "#f1f5f9",
  border: "none",
  borderRadius: "12px",
  padding: "8px 16px",
  fontSize: "13px",
  fontWeight: "800",
  color: "#475569",
  cursor: "pointer",
};

const productsModalBodyStyle = {
  flexGrow: 1,
  overflowY: "auto",
  paddingRight: "4px",
};

const productGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: "12px",
};
