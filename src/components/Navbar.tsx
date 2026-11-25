import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  MapPin,
  User as UserIcon,
  LayoutGrid,
  Car,
  Home,
  Briefcase,
  Wrench,
  ShoppingBag,
  Store,
  Flame,
  HeartHandshake,
  Compass,
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
  onOpenVisitSriLanka?: () => void;
  isVisitSriLankaActive?: boolean;
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
  onOpenVisitSriLanka,
  isVisitSriLankaActive = false,
  currentUser,
  selectedLocation = 'All Sri Lanka',
  onLocationChange,
  activeCategory = 'All',
  myAdsCount = 0,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(74);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const updateHeight = () => {
      const rectHeight = el.getBoundingClientRect().height;
      const nextHeight = Math.max(Math.ceil(rectHeight), Math.ceil(el.offsetHeight));
      if (nextHeight > 0) {
        setHeaderHeight((prev) => (prev !== nextHeight ? nextHeight : prev));
      }
    };

    updateHeight();
    const rafId = window.requestAnimationFrame(updateHeight);
    const t1 = window.setTimeout(updateHeight, 80);
    const t2 = window.setTimeout(updateHeight, 300);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateHeight);
      try {
        observer.observe(el, { box: 'border-box' });
      } catch {
        observer.observe(el);
      }
    }

    const vv = window.visualViewport;
    window.addEventListener('resize', updateHeight, { passive: true });
    window.addEventListener('orientationchange', updateHeight, { passive: true });
    if (vv) {
      vv.addEventListener('resize', updateHeight);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateHeight).catch(() => {});
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
      if (vv) {
        vv.removeEventListener('resize', updateHeight);
      }
    };
  }, [currentTab, currentUser]);

  const handleVerticalClick = (catName: string) => {
    if (onSelectCategory) {
      onSelectCategory(catName);
    }
    onSelectTab('marketplace');
  };

  return (
    <>
    <header
      ref={headerRef}
      id="main-sticky-navbar"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
      }}
      className={`fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-xl bg-white/95 dark:bg-[#0B0C10]/95 border-b text-gray-900 dark:text-white transition-all duration-200 supports-[backdrop-filter]:bg-white/90 supports-[backdrop-filter]:dark:bg-[#0B0C10]/90 ${
        isScrolled
          ? 'shadow-md border-gray-300/80 dark:border-white/15'
          : 'shadow-xs border-gray-200/70 dark:border-white/10'
      }`}
    >
      {/* Main Brand & Actions Header */}
      <div className="max-w-[1560px] mx-auto px-3 sm:px-5 lg:px-4 xl:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Brand Logo & Location */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (onSelectCategory) onSelectCategory('All');
            onSelectTab('marketplace');
          }}
          className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group select-none py-1 shrink-0 whitespace-nowrap"
        >
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white dark:bg-[#151822] border-2 border-gray-200/90 dark:border-white/10 flex items-center justify-center p-1 sm:p-1.5 shadow-md group-hover:border-[#FF5A36] group-hover:shadow-[0_0_20px_rgba(255,90,54,0.3)] transition-all duration-300 shrink-0">
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
              <span className="text-base sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                HUTA
              </span>
              <span className="text-base sm:text-2xl font-black text-[#FF5A36] tracking-tight ml-0.5">
                .lk
              </span>
            </div>
            <span className="text-[8px] sm:text-[10px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-widest mt-0.5">
              SRI LANKA
            </span>
          </div>
        </motion.div>

        {/* Mobile & Tablet (< lg) Compact Icon + Micro-Name Quick Shortcuts */}
        <div className="inline-flex lg:hidden items-center gap-1 shrink-0" role="group" aria-label="Quick sections">
          <button
            type="button"
            id="nav-mobile-estore-btn"
            onClick={() => {
              onSelectTab('estore');
              window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            }}
            title="Sri Lanka E-Stores & Online Shops"
            aria-label="Sri Lanka E-Stores"
            className={`min-w-[38px] sm:min-w-[44px] px-1.5 sm:px-2 py-1 rounded-xl inline-flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer shadow-2xs border shrink-0 active:scale-95 ${
              currentTab === 'estore'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-current shrink-0" />
            <span className="text-[8px] sm:text-[9px] font-extrabold leading-none tracking-tight whitespace-nowrap">
              E-Store
            </span>
          </button>

          <button
            type="button"
            id="nav-mobile-hot-news-btn"
            onClick={() => {
              onSelectTab('hot_news');
              window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            }}
            title="Sri Lanka Live Hot News"
            aria-label="Hot News"
            className={`min-w-[38px] sm:min-w-[44px] px-1.5 sm:px-2 py-1 rounded-xl inline-flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer shadow-2xs border shrink-0 active:scale-95 ${
              currentTab === 'hot_news'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-500/25 hover:bg-rose-100 dark:hover:bg-rose-900/40'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-current shrink-0" />
            <span className="text-[8px] sm:text-[9px] font-extrabold leading-none tracking-tight whitespace-nowrap">
              Hot News
            </span>
          </button>

          <button
            type="button"
            id="nav-mobile-donate-btn"
            onClick={() => {
              onSelectTab('donate');
              window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            }}
            title="Donate to Sri Lanka Hospitals & Urgent Causes"
            aria-label="Donate Sri Lanka"
            className={`min-w-[38px] sm:min-w-[44px] px-1.5 sm:px-2 py-1 rounded-xl inline-flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer shadow-2xs border shrink-0 active:scale-95 ${
              currentTab === 'donate'
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                : 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-500/25 hover:bg-teal-100 dark:hover:bg-teal-900/40'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-current shrink-0" />
            <span className="text-[8px] sm:text-[9px] font-extrabold leading-none tracking-tight whitespace-nowrap">
              Donate
            </span>
          </button>

          <button
            type="button"
            id="nav-mobile-visit-sl-btn"
            onClick={() => {
              if (onOpenVisitSriLanka) {
                onOpenVisitSriLanka();
              } else {
                onSelectTab('huta_in');
              }
              window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            }}
            title="Visit Sri Lanka — Travel & Tours"
            aria-label="Visit Sri Lanka"
            className={`min-w-[38px] sm:min-w-[44px] px-1.5 sm:px-2 py-1 rounded-xl inline-flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer shadow-2xs border shrink-0 active:scale-95 ${
              isVisitSriLankaActive
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                : 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border-sky-500/25 hover:bg-sky-100 dark:hover:bg-sky-900/40'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-current shrink-0" />
            <span className="text-[8px] sm:text-[9px] font-extrabold leading-none tracking-tight whitespace-nowrap">
              Visit SL
            </span>
          </button>
        </div>

        {/* Location Dropdown */}
        {onLocationChange && (
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-100/80 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 backdrop-blur-sm text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-[#FF5A36]/50 transition-colors whitespace-nowrap shrink-0">
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

        {/* Center: Desktop Navigation Menu (Never overlaps brand or wraps onto two lines) */}
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-1 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (onSelectCategory) onSelectCategory('Property');
              onSelectTab('marketplace');
            }}
            className={`hidden xl:inline-flex px-2 py-1.5 rounded-xl text-xs font-bold transition-all items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
              currentTab === 'marketplace' && activeCategory === 'Property'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#181920]'
            }`}
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span>Properties</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSelectCategory) onSelectCategory('Vehicles');
              onSelectTab('marketplace');
            }}
            className={`hidden xl:inline-flex px-2 py-1.5 rounded-xl text-xs font-bold transition-all items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
              currentTab === 'marketplace' && activeCategory === 'Vehicles'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#181920]'
            }`}
          >
            <Car className="w-3.5 h-3.5 shrink-0" />
            <span>Vehicles</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSelectCategory) onSelectCategory('Electronics');
              onSelectTab('marketplace');
            }}
            className={`hidden 2xl:inline-flex px-2 py-1.5 rounded-xl text-xs font-bold transition-all items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
              currentTab === 'marketplace' && activeCategory === 'Electronics'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#181920]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span>Classifieds</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSelectCategory) onSelectCategory('Services');
              onSelectTab('marketplace');
            }}
            className={`hidden 2xl:inline-flex px-2 py-1.5 rounded-xl text-xs font-bold transition-all items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
              currentTab === 'marketplace' && activeCategory === 'Services'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#181920]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 shrink-0" />
            <span>Services</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSelectCategory) onSelectCategory('Jobs');
              onSelectTab('marketplace');
            }}
            className={`hidden 2xl:inline-flex px-2 py-1.5 rounded-xl text-xs font-bold transition-all items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
              currentTab === 'marketplace' && activeCategory === 'Jobs'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#181920]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            <span>Jobs</span>
          </button>

          <a
            href="/estores"
            target="_blank"
            rel="noopener noreferrer"
            title="Sri Lanka E-Stores & Online Shops (Opens in New Tab)"
            aria-label="Sri Lanka E-Stores"
            className={`min-w-[44px] px-2 py-1 rounded-xl transition-all inline-flex flex-col items-center justify-center gap-0.5 cursor-pointer no-underline shrink-0 border ${
              currentTab === 'estore'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border-emerald-500/25'
            }`}
          >
            <Store className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[9px] font-extrabold leading-none tracking-tight whitespace-nowrap">
              E-Store
            </span>
          </a>

          <button
            type="button"
            onClick={() => onSelectTab('huta_in')}
            className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
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
            onClick={() => onSelectTab('hot_news')}
            title="Sri Lanka Hot News"
            aria-label="Hot News"
            className={`min-w-[44px] px-2 py-1 rounded-xl transition-all inline-flex flex-col items-center justify-center gap-0.5 cursor-pointer shrink-0 border ${
              currentTab === 'hot_news'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50/80 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border-rose-500/25'
            }`}
          >
            <Flame className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[9px] font-extrabold leading-none tracking-tight whitespace-nowrap">
              Hot News
            </span>
          </button>

          <button
            type="button"
            id="nav-desktop-donate-btn"
            onClick={() => onSelectTab('donate')}
            title="Donate to Sri Lanka's Most Needed Hospitals & Causes"
            aria-label="Donate Sri Lanka"
            className={`min-w-[44px] px-2 py-1 rounded-xl transition-all inline-flex flex-col items-center justify-center gap-0.5 cursor-pointer shrink-0 border ${
              currentTab === 'donate'
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                : 'bg-teal-50/80 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 border-teal-500/25'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[9px] font-extrabold leading-none tracking-tight whitespace-nowrap">
              Donate
            </span>
          </button>

          <button
            type="button"
            id="nav-desktop-visit-sl-btn"
            onClick={() => {
              if (onOpenVisitSriLanka) {
                onOpenVisitSriLanka();
              } else {
                onSelectTab('huta_in');
              }
            }}
            title="Visit Sri Lanka — Travel & Tours"
            aria-label="Visit Sri Lanka"
            className={`min-w-[44px] px-2 py-1 rounded-xl transition-all inline-flex flex-col items-center justify-center gap-0.5 cursor-pointer shrink-0 border ${
              isVisitSriLankaActive
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                : 'bg-sky-50/80 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 border-sky-500/25'
            }`}
          >
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[9px] font-extrabold leading-none tracking-tight whitespace-nowrap">
              Visit SL
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('categories')}
            className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
              currentTab === 'categories'
                ? 'bg-[#FF5A36] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#181920]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span className="xl:hidden">Categories</span>
            <span className="hidden xl:inline">All Categories</span>
          </button>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0"
                  title="My Profile & Account"
                >
                  <div className="w-5 h-5 rounded-full bg-[#FF5A36]/15 text-[#FF5A36] flex items-center justify-center text-[10px] font-bold shrink-0">
                    {initial}
                  </div>
                  <span className="hidden sm:inline max-w-[78px] xl:max-w-[100px] truncate">{displayName}</span>
                </button>
              );
            })()
          ) : (
            <button
              type="button"
              onClick={onOpenUserAuth}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-gray-700 dark:text-gray-200 hover:text-[#FF5A36] dark:hover:text-[#FF5A36] hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
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
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A36] via-[#FF623E] to-[#FF7A59] hover:from-[#E04826] hover:to-[#FF5A36] text-white font-black text-xs sm:text-sm shadow-md shadow-[#FF5A36]/30 hover:shadow-lg hover:shadow-[#FF5A36]/40 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3] shrink-0" />
              <span>Create Ad</span>
            </motion.button>
          )}

          {/* User Dashboard / More Quick Icon (visible on mobile & tablet below lg) */}
          <button
            type="button"
            onClick={() => onSelectTab('more')}
            className="lg:hidden p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#181920] transition-colors cursor-pointer shrink-0"
            aria-label="Open menu"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
    <div
      style={{
        height: `${headerHeight}px`,
        minHeight: 'calc(max(env(safe-area-inset-top, 0px), 8px) + 60px)',
      }}
      aria-hidden="true"
      className="w-full shrink-0"
    />
    </>
  );
};

