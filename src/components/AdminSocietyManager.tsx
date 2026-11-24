import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck2,
  Eye,
  Trash2,
  RefreshCw,
  Search,
  MapPin,
  Phone,
  MessageCircle,
  AlertTriangle,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Users,
} from 'lucide-react';
import {
  SocietyHelpRequest,
  SocietyHelpStatus,
  SocietyReviewStatus,
} from '../types';
import { api } from '../services/api';

interface AdminSocietyManagerProps {
  onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type AdminSocietyFilterTab =
  | 'all'
  | 'pending_review'
  | 're_review'
  | 'verified_proof'
  | 'approved'
  | 'rejected'
  | 'fulfilled';

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

export const AdminSocietyManager: React.FC<AdminSocietyManagerProps> = ({ onToast }) => {
  const [requests, setRequests] = useState<SocietyHelpRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [liveStatus, setLiveStatus] = useState<'live' | 'reconnecting' | 'offline'>('reconnecting');

  const [filterTab, setFilterTab] = useState<AdminSocietyFilterTab>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');

  // Detailed Review & Notes Modal
  const [reviewingItem, setReviewingItem] = useState<SocietyHelpRequest | null>(null);
  const [modalReviewStatus, setModalReviewStatus] = useState<SocietyReviewStatus>('verified_proof');
  const [modalAppealStatus, setModalAppealStatus] = useState<SocietyHelpStatus>('open');
  const [modalProofVerifiedNote, setModalProofVerifiedNote] = useState<string>('');
  const [modalAdminReviewNote, setModalAdminReviewNote] = useState<string>('');
  const [isSavingReview, setIsSavingReview] = useState<boolean>(false);

  // Admin Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<SocietyHelpRequest | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Fullscreen Proof & Photo Lightbox
  const [lightboxState, setLightboxState] = useState<{
    items: Array<{ url: string; title: string; subtitle?: string }>;
    index: number;
  } | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = api.subscribeToSocietyRequests(
      (list) => {
        setRequests(list);
        setIsLoading(false);
      },
      (status) => setLiveStatus(status)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!lightboxState) return;
    const onKeyDown = (e: KeyboardEvent) => {
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
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxState]);

  const handleManualSync = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await api.getSocietyRequests();
      setRequests(fresh);
      onToast?.('Society appeals synced from server & Firestore.', 'info');
    } catch {
      onToast?.('Failed to sync Society appeals.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const stats = useMemo(() => {
    const total = requests.length;
    const pendingReview = requests.filter(
      (r) => !r.reviewStatus || r.reviewStatus === 'pending_review'
    ).length;
    const reReviewNeeded = requests.filter((r) => Boolean(r.updatedAfterReview)).length;
    const verifiedProof = requests.filter((r) => r.reviewStatus === 'verified_proof').length;
    const rejected = requests.filter((r) => r.reviewStatus === 'rejected').length;
    const fulfilled = requests.filter((r) => r.status === 'fulfilled').length;
    return { total, pendingReview, reReviewNeeded, verifiedProof, rejected, fulfilled };
  }, [requests]);

  const districts = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => {
      if (r.district) set.add(r.district);
    });
    return Array.from(set).sort();
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const rev = req.reviewStatus || 'pending_review';
      if (filterTab === 'pending_review' && rev !== 'pending_review') return false;
      if (filterTab === 're_review' && !req.updatedAfterReview) return false;
      if (filterTab === 'verified_proof' && rev !== 'verified_proof') return false;
      if (filterTab === 'approved' && rev !== 'approved') return false;
      if (filterTab === 'rejected' && rev !== 'rejected') return false;
      if (filterTab === 'fulfilled' && req.status !== 'fulfilled') return false;

      if (districtFilter !== 'all' && req.district.toLowerCase() !== districtFilter.toLowerCase()) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const hay = [
          req.title,
          req.beneficiaryName,
          req.category,
          req.district,
          req.location,
          req.contactPhone,
          req.story,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [requests, filterTab, districtFilter, searchTerm]);

  const openLightboxForItem = (req: SocietyHelpRequest, startIndex = 0, proofsFirst = true) => {
    const proofItems = (req.proofs || []).map((p) => ({
      url: p.imageUrl,
      title: `Proof: ${p.label || p.proofType}`,
      subtitle: `${p.proofType} · Uploaded ${formatDateShort(p.uploadedAt)}`,
    }));
    const photoItems = (req.images || []).map((url, idx) => ({
      url,
      title: `Case Photo ${idx + 1}: ${req.title}`,
      subtitle: `${req.beneficiaryName} · ${req.district}`,
    }));
    const items = proofsFirst ? [...proofItems, ...photoItems] : [...photoItems, ...proofItems];
    if (items.length === 0) {
      onToast?.('No photos or proof documents attached to this appeal yet.', 'info');
      return;
    }
    setLightboxState({
      items,
      index: Math.max(0, Math.min(startIndex, items.length - 1)),
    });
  };

  const openReviewModal = (req: SocietyHelpRequest) => {
    setReviewingItem(req);
    setModalReviewStatus(req.reviewStatus || 'pending_review');
    setModalAppealStatus(req.status || 'open');
    setModalProofVerifiedNote(req.proofVerifiedNote || '');
    setModalAdminReviewNote(req.adminReviewNote || '');
  };

  const handleQuickReview = async (
    req: SocietyHelpRequest,
    nextReviewStatus: SocietyReviewStatus,
    nextStatus?: SocietyHelpStatus
  ) => {
    try {
      const updated = await api.adminReviewSocietyRequest(req, {
        reviewStatus: nextReviewStatus,
        status: nextStatus || req.status,
      });
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      const labelMap: Record<SocietyReviewStatus, string> = {
        verified_proof: 'Proof marked Verified by Admin.',
        approved: 'Appeal Approved by Admin.',
        rejected: 'Appeal Hidden / Rejected by Admin.',
        pending_review: 'Appeal moved back to Pending Review.',
      };
      onToast?.(
        nextStatus === 'fulfilled' ? 'Appeal marked Fulfilled.' : labelMap[nextReviewStatus],
        nextReviewStatus === 'rejected' ? 'info' : 'success'
      );
    } catch (err: any) {
      onToast?.(err?.message || 'Failed to update Admin review.', 'error');
    }
  };

  const handleSaveReviewModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingItem) return;
    setIsSavingReview(true);
    try {
      const updated = await api.adminReviewSocietyRequest(reviewingItem, {
        reviewStatus: modalReviewStatus,
        status: modalAppealStatus,
        proofVerifiedNote: modalProofVerifiedNote.trim(),
        adminReviewNote: modalAdminReviewNote.trim(),
      });
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      onToast?.('Society appeal moderation & notes saved!', 'success');
      setReviewingItem(null);
    } catch (err: any) {
      onToast?.(err?.message || 'Failed to save review notes.', 'error');
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeletingId(deleteTarget.id);
    try {
      await api.deleteSocietyRequest(deleteTarget.id);
      setRequests((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      onToast?.('Society appeal permanently deleted by Admin.', 'info');
      setDeleteTarget(null);
    } catch (err: any) {
      onToast?.(err?.message || 'Failed to delete Society appeal.', 'error');
    } finally {
      setIsDeletingId(null);
    }
  };

  const getReviewChip = (req: SocietyHelpRequest) => {
    if (req.reviewStatus === 'verified_proof') {
      return {
        label: 'Proof Verified',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    if (req.reviewStatus === 'approved') {
      return {
        label: 'Approved',
        cls: 'bg-sky-50 text-sky-700 border-sky-200',
      };
    }
    if (req.reviewStatus === 'rejected') {
      return {
        label: 'Rejected / Hidden',
        cls: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    }
    return {
      label: req.updatedAfterReview ? 'Updated · Re-Review Needed' : 'Pending Admin Review',
      cls: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">
                HUTA IN Society — Appeal Review & Admin Moderation
              </h3>
              <p className="text-xs text-gray-500">
                Inspect proof documents, verify genuine medical/education appeals, approve or hide submissions, and permanently remove invalid posts. Requesters can update details/proofs, but only Admin can delete.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-600">
            <span
              className={`w-2 h-2 rounded-full ${
                liveStatus === 'live'
                  ? 'bg-emerald-500'
                  : liveStatus === 'reconnecting'
                  ? 'bg-amber-500'
                  : 'bg-gray-400'
              }`}
            />
            <span>{liveStatus === 'live' ? 'Live Sync' : liveStatus === 'reconnecting' ? 'Syncing' : 'Offline'}</span>
          </span>
          <button
            type="button"
            disabled={isRefreshing}
            onClick={handleManualSync}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-700 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#FF5A36] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Appeals</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80">
          <div className="text-[11px] font-semibold text-gray-500">Total Appeals</div>
          <div className="text-xl font-black text-gray-900 mt-0.5 tabular-nums">{stats.total}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
          <div className="text-[11px] font-semibold text-amber-800">Pending Review</div>
          <div className="text-xl font-black text-amber-700 mt-0.5 tabular-nums">{stats.pendingReview}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/80">
          <div className="text-[11px] font-semibold text-orange-800">Edited Re-Reviews</div>
          <div className="text-xl font-black text-orange-700 mt-0.5 tabular-nums">{stats.reReviewNeeded}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
          <div className="text-[11px] font-semibold text-emerald-800">Proof Verified</div>
          <div className="text-xl font-black text-emerald-700 mt-0.5 tabular-nums">{stats.verifiedProof}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80">
          <div className="text-[11px] font-semibold text-rose-800">Rejected / Hidden</div>
          <div className="text-xl font-black text-rose-700 mt-0.5 tabular-nums">{stats.rejected}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80">
          <div className="text-[11px] font-semibold text-sky-800">Fulfilled</div>
          <div className="text-xl font-black text-sky-700 mt-0.5 tabular-nums">{stats.fulfilled}</div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: `All (${stats.total})` },
              { id: 'pending_review', label: `Pending Review (${stats.pendingReview})` },
              { id: 're_review', label: `Edited Re-Review (${stats.reReviewNeeded})` },
              { id: 'verified_proof', label: `Proof Verified (${stats.verifiedProof})` },
              { id: 'approved', label: 'Approved' },
              { id: 'rejected', label: `Hidden (${stats.rejected})` },
              { id: 'fulfilled', label: `Fulfilled (${stats.fulfilled})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterTab === tab.id
                  ? 'bg-[#0A2540] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search beneficiary, title, phone..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-gray-200 text-xs focus:border-[#FF5A36] outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 bg-white outline-none focus:border-[#FF5A36]"
          >
            <option value="all">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Appeals List */}
      {isLoading ? (
        <div className="p-10 text-center text-sm text-gray-500">Loading Society appeals...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-gray-200 text-center space-y-2">
          <HeartHandshake className="w-8 h-8 text-gray-400 mx-auto" />
          <div className="text-sm font-bold text-gray-700">No Society appeals match this filter</div>
          <div className="text-xs text-gray-500">
            Appeals submitted in HUTA IN → Society appear here live for proof inspection and moderation.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const chip = getReviewChip(req);
            const cover = req.images?.[0] || req.proofs?.[0]?.imageUrl || '';
            const proofsCount = Array.isArray(req.proofs) ? req.proofs.length : 0;
            const photosCount = Array.isArray(req.images) ? req.images.length : 0;

            return (
              <div
                key={req.id}
                className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition-all shadow-xs space-y-4"
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Cover & Attachment Quick Launcher */}
                  <div className="w-full lg:w-52 shrink-0 space-y-2">
                    <div
                      onClick={() => openLightboxForItem(req, 0, true)}
                      className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer group"
                    >
                      {cover ? (
                        <img
                          src={cover}
                          alt={req.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs gap-1">
                          <FileCheck2 className="w-6 h-6" />
                          <span>No Images</span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 px-2.5 py-1.5 bg-gradient-to-t from-black/75 to-transparent text-[11px] font-bold text-white flex items-center justify-between">
                        <span>{photosCount} photos</span>
                        <span>{proofsCount} proofs</span>
                      </div>
                    </div>

                    {(proofsCount > 0 || photosCount > 0) && (
                      <button
                        type="button"
                        onClick={() => openLightboxForItem(req, 0, true)}
                        className="w-full py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Proofs ({proofsCount})</span>
                      </button>
                    )}
                  </div>

                  {/* Details & Moderation Info */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`px-2 py-0.5 rounded-md border font-bold ${chip.cls}`}>
                            {chip.label}
                          </span>
                          <span className="font-bold text-[#FF5A36]">{req.category}</span>
                          <span className="text-gray-400">·</span>
                          <span className="inline-flex items-center gap-1 text-gray-600 font-semibold">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span>
                              {req.district}
                              {req.location && req.location !== req.district ? ` (${req.location})` : ''}
                            </span>
                          </span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-500 capitalize font-semibold">
                            Urgency: {req.urgency}
                          </span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-500 capitalize font-semibold">
                            Appeal: {req.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="text-base font-extrabold text-gray-900">{req.title}</h4>
                        <div className="text-xs text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>
                            Beneficiary: <strong className="text-gray-900">{req.beneficiaryName}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{req.contactPhone}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span>{req.offersCount || 0} community help offers</span>
                          </span>
                          {req.neededAmountLkr && req.neededAmountLkr > 0 && (
                            <span>
                              Goal: <strong>{formatLkr(req.neededAmountLkr)}</strong> (Pledged:{' '}
                              {formatLkr(req.receivedAmountLkr)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line line-clamp-3">
                      {req.story}
                    </p>

                    {req.neededItemsSummary && (
                      <div className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200/70">
                        <strong>Needed items:</strong> {req.neededItemsSummary}
                      </div>
                    )}

                    {req.bankOrPayDetails && (
                      <div className="text-xs text-gray-600 bg-slate-50 px-3 py-2 rounded-lg border border-gray-200/70">
                        <strong>Bank / Direct Pay Info:</strong> {req.bankOrPayDetails}
                      </div>
                    )}

                    {req.proofs && req.proofs.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {req.proofs.map((proof, idx) => (
                          <button
                            key={proof.id}
                            type="button"
                            onClick={() => openLightboxForItem(req, idx, true)}
                            className="inline-flex items-center gap-2 p-1.5 pr-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 hover:border-emerald-400 text-left cursor-pointer"
                          >
                            <img
                              src={proof.imageUrl}
                              alt={proof.label}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-[10px] font-bold text-emerald-700 truncate max-w-[140px]">
                                {proof.proofType}
                              </div>
                              <div className="text-[11px] font-semibold text-gray-800 truncate max-w-[140px]">
                                {proof.label}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {(req.proofVerifiedNote || req.adminReviewNote) && (
                      <div className="text-xs bg-sky-50/70 border border-sky-200 rounded-lg px-3 py-2 space-y-0.5 text-sky-900">
                        {req.proofVerifiedNote && (
                          <div>
                            <strong>Proof Note:</strong> {req.proofVerifiedNote}
                          </div>
                        )}
                        {req.adminReviewNote && (
                          <div>
                            <strong>Admin Review Note:</strong> {req.adminReviewNote}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                      <div className="flex flex-wrap items-center gap-2">
                        {req.reviewStatus !== 'verified_proof' && (
                          <button
                            type="button"
                            onClick={() => handleQuickReview(req, 'verified_proof')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verify Proof</span>
                          </button>
                        )}
                        {req.reviewStatus !== 'approved' && req.reviewStatus !== 'verified_proof' && (
                          <button
                            type="button"
                            onClick={() => handleQuickReview(req, 'approved')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        )}
                        {req.reviewStatus !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => handleQuickReview(req, 'rejected')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject / Hide</span>
                          </button>
                        )}
                        {req.status !== 'fulfilled' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickReview(req, req.reviewStatus || 'approved', 'fulfilled')
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Fulfilled</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openReviewModal(req)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Review & Notes</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Permanent Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Admin Review & Notes Modal */}
      {reviewingItem && (
        <div
          onClick={() => setReviewingItem(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSaveReviewModal}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-gray-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-extrabold text-gray-900">
                  Admin Review & Moderation Notes
                </h4>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                  {reviewingItem.title} — {reviewingItem.beneficiaryName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingItem(null)}
                className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Admin Review Decision</label>
                <select
                  value={modalReviewStatus}
                  onChange={(e) => setModalReviewStatus(e.target.value as SocietyReviewStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                >
                  <option value="pending_review">Pending Admin Review</option>
                  <option value="approved">Approved (Visible to Community)</option>
                  <option value="verified_proof">Proof Verified by Admin</option>
                  <option value="rejected">Rejected / Hidden from Public</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Appeal Help Status</label>
                <select
                  value={modalAppealStatus}
                  onChange={(e) => setModalAppealStatus(e.target.value as SocietyHelpStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold bg-white"
                >
                  <option value="open">Open (Needs Help)</option>
                  <option value="partially_helped">Support Receiving (Partially Helped)</option>
                  <option value="fulfilled">Fulfilled / Goal Reached</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Proof Verification Reference Note (Shown publicly under proofs)
              </label>
              <input
                type="text"
                value={modalProofVerifiedNote}
                onChange={(e) => setModalProofVerifiedNote(e.target.value)}
                placeholder="e.g. Hospital diagnosis & GN letter checked by HUTA Admin"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">
                Admin Moderation Note (Reason for rejection / verification comment)
              </label>
              <textarea
                rows={3}
                value={modalAdminReviewNote}
                onChange={(e) => setModalAdminReviewNote(e.target.value)}
                placeholder="e.g. Verified hospital ward contact, or ask requester to attach clear prescription..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewingItem(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingReview}
                className="px-4 py-2 rounded-xl bg-[#0A2540] hover:bg-[#13355B] text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {isSavingReview ? 'Saving...' : 'Save Review Decision'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin-Only Permanent Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          onClick={() => setDeleteTarget(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-rose-200"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-gray-900">
                  Permanently Delete Society Appeal?
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  You are permanently removing <strong>{deleteTarget.title}</strong> ({deleteTarget.beneficiaryName}).
                  {(deleteTarget.offersCount || 0) > 0 && (
                    <span className="block mt-1 text-rose-700 font-semibold">
                      Warning: This appeal has {deleteTarget.offersCount} recorded community help offers. Consider Rejecting/Hiding or Marking Fulfilled instead unless it is spam/fraud.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingId === deleteTarget.id}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {isDeletingId === deleteTarget.id ? 'Deleting...' : 'Yes, Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Proof & Photo Lightbox */}
      {lightboxState && (
        <div
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
              aria-label="Close viewer"
              className="p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white cursor-pointer"
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
                onClick={() =>
                  setLightboxState((prev) =>
                    prev
                      ? { ...prev, index: (prev.index - 1 + prev.items.length) % prev.items.length }
                      : null
                  )
                }
                className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 cursor-pointer"
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
                onClick={() =>
                  setLightboxState((prev) =>
                    prev ? { ...prev, index: (prev.index + 1) % prev.items.length } : null
                  )
                }
                className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="text-center text-xs font-bold text-gray-300">
            {lightboxState.index + 1} / {lightboxState.items.length}
          </div>
        </div>
      )}
    </div>
  );
};
