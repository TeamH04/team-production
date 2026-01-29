'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'ホーム' },
  { href: '/favorites', label: 'お気に入り' },
  { href: '/mypage', label: 'マイページ' },
] as const;

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className='border-b border-slate-200 bg-white/90 backdrop-blur-sm'>
      <div className='mx-auto flex max-w-6xl items-center justify-between px-6 py-3 lg:px-10'>
        <Link href='/' className='text-slate-900'>
          <img src='/kaguri.svg' alt='Kuguriロゴ' width={120} height={32} className='h-8' />
        </Link>
        <div className='flex gap-1'>
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
