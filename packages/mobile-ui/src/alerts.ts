/**
 * Common alert utilities for mobile applications.
 */
import { AUTH_ERROR_MESSAGES, UI_LABELS } from '@team/constants';
import { Alert } from 'react-native';

/**
 * Shows an alert prompting user to login when authentication is required.
 * @param message - The specific auth error message to display
 * @param onLogin - Callback function to handle login navigation
 */
export const showAuthRequiredAlert = (message: string, onLogin: () => void): void => {
  Alert.alert(AUTH_ERROR_MESSAGES.LOGIN_REQUIRED_TITLE, message, [
    { text: UI_LABELS.CANCEL, style: 'cancel' },
    { text: UI_LABELS.LOGIN, onPress: onLogin },
  ]);
};
