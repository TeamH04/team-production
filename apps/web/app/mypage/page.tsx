'use client';

import { DEMO_USER } from '@team/constants';
import Link from 'next/link';
import { useCallback, useMemo } from 'react';

import { EmptyState, PageError, PageLoading, ReviewCard } from '../../components';
import { useFavorites, useShops, useUserReviews } from '../../lib/dataSource/hooks';
import { createNavigateToHomeAction } from '../../lib/navigation';
import { REVIEW_LIMITS } from '../../lib/styles';

export default function MyPage() {
  const {
    favoriteIds,
    loading: favoritesLoading,
    error: favoritesError,
    reload: reloadFavorites,
  } = useFavorites();
  const { shops, loading: shopsLoading, error: shopsError, reload: reloadShops } = useShops();
  const {
    reviews: userReviews,
    loading: reviewsLoading,
    error: reviewsError,
    reload: reloadReviews,
  } = useUserReviews(DEMO_USER.id);

  const error = favoritesError || shopsError || reviewsError;

  const handleReload = useCallback(() => {
    reloadFavorites();
    reloadShops();
    reloadReviews();
  }, [reloadFavorites, reloadShops, reloadReviews]);

  const shopNameMap = useMemo(() => new Map(shops.map(shop => [shop.id, shop.name])), [shops]);

  const getShopName = useCallback(
    (shopId: string) => shopNameMap.get(shopId) ?? '不明な店舗',
    [shopNameMap],
  );

  const emptyStateAction = useMemo(() => createNavigateToHomeAction(), []);

  const loading = favoritesLoading || shopsLoading || reviewsLoading;

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError onRetry={handleReload} />;
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <header className='bg-gradient-to-br from-sky-700 via-sky-600 to-indigo-700 text-white'>
        <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10'>
          <p className='text-sm font-semibold uppercase tracking-[0.28em] text-sky-100'>My Page</p>
          <h1 className='mt-2 text-3xl font-bold'>マイページ</h1>
          <p className='mt-2 text-sky-100'>あなたの活動履歴を確認できます</p>
        </div>
      </header>

      <main className='mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10'>
        <div className='grid gap-6 lg:grid-cols-3'>
          <div className='space-y-6 lg:col-span-1'>
            <div className='rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100'>
              <div className='flex items-center gap-4'>
                <div className='flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-2xl font-bold text-white'>
                  {DEMO_USER.name.charAt(0)}
                </div>
                <div>
                  <h2 className='text-lg font-semibold text-slate-900'>{DEMO_USER.name}</h2>
                  <p className='text-sm text-slate-500'>{DEMO_USER.provider}</p>
                </div>
              </div>
              <div className='mt-4 rounded-xl bg-amber-50 p-3 text-center'>
                <p className='text-xs font-semibold text-amber-700'>
                  デモモードで利用中です。データはローカルに保存されます。
                </p>
              </div>
            </div>

            <div className='rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100'>
              <h3 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500'>
                あなたの記録
              </h3>
              <div className='mt-4 grid grid-cols-2 gap-4'>
                <Link
                  href='/favorites'
                  className='rounded-2xl bg-slate-50 p-4 text-center transition hover:bg-slate-100'
                >
                  <p className='text-3xl font-bold text-slate-900'>{favoriteIds.length}</p>
                  <p className='mt-1 text-xs font-semibold text-slate-500'>お気に入り</p>
                </Link>
                <div className='rounded-2xl bg-slate-50 p-4 text-center'>
                  <p className='text-3xl font-bold text-slate-900'>{userReviews.length}</p>
                  <p className='mt-1 text-xs font-semibold text-slate-500'>投稿したレビュー</p>
                </div>
              </div>
            </div>

            <div className='rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100'>
              <h3 className='text-sm font-semibold uppercase tracking-[0.18em] text-slate-500'>
                クイックリンク
              </h3>
              <div className='mt-4 space-y-2'>
                <Link
                  href='/'
                  className='block rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100'
                >
                  お店を探す →
                </Link>
                <Link
                  href='/favorites'
                  className='block rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100'
                >
                  お気に入りを見る →
                </Link>
              </div>
            </div>
          </div>

          <div className='space-y-6 lg:col-span-2'>
            <div className='rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-slate-900'>投稿したレビュー</h3>
                <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600'>
                  {userReviews.length} 件
                </span>
              </div>

              {userReviews.length === 0 ? (
                <div className='mt-6'>
                  <EmptyState
                    title='まだレビューがありません'
                    description='お店を訪れたら、レビューを投稿してみましょう'
                    action={emptyStateAction}
                  />
                </div>
              ) : (
                <div className='mt-4 space-y-4'>
                  {userReviews.slice(0, REVIEW_LIMITS.MAX_VISIBLE_REVIEWS).map(review => (
                    <div key={review.id}>
                      <Link
                        href={`/shop/${review.shopId}`}
                        className='mb-2 block text-sm font-semibold text-sky-700 hover:underline'
                      >
                        {getShopName(review.shopId)}
                      </Link>
                      <ReviewCard review={review} />
                    </div>
                  ))}
                  {userReviews.length > REVIEW_LIMITS.MAX_VISIBLE_REVIEWS && (
                    <p className='text-center text-sm text-slate-500'>
                      他 {userReviews.length - REVIEW_LIMITS.MAX_VISIBLE_REVIEWS} 件のレビュー
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
