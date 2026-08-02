/**
 * Checks if a given coordinate is serviceable by Buyto.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{serviceable: boolean, etaMinutes?: number, deliveryFee?: number, storeId?: string, warehouseId?: string, reason?: string}>}
 */
export async function verifyLocationServiceability(latitude, longitude) {
  try {
    const res = await fetch((window.API_BASE_URL || "") + "/api/auth/verify-serviceability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: Number(latitude),
        longitude: Number(longitude)
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      return {
        serviceable: !!data.serviceable,
        etaMinutes: data.etaMinutes || 15,
        deliveryFee: data.deliveryFee || 0,
        storeId: data.storeId || "",
        warehouseId: data.warehouseId || "",
        reason: data.serviceable ? null : "OUTSIDE_DELIVERY_ZONE"
      };
    } else {
      return { serviceable: false, reason: "SERVER_ERROR" };
    }
  } catch (err) {
    console.error("[serviceabilityService] Verification request failed:", err);
    return { serviceable: false, reason: "NETWORK_ERROR" };
  }
}
