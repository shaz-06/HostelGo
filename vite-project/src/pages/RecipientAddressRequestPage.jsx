import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { Loader2, MapPin, Search, CheckCircle, Navigation, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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

export default function RecipientAddressRequestPage() {
  const { requestId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Flow steps: "loading" | "error" | "intro" | "form" | "preview" | "success"
  const [step, setStep] = useState("loading");
  const [requesterName, setRequesterName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorStatus, setErrorStatus] = useState(""); // "expired" | "cancelled" | "completed" | ""

  // Address form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [pincode, setPincode] = useState("");
  
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]);

  // Search Address autocomplete
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // CTA button focuses
  const gpsButtonRef = useRef(null);

  // Analytics logging helper
  const logAnalyticsEvent = (eventName, extra = {}) => {
    console.log(`[Analytics] Event: ${eventName}`, {
      requestId,
      timestamp: new Date().toISOString(),
      ...extra
    });
  };

  // Load details on mount
  useEffect(() => {
    if (!token) {
      setStep("error");
      setErrorMessage("Security token is missing in the URL.");
      return;
    }

    async function fetchRequestDetails() {
      try {
        const res = await fetch(`${window.API_BASE_URL}/api/address-request/${requestId}?token=${token}`);
        const data = await res.json();
        
        if (res.ok && data.success) {
          setRequesterName(data.requesterName);
          setStep("intro");
          logAnalyticsEvent("Share Opened");
        } else {
          setStep("error");
          setErrorMessage(data.message || "Failed to load request details.");
          setErrorStatus(data.status || "");
          if (data.status) {
            logAnalyticsEvent(`Request ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`);
          }
        }
      } catch (err) {
        setStep("error");
        setErrorMessage("Unable to connect to the server. Please check your internet connection.");
      }
    }

    fetchRequestDetails();
  }, [requestId, token]);

  // Auto-focus GPS CTA on mobile
  useEffect(() => {
    if (step === "form") {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile && gpsButtonRef.current) {
        gpsButtonRef.current.focus();
      }
    }
  }, [step]);

  // Search autocomplete
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.map(item => ({
            id: item.place_id,
            addressLine: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon)
          })));
        }
      } catch (e) {
        console.error("OSM Search failed:", e);
      } finally {
        setSearchLoading(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleUseCurrentLocation = async () => {
    logAnalyticsEvent("Current Location Used");
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLatitude(lat);
        setLongitude(lng);
        setMapCenter([lat, lng]);

        // Reverse geocode to fill addressLine1
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          if (res.ok) {
            const data = await res.json();
            setAddressLine1(data.display_name || "");
            if (data.address) {
              if (data.address.city || data.address.town || data.address.village) {
                setCity(data.address.city || data.address.town || data.address.village || "Bengaluru");
              }
              if (data.address.postcode) {
                setPincode(data.address.postcode);
              }
              if (data.address.state) {
                setState(data.address.state);
              }
            }
          }
        } catch (e) {
          console.error("Reverse geocoding failed:", e);
        }
      },
      (error) => {
        alert("Unable to fetch current location. Please select it manually.");
      }
    );
  };

  const handleSelectSuggestion = (suggestion) => {
    setLatitude(suggestion.latitude);
    setLongitude(suggestion.longitude);
    setMapCenter([suggestion.latitude, suggestion.longitude]);
    setAddressLine1(suggestion.addressLine);
    setSearchQuery("");
    setSearchResults([]);
    logAnalyticsEvent("Location Selected", { method: "autocomplete" });
  };

  const handleMapClick = async (coords) => {
    setLatitude(coords[0]);
    setLongitude(coords[1]);
    setMapCenter(coords);

    // Reverse geocode
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}`);
      if (res.ok) {
        const data = await res.json();
        setAddressLine1(data.display_name || "");
      }
    } catch (e) {
      console.error("Reverse geocoding failed:", e);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!fullName || !phone || !addressLine1 || !city || !pincode) {
      alert("Please fill in all required fields.");
      return;
    }
    logAnalyticsEvent("Manual Address Entered");
    setStep("preview");
  };

  const handleConfirmSubmit = async () => {
    setStep("submitting");
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/address-request/${requestId}/submit?token=${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName,
          phone,
          addressLine1,
          addressLine2,
          landmark,
          roomNumber,
          city,
          state,
          pincode,
          latitude,
          longitude
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStep("success");
        logAnalyticsEvent("Address Submitted");
      } else {
        setStep("form");
        alert(data.message || "Failed to submit address.");
      }
    } catch (err) {
      setStep("form");
      alert("Unable to submit. Please check your internet connection.");
    }
  };

  if (step === "loading" || step === "submitting") {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#318616] mb-4" />
        <p className="text-[14px] font-black text-gray-700">
          {step === "loading" ? "Loading request..." : "Submitting your address securely..."}
        </p>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-[28px] p-6 max-w-md w-full border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-2">
            <XCircle className="w-10 h-10 stroke-[2]" />
          </div>
          <h2 className="text-[18px] font-black text-gray-800">
            {errorStatus === "expired" ? "Link Expired" : errorStatus === "cancelled" ? "Request Cancelled" : "Link Invalid"}
          </h2>
          <p className="text-[13px] font-bold text-gray-400 leading-relaxed">
            {errorStatus === "expired"
              ? "This address request has expired. Please ask your friend to send a new request."
              : errorStatus === "cancelled"
              ? "This request has been cancelled by the sender."
              : errorStatus === "completed"
              ? "This request has already been completed."
              : errorMessage}
          </p>
        </div>
      </div>
    );
  }

  if (step === "intro") {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-[28px] p-6 max-w-md w-full border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col gap-6">
          <div className="flex justify-center items-center py-2">
            <span className="text-[26px] font-black tracking-wide">
              <span className="text-[#F59E0B]">Buy</span>
              <span className="text-[#318616]">to</span>
            </span>
          </div>
          
          <div className="h-[1px] bg-gray-100 w-full" />

          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-[16px] font-black text-gray-800">
              {requesterName} is requesting your delivery address.
            </h2>
            <p className="text-[12px] font-bold text-gray-400 leading-relaxed">
              This address will only be used securely for this order and is valid for 24 hours.
            </p>
          </div>

          <button
            onClick={() => {
              setStep("form");
              logAnalyticsEvent("Recipient Continued");
            }}
            className="w-full py-4 bg-[#318616] hover:bg-[#286f12] text-white rounded-2xl text-[14px] font-black transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-[28px] p-8 max-w-md w-full border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-[#318616] mb-2">
            <CheckCircle className="w-10 h-10 stroke-[2]" />
          </div>
          <h2 className="text-[18px] font-black text-gray-800">Address Shared Successfully!</h2>
          <p className="text-[13px] font-bold text-gray-400 leading-relaxed">
            Thank you! Your delivery location has been shared securely. You may now close this browser tab.
          </p>
        </div>
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div className="min-h-screen bg-[#F6F7FB] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-[28px] p-6 max-w-md w-full border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col gap-5">
          <h2 className="text-[16px] font-black text-gray-800">Confirm Delivery Address</h2>
          
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col gap-2 text-left">
            <span className="text-[13px] font-black text-gray-800">{fullName}</span>
            <span className="text-[11px] font-bold text-gray-400">{phone}</span>
            <div className="h-[1px] bg-gray-200/50 my-1" />
            <span className="text-[12px] font-extrabold text-gray-600 leading-relaxed flex gap-1.5 items-start">
              <MapPin className="w-4 h-4 text-[#318616] flex-shrink-0 mt-0.5" />
              <span>
                {roomNumber && `${roomNumber}, `}
                {addressLine1}
                {addressLine2 && `, ${addressLine2}`}
                {landmark && ` (Near ${landmark})`}
                {`, ${city}, ${pincode}`}
              </span>
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("form")}
              className="flex-1 py-4 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-2xl text-[14px] font-black transition-all"
            >
              Edit Details
            </button>
            <button
              onClick={handleConfirmSubmit}
              className="flex-1 py-4 bg-[#318616] hover:bg-[#286f12] text-white rounded-2xl text-[14px] font-black transition-all shadow-lg shadow-green-100"
            >
              Confirm Address
            </button>
          </div>
        </div>
      </div>
    );
  }

  // "form" step
  return (
    <div className="min-h-screen bg-[#F6F7FB] py-8 px-4 flex flex-col items-center">
      <div className="bg-white rounded-[28px] p-6 max-w-md w-full border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-black text-gray-800">Share Your Delivery Address</h2>
        </div>

        {/* Address Search Autocomplete */}
        <div className="relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search address or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 focus:border-[#318616] focus:ring-1 focus:ring-[#318616] rounded-2xl text-[13px] font-bold text-gray-800 placeholder-gray-400 outline-none transition-all"
          />
          {searchLoading && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </span>
          )}

          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 text-[12.5px] font-bold text-gray-700 flex items-start gap-2 border-b border-gray-50 last:border-0"
                >
                  <MapPin className="w-4.5 h-4.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="truncate">{item.addressLine}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Use Current Location CTA */}
        <button
          ref={gpsButtonRef}
          type="button"
          onClick={handleUseCurrentLocation}
          className="w-full py-3.5 bg-green-50 hover:bg-green-100/80 border border-green-100/50 text-[#318616] rounded-2xl text-[13px] font-black transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-[#318616]/20 outline-none"
        >
          <Navigation className="w-4 h-4 fill-current" />
          <span>Use Current Location</span>
        </button>

        {/* Leaflet Map Preview */}
        <div className="h-[200px] w-full rounded-2xl overflow-hidden border border-gray-100 relative">
          <MapContainer center={mapCenter} zoom={16} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[latitude, longitude]} />
            <ChangeMapView center={mapCenter} />
            <MapEventsHandler onMapClick={handleMapClick} />
          </MapContainer>
        </div>
        <span className="text-[10px] font-extrabold text-gray-400 text-left -mt-2">
          📍 Drag or tap on the map to pin your exact location.
        </span>

        {/* Manual Input Form */}
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 focus:border-[#318616] focus:ring-1 focus:ring-[#318616] rounded-2xl text-[13px] font-bold text-gray-800 placeholder-gray-400 outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-1">Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 focus:border-[#318616] focus:ring-1 focus:ring-[#318616] rounded-2xl text-[13px] font-bold text-gray-800 placeholder-gray-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-1">Building/Street Address</label>
            <input
              type="text"
              placeholder="e.g. 1st Main Rd, Pragathi Layout"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 focus:border-[#318616] focus:ring-1 focus:ring-[#318616] rounded-2xl text-[13px] font-bold text-gray-800 placeholder-gray-400 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-1">Flat / Room No. (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Room 304"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 focus:border-[#318616] focus:ring-1 focus:ring-[#318616] rounded-2xl text-[13px] font-bold text-gray-800 placeholder-gray-400 outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-1">Landmark (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Near metro station"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 focus:border-[#318616] focus:ring-1 focus:ring-[#318616] rounded-2xl text-[13px] font-bold text-gray-800 placeholder-gray-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 focus:border-[#318616] focus:ring-1 focus:ring-[#318616] rounded-2xl text-[13px] font-bold text-gray-800 outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider pl-1">Pincode</label>
              <input
                type="text"
                placeholder="e.g. 560043"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 focus:border-[#318616] focus:ring-1 focus:ring-[#318616] rounded-2xl text-[13px] font-bold text-gray-800 placeholder-gray-400 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 mt-2 bg-[#318616] hover:bg-[#286f12] text-white rounded-2xl text-[14px] font-black transition-all shadow-lg shadow-green-100"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
