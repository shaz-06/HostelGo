/**
 * Telemetry and startup flow event logging service.
 * Can be hooked into Firebase Analytics, Sentry, or other providers in the future.
 */

export const startupLogger = {
  startupStarted() {
    console.log("[Telemetry] Startup sequence initiated.");
  },
  savedAddressFound(address) {
    console.log("[Telemetry] Saved address found, skipping startup location flow.", address);
  },
  gpsDisabled() {
    console.warn("[Telemetry] Device location services (GPS) are turned off.");
  },
  permissionDenied() {
    console.warn("[Telemetry] Location permission was denied by the user.");
  },
  manualLocationSelected() {
    console.log("[Telemetry] User selected manual location option.");
  },
  locationResolved(coords, address) {
    console.log("[Telemetry] Current location coordinates resolved successfully:", coords, "Address:", address);
  },
  startupCompleted(status) {
    console.log("[Telemetry] Startup flow completed. Status:", status);
  }
};
