import React, { useState } from 'react';
import { EStore, EStoreProduct } from '../types';
import { api } from '../services/api';
import {
  Store,
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  CheckCircle2,
  BadgeCheck,
  Package,
  Phone,
  MessageCircle,
  X,
  Loader2,
  Image as ImageIcon,
  ShoppingBag,
  MapPin,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { formatLKR } from './ListingsSection';

interface AdminEStoresManagerProps {
  stores: EStore[];
  onStoresChange: (stores: EStore[]) => void;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const SRI_LANKA_DISTRICTS = [
  'Islandwide',
  'Colombo',
  'Gampaha',
  'Kalutara',
  'Kandy',
  'Matale',
  'Nuwara Eliya',
  'Galle',
  'Matara',
  'Hambantota',
  'Jaffna',
  'Kilinochchi',
  'Mannar',
  'Vavuniya',
  'Mullaitivu',
  'Batticaloa',
  'Ampara',
  'Trincomalee',
  'Kurunegala',
  'Puttalam',
  'Anuradhapura',
  'Polonnaruwa',
  'Badulla',
  'Monaragala',
  'Ratnapura',
  'Kegalle',
];

const STORE_CATEGORIES = [
  'Fashion & Apparel',
  'Tech & Gadgets',
  'Ceylon Tea & Spices',
  'Beauty & Cosmetics',
  'Handmade & Crafts',
  'Home & Living',
  'Gourmet Foods',
  'Groceries & Daily Essentials',
  'Automotive & Spares',
  'Health & Wellness',
  'Books & Stationery',
];

export const AdminEStoresManager: React.FC<AdminEStoresManagerProps> = ({
  stores,
  onStoresChange,
  onToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modals state
  const [storeToEdit, setStoreToEdit] = useState<EStore | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<EStore | null>(null);
  const [selectedStoreForProducts, setSelectedStoreForProducts] = useState<EStore | null>(null);

  // Edit / Add Form State
  const [formState, setFormState] = useState({
    storeName: '',
    tagline: '',
    category: 'Fashion & Apparel',
    district: 'Colombo',
    websiteUrl: '',
    whatsapp: '',
    phone: '',
    email: '',
    logo: '',
    bannerImage: '',
    deliveryInfo: 'Islandwide Delivery • Cash on Delivery (COD) Available',
    description: '',
    isVerifiedMerchant: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Product Modal State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    originalPrice: '',
    category: '',
    image: '',
    description: '',
    isFeatured: false,
    inStock: true,
  });

  // Filtered stores
  const filteredStores = stores.filter((store) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      store.storeName.toLowerCase().includes(q) ||
      (store.tagline && store.tagline.toLowerCase().includes(q)) ||
      (store.whatsapp && store.whatsapp.includes(q)) ||
      (store.phone && store.phone.includes(q));

    const matchesDistrict =
      selectedDistrict === 'all' || store.district === selectedDistrict;

    const matchesCategory =
      selectedCategory === 'all' || store.category === selectedCategory;

    return matchesSearch && matchesDistrict && matchesCategory;
  });

  // Open Edit Form
  const handleOpenEdit = (store: EStore) => {
    setStoreToEdit(store);
    setFormState({
      storeName: store.storeName,
      tagline: store.tagline || '',
      category: store.category || 'Fashion & Apparel',
      district: store.district || 'Colombo',
      websiteUrl: store.websiteUrl || '',
      whatsapp: store.whatsapp || '',
      phone: store.phone || '',
      email: store.email || '',
      logo: store.logo || '',
      bannerImage: store.bannerImage || '',
      deliveryInfo: store.deliveryInfo || 'Islandwide Delivery • Cash on Delivery (COD) Available',
      description: store.description || '',
      isVerifiedMerchant: Boolean(store.isVerifiedMerchant),
    });
    setIsEditModalOpen(true);
  };

  // Open Add Form
  const handleOpenAdd = () => {
    setFormState({
      storeName: '',
      tagline: '',
      category: 'Fashion & Apparel',
      district: 'Colombo',
      websiteUrl: '',
      whatsapp: '',
      phone: '',
      email: '',
      logo: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=300&q=80',
      bannerImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
      deliveryInfo: 'Islandwide Delivery • Cash on Delivery (COD) Available',
      description: '',
      isVerifiedMerchant: true,
    });
    setIsAddModalOpen(true);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeToEdit) return;
    if (!formState.storeName.trim()) {
      onToast('Please enter store name', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await api.updateEStore(storeToEdit.id, {
        storeName: formState.storeName.trim(),
        tagline: formState.tagline.trim(),
        category: formState.category,
        district: formState.district,
        websiteUrl: formState.websiteUrl.trim(),
        whatsapp: formState.whatsapp.trim(),
        phone: formState.phone.trim(),
        email: formState.email.trim(),
        logo: formState.logo.trim() || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=300&q=80',
        bannerImage: formState.bannerImage.trim() || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
        deliveryInfo: formState.deliveryInfo.trim(),
        description: formState.description.trim(),
        isVerifiedMerchant: formState.isVerifiedMerchant,
      });

      const nextStores = stores.map((s) => (s.id === updated.id ? updated : s));
      onStoresChange(nextStores);
      if (selectedStoreForProducts?.id === updated.id) {
        setSelectedStoreForProducts(updated);
      }
      setIsEditModalOpen(false);
      setStoreToEdit(null);
      onToast(`Store "${updated.storeName}" updated successfully!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update store';
      onToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create New Store
  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.storeName.trim()) {
      onToast('Please enter store name', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createEStore({
        storeName: formState.storeName.trim(),
        tagline: formState.tagline.trim(),
        category: formState.category,
        district: formState.district,
        websiteUrl: formState.websiteUrl.trim() || 'https://huta.lk',
        whatsapp: formState.whatsapp.trim(),
        phone: formState.phone.trim(),
        email: formState.email.trim(),
        logo: formState.logo.trim() || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=300&q=80',
        bannerImage: formState.bannerImage.trim() || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
        deliveryInfo: formState.deliveryInfo.trim(),
        description: formState.description.trim(),
        isVerifiedMerchant: formState.isVerifiedMerchant,
        products: [],
      });

      onStoresChange([created, ...stores]);
      setIsAddModalOpen(false);
      onToast(`New E-Store "${created.storeName}" created live!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create store';
      onToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Verified Merchant
  const handleToggleVerified = async (store: EStore) => {
    try {
      const newStatus = !store.isVerifiedMerchant;
      const updated = await api.updateEStore(store.id, { isVerifiedMerchant: newStatus });
      onStoresChange(stores.map((s) => (s.id === store.id ? updated : s)));
      onToast(
        `"${store.storeName}" is now ${newStatus ? 'Verified Merchant' : 'Standard Store'}`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle verification';
      onToast(msg, 'error');
    }
  };

  // Delete Store
  const handleConfirmDelete = async () => {
    if (!storeToDelete) return;
    try {
      await api.deleteEStore(storeToDelete.id);
      onStoresChange(stores.filter((s) => s.id !== storeToDelete.id));
      onToast(`Store "${storeToDelete.storeName}" deleted permanently.`, 'info');
      setStoreToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete store';
      onToast(msg, 'error');
    }
  };

  // Add Product to Store
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreForProducts) return;
    if (!newProduct.name.trim() || !newProduct.price) {
      onToast('Please enter product name and price', 'error');
      return;
    }

    const priceNum = parseFloat(newProduct.price.replace(/[^0-9.]/g, '')) || 0;
    const origPriceNum = newProduct.originalPrice
      ? parseFloat(newProduct.originalPrice.replace(/[^0-9.]/g, ''))
      : undefined;

    const prod: EStoreProduct = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      storeId: selectedStoreForProducts.id,
      name: newProduct.name.trim(),
      price: priceNum,
      originalPrice: origPriceNum,
      category: newProduct.category || selectedStoreForProducts.category,
      image: newProduct.image.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      productUrl: selectedStoreForProducts.websiteUrl || 'https://huta.lk',
      description: newProduct.description.trim(),
      featured: newProduct.isFeatured,
      inStock: newProduct.inStock,
    };

    try {
      const updatedProducts = [prod, ...(selectedStoreForProducts.products || [])];
      const updated = await api.updateEStore(selectedStoreForProducts.id, {
        products: updatedProducts,
      });

      onStoresChange(stores.map((s) => (s.id === updated.id ? updated : s)));
      setSelectedStoreForProducts(updated);
      setIsAddProductOpen(false);
      setNewProduct({
        name: '',
        price: '',
        originalPrice: '',
        category: '',
        image: '',
        description: '',
        isFeatured: false,
        inStock: true,
      });
      onToast(`Product "${prod.name}" added to catalog!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add product';
      onToast(msg, 'error');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (storeId: string, productId: string) => {
    const store = stores.find((s) => s.id === storeId);
    if (!store) return;

    try {
      const updatedProducts = (store.products || []).filter((p) => p.id !== productId);
      const updated = await api.updateEStore(store.id, { products: updatedProducts });
      onStoresChange(stores.map((s) => (s.id === updated.id ? updated : s)));
      if (selectedStoreForProducts?.id === store.id) {
        setSelectedStoreForProducts(updated);
      }
      onToast('Product removed from store catalog', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete product';
      onToast(msg, 'error');
    }
  };

  const totalProducts = stores.reduce((sum, s) => sum + (s.products?.length || 0), 0);
  const totalVerified = stores.filter((s) => s.isVerifiedMerchant).length;

  return (
    <div className="space-y-6">
      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-950 uppercase tracking-wider">
              Registered E-Stores
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FF5A36] text-white flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">{stores.length}</div>
          <p className="text-[11px] text-gray-600 mt-0.5">Online brand stores in Sri Lanka</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
              Verified Merchants
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <BadgeCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">{totalVerified}</div>
          <p className="text-[11px] text-gray-600 mt-0.5">Stores with official trust badge</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
              Catalog Products
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">{totalProducts}</div>
          <p className="text-[11px] text-gray-600 mt-0.5">Direct items with WhatsApp checkout</p>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search store name, WhatsApp, phone..."
              className="w-full pl-9 pr-7 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#FF5A36] outline-none bg-white font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium text-gray-700 bg-white outline-none focus:border-[#FF5A36]"
          >
            <option value="all">All Districts</option>
            {SRI_LANKA_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-medium text-gray-700 bg-white outline-none focus:border-[#FF5A36] hidden sm:block"
          >
            <option value="all">All Categories</option>
            {STORE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="w-full md:w-auto px-4 py-2.5 bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New E-Store</span>
        </button>
      </div>

      {/* Stores List Table / Cards */}
      {filteredStores.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="font-extrabold text-sm text-gray-800">No E-Stores Found</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedDistrict !== 'all' || selectedCategory !== 'all'
              ? 'No stores matched your current search filters. Try clearing filters.'
              : 'No online stores registered yet. Click "Register New E-Store" to add the first merchant.'}
          </p>
          {(searchTerm || selectedDistrict !== 'all' || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedDistrict('all');
                setSelectedCategory('all');
              }}
              className="mt-3 px-3 py-1.5 text-xs text-[#FF5A36] font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              className="p-4 bg-white rounded-2xl border border-gray-200 hover:border-orange-300 transition-all shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Store Identity & Info */}
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <img
                  src={
                    store.logo ||
                    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=150&q=80'
                  }
                  alt={store.storeName}
                  className="w-14 h-14 rounded-2xl object-cover border border-gray-200 shrink-0 bg-gray-50"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-sm text-gray-900 truncate">
                      {store.storeName}
                    </h4>
                    {store.isVerifiedMerchant && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black flex items-center gap-1 shrink-0">
                        <BadgeCheck className="w-3 h-3 text-blue-600" />
                        Verified
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-semibold">
                      {store.district}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 text-[10px] font-semibold">
                      {store.category}
                    </span>
                  </div>

                  {store.tagline && (
                    <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">{store.tagline}</p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1.5 flex-wrap">
                    {store.whatsapp && (
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp: {store.whatsapp}
                      </span>
                    )}
                    {store.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {store.phone}
                      </span>
                    )}
                    {store.websiteUrl && (
                      <a
                        href={store.websiteUrl.startsWith('http') ? store.websiteUrl : `https://${store.websiteUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline truncate max-w-[200px]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {store.websiteUrl.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    <span className="text-purple-700 font-semibold">
                      📦 {store.products?.length || 0} Products
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedStoreForProducts(store)}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Manage Products"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Products ({store.products?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleVerified(store)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer border ${
                    store.isVerifiedMerchant
                      ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                  title={store.isVerifiedMerchant ? 'Remove Verified Badge' : 'Grant Verified Badge'}
                >
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>{store.isVerifiedMerchant ? 'Verified' : 'Verify'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(store)}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Edit Store Details"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStoreToDelete(store)}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Delete Store"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* EDIT / ADD STORE MODAL                                        */}
      {/* ------------------------------------------------------------- */}
      {(isEditModalOpen || isAddModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div
            className="absolute inset-0"
            onClick={() => {
              setIsEditModalOpen(false);
              setIsAddModalOpen(false);
            }}
          />

          <div className="relative bg-white rounded-3xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden my-6 z-10 max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF5A36] text-white flex items-center justify-center font-bold">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    {isEditModalOpen ? `Edit: ${storeToEdit?.storeName}` : 'Register New E-Store'}
                  </h3>
                  <p className="text-[11px] text-gray-300">
                    Modify store profile, delivery terms, WhatsApp, and branding
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setIsAddModalOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={isEditModalOpen ? handleSaveEdit : handleSaveNew}
              className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1"
            >
              {/* Store Name & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Store Name <span className="text-[#FF5A36]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.storeName}
                    onChange={(e) => setFormState({ ...formState, storeName: e.target.value })}
                    placeholder="e.g. Colombo Tech Boutique"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#FF5A36] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={formState.tagline}
                    onChange={(e) => setFormState({ ...formState, tagline: e.target.value })}
                    placeholder="e.g. Official Apple & Android Importer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#FF5A36] outline-none"
                  />
                </div>
              </div>

              {/* Category & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Store Category <span className="text-[#FF5A36]">*</span>
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:border-[#FF5A36] outline-none bg-white cursor-pointer"
                  >
                    {STORE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    District / Operating Hub <span className="text-[#FF5A36]">*</span>
                  </label>
                  <select
                    value={formState.district}
                    onChange={(e) => setFormState({ ...formState, district: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:border-[#FF5A36] outline-none bg-white cursor-pointer"
                  >
                    {SRI_LANKA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* WhatsApp Contact & Direct Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    WhatsApp Number (Orders & Inquiries) <span className="text-[#FF5A36]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formState.whatsapp}
                    onChange={(e) => setFormState({ ...formState, whatsapp: e.target.value })}
                    placeholder="e.g. 077 123 4567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#FF5A36] outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Multi-item shopping cart will dispatch orders directly to this number.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Direct Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    placeholder="e.g. 011 234 5678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#FF5A36] outline-none"
                  />
                </div>
              </div>

              {/* Website URL & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Official Website URL
                  </label>
                  <input
                    type="url"
                    value={formState.websiteUrl}
                    onChange={(e) => setFormState({ ...formState, websiteUrl: e.target.value })}
                    placeholder="https://mybrand.lk"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#FF5A36] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="sales@mybrand.lk"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#FF5A36] outline-none"
                  />
                </div>
              </div>

              {/* Logo URL & Banner Image URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Store Logo Image URL
                  </label>
                  <div className="flex items-center gap-2">
                    {formState.logo && (
                      <img
                        src={formState.logo}
                        alt="Preview"
                        className="w-9 h-9 rounded-xl object-cover border border-gray-200 shrink-0"
                      />
                    )}
                    <input
                      type="url"
                      value={formState.logo}
                      onChange={(e) => setFormState({ ...formState, logo: e.target.value })}
                      placeholder="https://.../logo.jpg"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#FF5A36] outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Banner Cover Image URL
                  </label>
                  <div className="flex items-center gap-2">
                    {formState.bannerImage && (
                      <img
                        src={formState.bannerImage}
                        alt="Preview"
                        className="w-9 h-9 rounded-xl object-cover border border-gray-200 shrink-0"
                      />
                    )}
                    <input
                      type="url"
                      value={formState.bannerImage}
                      onChange={(e) => setFormState({ ...formState, bannerImage: e.target.value })}
                      placeholder="https://.../banner.jpg"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#FF5A36] outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Delivery Policy & COD Details
                </label>
                <input
                  type="text"
                  value={formState.deliveryInfo}
                  onChange={(e) => setFormState({ ...formState, deliveryInfo: e.target.value })}
                  placeholder="e.g. Islandwide 2-3 Days Delivery • Cash on Delivery (COD) Available"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#FF5A36] outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Store Bio / Description
                </label>
                <textarea
                  rows={3}
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  placeholder="Describe your retail boutique, products, and specialties..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#FF5A36] outline-none resize-none"
                />
              </div>

              {/* Verified Badge Checkbox */}
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                    <BadgeCheck className="w-4 h-4 text-blue-600" />
                    <span>Verified Merchant Badge</span>
                  </div>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    Displays official blue checkmark badge across store cards and listings.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formState.isVerifiedMerchant}
                  onChange={(e) =>
                    setFormState({ ...formState, isVerifiedMerchant: e.target.checked })
                  }
                  className="w-5 h-5 accent-[#FF5A36] cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setIsAddModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{isEditModalOpen ? 'Save Changes' : 'Register Store'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STORE PRODUCTS CATALOG MANAGER DRAWER                         */}
      {/* ------------------------------------------------------------- */}
      {selectedStoreForProducts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="absolute inset-0" onClick={() => setSelectedStoreForProducts(null)} />

          <div className="relative bg-white rounded-3xl max-w-3xl w-full border border-gray-200 shadow-2xl overflow-hidden my-6 z-10 max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    {selectedStoreForProducts.storeName} — Products Catalog
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    {selectedStoreForProducts.products?.length || 0} active items in shopping cart
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white text-purple-900 hover:bg-purple-50 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStoreForProducts(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
              {!selectedStoreForProducts.products || selectedStoreForProducts.products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="font-bold text-sm text-gray-700">No products added yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click &quot;Add Product&quot; above to list items available for WhatsApp purchase.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {selectedStoreForProducts.products.map((prod) => (
                    <div
                      key={prod.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0 bg-gray-50"
                        />
                        <div className="min-w-0">
                          <h5 className="font-bold text-gray-900 truncate">{prod.name}</h5>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-black text-[#FF5A36]">
                              {formatLKR(prod.price)}
                            </span>
                            {prod.originalPrice && (
                              <span className="line-through text-gray-400 text-[10px]">
                                {formatLKR(prod.originalPrice)}
                              </span>
                            )}
                            {prod.inStock ? (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 rounded font-bold">
                                In Stock
                              </span>
                            ) : (
                              <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 rounded font-bold">
                                Out of Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteProduct(selectedStoreForProducts.id, prod.id)
                        }
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADD NEW PRODUCT MODAL                                         */}
      {/* ------------------------------------------------------------- */}
      {isAddProductOpen && selectedStoreForProducts && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setIsAddProductOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-md w-full border border-gray-200 shadow-2xl overflow-hidden p-5 z-10 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="font-extrabold text-sm text-gray-900">
                Add Product to {selectedStoreForProducts.storeName}
              </h4>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Product Name <span className="text-[#FF5A36]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Wireless Noise-Cancelling Earbuds"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#FF5A36] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Price (LKR) <span className="text-[#FF5A36]">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="e.g. 8500"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#FF5A36] outline-none font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Original Price
                  </label>
                  <input
                    type="number"
                    value={newProduct.originalPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
                    placeholder="e.g. 10000"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#FF5A36] outline-none text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Product Image URL
                </label>
                <input
                  type="url"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#FF5A36] outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Key features, warranty, specs..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#FF5A36] outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-3 py-2 rounded-xl border border-gray-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white font-bold cursor-pointer"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL                                     */}
      {/* ------------------------------------------------------------- */}
      {storeToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setStoreToDelete(null)} />
          <div className="relative bg-white rounded-3xl max-w-sm w-full border border-gray-200 shadow-2xl p-5 z-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-extrabold text-sm text-gray-900">
                Delete &quot;{storeToDelete.storeName}&quot;?
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete this E-Store and all its listed products? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStoreToDelete(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                Yes, Delete Store
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
