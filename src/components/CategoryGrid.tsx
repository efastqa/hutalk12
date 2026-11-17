import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, ArrowRight, Flame } from 'lucide-react';
import { Listing, HotNewsArticle } from '../types';
import { DualToneHeading } from './DualToneHeading';
import catVehicles3dImg from '../assets/images/cat_vehicles_3d_1794907415689.jpg';
import catProperty3dImg from '../assets/images/cat_property_3d_1794907416481.jpg';
import carsForRentImg from '../assets/images/cars_for_rent_category_1794683403631.jpg';
import holidayHomesImg from '../assets/images/holiday_homes_category_1794527575851.jpg';
import catPhones3dImg from '../assets/images/cat_phones_3d_1794907416738.jpg';
import catServices3dImg from '../assets/images/cat_services_3d_1794907415367.jpg';
import catJobs3dImg from '../assets/images/cat_jobs_3d_1794907417386.jpg';
import catComputers3dImg from '../assets/images/cat_computers_3d_1794907417216.jpg';
import catWomens3dImg from '../assets/images/cat_womens_3d_1794907418654.jpg';
import catMens3dImg from '../assets/images/cat_mens_3d_1794907419777.jpg';
import catBeauty3dImg from '../assets/images/cat_beauty_3d_1794907420014.jpg';
import catAutoPartsImg from '../assets/images/cat_auto_parts_1794777622668.jpg';
import catBoardingsImg from '../assets/images/cat_boardings_1794777622750.jpg';
import catAgricultureImg from '../assets/images/cat_agriculture_1794777623729.jpg';
import catWeddingsImg from '../assets/images/cat_weddings_1794777623764.jpg';
import catEducationImg from '../assets/images/cat_education_1794777624140.jpg';
import catPetsImg from '../assets/images/cat_pets_1794777624936.jpg';
import catLuxury3dImg from '../assets/images/cat_luxury_3d_1794907420791.jpg';
import hotNewsIconImg from '../assets/images/hot_news_sri_lanka_icon_1794684230454.jpg';

export interface CategoryGridProps {
  currentCategory: string;
  onSelectCategory: (category: string, query?: string) => void;
  listings: Listing[];
  onViewAllCategories?: () => void;
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

// Unified modern 3D studio icon categories — uniform size & crisp framing across light and dark themes
export const CATEGORIES_ITEMS: CategoryItem[] = [
  {
    key: 'Vehicles',
    label: 'Vehicles',
    image: catVehicles3dImg,
    targetCategory: 'Vehicles',
  },
  {
    key: 'Property',
    label: 'Property',
    image: catProperty3dImg,
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
    image: catPhones3dImg,
    targetCategory: 'Phones',
    searchQuery: 'phone',
  },
  {
    key: 'Services',
    label: 'Services',
    image: catServices3dImg,
    targetCategory: 'Services',
  },
  {
    key: 'Jobs',
    label: 'Jobs',
    image: catJobs3dImg,
    targetCategory: 'Jobs',
  },
  {
    key: 'Computers',
    label: 'Computers',
    image: catComputers3dImg,
    targetCategory: 'Computers',
    searchQuery: 'computer',
  },
  {
    key: "Women's",
    label: "Women's",
    image: catWomens3dImg,
    targetCategory: "Women's",
    searchQuery: 'women',
  },
  {
    key: "Men's",
    label: "Men's",
    image: catMens3dImg,
    targetCategory: "Men's",
    searchQuery: 'men',
  },
  {
    key: 'Beauty',
    label: 'Beauty',
    image: catBeauty3dImg,
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
    image: catLuxury3dImg,
    targetCategory: 'Luxury',
    searchQuery: 'gem',
  },
];

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  currentCategory,
  onSelectCategory,
  listings,
  onViewAllCategories,
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
      // Auto Parts
      if (
        cat.includes('auto part') ||
        cat.includes('spare part') ||
        title.includes('alloy wheel') ||
        title.includes('tyre') ||
        title.includes('tire') ||
        title.includes('dashcam') ||
        title.includes('car battery') ||
        title.includes('headlight') ||
        title.includes('body kit') ||
        title.includes('spare part')
      ) {
        map['Auto Parts'] = (map['Auto Parts'] || 0) + 1;
      }
      // Boardings & Annexes
      if (
        cat.includes('boarding') ||
        cat.includes('annex') ||
        title.includes('boarding') ||
        title.includes('annex') ||
        title.includes('hostel') ||
        title.includes('shared room') ||
        desc.includes('boarding') ||
        desc.includes('annex')
      ) {
        map['Boardings & Annexes'] = (map['Boardings & Annexes'] || 0) + 1;
      }
      // Agriculture & Farming
      if (
        cat.includes('agriculture') ||
        cat.includes('farming') ||
        title.includes('tractor') ||
        title.includes('tea estate') ||
        title.includes('coconut') ||
        title.includes('paddy') ||
        title.includes('spice') ||
        title.includes('nursery') ||
        title.includes('fertilizer')
      ) {
        map['Agriculture & Farming'] = (map['Agriculture & Farming'] || 0) + 1;
      }
      // Weddings & Events
      if (
        cat.includes('wedding') ||
        cat.includes('event') ||
        title.includes('wedding') ||
        title.includes('bridal') ||
        title.includes('kandyan') ||
        title.includes('poruwa') ||
        title.includes('photography') ||
        title.includes('catering') ||
        title.includes('dj')
      ) {
        map['Weddings & Events'] = (map['Weddings & Events'] || 0) + 1;
      }
      // Education & Tuition
      if (
        cat.includes('education') ||
        cat.includes('tuition') ||
        title.includes('tuition') ||
        title.includes('a/l') ||
        title.includes('o/l') ||
        title.includes('ielts') ||
        title.includes('spoken english') ||
        title.includes('textbook')
      ) {
        map['Education & Tuition'] = (map['Education & Tuition'] || 0) + 1;
      }
      // Pets & Animals
      if (
        cat.includes('pet') ||
        cat.includes('animal') ||
        cat.includes('aquarium') ||
        title.includes('puppy') ||
        title.includes('kitten') ||
        title.includes('aquarium') ||
        title.includes('bird cage') ||
        title.includes('labrador') ||
        title.includes('persian cat')
      ) {
        map['Pets & Animals'] = (map['Pets & Animals'] || 0) + 1;
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

        {onViewAllCategories && (
          <div className="mt-2 flex items-center justify-center">
            <button
              type="button"
              id="view-all-categories-banner-btn"
              onClick={onViewAllCategories}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#FF5A36] hover:text-[#E04826] transition-colors cursor-pointer group"
            >
              <span>Browse All Categories & Services</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

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

        <div className="relative grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-x-2 sm:gap-x-4 md:gap-x-5 gap-y-5 sm:gap-y-7">
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
                transition={{ duration: 0.25, delay: idx * 0.025 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleCategoryClick(cat)}
                className={`relative flex flex-col items-center justify-start text-center cursor-pointer select-none group p-1.5 sm:p-2 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-b from-[#FF5A36]/12 to-transparent dark:from-[#FF5A36]/20 dark:to-transparent border border-[#FF5A36]/50 shadow-md shadow-[#FF5A36]/10'
                    : 'hover:bg-gray-50/90 dark:hover:bg-[#1A1E2B] hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/40 border border-transparent hover:border-gray-200/80 dark:hover:border-white/10'
                }`}
                title={`Browse ${cat.label} (${count} ads)`}
              >
                {/* Uniform Modern 3D Studio Squircle Frame (Same Exact Size Across All Categories) */}
                <div
                  className={`relative w-14 h-14 sm:w-[72px] sm:h-[72px] md:w-20 md:h-20 rounded-2xl sm:rounded-[22px] bg-white border overflow-hidden mb-1.5 transition-all duration-200 ${
                    isActive
                      ? 'border-[#FF5A36] ring-2 ring-[#FF5A36] ring-offset-2 ring-offset-white dark:ring-offset-[#12141D] shadow-lg shadow-[#FF5A36]/20 scale-[1.03]'
                      : 'border-gray-200/80 dark:border-white/20 shadow-[0_6px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)] group-hover:shadow-lg group-hover:border-[#FF5A36]/40'
                  }`}
                >
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 ease-out select-none pointer-events-none"
                    loading="lazy"
                  />
                </div>

                {/* Category Label */}
                <span
                  className={`text-[11px] sm:text-[13px] font-bold tracking-tight leading-tight text-center transition-colors mt-0.5 line-clamp-2 ${
                    isActive
                      ? 'text-[#FF5A36] dark:text-[#FF7A59]'
                      : 'text-gray-900 dark:text-gray-100 group-hover:text-[#FF5A36] dark:group-hover:text-[#FF5A36]'
                  }`}
                >
                  {cat.label}
                </span>

                {/* Unboxed Ads Count Metadata */}
                <span
                  className={`text-[10px] sm:text-[11px] font-medium mt-0.5 transition-colors tabular-nums ${
                    isActive ? 'text-[#FF5A36]/90 dark:text-[#FF7A59]/90' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {count} ads
                  {cat.isNew && (
                    <span className="text-[#FF5A36] dark:text-[#FF7A59] font-bold">
                      {' · '}New
                    </span>
                  )}
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
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.96 }}
              onClick={onOpenHotNews}
              className="relative flex flex-col items-center justify-start text-center cursor-pointer select-none group p-2 rounded-2xl transition-all duration-200 hover:bg-gray-50/90 dark:hover:bg-[#1A1E2B] hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 shrink-0"
              title="Open Sri Lanka Live Hot News"
            >
              {/* Same Uniform 3D Studio Squircle Frame */}
              <div className="relative w-14 h-14 sm:w-[72px] sm:h-[72px] md:w-20 md:h-20 rounded-2xl sm:rounded-[22px] bg-white border border-rose-200/80 dark:border-white/20 overflow-hidden mb-1.5 shadow-[0_6px_16px_rgba(244,63,94,0.08)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.4)] group-hover:shadow-lg group-hover:border-rose-400/50 transition-all duration-200">
                <img
                  src={hotNewsIconImg}
                  alt="Sri Lanka Hot News"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 ease-out select-none pointer-events-none"
                  loading="lazy"
                />
              </div>

              {/* Label */}
              <span className="text-xs sm:text-[13px] font-bold tracking-tight leading-tight text-center text-gray-900 dark:text-gray-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors mt-0.5">
                Hot News
              </span>

              {/* Live Count */}
              <span className="text-[10px] sm:text-[11px] font-semibold mt-0.5 text-emerald-600 dark:text-emerald-400 tabular-nums">
                {hotNewsArticles.length > 0
                  ? `${hotNewsArticles.length} live`
                  : isLoadingHotNews
                  ? 'Updating...'
                  : 'Sri Lanka'}
                <span className="text-rose-600 dark:text-rose-400 font-bold"> · Live</span>
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
    </section>
  );
};
