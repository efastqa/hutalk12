import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { HotNewsArticle } from '../types';
import { api } from '../services/api';
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

function getSafeExternalUrl(url?: string): string {
  if (typeof url === 'string' && /^https?:\/\//i.test(url.trim())) {
    return url.trim();
  }
  return '#';
}

export const HotNewsPage: React.FC<HotNewsPageProps> = ({
  articles = [],
  sources = [],
  lastUpdated,
  isLoading,
  onRefresh,
  onBackToHome,
  onToast,
}) => {
  const safeArticles = Array.isArray(articles) ? articles : [];
  const safeSources = Array.isArray(sources) ? sources : [];

  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('huta_saved_news_ids');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      return [];
    }
  });
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);

  // In-app story reader modal state
  const [activeArticle, setActiveArticle] = useState<HotNewsArticle | null>(null);
  const [articleParagraphs, setArticleParagraphs] = useState<string[]>([]);
  const [resolvedArticleUrl, setResolvedArticleUrl] = useState<string>('');
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | undefined>(undefined);
  const [isLoadingArticleBody, setIsLoadingArticleBody] = useState<boolean>(false);

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
    const shareUrl = getSafeExternalUrl(article.link);
    const shareText = `${article.title || 'Sri Lanka News'} (${article.source || 'HUTA.lk'}) — Sri Lanka Hot News on HUTA.lk`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: shareText,
          url: shareUrl !== '#' ? shareUrl : window.location.href,
        });
        return;
      }
    } catch {
      // Fallback to clipboard copy
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl !== '#' ? `${shareText}\n${shareUrl}` : shareText);
        onToast('News link copied to clipboard.', 'success');
      }
    } catch {
      onToast('Could not copy link.', 'error');
    }
  };

  const filteredArticles = useMemo(() => {
    return safeArticles.filter((item) => {
      if (!item) return false;
      if (showSavedOnly && !savedIds.includes(item.id)) return false;
      if (selectedTopic !== 'All' && item.category !== selectedTopic) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          (item.title || '').toLowerCase().includes(q) ||
          (item.summary || '').toLowerCase().includes(q) ||
          (item.source || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [safeArticles, selectedTopic, searchQuery, showSavedOnly, savedIds]);

  const openStoryReader = (article: HotNewsArticle) => {
    setActiveArticle(article);
    setArticleParagraphs([]);
    setResolvedArticleUrl(getSafeExternalUrl(article.link));
    setResolvedImageUrl(article.imageUrl);
  };

  useEffect(() => {
    if (!activeArticle) return;
    let cancelled = false;
    const safeUrl = getSafeExternalUrl(activeArticle.link);
    if (safeUrl === '#') {
      setIsLoadingArticleBody(false);
      return;
    }

    setIsLoadingArticleBody(true);
    api
      .getSriLankaNewsArticlePreview(safeUrl)
      .then((res) => {
        if (cancelled) return;
        if (Array.isArray(res.paragraphs) && res.paragraphs.length > 0) {
          setArticleParagraphs(res.paragraphs);
        }
        if (res.resolvedUrl && /^https?:\/\//i.test(res.resolvedUrl)) {
          setResolvedArticleUrl(res.resolvedUrl);
        }
        if (res.imageUrl && !activeArticle.imageUrl) {
          setResolvedImageUrl(res.imageUrl);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingArticleBody(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeArticle]);

  useEffect(() => {
    if (!activeArticle) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveArticle(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeArticle]);

  const activeArticleIndex = activeArticle
    ? filteredArticles.findIndex((item) => item.id === activeArticle.id)
    : -1;

  const leadArticle = filteredArticles[0];
  const secondaryArticles = filteredArticles.slice(1);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0C10] text-gray-900 dark:text-white pb-24 transition-colors">
      {/* Top Header */}
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
            <span>
              Sources:{' '}
              {safeSources.length > 0
                ? safeSources.slice(0, 5).join(' · ')
                : 'Newswire.lk · EconomyNext · Sri Lanka News'}
            </span>
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
        {isLoading && safeArticles.length === 0 ? (
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
              <article
                onClick={() => openStoryReader(leadArticle)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openStoryReader(leadArticle);
                  }
                }}
                className="bg-white dark:bg-[#151822] rounded-3xl border border-gray-200 dark:border-white/10 hover:border-[#FF5A36]/50 shadow-sm hover:shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch cursor-pointer transition-all group"
              >
                <div className="lg:col-span-6 relative min-h-[220px] sm:min-h-[280px] bg-gradient-to-br from-[#0A2540] via-[#133B63] to-[#FF5A36]/80">
                  {leadArticle.imageUrl && !failedImages[leadArticle.id] ? (
                    <img
                      src={leadArticle.imageUrl}
                      alt={leadArticle.title}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [leadArticle.id]: true }))
                      }
                      className="w-full h-full object-cover lg:absolute lg:inset-0 group-hover:scale-[1.02] transition-transform duration-300"
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

                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-snug text-gray-900 dark:text-white group-hover:text-[#FF5A36] transition-colors [text-wrap:balance]">
                      {leadArticle.title}
                    </h2>

                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                      {leadArticle.summary}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openStoryReader(leadArticle);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-black transition-all whitespace-nowrap cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Read Story</span>
                      </button>

                      <a
                        href={getSafeExternalUrl(leadArticle.link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 text-xs font-bold transition-colors no-underline whitespace-nowrap"
                        title={`Open original source on ${leadArticle.source}`}
                      >
                        <span>Source</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveArticle(leadArticle.id);
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareArticle(leadArticle);
                        }}
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
                      onClick={() => openStoryReader(article)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openStoryReader(article);
                        }
                      }}
                      className="bg-white dark:bg-[#151822] rounded-2xl border border-gray-200 dark:border-white/10 hover:border-[#FF5A36]/40 shadow-xs overflow-hidden flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer group"
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
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

                          <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white group-hover:text-[#FF5A36] transition-colors leading-snug line-clamp-2">
                            {article.title}
                          </h3>

                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                            {article.summary}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 py-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openStoryReader(article);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-black text-[#FF5A36] hover:underline whitespace-nowrap cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Read Story</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={getSafeExternalUrl(article.link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Open original article on ${article.source}`}
                            title={`Open on ${article.source}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#FF5A36] transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSaveArticle(article.id);
                            }}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareArticle(article);
                            }}
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

      {/* In-App Sri Lanka News Reader Modal */}
      {activeArticle && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setActiveArticle(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="news-reader-title"
        >
          <div
            className="w-full max-w-3xl bg-white dark:bg-[#141722] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-[#FF5A36] font-black uppercase tracking-wider shrink-0">
                  {activeArticle.category}
                </span>
                <span className="font-bold text-gray-800 dark:text-gray-200 truncate">
                  {activeArticle.source}
                </span>
                <span aria-hidden="true" className="text-gray-300 dark:text-gray-600">·</span>
                <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap tabular-nums">
                  {formatTimeAgo(activeArticle.publishedAt)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                aria-label="Close news reader"
                className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Article Content */}
            <div className="overflow-y-auto flex-1">
              {(resolvedImageUrl || activeArticle.imageUrl) && !failedImages[activeArticle.id] && (
                <div className="w-full max-h-72 sm:max-h-80 overflow-hidden bg-gray-100 dark:bg-[#0D1018]">
                  <img
                    src={resolvedImageUrl || activeArticle.imageUrl}
                    alt={activeArticle.title}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [activeArticle.id]: true }))
                    }
                    className="w-full h-full max-h-80 object-cover"
                  />
                </div>
              )}

              <div className="p-5 sm:p-7 space-y-4">
                <h2
                  id="news-reader-title"
                  className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-snug"
                >
                  {activeArticle.title}
                </h2>

                {isLoadingArticleBody && articleParagraphs.length === 0 ? (
                  <div className="space-y-3 py-2">
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                      {activeArticle.content || activeArticle.summary}
                    </p>
                    <div className="space-y-2 animate-pulse pt-2">
                      <div className="h-3.5 bg-gray-200 dark:bg-white/10 rounded w-full" />
                      <div className="h-3.5 bg-gray-200 dark:bg-white/10 rounded w-11/12" />
                      <div className="h-3.5 bg-gray-200 dark:bg-white/10 rounded w-4/5" />
                    </div>
                  </div>
                ) : articleParagraphs.length > 0 ? (
                  <div className="space-y-3.5 text-sm sm:text-base text-gray-700 dark:text-gray-200 leading-relaxed">
                    {articleParagraphs.map((para, idx) => (
                      <p key={idx}>{para}</p>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 text-sm sm:text-base text-gray-700 dark:text-gray-200 leading-relaxed">
                    <p>{activeArticle.content || activeArticle.summary}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 py-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-[#10121B] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={activeArticleIndex <= 0}
                  onClick={() => {
                    if (activeArticleIndex > 0) {
                      openStoryReader(filteredArticles[activeArticleIndex - 1]);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  type="button"
                  disabled={activeArticleIndex < 0 || activeArticleIndex >= filteredArticles.length - 1}
                  onClick={() => {
                    if (activeArticleIndex >= 0 && activeArticleIndex < filteredArticles.length - 1) {
                      openStoryReader(filteredArticles[activeArticleIndex + 1]);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleSaveArticle(activeArticle.id)}
                  className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                    savedIds.includes(activeArticle.id)
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-[#FF5A36] border-[#FF5A36]/40'
                      : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10'
                  }`}
                  aria-label="Bookmark story"
                >
                  <Bookmark className={`w-4 h-4 ${savedIds.includes(activeArticle.id) ? 'fill-current' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => handleShareArticle(activeArticle)}
                  className="p-2.5 rounded-xl bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 cursor-pointer"
                  aria-label="Share story"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <a
                  href={resolvedArticleUrl || getSafeExternalUrl(activeArticle.link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-black transition-colors no-underline whitespace-nowrap"
                >
                  <span>Open on {activeArticle.source}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
