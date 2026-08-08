import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { requestLocationPermission, getCurrentLocation } from "../../../services/location/locationService";

// Resolve default marker icon bug in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function ChangeMapView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 16);
    }
  }, [center, map]);
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

const ADDRESS_PRESETS = [
  { label: "Hostel", icon: "🏠" },
  { label: "PG", icon: "🏢" },
  { label: "College", icon: "🎓" },
  { label: "Home", icon: "🏡" },
  { label: "Office", icon: "💼" },
  { label: "Other", icon: "📍" }
];

export function AddAddressForm({ initialAddress, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: initialAddress?.id || initialAddress?._id || "",
    label: initialAddress?.label || initialAddress?.addressType || "Hostel",
    customLabel: initialAddress?.customLabel || "",
    fullName: initialAddress?.fullName || "",
    phone: initialAddress?.phone || "",
    addressLine: initialAddress?.addressLine || "",
    landmark: initialAddress?.landmark || "",
    roomNumber: initialAddress?.roomNumber || "",
    city: initialAddress?.city || "Bengaluru",
    pincode: initialAddress?.pincode || "",
    notes: initialAddress?.notes || "",
    isDefault: !!initialAddress?.isDefault,
    latitude: initialAddress?.latitude || (initialAddress?.coords?.latitude) || 12.9716,
    longitude: initialAddress?.longitude || (initialAddress?.coords?.longitude) || 77.5946
  });

  const [mapCenter, setMapCenter] = useState([form.latitude, form.longitude]);
  const [detectStatus, setDetectStatus] = useState("idle"); // "idle" | "detecting" | "success" | "error"
  const [localError, setLocalError] = useState("");

  const handleUseCurrentLocation = async () => {
    setDetectStatus("detecting");
    setLocalError("");

    try {
      // 1. Request location permission
      const permission = await requestLocationPermission();
      if (permission === "denied") {
        setLocalError("Location permission is required to detect your current address.");
        setDetectStatus("error");
        return;
      }

      // 2. Fetch current coordinates
      const coords = await getCurrentLocation(10000);
      const { latitude, longitude } = coords;

      // 3. Move map and marker
      setMapCenter([latitude, longitude]);
      
      // 4. Reverse geocode
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      if (!res.ok) throw new Error("Reverse geocoding failed");
      const data = await res.json();

      // Extract details
      const address = data.address || {};
      const detectedCity = address.city || address.town || address.village || "";
      const detectedPincode = address.postcode || "";
      const detectedLandmark = address.suburb || address.neighbourhood || address.road || "";
      const detectedAddressLine = data.display_name || "";

      // 5. Update form state
      setForm(prev => ({
        ...prev,
        latitude,
        longitude,
        addressLine: detectedAddressLine || prev.addressLine,
        city: detectedCity || prev.city,
        pincode: detectedPincode || prev.pincode,
        landmark: detectedLandmark || prev.landmark
      }));

      setDetectStatus("success");
      setTimeout(() => setDetectStatus("idle"), 3000);
    } catch (err) {
      console.error("[AddAddressForm] Geolocation / geocoding failed:", err);
      setLocalError("Unable to detect your location. Please try again.");
      setDetectStatus("error");
    }
  };

  // Sync coords from map center
  const handleMapClick = (coords) => {
    setMapCenter(coords);
    setForm(prev => ({
      ...prev,
      latitude: coords[0],
      longitude: coords[1]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      {/* Map Container */}
      <div style={{ height: "180px", width: "100%", borderRadius: "16px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
        <MapContainer center={mapCenter} zoom={16} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={mapCenter} />
          <ChangeMapView center={mapCenter} />
          <MapEventsHandler onMapClick={handleMapClick} />
        </MapContainer>
      </div>

      <div style={{ fontSize: "11px", color: "#64748b", textAlign: "left", fontWeight: "600" }}>
        📍 Click on the map to pin exact delivery location coordinates
      </div>

      {/* Use Current Location CTA */}
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={detectStatus === "detecting"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          width: "100%",
          padding: "12px 16px",
          borderRadius: "12px",
          border: "1.5px solid #318616",
          backgroundColor: detectStatus === "detecting" ? "#f0fdf4" : "#318616",
          color: detectStatus === "detecting" ? "#318616" : "#ffffff",
          fontWeight: "800",
          fontSize: "14px",
          cursor: detectStatus === "detecting" ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 4px 12px rgba(49, 134, 22, 0.15)"
        }}
      >
        {detectStatus === "idle" && "📍 Use current location"}
        {detectStatus === "detecting" && "⟳ Locating you..."}
        {detectStatus === "success" && "✓ Location detected"}
        {detectStatus === "error" && "📍 Use current location"}
      </button>

      {/* Friendly Error notice */}
      {localError && (
        <div style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fee2e2",
          borderRadius: "12px",
          padding: "12px 16px",
          color: "#991b1b",
          fontSize: "13px",
          fontWeight: "600",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          gap: "4px"
        }}>
          <div>⚠️ {localError}</div>
          <div style={{ color: "#b91c1c", fontSize: "12px", fontWeight: "750" }}>
            👉 {localError.includes("permission") ? "Enter address manually" : "We couldn't find the address for this location. You can enter it manually."}
          </div>
        </div>
      )}

      {/* Preset Buttons */}
      <div style={{ textAlign: "left" }}>
        <label style={{ fontSize: "13px", fontWeight: "800", color: "#475569", display: "block", marginBottom: "8px" }}>
          Save Address As
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {ADDRESS_PRESETS.map((preset) => {
            const isSelected = form.label === preset.label;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, label: preset.label }))}
                style={{
                  padding: "8px 14px",
                  borderRadius: "20px",
                  border: isSelected ? "1.5px solid #318616" : "1.5px solid #e2e8f0",
                  background: isSelected ? "#f0fdf4" : "#ffffff",
                  color: isSelected ? "#318616" : "#64748b",
                  fontWeight: "750",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <span>{preset.icon}</span> {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {form.label === "Other" && (
        <input
          type="text"
          placeholder="Custom Label Name (e.g. Friend's PG)"
          value={form.customLabel}
          onChange={(e) => setForm({ ...form, customLabel: e.target.value })}
          required
          style={inputStyle}
        />
      )}

      {/* Details Inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <input
          type="text"
          placeholder="Full Name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
          style={inputStyle}
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
          style={inputStyle}
        />
      </div>

      <input
        type="text"
        placeholder="Full Address / Building / Campus"
        value={form.addressLine}
        onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
        required
        style={inputStyle}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <input
          type="text"
          placeholder="Room / Flat No."
          value={form.roomNumber}
          onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Landmark (Optional)"
          value={form.landmark}
          onChange={(e) => setForm({ ...form, landmark: e.target.value })}
          style={inputStyle}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <input
          type="text"
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Pincode"
          value={form.pincode}
          onChange={(e) => setForm({ ...form, pincode: e.target.value })}
          required
          style={inputStyle}
        />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#475569", fontSize: "13px", fontWeight: "750", textAlign: "left" }}>
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          style={{ cursor: "pointer" }}
        />
        Set as Default Address
      </label>

      <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "14px",
            border: "1.5px solid #e2e8f0",
            background: "transparent",
            color: "#64748b",
            fontWeight: "750",
            cursor: "pointer"
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "14px",
            border: "none",
            background: "#318616",
            color: "#ffffff",
            fontWeight: "750",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(49, 134, 22, 0.2)"
          }}
        >
          Save Address
        </button>
      </div>
    </form>
  );
}

const inputStyle = {
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1.5px solid #cbd5e1",
  outline: "none",
  fontSize: "13px",
  fontFamily: "'Outfit', 'Inter', sans-serif",
  fontWeight: "600",
  color: "#0f172a"
};
