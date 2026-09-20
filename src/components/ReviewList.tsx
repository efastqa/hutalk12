import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, User, MessageCircle, ThumbsUp } from 'lucide-react';
import { ListingReview } from '../types';
import { api } from '../services/api';

interface ReviewListProps {
  listingId: string;
  reviews?: ListingReview[];
  sellerRating?: number;
  reviewCount?: number;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  listingId,
  reviews: initialReviews,
  sellerRating,
  reviewCount,
}) => {
  const [reviews, setReviews] = useState<ListingReview[]>(initialReviews || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialReviews && initialReviews.length > 0) {
      setReviews(initialReviews);
    } else {
      setLoading(true);
      api.getListingReviews(listingId)
        .then((data) => setReviews(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [listingId, initialReviews]);

  const avgRating = sellerRating || (
    reviews.length > 0
      ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10) / 10
      : 5.0
  );

  const totalCount = reviewCount !== undefined ? reviewCount : reviews.length;

  return (
    <div className="space-y-3">
      {/* Rating Header summary */}
      <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-400/20 text-amber-900 flex flex-col items-center justify-center font-black">
            <span className="text-base leading-none">{avgRating.toFixed(1)}</span>
            <span className="text-[9px] uppercase font-bold text-amber-700">out of 5</span>
          </div>
          <div>
            <div className="flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(avgRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-gray-800 ml-1">
                {totalCount > 0 ? `${totalCount} Customer Feedback${totalCount > 1 ? 's' : ''}` : 'No reviews yet'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Verified community experiences & seller trust score
            </p>
          </div>
        </div>
      </div>

      {/* Review cards */}
      {loading ? (
        <div className="space-y-2 py-2">
          {[1, 2].map((i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-xl animate-pulse space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-4 px-3 bg-gray-50/70 rounded-xl border border-dashed border-gray-200 text-xs text-gray-500">
          Be the first buyer or inquirer to share a review for this seller!
        </div>
      ) : (
        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-3 rounded-xl bg-white border border-gray-100 shadow-2xs hover:border-gray-200 transition-all text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-[#FF5A36] font-bold flex items-center justify-center text-[11px]">
                    {((rev.authorName || 'U').trim().charAt(0) || 'U').toUpperCase()}
                  </div>
                  <span className="font-bold text-gray-900">{rev.authorName}</span>
                  {rev.verifiedBuyer && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 ml-1">{rev.date}</span>
                </div>
              </div>

              <p className="text-gray-700 text-xs leading-relaxed pl-7">
                "{rev.comment}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
