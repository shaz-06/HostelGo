import { STARTUP_STATUS } from "./startupConstants";

/**
 * Startup Coordinator.
 * Sequentially orchestrates the application startup flow tasks using dependency injection.
 * 
 * @param {object} context
 * @param {object} context.locationService
 * @param {object} context.addressService
 * @param {object} context.telemetry
 * @param {number} context.timeoutMs
 * @param {AbortSignal} context.signal
 * @returns {Promise<{status: string, error?: Error}>}
 */
export async function startupCoordinator(context) {
  const { locationService, addressService, telemetry, timeoutMs, signal } = context;

  const checkSignal = () => {
    if (signal && signal.aborted) {
      throw new Error("Startup flow cancelled");
    }
  };

  telemetry.startupStarted();

  // 1. Check saved address
  checkSignal();
  const savedAddress = await addressService.loadSavedAddress();
  if (savedAddress && savedAddress.addressLine) {
    telemetry.savedAddressFound(savedAddress.addressLine);
    return { status: STARTUP_STATUS.READY };
  }

  // 2. Check device location services
  checkSignal();
  const gpsEnabled = await locationService.hasLocationServicesEnabled();
  if (!gpsEnabled) {
    telemetry.gpsDisabled();
    return { status: "gps_disabled" };
  }

  // 3. Request/Check app-level location permission
  checkSignal();
  const permission = await locationService.requestLocationPermission();
  if (permission !== "granted") {
    telemetry.permissionDenied();
    // Return permission required status
    return { status: "permission_required" };
  }

  // 4. Fetch Coordinates
  checkSignal();
  try {
    const coords = await locationService.getCurrentLocation(timeoutMs);
    checkSignal();

    // 5. Reverse geocode
    const addressLine = await addressService.reverseGeocode(coords.latitude, coords.longitude);
    checkSignal();

    // 6. Save delivery location
    await addressService.saveAddress(addressLine, coords, "gps");
    telemetry.locationResolved(coords, addressLine);

    // 7. Future-proofing placeholder: Serviceability check
    // if (!await addressService.checkServiceability(coords)) {
    //   return { status: 'serviceability_failed' };
    // }

    return { status: STARTUP_STATUS.READY };
  } catch (error) {
    console.error("[startupCoordinator] Error resolving position:", error);
    return { status: "location_error", error };
  }
}
