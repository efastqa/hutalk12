import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { EventItem } from '../types';
export type { EventItem };
import { VisitSriLankaSection } from './VisitSriLankaSection';
import { SriLankaPrayerTimesWidget } from './SriLankaPrayerTimesWidget';
import visitSriLankaIcon from '../assets/images/visit_srilanka_icon_3d_1794991123817.jpg';
import hutaInHeroBg from '../assets/images/huta_in_hero_bg_1794993555484.jpg';
import sigiriyaHeroBg from '../assets/images/srilanka_heritage_sigiriya_1794991126174.jpg';
import highlandsHeroBg from '../assets/images/srilanka_nature_highlands_1794991124649.jpg';
import mirissaCoastHeroBg from '../assets/images/srilanka_beaches_coast_1794991125473.jpg';
import galleFortHeroBg from '../assets/images/srilanka_beaches_galle_fort_1794991773072.jpg';
import safariElephantsHeroBg from '../assets/images/srilanka_nature_elephants_safari_1794991773156.jpg';
import {
  Calendar,
  MapPin,
  Ticket,
  Share2,
  Users,
  Search,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  X,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  SlidersHorizontal,
  Check,
  Car,
  Bike,
  Home,
  Smartphone,
  Sofa,
  PackageCheck,
  Briefcase,
  Wrench,
  Truck,
  Wind,
  ShieldAlert,
  HardHat,
  PartyPopper,
  GraduationCap,
  HeartPulse,
  Scale,
  Dog,
  Laptop,
  Plane,
  Layers,
  Plus,
  ShieldCheck,
  Landmark,
  Gem,
} from 'lucide-react';

export interface HutaCategoryItem {
  id: string;
  name: string;
  categoryFilter: string;
  searchKeyword?: string;
  group: 'all' | 'marketplace' | 'services' | 'lifestyle';
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  tag: string;
  popular?: boolean;
}

export const HUTA_ALL_CATEGORIES: HutaCategoryItem[] = [
  {
    id: 'cat_vehicles',
    name: 'Vehicles & Cars',
    categoryFilter: 'Vehicles',
    group: 'marketplace',
    icon: Car,
    iconBg: 'bg-blue-50 border-blue-100 dark:bg-blue-500/15 dark:border-blue-500/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    tag: 'Cars & Vans',
    popular: true,
  },
  {
    id: 'cat_motorcycles',
    name: 'Motorcycles & Bikes',
    categoryFilter: 'Motorcycles',
    group: 'marketplace',
    icon: Bike,
    iconBg: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/15 dark:border-emerald-500/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    tag: 'Bikes & Scooters',
    popular: true,
  },
  {
    id: 'cat_property',
    name: 'Property & Real Estate',
    categoryFilter: 'Property',
    group: 'marketplace',
    icon: Home,
    iconBg: 'bg-amber-50 border-amber-100 dark:bg-amber-500/15 dark:border-amber-500/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    tag: 'Houses & Lands',
    popular: true,
  },
  {
    id: 'cat_electronics',
    name: 'Electronics & Gadgets',
    categoryFilter: 'Electronics',
    group: 'marketplace',
    icon: Smartphone,
    iconBg: 'bg-purple-50 border-purple-100 dark:bg-purple-500/15 dark:border-purple-500/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    tag: 'Phones & Laptops',
    popular: true,
  },
  {
    id: 'cat_home_living',
    name: 'Home & Living',
    categoryFilter: 'Home & Garden',
    group: 'marketplace',
    icon: Sofa,
    iconBg: 'bg-teal-50 border-teal-100 dark:bg-teal-500/15 dark:border-teal-500/30',
    iconColor: 'text-teal-600 dark:text-teal-400',
    tag: 'Furniture & Decor',
  },
  {
    id: 'cat_preloved',
    name: 'Preloved & Fashion',
    categoryFilter: 'Fashion & Preloved',
    group: 'marketplace',
    icon: PackageCheck,
    iconBg: 'bg-rose-50 border-rose-100 dark:bg-rose-500/15 dark:border-rose-500/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
    tag: 'Clothing & Styles',
  },
  {
    id: 'cat_jobs',
    name: 'Jobs & Careers',
    categoryFilter: 'Jobs',
    group: 'marketplace',
    icon: Briefcase,
    iconBg: 'bg-indigo-50 border-indigo-100 dark:bg-indigo-500/15 dark:border-indigo-500/30',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    tag: 'Vacancies',
    popular: true,
  },
  {
    id: 'cat_automotive_services',
    name: 'Automotive Services',
    categoryFilter: 'Services',
    group: 'services',
    icon: Wrench,
    iconBg: 'bg-orange-50 border-orange-100 dark:bg-orange-500/15 dark:border-orange-500/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    tag: 'Mechanics & Tires',
    popular: true,
  },
  {
    id: 'cat_cleaning',
    name: 'Cleaning Services',
    categoryFilter: 'Services',
    group: 'services',
    icon: Sparkles,
    iconBg: 'bg-sky-50 border-sky-100 dark:bg-sky-500/15 dark:border-sky-500/30',
    iconColor: 'text-sky-600 dark:text-sky-400',
    tag: 'Deep & Sofa Clean',
    popular: true,
  },
  {
    id: 'cat_moving',
    name: 'Furniture Moving',
    categoryFilter: 'Services',
    group: 'services',
    icon: Truck,
    iconBg: 'bg-amber-50 border-amber-100 dark:bg-amber-500/15 dark:border-amber-500/30',
    iconColor: 'text-amber-700 dark:text-amber-400',
    tag: 'Lorry & Logistics',
  },
  {
    id: 'cat_ac_repair',
    name: 'AC Repair & Cooling',
    categoryFilter: 'Services',
    group: 'services',
    icon: Wind,
    iconBg: 'bg-cyan-50 border-cyan-100 dark:bg-cyan-500/15 dark:border-cyan-500/30',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    tag: 'Gas & Service',
    popular: true,
  },
  {
    id: 'cat_pest_control',
    name: 'Pest Control',
    categoryFilter: 'Services',
    group: 'services',
    icon: ShieldAlert,
    iconBg: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/15 dark:border-emerald-500/30',
    iconColor: 'text-emerald-700 dark:text-emerald-400',
    tag: 'Termites & Insects',
  },
  {
    id: 'cat_maintenance',
    name: 'Maintenance & Repairs',
    categoryFilter: 'Services',
    group: 'services',
    icon: HardHat,
    iconBg: 'bg-yellow-50 border-yellow-100 dark:bg-yellow-500/15 dark:border-yellow-500/30',
    iconColor: 'text-yellow-700 dark:text-yellow-400',
    tag: 'Plumbing & Wiring',
    popular: true,
  },
  {
    id: 'cat_home_and_land',
    name: 'Home & Land Services',
    categoryFilter: 'Property',
    searchKeyword: 'Land',
    group: 'services',
    icon: Landmark,
    iconBg: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/15 dark:border-emerald-500/30',
    iconColor: 'text-emerald-700 dark:text-emerald-400',
    tag: 'Plans, Surveying & Deeds',
    popular: true,
  },
  {
    id: 'cat_gemstones',
    name: 'Gemstone & Jewelry',
    categoryFilter: 'Services',
    searchKeyword: 'Gem',
    group: 'services',
    icon: Gem,
    iconBg: 'bg-sky-50 border-sky-100 dark:bg-sky-500/15 dark:border-sky-500/30',
    iconColor: 'text-sky-600 dark:text-sky-400',
    tag: 'Ceylon Sapphires & Gems',
    popular: true,
  },
  {
    id: 'cat_events',
    name: 'Events & Photography',
    categoryFilter: 'Services',
    group: 'lifestyle',
    icon: PartyPopper,
    iconBg: 'bg-pink-50 border-pink-100 dark:bg-pink-500/15 dark:border-pink-500/30',
    iconColor: 'text-pink-600 dark:text-pink-400',
    tag: 'DJs, Photos & Decor',
  },
  {
    id: 'cat_education',
    name: 'Education & Tuition',
    categoryFilter: 'Services',
    group: 'lifestyle',
    icon: GraduationCap,
    iconBg: 'bg-violet-50 border-violet-100 dark:bg-violet-500/15 dark:border-violet-500/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
    tag: 'Classes & Coaching',
  },
  {
    id: 'cat_health',
    name: 'Health & Wellness',
    categoryFilter: 'Services',
    group: 'lifestyle',
    icon: HeartPulse,
    iconBg: 'bg-red-50 border-red-100 dark:bg-red-500/15 dark:border-red-500/30',
    iconColor: 'text-red-600 dark:text-red-400',
    tag: 'Fitness & Ayurvedic',
  },
  {
    id: 'cat_legal',
    name: 'Legal & Consultancy',
    categoryFilter: 'Services',
    group: 'lifestyle',
    icon: Scale,
    iconBg: 'bg-stone-50 border-stone-100 dark:bg-stone-500/15 dark:border-stone-500/30',
    iconColor: 'text-stone-700 dark:text-stone-300',
    tag: 'Notaries & Advisory',
  },
  {
    id: 'cat_pets',
    name: 'Pet Services & Care',
    categoryFilter: 'Services',
    group: 'lifestyle',
    icon: Dog,
    iconBg: 'bg-blue-50 border-blue-100 dark:bg-blue-500/15 dark:border-blue-500/30',
    iconColor: 'text-blue-700 dark:text-blue-400',
    tag: 'Vet & Grooming',
  },
  {
    id: 'cat_tech',
    name: 'Tech & IT Solutions',
    categoryFilter: 'Electronics',
    group: 'lifestyle',
    icon: Laptop,
    iconBg: 'bg-slate-50 border-slate-100 dark:bg-slate-500/15 dark:border-slate-500/30',
    iconColor: 'text-slate-700 dark:text-slate-300',
    tag: 'CCTV & PC Repair',
  },
  {
    id: 'cat_travel',
    name: 'Travel & Transport',
    categoryFilter: 'Services',
    group: 'lifestyle',
    icon: Plane,
    iconBg: 'bg-sky-50 border-sky-100 dark:bg-sky-500/15 dark:border-sky-500/30',
    iconColor: 'text-sky-800 dark:text-sky-400',
    tag: 'Tours & Rentals',
  },
];

const EVENTS_DATA: EventItem[] = [];

interface SriLankaHeroSlide {
  id: string;
  image: string;
  region: string;
  title: string;
  tagline: string;
  objectPosition: string;
  scaleFrom: number;
  scaleTo: number;
  xFrom: string;
  xTo: string;
}

const SRI_LANKA_HERO_SLIDES: SriLankaHeroSlide[] = [
  {
    id: 'sl-colombo-dusk',
    image: hutaInHeroBg,
    region: 'Colombo · Western Coast',
    title: 'Colombo Skyline & Indian Ocean Dusk',
    tagline: 'Lotus Tower, Galle Face promenade & city nightlife',
    objectPosition: 'center 45%',
    scaleFrom: 1.03,
    scaleTo: 1.1,
    xFrom: '0%',
    xTo: '-1.5%',
  },
  {
    id: 'sl-sigiriya-heritage',
    image: sigiriyaHeroBg,
    region: 'Sigiriya · Cultural Triangle',
    title: 'Sigiriya Lion Rock Citadel',
    tagline: 'Ancient 5th-century sky fortress & royal water gardens',
    objectPosition: 'center 42%',
    scaleFrom: 1.08,
    scaleTo: 1.02,
    xFrom: '-1.5%',
    xTo: '1%',
  },
  {
    id: 'sl-ella-highlands',
    image: highlandsHeroBg,
    region: 'Ella · Central Highlands',
    title: 'Nine Arch Bridge & Tea Country',
    tagline: 'Misty emerald peaks, viaduct trains & Ceylon tea estates',
    objectPosition: 'center 50%',
    scaleFrom: 1.02,
    scaleTo: 1.09,
    xFrom: '1%',
    xTo: '-1%',
  },
  {
    id: 'sl-mirissa-coast',
    image: mirissaCoastHeroBg,
    region: 'Mirissa · Southern Province',
    title: 'Coconut Tree Hill & Golden Surf',
    tagline: 'Blue whale waters, palm cliffs & tropical bay sunsets',
    objectPosition: 'center 52%',
    scaleFrom: 1.09,
    scaleTo: 1.03,
    xFrom: '0%',
    xTo: '1.5%',
  },
  {
    id: 'sl-galle-fort',
    image: galleFortHeroBg,
    region: 'Galle · UNESCO Sea Ramparts',
    title: 'Galle Dutch Fort & Lighthouse',
    tagline: 'Cobblestone heritage streets overlooking Indian Ocean waves',
    objectPosition: 'center 48%',
    scaleFrom: 1.03,
    scaleTo: 1.1,
    xFrom: '-1%',
    xTo: '1%',
  },
  {
    id: 'sl-yala-safari',
    image: safariElephantsHeroBg,
    region: 'Minneriya & Yala · Wildlife',
    title: 'Wild Elephants & National Parks',
    tagline: 'Lakeside safaris & the island’s untamed natural heritage',
    objectPosition: 'center 50%',
    scaleFrom: 1.08,
    scaleTo: 1.02,
    xFrom: '1.5%',
    xTo: '-1%',
  },
];

const HERO_SLIDE_DURATION_MS = 5500;

interface HutaInPageProps {
  onBackToHome: () => void;
  onOpenPostAd: () => void;
  onSelectCategory?: (category: string, searchKeyword?: string) => void;
  onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  events?: EventItem[];
  isAdminLoggedIn?: boolean;
  onNavigateToAdminEvents?: () => void;
}

export const HutaInPage: React.FC<HutaInPageProps> = ({
  onBackToHome,
  onOpenPostAd,
  onSelectCategory,
  onToast,
  events = [],
  isAdminLoggedIn = false,
  onNavigateToAdminEvents,
}) => {
  const allEvents = events;
  const displaySpotlight = allEvents.filter((e) => e.isSpotlight);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [rsvpIds, setRsvpIds] = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [selectedEventModal, setSelectedEventModal] = useState<EventItem | null>(null);

  // Multi-Changing Sri Lanka Hero Banner State
  const prefersReducedMotion = useReducedMotion();
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  useEffect(() => {
    if (isHeroPaused || prefersReducedMotion) return;
    const interval = window.setInterval(() => {
      setHeroSlideIndex((prev) => (prev + 1) % SRI_LANKA_HERO_SLIDES.length);
    }, HERO_SLIDE_DURATION_MS);
    return () => window.clearInterval(interval);
  }, [isHeroPaused, prefersReducedMotion]);

  const activeHeroSlide = SRI_LANKA_HERO_SLIDES[heroSlideIndex] || SRI_LANKA_HERO_SLIDES[0];

  const handleCycleHero = (delta: number) => {
    setHeroSlideIndex(
      (prev) => (prev + delta + SRI_LANKA_HERO_SLIDES.length) % SRI_LANKA_HERO_SLIDES.length
    );
  };

  // Category Grid State
  const [categoryTab, setCategoryTab] = useState<'all' | 'marketplace' | 'services' | 'lifestyle'>('all');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  const filteredCategories = HUTA_ALL_CATEGORIES.filter((cat) => {
    const matchesTab = categoryTab === 'all' || cat.group === categoryTab;
    const matchesSearch =
      cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
      cat.tag.toLowerCase().includes(categorySearchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleCategoryClick = (cat: HutaCategoryItem) => {
    if (onToast) onToast(`Viewing ${cat.name} on Marketplace`, 'info');
    if (onSelectCategory) {
      onSelectCategory(cat.categoryFilter, cat.searchKeyword);
    } else {
      onBackToHome();
    }
  };

  const categories = ['All', 'Entertainment', 'Exhibitions', 'Food & Culture', 'Sports', 'Tech'];
  const districts = ['All', 'Colombo', 'Galle', 'Kandy', 'Jaffna', 'Negombo'];

  const filteredEvents = allEvents.filter((evt) => {
    const matchesCategory = selectedCategory === 'All' || evt.category === selectedCategory;
    const matchesDistrict = selectedDistrict === 'All' || evt.district === selectedDistrict;
    return matchesCategory && matchesDistrict;
  });

  const handleToggleRSVP = (evt: EventItem) => {
    if (rsvpIds.includes(evt.id)) {
      setRsvpIds(rsvpIds.filter((id) => id !== evt.id));
      if (onToast) onToast(`Pass cancelled for ${evt.title}`, 'info');
    } else {
      setRsvpIds([...rsvpIds, evt.id]);
      if (onToast) onToast(`Pass confirmed for ${evt.title}! See you there.`, 'success');
    }
  };

  const handleToggleBookmark = (evtId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (bookmarkedIds.includes(evtId)) {
      setBookmarkedIds(bookmarkedIds.filter((id) => id !== evtId));
      if (onToast) onToast('Removed from saved events', 'info');
    } else {
      setBookmarkedIds([...bookmarkedIds, evtId]);
      if (onToast) onToast('Saved to your event shortlist!', 'success');
    }
  };

  const handleShare = (evt: EventItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (navigator.share) {
      navigator
        .share({
          title: evt.title,
          text: `Check out ${evt.title} at ${evt.venue} on HUTA IN!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      if (onToast) onToast('Event link copied to clipboard!', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0B0C10] text-[#181920] dark:text-[#F8FAFC] pb-32 overflow-x-hidden transition-colors">
      {/* 1. Multi-Changing Animated Sri Lanka Hero Banner */}
      <div
        className="bg-[#0B0F19] text-white min-h-[185px] sm:min-h-[225px] md:min-h-[255px] flex flex-col justify-between py-4 sm:py-6 px-3 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden transition-colors"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
      >
        {/* Animated Cross-Fading Sri Lanka Photography + Ken Burns Motion */}
        <AnimatePresence initial={false}>
          <motion.img
            key={activeHeroSlide.id}
            src={activeHeroSlide.image}
            alt={`${activeHeroSlide.title} — ${activeHeroSlide.region}`}
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
              scale: { duration: HERO_SLIDE_DURATION_MS / 1000 + 0.6, ease: 'linear' },
              x: { duration: HERO_SLIDE_DURATION_MS / 1000 + 0.6, ease: 'linear' },
            }}
            style={{ objectPosition: activeHeroSlide.objectPosition }}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          />
        </AnimatePresence>

        {/* Measured top & bottom gradient scrims for crisp readability without dimming island photography */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/75 pointer-events-none z-[1]" />
        <div className="hidden sm:block absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-black/45 via-black/15 to-transparent pointer-events-none z-[1]" />

        <div className="max-w-6xl w-full mx-auto relative z-10 flex-1 flex flex-col justify-between gap-4 sm:gap-5">
          {/* Top Navigation Bar Row */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex items-center justify-between gap-2 sm:gap-3"
          >
            <button
              type="button"
              id="huta-in-back-btn"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/25 text-xs sm:text-sm font-semibold text-white shadow-md transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Back to Marketplace</span>
              <span className="sm:hidden">Back</span>
            </button>

            <motion.button
              type="button"
              id="huta-in-visit-sl-jump"
              whileHover={prefersReducedMotion ? undefined : { scale: 1.03, y: -1 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
              onClick={() => {
                const el = document.getElementById('visit-sri-lanka-section');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md border border-cyan-400/60 text-white text-xs font-bold shadow-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Explore Visit Sri Lanka — Colombo City, Nature, Beaches & Heritage"
            >
              <img
                src={visitSriLankaIcon}
                alt="Visit Sri Lanka Icon"
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full object-cover border border-cyan-400/60"
              />
              <span>Visit Sri Lanka</span>
            </motion.button>
          </motion.div>

          {/* Bottom Row: HUTA IN Wordmark + Rotating Sri Lanka Scene Story & Slide Controls */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 pt-1">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-1.5"
            >
              <div className="inline-flex items-center gap-2 sm:gap-2.5 drop-shadow-[0_6px_18px_rgba(0,0,0,0.75)]">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                  HUTA
                </span>
                <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white bg-[#FF5A36] px-2.5 sm:px-3 py-0.5 rounded-xl sm:rounded-2xl tracking-tight leading-none shadow-xl shadow-[#FF5A36]/40">
                  IN
                </span>
              </div>

              <div className="min-h-[34px] sm:min-h-[38px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.button
                    key={activeHeroSlide.id}
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('visit-sri-lanka-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.32, ease: 'easeOut' }}
                    className="text-left group cursor-pointer focus:outline-none"
                    title="Jump to Visit Sri Lanka Guide"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-extrabold text-cyan-300 tracking-wide">
                      <MapPin className="w-3 h-3 text-[#FF5A36] shrink-0" />
                      <span>{activeHeroSlide.region}</span>
                      <span aria-hidden="true" className="text-white/40">·</span>
                      <span className="text-white group-hover:text-[#FF7A59] transition-colors">
                        {activeHeroSlide.title}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-200/90 line-clamp-1 mt-0.5">
                      {activeHeroSlide.tagline}
                    </p>
                  </motion.button>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Right: Sri Lanka Multi-Banner Stepper & Animated Progress Bars */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5 self-stretch sm:self-auto">
              <div
                className="flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/15"
                role="tablist"
                aria-label="Sri Lanka hero banner scenes"
              >
                {SRI_LANKA_HERO_SLIDES.map((slide, idx) => {
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
                        isActive ? 'w-7 sm:w-9 bg-white/30' : 'w-2 bg-white/40 hover:bg-white/70'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          key={`progress-${slide.id}-${heroSlideIndex}`}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{
                            duration: isHeroPaused || prefersReducedMotion ? 0 : HERO_SLIDE_DURATION_MS / 1000,
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

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCycleHero(-1)}
                  aria-label="Previous Sri Lanka banner"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleCycleHero(1)}
                  aria-label="Next Sri Lanka banner"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Compact Live Sri Lanka Prayer Times Strip */}
      <SriLankaPrayerTimesWidget />

      {/* 3. Visit Sri Lanka Modern Tech Island Showcase */}
      <VisitSriLankaSection onSelectCategory={onSelectCategory} onToast={onToast} />

      {/* 3. Our Categories all in GRID view */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 mt-8 sm:mt-10"
      >
        <div className="bg-white dark:bg-[#151822] rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xl border border-gray-100 dark:border-[#252836]">
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-[#252836]">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#FF5A36]/10 text-[#FF5A36] flex items-center justify-center font-black shadow-xs">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Our Categories
                </h2>
                <span className="text-xs font-black bg-orange-100 dark:bg-orange-950/40 text-[#FF5A36] px-2.5 py-0.5 rounded-full">
                  {filteredCategories.length}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                Browse verified marketplace classifieds, home repairs, and professional services across Sri Lanka in one place.
              </p>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Filter Tabs */}
              <div className="flex items-center bg-gray-100/90 dark:bg-[#1E2230] p-1 rounded-2xl text-xs font-bold overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  id="huta-cat-tab-all"
                  onClick={() => setCategoryTab('all')}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    categoryTab === 'all'
                      ? 'bg-white dark:bg-[#2A2E3D] text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  All ({HUTA_ALL_CATEGORIES.length})
                </button>
                <button
                  type="button"
                  id="huta-cat-tab-marketplace"
                  onClick={() => setCategoryTab('marketplace')}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    categoryTab === 'marketplace'
                      ? 'bg-white dark:bg-[#2A2E3D] text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Marketplace
                </button>
                <button
                  type="button"
                  id="huta-cat-tab-services"
                  onClick={() => setCategoryTab('services')}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    categoryTab === 'services'
                      ? 'bg-white dark:bg-[#2A2E3D] text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Home Services
                </button>
                <button
                  type="button"
                  id="huta-cat-tab-lifestyle"
                  onClick={() => setCategoryTab('lifestyle')}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    categoryTab === 'lifestyle'
                      ? 'bg-white dark:bg-[#2A2E3D] text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Professional
                </button>
              </div>

              {/* Category Search */}
              <div className="relative w-full sm:w-52">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  id="huta-cat-search"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder="Filter categories..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-gray-50 dark:bg-[#151822] border border-gray-200 dark:border-[#252836] text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-[#FF5A36] focus:bg-white dark:focus:bg-[#1E2230] outline-none transition-all shadow-xs"
                />
                {categorySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCategorySearchQuery('')}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* GRID View */}
          <AnimatePresence mode="wait">
            <motion.div
              key={categoryTab}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4 mt-4 sm:mt-6"
            >
              {filteredCategories.map((cat, idx) => {
                const IconComp = cat.icon;
                return (
                  <motion.div
                    key={cat.id}
                    id={`huta-cat-card-${cat.id}`}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: Math.min(idx * 0.015, 0.18) }}
                    whileHover={prefersReducedMotion ? undefined : { y: -4, scale: 1.015 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                    onClick={() => handleCategoryClick(cat)}
                    className="group bg-white dark:bg-[#151822] rounded-2xl p-3 sm:p-4 border border-gray-200/80 dark:border-[#252836] hover:border-[#FF5A36]/40 dark:hover:border-[#FF5A36]/40 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Subtle hover top border line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-transparent group-hover:bg-[#FF5A36] transition-colors" />

                    <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border ${cat.iconBg} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                        <IconComp className={`w-5 h-5 sm:w-6 sm:h-6 ${cat.iconColor}`} />
                      </div>
                      {cat.popular && (
                        <span className="text-[9px] sm:text-[10px] font-black uppercase text-[#FF5A36] bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded-md border border-orange-100/60 dark:border-orange-500/30">
                          Popular
                        </span>
                      )}
                    </div>

                    <div className="mt-3 sm:mt-3.5">
                      <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white group-hover:text-[#FF5A36] transition-colors leading-snug line-clamp-1">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5 sm:mt-1 truncate">
                        {cat.tag}
                      </p>
                    </div>

                    <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-gray-100 dark:border-[#252836] flex items-center justify-between text-[11px] font-bold text-gray-400 group-hover:text-[#FF5A36] transition-colors">
                      <span>View ads</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {filteredCategories.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm font-bold text-gray-600">No categories found matching "{categorySearchQuery}"</p>
              <button
                type="button"
                onClick={() => {
                  setCategorySearchQuery('');
                  setCategoryTab('all');
                }}
                className="mt-3 px-4 py-2 text-xs font-extrabold text-[#FF5A36] bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* 4. Upcoming Festivals & Events (Left) + Upcoming Spotlight (Right Side) */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 mt-8 sm:mt-12"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
          {/* LEFT COLUMN: Upcoming Festivals & Events Directory */}
          <div className="lg:col-span-8 min-w-0 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#FF5A36]" />
                  <span>Upcoming Festivals & Events</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Explore scheduled expos, concerts, beach festivals, and weekend gatherings
                </p>
              </div>
              {isAdminLoggedIn && onNavigateToAdminEvents && (
                <button
                  type="button"
                  onClick={onNavigateToAdminEvents}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Admin: Add Event</span>
                </button>
              )}
            </div>

            {/* Filter Controls & View Switcher Bar */}
            <div className="space-y-3">
              {/* District and Category Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Category Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      id={`cat-filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-[#0A2540] text-white shadow-md'
                          : 'bg-white dark:bg-[#151822] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1E2230] border border-gray-200 dark:border-[#252836]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* View Mode Toggle & Results Count */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    Showing <span className="text-gray-900 dark:text-white font-extrabold">{filteredEvents.length}</span> events
                  </span>

                  <div className="flex items-center bg-white dark:bg-[#151822] border border-gray-200 dark:border-[#252836] rounded-xl p-1 shadow-sm">
                    <button
                      type="button"
                      id="view-grid-btn"
                      onClick={() => setViewMode('grid')}
                      title="Cards Grid View"
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-[#0A2540] text-white shadow-xs'
                          : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1E2230]'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      id="view-compact-btn"
                      onClick={() => setViewMode('compact')}
                      title="Compact List View"
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        viewMode === 'compact'
                          ? 'bg-[#0A2540] text-white shadow-xs'
                          : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1E2230]'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* District Quick Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                <span className="text-gray-400 font-bold flex items-center gap-1 shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>Region:</span>
                </span>
                {districts.map((dist) => (
                  <button
                    key={dist}
                    type="button"
                    onClick={() => setSelectedDistrict(dist)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      selectedDistrict === dist
                        ? 'bg-[#FF5A36] text-white shadow-xs'
                        : 'bg-white/80 dark:bg-[#151822] hover:bg-white text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#252836]'
                    }`}
                  >
                    {dist}
                  </button>
                ))}
              </div>
            </div>

            {/* Events Display Grid / List */}
            <div>
              {filteredEvents.length === 0 ? (
                allEvents.length === 0 ? (
                  <div className="bg-white dark:bg-[#151822] rounded-3xl p-10 sm:p-14 text-center border border-dashed border-gray-200 dark:border-[#252836] shadow-sm space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF5A36] flex items-center justify-center mx-auto shadow-xs">
                      <Calendar className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">No Upcoming Festivals & Events</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
                      There are currently no events or festivals scheduled. As soon as community exhibitions, expos, and festivals are announced, they will appear here.
                    </p>
                    {isAdminLoggedIn ? (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={onNavigateToAdminEvents}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add New Event via Admin Portal</span>
                        </button>
                        <p className="text-[11px] text-gray-400 mt-2">
                          Logged in as Admin • Only admins can create and publish events
                        </p>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 dark:bg-[#1E2230] px-3 py-1.5 rounded-full border border-gray-100 dark:border-[#252836]">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Curated & verified by HUTA Marketplace Admin</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#151822] rounded-3xl p-12 text-center border border-gray-200 dark:border-[#252836] shadow-sm space-y-4">
                    <div className="w-16 h-16 rounded-full bg-orange-50 text-[#FF5A36] flex items-center justify-center mx-auto">
                      <Calendar className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">No matching events found</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
                      We couldn't find events matching your selected filters. Try choosing "All" or clear your search term.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('All');
                        setSelectedDistrict('All');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#0A2540] text-white text-xs font-bold hover:bg-[#112f50] transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                )
              ) : (
                <AnimatePresence mode="wait">
                  {viewMode === 'grid' ? (
                    /* High-Visibility Card Grid (2-col balanced inside left 8-col container) */
                    <motion.div
                      key={`grid-${selectedCategory}-${selectedDistrict}`}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.24, ease: 'easeOut' }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
                    >
                      {filteredEvents.map((evt, idx) => {
                        const hasRsvp = rsvpIds.includes(evt.id);
                        const isBookmarked = bookmarkedIds.includes(evt.id);

                        return (
                          <motion.article
                            key={evt.id}
                            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.2) }}
                            whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                            onClick={() => setSelectedEventModal(evt)}
                            className="bg-white dark:bg-[#151822] rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100 dark:border-[#252836] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer group"
                          >
                            <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0A2540]">
                              <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                                <Ticket className="w-16 h-16 text-cyan-300" />
                              </div>
                              {evt.image && (
                                <img
                                  src={evt.image}
                                  alt={evt.title}
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  }}
                                  className="relative z-[1] w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              )}
                              <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/65 via-transparent to-black/20" />

                              {/* Ticket Date Stamp Box */}
                              <div className="absolute top-3 left-3 sm:top-3.5 sm:left-3.5 bg-white dark:bg-[#151822] rounded-xl sm:rounded-2xl shadow-lg border border-gray-100/80 dark:border-[#252836] p-1.5 min-w-[46px] sm:min-w-[50px] text-center z-10">
                                <span className="block text-[10px] font-black text-[#FF5A36] uppercase tracking-wider leading-none">
                                  {evt.month}
                                </span>
                                <span className="block text-sm sm:text-base font-black text-gray-900 dark:text-white leading-none mt-1">
                                  {evt.day}
                                </span>
                              </div>

                              <div className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 flex items-center gap-1.5 z-10">
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleBookmark(evt.id, e)}
                                  title="Bookmark event"
                                  className={`p-2 rounded-xl backdrop-blur-md transition-all cursor-pointer ${
                                    isBookmarked
                                      ? 'bg-rose-500 text-white shadow-md'
                                      : 'bg-black/40 hover:bg-black/60 text-white'
                                  }`}
                                >
                                  <Heart className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                                </button>
                              </div>

                              <div className="absolute bottom-3 left-3 right-3 sm:left-3.5 sm:right-3.5 flex items-center justify-between text-white z-10">
                                <span
                                  className={`text-[11px] font-black px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm ${
                                    evt.isFree
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-[#0A2540]/90 text-white border border-white/20'
                                  }`}
                                >
                                  {evt.price}
                                </span>

                                <span className="text-[11px] font-bold text-gray-200 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">
                                  {evt.district}
                                </span>
                              </div>
                            </div>

                            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5 sm:space-y-4">
                              <div className="space-y-2 sm:space-y-2.5">
                                <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
                                  <span className="text-[#FF5A36] font-bold uppercase tracking-wider text-[11px]">
                                    {evt.category}
                                  </span>
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{evt.time.split('-')[0].trim()}</span>
                                  </div>
                                </div>

                                <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white leading-snug group-hover:text-[#FF5A36] transition-colors line-clamp-2">
                                  {evt.title}
                                </h3>

                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                  {evt.description}
                                </p>

                                <div className="pt-2.5 sm:pt-3 border-t border-gray-100 dark:border-[#252836] flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                                  <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <span className="truncate font-medium">{evt.venue}</span>
                                  </div>
                                  <div className="flex items-center gap-1 font-bold text-gray-700 dark:text-gray-300 shrink-0">
                                    <Users className="w-3.5 h-3.5 text-gray-400" />
                                    <span>{evt.attendees}+</span>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-1 sm:pt-2 flex items-center gap-2">
                                <button
                                  type="button"
                                  id={`rsvp-btn-${evt.id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleRSVP(evt);
                                  }}
                                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    hasRsvp
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50 font-extrabold shadow-sm'
                                      : 'bg-[#FF5A36] hover:bg-[#E04826] active:scale-95 text-white shadow-md shadow-[#FF5A36]/20'
                                  }`}
                                >
                                  {hasRsvp ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                                      <span>RSVP Confirmed</span>
                                    </>
                                  ) : (
                                    <>
                                      <Ticket className="w-4 h-4 stroke-[2.5]" />
                                      <span>Get Passes / RSVP</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleShare(evt, e)}
                                  title="Share event"
                                  className="p-2.5 rounded-xl bg-gray-100 dark:bg-[#1E2230] hover:bg-gray-200 dark:hover:bg-[#2A2F42] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </motion.article>
                        );
                      })}
                    </motion.div>
                  ) : (
                    /* Compact List View */
                    <motion.div
                      key={`compact-${selectedCategory}-${selectedDistrict}`}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.24, ease: 'easeOut' }}
                      className="space-y-3"
                    >
                      {filteredEvents.map((evt, idx) => {
                        const hasRsvp = rsvpIds.includes(evt.id);

                        return (
                          <motion.div
                            key={evt.id}
                            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.16) }}
                            onClick={() => setSelectedEventModal(evt)}
                            className="bg-white dark:bg-[#151822] rounded-2xl p-3 sm:p-4 border border-gray-100 dark:border-[#252836] shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto min-w-0">
                              <div className="bg-[#111217] dark:bg-[#1E2230] text-white rounded-xl p-2 sm:p-2.5 min-w-[48px] sm:min-w-[56px] text-center shrink-0">
                                <span className="block text-[9px] sm:text-[10px] font-black text-[#FF5A36] uppercase leading-none">
                                  {evt.month}
                                </span>
                                <span className="block text-sm sm:text-base font-black leading-none mt-1">
                                  {evt.day}
                                </span>
                              </div>

                              <div className="h-14 w-16 sm:h-16 sm:w-24 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-[#0F172A] to-[#0A2540] relative flex items-center justify-center">
                                <Ticket className="w-5 h-5 text-cyan-300/40" />
                                {evt.image && (
                                  <img
                                    src={evt.image}
                                    alt={evt.title}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                                    }}
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <span className="text-[10px] font-bold text-[#FF5A36] uppercase truncate">
                                    {evt.category}
                                  </span>
                                  <span className="text-gray-300 dark:text-gray-600">•</span>
                                  <span className="text-[11px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 truncate">
                                    {evt.district}
                                  </span>
                                </div>
                                <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white truncate group-hover:text-[#FF5A36] transition-colors">
                                  {evt.title}
                                </h4>
                                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                  {evt.venue} • {evt.time}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-[#252836]">
                              <span
                                className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                                  evt.isFree
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-gray-100 dark:bg-[#1E2230] text-gray-900 dark:text-gray-200'
                                }`}
                              >
                                {evt.price}
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleRSVP(evt);
                                }}
                                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  hasRsvp
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50'
                                    : 'bg-[#FF5A36] hover:bg-[#E04826] text-white shadow-sm'
                                }`}
                              >
                                {hasRsvp ? 'RSVP Confirmed' : 'Get Pass'}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Upcoming Spotlight Panel */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24" aria-label="Upcoming Spotlight">
            <div className="bg-white dark:bg-[#151822] rounded-3xl p-4 sm:p-5 shadow-xl border border-gray-100 dark:border-[#252836]">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-[#252836]">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      displaySpotlight.length > 0 ? 'bg-[#FF5A36] animate-pulse' : 'bg-gray-300'
                    }`}
                  />
                  <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                    Upcoming Spotlight
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-gray-400">
                  {displaySpotlight.length} Featured
                </span>
              </div>

              {isAdminLoggedIn && onNavigateToAdminEvents && (
                <button
                  type="button"
                  onClick={onNavigateToAdminEvents}
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#FF5A36] hover:text-[#E04826] bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 px-3 py-2 rounded-xl transition-colors cursor-pointer border border-orange-200/60 dark:border-orange-500/30"
                  title="Manage and publish spotlight banners in Admin Portal"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Admin: Add Spotlight Banner</span>
                </button>
              )}

              {displaySpotlight.length > 0 ? (
                <div className="mt-4 flex lg:flex-col gap-3 sm:gap-4 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 snap-x snap-mandatory lg:snap-none scrollbar-none">
                  {displaySpotlight.map((evt, idx) => (
                    <motion.div
                      key={evt.id}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{ duration: 0.3, delay: idx * 0.06 }}
                      whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                      onClick={() => setSelectedEventModal(evt)}
                      className="w-[78vw] max-w-[275px] sm:w-[290px] lg:w-full lg:max-w-none snap-start rounded-2xl overflow-hidden relative shadow-sm hover:shadow-md border border-gray-100 dark:border-[#252836] group shrink-0 cursor-pointer bg-gradient-to-br from-[#0F172A] via-[#131C31] to-[#0A2540]"
                    >
                      <div className="h-40 sm:h-44 w-full relative overflow-hidden">
                        {/* Clean ambient icon fallback behind image */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
                          <Sparkles className="w-16 h-16 text-[#FF5A36]" />
                        </div>
                        {evt.image && (
                          <img
                            src={evt.image}
                            alt={evt.title}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                            className="relative z-[1] w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                          />
                        )}
                        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

                        {/* Left Date Badge */}
                        <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1 text-center shadow-md">
                          <span className="block text-[9px] font-black text-[#FF5A36] uppercase leading-none">
                            {evt.month}
                          </span>
                          <span className="block text-sm font-black text-gray-900 leading-tight">
                            {evt.day}
                          </span>
                        </div>

                        {/* Price Tag */}
                        <div className="absolute top-3 right-3 z-10 bg-[#0A2540]/90 backdrop-blur-sm text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-white/15">
                          {evt.price}
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 z-10 text-white">
                          <h3 className="font-extrabold text-sm sm:text-base leading-tight line-clamp-1 group-hover:text-[#FF5A36] transition-colors">
                            {evt.title}
                          </h3>
                          <p className="text-[11px] text-gray-300 flex items-center gap-1 mt-1 truncate">
                            <MapPin className="w-3 h-3 text-[#FF5A36] shrink-0" />
                            <span className="truncate">{evt.venue}</span>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 p-6 rounded-2xl bg-gray-50/70 dark:bg-[#11141D] border border-dashed border-gray-200 dark:border-[#252836] text-center flex flex-col items-center justify-center">
                  <div className="w-11 h-11 rounded-2xl bg-orange-100/70 text-[#FF5A36] flex items-center justify-center mb-2 shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">
                    No Spotlight Banners Yet
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Featured festivals, expos, and premium highlights appear here.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </motion.div>

      {/* 5. Interactive Event Details Modal */}
      <AnimatePresence>
        {selectedEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedEventModal(null)}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm"
          >
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#151822] rounded-t-3xl sm:rounded-3xl overflow-hidden max-w-xl w-full shadow-2xl border border-gray-100 dark:border-[#252836] max-h-[92vh] flex flex-col"
            >
              {/* Modal Cover Image */}
              <div className="relative h-48 sm:h-60 w-full shrink-0 bg-gradient-to-br from-[#0F172A] to-[#0A2540]">
                {selectedEventModal.image && (
                  <img
                    src={selectedEventModal.image}
                    alt={selectedEventModal.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                <button
                  type="button"
                  onClick={() => setSelectedEventModal(null)}
                  aria-label="Close event details"
                  className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 bg-white dark:bg-[#151822] rounded-xl px-2.5 py-1 shadow-md text-center border border-gray-100 dark:border-[#252836]">
                  <span className="block text-[10px] font-black text-[#FF5A36] uppercase leading-none">
                    {selectedEventModal.month}
                  </span>
                  <span className="block text-base font-black text-gray-900 dark:text-white leading-none mt-0.5">
                    {selectedEventModal.day}
                  </span>
                </div>

                <div className="absolute bottom-3.5 left-4 right-4 sm:bottom-4 text-white">
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#FF5A36] uppercase tracking-wider bg-black/50 px-2 py-0.5 rounded">
                    {selectedEventModal.category}
                  </span>
                  <h2 className="text-lg sm:text-2xl font-black mt-1 leading-tight">
                    {selectedEventModal.title}
                  </h2>
                  <p className="text-xs text-gray-300 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
                    <span className="truncate">{selectedEventModal.venue}, {selectedEventModal.location}</span>
                  </p>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
                {/* Event Highlights Grid */}
                <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-[#1B1F2E] p-3.5 sm:p-4 rounded-2xl border border-gray-100 dark:border-[#2A2F42] text-xs">
                  <div>
                    <span className="text-gray-400 block font-medium">Date & Schedule</span>
                    <span className="font-extrabold text-gray-900 dark:text-white block mt-0.5">
                      {selectedEventModal.date}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 font-medium block">
                      {selectedEventModal.time}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Pass Pricing</span>
                    <span className="font-extrabold text-[#FF5A36] text-sm block mt-0.5">
                      {selectedEventModal.price}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 font-medium block">
                      Expected {selectedEventModal.attendees}+ visitors
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-1.5">
                    About This Event
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {selectedEventModal.description}
                  </p>
                </div>

                {/* Organizer Info */}
                <div className="flex items-center justify-between text-xs py-3 border-t border-b border-gray-100 dark:border-[#252836]">
                  <div>
                    <span className="text-gray-400 block">Organized By</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{selectedEventModal.organizer}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 block">District</span>
                    <span className="font-bold text-[#0A2540] dark:text-cyan-300">{selectedEventModal.district}</span>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center gap-2.5 sm:gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleRSVP(selectedEventModal)}
                    className={`flex-1 py-3 px-4 sm:px-5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      rsvpIds.includes(selectedEventModal.id)
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-[#FF5A36] hover:bg-[#E04826] text-white shadow-lg shadow-[#FF5A36]/30'
                    }`}
                  >
                    {rsvpIds.includes(selectedEventModal.id) ? (
                      <>
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                        <span>Pass Confirmed & Saved</span>
                      </>
                    ) : (
                      <>
                        <Ticket className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                        <span>Confirm RSVP / Get Free Pass</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShare(selectedEventModal)}
                    className="p-3 rounded-2xl bg-gray-100 dark:bg-[#1E2230] hover:bg-gray-200 dark:hover:bg-[#2A2F42] text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                    title="Share with friends"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
