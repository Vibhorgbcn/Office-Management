/**
 * GPS Geofencing Utilities for Attendance System
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {Number} lat1 - Latitude of point 1
 * @param {Number} lng1 - Longitude of point 1
 * @param {Number} lat2 - Latitude of point 2
 * @param {Number} lng2 - Longitude of point 2
 * @returns {Number} Distance in meters
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

/**
 * Check if a GPS location is inside the geofence
 * @param {Number} empLat - Employee's latitude
 * @param {Number} empLng - Employee's longitude
 * @param {Number} officeLat - Office latitude
 * @param {Number} officeLng - Office longitude
 * @param {Number} radiusMeters - Allowed radius in meters
 * @returns {Boolean} True if inside geofence
 */
function isInsideGeofence(empLat, empLng, officeLat, officeLng, radiusMeters) {
  const distance = calculateDistance(empLat, empLng, officeLat, officeLng);
  return distance <= radiusMeters;
}

/**
 * Validate GPS accuracy
 * @param {Number} accuracy - GPS accuracy in meters
 * @param {Number} maxAccuracy - Maximum allowed accuracy (default: 2000m = 2km)
 * @returns {Boolean} True if accuracy is acceptable
 */
function isAccuracyValid(accuracy, maxAccuracy = 2000) {
  return accuracy && accuracy <= maxAccuracy;
}

/**
 * Find nearest office location
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @param {Array} officeLocations - Array of office location objects
 * @returns {Object|null} Nearest office location or null
 */
function findNearestOffice(lat, lng, officeLocations) {
  if (!officeLocations || officeLocations.length === 0) {
    return null;
  }

  let nearest = null;
  let minDistance = Infinity;

  for (const office of officeLocations) {
    if (!office.isActive) continue;

    const distance = calculateDistance(
      lat,
      lng,
      office.latitude,
      office.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = { ...office.toObject(), distance };
    }
  }

  return nearest;
}

/**
 * Validate attendance location against all office locations
 * @param {Number} lat - Employee latitude
 * @param {Number} lng - Employee longitude
 * @param {Number} accuracy - GPS accuracy in meters
 * @param {Array} officeLocations - Array of office locations
 * @returns {Object} Validation result
 */
function validateAttendanceLocation(lat, lng, accuracy, officeLocations) {
  // Don't block based on accuracy - only validate by geofence (coordinates)
  // Accuracy is stored for audit purposes but doesn't block check-in
  // This allows network-based locations which may have poor accuracy but correct coordinates

  if (!officeLocations || officeLocations.length === 0) {
    return {
      valid: false,
      error: 'No office locations configured'
    };
  }

  // First, check if coordinates are within the office geofence radius
  // This handles cases where GPS accuracy is poor but coordinates are correct
  // If coordinates are within the admin's set radius, allow check-in immediately
  for (const office of officeLocations) {
    if (!office.isActive) continue;

    const distance = calculateDistance(
      lat,
      lng,
      office.latitude,
      office.longitude
    );

    // If coordinates are within the office radius, allow check-in
    // This is for when employee is at/near the office location set by admin
    // Uses the admin's configured radius (default: 1000m = 1km)
    if (distance <= office.radiusMeters) {
      const officeObj = office.toObject ? office.toObject() : office;
      return {
        valid: true,
        officeLocation: { ...officeObj, distance: Math.round(distance) },
        distance: Math.round(distance),
        accuracy: accuracy,
        isExactMatch: distance <= 50 // True if within 50 meters (very close match)
      };
    }
  }

  // Find nearest office for geofence validation
  const nearestOffice = findNearestOffice(lat, lng, officeLocations);

  if (!nearestOffice) {
    return {
      valid: false,
      error: 'No active office locations found'
    };
  }

  // Check if inside geofence (within allowed radius)
  const inside = isInsideGeofence(
    lat,
    lng,
    nearestOffice.latitude,
    nearestOffice.longitude,
    nearestOffice.radiusMeters
  );

  if (!inside) {
    return {
      valid: false,
      error: `You are ${Math.round(nearestOffice.distance)} meters away from ${nearestOffice.name}. Please move closer to the office.`,
      nearestOffice: nearestOffice.name,
      distance: Math.round(nearestOffice.distance),
      allowedRadius: nearestOffice.radiusMeters,
      officeCoordinates: {
        latitude: nearestOffice.latitude,
        longitude: nearestOffice.longitude
      },
      yourCoordinates: {
        latitude: lat,
        longitude: lng
      }
    };
  }

  return {
    valid: true,
    officeLocation: nearestOffice,
    distance: Math.round(nearestOffice.distance),
    accuracy: accuracy // Include for logging but not used for validation
  };
}

module.exports = {
  calculateDistance,
  isInsideGeofence,
  isAccuracyValid,
  findNearestOffice,
  validateAttendanceLocation
};

