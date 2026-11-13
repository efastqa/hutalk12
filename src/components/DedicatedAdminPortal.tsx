import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Smartphone,
  RefreshCw,
  Database,
  Globe,
  KeyRound,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { AdminDashboard } from './AdminDashboard';
import { Listing, EventItem, HeroAd, HeroAdSettings, PromoSlide, PromoSlidesSettings, VideoReelItem, EStore } from '../types';

interface DedicatedAdminPortalProps {
  isAdminLoggedIn: boolean;
  onAdminLoginSuccess: () => void;
  onLogoutAdmin: () => void;
  onBackToMarketplace: () => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;

  // Passed through to AdminDashboard
  listings: Listing[];
  events: EventItem[];
  heroAds: HeroAd[];
  heroSettings: HeroAdSettings;
  videoReels: VideoReelItem[];
  onReelsChange: React.Dispatch<React.SetStateAction<VideoReelItem[]>>;
  stores: EStore[];
  onStoresChange: React.Dispatch<React.SetStateAction<EStore[]>>;
  onUpdateHeroSettings: (settings: HeroAdSettings) => Promise<void>;
  onCreateHeroAd: (ad: Omit<HeroAd, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateHeroAd: (ad: HeroAd) => Promise<void>;
  onToggleHeroAd: (id: string, active: boolean) => Promise<void>;
  onDeleteHeroAd: (id: string) => Promise<void>;
  promoSlides?: PromoSlide[];
  promoSlidesSettings?: PromoSlidesSettings;
  onUpdatePromoSlidesSettings?: (settings: Partial<PromoSlidesSettings>) => Promise<void>;
  onCreatePromoSlide?: (slide: Partial<PromoSlide>) => Promise<void>;
  onUpdatePromoSlide?: (id: string, slide: Partial<PromoSlide>) => Promise<void>;
  onTogglePromoSlide?: (id: string) => Promise<void>;
  onDeletePromoSlide?: (id: string) => Promise<void>;
  onReorderPromoSlides?: (slides: PromoSlide[]) => Promise<void>;
  initialAdminTab?: string;
  onApprove: (id: string, notes?: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
  onVerifyCustomer?: (id: string, data: Partial<Listing>) => Promise<void>;
  onToggleFeature: (id: string) => Promise<void>;
  onToggleVerifyPro: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSelectListing?: (listing: Listing) => void;
  onEditListing?: (listing: Listing) => void;
  onUpdateEvent?: (updated: EventItem) => void;
  onCreateEvent?: (created: EventItem) => void;
  onDeleteEvent?: (id: string) => void;
  onToggleSpotlightEvent?: (id: string) => Promise<void>;
  onClearAllListings?: () => Promise<void>;
}

export const DedicatedAdminPortal: React.FC<DedicatedAdminPortalProps> = ({
  isAdminLoggedIn,
  onAdminLoginSuccess,
  onLogoutAdmin,
  onBackToMarketplace,
  onToast,
  listings,
  events,
  heroAds,
  heroSettings,
  videoReels,
  onReelsChange,
  stores,
  onStoresChange,
  onUpdateHeroSettings,
  onCreateHeroAd,
  onUpdateHeroAd,
  onToggleHeroAd,
  onDeleteHeroAd,
  promoSlides,
  promoSlidesSettings,
  onUpdatePromoSlidesSettings,
  onCreatePromoSlide,
  onUpdatePromoSlide,
  onTogglePromoSlide,
  onDeletePromoSlide,
  onReorderPromoSlides,
  initialAdminTab,
  onApprove,
  onReject,
  onVerifyCustomer,
  onToggleFeature,
  onToggleVerifyPro,
  onDelete,
  onSelectListing,
  onEditListing,
  onUpdateEvent,
  onCreateEvent,
  onDeleteEvent,
  onToggleSpotlightEvent,
  onClearAllListings,
}) => {
  // Authentication State for unauthenticated login screen
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 2FA Challenge State
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [destinationMasked, setDestinationMasked] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [isResending2FA, setIsResending2FA] = useState(false);

  // Subdomain / Host display helper
  const hostDisplay = typeof window !== 'undefined' ? window.location.hostname : 'admin.huta.lk';
  const isDedicatedSubdomain = hostDisplay.startsWith('admin.');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!password.trim()) {
      setErrorMessage('Please enter the administrator master password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.adminLogin(password);
      if (res.twoFactorRequired) {
        setIs2FARequired(true);
        setDestinationMasked(res.destinationMasked || '077****111');
        setDevOtp(res.devOtp || '');
        if (res.devOtp) {
          setTwoFactorCode(res.devOtp);
        }
        onToast(res.message || 'Two-Factor Authentication challenge required.', 'info');
        return;
      }
      onAdminLoginSuccess();
      setPassword('');
      setIs2FARequired(false);
      onToast('Admin login successful! Welcome to Backoffice Console.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid administrator password';
      setErrorMessage(msg);
      onToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!twoFactorCode.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setIsVerifying2FA(true);
    try {
      const res = await api.adminLogin(password, twoFactorCode.trim());
      if (res.twoFactorRequired) {
        throw new Error('Verification failed. Invalid code.');
      }
      onAdminLoginSuccess();
      setPassword('');
      setIs2FARequired(false);
      setTwoFactorCode('');
      onToast('Two-Factor Authentication verified! Access granted.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid 2FA verification code';
      setErrorMessage(msg);
      onToast(msg, 'error');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleResend2FA = async () => {
    setIsResending2FA(true);
    try {
      const res = await api.resendTwoFactorCode('admin_session', 'admin');
      if (res.devOtp) {
        setDevOtp(res.devOtp);
        setTwoFactorCode(res.devOtp);
      }
      onToast(res.message || 'Verification code resent successfully.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend code';
      onToast(msg, 'error');
    } finally {
      setIsResending2FA(false);
    }
  };

  // -------------------------------------------------------------
  // VIEW 1: UNAUTHENTICATED FULL-PAGE DEDICATED ADMIN LOGIN (MODEL A)
  // -------------------------------------------------------------
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-[#080B11] text-slate-100 flex flex-col justify-between relative selection:bg-[#FF5A36] selection:text-white">
        {/* Subtle geometric glow background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#FF5A36]/15 via-indigo-950/20 to-transparent blur-3xl opacity-70" />
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
        </div>

        {/* Top Dedicated Portal Header */}
        <header className="relative z-10 w-full border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-md px-4 sm:px-8 py-3.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white flex items-center">
                  HUTA<span className="text-[#FF5A36]">.LK</span>
                </span>
                <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                  Operations Portal
                </span>
              </div>
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-700/80 pl-3">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>Route: {isDedicatedSubdomain ? hostDisplay : `${hostDisplay}/admin`}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>TLS 256-Bit Encrypted</span>
              </div>

              <button
                type="button"
                onClick={onBackToMarketplace}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Public Marketplace</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Center Authentication Card */}
        <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
          <div className="w-full max-w-md bg-[#0F1420] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            {/* Top decorative accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF5A36] to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25 border-2 border-[#0F1420]">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>

            <div className="text-center pt-5 pb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
                <span>Model A • Dedicated Route Isolation</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Staff & Backoffice Sign In
              </h1>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Restricted operations portal for HUTA.LK administrators. Enter your credentials to manage classifieds, e-stores, reels, and analytics.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!is2FARequired ? (
              /* Password Form */
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Master Administrator Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter administrator password..."
                      autoFocus
                      required
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#080B11] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF5A36] transition-colors"
                    />
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authenticate & Launch Workspace</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* 2FA Challenge Form */
              <form onSubmit={handle2FASubmit} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <Smartphone className="w-4 h-4 text-indigo-400" />
                    <span>Two-Factor Authentication Active</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    A 6-digit security code was dispatched via SMS to <strong>{destinationMasked}</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Enter 6-Digit SMS Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="123456"
                    autoFocus
                    required
                    className="w-full px-4 py-3 text-center tracking-[0.4em] font-mono text-xl font-bold rounded-xl bg-[#080B11] border border-slate-700 text-white focus:outline-none focus:border-[#FF5A36] transition-colors"
                  />
                </div>

                {devOtp && (
                  <button
                    type="button"
                    onClick={() => setTwoFactorCode(devOtp)}
                    className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Fill Demo Code: {devOtp}</span>
                  </button>
                )}

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    disabled={isResending2FA}
                    onClick={handleResend2FA}
                    className="text-[#FF5A36] hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isResending2FA ? 'animate-spin' : ''}`} />
                    <span>Resend Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIs2FARequired(false);
                      setTwoFactorCode('');
                    }}
                    className="text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Back to Password
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying2FA}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isVerifying2FA ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Access Backoffice</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Back to Marketplace Link */}
            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={onBackToMarketplace}
                className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Public Marketplace (huta.lk)</span>
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 w-full border-t border-slate-800/80 bg-[#0B0F19]/60 px-4 py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              &copy; {new Date().getFullYear()} HUTA.LK Operations & Backoffice Platform • Model A
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <a href="mailto:support@huta.lk" className="hover:text-emerald-400 transition-colors">
                Ops Support: support@huta.lk
              </a>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>PDPA Compliant (Act No. 9 of 2022)</span>
              </span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: AUTHENTICATED DEDICATED ADMIN BACKOFFICE WORKSPACE (MODEL A)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-100 flex flex-col">
      {/* Dedicated Top Backoffice Management Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#0D111C]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left Brand & Route Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight text-white flex items-center">
                HUTA<span className="text-[#FF5A36]">.LK</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FF5A36]/15 border border-[#FF5A36]/40 text-[#FF5A36]">
                Backoffice Portal (Model A)
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 border-l border-slate-800 pl-3">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-full text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Cloud Firestore Sync</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-[11px] text-slate-400">
                {isDedicatedSubdomain ? hostDisplay : `${hostDisplay}/admin`}
              </span>
            </div>
          </div>

          {/* Right Navigation & Logout Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBackToMarketplace}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
              title="Open Public Customer Marketplace"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span className="hidden sm:inline">Visit Marketplace</span>
              <span className="sm:hidden">Store ↗</span>
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-slate-300">Admin Session Active</span>
            </div>

            <button
              type="button"
              onClick={onLogoutAdmin}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
              title="Terminate Admin Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Backoffice Workspace */}
      <main className="flex-1 py-4 sm:py-6">
        <AdminDashboard
          listings={listings}
          events={events}
          heroAds={heroAds}
          heroSettings={heroSettings}
          videoReels={videoReels}
          onReelsChange={onReelsChange}
          stores={stores}
          onStoresChange={onStoresChange}
          onUpdateHeroSettings={onUpdateHeroSettings}
          onCreateHeroAd={onCreateHeroAd}
          onUpdateHeroAd={onUpdateHeroAd}
          onToggleHeroAd={onToggleHeroAd}
          onDeleteHeroAd={onDeleteHeroAd}
          promoSlides={promoSlides}
          promoSlidesSettings={promoSlidesSettings}
          onUpdatePromoSlidesSettings={onUpdatePromoSlidesSettings}
          onCreatePromoSlide={onCreatePromoSlide}
          onUpdatePromoSlide={onUpdatePromoSlide}
          onTogglePromoSlide={onTogglePromoSlide}
          onDeletePromoSlide={onDeletePromoSlide}
          onReorderPromoSlides={onReorderPromoSlides}
          initialFilterTab={initialAdminTab}
          onApprove={onApprove}
          onReject={onReject}
          onVerifyCustomer={onVerifyCustomer}
          onToggleFeature={onToggleFeature}
          onToggleVerifyPro={onToggleVerifyPro}
          onDelete={onDelete}
          onBackToMarketplace={onBackToMarketplace}
          onLogoutAdmin={onLogoutAdmin}
          onSelectListing={onSelectListing}
          onEditListing={onEditListing}
          onToast={onToast}
          onUpdateEvent={onUpdateEvent}
          onCreateEvent={onCreateEvent}
          onDeleteEvent={onDeleteEvent}
          onToggleSpotlightEvent={onToggleSpotlightEvent}
          onClearAllListings={onClearAllListings}
        />
      </main>

      {/* Admin Dedicated Backoffice Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-[#0B0F19] px-4 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            HUTA.LK Enterprise Backoffice • Model A Dedicated Portal Configuration
          </span>
          <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Encrypted Admin Firestore Database: ai-studio-hutamarketplace</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
