import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("buyto_token");
      const res = await fetch("http://localhost:8000/api/admin/orders", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const status = res.status;
        let errMsg = "Failed to load orders";
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch (e) {}
        console.error("=== [FRONTEND ORDERS LIST FETCH ERROR] ===");
        console.error("Status Code:", status);
        console.error("Response Message:", errMsg);
        throw new Error(errMsg);
      }
      const data = await res.json();
      setOrders(data);
      setLoading(false);
    } catch (err) {
      console.error("=== [FRONTEND ORDERS LIST NETWORK ERROR] ===");
      console.error("Network Error:", err.message);
      setError(err.message || "Failed to load orders");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("buyto_token");
      const res = await fetch(`http://localhost:8000/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ orderStatus: newStatus })
      });

      if (!res.ok) {
        const status = res.status;
        let errMsg = "Failed to update order status";
        try {
          const errorData = await res.json();
          errMsg = errorData.message || errMsg;
        } catch (e) {}
        console.error("=== [FRONTEND ORDER STATUS UPDATE ERROR] ===");
        console.error("Status Code:", status);
        console.error("Response Message:", errMsg);
        throw new Error(errMsg);
      }

      const updatedOrder = await res.json();
      
      // Instantly update local state
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o._id === orderId ? { ...o, orderStatus: updatedOrder.orderStatus } : o))
      );

      // Trigger success Toast
      setToastMessage(`Order status updated to "${newStatus}"!`);
      setTimeout(() => setToastMessage(""), 3500);

    } catch (err) {
      console.error(err);
      alert(`Error updating order status: ${err.message}`);
    }
  };

  const getProgressWidth = (status) => {
    switch (status) {
      case "Order Placed": return "20%";
      case "Preparing": return "40%";
      case "Packed": return "55%";
      case "Rider Assigned": return "70%";
      case "Out for Delivery": return "85%";
      case "Delivered": return "100%";
      default: return "0%"; // Cancelled etc.
    }
  };

  const getProgressColor = (status) => {
    if (status === "Cancelled") return "#EF4444";
    return "#FF4D4F";
  };

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <span style={{ color: "#6B7280", fontWeight: "600", fontSize: "16px" }}>Fetching Order Logs...</span>
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
          <h1 style={titleStyle}>Order Lifecycle Dispatch</h1>
          <span style={badgeStyle}>{orders.length} Active</span>
        </div>
        <button onClick={fetchOrders} style={refreshBtnStyle}>
          🔄 Refresh Orders
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
            <button onClick={() => navigate("/admin/orders")} style={activeNavLinkStyle}>
              📦 Orders Lifecycle
            </button>
            <button onClick={() => navigate("/admin/products")} style={navLinkStyle}>
              🍎 Inventory Catalog
            </button>
            <button onClick={() => navigate("/admin/riders")} style={navLinkStyle}>
              🛵 Riders Management
            </button>
          </div>
        </nav>

        {/* Orders List Panel */}
        <main style={mainPanelStyle}>
          {error && <div style={errorBannerStyle}>⚠️ {error}</div>}

          {orders.length === 0 ? (
            <div style={emptyCardStyle}>
              <span style={{ fontSize: "40px" }}>📦</span>
              <h3 style={{ margin: "12px 0 6px 0", color: "#111827", fontWeight: "800" }}>No Active Orders</h3>
              <p style={{ color: "#6B7280", fontSize: "14px", fontWeight: 500 }}>When customers checkout via Buyto, active orders will show here.</p>
            </div>
          ) : (
            <div style={ordersListStyle}>
              {orders.map((order) => (
                <div key={order._id} style={orderCardStyle}>
                  {/* Top Bar of Card */}
                  <div style={orderHeaderStyle}>
                    <div>
                      <span style={orderIdLabelStyle}>ORDER ID: </span>
                      <span style={orderIdStyle}>{order._id}</span>
                      <span style={orderDateStyle}>
                        • {new Date(order.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      {/* Payment Badge */}
                      <span style={payBadgeStyle(order.paymentStatus)}>
                        💰 {order.paymentStatus}
                      </span>

                      {/* Dropdown status update */}
                      <div style={selectWrapperStyle}>
                        <span style={{ color: "#6B7280", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>
                          Status:
                        </span>
                        <select
                          value={order.orderStatus}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          style={selectStyle(order.orderStatus)}
                        >
                          <option value="Order Placed">Order Placed</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Packed">Packed</option>
                          <option value="Rider Assigned">Rider Assigned</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Customer & Address Details */}
                  <div style={orderDetailsGridStyle}>
                    <div style={detailsBlockStyle}>
                      <span style={blockTitleStyle}>Customer Details</span>
                      <span style={customerNameStyle}>👤 {order.user?.name}</span>
                      <span style={customerPhoneStyle}>📞 {order.user?.phone}</span>
                      {order.user?.room && <span style={customerPhoneStyle}>🏢 Room: {order.user?.room}</span>}
                    </div>

                    <div style={detailsBlockStyle}>
                      <span style={blockTitleStyle}>Delivery Address</span>
                      <span style={addressTextStyle}>📍 {order.deliveryAddress}</span>
                    </div>

                    <div style={detailsBlockStyle}>
                      <span style={blockTitleStyle}>Financial Summary</span>
                      <span style={amountTextStyle}>₹{order.totalAmount}</span>
                      <span style={methodTextStyle}>Method: {order.paymentMethod?.toUpperCase()}</span>
                      {order.razorpayPaymentId && (
                        <span style={methodTextStyle}>Tx ID: {order.razorpayPaymentId}</span>
                      )}
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div style={productsSectionStyle}>
                    <span style={blockTitleStyle}>Ordered Items ({order.products?.length || 0})</span>
                    <div style={productsListStyle}>
                      {order.products?.map((item, idx) => (
                        <div key={idx} style={productItemStyle}>
                          <span style={productNameStyle}>{item.name}</span>
                          <span style={productWeightStyle}>{item.weight}</span>
                          <span style={productQtyStyle}>x{item.quantity}</span>
                          <span style={productPriceStyle}>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery progress tracker (Bonus) */}
                  {order.orderStatus !== "Cancelled" && (
                    <div style={trackerContainerStyle}>
                      <div style={trackerLabelsStyle}>
                        <span style={trackerLabelStyle("Order Placed", order.orderStatus)}>Order Placed</span>
                        <span style={trackerLabelStyle("Preparing", order.orderStatus)}>Preparing</span>
                        <span style={trackerLabelStyle("Packed", order.orderStatus)}>Packed</span>
                        <span style={trackerLabelStyle("Rider Assigned", order.orderStatus)}>Rider Assigned</span>
                        <span style={trackerLabelStyle("Out for Delivery", order.orderStatus)}>Out for Delivery</span>
                        <span style={trackerLabelStyle("Delivered", order.orderStatus)}>Delivered</span>
                      </div>
                      
                      <div style={progressBarBgStyle}>
                        <div style={progressBarFillStyle(getProgressWidth(order.orderStatus), getProgressColor(order.orderStatus))} />
                      </div>
                    </div>
                  )}

                  {order.orderStatus === "Cancelled" && (
                    <div style={cancelledBannerStyle}>
                      ❌ This order has been CANCELLED and will not be dispatched.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
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
  animation: "fadeInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
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

const refreshBtnStyle = {
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

const emptyCardStyle = {
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderRadius: "24px",
  padding: "40px",
  textAlign: "center",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)",
};

const ordersListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const orderCardStyle = {
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)",
};

const orderHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: "16px",
  borderBottom: "1.5px solid #E5E7EB",
  marginBottom: "16px",
};

const orderIdLabelStyle = {
  color: "#6B7280",
  fontSize: "11px",
  fontWeight: "800",
};

const orderIdStyle = {
  color: "#FF4D4F",
  fontWeight: "800",
  fontSize: "13px",
  fontFamily: "monospace",
};

const orderDateStyle = {
  color: "#6B7280",
  fontSize: "12px",
  fontWeight: "600",
};

const payBadgeStyle = (status) => ({
  fontSize: "11px",
  fontWeight: "800",
  padding: "4px 10px",
  borderRadius: "6px",
  textTransform: "uppercase",
  background:
    status === "Paid"
      ? "#F0FDF4"
      : status === "Pending"
      ? "#FEF3C7"
      : "#FEF2F2",
  color:
    status === "Paid"
      ? "#10B981"
      : status === "Pending"
      ? "#F59E0B"
      : "#EF4444",
  border: `1.5px solid ${
    status === "Paid"
      ? "rgba(16, 185, 129, 0.15)"
      : status === "Pending"
      ? "rgba(245, 158, 11, 0.15)"
      : "rgba(239, 68, 68, 0.15)"
  }`,
});

const selectWrapperStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const selectStyle = (status) => ({
  background: "#FFFFFF",
  border: "1.5px solid #E5E7EB",
  borderRadius: "10px",
  color:
    status === "Delivered"
      ? "#10B981"
      : status === "Cancelled"
      ? "#EF4444"
      : "#FF4D4F",
  fontSize: "13px",
  fontWeight: "750",
  padding: "6px 12px",
  cursor: "pointer",
  outline: "none",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.01)",
});

const orderDetailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: "20px",
  background: "#F9FAFB",
  border: "1.5px solid #E5E7EB",
  borderRadius: "16px",
  padding: "16px",
  marginBottom: "16px",
};

const detailsBlockStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const blockTitleStyle = {
  fontSize: "11px",
  fontWeight: "800",
  color: "#6B7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "6px",
};

const customerNameStyle = {
  color: "#111827",
  fontWeight: "800",
  fontSize: "14px",
};

const customerPhoneStyle = {
  color: "#4B5563",
  fontSize: "13px",
  fontWeight: "600",
};

const addressTextStyle = {
  color: "#374151",
  fontSize: "13px",
  lineHeight: "1.4",
  fontWeight: "600",
};

const amountTextStyle = {
  color: "#111827",
  fontWeight: "900",
  fontSize: "18px",
};

const methodTextStyle = {
  color: "#6B7280",
  fontSize: "12px",
  fontWeight: "600",
};

const productsSectionStyle = {
  padding: "16px",
  background: "#F9FAFB",
  border: "1.5px solid #E5E7EB",
  borderRadius: "16px",
  marginBottom: "18px",
};

const productsListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  marginTop: "8px",
};

const productItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "13px",
  borderBottom: "1px solid #E5E7EB",
  paddingBottom: "8px",
};

const productNameStyle = {
  color: "#111827",
  fontWeight: "750",
  flexGrow: 1,
};

const productWeightStyle = {
  color: "#6B7280",
  width: "80px",
  fontWeight: "600",
};

const productQtyStyle = {
  color: "#FF4D4F",
  width: "50px",
  fontWeight: "800",
};

const productPriceStyle = {
  color: "#111827",
  fontWeight: "750",
  width: "60px",
  textAlign: "right",
};

const trackerContainerStyle = {
  padding: "8px 16px",
};

const trackerLabelsStyle = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "11px",
  fontWeight: "800",
  color: "#6B7280",
  marginBottom: "8px",
};

const trackerLabelStyle = (label, currentStatus) => {
  const statuses = ["Order Placed", "Preparing", "Packed", "Rider Assigned", "Out for Delivery", "Delivered"];
  const currentIdx = statuses.indexOf(currentStatus);
  const labelIdx = statuses.indexOf(label);
  
  const isCompleted = labelIdx <= currentIdx;
  return {
    color: isCompleted ? "#FF4D4F" : "#6B7280",
    fontWeight: isCompleted ? "850" : "600",
  };
};

const progressBarBgStyle = {
  width: "100%",
  height: "6px",
  background: "#E5E7EB",
  borderRadius: "3px",
  overflow: "hidden",
};

const progressBarFillStyle = (width, color) => ({
  width: width,
  height: "100%",
  background: color,
  borderRadius: "3px",
  transition: "width 0.4s ease, background 0.4s ease",
});

const cancelledBannerStyle = {
  background: "#FEF2F2",
  border: "1px solid rgba(239, 68, 68, 0.2)",
  borderRadius: "12px",
  color: "#EF4444",
  padding: "10px 16px",
  fontSize: "12px",
  fontWeight: "700",
  textAlign: "center",
};
