import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  MapPin,
  Truck,
  MessageCircle,
  Copy,
  Check,
  X,
  CreditCard,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Store,
  ChevronRight,
  Phone,
  Zap,
} from 'lucide-react';
import { CartItem, CourierSpeed, User } from '../types';
import {
  SRI_LANKA_DISTRICTS,
  calculateCourierFee,
  DEFAULT_FREE_DELIVERY_THRESHOLD,
} from '../utils/courierCalculator';

interface EStoreSmartCartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: (storeId?: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  currentUser: User | null;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export function formatLKR(amount: number): string {
  return 'Rs ' + Number(amount).toLocaleString('en-LK');
}

export const EStoreSmartCart: React.FC<EStoreSmartCartProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  isOpen,
  onClose,
  onOpen,
  currentUser,
  onToast,
}) => {
  // Group cart items by store
  const storeGroups = useMemo(() => {
    const groups: Record<
      string,
      {
        storeId: string;
        storeName: string;
        storeWhatsapp: string;
        storeDistrict: string;
        storeLogo?: string;
        storeIsVerified?: boolean;
        items: CartItem[];
      }
    > = {};

    cartItems.forEach((item) => {
      if (!groups[item.storeId]) {
        groups[item.storeId] = {
          storeId: item.storeId,
          storeName: item.storeName,
          storeWhatsapp: item.storeWhatsapp,
          storeDistrict: item.storeDistrict,
          storeLogo: item.storeLogo,
          storeIsVerified: item.storeIsVerified,
          items: [],
        };
      }
      groups[item.storeId].items.push(item);
    });

    return Object.values(groups);
  }, [cartItems]);

  // Selected store for checkout if multiple stores exist
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  // Default to first store group
  const activeStore = useMemo(() => {
    if (!storeGroups.length) return null;
    if (selectedStoreId) {
      const found = storeGroups.find((g) => g.storeId === selectedStoreId);
      if (found) return found;
    }
    return storeGroups[0];
  }, [storeGroups, selectedStoreId]);

  // Active store items
  const activeItems = useMemo(() => {
    return activeStore?.items || [];
  }, [activeStore]);

  // Checkout form state
  const [deliveryDistrict, setDeliveryDistrict] = useState<string>('Colombo');
  const [deliveryCity, setDeliveryCity] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>(
    currentUser?.fullname || (currentUser as any)?.name || ''
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    currentUser?.phone || ''
  );
  const [customerNote, setCustomerNote] = useState<string>('');
  const [courierSpeed, setCourierSpeed] = useState<CourierSpeed>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank' | 'installments'>('cod');
  const [isCopied, setIsCopied] = useState(false);

  // Totals for active store
  const subtotal = useMemo(() => {
    return activeItems.reduce(
      (sum, item) => sum + (Number(item.product.price) || 0) * item.quantity,
      0
    );
  }, [activeItems]);

  const totalItemCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // Courier calculation
  const courierCalc = useMemo(() => {
    if (!activeStore) {
      return {
        courierFee: 0,
        isFreeDelivery: false,
        freeDeliveryThreshold: DEFAULT_FREE_DELIVERY_THRESHOLD,
        amountNeededForFree: DEFAULT_FREE_DELIVERY_THRESHOLD,
        freeDeliveryProgressPercent: 0,
        tierName: 'Standard Courier',
        estimatedDays: '1-3 Business Days',
        recommendedService: 'Domex / Pronto',
      };
    }
    return calculateCourierFee(
      activeStore.storeDistrict,
      deliveryDistrict,
      subtotal,
      courierSpeed
    );
  }, [activeStore, deliveryDistrict, subtotal, courierSpeed]);

  const grandTotal = subtotal + courierCalc.courierFee;

  // Build structured WhatsApp order message
  const generateWhatsAppMessage = () => {
    if (!activeStore || !activeItems.length) return '';

    const orderRef = `HT-${Math.floor(1000 + Math.random() * 9000)}`;
    const paymentLabel =
      paymentMethod === 'cod'
        ? 'Cash on Delivery (COD) 💵'
        : paymentMethod === 'bank'
        ? 'Direct Bank Transfer 🏦'
        : 'Installment Inquiry (Koko / Mintpay) 💳';

    let msg = `🛒 *HUTA E-STORE MULTI-ITEM ORDER #${orderRef}*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏪 *Store:* ${activeStore.storeName}\n`;
    msg += `📍 *Store Location:* ${activeStore.storeDistrict}\n`;
    msg += `👤 *Customer Name:* ${customerName.trim() || 'Valued Customer'}\n`;
    if (customerPhone.trim()) {
      msg += `📞 *Customer Phone:* ${customerPhone.trim()}\n`;
    }
    msg += `📍 *Delivery District:* ${deliveryDistrict}\n`;
    if (deliveryCity.trim()) {
      msg += `🏙️ *Nearest Town/City:* ${deliveryCity.trim()}\n`;
    }
    if (deliveryAddress.trim()) {
      msg += `🏠 *Delivery Address:* ${deliveryAddress.trim()}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📦 *ORDER ITEMS (${activeItems.length} items / ${activeItems.reduce((a, b) => a + b.quantity, 0)} units):*\n`;

    activeItems.forEach((item, idx) => {
      const lineTotal = item.product.price * item.quantity;
      msg += `${idx + 1}. *${item.product.name}*\n`;
      msg += `   • Qty: ${item.quantity} × ${formatLKR(item.product.price)} = ${formatLKR(lineTotal)}\n`;
      if (item.product.productUrl) {
        msg += `   • Link: ${item.product.productUrl}\n`;
      }
    });

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💵 *Items Subtotal:* ${formatLKR(subtotal)}\n`;
    msg += `🚚 *Courier Delivery:* ${
      courierCalc.isFreeDelivery
        ? 'FREE (Promotional Store Delivery) 🎉'
        : `${formatLKR(courierCalc.courierFee)} (${courierCalc.tierName})`
    }\n`;
    msg += `⏱️ *Estimated Delivery:* ${courierCalc.estimatedDays}\n`;
    msg += `📦 *Packaging & Handling:* FREE (HUTA Verified)\n`;
    msg += `💰 *TOTAL PAYABLE:* ${formatLKR(grandTotal)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💳 *Payment Preference:* ${paymentLabel}\n`;
    if (customerNote.trim()) {
      msg += `📝 *Delivery Instructions:* ${customerNote.trim()}\n`;
    }
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `Hi! I created this multi-item order on HUTA.LK E-Stores. Please confirm product availability, total amount, and dispatch schedule. Thank you!`;

    return msg;
  };

  // Execute WhatsApp send
  const handleSendWhatsApp = () => {
    if (!activeStore) return;

    let cleanPhone = activeStore.storeWhatsapp.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '94' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('94')) {
      cleanPhone = '94' + cleanPhone;
    }

    const message = generateWhatsAppMessage();

    // Copy to clipboard as safety fallback
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message).catch(() => {});
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    onToast('Order slip sent to WhatsApp! Opening conversation...', 'success');
  };

  // Copy order slip to clipboard
  const handleCopyOrder = () => {
    const msg = generateWhatsAppMessage();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      onToast('Order slip copied to clipboard! 📋', 'success');
    }
  };

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* FLOATING SMART CART BAR (Visible when items in cart)          */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {totalItemCount > 0 && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 max-w-md w-[calc(100%-24px)] sm:w-auto"
          >
            <div
              onClick={onOpen}
              className="bg-gray-900/95 dark:bg-[#1A1D2B]/95 backdrop-blur-md text-white rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-gray-800 dark:border-white/10 flex items-center justify-between gap-3 cursor-pointer hover:scale-[1.02] active:scale-98 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 bg-[#FF5A36] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                    {totalItemCount}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-extrabold text-white truncate">
                      {storeGroups.length === 1
                        ? storeGroups[0].storeName
                        : `${storeGroups.length} Stores`}
                    </span>
                    <span className="text-gray-400">·</span>
                    <span className="text-emerald-400 font-black">
                      {formatLKR(
                        cartItems.reduce(
                          (acc, it) => acc + it.product.price * it.quantity,
                          0
                        )
                      )}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-300 dark:text-gray-400 truncate flex items-center gap-1 mt-0.5">
                    <Truck className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>
                      {courierCalc.isFreeDelivery
                        ? 'FREE Islandwide Courier Unlocked! 🎉'
                        : `Courier from Rs 350 • Direct WhatsApp`}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="px-3.5 py-2 rounded-xl bg-emerald-500 group-hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-1.5 shrink-0 shadow-md transition-colors"
              >
                <span>Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* SMART CART & COURIER CALCULATOR DRAWER / MODAL               */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end p-0 sm:p-4 bg-black/80 backdrop-blur-md">
            {/* Backdrop click */}
            <div
              className="absolute inset-0"
              onClick={onClose}
              aria-label="Close modal overlay"
            />

            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative bg-white dark:bg-[#151822] w-full sm:max-w-xl h-full sm:h-[92vh] sm:rounded-3xl border-0 sm:border border-gray-200 dark:border-[#252836] shadow-2xl flex flex-col overflow-hidden z-10"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-black tracking-wider bg-black/25 px-2 py-0.5 rounded-full">
                        Smart Multi-Item Cart
                      </span>
                      <span className="text-[10px] bg-amber-400 text-black px-1.5 py-0.2 rounded font-black flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5 fill-black" />
                        Courier Calc
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight mt-0.5">
                      E-Store WhatsApp Checkout
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors cursor-pointer"
                  title="Close Cart"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Free Courier Milestone Banner */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200/60 dark:border-emerald-800/40 p-3 px-4 shrink-0">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                    <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      {courierCalc.isFreeDelivery
                        ? '🎉 You unlocked 100% FREE Islandwide Delivery!'
                        : `Add ${formatLKR(courierCalc.amountNeededForFree)} more for FREE Courier!`}
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                    {courierCalc.freeDeliveryProgressPercent}%
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-emerald-200/80 dark:bg-emerald-900/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${courierCalc.freeDeliveryProgressPercent}%` }}
                  />
                </div>
              </div>

              {/* Body Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* Multi-Store Selector Tabs (If buyer added items from >1 store) */}
                {storeGroups.length > 1 && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Orders by Merchant ({storeGroups.length} Stores in Cart)
                    </label>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {storeGroups.map((group) => {
                        const isSelected =
                          activeStore?.storeId === group.storeId;
                        const groupTotal = group.items.reduce(
                          (sum, it) => sum + it.product.price * it.quantity,
                          0
                        );
                        return (
                          <button
                            key={group.storeId}
                            type="button"
                            onClick={() => setSelectedStoreId(group.storeId)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-gray-100 dark:bg-[#1E2230] text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                            }`}
                          >
                            <Store className="w-3.5 h-3.5" />
                            <span>{group.storeName}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                                isSelected
                                  ? 'bg-black/25 text-white'
                                  : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {group.items.length} items · {formatLKR(groupTotal)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active Store Info Card */}
                {activeStore ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200/80 dark:border-[#2D303E]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {activeStore.storeLogo ? (
                        <img
                          src={activeStore.storeLogo}
                          alt={activeStore.storeName}
                          className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-black text-sm shrink-0">
                          {activeStore.storeName.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                            {activeStore.storeName}
                          </h4>
                          {activeStore.storeIsVerified && (
                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-[#FF5A36] shrink-0" />
                          <span>Origin: {activeStore.storeDistrict}</span>
                          <span className="text-gray-300 dark:text-gray-600">·</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            Direct Merchant Contact
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onClearCart(activeStore.storeId)}
                      className="text-[11px] font-bold text-gray-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Clear items from this store"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden xs:inline">Clear</span>
                    </button>
                  </div>
                ) : null}

                {/* Empty Cart State */}
                {activeItems.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-[#1E2230] text-gray-400 flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <h4 className="font-extrabold text-base text-gray-900 dark:text-white">
                      Your Shopping Cart is Empty
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                      Explore HUTA E-Stores, discover verified Sri Lankan products, and tap &quot;Add to Cart&quot; to build your WhatsApp order.
                    </p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      Browse E-Store Products
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Items List */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-gray-700 dark:text-gray-300">
                          Cart Items ({activeItems.length})
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Subtotal: {formatLKR(subtotal)}
                        </span>
                      </div>

                      {activeItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-white dark:bg-[#1A1D2B] border border-gray-200 dark:border-[#2D303E] flex items-center justify-between gap-3 shadow-2xs hover:border-emerald-500/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={
                                item.product.image ||
                                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80'
                              }
                              alt={item.product.name}
                              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-100 dark:border-gray-800"
                            />
                            <div className="min-w-0">
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block truncate">
                                {item.product.category || 'Retail Product'}
                              </span>
                              <h5 className="font-bold text-xs text-gray-900 dark:text-white truncate">
                                {item.product.name}
                              </h5>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-black text-gray-900 dark:text-white">
                                  {formatLKR(item.product.price)}
                                </span>
                                {item.quantity > 1 && (
                                  <span className="text-[10px] text-gray-400">
                                    Total: {formatLKR(item.product.price * item.quantity)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quantity & Delete Controls */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#151822] p-1 rounded-xl border border-gray-200 dark:border-[#2D303E]">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateQuantity(item.id, item.quantity - 1)
                                }
                                className="w-6 h-6 rounded-lg bg-white dark:bg-[#1E2230] text-gray-700 dark:text-gray-200 hover:bg-gray-100 flex items-center justify-center font-bold text-xs cursor-pointer shadow-2xs"
                                title="Decrease quantity"
                              >
                                {item.quantity === 1 ? (
                                  <Trash2 className="w-3 h-3 text-rose-500" />
                                ) : (
                                  <Minus className="w-3 h-3" />
                                )}
                              </button>
                              <span className="text-xs font-black px-1.5 min-w-[20px] text-center text-gray-900 dark:text-white">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateQuantity(item.id, item.quantity + 1)
                                }
                                className="w-6 h-6 rounded-lg bg-white dark:bg-[#1E2230] text-gray-700 dark:text-gray-200 hover:bg-gray-100 flex items-center justify-center font-bold text-xs cursor-pointer shadow-2xs"
                                title="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                              title="Remove item"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* --------------------------------------------------------- */}
                    {/* SRI LANKA COURIER FEE CALCULATOR SECTION                  */}
                    {/* --------------------------------------------------------- */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1A1D2B] border border-gray-200/90 dark:border-[#2D303E] space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
                            Islandwide Courier Delivery Calculator
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                          Sri Lanka 25 Districts
                        </span>
                      </div>

                      {/* District & City Selector */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-extrabold text-gray-700 dark:text-gray-300 mb-1">
                            Your Delivery District *
                          </label>
                          <div className="flex items-center gap-1.5 bg-white dark:bg-[#151822] px-3 py-2 rounded-xl border border-gray-200 dark:border-[#2D303E]">
                            <MapPin className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
                            <select
                              value={deliveryDistrict}
                              onChange={(e) => setDeliveryDistrict(e.target.value)}
                              className="bg-transparent border-none outline-none text-xs font-bold text-gray-800 dark:text-white w-full cursor-pointer"
                            >
                              {SRI_LANKA_DISTRICTS.map((dist) => (
                                <option
                                  key={dist}
                                  value={dist}
                                  className="bg-white dark:bg-[#181920] text-gray-900 dark:text-white"
                                >
                                  {dist}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-extrabold text-gray-700 dark:text-gray-300 mb-1">
                            City / Nearest Town *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Maharagama, Kandy Town, Galle Fort"
                            value={deliveryCity}
                            onChange={(e) => setDeliveryCity(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#151822] border border-gray-200 dark:border-[#2D303E] text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Delivery Address */}
                      <div>
                        <label className="block text-[11px] font-extrabold text-gray-700 dark:text-gray-300 mb-1">
                          Delivery Street Address (For courier parcel label)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. No. 45/2, Temple Road, Mount Lavinia"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#151822] border border-gray-200 dark:border-[#2D303E] text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Courier Speed Selector */}
                      <div>
                        <label className="block text-[11px] font-extrabold text-gray-700 dark:text-gray-300 mb-1.5">
                          Delivery Method & Speed
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCourierSpeed('standard')}
                            className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                              courierSpeed === 'standard'
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                                : 'bg-white dark:bg-[#151822] border-gray-200 dark:border-[#2D303E] text-gray-700 dark:text-gray-300 hover:border-gray-300'
                            }`}
                          >
                            <span className="block text-[11px] font-black truncate">
                              Standard
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                              1–3 Days
                            </span>
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                              {courierCalc.isFreeDelivery ? 'FREE' : 'Domex/Pronto'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCourierSpeed('express')}
                            className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                              courierSpeed === 'express'
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                                : 'bg-white dark:bg-[#151822] border-gray-200 dark:border-[#2D303E] text-gray-700 dark:text-gray-300 hover:border-gray-300'
                            }`}
                          >
                            <span className="block text-[11px] font-black truncate">
                              Priority Express
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                              Same/Next Day
                            </span>
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                              Prompt Rider
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCourierSpeed('pickup')}
                            className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                              courierSpeed === 'pickup'
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                                : 'bg-white dark:bg-[#151822] border-gray-200 dark:border-[#2D303E] text-gray-700 dark:text-gray-300 hover:border-gray-300'
                            }`}
                          >
                            <span className="block text-[11px] font-black truncate">
                              Store Pickup
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                              Click & Collect
                            </span>
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                              FREE (Rs 0)
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Courier Rate Breakdown Card */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#151822] border border-gray-200 dark:border-[#2D303E] text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                            Route & Tier:
                          </span>
                          <span className="font-bold text-gray-800 dark:text-gray-200 text-[11px]">
                            {courierCalc.tierName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                            Estimated Timeframe:
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                            {courierCalc.estimatedDays}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400 text-[11px]">
                            Recommended Courier:
                          </span>
                          <span className="text-gray-700 dark:text-gray-300 text-[11px]">
                            {courierCalc.recommendedService}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* --------------------------------------------------------- */}
                    {/* CUSTOMER DETAILS & PAYMENT PREFERENCE                     */}
                    {/* --------------------------------------------------------- */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-extrabold text-gray-700 dark:text-gray-300 mb-1">
                            Your Name (For parcel label)
                          </label>
                          <input
                            type="text"
                            placeholder="Full name for delivery"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-extrabold text-gray-700 dark:text-gray-300 mb-1">
                            Your WhatsApp / Mobile Number
                          </label>
                          <input
                            type="tel"
                            placeholder="e.g. 077 123 4567"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold text-gray-700 dark:text-gray-300 mb-1">
                          Payment Preference
                        </label>
                        <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 dark:bg-[#1E2230] rounded-xl text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('cod')}
                            className={`py-1.5 px-1 rounded-lg transition-all cursor-pointer text-center text-[11px] ${
                              paymentMethod === 'cod'
                                ? 'bg-emerald-600 text-white shadow-xs font-black'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                          >
                            Cash on Delivery
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('bank')}
                            className={`py-1.5 px-1 rounded-lg transition-all cursor-pointer text-center text-[11px] ${
                              paymentMethod === 'bank'
                                ? 'bg-emerald-600 text-white shadow-xs font-black'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                          >
                            Bank Transfer
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('installments')}
                            className={`py-1.5 px-1 rounded-lg transition-all cursor-pointer text-center text-[11px] ${
                              paymentMethod === 'installments'
                                ? 'bg-emerald-600 text-white shadow-xs font-black'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                          >
                            Koko / Mintpay
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold text-gray-700 dark:text-gray-300 mb-1">
                          Order Note / Size / Delivery Instructions
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Size L, Color: Black, or Please call before arriving"
                          value={customerNote}
                          onChange={(e) => setCustomerNote(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1E2230] border border-gray-200 dark:border-[#2D303E] text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* --------------------------------------------------------- */}
                    {/* FINAL PRICE SUMMARY SHEET                                 */}
                    {/* --------------------------------------------------------- */}
                    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#1A1D2B] border border-gray-200 dark:border-[#2D303E] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                        <span>
                          Items Subtotal ({activeItems.reduce((a, b) => a + b.quantity, 0)} units):
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {formatLKR(subtotal)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                        <span>Islandwide Courier Delivery:</span>
                        <span
                          className={`font-black ${
                            courierCalc.isFreeDelivery
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {courierCalc.isFreeDelivery
                            ? 'FREE 🎉'
                            : formatLKR(courierCalc.courierFee)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-[11px]">
                        <span>Secure Packaging & Insurance:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          FREE
                        </span>
                      </div>

                      <div className="border-t border-gray-200 dark:border-gray-800 pt-2 mt-1 flex items-center justify-between font-black text-sm text-gray-900 dark:text-white">
                        <span>Grand Total Payable:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 text-lg">
                          {formatLKR(grandTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Trust guarantee */}
                    <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 pt-1">
                      <span>🔒 Direct merchant contact</span>
                      <span>•</span>
                      <span>⚡ 0% commission fees</span>
                      <span>•</span>
                      <span>💬 Official WhatsApp invoice</span>
                    </div>
                  </>
                )}
              </div>

              {/* Footer Checkout Actions */}
              {activeItems.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-[#252836] bg-gray-50/90 dark:bg-[#181B26]/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyOrder}
                      className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-gray-200 dark:bg-[#222533] hover:bg-gray-300 text-gray-800 dark:text-gray-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy complete order slip"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-gray-500" />
                          <span>Copy Slip</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 active:scale-98 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-current shrink-0" />
                    <span>Send Order to Merchant on WhatsApp ({formatLKR(grandTotal)})</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
