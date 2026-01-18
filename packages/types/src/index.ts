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

export type ApiRatingDetails = {
  taste?: number | null;
  atmosphere?: number | null;
  service?: number | null;
  speed?: number | null;
  cleanliness?: number | null;
};

export type ApiReview = {
  review_id: string;
  store_id: string;
  user_id: string;
  rating: number;
  rating_details?: ApiRatingDetails | null;
  content?: string | null;
  created_at: string;
  likes_count?: number;
  liked_by_me?: boolean;
  menus?: ApiMenu[];
  menu_ids?: string[];
  files?: ApiFile[];
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

export type RatingDetails = {
  taste: number;
  atmosphere: number;
  service: number;
  speed: number;
  cleanliness: number;
};

export type Shop = {
  id: string;
  name: string;
  category: ShopCategory;
  distanceMinutes: number;
  rating: number;
  ratingDetails?: RatingDetails;
  budget: MoneyBucket;
  createdAt: string;
  openedAt: string;
  description: string;
  address: string;
  placeId: string;
  imageUrl: string;
  imageUrls?: string[];
  area?: string;
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
