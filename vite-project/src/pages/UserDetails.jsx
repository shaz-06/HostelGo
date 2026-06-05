import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
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

function ChangeMapView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

function MapEventsHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function UserDetails() {
  const navigate = useNavigate();

  const savedUser = localStorage.getItem("buyto_user") ? JSON.parse(localStorage.getItem("buyto_user")) : null;

  const [name, setName] = useState(savedUser?.name || "");
  const [phone, setPhone] = useState(savedUser?.phone || "");
  const [location, setLocation] = useState(savedUser?.location || "");
  const [roomNumber, setRoomNumber] = useState(savedUser?.room || "");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState([13.0827, 80.2707]);
  const [markerPos, setMarkerPos] = useState([13.0827, 80.2707]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newPos = [lat, lng];

        setMapCenter(newPos);
        setMarkerPos(newPos);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );

          const data = await response.json();
          setLocation(data.display_name || `${lat}, ${lng}`);
        } catch (error) {
          alert("Unable to fetch location details");
        }

        setLoadingLocation(false);
      },
      () => {
        alert("Location permission denied");
        setLoadingLocation(false);
      }
    );
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      setLocation(data.display_name || `${lat}, ${lng}`);
    } catch (error) {
      console.error("Geocoding failed", error);
    }
  };

  const handleMapClick = (coords) => {
    setMarkerPos(coords);
    setMapCenter(coords);
    reverseGeocode(coords[0], coords[1]);
  };

  const handleMarkerDragEnd = (e) => {
    const position = e.target.getLatLng();
    const coords = [position.lat, position.lng];
    setMarkerPos(coords);
    setMapCenter(coords);
    reverseGeocode(coords[0], coords[1]);
  };

  const handleContinue = () => {
    if (!name || !phone || !location) {
      alert("Please fill all required details");
      return;
    }

    localStorage.setItem(
      "buyto_user",
      JSON.stringify({
        name,
        phone,
        location,
        roomNumber,
        coords: markerPos,
      })
    );
    localStorage.setItem("userName", name);
    localStorage.setItem("userLocation", location);
    localStorage.setItem("roomNumber", roomNumber || "");

    // Mock payment navigation or real payment page if it exists
    navigate("/payment");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
        padding: "40px 24px",
        fontFamily: "'Outfit', 'Inter', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          padding: "40px",
          borderRadius: "32px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          transition: "transform 0.3s ease",
        }}
      >
        {/* Back Button */}
        <button
          onClick={() => navigate("/cart")}
          style={{
            background: "none",
            border: "none",
            color: "#6b7280",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "24px",
            padding: 0,
            transition: "color 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.color = "#FF4D4F")}
          onMouseOut={(e) => (e.target.style.color = "#6b7280")}
        >
          ← Back to Cart
        </button>

        {/* Progress Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#FF4D4F", textTransform: "uppercase", letterSpacing: "1px" }}>
              Step 2 of 3
            </span>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#d1d5db" }}></span>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280" }}>Checkout</span>
          </div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "#111827",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            Delivery Details ⚡
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "6px", margin: 0 }}>
            Where should we deliver your instant order?
          </p>
        </div>

        {/* Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Name */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "700",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Full Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "16px 20px",
                borderRadius: "16px",
                border: "1.5px solid #e5e7eb",
                fontSize: "16px",
                fontWeight: "500",
                color: "#111827",
                outline: "none",
                transition: "all 0.2s ease",
                boxSizing: "border-box",
                background: "#f9fafb",
              }}
              onFocus={(e) => {
                e.target.style.border = "1.5px solid #FF4D4F";
                e.target.style.background = "white";
                e.target.style.boxShadow = "0 0 0 4px rgba(255, 77, 79, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1.5px solid #e5e7eb";
                e.target.style.background = "#f9fafb";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Phone */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "700",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Phone Number <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="tel"
              placeholder="Enter 10-digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: "100%",
                padding: "16px 20px",
                borderRadius: "16px",
                border: "1.5px solid #e5e7eb",
                fontSize: "16px",
                fontWeight: "500",
                color: "#111827",
                outline: "none",
                transition: "all 0.2s ease",
                boxSizing: "border-box",
                background: "#f9fafb",
              }}
              onFocus={(e) => {
                e.target.style.border = "1.5px solid #FF4D4F";
                e.target.style.background = "white";
                e.target.style.boxShadow = "0 0 0 4px rgba(255, 77, 79, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1.5px solid #e5e7eb";
                e.target.style.background = "#f9fafb";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Detect Location Button */}
          <button
            type="button"
            onClick={detectLocation}
            disabled={loadingLocation}
            style={{
              width: "100%",
              marginBottom: "12px",
              background: "rgba(255, 77, 79, 0.04)",
              color: "#FF4D4F",
              border: "1.5px dashed rgba(255, 77, 79, 0.4)",
              padding: "14px",
              borderRadius: "16px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              boxSizing: "border-box",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(255, 77, 79, 0.08)";
              e.currentTarget.style.borderColor = "#FF4D4F";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(255, 77, 79, 0.04)";
              e.currentTarget.style.borderColor = "rgba(255, 77, 79, 0.4)";
            }}
          >
            {loadingLocation ? "⏳ Detecting..." : "📍 Detect My Location"}
          </button>

          {/* Interactive Map Area */}
          <div
            style={{
              height: "280px",
              borderRadius: "20px",
              overflow: "hidden",
              marginBottom: "16px",
              border: "1.5px solid #e5e7eb",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
              position: "relative",
              zIndex: 1,
            }}
          >
            <MapContainer
              center={mapCenter}
              zoom={15}
              style={{
                height: "100%",
                width: "100%",
              }}
            >
              <ChangeMapView center={mapCenter} />
              <MapEventsHandler onMapClick={handleMapClick} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              />
              <Marker
                position={markerPos}
                draggable={true}
                eventHandlers={{
                  dragend: handleMarkerDragEnd,
                }}
              />
            </MapContainer>
          </div>

          {/* Delivery Address / Landmark */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "700",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Delivery Address / Landmark <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Apartment, Flat Number, Central Landmark"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                width: "100%",
                padding: "16px 20px",
                borderRadius: "16px",
                border: "1.5px solid #e5e7eb",
                fontSize: "16px",
                fontWeight: "500",
                color: "#111827",
                outline: "none",
                transition: "all 0.2s ease",
                boxSizing: "border-box",
                background: "#f9fafb",
              }}
              onFocus={(e) => {
                e.target.style.border = "1.5px solid #FF4D4F";
                e.target.style.background = "white";
                e.target.style.boxShadow = "0 0 0 4px rgba(255, 77, 79, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1.5px solid #e5e7eb";
                e.target.style.background = "#f9fafb";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Floor / Flat (Optional) */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "700",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Floor / Flat <span style={{ color: "#6b7280", fontWeight: "500" }}>(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Floor 2, Flat 204"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              style={{
                width: "100%",
                padding: "16px 20px",
                borderRadius: "16px",
                border: "1.5px solid #e5e7eb",
                fontSize: "16px",
                fontWeight: "500",
                color: "#111827",
                outline: "none",
                transition: "all 0.2s ease",
                boxSizing: "border-box",
                background: "#f9fafb",
              }}
              onFocus={(e) => {
                e.target.style.border = "1.5px solid #FF4D4F";
                e.target.style.background = "white";
                e.target.style.boxShadow = "0 0 0 4px rgba(255, 77, 79, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1.5px solid #e5e7eb";
                e.target.style.background = "#f9fafb";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #FF4D4F 0%, #E03E40 100%)",
            color: "white",
            border: "none",
            padding: "18px",
            borderRadius: "18px",
            fontSize: "18px",
            fontWeight: "700",
            cursor: "pointer",
            marginTop: "32px",
            boxShadow: "0 10px 20px rgba(255, 77, 79, 0.2)",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 12px 24px rgba(255, 77, 79, 0.3)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 10px 20px rgba(255, 77, 79, 0.2)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translateY(1px)";
          }}
        >
          Continue to Payment 💳
        </button>
      </div>
    </div>
  );
}