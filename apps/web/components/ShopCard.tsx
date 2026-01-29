'use client';

import { formatRating } from '@team/constants';
import { BUDGET_LABEL } from '@team/shop-core';
import Image from 'next/image';
import Link from 'next/link';
import { type MouseEvent, memo } from 'react';

import type { WebShopCardProps } from '@team/types';

export const ShopCard = memo(function ShopCard({
  shop,
  onTagClick,
  showFavoriteButton = false,
  isFavorite = false,
  onFavoriteToggle,
  priority = false,
}: WebShopCardProps) {
  const handleTagClick = (event: MouseEvent, tag: string) => {
    event.preventDefault();
    onTagClick?.(tag);
  };

  const handleFavoriteClick = (event: MouseEvent) => {
    event.preventDefault();
    onFavoriteToggle?.();
  };

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
          priority={priority}
        />
        <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent' />
        <div className='absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-800 shadow'>
          {shop.category}
        </div>
        {showFavoriteButton && (
          <button
            type='button'
            onClick={handleFavoriteClick}
            className='absolute right-4 top-4 rounded-full bg-white/85 p-2 shadow transition hover:bg-white'
            aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
          >
            <span className={`text-lg ${isFavorite ? 'text-rose-500' : 'text-slate-400'}`}>
              {isFavorite ? '♥' : '♡'}
            </span>
          </button>
        )}
        <div className='absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-semibold text-white'>
          <span>徒歩{shop.distanceMinutes}分</span>
          <span>{BUDGET_LABEL[shop.budget]}</span>
        </div>
      </div>

      <div className='space-y-3 p-4'>
        <div className='flex items-start justify-between gap-3'>
          <h3 className='text-lg font-semibold text-slate-900'>{shop.name}</h3>
          <span className='rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700'>
            ★ {formatRating(shop.rating)}
          </span>
        </div>
        <p className='line-clamp-2 text-sm text-slate-600'>{shop.description}</p>
        <div className='flex flex-wrap gap-2'>
          {shop.tags.slice(0, 3).map(tag => (
            <button
              key={tag}
              type='button'
              onClick={event => handleTagClick(event, tag)}
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
});
