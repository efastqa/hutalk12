import colomboCityImg from '../assets/images/srilanka_colombo_city_1794991124705.jpg';
import natureHighlandsImg from '../assets/images/srilanka_nature_highlands_1794991124649.jpg';
import natureElephantsImg from '../assets/images/srilanka_nature_elephants_safari_1794991773156.jpg';
import natureWaterfallImg from '../assets/images/srilanka_nature_waterfall_forest_1794991772746.jpg';
import beachesCoastImg from '../assets/images/srilanka_beaches_coast_1794991125473.jpg';
import beachesGalleFortImg from '../assets/images/srilanka_beaches_galle_fort_1794991773072.jpg';
import beachesNilaveliImg from '../assets/images/srilanka_beaches_nilaveli_lagoon_1794991773074.jpg';
import heritageSigiriyaImg from '../assets/images/srilanka_heritage_sigiriya_1794991126174.jpg';
import heritageKandyTempleImg from '../assets/images/srilanka_heritage_kandy_temple_1794991774367.jpg';

import {
  TravelPackageConfig,
  TravelPricingConfig,
  TravelVehicleTier,
} from '../types';

export const TRAVEL_IMAGE_PRESETS: { key: string; label: string; src: string }[] = [
  { key: 'heritageSigiriya', label: 'Sigiriya Lion Rock', src: heritageSigiriyaImg },
  { key: 'natureHighlands', label: 'Ella & Highlands Rail', src: natureHighlandsImg },
  { key: 'natureElephants', label: 'Yala & Elephant Safari', src: natureElephantsImg },
  { key: 'beachesGalleFort', label: 'Galle Fort Sunset', src: beachesGalleFortImg },
  { key: 'natureWaterfall', label: 'Sri Lanka Jungle Waterfall', src: natureWaterfallImg },
  { key: 'colomboCity', label: 'Colombo Skyline', src: colomboCityImg },
  { key: 'heritageKandyTemple', label: 'Kandy Sacred Heritage', src: heritageKandyTempleImg },
  { key: 'beachesNilaveli', label: 'Nilaveli Lagoon Beach', src: beachesNilaveliImg },
  { key: 'beachesCoast', label: 'Mirissa Coastline', src: beachesCoastImg },
];

const IMAGE_LOOKUP: Record<string, string> = TRAVEL_IMAGE_PRESETS.reduce(
  (acc, item) => {
    acc[item.key] = item.src;
    return acc;
  },
  {} as Record<string, string>
);

export function resolveTravelImage(keyOrUrl?: string): string {
  if (!keyOrUrl) return heritageSigiriyaImg;
  if (IMAGE_LOOKUP[keyOrUrl]) return IMAGE_LOOKUP[keyOrUrl];
  return keyOrUrl;
}

export const DEFAULT_TRAVEL_CONFIG: TravelPricingConfig = {
  id: 'main',
  packages: [
    {
      id: 'pkg_sigiriya_cultural',
      title: 'Sigiriya Lion Rock & Dambulla Cultural Triangle Tour',
      shortTitle: 'Sigiriya & Cultural Tour',
      category: 'Tour Packages',
      destination: 'Sigiriya',
      defaultDays: 2,
      basePriceLkr: 38500,
      dailyAddonLkr: 15000,
      extraAdultPct: 18,
      childPct: 10,
      rating: 4.9,
      reviewCount: 184,
      defaultVehicle: 'Private Sedan',
      image: 'heritageSigiriya',
      badge: 'Top Rated',
      highlights: ['Sigiriya Rock Sunrise', 'Dambulla Cave Temple', 'Pidurangala Panorama'],
      includes: 'A/C private vehicle, English-speaking chauffeur-guide & boutique hotel booking',
      isActive: true,
    },
    {
      id: 'pkg_kandy_ella_rail',
      title: 'Kandy to Ella Scenic Train & Nine Arch Highlands Escape',
      shortTitle: 'Kandy & Ella Rail Escape',
      category: 'Tour Packages',
      destination: 'Kandy & Ella',
      defaultDays: 2,
      basePriceLkr: 34000,
      dailyAddonLkr: 14500,
      extraAdultPct: 18,
      childPct: 10,
      rating: 4.9,
      reviewCount: 241,
      defaultVehicle: 'Luxury KDH Van',
      image: 'natureHighlands',
      badge: 'Bestseller',
      highlights: ['Nine Arch Bridge', 'Scenic Blue Train', 'Nuwara Eliya Tea Estate'],
      includes: 'Luggage van transfer alongside scenic train ride, station pickup & tea tasting',
      isActive: true,
    },
    {
      id: 'pkg_yala_leopard_safari',
      title: 'Yala National Park Block 1 Full-Day Leopard 4x4 Safari',
      shortTitle: 'Yala Leopard 4x4 Safari',
      category: 'Safaris & Wildlife',
      destination: 'Yala',
      defaultDays: 1,
      basePriceLkr: 24500,
      dailyAddonLkr: 18000,
      extraAdultPct: 18,
      childPct: 10,
      rating: 4.8,
      reviewCount: 163,
      defaultVehicle: '4x4 Safari Jeep',
      image: 'natureElephants',
      badge: 'Instant Confirm',
      highlights: ['Block 1 Leopard Trails', 'Sloth Bear & Elephants', 'Picnic Breakfast Pack'],
      includes: 'Private 4x4 open-top Toyota Hilux safari jeep, tracker & morning refreshments',
      isActive: true,
    },
    {
      id: 'pkg_galle_mirissa_whales',
      title: 'Mirissa Blue Whale Cruise & Galle Dutch Fort Sunset',
      shortTitle: 'Mirissa Whales & Galle Fort',
      category: 'Tour Packages',
      destination: 'Galle & Mirissa',
      defaultDays: 1,
      basePriceLkr: 26000,
      dailyAddonLkr: 14000,
      extraAdultPct: 18,
      childPct: 10,
      rating: 4.8,
      reviewCount: 129,
      defaultVehicle: 'Private Sedan',
      image: 'beachesGalleFort',
      badge: 'Southern Coast',
      highlights: ['Whale Watching Deck', 'Galle Ramparts Walk', 'Unawatuna Cove'],
      includes: 'Morning cruise pass coordination, coastal A/C transport & sunset walking map',
      isActive: true,
    },
    {
      id: 'pkg_minneriya_elephants',
      title: 'Minneriya & Kaudulla Elephant Gathering Jungle Safari',
      shortTitle: 'Minneriya Elephant Safari',
      category: 'Safaris & Wildlife',
      destination: 'Sigiriya',
      defaultDays: 1,
      basePriceLkr: 21000,
      dailyAddonLkr: 16500,
      extraAdultPct: 18,
      childPct: 10,
      rating: 4.9,
      reviewCount: 98,
      defaultVehicle: '4x4 Safari Jeep',
      image: 'natureWaterfall',
      badge: 'Wildlife Pick',
      highlights: ['300+ Wild Elephants', 'Lake Reservoir Sunset', 'Habarana Village Pickup'],
      includes: 'Dedicated 4x4 safari jeep, chilled water, binoculars & park gate assistance',
      isActive: true,
    },
    {
      id: 'pkg_bia_airport_transfer',
      title: 'BIA Airport (CMB) VIP Meet & Private Chauffeur Transfer',
      shortTitle: 'BIA Airport Chauffeur',
      category: 'Transfers & Chauffeurs',
      destination: 'Colombo',
      defaultDays: 1,
      basePriceLkr: 14500,
      dailyAddonLkr: 12500,
      extraAdultPct: 12,
      childPct: 0,
      rating: 4.9,
      reviewCount: 312,
      defaultVehicle: 'Luxury KDH Van',
      image: 'colomboCity',
      badge: '24/7 Pickup',
      highlights: ['Flight Delay Tracking', 'Highway Toll Included', 'Colombo / Kandy / Galle'],
      includes: 'Meet & greet at Bandaranaike Arrivals, bottled water, SIM help & highway transfer',
      isActive: true,
    },
    {
      id: 'pkg_island_chauffeur_van',
      title: 'Multi-Day Sri Lanka Private Chauffeur & Luxury KDH Van',
      shortTitle: 'Island Chauffeur & Van',
      category: 'Transfers & Chauffeurs',
      destination: 'Colombo',
      defaultDays: 4,
      basePriceLkr: 56000,
      dailyAddonLkr: 14000,
      extraAdultPct: 10,
      childPct: 0,
      rating: 4.8,
      reviewCount: 147,
      defaultVehicle: 'Luxury KDH Van',
      image: 'heritageKandyTemple',
      badge: 'Flexible Route',
      highlights: ['150 km/day Allowance', 'Fuel & Driver Meals', 'SLTDA Tourist Driver'],
      includes: 'A/C luxury Toyota KDH or hybrid sedan, fuel, parking & driver accommodation covered',
      isActive: true,
    },
    {
      id: 'pkg_nilaveli_lagoon_villa',
      title: 'Nilaveli & Pigeon Island Reef Beachfront Boutique Stay',
      shortTitle: 'Nilaveli Beachfront Stay',
      category: 'Boutique Stays',
      destination: 'Trincomalee',
      defaultDays: 2,
      basePriceLkr: 42000,
      dailyAddonLkr: 19500,
      extraAdultPct: 20,
      childPct: 10,
      rating: 4.9,
      reviewCount: 89,
      defaultVehicle: 'Private Sedan',
      image: 'beachesNilaveli',
      badge: 'Coastal Villa',
      highlights: ['Private Lagoon Access', 'Pigeon Island Snorkel', 'Ceylon Seafood Dinner'],
      includes: '2 nights ocean-view suite, Sri Lankan breakfast & snorkeling boat drop-off',
      isActive: true,
    },
  ],
  vehicleTiers: [
    { name: 'Private Sedan', surchargePerDay: 0, capacity: 'Up to 3 pax', isActive: true },
    { name: 'Luxury KDH Van', surchargePerDay: 4500, capacity: 'Up to 8 pax', isActive: true },
    { name: '4x4 Safari Jeep', surchargePerDay: 6500, capacity: 'Up to 6 pax', isActive: true },
    { name: 'VIP Coach', surchargePerDay: 14000, capacity: 'Up to 22 pax', isActive: true },
  ],
  addons: [
    { id: 'guide', label: 'SLTDA Certified Tour Guide', priceLkr: 6500, isActive: true },
    { id: 'rail', label: 'Kandy–Ella Scenic Rail Tickets', priceLkr: 4800, isActive: true },
    { id: 'meals', label: 'Ceylon Breakfast & Dinner Plan', priceLkr: 5500, isActive: true },
    { id: 'airport', label: 'BIA VIP Airport Meet & Greet', priceLkr: 4000, isActive: true },
  ],
  serviceFeePercent: 0,
  globalDiscountPercent: 0,
  customTripBaseLkr: 54000,
  customTripDailyLkr: 15500,
  usdExchangeRateLkr: 300,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const DEFAULT_USD_RATE_LKR = 300;

export function getEffectiveUsdRate(rate?: number): number {
  const n = Number(rate);
  if (!Number.isFinite(n) || n < 50 || n > 2000) return DEFAULT_USD_RATE_LKR;
  return n;
}

export function lkrToUsd(amountLkr: number, rate?: number): number {
  const r = getEffectiveUsdRate(rate);
  const val = (Number(amountLkr) || 0) / r;
  return Math.round(val * 100) / 100;
}

export function usdToLkr(amountUsd: number, rate?: number): number {
  const r = getEffectiveUsdRate(rate);
  return Math.round((Number(amountUsd) || 0) * r);
}

export function formatUsd(amountUsd: number): string {
  const rounded = Math.round((Number(amountUsd) || 0) * 100) / 100;
  const sign = rounded < 0 ? '-' : '';
  const absVal = Math.abs(rounded);
  const isWhole = Math.abs(absVal - Math.round(absVal)) < 0.005;
  return `${sign}$${absVal.toLocaleString('en-US', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  })}`;
}

export function formatUsdFromLkr(amountLkr: number, rate?: number): string {
  return formatUsd(lkrToUsd(amountLkr, rate));
}

export interface TravelQuoteBreakdown {
  baseAndDaysLkr: number;
  guestSurchargeLkr: number;
  vehicleLkr: number;
  addonsLkr: number;
  subtotalLkr: number;
  discountLkr: number;
  serviceFeeLkr: number;
  totalLkr: number;
}

export function calculateTravelQuote(params: {
  pkg: TravelPackageConfig;
  config: TravelPricingConfig;
  days: number;
  adults: number;
  children: number;
  vehicleTier: TravelVehicleTier;
  selectedAddonIds: string[];
}): TravelQuoteBreakdown {
  const { pkg, config, days, adults, children, vehicleTier, selectedAddonIds } = params;
  const extraDays = Math.max(0, days - pkg.defaultDays);
  const baseAndDaysLkr = pkg.basePriceLkr + extraDays * pkg.dailyAddonLkr;

  const extraAdults = Math.max(0, adults - 2);
  const adultRatio = (pkg.extraAdultPct ?? 18) / 100;
  const childRatio = (pkg.childPct ?? 10) / 100;
  const guestSurchargeLkr =
    extraAdults * Math.round(pkg.basePriceLkr * adultRatio) +
    children * Math.round(pkg.basePriceLkr * childRatio);

  const tierCfg = config.vehicleTiers.find((v) => v.name === vehicleTier);
  const vehicleLkr = (tierCfg?.surchargePerDay || 0) * days;

  const addonsLkr = selectedAddonIds.reduce((sum, id) => {
    const addon = config.addons.find((a) => a.id === id && a.isActive);
    return sum + (addon ? addon.priceLkr : 0);
  }, 0);

  const subtotalLkr = Math.max(0, baseAndDaysLkr + guestSurchargeLkr + vehicleLkr + addonsLkr);
  const discountPct = Math.max(0, Math.min(80, Number(config.globalDiscountPercent) || 0));
  const discountLkr = Math.round(subtotalLkr * (discountPct / 100));
  const afterDiscount = Math.max(0, subtotalLkr - discountLkr);

  const servicePct = Math.max(0, Math.min(50, Number(config.serviceFeePercent) || 0));
  const serviceFeeLkr = Math.round(afterDiscount * (servicePct / 100));

  const totalLkr = Math.max(1000, afterDiscount + serviceFeeLkr);

  return {
    baseAndDaysLkr,
    guestSurchargeLkr,
    vehicleLkr,
    addonsLkr,
    subtotalLkr,
    discountLkr,
    serviceFeeLkr,
    totalLkr,
  };
}
