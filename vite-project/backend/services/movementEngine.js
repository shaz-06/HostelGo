/**
 * Movement Engine Service
 * Calculates route progress, simulated current coordinates, remaining ETA,
 * order stages, and marker rotation (bearing).
 */

/**
 * Calculates progress fraction based on elapsed time fraction using the speed curve:
 * - 0-20%: Acceleration
 * - 20-70%: Steady cruising
 * - 70-90%: Slight slowdown
 * - 90-100%: Smooth ease-in
 *
 * @param {number} f Time elapsed fraction (0.0 to 1.0)
 * @returns {number} Route progress fraction (0.0 to 1.0)
 */
function getProgressFraction(f) {
  if (f <= 0) return 0;
  if (f >= 1) return 1;

  if (f < 0.2) {
    // Acceleration phase: starts at slope 0, reaches slope 1.2 at f=0.2
    return 3.75 * f * f;
  } else if (f < 0.7) {
    // Steady cruising phase: p goes from 0.15 to 0.75 linearly
    return 0.15 + 1.2 * (f - 0.2);
  } else if (f < 0.9) {
    // Slight slowdown phase: p goes from 0.75 to 0.92
    const t = (f - 0.7) / 0.2;
    return 0.75 + t * 0.17;
  } else {
    // Ease-in phase: p goes from 0.92 to 1.0
    const t = (f - 0.9) / 0.1;
    return 0.92 + 0.08 * (1 - Math.pow(1 - t, 2));
  }
}

/**
 * Calculates bearing angle in degrees between two coordinates.
 */
function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((brng + 360) % 360);
}

/**
 * Map order progress percentage to the appropriate order tracking stage.
 * Stages mapping:
 * - 0% -> Order Placed
 * - 5% -> Packed
 * - 15% -> Rider Assigned
 * - 30% -> Picked Up
 * - 80% -> Near You
 * - 100% -> Delivered
 */
function getStage(progressPercent) {
  if (progressPercent >= 100) return "Delivered";
  if (progressPercent >= 80) return "Near You";
  if (progressPercent >= 30) return "Picked Up";
  if (progressPercent >= 15) return "Rider Assigned";
  if (progressPercent >= 5) return "Packed";
  return "Order Placed";
}

/**
 * Calculates the current state of a tracking session.
 *
 * @param {Date|number} assignedAt Time rider was assigned
 * @param {Date|number} estimatedDeliveryTime Estimated arrival time
 * @param {Array<{lat: number, lng: number}>} route Waypoints list
 * @param {number} [now=Date.now()] Current server timestamp
 * @returns {object} Calculated tracking details
 */
function calculateTrackingState(assignedAt, estimatedDeliveryTime, route, now = Date.now()) {
  const start = new Date(assignedAt).getTime();
  const end = new Date(estimatedDeliveryTime).getTime();
  const totalMs = end - start;
  const elapsedMs = now - start;

  if (totalMs <= 0 || elapsedMs <= 0) {
    const firstPoint = route[0] || { lat: 0, lng: 0 };
    return {
      progress: 0,
      etaMinutes: Math.max(0, Math.ceil((end - now) / 60000)),
      estimatedArrival: new Date(end).toISOString(),
      stage: getStage(0),
      currentLocation: {
        lat: firstPoint.lat,
        lng: firstPoint.lng,
        bearing: 0
      }
    };
  }

  const timeFraction = Math.min(1.0, elapsedMs / totalMs);
  const progressFraction = getProgressFraction(timeFraction);
  const progressPercent = Math.round(progressFraction * 100);
  const etaMinutes = Math.max(0, Math.ceil((end - now) / 60000));

  let currentLocation = { lat: 0, lng: 0, bearing: 0 };

  if (route && route.length > 0) {
    const N = route.length;
    const routeIndex = progressFraction * (N - 1);
    const lowerIndex = Math.floor(routeIndex);
    const upperIndex = Math.min(N - 1, lowerIndex + 1);
    const fraction = routeIndex - lowerIndex;

    const lowerPoint = route[lowerIndex];
    const upperPoint = route[upperIndex];

    const lat = lowerPoint.lat + (upperPoint.lat - lowerPoint.lat) * fraction;
    const lng = lowerPoint.lng + (upperPoint.lng - lowerPoint.lng) * fraction;

    let bearing = 0;
    if (lowerIndex < N - 1) {
      bearing = calculateBearing(lowerPoint.lat, lowerPoint.lng, upperPoint.lat, upperPoint.lng);
    } else if (lowerIndex > 0) {
      const prevPoint = route[lowerIndex - 1];
      bearing = calculateBearing(prevPoint.lat, prevPoint.lng, lowerPoint.lat, lowerPoint.lng);
    }

    currentLocation = { lat, lng, bearing };
  }

  return {
    progress: progressPercent,
    etaMinutes,
    estimatedArrival: new Date(end).toISOString(),
    stage: getStage(progressPercent),
    currentLocation
  };
}

module.exports = {
  getProgressFraction,
  calculateBearing,
  getStage,
  calculateTrackingState
};
