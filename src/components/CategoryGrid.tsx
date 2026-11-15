import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, Sparkles, RotateCcw, ShieldCheck, ArrowRight, Flame } from 'lucide-react';
import { Listing, HotNewsArticle } from '../types';
import { DualToneHeading } from './DualToneHeading';
import holidayHomesImg from '../assets/images/holiday_homes_category_1794527575851.jpg';
import carsForRentImg from '../assets/images/cars_for_rent_category_1794683403631.jpg';
import hotNewsIconImg from '../assets/images/hot_news_sri_lanka_icon_1794684230454.jpg';
import catAutoPartsImg from '../assets/images/cat_auto_parts_1794777622668.jpg';
import catBoardingsImg from '../assets/images/cat_boardings_1794777622750.jpg';
import catAgricultureImg from '../assets/images/cat_agriculture_1794777623729.jpg';
import catWeddingsImg from '../assets/images/cat_weddings_1794777623764.jpg';
import catEducationImg from '../assets/images/cat_education_1794777624140.jpg';
import catPetsImg from '../assets/images/cat_pets_1794777624936.jpg';

export interface CategoryGridProps {
  currentCategory: string;
  onSelectCategory: (category: string, query?: string) => void;
  listings: Listing[];
  onViewAllCategories?: () => void;
  verifiedOnly?: boolean;
  onToggleVerifiedOnly?: () => void;
  onSelectSearchTerm?: (query: string) => void;
  hotNewsArticles?: HotNewsArticle[];
  isLoadingHotNews?: boolean;
  onOpenHotNews?: () => void;
}

export interface CategoryItem {
  key: string;
  label: string;
  image: string;
  searchQuery?: string;
  targetCategory?: string;
  isNew?: boolean;
}

// Curated 3D categories for Explore Our Categories
export const CATEGORIES_ITEMS: CategoryItem[] = [
  {
    key: 'Vehicles',
    label: 'Vehicles',
    image: '/assets/categories/vehicles.png',
    targetCategory: 'Vehicles',
  },
  {
    key: 'Property',
    label: 'Property',
    image: '/assets/categories/property.png',
    targetCategory: 'Property',
  },
  {
    key: 'Cars for Rent',
    label: 'Cars for Rent',
    image: carsForRentImg,
    targetCategory: 'Cars for Rent',
    isNew: true,
  },
  {
    key: 'Holiday Homes',
    label: 'Holiday Homes',
    image: holidayHomesImg,
    targetCategory: 'Holiday Homes',
    isNew: true,
  },
  {
    key: 'Phones',
    label: 'Phones',
    image: '/assets/categories/phones.png',
    targetCategory: 'Phones',
    searchQuery: 'phone',
  },
  {
    key: 'Services',
    label: 'Services',
    image: '/assets/categories/services.png',
    targetCategory: 'Services',
  },
  {
    key: 'Jobs',
    label: 'Jobs',
    image: '/assets/categories/jobs.png',
    targetCategory: 'Jobs',
  },
  {
    key: 'Computers',
    label: 'Computers',
    image: '/assets/categories/computers.png',
    targetCategory: 'Computers',
    searchQuery: 'computer',
  },
  {
    key: "Women's",
    label: "Women's",
    image: '/assets/categories/womens.png',
    targetCategory: "Women's",
    searchQuery: 'women',
  },
  {
    key: "Men's",
    label: "Men's",
    image: '/assets/categories/mens.png',
    targetCategory: "Men's",
    searchQuery: 'men',
  },
  {
    key: 'Beauty',
    label: 'Beauty',
    image: '/assets/categories/beauty.png',
    targetCategory: 'Beauty',
    searchQuery: 'beauty',
  },
  {
    key: 'Auto Parts',
    label: 'Auto Parts',
    image: catAutoPartsImg,
    targetCategory: 'Auto Parts',
    isNew: true,
  },
  {
    key: 'Boardings & Annexes',
    label: 'Boardings & Annexes',
    image: catBoardingsImg,
    targetCategory: 'Boardings & Annexes',
    isNew: true,
  },
  {
    key: 'Agriculture & Farming',
    label: 'Agriculture',
    image: catAgricultureImg,
    targetCategory: 'Agriculture & Farming',
    isNew: true,
  },
  {
    key: 'Weddings & Events',
    label: 'Weddings',
    image: catWeddingsImg,
    targetCategory: 'Weddings & Events',
    isNew: true,
  },
  {
    key: 'Education & Tuition',
    label: 'Education',
    image: catEducationImg,
    targetCategory: 'Education & Tuition',
    isNew: true,
  },
  {
    key: 'Pets & Animals',
    label: 'Pets & Aquarium',
    image: catPetsImg,
    targetCategory: 'Pets & Animals',
    isNew: true,
  },
  {
    key: 'Luxury',
    label: 'Luxury',
    image: '/assets/categories/luxury.png',
    targetCategory: 'Luxury',
    searchQuery: 'gem',
  },
];

// Trending chips matching the top bar of the attached design
const TRENDING_CHIPS = [
  { label: 'Cars', category: 'Vehicles', query: 'car' },
  { label: 'Cars for Rent', category: 'Cars for Rent', query: '' },
  { label: 'Auto Parts', category: 'Auto Parts', query: '' },
  { label: 'Boardings & Annexes', category: 'Boardings & Annexes', query: '' },
  { label: 'Mobile Phones', category: 'Phones', query: 'phone' },
  { label: 'Houses & Lands', category: 'Property', query: 'house' },
  { label: 'Holiday Homes', category: 'Holiday Homes', query: '' },
  { label: 'Agriculture & Tea', category: 'Agriculture & Farming', query: '' },
  { label: 'Weddings & Bridal', category: 'Weddings & Events', query: '' },
  { label: 'A/L Tuition', category: 'Education & Tuition', query: '' },
  { label: 'Pets & Aquarium', category: 'Pets & Animals', query: '' },
  { label: 'AC Services', category: 'Services', query: 'ac' },
  { label: 'Jobs', category: 'Jobs', query: 'job' },
  { label: 'Ceylon Gems', category: 'Luxury', query: 'gem' },
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

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  currentCategory,
  onSelectCategory,
  listings,
  onViewAllCategories,
  verifiedOnly = false,
  onToggleVerifiedOnly,
  onSelectSearchTerm,
  hotNewsArticles = [],
  isLoadingHotNews = false,
  onOpenHotNews,
}) => {
  const [liveNewsIndex, setLiveNewsIndex] = useState(0);
  const liveSlides = useMemo(() => hotNewsArticles.slice(0, 8), [hotNewsArticles]);

  useEffect(() => {
    if (liveSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setLiveNewsIndex((prev) => (prev + 1) % liveSlides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [liveSlides.length]);

  const currentLiveHeadline = liveSlides[liveNewsIndex % Math.max(1, liveSlides.length)];
  // Calculate live ads count per category accurately
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    CATEGORIES_ITEMS.forEach((c) => {
      map[c.key] = 0;
    });

    listings.forEach((item) => {
      if (item.status && item.status !== 'approved') return;
      const cat = (item.category || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();

      // Vehicles
      if (cat.includes('vehicle') || cat.includes('car') || cat.includes('motorcycle')) {
        map['Vehicles'] = (map['Vehicles'] || 0) + 1;
      }
      // Property
      if (cat.includes('property') || cat.includes('land') || cat.includes('house') || cat.includes('apartment')) {
        map['Property'] = (map['Property'] || 0) + 1;
      }
      // Phones
      if (cat.includes('phone') || title.includes('phone') || title.includes('iphone') || title.includes('samsung') || title.includes('redmi')) {
        map['Phones'] = (map['Phones'] || 0) + 1;
      }
      // Women's
      if (cat.includes('fashion') && (title.includes('women') || title.includes('dress') || title.includes('saree') || title.includes('frock') || desc.includes('women'))) {
        map["Women's"] = (map["Women's"] || 0) + 1;
      } else if (cat.includes('fashion') && !title.includes('men')) {
        map["Women's"] = (map["Women's"] || 0) + 1;
      }
      // Services
      if (cat.includes('service') || cat.includes('repair') || cat.includes('maintenance')) {
        map['Services'] = (map['Services'] || 0) + 1;
      }
      // Computers
      if (cat.includes('electronic') && (title.includes('laptop') || title.includes('computer') || title.includes('macbook') || title.includes('pc') || desc.includes('computer'))) {
        map['Computers'] = (map['Computers'] || 0) + 1;
      } else if (cat.includes('electronic') && !title.includes('phone')) {
        map['Computers'] = (map['Computers'] || 0) + 1;
      }
      // Jobs
      if (cat.includes('job') || cat.includes('career') || cat.includes('vacancy')) {
        map['Jobs'] = (map['Jobs'] || 0) + 1;
      }
      // Men's
      if (cat.includes('fashion') && (title.includes('men') || title.includes('shirt') || title.includes('suit') || title.includes('trouser') || desc.includes('men'))) {
        map["Men's"] = (map["Men's"] || 0) + 1;
      }
      // Beauty
      if (cat.includes('beauty') || title.includes('beauty') || title.includes('cosmetic') || title.includes('salon') || desc.includes('cosmetic')) {
        map['Beauty'] = (map['Beauty'] || 0) + 1;
      }
      // Luxury
      if (cat.includes('luxury') || title.includes('gem') || title.includes('gold') || title.includes('sapphire') || title.includes('jewelry') || title.includes('watch') || desc.includes('gem')) {
        map['Luxury'] = (map['Luxury'] || 0) + 1;
      }
      // Holiday Homes
      if (
        cat.includes('holiday') ||
        cat.includes('vacation') ||
        (item.propertyType || '').toLowerCase().includes('holiday') ||
        (item.propertyType || '').toLowerCase().includes('villa') ||
        title.includes('holiday home') ||
        title.includes('holiday villa') ||
        title.includes('bungalow') ||
        title.includes('cabana') ||
        title.includes('villa') ||
        title.includes('resort') ||
        desc.includes('holiday home')
      ) {
        map['Holiday Homes'] = (map['Holiday Homes'] || 0) + 1;
      }
      // Cars for Rent
      if (
        cat === 'cars for rent' ||
        cat.includes('car rental') ||
        cat.includes('rent a car') ||
        ((cat.includes('vehicle') || cat.includes('car')) &&
          (title.includes('for rent') ||
            title.includes('rent a car') ||
            title.includes('self drive') ||
            title.includes('self-drive') ||
            title.includes('per day') ||
            desc.includes('rent a car') ||
            item.pricingType === 'daily' ||
            item.pricingType === 'monthly'))
      ) {
        map['Cars for Rent'] = (map['Cars for Rent'] || 0) + 1;
      }
    });

    return map;
  }, [listings]);

  const handleCategoryClick = (cat: CategoryItem) => {
    onSelectCategory(cat.targetCategory || cat.key, cat.searchQuery);
    setTimeout(() => {
      const el = document.getElementById('marketplace-listings');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 40);
  };

  const handleTrendingClick = (chip: typeof TRENDING_CHIPS[number]) => {
    onSelectCategory(chip.category, chip.query);
    setTimeout(() => {
      const el = document.getElementById('marketplace-listings');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 40);
  };

  const handlePopularClick = (query: string) => {
    if (onSelectSearchTerm) {
      onSelectSearchTerm(query);
    } else {
      onSelectCategory('All', query);
    }
    setTimeout(() => {
      const el = document.getElementById('marketplace-listings');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 40);
  };

  const isAnyCategoryActive = currentCategory !== 'All';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
      {/* 1. Dual-Tone Heading */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-center mb-6 sm:mb-8"
      >
        <DualToneHeading
          as="h2"
          size="xl"
          theme="auto"
          primaryText="Explore Our"
          accentText={['Categories', 'Top Sectors', 'Marketplace Hubs']}
          animationType="rotate"
          rotationInterval={3600}
          align="center"
          showUnderline={false}
          subtitle="Everything Sri Lanka needs to buy, sell, and discover — all in one place."
          id="categories-dual-tone-heading"
        />

        {isAnyCategoryActive && (
          <div className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50/90 dark:bg-orange-950/60 border border-[#FF5A36]/40 backdrop-blur-xs text-xs text-[#FF5A36] font-bold shadow-xs">
            <span>Filtering by: {currentCategory}</span>
            <button
              type="button"
              onClick={() => onSelectCategory('All', '')}
              className="hover:underline flex items-center gap-1 ml-1 cursor-pointer font-extrabold"
              title="Reset category filter"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Show All</span>
            </button>
          </div>
        )}
      </motion.div>

      {/* 3. 4-Column Category Grid Matching Attached Screenshot with Frosted Glass & 3D Depth */}
      <div className="bg-white/90 dark:bg-[#12141D]/90 backdrop-blur-xl rounded-3xl p-5 sm:p-7 lg:p-8 border border-gray-200/80 dark:border-white/10 shadow-xl dark:shadow-[0_16px_40px_rgba(0,0,0,0.45)] relative overflow-hidden">
        {/* Subtle top ambient glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#FF5A36]/10 dark:bg-[#FF5A36]/15 blur-3xl pointer-events-none rounded-full" />

        <div className="relative grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-x-2 sm:gap-x-4 md:gap-x-5 gap-y-6 sm:gap-y-8">
          {CATEGORIES_ITEMS.map((cat, idx) => {
            const isActive =
              currentCategory.toLowerCase() === cat.key.toLowerCase() ||
              currentCategory.toLowerCase() === (cat.targetCategory || '').toLowerCase();
            const count = counts[cat.key] || 0;

            return (
              <motion.button
                key={cat.key}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleCategoryClick(cat)}
                className={`relative flex flex-col items-center justify-start text-center cursor-pointer select-none group p-1.5 sm:p-2.5 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-b from-[#FF5A36]/12 to-transparent dark:from-[#FF5A36]/20 dark:to-transparent border border-[#FF5A36]/50 shadow-md shadow-[#FF5A36]/10'
                    : 'hover:bg-white dark:hover:bg-[#1A1E2B] hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/40 border border-transparent hover:border-gray-200/80 dark:hover:border-white/10'
                }`}
                title={`Browse ${cat.label} (${count} ads)`}
              >
                {/* "New" Badge */}
                {cat.isNew && (
                  <span className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#FF5A36] to-amber-500 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                    New
                  </span>
                )}

                {/* 3D Icon Presentation with Ground Shadow */}
                <div className="relative w-16 h-14 sm:w-20 sm:h-18 md:w-24 md:h-20 flex flex-col items-center justify-center mb-1">
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="w-full h-full object-contain rounded-2xl filter group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 ease-out select-none pointer-events-none drop-shadow-sm group-hover:drop-shadow-[0_10px_18px_rgba(255,90,54,0.25)]"
                    loading="lazy"
                  />
                  {/* 3D Ground Contact Shadow */}
                  <div className="w-10 sm:w-14 h-1.5 bg-black/10 dark:bg-black/50 rounded-full blur-[2px] mt-0.5 group-hover:scale-90 group-hover:opacity-40 transition-all duration-300" />

                  {/* Active Indicator Glow Dot */}
                  {isActive && (
                    <span className="absolute -top-1 -left-1 w-3 h-3 bg-[#FF5A36] rounded-full ring-2 ring-white dark:ring-[#12141D] shadow-sm animate-pulse" />
                  )}
                </div>

                {/* Category Label */}
                <span
                  className={`text-[11px] sm:text-sm font-black tracking-tight leading-tight text-center transition-colors mt-1 ${
                    isActive
                      ? 'text-[#FF5A36] dark:text-[#FF7A59]'
                      : 'text-gray-900 dark:text-gray-100 group-hover:text-[#FF5A36] dark:group-hover:text-[#FF5A36]'
                  }`}
                >
                  {cat.label}
                </span>

                {/* Ads Count */}
                <span
                  className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 transition-colors ${
                    isActive ? 'text-[#FF5A36]/90 dark:text-[#FF7A59]/90' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {count} ads
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Sri Lanka Live "Hot News" Category-Style Icon & Integrated Live Ticker */}
        {onOpenHotNews && (
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
            <motion.button
              type="button"
              id="category-hot-news-icon-btn"
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.96 }}
              onClick={onOpenHotNews}
              className="relative flex flex-col items-center justify-start text-center cursor-pointer select-none group p-2 rounded-2xl transition-all duration-300 hover:bg-white dark:hover:bg-[#1A1E2B] hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 shrink-0"
              title="Open Sri Lanka Live Hot News"
            >
              {/* LIVE Pulse Badge */}
              <span className="absolute top-1.5 right-1.5 z-10 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-[#FF5A36] text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>Live</span>
              </span>

              {/* 3D Category Icon Frame */}
              <div className="relative w-16 h-14 sm:w-20 sm:h-18 md:w-24 md:h-20 flex flex-col items-center justify-center mb-1">
                <img
                  src={hotNewsIconImg}
                  alt="Sri Lanka Hot News"
                  className="w-full h-full object-contain rounded-2xl filter group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 ease-out select-none pointer-events-none drop-shadow-sm group-hover:drop-shadow-[0_10px_18px_rgba(244,63,94,0.28)]"
                  loading="lazy"
                />
                {/* 3D Ground Contact Shadow */}
                <div className="w-10 sm:w-14 h-1.5 bg-black/10 dark:bg-black/50 rounded-full blur-[2px] mt-0.5 group-hover:scale-90 group-hover:opacity-40 transition-all duration-300" />
              </div>

              {/* Label */}
              <span className="text-xs sm:text-sm font-black tracking-tight leading-tight text-center text-gray-900 dark:text-gray-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors mt-1">
                Hot News
              </span>

              {/* Live Count */}
              <span className="text-[10px] sm:text-[11px] font-semibold mt-0.5 text-emerald-600 dark:text-emerald-400 tabular-nums">
                {hotNewsArticles.length > 0
                  ? `${hotNewsArticles.length} live`
                  : isLoadingHotNews
                  ? 'Updating...'
                  : 'Sri Lanka'}
              </span>
            </motion.button>

            {/* Live Integrated Sri Lanka Headline Pill beside the Icon */}
            <button
              type="button"
              onClick={onOpenHotNews}
              className="group w-full sm:w-auto sm:max-w-lg flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-gray-50/90 dark:bg-[#191C28] hover:bg-rose-50/70 dark:hover:bg-[#221A22] border border-gray-200/80 dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-500/40 text-left transition-all cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  <Flame className="w-3 h-3 fill-current shrink-0" />
                  <span>Sri Lanka Live</span>
                  {currentLiveHeadline && (
                    <>
                      <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">·</span>
                      <span className="text-gray-500 dark:text-gray-400 truncate font-semibold normal-case tracking-normal">
                        {currentLiveHeadline.source}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-1 mt-0.5">
                  {currentLiveHeadline
                    ? currentLiveHeadline.title
                    : isLoadingHotNews
                    ? 'Connecting to live Sri Lanka news...'
                    : 'Tap Hot News icon for breaking Sri Lanka updates'}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* 4. Explore All Categories & Directory Button */}
      {onViewAllCategories && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            id="view-all-categories-banner-btn"
            onClick={onViewAllCategories}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-[#151822] hover:bg-gray-50 dark:hover:bg-[#1E2230] text-[#0A2540] dark:text-white hover:text-[#FF5A36] dark:hover:text-[#FF5A36] text-xs sm:text-sm font-bold border border-gray-200 dark:border-[#252836] shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
          >
            <LayoutGrid className="w-4 h-4 text-[#FF5A36] group-hover:scale-110 transition-transform" />
            <span>Explore All Categories & Professional Services Directory</span>
            <span className="text-[#FF5A36] font-extrabold ml-1">→</span>
          </button>
        </div>
      )}

      {/* 5. Below Explore Categories: Verified Sellers Only, Popular Searches & Trending Bar */}
      <div className="mt-6 space-y-3.5">
        {/* Verified Sellers Only + Popular Searches */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          {onToggleVerifiedOnly && (
            <button
              type="button"
              onClick={onToggleVerifiedOnly}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border shrink-0 shadow-2xs ${
                verifiedOnly
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white dark:bg-[#151822] text-gray-800 dark:text-gray-200 border-gray-200 dark:border-white/10 hover:border-purple-400'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Sellers Only</span>
            </button>
          )}

          <span className="text-gray-500 dark:text-gray-400 font-semibold ml-1">Popular:</span>
          {POPULAR_SEARCHES.map((query) => (
            <button
              key={query}
              type="button"
              onClick={() => handlePopularClick(query)}
              className="bg-white dark:bg-[#181920] hover:bg-gray-100 dark:hover:bg-[#22242F] hover:text-[#FF5A36] dark:hover:text-[#FF5A36] text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full border border-gray-200 dark:border-[#2D2F39] transition-all cursor-pointer shadow-2xs"
            >
              {query}
            </button>
          ))}
        </div>

        {/* TRENDING Bar */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none select-none">
          <span className="text-[11px] sm:text-xs font-black tracking-wider text-gray-500 dark:text-gray-400 uppercase shrink-0 flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span>TRENDING:</span>
          </span>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {TRENDING_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleTrendingClick(chip)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/90 dark:bg-[#151822]/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-white/10 hover:border-[#FF5A36] dark:hover:border-[#FF5A36] hover:text-[#FF5A36] dark:hover:text-[#FF5A36] hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all whitespace-nowrap shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
