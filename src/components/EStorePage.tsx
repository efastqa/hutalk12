import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Store,
  ExternalLink,
  ShieldCheck,
  Search,
  PlusCircle,
  Truck,
  Sparkles,
  ShoppingBag,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Globe,
  Tag,
  SlidersHorizontal,
  RotateCcw,
  X,
  Check,
  CheckCircle2,
  Trash2,
  Package,
  Layers,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Home,
  Utensils,
  Gift,
  Info,
  Upload,
  Camera,
  Image as ImageIcon,
  Link as LinkIcon,
  Pencil,
  Share2,
  Copy,
  LayoutGrid,
  Grid3X3,
  List,
  ArrowUpDown,
  ShieldAlert,
  Zap,
  Send,
  CreditCard,
} from 'lucide-react';
import { EStore, EStoreProduct, User, CartItem } from '../types';
import { api } from '../services/api';
import { EStoreSmartCart } from './EStoreSmartCart';

// Image compression helper for fast client-side upload & data URL conversion
async function compressImageFile(file: File, maxDim = 800, quality = 0.82): Promise<string> {
  // 1. Try createImageBitmap for speed & lower memory footprint
  try {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width && bitmap.height) {
        let width = bitmap.width;
        let height = bitmap.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0, width, height);
          bitmap.close();
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          if (dataUrl && dataUrl.length > 500) {
            return dataUrl;
          }
        }
      }
      bitmap.close();
    }
  } catch {
    // Fallback to FileReader below
  }

  // 2. Reliable FileReader fallback
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onerror = () => resolve('');
      reader.onload = (e) => {
        const result = (e.target?.result as string) || '';
        if (!result) return resolve('');
        const img = new Image();
        img.onerror = () => resolve(result);
        img.onload = () => {
          try {
            let width = img.naturalWidth || img.width || 800;
            let height = img.naturalHeight || img.height || 600;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, width);
            canvas.height = Math.max(1, height);
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(result);
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed && compressed.length > 500 ? compressed : result);
          } catch {
            resolve(result);
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    } catch {
      resolve('');
    }
  });
}

// Reusable Image Upload Field with drag-drop, mobile camera/photo library, preview, and URL fallback
interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  aspectRatio?: 'square' | 'banner' | 'product';
  recommendedText?: string;
  placeholderText?: string;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  aspectRatio = 'square',
  recommendedText = 'Tap to choose photo or upload file',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFile = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setIsCompressing(true);
    try {
      const maxDim = aspectRatio === 'banner' ? 1200 : 800;
      const dataUrl = await compressImageFile(file, maxDim, 0.82);
      if (dataUrl) {
        onChange(dataUrl);
      }
    } catch (err) {
      console.error('Image compression failed', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? 'Hide URL' : 'Or paste URL'}</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {/* Upload Zone or Preview */}
      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-gray-50 dark:bg-[#1E2230] shadow-xs">
          <div
            className={`w-full flex items-center justify-center bg-gray-900/5 dark:bg-black/30 ${
              aspectRatio === 'banner'
                ? 'h-32 sm:h-36'
                : aspectRatio === 'product'
                ? 'h-36'
                : 'h-28 sm:h-32'
            }`}
          >
            <img
              src={value}
              alt={label}
              className={`w-full h-full object-cover ${
                aspectRatio === 'square' ? 'max-w-[128px] mx-auto rounded-xl object-cover shadow-sm' : ''
              }`}
            />
          </div>

          {/* Action Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-white text-gray-900 text-xs font-bold shadow-md hover:bg-gray-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span>Change Image</span>
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md hover:bg-red-700 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>

          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600/90 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1 shadow-xs">
            <Check className="w-3 h-3" />
            <span>Image Attached</span>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="sm:hidden absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-[11px] font-bold text-white flex items-center gap-1"
          >
            <Upload className="w-3 h-3" />
            <span>Change</span>
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-4 transition-all text-center flex flex-col items-center justify-center gap-2 select-none ${
            isDragOver
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
              : 'border-gray-300 dark:border-[#2D303E] bg-gray-50/70 dark:bg-[#1E2230]/60 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
          } ${aspectRatio === 'banner' ? 'h-32' : aspectRatio === 'product' ? 'h-32' : 'h-28'}`}
        >
          {isCompressing ? (
            <div className="flex flex-col items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-6 h-6 animate-spin" />
              <span className="text-xs font-bold">Uploading & Optimizing...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-gray-800 dark:text-gray-200 flex items-center justify-center gap-1">
                  <span>Upload Image</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">(Photo / Gallery)</span>
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {recommendedText}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* URL Input Fallback */}
      {showUrlInput && (
        <div className="pt-1">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or enter direct image URL (https://...)"
            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
          />
        </div>
      )}
    </div>
  );
};

interface EStorePageProps {
  stores: EStore[];
  onStoresChange: (stores: EStore[]) => void;
  onBackToMarketplace: () => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  currentUser: User | null;
  initialSelectedStore?: EStore | null;
  isAdminLoggedIn?: boolean;
}

export function formatLKR(amount: number): string {
  return 'Rs ' + Number(amount).toLocaleString('en-LK');
}

const CATEGORIES = [
  'All',
  'Groceries & Daily Essentials',
  'Ceylon Tea & Spices',
  'Fashion & Apparel',
  'Tech & Gadgets',
  'Beauty & Cosmetics',
  'Handmade & Crafts',
  'Home & Living',
  'Gourmet Foods',
];

export interface EStoreCategoryMeta {
  id: string;
  shortName: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  gradient: string;
  activeRing: string;
  badgeStyle: string;
  image: string;
}

export const ESTORE_CATEGORY_METAS: EStoreCategoryMeta[] = [
  {
    id: 'All',
    shortName: 'All Categories',
    tagline: 'All verified Sri Lankan web shops',
    icon: Store,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    activeRing: 'ring-2 ring-emerald-500 shadow-md shadow-emerald-500/20',
    badgeStyle: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
    image: '/src/assets/images/all_estore_merchants_1794485763558.jpg',
  },
  {
    id: 'Groceries & Daily Essentials',
    shortName: 'Groceries & Pantry',
    tagline: 'Pantry staples, organic produce & daily goods',
    icon: ShoppingBag,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
    activeRing: 'ring-2 ring-emerald-500 shadow-md shadow-emerald-500/20',
    badgeStyle: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
    image: '/src/assets/images/groceries_pantry_estore_1794485763297.jpg',
  },
  {
    id: 'Ceylon Tea & Spices',
    shortName: 'Ceylon Tea & Spices',
    tagline: 'Pure Ceylon single origin tea & spices',
    icon: Sparkles,
    accentColor: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
    activeRing: 'ring-2 ring-amber-500 shadow-md shadow-amber-500/20',
    badgeStyle: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
    image: '/src/assets/images/ceylon_tea_spices_estore_1794485764076.jpg',
  },
  {
    id: 'Fashion & Apparel',
    shortName: 'Fashion & Apparel',
    tagline: 'Batik, linen wear, clothing & jewelry',
    icon: Tag,
    accentColor: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-500/20 via-purple-500/10 to-transparent',
    activeRing: 'ring-2 ring-purple-500 shadow-md shadow-purple-500/20',
    badgeStyle: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300',
    image: '/src/assets/images/fashion_apparel_estore_1794485765034.jpg',
  },
  {
    id: 'Tech & Gadgets',
    shortName: 'Tech & Gadgets',
    tagline: 'Smartphones, computers, audio & gear',
    icon: Zap,
    accentColor: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500/20 via-blue-500/10 to-transparent',
    activeRing: 'ring-2 ring-blue-500 shadow-md shadow-blue-500/20',
    badgeStyle: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300',
    image: '/src/assets/images/tech_gadgets_estore_1794485764173.jpg',
  },
  {
    id: 'Beauty & Cosmetics',
    shortName: 'Beauty & Cosmetics',
    tagline: 'Ayurvedic wellness, skincare & fragrances',
    icon: Star,
    accentColor: 'text-rose-600 dark:text-rose-400',
    gradient: 'from-rose-500/20 via-rose-500/10 to-transparent',
    activeRing: 'ring-2 ring-rose-500 shadow-md shadow-rose-500/20',
    badgeStyle: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300',
    image: '/src/assets/images/beauty_cosmetics_estore_1794485765211.jpg',
  },
  {
    id: 'Handmade & Crafts',
    shortName: 'Handmade & Crafts',
    tagline: 'Artisanal handlooms, masks & woodcraft',
    icon: Gift,
    accentColor: 'text-orange-600 dark:text-orange-400',
    gradient: 'from-orange-500/20 via-orange-500/10 to-transparent',
    activeRing: 'ring-2 ring-orange-500 shadow-md shadow-orange-500/20',
    badgeStyle: 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300',
    image: '/src/assets/images/handmade_crafts_estore_1794485766859.jpg',
  },
  {
    id: 'Home & Living',
    shortName: 'Home & Living',
    tagline: 'Decor, kitchenware, furniture & lighting',
    icon: Home,
    accentColor: 'text-teal-600 dark:text-teal-400',
    gradient: 'from-teal-500/20 via-teal-500/10 to-transparent',
    activeRing: 'ring-2 ring-teal-500 shadow-md shadow-teal-500/20',
    badgeStyle: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300',
    image: '/src/assets/images/home_living_estore_1794485766782.jpg',
  },
  {
    id: 'Gourmet Foods',
    shortName: 'Gourmet Foods',
    tagline: 'Artisanal bakes, sweets, confectionery & bites',
    icon: Utensils,
    accentColor: 'text-amber-700 dark:text-amber-400',
    gradient: 'from-amber-600/20 via-amber-600/10 to-transparent',
    activeRing: 'ring-2 ring-amber-600 shadow-md shadow-amber-600/20',
    badgeStyle: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
    image: '/src/assets/images/gourmet_foods_estore_1794485766599.jpg',
  },
];

const DISTRICTS = [
  'All Sri Lanka',
  'Colombo',
  'Gampaha',
  'Kandy',
  'Galle',
  'Kalutara',
  'Kurunegala',
  'Matara',
  'Jaffna',
  'Anuradhapura',
  'Badulla',
  'Ratnapura',
  'Negombo',
];

export const EStorePage: React.FC<EStorePageProps> = ({
  stores,
  onStoresChange,
  onBackToMarketplace,
  onToast,
  currentUser,
  initialSelectedStore = null,
  isAdminLoggedIn = false,
}) => {
  // Check admin access
  const hasAdminPrivileges =
    Boolean(isAdminLoggedIn) ||
    currentUser?.role === 'admin' ||
    (typeof api.isAdminLoggedIn === 'function' && api.isAdminLoggedIn()) ||
    localStorage.getItem('huta_admin') === 'true';

  // Main view toggle: 'stores' or 'products'
  const [activeView, setActiveView] = useState<'stores' | 'products'>('stores');

  // Grid density: 'compact' (2-column mobile), 'comfortable' (1-column high-legibility mobile), 'spacious' (detailed cards with previews)
  const [gridDensity, setGridDensity] = useState<'compact' | 'comfortable' | 'spacious' | 'medium'>('compact');

  // Sorting: 'rating' | 'products' | 'newest' | 'name'
  const [sortBy, setSortBy] = useState<'rating' | 'products' | 'newest' | 'name'>('rating');

  // Delivery & Trust quick filters: 'all' | 'cod' | 'islandwide' | 'verified'
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'cod' | 'islandwide' | 'verified'>('all');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Sri Lanka');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Category visual view mode: 'strip' (horizontal card rail) or 'grid' (all niches grid)
  const [categoryDisplayMode, setCategoryDisplayMode] = useState<'strip' | 'grid'>('strip');
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      categoryScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Live category store & product counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { stores: number; products: number }> = {
      All: {
        stores: stores.length,
        products: stores.reduce((acc, s) => acc + (s.products?.length || 0), 0),
      },
    };
    CATEGORIES.forEach((cat) => {
      if (cat === 'All') return;
      const catStores = stores.filter((s) => s.category === cat);
      const catProducts = catStores.reduce((acc, s) => acc + (s.products?.length || 0), 0);
      counts[cat] = { stores: catStores.length, products: catProducts };
    });
    return counts;
  }, [stores]);

  // Modals & Drawers
  const [selectedStore, setSelectedStore] = useState<EStore | null>(initialSelectedStore);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState<boolean>(false);
  const [targetStoreForProduct, setTargetStoreForProduct] = useState<EStore | null>(null);

  // Confirmation & Edit modals
  const [storeToDelete, setStoreToDelete] = useState<EStore | null>(null);
  const [productToDelete, setProductToDelete] = useState<{ store: EStore; product: EStoreProduct } | null>(null);
  const [isEditStoreModalOpen, setIsEditStoreModalOpen] = useState<boolean>(false);
  const [storeToEdit, setStoreToEdit] = useState<EStore | null>(null);
  const [editForm, setEditForm] = useState({
    storeName: '',
    tagline: '',
    websiteUrl: '',
    whatsapp: '',
    phone: '',
    district: 'Colombo',
    category: 'Groceries & Daily Essentials',
    description: '',
    deliveryInfo: 'Islandwide Delivery • Cash on Delivery (COD) Available',
    logo: '',
    bannerImage: '',
  });

  // Registration Form State
  const [regForm, setRegForm] = useState({
    storeName: '',
    tagline: '',
    websiteUrl: '',
    whatsapp: '',
    phone: '',
    district: 'Colombo',
    category: 'Fashion & Apparel',
    description: '',
    deliveryInfo: 'Islandwide Delivery • Cash on Delivery (COD) Available',
    logo: '',
    bannerImage: '',
    // Optional first product
    addFirstProduct: true,
    firstProductName: '',
    firstProductPrice: '',
    firstProductUrl: '',
    firstProductImage: '',
    firstProductDesc: '',
  });

  // Add Product Form State
  const [prodForm, setProdForm] = useState({
    name: '',
    price: '',
    originalPrice: '',
    productUrl: '',
    image: '',
    description: '',
    category: 'Fashion & Apparel',
    inStock: true,
    featured: false,
  });

  // 1-Click WhatsApp Quick Order Modal State
  const [quickOrderTarget, setQuickOrderTarget] = useState<{
    store: EStore;
    product?: EStoreProduct;
  } | null>(null);

  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [orderDistrict, setOrderDistrict] = useState<string>('Colombo');
  const [orderDeliveryCity, setOrderDeliveryCity] = useState<string>('');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<'cod' | 'bank'>('cod');
  const [orderCustomerNote, setOrderCustomerNote] = useState<string>('');
  const [orderCustomerName, setOrderCustomerName] = useState<string>('');

  // Multi-Item WhatsApp Smart Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('huta_estore_smart_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSmartCartOpen, setIsSmartCartOpen] = useState<boolean>(false);

  // Sync cart with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('huta_estore_smart_cart', JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  // Cart operations
  const handleAddToCart = (store: EStore, product: EStoreProduct, quantity = 1, openCart = false) => {
    const itemId = `${store.id}_${product.id}`;
    setCartItems((prev) => {
      const existing = prev.find((it) => it.id === itemId);
      if (existing) {
        return prev.map((it) =>
          it.id === itemId ? { ...it, quantity: it.quantity + quantity } : it
        );
      }
      return [
        ...prev,
        {
          id: itemId,
          storeId: store.id,
          storeName: store.storeName,
          storeWhatsapp: store.whatsapp,
          storeDistrict: store.district,
          storeLogo: store.logo,
          storeIsVerified: store.isVerifiedMerchant,
          product,
          quantity,
          addedAt: Date.now(),
        },
      ];
    });

    onToast(`Added "${product.name}" to Smart Cart! 🛒`, 'success');
    if (openCart) {
      setIsSmartCartOpen(true);
    }
  };

  const handleUpdateCartQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, quantity: newQty } : it))
    );
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== itemId));
    onToast('Item removed from cart', 'info');
  };

  const handleClearCart = (storeId?: string) => {
    if (storeId) {
      setCartItems((prev) => prev.filter((it) => it.storeId !== storeId));
      onToast('Cleared store items from cart', 'info');
    } else {
      setCartItems([]);
      onToast('Cart cleared', 'info');
    }
  };

  // Auto-open modal or store from URL (e.g. ?tab=estore#register or ?tab=estore&store=123)
  useEffect(() => {
    try {
      if (window.location.hash === '#register') {
        setIsRegisterModalOpen(true);
      }
      const params = new URLSearchParams(window.location.search);
      const storeId = params.get('store');
      if (storeId) {
        const match = stores.find((s) => s.id === storeId);
        if (match) setSelectedStore(match);
      }
    } catch {}
  }, [stores]);

  // Filtered and Sorted stores
  const filteredStores = useMemo(() => {
    const result = stores.filter((store) => {
      if (selectedCategory !== 'All' && store.category !== selectedCategory) {
        return false;
      }
      if (selectedDistrict !== 'All Sri Lanka' && store.district !== selectedDistrict) {
        return false;
      }
      if (deliveryFilter === 'cod') {
        const info = (store.deliveryInfo || '').toLowerCase();
        if (!info.includes('cod') && !info.includes('cash on delivery')) return false;
      } else if (deliveryFilter === 'islandwide') {
        const info = (store.deliveryInfo || '').toLowerCase();
        if (!info.includes('islandwide')) return false;
      } else if (deliveryFilter === 'verified') {
        if (!store.isVerifiedMerchant) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = store.storeName.toLowerCase().includes(q);
        const matchTagline = store.tagline.toLowerCase().includes(q);
        const matchDesc = store.description.toLowerCase().includes(q);
        const matchProduct = (store.products || []).some(
          (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        );
        if (!matchName && !matchTagline && !matchDesc && !matchProduct) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 5.0) - (a.rating || 5.0);
      }
      if (sortBy === 'products') {
        return (b.products?.length || 0) - (a.products?.length || 0);
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'name') {
        return a.storeName.localeCompare(b.storeName);
      }
      return 0;
    });

    return result;
  }, [stores, selectedCategory, selectedDistrict, searchQuery, deliveryFilter, sortBy]);

  // All products across filtered stores
  const allFilteredProducts = useMemo(() => {
    const list: { product: EStoreProduct; store: EStore }[] = [];
    filteredStores.forEach((s) => {
      (s.products || []).forEach((p) => {
        list.push({ product: p, store: s });
      });
    });
    return list;
  }, [filteredStores]);

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedDistrict('All Sri Lanka');
    setSearchQuery('');
    setDeliveryFilter('all');
    setSortBy('rating');
  };

  // Share store link
  const handleShareStore = (store: EStore) => {
    const url = `${window.location.origin}${window.location.pathname}?tab=estore&store=${store.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      onToast(`Link to "${store.storeName}" copied to clipboard! 📋`, 'success');
    } else {
      onToast(url, 'info');
    }
  };

  // Toggle merchant verification (Admin tool)
  const handleToggleVerifyMerchant = async (store: EStore) => {
    try {
      const updated = await api.updateEStore(store.id, {
        isVerifiedMerchant: !store.isVerifiedMerchant,
      });
      const nextStores = stores.map((s) => (s.id === updated.id ? updated : s));
      onStoresChange(nextStores);
      if (selectedStore && selectedStore.id === updated.id) {
        setSelectedStore(updated);
      }
      onToast(
        updated.isVerifiedMerchant
          ? `"${store.storeName}" verified as trusted merchant! 🛡️`
          : `Verification badge removed for "${store.storeName}"`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update merchant verification';
      onToast(msg, 'error');
    }
  };

  // 1-Click WhatsApp Quick Order Trigger (Opens the instant checkout sheet)
  const openQuickOrder = (store: EStore, product?: EStoreProduct) => {
    setQuickOrderTarget({ store, product });
    setOrderQuantity(1);
    setOrderDistrict(store.district && store.district !== 'All Sri Lanka' ? store.district : 'Colombo');
    setOrderDeliveryCity('');
    setOrderPaymentMethod('cod');
    setOrderCustomerNote('');
    setOrderCustomerName(currentUser?.fullname || (currentUser as any)?.name || '');
  };

  // WhatsApp Order Execution (Generates structured, copy-pasteable order details for the merchant)
  const executeSendWhatsAppOrder = (
    store: EStore,
    product?: EStoreProduct,
    customDetails?: {
      quantity?: number;
      district?: string;
      city?: string;
      paymentMethod?: 'cod' | 'bank';
      note?: string;
      customerName?: string;
    }
  ) => {
    let cleanPhone = store.whatsapp.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '94' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('94')) {
      cleanPhone = '94' + cleanPhone;
    }

    const qty = customDetails?.quantity || orderQuantity || 1;
    const district = customDetails?.district || orderDistrict || store.district || 'All Sri Lanka';
    const city = customDetails?.city || orderDeliveryCity || '';
    const payment = customDetails?.paymentMethod || orderPaymentMethod || 'cod';
    const paymentLabel = payment === 'cod' ? 'Cash on Delivery (COD) 💵' : 'Bank Transfer 🏦';
    const note = customDetails?.note || orderCustomerNote || '';
    const customer = customDetails?.customerName || orderCustomerName || '';

    let message = '';
    if (product) {
      const totalPrice = (Number(product.price) || 0) * qty;
      message = `🛒 *NEW 1-CLICK ORDER — HUTA E-STORE*\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `🏪 *Store:* ${store.storeName}\n`;
      message += `📦 *Product:* ${product.name}\n`;
      message += `🔢 *Quantity:* ${qty}\n`;
      message += `💰 *Unit Price:* ${formatLKR(product.price)}\n`;
      if (qty > 1) {
        message += `💵 *Total Amount:* ${formatLKR(totalPrice)}\n`;
      }
      message += `📍 *Delivery Area:* ${district}${city ? ` (${city})` : ''}\n`;
      message += `💳 *Payment Preference:* ${paymentLabel}\n`;
      if (customer) {
        message += `👤 *Customer Name:* ${customer}\n`;
      }
      if (note) {
        message += `📝 *Order Note:* ${note}\n`;
      }
      if (product.productUrl || store.websiteUrl) {
        message += `🔗 *Product Link:* ${product.productUrl || store.websiteUrl}\n`;
      }
      message += `━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `Hi! Please confirm availability, delivery charges, and dispatch schedule!`;
    } else {
      message = `🛍️ *STORE INQUIRY — HUTA E-STORE*\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `🏪 *Store:* ${store.storeName}\n`;
      message += `📍 *My District:* ${district}${city ? ` (${city})` : ''}\n`;
      if (customer) {
        message += `👤 *My Name:* ${customer}\n`;
      }
      if (note) {
        message += `📝 *Inquiry:* ${note}\n`;
      }
      message += `━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `Hi! I found your storefront on HUTA.LK and would like to inquire about your products and delivery options.`;
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setQuickOrderTarget(null);
    onToast('Opening WhatsApp with your order details!', 'success');
  };

  // WhatsApp Order Helper
  const handleWhatsAppOrder = (store: EStore, product?: EStoreProduct) => {
    openQuickOrder(store, product);
  };

  // Register Store Submit
  const handleRegisterStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.storeName.trim()) {
      onToast('Please enter your store name', 'error');
      return;
    }
    if (!regForm.websiteUrl.trim()) {
      onToast('Please enter your official website URL', 'error');
      return;
    }
    if (!regForm.whatsapp.trim()) {
      onToast('Please enter your WhatsApp contact number', 'error');
      return;
    }

    let formattedWebsite = regForm.websiteUrl.trim();
    if (!formattedWebsite.startsWith('http://') && !formattedWebsite.startsWith('https://')) {
      formattedWebsite = 'https://' + formattedWebsite;
    }

    try {
      const initialProducts: EStoreProduct[] = [];
      if (regForm.addFirstProduct && regForm.firstProductName.trim()) {
        const firstPrice = parseFloat(regForm.firstProductPrice) || 0;
        let prodUrl = regForm.firstProductUrl.trim();
        if (prodUrl && !prodUrl.startsWith('http://') && !prodUrl.startsWith('https://')) {
          prodUrl = 'https://' + prodUrl;
        }

        initialProducts.push({
          id: `prod_${Date.now()}`,
          storeId: '',
          name: regForm.firstProductName.trim(),
          price: firstPrice,
          image: regForm.firstProductImage.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
          productUrl: prodUrl || formattedWebsite,
          description: regForm.firstProductDesc.trim() || regForm.firstProductName.trim(),
          category: regForm.category,
          inStock: true,
          featured: true,
        });
      }

      const newStore = await api.createEStore({
        storeName: regForm.storeName.trim(),
        tagline: regForm.tagline.trim() || 'Verified Sri Lankan Online Merchant',
        description: regForm.description.trim() || `Welcome to ${regForm.storeName}. Visit our official website for direct orders and islandwide delivery.`,
        category: regForm.category,
        district: regForm.district,
        websiteUrl: formattedWebsite,
        whatsapp: regForm.whatsapp.trim(),
        phone: regForm.phone.trim() || regForm.whatsapp.trim(),
        logo: regForm.logo.trim() || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80',
        bannerImage: regForm.bannerImage.trim() || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
        deliveryInfo: regForm.deliveryInfo.trim(),
        ownerId: currentUser?.id,
        products: initialProducts,
      });

      onStoresChange([newStore, ...stores]);
      setIsRegisterModalOpen(false);
      setSelectedStore(newStore);
      onToast(`E-Store "${newStore.storeName}" registered successfully! 🎉`, 'success');

      // Reset form
      setRegForm({
        storeName: '',
        tagline: '',
        websiteUrl: '',
        whatsapp: '',
        phone: '',
        district: 'Colombo',
        category: 'Fashion & Apparel',
        description: '',
        deliveryInfo: 'Islandwide Delivery • Cash on Delivery (COD) Available',
        logo: '',
        bannerImage: '',
        addFirstProduct: true,
        firstProductName: '',
        firstProductPrice: '',
        firstProductUrl: '',
        firstProductImage: '',
        firstProductDesc: '',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register store';
      onToast(msg, 'error');
    }
  };

  // Open Add Product Modal for a specific store
  const handleOpenAddProduct = (store: EStore) => {
    setTargetStoreForProduct(store);
    setProdForm({
      name: '',
      price: '',
      originalPrice: '',
      productUrl: store.websiteUrl,
      image: '',
      description: '',
      category: store.category,
      inStock: true,
      featured: false,
    });
    setIsAddProductModalOpen(true);
  };

  // Add Product Submit
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStoreForProduct) return;
    if (!prodForm.name.trim()) {
      onToast('Please enter the product name', 'error');
      return;
    }
    const price = parseFloat(prodForm.price);
    if (isNaN(price) || price < 0) {
      onToast('Please enter a valid price in LKR', 'error');
      return;
    }

    let pUrl = prodForm.productUrl.trim();
    if (pUrl && !pUrl.startsWith('http://') && !pUrl.startsWith('https://')) {
      pUrl = 'https://' + pUrl;
    }

    try {
      const origPrice = parseFloat(prodForm.originalPrice);
      const updatedStore = await api.addProductToEStore(targetStoreForProduct.id, {
        name: prodForm.name.trim(),
        price,
        originalPrice: !isNaN(origPrice) && origPrice > price ? origPrice : undefined,
        productUrl: pUrl || targetStoreForProduct.websiteUrl,
        image: prodForm.image.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
        description: prodForm.description.trim() || prodForm.name.trim(),
        category: prodForm.category,
        inStock: prodForm.inStock,
        featured: prodForm.featured,
      });

      const nextStores = stores.map((s) => (s.id === updatedStore.id ? updatedStore : s));
      onStoresChange(nextStores);
      if (selectedStore && selectedStore.id === updatedStore.id) {
        setSelectedStore(updatedStore);
      }
      setIsAddProductModalOpen(false);
      onToast(`Product "${prodForm.name}" added to ${targetStoreForProduct.storeName}!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add product';
      onToast(msg, 'error');
    }
  };

  // Confirm delete product
  const handleExecuteDeleteProduct = async () => {
    if (!productToDelete) return;
    const { store, product } = productToDelete;
    try {
      const updatedStore = await api.deleteProductFromEStore(store.id, product.id);
      const nextStores = stores.map((s) => (s.id === updatedStore.id ? updatedStore : s));
      onStoresChange(nextStores);
      if (selectedStore && selectedStore.id === updatedStore.id) {
        setSelectedStore(updatedStore);
      }
      onToast('Product removed from catalog', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove product';
      onToast(msg, 'error');
    } finally {
      setProductToDelete(null);
    }
  };

  // Open Edit Store Modal
  const handleOpenEditStore = (store: EStore) => {
    setStoreToEdit(store);
    setEditForm({
      storeName: store.storeName,
      tagline: store.tagline || '',
      websiteUrl: store.websiteUrl || '',
      whatsapp: store.whatsapp || '',
      phone: store.phone || '',
      district: store.district || 'Colombo',
      category: store.category || 'Groceries & Daily Essentials',
      description: store.description || '',
      deliveryInfo: store.deliveryInfo || 'Islandwide Delivery • Cash on Delivery (COD) Available',
      logo: store.logo || '',
      bannerImage: store.bannerImage || '',
    });
    setIsEditStoreModalOpen(true);
  };

  // Save Edited Store
  const handleSaveEditStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeToEdit) return;
    if (!editForm.storeName.trim()) {
      onToast('Please enter the store name', 'error');
      return;
    }
    if (!editForm.websiteUrl.trim()) {
      onToast('Please enter your store website URL', 'error');
      return;
    }
    if (!editForm.whatsapp.trim()) {
      onToast('Please enter your WhatsApp contact number', 'error');
      return;
    }

    let formattedWebsite = editForm.websiteUrl.trim();
    if (!formattedWebsite.startsWith('http://') && !formattedWebsite.startsWith('https://')) {
      formattedWebsite = 'https://' + formattedWebsite;
    }

    try {
      const updated = await api.updateEStore(storeToEdit.id, {
        storeName: editForm.storeName.trim(),
        tagline: editForm.tagline.trim() || 'Verified Sri Lankan Online Merchant',
        websiteUrl: formattedWebsite,
        whatsapp: editForm.whatsapp.trim(),
        phone: editForm.phone.trim() || editForm.whatsapp.trim(),
        district: editForm.district,
        category: editForm.category,
        description: editForm.description.trim(),
        deliveryInfo: editForm.deliveryInfo.trim(),
        logo: editForm.logo.trim() || storeToEdit.logo,
        bannerImage: editForm.bannerImage.trim() || storeToEdit.bannerImage,
      });

      const nextStores = stores.map((s) => (s.id === updated.id ? updated : s));
      onStoresChange(nextStores);
      if (selectedStore && selectedStore.id === updated.id) {
        setSelectedStore(updated);
      }
      setIsEditStoreModalOpen(false);
      setStoreToEdit(null);
      onToast(`E-Store "${updated.storeName}" updated successfully!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update store';
      onToast(msg, 'error');
    }
  };

  // Confirm delete store
  const handleExecuteDeleteStore = async () => {
    if (!storeToDelete) return;
    try {
      await api.deleteEStore(storeToDelete.id);
      const nextStores = stores.filter((s) => s.id !== storeToDelete.id);
      onStoresChange(nextStores);
      if (selectedStore && selectedStore.id === storeToDelete.id) {
        setSelectedStore(null);
      }
      onToast(`E-Store "${storeToDelete.storeName}" deleted`, 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete store';
      onToast(msg, 'error');
    } finally {
      setStoreToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0B0C10] text-[#181920] dark:text-[#F8FAFC] pb-24 transition-colors">
      {/* Top Banner / Hero Featuring the User's Attached Sri Lanka Online Grocery Marketplace Design */}
      <div className="bg-[#0A111E] border-b border-emerald-500/20 shadow-xl relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Universal Banner Display (Clean & identical to PC layout on all devices with zero text clashing) */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/30 bg-[#0A111E] aspect-[2171/724]">
            <img
              src="/assets/aistudio/Sri_Lanka_Online_Grocery_Marketplace_fde947ca.png"
              alt="Sri Lanka E-Stores and Online Merchant Marketplace"
              className="w-full h-full object-cover select-none pointer-events-none"
            />

            {/* Title & Description Vector Overlay: "Sri Lanka E-Stores and Online Merchant Marketplace" */}
            <div className="absolute top-[25.2%] left-[8%] w-[47%] h-[44%] bg-[#0A111E] flex flex-col justify-start z-10 pointer-events-none">
              <h1 className="text-white font-extrabold text-[1.4rem] sm:text-[2.2vw] md:text-[2.5vw] lg:text-[2.75vw] xl:text-[2.9vw] leading-[1.12] tracking-tight">
                Sri Lanka E-Stores and Online{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
                  Merchant Marketplace
                </span>
              </h1>
              <p className="text-gray-300 text-[0.62rem] sm:text-[0.85vw] md:text-[0.95vw] lg:text-[1.0vw] leading-relaxed mt-[2%] max-w-[95%] font-normal line-clamp-3">
                Do you need trusted online stores & verified merchants in Sri Lanka? Shop online from registered local brands and get orders delivered across all 25 districts with ease.
              </p>
            </div>

            {/* Live Interactive Overlays */}
            {/* 1. Back button hotspot (top left) */}
            <button
              type="button"
              onClick={onBackToMarketplace}
              title="Back to HUTA Classifieds"
              className="absolute top-[13.5%] left-[8%] w-[14%] h-[9%] rounded-xl hover:bg-white/10 active:scale-95 transition-all cursor-pointer focus:outline-none z-10"
            />

            {/* 2. Register Store button hotspot (top right) */}
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              title="Register Your Store"
              className="absolute top-[13.5%] left-[82.5%] w-[14.5%] h-[9.5%] rounded-full hover:brightness-110 active:scale-95 transition-all cursor-pointer focus:outline-none z-10"
            />

            {/* 3. Merchant Directory Tab */}
            <button
              type="button"
              onClick={() => setActiveView('stores')}
              title="View Merchant / Stores Directory"
              className={`absolute top-[73.5%] left-[8.1%] w-[13.9%] h-[11%] rounded-xl flex items-center justify-center gap-1.5 font-bold text-[0.72vw] lg:text-[0.85vw] transition-all cursor-pointer focus:outline-none z-20 ${
                activeView === 'stores'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400'
                  : 'bg-[#121826] hover:bg-[#1A2234] text-gray-300 border border-white/10'
              }`}
            >
              <Store className="w-[1vw] h-[1vw] shrink-0" />
              <span className="truncate">Merchant Directory ({filteredStores.length})</span>
            </button>

            {/* 4. All Store Products Tab */}
            <button
              type="button"
              onClick={() => setActiveView('products')}
              title="View All Store Products"
              className={`absolute top-[73.5%] left-[22.8%] w-[13.9%] h-[11%] rounded-xl flex items-center justify-center gap-1.5 font-bold text-[0.72vw] lg:text-[0.85vw] transition-all cursor-pointer focus:outline-none z-20 ${
                activeView === 'products'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400'
                  : 'bg-[#121826] hover:bg-[#1A2234] text-gray-300 border border-white/10'
              }`}
            >
              <Package className="w-[1vw] h-[1vw] shrink-0" />
              <span className="truncate">All Store Products ({allFilteredProducts.length})</span>
            </button>

            {/* 5. Live Search Input directly in the search bar */}
            <div className="absolute top-[74.5%] left-[57.2%] w-[35.2%] h-[10.2%] flex items-center pr-2 pl-6 sm:pl-11 z-20">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder=""
                className="w-full h-full bg-transparent text-white text-[10px] sm:text-xs lg:text-sm font-semibold outline-none focus:outline-none cursor-text placeholder-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-gray-300 hover:text-white text-[10px] sm:text-xs bg-black/60 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Mobile Touch Quick Controls (< sm) — provides large touch buttons below banner without any text over the image */}
          <div className="sm:hidden mt-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onBackToMarketplace}
                className="inline-flex items-center gap-1 text-xs text-gray-300 bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-xl border border-white/10 font-bold active:scale-95 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsSmartCartOpen(true)}
                  className="relative inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 active:scale-95 transition-all cursor-pointer"
                  title="Open Smart Shopping Cart"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cart</span>
                  {cartItems.length > 0 && (
                    <span className="bg-[#FF5A36] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {cartItems.reduce((a, b) => a + b.quantity, 0)}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Register Store</span>
                </button>
              </div>
            </div>

            {/* Mobile View Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveView('stores')}
                className={`py-2 px-1 rounded-lg font-bold transition-all cursor-pointer text-center truncate ${
                  activeView === 'stores'
                    ? 'bg-emerald-500 text-white shadow-xs font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Merchants ({filteredStores.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveView('products')}
                className={`py-2 px-1 rounded-lg font-bold transition-all cursor-pointer text-center truncate ${
                  activeView === 'products'
                    ? 'bg-emerald-500 text-white shadow-xs font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Products ({allFilteredProducts.length})
              </button>
            </div>

            {/* Mobile Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search store name, product, or keywords..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-gray-400 outline-none focus:border-emerald-400 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category & District Showcase */}
        <div className="space-y-4 mb-8">
          {/* E-Store Category Showcase Header & Cards */}
          <div className="bg-white dark:bg-[#151822] p-4 sm:p-5 rounded-2xl border border-gray-200/90 dark:border-[#252836] shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#202330]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-extrabold uppercase tracking-wide">
                    <Store className="w-3.5 h-3.5 text-emerald-600" />
                    <span>9 Store Categories</span>
                  </span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                    {stores.length} verified sellers
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
                  Explore Sri Lanka E-Stores by Category
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Click a category to filter stores and their direct-to-consumer product catalogs
                </p>
              </div>

              {/* View Switcher & Carousel Navigation */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <div className="inline-flex items-center p-1 rounded-xl bg-gray-100 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E]">
                  <button
                    type="button"
                    onClick={() => setCategoryDisplayMode('strip')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      categoryDisplayMode === 'strip'
                        ? 'bg-white dark:bg-[#151822] text-emerald-600 dark:text-emerald-400 shadow-2xs font-extrabold'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Horizontal card slider"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Slider</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryDisplayMode('grid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      categoryDisplayMode === 'grid'
                        ? 'bg-white dark:bg-[#151822] text-emerald-600 dark:text-emerald-400 shadow-2xs font-extrabold'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="All categories grid"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Grid View</span>
                  </button>
                </div>

                {categoryDisplayMode === 'strip' && (
                  <div className="hidden sm:flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => scrollCategories('left')}
                      className="w-8 h-8 rounded-xl border border-gray-200 dark:border-[#2D303E] bg-white dark:bg-[#1A1E2B] hover:bg-gray-50 dark:hover:bg-[#202536] text-gray-700 dark:text-gray-300 flex items-center justify-center cursor-pointer transition-colors shadow-2xs active:scale-95"
                      aria-label="Scroll categories left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCategories('right')}
                      className="w-8 h-8 rounded-xl border border-gray-200 dark:border-[#2D303E] bg-white dark:bg-[#1A1E2B] hover:bg-gray-50 dark:hover:bg-[#202536] text-gray-700 dark:text-gray-300 flex items-center justify-center cursor-pointer transition-colors shadow-2xs active:scale-95"
                      aria-label="Scroll categories right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Category Cards Showcase with Matching Photography */}
            <div className="pt-3">
              {categoryDisplayMode === 'strip' ? (
                /* Slider / Strip Rail */
                <div
                  ref={categoryScrollRef}
                  className="flex items-stretch gap-3.5 overflow-x-auto pb-3 pt-1 scroll-smooth scrollbar-thin"
                >
                  {ESTORE_CATEGORY_METAS.map((catMeta) => {
                    const isActive = selectedCategory === catMeta.id;
                    const IconComponent = catMeta.icon;
                    const count = categoryCounts[catMeta.id] || { stores: 0, products: 0 };

                    return (
                      <button
                        key={catMeta.id}
                        type="button"
                        onClick={() => setSelectedCategory(catMeta.id)}
                        className={`min-w-[215px] sm:min-w-[240px] max-w-[250px] shrink-0 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 group cursor-pointer relative overflow-hidden ${
                          isActive
                            ? 'bg-white dark:bg-[#151822] border-emerald-500 shadow-lg shadow-emerald-500/15 ring-2 ring-emerald-500/40 scale-[1.01]'
                            : 'bg-white dark:bg-[#151822] hover:bg-gray-50/70 dark:hover:bg-[#181B26] border-gray-200/80 dark:border-[#252836] hover:border-emerald-300 dark:hover:border-emerald-700/70 hover:shadow-md'
                        }`}
                      >
                        {/* Image Window */}
                        <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-slate-900">
                          <img
                            src={catMeta.image}
                            alt={catMeta.shortName}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                            onError={(e) => {
                              // Zero-broken-image fallback
                              (e.currentTarget as HTMLImageElement).style.opacity = '0';
                            }}
                          />
                          {/* Measured contrast scrim */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 pointer-events-none" />

                          {/* Top floating bar: Icon + Stores Count */}
                          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 z-10 pointer-events-none">
                            <div className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xs">
                              <IconComponent className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-extrabold text-white tracking-wide">
                              {count.stores} {count.stores === 1 ? 'Store' : 'Stores'}
                            </span>
                          </div>

                          {/* Bottom title overlay on image */}
                          <div className="absolute bottom-2 left-2.5 right-2.5 z-10 pointer-events-none">
                            <h3 className="text-white font-black text-xs sm:text-sm tracking-tight drop-shadow-sm truncate">
                              {catMeta.shortName}
                            </h3>
                          </div>
                        </div>

                        {/* Card Content Body */}
                        <div className="p-3 flex flex-col justify-between flex-1 space-y-2">
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                            {catMeta.tagline}
                          </p>

                          {/* Card Footer: Products Count & Active State */}
                          <div className="pt-2 border-t border-gray-100 dark:border-[#252836] flex items-center justify-between text-[10px] font-semibold">
                            <span className="text-gray-600 dark:text-gray-400">
                              {count.products} Products
                            </span>
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                <span>Explore</span>
                                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Grid View (All Niches Grid with Matching Images) */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-1">
                  {ESTORE_CATEGORY_METAS.map((catMeta) => {
                    const isActive = selectedCategory === catMeta.id;
                    const IconComponent = catMeta.icon;
                    const count = categoryCounts[catMeta.id] || { stores: 0, products: 0 };

                    return (
                      <button
                        key={catMeta.id}
                        type="button"
                        onClick={() => setSelectedCategory(catMeta.id)}
                        className={`rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 group cursor-pointer relative overflow-hidden ${
                          isActive
                            ? 'bg-white dark:bg-[#151822] border-emerald-500 shadow-lg shadow-emerald-500/15 ring-2 ring-emerald-500/40'
                            : 'bg-white dark:bg-[#151822] hover:bg-gray-50/70 dark:hover:bg-[#181B26] border-gray-200/80 dark:border-[#252836] hover:border-emerald-300 dark:hover:border-emerald-700/70 hover:shadow-md'
                        }`}
                      >
                        {/* Image Window */}
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
                          <img
                            src={catMeta.image}
                            alt={catMeta.shortName}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.opacity = '0';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 pointer-events-none" />

                          {/* Top Badges */}
                          <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 z-10 pointer-events-none">
                            <div className="w-6 h-6 rounded-md bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center">
                              <IconComponent className="w-3 h-3 text-white" />
                            </div>
                            <span className="px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[9px] font-extrabold text-white">
                              {count.stores}
                            </span>
                          </div>

                          {/* Title on image */}
                          <div className="absolute bottom-1.5 left-2 right-2 z-10 pointer-events-none">
                            <h3 className="text-white font-extrabold text-xs tracking-tight drop-shadow-sm truncate">
                              {catMeta.shortName}
                            </h3>
                          </div>
                        </div>

                        {/* Card Content Body */}
                        <div className="p-2.5 flex flex-col justify-between flex-1 space-y-1.5">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
                            {catMeta.tagline}
                          </p>

                          <div className="pt-1.5 border-t border-gray-100 dark:border-[#252836] flex items-center justify-between text-[10px]">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">
                              {count.products} Items
                            </span>
                            {isActive ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 text-[10px]">
                                <Check className="w-3 h-3" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Category Filter Callout Banner (when a specific category is chosen) */}
            {selectedCategory !== 'All' && (
              <div className="mt-3.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs text-emerald-950 dark:text-emerald-200">
                    Filtered by Category:{' '}
                    <strong className="font-extrabold text-emerald-800 dark:text-emerald-300">
                      {selectedCategory}
                    </strong>
                    <span className="text-emerald-700/80 dark:text-emerald-400/80 ml-1.5 hidden sm:inline">
                      ({categoryCounts[selectedCategory]?.stores || 0} stores • {categoryCounts[selectedCategory]?.products || 0} products)
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E2230] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold text-gray-700 hover:text-rose-600 dark:text-gray-300 dark:hover:text-rose-400 border border-gray-200 dark:border-gray-700 hover:border-rose-300 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Show All Categories</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Quick District Selector Dropdown (Ideal for smaller screens) */}
          <div className="sm:hidden flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5 flex-1 bg-white dark:bg-[#151822] px-3 py-2 rounded-xl border border-gray-200 dark:border-[#2D303E] text-xs font-bold text-gray-800 dark:text-gray-200 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
              <span className="text-gray-400 font-medium text-[11px] shrink-0">District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-transparent text-xs text-gray-800 dark:text-gray-200 font-bold outline-none cursor-pointer border-none w-full"
                aria-label="Filter stores by district"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d} className="bg-white dark:bg-[#181920] text-gray-900 dark:text-white">
                    {d}
                  </option>
                ))}
              </select>
            </div>
            {(selectedCategory !== 'All' || selectedDistrict !== 'All Sri Lanka' || searchQuery) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/40 shrink-0 cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Districts Bar (Horizontal Scroll) */}
          <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <MapPin className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>District:</span>
            </span>
            {DISTRICTS.map((dist) => {
              const isActive = selectedDistrict === dist;
              return (
                <button
                  key={dist}
                  type="button"
                  onClick={() => setSelectedDistrict(dist)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#181920] dark:bg-white text-white dark:text-[#181920] font-bold shadow-2xs'
                      : 'bg-white dark:bg-[#151822] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E]'
                  }`}
                >
                  {dist}
                </button>
              );
            })}

            {(selectedCategory !== 'All' || selectedDistrict !== 'All Sri Lanka' || searchQuery) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1 ml-2 shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* View 1: Stores Directory */}
        {activeView === 'stores' && (
          <div>
            {/* Admin Management Ribbon (Visible for Admins) */}
            {hasAdminPrivileges && (
              <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-transparent border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        Admin E-Store Control Active
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                        {stores.length} Registered
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-black border border-blue-500/30 hidden sm:inline-block">
                        {stores.filter((s) => s.isVerifiedMerchant).length} Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-300">
                      You can Edit (✏️), Delete (🗑️), or Toggle Verification (🛡️) directly on any store card.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Add New Store</span>
                  </button>
                </div>
              </div>
            )}

            {/* Directory Toolbar: Density Toggle, Sort, Delivery Chips */}
            <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-white dark:bg-[#151822] p-2.5 sm:p-3 rounded-2xl border border-gray-200 dark:border-[#252836] shadow-xs">
              {/* Row 1 / Left: Store Count & Delivery Quick Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none w-full md:w-auto">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0 mr-0.5">
                  <span className="font-black text-gray-900 dark:text-white">{filteredStores.length}</span> shops
                </span>

                {/* Quick Trust / Delivery Filters */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDeliveryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      deliveryFilter === 'all'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryFilter('cod')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                      deliveryFilter === 'cod'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                    title="Stores offering Cash on Delivery"
                  >
                    <Truck className="w-3 h-3" />
                    <span>COD</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryFilter('islandwide')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      deliveryFilter === 'islandwide'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    Islandwide
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryFilter('verified')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                      deliveryFilter === 'verified'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                    title="Verified Sri Lankan online merchants only"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Verified</span>
                  </button>
                </div>
              </div>

              {/* Row 2 / Right: Sort and Grid Density Switcher */}
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full md:w-auto pt-1 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-[#252836]">
                {/* Sort dropdown */}
                <div className="flex items-center gap-1 text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    aria-label="Sort E-Stores by"
                    className="bg-gray-100 dark:bg-[#1E2230] text-gray-800 dark:text-gray-200 font-bold px-2 py-1.5 rounded-xl border-none text-xs focus:ring-2 focus:ring-emerald-500 cursor-pointer outline-none"
                  >
                    <option value="rating">Top Rated ⭐</option>
                    <option value="products">Most Items 📦</option>
                    <option value="newest">Recently Added 🕒</option>
                    <option value="name">A to Z 🔤</option>
                  </select>
                </div>

                {/* Density Switcher: 2-Col Grid vs 1-Col List vs Detailed Spacious */}
                <div className="flex items-center p-0.5 rounded-xl bg-gray-100 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E]">
                  <button
                    type="button"
                    onClick={() => setGridDensity('compact')}
                    className={`px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                      gridDensity === 'compact' || gridDensity === 'medium'
                        ? 'bg-white dark:bg-[#151822] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                    }`}
                    title="2-Column Grid View"
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                    <span className="text-[11px]">2-Col</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridDensity('comfortable')}
                    className={`px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                      gridDensity === 'comfortable'
                        ? 'bg-white dark:bg-[#151822] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                    }`}
                    title="1-Column View (Larger text & buttons for older phones)"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="text-[11px]">1-Col</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridDensity('spacious')}
                    className={`px-2 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                      gridDensity === 'spacious'
                        ? 'bg-white dark:bg-[#151822] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                    }`}
                    title="Detailed Spacious Cards"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden xs:inline">Previews</span>
                  </button>
                </div>
              </div>
            </div>

            {filteredStores.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#151822] rounded-3xl border border-gray-200 dark:border-[#252836] p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20 shadow-inner">
                  <Store className="w-8 h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                  {stores.length === 0 ? 'No Online Stores Registered Yet' : 'No Stores Found Matching Your Filters'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                  {stores.length === 0
                    ? 'Default sample ads have been removed. If you have an online website in Sri Lanka, click below to register your store and start adding your products!'
                    : 'Try selecting a different district, clearing filters, or register your own store in this category.'}
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  {stores.length > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#1E2230] text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Register Your E-Store & Add Items</span>
                  </button>
                </div>
              </div>
            ) : gridDensity === 'comfortable' ? (
              /* ======================================================== */
              /* FORMAT A1: COMFORTABLE 1-COL LIST (Max Legibility)        */
              /* Specially optimized for older/smaller smartphone screens */
              /* ======================================================== */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
                {filteredStores.map((store) => (
                  <motion.div
                    key={store.id}
                    layout
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.18 }}
                    className="bg-white dark:bg-[#151822] rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-[#252836] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Banner */}
                      <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-gray-900">
                        <img
                          src={store.bannerImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'}
                          alt={store.storeName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                        {/* Top District & Category & Rating */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs z-10">
                          <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white font-bold flex items-center gap-1 border border-white/10 text-[11px]">
                            <MapPin className="w-3 h-3 text-[#FF5A36]" />
                            <span>{store.district}</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-600/90 backdrop-blur-md text-white font-bold text-[10px]">
                              {store.category}
                            </span>
                            <div className="flex items-center gap-1 bg-amber-400 text-gray-900 px-2 py-0.5 rounded-lg text-[10px] font-black shadow-xs">
                              <Star className="w-2.5 h-2.5 fill-gray-900" />
                              <span>{store.rating ? store.rating.toFixed(1) : '5.0'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Store Logo floating */}
                        <div className="absolute -bottom-3.5 left-4 z-10">
                          <img
                            src={store.logo}
                            alt={store.storeName}
                            className="w-13 h-13 sm:w-15 sm:h-15 rounded-xl sm:rounded-2xl object-cover border-2 sm:border-3 border-white dark:border-[#151822] shadow-md bg-white"
                          />
                        </div>
                      </div>

                      {/* Store Information */}
                      <div className="pt-5 px-4 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3
                                onClick={() => setSelectedStore(store)}
                                className="font-black text-base sm:text-lg text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate cursor-pointer"
                                title={store.storeName}
                              >
                                {store.storeName}
                              </h3>
                              {store.isVerifiedMerchant && (
                                <ShieldCheck
                                  className="w-4 h-4 text-emerald-500 shrink-0"
                                  title="Verified Sri Lankan Online Merchant"
                                />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5 font-medium">
                              {store.tagline || `${store.category} • ${store.district}`}
                            </p>
                          </div>
                        </div>

                        {/* Delivery Info & Products Count */}
                        <div className="mt-2.5 flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                            <ShoppingBag className="w-3 h-3 text-emerald-500" />
                            <span>{store.products?.length || 0} catalog items</span>
                          </span>
                          <span className="text-gray-600 dark:text-gray-300 font-semibold flex items-center gap-1">
                            <Truck className="w-3 h-3 text-teal-500" />
                            <span className="truncate max-w-[140px]">{store.deliveryInfo?.includes('COD') ? 'Cash on Delivery' : 'Islandwide Delivery'}</span>
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-2 leading-relaxed">
                          {store.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Area: Large Touch Targets (44px) */}
                    <div>
                      {hasAdminPrivileges && (
                        <div className="px-3 py-1.5 bg-amber-500/10 dark:bg-amber-950/30 border-t border-amber-200/50 dark:border-amber-800/40 flex items-center justify-between text-xs font-bold">
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-black">Admin Controls</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditStore(store)}
                              className="text-amber-800 dark:text-amber-200 hover:underline flex items-center gap-1"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setStoreToDelete(store)}
                              className="text-red-600 hover:underline flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="p-3 border-t border-gray-100 dark:border-[#252836] bg-gray-50/70 dark:bg-[#181B26]/70 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStore(store)}
                          className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-[#111217] dark:bg-white text-white dark:text-[#111217] hover:bg-emerald-600 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
                        >
                          <Store className="w-4 h-4 shrink-0" />
                          <span>View Store</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleWhatsAppOrder(store)}
                          className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
                          title="1-Click WhatsApp Order"
                        >
                          <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                          <span>WhatsApp Order</span>
                        </button>

                        <a
                          href={store.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-white dark:bg-[#222533] text-gray-700 dark:text-gray-300 hover:bg-gray-100 border border-gray-200 dark:border-[#2D303E] flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                          title={`Visit official site`}
                        >
                          <Globe className="w-4 h-4 text-blue-500" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleShareStore(store)}
                          className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-white dark:bg-[#222533] text-gray-500 hover:text-gray-900 border border-gray-200 dark:border-[#2D303E] flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                          title="Share store"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : gridDensity === 'compact' || gridDensity === 'medium' ? (
              /* ======================================================== */
              /* FORMAT A2: COMPACT 2-COL GRID (Fine-tuned for 320-375px)  */
              /* ======================================================== */
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3.5">
                {filteredStores.map((store) => (
                  <motion.div
                    key={store.id}
                    layout
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.18 }}
                    className="bg-white dark:bg-[#151822] rounded-xl sm:rounded-2xl border border-gray-200 dark:border-[#252836] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Compact Store Banner */}
                      <div className="relative h-20 sm:h-26 w-full overflow-hidden bg-gray-950">
                        <img
                          src={store.bannerImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80'}
                          alt={store.storeName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                        {/* Top Left District & Top Right Rating (Non-colliding) */}
                        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between text-[10px] z-10">
                          <span className="px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white font-bold flex items-center gap-0.5 border border-white/10 text-[9px] sm:text-[10px]">
                            <MapPin className="w-2.5 h-2.5 text-[#FF5A36] shrink-0" />
                            <span className="truncate max-w-[65px] sm:max-w-[90px]">{store.district}</span>
                          </span>

                          <div className="flex items-center gap-0.5 bg-amber-400 text-gray-900 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black shadow-xs shrink-0">
                            <Star className="w-2.5 h-2.5 fill-gray-900" />
                            <span>{store.rating ? store.rating.toFixed(1) : '5.0'}</span>
                          </div>
                        </div>

                        {/* Floating Store Logo */}
                        <div className="absolute -bottom-2.5 left-2.5 z-10">
                          <img
                            src={store.logo}
                            alt={store.storeName}
                            className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl object-cover border-2 border-white dark:border-[#151822] shadow-md bg-white"
                          />
                        </div>
                      </div>

                      {/* Store Content */}
                      <div className="pt-3.5 px-2 sm:px-3 pb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <h3
                              onClick={() => setSelectedStore(store)}
                              className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate cursor-pointer leading-tight"
                              title={store.storeName}
                            >
                              {store.storeName}
                            </h3>
                            {store.isVerifiedMerchant && (
                              <ShieldCheck
                                className="w-3 h-3 text-emerald-500 shrink-0"
                                title="Verified Sri Lankan Online Merchant"
                              />
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5 font-medium">
                            {store.category}
                          </p>
                        </div>

                        {/* Product Count & Delivery Tag */}
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-600 dark:text-gray-300">
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2 rounded border border-emerald-500/20 text-[9px] sm:text-[10px] flex items-center gap-0.5 shrink-0">
                            <ShoppingBag className="w-2.5 h-2.5 text-emerald-500" />
                            <span>{store.products?.length || 0} items</span>
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 truncate max-w-[80px] sm:max-w-none text-[9px] sm:text-[10px]">
                            {store.deliveryInfo?.includes('COD') ? 'COD Avail.' : 'Islandwide'}
                          </span>
                        </div>

                        <p className="text-[10px] sm:text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2 mt-1 leading-snug">
                          {store.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Area: Clean 3-Button Strip (No crowding) */}
                    <div>
                      {hasAdminPrivileges && (
                        <div className="px-2 py-1 bg-amber-500/10 dark:bg-amber-950/30 border-t border-amber-200/50 dark:border-amber-800/40 flex items-center justify-between text-[9px] font-bold">
                          <button
                            type="button"
                            onClick={() => handleToggleVerifyMerchant(store)}
                            className="text-amber-800 dark:text-amber-200 hover:underline"
                          >
                            {store.isVerifiedMerchant ? 'Verified ✓' : 'Verify'}
                          </button>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditStore(store)}
                              className="text-amber-800 dark:text-amber-200 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setStoreToDelete(store)}
                              className="text-red-600 hover:underline"
                            >
                              Del
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action buttons: Storefront + WhatsApp Quick Order + Website */}
                      <div className="p-1.5 sm:p-2 border-t border-gray-100 dark:border-[#252836] bg-gray-50/70 dark:bg-[#181B26]/70 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedStore(store)}
                          className="flex-1 min-h-[38px] py-1 px-1.5 rounded-lg sm:rounded-xl bg-[#111217] dark:bg-white text-white dark:text-[#111217] hover:bg-emerald-600 dark:hover:bg-emerald-400 font-extrabold text-[10px] sm:text-[11px] text-center flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs truncate"
                        >
                          <Store className="w-3 h-3 shrink-0" />
                          <span className="truncate">Storefront</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleWhatsAppOrder(store)}
                          className="min-h-[38px] min-w-[38px] px-2 rounded-lg sm:rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-2xs shrink-0 cursor-pointer transition-all active:scale-95"
                          title="1-Click WhatsApp Order"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-white shrink-0" />
                        </button>

                        <a
                          href={store.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[38px] min-w-[32px] p-1.5 rounded-lg sm:rounded-xl bg-white dark:bg-[#222533] text-gray-700 dark:text-gray-300 hover:bg-gray-100 border border-gray-200 dark:border-[#2D303E] flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
                          title={`Visit ${store.storeName}'s website`}
                        >
                          <Globe className="w-3.5 h-3.5 text-blue-500" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* ======================================================== */
              /* FORMAT C: DETAILED SPACIOUS CARDS (With product previews) */
              /* ======================================================== */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredStores.map((store) => (
                  <motion.div
                    key={store.id}
                    layout
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-[#151822] rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-[#252836] overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Store Banner */}
                      <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-gray-900">
                        <img
                          src={store.bannerImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'}
                          alt={store.storeName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] z-10">
                          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-bold flex items-center gap-1 border border-white/10">
                            <MapPin className="w-3 h-3 text-[#FF5A36]" />
                            {store.district}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white font-bold">
                              {store.category}
                            </span>
                            {hasAdminPrivileges && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditStore(store);
                                }}
                                className="px-2 py-1 rounded-lg bg-black/75 hover:bg-amber-500 text-white backdrop-blur-md border border-white/20 transition-all text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                title="Edit E-Store"
                              >
                                <Pencil className="w-3 h-3 text-amber-300" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Store Logo floating */}
                        <div className="absolute -bottom-3.5 left-4">
                          <img
                            src={store.logo}
                            alt={store.storeName}
                            className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border-2 sm:border-3 border-white dark:border-[#151822] shadow-md bg-white"
                          />
                        </div>
                      </div>

                      {/* Store Details Header */}
                      <div className="pt-5 px-4 sm:px-5 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3
                                onClick={() => setSelectedStore(store)}
                                className="font-black text-base sm:text-lg text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors cursor-pointer truncate"
                              >
                                {store.storeName}
                              </h3>
                              {store.isVerifiedMerchant && (
                                <ShieldCheck
                                  className="w-4 h-4 text-emerald-500 shrink-0"
                                  title="Verified Sri Lankan Online Merchant"
                                />
                              )}
                            </div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                              {store.tagline || store.category}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-xl text-xs font-black border border-amber-200 dark:border-amber-800/40 shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>{store.rating ? store.rating.toFixed(1) : '5.0'}</span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2 leading-relaxed">
                          {store.description}
                        </p>

                        {/* Delivery policy pill */}
                        <div className="mt-2.5 py-1.5 px-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-100 dark:border-[#2D303E] flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-300">
                          <Truck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                          <span className="truncate">{store.deliveryInfo}</span>
                        </div>

                        {/* Products Mini Grid */}
                        <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-[#252836]">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                              <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Store Catalog ({store.products?.length || 0})</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedStore(store)}
                              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                            >
                              View all ↗
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {(store.products || []).slice(0, 3).map((prod) => (
                              <div
                                key={prod.id}
                                onClick={() => setSelectedStore(store)}
                                className="bg-gray-50 dark:bg-[#1E2230] rounded-xl p-1.5 border border-gray-200 dark:border-[#2D303E] text-center cursor-pointer hover:border-emerald-500 transition-colors"
                              >
                                <img
                                  src={prod.image}
                                  alt={prod.name}
                                  className="w-full h-14 sm:h-16 object-cover rounded-lg mb-1"
                                />
                                <p className="text-[10px] font-bold text-gray-800 dark:text-gray-200 truncate">
                                  {prod.name}
                                </p>
                                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                                  {formatLKR(prod.price)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions Row — Responsive Stack on Mobile */}
                    <div className="p-3 sm:p-4 pt-2 border-t border-gray-100 dark:border-[#252836] bg-gray-50/50 dark:bg-[#181B26]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStore(store)}
                          className="min-h-[42px] sm:min-h-0 py-2 px-3 rounded-xl bg-[#111217] dark:bg-white text-white dark:text-[#111217] hover:bg-[#FF5A36] text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                        >
                          <span>Storefront</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleWhatsAppOrder(store)}
                          className="min-h-[42px] sm:min-h-0 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
                          title="Chat / Order on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-white" />
                          <span>WhatsApp</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between sm:justify-start gap-2 pt-1 sm:pt-0">
                        <a
                          href={store.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#222533] hover:bg-gray-100 text-gray-800 dark:text-white text-xs font-bold border border-gray-200 dark:border-[#2D303E] transition-all cursor-pointer"
                          title={`Visit official site`}
                        >
                          <Globe className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Website</span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleShareStore(store)}
                          className="p-2 rounded-xl bg-white dark:bg-[#222533] hover:bg-gray-100 text-gray-500 hover:text-gray-800 border border-gray-200 dark:border-[#2D303E] transition-all cursor-pointer"
                          title="Share store link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* View 2: All Products Grid */}
        {activeView === 'products' && (
          <div>
            {allFilteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#151822] rounded-3xl border border-gray-200 dark:border-[#252836] p-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  No Products Found Matching Your Criteria
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto mb-5">
                  Try clearing your search query or switching categories.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#1E2230] text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4.5">
                {allFilteredProducts.map(({ product, store }) => {
                  const hasDiscount =
                    product.originalPrice && product.originalPrice > product.price;
                  const discountPercent = hasDiscount
                    ? Math.round(
                        ((product.originalPrice! - product.price) / product.originalPrice!) * 100
                      )
                    : 0;

                  return (
                    <motion.div
                      key={product.id}
                      layout
                      whileHover={{ y: -3 }}
                      transition={{ duration: 0.18 }}
                      className="bg-white dark:bg-[#151822] rounded-xl sm:rounded-2xl border border-gray-200 dark:border-[#252836] overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Product Image */}
                        <div className="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />

                          {/* Discount badge */}
                          {hasDiscount && (
                            <span className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm">
                              -{discountPercent}% OFF
                            </span>
                          )}

                          {/* In Stock Badge */}
                          <span
                            className={`absolute top-2 right-2 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm ${
                              product.inStock
                                ? 'bg-emerald-600/90 text-white'
                                : 'bg-gray-800/90 text-gray-300'
                            }`}
                          >
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>

                        {/* Product Info */}
                        <div className="p-2.5 sm:p-3.5">
                          {/* Store attribution */}
                          <div
                            onClick={() => setSelectedStore(store)}
                            className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer mb-1 truncate"
                          >
                            <Store className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="truncate">{store.storeName}</span>
                            {store.isVerifiedMerchant && (
                              <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                            )}
                          </div>

                          <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug min-h-[2.2rem] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {product.name}
                          </h4>

                          <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                              {formatLKR(product.price)}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                                {formatLKR(product.originalPrice!)}
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                            {product.description}
                          </p>
                        </div>
                      </div>

                      {/* Multi-Item Smart Cart & Buy CTAs */}
                      <div className="p-2.5 sm:p-3 pt-0 flex flex-col gap-1.5">
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(store, product, 1, false)}
                            className={`min-h-[36px] py-1.5 px-2 rounded-xl font-extrabold text-[11px] sm:text-xs flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer active:scale-98 ${
                              cartItems.some((it) => it.id === `${store.id}_${product.id}`)
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                                : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-100'
                            }`}
                            title="Add to Smart Cart"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>
                              {cartItems.some((it) => it.id === `${store.id}_${product.id}`)
                                ? `+ Add More (${
                                    cartItems.find((it) => it.id === `${store.id}_${product.id}`)?.quantity
                                  })`
                                : '+ Cart'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(store, product, 1, true)}
                            className="min-h-[36px] py-1.5 px-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 text-white font-extrabold text-[11px] sm:text-xs flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer active:scale-98"
                            title="Instant checkout with live courier calculator"
                          >
                            <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300 shrink-0" />
                            <span>Buy Now</span>
                          </button>
                        </div>

                        {product.productUrl && (
                          <a
                            href={product.productUrl || store.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-1 text-center text-[10px] text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 font-semibold flex items-center justify-center gap-1 transition-colors"
                          >
                            <span>Visit Official Store</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: Store Front Detail / Boutique Modal                  */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {selectedStore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#151822] w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-[#252836] my-8 max-h-[92vh] flex flex-col"
            >
              {/* Store Header Banner */}
              <div className="relative h-44 sm:h-56 w-full bg-gray-900 shrink-0">
                <img
                  src={selectedStore.bannerImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80'}
                  alt={selectedStore.storeName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                  <button
                    type="button"
                    onClick={() => handleOpenEditStore(selectedStore)}
                    className="px-3 py-1.5 rounded-xl bg-black/70 hover:bg-amber-500 text-white flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all backdrop-blur-md border border-white/20 shadow-md"
                    title="Edit Store Details"
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-300" />
                    <span>Edit Store</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoreToDelete(selectedStore)}
                    className="px-3 py-1.5 rounded-xl bg-black/70 hover:bg-red-600 text-white flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-all backdrop-blur-md border border-white/20 shadow-md"
                    title="Delete Store"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-300" />
                    <span>Delete</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStore(null)}
                    className="w-9 h-9 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center cursor-pointer transition-colors backdrop-blur-md border border-white/20 shadow-md"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Bottom Store Title Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={selectedStore.logo}
                      alt={selectedStore.storeName}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-3 border-white dark:border-[#151822] shadow-xl bg-white"
                    />
                    <div className="text-white">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-black">{selectedStore.storeName}</h2>
                        {selectedStore.isVerifiedMerchant && (
                          <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-300 font-medium">{selectedStore.tagline}</p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 bg-amber-400 text-gray-900 font-black px-3 py-1.5 rounded-xl text-xs shadow-md">
                    <Star className="w-4 h-4 fill-gray-900" />
                    <span>{selectedStore.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-gray-800">({selectedStore.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Store Body Scrollable */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
                {/* Info Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#1E2230] border border-gray-100 dark:border-[#2D303E] text-xs">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <MapPin className="w-4 h-4 text-[#FF5A36] shrink-0" />
                    <span><strong>District:</strong> {selectedStore.district}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Tag className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span><strong>Category:</strong> {selectedStore.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Truck className="w-4 h-4 text-teal-500 shrink-0" />
                    <span className="truncate"><strong>Delivery:</strong> {selectedStore.deliveryInfo}</span>
                  </div>
                </div>

                {/* About & Description */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    About this Store
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedStore.description}
                  </p>
                </div>

                {/* Direct Action Links */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href={selectedStore.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-emerald-600 dark:hover:bg-emerald-400 font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Visit Official Store Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleWhatsAppOrder(selectedStore)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat on WhatsApp ({selectedStore.whatsapp})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAddProduct(selectedStore)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-100 font-bold text-xs ml-auto cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Add Product to this Store</span>
                  </button>
                </div>

                {/* Store Catalog */}
                <div className="pt-4 border-t border-gray-200 dark:border-[#252836]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-500" />
                      <span>Products from {selectedStore.storeName} ({selectedStore.products?.length || 0})</span>
                    </h3>
                  </div>

                  {(!selectedStore.products || selectedStore.products.length === 0) ? (
                    <div className="text-center py-10 bg-gray-50 dark:bg-[#1E2230] rounded-2xl p-6">
                      <p className="text-xs text-gray-500 mb-3">No products added yet for this store.</p>
                      <button
                        type="button"
                        onClick={() => handleOpenAddProduct(selectedStore)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                      >
                        + Add First Product
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 min-[340px]:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4">
                      {selectedStore.products.map((product) => (
                        <div
                          key={product.id}
                          className="bg-white dark:bg-[#1E2230] rounded-xl sm:rounded-2xl border border-gray-200 dark:border-[#2D303E] overflow-hidden p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs group"
                        >
                          <div>
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-2 bg-gray-100 dark:bg-gray-900">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                loading="lazy"
                              />
                              <span
                                className={`absolute top-1.5 right-1.5 text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm ${
                                  product.inStock ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-300'
                                }`}
                              >
                                {product.inStock ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </div>

                            <h4 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-1">
                              {product.name}
                            </h4>
                            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {formatLKR(product.price)}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-gray-500 line-clamp-2 mt-1">
                              {product.description}
                            </p>
                          </div>

                          <div className="pt-2 mt-2 border-t border-gray-100 dark:border-[#2D303E] flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-1.5">
                            <a
                              href={product.productUrl || selectedStore.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 min-h-[34px] text-[11px] font-bold text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                            >
                              <span>Website</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleAddToCart(selectedStore, product, 1, false)}
                                className={`inline-flex items-center justify-center gap-1 min-h-[34px] px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                                  cartItems.some((it) => it.id === `${selectedStore.id}_${product.id}`)
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                                    : 'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-gray-100'
                                }`}
                                title="Add to Multi-Item Cart"
                              >
                                <ShoppingBag className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>
                                  {cartItems.some((it) => it.id === `${selectedStore.id}_${product.id}`)
                                    ? `+ (${
                                        cartItems.find((it) => it.id === `${selectedStore.id}_${product.id}`)?.quantity
                                      })`
                                    : '+ Cart'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAddToCart(selectedStore, product, 1, true)}
                                className="flex-1 xs:flex-none inline-flex items-center justify-center gap-1 min-h-[34px] px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-extrabold shadow-2xs transition-all cursor-pointer"
                                title="Instant WhatsApp Checkout with Courier Calculator"
                              >
                                <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
                                <span>Buy Now</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setProductToDelete({ store: selectedStore, product })}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                title="Delete item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: Register Your E-Store Modal                         */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#151822] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-[#252836] my-8 flex flex-col max-h-[92vh]"
            >
              <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <Store className="w-6 h-6" />
                  <div>
                    <h3 className="font-extrabold text-lg">Register Your Sri Lankan E-Store</h3>
                    <p className="text-xs text-emerald-100">
                      Showcase your online store website & products to buyers across Sri Lanka
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRegisterStore} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
                {/* Store Name & Website URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regForm.storeName}
                      onChange={(e) => setRegForm({ ...regForm, storeName: e.target.value })}
                      placeholder="e.g. Ceylon Crafts & Gems"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Official Website URL *
                    </label>
                    <input
                      type="text"
                      required
                      value={regForm.websiteUrl}
                      onChange={(e) => setRegForm({ ...regForm, websiteUrl: e.target.value })}
                      placeholder="e.g. https://www.myceylonstore.lk"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* Tagline */}
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Store Tagline / Slogan
                  </label>
                  <input
                    type="text"
                    value={regForm.tagline}
                    onChange={(e) => setRegForm({ ...regForm, tagline: e.target.value })}
                    placeholder="e.g. Authentic hand-carved Ceylon woodcraft & brass souvenirs"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                {/* WhatsApp & District & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={regForm.whatsapp}
                      onChange={(e) => setRegForm({ ...regForm, whatsapp: e.target.value })}
                      placeholder="e.g. 077 123 4567"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Base District *
                    </label>
                    <select
                      value={regForm.district}
                      onChange={(e) => setRegForm({ ...regForm, district: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium cursor-pointer"
                    >
                      {DISTRICTS.filter((d) => d !== 'All Sri Lanka').map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Main Category *
                    </label>
                    <select
                      value={regForm.category}
                      onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium cursor-pointer"
                    >
                      {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Delivery Info */}
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Delivery & Payment Policies
                  </label>
                  <input
                    type="text"
                    value={regForm.deliveryInfo}
                    onChange={(e) => setRegForm({ ...regForm, deliveryInfo: e.target.value })}
                    placeholder="e.g. Islandwide Cash on Delivery • 2-3 business days"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Store Description
                  </label>
                  <textarea
                    rows={2}
                    value={regForm.description}
                    onChange={(e) => setRegForm({ ...regForm, description: e.target.value })}
                    placeholder="Briefly describe what your online store sells, your story, or warranty policies..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium resize-none"
                  />
                </div>

                {/* Logo & Banner Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUploadField
                    label="Store Logo"
                    value={regForm.logo}
                    onChange={(val) => setRegForm({ ...regForm, logo: val })}
                    aspectRatio="square"
                    recommendedText="Square 1:1 image (Store Icon / Logo)"
                  />

                  <ImageUploadField
                    label="Store Banner Graphic"
                    value={regForm.bannerImage}
                    onChange={(val) => setRegForm({ ...regForm, bannerImage: val })}
                    aspectRatio="banner"
                    recommendedText="Wide 16:6 banner for store header"
                  />
                </div>

                {/* Optional First Product Section */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      <span>Add your first product now (Recommended)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={regForm.addFirstProduct}
                      onChange={(e) => setRegForm({ ...regForm, addFirstProduct: e.target.checked })}
                      className="rounded accent-emerald-600 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {regForm.addFirstProduct && (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={regForm.firstProductName}
                          onChange={(e) => setRegForm({ ...regForm, firstProductName: e.target.value })}
                          placeholder="Product Name (e.g. Ceylon Spiced Cinnamon Tin)"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none font-medium"
                        />
                        <input
                          type="number"
                          value={regForm.firstProductPrice}
                          onChange={(e) => setRegForm({ ...regForm, firstProductPrice: e.target.value })}
                          placeholder="Price in LKR (e.g. 2450)"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none font-medium"
                        />
                      </div>
                      <input
                        type="text"
                        value={regForm.firstProductUrl}
                        onChange={(e) => setRegForm({ ...regForm, firstProductUrl: e.target.value })}
                        placeholder="Direct product URL on your website"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none font-medium"
                      />
                      <ImageUploadField
                        label="Product Photo"
                        value={regForm.firstProductImage}
                        onChange={(val) => setRegForm({ ...regForm, firstProductImage: val })}
                        aspectRatio="product"
                        recommendedText="High quality photo of this item"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-[#252836]">
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-[#1E2230] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold shadow-md cursor-pointer"
                  >
                    Register & Publish E-Store
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: Add Product Modal                                    */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isAddProductModalOpen && targetStoreForProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#151822] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-[#252836] my-8 flex flex-col"
            >
              <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base">Add Product to Store</h3>
                  <p className="text-xs text-emerald-100">{targetStoreForProduct.storeName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddProductSubmit} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    placeholder="e.g. Pure Ceylon Cinnamon Bark Oil 50ml"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Selling Price (LKR) *
                    </label>
                    <input
                      type="number"
                      required
                      value={prodForm.price}
                      onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                      placeholder="e.g. 2900"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Original / MRP (Optional)
                    </label>
                    <input
                      type="number"
                      value={prodForm.originalPrice}
                      onChange={(e) => setProdForm({ ...prodForm, originalPrice: e.target.value })}
                      placeholder="e.g. 3500 (for discount %)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Direct Product Link on Official Website
                  </label>
                  <input
                    type="text"
                    value={prodForm.productUrl}
                    onChange={(e) => setProdForm({ ...prodForm, productUrl: e.target.value })}
                    placeholder="https://yourstore.lk/products/item-slug"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <ImageUploadField
                  label="Product Photo"
                  value={prodForm.image}
                  onChange={(val) => setProdForm({ ...prodForm, image: val })}
                  aspectRatio="product"
                  recommendedText="Upload high-res product photo or snap with camera"
                />

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Product Description
                  </label>
                  <textarea
                    rows={2}
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                    placeholder="Key specifications, sizes, benefits or flavors..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium resize-none"
                  />
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={prodForm.inStock}
                      onChange={(e) => setProdForm({ ...prodForm, inStock: e.target.checked })}
                      className="rounded accent-emerald-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Item is currently In Stock</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={prodForm.featured}
                      onChange={(e) => setProdForm({ ...prodForm, featured: e.target.checked })}
                      className="rounded accent-emerald-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Feature at Top</span>
                  </label>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-[#252836]">
                  <button
                    type="button"
                    onClick={() => setIsAddProductModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-extrabold hover:bg-emerald-700 shadow-md cursor-pointer"
                  >
                    Add Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: Edit E-Store Details Modal                            */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isEditStoreModalOpen && storeToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#151822] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-[#252836] my-8 max-h-[92vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-100 dark:border-[#252836] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-gray-900 dark:text-white">
                      Edit E-Store Details
                    </h3>
                    <p className="text-xs text-gray-500">
                      Update store profile, contact numbers, district, logo, and banner
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditStoreModalOpen(false);
                    setStoreToEdit(null);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1E2230] text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Edit Store Form */}
              <form onSubmit={handleSaveEditStore} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
                {/* Store Name & Tagline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.storeName}
                      onChange={(e) => setEditForm({ ...editForm, storeName: e.target.value })}
                      placeholder="e.g. Ceylon Spices Direct"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Tagline / Slogan
                    </label>
                    <input
                      type="text"
                      value={editForm.tagline}
                      onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                      placeholder="e.g. Pure single-origin spices from Matale"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* Website & WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Store Website URL *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.websiteUrl}
                      onChange={(e) => setEditForm({ ...editForm, websiteUrl: e.target.value })}
                      placeholder="https://yourstore.lk"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      WhatsApp Contact Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={editForm.whatsapp}
                      onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                      placeholder="0771234567"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* District & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Headquarters District
                    </label>
                    <select
                      value={editForm.district}
                      onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium cursor-pointer"
                    >
                      {DISTRICTS.filter((d) => d !== 'All Sri Lanka').map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Store Category
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium cursor-pointer"
                    >
                      {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Delivery Info */}
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Delivery & Payment Information
                  </label>
                  <input
                    type="text"
                    value={editForm.deliveryInfo}
                    onChange={(e) => setEditForm({ ...editForm, deliveryInfo: e.target.value })}
                    placeholder="e.g. Islandwide Cash on Delivery • 2-3 business days"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Store Description
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Briefly describe what your online store sells..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-gray-900 dark:text-white outline-none focus:border-emerald-500 font-medium resize-none"
                  />
                </div>

                {/* Logo & Banner Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUploadField
                    label="Store Logo"
                    value={editForm.logo}
                    onChange={(val) => setEditForm({ ...editForm, logo: val })}
                    aspectRatio="square"
                    recommendedText="Square 1:1 image (Store Icon / Logo)"
                  />

                  <ImageUploadField
                    label="Store Banner Graphic"
                    value={editForm.bannerImage}
                    onChange={(val) => setEditForm({ ...editForm, bannerImage: val })}
                    aspectRatio="banner"
                    recommendedText="Wide 16:6 banner for store header"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-[#252836]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditStoreModalOpen(false);
                      setStoreToEdit(null);
                    }}
                    className="px-4 py-2.5 rounded-xl text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-[#1E2230] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* CONFIRMATION MODALS (replacing window.confirm)                 */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {/* Delete E-Store Confirmation Modal */}
        {storeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#151822] rounded-3xl p-6 max-w-sm w-full text-center space-y-4 border border-gray-200 dark:border-[#252836] shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 mx-auto flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-gray-900 dark:text-white">Delete E-Store?</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Are you sure you want to permanently delete &quot;{storeToDelete.storeName}&quot; and all its products from HUTA Marketplace?
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStoreToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#1E2230] text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDeleteStore}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-sm"
                >
                  Yes, Delete Store
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Product Confirmation Modal */}
        {productToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#151822] rounded-3xl p-6 max-w-sm w-full text-center space-y-4 border border-gray-200 dark:border-[#252836] shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 mx-auto flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-gray-900 dark:text-white">Remove Product?</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Are you sure you want to remove &quot;{productToDelete.product.name}&quot; from this store catalog?
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#1E2230] text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDeleteProduct}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
                >
                  Yes, Remove Item
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: 1-Click WhatsApp Quick Order Sheet                     */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {quickOrderTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#151822] rounded-3xl max-w-lg w-full border border-gray-200 dark:border-[#252836] shadow-2xl overflow-hidden my-6"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
                    <MessageCircle className="w-5 h-5 fill-current text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-black tracking-wider bg-black/20 px-2 py-0.5 rounded-full">
                        Fast WhatsApp Checkout
                      </span>
                      <span className="text-[10px] bg-amber-400 text-black px-1.5 py-0.2 rounded font-black flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5 fill-black" />
                        1-Click
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight mt-0.5">
                      Instant WhatsApp Order
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickOrderTarget(null)}
                  className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Store mini banner */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200/80 dark:border-[#2D303E]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {quickOrderTarget.store.logo ? (
                      <img
                        src={quickOrderTarget.store.logo}
                        alt={quickOrderTarget.store.storeName}
                        className="w-9 h-9 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-black text-sm shrink-0">
                        {quickOrderTarget.store.storeName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                        {quickOrderTarget.store.storeName}
                      </h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-[#FF5A36] shrink-0" />
                        <span>{quickOrderTarget.store.district}</span>
                        {quickOrderTarget.store.isVerifiedMerchant && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">✓ Verified Merchant</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 block">
                      Direct WhatsApp
                    </span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {quickOrderTarget.store.whatsapp}
                    </span>
                  </div>
                </div>

                {/* Product Card if Ordering Product */}
                {quickOrderTarget.product ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={quickOrderTarget.product.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'}
                        alt={quickOrderTarget.product.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-emerald-500/20"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block truncate">
                          {quickOrderTarget.product.category || 'Selected Item'}
                        </span>
                        <h5 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                          {quickOrderTarget.product.name}
                        </h5>
                        <div className="text-xs font-black text-gray-900 dark:text-white mt-0.5">
                          {formatLKR(quickOrderTarget.product.price)}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 bg-white dark:bg-[#1A1D2B] p-1 rounded-xl border border-gray-200 dark:border-[#2D303E] shrink-0 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                        className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center hover:bg-gray-200 cursor-pointer text-xs"
                      >
                        -
                      </button>
                      <span className="text-xs font-black px-1 min-w-[20px] text-center text-gray-900 dark:text-white">
                        {orderQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOrderQuantity(orderQuantity + 1)}
                        className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold flex items-center justify-center hover:bg-gray-200 cursor-pointer text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-500/30 text-xs text-blue-900 dark:text-blue-200">
                    💡 You are inquiring directly about <strong>{quickOrderTarget.store.storeName}</strong>&apos;s full catalog, custom orders, or delivery options.
                  </div>
                )}

                {/* Delivery & Order Details Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-700 dark:text-gray-300 mb-1">
                      Your Delivery District *
                    </label>
                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#1E2230] px-3 py-2 rounded-xl border border-gray-200 dark:border-[#2D303E]">
                      <MapPin className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
                      <select
                        value={orderDistrict}
                        onChange={(e) => setOrderDistrict(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs font-bold text-gray-800 dark:text-white w-full cursor-pointer"
                      >
                        {DISTRICTS.filter((d) => d !== 'All Sri Lanka').map((dist) => (
                          <option key={dist} value={dist} className="bg-white dark:bg-[#181920] text-gray-900 dark:text-white">
                            {dist}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-700 dark:text-gray-300 mb-1">
                      City / Nearest Town
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Maharagama, Kandy, Galle"
                      value={orderDeliveryCity}
                      onChange={(e) => setOrderDeliveryCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Customer Name & Payment Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-700 dark:text-gray-300 mb-1">
                      Your Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Your name for delivery slip"
                      value={orderCustomerName}
                      onChange={(e) => setOrderCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-700 dark:text-gray-300 mb-1">
                      Payment Preference
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 dark:bg-[#1E2230] rounded-xl text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setOrderPaymentMethod('cod')}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer text-center text-[11px] ${
                          orderPaymentMethod === 'cod'
                            ? 'bg-emerald-600 text-white shadow-xs font-black'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                      >
                        Cash on Delivery
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderPaymentMethod('bank')}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer text-center text-[11px] ${
                          orderPaymentMethod === 'bank'
                            ? 'bg-emerald-600 text-white shadow-xs font-black'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                      >
                        Bank Transfer
                      </button>
                    </div>
                  </div>
                </div>

                {/* Special Instructions / Color / Size Note */}
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-700 dark:text-gray-300 mb-1">
                    Special Note / Size / Delivery Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Size L, Color: Navy, or Deliver after 5 PM"
                    value={orderCustomerNote}
                    onChange={(e) => setOrderCustomerNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Order Summary & Pricing Calculation */}
                {quickOrderTarget.product && (
                  <div className="p-3 rounded-2xl bg-gray-50 dark:bg-[#1A1D2B] border border-gray-200 dark:border-[#2D303E] space-y-1 text-xs">
                    <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                      <span>Subtotal ({orderQuantity} item{orderQuantity > 1 ? 's' : ''}):</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        {formatLKR(quickOrderTarget.product.price * orderQuantity)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-[11px]">
                      <span>Islandwide Courier:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Standard Store Rates Apply</span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-800 pt-1.5 mt-1 flex items-center justify-between font-black text-sm text-gray-900 dark:text-white">
                      <span>Total to Pay:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 text-base">
                        {formatLKR(quickOrderTarget.product.price * orderQuantity)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Trust guarantee pill */}
                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 py-1">
                  <span>🔒 Direct merchant contact</span>
                  <span>•</span>
                  <span>⚡ 0% commission fees</span>
                  <span>•</span>
                  <span>💬 Instant WhatsApp confirmation</span>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-[#252836] bg-gray-50/80 dark:bg-[#181B26]/80 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setQuickOrderTarget(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-200 dark:bg-[#222533] text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-300 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => executeSendWhatsAppOrder(quickOrderTarget.store, quickOrderTarget.product)}
                  className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 active:scale-98 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Send Order to Merchant on WhatsApp</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* SMART CART & SRI LANKA COURIER FEE CALCULATOR DRAWER         */}
      {/* ------------------------------------------------------------- */}
      <EStoreSmartCart
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        isOpen={isSmartCartOpen}
        onClose={() => setIsSmartCartOpen(false)}
        onOpen={() => setIsSmartCartOpen(true)}
        currentUser={currentUser}
        onToast={onToast}
      />
    </div>
  );
};
