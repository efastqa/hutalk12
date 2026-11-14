import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Flame,
  RefreshCw,
  Search,
  ExternalLink,
  Share2,
  Bookmark,
  Newspaper,
  Clock,
  X,
} from 'lucide-react';
import { HotNewsArticle } from '../types';
import { DualToneHeading } from './DualToneHeading';
import hotNewsIconImg from '../assets/images/hot_news_sri_lanka_icon_1794684230454.jpg';

interface HotNewsPageProps {
  articles: HotNewsArticle[];
  sources: string[];
  lastUpdated: string;
  isLoading: boolean;
  onRefresh: () => void;
  onBackToHome: () => void;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const NEWS_TOPICS: Array<{ id: string; label: string }> = [
  { id: 'All', label: 'All Sri Lanka' },
  { id: 'Breaking', label: 'Breaking' },
  { id: 'Business & Economy', label: 'Business & Economy' },
  { id: 'Sports', label: 'Sports' },
  { id: 'Tech & Auto', label: 'Tech & Auto' },
];

function formatTimeAgo(isoDate: string): string {
  try {
    const ts = new Date(isoDate).getTime();
    if (isNaN(ts)) return 'Just now';
    const diffMins = Math.max(1, Math.floor((Date.now() - ts) / 60000));
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return new Date(ts).toLocaleDateString('en-LK', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Today';
  }
}

export const HotNewsPage: React.FC<HotNewsPageProps> = ({
  articles,
  sources,
  lastUpdated,
  isLoading,
  onRefresh,
  onBackToHome,
  onToast,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('huta_saved_news_ids');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);

  const toggleSaveArticle = (id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('huta_saved_news_ids', JSON.stringify(next));
      } catch {
        // ignore
      }
      onToast(prev.includes(id) ? 'Removed from saved stories.' : 'Story bookmarked for later.', 'info');
      return next;
    });
  };

  const handleShareArticle = async (article: HotNewsArticle) => {
    const shareText = `${article.title} (${article.source}) — Sri Lanka Hot News on HUTA.lk`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: shareText,
          url: article.link,
        });
        return;
      }
    } catch {
      // Fallback to clipboard copy
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${article.link}`);
        onToast('News link copied to clipboard.', 'success');
      }
    } catch {
      onToast('Could not copy link.', 'error');
    }
  };

  const filteredArticles = useMemo(() => {
    return articles.filter((item) => {
      if (showSavedOnly && !savedIds.includes(item.id)) return false;
      if (selectedTopic !== 'All' && item.category !== selectedTopic) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [articles, selectedTopic, searchQuery, showSavedOnly, savedIds]);

  const leadArticle = filteredArticles[0];
  const secondaryArticles = filteredArticles.slice(1);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0C10] text-gray-900 dark:text-white pb-24 transition-colors">
      {/* Sticky Top Header */}
      <div className="bg-white dark:bg-[#12141D] border-b border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="hot-news-back-btn"
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="w-11 h-11 rounded-2xl bg-[#F8F9FA] dark:bg-[#1A1D29] border border-gray-200 dark:border-white/10 overflow-hidden shrink-0 shadow-2xs">
                <img
                  src={hotNewsIconImg}
                  alt="Hot News"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[#FF5A36]">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>Sri Lanka Only</span>
                  </span>
                  <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">·</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                    <span>Live Feed</span>
                  </span>
                </div>
                <DualToneHeading
                  as="h1"
                  size="lg"
                  theme="auto"
                  primaryText="Sri Lanka"
                  accentText="Hot News"
                  showUnderline={false}
                  align="left"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSavedOnly((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  showSavedOnly
                    ? 'bg-[#FF5A36] text-white border-[#FF5A36]'
                    : 'bg-white dark:bg-[#181B26] text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10 hover:border-[#FF5A36]/50'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${showSavedOnly ? 'fill-current' : ''}`} />
                <span>Saved ({savedIds.length})</span>
              </button>

              <button
                type="button"
                id="hot-news-refresh-btn"
                onClick={onRefresh}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A2540] dark:bg-[#FF5A36] hover:opacity-90 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Updating...' : 'Refresh Live'}</span>
              </button>
            </div>
          </div>

          {/* Search & Topic Tabs */}
          <div className="mt-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {NEWS_TOPICS.map((topic) => {
                const isActive = selectedTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#FF5A36] text-white shadow-2xs'
                        : 'bg-gray-100 dark:bg-[#191C28] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#232738]'
                    }`}
                  >
                    {topic.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Sri Lanka headlines..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-100 dark:bg-[#191C28] border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-[#FF5A36] focus:bg-white dark:focus:bg-[#1E2230] outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear news search"
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Sources Metadata Line */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
            <span>Sources: {sources.length > 0 ? sources.slice(0, 5).join(' · ') : 'Newswire.lk · EconomyNext · Sri Lanka News'}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Clock className="w-3 h-3" />
              Updated {lastUpdated ? formatTimeAgo(lastUpdated) : 'live'}
            </span>
          </div>
        </div>
      </div>

      {/* Main News Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {isLoading && articles.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white dark:bg-[#151822] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-pulse"
              >
                <div className="h-44 bg-gray-200 dark:bg-gray-800" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-white dark:bg-[#151822] rounded-3xl border border-gray-200 dark:border-white/10 p-10 text-center space-y-3">
            <Newspaper className="w-10 h-10 text-[#FF5A36] mx-auto" />
            <h2 className="text-base sm:text-lg font-bold">
              {showSavedOnly ? 'No saved Sri Lanka news stories yet' : 'No matching Sri Lanka news stories found'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Try clearing your search filters or refresh the live Sri Lanka news feed.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedTopic('All');
                  setSearchQuery('');
                  setShowSavedOnly(false);
                }}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={onRefresh}
                className="px-4 py-2 rounded-xl bg-[#FF5A36] text-white text-xs font-bold cursor-pointer"
              >
                Refresh Feed
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Lead Story Split Card */}
            {leadArticle && (
              <article className="bg-white dark:bg-[#151822] rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
                <div className="lg:col-span-6 relative min-h-[220px] sm:min-h-[280px] bg-gradient-to-br from-[#0A2540] via-[#133B63] to-[#FF5A36]/80">
                  {leadArticle.imageUrl && !failedImages[leadArticle.id] ? (
                    <img
                      src={leadArticle.imageUrl}
                      alt={leadArticle.title}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [leadArticle.id]: true }))
                      }
                      className="w-full h-full object-cover lg:absolute lg:inset-0"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-white text-center gap-3">
                      <img
                        src={hotNewsIconImg}
                        alt={leadArticle.source}
                        className="w-20 h-20 rounded-2xl object-cover shadow-lg border border-white/20"
                      />
                      <span className="text-xs font-bold tracking-wider uppercase text-white/80">
                        {leadArticle.source} · Sri Lanka
                      </span>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-6 p-5 sm:p-8 flex flex-col justify-between gap-5">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-black text-[#FF5A36] uppercase tracking-wider">Top Story</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{leadArticle.source}</span>
                      <span aria-hidden="true">·</span>
                      <span>{leadArticle.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{formatTimeAgo(leadArticle.publishedAt)}</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug text-gray-900 dark:text-white [text-wrap:balance]">
                      {leadArticle.title}
                    </h2>

                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                      {leadArticle.summary}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                    <a
                      href={leadArticle.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-black transition-all no-underline whitespace-nowrap"
                    >
                      <span>Read Full Story</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSaveArticle(leadArticle.id)}
                        className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                          savedIds.includes(leadArticle.id)
                            ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF5A36] border-[#FF5A36]/40'
                            : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:text-[#FF5A36]'
                        }`}
                        aria-label="Bookmark story"
                      >
                        <Bookmark className={`w-4 h-4 ${savedIds.includes(leadArticle.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShareArticle(leadArticle)}
                        className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:text-[#FF5A36] transition-colors cursor-pointer"
                        aria-label="Share story"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* Grid of Sri Lanka News Stories */}
            {secondaryArticles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {secondaryArticles.map((article, index) => {
                  const imgKey = article.link || `${article.id}-${index}`;
                  const hasValidImg = Boolean(article.imageUrl) && !failedImages[imgKey];
                  const isSaved = savedIds.includes(article.id);
                  return (
                    <article
                      key={`${article.id}-${index}`}
                      className="bg-white dark:bg-[#151822] rounded-2xl border border-gray-200 dark:border-white/10 shadow-xs overflow-hidden flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                    >
                      <div>
                        {/* Visual Slot with Zero-Broken-Image CSS Fallback */}
                        <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#1B2030] dark:to-[#12141D] overflow-hidden">
                          {hasValidImg ? (
                            <img
                              src={article.imageUrl}
                              alt={article.title}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setFailedImages((prev) => ({ ...prev, [imgKey]: true }))
                              }
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-5 text-center gap-2 bg-gradient-to-br from-[#0A2540]/90 to-[#1D3E5E]/90 text-white">
                              <Newspaper className="w-8 h-8 text-[#FF5A36]" />
                              <span className="text-xs font-bold tracking-wide text-white/85">
                                {article.source}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-4 space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            <span className="font-bold text-[#FF5A36]">{article.source}</span>
                            <span aria-hidden="true">·</span>
                            <span>{article.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{formatTimeAgo(article.publishedAt)}</span>
                          </div>

                          <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white leading-snug line-clamp-2">
                            {article.title}
                          </h3>

                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                            {article.summary}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 py-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-2">
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-black text-[#FF5A36] hover:underline no-underline whitespace-nowrap"
                        >
                          <span>Read Story</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleSaveArticle(article.id)}
                            aria-label="Bookmark news article"
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isSaved
                                ? 'text-[#FF5A36] bg-orange-50 dark:bg-orange-950/40'
                                : 'text-gray-400 hover:text-[#FF5A36]'
                            }`}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShareArticle(article)}
                            aria-label="Share news article"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#FF5A36] transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
