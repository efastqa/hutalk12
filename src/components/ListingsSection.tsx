import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Listing } from '../types';
import { DualToneHeading } from './DualToneHeading';
import { InteractiveMapDiscovery } from './InteractiveMapDiscovery';
import {
  Star,
  Zap,
  Heart,
  MapPin,
  Clock,
  Eye,
  Inbox,
  ArrowUpDown,
  ShieldCheck,
  Wrench,
  PlusCircle,
  Sparkles,
  RotateCcw,
  Images,
  ArrowLeftRight,
  Film,
  Play,
  LayoutGrid,
  Compass,
  Navigation,
  Car,
  Home,
  Smartphone,
  Briefcase,
  Fuel,
  Tag,
  SlidersHorizontal,
  Check,
} from 'lucide-react';

interface ListingsSectionProps {
  listings: Listing[];
  sortBy: string;
  onSortChange: (sort: string) => void;
  favorites: string[];
  onToggleFavorite: (adId: string) => void;
  onSelectListing: (listing: Listing) => void;
  isLoading: boolean;
  onOpenPostAd?: () => void;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
  currentCategory?: string;
  onSelectCategory?: (category: string) => void;
  compareIds?: string[];
  onToggleCompare?: (listing: Listing) => void;
  viewMode?: 'grid' | 'map';
  onViewModeChange?: (mode: 'grid' | 'map') => void;
  selectedDistrict?: string;
}

export function formatLKR(amount: number): string {
  return 'Rs ' + Number(amount).toLocaleString('en-LK');
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 24,
    },
  },
};

export const ListingsSection: React.FC<ListingsSectionProps> = ({
  listings,
  sortBy,
  onSortChange,
  favorites,
  onToggleFavorite,
  onSelectListing,
  isLoading,
  onOpenPostAd,
  hasActiveFilters,
  onResetFilters,
  currentCategory = 'All',
  onSelectCategory,
  compareIds = [],
  onToggleCompare,
  viewMode,
  onViewModeChange,
  selectedDistrict,
}) => {
  const [localViewMode, setLocalViewMode] = useState<'grid' | 'map'>(viewMode || 'grid');
  const currentViewMode = viewMode !== undefined ? viewMode : localViewMode;

  // Category-Specific Local Filters
  const [fuelFilter, setFuelFilter] = useState<string>('all');
  const [transmissionFilter, setTransmissionFilter] = useState<string>('all');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');

  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
  const [bedroomsFilter, setBedroomsFilter] = useState<string>('all');

  const [electronicsSubcategoryFilter, setElectronicsSubcategoryFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');

  const [jobTypeFilter, setJobTypeFilter] = useState<string>('all');
  const [serviceTradeFilter, setServiceTradeFilter] = useState<string>('all');
  const [emergencyOnlyFilter, setEmergencyOnlyFilter] = useState<boolean>(false);

  // Reset category filters when switching main category
  useEffect(() => {
    setFuelFilter('all');
    setTransmissionFilter('all');
    setVehicleTypeFilter('all');
    setPropertyTypeFilter('all');
    setBedroomsFilter('all');
    setElectronicsSubcategoryFilter('all');
    setConditionFilter('all');
    setJobTypeFilter('all');
    setServiceTradeFilter('all');
    setEmergencyOnlyFilter(false);
  }, [currentCategory]);

  const hasCategoryFilters = useMemo(() => {
    return (
      fuelFilter !== 'all' ||
      transmissionFilter !== 'all' ||
      vehicleTypeFilter !== 'all' ||
      propertyTypeFilter !== 'all' ||
      bedroomsFilter !== 'all' ||
      electronicsSubcategoryFilter !== 'all' ||
      conditionFilter !== 'all' ||
      jobTypeFilter !== 'all' ||
      serviceTradeFilter !== 'all' ||
      emergencyOnlyFilter
    );
  }, [
    fuelFilter,
    transmissionFilter,
    vehicleTypeFilter,
    propertyTypeFilter,
    bedroomsFilter,
    electronicsSubcategoryFilter,
    conditionFilter,
    jobTypeFilter,
    serviceTradeFilter,
    emergencyOnlyFilter,
  ]);

  const resetCategoryFilters = () => {
    setFuelFilter('all');
    setTransmissionFilter('all');
    setVehicleTypeFilter('all');
    setPropertyTypeFilter('all');
    setBedroomsFilter('all');
    setElectronicsSubcategoryFilter('all');
    setConditionFilter('all');
    setJobTypeFilter('all');
    setServiceTradeFilter('all');
    setEmergencyOnlyFilter(false);
  };

  const displayListings = useMemo(() => {
    return listings.filter((item) => {
      // Vehicles / Motorcycles
      if (fuelFilter !== 'all' && item.fuelType && item.fuelType.toLowerCase() !== fuelFilter.toLowerCase()) {
        return false;
      }
      if (transmissionFilter !== 'all' && item.transmission && item.transmission.toLowerCase() !== transmissionFilter.toLowerCase()) {
        return false;
      }
      if (vehicleTypeFilter !== 'all' && item.vehicleType && !item.vehicleType.toLowerCase().includes(vehicleTypeFilter.toLowerCase())) {
        return false;
      }

      // Property
      if (propertyTypeFilter !== 'all' && item.propertyType && !item.propertyType.toLowerCase().includes(propertyTypeFilter.toLowerCase())) {
        return false;
      }
      if (bedroomsFilter !== 'all') {
        const b = Number(item.bedrooms) || 0;
        if (bedroomsFilter === '4+' ? b < 4 : b !== Number(bedroomsFilter)) {
          return false;
        }
      }

      // Electronics
      if (electronicsSubcategoryFilter !== 'all' && item.electronicsSubcategory && !item.electronicsSubcategory.toLowerCase().includes(electronicsSubcategoryFilter.toLowerCase())) {
        return false;
      }
      if (conditionFilter !== 'all') {
        if (conditionFilter === 'Brand New' && item.itemCondition !== 'Brand New') return false;
        if (conditionFilter === 'Used' && item.itemCondition && item.itemCondition === 'Brand New') return false;
      }

      // Jobs
      if (jobTypeFilter !== 'all' && item.jobType && !item.jobType.toLowerCase().includes(jobTypeFilter.toLowerCase())) {
        return false;
      }

      // Services
      if (serviceTradeFilter !== 'all' && item.serviceTrade && !item.serviceTrade.toLowerCase().includes(serviceTradeFilter.toLowerCase())) {
        return false;
      }
      if (emergencyOnlyFilter && !item.isEmergency247) {
        return false;
      }

      return true;
    });
  }, [
    listings,
    fuelFilter,
    transmissionFilter,
    vehicleTypeFilter,
    propertyTypeFilter,
    bedroomsFilter,
    electronicsSubcategoryFilter,
    conditionFilter,
    jobTypeFilter,
    serviceTradeFilter,
    emergencyOnlyFilter,
  ]);

  const handleSwitchView = (mode: 'grid' | 'map') => {
    setLocalViewMode(mode);
    if (onViewModeChange) onViewModeChange(mode);
  };

  const isNewAd = (dateStr: string) => {
    try {
      const created = new Date(dateStr).getTime();
      const now = new Date().getTime();
      return (now - created) / (1000 * 60 * 60 * 24) <= 1.5;
    } catch {
      return false;
    }
  };

  return (
    <section id="marketplace-listings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 scroll-mt-20">
      {/* Qatar Living style Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-5 scrollbar-none border-b border-gray-200">
        {[
          { id: 'All', label: 'All Ads' },
          { id: 'Property', label: 'Properties' },
          { id: 'Vehicles', label: 'Vehicles' },
          { id: 'Electronics', label: 'Classifieds' },
          { id: 'Home & Garden', label: 'Home & Garden' },
          { id: 'Jobs', label: 'Jobs' },
          { id: 'Services', label: 'Services' },
        ].map((cat) => {
          const isActive = (currentCategory || 'All') === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory && onSelectCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#FF5A36] text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Dynamic Category-Specific Filter Bar (Custom Category Fields) */}
      {(currentCategory === 'Vehicles' ||
        currentCategory === 'Motorcycles' ||
        currentCategory === 'Property' ||
        currentCategory === 'Electronics' ||
        currentCategory === 'Jobs' ||
        currentCategory === 'Services') && (
        <div className="mb-6 p-3.5 bg-gray-50/90 rounded-2xl border border-gray-200/90 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>Specific {currentCategory} Filters</span>
              {hasCategoryFilters && (
                <span className="bg-[#FF5A36] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  Active
                </span>
              )}
            </span>

            {hasCategoryFilters && (
              <button
                type="button"
                onClick={resetCategoryFilters}
                className="text-xs font-bold text-[#FF5A36] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset {currentCategory} Filters</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Vehicles / Motorcycles filters */}
            {(currentCategory === 'Vehicles' || currentCategory === 'Motorcycles') && (
              <>
                {/* Fuel Filter */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-500 px-2 flex items-center gap-1">
                    <Fuel className="w-3 h-3 text-amber-500" />
                    <span>Fuel:</span>
                  </span>
                  {['all', 'Petrol', 'Diesel', 'Hybrid', 'Electric'].map((fuel) => (
                    <button
                      key={fuel}
                      type="button"
                      onClick={() => setFuelFilter(fuel)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        fuelFilter === fuel
                          ? 'bg-[#181920] text-white font-bold shadow-2xs'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {fuel === 'all' ? 'All' : fuel}
                    </button>
                  ))}
                </div>

                {/* Transmission Filter */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-500 px-2">Gear:</span>
                  {['all', 'Automatic', 'Manual'].map((trans) => (
                    <button
                      key={trans}
                      type="button"
                      onClick={() => setTransmissionFilter(trans)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        transmissionFilter === trans
                          ? 'bg-[#181920] text-white font-bold shadow-2xs'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {trans === 'all' ? 'All' : trans}
                    </button>
                  ))}
                </div>

                {/* Vehicle Body Type */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-500 px-2 flex items-center gap-1">
                    <Car className="w-3 h-3 text-blue-500" />
                    <span>Type:</span>
                  </span>
                  {['all', 'Car', 'SUV', 'Van', 'Three-Wheeler'].map((vtype) => (
                    <button
                      key={vtype}
                      type="button"
                      onClick={() => setVehicleTypeFilter(vtype)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        vehicleTypeFilter === vtype
                          ? 'bg-[#181920] text-white font-bold shadow-2xs'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {vtype === 'all' ? 'All' : vtype}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Property filters */}
            {currentCategory === 'Property' && (
              <>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-500 px-2 flex items-center gap-1">
                    <Home className="w-3 h-3 text-emerald-500" />
                    <span>Property:</span>
                  </span>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'House', label: 'Houses' },
                    { id: 'Land', label: 'Lands' },
                    { id: 'Apartment', label: 'Apartments' },
                    { id: 'Commercial', label: 'Commercial' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPropertyTypeFilter(p.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        propertyTypeFilter === p.id
                          ? 'bg-[#181920] text-white font-bold shadow-2xs'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Bedrooms */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-500 px-2">Beds:</span>
                  {['all', '1', '2', '3', '4+'].map((beds) => (
                    <button
                      key={beds}
                      type="button"
                      onClick={() => setBedroomsFilter(beds)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        bedroomsFilter === beds
                          ? 'bg-[#181920] text-white font-bold shadow-2xs'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {beds === 'all' ? 'Any' : `${beds} Beds`}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Electronics filters */}
            {currentCategory === 'Electronics' && (
              <>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-500 px-2 flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-indigo-500" />
                    <span>Device:</span>
                  </span>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'Phone', label: 'Smartphones' },
                    { id: 'Laptop', label: 'Laptops' },
                    { id: 'TV', label: 'TVs & Audio' },
                    { id: 'Camera', label: 'Cameras' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setElectronicsSubcategoryFilter(d.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        electronicsSubcategoryFilter === d.id
                          ? 'bg-[#181920] text-white font-bold shadow-2xs'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-500 px-2">Condition:</span>
                  {['all', 'Brand New', 'Used'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setConditionFilter(c)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        conditionFilter === c
                          ? 'bg-[#181920] text-white font-bold shadow-2xs'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {c === 'all' ? 'All' : c}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Jobs filters */}
            {currentCategory === 'Jobs' && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
                <span className="text-[11px] font-bold text-gray-500 px-2 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-sky-500" />
                  <span>Job Type:</span>
                </span>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'Full-time', label: 'Full-time' },
                  { id: 'Part-time', label: 'Part-time' },
                  { id: 'Remote', label: 'Remote / WFH' },
                  { id: 'Contract', label: 'Contract' },
                ].map((j) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => setJobTypeFilter(j.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      jobTypeFilter === j.id
                        ? 'bg-[#181920] text-white font-bold shadow-2xs'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {j.label}
                  </button>
                ))}
              </div>
            )}

            {/* Services filters */}
            {currentCategory === 'Services' && (
              <>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-500 px-2 flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-blue-500" />
                    <span>Trade:</span>
                  </span>
                  {[
                    { id: 'all', label: 'All Trades' },
                    { id: 'AC Repair', label: 'AC Repair' },
                    { id: 'Plumbing', label: 'Plumbing' },
                    { id: 'Electrician', label: 'Electrician' },
                    { id: 'Cleaning', label: 'Cleaning' },
                    { id: 'Automotive', label: 'Automotive' },
                  ].map((tr) => (
                    <button
                      key={tr.id}
                      type="button"
                      onClick={() => setServiceTradeFilter(tr.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        serviceTradeFilter === tr.id
                          ? 'bg-[#181920] text-white font-bold shadow-2xs'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {tr.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setEmergencyOnlyFilter(!emergencyOnlyFilter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    emergencyOnlyFilter
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50'
                  }`}
                >
                  <span>⚡ 24/7 Emergency Only</span>
                  {emergencyOnlyFilter && <Check className="w-3 h-3" />}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-3 border-b border-gray-200"
      >
        <div>
          <DualToneHeading
            as="h2"
            size="lg"
            theme="light"
            primaryText="Available"
            accentText={['Advertisements', 'Verified Ads', 'Classified Deals']}
            animationType="rotate"
            rotationInterval={4200}
            align="left"
            showUnderline={false}
            subtitle="Verified marketplace listings with seller telephone & direct WhatsApp"
            id="listings-dual-tone-heading"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle: Grid vs Map */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => handleSwitchView('grid')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                currentViewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchView('map')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer relative ${
                currentViewMode === 'map'
                  ? 'bg-[#FF5A36] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-current" />
              <span>Map & Near Me</span>
              <span className="text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                Live
              </span>
            </button>
          </div>

          <span className="text-xs sm:text-sm text-gray-500 font-medium">
            Showing <strong className="text-gray-900">{listings.length}</strong> ad(s)
          </span>

          <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 shadow-xs text-xs sm:text-sm">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent border-none outline-none font-medium text-gray-700 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Conditional: Interactive Map View vs Standard Grid */}
      {currentViewMode === 'map' ? (
        <InteractiveMapDiscovery
          listings={displayListings}
          onSelectListing={onSelectListing}
          initialCategory={currentCategory}
          initialDistrict={selectedDistrict}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-200 w-full" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-5 bg-gray-200 rounded w-4/5" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : displayListings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center py-14 px-6 bg-white rounded-3xl border border-dashed border-gray-300 shadow-xs max-w-2xl mx-auto"
        >
          {(hasActiveFilters || hasCategoryFilters) ? (
            <>
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-800">No advertisements match your filters</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                We couldn't find any listings matching your active filters. Try adjusting your search keyword, category, or district.
              </p>
              <div className="mt-5 flex items-center justify-center gap-2">
                {hasCategoryFilters && (
                  <button
                    type="button"
                    onClick={resetCategoryFilters}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF5A36] hover:bg-[#E04826] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear {currentCategory} Filters</span>
                  </button>
                )}
                {onResetFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      resetCategoryFilters();
                      onResetFilters();
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#FF5A36] mx-auto flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">
                Fresh Marketplace Launch
              </h3>
              <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto leading-relaxed font-medium">
                The marketplace is live, clean, and ready! Be the first seller to list your vehicle, property, electronics, or trade service across Sri Lanka.
              </p>
              {onOpenPostAd && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onOpenPostAd}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF5A36] hover:bg-[#E04826] text-white font-extrabold rounded-2xl text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Post The First Advertisement</span>
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      ) : (
        <motion.div
          variants={listContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6"
        >
          {displayListings.map((item) => {
            const isFav = favorites.includes(item.id);
            const isCompared = compareIds?.includes(item.id) || false;
            const isNew = isNewAd(item.date);

            return (
              <motion.div
                key={item.id}
                variants={cardItemVariants}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                onClick={() => onSelectListing(item)}
                className="group bg-white rounded-2xl border border-gray-200 hover:border-[#FF5A36] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col relative"
              >
                {/* Badges */}
                <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
                  {item.availabilityStatus === 'sold' && (
                    <span className="inline-flex items-center gap-1 bg-rose-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-md">
                      Sold
                    </span>
                  )}
                  {item.availabilityStatus === 'reserved' && (
                    <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-md">
                      Reserved
                    </span>
                  )}
                  {item.videoUrl && (
                    <span className="inline-flex items-center gap-1 bg-purple-700/90 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-md backdrop-blur-xs">
                      <Film className="w-3 h-3 text-purple-200" />
                      <span>Video Ad</span>
                    </span>
                  )}
                  {item.isFeatured && (
                    <span className="inline-flex items-center gap-1 bg-[#FF5A36] text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-md animate-pulse">
                      <Star className="w-3 h-3 fill-current" />
                      Featured
                    </span>
                  )}
                  {item.isVerifiedPro && (
                    <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                      <ShieldCheck className="w-3 h-3" />
                      Verified Pro
                    </span>
                  )}
                  {item.isEmergency247 && (
                    <span className="inline-flex items-center gap-0.5 bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                      ⚡ 24/7
                    </span>
                  )}
                  {isNew && !item.isVerifiedPro && !item.isEmergency247 && (
                    <span className="inline-flex items-center gap-1 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm">
                      <Zap className="w-3 h-3 fill-current" />
                      New
                    </span>
                  )}
                </div>

                {/* Top Action Buttons (Compare & Favorite) */}
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                  {onToggleCompare && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompare(item);
                      }}
                      title={isCompared ? 'Remove from compare' : 'Compare this ad'}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isCompared
                          ? 'bg-[#FF5A36] text-white shadow-md scale-105 ring-2 ring-white'
                          : 'bg-black/40 text-white hover:bg-black/60'
                      }`}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </motion.button>
                  )}

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item.id);
                    }}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isFav
                        ? 'bg-rose-50 text-rose-600 shadow-sm scale-110'
                        : 'bg-black/40 text-white hover:bg-black/60'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                  </motion.button>
                </div>

                {/* Card Media (Video or Image) */}
                <div className="w-full h-44 sm:h-48 overflow-hidden bg-gray-950 relative">
                  {item.videoUrl ? (
                    <div className="w-full h-full relative">
                      <video
                        src={item.videoUrl}
                        muted
                        playsInline
                        loop
                        autoPlay
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-2.5 left-2.5 bg-purple-950/85 backdrop-blur-xs text-purple-200 border border-purple-400/40 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md pointer-events-none">
                        <Play className="w-2.5 h-2.5 fill-current text-purple-300" />
                        <span>Animation Video</span>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  )}
                  {item.images && item.images.length > 1 && !item.videoUrl && (
                    <div className="absolute bottom-2.5 right-2.5 bg-black/65 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs pointer-events-none">
                      <Images className="w-3 h-3" />
                      <span>{item.images.length}</span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#FF5A36] uppercase tracking-wider line-clamp-1">
                      {item.serviceTrade || item.category}
                    </span>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base mt-1 line-clamp-2 leading-snug group-hover:text-[#FF5A36] transition-colors">
                      {item.title}
                    </h3>

                    {/* Category Specific Specification Quick Highlights */}
                    {(item.vehicleYear || item.fuelType || item.transmission || item.vehicleMileage || item.propertyType || item.bedrooms || item.propertySize || item.electronicsSubcategory || item.storageCapacity || item.itemCondition || item.jobType) && (
                      <div className="flex flex-wrap items-center gap-1 mt-1.5 text-[11px] font-medium text-gray-500 line-clamp-1 overflow-hidden">
                        {item.vehicleYear && (
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-semibold text-[10px]">{item.vehicleYear}</span>
                        )}
                        {item.fuelType && (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.5 rounded text-[10px] font-bold">{item.fuelType}</span>
                        )}
                        {item.transmission && (
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 text-[10px]">{item.transmission}</span>
                        )}
                        {item.vehicleMileage && (
                          <span className="text-gray-500 text-[10px]">{Number(item.vehicleMileage).toLocaleString()} km</span>
                        )}
                        {item.propertyType && (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-1.5 py-0.5 rounded text-[10px] font-bold">{item.propertyType.split(' ')[0]}</span>
                        )}
                        {item.bedrooms !== undefined && item.bedrooms !== '' && (
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 text-[10px] font-semibold">{item.bedrooms} Beds</span>
                        )}
                        {item.propertySize && (
                          <span className="text-gray-500 text-[10px]">{item.propertySize}</span>
                        )}
                        {item.electronicsSubcategory && (
                          <span className="bg-indigo-50 text-indigo-800 border border-indigo-200/60 px-1.5 py-0.5 rounded text-[10px] font-bold">{item.electronicsSubcategory.split(' ')[0]}</span>
                        )}
                        {item.storageCapacity && item.storageCapacity !== 'N/A' && (
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 text-[10px] font-semibold">{item.storageCapacity}</span>
                        )}
                        {item.itemCondition && (
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 text-[10px]">{item.itemCondition}</span>
                        )}
                        {item.jobType && (
                          <span className="bg-sky-50 text-sky-800 border border-sky-200/60 px-1.5 py-0.5 rounded text-[10px] font-bold">{item.jobType}</span>
                        )}
                      </div>
                    )}
                    <div className="text-base sm:text-lg font-extrabold text-[#111217] mt-1.5">
                      {item.category === 'Services' && item.pricingType === 'quote'
                        ? 'Quote on Request'
                        : item.category === 'Services' && item.pricingType === 'hourly'
                        ? `${formatLKR(item.price)}/hr`
                        : item.category === 'Services' && item.pricingType === 'starting_at'
                        ? `From ${formatLKR(item.price)}`
                        : formatLKR(item.price)}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 font-medium text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-[#FF5A36]" />
                        {item.location}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock className="w-3 h-3" />
                        {item.date}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {item.views || 0} views
                      </span>
                      {item.sellerRating ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{item.sellerRating.toFixed(1)}</span>
                          {item.reviewCount ? (
                            <span className="text-gray-400 font-normal">({item.reviewCount})</span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="font-medium text-gray-500">
                          {item.userId === 'system' ? 'Verified Seller' : 'HUTA Member'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </section>
  );
};
