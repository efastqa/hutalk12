import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Car,
  KeyRound,
  Building2,
  Palmtree,
  Smartphone,
  Wrench,
  Briefcase,
  Sofa,
  Video,
  Store,
  ChevronRight,
  Plus,
  BedDouble,
  Sprout,
  GraduationCap,
  Dog,
  PartyPopper,
  MessageSquarePlus,
} from 'lucide-react';

interface QuickCreateOption {
  id: string;
  label: string;
  subtitle: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
}

const QUICK_CREATE_OPTIONS: QuickCreateOption[] = [
  {
    id: 'vehicles',
    label: 'Sell a Vehicle',
    subtitle: 'Cars, vans, bikes & antique',
    category: 'Vehicles',
    icon: Car,
    accentClass: 'text-[#FF5A36] bg-[#FF5A36]/10 dark:bg-[#FF5A36]/15',
  },
  {
    id: 'cars_for_rent',
    label: 'Rent a Car',
    subtitle: 'Self-drive or with driver',
    category: 'Cars for Rent',
    icon: KeyRound,
    accentClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15',
  },
  {
    id: 'property',
    label: 'Property & Land',
    subtitle: 'Houses, lands & apartments',
    category: 'Property',
    icon: Building2,
    accentClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15',
  },
  {
    id: 'holiday_homes',
    label: 'Holiday Home',
    subtitle: 'Villas, cabanas & bungalows',
    category: 'Holiday Homes',
    icon: Palmtree,
    accentClass: 'text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-500/15',
  },
  {
    id: 'electronics',
    label: 'Electronics & Tech',
    subtitle: 'Phones, laptops, TVs & audio',
    category: 'Electronics',
    icon: Smartphone,
    accentClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/15',
  },
  {
    id: 'services',
    label: 'Services & Trades',
    subtitle: 'Repairs, AC, builders & events',
    category: 'Services',
    icon: Wrench,
    accentClass: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-500/15',
  },
  {
    id: 'jobs',
    label: 'Post a Job',
    subtitle: 'Full-time, part-time & remote',
    category: 'Jobs',
    icon: Briefcase,
    accentClass: 'text-violet-600 dark:text-violet-400 bg-violet-500/10 dark:bg-violet-500/15',
  },
  {
    id: 'auto_parts',
    label: 'Auto Parts & Tyres',
    subtitle: 'Spare parts, wheels & accessories',
    category: 'Auto Parts',
    icon: Wrench,
    accentClass: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-500/15',
  },
  {
    id: 'boardings',
    label: 'Boardings & Annex',
    subtitle: 'Monthly rooms, hostels & annexes',
    category: 'Boardings & Annexes',
    icon: BedDouble,
    accentClass: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-500/15',
  },
  {
    id: 'agriculture',
    label: 'Agriculture & Tea',
    subtitle: 'Spices, tea, plants & machinery',
    category: 'Agriculture & Farming',
    icon: Sprout,
    accentClass: 'text-green-600 dark:text-green-400 bg-green-500/10 dark:bg-green-500/15',
  },
  {
    id: 'weddings',
    label: 'Weddings & Events',
    subtitle: 'Bridal, Poruwa, cars & catering',
    category: 'Weddings & Events',
    icon: PartyPopper,
    accentClass: 'text-pink-600 dark:text-pink-400 bg-pink-500/10 dark:bg-pink-500/15',
  },
  {
    id: 'education',
    label: 'Education & Tuition',
    subtitle: 'A/L, O/L, IT & language classes',
    category: 'Education & Tuition',
    icon: GraduationCap,
    accentClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/15',
  },
  {
    id: 'pets',
    label: 'Pets & Aquarium',
    subtitle: 'Puppies, fish, birds & supplies',
    category: 'Pets & Animals',
    icon: Dog,
    accentClass: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/15',
  },
  {
    id: 'home_garden',
    label: 'Home & Lifestyle',
    subtitle: 'Furniture, fashion & other items',
    category: 'Home & Garden',
    icon: Sofa,
    accentClass: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 dark:bg-rose-500/15',
  },
];

interface QuickCreateMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category?: string) => void;
  onSelectVideoReel: () => void;
  onSelectEStore: () => void;
  onSelectBuyerRequest?: () => void;
}

export const QuickCreateMenu: React.FC<QuickCreateMenuProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  onSelectVideoReel,
  onSelectEStore,
  onSelectBuyerRequest,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-create-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/55 backdrop-blur-xs"
          />

          {/* Mobile Bottom Sheet / Desktop Centered Modal */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full sm:max-w-xl bg-white dark:bg-[#141722] border-t sm:border border-gray-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col z-10"
          >
            {/* Mobile Drag Handle */}
            <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>

            {/* Header */}
            <div className="px-5 sm:px-6 pt-3 sm:pt-5 pb-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <h2
                  id="quick-create-title"
                  className="text-lg sm:text-xl font-extrabold tracking-tight text-gray-900 dark:text-white [text-wrap:balance]"
                >
                  What would you like to create?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Choose a category to jump directly to the right form fields
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close quick create menu"
                className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Highlighted Looking For / Buyer Request inside Create Ad */}
              {onSelectBuyerRequest && (
                <button
                  type="button"
                  id="quick-create-looking-for-btn"
                  onClick={onSelectBuyerRequest}
                  className="w-full group flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border-2 border-[#FF5A36]/35 bg-orange-50/70 dark:bg-[#FF5A36]/12 hover:border-[#FF5A36] hover:bg-orange-50 dark:hover:bg-[#FF5A36]/20 text-left transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#FF5A36] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <MessageSquarePlus className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-black text-gray-900 dark:text-white truncate group-hover:text-[#FF5A36] transition-colors">
                        Looking For · Post Buyer Request
                      </div>
                      <div className="text-[11px] text-gray-600 dark:text-gray-300 truncate mt-0.5">
                        Post what you want to buy or rent with your max budget & receive seller offers
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#FF5A36] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* Primary Classified Ad Categories */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {QUICK_CREATE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onSelectCategory(opt.category)}
                      className="group flex items-center gap-3 p-3 sm:p-3.5 min-h-[60px] rounded-2xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#191D2B] hover:border-[#FF5A36] dark:hover:border-[#FF5A36] hover:bg-orange-50/40 dark:hover:bg-[#1E2334] text-left transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${opt.accentClass}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-[#FF5A36] transition-colors">
                          {opt.label}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {opt.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hairline Divider */}
              <div className="border-t border-gray-100 dark:border-white/10 pt-4 space-y-2.5">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Other formats & storefronts
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={onSelectVideoReel}
                    className="group flex items-center justify-between gap-3 p-3.5 min-h-[56px] rounded-2xl border border-gray-200/90 dark:border-white/10 bg-gray-50/80 dark:bg-[#191D2B] hover:border-[#FF5A36] dark:hover:border-[#FF5A36] text-left transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gray-900 dark:bg-white/10 text-white flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                          Video Story Reel
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          15s walkthrough clip
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#FF5A36] shrink-0 transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={onSelectEStore}
                    className="group flex items-center justify-between gap-3 p-3.5 min-h-[56px] rounded-2xl border border-gray-200/90 dark:border-white/10 bg-gray-50/80 dark:bg-[#191D2B] hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                          Open E-Store
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          Launch online merchant shop
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 shrink-0 transition-colors" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sticky Footer Quick Bypass */}
            <div
              style={{
                paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
              }}
              className="px-5 sm:px-6 pt-3 border-t border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-[#11131C] flex items-center justify-between gap-3 shrink-0"
            >
              <button
                type="button"
                onClick={() => onSelectCategory(undefined)}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Open Full Create Ad Form</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
