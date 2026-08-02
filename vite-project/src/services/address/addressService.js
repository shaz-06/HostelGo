/**
 * Service to load, save, and reverse-geocode addresses.
 */

export async function loadSavedAddress() {
  // Fallback to guest / local cache first for instant app startup
  const address = localStorage.getItem("userLocation");
  if (address) {
    return {
      addressLine: address,
      roomNumber: localStorage.getItem("roomNumber") || "",
      addressId: localStorage.getItem("buyto_selected_address_id") || "",
      addressType: localStorage.getItem("buyto_selected_address_type") || "Other",
      coords: (() => {
        try {
          const raw = localStorage.getItem("buyto_last_coords") || localStorage.getItem("buyto_last_gps_coords");
          return raw ? JSON.parse(raw) : null;
        } catch (e) {
          return null;
        }
      })()
    };
  }

  const token = localStorage.getItem("buyto_token");
  if (token) {
    try {
      const res = await fetch((window.API_BASE_URL || "") + "/api/addresses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.addresses && data.addresses.length > 0) {
          const def = data.addresses.find((a) => a.isDefault) || data.addresses[0];
          const addressLineText = def.addressLine + (def.landmark ? `, ${def.landmark}` : "");
          localStorage.setItem("userLocation", addressLineText);
          localStorage.setItem("roomNumber", def.roomNumber || "");
          localStorage.setItem("buyto_selected_address_id", def._id);
          localStorage.setItem("buyto_selected_address_type", def.label || "Other");
          localStorage.setItem("buyto_selected_address_full", JSON.stringify(def));
          return {
            addressLine: addressLineText,
            roomNumber: def.roomNumber || "",
            addressId: def._id,
            addressType: def.label || "Other",
            coords: { latitude: def.latitude, longitude: def.longitude }
          };
        }
      }
    } catch (e) {
      console.error("[addressService] Failed to load address from server:", e);
    }
  }

  // Check guest address storage
  const guestAddresses = localStorage.getItem("buyto_guest_addresses");
  if (guestAddresses) {
    try {
      const parsed = JSON.parse(guestAddresses);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const def = parsed.find((a) => a.isDefault) || parsed[0];
        const addressLineText = def.addressLine + (def.landmark ? `, ${def.landmark}` : "");
        localStorage.setItem("userLocation", addressLineText);
        localStorage.setItem("roomNumber", def.roomNumber || "");
        localStorage.setItem("buyto_selected_address_id", def._id);
        localStorage.setItem("buyto_selected_address_type", def.label || "Other");
        localStorage.setItem("buyto_selected_address_full", JSON.stringify(def));
        return {
          addressLine: addressLineText,
          roomNumber: def.roomNumber || "",
          addressId: def._id,
          addressType: def.label || "Other",
          coords: { latitude: def.latitude, longitude: def.longitude }
        };
      }
    } catch (e) {}
  }

  return null;
}

export async function saveAddress(addressLine, coords = null, source = "gps") {
  localStorage.setItem("userLocation", addressLine);
  localStorage.setItem("buyto_location_source", source);
  if (coords) {
    localStorage.setItem(
      "buyto_last_gps_coords",
      JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: Date.now()
      })
    );
  }
  // Dispatch custom address change event to notify components
  window.dispatchEvent(new CustomEvent("addressChanged"));
}

export async function reverseGeocode(latitude, longitude) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
    if (!res.ok) throw new Error("Reverse geocoding request failed");
    const data = await res.json();
    return data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch (err) {
    console.warn("[addressService] Reverse geocoding failed, falling back to coordinates:", err);
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
}
