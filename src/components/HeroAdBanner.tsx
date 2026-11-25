import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Megaphone,
  Sliders,
  Film,
  Volume2,
  VolumeX,
  ShoppingBag,
  Store,
  Plane,
  HeartHandshake,
  Heart,
  Compass,
  Newspaper,
} from 'lucide-react';
import { HeroAd, HeroAdSettings } from '../types';
import { DualToneHeading } from './DualToneHeading';

interface HeroAdBannerProps {
  heroAds?: HeroAd[];
  heroSettings?: HeroAdSettings;
  onSelectCategory?: (category: string) => void;
  onOpenPostAd?: () => void;
  onOpenEStore?: () => void;
  onOpenHutaIn?: (focus?: 'all' | 'travel' | 'society' | 'events') => void;
  onOpenBuyerRequests?: () => void;
  onOpenDonate?: () => void;
  onOpenHotNews?: () => void;
  isAdminLoggedIn?: boolean;
  onAdminManage?: () => void;
  isLivePreview?: boolean;
}

const DEFAULT_SLIDE_ID = '__default_hero__';

export const HeroAdBanner: React.FC<HeroAdBannerProps> = ({
  heroAds = [],
  heroSettings = { mode: 'default', rotationIntervalSeconds: 6 },
  onSelectCategory,
  onOpenPostAd,
  onOpenEStore,
  onOpenHutaIn,
  onOpenBuyerRequests,
  onOpenDonate,
  onOpenHotNews,
  isAdminLoggedIn,
  onAdminManage,
  isLivePreview = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const activeAds = (heroAds || []).filter((ad) => ad.isActive);

  // Determine slides based on mode
  const mode = heroSettings?.mode || 'default';
  const rotationSeconds = Math.max(3, heroSettings?.rotationIntervalSeconds || 6);

  const slides: Array<{ type: 'default' | 'ad'; data?: HeroAd; id: string }> = [];

  if (mode === 'default' || activeAds.length === 0) {
    slides.push({ type: 'default', id: DEFAULT_SLIDE_ID });
  } else if (mode === 'ads_only') {
    activeAds.forEach((ad) => slides.push({ type: 'ad', data: ad, id: ad.id }));
  } else {
    slides.push({ type: 'default', id: DEFAULT_SLIDE_ID });
    activeAds.forEach((ad) => slides.push({ type: 'ad', data: ad, id: ad.id }));
  }

  // Ensure current index is within bounds
  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  // Auto-rotation timer
  useEffect(() => {
    if (slides.length <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, rotationSeconds * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, rotationSeconds, isPaused]);

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (slides.length <= 1) return;
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (slides.length <= 1 || touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) > 42) {
      if (delta < 0) {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      } else {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
  };

  const handleCtaClick = (action?: string) => {
    if (!action) return;
    const trimmed = action.trim();
    const normalized = trimmed.toLowerCase();

    if (normalized === 'post_ad' || normalized === 'post-ad') {
      if (onOpenPostAd) onOpenPostAd();
      return;
    }

    if (normalized === 'estore' || normalized === 'estores' || normalized === 'e-store') {
      if (onOpenEStore) onOpenEStore();
      return;
    }

    if (normalized === 'travel_booking' || normalized === 'travel' || normalized === 'tours') {
      if (onOpenHutaIn) onOpenHutaIn('travel');
      return;
    }

    if (normalized === 'society' || normalized === 'society_help') {
      if (onOpenHutaIn) onOpenHutaIn('society');
      return;
    }

    if (normalized === 'huta_in' || normalized === 'huta-in') {
      if (onOpenHutaIn) onOpenHutaIn('all');
      return;
    }

    if (normalized === 'buyer_requests' || normalized === 'looking_for') {
      if (onOpenBuyerRequests) onOpenBuyerRequests();
      return;
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      window.open(trimmed, '_blank', 'noopener,noreferrer');
      return;
    }

    // Otherwise treat as a Marketplace category name
    if (onSelectCategory) {
      onSelectCategory(trimmed);
      const el = document.getElementById('marketplace-listings');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const currentSlide = slides[currentIndex] || slides[0] || { type: 'default', id: DEFAULT_SLIDE_ID };

  const getGradientStyles = (theme?: string) => {
    switch (theme) {
      case 'light':
        return {
          isLightCard: true,
          highlight: 'text-[#FF5A36] dark:text-[#FF7A59]',
          badgeText: 'text-[#FF5A36] dark:text-[#FF7A59]',
          button: 'bg-[#FF5A36] hover:bg-[#E04826] text-white shadow-[#FF5A36]/20',
          accent: 'from-[#FF5A36]/12 to-sky-400/10',
        };
      case 'blue':
        return {
          isLightCard: false,
          highlight: 'text-sky-400 decoration-sky-400/40',
          badgeText: 'text-sky-300',
          button: 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/20',
          accent: 'from-sky-500/20 to-blue-600/10',
        };
      case 'emerald':
        return {
          isLightCard: false,
          highlight: 'text-emerald-400 decoration-emerald-400/40',
          badgeText: 'text-emerald-300',
          button: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20',
          accent: 'from-emerald-500/20 to-teal-600/10',
        };
      case 'purple':
        return {
          isLightCard: false,
          highlight: 'text-purple-400 decoration-purple-400/40',
          badgeText: 'text-purple-300',
          button: 'bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/20',
          accent: 'from-purple-500/20 to-indigo-600/10',
        };
      case 'amber':
        return {
          isLightCard: false,
          highlight: 'text-amber-400 decoration-amber-400/40',
          badgeText: 'text-amber-300',
          button: 'bg-amber-500 hover:bg-amber-600 text-gray-950 font-black shadow-amber-500/20',
          accent: 'from-amber-500/20 to-orange-600/10',
        };
      default: // orange / brand
        return {
          isLightCard: false,
          highlight: 'text-[#FF5A36] decoration-[#FF5A36]/40',
          badgeText: 'text-[#FF7A59]',
          button: 'bg-[#FF5A36] hover:bg-[#E04826] text-white shadow-[#FF5A36]/25',
          accent: 'from-[#FF5A36]/20 to-amber-600/10',
        };
    }
  };

  return (
    <div
      className="relative w-full max-w-4xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Admin Quick Settings Shortcut */}
      {isAdminLoggedIn && onAdminManage && !isLivePreview && (
        <div className="flex justify-center sm:justify-end mb-2">
          <button
            type="button"
            onClick={onAdminManage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl bg-white/90 dark:bg-[#1F222E] hover:bg-white dark:hover:bg-[#2A2E3D] text-[11px] font-bold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-[#353949] shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
            title="Open Admin Hero Ad & Banner Manager"
          >
            <Sliders className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span>Admin: Hero Ads ({activeAds.length} Active · {mode})</span>
          </button>
        </div>
      )}

      {/* Main Slide Card Container */}
      <div className="relative min-h-[115px] sm:min-h-[138px] flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {currentSlide.type === 'default' ? (
            /* DEFAULT HERO SLIDE — 4-Pillar Ecosystem Headline */
            <motion.div
              key="default-slide"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full text-center flex flex-col items-center justify-center space-y-2"
            >
              <DualToneHeading
                as="h1"
                size="hero"
                theme="auto"
                primaryText="Sri Lanka's Trusted Hub for"
                accentText={[
                  'Verified Classifieds',
                  'Direct E-Stores',
                  'Travel & Tours',
                  'Society Help Hub',
                  'All 25 Districts',
                ]}
                animationType="rotate"
                rotationInterval={3600}
                showUnderline={false}
                align="center"
                id="hero-dual-tone-heading"
              />
              {/* Compact Small Icon-Only Strip for Core Sri Lanka Sections */}
              <div
                className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 pt-0.5"
                role="navigation"
                aria-label="HUTA.LK Ecosystem Quick Shortcuts"
              >
                {[
                  {
                    id: 'marketplace',
                    label: 'Marketplace Deals',
                    icon: ShoppingBag,
                    colorClass: 'text-[#FF5A36] dark:text-[#FF7A59]',
                    hoverBorder: 'hover:border-[#FF5A36]/50',
                    onClick: () => {
                      if (onSelectCategory) onSelectCategory('All');
                      const el = document.getElementById('marketplace-listings');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    },
                  },
                  {
                    id: 'estores',
                    label: 'Online E-Stores',
                    icon: Store,
                    colorClass: 'text-emerald-600 dark:text-emerald-400',
                    hoverBorder: 'hover:border-emerald-500/50',
                    onClick: () => onOpenEStore?.(),
                  },
                  {
                    id: 'travel',
                    label: 'Sri Lanka Travel & Tours',
                    icon: Plane,
                    colorClass: 'text-sky-600 dark:text-sky-400',
                    hoverBorder: 'hover:border-sky-500/50',
                    onClick: () => onOpenHutaIn?.('travel'),
                  },
                  {
                    id: 'society',
                    label: 'Community Society Relief',
                    icon: HeartHandshake,
                    colorClass: 'text-violet-600 dark:text-violet-400',
                    hoverBorder: 'hover:border-violet-500/50',
                    onClick: () => onOpenHutaIn?.('society'),
                  },
                  {
                    id: 'donate',
                    label: 'Donate Sri Lanka',
                    icon: Heart,
                    colorClass: 'text-rose-600 dark:text-rose-400',
                    hoverBorder: 'hover:border-rose-500/50',
                    onClick: () => onOpenDonate?.(),
                  },
                  {
                    id: 'visit',
                    label: 'Visit Sri Lanka',
                    icon: Compass,
                    colorClass: 'text-teal-600 dark:text-teal-400',
                    hoverBorder: 'hover:border-teal-500/50',
                    onClick: () => onOpenHutaIn?.('all'),
                  },
                  {
                    id: 'news',
                    label: 'Hot News',
                    icon: Newspaper,
                    colorClass: 'text-amber-600 dark:text-amber-400',
                    hoverBorder: 'hover:border-amber-500/50',
                    onClick: () => onOpenHotNews?.(),
                  },
                ].map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onClick}
                      title={item.label}
                      aria-label={item.label}
                      className={`w-9 h-9 rounded-xl bg-white/90 dark:bg-[#181B26]/90 hover:bg-white dark:hover:bg-[#222636] border border-gray-200/85 dark:border-white/15 ${item.hoverBorder} shadow-2xs flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer shrink-0`}
                    >
                      <IconComp className={`w-4 h-4 ${item.colorClass}`} />
                      <span className="sr-only">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            /* CUSTOM ADMIN ANIMATED AD SLIDE */
            (() => {
              const ad = currentSlide.data!;
              const styles = getGradientStyles(ad.gradientTheme);
              const isVideoAd = ad.mediaType === 'video' || Boolean(ad.bgVideo);
              const videoSource = isVideoAd ? (ad.bgVideo?.trim() || '/videos/motion-loop-3.mp4') : null;
              const isOnlyVideo = isVideoAd && Boolean(ad.onlyVideoVisible || !ad.title || ad.title === 'Video Promotion');

              // CLEAN VIDEO-ONLY AD DISPLAY
              if (isOnlyVideo && videoSource) {
                return (
                  <motion.div
                    key={ad.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    onClick={() => {
                      if (ad.ctaAction) handleCtaClick(ad.ctaAction);
                    }}
                    className={`w-full relative rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-[#2D303E] bg-black overflow-hidden shadow-xl flex items-center justify-center group ${
                      ad.ctaAction ? 'cursor-pointer' : ''
                    }`}
                    style={{
                      aspectRatio: ad.videoAspectRatio === '21:9' ? '21/9' : '16/9',
                      maxHeight: '380px',
                      minHeight: '180px',
                    }}
                  >
                    <video
                      ref={(el) => {
                        videoRef.current = el;
                        if (el) {
                          el.defaultMuted = isMuted;
                          el.muted = isMuted;
                          el.setAttribute('playsinline', '');
                          el.setAttribute('webkit-playsinline', 'true');
                          const playPromise = el.play();
                          if (playPromise !== undefined) {
                            playPromise.catch(() => {});
                          }
                        }
                      }}
                      key={videoSource}
                      src={videoSource}
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover rounded-2xl sm:rounded-3xl"
                    />

                    {/* Subtle top-left editorial label */}
                    {ad.badge && (
                      <div className="absolute top-3 left-3 z-20 pointer-events-none bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-white">
                          <Film className="w-3 h-3 text-[#FF5A36]" />
                          <span>{ad.badge}</span>
                        </span>
                      </div>
                    )}

                    {/* Interactive Sound Mute/Unmute Control */}
                    <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextMuted = !isMuted;
                          setIsMuted(nextMuted);
                          if (videoRef.current) {
                            videoRef.current.muted = nextMuted;
                            if (!nextMuted) {
                              videoRef.current.volume = 1;
                              videoRef.current.play().catch(() => {});
                            }
                          }
                        }}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-lg text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
                        title={isMuted ? 'Click to Unmute Audio' : 'Click to Mute Audio'}
                      >
                        {isMuted ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-gray-300" />
                            <span className="hidden sm:inline text-[11px]">Unmute</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-[#FF5A36]" />
                            <span className="hidden sm:inline text-[11px] text-[#FF5A36]">Sound On</span>
                          </>
                        )}
                      </button>
                    </div>

                    {ad.ctaText && (
                      <div className="absolute bottom-3 left-3 z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCtaClick(ad.ctaAction);
                          }}
                          className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-extrabold shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                          <span>{ad.ctaText}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              }

              const isLightBanner = styles.isLightCard && !isVideoAd;

              return (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className={`w-full relative rounded-3xl p-5 sm:p-7 border text-center overflow-hidden shadow-xl transition-colors ${
                    isLightBanner
                      ? 'bg-white/95 dark:bg-[#151822]/95 border-gray-200/90 dark:border-[#2D303E] text-slate-900 dark:text-white'
                      : 'bg-[#10121a] border-[#2D303E] text-white'
                  }`}
                >
                  {/* Animated Video or Image Background */}
                  {isVideoAd && videoSource ? (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
                      <video
                        ref={(el) => {
                          if (el) {
                            el.defaultMuted = true;
                            el.muted = true;
                            el.setAttribute('playsinline', '');
                            el.setAttribute('webkit-playsinline', 'true');
                            el.play().catch(() => {});
                          }
                        }}
                        key={videoSource}
                        src={videoSource}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover opacity-85 sm:opacity-90 filter brightness-105 contrast-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e1017]/90 via-[#0e1017]/40 to-[#0e1017]/60" />
                    </div>
                  ) : ad.bgImage ? (
                    <>
                      <img
                        src={ad.bgImage}
                        alt=""
                        referrerPolicy="no-referrer"
                        className={`absolute inset-0 w-full h-full object-cover pointer-events-none rounded-3xl ${
                          isLightBanner ? 'opacity-20 dark:opacity-30' : 'opacity-40 filter brightness-95'
                        }`}
                      />
                      <div
                        className={`absolute inset-0 pointer-events-none rounded-3xl ${
                          isLightBanner
                            ? 'bg-gradient-to-b from-white/80 via-white/75 to-white/90 dark:from-[#151822]/80 dark:via-[#151822]/75 dark:to-[#151822]/90'
                            : 'bg-gradient-to-t from-[#10121a]/85 via-[#10121a]/35 to-[#10121a]/55'
                        }`}
                      />
                    </>
                  ) : null}

                  {/* Ambient Glow */}
                  <div
                    className={`absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-32 bg-gradient-to-b ${styles.accent} rounded-full blur-2xl pointer-events-none`}
                  />

                  <div className="relative z-10 space-y-2.5 max-w-2xl mx-auto">
                    {/* Eyebrow Label (Zero-pill clean editorial style) */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider ${styles.badgeText}`}
                      >
                        <Megaphone className="w-3.5 h-3.5 shrink-0" />
                        <span>{ad.badge || 'Featured Highlight'}</span>
                      </span>

                      {isVideoAd && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                          · Video Showcase
                        </span>
                      )}
                    </div>

                    {/* Headline */}
                    <h1
                      className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-snug ${
                        isLightBanner
                          ? 'text-slate-900 dark:text-white'
                          : 'text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]'
                      }`}
                    >
                      {ad.title}{' '}
                      {ad.highlightText && (
                        <span className={styles.highlight}>{ad.highlightText}</span>
                      )}
                    </h1>

                    {/* Subtitle */}
                    <p
                      className={`text-xs sm:text-sm font-medium max-w-xl mx-auto leading-relaxed ${
                        isLightBanner
                          ? 'text-slate-600 dark:text-gray-300'
                          : 'text-gray-100 drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]'
                      }`}
                    >
                      {ad.subtitle}
                    </p>

                    {/* CTA Button */}
                    {ad.ctaText && (
                      <div className="pt-1.5 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCtaClick(ad.ctaAction)}
                          className={`inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-lg cursor-pointer whitespace-nowrap shrink-0 ${styles.button}`}
                        >
                          <span>{ad.ctaText}</span>
                          <ArrowRight className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })()
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Controls (Only if multiple slides exist) */}
      {slides.length > 1 && (
        <div className="flex items-center justify-between mt-3 px-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Hero Slide"
            className="min-w-[36px] min-h-[36px] p-1.5 rounded-full bg-white/85 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {slides.map((s, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={s.id || idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    isSelected
                      ? 'w-6 bg-[#FF5A36]'
                      : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Hero Slide"
            className="min-w-[36px] min-h-[36px] p-1.5 rounded-full bg-white/85 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
