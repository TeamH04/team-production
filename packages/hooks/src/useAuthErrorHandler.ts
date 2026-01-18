import { AUTH_REQUIRED, ERROR_MESSAGES } from '@team/constants';
import { extractErrorMessage } from '@team/core-utils';
import { useCallback } from 'react';

const DEFAULT_ERROR_MESSAGE = ERROR_MESSAGES.UNKNOWN;

export interface AuthErrorHandlerOptions {
  onAuthRequired?: () => void;
  defaultMessage?: string;
}

export interface AuthErrorHandler {
  handleError: (error: unknown, options?: AuthErrorHandlerOptions) => string | null;
  isAuthError: (error: unknown) => boolean;
  getErrorMessage: (error: unknown) => string;
}

export function useAuthErrorHandler(): AuthErrorHandler {
  const getErrorMessage = useCallback((error: unknown): string => {
    return extractErrorMessage(error, DEFAULT_ERROR_MESSAGE);
  }, []);

  const isAuthError = useCallback(
    (error: unknown): boolean => {
      const message = getErrorMessage(error);
      return message === AUTH_REQUIRED;
    },
    [getErrorMessage],
  );

  const handleError = useCallback(
    (error: unknown, options?: AuthErrorHandlerOptions): string | null => {
      const message = getErrorMessage(error);

      if (message === AUTH_REQUIRED) {
        options?.onAuthRequired?.();
        return null;
      }

      return options?.defaultMessage ?? message;
    },
    [getErrorMessage],
  );

  return {
    handleError,
    isAuthError,
    getErrorMessage,
  };
}
