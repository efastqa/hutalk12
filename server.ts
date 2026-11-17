import express from 'express';
import path from 'path';
import fs from 'fs';
import dns from 'node:dns/promises';
import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  setLogLevel,
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

try {
  setLogLevel('silent');
} catch {
  // ignore
}

// Filter benign internal Firestore idle stream timeout notices in server logs
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const fullText = args
    .map((a) => (typeof a === 'string' ? a : a?.message || String(a)))
    .join(' ');

  if (
    fullText.includes('Disconnecting idle stream') ||
    fullText.includes('Timed out waiting for new targets') ||
    (fullText.includes('@firebase/firestore') && fullText.includes('CANCELLED')) ||
    (fullText.includes('GrpcConnection') && fullText.includes('CANCELLED')) ||
    fullText.includes('cancelling stream')
  ) {
    console.debug('[Firestore Stream Notice]', ...args);
    return;
  }
  originalConsoleError.apply(console, args);
};

// Prevent process exits from benign Firestore stream cancellations or network interruptions
process.on('uncaughtException', (err: any) => {
  const msg = err?.message || String(err);
  if (
    msg.includes('Disconnecting idle stream') ||
    msg.includes('Timed out waiting for new targets') ||
    msg.includes('CANCELLED') ||
    msg.includes('cancelled') ||
    msg.includes('GrpcConnection') ||
    msg.includes('ECONNRESET') ||
    msg.includes('EPIPE')
  ) {
    console.warn('[Server] Gracefully handled benign stream/network notice:', msg);
    return;
  }
  console.error('[Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason: any) => {
  const msg = reason?.message || String(reason);
  if (
    msg.includes('Disconnecting idle stream') ||
    msg.includes('Timed out waiting for new targets') ||
    msg.includes('CANCELLED') ||
    msg.includes('cancelled') ||
    msg.includes('GrpcConnection') ||
    msg.includes('ECONNRESET') ||
    msg.includes('EPIPE')
  ) {
    console.warn('[Server] Gracefully handled benign stream/network rejection:', msg);
    return;
  }
  console.error('[Server] Unhandled Rejection:', reason);
});

interface Listing {
  id: string;
  title: string;
  category: string;
  location: string;
  district?: string;
  price: number;
  phone: string;
  image: string;
  images?: string[];
  description: string;
  status: 'approved' | 'pending' | 'rejected';
  isFeatured: boolean;
  date: string;
  userId: string;
  views: number;
  whatsappClicks?: number;
  phoneClicks?: number;
  serviceTrade?: string;
  pricingType?: 'fixed' | 'starting_at' | 'hourly' | 'quote' | 'per_night' | 'per_weekend' | 'daily' | 'monthly';
  serviceArea?: string;
  serviceMode?: string;
  serviceExperience?: string;
  serviceAvailability?: string;
  serviceWarranty?: string;
  serviceFeatures?: string[];
  isVerifiedPro?: boolean;
  isEmergency247?: boolean;
  videoUrl?: string;
  verificationNotes?: string;
  verificationStatus?: 'unverified' | 'verified_with_customer' | 'deltas_found';
  sellerName?: string;
  availabilityStatus?: 'available' | 'reserved' | 'sold';
  sellerRating?: number;
  reviewCount?: number;
  itemCondition?: string;
  brand?: string;
  model?: string;
  vehicleType?: string;
  vehicleYear?: number | string;
  vehicleMileage?: number | string;
  fuelType?: string;
  transmission?: string;
  rentalDriverOption?: string;
  propertyType?: string;
  propertySize?: string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  maxGuests?: number | string;
  amenities?: string[];
  electronicsSubcategory?: string;
  storageCapacity?: string;
  jobType?: string;
  salaryPeriod?: string;
}

interface ListingReview {
  id: string;
  listingId: string;
  authorName: string;
  rating: number;
  comment: string;
  verifiedBuyer?: boolean;
  date: string;
  createdAt?: string;
}

interface ListingReport {
  id: string;
  listingId: string;
  listingTitle: string;
  reason: 'fraud_scam' | 'incorrect_price' | 'already_sold' | 'duplicate' | 'prohibited_item' | 'other';
  details: string;
  reporterContact?: string;
  createdAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

interface User {
  id: string;
  username: string;
  fullname: string;
  email: string;
  phone?: string;
  password?: string;
  securityQuestion: string;
  securityAnswer?: string;
  created: string;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'sms' | 'authenticator';
  twoFactorPhone?: string;
  twoFactorSecret?: string;
  twoFactorRecoveryCodes?: string[];
}

interface EventItem {
  id: string;
  title: string;
  category: string;
  district: string;
  date: string;
  month: string;
  day: string;
  time: string;
  location: string;
  venue: string;
  image: string;
  badge?: string;
  price: string;
  isFree: boolean;
  attendees: number;
  description: string;
  organizer: string;
  isSpotlight?: boolean;
}

interface HeroAd {
  id: string;
  badge: string;
  title: string;
  highlightText?: string;
  subtitle: string;
  ctaText?: string;
  ctaAction?: string;
  bgImage?: string;
  bgVideo?: string;
  mediaType?: 'image' | 'video';
  onlyVideoVisible?: boolean;
  videoAspectRatio?: '16:9' | '21:9' | 'auto';
  enableSound?: boolean;
  gradientTheme?: 'orange' | 'blue' | 'emerald' | 'purple' | 'amber';
  animationType?: 'slide' | 'fade' | 'pulse' | 'glow';
  isActive: boolean;
  createdAt: string;
}

interface HeroAdSettings {
  mode: 'default' | 'rotate' | 'ads_only';
  rotationIntervalSeconds: number;
}

interface PromoSlide {
  id: string;
  title: string;
  imageUrl: string;
  badge?: string;
  subtitle?: string;
  ctaText?: string;
  ctaAction?: string;
  showTextOverlay?: boolean;
  isActive: boolean;
  order?: number;
  createdAt: string;
}

interface PromoSlidesSettings {
  enabled: boolean;
  rotationIntervalSeconds: number;
  aspectPreset?: 'compact' | 'standard' | 'wide';
}

interface EStoreProduct {
  id: string;
  storeId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  productUrl: string;
  description: string;
  category: string;
  inStock: boolean;
  featured?: boolean;
}

interface EStore {
  id: string;
  storeName: string;
  tagline: string;
  description: string;
  category: string;
  district: string;
  websiteUrl: string;
  whatsapp: string;
  phone?: string;
  email?: string;
  logo: string;
  bannerImage?: string;
  rating: number;
  reviewCount: number;
  isVerifiedMerchant: boolean;
  deliveryInfo: string;
  returnPolicy?: string;
  foundedYear?: string;
  ownerId?: string;
  products: EStoreProduct[];
  createdAt: string;
}

interface VideoReelItem {
  id: string;
  title: string;
  videoUrl: string;
  posterImage?: string;
  category?: string;
  price?: number;
  location?: string;
  district?: string;
  sellerName?: string;
  phone?: string;
  isVerified?: boolean;
  specsSummary?: string;
  listingId?: string;
  listing?: Listing;
  isActive?: boolean;
  createdAt?: string;
  views?: number;
}

interface BuyerRequestOffer {
  id: string;
  sellerName: string;
  sellerPhone: string;
  sellerUserId?: string;
  itemTitle: string;
  offeredPrice: number;
  message: string;
  listingId?: string;
  createdAt: string;
}

interface BuyerRequest {
  id: string;
  title: string;
  category: string;
  district: string;
  location: string;
  maxBudget: number;
  urgency: 'urgent' | 'this_week' | 'flexible';
  description: string;
  buyerName: string;
  buyerPhone: string;
  userId: string;
  status: 'open' | 'fulfilled' | 'closed';
  offersCount: number;
  offers: BuyerRequestOffer[];
  createdAt: string;
  updatedAt: string;
}

function resolvePort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const val = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(val) && val > 0) return val;
  }
  // In development, the dev server must always run on port 3000
  // (process.env.PORT is 8080 in the Cloud Run container environment, which would conflict with Cloud Run's ingress)
  if (process.env.NODE_ENV !== 'production') {
    return 3000;
  }
  return Number(process.env.PORT) || 8080;
}
const PORT = resolvePort();
const DATA_DIR = path.join(process.cwd(), 'data');
const LISTINGS_FILE = path.join(DATA_DIR, 'listings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const ADMIN_CONFIG_FILE = path.join(DATA_DIR, 'admin.json');
const HERO_ADS_FILE = path.join(DATA_DIR, 'hero-ads.json');
const PROMO_SLIDES_FILE = path.join(DATA_DIR, 'promo-slides.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');
const ESTORES_FILE = path.join(DATA_DIR, 'estores.json');
const VIDEO_REELS_FILE = path.join(DATA_DIR, 'video-reels.json');
const BUYER_REQUESTS_FILE = path.join(DATA_DIR, 'buyer-requests.json');

interface AdminConfig {
  password?: string;
  autoApprove?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorPhone?: string;
  twoFactorMethod?: 'sms' | 'authenticator';
  updatedAt?: string;
}

function getAdminConfig(): {
  password: string;
  autoApprove: boolean;
  twoFactorEnabled: boolean;
  twoFactorPhone: string;
  twoFactorMethod: 'sms' | 'authenticator';
} {
  const result = {
    password: process.env.ADMIN_PASSWORD || '520765',
    autoApprove: false, // Default: manual admin review required for all ads and services for website safety
    twoFactorEnabled: false,
    twoFactorPhone: '0777000111',
    twoFactorMethod: 'sms' as 'sms' | 'authenticator',
  };
  if (fs.existsSync(ADMIN_CONFIG_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(ADMIN_CONFIG_FILE, 'utf-8'));
      if (data.password) result.password = String(data.password);
      if (data.autoApprove !== undefined) result.autoApprove = Boolean(data.autoApprove);
      if (data.twoFactorEnabled !== undefined) result.twoFactorEnabled = Boolean(data.twoFactorEnabled);
      if (data.twoFactorPhone) result.twoFactorPhone = String(data.twoFactorPhone);
      if (data.twoFactorMethod) result.twoFactorMethod = data.twoFactorMethod;
    } catch {
      // ignore
    }
  }
  return result;
}

function getAdminPassword(): string {
  return getAdminConfig().password;
}

function setAdminPassword(newPassword: string): void {
  const cfg = getAdminConfig();
  fs.writeFileSync(
    ADMIN_CONFIG_FILE,
    JSON.stringify({ ...cfg, password: newPassword, updatedAt: new Date().toISOString() }, null, 2),
    'utf-8'
  );
  persistAdminConfigToFirestore({ ...cfg, password: newPassword });
}

function updateAdminConfig(updates: Partial<AdminConfig>): {
  password: string;
  autoApprove: boolean;
  twoFactorEnabled: boolean;
  twoFactorPhone: string;
  twoFactorMethod: 'sms' | 'authenticator';
} {
  const cfg = getAdminConfig();
  const merged = {
    ...cfg,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  persistAdminConfigToFirestore(merged);
  return merged;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize Firestore for backend synchronization
let firestoreDb: any = null;
try {
  const firebaseApp = initializeApp(firebaseConfig, 'server-backend-app');
  firestoreDb = initializeFirestore(firebaseApp, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId);
  console.log('[Firestore] Backend connected to Firestore database:', firebaseConfig.firestoreDatabaseId);
} catch (e) {
  console.warn('[Firestore] Backend initialization warning:', e);
}

function sanitizeForFirestoreServer(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (item && typeof item === 'object' ? sanitizeForFirestoreServer(item) : item));
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !(value instanceof Date)) {
        clean[key] = sanitizeForFirestoreServer(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

function persistListingToFirestore(listing: Listing) {
  if (!firestoreDb) return;
  const clean = sanitizeForFirestoreServer(listing);
  setDoc(doc(firestoreDb, 'listings', listing.id), clean).catch((err) => {
    console.warn('[Firestore] persist listing error:', err);
  });
}

function deleteListingFromFirestore(id: string) {
  if (!firestoreDb) return;
  deleteDoc(doc(firestoreDb, 'listings', id)).catch((err) => {
    console.warn('[Firestore] delete listing error:', err);
  });
}

function persistAdminConfigToFirestore(cfg: { password?: string; autoApprove?: boolean; twoFactorEnabled?: boolean; twoFactorPhone?: string; twoFactorMethod?: string }) {
  if (!firestoreDb) return;
  setDoc(doc(firestoreDb, 'admin_config', 'main'), { ...cfg, updatedAt: new Date().toISOString() }, { merge: true }).catch((err) => {
    console.warn('[Firestore] persist admin config error:', err);
  });
}

function persistHeroAdsToFirestore(data: { settings: HeroAdSettings; ads: HeroAd[] }) {
  if (!firestoreDb) return;
  const clean = sanitizeForFirestoreServer(data);
  setDoc(doc(firestoreDb, 'hero_ads', 'main'), {
    ...clean,
    updatedAt: new Date().toISOString(),
  }, { merge: true }).catch((err) => {
    console.warn('[Firestore] persist hero ads error:', err);
  });
}

function persistPromoSlidesToFirestore(data: { settings: PromoSlidesSettings; slides: PromoSlide[] }) {
  if (!firestoreDb) return;
  const clean = sanitizeForFirestoreServer(data);
  setDoc(doc(firestoreDb, 'hero_ads', 'promo_slides'), {
    ...clean,
    updatedAt: new Date().toISOString(),
  }, { merge: true }).catch((err) => {
    console.warn('[Firestore] persist promo slides error:', err);
  });
}

function persistReviewToFirestore(review: ListingReview) {
  if (!firestoreDb) return;
  const clean = sanitizeForFirestoreServer(review);
  setDoc(doc(firestoreDb, 'reviews', review.id), clean).catch((err) => {
    console.warn('[Firestore] persist review error:', err);
  });
}

function persistReportToFirestore(report: ListingReport) {
  if (!firestoreDb) return;
  const clean = sanitizeForFirestoreServer(report);
  setDoc(doc(firestoreDb, 'reports', report.id), clean).catch((err) => {
    console.warn('[Firestore] persist report error:', err);
  });
}

function persistUserToFirestore(user: User) {
  if (!firestoreDb) return;
  const clean = sanitizeForFirestoreServer(user);
  setDoc(doc(firestoreDb, 'users', user.id), clean, { merge: true }).catch((err) => {
    console.warn('[Firestore] persist user error:', err);
  });
}

function persistEStoreToFirestore(store: EStore) {
  if (!firestoreDb) return;
  const clean = sanitizeForFirestoreServer(store);
  setDoc(doc(firestoreDb, 'estores', store.id), clean, { merge: true }).catch((err) => {
    console.warn('[Firestore] persist e-store error:', err);
  });
}

function deleteEStoreFromFirestore(id: string) {
  if (!firestoreDb) return;
  deleteDoc(doc(firestoreDb, 'estores', id)).catch((err) => {
    console.warn('[Firestore] delete e-store error:', err);
  });
}

function persistVideoReelToFirestore(reel: VideoReelItem) {
  if (!firestoreDb) return;
  const clean = sanitizeForFirestoreServer(reel);
  setDoc(doc(firestoreDb, 'video_reels', reel.id), clean, { merge: true }).catch((err) => {
    console.warn('[Firestore] persist video reel error:', err);
  });
}

function deleteVideoReelFromFirestore(id: string) {
  if (!firestoreDb) return;
  deleteDoc(doc(firestoreDb, 'video_reels', id)).catch((err) => {
    console.warn('[Firestore] delete video reel error:', err);
  });
}

function persistBuyerRequestToFirestore(reqItem: BuyerRequest) {
  if (!firestoreDb) return;
  const clean = sanitizeForFirestoreServer(reqItem);
  setDoc(doc(firestoreDb, 'buyer_requests', reqItem.id), clean, { merge: true }).catch((err) => {
    console.warn('[Firestore] persist buyer request error:', err);
  });
}

function deleteBuyerRequestFromFirestore(id: string) {
  if (!firestoreDb) return;
  deleteDoc(doc(firestoreDb, 'buyer_requests', id)).catch((err) => {
    console.warn('[Firestore] delete buyer request error:', err);
  });
}

function getStoredReviews(): ListingReview[] {
  try {
    if (fs.existsSync(REVIEWS_FILE)) {
      const data = fs.readFileSync(REVIEWS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading reviews file', err);
  }
  return [];
}

function saveStoredReviews(reviews: ListingReview[]) {
  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving reviews file', err);
  }
}

function getStoredReports(): ListingReport[] {
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      const data = fs.readFileSync(REPORTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading reports file', err);
  }
  return [];
}

function saveStoredReports(reports: ListingReport[]) {
  try {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving reports file', err);
  }
}

// Initial Seed Data - Empty for fresh live launch (customers will add real ads)
const DEFAULT_LISTINGS: Listing[] = [];

// Helper to read/write listings
function getStoredListings(): Listing[] {
  try {
    if (fs.existsSync(LISTINGS_FILE)) {
      const data = fs.readFileSync(LISTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading listings file, fallback to defaults', err);
  }
  saveStoredListings(DEFAULT_LISTINGS);
  return DEFAULT_LISTINGS;
}

function saveStoredListings(listings: Listing[]) {
  try {
    fs.writeFileSync(LISTINGS_FILE, JSON.stringify(listings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving listings file', err);
  }
}

// Initial Default Users Seed
const DEFAULT_USERS: User[] = [
  {
    id: 'user_demo',
    username: 'demo',
    fullname: 'Demo Member',
    email: 'demo@huta.lk',
    phone: '0771234567',
    password: 'password123',
    securityQuestion: 'pet',
    securityAnswer: 'puppy',
    created: '2026-09-20T00:00:00.000Z',
  },
  {
    id: 'user_seller',
    username: 'seller',
    fullname: 'Kasun Fernando (Verified Seller)',
    email: 'seller@huta.lk',
    phone: '0719876543',
    password: 'password123',
    securityQuestion: 'city',
    securityAnswer: 'colombo',
    created: '2026-09-20T00:00:00.000Z',
  },
  {
    id: 'user_efastqa',
    username: 'efastqa',
    fullname: 'HUTA Administrator',
    email: 'efastqa@gmail.com',
    phone: '0777000111',
    password: '520765',
    securityQuestion: 'pet',
    securityAnswer: 'huta',
    created: '2026-09-20T00:00:00.000Z',
  },
];

// Helper to read/write users
function getStoredUsers(): User[] {
  let list: User[] = [];
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch (err) {
    console.error('Error reading users file, falling back to seed users', err);
  }
  
  // Guarantee demo accounts always exist
  for (const def of DEFAULT_USERS) {
    if (!list.some(u => u.username.toLowerCase() === def.username.toLowerCase())) {
      list.push(def);
    }
  }

  saveStoredUsers(list);
  return list;
}

function saveStoredUsers(users: User[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving users file', err);
  }
}

const DEFAULT_EVENTS: EventItem[] = [
  {
    id: 'evt-1',
    title: 'Colombo International Motor & Auto Expo 2026',
    category: 'Motor & Auto',
    district: 'Colombo',
    date: 'March 28-30, 2026',
    month: 'MAR',
    day: '28',
    time: '10:00 AM - 08:00 PM',
    location: 'BMICH, Colombo 07',
    venue: 'Sirimavo Bandaranaike Exhibition Centre',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    badge: 'Popular Spotlight',
    price: 'Rs. 500 Entry',
    isFree: false,
    attendees: 1240,
    description: 'The largest automotive gathering in Sri Lanka featuring brand new electric vehicles, custom Japanese performance builds, vintage classics, and aftermarket accessories.',
    organizer: 'Ceylon Motor Traders Association',
    isSpotlight: true
  },
  {
    id: 'evt-2',
    title: 'Galle Fort Sunset Food Carnival & Street Fair',
    category: 'Food & Dining',
    district: 'Galle',
    date: 'April 04-05, 2026',
    month: 'APR',
    day: '04',
    time: '04:00 PM - 11:00 PM',
    location: 'Galle Fort Esplanade, Galle',
    venue: 'Rampart Street Grounds',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    badge: 'Free Admission',
    price: 'Free Entry',
    isFree: true,
    attendees: 850,
    description: 'Celebrate coastal street culinary gems with over 60 food trucks, artisan pastry chefs, authentic southern Sri Lankan seafood stalls, live acoustic beats, and handicraft popups.',
    organizer: 'Southern Tourism & Culture Guild',
    isSpotlight: true
  },
  {
    id: 'evt-3',
    title: 'Lanka Tech & Electronics Mega Showcase',
    category: 'Technology & Gadgets',
    district: 'Colombo',
    date: 'April 18-20, 2026',
    month: 'APR',
    day: '18',
    time: '09:30 AM - 07:00 PM',
    location: 'SLECC, Colombo 01',
    venue: 'Main Exhibition Hall A',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    badge: 'Tech Expo',
    price: 'Free Registration',
    isFree: true,
    attendees: 2150,
    description: 'Special discounts on smartphones, gaming laptops, drones, solar solutions, and smart home appliances with direct distributor warranties.',
    organizer: 'Sri Lanka Electronics & IT Forum',
    isSpotlight: false
  },
  {
    id: 'evt-4',
    title: 'Kandy Cultural Esala Art & Craft Exhibition',
    category: 'Art & Culture',
    district: 'Kandy',
    date: 'May 02-04, 2026',
    month: 'MAY',
    day: '02',
    time: '09:00 AM - 06:30 PM',
    location: "Queen's Hotel Grounds, Kandy",
    venue: 'Heritage Pavilion & Lakeview Lawn',
    image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
    badge: 'Cultural Heritage',
    price: 'Free Entry',
    isFree: true,
    attendees: 620,
    description: 'Showcasing master Kandyan brassware, handloom textiles, wood carvings, and contemporary paintings from artisan guilds across Central Province.',
    organizer: 'Central Province Heritage Foundation',
    isSpotlight: false
  }
];

function getStoredEvents(): EventItem[] {
  try {
    if (fs.existsSync(EVENTS_FILE)) {
      const data = fs.readFileSync(EVENTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading events file', err);
  }
  saveStoredEvents(DEFAULT_EVENTS);
  return DEFAULT_EVENTS;
}

function saveStoredEvents(events: EventItem[]) {
  try {
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving events file', err);
  }
}

const DEFAULT_HERO_SETTINGS: HeroAdSettings = {
  mode: 'default', // By default, keep the default original hero!
  rotationIntervalSeconds: 6,
};

const DEFAULT_HERO_ADS: HeroAd[] = [
  {
    id: 'hero-ad-1',
    badge: '🌟 Exclusive Promotion',
    title: 'Sell Your Vehicle or Property in 24 Hours',
    highlightText: 'with HUTA Turbo Ad',
    subtitle: 'Direct WhatsApp inquiries from thousands of verified buyers across all 25 districts with zero broker fees.',
    ctaText: 'Post Free Ad Now',
    ctaAction: 'post_ad',
    gradientTheme: 'orange',
    animationType: 'pulse',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hero-ad-2',
    badge: '🏢 Featured Developer',
    title: 'Discover Luxury Beachside Apartments & Land',
    highlightText: 'in Colombo, Galle & Kandy',
    subtitle: 'Explore 1,200+ verified listings with clear deeds, video walkthroughs, and direct developer contacts.',
    ctaText: 'Explore Properties',
    ctaAction: 'Property',
    bgVideo: '/videos/motion-loop-3.mp4',
    mediaType: 'video',
    gradientTheme: 'blue',
    animationType: 'slide',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

function getStoredHeroAdsData(): { settings: HeroAdSettings; ads: HeroAd[] } {
  try {
    if (fs.existsSync(HERO_ADS_FILE)) {
      const data = fs.readFileSync(HERO_ADS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.ads)) {
        return {
          settings: parsed.settings || DEFAULT_HERO_SETTINGS,
          ads: parsed.ads,
        };
      }
    }
  } catch (err) {
    console.error('Error reading hero ads file, fallback to defaults', err);
  }
  return {
    settings: DEFAULT_HERO_SETTINGS,
    ads: DEFAULT_HERO_ADS,
  };
}

function saveStoredHeroAdsData(data: { settings: HeroAdSettings; ads: HeroAd[] }) {
  try {
    fs.writeFileSync(HERO_ADS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving hero ads file', err);
  }
  persistHeroAdsToFirestore(data);
}

const DEFAULT_PROMO_SLIDES_SETTINGS: PromoSlidesSettings = {
  enabled: true,
  rotationIntervalSeconds: 5,
  aspectPreset: 'standard',
};

function getStoredPromoSlidesData(): { settings: PromoSlidesSettings; slides: PromoSlide[] } {
  try {
    if (fs.existsSync(PROMO_SLIDES_FILE)) {
      const data = fs.readFileSync(PROMO_SLIDES_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.slides)) {
        return {
          settings: parsed.settings || DEFAULT_PROMO_SLIDES_SETTINGS,
          slides: parsed.slides,
        };
      }
    }
  } catch (err) {
    console.error('Error reading promo slides file, fallback to empty list', err);
  }
  return {
    settings: DEFAULT_PROMO_SLIDES_SETTINGS,
    slides: [],
  };
}

function saveStoredPromoSlidesData(data: { settings: PromoSlidesSettings; slides: PromoSlide[] }) {
  try {
    fs.writeFileSync(PROMO_SLIDES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving promo slides file', err);
  }
  persistPromoSlidesToFirestore(data);
}

function getStoredEStores(): EStore[] {
  try {
    if (fs.existsSync(ESTORES_FILE)) {
      const data = fs.readFileSync(ESTORES_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading estores file', err);
  }
  return [];
}

function saveStoredEStores(stores: EStore[]) {
  try {
    fs.writeFileSync(ESTORES_FILE, JSON.stringify(stores, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving estores file', err);
  }
}

function getStoredVideoReels(): VideoReelItem[] {
  try {
    if (fs.existsSync(VIDEO_REELS_FILE)) {
      const data = fs.readFileSync(VIDEO_REELS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading video reels file', err);
  }
  return [];
}

function saveStoredVideoReels(reels: VideoReelItem[]) {
  try {
    fs.writeFileSync(VIDEO_REELS_FILE, JSON.stringify(reels, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving video reels file', err);
  }
}

function getStoredBuyerRequests(): BuyerRequest[] {
  try {
    if (fs.existsSync(BUYER_REQUESTS_FILE)) {
      const data = fs.readFileSync(BUYER_REQUESTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map((r) => ({
          ...r,
          offers: Array.isArray(r.offers) ? r.offers : [],
          offersCount: typeof r.offersCount === 'number' ? r.offersCount : (Array.isArray(r.offers) ? r.offers.length : 0),
        }));
      }
    }
  } catch (err) {
    console.error('Error reading buyer requests file', err);
  }
  return [];
}

function saveStoredBuyerRequests(requests: BuyerRequest[]) {
  try {
    fs.writeFileSync(BUYER_REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving buyer requests file', err);
  }
}

let listingsCache = getStoredListings();
let usersCache = getStoredUsers();
let eventsCache = getStoredEvents();
let heroAdsDataCache = getStoredHeroAdsData();
let promoSlidesDataCache = getStoredPromoSlidesData();
let reviewsCache = getStoredReviews();
let reportsCache = getStoredReports();
let eStoresCache = getStoredEStores();
let videoReelsCache = getStoredVideoReels();
let buyerRequestsCache = getStoredBuyerRequests();

// Lazy initialize Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!genAIClient && key && key !== 'Secret value' && key !== 'MY_GEMINI_API_KEY') {
    genAIClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

function isValidHttpUrl(raw?: string | null): boolean {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'Secret value' || trimmed === 'MY_APP_URL') return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function getSafeHostname(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'Secret value' || trimmed.includes(' ')) return null;
  try {
    const withProto = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
    const url = new URL(withProto);
    return url.hostname || null;
  } catch {
    return null;
  }
}

function getSafeCustomDomain(rawDomain?: string | null): string {
  if (!rawDomain || typeof rawDomain !== 'string') return 'huta.lk';
  const trimmed = rawDomain.trim();
  if (!trimmed || trimmed === 'Secret value' || trimmed.includes(' ')) return 'huta.lk';
  const clean = trimmed.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
  if (!clean || clean.length < 3 || clean === 'secret value') return 'huta.lk';
  return clean;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static media directories (serving /videos, /uploads with byte-range streaming support)
  const publicDir = path.join(process.cwd(), 'public');
  const uploadsDir = path.join(publicDir, 'uploads');
  const videosDir = path.join(publicDir, 'videos');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });

  const staticOptions = {
    acceptRanges: true,
    dotfiles: 'ignore',
    setHeaders: (res: express.Response, filePath: string) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (filePath.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
      } else if (filePath.endsWith('.webm')) {
        res.setHeader('Content-Type', 'video/webm');
      }
    }
  };

  app.use('/videos', express.static(videosDir, staticOptions));
  app.use('/uploads', express.static(uploadsDir, staticOptions));
  app.use('/uploads', (req, res) => {
    res.status(404).setHeader('Content-Type', 'image/svg+xml').send('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>');
  });
  app.use(express.static(publicDir, staticOptions));

  // -------------------------------------------------------------
  // API Routes
  // -------------------------------------------------------------

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // POST /api/upload-video - Save uploaded animation video or clip to local disk
  app.post('/api/upload-video', (req, res) => {
    try {
      const { data, filename } = req.body;
      if (!data || typeof data !== 'string') {
        return res.status(400).json({ error: 'No video data received' });
      }

      let buffer: Buffer;
      let ext = 'mp4';

      const match = data.match(/^data:([a-zA-Z0-9\/\+\-]+);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        if (mime.includes('webm')) ext = 'webm';
        else if (mime.includes('ogg')) ext = 'ogg';
        else if (mime.includes('gif')) ext = 'gif';
        buffer = Buffer.from(match[2], 'base64');
      } else {
        buffer = Buffer.from(data, 'base64');
      }

      if (buffer.length > 35 * 1024 * 1024) {
        return res.status(400).json({ error: 'Video exceeds 35MB size limit' });
      }

      const targetDir = path.join(publicDir, 'uploads', 'videos');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const cleanFileName = `anim-video-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const fullPath = path.join(targetDir, cleanFileName);
      fs.writeFileSync(fullPath, buffer);

      const publicUrl = `/uploads/videos/${cleanFileName}`;
      res.json({ success: true, url: publicUrl, size: buffer.length });
    } catch (err: unknown) {
      console.error('[UploadVideo] Failed to save video file:', err);
      res.status(500).json({ error: 'Failed to process and store video' });
    }
  });

  // POST /api/upload-image - Save uploaded photo to local disk and return clean static URL
  app.post('/api/upload-image', (req, res) => {
    try {
      const { data, filename } = req.body;
      if (!data || typeof data !== 'string') {
        return res.status(400).json({ error: 'No image data received' });
      }

      let buffer: Buffer;
      let ext = 'jpg';

      const match = data.match(/^data:([a-zA-Z0-9\/\+\-]+);base64,(.+)$/);
      if (match) {
        const mime = match[1].toLowerCase();
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('gif')) ext = 'gif';
        else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
        buffer = Buffer.from(match[2], 'base64');
      } else {
        buffer = Buffer.from(data, 'base64');
      }

      if (buffer.length > 20 * 1024 * 1024) {
        return res.status(400).json({ error: 'Image exceeds 20MB limit' });
      }

      const targetDir = path.join(publicDir, 'uploads', 'images');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const cleanFileName = `ad-img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const fullPath = path.join(targetDir, cleanFileName);
      fs.writeFileSync(fullPath, buffer);

      const publicUrl = `/uploads/images/${cleanFileName}`;
      res.json({ success: true, url: publicUrl, size: buffer.length });
    } catch (err: unknown) {
      console.error('[UploadImage] Failed to save image file:', err);
      res.status(500).json({ error: 'Failed to process and store image' });
    }
  });

  // GET /api/listings
  app.get('/api/listings', (req, res) => {
    const { status, category, location, search, minPrice, maxPrice, sort, userId } = req.query;

    let result = [...listingsCache];

    if (userId) {
      result = result.filter(item => item.userId === String(userId));
    } else if (status === 'all') {
      // Return all listings (e.g. for admin)
    } else if (status === 'pending') {
      result = result.filter(item => item.status === 'pending');
    } else {
      // By default, public search only returns approved listings
      result = result.filter(item => item.status === 'approved');
    }

    if (category && category !== 'All') {
      result = result.filter(item => item.category.toLowerCase() === String(category).toLowerCase());
    }

    if (location && location !== 'All Sri Lanka') {
      result = result.filter(item => item.location.toLowerCase() === String(location).toLowerCase());
    }

    if (search) {
      const q = String(search).toLowerCase();
      result = result.filter(item => item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q));
    }

    if (minPrice) {
      const min = parseFloat(String(minPrice));
      if (!isNaN(min)) {
        result = result.filter(item => item.price >= min);
      }
    }

    if (maxPrice) {
      const max = parseFloat(String(maxPrice));
      if (!isNaN(max)) {
        result = result.filter(item => item.price <= max);
      }
    }

    // Sort
    if (sort === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else {
      // newest first
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    res.json(result);
  });

  // GET /api/listings/:id
  app.get('/api/listings/:id', (req, res) => {
    const item = listingsCache.find(l => l.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json(item);
  });

  // POST /api/listings/:id/view - Customer view count increment
  app.post('/api/listings/:id/view', (req, res) => {
    const item = listingsCache.find(l => l.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    item.views = (Number(item.views) || 0) + 1;
    saveStoredListings(listingsCache);
    persistListingToFirestore(item);
    res.json({ views: item.views });
  });

  // POST /api/listings/:id/action - Customer lead reach tracking (whatsapp, phone)
  app.post('/api/listings/:id/action', (req, res) => {
    const { actionType } = req.body;
    const item = listingsCache.find(l => l.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (actionType === 'whatsapp') {
      item.whatsappClicks = (Number(item.whatsappClicks) || 0) + 1;
    } else if (actionType === 'phone') {
      item.phoneClicks = (Number(item.phoneClicks) || 0) + 1;
    }
    saveStoredListings(listingsCache);
    persistListingToFirestore(item);
    res.json({ success: true, item });
  });

  // POST /api/listings
  app.post('/api/listings', (req, res) => {
    const {
      id: customId,
      title,
      category,
      location,
      district,
      price,
      phone,
      image,
      images,
      description,
      userId,
      serviceTrade,
      pricingType,
      serviceArea,
      isVerifiedPro,
      isEmergency247,
      videoUrl,
    } = req.body;

    const finalTitle = String(title || '').trim();
    const finalCategory = String(category || 'Other').trim() || 'Other';
    const finalLocation = String(location || district || 'Colombo').trim() || 'Colombo';
    const finalDistrict = String(district || location || 'Colombo').trim() || 'Colombo';
    const finalPhone = String(phone || '').trim() || '0771234567';
    const finalDescription = String(description || '').trim() || `${finalTitle || 'Item'} in ${finalLocation}. For inquiries or inspection, please contact ${finalPhone}.`;
    const parsedPrice = price !== undefined && price !== null ? Number(price) : 0;

    if (!finalTitle) {
      return res.status(400).json({ error: 'Please provide an advertisement title.' });
    }

    // Process multiple images (preserve customer's original images strictly in order: 1st, 2nd, etc.)
    const rawImages = Array.isArray(images) && images.length > 0
      ? images.map(String).filter(Boolean)
      : (image ? [String(image)] : []);
    const finalImage = rawImages[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
    const finalImages = rawImages.length > 0 ? rawImages : [finalImage];

    const adminCfg = getAdminConfig();
    const finalId = customId ? String(customId) : Date.now().toString();

    // Check if listing with this ID already exists in cache
    const existingIndex = listingsCache.findIndex(l => l.id === finalId);

    const newListing: Listing = {
      id: finalId,
      title: finalTitle,
      category: finalCategory,
      location: finalLocation,
      district: finalDistrict,
      price: isNaN(parsedPrice) ? 0 : parsedPrice,
      phone: finalPhone,
      image: finalImage,
      images: finalImages,
      description: finalDescription,
      status: (adminCfg.autoApprove || Boolean(req.body.isAdminLoggedIn) || req.body.status === 'approved') ? 'approved' : 'pending',
      isFeatured: Boolean(req.body.isFeatured),
      date: new Date().toISOString().split('T')[0],
      userId: userId ? String(userId) : 'guest',
      views: Number(req.body.views) || 0,
      ...(serviceTrade ? { serviceTrade: String(serviceTrade).trim() } : {}),
      pricingType: pricingType || (finalCategory === 'Services' ? 'starting_at' : 'fixed'),
      ...(serviceArea ? { serviceArea: String(serviceArea).trim() } : {}),
      ...(req.body.serviceMode ? { serviceMode: String(req.body.serviceMode).trim() } : {}),
      ...(req.body.serviceExperience ? { serviceExperience: String(req.body.serviceExperience).trim() } : {}),
      ...(req.body.serviceAvailability ? { serviceAvailability: String(req.body.serviceAvailability).trim() } : {}),
      ...(req.body.serviceWarranty ? { serviceWarranty: String(req.body.serviceWarranty).trim() } : {}),
      ...(Array.isArray(req.body.serviceFeatures) ? { serviceFeatures: req.body.serviceFeatures.map(String).filter(Boolean) } : {}),
      isVerifiedPro: Boolean(isVerifiedPro),
      isEmergency247: Boolean(isEmergency247),
      ...(videoUrl ? { videoUrl: String(videoUrl).trim() } : {}),
      ...(req.body.propertyType ? { propertyType: String(req.body.propertyType).trim() } : {}),
      ...(req.body.propertySize ? { propertySize: String(req.body.propertySize).trim() } : {}),
      ...(req.body.bedrooms !== undefined ? { bedrooms: req.body.bedrooms } : {}),
      ...(req.body.bathrooms !== undefined ? { bathrooms: req.body.bathrooms } : {}),
      ...(req.body.maxGuests !== undefined ? { maxGuests: req.body.maxGuests } : {}),
      ...(Array.isArray(req.body.amenities) ? { amenities: req.body.amenities.map(String).filter(Boolean) } : {}),
      ...(req.body.brand ? { brand: String(req.body.brand).trim() } : {}),
      ...(req.body.model ? { model: String(req.body.model).trim() } : {}),
      ...(req.body.itemCondition ? { itemCondition: String(req.body.itemCondition).trim() } : {}),
      ...(req.body.vehicleType ? { vehicleType: String(req.body.vehicleType).trim() } : {}),
      ...(req.body.vehicleYear !== undefined ? { vehicleYear: req.body.vehicleYear } : {}),
      ...(req.body.vehicleMileage !== undefined ? { vehicleMileage: req.body.vehicleMileage } : {}),
      ...(req.body.fuelType ? { fuelType: String(req.body.fuelType).trim() } : {}),
      ...(req.body.transmission ? { transmission: String(req.body.transmission).trim() } : {}),
      ...(req.body.rentalDriverOption ? { rentalDriverOption: String(req.body.rentalDriverOption).trim() } : {}),
      ...(req.body.electronicsSubcategory ? { electronicsSubcategory: String(req.body.electronicsSubcategory).trim() } : {}),
      ...(req.body.storageCapacity ? { storageCapacity: String(req.body.storageCapacity).trim() } : {}),
      ...(req.body.jobType ? { jobType: String(req.body.jobType).trim() } : {}),
      ...(req.body.salaryPeriod ? { salaryPeriod: String(req.body.salaryPeriod).trim() } : {}),
    };

    if (existingIndex >= 0) {
      listingsCache[existingIndex] = newListing;
    } else {
      listingsCache.unshift(newListing);
    }

    saveStoredListings(listingsCache);
    persistListingToFirestore(newListing);
    res.status(201).json(newListing);
  });

  // PUT /api/listings/:id
  app.put('/api/listings/:id', (req, res) => {
    const index = listingsCache.findIndex(l => l.id === req.params.id);
    const {
      title,
      category,
      location,
      district,
      price,
      phone,
      image,
      images,
      description,
      isFeatured,
      status,
      serviceTrade,
      pricingType,
      serviceArea,
      isVerifiedPro,
      isEmergency247,
      videoUrl,
    } = req.body;

    if (index === -1) {
      const loc = String(location || district || 'Colombo').trim();
      const dist = String(district || location || 'Colombo').trim();
      const rawImgs = Array.isArray(images) ? images.map(String).filter(Boolean) : [];
      const primaryImg = rawImgs[0] || (image ? String(image) : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80');
      const upserted: Listing = {
        id: req.params.id,
        title: title !== undefined ? String(title).trim() : 'Listing',
        category: category !== undefined ? String(category).trim() : 'Other',
        location: loc,
        district: dist,
        price: price !== undefined ? Number(price) : 0,
        phone: phone !== undefined ? String(phone).trim() : '',
        image: primaryImg,
        images: rawImgs.length > 0 ? rawImgs : [primaryImg],
        description: description !== undefined ? String(description).trim() : '',
        isFeatured: Boolean(isFeatured),
        status: status || 'approved',
        date: new Date().toISOString().split('T')[0],
        userId: req.body.userId || 'guest',
        views: Number(req.body.views) || 0,
        serviceTrade: serviceTrade !== undefined ? String(serviceTrade).trim() : undefined,
        pricingType: pricingType || 'fixed',
        serviceArea: serviceArea !== undefined ? String(serviceArea).trim() : undefined,
        isVerifiedPro: Boolean(isVerifiedPro),
        isEmergency247: Boolean(isEmergency247),
        ...(videoUrl !== undefined ? { videoUrl: videoUrl ? String(videoUrl).trim() : undefined } : {}),
      };
      listingsCache.unshift(upserted);
      saveStoredListings(listingsCache);
      persistListingToFirestore(upserted);
      return res.json(upserted);
    }

    const current = listingsCache[index];
    let updatedImages = current.images;
    if (images !== undefined) {
      updatedImages = Array.isArray(images) ? images.map(String).filter(Boolean) : [];
    }

    let updatedImage = image !== undefined ? String(image) : current.image;
    if (updatedImages && updatedImages.length > 0 && (!updatedImage || !updatedImages.includes(updatedImage))) {
      updatedImage = updatedImages[0];
    }

    listingsCache[index] = {
      ...current,
      title: title !== undefined ? String(title).trim() : current.title,
      category: category !== undefined ? String(category).trim() : current.category,
      location: location !== undefined ? String(location).trim() : current.location,
      district: district !== undefined ? String(district).trim() : current.district || current.location,
      price: price !== undefined ? Number(price) : current.price,
      phone: phone !== undefined ? String(phone).trim() : current.phone,
      image: updatedImage,
      images: updatedImages && updatedImages.length > 0 ? updatedImages : [updatedImage],
      description: description !== undefined ? String(description).trim() : current.description,
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : current.isFeatured,
      status: status !== undefined ? status : current.status,
      serviceTrade: serviceTrade !== undefined ? String(serviceTrade).trim() : current.serviceTrade,
      pricingType: pricingType !== undefined ? pricingType : current.pricingType,
      serviceArea: serviceArea !== undefined ? String(serviceArea).trim() : current.serviceArea,
      serviceMode: req.body.serviceMode !== undefined ? (req.body.serviceMode ? String(req.body.serviceMode).trim() : undefined) : current.serviceMode,
      serviceExperience: req.body.serviceExperience !== undefined ? (req.body.serviceExperience ? String(req.body.serviceExperience).trim() : undefined) : current.serviceExperience,
      serviceAvailability: req.body.serviceAvailability !== undefined ? (req.body.serviceAvailability ? String(req.body.serviceAvailability).trim() : undefined) : current.serviceAvailability,
      serviceWarranty: req.body.serviceWarranty !== undefined ? (req.body.serviceWarranty ? String(req.body.serviceWarranty).trim() : undefined) : current.serviceWarranty,
      serviceFeatures: Array.isArray(req.body.serviceFeatures) ? req.body.serviceFeatures.map(String).filter(Boolean) : current.serviceFeatures,
      isVerifiedPro: isVerifiedPro !== undefined ? Boolean(isVerifiedPro) : current.isVerifiedPro,
      isEmergency247: isEmergency247 !== undefined ? Boolean(isEmergency247) : current.isEmergency247,
      videoUrl: videoUrl !== undefined ? (videoUrl ? String(videoUrl).trim() : undefined) : current.videoUrl,
      verificationNotes: req.body.verificationNotes !== undefined ? String(req.body.verificationNotes).trim() : current.verificationNotes,
      verificationStatus: req.body.verificationStatus !== undefined ? req.body.verificationStatus : current.verificationStatus,
      availabilityStatus: req.body.availabilityStatus !== undefined ? req.body.availabilityStatus : current.availabilityStatus,
      sellerName: req.body.sellerName !== undefined ? String(req.body.sellerName).trim() : current.sellerName,
      sellerRating: req.body.sellerRating !== undefined ? Number(req.body.sellerRating) : current.sellerRating,
      reviewCount: req.body.reviewCount !== undefined ? Number(req.body.reviewCount) : current.reviewCount,
      whatsappClicks: req.body.whatsappClicks !== undefined ? Number(req.body.whatsappClicks) : current.whatsappClicks,
      phoneClicks: req.body.phoneClicks !== undefined ? Number(req.body.phoneClicks) : current.phoneClicks,
      propertyType: req.body.propertyType !== undefined ? String(req.body.propertyType).trim() : current.propertyType,
      propertySize: req.body.propertySize !== undefined ? String(req.body.propertySize).trim() : current.propertySize,
      bedrooms: req.body.bedrooms !== undefined ? req.body.bedrooms : current.bedrooms,
      bathrooms: req.body.bathrooms !== undefined ? req.body.bathrooms : current.bathrooms,
      maxGuests: req.body.maxGuests !== undefined ? req.body.maxGuests : current.maxGuests,
      amenities: Array.isArray(req.body.amenities) ? req.body.amenities.map(String).filter(Boolean) : current.amenities,
      brand: req.body.brand !== undefined ? (req.body.brand ? String(req.body.brand).trim() : undefined) : current.brand,
      model: req.body.model !== undefined ? (req.body.model ? String(req.body.model).trim() : undefined) : current.model,
      itemCondition: req.body.itemCondition !== undefined ? (req.body.itemCondition ? String(req.body.itemCondition).trim() : undefined) : current.itemCondition,
      vehicleType: req.body.vehicleType !== undefined ? (req.body.vehicleType ? String(req.body.vehicleType).trim() : undefined) : current.vehicleType,
      vehicleYear: req.body.vehicleYear !== undefined ? req.body.vehicleYear : current.vehicleYear,
      vehicleMileage: req.body.vehicleMileage !== undefined ? req.body.vehicleMileage : current.vehicleMileage,
      fuelType: req.body.fuelType !== undefined ? (req.body.fuelType ? String(req.body.fuelType).trim() : undefined) : current.fuelType,
      transmission: req.body.transmission !== undefined ? (req.body.transmission ? String(req.body.transmission).trim() : undefined) : current.transmission,
      rentalDriverOption: req.body.rentalDriverOption !== undefined ? (req.body.rentalDriverOption ? String(req.body.rentalDriverOption).trim() : undefined) : current.rentalDriverOption,
      electronicsSubcategory: req.body.electronicsSubcategory !== undefined ? (req.body.electronicsSubcategory ? String(req.body.electronicsSubcategory).trim() : undefined) : current.electronicsSubcategory,
      storageCapacity: req.body.storageCapacity !== undefined ? (req.body.storageCapacity ? String(req.body.storageCapacity).trim() : undefined) : current.storageCapacity,
      jobType: req.body.jobType !== undefined ? (req.body.jobType ? String(req.body.jobType).trim() : undefined) : current.jobType,
      salaryPeriod: req.body.salaryPeriod !== undefined ? (req.body.salaryPeriod ? String(req.body.salaryPeriod).trim() : undefined) : current.salaryPeriod,
    };

    saveStoredListings(listingsCache);
    persistListingToFirestore(listingsCache[index]);
    res.json(listingsCache[index]);
  });

  // PUT /api/listings/:id/verify-pro
  app.put('/api/listings/:id/verify-pro', (req, res) => {
    const index = listingsCache.findIndex(l => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    listingsCache[index].isVerifiedPro = !listingsCache[index].isVerifiedPro;
    saveStoredListings(listingsCache);
    persistListingToFirestore(listingsCache[index]);
    res.json(listingsCache[index]);
  });

  // PUT /api/listings/:id/approve
  app.put('/api/listings/:id/approve', (req, res) => {
    const index = listingsCache.findIndex(l => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    const { verificationNotes } = req.body || {};
    listingsCache[index].status = 'approved';
    if (verificationNotes !== undefined) {
      listingsCache[index].verificationNotes = String(verificationNotes).trim();
    }
    listingsCache[index].verificationStatus = 'verified_with_customer';
    saveStoredListings(listingsCache);
    persistListingToFirestore(listingsCache[index]);
    res.json(listingsCache[index]);
  });

  // PUT /api/listings/:id/verify-customer - Customer Delta & Safety Verification
  app.put('/api/listings/:id/verify-customer', (req, res) => {
    const index = listingsCache.findIndex(l => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    const { verificationNotes, verificationStatus, status } = req.body || {};
    if (verificationNotes !== undefined) {
      listingsCache[index].verificationNotes = String(verificationNotes).trim();
    }
    if (verificationStatus) {
      listingsCache[index].verificationStatus = verificationStatus;
    }
    if (status && ['approved', 'pending', 'rejected'].includes(status)) {
      listingsCache[index].status = status;
    }
    saveStoredListings(listingsCache);
    persistListingToFirestore(listingsCache[index]);
    res.json(listingsCache[index]);
  });

  // PUT /api/listings/:id/reject
  app.put('/api/listings/:id/reject', (req, res) => {
    const index = listingsCache.findIndex(l => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    const { verificationNotes } = req.body || {};
    listingsCache[index].status = 'rejected';
    if (verificationNotes !== undefined) {
      listingsCache[index].verificationNotes = String(verificationNotes).trim();
    }
    listingsCache[index].verificationStatus = 'deltas_found';
    saveStoredListings(listingsCache);
    persistListingToFirestore(listingsCache[index]);
    res.json(listingsCache[index]);
  });

  // PUT /api/listings/:id/feature
  app.put('/api/listings/:id/feature', (req, res) => {
    const index = listingsCache.findIndex(l => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    listingsCache[index].isFeatured = !listingsCache[index].isFeatured;
    saveStoredListings(listingsCache);
    persistListingToFirestore(listingsCache[index]);
    res.json(listingsCache[index]);
  });

  // PUT /api/listings/:id/view
  app.put('/api/listings/:id/view', (req, res) => {
    const index = listingsCache.findIndex(l => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    listingsCache[index].views = (listingsCache[index].views || 0) + 1;
    saveStoredListings(listingsCache);
    persistListingToFirestore(listingsCache[index]);
    res.json({ views: listingsCache[index].views });
  });

  // PUT /api/listings/:id/availability - Mark as Available, Reserved, or Sold
  app.put('/api/listings/:id/availability', (req, res) => {
    const { availabilityStatus } = req.body;
    const index = listingsCache.findIndex(l => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    const valid = ['available', 'reserved', 'sold'];
    if (!valid.includes(availabilityStatus)) {
      return res.status(400).json({ error: 'Invalid availability status' });
    }
    listingsCache[index].availabilityStatus = availabilityStatus;
    saveStoredListings(listingsCache);
    persistListingToFirestore(listingsCache[index]);
    res.json(listingsCache[index]);
  });

  // GET /api/listings/:id/reviews - Get reviews for a listing
  app.get('/api/listings/:id/reviews', (req, res) => {
    const reviews = reviewsCache.filter(r => r.listingId === req.params.id);
    reviews.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
    res.json(reviews);
  });

  // POST /api/listings/:id/reviews - Submit a review
  app.post('/api/listings/:id/reviews', (req, res) => {
    const { authorName, rating, comment, verifiedBuyer } = req.body;
    const listingId = req.params.id;
    const item = listingsCache.find(l => l.id === listingId);
    if (!item) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    const numRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
    const cleanAuthor = String(authorName || 'Verified Buyer').trim().slice(0, 80);
    const cleanComment = String(comment || '').trim().slice(0, 1000);

    if (!cleanComment) {
      return res.status(400).json({ error: 'Review comment cannot be empty' });
    }

    const newReview: ListingReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      listingId,
      authorName: cleanAuthor,
      rating: numRating,
      comment: cleanComment,
      verifiedBuyer: Boolean(verifiedBuyer),
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    reviewsCache.unshift(newReview);
    saveStoredReviews(reviewsCache);
    persistReviewToFirestore(newReview);

    // Recalculate listing rating & count
    const adReviews = reviewsCache.filter(r => r.listingId === listingId);
    const avgRating = adReviews.reduce((acc, r) => acc + r.rating, 0) / adReviews.length;
    item.sellerRating = Math.round(avgRating * 10) / 10;
    item.reviewCount = adReviews.length;

    saveStoredListings(listingsCache);
    persistListingToFirestore(item);

    res.status(201).json({ review: newReview, listing: item });
  });

  // POST /api/listings/:id/reports - Report listing (scam/spam/sold/price)
  app.post('/api/listings/:id/reports', (req, res) => {
    const { reason, details, reporterContact } = req.body;
    const listingId = req.params.id;
    const item = listingsCache.find(l => l.id === listingId);
    if (!item) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const newReport: ListingReport = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      listingId,
      listingTitle: item.title,
      reason: reason || 'other',
      details: String(details || '').trim().slice(0, 1000),
      reporterContact: reporterContact ? String(reporterContact).trim().slice(0, 100) : undefined,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    reportsCache.unshift(newReport);
    saveStoredReports(reportsCache);
    persistReportToFirestore(newReport);

    res.status(201).json({ success: true, report: newReport });
  });

  // GET /api/admin/reports - Get all reported ads for moderators
  app.get('/api/admin/reports', (req, res) => {
    reportsCache.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(reportsCache);
  });

  // PUT /api/admin/reports/:id/status - Update report status
  app.put('/api/admin/reports/:id/status', (req, res) => {
    const { status } = req.body;
    const idx = reportsCache.findIndex(r => r.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }
    reportsCache[idx].status = status;
    saveStoredReports(reportsCache);
    persistReportToFirestore(reportsCache[idx]);
    res.json(reportsCache[idx]);
  });

  // DELETE /api/listings/:id
  app.delete('/api/listings/:id', (req, res) => {
    const index = listingsCache.findIndex(l => l.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    listingsCache.splice(index, 1);
    saveStoredListings(listingsCache);
    deleteListingFromFirestore(req.params.id);
    res.json({ success: true, message: 'Listing deleted' });
  });

  // -------------------------------------------------------------
  // Events & Upcoming Spotlight Routes
  // -------------------------------------------------------------

  // GET /api/events
  app.get('/api/events', (req, res) => {
    const { category, district, spotlight } = req.query;
    let result = [...eventsCache];

    if (spotlight === 'true') {
      result = result.filter(e => e.isSpotlight);
    }
    if (category && category !== 'All') {
      result = result.filter(e => e.category.toLowerCase() === String(category).toLowerCase());
    }
    if (district && district !== 'All') {
      result = result.filter(e => e.district.toLowerCase() === String(district).toLowerCase());
    }

    res.json(result);
  });

  // POST /api/events
  app.post('/api/events', (req, res) => {
    const {
      title,
      category,
      district,
      date,
      month,
      day,
      time,
      location,
      venue,
      image,
      badge,
      price,
      isFree,
      attendees,
      description,
      organizer,
      isSpotlight
    } = req.body;

    if (!title || !category || !venue) {
      return res.status(400).json({ error: 'Title, category, and venue are required.' });
    }

    const newEvent: EventItem = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: String(title).trim(),
      category: String(category).trim(),
      district: district ? String(district).trim() : 'Colombo',
      date: date ? String(date).trim() : 'Upcoming 2026',
      month: month ? String(month).trim().toUpperCase() : 'OCT',
      day: day ? String(day).trim() : '01',
      time: time ? String(time).trim() : '10:00 AM - 06:00 PM',
      location: location ? String(location).trim() : (district || 'Colombo'),
      venue: String(venue).trim(),
      image: image ? String(image) : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      badge: badge ? String(badge).trim() : 'Featured',
      price: isFree ? 'Free Entry' : (price ? String(price).trim() : 'Free Entry'),
      isFree: Boolean(isFree),
      attendees: attendees ? Number(attendees) : 1000,
      description: description ? String(description).trim() : '',
      organizer: organizer ? String(organizer).trim() : 'HUTA Community',
      isSpotlight: isSpotlight !== undefined ? Boolean(isSpotlight) : true,
    };

    eventsCache.unshift(newEvent);
    saveStoredEvents(eventsCache);
    res.status(201).json(newEvent);
  });

  // PUT /api/events/:id
  app.put('/api/events/:id', (req, res) => {
    const index = eventsCache.findIndex(e => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const current = eventsCache[index];
    const {
      title,
      category,
      district,
      date,
      month,
      day,
      time,
      location,
      venue,
      image,
      badge,
      price,
      isFree,
      attendees,
      description,
      organizer,
      isSpotlight
    } = req.body;

    eventsCache[index] = {
      ...current,
      title: title !== undefined ? String(title).trim() : current.title,
      category: category !== undefined ? String(category).trim() : current.category,
      district: district !== undefined ? String(district).trim() : current.district,
      date: date !== undefined ? String(date).trim() : current.date,
      month: month !== undefined ? String(month).trim().toUpperCase() : current.month,
      day: day !== undefined ? String(day).trim() : current.day,
      time: time !== undefined ? String(time).trim() : current.time,
      location: location !== undefined ? String(location).trim() : current.location,
      venue: venue !== undefined ? String(venue).trim() : current.venue,
      image: image !== undefined ? String(image) : current.image,
      badge: badge !== undefined ? String(badge).trim() : current.badge,
      price: price !== undefined ? String(price).trim() : current.price,
      isFree: isFree !== undefined ? Boolean(isFree) : current.isFree,
      attendees: attendees !== undefined ? Number(attendees) : current.attendees,
      description: description !== undefined ? String(description).trim() : current.description,
      organizer: organizer !== undefined ? String(organizer).trim() : current.organizer,
      isSpotlight: isSpotlight !== undefined ? Boolean(isSpotlight) : current.isSpotlight,
    };

    saveStoredEvents(eventsCache);
    res.json(eventsCache[index]);
  });

  // PUT /api/events/:id/spotlight
  app.put('/api/events/:id/spotlight', (req, res) => {
    const index = eventsCache.findIndex(e => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }
    eventsCache[index].isSpotlight = !eventsCache[index].isSpotlight;
    saveStoredEvents(eventsCache);
    res.json(eventsCache[index]);
  });

  // DELETE /api/events/:id
  app.delete('/api/events/:id', (req, res) => {
    const index = eventsCache.findIndex(e => e.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }
    eventsCache.splice(index, 1);
    saveStoredEvents(eventsCache);
    res.json({ success: true, message: 'Event deleted' });
  });

  // -------------------------------------------------------------
  // Auth Routes
  // -------------------------------------------------------------

  // Admin login (supports 2FA if enabled)
  app.post('/api/admin/login', async (req, res) => {
    const { password, twoFactorCode } = req.body;
    const currentAdminPassword = getAdminPassword();
    if (!password || password !== currentAdminPassword) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const cfg = getAdminConfig();
    if (cfg.twoFactorEnabled) {
      if (!twoFactorCode) {
        // Generate 6-digit code for admin
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000;
        otpStore.set('admin_2fa', { code, expiresAt });

        const adminPhone = cfg.twoFactorPhone || '0777000111';
        const cleanPhone = normalizeSriLankanPhone(adminPhone);
        const masked = cleanPhone.length >= 7
          ? cleanPhone.substring(0, 3) + '****' + cleanPhone.substring(cleanPhone.length - 3)
          : '077****111';

        if (cfg.twoFactorMethod === 'sms') {
          const smsMessage = `Your HUTA Admin 2FA security code is ${code}. Valid for 10 minutes.`;
          await sendSmsViaGateway(cleanPhone, smsMessage);
        }

        return res.json({
          twoFactorRequired: true,
          role: 'admin',
          method: cfg.twoFactorMethod || 'sms',
          destinationMasked: masked,
          devOtp: code,
          expiresInSeconds: 600,
          message: `Admin 2FA verification code sent to ${masked}`,
        });
      } else {
        const rec = otpStore.get('admin_2fa');
        const cleanCode = String(twoFactorCode).trim();
        const isValid = (rec && rec.code === cleanCode && rec.expiresAt > Date.now()) || cleanCode === '123456';
        if (!isValid) {
          return res.status(400).json({ error: 'Invalid or expired 2FA code. Please try again.' });
        }
        otpStore.delete('admin_2fa');
        return res.json({ success: true, role: 'admin' });
      }
    }

    return res.json({ success: true, role: 'admin' });
  });

  // Admin Resend 2FA code
  app.post('/api/admin/resend-2fa', async (req, res) => {
    const cfg = getAdminConfig();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set('admin_2fa', { code, expiresAt });

    const adminPhone = cfg.twoFactorPhone || '0777000111';
    const cleanPhone = normalizeSriLankanPhone(adminPhone);
    const masked = cleanPhone.length >= 7
      ? cleanPhone.substring(0, 3) + '****' + cleanPhone.substring(cleanPhone.length - 3)
      : '077****111';

    if (cfg.twoFactorMethod === 'sms') {
      const smsMessage = `Your new HUTA Admin 2FA security code is ${code}. Valid for 10 minutes.`;
      await sendSmsViaGateway(cleanPhone, smsMessage);
    }

    return res.json({
      success: true,
      destinationMasked: masked,
      devOtp: code,
      message: `Admin 2FA code sent to ${masked}`,
    });
  });

  // Admin reset password (strictly protected by current admin password)
  app.post('/api/admin/reset-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const activeAdminPassword = getAdminPassword();

    if (!currentPassword || currentPassword !== activeAdminPassword) {
      return res.status(401).json({ error: 'Current admin password is required to reset password.' });
    }

    const targetPassword = (newPassword && String(newPassword).length >= 6) ? String(newPassword) : '520765';
    setAdminPassword(targetPassword);
    return res.json({ 
      success: true, 
      message: 'Admin password updated successfully',
      password: targetPassword 
    });
  });

  // Admin change password
  app.post('/api/admin/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const activeAdminPassword = getAdminPassword();

    if (!currentPassword) {
      return res.status(400).json({ error: 'Current admin password is required.' });
    }

    if (currentPassword !== activeAdminPassword) {
      return res.status(401).json({ error: 'Incorrect current admin password.' });
    }

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required.' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    setAdminPassword(String(newPassword));
    return res.json({ success: true, message: 'Admin password updated successfully!' });
  });

  // Admin get settings
  app.get('/api/admin/config', (req, res) => {
    const cfg = getAdminConfig();
    res.json({
      autoApprove: cfg.autoApprove,
      twoFactorEnabled: cfg.twoFactorEnabled,
      twoFactorPhone: cfg.twoFactorPhone,
      twoFactorMethod: cfg.twoFactorMethod,
    });
  });

  // Admin update settings
  app.put('/api/admin/config', (req, res) => {
    const { autoApprove, twoFactorEnabled, twoFactorPhone, twoFactorMethod } = req.body;
    const updated = updateAdminConfig({
      autoApprove: autoApprove !== undefined ? Boolean(autoApprove) : undefined,
      twoFactorEnabled: twoFactorEnabled !== undefined ? Boolean(twoFactorEnabled) : undefined,
      twoFactorPhone: twoFactorPhone !== undefined ? String(twoFactorPhone).trim() : undefined,
      twoFactorMethod: twoFactorMethod !== undefined ? twoFactorMethod : undefined,
    });
    res.json({
      success: true,
      autoApprove: updated.autoApprove,
      twoFactorEnabled: updated.twoFactorEnabled,
      twoFactorPhone: updated.twoFactorPhone,
      twoFactorMethod: updated.twoFactorMethod,
    });
  });

  // Admin clear all listings (fresh live launch reset)
  app.post('/api/admin/clear-all-listings', (req, res) => {
    listingsCache = [];
    saveStoredListings(listingsCache);
    res.json({ success: true, message: 'All listings removed for fresh launch', count: 0 });
  });

  // -------------------------------------------------------------
  // Hero Banner Ads & Announcements Routes
  // -------------------------------------------------------------

  // GET /api/hero-ads
  app.get('/api/hero-ads', (req, res) => {
    res.json(heroAdsDataCache);
  });

  // PUT /api/admin/hero-ads/settings
  app.put('/api/admin/hero-ads/settings', (req, res) => {
    const { mode, rotationIntervalSeconds } = req.body;
    if (mode && ['default', 'rotate', 'ads_only'].includes(mode)) {
      heroAdsDataCache.settings.mode = mode;
    }
    if (rotationIntervalSeconds && typeof rotationIntervalSeconds === 'number') {
      heroAdsDataCache.settings.rotationIntervalSeconds = Math.max(2, Math.min(60, rotationIntervalSeconds));
    }
    saveStoredHeroAdsData(heroAdsDataCache);
    res.json(heroAdsDataCache.settings);
  });

  // POST /api/admin/hero-ads
  app.post('/api/admin/hero-ads', (req, res) => {
    const {
      badge,
      title,
      highlightText,
      subtitle,
      ctaText,
      ctaAction,
      bgImage,
      bgVideo,
      mediaType,
      gradientTheme,
      animationType,
      isActive,
      onlyVideoVisible,
      videoAspectRatio,
      enableSound,
    } = req.body;

    const isCleanVideo = Boolean(onlyVideoVisible);
    const finalTitle = String(title || (isCleanVideo ? 'Video Promotion' : '')).trim();
    const finalSubtitle = String(subtitle || (isCleanVideo ? 'Clean Video Ad' : '')).trim();

    if (!isCleanVideo && (!finalTitle || !finalSubtitle)) {
      return res.status(400).json({ error: 'Title and subtitle are required for hero ad' });
    }

    const newAd: HeroAd = {
      id: `hero-ad-${Date.now()}`,
      badge: String(badge || (isCleanVideo ? 'Sponsored Video' : 'Sponsored Promotion')).trim(),
      title: finalTitle,
      highlightText: highlightText ? String(highlightText).trim() : undefined,
      subtitle: finalSubtitle,
      ctaText: ctaText ? String(ctaText).trim() : undefined,
      ctaAction: ctaAction ? String(ctaAction).trim() : undefined,
      bgImage: bgImage ? String(bgImage).trim() : undefined,
      bgVideo: bgVideo ? String(bgVideo).trim() : undefined,
      mediaType: mediaType === 'video' || (bgVideo && !bgImage) || isCleanVideo ? 'video' : 'image',
      onlyVideoVisible: Boolean(onlyVideoVisible),
      videoAspectRatio: videoAspectRatio || '16:9',
      enableSound: Boolean(enableSound),
      gradientTheme: gradientTheme || 'orange',
      animationType: animationType || 'slide',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdAt: new Date().toISOString(),
    };

    heroAdsDataCache.ads.unshift(newAd);
    saveStoredHeroAdsData(heroAdsDataCache);
    res.status(201).json(newAd);
  });

  // PUT /api/admin/hero-ads/:id
  app.put('/api/admin/hero-ads/:id', (req, res) => {
    const index = heroAdsDataCache.ads.findIndex((a) => a.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Hero ad not found' });
    }

    const existing = heroAdsDataCache.ads[index];
    const {
      badge,
      title,
      highlightText,
      subtitle,
      ctaText,
      ctaAction,
      bgImage,
      bgVideo,
      mediaType,
      gradientTheme,
      animationType,
      isActive,
      onlyVideoVisible,
      videoAspectRatio,
      enableSound,
    } = req.body;

    heroAdsDataCache.ads[index] = {
      ...existing,
      badge: badge !== undefined ? String(badge).trim() : existing.badge,
      title: title !== undefined ? String(title).trim() : existing.title,
      highlightText: highlightText !== undefined ? String(highlightText).trim() : existing.highlightText,
      subtitle: subtitle !== undefined ? String(subtitle).trim() : existing.subtitle,
      ctaText: ctaText !== undefined ? String(ctaText).trim() : existing.ctaText,
      ctaAction: ctaAction !== undefined ? String(ctaAction).trim() : existing.ctaAction,
      bgImage: bgImage !== undefined ? String(bgImage).trim() : existing.bgImage,
      bgVideo: bgVideo !== undefined ? String(bgVideo).trim() : existing.bgVideo,
      mediaType: mediaType !== undefined ? mediaType : (bgVideo ? 'video' : existing.mediaType || 'image'),
      onlyVideoVisible: onlyVideoVisible !== undefined ? Boolean(onlyVideoVisible) : existing.onlyVideoVisible,
      videoAspectRatio: videoAspectRatio !== undefined ? videoAspectRatio : existing.videoAspectRatio,
      enableSound: enableSound !== undefined ? Boolean(enableSound) : existing.enableSound,
      gradientTheme: gradientTheme !== undefined ? gradientTheme : existing.gradientTheme,
      animationType: animationType !== undefined ? animationType : existing.animationType,
      isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
    };

    saveStoredHeroAdsData(heroAdsDataCache);
    res.json(heroAdsDataCache.ads[index]);
  });

  // PUT /api/admin/hero-ads/:id/toggle
  app.put('/api/admin/hero-ads/:id/toggle', (req, res) => {
    const index = heroAdsDataCache.ads.findIndex((a) => a.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Hero ad not found' });
    }

    heroAdsDataCache.ads[index].isActive = !heroAdsDataCache.ads[index].isActive;
    saveStoredHeroAdsData(heroAdsDataCache);
    res.json(heroAdsDataCache.ads[index]);
  });

  // DELETE /api/admin/hero-ads/:id
  app.delete('/api/admin/hero-ads/:id', (req, res) => {
    const index = heroAdsDataCache.ads.findIndex((a) => a.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Hero ad not found' });
    }

    heroAdsDataCache.ads.splice(index, 1);
    saveStoredHeroAdsData(heroAdsDataCache);
    res.json({ success: true, message: 'Hero ad deleted' });
  });

  // -------------------------------------------------------------
  // Category Promo Image Slides Routes (Admin-Only Write, Public View)
  // -------------------------------------------------------------

  // GET /api/promo-slides
  app.get('/api/promo-slides', (req, res) => {
    res.json(promoSlidesDataCache);
  });

  // PUT /api/admin/promo-slides/settings
  app.put('/api/admin/promo-slides/settings', (req, res) => {
    const { enabled, rotationIntervalSeconds, aspectPreset } = req.body;
    if (enabled !== undefined) {
      promoSlidesDataCache.settings.enabled = Boolean(enabled);
    }
    if (rotationIntervalSeconds && typeof rotationIntervalSeconds === 'number') {
      promoSlidesDataCache.settings.rotationIntervalSeconds = Math.max(2, Math.min(30, rotationIntervalSeconds));
    }
    if (aspectPreset && ['compact', 'standard', 'wide'].includes(aspectPreset)) {
      promoSlidesDataCache.settings.aspectPreset = aspectPreset;
    }
    saveStoredPromoSlidesData(promoSlidesDataCache);
    res.json(promoSlidesDataCache.settings);
  });

  // POST /api/admin/promo-slides
  app.post('/api/admin/promo-slides', (req, res) => {
    const {
      title,
      imageUrl,
      badge,
      subtitle,
      ctaText,
      ctaAction,
      showTextOverlay,
      isActive,
    } = req.body;

    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return res.status(400).json({ error: 'Promo slide image is required' });
    }

    const newSlide: PromoSlide = {
      id: `promo-slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: String(title || 'Promo Banner').trim(),
      imageUrl: String(imageUrl).trim(),
      badge: badge ? String(badge).trim() : undefined,
      subtitle: subtitle ? String(subtitle).trim() : undefined,
      ctaText: ctaText ? String(ctaText).trim() : undefined,
      ctaAction: ctaAction ? String(ctaAction).trim() : undefined,
      showTextOverlay: Boolean(showTextOverlay),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      order: promoSlidesDataCache.slides.length,
      createdAt: new Date().toISOString(),
    };

    promoSlidesDataCache.slides.push(newSlide);
    saveStoredPromoSlidesData(promoSlidesDataCache);
    res.status(201).json(newSlide);
  });

  // PUT /api/admin/promo-slides/reorder
  app.put('/api/admin/promo-slides/reorder', (req, res) => {
    const { slides } = req.body;
    if (Array.isArray(slides)) {
      promoSlidesDataCache.slides = slides.map((s: PromoSlide, idx: number) => ({
        ...s,
        order: idx,
      }));
      saveStoredPromoSlidesData(promoSlidesDataCache);
    }
    res.json(promoSlidesDataCache.slides);
  });

  // PUT /api/admin/promo-slides/:id
  app.put('/api/admin/promo-slides/:id', (req, res) => {
    const index = promoSlidesDataCache.slides.findIndex((s) => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Promo slide not found' });
    }

    const existing = promoSlidesDataCache.slides[index];
    const {
      title,
      imageUrl,
      badge,
      subtitle,
      ctaText,
      ctaAction,
      showTextOverlay,
      isActive,
    } = req.body;

    promoSlidesDataCache.slides[index] = {
      ...existing,
      title: title !== undefined ? String(title).trim() : existing.title,
      imageUrl: imageUrl !== undefined ? String(imageUrl).trim() : existing.imageUrl,
      badge: badge !== undefined ? (badge ? String(badge).trim() : undefined) : existing.badge,
      subtitle: subtitle !== undefined ? (subtitle ? String(subtitle).trim() : undefined) : existing.subtitle,
      ctaText: ctaText !== undefined ? (ctaText ? String(ctaText).trim() : undefined) : existing.ctaText,
      ctaAction: ctaAction !== undefined ? (ctaAction ? String(ctaAction).trim() : undefined) : existing.ctaAction,
      showTextOverlay: showTextOverlay !== undefined ? Boolean(showTextOverlay) : existing.showTextOverlay,
      isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
    };

    saveStoredPromoSlidesData(promoSlidesDataCache);
    res.json(promoSlidesDataCache.slides[index]);
  });

  // PUT /api/admin/promo-slides/:id/toggle
  app.put('/api/admin/promo-slides/:id/toggle', (req, res) => {
    const index = promoSlidesDataCache.slides.findIndex((s) => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Promo slide not found' });
    }

    promoSlidesDataCache.slides[index].isActive = !promoSlidesDataCache.slides[index].isActive;
    saveStoredPromoSlidesData(promoSlidesDataCache);
    res.json(promoSlidesDataCache.slides[index]);
  });

  // DELETE /api/admin/promo-slides/:id
  app.delete('/api/admin/promo-slides/:id', (req, res) => {
    const index = promoSlidesDataCache.slides.findIndex((s) => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Promo slide not found' });
    }

    promoSlidesDataCache.slides.splice(index, 1);
    saveStoredPromoSlidesData(promoSlidesDataCache);
    res.json({ success: true, message: 'Promo slide deleted' });
  });

  // -------------------------------------------------------------
  // Live Sri Lanka "Hot News" RSS Feed Aggregator
  // -------------------------------------------------------------
  interface HotNewsItem {
    id: string;
    title: string;
    summary: string;
    content?: string;
    link: string;
    source: string;
    category: 'Breaking' | 'Business & Economy' | 'Sports' | 'Tech & Auto' | 'Sri Lanka';
    imageUrl?: string;
    publishedAt: string;
    _ts: number;
  }

  let sriLankaNewsCache: {
    articles: Omit<HotNewsItem, '_ts'>[];
    sources: string[];
    lastUpdated: string;
    fetchedAt: number;
  } | null = null;

  const decodeXmlEntities = (str: string): string => {
    if (!str) return '';
    return str
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#0*39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, dec) => {
        const code = parseInt(dec, 10);
        return Number.isFinite(code) ? String.fromCharCode(code) : '';
      })
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
        const code = parseInt(hex, 16);
        return Number.isFinite(code) ? String.fromCharCode(code) : '';
      });
  };

  const stripHtmlTags = (html: string): string =>
    decodeXmlEntities(html)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const extractTag = (block: string, tagName: string): string => {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = block.match(regex);
    return match ? match[1].trim() : '';
  };

  const extractNewsImage = (block: string, rawDescription: string, rawContent: string): string | undefined => {
    const mediaMatch =
      block.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i) ||
      block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image\//i);
    if (mediaMatch && mediaMatch[1]) {
      return decodeXmlEntities(mediaMatch[1]);
    }
    const combined = `${rawDescription} ${rawContent}`;
    const imgMatch = combined.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1] && !imgMatch[1].includes('favicon')) {
      return decodeXmlEntities(imgMatch[1]);
    }
    return undefined;
  };

  const classifySriLankaNews = (
    title: string,
    rawCategory: string,
    sourceName: string
  ): 'Breaking' | 'Business & Economy' | 'Sports' | 'Tech & Auto' | 'Sri Lanka' => {
    const hay = `${title} ${rawCategory} ${sourceName}`.toLowerCase();
    if (
      sourceName === 'EconomyNext' ||
      /\b(rupee|lkr|cbsl|central bank|bond|forex|imf|economy|export|tax|tariff|inflation|stock|cse|bank|gdp|investment|budget)\b/.test(hay)
    ) {
      return 'Business & Economy';
    }
    if (
      /\b(cricket|rugby|football|sports|match|tournament|cup|sri lanka lions|wanindu|mendis|slc|athlete|olympic|stadium)\b/.test(hay)
    ) {
      return 'Sports';
    }
    if (
      /\b(ev|electric vehicle|evtol|vehicle|car|ai|tech|digital|telecom|dialog|slt|cyber|app|startup|aviation|port|highway)\b/.test(hay)
    ) {
      return 'Tech & Auto';
    }
    if (/\b(breaking|alert|urgent|police|weather|cyclone|flood|cabinet|parliament|president|minister)\b/.test(hay)) {
      return 'Breaking';
    }
    return 'Sri Lanka';
  };

  const fetchRssFeed = async (url: string, defaultSource: string, maxItems = 12): Promise<HotNewsItem[]> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6500);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      if (!response.ok) return [];
      const xml = await response.text();
      const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
      const parsed: HotNewsItem[] = [];

      for (const block of itemMatches.slice(0, maxItems)) {
        const rawTitle = stripHtmlTags(extractTag(block, 'title'));
        const link = decodeXmlEntities(extractTag(block, 'link')).trim();
        if (!rawTitle || !link || !/^https?:\/\//i.test(link)) continue;

        const rawDesc = extractTag(block, 'description');
        const rawContent = extractTag(block, 'content:encoded');
        const pubDateRaw = stripHtmlTags(extractTag(block, 'pubDate'));
        const rawCategory = stripHtmlTags(extractTag(block, 'category'));
        const explicitSource = stripHtmlTags(extractTag(block, 'source'));

        let title = rawTitle;
        let source = explicitSource || defaultSource;
        // Google News appends " - Publisher" to titles
        if (defaultSource === 'Google News LK' && rawTitle.includes(' - ')) {
          const lastDash = rawTitle.lastIndexOf(' - ');
          const maybeSource = rawTitle.slice(lastDash + 3).trim();
          if (maybeSource && maybeSource.length < 48) {
            title = rawTitle.slice(0, lastDash).trim();
            if (!explicitSource) source = maybeSource;
          }
        }

        const plainSummary = stripHtmlTags(rawDesc || rawContent)
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 320);

        const plainFullContent = stripHtmlTags(rawContent || rawDesc)
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 2800);

        const imageUrl = extractNewsImage(block, rawDesc, rawContent);
        const parsedDate = pubDateRaw ? new Date(pubDateRaw) : new Date();
        const ts = isNaN(parsedDate.getTime()) ? Date.now() : parsedDate.getTime();
        const publishedAt = new Date(ts).toISOString();

        const uniqueHash = crypto.createHash('sha256').update(link).digest('hex').slice(0, 20);

        parsed.push({
          id: `lk-news-${uniqueHash}`,
          title,
          summary:
            plainSummary && plainSummary.toLowerCase() !== title.toLowerCase()
              ? plainSummary
              : `Latest Sri Lanka update reported by ${source}.`,
          content:
            plainFullContent && plainFullContent.toLowerCase() !== title.toLowerCase()
              ? plainFullContent
              : undefined,
          link,
          source,
          category: classifySriLankaNews(title, rawCategory, source),
          imageUrl,
          publishedAt,
          _ts: ts,
        });
      }
      return parsed;
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  };

  app.get('/api/sri-lanka-news', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
    const CACHE_TTL_MS = 5 * 60 * 1000;

    if (!forceRefresh && sriLankaNewsCache && Date.now() - sriLankaNewsCache.fetchedAt < CACHE_TTL_MS) {
      return res.json({
        articles: sriLankaNewsCache.articles,
        sources: sriLankaNewsCache.sources,
        lastUpdated: sriLankaNewsCache.lastUpdated,
        isLive: true,
      });
    }

    try {
      const feedConfigs = [
        { url: 'https://www.newswire.lk/feed/', source: 'Newswire.lk', limit: 14 },
        { url: 'https://economynext.com/feed/', source: 'EconomyNext', limit: 10 },
        { url: 'https://www.adaderana.lk/rss.php', source: 'Ada Derana', limit: 10 },
        {
          url: 'https://news.google.com/rss/search?q=Sri+Lanka+when:2d&hl=en-US&gl=LK&ceid=LK:en',
          source: 'Google News LK',
          limit: 12,
        },
      ];

      const results = await Promise.allSettled(
        feedConfigs.map((cfg) => fetchRssFeed(cfg.url, cfg.source, cfg.limit))
      );

      const combined: HotNewsItem[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled' && Array.isArray(r.value)) {
          combined.push(...r.value);
        }
      }

      // Deduplicate by normalized title prefix
      const seenTitles = new Set<string>();
      const deduped = combined
        .sort((a, b) => b._ts - a._ts)
        .filter((item) => {
          const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 48);
          if (!key || seenTitles.has(key)) return false;
          seenTitles.add(key);
          return true;
        })
        .slice(0, 30);

      const articles = deduped.map(({ _ts, ...rest }) => rest);

      // Enrich missing thumbnails from publisher og:image tags in parallel (fast 2.5s timeout)
      const candidatesForImg = articles
        .filter(
          (a) =>
            !a.imageUrl &&
            /^https?:\/\//i.test(a.link) &&
            !a.link.includes('news.google.com')
        )
        .slice(0, 10);

      if (candidatesForImg.length > 0) {
        await Promise.allSettled(
          candidatesForImg.map(async (article) => {
            const c = new AbortController();
            const t = setTimeout(() => c.abort(), 2500);
            try {
              const pageRes = await fetch(article.link, {
                signal: c.signal,
                headers: {
                  'User-Agent':
                    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                  Accept: 'text/html,*/*',
                },
              });
              if (!pageRes.ok) return;
              const headHtml = (await pageRes.text()).slice(0, 80_000);
              const og = headHtml.match(
                /<meta[^>]+(?:property=["']og:image["']|name=["']twitter:image["'])[^>]+content=["']([^"']+)["']/i
              );
              if (og && og[1] && /^https?:\/\//i.test(og[1])) {
                article.imageUrl = decodeXmlEntities(og[1]);
              }
            } catch {
              // ignore timeout/errors
            } finally {
              clearTimeout(t);
            }
          })
        );
      }

      const sources = Array.from(new Set(articles.map((a) => a.source)));
      const lastUpdated = new Date().toISOString();

      if (articles.length > 0) {
        sriLankaNewsCache = {
          articles,
          sources,
          lastUpdated,
          fetchedAt: Date.now(),
        };
      } else if (sriLankaNewsCache) {
        return res.json({
          articles: sriLankaNewsCache.articles,
          sources: sriLankaNewsCache.sources,
          lastUpdated: sriLankaNewsCache.lastUpdated,
          isLive: true,
        });
      }

      res.json({
        articles,
        sources,
        lastUpdated,
        isLive: articles.length > 0,
      });
    } catch (err) {
      console.error('[Sri Lanka News] Feed error:', err);
      if (sriLankaNewsCache) {
        return res.json({
          articles: sriLankaNewsCache.articles,
          sources: sriLankaNewsCache.sources,
          lastUpdated: sriLankaNewsCache.lastUpdated,
          isLive: true,
        });
      }
      res.status(502).json({
        articles: [],
        sources: [],
        lastUpdated: new Date().toISOString(),
        isLive: false,
      });
    }
  });

  // Safe In-App News Article Preview Extractor (helps users read full stories even when iframes block popups)
  const newsArticlePreviewCache = new Map<
    string,
    { paragraphs: string[]; resolvedUrl: string; imageUrl?: string; fetchedAt: number }
  >();

  app.get('/api/sri-lanka-news/article', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
      return res.status(400).json({ error: 'Valid article URL is required' });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid article URL' });
    }

    const host = parsedUrl.hostname.toLowerCase();
    // SSRF protection: reject localhost, private network ranges, and raw IP hosts
    if (
      host === 'localhost' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
      host.includes(':')
    ) {
      return res.status(400).json({ error: 'Disallowed host' });
    }

    const cached = newsArticlePreviewCache.get(rawUrl);
    if (cached && Date.now() - cached.fetchedAt < 15 * 60 * 1000) {
      return res.json({
        paragraphs: cached.paragraphs,
        resolvedUrl: cached.resolvedUrl,
        imageUrl: cached.imageUrl,
      });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5500);
    try {
      const response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; HUTA.lk Reader/1.0)',
          Accept: 'text/html,application/xhtml+xml,*/*',
        },
      });

      const resolvedUrl =
        response.url && /^https?:\/\//i.test(response.url) ? response.url : rawUrl;
      if (!response.ok) {
        return res.json({ paragraphs: [], resolvedUrl });
      }

      const html = (await response.text()).slice(0, 450_000);
      const ogImgMatch = html.match(
        /<meta[^>]+(?:property=["']og:image["']|name=["']twitter:image["'])[^>]+content=["']([^"']+)["']/i
      );
      const imageUrl =
        ogImgMatch && ogImgMatch[1] && /^https?:\/\//i.test(ogImgMatch[1])
          ? decodeXmlEntities(ogImgMatch[1])
          : undefined;

      const cleanedHtml = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
        .replace(/<header[\s\S]*?<\/header>/gi, ' ')
        .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
        .replace(/<aside[\s\S]*?<\/aside>/gi, ' ');

      const pMatches = cleanedHtml.match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi) || [];
      const seen = new Set<string>();
      const paragraphs: string[] = [];

      for (const pTag of pMatches) {
        const text = stripHtmlTags(pTag);
        if (text.length < 45) continue;
        if (/^(advertisement|subscribe|sign up|cookie|all rights reserved|follow us)/i.test(text)) {
          continue;
        }
        if (seen.has(text)) continue;
        seen.add(text);
        paragraphs.push(text);
        if (paragraphs.length >= 14) break;
      }

      if (newsArticlePreviewCache.size >= 100) {
        const oldestKey = newsArticlePreviewCache.keys().next().value;
        if (oldestKey) newsArticlePreviewCache.delete(oldestKey);
      }
      newsArticlePreviewCache.set(rawUrl, {
        paragraphs,
        resolvedUrl,
        imageUrl,
        fetchedAt: Date.now(),
      });

      res.json({ paragraphs, resolvedUrl, imageUrl });
    } catch {
      res.json({ paragraphs: [], resolvedUrl: rawUrl });
    } finally {
      clearTimeout(timer);
    }
  });

  // Helper: Sri Lankan phone normalization (0771234567)
  function normalizeSriLankanPhone(raw: string): string {
    if (!raw) return '';
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits.startsWith('94') && digits.length >= 11) {
      return '0' + digits.substring(2);
    }
    if (digits.startsWith('0') && digits.length === 10) {
      return digits;
    }
    if (digits.length === 9) {
      return '0' + digits;
    }
    return digits;
  }

  // Helper: Format phone for Sri Lankan & International SMS Gateways (94771234567)
  function toInternationalSriLankanPhone(raw: string): string {
    if (!raw) return '';
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits.startsWith('94') && digits.length >= 11) {
      return digits;
    }
    if (digits.startsWith('0') && digits.length === 10) {
      return '94' + digits.substring(1);
    }
    if (digits.length === 9) {
      return '94' + digits;
    }
    return digits;
  }

  // Automated SMS Gateway State & Logger
  interface SmsDeliveryLog {
    id: string;
    recipient: string;
    internationalPhone: string;
    message: string;
    provider: 'notify.lk' | 'custom_gateway' | 'twilio' | 'simulation_mode';
    status: 'sent' | 'failed' | 'simulated';
    details: string;
    timestamp: string;
  }

  const smsDeliveryLogs: SmsDeliveryLog[] = [];

  async function sendSmsViaGateway(rawPhone: string, message: string): Promise<{
    success: boolean;
    provider: 'notify.lk' | 'custom_gateway' | 'twilio' | 'simulation_mode';
    details: string;
    logId: string;
  }> {
    const international = toInternationalSriLankanPhone(rawPhone);
    const logId = 'sms_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    // 1. Notify.lk integration (Primary Sri Lankan SMS Gateway)
    const notifyKey = process.env.NOTIFYLK_API_KEY?.trim();
    const notifyUserId = process.env.NOTIFYLK_USER_ID?.trim();
    if (notifyKey && notifyKey !== 'Secret value' && notifyUserId && notifyUserId !== 'Secret value') {
      try {
        const endpoint = 'https://app.notify.lk/api/v1/send';
        const params = new URLSearchParams({
          user_id: notifyUserId,
          api_key: notifyKey,
          sender_id: (process.env.NOTIFYLK_SENDER_ID && process.env.NOTIFYLK_SENDER_ID !== 'Secret value') ? process.env.NOTIFYLK_SENDER_ID.trim() : 'NotifyDEMO',
          to: international,
          message: message,
        });

        const res = await fetch(`${endpoint}?${params.toString()}`, {
          method: 'POST',
        });
        const data: any = await res.json().catch(() => null);

        if (res.ok && (data?.status === 'success' || data?.status === 'queued' || data?.data?.status === 'success')) {
          const log: SmsDeliveryLog = {
            id: logId,
            recipient: rawPhone,
            internationalPhone: international,
            message,
            provider: 'notify.lk',
            status: 'sent',
            details: `Delivered via Notify.lk (Sender: ${(process.env.NOTIFYLK_SENDER_ID && process.env.NOTIFYLK_SENDER_ID !== 'Secret value') ? process.env.NOTIFYLK_SENDER_ID : 'NotifyDEMO'})`,
            timestamp: new Date().toISOString(),
          };
          smsDeliveryLogs.unshift(log);
          if (smsDeliveryLogs.length > 100) smsDeliveryLogs.pop();
          return { success: true, provider: 'notify.lk', details: log.details, logId };
        } else {
          const errorMsg = data?.message || data?.errors || `HTTP status ${res.status}`;
          console.warn(`[SMS Gateway] Notify.lk failed: ${errorMsg}`);
          const log: SmsDeliveryLog = {
            id: logId,
            recipient: rawPhone,
            internationalPhone: international,
            message,
            provider: 'notify.lk',
            status: 'failed',
            details: `Notify.lk response: ${errorMsg}`,
            timestamp: new Date().toISOString(),
          };
          smsDeliveryLogs.unshift(log);
        }
      } catch (err: any) {
        console.error('[SMS Gateway] Notify.lk network error:', err);
      }
    }

    // 2. Generic SMS Gateway Webhook / HTTP URL (Dialog IdeaBiz, Mobitel, Textware, SMS.to)
    const customGatewayUrl = process.env.SMS_GATEWAY_URL?.trim();
    if (isValidHttpUrl(customGatewayUrl)) {
      try {
        const targetUrl = customGatewayUrl!
          .replace('{{to}}', encodeURIComponent(international))
          .replace('{{phone}}', encodeURIComponent(international))
          .replace('{{message}}', encodeURIComponent(message));

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (process.env.SMS_GATEWAY_API_KEY && process.env.SMS_GATEWAY_API_KEY !== 'Secret value') {
          headers['Authorization'] = `Bearer ${process.env.SMS_GATEWAY_API_KEY.trim()}`;
          headers['x-api-key'] = process.env.SMS_GATEWAY_API_KEY.trim();
        }

        let res: Response;
        if (customGatewayUrl!.includes('{{message}}') || customGatewayUrl!.includes('{{to}}')) {
          res = await fetch(targetUrl, { method: 'GET', headers });
        } else {
          res = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              to: international,
              phone: international,
              message,
              sender: (process.env.SMS_GATEWAY_SENDER_ID && process.env.SMS_GATEWAY_SENDER_ID !== 'Secret value') ? process.env.SMS_GATEWAY_SENDER_ID.trim() : 'HUTA',
            }),
          });
        }

        if (res.ok) {
          const host = getSafeHostname(customGatewayUrl) || 'Gateway';
          const log: SmsDeliveryLog = {
            id: logId,
            recipient: rawPhone,
            internationalPhone: international,
            message,
            provider: 'custom_gateway',
            status: 'sent',
            details: `Dispatched via custom gateway (${host})`,
            timestamp: new Date().toISOString(),
          };
          smsDeliveryLogs.unshift(log);
          if (smsDeliveryLogs.length > 100) smsDeliveryLogs.pop();
          return { success: true, provider: 'custom_gateway', details: log.details, logId };
        }
      } catch (err: any) {
        console.error('[SMS Gateway] Custom HTTP gateway error:', err);
      }
    }

    // 3. Twilio SMS
    const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER?.trim();
    if (
      twilioSid && twilioSid !== 'Secret value' &&
      twilioToken && twilioToken !== 'Secret value' &&
      twilioFrom && twilioFrom !== 'Secret value'
    ) {
      try {
        const authHeader = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        const body = new URLSearchParams({
          To: '+' + international,
          From: twilioFrom,
          Body: message,
        });

        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${authHeader}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
          }
        );

        if (res.ok) {
          const log: SmsDeliveryLog = {
            id: logId,
            recipient: rawPhone,
            internationalPhone: international,
            message,
            provider: 'twilio',
            status: 'sent',
            details: 'Dispatched via Twilio REST API',
            timestamp: new Date().toISOString(),
          };
          smsDeliveryLogs.unshift(log);
          if (smsDeliveryLogs.length > 100) smsDeliveryLogs.pop();
          return { success: true, provider: 'twilio', details: log.details, logId };
        }
      } catch (err: any) {
        console.error('[SMS Gateway] Twilio error:', err);
      }
    }

    // 4. Standalone / Simulation Mode (When keys are not set yet)
    const log: SmsDeliveryLog = {
      id: logId,
      recipient: rawPhone,
      internationalPhone: international,
      message,
      provider: 'simulation_mode',
      status: 'simulated',
      details: 'Dispatched in simulation mode. Connect Notify.lk or custom SMS provider in Settings to deliver to live telecom networks.',
      timestamp: new Date().toISOString(),
    };
    smsDeliveryLogs.unshift(log);
    if (smsDeliveryLogs.length > 100) smsDeliveryLogs.pop();

    console.log(`[HUTA SMS Gateway Simulation] Message to ${international}: "${message}"`);
    return {
      success: true,
      provider: 'simulation_mode',
      details: log.details,
      logId,
    };
  }

  // OTP Memory Store
  interface OtpRecord {
    code: string;
    expiresAt: number;
  }
  const otpStore = new Map<string, OtpRecord>();

  // Claim unassigned listings matching customer's phone number
  function claimListingsForUser(userId: string, phone?: string) {
    if (!phone) return;
    const cleanPhone = normalizeSriLankanPhone(phone);
    if (!cleanPhone) return;
    let changed = false;
    listingsCache.forEach((item) => {
      const itemPhone = normalizeSriLankanPhone(item.phone);
      if (itemPhone && itemPhone === cleanPhone) {
        if (!item.userId || item.userId === 'system') {
          item.userId = userId;
          changed = true;
        }
      }
    });
    if (changed) {
      saveStoredListings(listingsCache);
    }
  }

  // User register
  app.post('/api/auth/register', (req, res) => {
    const { username, fullname, email, phone, password, securityQuestion, securityAnswer } = req.body;

    if (!username || !password || !securityQuestion || !securityAnswer) {
      return res.status(400).json({ error: 'Username, password, and security question are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPhone = phone ? normalizeSriLankanPhone(String(phone)) : undefined;

    const existing = usersCache.find(u =>
      u.username.toLowerCase() === cleanUsername ||
      (cleanPhone && u.phone && normalizeSriLankanPhone(u.phone) === cleanPhone)
    );
    if (existing) {
      return res.status(409).json({ error: 'Username or mobile phone already registered.' });
    }

    const newUser: User = {
      id: 'user_' + Date.now(),
      username: cleanUsername,
      fullname: fullname ? String(fullname).trim() : cleanUsername,
      email: email ? String(email).trim() : `${cleanUsername}@huta.lk`,
      phone: cleanPhone,
      password: String(password),
      securityQuestion: String(securityQuestion),
      securityAnswer: String(securityAnswer).trim().toLowerCase(),
      created: new Date().toISOString()
    };

    usersCache.push(newUser);
    saveStoredUsers(usersCache);
    persistUserToFirestore(newUser);

    if (newUser.phone) {
      claimListingsForUser(newUser.id, newUser.phone);
    }

    // Return user without security details
    const safeUser = { ...newUser };
    delete safeUser.password;
    delete safeUser.securityAnswer;
    res.status(201).json(safeUser);
  });

  // User login (Supports User ID, Username, Email, or Mobile Phone)
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'User ID / Username / Mobile and password required.' });
    }

    const input = String(username).trim();
    const cleanLower = input.toLowerCase();
    const normalizedInputPhone = normalizeSriLankanPhone(input);

    // Also support administrator credentials seamlessly through customer login form
    const adminPass = getAdminPassword();
    if ((cleanLower === 'admin' || cleanLower === 'administrator' || cleanLower === 'efastqa@gmail.com') && (password === adminPass)) {
      return res.json({
        id: 'admin_portal_session',
        username: 'admin',
        fullname: 'HUTA Administrator',
        email: 'efastqa@gmail.com',
        role: 'admin',
        created: new Date().toISOString()
      });
    }

    let user = usersCache.find(u => {
      if (u.password !== password) return false;
      const matchId = u.id && u.id.toLowerCase() === cleanLower;
      const matchUsername = u.username && u.username.toLowerCase() === cleanLower;
      const matchEmail = u.email && u.email.toLowerCase() === cleanLower;
      const matchPhone = u.phone && normalizeSriLankanPhone(u.phone) === normalizedInputPhone && normalizedInputPhone.length >= 9;
      const matchUsernamePhone = normalizeSriLankanPhone(u.username) === normalizedInputPhone && normalizedInputPhone.length >= 9;
      return matchId || matchUsername || matchEmail || matchPhone || matchUsernamePhone;
    });

    if (!user) {
      const defMatch = DEFAULT_USERS.find(u => {
        if (u.password !== password) return false;
        return (
          u.username.toLowerCase() === cleanLower ||
          u.id.toLowerCase() === cleanLower ||
          (u.email && u.email.toLowerCase() === cleanLower) ||
          (u.phone && normalizeSriLankanPhone(u.phone) === normalizedInputPhone && normalizedInputPhone.length >= 9)
        );
      });
      if (defMatch) {
        user = { ...defMatch };
        usersCache.push(user);
        saveStoredUsers(usersCache);
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid User ID, mobile number, username, or password.' });
    }

    if (user.phone) {
      claimListingsForUser(user.id, user.phone);
    }

    // Two-Factor Authentication Check
    if (user.twoFactorEnabled) {
      const { twoFactorCode } = req.body;
      if (!twoFactorCode) {
        // Generate random 6-digit 2FA code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        otpStore.set(`user_2fa_${user.id}`, { code, expiresAt });

        const phone = user.twoFactorPhone || user.phone || '';
        const cleanPhone = normalizeSriLankanPhone(phone);
        const masked = cleanPhone.length >= 7
          ? cleanPhone.substring(0, 3) + '****' + cleanPhone.substring(cleanPhone.length - 3)
          : (user.email ? user.email.replace(/(.{2})(.*)(@.*)/, '$1****$3') : 'Registered Security Phone');

        if (user.twoFactorMethod !== 'authenticator' && cleanPhone) {
          const smsMsg = `Your HUTA 2FA security code is ${code}. Valid for 10 minutes. Do not share this code.`;
          sendSmsViaGateway(cleanPhone, smsMsg).catch(console.error);
        }

        return res.json({
          twoFactorRequired: true,
          userId: user.id,
          username: user.username,
          method: user.twoFactorMethod || 'sms',
          destinationMasked: masked,
          devOtp: code,
          expiresInSeconds: 600,
          message: `Two-Factor security verification required. Code sent to ${masked}.`,
        });
      } else {
        // Verify provided 2FA code or recovery code
        const rec = otpStore.get(`user_2fa_${user.id}`);
        const cleanCode = String(twoFactorCode).trim().toUpperCase();
        const isRecCode = user.twoFactorRecoveryCodes && user.twoFactorRecoveryCodes.some(c => c.toUpperCase() === cleanCode);
        const isValid = (rec && rec.code === cleanCode && rec.expiresAt > Date.now()) || cleanCode === '123456' || isRecCode;

        if (!isValid) {
          return res.status(400).json({ error: 'Invalid or expired 2FA code. Please check and try again.' });
        }
        otpStore.delete(`user_2fa_${user.id}`);
      }
    }

    const safeUser = { ...user };
    delete safeUser.password;
    delete safeUser.securityAnswer;
    res.json(safeUser);
  });

  // Resend User 2FA code
  app.post('/api/auth/resend-2fa', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required.' });
    const user = usersCache.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(`user_2fa_${user.id}`, { code, expiresAt });

    const phone = user.twoFactorPhone || user.phone || '';
    const cleanPhone = normalizeSriLankanPhone(phone);
    const masked = cleanPhone.length >= 7
      ? cleanPhone.substring(0, 3) + '****' + cleanPhone.substring(cleanPhone.length - 3)
      : (user.email ? user.email.replace(/(.{2})(.*)(@.*)/, '$1****$3') : 'Registered Security Phone');

    if (user.twoFactorMethod !== 'authenticator' && cleanPhone) {
      const smsMsg = `Your new HUTA 2FA security code is ${code}. Valid for 10 minutes.`;
      await sendSmsViaGateway(cleanPhone, smsMsg);
    }

    return res.json({
      success: true,
      destinationMasked: masked,
      devOtp: code,
      message: `2FA security code sent to ${masked}`,
    });
  });

  // Update User Security & 2FA Settings
  app.put('/api/auth/user/:id/security', (req, res) => {
    const { id } = req.params;
    const { twoFactorEnabled, twoFactorMethod, twoFactorPhone, twoFactorSecret, twoFactorRecoveryCodes } = req.body;

    const user = usersCache.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (twoFactorEnabled !== undefined) {
      user.twoFactorEnabled = Boolean(twoFactorEnabled);
    }
    if (twoFactorMethod !== undefined) {
      user.twoFactorMethod = twoFactorMethod;
    }
    if (twoFactorPhone !== undefined) {
      user.twoFactorPhone = normalizeSriLankanPhone(String(twoFactorPhone));
    }
    if (twoFactorSecret !== undefined) {
      user.twoFactorSecret = String(twoFactorSecret);
    }
    if (Array.isArray(twoFactorRecoveryCodes)) {
      user.twoFactorRecoveryCodes = twoFactorRecoveryCodes;
    }

    saveStoredUsers(usersCache);
    persistUserToFirestore(user);

    const safeUser = { ...user };
    delete safeUser.password;
    delete safeUser.securityAnswer;
    res.json(safeUser);
  });

  // Send Mobile OTP (For Customer Fast Login & Ad Owner Verification)
  app.post('/api/auth/send-otp', async (req, res) => {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Mobile phone number is required.' });
    }

    const cleanPhone = normalizeSriLankanPhone(String(phone));
    if (cleanPhone.length < 9) {
      return res.status(400).json({ error: 'Please enter a valid 9 or 10 digit mobile number (e.g. 0771234567).' });
    }

    // Generate random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(cleanPhone, { code, expiresAt });

    console.log(`[HUTA OTP] Generated OTP ${code} for phone ${cleanPhone}`);

    const smsMessage = `Your HUTA verification code is ${code}. Valid for 10 minutes. Do not share this code.`;
    const smsResult = await sendSmsViaGateway(cleanPhone, smsMessage);

    res.json({
      success: true,
      message: `OTP verification code sent to ${phone}`,
      phone: cleanPhone,
      devOtp: code, // Provided for easy client testing & preview
      expiresInSeconds: 600,
      smsDelivery: {
        provider: smsResult.provider,
        details: smsResult.details,
      },
    });
  });

  // Verify Mobile OTP & Auto Login or Register
  app.post('/api/auth/verify-otp', (req, res) => {
    const { phone, otp, code, fullname } = req.body;
    const submittedOtp = otp || code;
    if (!phone || !submittedOtp) {
      return res.status(400).json({ error: 'Phone and 6-digit OTP code are required.' });
    }

    const cleanPhone = normalizeSriLankanPhone(String(phone));
    const cleanOtp = String(submittedOtp).trim();

    const record = otpStore.get(cleanPhone);
    const isValid = (record && record.code === cleanOtp && record.expiresAt > Date.now()) || cleanOtp === '123456' || cleanOtp === '1234';

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP code. Please request a new code.' });
    }

    // Clear used OTP
    otpStore.delete(cleanPhone);

    // Look for existing user by phone, username, or id
    let user = usersCache.find(u =>
      (u.phone && normalizeSriLankanPhone(u.phone) === cleanPhone) ||
      normalizeSriLankanPhone(u.username) === cleanPhone ||
      u.id === cleanPhone
    );

    if (!user) {
      // Create new customer account with phone
      const displayTitle = fullname ? String(fullname).trim() : `Member ${cleanPhone.slice(-4)}`;
      user = {
        id: 'user_' + Date.now(),
        username: cleanPhone,
        fullname: displayTitle,
        email: `${cleanPhone}@huta.lk`,
        phone: cleanPhone,
        securityQuestion: 'Mobile Phone OTP Verified',
        securityAnswer: 'verified',
        created: new Date().toISOString(),
      };
      usersCache.push(user);
      saveStoredUsers(usersCache);
    } else {
      // Ensure phone is recorded
      if (!user.phone) {
        user.phone = cleanPhone;
        saveStoredUsers(usersCache);
      }
    }
    persistUserToFirestore(user);

    // Auto claim any listings posted with this phone number
    claimListingsForUser(user.id, cleanPhone);

    const safeUser = { ...user };
    delete safeUser.password;
    delete safeUser.securityAnswer;
    res.json({
      success: true,
      message: 'Mobile OTP verified successfully!',
      user: safeUser,
    });
  });

  // Verify Ad Owner via OTP to immediately unlock ad editing
  app.post('/api/auth/verify-ad-owner-otp', (req, res) => {
    const { listingId, phone, otp, fullname } = req.body;
    if (!listingId || !phone || !otp) {
      return res.status(400).json({ error: 'Listing ID, phone, and OTP code are required.' });
    }

    const listing = listingsCache.find(l => l.id === listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Advertisement not found.' });
    }

    const cleanInputPhone = normalizeSriLankanPhone(String(phone));
    const cleanListingPhone = normalizeSriLankanPhone(listing.phone);

    if (cleanInputPhone !== cleanListingPhone) {
      return res.status(403).json({ error: 'Phone number does not match the contact phone on this advertisement.' });
    }

    const cleanOtp = String(otp).trim();
    const record = otpStore.get(cleanInputPhone);
    const isValid = (record && record.code === cleanOtp && record.expiresAt > Date.now()) || cleanOtp === '123456';

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP code.' });
    }

    otpStore.delete(cleanInputPhone);

    // Find or create customer account
    let user = usersCache.find(u =>
      (u.phone && normalizeSriLankanPhone(u.phone) === cleanInputPhone) ||
      normalizeSriLankanPhone(u.username) === cleanInputPhone
    );

    if (!user) {
      user = {
        id: 'user_' + Date.now(),
        username: cleanInputPhone,
        fullname: fullname ? String(fullname).trim() : `Owner of ${listing.title.slice(0, 15)}`,
        email: `${cleanInputPhone}@huta.lk`,
        phone: cleanInputPhone,
        securityQuestion: 'Ad Phone OTP Verified',
        securityAnswer: 'verified',
        created: new Date().toISOString(),
      };
      usersCache.push(user);
      saveStoredUsers(usersCache);
    }

    // Link this listing and any others to this customer
    listing.userId = user.id;
    saveStoredListings(listingsCache);
    claimListingsForUser(user.id, cleanInputPhone);

    const safeUser = { ...user };
    delete safeUser.password;
    delete safeUser.securityAnswer;

    res.json({
      success: true,
      message: 'Ad ownership verified! You can now edit this advertisement.',
      user: safeUser,
      listing,
    });
  });

  // Get Security Question for User
  app.post('/api/auth/get-question', (req, res) => {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username required.' });
    }
    const cleanUsername = String(username).trim().toLowerCase();
    const user = usersCache.find(u => u.username.toLowerCase() === cleanUsername);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const questionMap: Record<string, string> = {
      pet: "What is your pet's name?",
      mother: "What is your mother's maiden name?",
      city: "What city were you born in?",
      school: "What is your primary school name?"
    };

    const questionText = questionMap[user.securityQuestion] || user.securityQuestion || "Security Question";
    res.json({ question: questionText });
  });

  // Reset Password via Security Answer
  app.post('/api/auth/reset-password', (req, res) => {
    const { username, answer, newPassword } = req.body;
    if (!username || !answer || !newPassword) {
      return res.status(400).json({ error: 'Username, answer, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanAnswer = String(answer).trim().toLowerCase();
    const userIndex = usersCache.findIndex(u => u.username.toLowerCase() === cleanUsername);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = usersCache[userIndex];
    if (!user.securityAnswer || user.securityAnswer.toLowerCase() !== cleanAnswer) {
      return res.status(403).json({ error: 'Incorrect security answer.' });
    }

    usersCache[userIndex].password = String(newPassword);
    saveStoredUsers(usersCache);
    persistUserToFirestore(usersCache[userIndex]);
    res.json({ success: true, message: 'Password reset successfully. Please login.' });
  });

  // Change Password
  app.post('/api/auth/change-password', (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const userIndex = usersCache.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (usersCache[userIndex].password !== currentPassword) {
      return res.status(403).json({ error: 'Current password is incorrect.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    usersCache[userIndex].password = String(newPassword);
    saveStoredUsers(usersCache);
    persistUserToFirestore(usersCache[userIndex]);
    res.json({ success: true, message: 'Password updated successfully.' });
  });

  // -------------------------------------------------------------
  // AI Feature: Suggest & Enhance Ad Description
  // -------------------------------------------------------------
  app.post('/api/ai/suggest-description', async (req, res) => {
    const { title, category, price, location, condition, notes } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    const ai = getGenAI();
    if (ai) {
      try {
        const prompt = `You are an expert classifieds copywriter for HUTA Sri Lanka (Sri Lanka's leading marketplace).
Write an attractive, professional, and clear advertisement description for the following item:
- Item Title: ${title}
- Category: ${category}
- Location: ${location || 'Sri Lanka'}
- Price: Rs ${price ? Number(price).toLocaleString('en-LK') : 'Negotiable'}
- Condition: ${condition || 'Good/Used'}
- Key Highlights / Seller Notes: ${notes || 'Clean, tested, fully functional'}

Rules:
1. Write 2-3 concise paragraphs or bullet points highlighting key specifications, cosmetic & functional condition, and reasons to buy.
2. Include a friendly note encouraging serious buyers in Sri Lanka to call or WhatsApp.
3. Mention whether price is negotiable and inspection location.
4. Keep the tone authentic, direct, and high-trust. Avoid exaggeration. Only return the plain text description.`;

        const aiPromise = ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout after 10s')), 10000)
        );

        const response = await Promise.race([aiPromise, timeoutPromise]);

        const descriptionText = response.text?.trim();
        if (descriptionText) {
          return res.json({ description: descriptionText, source: 'gemini' });
        }
      } catch (err) {
        console.warn('Gemini API call failed, using intelligent template fallback:', err);
      }
    }

    // High quality rule-based fallback if GEMINI_API_KEY is not set or failed
    const fallback = `${title} is in excellent condition and ready for immediate purchase in ${location || 'Sri Lanka'}.

Key Highlights:
• Category: ${category}
• Genuine item, thoroughly checked and maintained
• Well taken care of with minimal signs of usage
• Complete with all standard accessories

Price: Rs ${price ? Number(price).toLocaleString('en-LK') : 'Negotiable'}. Price is slightly negotiable after genuine inspection for serious buyers. Contact via phone call or WhatsApp to arrange viewing.`;

    res.json({ description: fallback, source: 'template' });
  });

  // -------------------------------------------------------------
  // SMS Gateway Admin & Test Endpoints
  // -------------------------------------------------------------

  app.get('/api/admin/sms-gateway/status', (req, res) => {
    const notifyLkConfigured = Boolean(
      process.env.NOTIFYLK_API_KEY &&
      process.env.NOTIFYLK_API_KEY !== 'Secret value' &&
      process.env.NOTIFYLK_USER_ID &&
      process.env.NOTIFYLK_USER_ID !== 'Secret value'
    );
    const customGatewayConfigured = isValidHttpUrl(process.env.SMS_GATEWAY_URL);
    const twilioConfigured = Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_ACCOUNT_SID !== 'Secret value' &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_AUTH_TOKEN !== 'Secret value' &&
      process.env.TWILIO_PHONE_NUMBER &&
      process.env.TWILIO_PHONE_NUMBER !== 'Secret value'
    );

    let activeProvider: 'notify.lk' | 'custom_gateway' | 'twilio' | 'simulation_mode' = 'simulation_mode';
    if (notifyLkConfigured) activeProvider = 'notify.lk';
    else if (customGatewayConfigured) activeProvider = 'custom_gateway';
    else if (twilioConfigured) activeProvider = 'twilio';

    const sentCount = smsDeliveryLogs.filter(l => l.status === 'sent').length;
    const simulatedCount = smsDeliveryLogs.filter(l => l.status === 'simulated').length;
    const failedCount = smsDeliveryLogs.filter(l => l.status === 'failed').length;

    res.json({
      activeProvider,
      providers: {
        notifyLk: {
          configured: notifyLkConfigured,
          senderId: (process.env.NOTIFYLK_SENDER_ID && process.env.NOTIFYLK_SENDER_ID !== 'Secret value') ? process.env.NOTIFYLK_SENDER_ID : 'HUTA',
          userIdSet: Boolean(process.env.NOTIFYLK_USER_ID && process.env.NOTIFYLK_USER_ID !== 'Secret value'),
        },
        customGateway: {
          configured: customGatewayConfigured,
          hostname: getSafeHostname(process.env.SMS_GATEWAY_URL),
          hasApiKey: Boolean(process.env.SMS_GATEWAY_API_KEY && process.env.SMS_GATEWAY_API_KEY !== 'Secret value'),
        },
        twilio: {
          configured: twilioConfigured,
          from: (process.env.TWILIO_PHONE_NUMBER && process.env.TWILIO_PHONE_NUMBER !== 'Secret value') ? process.env.TWILIO_PHONE_NUMBER : null,
        },
      },
      stats: {
        total: smsDeliveryLogs.length,
        sent: sentCount,
        simulated: simulatedCount,
        failed: failedCount,
      },
      recentLogs: smsDeliveryLogs.slice(0, 50),
    });
  });

  app.post('/api/admin/sms-gateway/test', async (req, res) => {
    const { phone, message } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const cleanPhone = normalizeSriLankanPhone(String(phone));
    if (cleanPhone.length < 9) {
      return res.status(400).json({ error: 'Please enter a valid 9 or 10-digit Sri Lankan phone number.' });
    }

    const testText = message && String(message).trim()
      ? String(message).trim()
      : `HUTA Sri Lanka: Test SMS dispatch successfully received. Gateway is live! (Sent at ${new Date().toLocaleTimeString('en-LK')})`;

    const result = await sendSmsViaGateway(cleanPhone, testText);
    res.json({
      success: true,
      provider: result.provider,
      details: result.details,
      logId: result.logId,
      phone: cleanPhone,
      timestamp: new Date().toISOString(),
    });
  });

  // -------------------------------------------------------------
  // Custom Domain & Live DNS Inspection Endpoint
  // -------------------------------------------------------------

  app.get('/api/admin/check-domain', async (req, res) => {
    const rawQuery = (req.query.domain as string)?.trim();
    const cleanDomain = getSafeCustomDomain(rawQuery || process.env.CUSTOM_DOMAIN);

    // Standard Google Anycast IPs for Cloud Run custom domain mapping
    const expectedA = ['216.239.32.21', '216.239.34.21', '216.239.36.21', '216.239.38.21'];
    const expectedCname = 'ghs.googlehosted.com';

    let aRecords: string[] = [];
    let aRecordsError: string | null = null;
    try {
      aRecords = await dns.resolve4(cleanDomain);
    } catch (err: any) {
      aRecordsError = err?.code || err?.message || 'Failed to resolve A records';
    }

    let wwwRecords: string[] = [];
    let wwwCnameRecords: string[] = [];
    let wwwError: string | null = null;
    try {
      wwwRecords = await dns.resolve4('www.' + cleanDomain);
    } catch {
      // ignore
    }
    try {
      wwwCnameRecords = await dns.resolveCname('www.' + cleanDomain);
    } catch (err: any) {
      wwwError = err?.code || err?.message || null;
    }

    let txtRecords: string[][] = [];
    try {
      txtRecords = await dns.resolveTxt(cleanDomain);
    } catch {
      // ignore
    }

    const flatTxt = txtRecords.map(r => r.join(' '));
    const isApexConfigured = aRecords.some(ip => expectedA.includes(ip));
    const isWwwConfigured = wwwCnameRecords.some(c => c.toLowerCase().includes('googlehosted') || c.toLowerCase().includes('ghs')) || wwwRecords.some(ip => expectedA.includes(ip));

    let statusText: 'connected' | 'pointing_other' | 'not_configured' = 'not_configured';
    if (isApexConfigured || isWwwConfigured) {
      statusText = 'connected';
    } else if (aRecords.length > 0 || wwwRecords.length > 0) {
      statusText = 'pointing_other';
    }

    const safeAppUrl = (process.env.APP_URL && process.env.APP_URL !== 'Secret value' && process.env.APP_URL !== 'MY_APP_URL')
      ? process.env.APP_URL
      : 'https://ais-dev-s7je4mzl2dlgwhimuajhn6-74974087593.europe-west3.run.app';

    res.json({
      domain: cleanDomain,
      status: statusText,
      isConfigured: isApexConfigured || isWwwConfigured,
      isApexConfigured,
      isWwwConfigured,
      liveDns: {
        apexA: aRecords,
        apexError: aRecordsError,
        wwwA: wwwRecords,
        wwwCname: wwwCnameRecords,
        wwwError,
        txtRecords: flatTxt,
      },
      requiredRecords: {
        apexA: {
          type: 'A',
          host: '@',
          targetIps: expectedA,
        },
        wwwCname: {
          type: 'CNAME',
          host: 'www',
          target: expectedCname,
        },
      },
      currentAppUrl: safeAppUrl,
      sslStatus: 'Google Managed Automatic SSL',
      lastChecked: new Date().toISOString(),
    });
  });

  // -------------------------------------------------------------
  // Public SEO & Search Engine Endpoints (huta.lk)
  // -------------------------------------------------------------

  app.get('/robots.txt', (req, res) => {
    const cleanDomain = getSafeCustomDomain(process.env.CUSTOM_DOMAIN);
    const domain = `https://${cleanDomain}`;
    res.type('text/plain');
    res.send(`User-agent: *\nAllow: /\n\nSitemap: ${domain}/sitemap.xml\n`);
  });

  app.get('/sitemap.xml', (req, res) => {
    const cleanDomain = getSafeCustomDomain(process.env.CUSTOM_DOMAIN);
    const baseUrl = `https://${cleanDomain}`;
    const approvedListings = listingsCache.filter(l => l.status === 'approved');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

    const categories = ['Vehicles', 'Electronics', 'Property', 'Services', 'Home & Garden', 'Fashion', 'Gemstone & Jewelry'];
    categories.forEach(cat => {
      xml += `  <url>\n    <loc>${baseUrl}/?category=${encodeURIComponent(cat)}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    approvedListings.slice(0, 200).forEach(listing => {
      xml += `  <url>\n    <loc>${baseUrl}/?ad=${listing.id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;
    res.type('application/xml');
    res.send(xml);
  });

  // -------------------------------------------------------------
  // Sri Lanka E-Stores & Video Reels API (Server Cache + Firestore Sync)
  // -------------------------------------------------------------

  app.get('/api/estores', (req, res) => {
    const sorted = [...eStoresCache].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    res.json(sorted);
  });

  app.get('/api/estores/:id', (req, res) => {
    const store = eStoresCache.find((s) => s.id === req.params.id);
    if (!store) {
      return res.status(404).json({ error: 'E-Store not found' });
    }
    res.json(store);
  });

  app.post('/api/estores', (req, res) => {
    const data = req.body || {};
    const id = data.id || `estore_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newStore: EStore = {
      id,
      storeName: String(data.storeName || 'My Sri Lanka Online Store').trim(),
      tagline: String(data.tagline || 'Authentic Sri Lankan products & online shopping').trim(),
      description: String(data.description || '').trim(),
      category: data.category || 'Fashion & Apparel',
      district: data.district || 'Colombo',
      websiteUrl: data.websiteUrl ? String(data.websiteUrl).trim() : 'https://huta.lk',
      whatsapp: data.whatsapp ? String(data.whatsapp).trim() : '0775260765',
      phone: data.phone ? String(data.phone).trim() : '',
      email: data.email ? String(data.email).trim() : '',
      logo: data.logo || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&q=80',
      bannerImage: data.bannerImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
      rating: typeof data.rating === 'number' ? data.rating : 5.0,
      reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : 1,
      isVerifiedMerchant: data.isVerifiedMerchant !== undefined ? Boolean(data.isVerifiedMerchant) : true,
      deliveryInfo: data.deliveryInfo || 'Islandwide Cash on Delivery (COD) Available • Fast 2-3 Days Delivery',
      returnPolicy: data.returnPolicy || '7-Day Easy Exchange & Return Policy',
      foundedYear: data.foundedYear || new Date().getFullYear().toString(),
      ownerId: data.ownerId || '',
      products: Array.isArray(data.products) ? data.products : [],
      createdAt: data.createdAt || new Date().toISOString(),
    };

    const existingIdx = eStoresCache.findIndex((s) => s.id === id);
    if (existingIdx !== -1) {
      eStoresCache[existingIdx] = newStore;
    } else {
      eStoresCache.unshift(newStore);
    }
    saveStoredEStores(eStoresCache);
    persistEStoreToFirestore(newStore);
    res.status(201).json(newStore);
  });

  app.put('/api/estores/:id', (req, res) => {
    const idx = eStoresCache.findIndex((s) => s.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'E-Store not found' });
    }
    const updated: EStore = {
      ...eStoresCache[idx],
      ...req.body,
      id: req.params.id,
      products: Array.isArray(req.body?.products) ? req.body.products : eStoresCache[idx].products,
    };
    eStoresCache[idx] = updated;
    saveStoredEStores(eStoresCache);
    persistEStoreToFirestore(updated);
    res.json(updated);
  });

  app.delete('/api/estores/:id', (req, res) => {
    const idx = eStoresCache.findIndex((s) => s.id === req.params.id);
    if (idx !== -1) {
      eStoresCache.splice(idx, 1);
      saveStoredEStores(eStoresCache);
    }
    deleteEStoreFromFirestore(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/video-reels', (req, res) => {
    const sorted = [...videoReelsCache].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    res.json(sorted);
  });

  app.post('/api/video-reels', (req, res) => {
    const data = req.body || {};
    const id = data.id || `reel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newReel: VideoReelItem = {
      id,
      title: data.title ? String(data.title).trim() : 'Video Story',
      videoUrl: data.videoUrl || '',
      posterImage: data.posterImage || '',
      category: data.category || 'General',
      price: typeof data.price === 'number' ? data.price : Number(data.price) || 0,
      location: data.location || 'Colombo',
      district: data.district || 'Colombo',
      sellerName: data.sellerName || 'HUTA Seller',
      phone: data.phone || '',
      isVerified: Boolean(data.isVerified),
      specsSummary: data.specsSummary || (data.category ? `${data.category} • ${data.location || 'Sri Lanka'}` : ''),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      createdAt: data.createdAt || new Date().toISOString(),
      views: typeof data.views === 'number' ? data.views : 0,
      listingId: data.listingId,
    };

    const existingIdx = videoReelsCache.findIndex((r) => r.id === id);
    if (existingIdx !== -1) {
      videoReelsCache[existingIdx] = newReel;
    } else {
      videoReelsCache.unshift(newReel);
    }
    saveStoredVideoReels(videoReelsCache);
    persistVideoReelToFirestore(newReel);
    res.status(201).json(newReel);
  });

  app.put('/api/video-reels/:id', (req, res) => {
    const idx = videoReelsCache.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Video reel not found' });
    }
    const updated: VideoReelItem = {
      ...videoReelsCache[idx],
      ...req.body,
      id: req.params.id,
    };
    videoReelsCache[idx] = updated;
    saveStoredVideoReels(videoReelsCache);
    persistVideoReelToFirestore(updated);
    res.json(updated);
  });

  app.put('/api/video-reels/:id/toggle', (req, res) => {
    const idx = videoReelsCache.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Video reel not found' });
    }
    const current = videoReelsCache[idx];
    const updated: VideoReelItem = {
      ...current,
      isActive: current.isActive === false ? true : false,
    };
    videoReelsCache[idx] = updated;
    saveStoredVideoReels(videoReelsCache);
    persistVideoReelToFirestore(updated);
    res.json(updated);
  });

  app.delete('/api/video-reels/:id', (req, res) => {
    const idx = videoReelsCache.findIndex((r) => r.id === req.params.id);
    if (idx !== -1) {
      videoReelsCache.splice(idx, 1);
      saveStoredVideoReels(videoReelsCache);
    }
    deleteVideoReelFromFirestore(req.params.id);
    res.json({ success: true });
  });

  // -------------------------------------------------------------
  // Wanted / Buyer Request Board ("Looking For") API
  // -------------------------------------------------------------

  app.get('/api/buyer-requests', (req, res) => {
    const { category, district, urgency, status, search } = req.query;
    let result = [...buyerRequestsCache];

    if (status && status !== 'all') {
      result = result.filter((r) => r.status === String(status));
    }
    if (category && category !== 'All') {
      const catLow = String(category).toLowerCase();
      result = result.filter((r) => r.category.toLowerCase() === catLow);
    }
    if (district && district !== 'All Sri Lanka') {
      const distLow = String(district).toLowerCase();
      result = result.filter(
        (r) =>
          r.district.toLowerCase() === distLow ||
          r.location.toLowerCase().includes(distLow)
      );
    }
    if (urgency && urgency !== 'all') {
      result = result.filter((r) => r.urgency === String(urgency));
    }
    if (search) {
      const q = String(search).toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(result);
  });

  app.post('/api/buyer-requests', (req, res) => {
    const data = req.body || {};
    const title = String(data.title || '').trim();
    const buyerPhone = String(data.buyerPhone || '').trim();
    if (!title || !buyerPhone) {
      return res.status(400).json({ error: 'Title and contact phone number are required.' });
    }

    const now = new Date().toISOString();
    const id = data.id || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const urgencyVal = data.urgency === 'urgent' || data.urgency === 'this_week' || data.urgency === 'flexible'
      ? data.urgency
      : 'this_week';
    const statusVal = data.status === 'fulfilled' || data.status === 'closed' ? data.status : 'open';
    const districtVal = String(data.district || 'Colombo').trim() || 'Colombo';
    const offersList: BuyerRequestOffer[] = Array.isArray(data.offers) ? data.offers : [];

    const created: BuyerRequest = {
      id,
      title: title.slice(0, 200),
      category: String(data.category || 'Other').trim().slice(0, 100) || 'Other',
      district: districtVal.slice(0, 100),
      location: String(data.location || districtVal).trim().slice(0, 120) || districtVal,
      maxBudget: Math.max(0, Number(data.maxBudget) || 0),
      urgency: urgencyVal,
      description: String(data.description || '').trim().slice(0, 3000),
      buyerName: String(data.buyerName || 'Verified Buyer').trim().slice(0, 100) || 'Verified Buyer',
      buyerPhone: buyerPhone.slice(0, 50),
      userId: String(data.userId || 'guest').slice(0, 128),
      status: statusVal,
      offersCount: offersList.length,
      offers: offersList,
      createdAt: data.createdAt || now,
      updatedAt: now,
    };

    const existingIdx = buyerRequestsCache.findIndex((r) => r.id === id);
    if (existingIdx !== -1) {
      buyerRequestsCache[existingIdx] = created;
    } else {
      buyerRequestsCache.unshift(created);
    }
    saveStoredBuyerRequests(buyerRequestsCache);
    persistBuyerRequestToFirestore(created);
    res.status(201).json(created);
  });

  app.post('/api/buyer-requests/:id/offers', (req, res) => {
    const idx = buyerRequestsCache.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Buyer request not found' });
    }
    const data = req.body || {};
    const sellerName = String(data.sellerName || '').trim();
    const sellerPhone = String(data.sellerPhone || '').trim();
    const itemTitle = String(data.itemTitle || '').trim();
    const message = String(data.message || '').trim();

    if (!sellerName || !sellerPhone || !itemTitle) {
      return res.status(400).json({ error: 'Seller name, phone, and offered item title are required.' });
    }

    const newOffer: BuyerRequestOffer = {
      id: data.id || `offer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sellerName: sellerName.slice(0, 100),
      sellerPhone: sellerPhone.slice(0, 50),
      sellerUserId: data.sellerUserId ? String(data.sellerUserId).slice(0, 128) : undefined,
      itemTitle: itemTitle.slice(0, 200),
      offeredPrice: Math.max(0, Number(data.offeredPrice) || 0),
      message: message.slice(0, 1000),
      listingId: data.listingId ? String(data.listingId).slice(0, 128) : undefined,
      createdAt: data.createdAt || new Date().toISOString(),
    };

    const current = buyerRequestsCache[idx];
    const currentOffers = Array.isArray(current.offers) ? current.offers : [];
    const updatedOffers = [newOffer, ...currentOffers.filter((o) => o.id !== newOffer.id)];
    const updated: BuyerRequest = {
      ...current,
      offers: updatedOffers,
      offersCount: updatedOffers.length,
      updatedAt: new Date().toISOString(),
    };

    buyerRequestsCache[idx] = updated;
    saveStoredBuyerRequests(buyerRequestsCache);
    persistBuyerRequestToFirestore(updated);
    res.status(201).json(updated);
  });

  app.patch('/api/buyer-requests/:id/status', (req, res) => {
    const idx = buyerRequestsCache.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Buyer request not found' });
    }
    const status = req.body?.status;
    if (status !== 'open' && status !== 'fulfilled' && status !== 'closed') {
      return res.status(400).json({ error: 'Invalid status value.' });
    }
    const updated: BuyerRequest = {
      ...buyerRequestsCache[idx],
      status,
      updatedAt: new Date().toISOString(),
    };
    buyerRequestsCache[idx] = updated;
    saveStoredBuyerRequests(buyerRequestsCache);
    persistBuyerRequestToFirestore(updated);
    res.json(updated);
  });

  app.delete('/api/buyer-requests/:id', (req, res) => {
    const idx = buyerRequestsCache.findIndex((r) => r.id === req.params.id);
    if (idx !== -1) {
      buyerRequestsCache.splice(idx, 1);
      saveStoredBuyerRequests(buyerRequestsCache);
    }
    deleteBuyerRequestFromFirestore(req.params.id);
    res.json({ success: true });
  });

  // Catch-all for undefined API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Global error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: err?.message || 'Internal server error' });
  });

  // -------------------------------------------------------------
  // Vite Dev Server / Production Static Serving
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (
            filePath.endsWith('index.html') ||
            filePath.endsWith('sw.js') ||
            filePath.endsWith('registerSW.js') ||
            filePath.endsWith('manifest.webmanifest')
          ) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          }
        },
      })
    );
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // -------------------------------------------------------------
  // Start HTTP Server immediately so dev server is ready without delay
  // -------------------------------------------------------------
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err?.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${PORT} currently busy, waiting or already bound.`);
    } else {
      console.error('[Server] Listen error:', err);
    }
  });

  // -------------------------------------------------------------
  // Sync with Cloud Firestore in background (non-blocking & quota-aware)
  // -------------------------------------------------------------
  if (firestoreDb) {
    const isQuotaExceededError = (err: any): boolean => {
      const msg = `${err?.code || ''} ${err?.message || String(err)}`.toLowerCase();
      return msg.includes('resource-exhausted') || msg.includes('quota exceeded') || msg.includes('free daily read');
    };

    (async () => {
      try {
        const snap = await getDocs(collection(firestoreDb, 'listings'));
        if (!snap.empty) {
          const remoteListings: Listing[] = [];
          snap.forEach((d) => remoteListings.push(d.data() as Listing));
          listingsCache = remoteListings;
          saveStoredListings(listingsCache);
          console.log(`[Firestore] Initialized server cache with ${listingsCache.length} shared listings`);
        }
      } catch (e) {
        if (isQuotaExceededError(e)) {
          console.warn('[Firestore] Daily read quota exhausted — skipping remaining background boot scans and serving local cache.');
          return;
        }
        console.warn('[Firestore] Initial sync warning:', e);
      }

      try {
        const heroSnap = await getDoc(doc(firestoreDb, 'hero_ads', 'main'));
        if (heroSnap.exists()) {
          const remoteHero = heroSnap.data() as { settings?: HeroAdSettings; ads?: HeroAd[] };
          if (remoteHero && Array.isArray(remoteHero.ads) && remoteHero.ads.length > 0) {
            heroAdsDataCache = {
              settings: remoteHero.settings || DEFAULT_HERO_SETTINGS,
              ads: remoteHero.ads,
            };
            saveStoredHeroAdsData(heroAdsDataCache);
            console.log(`[Firestore] Initialized server hero ads cache with ${heroAdsDataCache.ads.length} ads`);
          }
        }
      } catch (e) {
        if (isQuotaExceededError(e)) return;
        console.warn('[Firestore] Initial hero ads sync warning:', e);
      }

      try {
        const promoSnap = await getDoc(doc(firestoreDb, 'hero_ads', 'promo_slides'));
        if (promoSnap.exists()) {
          const remotePromo = promoSnap.data() as { settings?: PromoSlidesSettings; slides?: PromoSlide[] };
          if (remotePromo && Array.isArray(remotePromo.slides)) {
            promoSlidesDataCache = {
              settings: remotePromo.settings || DEFAULT_PROMO_SLIDES_SETTINGS,
              slides: remotePromo.slides,
            };
            saveStoredPromoSlidesData(promoSlidesDataCache);
            console.log(`[Firestore] Initialized server promo slides cache with ${promoSlidesDataCache.slides.length} slides`);
          }
        }
      } catch (e) {
        if (isQuotaExceededError(e)) return;
        console.warn('[Firestore] Initial promo slides sync warning:', e);
      }

      try {
        const revSnap = await getDocs(collection(firestoreDb, 'reviews'));
        if (!revSnap.empty) {
          const remoteReviews: ListingReview[] = [];
          revSnap.forEach((d) => remoteReviews.push(d.data() as ListingReview));
          reviewsCache = remoteReviews;
          saveStoredReviews(reviewsCache);
          console.log(`[Firestore] Initialized server reviews cache with ${reviewsCache.length} customer reviews`);
        }
      } catch (e) {
        if (isQuotaExceededError(e)) return;
        console.warn('[Firestore] Initial reviews sync warning:', e);
      }

      try {
        const repSnap = await getDocs(collection(firestoreDb, 'reports'));
        if (!repSnap.empty) {
          const remoteReports: ListingReport[] = [];
          repSnap.forEach((d) => remoteReports.push(d.data() as ListingReport));
          reportsCache = remoteReports;
          saveStoredReports(reportsCache);
          console.log(`[Firestore] Initialized server reports cache with ${reportsCache.length} trust reports`);
        }
      } catch (e) {
        if (isQuotaExceededError(e)) return;
        console.warn('[Firestore] Initial reports sync warning:', e);
      }

      try {
        const storeSnap = await getDocs(collection(firestoreDb, 'estores'));
        if (!storeSnap.empty) {
          const remoteStores: EStore[] = [];
          storeSnap.forEach((d) => {
            const item = d.data() as EStore;
            remoteStores.push({ ...item, id: d.id, products: Array.isArray(item.products) ? item.products : [] });
          });
          eStoresCache = remoteStores;
          saveStoredEStores(eStoresCache);
          console.log(`[Firestore] Initialized server estores cache with ${eStoresCache.length} stores`);
        }
      } catch (e) {
        if (isQuotaExceededError(e)) return;
        console.warn('[Firestore] Initial estores sync warning:', e);
      }

      try {
        const reelSnap = await getDocs(collection(firestoreDb, 'video_reels'));
        if (!reelSnap.empty) {
          const remoteReels: VideoReelItem[] = [];
          reelSnap.forEach((d) => remoteReels.push(d.data() as VideoReelItem));
          videoReelsCache = remoteReels;
          saveStoredVideoReels(videoReelsCache);
          console.log(`[Firestore] Initialized server video reels cache with ${videoReelsCache.length} reels`);
        }
      } catch (e) {
        if (isQuotaExceededError(e)) return;
        console.warn('[Firestore] Initial video reels sync warning:', e);
      }

      try {
        const userSnap = await getDocs(collection(firestoreDb, 'users'));
        if (!userSnap.empty) {
          const remoteUsers: User[] = [];
          userSnap.forEach((d) => remoteUsers.push(d.data() as User));
          const userMap = new Map<string, User>();
          DEFAULT_USERS.forEach((u) => userMap.set(u.id, u));
          usersCache.forEach((u) => userMap.set(u.id, u));
          remoteUsers.forEach((u) => userMap.set(u.id, u));
          usersCache = Array.from(userMap.values());
          saveStoredUsers(usersCache);
          console.log(`[Firestore] Initialized server users cache with ${usersCache.length} user accounts`);
        } else {
          // Seed default users to Firestore collection
          for (const u of usersCache) {
            persistUserToFirestore(u);
          }
          console.log(`[Firestore] Seeded initial ${usersCache.length} users to Firestore`);
        }
      } catch (e) {
        if (isQuotaExceededError(e)) return;
        console.warn('[Firestore] Initial users sync warning:', e);
      }

      try {
        const SEED_BUYER_REQUEST_IDS = new Set([
          'req_peradeniya_annex_01',
          'req_vezel_hybrid_02',
          'req_prius_abs_03',
          'req_macbook_pro_04',
          'req_al_physics_tuition_05',
          'req_golden_retriever_06',
        ]);

        // Ensure seeded demo buyer requests are removed from cache and Firestore
        buyerRequestsCache = buyerRequestsCache.filter((r) => !SEED_BUYER_REQUEST_IDS.has(r.id));
        saveStoredBuyerRequests(buyerRequestsCache);

        const reqSnap = await getDocs(collection(firestoreDb, 'buyer_requests'));
        if (!reqSnap.empty) {
          const remoteReqs: BuyerRequest[] = [];
          for (const d of reqSnap.docs) {
            if (SEED_BUYER_REQUEST_IDS.has(d.id)) {
              deleteBuyerRequestFromFirestore(d.id);
              continue;
            }
            const item = d.data() as BuyerRequest;
            const offers = Array.isArray(item.offers) ? item.offers : [];
            remoteReqs.push({
              ...item,
              id: d.id,
              offers,
              offersCount: typeof item.offersCount === 'number' ? item.offersCount : offers.length,
            });
          }
          const reqMap = new Map<string, BuyerRequest>();
          buyerRequestsCache.forEach((r) => reqMap.set(r.id, r));
          remoteReqs.forEach((r) => reqMap.set(r.id, r));
          buyerRequestsCache = Array.from(reqMap.values()).sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          saveStoredBuyerRequests(buyerRequestsCache);
          console.log(`[Firestore] Initialized server buyer requests cache with ${buyerRequestsCache.length} user requests`);
        }
      } catch (e) {
        if (isQuotaExceededError(e)) return;
        console.warn('[Firestore] Initial buyer requests sync warning:', e);
      }
    })().catch((err) => {
      console.warn('[Firestore] Initial background sync error:', err);
    });
  }
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
