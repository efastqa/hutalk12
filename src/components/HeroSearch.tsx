import React from 'react';
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
import { HeroAd, HeroAdSettings } from '../types';
import { HeroAdBanner } from './HeroAdBanner';

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

const POPULAR_SEARCHES = [
  'Toyota Land Cruiser',
  'iPhone 16 Pro',
  'Colombo Apartment',
  'Honda Vezel',
  'Land in Kandy',
  'Driver Wanted',
  'MacBook',
  'Living Room Sofa',
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
}) => {
  const handleTabClick = (catId: string) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
  };

  const handlePopularClick = (query: string) => {
    onSearchChange(query);
    // Smooth scroll down to listings section
    const el = document.getElementById('marketplace-listings');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative bg-gradient-to-b from-white via-white to-[#F8FAFC]/50 dark:from-[#0B0C10] dark:via-[#111217] dark:to-[#0B0C10] text-[#181920] dark:text-white py-8 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-gray-200/70 dark:border-white/10 overflow-hidden w-full max-w-full contain-paint transition-colors duration-200">
      {/* Light Theme Marketplace Visual (Vehicle/Phone on Left, Villa/Shopping on Right) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-90 dark:opacity-20 transition-opacity duration-500">
        <img
          src="/assets/hero_light_bg.jpg"
          alt="HUTA Sri Lanka Marketplace"
          className="w-full h-full object-cover object-center filter saturate-105"
        />
        {/* Multi-directional soft gradients ensuring center text and search card remain 100% crisp & readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 to-white/30 dark:from-[#0B0C10] dark:via-[#0B0C10]/85 dark:to-[#0B0C10]/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/15 via-white/60 to-white/15 dark:from-[#0B0C10]/30 dark:via-[#0B0C10]/75 dark:to-[#0B0C10]/30" />
      </div>

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
            {/* Keyword Input */}
            <div className="flex items-center gap-2.5 bg-gray-100/70 dark:bg-[#1E2230]/90 px-3.5 py-2.5 rounded-xl flex-1 border border-gray-200/80 dark:border-white/5 focus-within:border-[#FF5A36] focus-within:ring-2 focus-within:ring-[#FF5A36]/20 transition-all">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="What are you looking for? (e.g. Land Cruiser, iPhone, Kandy House...)"
                className="bg-transparent border-none outline-none text-gray-900 dark:text-white text-sm w-full placeholder:text-gray-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-xs px-1"
                >
                  Clear
                </button>
              )}
            </div>

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
        </div>

        {/* Popular Searches Pills (Qatar Living Style) */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
          <span className="text-gray-500 dark:text-gray-400 font-semibold">Popular:</span>
          {POPULAR_SEARCHES.map((query) => (
            <button
              key={query}
              type="button"
              onClick={() => handlePopularClick(query)}
              className="bg-white dark:bg-[#181920] hover:bg-gray-100 dark:hover:bg-[#22242F] hover:text-[#FF5A36] dark:hover:text-[#FF5A36] text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full border border-gray-200 dark:border-[#2D2F39] transition-all cursor-pointer shadow-2xs"
            >
              {query}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};


