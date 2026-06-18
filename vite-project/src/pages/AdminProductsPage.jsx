import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State for Adding/Editing Product
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "The Fruit Store",
    price: "",
    originalPrice: "",
    weight: "",
    stock: "",
    image: "",
    isTrending: false
  });

  const [categoriesList, setCategoriesList] = useState([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch(window.API_BASE_URL + "/api/categories");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategoriesList(data.map(c => c.name));
          }
        }
      } catch (err) {
        console.error("Error fetching categories in AdminProductsPage:", err);
      }
    };
    fetchCats();
  }, []);

  const defaultCategories = [
    "The Fruit Store",
    "The Veggie Store",
    "Dairy, Bread & Eggs",
    "Snacks",
    "Beverages",
    "Exclusive Deals",
    "Cleaners & Repellents",
    "The Bread Store",
    "Premium Pickles",
    "Sexual Wellness",
    "Electronics",
    "Fashion",
    "Hostel Essentials",
    "Beauty"
  ];

  const categories = categoriesList.length > 0 ? categoriesList : defaultCategories;

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + "/api/admin/products", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const status = res.status;
        let errMsg = "Failed to fetch products";
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch (e) { }
        console.error("=== [FRONTEND PRODUCTS FETCH ERROR] ===");
        console.error("Status Code:", status);
        console.error("Response Message:", errMsg);
        throw new Error(errMsg);
      }
      const data = await res.json();
      setProducts(data);
      setLoading(false);
    } catch (err) {
      console.error("=== [FRONTEND PRODUCTS LIST NETWORK ERROR] ===");
      console.error("Network Error:", err.message);
      setError(err.message || "Failed to load products");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleInlineUpdate = async (productId, field, value) => {
    try {
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + `/api/admin/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ [field]: Number(value) })
      });

      if (!res.ok) {
        const status = res.status;
        let errMsg = "Failed to update product details";
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch (e) { }
        console.error("=== [FRONTEND PRODUCT INLINE UPDATE ERROR] ===");
        console.error("Status Code:", status);
        console.error("Response Message:", errMsg);
        throw new Error(errMsg);
      }
      const updatedProduct = await res.json();

      setProducts((prev) =>
        prev.map((p) => (p._id === productId || p.id === productId ? { ...p, [field]: updatedProduct[field] } : p))
      );
      showToast(`Product ${field} updated successfully!`);
    } catch (err) {
      console.error(err);
      alert(`Error updating product: ${err.message}`);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product from the Buyto catalog?")) return;

    try {
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + `/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const status = res.status;
        let errMsg = "Failed to delete product";
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch (e) { }
        console.error("=== [FRONTEND PRODUCT DELETE ERROR] ===");
        console.error("Status Code:", status);
        console.error("Response Message:", errMsg);
        throw new Error(errMsg);
      }

      setProducts((prev) => prev.filter((p) => p._id !== productId && p.id !== productId));
      showToast("Product deleted successfully!");
    } catch (err) {
      console.error(err);
      alert(`Error deleting product: ${err.message}`);
    }
  };

  const uploadProductImage = async () => {
    if (!imageFile) {
      alert("Please select an image");
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append("image", imageFile);

      const res = await fetch(
        window.API_BASE_URL + "/api/upload",
        {
          method: "POST",
          body: formData
        }
      );

      const data = await res.json();

      if (data.success) {
        setNewProduct(prev => ({
          ...prev,
          image: data.imageUrl
        }));

        alert("Image uploaded successfully");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || newProduct.stock === "") {
      alert("Name, Price, and Stock are required fields!");
      return;
    }

    try {
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(window.API_BASE_URL + "/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newProduct,
          price: Number(newProduct.price),
          originalPrice: Number(newProduct.originalPrice || newProduct.price),
          stock: Number(newProduct.stock)
        })
      });

      if (!res.ok) {
        const status = res.status;
        let errMsg = "Failed to create product";
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch (e) { }
        console.error("=== [FRONTEND PRODUCT CREATE ERROR] ===");
        console.error("Status Code:", status);
        console.error("Response Message:", errMsg);
        throw new Error(errMsg);
      }
      const savedProduct = await res.json();

      setProducts((prev) => [savedProduct, ...prev]);
      setShowAddModal(false);
      setNewProduct({
        name: "",
        category: "The Fruit Store",
        price: "",
        originalPrice: "",
        weight: "",
        stock: "",
        image: "",
        isTrending: false
      });
      showToast("New product added to catalog successfully!");
    } catch (err) {
      console.error(err);
      alert(`Error creating product: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <span style={{ color: "#6B7280", fontWeight: "600", fontSize: "16px" }}>Synching Catalog...</span>
      </div>
    );
  }

  return (
    <div style={pageContainerStyle}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={toastStyle}>
          <span>⚡ {toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => navigate("/admin")} style={backBtnStyle}>
            ← Dashboard
          </button>
          <h1 style={titleStyle}>Catalog Inventory Manager</h1>
          <span style={badgeStyle}>{products.length} Items</span>
        </div>
        <button onClick={() => setShowAddModal(true)} style={addBtnStyle}>
          ➕ Add New Product
        </button>
      </header>

      <div style={contentGridStyle}>
        {/* Sidebar Navigation */}
        <nav style={sidebarStyle}>
          <div style={sidebarHeaderStyle}>
            <div style={avatarStyle}>AD</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#111827", fontWeight: "800", fontSize: "14px" }}>Admin Control</span>
              <span style={{ color: "#6B7280", fontSize: "12px", fontWeight: "600" }}>Administrator</span>
            </div>
          </div>

          <div style={navGroupStyle}>
            <button onClick={() => navigate("/admin")} style={navLinkStyle}>
              📊 Dashboard
            </button>
            <button onClick={() => navigate("/admin/orders")} style={navLinkStyle}>
              📦 Orders Lifecycle
            </button>
            <button onClick={() => navigate("/admin/products")} style={activeNavLinkStyle}>
              🍎 Inventory Catalog
            </button>
            <button onClick={() => navigate("/admin/riders")} style={navLinkStyle}>
              🛵 Riders Management
            </button>
            <button onClick={() => navigate("/admin/support")} style={navLinkStyle}>
              💬 Customer Support
            </button>
            <button
              onClick={() => navigate("/")}
              style={{
                ...navLinkStyle,
                marginTop: "12px",
                borderTop: "1px solid #E5E7EB",
                borderRadius: "0",
                paddingTop: "12px",
                color: "#318616",
                fontWeight: "800"
              }}
            >
              🏪 Open Customer App
            </button>
          </div>
        </nav>

        {/* Products Table Panel */}
        <main style={mainPanelStyle}>
          {error && <div style={errorBannerStyle}>⚠️ {error}</div>}

          <div style={cardLayoutStyle}>
            <h3 style={cardTitleStyle}>Inventory List</h3>
            <p style={{ color: "#6B7280", fontSize: "13px", marginTop: "4px", marginBottom: "18px", fontWeight: 500 }}>
              Inline edit <strong>Stock</strong> and <strong>Price</strong> parameters. Changes sync to whitelisted MongoDB cluster immediately.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Image</th>
                    <th style={thStyle}>Product Name</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Weight</th>
                    <th style={thStyle}>Price (₹)</th>
                    <th style={thStyle}>Stock</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={emptyTdStyle}>No items recorded in database catalog.</td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product._id || product.id} style={trStyle}>
                        <td style={tdPaddingStyle}>
                          <img
                            src={product.image || "https://images.unsplash.com/photo-1542838132-92c53300491e"}
                            alt=""
                            style={productImgStyle}
                          />
                        </td>
                        <td style={tdPaddingStyle}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={productNameLabelStyle}>
                              {product.name}
                              {product.isTrending && <span style={trendLabelStyle}>Trending</span>}
                            </span>
                            <span style={{ fontSize: "11px", color: "#6B7280", fontFamily: "monospace", fontWeight: 600 }}>
                              ID: {product.id || product._id?.substring(0, 8)}
                            </span>
                          </div>
                        </td>
                        <td style={tdPaddingStyle}>
                          <span style={categoryTagStyle}>{product.category}</span>
                        </td>
                        <td style={tdPaddingStyle}>{product.weight || "1 unit"}</td>

                        {/* Inline price edit */}
                        <td style={tdPaddingStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ color: "#6B7280", fontWeight: 800 }}>₹</span>
                            <input
                              type="number"
                              defaultValue={product.price}
                              onBlur={(e) => handleInlineUpdate(product._id || product.id, "price", e.target.value)}
                              style={inlineInputStyle(60)}
                            />
                          </div>
                        </td>

                        {/* Inline stock edit */}
                        <td style={tdPaddingStyle}>
                          <input
                            type="number"
                            defaultValue={product.stock}
                            onBlur={(e) => handleInlineUpdate(product._id || product.id, "stock", e.target.value)}
                            style={inlineInputStyle(55, product.stock === 0 ? "#EF4444" : "#10B981")}
                          />
                        </td>

                        <td style={tdPaddingStyle}>
                          <button
                            onClick={() => handleDelete(product._id || product.id)}
                            style={deleteBtnStyle}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add Product Modal Drawer */}
      {showAddModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#111827" }}>Register New Product</h2>
              <button onClick={() => setShowAddModal(false)} style={closeModalBtnStyle}>✕</button>
            </div>

            <form onSubmit={handleAddProductSubmit} style={formStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alphonso Mangoes"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Category *</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  style={inputStyle}
                >
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={formRowStyle}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 120"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Original Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 150"
                    value={newProduct.originalPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={formRowStyle}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Weight / Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. 500 g, 6 pcs"
                    value={newProduct.weight}
                    onChange={(e) => setNewProduct({ ...newProduct, weight: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Product Image</label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />

                <button
                  type="button"
                  onClick={uploadProductImage}
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#318616",
                    color: "white",
                    cursor: "pointer"
                  }}
                >
                  {uploadingImage ? "Uploading..." : "Upload Image"}
                </button>

                {newProduct.image && (
                  <img
                    src={newProduct.image}
                    alt="preview"
                    style={{
                      width: "120px",
                      height: "120px",
                      objectFit: "cover",
                      marginTop: "12px",
                      borderRadius: "12px"
                    }}
                  />
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0" }}>
                <input
                  type="checkbox"
                  id="trending"
                  checked={newProduct.isTrending}
                  onChange={(e) => setNewProduct({ ...newProduct, isTrending: e.target.checked })}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <label htmlFor="trending" style={{ color: "#374151", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
                  Feature on Trending Banner
                </label>
              </div>

              <button type="submit" style={submitBtnStyle}>
                🚀 Publish Product to Store
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const loadingContainerStyle = {
  minHeight: "100vh",
  background: "#F9FAFB",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  fontFamily: "'Outfit', 'Inter', sans-serif",
};

const spinnerStyle = {
  width: "50px",
  height: "50px",
  border: "4px solid rgba(255, 77, 79, 0.1)",
  borderTop: "4px solid #FF4D4F",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const pageContainerStyle = {
  minHeight: "100vh",
  background: "#F9FAFB",
  color: "#111827",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  padding: "24px 32px",
  boxSizing: "border-box",
  position: "relative",
};

const toastStyle = {
  position: "fixed",
  top: "32px",
  right: "32px",
  background: "#10B981",
  color: "white",
  padding: "16px 28px",
  borderRadius: "16px",
  fontWeight: "800",
  fontSize: "15px",
  boxShadow: "0 10px 30px rgba(16, 185, 129, 0.25)",
  zIndex: 99999,
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: "20px",
  borderBottom: "1.5px solid #E5E7EB",
  marginBottom: "24px",
};

const backBtnStyle = {
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderRadius: "12px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: "700",
  padding: "8px 14px",
  cursor: "pointer",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
  transition: "all 0.15s ease",
};

const titleStyle = {
  fontSize: "24px",
  fontWeight: "850",
  letterSpacing: "-0.5px",
  margin: 0,
};

const badgeStyle = {
  background: "#FFF1F0",
  color: "#FF4D4F",
  border: "1px solid rgba(255, 77, 79, 0.15)",
  fontSize: "11px",
  fontWeight: "800",
  padding: "4px 10px",
  borderRadius: "6px",
  textTransform: "uppercase",
};

const addBtnStyle = {
  background: "#FF4D4F",
  border: "none",
  borderRadius: "12px",
  color: "white",
  fontSize: "13px",
  fontWeight: "800",
  padding: "8px 16px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(255, 77, 79, 0.15)",
  transition: "all 0.15s ease",
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "250px 1fr",
  gap: "28px",
  alignItems: "start",
};

const sidebarStyle = {
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderRadius: "24px",
  padding: "20px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)",
};

const sidebarHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  paddingBottom: "16px",
  borderBottom: "1.5px solid #E5E7EB",
  marginBottom: "16px",
};

const avatarStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #FF4D4F 0%, #FF6B6B 100%)",
  color: "white",
  fontWeight: "800",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const navGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const activeNavLinkStyle = {
  background: "#FF4D4F",
  color: "white",
  border: "none",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: "800",
  textAlign: "left",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(255, 77, 79, 0.15)",
};

const navLinkStyle = {
  background: "transparent",
  color: "#4B5563",
  border: "none",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: "700",
  textAlign: "left",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const mainPanelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const errorBannerStyle = {
  background: "#FEE2E2",
  border: "1px solid rgba(239, 68, 68, 0.2)",
  color: "#B91C1C",
  borderRadius: "14px",
  padding: "12px 16px",
  fontSize: "14px",
  fontWeight: "750",
};

const cardLayoutStyle = {
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)",
};

const cardTitleStyle = {
  margin: 0,
  fontSize: "17px",
  fontWeight: "800",
  color: "#111827",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
  color: "#374151",
};

const thStyle = {
  textAlign: "left",
  padding: "12px 16px",
  borderBottom: "1.5px solid #E5E7EB",
  color: "#6B7280",
  fontWeight: "800",
  textTransform: "uppercase",
  fontSize: "11px",
};

const trStyle = {
  borderBottom: "1px solid #F3F4F6",
  transition: "background 0.15s ease",
};

const tdPaddingStyle = {
  padding: "12px 16px",
};

const productImgStyle = {
  width: "48px",
  height: "48px",
  objectFit: "cover",
  borderRadius: "10px",
  border: "1.5px solid #E5E7EB",
};

const productNameLabelStyle = {
  fontWeight: "800",
  color: "#111827",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const trendLabelStyle = {
  background: "#FEF3C7",
  color: "#D97706",
  border: "1px solid rgba(217, 119, 6, 0.15)",
  fontSize: "9px",
  fontWeight: "800",
  padding: "2px 6px",
  borderRadius: "4px",
  textTransform: "uppercase",
};

const categoryTagStyle = {
  fontSize: "11px",
  fontWeight: "750",
  padding: "4px 10px",
  borderRadius: "6px",
  background: "#F3F4F6",
  color: "#4B5563",
  border: "1.5px solid #E5E7EB",
};

const inlineInputStyle = (width, color = "#111827") => ({
  width: `${width}px`,
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderRadius: "8px",
  color: color,
  fontWeight: "800",
  fontSize: "13px",
  padding: "4px 6px",
  textAlign: "center",
  outline: "none",
  boxSizing: "border-box",
  transition: "all 0.2s ease"
});

const deleteBtnStyle = {
  background: "#FEF2F2",
  border: "1.5px solid rgba(239, 68, 68, 0.15)",
  color: "#EF4444",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: "750",
  padding: "6px 12px",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const emptyTdStyle = {
  padding: "30px",
  textAlign: "center",
  color: "#9CA3AF",
  fontWeight: "700",
};

// Modal Drawer Styles
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0, 0, 0, 0.5)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999999,
};

const modalContentStyle = {
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderRadius: "28px",
  width: "480px",
  padding: "24px",
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.1)",
  fontFamily: "inherit",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1.5px solid #E5E7EB",
  paddingBottom: "12px",
  marginBottom: "16px",
};

const closeModalBtnStyle = {
  background: "none",
  border: "none",
  color: "#6B7280",
  fontSize: "18px",
  fontWeight: "800",
  cursor: "pointer",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const formGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const formRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: "800",
  color: "#6B7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const inputStyle = {
  background: "#F9FAFB",
  border: "1.5px solid #E5E7EB",
  borderRadius: "12px",
  color: "#111827",
  fontSize: "14px",
  fontWeight: "600",
  padding: "10px 12px",
  outline: "none",
  boxSizing: "border-box",
  transition: "all 0.2s ease"
};

const submitBtnStyle = {
  background: "#FF4D4F",
  color: "white",
  border: "none",
  borderRadius: "12px",
  padding: "14px",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
  boxShadow: "0 8px 16px rgba(255, 77, 79, 0.2)",
  marginTop: "10px",
  transition: "all 0.2s ease"
};