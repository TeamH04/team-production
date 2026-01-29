'use client';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  loading?: boolean;
}

export function EmptyState({ title, description, action, loading }: EmptyStateProps) {
  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <div className='text-slate-500'>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className='rounded-3xl bg-white p-10 text-center shadow-lg ring-1 ring-slate-100'>
      <h3 className='text-xl font-semibold text-slate-900'>{title}</h3>
      {description && <p className='mt-2 text-sm text-slate-600'>{description}</p>}
      {action && (
        <button
          type='button'
          onClick={action.onClick}
          className='mt-4 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800'
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
