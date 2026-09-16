import React, { useState, useMemo } from 'react';
import { Listing, HeroAd } from '../types';
import {
  TrendingUp,
  Eye,
  MessageCircle,
  Phone,
  Layers,
  MapPin,
  Star,
  Award,
  Search,
  ArrowUpRight,
  Sparkles,
  Share2,
  Megaphone,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { formatLKR } from './ListingsSection';

interface AdminReachAnalyticsProps {
  listings: Listing[];
  heroAds?: HeroAd[];
  onSelectListing: (listing: Listing) => void;
  onToggleFeature?: (id: string) => Promise<void>;
}

export const AdminReachAnalytics: React.FC<AdminReachAnalyticsProps> = ({
  listings,
  heroAds = [],
  onSelectListing,
  onToggleFeature,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'views' | 'leads' | 'price'>('views');

  // Compute Core Reach Telemetry
  const totalListings = listings.length;
  const approvedListings = listings.filter((l) => l.status === 'approved');

  const totalViews = useMemo(() => {
    return listings.reduce((acc, curr) => acc + (Number(curr.views) || 0), 0);
  }, [listings]);

  const totalWhatsapp = useMemo(() => {
    return listings.reduce((acc, curr) => acc + (Number(curr.whatsappClicks) || 0), 0);
  }, [listings]);

  const totalPhone = useMemo(() => {
    return listings.reduce((acc, curr) => acc + (Number(curr.phoneClicks) || 0), 0);
  }, [listings]);

  const totalCustomerLeads = totalWhatsapp + totalPhone;

  const averageViewsPerAd = totalListings > 0 ? Math.round(totalViews / totalListings) : 0;
  const conversionRate = totalViews > 0 ? ((totalCustomerLeads / totalViews) * 100).toFixed(1) : '0.0';

  // District Breakdown
  const districtStats = useMemo(() => {
    const map: Record<string, { count: number; views: number; leads: number }> = {};
    listings.forEach((item) => {
      const dist = item.district || item.location || 'Colombo';
      if (!map[dist]) {
        map[dist] = { count: 0, views: 0, leads: 0 };
      }
      map[dist].count += 1;
      map[dist].views += Number(item.views) || 0;
      map[dist].leads += (Number(item.whatsappClicks) || 0) + (Number(item.phoneClicks) || 0);
    });
    return Object.entries(map)
      .map(([district, data]) => ({ district, ...data }))
      .sort((a, b) => b.views - a.views);
  }, [listings]);

  // Category Breakdown
  const categoryStats = useMemo(() => {
    const map: Record<string, { count: number; views: number; leads: number }> = {};
    listings.forEach((item) => {
      const cat = item.category || 'Other';
      if (!map[cat]) {
        map[cat] = { count: 0, views: 0, leads: 0 };
      }
      map[cat].count += 1;
      map[cat].views += Number(item.views) || 0;
      map[cat].leads += (Number(item.whatsappClicks) || 0) + (Number(item.phoneClicks) || 0);
    });
    return Object.entries(map)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.views - a.views);
  }, [listings]);

  // Filtered & Sorted Leaderboard
  const leaderboardAds = useMemo(() => {
    let list = [...listings];
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          (l.district && l.district.toLowerCase().includes(q)) ||
          l.location.toLowerCase().includes(q) ||
          l.phone.includes(q)
      );
    }
    if (selectedDistrictFilter !== 'all') {
      list = list.filter((l) => (l.district || l.location) === selectedDistrictFilter);
    }
    if (selectedCategoryFilter !== 'all') {
      list = list.filter((l) => l.category === selectedCategoryFilter);
    }

    if (sortBy === 'views') {
      list.sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
    } else if (sortBy === 'leads') {
      list.sort(
        (a, b) =>
          (Number(b.whatsappClicks) || 0) +
          (Number(b.phoneClicks) || 0) -
          ((Number(a.whatsappClicks) || 0) + (Number(a.phoneClicks) || 0))
      );
    } else if (sortBy === 'price') {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }
    return list;
  }, [listings, searchTerm, selectedDistrictFilter, selectedCategoryFilter, sortBy]);

  const maxViews = useMemo(() => {
    if (leaderboardAds.length === 0) return 1;
    return Math.max(...leaderboardAds.map((l) => Number(l.views) || 0), 1);
  }, [leaderboardAds]);

  const activeHeroAds = heroAds.filter((a) => a.isActive);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Live Reach & Telemetry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Customer Reach & Audience Engagement
            </h2>
            <p className="text-emerald-100/80 text-sm mt-1 max-w-2xl leading-relaxed">
              Real-time monitoring of how buyers and customers discover your advertisements, view photos,
              and connect directly with sellers across Sri Lanka.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">Lead Conversion</span>
              <span className="text-2xl font-black text-white">{conversionRate}%</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">Avg Views / Ad</span>
              <span className="text-2xl font-black text-white">{averageViewsPerAd}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Views */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-emerald-600 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Customer Views</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{totalViews.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">
            Total times customers opened & viewed ad pages
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <span>Live across {totalListings} ads</span>
            <span className="font-semibold text-emerald-600">100% cloud tracked</span>
          </div>
        </div>

        {/* WhatsApp Inquiries */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[#25D366] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">WhatsApp Inquiries</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#25D366]">
              <MessageCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{totalWhatsapp.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">
            Direct buyer chats initiated via WhatsApp
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <span>High-intent leads</span>
            <span className="font-semibold text-emerald-600">Direct deal channel</span>
          </div>
        </div>

        {/* Phone Calls */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-blue-600 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Phone Call Leads</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Phone className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 tracking-tight">{totalPhone.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-1">
            Direct telephone dials tapped by buyers
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <span>Voice connections</span>
            <span className="font-semibold text-blue-600">Instant contact</span>
          </div>
        </div>

        {/* Total Buyer Reach */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-[#FF5A36] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Customer Inquiries</span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF5A36]">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {totalCustomerLeads.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Combined WhatsApp & phone customer reach
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <span>{approvedListings.length} approved ads</span>
            <span className="font-semibold text-[#FF5A36]">{activeHeroAds.length} hero promos</span>
          </div>
        </div>
      </div>

      {/* Two Columns: Geographic & Category Reach */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* District Reach Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#FF5A36]" />
              <h3 className="font-extrabold text-gray-900 text-base">District Customer Reach</h3>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {districtStats.length} active districts
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Audience views and buyer inquiries across Sri Lanka&apos;s 25 districts.
          </p>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {districtStats.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No district data yet.</p>
            ) : (
              districtStats.map((item) => {
                const percent = totalViews > 0 ? Math.round((item.views / totalViews) * 100) : 0;
                return (
                  <div key={item.district} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-800">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#FF5A36]" />
                        {item.district}
                      </span>
                      <span className="text-gray-500">
                        {item.views} views • {item.leads} leads ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF5A36] to-orange-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percent, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Category Reach Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-gray-900 text-base">Category Reach Share</h3>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {categoryStats.length} active categories
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Distribution of customer views across marketplace categories.
          </p>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {categoryStats.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No category data yet.</p>
            ) : (
              categoryStats.map((item) => {
                const percent = totalViews > 0 ? Math.round((item.views / totalViews) * 100) : 0;
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-800">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        {item.category} ({item.count} ads)
                      </span>
                      <span className="text-gray-500">
                        {item.views} views • {item.leads} leads ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percent, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Top Performing Advertisements Leaderboard */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Customer Reach Leaderboard</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Ranked list of advertisements based on verified customer views and inquiries. Click &apos;View Ad&apos; to inspect any listing.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ads by title, phone..."
                className="pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#FF5A36] bg-white w-48 sm:w-56"
              />
            </div>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-gray-200 text-xs bg-white text-gray-700 focus:outline-hidden focus:border-[#FF5A36]"
            >
              <option value="all">All Categories</option>
              {categoryStats.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'views' | 'leads' | 'price')}
              className="py-1.5 px-3 rounded-xl border border-gray-200 text-xs bg-white font-semibold text-gray-700 focus:outline-hidden focus:border-[#FF5A36]"
            >
              <option value="views">Sort: Most Viewed</option>
              <option value="leads">Sort: Most Leads</option>
              <option value="price">Sort: Highest Price</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-4 font-bold w-14 text-center">Rank</th>
                <th className="py-3 px-4 font-bold">Advertisement Details</th>
                <th className="py-3 px-4 font-bold">Category & District</th>
                <th className="py-3 px-4 font-bold">Price</th>
                <th className="py-3 px-4 font-bold">Customer Reach</th>
                <th className="py-3 px-4 font-bold">Buyer Inquiries</th>
                <th className="py-3 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaderboardAds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No advertisements match the selected filters.
                  </td>
                </tr>
              ) : (
                leaderboardAds.map((item, idx) => {
                  const itemViews = Number(item.views) || 0;
                  const itemWhatsapp = Number(item.whatsappClicks) || 0;
                  const itemPhone = Number(item.phoneClicks) || 0;
                  const itemLeads = itemWhatsapp + itemPhone;
                  const viewPercentage = maxViews > 0 ? Math.round((itemViews / maxViews) * 100) : 0;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center">
                        {idx === 0 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-black text-xs">
                            🥇
                          </span>
                        ) : idx === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black text-xs">
                            🥈
                          </span>
                        ) : idx === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-700 font-black text-xs border border-amber-200">
                            🥉
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                        )}
                      </td>

                      {/* Advertisement Details */}
                      <td className="py-3.5 px-4">
                        <div
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => onSelectListing(item)}
                        >
                          <img
                            src={item.image || 'https://via.placeholder.com/60'}
                            alt={item.title}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-[#FF5A36] transition-colors line-clamp-1">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-500 font-mono">Tel: {item.phone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category & District */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-800 block text-xs">{item.category}</span>
                        <span className="text-[11px] text-gray-500">{item.district || item.location}</span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap">
                        {formatLKR(item.price)}
                      </td>

                      {/* Customer Reach / Views */}
                      <td className="py-3.5 px-4 whitespace-nowrap min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-black text-gray-900 text-sm">
                            {itemViews.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-400">views</span>
                        </div>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.max(viewPercentage, 5)}%` }}
                          />
                        </div>
                      </td>

                      {/* Buyer Inquiries */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#25D366] bg-emerald-50 px-2 py-0.5 rounded-md">
                            <MessageCircle className="w-3 h-3" />
                            {itemWhatsapp}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            <Phone className="w-3 h-3" />
                            {itemPhone}
                          </span>
                          <span className="text-xs text-gray-500">({itemLeads} total)</span>
                        </div>
                      </td>

                      {/* Action: 1-Click View Option */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectListing(item)}
                            title="Inspect advertisement in Customer View Modal"
                            className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold py-1.5 px-3 rounded-lg transition-colors border border-blue-200 cursor-pointer shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>View Ad</span>
                          </button>

                          {onToggleFeature && (
                            <button
                              type="button"
                              onClick={() => onToggleFeature(item.id)}
                              title={item.isFeatured ? 'Remove from Featured' : 'Feature this ad to boost reach'}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                item.isFeatured
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-gray-50 hover:bg-gray-100 text-gray-500 border-gray-200'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${item.isFeatured ? 'fill-amber-500 text-amber-500' : ''}`} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Growth & Traffic Booster Playbook */}
      <div className="bg-gradient-to-br from-slate-900 to-[#111827] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-[#FF5A36] flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">
              Admin Customer Reach Playbook: 4 Ways to 10x Platform Traffic
            </h3>
            <p className="text-xs text-slate-400">
              Proven tactics for administrator to attract more Sri Lankan buyers, boost ad views, and grow seller retention
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 hover:bg-white/10 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5">
              <Share2 className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">WhatsApp & Facebook Flyers</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Use the built-in printable Social Media Flyer Generator on any ad to share verified deal posters in buy/sell groups.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 hover:bg-white/10 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2.5">
              <Star className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">Pin High-Demand Featured Ads</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Featured listings sit right at the top of the homepage grid and generate up to 5x more clicks and WhatsApp inquiries.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 hover:bg-white/10 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center mb-2.5">
              <Megaphone className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">Hero Animated Banners</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Use the Hero Animated Ads tab to run high-converting visual promotions for seasonal sales, mega discounts, and new categories.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4.5 hover:bg-white/10 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">Award Verified Pro Badges</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Service professionals with the Verified Pro badge build trust instantly, doubling call and quote request conversion rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
