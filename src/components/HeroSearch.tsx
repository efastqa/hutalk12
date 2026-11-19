import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  MapPin,
  RotateCcw,
  Sparkles,
  Home,
  Car,
  ShoppingBag,
  Wrench,
  Briefcase,
  Layers,
  MessageSquarePlus,
} from 'lucide-react';
import { HeroAd, HeroAdSettings, Listing } from '../types';
import { HeroAdBanner } from './HeroAdBanner';
import { SmartSearchTypeahead } from './SmartSearchTypeahead';
import heroLightVehiclesImg from '../assets/images/hero_light_vehicles_1794777151964.jpg';
import heroLightPropertyImg from '../assets/images/hero_light_property_1794777152485.jpg';
import heroLightElectronicsImg from '../assets/images/hero_light_electronics_1794777153011.jpg';
import heroLightLifestyleImg from '../assets/images/hero_light_lifestyle_1794777153777.jpg';

export const PRICE_PRESETS = [
  { label: 'All Prices', min: '', max: '' },
  { label: 'Under 50K', min: '', max: '50000' },
  { label: '50K - 250K', min: '50000', max: '250000' },
  { label: '250K - 1M', min: '250000', max: '1000000' },
  { label: '1M - 5M', min: '1000000', max: '5000000' },
  { label: '5M+', min: '5000000', max: '' },
];

interface HeroSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedLocation: string;
  onLocationChange: (value: string) => void;
  minPrice: string;
  onMinPriceChange: (value: string) => void;
  maxPrice: string;
  onMaxPriceChange: (value: string) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  heroAds?: HeroAd[];
  heroSettings?: HeroAdSettings;
  onOpenPostAd?: () => void;
  isAdminLoggedIn?: boolean;
  onAdminManage?: () => void;
  listings?: Listing[];
  onSelectListing?: (listing: Listing) => void;
  verifiedOnly?: boolean;
  onToggleVerifiedOnly?: () => void;
  onOpenBuyerRequests?: () => void;
  openBuyerRequestsCount?: number;
}

const DISTRICTS = [
  'All Sri Lanka',
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Monaragala',
  'Ratnapura',
  'Kegalle',
];

const SEARCH_TABS = [
  { id: 'All', label: 'All', icon: Layers },
  { id: 'Property', label: 'Properties', icon: Home },
  { id: 'Vehicles', label: 'Vehicles', icon: Car },
  { id: 'Electronics', label: 'Classifieds', icon: ShoppingBag },
  { id: 'Services', label: 'Services', icon: Wrench },
  { id: 'Jobs', label: 'Jobs', icon: Briefcase },
];

export interface LightBackgroundItem {
  id: string;
  name: string;
  tag: string;
  imageUrl: string;
  badgeText: string;
  isPanoramic?: boolean;
}

export const DEFAULT_LIGHT_BACKGROUNDS: LightBackgroundItem[] = [
  {
    id: 'colombo_skyline',
    name: 'Colombo Skyline & Island-Wide',
    tag: 'Colombo & Sri Lanka Marketplace',
    imageUrl: '/assets/aistudio/Gemini_Generated_Image_6ymi9x6ymi9x6ymi_ebb724c0.jpeg',
    badgeText: 'Colombo & Island-Wide Marketplace',
    isPanoramic: true,
  },
  {
    id: 'all_marketplace',
    name: 'Sri Lanka Marketplace',
    tag: 'All Sri Lanka Marketplace',
    imageUrl: '/assets/hero_light_bg.jpg',
    badgeText: 'All Sri Lanka Marketplace',
  },
  {
    id: 'vehicles_motors',
    name: 'Vehicles & Motors',
    tag: 'Automotive & Motors',
    imageUrl: heroLightVehiclesImg,
    badgeText: 'Vehicles & Motors',
  },
  {
    id: 'property_villas',
    name: 'Property & Holiday Homes',
    tag: 'Properties & Villas',
    imageUrl: heroLightPropertyImg,
    badgeText: 'Property & Holiday Homes',
  },
  {
    id: 'electronics',
    name: 'Electronics & Tech',
    tag: 'Electronics & Tech',
    imageUrl: heroLightElectronicsImg,
    badgeText: 'Electronics & Tech',
  },
  {
    id: 'marketplace_lifestyle',
    name: 'Services, Lifestyle & E-Stores',
    tag: 'Lifestyle & E-Stores',
    imageUrl: heroLightLifestyleImg,
    badgeText: 'Lifestyle & E-Stores',
  },
];

export const HeroSearch: React.FC<HeroSearchProps> = ({
  searchTerm,
  onSearchChange,
  selectedLocation,
  onLocationChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  onResetFilters,
  hasActiveFilters,
  selectedCategory = 'All',
  onSelectCategory,
  heroAds = [],
  heroSettings = { mode: 'default', rotationIntervalSeconds: 6 },
  onOpenPostAd,
  isAdminLoggedIn,
  onAdminManage,
  listings = [],
  onSelectListing,
  verifiedOnly = false,
  onToggleVerifiedOnly,
  onOpenBuyerRequests,
  openBuyerRequestsCount = 0,
}) => {
  // 5 Changing Background Light Images state
  const [activeBgIndex, setActiveBgIndex] = useState<number>(0);
  const [isAutoRotatePaused, setIsAutoRotatePaused] = useState<boolean>(false);

  // Auto-rotate backgrounds every 7 seconds
  useEffect(() => {
    if (isAutoRotatePaused) return;
    const interval = setInterval(() => {
      setActiveBgIndex((prev) => (prev + 1) % DEFAULT_LIGHT_BACKGROUNDS.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isAutoRotatePaused]);

  // Sync background theme with selected category tab
  useEffect(() => {
    if (selectedCategory === 'All') {
      setActiveBgIndex(0);
    } else if (
      selectedCategory === 'Vehicles' ||
      selectedCategory === 'Auto Parts' ||
      selectedCategory === 'Cars for Rent' ||
      selectedCategory === 'Motorcycles'
    ) {
      setActiveBgIndex(2);
    } else if (
      selectedCategory === 'Property' ||
      selectedCategory === 'Boardings & Annexes' ||
      selectedCategory === 'Holiday Homes'
    ) {
      setActiveBgIndex(3);
    } else if (
      selectedCategory === 'Electronics' ||
      selectedCategory === 'Phones' ||
      selectedCategory === 'Computers'
    ) {
      setActiveBgIndex(4);
    } else {
      setActiveBgIndex(5);
    }
  }, [selectedCategory]);

  const handleTabClick = (catId: string) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
  };

  return (
    <section
      onMouseEnter={() => setIsAutoRotatePaused(true)}
      onMouseLeave={() => setIsAutoRotatePaused(false)}
      className="relative bg-gradient-to-b from-white via-white to-[#F8FAFC]/50 dark:from-[#0B0C10] dark:via-[#111217] dark:to-[#0B0C10] text-[#181920] dark:text-white py-8 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-gray-200/70 dark:border-white/10 overflow-hidden w-full max-w-full contain-paint transition-colors duration-200"
    >
      {/* Changing Hero Background Images with Smooth Cross-Fade Transitions */}
      {DEFAULT_LIGHT_BACKGROUNDS.map((bg, index) => {
        const isCurrent = index === activeBgIndex;
        const isScenic = Boolean(bg.isPanoramic);
        return (
          <div
            key={bg.id}
            className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ease-in-out ${
              isCurrent ? 'opacity-100 z-0' : 'opacity-0 -z-10'
            }`}
          >
            {/* Mobile Responsive Layout */}
            <div className="md:hidden absolute inset-0 pointer-events-none overflow-hidden select-none">
              {isScenic ? (
                /* Full-width Panoramic Top Band for Scenic Skyline (bright & vivid while preserving readability) */
                <div className="absolute top-0 left-0 right-0 h-[255px] overflow-hidden">
                  <img
                    src={bg.imageUrl}
                    alt={bg.name}
                    className="w-full h-full object-cover object-center filter brightness-[1.07] contrast-[1.05] saturate-[1.15] opacity-100 dark:opacity-75"
                  />
                  {/* Balanced light/dark readability scrim fading cleanly into the search card */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/32 via-white/18 to-white/95 dark:from-[#0B0C10]/35 dark:via-[#0B0C10]/35 dark:to-[#0B0C10]" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.46)_0%,rgba(255,255,255,0.06)_68%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(11,12,16,0.52)_0%,rgba(11,12,16,0.12)_72%)]" />
                </div>
              ) : (
                /* Proportioned Top Showcase Band for Flank-Composed Light Studio Images */
                <div className="absolute top-0 left-0 right-0 h-[265px] overflow-hidden">
                  {/* Bright ambient base */}
                  <img
                    src={bg.imageUrl}
                    alt=""
                    className="w-full h-full object-cover object-center brightness-[1.05] saturate-[1.1] opacity-55 dark:opacity-25"
                  />

                  {/* Left Flank Subject */}
                  <div className="absolute left-0 top-0 bottom-0 w-[52%] overflow-hidden opacity-100 dark:opacity-65">
                    <img
                      src={bg.imageUrl}
                      alt=""
                      className="w-full h-full object-cover object-[12%_65%] filter brightness-[1.06] saturate-[1.15] contrast-[1.06]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-white/90 dark:via-[#0B0C10]/25 dark:to-[#0B0C10]/90" />
                  </div>

                  {/* Right Flank Subject */}
                  <div className="absolute right-0 top-0 bottom-0 w-[52%] overflow-hidden opacity-100 dark:opacity-65">
                    <img
                      src={bg.imageUrl}
                      alt=""
                      className="w-full h-full object-cover object-[88%_65%] filter brightness-[1.06] saturate-[1.15] contrast-[1.06]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/10 to-white/90 dark:via-[#0B0C10]/25 dark:to-[#0B0C10]/90" />
                  </div>

                  {/* Smooth bottom transition into pure surface behind Search Bar */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/20 to-white/95 dark:from-[#0B0C10]/25 dark:via-[#0B0C10]/45 dark:to-[#0B0C10]" />
                </div>
              )}
            </div>

            {/* Desktop / Tablet Unified Wide Visual (Full Panorama) */}
            <div
              className={`hidden md:block absolute inset-0 pointer-events-none overflow-hidden select-none transition-opacity duration-500 ${
                isScenic ? 'opacity-100 dark:opacity-70' : 'opacity-100 dark:opacity-55'
              }`}
            >
              <img
                src={bg.imageUrl}
                alt={bg.name}
                className="w-full h-full object-cover object-center filter brightness-[1.06] contrast-[1.05] saturate-[1.14] dark:brightness-[0.96] dark:contrast-[1.06]"
              />
              {/* Light, measured center scrim so bright photography shines while center headline & search bar stay crisp */}
              <div
                className={`absolute inset-0 ${
                  isScenic
                    ? 'bg-gradient-to-t from-white/90 via-white/28 to-white/20 dark:from-[#0B0C10] dark:via-[#0B0C10]/50 dark:to-[#0B0C10]/30'
                    : 'bg-gradient-to-t from-white/88 via-white/16 to-white/10 dark:from-[#0B0C10] dark:via-[#0B0C10]/55 dark:to-[#0B0C10]/35'
                }`}
              />
              <div
                className={`absolute inset-0 ${
                  isScenic
                    ? 'bg-gradient-to-r from-transparent via-white/48 to-transparent dark:from-transparent dark:via-[#0B0C10]/52 dark:to-transparent'
                    : 'bg-gradient-to-r from-transparent via-white/30 to-transparent dark:from-transparent dark:via-[#0B0C10]/48 dark:to-transparent'
                }`}
              />
            </div>
          </div>
        );
      })}

      {/* Ambient background glows for luxurious depth */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.1, 0.18, 0.1],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/2 -left-28 w-96 h-96 bg-[#FF5A36] rounded-full blur-[110px] pointer-events-none -translate-y-1/2 transform-gpu will-change-transform"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.08, 0.15, 0.08],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.5,
        }}
        className="absolute -top-12 -right-16 w-[420px] h-[420px] bg-[#FF7A59] rounded-full blur-[120px] pointer-events-none transform-gpu will-change-transform"
      />

      <div className="relative max-w-5xl mx-auto space-y-6 text-center">
        {/* Hero Title & Admin Animated Ads Slot */}
        <div className="drop-shadow-[0_1px_14px_rgba(255,255,255,0.92)] dark:drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
          <HeroAdBanner
            heroAds={heroAds}
            heroSettings={heroSettings}
            onSelectCategory={onSelectCategory}
            onOpenPostAd={onOpenPostAd}
            isAdminLoggedIn={isAdminLoggedIn}
            onAdminManage={onAdminManage}
          />
        </div>

        {/* Qatar Living Signature Tabbed Search Card */}
        <div className="max-w-4xl mx-auto">
          {/* Top Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none px-1">
            {SEARCH_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white dark:bg-[#151822] text-[#FF5A36] border-t-2 border-[#FF5A36] shadow-sm'
                      : 'bg-white/70 dark:bg-[#151822]/65 backdrop-blur-xs text-gray-700 dark:text-gray-200 hover:text-gray-950 dark:hover:text-white hover:bg-white/90 dark:hover:bg-[#151822]/85'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF5A36]' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
            {onOpenBuyerRequests && (
              <button
                type="button"
                id="hero-looking-for-tab-btn"
                onClick={onOpenBuyerRequests}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold text-[#FF5A36] bg-white/85 dark:bg-[#151822]/80 backdrop-blur-xs hover:bg-[#FF5A36] hover:text-white transition-all cursor-pointer whitespace-nowrap"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>
                  Looking For{openBuyerRequestsCount > 0 ? ` (${openBuyerRequestsCount})` : ''}
                </span>
              </button>
            )}
          </div>

          {/* Main Search Bar Box - Frosted Glass with Deep Shadow */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white/90 dark:bg-[#151822]/90 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 p-2.5 sm:p-3 rounded-2xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-stretch gap-2 text-left transition-colors"
          >
            {/* Smart Typeahead & Autocomplete Input */}
            <SmartSearchTypeahead
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
              listings={listings}
              onSelectListing={onSelectListing}
              onSelectCategory={onSelectCategory}
              onSelectLocation={onLocationChange}
              onSubmitSearch={() => {
                const el = document.getElementById('marketplace-listings');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Location Selector */}
            <div className="flex items-center gap-2 bg-gray-100/70 dark:bg-[#1E2230]/90 px-3.5 py-2.5 rounded-xl md:w-52 shrink-0 border border-gray-200/80 dark:border-white/5 focus-within:border-[#FF5A36] focus-within:ring-2 focus-within:ring-[#FF5A36]/20 transition-all">
              <MapPin className="w-4 h-4 text-[#FF5A36] shrink-0" />
              <select
                value={selectedLocation}
                onChange={(e) => onLocationChange(e.target.value)}
                className="bg-transparent border-none outline-none text-gray-800 dark:text-white text-xs sm:text-sm w-full cursor-pointer font-medium"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d} className="bg-white dark:bg-[#181920] text-gray-900 dark:text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="flex items-center gap-2 bg-gray-100/70 dark:bg-[#1E2230]/90 px-3 py-2 rounded-xl md:w-56 shrink-0 border border-gray-200/80 dark:border-white/5 focus-within:border-[#FF5A36] focus-within:ring-2 focus-within:ring-[#FF5A36]/20 transition-all">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">Rs</span>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => onMinPriceChange(e.target.value)}
                className="bg-white dark:bg-[#151822] border border-gray-300 dark:border-[#3D3F4A] rounded px-2 py-1 text-gray-900 dark:text-white text-xs w-full outline-none focus:border-[#FF5A36]"
              />
              <span className="text-gray-400 text-xs">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(e.target.value)}
                className="bg-white dark:bg-[#151822] border border-gray-300 dark:border-[#3D3F4A] rounded px-2 py-1 text-gray-900 dark:text-white text-xs w-full outline-none focus:border-[#FF5A36]"
              />
            </div>

            {/* Search Action CTA (Qatar Living Style) */}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('marketplace-listings');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#FF5A36] via-[#FF623E] to-[#FF7A59] hover:from-[#E04826] hover:to-[#FF5A36] text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-[#FF5A36]/30 hover:shadow-lg hover:shadow-[#FF5A36]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>

            {/* Reset Filters CTA if filtered */}
            {hasActiveFilters && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onResetFilters}
                title="Reset Search Filters"
                className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-[#22242F] hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </motion.button>
            )}
          </motion.div>

          {/* 1-Tap Quick Budget Presets */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 px-1 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              <span className="text-gray-500 dark:text-gray-400 font-bold shrink-0">Budget:</span>
              {PRICE_PRESETS.map((p) => {
                const isSelected = minPrice === p.min && maxPrice === p.max;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        onMinPriceChange('');
                        onMaxPriceChange('');
                      } else {
                        onMinPriceChange(p.min);
                        onMaxPriceChange(p.max);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      isSelected
                        ? 'bg-[#FF5A36] text-white border-[#FF5A36] shadow-xs'
                        : 'bg-white/80 dark:bg-[#151822]/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#2D303E] hover:border-[#FF5A36]'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


