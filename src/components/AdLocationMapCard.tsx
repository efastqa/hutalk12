import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
} from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Compass, ExternalLink, ShieldCheck } from 'lucide-react';
import { Listing } from '../types';
import {
  getListingCoordinates,
  calculateDistanceKm,
  formatDistance,
  getGoogleMapsDirectionsUrl,
  GeoLocation,
} from '../utils/geoUtils';

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyDUSGKV8Bx619Wm4mB_u34hf8XQta9PGbY';

interface AdLocationMapCardProps {
  listing: Listing;
}

export const AdLocationMapCard: React.FC<AdLocationMapCardProps> = ({ listing }) => {
  const coords = getListingCoordinates(listing);
  const [userLocation, setUserLocation] = useState<GeoLocation | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  useEffect(() => {
    // Attempt non-intrusive geolocation read if permission was already granted
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        if (result.state === 'granted') {
          navigator.geolocation.getCurrentPosition((pos) => {
            const uLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(uLoc);
            const dist = calculateDistanceKm(uLoc.lat, uLoc.lng, coords.lat, coords.lng);
            setDistanceKm(dist);
          });
        }
      }).catch(() => {});
    }
  }, [coords.lat, coords.lng]);

  const handleCalculateDistance = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const uLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(uLoc);
      const dist = calculateDistanceKm(uLoc.lat, uLoc.lng, coords.lat, coords.lng);
      setDistanceKm(dist);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-[#FF5A36]">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Item Location & Vicinity
            </h4>
            <p className="text-xs text-gray-500 font-medium">
              {listing.location || listing.district || 'Sri Lanka'}
              {listing.district && listing.location !== listing.district ? ` • ${listing.district}` : ''}
            </p>
          </div>
        </div>

        {distanceKm !== null ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
            <Navigation className="w-3.5 h-3.5 fill-current" />
            <span>{formatDistance(distanceKm)}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCalculateDistance}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold transition-colors cursor-pointer"
            title="Check distance from your current location"
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>Calculate Distance</span>
          </button>
        )}
      </div>

      {/* Embedded Interactive Map */}
      <div className="relative w-full h-44 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
        <APIProvider
          apiKey={GOOGLE_MAPS_API_KEY}
          solutionChannel="GMP_visgl_reactgooglemaps_v1"
          region="LK"
          language="en"
        >
          <Map
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            defaultCenter={coords}
            defaultZoom={13}
            gestureHandling="cooperative"
            disableDefaultUI={true}
            style={{ width: '100%', height: '100%' }}
          >
            <AdvancedMarker position={coords} title={listing.title}>
              <div className="w-7 h-7 rounded-full bg-[#FF5A36] border-2 border-white shadow-lg flex items-center justify-center text-white">
                <MapPin className="w-4 h-4 fill-white" />
              </div>
            </AdvancedMarker>

            {userLocation && (
              <AdvancedMarker position={userLocation} title="Your Location">
                <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center" />
              </AdvancedMarker>
            )}
          </Map>
        </APIProvider>

        {/* Dedicated Google Maps Attribution Line (GMP Agent Directive) */}
        <div className="absolute bottom-1 right-1 pointer-events-none z-10">
          <span className="text-[9px] text-gray-500 font-mono bg-white/70 px-1 rounded">
            Google Maps
          </span>
        </div>
      </div>

      {/* Safe Public Meeting Suggestion & Directions Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-[11px]">Recommended: Meet at a safe public spot in this area</span>
        </div>

        <a
          href={getGoogleMapsDirectionsUrl(coords.lat, coords.lng, listing.title)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-2xs ml-auto"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Get Driving Directions</span>
          <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
        </a>
      </div>
    </div>
  );
};
