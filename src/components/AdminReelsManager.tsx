import React, { useState } from 'react';
import {
  Video,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Play,
  Pause,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Tag,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Loader2,
  X,
  FileVideo,
} from 'lucide-react';
import { VideoReelItem } from '../types';
import { formatLKR } from './ListingsSection';
import { api } from '../services/api';

interface AdminReelsManagerProps {
  reels: VideoReelItem[];
  onReelsChange: (reels: VideoReelItem[]) => void;
  onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const DEMO_INSPECTION_REELS: Partial<VideoReelItem>[] = [
  {
    title: 'DJI 4K Drone Flight & Gimbal Test',
    videoUrl: '/uploads/videos/anim-video-1790102854586-d1bwkp.mp4',
    posterImage: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=600&q=80',
    category: 'Electronics',
    price: 45000,
    location: 'Colombo 03',
    district: 'Colombo',
    sellerName: 'Kasun Electronics',
    phone: '0771234567',
    isVerified: true,
    specsSummary: '4K 60fps • 3-Axis Gimbal • 32m Flight Time',
    isActive: true,
  },
  {
    title: 'Toyota Prius S-Grade Hybrid Inspection',
    videoUrl: '/videos/motion-loop-1.mp4',
    posterImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
    category: 'Vehicles',
    price: 12850000,
    location: 'Nugegoda, Colombo',
    district: 'Colombo',
    sellerName: 'AutoPoint Lanka',
    phone: '0775260765',
    isVerified: true,
    specsSummary: 'Hybrid • Auto • Battery 94% • 1st Owner',
    isActive: true,
  },
  {
    title: 'Luxury 3BR Sea View Apartment Tour',
    videoUrl: '/videos/motion-loop-3.mp4',
    posterImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    category: 'Property',
    price: 48500000,
    location: 'Kollupitiya, Colombo',
    district: 'Colombo',
    sellerName: 'Island Prime Realty',
    phone: '0712345678',
    isVerified: true,
    specsSummary: '3 Beds • 2 Baths • Sea View Balcony • Pool',
    isActive: true,
  },
];

export const AdminReelsManager: React.FC<AdminReelsManagerProps> = ({
  reels,
  onReelsChange,
  onToast,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formPoster, setFormPoster] = useState('');
  const [formCategory, setFormCategory] = useState('Vehicles');
  const [formPrice, setFormPrice] = useState('');
  const [formDistrict, setFormDistrict] = useState('Colombo');
  const [formSeller, setFormSeller] = useState('HUTA Admin');
  const [formPhone, setFormPhone] = useState('0775260765');
  const [formIsVerified, setFormIsVerified] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const totalReels = reels.length;
  const activeReels = reels.filter((r) => r.isActive !== false).length;

  const handleToggleActive = async (reel: VideoReelItem) => {
    try {
      const nextActive = reel.isActive === false;
      const updated = await api.updateVideoReel(reel.id, { isActive: nextActive });
      onReelsChange(reels.map((r) => (r.id === reel.id ? { ...r, isActive: nextActive } : r)));
      if (onToast) {
        onToast(
          nextActive ? `"${reel.title}" is now active on homepage` : `"${reel.title}" has been paused`,
          'info'
        );
      }
    } catch {
      if (onToast) onToast('Failed to update reel status', 'error');
    }
  };

  const handleDeleteReel = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the story "${title}"?`)) {
      return;
    }
    try {
      await api.deleteVideoReel(id);
      onReelsChange(reels.filter((r) => r.id !== id));
      if (onToast) onToast(`Story reel "${title}" deleted`, 'info');
    } catch {
      if (onToast) onToast('Failed to delete story reel', 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      if (onToast) onToast('Video exceeds 50MB. Please use a shorter clip.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await api.uploadVideo(base64, file.name);
          setFormVideoUrl(res.url || base64);
        } catch {
          setFormVideoUrl(base64);
        }
        if (onToast) onToast('Video uploaded successfully!', 'success');
      };
      reader.readAsDataURL(file);
    } catch {
      if (onToast) onToast('Failed to read video file', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVideoUrl) {
      if (onToast) onToast('Please provide a video file or URL', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const priceNum = formPrice ? parseFloat(formPrice.replace(/[^0-9.]/g, '')) : 0;
      const newReel = await api.createVideoReel({
        title: formTitle.trim() || 'Inspection Reel',
        videoUrl: formVideoUrl,
        posterImage: formPoster || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
        category: formCategory,
        price: isNaN(priceNum) ? 0 : priceNum,
        location: `${formDistrict}, Sri Lanka`,
        district: formDistrict,
        sellerName: formSeller.trim() || 'Verified Seller',
        phone: formPhone.trim(),
        isVerified: formIsVerified,
        isActive: true,
        specsSummary: `${formCategory} • ${formDistrict}`,
        createdAt: new Date().toISOString(),
      });

      onReelsChange([newReel, ...reels]);
      if (onToast) onToast('New Video Reel published successfully to marketplace!', 'success');

      // Reset form
      setIsAddModalOpen(false);
      setFormTitle('');
      setFormVideoUrl('');
      setFormPoster('');
      setFormPrice('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create reel';
      if (onToast) onToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedSamples = async () => {
    try {
      const createdItems: VideoReelItem[] = [];
      for (const item of DEMO_INSPECTION_REELS) {
        const res = await api.createVideoReel(item);
        createdItems.push(res);
      }
      onReelsChange([...createdItems, ...reels]);
      if (onToast) onToast(`Added ${createdItems.length} sample inspection reels for testing!`, 'success');
    } catch {
      if (onToast) onToast('Failed to add sample reels', 'error');
    }
  };

  const handleClearAllReels = async () => {
    if (!window.confirm('Are you sure you want to delete ALL story reels? This will remove all video stories from the homepage.')) {
      return;
    }
    try {
      for (const r of reels) {
        await api.deleteVideoReel(r.id);
      }
      onReelsChange([]);
      if (onToast) onToast('All story reels have been cleared. Homepage is clean.', 'info');
    } catch {
      if (onToast) onToast('Failed to clear some reels', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Top Header Banner */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent dark:from-[#FF5A36]/15 dark:to-transparent border border-orange-200 dark:border-[#FF5A36]/20 rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5A36] text-white flex items-center justify-center shadow-md shadow-[#FF5A36]/20">
            <Video className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                Short Video Stories & Inspection Reels
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FF5A36] text-white">
                {activeReels} Live
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-xl">
              Default dummy inspection reels have been removed per your request. The marketplace only shows custom video stories uploaded by you and sellers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {reels.length === 0 && (
            <button
              type="button"
              onClick={handleSeedSamples}
              className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Add 3 sample inspection reels to test"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF5A36]" />
              <span>Load 3 Demo Reels (Optional)</span>
            </button>
          )}

          {reels.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllReels}
              className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Reels</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#FF5A36] hover:bg-[#E04826] text-white text-xs font-black shadow-md shadow-[#FF5A36]/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Video Story</span>
          </button>
        </div>
      </div>

      {/* 2. Reels Grid / List */}
      {reels.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-white/5 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-[#FF5A36]/20 text-[#FF5A36] flex items-center justify-center mx-auto">
            <Video className="w-7 h-7" />
          </div>
          <h4 className="font-extrabold text-gray-900 dark:text-white text-base">
            No Video Stories Currently Active
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Default dummy walkthroughs have been removed as requested. You or your sellers can add video stories via the "Add Your Story" button on the homepage, or you can add one right here as Admin.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#FF5A36] text-white text-xs font-bold shadow-sm hover:opacity-95 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Reel</span>
            </button>
            <button
              type="button"
              onClick={handleSeedSamples}
              className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-300 dark:hover:bg-white/20 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Demo Reels</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {reels.map((reel) => {
            const isLive = reel.isActive !== false;

            return (
              <div
                key={reel.id}
                className={`bg-white dark:bg-[#181920] border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                  isLive
                    ? 'border-gray-200 dark:border-[#2D2F39]'
                    : 'border-gray-200 dark:border-[#2D2F39] opacity-60'
                }`}
              >
                {/* Video / Thumbnail preview */}
                <div className="relative aspect-[9/12] bg-black overflow-hidden group">
                  <video
                    src={reel.videoUrl}
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold border border-white/20">
                      {reel.category || 'General'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isLive
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-600 text-gray-200'
                      }`}
                    >
                      {isLive ? 'Live' : 'Paused'}
                    </span>
                  </div>

                  {/* Play preview button */}
                  <button
                    type="button"
                    onClick={() => setPreviewVideoUrl(reel.videoUrl)}
                    className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 cursor-pointer"
                    title="Watch full video"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>

                  {/* Bottom info on video */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white pointer-events-none">
                    {reel.price ? (
                      <div className="text-xs font-black text-white drop-shadow">
                        {formatLKR(reel.price)}
                      </div>
                    ) : null}
                    <div className="text-xs font-bold line-clamp-1 drop-shadow mt-0.5">
                      {reel.title}
                    </div>
                  </div>
                </div>

                {/* Card Content & Details */}
                <div className="p-3.5 space-y-2.5">
                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3 h-3 text-[#FF5A36] shrink-0" />
                      <span className="truncate">{reel.district || reel.location || 'Sri Lanka'}</span>
                    </div>
                    {reel.phone && (
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                        <Phone className="w-3 h-3 text-[#FF5A36] shrink-0" />
                        <span>{reel.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Controls */}
                  <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(reel)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isLive
                          ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                          : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      {isLive ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteReel(reel.id, reel.title)}
                      className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete reel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Add Story Reel Modal for Admin */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#151822] text-gray-900 dark:text-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative border border-gray-200 dark:border-[#2D2F39] my-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#22242F]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF5A36] text-white flex items-center justify-center font-bold">
                  <Video className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                    Publish Video Story Reel
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Add a verified inspection reel directly as Administrator
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-500 dark:text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReel} className="mt-5 space-y-4">
              {/* Video upload or link */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700 dark:text-gray-300">
                  Video Source *
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="Enter video URL or upload below (e.g. /videos/motion-loop-1.mp4)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2F39] text-xs font-medium bg-white dark:bg-[#111217] outline-none focus:border-[#FF5A36]"
                  />

                  <div className="flex items-center gap-2">
                    <label className="flex-1 py-2 px-3 border border-dashed border-gray-300 dark:border-[#2D2F39] hover:border-[#FF5A36] rounded-xl text-center text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-[#FF5A36] cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                      <UploadCloud className="w-4 h-4" />
                      <span>{isUploading ? 'Uploading...' : 'Upload Video File (.mp4)'}</span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setFormVideoUrl('/videos/motion-loop-1.mp4')}
                      className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Use Sample
                    </button>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700 dark:text-gray-300">
                  Title / Caption *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. 2018 Toyota Prius S-Grade Engine Inspection"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2F39] text-xs font-medium bg-white dark:bg-[#111217] outline-none focus:border-[#FF5A36]"
                />
              </div>

              {/* Category & District */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2F39] text-xs font-medium bg-white dark:bg-[#111217] outline-none focus:border-[#FF5A36]"
                  >
                    <option value="Vehicles">Vehicles</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Property">Property</option>
                    <option value="Motorcycles">Motorcycles</option>
                    <option value="Services">Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700 dark:text-gray-300">
                    District
                  </label>
                  <select
                    value={formDistrict}
                    onChange={(e) => setFormDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2F39] text-xs font-medium bg-white dark:bg-[#111217] outline-none focus:border-[#FF5A36]"
                  >
                    <option value="Colombo">Colombo</option>
                    <option value="Gampaha">Gampaha</option>
                    <option value="Kandy">Kandy</option>
                    <option value="Galle">Galle</option>
                    <option value="Kurunegala">Kurunegala</option>
                  </select>
                </div>
              </div>

              {/* Price & Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700 dark:text-gray-300">
                    Price (LKR)
                  </label>
                  <input
                    type="text"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="e.g. 12,850,000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2F39] text-xs font-medium bg-white dark:bg-[#111217] outline-none focus:border-[#FF5A36]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-700 dark:text-gray-300">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0775260765"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2F39] text-xs font-medium bg-white dark:bg-[#111217] outline-none focus:border-[#FF5A36]"
                  />
                </div>
              </div>

              {/* Submit buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2F39] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formVideoUrl}
                  className="px-5 py-2.5 rounded-xl bg-[#FF5A36] text-white text-xs font-black shadow-md hover:opacity-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Publish Reel</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Fullscreen Video Preview Modal */}
      {previewVideoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewVideoUrl(null)}
        >
          <div
            className="relative max-w-sm w-full bg-black rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewVideoUrl(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <video
              src={previewVideoUrl}
              autoPlay
              controls
              playsInline
              className="w-full aspect-[9/16] object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};
