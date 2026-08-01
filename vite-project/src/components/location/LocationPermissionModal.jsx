import React, { useState, useEffect } from "react";
import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";

export default function LocationPermissionModal({ isOpen, onLocationResolved, onSelectManually }) {
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const checkAndRequestLocation = async () => {
    setChecking(true);
    setErrorMsg("");

    try {
      if (Capacitor.isNativePlatform()) {
        // 1. Check current permissions status
        const permStatus = await Geolocation.checkPermissions();
        console.log("[Location Modal] Current Capacitor permission status:", permStatus);

        if (permStatus.location === "granted") {
          await getAndSaveCurrentPosition();
        } else {
          // 2. Request permission if not already granted
          const requestStatus = await Geolocation.requestPermissions({ permissions: ["location"] });
          console.log("[Location Modal] Requested permission status:", requestStatus);

          if (requestStatus.location === "granted") {
            await getAndSaveCurrentPosition();
          } else {
            setErrorMsg("Location permission denied. Please enable it in system Settings.");
            setChecking(false);
          }
        }
      } else {
        // Web Platform Fallback
        if (!navigator.geolocation) {
          setErrorMsg("Geolocation is not supported by your browser.");
          setChecking(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await resolveAndSaveCoordinates(position.coords.latitude, position.coords.longitude);
          },
          (err) => {
            console.error("[Location Modal] Web geolocation failed:", err);
            setErrorMsg("Please grant location access or select your location manually.");
            setChecking(false);
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
      }
    } catch (err) {
      console.error("[Location Modal] Error checking/requesting permission:", err);
      setErrorMsg("Failed to check location permissions. Please open Settings.");
      setChecking(false);
    }
  };

  const getAndSaveCurrentPosition = async () => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      await resolveAndSaveCoordinates(position.coords.latitude, position.coords.longitude);
    } catch (err) {
      console.error("[Location Modal] Get current position failed:", err);
      // Typically error code 2 or message indicates location service/GPS is disabled
      setErrorMsg("GPS/Location services might be disabled on your device. Please turn on Location in Settings.");
      setChecking(false);
    }
  };

  const resolveAndSaveCoordinates = async (lat, lng) => {
    try {
      console.log(`[Location Modal] Resolving coordinates: lat=${lat}, lng=${lng}`);
      // Reverse geocode via OpenStreetMap Nominatim
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (!res.ok) throw new Error("Reverse geocoding request failed");
      const data = await res.json();

      const addressLine = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      console.log("[Location Modal] Geocoded Address:", addressLine);

      // Save to localStorage
      localStorage.setItem("userLocation", addressLine);
      localStorage.setItem("buyto_last_gps_coords", JSON.stringify({ latitude: lat, longitude: lng, timestamp: Date.now() }));
      
      // Notify parent
      onLocationResolved(addressLine);
    } catch (err) {
      console.error("[Location Modal] Reverse geocoding failed, falling back to coordinates:", err);
      const coordFallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      localStorage.setItem("userLocation", coordFallback);
      onLocationResolved(coordFallback);
    } finally {
      setChecking(false);
    }
  };

  const openSystemSettings = () => {
    try {
      // Attempt to open device settings using deep linking fallback
      window.open("app-settings:");
    } catch (err) {
      console.warn("[Location Modal] Failed to open app settings link:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <style>{`
        @keyframes modalPop {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .modal-card {
          animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <div className="modal-card" style={cardStyle}>
        {/* Custom Red Crossed Pin Icon */}
        <div style={iconContainerStyle}>
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
            <line x1="3" y1="3" x2="21" y2="21" stroke="#ef4444" strokeWidth="2" />
          </svg>
        </div>

        <h3 style={titleStyle}>Location permission not enabled</h3>
        <p style={descriptionStyle}>
          Please enable location permission for a better delivery experience and to show products and delivery estimates available in your area.
        </p>

        {errorMsg && <p style={errorStyle}>{errorMsg}</p>}

        <div style={btnContainerStyle}>
          <button
            onClick={checkAndRequestLocation}
            disabled={checking}
            style={primaryBtnStyle}
          >
            {checking ? "Checking Location..." : "Enable Device Location"}
          </button>
          
          <button
            onClick={onSelectManually}
            style={secondaryBtnStyle}
          >
            Select Location Manually
          </button>
        </div>

        {errorMsg && (
          <button onClick={openSystemSettings} style={settingsLinkStyle}>
            Go to App Settings
          </button>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999999,
  padding: "20px",
  fontFamily: "'Outfit', 'Inter', sans-serif"
};

const cardStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  padding: "32px",
  maxWidth: "400px",
  width: "100%",
  boxShadow: "0 12px 32px rgba(0, 0, 0, 0.15)",
  textAlign: "center",
  border: "1px solid #f1f5f9",
};

const iconContainerStyle = {
  display: "flex",
  justifyContent: "center",
  marginBottom: "20px"
};

const titleStyle = {
  fontSize: "20px",
  fontWeight: "750",
  color: "#1e293b",
  marginBottom: "12px"
};

const descriptionStyle = {
  fontSize: "14px",
  color: "#64748b",
  lineHeight: "1.6",
  marginBottom: "24px"
};

const errorStyle = {
  fontSize: "13px",
  color: "#ef4444",
  fontWeight: "600",
  marginBottom: "16px",
  backgroundColor: "#fef2f2",
  padding: "8px 12px",
  borderRadius: "8px"
};

const btnContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px"
};

const primaryBtnStyle = {
  backgroundColor: "#318616",
  color: "#ffffff",
  border: "none",
  borderRadius: "14px",
  padding: "14px",
  fontSize: "15px",
  fontWeight: "750",
  cursor: "pointer",
  transition: "background-color 0.2s"
};

const secondaryBtnStyle = {
  backgroundColor: "transparent",
  color: "#318616",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  padding: "14px",
  fontSize: "15px",
  fontWeight: "750",
  cursor: "pointer",
  transition: "background-color 0.2s"
};

const settingsLinkStyle = {
  background: "none",
  border: "none",
  color: "#3b82f6",
  fontSize: "13px",
  fontWeight: "600",
  textDecoration: "underline",
  marginTop: "16px",
  cursor: "pointer"
};
