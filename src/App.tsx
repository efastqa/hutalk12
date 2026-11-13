import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Listing, User, ViewTab, EventItem, HeroAd, HeroAdSettings, VideoReelItem, EStore } from './types';
import { api } from './services/api';

// Components
import { Navbar } from './components/Navbar';
import { HeroSearch } from './components/HeroSearch';
import { CategoryGrid } from './components/CategoryGrid';
import { ListingsSection } from './components/ListingsSection';
import { ExploreMoreEStoresBanner } from './components/ExploreMoreEStoresBanner';
import { EStorePage } from './components/EStorePage';
import { AdDetailModal } from './components/AdDetailModal';
import { PostAdModal } from './components/PostAdModal';
import { DedicatedAdminPortal } from './components/DedicatedAdminPortal';
import { UserDashboard } from './components/UserDashboard';
import { AuthModals } from './components/AuthModals';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Footer } from './components/Footer';
import { ChatDrawer } from './components/ChatDrawer';
import { BottomNav } from './components/BottomNav';
import { AllCategoriesPage } from './components/AllCategoriesPage';
import { HutaInPage } from './components/HutaInPage';
import { MorePage } from './components/MorePage';
import { CompareModal } from './components/CompareModal';
import { CompareFloatingBar } from './components/CompareFloatingBar';
import { AppStoreModal } from './components/AppStoreModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { VideoReelsSection } from './components/VideoReelsSection';
import { LegalPoliciesModal, PolicyTab } from './components/LegalPoliciesModal';
import { testConnection } from './firebase';
import { MapPin, Sparkles, PlusCircle, Calendar, ArrowRight, Star, Compass } from 'lucide-react';

function getInitialTab(): ViewTab {
  try {
    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');

    // 1. Model A Subdomain detection: admin.huta.lk or admin.*
    if (hostname.startsWith('admin.') || hostname === 'admin.huta.lk') {
      return 'admin_dashboard';
    }

    // 2. Model A Dedicated Route detection: /admin or /admin/*
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      return 'admin_dashboard';
    }

    // 3. Fallback query / hash detection (?admin=true, #admin, ?tab=admin_dashboard, ?tab=admin)
    if (
      params.get('admin') === 'true' ||
      window.location.hash === '#admin' ||
      tab === 'admin_dashboard' ||
      tab === 'admin'
    ) {
      return 'admin_dashboard';
    }

    if (tab === 'estore') return 'estore';
    if (tab === 'huta_in') return 'huta_in';
    if (tab === 'categories') return 'categories';
    if (tab === 'user_dashboard') return 'user_dashboard';
    if (tab === 'more') return 'more';
    if (window.location.hash === '#estore') return 'estore';
  } catch {}
  return 'marketplace';
}

export default function App() {
  // Navigation & View State (supports ?tab=estore in new browser tabs)
  const [currentTab, setCurrentTab] = useState<ViewTab>(getInitialTab);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [listingsViewMode, setListingsViewMode] = useState<'grid' | 'map'>('grid');

  // Data State
  const [listings, setListings] = useState<Listing[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [heroAds, setHeroAds] = useState<HeroAd[]>(() => {
    try {
      const cached = localStorage.getItem('huta_hero_ads_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.ads) && parsed.ads.length > 0) return parsed.ads;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [heroSettings, setHeroSettings] = useState<HeroAdSettings>(() => {
    try {
      const cached = localStorage.getItem('huta_hero_ads_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.settings) return parsed.settings;
      }
    } catch {
      // ignore
    }
    return {
      mode: 'default',
      rotationIntervalSeconds: 6,
    };
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [videoReels, setVideoReels] = useState<VideoReelItem[]>([]);
  const [eStores, setEStores] = useState<EStore[]>([]);
  const [targetEStoreForView, setTargetEStoreForView] = useState<EStore | null>(null);

  // Real-time Chat State (Firebase Firestore)
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatTargetListing, setChatTargetListing] = useState<Listing | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All Sri Lanka');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  // Modals
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isPostAdOpen, setIsPostAdOpen] = useState<boolean>(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [targetListingForEdit, setTargetListingForEdit] = useState<Listing | null>(null);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [isUserAuthOpen, setIsUserAuthOpen] = useState<boolean>(false);
  const [userAuthInitialMode, setUserAuthInitialMode] = useState<'login' | 'register'>('login');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [isAppStoreOpen, setIsAppStoreOpen] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Side-by-Side Comparison State
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('huta_compare_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Legal Policies Modal State (Terms & Conditions, Privacy Policy, Cookie Policy)
  const [policyModalOpen, setPolicyModalOpen] = useState<boolean>(false);
  const [initialPolicyTab, setInitialPolicyTab] = useState<PolicyTab>('terms');

  const handleOpenPolicy = (tab: PolicyTab = 'terms') => {
    setInitialPolicyTab(tab);
    setPolicyModalOpen(true);
  };

  // Save comparison IDs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('huta_compare_ids', JSON.stringify(compareIds));
    } catch {
      // ignore
    }
  }, [compareIds]);

  // Keep browser URL query and path in sync with currentTab (Model A dedicated routing)
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (currentTab === 'admin_dashboard') {
        url.searchParams.delete('tab');
        url.searchParams.delete('admin');
        if (!url.pathname.startsWith('/admin') && !url.hostname.startsWith('admin.')) {
          url.pathname = '/admin';
        }
      } else if (currentTab === 'marketplace') {
        url.searchParams.delete('tab');
        if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
          url.pathname = '/';
        }
      } else {
        url.searchParams.set('tab', currentTab);
        if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
          url.pathname = '/';
        }
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  }, [currentTab]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      try {
        const hostname = window.location.hostname.toLowerCase();
        const pathname = window.location.pathname.toLowerCase();
        const params = new URLSearchParams(window.location.search);

        if (
          hostname.startsWith('admin.') ||
          hostname === 'admin.huta.lk' ||
          pathname === '/admin' ||
          pathname.startsWith('/admin/') ||
          params.get('admin') === 'true' ||
          window.location.hash === '#admin'
        ) {
          setCurrentTab('admin_dashboard');
          return;
        }

        const tab = (params.get('tab') as ViewTab) || 'marketplace';
        setCurrentTab(tab);
      } catch {
        // ignore
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Derive compared listings objects
  const compareListings = useMemo(() => {
    return listings.filter((item) => compareIds.includes(item.id));
  }, [listings, compareIds]);

  const handleToggleCompare = useCallback((listing: Listing) => {
    setCompareIds((prev) => {
      if (prev.includes(listing.id)) {
        showToast(`Removed "${listing.title.substring(0, 24)}..." from comparison`, 'info');
        return prev.filter((id) => id !== listing.id);
      } else {
        if (prev.length >= 4) {
          showToast('You can compare up to 4 ads at once. Remove one to add another.', 'error');
          return prev;
        }
        showToast(`Added "${listing.title.substring(0, 24)}..." to comparison`, 'success');
        return [...prev, listing.id];
      }
    });
  }, [showToast]);

  const handleRemoveFromCompare = useCallback((id: string) => {
    setCompareIds((prev) => prev.filter((item) => item !== id));
  }, []);

  const handleClearCompare = useCallback(() => {
    setCompareIds([]);
    showToast('Comparison cleared', 'info');
  }, [showToast]);

  // Initial Data & Session Load
  useEffect(() => {
    // 1. Session check
    const user = api.getCurrentUser();
    if (user) setCurrentUser(user);

    const adminAuth = api.isAdmin();
    setIsAdminLoggedIn(adminAuth);

    // 2. Favorites check
    try {
      const storedFavs = localStorage.getItem('huta_favorites');
      if (storedFavs) {
        setFavorites(JSON.parse(storedFavs));
      }
    } catch {
      // ignore
    }

    // 3. Fetch listings, events & hero ads
    fetchListings();
    fetchEvents();
    fetchHeroAds();
    fetchVideoReels();
    fetchEStores();

    // Subscribe to live video stories updates
    const unsubReels = api.subscribeToVideoReels((reels) => {
      setVideoReels(reels);
    });

    // 4. Test Firebase Firestore connection
    testConnection();

    return () => {
      unsubReels();
    };
  }, []);

  const fetchEStores = async () => {
    try {
      const data = await api.getEStores();
      if (Array.isArray(data)) {
        setEStores(data);
      }
    } catch {
      // Graceful fallback
    }
  };

  const fetchVideoReels = async () => {
    try {
      const data = await api.getVideoReels();
      if (Array.isArray(data)) {
        setVideoReels(data);
      }
    } catch {
      // Graceful fallback
    }
  };

  const fetchHeroAds = async () => {
    try {
      const data = await api.getHeroAds();
      if (data) {
        if (data.settings) setHeroSettings(data.settings);
        if (Array.isArray(data.ads)) setHeroAds(data.ads);
      }
    } catch {
      // Graceful fallback
    }
  };

  const handleUpdateHeroSettings = async (newSettings: Partial<HeroAdSettings>) => {
    try {
      const updated = await api.updateHeroAdSettings(newSettings);
      setHeroSettings(updated);
      showToast(
        updated.mode === 'default'
          ? 'Hero set to default marketplace welcome'
          : updated.mode === 'rotate'
          ? 'Hero rotation mode enabled!'
          : 'Hero promotional ads mode enabled!',
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update hero settings';
      showToast(msg, 'error');
    }
  };

  const handleCreateHeroAd = async (ad: Partial<HeroAd>) => {
    try {
      const created = await api.createHeroAd(ad);
      setHeroAds((prev) => [created, ...prev]);
      showToast('Hero Animated Ad published successfully!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create hero ad';
      showToast(msg, 'error');
    }
  };

  const handleUpdateHeroAd = async (id: string, ad: Partial<HeroAd>) => {
    try {
      const updated = await api.updateHeroAd(id, ad);
      setHeroAds((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast('Hero Animated Ad updated!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update hero ad';
      showToast(msg, 'error');
    }
  };

  const handleToggleHeroAd = async (id: string) => {
    try {
      const updated = await api.toggleHeroAd(id);
      setHeroAds((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast(
        updated.isActive ? 'Hero Ad is now live on marketplace!' : 'Hero Ad paused (inactive)',
        'info'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle hero ad';
      showToast(msg, 'error');
    }
  };

  const handleDeleteHeroAd = async (id: string) => {
    try {
      await api.deleteHeroAd(id);
      setHeroAds((prev) => prev.filter((a) => a.id !== id));
      showToast('Hero Ad deleted', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete hero ad';
      showToast(msg, 'error');
    }
  };

  const fetchEvents = async () => {
    try {
      const data = await api.getEvents();
      if (Array.isArray(data)) {
        setEvents(data);
      }
    } catch {
      // Graceful fallback without noisy errors
    }
  };

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getListings({ status: 'all' });
      setListings(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch advertisements';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtering & Sorting Logic
  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Public website marketplace view shows approved ads, and allows creators to immediately see their posted ads
    const guestIds = api.getGuestListingIds();
    result = result.filter(
      (item) =>
        item.status === 'approved' ||
        (currentUser && item.userId === currentUser.id) ||
        guestIds.includes(item.id)
    );

    // Category Filter
    if (selectedCategory !== 'All') {
      const catLower = selectedCategory.toLowerCase();
      result = result.filter((item) => {
        const itemCat = (item.category || '').toLowerCase();
        const itemTitle = (item.title || '').toLowerCase();
        const itemDesc = (item.description || '').toLowerCase();

        if (itemCat === catLower) return true;
        if (catLower === 'vehicles') {
          return itemCat.includes('vehicle') || itemCat.includes('car') || itemCat.includes('motorcycle') || itemCat.includes('bike');
        }
        if (catLower === 'property') {
          return itemCat.includes('property') || itemCat.includes('land') || itemCat.includes('house') || itemCat.includes('apartment');
        }
        if (catLower === 'phones') {
          return itemCat.includes('phone') || itemCat.includes('electronic') && (itemTitle.includes('phone') || itemTitle.includes('iphone') || itemTitle.includes('samsung') || itemDesc.includes('phone'));
        }
        if (catLower === 'computers') {
          return itemCat.includes('computer') || itemCat.includes('electronic') && (itemTitle.includes('laptop') || itemTitle.includes('pc') || itemTitle.includes('computer') || itemTitle.includes('macbook'));
        }
        if (catLower === "women's") {
          return itemCat.includes('fashion') && (itemTitle.includes('women') || itemTitle.includes('dress') || itemTitle.includes('saree') || itemDesc.includes('women')) || itemCat === "women's";
        }
        if (catLower === "men's") {
          return itemCat.includes('fashion') && (itemTitle.includes('men') || itemTitle.includes('shirt') || itemTitle.includes('suit') || itemDesc.includes('men')) || itemCat === "men's";
        }
        if (catLower === 'services') {
          return itemCat.includes('service') || itemCat.includes('repair') || itemCat.includes('maintenance');
        }
        if (catLower === 'jobs') {
          return itemCat.includes('job') || itemCat.includes('career') || itemCat.includes('vacancy');
        }
        if (catLower === 'beauty') {
          return itemCat.includes('beauty') || itemTitle.includes('beauty') || itemTitle.includes('cosmetic') || itemTitle.includes('salon');
        }
        if (catLower === 'luxury') {
          return itemCat.includes('luxury') || itemTitle.includes('gem') || itemTitle.includes('sapphire') || itemTitle.includes('gold') || itemTitle.includes('jewelry');
        }
        if (catLower === 'holiday homes') {
          return (
            itemCat.includes('holiday') ||
            itemCat.includes('vacation') ||
            (item.propertyType || '').toLowerCase().includes('holiday') ||
            (item.propertyType || '').toLowerCase().includes('villa') ||
            itemTitle.includes('holiday home') ||
            itemTitle.includes('villa') ||
            itemTitle.includes('bungalow') ||
            itemTitle.includes('cabana') ||
            itemTitle.includes('resort') ||
            itemDesc.includes('holiday home')
          );
        }
        return itemCat.includes(catLower);
      });
    }

    // Location Filter
    if (selectedLocation !== 'All Sri Lanka') {
      result = result.filter(
        (item) => item.location.toLowerCase() === selectedLocation.toLowerCase()
      );
    }

    // Keyword Search
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query)
      );
    }

    // Price Range Filter
    const min = parseFloat(minPrice);
    if (!isNaN(min) && min >= 0) {
      result = result.filter((item) => item.price >= min);
    }

    const max = parseFloat(maxPrice);
    if (!isNaN(max) && max > 0) {
      result = result.filter((item) => item.price <= max);
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'views') {
      result.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else {
      // default: newest first
      result.sort((a, b) => new Date(b.date || (b as any).createdAt || 0).getTime() - new Date(a.date || (a as any).createdAt || 0).getTime());
    }

    // Verified Sellers Only filter
    if (verifiedOnly) {
      result = result.filter(
        (item) => item.isVerifiedPro || item.isStoreVerified || item.verifiedPhone
      );
    }

    // Keep featured ads on top
    result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

    return result;
  }, [listings, currentTab, selectedCategory, selectedLocation, searchTerm, minPrice, maxPrice, sortBy, verifiedOnly]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    selectedCategory !== 'All' ||
    selectedLocation !== 'All Sri Lanka' ||
    minPrice ||
    maxPrice ||
    verifiedOnly
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedLocation('All Sri Lanka');
    setMinPrice('');
    setMaxPrice('');
    setVerifiedOnly(false);
  };

  const handleSelectCategory = useCallback(
    (category: string, query?: string, shouldScroll: boolean = true) => {
      setSelectedCategory(category);
      if (query !== undefined) {
        setSearchTerm(query);
      } else {
        // Clear search input so all listings within the chosen category show immediately
        setSearchTerm('');
      }
      if (currentTab !== 'marketplace') {
        setCurrentTab('marketplace');
      }
      if (shouldScroll) {
        setTimeout(() => {
          const el = document.getElementById('marketplace-listings');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 50);
      }
    },
    [currentTab]
  );

  // Favorites Toggle
  const handleToggleFavorite = (adId: string) => {
    let updated: string[];
    if (favorites.includes(adId)) {
      updated = favorites.filter((id) => id !== adId);
      showToast('Removed from saved favorites', 'info');
    } else {
      updated = [...favorites, adId];
      showToast('Saved to your favorites!', 'success');
    }
    setFavorites(updated);
    try {
      localStorage.setItem('huta_favorites', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Listing Selection (Ad Detail)
  const handleSelectListing = async (listing: Listing) => {
    // Optimistic view increment for instant feedback
    const currentViews = Number(listing.views) || 0;
    const optimisticViews = currentViews + 1;
    const optimisticListing = { ...listing, views: optimisticViews };
    setSelectedListing(optimisticListing);

    setListings((prev) =>
      prev.map((item) => (item.id === listing.id ? { ...item, views: optimisticViews } : item))
    );

    // Persist view to Firestore & backend server
    try {
      const res = await api.incrementView(listing.id);
      if (res && typeof res.views === 'number') {
        setSelectedListing((curr) => (curr && curr.id === listing.id ? { ...curr, views: res.views } : curr));
        setListings((prev) =>
          prev.map((item) => (item.id === listing.id ? { ...item, views: res.views } : item))
        );
      }
    } catch {
      // ignore view error
    }
  };

  // Lead Reach Tracking (WhatsApp & Phone Actions)
  const handleRecordListingAction = (actionType: 'whatsapp' | 'phone' | 'share') => {
    if (!selectedListing) return;
    const targetId = selectedListing.id;

    setSelectedListing((curr) => {
      if (!curr) return null;
      if (actionType === 'whatsapp') {
        return { ...curr, whatsappClicks: (Number(curr.whatsappClicks) || 0) + 1 };
      } else if (actionType === 'phone') {
        return { ...curr, phoneClicks: (Number(curr.phoneClicks) || 0) + 1 };
      }
      return curr;
    });

    setListings((prev) =>
      prev.map((item) => {
        if (item.id === targetId) {
          if (actionType === 'whatsapp') {
            return { ...item, whatsappClicks: (Number(item.whatsappClicks) || 0) + 1 };
          } else if (actionType === 'phone') {
            return { ...item, phoneClicks: (Number(item.phoneClicks) || 0) + 1 };
          }
        }
        return item;
      })
    );

    // Call API in background
    api.recordListingAction(targetId, actionType).catch(() => {});
  };

  // Post / Edit Ad
  const handleOpenPostAd = () => {
    setEditingListing(null);
    setIsPostAdOpen(true);
  };

  const handleEditListing = (listing: Listing) => {
    setSelectedListing(null);
    setEditingListing(listing);
    setIsPostAdOpen(true);
  };

  const handleSubmitAd = async (adData: Partial<Listing>, isEditId?: string): Promise<Listing> => {
    try {
      if (isEditId) {
        const updated = await api.updateListing(isEditId, adData);
        setListings((prev) =>
          prev.map((item) => (item.id === isEditId ? updated : item))
        );
        if (selectedListing?.id === isEditId) {
          setSelectedListing(updated);
        }
        showToast('Advertisement updated successfully!', 'success');
        setIsPostAdOpen(false);
        setEditingListing(null);
        return updated;
      } else {
        const created = await api.createListing({
          ...adData,
          isAdminLoggedIn: Boolean(isAdminLoggedIn),
          userId: currentUser ? currentUser.id : 'guest',
        });
        api.addGuestListingId(created.id);
        setListings((prev) => [created, ...prev]);

        if (created.status === 'approved') {
          showToast('Advertisement published live immediately!', 'success');
        } else {
          showToast(
            'Advertisement submitted! It is now pending admin confirmation and will go live once approved.',
            'info'
          );
        }
        return created;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save advertisement';
      showToast(msg, 'error');
      throw err;
    }
  };

  // Delete Ad
  const handleDeleteListing = async (adId: string) => {
    try {
      await api.deleteListing(adId);
      setListings((prev) => prev.filter((item) => item.id !== adId));
      if (selectedListing?.id === adId) {
        setSelectedListing(null);
      }
      showToast('Advertisement removed successfully.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not delete advertisement';
      showToast(msg, 'error');
    }
  };

  // Admin Actions
  const handleApproveListing = async (adId: string, verificationNotes?: string) => {
    try {
      const updated = await api.approveListing(adId, verificationNotes);
      setListings((prev) =>
        prev.map((item) => (item.id === adId ? updated : item))
      );
      showToast('Advertisement approved and is now live on marketplace!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve advertisement';
      showToast(msg, 'error');
    }
  };

  const handleVerifyCustomer = async (
    adId: string,
    data: {
      verificationNotes: string;
      verificationStatus?: 'unverified' | 'verified_with_customer' | 'deltas_found';
      status?: 'approved' | 'pending' | 'rejected';
    }
  ) => {
    try {
      const updated = await api.verifyListingWithCustomer(adId, data);
      setListings((prev) =>
        prev.map((item) => (item.id === adId ? updated : item))
      );
      showToast(
        data.status === 'approved'
          ? 'Advertisement verified with customer & published live!'
          : 'Customer verification notes & deltas recorded.',
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update customer verification';
      showToast(msg, 'error');
    }
  };

  const handleRejectListing = async (adId: string, verificationNotes?: string) => {
    try {
      const updated = await api.rejectListing(adId, verificationNotes);
      setListings((prev) =>
        prev.map((item) => (item.id === adId ? updated : item))
      );
      showToast('Advertisement marked as rejected.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject advertisement';
      showToast(msg, 'error');
    }
  };

  const handleToggleFeatureListing = async (adId: string) => {
    try {
      const updated = await api.toggleFeatureListing(adId);
      setListings((prev) =>
        prev.map((item) => (item.id === adId ? updated : item))
      );
      showToast(
        updated.isFeatured
          ? 'Featured status enabled! This ad will now appear on top.'
          : 'Featured status removed.',
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle featured status';
      showToast(msg, 'error');
    }
  };

  const handleToggleVerifyPro = async (id: string) => {
    try {
      const updated = await api.toggleVerifyPro(id);
      setListings((prev) => prev.map((l) => (l.id === id ? updated : l)));
      showToast(
        updated.isVerifiedPro
          ? 'Service verified as HUTA Verified Pro! 🛡️'
          : 'Service Verified Pro status removed',
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle Verified Pro status';
      showToast(msg, 'error');
    }
  };

  // Auth Handlers
  const handleUserAuthSuccess = (user: User) => {
    setCurrentUser(user);
    showToast(`Logged in as ${user.fullname || user.username}`, 'success');
    // Refresh listings to reflect claimed ownership
    fetchListings();

    // If login was initiated to edit a specific ad:
    if (targetListingForEdit) {
      const adToEdit = targetListingForEdit;
      setTargetListingForEdit(null);
      setIsUserAuthOpen(false);
      handleEditListing(adToEdit);
      showToast(`Ad editing mode enabled for "${adToEdit.title.substring(0, 24)}..."`, 'info');
    }
  };

  const handleLogoutUser = () => {
    api.userLogout();
    setCurrentUser(null);
    if (currentTab === 'user_dashboard') {
      setCurrentTab('marketplace');
    }
    showToast('You have been logged out.', 'info');
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setCurrentTab('admin_dashboard');
    showToast('Admin logged in successfully.', 'success');
  };

  const handleOpenAdminPortal = () => {
    setIsAdminLoginOpen(false);
    setIsUserAuthOpen(false);
    setCurrentTab('admin_dashboard');
  };

  const handleLogoutAdmin = () => {
    api.adminLogout();
    setIsAdminLoggedIn(false);
    showToast('Admin session ended.', 'info');
  };

  // Share Link
  const handleCopyShareLink = (listing: Listing) => {
    const text = `${listing.title} - ${listing.location} on HUTA Sri Lanka Marketplace. Tel: ${listing.phone}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Listing details copied to clipboard!', 'success');
    } else {
      showToast(text, 'info');
    }
  };

  // Compute number of ads belonging to current user or posted from this device
  const normalizeDigits = (raw?: string): string => {
    if (!raw) return '';
    const digits = raw.replace(/[^0-9]/g, '');
    if (digits.startsWith('94') && digits.length >= 11) return '0' + digits.substring(2);
    if (digits.length === 9) return '0' + digits;
    return digits;
  };
  const activeUserPhone = currentUser?.phone ? normalizeDigits(currentUser.phone) : '';
  const guestAdIds = api.getGuestListingIds();
  const myAdsCount = listings.filter((l) => {
    if (guestAdIds.includes(l.id)) return true;
    if (currentUser) {
      if (l.userId === currentUser.id) return true;
      const adPhone = normalizeDigits(l.phone);
      if (activeUserPhone && adPhone === activeUserPhone) return true;
    }
    return false;
  }).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0C10] text-[#0F172A] dark:text-[#F8FAFC] pb-16 lg:pb-0 transition-colors duration-200 overflow-x-clip w-full max-w-full">
      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navigation (Public Marketplace Only - Model A isolates /admin & admin.huta.lk) */}
      {currentTab !== 'admin_dashboard' && (
        <Navbar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          onSelectCategory={(category) => handleSelectCategory(category, undefined, true)}
          onOpenPostAd={handleOpenPostAd}
          onOpenUserAuth={() => setIsUserAuthOpen(true)}
          currentUser={currentUser}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
          activeCategory={selectedCategory}
          onOpenAppStore={() => setIsAppStoreOpen(true)}
          myAdsCount={myAdsCount}
        />
      )}

      {/* Main Views Container */}
      <main className="flex-1">
        {currentTab === 'marketplace' && (
          <div>
            {/* Search Header Banner */}
            <HeroSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
              minPrice={minPrice}
              onMinPriceChange={setMinPrice}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
              selectedCategory={selectedCategory}
              onSelectCategory={(category) => handleSelectCategory(category, undefined, true)}
              heroAds={heroAds}
              heroSettings={heroSettings}
              onOpenPostAd={handleOpenPostAd}
              isAdminLoggedIn={isAdminLoggedIn}
              onAdminManage={() => setCurrentTab('admin_dashboard')}
              listings={listings}
              onSelectListing={handleSelectListing}
              verifiedOnly={verifiedOnly}
              onToggleVerifiedOnly={() => setVerifiedOnly((prev) => !prev)}
            />

            {/* Category Browser ("Explore Our Popular Categories") */}
            <CategoryGrid
              currentCategory={selectedCategory}
              onSelectCategory={(category, query) => handleSelectCategory(category, query, true)}
              listings={listings}
              onViewAllCategories={() => setCurrentTab('categories')}
              verifiedOnly={verifiedOnly}
              onToggleVerifiedOnly={() => setVerifiedOnly((prev) => !prev)}
              onSelectSearchTerm={setSearchTerm}
            />

            {/* Qatar Living style Browse Districts Bar - Frosted Glass with Seamless Contrast */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
              <div className="bg-white/90 dark:bg-[#151822]/90 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-2xl p-3 shadow-md dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)] flex items-center gap-2 overflow-x-auto scrollbar-none text-xs transition-colors">
                <span className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200 font-black whitespace-nowrap shrink-0 px-2">
                  <MapPin className="w-3.5 h-3.5 text-[#FF5A36]" />
                  <span>Popular Districts:</span>
                </span>
                {[
                  'All Sri Lanka',
                  'Colombo',
                  'Gampaha',
                  'Kandy',
                  'Galle',
                  'Kalutara',
                  'Kurunegala',
                  'Jaffna',
                  'Matara',
                  'Anuradhapura',
                  'Negombo',
                ].map((dist) => {
                  const isActive = selectedLocation === dist;
                  return (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => setSelectedLocation(dist)}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-[#FF5A36] to-[#FF7A59] text-white shadow-xs'
                          : 'bg-gray-100/80 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200/80 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white border border-gray-200/50 dark:border-white/5'
                      }`}
                    >
                      {dist}
                    </button>
                  );
                })}

                {/* Direct Map View Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    setListingsViewMode('map');
                    const el = document.getElementById('marketplace-listings');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold transition-all cursor-pointer flex items-center gap-1.5 ml-auto shrink-0 shadow-2xs ${
                    listingsViewMode === 'map'
                      ? 'bg-gradient-to-r from-[#FF5A36] to-[#FF7A59] text-white shadow-xs'
                      : 'bg-orange-50/80 dark:bg-orange-950/40 text-[#FF5A36] hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-200 dark:border-orange-500/30'
                  }`}
                  title="Explore all listings on interactive map"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Map & Near Me</span>
                </button>
              </div>
            </div>

            {/* Classified Advertisements Grid & Interactive Map */}
            <ListingsSection
              listings={filteredListings}
              sortBy={sortBy}
              onSortChange={setSortBy}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onSelectListing={handleSelectListing}
              isLoading={isLoading}
              onOpenPostAd={handleOpenPostAd}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={handleResetFilters}
              currentCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              compareIds={compareIds}
              onToggleCompare={handleToggleCompare}
              viewMode={listingsViewMode}
              onViewModeChange={setListingsViewMode}
              selectedDistrict={selectedLocation}
              searchTerm={searchTerm}
              onClearSearch={() => setSearchTerm('')}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onClearPrice={() => {
                setMinPrice('');
                setMaxPrice('');
              }}
              onClearLocation={() => setSelectedLocation('All Sri Lanka')}
              verifiedOnly={verifiedOnly}
              onToggleVerifiedOnly={() => setVerifiedOnly((prev) => !prev)}
            />

            {/* Video Stories / Short Walk-through Reels Bar (Moved Page Down) */}
            <div className="py-2">
              <VideoReelsSection
                listings={listings}
                reels={videoReels}
                onReelsChange={setVideoReels}
                onSelectListing={(listing) => setSelectedListing(listing)}
                onOpenPostAd={handleOpenPostAd}
                currentUser={currentUser}
                onToast={showToast}
              />
            </div>

            {/* Explore More Listings: Sri Lanka E-Stores & Online Merchants Showcase Banner */}
            <ExploreMoreEStoresBanner
              stores={eStores}
              onExploreEStores={() => {
                setTargetEStoreForView(null);
                setCurrentTab('estore');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onRegisterStore={() => {
                setTargetEStoreForView(null);
                setCurrentTab('estore');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenStore={(store) => {
                setTargetEStoreForView(store);
                setCurrentTab('estore');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* HUTA IN Community & Events Hub Teaser Banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
              <div className="bg-[#111217] border border-[#2D2F39] rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-56 h-56 bg-[#FF5A36]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-2 text-center md:text-left z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF5A36]/15 text-[#FF5A36] text-xs font-bold border border-[#FF5A36]/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>HUTA IN • Community & Events Hub</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                    Upcoming Expos, Cultural Festivals & Auto Shows in Sri Lanka
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 max-w-xl">
                    Discover handpicked local events, motor exhibitions, food carnivals, and cultural celebrations across Sri Lanka.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentTab('huta_in')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white font-bold text-sm shadow-md transition-all shrink-0 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Explore HUTA IN</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Qatar Living style Post-An-Ad Banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
              <div className="bg-white dark:bg-[#151822] border border-gray-200 dark:border-[#252836] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
                <div className="space-y-2 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5A36] uppercase tracking-wider">
                    <span>Direct Buyer-Seller Connection</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                    Have something to sell or rent in Sri Lanka?
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-lg">
                    Post your ad for free in 60 seconds with AI assistance. Connect with verified buyers directly via WhatsApp and phone call.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenPostAd}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Post Free Advertisement</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'estore' && (
          <EStorePage
            stores={eStores}
            onStoresChange={setEStores}
            onBackToMarketplace={() => setCurrentTab('marketplace')}
            onToast={showToast}
            currentUser={currentUser}
            initialSelectedStore={targetEStoreForView}
            isAdminLoggedIn={isAdminLoggedIn}
          />
        )}

        {currentTab === 'huta_in' && (
          <HutaInPage
            events={events}
            isAdminLoggedIn={isAdminLoggedIn}
            onNavigateToAdminEvents={handleOpenAdminPortal}
            onBackToHome={() => setCurrentTab('marketplace')}
            onOpenPostAd={handleOpenPostAd}
            onSelectCategory={(cat, query) => {
              handleSelectCategory(cat, query, true);
            }}
            onToast={showToast}
          />
        )}

        {currentTab === 'categories' && (
          <AllCategoriesPage
            onBack={() => setCurrentTab('marketplace')}
            onSelectCategory={(cat, query) => {
              handleSelectCategory(cat, query, true);
            }}
            listings={listings}
          />
        )}

        {currentTab === 'more' && (
          <MorePage
            currentUser={currentUser}
            isAdminLoggedIn={isAdminLoggedIn}
            favoritesCount={favorites.length}
            onSelectTab={(tab) => setCurrentTab(tab)}
            onOpenUserAuth={() => setIsUserAuthOpen(true)}
            onOpenAdminLogin={handleOpenAdminPortal}
            onOpenPostAd={handleOpenPostAd}
            onOpenAppStore={() => setIsAppStoreOpen(true)}
            onOpenChat={() => {
              setChatTargetListing(null);
              setIsChatOpen(true);
            }}
            onChangePassword={() => setIsChangePasswordOpen(true)}
            onLogoutUser={handleLogoutUser}
            onLogoutAdmin={handleLogoutAdmin}
            onBackToHome={() => setCurrentTab('marketplace')}
            onToast={showToast}
            onOpenPolicy={handleOpenPolicy}
          />
        )}

        {currentTab === 'user_dashboard' && (
          <UserDashboard
            currentUser={currentUser}
            isAdminLoggedIn={isAdminLoggedIn}
            listings={listings}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onEditListing={handleEditListing}
            onDeleteListing={handleDeleteListing}
            onSelectListing={handleSelectListing}
            onOpenPostAd={handleOpenPostAd}
            onOpenAppStore={() => setIsAppStoreOpen(true)}
            onChangePassword={() => setIsChangePasswordOpen(true)}
            onLogoutUser={handleLogoutUser}
            onBackToMarketplace={() => setCurrentTab('marketplace')}
            onOpenUserAuth={() => setIsUserAuthOpen(true)}
            onOpenAdminLogin={handleOpenAdminPortal}
            onOpenAdminDashboard={handleOpenAdminPortal}
            onOpenChat={() => {
              setChatTargetListing(null);
              setIsChatOpen(true);
            }}
            onSelectTab={(tab) => setCurrentTab(tab)}
            onToast={showToast}
          />
        )}

        {currentTab === 'admin_dashboard' && (
          <DedicatedAdminPortal
            isAdminLoggedIn={isAdminLoggedIn}
            onAdminLoginSuccess={() => {
              setIsAdminLoggedIn(true);
              showToast('Admin logged in successfully.', 'success');
            }}
            onLogoutAdmin={handleLogoutAdmin}
            onBackToMarketplace={() => setCurrentTab('marketplace')}
            onToast={showToast}
            listings={listings}
            events={events}
            heroAds={heroAds}
            heroSettings={heroSettings}
            videoReels={videoReels}
            onReelsChange={setVideoReels}
            stores={eStores}
            onStoresChange={setEStores}
            onUpdateHeroSettings={handleUpdateHeroSettings}
            onCreateHeroAd={handleCreateHeroAd}
            onUpdateHeroAd={handleUpdateHeroAd}
            onToggleHeroAd={handleToggleHeroAd}
            onDeleteHeroAd={handleDeleteHeroAd}
            onApprove={handleApproveListing}
            onReject={handleRejectListing}
            onVerifyCustomer={handleVerifyCustomer}
            onToggleFeature={handleToggleFeatureListing}
            onToggleVerifyPro={handleToggleVerifyPro}
            onDelete={handleDeleteListing}
            onSelectListing={handleSelectListing}
            onEditListing={handleEditListing}
            onUpdateEvent={(updated) => {
              setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
            }}
            onCreateEvent={(created) => {
              setEvents((prev) => [created, ...prev]);
            }}
            onDeleteEvent={(id) => {
              setEvents((prev) => prev.filter((e) => e.id !== id));
            }}
            onToggleSpotlightEvent={async (id) => {
              try {
                const updated = await api.toggleSpotlightEvent(id);
                setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
                showToast(
                  updated.isSpotlight
                    ? `"${updated.title}" added to Upcoming Spotlight banner!`
                    : `"${updated.title}" removed from Upcoming Spotlight`,
                  'success'
                );
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Failed to toggle spotlight';
                showToast(msg, 'error');
              }
            }}
            onClearAllListings={async () => {
              try {
                await api.clearAllListings();
                setListings([]);
                showToast('All advertisements removed. Marketplace is completely fresh!', 'info');
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Failed to clear advertisements';
                showToast(msg, 'error');
              }
            }}
          />
        )}
      </main>

      {/* Modals */}
      <AdDetailModal
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        currentUser={currentUser}
        isAdminLoggedIn={isAdminLoggedIn}
        isFavorite={Boolean(selectedListing && favorites.includes(selectedListing.id))}
        onToggleFavorite={handleToggleFavorite}
        onEditListing={handleEditListing}
        onDeleteListing={handleDeleteListing}
        onCopyShareLink={handleCopyShareLink}
        isCompared={Boolean(selectedListing && compareIds.includes(selectedListing.id))}
        onToggleCompare={handleToggleCompare}
        onApproveListing={handleApproveListing}
        onRequestOwnerEdit={(listing) => {
          setSelectedListing(null);
          setTargetListingForEdit(listing);
          setIsUserAuthOpen(true);
        }}
        onStartChat={(listing) => {
          setSelectedListing(null);
          setChatTargetListing(listing);
          setIsChatOpen(true);
        }}
        onRecordAction={handleRecordListingAction}
      />

      {/* Compare Floating Bottom Action Bar */}
      <CompareFloatingBar
        compareListings={compareListings}
        onOpenCompareModal={() => setIsCompareModalOpen(true)}
        onRemoveFromCompare={handleRemoveFromCompare}
        onClearCompare={handleClearCompare}
      />

      {/* Side-by-Side Compare Modal */}
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        compareListings={compareListings}
        onRemoveFromCompare={handleRemoveFromCompare}
        onClearCompare={handleClearCompare}
        onSelectListing={(listing) => {
          setSelectedListing(listing);
          setIsCompareModalOpen(false);
        }}
      />

      {/* Real-time Firebase Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatTargetListing(null);
        }}
        targetListing={chatTargetListing}
        onSelectListing={(listingId) => {
          const found = listings.find((l) => l.id === listingId);
          if (found) {
            setSelectedListing(found);
            setIsChatOpen(false);
          }
        }}
      />

      <PostAdModal
        isOpen={isPostAdOpen}
        onClose={() => {
          setIsPostAdOpen(false);
          setEditingListing(null);
        }}
        onSubmitAd={handleSubmitAd}
        editingListing={editingListing}
        currentUser={currentUser}
        isAdminLoggedIn={isAdminLoggedIn}
        onToast={showToast}
        onSelectListing={(listing) => {
          setSelectedListing(listing);
          setIsPostAdOpen(false);
          setEditingListing(null);
        }}
        onOpenMyAds={() => setCurrentTab('user_dashboard')}
        initialCategory={selectedCategory !== 'All' ? selectedCategory : undefined}
        initialDistrict={selectedLocation !== 'All Sri Lanka' ? selectedLocation : undefined}
      />

      <AuthModals
        isAdminLoginOpen={isAdminLoginOpen}
        onCloseAdminLogin={() => setIsAdminLoginOpen(false)}
        onAdminLoginSuccess={handleAdminLoginSuccess}
        onOpenAdminLogin={handleOpenAdminPortal}
        isUserAuthOpen={isUserAuthOpen}
        onCloseUserAuth={() => {
          setIsUserAuthOpen(false);
          setTargetListingForEdit(null);
        }}
        onUserAuthSuccess={handleUserAuthSuccess}
        onOpenUserAuth={(mode) => {
          if (mode) setUserAuthInitialMode(mode);
          setIsUserAuthOpen(true);
        }}
        initialMode={userAuthInitialMode}
        isChangePasswordOpen={isChangePasswordOpen}
        onCloseChangePassword={() => setIsChangePasswordOpen(false)}
        currentUser={currentUser}
        targetListingForEdit={targetListingForEdit}
        onToast={showToast}
      />

      {/* Footer (Only on consumer marketplace views, hidden in isolated Admin Portal) */}
      {currentTab !== 'admin_dashboard' && (
        <Footer
          currentTab={currentTab}
          onSelectCategory={(cat) => {
            handleSelectCategory(cat, undefined, true);
          }}
          onSelectLocation={(loc) => {
            setSelectedLocation(loc);
            setCurrentTab('marketplace');
          }}
          onOpenPostAd={handleOpenPostAd}
          onOpenAdminLogin={handleOpenAdminPortal}
          onOpenAppStore={() => setIsAppStoreOpen(true)}
          onSelectTab={setCurrentTab}
          onOpenPolicy={handleOpenPolicy}
        />
      )}

      {/* Legal Policies Modal (Terms & Conditions, Privacy Policy, Cookie Policy) */}
      <LegalPoliciesModal
        isOpen={policyModalOpen}
        initialTab={initialPolicyTab}
        onClose={() => setPolicyModalOpen(false)}
      />

      {/* Google Play & App Store Modal */}
      <AppStoreModal
        isOpen={isAppStoreOpen}
        onClose={() => setIsAppStoreOpen(false)}
        onToast={showToast}
      />

      {/* Floating Install Prompt Banner for Mobile / PWA */}
      {currentTab !== 'admin_dashboard' && (
        <PWAInstallBanner onOpenAppStore={() => setIsAppStoreOpen(true)} />
      )}

      {/* Sticky Bottom Navigation Bar (Hidden in Admin Portal) */}
      {currentTab !== 'admin_dashboard' && (
        <BottomNav
          currentTab={currentTab}
          isAdminLoggedIn={isAdminLoggedIn}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenPostAd={handleOpenPostAd}
        />
      )}
    </div>
  );
}
