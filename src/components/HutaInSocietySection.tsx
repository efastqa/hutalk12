import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  HeartHandshake,
  HeartPulse,
  GraduationCap,
  AlertTriangle,
  Utensils,
  Accessibility,
  Hammer,
  Users,
  Search,
  Plus,
  X,
  Phone,
  MessageCircle,
  ShieldCheck,
  FileCheck2,
  ImagePlus,
  FileUp,
  MapPin,
  Clock,
  CheckCircle2,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Lock,
  Upload,
} from 'lucide-react';
import {
  SocietyHelpCategory,
  SocietyHelpRequest,
  SocietyHelpStatus,
  SocietyHelpUrgency,
  SocietyProofDocument,
  SocietyProofType,
  SocietyReviewStatus,
  User,
} from '../types';
import { api } from '../services/api';

interface HutaInSocietySectionProps {
  currentUser?: User | null;
  isAdminLoggedIn?: boolean;
  onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onModalOpenChange?: (isOpen: boolean) => void;
}

const SOCIETY_CATEGORIES: Array<'All' | SocietyHelpCategory> = [
  'All',
  'Medical Help',
  'Education Help',
  'Emergency & Disaster Relief',
  'Food & Family Support',
  'Disability & Elder Care',
  'Livelihood & Tools Aid',
  'Other Community Need',
];

const PROOF_TYPES: SocietyProofType[] = [
  'Medical Report / Prescription',
  'Hospital Bill / Estimate',
  'School / University Fee Notice',
  'Grama Niladhari / Official Letter',
  'Utility / Rent Bill',
  'Other Proof Document',
];

const SRI_LANKA_DISTRICTS = [
  'All Sri Lanka',
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

function formatLkr(val?: number): string {
  if (!val || val <= 0) return 'LKR 0';
  return `LKR ${Math.round(val).toLocaleString('en-LK')}`;
}

function formatDateShort(iso?: string): string {
  if (!iso) return 'Recently';
  try {
    return new Date(iso).toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}

function normalizePhoneDigits(phone?: string): string {
  return String(phone || '').replace(/[^0-9]/g, '');
}

function getReviewStatusMeta(reviewStatus?: SocietyReviewStatus, updatedAfterReview?: boolean) {
  if (reviewStatus === 'verified_proof') {
    return {
      label: 'Proof Verified by Admin',
      color: 'text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-500',
    };
  }
  if (reviewStatus === 'approved') {
    return {
      label: 'Reviewed & Approved',
      color: 'text-sky-700 dark:text-sky-400',
      dot: 'bg-sky-500',
    };
  }
  if (reviewStatus === 'rejected') {
    return {
      label: 'Hidden by Admin Review',
      color: 'text-rose-700 dark:text-rose-400',
      dot: 'bg-rose-500',
    };
  }
  return {
    label: updatedAfterReview ? 'Updated · Pending Re-Review' : 'Pending Admin Review',
    color: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  };
}

function getWhatsAppHref(phone?: string, title?: string): string {
  const digits = normalizePhoneDigits(phone);
  let intl = digits;
  if (digits.startsWith('0') && digits.length === 10) {
    intl = '94' + digits.slice(1);
  } else if (digits.length === 9) {
    intl = '94' + digits;
  }
  const text = encodeURIComponent(
    `Hello, I saw your appeal "${title || 'Help Request'}" on HUTA IN Society and would like to help.`
  );
  return `https://wa.me/${intl}?text=${text}`;
}

function getCategoryIcon(category: SocietyHelpCategory) {
  switch (category) {
    case 'Medical Help':
      return HeartPulse;
    case 'Education Help':
      return GraduationCap;
    case 'Emergency & Disaster Relief':
      return AlertTriangle;
    case 'Food & Family Support':
      return Utensils;
    case 'Disability & Elder Care':
      return Accessibility;
    case 'Livelihood & Tools Aid':
      return Hammer;
    default:
      return Users;
  }
}

function getUrgencyMeta(urgency: SocietyHelpUrgency): {
  label: string;
  dotColor: string;
  textColor: string;
} {
  if (urgency === 'critical') {
    return {
      label: 'Critical Need',
      dotColor: 'bg-rose-500',
      textColor: 'text-rose-600 dark:text-rose-400',
    };
  }
  if (urgency === 'urgent') {
    return {
      label: 'Urgent',
      dotColor: 'bg-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
    };
  }
  return {
    label: 'Ongoing Support',
    dotColor: 'bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  };
}

function getStatusLabel(status: SocietyHelpStatus): {
  label: string;
  textColor: string;
} {
  if (status === 'fulfilled') {
    return { label: 'Fulfilled', textColor: 'text-emerald-600 dark:text-emerald-400' };
  }
  if (status === 'partially_helped') {
    return { label: 'Support Receiving', textColor: 'text-sky-600 dark:text-sky-400' };
  }
  return { label: 'Needs Help', textColor: 'text-[#FF5A36]' };
}

async function compressFileToDataUrl(
  file: File,
  maxDim = 1080,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        reject(new Error('Could not read selected file.'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          let w = img.naturalWidth || img.width || maxDim;
          let h = img.naturalHeight || img.height || maxDim;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, w);
          canvas.height = Math.max(1, h);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = () => reject(new Error('Failed to load image file.'));
    reader.readAsDataURL(file);
  });
}

export const HutaInSocietySection: React.FC<HutaInSocietySectionProps> = ({
  currentUser,
  isAdminLoggedIn = false,
  onToast,
  onModalOpenChange,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const [requests, setRequests] = useState<SocietyHelpRequest[]>([]);
  const [liveStatus, setLiveStatus] = useState<'live' | 'reconnecting' | 'offline'>('reconnecting');
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [activeCategory, setActiveCategory] = useState<'All' | SocietyHelpCategory>('All');
  const [districtFilter, setDistrictFilter] = useState<string>('All Sri Lanka');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'fulfilled'>('active');
  const [proofOnly, setProofOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Ownership / cross-device phone unlock state
  const [guestOwnedIds, setGuestOwnedIds] = useState<string[]>(() => api.getGuestSocietyIds());
  const [unlockedEditIds, setUnlockedEditIds] = useState<Record<string, boolean>>({});
  const [phoneUnlockInput, setPhoneUnlockInput] = useState('');
  const [showPhoneUnlockBox, setShowPhoneUnlockBox] = useState(false);

  // Selected detail modal & proof lightbox
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [lightboxState, setLightboxState] = useState<{
    items: Array<{ url: string; title: string; subtitle?: string }>;
    index: number;
  } | null>(null);

  // Create / Update Appeal modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<SocietyHelpRequest | null>(null);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isUploadingProofs, setIsUploadingProofs] = useState(false);

  const [formBeneficiaryName, setFormBeneficiaryName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<SocietyHelpCategory>('Medical Help');
  const [formDistrict, setFormDistrict] = useState('Colombo');
  const [formLocation, setFormLocation] = useState('');
  const [formUrgency, setFormUrgency] = useState<SocietyHelpUrgency>('urgent');
  const [formStatus, setFormStatus] = useState<SocietyHelpStatus>('open');
  const [formNeededAmountLkr, setFormNeededAmountLkr] = useState('');
  const [formNeededItemsSummary, setFormNeededItemsSummary] = useState('');
  const [formStory, setFormStory] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formWhatsappPhone, setFormWhatsappPhone] = useState('');
  const [formBankDetails, setFormBankDetails] = useState('');
  const [formProofNote, setFormProofNote] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formProofs, setFormProofs] = useState<SocietyProofDocument[]>([]);
  const [pendingProofType, setPendingProofType] = useState<SocietyProofType>('Medical Report / Prescription');
  const [pendingProofLabel, setPendingProofLabel] = useState('');

  // Help Offer Form State inside detail modal
  const [offerHelpType, setOfferHelpType] = useState<'funds' | 'supplies' | 'service_volunteer'>('funds');
  const [offerHelperName, setOfferHelperName] = useState(currentUser?.fullname || currentUser?.username || '');
  const [offerHelperPhone, setOfferHelperPhone] = useState(currentUser?.phone || '');
  const [offerHelperDistrict, setOfferHelperDistrict] = useState('Colombo');
  const [offerAmountLkr, setOfferAmountLkr] = useState('');
  const [offerItemsNote, setOfferItemsNote] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const proofInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const anyOpen = Boolean(selectedRequestId || isFormModalOpen || lightboxState);
    if (onModalOpenChange) {
      onModalOpenChange(anyOpen);
    }
  }, [selectedRequestId, isFormModalOpen, lightboxState, onModalOpenChange]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    api
      .getSocietyRequests()
      .then((initial) => {
        if (active && Array.isArray(initial)) {
          setRequests(initial);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) setIsLoading(false);
      });

    const unsub = api.subscribeToSocietyRequests(
      (list) => {
        if (!active) return;
        setRequests(list);
        setIsLoading(false);
      },
      (status) => {
        if (active) setLiveStatus(status);
      }
    );

    return () => {
      active = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!lightboxState) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxState(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxState((prev) =>
          prev ? { ...prev, index: (prev.index + 1) % prev.items.length } : null
        );
      } else if (e.key === 'ArrowLeft') {
        setLightboxState((prev) =>
          prev
            ? { ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length }
            : null
        );
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxState]);

  const canManageRequest = (req: SocietyHelpRequest): boolean => {
    if (isAdminLoggedIn) return true;
    if (unlockedEditIds[req.id]) return true;
    if (currentUser?.id && req.userId && req.userId === currentUser.id) return true;
    if (guestOwnedIds.includes(req.id)) return true;
    return false;
  };

  const selectedRequest = useMemo(
    () => requests.find((r) => r.id === selectedRequestId) || null,
    [requests, selectedRequestId]
  );

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const isVisibleToViewer =
        req.reviewStatus !== 'rejected' || isAdminLoggedIn || canManageRequest(req);
      if (!isVisibleToViewer) return false;
      if (statusFilter === 'active' && req.status === 'fulfilled') return false;
      if (statusFilter === 'fulfilled' && req.status !== 'fulfilled') return false;
      if (activeCategory !== 'All' && req.category !== activeCategory) return false;
      if (districtFilter !== 'All Sri Lanka') {
        const dLow = districtFilter.toLowerCase();
        if (
          req.district.toLowerCase() !== dLow &&
          !req.location.toLowerCase().includes(dLow)
        ) {
          return false;
        }
      }
      if (proofOnly && (!Array.isArray(req.proofs) || req.proofs.length === 0)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = [
          req.title,
          req.beneficiaryName,
          req.category,
          req.district,
          req.location,
          req.story,
          req.neededItemsSummary || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [requests, statusFilter, activeCategory, districtFilter, proofOnly, searchQuery, isAdminLoggedIn, currentUser, guestOwnedIds, unlockedEditIds]);

  const stats = useMemo(() => {
    const publicPool = requests.filter((r) => r.reviewStatus !== 'rejected');
    const activeCount = publicPool.filter((r) => r.status !== 'fulfilled').length;
    const withProofCount = publicPool.filter((r) => Array.isArray(r.proofs) && r.proofs.length > 0).length;
    const totalOffers = publicPool.reduce((sum, r) => sum + (r.offersCount || 0), 0);
    return { activeCount, withProofCount, totalOffers };
  }, [requests]);

  const openCreateModal = (presetCategory: SocietyHelpCategory = 'Medical Help') => {
    setEditingRequest(null);
    setFormBeneficiaryName(currentUser?.fullname || currentUser?.username || '');
    setFormTitle('');
    setFormCategory(presetCategory);
    setFormDistrict('Colombo');
    setFormLocation('');
    setFormUrgency('urgent');
    setFormStatus('open');
    setFormNeededAmountLkr('');
    setFormNeededItemsSummary('');
    setFormStory('');
    setFormContactPhone(currentUser?.phone || '');
    setFormWhatsappPhone(currentUser?.phone || '');
    setFormBankDetails('');
    setFormProofNote('');
    setFormImages([]);
    setFormProofs([]);
    setPendingProofType(
      presetCategory === 'Education Help'
        ? 'School / University Fee Notice'
        : 'Medical Report / Prescription'
    );
    setPendingProofLabel('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (req: SocietyHelpRequest) => {
    setEditingRequest(req);
    setFormBeneficiaryName(req.beneficiaryName || '');
    setFormTitle(req.title || '');
    setFormCategory(req.category || 'Medical Help');
    setFormDistrict(req.district || 'Colombo');
    setFormLocation(req.location || '');
    setFormUrgency(req.urgency || 'urgent');
    setFormStatus(req.status || 'open');
    setFormNeededAmountLkr(req.neededAmountLkr ? String(req.neededAmountLkr) : '');
    setFormNeededItemsSummary(req.neededItemsSummary || '');
    setFormStory(req.story || '');
    setFormContactPhone(req.contactPhone || '');
    setFormWhatsappPhone(req.whatsappPhone || req.contactPhone || '');
    setFormBankDetails(req.bankOrPayDetails || '');
    setFormProofNote(req.proofVerifiedNote || '');
    setFormImages(Array.isArray(req.images) ? [...req.images] : []);
    setFormProofs(Array.isArray(req.proofs) ? [...req.proofs] : []);
    setPendingProofType(
      req.category === 'Education Help'
        ? 'School / University Fee Notice'
        : 'Medical Report / Prescription'
    );
    setPendingProofLabel('');
    setIsFormModalOpen(true);
  };

  const handlePhotoFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (files.length === 0) return;

    const remainingSlots = Math.max(0, 6 - formImages.length);
    if (remainingSlots === 0) {
      onToast?.('Maximum 6 photos allowed per appeal.', 'info');
      return;
    }

    setIsUploadingPhotos(true);
    try {
      const selected = files.slice(0, remainingSlots);
      const uploadedUrls: string[] = [];
      for (const file of selected) {
        const dataUrl = await compressFileToDataUrl(file, 960, 0.72);
        try {
          const uploaded = await api.uploadImage(dataUrl, `society-photo-${Date.now()}.jpg`);
          uploadedUrls.push(uploaded?.url || dataUrl);
        } catch {
          uploadedUrls.push(dataUrl);
        }
      }
      setFormImages((prev) => [...prev, ...uploadedUrls].slice(0, 6));
      onToast?.(`Added ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''}.`, 'success');
    } catch {
      onToast?.('Could not read one or more photos. Please try JPG or PNG files.', 'error');
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const handleProofFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = '';
    if (files.length === 0) return;

    const remainingSlots = Math.max(0, 6 - formProofs.length);
    if (remainingSlots === 0) {
      onToast?.('Maximum 6 proof documents allowed per appeal.', 'info');
      return;
    }

    setIsUploadingProofs(true);
    try {
      const selected = files.slice(0, remainingSlots);
      const addedProofs: SocietyProofDocument[] = [];
      const now = new Date().toISOString();

      for (let i = 0; i < selected.length; i++) {
        const file = selected[i];
        const dataUrl = await compressFileToDataUrl(file, 1120, 0.78);
        let finalUrl = dataUrl;
        try {
          const uploaded = await api.uploadImage(dataUrl, `society-proof-${Date.now()}-${i}.jpg`);
          if (uploaded?.url) finalUrl = uploaded.url;
        } catch {
          // keep compressed data URL fallback
        }

        const customLabel = pendingProofLabel.trim();
        const fallbackFileName = file.name.replace(/\.[^/.]+$/, '').slice(0, 80);
        addedProofs.push({
          id: `proof_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          proofType: pendingProofType,
          label: customLabel || fallbackFileName || pendingProofType,
          imageUrl: finalUrl,
          uploadedAt: now,
        });
      }

      setFormProofs((prev) => [...prev, ...addedProofs].slice(0, 6));
      setPendingProofLabel('');
      onToast?.(
        `Attached ${addedProofs.length} supporting proof document${addedProofs.length > 1 ? 's' : ''}.`,
        'success'
      );
    } catch {
      onToast?.('Could not process proof file. Please select a JPG/PNG image of your document.', 'error');
    } finally {
      setIsUploadingProofs(false);
    }
  };

  const handleSubmitAppealForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBeneficiaryName.trim() || !formTitle.trim() || !formStory.trim() || !formContactPhone.trim()) {
      onToast?.('Please complete beneficiary name, headline, contact phone, and story details.', 'error');
      return;
    }

    setIsSavingForm(true);
    try {
      const neededNum = formNeededAmountLkr.trim() ? Number(formNeededAmountLkr) : undefined;
      if (editingRequest) {
        const updated = await api.updateSocietyRequest(editingRequest, {
          beneficiaryName: formBeneficiaryName.trim(),
          title: formTitle.trim(),
          category: formCategory,
          district: formDistrict,
          location: formLocation.trim() || formDistrict,
          urgency: formUrgency,
          status: formStatus,
          neededAmountLkr: neededNum && neededNum > 0 ? neededNum : null,
          neededItemsSummary: formNeededItemsSummary.trim(),
          story: formStory.trim(),
          contactPhone: formContactPhone.trim(),
          whatsappPhone: formWhatsappPhone.trim() || formContactPhone.trim(),
          bankOrPayDetails: formBankDetails.trim(),
          proofVerifiedNote: formProofNote.trim(),
          images: formImages,
          proofs: formProofs,
        });
        setRequests((prev) => [updated, ...prev.filter((r) => r.id !== updated.id)]);
        setGuestOwnedIds(api.getGuestSocietyIds());
        onToast?.(
          isAdminLoggedIn
            ? 'Society appeal details & proofs updated live!'
            : 'Details & proofs updated live and queued for Admin verification!',
          'success'
        );
      } else {
        const created = await api.createSocietyRequest({
          beneficiaryName: formBeneficiaryName.trim(),
          title: formTitle.trim(),
          category: formCategory,
          district: formDistrict,
          location: formLocation.trim() || formDistrict,
          urgency: formUrgency,
          neededAmountLkr: neededNum && neededNum > 0 ? neededNum : undefined,
          neededItemsSummary: formNeededItemsSummary.trim() || undefined,
          story: formStory.trim(),
          contactPhone: formContactPhone.trim(),
          whatsappPhone: formWhatsappPhone.trim() || formContactPhone.trim(),
          bankOrPayDetails: formBankDetails.trim() || undefined,
          proofVerifiedNote: formProofNote.trim() || undefined,
          images: formImages,
          proofs: formProofs,
          userId: currentUser?.id,
        });
        setRequests((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
        setGuestOwnedIds(api.getGuestSocietyIds());
        onToast?.('Your Society help appeal is live and submitted for Admin review!', 'success');
      }
      setIsFormModalOpen(false);
      setEditingRequest(null);
    } catch (err: any) {
      onToast?.(err?.message || 'Could not save Society appeal.', 'error');
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleSubmitHelpOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    if (!offerHelperName.trim()) {
      onToast?.('Please enter your name or group name to record your offer.', 'error');
      return;
    }

    setIsSubmittingOffer(true);
    try {
      const updated = await api.addSocietyHelpOffer(selectedRequest, {
        helperName: offerHelperName.trim(),
        helperPhone: offerHelperPhone.trim() || undefined,
        helperDistrict: offerHelperDistrict,
        helpType: offerHelpType,
        amountLkr: offerHelpType === 'funds' ? Math.max(0, Number(offerAmountLkr) || 0) : 0,
        itemsNote: offerHelpType !== 'funds' ? offerItemsNote.trim() || undefined : undefined,
        message: offerMessage.trim() || undefined,
      });
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setOfferAmountLkr('');
      setOfferItemsNote('');
      setOfferMessage('');
      onToast?.('Thank you! Your offer to help has been recorded.', 'success');
    } catch (err: any) {
      onToast?.(err?.message || 'Could not save help offer right now.', 'error');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const handleDeleteAppeal = async (reqId: string) => {
    if (!isAdminLoggedIn) {
      onToast?.('Only HUTA Admin can permanently delete Society appeals after review.', 'error');
      return;
    }
    try {
      await api.deleteSocietyRequest(reqId);
      setRequests((prev) => prev.filter((r) => r.id !== reqId));
      if (selectedRequestId === reqId) setSelectedRequestId(null);
      onToast?.('Society appeal permanently deleted by Admin.', 'info');
    } catch (err: any) {
      onToast?.(err?.message || 'Could not remove appeal.', 'error');
    }
  };

  const handleUnlockByPhone = (req: SocietyHelpRequest) => {
    const entered = normalizePhoneDigits(phoneUnlockInput);
    const stored = normalizePhoneDigits(req.contactPhone);
    const storedWa = normalizePhoneDigits(req.whatsappPhone);
    const tailMatch = (a: string, b: string) =>
      a.length >= 4 && b.length >= 4 && (a === b || a.slice(-9) === b.slice(-9));
    if (tailMatch(entered, stored) || tailMatch(entered, storedWa)) {
      setUnlockedEditIds((prev) => ({ ...prev, [req.id]: true }));
      api.addGuestSocietyId(req.id);
      setGuestOwnedIds(api.getGuestSocietyIds());
      setShowPhoneUnlockBox(false);
      setPhoneUnlockInput('');
      onToast?.('Verified! You can now update details, images, and proof documents.', 'success');
      openEditModal(req);
    } else {
      onToast?.('Phone number does not match this appeal’s registered contact number.', 'error');
    }
  };

  const openProofLightbox = (
    req: SocietyHelpRequest,
    startIndex = 0,
    includePhotos = false
  ) => {
    const items: Array<{ url: string; title: string; subtitle?: string }> = [];
    if (includePhotos) {
      (req.images || []).forEach((imgUrl, idx) => {
        items.push({
          url: imgUrl,
          title: `${req.title} — Photo ${idx + 1}`,
          subtitle: `${req.beneficiaryName} · ${req.district}`,
        });
      });
    }
    (req.proofs || []).forEach((proof) => {
      items.push({
        url: proof.imageUrl,
        title: proof.label || proof.proofType,
        subtitle: `${proof.proofType} · Uploaded ${formatDateShort(proof.uploadedAt)}`,
      });
    });
    if (items.length === 0) return;
    setLightboxState({
      items,
      index: Math.max(0, Math.min(startIndex, items.length - 1)),
    });
  };

  return (
    <section
      id="huta-in-society-section"
      aria-labelledby="society-heading"
      className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 mt-6 sm:mt-8"
    >
      <div className="bg-white dark:bg-[#151822] rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xl border border-gray-200/80 dark:border-[#252836] space-y-6">
        {/* Header & Primary Call to Action */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-[#252836]">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200/80 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h2
                id="society-heading"
                className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight"
              >
                Society — Community Help & Proof Hub
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400">
                <span
                  className={`w-2 h-2 rounded-full ${
                    liveStatus === 'live'
                      ? 'bg-emerald-500'
                      : liveStatus === 'reconnecting'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                />
                <span>
                  {liveStatus === 'live'
                    ? 'Live Community Feed'
                    : liveStatus === 'reconnecting'
                    ? 'Syncing'
                    : 'Offline'}
                </span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
              Need medical surgery support, school/university fees, emergency relief, or family assistance?
              Post or update your details with photos and supporting proof documents so Sri Lankans can verify and help directly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              id="society-post-appeal-btn"
              onClick={() => openCreateModal('Medical Help')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-[#FF5A36]/20 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Request Help & Upload Proof</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics & Quick Launch Strip */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
          <div className="md:col-span-5 grid grid-cols-3 gap-2.5">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200/80 dark:border-[#2A2F42]">
              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Open Appeals</div>
              <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5 tabular-nums">
                {stats.activeCount}
              </div>
            </div>
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200/80 dark:border-[#2A2F42]">
              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">With Proof Docs</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                {stats.withProofCount}
              </div>
            </div>
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200/80 dark:border-[#2A2F42]">
              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Help Offers</div>
              <div className="text-xl sm:text-2xl font-black text-[#FF5A36] mt-0.5 tabular-nums">
                {stats.totalOffers}
              </div>
            </div>
          </div>

          <div className="md:col-span-7 p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200/80 dark:border-[#2A2F42] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Quick Start by Need Type (Add Photos + Proof)</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Attach prescriptions, hospital estimates, school fee letters, or Grama Niladhari letters anytime.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => openCreateModal('Medical Help')}
                className="px-3 py-2 min-h-[38px] rounded-xl bg-white dark:bg-[#151822] border border-gray-200 dark:border-[#2A2F42] hover:border-rose-400 text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                + Medical Help
              </button>
              <button
                type="button"
                onClick={() => openCreateModal('Education Help')}
                className="px-3 py-2 min-h-[38px] rounded-xl bg-white dark:bg-[#151822] border border-gray-200 dark:border-[#2A2F42] hover:border-indigo-400 text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                + Education Help
              </button>
              <button
                type="button"
                onClick={() => openCreateModal('Food & Family Support')}
                className="px-3 py-2 min-h-[38px] rounded-xl bg-white dark:bg-[#151822] border border-gray-200 dark:border-[#2A2F42] hover:border-amber-400 text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                + Family Relief
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs & Search / District Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SOCIETY_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#0A2540] dark:bg-white text-white dark:text-gray-900 shadow-sm'
                      : 'bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-[#262B3D]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
            <div className="lg:col-span-5 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by condition, school, town, name, or items needed..."
                className="w-full pl-10 pr-8 py-2.5 min-h-[42px] rounded-xl bg-gray-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-[#FF5A36] outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="lg:col-span-3">
              <select
                aria-label="Filter by Sri Lanka district"
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[42px] rounded-xl bg-gray-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
              >
                {SRI_LANKA_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist} className="bg-white dark:bg-[#181920]">
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                aria-label="Filter by appeal status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'active' | 'all' | 'fulfilled')}
                className="w-full px-3 py-2.5 min-h-[42px] rounded-xl bg-gray-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-[#FF5A36]"
              >
                <option value="active" className="bg-white dark:bg-[#181920]">Open Appeals</option>
                <option value="all" className="bg-white dark:bg-[#181920]">All Appeals</option>
                <option value="fulfilled" className="bg-white dark:bg-[#181920]">Fulfilled</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <button
                type="button"
                onClick={() => setProofOnly((prev) => !prev)}
                className={`w-full px-3 py-2.5 min-h-[42px] rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  proofOnly
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-gray-50 dark:bg-[#1B1F2E] border-gray-200 dark:border-[#2A2F42] text-gray-700 dark:text-gray-300 hover:border-emerald-500'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                <span>With Proof Only</span>
              </button>
            </div>
          </div>
        </div>

        {/* Appeals Feed Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-72 rounded-2xl bg-gray-100 dark:bg-[#1B1F2E] animate-pulse border border-gray-200/60 dark:border-[#252836]"
              />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 dark:bg-[#11141D] border border-dashed border-gray-300 dark:border-[#2A2F42] p-8 sm:p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100/80 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                {requests.length === 0
                  ? 'No Community Appeals Posted Yet'
                  : 'No Appeals Match Current Filters'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {requests.length === 0
                  ? 'If you or someone you know needs medical help, school fees, or urgent family support, submit details with photos and proof documents to receive community aid.'
                  : 'Try clearing your search or category filters to view more community help requests.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {requests.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('All');
                    setDistrictFilter('All Sri Lanka');
                    setStatusFilter('active');
                    setProofOnly(false);
                    setSearchQuery('');
                  }}
                  className="px-4 py-2.5 min-h-[42px] rounded-xl bg-white dark:bg-[#1B1F2E] border border-gray-300 dark:border-[#2A2F42] text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
              <button
                type="button"
                onClick={() => openCreateModal('Medical Help')}
                className="px-4 py-2.5 min-h-[42px] rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Post Help Appeal with Proof</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredRequests.map((req) => {
              const CatIcon = getCategoryIcon(req.category);
              const urgencyMeta = getUrgencyMeta(req.urgency);
              const statusMeta = getStatusLabel(req.status);
              const coverImg = req.images?.[0] || req.proofs?.[0]?.imageUrl || '';
              const proofsCount = Array.isArray(req.proofs) ? req.proofs.length : 0;
              const photosCount = Array.isArray(req.images) ? req.images.length : 0;
              const hasTarget = Boolean(req.neededAmountLkr && req.neededAmountLkr > 0);
              const progressPct = hasTarget
                ? Math.min(100, Math.round(((req.receivedAmountLkr || 0) / (req.neededAmountLkr || 1)) * 100))
                : 0;
              const isOwnerOrAdmin = canManageRequest(req);

              return (
                <article
                  key={req.id}
                  className="bg-white dark:bg-[#1B1F2E] rounded-2xl border border-gray-200/90 dark:border-[#2A2F42] hover:border-[#FF5A36]/50 transition-all shadow-sm hover:shadow-lg flex flex-col overflow-hidden"
                >
                  {/* Visual Cover Thumbnail */}
                  <div
                    onClick={() => setSelectedRequestId(req.id)}
                    className="relative aspect-[16/10] bg-slate-100 dark:bg-[#11141D] overflow-hidden cursor-pointer group"
                  >
                    {coverImg ? (
                      <img
                        src={coverImg}
                        alt={req.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-2 p-4">
                        <CatIcon className="w-9 h-9 text-[#FF5A36]/75" />
                        <span className="text-xs font-semibold text-center">{req.category}</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none" />
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 text-[11px] font-bold text-white">
                      <span className="truncate flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
                        <span className="truncate">{req.district}</span>
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {photosCount} photo{photosCount === 1 ? '' : 's'} · {proofsCount} proof{proofsCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div className="space-y-2">
                      {/* Clean zero-pill metadata line */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
                        <span className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-200">
                          <CatIcon className="w-3.5 h-3.5 text-[#FF5A36] shrink-0" />
                          <span>{req.category}</span>
                        </span>
                        <span className={`inline-flex items-center gap-1.5 ${urgencyMeta.textColor}`}>
                          <span className={`w-2 h-2 rounded-full ${urgencyMeta.dotColor}`} />
                          <span>{urgencyMeta.label}</span>
                        </span>
                      </div>

                      <h3
                        onClick={() => setSelectedRequestId(req.id)}
                        className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white leading-snug line-clamp-2 cursor-pointer hover:text-[#FF5A36] transition-colors"
                      >
                        {req.title}
                      </h3>

                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between gap-2">
                        <span className="truncate font-semibold text-gray-700 dark:text-gray-300">
                          For: {req.beneficiaryName}
                        </span>
                        <span className={`shrink-0 font-bold ${statusMeta.textColor}`}>
                          {statusMeta.label}
                        </span>
                      </div>

                      {(() => {
                        const reviewMeta = getReviewStatusMeta(req.reviewStatus, req.updatedAfterReview);
                        return (
                          <div className={`text-[11px] font-bold flex items-center gap-1.5 ${reviewMeta.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${reviewMeta.dot}`} />
                            <span>{reviewMeta.label}</span>
                          </div>
                        );
                      })()}

                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {req.story}
                      </p>

                      {/* Proof Indicator Bar */}
                      {proofsCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => openProofLightbox(req, 0, false)}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-2 hover:bg-emerald-100/70 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-1.5 truncate">
                            <FileCheck2 className="w-4 h-4 shrink-0" />
                            <span className="truncate">
                              {proofsCount} Proof Document{proofsCount > 1 ? 's' : ''} Attached
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1 shrink-0 underline">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </span>
                        </button>
                      ) : (
                        <div className="py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-[#151822] border border-gray-200/70 dark:border-[#2A2F42] text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                          No proof images attached yet — requester can update anytime
                        </div>
                      )}

                      {/* Progress Bar (if target LKR provided) */}
                      {hasTarget && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-gray-800 dark:text-gray-200 tabular-nums">
                              Pledged: {formatLkr(req.receivedAmountLkr)}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 tabular-nums">
                              Goal: {formatLkr(req.neededAmountLkr)}
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-[#151822] overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Footer */}
                    <div className="pt-2.5 border-t border-gray-100 dark:border-[#2A2F42] space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRequestId(req.id)}
                          className="flex-1 py-2.5 px-3 min-h-[42px] rounded-xl bg-[#0A2540] hover:bg-[#13355B] dark:bg-[#FF5A36] dark:hover:bg-[#E04826] text-white text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          View Details & Help ({req.offersCount || 0})
                        </button>
                        <a
                          href={getWhatsAppHref(req.whatsappPhone || req.contactPhone, req.title)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`WhatsApp ${req.beneficiaryName}`}
                          className="p-2.5 min-h-[42px] min-w-[42px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors"
                          title="Contact via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </div>

                      {(isOwnerOrAdmin || isAdminLoggedIn) && (
                        <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(req)}
                            className="inline-flex items-center gap-1.5 font-bold text-[#FF5A36] hover:underline cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Update Details / Proof</span>
                          </button>
                          {isAdminLoggedIn ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteAppeal(req.id)}
                              className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Admin Delete</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 inline-flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Admin moderated</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Appeal Detail + Proof Gallery + Offer Help Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setSelectedRequestId(null);
              setShowPhoneUnlockBox(false);
            }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
          >
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#151822] border border-gray-200 dark:border-[#2A2F42] rounded-t-3xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl"
            >
              {/* Top Modal Bar */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                    <span className="text-[#FF5A36]">{selectedRequest.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedRequest.district}</span>
                    {selectedRequest.location && selectedRequest.location !== selectedRequest.district && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{selectedRequest.location}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>Posted {formatDateShort(selectedRequest.createdAt)}</span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white leading-tight">
                    {selectedRequest.title}
                  </h2>
                  <div className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Beneficiary / Patient / Student: <span className="font-black text-gray-900 dark:text-white">{selectedRequest.beneficiaryName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isAdminLoggedIn && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAppeal(selectedRequest.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[42px] rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Admin Delete</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRequestId(null);
                      setShowPhoneUnlockBox(false);
                    }}
                    aria-label="Close details"
                    className="p-2.5 min-h-[42px] min-w-[42px] rounded-xl bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Admin Review Status Banner */}
              {(() => {
                const reviewMeta = getReviewStatusMeta(selectedRequest.reviewStatus, selectedRequest.updatedAfterReview);
                return (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] flex flex-col gap-1 text-xs">
                    <div className={`font-extrabold flex items-center gap-2 ${reviewMeta.color}`}>
                      <span className={`w-2 h-2 rounded-full ${reviewMeta.dot}`} />
                      <span>{reviewMeta.label}</span>
                    </div>
                    {selectedRequest.adminReviewNote && (
                      <div className="text-gray-600 dark:text-gray-300">
                        Admin Note: {selectedRequest.adminReviewNote}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Requester Self-Update Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {canManageRequest(selectedRequest) ? (
                  <>
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Need to add new hospital bills, prescriptions, photos, or update progress?
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const reqToEdit = selectedRequest;
                        setSelectedRequestId(null);
                        openEditModal(reqToEdit);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-extrabold cursor-pointer whitespace-nowrap"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Update Details, Images & Proof</span>
                    </button>
                  </>
                ) : (
                  <div className="w-full space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-gray-600 dark:text-gray-300 font-medium flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                        <span>Posted this appeal from another device?</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPhoneUnlockBox((v) => !v)}
                        className="text-xs font-bold text-[#FF5A36] hover:underline cursor-pointer"
                      >
                        {showPhoneUnlockBox ? 'Cancel' : 'Verify Phone to Update Details & Proof'}
                      </button>
                    </div>
                    {showPhoneUnlockBox && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="tel"
                          value={phoneUnlockInput}
                          onChange={(e) => setPhoneUnlockInput(e.target.value)}
                          placeholder="Enter contact phone number used when posting"
                          className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#151822] border border-gray-200 dark:border-[#2A2F42] text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleUnlockByPhone(selectedRequest)}
                          className="px-3.5 py-2 rounded-xl bg-[#0A2540] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                        >
                          Unlock Edit
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Case Photos Gallery */}
              {selectedRequest.images && selectedRequest.images.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Situation Photos ({selectedRequest.images.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {selectedRequest.images.map((imgUrl, idx) => (
                      <button
                        key={`${imgUrl}-${idx}`}
                        type="button"
                        onClick={() => openProofLightbox(selectedRequest, idx, true)}
                        className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 dark:border-[#2A2F42] group cursor-pointer"
                      >
                        <img
                          src={imgUrl}
                          alt={`Case photo ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Supporting Proof Documents Gallery */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/25">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>
                      Supporting Proof Documents ({selectedRequest.proofs?.length || 0})
                    </span>
                  </h3>
                  {selectedRequest.proofs && selectedRequest.proofs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => openProofLightbox(selectedRequest, 0, false)}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                    >
                      Open Full-Screen Viewer
                    </button>
                  )}
                </div>

                {selectedRequest.proofVerifiedNote && (
                  <p className="text-xs text-emerald-800/90 dark:text-emerald-200/90 leading-relaxed">
                    Verification Note: {selectedRequest.proofVerifiedNote}
                  </p>
                )}

                {selectedRequest.proofs && selectedRequest.proofs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedRequest.proofs.map((proof, idx) => (
                      <button
                        key={proof.id}
                        type="button"
                        onClick={() => openProofLightbox(selectedRequest, idx, false)}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-[#151822] border border-emerald-200 dark:border-emerald-500/25 hover:border-emerald-500 text-left transition-colors cursor-pointer group"
                      >
                        <img
                          src={proof.imageUrl}
                          alt={proof.label}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-[#2A2F42] shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 truncate">
                            {proof.proofType}
                          </div>
                          <div className="text-xs font-extrabold text-gray-900 dark:text-white truncate group-hover:text-emerald-600">
                            {proof.label}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            Click to zoom proof image
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    No proof documents attached yet. We recommend requesting or verifying prescriptions/letters directly with the contact below before contributing.
                  </p>
                )}
              </div>

              {/* Story & Needed Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Full Details & Needed Support
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                  {selectedRequest.story}
                </p>

                {selectedRequest.neededItemsSummary && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200/80 dark:border-[#2A2F42] text-xs space-y-1">
                    <span className="font-bold text-gray-900 dark:text-white block">
                      Specific Items / Medicines / Books Needed:
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {selectedRequest.neededItemsSummary}
                    </span>
                  </div>
                )}

                {selectedRequest.neededAmountLkr && selectedRequest.neededAmountLkr > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200/80 dark:border-[#2A2F42] space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-900 dark:text-white">
                        Pledged so far: {formatLkr(selectedRequest.receivedAmountLkr)}
                      </span>
                      <span className="text-[#FF5A36]">
                        Target Goal: {formatLkr(selectedRequest.neededAmountLkr)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-[#151822] overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((selectedRequest.receivedAmountLkr || 0) /
                                (selectedRequest.neededAmountLkr || 1)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Contact & Payment Info */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] space-y-3">
                <div className="text-xs font-extrabold text-gray-900 dark:text-white">
                  Direct Contact & Account Details
                </div>
                {selectedRequest.bankOrPayDetails && (
                  <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {selectedRequest.bankOrPayDetails}
                  </p>
                )}
                <div className="flex flex-wrap gap-2.5">
                  <a
                    href={`tel:${selectedRequest.contactPhone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call {selectedRequest.contactPhone}</span>
                  </a>
                  <a
                    href={getWhatsAppHref(selectedRequest.whatsappPhone || selectedRequest.contactPhone, selectedRequest.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Message on WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Record Support Offer Form */}
              <form
                onSubmit={handleSubmitHelpOffer}
                className="pt-4 border-t border-gray-200 dark:border-[#2A2F42] space-y-3"
              >
                <h3 className="text-sm font-black text-gray-900 dark:text-white">
                  Offer Help Directly
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'funds', label: 'Financial Aid (LKR)' },
                      { id: 'supplies', label: 'Medicines / Books / Rations' },
                      { id: 'service_volunteer', label: 'Service / Volunteer' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setOfferHelpType(opt.id)}
                      className={`px-2.5 py-2.5 min-h-[40px] rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        offerHelpType === opt.id
                          ? 'bg-[#FF5A36] border-[#FF5A36] text-white'
                          : 'bg-slate-50 dark:bg-[#1B1F2E] border-gray-200 dark:border-[#2A2F42] text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    required
                    value={offerHelperName}
                    onChange={(e) => setOfferHelperName(e.target.value)}
                    placeholder="Your Name / Organization *"
                    className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-xs sm:text-sm"
                  />
                  <input
                    type="tel"
                    value={offerHelperPhone}
                    onChange={(e) => setOfferHelperPhone(e.target.value)}
                    placeholder="Phone (Optional)"
                    className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-xs sm:text-sm"
                  />
                  <select
                    value={offerHelperDistrict}
                    onChange={(e) => setOfferHelperDistrict(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-xs sm:text-sm"
                  >
                    {SRI_LANKA_DISTRICTS.filter((d) => d !== 'All Sri Lanka').map((d) => (
                      <option key={d} value={d} className="bg-white dark:bg-[#181920]">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {offerHelpType === 'funds' ? (
                  <input
                    type="number"
                    min={100}
                    required
                    value={offerAmountLkr}
                    onChange={(e) => setOfferAmountLkr(e.target.value)}
                    placeholder="Amount you are contributing / pledging in LKR *"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-xs sm:text-sm"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    value={offerItemsNote}
                    onChange={(e) => setOfferItemsNote(e.target.value)}
                    placeholder={
                      offerHelpType === 'supplies'
                        ? 'List medicines, school books, or food items you can provide *'
                        : 'Describe how you can help (e.g. transport, tuition, medical checkup) *'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-xs sm:text-sm"
                  />
                )}

                <textarea
                  rows={2}
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="Optional encouragement or coordination note..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-xs sm:text-sm"
                />

                <button
                  type="submit"
                  disabled={isSubmittingOffer}
                  className="w-full py-3 px-4 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-extrabold transition-colors cursor-pointer"
                >
                  {isSubmittingOffer ? 'Recording Offer...' : 'Record Help Offer'}
                </button>
              </form>

              {/* Recent Offers */}
              {selectedRequest.offers && selectedRequest.offers.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-[#2A2F42] space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    Community Support Offers ({selectedRequest.offers.length})
                  </h4>
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {selectedRequest.offers.map((offer) => (
                      <div
                        key={offer.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200/70 dark:border-[#2A2F42] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2 font-bold text-gray-900 dark:text-white">
                          <span>
                            {offer.helperName}
                            {offer.helperDistrict ? ` · ${offer.helperDistrict}` : ''}
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {offer.helpType === 'funds' && offer.amountLkr
                              ? formatLkr(offer.amountLkr)
                              : offer.helpType === 'service_volunteer'
                              ? 'Service / Volunteer'
                              : 'Supplies'}
                          </span>
                        </div>
                        {offer.itemsNote && (
                          <div className="text-gray-700 dark:text-gray-200">{offer.itemsNote}</div>
                        )}
                        {offer.message && (
                          <div className="text-gray-500 dark:text-gray-400">{offer.message}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create / Update Society Appeal Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFormModalOpen(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
          >
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#151822] border border-gray-200 dark:border-[#2A2F42] rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                    {editingRequest
                      ? 'Update Society Appeal Details & Proof'
                      : 'Submit Society Help Appeal with Proof'}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Share clear details, photos, and supporting proof documents (hospital prescriptions, fee letters, GN letters) so donors can trust and help quickly.
                  </p>
                  {editingRequest && !isAdminLoggedIn && (
                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-1.5">
                      Transparency policy: Requesters can update details, add proof documents, or mark this appeal Fulfilled anytime. Only HUTA Admin can permanently delete appeals after review, and any edited details/proofs are queued for Admin re-review.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  aria-label="Close modal"
                  className="p-2.5 min-h-[42px] min-w-[42px] rounded-xl bg-gray-100 dark:bg-[#1E2230] text-gray-600 dark:text-gray-300 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitAppealForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Patient / Student / Family Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formBeneficiaryName}
                      onChange={(e) => setFormBeneficiaryName(e.target.value)}
                      placeholder="e.g. Nimal Perera / Grade 11 Student"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Help Category *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as SocietyHelpCategory)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-sm"
                    >
                      {SOCIETY_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                        <option key={cat} value={cat} className="bg-white dark:bg-[#181920]">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Appeal Headline *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Urgent Kidney Surgery Support / University Tuition Fee Help"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">District *</label>
                    <select
                      value={formDistrict}
                      onChange={(e) => setFormDistrict(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-sm"
                    >
                      {SRI_LANKA_DISTRICTS.filter((d) => d !== 'All Sri Lanka').map((d) => (
                        <option key={d} value={d} className="bg-white dark:bg-[#181920]">
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Town / Village</label>
                    <input
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="e.g. Maharagama / Peradeniya"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Urgency *</label>
                    <select
                      value={formUrgency}
                      onChange={(e) => setFormUrgency(e.target.value as SocietyHelpUrgency)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-sm"
                    >
                      <option value="critical" className="bg-white dark:bg-[#181920]">Critical Need</option>
                      <option value="urgent" className="bg-white dark:bg-[#181920]">Urgent</option>
                      <option value="ongoing" className="bg-white dark:bg-[#181920]">Ongoing Support</option>
                    </select>
                  </div>
                </div>

                {editingRequest && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Appeal Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as SocietyHelpStatus)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-sm"
                    >
                      <option value="open" className="bg-white dark:bg-[#181920]">Open (Needs Help)</option>
                      <option value="partially_helped" className="bg-white dark:bg-[#181920]">Support Receiving (Partially Helped)</option>
                      <option value="fulfilled" className="bg-white dark:bg-[#181920]">Fulfilled / Goal Reached</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formContactPhone}
                      onChange={(e) => setFormContactPhone(e.target.value)}
                      placeholder="07X XXX XXXX"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={formWhatsappPhone}
                      onChange={(e) => setFormWhatsappPhone(e.target.value)}
                      placeholder="Same as contact phone if blank"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Estimated Needed Amount (LKR, Optional)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formNeededAmountLkr}
                      onChange={(e) => setFormNeededAmountLkr(e.target.value)}
                      placeholder="e.g. 150000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Needed Items / Medicines / Books (Optional)
                    </label>
                    <input
                      type="text"
                      value={formNeededItemsSummary}
                      onChange={(e) => setFormNeededItemsSummary(e.target.value)}
                      placeholder="e.g. Wheelchair, Insulin, O/L Textbooks"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Full Details & Situation *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formStory}
                    onChange={(e) => setFormStory(e.target.value)}
                    placeholder="Explain clearly who needs help, medical diagnosis / school situation, and how people can assist..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Bank Account / Direct Support Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formBankDetails}
                    onChange={(e) => setFormBankDetails(e.target.value)}
                    placeholder="e.g. Bank name, branch, account holder & number, or pharmacy/bookshop payment reference"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-sm"
                  />
                </div>

                {/* Case Photos Upload Section */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                        <ImagePlus className="w-4 h-4 text-[#FF5A36]" />
                        <span>Case Photos (Up to 6 images)</span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        Upload photos of patient, family situation, school environment, or needed equipment.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isUploadingPhotos || formImages.length >= 6}
                      onClick={() => photoInputRef.current?.click()}
                      className="px-3.5 py-2 min-h-[38px] rounded-xl bg-[#0A2540] dark:bg-white text-white dark:text-gray-900 text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingPhotos ? 'Uploading...' : 'Add Photos'}</span>
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoFilesSelected}
                      className="hidden"
                    />
                  </div>

                  {formImages.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {formImages.map((imgUrl, idx) => (
                        <div
                          key={`${imgUrl}-${idx}`}
                          className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-[#2A2F42]"
                        >
                          <img
                            src={imgUrl}
                            alt={`Uploaded photo ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormImages((prev) => prev.filter((_, i) => i !== idx))
                            }
                            aria-label="Remove photo"
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/75 text-white hover:bg-rose-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Supporting Proof Documents Upload Section */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 space-y-3">
                  <div>
                    <div className="text-xs font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 shrink-0" />
                      <span>Supporting Proof Documents (Up to 6 proof images)</span>
                    </div>
                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-200/80">
                      Attach prescriptions, diagnosis cards, hospital bills, school/university fee letters, or Grama Niladhari confirmation letters.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <select
                      aria-label="Proof document type"
                      value={pendingProofType}
                      onChange={(e) => setPendingProofType(e.target.value as SocietyProofType)}
                      className="sm:col-span-5 px-3 py-2 rounded-xl bg-white dark:bg-[#151822] border border-emerald-200 dark:border-emerald-500/30 text-xs"
                    >
                      {PROOF_TYPES.map((pt) => (
                        <option key={pt} value={pt} className="bg-white dark:bg-[#181920]">
                          {pt}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={pendingProofLabel}
                      onChange={(e) => setPendingProofLabel(e.target.value)}
                      placeholder="Proof label (e.g. Ward 12 Estimate)"
                      className="sm:col-span-4 px-3 py-2 rounded-xl bg-white dark:bg-[#151822] border border-emerald-200 dark:border-emerald-500/30 text-xs"
                    />
                    <button
                      type="button"
                      disabled={isUploadingProofs || formProofs.length >= 6}
                      onClick={() => proofInputRef.current?.click()}
                      className="sm:col-span-3 px-3 py-2 min-h-[38px] rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <FileUp className="w-3.5 h-3.5 shrink-0" />
                      <span>{isUploadingProofs ? 'Uploading...' : 'Attach Proof'}</span>
                    </button>
                    <input
                      ref={proofInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleProofFilesSelected}
                      className="hidden"
                    />
                  </div>

                  {formProofs.length > 0 && (
                    <div className="space-y-2">
                      {formProofs.map((proof, idx) => (
                        <div
                          key={proof.id}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[#151822] border border-emerald-200/80 dark:border-emerald-500/25"
                        >
                          <img
                            src={proof.imageUrl}
                            alt={proof.label}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-[#2A2F42] shrink-0"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                              {proof.proofType}
                            </div>
                            <input
                              type="text"
                              value={proof.label}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormProofs((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, label: val } : item))
                                );
                              }}
                              className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#1B1F2E] border border-gray-200 dark:border-[#2A2F42] text-xs font-semibold"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFormProofs((prev) => prev.filter((_, i) => i !== idx))
                            }
                            aria-label="Remove proof document"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <input
                    type="text"
                    value={formProofNote}
                    onChange={(e) => setFormProofNote(e.target.value)}
                    placeholder="Optional proof note (e.g. Grama Niladhari division / hospital clinic ref number)"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#151822] border border-emerald-200 dark:border-emerald-500/30 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingForm || isUploadingPhotos || isUploadingProofs}
                  className="w-full py-3 px-4 min-h-[46px] rounded-xl bg-[#FF5A36] hover:bg-[#E04826] disabled:opacity-60 text-white text-sm font-extrabold shadow-lg shadow-[#FF5A36]/20 transition-colors cursor-pointer"
                >
                  {isSavingForm
                    ? 'Saving Appeal...'
                    : editingRequest
                    ? 'Save Updated Details & Proof'
                    : 'Publish Society Help Appeal'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Screen Proof & Photo Lightbox Viewer */}
      <AnimatePresence>
        {lightboxState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxState(null)}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex flex-col justify-between p-4 sm:p-6"
          >
            <div className="flex items-center justify-between gap-4 text-white">
              <div className="min-w-0">
                <div className="text-sm sm:text-base font-black truncate">
                  {lightboxState.items[lightboxState.index]?.title}
                </div>
                {lightboxState.items[lightboxState.index]?.subtitle && (
                  <div className="text-xs text-gray-300 truncate">
                    {lightboxState.items[lightboxState.index]?.subtitle}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxState(null)}
                aria-label="Close proof viewer"
                className="p-2.5 min-h-[44px] min-w-[44px] rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center justify-center relative my-4 min-h-0"
            >
              {lightboxState.items.length > 1 && (
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() =>
                    setLightboxState((prev) =>
                      prev
                        ? {
                            ...prev,
                            index: (prev.index - 1 + prev.items.length) % prev.items.length,
                          }
                        : null
                    )
                  }
                  className="absolute left-1 sm:left-4 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <img
                src={lightboxState.items[lightboxState.index]?.url}
                alt={lightboxState.items[lightboxState.index]?.title}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
              />

              {lightboxState.items.length > 1 && (
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() =>
                    setLightboxState((prev) =>
                      prev ? { ...prev, index: (prev.index + 1) % prev.items.length } : null
                    )
                  }
                  className="absolute right-1 sm:right-4 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="text-center text-xs font-bold text-gray-300">
              {lightboxState.index + 1} / {lightboxState.items.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
