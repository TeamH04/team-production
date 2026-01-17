import '@testing-library/jest-dom/vitest';
import { createLocalStorageMock } from '@team/test-utils';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// React Testing Library のクリーンアップ
afterEach(() => {
  cleanup();
});

// localStorage モック（vi.fn でラップしてスパイ検証を可能に）
const { mock: localStorageMock } = createLocalStorageMock({ mockFn: vi.fn });

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// next/navigation モック
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));
