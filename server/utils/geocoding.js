/**
 * Reverse Geocoding Utility
 * Converts GPS coordinates to human-readable addresses
 */

const axios = require('axios');

/**
 * Reverse geocode coordinates to get address
 * @param {Number} latitude - Latitude
 * @param {Number} longitude - Longitude
 * @returns {Object|null} Address object or null if failed
 */
async function reverseGeocode(latitude, longitude) {
  try {
    // Using Nominatim (OpenStreetMap) - Free, no API key required
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        addressdetails: 1,
        zoom: 18,
      },
      headers: {
        'User-Agent': 'LegalOfficeManagement/1.0' // Required by Nominatim
      },
      timeout: 5000 // 5 second timeout
    });

    if (response.data && response.data.address) {
      const addr = response.data.address;
      
      // Build full address string
      const addressParts = [];
      
      if (addr.house_number) addressParts.push(addr.house_number);
      if (addr.road) addressParts.push(addr.road);
      if (addr.neighbourhood) addressParts.push(addr.neighbourhood);
      if (addr.suburb) addressParts.push(addr.suburb);
      if (addr.city || addr.town || addr.village) addressParts.push(addr.city || addr.town || addr.village);
      if (addr.state_district) addressParts.push(addr.state_district);
      if (addr.state) addressParts.push(addr.state);
      if (addr.postcode) addressParts.push(addr.postcode);
      if (addr.country) addressParts.push(addr.country);
      
      const fullAddress = addressParts.join(', ') || response.data.display_name || 'Address not available';
      
      return {
        fullAddress,
        displayName: response.data.display_name || fullAddress,
        houseNumber: addr.house_number || null,
        road: addr.road || null,
        neighbourhood: addr.neighbourhood || null,
        suburb: addr.suburb || null,
        city: addr.city || addr.town || addr.village || null,
        state: addr.state || null,
        postcode: addr.postcode || null,
        country: addr.country || null,
      };
    }
    
    return {
      fullAddress: response.data.display_name || 'Address not available',
      displayName: response.data.display_name || 'Address not available',
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    // Return formatted coordinates as fallback
    return {
      fullAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      displayName: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      error: 'Could not fetch address'
    };
  }
}

module.exports = { reverseGeocode };


