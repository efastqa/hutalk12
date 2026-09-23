// Sri Lanka Geographic Data and Distance Calculation Utilities
import { Listing } from '../types';

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface DistrictCenter {
  name: string;
  province: string;
  lat: number;
  lng: number;
  zoom: number;
}

// Center point of Sri Lanka
export const SRI_LANKA_CENTER: GeoLocation = {
  lat: 7.8731,
  lng: 80.7718,
};

export const DEFAULT_MAP_ZOOM = 8;

// Accurate coordinates for all 25 Sri Lankan Districts
export const SRI_LANKA_DISTRICTS: Record<string, DistrictCenter> = {
  Colombo: { name: 'Colombo', province: 'Western', lat: 6.9271, lng: 79.8612, zoom: 12 },
  Gampaha: { name: 'Gampaha', province: 'Western', lat: 7.084, lng: 79.9939, zoom: 11 },
  Kalutara: { name: 'Kalutara', province: 'Western', lat: 6.5854, lng: 79.9607, zoom: 11 },
  Kandy: { name: 'Kandy', province: 'Central', lat: 7.2906, lng: 80.6337, zoom: 12 },
  Matale: { name: 'Matale', province: 'Central', lat: 7.4675, lng: 80.6234, zoom: 11 },
  'Nuwara Eliya': { name: 'Nuwara Eliya', province: 'Central', lat: 6.9497, lng: 80.7891, zoom: 12 },
  Galle: { name: 'Galle', province: 'Southern', lat: 6.0535, lng: 80.221, zoom: 12 },
  Matara: { name: 'Matara', province: 'Southern', lat: 5.9549, lng: 80.555, zoom: 12 },
  Hambantota: { name: 'Hambantota', province: 'Southern', lat: 6.1248, lng: 81.1185, zoom: 11 },
  Jaffna: { name: 'Jaffna', province: 'Northern', lat: 9.6615, lng: 80.0255, zoom: 12 },
  Kilinochchi: { name: 'Kilinochchi', province: 'Northern', lat: 9.3803, lng: 80.377, zoom: 11 },
  Mannar: { name: 'Mannar', province: 'Northern', lat: 8.981, lng: 79.9044, zoom: 11 },
  Vavuniya: { name: 'Vavuniya', province: 'Northern', lat: 8.7542, lng: 80.4982, zoom: 11 },
  Mullaitivu: { name: 'Mullaitivu', province: 'Northern', lat: 9.2671, lng: 80.8142, zoom: 11 },
  Batticaloa: { name: 'Batticaloa', province: 'Eastern', lat: 7.731, lng: 81.6747, zoom: 12 },
  Ampara: { name: 'Ampara', province: 'Eastern', lat: 7.2912, lng: 81.6724, zoom: 11 },
  Trincomalee: { name: 'Trincomalee', province: 'Eastern', lat: 8.5874, lng: 81.2152, zoom: 12 },
  Kurunegala: { name: 'Kurunegala', province: 'North Western', lat: 7.4863, lng: 80.3623, zoom: 11 },
  Puttalam: { name: 'Puttalam', province: 'North Western', lat: 8.0362, lng: 79.8283, zoom: 11 },
  Anuradhapura: { name: 'Anuradhapura', province: 'North Central', lat: 8.3114, lng: 80.4037, zoom: 11 },
  Polonnaruwa: { name: 'Polonnaruwa', province: 'North Central', lat: 7.9403, lng: 81.0188, zoom: 11 },
  Badulla: { name: 'Badulla', province: 'Uva', lat: 6.9934, lng: 81.055, zoom: 11 },
  Monaragala: { name: 'Monaragala', province: 'Uva', lat: 6.8728, lng: 81.3507, zoom: 11 },
  Ratnapura: { name: 'Ratnapura', province: 'Sabaragamuwa', lat: 6.6828, lng: 80.4037, zoom: 11 },
  Kegalle: { name: 'Kegalle', province: 'Sabaragamuwa', lat: 7.2513, lng: 80.3464, zoom: 11 },
};

// Additional key cities & suburbs in Sri Lanka
export const SRI_LANKA_CITIES: Record<string, GeoLocation> = {
  Negombo: { lat: 7.2008, lng: 79.8736 },
  Dehiwala: { lat: 6.8517, lng: 79.8656 },
  'Mount Lavinia': { lat: 6.8378, lng: 79.8667 },
  Moratuwa: { lat: 6.773, lng: 79.8816 },
  Maharagama: { lat: 6.8485, lng: 79.9269 },
  Kottawa: { lat: 6.8415, lng: 79.9654 },
  Kaduwela: { lat: 6.9328, lng: 79.9822 },
  Malabe: { lat: 6.9042, lng: 79.9547 },
  Nugegoda: { lat: 6.8649, lng: 79.8997 },
  Battaramulla: { lat: 6.8998, lng: 79.9169 },
  Wattala: { lat: 6.9897, lng: 79.892 },
  JaEla: { lat: 7.0786, lng: 79.8917 },
  Panadura: { lat: 6.7132, lng: 79.9074 },
  Horana: { lat: 6.7148, lng: 80.0632 },
  Beruwala: { lat: 6.4788, lng: 79.9828 },
  Bentota: { lat: 6.4259, lng: 79.9958 },
  Hikkaduwa: { lat: 6.1395, lng: 80.1063 },
  Weligama: { lat: 5.9729, lng: 80.4287 },
  Tangalle: { lat: 6.0244, lng: 80.7941 },
  Dambulla: { lat: 7.8742, lng: 80.6511 },
  Ella: { lat: 6.8667, lng: 81.0466 },
  Bandarawela: { lat: 6.8258, lng: 80.9982 },
  Chilaw: { lat: 7.5758, lng: 79.7953 },
  Kuliyapitiya: { lat: 7.4688, lng: 80.0401 },
  Avissawella: { lat: 6.9536, lng: 80.2078 },
  Embilipitiya: { lat: 6.3387, lng: 80.8522 },
};

/**
 * Deterministic pseudo-random jitter based on listing ID string.
 * Spreads pins slightly so multiple ads in the same city don't completely overlap.
 */
function getDeterministicJitter(id: string): { latJitter: number; lngJitter: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const normalized1 = ((hash % 1000) / 1000) - 0.5; // -0.5 to 0.5
  const normalized2 = (((hash >> 3) % 1000) / 1000) - 0.5;

  // Approx ~300-800 meters jitter range
  return {
    latJitter: normalized1 * 0.015,
    lngJitter: normalized2 * 0.015,
  };
}

/**
 * Resolve accurate latitude & longitude for a listing.
 */
export function getListingCoordinates(listing: Listing): GeoLocation {
  if (typeof listing.lat === 'number' && typeof listing.lng === 'number' && !isNaN(listing.lat) && !isNaN(listing.lng)) {
    return { lat: listing.lat, lng: listing.lng };
  }

  const locationKey = (listing.location || '').trim();
  const districtKey = (listing.district || '').trim();

  // Try city first
  if (locationKey && SRI_LANKA_CITIES[locationKey]) {
    const base = SRI_LANKA_CITIES[locationKey];
    const jitter = getDeterministicJitter(listing.id || 'seed');
    return {
      lat: base.lat + jitter.latJitter,
      lng: base.lng + jitter.lngJitter,
    };
  }

  // Try district next
  const targetDistrict = SRI_LANKA_DISTRICTS[districtKey] || SRI_LANKA_DISTRICTS[locationKey];
  if (targetDistrict) {
    const jitter = getDeterministicJitter(listing.id || 'seed');
    return {
      lat: targetDistrict.lat + jitter.latJitter,
      lng: targetDistrict.lng + jitter.lngJitter,
    };
  }

  // Fallback to Colombo with jitter
  const colombo = SRI_LANKA_DISTRICTS['Colombo'];
  const jitter = getDeterministicJitter(listing.id || 'seed');
  return {
    lat: colombo.lat + jitter.latJitter,
    lng: colombo.lng + jitter.lngJitter,
  };
}

/**
 * Standard Haversine distance in kilometers between two geo points.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
 * Format distance into friendly string (e.g., "1.4 km away" or "650 m away").
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m away`;
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km away`;
  }
  return `${Math.round(distanceKm)} km away`;
}

/**
 * Generate a Google Maps web directions link from user location (or current) to destination.
 */
export function getGoogleMapsDirectionsUrl(
  destLat: number,
  destLng: number,
  destinationName?: string
): string {
  const query = destinationName ? encodeURIComponent(destinationName) : `${destLat},${destLng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&destination_place_id=&travelmode=driving`;
}
