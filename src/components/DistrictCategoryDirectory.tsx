import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Search,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { Listing } from '../types';
import {
  SRI_LANKA_DISTRICTS_SEO,
  SEO_CATEGORIES,
  TOP_MATRIX_CATEGORY_SLUGS,
  buildDistrictCategorySeoPath,
  getDistrictSeo,
  getCategorySeo,
} from '../utils/seo';

interface DistrictCategoryDirectoryProps {
  listings: Listing[];
  onSelectDistrictCategory: (district: string, category: string) => void;
  onBackToMarketplace: () => void;
}

const PROVINCES = [
  'All 9 Provinces',
  'Western Province',
  'Central Province',
  'Southern Province',
  'Northern Province',
  'Eastern Province',
  'North Western Province',
  'North Central Province',
  'Uva Province',
  'Sabaragamuwa Province',
];

export const DistrictCategoryDirectory: React.FC<DistrictCategoryDirectoryProps> = ({
  listings,
  onSelectDistrictCategory,
  onBackToMarketplace,
}) => {
  const [selectedProvince, setSelectedProvince] = useState<string>('All 9 Provinces');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedQuickCat, setSelectedQuickCat] = useState<string>('All');

  const topCategories = useMemo(
    () =>
      TOP_MATRIX_CATEGORY_SLUGS.map((slug) => getCategorySeo(slug)).filter(
        (c): c is NonNullable<typeof c> => Boolean(c)
      ),
    []
  );

  // Precompute live approved listing counts per district
  const districtCounts = useMemo(() => {
    const map: Record<string, number> = {};
    SRI_LANKA_DISTRICTS_SEO.forEach((d) => {
      map[d.name.toLowerCase()] = 0;
    });
    listings.forEach((l) => {
      if (l.status && l.status !== 'approved') return;
      const dist = (l.district || l.location || '').toLowerCase().trim();
      if (dist && map[dist] !== undefined) {
        map[dist] += 1;
      }
    });
    return map;
  }, [listings]);

  const filteredDistricts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SRI_LANKA_DISTRICTS_SEO.filter((d) => {
      if (selectedProvince !== 'All 9 Provinces' && d.province !== selectedProvince) {
        return false;
      }
      if (q) {
        return (
          d.name.toLowerCase().includes(q) ||
          d.province.toLowerCase().includes(q) ||
          d.keyTowns.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedProvince, searchQuery]);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    district: string,
    category: string
  ) => {
    e.preventDefault();
    onSelectDistrictCategory(district, category);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0C10] text-slate-900 dark:text-white pb-24 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-[#151822] border-b border-gray-200 dark:border-[#252836]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBackToMarketplace}
              className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[42px] rounded-xl bg-gray-100 dark:bg-[#1E2230] hover:bg-gray-200 dark:hover:bg-[#272B3B] text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Back to Marketplace</span>
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <a
                href="/"
                onClick={(e) => handleLinkClick(e, 'All Sri Lanka', 'All')}
                className="hover:text-[#FF5A36] font-semibold"
              >
                Sri Lanka
              </a>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <span className="font-bold text-gray-900 dark:text-white">All 25 Districts &amp; Categories</span>
            </nav>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF5A36]">
                Island-Wide SEO Directory · 25 Districts × {SEO_CATEGORIES.length} Categories
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                Explore Classifieds Across All 25 Districts of Sri Lanka
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
                Jump directly into verified local vehicles, property, boarding rooms, electronics, services &amp; jobs by district or town.
              </p>
            </div>

            <div className="relative w-full lg:w-80 shrink-0">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search district or town (e.g. Kandy, Nugegoda)..."
                className="w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D3142] text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-[#FF5A36] outline-none"
              />
            </div>
          </div>

          {/* Province & Focus Category Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {PROVINCES.map((prov) => {
                const active = selectedProvince === prov;
                return (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => setSelectedProvince(prov)}
                    className={`px-3 py-2 min-h-[38px] rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors border ${
                      active
                        ? 'bg-[#FF5A36] text-white border-[#FF5A36]'
                        : 'bg-gray-50 dark:bg-[#1E2230] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#2D3142] hover:border-[#FF5A36]'
                    }`}
                  >
                    {prov}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Layers className="w-4 h-4 text-[#FF5A36] shrink-0" />
              <select
                value={selectedQuickCat}
                onChange={(e) => setSelectedQuickCat(e.target.value)}
                aria-label="Filter directory quick category"
                className="px-3 py-2 min-h-[40px] rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D3142] text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {SEO_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 25-District Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-7 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDistricts.map((dist) => {
            const count = districtCounts[dist.name.toLowerCase()] || 0;
            const primaryHref = buildDistrictCategorySeoPath(dist.name, selectedQuickCat);
            return (
              <section
                key={dist.slug}
                className="bg-white dark:bg-[#151822] border border-gray-200/90 dark:border-[#252836] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <a
                      href={primaryHref}
                      onClick={(e) => handleLinkClick(e, dist.name, selectedQuickCat)}
                      className="group flex items-center gap-2 text-base font-black text-gray-900 dark:text-white hover:text-[#FF5A36] transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-[#FF5A36] shrink-0" />
                      <span>
                        {selectedQuickCat === 'All'
                          ? `${dist.name} District`
                          : `${selectedQuickCat} in ${dist.name}`}
                      </span>
                    </a>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
                      {count} {count === 1 ? 'ad' : 'ads'}
                    </span>
                  </div>

                  <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    {dist.province} · {dist.keyTowns}
                  </div>
                </div>

                {/* District × Top Categories Links */}
                <div className="pt-2 border-t border-gray-100 dark:border-[#252836] flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
                  {topCategories.slice(0, 6).map((cat) => {
                    const href = buildDistrictCategorySeoPath(dist.name, cat.name);
                    return (
                      <a
                        key={`${dist.slug}-${cat.slug}`}
                        href={href}
                        onClick={(e) => handleLinkClick(e, dist.name, cat.name)}
                        className="font-semibold text-gray-700 dark:text-gray-300 hover:text-[#FF5A36] dark:hover:text-[#FF7A59] transition-colors whitespace-nowrap"
                      >
                        {cat.name}
                      </a>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* All Island-Wide Category SEO Index */}
        <div className="bg-white dark:bg-[#151822] border border-gray-200/90 dark:border-[#252836] rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FF5A36]" />
            <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
              Popular Island-Wide Category Pages
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {SEO_CATEGORIES.map((cat) => (
              <a
                key={cat.slug}
                href={buildDistrictCategorySeoPath('All Sri Lanka', cat.name)}
                onClick={(e) => handleLinkClick(e, 'All Sri Lanka', cat.name)}
                className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] hover:bg-orange-50 dark:hover:bg-[#FF5A36]/15 border border-gray-200/80 dark:border-[#2D3142] hover:border-[#FF5A36]/50 text-xs font-bold text-gray-800 dark:text-gray-200 hover:text-[#FF5A36] transition-colors flex items-center justify-between gap-2"
              >
                <span className="truncate">{cat.pluralLabel}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface DistrictCategorySeoBannerProps {
  selectedDistrict?: string;
  selectedCategory?: string;
  matchingCount: number;
  onSelectDistrictCategory: (district: string, category: string) => void;
  onOpenAllDistricts: () => void;
}

export const DistrictCategorySeoBanner: React.FC<DistrictCategorySeoBannerProps> = ({
  selectedDistrict = 'All Sri Lanka',
  selectedCategory = 'All',
  matchingCount,
  onSelectDistrictCategory,
  onOpenAllDistricts,
}) => {
  const distMeta = selectedDistrict !== 'All Sri Lanka' ? getDistrictSeo(selectedDistrict) : undefined;
  const catMeta = selectedCategory !== 'All' ? getCategorySeo(selectedCategory) : undefined;

  if (!distMeta && !catMeta) return null;

  const heading =
    distMeta && catMeta
      ? `${catMeta.pluralLabel} in ${distMeta.name}`
      : distMeta
      ? `Classifieds in ${distMeta.name} (${distMeta.province})`
      : `${catMeta!.pluralLabel} Across Sri Lanka`;

  const subtext = distMeta
    ? `Covering ${distMeta.keyTowns} · ${matchingCount.toLocaleString()} live ${
        matchingCount === 1 ? 'listing' : 'listings'
      }`
    : `All 25 Sri Lankan districts · ${matchingCount.toLocaleString()} live ${
        matchingCount === 1 ? 'listing' : 'listings'
      }`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
      <div className="bg-white dark:bg-[#151822] border border-gray-200/85 dark:border-[#252836] rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <nav aria-label="SEO Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onSelectDistrictCategory('All Sri Lanka', 'All');
              }}
              className="hover:text-[#FF5A36]"
            >
              Sri Lanka
            </a>
            {distMeta && (
              <>
                <ChevronRight className="w-3 h-3 shrink-0" />
                <a
                  href={buildDistrictCategorySeoPath(distMeta.name, 'All')}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectDistrictCategory(distMeta.name, 'All');
                  }}
                  className="hover:text-[#FF5A36]"
                >
                  {distMeta.name}
                </a>
              </>
            )}
            {catMeta && (
              <>
                <ChevronRight className="w-3 h-3 shrink-0" />
                <span className="text-gray-900 dark:text-white font-bold">{catMeta.name}</span>
              </>
            )}
          </nav>

          <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
            {heading}
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 tabular-nums">{subtext}</p>
        </div>

        {/* Quick Related Links */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {distMeta &&
            !catMeta &&
            TOP_MATRIX_CATEGORY_SLUGS.slice(0, 4).map((slug) => {
              const c = getCategorySeo(slug);
              if (!c) return null;
              return (
                <a
                  key={slug}
                  href={buildDistrictCategorySeoPath(distMeta.name, c.name)}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectDistrictCategory(distMeta.name, c.name);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] hover:bg-orange-50 dark:hover:bg-[#FF5A36]/15 border border-gray-200 dark:border-[#2D3142] text-gray-800 dark:text-gray-200 hover:text-[#FF5A36] font-bold whitespace-nowrap transition-colors"
                >
                  {c.name} in {distMeta.name}
                </a>
              );
            })}

          {catMeta &&
            !distMeta &&
            ['Colombo', 'Gampaha', 'Kandy', 'Galle', 'Kurunegala'].map((dName) => (
              <a
                key={dName}
                href={buildDistrictCategorySeoPath(dName, catMeta.name)}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectDistrictCategory(dName, catMeta.name);
                }}
                className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] hover:bg-orange-50 dark:hover:bg-[#FF5A36]/15 border border-gray-200 dark:border-[#2D3142] text-gray-800 dark:text-gray-200 hover:text-[#FF5A36] font-bold whitespace-nowrap transition-colors"
              >
                {dName}
              </a>
            ))}

          <a
            href="/districts"
            onClick={(e) => {
              e.preventDefault();
              onOpenAllDistricts();
            }}
            className="px-3 py-1.5 rounded-xl bg-[#FF5A36]/10 hover:bg-[#FF5A36] text-[#FF5A36] hover:text-white font-extrabold whitespace-nowrap transition-colors"
          >
            All 25 Districts →
          </a>
        </div>
      </div>
    </div>
  );
};
