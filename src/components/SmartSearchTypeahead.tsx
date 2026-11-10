import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Clock, TrendingUp, Sparkles, MapPin, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { Listing } from '../types';

interface SmartSearchTypeaheadProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  listings?: Listing[];
  onSelectListing?: (listing: Listing) => void;
  onSelectCategory?: (category: string) => void;
  onSelectLocation?: (location: string) => void;
  placeholder?: string;
  onSubmitSearch?: () => void;
}

const TRENDING_KEYWORDS = [
  { keyword: 'Toyota Land Cruiser', category: 'Vehicles' },
  { keyword: 'iPhone 16 Pro', category: 'Electronics' },
  { keyword: 'Colombo Apartment', category: 'Property' },
  { keyword: 'Honda Vezel', category: 'Vehicles' },
  { keyword: 'Land in Kandy', category: 'Property' },
  { keyword: 'MacBook Pro', category: 'Electronics' },
  { keyword: 'Alto 800', category: 'Vehicles' },
  { keyword: 'Driver Wanted', category: 'Jobs' },
];

const RECENT_SEARCHES_KEY = 'huta_recent_searches_v2';

export const SmartSearchTypeahead: React.FC<SmartSearchTypeaheadProps> = ({
  searchTerm,
  onSearchChange,
  listings = [],
  onSelectListing,
  onSelectCategory,
  onSelectLocation,
  placeholder = 'What are you looking for? (e.g. Land Cruiser, iPhone, Apartment...)',
  onSubmitSearch,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeRecentSearch = (itemToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== itemToRemove);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live matching listings (top 4 results)
  const matchingListings = useMemo(() => {
    if (!searchTerm.trim() || listings.length === 0) return [];
    const query = searchTerm.toLowerCase().trim();
    return listings
      .filter((l) => {
        const title = (l.title || '').toLowerCase();
        const desc = (l.description || '').toLowerCase();
        const cat = (l.category || '').toLowerCase();
        const loc = (l.location || '').toLowerCase();
        return title.includes(query) || desc.includes(query) || cat.includes(query) || loc.includes(query);
      })
      .slice(0, 4);
  }, [searchTerm, listings]);

  // Compute category matches
  const matchingCategories = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const query = searchTerm.toLowerCase().trim();
    const categories = ['Vehicles', 'Property', 'Electronics', 'Home & Garden', 'Jobs', 'Services', 'E-Stores'];
    return categories.filter((c) => c.toLowerCase().includes(query));
  }, [searchTerm]);

  const handleSelectQuery = (query: string) => {
    onSearchChange(query);
    saveRecentSearch(query);
    setIsOpen(false);
    if (onSubmitSearch) onSubmitSearch();
  };

  const handleListingClick = (listing: Listing) => {
    saveRecentSearch(listing.title);
    setIsOpen(false);
    if (onSelectListing) {
      onSelectListing(listing);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === 'Enter') {
      if (searchTerm.trim()) {
        saveRecentSearch(searchTerm);
      }
      setIsOpen(false);
      if (onSubmitSearch) onSubmitSearch();
      return;
    }
  };

  const formatPrice = (price: number) => {
    return 'Rs ' + Number(price).toLocaleString('en-LK');
  };

  return (
    <div ref={containerRef} className="relative flex-1 w-full">
      {/* Search Input Bar */}
      <div className="flex items-center gap-2.5 bg-gray-100/70 dark:bg-[#1E2230]/90 px-3.5 py-2.5 rounded-xl border border-gray-200/80 dark:border-white/5 focus-within:border-[#FF5A36] focus-within:ring-2 focus-within:ring-[#FF5A36]/20 transition-all">
        <Search className="w-5 h-5 text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            onSearchChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search listings, categories and locations"
          className="bg-transparent border-none outline-none text-gray-900 dark:text-white text-sm w-full placeholder:text-gray-400 font-medium"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              inputRef.current?.focus();
            }}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-full hover:bg-gray-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Clear search"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Smart Typeahead & Autocomplete Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#151822] rounded-2xl border border-gray-200/90 dark:border-[#2D303E] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 text-left"
        >
          {/* 1. When user has not typed anything: Recent Searches + Trending Searches */}
          {!searchTerm.trim() ? (
            <div className="p-3.5 space-y-4 max-h-[420px] overflow-y-auto">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 px-1 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>Recent Searches</span>
                    </span>
                    <button
                      type="button"
                      onClick={clearAllRecent}
                      className="text-[11px] text-[#FF5A36] hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((item) => (
                      <div
                        key={item}
                        onClick={() => handleSelectQuery(item)}
                        className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100/80 dark:bg-[#1E2230] hover:bg-[#FF5A36]/10 hover:text-[#FF5A36] text-gray-700 dark:text-gray-200 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <Clock className="w-3 h-3 text-gray-400 group-hover:text-[#FF5A36]" />
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(item, e)}
                          className="ml-1 text-gray-400 hover:text-gray-700 dark:hover:text-white p-0.5 rounded-full"
                          title="Remove from history"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Suggestions */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 px-1 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>Trending in Sri Lanka</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {TRENDING_KEYWORDS.map((item) => (
                    <button
                      key={item.keyword}
                      type="button"
                      onClick={() => handleSelectQuery(item.keyword)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1E2230] text-xs font-medium text-gray-800 dark:text-gray-200 transition-colors cursor-pointer group text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <TrendingUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#FF5A36] shrink-0" />
                        <span className="truncate group-hover:text-[#FF5A36] font-semibold">{item.keyword}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">{item.category}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* 2. When user has typed query: Instant Category Matches + Live Ad Previews */
            <div className="divide-y divide-gray-100 dark:divide-[#252836] max-h-[460px] overflow-y-auto">
              {/* Category Quick Jump if matches */}
              {matchingCategories.length > 0 && (
                <div className="p-2.5 bg-gray-50/70 dark:bg-[#1A1C25]">
                  <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-2 mb-1.5 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#FF5A36]" />
                    <span>Matching Categories</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchingCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          if (onSelectCategory) onSelectCategory(cat);
                          setIsOpen(false);
                          if (onSubmitSearch) onSubmitSearch();
                        }}
                        className="px-3 py-1 rounded-lg bg-white dark:bg-[#22242F] border border-gray-200 dark:border-[#2D303E] text-xs font-bold text-gray-800 dark:text-gray-200 hover:border-[#FF5A36] hover:text-[#FF5A36] transition-colors cursor-pointer shadow-2xs"
                      >
                        Explore {cat} →
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Matching Ads Preview */}
              {matchingListings.length > 0 && (
                <div className="p-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-2 py-1 flex items-center justify-between">
                    <span>Matching Classifieds</span>
                    <span className="text-[10px] text-gray-500 font-normal">Click to view ad directly</span>
                  </div>
                  <div className="space-y-1">
                    {matchingListings.map((listing) => {
                      const image =
                        listing.images && listing.images[0]
                          ? listing.images[0]
                          : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=300&q=80';

                      return (
                        <div
                          key={listing.id}
                          onClick={() => handleListingClick(listing)}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-[#1E2230] cursor-pointer transition-all group"
                        >
                          <img
                            src={image}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-200 dark:border-[#2D303E]"
                            loading="lazy"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-[#FF5A36] transition-colors">
                                {listing.title}
                              </h5>
                              {(listing.isVerifiedPro || listing.isStoreVerified) && (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Verified Seller" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                              <span className="font-extrabold text-[#FF5A36]">{formatPrice(listing.price)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 truncate">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                {listing.location}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#FF5A36] group-hover:translate-x-0.5 transition-all shrink-0 mr-1" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* View all search results footer CTA */}
              <div className="p-2.5 bg-gray-50/80 dark:bg-[#151822] text-center">
                <button
                  type="button"
                  onClick={() => {
                    saveRecentSearch(searchTerm);
                    setIsOpen(false);
                    if (onSubmitSearch) onSubmitSearch();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>View all results for "{searchTerm}"</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
