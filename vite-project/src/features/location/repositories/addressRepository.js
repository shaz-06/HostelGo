/**
 * Repository layer managing persistence, caching, and synchronization of addresses.
 */

// In-memory cache
let cachedAddresses = null;
let cachedSelectedAddress = null;

export const addressRepository = {
  /**
   * Retrieves the selected address, checking session cache first, then localStorage.
   */
  async getSelectedAddress() {
    if (cachedSelectedAddress) {
      return { success: true, data: cachedSelectedAddress };
    }
    
    const addressLine = localStorage.getItem("userLocation");
    if (addressLine) {
      const data = {
        addressLine,
        roomNumber: localStorage.getItem("roomNumber") || "",
        addressId: localStorage.getItem("buyto_selected_address_id") || "",
        addressType: localStorage.getItem("buyto_selected_address_type") || "Other",
        coords: (() => {
          try {
            const raw = localStorage.getItem("buyto_last_gps_coords");
            return raw ? JSON.parse(raw) : null;
          } catch (e) {
            return null;
          }
        })()
      };
      cachedSelectedAddress = data;
      return { success: true, data };
    }
    return { success: false, error: { code: "CACHE_MISS", message: "No selected address found" } };
  },

  /**
   * Sets the active selected address in cache and persistent localStorage.
   */
  async setSelectedAddress(address) {
    if (!address) {
      return { success: false, error: { code: "VALIDATION_ERROR", message: "Address is empty" } };
    }
    localStorage.setItem("userLocation", address.addressLine || "");
    localStorage.setItem("roomNumber", address.roomNumber || "");
    localStorage.setItem("buyto_selected_address_id", address.addressId || address._id || "");
    localStorage.setItem("buyto_selected_address_type", address.addressType || address.label || "Other");
    
    if (address.coords) {
      localStorage.setItem("buyto_last_gps_coords", JSON.stringify(address.coords));
    }
    
    cachedSelectedAddress = address;
    
    // Dispatch custom event to notify legacy code
    window.dispatchEvent(new CustomEvent("addressChanged"));
    
    return { success: true, data: address };
  },

  /**
   * Retrieves saved addresses.
   */
  async getSavedAddresses() {
    if (cachedAddresses) {
      return { success: true, data: cachedAddresses };
    }

    const token = localStorage.getItem("buyto_token");
    if (token) {
      try {
        const res = await fetch((window.API_BASE_URL || "") + "/api/addresses", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.addresses) {
            cachedAddresses = data.addresses.map(a => ({
              ...a,
              id: a._id,
              addressType: a.label || "Other"
            }));
            return { success: true, data: cachedAddresses };
          }
        }
      } catch (err) {
        console.warn("[addressRepository] Failed to fetch server addresses:", err);
      }
    }

    // LocalStorage guest fallback
    const guestAddresses = localStorage.getItem("buyto_guest_addresses");
    const parsed = guestAddresses ? JSON.parse(guestAddresses) : [];
    cachedAddresses = parsed;
    return { success: true, data: parsed };
  },

  /**
   * Saves a new address record.
   */
  async saveAddress(address) {
    const token = localStorage.getItem("buyto_token");
    const timestamp = new Date().toISOString();
    const addressWithMeta = {
      ...address,
      id: address.id || "local_" + Date.now(),
      updatedAt: timestamp,
      syncedAt: token ? timestamp : null,
      isPendingSync: !token
    };

    if (token) {
      try {
        const res = await fetch((window.API_BASE_URL || "") + "/api/addresses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            label: address.label || address.addressType || "Other",
            fullName: address.fullName || "User",
            phone: address.phone || "6363849864",
            addressLine: address.addressLine,
            landmark: address.landmark || "",
            roomNumber: address.roomNumber || "",
            latitude: address.latitude || (address.coords ? address.coords.latitude : 12.9716),
            longitude: address.longitude || (address.coords ? address.coords.longitude : 77.5946),
            isDefault: !!address.isDefault,
            serviceable: true
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.address) {
            this.clearCache();
            return { success: true, data: data.address };
          }
        }
      } catch (err) {
        console.warn("[addressRepository] Save failed to sync, saving locally as pending:", err);
      }
    }

    // Offline / Local save
    const guestAddresses = localStorage.getItem("buyto_guest_addresses");
    const parsed = guestAddresses ? JSON.parse(guestAddresses) : [];
    parsed.push(addressWithMeta);
    localStorage.setItem("buyto_guest_addresses", JSON.stringify(parsed));
    
    this.clearCache();
    return { success: true, data: addressWithMeta };
  },

  /**
   * Updates an existing address.
   */
  async updateAddress(address) {
    const token = localStorage.getItem("buyto_token");
    const id = address._id || address.id;
    this.clearCache();

    if (token && id && !String(id).startsWith("local_")) {
      try {
        const res = await fetch((window.API_BASE_URL || "") + `/api/addresses/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(address)
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, data: data.address };
        }
      } catch (err) {
        console.warn("[addressRepository] Update sync failed:", err);
      }
    }

    // Offline / Local edit
    const guestAddresses = localStorage.getItem("buyto_guest_addresses");
    if (guestAddresses) {
      let parsed = JSON.parse(guestAddresses);
      parsed = parsed.map(a => ((a._id === id || a.id === id) ? { ...a, ...address, isPendingSync: true } : a));
      localStorage.setItem("buyto_guest_addresses", JSON.stringify(parsed));
    }
    return { success: true, data: address };
  },

  /**
   * Deletes an address.
   */
  async deleteAddress(id) {
    const token = localStorage.getItem("buyto_token");
    this.clearCache();

    if (token && id && !String(id).startsWith("local_")) {
      try {
        const res = await fetch((window.API_BASE_URL || "") + `/api/addresses/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          return { success: true, data: id };
        }
      } catch (err) {
        console.warn("[addressRepository] Delete sync failed:", err);
      }
    }

    // Offline / Local delete
    const guestAddresses = localStorage.getItem("buyto_guest_addresses");
    if (guestAddresses) {
      let parsed = JSON.parse(guestAddresses);
      parsed = parsed.filter(a => a._id !== id && a.id !== id);
      localStorage.setItem("buyto_guest_addresses", JSON.stringify(parsed));
    }
    return { success: true, data: id };
  },

  clearCache() {
    cachedAddresses = null;
    cachedSelectedAddress = null;
  },

  /**
   * Synchronizes local/offline pending changes to the server when connection is active.
   */
  async syncPendingChanges() {
    const token = localStorage.getItem("buyto_token");
    if (!token) return;

    const guestAddresses = localStorage.getItem("buyto_guest_addresses");
    if (!guestAddresses) return;

    try {
      const parsed = JSON.parse(guestAddresses);
      const pending = parsed.filter(a => a.isPendingSync);
      if (pending.length === 0) return;

      console.log("[addressRepository] Syncing pending offline addresses...");
      for (const addr of pending) {
        await fetch((window.API_BASE_URL || "") + "/api/addresses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            label: addr.label || addr.addressType || "Other",
            fullName: addr.fullName,
            phone: addr.phone,
            addressLine: addr.addressLine,
            landmark: addr.landmark || "",
            roomNumber: addr.roomNumber || "",
            latitude: addr.latitude || (addr.coords ? addr.coords.latitude : 12.9716),
            longitude: addr.longitude || (addr.coords ? addr.coords.longitude : 77.5946),
            isDefault: !!addr.isDefault
          })
        });
      }
      localStorage.removeItem("buyto_guest_addresses");
      this.clearCache();
    } catch (e) {
      console.warn("[addressRepository] Offline sync trigger failed:", e);
    }
  }
};
