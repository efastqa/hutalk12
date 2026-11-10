import React from 'react';
import { ShieldCheck, MapPin, PhoneCall, HelpCircle, Heart, Lock, Smartphone } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { PolicyTab } from './LegalPoliciesModal';

interface FooterProps {
  onSelectCategory: (cat: string) => void;
  onSelectLocation: (loc: string) => void;
  onOpenPostAd: () => void;
  onOpenAdminLogin: () => void;
  onOpenAppStore?: () => void;
  onSelectTab?: (tab: 'marketplace' | 'estore' | 'huta_in' | 'categories') => void;
  currentTab?: string;
  onOpenPolicy?: (tab: PolicyTab) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onSelectLocation,
  onOpenPostAd,
  onOpenAdminLogin,
  onOpenAppStore,
  onSelectTab,
  currentTab,
  onOpenPolicy,
}) => {
  const isEStore = currentTab === 'estore';

  return (
    <footer className="bg-white dark:bg-[#111217] text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-[#2D2F39]/60 mt-10 sm:mt-12 pt-8 sm:pt-9 pb-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${
            isEStore ? 'lg:grid-cols-3' : 'lg:grid-cols-5'
          } gap-6 pb-6 sm:pb-7 border-b border-gray-200 dark:border-[#2D2F39]/50`}
        >
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#181920] border border-gray-200 dark:border-[#2D2F39] flex items-center justify-center p-1.5 shadow-md">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                  <rect width="100" height="100" rx="20" className="fill-gray-900 dark:fill-[#181920]" />
                  <rect x="20" y="16" width="18" height="68" rx="9" fill="#FF5A36" />
                  <rect x="62" y="16" width="18" height="68" rx="9" fill="#FF5A36" />
                  <path d="M 24 64 L 76 28 L 76 42 L 24 78 Z" fill="#FFFFFF" />
                  <polygon points="66,16 88,26 74,28" fill="#FFFFFF" />
                </svg>
              </div>
              <div className="flex flex-col leading-none">
                <div className="flex items-baseline">
                  <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">HUTA</span>
                  <span className="text-xl font-black text-[#FF5A36] tracking-tight ml-0.5">.lk</span>
                </div>
                <span className="text-[10px] font-extrabold text-gray-500 dark:text-gray-400 tracking-widest uppercase mt-0.5">
                  SRI LANKA
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 max-w-sm leading-relaxed">
              HUTA.LK is Sri Lanka's trusted trading platform. Buy, sell, and find anything from vehicles and smartphones to houses and local services across all 25 districts.
            </p>

            <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400 pt-1">
              <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-md border border-gray-200 dark:border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF5A36]" />
                Verified Listings
              </span>
              <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-md border border-gray-200 dark:border-white/10">
                <MapPin className="w-3.5 h-3.5 text-[#FF5A36]" />
                All 25 Districts
              </span>
            </div>

            {onOpenAppStore && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenAppStore}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-[#FF5A36] hover:text-white dark:bg-white/10 dark:hover:bg-[#FF5A36] text-gray-800 dark:text-white text-xs font-bold transition-all border border-gray-200 dark:border-white/10 cursor-pointer group"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#FF5A36] group-hover:text-white transition-colors" />
                  <span>Get App (Play Store & App Store)</span>
                </button>
              </div>
            )}
          </div>

          {/* Popular Categories (Hidden on E-Store page) */}
          {!isEStore && (
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2.5">
                Top Categories
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                {['Vehicles', 'Electronics', 'Property', 'Motorcycles', 'Home & Garden'].map((cat) => (
                  <li key={cat}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCategory(cat);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      className="hover:text-[#FF5A36] transition-colors cursor-pointer"
                    >
                      {cat} in Sri Lanka
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Top Districts (Hidden on E-Store page) */}
          {!isEStore && (
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2.5">
                Key Locations
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                {['Colombo', 'Gampaha', 'Kandy', 'Galle', 'Kurunegala'].map((loc) => (
                  <li key={loc}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectLocation(loc);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      className="hover:text-[#FF5A36] transition-colors cursor-pointer"
                    >
                      Ads in {loc}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety & Support */}
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2.5">
              Safety & Support
            </h4>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li>
                <a
                  href="https://wa.me/94775260765"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-bold transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Support: +94 77 526 0765</span>
                </a>
              </li>
              <li>
                <a
                  href="?tab=estore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-500 transition-colors font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 cursor-pointer no-underline"
                >
                  <span>🛍️ Sri Lanka E-Stores Directory ↗</span>
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenPostAd}
                  className="hover:text-[#FF5A36] transition-colors font-bold text-[#FF5A36] dark:text-white flex items-center gap-1 cursor-pointer"
                >
                  <span>Post Free Advertisement</span>
                </button>
              </li>
              <li>
                <span className="text-[11px] text-amber-600 dark:text-amber-400/90 block leading-snug">
                  Always inspect goods in person in a safe, public place before transferring funds.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* 'Are you Following Us ?' Social Channels Section */}
        <div className="py-6 sm:py-7 border-t border-gray-200/80 dark:border-[#2D2F39]/60 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF5A36]/10 text-[#FF5A36] text-[11px] font-bold tracking-wide uppercase mb-1.5">
              <span>Connect & Follow</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Are you Following Us ?
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-md">
              Follow our official channels for the latest classifieds, verified e-store deals & daily flash drops across Sri Lanka.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Facebook */}
            <a
              href="https://facebook.com/huta.lk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow HUTA.LK on Facebook"
              className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2F39] bg-white dark:bg-[#1A1C23] hover:border-[#1877F2] hover:bg-[#1877F2]/5 dark:hover:border-[#1877F2] text-gray-800 dark:text-gray-200 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <div className="w-8 h-8 rounded-lg bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div className="text-left leading-tight min-w-0">
                <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#1877F2] transition-colors">Facebook</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">@huta.lk</div>
              </div>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/94775260765?text=Hello%20HUTA.LK%20Team%2C%20I%20am%20following%20you%20on%20WhatsApp%21"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Connect with HUTA.LK on WhatsApp"
              className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2F39] bg-white dark:bg-[#1A1C23] hover:border-[#25D366] hover:bg-[#25D366]/5 dark:hover:border-[#25D366] text-gray-800 dark:text-gray-200 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </div>
              <div className="text-left leading-tight min-w-0">
                <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#25D366] transition-colors">WhatsApp</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">Updates & Chat</div>
              </div>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com/huta.lk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow HUTA.LK on Instagram"
              className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2F39] bg-white dark:bg-[#1A1C23] hover:border-[#E1306C] hover:bg-[#E1306C]/5 dark:hover:border-[#E1306C] text-gray-800 dark:text-gray-200 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div className="text-left leading-tight min-w-0">
                <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#E1306C] transition-colors">Instagram</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">@huta.lk</div>
              </div>
            </a>

            {/* TikTok */}
            <a
              href="https://tiktok.com/@huta.lk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow HUTA.LK on TikTok"
              className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2F39] bg-white dark:bg-[#1A1C23] hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shrink-0 shadow-xs border border-gray-800 group-hover:scale-105 transition-transform">
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.16 1.18 2.09 2.35 2.33.88.19 1.82.03 2.57-.46.73-.48 1.19-1.28 1.26-2.15.06-2.85.03-5.7.03-8.55 0-3.58 0-7.16-.02-10.74z"/>
                </svg>
              </div>
              <div className="text-left leading-tight min-w-0">
                <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors">TikTok</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">@huta.lk</div>
              </div>
            </a>
          </div>
        </div>

        {/* Policy Links Row matching user screenshot (Terms & Conditions, Privacy Policy, Cookie Policy) */}
        <div className="pt-4 sm:pt-5 border-t border-gray-100 dark:border-[#2D2F39]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 sm:gap-5 text-gray-500 dark:text-gray-400 font-medium flex-wrap justify-center sm:justify-start">
            <button
              type="button"
              onClick={() => onOpenPolicy?.('terms')}
              className="hover:text-[#FF5A36] dark:hover:text-white transition-colors cursor-pointer text-xs sm:text-sm font-semibold"
            >
              Terms & Conditions
            </button>
            <button
              type="button"
              onClick={() => onOpenPolicy?.('privacy')}
              className="hover:text-[#FF5A36] dark:hover:text-white transition-colors cursor-pointer text-xs sm:text-sm font-semibold"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => onOpenPolicy?.('cookies')}
              className="hover:text-[#FF5A36] dark:hover:text-white transition-colors cursor-pointer text-xs sm:text-sm font-semibold"
            >
              Cookie Policy
            </button>
            <span className="hidden md:inline text-gray-300 dark:text-gray-600">•</span>
            <button
              type="button"
              onClick={() => onOpenPolicy?.('compliance')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-xs sm:text-sm flex items-center gap-1"
            >
              <span>🇱🇰 Sri Lankan Acts & Compliance</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenPolicy?.('prohibited')}
              className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer text-xs sm:text-sm"
            >
              Prohibited Items & Safety
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <ThemeToggle variant="segmented" id="footer-theme-toggle" />
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <button
              type="button"
              id="footer-staff-portal"
              onClick={onOpenAdminLogin}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-opacity opacity-50 hover:opacity-100 p-0.5 cursor-pointer"
              title="Staff Portal"
              aria-label="Staff Portal"
            >
              <Lock className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Copyright notice */}
        <div className="pt-3 text-center sm:text-left text-[11px] text-gray-400 dark:text-gray-500">
          <p>© {new Date().getFullYear()} HUTA.LK — Sri Lanka. All prices in Sri Lankan Rupees (LKR).</p>
        </div>
      </div>
    </footer>
  );
};
