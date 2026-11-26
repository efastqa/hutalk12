import React, { useState } from 'react';
import { ShieldCheck, MapPin, PhoneCall, HelpCircle, Heart, Smartphone, Mail } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { PolicyTab } from './LegalPoliciesModal';
import { buildDistrictCategorySeoPath } from '../utils/seo';
import footerSriLankaBg from '../assets/images/footer_srilanka_light_bg_1795672460467.jpg';

interface FooterProps {
  onSelectCategory: (cat: string) => void;
  onSelectLocation: (loc: string) => void;
  onOpenPostAd: () => void;
  onOpenAdminLogin?: () => void;
  onOpenAppStore?: () => void;
  onSelectTab?: (tab: 'marketplace' | 'estore' | 'huta_in' | 'categories' | 'districts' | 'hot_news' | 'donate' | 'buyer_requests') => void;
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
  const [bgFailed, setBgFailed] = useState(false);

  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-white via-[#F8FAFC] to-white dark:from-[#111217] dark:via-[#111217] dark:to-[#0B0C10] text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-[#2D2F39]/60 mt-8 sm:mt-12 pt-7 sm:pt-9 pb-24 lg:pb-7 transition-colors duration-200">
      {/* Light All-Sri-Lanka Scenic Background Image Layer */}
      {!bgFailed && (
        <div
          className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0"
          aria-hidden="true"
        >
          {/* Phone View (< md): Top & bottom proportioned Sri Lanka scenic bands so landmarks & coast look balanced across tall narrow phone viewports */}
          <div className="md:hidden absolute inset-0">
            {/* Upper subtle horizon behind brand & directory */}
            <div className="absolute top-0 inset-x-0 h-[240px] overflow-hidden">
              <img
                src={footerSriLankaBg}
                alt="Sri Lanka Colombo Lotus Tower and coastal skyline"
                referrerPolicy="no-referrer"
                onError={() => setBgFailed(true)}
                className="w-full h-full object-cover object-[22%_58%] filter brightness-[1.06] contrast-[1.03] saturate-[1.08] opacity-45 dark:opacity-18 dark:brightness-[0.8]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/62 to-white dark:from-[#111217]/90 dark:via-[#111217]/78 dark:to-[#111217]" />
            </div>

            {/* Lower panoramic island band anchored down to bottom-0 behind Connect & Follow, Policies & Copyright */}
            <div className="absolute bottom-0 inset-x-0 h-[360px] overflow-hidden">
              <img
                src={footerSriLankaBg}
                alt="Panoramic Sri Lanka landscape featuring Colombo Lotus Tower, Nine Arch Bridge, Sigiriya, and Galle Coast"
                referrerPolicy="no-referrer"
                onError={() => setBgFailed(true)}
                className="w-full h-full object-cover object-[62%_60%] filter brightness-[1.06] contrast-[1.03] saturate-[1.1] opacity-65 dark:opacity-25 dark:brightness-[0.82]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white via-white/42 to-white/80 dark:from-[#111217] dark:via-[#111217]/58 dark:to-[#111217]/92" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0.04)_75%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(17,18,23,0.4)_0%,rgba(17,18,23,0.12)_75%)]" />
            </div>
          </div>

          {/* Desktop & Tablet View (>= md): Full-width Panoramic Sri Lanka Backdrop */}
          <div className="hidden md:block absolute inset-0">
            <img
              src={footerSriLankaBg}
              alt="Panoramic Sri Lanka landscape featuring Colombo Lotus Tower, Nine Arch Bridge, Sigiriya, and Galle Coast"
              referrerPolicy="no-referrer"
              onError={() => setBgFailed(true)}
              className="w-full h-full object-cover object-[center_58%] filter brightness-[1.06] contrast-[1.03] saturate-[1.08] opacity-60 dark:opacity-20 dark:brightness-[0.8]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/68 to-white/78 dark:from-[#111217]/92 dark:via-[#111217]/84 dark:to-[#111217]/92" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0.1)_75%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(17,18,23,0.4)_0%,rgba(17,18,23,0.15)_75%)]" />
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid ${
            isEStore
              ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-3'
              : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
          } gap-x-4 gap-y-6 sm:gap-6 pb-6 sm:pb-7 border-b border-gray-200 dark:border-[#2D2F39]/50`}
        >
          {/* Brand Info */}
          <div className={`${isEStore ? 'col-span-1 md:col-span-2 lg:col-span-2' : 'col-span-2 md:col-span-3 lg:col-span-2'} space-y-3`}>
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

            <p className="text-xs text-gray-700 dark:text-gray-300 max-w-sm leading-relaxed font-medium">
              HUTA.LK is Sri Lanka's trusted trading platform. Buy, sell, and find anything from vehicles and smartphones to houses and local services across all 25 districts.
            </p>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-700 dark:text-gray-300 pt-1">
              <span className="flex items-center gap-1.5 bg-white/85 dark:bg-white/5 backdrop-blur-xs px-2.5 py-1 rounded-md border border-gray-200/90 dark:border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF5A36]" />
                Verified Listings
              </span>
              <span className="flex items-center gap-1.5 bg-white/85 dark:bg-white/5 backdrop-blur-xs px-2.5 py-1 rounded-md border border-gray-200/90 dark:border-white/10">
                <MapPin className="w-3.5 h-3.5 text-[#FF5A36]" />
                All 25 Districts
              </span>
            </div>

            {onOpenAppStore && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenAppStore}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 hover:bg-[#FF5A36] hover:text-white dark:bg-white/10 dark:hover:bg-[#FF5A36] backdrop-blur-xs text-gray-800 dark:text-white text-xs font-bold transition-all border border-gray-200/90 dark:border-white/10 cursor-pointer group shadow-xs"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#FF5A36] group-hover:text-white transition-colors" />
                  <span>Get App (Play Store & App Store)</span>
                </button>
              </div>
            )}
          </div>

          {/* Popular Categories & Top Districts (each takes 1 of the 2 columns cleanly on phone, and 1 column each on md/lg) */}
          {!isEStore && (
            <>
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2.5">
                  Top Categories
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300 font-medium">
                  {['Vehicles', 'Auto Parts', 'Cars for Rent', 'Property', 'Boardings & Annexes', 'Holiday Homes', 'Agriculture & Farming', 'Weddings & Events'].map((cat) => (
                    <li key={cat}>
                      <a
                        href={buildDistrictCategorySeoPath('All Sri Lanka', cat)}
                        onClick={(e) => {
                          e.preventDefault();
                          onSelectCategory(cat);
                          window.scrollTo({ top: 400, behavior: 'smooth' });
                        }}
                        className="hover:text-[#FF5A36] transition-colors cursor-pointer leading-snug block"
                      >
                        {cat} in Sri Lanka
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2.5">
                  Key Locations
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300 font-medium">
                  {['Colombo', 'Gampaha', 'Kandy', 'Galle', 'Kurunegala'].map((loc) => (
                    <li key={loc}>
                      <a
                        href={buildDistrictCategorySeoPath(loc, 'All')}
                        onClick={(e) => {
                          e.preventDefault();
                          onSelectLocation(loc);
                          window.scrollTo({ top: 400, behavior: 'smooth' });
                        }}
                        className="hover:text-[#FF5A36] transition-colors cursor-pointer leading-snug block"
                      >
                        Ads in {loc}
                      </a>
                    </li>
                  ))}
                  {onSelectTab && (
                    <li className="pt-1">
                      <a
                        href="/districts"
                        onClick={(e) => {
                          e.preventDefault();
                          onSelectTab('districts');
                        }}
                        className="font-bold text-[#FF5A36] hover:underline cursor-pointer leading-snug block"
                      >
                        All 25 Districts &amp; Categories →
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}

          {/* Safety & Support */}
          <div className={isEStore ? 'col-span-1' : 'col-span-2 md:col-span-1'}>
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
                  href="mailto:support@huta.lk"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 font-bold transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email: support@huta.lk</span>
                </a>
              </li>
              <li>
                <a
                  href="/estores"
                  onClick={(e) => {
                    if (onSelectTab) {
                      e.preventDefault();
                      onSelectTab('estore');
                    }
                  }}
                  className="hover:text-emerald-500 transition-colors font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 cursor-pointer no-underline"
                >
                  <span>Sri Lanka E-Stores &amp; Online Merchants</span>
                </a>
              </li>
              {onSelectTab && (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={() => onSelectTab('buyer_requests')}
                      className="hover:text-[#FF5A36] transition-colors font-bold text-[#FF5A36] flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Looking For · Buyer Requests</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onSelectTab('hot_news')}
                      className="hover:text-rose-500 transition-colors font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Sri Lanka Hot News (Live)</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => onSelectTab('donate')}
                      className="hover:text-teal-500 transition-colors font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Donate Sri Lanka · Hospitals & Aid</span>
                    </button>
                  </li>
                </>
              )}
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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF5A36]/12 backdrop-blur-xs text-[#FF5A36] text-[11px] font-bold tracking-wide uppercase mb-1.5">
              <span>Connect & Follow</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              Are you Following Us ?
            </h3>
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 max-w-md font-medium">
              Follow our official channels for the latest classifieds, verified e-store deals & daily flash drops across Sri Lanka.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Facebook */}
            <a
              href="https://facebook.com/huta.lk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow HUTA.LK on Facebook"
              className="group flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border border-gray-200/90 dark:border-[#2D2F39] bg-white/90 dark:bg-[#1A1C23]/90 backdrop-blur-xs hover:border-[#1877F2] hover:bg-white dark:hover:border-[#1877F2] text-gray-800 dark:text-gray-200 transition-all cursor-pointer shadow-xs active:scale-95 min-w-0"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div className="text-left leading-tight min-w-0">
                <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#1877F2] transition-colors truncate">Facebook</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">@huta.lk</div>
              </div>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/94775260765?text=Hello%20HUTA.LK%20Team%2C%20I%20am%20following%20you%20on%20WhatsApp%21"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Connect with HUTA.LK on WhatsApp"
              className="group flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border border-gray-200/90 dark:border-[#2D2F39] bg-white/90 dark:bg-[#1A1C23]/90 backdrop-blur-xs hover:border-[#25D366] hover:bg-white dark:hover:border-[#25D366] text-gray-800 dark:text-gray-200 transition-all cursor-pointer shadow-xs active:scale-95 min-w-0"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </div>
              <div className="text-left leading-tight min-w-0">
                <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#25D366] transition-colors truncate">WhatsApp</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">Updates & Chat</div>
              </div>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com/huta.lk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow HUTA.LK on Instagram"
              className="group flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border border-gray-200/90 dark:border-[#2D2F39] bg-white/90 dark:bg-[#1A1C23]/90 backdrop-blur-xs hover:border-[#E1306C] hover:bg-white dark:hover:border-[#E1306C] text-gray-800 dark:text-gray-200 transition-all cursor-pointer shadow-xs active:scale-95 min-w-0"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div className="text-left leading-tight min-w-0">
                <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#E1306C] transition-colors truncate">Instagram</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">@huta.lk</div>
              </div>
            </a>

            {/* TikTok */}
            <a
              href="https://tiktok.com/@huta.lk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow HUTA.LK on TikTok"
              className="group flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border border-gray-200/90 dark:border-[#2D2F39] bg-white/90 dark:bg-[#1A1C23]/90 backdrop-blur-xs hover:border-black dark:hover:border-white hover:bg-white dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 transition-all cursor-pointer shadow-xs active:scale-95 min-w-0"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black text-white flex items-center justify-center shrink-0 shadow-xs border border-gray-800 group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.16 1.18 2.09 2.35 2.33.88.19 1.82.03 2.57-.46.73-.48 1.19-1.28 1.26-2.15.06-2.85.03-5.7.03-8.55 0-3.58 0-7.16-.02-10.74z"/>
                </svg>
              </div>
              <div className="text-left leading-tight min-w-0">
                <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors truncate">TikTok</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">@huta.lk</div>
              </div>
            </a>
          </div>
        </div>

        {/* Policy Links Row matching user screenshot (Terms & Conditions, Privacy Policy, Cookie Policy) */}
        <div className="pt-4 sm:pt-5 border-t border-gray-200/80 dark:border-[#2D2F39]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 sm:gap-5 text-gray-700 dark:text-gray-300 font-medium flex-wrap justify-center sm:justify-start">
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
            <span className="hidden md:inline text-gray-400 dark:text-gray-600">•</span>
            <button
              type="button"
              onClick={() => onOpenPolicy?.('compliance')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-xs sm:text-sm flex items-center gap-1 font-medium"
            >
              <span>🇱🇰 Sri Lankan Acts & Compliance</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenPolicy?.('prohibited')}
              className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer text-xs sm:text-sm font-medium"
            >
              Prohibited Items & Safety
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <ThemeToggle variant="segmented" id="footer-theme-toggle" />
          </div>
        </div>

        {/* Copyright notice */}
        <div className="pt-3 text-center sm:text-left text-[11px] text-gray-600 dark:text-gray-400 font-medium flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} HUTA.LK — Sri Lanka. All prices in Sri Lankan Rupees (LKR).</p>
          <p className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Support:</span>
            <a href="mailto:support@huta.lk" className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline">
              support@huta.lk
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
