'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NAV_ITEMS } from '../lib/navigation';

import type React from 'react';

const ICONS: Record<string, (active: boolean) => React.ReactNode> = {
  '/': active => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill={active ? 'currentColor' : 'none'}
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' />
      <polyline points='9 22 9 12 15 12 15 22' />
    </svg>
  ),
  '/favorites': active => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill={active ? 'currentColor' : 'none'}
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M12 21s-6-4.35-9-8.7C1.5 9.15 2.25 6 5.25 4.65 7.5 3.6 9.75 4.5 12 7.5c2.25-3 4.5-3.9 6.75-2.85C21.75 6 22.5 9.15 21 12.3 18 16.65 12 21 12 21Z' />
    </svg>
  ),
  '/mypage': active => (
    <svg
      width='24'
      height='24'
      viewBox='0 0 24 24'
      fill={active ? 'currentColor' : 'none'}
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
      <circle cx='12' cy='7' r='4' />
    </svg>
  ),
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className='fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-sm md:hidden'>
      <div className='flex items-center justify-around'>
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
                isActive ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              <span className='text-lg'>{ICONS[item.href]?.(isActive)}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
