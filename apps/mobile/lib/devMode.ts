const DEV_LOGIN_ENV = process.env.EXPO_PUBLIC_ENABLE_DEV_MODE;

declare const __DEV__: boolean;

export const DEV_LOGIN_ENABLED = DEV_LOGIN_ENV === 'true' && __DEV__;
export const DEV_GUEST_FLAG_KEY = 'dev_guest_login';
