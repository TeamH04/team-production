import { createSafeContext } from '@team/core-utils';
import { useVisitedState } from '@team/hooks';

import type { UseVisitedStateResult } from '@team/hooks';
import type { ReactNode } from 'react';

// コンテキストで外部に渡す機能の一覧
type VisitedContextValue = UseVisitedStateResult;

const [VisitedContextProvider, useVisited] = createSafeContext<VisitedContextValue>('Visited');

export { useVisited };

export function VisitedProvider({ children }: { children: ReactNode }) {
  const visitedState = useVisitedState();

  return <VisitedContextProvider value={visitedState}>{children}</VisitedContextProvider>;
}
