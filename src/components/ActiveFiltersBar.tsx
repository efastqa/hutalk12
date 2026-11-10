import React from 'react';
import { X, RotateCcw, ShieldCheck, Tag, MapPin, DollarSign, Search, SlidersHorizontal } from 'lucide-react';

interface ActiveFiltersBarProps {
  totalCount: number;
  searchTerm?: string;
  onClearSearch?: () => void;
  selectedCategory?: string;
  onClearCategory?: () => void;
  selectedLocation?: string;
  onClearLocation?: () => void;
  minPrice?: string;
  maxPrice?: string;
  onClearPrice?: () => void;
  verifiedOnly?: boolean;
  onToggleVerifiedOnly?: () => void;
  onResetAll?: () => void;
  hasActiveFilters?: boolean;
}

export const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({
  totalCount,
  searchTerm,
  onClearSearch,
  selectedCategory,
  onClearCategory,
  selectedLocation,
  onClearLocation,
  minPrice,
  maxPrice,
  onClearPrice,
  verifiedOnly = false,
  onToggleVerifiedOnly,
  onResetAll,
  hasActiveFilters = false,
}) => {
  const isSearchActive = Boolean(searchTerm && searchTerm.trim());
  const isCategoryActive = Boolean(selectedCategory && selectedCategory !== 'All');
  const isLocationActive = Boolean(selectedLocation && selectedLocation !== 'All Sri Lanka');
  const isPriceActive = Boolean(minPrice || maxPrice);

  const anyFilterActive =
    hasActiveFilters || isSearchActive || isCategoryActive || isLocationActive || isPriceActive || verifiedOnly;

  if (!anyFilterActive) {
    return null;
  }

  const formatLKR = (val: string) => {
    const num = Number(val);
    if (isNaN(num)) return val;
    if (num >= 1000000) return `Rs. ${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `Rs. ${(num / 1000).toFixed(0)}K`;
    return `Rs. ${num.toLocaleString()}`;
  };

  return (
    <div className="bg-white/95 dark:bg-[#151822]/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-gray-200/90 dark:border-[#2D303E] shadow-sm mb-5 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Results Counter & Active Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
            <SlidersHorizontal className="w-4 h-4 text-[#FF5A36]" />
            <span>Active Filters:</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            ({totalCount} {totalCount === 1 ? 'ad found' : 'ads found'})
          </span>
        </div>

        {/* Reset All Action */}
        {onResetAll && (
          <button
            type="button"
            onClick={onResetAll}
            className="text-xs font-bold text-[#FF5A36] hover:text-[#E04826] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>

      {/* Dismissible Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-2.5">
        {/* Search Query Chip */}
        {isSearchActive && onClearSearch && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#FF5A36] border border-orange-200/70 dark:border-orange-500/30 text-xs font-bold">
            <Search className="w-3 h-3" />
            <span>"{searchTerm}"</span>
            <button
              type="button"
              onClick={onClearSearch}
              className="ml-1 p-0.5 hover:bg-[#FF5A36]/20 rounded-full cursor-pointer transition-colors"
              title="Remove search query"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Category Chip */}
        {isCategoryActive && onClearCategory && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-500/30 text-xs font-bold">
            <Tag className="w-3 h-3" />
            <span>{selectedCategory}</span>
            <button
              type="button"
              onClick={onClearCategory}
              className="ml-1 p-0.5 hover:bg-blue-200/50 rounded-full cursor-pointer transition-colors"
              title="Clear category"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Location Chip */}
        {isLocationActive && onClearLocation && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-500/30 text-xs font-bold">
            <MapPin className="w-3 h-3" />
            <span>{selectedLocation}</span>
            <button
              type="button"
              onClick={onClearLocation}
              className="ml-1 p-0.5 hover:bg-emerald-200/50 rounded-full cursor-pointer transition-colors"
              title="Clear location filter"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Price Range Chip */}
        {isPriceActive && onClearPrice && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/30 text-xs font-bold">
            <DollarSign className="w-3 h-3" />
            <span>
              {minPrice && maxPrice
                ? `${formatLKR(minPrice)} - ${formatLKR(maxPrice)}`
                : minPrice
                ? `Min ${formatLKR(minPrice)}`
                : `Max ${formatLKR(maxPrice!)}`}
            </span>
            <button
              type="button"
              onClick={onClearPrice}
              className="ml-1 p-0.5 hover:bg-amber-200/50 rounded-full cursor-pointer transition-colors"
              title="Clear price filter"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Verified Sellers Only Toggle Chip */}
        {onToggleVerifiedOnly && (
          <button
            type="button"
            onClick={onToggleVerifiedOnly}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              verifiedOnly
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/40 shadow-2xs'
                : 'bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#2D303E] hover:border-purple-300'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${verifiedOnly ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
            <span>Verified Sellers Only</span>
            {verifiedOnly && <X className="w-3 h-3 text-purple-600" />}
          </button>
        )}
      </div>
    </div>
  );
};
