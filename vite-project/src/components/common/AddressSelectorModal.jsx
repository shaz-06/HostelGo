import React, { useState, useEffect, useRef, useContext } from "react";
import { createPortal } from "react-dom";
import { AuthContext } from "../../context/AuthContext";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
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

// Student-focused Address type presets with icons
const ADDRESS_PRESETS = [
  { label: "Hostel", icon: "🏠" },
  { label: "PG", icon: "🏢" },
  { label: "College", icon: "🎓" },
  { label: "Home", icon: "🏡" },
  { label: "Office", icon: "💼" },
  { label: "Other", icon: "📍" }
];

export default function AddressSelectorModal({ onClose, onSelectAddress, isLoggedIn }) {
  const { openLogin } = useContext(AuthContext);
  const [addresses, setAddresses] = useState([]);
  const [recentAddresses, setRecentAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [closing, setClosing] = useState(false);

  // Form state
  const [addressForm, setAddressForm] = useState({
    id: "",
    label: "Hostel",
    customLabel: "",
    fullName: "",
    phone: "",
    addressLine: "",
    landmark: "",
    roomNumber: "",
    city: "",
    pincode: "",
    notes: "",
    isDefault: false,
    latitude: null,
    longitude: null
  });

  const [mapCenter, setMapCenter] = useState([13.3409, 74.7978]);
  const [markerPos, setMarkerPos] = useState([13.3409, 74.7978]);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsProgressText, setGpsProgressText] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  
  const [showGpsOverlay, setShowGpsOverlay] = useState(false);
  const [gpsOverlayFadeOut, setGpsOverlayFadeOut] = useState(false);
  const [gpsSuccessState, setGpsSuccessState] = useState(false);
  const gpsTimersRef = useRef([]);
  
  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);
  const geocodeCache = useRef({});

  const [isModalAddressServiceable, setIsModalAddressServiceable] = useState(true);
  const [serviceabilityMessage, setServiceabilityMessage] = useState("");
  const [showLocationConfirm, setShowLocationConfirm] = useState(false);
  const [detectedAddressText, setDetectedAddressText] = useState("");
  const debounceGeocodeTimeout = useRef(null);

  // Swipe/Drag gesture tracking
  const [startY, setStartY] = useState(null);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef(null);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [mounted, setMounted] = useState(false);

  const showToast = (msg) => {
    if (!isMounted.current) return;
    setToastMsg(msg);
    setTimeout(() => {
      if (isMounted.current) setToastMsg("");
    }, 4500);
  };

  useEffect(() => {
    isMounted.current = true;
    setMounted(true);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => {
      isMounted.current = false;
      window.removeEventListener("resize", handleResize);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      gpsTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  // Disable body scroll when modal is active with iOS/Safari support
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);

  // Disable body scroll when GPS overlay is active
  useEffect(() => {
    if (showGpsOverlay) {
      document.body.style.overflow = "hidden";
    }
  }, [showGpsOverlay]);

  const token = localStorage.getItem("buyto_token");

  // Load addresses, recents, and handle auto-sync
  useEffect(() => {
    // 1. Fetch / Sync Addresses
    if (isLoggedIn && token) {
      // Sync guest addresses from localStorage to backend
      const guestAddresses = localStorage.getItem("buyto_guest_addresses");
      if (guestAddresses) {
        try {
          const parsed = JSON.parse(guestAddresses);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Push guest addresses to backend in sequence
            Promise.all(parsed.map(addr => {
              const payload = {
                label: addr.label,
                fullName: addr.fullName,
                phone: addr.phone,
                addressLine: addr.addressLine,
                landmark: addr.landmark || "",
                roomNumber: addr.roomNumber || "",
                latitude: addr.latitude,
                longitude: addr.longitude,
                isDefault: addr.isDefault,
                serviceable: addr.serviceable
              };
              return fetch(window.API_BASE_URL + "/api/addresses", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
              });
            })).then(() => {
              localStorage.removeItem("buyto_guest_addresses");
              fetchAddresses();
            }).catch(err => console.error("Error syncing guest addresses:", err));
          } else {
            fetchAddresses();
          }
        } catch (e) {
          fetchAddresses();
        }
      } else {
        fetchAddresses();
      }
    } else {
      // Guest addresses from localStorage
      const cached = localStorage.getItem("buyto_guest_addresses");
      setAddresses(cached ? JSON.parse(cached) : []);
    }

    // 2. Load Recent Addresses
    const recents = localStorage.getItem("buyto_recent_addresses");
    setRecentAddresses(recents ? JSON.parse(recents) : []);
  }, [isLoggedIn]);

  // Fetch addresses from backend
  const fetchAddresses = async () => {
    if (!isLoggedIn || !token) return;
    setLoading(true);
    try {
      const res = await fetch(window.API_BASE_URL + "/api/addresses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.addresses) {
          setAddresses(data.addresses);
        }
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
    } finally {
      setLoading(false);
    }
  };

  // Check serviceability
  const checkModalServiceability = async (lat, lng) => {
    try {
      const res = await fetch(window.API_BASE_URL + "/api/auth/verify-serviceability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: Number(lat), longitude: Number(lng) })
      });
      if (res.ok) {
        const data = await res.json();
        setIsModalAddressServiceable(data.serviceable);
        setServiceabilityMessage(
          data.serviceable
            ? "🟢 Delivery Available. Estimated delivery: 10–30 mins"
            : "🔴 Currently unavailable in your area. You can still save this address."
        );
        return data.serviceable;
      }
    } catch (err) {
      console.error("Serviceability check failed:", err);
    }
    setIsModalAddressServiceable(false);
    setServiceabilityMessage("🔴 Currently unavailable in your area. You can still save this address.");
    return false;
  };

  // Reverse geocoding
  const handleMapClickOrMarkerDrag = (lat, lng) => {
    const newCoords = [Number(lat), Number(lng)];
    setMarkerPos(newCoords);
    setAddressForm(prev => ({ ...prev, latitude: lat, longitude: lng }));

    if (debounceGeocodeTimeout.current) {
      clearTimeout(debounceGeocodeTimeout.current);
    }

    setShowLocationConfirm(false);
    setServiceabilityMessage("Checking delivery serviceability...");

    debounceGeocodeTimeout.current = setTimeout(async () => {
      await checkModalServiceability(lat, lng);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        if (response.ok) {
          const data = await response.json();
          const addrText = data.display_name || `${lat}, ${lng}`;
          setDetectedAddressText(addrText);
          setAddressForm(prev => ({ ...prev, addressLine: addrText }));
          setShowLocationConfirm(true);
        }
      } catch (error) {
        console.error("Reverse geocoding failed:", error);
      }
    }, 650);
  };

  // 1. Request Browser Location helper
  const requestBrowserLocation = () => {
    return new Promise((resolve, reject) => {
      // Check cached coordinates (freshness window: 5 mins)
      const cachedData = localStorage.getItem("buyto_last_gps_coords");
      if (cachedData) {
        try {
          const { latitude: cachedLat, longitude: cachedLng, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            console.log("[GPS] Using cached coordinates from less than 5 minutes ago:", cachedLat, cachedLng);
            resolve({ latitude: cachedLat, longitude: cachedLng });
            return;
          }
        } catch (e) {
          console.error("Error reading cached GPS coords:", e);
        }
      }

      if (!navigator.geolocation) {
        const err = new Error("Geolocation not supported");
        err.code = 0;
        reject(err);
        return;
      }

      if (navigator.permissions && typeof navigator.permissions.query === "function") {
        navigator.permissions.query({ name: "geolocation" }).then((status) => {
          console.log("[GPS] Permission state detected:", status.state);
        }).catch((err) => {
          console.log("[GPS] Permissions query not fully supported or failed:", err);
        });
      }

      const startTime = Date.now();
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const duration = Date.now() - startTime;
          console.log(`[GPS] Coordinates acquired in ${duration}ms`);
          if (duration > 2000) {
            console.warn(`[GPS WARNING] GPS acquisition took ${duration}ms, exceeding 2s threshold.`);
          }
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          // Cache coordinates
          try {
            localStorage.setItem("buyto_last_gps_coords", JSON.stringify({
              latitude: lat,
              longitude: lng,
              timestamp: Date.now()
            }));
          } catch (e) {
            console.error("Failed to write to localStorage:", e);
          }

          resolve({ latitude: lat, longitude: lng });
        },
        (err) => {
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  // 2. Reverse Geocode helper
  const reverseGeocode = async (lat, lng) => {
    // Check in-memory cache first (rounded to 4 decimal places, ~11m accuracy)
    const cacheKey = `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;
    if (geocodeCache.current && geocodeCache.current[cacheKey]) {
      console.log("[Geocode] Cache hit for coordinates:", cacheKey);
      return geocodeCache.current[cacheKey];
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const startTime = Date.now();
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      abortControllerRef.current = null;

      const duration = Date.now() - startTime;
      console.log(`[Geocode] Completed in ${duration}ms`);
      if (duration > 2000) {
        console.warn(`[Geocode WARNING] Geocoding took ${duration}ms, exceeding 2s threshold.`);
      }

      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          console.warn(`[Geocode] Server returned status ${response.status}, using fallback.`);
          return "Current Location (Coordinates Available)";
        }
        throw new Error(`Reverse geocoding HTTP error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.display_name || `${lat}, ${lng}`;
      
      // Store in cache
      if (geocodeCache.current) {
        geocodeCache.current[cacheKey] = result;
      }
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      abortControllerRef.current = null;
      console.error("[GEOCODE ERROR] Failed or timed out:", error);
      return "Current Location (Coordinates Available)";
    }
  };

  // 3. Save Current Location helper
  const saveCurrentLocation = async (lat, lng, addressLine, serviceableStatus) => {
    const startTime = Date.now();
    
    // Validate coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      const err = new Error("Invalid GPS coordinates received.");
      console.error("[SAVE ERROR] Invalid coords:", lat, lng);
      throw err;
    }

    const labelText = "GPS Location";
    const nameText = user?.name || "Guest User";
    const phoneText = user?.phone || "0000000000";

    let savedAddrObj = null;

    if (isLoggedIn && token) {
      const payload = {
        label: labelText,
        addressType: labelText,
        fullName: nameText,
        phone: phoneText,
        addressLine: addressLine,
        landmark: "",
        roomNumber: "",
        city: "",
        pincode: "",
        notes: "",
        latitude: lat,
        longitude: lng,
        isDefault: true,
        serviceable: serviceableStatus,
        lastCheckedAt: new Date()
      };

      const res = await fetch(`${window.API_BASE_URL}/api/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const duration = Date.now() - startTime;
      console.log(`[Save] Address saved in ${duration}ms`);
      if (duration > 2000) {
        console.warn(`[Save WARNING] Saving to backend took ${duration}ms, exceeding 2s threshold.`);
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const err = new Error(errorData.message || "Failed to save address to backend");
        console.error("[SAVE ERROR] Backend call rejected:", err);
        throw err;
      }

      const data = await res.json();
      if (!data.success || !data.address) {
        const err = new Error(data.message || "Failed to save address to backend");
        console.error("[SAVE ERROR] Response marked success=false:", err);
        throw err;
      }
      savedAddrObj = data.address;
    } else {
      // Guest local storage
      const newAddress = {
        _id: "guest_" + Date.now(),
        label: labelText,
        fullName: nameText,
        phone: phoneText,
        addressLine: addressLine,
        landmark: "",
        roomNumber: "",
        city: "",
        pincode: "",
        notes: "",
        latitude: lat,
        longitude: lng,
        isDefault: true,
        serviceable: serviceableStatus
      };

      let updatedAddresses = [...addresses];
      updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
      updatedAddresses.push(newAddress);

      localStorage.setItem("buyto_guest_addresses", JSON.stringify(updatedAddresses));
      setAddresses(updatedAddresses);
      savedAddrObj = newAddress;
      
      const duration = Date.now() - startTime;
      console.log(`[Save] Guest address saved to localStorage in ${duration}ms`);
    }

    return savedAddrObj;
  };

  // 4. Select Address helper
  const selectAddress = (addr) => {
    console.log("[Address] Selected successfully");
    let updatedRecents = [addr, ...recentAddresses.filter(r => r._id !== addr._id && r.addressLine !== addr.addressLine)];
    updatedRecents = updatedRecents.slice(0, 5);
    localStorage.setItem("buyto_recent_addresses", JSON.stringify(updatedRecents));

    onSelectAddress(addr);
    handleClose();
    refreshAddressContext();
  };

  // 5. Refresh Address Context helper
  const refreshAddressContext = () => {
    fetchAddresses();
  };

  // GPS geolocation main function
  const detectGpsLocation = async (autoSelectAndClose = true) => {
    if (gpsDetecting) return;
    
    console.log("Location button clicked");
    setGpsDetecting(true);
    setGpsProgressText("📍 Detecting location...");
    
    // Clear any previous GPS timers
    gpsTimersRef.current.forEach(clearTimeout);
    gpsTimersRef.current = [];
    
    setShowGpsOverlay(true);
    setGpsOverlayFadeOut(false);
    setGpsSuccessState(false);

    const flowStartTime = Date.now();

    try {
      const position = await requestBrowserLocation();
      if (!isMounted.current) return;

      const lat = position.latitude;
      const lng = position.longitude;

      setGpsProgressText("🗺️ Finding address...");
      // Execute geocode and serviceability concurrently in parallel
      const [addressLine, serviceableStatus] = await Promise.all([
        reverseGeocode(lat, lng),
        checkModalServiceability(lat, lng)
      ]);
      if (!isMounted.current) return;

      // Calculate elapsed time
      const elapsed = Date.now() - flowStartTime;
      const remainingTime = Math.max(0, 1000 - elapsed);

      const successTimer = setTimeout(async () => {
        if (!isMounted.current) return;
        setGpsSuccessState(true);

        const fadeOutTimer = setTimeout(() => {
          if (!isMounted.current) return;
          setGpsOverlayFadeOut(true);

          const finalTimer = setTimeout(async () => {
            if (!isMounted.current) return;
            
            // Post-fade state/map updates to prevent visual jumps
            setMapCenter([lat, lng]);
            setMarkerPos([lat, lng]);
            setAddressForm(prev => ({ ...prev, latitude: lat, longitude: lng, addressLine: addressLine }));
            setDetectedAddressText(addressLine);

            if (autoSelectAndClose) {
              setGpsProgressText("💾 Saving address...");
              
              const matchedAddr = addresses.find(addr => {
                if (addr.addressLine === addressLine) return true;
                if (addr.latitude !== undefined && addr.longitude !== undefined && addr.latitude !== null && addr.longitude !== null) {
                  const latDiff = Math.abs(Number(addr.latitude) - Number(lat));
                  const lngDiff = Math.abs(Number(addr.longitude) - Number(lng));
                  if (latDiff < 0.0005 && lngDiff < 0.0005) return true;
                }
                return false;
              });

              if (matchedAddr) {
                console.log("[GPS] Match found with existing address:", matchedAddr._id, "- Reusing instead of duplicating.");
                showToast("📍 Delivery location updated successfully.");
                const selectTimer = setTimeout(() => {
                  if (isMounted.current) selectAddress(matchedAddr);
                }, 800);
                gpsTimersRef.current.push(selectTimer);
              } else {
                try {
                  const savedAddr = await saveCurrentLocation(lat, lng, addressLine, serviceableStatus);
                  if (!isMounted.current) return;
                  showToast("📍 Delivery location updated successfully.");
                  const selectTimer = setTimeout(() => {
                    if (isMounted.current) selectAddress(savedAddr);
                  }, 800);
                  gpsTimersRef.current.push(selectTimer);
                } catch (saveErr) {
                  if (isMounted.current) {
                    showToast("❌ Unable to save your location.");
                  }
                  throw saveErr;
                }
              }
            } else {
              setShowLocationConfirm(false);
              setShowLocationConfirm(true);
            }

            setShowGpsOverlay(false);
            setGpsDetecting(false);
            setGpsProgressText("");
          }, 220);
          gpsTimersRef.current.push(finalTimer);
        }, 150);
        gpsTimersRef.current.push(fadeOutTimer);
      }, remainingTime);
      gpsTimersRef.current.push(successTimer);

      const totalDuration = Date.now() - flowStartTime;
      console.log(`[Total] Completed location flow in ${totalDuration}ms`);
    } catch (err) {
      console.error("Location flow failed:", err);
      if (!isMounted.current) return;

      const elapsed = Date.now() - flowStartTime;
      const remainingTime = Math.max(0, 1000 - elapsed);

      const errorTimer = setTimeout(() => {
        if (!isMounted.current) return;
        setGpsOverlayFadeOut(true);

        const finalTimer = setTimeout(() => {
          if (!isMounted.current) return;
          setShowGpsOverlay(false);
          setGpsDetecting(false);
          setGpsProgressText("");

          // Execute existing error toast logic
          if (err.code !== undefined) {
            switch (err.code) {
              case 1:
                console.error("[GPS ERROR] Permission denied");
                showToast("📍 Location permission denied.");
                break;
              case 2:
                console.error("[GPS ERROR] Position unavailable");
                showToast("📡 Unable to determine your location.");
                break;
              case 3:
                console.error("[GPS ERROR] Timeout");
                showToast("⏱️ Location request timed out. Please try again.");
                break;
              default:
                console.error("[GPS ERROR] Unknown error code:", err.code);
                showToast("Please try again.");
                break;
            }
          } else if (err.message && err.message.includes("coordinates")) {
            showToast("Invalid GPS coordinates received.");
          } else if (err.message && err.message.includes("save")) {
            // Handled inside try block
          } else {
            if (!navigator.onLine) {
              console.error("[GPS ERROR] Network offline");
              showToast("🌐 Please check your internet connection.");
            } else {
              showToast("Please try again.");
            }
          }

          const selectedAddressId = localStorage.getItem("buyto_selected_address_id");
          if (selectedAddressId) {
            const prevSelected = addresses.find(a => a._id === selectedAddressId);
            if (prevSelected) {
              const prevSelectTimer = setTimeout(() => {
                if (isMounted.current) {
                  showToast("Using your previously selected delivery address.");
                }
              }, 2000);
              gpsTimersRef.current.push(prevSelectTimer);
            }
          }
        }, 220);
        gpsTimersRef.current.push(finalTimer);
      }, remainingTime);
      gpsTimersRef.current.push(errorTimer);
    } finally {
      if (isMounted.current) {
        if (abortControllerRef.current) {
          abortControllerRef.current = null;
        }
      }
    }
  };

  // Smooth close wrapper
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 280); // Wait for transition
  };

  // Touch handlers for swipe down to close
  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (startY === null) return;
    const diff = e.touches[0].clientY - startY;
    if (diff > 0) {
      setCurrentY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (currentY > 120) {
      handleClose();
    } else {
      setCurrentY(0);
    }
    setStartY(null);
  };

  // Touch handlers for swipe down to close

  // Form submission: save address
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      openLogin();
      return;
    }
    if (!addressForm.latitude || !addressForm.longitude) {
      alert("Please select and confirm a location on the map first.");
      return;
    }

    const finalLabel = addressForm.label === "Other"
      ? (addressForm.customLabel || "Other")
      : addressForm.label;

    const isEdit = !!addressForm.id;

    if (isLoggedIn && token) {
      const url = isEdit
        ? `${window.API_BASE_URL}/api/addresses/${addressForm.id}`
        : `${window.API_BASE_URL}/api/addresses`;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...addressForm,
        label: finalLabel,
        addressType: finalLabel,
        serviceable: isModalAddressServiceable,
        lastCheckedAt: new Date()
      };

      try {
        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.address) {
            setShowForm(false);
            fetchAddresses();
            selectAddress(data.address);
          }
        } else {
          const data = await res.json();
          alert(data.message || "Failed to save address");
        }
      } catch (err) {
        console.error("Address save error:", err);
      }
    } else {
      // Guest user local storage
      const newAddress = {
        _id: addressForm.id || "guest_" + Date.now(),
        label: finalLabel,
        fullName: addressForm.fullName,
        phone: addressForm.phone,
        addressLine: addressForm.addressLine,
        landmark: addressForm.landmark,
        roomNumber: addressForm.roomNumber,
        city: addressForm.city,
        pincode: addressForm.pincode,
        notes: addressForm.notes,
        latitude: addressForm.latitude,
        longitude: addressForm.longitude,
        isDefault: !!addressForm.isDefault,
        serviceable: isModalAddressServiceable
      };

      let updatedAddresses = [...addresses];
      if (isEdit) {
        updatedAddresses = updatedAddresses.map(a => a._id === addressForm.id ? newAddress : a);
      } else {
        if (newAddress.isDefault) {
          updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
        }
        updatedAddresses.push(newAddress);
      }

      localStorage.setItem("buyto_guest_addresses", JSON.stringify(updatedAddresses));
      setAddresses(updatedAddresses);
      setShowForm(false);
      selectAddress(newAddress);
    }
  };

  // Delete address
  const handleDeleteAddress = async (addrId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    if (isLoggedIn && token) {
      try {
        const res = await fetch(`${window.API_BASE_URL}/api/addresses/${addrId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          fetchAddresses();
        }
      } catch (err) {
        console.error("Error deleting address:", err);
      }
    } else {
      const updated = addresses.filter(a => a._id !== addrId);
      localStorage.setItem("buyto_guest_addresses", JSON.stringify(updated));
      setAddresses(updated);
    }
  };

  // Toggle Default address
  const handleSetDefault = async (addr, e) => {
    e.stopPropagation();
    if (isLoggedIn && token) {
      try {
        const res = await fetch(`${window.API_BASE_URL}/api/addresses/${addr._id}/default`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          fetchAddresses();
        }
      } catch (err) {
        console.error("Error setting default address:", err);
      }
    } else {
      const updated = addresses.map(a => ({
        ...a,
        isDefault: a._id === addr._id
      }));
      localStorage.setItem("buyto_guest_addresses", JSON.stringify(updated));
      setAddresses(updated);
    }
  };

  return createPortal(
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: (closing || !mounted) ? "rgba(15, 23, 42, 0)" : "rgba(15, 23, 42, 0.6)",
          zIndex: 9998,
          transition: "background 0.3s ease-in-out",
          fontFamily: "'Outfit', 'Inter', sans-serif"
        }}
        onClick={handleClose}
      />
      {toastMsg && (
        <div style={{
          position: "fixed",
          top: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(15, 23, 42, 0.9)",
          color: "white",
          padding: "12px 24px",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
          fontSize: "14px",
          fontWeight: "700",
          zIndex: 100000,
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }} onClick={(e) => e.stopPropagation()}>
          {toastMsg}
        </div>
      )}
      {/* Liquid Glass Bottom Sheet */}
      <div
        ref={sheetRef}
        style={{
          width: "100%",
          maxWidth: windowWidth <= 768 ? "100%" : "600px",
          background: "rgba(49, 134, 22, 0.18)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          boxShadow: "0 12px 40px rgba(49, 134, 22, 0.25)",
          borderRadius: "28px 28px 0 0",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          height: windowWidth <= 768 ? "80vh" : "auto",
          transform: (closing || !mounted) ? "translate(-50%, 100%)" : `translate(-50%, ${currentY}px)`,
          transition: closing || !mounted || startY === null ? "transform 0.3s cubic-bezier(0.32, 0.94, 0.6, 1)" : "none",
          overflow: "hidden",
          boxSizing: "border-box",
          position: "fixed",
          left: "50%",
          bottom: 0,
          zIndex: 9999
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Swipe Handle area */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            width: "100%",
            padding: "12px 0 6px 0",
            display: "flex",
            justifyContent: "center",
            cursor: "grab",
            userSelect: "none"
          }}
        >
          <div style={{ width: "40px", height: "5px", background: "rgba(255,255,255,0.4)", borderRadius: "3px" }} />
        </div>

        {/* Content Area */}
        <div style={{ padding: "0 24px 24px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "900", color: "#ffffff", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                {showForm ? (addressForm.id ? "Edit Address" : "Add Address") : "Delivery Address"}
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "rgba(255,255,255,0.8)", fontWeight: "600" }}>
                {showForm ? "Save details to proceed" : "Choose where Buyto should deliver"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              style={{
                border: "none",
                background: "rgba(255,255,255,0.15)",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                color: "white",
                fontSize: "14px",
                cursor: "pointer",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ✕
            </button>
          </div>

          {showForm ? (
            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Interactive Map */}
              <div style={{ width: "100%", height: "180px", borderRadius: "18px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.2)", position: "relative" }}>
                <MapContainer center={mapCenter} zoom={16} style={{ width: "100%", height: "100%", zIndex: 1 }} zoomControl={true}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                  <Marker
                    position={markerPos}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e) => {
                        const latLng = e.target.getLatLng();
                        handleMapClickOrMarkerDrag(latLng.lat, latLng.lng);
                      }
                    }}
                  />
                  <ChangeMapView center={mapCenter} />
                  <MapEventsHandler onMapClick={(coords) => handleMapClickOrMarkerDrag(coords[0], coords[1])} />
                </MapContainer>
              </div>

              {serviceabilityMessage && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: "800",
                    background: isModalAddressServiceable ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)",
                    border: isModalAddressServiceable ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                    color: "white"
                  }}
                >
                  {serviceabilityMessage}
                </div>
              )}

              {/* Quick Actions inside Form */}
              <button
                type="button"
                onClick={() => detectGpsLocation(false)}
                disabled={gpsDetecting}
                style={{
                  padding: "10px",
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "10px",
                  color: "white",
                  fontWeight: "750",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                {gpsDetecting ? `⏳ ${gpsProgressText || "Detecting..."}` : "📍 Use GPS Location"}
              </button>

              {/* Student-focused Address Presets */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", fontWeight: "700" }}>SAVE ADDRESS AS</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {ADDRESS_PRESETS.map((preset) => {
                    const isSelected = addressForm.label === preset.label;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setAddressForm(prev => ({ ...prev, label: preset.label }))}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          border: isSelected ? "1.5px solid #ffffff" : "1px solid rgba(255,255,255,0.2)",
                          background: isSelected ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
                          color: "white",
                          fontWeight: "700",
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

              {/* Custom address name if 'Other' selected */}
              {addressForm.label === "Other" && (
                <input
                  type="text"
                  placeholder="Custom Address Name (e.g. Hostel Block A)"
                  value={addressForm.customLabel}
                  onChange={(e) => setAddressForm({ ...addressForm, customLabel: e.target.value })}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    outline: "none",
                    fontSize: "13px"
                  }}
                  required
                />
              )}

              {/* Inputs Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  required
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    outline: "none",
                    fontSize: "13px"
                  }}
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  required
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    outline: "none",
                    fontSize: "13px"
                  }}
                />
              </div>

              <input
                type="text"
                placeholder="Full Address / Building / College Campus"
                value={addressForm.addressLine}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                required
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  outline: "none",
                  fontSize: "13px"
                }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Room / Flat No."
                  value={addressForm.roomNumber}
                  onChange={(e) => setAddressForm({ ...addressForm, roomNumber: e.target.value })}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    outline: "none",
                    fontSize: "13px"
                  }}
                />
                <input
                  type="text"
                  placeholder="Landmark (Optional)"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    outline: "none",
                    fontSize: "13px"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="City"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    outline: "none",
                    fontSize: "13px"
                  }}
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    outline: "none",
                    fontSize: "13px"
                  }}
                />
              </div>

              <input
                type="text"
                placeholder="Delivery Notes (e.g. Ring bell, Leave at gate)"
                value={addressForm.notes}
                onChange={(e) => setAddressForm({ ...addressForm, notes: e.target.value })}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  outline: "none",
                  fontSize: "13px"
                }}
              />

              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "white", fontSize: "13px", fontWeight: "700" }}>
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  style={{ cursor: "pointer" }}
                />
                Set as Default Address
              </label>

              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.25)",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    fontWeight: "800",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
                    border: "none",
                    background: "#22c55e",
                    color: "white",
                    fontWeight: "800",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(34, 197, 94, 0.4)"
                  }}
                >
                  Save Address
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Quick Actions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
                <button
                  onClick={() => {
                    setAddressForm({
                      id: "",
                      label: "Hostel",
                      customLabel: "",
                      fullName: "",
                      phone: "",
                      addressLine: "",
                      landmark: "",
                      roomNumber: "",
                      city: "",
                      pincode: "",
                      notes: "",
                      isDefault: false,
                      latitude: null,
                      longitude: null
                    });
                    setMapCenter([13.3409, 74.7978]);
                    setMarkerPos([13.3409, 74.7978]);
                    setShowForm(true);
                  }}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "14px",
                    border: "1.5px dashed rgba(255,255,255,0.4)",
                    background: "rgba(255,255,255,0.08)",
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "13px",
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  ➕ Add New Address
                </button>
              </div>

              {/* Saved Addresses list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: "800", letterSpacing: "0.5px" }}>SAVED ADDRESSES</span>
                {loading ? (
                  <p style={{ textAlign: "center", color: "#ffffff", fontSize: "13px" }}>Loading addresses...</p>
                ) : addresses.length === 0 ? (
                  <p style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "10px 0" }}>
                    No saved addresses found.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "35vh", overflowY: "auto" }}>
                    {addresses.map((addr) => {
                      const isSelected = localStorage.getItem("buyto_selected_address_id") === addr._id || addr.isDefault;
                      return (
                        <div
                          key={addr._id}
                          onClick={() => selectAddress(addr)}
                          style={{
                            padding: "16px",
                            borderRadius: "20px",
                            background: isSelected ? "rgba(49, 134, 22, 0.32)" : "rgba(255, 255, 255, 0.08)",
                            border: isSelected ? "1.5px solid rgba(255, 255, 255, 0.35)" : "1px solid rgba(255, 255, 255, 0.15)",
                            boxShadow: isSelected ? "0 8px 32px rgba(49, 134, 22, 0.3)" : "none",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "14px", fontWeight: "950", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                              {addr.label === "Hostel" ? "🏢 Hostel" :
                                addr.label === "Home" ? "🏠 Home" :
                                addr.label === "Work" ? "🏢 Work" :
                                addr.label === "Office" ? "💼 Office" :
                                addr.label === "PG" ? "🏢 PG" :
                                addr.label === "College" ? "🎓 College" : `📍 ${addr.label}`}
                            </span>

                            {/* Actions Menu */}
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAddressForm({
                                    id: addr._id,
                                    label: ADDRESS_PRESETS.some(p => p.label === addr.label) ? addr.label : "Other",
                                    customLabel: ADDRESS_PRESETS.some(p => p.label === addr.label) ? "" : addr.label,
                                    fullName: addr.fullName,
                                    phone: addr.phone,
                                    addressLine: addr.addressLine,
                                    landmark: addr.landmark || "",
                                    roomNumber: addr.roomNumber || "",
                                    city: addr.city || "",
                                    pincode: addr.pincode || "",
                                    notes: addr.notes || "",
                                    isDefault: !!addr.isDefault,
                                    latitude: addr.latitude,
                                    longitude: addr.longitude
                                  });
                                  setMapCenter([addr.latitude || 13.3409, addr.longitude || 74.7978]);
                                  setMarkerPos([addr.latitude || 13.3409, addr.longitude || 74.7978]);
                                  setShowForm(true);
                                }}
                                style={{ background: "transparent", border: "none", color: "white", fontSize: "12px", cursor: "pointer", opacity: 0.8 }}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={(e) => handleDeleteAddress(addr._id, e)}
                                style={{ background: "transparent", border: "none", color: "white", fontSize: "12px", cursor: "pointer", opacity: 0.8 }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "750", color: "#ffffff" }}>
                              {addr.fullName}
                            </span>
                            <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.9)", lineHeight: "1.4" }}>
                              {[
                                addr.roomNumber ? `Room ${addr.roomNumber}` : "",
                                addr.landmark ? addr.landmark : "",
                                addr.addressLine,
                                addr.city,
                                addr.pincode ? String(addr.pincode) : ""
                              ].filter(Boolean).join(", ")}
                            </span>
                            <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.9)", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <span>☎</span> {addr.phone}
                            </span>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                            {/* Delivery availability badge */}
                            <span style={{
                              background: addr.serviceable ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                              border: addr.serviceable ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(239, 68, 68, 0.4)",
                              color: "white",
                              fontSize: "10px",
                              fontWeight: "800",
                              padding: "2px 8px",
                              borderRadius: "12px"
                            }}>
                              {addr.serviceable ? "✓ Delivery Available" : "⚠ Service Not Available"}
                            </span>

                            {isSelected ? (
                              <span style={{
                                background: "#22c55e",
                                color: "white",
                                fontSize: "10px",
                                fontWeight: "900",
                                padding: "2px 8px",
                                borderRadius: "12px"
                              }}>
                                Selected ✓
                              </span>
                            ) : (
                              !addr.isDefault && (
                                <button
                                  onClick={(e) => handleSetDefault(addr, e)}
                                  style={{
                                    background: "rgba(255,255,255,0.15)",
                                    border: "none",
                                    color: "white",
                                    fontSize: "9px",
                                    cursor: "pointer",
                                    padding: "2px 6px",
                                    borderRadius: "8px",
                                    fontWeight: "800"
                                  }}
                                >
                                  Make Default
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Premium GPS Loading Overlay */}
        {showGpsOverlay && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0, 0, 0, 0.18)",
              backdropFilter: "blur(12px) brightness(0.9) saturate(0.9)",
              WebkitBackdropFilter: "blur(12px) brightness(0.9) saturate(0.9)",
              zIndex: 100000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: gpsOverlayFadeOut ? "gpsOverlayFadeOut 220ms forwards ease-in-out" : "gpsOverlayFadeIn 180ms forwards ease-in-out",
              pointerEvents: "auto",
              borderRadius: "28px 28px 0 0"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              @keyframes gpsPinFloat {
                0% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
                100% { transform: translateY(0); }
              }
              @keyframes gpsPinPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
              }
              @keyframes gpsRipple {
                0% { transform: scale(0.6); opacity: 0.8; }
                100% { transform: scale(2.2); opacity: 0; }
              }
              @keyframes gpsOverlayFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes gpsOverlayFadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
              }
              @keyframes gpsCardFadeIn {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
              }
              @keyframes gpsCardFadeOut {
                from { opacity: 1; transform: scale(1); }
                to { opacity: 0; transform: scale(0.9); }
              }
              .gps-ripple {
                position: absolute;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                border: 2px solid rgba(49, 134, 22, 0.4);
                animation: gpsRipple 1.5s infinite cubic-bezier(0.1, 0.8, 0.3, 1);
              }
              .gps-ripple-delay {
                animation-delay: 0.75s;
              }
              @media (prefers-reduced-motion: reduce) {
                .gps-ripple, .gps-pin-wrapper, .gps-pin-pulse {
                  animation: none !important;
                }
              }
            `}</style>
            
            <div
              style={{
                width: "85%",
                maxWidth: "320px",
                background: "rgba(255, 255, 255, 0.75)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderRadius: "22px",
                padding: "32px 24px",
                textAlign: "center",
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                animation: gpsOverlayFadeOut ? "gpsCardFadeOut 220ms forwards ease-in-out" : "gpsCardFadeIn 180ms forwards ease-in-out"
              }}
            >
              {/* Icon Area */}
              <div style={{ position: "relative", width: "120px", height: "120px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                {/* Ripple effects */}
                {!gpsSuccessState && (
                  <>
                    <div className="gps-ripple" />
                    <div className="gps-ripple gps-ripple-delay" />
                  </>
                )}
                
                {/* Animated GPS Pin */}
                <div
                  className="gps-pin-wrapper"
                  style={{
                    zIndex: 2,
                    animation: !gpsSuccessState ? "gpsPinFloat 2.8s infinite ease-in-out" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: gpsSuccessState ? "rgba(16, 185, 129, 0.15)" : "rgba(49, 134, 22, 0.12)",
                    border: gpsSuccessState ? "1.5px solid rgba(16, 185, 129, 0.3)" : "1.5px solid rgba(49, 134, 22, 0.2)",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill={gpsSuccessState ? "#10B981" : "#318616"}
                    style={{
                      transition: "fill 0.3s ease",
                      animation: !gpsSuccessState ? "gpsPinPulse 1.2s infinite ease-in-out" : "none"
                    }}
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
              </div>
              
              {/* Text Area */}
              <h3 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: "19px", fontWeight: "800", letterSpacing: "-0.3px" }}>
                {gpsSuccessState ? "Location found!" : "Finding your location"}
              </h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "13px", fontWeight: "600", lineHeight: "1.5", padding: "0 8px" }}>
                {gpsSuccessState ? "Successfully matched your GPS coordinates." : "Using GPS to locate your delivery address."}
              </p>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
