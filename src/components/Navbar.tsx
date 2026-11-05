import React from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  MapPin,
  Sparkles,
  User as UserIcon,
  LayoutGrid,
  Car,
  Home,
  Briefcase,
  Wrench,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { ViewTab, User } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onSelectCategory?: (category: string) => void;
  onOpenPostAd?: () => void;
  onOpenUserAuth?: () => void;
  onOpenAppStore?: () => void;
  currentUser?: User | { name?: string; fullname?: string; username?: string; email?: string } | null;
  selectedLocation?: string;
  onLocationChange?: (location: string) => void;
  activeCategory?: string;
  myAdsCount?: number;
}

const DISTRICTS_POPULAR = [
  'All Sri Lanka',
  'Colombo',
  'Gampaha',
  'Kandy',
  'Galle',
  'Kalutara',
  'Kurunegala',
  'Jaffna',
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onSelectCategory,
  onOpenPostAd,
  onOpenUserAuth,
  onOpenAppStore,
  currentUser,
  selectedLocation = 'All Sri Lanka',
  onLocationChange,
  activeCategory = 'All',
  myAdsCount = 0,
}) => {
  const handleVerticalClick = (catName: string) => {
    if (onSelectCategory) {
      onSelectCategory(catName);
    }
    onSelectTab('marketplace');
  };

  return (
    <header
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 10px)',
      }}
      className="sticky top-0 z-40 backdrop-blur-xl bg-white/95 dark:bg-[#0B0C10]/95 border-b border-gray-200/70 dark:border-white/10 text-gray-900 dark:text-white shadow-xs transition-all duration-300 supports-[backdrop-filter]:bg-white/90 supports-[backdrop-filter]:dark:bg-[#0B0C10]/90"
    >
      {/* Main Brand & Actions Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-4">
        {/* Brand Logo & Location */}
        <div className="flex items-center gap-2 sm:gap-3">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (onSelectCategory) onSelectCategory('All');
            onSelectTab('marketplace');
          }}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none py-1"
        >
          <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white dark:bg-[#151822] border-2 border-gray-200/90 dark:border-white/10 flex items-center justify-center p-1.5 shadow-md group-hover:border-[#FF5A36] group-hover:shadow-[0_0_20px_rgba(255,90,54,0.3)] transition-all duration-300">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
              <rect width="100" height="100" rx="20" className="fill-gray-900 dark:fill-[#181920]" />
              <rect x="20" y="16" width="18" height="68" rx="9" fill="#FF5A36" />
              <rect x="62" y="16" width="18" height="68" rx="9" fill="#FF5A36" />
              <path d="M 24 64 L 76 28 L 76 42 L 24 78 Z" fill="#FFFFFF" />
              <polygon points="66,16 88,26 74,28" fill="#FFFFFF" />
            </svg>
          </div>
          <div className="flex flex-col leading-none justify-center">
            <div className="flex items-baseline">
              <span className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                HUTA
              </span>
              <span className="text-lg sm:text-2xl font-black text-[#FF5A36] tracking-tight ml-0.5">
                .lk
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mt-0.5">
              SRI LANKA
            </span>
          </div>
        </motion.div>

        {/* E-Store Button in Phone View (next to HUTA.lk) */}
        <button
          type="button"
          onClick={() => {
            onSelectTab('estore');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          title="Browse Sri Lanka E-Stores"
          className={`inline-flex sm:hidden items-center gap-1 px-2 py-1 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs border ${
            currentTab === 'estore'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:scale-95'
          }`}
        >
          <Store className="w-3.5 h-3.5 text-current shrink-0" />
          <span className="font-black tracking-tight">E-Store</span>
          <span className="bg-emerald-500 text-white text-[8px] font-black px-1 py-0.2 rounded-full uppercase leading-none">
            New
          </span>
        </button>

        {/* Location Dropdown */}
        {onLocationChange && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100/80 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 backdrop-blur-sm text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-[#FF5A36]/50 transition-colors">
            <MapPin className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
            <select
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              className="bg-transparent text-xs text-gray-700 dark:text-gray-200 font-semibold outline-none cursor-pointer border-none pr-1"
              aria-label="Filter by district"
            >
              {DISTRICTS_POPULAR.map((loc) => (
                <option key={loc} value={loc} className="bg-white dark:bg-[#181920] text-gray-900 dark:text-white">
                  {loc}
                </option>
              ))}
            </select>
          </div>
        )}
        </div>

        {/* Center: Qatar Living Style Navigation Menu */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          <button
            type="button"
            onClick={() => {
              if (onSelectCategory) onSelectCategory('Property');
              onSelectTab('marketplace');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'marketplace' && activeCategory === 'Property'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#181920]'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Properties</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSelectCategory) onSelectCategory('Vehicles');
              onSelectTab('marketplace');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'marketplace' && activeCategory === 'Vehicles'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#181920]'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Vehicles</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSelectCategory) onSelectCategory('Electronics');
              onSelectTab('marketplace');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'marketplace' && activeCategory === 'Electronics'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#181920]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Classifieds</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSelectCategory) onSelectCategory('Services');
              onSelectTab('marketplace');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'marketplace' && activeCategory === 'Services'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#181920]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Services</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSelectCategory) onSelectCategory('Jobs');
              onSelectTab('marketplace');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'marketplace' && activeCategory === 'Jobs'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#181920]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Jobs</span>
          </button>

          <a
            href="?tab=estore"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Sri Lanka E-Stores in a New Tab"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer no-underline ${
              currentTab === 'estore'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-500/20'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>E-Store</span>
            <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider">
              New ↗
            </span>
          </a>

          <button
            type="button"
            onClick={() => onSelectTab('huta_in')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              currentTab === 'huta_in'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#181920]'
            }`}
          >
            <span>HUTA</span>
            <span className="bg-[#FF5A36] text-white text-[10px] px-1 py-0.5 rounded font-black leading-none">
              IN
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('categories')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'categories'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#181920]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>All Categories</span>
          </button>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* User Account / Login */}
          {currentUser ? (
            (() => {
              const displayName =
                currentUser.fullname ||
                (currentUser as any).name ||
                currentUser.username ||
                'User';
              const initial = (displayName.trim().charAt(0) || 'U').toUpperCase();
              return (
                <button
                  type="button"
                  onClick={() => onSelectTab('user_dashboard')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 text-xs font-bold transition-all cursor-pointer"
                  title="My Profile & Account"
                >
                  <div className="w-5 h-5 rounded-full bg-[#FF5A36]/15 text-[#FF5A36] flex items-center justify-center text-[10px] font-bold">
                    {initial}
                  </div>
                  <span className="max-w-[100px] truncate">{displayName}</span>
                </button>
              );
            })()
          ) : (
            <button
              type="button"
              onClick={onOpenUserAuth}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-700 dark:text-gray-200 hover:text-[#FF5A36] dark:hover:text-[#FF5A36] hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-bold transition-colors cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>Log In</span>
            </button>
          )}

          {/* Light / Dark Mode Toggle */}
          <ThemeToggle variant="icon" id="nav-theme-toggle-icon" />

          {onOpenPostAd && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97, y: 0 }}
              onClick={onOpenPostAd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A36] via-[#FF623E] to-[#FF7A59] hover:from-[#E04826] hover:to-[#FF5A36] text-white font-black text-xs sm:text-sm shadow-md shadow-[#FF5A36]/30 hover:shadow-lg hover:shadow-[#FF5A36]/40 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
              <span className="hidden xs:inline">Post an Ad</span>
              <span className="xs:hidden">Post</span>
            </motion.button>
          )}

          {/* User Dashboard / More Quick Icon */}
          <button
            type="button"
            onClick={() => onSelectTab('more')}
            className="md:hidden p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#181920] transition-colors"
            aria-label="Open menu"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

