import React, { useState, useRef } from 'react';
import {
  X,
  Video,
  UploadCloud,
  Sparkles,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Phone,
  Tag,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  Link as LinkIcon,
} from 'lucide-react';
import { VideoReelItem } from '../types';
import { api } from '../services/api';

interface AddStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: (reel: VideoReelItem) => void;
  currentUser?: { fullname?: string; phone?: string; username?: string } | null;
  onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const SAMPLE_REEL_VIDEOS = [
  {
    name: 'Car Walkthrough Loop',
    url: '/videos/motion-loop-1.mp4',
    poster: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
    title: 'Vehicle Engine & Interior Walkthrough',
  },
  {
    name: 'iPhone Tech Inspection',
    url: '/videos/motion-loop-2.mp4',
    poster: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
    title: 'iPhone Device & Battery Check',
  },
  {
    name: 'Apartment Tour',
    url: '/videos/motion-loop-3.mp4',
    poster: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    title: 'Modern Apartment Room Tour',
  },
];

export const AddStoryModal: React.FC<AddStoryModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated,
  currentUser,
  onToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Video state
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoPoster, setVideoPoster] = useState<string>('');
  const [videoFileName, setVideoFileName] = useState<string>('');
  const [videoFileSize, setVideoFileSize] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const [customUrlInput, setCustomUrlInput] = useState<string>('');

  // Minimal optional details
  const [title, setTitle] = useState<string>('');
  const [phone, setPhone] = useState<string>(currentUser?.phone || '');
  const [price, setPrice] = useState<string>('');
  const [district, setDistrict] = useState<string>('Colombo');
  const [category, setCategory] = useState<string>('Vehicles');

  // UI state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(true);
  const [isMutedPreview, setIsMutedPreview] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');

    // Check size limit (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('Video exceeds 50MB. Please select a shorter video clip.');
      return;
    }

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setVideoFileName(file.name);
    setVideoFileSize(`${sizeMb} MB`);
    setIsUploading(true);

    try {
      // Create local object URL for instant preview
      const objectUrl = URL.createObjectURL(file);
      setVideoUrl(objectUrl);

      // Generate a canvas poster frame from video
      const videoEl = document.createElement('video');
      videoEl.src = objectUrl;
      videoEl.muted = true;
      videoEl.currentTime = 1;
      videoEl.onloadeddata = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = videoEl.videoWidth || 480;
          canvas.height = videoEl.videoHeight || 640;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
            setVideoPoster(canvas.toDataURL('image/jpeg', 0.8));
          }
        } catch {
          // fallback
        }
      };

      // Also read as base64 to upload to backend if needed
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await api.uploadVideo(base64Data, file.name);
          if (res.url) {
            setVideoUrl(res.url);
          }
        } catch {
          // If server upload fails (e.g. storage quota), keep the base64 or blob URL
          setVideoUrl(base64Data);
        }
      };
      reader.readAsDataURL(file);

      if (onToast) onToast('Video loaded successfully! Ready to publish.', 'info');
    } catch {
      setErrorMessage('Could not load video file. Please try another video format (MP4/WebM).');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleApplySample = (sample: typeof SAMPLE_REEL_VIDEOS[0]) => {
    setVideoUrl(sample.url);
    setVideoPoster(sample.poster);
    setVideoFileName(sample.name);
    setVideoFileSize('Sample');
    if (!title) setTitle(sample.title);
    setErrorMessage('');
  };

  const handleApplyUrl = () => {
    if (!customUrlInput.trim()) {
      setErrorMessage('Please enter a video URL');
      return;
    }
    setVideoUrl(customUrlInput.trim());
    setVideoFileName('External Video');
    setVideoFileSize('Stream URL');
    setErrorMessage('');
  };

  const togglePreviewPlay = () => {
    if (!videoPreviewRef.current) return;
    if (isPlayingPreview) {
      videoPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      videoPreviewRef.current.play().catch(() => {});
      setIsPlayingPreview(true);
    }
  };

  const togglePreviewMute = () => {
    if (!videoPreviewRef.current) return;
    const nextMuted = !isMutedPreview;
    setIsMutedPreview(nextMuted);
    videoPreviewRef.current.muted = nextMuted;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!videoUrl) {
      setErrorMessage('Please choose or upload a video first.');
      return;
    }

    setIsSubmitting(true);

    try {
      const parsedPrice = price ? parseFloat(price.replace(/[^0-9.]/g, '')) : 0;
      const cleanTitle = title.trim() || 'Quick Video Walkthrough';
      const seller = currentUser?.fullname || currentUser?.username || 'Verified Seller';

      const newReelData: Partial<VideoReelItem> = {
        title: cleanTitle,
        videoUrl,
        posterImage: videoPoster || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
        category,
        price: isNaN(parsedPrice) ? 0 : parsedPrice,
        location: `${district}, Sri Lanka`,
        district,
        sellerName: seller,
        phone: phone.trim() || undefined,
        isVerified: true,
        specsSummary: `${category} • ${district}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        views: 1,
      };

      const created = await api.createVideoReel(newReelData);
      onStoryCreated(created);

      if (onToast) onToast('Your video story is now live on HUTA.LK!', 'success');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish story';
      setErrorMessage(msg);
      if (onToast) onToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#151822] text-gray-900 dark:text-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl relative border border-gray-200 dark:border-[#2D2F39] my-6 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-[#22242F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5A36] to-[#FF8A65] text-white flex items-center justify-center shadow-md shadow-[#FF5A36]/30">
              <Video className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-gray-900 dark:text-white leading-none">
                  Add Your Story
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 dark:bg-[#FF5A36]/20 text-[#FF5A36]">
                  Short Reel
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fast & easy: only your video is needed to share a live walkthrough!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-500 dark:text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 1. PRIMARY VIDEO SECTION */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-[#FF5A36]" />
                Video Walkthrough *
              </span>
              <span className="text-[11px] font-normal text-gray-400">
                15–30 sec reel (MP4 / WebM / MOV)
              </span>
            </label>

            {/* Video Preview If Selected */}
            {videoUrl ? (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/12] max-h-72 w-full mx-auto shadow-md border border-gray-200 dark:border-[#2D2F39]">
                <video
                  ref={videoPreviewRef}
                  src={videoUrl}
                  autoPlay
                  loop
                  playsInline
                  muted={isMutedPreview}
                  className="w-full h-full object-cover"
                />

                {/* Overlaid preview badge */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold border border-white/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Video Ready ({videoFileSize || 'Loaded'})
                  </span>

                  <div className="flex items-center gap-1 pointer-events-auto">
                    <button
                      type="button"
                      onClick={togglePreviewMute}
                      className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                    >
                      {isMutedPreview ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={togglePreviewPlay}
                      className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                    >
                      {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Change video action */}
                <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-white/90 drop-shadow truncate max-w-[60%]">
                    {videoFileName || 'Selected Video'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoUrl('');
                      setVideoFileName('');
                      setVideoFileSize('');
                    }}
                    className="px-3 py-1 rounded-xl bg-white/90 hover:bg-white text-gray-900 text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Change Video
                  </button>
                </div>
              </div>
            ) : (
              /* Video Upload / Choose Area */
              <div className="space-y-3">
                {/* Upload or Drop */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#FF5A36]/40 hover:border-[#FF5A36] bg-orange-50/40 dark:bg-[#FF5A36]/5 hover:bg-orange-50/70 dark:hover:bg-[#FF5A36]/10 rounded-2xl p-6 text-center cursor-pointer transition-all group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/mov,video/*"
                    onChange={handleVideoFileChange}
                    className="hidden"
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center py-2">
                      <Loader2 className="w-8 h-8 text-[#FF5A36] animate-spin mb-2" />
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                        Processing video clip...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-[#FF5A36]/15 group-hover:bg-[#FF5A36] text-[#FF5A36] group-hover:text-white flex items-center justify-center transition-all mb-2.5 shadow-sm">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                        Click to Choose or Record Video
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        MP4, MOV, WebM from phone gallery or camera (Up to 50MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Presets / Samples for fast testing */}
                <div className="pt-1">
                  <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-between">
                    <span>Or pick a test walkthrough clip:</span>
                    <button
                      type="button"
                      onClick={() => setUploadMode(uploadMode === 'upload' ? 'url' : 'upload')}
                      className="text-[#FF5A36] hover:underline text-[11px] font-semibold"
                    >
                      {uploadMode === 'upload' ? 'Paste Video Link' : 'Use File Picker'}
                    </button>
                  </div>

                  {uploadMode === 'url' ? (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        placeholder="https://example.com/walkthrough.mp4"
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-[#2D2F39] text-xs bg-white dark:bg-[#111217] outline-none focus:border-[#FF5A36]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyUrl}
                        className="px-3 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold shrink-0 cursor-pointer"
                      >
                        Use Link
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {SAMPLE_REEL_VIDEOS.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplySample(s)}
                          className="p-2 rounded-xl border border-gray-200 dark:border-[#2D2F39] hover:border-[#FF5A36] bg-gray-50 dark:bg-white/5 text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-800 dark:text-gray-200 truncate">
                            <FileVideo className="w-3 h-3 text-[#FF5A36] shrink-0" />
                            <span className="truncate">{s.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. MINIMAL OPTIONAL FIELDS (NO LONG FORMS) */}
          <div className="space-y-3 pt-1 border-t border-gray-100 dark:border-[#22242F]">
            {/* Caption / Title */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Story Caption / Title <span className="text-gray-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 2021 Toyota Premio Mint Condition / Colombo 07"
                maxLength={80}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2F39] text-xs font-medium bg-white dark:bg-[#111217] focus:border-[#FF5A36] outline-none"
              />
            </div>

            {/* WhatsApp / Phone & District in a clean 2-column row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#FF5A36]" />
                  Contact Phone / WhatsApp <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="077 123 4567"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2F39] text-xs font-medium bg-white dark:bg-[#111217] focus:border-[#FF5A36] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#FF5A36]" />
                  District
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2F39] text-xs font-medium bg-white dark:bg-[#111217] focus:border-[#FF5A36] outline-none"
                >
                  <option value="Colombo">Colombo</option>
                  <option value="Gampaha">Gampaha</option>
                  <option value="Kandy">Kandy</option>
                  <option value="Galle">Galle</option>
                  <option value="Kurunegala">Kurunegala</option>
                  <option value="Kalutara">Kalutara</option>
                  <option value="Matara">Matara</option>
                  <option value="Jaffna">Jaffna</option>
                </select>
              </div>
            </div>

            {/* Price & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Item Price (Rs.) <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 45,000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2F39] text-xs font-medium bg-white dark:bg-[#111217] focus:border-[#FF5A36] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2F39] text-xs font-medium bg-white dark:bg-[#111217] focus:border-[#FF5A36] outline-none"
                >
                  <option value="Vehicles">Vehicles</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Property">Property</option>
                  <option value="Motorcycles">Motorcycles</option>
                  <option value="Services">Services</option>
                  <option value="General">Other / General</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2D2F39] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !videoUrl}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5A36] to-[#FF8A65] hover:opacity-95 text-white text-xs font-black shadow-md shadow-[#FF5A36]/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Story...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publish Video Story</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
