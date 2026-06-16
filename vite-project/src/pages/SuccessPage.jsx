import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { io } from "socket.io-client";

// Haversine formula to compute dynamic ETA based on straight-line distance
const calculateETA = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // distance in km
  // Assuming average speed of 25 km/h + 2 mins buffers for prep
  const minutes = Math.max(1, Math.round(distance * 2.4 + 2));
  console.log("=== ETA UPDATE ===");
  console.log(`Distance: ${distance.toFixed(2)} km, Dynamic ETA: ${minutes} mins`);
  return { distance, minutes };
};
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Resolve default marker icon bug in Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom map viewer helper to keep viewport dynamically focused on both rider and user location
function ChangeMapView({ center, userPos }) {
  const map = useMap();
  useEffect(() => {
    if (center && userPos) {
      console.log("=== MAP CENTER ===");
      console.log(center);
      // Fit both coordinates in viewport dynamically
      map.fitBounds([center, userPos], { padding: [50, 50] });
    }
  }, [center, userPos, map]);
  return null;
}

const destinationIcon = new L.DivIcon({
  html: `
    <div
      style="
        width:18px;
        height:18px;
        background:#ef4444;
        border-radius:4px;
        border:3px solid white;
        box-shadow:0 2px 10px rgba(0,0,0,0.25);
      "
    ></div>
  `,
  className: "",
  iconSize: [18, 18],
});

const riderIcon = new L.DivIcon({
  html: `
    <div
      style="
        font-size:32px;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
      "
    >
      🛵
    </div>
  `,
  className: "",
  iconSize: [32, 32],
});

export default function SuccessPage() {
  const navigate = useNavigate();

  // Load checkout summary for reordering
  const [checkoutSummary, setCheckoutSummary] = useState(null);
  useEffect(() => {
    const saved = localStorage.getItem("buyto_checkout_summary");
    if (saved) {
      setCheckoutSummary(JSON.parse(saved));
    }
  }, []);

  const handleReorderList = () => {
    if (checkoutSummary && checkoutSummary.originalList) {
      const itemsToRestore = checkoutSummary.originalList.map(name => ({
        name,
        completed: false
      }));
      localStorage.setItem("shoppingListItems", JSON.stringify(itemsToRestore));
      alert("Shopping list restored! You can edit and reorder now.");
      navigate("/shopping-list");
    }
  };

  // Try reading logged-in user first, then fallback to guest checkout details
  const user = localStorage.getItem("buyto_user")
    ? JSON.parse(localStorage.getItem("buyto_user"))
    : localStorage.getItem("buyto_user")
      ? JSON.parse(localStorage.getItem("buyto_user"))
      : null;

  const latestOrderId = localStorage.getItem("latestOrderId");

  // Retrieve placed items
  const orderedItems = localStorage.getItem("latestOrder")
    ? JSON.parse(localStorage.getItem("latestOrder"))
    : [];

  const displayItems =
    orderedItems.length > 0
      ? orderedItems
      : [
        { id: 1, name: "Premium Bananas", quantity: 2, weight: "500g" },
        { id: 2, name: "Fresh Milk", quantity: 1, weight: "1L" },
        { id: 3, name: "Classic Potato Chips", quantity: 3, weight: "100g" },
      ];

  const [riderPos, setRiderPos] = useState([13.628, 74.693]);
  const [userPos, setUserPos] = useState([13.628, 74.693]);
  const [progress, setProgress] = useState(10);
  const [currentETA, setCurrentETA] = useState(30);

  useEffect(() => {
    if (!latestOrderId) return;

    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem("buyto_token");
        const res = await fetch(window.API_BASE_URL + `/api/orders/track/${latestOrderId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          const uLat = data.order?.deliveryLatitude || data.order?.user?.latitude || 13.628;
          const uLng = data.order?.deliveryLongitude || data.order?.user?.longitude || 74.693;
          setUserPos([uLat, uLng]);
          
          const rLat = data.rider?.latitude || data.rider?.currentLocation?.lat || (uLat + 0.005);
          const rLng = data.rider?.longitude || data.rider?.currentLocation?.lng || (uLng + 0.005);
          setRiderPos([rLat, rLng]);
          
          const { minutes } = calculateETA(rLat, rLng, uLat, uLng);
          setCurrentETA(data.order?.orderStatus === "Delivered" ? 0 : minutes);
          setProgress(data.progress || 10);
          
          console.log("=== CUSTOMER GPS ===");
          console.log(uLat, uLng);
          console.log("=== RIDER GPS UPDATE ===");
          console.log(rLat, rLng);
        }
      } catch (err) {
        console.error("Error fetching order on SuccessPage:", err);
      }
    };

    fetchOrderDetails();
    const interval = setInterval(fetchOrderDetails, 5000);
    return () => clearInterval(interval);
  }, [latestOrderId]);

  useEffect(() => {
    if (!latestOrderId) return;

    const socket = io(window.API_BASE_URL);

    socket.on("connect", () => {
      console.log("🔌 SuccessPage connected to Socket.IO. Joining room:", latestOrderId);
      socket.emit("joinOrderRoom", latestOrderId);
    });

    socket.on("riderLocationUpdated", (data) => {
      console.log("=== SOCKET LOCATION EVENT ===");
      console.log(data);
      setRiderPos([data.latitude, data.longitude]);
      
      const { minutes } = calculateETA(data.latitude, data.longitude, userPos[0], userPos[1]);
      setCurrentETA(minutes);
    });

    return () => {
      socket.disconnect();
    };
  }, [latestOrderId, userPos]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        padding: "40px 24px",
        fontFamily: "'Outfit', 'Inter', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* DELIVERY TIMELINE */}
        <div
          style={{
            background: "white",
            borderRadius: "28px",
            padding: "24px 32px",
            marginBottom: "24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ fontSize: "14px", fontWeight: "750", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "20px", marginTop: 0 }}>
            Delivery Timeline Status
          </h3>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              position: "relative",
              flexWrap: "nowrap",
              width: "100%",
              gap: "8px",
            }}
          >
            {/* Connecting progress line */}
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                right: "20px",
                height: "4px",
                background: "#e5e7eb",
                zIndex: 0,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: "#10b981",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            {/* Timeline Steps */}
            {[
              { label: "Confirmed", emoji: "✔", minProgress: 0 },
              { label: "Packed", emoji: "✔", minProgress: 20 },
              { label: "Picked Up", emoji: "🚴", minProgress: 40 },
              { label: "On The Way", emoji: "🟡", minProgress: 60 },
              { label: "Delivered", emoji: "⚪", minProgress: 100 },
            ].map((step, idx) => {
              const active = progress >= step.minProgress;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: "1 1 0px",
                    zIndex: 1,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: active
                        ? step.minProgress === 100 && progress >= 100
                          ? "#10b981"
                          : "#FF4D4F"
                        : "#e5e7eb",
                      color: active ? "white" : "#9ca3af",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      fontWeight: "750",
                      boxShadow: active
                        ? "0 4px 10px rgba(255, 77, 79, 0.2)"
                        : "none",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {step.emoji}
                  </div>
                  <span
                    style={{
                      marginTop: "8px",
                      fontSize: "12px",
                      fontWeight: active ? "700" : "600",
                      color: active ? "#1f2937" : "#9ca3af",
                      textAlign: "center",
                      whiteSpace: "normal",
                      maxWidth: "80px",
                      wordBreak: "break-word",
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Splash Success Header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#d1fae5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
              boxShadow: "0 10px 20px rgba(16, 185, 129, 0.12)",
            }}
          >
            <span style={{ fontSize: "32px" }}>🎉</span>
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#065f46", margin: 0 }}>
            Order Confirmed!
          </h1>
          <p style={{ color: "#4b5563", fontSize: "15px", marginTop: "6px", margin: 0 }}>
            Buyto Instant partner is delivering your fresh items in instant speed!
          </p>
        </div>

        {/* Dashboard Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "1.4fr 1fr",
            gap: "24px",
          }}
        >
          {/* LEFT COLUMN: LIVE MAP */}
          <div
            style={{
              background: "white",
              borderRadius: "28px",
              overflow: "hidden",
              height: window.innerWidth < 768 ? "350px" : "550px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
              border: "1px solid #e5e7eb",
              position: "relative",
              zIndex: 1,
            }}
          >
            <MapContainer
              center={userPos}
              zoom={14}
              style={{
                height: "100%",
                width: "100%",
              }}
            >
              <ChangeMapView center={riderPos} userPos={userPos} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              />
              {/* User Home Location Pin */}
              <Marker position={userPos} icon={destinationIcon} />

              {/* Live Moving Rider Pin */}
              <Marker position={riderPos} icon={riderIcon} />

              {/* Dynamic Connecting Route Line */}
              <Polyline positions={[riderPos, userPos]} color="#FF4D4F" weight={4} dashArray="8, 8" />
            </MapContainer>

            {/* Map Floating HUD */}
            <div
              style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                background: "rgba(255, 255, 255, 0.95)",
                padding: "8px 14px",
                borderRadius: "10px",
                zIndex: 1000,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontSize: "12px",
                fontWeight: "700",
                color: "#FF4D4F",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ animation: "pulse 1.5s infinite", color: "#ef4444" }}>●</span>
              LIVE TRACKING
            </div>
          </div>

          {/* RIGHT COLUMN: ORDER DETAILS & ETA */}
          <div
            style={{
              background: "white",
              borderRadius: "28px",
              padding: "32px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
              border: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxSizing: "border-box",
            }}
          >
            <div>
              {/* ETA Display */}
              <div
                style={{
                  background: "rgba(255, 77, 79, 0.05)",
                  borderRadius: "20px",
                  padding: "20px",
                  textAlign: "center",
                  marginBottom: "24px",
                  border: "1.5px dashed rgba(255, 77, 79, 0.3)",
                }}
              >
                <span style={{ fontSize: "28px" }}>🚴</span>
                <h2 style={{ fontSize: "22px", fontWeight: "850", color: "#FF4D4F", margin: "8px 0 0 0" }}>
                  {progress >= 100 ? "Arrived at destination!" : `Arriving in ${currentETA} mins`}
                </h2>
                <p style={{ color: "#6b7280", fontSize: "13px", margin: "4px 0 0 0", fontWeight: "600" }}>
                  Order speed: Instant delivery
                </p>
              </div>

              {/* Placed Items List */}
              <h3 style={{ fontSize: "14px", fontWeight: "750", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>
                Ordered Products
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
                {displayItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: "12px",
                      borderBottom: "1px dashed #f3f4f6",
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#1f2937" }}>
                        {item.name}
                      </h4>
                      {item.weight && (
                        <span style={{ color: "#9ca3af", fontSize: "12px" }}>{item.weight}</span>
                      )}
                    </div>
                    <span style={{ fontWeight: "700", color: "#FF4D4F", background: "rgba(255, 77, 79, 0.08)", padding: "4px 10px", borderRadius: "8px", fontSize: "13px" }}>
                      ×{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {latestOrderId && (
              <button
                onClick={() => navigate(`/track-order/${latestOrderId}`)}
                style={{
                  width: "100%",
                  height: "56px",
                  border: "none",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #22c55e, #06b6d4)",
                  color: "#03110b",
                  fontSize: "16px",
                  fontWeight: "900",
                  cursor: "pointer",
                  marginBottom: "12px",
                  transition: "all 0.2s ease",
                  boxShadow: "0 10px 20px rgba(34, 197, 94, 0.2)",
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "none")}
              >
                Track Live Order Status 🚚
              </button>
            )}

            {/* Reorder Shopping List CTA */}
            {checkoutSummary && checkoutSummary.originalList && (
              <button
                onClick={handleReorderList}
                style={{
                  width: "100%",
                  height: "56px",
                  border: "none",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "900",
                  cursor: "pointer",
                  marginBottom: "12px",
                  transition: "all 0.2s ease",
                  boxShadow: "0 10px 20px rgba(16, 185, 129, 0.2)",
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "none")}
              >
                Reorder This List 🔁
              </button>
            )}

            {/* Back Home CTA */}
            <button
              onClick={() => navigate("/")}
              style={{
                width: "100%",
                height: "56px",
                border: "none",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
                color: "white",
                fontSize: "15px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 10px 20px rgba(17, 24, 39, 0.15)",
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseOut={(e) => (e.currentTarget.style.transform = "none")}
            >
              Order More Items 🛍️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}