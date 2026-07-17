import React, { useCallback, useContext, useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

// Leaflet style fix
import "leaflet/dist/leaflet.css";

// Helper components for map interactions
function MapController({ route, scooterPos, followRider }) {
  const map = useMap();
  const lastCentering = useRef(0);

  useEffect(() => {
    if (route && route.length > 0 && lastCentering.current === 0) {
      const bounds = L.latLngBounds(route.map(pt => [pt.lat, pt.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
      lastCentering.current = Date.now();
    }
  }, [route, map]);

  useEffect(() => {
    if (!scooterPos || !followRider) return;
    const now = Date.now();
    
    // Auto-center if follow rider is true OR if the marker leaves the visible bounds
    const isWithinBounds = map.getBounds().contains([scooterPos.lat, scooterPos.lng]);
    if (followRider || !isWithinBounds) {
      map.setView([scooterPos.lat, scooterPos.lng], map.getZoom(), { animate: true, duration: 1.5 });
    }
  }, [scooterPos, followRider, map]);

  return null;
}

const timelineStages = [
  { name: "Order Placed", key: "placed" },
  { name: "Payment Received", key: "payment" },
  { name: "Store Accepted", key: "storeaccepted" },
  { name: "Packing", key: "packing" },
  { name: "Rider Assigned", key: "riderassigned" },
  { name: "On The Way", key: "ontheway" },
  { name: "Delivered", key: "delivered" }
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

// Component Skeletons and Memoized Subcomponents
const OrderDetailsLeftColumn = React.memo(({ order, subtotal, deliveryFee, platformFee, totalDiscount, coinsRedeemed, coinsDiscount, totalPaid, cleanAddress, addressLines, instructionsText, isUpdatingInstructions, togglePresetInstruction, handleUpdateInstructions, setInstructionsText }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Confirmed Banner */}
      <div style={confirmedBannerStyle}>
        <div style={{ fontSize: 32 }}>🎉</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#065f46" }}>Order Confirmed!</h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#047857", fontWeight: 700 }}>
            Thank you for shopping with Buyto. Your order is confirmed and is being processed.
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

      {/* Payment Details */}
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
  );
});

// ETA section supporting smooth digit transition
const ETASection = React.memo(({ etaMinutesVal, orderStatus, estimatedDeliveryTime }) => {
  const formattedEtaTime = useMemo(() => {
    if (!estimatedDeliveryTime) return "";
    return new Date(estimatedDeliveryTime).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });
  }, [estimatedDeliveryTime]);

  const etaLabel = useMemo(() => {
    if (orderStatus === "Delivered") return "Delivered";
    if (orderStatus === "Cancelled") return "Cancelled";
    if (orderStatus === "Delivery Failed") return "Failed";
    return etaMinutesVal > 0 ? `${etaMinutesVal} mins` : "Calculating...";
  }, [orderStatus, etaMinutesVal]);

  return (
    <div style={etaCardStyle}>
      <span style={{ fontSize: 32 }}>🚴</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 11, fontWeight: "950", color: "#1e40af", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Estimated Arrival
        </span>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#1e40af", marginTop: 2 }}>
          {etaLabel}
        </div>
        {estimatedDeliveryTime && orderStatus !== "Delivered" && (
          <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 700, display: "block", marginTop: 4 }}>
            Expected by {formattedEtaTime}
          </span>
        )}
      </div>
    </div>
  );
});

// Real-time timeline rendering with status history timestamps
const TimelineSection = React.memo(({ orderStatus, statusTimestamps }) => {
  const activeTimelineIndex = useMemo(() => {
    if (orderStatus === "Order Placed") return 1; 
    if (orderStatus === "Preparing") return 2; 
    if (orderStatus === "Packed") return 3; 
    if (orderStatus === "Rider Assigned") return 4; 
    if (orderStatus === "Picked Up" || orderStatus === "Out for Delivery" || orderStatus === "Near You") return 5;
    if (orderStatus === "Delivered") return 6; 
    return 0;
  }, [orderStatus]);

  return (
    <div style={panelStyle}>
      <h3 style={panelTitleStyle}>📍 Order Status</h3>
      <div style={timelineList}>
        <div style={timelineTrackLine} />
        {timelineStages.map((stage, idx) => {
          const isCompleted = idx < activeTimelineIndex;
          const isCurrent = idx === activeTimelineIndex;
          
          // Timestamp matching
          const tsRaw = statusTimestamps?.[stage.key];
          const formattedTime = tsRaw ? new Date(tsRaw).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : "";

          return (
            <div key={stage.name} style={timelineRowStyle}>
              <div style={timelineDotStyle(isCompleted, isCurrent)}>
                {isCompleted ? "✓" : isCurrent ? "●" : "○"}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ color: isCompleted || isCurrent ? "#0f172a" : "#94a3b8", fontSize: 14, fontWeight: 800 }}>
                  {stage.name}
                </strong>
                {formattedTime && (
                  <span style={{ display: "block", fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>
                    {formattedTime}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// Rider details skeleton and details card
const RiderSection = React.memo(({ rider, orderStatus, progress }) => {
  const isAssigned = rider && (orderStatus === "Rider Assigned" || progress >= 15);

  if (!isAssigned) {
    return (
      <div style={riderSkeletonStyle}>
        <div style={avatarSkeleton} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={skeletonLineShort} />
          <div style={skeletonLineLong} />
        </div>
      </div>
    );
  }

  // Realistic rider updates message
  const riderMessage = useMemo(() => {
    if (orderStatus === "Delivered") return "Delivered";
    if (progress >= 90) return "Arriving in 2 mins";
    if (progress >= 80) return "Almost there";
    if (progress >= 60) return "Rider is on the way";
    return "Waiting at store";
  }, [orderStatus, progress]);

  return (
    <div style={driverCardStyle}>
      <div style={driverAvatarStyle}>
        {rider.profileImage ? <img src={rider.profileImage} alt={rider.name} style={avatarImgStyle} /> : rider.name.slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <strong style={{ fontSize: 15, fontWeight: 900, color: "#0f172a" }}>{rider.name}</strong>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b", fontWeight: 700 }}>
          ⭐ {rider.rating} • {rider.vehicleType || "TVS Jupiter"}
        </p>
        <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", marginTop: 4, display: "block" }}>
          {rider.plateNumber || "KA 03 JM 1234"}
        </span>
        <span style={{ display: "block", fontSize: 12, color: "#10b981", fontWeight: 800, marginTop: 4 }}>
          {riderMessage}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <a href={`tel:${rider.phone}`} style={driverActionBtn}>Call</a>
        <button style={driverGhostBtn}>Chat</button>
      </div>
    </div>
  );
});

export default function OrderTrackingPage({ orderId }) {
  const navigate = useNavigate();
  const { token, refreshUser } = useContext(AuthContext);
  
  // Authoritative server states
  const [order, setOrder] = useState(null);
  const [rider, setRider] = useState(null);
  const [trackingInfo, setTrackingInfo] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // 'connecting', 'connected', 'reconnecting', 'polling'
  const [followRider, setFollowRider] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  
  // Local state for delivery instructions
  const [instructionsText, setInstructionsText] = useState("");
  const [isUpdatingInstructions, setIsUpdatingInstructions] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Keep references to version and values to filter stale events
  const currentVersion = useRef(0);
  const lastUpdatedAt = useRef("");
  const pollingInterval = useRef(null);
  const socketRef = useRef(null);

  // Fetch initial tracking payload once
  const loadInitialTracking = useCallback(async () => {
    try {
      const res = await fetch(window.API_BASE_URL + `/api/orders/track/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to load tracking details");

      const ver = data.order?.trackingVersion || 0;
      if (ver >= currentVersion.current) {
        currentVersion.current = ver;
        setOrder(data.order);
        setRider(data.rider);
        setTrackingInfo(data.tracking);
        if (data.order?.deliveryInstructions) {
          setInstructionsText(data.order.deliveryInstructions);
        }
      }
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  // Fallback Polling Handler
  const startFallbackPolling = useCallback(() => {
    if (pollingInterval.current) return;
    console.warn("⚠️ Switching to 10s HTTP polling fallback.");
    setConnectionStatus("polling");
    pollingInterval.current = setInterval(() => {
      loadInitialTracking();
    }, 10000);
  }, [loadInitialTracking]);

  const stopFallbackPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
      console.log("🔌 Stopped fallback polling.");
    }
  }, []);

  // Update states safely check versions
  const processLiveEvent = useCallback((event) => {
    const eventVersion = event.version || 0;
    const eventTime = event.updatedAt || "";

    if (eventVersion < currentVersion.current) {
      console.warn("Stale event ignored:", event);
      return;
    }

    currentVersion.current = eventVersion;
    lastUpdatedAt.current = eventTime;

    if (event.type === "status") {
      setOrder(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          orderStatus: event.status,
          estimatedArrivalMinutes: event.eta,
          trackingVersion: eventVersion,
          statusTimestamps: event.tracking?.stage
            ? { ...prev.statusTimestamps, [event.status.toLowerCase().replace(/ /g, "")]: event.updatedAt }
            : prev.statusTimestamps
        };
      });
      if (event.rider) {
        setRider({
          name: event.rider.riderName,
          rating: event.rider.rating,
          vehicleType: event.rider.vehicle,
          plateNumber: event.rider.vehicleNumber,
          phone: event.rider.phone,
          profileImage: event.rider.riderPhoto
        });
      }
      if (event.tracking) {
        setTrackingInfo(prev => ({
          ...prev,
          ...event.tracking
        }));
      }
      triggerToast(`📦 Status Update: ${event.status}`);
    } 
    else if (event.type === "rider") {
      setRider({
        name: event.riderName,
        rating: event.rating,
        vehicleType: event.vehicle,
        plateNumber: event.vehicleNumber,
        phone: event.phone,
        profileImage: event.riderPhoto
      });
      triggerToast(`🛵 Rider assigned to your order!`);
    } 
    else if (event.type === "location") {
      setTrackingInfo(prev => {
        const route = prev?.route || [];
        return {
          ...prev,
          progress: event.progress,
          etaMinutes: event.eta,
          distanceRemaining: event.distanceRemaining,
          currentLocation: {
            lat: event.latitude,
            lng: event.longitude,
            bearing: event.bearing || 0
          },
          lastUpdated: event.updatedAt,
          version: eventVersion
        };
      });
    } 
    else if (event.type === "delivered") {
      setOrder(prev => prev ? { ...prev, orderStatus: "Delivered" } : prev);
      setTrackingInfo(prev => prev ? { ...prev, progress: 100 } : prev);
      triggerToast("🎉 Your order has been delivered!");
    }
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Socket setup
  useEffect(() => {
    loadInitialTracking().then(() => {
      // Connect to Socket.IO immediately after initial load
      const socket = io(window.API_BASE_URL, {
        reconnectionDelayMax: 10000,
        reconnectionAttempts: 5
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("🔌 Connected to Socket.IO room order_" + orderId);
        setConnectionStatus(connectionStatus === "reconnecting" ? "online" : "connected");
        stopFallbackPolling();
        socket.emit("joinOrderRoom", orderId);
      });

      socket.on("disconnect", () => {
        console.warn("🔌 Socket.IO disconnected.");
        setConnectionStatus("reconnecting");
        startFallbackPolling();
      });

      socket.on("connect_error", () => {
        setConnectionStatus("reconnecting");
        startFallbackPolling();
      });

      // Split event listeners
      socket.on("order:statusUpdated", (data) => {
        console.log("Received order:statusUpdated:", data);
        processLiveEvent(data);
      });

      socket.on("order:riderAssigned", (data) => {
        console.log("Received order:riderAssigned:", data);
        processLiveEvent(data);
      });

      socket.on("order:locationUpdated", (data) => {
        console.log("Received order:locationUpdated:", data);
        processLiveEvent(data);
      });

      socket.on("order:delivered", (data) => {
        console.log("Received order:delivered:", data);
        processLiveEvent(data);
      });

      // Legacy socket update support
      socket.on("tracking:update", (data) => {
        if (data && data.orderId === orderId) {
          const legacyPayload = {
            type: "status",
            status: data.tracking.stage,
            eta: data.tracking.etaMinutes,
            tracking: data.tracking,
            version: data.tracking.version,
            updatedAt: data.tracking.lastUpdated
          };
          processLiveEvent(legacyPayload);
        }
      });
    });

    // Cleanup resources
    return () => {
      stopFallbackPolling();
      if (socketRef.current) {
        socketRef.current.emit("leaveOrderRoom", orderId);
        socketRef.current.disconnect();
      }
    };
  }, [orderId, loadInitialTracking, startFallbackPolling, stopFallbackPolling, processLiveEvent]);

  // Handle instructions updates
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

  // Route splits: Completed vs Remaining path coloring
  const route = trackingInfo?.route || [];
  const progressPercent = trackingInfo?.progress || 0;
  const progressFraction = progressPercent / 100;
  
  const storeLat = order?.fulfillmentStore?.latitude || 13.0835363;
  const storeLng = order?.fulfillmentStore?.longitude || 77.6403678;
  
  const completedRoute = useMemo(() => {
    if (route.length === 0) return [];
    const index = Math.floor(progressFraction * (route.length - 1));
    return route.slice(0, index + 1);
  }, [route, progressFraction]);

  const remainingRoute = useMemo(() => {
    if (route.length === 0) return [];
    const index = Math.floor(progressFraction * (route.length - 1));
    return route.slice(index);
  }, [route, progressFraction]);

  const scooterPos = trackingInfo?.currentLocation;
  const bearing = trackingInfo?.bearing || 0;

  // Custom marker with animated transition classes
  const scooterMarkerIcon = useMemo(() => {
    return L.divIcon({
      html: `<div class="custom-scooter-marker" style="transform: rotate(${bearing}deg); transition: transform 0.4s ease-out; font-size: 32px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15)); text-align: center;">🛵</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      className: "custom-scooter-icon-node"
    });
  }, [bearing]);

  // Billing subtotal values
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

  if (loading) {
    return <div style={loadingStyle}>Loading order summary...</div>;
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <div style={errorPanelStyle}>
          <h1 style={titleStyle}>Tracking unavailable</h1>
          <p style={mutedStyle}>{error}</p>
          <button style={secondaryBtnStyle} onClick={() => navigate("/")}>Back to Shopping</button>
        </div>
      </div>
    );
  }

  // Connection Indicator Text Mapper
  const connectionLabel = () => {
    if (order?.orderStatus === "Delivered") return "✅ Delivery Complete";
    if (connectionStatus === "connected") return "🟢 Live Updates Active";
    if (connectionStatus === "reconnecting") return "🟡 Reconnecting...";
    if (connectionStatus === "polling") return "🟠 Live Sync (Polling)";
    if (connectionStatus === "online") return "🟢 Back Online";
    return "🟡 Live Updates Connecting";
  };

  return (
    <div style={pageStyle}>
      <style>{`
        @media (max-width: 900px) {
          .tracking-desktop-layout {
            display: none !important;
          }
          .tracking-mobile-layout {
            display: flex !important;
            flex-direction: column;
            gap: 20px;
          }
        }
        @media (min-width: 901px) {
          .tracking-desktop-layout {
            display: grid !important;
            grid-template-columns: 1.55fr 0.45fr 0.65fr !important;
            gap: 24px;
            max-width: 1240px;
            margin: 0 auto;
          }
          .tracking-mobile-layout {
            display: none !important;
          }
        }
        .custom-scooter-marker {
          transition: transform 0.3s ease-out;
        }
        .leaflet-marker-icon {
          transition: transform 1.8s linear, top 1.8s linear, left 1.8s linear;
        }
        @keyframes pulse-live {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .live-pulse-badge {
          animation: pulse-live 1.8s infinite ease-in-out;
        }
        @keyframes slideIn {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .toast-bubble {
          animation: slideIn 0.3s ease-out forwards;
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
            fontSize: "14px"
          }}
        >
          ✓ Delivery Instructions Updated
        </div>
      )}

      {/* Live Toast Notifications */}
      <AnimatePresence>
        {toastMessage && (
          <div
            className="toast-bubble"
            style={{
              position: "fixed",
              top: "24px",
              right: "24px",
              background: "#1e293b",
              color: "white",
              padding: "16px 24px",
              borderRadius: "16px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              zIndex: 9999999,
              fontWeight: 800,
              fontSize: 14,
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <span>🔔</span> {toastMessage}
          </div>
        )}
      </AnimatePresence>

      {/* Top Header Panel */}
      <div style={headerRowStyle}>
        <div>
          <button style={backBtnStyle} onClick={() => navigate("/profile")}>← Back to Home</button>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "12px 0 4px" }}>
            Order #{orderId.slice(-8).toUpperCase()}
          </h1>
          <p style={mutedStyle}>Buyto Express Delivery</p>
        </div>
        
        {/* Dynamic connection indicator badge */}
        <div className="live-pulse-badge" style={headerStatusBadge(order?.orderStatus, connectionStatus)}>
          {connectionLabel()}
        </div>
      </div>

      {/* DESKTOP 3-COLUMN LAYOUT */}
      <div className="tracking-desktop-layout">
        
        {/* LEFT COLUMN: Success Banner, Items, Payment, Address, Delivery Instructions */}
        <OrderDetailsLeftColumn
          order={order}
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          platformFee={platformFee}
          totalDiscount={totalDiscount}
          coinsRedeemed={coinsRedeemed}
          coinsDiscount={coinsDiscount}
          totalPaid={totalPaid}
          cleanAddress={cleanAddress}
          addressLines={addressLines}
          instructionsText={instructionsText}
          isUpdatingInstructions={isUpdatingInstructions}
          setInstructionsText={setInstructionsText}
          togglePresetInstruction={togglePresetInstruction}
          handleUpdateInstructions={handleUpdateInstructions}
        />

        {/* CENTER COLUMN: Animated vertical timeline */}
        <TimelineSection
          orderStatus={order?.orderStatus}
          statusTimestamps={order?.statusTimestamps}
        />

        {/* RIGHT COLUMN: ETA, Live Map, Rider Details, Shopping Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          <ETASection
            etaMinutesVal={trackingInfo?.etaMinutes ?? order?.estimatedArrivalMinutes}
            orderStatus={order?.orderStatus}
            estimatedDeliveryTime={order?.estimatedDeliveryTime}
          />

          {/* Live Map Box */}
          <div style={mapPanelStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>
                Live Delivery Route
              </span>
              {order?.orderStatus !== "Delivered" && (
                <button
                  onClick={() => setFollowRider(!followRider)}
                  style={{
                    border: "none",
                    background: followRider ? "#eff6ff" : "#f1f5f9",
                    color: followRider ? "#2563eb" : "#475569",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 900,
                    cursor: "pointer"
                  }}
                >
                  {followRider ? "📍 Following Rider" : "🎯 Follow Rider"}
                </button>
              )}
            </div>

            <MapContainer
              center={[storeLat, storeLng]}
              zoom={15}
              scrollWheelZoom={false}
              zoomControl={false}
              style={{ height: "350px", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[storeLat, storeLng]} icon={storeMarkerIcon} />
              {order?.deliveryLatitude && order?.deliveryLongitude && (
                <Marker position={[order.deliveryLatitude, order.deliveryLongitude]} icon={customerMarkerIcon} />
              )}
              {scooterPos && (
                <Marker position={[scooterPos.lat, scooterPos.lng]} icon={scooterMarkerIcon} />
              )}
              
              {/* Colored solid completed route vs gray/dashed remaining route */}
              {completedRoute.length > 0 && (
                <Polyline positions={completedRoute.map(pt => [pt.lat, pt.lng])} color="#10b981" weight={6} opacity={0.9} />
              )}
              {remainingRoute.length > 0 && (
                <Polyline positions={remainingRoute.map(pt => [pt.lat, pt.lng])} color="#64748b" weight={4} opacity={0.6} dashArray="5, 8" />
              )}

              <MapController route={route} scooterPos={scooterPos} followRider={followRider} />
            </MapContainer>
          </div>

          <RiderSection
            rider={rider}
            orderStatus={order?.orderStatus}
            progress={progressPercent}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => navigate("/")} style={primaryActionBtn}>
              🛒 Continue Shopping
            </button>
            <button onClick={() => navigate("/help")} style={secondaryActionBtn}>
              💬 Contact Support
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE VERTICAL STACK LAYOUT */}
      <div className="tracking-mobile-layout">
        <ETASection
          etaMinutesVal={trackingInfo?.etaMinutes ?? order?.estimatedArrivalMinutes}
          orderStatus={order?.orderStatus}
          estimatedDeliveryTime={order?.estimatedDeliveryTime}
        />

        {/* Live Map Box */}
        <div style={mapPanelStyle}>
          <MapContainer
            center={[storeLat, storeLng]}
            zoom={15}
            scrollWheelZoom={false}
            zoomControl={false}
            style={{ height: "300px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[storeLat, storeLng]} icon={storeMarkerIcon} />
            {order?.deliveryLatitude && order?.deliveryLongitude && (
              <Marker position={[order.deliveryLatitude, order.deliveryLongitude]} icon={customerMarkerIcon} />
            )}
            {scooterPos && (
              <Marker position={[scooterPos.lat, scooterPos.lng]} icon={scooterMarkerIcon} />
            )}
            {completedRoute.length > 0 && (
              <Polyline positions={completedRoute.map(pt => [pt.lat, pt.lng])} color="#10b981" weight={6} opacity={0.9} />
            )}
            {remainingRoute.length > 0 && (
              <Polyline positions={remainingRoute.map(pt => [pt.lat, pt.lng])} color="#64748b" weight={4} opacity={0.6} dashArray="5, 8" />
            )}
            <MapController route={route} scooterPos={scooterPos} followRider={followRider} />
          </MapContainer>
        </div>

        <RiderSection
          rider={rider}
          orderStatus={order?.orderStatus}
          progress={progressPercent}
        />

        <TimelineSection
          orderStatus={order?.orderStatus}
          statusTimestamps={order?.statusTimestamps}
        />

        <OrderDetailsLeftColumn
          order={order}
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          platformFee={platformFee}
          totalDiscount={totalDiscount}
          coinsRedeemed={coinsRedeemed}
          coinsDiscount={coinsDiscount}
          totalPaid={totalPaid}
          cleanAddress={cleanAddress}
          addressLines={addressLines}
          instructionsText={instructionsText}
          isUpdatingInstructions={isUpdatingInstructions}
          setInstructionsText={setInstructionsText}
          togglePresetInstruction={togglePresetInstruction}
          handleUpdateInstructions={handleUpdateInstructions}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => navigate("/")} style={primaryActionBtn}>
            🛒 Continue Shopping
          </button>
          <button onClick={() => navigate("/help")} style={secondaryActionBtn}>
            💬 Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}

// Styling definitions
const loadingStyle = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit','Inter',sans-serif", fontWeight: 900, color: "#10b981" };
const pageStyle = { minHeight: "100vh", background: "#f8fafc", padding: "32px 16px", boxSizing: "border-box", fontFamily: "'Outfit','Inter',sans-serif" };
const headerRowStyle = { maxWidth: 1240, margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" };
const backBtnStyle = { border: "1px solid #e2e8f0", background: "white", color: "#0f172a", borderRadius: 999, padding: "8px 16px", fontWeight: 800, cursor: "pointer", transition: "all 0.2s" };
const titleStyle = { fontSize: 32, lineHeight: 1.1, margin: "14px 0 6px", color: "#0f172a" };
const mutedStyle = { color: "#64748b", margin: 0, fontSize: 13, fontWeight: 700 };

const headerStatusBadge = (status, conn) => {
  const isDelivered = status === "Delivered";
  const bg = isDelivered ? "#d1fae5" : conn === "connected" || conn === "online" ? "#e6fbf1" : conn === "reconnecting" ? "#fef3c7" : "#fffbeb";
  const border = isDelivered ? "#10b981" : conn === "connected" || conn === "online" ? "#10b981" : conn === "reconnecting" ? "#f59e0b" : "#d97706";
  const color = isDelivered ? "#065f46" : conn === "connected" || conn === "online" ? "#047857" : conn === "reconnecting" ? "#b45309" : "#b45309";
  return { background: bg, border: `1.5px solid ${border}`, color, fontWeight: 900, fontSize: 13, padding: "8px 16px", borderRadius: "12px" };
};

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
const timelineRowStyle = { display: "flex", gap: 14, alignItems: "start", position: "relative", zIndex: 2 };
const timelineDotStyle = (completed, current) => ({ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: completed ? 12 : 14, fontWeight: 900, color: completed ? "white" : current ? "white" : "#94a3b8", background: completed ? "#10b981" : current ? "#2563eb" : "#ffffff", border: `2.5px solid ${completed ? "#10b981" : current ? "#2563eb" : "#e2e8f0"}` });

const driverCardStyle = { display: "flex", gap: 14, alignItems: "center", background: "#f8fafc", border: "1.5px solid #e2e8f0", padding: "16px", borderRadius: "20px" };
const driverAvatarStyle = { width: 50, height: 50, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, overflow: "hidden" };
const avatarImgStyle = { width: "100%", height: "100%", objectFit: "cover" };
const driverActionBtn = { textDecoration: "none", background: "#10b981", color: "white", padding: "8px 14px", borderRadius: "10px", fontWeight: 800, fontSize: 12, boxShadow: "0 4px 10px rgba(16, 185, 129, 0.2)" };
const driverGhostBtn = { background: "white", color: "#475569", border: "1.5px solid #cbd5e1", padding: "8px 14px", borderRadius: "10px", fontWeight: 800, fontSize: 12, cursor: "pointer" };

const riderSkeletonStyle = { display: "flex", gap: 14, alignItems: "center", background: "#f8fafc", border: "1.5px solid #f1f5f9", padding: "16px", borderRadius: "20px", opacity: 0.7 };
const avatarSkeleton = { width: 50, height: 50, borderRadius: "50%", background: "#e2e8f0" };
const skeletonLineShort = { width: "110px", height: "14px", background: "#e2e8f0", borderRadius: "4px" };
const skeletonLineLong = { width: "180px", height: "12px", background: "#e2e8f0", borderRadius: "4px" };

const primaryActionBtn = { width: "100%", padding: "14px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)", color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 14px rgba(17, 24, 39, 0.2)" };
const secondaryActionBtn = { width: "100%", padding: "14px", borderRadius: "14px", border: "1.5px solid #cbd5e1", background: "white", color: "#334155", fontSize: 14, fontWeight: 800, cursor: "pointer" };
const errorPanelStyle = { ...panelStyle, maxWidth: 520, margin: "80px auto", textAlign: "center" };
const secondaryBtnStyle = { border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "white", borderRadius: 12, padding: "11px 14px", fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)", marginTop: 14 };