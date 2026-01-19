import { TIMING } from '@team/constants';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Options for share function
 */
export type ShareOptions = {
  /** Title for the share dialog */
  title?: string;
  /** Text content to share */
  text?: string;
  /** URL to share */
  url?: string;
};

/**
 * Result of useShare hook
 */
export type UseShareResult = {
  /** Execute share with given options */
  share: (options: ShareOptions) => Promise<void>;
  /** Result message after share attempt */
  shareMessage: string;
  /** Whether share is in progress */
  isSharing: boolean;
  /** Whether Web Share API is supported */
  canShare: boolean;
  /** Whether clipboard API is supported */
  canCopyToClipboard: boolean;
  /** Clear the share message immediately */
  clearMessage: () => void;
};

/**
 * Messages for share results
 */
const SHARE_MESSAGES = {
  SUCCESS: '共有しました',
  COPIED: 'リンクをコピーしました',
  UNSUPPORTED: 'お使いの環境では共有できませんでした',
  ERROR: '共有に失敗しました',
} as const;

/**
 * Check if Web Share API is available
 */
function checkCanShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * Check if Clipboard API is available
 */
function checkCanCopyToClipboard(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function';
}

/**
 * Hook for sharing content across platforms.
 *
 * Features:
 * - Uses Web Share API when available (mobile browsers, etc.)
 * - Falls back to clipboard copy when Web Share is not available
 * - Shows appropriate message based on share result
 * - Auto-clears message after TIMING.TOAST_DURATION
 *
 * @example
 * ```tsx
 * const { share, shareMessage, isSharing } = useShare();
 *
 * const handleShare = () => {
 *   share({
 *     title: 'Shop Name',
 *     text: 'Check out this shop!',
 *     url: 'https://example.com/shop/123',
 *   });
 * };
 * ```
 */
export function useShare(): UseShareResult {
  const [shareMessage, setShareMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearMessageTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearMessageTimeout, [clearMessageTimeout]);

  const clearMessage = useCallback(() => {
    clearMessageTimeout();
    setShareMessage('');
  }, [clearMessageTimeout]);

  const setMessageWithAutoClear = useCallback(
    (message: string) => {
      clearMessageTimeout();
      setShareMessage(message);
      timeoutRef.current = setTimeout(() => {
        setShareMessage('');
      }, TIMING.TOAST_DURATION);
    },
    [clearMessageTimeout],
  );

  const share = useCallback(
    async (options: ShareOptions): Promise<void> => {
      const { title, text, url } = options;

      if (isSharing) return;

      setIsSharing(true);

      try {
        // Try Web Share API first
        if (checkCanShare()) {
          await navigator.share({ title, text, url });
          setMessageWithAutoClear(SHARE_MESSAGES.SUCCESS);
          return;
        }

        // Fall back to clipboard
        if (checkCanCopyToClipboard() && url) {
          await navigator.clipboard.writeText(url);
          setMessageWithAutoClear(SHARE_MESSAGES.COPIED);
          return;
        }

        // No sharing method available
        setMessageWithAutoClear(SHARE_MESSAGES.UNSUPPORTED);
      } catch (error) {
        // User cancelled share or error occurred
        // AbortError is thrown when user cancels, don't show error message
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        setMessageWithAutoClear(SHARE_MESSAGES.ERROR);
      } finally {
        setIsSharing(false);
      }
    },
    [isSharing, setMessageWithAutoClear],
  );

  return {
    share,
    shareMessage,
    isSharing,
    canShare: checkCanShare(),
    canCopyToClipboard: checkCanCopyToClipboard(),
    clearMessage,
  };
}
