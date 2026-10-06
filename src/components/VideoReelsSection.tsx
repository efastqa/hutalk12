import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
  Share2,
  Plus,
  ShieldCheck,
  Video,
  Eye,
} from 'lucide-react';
import { Listing } from '../types';
import { formatLKR } from './ListingsSection';

export interface VideoReelItem {
  id: string;
  title: string;
  videoUrl: string;
  posterImage: string;
  category: string;
  price: number;
  location: string;
  district?: string;
  sellerName?: string;
  phone?: string;
  isVerified?: boolean;
  specsSummary?: string;
  listingId?: string;
  listing?: Listing;
}

// Curated inspection walkthrough video reels using existing verified video assets
const CURATED_WALKTHROUGH_REELS: VideoReelItem[] = [
  {
    id: 'reel-drone-4k',
    title: 'DJI 4K Drone Flight & Camera Gimbal Test',
    videoUrl: '/uploads/videos/anim-video-1790102854586-d1bwkp.mp4',
    posterImage: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=600&q=80',
    category: 'Electronics',
    price: 45000,
    location: 'Colombo 03',
    district: 'Colombo',
    sellerName: 'Kasun Electronics',
    phone: '0771234567',
    isVerified: true,
    specsSummary: '4K 60fps • 3-Axis Gimbal • 32m Flight Time',
  },
  {
    id: 'reel-toyota-prius',
    title: '2018 Toyota Prius S-Grade Hybrid Inspection',
    videoUrl: '/videos/motion-loop-1.mp4',
    posterImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
    category: 'Vehicles',
    price: 12850000,
    location: 'Nugegoda, Colombo',
    district: 'Colombo',
    sellerName: 'AutoPoint Lanka',
    phone: '0775260765',
    isVerified: true,
    specsSummary: 'Hybrid • Auto • Battery 94% • 1st Owner',
  },
  {
    id: 'reel-luxury-apartment',
    title: 'Luxury 3BR Apartment Walkthrough Tour',
    videoUrl: '/videos/motion-loop-3.mp4',
    posterImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    category: 'Property',
    price: 48500000,
    location: 'Kollupitiya, Colombo',
    district: 'Colombo',
    sellerName: 'Island Prime Realty',
    phone: '0712345678',
    isVerified: true,
    specsSummary: '3 Beds • 2 Baths • Sea View Balcony • Pool',
  },
  {
    id: 'reel-yamaha-bike',
    title: 'Yamaha FZ-S V3 Exhaust Sound & Tyre Inspection',
    videoUrl: '/uploads/videos/anim-video-1790102817239-ea2zkk.mp4',
    posterImage: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
    category: 'Motorcycles',
    price: 890000,
    location: 'Kandy City',
    district: 'Kandy',
    sellerName: 'MotoHub Kandy',
    phone: '0769876543',
    isVerified: true,
    specsSummary: '150cc • Single Disc • Mint Condition 2021',
  },
  {
    id: 'reel-iphone-test',
    title: 'iPhone 15 Pro Max 256GB Battery & OLED Inspection',
    videoUrl: '/videos/motion-loop-2.mp4',
    posterImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
    category: 'Electronics',
    price: 310000,
    location: 'Galle Fort',
    district: 'Galle',
    sellerName: 'SmartFix Galle',
    phone: '0701122334',
    isVerified: true,
    specsSummary: 'Battery 100% • 256GB • Full Box • Natural Titanium',
  },
];

interface VideoReelsSectionProps {
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
  onOpenPostAd: () => void;
  onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const VideoReelsSection: React.FC<VideoReelsSectionProps> = ({
  listings,
  onSelectListing,
  onOpenPostAd,
  onToast,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);
  const [viewedReelIds, setViewedReelIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('huta_viewed_reels');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Combine listings with videoUrl and curated inspection reels
  const allReels: VideoReelItem[] = React.useMemo(() => {
    const listFromAds: VideoReelItem[] = listings
      .filter((l) => Boolean(l.videoUrl && l.status === 'approved'))
      .map((l) => ({
        id: `ad-${l.id}`,
        title: l.title,
        videoUrl: l.videoUrl!,
        posterImage: l.image || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
        category: l.category,
        price: l.price,
        location: l.location,
        district: l.district,
        sellerName: l.sellerName || (l.userId === 'system' ? 'Verified Seller' : 'HUTA Member'),
        phone: l.phone,
        isVerified: l.isVerifiedPro,
        specsSummary: `${l.category} • ${l.location}`,
        listingId: l.id,
        listing: l,
      }));

    // Avoid duplicate video URLs
    const seenUrls = new Set<string>();
    const merged: VideoReelItem[] = [];

    // Prioritize real user ads with video first
    listFromAds.forEach((item) => {
      if (!seenUrls.has(item.videoUrl)) {
        seenUrls.add(item.videoUrl);
        merged.push(item);
      }
    });

    // Then append curated inspection reels to keep the rail full and lively
    CURATED_WALKTHROUGH_REELS.forEach((item) => {
      if (!seenUrls.has(item.videoUrl)) {
        seenUrls.add(item.videoUrl);
        // Link to matching listing if available
        const matched = listings.find((l) => l.title.toLowerCase().includes(item.category.toLowerCase()));
        merged.push({
          ...item,
          listing: matched,
          listingId: matched?.id,
        });
      }
    });

    return merged;
  }, [listings]);

  const handleOpenReel = (index: number) => {
    setActiveReelIndex(index);
    const reel = allReels[index];
    if (reel && !viewedReelIds.includes(reel.id)) {
      const updated = [...viewedReelIds, reel.id];
      setViewedReelIds(updated);
      try {
        localStorage.setItem('huta_viewed_reels', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const handleCloseReel = () => {
    setActiveReelIndex(null);
  };

  const handleNextReel = useCallback(() => {
    if (activeReelIndex !== null && activeReelIndex < allReels.length - 1) {
      handleOpenReel(activeReelIndex + 1);
    } else {
      setActiveReelIndex(0); // loop back
    }
  }, [activeReelIndex, allReels.length]);

  const handlePrevReel = useCallback(() => {
    if (activeReelIndex !== null && activeReelIndex > 0) {
      handleOpenReel(activeReelIndex - 1);
    }
  }, [activeReelIndex]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FF5A36]/15 border border-[#FF5A36]/30 flex items-center justify-center text-[#FF5A36] shadow-xs">
            <Video className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white">
                Short Video Stories & Inspection Reels
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-[#FF5A36] to-[#FF8A65] text-white shadow-2xs uppercase tracking-wider animate-pulse">
                <Sparkles className="w-2.5 h-2.5" />
                Live 15s Tours
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden xs:block">
              Watch real verified video walk-throughs & engine inspections before you contact sellers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Post Reel Button */}
          <button
            type="button"
            onClick={onOpenPostAd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10 text-xs font-bold transition-all cursor-pointer"
            title="Post an ad with video walk-through"
          >
            <Plus className="w-3.5 h-3.5 text-[#FF5A36]" />
            <span className="hidden sm:inline">Add Video Ad</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* Navigation Chevron Controls */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={scrollLeft}
              aria-label="Scroll left"
              className="p-1.5 rounded-xl bg-white dark:bg-[#181920] border border-gray-200 dark:border-[#2D2F39] text-gray-600 dark:text-gray-300 hover:text-[#FF5A36] dark:hover:text-[#FF5A36] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              aria-label="Scroll right"
              className="p-1.5 rounded-xl bg-white dark:bg-[#181920] border border-gray-200 dark:border-[#2D2F39] text-gray-600 dark:text-gray-300 hover:text-[#FF5A36] dark:hover:text-[#FF5A36] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Horizontal Story Reels Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto pb-2 pt-1 scrollbar-none scroll-smooth snap-x select-none"
      >
        {/* Creator / Post Ad Story Card Trigger */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenPostAd}
          className="snap-start shrink-0 w-28 sm:w-32 h-44 sm:h-48 rounded-2xl sm:rounded-3xl border-2 border-dashed border-[#FF5A36]/40 hover:border-[#FF5A36] bg-gradient-to-b from-white to-orange-50/50 dark:from-[#151822] dark:to-[#201518] p-3 flex flex-col items-center justify-center text-center cursor-pointer shadow-xs hover:shadow-md transition-all group"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#FF5A36] text-white flex items-center justify-center shadow-md shadow-[#FF5A36]/30 group-hover:scale-110 transition-transform mb-2">
            <Plus className="w-6 h-6 stroke-[3]" />
          </div>
          <span className="text-xs font-black text-gray-900 dark:text-white leading-tight">
            Add Your Story
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-snug">
            Free video ad for your item
          </span>
        </motion.div>

        {/* Dynamic Walkthrough Video Reels */}
        {allReels.map((reel, index) => {
          const isViewed = viewedReelIds.includes(reel.id);

          return (
            <motion.div
              key={reel.id}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleOpenReel(index)}
              className="snap-start shrink-0 w-28 sm:w-32 h-44 sm:h-48 relative rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all group border border-transparent"
            >
              {/* Glowing Story Gradient Ring */}
              <div
                className={`absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none p-[2px] transition-all z-20 ${
                  isViewed
                    ? 'border-2 border-gray-300 dark:border-gray-700'
                    : 'bg-gradient-to-tr from-[#FF5A36] via-[#FF8A65] to-[#FF5A36] p-[2.5px]'
                }`}
              >
                <div className="w-full h-full rounded-[14px] sm:rounded-[22px] border-2 border-white dark:border-[#111217]" />
              </div>

              {/* Background Video / Image Thumbnail */}
              <div className="absolute inset-0 bg-gray-950 overflow-hidden">
                <video
                  src={reel.videoUrl}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out brightness-95 group-hover:brightness-105"
                />
                {/* Fallback image */}
                <div
                  className="absolute inset-0 bg-cover bg-center -z-10"
                  style={{ backgroundImage: `url(${reel.posterImage})` }}
                />
                {/* Subtle dark gradient scrim for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />
              </div>

              {/* Top Meta: Category Tag & Play Icon */}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs border border-white/20">
                  {reel.category}
                </span>
                <div className="w-5 h-5 rounded-full bg-[#FF5A36] text-white flex items-center justify-center shadow-xs">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
              </div>

              {/* Bottom Meta: Price & Title */}
              <div className="absolute bottom-2 left-2 right-2 z-10 text-white">
                <div className="text-[11px] sm:text-xs font-black text-white leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                  {formatLKR(reel.price)}
                </div>
                <div className="text-[10px] font-semibold text-gray-200 line-clamp-2 mt-0.5 leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {reel.title}
                </div>
                <div className="flex items-center gap-1 text-[9px] text-gray-300 mt-0.5">
                  <MapPin className="w-2.5 h-2.5 text-[#FF5A36] shrink-0" />
                  <span className="truncate">{reel.district || reel.location}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Fullscreen Immersive Stories / Reels Player Modal */}
      <AnimatePresence>
        {activeReelIndex !== null && allReels[activeReelIndex] && (
          <VideoReelViewerModal
            reels={allReels}
            currentIndex={activeReelIndex}
            onClose={handleCloseReel}
            onNext={handleNextReel}
            onPrev={handlePrevReel}
            onSelectListing={(listing) => {
              handleCloseReel();
              onSelectListing(listing);
            }}
            onToast={onToast}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

// ============================================================================
// IMMERSIVE FULL-SCREEN STORY VIEWER MODAL
// ============================================================================

interface VideoReelViewerModalProps {
  reels: VideoReelItem[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelectListing: (listing: Listing) => void;
  onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const STORY_DURATION_SECONDS = 15;

const VideoReelViewerModal: React.FC<VideoReelViewerModalProps> = ({
  reels,
  currentIndex,
  onClose,
  onNext,
  onPrev,
  onSelectListing,
  onToast,
}) => {
  const currentReel = reels[currentIndex];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Reset video progress when changing stories
  useEffect(() => {
    setProgress(0);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  // Handle video playback time updates for the segmented story progress bar
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
    }
  };

  const handleVideoEnded = () => {
    onNext();
  };

  const togglePlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, isPlaying]);

  // WhatsApp quick contact
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = currentReel.phone || '0775260765';
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '94' + digits.substring(1);
    if (!digits.startsWith('94')) digits = '94' + digits;

    const message = encodeURIComponent(
      `Hi! I saw your verified video inspection for "${currentReel.title}" (${formatLKR(currentReel.price)}) on HUTA.LK. Is it still available?`
    );
    window.open(`https://wa.me/${digits}?text=${message}`, '_blank');
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = currentReel.phone || '0775260765';
    window.location.href = `tel:${phone}`;
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: `${currentReel.title} — HUTA.LK`,
      text: `Watch the video inspection walkthrough for "${currentReel.title}" on HUTA.LK:`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        if (onToast) onToast('Reel link copied to clipboard!', 'success');
      } catch {
        // fallback
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none"
      onClick={onClose}
    >
      {/* Desktop Previous / Next Floating Arrows */}
      <div className="hidden md:flex absolute inset-y-0 left-6 items-center z-50">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          disabled={currentIndex === 0}
          className={`p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all cursor-pointer ${
            currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95'
          }`}
          aria-label="Previous story"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="hidden md:flex absolute inset-y-0 right-6 items-center z-50">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
          aria-label="Next story"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Main 9:16 Vertical Reel Player Card */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm sm:max-w-md h-[92vh] max-h-[780px] bg-gray-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/15"
      >
        {/* Segmented Instagram-style Top Progress Bar */}
        <div className="absolute top-2.5 inset-x-3 z-40 flex items-center gap-1.5 pointer-events-none">
          {reels.map((r, i) => {
            let width = 0;
            if (i < currentIndex) width = 100;
            else if (i === currentIndex) width = progress;
            return (
              <div
                key={r.id}
                className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden backdrop-blur-xs"
              >
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                  style={{ width: `${width}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Top Header Controls (Seller Info + Actions + Close) */}
        <div className="absolute top-6 inset-x-3.5 z-40 flex items-center justify-between text-white drop-shadow-md">
          {/* Seller / Title Header */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#FF5A36] text-white flex items-center justify-center font-black text-xs shadow-md border-2 border-white/40">
              {currentReel.sellerName ? currentReel.sellerName.charAt(0).toUpperCase() : 'H'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-white leading-none">
                  {currentReel.sellerName || 'Verified Seller'}
                </span>
                {currentReel.isVerified && (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
              </div>
              <span className="text-[10px] text-gray-300 font-medium">
                {currentReel.location} • Reel {currentIndex + 1} of {reels.length}
              </span>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={togglePlayPause}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            {/* Mute/Unmute */}
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-gray-300" /> : <Volume2 className="w-4 h-4 text-[#FF5A36]" />}
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all cursor-pointer"
              title="Share reel"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/60 hover:bg-black text-white transition-all cursor-pointer"
              title="Close viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Canvas Layer */}
        <div
          className="relative flex-1 bg-black overflow-hidden cursor-pointer"
          onClick={togglePlayPause}
        >
          <video
            ref={videoRef}
            src={currentReel.videoUrl}
            playsInline
            autoPlay
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            className="w-full h-full object-cover"
          />

          {/* Touch navigation zones (Left 30% jumps prev, Right 30% jumps next) */}
          <div
            className="absolute inset-y-0 left-0 w-1/4 z-20 cursor-w-resize"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-1/4 z-20 cursor-e-resize"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
          />

          {/* Pause overlay icon indicator */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-30">
              <div className="w-16 h-16 rounded-full bg-black/70 text-white flex items-center justify-center backdrop-blur-md shadow-xl border border-white/20 animate-scale-up">
                <Play className="w-8 h-8 fill-current ml-1 text-[#FF5A36]" />
              </div>
            </div>
          )}

          {/* Subtle Bottom Scrim for text readability */}
          <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black via-black/65 to-transparent pointer-events-none z-20" />
        </div>

        {/* Bottom HUD Details & Direct Action CTAs */}
        <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 z-30 space-y-3 pointer-events-auto">
          {/* Price & Category Pill */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
              {formatLKR(currentReel.price)}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FF5A36] text-white shadow-md">
              {currentReel.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug drop-shadow-md">
            {currentReel.title}
          </h3>

          {/* Specs / Condition highlight */}
          {currentReel.specsSummary && (
            <p className="text-xs text-gray-200 font-medium leading-relaxed drop-shadow-sm">
              {currentReel.specsSummary}
            </p>
          )}

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-gray-300">
            <MapPin className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
            <span>{currentReel.location} (Sri Lanka)</span>
          </div>

          {/* CTA Buttons */}
          <div className="pt-1 flex items-center gap-2">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>WhatsApp</span>
            </button>

            {/* Call */}
            <button
              type="button"
              onClick={handleCall}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer"
              title="Call seller"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden xs:inline">Call</span>
            </button>

            {/* Full Listing */}
            {currentReel.listing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectListing(currentReel.listing!);
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md text-xs sm:text-sm font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                title="View full ad with all photos & loan calculator"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Details</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
