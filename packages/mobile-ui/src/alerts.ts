/**
 * Common alert utilities for mobile applications.
 */
import { AUTH_ERROR_MESSAGES, ROUTES } from '@team/constants';
import { Alert } from 'react-native';

type Router = {
  push: (route: string) => void;
};

/**
 * Shows an alert prompting user to login when authentication is required.
 * @param message - The specific auth error message to display
 * @param router - The router instance to handle navigation
 */
export const showAuthRequiredAlert = (message: string, router: Router): void => {
  Alert.alert(AUTH_ERROR_MESSAGES.LOGIN_REQUIRED_TITLE, message, [
    { text: 'キャンセル', style: 'cancel' },
    { text: 'ログイン', onPress: () => router.push(ROUTES.LOGIN) },
  ]);
};
