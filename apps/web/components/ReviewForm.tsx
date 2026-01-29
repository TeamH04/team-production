'use client';

import { RATING_CATEGORIES } from '@team/constants';
import { type FormEvent, useState } from 'react';

interface ReviewFormProps {
  shopId: string;
  onSubmit: (review: {
    rating: number;
    ratingDetails: Record<string, number>;
    comment: string;
  }) => void | Promise<void>;
  onCancel: () => void;
}

const StarRating = ({
  value,
  onChange,
  size = 'normal',
}: {
  value: number;
  onChange: (v: number) => void;
  size?: 'normal' | 'large';
}) => (
  <div className='flex gap-1'>
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type='button'
        onClick={() => onChange(star)}
        className={`transition hover:scale-110 ${
          star <= value ? 'text-amber-400' : 'text-slate-300'
        } ${size === 'large' ? 'text-3xl' : 'text-xl'}`}
      >
        ★
      </button>
    ))}
  </div>
);

export function ReviewForm({ shopId, onSubmit, onCancel }: ReviewFormProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [ratingDetails, setRatingDetails] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingDetailChange = (key: string, value: number) => {
    setRatingDetails(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (overallRating === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        rating: overallRating,
        ratingDetails,
        comment,
      });
    } catch (error) {
      console.error('Failed to submit review:', error);
      // Error is handled by the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div>
        <label className='mb-2 block text-sm font-semibold text-slate-700'>総合評価 *</label>
        <StarRating value={overallRating} onChange={setOverallRating} size='large' />
      </div>

      <div className='space-y-3'>
        <p className='text-sm font-semibold text-slate-700'>項目別評価（任意）</p>
        <div className='grid gap-3 sm:grid-cols-2'>
          {RATING_CATEGORIES.map(category => (
            <div key={category.key} className='flex items-center justify-between gap-2'>
              <span className='text-sm text-slate-600'>{category.label}</span>
              <StarRating
                value={ratingDetails[category.key] ?? 0}
                onChange={v => handleRatingDetailChange(category.key, v)}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor={`review-comment-${shopId}`}
          className='mb-2 block text-sm font-semibold text-slate-700'
        >
          コメント（任意）
        </label>
        <textarea
          id={`review-comment-${shopId}`}
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={4}
          className='w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100'
          placeholder='お店の感想を書いてください...'
        />
      </div>

      <div className='flex gap-3'>
        <button
          type='button'
          onClick={onCancel}
          className='flex-1 rounded-full bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200'
        >
          キャンセル
        </button>
        <button
          type='submit'
          disabled={overallRating === 0 || isSubmitting}
          className='flex-1 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isSubmitting ? '投稿中...' : '投稿する'}
        </button>
      </div>
    </form>
  );
}
