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
} from 'lucide-react';
import { HeroAd, HeroAdSettings, Listing } from '../types';
import { HeroAdBanner } from './HeroAdBanner';
import { SmartSearchTypeahead } from './SmartSearchTypeahead';

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
}

export const DEFAULT_LIGHT_BACKGROUNDS: LightBackgroundItem[] = [
  {
    id: 'vehicles_motors',
    name: 'Vehicles & Motors',
    tag: 'Automotive & Motors',
    imageUrl: '/assets/hero_light_bg.jpg',
    badgeText: 'Vehicles & Motors 🚗',
  },
  {
    id: 'electronics',
    name: 'Electronics',
    tag: 'Electronics & Tech',
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1920&q=85',
    badgeText: 'Electronics & Gadgets 💻',
  },
  {
    id: 'marketplace_estores',
    name: 'E-Stores & Retail',
    tag: 'Lifestyle & Marketplace',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=85',
    badgeText: 'E-Stores & Products 🛍️',
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
}) => {
  // 3 Changing Background Light Images state
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

  // Sync background theme with search category tab
  useEffect(() => {
    if (selectedCategory === 'Vehicles') {
      setActiveBgIndex(0);
    } else if (selectedCategory === 'Electronics') {
      setActiveBgIndex(1);
    } else if (selectedCategory === 'Property' || selectedCategory === 'Services') {
      setActiveBgIndex(2);
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
      {/* 3 Changing Background Light Images with Smooth Cross-Fade Transitions */}
      {DEFAULT_LIGHT_BACKGROUNDS.map((bg, index) => {
        const isCurrent = index === activeBgIndex;
        return (
          <div
            key={bg.id}
            className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ease-in-out ${
              isCurrent ? 'opacity-100 z-0' : 'opacity-0 -z-10'
            }`}
          >
            {/* Mobile Responsive Layout: Left flank (Vehicles/Tech) + Right flank (Villas/Palm Trees) */}
            <div className="md:hidden absolute inset-0 pointer-events-none overflow-hidden select-none">
              {/* Soft atmospheric base sky */}
              <div className="absolute inset-0 opacity-40 dark:opacity-10">
                <img
                  src={bg.imageUrl}
                  alt=""
                  className="w-full h-full object-cover object-top"
                />
              </div>

              {/* Left Flank */}
              <div className="absolute -left-2 top-0 bottom-0 w-[62%] max-w-[280px] pointer-events-none overflow-hidden opacity-90 dark:opacity-30">
                <img
                  src={bg.imageUrl}
                  alt=""
                  className="w-full h-full object-cover object-left filter saturate-110 contrast-105"
                />
                {/* Smooth blend to center and bottom so text stays ultra-readable */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-white dark:via-[#0B0C10]/40 dark:to-[#0B0C10]" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-white/10 dark:from-[#0B0C10]/90 dark:to-transparent" />
              </div>

              {/* Right Flank */}
              <div className="absolute -right-2 top-0 bottom-0 w-[62%] max-w-[280px] pointer-events-none overflow-hidden opacity-90 dark:opacity-30">
                <img
                  src={bg.imageUrl}
                  alt=""
                  className="w-full h-full object-cover object-right filter saturate-110 contrast-105"
                />
                {/* Smooth blend to center and bottom so text stays ultra-readable */}
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/20 to-white dark:via-[#0B0C10]/40 dark:to-[#0B0C10]" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-white/10 dark:from-[#0B0C10]/90 dark:to-transparent" />
              </div>

              {/* Center Text Readability Gradient Mask */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/35 to-transparent dark:from-[#0B0C10] dark:via-[#0B0C10]/70 dark:to-transparent" />
            </div>

            {/* Desktop / Tablet Unified Wide Visual (Full 16:9 Panorama) */}
            <div className="hidden md:block absolute inset-0 pointer-events-none overflow-hidden select-none opacity-90 dark:opacity-20 transition-opacity duration-500">
              <img
                src={bg.imageUrl}
                alt={bg.name}
                className="w-full h-full object-cover object-center filter saturate-105"
              />
              {/* Multi-directional soft gradients ensuring center text and search card remain 100% crisp & readable */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 to-white/30 dark:from-[#0B0C10] dark:via-[#0B0C10]/85 dark:to-[#0B0C10]/70" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/15 via-white/50 to-white/15 dark:from-[#0B0C10]/30 dark:via-[#0B0C10]/75 dark:to-[#0B0C10]/30" />
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
        <HeroAdBanner
          heroAds={heroAds}
          heroSettings={heroSettings}
          onSelectCategory={onSelectCategory}
          onOpenPostAd={onOpenPostAd}
          isAdminLoggedIn={isAdminLoggedIn}
          onAdminManage={onAdminManage}
        />

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
                      : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-white/5'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF5A36]' : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
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


