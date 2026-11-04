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
  ArrowUpDown,
  ShieldAlert,
} from 'lucide-react';
import { EStore, EStoreProduct, User } from '../types';
import { api } from '../services/api';

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

  // Medium Grid format (default, shows more shops at once as requested!) vs Spacious cards
  const [gridDensity, setGridDensity] = useState<'medium' | 'spacious'>('medium');

  // Sorting: 'rating' | 'products' | 'newest' | 'name'
  const [sortBy, setSortBy] = useState<'rating' | 'products' | 'newest' | 'name'>('rating');

  // Delivery & Trust quick filters: 'all' | 'cod' | 'islandwide' | 'verified'
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'cod' | 'islandwide' | 'verified'>('all');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Sri Lanka');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // WhatsApp Order Helper
  const handleWhatsAppOrder = (store: EStore, product?: EStoreProduct) => {
    let cleanPhone = store.whatsapp.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '94' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('94')) {
      cleanPhone = '94' + cleanPhone;
    }

    let message = `Hello ${store.storeName}! I found your store on HUTA.LK.`;
    if (product) {
      message = `Hello ${store.storeName}! I'm interested in buying "${product.name}" (${formatLKR(
        product.price
      )}) listed on your HUTA E-Store showcase.\nWebsite link: ${product.productUrl || store.websiteUrl}\nIs this in stock for delivery?`;
    } else {
      message += ` I'd like to browse your catalog and inquire about delivery to my area.`;
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
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
              alt="Sri Lanka E-Stores & Online Groceries Marketplace"
              className="w-full h-full object-cover select-none pointer-events-none"
            />

            {/* Live Interactive Overlays */}
            {/* 1. Back button hotspot (top left) */}
            <button
              type="button"
              onClick={onBackToMarketplace}
              title="Back to HUTA Classifieds"
              className="absolute top-[13.5%] left-[8%] w-[14%] h-[9%] rounded-xl hover:bg-white/10 active:scale-95 transition-all cursor-pointer focus:outline-none"
            />

            {/* 2. Register Store button hotspot (top right) */}
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              title="Register Your Store"
              className="absolute top-[13.5%] left-[82.5%] w-[14.5%] h-[9.5%] rounded-full hover:brightness-110 active:scale-95 transition-all cursor-pointer focus:outline-none"
            />

            {/* 3. Grocery Directory Tab hotspot (bottom left) */}
            <button
              type="button"
              onClick={() => setActiveView('stores')}
              title="View Grocery / Stores Directory"
              className={`absolute top-[74.5%] left-[8.2%] w-[13.8%] h-[10.2%] rounded-xl transition-all cursor-pointer focus:outline-none ${
                activeView === 'stores'
                  ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0A111E]'
                  : 'hover:bg-white/10'
              }`}
            />

            {/* 4. All Store Products Tab hotspot (bottom left) */}
            <button
              type="button"
              onClick={() => setActiveView('products')}
              title="View All Store Products"
              className={`absolute top-[74.5%] left-[22.8%] w-[13.8%] h-[10.2%] rounded-xl transition-all cursor-pointer focus:outline-none ${
                activeView === 'products'
                  ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0A111E]'
                  : 'hover:bg-white/10'
              }`}
            />

            {/* 5. Live Search Input directly in the search bar */}
            <div className="absolute top-[74.5%] left-[57.2%] w-[35.2%] h-[10.2%] flex items-center pr-2 pl-6 sm:pl-11">
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
                className="inline-flex items-center gap-1.5 text-xs text-gray-300 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/10 font-bold active:scale-95 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to HUTA</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Register Store</span>
              </button>
            </div>

            {/* Mobile View Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveView('stores')}
                className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  activeView === 'stores'
                    ? 'bg-emerald-500 text-white shadow-xs font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Grocery Directory ({filteredStores.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveView('products')}
                className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  activeView === 'products'
                    ? 'bg-emerald-500 text-white shadow-xs font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All Products ({allFilteredProducts.length})
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
        {/* Category & District Chips */}
        <div className="space-y-3 mb-8">
          {/* Categories Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Tag className="w-3.5 h-3.5 text-emerald-500" />
              <span>Category:</span>
            </span>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-[#151822] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Districts Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#151822] p-3 rounded-2xl border border-gray-200 dark:border-[#252836] shadow-xs">
              {/* Left: Store Count & Delivery Quick Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mr-1">
                  Showing <span className="font-black text-gray-900 dark:text-white">{filteredStores.length}</span> shops
                </span>

                {/* Quick Trust / Delivery Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setDeliveryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      deliveryFilter === 'all'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    All Shops
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryFilter('cod')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      deliveryFilter === 'cod'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                    title="Stores offering Cash on Delivery"
                  >
                    <Truck className="w-3 h-3" />
                    <span>Islandwide COD</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryFilter('islandwide')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      deliveryFilter === 'islandwide'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    Islandwide Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryFilter('verified')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      deliveryFilter === 'verified'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                    title="Verified Sri Lankan online merchants only"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Verified Only</span>
                  </button>
                </div>
              </div>

              {/* Right: Sort and Grid Density Switcher */}
              <div className="flex items-center gap-2.5 ml-auto">
                {/* Sort dropdown */}
                <div className="flex items-center gap-1.5 text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    aria-label="Sort E-Stores by"
                    className="bg-gray-100 dark:bg-[#1E2230] text-gray-800 dark:text-gray-200 font-bold px-2.5 py-1.5 rounded-xl border-none text-xs focus:ring-2 focus:ring-emerald-500 cursor-pointer outline-none"
                  >
                    <option value="rating">Top Rated ⭐</option>
                    <option value="products">Most Products 📦</option>
                    <option value="newest">Recently Added 🕒</option>
                    <option value="name">Store Name (A-Z) 🔤</option>
                  </select>
                </div>

                {/* Density Switcher: Medium Grid (Default) vs Spacious */}
                <div className="flex items-center p-0.5 rounded-xl bg-gray-100 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E]">
                  <button
                    type="button"
                    onClick={() => setGridDensity('medium')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                      gridDensity === 'medium'
                        ? 'bg-white dark:bg-[#151822] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                    }`}
                    title="Medium Grid View (More shops visible at once)"
                  >
                    <Grid3X3 className="w-4 h-4" />
                    <span className="hidden sm:inline text-[11px]">Medium Grid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridDensity('spacious')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                      gridDensity === 'spacious'
                        ? 'bg-white dark:bg-[#151822] text-emerald-600 dark:text-emerald-400 shadow-2xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                    }`}
                    title="Spacious Cards View (With product previews)"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden sm:inline text-[11px]">Spacious</span>
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
            ) : gridDensity === 'medium' ? (
              /* ======================================================== */
              /* FORMAT A: MEDIUM GRID VIEW (Visible more shops at once)   */
              /* ======================================================== */
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5">
                {filteredStores.map((store) => (
                  <motion.div
                    key={store.id}
                    layout
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.18 }}
                    className="bg-white dark:bg-[#151822] rounded-2xl border border-gray-200 dark:border-[#252836] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Compact Store Banner */}
                      <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-gray-900">
                        <img
                          src={store.bannerImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80'}
                          alt={store.storeName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                        {/* Top District & Category Badges */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] z-10">
                          <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-white font-bold flex items-center gap-1 border border-white/10">
                            <MapPin className="w-2.5 h-2.5 text-[#FF5A36]" />
                            <span className="truncate max-w-[70px] sm:max-w-[100px]">{store.district}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-600/90 backdrop-blur-md text-white font-bold truncate max-w-[85px] sm:max-w-[110px]">
                            {store.category}
                          </span>
                        </div>

                        {/* Floating Store Logo */}
                        <div className="absolute -bottom-3 left-3 z-10">
                          <img
                            src={store.logo}
                            alt={store.storeName}
                            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border-2 border-white dark:border-[#151822] shadow-md bg-white"
                          />
                        </div>
                      </div>

                      {/* Store Content */}
                      <div className="pt-4 px-3 pb-2.5">
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <h3
                                onClick={() => setSelectedStore(store)}
                                className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate cursor-pointer"
                                title={store.storeName}
                              >
                                {store.storeName}
                              </h3>
                              {store.isVerifiedMerchant && (
                                <ShieldCheck
                                  className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                                  title="Verified Sri Lankan Online Merchant"
                                />
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {store.tagline || store.category}
                            </p>
                          </div>

                          <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-lg text-[10px] font-black shrink-0 border border-amber-200 dark:border-amber-800/40">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                            <span>{store.rating ? store.rating.toFixed(1) : '5.0'}</span>
                          </div>
                        </div>

                        {/* Product Count & Delivery Tag */}
                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                            <ShoppingBag className="w-2.5 h-2.5 text-emerald-500" />
                            <span>{store.products?.length || 0} items</span>
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 truncate max-w-[110px]">
                            {store.deliveryInfo?.includes('COD') ? 'Cash on Delivery' : 'Islandwide Delivery'}
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2 mt-1.5 leading-snug">
                          {store.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Area: Admin Toolbar + Action Buttons */}
                    <div>
                      {/* Admin Quick Action Strip on Card */}
                      {hasAdminPrivileges && (
                        <div className="px-2.5 py-1.5 bg-amber-500/10 dark:bg-amber-950/30 border-t border-amber-200/50 dark:border-amber-800/40 flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleVerifyMerchant(store)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-all cursor-pointer ${
                                store.isVerifiedMerchant
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-emerald-500 hover:text-white'
                              }`}
                              title="Toggle merchant verification"
                            >
                              {store.isVerifiedMerchant ? 'Verified ✓' : 'Unverified'}
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditStore(store)}
                              className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500 text-amber-800 dark:text-amber-200 hover:text-white transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-0.5"
                              title="Edit E-Store"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setStoreToDelete(store)}
                              className="px-2 py-0.5 rounded-md bg-red-500/20 hover:bg-red-600 text-red-700 dark:text-red-300 hover:text-white transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-0.5"
                              title="Delete E-Store"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Client Action Buttons */}
                      <div className="p-2 sm:p-2.5 border-t border-gray-100 dark:border-[#252836] bg-gray-50/60 dark:bg-[#181B26]/60 flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedStore(store)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-[#111217] dark:bg-white text-white dark:text-[#111217] hover:bg-emerald-600 dark:hover:bg-emerald-400 font-extrabold text-[11px] text-center flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                        >
                          <Store className="w-3 h-3" />
                          <span>Storefront</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleWhatsAppOrder(store)}
                          className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 transition-all cursor-pointer shrink-0"
                          title="Chat / Inquire on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={store.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl bg-white dark:bg-[#222533] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2A2E3D] border border-gray-200 dark:border-[#2D303E] transition-all cursor-pointer shrink-0"
                          title={`Visit ${store.storeName}'s official website`}
                        >
                          <Globe className="w-3.5 h-3.5 text-blue-500" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleShareStore(store)}
                          className="p-1.5 rounded-xl bg-white dark:bg-[#222533] text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-[#2D303E] transition-all cursor-pointer shrink-0"
                          title="Copy direct link to store"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* ======================================================== */
              /* FORMAT B: SPACIOUS CARDS VIEW (Detailed with previews)   */
              /* ======================================================== */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStores.map((store) => (
                  <motion.div
                    key={store.id}
                    layout
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-[#151822] rounded-3xl border border-gray-200 dark:border-[#252836] overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Store Banner */}
                      <div className="relative h-32 w-full overflow-hidden bg-gray-900">
                        <img
                          src={store.bannerImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'}
                          alt={store.storeName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                        {/* Top District & Category Badges + Admin Edit/Delete Actions */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] z-10">
                          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-bold flex items-center gap-1 border border-white/10">
                            <MapPin className="w-3 h-3 text-[#FF5A36]" />
                            {store.district}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white font-bold">
                              {store.category}
                            </span>
                            {hasAdminPrivileges && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditStore(store);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-black/75 hover:bg-amber-500 text-white backdrop-blur-md border border-white/20 transition-all text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                                  title="Edit E-Store"
                                >
                                  <Pencil className="w-3 h-3 text-amber-300" />
                                  <span className="hidden sm:inline">Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStoreToDelete(store);
                                  }}
                                  className="px-2 py-1 rounded-lg bg-black/75 hover:bg-red-600 text-white backdrop-blur-md border border-white/20 transition-all text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                                  title="Delete E-Store"
                                >
                                  <Trash2 className="w-3 h-3 text-red-300" />
                                  <span className="hidden sm:inline">Delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Store Logo floating */}
                        <div className="absolute -bottom-4 left-5">
                          <img
                            src={store.logo}
                            alt={store.storeName}
                            className="w-16 h-16 rounded-2xl object-cover border-3 border-white dark:border-[#151822] shadow-md bg-white"
                          />
                        </div>
                      </div>

                      {/* Store Details Header */}
                      <div className="pt-6 px-5 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3
                                onClick={() => setSelectedStore(store)}
                                className="font-black text-lg text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors cursor-pointer"
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
                              {store.tagline}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-xl text-xs font-black border border-amber-200 dark:border-amber-800/40">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>{store.rating ? store.rating.toFixed(1) : '5.0'}</span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2 leading-relaxed">
                          {store.description}
                        </p>

                        {/* Delivery policy pill */}
                        <div className="mt-3 py-1.5 px-2.5 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-100 dark:border-[#2D303E] flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-300">
                          <Truck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                          <span className="truncate">{store.deliveryInfo}</span>
                        </div>

                        {/* Products Mini Grid */}
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#252836]">
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
                                  className="w-full h-16 object-cover rounded-lg mb-1"
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

                    {/* Bottom Actions Row */}
                    <div className="p-4 pt-2 border-t border-gray-100 dark:border-[#252836] bg-gray-50/50 dark:bg-[#181B26]/50 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <a
                          href={store.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#222533] hover:bg-gray-100 dark:hover:bg-[#2A2E3D] text-gray-800 dark:text-white text-xs font-bold border border-gray-200 dark:border-[#2D303E] transition-all cursor-pointer"
                          title={`Visit ${store.storeName}'s official website`}
                        >
                          <Globe className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Website</span>
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleShareStore(store)}
                          className="p-2 rounded-xl bg-white dark:bg-[#222533] hover:bg-gray-100 dark:hover:bg-[#2A2E3D] text-gray-500 hover:text-gray-800 dark:hover:text-white border border-gray-200 dark:border-[#2D303E] transition-all cursor-pointer"
                          title="Share store link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleWhatsAppOrder(store)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                          title="Chat / Order on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedStore(store)}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#111217] dark:bg-white text-white dark:text-[#111217] hover:bg-[#FF5A36] dark:hover:bg-emerald-400 text-xs font-extrabold transition-all cursor-pointer"
                        >
                          <span>Storefront</span>
                          <ChevronRight className="w-3.5 h-3.5" />
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white dark:bg-[#151822] rounded-2xl border border-gray-200 dark:border-[#252836] overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Product Image */}
                        <div className="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Discount badge */}
                          {hasDiscount && (
                            <span className="absolute top-2.5 left-2.5 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                              -{discountPercent}% OFF
                            </span>
                          )}

                          {/* In Stock Badge */}
                          <span
                            className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm ${
                              product.inStock
                                ? 'bg-emerald-600/90 text-white'
                                : 'bg-gray-800/90 text-gray-300'
                            }`}
                          >
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>

                        {/* Product Info */}
                        <div className="p-3.5">
                          {/* Store attribution */}
                          <div
                            onClick={() => setSelectedStore(store)}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer mb-1 truncate"
                          >
                            <Store className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="truncate">{store.storeName}</span>
                            {store.isVerifiedMerchant && (
                              <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                            )}
                          </div>

                          <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {product.name}
                          </h4>

                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                              {formatLKR(product.price)}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-gray-400 line-through">
                                {formatLKR(product.originalPrice!)}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                            {product.description}
                          </p>
                        </div>
                      </div>

                      {/* Buy CTAs */}
                      <div className="p-3 pt-0 flex flex-col gap-1.5">
                        <a
                          href={product.productUrl || store.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-emerald-600 dark:hover:bg-emerald-400 font-extrabold text-xs text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>Buy on Store Website</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleWhatsAppOrder(store, product)}
                          className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Order on WhatsApp</span>
                        </button>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedStore.products.map((product) => (
                        <div
                          key={product.id}
                          className="bg-white dark:bg-[#1E2230] rounded-2xl border border-gray-200 dark:border-[#2D303E] overflow-hidden p-3 flex flex-col justify-between shadow-2xs group"
                        >
                          <div>
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-2.5 bg-gray-100 dark:bg-gray-900">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <span
                                className={`absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm ${
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
                            <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">
                              {product.description}
                            </p>
                          </div>

                          <div className="pt-2.5 mt-2 border-t border-gray-100 dark:border-[#2D303E] flex items-center justify-between gap-1.5">
                            <a
                              href={product.productUrl || selectedStore.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                            >
                              <span>Buy on Website</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleWhatsAppOrder(selectedStore, product)}
                                className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
                                title="Order via WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
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
    </div>
  );
};
