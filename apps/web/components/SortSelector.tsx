'use client';

interface SortOption<T extends string> {
  label: string;
  value: T;
}

interface SortSelectorProps<T extends string> {
  options: readonly SortOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SortSelector<T extends string>({ options, value, onChange }: SortSelectorProps<T>) {
  return (
    <div className='flex flex-wrap gap-2'>
      {options.map(option => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type='button'
            onClick={() => onChange(option.value)}
            aria-pressed={isSelected}
            className={`min-h-[44px] rounded-full px-4 py-2 text-xs font-semibold transition sm:min-h-0 sm:px-3 sm:py-1.5 ${
              isSelected
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
