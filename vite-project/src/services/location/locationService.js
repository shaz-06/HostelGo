import { Capacitor, registerPlugin } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

const LocationSettings = Capacitor.isNativePlatform()
  ? registerPlugin("LocationSettings")
  : null;

/**
  * Checks if system-wide device location services (GPS or Network) are enabled.
  * @returns {Promise<boolean>}
  */
export async function hasLocationServicesEnabled() {
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await LocationSettings.checkLocationServices();
      return !!res.enabled;
    } catch (err) {
      console.error("[locationService] Native check location services failed:", err);
      return false;
    }
  } else {
    // Web Fallback: Geolocation is supported by browser
    return !!navigator.geolocation;
  }
}

/**
  * Requests app-level location permissions.
  * @returns {Promise<string>} 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'
  */
export async function requestLocationPermission() {
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await Geolocation.requestPermissions({ permissions: ["location"] });
      return perm.location;
    } catch (err) {
      console.error("[locationService] Native request permissions failed:", err);
      return "denied";
    }
  } else {
    // Web Fallback
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve("granted"),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            resolve("denied");
          } else {
            resolve("prompt");
          }
        },
        { timeout: 3000 }
      );
    });
  }
}

/**
  * Gets current GPS coordinates.
  * @param {number} timeoutMs
  * @returns {Promise<{latitude: number, longitude: number}>}
  */
export async function getCurrentLocation(timeoutMs = 10000) {
  if (Capacitor.isNativePlatform()) {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: timeoutMs,
      maximumAge: 0
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
  } else {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (err) => reject(new Error("Web Geolocation failed: " + err.message)),
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
      );
    });
  }
}

/**
  * Opens native device location source settings or app settings.
  */
export async function openLocationSettings() {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocationSettings.openLocationSettings();
    } catch (err) {
      console.warn("[locationService] Failed to open native location settings, falling back to app settings:", err);
      try {
        window.open("app-settings:");
      } catch (e) {
        console.error("[locationService] Settings deep link failed:", e);
      }
    }
  } else {
    console.warn("[locationService] Location settings cannot be opened programmatically on web.");
  }
}
