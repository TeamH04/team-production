'use client';

import {
  BUDGET_LABEL,
  CATEGORIES,
  filterShops,
  SHOPS,
  type Shop,
  type ShopCategory,
} from '@team/shop-core';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type CategoryFilter = ShopCategory | typeof CATEGORY_ALL;

const CATEGORY_ALL = 'すべて';
const CATEGORY_OPTIONS: CategoryFilter[] = [CATEGORY_ALL, ...[...CATEGORIES].sort()];
const PAGE_SIZE = 9;

export default function HomePageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchText, setSearchText] = useState(() => searchParams.get('q') ?? '');
  const [isComposing, setIsComposing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(CATEGORY_ALL);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (isComposing) return;
    const handle = setTimeout(() => {
      const query = searchText.trim();
      const target = query.length > 0 ? `${pathname}?q=${encodeURIComponent(query)}` : pathname;
      router.replace(target, { scroll: false });
      setVisibleCount(PAGE_SIZE);
    }, 180);

    return () => clearTimeout(handle);
  }, [isComposing, pathname, router, searchText]);

  const normalizedQuery = searchText.trim();

  const filteredShops = useMemo(() => {
    return filterShops(SHOPS, {
      query: normalizedQuery,
      category: selectedCategory === CATEGORY_ALL ? null : selectedCategory,
    });
  }, [normalizedQuery, selectedCategory]);

  const visibleShops = filteredShops.slice(0, visibleCount);
  const hasMore = visibleCount < filteredShops.length;

  const handleCategoryClick = (category: CategoryFilter) => {
    setSelectedCategory(current => (current === category ? CATEGORY_ALL : category));
    setVisibleCount(PAGE_SIZE);
  };

  const handleLoadMore = () => {
    if (!hasMore) return;
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredShops.length));
  };

  const handleTagClick = (tag: string) => {
    setSelectedCategory(CATEGORY_ALL);
    setSearchText(tag);
  };

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
              <span className='rounded-full bg-white/15 px-4 py-2'>全 {SHOPS.length} 件</span>
              <span className='rounded-full bg-white/15 px-4 py-2'>レビュー近日公開</span>
            </div>
          </div>
          <div className='flex flex-1 justify-end'>
            <div className='relative h-60 w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl ring-1 ring-white/20 backdrop-blur'>
              <div className='relative h-full w-full overflow-hidden rounded-2xl bg-white/5'>
                <Image
                  src={SHOPS[0].imageUrl}
                  alt={`${SHOPS[0].name}の写真`}
                  fill
                  className='object-cover'
                  sizes='(min-width: 1024px) 360px, 100vw'
                  priority
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent' />
                <div className='absolute bottom-4 left-4 right-4 flex items-center justify-between text-sm font-semibold text-white'>
                  <span>{SHOPS[0].name}</span>
                  <span>徒歩{SHOPS[0].distanceMinutes}分</span>
                </div>
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
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={event => {
                  setIsComposing(false);
                  setSearchText(event.currentTarget.value);
                }}
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

        <div className='mb-4 flex items-center justify-between'>
          <div className='text-sm font-semibold text-slate-700'>
            検索結果 {filteredShops.length} 件
            {normalizedQuery && (
              <span className='text-slate-400'>（キーワード: {searchText}）</span>
            )}
          </div>
          <p className='text-xs text-slate-500'>カードをクリックすると詳細ページへ遷移します。</p>
        </div>

        {filteredShops.length === 0 ? (
          <div className='rounded-3xl bg-white p-10 text-center shadow-lg ring-1 ring-slate-100'>
            <h3 className='text-xl font-semibold text-slate-900'>条件に合うお店が見つかりません</h3>
            <p className='mt-2 text-sm text-slate-600'>
              キーワードを変えるか、カテゴリを切り替えて別の候補を探してみてください。
            </p>
          </div>
        ) : (
          <>
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {visibleShops.map(shop => (
                <ShopCard key={shop.id} shop={shop} onTagClick={handleTagClick} />
              ))}
            </div>

            {hasMore && (
              <div className='mt-8 flex justify-center'>
                <button
                  type='button'
                  onClick={handleLoadMore}
                  className='rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800'
                >
                  もっと見る
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ShopCard({ shop, onTagClick }: { shop: Shop; onTagClick: (tag: string) => void }) {
  return (
    <Link
      href={`/shop/${shop.id}`}
      className='group relative overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl'
    >
      <div className='relative aspect-[4/3] overflow-hidden'>
        <Image
          src={shop.imageUrl}
          alt={`${shop.name}の写真`}
          fill
          className='object-cover transition duration-700 group-hover:scale-105'
          sizes='(min-width: 1024px) 320px, 100vw'
          priority={shop.id === SHOPS[0].id}
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent' />
        <div className='absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-800 shadow'>
          {shop.category}
        </div>
        <div className='absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-semibold text-white'>
          <span>徒歩{shop.distanceMinutes}分</span>
          <span>{BUDGET_LABEL[shop.budget]}</span>
        </div>
      </div>

      <div className='space-y-3 p-4'>
        <div className='flex items-start justify-between gap-3'>
          <h3 className='text-lg font-semibold text-slate-900'>{shop.name}</h3>
          <span className='rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700'>
            ★ {shop.rating.toFixed(1)}
          </span>
        </div>
        <p className='line-clamp-2 text-sm text-slate-600'>{shop.description}</p>
        <div className='flex flex-wrap gap-2'>
          {shop.tags.slice(0, 3).map(tag => (
            <button
              key={tag}
              type='button'
              onClick={event => {
                event.preventDefault();
                onTagClick(tag);
              }}
              className='rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200'
            >
              #{tag}
            </button>
          ))}
          {shop.tags.length > 3 && (
            <span className='text-xs font-semibold text-slate-400'>+{shop.tags.length - 3}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
