import React, { useState, useRef } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Image as ImageIcon,
  UploadCloud,
  Check,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Loader2,
  Link as LinkIcon,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { PromoSlide, PromoSlidesSettings } from '../types';
import { PromoAdSlider } from './PromoAdSlider';
import { api } from '../services/api';

interface AdminPromoSlidesManagerProps {
  slides?: PromoSlide[];
  settings?: PromoSlidesSettings;
  onUpdateSettings?: (settings: Partial<PromoSlidesSettings>) => Promise<void>;
  onCreateSlide?: (slide: Partial<PromoSlide>) => Promise<void>;
  onUpdateSlide?: (id: string, slide: Partial<PromoSlide>) => Promise<void>;
  onToggleSlide?: (id: string) => Promise<void>;
  onDeleteSlide?: (id: string) => Promise<void>;
  onReorderSlides?: (slides: PromoSlide[]) => Promise<void>;
  onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const compressPromoImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1400;
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
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const AdminPromoSlidesManager: React.FC<AdminPromoSlidesManagerProps> = ({
  slides = [],
  settings = { enabled: true, rotationIntervalSeconds: 5, aspectPreset: 'standard' },
  onUpdateSettings,
  onCreateSlide,
  onUpdateSlide,
  onToggleSlide,
  onDeleteSlide,
  onReorderSlides,
  onToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formShowOverlay, setFormShowOverlay] = useState(false);
  const [formBadge, setFormBadge] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formCtaText, setFormCtaText] = useState('');
  const [formCtaAction, setFormCtaAction] = useState('');
  const [formCustomUrl, setFormCustomUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [slideToDelete, setSlideToDelete] = useState<PromoSlide | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sortedSlides = [...slides].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const activeCount = sortedSlides.filter((s) => s.isActive).length;

  const openAddModal = () => {
    setEditingSlideId(null);
    setFormTitle('');
    setFormImageUrl('');
    setFormShowOverlay(false);
    setFormBadge('');
    setFormSubtitle('');
    setFormCtaText('');
    setFormCtaAction('');
    setFormCustomUrl('');
    setFormIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (slide: PromoSlide) => {
    setEditingSlideId(slide.id);
    setFormTitle(slide.title || '');
    setFormImageUrl(slide.imageUrl || '');
    setFormShowOverlay(Boolean(slide.showTextOverlay));
    setFormBadge(slide.badge || '');
    setFormSubtitle(slide.subtitle || '');
    setFormCtaText(slide.ctaText || '');
    const isExternal =
      slide.ctaAction?.startsWith('http://') || slide.ctaAction?.startsWith('https://');
    setFormCtaAction(isExternal ? 'custom_url' : slide.ctaAction || '');
    setFormCustomUrl(isExternal ? slide.ctaAction || '' : '');
    setFormIsActive(slide.isActive);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setFormError('');
    try {
      const compressed = await compressPromoImage(file);
      try {
        const uploaded = await api.uploadImage(compressed, file.name);
        if (uploaded?.url) {
          setFormImageUrl(uploaded.url);
        } else {
          setFormImageUrl(compressed);
        }
      } catch {
        setFormImageUrl(compressed);
      }
      if (!formTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
        setFormTitle(cleanName || 'Promo Banner');
      }
      if (onToast) onToast('Promo banner image uploaded!', 'success');
    } catch {
      setFormError('Could not process image file. Please try another JPG/PNG/WebP image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formImageUrl.trim()) {
      setFormError('Please upload a promo slide image or enter an image URL.');
      return;
    }

    const resolvedAction =
      formCtaAction === 'custom_url' ? formCustomUrl.trim() : formCtaAction.trim();

    setIsSaving(true);
    setFormError('');
    try {
      const payload: Partial<PromoSlide> = {
        title: formTitle.trim() || 'Promo Banner',
        imageUrl: formImageUrl.trim(),
        showTextOverlay: formShowOverlay,
        badge: formShowOverlay ? formBadge.trim() || undefined : undefined,
        subtitle: formShowOverlay ? formSubtitle.trim() || undefined : undefined,
        ctaText: formShowOverlay ? formCtaText.trim() || undefined : undefined,
        ctaAction: resolvedAction || undefined,
        isActive: formIsActive,
      };

      if (editingSlideId && onUpdateSlide) {
        await onUpdateSlide(editingSlideId, payload);
      } else if (onCreateSlide) {
        await onCreateSlide(payload);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save promo slide';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    if (!onReorderSlides) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sortedSlides.length) return;
    const reordered = [...sortedSlides];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    await onReorderSlides(reordered);
  };

  const handleConfirmDelete = async () => {
    if (!slideToDelete || !onDeleteSlide) return;
    setIsDeleting(true);
    try {
      await onDeleteSlide(slideToDelete.id);
      setSlideToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Settings & Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#FF5A36]">
              <ImageIcon className="w-4 h-4" />
              <span>Admin-Only · Below Explore Our Categories</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Promo Ad Image Slides Manager
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Upload widescreen promotional image slides shown directly below Explore Our Categories. Public visitors can only view slides; only admins can add or edit them.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Promo Image Slide</span>
          </button>
        </div>

        {/* Display Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-gray-100">
          {/* Visibility Toggle */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-gray-900">Homepage Visibility</div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {settings.enabled ? 'Visible below categories' : 'Hidden from visitors'}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings && onUpdateSettings({ enabled: !settings.enabled })
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                settings.enabled
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {settings.enabled ? 'Enabled' : 'Paused'}
            </button>
          </div>

          {/* Auto-Slide Interval */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-gray-900">Auto-Slide Speed</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Seconds per image</div>
            </div>
            <select
              value={settings.rotationIntervalSeconds || 5}
              onChange={(e) =>
                onUpdateSettings &&
                onUpdateSettings({ rotationIntervalSeconds: Number(e.target.value) })
              }
              className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-900 outline-none cursor-pointer"
            >
              <option value={3}>3s (Fast)</option>
              <option value={5}>5s (Balanced)</option>
              <option value={7}>7s (Relaxed)</option>
              <option value={10}>10s (Slow)</option>
            </select>
          </div>

          {/* Aspect Size Preset */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-gray-900">Banner Aspect Height</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Slider proportion</div>
            </div>
            <select
              value={settings.aspectPreset || 'standard'}
              onChange={(e) =>
                onUpdateSettings &&
                onUpdateSettings({
                  aspectPreset: e.target.value as 'compact' | 'standard' | 'wide',
                })
              }
              className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-900 outline-none cursor-pointer"
            >
              <option value="compact">Compact Strip</option>
              <option value="standard">Standard Banner</option>
              <option value="wide">Tall Showcase</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Live Preview */}
      <div className="bg-[#111217] text-white rounded-3xl p-5 sm:p-6 border border-[#2D2F39] shadow-lg space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#FF5A36]" />
            <span>Live Carousel Preview ({activeCount} Active Slides)</span>
          </div>
          <span className="text-xs font-bold text-gray-400 tabular-nums">
            Auto-rotates every {settings.rotationIntervalSeconds || 5}s
          </span>
        </div>

        {activeCount > 0 && settings.enabled ? (
          <PromoAdSlider
            slides={sortedSlides}
            settings={settings}
            isLivePreview={true}
          />
        ) : (
          <div className="py-10 rounded-2xl border border-dashed border-gray-700 text-center space-y-2">
            <ImageIcon className="w-8 h-8 text-gray-500 mx-auto" />
            <p className="text-sm font-bold text-gray-300">
              {!settings.enabled
                ? 'Promo slider is currently paused'
                : 'No active promo slides to preview'}
            </p>
            <p className="text-xs text-gray-500">
              Add and activate a promo slide image to see it live below Explore Our Categories.
            </p>
          </div>
        )}
      </div>

      {/* 3. Managed Promo Slides Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Uploaded Promo Slides ({sortedSlides.length})
            </h3>
            <p className="text-xs text-gray-500">
              Recommended banner dimensions: 1400×420px or 16:5 widescreen JPG/PNG/WebP.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Slide</span>
          </button>
        </div>

        {sortedSlides.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ImageIcon className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-700">No promo ad image slides added yet</p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Upload one or more promotional banners to showcase featured offers, partner brands, or seasonal campaigns directly under Explore Our Categories.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload First Promo Slide</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedSlides.map((slide, idx) => (
              <div
                key={slide.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, -1)}
                      className="p-1 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Move slide up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sortedSlides.length - 1}
                      onClick={() => handleMove(idx, 1)}
                      className="p-1 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title="Move slide down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail Preview */}
                  <div className="w-32 sm:w-44 aspect-[16/6] rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Slide Details */}
                  <div className="min-w-0 space-y-1">
                    <div className="font-bold text-sm text-gray-900 truncate">
                      {slide.title || `Promo Slide #${idx + 1}`}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="tabular-nums font-medium">Slide #{idx + 1}</span>
                      <span aria-hidden="true">·</span>
                      <span>{slide.showTextOverlay ? 'Text Overlay On' : 'Clean Image Only'}</span>
                      {slide.ctaAction && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-gray-700 font-medium truncate max-w-[200px]">
                            <ExternalLink className="w-3 h-3 text-[#FF5A36] shrink-0" />
                            <span className="truncate">{slide.ctaAction}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleSlide && onToggleSlide(slide.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      slide.isActive
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {slide.isActive ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Active Live</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Paused</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(slide)}
                    className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
                    title="Edit slide"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSlideToDelete(slide)}
                    className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                    title="Delete slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Add / Edit Promo Slide Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-gray-100 space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {editingSlideId ? 'Edit Promo Image Slide' : 'Add Promo Image Slide'}
                </h3>
                <p className="text-xs text-gray-500">
                  Displayed directly below Explore Our Categories on the marketplace
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload / Preview */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">
                  Promo Banner Image <span className="text-red-500">*</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileChange}
                />

                {formImageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 aspect-[21/7]">
                    <img
                      src={formImageUrl}
                      alt={formTitle || 'Promo preview'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-gray-900 text-xs font-bold shadow-md cursor-pointer"
                      >
                        Change Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        className="p-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-8 px-4 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#FF5A36] bg-gray-50 hover:bg-orange-50/30 transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-6 h-6 text-[#FF5A36] animate-spin" />
                        <span className="text-xs font-bold text-gray-700">Uploading & optimizing banner...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-7 h-7 text-[#FF5A36]" />
                        <span className="text-xs font-bold text-gray-800">
                          Click to Upload Promo Image (JPG, PNG, WebP)
                        </span>
                        <span className="text-[11px] text-gray-500">
                          Recommended wide aspect ratio (e.g. 1400×420 or 16:5)
                        </span>
                      </>
                    )}
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="Or paste an image URL (https://...)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#FF5A36]"
                  />
                </div>
              </div>

              {/* Slide Title (Admin label / optional overlay) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Slide Name / Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Holiday Homes Launch Offer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold outline-none focus:border-[#FF5A36]"
                />
              </div>

              {/* Click Action / Target */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Click Target (Optional)
                  </label>
                  <select
                    value={formCtaAction}
                    onChange={(e) => setFormCtaAction(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium bg-white outline-none focus:border-[#FF5A36]"
                  >
                    <option value="">No click action (Image display only)</option>
                    <option value="Holiday Homes">Open Holiday Homes Category</option>
                    <option value="Vehicles">Open Vehicles Category</option>
                    <option value="Property">Open Property Category</option>
                    <option value="Phones">Open Phones Category</option>
                    <option value="Services">Open Services Category</option>
                    <option value="estore">Open E-Store Marketplace</option>
                    <option value="post_ad">Open Post Ad Modal</option>
                    <option value="custom_url">External Link (https://...)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-800 cursor-pointer">
                    <span>Show Text Overlay on Image</span>
                    <input
                      type="checkbox"
                      checked={formShowOverlay}
                      onChange={(e) => setFormShowOverlay(e.target.checked)}
                      className="w-4 h-4 accent-[#FF5A36]"
                    />
                  </label>
                </div>
              </div>

              {formCtaAction === 'custom_url' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Destination URL
                  </label>
                  <input
                    type="url"
                    value={formCustomUrl}
                    onChange={(e) => setFormCustomUrl(e.target.value)}
                    placeholder="https://example.com/promo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#FF5A36]"
                  />
                </div>
              )}

              {/* Optional Text Overlay Inputs */}
              {formShowOverlay && (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Kicker / Label (Optional)
                      </label>
                      <input
                        type="text"
                        value={formBadge}
                        onChange={(e) => setFormBadge(e.target.value)}
                        placeholder="e.g. Featured Promotion"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs outline-none focus:border-[#FF5A36]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Button Label (Optional)
                      </label>
                      <input
                        type="text"
                        value={formCtaText}
                        onChange={(e) => setFormCtaText(e.target.value)}
                        placeholder="e.g. View Deals"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs outline-none focus:border-[#FF5A36]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Subtitle (Optional)
                    </label>
                    <input
                      type="text"
                      value={formSubtitle}
                      onChange={(e) => setFormSubtitle(e.target.value)}
                      placeholder="Short one-line description overlaid on bottom scrim"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs outline-none focus:border-[#FF5A36]"
                    />
                  </div>
                </div>
              )}

              {/* Active Status Toggle */}
              <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#FF5A36]"
                />
                <span>Publish Active Immediately</span>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] disabled:opacity-50 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingSlideId ? 'Save Changes' : 'Add Promo Slide'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {slideToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSlideToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-base font-black text-gray-900">Delete Promo Slide?</h4>
            <p className="text-xs text-gray-600">
              Are you sure you want to remove <strong>{slideToDelete.title || 'this promo slide'}</strong> from the category promo slider?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSlideToDelete(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Slide'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
