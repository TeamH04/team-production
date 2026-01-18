// Shared types for the monorepo

// =============================================================================
// API Types (Backend Response Types)
// =============================================================================

export type ApiFile = {
  file_id: string;
  file_name: string;
  object_key: string;
  url?: string | null;
  content_type?: string | null;
};

export type ApiMenu = {
  menu_id: string;
  name: string;
  price?: number | null;
  description?: string | null;
  category?: string | null;
};

export type ApiStore = {
  store_id: string;
  thumbnail_file_id?: string | null;
  thumbnail_file?: ApiFile | null;
  name: string;
  opened_at?: string | null;
  description?: string | null;
  address?: string | null;
  place_id: string;
  opening_hours?: string | null;
  /**
   * 緯度（店舗登録直後は位置情報が未取得の場合があるためオプショナル）
   */
  latitude?: number;
  /**
   * 経度（店舗登録直後は位置情報が未取得の場合があるためオプショナル）
   */
  longitude?: number;
  google_map_url?: string | null;
  is_approved?: boolean;
  category: string;
  budget: string;
  average_rating: number;
  distance_minutes: number;
  tags?: string[];
  image_urls: string[];
  created_at: string;
  updated_at?: string;
  menus?: ApiMenu[];
};

export type ApiReview = {
  review_id: string;
  store_id: string;
  user_id: string;
  rating: number;
  content?: string | null;
  created_at: string;
  likes_count?: number;
  liked_by_me?: boolean;
  menus?: ApiMenu[];
  menu_ids?: string[];
  files?: ApiFile[];
};

export type ApiUser = {
  user_id: string;
  name: string;
  email: string;
  icon_file_id?: string | null;
  icon_url?: string | null;
  provider: string;
  gender?: string | null;
  birthday?: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

export type ApiFavorite = {
  user_id: string;
  store_id: string;
  created_at: string;
  store?: ApiStore | null;
};

export type ReviewSort = 'new' | 'liked';

/**
 * Sort type for shop listings
 * - 'rating-high': Sort by rating descending (highest first)
 * - 'rating-low': Sort by rating ascending (lowest first)
 * - 'name-asc': Sort by name ascending (A to Z)
 * - 'name-desc': Sort by name descending (Z to A)
 * - 'newest': Sort by openedAt descending (newest first)
 * - 'default': Keep original order
 */
export type SortType =
  | 'rating-high'
  | 'rating-low'
  | 'name-asc'
  | 'name-desc'
  | 'newest'
  | 'default';

export type UploadFileInput = {
  file_name: string;
  file_size?: number;
  content_type: string;
};

export type SignedUploadFile = {
  file_id: string;
  object_key: string;
  path: string;
  token: string;
  content_type: string;
};

// =============================================================================
// Frontend Types
// =============================================================================

export type ShopCategory =
  | 'レストラン'
  | 'カフェ・喫茶'
  | 'ベーカリー・パン'
  | 'スイーツ・デザート専門'
  | 'ファストフード・テイクアウト'
  | 'バー・居酒屋'
  | 'ビュッフェ・食べ放題';

export type MoneyBucket = '$' | '$$' | '$$$';

export type ShopMenuItem = {
  id: string;
  name: string;
  category: string;
  price: string;
  description?: string;
};

export type Shop = {
  id: string;
  name: string;
  category: ShopCategory;
  distanceMinutes: number;
  rating: number;
  budget: MoneyBucket;
  createdAt: string;
  openedAt: string;
  description: string;
  address: string;
  placeId: string;
  imageUrl: string;
  imageUrls?: string[];
  tags: string[];
  menu?: ShopMenuItem[];
};

export const MENU_TAB_MAP: Record<ShopCategory, string[]> = {
  レストラン: ['ランチ', 'ディナー', 'ドリンク', 'デザート'],
  'カフェ・喫茶': ['ドリンク', 'フード', 'スイーツ'],
  'ベーカリー・パン': ['惣菜パン', '菓子パン', 'ドリンク'],
  'スイーツ・デザート専門': ['ジェラート', '焼き菓子', 'ドリンク'],
  'ファストフード・テイクアウト': ['メイン', 'サイド', 'ドリンク'],
  'バー・居酒屋': ['おつまみ', 'メイン', 'お酒'],
  'ビュッフェ・食べ放題': ['料理', 'デザート', 'ドリンク'],
};

// =============================================================================
// User Types
// =============================================================================

export type Gender = 'male' | 'female' | 'other';

export type UserProfile = {
  name: string;
  email: string;
  gender?: Gender;
  birthYear?: string;
  birthMonth?: string;
  isProfileRegistered: boolean;
  favoriteGenres?: string[];
};

// =============================================================================
// Review Types
// =============================================================================

export type ReviewFile = {
  id: string;
  fileName: string;
  objectKey: string;
  url?: string;
  contentType?: string | null;
};

export type Review = {
  id: string;
  shopId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  menuItemIds?: string[];
  menuItemName?: string;
  likesCount: number;
  likedByMe: boolean;
  files: ReviewFile[];
};

export type ReviewAsset = {
  uri: string;
  fileName: string;
  contentType: string;
  fileSize?: number;
};

// =============================================================================
// OAuth Types
// =============================================================================

/**
 * OAuth認証プロバイダー
 * 将来的に他のプロバイダー（facebook, twitter, github等）を追加可能
 */
export type OAuthProvider = 'google' | 'apple';

/**
 * OAuth認証のローディング状態
 * - OAuthProvider: 各プロバイダーでの認証処理中
 * - 'guest': ゲストログイン処理中
 * - null: ローディングなし
 */
export type OAuthLoadingState = OAuthProvider | 'guest' | null;

// =============================================================================
// Filter & Sort Types
// =============================================================================

/**
 * ソート順序
 * @see @team/constants/src/sort.ts - SortOrder is defined in @team/constants to avoid duplication
 */

/**
 * 訪問済みフィルター
 */
export type VisitedFilter = 'all' | 'visited' | 'not_visited';
