import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Listing, User } from '../types';
import {
  X,
  MapPin,
  Tag,
  Clock,
  Eye,
  Phone,
  MessageCircle,
  Heart,
  Edit,
  Trash2,
  Share2,
  ShieldCheck,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Camera,
  ArrowLeftRight,
  Download,
  Facebook,
  Check,
  TrendingUp,
  Flag,
  Film,
  Play,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Users,
  Waves,
  Wifi,
  Sun,
  LayoutGrid,
  Truck,
} from 'lucide-react';
import { formatLKR } from './ListingsSection';
import { downloadImage } from '../utils/downloadHelper';
import { FacebookFlyerModal } from './FacebookFlyerModal';
import { ReviewForm } from './ReviewForm';
import { ReviewList } from './ReviewList';
import { ReportModal } from './ReportModal';
import { AdLocationMapCard } from './AdLocationMapCard';
import { api } from '../services/api';

const FALLBACK_AD_IMAGE = '/assets/hero_light_bg.jpg';

const handleSafeImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.dataset.fallbackApplied === '1') return;
  img.dataset.fallbackApplied = '1';
  img.src = FALLBACK_AD_IMAGE;
};

interface AdDetailModalProps {
  listing: Listing | null;
  onClose: () => void;
  currentUser: User | null;
  isAdminLoggedIn: boolean;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onEditListing: (listing: Listing) => void;
  onDeleteListing: (id: string) => void;
  onCopyShareLink: (listing: Listing) => void;
  onStartChat?: (listing: Listing) => void;
  isCompared?: boolean;
  onToggleCompare?: (listing: Listing) => void;
  onRequestOwnerEdit?: (listing: Listing) => void;
  onApproveListing?: (id: string) => void;
  onRecordAction?: (actionType: 'whatsapp' | 'phone' | 'share') => void;
}

export const AdDetailModal: React.FC<AdDetailModalProps> = ({
  listing,
  onClose,
  currentUser,
  isAdminLoggedIn,
  isFavorite,
  onToggleFavorite,
  onEditListing,
  onDeleteListing,
  onCopyShareLink,
  onStartChat,
  isCompared = false,
  onToggleCompare,
  onRequestOwnerEdit,
  onApproveListing,
  onRecordAction,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isFacebookFlyerOpen, setIsFacebookFlyerOpen] = useState(false);
  const [isDownloadingPhoto, setIsDownloadingPhoto] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [currentAvailability, setCurrentAvailability] = useState<'available' | 'reserved' | 'sold'>(
    listing?.availabilityStatus || 'available'
  );
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [currentRating, setCurrentRating] = useState<number | undefined>(listing?.sellerRating);
  const [currentReviewCount, setCurrentReviewCount] = useState<number | undefined>(listing?.reviewCount);

  const todayStr = new Date().toISOString().split('T')[0];
  const getFutureDateStr = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };
  const [checkInDate, setCheckInDate] = useState<string>(() => getFutureDateStr(1));
  const [checkOutDate, setCheckOutDate] = useState<string>(() => getFutureDateStr(3));
  const [stayGuests, setStayGuests] = useState<number>(2);

  const gallery =
    listing?.images && listing.images.length > 0
      ? listing.images
      : listing?.image
      ? [listing.image]
      : [FALLBACK_AD_IMAGE];

  useEffect(() => {
    setActiveIdx(0);
    setIsVideoActive(Boolean(listing?.videoUrl && (!listing.images || listing.images.length === 0)));
    setIsZoomOpen(false);
    setIsFacebookFlyerOpen(false);
    setIsReportModalOpen(false);
    setCurrentAvailability(listing?.availabilityStatus || 'available');
    setCurrentRating(listing?.sellerRating);
    setCurrentReviewCount(listing?.reviewCount);
    setCheckInDate(getFutureDateStr(1));
    setCheckOutDate(getFutureDateStr(3));
    setStayGuests(2);
  }, [listing?.id]);

  useEffect(() => {
    if (!listing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZoomOpen) {
          setIsZoomOpen(false);
        } else if (!isFacebookFlyerOpen && !isReportModalOpen) {
          onClose();
        }
      } else if (isZoomOpen && gallery.length > 1) {
        if (e.key === 'ArrowLeft') {
          setActiveIdx((prev) => (prev - 1 + gallery.length) % gallery.length);
        } else if (e.key === 'ArrowRight') {
          setActiveIdx((prev) => (prev + 1) % gallery.length);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [listing, isZoomOpen, isFacebookFlyerOpen, isReportModalOpen, gallery.length, onClose]);

  if (!listing) return null;

  const normalizePhone = (raw?: string): string => {
    if (!raw) return '';
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits.startsWith('94') && digits.length >= 11) return '0' + digits.substring(2);
    if (digits.length === 9) return '0' + digits;
    return digits;
  };

  const userPhone = currentUser?.phone ? normalizePhone(currentUser.phone) : '';
  const userUsernamePhone = currentUser?.username ? normalizePhone(currentUser.username) : '';
  const adPhone = normalizePhone(listing.phone);

  const guestAdIds = api.getGuestListingIds();
  const isGuestAuthor = guestAdIds.includes(listing.id);

  const isOwner = Boolean(
    isGuestAuthor ||
      (currentUser &&
        (listing.userId === currentUser.id ||
          (userPhone && adPhone && userPhone === adPhone) ||
          (userUsernamePhone && adPhone && userUsernamePhone === adPhone)))
  );
  const canManage = isOwner || isAdminLoggedIn;

  const handleUpdateAvailability = async (newStatus: 'available' | 'reserved' | 'sold') => {
    if (!listing || isUpdatingAvailability) return;
    setIsUpdatingAvailability(true);
    try {
      await api.updateAvailabilityStatus(listing.id, newStatus);
      setCurrentAvailability(newStatus);
      listing.availabilityStatus = newStatus;
    } catch (err) {
      console.warn('Failed to update availability status:', err);
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  const currentPhoto = gallery[activeIdx] || gallery[0];

  const handleDownloadActivePhoto = async () => {
    if (!listing) return;
    setIsDownloadingPhoto(true);
    const safeTitle = (listing.title || 'listing')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .slice(0, 25);
    await downloadImage(currentPhoto, `${safeTitle}-photo-${activeIdx + 1}.jpg`);
    setIsDownloadingPhoto(false);
  };

  const openLightboxAt = (idx: number) => {
    setIsVideoActive(false);
    setActiveIdx(idx);
    setIsZoomOpen(true);
  };

  const cleanPhone = listing.phone.replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('94')
    ? cleanPhone
    : cleanPhone.startsWith('0')
    ? '94' + cleanPhone.substring(1)
    : '94' + cleanPhone;

  const isService = listing.category === 'Services' || Boolean(listing.serviceTrade);
  const isHolidayHome =
    listing.category === 'Holiday Homes' ||
    listing.pricingType === 'per_night' ||
    listing.pricingType === 'per_weekend' ||
    (listing.propertyType || '').toLowerCase().includes('holiday');

  const stayNights = (() => {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 2;
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  })();

  const maxGuestNum = parseInt(String(listing.maxGuests || '16'), 10) || 16;
  const estimatedStayTotal =
    listing.price > 0 && listing.pricingType !== 'per_weekend'
      ? listing.price * stayNights
      : listing.price;

  const waServiceMessage = encodeURIComponent(
    `Hello! I saw your service listing on HUTA.lk: "${listing.title}" (${listing.serviceTrade || 'Professional Service'}). I would like to request an inspection / free quote for my location in ${listing.location}. Are you available?`
  );
  const waHolidayMessage = encodeURIComponent(
    `Hello! I would like to check availability on HUTA.lk for "${listing.title}" in ${listing.location}.\n• Check-In: ${checkInDate}\n• Check-Out: ${checkOutDate} (${stayNights} night${stayNights > 1 ? 's' : ''})\n• Guests: ${stayGuests}\n${listing.price > 0 ? `• Listed Rate: ${formatLKR(listing.price)}${listing.pricingType === 'per_weekend' ? '/weekend' : '/night'}` : ''}\nPlease let me know if these dates are available!`
  );
  const waProductMessage = encodeURIComponent(
    `Hi! I saw your advertisement on HUTA.lk: "${listing.title}" (${formatLKR(listing.price)}). Is this still available?`
  );
  const whatsappUrl = `https://wa.me/${waPhone}?text=${
    isHolidayHome ? waHolidayMessage : isService ? waServiceMessage : waProductMessage
  }`;

  const isVehicleAd =
    listing.category === 'Vehicles' ||
    listing.category === 'Motorcycles' ||
    listing.category === 'Cars for Rent';
  const vehiclePurpose = isVehicleAd
    ? listing.vehicleListingType || (listing.category === 'Cars for Rent' ? 'For Hire' : 'For Sale')
    : null;

  const hasSpecs = Boolean(
    vehiclePurpose ||
      listing.vehicleYear ||
      listing.fuelType ||
      listing.transmission ||
      listing.vehicleMileage ||
      listing.vehicleType ||
      listing.rentalDriverOption ||
      listing.propertyType ||
      listing.bedrooms ||
      listing.bathrooms ||
      listing.maxGuests ||
      (listing.amenities && listing.amenities.length > 0) ||
      listing.propertySize ||
      listing.electronicsSubcategory ||
      listing.storageCapacity ||
      listing.jobType ||
      listing.itemCondition ||
      listing.brand ||
      listing.model ||
      listing.serviceMode ||
      listing.serviceExperience ||
      listing.serviceAvailability ||
      listing.serviceWarranty ||
      (listing.serviceFeatures && listing.serviceFeatures.length > 0)
  );

  const renderPriceHeadline = (sizeClass = 'text-2xl sm:text-3xl') => {
    if (isService) {
      return (
        <div>
          <div className={`${sizeClass} font-black text-[#FF5A36] tabular-nums leading-tight`}>
            {listing.pricingType === 'quote'
              ? 'Free Estimate / Quote'
              : listing.pricingType === 'hourly'
              ? `${formatLKR(listing.price)} / hr`
              : listing.pricingType === 'starting_at'
              ? `From ${formatLKR(listing.price)}`
              : formatLKR(listing.price)}
          </div>
          {listing.serviceArea && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                Coverage: <strong className="text-gray-900 dark:text-white">{listing.serviceArea}</strong>
              </span>
            </p>
          )}
        </div>
      );
    }

    if (isHolidayHome) {
      return (
        <div className="flex flex-wrap items-baseline gap-2">
          <div className={`${sizeClass} font-black text-[#FF5A36] tabular-nums leading-tight`}>
            {formatLKR(listing.price)}
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 ml-1">
              {listing.pricingType === 'per_weekend' ? '/ weekend' : '/ night'}
            </span>
          </div>
          {listing.maxGuests && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <Users className="w-3.5 h-3.5" />
              Up to {listing.maxGuests} guests
            </span>
          )}
        </div>
      );
    }

    if (
      listing.category === 'Cars for Rent' ||
      listing.pricingType === 'daily' ||
      listing.pricingType === 'monthly'
    ) {
      return (
        <div className="flex flex-wrap items-baseline gap-2">
          <div className={`${sizeClass} font-black text-[#FF5A36] tabular-nums leading-tight`}>
            {formatLKR(listing.price)}
            <span className="text-sm font-bold text-gray-600 dark:text-gray-300 ml-1">
              {listing.pricingType === 'monthly'
                ? '/ month'
                : listing.pricingType === 'fixed'
                ? ''
                : '/ day'}
            </span>
          </div>
          {listing.rentalDriverOption && (
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              · {listing.rentalDriverOption}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className={`${sizeClass} font-black text-[#FF5A36] tabular-nums leading-tight`}>
        {formatLKR(listing.price)}
      </div>
    );
  };

  const renderDesktopCollage = () => {
    const count = gallery.length;

    const renderTile = (src: string, idx: number, extraClass = '', overlayMoreCount = 0) => (
      <button
        key={idx}
        type="button"
        onClick={() => openLightboxAt(idx)}
        className={`group relative w-full h-full overflow-hidden bg-gray-200 dark:bg-[#1E2230] focus:outline-none cursor-pointer ${extraClass}`}
        aria-label={`View photo ${idx + 1} of ${count}`}
      >
        <img
          src={src}
          alt={`${listing.title} - Photo ${idx + 1}`}
          referrerPolicy="no-referrer"
          decoding="async"
          onError={handleSafeImageError}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
        {overlayMoreCount > 0 && (
          <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-colors flex items-center justify-center">
            <span className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums drop-shadow">
              +{overlayMoreCount}
            </span>
          </div>
        )}
      </button>
    );

    if (count >= 5) {
      return (
        <div className="grid grid-cols-4 grid-rows-2 gap-1.5 h-[320px] lg:h-[400px] w-full">
          {renderTile(gallery[0], 0, 'col-span-2 row-span-2')}
          {renderTile(gallery[1], 1)}
          {renderTile(gallery[2], 2)}
          {renderTile(gallery[3], 3)}
          {renderTile(gallery[4], 4, '', count > 5 ? count - 5 : 0)}
        </div>
      );
    }

    if (count === 4) {
      return (
        <div className="grid grid-cols-4 grid-rows-2 gap-1.5 h-[320px] lg:h-[390px] w-full">
          {renderTile(gallery[0], 0, 'col-span-2 row-span-2')}
          {renderTile(gallery[1], 1, 'col-span-2 row-span-1')}
          {renderTile(gallery[2], 2, 'col-span-1 row-span-1')}
          {renderTile(gallery[3], 3, 'col-span-1 row-span-1')}
        </div>
      );
    }

    if (count === 3) {
      return (
        <div className="grid grid-cols-3 grid-rows-2 gap-1.5 h-[310px] lg:h-[370px] w-full">
          {renderTile(gallery[0], 0, 'col-span-2 row-span-2')}
          {renderTile(gallery[1], 1, 'col-span-1 row-span-1')}
          {renderTile(gallery[2], 2, 'col-span-1 row-span-1')}
        </div>
      );
    }

    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-1.5 h-[300px] lg:h-[360px] w-full">
          {renderTile(gallery[0], 0)}
          {renderTile(gallery[1], 1)}
        </div>
      );
    }

    return (
      <div className="h-[290px] lg:h-[380px] w-full">
        {renderTile(gallery[0], 0)}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
        className="bg-white dark:bg-[#151822] rounded-2xl sm:rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200/80 dark:border-[#252836] text-gray-900 dark:text-white transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Real-Time Customer Status Bar */}
        {listing.status === 'pending' ? (
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white px-4 py-2 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-4 h-4 text-amber-100 shrink-0" />
              <div className="truncate">
                <span className="font-bold">Advertisement Status: Under Safety Review</span>
                <span className="hidden sm:inline text-amber-100 ml-1.5">
                  · Only you & admin can see this ad until verified.
                </span>
              </div>
            </div>
            {canManage && (
              <span className="bg-black/25 text-amber-100 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shrink-0">
                Preview
              </span>
            )}
          </div>
        ) : listing.status === 'rejected' ? (
          <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-red-200 shrink-0" />
              <div className="truncate">
                <span className="font-bold">Action Required</span>
                <span className="hidden sm:inline text-red-100 ml-1.5">
                  · {listing.verificationNotes || 'Please update your advertisement to meet safety standards.'}
                </span>
              </div>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => onEditListing(listing)}
                className="bg-white text-red-700 font-bold px-2.5 py-0.5 rounded text-[11px] hover:bg-red-50 cursor-pointer shrink-0"
              >
                Edit Details
              </button>
            )}
          </div>
        ) : isOwner ? (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-2 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span className="truncate tabular-nums">
                <strong>Your Ad is Live</strong> across Sri Lanka · <strong>{listing.views || 0}</strong> buyer views
              </span>
            </div>
            <span className="bg-black/20 text-emerald-100 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shrink-0">
              Live Listing
            </span>
          </div>
        ) : null}

        {/* Sticky Top Utility Bar */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-[#232736] bg-white/95 dark:bg-[#151822]/95 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2 min-w-0 text-xs text-gray-600 dark:text-gray-300">
            <span className="font-bold text-[#FF5A36] uppercase tracking-wider truncate">
              {listing.serviceTrade || listing.category}
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="inline-flex items-center gap-1 truncate font-medium">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{listing.location}, Sri Lanka</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onCopyShareLink(listing)}
              title="Share listing"
              aria-label="Share listing"
              className="h-9 px-2.5 sm:px-3 rounded-xl bg-gray-100 dark:bg-[#1E2230] hover:bg-gray-200 dark:hover:bg-[#282C3D] text-gray-700 dark:text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
            {onToggleCompare && (
              <button
                type="button"
                onClick={() => onToggleCompare(listing)}
                title={isCompared ? 'Remove from comparison' : 'Compare with other ads'}
                aria-label={isCompared ? 'Remove from comparison' : 'Compare with other ads'}
                className={`h-9 w-9 sm:w-auto sm:px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isCompared
                    ? 'bg-[#FF5A36] text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-[#1E2230] hover:bg-gray-200 dark:hover:bg-[#282C3D] text-gray-700 dark:text-gray-200'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{isCompared ? 'Compared' : 'Compare'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onToggleFavorite(listing.id)}
              title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
              aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
              className={`h-9 px-2.5 sm:px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isFavorite
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                  : 'bg-gray-100 dark:bg-[#1E2230] hover:bg-gray-200 dark:hover:bg-[#282C3D] text-gray-700 dark:text-gray-200'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{isFavorite ? 'Saved' : 'Save'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              title="Report advertisement"
              aria-label="Report advertisement"
              className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#1E2230] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-500 dark:text-gray-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close advertisement details"
              className="w-9 h-9 rounded-xl bg-gray-900 dark:bg-white/15 hover:bg-black dark:hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-6">
          {/* Modern Bento Photo Gallery Hero (Desktop) & Swipe/Thumb Gallery (Mobile) */}
          <div className="relative">
            {isVideoActive && listing.videoUrl ? (
              <div className="relative h-[260px] sm:h-[360px] lg:h-[420px] w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-gray-200/60 dark:border-[#252836]">
                <video
                  ref={(el) => {
                    if (el) {
                      el.setAttribute('playsinline', '');
                      el.setAttribute('webkit-playsinline', 'true');
                    }
                  }}
                  src={listing.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 bg-purple-900/85 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-purple-400/30">
                  <Film className="w-3.5 h-3.5 text-purple-300" />
                  <span>Video Walkthrough</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVideoActive(false)}
                  className="absolute top-3 right-3 bg-white/95 hover:bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Show Photos ({gallery.length})</span>
                </button>
              </div>
            ) : (
              <>
                {/* Desktop / Tablet Bento Collage */}
                <div className="hidden md:block relative rounded-2xl overflow-hidden border border-gray-200/70 dark:border-[#252836] shadow-xs">
                  {renderDesktopCollage()}

                  {/* Bottom-Right Floating Controls (Matching Reference Screenshot) */}
                  <div className="absolute bottom-3.5 right-3.5 z-10 flex items-center gap-2">
                    {listing.videoUrl && (
                      <button
                        type="button"
                        onClick={() => setIsVideoActive(true)}
                        className="bg-purple-700/95 hover:bg-purple-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg border border-purple-400/40 backdrop-blur-sm flex items-center gap-1.5 transition-transform hover:scale-[1.02] cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Watch Video</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openLightboxAt(0)}
                      className="bg-white/95 hover:bg-white text-gray-900 text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg border border-black/10 flex items-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer"
                    >
                      <LayoutGrid className="w-3.5 h-3.5 text-gray-800" />
                      <span>Show all photos</span>
                      <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded-md text-[11px] font-extrabold tabular-nums">
                        {gallery.length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Mobile Clean Photo Carousel + Strip */}
                <div className="md:hidden space-y-2.5">
                  <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-gray-900 border border-gray-200/70 dark:border-[#252836]">
                    <img
                      src={currentPhoto}
                      alt={`${listing.title} - Photo ${activeIdx + 1}`}
                      referrerPolicy="no-referrer"
                      decoding="async"
                      onError={handleSafeImageError}
                      onClick={() => setIsZoomOpen(true)}
                      className="w-full h-full object-cover cursor-pointer"
                    />

                    {gallery.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveIdx((prev) => (prev - 1 + gallery.length) % gallery.length)}
                          aria-label="Previous photo"
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveIdx((prev) => (prev + 1) % gallery.length)}
                          aria-label="Next photo"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                      {listing.videoUrl && (
                        <button
                          type="button"
                          onClick={() => setIsVideoActive(true)}
                          className="bg-purple-700/95 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-md flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Video</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsZoomOpen(true)}
                        className="bg-white/95 text-gray-900 text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer tabular-nums"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>
                          {activeIdx + 1}/{gallery.length} Photos
                        </span>
                      </button>
                    </div>
                  </div>

                  {gallery.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {gallery.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveIdx(idx)}
                          className={`relative shrink-0 w-16 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                            idx === activeIdx
                              ? 'border-[#FF5A36] opacity-100'
                              : 'border-transparent opacity-65 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Thumbnail ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            decoding="async"
                            onError={handleSafeImageError}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Two-Column Marketplace Details Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Main Content Column */}
            <div className="lg:col-span-7 space-y-6 min-w-0">
              {/* Headline, Status & Unboxed Metadata */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {currentAvailability === 'sold' ? (
                    <span className="inline-flex items-center text-[11px] font-extrabold bg-rose-600 text-white px-2.5 py-0.5 rounded-md uppercase tracking-wide">
                      Sold Out
                    </span>
                  ) : currentAvailability === 'reserved' ? (
                    <span className="inline-flex items-center text-[11px] font-extrabold bg-amber-500 text-white px-2.5 py-0.5 rounded-md uppercase tracking-wide">
                      Reserved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Available
                    </span>
                  )}

                  {vehiclePurpose && (
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold text-white px-2.5 py-0.5 rounded-full shadow-2xs ${
                        vehiclePurpose === 'For Hire' ? 'bg-[#9A4D1E]' : 'bg-[#16803C]'
                      }`}
                    >
                      {vehiclePurpose === 'For Hire' ? (
                        <Truck className="w-3 h-3" />
                      ) : (
                        <Tag className="w-3 h-3" />
                      )}
                      <span>{vehiclePurpose}</span>
                    </span>
                  )}

                  {listing.isVerifiedPro && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 px-2.5 py-0.5 rounded-md">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Verified Pro
                    </span>
                  )}

                  {listing.isEmergency247 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-md">
                      24/7 Emergency
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-[#181920] dark:text-white leading-snug tracking-tight">
                  {listing.title}
                </h2>

                {/* Mobile Price Display right under title */}
                <div className="lg:hidden pt-0.5">{renderPriceHeadline('text-2xl')}</div>

                {/* Unboxed Typographic Metadata Row */}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-600 dark:text-gray-400 tabular-nums pt-0.5">
                  <span className="inline-flex items-center gap-1 font-medium text-gray-800 dark:text-gray-200">
                    <MapPin className="w-3.5 h-3.5 text-[#FF5A36]" />
                    {listing.location}, Sri Lanka
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    {listing.category}
                  </span>
                  {listing.serviceTrade && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300 font-medium">
                        <Wrench className="w-3.5 h-3.5" />
                        {listing.serviceTrade}
                      </span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {listing.date}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-gray-400" />
                    {listing.views || 0} views
                  </span>
                  {isAdminLoggedIn && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-300 font-semibold">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {(listing.whatsappClicks || 0) + (listing.phoneClicks || 0)} leads
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Key Specifications & Highlights */}
              {hasSpecs && (
                <div className="p-4 bg-gray-50/90 dark:bg-[#181B26] rounded-2xl border border-gray-200/80 dark:border-[#252836] space-y-3">
                  <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Key Specifications & Highlights</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Listing Details</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 tabular-nums">
                    {vehiclePurpose && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Listing Option</span>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-extrabold ${
                            vehiclePurpose === 'For Hire'
                              ? 'text-[#9A4D1E] dark:text-amber-400'
                              : 'text-[#16803C] dark:text-emerald-400'
                          }`}
                        >
                          {vehiclePurpose === 'For Hire' ? (
                            <Truck className="w-3.5 h-3.5" />
                          ) : (
                            <Tag className="w-3.5 h-3.5" />
                          )}
                          <span>{vehiclePurpose}</span>
                        </span>
                      </div>
                    )}
                    {listing.brand && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Brand / Make</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.brand}</span>
                      </div>
                    )}
                    {listing.model && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Model</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.model}</span>
                      </div>
                    )}
                    {listing.vehicleYear && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Year</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.vehicleYear}</span>
                      </div>
                    )}
                    {listing.fuelType && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Fuel Type</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.fuelType}</span>
                      </div>
                    )}
                    {listing.transmission && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Transmission</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.transmission}</span>
                      </div>
                    )}
                    {listing.vehicleMileage && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Mileage</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {Number(listing.vehicleMileage).toLocaleString()} km
                        </span>
                      </div>
                    )}
                    {listing.vehicleType && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Vehicle Type</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.vehicleType}</span>
                      </div>
                    )}
                    {listing.rentalDriverOption && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Driver Option</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.rentalDriverOption}</span>
                      </div>
                    )}
                    {listing.propertyType && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">
                          {isHolidayHome ? 'Stay Type' : 'Property Type'}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.propertyType}</span>
                      </div>
                    )}
                    {listing.maxGuests !== undefined && listing.maxGuests !== '' && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Max Guests</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          Up to {listing.maxGuests} Guests
                        </span>
                      </div>
                    )}
                    {listing.bedrooms !== undefined && listing.bedrooms !== '' && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Bedrooms</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.bedrooms} Beds</span>
                      </div>
                    )}
                    {listing.bathrooms !== undefined && listing.bathrooms !== '' && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Bathrooms</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.bathrooms} Baths</span>
                      </div>
                    )}
                    {listing.propertySize && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Size / Area</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.propertySize}</span>
                      </div>
                    )}
                    {listing.electronicsSubcategory && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Device Type</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {listing.electronicsSubcategory}
                        </span>
                      </div>
                    )}
                    {listing.storageCapacity && listing.storageCapacity !== 'N/A' && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Storage Capacity</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.storageCapacity}</span>
                      </div>
                    )}
                    {listing.itemCondition && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Condition</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.itemCondition}</span>
                      </div>
                    )}
                    {listing.jobType && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Job Type</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.jobType}</span>
                      </div>
                    )}
                    {listing.salaryPeriod && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Payment Basis</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.salaryPeriod}</span>
                      </div>
                    )}
                    {listing.serviceMode && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Service Mode</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.serviceMode}</span>
                      </div>
                    )}
                    {listing.serviceExperience && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Experience</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.serviceExperience}</span>
                      </div>
                    )}
                    {listing.serviceAvailability && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Availability</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {listing.serviceAvailability}
                        </span>
                      </div>
                    )}
                    {listing.serviceWarranty && (
                      <div className="bg-white dark:bg-[#1E2230] p-2.5 rounded-xl border border-gray-200/70 dark:border-[#282C3D]">
                        <span className="text-[10px] text-gray-400 block font-medium">Warranty / Guarantee</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{listing.serviceWarranty}</span>
                      </div>
                    )}
                  </div>

                  {Array.isArray(listing.serviceFeatures) && listing.serviceFeatures.length > 0 && (
                    <div className="pt-2 border-t border-gray-200/70 dark:border-[#252836]">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5">
                        Service Highlights & Perks
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {listing.serviceFeatures.map((feat) => (
                          <span
                            key={feat}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-500/30 text-[11px] font-bold"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{feat}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(listing.amenities) && listing.amenities.length > 0 && (
                    <div className="pt-2 border-t border-gray-200/70 dark:border-[#252836]">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5">
                        Stay Amenities
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {listing.amenities.map((amenity) => (
                          <span
                            key={amenity}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/30 text-[11px] font-bold"
                          >
                            {amenity === 'Pool' && <Waves className="w-3 h-3" />}
                            {amenity === 'Wi-Fi' && <Wifi className="w-3 h-3" />}
                            {amenity === 'Beachfront' && <Sun className="w-3 h-3" />}
                            <span>{amenity}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="border-t border-b border-gray-100 dark:border-[#252836] py-4">
                <h4 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-2">
                  {isHolidayHome ? 'Property & Stay Details' : 'Description'}
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {listing.description}
                </p>
              </div>

              {/* Smart Location & Interactive Distance Map */}
              <div>
                <AdLocationMapCard listing={listing} />
              </div>

              {/* Seller Reputation & Reviews */}
              <div className="pt-4 border-t border-gray-100 dark:border-[#252836] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300 tracking-wider">
                    Seller Reputation & Reviews
                  </h4>
                  {listing.sellerName && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Seller:{' '}
                      <strong className="text-gray-900 dark:text-white">{listing.sellerName}</strong>
                    </span>
                  )}
                </div>

                <ReviewList
                  listingId={listing.id}
                  sellerRating={currentRating}
                  reviewCount={currentReviewCount}
                />

                <ReviewForm
                  listingId={listing.id}
                  sellerName={listing.sellerName}
                  onReviewAdded={(_newRev, newRating, newCount) => {
                    if (newRating !== undefined) setCurrentRating(newRating);
                    if (newCount !== undefined) setCurrentReviewCount(newCount);
                    if (listing) {
                      listing.sellerRating = newRating;
                      listing.reviewCount = newCount;
                    }
                  }}
                />
              </div>
            </div>

            {/* Right Sticky Price & Seller Contact Column */}
            <div className="lg:col-span-5 lg:sticky lg:top-4 space-y-4">
              {/* Price + Contact Card */}
              <div className="bg-gray-50/80 dark:bg-[#181B26] border border-gray-200 dark:border-[#252836] rounded-2xl p-5 shadow-xs space-y-4">
                {/* Desktop Price Headline */}
                <div className="hidden lg:block pb-3.5 border-b border-gray-200/70 dark:border-[#252836]">
                  {renderPriceHeadline('text-2xl sm:text-3xl')}
                </div>

                {/* Holiday Home Check-In / Check-Out Inquiry Picker */}
                {isHolidayHome && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-[#1E2230] dark:to-[#1E2230] border border-emerald-200/80 dark:border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white">
                          Stay Dates
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                        Instant WhatsApp
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Check-In
                        </label>
                        <input
                          type="date"
                          min={todayStr}
                          value={checkInDate}
                          onChange={(e) => {
                            const nextIn = e.target.value;
                            setCheckInDate(nextIn);
                            if (checkOutDate <= nextIn) {
                              const d = new Date(nextIn);
                              d.setDate(d.getDate() + 1);
                              setCheckOutDate(d.toISOString().split('T')[0]);
                            }
                          }}
                          className="w-full px-2.5 py-2 rounded-xl border border-gray-300 dark:border-[#2C3144] bg-white dark:bg-[#151822] text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Check-Out
                        </label>
                        <input
                          type="date"
                          min={checkInDate || todayStr}
                          value={checkOutDate}
                          onChange={(e) => setCheckOutDate(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl border border-gray-300 dark:border-[#2C3144] bg-white dark:bg-[#151822] text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Guests (Max {maxGuestNum})
                      </label>
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-[#2C3144] bg-white dark:bg-[#151822]">
                        <button
                          type="button"
                          onClick={() => setStayGuests((g) => Math.max(1, g - 1))}
                          className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-[#282C3D] text-gray-800 dark:text-white font-black text-xs hover:bg-gray-200 dark:hover:bg-[#32374C] cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-extrabold text-gray-900 dark:text-white tabular-nums">
                          {stayGuests} Guest{stayGuests > 1 ? 's' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => setStayGuests((g) => Math.min(maxGuestNum, g + 1))}
                          className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-[#282C3D] text-gray-800 dark:text-white font-black text-xs hover:bg-gray-200 dark:hover:bg-[#32374C] cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200/70 dark:border-emerald-500/20">
                      <div className="text-xs text-gray-700 dark:text-gray-300 tabular-nums">
                        {listing.price > 0 ? (
                          listing.pricingType === 'per_weekend' ? (
                            <span>
                              Weekend: <strong className="text-gray-900 dark:text-white">{formatLKR(listing.price)}</strong>
                            </span>
                          ) : (
                            <span>
                              {stayNights} night{stayNights > 1 ? 's' : ''} ·{' '}
                              <strong className="text-emerald-700 dark:text-emerald-400 font-black">
                                {formatLKR(estimatedStayTotal)} est.
                              </strong>
                            </span>
                          )
                        ) : (
                          <span>Ask host for stay rates</span>
                        )}
                      </div>

                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onRecordAction?.('whatsapp')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Check Dates</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Seller Phone & Direct Contact Actions */}
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {isHolidayHome
                        ? 'Holiday Home Host Contact'
                        : isService
                        ? 'Service Provider Contact'
                        : 'Verified Seller Contact'}
                    </p>
                    <div className="text-xl font-extrabold text-gray-900 dark:text-white mt-1 tracking-wide flex items-center justify-center gap-2 tabular-nums">
                      <Phone className="w-4 h-4 text-[#FF5A36]" />
                      <a
                        href={`tel:${listing.phone}`}
                        onClick={() => onRecordAction?.('phone')}
                        className="hover:underline text-gray-900 dark:text-white"
                      >
                        {listing.phone}
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <a
                      href={`tel:${listing.phone}`}
                      onClick={() => onRecordAction?.('phone')}
                      className="flex items-center justify-center gap-1.5 bg-[#181920] hover:bg-black text-white text-xs sm:text-sm font-bold py-3 px-3 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{isService ? 'Call Provider' : 'Call Seller'}</span>
                    </a>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onRecordAction?.('whatsapp')}
                      className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1DA851] text-white text-xs sm:text-sm font-bold py-3 px-3 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{isService ? 'Request Quote' : 'WhatsApp'}</span>
                    </a>
                  </div>

                  {onStartChat && (
                    <button
                      type="button"
                      onClick={() => onStartChat(listing)}
                      className="w-full flex items-center justify-center gap-2 bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg hover:shadow-[#FF5A36]/20 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Live Chat on HUTA</span>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-medium">
                        Real-time
                      </span>
                    </button>
                  )}

                  {onToggleCompare && (
                    <button
                      type="button"
                      onClick={() => onToggleCompare(listing)}
                      className={`w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-4 rounded-xl border transition-all cursor-pointer ${
                        isCompared
                          ? 'bg-[#FF5A36]/10 text-[#FF5A36] border-[#FF5A36]/40 hover:bg-[#FF5A36]/20'
                          : 'bg-white dark:bg-[#1E2230] text-gray-700 dark:text-gray-200 border-gray-200 dark:border-[#282C3D] hover:bg-gray-100 dark:hover:bg-[#282C3D]'
                      }`}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>{isCompared ? 'Remove from Comparison' : 'Add to Compare (Side-by-Side)'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Pending Admin Moderation Notice */}
              {listing.status === 'pending' && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 rounded-2xl p-4 text-xs text-amber-950 dark:text-amber-100 space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Pending Administrator Safety & Delta Verification</span>
                  </div>
                  <p className="text-amber-800 dark:text-amber-200/90 leading-relaxed text-[11px]">
                    To maintain marketplace safety and verify accurate details across Sri Lanka, all new advertisements are checked by our admin team before going live.
                  </p>
                  {listing.verificationNotes && (
                    <div className="bg-white/80 dark:bg-black/25 p-2.5 rounded-xl border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-100 text-[11px] font-medium">
                      <strong className="font-bold">Admin Verification Record: </strong>
                      <span>{listing.verificationNotes}</span>
                    </div>
                  )}
                  {isAdminLoggedIn && onApproveListing && (
                    <button
                      type="button"
                      onClick={() => onApproveListing(listing.id)}
                      className="w-full mt-2 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer text-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Approve Advertisement</span>
                    </button>
                  )}
                </div>
              )}

              {/* Author / Admin Controls OR Seller Self-Service Prompt */}
              {canManage ? (
                <div className="space-y-2.5">
                  {isAdminLoggedIn ? (
                    <div className="text-[11px] font-bold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 px-3 py-2 rounded-xl flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        Admin Controls Active
                      </span>
                      <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400">
                        Status: {listing.status}
                      </span>
                    </div>
                  ) : isGuestAuthor && !currentUser ? (
                    <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 px-3 py-2 rounded-xl flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Your Ad (Posted from this device)</span>
                      </span>
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-black">
                        OWNER
                      </span>
                    </div>
                  ) : null}

                  <div className="bg-gray-50 dark:bg-[#181B26] border border-gray-200 dark:border-[#252836] rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-gray-300">
                      <span>Listing Availability</span>
                      <span className="uppercase text-[10px] text-gray-500 dark:text-gray-400">
                        {currentAvailability}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        disabled={isUpdatingAvailability || currentAvailability === 'available'}
                        onClick={() => handleUpdateAvailability('available')}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          currentAvailability === 'available'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-[#1E2230] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-[#282C3D]'
                        }`}
                      >
                        Available
                      </button>
                      <button
                        type="button"
                        disabled={isUpdatingAvailability || currentAvailability === 'reserved'}
                        onClick={() => handleUpdateAvailability('reserved')}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          currentAvailability === 'reserved'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-white dark:bg-[#1E2230] hover:bg-amber-50 dark:hover:bg-amber-950/30 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-[#282C3D]'
                        }`}
                      >
                        Reserved
                      </button>
                      <button
                        type="button"
                        disabled={isUpdatingAvailability || currentAvailability === 'sold'}
                        onClick={() => handleUpdateAvailability('sold')}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          currentAvailability === 'sold'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white dark:bg-[#1E2230] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-[#282C3D]'
                        }`}
                      >
                        Mark Sold
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditListing(listing)}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>{isAdminLoggedIn ? 'Edit Listing (Admin)' : 'Edit Ad & Price'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteListing(listing.id)}
                      className="px-3.5 flex items-center justify-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                      title="Delete this advertisement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 dark:from-orange-950/30 dark:via-[#181B26] dark:to-[#181B26] border border-orange-200 dark:border-orange-500/30 rounded-2xl p-4 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Are you the Seller / Owner?
                    </span>
                    <span className="text-[10px] bg-orange-100 dark:bg-orange-900/50 text-[#FF5A36] font-bold px-2 py-0.5 rounded-md">
                      Fast Edit
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug">
                    Want to change price, update photos, edit phone number, or mark as sold?
                  </p>
                  <button
                    type="button"
                    onClick={() => onRequestOwnerEdit && onRequestOwnerEdit(listing)}
                    className="w-full px-4 py-2.5 bg-[#FF5A36] hover:bg-[#E04826] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit My Ad & Price</span>
                  </button>
                </div>
              )}

              {/* Post to Facebook & Social Media Promo Card */}
              <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-orange-50/40 dark:from-blue-950/30 dark:via-[#181B26] dark:to-[#181B26] border border-blue-200/80 dark:border-blue-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Facebook className="w-4 h-4 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span className="truncate">Facebook & Social Flyer</span>
                      <span className="text-[10px] bg-[#1877F2] text-white font-extrabold px-1.5 py-0.5 rounded">
                        HD
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      Download photos & promo flyer
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFacebookFlyerOpen(true)}
                  className="shrink-0 inline-flex items-center gap-1.5 bg-white dark:bg-[#1E2230] hover:bg-gray-50 dark:hover:bg-[#282C3D] text-[#1877F2] dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 text-xs font-bold py-2 px-3 rounded-xl shadow-2xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Get Flyer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Fullscreen Lightbox Gallery Modal */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-between p-4 sm:p-6"
            onClick={() => setIsZoomOpen(false)}
          >
            {/* Top Bar */}
            <div
              className="w-full flex items-center justify-between text-white z-10 gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 text-sm font-semibold truncate tabular-nums">
                <Camera className="w-4 h-4 text-[#FF5A36] shrink-0" />
                <span className="truncate">
                  Photo {activeIdx + 1} of {gallery.length} · {listing.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadActivePhoto}
                  disabled={isDownloadingPhoto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer"
                  title="Download this photo"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsZoomOpen(false);
                    setIsFacebookFlyerOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title="Create Facebook Promo Flyer"
                >
                  <Facebook className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline">Facebook Flyer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(false)}
                  aria-label="Close fullscreen gallery"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Centered Large Image */}
            <div
              className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentPhoto}
                alt={`${listing.title} - Photo ${activeIdx + 1}`}
                referrerPolicy="no-referrer"
                decoding="async"
                onError={handleSafeImageError}
                className="max-h-[74vh] max-w-full object-contain rounded-2xl shadow-2xl"
              />

              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveIdx((prev) => (prev - 1 + gallery.length) % gallery.length)}
                    aria-label="Previous photo"
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-[#FF5A36] text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIdx((prev) => (prev + 1) % gallery.length)}
                    aria-label="Next photo"
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/70 hover:bg-[#FF5A36] text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Thumbnails Strip */}
            {gallery.length > 1 && (
              <div
                className="flex items-center gap-2 max-w-2xl overflow-x-auto p-2 bg-white/10 rounded-2xl backdrop-blur-md z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      idx === activeIdx
                        ? 'border-[#FF5A36] scale-105 opacity-100'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      decoding="async"
                      onError={handleSafeImageError}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Facebook Promo Flyer & Image Downloader Modal */}
      <FacebookFlyerModal
        listing={listing}
        isOpen={isFacebookFlyerOpen}
        onClose={() => setIsFacebookFlyerOpen(false)}
      />

      {/* Trust & Safety: Report Listing Modal */}
      <ReportModal
        listing={listing}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </motion.div>
  );
};
