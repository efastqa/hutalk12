import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Compass,
  Calendar,
  MapPin,
  Car,
  CheckCircle2,
  X,
  Plus,
  Minus,
  Star,
  Clock,
  ShieldCheck,
  Search,
  Sparkles,
  Copy,
  Check,
  Phone,
  Mail,
  ChevronRight,
  Trees,
  Building2,
  AlertCircle,
  CalendarCheck,
  Lock,
  SlidersHorizontal,
  Percent,
} from 'lucide-react';
import {
  TravelBooking,
  TravelPackageCategory,
  TravelPackageConfig,
  TravelPricingConfig,
  TravelVehicleTier,
  User,
} from '../types';
import { api } from '../services/api';
import {
  DEFAULT_TRAVEL_CONFIG,
  calculateTravelQuote,
  formatUsdFromLkr,
  getEffectiveUsdRate,
  resolveTravelImage,
} from '../utils/travelPricing';

const PICKUP_CITIES = [
  'BIA Airport (CMB)',
  'Colombo City',
  'Negombo',
  'Kandy',
  'Galle Fort',
  'Ella',
  'Sigiriya / Dambulla',
  'Trincomalee',
];

const CATEGORY_TABS: ('All' | TravelPackageCategory)[] = [
  'All',
  'Tour Packages',
  'Safaris & Wildlife',
  'Transfers & Chauffeurs',
  'Boutique Stays',
];

interface SriLankaTravelBookingSectionProps {
  currentUser?: User | null;
  isAdminLoggedIn?: boolean;
  onOpenAdminTravelControl?: () => void;
  onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SriLankaTravelBookingSection: React.FC<SriLankaTravelBookingSectionProps> = ({
  currentUser,
  isAdminLoggedIn = false,
  onOpenAdminTravelControl,
  onToast,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Admin-controlled live config (packages, charges, vehicles, add-ons, discounts/fees)
  const [travelConfig, setTravelConfig] = useState<TravelPricingConfig>(DEFAULT_TRAVEL_CONFIG);

  useEffect(() => {
    let mounted = true;
    api
      .getTravelConfig()
      .then((cfg) => {
        if (mounted && cfg && Array.isArray(cfg.packages)) {
          setTravelConfig(cfg);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<'All' | TravelPackageCategory>('All');
  const [selectedDestination, setSelectedDestination] = useState<string>('All Island');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currency, setCurrency] = useState<'LKR' | 'USD'>('USD');

  const usdRate = useMemo(
    () => getEffectiveUsdRate(travelConfig.usdExchangeRateLkr),
    [travelConfig.usdExchangeRateLkr]
  );

  // Booking Modal State (Submit Only — Bookings Private to Admin)
  const [bookingPkg, setBookingPkg] = useState<TravelPackageConfig | null>(null);
  const [isCustomTrip, setIsCustomTrip] = useState<boolean>(false);
  const [customDestination, setCustomDestination] = useState<string>('Sigiriya, Kandy & Ella');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [days, setDays] = useState<number>(2);
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [pickupLocation, setPickupLocation] = useState<string>('BIA Airport (CMB)');
  const [vehicleTier, setVehicleTier] = useState<TravelVehicleTier>('Luxury KDH Van');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [travelerName, setTravelerName] = useState<string>(currentUser?.fullname || '');
  const [travelerPhone, setTravelerPhone] = useState<string>(currentUser?.phone || '');
  const [travelerEmail, setTravelerEmail] = useState<string>(currentUser?.email || '');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedReceipt, setConfirmedReceipt] = useState<TravelBooking | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      setTravelerName((prev) => prev || currentUser.fullname || '');
      setTravelerPhone((prev) => prev || currentUser.phone || '');
      setTravelerEmail((prev) => prev || currentUser.email || '');
    }
  }, [currentUser]);

  const activePackages = useMemo(
    () => (travelConfig.packages || []).filter((p) => p.isActive !== false),
    [travelConfig.packages]
  );

  const activeVehicleTiers = useMemo(() => {
    const list = (travelConfig.vehicleTiers || []).filter((v) => v.isActive !== false);
    return list.length > 0 ? list : DEFAULT_TRAVEL_CONFIG.vehicleTiers;
  }, [travelConfig.vehicleTiers]);

  const activeAddons = useMemo(
    () => (travelConfig.addons || []).filter((a) => a.isActive !== false),
    [travelConfig.addons]
  );

  const destinationFilters = useMemo(() => {
    const unique = Array.from(new Set(activePackages.map((p) => p.destination).filter(Boolean)));
    return ['All Island', ...unique];
  }, [activePackages]);

  const filteredPackages = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return activePackages.filter((pkg) => {
      const matchesCat = selectedCategory === 'All' || pkg.category === selectedCategory;
      const matchesDest =
        selectedDestination === 'All Island' || pkg.destination === selectedDestination;
      const matchesQuery =
        !q ||
        pkg.title.toLowerCase().includes(q) ||
        pkg.destination.toLowerCase().includes(q) ||
        (pkg.highlights || []).some((h) => h.toLowerCase().includes(q));
      return matchesCat && matchesDest && matchesQuery;
    });
  }, [activePackages, selectedCategory, selectedDestination, searchTerm]);

  const quoteBreakdown = useMemo(() => {
    if (!bookingPkg) {
      return {
        baseAndDaysLkr: 0,
        guestSurchargeLkr: 0,
        vehicleLkr: 0,
        addonsLkr: 0,
        subtotalLkr: 0,
        discountLkr: 0,
        serviceFeeLkr: 0,
        totalLkr: 0,
      };
    }
    return calculateTravelQuote({
      pkg: bookingPkg,
      config: travelConfig,
      days,
      adults,
      children,
      vehicleTier,
      selectedAddonIds: selectedAddons,
    });
  }, [bookingPkg, travelConfig, days, adults, children, vehicleTier, selectedAddons]);

  const openPackageModal = (pkg: TravelPackageConfig, custom = false) => {
    setBookingPkg(pkg);
    setIsCustomTrip(custom);
    setDays(pkg.defaultDays || 2);
    setAdults(2);
    setChildren(0);
    const defaultTierAvailable = activeVehicleTiers.some((v) => v.name === pkg.defaultVehicle);
    setVehicleTier(
      defaultTierAvailable ? pkg.defaultVehicle : activeVehicleTiers[0]?.name || 'Luxury KDH Van'
    );
    setSelectedAddons([]);
    setFormError(null);
    setConfirmedReceipt(null);
    setCopiedRef(false);
  };

  const openCustomTripModal = () => {
    openPackageModal(
      {
        id: 'custom_srilanka_tour',
        title: 'Tailor-Made Sri Lanka Private Tour & Chauffeur',
        shortTitle: 'Custom Sri Lanka Tour',
        category: 'Tour Packages',
        destination: customDestination,
        defaultDays: 4,
        basePriceLkr: travelConfig.customTripBaseLkr || 54000,
        dailyAddonLkr: travelConfig.customTripDailyLkr || 15500,
        extraAdultPct: 16,
        childPct: 8,
        rating: 5.0,
        reviewCount: 74,
        defaultVehicle: 'Luxury KDH Van',
        image: 'beachesCoast',
        badge: 'Custom Route',
        highlights: ['Your Dates & Cities', 'Flexible Stops', 'Private Chauffeur'],
        includes: 'Customized multi-city route across Sri Lanka with dedicated tourist vehicle',
        isActive: true,
      },
      true
    );
  };

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingPkg) return;
    setFormError(null);

    if (!travelerName.trim()) {
      setFormError('Please enter traveler full name.');
      return;
    }
    if (travelerPhone.replace(/[^0-9]/g, '').length < 9) {
      setFormError('Please enter a valid Sri Lankan or WhatsApp phone number.');
      return;
    }
    if (!startDate) {
      setFormError('Please select a travel start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const addonLabels = selectedAddons
        .map((id) => activeAddons.find((a) => a.id === id)?.label)
        .filter((x): x is string => Boolean(x));

      const destinationVal = isCustomTrip
        ? customDestination.trim() || 'Islandwide Sri Lanka'
        : bookingPkg.destination;

      const created = await api.createTravelBooking({
        packageId: bookingPkg.id,
        packageTitle: isCustomTrip
          ? `Custom Sri Lanka Tour: ${destinationVal}`
          : bookingPkg.title,
        category: bookingPkg.category,
        destination: destinationVal,
        startDate,
        days,
        adults,
        children,
        pickupLocation,
        vehicleTier,
        addons: addonLabels,
        travelerName: travelerName.trim(),
        travelerPhone: travelerPhone.trim(),
        travelerEmail: travelerEmail.trim() || undefined,
        specialRequests: specialRequests.trim() || undefined,
        totalLkr: quoteBreakdown.totalLkr,
        preferredCurrency: currency,
        usdExchangeRate: usdRate,
        userId: currentUser?.id,
      });

      setConfirmedReceipt(created);
      if (onToast) {
        onToast(`Travel Request Submitted! Ref: ${created.bookingRef}`, 'success');
      }
    } catch {
      setFormError('Could not submit booking right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReceipt = () => {
    if (!confirmedReceipt) return;
    const rate = confirmedReceipt.usdExchangeRate || usdRate;
    const summary = [
      `HUTA.LK SRI LANKA TRAVEL REQUEST RECEIPT`,
      `Reference: ${confirmedReceipt.bookingRef}`,
      `Package: ${confirmedReceipt.packageTitle}`,
      `Destination: ${confirmedReceipt.destination}`,
      `Check-in Date: ${confirmedReceipt.startDate} (${confirmedReceipt.days} Days)`,
      `Guests: ${confirmedReceipt.adults} Adults${confirmedReceipt.children ? `, ${confirmedReceipt.children} Children` : ''}`,
      `Pickup: ${confirmedReceipt.pickupLocation} | Vehicle: ${confirmedReceipt.vehicleTier}`,
      `Estimated Amount: ${formatUsdFromLkr(confirmedReceipt.totalLkr, rate)} USD / Rs. ${confirmedReceipt.totalLkr.toLocaleString()}`,
      `Status: PENDING ADMIN CONFIRMATION`,
    ].join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary).catch(() => {});
    }
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
    if (onToast) onToast('Receipt copied to clipboard!', 'info');
  };

  const getCategoryIcon = (cat: TravelPackageCategory) => {
    switch (cat) {
      case 'Safaris & Wildlife':
        return <Trees className="w-3 h-3" />;
      case 'Transfers & Chauffeurs':
        return <Car className="w-3 h-3" />;
      case 'Boutique Stays':
        return <Building2 className="w-3 h-3" />;
      default:
        return <Compass className="w-3 h-3" />;
    }
  };

  return (
    <motion.section
      id="travel-booking-system-section"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.06 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 mt-8 sm:mt-10"
    >
      <div className="bg-white dark:bg-[#151822] rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 dark:border-[#252836] overflow-hidden">
        {/* Top Navy Header Strip */}
        <div className="bg-gradient-to-r from-[#0A2540] via-[#102B48] to-[#0B1F36] px-4 sm:px-7 py-4 sm:py-5 text-white border-b border-slate-800/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
                <span>SRI LANKA TRAVEL & TOURISM BOOKING</span>
                {travelConfig.globalDiscountPercent > 0 && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-black">
                    <Percent className="w-2.5 h-2.5" />
                    {travelConfig.globalDiscountPercent}% OFF
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight mt-0.5">
                Book Tours, Safaris, Chauffeurs & Stays
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>Live official rates & private reservation dispatch handled securely by HUTA Admin.</span>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Tourist Currency Switcher (LKR / $ USD) */}
              <div
                className="inline-flex items-center p-0.5 rounded-xl bg-white/10 border border-white/20"
                role="group"
                aria-label="Currency display toggle"
              >
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                    currency === 'USD'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  $ USD
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('LKR')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                    currency === 'LKR'
                      ? 'bg-white text-[#0A2540] shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  LKR Rs.
                </button>
              </div>

              <button
                type="button"
                id="travel-custom-trip-btn"
                onClick={openCustomTripModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#ff431a] text-white text-xs font-extrabold shadow-md shadow-[#FF5A36]/25 transition-all cursor-pointer active:scale-95"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Tailor-Made Trip</span>
              </button>

              {isAdminLoggedIn && onOpenAdminTravelControl && (
                <button
                  type="button"
                  id="travel-admin-control-btn"
                  onClick={onOpenAdminTravelControl}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-extrabold transition-all cursor-pointer active:scale-95"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Admin Control & Charges</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Packages Browse Grid */}
        <div className="p-3.5 sm:p-6">
          {/* Category Tabs + Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-gray-100 dark:border-[#252836]">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 lg:pb-0">
              {CATEGORY_TABS.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      active
                        ? 'bg-[#0A2540] dark:bg-[#FF5A36] text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#272B3C]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Sigiriya, Yala, Ella..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1B1E2A] border border-gray-200 dark:border-[#2A2F42] text-xs font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF5A36]/40"
              />
            </div>
          </div>

          {/* Destination Quick Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mr-1 shrink-0">
              Region:
            </span>
            {destinationFilters.map((dest) => {
              const isSelected = selectedDestination === dest;
              return (
                <button
                  key={dest}
                  type="button"
                  onClick={() => setSelectedDestination(dest)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-orange-50 dark:bg-[#FF5A36]/15 text-[#FF5A36] border-[#FF5A36]/40'
                      : 'bg-white dark:bg-[#1A1D28] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#282D3F] hover:border-gray-300'
                  }`}
                >
                  {dest}
                </button>
              );
            })}
          </div>

          {/* 2-Column Mobile Grid -> 4-Column Desktop Grid */}
          {filteredPackages.length === 0 ? (
            <div className="text-center py-10 px-4 bg-gray-50 dark:bg-[#1A1D28] rounded-2xl border border-dashed border-gray-200 dark:border-[#2A2E3F]">
              <Compass className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-800 dark:text-white">
                No matching Sri Lanka packages found
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Reset filters or request a custom Tailor-Made Sri Lanka Itinerary.
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedDestination('All Island');
                    setSearchTerm('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-[#252A3A] text-xs font-bold text-gray-800 dark:text-white cursor-pointer"
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={openCustomTripModal}
                  className="px-3 py-1.5 rounded-xl bg-[#FF5A36] text-xs font-bold text-white cursor-pointer"
                >
                  Custom Sri Lanka Trip
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {filteredPackages.map((pkg, idx) => {
                const discountedDisplay =
                  travelConfig.globalDiscountPercent > 0
                    ? Math.round(pkg.basePriceLkr * (1 - travelConfig.globalDiscountPercent / 100))
                    : pkg.basePriceLkr;

                return (
                  <motion.div
                    key={pkg.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.25) }}
                    className="group bg-gray-50/70 dark:bg-[#1A1E2B] rounded-2xl border border-gray-200/80 dark:border-[#272B3B] hover:border-[#FF5A36]/50 overflow-hidden flex flex-col justify-between transition-all shadow-xs hover:shadow-md"
                  >
                    <div>
                      {/* Photo Header */}
                      <div className="relative h-28 sm:h-36 overflow-hidden bg-slate-900">
                        <img
                          src={resolveTravelImage(pkg.image)}
                          alt={pkg.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[9px] sm:text-[10px] font-extrabold text-white border border-white/15">
                            {getCategoryIcon(pkg.category)}
                            <span className="truncate max-w-[85px] sm:max-w-none">{pkg.badge}</span>
                          </span>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[9px] sm:text-[10px] font-black text-amber-300">
                            <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                            {Number(pkg.rating || 4.9).toFixed(1)}
                          </span>
                        </div>

                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-bold text-white/95">
                          <span className="inline-flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-[#FF5A36] shrink-0" />
                            <span className="truncate">{pkg.destination}</span>
                          </span>
                          <span className="inline-flex items-center gap-0.5 shrink-0 bg-white/15 backdrop-blur-xs px-1.5 py-0.5 rounded-md text-[9px]">
                            <Clock className="w-2.5 h-2.5" />
                            {pkg.defaultDays}D
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-2.5 sm:p-3.5">
                        <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white leading-snug line-clamp-2 min-h-[32px] sm:min-h-[40px]">
                          <span className="sm:hidden">{pkg.shortTitle}</span>
                          <span className="hidden sm:inline">{pkg.title}</span>
                        </h3>

                        <div className="hidden sm:flex flex-wrap gap-1 mt-2">
                          {(pkg.highlights || []).slice(0, 2).map((h) => (
                            <span
                              key={h}
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-white dark:bg-[#23283A] border border-gray-200/70 dark:border-[#2E344A] text-gray-600 dark:text-gray-300"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Price & Book CTA Footer */}
                    <div className="px-2.5 sm:px-3.5 pb-2.5 sm:pb-3.5 pt-2 border-t border-gray-200/60 dark:border-[#262B3D] flex items-center justify-between gap-1.5">
                      <div>
                        <div className="text-[9px] sm:text-[10px] font-semibold text-gray-500 dark:text-gray-400 leading-none flex items-center gap-1">
                          <span>From</span>
                          {travelConfig.globalDiscountPercent > 0 && (
                            <span className="line-through text-gray-400">
                              {currency === 'USD'
                                ? formatUsdFromLkr(pkg.basePriceLkr, usdRate)
                                : `Rs. ${pkg.basePriceLkr.toLocaleString()}`}
                            </span>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm font-black text-[#0A2540] dark:text-cyan-300 mt-0.5 leading-tight">
                          {currency === 'USD'
                            ? `${formatUsdFromLkr(discountedDisplay, usdRate)} USD`
                            : `Rs. ${discountedDisplay.toLocaleString()}`}
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 dark:text-gray-400">
                          {currency === 'USD'
                            ? `Rs. ${discountedDisplay.toLocaleString()}`
                            : `≈ ${formatUsdFromLkr(discountedDisplay, usdRate)} USD`}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openPackageModal(pkg, false)}
                        className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#FF5A36] hover:bg-[#ff431a] text-white text-[11px] sm:text-xs font-extrabold shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                      >
                        <span>Book</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Booking & Private Submission Receipt Modal */}
      <AnimatePresence>
        {bookingPkg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setBookingPkg(null)}
          >
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#151822] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-[#282C3D]"
            >
              {/* Modal Header Banner */}
              <div className="relative h-32 sm:h-40 bg-slate-900 overflow-hidden">
                <img
                  src={resolveTravelImage(bookingPkg.image)}
                  alt={bookingPkg.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/25" />
                <button
                  type="button"
                  onClick={() => setBookingPkg(null)}
                  aria-label="Close booking modal"
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer border border-white/20"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FF5A36]" />
                    <span>{bookingPkg.category}</span>
                    <span>•</span>
                    <span>
                      {isCustomTrip ? 'Custom Sri Lanka Itinerary' : bookingPkg.destination}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-xl font-black leading-tight mt-0.5">
                    {bookingPkg.title}
                  </h3>
                </div>
              </div>

              {confirmedReceipt ? (
                /* Single-Submission Confirmation Receipt (No Public Booking List) */
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        Booking Submitted to HUTA Travel Admin
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-gray-900 dark:text-white mt-0.5">
                        Ref: {confirmedReceipt.bookingRef}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        Thank you! Our HUTA Travel Administration team has received your booking. Your reservation is kept strictly private and our dispatch coordinator will confirm details via WhatsApp / phone ({confirmedReceipt.travelerPhone}).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#1B1E2B] border border-gray-200 dark:border-[#2A2F42] text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 font-semibold">Route / Stay</span>
                      <div className="font-bold text-gray-900 dark:text-white mt-0.5">
                        {confirmedReceipt.destination}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 font-semibold">Check-In & Days</span>
                      <div className="font-bold text-gray-900 dark:text-white mt-0.5">
                        {confirmedReceipt.startDate} ({confirmedReceipt.days}D)
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 font-semibold">Pickup & Vehicle</span>
                      <div className="font-bold text-gray-900 dark:text-white mt-0.5">
                        {confirmedReceipt.pickupLocation} · {confirmedReceipt.vehicleTier}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 font-semibold">Quoted Total</span>
                      <div className="font-black text-[#FF5A36] mt-0.5">
                        {formatUsdFromLkr(confirmedReceipt.totalLkr, confirmedReceipt.usdExchangeRate || usdRate)} USD
                      </div>
                      <div className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                        Rs. {confirmedReceipt.totalLkr.toLocaleString()} LKR
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1E2232] text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                    <Lock className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span>
                      Privacy Notice: Customer bookings are confidential and visible exclusively to HUTA Travel Administrators.
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyReceipt}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#23283A] text-gray-900 dark:text-white text-xs font-extrabold cursor-pointer"
                    >
                      {copiedRef ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Receipt Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Reference Receipt</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingPkg(null)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF5A36] text-white text-xs font-extrabold cursor-pointer"
                    >
                      <span>Done</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Interactive Booking Customization Form */
                <form onSubmit={handleSubmitBooking} className="p-4 sm:p-6 space-y-4">
                  <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#1A1E2B] px-3 py-2 rounded-xl border border-gray-200/70 dark:border-[#282D3F]">
                    <span className="font-bold text-gray-900 dark:text-white">Includes: </span>
                    {bookingPkg.includes}
                  </p>

                  {isCustomTrip && (
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                        Cities / Route Across Sri Lanka *
                      </label>
                      <input
                        type="text"
                        required
                        value={customDestination}
                        onChange={(e) => setCustomDestination(e.target.value)}
                        placeholder="e.g., Colombo -> Sigiriya -> Kandy -> Ella -> Yala"
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1B1E2A] border border-gray-200 dark:border-[#2C3144] text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF5A36]/40"
                      />
                    </div>
                  )}

                  {/* Trip Dates, Duration & Guests */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        min={todayIso}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-gray-50 dark:bg-[#1B1E2A] border border-gray-200 dark:border-[#2C3144] text-xs font-bold text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Days
                      </label>
                      <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-gray-50 dark:bg-[#1B1E2A] border border-gray-200 dark:border-[#2C3144]">
                        <button
                          type="button"
                          onClick={() => setDays((d) => Math.max(1, d - 1))}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-[#262B3D] text-gray-700 dark:text-white flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-gray-900 dark:text-white">{days}</span>
                        <button
                          type="button"
                          onClick={() => setDays((d) => Math.min(14, d + 1))}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-[#262B3D] text-gray-700 dark:text-white flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Adults
                      </label>
                      <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-gray-50 dark:bg-[#1B1E2A] border border-gray-200 dark:border-[#2C3144]">
                        <button
                          type="button"
                          onClick={() => setAdults((a) => Math.max(1, a - 1))}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-[#262B3D] text-gray-700 dark:text-white flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-gray-900 dark:text-white">{adults}</span>
                        <button
                          type="button"
                          onClick={() => setAdults((a) => Math.min(20, a + 1))}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-[#262B3D] text-gray-700 dark:text-white flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Children
                      </label>
                      <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-gray-50 dark:bg-[#1B1E2A] border border-gray-200 dark:border-[#2C3144]">
                        <button
                          type="button"
                          onClick={() => setChildren((c) => Math.max(0, c - 1))}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-[#262B3D] text-gray-700 dark:text-white flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-gray-900 dark:text-white">{children}</span>
                        <button
                          type="button"
                          onClick={() => setChildren((c) => Math.min(12, c + 1))}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-[#262B3D] text-gray-700 dark:text-white flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pickup Location & Vehicle Tier */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Pickup Hub / City
                      </label>
                      <select
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1B1E2A] border border-gray-200 dark:border-[#2C3144] text-xs font-bold text-gray-900 dark:text-white"
                      >
                        {PICKUP_CITIES.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Vehicle & Transport Class
                      </label>
                      <select
                        value={vehicleTier}
                        onChange={(e) => setVehicleTier(e.target.value as TravelVehicleTier)}
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1B1E2A] border border-gray-200 dark:border-[#2C3144] text-xs font-bold text-gray-900 dark:text-white"
                      >
                        {activeVehicleTiers.map((tier) => (
                          <option key={tier.name} value={tier.name}>
                            {tier.name} ({tier.capacity})
                            {tier.surchargePerDay > 0
                              ? ` +${formatUsdFromLkr(tier.surchargePerDay, usdRate)} (+Rs.${tier.surchargePerDay.toLocaleString()})/d`
                              : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Optional Add-Ons */}
                  {activeAddons.length > 0 && (
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                        Optional Add-ons
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {activeAddons.map((addon) => {
                          const checked = selectedAddons.includes(addon.id);
                          return (
                            <button
                              key={addon.id}
                              type="button"
                              onClick={() => toggleAddon(addon.id)}
                              className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                checked
                                  ? 'bg-orange-50 dark:bg-[#FF5A36]/15 border-[#FF5A36] text-gray-900 dark:text-white'
                                  : 'bg-gray-50 dark:bg-[#1B1E2A] border-gray-200 dark:border-[#2C3144] text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <span className="text-[11px] font-bold leading-tight">{addon.label}</span>
                              <span className="text-[10px] font-black text-[#FF5A36] shrink-0 text-right">
                                {currency === 'USD'
                                  ? `+${formatUsdFromLkr(addon.priceLkr, usdRate)}`
                                  : `+${(addon.priceLkr / 1000).toFixed(1)}k`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Traveler Contact Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Traveler Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={travelerName}
                        onChange={(e) => setTravelerName(e.target.value)}
                        placeholder="e.g., Kasun Perera"
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1B1E2A] border border-gray-200 dark:border-[#2C3144] text-xs font-semibold text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Phone / WhatsApp *
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          value={travelerPhone}
                          onChange={(e) => setTravelerPhone(e.target.value)}
                          placeholder="077 123 4567"
                          className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-gray-50 dark:bg-[#1B1E2A] border border-gray-200 dark:border-[#2C3144] text-xs font-semibold text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Email (Optional)
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          value={travelerEmail}
                          onChange={(e) => setTravelerEmail(e.target.value)}
                          placeholder="name@email.com"
                          className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-gray-50 dark:bg-[#1B1E2A] border border-gray-200 dark:border-[#2C3144] text-xs font-semibold text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Optional notes: flight number, baby seat, halal/vegetarian meal stop..."
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1B1E2A] border border-gray-200 dark:border-[#2C3144] text-xs font-medium text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Transparent Price Breakdown (LKR + $ USD) */}
                  <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#1A1E2B] border border-gray-200/70 dark:border-[#282D3F] text-[11px] space-y-1">
                    <div className="flex justify-between text-gray-600 dark:text-gray-300">
                      <span>Base Tour & Duration ({days}D)</span>
                      <span className="font-bold">
                        Rs. {quoteBreakdown.baseAndDaysLkr.toLocaleString()} ({formatUsdFromLkr(quoteBreakdown.baseAndDaysLkr, usdRate)})
                      </span>
                    </div>
                    {quoteBreakdown.guestSurchargeLkr > 0 && (
                      <div className="flex justify-between text-gray-600 dark:text-gray-300">
                        <span>Extra Travelers ({adults}A, {children}C)</span>
                        <span className="font-bold">
                          +Rs. {quoteBreakdown.guestSurchargeLkr.toLocaleString()} (+{formatUsdFromLkr(quoteBreakdown.guestSurchargeLkr, usdRate)})
                        </span>
                      </div>
                    )}
                    {quoteBreakdown.vehicleLkr > 0 && (
                      <div className="flex justify-between text-gray-600 dark:text-gray-300">
                        <span>Vehicle Upgrade ({vehicleTier})</span>
                        <span className="font-bold">
                          +Rs. {quoteBreakdown.vehicleLkr.toLocaleString()} (+{formatUsdFromLkr(quoteBreakdown.vehicleLkr, usdRate)})
                        </span>
                      </div>
                    )}
                    {quoteBreakdown.addonsLkr > 0 && (
                      <div className="flex justify-between text-gray-600 dark:text-gray-300">
                        <span>Selected Add-ons</span>
                        <span className="font-bold">
                          +Rs. {quoteBreakdown.addonsLkr.toLocaleString()} (+{formatUsdFromLkr(quoteBreakdown.addonsLkr, usdRate)})
                        </span>
                      </div>
                    )}
                    {quoteBreakdown.discountLkr > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>Seasonal Promo ({travelConfig.globalDiscountPercent}% Off)</span>
                        <span>
                          -Rs. {quoteBreakdown.discountLkr.toLocaleString()} (-{formatUsdFromLkr(quoteBreakdown.discountLkr, usdRate)})
                        </span>
                      </div>
                    )}
                    {quoteBreakdown.serviceFeeLkr > 0 && (
                      <div className="flex justify-between text-gray-600 dark:text-gray-300">
                        <span>Service Charge ({travelConfig.serviceFeePercent}%)</span>
                        <span className="font-bold">
                          +Rs. {quoteBreakdown.serviceFeeLkr.toLocaleString()} (+{formatUsdFromLkr(quoteBreakdown.serviceFeeLkr, usdRate)})
                        </span>
                      </div>
                    )}
                  </div>

                  {formError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Sticky Total & Confirm Bar */}
                  <div className="pt-3 border-t border-gray-200 dark:border-[#282D3F] flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Total Estimated ({days}D · {adults + children} Guests)
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-lg sm:text-xl font-black text-[#0A2540] dark:text-cyan-300">
                          {currency === 'USD'
                            ? `${formatUsdFromLkr(quoteBreakdown.totalLkr, usdRate)} USD`
                            : `Rs. ${quoteBreakdown.totalLkr.toLocaleString()}`}
                        </span>
                        <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                          {currency === 'USD'
                            ? `Rs. ${quoteBreakdown.totalLkr.toLocaleString()} LKR`
                            : `≈ ${formatUsdFromLkr(quoteBreakdown.totalLkr, usdRate)} USD`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#FF5A36] hover:bg-[#ff431a] disabled:opacity-60 text-white text-xs sm:text-sm font-black shadow-lg shadow-[#FF5A36]/25 transition-all cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmitting ? 'Submitting...' : 'Submit Booking'}</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};
