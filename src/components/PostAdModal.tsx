import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Listing, User } from '../types';
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
  Wrench,
  ShieldCheck,
  Plus,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
  Info,
  Images,
  CheckCircle2,
  Check,
  Clock,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  MapPin,
  Tag,
  Phone,
  Layers,
  Eye,
} from 'lucide-react';
import { api } from '../services/api';

const MAX_IMAGES = 8;

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  Vehicles: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
  Electronics: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  Property: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
  Motorcycles: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
  'Home & Garden': 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80',
  Fashion: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
  Services: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  Jobs: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
};

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onerror = () => resolve('');
      reader.onload = (e) => {
        const result = (e.target?.result as string) || '';
        if (!result) return resolve('');
        const img = new Image();
        img.onerror = () => {
          // Safe fallback thumbnail
          resolve(result.length < 400000 ? result : '');
        };
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 800;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = Math.max(1, width);
            canvas.height = Math.max(1, height);
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              return resolve(result.length < 400000 ? result : '');
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.68));
          } catch {
            resolve(result.length < 400000 ? result : '');
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    } catch {
      resolve('');
    }
  });
};

interface PostAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitAd: (data: Partial<Listing>, isEditId?: string) => Promise<Listing | void>;
  editingListing: Listing | null;
  currentUser: User | null;
  isAdminLoggedIn?: boolean;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onSelectListing?: (listing: Listing) => void;
  onOpenMyAds?: () => void;
  initialCategory?: string;
  initialDistrict?: string;
}

const CATEGORIES = [
  'Electronics',
  'Vehicles',
  'Property',
  'Motorcycles',
  'Home & Garden',
  'Fashion',
  'Services',
  'Jobs',
];

const SERVICE_TRADES = [
  'AC Repair & Servicing',
  'Automotive Services & Breakdown',
  'Cleaning Services (Home & Office)',
  'Furniture Moving & Transport',
  'Plumbing & Sanitary Works',
  'Electrician & Electrical Wiring',
  'Pest Control & Extermination',
  'Maintenance Services & Handyman',
  'Events, DJ & Photography',
  'Education, Tuition & Coaching',
  'Fashion, Tailoring & Styling',
  'Health & Wellness',
  'Legal, Financial & Consultancy',
  'Pet Care & Veterinary Services',
  'Painting & Waterproofing',
  'Carpentry & Masonry',
  'IT, Laptop & Phone Repair',
  'Home & Land Services (Plans, Surveying & Deeds)',
  'Gemstones & Jewelry (Testing, Valuation & Lapidary)',
  'Other Professional Services',
];

const SERVICE_AREAS = [
  'Colombo & Greater Suburbs',
  'All Western Province (Colombo, Gampaha, Kalutara)',
  'Kandy & Central Province',
  'Galle & Southern Coastal District',
  'Islandwide (All 25 Districts)',
  'Local District Only',
];

const DISTRICTS = [
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

export const PostAdModal: React.FC<PostAdModalProps> = ({
  isOpen,
  onClose,
  onSubmitAd,
  editingListing,
  currentUser,
  isAdminLoggedIn,
  onToast,
  onSelectListing,
  onOpenMyAds,
  initialCategory,
  initialDistrict,
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [location, setLocation] = useState('Colombo');
  const [price, setPrice] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [isFreeOrContact, setIsFreeOrContact] = useState(false);
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');

  // Multiple Images State
  const [images, setImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');

  // Specialized Service Fields
  const [serviceTrade, setServiceTrade] = useState('AC Repair & Servicing');
  const [pricingType, setPricingType] = useState<'fixed' | 'starting_at' | 'hourly' | 'quote'>('starting_at');
  const [serviceArea, setServiceArea] = useState('Colombo & Greater Suburbs');
  const [isEmergency247, setIsEmergency247] = useState(false);

  // Submission & Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStep, setSubmittingStep] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [submittedResult, setSubmittedResult] = useState<{
    id: string;
    title: string;
    phone: string;
    price: number;
    listing?: Listing;
  } | null>(null);

  // Initialize or reset form on open/edit
  useEffect(() => {
    setSubmittedResult(null);
    setErrors({});

    if (editingListing) {
      setTitle(editingListing.title || '');
      setCategory(editingListing.category || 'Electronics');
      setLocation(editingListing.location || editingListing.district || 'Colombo');
      setPrice(editingListing.price ? editingListing.price.toLocaleString('en-US') : '0');
      setIsNegotiable(Boolean(editingListing.price === 0 || editingListing.pricingType === 'quote'));
      setIsFreeOrContact(editingListing.price === 0);
      setPhone(editingListing.phone || '');
      setDescription(editingListing.description || '');

      // Load multiple images
      const initialImgs: string[] = [];
      if (Array.isArray(editingListing.images) && editingListing.images.length > 0) {
        initialImgs.push(...editingListing.images.filter(Boolean));
      } else if (editingListing.image) {
        initialImgs.push(editingListing.image);
      }
      setImages(initialImgs);
      setUrlInput('');

      setServiceTrade(editingListing.serviceTrade || 'AC Repair & Servicing');
      setPricingType(editingListing.pricingType || (editingListing.category === 'Services' ? 'starting_at' : 'fixed'));
      setServiceArea(editingListing.serviceArea || 'Colombo & Greater Suburbs');
      setIsEmergency247(Boolean(editingListing.isEmergency247));
    } else {
      // New Ad Defaults
      setTitle('');
      setCategory(initialCategory && CATEGORIES.includes(initialCategory) ? initialCategory : 'Electronics');
      setLocation(initialDistrict && DISTRICTS.includes(initialDistrict) ? initialDistrict : 'Colombo');
      setPrice('');
      setIsNegotiable(false);
      setIsFreeOrContact(false);
      setPhone(currentUser?.phone || (isAdminLoggedIn ? '077 752 0765' : ''));
      setDescription('');
      setImages([]);
      setUrlInput('');
      setServiceTrade('AC Repair & Servicing');
      setPricingType('starting_at');
      setServiceArea('Colombo & Greater Suburbs');
      setIsEmergency247(false);
    }
  }, [editingListing, isOpen, initialCategory, initialDistrict, currentUser]);

  if (!isOpen) return null;

  // Format price helper text
  const getPricePreview = () => {
    if (category === 'Services' && pricingType === 'quote') {
      return 'Free Estimate on Request';
    }
    if (isFreeOrContact) {
      return 'Free / Contact for Price';
    }
    const cleanNum = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (isNaN(cleanNum) || cleanNum <= 0) {
      return isNegotiable ? 'Negotiable (Open to reasonable offers)' : '';
    }
    let formatted = '';
    if (cleanNum >= 10000000) {
      formatted = `${(cleanNum / 10000000).toFixed(2).replace(/\.00$/, '')} Crore (Rs ${cleanNum.toLocaleString('en-US')})`;
    } else if (cleanNum >= 100000) {
      formatted = `${(cleanNum / 100000).toFixed(1).replace(/\.0$/, '')} Lakhs (Rs ${cleanNum.toLocaleString('en-US')})`;
    } else {
      formatted = `Rs ${cleanNum.toLocaleString('en-US')}`;
    }
    return isNegotiable ? `${formatted} • Negotiable` : formatted;
  };

  // Multiple File Upload Handler with instant server-backed static URL storage
  const handleMultipleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      onToast(`Maximum of ${MAX_IMAGES} photos allowed per advertisement.`, 'info');
      return;
    }

    const filesToProcess = (Array.from(files) as File[]).slice(0, remainingSlots);
    setIsUploadingImages(true);
    setUploadStatusText(`Preparing ${filesToProcess.length} photo${filesToProcess.length > 1 ? 's' : ''}...`);

    try {
      const newUrls: string[] = [];

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        if (file.size > 15 * 1024 * 1024) {
          onToast(`Skipped "${file.name}" (File exceeds 15MB size limit)`, 'error');
          continue;
        }

        setUploadStatusText(`Compressing photo ${i + 1} of ${filesToProcess.length}...`);
        const compressedBase64 = await compressImage(file);
        if (!compressedBase64) continue;

        // Upload to server static disk storage immediately so client payload stays feather-light
        let finalUrl = compressedBase64;
        try {
          setUploadStatusText(`Saving photo ${i + 1} to storage...`);
          const uploadRes = await api.uploadImage(compressedBase64, `photo-${Date.now()}-${i}.jpg`);
          if (uploadRes?.url) {
            finalUrl = uploadRes.url;
          }
        } catch {
          // If offline or standalone, retain compressed base64
        }

        newUrls.push(finalUrl);
      }

      if (newUrls.length > 0) {
        setImages((prev) => [...prev, ...newUrls].slice(0, MAX_IMAGES));
        onToast(`Added ${newUrls.length} photo${newUrls.length > 1 ? 's' : ''} successfully!`, 'success');
        // Clear any image validation error
        if (errors.images) {
          setErrors((prev) => ({ ...prev, images: '' }));
        }
      }
    } catch (err: unknown) {
      console.error('Image compression error:', err);
      onToast('Could not process some photos. Please try different images.', 'error');
    } finally {
      setIsUploadingImages(false);
      setUploadStatusText('');
      e.target.value = '';
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:')) {
      onToast('Please enter a valid image web link (http:// or https://)', 'error');
      return;
    }

    if (images.length >= MAX_IMAGES) {
      onToast(`Maximum of ${MAX_IMAGES} photos reached.`, 'info');
      return;
    }

    setImages((prev) => [...prev, trimmed]);
    setUrlInput('');
    onToast('Photo link added!', 'success');
    if (errors.images) {
      setErrors((prev) => ({ ...prev, images: '' }));
    }
  };

  const handleAddSampleCategoryCover = () => {
    const sample = CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES['Electronics'];
    if (sample && !images.includes(sample)) {
      setImages((prev) => [sample, ...prev].slice(0, MAX_IMAGES));
      onToast(`Added recommended cover for ${category}!`, 'info');
      if (errors.images) {
        setErrors((prev) => ({ ...prev, images: '' }));
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetCover = (indexToCover: number) => {
    if (indexToCover === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const selected = copy.splice(indexToCover, 1)[0];
      return [selected, ...copy];
    });
    onToast('Main cover photo updated!', 'info');
  };

  const handleMoveImage = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= images.length) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[fromIndex];
      copy[fromIndex] = copy[toIndex];
      copy[toIndex] = temp;
      return copy;
    });
  };

  const handleGenerateAIDescription = async () => {
    if (!title.trim()) {
      setErrors((prev) => ({ ...prev, title: 'Please type an ad title first so AI knows what to write!' }));
      onToast('Please type an ad title first!', 'error');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const cleanNum = parseFloat(price.replace(/[^0-9.]/g, ''));
      const res = await api.suggestDescription({
        title: title.trim(),
        category,
        location,
        price: !isNaN(cleanNum) ? cleanNum : undefined,
      });

      if (res.description) {
        setDescription(res.description);
        setErrors((prev) => ({ ...prev, description: '' }));
        onToast(
          res.source === 'gemini'
            ? '✨ AI description generated with Gemini!'
            : '✨ Smart description drafted!',
          'success'
        );
      }
    } catch {
      onToast('Could not generate description automatically. Please write manually.', 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Form Validation & Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    const isService = category === 'Services';

    // 1. Title Validation
    if (!title.trim()) {
      newErrors.title = 'Please provide an advertisement title.';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long.';
    }

    // 2. Phone Validation
    const cleanPhoneDigits = phone.replace(/[^0-9]/g, '');
    if (!phone.trim()) {
      newErrors.phone = 'Please enter a contact phone or WhatsApp number.';
    } else if (cleanPhoneDigits.length < 8) {
      newErrors.phone = 'Please enter a valid phone number (at least 8-10 digits, e.g. 077 123 4567).';
    }

    // 3. Price Validation
    const cleanPriceStr = price ? String(price).replace(/[^0-9.]/g, '') : '';
    const parsedPrice = parseFloat(cleanPriceStr);

    if (isService) {
      if (pricingType !== 'quote' && !isFreeOrContact && (!cleanPriceStr || isNaN(parsedPrice) || parsedPrice <= 0)) {
        newErrors.price = 'Please enter a starting/hourly rate, or select "Free Estimate / Quote".';
      }
    } else {
      if (!isFreeOrContact && !isNegotiable && (!cleanPriceStr || isNaN(parsedPrice) || parsedPrice <= 0)) {
        newErrors.price = 'Please enter your asking price, or check "Negotiable" / "Free".';
      }
    }

    // 4. Description Validation
    if (!description.trim()) {
      newErrors.description = 'Please write a brief description of what you are offering (or click AI Enhance).';
    } else if (description.trim().length < 3) {
      newErrors.description = 'Description is too short. Please write at least 3 characters.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      onToast('Please fill in the required fields marked in red.', 'error');
      // Scroll to the top of modal
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    setIsSubmitting(true);
    setSubmittingStep('Preparing advertisement...');

    try {
      const fallbackImage = CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES['Electronics'];
      const primaryImage = images.length > 0 ? images[0] : fallbackImage;
      const finalImages = images.length > 0 ? images : [primaryImage];

      let finalPrice = 0;
      if (isService) {
        finalPrice = pricingType === 'quote' ? 0 : (parsedPrice || 0);
      } else {
        finalPrice = isFreeOrContact ? 0 : (parsedPrice || 0);
      }

      setSubmittingStep('Uploading images & saving listing...');

      const payload: Partial<Listing> & { isAdminLoggedIn?: boolean } = {
        title: title.trim(),
        category,
        location,
        district: location,
        price: finalPrice,
        phone: phone.trim(),
        description: description.trim(),
        image: primaryImage,
        images: finalImages,
        videoUrl: editingListing?.videoUrl,
        userId: editingListing ? editingListing.userId : (currentUser ? currentUser.id : 'guest'),
        pricingType: isService ? pricingType : (isNegotiable ? 'negotiable' : 'fixed'),
        ...(isService && serviceTrade ? { serviceTrade } : {}),
        ...(isService && serviceArea ? { serviceArea } : {}),
        ...(isService ? { isEmergency247: Boolean(isEmergency247) } : {}),
        ...(isAdminLoggedIn ? { isAdminLoggedIn: true } : {}),
        ...(editingListing ? {
          status: editingListing.status,
          isFeatured: editingListing.isFeatured,
          isVerifiedPro: editingListing.isVerifiedPro,
        } : {}),
      };

      const created = await onSubmitAd(payload, editingListing ? editingListing.id : undefined);

      if (!editingListing) {
        setSubmittedResult({
          id: (created as Listing)?.id || 'new',
          title: payload.title || 'Your advertisement',
          phone: payload.phone || '',
          price: payload.price || 0,
          listing: (created as Listing) || undefined,
        });
      } else {
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not submit advertisement. Please try again.';
      onToast(msg, 'error');
      setErrors((prev) => ({ ...prev, general: msg }));
    } finally {
      setIsSubmitting(false);
      setSubmittingStep('');
    }
  };

  const isService = category === 'Services';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedResult ? (
          /* Success Screen with Live Status Tracker */
          <div className="py-4 sm:py-6 text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-sm ${
              submittedResult.listing?.status === 'approved'
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-amber-100 text-amber-600'
            }`}>
              {submittedResult.listing?.status === 'approved' ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <Clock className="w-10 h-10 animate-pulse" />
              )}
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 bg-gray-100 text-gray-800">
              <span className={`w-2 h-2 rounded-full ${
                submittedResult.listing?.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
              <span>
                {submittedResult.listing?.status === 'approved'
                  ? 'Status: Published & Live'
                  : 'Status: Pending Admin Review'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {submittedResult.listing?.status === 'approved'
                ? 'Your Advertisement is Live!'
                : 'Ad Submitted Successfully!'}
            </h3>

            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto mt-2 leading-relaxed">
              {submittedResult.listing?.status === 'approved' ? (
                <>Your advertisement is active on Huta.lk. Buyers can now view your listing and contact you directly via phone or WhatsApp.</>
              ) : (
                <>
                  Your ad has been received and is queued for verification. You can preview it right now, edit your details anytime, and track when it is published live.
                </>
              )}
            </p>

            {/* Ad Tracking & Summary Card */}
            <div className="my-5 p-4 bg-gray-50 border border-gray-200/90 rounded-2xl text-left max-w-md mx-auto space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Ad Reference #{submittedResult.id.slice(-6)}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  submittedResult.listing?.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {submittedResult.listing?.status === 'approved' ? 'Live on Site' : 'Pending Verification'}
                </span>
              </div>

              <div>
                <div className="font-bold text-gray-900 text-sm sm:text-base line-clamp-1">{submittedResult.title}</div>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-600">
                  <span className="flex items-center gap-1 font-bold text-[#FF5A36]">
                    <Tag className="w-3.5 h-3.5" />
                    {submittedResult.price > 0 ? `Rs ${submittedResult.price.toLocaleString('en-US')}` : 'Free / Quote'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {submittedResult.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {location}
                  </span>
                </div>
              </div>

              <div className="bg-white/80 p-2.5 rounded-xl border border-gray-200/80 text-[11px] text-gray-600 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-[#FF5A36] shrink-0 mt-0.5" />
                <span>
                  Tip: You can manage and track this advertisement anytime using the <strong>"My Ads"</strong> tab in the top navigation bar.
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
              {submittedResult.listing && onSelectListing && (
                <button
                  type="button"
                  onClick={() => {
                    if (submittedResult.listing && onSelectListing) {
                      onSelectListing(submittedResult.listing);
                    }
                    onClose();
                  }}
                  className="flex-1 bg-[#111217] hover:bg-black text-white text-xs sm:text-sm font-bold py-3 px-3.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-[#FF5A36]" />
                  <span>Preview Advertisement</span>
                </button>
              )}

              {onOpenMyAds && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenMyAds();
                    onClose();
                  }}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 text-xs sm:text-sm font-bold py-3 px-3.5 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-[#FF5A36]" />
                  <span>Track in My Ads</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSubmittedResult(null);
                  setTitle('');
                  setPrice('');
                  setDescription('');
                  setImages([]);
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs sm:text-sm font-bold py-3 px-3.5 rounded-xl transition-all cursor-pointer"
              >
                Post Another Ad
              </button>
            </div>
          </div>
        ) : (
          /* Post Ad Form */
          <>
            <div className="pr-8">
              <span className="text-[11px] font-bold tracking-widest text-[#FF5A36] uppercase bg-[#FF5A36]/10 px-2.5 py-0.5 rounded-full inline-block mb-1">
                {editingListing ? 'Edit Listing' : 'Free Classified Posting'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {editingListing ? 'Update Your Advertisement' : 'Post an Ad in Sri Lanka'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Reach thousands of active buyers across all 25 districts with zero commission.
              </p>
            </div>

            {/* Guest Posting Note */}
            {!currentUser && !editingListing && (
              <div className="mt-3.5 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/90 rounded-2xl p-3 flex items-start gap-2.5 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-[#FF5A36]/15 text-[#FF5A36] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="text-left flex-1 text-xs">
                  <span className="font-bold text-gray-900">Post instantly without an account. </span>
                  <span className="text-gray-600">
                    You can edit your ad anytime from this device, or using your contact phone number.
                  </span>
                </div>
              </div>
            )}

            {/* General Error Banner */}
            {errors.general && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errors.general}</span>
              </div>
            )}

            <form ref={formRef} noValidate onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Ad Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Ad Title <span className="text-[#FF5A36]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                  }}
                  placeholder="e.g. Toyota Vitz 2018 or iPhone 15 Pro Max 256GB or 2BR Apartment in Colombo 3"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                    errors.title
                      ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-300'
                      : 'border-gray-300 focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/20'
                  }`}
                />
                {errors.title ? (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3" />
                    {errors.title}
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Keep it descriptive with brand, model, year or condition for best search discovery.
                  </p>
                )}
              </div>

              {/* Category and District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Category <span className="text-[#FF5A36]">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#FF5A36] outline-none bg-white cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    District / Base City <span className="text-[#FF5A36]">*</span>
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-[#FF5A36] outline-none bg-white cursor-pointer"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specialized Fields for Services */}
              {isService && (
                <div className="p-3.5 sm:p-4 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 rounded-2xl border border-blue-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0A2540] flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-[#FF5A36]" />
                      Professional Service Options
                    </span>
                    <span className="text-[10px] text-blue-700 bg-blue-100/80 font-bold px-2 py-0.5 rounded-md">
                      Service Directory
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Specialized Trade / Profession <span className="text-[#FF5A36]">*</span>
                      </label>
                      <select
                        value={serviceTrade}
                        onChange={(e) => setServiceTrade(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#FF5A36] outline-none bg-white cursor-pointer"
                      >
                        {SERVICE_TRADES.map((trade) => (
                          <option key={trade} value={trade}>
                            {trade}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Service Area Coverage <span className="text-[#FF5A36]">*</span>
                      </label>
                      <select
                        value={serviceArea}
                        onChange={(e) => setServiceArea(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#FF5A36] outline-none bg-white cursor-pointer"
                      >
                        {SERVICE_AREAS.map((area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Pricing Model Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Pricing Model
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { id: 'starting_at', label: 'Starting From' },
                        { id: 'hourly', label: 'Per Hour' },
                        { id: 'fixed', label: 'Fixed Rate' },
                        { id: 'quote', label: 'Free Estimate / Quote' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setPricingType(p.id as any);
                            if (p.id === 'quote') {
                              setPrice('0');
                              setIsFreeOrContact(true);
                            } else {
                              setIsFreeOrContact(false);
                            }
                            if (errors.price) setErrors((prev) => ({ ...prev, price: '' }));
                          }}
                          className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            pricingType === p.id
                              ? 'bg-[#0A2540] text-white shadow-xs'
                              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 24/7 Emergency Service Toggle */}
                  <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none bg-white/70 p-2.5 rounded-xl border border-blue-100">
                    <input
                      type="checkbox"
                      checked={isEmergency247}
                      onChange={(e) => setIsEmergency247(e.target.checked)}
                      className="w-4 h-4 rounded text-[#FF5A36] focus:ring-[#FF5A36] border-gray-300 accent-[#FF5A36]"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-gray-900">⚡ 24/7 Emergency Service</span>
                      <span className="text-gray-500 block text-[10px]">
                        Available for urgent callouts (e.g. vehicle breakdown, plumbing leak, electrician)
                      </span>
                    </div>
                  </label>
                </div>
              )}

              {/* Price and Contact Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Price Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {isService && pricingType === 'quote'
                        ? 'Pricing'
                        : isService && pricingType === 'starting_at'
                        ? 'Starting Rate (LKR)'
                        : isService && pricingType === 'hourly'
                        ? 'Hourly Rate (LKR/hr)'
                        : 'Price (LKR)'}
                    </label>
                    {getPricePreview() && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                        {getPricePreview()}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold text-xs">Rs</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={isService && pricingType === 'quote'}
                      value={isService && pricingType === 'quote' ? 'Free Estimate' : isFreeOrContact ? 'Free / Contact' : price}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (isFreeOrContact) {
                          setIsFreeOrContact(false);
                        }
                        setPrice(raw);
                        if (errors.price) setErrors((prev) => ({ ...prev, price: '' }));
                      }}
                      placeholder="e.g. 45,000 or 1,500,000"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500 ${
                        errors.price
                          ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-300'
                          : 'border-gray-300 focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/20'
                      }`}
                    />
                  </div>

                  {/* Pricing Options Chips */}
                  {!isService && (
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isNegotiable}
                          onChange={(e) => {
                            setIsNegotiable(e.target.checked);
                            if (errors.price) setErrors((prev) => ({ ...prev, price: '' }));
                          }}
                          className="w-3.5 h-3.5 rounded text-[#FF5A36] accent-[#FF5A36]"
                        />
                        <span className="font-semibold text-gray-700 text-[11px]">Negotiable</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isFreeOrContact}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsFreeOrContact(checked);
                            if (checked) {
                              setPrice('0');
                            }
                            if (errors.price) setErrors((prev) => ({ ...prev, price: '' }));
                          }}
                          className="w-3.5 h-3.5 rounded text-[#FF5A36] accent-[#FF5A36]"
                        />
                        <span className="font-semibold text-gray-700 text-[11px]">Contact for Price / Free</span>
                      </label>
                    </div>
                  )}

                  {errors.price && (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3" />
                      {errors.price}
                    </p>
                  )}
                </div>

                {/* Contact Phone Field */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Contact Phone / WhatsApp <span className="text-[#FF5A36]">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    placeholder="e.g. 077 123 4567 or 011 234 5678"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      errors.phone
                        ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-300'
                        : 'border-gray-300 focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/20'
                    }`}
                  />
                  {errors.phone ? (
                    <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone}
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Buyers can call or WhatsApp you directly from this number.
                    </p>
                  )}
                </div>
              </div>

              {/* Multiple Advertisement Photos Manager */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <Images className="w-3.5 h-3.5 text-[#FF5A36]" />
                    <span>Photos ({images.length}/{MAX_IMAGES})</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {images.length === 0 && (
                      <button
                        type="button"
                        onClick={handleAddSampleCategoryCover}
                        className="text-[11px] text-[#FF5A36] hover:underline font-bold cursor-pointer"
                      >
                        + Use {category} Cover Photo
                      </button>
                    )}
                    <span className="text-[11px] text-gray-400 font-medium">
                      First photo is main cover
                    </span>
                  </div>
                </div>

                {/* Upload Buttons & URL Input */}
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <label className="cursor-pointer flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-[#FF5A36] rounded-xl py-2.5 px-4 text-xs font-bold text-gray-700 hover:text-[#FF5A36] transition-colors bg-gray-50 hover:bg-orange-50/50">
                    {isUploadingImages ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#FF5A36]" />
                    ) : (
                      <UploadCloud className="w-4 h-4" />
                    )}
                    <span>
                      {isUploadingImages ? (uploadStatusText || 'Compressing & Adding...') : 'Upload Photos (Multi-Select)'}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={isUploadingImages || images.length >= MAX_IMAGES}
                      onChange={handleMultipleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-1 flex items-center gap-1.5">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddUrl();
                        }
                      }}
                      disabled={images.length >= MAX_IMAGES}
                      placeholder="Or paste photo link (https://...)"
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-[#FF5A36] outline-none disabled:bg-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddUrl()}
                      disabled={!urlInput.trim() || images.length >= MAX_IMAGES}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {/* Thumbnails Grid */}
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-gray-50 p-2.5 rounded-2xl border border-gray-200">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`relative group rounded-xl overflow-hidden aspect-4/3 bg-gray-200 border-2 transition-all ${
                          idx === 0 ? 'border-[#FF5A36] shadow-sm ring-1 ring-[#FF5A36]/30' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES['Electronics'];
                          }}
                        />

                        {/* Cover Photo Badge */}
                        {idx === 0 ? (
                          <div className="absolute top-1.5 left-1.5 bg-[#FF5A36] text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-1 z-10">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>Cover</span>
                          </div>
                        ) : (
                          <div className="absolute top-1.5 left-1.5 bg-black/50 backdrop-blur-xs text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md z-10">
                            #{idx + 1}
                          </div>
                        )}

                        {/* Action Overlay */}
                        <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 text-white z-20">
                          <div className="flex items-center justify-between">
                            {idx > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleSetCover(idx)}
                                className="text-[9px] font-bold bg-white text-gray-900 px-1.5 py-0.5 rounded-md hover:bg-orange-50 hover:text-[#FF5A36] transition-colors cursor-pointer"
                                title="Make this photo the main cover image"
                              >
                                Set Cover
                              </button>
                            ) : (
                              <span className="text-[9px] font-bold text-amber-300">★ Main Cover</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="w-6 h-6 rounded-md bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Reorder Buttons */}
                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveImage(idx, 'left')}
                              className="w-6 h-6 rounded-md bg-black/50 hover:bg-black/80 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center text-white cursor-pointer"
                              title="Move earlier"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-semibold text-gray-200">
                              {idx + 1}/{images.length}
                            </span>
                            <button
                              type="button"
                              disabled={idx === images.length - 1}
                              onClick={() => handleMoveImage(idx, 'right')}
                              className="w-6 h-6 rounded-md bg-black/50 hover:bg-black/80 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center text-white cursor-pointer"
                              title="Move later"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add More Slot if below MAX_IMAGES */}
                    {images.length < MAX_IMAGES && (
                      <label className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-[#FF5A36] rounded-xl flex flex-col items-center justify-center gap-1 aspect-4/3 text-gray-400 hover:text-[#FF5A36] transition-colors bg-white hover:bg-orange-50/30">
                        <Plus className="w-5 h-5" />
                        <span className="text-[11px] font-bold">Add Photo</span>
                        <span className="text-[9px] text-gray-400">({MAX_IMAGES - images.length} left)</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={isUploadingImages}
                          onChange={handleMultipleFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center flex flex-col items-center justify-center gap-1">
                    <p className="text-xs text-gray-500">
                      No photos added yet. Upload up to {MAX_IMAGES} photos of your item (front, angles, condition).
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Ads with clear photos get up to 5x more buyer calls in Sri Lanka.
                    </p>
                  </div>
                )}
              </div>

              {/* Description with AI Assistant */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Description <span className="text-[#FF5A36]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAIDescription}
                    disabled={isGeneratingAI}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#FF5A36] hover:text-[#E04826] bg-[#FF5A36]/10 hover:bg-[#FF5A36]/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Drafting with AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>AI Enhance Description</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                  }}
                  placeholder="Describe condition, specifications, warranty, reason for sale, inspection area, delivery options..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none leading-relaxed transition-all ${
                    errors.description
                      ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-300'
                      : 'border-gray-300 focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/20'
                  }`}
                />
                {errors.description ? (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3 h-3" />
                    {errors.description}
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Clear details on condition, warranty, or inspection reduce repetitive questions.
                  </p>
                )}
              </div>

              {/* Admin Quality & Safety Notice */}
              {!editingListing && (
                <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900">Safety & Community Protection: </span>
                    <span className="text-amber-800">
                      All new advertisements are reviewed by our team to maintain a fraud-free marketplace. You will receive an immediate confirmation once submitted.
                    </span>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingImages}
                  className="w-full bg-[#FF5A36] hover:bg-[#E04826] text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:shadow-[#FF5A36]/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{submittingStep || 'Submitting advertisement...'}</span>
                    </>
                  ) : (
                    <span>
                      {editingListing
                        ? 'Save & Update Advertisement'
                        : 'Submit Advertisement for Admin Approval'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};
