/**
 * Next.js コンポーネントのモック
 */
import type { ReactNode } from 'react';

// 共有パッケージから createLocalStorageMock を re-export
export { createLocalStorageMock } from '@team/test-utils';

/**
 * next/image のモック設定
 * vi.mock('next/image', () => nextImageMock) として使用
 */
export const nextImageMock = {
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    <img src={src} alt={alt} className={className} />
  ),
};

/**
 * next/link のモック設定
 * vi.mock('next/link', () => nextLinkMock) として使用
 */
export const nextLinkMock = {
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
};
