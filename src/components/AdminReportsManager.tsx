import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Clock, Trash2, ExternalLink, Filter, AlertTriangle, UserCheck } from 'lucide-react';
import { ListingReport, Listing } from '../types';
import { api } from '../services/api';

interface AdminReportsManagerProps {
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
  onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminReportsManager: React.FC<AdminReportsManagerProps> = ({
  listings,
  onSelectListing,
  onToast,
}) => {
  const [reports, setReports] = useState<ListingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'>('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminReports();
      setReports(data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleStatusChange = async (reportId: string, status: ListingReport['status']) => {
    setIsUpdating(reportId);
    try {
      await api.updateReportStatus(reportId, status);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
      if (onToast) onToast(`Report marked as ${status}`, 'success');
    } catch (err: any) {
      if (onToast) onToast(err?.message || 'Failed to update report status', 'error');
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-900 to-rose-800 rounded-2xl p-6 text-white flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-rose-300" />
            </span>
            <h3 className="text-xl font-black">Community Trust & Listing Reports</h3>
          </div>
          <p className="text-xs text-rose-200 mt-1 max-w-xl">
            Review user-flagged scams, sold ads, price discrepancies, and prohibited content reported across Sri Lanka.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-xs">
          <Clock className="w-4 h-4 text-amber-300" />
          <span>{pendingCount} Pending Action</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap border-b border-gray-100 pb-3">
        {(['all', 'pending', 'reviewed', 'resolved', 'dismissed'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilterStatus(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
              filterStatus === tab
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab} {tab === 'all' ? `(${reports.length})` : tab === 'pending' ? `(${pendingCount})` : ''}
          </button>
        ))}
      </div>

      {/* Reports Content List */}
      {loading ? (
        <div className="space-y-3 py-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-2xl animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12 px-4 bg-gray-50/60 rounded-3xl border border-dashed border-gray-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-gray-800">Clean Marketplace Record</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {filterStatus === 'all'
              ? 'No member reports have been logged yet. All active advertisements comply with HUTA standards.'
              : `No reports currently in the "${filterStatus}" queue.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const matchedListing = listings.find((l) => l.id === report.listingId);

            return (
              <div
                key={report.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-gray-300 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        report.reason === 'fraud_scam'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : report.reason === 'already_sold'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}
                    >
                      {report.reason.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-gray-900 line-clamp-1">
                      {report.listingTitle || `Listing ID: ${report.listingId}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400">{report.date}</span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        report.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : report.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                </div>

                {/* Report Details & Reporter info */}
                <div className="text-xs text-gray-700 space-y-1">
                  <p className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-gray-800 font-medium leading-relaxed">
                    "{report.details}"
                  </p>
                  {report.reporterContact && (
                    <p className="text-[11px] text-gray-500 pt-1">
                      Reporter contact: <strong className="text-gray-700">{report.reporterContact}</strong>
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                  <div>
                    {matchedListing ? (
                      <button
                        type="button"
                        onClick={() => onSelectListing(matchedListing)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5A36] hover:underline cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Inspect Live Advertisement</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">
                        Listing may have been removed
                      </span>
                    )}
                  </div>

                  {/* Status buttons */}
                  <div className="flex items-center gap-1.5">
                    {report.status !== 'resolved' && (
                      <button
                        type="button"
                        disabled={isUpdating === report.id}
                        onClick={() => handleStatusChange(report.id, 'resolved')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                    {report.status !== 'dismissed' && (
                      <button
                        type="button"
                        disabled={isUpdating === report.id}
                        onClick={() => handleStatusChange(report.id, 'dismissed')}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    )}
                    {report.status !== 'reviewed' && report.status === 'pending' && (
                      <button
                        type="button"
                        disabled={isUpdating === report.id}
                        onClick={() => handleStatusChange(report.id, 'reviewed')}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Mark In Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
