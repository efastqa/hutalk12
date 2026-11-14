import React, { useState, useEffect } from 'react';
import { Flame, ChevronLeft, ChevronRight, ArrowRight, RefreshCw, Newspaper } from 'lucide-react';
import { HotNewsArticle } from '../types';
import hotNewsIconImg from '../assets/images/hot_news_sri_lanka_icon_1794684230454.jpg';

interface HotNewsWidgetProps {
  articles: HotNewsArticle[];
  isLoading: boolean;
  onOpenHotNews: () => void;
  onRefresh: () => void;
}

function formatRelativeTime(isoDate: string): string {
  try {
    const ts = new Date(isoDate).getTime();
    if (isNaN(ts)) return 'Live';
    const diffMins = Math.max(1, Math.floor((Date.now() - ts) / 60000));
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Live';
  }
}

export const HotNewsWidget: React.FC<HotNewsWidgetProps> = ({
  articles,
  isLoading,
  onOpenHotNews,
  onRefresh,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const featuredSlides = articles.slice(0, 10);

  useEffect(() => {
    if (activeIndex >= featuredSlides.length && featuredSlides.length > 0) {
      setActiveIndex(0);
    }
  }, [featuredSlides.length, activeIndex]);

  useEffect(() => {
    if (isPaused || featuredSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featuredSlides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isPaused, featuredSlides.length]);

  const currentArticle = featuredSlides[activeIndex];

  return (
    <section
      aria-label="Sri Lanka Live Hot News"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-1"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="bg-white dark:bg-[#12141D] rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-sm p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-5">
        {/* Left: Attached-Style Rounded Tile "Hot News" Icon Integrated with Live Indicator */}
        <button
          type="button"
          id="hot-news-icon-tile-btn"
          onClick={onOpenHotNews}
          className="group flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-1.5 shrink-0 cursor-pointer text-left sm:text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36] rounded-2xl p-1"
          title="Open Sri Lanka Live Hot News"
        >
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#F8F9FA] dark:bg-[#1A1D29] border border-gray-200/80 dark:border-white/10 shadow-2xs overflow-hidden flex items-center justify-center group-hover:scale-[1.03] group-hover:border-[#FF5A36]/50 transition-all duration-200 shrink-0">
            <img
              src={hotNewsIconImg}
              alt="Sri Lanka Hot News Icon"
              className="w-full h-full object-cover"
            />
            {articles.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-[#1A1D29]" />
              </span>
            )}
          </div>

          <div className="flex flex-col sm:items-center">
            <span className="text-sm font-black tracking-tight text-gray-900 dark:text-white group-hover:text-[#FF5A36] transition-colors whitespace-nowrap">
              Hot News
            </span>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 sm:hidden">
              Sri Lanka Live Feed · Tap to read
            </span>
          </div>
        </button>

        <div className="hidden sm:block w-px self-stretch bg-gray-200/80 dark:bg-white/10" aria-hidden="true" />

        {/* Right: Live Sri Lanka Breaking News Ticker Stream */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-black text-[#FF5A36] uppercase tracking-wider text-[11px]">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>Sri Lanka Hot News</span>
              </span>
              <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">·</span>
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 tabular-nums">
                {articles.length > 0 ? `Live · ${articles.length} stories` : isLoading ? 'Connecting live feed...' : 'Sri Lanka Edition'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {featuredSlides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex((prev) => (prev - 1 + featuredSlides.length) % featuredSlides.length)
                    }
                    aria-label="Previous Sri Lanka news story"
                    className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIndex((prev) => (prev + 1) % featuredSlides.length)}
                    aria-label="Next Sri Lanka news story"
                    className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                aria-label="Refresh Sri Lanka news feed"
                title="Refresh live Sri Lanka news"
                className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {currentArticle ? (
            <button
              type="button"
              onClick={onOpenHotNews}
              className="group w-full text-left flex items-center justify-between gap-3 rounded-2xl bg-gray-50/90 dark:bg-[#191C28] hover:bg-orange-50/60 dark:hover:bg-[#1F2333] border border-gray-200/70 dark:border-white/5 px-3.5 py-2.5 transition-all cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#FF5A36] transition-colors line-clamp-1">
                  {currentArticle.title}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{currentArticle.source}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentArticle.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{formatRelativeTime(currentArticle.publishedAt)}</span>
                </div>
              </div>

              <span className="shrink-0 inline-flex items-center gap-1 text-xs font-black text-[#FF5A36] whitespace-nowrap">
                <span className="hidden md:inline">Read Hot News</span>
                <span className="md:hidden">Read</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenHotNews}
              className="w-full text-left flex items-center justify-between gap-3 rounded-2xl bg-gray-50/90 dark:bg-[#191C28] border border-gray-200/70 dark:border-white/5 px-3.5 py-2.5 cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                <Newspaper className="w-4 h-4 text-[#FF5A36] shrink-0" />
                <span>
                  {isLoading
                    ? 'Fetching latest breaking news across Sri Lanka...'
                    : 'Tap to explore Sri Lanka Hot News headlines'}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
