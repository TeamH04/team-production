// Shared types for the monorepo

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
