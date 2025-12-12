import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-slate-50 px-6 py-20'>
      <div className='max-w-md rounded-3xl bg-white p-10 text-center shadow-2xl ring-1 ring-slate-100'>
        <p className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>
          404 Not Found
        </p>
        <h1 className='mt-2 text-2xl font-bold text-slate-900'>店舗が見つかりませんでした</h1>
        <p className='mt-3 text-sm leading-6 text-slate-600'>
          ページが削除されたか、URL
          が正しくない可能性があります。店舗一覧からあらためてお探しください。
        </p>
        <div className='mt-8 flex flex-col gap-3'>
          <Link
            href='/'
            className='inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-700'
          >
            店舗一覧へ戻る
          </Link>
          <Link
            href='/shop/shop-1'
            className='inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-slate-200'
          >
            人気の店舗を見る
          </Link>
        </div>
      </div>
    </div>
  );
}
