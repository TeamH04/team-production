'use client';

type PageErrorProps = {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function PageError({
  message = 'データの読み込みに失敗しました',
  onRetry,
  retryLabel = '再試行',
}: PageErrorProps) {
  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='mx-auto max-w-6xl px-6 py-12 lg:px-10'>
        <div className='text-center'>
          <p className='text-red-600 font-semibold'>{message}</p>
          {onRetry && (
            <button
              type='button'
              onClick={onRetry}
              className='mt-4 rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800'
            >
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
