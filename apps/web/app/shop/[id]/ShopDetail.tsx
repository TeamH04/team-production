'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { Shop } from '@team/shop-core';

const FAVORITE_STORAGE_KEY = 'shop-web-favorites';

const BUDGET_LABEL: Record<Shop['budget'], string> = {
  $: '\u00a5',
  $$: '\u00a5\u00a5',
  $$$: '\u00a5\u00a5\u00a5',
};

type ShopDetailProps = {
  shop: Shop;
};

export default function ShopDetail({ shop }: ShopDetailProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [shareUrl, setShareUrl] = useState('');
  const [shareMessage, setShareMessage] = useState('');

  const images = useMemo(
    () => (shop.imageUrls?.length ? shop.imageUrls : [shop.imageUrl]),
    [shop.imageUrl, shop.imageUrls]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setShareUrl(window.location.href);

    try {
      const stored = window.localStorage.getItem(FAVORITE_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch {
      setFavorites([]);
    }
  }, [shop.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = favorites.includes(shop.id);

  const goToImage = (index: number) => {
    setCurrentImage((index + images.length) % images.length);
  };

  const handleShare = async () => {
    const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const text = `${shop.name} | ${shop.category} - ${shop.description}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: shop.name, text, url });
        setShareMessage('共有しました');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareMessage('リンクをコピーしました');
      } else {
        setShareMessage('お使いの環境では共有できませんでした');
      }
    } catch {
      setShareMessage('共有に失敗しました');
    } finally {
      setTimeout(() => setShareMessage(''), 2400);
    }
  };

  const toggleFavorite = () => {
    setFavorites(prev =>
      prev.includes(shop.id) ? prev.filter(id => id !== shop.id) : [...prev, shop.id]
    );
  };

  return (
    <div className='flex flex-col gap-10 lg:flex-row'>
      <section className='flex-1 space-y-6'>
        <div className='relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-100 via-white to-slate-50 shadow-2xl'>
          <div className='relative aspect-[16/10]'>
            <Image
              src={images[currentImage]}
              alt={`${shop.name}の写真 ${currentImage + 1}/${images.length}`}
              fill
              sizes='(min-width: 1024px) 720px, 100vw'
              className='object-cover'
              priority
            />

            <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent' />
          </div>

          {images.length > 1 && (
            <>
              <button
                type='button'
                onClick={() => goToImage(currentImage - 1)}
                className='absolute left-5 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-semibold text-slate-800 shadow-lg ring-1 ring-white/60 transition hover:-translate-y-[55%] hover:bg-white'
                aria-label='前の画像へ'
              >
                ←
              </button>
              <button
                type='button'
                onClick={() => goToImage(currentImage + 1)}
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
                    onClick={() => goToImage(idx)}
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
                {shop.category} / ★ {shop.rating.toFixed(1)} / {BUDGET_LABEL[shop.budget]}
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
                onClick={toggleFavorite}
                aria-pressed={isFavorite}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isFavorite
                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isFavorite ? '♥ お気に入り済み' : '♡ お気に入りに追加'}
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
            ★ {shop.rating.toFixed(1)}
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
          <div className='flex items-center justify-between'>
            <p className='text-sm font-semibold text-slate-900'>レビュー</p>
            <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600'>
              Coming soon
            </span>
          </div>
          <p className='text-sm leading-6 text-slate-700'>
            Webでもレビューを投稿できるように準備中です。気に入ったポイントをメモしておきましょう。
          </p>
          <button
            type='button'
            className='w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800'
          >
            レビューを書く（近日公開）
          </button>
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
