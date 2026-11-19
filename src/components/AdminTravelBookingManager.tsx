import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  Calendar,
  Users,
  MapPin,
  Car,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Pencil,
  Search,
  RefreshCw,
  DollarSign,
  SlidersHorizontal,
  ShieldCheck,
  Copy,
  Check,
  Phone,
  Mail,
  Save,
  Eye,
  EyeOff,
  Percent,
  UploadCloud,
  Sparkles,
  UserCheck,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  TravelAddonConfig,
  TravelBooking,
  TravelBookingStatus,
  TravelPackageCategory,
  TravelPackageConfig,
  TravelPricingConfig,
  TravelVehicleTier,
} from '../types';
import { api } from '../services/api';
import {
  DEFAULT_TRAVEL_CONFIG,
  DEFAULT_USD_RATE_LKR,
  TRAVEL_IMAGE_PRESETS,
  formatUsd,
  formatUsdFromLkr,
  getEffectiveUsdRate,
  lkrToUsd,
  resolveTravelImage,
  usdToLkr,
} from '../utils/travelPricing';

interface AdminTravelBookingManagerProps {
  onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const CATEGORIES: TravelPackageCategory[] = [
  'Tour Packages',
  'Safaris & Wildlife',
  'Transfers & Chauffeurs',
  'Boutique Stays',
];

const VEHICLE_NAMES: TravelVehicleTier[] = [
  'Private Sedan',
  'Luxury KDH Van',
  '4x4 Safari Jeep',
  'VIP Coach',
];

export const AdminTravelBookingManager: React.FC<AdminTravelBookingManagerProps> = ({
  onToast,
}) => {
  const [subTab, setSubTab] = useState<'bookings' | 'pricing'>('bookings');

  // Admin Bookings State
  const [bookings, setBookings] = useState<TravelBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | TravelBookingStatus>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Booking & Charges Modal State
  const [editingBooking, setEditingBooking] = useState<TravelBooking | null>(null);
  const [editStatus, setEditStatus] = useState<TravelBookingStatus>('pending');
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editDays, setEditDays] = useState<number>(1);
  const [editPickup, setEditPickup] = useState<string>('');
  const [editVehicle, setEditVehicle] = useState<TravelVehicleTier>('Luxury KDH Van');
  const [editBaseAmount, setEditBaseAmount] = useState<number>(0);
  const [editAdjustment, setEditAdjustment] = useState<number>(0);
  const [editAdjustmentNote, setEditAdjustmentNote] = useState<string>('');
  const [editFinalTotal, setEditFinalTotal] = useState<number>(0);
  const [autoSumAmount, setAutoSumAmount] = useState<boolean>(true);
  const [editDriverName, setEditDriverName] = useState<string>('');
  const [editDriverPhone, setEditDriverPhone] = useState<string>('');
  const [editAdminNotes, setEditAdminNotes] = useState<string>('');
  const [isSavingBooking, setIsSavingBooking] = useState<boolean>(false);

  // Pricing & Packages Config State
  const [config, setConfig] = useState<TravelPricingConfig>(DEFAULT_TRAVEL_CONFIG);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Add/Edit Package Modal State
  const [pkgModalOpen, setPkgModalOpen] = useState<boolean>(false);
  const [editingPkg, setEditingPkg] = useState<TravelPackageConfig | null>(null);
  const [pkgTitle, setPkgTitle] = useState<string>('');
  const [pkgShortTitle, setPkgShortTitle] = useState<string>('');
  const [pkgCategory, setPkgCategory] = useState<TravelPackageCategory>('Tour Packages');
  const [pkgDestination, setPkgDestination] = useState<string>('Sigiriya');
  const [pkgDays, setPkgDays] = useState<number>(2);
  const [pkgBasePrice, setPkgBasePrice] = useState<number>(35000);
  const [pkgDailyAddon, setPkgDailyAddon] = useState<number>(15000);
  const [pkgExtraAdultPct, setPkgExtraAdultPct] = useState<number>(18);
  const [pkgChildPct, setPkgChildPct] = useState<number>(10);
  const [pkgDefaultVehicle, setPkgDefaultVehicle] = useState<TravelVehicleTier>('Luxury KDH Van');
  const [pkgImage, setPkgImage] = useState<string>('heritageSigiriya');
  const [pkgBadge, setPkgBadge] = useState<string>('Featured');
  const [pkgHighlightsText, setPkgHighlightsText] = useState<string>('');
  const [pkgIncludes, setPkgIncludes] = useState<string>('');
  const [pkgIsActive, setPkgIsActive] = useState<boolean>(true);
  const [isUploadingPkgImage, setIsUploadingPkgImage] = useState<boolean>(false);

  // New Addon State
  const [newAddonLabel, setNewAddonLabel] = useState<string>('');
  const [newAddonPrice, setNewAddonPrice] = useState<number>(5000);

  const loadAllData = async () => {
    setIsLoadingBookings(true);
    setIsLoadingConfig(true);
    try {
      const [bks, cfg] = await Promise.all([
        api.getAdminTravelBookings().catch(() => []),
        api.getTravelConfig().catch(() => DEFAULT_TRAVEL_CONFIG),
      ]);
      setBookings(bks);
      setConfig(cfg);
    } finally {
      setIsLoadingBookings(false);
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Recompute total when base/adjustment change in auto mode
  useEffect(() => {
    if (autoSumAmount) {
      setEditFinalTotal(Math.max(0, Number(editBaseAmount || 0) + Number(editAdjustment || 0)));
    }
  }, [editBaseAmount, editAdjustment, autoSumAmount]);

  const metrics = useMemo(() => {
    const totalCount = bookings.length;
    const pendingCount = bookings.filter((b) => b.status === 'pending').length;
    const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
    const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;
    const revenueLkr = bookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((acc, b) => acc + Math.max(0, Number(b.totalLkr) || 0), 0);
    const activePackagesCount = config.packages.filter((p) => p.isActive !== false).length;
    return { totalCount, pendingCount, confirmedCount, cancelledCount, revenueLkr, activePackagesCount };
  }, [bookings, config.packages]);

  const filteredBookings = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchesQ =
        !q ||
        b.bookingRef.toLowerCase().includes(q) ||
        b.travelerName.toLowerCase().includes(q) ||
        b.travelerPhone.toLowerCase().includes(q) ||
        b.destination.toLowerCase().includes(q) ||
        b.packageTitle.toLowerCase().includes(q);
      return matchesStatus && matchesQ;
    });
  }, [bookings, searchTerm, statusFilter]);

  const usdRate = useMemo(
    () => getEffectiveUsdRate(config.usdExchangeRateLkr),
    [config.usdExchangeRateLkr]
  );

  const openEditBookingModal = (b: TravelBooking) => {
    setEditingBooking(b);
    setEditStatus(b.status);
    setEditStartDate(b.startDate);
    setEditDays(b.days || 1);
    setEditPickup(b.pickupLocation || '');
    setEditVehicle(b.vehicleTier || 'Luxury KDH Van');
    const base = b.baseAmountLkr !== undefined ? b.baseAmountLkr : b.totalLkr;
    const adj = b.adminAdjustmentLkr || 0;
    setEditBaseAmount(base);
    setEditAdjustment(adj);
    setEditAdjustmentNote(b.adminAdjustmentNote || '');
    setEditFinalTotal(b.totalLkr);
    setAutoSumAmount(base + adj === b.totalLkr);
    setEditDriverName(b.assignedDriverName || '');
    setEditDriverPhone(b.assignedDriverPhone || '');
    setEditAdminNotes(b.adminNotes || '');
  };

  const handleSaveBookingEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    setIsSavingBooking(true);
    try {
      const updated = await api.adminUpdateTravelBooking(editingBooking, {
        status: editStatus,
        startDate: editStartDate,
        days: editDays,
        pickupLocation: editPickup,
        vehicleTier: editVehicle,
        baseAmountLkr: Math.max(0, Number(editBaseAmount) || 0),
        adminAdjustmentLkr: Number(editAdjustment) || 0,
        adminAdjustmentNote: editAdjustmentNote.trim(),
        totalLkr: Math.max(0, Number(editFinalTotal) || 0),
        assignedDriverName: editDriverName.trim(),
        assignedDriverPhone: editDriverPhone.trim(),
        adminNotes: editAdminNotes.trim(),
      });
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setEditingBooking(null);
      if (onToast) {
        onToast(
          `Updated ${updated.bookingRef} — Final: Rs. ${updated.totalLkr.toLocaleString()} (${formatUsdFromLkr(updated.totalLkr, usdRate)} USD)`,
          'success'
        );
      }
    } catch (err: any) {
      if (onToast) onToast(err?.message || 'Failed to update booking', 'error');
    } finally {
      setIsSavingBooking(false);
    }
  };

  const handleQuickStatus = async (b: TravelBooking, status: TravelBookingStatus) => {
    try {
      const updated = await api.adminUpdateTravelBooking(b, { status });
      setBookings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      if (onToast) onToast(`${b.bookingRef} marked as ${status.toUpperCase()}`, 'success');
    } catch (err: any) {
      if (onToast) onToast(err?.message || 'Failed to update status', 'error');
    }
  };

  const handleDeleteBooking = async (b: TravelBooking) => {
    try {
      await api.adminDeleteTravelBooking(b.id);
      setBookings((prev) => prev.filter((item) => item.id !== b.id));
      if (onToast) onToast(`Booking ${b.bookingRef} deleted.`, 'info');
    } catch (err: any) {
      if (onToast) onToast(err?.message || 'Failed to delete booking', 'error');
    }
  };

  const handleCopyDispatchPass = (b: TravelBooking) => {
    const bookingRate = b.usdExchangeRate || usdRate;
    const lines = [
      `HUTA.LK SRI LANKA TRAVEL CONFIRMATION`,
      `Ref: ${b.bookingRef} (${b.status.toUpperCase()})`,
      `Traveler: ${b.travelerName} | ${b.travelerPhone}`,
      `Package: ${b.packageTitle}`,
      `Destination: ${b.destination} | ${b.startDate} (${b.days}D)`,
      `Pickup: ${b.pickupLocation} | Vehicle: ${b.vehicleTier}`,
      `Guests: ${b.adults} Adults${b.children ? `, ${b.children} Children` : ''}`,
      b.assignedDriverName ? `Driver/Guide: ${b.assignedDriverName} (${b.assignedDriverPhone || 'TBA'})` : '',
      `Final Agreed Total: Rs. ${Number(b.totalLkr || 0).toLocaleString()} (${formatUsdFromLkr(b.totalLkr, bookingRate)} USD)`,
      b.adminAdjustmentNote ? `Charge Note: ${b.adminAdjustmentNote}` : '',
    ].filter(Boolean);

    if (navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
    }
    setCopiedId(b.id);
    setTimeout(() => setCopiedId(null), 2000);
    if (onToast) onToast(`Dispatch details copied for ${b.travelerName}`, 'info');
  };

  // Config Save Helpers
  const persistConfigNow = async (nextConfig: TravelPricingConfig, successMsg?: string) => {
    setIsSavingConfig(true);
    try {
      const saved = await api.saveTravelConfig(nextConfig);
      setConfig(saved);
      if (onToast) onToast(successMsg || 'Live HUTA IN travel prices & packages updated!', 'success');
    } catch (err: any) {
      if (onToast) onToast(err?.message || 'Failed to save travel pricing config', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const openAddPackageModal = () => {
    setEditingPkg(null);
    setPkgTitle('');
    setPkgShortTitle('');
    setPkgCategory('Tour Packages');
    setPkgDestination('Kandy & Ella');
    setPkgDays(2);
    setPkgBasePrice(35000);
    setPkgDailyAddon(14000);
    setPkgExtraAdultPct(18);
    setPkgChildPct(10);
    setPkgDefaultVehicle('Luxury KDH Van');
    setPkgImage('natureHighlands');
    setPkgBadge('New Package');
    setPkgHighlightsText('Scenic Stops, Private Vehicle, Flexible Hours');
    setPkgIncludes('Private A/C vehicle, highway tolls & English-speaking chauffeur-guide');
    setPkgIsActive(true);
    setPkgModalOpen(true);
  };

  const openEditPackageModal = (pkg: TravelPackageConfig) => {
    setEditingPkg(pkg);
    setPkgTitle(pkg.title);
    setPkgShortTitle(pkg.shortTitle);
    setPkgCategory(pkg.category);
    setPkgDestination(pkg.destination);
    setPkgDays(pkg.defaultDays);
    setPkgBasePrice(pkg.basePriceLkr);
    setPkgDailyAddon(pkg.dailyAddonLkr);
    setPkgExtraAdultPct(pkg.extraAdultPct ?? 18);
    setPkgChildPct(pkg.childPct ?? 10);
    setPkgDefaultVehicle(pkg.defaultVehicle);
    setPkgImage(pkg.image);
    setPkgBadge(pkg.badge);
    setPkgHighlightsText((pkg.highlights || []).join(', '));
    setPkgIncludes(pkg.includes);
    setPkgIsActive(pkg.isActive !== false);
    setPkgModalOpen(true);
  };

  const handleUploadPackageImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPkgImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: reader.result, filename: file.name }),
          });
          const data = await res.json();
          if (data?.url) {
            setPkgImage(data.url);
            if (onToast) onToast('Tour image uploaded!', 'success');
          }
        } catch {
          if (onToast) onToast('Image upload failed', 'error');
        } finally {
          setIsUploadingPkgImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingPkgImage(false);
    }
  };

  const handleSavePackageModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgTitle.trim()) return;

    const highlights = pkgHighlightsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);

    const newPkg: TravelPackageConfig = {
      id: editingPkg?.id || `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: pkgTitle.trim(),
      shortTitle: pkgShortTitle.trim() || pkgTitle.trim().slice(0, 32),
      category: pkgCategory,
      destination: pkgDestination.trim() || 'Sri Lanka',
      defaultDays: Math.max(1, Math.min(30, Number(pkgDays) || 1)),
      basePriceLkr: Math.max(0, Number(pkgBasePrice) || 0),
      dailyAddonLkr: Math.max(0, Number(pkgDailyAddon) || 0),
      extraAdultPct: Math.max(0, Math.min(100, Number(pkgExtraAdultPct) || 0)),
      childPct: Math.max(0, Math.min(100, Number(pkgChildPct) || 0)),
      rating: editingPkg?.rating || 4.9,
      reviewCount: editingPkg?.reviewCount || 12,
      defaultVehicle: pkgDefaultVehicle,
      image: pkgImage || 'heritageSigiriya',
      badge: pkgBadge.trim() || 'Curated',
      highlights: highlights.length > 0 ? highlights : ['Private Transfer', 'Sri Lanka Route'],
      includes: pkgIncludes.trim() || 'Private A/C transport & Sri Lanka itinerary support',
      isActive: pkgIsActive,
    };

    const nextPackages = editingPkg
      ? config.packages.map((p) => (p.id === editingPkg.id ? newPkg : p))
      : [newPkg, ...config.packages];

    const nextConfig: TravelPricingConfig = { ...config, packages: nextPackages };
    setPkgModalOpen(false);
    await persistConfigNow(nextConfig, `Saved package "${newPkg.shortTitle}" (Rs. ${newPkg.basePriceLkr.toLocaleString()})`);
  };

  const handleTogglePkgActive = async (pkgId: string) => {
    const nextPackages = config.packages.map((p) =>
      p.id === pkgId ? { ...p, isActive: !(p.isActive !== false) } : p
    );
    await persistConfigNow({ ...config, packages: nextPackages }, 'Package visibility updated');
  };

  const handleDeletePkg = async (pkgId: string) => {
    const nextPackages = config.packages.filter((p) => p.id !== pkgId);
    await persistConfigNow({ ...config, packages: nextPackages }, 'Package deleted from HUTA IN');
  };

  const handleAddAddon = () => {
    if (!newAddonLabel.trim()) return;
    const item: TravelAddonConfig = {
      id: `addon_${Date.now()}`,
      label: newAddonLabel.trim(),
      priceLkr: Math.max(0, Number(newAddonPrice) || 0),
      isActive: true,
    };
    setConfig((prev) => ({ ...prev, addons: [...prev.addons, item] }));
    setNewAddonLabel('');
    setNewAddonPrice(5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Command Header */}
      <div className="bg-gradient-to-r from-[#0B1120] via-[#111C33] to-[#0A2540] rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>HUTA IN Travel & Tourism Command Center</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
              Private Customer Bookings & Live Charges Control
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              All customer reservations are isolated from public view. Review itineraries, edit final booking amounts, assign drivers, and manage tour package prices in real time.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSubTab('bookings')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                subTab === 'bookings'
                  ? 'bg-[#FF5A36] text-white shadow-md shadow-[#FF5A36]/25'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customer Bookings ({metrics.totalCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('pricing')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                subTab === 'pricing'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Tour Packages & Charges ({config.packages.length})</span>
            </button>

            <button
              type="button"
              onClick={loadAllData}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 cursor-pointer"
              title="Sync latest bookings & rates"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingBookings ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase text-slate-400">Total Bookings</div>
            <div className="text-xl font-black mt-0.5">{metrics.totalCount}</div>
          </div>
          <div className="bg-amber-500/10 border border-amber-400/20 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase text-amber-300">Pending Review</div>
            <div className="text-xl font-black text-amber-300 mt-0.5">{metrics.pendingCount}</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase text-emerald-300">Confirmed</div>
            <div className="text-xl font-black text-emerald-300 mt-0.5">{metrics.confirmedCount}</div>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-400/20 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase text-cyan-300">Active Packages</div>
            <div className="text-xl font-black text-cyan-300 mt-0.5">{metrics.activePackagesCount}</div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-[#FF5A36]/15 border border-[#FF5A36]/30 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase text-orange-200">Total Revenue (LKR / $)</div>
            <div className="text-base font-black text-white mt-0.5 leading-tight">
              Rs. {metrics.revenueLkr.toLocaleString()}
            </div>
            <div className="text-[11px] font-extrabold text-cyan-300 mt-0.5">
              {formatUsdFromLkr(metrics.revenueLkr, usdRate)} USD · 1$ = Rs.{usdRate}
            </div>
          </div>
        </div>
      </div>

      {subTab === 'bookings' ? (
        /* TAB 1: ADMIN-ONLY CUSTOMER BOOKINGS & AMOUNT ADJUSTMENT */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize cursor-pointer transition-all ${
                    statusFilter === st
                      ? 'bg-[#0A2540] text-white shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ref, customer name, phone..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#FF5A36]"
              />
            </div>
          </div>

          {isLoadingBookings ? (
            <div className="py-14 text-center text-xs font-bold text-gray-500">
              Loading private customer travel bookings...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-14 px-4 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Compass className="w-9 h-9 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-black text-gray-900">
                No customer travel bookings match your filter
              </p>
              <p className="text-xs text-gray-500 mt-1">
                When customers submit a booking on HUTA IN, it will appear exclusively here for admin confirmation & charge editing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredBookings.map((b) => {
                const statusBadge =
                  b.status === 'confirmed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : b.status === 'cancelled'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200';

                const adj = Number(b.adminAdjustmentLkr || 0);

                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-[#0A2540] text-white">
                            {b.bookingRef}
                          </span>
                          <span className="text-[11px] text-gray-400 font-semibold">
                            {new Date(b.createdAt).toLocaleDateString('en-LK', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${statusBadge}`}
                        >
                          {b.status}
                        </span>
                      </div>

                      {/* Traveler Card */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-black text-gray-900">{b.travelerName}</div>
                          <div className="flex items-center gap-3 text-xs text-gray-600 mt-0.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 font-bold text-[#FF5A36]">
                              <Phone className="w-3 h-3" />
                              {b.travelerPhone}
                            </span>
                            {b.travelerEmail && (
                              <span className="inline-flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {b.travelerEmail}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyDispatchPass(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-[11px] font-bold text-gray-700 hover:bg-gray-100 cursor-pointer shrink-0"
                        >
                          {copiedId === b.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Dispatch</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Trip Details */}
                      <div>
                        <div className="text-xs font-extrabold text-gray-900">{b.packageTitle}</div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 mt-2">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#FF5A36]" />
                            <span>
                              {b.startDate} ({b.days}D)
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            <span>
                              {b.adults} Adults{b.children > 0 ? `, ${b.children} Kids` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{b.pickupLocation}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Car className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate">{b.vehicleTier}</span>
                          </div>
                        </div>

                        {b.addons && b.addons.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {b.addons.map((a) => (
                              <span
                                key={a}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-[#FF5A36] border border-orange-200/70"
                              >
                                + {a}
                              </span>
                            ))}
                          </div>
                        )}

                        {b.specialRequests && (
                          <p className="text-[11px] text-gray-600 bg-amber-50/70 border border-amber-200/60 px-2.5 py-1.5 rounded-lg mt-2">
                            <strong>Customer Note:</strong> {b.specialRequests}
                          </p>
                        )}

                        {b.assignedDriverName && (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg mt-2 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Driver: <strong>{b.assignedDriverName}</strong>{' '}
                              {b.assignedDriverPhone ? `(${b.assignedDriverPhone})` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial Amount & Admin Action Strip */}
                    <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-gray-500 flex-wrap">
                          <span>Final Booking Amount</span>
                          {b.preferredCurrency === 'USD' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-50 text-cyan-700 border border-cyan-200">
                              Tourist $ USD
                            </span>
                          )}
                          {adj !== 0 && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                adj > 0 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {adj > 0
                                ? `+Rs. ${adj.toLocaleString()} (+${formatUsdFromLkr(adj, b.usdExchangeRate || usdRate)})`
                                : `-Rs. ${Math.abs(adj).toLocaleString()} (-${formatUsdFromLkr(Math.abs(adj), b.usdExchangeRate || usdRate)})`}
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                          <span className="text-lg font-black text-[#0A2540]">
                            Rs. {Number(b.totalLkr || 0).toLocaleString()}
                          </span>
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {formatUsdFromLkr(b.totalLkr || 0, b.usdExchangeRate || usdRate)} USD
                          </span>
                        </div>
                        {b.adminAdjustmentNote && (
                          <div className="text-[10px] text-gray-500">{b.adminAdjustmentNote}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => openEditBookingModal(b)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0A2540] hover:bg-[#13355b] text-white text-xs font-extrabold cursor-pointer transition-all"
                        >
                          <DollarSign className="w-3.5 h-3.5 text-cyan-300" />
                          <span>Edit Amount & Charges</span>
                        </button>

                        {b.status !== 'confirmed' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(b, 'confirmed')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                            title="Confirm Booking"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm</span>
                          </button>
                        )}

                        {b.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(b, 'cancelled')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer"
                            title="Cancel Booking"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteBooking(b)}
                          className="p-1.5 rounded-xl bg-gray-100 hover:bg-rose-100 text-gray-600 hover:text-rose-700 cursor-pointer"
                          title="Delete Booking"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: ADMIN PACKAGES, VEHICLE TIERS, ADD-ONS & SERVICE CHARGES CONTROL */
        <div className="space-y-6">
          {isLoadingConfig ? (
            <div className="py-12 text-center text-xs font-bold text-gray-500">
              Loading tour packages & charges configuration...
            </div>
          ) : (
            <>
              {/* 1. Tour Packages Management */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <h4 className="text-base font-black text-gray-900 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#FF5A36]" />
                      <span>Sri Lanka Tour & Experience Packages ({config.packages.length})</span>
                    </h4>
                    <p className="text-xs text-gray-500">
                      Create, edit charges, pause, or delete tours shown on HUTA IN.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddPackageModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#e84a27] text-white text-xs font-extrabold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Tour Package</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {config.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`rounded-2xl border p-3.5 flex flex-col justify-between gap-3 transition-all ${
                        pkg.isActive !== false
                          ? 'bg-white border-gray-200'
                          : 'bg-gray-50 border-gray-200 opacity-70'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={resolveTravelImage(pkg.image)}
                          alt={pkg.shortTitle}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-200"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-black uppercase text-[#FF5A36]">
                              {pkg.category}
                            </span>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                                pkg.isActive !== false
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {pkg.isActive !== false ? 'Live' : 'Hidden'}
                            </span>
                          </div>
                          <h5 className="text-xs font-black text-gray-900 line-clamp-2 mt-0.5">
                            {pkg.title}
                          </h5>
                          <div className="text-[11px] text-gray-500 mt-1">
                            {pkg.destination} • {pkg.defaultDays}D • {pkg.defaultVehicle}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-2 rounded-xl text-[10px]">
                        <div>
                          <div className="text-gray-400 font-bold">Base Charge</div>
                          <div className="font-black text-gray-900">
                            Rs. {pkg.basePriceLkr.toLocaleString()}
                          </div>
                          <div className="text-[10px] font-extrabold text-emerald-700">
                            {formatUsdFromLkr(pkg.basePriceLkr, usdRate)} USD
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 font-bold">Extra Day</div>
                          <div className="font-black text-gray-900">
                            +Rs. {pkg.dailyAddonLkr.toLocaleString()}
                          </div>
                          <div className="text-[10px] font-extrabold text-emerald-700">
                            +{formatUsdFromLkr(pkg.dailyAddonLkr, usdRate)} USD
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 font-bold">Adult/Child</div>
                          <div className="font-black text-gray-900">
                            {pkg.extraAdultPct ?? 18}% / {pkg.childPct ?? 10}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => openEditPackageModal(pkg)}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0A2540] text-white text-xs font-bold cursor-pointer hover:bg-[#143960]"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit Price & Info</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePkgActive(pkg.id)}
                          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                          title={pkg.isActive !== false ? 'Hide package from public' : 'Show package'}
                        >
                          {pkg.isActive !== false ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePkg(pkg.id)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                          title="Delete Package"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Vehicle Tier Rates + Global Service Fee & Discounts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Vehicle Tiers */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3">
                  <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#FF5A36]" />
                    <span>Vehicle & Transport Daily Charges (LKR/Day)</span>
                  </h4>
                  <div className="space-y-2.5">
                    {config.vehicleTiers.map((tier, idx) => (
                      <div
                        key={tier.name}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200/80"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-black text-gray-900">{tier.name}</div>
                          <input
                            type="text"
                            value={tier.capacity}
                            onChange={(e) => {
                              const next = [...config.vehicleTiers];
                              next[idx] = { ...tier, capacity: e.target.value };
                              setConfig({ ...config, vehicleTiers: next });
                            }}
                            className="mt-1 w-full px-2 py-1 rounded-lg bg-white border border-gray-200 text-[11px] font-semibold text-gray-700"
                            placeholder="Capacity"
                          />
                        </div>
                        <div className="w-36">
                          <label className="text-[9px] font-bold uppercase text-gray-500 flex items-center justify-between">
                            <span>Rs. / Day</span>
                            <span className="text-emerald-700 font-black">
                              {formatUsdFromLkr(tier.surchargePerDay, usdRate)}
                            </span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={tier.surchargePerDay}
                            onChange={(e) => {
                              const next = [...config.vehicleTiers];
                              next[idx] = { ...tier, surchargePerDay: Math.max(0, Number(e.target.value) || 0) };
                              setConfig({ ...config, vehicleTiers: next });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-black text-gray-900"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...config.vehicleTiers];
                            next[idx] = { ...tier, isActive: !(tier.isActive !== false) };
                            setConfig({ ...config, vehicleTiers: next });
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black cursor-pointer ${
                            tier.isActive !== false
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {tier.isActive !== false ? 'Active' : 'Off'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Global Charges, Service Fees, USD Rate & Custom Trip Base */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-4">
                  <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-[#FF5A36]" />
                    <span>Exchange Rate ($ USD), Service Fee & Custom Trip Rates</span>
                  </h4>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-black uppercase text-emerald-800">
                        Tourist USD Exchange Rate ($1 USD =)
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold">
                        Used to auto-calculate live LKR ↔ $ USD quotes for tourists & bookings
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-black text-emerald-800">Rs.</span>
                      <input
                        type="number"
                        min={50}
                        max={2000}
                        value={config.usdExchangeRateLkr ?? DEFAULT_USD_RATE_LKR}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            usdExchangeRateLkr: Math.min(2000, Math.max(50, Number(e.target.value) || DEFAULT_USD_RATE_LKR)),
                          })
                        }
                        className="w-24 px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-black text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                        Global Service Charge (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={config.serviceFeePercent}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            serviceFeePercent: Math.min(50, Math.max(0, Number(e.target.value) || 0)),
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-black text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                        Seasonal Promo Discount (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={80}
                        value={config.globalDiscountPercent}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            globalDiscountPercent: Math.min(80, Math.max(0, Number(e.target.value) || 0)),
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-black text-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="flex items-center justify-between text-[10px] font-black uppercase text-gray-500 mb-1">
                        <span>Custom Trip Base (LKR)</span>
                        <span className="text-emerald-700">{formatUsdFromLkr(config.customTripBaseLkr, usdRate)}</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={config.customTripBaseLkr}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customTripBaseLkr: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-black text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="flex items-center justify-between text-[10px] font-black uppercase text-gray-500 mb-1">
                        <span>Custom Daily Rate (LKR)</span>
                        <span className="text-emerald-700">{formatUsdFromLkr(config.customTripDailyLkr, usdRate)}</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={config.customTripDailyLkr}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customTripDailyLkr: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-black text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Optional Trip Add-ons Charges */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-sm font-black text-gray-900">
                    Optional Add-On Services & Charges (LKR & $ USD)
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {config.addons.map((addon, idx) => (
                    <div
                      key={addon.id}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-200"
                    >
                      <input
                        type="text"
                        value={addon.label}
                        onChange={(e) => {
                          const next = [...config.addons];
                          next[idx] = { ...addon, label: e.target.value };
                          setConfig({ ...config, addons: next });
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-900"
                      />
                      <div className="flex flex-col items-end">
                        <input
                          type="number"
                          min={0}
                          value={addon.priceLkr}
                          onChange={(e) => {
                            const next = [...config.addons];
                            next[idx] = { ...addon, priceLkr: Math.max(0, Number(e.target.value) || 0) };
                            setConfig({ ...config, addons: next });
                          }}
                          className="w-24 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-black text-[#FF5A36]"
                        />
                        <span className="text-[10px] font-black text-emerald-700 mt-0.5">
                          {formatUsdFromLkr(addon.priceLkr, usdRate)} USD
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = config.addons.filter((a) => a.id !== addon.id);
                          setConfig({ ...config, addons: next });
                        }}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 cursor-pointer"
                        title="Remove add-on"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new Add-on Row */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                  <input
                    type="text"
                    value={newAddonLabel}
                    onChange={(e) => setNewAddonLabel(e.target.value)}
                    placeholder="New add-on e.g. Whale Boat Upgrade / Safari Park Tickets"
                    className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-900"
                  />
                  <input
                    type="number"
                    min={0}
                    value={newAddonPrice}
                    onChange={(e) => setNewAddonPrice(Math.max(0, Number(e.target.value) || 0))}
                    className="w-28 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-black text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddAddon}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Option</span>
                  </button>
                </div>
              </div>

              {/* Save All Rates Sticky Bar */}
              <div className="flex items-center justify-end gap-3 bg-slate-900 text-white p-4 rounded-2xl">
                <span className="text-xs text-slate-300 mr-auto">
                  Changes apply immediately across HUTA IN Travel & Tourism Booking.
                </span>
                <button
                  type="button"
                  disabled={isSavingConfig}
                  onClick={() => persistConfigNow(config)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#ff431a] disabled:opacity-60 text-white text-xs font-black shadow-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingConfig ? 'Saving Live Rates...' : 'Save All Charges & Packages Live'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* MODAL 1: EDIT CUSTOMER BOOKING AMOUNT & DISPATCH CHARGES */}
      {editingBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setEditingBooking(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-gray-200 p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-[#FF5A36]">
                  Admin Amount & Booking Control
                </div>
                <h4 className="text-lg font-black text-gray-900">
                  {editingBooking.bookingRef} — {editingBooking.travelerName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBookingEdits} className="space-y-4">
              {/* Status & Schedule */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                    Booking Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as TravelBookingStatus)}
                    className="w-full px-2.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-black text-gray-900"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                    Days
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={editDays}
                    onChange={(e) => setEditDays(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-2.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                    Vehicle
                  </label>
                  <select
                    value={editVehicle}
                    onChange={(e) => setEditVehicle(e.target.value as TravelVehicleTier)}
                    className="w-full px-2.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900"
                  >
                    {VEHICLE_NAMES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                  Pickup Hub / Address
                </label>
                <input
                  type="text"
                  value={editPickup}
                  onChange={(e) => setEditPickup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-900"
                />
              </div>

              {/* Financial Charge & Amount Control Panel (Dual LKR & $ USD) */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-[#FF5A36]" />
                      Edit Charges & Booking Amount (LKR &amp; $ USD)
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Edit in either <strong className="text-white">LKR (Rs.)</strong> or{' '}
                      <strong className="text-emerald-300">$ USD</strong> (Rate: $1 = Rs. {usdRate})
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSumAmount}
                      onChange={(e) => setAutoSumAmount(e.target.checked)}
                    />
                    Auto-sum Base + Adj
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Base Charge (LKR + USD) */}
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-300">
                      Base Charge
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
                        Rs.
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={editBaseAmount}
                        onChange={(e) => setEditBaseAmount(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-black text-white"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-black text-emerald-400">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="0.5"
                        value={lkrToUsd(editBaseAmount, usdRate)}
                        onChange={(e) => setEditBaseAmount(Math.max(0, usdToLkr(Number(e.target.value) || 0, usdRate)))}
                        className="w-full pl-7 pr-9 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-xs font-black text-emerald-300"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-400/80">
                        USD
                      </span>
                    </div>
                  </div>

                  {/* Extra / Discount Adjustment (LKR + USD) */}
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-300">
                      Extra / Discount (+/-)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
                        Rs.
                      </span>
                      <input
                        type="number"
                        value={editAdjustment}
                        onChange={(e) => setEditAdjustment(Number(e.target.value) || 0)}
                        className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-black text-cyan-300"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-black text-emerald-400">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.5"
                        value={lkrToUsd(editAdjustment, usdRate)}
                        onChange={(e) => setEditAdjustment(usdToLkr(Number(e.target.value) || 0, usdRate))}
                        className="w-full pl-7 pr-9 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-xs font-black text-emerald-300"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-400/80">
                        USD
                      </span>
                    </div>
                  </div>

                  {/* Final Total Amount (LKR + USD) */}
                  <div className="p-2.5 rounded-xl bg-[#FF5A36]/15 border border-[#FF5A36]/60 space-y-1.5">
                    <label className="block text-[10px] font-bold text-orange-200">
                      Final Total Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-orange-200">
                        Rs.
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={editFinalTotal}
                        onChange={(e) => {
                          setAutoSumAmount(false);
                          setEditFinalTotal(Math.max(0, Number(e.target.value) || 0));
                        }}
                        className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-slate-950 border border-[#FF5A36] text-xs font-black text-white"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-black text-emerald-300">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="0.5"
                        value={lkrToUsd(editFinalTotal, usdRate)}
                        onChange={(e) => {
                          setAutoSumAmount(false);
                          setEditFinalTotal(Math.max(0, usdToLkr(Number(e.target.value) || 0, usdRate)));
                        }}
                        className="w-full pl-7 pr-9 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-400 text-xs font-black text-emerald-200"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-300">
                        USD
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Dual Summary Strip */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs">
                  <span className="text-slate-300 font-semibold">Final Agreed Quote:</span>
                  <div className="flex items-center gap-2 font-black">
                    <span className="text-white">Rs. {Number(editFinalTotal || 0).toLocaleString()}</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-emerald-300">{formatUsdFromLkr(editFinalTotal, usdRate)} USD</span>
                  </div>
                </div>

                {/* Quick Admin Adjustment Presets (LKR + $) */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '+$10 (Rs. 3,000) Highway/Toll', usd: 10, note: 'Highway tolls & extra pickup km' },
                    { label: '+$20 (Rs. 6,000) Peak Jeep', usd: 20, note: 'Peak season jeep/hotel surcharge' },
                    { label: '-$10 (-Rs. 3,000) Loyalty', usd: -10, note: 'Admin courtesy discount' },
                    { label: '-$25 (-Rs. 7,500) Group Rate', usd: -25, note: 'Admin special package rate' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setAutoSumAmount(true);
                        setEditAdjustment(usdToLkr(preset.usd, usdRate));
                        setEditAdjustmentNote(preset.note);
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold text-slate-200 cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={editAdjustmentNote}
                  onChange={(e) => setEditAdjustmentNote(e.target.value)}
                  placeholder="Charge adjustment note (e.g., Added Safari Entry Tickets / Promo Discount)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-white placeholder:text-slate-400"
                />
              </div>

              {/* Driver & Admin Dispatch Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                    Assigned Chauffeur / Guide Name
                  </label>
                  <input
                    type="text"
                    value={editDriverName}
                    onChange={(e) => setEditDriverName(e.target.value)}
                    placeholder="e.g., Ruwan Bandara (SLTDA #418)"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                    Driver Phone Number
                  </label>
                  <input
                    type="text"
                    value={editDriverPhone}
                    onChange={(e) => setEditDriverPhone(e.target.value)}
                    placeholder="077 000 0000"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                  Internal Admin Dispatch Note
                </label>
                <textarea
                  rows={2}
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  placeholder="Internal payment status, advance deposit received, flight schedule..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBooking}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#e84a27] text-white text-xs font-black cursor-pointer shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingBooking ? 'Saving...' : 'Save Amount & Booking'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT TOUR PACKAGE & CHARGES */}
      {pkgModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setPkgModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-gray-200 p-5 sm:p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-[#FF5A36]">
                  Admin Package & Price Editor
                </div>
                <h4 className="text-lg font-black text-gray-900">
                  {editingPkg ? `Edit: ${editingPkg.shortTitle}` : 'Create New Sri Lanka Travel Package'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPkgModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePackageModal} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                    Full Tour Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={pkgTitle}
                    onChange={(e) => setPkgTitle(e.target.value)}
                    placeholder="e.g., Sigiriya Lion Rock & Cultural Heritage Tour"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                    Mobile Short Title
                  </label>
                  <input
                    type="text"
                    value={pkgShortTitle}
                    onChange={(e) => setPkgShortTitle(e.target.value)}
                    placeholder="Sigiriya Tour"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                    Category
                  </label>
                  <select
                    value={pkgCategory}
                    onChange={(e) => setPkgCategory(e.target.value as TravelPackageCategory)}
                    className="w-full px-2.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                    Destination / Region
                  </label>
                  <input
                    type="text"
                    required
                    value={pkgDestination}
                    onChange={(e) => setPkgDestination(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                    Default Days
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={pkgDays}
                    onChange={(e) => setPkgDays(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-2.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-black text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                    Badge Tag
                  </label>
                  <input
                    type="text"
                    value={pkgBadge}
                    onChange={(e) => setPkgBadge(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900"
                  />
                </div>
              </div>

              {/* Pricing Controls (Dual LKR & $ USD Input) */}
              <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/70 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="flex items-center justify-between text-[10px] font-black uppercase text-gray-600 mb-1">
                    <span>Base (LKR) *</span>
                    <span className="text-emerald-700">{formatUsdFromLkr(pkgBasePrice, usdRate)}</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={pkgBasePrice}
                    onChange={(e) => setPkgBasePrice(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-orange-200 text-xs font-black text-gray-900"
                  />
                  <div className="relative mt-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-700">
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={lkrToUsd(pkgBasePrice, usdRate)}
                      onChange={(e) => setPkgBasePrice(Math.max(0, usdToLkr(Number(e.target.value) || 0, usdRate)))}
                      className="w-full pl-5 pr-8 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-black text-emerald-800"
                      title="Edit Base Charge directly in USD ($)"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-700">
                      USD
                    </span>
                  </div>
                </div>
                <div>
                  <label className="flex items-center justify-between text-[10px] font-black uppercase text-gray-600 mb-1">
                    <span>Extra Day (LKR)</span>
                    <span className="text-emerald-700">{formatUsdFromLkr(pkgDailyAddon, usdRate)}</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pkgDailyAddon}
                    onChange={(e) => setPkgDailyAddon(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-orange-200 text-xs font-black text-gray-900"
                  />
                  <div className="relative mt-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-700">
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="1"
                      value={lkrToUsd(pkgDailyAddon, usdRate)}
                      onChange={(e) => setPkgDailyAddon(Math.max(0, usdToLkr(Number(e.target.value) || 0, usdRate)))}
                      className="w-full pl-5 pr-8 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-black text-emerald-800"
                      title="Edit Extra Day Charge directly in USD ($)"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-700">
                      USD
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-600 mb-1">
                    Extra Adult (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={pkgExtraAdultPct}
                    onChange={(e) => setPkgExtraAdultPct(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-orange-200 text-xs font-black text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-600 mb-1">
                    Child Rate (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={pkgChildPct}
                    onChange={(e) => setPkgChildPct(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-2.5 py-2 rounded-xl bg-white border border-orange-200 text-xs font-black text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                    Default Vehicle Tier
                  </label>
                  <select
                    value={pkgDefaultVehicle}
                    onChange={(e) => setPkgDefaultVehicle(e.target.value as TravelVehicleTier)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900"
                  >
                    {VEHICLE_NAMES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                    Highlights (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={pkgHighlightsText}
                    onChange={(e) => setPkgHighlightsText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">
                  Package Inclusions Description
                </label>
                <input
                  type="text"
                  value={pkgIncludes}
                  onChange={(e) => setPkgIncludes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-900"
                />
              </div>

              {/* Photo Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-500">
                    Sri Lanka Banner Photo
                  </label>
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-gray-800 cursor-pointer">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isUploadingPkgImage ? 'Uploading...' : 'Upload Custom'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadPackageImage}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
                  {TRAVEL_IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setPkgImage(preset.key)}
                      title={preset.label}
                      className={`h-11 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        pkgImage === preset.key
                          ? 'border-[#FF5A36] scale-105'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.src} alt={preset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkgIsActive}
                    onChange={(e) => setPkgIsActive(e.target.checked)}
                  />
                  <span>Visible on HUTA IN Public Booking Page</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPkgModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#e84a27] text-white text-xs font-black cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Package</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
