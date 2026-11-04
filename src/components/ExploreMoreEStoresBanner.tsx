import React from 'react';
import {
  Store,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { EStore } from '../types';

interface ExploreMoreEStoresBannerProps {
  stores: EStore[];
  onExploreEStores: () => void;
  onRegisterStore: () => void;
  onOpenStore: (store: EStore) => void;
}

export function formatLKR(amount: number): string {
  return 'Rs ' + Number(amount).toLocaleString('en-LK');
}

export const ExploreMoreEStoresBanner: React.FC<ExploreMoreEStoresBannerProps> = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-3.5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0A101D] text-white border border-emerald-500/25 shadow-sm px-4 py-2.5 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Left: One-Line Badge & Info */}
        <div className="relative z-10 flex items-center gap-2.5 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-black shrink-0 border border-emerald-400/30">
            <Store className="w-3.5 h-3.5" />
            <span>E-Store</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </span>

          <div className="flex items-center gap-2 min-w-0 flex-1 truncate text-xs sm:text-sm">
            <span className="font-extrabold text-white truncate">
              Got an Online Website in Sri Lanka?{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-black">
                Sell & Showcase Items Direct!
              </span>
            </span>
            <span className="hidden xl:inline text-xs text-gray-400 truncate">
              • Direct website checkout & WhatsApp orders across all 25 districts
            </span>
          </div>
        </div>

        {/* Right: One-Line Actions (Opens in new tab) */}
        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <a
            href="?tab=estore"
            target="_blank"
            rel="noopener noreferrer"
            title="Explore Sri Lankan E-Stores in New Tab"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs shadow-xs active:scale-95 transition-all cursor-pointer no-underline whitespace-nowrap"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Explore E-Stores ↗</span>
            <ArrowRight className="w-3 h-3" />
          </a>

          <a
            href="?tab=estore#register"
            target="_blank"
            rel="noopener noreferrer"
            title="Register your Sri Lankan online store in New Tab"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 active:scale-95 transition-all cursor-pointer backdrop-blur-sm no-underline whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Register ↗</span>
          </a>
        </div>
      </div>
    </section>
  );
};
