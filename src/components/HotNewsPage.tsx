import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
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
  Radio,
  ArrowUpRight,
} from 'lucide-react';
import { HotNewsArticle } from '../types';
import { api } from '../services/api';
import hotNewsIconImg from '../assets/images/hot_news_sri_lanka_icon_1794684230454.jpg';
import hotNewsColomboDaylightImg from '../assets/images/hot_news_colombo_daylight_1795079034857.jpg';
import hotNewsNewsroomBrightImg from '../assets/images/hot_news_newsroom_bright_1795079034894.jpg';
import hotNewsEconomyDaylightImg from '../assets/images/hot_news_economy_daylight_1795079033833.jpg';

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

interface HotNewsHeroSlide {
  id: string;
  desk: string;
  title: string;
  tagline: string;
  image: string;
  topics: string[];
  objectPosition: string;
  scaleFrom: number;
  scaleTo: number;
  xFrom: string;
  xTo: string;
}

const HOT_NEWS_HERO_DURATION_MS = 6500;

const HOT_NEWS_HERO_SLIDES: HotNewsHeroSlide[] = [
  {
    id: 'colombo-metro-desk',
    desk: 'Colombo Metro Desk',
    title: 'Island Headlines & Civic Dispatch',
    tagline: 'Verified real-time reporting across Colombo, provincial councils, sports, and national affairs.',
    image: hotNewsColomboDaylightImg,
    topics: ['All', 'Sports'],
    objectPosition: '50% 42%',
    scaleFrom: 1.01,
    scaleTo: 1.07,
    xFrom: '0%',
    xTo: '-1.5%',
  },
  {
    id: 'breaking-newsroom-studio',
    desk: 'Live Digital Newsroom',
    title: 'Breaking Alerts & Flash Reports',
    tagline: 'Rapid national bulletins, legislative updates, weather advisories, and priority Sri Lanka dispatches.',
    image: hotNewsNewsroomBrightImg,
    topics: ['Breaking'],
    objectPosition: '50% 45%',
    scaleFrom: 1.06,
    scaleTo: 1.01,
    xFrom: '-1.2%',
    xTo: '1.2%',
  },
  {
    id: 'port-city-economy-desk',
    desk: 'Port City & Markets',
    title: 'Economy, Trade & Tech Pulse',
    tagline: 'LKR currency movements, Port City Colombo investments, tourism recovery, and mobility news.',
    image: hotNewsEconomyDaylightImg,
    topics: ['Business & Economy', 'Tech & Auto'],
    objectPosition: '50% 48%',
    scaleFrom: 1.02,
    scaleTo: 1.08,
    xFrom: '1.2%',
    xTo: '-1.2%',
  },
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
  const prefersReducedMotion = useReducedMotion();
  const [heroSlideIndex, setHeroSlideIndex] = useState<number>(0);
  const [isHeroPaused, setIsHeroPaused] = useState<boolean>(false);

  // In-app story reader modal state
  const [activeArticle, setActiveArticle] = useState<HotNewsArticle | null>(null);
  const [articleParagraphs, setArticleParagraphs] = useState<string[]>([]);
  const [resolvedArticleUrl, setResolvedArticleUrl] = useState<string>('');
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | undefined>(undefined);
  const [isLoadingArticleBody, setIsLoadingArticleBody] = useState<boolean>(false);

  const activeHeroSlide = HOT_NEWS_HERO_SLIDES[heroSlideIndex % HOT_NEWS_HERO_SLIDES.length];

  const handleCycleHero = useCallback((direction: 1 | -1) => {
    setHeroSlideIndex((prev) => (prev + direction + HOT_NEWS_HERO_SLIDES.length) % HOT_NEWS_HERO_SLIDES.length);
  }, []);

  const handleSelectTopic = useCallback((topicId: string) => {
    setSelectedTopic(topicId);
    const matchingSlideIndex = HOT_NEWS_HERO_SLIDES.findIndex((slide) => slide.topics.includes(topicId));
    if (matchingSlideIndex >= 0) {
      setHeroSlideIndex(matchingSlideIndex);
    }
  }, []);

  useEffect(() => {
    if (isHeroPaused || prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setHeroSlideIndex((prev) => (prev + 1) % HOT_NEWS_HERO_SLIDES.length);
    }, HOT_NEWS_HERO_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [isHeroPaused, prefersReducedMotion]);

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

  const leadArticle =
    filteredArticles.find((a) => Boolean(a.imageUrl) && !failedImages[a.id]) ||
    filteredArticles[0];
  const secondaryArticles = filteredArticles.filter((a) => a !== leadArticle);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0C10] text-gray-900 dark:text-white pb-24 transition-colors">
      {/* Bright Sunlit Sri Lanka Hot News Photographic Hero Banner */}
      <header
        className="relative overflow-hidden bg-[#EAF2FA] dark:bg-[#0E1525] text-slate-900 dark:text-white border-b border-slate-200/80 dark:border-slate-800/80 transition-colors"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
      >
        {/* Cross-Fading Bright Daylight Sri Lanka Photography + Subtle Ken Burns Motion */}
        <AnimatePresence initial={false}>
          <motion.img
            key={activeHeroSlide.id}
            src={activeHeroSlide.image}
            alt={`${activeHeroSlide.desk} — ${activeHeroSlide.title}`}
            referrerPolicy="no-referrer"
            initial={{
              opacity: 0,
              scale: prefersReducedMotion ? 1 : activeHeroSlide.scaleFrom,
              x: prefersReducedMotion ? '0%' : activeHeroSlide.xFrom,
            }}
            animate={{
              opacity: 1,
              scale: prefersReducedMotion ? 1 : activeHeroSlide.scaleTo,
              x: prefersReducedMotion ? '0%' : activeHeroSlide.xTo,
            }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.85, ease: 'easeInOut' },
              scale: { duration: HOT_NEWS_HERO_DURATION_MS / 1000 + 0.6, ease: 'linear' },
              x: { duration: HOT_NEWS_HERO_DURATION_MS / 1000 + 0.6, ease: 'linear' },
            }}
            style={{ objectPosition: activeHeroSlide.objectPosition }}
            className="absolute inset-0 w-full h-full object-cover brightness-[1.04] saturate-[1.06] pointer-events-none select-none"
          />
        </AnimatePresence>

        {/* Airy Luminous Directional Veil (mobile, tablet, desktop tuned for bright scenery + crisp WCAG AA legibility) */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/15 to-white/60 dark:from-[#0B1120]/50 dark:via-transparent dark:to-[#0B1120]/70 pointer-events-none z-[1]" />
        <div className="absolute inset-y-0 left-0 w-full md:w-3/4 bg-gradient-to-r from-white/88 via-white/55 to-transparent dark:from-[#0B1120]/82 dark:via-[#0B1120]/45 dark:to-transparent pointer-events-none z-[1]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10 flex flex-col justify-between gap-5 sm:gap-6 min-h-[290px] sm:min-h-[320px] lg:min-h-[360px]">
          {/* Top Hero Navigation & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <button
              type="button"
              id="hot-news-back-btn"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 min-h-[42px] sm:min-h-[40px] rounded-xl bg-white/90 hover:bg-white dark:bg-slate-900/75 dark:hover:bg-slate-900/90 backdrop-blur-md border border-white/85 dark:border-white/20 text-xs sm:text-sm font-bold text-slate-900 dark:text-white shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36]"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Back to Marketplace</span>
              <span className="sm:hidden">Back</span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowSavedOnly((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 min-h-[42px] sm:min-h-[40px] rounded-xl text-xs font-bold border backdrop-blur-md transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36] ${
                  showSavedOnly
                    ? 'bg-[#FF5A36] text-white border-[#FF5A36] shadow-lg shadow-[#FF5A36]/25'
                    : 'bg-white/90 hover:bg-white dark:bg-slate-900/75 dark:hover:bg-slate-900/90 text-slate-900 dark:text-white border-white/85 dark:border-white/20'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 shrink-0 ${showSavedOnly ? 'fill-current' : ''}`} />
                <span>Saved ({savedIds.length})</span>
              </button>

              <button
                type="button"
                id="hot-news-refresh-btn"
                onClick={onRefresh}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 min-h-[42px] sm:min-h-[40px] rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-extrabold shadow-lg shadow-[#FF5A36]/25 transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="sm:hidden">{isLoading ? 'Updating...' : 'Refresh'}</span>
                <span className="hidden sm:inline">{isLoading ? 'Updating...' : 'Refresh Live'}</span>
              </button>
            </div>
          </div>

          {/* Main Hero Editorial Showcase (Single column on mobile, split 7/5 on tablet & desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-end">
            <div className="md:col-span-7 space-y-2.5 sm:space-y-3 min-w-0">
              {/* Unboxed Editorial Dispatch Context */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-white/85">
                <span className="inline-flex items-center gap-1 font-black uppercase tracking-wider text-[#D94322] dark:text-[#FF7857]">
                  <Flame className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>Sri Lanka Dispatch</span>
                </span>
                <span aria-hidden="true" className="text-slate-400 dark:text-white/40">·</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-bold">
                  <Radio className="w-3.5 h-3.5 shrink-0" />
                  <span>Live Newsroom</span>
                </span>
                <span aria-hidden="true" className="text-slate-400 dark:text-white/40">·</span>
                <span className="tabular-nums text-slate-700 dark:text-white/85">
                  {safeArticles.length} verified {safeArticles.length === 1 ? 'story' : 'stories'}
                </span>
              </div>

              {/* Brand Mark + Display Headline */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-11 h-11 sm:w-13 sm:h-13 lg:w-14 lg:h-14 rounded-2xl bg-white/95 dark:bg-[#141A29]/90 border border-white dark:border-white/25 overflow-hidden shrink-0 shadow-md">
                  <img
                    src={hotNewsIconImg}
                    alt="Sri Lanka Hot News"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="text-[1.65rem] sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08] [text-wrap:balance] min-w-0">
                  <span className="text-[#0A2540] dark:text-white">Sri Lanka </span>
                  <span className="text-[#FF5A36]">Hot News</span>
                </h1>
              </div>

              {/* Rotating Editorial Desk Scene Context */}
              <div className="min-h-[44px] sm:min-h-[48px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeHeroSlide.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="space-y-1 min-w-0"
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs font-extrabold tracking-wide">
                      <span className="text-[#0A2540] dark:text-amber-300 uppercase tracking-wider">{activeHeroSlide.desk}</span>
                      <span aria-hidden="true" className="text-slate-400 dark:text-white/35">·</span>
                      <span className="text-slate-900 dark:text-white">{activeHeroSlide.title}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 max-w-2xl leading-relaxed line-clamp-2 font-medium">
                      {activeHeroSlide.tagline}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column: Interactive Top Briefing Card + Slide Stepper */}
            <div className="md:col-span-5 flex flex-col items-stretch md:items-end justify-end gap-2.5 sm:gap-3 min-w-0">
              {leadArticle && (
                <button
                  type="button"
                  onClick={() => openStoryReader(leadArticle)}
                  className="w-full text-left rounded-2xl bg-white/88 hover:bg-white dark:bg-slate-900/75 dark:hover:bg-slate-900/90 backdrop-blur-xl border border-white/85 dark:border-white/15 hover:border-[#FF5A36]/60 p-3.5 sm:p-4 transition-all cursor-pointer group shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[11px] text-slate-600 dark:text-white/75 mb-1">
                    <span className="font-black uppercase tracking-wider text-[#D94322] dark:text-[#FF7857]">
                      Featured Briefing
                    </span>
                    <span className="tabular-nums text-slate-600 dark:text-white/75 truncate max-w-full">
                      {leadArticle.source} · {formatTimeAgo(leadArticle.publishedAt)}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#FF5A36] dark:group-hover:text-[#FF8A6E] transition-colors line-clamp-2 leading-snug">
                    {leadArticle.title}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-[#0A2540] dark:text-amber-300">
                    <span>Open full briefing</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </button>
              )}

              {/* Backdrop Stepper & Arrows */}
              <div className="flex items-center justify-between md:justify-end gap-2.5 w-full">
                <div
                  className="flex items-center gap-1.5 bg-white/85 dark:bg-slate-900/65 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/80 dark:border-white/15 shadow-sm"
                  role="tablist"
                  aria-label="Hot News hero scenes"
                >
                  {HOT_NEWS_HERO_SLIDES.map((slide, idx) => {
                    const isActive = idx === heroSlideIndex;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`Show ${slide.desk}`}
                        onClick={() => setHeroSlideIndex(idx)}
                        className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-300 cursor-pointer ${
                          isActive
                            ? 'w-8 sm:w-10 bg-slate-900/20 dark:bg-white/30'
                            : 'w-2.5 bg-slate-900/35 hover:bg-slate-900/65 dark:bg-white/40 dark:hover:bg-white/75'
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            key={`news-progress-${slide.id}-${heroSlideIndex}`}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{
                              duration: isHeroPaused || prefersReducedMotion ? 0 : HOT_NEWS_HERO_DURATION_MS / 1000,
                              ease: 'linear',
                            }}
                            style={{ transformOrigin: 'left center' }}
                            className="absolute inset-0 bg-[#FF5A36] rounded-full"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCycleHero(-1)}
                    aria-label="Previous newsroom backdrop"
                    className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white/85 hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900/90 backdrop-blur-md border border-white/80 dark:border-white/20 text-slate-900 dark:text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCycleHero(1)}
                    aria-label="Next newsroom backdrop"
                    className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white/85 hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900/90 backdrop-blur-md border border-white/80 dark:border-white/20 text-slate-900 dark:text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Docked Topic Filter, Search & Verified Sources Bar */}
      <div className="bg-white dark:bg-[#12141D] border-b border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none min-w-0">
              {NEWS_TOPICS.map((topic) => {
                const isActive = selectedTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleSelectTopic(topic.id)}
                    className={`px-3.5 py-2 min-h-[38px] rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
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

            <div className="relative w-full lg:w-72 shrink-0">
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
              <motion.article
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                onClick={() => openStoryReader(leadArticle)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openStoryReader(leadArticle);
                  }
                }}
                className="bg-white dark:bg-[#151822] rounded-3xl border border-gray-200 dark:border-white/10 hover:border-[#FF5A36]/50 shadow-sm hover:shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch cursor-pointer transition-colors group"
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
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-white/15 bg-[radial-gradient(circle_at_center,rgba(226,232,240,0.94)_0%,rgba(122,135,156,0.62)_58%,rgba(15,23,42,0.98)_100%)]">
                        <img
                          src={hotNewsIconImg}
                          alt={leadArticle.source}
                          className="w-full h-full object-cover mix-blend-multiply contrast-[1.06] brightness-[1.05]"
                        />
                      </div>
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
              </motion.article>
            )}

            {/* Grid of Sri Lanka News Stories */}
            {secondaryArticles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {secondaryArticles.map((article, index) => {
                  const imgKey = article.link || `${article.id}-${index}`;
                  const hasValidImg = Boolean(article.imageUrl) && !failedImages[imgKey];
                  const isSaved = savedIds.includes(article.id);
                  return (
                    <motion.article
                      key={`${article.id}-${index}`}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: Math.min(index * 0.035, 0.28), ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ y: -4 }}
                      onClick={() => openStoryReader(article)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openStoryReader(article);
                        }
                      }}
                      className="bg-white dark:bg-[#151822] rounded-2xl border border-gray-200 dark:border-white/10 hover:border-[#FF5A36]/40 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow duration-200 cursor-pointer group"
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
                    </motion.article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* In-App Sri Lanka News Reader Modal */}
      <AnimatePresence>
      {activeArticle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setActiveArticle(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="news-reader-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
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
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};
