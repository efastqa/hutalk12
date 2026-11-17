import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Search,
  MapPin,
  Plus,
  MessageSquarePlus,
  Phone,
  CheckCircle2,
  Trash2,
  X,
  RotateCcw,
  Clock,
  Tag,
  ExternalLink,
  AlertCircle,
  Send,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import {
  BuyerRequest,
  BuyerRequestStatus,
  BuyerRequestUrgency,
  Listing,
  User,
} from '../types';
import { DualToneHeading } from './DualToneHeading';
import { api } from '../services/api';

export const BUYER_REQUEST_CATEGORIES = [
  'All',
  'Vehicles',
  'Cars for Rent',
  'Auto Parts',
  'Property',
  'Boardings & Annexes',
  'Holiday Homes',
  'Phones',
  'Computers',
  'Electronics',
  'Services',
  'Jobs',
  'Education & Tuition',
  'Agriculture & Farming',
  'Weddings & Events',
  'Pets & Animals',
  'Home & Garden',
  'Fashion',
  'Luxury',
  'Other',
];

export const SRI_LANKA_DISTRICTS = [
  'All Sri Lanka',
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Monaragala',
  'Ratnapura',
  'Kegalle',
];

function formatLKR(amount: number): string {
  if (!amount || amount <= 0) return 'Negotiable';
  return 'Rs ' + Number(amount).toLocaleString('en-LK');
}

function formatWhatsAppUrl(phone: string, text: string): string {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  let intl = digits;
  if (digits.startsWith('0')) {
    intl = '94' + digits.substring(1);
  } else if (digits.length === 9) {
    intl = '94' + digits;
  }
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

function formatRelativeTime(isoDate?: string): string {
  if (!isoDate) return 'Recently';
  const ts = new Date(isoDate).getTime();
  if (isNaN(ts)) return 'Recently';
  const diffMins = Math.max(1, Math.floor((Date.now() - ts) / 60000));
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(isoDate).toLocaleDateString('en-LK', { month: 'short', day: 'numeric' });
}

function getUrgencyLabel(urgency: BuyerRequestUrgency): string {
  if (urgency === 'urgent') return 'Urgent Need';
  if (urgency === 'this_week') return 'This Week';
  return 'Flexible';
}

interface BuyerRequestsBoardProps {
  requests: BuyerRequest[];
  currentUser: User | null;
  isAdminLoggedIn: boolean;
  listings: Listing[];
  selectedDistrict?: string;
  initialOpenPostModal?: boolean;
  onConsumeInitialPostModal?: () => void;
  onBackToHome: () => void;
  onSelectListing?: (listing: Listing) => void;
  onRequestsChange: (updater: (prev: BuyerRequest[]) => BuyerRequest[]) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const BuyerRequestsBoard: React.FC<BuyerRequestsBoardProps> = ({
  requests,
  currentUser,
  isAdminLoggedIn,
  listings,
  selectedDistrict = 'All Sri Lanka',
  initialOpenPostModal = false,
  onConsumeInitialPostModal,
  onBackToHome,
  onSelectListing,
  onRequestsChange,
  onToast,
}) => {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState(selectedDistrict || 'All Sri Lanka');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | BuyerRequestUrgency>('all');
  const [showClosed, setShowClosed] = useState(false);

  // Modals
  const [isPostModalOpen, setIsPostModalOpen] = useState(initialOpenPostModal);
  const [activeRequestForOffer, setActiveRequestForOffer] = useState<BuyerRequest | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  // Post Request Form State
  const [reqTitle, setReqTitle] = useState('');
  const [reqCategory, setReqCategory] = useState('Vehicles');
  const [reqDistrict, setReqDistrict] = useState(
    selectedDistrict && selectedDistrict !== 'All Sri Lanka' ? selectedDistrict : 'Colombo'
  );
  const [reqLocation, setReqLocation] = useState('');
  const [reqBudget, setReqBudget] = useState('');
  const [reqUrgency, setReqUrgency] = useState<BuyerRequestUrgency>('this_week');
  const [reqDescription, setReqDescription] = useState('');
  const [reqBuyerName, setReqBuyerName] = useState(currentUser?.fullname || currentUser?.username || '');
  const [reqBuyerPhone, setReqBuyerPhone] = useState(currentUser?.phone || '');

  // Offer Form State
  const [offerSellerName, setOfferSellerName] = useState(currentUser?.fullname || currentUser?.username || '');
  const [offerSellerPhone, setOfferSellerPhone] = useState(currentUser?.phone || '');
  const [offerItemTitle, setOfferItemTitle] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerListingId, setOfferListingId] = useState('');

  useEffect(() => {
    if (initialOpenPostModal) {
      setIsPostModalOpen(true);
      onConsumeInitialPostModal?.();
    }
  }, [initialOpenPostModal, onConsumeInitialPostModal]);

  useEffect(() => {
    if (currentUser) {
      if (!reqBuyerName) setReqBuyerName(currentUser.fullname || currentUser.username || '');
      if (!reqBuyerPhone && currentUser.phone) setReqBuyerPhone(currentUser.phone);
      if (!offerSellerName) setOfferSellerName(currentUser.fullname || currentUser.username || '');
      if (!offerSellerPhone && currentUser.phone) setOfferSellerPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Sync active request modal object with live list updates
  const liveActiveRequest = useMemo(() => {
    if (!activeRequestForOffer) return null;
    return requests.find((r) => r.id === activeRequestForOffer.id) || activeRequestForOffer;
  }, [activeRequestForOffer, requests]);

  // Seller's own approved listings so they can attach an ad in 1 tap
  const mySellerListings = useMemo(() => {
    const guestIds = api.getGuestListingIds();
    return listings.filter(
      (l) =>
        l.status === 'approved' &&
        ((currentUser && l.userId === currentUser.id) || guestIds.includes(l.id))
    );
  }, [listings, currentUser]);

  const guestRequestIds = useMemo(() => api.getGuestBuyerRequestIds(), [requests.length]);

  const canManageRequest = (reqItem: BuyerRequest): boolean => {
    if (isAdminLoggedIn) return true;
    if (currentUser && reqItem.userId === currentUser.id) return true;
    if (guestRequestIds.includes(reqItem.id)) return true;
    return false;
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (!showClosed && r.status !== 'open') return false;
      if (categoryFilter !== 'All' && r.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      if (
        districtFilter !== 'All Sri Lanka' &&
        r.district.toLowerCase() !== districtFilter.toLowerCase() &&
        !r.location.toLowerCase().includes(districtFilter.toLowerCase())
      ) {
        return false;
      }
      if (urgencyFilter !== 'all' && r.urgency !== urgencyFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const hit =
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.district.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [requests, showClosed, categoryFilter, districtFilter, urgencyFilter, searchTerm]);

  const openCount = useMemo(
    () => requests.filter((r) => r.status === 'open').length,
    [requests]
  );

  const hasFilters = Boolean(
    searchTerm.trim() ||
      categoryFilter !== 'All' ||
      districtFilter !== 'All Sri Lanka' ||
      urgencyFilter !== 'all' ||
      showClosed
  );

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('All');
    setDistrictFilter('All Sri Lanka');
    setUrgencyFilter('all');
    setShowClosed(false);
  };

  const handleCreateRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim()) {
      onToast('Please enter what you are looking for.', 'error');
      return;
    }
    if (!reqBuyerPhone.trim()) {
      onToast('Please enter a valid contact phone or WhatsApp number.', 'error');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const created = await api.createBuyerRequest({
        title: reqTitle.trim(),
        category: reqCategory,
        district: reqDistrict,
        location: reqLocation.trim() ? `${reqLocation.trim()}, ${reqDistrict}` : reqDistrict,
        maxBudget: Number(reqBudget) || 0,
        urgency: reqUrgency,
        description:
          reqDescription.trim() ||
          `Looking for ${reqTitle.trim()} in ${reqDistrict}. Please reach out with price and availability.`,
        buyerName: reqBuyerName.trim() || 'Verified Buyer',
        buyerPhone: reqBuyerPhone.trim(),
        userId: currentUser?.id || 'guest',
      });

      onRequestsChange((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
      onToast('Your Looking For request is now live for Sri Lankan sellers!', 'success');
      setIsPostModalOpen(false);
      setReqTitle('');
      setReqLocation('');
      setReqBudget('');
      setReqDescription('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post buyer request';
      onToast(msg, 'error');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleOpenOfferDrawer = (reqItem: BuyerRequest) => {
    setActiveRequestForOffer(reqItem);
    setOfferItemTitle('');
    setOfferPrice('');
    setOfferMessage('');
    setOfferListingId('');
  };

  const handleAttachListing = (listingId: string) => {
    setOfferListingId(listingId);
    const found = listings.find((l) => l.id === listingId);
    if (found) {
      setOfferItemTitle(found.title);
      setOfferPrice(String(found.price || ''));
      if (!offerSellerPhone && found.phone) setOfferSellerPhone(found.phone);
      if (!offerSellerName && found.sellerName) setOfferSellerName(found.sellerName);
      setOfferMessage(
        `Available in ${found.location}. Direct listing from HUTA.LK — happy to arrange inspection.`
      );
    }
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveActiveRequest) return;

    if (!offerItemTitle.trim() || !offerSellerName.trim() || !offerSellerPhone.trim()) {
      onToast('Please enter your item/service title, your name, and contact number.', 'error');
      return;
    }

    setIsSubmittingOffer(true);
    try {
      const updatedReq = await api.addBuyerRequestOffer(liveActiveRequest, {
        sellerName: offerSellerName.trim(),
        sellerPhone: offerSellerPhone.trim(),
        sellerUserId: currentUser?.id,
        itemTitle: offerItemTitle.trim(),
        offeredPrice: Number(offerPrice) || 0,
        message:
          offerMessage.trim() ||
          `I have ${offerItemTitle.trim()} available. Call or WhatsApp me to discuss.`,
        listingId: offerListingId || undefined,
      });

      onRequestsChange((prev) =>
        prev.map((r) => (r.id === updatedReq.id ? updatedReq : r))
      );
      setActiveRequestForOffer(updatedReq);
      setOfferItemTitle('');
      setOfferPrice('');
      setOfferMessage('');
      setOfferListingId('');
      onToast('Your offer has been sent to the buyer!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit offer';
      onToast(msg, 'error');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const handleToggleStatus = async (reqItem: BuyerRequest) => {
    const nextStatus: BuyerRequestStatus = reqItem.status === 'open' ? 'fulfilled' : 'open';
    try {
      await api.updateBuyerRequestStatus(reqItem.id, nextStatus);
      onRequestsChange((prev) =>
        prev.map((r) => (r.id === reqItem.id ? { ...r, status: nextStatus } : r))
      );
      if (activeRequestForOffer?.id === reqItem.id) {
        setActiveRequestForOffer({ ...reqItem, status: nextStatus });
      }
      onToast(
        nextStatus === 'fulfilled'
          ? 'Marked as Fulfilled! Sellers will see you found what you needed.'
          : 'Request reopened for new seller offers.',
        'success'
      );
    } catch {
      onToast('Could not update request status', 'error');
    }
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      await api.deleteBuyerRequest(id);
      onRequestsChange((prev) => prev.filter((r) => r.id !== id));
      if (activeRequestForOffer?.id === id) {
        setActiveRequestForOffer(null);
      }
      setConfirmDeleteId(null);
      onToast('Buyer request removed.', 'info');
    } catch {
      onToast('Failed to delete buyer request', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0C10] text-[#0F172A] dark:text-[#F8FAFC] pb-24 transition-colors duration-200">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#11131B] border-b border-gray-200/80 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-[#FF5A36] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Marketplace</span>
              </button>

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <DualToneHeading
                  primaryText="Looking For"
                  accentText="Buyer Requests"
                  as="h1"
                  size="lg"
                  align="left"
                />
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tabular-nums">
                  {openCount} Open Across Sri Lanka
                </span>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
                Buyers post exactly what they want to buy, rent, or hire with their max budget. Sellers respond directly with matching items and real LKR offers.
              </p>
            </div>

            <button
              type="button"
              id="open-post-buyer-request-btn"
              onClick={() => setIsPostModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF5A36] to-[#FF7A59] hover:from-[#E04826] hover:to-[#FF5A36] text-white text-sm font-black shadow-md shadow-[#FF5A36]/25 transition-all cursor-pointer shrink-0 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Post What You Need</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search & Filter Controls */}
        <div className="bg-white dark:bg-[#151822] border border-gray-200/80 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Search */}
            <div className="relative flex items-center bg-gray-50 dark:bg-[#1C202E] border border-gray-200/80 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#FF5A36] transition-colors">
              <Search className="w-4 h-4 text-gray-400 shrink-0 mr-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search cars, annexes, parts, tuition..."
                className="bg-transparent w-full text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none"
              />
            </div>

            {/* Category */}
            <div className="flex items-center bg-gray-50 dark:bg-[#1C202E] border border-gray-200/80 dark:border-white/10 rounded-xl px-3 py-2.5">
              <Tag className="w-4 h-4 text-[#FF5A36] shrink-0 mr-2" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter buyer requests by category"
                className="bg-transparent w-full text-xs sm:text-sm font-semibold text-gray-800 dark:text-white outline-none cursor-pointer"
              >
                {BUYER_REQUEST_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-white dark:bg-[#181920]">
                    {c === 'All' ? 'All Categories' : c}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div className="flex items-center bg-gray-50 dark:bg-[#1C202E] border border-gray-200/80 dark:border-white/10 rounded-xl px-3 py-2.5">
              <MapPin className="w-4 h-4 text-[#FF5A36] shrink-0 mr-2" />
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                aria-label="Filter buyer requests by district"
                className="bg-transparent w-full text-xs sm:text-sm font-semibold text-gray-800 dark:text-white outline-none cursor-pointer"
              >
                {SRI_LANKA_DISTRICTS.map((d) => (
                  <option key={d} value={d} className="bg-white dark:bg-[#181920]">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgency & Status */}
            <div className="flex items-center gap-2">
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value as 'all' | BuyerRequestUrgency)}
                aria-label="Filter by urgency"
                className="flex-1 bg-gray-50 dark:bg-[#1C202E] border border-gray-200/80 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-gray-800 dark:text-white outline-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-[#181920]">Any Urgency</option>
                <option value="urgent" className="bg-white dark:bg-[#181920]">Urgent Need</option>
                <option value="this_week" className="bg-white dark:bg-[#181920]">This Week</option>
                <option value="flexible" className="bg-white dark:bg-[#181920]">Flexible</option>
              </select>

              <button
                type="button"
                onClick={() => setShowClosed((prev) => !prev)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                  showClosed
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-gray-50 dark:bg-[#1C202E] text-gray-700 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:border-emerald-500'
                }`}
              >
                {showClosed ? 'All Status' : 'Open Only'}
              </button>
            </div>
          </div>

          {hasFilters && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-gray-500 dark:text-gray-400 tabular-nums">
                Showing {filteredRequests.length} matching buyer {filteredRequests.length === 1 ? 'request' : 'requests'}
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 font-bold text-[#FF5A36] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Buyer Request Cards Grid */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-[#151822] border border-gray-200 dark:border-white/10 rounded-3xl p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF5A36] flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                No buyer requests match these filters
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Be the first buyer to post what you need in this category or reset your filters to view all requests across Sri Lanka.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/15 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                >
                  Show All Requests
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsPostModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                Post a Buyer Request
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map((reqItem) => {
              const isOwnerOrAdmin = canManageRequest(reqItem);
              const isFulfilled = reqItem.status === 'fulfilled';
              const offersCount = Array.isArray(reqItem.offers)
                ? reqItem.offers.length
                : reqItem.offersCount || 0;

              return (
                <motion.article
                  key={reqItem.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className={`bg-white dark:bg-[#151822] border rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xs hover:shadow-md transition-all ${
                    isFulfilled
                      ? 'border-emerald-200 dark:border-emerald-900/50 opacity-85'
                      : 'border-gray-200/90 dark:border-white/10 hover:border-[#FF5A36]/50'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Unboxed Clean Metadata Line */}
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-gray-500 dark:text-gray-400 truncate">
                        {reqItem.category} · {reqItem.district} · {formatRelativeTime(reqItem.createdAt)}
                      </span>
                      {isFulfilled ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Fulfilled
                        </span>
                      ) : reqItem.urgency === 'urgent' ? (
                        <span className="font-bold text-rose-600 dark:text-rose-400 shrink-0">
                          Urgent Need
                        </span>
                      ) : (
                        <span className="font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                          {getUrgencyLabel(reqItem.urgency)}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-snug line-clamp-2">
                        {reqItem.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 line-clamp-3 leading-relaxed">
                        {reqItem.description}
                      </p>
                    </div>

                    {/* Budget + Location + Buyer */}
                    <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex items-baseline justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                          Max Budget
                        </div>
                        <div className="text-base font-black text-[#FF5A36] tabular-nums">
                          {reqItem.maxBudget > 0 ? `Up to ${formatLKR(reqItem.maxBudget)}` : 'Flexible Budget'}
                        </div>
                      </div>
                      <div className="text-right min-w-0">
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate max-w-[140px]">
                          {reqItem.buyerName}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                          {reqItem.location}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenOfferDrawer(reqItem)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-[#FF5A36] dark:hover:bg-[#FF5A36] dark:hover:text-white text-xs font-extrabold transition-colors cursor-pointer"
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5" />
                        <span>
                          {isFulfilled
                            ? `View Offers (${offersCount})`
                            : offersCount > 0
                            ? `Respond · ${offersCount} ${offersCount === 1 ? 'Offer' : 'Offers'}`
                            : 'Send Offer'}
                        </span>
                      </button>

                      <a
                        href={formatWhatsAppUrl(
                          reqItem.buyerPhone,
                          `Hi ${reqItem.buyerName}, I saw your HUTA.LK request for "${reqItem.title}" and may have a match.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Chat on WhatsApp"
                        className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </a>

                      <a
                        href={`tel:${reqItem.buyerPhone}`}
                        title={`Call ${reqItem.buyerPhone}`}
                        className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-[#FF5A36] hover:text-white transition-colors shrink-0"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>

                    {isOwnerOrAdmin && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/10 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(reqItem)}
                          className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          {isFulfilled ? 'Reopen Request' : 'Mark as Fulfilled'}
                        </button>

                        {confirmDeleteId === reqItem.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteRequest(reqItem.id)}
                              className="font-bold text-rose-600 hover:underline cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-gray-500 hover:text-gray-800 dark:hover:text-white cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(reqItem.id)}
                            className="inline-flex items-center gap-1 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal 1: Post a Buyer Request */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div
            className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-buyer-request-heading"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPostModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="relative w-full sm:max-w-lg bg-white dark:bg-[#141722] border border-gray-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10"
            >
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h2
                    id="post-buyer-request-heading"
                    className="text-lg font-extrabold text-gray-900 dark:text-white"
                  >
                    Post a Looking For Request
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tell sellers across Sri Lanka what you want to buy or rent
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  aria-label="Close modal"
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRequestSubmit} className="p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    What are you looking for? *
                  </label>
                  <input
                    type="text"
                    required
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    placeholder="e.g. Toyota Aqua 2015 Direct Owner or 2BR Annex in Kandy"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={reqCategory}
                      onChange={(e) => setReqCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
                    >
                      {BUYER_REQUEST_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c} className="bg-white dark:bg-[#181920]">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Max Budget (LKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={reqBudget}
                      onChange={(e) => setReqBudget(e.target.value)}
                      placeholder="e.g. 45000 (0 for flexible)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      District
                    </label>
                    <select
                      value={reqDistrict}
                      onChange={(e) => setReqDistrict(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
                    >
                      {SRI_LANKA_DISTRICTS.filter((d) => d !== 'All Sri Lanka').map((d) => (
                        <option key={d} value={d} className="bg-white dark:bg-[#181920]">
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Preferred Area / Town
                    </label>
                    <input
                      type="text"
                      value={reqLocation}
                      onChange={(e) => setReqLocation(e.target.value)}
                      placeholder="e.g. Nugegoda, Peradeniya"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Urgency
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'urgent', label: 'Urgent' },
                        { id: 'this_week', label: 'This Week' },
                        { id: 'flexible', label: 'Flexible' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setReqUrgency(opt.id)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          reqUrgency === opt.id
                            ? 'bg-[#FF5A36] text-white border-[#FF5A36]'
                            : 'bg-gray-50 dark:bg-[#1C202E] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Requirements & Preferences
                  </label>
                  <textarea
                    rows={3}
                    value={reqDescription}
                    onChange={(e) => setReqDescription(e.target.value)}
                    placeholder="Specify model year, mileage, condition, parking, medium, or delivery preferences..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={reqBuyerName}
                      onChange={(e) => setReqBuyerName(e.target.value)}
                      placeholder="e.g. Kasun Perera"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={reqBuyerPhone}
                      onChange={(e) => setReqBuyerPhone(e.target.value)}
                      placeholder="077 123 4567"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className="w-full py-3 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] disabled:opacity-60 text-white font-extrabold text-sm shadow-md transition-colors cursor-pointer"
                >
                  {isSubmittingRequest ? 'Publishing Request...' : 'Publish Looking For Request'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Seller Offers & Submit Offer Drawer */}
      <AnimatePresence>
        {liveActiveRequest && (
          <div
            className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="offers-drawer-title"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveRequestForOffer(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="relative w-full sm:max-w-2xl bg-white dark:bg-[#141722] border border-gray-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#FF5A36] uppercase tracking-wider">
                    {liveActiveRequest.category} · {liveActiveRequest.district}
                  </div>
                  <h2
                    id="offers-drawer-title"
                    className="text-lg font-extrabold text-gray-900 dark:text-white leading-snug mt-0.5"
                  >
                    {liveActiveRequest.title}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Budget: <strong className="text-gray-900 dark:text-white tabular-nums">{liveActiveRequest.maxBudget > 0 ? formatLKR(liveActiveRequest.maxBudget) : 'Flexible'}</strong> · Buyer: {liveActiveRequest.buyerName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveRequestForOffer(null)}
                  aria-label="Close offers drawer"
                  className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                {/* Requirement Details + Quick Direct Contact */}
                <div className="bg-gray-50 dark:bg-[#1A1E2C] border border-gray-200/80 dark:border-white/10 rounded-2xl p-4 space-y-3">
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {liveActiveRequest.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={formatWhatsAppUrl(
                        liveActiveRequest.buyerPhone,
                        `Hi ${liveActiveRequest.buyerName}, I saw your HUTA.LK request for "${liveActiveRequest.title}".`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp Buyer</span>
                    </a>
                    <a
                      href={`tel:${liveActiveRequest.buyerPhone}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#141722] border border-gray-200 dark:border-white/15 text-gray-800 dark:text-white text-xs font-bold hover:border-[#FF5A36] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#FF5A36]" />
                      <span className="tabular-nums">{liveActiveRequest.buyerPhone}</span>
                    </a>
                  </div>
                </div>

                {/* Seller Offers Received */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                      Seller Offers ({liveActiveRequest.offers?.length || 0})
                    </h3>
                    {liveActiveRequest.status === 'fulfilled' && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Marked Fulfilled by Buyer
                      </span>
                    )}
                  </div>

                  {!liveActiveRequest.offers || liveActiveRequest.offers.length === 0 ? (
                    <div className="border border-dashed border-gray-200 dark:border-white/15 rounded-2xl p-5 text-center text-xs text-gray-500 dark:text-gray-400">
                      No seller offers submitted yet. Be the first seller to pitch a match below.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {liveActiveRequest.offers.map((offer) => {
                        const matchedListing = offer.listingId
                          ? listings.find((l) => l.id === offer.listingId)
                          : undefined;
                        return (
                          <div
                            key={offer.id}
                            className="bg-white dark:bg-[#191D2B] border border-gray-200 dark:border-white/10 rounded-2xl p-4 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                  {offer.itemTitle}
                                </h4>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                  Offered by {offer.sellerName} · {formatRelativeTime(offer.createdAt)}
                                </p>
                              </div>
                              <div className="text-sm font-black text-[#FF5A36] tabular-nums shrink-0">
                                {formatLKR(offer.offeredPrice)}
                              </div>
                            </div>

                            {offer.message && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                {offer.message}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <a
                                href={formatWhatsAppUrl(
                                  offer.sellerPhone,
                                  `Hi ${offer.sellerName}, thanks for your offer "${offer.itemTitle}" on my HUTA.LK request.`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold hover:bg-emerald-600 hover:text-white transition-colors"
                              >
                                <Send className="w-3 h-3" />
                                <span>WhatsApp Seller</span>
                              </a>
                              <a
                                href={`tel:${offer.sellerPhone}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 text-[11px] font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors tabular-nums"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{offer.sellerPhone}</span>
                              </a>
                              {matchedListing && onSelectListing && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveRequestForOffer(null);
                                    onSelectListing(matchedListing);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#FF5A36] text-[11px] font-bold hover:underline cursor-pointer"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>View Linked Ad</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Submit Seller Offer Form */}
                {liveActiveRequest.status === 'open' ? (
                  <form
                    onSubmit={handleSubmitOffer}
                    className="border-t border-gray-200 dark:border-white/10 pt-5 space-y-3.5"
                  >
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                      Have a match? Send your offer
                    </h3>

                    {mySellerListings.length > 0 && (
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                          Quick-fill from one of your active HUTA ads (optional)
                        </label>
                        <select
                          value={offerListingId}
                          onChange={(e) => handleAttachListing(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
                        >
                          <option value="">-- Enter custom offer manually --</option>
                          {mySellerListings.map((ad) => (
                            <option key={ad.id} value={ad.id} className="bg-white dark:bg-[#181920]">
                              {ad.title} ({formatLKR(ad.price)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          required
                          value={offerItemTitle}
                          onChange={(e) => setOfferItemTitle(e.target.value)}
                          placeholder="Item or service you are offering *"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          min="0"
                          value={offerPrice}
                          onChange={(e) => setOfferPrice(e.target.value)}
                          placeholder="Offer Price (LKR)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        required
                        value={offerSellerName}
                        onChange={(e) => setOfferSellerName(e.target.value)}
                        placeholder="Your Name / Shop Name *"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
                      />
                      <input
                        type="tel"
                        required
                        value={offerSellerPhone}
                        onChange={(e) => setOfferSellerPhone(e.target.value)}
                        placeholder="Your WhatsApp / Phone *"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
                      />
                    </div>

                    <textarea
                      rows={2}
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                      placeholder="Condition, location, warranty, or inspection timing..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
                    />

                    <button
                      type="submit"
                      disabled={isSubmittingOffer}
                      className="w-full py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] disabled:opacity-60 text-white text-xs sm:text-sm font-extrabold shadow-sm transition-colors cursor-pointer"
                    >
                      {isSubmittingOffer ? 'Sending Offer...' : 'Submit Offer to Buyer'}
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>This buyer request has been marked as fulfilled and is closed for new offers.</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface BuyerRequestsHomeStripProps {
  requests: BuyerRequest[];
  onBrowseAll: () => void;
  onPostRequest: () => void;
}

export const BuyerRequestsHomeStrip: React.FC<BuyerRequestsHomeStripProps> = ({
  requests,
  onBrowseAll,
  onPostRequest,
}) => {
  const openRequests = useMemo(
    () => requests.filter((r) => r.status === 'open').slice(0, 3),
    [requests]
  );

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
      <div className="bg-white dark:bg-[#151822] border border-gray-200/80 dark:border-white/10 rounded-3xl p-5 sm:p-7 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-white/10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5A36] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Looking For · Reverse Marketplace</span>
            </div>
            <h3 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Active Buyer Requests Across Sri Lanka
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Can&apos;t find what you want, or have stock waiting? Buyers post budgets and sellers reply directly with offers.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={onPostRequest}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Post Request</span>
            </button>
            <button
              type="button"
              onClick={onBrowseAll}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-900 dark:text-white text-xs font-extrabold transition-colors cursor-pointer"
            >
              <span>Browse All ({requests.filter((r) => r.status === 'open').length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {openRequests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-5">
            {openRequests.map((reqItem) => {
              const offersCount = Array.isArray(reqItem.offers)
                ? reqItem.offers.length
                : reqItem.offersCount || 0;
              return (
                <button
                  key={reqItem.id}
                  type="button"
                  onClick={onBrowseAll}
                  className="text-left p-4 rounded-2xl bg-gray-50/80 dark:bg-[#1A1E2C] border border-gray-200/70 dark:border-white/10 hover:border-[#FF5A36] transition-all cursor-pointer group flex flex-col justify-between gap-2.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                      <span className="truncate font-semibold">
                        {reqItem.category} · {reqItem.district}
                      </span>
                      {reqItem.urgency === 'urgent' && (
                        <span className="font-bold text-rose-600 dark:text-rose-400 shrink-0">
                          Urgent
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-extrabold text-gray-900 dark:text-white group-hover:text-[#FF5A36] transition-colors line-clamp-2">
                      {reqItem.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 dark:border-white/10 text-xs">
                    <span className="font-black text-[#FF5A36] tabular-nums">
                      {reqItem.maxBudget > 0 ? `Up to ${formatLKR(reqItem.maxBudget)}` : 'Flexible Budget'}
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-gray-600 dark:text-gray-300">
                      <span>{offersCount} {offersCount === 1 ? 'offer' : 'offers'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
