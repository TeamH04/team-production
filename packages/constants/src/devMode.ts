/**
 * Development mode utilities
 *
 * Platform-specific __DEV__ detection:
 * - React Native: Uses global __DEV__ variable
 * - Node.js/Web: Uses NODE_ENV !== 'production'
 */

// Platform-agnostic development mode detection
declare const __DEV__: boolean | undefined;

const isDevEnvironment = (): boolean => {
  // React Native provides __DEV__ global
  if (typeof __DEV__ !== 'undefined') {
    return __DEV__;
  }
  // Fallback for Node.js/Web environments
  return process.env.NODE_ENV !== 'production';
};

export const IS_DEV = isDevEnvironment();

// Environment variable for dev login feature
const DEV_LOGIN_ENV = process.env.EXPO_PUBLIC_ENABLE_DEV_MODE;

export const DEV_LOGIN_ENABLED = DEV_LOGIN_ENV === 'true' && IS_DEV;
export const DEV_GUEST_FLAG_KEY = 'dev_guest_login';
