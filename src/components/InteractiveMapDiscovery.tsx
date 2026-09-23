import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Navigation,
  Compass,
  Phone,
  MessageCircle,
  ExternalLink,
  Search,
  Filter,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  X,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import { Listing } from '../types';
import {
  SRI_LANKA_CENTER,
  DEFAULT_MAP_ZOOM,
  SRI_LANKA_DISTRICTS,
  getListingCoordinates,
  calculateDistanceKm,
  formatDistance,
  getGoogleMapsDirectionsUrl,
  GeoLocation,
} from '../utils/geoUtils';
import { formatLKR } from './ListingsSection';

// API Key configuration
const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyDUSGKV8Bx619Wm4mB_u34hf8XQta9PGbY';

interface InteractiveMapDiscoveryProps {
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
  initialDistrict?: string;
  initialCategory?: string;
  onClose?: () => void;
  isModal?: boolean;
}

// Inner helper component to pan/zoom map programmatically
const MapController: React.FC<{
  targetCenter: GeoLocation | null;
  targetZoom: number | null;
}> = ({ targetCenter, targetZoom }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !targetCenter) return;
    map.panTo(targetCenter);
    if (targetZoom) {
      map.setZoom(targetZoom);
    }
  }, [map, targetCenter, targetZoom]);

  return null;
};

export const InteractiveMapDiscovery: React.FC<InteractiveMapDiscoveryProps> = ({
  listings,
  onSelectListing,
  initialDistrict,
  initialCategory,
  onClose,
  isModal = false,
}) => {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    initialDistrict && initialDistrict !== 'All Sri Lanka' ? initialDistrict : 'All Sri Lanka'
  );
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);

  // User Geolocation State
  const [userLocation, setUserLocation] = useState<GeoLocation | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Radius Filter (in Kilometers) - 0 means all distances
  const [radiusKm, setRadiusKm] = useState<number>(0);

  // Layout View Controls
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Programmatic map movement
  const [mapTarget, setMapTarget] = useState<GeoLocation | null>(null);
  const [zoomTarget, setZoomTarget] = useState<number | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => {
      if (l.category) set.add(l.category);
    });
    return ['All', ...Array.from(set)];
  }, [listings]);

  // Handle User Geolocation Request
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords: GeoLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(userCoords);
        setIsLocating(false);

        // Center map on user
        setMapTarget(userCoords);
        setZoomTarget(12);

        // By default set radius to 25km when location is found
        if (radiusKm === 0) {
          setRadiusKm(25);
        }
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = 'Could not retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission was denied. Please allow location in your browser.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Location information is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Location request timed out. Please try again.';
        }
        setLocationError(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  // Quick district selection
  const handleSelectDistrict = (districtName: string) => {
    setSelectedDistrict(districtName);
    if (districtName === 'All Sri Lanka') {
      setMapTarget(SRI_LANKA_CENTER);
      setZoomTarget(DEFAULT_MAP_ZOOM);
    } else if (SRI_LANKA_DISTRICTS[districtName]) {
      const dist = SRI_LANKA_DISTRICTS[districtName];
      setMapTarget({ lat: dist.lat, lng: dist.lng });
      setZoomTarget(dist.zoom);
    }
  };

  // Filter listings based on category, district, search term, and distance radius
  const processedListings = useMemo(() => {
    return listings
      .map((listing) => {
        const coords = getListingCoordinates(listing);
        let distanceKm: number | null = null;
        if (userLocation) {
          distanceKm = calculateDistanceKm(
            userLocation.lat,
            userLocation.lng,
            coords.lat,
            coords.lng
          );
        }
        return {
          ...listing,
          _coords: coords,
          _distanceKm: distanceKm,
        };
      })
      .filter((item) => {
        // Only active/approved listings
        if (item.status === 'rejected') return false;

        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchLoc = (item.location || '').toLowerCase().includes(q);
          const matchDist = (item.district || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchLoc && !matchDist) return false;
        }

        // Category filter
        if (selectedCategory !== 'All' && item.category !== selectedCategory) {
          return false;
        }

        // District filter (only if no radius filter is actively bounding)
        if (radiusKm === 0 && selectedDistrict !== 'All Sri Lanka') {
          const distMatch =
            item.district?.toLowerCase() === selectedDistrict.toLowerCase() ||
            item.location?.toLowerCase().includes(selectedDistrict.toLowerCase());
          if (!distMatch) return false;
        }

        // Distance radius filter (if user location is known and radius is set)
        if (userLocation && radiusKm > 0 && typeof item._distanceKm === 'number') {
          if (item._distanceKm > radiusKm) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // If user location is active, sort by nearest distance first
        if (typeof a._distanceKm === 'number' && typeof b._distanceKm === 'number') {
          return a._distanceKm - b._distanceKm;
        }
        return 0;
      });
  }, [listings, userLocation, searchTerm, selectedCategory, selectedDistrict, radiusKm]);

  // Center on clicked listing
  const handleMarkerClick = (listing: Listing & { _coords: GeoLocation }) => {
    setSelectedListing(listing);
    setMapTarget(listing._coords);
  };

  return (
    <div
      className={`relative bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-2xl flex flex-col transition-all ${
        isFullScreen
          ? 'fixed inset-0 z-50 rounded-none w-screen h-screen'
          : 'w-full h-[720px] max-h-[85vh] my-6'
      }`}
    >
      {/* Top Header Controls Bar */}
      <div className="bg-[#111217] border-b border-gray-800 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5A36] to-amber-500 flex items-center justify-center shadow-lg shadow-[#FF5A36]/20">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                <span>Interactive Geo-Discovery</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FF5A36]/20 text-[#FF5A36] border border-[#FF5A36]/30 px-2 py-0.5 rounded-full">
                  Sri Lanka Map
                </span>
              </h3>
            </div>
            <p className="text-xs text-gray-400">
              Browse ads by live location, calculate driving distance & explore nearby verified deals
            </p>
          </div>
        </div>

        {/* Action Buttons: Geolocation & Fullscreen */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Near Me GPS Button */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isLocating}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              userLocation
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
            }`}
            title="Locate my position & sort ads by distance"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-300" />
                <span>Detecting Location...</span>
              </>
            ) : userLocation ? (
              <>
                <Navigation className="w-3.5 h-3.5 text-blue-200 fill-current" />
                <span>Near My Location (Active)</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                <span>Find Near Me</span>
              </>
            )}
          </button>

          {/* Toggle Sidebar (Mobile / Compact) */}
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
            title={sidebarOpen ? 'Hide list' : 'Show list'}
          >
            <SlidersHorizontal className="w-4 h-4 text-gray-300" />
            <span className="hidden sm:inline">{sidebarOpen ? 'Hide List' : 'Show List'}</span>
          </button>

          {/* Toggle Full Screen */}
          <button
            type="button"
            onClick={() => setIsFullScreen((prev) => !prev)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors cursor-pointer"
            title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullScreen ? (
              <Minimize2 className="w-4 h-4 text-gray-300" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-300" />
            )}
          </button>

          {/* Close Modal if used inside popup */}
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Ribbon: Search, Distance Radius, Categories, Districts */}
      <div className="bg-[#181920] border-b border-gray-800 px-4 py-2.5 flex flex-wrap items-center gap-2.5 z-10">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search on map (car, iPhone, house...)"
            className="w-full pl-8.5 pr-3 py-1.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs placeholder:text-gray-500 focus:border-[#FF5A36] outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#FF5A36] text-white shadow-xs'
                  : 'bg-gray-800/80 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Radius Filter (When user location is active) */}
        {userLocation && (
          <div className="flex items-center gap-1.5 bg-blue-950/60 border border-blue-800/50 rounded-xl px-2.5 py-1 text-xs text-blue-200">
            <span className="font-bold flex items-center gap-1">
              <Navigation className="w-3 h-3 text-blue-400" />
              <span>Radius:</span>
            </span>
            {[
              { val: 0, label: 'All LK' },
              { val: 10, label: '10 km' },
              { val: 25, label: '25 km' },
              { val: 50, label: '50 km' },
            ].map((rad) => (
              <button
                key={rad.val}
                type="button"
                onClick={() => setRadiusKm(rad.val)}
                className={`px-2 py-0.5 rounded-md font-bold text-[11px] cursor-pointer transition-colors ${
                  radiusKm === rad.val
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-blue-300 hover:text-white hover:bg-blue-900/60'
                }`}
              >
                {rad.label}
              </button>
            ))}
          </div>
        )}

        {/* Quick District selector */}
        <div className="flex items-center gap-1 ml-auto overflow-x-auto scrollbar-none">
          {['All Sri Lanka', 'Colombo', 'Gampaha', 'Kandy', 'Galle', 'Kurunegala', 'Jaffna'].map(
            (dist) => (
              <button
                key={dist}
                type="button"
                onClick={() => handleSelectDistrict(dist)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  selectedDistrict === dist
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'bg-gray-800/70 text-gray-400 hover:text-gray-200'
                }`}
              >
                {dist}
              </button>
            )
          )}
        </div>
      </div>

      {/* Geolocation Error Alert if any */}
      {locationError && (
        <div className="bg-amber-950/80 border-b border-amber-800/60 px-4 py-2 text-xs text-amber-200 flex items-center justify-between gap-2 z-10">
          <span>⚠️ {locationError}</span>
          <button
            type="button"
            onClick={() => setLocationError(null)}
            className="text-amber-300 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Map & Split Listing List View */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Left Side: Scrollable Listing Drawer / Panel */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="h-full bg-[#111217] border-r border-gray-800 flex flex-col shrink-0 z-10 overflow-hidden shadow-xl"
            >
              {/* Sidebar Header Stats */}
              <div className="p-3 bg-gray-900/80 border-b border-gray-800 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    Found <strong className="text-white">{processedListings.length}</strong> Ads on Map
                  </span>
                </span>
                {userLocation && (
                  <span className="text-[10px] font-semibold text-blue-400 bg-blue-950/80 border border-blue-800/60 px-2 py-0.5 rounded-full">
                    Sorted by Distance
                  </span>
                )}
              </div>

              {/* Listings Scroll Area */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 scrollbar-thin scrollbar-thumb-gray-700">
                {processedListings.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 space-y-2">
                    <MapPin className="w-8 h-8 text-gray-600 mx-auto" />
                    <p className="text-xs font-medium">No ads found in this map radius or category.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('All');
                        setSelectedDistrict('All Sri Lanka');
                        setRadiusKm(0);
                        setMapTarget(SRI_LANKA_CENTER);
                        setZoomTarget(DEFAULT_MAP_ZOOM);
                      }}
                      className="text-xs font-bold text-[#FF5A36] hover:underline cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  processedListings.map((item) => {
                    const isSelected = selectedListing?.id === item.id;
                    const isHovered = hoveredListingId === item.id;

                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setHoveredListingId(item.id)}
                        onMouseLeave={() => setHoveredListingId(null)}
                        onClick={() => handleMarkerClick(item)}
                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                          isSelected || isHovered
                            ? 'bg-gray-800/95 border-[#FF5A36] shadow-lg shadow-[#FF5A36]/10 scale-[1.01]'
                            : 'bg-gray-900/60 hover:bg-gray-800/70 border-gray-800 text-gray-300'
                        }`}
                      >
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-black shrink-0 border border-gray-700/60">
                          <img
                            src={item.image || (item.images && item.images[0])}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute bottom-1 left-1 bg-black/80 backdrop-blur-2xs text-[9px] font-bold text-gray-300 px-1 py-0.5 rounded">
                            {item.category}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-white truncate leading-tight">
                              {item.title}
                            </h4>
                            <p className="text-sm font-black text-[#FF5A36] mt-0.5">
                              {item.pricingType === 'quote' ? 'Get Quote' : formatLKR(item.price)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-800/60">
                            <span className="flex items-center gap-1 truncate max-w-[120px]">
                              <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                              <span className="truncate">{item.location || item.district}</span>
                            </span>

                            {typeof item._distanceKm === 'number' && (
                              <span className="font-bold text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-900/50 whitespace-nowrap">
                                📍 {formatDistance(item._distanceKm)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Side: Interactive Google Map */}
        <div className="flex-1 h-full w-full relative">
          <APIProvider
            apiKey={GOOGLE_MAPS_API_KEY}
            solutionChannel="GMP_visgl_reactgooglemaps_v1"
            region="LK"
            language="en"
          >
            <Map
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              defaultCenter={SRI_LANKA_CENTER}
              defaultZoom={DEFAULT_MAP_ZOOM}
              gestureHandling="greedy"
              disableDefaultUI={false}
              className="w-full h-full"
              style={{ width: '100%', height: '100%' }}
            >
              <MapController targetCenter={mapTarget} targetZoom={zoomTarget} />

              {/* User Location Pulse Marker */}
              {userLocation && (
                <AdvancedMarker position={userLocation} title="Your current location">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping pointer-events-none" />
                    <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center z-10">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  </div>
                </AdvancedMarker>
              )}

              {/* Listing Pins */}
              {processedListings.map((item) => {
                const isSelected = selectedListing?.id === item.id;
                const isHovered = hoveredListingId === item.id;

                // Price display badge
                const displayPrice =
                  item.price > 10000000
                    ? `Rs ${(item.price / 10000000).toFixed(1)}Cr`
                    : item.price >= 1000000
                    ? `Rs ${(item.price / 1000000).toFixed(1)}M`
                    : item.price >= 1000
                    ? `Rs ${(item.price / 1000).toFixed(0)}K`
                    : `Rs ${item.price}`;

                return (
                  <AdvancedMarker
                    key={item.id}
                    position={item._coords}
                    onClick={() => handleMarkerClick(item)}
                    title={`${item.title} - ${displayPrice}`}
                  >
                    <div
                      className={`group transition-transform cursor-pointer ${
                        isSelected || isHovered ? 'scale-115 z-30' : 'scale-100 z-10'
                      }`}
                    >
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black shadow-xl border transition-all ${
                          isSelected
                            ? 'bg-[#FF5A36] text-white border-white ring-2 ring-[#FF5A36]/40 shadow-[#FF5A36]/30'
                            : isHovered
                            ? 'bg-gray-900 text-white border-[#FF5A36]'
                            : 'bg-white text-gray-900 border-gray-300 hover:border-[#FF5A36]'
                        }`}
                      >
                        <MapPin
                          className={`w-3.5 h-3.5 ${
                            isSelected ? 'text-white' : 'text-[#FF5A36]'
                          }`}
                        />
                        <span>{displayPrice}</span>
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}

              {/* Info Window for Selected Pin */}
              {selectedListing && (
                <InfoWindow
                  position={getListingCoordinates(selectedListing)}
                  onCloseClick={() => setSelectedListing(null)}
                >
                  <div className="p-1 max-w-[260px] text-gray-900 space-y-2">
                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-black">
                      <img
                        src={selectedListing.image || (selectedListing.images && selectedListing.images[0])}
                        alt={selectedListing.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1.5 left-1.5 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {selectedListing.category}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs leading-snug line-clamp-2 text-gray-900">
                        {selectedListing.title}
                      </h4>
                      <p className="text-sm font-black text-[#FF5A36] mt-0.5">
                        {selectedListing.pricingType === 'quote'
                          ? 'Get Quote'
                          : formatLKR(selectedListing.price)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-600 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-[#FF5A36]" />
                        <span>{selectedListing.location || selectedListing.district}</span>
                      </span>

                      {userLocation && (
                        <span className="font-bold text-blue-600">
                          {formatDistance(
                            calculateDistanceKm(
                              userLocation.lat,
                              userLocation.lng,
                              getListingCoordinates(selectedListing).lat,
                              getListingCoordinates(selectedListing).lng
                            )
                          )}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => onSelectListing(selectedListing)}
                        className="col-span-2 py-1.5 rounded-lg bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-bold text-center cursor-pointer transition-colors shadow-2xs"
                      >
                        View Full Details
                      </button>

                      <a
                        href={`https://wa.me/${selectedListing.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold text-center flex items-center justify-center gap-1 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href={getGoogleMapsDirectionsUrl(
                          getListingCoordinates(selectedListing).lat,
                          getListingCoordinates(selectedListing).lng,
                          selectedListing.title
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold text-center flex items-center justify-center gap-1 transition-colors"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Directions</span>
                      </a>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>

          {/* Dedicated Google Maps Attribution Line (GMP Agent Directive) */}
          <div className="absolute bottom-1 right-2 pointer-events-none z-10">
            <span className="text-[10px] text-gray-500 font-mono bg-white/70 backdrop-blur-2xs px-1.5 py-0.5 rounded">
              Google Maps
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
