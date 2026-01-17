import { useState, useCallback, useMemo } from 'react';

export interface UsePaginationOptions {
  pageSize: number;
  initialVisible?: number;
}

export interface UsePaginationResult<T> {
  visibleItems: T[];
  visibleCount: number;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions,
): UsePaginationResult<T> {
  const { pageSize, initialVisible = pageSize } = options;
  const [visibleCount, setVisibleCount] = useState(initialVisible);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  const hasMore = visibleCount < items.length;

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + pageSize, items.length));
  }, [pageSize, items.length]);

  const reset = useCallback(() => {
    setVisibleCount(initialVisible);
  }, [initialVisible]);

  return { visibleItems, visibleCount, hasMore, loadMore, reset };
}
