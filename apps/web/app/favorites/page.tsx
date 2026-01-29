'use client';

import { FAVORITES_SORT_OPTIONS, WEB_PAGE_SIZE, type FavoritesSortType } from '@team/constants';
import { useCompositionInput, useLocalStorage, usePagination, useShopFilter } from '@team/hooks';
import { favoriteSortToSortType } from '@team/shop-core';
import { useCallback, useMemo } from 'react';

import { LoadMoreButton, PageError, PageLoading } from '../../components';
import { EmptyState } from '../../components/EmptyState';
import { ShopCard } from '../../components/ShopCard';
import { SortSelector } from '../../components/SortSelector';
import { useFavoriteShops } from '../../lib/dataSource/hooks';
import { createNavigateToHomeAction } from '../../lib/navigation';

export default function FavoritesPage() {
  const {
    shops: favoriteShops,
    favoriteIds,
    loading,
    error,
    toggleFavorite,
    reload,
  } = useFavoriteShops();
  const [sortType, setSortType] = useLocalStorage<FavoritesSortType>(
    'favorites-sort-type',
    'newest',
  );

  const {
    value: searchText,
    setValue: setSearchText,
    compositionHandlers,
  } = useCompositionInput({ initialValue: '' });

  const { filteredShops } = useShopFilter({
    shops: favoriteShops,
    searchText: searchText.trim(),
    sortType: favoriteSortToSortType(sortType),
  });

  const {
    visibleItems: visibleShops,
    hasMore,
    loadMore,
  } = usePagination(filteredShops, { pageSize: WEB_PAGE_SIZE });

  const handleFavoriteToggle = useCallback(
    (shopId: string) => {
      void toggleFavorite(shopId);
    },
    [toggleFavorite],
  );

  const emptyStateAction = useMemo(() => createNavigateToHomeAction(), []);

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError onRetry={reload} />;
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <header className='bg-gradient-to-br from-sky-700 via-sky-600 to-indigo-700 text-white'>
        <div className='mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10'>
          <p className='text-sm font-semibold uppercase tracking-[0.28em] text-sky-100'>
            Favorites
          </p>
          <h1 className='mt-2 text-3xl font-bold'>お気に入り</h1>
          <p className='mt-2 text-sky-100'>保存したお店を確認できます</p>
        </div>
      </header>

      <main className='mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10'>
        {favoriteIds.length === 0 ? (
          <EmptyState
            title='お気に入りがありません'
            description='気になるお店を見つけたら、ハートボタンでお気に入りに追加しましょう'
            action={emptyStateAction}
          />
        ) : (
          <>
            <div className='mb-8 rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <p className='text-sm font-semibold text-slate-700'>
                    {favoriteIds.length} 件のお気に入り
                  </p>
                </div>
                <input
                  value={searchText}
                  onChange={event => setSearchText(event.target.value)}
                  {...compositionHandlers}
                  placeholder='お気に入りから検索'
                  className='w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 sm:max-w-xs'
                />
              </div>
              <div className='mt-4'>
                <SortSelector
                  options={FAVORITES_SORT_OPTIONS}
                  value={sortType}
                  onChange={setSortType}
                />
              </div>
            </div>

            {filteredShops.length === 0 ? (
              <EmptyState
                title='検索結果がありません'
                description='別のキーワードで検索してみてください'
              />
            ) : (
              <>
                <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                  {visibleShops.map(shop => (
                    <ShopCard
                      key={shop.id}
                      shop={shop}
                      showFavoriteButton
                      isFavorite
                      onFavoriteToggle={() => handleFavoriteToggle(shop.id)}
                    />
                  ))}
                </div>

                <LoadMoreButton onClick={loadMore} visible={hasMore} />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
