import { INDIAN_STATES } from '../constants/india';

/**
 * Approximate coordinate bounding for fallback when completely offline
 */
const KNOWN_INDIAN_HUBS = [
  { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', postalCode: '560001', lat: 12.9716, lng: 77.5946 },
  { city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', postalCode: '400001', lat: 19.0760, lng: 72.8777 },
  { city: 'Delhi', district: 'Central Delhi', state: 'Delhi', postalCode: '110001', lat: 28.6139, lng: 77.2090 },
  { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', postalCode: '500001', lat: 17.3850, lng: 78.4867 },
  { city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', postalCode: '600001', lat: 13.0827, lng: 80.2707 },
  { city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', postalCode: '700001', lat: 22.5726, lng: 88.3639 },
  { city: 'Pune', district: 'Pune', state: 'Maharashtra', postalCode: '411001', lat: 18.5204, lng: 73.8567 },
  { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', postalCode: '380001', lat: 23.0225, lng: 72.5714 },
];

function findNearestKnownHub(lat, lng) {
  let nearest = KNOWN_INDIAN_HUBS[0];
  let minDistance = Infinity;

  for (const hub of KNOWN_INDIAN_HUBS) {
    const dLat = hub.lat - lat;
    const dLng = hub.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      nearest = hub;
    }
  }

  return {
    street: '',
    areaLocality: '',
    city: nearest.city,
    district: nearest.district,
    state: nearest.state,
    postalCode: nearest.postalCode,
    displayName: `${nearest.city}, ${nearest.state}`,
  };
}

/**
 * Reverse geocodes GPS coordinates into structured Indian address fields.
 * Uses OpenStreetMap Nominatim with BigDataCloud and local geo-cache fallbacks.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{
 *   street: string,
 *   areaLocality: string,
 *   city: string,
 *   district: string,
 *   state: string,
 *   postalCode: string,
 *   displayName: string
 * }>}
 */
export async function reverseGeocodeCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    throw new Error('Invalid coordinates provided for reverse geocoding');
  }

  // 1. Try OpenStreetMap Nominatim API (highest accuracy for streets & postal codes in India)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
        },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const road = addr.road || addr.street || addr.pedestrian || addr.footway || addr.path || '';
      const houseNumber = addr.house_number || addr.building || '';
      const streetParts = [houseNumber, road].filter(Boolean);
      const street = streetParts.length > 0 ? streetParts.join(', ') : (addr.suburb || addr.neighbourhood || '');

      const areaLocality =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.subdistrict ||
        addr.quarter ||
        addr.city_district ||
        '';

      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.county ||
        '';

      const district = addr.state_district || addr.county || addr.district || city || '';
      const rawPostcode = (addr.postcode || '').replace(/\D/g, '').slice(0, 6);
      const rawState = addr.state || '';

      // Match state to exact Indian states list
      let matchedState = '';
      if (rawState) {
        matchedState = INDIAN_STATES.find(
          (s) => s.toLowerCase() === rawState.toLowerCase() || rawState.toLowerCase().includes(s.toLowerCase())
        ) || rawState;
      }

      return {
        street,
        areaLocality,
        city,
        district,
        state: matchedState,
        postalCode: rawPostcode,
        displayName: data.display_name || `${areaLocality || city}, ${matchedState}`,
      };
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode attempt failed, attempting fallback:', err.message);
  }

  // 2. Fallback: BigDataCloud Reverse Geocoding Client API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      const rawState = bdcData.principalSubdivision || '';
      const city = bdcData.city || bdcData.locality || '';
      const areaLocality = bdcData.localityInfo?.administrative?.[3]?.name || bdcData.locality || '';
      const postalCode = (bdcData.postcode || '').replace(/\D/g, '').slice(0, 6);

      let matchedState = '';
      if (rawState) {
        matchedState = INDIAN_STATES.find(
          (s) => s.toLowerCase() === rawState.toLowerCase() || rawState.toLowerCase().includes(s.toLowerCase())
        ) || rawState;
      }

      return {
        street: '',
        areaLocality,
        city,
        district: city,
        state: matchedState,
        postalCode,
        displayName: `${areaLocality || city}, ${matchedState}`,
      };
    }
  } catch (err) {
    console.warn('BigDataCloud reverse geocode fallback failed:', err.message);
  }

  // 3. Fallback: Nearest known regional hub (prevents empty form if totally offline)
  return findNearestKnownHub(lat, lng);
}
