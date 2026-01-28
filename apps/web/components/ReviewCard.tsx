'use client';

import { buildRatingBadges } from '@team/constants';
import { formatDateJa } from '@team/core-utils';
import { memo } from 'react';

import type { WebReviewCardProps } from '@team/types';

const SENTIMENT_COLORS = {
  satisfied: 'text-emerald-600',
  neutral: 'text-slate-500',
  dissatisfied: 'text-rose-500',
} as const;

export const ReviewCard = memo(function ReviewCard({ review, onLikeToggle }: WebReviewCardProps) {
  return (
    <div className='rounded-2xl bg-white p-4 shadow ring-1 ring-slate-100'>
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600'>
            {review.userName.charAt(0)}
          </div>
          <div>
            <p className='font-semibold text-slate-900'>{review.userName}</p>
            <p className='text-xs text-slate-500'>{formatDateJa(review.createdAt)}</p>
          </div>
        </div>
        <div className='flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1'>
          <span className='text-amber-600'>★</span>
          <span className='text-sm font-semibold text-amber-700'>{review.rating.toFixed(1)}</span>
        </div>
      </div>

      {review.ratingDetails && (
        <div className='mt-3 flex flex-wrap gap-2'>
          {buildRatingBadges(review.ratingDetails).map(badge => (
            <span
              key={badge.key}
              className={`flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs ${SENTIMENT_COLORS[badge.sentiment]}`}
            >
              <span>{badge.label}</span>
              <span>{badge.displayLabel}</span>
            </span>
          ))}
        </div>
      )}

      {review.comment && <p className='mt-3 text-sm text-slate-700'>{review.comment}</p>}

      <div className='mt-3 flex items-center gap-4'>
        <button
          type='button'
          onClick={onLikeToggle}
          className={`flex items-center gap-1 text-sm transition ${
            review.likedByMe ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'
          }`}
        >
          <span>{review.likedByMe ? '♥' : '♡'}</span>
          <span>{review.likesCount}</span>
        </button>
      </div>
    </div>
  );
});
