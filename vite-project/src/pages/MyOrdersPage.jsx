import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import SEO from "../components/common/SEO";

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("Latest");
  const [visibleCount, setVisibleCount] = useState(10);

  const [downloadingOrderId, setDownloadingOrderId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const [backendEarnedCoins, setBackendEarnedCoins] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch((window.API_BASE_URL || "") + "/api/orders/my-orders", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.orders)) {
          setOrders(data.orders);
          if (data.buyCoinsStats?.totalEarned !== undefined) {
            setBackendEarnedCoins(Number(data.buyCoinsStats.totalEarned));
          }
        } else {
          setOrders(Array.isArray(data) ? data : []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching orders:", err);
        setError("Failed to load your orders. Please try again.");
        setLoading(false);
      });
  }, [token]);

  const handleDownloadInvoice = async (orderId) => {
    const shortId = String(orderId).slice(-8).toUpperCase();
    setDownloadingOrderId(orderId);

    try {
      const apiBase = window.API_BASE_URL || "";
      const invoiceUrl = `${apiBase}/api/orders/${orderId}/invoice`;

      const response = await fetch(invoiceUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let errDetail = `Status ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson.message) errDetail = errJson.message;
        } catch (_) {}
        throw new Error(errDetail);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Buyto-Invoice-${shortId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setDownloadingOrderId(null);
      showToast(`✅ Invoice Buyto-Invoice-${shortId}.pdf downloaded!`);
    } catch (err) {
      console.error("❌ Invoice Download Exception:", err);
      setDownloadingOrderId(null);
      showToast(`Unable to download invoice: ${err.message}`);
    }
  };

  const handleBuyAgainOrder = (order) => {
    const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : (Array.isArray(order.products) ? order.products : []);
    showToast(`🛒 ${items.length} ${items.length === 1 ? "item" : "items"} added to your active order context!`);
    navigate("/cart");
  };

  // Infinite Scroll Trigger
  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      setVisibleCount(prev => prev + 10);
    }
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    let totalSpent = 0;
    let deliveredCount = 0;
    let activeCount = 0;
    let purchaseEarnedCoins = 0;

    orders.forEach(o => {
      const amt = Number(o.finalAmount || o.grandTotal || o.totalAmount || o.amount || 0);
      totalSpent += amt;
      const statusLower = String(o.orderStatus || o.status || "").toLowerCase();

      if (statusLower.includes("delivered")) {
        deliveredCount++;
        // Calculate BuyCoins earned strictly from completed delivered product purchases
        purchaseEarnedCoins += Math.floor(amt * 0.05);
      } else if (!statusLower.includes("cancel") && !statusLower.includes("reject") && !statusLower.includes("refund")) {
        activeCount++;
      }
    });

    const finalEarned = user?.buyCoinsStats?.totalEarned !== undefined
      ? Number(user.buyCoinsStats.totalEarned)
      : (backendEarnedCoins !== null ? backendEarnedCoins : purchaseEarnedCoins);

    return { totalOrders, totalSpent, deliveredCount, activeCount, buyCoinsEarned: finalEarned };
  }, [orders, user, backendEarnedCoins]);

  // Frequently / Frequently Bought Products for "Buy Again"
  const buyAgainProducts = useMemo(() => {
    const productMap = new Map();
    orders.forEach(o => {
      const items = Array.isArray(o.items) && o.items.length > 0 ? o.items : (Array.isArray(o.products) ? o.products : []);
      items.forEach(i => {
        const key = i.productId || i.name || i.title;
        if (!productMap.has(key)) {
          productMap.set(key, {
            id: key,
            name: i.name || i.title || "Essential Product",
            image: i.image || i.imageUrl || "https://res.cloudinary.com/dshelwy43/image/upload/v1783245601/66ea9503-f944-4f5f-bb44-8608a0355e3a_ee7d3d13-c857-4e5a-96b1-3c79da306b9e_j6uscb.png",
            weight: i.weight || "1 unit",
            price: Number(i.price || 49),
            count: 1
          });
        } else {
          productMap.get(key).count += 1;
        }
      });
    });
    return Array.from(productMap.values()).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [orders]);

  // Filter & Sort Logic
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(o => {
        const idMatch = String(o._id || o.id || o.orderId || "").toLowerCase().includes(q);
        const itemMatch = Array.isArray(o.items) && o.items.some(i => (i.name || i.title || "").toLowerCase().includes(q));
        const addrMatch = String(o.deliveryAddress || "").toLowerCase().includes(q);
        return idMatch || itemMatch || addrMatch;
      });
    }

    if (statusFilter === "Active") {
      list = list.filter(o => {
        const s = String(o.orderStatus || o.status || "").toLowerCase();
        return !s.includes("delivered") && !s.includes("cancel") && !s.includes("reject") && !s.includes("refund");
      });
    } else if (statusFilter === "Delivered") {
      list = list.filter(o => String(o.orderStatus || o.status || "").toLowerCase().includes("delivered"));
    } else if (statusFilter === "Cancelled") {
      list = list.filter(o => {
        const s = String(o.orderStatus || o.status || "").toLowerCase();
        return s.includes("cancel") || s.includes("reject");
      });
    } else if (statusFilter === "COD") {
      list = list.filter(o => String(o.paymentMethod || "").toUpperCase() === "COD");
    } else if (statusFilter === "Online") {
      list = list.filter(o => String(o.paymentMethod || "").toUpperCase() !== "COD");
    }

    list.sort((a, b) => {
      const dateA = new Date(a.createdAt || Date.now()).getTime();
      const dateB = new Date(b.createdAt || Date.now()).getTime();
      const priceA = Number(a.finalAmount || a.grandTotal || a.totalAmount || a.amount || 0);
      const priceB = Number(b.finalAmount || b.grandTotal || b.totalAmount || b.amount || 0);

      if (sortOrder === "Latest") return dateB - dateA;
      if (sortOrder === "Oldest") return dateA - dateB;
      if (sortOrder === "Highest Amount") return priceB - priceA;
      if (sortOrder === "Lowest Amount") return priceA - priceB;
      return 0;
    });

    return list;
  }, [orders, searchQuery, statusFilter, sortOrder]);

  const displayedOrders = filteredOrders.slice(0, visibleCount);

  const getStatusBorderColor = (status) => {
    const s = String(status || "").toLowerCase().trim();
    if (s.includes("delivered")) return "#22c55e"; // Green
    if (s.includes("cancel") || s.includes("reject")) return "#ef4444"; // Red
    if (s.includes("out_for_delivery") || s.includes("out for delivery")) return "#3b82f6"; // Blue
    if (s.includes("rider") || s.includes("assigned")) return "#0284c7"; // Sky Blue
    return "#eab308"; // Yellow
  };

  const formatStatusBadge = (status) => {
    const s = String(status || "").toLowerCase().trim();
    if (s.includes("delivered")) return { text: "🟢 Delivered", bg: "#dcfce7", color: "#15803d" };
    if (s.includes("cancel") || s.includes("reject")) return { text: "🔴 Cancelled", bg: "#fee2e2", color: "#b91c1c" };
    if (s.includes("out_for_delivery") || s.includes("out for delivery")) return { text: "🔵 Out for Delivery", bg: "#dbeafe", color: "#1d4ed8" };
    if (s.includes("rider") || s.includes("assigned")) return { text: "🛵 Rider Assigned", bg: "#e0f2fe", color: "#0369a1" };
    if (s.includes("picked")) return { text: "📦 Picked Up", bg: "#e0e7ff", color: "#4338ca" };
    if (s.includes("packed")) return { text: "📦 Packed", bg: "#f3e8ff", color: "#6b21a8" };
    if (s.includes("prep")) return { text: "👨‍🍳 Preparing", bg: "#fef3c7", color: "#b45309" };
    if (s.includes("placed")) return { text: "🟡 Order Placed", bg: "#fef9c3", color: "#854d0e" };
    if (s.includes("pending")) return { text: "⏳ Pending", bg: "#f1f5f9", color: "#475569" };
    if (s.includes("refund")) return { text: "💰 Refunded", bg: "#ecfdf5", color: "#047857" };
    return { text: `⚡ ${status || "Order Placed"}`, bg: "#fef3c7", color: "#b45309" };
  };

  const getTimelineSteps = (status) => {
    const s = String(status || "").toLowerCase().trim();
    const steps = [
      { key: "placed", label: "Placed" },
      { key: "prep", label: "Preparing" },
      { key: "packed", label: "Packed" },
      { key: "out", label: "Out for Delivery" },
      { key: "delivered", label: "Delivered" }
    ];

    let currentIdx = 0;
    if (s.includes("delivered")) currentIdx = 4;
    else if (s.includes("out_for_delivery") || s.includes("out for delivery")) currentIdx = 3;
    else if (s.includes("packed")) currentIdx = 2;
    else if (s.includes("prep")) currentIdx = 1;
    else if (s.includes("placed") || s.includes("pending")) currentIdx = 0;

    return { steps, currentIdx };
  };

  return (
    <div
      onScroll={handleScroll}
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        paddingBottom: "100px",
        fontFamily: "'Outfit', 'Inter', sans-serif"
      }}
    >
      <SEO title="My Orders" description="View your past orders, active deliveries, and receipts on Buyto." />
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1e293b",
            color: "white",
            padding: "12px 24px",
            borderRadius: "30px",
            fontWeight: "700",
            fontSize: "14px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Header Bar */}
      <div
        style={{
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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => navigate("/profile")}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "12px",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#0f172a",
              fontSize: "18px",
              fontWeight: "800",
              transition: "transform 0.15s"
            }}
          >
            ←
          </button>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📦</span> My Orders
            </h1>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
              {metrics.totalOrders} Orders • ₹{metrics.totalSpent.toLocaleString("en-IN")} Spent • {metrics.activeCount} Active
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          style={{
            background: "#f0fdf4",
            color: "#166534",
            border: "1px solid #bbf7d0",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "800",
            cursor: "pointer"
          }}
        >
          + New Order
        </button>
      </div>

      {/* Main Two-Column Desktop / One-Column Mobile Layout */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 16px" }}>
        
        {/* Floating Top Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
              📦
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Total Orders</div>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a" }}>{metrics.totalOrders}</div>
            </div>
          </div>

          <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
              💰
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Total Spent</div>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a" }}>₹{metrics.totalSpent.toLocaleString("en-IN")}</div>
            </div>
          </div>

          <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(0,0,0,0.02)", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
              🪙
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>BuyCoins Earned</div>
              <div style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a" }}>{metrics.buyCoinsEarned}</div>
            </div>
          </div>
        </div>

        {/* Split Grid Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }} className="desktop-order-grid">
          
          {/* Main Left Column: Search, Filters, & Orders List */}
          <div>
            {/* Search & Filter Controls */}
            <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Search Bar */}
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search orders by ID, product, or address..."
                  style={{
                    width: "100%",
                    padding: "14px 16px 14px 44px",
                    borderRadius: "16px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    fontWeight: "600",
                    background: "#ffffff",
                    outline: "none",
                    boxSizing: "border-box",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                  }}
                />
                <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "16px" }}>
                  🔍
                </span>
              </div>

              {/* Filter Chips with Icons */}
              <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                {[
                  { id: "All", label: "📦 All" },
                  { id: "Active", label: "🟡 Active" },
                  { id: "Delivered", label: "✅ Delivered" },
                  { id: "Cancelled", label: "❌ Cancelled" },
                  { id: "COD", label: "💵 COD" },
                  { id: "Online", label: "💳 Online" }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    style={{
                      background: statusFilter === f.id ? "#318616" : "#ffffff",
                      color: statusFilter === f.id ? "#ffffff" : "#475569",
                      border: statusFilter === f.id ? "none" : "1px solid #e2e8f0",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: "700",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: statusFilter === f.id ? "0 4px 12px rgba(49, 134, 22, 0.25)" : "none"
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>Sort:</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "#1e293b",
                    background: "#ffffff",
                    outline: "none",
                    cursor: "pointer"
                  }}
                >
                  <option value="Latest">Latest First</option>
                  <option value="Oldest">Oldest First</option>
                  <option value="Highest Amount">Highest Amount</option>
                  <option value="Lowest Amount">Lowest Amount</option>
                </select>
              </div>
            </div>

            {/* Orders Content List */}
            {loading ? (
              /* SKELETON LOADER CARDS */
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[1, 2, 3].map((n) => (
                  <div key={n} style={{ background: "#ffffff", borderRadius: "20px", padding: "20px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ width: "140px", height: "18px", background: "#e2e8f0", borderRadius: "6px" }} />
                      <div style={{ width: "90px", height: "18px", background: "#e2e8f0", borderRadius: "6px" }} />
                    </div>
                    <div style={{ width: "220px", height: "14px", background: "#e2e8f0", borderRadius: "6px", marginBottom: "16px" }} />
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{ width: "56px", height: "56px", background: "#e2e8f0", borderRadius: "10px" }} />
                      <div style={{ width: "56px", height: "56px", background: "#e2e8f0", borderRadius: "10px" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              /* EMPTY STATE */
              <div style={{ background: "#ffffff", borderRadius: "24px", padding: "48px 24px", textAlign: "center", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                <div style={{ fontSize: "56px", marginBottom: "14px" }}>📦</div>
                <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px 0" }}>
                  No Orders Found
                </h3>
                <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 24px 0", fontWeight: "500" }}>
                  {searchQuery || statusFilter !== "All"
                    ? "No orders match your search criteria or selected filter."
                    : "Looks like you haven't placed any orders yet."}
                </p>
                <button
                  onClick={() => navigate("/")}
                  style={{
                    background: "linear-gradient(135deg, #318616 0%, #15803d 100%)",
                    color: "white",
                    padding: "14px 32px",
                    borderRadius: "24px",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: "800",
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(49, 134, 22, 0.3)"
                  }}
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              /* ORDERS LIST */
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {displayedOrders.map((order) => {
                  const orderId = order._id || order.id || order.orderId;
                  const currentStatus = order.orderStatus || order.status || "Order Placed";
                  const badge = formatStatusBadge(currentStatus);
                  const borderColor = getStatusBorderColor(currentStatus);
                  const lowerStatus = String(currentStatus).toLowerCase();
                  const isActive = !lowerStatus.includes("delivered") && !lowerStatus.includes("cancel") && !lowerStatus.includes("reject") && !lowerStatus.includes("refund");
                  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
                  const itemsList = Array.isArray(order.items) && order.items.length > 0
                    ? order.items
                    : (Array.isArray(order.products) ? order.products : []);

                  const totalItems = order.totalQuantity !== undefined && order.totalQuantity !== null
                    ? order.totalQuantity
                    : itemsList.reduce((acc, item) => acc + Number(item.quantity || 1), 0);

                  const displayAmount = Number(
                    order.finalAmount !== undefined && order.finalAmount !== null ? order.finalAmount :
                    order.grandTotal !== undefined && order.grandTotal !== null ? order.grandTotal :
                    order.totalAmount !== undefined && order.totalAmount !== null ? order.totalAmount :
                    order.amount !== undefined && order.amount !== null ? order.amount :
                    order.total !== undefined && order.total !== null ? order.total :
                    itemsList.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0)
                  );

                  const paymentText = (order.paymentMethod || "COD").toUpperCase();
                  const isPaid = order.paymentStatus === "Paid" || paymentText !== "COD";
                  const savings = Math.max(0, Math.round(displayAmount * 0.15)); // Simulated discount savings
                  const coinsRedeemed = Number(order.buyCoinsRedeemed || order.buyCoins?.applied || 0);

                  const { steps, currentIdx } = getTimelineSteps(currentStatus);

                  return (
                    <div
                      key={orderId}
                      style={{
                        background: "#ffffff",
                        borderRadius: "22px",
                        padding: "20px 22px",
                        border: "1px solid #e2e8f0",
                        borderLeft: `6px solid ${borderColor}`,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {/* Top Bar: Order ID & Status Badge */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <span style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>🧾</span> Order #{String(orderId).slice(-8).toUpperCase()}
                          </span>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", marginTop: "3px" }}>
                            {dateStr}
                          </div>
                        </div>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            padding: "6px 12px",
                            borderRadius: "14px",
                            fontSize: "12px",
                            fontWeight: "800",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          {badge.text}
                        </span>
                      </div>

                      {/* Order Progress Timeline for Active Orders */}
                      {isActive && (
                        <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "14px", marginBottom: "14px", border: "1px solid #f1f5f9" }}>
                          <div style={{ fontSize: "11px", fontWeight: "800", color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Order Status Progress
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                            {steps.map((step, sIdx) => {
                              const isPassed = sIdx <= currentIdx;
                              const isCurrent = sIdx === currentIdx;
                              return (
                                <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flex: 1, zIndex: 2 }}>
                                  <div
                                    style={{
                                      width: isCurrent ? "18px" : "14px",
                                      height: isCurrent ? "18px" : "14px",
                                      borderRadius: "50%",
                                      background: isPassed ? "#318616" : "#cbd5e1",
                                      border: isCurrent ? "3px solid #bbf7d0" : "none",
                                      boxShadow: isCurrent ? "0 0 8px rgba(49, 134, 22, 0.4)" : "none"
                                    }}
                                  />
                                  <span style={{ fontSize: "10px", fontWeight: isCurrent ? "800" : "600", color: isPassed ? "#0f172a" : "#94a3b8", textAlign: "center" }}>
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Summary Pricing & Savings Line */}
                      <div style={{ fontSize: "13px", color: "#334155", fontWeight: "700", marginBottom: "14px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                        <span>{totalItems} {totalItems === 1 ? "Item" : "Items"}</span> • <span style={{ color: "#318616", fontWeight: "800" }}>{isPaid ? "Paid" : "Payable"} ₹{displayAmount}</span> • <span style={{ color: "#64748b", textTransform: "uppercase" }}>{paymentText}</span>
                        {savings > 0 && (
                          <span style={{ background: "#f0fdf4", color: "#166534", padding: "2px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", border: "1px solid #bbf7d0" }}>
                            Saved ₹{savings} 🎉
                          </span>
                        )}
                        {coinsRedeemed > 0 && (
                          <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", border: "1px solid #fde68a" }}>
                            🪙 {coinsRedeemed} BuyCoins Applied
                          </span>
                        )}
                      </div>

                      {/* Product Preview Cards */}
                      {itemsList.length > 0 && (
                        <div style={{ marginBottom: "16px" }}>
                          {itemsList.length === 1 ? (
                            /* Single Product View */
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", padding: "10px 14px", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
                              <img
                                src={itemsList[0].image || itemsList[0].imageUrl || "https://res.cloudinary.com/dshelwy43/image/upload/v1783245601/66ea9503-f944-4f5f-bb44-8608a0355e3a_ee7d3d13-c857-4e5a-96b1-3c79da306b9e_j6uscb.png"}
                                alt={itemsList[0].name || itemsList[0].title}
                                loading="lazy"
                                style={{ width: "48px", height: "48px", objectFit: "contain", borderRadius: "10px", background: "#ffffff", border: "1px solid #e2e8f0" }}
                              />
                              <div>
                                <div style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>
                                  {itemsList[0].name || itemsList[0].title || "Purchased Product"}
                                </div>
                                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", marginTop: "2px" }}>
                                  {itemsList[0].weight || "1 unit"} • Qty ×{itemsList[0].quantity || 1}
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Multi-Product Stacked View */
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto", paddingBottom: "2px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc", padding: "8px 12px", borderRadius: "14px", border: "1px solid #f1f5f9", flex: 1 }}>
                                <img
                                  src={itemsList[0].image || itemsList[0].imageUrl || "https://res.cloudinary.com/dshelwy43/image/upload/v1783245601/66ea9503-f944-4f5f-bb44-8608a0355e3a_ee7d3d13-c857-4e5a-96b1-3c79da306b9e_j6uscb.png"}
                                  alt={itemsList[0].name || itemsList[0].title}
                                  loading="lazy"
                                  style={{ width: "44px", height: "44px", objectFit: "contain", borderRadius: "8px", background: "#ffffff", border: "1px solid #e2e8f0" }}
                                />
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>
                                    {itemsList[0].name || itemsList[0].title}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
                                    + {itemsList.length - 1} more {itemsList.length - 1 === 1 ? "item" : "items"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Delivery Address Preview */}
                      {order.deliveryAddress && (
                        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>📍</span> <span style={{ color: "#334155", fontWeight: "700" }}>{order.deliveryAddress}</span>
                        </div>
                      )}

                      {/* Actions Bar */}
                      <div style={{ display: "flex", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                        <button
                          onClick={() => navigate(`/orders/${orderId}`)}
                          style={{
                            flex: 1,
                            background: "#f8fafc",
                            border: "1px solid #cbd5e1",
                            borderRadius: "12px",
                            padding: "10px 14px",
                            fontSize: "12px",
                            fontWeight: "800",
                            color: "#334155",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                          }}
                        >
                          <span>📄</span> Details
                        </button>

                        {isActive ? (
                          <button
                            onClick={() => navigate(`/orders/${orderId}`)}
                            style={{
                              flex: 1,
                              background: "#318616",
                              border: "none",
                              borderRadius: "12px",
                              padding: "10px 14px",
                              fontSize: "12px",
                              fontWeight: "800",
                              color: "white",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              boxShadow: "0 4px 12px rgba(49, 134, 22, 0.25)"
                            }}
                          >
                            <span>🚚</span> Track
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleDownloadInvoice(orderId)}
                              disabled={downloadingOrderId === orderId}
                              style={{
                                flex: 1,
                                background: "#ffffff",
                                border: "1px solid #318616",
                                borderRadius: "12px",
                                padding: "10px 14px",
                                fontSize: "12px",
                                fontWeight: "800",
                                color: "#318616",
                                cursor: downloadingOrderId === orderId ? "not-allowed" : "pointer",
                                opacity: downloadingOrderId === orderId ? 0.7 : 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px"
                              }}
                            >
                              <span>📥</span> {downloadingOrderId === orderId ? "Generating..." : "Invoice"}
                            </button>

                            <button
                              onClick={() => handleBuyAgainOrder(order)}
                              style={{
                                flex: 1,
                                background: "#f0fdf4",
                                border: "1px solid #bbf7d0",
                                borderRadius: "12px",
                                padding: "10px 14px",
                                fontSize: "12px",
                                fontWeight: "800",
                                color: "#15803d",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px"
                              }}
                            >
                              <span>🔁</span> Buy Again
                            </button>
                          </>
                        )}
                      </div>

                    </div>
                  );
                })}

                {displayedOrders.length < filteredOrders.length && (
                  <div style={{ textAlign: "center", marginTop: "16px" }}>
                    <button
                      onClick={() => setVisibleCount(prev => prev + 10)}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "24px",
                        padding: "10px 24px",
                        fontSize: "13px",
                        fontWeight: "800",
                        color: "#475569",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                      }}
                    >
                      Load More Orders
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Desktop Sidebar: Buy Again Quick Reorder Bar */}
          {buyAgainProducts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ background: "#ffffff", padding: "20px", borderRadius: "22px", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>🔁</span> Buy Again
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {buyAgainProducts.map((prod) => (
                    <div key={prod.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "8px", borderRadius: "12px", background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img src={prod.image} alt={prod.name} style={{ width: "36px", height: "36px", objectFit: "contain", borderRadius: "8px", background: "#ffffff", border: "1px solid #e2e8f0" }} />
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a" }}>{prod.name}</div>
                          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>₹{prod.price} • {prod.weight}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          showToast(`🛒 Added ${prod.name} to cart!`);
                          navigate("/cart");
                        }}
                        style={{
                          background: "#318616",
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          padding: "6px 12px",
                          fontSize: "11px",
                          fontWeight: "800",
                          cursor: "pointer"
                        }}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
