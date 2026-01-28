'use client';

type PageLoadingProps = {
  message?: string;
};

export function PageLoading({ message = '読み込み中...' }: PageLoadingProps) {
  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='mx-auto max-w-6xl px-6 py-12 lg:px-10'>
        <div className='text-center text-slate-500'>{message}</div>
      </div>
    </div>
  );
}
