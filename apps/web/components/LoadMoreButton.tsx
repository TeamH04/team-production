'use client';

import { memo } from 'react';

type LoadMoreButtonProps = {
  onClick: () => void;
  label?: string;
  visible?: boolean;
};

export const LoadMoreButton = memo(function LoadMoreButton({
  onClick,
  label = 'もっと見る',
  visible = true,
}: LoadMoreButtonProps) {
  if (!visible) return null;

  return (
    <div className='mt-8 flex justify-center'>
      <button
        type='button'
        onClick={onClick}
        className='rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800'
      >
        {label}
      </button>
    </div>
  );
});
