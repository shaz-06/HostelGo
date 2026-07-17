import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

// Leaflet style fix
import "leaflet/dist/leaflet.css";

// Helper components for map interactions
function MapBoundsEffect({ route }) {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 0) {
      const bounds = L.latLngBounds(route.map(pt => [pt.lat, pt.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [route, map]);
  return null;
}

const statusColors = {
  "Order Placed": "#3b82f6",
  "Preparing": "#f97316",
  "Packed": "#eab308",
  "Rider Assigned": "#2563eb",
  "Picked Up": "#10b981",
  "Out for Delivery": "#8b5cf6",
  "Near You": "#06b6d4",
  "Delivered": "#10b981",
  "Cancelled": "#ef4444"
};

const timelineStages = [
  "Order Placed",
  "Payment Received",
  "Store Accepted",
  "Packing",
  "Rider Assigned",
  "On The Way",
  "Delivered"
];

const PRESET_INSTRUCTIONS = [
  "Leave at Security",
  "Call on Arrival",
  "Don't Ring Bell",
  "Text Instead"
];

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const storeMarkerIcon = L.divIcon({
  html: `<div style="font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">🏬</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  className: "custom-store-icon"
});

const customerMarkerIcon = L.divIcon({
  html: `<div style="font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">📍</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  className: "custom-customer-icon"
});

export default function OrderTrackingPage({ orderId }) {
  const navigate = useNavigate();
  const { token, refreshUser } = useContext(AuthContext);
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [hasTriggeredDelivered, setHasTriggeredDelivered] = useState(false);
  
  // Local state for delivery instructions
  const [instructionsText, setInstructionsText] = useState("");
  const [isUpdatingInstructions, setIsUpdatingInstructions] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Load initial tracking state via HTTP
  const loadTracking = useCallback(async () => {
    try {
      const res = await fetch(window.API_BASE_URL + `/api/orders/track/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to load tracking");
      setState(data);
      if (data.order?.deliveryInstructions) {
        setInstructionsText(data.order.deliveryInstructions);
      }
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    loadTracking();
  }, [loadTracking]);

  // Connect to Socket.IO and listen for updates
  useEffect(() => {
    if (!orderId) return;
    const socket = io(window.API_BASE_URL);

    socket.on("connect", () => {
      console.log("🔌 Connected to Socket.IO. Joining tracking room:", orderId);
      socket.emit("joinOrderRoom", orderId);
    });

    socket.on("tracking:update", (data) => {
      console.log("⚡ Received tracking update via Socket:", data);
      if (data && data.orderId === orderId) {
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            order: {
              ...prev.order,
              orderStatus: data.tracking.stage,
              estimatedArrivalMinutes: data.tracking.etaMinutes,
              estimatedDeliveryTime: data.tracking.estimatedArrival
            },
            tracking: {
              ...prev.tracking,
              ...data.tracking
            }
          };
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  const order = state?.order;
  const rider = state?.rider;
  const trackingInfo = state?.tracking;

  useEffect(() => {
    if (order?.orderStatus === "Delivered" && !hasTriggeredDelivered) {
      setShowDeliveredModal(true);
      setHasTriggeredDelivered(true);
      if (refreshUser) {
        refreshUser().catch(err => console.error("Failed to refresh user on delivery:", err));
      }
    } else if (order?.orderStatus !== "Delivered") {
      setHasTriggeredDelivered(false);
    }
  }, [order?.orderStatus, hasTriggeredDelivered, refreshUser]);

  const storeLat = 13.0835363;
  const storeLng = 77.6403678;

  const routeCoords = useMemo(() => {
    return trackingInfo?.route || [];
  }, [trackingInfo?.route]);

  const progressPercent = trackingInfo?.progress || 0;
  const bearing = trackingInfo?.bearing || 0;

  // Active stage determination in the 7-step Blinkit style timeline
  const activeTimelineIndex = useMemo(() => {
    const status = order?.orderStatus || "Order Placed";
    if (status === "Order Placed") return 1; // "Payment Received"
    if (status === "Preparing") return 2; // "Store Accepted"
    if (status === "Packed") return 3; // "Packing"
    if (status === "Rider Assigned") return 4; // "Rider Assigned"
    if (status === "Picked Up" || status === "Out for Delivery" || status === "Near You") return 5; // "On The Way"
    if (status === "Delivered") return 6; // "Delivered"
    return 0; // "Order Placed"
  }, [order?.orderStatus]);

  // Dynamic scooter icon with bearing/rotation applied
  const scooterMarkerIcon = useMemo(() => {
    return L.divIcon({
      html: `<div class="scooter-icon-wrapper" style="transform: rotate(${bearing}deg); transition: transform 0.4s ease-out; font-size: 32px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15)); text-align: center; line-height: 1;">🛵</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      className: "custom-scooter-icon"
    });
  }, [bearing]);

  const formattedEtaTime = useMemo(() => {
    if (!order?.estimatedDeliveryTime) return "";
    return new Date(order.estimatedDeliveryTime).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  }, [order?.estimatedDeliveryTime]);

  const formattedPlacedTime = useMemo(() => {
    if (!order?.createdAt) return "";
    return new Date(order.createdAt).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  }, [order?.createdAt]);

  const etaMinutesVal = useMemo(() => {
    return trackingInfo?.etaMinutes ?? order?.estimatedArrivalMinutes ?? 0;
  }, [trackingInfo?.etaMinutes, order?.estimatedArrivalMinutes]);

  const etaLabel = useMemo(() => {
    const status = order?.orderStatus;
    if (status === "Delivered") return "Arrived";
    if (status === "Cancelled") return "Cancelled";
    if (status === "Delivery Failed") return "Failed";
    
    if (etaMinutesVal > 0) {
      return `${etaMinutesVal} mins`;
    }
    return "Calculating...";
  }, [order?.orderStatus, etaMinutesVal]);

  // Handle Delivery Instructions update
  const handleUpdateInstructions = async (newText) => {
    setIsUpdatingInstructions(true);
    try {
      const res = await fetch(window.API_BASE_URL + `/api/orders/${orderId}/instructions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ instructions: newText })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInstructionsText(data.deliveryInstructions);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (err) {
      console.error("Failed to update delivery instructions:", err);
    } finally {
      setIsUpdatingInstructions(false);
    }
  };

  const togglePresetInstruction = (preset) => {
    let current = instructionsText.trim();
    if (current.includes(preset)) {
      current = current.replace(preset, "").replace(/,\s*,/g, ",").trim();
      if (current.startsWith(",")) current = current.substring(1).trim();
      if (current.endsWith(",")) current = current.substring(0, current.length - 1).trim();
    } else {
      current = current ? `${current}, ${preset}` : preset;
    }
    setInstructionsText(current);
    handleUpdateInstructions(current);
  };

  if (loading) {
    return <div style={loadingStyle}>Loading order summary...</div>;
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

  const customerLat = order?.deliveryLatitude;
  const customerLng = order?.deliveryLongitude;
  const scooterLat = trackingInfo?.currentLocation?.lat;
  const scooterLng = trackingInfo?.currentLocation?.lng;

  // Items Cost Breakdown calculations
  const subtotal = order?.products?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const deliveryFee = subtotal > 99 ? 0 : 29;
  const platformFee = 4;
  const coinsRedeemed = order?.buyCoins?.applied || order?.buyCoinsRedeemed || 0;
  const coinsDiscount = order?.buyCoins?.discount || order?.buyCoinsDiscount || 0;
  const couponDiscount = order?.couponDiscount || 0;
  const totalDiscount = coinsDiscount + couponDiscount;
  const totalPaid = Math.max(0, subtotal + deliveryFee + platformFee - totalDiscount);

  // Address parsing
  const rawAddress = order?.deliveryAddress || order?.user?.location || "";
  const cleanAddress = rawAddress.replace(/undefined/gi, "").trim();
  const addressLines = cleanAddress.split(",").map(line => line.trim()).filter(Boolean);

  return (
    <div style={pageStyle}>
      <style>{`
        @media (max-width: 900px) {
          .tracking-container-grid {
            grid-template-columns: 1fr !important;
          }
          .desktop-header-row {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 12px;
          }
        }
        @keyframes toastFade {
          0% { opacity: 0; transform: translateY(10px); }
          15%, 85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .scooter-icon-wrapper {
          transform-origin: center;
        }
      `}</style>

      {/* Success Toast */}
      {showSuccessToast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#10b981",
            color: "white",
            padding: "12px 24px",
            borderRadius: "12px",
            fontWeight: "800",
            boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
            zIndex: 999999,
            animation: "toastFade 3s forwards",
            fontSize: "14px"
          }}
        >
          ✓ Delivery Instructions Updated
        </div>
      )}

      {/* Header Banner */}
      <div className="desktop-header-row" style={headerRowStyle}>
        <div>
          <button style={backBtnStyle} onClick={() => navigate("/profile")}>← Back to Home</button>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "12px 0 4px" }}>
            Order #{orderId.slice(-8).toUpperCase()}
          </h1>
          <p style={mutedStyle}>Placed at {formattedPlacedTime}</p>
        </div>
        <div style={headerStatusBadge(order?.orderStatus)}>
          ✓ Order Confirmed
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="tracking-container-grid" style={gridStyle}>
        
        {/* Left Column (65%) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Confirmed Banner */}
          <div style={confirmedBannerStyle}>
            <div style={{ fontSize: 32 }}>🎉</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#065f46" }}>Order Confirmed!</h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#047857", fontWeight: 700 }}>
                Thank you for shopping with Buyto. Your order is placed and ready.
              </p>
            </div>
          </div>

          {/* Ordered Items */}
          <div style={panelStyle}>
            <h3 style={panelTitleStyle}>🛍️ Items Ordered</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {order?.products?.map((item) => (
                <div key={`${item.productId}-${item.name}`} style={itemRowStyle}>
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1542838132-92c53300491e"}
                    alt={item.name}
                    style={itemImageStyle}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={itemNameStyle}>{item.name}</h4>
                    <span style={itemWeightStyle}>{item.weight || "1 unit"}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#64748b" }}>
                      {formatMoney(item.price)} × {item.quantity}
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#0f172a", marginTop: 2 }}>
                      {formatMoney(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Charges Breakdown */}
          <div style={panelStyle}>
            <h3 style={panelTitleStyle}>💳 Payment Details</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={breakdownRow}>
                <span>Subtotal</span>
                <strong>{formatMoney(subtotal)}</strong>
              </div>
              <div style={breakdownRow}>
                <span>Delivery Fee</span>
                <span>{deliveryFee > 0 ? formatMoney(deliveryFee) : "FREE"}</span>
              </div>
              <div style={breakdownRow}>
                <span>Platform Fee</span>
                <span>{formatMoney(platformFee)}</span>
              </div>
              {totalDiscount > 0 && (
                <div style={{ ...breakdownRow, color: "#10b981" }}>
                  <span>Discounts Unlocked</span>
                  <strong>-{formatMoney(totalDiscount)}</strong>
                </div>
              )}
              {coinsRedeemed > 0 && (
                <div style={{ ...breakdownRow, color: "#b45309" }}>
                  <span>BuyCoins Redeemed ({coinsRedeemed} coins)</span>
                  <strong>-{formatMoney(coinsDiscount)}</strong>
                </div>
              )}
              <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "6px 0" }} />
              <div style={{ ...breakdownRow, fontSize: 16, color: "#0f172a" }}>
                <span>Total Paid</span>
                <strong>{formatMoney(totalPaid)}</strong>
              </div>
            </div>
            <div style={paymentMethodCard}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#475569" }}>
                Payment Method: <strong style={{ color: "#0f172a" }}>{order?.paymentMethod?.toUpperCase()}</strong>
              </span>
              <span style={paidSuccessBadge}>✓ Paid Successfully</span>
            </div>
            {/* BuyCoins Message */}
            {order?.totalAmount && (
              <div style={buycoinsEarnedBox}>
                <span style={{ fontSize: 18 }}>🪙</span>
                <span style={{ color: "#78350f", fontWeight: 800, fontSize: 13 }}>
                  You earned {Math.floor(order.totalAmount / 100)} BuyCoins with this order
                </span>
              </div>
            )}
          </div>

          {/* Delivery Address */}
          <div style={panelStyle}>
            <h3 style={panelTitleStyle}>📍 Delivery Address</h3>
            <div style={{ marginTop: 12 }}>
              <strong style={{ color: "#0f172a", fontSize: 15, fontWeight: 900, display: "block" }}>
                {order?.user?.name || "Customer"}
              </strong>
              {addressLines.map((line, idx) => (
                <span key={idx} style={{ color: "#475569", fontSize: 13, fontWeight: 600, display: "block", marginTop: 4 }}>
                  {line}
                </span>
              ))}
              {order?.user?.room && (
                <span style={{ color: "#475569", fontSize: 13, fontWeight: 700, display: "block", marginTop: 4 }}>
                  Room: {order.user.room}
                </span>
              )}
            </div>
          </div>

          {/* Delivery Instructions */}
          <div style={panelStyle}>
            <h3 style={panelTitleStyle}>🛵 Delivery Instructions</h3>
            <p style={{ margin: "4px 0 12px", fontSize: 12, color: "#64748b", fontWeight: 700 }}>
              Let the rider know where or how to drop off your order.
            </p>
            
            {/* Preset Option Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              {PRESET_INSTRUCTIONS.map((preset) => {
                const isActive = instructionsText.includes(preset);
                return (
                  <button
                    key={preset}
                    onClick={() => togglePresetInstruction(preset)}
                    style={presetBadgeStyle(isActive)}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>

            {/* Custom Input */}
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                value={instructionsText}
                onChange={(e) => setInstructionsText(e.target.value)}
                placeholder="Write custom instructions or note..."
                style={customInstructionsInput}
              />
              <button
                disabled={isUpdatingInstructions}
                onClick={() => handleUpdateInstructions(instructionsText)}
                style={saveInstructionsBtn}
              >
                {isUpdatingInstructions ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

        </div>

        {/* Right Column (35%) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* ETA Card */}
          <div style={etaCardStyle}>
            <span style={{ fontSize: 32 }}>🚴</span>
            <div>
              <span style={{ fontSize: 11, fontWeight: "950", color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Estimated Arrival
              </span>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#1e40af", marginTop: 2 }}>
                {etaLabel}
              </div>
              {order?.estimatedDeliveryTime && order?.orderStatus !== "Delivered" && (
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700, display: "block", marginTop: 4 }}>
                  Expected by {formattedEtaTime}
                </span>
              )}
            </div>
          </div>

          {/* Timeline Stages */}
          <div style={panelStyle}>
            <h3 style={panelTitleStyle}>📍 Order Status</h3>
            <div style={timelineList}>
              <div style={timelineTrackLine} />
              {timelineStages.map((stage, idx) => {
                const isCompleted = idx < activeTimelineIndex;
                const isCurrent = idx === activeTimelineIndex;
                return (
                  <div key={stage} style={timelineRowStyle}>
                    <div style={timelineDotStyle(isCompleted, isCurrent)}>
                      {isCompleted ? "✓" : isCurrent ? "●" : "○"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: isCompleted || isCurrent ? "#0f172a" : "#94a3b8", fontSize: 14, fontWeight: 800 }}>
                        {stage}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Map */}
          {routeCoords.length > 0 && (
            <div style={mapPanelStyle}>
              <MapContainer
                center={[storeLat, storeLng]}
                zoom={15}
                scrollWheelZoom={false}
                zoomControl={false}
                style={{ height: "400px", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[storeLat, storeLng]} icon={storeMarkerIcon} />
                {customerLat && customerLng && (
                  <Marker position={[customerLat, customerLng]} icon={customerMarkerIcon} />
                )}
                {scooterLat && scooterLng && (
                  <Marker position={[scooterLat, scooterLng]} icon={scooterMarkerIcon} />
                )}
                <Polyline positions={routeCoords.map(pt => [pt.lat, pt.lng])} color="#2563eb" weight={5} opacity={0.75} dashArray="5, 8" />
                <MapBoundsEffect route={routeCoords} />
              </MapContainer>
            </div>
          )}

          {/* Driver Card */}
          {rider && (order?.orderStatus === "Rider Assigned" || trackingInfo?.progress >= 15) && (
            <div style={driverCardStyle}>
              <div style={driverAvatarStyle}>
                {rider.profileImage ? <img src={rider.profileImage} alt={rider.name} style={avatarImgStyle} /> : rider.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 15, fontWeight: 900, color: "#0f172a" }}>{rider.name}</strong>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                  ⭐ {rider.rating} • {rider.vehicleType}
                </p>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", marginTop: 4, display: "block" }}>
                  {rider.plateNumber}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={`tel:${rider.phone}`} style={driverActionBtn}>Call</a>
                <button style={driverGhostBtn}>Chat</button>
              </div>
            </div>
          )}

          {/* Bottom Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={loadTracking} style={primaryActionBtn}>
              🔄 Refresh Tracking
            </button>
            <button onClick={() => navigate("/")} style={secondaryActionBtn}>
              🛍️ Continue Shopping
            </button>
            <button onClick={() => navigate("/help")} style={secondaryActionBtn}>
              💬 Contact Support
            </button>
          </div>

        </div>

      </div>

      {/* Delivered Success Modal */}
      {showDeliveredModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "20px",
            fontFamily: "'Outfit', 'Inter', sans-serif"
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              maxWidth: "460px",
              width: "100%",
              borderRadius: "28px",
              padding: "36px",
              textAlign: "center",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
            <h1 style={{ fontSize: "24px", fontWeight: "900", color: "#0f172a", margin: "0 0 8px 0" }}>
              Order Delivered!
            </h1>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 24px 0", fontWeight: "600" }}>
              Your order has reached the destination address.
            </p>

            {/* BuyCoins Loyalty Card */}
            <div
              style={{
                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                borderRadius: "20px",
                padding: "20px",
                border: "1.5px solid #fbbf24",
                marginBottom: "24px"
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#b45309", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Loyalty Reward Credited
              </span>
              <div style={{ fontSize: "22px", fontWeight: "900", color: "#78350f", marginTop: "2px" }}>
                +{Math.floor((order?.totalAmount || 0) / 100)} BuyCoins
              </div>
            </div>

            <button
              onClick={() => setShowDeliveredModal(false)}
              style={{
                width: "100%",
                height: "50px",
                border: "none",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
                color: "white",
                fontSize: "15px",
                fontWeight: "750",
                cursor: "pointer"
              }}
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Styling Object mappings
const loadingStyle = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit','Inter',sans-serif", fontWeight: 900, color: "#10b981" };
const pageStyle = { minHeight: "100vh", background: "#f8fafc", padding: "32px 16px", boxSizing: "border-box", fontFamily: "'Outfit','Inter',sans-serif" };
const headerRowStyle = { maxWidth: 1180, margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" };
const backBtnStyle = { border: "1px solid #e2e8f0", background: "white", color: "#0f172a", borderRadius: 999, padding: "8px 16px", fontWeight: 800, cursor: "pointer", transition: "all 0.2s" };
const titleStyle = { fontSize: 32, lineHeight: 1.1, margin: "14px 0 6px", color: "#0f172a", letterSpacing: 0 };
const mutedStyle = { color: "#64748b", margin: 0, fontSize: 13, fontWeight: 700 };
const headerStatusBadge = (status) => ({ background: "#d1fae5", border: "1.5px solid #10b981", color: "#065f46", fontWeight: 900, fontSize: 13, padding: "8px 16px", borderRadius: "12px" });
const gridStyle = { maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "1.5fr 0.85fr", gap: "20px", alignItems: "start" };

const confirmedBannerStyle = { display: "flex", gap: 16, alignItems: "center", background: "#e6fbf1", border: "1px solid #a7f3d0", borderRadius: "20px", padding: "16px 20px" };
const panelStyle = { background: "white", border: "1px solid #e2e8f0", borderRadius: "20px", padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" };
const panelTitleStyle = { margin: "0 0 16px 0", color: "#0f172a", fontSize: 16, fontWeight: 900 };

const itemRowStyle = { display: "flex", gap: 14, alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 14 };
const itemImageStyle = { width: 54, height: 54, borderRadius: 12, objectFit: "cover", background: "#f8fafc", border: "1px solid #f1f5f9" };
const itemNameStyle = { margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a" };
const itemWeightStyle = { fontSize: 12, color: "#64748b", fontWeight: 700 };

const breakdownRow = { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b", fontWeight: 700 };
const paymentMethodCard = { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", border: "1.5px solid #f1f5f9", padding: "12px 16px", borderRadius: "14px", marginTop: 14 };
const paidSuccessBadge = { background: "#d1fae5", color: "#065f46", fontSize: 11, fontWeight: 900, padding: "2px 8px", borderRadius: "999px" };
const buycoinsEarnedBox = { display: "flex", gap: 8, alignItems: "center", background: "#fffbeb", border: "1px solid #fde68a", padding: "12px 16px", borderRadius: "14px", marginTop: 14 };

const presetBadgeStyle = (active) => ({ border: active ? "2px solid #2563eb" : "1.5px solid #e2e8f0", background: active ? "#eff6ff" : "white", color: active ? "#1d4ed8" : "#475569", padding: "6px 12px", borderRadius: "999px", fontWeight: 800, fontSize: 12, cursor: "pointer", transition: "all 0.15s" });
const customInstructionsInput = { flex: 1, padding: "12px 16px", borderRadius: "14px", border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 600, fontFamily: "inherit" };
const saveInstructionsBtn = { background: "#111827", color: "white", border: "none", borderRadius: "14px", padding: "0 20px", fontWeight: 800, cursor: "pointer" };

const etaCardStyle = { display: "flex", gap: 16, alignItems: "center", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "20px", padding: "20px", boxShadow: "0 4px 20px rgba(37, 99, 235, 0.05)" };
const mapPanelStyle = { background: "white", border: "1px solid #e2e8f0", borderRadius: "20px", overflow: "hidden", padding: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.02)", zIndex: 1 };

const timelineList = { position: "relative", display: "flex", flexDirection: "column", gap: 16 };
const timelineTrackLine = { position: "absolute", left: 15, top: 10, bottom: 10, width: 2, background: "#e2e8f0" };
const timelineRowStyle = { display: "flex", gap: 14, alignItems: "center", position: "relative", zIndex: 2 };
const timelineDotStyle = (completed, current) => ({ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: completed ? 12 : 14, fontWeight: 900, color: completed ? "white" : current ? "white" : "#94a3b8", background: completed ? "#10b981" : current ? "#2563eb" : "#ffffff", border: `2.5px solid ${completed ? "#10b981" : current ? "#2563eb" : "#e2e8f0"}` });

const driverCardStyle = { display: "flex", gap: 14, alignItems: "center", background: "#f8fafc", border: "1.5px solid #e2e8f0", padding: "16px", borderRadius: "20px" };
const driverAvatarStyle = { width: 50, height: 50, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, overflow: "hidden" };
const avatarImgStyle = { width: "100%", height: "100%", objectFit: "cover" };
const driverActionBtn = { textDecoration: "none", background: "#10b981", color: "white", padding: "8px 14px", borderRadius: "10px", fontWeight: 800, fontSize: 12, boxShadow: "0 4px 10px rgba(16, 185, 129, 0.2)" };
const driverGhostBtn = { background: "white", color: "#475569", border: "1.5px solid #cbd5e1", padding: "8px 14px", borderRadius: "10px", fontWeight: 800, fontSize: 12, cursor: "pointer" };

const primaryActionBtn = { width: "100%", padding: "14px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)", color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(17, 24, 39, 0.2)" };
const secondaryActionBtn = { width: "100%", padding: "14px", borderRadius: "14px", border: "1.5px solid #cbd5e1", background: "white", color: "#334155", fontSize: 14, fontWeight: 800, cursor: "pointer" };
const errorPanelStyle = { ...panelStyle, maxWidth: 520, margin: "80px auto", textAlign: "center" };
const secondaryBtnStyle = { border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "white", borderRadius: 12, padding: "11px 14px", fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)", marginTop: 14 };