'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをログに記録（本番環境ではエラー追跡サービスに送信可能）
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className='min-h-screen bg-slate-50 flex items-center justify-center px-4'>
      <div className='max-w-md w-full text-center'>
        <div className='bg-white rounded-2xl shadow-lg p-8'>
          {/* エラーアイコン */}
          <div className='w-16 h-16 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center'>
            <svg
              className='w-8 h-8 text-slate-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
              />
            </svg>
          </div>

          {/* エラーメッセージ */}
          <h1 className='text-xl font-semibold text-slate-900 mb-2'>エラーが発生しました</h1>
          <p className='text-slate-600 mb-6'>
            申し訳ございません。予期せぬエラーが発生しました。
            <br />
            もう一度お試しください。
          </p>

          {/* エラーダイジェスト（開発時のデバッグ用） */}
          {error.digest && (
            <p className='text-xs text-slate-400 mb-6'>エラーコード: {error.digest}</p>
          )}

          {/* リトライボタン */}
          <button
            onClick={reset}
            className='inline-flex items-center justify-center px-6 py-3 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2'
          >
            もう一度試す
          </button>
        </div>
      </div>
    </div>
  );
}
