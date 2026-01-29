'use client';

import { TIMING, UI_LABELS, WEB_PAGE_SIZE } from '@team/constants';
import { useCompositionInput, usePagination, useShopFilter } from '@team/hooks';
import { CATEGORIES, type ShopCategory } from '@team/shop-core';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { EmptyState, LoadMoreButton, PageError, PageLoading } from '../components';
import { ShopCard } from '../components/ShopCard';
import { SortSelector } from '../components/SortSelector';
import { useShops } from '../lib/dataSource/hooks';

import type { SortType } from '@team/types';

const SORT_OPTIONS = [
  { label: 'おすすめ', value: 'default' as const },
  { label: '新着順', value: 'newest' as const },
  { label: '評価が高い順', value: 'rating-high' as const },
  { label: '評価が低い順', value: 'rating-low' as const },
] satisfies { label: string; value: SortType }[];

type CategoryFilter = ShopCategory | typeof CATEGORY_ALL;

const CATEGORY_ALL = UI_LABELS.ALL;
const CATEGORY_OPTIONS: CategoryFilter[] = [CATEGORY_ALL, ...[...CATEGORIES].sort()];

export default function HomePageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { shops, loading, error, reload } = useShops();

  const {
    value: searchText,
    setValue: setSearchText,
    isComposing,
    compositionHandlers,
  } = useCompositionInput({
    initialValue: searchParams.get('q') ?? '',
  });
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(CATEGORY_ALL);
  const [sortType, setSortType] = useState<SortType>('default');

  const normalizedQuery = searchText.trim();

  const { filteredShops } = useShopFilter({
    shops,
    searchText: normalizedQuery,
    categories: selectedCategory === CATEGORY_ALL ? [] : [selectedCategory],
    sortType,
  });

  const {
    visibleItems: visibleShops,
    hasMore,
    loadMore: handleLoadMore,
    reset: resetPagination,
  } = usePagination(filteredShops, { pageSize: WEB_PAGE_SIZE });

  useEffect(() => {
    if (isComposing) return;
    const handle = setTimeout(() => {
      const query = searchText.trim();
      const target = query.length > 0 ? `${pathname}?q=${encodeURIComponent(query)}` : pathname;
      router.replace(target, { scroll: false });
      resetPagination();
    }, TIMING.DEBOUNCE_SEARCH);

    return () => clearTimeout(handle);
  }, [isComposing, pathname, router, searchText, resetPagination]);

  const handleCategoryClick = useCallback(
    (category: CategoryFilter) => {
      setSelectedCategory(current => (current === category ? CATEGORY_ALL : category));
      resetPagination();
    },
    [resetPagination],
  );

  const handleTagClick = useCallback(
    (tag: string) => {
      setSelectedCategory(CATEGORY_ALL);
      setSearchText(tag);
    },
    [setSearchText],
  );

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageError onRetry={reload} />;
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <header className='relative overflow-hidden bg-gradient-to-br from-sky-700 via-sky-600 to-indigo-700 text-white'>
        <div className='absolute -left-10 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl' />
        <div className='absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl' />
        <div className='mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 lg:flex-row lg:items-center lg:px-10'>
          <div className='flex-1 space-y-4'>
            <p className='text-sm font-semibold uppercase tracking-[0.28em] text-sky-100'>
              Shop Discovery
            </p>
            <h1 className='text-4xl font-bold leading-tight tracking-tight lg:text-5xl'>
              次に通いたくなるお店を見つけよう
            </h1>
            <p className='text-lg text-sky-100'>
              カフェからレストラン、バーまで、カテゴリとキーワードで探せます。気になるお店をクリックすると詳細ページへ移動します。
            </p>
            <div className='flex flex-wrap gap-3 text-sm font-semibold'>
              <span className='rounded-full bg-white/15 px-4 py-2'>全 {shops.length} 件</span>
              <span className='rounded-full bg-white/15 px-4 py-2'>レビュー近日公開</span>
            </div>
          </div>
          <div className='flex flex-1 justify-end'>
            <div className='relative h-60 w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl ring-1 ring-white/20 backdrop-blur'>
              <div className='relative h-full w-full overflow-hidden rounded-2xl bg-white/5'>
                {shops[0] && (
                  <>
                    <Image
                      src={shops[0].imageUrl}
                      alt={`${shops[0].name}の写真`}
                      fill
                      className='object-cover'
                      sizes='(min-width: 1024px) 360px, 100vw'
                      priority
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent' />
                    <div className='absolute bottom-4 left-4 right-4 flex items-center justify-between text-sm font-semibold text-white'>
                      <span>{shops[0].name}</span>
                      <span>徒歩{shops[0].distanceMinutes}分</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-6xl px-6 py-12 lg:px-10'>
        <div className='mb-8 rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-400'>
                Filters
              </p>
              <h2 className='text-2xl font-bold text-slate-900'>店舗を検索</h2>
            </div>
            <p className='text-sm text-slate-500'>
              検索ワードとカテゴリを組み合わせて絞り込めます。
            </p>
          </div>

          <div className='mt-5 grid gap-4'>
            <label className='relative block'>
              <input
                value={searchText}
                onChange={event => setSearchText(event.target.value)}
                {...compositionHandlers}
                placeholder='お店名・雰囲気・タグで検索'
                className='w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100'
              />
              {searchText.length > 0 && (
                <button
                  type='button'
                  onClick={() => setSearchText('')}
                  className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200'
                >
                  クリア
                </button>
              )}
            </label>

            <div className='flex flex-wrap gap-2'>
              {CATEGORY_OPTIONS.map(category => {
                const isSelected = category === selectedCategory;
                return (
                  <button
                    key={category}
                    type='button'
                    onClick={() => handleCategoryClick(category)}
                    aria-pressed={isSelected}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='text-sm font-semibold text-slate-700'>
            検索結果 {filteredShops.length} 件
            {normalizedQuery && (
              <span className='text-slate-400'>（キーワード: {searchText}）</span>
            )}
          </div>
          <SortSelector options={SORT_OPTIONS} value={sortType} onChange={setSortType} />
        </div>

        {filteredShops.length === 0 ? (
          <EmptyState
            title='条件に合うお店が見つかりません'
            description='キーワードを変えるか、カテゴリを切り替えて別の候補を探してみてください。'
          />
        ) : (
          <>
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {visibleShops.map((shop, index) => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  onTagClick={handleTagClick}
                  priority={index === 0}
                />
              ))}
            </div>

            <LoadMoreButton onClick={handleLoadMore} visible={hasMore} />
          </>
        )}
      </main>
    </div>
  );
}
