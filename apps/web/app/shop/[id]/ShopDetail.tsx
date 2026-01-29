'use client';

import { buildGoogleMapsUrl, formatRating } from '@team/constants';
import { useImageGallery, useShare } from '@team/hooks';
import { BUDGET_LABEL, getShopImages } from '@team/shop-core';
import { colors } from '@team/theme';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

import { ReviewCard } from '../../../components/ReviewCard';
import { ReviewForm } from '../../../components/ReviewForm';
import { useFavorites, useShopReviews } from '../../../lib/dataSource/hooks';
import { REVIEW_LIMITS } from '../../../lib/styles';

import type { Shop } from '@team/shop-core';
import type React from 'react';

type ShopDetailProps = {
  shop: Shop;
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill={filled ? colors.primary : 'none'}
      stroke={filled ? colors.primary : colors.accent}
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      <path d='M12 21s-6-4.35-9-8.7C1.5 9.15 2.25 6 5.25 4.65 7.5 3.6 9.75 4.5 12 7.5c2.25-3 4.5-3.9 6.75-2.85C21.75 6 22.5 9.15 21 12.3 18 16.65 12 21 12 21Z' />
    </svg>
  );
}

export default function ShopDetail({ shop }: ShopDetailProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { share, shareMessage } = useShare();

  const { reviews, addReview, toggleLike, error: reviewsError } = useShopReviews(shop.id);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleReviewSubmit = useCallback(
    async (data: { rating: number; ratingDetails: Record<string, number>; comment: string }) => {
      try {
        await addReview({
          shopId: shop.id,
          rating: data.rating,
          ratingDetails: data.ratingDetails,
          comment: data.comment,
        });
        setShowReviewForm(false);
      } catch (err) {
        console.error('Failed to submit review:', err);
      }
    },
    [shop.id, addReview],
  );

  const handleLikeToggle = useCallback(
    (reviewId: string, currentlyLiked: boolean) => {
      void toggleLike(reviewId, currentlyLiked);
    },
    [toggleLike],
  );

  const imageList = useMemo(() => getShopImages(shop), [shop]);

  const {
    currentIndex: currentImage,
    images,
    totalImages,
    goToImage,
    goToPrevious,
    goToNext,
    hasMultipleImages,
  } = useImageGallery({ images: imageList });

  const mapOpenUrl = useMemo(
    () => buildGoogleMapsUrl(shop.placeId, shop.name),
    [shop.placeId, shop.name],
  );

  const isFav = isFavorite(shop.id);

  const handleShare = useCallback(() => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `${shop.name} | ${shop.category} - ${shop.description}`;
    share({ title: shop.name, text, url });
  }, [shop.name, shop.category, shop.description, share]);

  const handleDotClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const index = Number(e.currentTarget.dataset.index);
      if (Number.isNaN(index)) return;
      goToImage(index);
    },
    [goToImage],
  );

  return (
    <div className='flex flex-col gap-10 lg:flex-row'>
      <section className='flex-1 space-y-6'>
        <div className='relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-100 via-white to-slate-50 shadow-2xl'>
          <div className='relative aspect-[16/10]'>
            <Image
              src={images[currentImage]}
              alt={`${shop.name}の写真 ${currentImage + 1}/${totalImages}`}
              fill
              sizes='(min-width: 1024px) 720px, 100vw'
              className='object-cover'
              priority
            />

            <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent' />
          </div>

          {hasMultipleImages && (
            <>
              <button
                type='button'
                onClick={goToPrevious}
                className='absolute left-5 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-semibold text-slate-800 shadow-lg ring-1 ring-white/60 transition hover:-translate-y-[55%] hover:bg-white'
                aria-label='前の画像へ'
              >
                ←
              </button>
              <button
                type='button'
                onClick={goToNext}
                className='absolute right-5 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-semibold text-slate-800 shadow-lg ring-1 ring-white/60 transition hover:-translate-y-[55%] hover:bg-white'
                aria-label='次の画像へ'
              >
                →
              </button>

              <div className='absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2'>
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type='button'
                    data-index={idx}
                    onClick={handleDotClick}
                    className={`h-2 w-10 rounded-full transition ${
                      idx === currentImage ? 'bg-white' : 'bg-white/40'
                    }`}
                    aria-label={`${idx + 1}番目の画像へ移動`}
                  />
                ))}
              </div>
            </>
          )}

          <div className='absolute left-6 top-6 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-white/60'>
            徒歩{shop.distanceMinutes}分・{BUDGET_LABEL[shop.budget]}
          </div>
        </div>

        <div className='space-y-4'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='space-y-1'>
              <p className='text-xs font-semibold uppercase tracking-[0.24em] text-slate-500'>
                Shop
              </p>
              <h1 className='text-3xl font-bold leading-tight tracking-tight text-slate-900'>
                {shop.name}
              </h1>
              <p className='text-base text-slate-600'>
                {shop.category} / ★ {formatRating(shop.rating)} / {BUDGET_LABEL[shop.budget]}
              </p>
            </div>

            <div className='flex items-center gap-3'>
              <button
                type='button'
                onClick={handleShare}
                className='rounded-full bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-200'
              >
                共有する
              </button>
              <button
                type='button'
                onClick={() => toggleFavorite(shop.id)}
                aria-pressed={isFav}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isFav
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className='inline-flex items-center gap-2'>
                  <HeartIcon filled={isFav} />
                  <span>{isFav ? 'お気に入り済み' : 'お気に入りに追加'}</span>
                </span>
              </button>
            </div>
          </div>

          <p className='text-lg leading-relaxed text-slate-800'>{shop.description}</p>

          {shop.tags.length > 0 && (
            <div className='flex flex-wrap gap-2'>
              {shop.tags.map(tag => (
                <Link
                  key={tag}
                  href={`/?q=${encodeURIComponent(tag)}`}
                  className='rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-200'
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {shop.menu?.length ? (
            <div className='rounded-2xl bg-slate-50/80 p-5 ring-1 ring-slate-100'>
              <div className='flex items-center justify-between'>
                <h2 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-600'>
                  おすすめメニュー
                </h2>
                <span className='text-xs font-semibold text-slate-400'>Pick up</span>
              </div>
              <ul className='mt-3 grid gap-2 sm:grid-cols-2'>
                {shop.menu.map(item => (
                  <li
                    key={item.id}
                    className='flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-100'
                  >
                    <span>{item.name}</span>
                    <span className='text-xs text-slate-400'>人気</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <aside className='w-full max-w-xl space-y-4 rounded-3xl bg-white p-6 text-slate-900 shadow-xl ring-1 ring-slate-100 lg:sticky lg:top-10'>
        <div className='flex items-start justify-between gap-2'>
          <div>
            <p className='text-xs uppercase tracking-[0.2em] text-slate-500'>Overview</p>
            <h2 className='text-2xl font-semibold text-slate-900'>{shop.name}</h2>
          </div>
          <span className='rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100'>
            ★ {formatRating(shop.rating)}
          </span>
        </div>

        <dl className='grid grid-cols-2 gap-3 text-sm sm:grid-cols-3'>
          <div className='rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100'>
            <dt className='text-xs text-slate-500'>ジャンル</dt>
            <dd className='text-base font-semibold text-slate-900'>{shop.category}</dd>
          </div>
          <div className='rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100'>
            <dt className='text-xs text-slate-500'>距離</dt>
            <dd className='text-base font-semibold text-slate-900'>徒歩{shop.distanceMinutes}分</dd>
          </div>
          <div className='rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100'>
            <dt className='text-xs text-slate-500'>予算</dt>
            <dd className='text-base font-semibold text-slate-900'>{BUDGET_LABEL[shop.budget]}</dd>
          </div>
        </dl>

        <div className='space-y-2 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100'>
          <p className='text-sm font-semibold text-slate-900'>場所</p>
          <p className='text-xs text-slate-600'>Google Maps で位置を確認できます。</p>
          <a
            href={mapOpenUrl}
            target='_blank'
            rel='noreferrer'
            className='block w-full rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800'
          >
            マップで開く
          </a>
        </div>

        <div className='space-y-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100'>
          <div className='flex items-center justify-between'>
            <p className='text-sm font-semibold text-slate-900'>レビュー</p>
            <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600'>
              {reviews.length} 件
            </span>
          </div>

          {reviewsError && <p className='text-sm text-red-600'>レビューの読み込みに失敗しました</p>}

          {showReviewForm ? (
            <ReviewForm
              shopId={shop.id}
              onSubmit={handleReviewSubmit}
              onCancel={() => setShowReviewForm(false)}
            />
          ) : (
            <button
              type='button'
              onClick={() => setShowReviewForm(true)}
              className='w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800'
            >
              レビューを書く
            </button>
          )}

          {reviews.length > 0 && (
            <div className='space-y-3'>
              {reviews.slice(0, REVIEW_LIMITS.MAX_SIDEBAR_REVIEWS).map(review => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onLikeToggle={() => handleLikeToggle(review.id, review.likedByMe)}
                />
              ))}
              {reviews.length > REVIEW_LIMITS.MAX_SIDEBAR_REVIEWS && (
                <p className='text-center text-xs text-slate-500'>
                  他 {reviews.length - REVIEW_LIMITS.MAX_SIDEBAR_REVIEWS} 件のレビュー
                </p>
              )}
            </div>
          )}
        </div>

        <div className='rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100'>
          <p className='text-sm font-semibold text-slate-900'>シェア</p>
          <p className='mt-1 text-sm text-slate-700'>
            共有リンクをコピーして友人や同僚にお店を紹介できます。
          </p>
          <button
            type='button'
            onClick={handleShare}
            className='mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100'
          >
            リンクを共有する
          </button>
          {shareMessage && (
            <p className='mt-2 text-xs font-semibold text-emerald-600'>{shareMessage}</p>
          )}
        </div>
      </aside>
    </div>
  );
}
