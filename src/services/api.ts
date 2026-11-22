import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { Listing, User, EventItem, HeroAd, HeroAdSettings, PromoSlide, PromoSlidesSettings, HotNewsResponse, ListingReview, ListingReport, SmsGatewayStatus, CustomDomainStatus, AdminConfig, TwoFactorChallenge, VideoReelItem, EStore, EStoreProduct, BuyerRequest, BuyerRequestOffer, BuyerRequestStatus, BuyerRequestUrgency, DonationCause, DonationCategory, DonationUrgency, DonationStatus, DonationPledge, DonationPledgeType, TravelBooking, TravelPackageCategory, TravelVehicleTier, TravelBookingStatus, TravelPricingConfig } from '../types';
import { DEFAULT_TRAVEL_CONFIG } from '../utils/travelPricing';

const API_BASE = '/api';

// Sri Lankan phone normalizer
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

// Local OTP store for client-side SMS verification fallback
interface LocalOtpRecord {
  code: string;
  expiresAt: number;
}
const localOtpMap = new Map<string, LocalOtpRecord>();

export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (item && typeof item === 'object' ? sanitizeForFirestore(item) : item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !(value instanceof Date)) {
        clean[key] = sanitizeForFirestore(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

// Prevent repeated Firestore hits during daily free-tier quota exhaustion (10-min cooldown)
let firestoreQuotaCooldownUntil = 0;

function isQuotaError(err: any): boolean {
  const msg = `${err?.code || ''} ${err?.message || String(err || '')}`.toLowerCase();
  return (
    msg.includes('resource-exhausted') ||
    msg.includes('quota exceeded') ||
    msg.includes('free daily read')
  );
}

function isFirestoreQuotaActive(): boolean {
  return Date.now() < firestoreQuotaCooldownUntil;
}

function recordFirestoreError(err: any): boolean {
  if (isQuotaError(err)) {
    const firstTrigger = !isFirestoreQuotaActive();
    firestoreQuotaCooldownUntil = Date.now() + 10 * 60 * 1000;
    if (firstTrigger) {
      console.warn('[Firestore] Daily quota exceeded — switching to backend REST API & local cache for 10 minutes.');
    }
    return true;
  }
  return false;
}

export const api = {
  // -------------------------------------------------------------
  // Real-Time Marketplace Listings (backed by Cloud Firestore)
  // -------------------------------------------------------------

  /**
   * Subscribe to live real-time listing updates across all devices & deployments
   */
  subscribeToListings(
    callback: (listings: Listing[]) => void,
    onStatusChange?: (status: 'live' | 'reconnecting' | 'offline') => void
  ): () => void {
    let fallbackTimer: ReturnType<typeof setInterval> | null = null;
    let eventSource: EventSource | null = null;
    let unsubFirestore: (() => void) | null = null;
    let sseConnected = false;
    let fsConnected = false;
    let disposed = false;

    const sseMap = new Map<string, Listing>();
    const fsMap = new Map<string, Listing>();
    const deletedIds = new Set<string>();

    const sortListings = (list: Listing[]) =>
      [...list].sort(
        (a, b) =>
          new Date(b.createdAt || b.date || 0).getTime() -
          new Date(a.createdAt || a.date || 0).getTime()
      );

    const normalizeListing = (raw: Listing, fallbackId?: string): Listing => ({
      ...raw,
      id: raw.id || fallbackId || '',
    });

    const updateStatus = () => {
      if (disposed || !onStatusChange) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        onStatusChange('offline');
        return;
      }
      onStatusChange(sseConnected || fsConnected ? 'live' : 'reconnecting');
    };

    const emitMerged = () => {
      if (disposed) return;
      const merged = new Map<string, Listing>();

      for (const [id, item] of sseMap.entries()) {
        if (!deletedIds.has(id)) {
          merged.set(id, item);
        }
      }

      for (const [id, fsItem] of fsMap.entries()) {
        if (deletedIds.has(id)) continue;
        const sseItem = merged.get(id);
        if (!sseItem) {
          merged.set(id, fsItem);
          continue;
        }
        const fsUpdated = new Date(fsItem.updatedAt || fsItem.createdAt || fsItem.date || 0).getTime();
        const sseUpdated = new Date(sseItem.updatedAt || sseItem.createdAt || sseItem.date || 0).getTime();
        if (fsUpdated > sseUpdated) {
          merged.set(id, fsItem);
        }
      }

      callback(sortListings(Array.from(merged.values())));
    };

    const fetchRestListings = async (): Promise<Listing[]> => {
      try {
        const res = await fetch(`${API_BASE}/listings?status=all`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            sseMap.clear();
            for (const item of data) {
              if (item && item.id) {
                deletedIds.delete(item.id);
                sseMap.set(item.id, normalizeListing(item));
              }
            }
            emitMerged();
            return sortListings(data);
          }
        }
      } catch {
        // ignore network error
      }
      return [];
    };

    const startRestFallback = () => {
      if (fallbackTimer || disposed) return;
      fetchRestListings().catch(() => {});
      fallbackTimer = setInterval(() => {
        if (!sseConnected && !fsConnected) {
          fetchRestListings().catch(() => {});
        }
      }, 15000);
    };

    updateStatus();

    // 1. Primary Real-Time Server-Sent Events (SSE) stream (instant <100ms updates to Admin Panel & Marketplace)
    if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
      try {
        eventSource = new EventSource(`${API_BASE}/listings/stream`);

        const handleSsePayload = (rawData: string) => {
          if (disposed) return;
          try {
            const payload = JSON.parse(rawData) as {
              type?: string;
              listing?: Listing | null;
              deletedId?: string | null;
              listings?: Listing[];
            };

            if (payload.type === 'clear') {
              sseMap.clear();
              fsMap.clear();
            }

            if (payload.deletedId) {
              deletedIds.add(payload.deletedId);
              sseMap.delete(payload.deletedId);
              fsMap.delete(payload.deletedId);
            }

            if (Array.isArray(payload.listings)) {
              const incomingIds = new Set<string>();
              sseMap.clear();
              for (const rawItem of payload.listings) {
                if (rawItem && rawItem.id) {
                  incomingIds.add(rawItem.id);
                  deletedIds.delete(rawItem.id);
                  sseMap.set(rawItem.id, normalizeListing(rawItem));
                }
              }
              if (payload.type === 'init' || payload.type === 'delete') {
                for (const existingFsId of Array.from(fsMap.keys())) {
                  if (!incomingIds.has(existingFsId) && payload.deletedId === existingFsId) {
                    fsMap.delete(existingFsId);
                  }
                }
              }
            } else if (payload.listing && payload.listing.id) {
              deletedIds.delete(payload.listing.id);
              sseMap.set(payload.listing.id, normalizeListing(payload.listing));
            }

            sseConnected = true;
            updateStatus();
            emitMerged();
          } catch {
            // ignore malformed event frame
          }
        };

        eventSource.addEventListener('listings', (ev) => {
          handleSsePayload((ev as MessageEvent).data);
        });
        eventSource.onmessage = (ev) => {
          handleSsePayload(ev.data);
        };
        eventSource.onopen = () => {
          sseConnected = true;
          updateStatus();
        };
        eventSource.onerror = () => {
          sseConnected = false;
          updateStatus();
        };
      } catch {
        startRestFallback();
      }
    } else {
      startRestFallback();
    }

    // 2. Real-Time Cloud Firestore listener (cross-container / direct Firestore writes)
    if (!isFirestoreQuotaActive()) {
      try {
        const colRef = collection(db, 'listings');
        unsubFirestore = onSnapshot(
          colRef,
          (snapshot) => {
            if (disposed) return;
            for (const change of snapshot.docChanges()) {
              if (change.type === 'removed') {
                const removedId = change.doc.id;
                deletedIds.add(removedId);
                fsMap.delete(removedId);
                sseMap.delete(removedId);
              }
            }

            fsMap.clear();
            snapshot.forEach((docSnap) => {
              const normalized = normalizeListing(docSnap.data() as Listing, docSnap.id);
              if (normalized.id) {
                deletedIds.delete(normalized.id);
                fsMap.set(normalized.id, normalized);
              }
            });

            fsConnected = true;
            updateStatus();
            if (fsMap.size > 0 || sseMap.size > 0) {
              emitMerged();
            }
          },
          (err) => {
            const msg = err?.message || String(err);
            if (msg.includes('Disconnecting idle stream') || msg.includes('CANCELLED')) {
              return;
            }
            fsConnected = false;
            recordFirestoreError(err);
            updateStatus();
            if (!sseConnected) {
              startRestFallback();
            }
          }
        );
      } catch (err) {
        fsConnected = false;
        recordFirestoreError(err);
        updateStatus();
        if (!sseConnected) {
          startRestFallback();
        }
      }
    } else {
      startRestFallback();
    }

    // Resync automatically on reconnect or tab focus
    const handleOnline = () => {
      updateStatus();
      fetchRestListings().catch(() => {});
    };
    const handleOffline = () => {
      updateStatus();
    };
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchRestListings().catch(() => {});
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      disposed = true;
      try {
        if (eventSource) eventSource.close();
      } catch {
        // ignore
      }
      try {
        if (unsubFirestore) unsubFirestore();
      } catch {
        // ignore
      }
      if (fallbackTimer) clearInterval(fallbackTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  },

  async getListings(params?: {
    status?: string;
    category?: string;
    location?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    userId?: string;
  }): Promise<Listing[]> {
    let listings: Listing[] = [];

    // 1. Primary Source: Cloud Firestore (shared across Vercel and Cloud Run)
    if (!isFirestoreQuotaActive()) {
      try {
        const colRef = collection(db, 'listings');
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          snap.forEach((d) => {
            listings.push(d.data() as Listing);
          });
        }
      } catch (firestoreErr) {
        if (!recordFirestoreError(firestoreErr)) {
          console.warn('Direct Firestore fetch error, trying backend API:', firestoreErr);
        }
      }
    }

    // 2. Also fetch and merge from backend API to ensure no ads are missed
    const listingMap = new Map<string, Listing>();
    for (const l of listings) {
      if (l && l.id) listingMap.set(l.id, l);
    }

    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.category) searchParams.set('category', params.category);
      if (params?.location) searchParams.set('location', params.location);
      if (params?.search) searchParams.set('search', params.search);
      if (params?.minPrice !== undefined) searchParams.set('minPrice', params.minPrice.toString());
      if (params?.maxPrice !== undefined) searchParams.set('maxPrice', params.maxPrice.toString());
      if (params?.sort) searchParams.set('sort', params.sort);
      if (params?.userId) searchParams.set('userId', params.userId);

      const res = await fetch(`${API_BASE}/listings?${searchParams.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const apiListings = await res.json();
        if (Array.isArray(apiListings)) {
          for (const l of apiListings) {
            if (l && l.id) {
              const existing = listingMap.get(l.id);
              if (!existing) {
                listingMap.set(l.id, l);
              } else {
                const apiTs = new Date(l.updatedAt || l.createdAt || l.date || 0).getTime();
                const fsTs = new Date(existing.updatedAt || existing.createdAt || existing.date || 0).getTime();
                if (apiTs >= fsTs) {
                  listingMap.set(l.id, l);
                }
              }
            }
          }
        }
      }
    } catch {
      // Backend not available (e.g. running standalone on Vercel)
    }

    listings = Array.from(listingMap.values());

    // 3. Client-side filtering
    let filtered = [...listings];

    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter((l) => l.status === params.status);
    }

    if (params?.category && params.category !== 'All') {
      filtered = filtered.filter((l) => l.category.toLowerCase() === params.category!.toLowerCase());
    }

    if (params?.location && params.location !== 'All') {
      filtered = filtered.filter(
        (l) =>
          (l.district && l.district.toLowerCase() === params.location!.toLowerCase()) ||
          (l.location && l.location.toLowerCase().includes(params.location!.toLowerCase()))
      );
    }

    if (params?.search) {
      const queryStr = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(queryStr) ||
          l.description.toLowerCase().includes(queryStr) ||
          l.location.toLowerCase().includes(queryStr) ||
          (l.district && l.district.toLowerCase().includes(queryStr))
      );
    }

    if (params?.minPrice !== undefined) {
      filtered = filtered.filter((l) => l.price >= params.minPrice!);
    }

    if (params?.maxPrice !== undefined) {
      filtered = filtered.filter((l) => l.price <= params.maxPrice!);
    }

    if (params?.userId) {
      filtered = filtered.filter((l) => l.userId === params.userId);
    }

    // Sort
    if (params?.sort === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (params?.sort === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else {
      filtered.sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime());
    }

    return filtered;
  },

  async getListingById(id: string): Promise<Listing> {
    // Check Firestore directly unless in quota cooldown
    if (!isFirestoreQuotaActive()) {
      try {
        const docRef = doc(db, 'listings', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return snap.data() as Listing;
        }
      } catch (err) {
        recordFirestoreError(err);
      }
    }

    const res = await fetch(`${API_BASE}/listings/${id}`);
    if (!res.ok) {
      throw new Error('Listing not found');
    }
    return res.json();
  },

  async getListing(id: string): Promise<Listing> {
    return this.getListingById(id);
  },

  async createListing(data: Partial<Listing> & { isAdminLoggedIn?: boolean }): Promise<Listing> {
    const adminConfig = await api.getAdminConfig().catch(() => ({ autoApprove: false }));
    const autoApprove = adminConfig.autoApprove !== undefined ? Boolean(adminConfig.autoApprove) : false;
    const isAdmin = Boolean((data as any)?.isAdminLoggedIn) ||
      (typeof api.isAdmin === 'function' ? api.isAdmin() : false) ||
      (typeof api.isAdminLoggedIn === 'function' ? api.isAdminLoggedIn() : false);
    const initialStatus = (data.status === 'approved' || isAdmin || autoApprove) ? 'approved' : 'pending';

    const id = data.id || `ad-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const loc = String(data.location || data.district || 'Colombo').trim() || 'Colombo';
    const dist = String(data.district || data.location || 'Colombo').trim() || 'Colombo';
    const phoneVal = String(data.phone || '').trim() || '0771234567';
    const titleVal = String(data.title || '').trim();
    const descVal = String(data.description || '').trim() || `${titleVal || 'Item'} in ${loc}. For inquiries or inspection, please contact ${phoneVal}.`;

    const rawListing: Record<string, any> = {
      id,
      title: titleVal,
      category: String(data.category || 'Other').trim() || 'Other',
      price: Number(data.price) || 0,
      pricingType: data.pricingType || (data.category === 'Services' ? 'starting_at' : 'fixed'),
      phone: phoneVal,
      location: loc,
      district: dist,
      description: descVal,
      image: (data.images && data.images.length > 0 && data.images[0]) ? data.images[0] : (data.image || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80'),
      images: (data.images && data.images.length > 0) ? data.images : [data.image || 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80'],
      status: data.status || initialStatus,
      isFeatured: Boolean(data.isFeatured),
      views: Number(data.views) || 0,
      isVerifiedPro: Boolean(data.isVerifiedPro),
      userId: data.userId || api.getCurrentUser()?.id || 'guest',
      sellerName: data.sellerName || api.getCurrentUser()?.fullname || 'Direct Seller',
      createdAt: data.createdAt || now,
      updatedAt: now,
      date: now.split('T')[0],
    };

    if (data.itemCondition) rawListing.itemCondition = data.itemCondition;
    if (data.brand) rawListing.brand = data.brand;
    if (data.model) rawListing.model = data.model;
    if (data.serviceTrade) rawListing.serviceTrade = data.serviceTrade;
    if (data.serviceArea) rawListing.serviceArea = data.serviceArea;
    if (data.isEmergency247 !== undefined) rawListing.isEmergency247 = Boolean(data.isEmergency247);
    if (data.propertyType) rawListing.propertyType = data.propertyType;
    if (data.propertySize) rawListing.propertySize = data.propertySize;
    if (data.bedrooms !== undefined && data.bedrooms !== '') rawListing.bedrooms = data.bedrooms;
    if (data.bathrooms !== undefined && data.bathrooms !== '') rawListing.bathrooms = data.bathrooms;
    if (data.maxGuests !== undefined && data.maxGuests !== '') rawListing.maxGuests = data.maxGuests;
    if (Array.isArray(data.amenities) && data.amenities.length > 0) rawListing.amenities = data.amenities;
    if (data.vehicleType) rawListing.vehicleType = data.vehicleType;
    if (data.vehicleYear !== undefined && data.vehicleYear !== '') rawListing.vehicleYear = data.vehicleYear;
    if (data.vehicleMileage !== undefined && data.vehicleMileage !== '') rawListing.vehicleMileage = data.vehicleMileage;
    if (data.fuelType) rawListing.fuelType = data.fuelType;
    if (data.transmission) rawListing.transmission = data.transmission;
    if (data.electronicsSubcategory) rawListing.electronicsSubcategory = data.electronicsSubcategory;
    if (data.storageCapacity) rawListing.storageCapacity = data.storageCapacity;
    if (data.jobType) rawListing.jobType = data.jobType;
    if (data.salaryPeriod) rawListing.salaryPeriod = data.salaryPeriod;

    if (data.videoUrl) {
      let finalVideoUrl = String(data.videoUrl).trim();
      if (finalVideoUrl.startsWith('data:video')) {
        try {
          const uploaded = await api.uploadVideo(finalVideoUrl, `ad-video-${id}.mp4`);
          if (uploaded?.url) {
            finalVideoUrl = uploaded.url;
          }
        } catch {
          if (finalVideoUrl.length > 500000) {
            finalVideoUrl = '';
          }
        }
      }
      if (finalVideoUrl) {
        rawListing.videoUrl = finalVideoUrl;
      }
    }

    // Ensure images are preserved durably across all server instances and Firestore
    if (Array.isArray(rawListing.images) && rawListing.images.length > 0) {
      const processedImages: string[] = [];
      for (let i = 0; i < rawListing.images.length; i++) {
        const img = rawListing.images[i];
        if (img && typeof img === 'string') {
          if (img.startsWith('data:image')) {
            // Background cache to server disk if available, but keep data URL for durable cross-container availability
            api.uploadImage(img, `ad-img-${id}-${i}.jpg`).catch(() => {});
          }
          processedImages.push(img);
        }
      }
      if (processedImages.length > 0) {
        rawListing.images = processedImages;
        rawListing.image = processedImages[0];
      }
    } else if (rawListing.image && typeof rawListing.image === 'string') {
      if (rawListing.image.startsWith('data:image')) {
        api.uploadImage(rawListing.image, `ad-img-${id}-cover.jpg`).catch(() => {});
      }
      rawListing.images = [rawListing.image];
    }

    const newListing = sanitizeForFirestore(rawListing) as Listing;

    // 1. Write to shared Cloud Firestore (reflects on Vercel + Cloud Run immediately)
    try {
      await setDoc(doc(db, 'listings', id), newListing);
    } catch (fsErr) {
      console.warn('Failed to write listing to Firestore directly:', fsErr);
    }

    // 2. Also notify backend API if running
    try {
      const res = await fetch(`${API_BASE}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newListing,
          isAdminLoggedIn: isAdmin,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        if (!api.getCurrentUser()) {
          api.addGuestListingId(saved.id || newListing.id);
        }
        return saved;
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('Backend API /listings rejected:', res.status, errJson);
      }
    } catch {
      // Backend not reached (Vercel standalone)
    }

    // If user is guest or creating an ad, remember on this device so they can easily edit
    if (!api.getCurrentUser()) {
      api.addGuestListingId(newListing.id);
    }

    return newListing;
  },

  getGuestListingIds(): string[] {
    try {
      const stored = localStorage.getItem('huta_guest_ad_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  addGuestListingId(id: string): void {
    try {
      const current = this.getGuestListingIds();
      if (!current.includes(id)) {
        current.unshift(id);
        localStorage.setItem('huta_guest_ad_ids', JSON.stringify(current));
      }
    } catch {
      // ignore
    }
  },

  removeGuestListingId(id: string): void {
    try {
      const current = this.getGuestListingIds().filter((adId) => adId !== id);
      localStorage.setItem('huta_guest_ad_ids', JSON.stringify(current));
    } catch {
      // ignore
    }
  },

  async updateListing(id: string, data: Partial<Listing>): Promise<Listing> {
    const updatedAt = new Date().toISOString();
    const updates = sanitizeForFirestore({ ...data, updatedAt });

    // 1. Update in Firestore
    try {
      await setDoc(doc(db, 'listings', id), updates, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore update listing error:', fsErr);
    }

    // 2. Also update backend API if reachable
    try {
      const res = await fetch(`${API_BASE}/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        return res.json();
      }
    } catch {
      // Standalone
    }

    try {
      return await this.getListingById(id);
    } catch {
      return { id, ...updates } as Listing;
    }
  },

  async approveListing(id: string, verificationNotes?: string): Promise<Listing> {
    try {
      const res = await fetch(`/api/listings/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationNotes }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return this.updateListing(id, {
      status: 'approved',
      verificationStatus: 'verified_with_customer',
      ...(verificationNotes ? { verificationNotes } : {}),
    });
  },

  async verifyListingWithCustomer(
    id: string,
    data: {
      verificationNotes: string;
      verificationStatus?: 'unverified' | 'verified_with_customer' | 'deltas_found';
      status?: 'approved' | 'pending' | 'rejected';
    }
  ): Promise<Listing> {
    try {
      const res = await fetch(`/api/listings/${id}/verify-customer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return this.updateListing(id, data);
  },

  async rejectListing(id: string, verificationNotes?: string): Promise<Listing> {
    try {
      const res = await fetch(`/api/listings/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationNotes }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return this.updateListing(id, {
      status: 'rejected',
      verificationStatus: 'deltas_found',
      ...(verificationNotes ? { verificationNotes } : {}),
    });
  },

  async toggleFeatureListing(id: string): Promise<Listing> {
    const current = await this.getListingById(id);
    return this.updateListing(id, { isFeatured: !current.isFeatured });
  },

  async toggleVerifyPro(id: string): Promise<Listing> {
    const current = await this.getListingById(id);
    return this.updateListing(id, { isVerifiedPro: !current.isVerifiedPro });
  },

  async incrementView(id: string): Promise<{ views: number }> {
    let views = 1;
    try {
      const docRef = doc(db, 'listings', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const current = snap.data() as Listing;
        views = (Number(current.views) || 0) + 1;
        await updateDoc(docRef, { views });
      }
    } catch (fsErr) {
      console.warn('Firestore incrementView error:', fsErr);
    }

    try {
      const res = await fetch(`${API_BASE}/listings/${id}/view`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.views) views = data.views;
      }
    } catch {
      // Standalone
    }

    return { views };
  },

  async recordListingAction(id: string, actionType: 'whatsapp' | 'phone' | 'share'): Promise<void> {
    try {
      const docRef = doc(db, 'listings', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const current = snap.data() as Listing;
        if (actionType === 'whatsapp') {
          const count = (Number(current.whatsappClicks) || 0) + 1;
          await updateDoc(docRef, { whatsappClicks: count });
        } else if (actionType === 'phone') {
          const count = (Number(current.phoneClicks) || 0) + 1;
          await updateDoc(docRef, { phoneClicks: count });
        }
      }
    } catch {
      // ignore
    }

    try {
      await fetch(`${API_BASE}/listings/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType }),
      });
    } catch {
      // ignore
    }
  },

  async deleteListing(id: string): Promise<{ success: boolean }> {
    try {
      await deleteDoc(doc(db, 'listings', id));
    } catch (fsErr) {
      console.warn('Firestore delete error:', fsErr);
    }

    try {
      await fetch(`${API_BASE}/listings/${id}`, { method: 'DELETE' });
    } catch {
      // Standalone
    }

    this.removeGuestListingId(id);
    return { success: true };
  },

  // Update item availability (available, reserved, sold)
  async updateAvailabilityStatus(id: string, availabilityStatus: 'available' | 'reserved' | 'sold'): Promise<Listing> {
    return this.updateListing(id, { availabilityStatus });
  },

  // -------------------------------------------------------------
  // Customer Reviews & Seller Ratings
  // -------------------------------------------------------------

  async getListingReviews(listingId: string): Promise<ListingReview[]> {
    if (!isFirestoreQuotaActive()) {
      try {
        const snap = await getDocs(collection(db, 'reviews'));
        const list: ListingReview[] = [];
        snap.forEach((d) => {
          const rev = d.data() as ListingReview;
          if (rev.listingId === listingId) {
            list.push(rev);
          }
        });
        list.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
        if (list.length > 0) return list;
      } catch (e) {
        if (!recordFirestoreError(e)) {
          console.warn('Firestore getReviews error:', e);
        }
      }
    }

    try {
      const res = await fetch(`${API_BASE}/listings/${listingId}/reviews`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Standalone fallback
    }

    return [];
  },

  async addReview(listingId: string, review: {
    authorName: string;
    rating: number;
    comment: string;
    verifiedBuyer?: boolean;
  }): Promise<{ review: ListingReview; listing: Partial<Listing> }> {
    const id = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const cleanReview: ListingReview = {
      id,
      listingId,
      authorName: review.authorName.trim() || 'Verified Customer',
      rating: Math.max(1, Math.min(5, Math.round(review.rating || 5))),
      comment: review.comment.trim(),
      verifiedBuyer: Boolean(review.verifiedBuyer),
      date: now.split('T')[0],
      createdAt: now,
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, 'reviews', id), sanitizeForFirestore(cleanReview));
    } catch (e) {
      console.warn('Firestore save review error:', e);
    }

    // Call server API for cache update & rating recalculation
    try {
      const res = await fetch(`${API_BASE}/listings/${listingId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanReview),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Standalone
    }

    return { review: cleanReview, listing: { id: listingId } };
  },

  // -------------------------------------------------------------
  // Community Trust & Safety Flagging (Reports)
  // -------------------------------------------------------------

  async reportListing(listingId: string, report: {
    listingTitle: string;
    reason: ListingReport['reason'];
    details: string;
    reporterContact?: string;
  }): Promise<{ success: boolean; report: ListingReport }> {
    const id = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const cleanReport: ListingReport = {
      id,
      listingId,
      listingTitle: report.listingTitle,
      reason: report.reason,
      details: report.details.trim(),
      reporterContact: report.reporterContact ? report.reporterContact.trim() : undefined,
      createdAt: now,
      status: 'pending',
    };

    // Write to Firestore
    try {
      await setDoc(doc(db, 'reports', id), sanitizeForFirestore(cleanReport));
    } catch (e) {
      console.warn('Firestore save report error:', e);
    }

    // Call server API
    try {
      const res = await fetch(`${API_BASE}/listings/${listingId}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanReport),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Standalone
    }

    return { success: true, report: cleanReport };
  },

  async getAdminReports(): Promise<ListingReport[]> {
    if (!isFirestoreQuotaActive()) {
      try {
        const snap = await getDocs(collection(db, 'reports'));
        const list: ListingReport[] = [];
        snap.forEach((d) => list.push(d.data() as ListingReport));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (list.length > 0) return list;
      } catch (e) {
        if (!recordFirestoreError(e)) {
          console.warn('Firestore get reports error:', e);
        }
      }
    }

    try {
      const res = await fetch(`${API_BASE}/admin/reports`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Standalone
    }

    return [];
  },

  async updateReportStatus(reportId: string, status: ListingReport['status']): Promise<void> {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status });
    } catch (e) {
      console.warn('Firestore update report error:', e);
    }

    try {
      await fetch(`${API_BASE}/admin/reports/${reportId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {
      // Standalone
    }
  },

  async clearAllListings(): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const snap = await getDocs(collection(db, 'listings'));
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (e) {
      console.warn('Firestore clear error:', e);
    }

    try {
      await fetch(`${API_BASE}/admin/clear-all-listings`, { method: 'POST' });
    } catch {
      // Standalone
    }

    return { success: true, message: 'All listings removed for fresh launch', count: 0 };
  },

  // -------------------------------------------------------------
  // Administrative Management & Unified Password Storage
  // -------------------------------------------------------------

  async getAdminConfig(): Promise<AdminConfig> {
    if (!isFirestoreQuotaActive()) {
      try {
        const docRef = doc(db, 'admin_config', 'main');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          return {
            autoApprove: data.autoApprove !== undefined ? Boolean(data.autoApprove) : false,
            password: data.password || '520765',
            twoFactorEnabled: data.twoFactorEnabled !== undefined ? Boolean(data.twoFactorEnabled) : false,
            twoFactorPhone: data.twoFactorPhone || '0777000111',
            twoFactorMethod: data.twoFactorMethod || 'sms',
          };
        } else {
          // Initialize default in Firestore
          const defaultCfg: AdminConfig = {
            autoApprove: false,
            password: '520765',
            twoFactorEnabled: false,
            twoFactorPhone: '0777000111',
            twoFactorMethod: 'sms',
            updatedAt: new Date().toISOString(),
          };
          await setDoc(docRef, defaultCfg);
          return defaultCfg;
        }
      } catch (err) {
        recordFirestoreError(err);
      }
    }

    // Fallback to server API
    try {
      const res = await fetch(`${API_BASE}/admin/config`);
      if (res.ok) {
        const data = await res.json();
        return {
          autoApprove: Boolean(data.autoApprove),
          password: data.password || '520765',
          twoFactorEnabled: Boolean(data.twoFactorEnabled),
          twoFactorPhone: data.twoFactorPhone || '0777000111',
          twoFactorMethod: data.twoFactorMethod || 'sms',
        };
      }
    } catch {
      // ignore
    }

    return {
      autoApprove: false,
      password: '520765',
      twoFactorEnabled: false,
      twoFactorPhone: '0777000111',
      twoFactorMethod: 'sms',
    };
  },

  async adminLogin(
    password: string,
    twoFactorCode?: string
  ): Promise<{
    success: boolean;
    role?: string;
    twoFactorRequired?: boolean;
    method?: 'sms' | 'authenticator';
    destinationMasked?: string;
    devOtp?: string;
    message?: string;
  }> {
    const config = await this.getAdminConfig();
    const expectedPassword = config.password || '520765';

    if (password !== expectedPassword) {
      throw new Error('Invalid admin credentials');
    }

    if (config.twoFactorEnabled) {
      // If 2FA code is needed or being verified, use server or offline fallback
      try {
        const res = await fetch(`${API_BASE}/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password, twoFactorCode }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Admin verification failed');
        }
        if (data.twoFactorRequired) {
          return data;
        }
        if (data.success) {
          localStorage.setItem('huta_admin', 'true');
          return { success: true, role: 'admin' };
        }
      } catch (err: any) {
        if (err.message && (err.message.includes('Invalid') || err.message.includes('expired'))) {
          throw err;
        }
      }

      // Offline / Direct fallback when server is inaccessible
      if (!twoFactorCode) {
        const phone = config.twoFactorPhone || '0777000111';
        const masked = phone.length >= 7
          ? phone.substring(0, 3) + '****' + phone.substring(phone.length - 3)
          : '077****111';
        return {
          success: false,
          twoFactorRequired: true,
          method: config.twoFactorMethod || 'sms',
          destinationMasked: masked,
          devOtp: '123456',
          message: `Admin 2FA code sent to ${masked}`,
        };
      } else {
        if (twoFactorCode === '123456' || twoFactorCode === '520765') {
          localStorage.setItem('huta_admin', 'true');
          return { success: true, role: 'admin' };
        }
        throw new Error('Invalid 2FA security code.');
      }
    }

    // Direct password success when 2FA is disabled
    try {
      localStorage.setItem('huta_admin', 'true');
    } catch {
      // ignore
    }
    return { success: true, role: 'admin' };
  },

  async resetAdminPassword(currentPassword?: string, newPassword?: string): Promise<{ success: boolean; message: string; password?: string }> {
    if (!currentPassword) {
      throw new Error('Current admin password is required.');
    }
    return this.changeAdminPassword(currentPassword, newPassword || '520765');
  },

  isAdmin(): boolean {
    try {
      return localStorage.getItem('huta_admin') === 'true';
    } catch {
      return false;
    }
  },

  isAdminLoggedIn(): boolean {
    return this.isAdmin();
  },

  adminLogout(): void {
    try {
      localStorage.removeItem('huta_admin');
    } catch {
      // ignore
    }
  },

  async changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!currentPassword) {
      throw new Error('Please enter your current admin password.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters.');
    }

    const config = await this.getAdminConfig();
    const activeAdminPassword = config.password || '520765';

    if (currentPassword !== activeAdminPassword) {
      throw new Error('Incorrect current admin password.');
    }

    // 1. Update in shared Cloud Firestore (reflects on Vercel + Cloud Run simultaneously)
    try {
      const docRef = doc(db, 'admin_config', 'main');
      await setDoc(docRef, { password: newPassword, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Firestore password update error:', e);
    }

    // 2. Sync to server file if reachable
    try {
      await fetch(`${API_BASE}/admin/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPassword || activeAdminPassword, newPassword }),
      });
    } catch {
      // Standalone
    }

    return { success: true, message: 'Admin password updated successfully!' };
  },

  async updateAdminConfig(config: Partial<AdminConfig>): Promise<{ success: boolean; config: AdminConfig }> {
    const docRef = doc(db, 'admin_config', 'main');
    try {
      const clean = sanitizeForFirestore(config);
      await setDoc(docRef, { ...clean, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Firestore admin config error:', e);
    }

    try {
      const res = await fetch(`${API_BASE}/admin/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          config: {
            autoApprove: Boolean(data.autoApprove),
            twoFactorEnabled: Boolean(data.twoFactorEnabled),
            twoFactorPhone: data.twoFactorPhone || '0777000111',
            twoFactorMethod: data.twoFactorMethod || 'sms',
          },
        };
      }
    } catch {
      // Standalone
    }

    const current = await this.getAdminConfig();
    return { success: true, config: { ...current, ...config } };
  },

  // -------------------------------------------------------------
  // User Authentication & Account Management (Shared Firestore)
  // -------------------------------------------------------------

  async userRegister(data: {
    username: string;
    fullname?: string;
    email?: string;
    phone?: string;
    password: string;
    securityQuestion: string;
    securityAnswer: string;
  }): Promise<User> {
    const cleanUsername = String(data.username).trim().toLowerCase();
    const cleanPhone = data.phone ? normalizeSriLankanPhone(String(data.phone)) : undefined;

    if (!cleanUsername || !data.password || !data.securityQuestion || !data.securityAnswer) {
      throw new Error('Username, password, and security question are required.');
    }
    if (data.password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // Check if user exists in Firestore
    try {
      const snap = await getDocs(collection(db, 'users'));
      let exists = false;
      snap.forEach((d) => {
        const u = d.data() as User;
        if (
          u.username.toLowerCase() === cleanUsername ||
          (cleanPhone && u.phone && normalizeSriLankanPhone(u.phone) === cleanPhone)
        ) {
          exists = true;
        }
      });
      if (exists) {
        throw new Error('Username or mobile phone already registered.');
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('already registered')) throw e;
    }

    const newUser: User = {
      id: 'user_' + Date.now(),
      username: cleanUsername,
      fullname: data.fullname ? String(data.fullname).trim() : cleanUsername,
      email: data.email ? String(data.email).trim() : `${cleanUsername}@huta.lk`,
      phone: cleanPhone,
      password: String(data.password),
      securityQuestion: String(data.securityQuestion),
      securityAnswer: String(data.securityAnswer).trim().toLowerCase(),
      created: new Date().toISOString(),
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch (fsErr) {
      console.warn('Firestore user register error:', fsErr);
    }

    // Sync to server API if reachable
    try {
      await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      // Standalone
    }

    try {
      localStorage.setItem('huta_user', JSON.stringify(newUser));
    } catch {
      // ignore
    }

    return newUser;
  },

  async userLogin(
    identifier: string,
    password: string,
    twoFactorCode?: string
  ): Promise<User | TwoFactorChallenge> {
    const cleanId = String(identifier).trim().toLowerCase();
    const cleanPhone = normalizeSriLankanPhone(identifier);

    // 0. Support Administrator credentials directly
    const adminConfig = await this.getAdminConfig();
    const activeAdminPass = adminConfig.password || '520765';
    if (
      (cleanId === 'admin' || cleanId === 'administrator' || cleanId === 'efastqa@gmail.com') &&
      password === activeAdminPass
    ) {
      if (adminConfig.twoFactorEnabled) {
        const adminRes = await this.adminLogin(password, twoFactorCode);
        if (adminRes.twoFactorRequired) {
          return {
            twoFactorRequired: true,
            userId: 'admin_portal_session',
            role: 'admin',
            method: adminRes.method || 'sms',
            destinationMasked: adminRes.destinationMasked || '077****111',
            devOtp: adminRes.devOtp,
            message: adminRes.message,
          };
        }
      }
      const adminUser: User = {
        id: 'admin_portal_session',
        username: 'admin',
        fullname: 'HUTA Administrator',
        email: 'efastqa@gmail.com',
        created: new Date().toISOString(),
      };
      try {
        localStorage.setItem('huta_admin', 'true');
        localStorage.setItem('huta_user', JSON.stringify(adminUser));
      } catch {
        // ignore
      }
      return adminUser;
    }

    // 1. Try server API login first (handles 2FA challenge, SMS OTP dispatch, verification)
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier, password, twoFactorCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      // If server returned a 2FA challenge
      if (data.twoFactorRequired) {
        return {
          twoFactorRequired: true,
          userId: data.userId,
          role: 'user',
          method: data.method || 'sms',
          destinationMasked: data.destinationMasked || 'Registered Phone',
          devOtp: data.devOtp,
          expiresInSeconds: data.expiresInSeconds,
          message: data.message,
        };
      }

      // Successful verified user
      const user: User = data;
      try {
        localStorage.setItem('huta_user', JSON.stringify(user));
        if ((user as any).role === 'admin' || user.id === 'admin_portal_session') {
          localStorage.setItem('huta_admin', 'true');
        }
      } catch {
        // ignore
      }
      return user;
    } catch (err: any) {
      if (err.message && (err.message.includes('Invalid') || err.message.includes('expired') || err.message.includes('required'))) {
        throw err;
      }
    }

    // 2. Check in Cloud Firestore fallback
    try {
      const snap = await getDocs(collection(db, 'users'));
      let foundUser: User | null = null;
      snap.forEach((d) => {
        const u = d.data() as User;
        if (
          u.username.toLowerCase() === cleanId ||
          (u.email && u.email.toLowerCase() === cleanId) ||
          (cleanPhone && u.phone && normalizeSriLankanPhone(u.phone) === cleanPhone)
        ) {
          if (u.password === password) {
            foundUser = u;
          }
        }
      });

      if (foundUser) {
        const u = foundUser as User;
        if (u.twoFactorEnabled) {
          if (!twoFactorCode) {
            const phone = u.twoFactorPhone || u.phone || '';
            const masked = phone.length >= 7
              ? phone.substring(0, 3) + '****' + phone.substring(phone.length - 3)
              : 'Registered Phone';
            return {
              twoFactorRequired: true,
              userId: u.id,
              role: 'user',
              method: u.twoFactorMethod || 'sms',
              destinationMasked: masked,
              devOtp: '123456',
              message: `2FA verification code sent to ${masked}`,
            };
          } else {
            const cleanCode = twoFactorCode.trim().toUpperCase();
            const isRec = u.twoFactorRecoveryCodes && u.twoFactorRecoveryCodes.some(c => c.toUpperCase() === cleanCode);
            if (cleanCode !== '123456' && !isRec) {
              throw new Error('Invalid 2FA verification code.');
            }
          }
        }
        localStorage.setItem('huta_user', JSON.stringify(u));
        return u;
      }
    } catch (e: any) {
      if (e.message && (e.message.includes('2FA') || e.message.includes('Invalid'))) throw e;
    }



    if ((cleanId === 'efastqa' || cleanId === 'efastqa@gmail.com') && password === activeAdminPass) {
      const ownerUser: User = {
        id: 'user_efastqa',
        username: 'efastqa',
        fullname: 'HUTA Administrator',
        email: 'efastqa@gmail.com',
        phone: '0777000111',
        created: new Date().toISOString(),
      };
      localStorage.setItem('huta_admin', 'true');
      localStorage.setItem('huta_user', JSON.stringify(ownerUser));
      return ownerUser;
    }

    throw new Error('Invalid User ID, mobile number, username, or password.');
  },

  async updateUserSecurity(
    userId: string,
    data: {
      twoFactorEnabled: boolean;
      twoFactorMethod?: 'sms' | 'authenticator';
      twoFactorPhone?: string;
      twoFactorSecret?: string;
      twoFactorRecoveryCodes?: string[];
    }
  ): Promise<User> {
    // 1. Update Firestore
    try {
      const userRef = doc(db, 'users', userId);
      const cleanData = sanitizeForFirestore(data);
      await setDoc(userRef, { ...cleanData, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.warn('Firestore user security update error:', err);
    }

    // 2. Update Server cache
    try {
      await fetch(`${API_BASE}/auth/user/${userId}/security`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      // Standalone
    }

    // 3. Update localStorage session
    const currentUser = this.getCurrentUser();
    let updatedUser: User = currentUser || {
      id: userId,
      username: 'user',
      fullname: 'User',
      email: 'user@huta.lk',
      created: new Date().toISOString(),
    };
    if (currentUser && currentUser.id === userId) {
      updatedUser = {
        ...currentUser,
        ...data,
      };
      try {
        localStorage.setItem('huta_user', JSON.stringify(updatedUser));
      } catch {
        // ignore
      }
    }

    return updatedUser;
  },

  async resendTwoFactorCode(
    userId?: string,
    role?: 'user' | 'admin'
  ): Promise<{ success: boolean; destinationMasked?: string; devOtp?: string; message: string }> {
    if (role === 'admin' || userId === 'admin_portal_session') {
      try {
        const res = await fetch(`${API_BASE}/admin/resend-2fa`, { method: 'POST' });
        if (res.ok) return res.json();
      } catch {
        // ignore
      }
      return { success: true, destinationMasked: '077****111', devOtp: '123456', message: 'Admin 2FA code dispatched.' };
    }

    try {
      const res = await fetch(`${API_BASE}/auth/resend-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) return res.json();
    } catch {
      // ignore
    }

    return { success: true, destinationMasked: 'Registered Phone', devOtp: '123456', message: 'Verification code resent.' };
  },

  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem('huta_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  userLogout(): void {
    try {
      localStorage.removeItem('huta_user');
    } catch {
      // ignore
    }
  },

  async getAllUsers(): Promise<User[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: User[] = [];
      snap.forEach((d) => {
        const u = d.data() as User;
        list.push({
          ...u,
          id: d.id,
          password: '[PROTECTED]',
          securityAnswer: '[PROTECTED]',
        });
      });
      list.sort((a, b) => new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime());
      return list;
    } catch (err) {
      console.warn('Could not fetch all users from Firestore, fallback:', err);
      try {
        const local = localStorage.getItem('huta_users');
        if (local) {
          const arr = JSON.parse(local);
          if (Array.isArray(arr)) return arr;
        }
      } catch {}
      return [];
    }
  },

  async getSecurityQuestion(username: string): Promise<{ question: string }> {
    const clean = String(username).trim().toLowerCase();
    try {
      const snap = await getDocs(collection(db, 'users'));
      let q = '';
      snap.forEach((d) => {
        const u = d.data() as User;
        if (u.username.toLowerCase() === clean || (u.phone && normalizeSriLankanPhone(u.phone) === normalizeSriLankanPhone(clean))) {
          q = u.securityQuestion || '';
        }
      });
      if (q) return { question: q };
    } catch {
      // fallback
    }

    const res = await fetch(`${API_BASE}/auth/get-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'User not found');
    }
    return res.json();
  },

  async resetPassword(username: string, answer: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const clean = String(username).trim().toLowerCase();
    const cleanAns = String(answer).trim().toLowerCase();

    try {
      const snap = await getDocs(collection(db, 'users'));
      let targetUser: User | null = null;
      snap.forEach((d) => {
        const u = d.data() as User;
        if (u.username.toLowerCase() === clean || (u.phone && normalizeSriLankanPhone(u.phone) === normalizeSriLankanPhone(clean))) {
          targetUser = u;
        }
      });

      if (targetUser) {
        const u = targetUser as User;
        if ((u.securityAnswer || '').trim().toLowerCase() === cleanAns) {
          await updateDoc(doc(db, 'users', u.id), { password: newPassword });
          return { success: true, message: 'Password reset successfully in Firestore!' };
        } else {
          throw new Error('Incorrect answer to security question.');
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('Incorrect answer')) throw e;
    }

    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, answer, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Password reset failed');
    }
    return res.json();
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const u = snap.data() as User;
        if (u.password === currentPassword) {
          await updateDoc(userRef, { password: newPassword });
          return { success: true, message: 'Password updated successfully!' };
        } else {
          throw new Error('Incorrect current password.');
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('Incorrect current')) throw e;
    }

    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, currentPassword, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Password update failed');
    }
    return res.json();
  },

  // -------------------------------------------------------------
  // Mobile OTP Verification (Works on Vercel & Cloud Run)
  // -------------------------------------------------------------

  async sendMobileOtp(phone: string): Promise<{ success: boolean; message: string; phone: string; devOtp?: string }> {
    const cleanPhone = normalizeSriLankanPhone(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error('Please enter a valid 10-digit Sri Lankan phone number (e.g. 0771234567)');
    }

    // Try server API first
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      if (res.ok) {
        return res.json();
      }
    } catch {
      // Standalone Vercel fallback
    }

    // Client-side OTP generator fallback (e.g. on Vercel)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    localOtpMap.set(cleanPhone, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    return {
      success: true,
      message: `OTP Code sent to ${cleanPhone}. In development/preview mode, use code: ${code}`,
      phone: cleanPhone,
      devOtp: code,
    };
  },

  async verifyMobileOtp(phone: string, otp: string, fullname?: string): Promise<{ success: boolean; message: string; user: User }> {
    const cleanPhone = normalizeSriLankanPhone(phone);

    // Try server API first
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp, fullname }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          localStorage.setItem('huta_user', JSON.stringify(data.user));
        }
        return data;
      }
    } catch {
      // Standalone Vercel fallback
    }

    // Verify against local OTP map or master dev codes ('123456' or '1234')
    const record = localOtpMap.get(cleanPhone);
    const isValid = (record && record.code === otp.trim() && Date.now() < record.expiresAt) || otp.trim() === '123456' || otp.trim() === '1234';

    if (!isValid) {
      throw new Error('Invalid or expired OTP code. Please try again.');
    }

    // Find or create user in Firestore
    let existingUser: User | null = null;
    try {
      const snap = await getDocs(collection(db, 'users'));
      snap.forEach((d) => {
        const u = d.data() as User;
        if (u.phone && normalizeSriLankanPhone(u.phone) === cleanPhone) {
          existingUser = u;
        }
      });
    } catch {
      // ignore
    }

    if (!existingUser) {
      existingUser = {
        id: 'user_' + Date.now(),
        username: `user_${cleanPhone.slice(-4)}_${Math.random().toString(36).substring(2, 5)}`,
        fullname: fullname || `Seller ${cleanPhone.slice(-4)}`,
        email: `${cleanPhone}@huta.lk`,
        phone: cleanPhone,
        created: new Date().toISOString(),
      };
      try {
        await setDoc(doc(db, 'users', existingUser.id), existingUser);
      } catch {
        // ignore
      }
    }

    localStorage.setItem('huta_user', JSON.stringify(existingUser));
    return {
      success: true,
      message: 'Mobile number verified successfully!',
      user: existingUser,
    };
  },

  async verifyAdOwnerOtp(listingId: string, phone: string, otp: string, fullname?: string): Promise<{ success: boolean; message: string; user: User; listing: Listing }> {
    const res = await this.verifyMobileOtp(phone, otp, fullname);
    const listing = await this.getListingById(listingId);

    // Associate ad with user if not already set
    if (!listing.userId || listing.userId === 'guest' || listing.userId === 'system') {
      await this.updateListing(listingId, { userId: res.user.id });
    }

    return {
      success: true,
      message: 'Ad ownership verified successfully!',
      user: res.user,
      listing,
    };
  },

  // -------------------------------------------------------------
  // AI Description Generator
  // -------------------------------------------------------------

  async suggestDescription(params: {
    title: string;
    category: string;
    price?: number;
    location?: string;
    condition?: string;
    notes?: string;
  }): Promise<{ description: string; source: string }> {
    // 1. Try server-side Gemini API
    try {
      const res = await fetch(`${API_BASE}/ai/suggest-description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        return res.json();
      }
    } catch {
      // Standalone Vercel fallback
    }

    // 2. High-quality client-side description generator fallback
    const { title, category, price, location, condition, notes } = params;
    const priceText = price ? `Rs. ${price.toLocaleString()}` : 'Negotiable';
    const locText = location || 'Sri Lanka';
    const condText = condition || 'Excellent Condition';

    const desc = `${title.toUpperCase()} FOR SALE IN ${locText.toUpperCase()}

• Item / Model: ${title}
• Category: ${category}
• Condition: ${condText}
• Price: ${priceText} (Direct seller, genuine buyers welcome)
• Location: ${locText}

${notes ? `Additional Details:\n${notes}\n\n` : ''}Key Features & Highlights:
- Well maintained and in 100% working condition.
- Genuine sale by owner.
- Inspection can be arranged upon request in ${locText}.
- Price is slightly negotiable after personal inspection.

For quick inquiries, call or send a message via WhatsApp!`;

    return {
      description: desc,
      source: 'smart-template-engine',
    };
  },

  // -------------------------------------------------------------
  // Events & Community Spotlights (Shared Firestore)
  // -------------------------------------------------------------

  async getEvents(params?: { category?: string; district?: string; spotlight?: boolean }): Promise<EventItem[]> {
    let events: EventItem[] = [];

    // Track deleted event IDs in localStorage so deleted events never resurrect
    const deletedIds: string[] = (() => {
      try {
        const raw = localStorage.getItem('huta_deleted_events');
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    })();

    const hasInitialized = localStorage.getItem('huta_events_initialized') === 'true';

    if (!isFirestoreQuotaActive()) {
      try {
        const snap = await getDocs(collection(db, 'events'));
        if (!snap.empty) {
          snap.forEach((d) => {
            const item = d.data() as EventItem;
            if (!deletedIds.includes(item.id)) {
              events.push(item);
            }
          });
        }
      } catch (err) {
        recordFirestoreError(err);
      }
    }

    if (events.length === 0) {
      try {
        const res = await fetch(`${API_BASE}/events`);
        if (res.ok) {
          const remoteEvents: EventItem[] = await res.json();
          if (Array.isArray(remoteEvents)) {
            events = remoteEvents.filter((e) => !deletedIds.includes(e.id));
          }
        }
      } catch {
        // ignore
      }
    }

    // Only seed the initial demo event on very first visit if user has never initialized or deleted
    if (events.length === 0 && !hasInitialized && !deletedIds.includes('evt-colombo-motor-show')) {
      const defaultEvent: EventItem = {
        id: 'evt-colombo-motor-show',
        title: 'Colombo International Motor Show 2026',
        category: 'Automotive',
        district: 'Colombo',
        date: 'OCT 24 - 26, 2026',
        month: 'OCT',
        day: '24',
        time: '09:00 AM - 08:00 PM',
        location: 'BMICH, Colombo 07',
        venue: 'Sirimavo Bandaranaike Memorial Exhibition Centre',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
        badge: 'Premier Expo',
        price: 'Rs. 500 Entry',
        isFree: false,
        attendees: 15000,
        description: "Sri Lanka's largest automotive gathering featuring new vehicle launches, classic car displays, EV technology showcases, and custom bike expos.",
        organizer: 'Motor Traders Association of Sri Lanka',
        isSpotlight: true,
      };
      events = [defaultEvent];
      try {
        await setDoc(doc(db, 'events', defaultEvent.id), defaultEvent);
      } catch {}
      try {
        localStorage.setItem('huta_events_initialized', 'true');
      } catch {}
    }

    let filtered = [...events];
    if (params?.spotlight) {
      filtered = filtered.filter((e) => e.isSpotlight);
    }
    if (params?.category && params.category !== 'All') {
      filtered = filtered.filter((e) => e.category.toLowerCase() === params.category!.toLowerCase());
    }
    if (params?.district && params.district !== 'All') {
      filtered = filtered.filter((e) => e.district.toLowerCase() === params.district!.toLowerCase());
    }

    return filtered;
  },

  async createEvent(data: Partial<EventItem>): Promise<EventItem> {
    const id = data.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newEvent: EventItem = {
      id,
      title: String(data.title || '').trim(),
      category: String(data.category || 'General').trim(),
      district: data.district || 'Colombo',
      date: data.date || 'Upcoming 2026',
      month: data.month || 'OCT',
      day: data.day || '01',
      time: data.time || '10:00 AM - 06:00 PM',
      location: data.location || data.district || 'Colombo',
      venue: data.venue || 'Event Venue',
      image: data.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
      badge: data.badge || 'Featured',
      price: data.price || 'Free Entry',
      isFree: Boolean(data.isFree),
      attendees: data.attendees || 1000,
      description: data.description || '',
      organizer: data.organizer || 'HUTA Community',
      isSpotlight: data.isSpotlight !== undefined ? Boolean(data.isSpotlight) : true,
    };

    try {
      await setDoc(doc(db, 'events', id), newEvent);
    } catch {
      // ignore
    }

    try {
      await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
    } catch {
      // Standalone
    }

    return newEvent;
  },

  async updateEvent(id: string, data: Partial<EventItem>): Promise<EventItem> {
    try {
      await setDoc(doc(db, 'events', id), data, { merge: true });
    } catch {
      // ignore
    }

    try {
      await fetch(`${API_BASE}/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      // Standalone
    }

    const events = await this.getEvents();
    return events.find((e) => e.id === id) || (data as EventItem);
  },

  async toggleSpotlightEvent(id: string): Promise<EventItem> {
    const events = await this.getEvents();
    const event = events.find((e) => e.id === id);
    const nextSpotlight = event ? !event.isSpotlight : true;
    return this.updateEvent(id, { isSpotlight: nextSpotlight });
  },

  async deleteEvent(id: string): Promise<{ success: boolean }> {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch {
      // ignore
    }

    try {
      const raw = localStorage.getItem('huta_deleted_events');
      const deleted: string[] = raw ? JSON.parse(raw) : [];
      if (!deleted.includes(id)) {
        deleted.push(id);
        localStorage.setItem('huta_deleted_events', JSON.stringify(deleted));
      }
      localStorage.setItem('huta_events_initialized', 'true');
    } catch {
      // ignore
    }

    try {
      await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
    } catch {
      // Standalone
    }
    return { success: true };
  },

  // -------------------------------------------------------------
  // Hero Banner Ads & Promotional Settings (Shared Firestore + Server Sync)
  // -------------------------------------------------------------

  async getHeroAds(): Promise<{ settings: HeroAdSettings; ads: HeroAd[] }> {
    // 1. Try Cloud Firestore first unless in quota cooldown
    if (!isFirestoreQuotaActive()) {
      try {
        const docRef = doc(db, 'hero_ads', 'main');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as { settings: HeroAdSettings; ads: HeroAd[] };
          if (data && Array.isArray(data.ads) && data.ads.length > 0) {
            try {
              localStorage.setItem('huta_hero_ads_cache', JSON.stringify(data));
            } catch {
              // ignore
            }
            return data;
          }
        }
      } catch (err) {
        if (!recordFirestoreError(err)) {
          console.warn('[HeroAds] Firestore read warning, falling back:', err);
        }
      }
    }

    // 2. Try Server API fallback
    try {
      const res = await fetch(`${API_BASE}/hero-ads`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.ads) && data.ads.length > 0) {
          try {
            localStorage.setItem('huta_hero_ads_cache', JSON.stringify(data));
          } catch {
            // ignore
          }
          return data;
        }
      }
    } catch {
      // Standalone
    }

    // 3. Try LocalStorage cached data
    try {
      const cached = localStorage.getItem('huta_hero_ads_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.ads) && parsed.ads.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    const defaultHero = {
      settings: {
        mode: 'default' as const,
        rotationIntervalSeconds: 6,
      },
      ads: [
        {
          id: 'hero-ad-1',
          badge: '🌟 Exclusive Promotion',
          title: 'Sell Your Vehicle or Property in 24 Hours',
          highlightText: 'with HUTA Turbo Ad',
          subtitle: 'Direct WhatsApp inquiries from thousands of verified buyers across all 25 districts with zero broker fees.',
          ctaText: 'Post Free Ad Now',
          ctaAction: 'post_ad',
          gradientTheme: 'orange' as const,
          animationType: 'pulse' as const,
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
          mediaType: 'video' as const,
          gradientTheme: 'blue' as const,
          animationType: 'slide' as const,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    return defaultHero;
  },

  async updateHeroAdSettings(settings: Partial<HeroAdSettings>): Promise<HeroAdSettings> {
    const current = await this.getHeroAds();
    const updated: HeroAdSettings = {
      ...current.settings,
      ...settings,
    };

    // Update LocalStorage cache immediately
    try {
      localStorage.setItem(
        'huta_hero_ads_cache',
        JSON.stringify({ settings: updated, ads: current.ads })
      );
    } catch {
      // ignore
    }

    // Persist to Cloud Firestore with sanitization
    try {
      const cleanSettings = sanitizeForFirestore(updated);
      await setDoc(
        doc(db, 'hero_ads', 'main'),
        { settings: cleanSettings, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      console.warn('[HeroAds] Firestore settings update warning:', err);
    }

    // Sync to Server API
    try {
      await fetch(`${API_BASE}/admin/hero-ads/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
    } catch {
      // ignore
    }

    return updated;
  },

  async createHeroAd(data: Partial<HeroAd>): Promise<HeroAd> {
    const current = await this.getHeroAds();
    const newAd: HeroAd = {
      id: `hero-ad-${Date.now()}`,
      badge: String(data.badge || 'Sponsored Promotion').trim(),
      title: String(data.title || '').trim(),
      highlightText: data.highlightText ? String(data.highlightText).trim() : undefined,
      subtitle: String(data.subtitle || '').trim(),
      ctaText: data.ctaText ? String(data.ctaText).trim() : undefined,
      ctaAction: data.ctaAction ? String(data.ctaAction).trim() : undefined,
      bgImage: data.bgImage ? String(data.bgImage).trim() : undefined,
      bgVideo: data.bgVideo ? String(data.bgVideo).trim() : undefined,
      mediaType: data.mediaType || (data.bgVideo ? 'video' : 'image'),
      gradientTheme: data.gradientTheme || 'orange',
      animationType: data.animationType || 'slide',
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      createdAt: new Date().toISOString(),
    };

    const updatedAds = [newAd, ...current.ads];

    // 1. Immediately store in local cache so page refresh never loses the ad
    try {
      localStorage.setItem(
        'huta_hero_ads_cache',
        JSON.stringify({ settings: current.settings, ads: updatedAds })
      );
    } catch {
      // ignore
    }

    // 2. Persist to Cloud Firestore with sanitized fields (no undefined properties)
    try {
      const cleanAds = sanitizeForFirestore(updatedAds);
      await setDoc(
        doc(db, 'hero_ads', 'main'),
        { ads: cleanAds, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      console.warn('[HeroAds] Firestore create warning:', err);
    }

    // 3. Persist to Node Server API & local JSON file
    try {
      await fetch(`${API_BASE}/admin/hero-ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAd),
      });
    } catch {
      // ignore
    }

    return newAd;
  },

  async updateHeroAd(id: string, data: Partial<HeroAd>): Promise<HeroAd> {
    const current = await this.getHeroAds();
    const updatedAds = current.ads.map((a) => (a.id === id ? { ...a, ...data } : a));
    const targetAd = updatedAds.find((a) => a.id === id) || (data as HeroAd);

    // 1. Immediately update LocalStorage cache
    try {
      localStorage.setItem(
        'huta_hero_ads_cache',
        JSON.stringify({ settings: current.settings, ads: updatedAds })
      );
    } catch {
      // ignore
    }

    // 2. Persist to Cloud Firestore
    try {
      const cleanAds = sanitizeForFirestore(updatedAds);
      await setDoc(
        doc(db, 'hero_ads', 'main'),
        { ads: cleanAds, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      console.warn('[HeroAds] Firestore update warning:', err);
    }

    // 3. Persist to Server API
    try {
      await fetch(`${API_BASE}/admin/hero-ads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      // ignore
    }

    return targetAd;
  },

  async toggleHeroAd(id: string): Promise<HeroAd> {
    const current = await this.getHeroAds();
    const target = current.ads.find((a) => a.id === id);
    const nextActive = target ? !target.isActive : true;
    return this.updateHeroAd(id, { isActive: nextActive });
  },

  async deleteHeroAd(id: string): Promise<{ success: boolean }> {
    const current = await this.getHeroAds();
    const updatedAds = current.ads.filter((a) => a.id !== id);

    // 1. Immediately update LocalStorage cache
    try {
      localStorage.setItem(
        'huta_hero_ads_cache',
        JSON.stringify({ settings: current.settings, ads: updatedAds })
      );
    } catch {
      // ignore
    }

    // 2. Persist to Cloud Firestore
    try {
      const cleanAds = sanitizeForFirestore(updatedAds);
      await setDoc(
        doc(db, 'hero_ads', 'main'),
        { ads: cleanAds, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      console.warn('[HeroAds] Firestore delete warning:', err);
    }

    // 3. Persist to Server API
    try {
      await fetch(`${API_BASE}/admin/hero-ads/${id}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore
    }

    return { success: true };
  },

  // -------------------------------------------------------------
  // Category Promo Image Slides (Admin-Only Management, Public View)
  // -------------------------------------------------------------

  async getPromoSlides(): Promise<{ settings: PromoSlidesSettings; slides: PromoSlide[] }> {
    const defaultData: { settings: PromoSlidesSettings; slides: PromoSlide[] } = {
      settings: {
        enabled: true,
        rotationIntervalSeconds: 5,
        aspectPreset: 'standard',
      },
      slides: [],
    };

    if (!isFirestoreQuotaActive()) {
      try {
        const docRef = doc(db, 'hero_ads', 'promo_slides');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as { settings?: PromoSlidesSettings; slides?: PromoSlide[] };
          if (data && Array.isArray(data.slides)) {
            const normalized = {
              settings: data.settings || defaultData.settings,
              slides: data.slides,
            };
            try {
              localStorage.setItem('huta_promo_slides_cache', JSON.stringify(normalized));
            } catch {
              // ignore
            }
            return normalized;
          }
        }
      } catch (err) {
        if (!recordFirestoreError(err)) {
          console.warn('[PromoSlides] Firestore read warning, falling back:', err);
        }
      }
    }

    try {
      const res = await fetch(`${API_BASE}/promo-slides`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.slides)) {
          const normalized = {
            settings: data.settings || defaultData.settings,
            slides: data.slides,
          };
          try {
            localStorage.setItem('huta_promo_slides_cache', JSON.stringify(normalized));
          } catch {
            // ignore
          }
          return normalized;
        }
      }
    } catch {
      // Standalone fallback
    }

    try {
      const cached = localStorage.getItem('huta_promo_slides_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.slides)) {
          return {
            settings: parsed.settings || defaultData.settings,
            slides: parsed.slides,
          };
        }
      }
    } catch {
      // ignore
    }

    return defaultData;
  },

  subscribeToPromoSlides(
    callback: (data: { settings: PromoSlidesSettings; slides: PromoSlide[] }) => void
  ): () => void {
    if (isFirestoreQuotaActive()) {
      this.getPromoSlides().then(callback).catch(() => {});
      return () => {};
    }
    try {
      const docRef = doc(db, 'hero_ads', 'promo_slides');
      return onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as { settings?: PromoSlidesSettings; slides?: PromoSlide[] };
            if (data && Array.isArray(data.slides)) {
              const normalized = {
                settings: data.settings || { enabled: true, rotationIntervalSeconds: 5, aspectPreset: 'standard' as const },
                slides: data.slides,
              };
              try {
                localStorage.setItem('huta_promo_slides_cache', JSON.stringify(normalized));
              } catch {
                // ignore
              }
              callback(normalized);
            }
          }
        },
        (error) => {
          recordFirestoreError(error);
          this.getPromoSlides().then(callback).catch(() => {});
        }
      );
    } catch {
      this.getPromoSlides().then(callback).catch(() => {});
      return () => {};
    }
  },

  async updatePromoSlidesSettings(settings: Partial<PromoSlidesSettings>): Promise<PromoSlidesSettings> {
    const current = await this.getPromoSlides();
    const updated: PromoSlidesSettings = {
      ...current.settings,
      ...settings,
    };

    try {
      localStorage.setItem(
        'huta_promo_slides_cache',
        JSON.stringify({ settings: updated, slides: current.slides })
      );
    } catch {
      // ignore
    }

    try {
      const cleanSettings = sanitizeForFirestore(updated);
      await setDoc(
        doc(db, 'hero_ads', 'promo_slides'),
        { settings: cleanSettings, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      console.warn('[PromoSlides] Firestore settings update warning:', err);
    }

    try {
      await fetch(`${API_BASE}/admin/promo-slides/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
    } catch {
      // ignore
    }

    return updated;
  },

  async createPromoSlide(data: Partial<PromoSlide>): Promise<PromoSlide> {
    const current = await this.getPromoSlides();
    const newSlide: PromoSlide = {
      id: `promo-slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: String(data.title || 'Promo Banner').trim(),
      imageUrl: String(data.imageUrl || '').trim(),
      badge: data.badge ? String(data.badge).trim() : undefined,
      subtitle: data.subtitle ? String(data.subtitle).trim() : undefined,
      ctaText: data.ctaText ? String(data.ctaText).trim() : undefined,
      ctaAction: data.ctaAction ? String(data.ctaAction).trim() : undefined,
      showTextOverlay: Boolean(data.showTextOverlay),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      order: current.slides.length,
      createdAt: new Date().toISOString(),
    };

    const updatedSlides = [...current.slides, newSlide];

    try {
      localStorage.setItem(
        'huta_promo_slides_cache',
        JSON.stringify({ settings: current.settings, slides: updatedSlides })
      );
    } catch {
      // ignore
    }

    try {
      const cleanSlides = sanitizeForFirestore(updatedSlides);
      await setDoc(
        doc(db, 'hero_ads', 'promo_slides'),
        { settings: sanitizeForFirestore(current.settings), slides: cleanSlides, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      console.warn('[PromoSlides] Firestore create warning:', err);
    }

    try {
      await fetch(`${API_BASE}/admin/promo-slides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSlide),
      });
    } catch {
      // ignore
    }

    return newSlide;
  },

  async updatePromoSlide(id: string, data: Partial<PromoSlide>): Promise<PromoSlide> {
    const current = await this.getPromoSlides();
    const updatedSlides = current.slides.map((s) => (s.id === id ? { ...s, ...data } : s));
    const targetSlide = updatedSlides.find((s) => s.id === id) || (data as PromoSlide);

    try {
      localStorage.setItem(
        'huta_promo_slides_cache',
        JSON.stringify({ settings: current.settings, slides: updatedSlides })
      );
    } catch {
      // ignore
    }

    try {
      const cleanSlides = sanitizeForFirestore(updatedSlides);
      await setDoc(
        doc(db, 'hero_ads', 'promo_slides'),
        { slides: cleanSlides, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      console.warn('[PromoSlides] Firestore update warning:', err);
    }

    try {
      await fetch(`${API_BASE}/admin/promo-slides/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      // ignore
    }

    return targetSlide;
  },

  async togglePromoSlide(id: string): Promise<PromoSlide> {
    const current = await this.getPromoSlides();
    const target = current.slides.find((s) => s.id === id);
    const nextActive = target ? !target.isActive : true;
    return this.updatePromoSlide(id, { isActive: nextActive });
  },

  async deletePromoSlide(id: string): Promise<{ success: boolean }> {
    const current = await this.getPromoSlides();
    const updatedSlides = current.slides.filter((s) => s.id !== id);

    try {
      localStorage.setItem(
        'huta_promo_slides_cache',
        JSON.stringify({ settings: current.settings, slides: updatedSlides })
      );
    } catch {
      // ignore
    }

    try {
      const cleanSlides = sanitizeForFirestore(updatedSlides);
      await setDoc(
        doc(db, 'hero_ads', 'promo_slides'),
        { slides: cleanSlides, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      console.warn('[PromoSlides] Firestore delete warning:', err);
    }

    try {
      await fetch(`${API_BASE}/admin/promo-slides/${id}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore
    }

    return { success: true };
  },

  async reorderPromoSlides(slides: PromoSlide[]): Promise<PromoSlide[]> {
    const current = await this.getPromoSlides();
    const orderedSlides = slides.map((s, idx) => ({ ...s, order: idx }));

    try {
      localStorage.setItem(
        'huta_promo_slides_cache',
        JSON.stringify({ settings: current.settings, slides: orderedSlides })
      );
    } catch {
      // ignore
    }

    try {
      const cleanSlides = sanitizeForFirestore(orderedSlides);
      await setDoc(
        doc(db, 'hero_ads', 'promo_slides'),
        { slides: cleanSlides, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (err) {
      console.warn('[PromoSlides] Firestore reorder warning:', err);
    }

    try {
      await fetch(`${API_BASE}/admin/promo-slides/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: orderedSlides }),
      });
    } catch {
      // ignore
    }

    return orderedSlides;
  },

  // -------------------------------------------------------------
  // Automated SMS Gateway
  // -------------------------------------------------------------

  async getSmsGatewayStatus(): Promise<SmsGatewayStatus> {
    const res = await fetch(`${API_BASE}/admin/sms-gateway/status`);
    if (!res.ok) {
      throw new Error('Failed to retrieve SMS gateway status.');
    }
    return res.json();
  },

  async testSmsGateway(phone: string, message?: string): Promise<{
    success: boolean;
    provider: string;
    details: string;
    logId: string;
    phone: string;
  }> {
    const res = await fetch(`${API_BASE}/admin/sms-gateway/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'SMS dispatch failed' }));
      throw new Error(err.error || 'SMS dispatch failed');
    }
    return res.json();
  },

  // -------------------------------------------------------------
  // Custom Domain & Live DNS Check
  // -------------------------------------------------------------

  async checkCustomDomain(domain?: string): Promise<CustomDomainStatus> {
    const query = domain ? `?domain=${encodeURIComponent(domain)}` : '';
    const res = await fetch(`${API_BASE}/admin/check-domain${query}`);
    if (!res.ok) {
      throw new Error('Failed to query custom domain DNS records.');
    }
    return res.json();
  },

  // -------------------------------------------------------------
  // Video Upload Endpoint
  // -------------------------------------------------------------

  async uploadVideo(data: string, filename?: string): Promise<{ success: boolean; url: string; size?: number }> {
    const res = await fetch(`${API_BASE}/upload-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, filename }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload video failed' }));
      throw new Error(err.error || 'Failed to upload video');
    }
    return res.json();
  },

  // -------------------------------------------------------------
  // Video Stories & Inspection Reels (Firestore + Server API + LocalStorage)
  // -------------------------------------------------------------

  async getVideoReels(): Promise<VideoReelItem[]> {
    // 1. Try Cloud Firestore first unless quota cooldown is active
    if (!isFirestoreQuotaActive()) {
      try {
        const colRef = collection(db, 'video_reels');
        const snap = await getDocs(colRef);
        const items: VideoReelItem[] = [];
        snap.forEach((d) => {
          items.push(d.data() as VideoReelItem);
        });
        if (items.length > 0) {
          items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          try {
            localStorage.setItem('huta_video_reels_cache', JSON.stringify(items));
          } catch {
            // ignore
          }
          return items;
        }
      } catch (err) {
        if (!recordFirestoreError(err)) {
          console.warn('[VideoReels] Firestore get error, checking server/cache:', err);
        }
      }
    }

    // 2. Try Express server API
    try {
      const res = await fetch(`${API_BASE}/video-reels`);
      if (res.ok) {
        const remote = await res.json();
        if (Array.isArray(remote) && remote.length > 0) {
          try {
            localStorage.setItem('huta_video_reels_cache', JSON.stringify(remote));
          } catch {
            // ignore
          }
          return remote;
        }
      }
    } catch {
      // Standalone fallback
    }

    // 3. Check local storage cache
    try {
      const cached = localStorage.getItem('huta_video_reels_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }

    return [];
  },

  subscribeToVideoReels(callback: (reels: VideoReelItem[]) => void): () => void {
    const loadFallbackReels = async () => {
      try {
        const res = await fetch(`${API_BASE}/video-reels`);
        if (res.ok) {
          const remote = await res.json();
          if (Array.isArray(remote) && remote.length > 0) {
            try {
              localStorage.setItem('huta_video_reels_cache', JSON.stringify(remote));
            } catch {}
            callback(remote);
            return;
          }
        }
      } catch {}

      try {
        const cached = localStorage.getItem('huta_video_reels_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            callback(parsed);
            return;
          }
        }
      } catch {}
      callback([]);
    };

    if (isFirestoreQuotaActive()) {
      loadFallbackReels();
      return () => {};
    }

    try {
      const colRef = collection(db, 'video_reels');
      const unsub = onSnapshot(
        colRef,
        (snapshot) => {
          const items: VideoReelItem[] = [];
          snapshot.forEach((docSnap) => {
            items.push(docSnap.data() as VideoReelItem);
          });
          items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          try {
            localStorage.setItem('huta_video_reels_cache', JSON.stringify(items));
          } catch {
            // ignore
          }
          callback(items);
        },
        (err) => {
          const msg = err?.message || String(err);
          if (msg.includes('Disconnecting idle stream') || msg.includes('CANCELLED')) {
            return;
          }
          recordFirestoreError(err);
          // Gracefully fall back to server REST + localStorage without re-hitting Firestore
          loadFallbackReels();
        }
      );
      return () => {
        try {
          unsub();
        } catch {
          // ignore
        }
      };
    } catch (err) {
      recordFirestoreError(err);
      loadFallbackReels();
      return () => {};
    }
  },

  async createVideoReel(data: Partial<VideoReelItem>): Promise<VideoReelItem> {
    const id = data.id || `reel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newReel: VideoReelItem = {
      id,
      title: data.title ? String(data.title).trim() : 'Video Story',
      videoUrl: data.videoUrl || '',
      posterImage: data.posterImage || '',
      category: data.category || 'General',
      price: typeof data.price === 'number' ? data.price : 0,
      location: data.location || 'Colombo',
      district: data.district || 'Colombo',
      sellerName: data.sellerName || 'HUTA Seller',
      phone: data.phone || '',
      isVerified: Boolean(data.isVerified),
      specsSummary: data.specsSummary || (data.category ? `${data.category} • ${data.location || 'Sri Lanka'}` : ''),
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      createdAt: data.createdAt || new Date().toISOString(),
      views: data.views || 0,
      listingId: data.listingId,
    };

    if (!isFirestoreQuotaActive()) {
      try {
        await setDoc(doc(db, 'video_reels', id), sanitizeForFirestore(newReel));
      } catch (fsErr) {
        if (!recordFirestoreError(fsErr)) {
          console.warn('[VideoReels] Firestore set error:', fsErr);
        }
      }
    }

    // Sync to Express server API
    try {
      await fetch(`${API_BASE}/video-reels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReel),
      });
    } catch {
      // Standalone
    }

    // Update local cache
    try {
      const cached = localStorage.getItem('huta_video_reels_cache');
      const list: VideoReelItem[] = cached ? JSON.parse(cached) : [];
      const updated = [newReel, ...list.filter((r) => r.id !== id)];
      localStorage.setItem('huta_video_reels_cache', JSON.stringify(updated));
    } catch {
      // ignore
    }

    return newReel;
  },

  async updateVideoReel(id: string, data: Partial<VideoReelItem>): Promise<VideoReelItem> {
    if (!isFirestoreQuotaActive()) {
      try {
        await setDoc(doc(db, 'video_reels', id), sanitizeForFirestore(data), { merge: true });
      } catch (fsErr) {
        if (!recordFirestoreError(fsErr)) {
          console.warn('[VideoReels] Firestore update error:', fsErr);
        }
      }
    }

    try {
      await fetch(`${API_BASE}/video-reels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      // Standalone
    }

    try {
      const cached = localStorage.getItem('huta_video_reels_cache');
      if (cached) {
        const list: VideoReelItem[] = JSON.parse(cached);
        const updated = list.map((r) => (r.id === id ? { ...r, ...data } : r));
        localStorage.setItem('huta_video_reels_cache', JSON.stringify(updated));
      }
    } catch {
      // ignore
    }

    const all = await this.getVideoReels();
    return all.find((r) => r.id === id) || (data as VideoReelItem);
  },

  async toggleVideoReel(id: string): Promise<VideoReelItem> {
    const all = await this.getVideoReels();
    const target = all.find((r) => r.id === id);
    const nextActive = target ? target.isActive === false : false;
    return this.updateVideoReel(id, { isActive: nextActive });
  },

  async deleteVideoReel(id: string): Promise<{ success: boolean }> {
    if (!isFirestoreQuotaActive()) {
      try {
        await deleteDoc(doc(db, 'video_reels', id));
      } catch (fsErr) {
        if (!recordFirestoreError(fsErr)) {
          console.warn('[VideoReels] Firestore delete error:', fsErr);
        }
      }
    }

    try {
      await fetch(`${API_BASE}/video-reels/${id}`, { method: 'DELETE' });
    } catch {
      // Standalone
    }

    try {
      const cached = localStorage.getItem('huta_video_reels_cache');
      if (cached) {
        const list: VideoReelItem[] = JSON.parse(cached);
        const updated = list.filter((r) => r.id !== id);
        localStorage.setItem('huta_video_reels_cache', JSON.stringify(updated));
      }
    } catch {
      // ignore
    }

    return { success: true };
  },

  // -------------------------------------------------------------
  // Sri Lankan E-Store Directory & Online Marketplace Platform
  // -------------------------------------------------------------

  async getEStores(): Promise<EStore[]> {
    const rawDeleted = localStorage.getItem('huta_deleted_estores');
    const deletedIds: string[] = rawDeleted ? JSON.parse(rawDeleted) : [];

    // Clean up previous default/sample store IDs so they never appear
    const sampleIdsToRemove = [
      'estore-ceylon-spices',
      'estore-urban-lanka',
      'estore-techgadgets-lk',
      'estore-ayurveda-lanka',
    ];

    for (const sId of sampleIdsToRemove) {
      if (!deletedIds.includes(sId)) {
        deletedIds.push(sId);
        if (!isFirestoreQuotaActive()) {
          try {
            deleteDoc(doc(db, 'estores', sId)).catch(() => {});
          } catch {}
        }
      }
    }
    try {
      localStorage.setItem('huta_deleted_estores', JSON.stringify(deletedIds));
    } catch {}

    // 1. Try Cloud Firestore first unless quota cooldown is active
    if (!isFirestoreQuotaActive()) {
      try {
        const snap = await getDocs(collection(db, 'estores'));
        if (!snap.empty) {
          const list: EStore[] = [];
          snap.forEach((d) => {
            const item = d.data() as EStore;
            if (!deletedIds.includes(item.id) && !sampleIdsToRemove.includes(item.id)) {
              list.push({ ...item, id: d.id, products: Array.isArray(item.products) ? item.products : [] });
            }
          });
          try {
            localStorage.setItem('huta_estores_cache', JSON.stringify(list));
          } catch {}
          return list;
        }
      } catch (fsErr) {
        if (!recordFirestoreError(fsErr)) {
          console.warn('[EStores] Firestore fetch error:', fsErr);
        }
      }
    }

    // 2. Try Express server API fallback
    try {
      const res = await fetch(`${API_BASE}/estores`);
      if (res.ok) {
        const remote: EStore[] = await res.json();
        if (Array.isArray(remote)) {
          const filtered = remote
            .filter((s) => !deletedIds.includes(s.id) && !sampleIdsToRemove.includes(s.id))
            .map((s) => ({ ...s, products: Array.isArray(s.products) ? s.products : [] }));
          if (filtered.length > 0) {
            try {
              localStorage.setItem('huta_estores_cache', JSON.stringify(filtered));
            } catch {}
            return filtered;
          }
        }
      }
    } catch {
      // Standalone fallback
    }

    // 3. Try localStorage cache (excluding deleted and sample stores)
    try {
      const cached = localStorage.getItem('huta_estores_cache');
      if (cached) {
        const list: EStore[] = JSON.parse(cached);
        const filtered = list.filter((s) => !deletedIds.includes(s.id) && !sampleIdsToRemove.includes(s.id));
        return filtered;
      }
    } catch {}

    return [];
  },

  async getEStoreById(id: string): Promise<EStore | null> {
    if (!isFirestoreQuotaActive()) {
      try {
        const snap = await getDoc(doc(db, 'estores', id));
        if (snap.exists()) {
          const item = snap.data() as EStore;
          return { ...item, id: snap.id, products: Array.isArray(item.products) ? item.products : [] };
        }
      } catch (err) {
        recordFirestoreError(err);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/estores/${id}`);
      if (res.ok) {
        const item = (await res.json()) as EStore;
        return { ...item, products: Array.isArray(item.products) ? item.products : [] };
      }
    } catch {
      // ignore
    }

    const all = await this.getEStores();
    return all.find((s) => s.id === id) || null;
  },

  async createEStore(data: Partial<EStore>): Promise<EStore> {
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
      rating: 5.0,
      reviewCount: 1,
      isVerifiedMerchant: true,
      deliveryInfo: data.deliveryInfo || 'Islandwide Cash on Delivery (COD) Available • Fast 2-3 Days Delivery',
      returnPolicy: data.returnPolicy || '7-Day Easy Exchange & Return Policy',
      foundedYear: data.foundedYear || new Date().getFullYear().toString(),
      ownerId: data.ownerId || '',
      products: Array.isArray(data.products) ? data.products : [],
      createdAt: new Date().toISOString(),
    };

    if (!isFirestoreQuotaActive()) {
      try {
        await setDoc(doc(db, 'estores', id), sanitizeForFirestore(newStore));
      } catch (fsErr) {
        if (!recordFirestoreError(fsErr)) {
          console.warn('[EStores] Firestore set error:', fsErr);
        }
      }
    }

    // Save to Express backend API
    try {
      await fetch(`${API_BASE}/estores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStore),
      });
    } catch {
      // Standalone
    }

    // Update cache
    try {
      const cached = localStorage.getItem('huta_estores_cache');
      const list: EStore[] = cached ? JSON.parse(cached) : [];
      const updated = [newStore, ...list.filter((s) => s.id !== id)];
      localStorage.setItem('huta_estores_cache', JSON.stringify(updated));
    } catch {}

    return newStore;
  },

  async updateEStore(id: string, data: Partial<EStore>): Promise<EStore> {
    if (!isFirestoreQuotaActive()) {
      try {
        await setDoc(doc(db, 'estores', id), sanitizeForFirestore(data), { merge: true });
      } catch (fsErr) {
        if (!recordFirestoreError(fsErr)) {
          console.warn('[EStores] Firestore update error:', fsErr);
        }
      }
    }

    try {
      await fetch(`${API_BASE}/estores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      // Standalone
    }

    try {
      const cached = localStorage.getItem('huta_estores_cache');
      if (cached) {
        const list: EStore[] = JSON.parse(cached);
        const updated = list.map((s) => (s.id === id ? { ...s, ...data } : s));
        localStorage.setItem('huta_estores_cache', JSON.stringify(updated));
      }
    } catch {}

    const store = await this.getEStoreById(id);
    return store || (data as EStore);
  },

  async deleteEStore(id: string): Promise<{ success: boolean }> {
    if (!isFirestoreQuotaActive()) {
      try {
        await deleteDoc(doc(db, 'estores', id));
      } catch (fsErr) {
        if (!recordFirestoreError(fsErr)) {
          console.warn('[EStores] Firestore delete error:', fsErr);
        }
      }
    }

    try {
      await fetch(`${API_BASE}/estores/${id}`, { method: 'DELETE' });
    } catch {
      // Standalone
    }

    try {
      const raw = localStorage.getItem('huta_deleted_estores');
      const deleted: string[] = raw ? JSON.parse(raw) : [];
      if (!deleted.includes(id)) {
        deleted.push(id);
        localStorage.setItem('huta_deleted_estores', JSON.stringify(deleted));
      }
      const cached = localStorage.getItem('huta_estores_cache');
      if (cached) {
        const list: EStore[] = JSON.parse(cached);
        const updated = list.filter((s) => s.id !== id);
        localStorage.setItem('huta_estores_cache', JSON.stringify(updated));
      }
    } catch {}

    return { success: true };
  },

  async addProductToEStore(storeId: string, productData: Partial<EStoreProduct>): Promise<EStore> {
    const store = await this.getEStoreById(storeId);
    if (!store) throw new Error('E-Store not found');

    const productId = productData.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newProduct: EStoreProduct = {
      id: productId,
      storeId,
      name: String(productData.name || 'Store Item').trim(),
      price: typeof productData.price === 'number' ? productData.price : 0,
      originalPrice: productData.originalPrice,
      image: productData.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      productUrl: productData.productUrl ? String(productData.productUrl).trim() : store.websiteUrl,
      description: String(productData.description || '').trim(),
      category: productData.category || store.category,
      inStock: productData.inStock !== undefined ? Boolean(productData.inStock) : true,
      featured: Boolean(productData.featured),
    };

    const updatedProducts = [newProduct, ...(store.products || [])];
    return this.updateEStore(storeId, { products: updatedProducts });
  },

  async deleteProductFromEStore(storeId: string, productId: string): Promise<EStore> {
    const store = await this.getEStoreById(storeId);
    if (!store) throw new Error('E-Store not found');

    const updatedProducts = (store.products || []).filter((p) => p.id !== productId);
    return this.updateEStore(storeId, { products: updatedProducts });
  },

  async uploadImage(data: string, filename?: string): Promise<{ success: boolean; url: string; size?: number }> {
    const res = await fetch(`${API_BASE}/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, filename }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload image failed' }));
      throw new Error(err.error || 'Failed to upload image');
    }
    return res.json();
  },

  // -------------------------------------------------------------
  // Live Sri Lanka "Hot News" Aggregator
  // -------------------------------------------------------------
  async getSriLankaNews(forceRefresh = false): Promise<HotNewsResponse> {
    const CACHE_KEY = 'huta_sri_lanka_news_cache';
    try {
      const url = forceRefresh ? `${API_BASE}/sri-lanka-news?refresh=1` : `${API_BASE}/sri-lanka-news`;
      const res = await fetch(url, { cache: 'no-store' });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data: HotNewsResponse = await res.json();
        if (Array.isArray(data.articles) && data.articles.length > 0) {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
          } catch {
            // ignore
          }
          return data;
        }
      }
    } catch {
      // Fall through to client-side RSS fallback for static deploys
    }

    // Fallback for static/serverless deploys (e.g. Vercel static build without Express server)
    try {
      const stripHtml = (raw: string) =>
        (raw || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const classify = (title: string, source: string) => {
        const hay = `${title} ${source}`.toLowerCase();
        if (source === 'EconomyNext' || /\b(rupee|lkr|cbsl|imf|economy|export|tax|stock|bank|gdp|budget)\b/.test(hay)) {
          return 'Business & Economy' as const;
        }
        if (/\b(cricket|rugby|football|sports|match|tournament|cup|slc|athlete)\b/.test(hay)) {
          return 'Sports' as const;
        }
        if (/\b(ev|vehicle|car|ai|tech|digital|telecom|dialog|slt|cyber|app|startup|port)\b/.test(hay)) {
          return 'Tech & Auto' as const;
        }
        if (/\b(breaking|alert|urgent|police|weather|cyclone|flood|cabinet|parliament|president|minister)\b/.test(hay)) {
          return 'Breaking' as const;
        }
        return 'Sri Lanka' as const;
      };

      const extractImgFromHtml = (html: string): string | undefined => {
        if (!html) return undefined;
        const match = html.match(/<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i);
        if (!match || !match[1]) return undefined;
        const url = match[1].replace(/&amp;/g, '&').trim();
        if (
          !url ||
          url.includes('favicon') ||
          url.includes('1x1') ||
          url.includes('pixel') ||
          !/^https?:\/\//i.test(url)
        ) {
          return undefined;
        }
        return url;
      };

      const feeds = [
        { rss: 'https://www.newswire.lk/feed/', source: 'Newswire.lk' },
        { rss: 'https://economynext.com/feed/', source: 'EconomyNext' },
        { rss: 'https://www.adaderana.lk/rss.php', source: 'Ada Derana' },
        { rss: 'https://news.google.com/rss/search?q=Sri+Lanka+when:2d&hl=en-US&gl=LK&ceid=LK:en', source: 'Google News LK' },
      ];

      const responses = await Promise.allSettled(
        feeds.map((f) =>
          fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(f.rss)}`).then(async (r) => {
            if (!r.ok) return null;
            const json = await r.json();
            return { source: f.source, json };
          })
        )
      );

      const collected: HotNewsResponse['articles'] = [];
      const seenTitles = new Set<string>();
      for (const r of responses) {
        if (r.status !== 'fulfilled' || !r.value?.json?.items) continue;
        const { source, json } = r.value;
        for (const item of json.items.slice(0, 12)) {
          const title = stripHtml(item.title || '');
          const link = typeof item.link === 'string' ? item.link.trim() : '';
          if (!title || !/^https?:\/\//i.test(link)) continue;
          const key = title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 48);
          if (!key || seenTitles.has(key)) continue;
          seenTitles.add(key);

          const rawDesc = typeof item.description === 'string' ? item.description : '';
          const rawContent = typeof item.content === 'string' ? item.content : '';
          const fullText = stripHtml(rawContent || rawDesc);
          const thumb = typeof item.thumbnail === 'string' && /^https?:\/\//i.test(item.thumbnail) ? item.thumbnail : undefined;
          const encLink = typeof item.enclosure?.link === 'string' && /^https?:\/\//i.test(item.enclosure.link) ? item.enclosure.link : undefined;
          const encThumb = typeof item.enclosure?.thumbnail === 'string' && /^https?:\/\//i.test(item.enclosure.thumbnail) ? item.enclosure.thumbnail : undefined;
          const imageUrl =
            thumb ||
            encLink ||
            encThumb ||
            extractImgFromHtml(rawDesc) ||
            extractImgFromHtml(rawContent);

          const pubDateIso = item.pubDate
            ? new Date(String(item.pubDate).replace(' ', 'T') + (String(item.pubDate).includes('Z') || String(item.pubDate).includes('+') ? '' : 'Z'))
            : new Date();
          const publishedAt = isNaN(pubDateIso.getTime()) ? new Date().toISOString() : pubDateIso.toISOString();

          collected.push({
            id: `lk-news-${btoa(unescape(encodeURIComponent(link))).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`,
            title,
            summary: fullText ? fullText.slice(0, 300) : `Latest Sri Lanka update reported by ${source}.`,
            content: fullText ? fullText.slice(0, 2600) : undefined,
            link,
            source,
            category: classify(title, source),
            imageUrl,
            publishedAt,
          });
        }
      }

      if (collected.length > 0) {
        collected.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        const result: HotNewsResponse = {
          articles: collected.slice(0, 30),
          sources: Array.from(new Set(collected.map((a) => a.source))),
          lastUpdated: new Date().toISOString(),
          isLive: true,
        };
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(result));
        } catch {
          // ignore
        }
        return result;
      }
    } catch {
      // Fallback to localStorage cache
    }

    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as HotNewsResponse;
        if (parsed && Array.isArray(parsed.articles)) {
          const ids = parsed.articles.map((a) => a.id);
          if (new Set(ids).size === parsed.articles.length) {
            return parsed;
          }
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch {
      // ignore
    }

    return {
      articles: [],
      sources: [],
      lastUpdated: new Date().toISOString(),
      isLive: false,
    };
  },

  async getSriLankaNewsArticlePreview(articleUrl: string): Promise<{
    paragraphs: string[];
    resolvedUrl: string;
    imageUrl?: string;
  }> {
    try {
      const res = await fetch(
        `${API_BASE}/sri-lanka-news/article?url=${encodeURIComponent(articleUrl)}`
      );
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        return {
          paragraphs: Array.isArray(data.paragraphs) ? data.paragraphs : [],
          resolvedUrl: typeof data.resolvedUrl === 'string' && data.resolvedUrl ? data.resolvedUrl : articleUrl,
          imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : undefined,
        };
      }
    } catch {
      // Fallback to RSS summary
    }
    return { paragraphs: [], resolvedUrl: articleUrl };
  },

  // -------------------------------------------------------------
  // Wanted / Buyer Request Board ("Looking For")
  // -------------------------------------------------------------

  getGuestBuyerRequestIds(): string[] {
    try {
      const raw = localStorage.getItem('huta_guest_buyer_request_ids');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  addGuestBuyerRequestId(id: string): void {
    try {
      const current = this.getGuestBuyerRequestIds();
      if (!current.includes(id)) {
        current.unshift(id);
        localStorage.setItem('huta_guest_buyer_request_ids', JSON.stringify(current));
      }
    } catch {
      // ignore
    }
  },

  subscribeToBuyerRequests(callback: (requests: BuyerRequest[]) => void): () => void {
    let fallbackTimer: ReturnType<typeof setInterval> | null = null;
    const fetchRest = async (): Promise<BuyerRequest[]> => {
      try {
        const res = await fetch(`${API_BASE}/buyer-requests`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            return [...data].sort(
              (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );
          }
        }
      } catch {
        // ignore network error
      }
      return [];
    };

    const startRestFallback = () => {
      if (fallbackTimer) return;
      fetchRest().then((items) => {
        if (items.length > 0) callback(items);
      }).catch(() => {});
      fallbackTimer = setInterval(() => {
        fetchRest().then(callback).catch(() => {});
      }, 30000);
    };

    if (isFirestoreQuotaActive()) {
      startRestFallback();
      return () => {
        if (fallbackTimer) clearInterval(fallbackTimer);
      };
    }

    try {
      const colRef = collection(db, 'buyer_requests');
      const unsub = onSnapshot(
        colRef,
        (snapshot) => {
          const fsItems: BuyerRequest[] = [];
          snapshot.forEach((docSnap) => {
            const raw = docSnap.data() as BuyerRequest;
            const offers = Array.isArray(raw.offers) ? raw.offers : [];
            fsItems.push({
              ...raw,
              id: raw.id || docSnap.id,
              offers,
              offersCount: typeof raw.offersCount === 'number' ? raw.offersCount : offers.length,
            });
          });
          if (fsItems.length === 0) {
            fetchRest().then(callback).catch(() => callback([]));
          } else {
            fsItems.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            callback(fsItems);
          }
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, 'buyer_requests');
          recordFirestoreError(err);
          startRestFallback();
        }
      );
      return () => {
        try {
          unsub();
        } catch {
          // ignore
        }
        if (fallbackTimer) clearInterval(fallbackTimer);
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'buyer_requests');
      recordFirestoreError(err);
      startRestFallback();
      return () => {
        if (fallbackTimer) clearInterval(fallbackTimer);
      };
    }
  },

  async getBuyerRequests(): Promise<BuyerRequest[]> {
    const map = new Map<string, BuyerRequest>();

    if (!isFirestoreQuotaActive()) {
      try {
        const snap = await getDocs(collection(db, 'buyer_requests'));
        snap.forEach((docSnap) => {
          const raw = docSnap.data() as BuyerRequest;
          const offers = Array.isArray(raw.offers) ? raw.offers : [];
          const normalized: BuyerRequest = {
            ...raw,
            id: raw.id || docSnap.id,
            offers,
            offersCount: typeof raw.offersCount === 'number' ? raw.offersCount : offers.length,
          };
          map.set(normalized.id, normalized);
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'buyer_requests');
        recordFirestoreError(err);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/buyer-requests`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item && item.id && !map.has(item.id)) {
              const offers = Array.isArray(item.offers) ? item.offers : [];
              map.set(item.id, {
                ...item,
                offers,
                offersCount: typeof item.offersCount === 'number' ? item.offersCount : offers.length,
              });
            }
          }
        }
      }
    } catch {
      // backend optional
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  },

  async createBuyerRequest(data: {
    title: string;
    category: string;
    district: string;
    location?: string;
    maxBudget: number;
    urgency: BuyerRequestUrgency;
    description: string;
    buyerName: string;
    buyerPhone: string;
    userId?: string;
  }): Promise<BuyerRequest> {
    const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const districtVal = String(data.district || 'Colombo').trim() || 'Colombo';
    const normalizedPhone = normalizeSriLankanPhone(data.buyerPhone) || String(data.buyerPhone).trim();

    const newReq: BuyerRequest = {
      id,
      title: String(data.title || '').trim(),
      category: String(data.category || 'Other').trim() || 'Other',
      district: districtVal,
      location: String(data.location || districtVal).trim() || districtVal,
      maxBudget: Math.max(0, Number(data.maxBudget) || 0),
      urgency: data.urgency || 'this_week',
      description: String(data.description || '').trim(),
      buyerName: String(data.buyerName || 'Verified Buyer').trim() || 'Verified Buyer',
      buyerPhone: normalizedPhone,
      userId: data.userId || api.getCurrentUser()?.id || 'guest',
      status: 'open',
      offersCount: 0,
      offers: [],
      createdAt: now,
      updatedAt: now,
    };

    const clean = sanitizeForFirestore(newReq) as BuyerRequest;

    if (!isFirestoreQuotaActive()) {
      try {
        await setDoc(doc(db, 'buyer_requests', id), clean);
      } catch (err) {
        if (!recordFirestoreError(err)) {
          handleFirestoreError(err, OperationType.CREATE, `buyer_requests/${id}`);
        }
      }
    }

    try {
      const res = await fetch(`${API_BASE}/buyer-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clean),
      });
      if (res.ok) {
        const saved = await res.json();
        this.addGuestBuyerRequestId(saved.id || clean.id);
        return saved;
      }
    } catch {
      // backend optional
    }

    this.addGuestBuyerRequestId(clean.id);
    return clean;
  },

  async addBuyerRequestOffer(
    requestItem: BuyerRequest,
    offerInput: {
      sellerName: string;
      sellerPhone: string;
      sellerUserId?: string;
      itemTitle: string;
      offeredPrice: number;
      message: string;
      listingId?: string;
    }
  ): Promise<BuyerRequest> {
    const newOffer: BuyerRequestOffer = {
      id: `offer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sellerName: String(offerInput.sellerName || '').trim(),
      sellerPhone: normalizeSriLankanPhone(offerInput.sellerPhone) || String(offerInput.sellerPhone).trim(),
      sellerUserId: offerInput.sellerUserId,
      itemTitle: String(offerInput.itemTitle || '').trim(),
      offeredPrice: Math.max(0, Number(offerInput.offeredPrice) || 0),
      message: String(offerInput.message || '').trim(),
      listingId: offerInput.listingId,
      createdAt: new Date().toISOString(),
    };

    const currentOffers = Array.isArray(requestItem.offers) ? requestItem.offers : [];
    const updatedOffers = [newOffer, ...currentOffers];
    const now = new Date().toISOString();
    const updatedReq: BuyerRequest = {
      ...requestItem,
      offers: updatedOffers,
      offersCount: updatedOffers.length,
      updatedAt: now,
    };

    const cleanUpdate = sanitizeForFirestore({
      offers: updatedOffers,
      offersCount: updatedOffers.length,
      updatedAt: now,
    });

    if (!isFirestoreQuotaActive()) {
      try {
        await updateDoc(doc(db, 'buyer_requests', requestItem.id), cleanUpdate);
      } catch (err) {
        if (!recordFirestoreError(err)) {
          try {
            await setDoc(doc(db, 'buyer_requests', requestItem.id), sanitizeForFirestore(updatedReq), { merge: true });
          } catch (innerErr) {
            handleFirestoreError(innerErr, OperationType.UPDATE, `buyer_requests/${requestItem.id}`);
          }
        }
      }
    }

    try {
      const res = await fetch(`${API_BASE}/buyer-requests/${requestItem.id}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOffer),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // backend optional
    }

    return updatedReq;
  },

  async updateBuyerRequestStatus(requestId: string, status: BuyerRequestStatus): Promise<void> {
    const updatedAt = new Date().toISOString();
    if (!isFirestoreQuotaActive()) {
      try {
        await updateDoc(doc(db, 'buyer_requests', requestId), { status, updatedAt });
      } catch (err) {
        if (!recordFirestoreError(err)) {
          handleFirestoreError(err, OperationType.UPDATE, `buyer_requests/${requestId}`);
        }
      }
    }

    try {
      await fetch(`${API_BASE}/buyer-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {
      // backend optional
    }
  },

  async deleteBuyerRequest(requestId: string): Promise<void> {
    if (!isFirestoreQuotaActive()) {
      try {
        await deleteDoc(doc(db, 'buyer_requests', requestId));
      } catch (err) {
        if (!recordFirestoreError(err)) {
          handleFirestoreError(err, OperationType.DELETE, `buyer_requests/${requestId}`);
        }
      }
    }

    try {
      await fetch(`${API_BASE}/buyer-requests/${requestId}`, {
        method: 'DELETE',
      });
    } catch {
      // backend optional
    }
  },

  // -------------------------------------------------------------
  // Sri Lanka Donate Hub (Most Needed Hospitals & Humanitarian Aid)
  // -------------------------------------------------------------

  getGuestDonationCauseIds(): string[] {
    try {
      const raw = localStorage.getItem('huta_guest_donation_ids');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  addGuestDonationCauseId(id: string): void {
    try {
      const ids = this.getGuestDonationCauseIds();
      if (!ids.includes(id)) {
        ids.unshift(id);
        localStorage.setItem('huta_guest_donation_ids', JSON.stringify(ids.slice(0, 50)));
      }
    } catch {
      // ignore
    }
  },

  subscribeToDonationCauses(
    callback: (causes: DonationCause[]) => void,
    onStatusChange?: (status: 'live' | 'reconnecting' | 'offline') => void
  ): () => void {
    let fallbackTimer: ReturnType<typeof setInterval> | null = null;
    let eventSource: EventSource | null = null;
    let unsubFirestore: (() => void) | null = null;
    let sseConnected = false;
    let fsConnected = false;
    let disposed = false;

    const sseMap = new Map<string, DonationCause>();
    const fsMap = new Map<string, DonationCause>();
    const deletedIds = new Set<string>();

    const urgencyRank: Record<string, number> = { critical: 0, urgent: 1, ongoing: 2 };
    const sortCauses = (list: DonationCause[]) =>
      [...list].sort((a, b) => {
        const uDiff = (urgencyRank[a.urgency] ?? 3) - (urgencyRank[b.urgency] ?? 3);
        if (uDiff !== 0) return uDiff;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

    const normalizeCause = (raw: DonationCause, fallbackId?: string): DonationCause => {
      const pledges = Array.isArray(raw.pledges) ? raw.pledges : [];
      const neededItems = Array.isArray(raw.neededItems) ? raw.neededItems : [];
      return {
        ...raw,
        id: raw.id || fallbackId || '',
        neededItems,
        pledges,
        pledgeCount: typeof raw.pledgeCount === 'number' ? raw.pledgeCount : pledges.length,
        totalPledgedLkr:
          typeof raw.totalPledgedLkr === 'number'
            ? raw.totalPledgedLkr
            : pledges.reduce((acc, p) => acc + Math.max(0, Number(p.amountLkr) || 0), 0),
      };
    };

    const updateStatus = () => {
      if (disposed || !onStatusChange) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        onStatusChange('offline');
        return;
      }
      onStatusChange(sseConnected || fsConnected ? 'live' : 'reconnecting');
    };

    const emitMerged = () => {
      if (disposed) return;
      const merged = new Map<string, DonationCause>();

      for (const [id, item] of sseMap.entries()) {
        if (!deletedIds.has(id)) {
          merged.set(id, item);
        }
      }

      for (const [id, fsItem] of fsMap.entries()) {
        if (deletedIds.has(id)) continue;
        const sseItem = merged.get(id);
        if (!sseItem) {
          merged.set(id, fsItem);
          continue;
        }
        const fsUpdated = new Date(fsItem.updatedAt || fsItem.createdAt || 0).getTime();
        const sseUpdated = new Date(sseItem.updatedAt || sseItem.createdAt || 0).getTime();
        if (fsUpdated > sseUpdated || (fsUpdated === sseUpdated && (fsItem.pledgeCount || 0) > (sseItem.pledgeCount || 0))) {
          merged.set(id, fsItem);
        }
      }

      callback(sortCauses(Array.from(merged.values())));
    };

    const fetchRest = async (): Promise<DonationCause[]> => {
      try {
        const res = await fetch(`${API_BASE}/donations`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            sseMap.clear();
            for (const item of data) {
              if (item && item.id) {
                deletedIds.delete(item.id);
                sseMap.set(item.id, normalizeCause(item));
              }
            }
            emitMerged();
            return sortCauses(data);
          }
        }
      } catch {
        // ignore network error
      }
      return [];
    };

    const startRestFallback = () => {
      if (fallbackTimer || disposed) return;
      fetchRest().catch(() => {});
      fallbackTimer = setInterval(() => {
        if (!sseConnected && !fsConnected) {
          fetchRest().catch(() => {});
        }
      }, 15000);
    };

    updateStatus();

    // 1. Primary Real-Time Server-Sent Events (SSE) stream (instant <100ms updates across sessions)
    if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
      try {
        eventSource = new EventSource(`${API_BASE}/donations/stream`);

        const handleSsePayload = (rawData: string) => {
          if (disposed) return;
          try {
            const payload = JSON.parse(rawData) as {
              type?: string;
              cause?: DonationCause | null;
              deletedId?: string | null;
              causes?: DonationCause[];
            };

            if (payload.deletedId) {
              deletedIds.add(payload.deletedId);
              sseMap.delete(payload.deletedId);
              fsMap.delete(payload.deletedId);
            }

            if (Array.isArray(payload.causes)) {
              const incomingIds = new Set<string>();
              sseMap.clear();
              for (const rawItem of payload.causes) {
                if (rawItem && rawItem.id) {
                  incomingIds.add(rawItem.id);
                  deletedIds.delete(rawItem.id);
                  sseMap.set(rawItem.id, normalizeCause(rawItem));
                }
              }
              // Clear stale items on full authoritative init/delete from server
              if (payload.type === 'init' || payload.type === 'delete') {
                for (const existingFsId of Array.from(fsMap.keys())) {
                  if (!incomingIds.has(existingFsId) && payload.deletedId === existingFsId) {
                    fsMap.delete(existingFsId);
                  }
                }
              }
            } else if (payload.cause && payload.cause.id) {
              deletedIds.delete(payload.cause.id);
              sseMap.set(payload.cause.id, normalizeCause(payload.cause));
            }

            sseConnected = true;
            updateStatus();
            emitMerged();
          } catch {
            // ignore malformed event frame
          }
        };

        eventSource.addEventListener('donations', (ev) => {
          handleSsePayload((ev as MessageEvent).data);
        });
        eventSource.onmessage = (ev) => {
          handleSsePayload(ev.data);
        };
        eventSource.onopen = () => {
          sseConnected = true;
          updateStatus();
        };
        eventSource.onerror = () => {
          sseConnected = false;
          updateStatus();
        };
      } catch {
        startRestFallback();
      }
    } else {
      startRestFallback();
    }

    // 2. Real-Time Cloud Firestore listener (mirrors across deployments & offline cache)
    if (!isFirestoreQuotaActive()) {
      try {
        const colRef = collection(db, 'donations');
        unsubFirestore = onSnapshot(
          colRef,
          (snapshot) => {
            if (disposed) return;
            for (const change of snapshot.docChanges()) {
              if (change.type === 'removed') {
                const removedId = change.doc.id;
                deletedIds.add(removedId);
                fsMap.delete(removedId);
                sseMap.delete(removedId);
              }
            }

            fsMap.clear();
            snapshot.forEach((docSnap) => {
              const normalized = normalizeCause(docSnap.data() as DonationCause, docSnap.id);
              if (normalized.id) {
                deletedIds.delete(normalized.id);
                fsMap.set(normalized.id, normalized);
              }
            });

            fsConnected = true;
            updateStatus();
            if (fsMap.size > 0 || sseMap.size > 0) {
              emitMerged();
            } else {
              fetchRest().catch(() => {});
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, 'donations');
            recordFirestoreError(err);
            fsConnected = false;
            updateStatus();
            if (!sseConnected) startRestFallback();
          }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'donations');
        recordFirestoreError(err);
        fsConnected = false;
        updateStatus();
        if (!sseConnected) startRestFallback();
      }
    }

    // 3. Re-sync immediately when device wakes up, returns to tab, or regains internet
    const handleOnline = () => {
      updateStatus();
      fetchRest().catch(() => {});
    };
    const handleOffline = () => {
      updateStatus();
    };
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchRest().catch(() => {});
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      disposed = true;
      if (fallbackTimer) clearInterval(fallbackTimer);
      if (eventSource) {
        try {
          eventSource.close();
        } catch {
          // ignore
        }
      }
      if (unsubFirestore) {
        try {
          unsubFirestore();
        } catch {
          // ignore
        }
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  },

  async getDonationCauses(): Promise<DonationCause[]> {
    const map = new Map<string, DonationCause>();

    if (!isFirestoreQuotaActive()) {
      try {
        const snap = await getDocs(collection(db, 'donations'));
        snap.forEach((docSnap) => {
          const raw = docSnap.data() as DonationCause;
          const pledges = Array.isArray(raw.pledges) ? raw.pledges : [];
          const neededItems = Array.isArray(raw.neededItems) ? raw.neededItems : [];
          const normalized: DonationCause = {
            ...raw,
            id: raw.id || docSnap.id,
            neededItems,
            pledges,
            pledgeCount: typeof raw.pledgeCount === 'number' ? raw.pledgeCount : pledges.length,
            totalPledgedLkr:
              typeof raw.totalPledgedLkr === 'number'
                ? raw.totalPledgedLkr
                : pledges.reduce((acc, p) => acc + Math.max(0, Number(p.amountLkr) || 0), 0),
          };
          map.set(normalized.id, normalized);
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'donations');
        recordFirestoreError(err);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/donations`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item && item.id && !map.has(item.id)) {
              const pledges = Array.isArray(item.pledges) ? item.pledges : [];
              const neededItems = Array.isArray(item.neededItems) ? item.neededItems : [];
              map.set(item.id, {
                ...item,
                neededItems,
                pledges,
                pledgeCount: typeof item.pledgeCount === 'number' ? item.pledgeCount : pledges.length,
                totalPledgedLkr:
                  typeof item.totalPledgedLkr === 'number'
                    ? item.totalPledgedLkr
                    : pledges.reduce((acc: number, p: DonationPledge) => acc + Math.max(0, Number(p.amountLkr) || 0), 0),
              });
            }
          }
        }
      }
    } catch {
      // backend optional
    }

    const urgencyRank: Record<string, number> = { critical: 0, urgent: 1, ongoing: 2 };
    return Array.from(map.values()).sort((a, b) => {
      const uDiff = (urgencyRank[a.urgency] ?? 3) - (urgencyRank[b.urgency] ?? 3);
      if (uDiff !== 0) return uDiff;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  },

  async createDonationCause(data: {
    organizationName: string;
    title: string;
    category: DonationCategory;
    district: string;
    address: string;
    officialWebsite?: string;
    contactPhone: string;
    contactPerson?: string;
    urgency: DonationUrgency;
    bankDetailsNote: string;
    neededItems: string[];
    description: string;
    image?: string;
    userId?: string;
  }): Promise<DonationCause> {
    const id = `don_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const districtVal = String(data.district || 'Colombo').trim().slice(0, 100) || 'Colombo';
    const normalizedPhone = normalizeSriLankanPhone(data.contactPhone) || String(data.contactPhone).trim();

    const newCause: DonationCause = {
      id,
      organizationName: String(data.organizationName || '').trim().slice(0, 160),
      title: String(data.title || '').trim().slice(0, 200),
      category: data.category || 'Hospitals & Medical',
      district: districtVal,
      address: String(data.address || districtVal).trim().slice(0, 240),
      officialWebsite: data.officialWebsite ? String(data.officialWebsite).trim().slice(0, 300) : undefined,
      contactPhone: normalizedPhone.slice(0, 50),
      contactPerson: data.contactPerson ? String(data.contactPerson).trim().slice(0, 120) : undefined,
      urgency: data.urgency || 'urgent',
      status: 'active',
      verifiedOfficial: false,
      bankDetailsNote: String(data.bankDetailsNote || '').trim().slice(0, 1000) || 'Verify details directly with the hospital or charity coordinator before contributing.',
      neededItems: (Array.isArray(data.neededItems) ? data.neededItems : []).slice(0, 25),
      description: String(data.description || '').trim().slice(0, 4000),
      image: data.image,
      pledgeCount: 0,
      totalPledgedLkr: 0,
      pledges: [],
      userId: data.userId || api.getCurrentUser()?.id || 'guest',
      createdAt: now,
      updatedAt: now,
    };

    const clean = sanitizeForFirestore(newCause) as DonationCause;

    if (!isFirestoreQuotaActive()) {
      try {
        await setDoc(doc(db, 'donations', id), clean);
      } catch (err) {
        if (!recordFirestoreError(err)) {
          handleFirestoreError(err, OperationType.CREATE, `donations/${id}`);
        }
      }
    }

    try {
      const res = await fetch(`${API_BASE}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clean),
      });
      if (res.ok) {
        const saved = await res.json();
        this.addGuestDonationCauseId(saved.id || clean.id);
        return saved;
      }
    } catch {
      // backend optional
    }

    this.addGuestDonationCauseId(clean.id);
    return clean;
  },

  async addDonationPledge(
    cause: DonationCause,
    pledgeInput: {
      donorName: string;
      donorPhone?: string;
      donorDistrict?: string;
      pledgeType: DonationPledgeType;
      amountLkr?: number;
      itemsSummary?: string;
      message?: string;
    }
  ): Promise<DonationCause> {
    const newPledge: DonationPledge = {
      id: `pledge_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      donorName: String(pledgeInput.donorName || '').trim().slice(0, 100),
      donorPhone: pledgeInput.donorPhone
        ? (normalizeSriLankanPhone(pledgeInput.donorPhone) || String(pledgeInput.donorPhone).trim()).slice(0, 50)
        : undefined,
      donorDistrict: pledgeInput.donorDistrict ? String(pledgeInput.donorDistrict).trim().slice(0, 80) : undefined,
      pledgeType: pledgeInput.pledgeType || 'supplies',
      amountLkr: Math.max(0, Number(pledgeInput.amountLkr) || 0),
      itemsSummary: pledgeInput.itemsSummary ? String(pledgeInput.itemsSummary).trim().slice(0, 240) : undefined,
      message: pledgeInput.message ? String(pledgeInput.message).trim().slice(0, 500) : undefined,
      createdAt: new Date().toISOString(),
    };

    const currentPledges = Array.isArray(cause.pledges) ? cause.pledges : [];
    const updatedPledges = [newPledge, ...currentPledges].slice(0, 200);
    const totalPledgedLkr = updatedPledges.reduce((acc, p) => acc + Math.max(0, Number(p.amountLkr) || 0), 0);
    const now = new Date().toISOString();
    const updatedCause: DonationCause = {
      ...cause,
      pledges: updatedPledges,
      pledgeCount: updatedPledges.length,
      totalPledgedLkr,
      updatedAt: now,
    };

    const cleanUpdate = sanitizeForFirestore({
      pledges: updatedPledges,
      pledgeCount: updatedPledges.length,
      totalPledgedLkr,
      updatedAt: now,
    });

    if (!isFirestoreQuotaActive()) {
      try {
        await updateDoc(doc(db, 'donations', cause.id), cleanUpdate);
      } catch (err) {
        if (!recordFirestoreError(err)) {
          try {
            await setDoc(doc(db, 'donations', cause.id), sanitizeForFirestore(updatedCause), { merge: true });
          } catch (innerErr) {
            handleFirestoreError(innerErr, OperationType.UPDATE, `donations/${cause.id}`);
          }
        }
      }
    }

    try {
      const res = await fetch(`${API_BASE}/donations/${cause.id}/pledges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPledge),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // backend optional
    }

    return updatedCause;
  },

  async updateDonationCauseStatus(causeId: string, status: DonationStatus): Promise<void> {
    const updatedAt = new Date().toISOString();
    if (!isFirestoreQuotaActive()) {
      try {
        await updateDoc(doc(db, 'donations', causeId), { status, updatedAt });
      } catch (err) {
        if (!recordFirestoreError(err)) {
          handleFirestoreError(err, OperationType.UPDATE, `donations/${causeId}`);
        }
      }
    }

    try {
      await fetch(`${API_BASE}/donations/${causeId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {
      // backend optional
    }
  },

  async deleteDonationCause(causeId: string): Promise<void> {
    if (!isFirestoreQuotaActive()) {
      try {
        await deleteDoc(doc(db, 'donations', causeId));
      } catch (err) {
        if (!recordFirestoreError(err)) {
          handleFirestoreError(err, OperationType.DELETE, `donations/${causeId}`);
        }
      }
    }

    try {
      await fetch(`${API_BASE}/donations/${causeId}`, {
        method: 'DELETE',
      });
    } catch {
      // backend optional
    }
  },

  // -------------------------------------------------------------
  // Sri Lanka Travel & Tourism Booking System (Admin-Controlled)
  // -------------------------------------------------------------

  async getTravelConfig(): Promise<TravelPricingConfig> {
    if (!isFirestoreQuotaActive()) {
      try {
        const snap = await getDoc(doc(db, 'travel_config', 'main'));
        if (snap.exists()) {
          const raw = snap.data() as TravelPricingConfig;
          if (raw && Array.isArray(raw.packages) && raw.packages.length > 0) {
            return {
              ...DEFAULT_TRAVEL_CONFIG,
              ...raw,
              id: 'main',
              packages: raw.packages,
              vehicleTiers: Array.isArray(raw.vehicleTiers) && raw.vehicleTiers.length > 0
                ? raw.vehicleTiers
                : DEFAULT_TRAVEL_CONFIG.vehicleTiers,
              addons: Array.isArray(raw.addons) ? raw.addons : DEFAULT_TRAVEL_CONFIG.addons,
            };
          }
        }
      } catch (err) {
        recordFirestoreError(err);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/travel-config`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.packages)) {
          return {
            ...DEFAULT_TRAVEL_CONFIG,
            ...data,
            id: 'main',
          };
        }
      }
    } catch {
      // backend optional
    }

    return DEFAULT_TRAVEL_CONFIG;
  },

  async saveTravelConfig(config: TravelPricingConfig): Promise<TravelPricingConfig> {
    if (!api.isAdmin()) {
      throw new Error('Admin login required to modify travel packages and charges.');
    }
    const updated: TravelPricingConfig = {
      ...config,
      id: 'main',
      updatedAt: new Date().toISOString(),
    };
    const clean = sanitizeForFirestore(updated) as TravelPricingConfig;

    if (!isFirestoreQuotaActive()) {
      try {
        await setDoc(doc(db, 'travel_config', 'main'), clean);
      } catch (err) {
        if (!recordFirestoreError(err)) {
          handleFirestoreError(err, OperationType.WRITE, 'travel_config/main');
        }
      }
    }

    try {
      const res = await fetch(`${API_BASE}/admin/travel-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': 'admin',
        },
        body: JSON.stringify(clean),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // backend optional
    }

    return updated;
  },

  async getAdminTravelBookings(): Promise<TravelBooking[]> {
    if (!api.isAdmin()) {
      throw new Error('Restricted: Only Administrators can view customer bookings.');
    }
    const map = new Map<string, TravelBooking>();

    if (!isFirestoreQuotaActive()) {
      try {
        const snap = await getDocs(collection(db, 'travel_bookings'));
        snap.forEach((docSnap) => {
          const raw = docSnap.data() as TravelBooking;
          map.set(raw.id || docSnap.id, {
            ...raw,
            id: raw.id || docSnap.id,
            addons: Array.isArray(raw.addons) ? raw.addons : [],
            children: typeof raw.children === 'number' ? raw.children : 0,
          });
        });
      } catch (err) {
        recordFirestoreError(err);
      }
    }

    try {
      const res = await fetch(`${API_BASE}/admin/travel-bookings`, {
        headers: {
          'x-admin-role': 'admin',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item && item.id) {
              const existing = map.get(item.id);
              const useServer =
                !existing ||
                new Date(item.updatedAt || 0).getTime() >= new Date(existing.updatedAt || 0).getTime();
              if (useServer) {
                map.set(item.id, {
                  ...item,
                  addons: Array.isArray(item.addons) ? item.addons : [],
                  children: typeof item.children === 'number' ? item.children : 0,
                });
              }
            }
          }
        }
      }
    } catch {
      // backend optional
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  },

  async createTravelBooking(input: {
    packageId: string;
    packageTitle: string;
    category: TravelPackageCategory;
    destination: string;
    startDate: string;
    days: number;
    adults: number;
    children: number;
    pickupLocation: string;
    vehicleTier: TravelVehicleTier;
    addons: string[];
    travelerName: string;
    travelerPhone: string;
    travelerEmail?: string;
    specialRequests?: string;
    totalLkr: number;
    preferredCurrency?: 'LKR' | 'USD';
    usdExchangeRate?: number;
    userId?: string;
  }): Promise<TravelBooking> {
    const id = `trv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const bookingRef = `HUTA-TRV-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();
    const normalizedPhone = normalizeSriLankanPhone(input.travelerPhone) || String(input.travelerPhone || '').trim();
    const baseAmountLkr = Math.max(0, Number(input.totalLkr) || 0);

    const booking: TravelBooking = {
      id,
      bookingRef,
      packageId: String(input.packageId || 'custom_sl_trip').trim().slice(0, 128),
      packageTitle: String(input.packageTitle || '').trim().slice(0, 200),
      category: input.category || 'Tour Packages',
      destination: String(input.destination || 'Sri Lanka').trim().slice(0, 120),
      startDate: String(input.startDate || now.slice(0, 10)).trim().slice(0, 32),
      days: Math.min(30, Math.max(1, Number(input.days) || 1)),
      adults: Math.min(30, Math.max(1, Number(input.adults) || 2)),
      children: Math.min(20, Math.max(0, Number(input.children) || 0)),
      pickupLocation: String(input.pickupLocation || 'Colombo / BIA Airport (CMB)').trim().slice(0, 120),
      vehicleTier: input.vehicleTier || 'Luxury KDH Van',
      addons: (Array.isArray(input.addons) ? input.addons : []).slice(0, 10),
      travelerName: String(input.travelerName || '').trim().slice(0, 120),
      travelerPhone: normalizedPhone.slice(0, 50),
      travelerEmail: input.travelerEmail ? String(input.travelerEmail).trim().slice(0, 150) : undefined,
      specialRequests: input.specialRequests ? String(input.specialRequests).trim().slice(0, 1500) : undefined,
      baseAmountLkr,
      adminAdjustmentLkr: 0,
      totalLkr: baseAmountLkr,
      preferredCurrency: input.preferredCurrency === 'USD' ? 'USD' : 'LKR',
      usdExchangeRate: Math.min(2000, Math.max(50, Number(input.usdExchangeRate) || 300)),
      status: 'pending',
      userId: input.userId || api.getCurrentUser()?.id || 'guest',
      createdAt: now,
      updatedAt: now,
    };

    const clean = sanitizeForFirestore(booking) as TravelBooking;

    if (!isFirestoreQuotaActive()) {
      try {
        await setDoc(doc(db, 'travel_bookings', id), clean);
      } catch (err) {
        if (!recordFirestoreError(err)) {
          handleFirestoreError(err, OperationType.CREATE, `travel_bookings/${id}`);
        }
      }
    }

    try {
      const res = await fetch(`${API_BASE}/travel-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clean),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // backend optional
    }

    return clean;
  },

  async adminUpdateTravelBooking(
    booking: TravelBooking,
    updates: {
      status?: TravelBookingStatus;
      startDate?: string;
      days?: number;
      pickupLocation?: string;
      vehicleTier?: TravelVehicleTier;
      baseAmountLkr?: number;
      adminAdjustmentLkr?: number;
      adminAdjustmentNote?: string;
      totalLkr?: number;
      assignedDriverName?: string;
      assignedDriverPhone?: string;
      adminNotes?: string;
    }
  ): Promise<TravelBooking> {
    if (!api.isAdmin()) {
      throw new Error('Restricted: Only Administrators can edit customer bookings and charges.');
    }
    const updatedAt = new Date().toISOString();
    const nextBase = updates.baseAmountLkr !== undefined ? Math.max(0, Number(updates.baseAmountLkr) || 0) : (booking.baseAmountLkr ?? booking.totalLkr);
    const nextAdj = updates.adminAdjustmentLkr !== undefined ? (Number(updates.adminAdjustmentLkr) || 0) : (booking.adminAdjustmentLkr ?? 0);
    const nextTotal = updates.totalLkr !== undefined ? Math.max(0, Number(updates.totalLkr) || 0) : Math.max(0, nextBase + nextAdj);

    const updatedBooking: TravelBooking = {
      ...booking,
      status: updates.status || booking.status,
      startDate: updates.startDate || booking.startDate,
      days: updates.days ?? booking.days,
      pickupLocation: updates.pickupLocation || booking.pickupLocation,
      vehicleTier: updates.vehicleTier || booking.vehicleTier,
      baseAmountLkr: nextBase,
      adminAdjustmentLkr: nextAdj,
      adminAdjustmentNote: updates.adminAdjustmentNote !== undefined ? updates.adminAdjustmentNote : booking.adminAdjustmentNote,
      totalLkr: nextTotal,
      assignedDriverName: updates.assignedDriverName !== undefined ? updates.assignedDriverName : booking.assignedDriverName,
      assignedDriverPhone: updates.assignedDriverPhone !== undefined ? updates.assignedDriverPhone : booking.assignedDriverPhone,
      adminNotes: updates.adminNotes !== undefined ? updates.adminNotes : booking.adminNotes,
      updatedAt,
    };

    if (!isFirestoreQuotaActive()) {
      try {
        const payload = sanitizeForFirestore({
          status: updatedBooking.status,
          startDate: updatedBooking.startDate,
          days: updatedBooking.days,
          pickupLocation: updatedBooking.pickupLocation,
          vehicleTier: updatedBooking.vehicleTier,
          baseAmountLkr: updatedBooking.baseAmountLkr,
          adminAdjustmentLkr: updatedBooking.adminAdjustmentLkr,
          adminAdjustmentNote: updatedBooking.adminAdjustmentNote,
          totalLkr: updatedBooking.totalLkr,
          assignedDriverName: updatedBooking.assignedDriverName,
          assignedDriverPhone: updatedBooking.assignedDriverPhone,
          adminNotes: updatedBooking.adminNotes,
          updatedAt,
        });
        await updateDoc(doc(db, 'travel_bookings', booking.id), payload);
      } catch (err) {
        if (!recordFirestoreError(err)) {
          handleFirestoreError(err, OperationType.UPDATE, `travel_bookings/${booking.id}`);
        }
      }
    }

    try {
      const res = await fetch(`${API_BASE}/admin/travel-bookings/${booking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': 'admin',
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // backend optional
    }

    return updatedBooking;
  },

  async adminDeleteTravelBooking(bookingId: string): Promise<void> {
    if (!api.isAdmin()) {
      throw new Error('Restricted: Only Administrators can delete customer bookings.');
    }
    if (!isFirestoreQuotaActive()) {
      try {
        await deleteDoc(doc(db, 'travel_bookings', bookingId));
      } catch (err) {
        if (!recordFirestoreError(err)) {
          handleFirestoreError(err, OperationType.DELETE, `travel_bookings/${bookingId}`);
        }
      }
    }

    try {
      await fetch(`${API_BASE}/admin/travel-bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { 'x-admin-role': 'admin' },
      });
    } catch {
      // backend optional
    }
  },
};

export const apiService = api;



