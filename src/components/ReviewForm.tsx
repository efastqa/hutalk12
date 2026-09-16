import React, { useState } from 'react';
import { Star, Send, ShieldCheck, User, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ListingReview } from '../types';
import { api } from '../services/api';

interface ReviewFormProps {
  listingId: string;
  sellerName?: string;
  onReviewAdded: (review: ListingReview, newRating?: number, newCount?: number) => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  listingId,
  sellerName,
  onReviewAdded,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [authorName, setAuthorName] = useState('');
  const [comment, setComment] = useState('');
  const [verifiedBuyer, setVerifiedBuyer] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg('Please share a few words about your experience with this seller / listing.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.addReview(listingId, {
        authorName: authorName.trim() || 'Verified Customer',
        rating,
        comment: comment.trim(),
        verifiedBuyer,
      });

      setSuccessMsg('Thank you! Your review and rating have been posted.');
      setComment('');
      setIsExpanded(false);

      if (res && res.review) {
        onReviewAdded(res.review, res.listing?.sellerRating, res.listing?.reviewCount);
      }

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 transition-all">
      {!isExpanded ? (
        <div className="flex items-center justify-between gap-3">
          <div>
            <h5 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>Have you purchased or contacted this seller?</span>
            </h5>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Help Sri Lankan buyers with honest feedback & seller ratings
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="shrink-0 px-3.5 py-1.5 bg-white hover:bg-orange-50 text-[#FF5A36] border border-orange-200 text-xs font-bold rounded-xl transition-all shadow-2xs hover:scale-102 cursor-pointer"
          >
            Leave Review
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
            <h5 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>Review for {sellerName || 'Direct Seller'}</span>
            </h5>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-[11px] text-gray-400 hover:text-gray-600 font-medium cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Star Selector */}
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">
              Select Rating:
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 text-gray-300 hover:scale-115 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        filled ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="text-xs font-bold text-gray-700 ml-2">
                {rating === 5 && 'Excellent (5.0)'}
                {rating === 4 && 'Good (4.0)'}
                {rating === 3 && 'Average (3.0)'}
                {rating === 2 && 'Below Average (2.0)'}
                {rating === 1 && 'Poor Experience (1.0)'}
              </span>
            </div>
          </div>

          {/* Author Name */}
          <div>
            <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1">
              <User className="w-3 h-3 text-gray-400" />
              <span>Your Name / City (Optional)</span>
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="e.g. Ruwan from Colombo"
              className="w-full text-xs p-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/20 outline-none"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1">
              <MessageSquare className="w-3 h-3 text-gray-400" />
              <span>Your Review & Feedback (Required)</span>
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe condition of the item, promptness of phone/WhatsApp replies, smooth transaction, etc."
              className="w-full text-xs p-2.5 rounded-xl border border-gray-200 bg-white focus:border-[#FF5A36] focus:ring-2 focus:ring-[#FF5A36]/20 outline-none"
              required
            />
          </div>

          {/* Verified Buyer Checkbox */}
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={verifiedBuyer}
              onChange={(e) => setVerifiedBuyer(e.target.checked)}
              className="rounded text-[#FF5A36] focus:ring-[#FF5A36]"
            />
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              I personally communicated with or inspected this listing
            </span>
          </label>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-3.5 py-1.5 text-xs text-gray-500 font-medium hover:text-gray-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#FF5A36] hover:bg-[#E04826] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Posting...' : 'Post Review'}</span>
            </button>
          </div>
        </form>
      )}

      {successMsg && (
        <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};
