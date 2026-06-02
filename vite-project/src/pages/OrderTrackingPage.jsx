import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";

const statusColors = {
  "Order Placed": "#3b82f6",
  Preparing: "#f97316",
  Packed: "#eab308",
  "Rider Assigned": "#2563eb",
  "Out for Delivery": "#8b5cf6",
  Delivered: "#10b981",
  Cancelled: "#ef4444"
};

const stepLabels = ["Order Placed", "Preparing", "Packed", "Rider Assigned", "Out for Delivery", "Delivered"];
const timestampKeys = {
  "Order Placed": "orderPlaced",
  Preparing: "preparing",
  Packed: "packed",
  "Rider Assigned": "riderAssigned",
  "Out for Delivery": "outForDelivery",
  Delivered: "delivered"
};

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function OrderTrackingPage({ orderId }) {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const loadTracking = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/orders/track/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to load tracking");
      setTracking(data);
      setError("");
      const etaTime = data.eta?.estimatedDeliveryTime ? new Date(data.eta.estimatedDeliveryTime).getTime() : Date.now();
      setSecondsLeft(Math.max(0, Math.floor((etaTime - Date.now()) / 1000)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    loadTracking();
    const poller = setInterval(loadTracking, 5000);
    return () => clearInterval(poller);
  }, [loadTracking]);

  useEffect(() => {
    if (!orderId) return;
    const socket = io("http://localhost:8000");

    socket.on("connect", () => {
      console.log("🔌 OrderTrackingPage connected to Socket.IO. Joining room:", orderId);
      socket.emit("joinOrderRoom", orderId);
    });

    socket.on("riderLocationUpdated", (data) => {
      console.log("=== SOCKET LOCATION EVENT ===");
      console.log(data);
      loadTracking();
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId, loadTracking]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const order = tracking?.order;
  const rider = tracking?.rider;

  useEffect(() => {
    if (order) {
      console.log("=== TRACK ORDER DATA ===");
      console.log(order);

      console.log("=== DELIVERY ADDRESS ===");
      console.log(order.deliveryAddress);
    }
  }, [order]);

  const isBorzoOrder = !!order?.borzoOrderId;
  const borzoStepLabels = ["Order Placed", "Preparing", "Packed", "Rider Assigned", "Picked Up", "Out for Delivery", "Delivered"];
  const borzoTimestampKeys = {
    "Order Placed": "orderPlaced",
    "Preparing": "preparing",
    "Packed": "packed",
    "Rider Assigned": "riderAssigned",
    "Picked Up": "pickedUp",
    "Out for Delivery": "outForDelivery",
    "Delivered": "delivered"
  };

  const stepsToUse = isBorzoOrder ? borzoStepLabels : stepLabels;
  const timestampKeysToUse = isBorzoOrder ? borzoTimestampKeys : timestampKeys;

  const activeIndex = useMemo(() => {
    return Math.max(0, stepsToUse.indexOf(order?.orderStatus));
  }, [order?.orderStatus, stepsToUse]);

  const progressPercent = useMemo(() => {
    if (!isBorzoOrder) return tracking?.progress || 0;
    if (order?.orderStatus === "Cancelled" || order?.orderStatus === "Delivery Failed") return 0;
    const idx = borzoStepLabels.indexOf(order?.orderStatus);
    if (idx === -1) return 0;
    return Math.round(((idx + 1) / borzoStepLabels.length) * 100);
  }, [isBorzoOrder, order?.orderStatus, tracking?.progress]);

  const formattedEtaTime = useMemo(() => {
    if (!order?.estimatedDeliveryTime) return "";
    return new Date(order.estimatedDeliveryTime).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  }, [order?.estimatedDeliveryTime]);

  const hasRider = !!(rider || order?.borzoRiderName || order?.riderName || order?.riderId || order?.riderAssigned);
  const status = order?.orderStatus;

  const getCalculatedEtaMinutes = () => {
    if (status === "Delivered") {
      return 0;
    }

    const STORE_LAT = 13.0835363;
    const STORE_LNG = 77.6403678;

    const customerLat = order?.deliveryLatitude ? Number(order.deliveryLatitude) : null;
    const customerLng = order?.deliveryLongitude ? Number(order.deliveryLongitude) : null;

    const riderLat = (rider?.currentLocation?.lat || rider?.latitude) ? Number(rider.currentLocation.lat || rider.latitude) : null;
    const riderLng = (rider?.currentLocation?.lng || rider?.longitude) ? Number(rider.currentLocation.lng || rider.longitude) : null;

    const getDistanceKm = (lat1, lon1, lat2, lon2) => {
      if (!lat1 || !lon1 || !lat2 || !lon2) return null;
      const R = 6371; // Radius of the Earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const travelTimeStoreToCustomer = (() => {
      const dist = getDistanceKm(STORE_LAT, STORE_LNG, customerLat, customerLng);
      return dist !== null ? Math.max(5, Math.round(dist * 3)) : 15; // 15 mins default (~5km)
    })();

    const travelTimeRiderToStore = (() => {
      const dist = getDistanceKm(riderLat, riderLng, STORE_LAT, STORE_LNG);
      return dist !== null ? Math.max(2, Math.round(dist * 3)) : 5; // 5 mins default
    })();

    const travelTimeRiderToCustomer = (() => {
      const dist = getDistanceKm(riderLat, riderLng, customerLat, customerLng);
      return dist !== null ? Math.max(2, Math.round(dist * 3)) : null;
    })();

    const getBorzoTrackingEta = () => {
      const webhook = order?.borzoWebhookData;
      const rawEta = webhook?.order?.eta || webhook?.delivery?.eta;
      if (rawEta) {
        const num = Number(rawEta);
        if (!isNaN(num) && num > 0) return num;
      }
      if (order?.estimatedDeliveryTime) {
        const diffMs = new Date(order.estimatedDeliveryTime).getTime() - Date.now();
        const mins = Math.max(0, Math.ceil(diffMs / 60000));
        if (mins > 0) return mins;
      }
      return null;
    };

    // 1. Before Rider Assigned
    const isBeforeRiderAssigned = ["Pending", "Order Placed", "Preparing", "Packed"].includes(status) && !hasRider;
    if (isBeforeRiderAssigned) {
      const packingTime = 8;
      const riderAllocationBuffer = 10;
      return packingTime + riderAllocationBuffer + travelTimeStoreToCustomer;
    }

    // 2. Rider Assigned
    if (status === "Rider Assigned") {
      const borzoEta = getBorzoTrackingEta();
      if (borzoEta !== null && borzoEta > 0) {
        return borzoEta;
      }
      // Otherwise continue distance-based calculation
      return travelTimeRiderToStore + travelTimeStoreToCustomer;
    }

    // 3. Picked Up / Out For Delivery
    if (status === "Picked Up" || status === "Out for Delivery") {
      if (riderLat && riderLng) {
        const eta = travelTimeRiderToCustomer;
        if (eta !== null && eta > 0) {
          return eta;
        }
      }
      // Otherwise use Borzo tracking ETA
      const borzoEta = getBorzoTrackingEta();
      if (borzoEta !== null && borzoEta > 0) {
        return borzoEta;
      }
    }

    // Default Fallback
    const borzoEta = getBorzoTrackingEta();
    if (borzoEta !== null && borzoEta > 0) return borzoEta;
    return travelTimeStoreToCustomer;
  };

  const calculatedMinutes = getCalculatedEtaMinutes();
  let etaLabel = "Calculating ETA...";

  if (status === "Delivered") {
    etaLabel = "Delivered";
  } else if (status === "Delivery Failed") {
    etaLabel = "Delivery Failed";
  } else if (status === "Cancelled") {
    etaLabel = "Cancelled";
  } else {
    if (calculatedMinutes && calculatedMinutes > 0) {
      etaLabel = `Estimated Arrival: ${calculatedMinutes} mins`;
    } else {
      etaLabel = "Calculating ETA...";
    }
  }

  if (loading) {
    return <div style={loadingStyle}>Loading live tracking...</div>;
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <div style={errorPanelStyle}>
          <h1 style={titleStyle}>Tracking unavailable</h1>
          <p style={mutedStyle}>{error}</p>
          <button style={secondaryBtnStyle} onClick={() => navigate("/profile")}>Back to orders</button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <style>{`
        @media (max-width: 820px) {
          .tracking-grid { grid-template-columns: 1fr !important; }
          .tracking-header { flex-direction: column; align-items: flex-start !important; }
          .timeline-row { grid-template-columns: 34px 1fr !important; }
          .timeline-line { left: 16px !important; }
        }
        @keyframes etaPulse {
          0%, 100% { box-shadow: 0 0 18px rgba(34,197,94,0.22); }
          50% { box-shadow: 0 0 34px rgba(34,197,94,0.46); }
        }
      `}</style>

      <header className="tracking-header" style={headerStyle}>
        <div>
          <button style={backBtnStyle} onClick={() => navigate("/profile")}>← My orders</button>
          <h1 style={titleStyle}>Live Order Tracking</h1>
          <p style={mutedStyle}>Order #{order?._id?.slice(-8)} • Auto-refreshes every 5 seconds</p>
        </div>
        <motion.div animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 1.8, repeat: Infinity }} style={etaBadgeStyle(order?.orderStatus)}>
          <span style={etaSmallStyle}>ETA</span>
          <strong>{etaLabel}</strong>
        </motion.div>
      </header>

      <main className="tracking-grid" style={layoutStyle}>
        <section style={mainColumnStyle}>
          <section style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <h2 style={sectionTitleStyle}>Delivery Progress</h2>
              <span style={statusPillStyle(order?.orderStatus)}>{order?.orderStatus}</span>
            </div>

            <div style={progressTrackStyle}>
              <motion.div
                style={progressFillStyle(statusColors[order?.orderStatus] || "#22c55e")}
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
            </div>

            <div style={timelineStyle}>
              <div className="timeline-line" style={timelineLineStyle} />
              {stepsToUse.map((step, index) => {
                const isCancelledOrFailed = order?.orderStatus === "Cancelled" || order?.orderStatus === "Delivery Failed";
                const isDone = isCancelledOrFailed ? false : (index < activeIndex || order?.orderStatus === "Delivered");
                const isActive = isCancelledOrFailed ? false : (index === activeIndex && order?.orderStatus !== "Delivered");
                const timestamp = tracking?.timestamps?.[timestampKeysToUse[step]];

                return (
                  <motion.div
                    className="timeline-row"
                    key={step}
                    style={timelineRowStyle}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                  >
                    <motion.div
                      style={stepDotStyle(step, isDone, isActive)}
                      animate={isActive ? { scale: [1, 1.16, 1] } : { scale: 1 }}
                      transition={isActive ? { duration: 1.4, repeat: Infinity } : undefined}
                    >
                      {isDone ? "✓" : index + 1}
                    </motion.div>
                    <div style={stepContentStyle}>
                      <strong style={{ color: isDone || isActive ? "#0f172a" : "#94a3b8" }}>{step}</strong>
                      <span style={timeStyle}>{timestamp ? new Date(timestamp).toLocaleString() : isActive ? "In progress" : "Waiting"}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionTitleStyle}>Order Summary</h2>
            <div style={itemsStyle}>
              {order?.products?.map((item) => (
                <div key={`${item.productId}-${item.name}`} style={itemRowStyle}>
                  <span style={itemNameStyle}>{item.name}</span>
                  <span style={mutedTinyStyle}>{item.weight || "1 unit"}</span>
                  <span style={qtyStyle}>x{item.quantity}</span>
                  <strong>{formatMoney(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>
            <div style={summaryFooterStyle}>
              <span>{order?.paymentMethod?.toUpperCase()} • {order?.paymentStatus}</span>
              <strong>{formatMoney(order?.totalAmount)}</strong>
            </div>
          </section>
        </section>

        <aside style={sideColumnStyle}>
          <motion.section whileHover={{ y: -3 }} style={panelStyle}>
            <h2 style={sectionTitleStyle}>Delivery Partner</h2>
            {rider || (isBorzoOrder && (order?.borzoRiderName || order?.riderName)) ? (
              <div style={riderCardStyle}>
                <div style={riderAvatarStyle}>
                  {rider?.profileImage ? <img src={rider.profileImage} alt={rider.name} style={avatarImgStyle} /> : (rider?.name || order?.borzoRiderName || order?.riderName || "R").slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={riderNameStyle}>{order?.borzoRiderName || order?.riderName || rider?.name}</strong>
                  <p style={mutedStyle}>{isBorzoOrder ? "Borzo Delivery Partner" : (rider?.vehicleType || "Delivery Vehicle")}</p>
                  {!isBorzoOrder && <span style={onlineStyle(rider?.isOnline)}>{rider?.isOnline ? "Online" : "Offline"}</span>}
                </div>
                <div style={riderActionsStyle}>
                  <a href={`tel:${order?.borzoRiderPhone || order?.riderPhone || rider?.phone || ""}`} style={actionBtnStyle}>Call Rider</a>
                  <button style={ghostBtnStyle}>Message</button>
                </div>
              </div>
            ) : (
              <div style={emptyRiderStyle}>
                {isBorzoOrder ? "Searching for courier" : "A rider will be assigned once your order is packed."}
              </div>
            )}
            {isBorzoOrder && order?.borzoTrackingUrl && (
              <div style={{ marginTop: 14 }}>
                <a 
                  href={order.borzoTrackingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{
                    display: "block",
                    textDecoration: "none",
                    textAlign: "center",
                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    color: "white",
                    padding: "12px",
                    borderRadius: "12px",
                    fontWeight: "800",
                    fontSize: "14px",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
                    transition: "all 0.2s"
                  }}
                >
                  🗺️ Track Rider on Borzo Map
                </a>
              </div>
            )}
          </motion.section>

          <section style={etaPanelStyle}>
            <span style={etaSmallStyle}>Estimated arrival</span>
            <strong style={etaBigStyle}>{etaLabel}</strong>
            <p style={mutedStyle}>
              {order?.orderStatus === "Delivered"
                ? "Your order has reached the delivery address."
                : isBorzoOrder 
                  ? "Your delivery is being handled by Borzo."
                  : "Tracking is polling live. Socket.IO can plug into this same payload later."}
            </p>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionTitleStyle}>Delivery Address</h2>
            {(() => {
              const rawAddress = order?.deliveryAddress || order?.user?.location || "Central Address";
              const cleanAddress = rawAddress.replace(/undefined/gi, "").trim();
              const address = cleanAddress || "Central Address";
              const addressLines = address.split(",").map(line => line.trim()).filter(Boolean);

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
                  {addressLines.length > 0 ? (
                    <>
                      <strong style={{ color: "#0f172a", fontSize: 15, fontWeight: 900, display: "flex", alignItems: "center", gap: 6 }}>
                        📍 {addressLines[0]}
                      </strong>
                      {addressLines.slice(1).map((line, idx) => (
                        <span key={idx} style={{ color: "#475569", fontSize: 13, fontWeight: 700 }}>
                          {line}
                        </span>
                      ))}
                    </>
                  ) : (
                    <span style={{ color: "#475569", fontSize: 13, fontWeight: 700 }}>
                      📍 Central Address
                    </span>
                  )}
                </div>
              );
            })()}
          </section>
        </aside>
      </main>
    </div>
  );
}

const loadingStyle = { minHeight: "100vh", background: "#f8fafc", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit','Inter',sans-serif", fontWeight: 900 };
const pageStyle = { minHeight: "100vh", background: "#f8fafc", color: "#0f172a", padding: "20px", boxSizing: "border-box", fontFamily: "'Outfit','Inter',sans-serif" };
const headerStyle = { maxWidth: 1180, margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 };
const backBtnStyle = { border: "1px solid #e2e8f0", background: "white", color: "#0f172a", borderRadius: 999, padding: "9px 13px", fontWeight: 850, cursor: "pointer", transition: "all 0.2s" };
const titleStyle = { fontSize: 32, lineHeight: 1.1, margin: "14px 0 6px", color: "#0f172a", letterSpacing: 0 };
const mutedStyle = { color: "#64748b", margin: 0, fontSize: 13, fontWeight: 750, lineHeight: 1.45 };
const layoutStyle = { maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1.5fr 0.85fr", gap: 18, alignItems: "start" };
const mainColumnStyle = { display: "flex", flexDirection: "column", gap: 18 };
const sideColumnStyle = { display: "flex", flexDirection: "column", gap: 18 };
const panelStyle = { background: "white", border: "1px solid #e2e8f0", borderRadius: 20, padding: 18, boxShadow: "0 8px 30px rgba(0,0,0,0.03)" };
const errorPanelStyle = { ...panelStyle, maxWidth: 520, margin: "80px auto" };
const sectionHeaderStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 };
const sectionTitleStyle = { margin: 0, color: "#0f172a", fontSize: 18, letterSpacing: 0 };
const statusPillStyle = (status) => ({ color: statusColors[status] || "#cbd5e1", border: `1px solid ${(statusColors[status] || "#cbd5e1")}33`, background: `${statusColors[status] || "#cbd5e1"}0d`, borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 950 });
const progressTrackStyle = { height: 9, background: "#f1f5f9", borderRadius: 999, overflow: "hidden", marginBottom: 24 };
const progressFillStyle = (color) => ({ height: "100%", background: `linear-gradient(90deg, ${color}, #10b981)` });
const timelineStyle = { position: "relative", display: "flex", flexDirection: "column", gap: 14 };
const timelineLineStyle = { position: "absolute", left: 19, top: 12, bottom: 12, width: 2, background: "#e2e8f0" };
const timelineRowStyle = { display: "grid", gridTemplateColumns: "40px 1fr", gap: 12, alignItems: "center", position: "relative" };
const stepDotStyle = (step, done, active) => ({ width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: done ? "white" : active ? "white" : "#94a3b8", background: done ? "#10b981" : active ? "#3b82f6" : "#ffffff", border: `2px solid ${done ? "#10b981" : active ? "#3b82f6" : "#e2e8f0"}`, fontWeight: 950, boxShadow: active ? `0 0 14px rgba(59, 130, 246, 0.4)` : "none", zIndex: 1 });
const stepContentStyle = { background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 14, padding: "11px 12px", display: "flex", flexDirection: "column", gap: 4 };
const timeStyle = { color: "#64748b", fontSize: 12, fontWeight: 750 };
const itemsStyle = { display: "flex", flexDirection: "column", gap: 10, marginTop: 14 };
const itemRowStyle = { display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 10, alignItems: "center", color: "#334155", borderBottom: "1px solid #f1f5f9", paddingBottom: 10, fontSize: 13 };
const itemNameStyle = { fontWeight: 850, color: "#0f172a" };
const mutedTinyStyle = { color: "#64748b", fontSize: 12, fontWeight: 750 };
const qtyStyle = { color: "#10b981", fontWeight: 950 };
const summaryFooterStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", color: "#0f172a", fontSize: 14, fontWeight: 850, paddingTop: 14 };
const etaBadgeStyle = (status) => ({ minWidth: 190, borderRadius: 18, padding: "14px 16px", background: status === "Delivered" ? "#ecfdf5" : "#eff6ff", border: `1px solid ${status === "Delivered" ? "#a7f3d0" : "#bfdbfe"}`, color: status === "Delivered" ? "#065f46" : "#1e40af", display: "flex", flexDirection: "column", gap: 3, animation: "etaPulse 1.8s infinite" });
const etaSmallStyle = { color: "#64748b", fontSize: 11, fontWeight: 950, textTransform: "uppercase" };
const riderCardStyle = { display: "flex", alignItems: "center", gap: 13, marginTop: 15 };
const riderAvatarStyle = { width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#06b6d4)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 950, overflow: "hidden", flexShrink: 0 };
const avatarImgStyle = { width: "100%", height: "100%", objectFit: "cover" };
const riderNameStyle = { display: "block", color: "#0f172a", fontSize: 16, fontWeight: 800, marginBottom: 4 };
const onlineStyle = (online) => ({ display: "inline-flex", marginTop: 8, color: online ? "#065f46" : "#475569", background: online ? "#d1fae5" : "#f1f5f9", borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 950 });
const riderActionsStyle = { display: "flex", flexDirection: "column", gap: 8 };
const actionBtnStyle = { textDecoration: "none", color: "white", background: "linear-gradient(135deg, #10b981, #059669)", border: "none", borderRadius: 10, padding: "9px 11px", fontSize: 12, fontWeight: 950, textAlign: "center", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)" };
const ghostBtnStyle = { color: "#475569", background: "white", border: "1px solid #cbd5e1", borderRadius: 10, padding: "9px 11px", fontSize: 12, fontWeight: 950, cursor: "pointer" };
const emptyRiderStyle = { color: "#64748b", border: "1px dashed #cbd5e1", borderRadius: 14, padding: 18, marginTop: 14, fontWeight: 850, textAlign: "center", background: "#f8fafc" };
const etaPanelStyle = { ...panelStyle, borderColor: "#bfdbfe", background: "#f0f7ff" };
const etaBigStyle = { display: "block", color: "#1d4ed8", fontSize: 28, fontWeight: 900, margin: "6px 0 8px" };
const addressStyle = { color: "#334155", margin: "12px 0 8px", lineHeight: 1.5, fontWeight: 800 };
const secondaryBtnStyle = { border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "white", borderRadius: 12, padding: "11px 14px", fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)" };
