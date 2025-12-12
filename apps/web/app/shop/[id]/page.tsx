import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SHOPS } from '@team/shop-core';

import ShopDetail from './ShopDetail';

type ShopPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return SHOPS.map(shop => ({ id: shop.id }));
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { id } = await params;
  const shopId = decodeURIComponent(id).trim();
  const shop = SHOPS.find(entry => entry.id === shopId);

  return {
    title: shop ? `${shop.name} | 店舗詳細` : '店舗詳細',
    description: shop?.description ?? '気になる店舗の詳細ページです。',
  };
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { id } = await params;
  const shopId = decodeURIComponent(id).trim();
  const shop = SHOPS.find(entry => entry.id === shopId);

  if (!shop) {
    notFound();
  }

  return (
    <div className='min-h-screen bg-slate-50 pb-16'>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pt-10 lg:px-10'>
        <Link href='/' className='text-sm font-semibold text-sky-700 transition hover:text-sky-900'>
          ← 店舗一覧へ戻る
        </Link>

        <div className='overflow-hidden rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-slate-100 backdrop-blur'>
          <ShopDetail shop={shop} />
        </div>
      </div>
    </div>
  );
}
