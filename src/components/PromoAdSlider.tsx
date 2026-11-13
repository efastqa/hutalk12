import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sliders,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';
import { PromoSlide, PromoSlidesSettings } from '../types';

interface PromoAdSliderProps {
  slides?: PromoSlide[];
  settings?: PromoSlidesSettings;
  onSelectCategory?: (category: string) => void;
  onOpenPostAd?: () => void;
  onOpenEStore?: () => void;
  isAdminLoggedIn?: boolean;
  onAdminManage?: () => void;
  isLivePreview?: boolean;
}

export const PromoAdSlider: React.FC<PromoAdSliderProps> = ({
  slides = [],
  settings = { enabled: true, rotationIntervalSeconds: 5, aspectPreset: 'standard' },
  onSelectCategory,
  onOpenPostAd,
  onOpenEStore,
  isAdminLoggedIn = false,
  onAdminManage,
  isLivePreview = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const touchStartX = useRef<number | null>(null);

  const activeSlides = (slides || [])
    .filter((s) => s.isActive && Boolean(s.imageUrl))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const isEnabled = settings?.enabled !== false;
  const rotationSeconds = Math.max(2, Math.min(30, settings?.rotationIntervalSeconds || 5));
  const aspectPreset = settings?.aspectPreset || 'standard';

  useEffect(() => {
    if (currentIndex >= activeSlides.length) {
      setCurrentIndex(0);
    }
  }, [activeSlides.length, currentIndex]);

  useEffect(() => {
    if (!isEnabled || activeSlides.length <= 1 || isPaused) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, rotationSeconds * 1000);

    return () => window.clearInterval(interval);
  }, [isEnabled, activeSlides.length, rotationSeconds, isPaused]);

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeSlides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeSlides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleSlideAction = (action?: string) => {
    if (!action || isLivePreview) return;
    const target = action.trim();
    if (!target) return;

    if (target === 'post_ad' || target === 'post-ad') {
      if (onOpenPostAd) onOpenPostAd();
      return;
    }

    if (target === 'estore') {
      if (onOpenEStore) onOpenEStore();
      return;
    }

    if (target.startsWith('http://') || target.startsWith('https://')) {
      window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }

    if (onSelectCategory) {
      onSelectCategory(target);
      window.setTimeout(() => {
        const el = document.getElementById('marketplace-listings');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 40);
    }
  };

  // Public visitors see nothing when slider is disabled or empty
  if (!isEnabled || activeSlides.length === 0) {
    if (!isAdminLoggedIn || isLivePreview || !onAdminManage) {
      return null;
    }

    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-dashed border-[#FF5A36]/40 text-xs">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold">
            <ImageIcon className="w-4 h-4 text-[#FF5A36] shrink-0" />
            <span>
              Promo Ad Image Slides Slot ({!isEnabled ? 'Paused by Admin' : 'No active slides yet'})
            </span>
          </div>
          <button
            type="button"
            onClick={onAdminManage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Promo Slides (Admin)</span>
          </button>
        </div>
      </section>
    );
  }

  const currentSlide = activeSlides[currentIndex] || activeSlides[0];
  const hasAction = Boolean(currentSlide.ctaAction && currentSlide.ctaAction.trim());

  const aspectClass =
    aspectPreset === 'compact'
      ? 'aspect-[21/6] sm:aspect-[24/5]'
      : aspectPreset === 'wide'
      ? 'aspect-[16/8] sm:aspect-[21/7]'
      : 'aspect-[16/7] sm:aspect-[21/6]';

  return (
    <section
      className={isLivePreview ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-3'}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Promotional Image Slides"
    >
      {/* Admin-only quick manage header bar */}
      {isAdminLoggedIn && onAdminManage && !isLivePreview && (
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={onAdminManage}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-[#151822] hover:bg-gray-50 dark:hover:bg-[#1E2230] text-[11px] font-bold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 shadow-2xs transition-colors cursor-pointer"
          >
            <Sliders className="w-3 h-3 text-[#FF5A36]" />
            <span>Admin: Manage Promo Slides ({activeSlides.length})</span>
          </button>
        </div>
      )}

      {/* Main Responsive Carousel Frame */}
      <div
        className={`relative w-full ${aspectClass} rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-900 dark:bg-[#151822] border border-gray-200/80 dark:border-white/10 shadow-lg group ${
          hasAction ? 'cursor-pointer' : ''
        }`}
        onClick={() => {
          if (hasAction) handleSlideAction(currentSlide.ctaAction);
        }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null || activeSlides.length <= 1) return;
          const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
          const delta = endX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(delta) > 40) {
            if (delta < 0) handleNext();
            else handlePrev();
          }
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0.35, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.35 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full"
          >
            {failedImages[currentSlide.id] ? (
              <div className="w-full h-full bg-gradient-to-br from-[#161925] via-[#1F2334] to-[#0B0C10] flex flex-col items-center justify-center p-6 text-center text-white">
                <ImageIcon className="w-8 h-8 text-[#FF5A36] mb-2" />
                <p className="text-sm sm:text-base font-bold">{currentSlide.title || 'Sponsored Promotion'}</p>
              </div>
            ) : (
              <img
                src={currentSlide.imageUrl}
                alt={currentSlide.title || 'Promotional Slide'}
                referrerPolicy="no-referrer"
                onError={() =>
                  setFailedImages((prev) => ({ ...prev, [currentSlide.id]: true }))
                }
                className="w-full h-full object-cover select-none"
              />
            )}

            {/* Optional Text Overlay (Only shown when explicitly enabled by Admin) */}
            {currentSlide.showTextOverlay &&
              (currentSlide.badge ||
                currentSlide.title ||
                currentSlide.subtitle ||
                currentSlide.ctaText) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-4 sm:p-6 md:p-8 pointer-events-none">
                  <div className="max-w-2xl space-y-1.5 text-left pointer-events-auto">
                    {currentSlide.badge && (
                      <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#FF7A59]">
                        {currentSlide.badge}
                      </span>
                    )}
                    {currentSlide.title && (
                      <h3 className="text-base sm:text-xl md:text-2xl font-extrabold text-white leading-tight text-balance">
                        {currentSlide.title}
                      </h3>
                    )}
                    {currentSlide.subtitle && (
                      <p className="text-xs sm:text-sm text-gray-200 line-clamp-2 max-w-xl">
                        {currentSlide.subtitle}
                      </p>
                    )}
                    {currentSlide.ctaText && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSlideAction(currentSlide.ctaAction);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 sm:py-2 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs sm:text-sm font-bold shadow-md transition-transform active:scale-95 cursor-pointer"
                        >
                          <span>{currentSlide.ctaText}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </motion.div>
        </AnimatePresence>

        {/* Left / Right Navigation Arrows (Visible when multiple slides exist) */}
        {activeSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous promo slide"
              className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-sm border border-white/15 flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next promo slide"
              className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-sm border border-white/15 flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}

        {/* Bottom Slide Dots & Numeric Counter */}
        {activeSlides.length > 1 && (
          <div className="absolute bottom-2.5 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/10">
            {activeSlides.map((slide, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  aria-label={`Go to promo slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    isSelected
                      ? 'w-5 bg-[#FF5A36]'
                      : 'w-1.5 bg-white/55 hover:bg-white/90'
                  }`}
                />
              );
            })}
            <span className="ml-1 text-[10px] font-bold text-white/90 tabular-nums">
              {currentIndex + 1}/{activeSlides.length}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
