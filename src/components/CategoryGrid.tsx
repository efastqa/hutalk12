import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, Sparkles, RotateCcw } from 'lucide-react';
import { Listing } from '../types';
import { DualToneHeading } from './DualToneHeading';
import holidayHomesImg from '../assets/images/holiday_homes_category_1794527575851.jpg';

export interface CategoryGridProps {
  currentCategory: string;
  onSelectCategory: (category: string, query?: string) => void;
  listings: Listing[];
  onViewAllCategories?: () => void;
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
    key: 'Phones',
    label: 'Phones',
    image: '/assets/categories/phones.png',
    targetCategory: 'Phones',
    searchQuery: 'phone',
  },
  {
    key: "Women's",
    label: "Women's",
    image: '/assets/categories/womens.png',
    targetCategory: "Women's",
    searchQuery: 'women',
  },
  {
    key: 'Services',
    label: 'Services',
    image: '/assets/categories/services.png',
    targetCategory: 'Services',
  },
  {
    key: 'Computers',
    label: 'Computers',
    image: '/assets/categories/computers.png',
    targetCategory: 'Computers',
    searchQuery: 'computer',
  },
  {
    key: 'Jobs',
    label: 'Jobs',
    image: '/assets/categories/jobs.png',
    targetCategory: 'Jobs',
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
    key: 'Luxury',
    label: 'Luxury',
    image: '/assets/categories/luxury.png',
    targetCategory: 'Luxury',
    searchQuery: 'gem',
  },
  {
    key: 'Holiday Homes',
    label: 'Holiday Homes',
    image: holidayHomesImg,
    targetCategory: 'Holiday Homes',
    isNew: true,
  },
];

// Trending chips matching the top bar of the attached design
const TRENDING_CHIPS = [
  { label: 'Cars', category: 'Vehicles', query: 'car' },
  { label: 'Mobile Phones', category: 'Phones', query: 'phone' },
  { label: 'Dresses', category: "Women's", query: 'dress' },
  { label: 'Houses & Lands', category: 'Property', query: 'house' },
  { label: 'Holiday Homes', category: 'Holiday Homes', query: '' },
  { label: 'Motorbikes', category: 'Vehicles', query: 'bike' },
  { label: 'Laptops', category: 'Computers', query: 'laptop' },
  { label: 'AC Services', category: 'Services', query: 'ac' },
  { label: 'Jobs', category: 'Jobs', query: 'job' },
  { label: 'Ceylon Gems', category: 'Luxury', query: 'gem' },
  { label: 'Salons & Spas', category: 'Beauty', query: 'salon' },
];

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  currentCategory,
  onSelectCategory,
  listings,
  onViewAllCategories,
}) => {
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

  const isAnyCategoryActive = currentCategory !== 'All';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
      {/* 1. TRENDING BAR (Matching attached format with frosted glass pills) */}
      <div className="mb-6 flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none select-none">
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

      {/* 2. Dual-Tone Heading */}
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
    </section>
  );
};
