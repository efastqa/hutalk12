import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  HeartHandshake,
  Hospital,
  Droplets,
  GraduationCap,
  Utensils,
  Building2,
  MapPin,
  Phone,
  ExternalLink,
  ShieldCheck,
  Search,
  Plus,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  Share2,
  HandHeart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  DonationCause,
  DonationCategory,
  DonationUrgency,
  DonationPledgeType,
  User,
} from '../types';
import { api } from '../services/api';
import donateIcon3D from '../assets/images/donate_icon_3d_1794949597682.jpg';
import donateHeroMedicalImg from '../assets/images/donate_hero_medical_bright_1795080157718.jpg';
import donateHeroEducationImg from '../assets/images/donate_hero_education_bright_1795080158968.jpg';
import donateHeroCommunityImg from '../assets/images/donate_hero_community_bright_1795080158481.jpg';

interface DonateSriLankaPageProps {
  causes: DonationCause[];
  currentUser: User | null;
  isAdminLoggedIn: boolean;
  selectedDistrict?: string;
  onCausesChange: React.Dispatch<React.SetStateAction<DonationCause[]>>;
  onBackToHome: () => void;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const DONATION_CATEGORIES: Array<'All' | DonationCategory> = [
  'All',
  'Hospitals & Medical',
  'Blood & Emergency',
  'Children & Schools',
  'Food & Elders Relief',
  'Community Infrastructure',
];

const SRI_LANKA_DISTRICTS = [
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

function getSafeExternalUrl(url?: string): string | null {
  if (typeof url === 'string' && /^https?:\/\//i.test(url.trim())) {
    return url.trim();
  }
  return null;
}

interface DonateHeroSlide {
  id: string;
  focusLabel: string;
  title: string;
  tagline: string;
  image: string;
  categories: Array<'All' | DonationCategory>;
  objectPosition: string;
  scaleFrom: number;
  scaleTo: number;
  xFrom: string;
  xTo: string;
}

const DONATE_HERO_DURATION_MS = 6500;

const DONATE_HERO_SLIDES: DonateHeroSlide[] = [
  {
    id: 'donate-medical-care',
    focusLabel: 'Priority Healthcare Focus',
    title: 'Public Hospitals & Blood Relief',
    tagline: 'Direct support for Apeksha Cancer Institute, Lady Ridgeway Children’s Hospital & National Blood Bank.',
    image: donateHeroMedicalImg,
    categories: ['All', 'Hospitals & Medical', 'Blood & Emergency'],
    objectPosition: '50% 42%',
    scaleFrom: 1.01,
    scaleTo: 1.07,
    xFrom: '0%',
    xTo: '-1.2%',
  },
  {
    id: 'donate-education-bright',
    focusLabel: 'Education & Childcare',
    title: 'Rural Schools & Youth Learning',
    tagline: 'Books, backpacks, uniforms, and bright learning resources delivered to underserved districts.',
    image: donateHeroEducationImg,
    categories: ['Children & Schools'],
    objectPosition: '50% 45%',
    scaleFrom: 1.06,
    scaleTo: 1.01,
    xFrom: '-1.2%',
    xTo: '1.2%',
  },
  {
    id: 'donate-community-aid',
    focusLabel: 'Community & Family Relief',
    title: 'Dry Rations & Island Aid Hubs',
    tagline: 'Verified food packs, clean drinking water, and senior care essentials across all 25 districts.',
    image: donateHeroCommunityImg,
    categories: ['Food & Elders Relief', 'Community Infrastructure'],
    objectPosition: '50% 45%',
    scaleFrom: 1.02,
    scaleTo: 1.08,
    xFrom: '1.2%',
    xTo: '-1.2%',
  },
];

function getCategoryImage(cause: DonationCause): string {
  if (cause.image === 'children' || cause.category === 'Children & Schools') {
    return donateHeroEducationImg;
  }
  if (cause.image === 'food' || cause.category === 'Food & Elders Relief') {
    return donateHeroCommunityImg;
  }
  return donateHeroMedicalImg;
}

function getCategoryIcon(category: DonationCategory) {
  switch (category) {
    case 'Hospitals & Medical':
      return Hospital;
    case 'Blood & Emergency':
      return Droplets;
    case 'Children & Schools':
      return GraduationCap;
    case 'Food & Elders Relief':
      return Utensils;
    default:
      return Building2;
  }
}

function getUrgencyLabel(urgency: DonationUrgency): {
  text: string;
  className: string;
  Icon: React.FC<{ className?: string }>;
} {
  if (urgency === 'critical') {
    return {
      text: 'Critical Need',
      className: 'text-rose-700 dark:text-rose-400',
      Icon: AlertTriangle,
    };
  }
  if (urgency === 'urgent') {
    return {
      text: 'Urgent Need',
      className: 'text-amber-700 dark:text-amber-400',
      Icon: Clock,
    };
  }
  return {
    text: 'Ongoing Aid',
    className: 'text-teal-700 dark:text-teal-400',
    Icon: HeartHandshake,
  };
}

function formatLkr(amount: number): string {
  return `LKR ${Math.round(amount).toLocaleString('en-LK')}`;
}

export const DonateSriLankaPage: React.FC<DonateSriLankaPageProps> = ({
  causes,
  currentUser,
  isAdminLoggedIn,
  selectedDistrict = 'All Sri Lanka',
  onCausesChange,
  onBackToHome,
  onToast,
}) => {
  const [activeCategory, setActiveCategory] = useState<'All' | DonationCategory>('All');
  const [districtFilter, setDistrictFilter] = useState<string>(selectedDistrict || 'All Sri Lanka');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all'>('active');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Selected cause detail & pledge modal
  const [selectedCauseId, setSelectedCauseId] = useState<string | null>(null);
  const [pledgeDonorName, setPledgeDonorName] = useState<string>(currentUser?.fullname || currentUser?.username || '');
  const [pledgeDonorPhone, setPledgeDonorPhone] = useState<string>(currentUser?.phone || '');
  const [pledgeDonorDistrict, setPledgeDonorDistrict] = useState<string>('Colombo');
  const [pledgeType, setPledgeType] = useState<DonationPledgeType>('supplies');
  const [pledgeAmountLkr, setPledgeAmountLkr] = useState<string>('');
  const [pledgeItemsSummary, setPledgeItemsSummary] = useState<string>('');
  const [pledgeMessage, setPledgeMessage] = useState<string>('');
  const [isSubmittingPledge, setIsSubmittingPledge] = useState<boolean>(false);

  // Submit new urgent need modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [orgName, setOrgName] = useState<string>('');
  const [causeTitle, setCauseTitle] = useState<string>('');
  const [causeCategory, setCauseCategory] = useState<DonationCategory>('Hospitals & Medical');
  const [causeDistrict, setCauseDistrict] = useState<string>('Colombo');
  const [causeAddress, setCauseAddress] = useState<string>('');
  const [causePhone, setCausePhone] = useState<string>('');
  const [causeContactPerson, setCauseContactPerson] = useState<string>('');
  const [causeWebsite, setCauseWebsite] = useState<string>('');
  const [causeUrgency, setCauseUrgency] = useState<DonationUrgency>('urgent');
  const [causeNeededItemsText, setCauseNeededItemsText] = useState<string>('');
  const [causeBankNote, setCauseBankNote] = useState<string>('');
  const [causeDescription, setCauseDescription] = useState<string>('');
  const [isCreatingCause, setIsCreatingCause] = useState<boolean>(false);

  const prefersReducedMotion = useReducedMotion();
  const [heroSlideIndex, setHeroSlideIndex] = useState<number>(0);
  const [isHeroPaused, setIsHeroPaused] = useState<boolean>(false);

  const activeHeroSlide = DONATE_HERO_SLIDES[heroSlideIndex % DONATE_HERO_SLIDES.length];

  const handleCycleHero = useCallback((direction: 1 | -1) => {
    setHeroSlideIndex((prev) => (prev + direction + DONATE_HERO_SLIDES.length) % DONATE_HERO_SLIDES.length);
  }, []);

  const handleSelectPillarCategory = useCallback((category: 'All' | DonationCategory) => {
    setActiveCategory(category);
    const matchIdx = DONATE_HERO_SLIDES.findIndex((slide) => slide.categories.includes(category));
    if (matchIdx >= 0) {
      setHeroSlideIndex(matchIdx);
    }
  }, []);

  useEffect(() => {
    if (isHeroPaused || prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setHeroSlideIndex((prev) => (prev + 1) % DONATE_HERO_SLIDES.length);
    }, DONATE_HERO_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [isHeroPaused, prefersReducedMotion]);

  const guestIds = useMemo(() => api.getGuestDonationCauseIds(), [causes]);

  const selectedCause = useMemo(
    () => causes.find((c) => c.id === selectedCauseId) || null,
    [causes, selectedCauseId]
  );

  const filteredCauses = useMemo(() => {
    return causes.filter((cause) => {
      if (statusFilter === 'active' && cause.status !== 'active') return false;
      if (activeCategory !== 'All' && cause.category !== activeCategory) return false;
      if (districtFilter && districtFilter !== 'All Sri Lanka') {
        const dLow = districtFilter.toLowerCase();
        const matchDistrict =
          cause.district.toLowerCase() === dLow ||
          cause.district.toLowerCase() === 'all sri lanka' ||
          cause.address.toLowerCase().includes(dLow);
        if (!matchDistrict) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          cause.organizationName.toLowerCase().includes(q) ||
          cause.title.toLowerCase().includes(q) ||
          cause.description.toLowerCase().includes(q) ||
          cause.address.toLowerCase().includes(q) ||
          cause.neededItems.some((item) => item.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }
      return true;
    });
  }, [causes, statusFilter, activeCategory, districtFilter, searchQuery]);

  const totals = useMemo(() => {
    const activeCount = causes.filter((c) => c.status === 'active').length;
    const totalPledges = causes.reduce((acc, c) => acc + (c.pledgeCount || 0), 0);
    const totalLkr = causes.reduce((acc, c) => acc + (c.totalPledgedLkr || 0), 0);
    return { activeCount, totalPledges, totalLkr };
  }, [causes]);

  const canManageCause = (cause: DonationCause) => {
    if (isAdminLoggedIn) return true;
    if (currentUser && cause.userId === currentUser.id) return true;
    if (guestIds.includes(cause.id)) return true;
    return false;
  };

  const handleShareCause = async (cause: DonationCause) => {
    const text = `Support ${cause.organizationName}: ${cause.title} (${cause.district}) — Sri Lanka Aid Directory on HUTA.lk`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: cause.organizationName,
          text,
          url: window.location.href,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        onToast('Cause details copied to clipboard.', 'success');
      }
    } catch {
      // user cancelled share
    }
  };

  const handleSubmitPledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCause) return;
    if (!pledgeDonorName.trim()) {
      onToast('Please enter your name or group name.', 'error');
      return;
    }
    if (pledgeType === 'funds' && (!pledgeAmountLkr || Number(pledgeAmountLkr) <= 0)) {
      onToast('Please enter an estimated LKR pledge amount.', 'error');
      return;
    }
    if (pledgeType === 'supplies' && !pledgeItemsSummary.trim()) {
      onToast('Please describe the supplies or items you plan to donate.', 'error');
      return;
    }

    setIsSubmittingPledge(true);
    try {
      const updated = await api.addDonationPledge(selectedCause, {
        donorName: pledgeDonorName.trim(),
        donorPhone: pledgeDonorPhone.trim() || undefined,
        donorDistrict: pledgeDonorDistrict,
        pledgeType,
        amountLkr: pledgeType === 'funds' ? Number(pledgeAmountLkr) : 0,
        itemsSummary:
          pledgeType === 'blood_volunteer'
            ? pledgeItemsSummary.trim() || 'Voluntary blood/platelet donor registration'
            : pledgeItemsSummary.trim() || undefined,
        message: pledgeMessage.trim() || undefined,
      });

      onCausesChange((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setPledgeAmountLkr('');
      setPledgeItemsSummary('');
      setPledgeMessage('');
      onToast(`Thank you! Your pledge for ${selectedCause.organizationName} has been recorded.`, 'success');
    } catch {
      onToast('Could not record your pledge right now. Please try again.', 'error');
    } finally {
      setIsSubmittingPledge(false);
    }
  };

  const handleCreateCause = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !causeTitle.trim() || !causePhone.trim()) {
      onToast('Institution name, urgent need title, and phone number are required.', 'error');
      return;
    }

    const neededItems = causeNeededItemsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 25);

    setIsCreatingCause(true);
    try {
      const created = await api.createDonationCause({
        organizationName: orgName.trim(),
        title: causeTitle.trim(),
        category: causeCategory,
        district: causeDistrict,
        address: causeAddress.trim() || causeDistrict,
        officialWebsite: causeWebsite.trim() || undefined,
        contactPhone: causePhone.trim(),
        contactPerson: causeContactPerson.trim() || undefined,
        urgency: causeUrgency,
        bankDetailsNote:
          causeBankNote.trim() ||
          'Verify official institution identity and drop-off instructions by calling the coordination desk listed above.',
        neededItems: neededItems.length > 0 ? neededItems : ['Essential Medical or Relief Supplies'],
        description: causeDescription.trim() || `${causeTitle.trim()} for ${orgName.trim()} (${causeDistrict}).`,
        userId: currentUser?.id || 'guest',
      });

      onCausesChange((prev) => [created, ...prev]);
      setIsSubmitModalOpen(false);
      setOrgName('');
      setCauseTitle('');
      setCauseAddress('');
      setCausePhone('');
      setCauseContactPerson('');
      setCauseWebsite('');
      setCauseNeededItemsText('');
      setCauseBankNote('');
      setCauseDescription('');
      onToast('Sri Lanka hospital / relief need published successfully.', 'success');
    } catch {
      onToast('Could not publish the donation request. Please try again.', 'error');
    } finally {
      setIsCreatingCause(false);
    }
  };

  const handleMarkFulfilled = async (cause: DonationCause) => {
    const nextStatus = cause.status === 'fulfilled' ? 'active' : 'fulfilled';
    try {
      await api.updateDonationCauseStatus(cause.id, nextStatus);
      onCausesChange((prev) =>
        prev.map((c) => (c.id === cause.id ? { ...c, status: nextStatus } : c))
      );
      onToast(
        nextStatus === 'fulfilled' ? 'Marked as fulfilled.' : 'Re-opened cause as active.',
        'info'
      );
    } catch {
      onToast('Could not update status.', 'error');
    }
  };

  const handleDeleteCause = async (causeId: string) => {
    try {
      await api.deleteDonationCause(causeId);
      onCausesChange((prev) => prev.filter((c) => c.id !== causeId));
      if (selectedCauseId === causeId) setSelectedCauseId(null);
      onToast('Donation request removed.', 'info');
    } catch {
      onToast('Failed to remove donation request.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0C10] text-gray-900 dark:text-white pb-20 transition-colors">
      {/* Bright Modern Sunlit Sri Lanka Donate Hero Banner */}
      <header
        className="relative overflow-hidden bg-[#EAF6F5] dark:bg-[#0B1419] text-slate-900 dark:text-white border-b border-slate-200/80 dark:border-slate-800/80 transition-colors"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
      >
        {/* Cross-Fading Bright Daylight Sri Lanka Humanitarian Photography + Ken Burns Motion */}
        <AnimatePresence initial={false}>
          <motion.img
            key={activeHeroSlide.id}
            src={activeHeroSlide.image}
            alt={`${activeHeroSlide.title} — ${activeHeroSlide.focusLabel}`}
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
              scale: { duration: DONATE_HERO_DURATION_MS / 1000 + 0.6, ease: 'linear' },
              x: { duration: DONATE_HERO_DURATION_MS / 1000 + 0.6, ease: 'linear' },
            }}
            style={{ objectPosition: activeHeroSlide.objectPosition }}
            className="absolute inset-0 w-full h-full object-cover brightness-[1.03] saturate-[1.05] pointer-events-none select-none"
          />
        </AnimatePresence>

        {/* Airy Luminous Directional Veil for Crisp WCAG AA Contrast across Mobile, Tablet & Desktop */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/15 to-white/60 dark:from-[#081016]/50 dark:via-transparent dark:to-[#081016]/75 pointer-events-none z-[1]" />
        <div className="absolute inset-y-0 left-0 w-full md:w-3/4 bg-gradient-to-r from-white/92 via-white/65 to-transparent dark:from-[#081016]/88 dark:via-[#081016]/55 dark:to-transparent pointer-events-none z-[1]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10 flex flex-col justify-between gap-5 sm:gap-6 min-h-[305px] sm:min-h-[340px] lg:min-h-[375px]">
          {/* Top Hero Navigation & Submit Need CTA */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <button
              type="button"
              id="donate-back-btn"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 min-h-[42px] sm:min-h-[40px] rounded-xl bg-white/90 hover:bg-white dark:bg-slate-900/75 dark:hover:bg-slate-900/90 backdrop-blur-md border border-white/85 dark:border-white/20 text-xs sm:text-sm font-bold text-slate-900 dark:text-white shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Back to Marketplace</span>
              <span className="sm:hidden">Back</span>
            </button>

            <button
              type="button"
              id="donate-submit-need-btn"
              onClick={() => setIsSubmitModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 min-h-[42px] sm:min-h-[40px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-teal-600/25 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="sm:hidden">Submit Need</span>
              <span className="hidden sm:inline">Submit Hospital / Relief Need</span>
            </button>
          </div>

          {/* Main Hero Split Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-8 items-end">
            <div className="md:col-span-7 space-y-3 min-w-0">
              {/* Unboxed Directory Context */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-white/85">
                <span className="inline-flex items-center gap-1 font-black uppercase tracking-wider text-teal-700 dark:text-teal-300">
                  <HandHeart className="w-3.5 h-3.5 shrink-0" />
                  <span>Sri Lanka Humanitarian Directory</span>
                </span>
                <span aria-hidden="true" className="text-slate-400 dark:text-white/40">·</span>
                <span>Direct Verification</span>
                <span aria-hidden="true" className="text-slate-400 dark:text-white/40">·</span>
                <span>All 25 Districts</span>
              </div>

              {/* Brand Mark + Display Headline */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/95 dark:bg-[#141E26]/90 border border-white dark:border-white/25 overflow-hidden shrink-0 shadow-md">
                  <img
                    src={donateIcon3D}
                    alt="Donate Sri Lanka Emblem"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="text-[1.75rem] sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08] [text-wrap:balance] min-w-0">
                  <span className="text-[#0A2540] dark:text-white">Donate to </span>
                  <span className="text-teal-600 dark:text-teal-400">Sri Lanka</span>
                </h1>
              </div>

              {/* Rotating Focus + Institutional Trust Copy */}
              <div className="space-y-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeHeroSlide.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="space-y-1"
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs font-extrabold tracking-wide">
                      <span className="text-teal-700 dark:text-teal-300 uppercase tracking-wider">{activeHeroSlide.focusLabel}</span>
                      <span aria-hidden="true" className="text-slate-400 dark:text-white/35">·</span>
                      <span className="text-slate-900 dark:text-white">{activeHeroSlide.title}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 max-w-2xl leading-relaxed font-medium">
                      {activeHeroSlide.tagline}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="pt-1 flex items-start gap-2 text-[11px] sm:text-xs text-slate-700 dark:text-slate-200 max-w-2xl">
                  <ShieldCheck className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-slate-950 dark:text-white">Zero Middleman Fees:</strong>{' '}
                    Verify institutional contacts directly or pledge medical equipment, school packs, and blood support across Sri Lanka.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Live Impact Stats Card + Hero Slide Controls */}
            <div className="md:col-span-5 flex flex-col items-stretch md:items-end justify-end gap-3 min-w-0">
              <div className="w-full rounded-2xl bg-white/88 dark:bg-slate-900/78 backdrop-blur-xl border border-white/85 dark:border-white/15 p-3.5 sm:p-4 shadow-lg">
                <div className="flex items-center justify-between gap-2 mb-2.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  <span className="uppercase tracking-wider text-teal-700 dark:text-teal-400 font-black">
                    Island Aid Pulse
                  </span>
                  <span>Verified Directory</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5 text-left">
                  <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
                    <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white tabular-nums">
                      {totals.activeCount}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-tight">Active Causes</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
                    <div className="text-base sm:text-xl font-black text-teal-700 dark:text-teal-400 tabular-nums">
                      {totals.totalPledges}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-tight">Donor Pledges</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
                    <div className="text-xs sm:text-base font-black text-slate-900 dark:text-white tabular-nums truncate">
                      {totals.totalLkr > 0 ? formatLkr(totals.totalLkr) : 'Direct Aid'}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-tight">Pledged Value</div>
                  </div>
                </div>
              </div>

              {/* Hero Backdrop Stepper & Circular Controls */}
              <div className="flex items-center justify-between md:justify-end gap-2.5 w-full">
                <div
                  className="flex items-center gap-1.5 bg-white/85 dark:bg-slate-900/65 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/80 dark:border-white/15 shadow-sm"
                  role="tablist"
                  aria-label="Donate hero scenes"
                >
                  {DONATE_HERO_SLIDES.map((slide, idx) => {
                    const isActive = idx === heroSlideIndex;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`Show ${slide.title}`}
                        onClick={() => setHeroSlideIndex(idx)}
                        className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-300 cursor-pointer ${
                          isActive
                            ? 'w-8 sm:w-10 bg-slate-900/20 dark:bg-white/30'
                            : 'w-2.5 bg-slate-900/35 hover:bg-slate-900/65 dark:bg-white/40 dark:hover:bg-white/75'
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            key={`donate-progress-${slide.id}-${heroSlideIndex}`}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{
                              duration: isHeroPaused || prefersReducedMotion ? 0 : DONATE_HERO_DURATION_MS / 1000,
                              ease: 'linear',
                            }}
                            style={{ transformOrigin: 'left center' }}
                            className="absolute inset-0 bg-teal-600 dark:bg-teal-400 rounded-full"
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
                    aria-label="Previous humanitarian hero backdrop"
                    className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900/90 backdrop-blur-md border border-white/80 dark:border-white/20 text-slate-900 dark:text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCycleHero(1)}
                    aria-label="Next humanitarian hero backdrop"
                    className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white/90 hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900/90 backdrop-blur-md border border-white/80 dark:border-white/20 text-slate-900 dark:text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8 sm:space-y-10">
        {/* Three Priority Aid Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <button
            type="button"
            onClick={() => handleSelectPillarCategory('Hospitals & Medical')}
            className="group text-left bg-white dark:bg-[#151822] border border-gray-200 dark:border-white/10 hover:border-teal-500/60 rounded-2xl overflow-hidden transition-colors cursor-pointer"
          >
            <div className="h-40 overflow-hidden bg-slate-100 dark:bg-[#1C202E]">
              {!failedImages.p1 ? (
                <img
                  src={donateHeroMedicalImg}
                  alt="Public hospitals and essential medicine care in Sri Lanka"
                  referrerPolicy="no-referrer"
                  onError={() => setFailedImages((p) => ({ ...p, p1: true }))}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-teal-600">
                  <Hospital className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="text-xs text-teal-700 dark:text-teal-400 font-semibold">Medical & Surgical</div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">Public Hospitals & ICU Care</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Medicines, surgical consumables, dialysis kits, and wheelchairs for referral hospitals.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPillarCategory('Children & Schools')}
            className="group text-left bg-white dark:bg-[#151822] border border-gray-200 dark:border-white/10 hover:border-teal-500/60 rounded-2xl overflow-hidden transition-colors cursor-pointer"
          >
            <div className="h-40 overflow-hidden bg-slate-100 dark:bg-[#1C202E]">
              {!failedImages.p2 ? (
                <img
                  src={donateHeroEducationImg}
                  alt="School backpacks and learning resources for rural Sri Lankan children"
                  referrerPolicy="no-referrer"
                  onError={() => setFailedImages((p) => ({ ...p, p2: true }))}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-teal-600">
                  <GraduationCap className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="text-xs text-teal-700 dark:text-teal-400 font-semibold">Education & Childcare</div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">Rural Schools & Children’s Homes</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Exercise books, shoes, backpacks, and nutrition support across underserved districts.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPillarCategory('Food & Elders Relief')}
            className="group text-left bg-white dark:bg-[#151822] border border-gray-200 dark:border-white/10 hover:border-teal-500/60 rounded-2xl overflow-hidden transition-colors cursor-pointer"
          >
            <div className="h-40 overflow-hidden bg-slate-100 dark:bg-[#1C202E]">
              {!failedImages.p3 ? (
                <img
                  src={donateHeroCommunityImg}
                  alt="Community aid relief packages and family essentials in Sri Lanka"
                  referrerPolicy="no-referrer"
                  onError={() => setFailedImages((p) => ({ ...p, p3: true }))}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-teal-600">
                  <Utensils className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="text-xs text-teal-700 dark:text-teal-400 font-semibold">Community & Flood Relief</div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">Dry Rations & Elders’ Homes</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Essential rice & dhal parcels, clean drinking water, and senior care hygiene supplies.
              </p>
            </div>
          </button>
        </section>

        {/* Filter & Search Toolbar */}
        <section className="bg-white dark:bg-[#151822] border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hospital, city, blood type, wheelchair, medicines..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-xs font-semibold">
                <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="bg-transparent text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
                  aria-label="Filter causes by district"
                >
                  {SRI_LANKA_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist} className="bg-white dark:bg-[#181920]">
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-[#1C202E] border border-gray-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    statusFilter === 'active'
                      ? 'bg-white dark:bg-[#151822] text-gray-900 dark:text-white shadow-2xs'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Active Needs
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-[#151822] text-gray-900 dark:text-white shadow-2xs'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  All History
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {DONATION_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelectPillarCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeCategory === cat
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-[#1C202E] text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {cat === 'All' ? 'All Causes' : cat}
              </button>
            ))}
          </div>
        </section>

        {/* Causes Directory Grid */}
        {filteredCauses.length === 0 ? (
          <div className="bg-white dark:bg-[#151822] border border-gray-200 dark:border-white/10 rounded-2xl p-10 text-center space-y-3">
            <HeartHandshake className="w-10 h-10 text-teal-600 dark:text-teal-400 mx-auto" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              No matching donation requests found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Try clearing your search or district filter, or submit a verified Sri Lankan hospital or community aid need.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('All');
                  setDistrictFilter('All Sri Lanka');
                  setSearchQuery('');
                  setStatusFilter('active');
                }}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-white/15 text-xs font-bold text-gray-700 dark:text-gray-200 cursor-pointer"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold cursor-pointer"
              >
                Submit Urgent Need
              </button>
            </div>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCauses.map((cause) => {
              const CategoryIcon = getCategoryIcon(cause.category);
              const urgencyInfo = getUrgencyLabel(cause.urgency);
              const UrgencyIcon = urgencyInfo.Icon;
              const safeUrl = getSafeExternalUrl(cause.officialWebsite);
              const isFulfilled = cause.status === 'fulfilled';

              return (
                <article
                  key={cause.id}
                  className="bg-white dark:bg-[#151822] border border-gray-200 dark:border-white/10 rounded-2xl flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Card Top Photo */}
                    <div className="relative h-44 bg-slate-100 dark:bg-[#1C202E] overflow-hidden">
                      {!failedImages[cause.id] ? (
                        <img
                          src={getCategoryImage(cause)}
                          alt={cause.organizationName}
                          referrerPolicy="no-referrer"
                          onError={() => setFailedImages((p) => ({ ...p, [cause.id]: true }))}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-teal-600 dark:text-teal-400">
                          <CategoryIcon className="w-10 h-10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                        <span className="text-xs font-bold text-white/95 truncate">
                          {cause.organizationName}
                        </span>
                        {cause.verifiedOfficial && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-300 shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Official Desk</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      {/* Clean unboxed typographic metadata */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className={`inline-flex items-center gap-1 font-bold ${urgencyInfo.className}`}>
                          <UrgencyIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{isFulfilled ? 'Fulfilled' : urgencyInfo.text}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{cause.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{cause.district}</span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug">
                        {cause.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {cause.description}
                      </p>

                      {/* Needed Items List */}
                      {cause.neededItems.length > 0 && (
                        <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                            Most Wanted Supplies
                          </div>
                          <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-200">
                            {cause.neededItems.slice(0, 3).map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-teal-600 dark:text-teal-400 font-bold">•</span>
                                <span className="line-clamp-1">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 pb-5 pt-3 border-t border-gray-100 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <a
                        href={`tel:${cause.contactPhone.replace(/[^0-9+]/g, '')}`}
                        className="inline-flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-200 hover:text-teal-600 dark:hover:text-teal-400"
                      >
                        <Phone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>{cause.contactPhone}</span>
                      </a>
                      <span className="tabular-nums font-semibold">
                        {cause.pledgeCount || 0} pledges
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCauseId(cause.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                      >
                        <HandHeart className="w-4 h-4 shrink-0" />
                        <span>Donate / Pledge</span>
                      </button>

                      {safeUrl && (
                        <a
                          href={safeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Official Website"
                          className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleShareCause(cause)}
                        title="Share cause"
                        className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>

                    {canManageCause(cause) && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/10 text-xs">
                        <button
                          type="button"
                          onClick={() => handleMarkFulfilled(cause)}
                          className="inline-flex items-center gap-1 font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isFulfilled ? 'Re-open Active' : 'Mark Fulfilled'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCause(cause.id)}
                          className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      {/* Cause Detail & Pledge Modal */}
      {selectedCause && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedCauseId(null)}
        >
          <div
            className="bg-white dark:bg-[#151822] border border-gray-200 dark:border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-2">
                  <span>{selectedCause.organizationName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedCause.district}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">
                  {selectedCause.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCauseId(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-[#1C202E] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {selectedCause.description}
            </p>

            {/* Institution Contact & Direct Verification */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Direct Institution Coordination & Safety Verification</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                {selectedCause.bankDetailsNote}
              </p>
              <div className="text-xs text-gray-700 dark:text-gray-200 space-y-1 pt-1">
                <div>
                  <span className="font-semibold">Address:</span> {selectedCause.address}
                </div>
                {selectedCause.contactPerson && (
                  <div>
                    <span className="font-semibold">Desk / Coordinator:</span> {selectedCause.contactPerson}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={`tel:${selectedCause.contactPhone.replace(/[^0-9+]/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {selectedCause.contactPhone}</span>
                </a>
                {getSafeExternalUrl(selectedCause.officialWebsite) && (
                  <a
                    href={getSafeExternalUrl(selectedCause.officialWebsite)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/15 text-xs font-bold text-gray-800 dark:text-gray-100 hover:border-teal-500"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Official Website</span>
                  </a>
                )}
              </div>
            </div>

            {/* Full Needed Items Checklist */}
            {selectedCause.neededItems.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Urgently Needed Items
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-200">
                  {selectedCause.neededItems.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200/70 dark:border-white/10"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interactive Community Pledge Form */}
            <form onSubmit={handleSubmitPledge} className="pt-4 border-t border-gray-200 dark:border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Log a Direct Support Pledge
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'supplies', label: 'Donate Supplies' },
                    { id: 'funds', label: 'Hospital Fund (LKR)' },
                    { id: 'blood_volunteer', label: 'Blood / Volunteer' },
                  ] as Array<{ id: DonationPledgeType; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPledgeType(opt.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      pledgeType === opt.id
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-slate-50 dark:bg-[#1C202E] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={pledgeDonorName}
                  onChange={(e) => setPledgeDonorName(e.target.value)}
                  placeholder="Your Name / Group *"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-xs sm:text-sm"
                />
                <input
                  type="tel"
                  value={pledgeDonorPhone}
                  onChange={(e) => setPledgeDonorPhone(e.target.value)}
                  placeholder="Phone (Optional)"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-xs sm:text-sm"
                />
                <select
                  value={pledgeDonorDistrict}
                  onChange={(e) => setPledgeDonorDistrict(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-xs sm:text-sm"
                >
                  {SRI_LANKA_DISTRICTS.filter((d) => d !== 'All Sri Lanka').map((d) => (
                    <option key={d} value={d} className="bg-white dark:bg-[#181920]">
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {pledgeType === 'funds' ? (
                <input
                  type="number"
                  min={100}
                  required
                  value={pledgeAmountLkr}
                  onChange={(e) => setPledgeAmountLkr(e.target.value)}
                  placeholder="Estimated Pledge Amount in LKR (e.g. 5000) *"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-xs sm:text-sm"
                />
              ) : (
                <input
                  type="text"
                  required={pledgeType === 'supplies'}
                  value={pledgeItemsSummary}
                  onChange={(e) => setPledgeItemsSummary(e.target.value)}
                  placeholder={
                    pledgeType === 'blood_volunteer'
                      ? 'Blood group or volunteer date (e.g. O- donor available in Colombo)'
                      : 'Supplies you will donate (e.g. 20 boxes sterile gloves, 2 wheelchairs) *'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-xs sm:text-sm"
                />
              )}

              <textarea
                rows={2}
                value={pledgeMessage}
                onChange={(e) => setPledgeMessage(e.target.value)}
                placeholder="Optional note or delivery coordination message..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-xs sm:text-sm"
              />

              <button
                type="submit"
                disabled={isSubmittingPledge}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-bold transition-colors cursor-pointer"
              >
                {isSubmittingPledge ? 'Recording Pledge...' : 'Record Direct Support Pledge'}
              </button>
            </form>

            {/* Recent Pledges List */}
            {selectedCause.pledges && selectedCause.pledges.length > 0 && (
              <div className="pt-4 border-t border-gray-200 dark:border-white/10 space-y-2.5">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  Recent Community Pledges ({selectedCause.pledges.length})
                </h4>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {selectedCause.pledges.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200/70 dark:border-white/10 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2 font-bold text-gray-900 dark:text-white">
                        <span>
                          {p.donorName}
                          {p.donorDistrict ? ` · ${p.donorDistrict}` : ''}
                        </span>
                        <span className="text-teal-600 dark:text-teal-400 tabular-nums">
                          {p.pledgeType === 'funds' && p.amountLkr
                            ? formatLkr(p.amountLkr)
                            : p.pledgeType === 'blood_volunteer'
                            ? 'Blood / Volunteer'
                            : 'Supplies'}
                        </span>
                      </div>
                      {p.itemsSummary && (
                        <div className="text-gray-700 dark:text-gray-200">{p.itemsSummary}</div>
                      )}
                      {p.message && (
                        <div className="text-gray-500 dark:text-gray-400">{p.message}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Urgent Hospital / Charity Need Modal */}
      {isSubmitModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsSubmitModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#151822] border border-gray-200 dark:border-white/10 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                  Submit Urgent Sri Lanka Aid Need
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  List an urgent hospital ward, school, blood drive, or relief supply need.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-[#1C202E] text-gray-600 dark:text-gray-300 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCause} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Hospital / School / Charity Name *
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Base Hospital Tangalle — Pediatric Ward"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Urgent Need Headline *
                </label>
                <input
                  type="text"
                  required
                  value={causeTitle}
                  onChange={(e) => setCauseTitle(e.target.value)}
                  placeholder="e.g. Need 4 Wheelchairs & Pediatric Nebulizer Kits"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Category</label>
                  <select
                    value={causeCategory}
                    onChange={(e) => setCauseCategory(e.target.value as DonationCategory)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-xs sm:text-sm"
                  >
                    {DONATION_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c} className="bg-white dark:bg-[#181920]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">District</label>
                  <select
                    value={causeDistrict}
                    onChange={(e) => setCauseDistrict(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-xs sm:text-sm"
                  >
                    {SRI_LANKA_DISTRICTS.map((d) => (
                      <option key={d} value={d} className="bg-white dark:bg-[#181920]">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Urgency</label>
                  <select
                    value={causeUrgency}
                    onChange={(e) => setCauseUrgency(e.target.value as DonationUrgency)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-xs sm:text-sm"
                  >
                    <option value="critical" className="bg-white dark:bg-[#181920]">Critical Need</option>
                    <option value="urgent" className="bg-white dark:bg-[#181920]">Urgent Need</option>
                    <option value="ongoing" className="bg-white dark:bg-[#181920]">Ongoing Aid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="tel"
                  required
                  value={causePhone}
                  onChange={(e) => setCausePhone(e.target.value)}
                  placeholder="Official Contact Phone *"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm"
                />
                <input
                  type="text"
                  value={causeContactPerson}
                  onChange={(e) => setCauseContactPerson(e.target.value)}
                  placeholder="Coordinator / Matron Desk (Optional)"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={causeAddress}
                  onChange={(e) => setCauseAddress(e.target.value)}
                  placeholder="Drop-off / Hospital Address"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm"
                />
                <input
                  type="url"
                  value={causeWebsite}
                  onChange={(e) => setCauseWebsite(e.target.value)}
                  placeholder="Official Website (https://...)"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Needed Items (comma or line separated)
                </label>
                <textarea
                  rows={2}
                  value={causeNeededItemsText}
                  onChange={(e) => setCauseNeededItemsText(e.target.value)}
                  placeholder="e.g. Wheelchairs, Nebulizer masks, Newborn diapers, Dry food packs"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  How Donors Should Verify & Contribute
                </label>
                <input
                  type="text"
                  value={causeBankNote}
                  onChange={(e) => setCauseBankNote(e.target.value)}
                  placeholder="e.g. Deliver to Ward 04 Matron Office 8AM-4PM or call switchboard first"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm"
                />
              </div>

              <textarea
                rows={3}
                value={causeDescription}
                onChange={(e) => setCauseDescription(e.target.value)}
                placeholder="Explain the situation and who this donation helps..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#1C202E] border border-gray-200 dark:border-white/10 text-sm"
              />

              <button
                type="submit"
                disabled={isCreatingCause}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-bold cursor-pointer"
              >
                {isCreatingCause ? 'Publishing...' : 'Publish Verified Need'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
