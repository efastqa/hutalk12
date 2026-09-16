import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, Send, Phone, User, FileText } from 'lucide-react';
import { Listing, ListingReport } from '../types';
import { api } from '../services/api';

interface ReportModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_REASONS: { value: ListingReport['reason']; label: string; description: string }[] = [
  {
    value: 'fraud_scam',
    label: 'Suspected Scam / Fraud',
    description: 'Fake seller, advance payment requested, or fraudulent information.',
  },
  {
    value: 'already_sold',
    label: 'Already Sold / Unavailable',
    description: 'Seller confirmed item or vehicle is already sold or no longer available.',
  },
  {
    value: 'incorrect_price',
    label: 'Incorrect or Misleading Price',
    description: 'Listed price is intentionally fake, bait-and-switch, or wrong currency.',
  },
  {
    value: 'duplicate',
    label: 'Duplicate / Spam Posting',
    description: 'Repeatedly posted or multiple spam copies of the same listing.',
  },
  {
    value: 'prohibited_item',
    label: 'Prohibited / Illegal Content',
    description: 'Violates Sri Lankan regulations, banned goods, or inappropriate material.',
  },
  {
    value: 'other',
    label: 'Other Issue',
    description: 'Wrong contact number, inaccurate specifications, or other concerns.',
  },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  listing,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState<ListingReport['reason']>('fraud_scam');
  const [details, setDetails] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      setErrorMsg('Please provide a brief explanation so our moderation team can take action.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await api.reportListing(listing.id, {
        listingTitle: listing.title,
        reason: selectedReason,
        details: details.trim(),
        reporterContact: reporterContact.trim() || undefined,
      });

      setIsSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => {
        setIsSubmitted(false);
        setDetails('');
        setReporterContact('');
        onClose();
      }, 2200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-rose-500 to-rose-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight leading-tight">Report Advertisement</h3>
                <p className="text-rose-100 text-xs line-clamp-1 mt-0.5">{listing.title}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors cursor-pointer text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isSubmitted ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-gray-900">Thank You for Keeping HUTA Safe</h4>
              <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                Your report has been logged with our marketplace moderation team. If this listing violates community standards, it will be removed promptly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <p className="text-xs text-gray-500 leading-relaxed">
                HUTA.lk is committed to safe, verified marketplace transactions across Sri Lanka. Select the reason you believe this listing requires review:
              </p>

              {/* Reasons Radio List */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Select Reason
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedReason === r.value
                          ? 'border-rose-500 bg-rose-50/50 text-rose-950 font-medium'
                          : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={r.value}
                        checked={selectedReason === r.value}
                        onChange={() => setSelectedReason(r.value)}
                        className="mt-0.5 accent-rose-600"
                      />
                      <div>
                        <div className="font-bold">{r.label}</div>
                        <div className="text-[11px] text-gray-500 font-normal mt-0.5">{r.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Explanation Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                  <span>Explain the issue (Required)</span>
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="e.g. Seller is asking for Rs 5,000 upfront deposit before meeting in person, or phone number doesn't match..."
                  className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                  required
                />
              </div>

              {/* Reporter Contact (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-500" />
                    <span>Your Phone or Email (Optional)</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">For follow-up only</span>
                </label>
                <input
                  type="text"
                  value={reporterContact}
                  onChange={(e) => setReporterContact(e.target.value)}
                  placeholder="07X XXXXXXX or email@domain.com"
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
