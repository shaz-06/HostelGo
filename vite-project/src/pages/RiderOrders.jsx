import React from "react";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function RiderOrders({ availableOrders, activeDeliveries, onAccept, onDelivered, busyOrderId }) {
  return (
    <div style={gridStyle}>
      <section style={panelStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>Available Orders</h2>
          <span style={pillStyle}>{availableOrders.length} packed</span>
        </div>
        <div style={listStyle}>
          {availableOrders.length === 0 ? (
            <div style={emptyStyle}>No packed orders ready right now.</div>
          ) : (
            availableOrders.map((order) => (
              <article key={order._id} style={orderCardStyle}>
                <div>
                  <strong style={customerStyle}>{order.user?.name}</strong>
                  <p style={mutedStyle}>{order.user?.location || "Central Address"} {order.user?.room ? `• Room ${order.user.room}` : ""}</p>
                </div>
                <div style={metaGridStyle}>
                  <span style={metaItemStyle}>💰 {money(order.totalAmount)}</span>
                  <span style={metaItemStyle}>📦 {order.products?.length || 0} items</span>
                  <span style={metaItemStyle}>📍 ~1.8 km</span>
                </div>
                <button style={acceptBtnStyle} disabled={busyOrderId === order._id} onClick={() => onAccept(order._id)}>
                  {busyOrderId === order._id ? "Accepting..." : "Accept Order 🏍️"}
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      <section style={panelStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>Active Delivery</h2>
          <span style={liveBadgeStyle}>Live</span>
        </div>
        <div style={listStyle}>
          {activeDeliveries.length === 0 ? (
            <div style={emptyStyle}>Accepted deliveries will appear here.</div>
          ) : (
            activeDeliveries.map((order) => (
              <article key={order._id} style={activeCardStyle}>
                <div style={sectionHeaderStyle}>
                  <div>
                    <strong style={customerStyle}>{order.user?.name}</strong>
                    <p style={mutedStyle}>📞 {order.user?.phone}</p>
                  </div>
                  <span style={statusBadgeStyle}>{order.orderStatus}</span>
                </div>
                <p style={addressStyle}>📍 {order.deliveryAddress}</p>
                <div style={itemsContainerStyle}>
                  {order.products?.map((item) => (
                    <span key={`${order._id}-${item.productId}-${item.name}`} style={itemPillStyle}>
                      {item.name} <strong style={{ color: "#FF4D4F" }}>x{item.quantity}</strong>
                    </span>
                  ))}
                </div>
                <div style={metaGridStyle}>
                  <span style={metaItemStyle}>💰 {money(order.totalAmount)}</span>
                  <span style={metaItemStyle}>💳 {order.paymentStatus}</span>
                  <span style={metaItemStyle}>⚡ {order.paymentMethod?.toUpperCase()}</span>
                </div>
                <div style={actionsStyle}>
                  <a style={secondaryBtnStyle} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress || "")}`} target="_blank" rel="noreferrer">Navigate</a>
                  <a style={secondaryBtnStyle} href={`tel:${order.user?.phone || ""}`}>Call Customer</a>
                  <button style={deliveredBtnStyle} disabled={busyOrderId === order._id} onClick={() => onDelivered(order._id)}>
                    {busyOrderId === order._id ? "Updating..." : "Mark Delivered ✅"}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

const gridStyle = { 
  display: "grid", 
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
  gap: 20 
};

const panelStyle = { 
  background: "#FFFFFF", 
  border: "1px solid #E5E7EB", 
  borderRadius: 24, 
  padding: 20,
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.03)" 
};

const sectionHeaderStyle = { 
  display: "flex", 
  alignItems: "center", 
  justifyContent: "space-between", 
  gap: 12 
};

const sectionTitleStyle = { 
  color: "#111827", 
  margin: 0, 
  fontSize: 19,
  fontWeight: "800" 
};

const pillStyle = { 
  color: "#FF4D4F", 
  background: "#FFF1F0", 
  border: "1px solid rgba(255, 77, 79, 0.15)", 
  borderRadius: 999, 
  padding: "5px 12px", 
  fontSize: 12, 
  fontWeight: 800 
};

const liveBadgeStyle = { 
  color: "#22C55E", 
  background: "#F0FDF4", 
  border: "1px solid rgba(34, 197, 94, 0.15)", 
  borderRadius: 999, 
  padding: "5px 12px", 
  fontSize: 12, 
  fontWeight: 800 
};

const listStyle = { 
  display: "flex", 
  flexDirection: "column", 
  gap: 14, 
  marginTop: 16 
};

const emptyStyle = { 
  minHeight: 120, 
  display: "flex", 
  alignItems: "center", 
  justifyContent: "center", 
  color: "#9CA3AF", 
  border: "2px dashed #E5E7EB", 
  borderRadius: 18, 
  fontWeight: 700,
  background: "#F9FAFB" 
};

const orderCardStyle = { 
  background: "#FFFFFF", 
  border: "1.5px solid #F3F4F6", 
  borderRadius: 18, 
  padding: 16, 
  display: "flex", 
  flexDirection: "column", 
  gap: 14,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02)"
};

const activeCardStyle = { 
  ...orderCardStyle, 
  border: "1.5px solid rgba(34, 197, 94, 0.25)",
  boxShadow: "0 10px 25px rgba(34, 197, 94, 0.05)" 
};

const customerStyle = { 
  color: "#111827", 
  fontSize: 17,
  fontWeight: "800" 
};

const mutedStyle = { 
  color: "#6B7280", 
  margin: "4px 0 0", 
  fontSize: 13, 
  fontWeight: 600 
};

const metaGridStyle = { 
  display: "grid", 
  gridTemplateColumns: "repeat(3, 1fr)", 
  gap: 8, 
  color: "#111827", 
  fontSize: 13, 
  fontWeight: 700 
};

const metaItemStyle = {
  background: "#F3F4F6",
  padding: "6px 8px",
  borderRadius: 8,
  textAlign: "center",
  fontSize: "12px",
  color: "#4B5563"
};

const acceptBtnStyle = { 
  height: 46, 
  border: "none", 
  borderRadius: 12, 
  background: "#FF4D4F", 
  color: "white", 
  fontWeight: 800, 
  cursor: "pointer",
  fontSize: "14px",
  boxShadow: "0 6px 12px rgba(255, 77, 79, 0.15)",
  transition: "all 0.2s ease" 
};

const statusBadgeStyle = { 
  color: "#F59E0B", 
  background: "#FEF3C7", 
  border: "1px solid rgba(245, 158, 11, 0.15)", 
  borderRadius: 999, 
  padding: "5px 12px", 
  fontSize: 11, 
  fontWeight: 800 
};

const addressStyle = { 
  color: "#374151", 
  margin: 0, 
  fontSize: 14, 
  lineHeight: 1.5,
  fontWeight: 600 
};

const itemsContainerStyle = { 
  display: "flex", 
  flexWrap: "wrap", 
  gap: 8 
};

const itemPillStyle = {
  background: "#FFF1F0",
  border: "1px solid rgba(255, 77, 79, 0.1)",
  color: "#111827",
  padding: "4px 10px",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700
};

const actionsStyle = { 
  display: "grid", 
  gridTemplateColumns: "1fr 1fr", 
  gap: 10 
};

const secondaryBtnStyle = { 
  textDecoration: "none", 
  textAlign: "center", 
  border: "1px solid #E5E7EB", 
  borderRadius: 12, 
  padding: "10px 8px", 
  color: "#374151", 
  fontSize: 13, 
  fontWeight: 700, 
  background: "#F9FAFB",
  transition: "all 0.2s ease" 
};

const deliveredBtnStyle = { 
  gridColumn: "1 / -1", 
  height: 46, 
  border: "none", 
  borderRadius: 12, 
  background: "#22C55E", 
  color: "white", 
  fontWeight: 800, 
  cursor: "pointer",
  fontSize: "14px",
  boxShadow: "0 6px 12px rgba(34, 197, 94, 0.15)",
  transition: "all 0.2s ease" 
};