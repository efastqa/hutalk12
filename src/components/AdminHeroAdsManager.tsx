import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Sliders,
  RotateCw,
  Eye,
  ArrowRight,
  UploadCloud,
  Check,
  X,
  Layers,
  Image as ImageIcon,
  Video,
  Film,
  Play,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import { HeroAd, HeroAdSettings, HeroAnimationType } from '../types';
import { HeroAdBanner } from './HeroAdBanner';
import { apiService } from '../services/api';

interface AdminHeroAdsManagerProps {
  heroAds?: HeroAd[];
  heroSettings?: HeroAdSettings;
  onUpdateHeroSettings?: (settings: Partial<HeroAdSettings>) => Promise<void>;
  onCreateHeroAd?: (ad: Partial<HeroAd>) => Promise<void>;
  onUpdateHeroAd?: (id: string, ad: Partial<HeroAd>) => Promise<void>;
  onToggleHeroAd?: (id: string) => Promise<void>;
  onDeleteHeroAd?: (id: string) => Promise<void>;
  onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const compressHeroImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 960;
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
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.70));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const BG_PRESETS = [
  { label: 'None (Pure Gradient)', url: '' },
  { label: '🚗 Luxury Vehicles', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80' },
  { label: '🏢 Modern Penthouse', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80' },
  { label: '📱 Electronics & Tech', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80' },
  { label: '🌴 Tropical Land & Villa', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80' },
];

const VIDEO_PRESETS = [
  { label: '🎬 Dynamic Showcase', url: '/videos/motion-loop-3.mp4' },
  { label: '🌸 Nature Walkthrough', url: '/videos/motion-loop-2.mp4' },
  { label: '🌊 Aerial Drone Tour', url: 'https://vjs.zencdn.net/v/oceans.mp4' },
  { label: '⚡ Cyber Tech Animation', url: '/videos/motion-loop-3.mp4' },
];

export const AdminHeroAdsManager: React.FC<AdminHeroAdsManagerProps> = ({
  heroAds = [],
  heroSettings = { mode: 'default', rotationIntervalSeconds: 6 },
  onUpdateHeroSettings,
  onCreateHeroAd,
  onUpdateHeroAd,
  onToggleHeroAd,
  onDeleteHeroAd,
  onToast,
}) => {
  // Mode selection state
  const [selectedMode, setSelectedMode] = useState<'default' | 'rotate' | 'ads_only'>(
    heroSettings.mode || 'default'
  );
  const [rotationSec, setRotationSec] = useState<number>(
    heroSettings.rotationIntervalSeconds || 6
  );
  const [isUpdatingSettings, setIsUpdatingSettings] = useState<boolean>(false);

  // Modal / Form state for Add/Edit Hero Ad
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);

  const [formBadge, setFormBadge] = useState<string>('🌟 Special Promotion');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formHighlight, setFormHighlight] = useState<string>('');
  const [formSubtitle, setFormSubtitle] = useState<string>('');
  const [formCtaText, setFormCtaText] = useState<string>('Explore Now');
  const [formCtaAction, setFormCtaAction] = useState<string>('post_ad');
  const [formBgImage, setFormBgImage] = useState<string>('');
  const [formBgVideo, setFormBgVideo] = useState<string>('');
  const [formMediaType, setFormMediaType] = useState<'image' | 'video'>('image');
  const [formTheme, setFormTheme] = useState<'orange' | 'blue' | 'emerald' | 'purple' | 'amber'>('orange');
  const [formAnimation, setFormAnimation] = useState<HeroAnimationType>('pulse');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [isUploadingBg, setIsUploadingBg] = useState<boolean>(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const [customMediaUrl, setCustomMediaUrl] = useState<string>('');

  const activeAdsCount = heroAds.filter((a) => a.isActive).length;

  const handleSaveSettings = async (modeToSave: 'default' | 'rotate' | 'ads_only', intervalToSave: number) => {
    if (!onUpdateHeroSettings) return;
    setIsUpdatingSettings(true);
    try {
      await onUpdateHeroSettings({
        mode: modeToSave,
        rotationIntervalSeconds: intervalToSave,
      });
      setSelectedMode(modeToSave);
      setRotationSec(intervalToSave);
      if (onToast) {
        onToast(
          modeToSave === 'default'
            ? 'Hero set to Default ("Buy & Sell Everything in Sri Lanka")'
            : modeToSave === 'rotate'
            ? `Hero rotation enabled (${intervalToSave}s per slide)!`
            : 'Hero set to Custom Ads only!',
          'success'
        );
      }
    } catch {
      if (onToast) onToast('Failed to update hero settings', 'error');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const openAddModal = () => {
    setEditingAdId(null);
    setFormBadge('🌟 Special Promotion');
    setFormTitle('Sell Your Vehicle or Property in 24 Hours');
    setFormHighlight('with HUTA Turbo Ad');
    setFormSubtitle('Direct WhatsApp inquiries from thousands of buyers across all 25 districts with zero broker fees.');
    setFormCtaText('Post Free Ad Now');
    setFormCtaAction('post_ad');
    setFormBgImage('');
    setFormBgVideo('');
    setFormMediaType('video');
    setCustomMediaUrl('');
    setFormTheme('orange');
    setFormAnimation('pulse');
    setFormIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (ad: HeroAd) => {
    setEditingAdId(ad.id);
    setFormBadge(ad.badge || '');
    setFormTitle(ad.title || '');
    setFormHighlight(ad.highlightText || '');
    setFormSubtitle(ad.subtitle || '');
    setFormCtaText(ad.ctaText || '');
    setFormCtaAction(ad.ctaAction || '');
    setFormBgImage(ad.bgImage || '');
    setFormBgVideo(ad.bgVideo || '');
    setFormMediaType(ad.mediaType || (ad.bgVideo ? 'video' : 'image'));
    setCustomMediaUrl(ad.bgVideo || ad.bgImage || '');
    setFormTheme(ad.gradientTheme || 'orange');
    setFormAnimation(ad.animationType || 'slide');
    setFormIsActive(ad.isActive);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBg(true);
    try {
      const compressed = await compressHeroImage(file);
      setFormBgImage(compressed);
      setFormMediaType('image');
      if (onToast) onToast('Background image loaded!', 'success');
    } catch {
      if (onToast) onToast('Failed to process image file', 'error');
    } finally {
      setIsUploadingBg(false);
    }
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 30MB
    if (file.size > 30 * 1024 * 1024) {
      if (onToast) onToast('Video file size exceeds 30MB limit. Please choose a shorter clip or use a direct URL.', 'error');
      return;
    }

    setIsUploadingVideo(true);
    setFormError('');
    try {
      const reader = new FileReader();
      reader.onerror = () => {
        if (onToast) onToast('Failed to read video file', 'error');
        setIsUploadingVideo(false);
      };
      reader.onload = async (ev) => {
        const rawData = ev.target?.result as string;
        try {
          const res = await apiService.uploadVideo(rawData, file.name);
          setFormBgVideo(res.url);
          setCustomMediaUrl(res.url);
          setFormMediaType('video');
          if (onToast) onToast('Animation video uploaded and ready to display!', 'success');
        } catch {
          setFormBgVideo(rawData);
          setCustomMediaUrl('');
          setFormMediaType('video');
          if (onToast) onToast('Animation video loaded locally', 'info');
        } finally {
          setIsUploadingVideo(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      if (onToast) onToast('Failed to process video file', 'error');
      setIsUploadingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSubtitle.trim()) {
      setFormError('Please enter both a Headline and a Subtitle.');
      return;
    }

    setIsSaving(true);
    setFormError('');

    const finalBgVideo = formMediaType === 'video'
      ? (formBgVideo.trim() || customMediaUrl.trim() || '/videos/motion-loop-3.mp4')
      : undefined;

    const payload: Partial<HeroAd> = {
      badge: formBadge.trim(),
      title: formTitle.trim(),
      highlightText: formHighlight.trim() || undefined,
      subtitle: formSubtitle.trim(),
      ctaText: formCtaText.trim() || undefined,
      ctaAction: formCtaAction.trim() || undefined,
      bgImage: formMediaType === 'image' ? (formBgImage.trim() || undefined) : undefined,
      bgVideo: finalBgVideo,
      mediaType: formMediaType,
      gradientTheme: formTheme,
      animationType: formAnimation,
      isActive: formIsActive,
    };

    try {
      if (editingAdId && onUpdateHeroAd) {
        await onUpdateHeroAd(editingAdId, payload);
      } else if (onCreateHeroAd) {
        await onCreateHeroAd(payload);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving hero ad';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Live Display Mode Switcher */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-[#FF5A36] text-xs font-extrabold border border-orange-200">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Hero Headline & Animated Ads Control</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Hero Section Display Mode
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Choose whether to keep the default marketplace welcome or display your custom animated ads.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Animated Ad</span>
          </button>
        </div>

        {/* Mode Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Option 1: Keep Default Hero Only */}
          <div
            onClick={() => handleSaveSettings('default', rotationSec)}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              selectedMode === 'default'
                ? 'border-[#FF5A36] bg-orange-50/40 shadow-sm ring-2 ring-[#FF5A36]/20'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                1. Default Welcome Only
              </span>
              {selectedMode === 'default' && (
                <span className="w-5 h-5 rounded-full bg-[#FF5A36] text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <h4 className="text-base font-bold text-gray-900">Keep Original Hero</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Displays "Buy & Sell Everything in Sri Lanka" marketplace welcome by default. No ads rotate unless enabled.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-[11px] font-bold text-gray-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Standard Default Setting</span>
            </div>
          </div>

          {/* Option 2: Rotate Default + Animated Ads */}
          <div
            onClick={() => handleSaveSettings('rotate', rotationSec)}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              selectedMode === 'rotate'
                ? 'border-[#FF5A36] bg-orange-50/40 shadow-sm ring-2 ring-[#FF5A36]/20'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF5A36]">
                2. Recommended
              </span>
              {selectedMode === 'rotate' && (
                <span className="w-5 h-5 rounded-full bg-[#FF5A36] text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <h4 className="text-base font-bold text-gray-900">Rotate Default + Ads</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Alternates between the default marketplace title and your active animated ads with smooth animations.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-500">Speed:</span>
              <select
                value={rotationSec}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setRotationSec(val);
                  handleSaveSettings('rotate', val);
                }}
                className="bg-white border border-gray-300 rounded-lg px-2 py-0.5 text-xs font-bold text-gray-800 outline-none"
              >
                <option value={4}>4s (Fast)</option>
                <option value={6}>6s (Optimal)</option>
                <option value={8}>8s (Relaxed)</option>
                <option value={10}>10s (Slow)</option>
              </select>
            </div>
          </div>

          {/* Option 3: Custom Ads Only */}
          <div
            onClick={() => handleSaveSettings('ads_only', rotationSec)}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              selectedMode === 'ads_only'
                ? 'border-[#FF5A36] bg-orange-50/40 shadow-sm ring-2 ring-[#FF5A36]/20'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-purple-600">
                3. Promotional Focus
              </span>
              {selectedMode === 'ads_only' && (
                <span className="w-5 h-5 rounded-full bg-[#FF5A36] text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <h4 className="text-base font-bold text-gray-900">Custom Ads Only</h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Exclusively showcases your active animated sponsor ads or campaign announcements.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-[11px] font-bold text-purple-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activeAdsCount} Active Ads Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Live Preview */}
      <div className="bg-[#111217] text-white rounded-3xl p-6 sm:p-8 border border-[#2D2F39] shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Live Interactive Preview (Exact Homepage Appearance)
            </span>
          </div>
          <span className="text-xs text-[#FF5A36] font-bold bg-[#FF5A36]/10 px-2.5 py-1 rounded-full border border-[#FF5A36]/20">
            Mode: {selectedMode.toUpperCase()}
          </span>
        </div>

        <HeroAdBanner
          heroAds={heroAds}
          heroSettings={{ mode: selectedMode, rotationIntervalSeconds: rotationSec }}
          isLivePreview={true}
        />
      </div>

      {/* 3. Hero Ads Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Managed Animated Ads</h3>
            <p className="text-xs text-gray-500">
              {heroAds.length} total advertisements ({activeAdsCount} active on live site)
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Ad</span>
          </button>
        </div>

        {heroAds.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <Megaphone className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-sm font-semibold text-gray-600">No custom animated ads yet</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Create your first animated ad to promote sponsors, featured categories, or major seasonal campaigns.
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF5A36] text-white text-xs font-bold rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Ad</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Headline & Highlight</th>
                  <th className="py-3.5 px-4 font-bold">Badge & Subtitle</th>
                  <th className="py-3.5 px-4 font-bold">Animation & Theme</th>
                  <th className="py-3.5 px-4 font-bold">CTA Button</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {heroAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-gray-900 leading-snug">
                        {ad.title}{' '}
                        {ad.highlightText && (
                          <span className="text-[#FF5A36]">
                            {ad.highlightText}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
                          {ad.badge}
                        </div>
                        {ad.mediaType === 'video' || ad.bgVideo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                            <Film className="w-2.5 h-2.5 text-purple-600" />
                            <span>Animation Video</span>
                          </span>
                        ) : ad.bgImage ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                            <ImageIcon className="w-2.5 h-2.5 text-blue-600" />
                            <span>Image</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200 text-[10px] font-bold">
                            <span>Gradient</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{ad.subtitle}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                          {ad.animationType || 'slide'}
                        </span>
                        <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-md bg-orange-100 text-orange-800">
                          {ad.gradientTheme || 'orange'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {ad.ctaText ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-900 text-white text-xs font-bold">
                          <span>{ad.ctaText}</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={async () => {
                          if (onToggleHeroAd) await onToggleHeroAd(ad.id);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold cursor-pointer transition-colors ${
                          ad.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            ad.isActive ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        />
                        <span>{ad.isActive ? 'Active Live' : 'Paused'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(ad)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Edit Ad"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Delete "${ad.title}"?`)) {
                              if (onDeleteHeroAd) await onDeleteHeroAd(ad.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Ad"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Add / Edit Hero Ad Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF5A36] flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    {editingAdId ? 'Edit Hero Animated Ad' : 'Create New Hero Animated Ad'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Displayed directly in the top marketplace hero banner spot
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Badge Text */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Badge Text (Top Pill)
                </label>
                <input
                  type="text"
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                  placeholder="e.g. 🌟 Exclusive Promotion, 🔥 Hot Deal, 🏢 Prime Sponsor"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#FF5A36] outline-none"
                />
              </div>

              {/* Main Headline */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Main Headline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Sell Your Vehicle or Property in 24 Hours"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold focus:border-[#FF5A36] outline-none"
                />
              </div>

              {/* Highlighted Words */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Highlight Text (Accent Color with Wavy Underline)
                </label>
                <input
                  type="text"
                  value={formHighlight}
                  onChange={(e) => setFormHighlight(e.target.value)}
                  placeholder="e.g. with HUTA Turbo Ad / in Colombo & Kandy"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-[#FF5A36] focus:border-[#FF5A36] outline-none"
                />
              </div>

              {/* Subtitle / Details */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Subtitle / Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  placeholder="Direct WhatsApp inquiries from thousands of verified buyers across all 25 districts with zero broker fees."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:border-[#FF5A36] outline-none resize-none"
                />
              </div>

              {/* CTA Button Text & Action */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={formCtaText}
                    onChange={(e) => setFormCtaText(e.target.value)}
                    placeholder="e.g. Post Free Ad Now, Explore Properties"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#FF5A36] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Action Target
                  </label>
                  <select
                    value={formCtaAction}
                    onChange={(e) => setFormCtaAction(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-[#FF5A36] outline-none bg-white"
                  >
                    <option value="post_ad">Open Post Ad Modal</option>
                    <option value="Vehicles">Filter Vehicles</option>
                    <option value="Property">Filter Properties</option>
                    <option value="Electronics">Filter Classifieds & Tech</option>
                    <option value="Services">Filter Services & Trades</option>
                    <option value="Jobs">Filter Jobs</option>
                  </select>
                </div>
              </div>

              {/* Animation Style & Color Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Animation Style
                  </label>
                  <select
                    value={formAnimation}
                    onChange={(e) => setFormAnimation(e.target.value as HeroAnimationType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-[#FF5A36] outline-none bg-white"
                  >
                    <option value="pulse">Pulse Glow & Shimmer (Eye-Catching)</option>
                    <option value="slide">Smooth Slide & Elevate (Modern)</option>
                    <option value="glow">Radiant Neon Glow (Luxury)</option>
                    <option value="fade">Soft Crossfade (Minimal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Gradient Theme
                  </label>
                  <select
                    value={formTheme}
                    onChange={(e) =>
                      setFormTheme(e.target.value as 'orange' | 'blue' | 'emerald' | 'purple' | 'amber')
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:border-[#FF5A36] outline-none bg-white"
                  >
                    <option value="orange">HUTA Flame (Orange)</option>
                    <option value="blue">Sapphire Blue (Tech & Corporate)</option>
                    <option value="emerald">Emerald Green (Eco & Land)</option>
                    <option value="purple">Royal Purple (Luxury & VIP)</option>
                    <option value="amber">Amber Gold (Premium & Motors)</option>
                  </select>
                </div>
              </div>

              {/* Background Media: Animation Video / Image Graphic / Pure Gradient */}
              <div className="bg-gray-50/90 rounded-2xl p-4 border border-gray-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <span>Ad Background Media</span>
                      <span className="text-[10px] font-normal text-gray-500">(Animation Video or Image)</span>
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Choose an animation video loop, high-res graphic artwork, or a clean gradient.
                    </p>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="flex items-center gap-1 p-1 bg-gray-200/70 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setFormMediaType('video')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formMediaType === 'video'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Animation Video</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormMediaType('image')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        formMediaType === 'image'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Graphic Image</span>
                    </button>
                  </div>
                </div>

                {/* ANIMATION VIDEO MODE */}
                {formMediaType === 'video' && (
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-purple-600" />
                        <span>Upload Video or Choose Preset Motion Loop</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-xs">
                          {isUploadingVideo ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading Video...</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>Upload Animation Video</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/ogg,image/gif"
                            onChange={handleVideoFileUpload}
                            disabled={isUploadingVideo}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Direct Video URL Input */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <LinkIcon className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="url"
                          placeholder="Paste direct video URL (e.g. https://.../loop.mp4 or .webm)"
                          value={customMediaUrl}
                          onChange={(e) => setCustomMediaUrl(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:border-purple-600 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (customMediaUrl.trim()) {
                            setFormBgVideo(customMediaUrl.trim());
                            if (onToast) onToast('Video URL applied!', 'success');
                          }
                        }}
                        className="px-3 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer shrink-0"
                      >
                        Apply URL
                      </button>
                    </div>

                    {/* Video Motion Presets */}
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 mb-1.5">
                        Or select a high-speed animated motion preset:
                      </p>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {VIDEO_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setFormBgVideo(preset.url);
                              setCustomMediaUrl(preset.url);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                              formBgVideo === preset.url
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-purple-50 hover:border-purple-200'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Video Preview Box */}
                    {formBgVideo ? (
                      <div className="relative rounded-2xl overflow-hidden border border-purple-200 bg-black/90 aspect-video max-h-44 flex items-center justify-center">
                        <video
                          key={formBgVideo}
                          src={formBgVideo}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
                        <div className="absolute top-2.5 left-3 flex items-center gap-1.5 text-white text-[11px] font-bold bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10">
                          <Film className="w-3 h-3 text-purple-400" />
                          <span>Animation Video Preview</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormBgVideo('');
                            setCustomMediaUrl('');
                          }}
                          className="absolute top-2.5 right-3 px-2 py-1 rounded-lg bg-red-600/90 hover:bg-red-700 text-white text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Remove Video
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-gray-300 text-center text-xs text-gray-500 bg-white">
                        <Film className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                        <span>No video loaded yet. Upload an MP4/WebM video, paste a URL, or pick a preset above.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* GRAPHIC IMAGE MODE */}
                {formMediaType === 'image' && (
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>Upload Artwork Image or Choose Category Preset</span>
                      </span>

                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-xs">
                        {isUploadingBg ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Compressing Image...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload Image</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={isUploadingBg}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Direct Image URL Input */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <LinkIcon className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="url"
                          placeholder="Paste direct image URL (e.g. https://.../banner.jpg)"
                          value={customMediaUrl}
                          onChange={(e) => setCustomMediaUrl(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:border-blue-600 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (customMediaUrl.trim()) {
                            setFormBgImage(customMediaUrl.trim());
                            if (onToast) onToast('Image URL applied!', 'success');
                          }
                        }}
                        className="px-3 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer shrink-0"
                      >
                        Apply URL
                      </button>
                    </div>

                    {/* Photo Presets */}
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 mb-1.5">
                        Or select a graphic artwork preset:
                      </p>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {BG_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setFormBgImage(preset.url);
                              setCustomMediaUrl(preset.url);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                              formBgImage === preset.url
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Live Image Preview */}
                    {formBgImage ? (
                      <div className="relative rounded-2xl overflow-hidden border border-blue-200 aspect-video max-h-44 flex items-center justify-center bg-gray-900">
                        <img
                          src={formBgImage}
                          alt="Ad background preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                        <div className="absolute top-2.5 left-3 flex items-center gap-1.5 text-white text-[11px] font-bold bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10">
                          <ImageIcon className="w-3 h-3 text-blue-400" />
                          <span>Graphic Artwork Preview</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormBgImage('');
                            setCustomMediaUrl('');
                          }}
                          className="absolute top-2.5 right-3 px-2 py-1 rounded-lg bg-red-600/90 hover:bg-red-700 text-white text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-gray-300 text-center text-xs text-gray-500 bg-white">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                        <span>No image selected. Upload an artwork, paste an image link, or select a preset.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="form-is-active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#FF5A36] rounded border-gray-300 focus:ring-[#FF5A36]"
                />
                <label htmlFor="form-is-active" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Activate this ad immediately on the live marketplace
                </label>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingBg}
                  className="px-6 py-2.5 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving Ad...' : editingAdId ? 'Update Ad' : 'Publish Ad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
