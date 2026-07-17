/**
 * Route Generator Service
 * Generates a realistic simulated street route between two coordinates.
 */

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generates a route consisting of 60 waypoints between start and end coordinates.
 * Creates intermediate turns/grid layout to simulate real street routing.
 *
 * @param {number} lat1 Start Latitude
 * @param {number} lng1 Start Longitude
 * @param {number} lat2 End Latitude
 * @param {number} lng2 End Longitude
 * @returns {Array<{lat: number, lng: number}>} Route waypoints
 */
function generateRoute(lat1, lng1, lat2, lng2) {
  const points = [];
  const dy = lat2 - lat1;
  const dx = lng2 - lng1;

  // Let's define 4 key turns/milestones to simulate streets rather than a straight line
  const milestones = [
    { lat: lat1, lng: lng1 },
    { lat: lat1 + dy * 0.25, lng: lng1 + dx * 0.1 },
    { lat: lat1 + dy * 0.5, lng: lng1 + dx * 0.6 },
    { lat: lat1 + dy * 0.85, lng: lng1 + dx * 0.6 },
    { lat: lat2, lng: lng2 }
  ];

  // Calculate segment distances
  const segments = [];
  let totalDistance = 0;
  for (let i = 0; i < milestones.length - 1; i++) {
    const dist = getDistance(
      milestones[i].lat,
      milestones[i].lng,
      milestones[i + 1].lat,
      milestones[i + 1].lng
    );
    segments.push({
      start: milestones[i],
      end: milestones[i + 1],
      distance: dist
    });
    totalDistance += dist;
  }

  // Ensure totalDistance is non-zero
  if (totalDistance === 0) {
    // If start and end are identical, return points clustered there
    for (let i = 0; i < 60; i++) {
      points.push({ lat: lat1, lng: lng1 });
    }
    return points;
  }

  const TOTAL_POINTS = 60;
  // Distribute points across segments based on distance proportion
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segPointsCount = Math.max(
      2,
      Math.round((seg.distance / totalDistance) * TOTAL_POINTS)
    );
    
    // Interpolate points for this segment (avoiding adding the end point to prevent duplicates, except on the last segment)
    const isLastSegment = i === segments.length - 1;
    const limit = isLastSegment ? segPointsCount : segPointsCount - 1;
    
    for (let j = 0; j < limit; j++) {
      const fraction = j / (segPointsCount - 1);
      const lat = seg.start.lat + (seg.end.lat - seg.start.lat) * fraction;
      const lng = seg.start.lng + (seg.end.lng - seg.start.lng) * fraction;
      points.push({ lat, lng });
    }
  }

  // Ensure we have exactly or close to our desired number of points and that the last point is exactly the destination
  if (points.length > 0) {
    points[points.length - 1] = { lat: lat2, lng: lng2 };
  } else {
    points.push({ lat: lat2, lng: lng2 });
  }

  return points;
}

module.exports = {
  generateRoute,
  getDistance
};
