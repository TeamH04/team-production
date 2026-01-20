import { UI_LABELS } from './ui-labels';

import type { VisitedFilter } from '@team/types';

export { MOBILE_PAGE_SIZE, WEB_PAGE_SIZE, DEFAULT_PAGE_SIZE } from './pagination';
export { DEFAULT_API_BASE_URL, AUTH_REQUIRED, SESSION_NOT_FOUND } from './api';
export { ROUTES, buildGoogleMapsUrl } from './routes';
export { formatRating, formatPrice } from './formatting';
export {
  BORDER_RADIUS,
  SPACING,
  ICON_SIZE,
  FONT_SIZE,
  TIMING,
  FONT_WEIGHT,
  LAYOUT,
  type BorderRadiusKey,
  type SpacingKey,
  type IconSizeKey,
  type FontSizeKey,
  type TimingKey,
  type FontWeightKey,
  type LayoutKey,
} from './design-tokens';
export {
  VALIDATION_SUCCESS,
  createValidationError,
  validatePositiveInteger,
  validateRange,
  EMAIL_VALIDATION_REGEX,
  isValidEmail,
  formatDateInput,
  isValidDateYYYYMMDD,
  PASSWORD_MIN_LENGTH,
  validatePassword,
  validateRequiredString,
  type ValidationResult,
} from './validation';
export { ERROR_MESSAGES, VALIDATION_MESSAGES } from './messages';
export { GENRES, toggleGenre, type Genre } from './genres';
export { IS_DEV, DEV_LOGIN_ENABLED, DEV_GUEST_FLAG_KEY } from './devMode';
export { STORAGE_KEYS, type StorageKey } from './storage';
export { AUTH_ERROR_MESSAGES, type AuthErrorMessageKey } from './authMessages';
export { SHADOW_STYLES } from './styles';
export { UI_LABELS, type UILabelKey } from './ui-labels';
export {
  SORT_OPTIONS,
  FAVORITES_SORT_OPTIONS,
  SEARCH_SORT_OPTIONS,
  type SortOption,
  type SortOptionValue,
  type SortOrder,
  type FavoritesSortType,
  type FavoritesSortOption,
  type SearchSortType,
  type SearchSortOption,
} from './sort';
export { ENV_KEYS, createEnvConfig, type EnvConfig, type EnvKey } from './env';
export { OAUTH_CONFIG } from './oauth';
export { REVIEW_CONFIG, RATING_CATEGORIES, type RatingCategoryKey } from './review';
export { ROLES, type RoleType } from './roles';

/**
 * 検索履歴の最大保存件数
 */
export const SEARCH_HISTORY_MAX = 10;

/**
 * 推奨メニューの表示数
 */
export const RECOMMENDED_MENU_COUNT = 2;

/**
 * 訪問済みフィルターオプション
 */
export const VISITED_FILTER_OPTIONS: { label: string; value: VisitedFilter }[] = [
  { label: UI_LABELS.ALL, value: 'all' },
  { label: '訪問済み', value: 'visited' },
  { label: '未訪問', value: 'not_visited' },
];
