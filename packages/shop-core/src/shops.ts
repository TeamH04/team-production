export type ShopCategory =
  | 'レストラン'
  | 'カフェ・喫茶'
  | 'ベーカリー・パン'
  | 'スイーツ・デザート専門'
  | 'ファストフード・テイクアウト'
  | 'バー・居酒屋'
  | 'ビュッフェ・食べ放題';

export interface Shop {
  id: string;
  name: string;
  category: ShopCategory;
  distanceMinutes: number;
  rating: number;
  budget: '$' | '$$' | '$$$';
  createdAt: string; // アプリに追加した日
  openedAt: string; // 実際のオープン日
  description: string;
  placeId: string;
  imageUrl: string;
  imageUrls?: string[]; // 複数画像対応
  tags: string[];
  menu?: { id: string; name: string }[];
}

type ShopVariant = {
  key: string;
  label: string;
  distanceDelta: number;
  ratingDelta: number;
  createdOffsetDays: number;
};

// NOTE: This is a shared placeholder Google Place ID used for demo/development data.
// In production, each shop should have its own unique and correct Google Place ID.
const DEFAULT_PLACE_ID = 'ChIJRUjlH92OAGAR6otTD3tUcrg';

const shiftDate = (isoDate: string, offsetDays: number) => {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
};

const clampRating = (rating: number) => Number(Math.min(5, Math.max(3.5, rating)).toFixed(1));

const adjustDistance = (distance: number, delta: number) => Math.max(1, distance + delta);

const createVariantShop = (shop: Shop, variant: ShopVariant, offset: number): Shop => {
  const imageUrls = shop.imageUrls?.map((url, index) => `${url}&sig=${variant.key}-${index}`) ?? [
    shop.imageUrl,
  ];

  return {
    ...shop,
    id: `${shop.id}-${variant.key}`,
    name: `${shop.name} ${variant.label}`,
    distanceMinutes: adjustDistance(
      shop.distanceMinutes,
      variant.distanceDelta + (offset % 2 === 0 ? 0 : 1)
    ),
    rating: clampRating(shop.rating + variant.ratingDelta),
    createdAt: shiftDate(shop.createdAt, variant.createdOffsetDays + offset),
    imageUrl: imageUrls[0] ?? shop.imageUrl,
    imageUrls,
    menu: shop.menu?.map(menu => ({ ...menu, id: `${menu.id}-${variant.key}` })),
  };
};

const BASE_SHOPS: Shop[] = [
  {
    id: 'shop-1',
    name: 'モーニング ブリュー カフェ',
    category: 'カフェ・喫茶',
    distanceMinutes: 5,
    rating: 4.6,
    budget: '$',
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2024-10-12T00:00:00.000Z',
    description: '一杯ずつハンドドリップで淹れるコーヒーと、静かな時間を楽しめる朝カフェ。',
    imageUrl:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['コーヒー', '静かな空間', 'Wi-Fi'],
    menu: [
      { id: 'm-1-1', name: 'ハンドドリップ コーヒー' },
      { id: 'm-1-2', name: 'カフェラテ' },
      { id: 'm-1-3', name: 'シナモンロール' },
    ],
  },
  {
    id: 'shop-2',
    name: '夕焼け寿司割烹',
    category: 'レストラン',
    distanceMinutes: 11,
    rating: 4.8,
    budget: '$$$',
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2020-08-14T00:00:00.000Z',
    description: '旬の魚を使ったおまかせコースが人気のカウンター寿司。',
    imageUrl:
      'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['寿司', 'カウンター', '記念日'],
    menu: [
      { id: 'm-2-1', name: 'おまかせコース' },
      { id: 'm-2-2', name: '白身三昧' },
      { id: 'm-2-3', name: '穴子一本握り' },
    ],
  },
  {
    id: 'shop-3',
    name: 'グロウ ジェラート ラボ',
    category: 'スイーツ・デザート専門',
    distanceMinutes: 7,
    rating: 4.7,
    budget: '$$',
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2023-09-05T00:00:00.000Z',
    description: '旬のフルーツを使ったジェラートと焼き菓子の専門店。',
    imageUrl:
      'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['ジェラート', '季節限定', 'イートイン'],
    menu: [
      { id: 'm-3-1', name: 'ピスタチオ ジェラート' },
      { id: 'm-3-2', name: '塩キャラメル クッキーサンド' },
      { id: 'm-3-3', name: '季節のフルーツパフェ' },
    ],
  },
  {
    id: 'shop-4',
    name: 'ルーメン ワインバー',
    category: 'バー・居酒屋',
    distanceMinutes: 9,
    rating: 4.7,
    budget: '$$',
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2019-11-30T00:00:00.000Z',
    description: '自然派ワインと季節の小皿料理、レコードの音色が心地よい隠れ家バー。',
    imageUrl:
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['ワイン', '大人の雰囲気', '音楽'],
  },
  {
    id: 'shop-5',
    name: 'アーバングリーンズ キッチン',
    category: 'レストラン',
    distanceMinutes: 6,
    rating: 4.4,
    budget: '$$',
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2024-02-18T00:00:00.000Z',
    description: '旬の野菜を使ったボウルとスープが揃うヘルシーランチスポット。',
    imageUrl:
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['ヘルシー', 'テイクアウト', 'ランチ'],
  },
  {
    id: 'shop-6',
    name: 'ベイカーズ レーン',
    category: 'ベーカリー・パン',
    distanceMinutes: 4,
    rating: 4.6,
    budget: '$',
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2025-01-22T00:00:00.000Z',
    description: '焼きたてのクロワッサンとサワードウが並ぶ人気ベーカリー。',
    imageUrl:
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['パン', 'モーニング', 'テラス席'],
    menu: [
      { id: 'm-6-1', name: 'クロワッサン' },
      { id: 'm-6-2', name: 'サワードウ' },
      { id: 'm-6-3', name: 'チョコレートブレッド' },
    ],
  },
  {
    id: 'shop-8',
    name: 'ロータス ベジビュッフェ',
    category: 'ビュッフェ・食べ放題',
    distanceMinutes: 12,
    rating: 4.6,
    budget: '$$',
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2023-12-01T00:00:00.000Z',
    description: '旬野菜とスパイス料理をビュッフェ形式で楽しめるヘルシーダイニング。',
    imageUrl:
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['ビュッフェ', '野菜たっぷり', 'スパイス'],
  },
  {
    id: 'shop-10',
    name: 'レトロ アーケード ロフト',
    category: 'バー・居酒屋',
    distanceMinutes: 13,
    rating: 4.4,
    budget: '$$',
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2021-07-14T00:00:00.000Z',
    description: '懐かしのゲーム機とクラフトドリンクを気軽にできるナイトスポット。',
    imageUrl:
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['ゲーム', 'グループ', '夜遊び'],
  },
  {
    id: 'shop-11',
    name: 'ハーバー シーフード グリル',
    category: 'レストラン',
    distanceMinutes: 14,
    rating: 4.7,
    budget: '$$$',
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2021-12-06T00:00:00.000Z',
    description: '海の幸をつかったグリル料理と景色が素晴らしいダイニング。',
    imageUrl:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['シーフード', 'ディナー', '予約制'],
  },
  {
    id: 'shop-12',
    name: 'リバーサイド ジャズクラブ',
    category: 'バー・居酒屋',
    distanceMinutes: 13,
    rating: 4.7,
    budget: '$$',
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2024-07-30T00:00:00.000Z',
    description: '生演奏のジャズと季節のカクテルを楽しめる大人の社交場。',
    imageUrl:
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['ジャズ', 'ライブ', '夜景'],
  },
  {
    id: 'shop-14',
    name: 'フレッシュ ボウル マーケット',
    category: 'ファストフード・テイクアウト',
    distanceMinutes: 6,
    rating: 4.3,
    budget: '$$',
    createdAt: '2025-02-01T00:00:00.000Z',
    openedAt: '2023-02-14T00:00:00.000Z',
    description: 'サラダボウルとコールドプレスジュースが並ぶデリスタンド。',
    imageUrl:
      'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=600&q=80',
    placeId: DEFAULT_PLACE_ID,
    imageUrls: [
      'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    ],
    tags: ['デリ', 'テイクアウト', 'ヘルシー'],
  },
];

const VARIANTS: ShopVariant[] = [
  { key: 'east', label: '東口店', distanceDelta: 1, ratingDelta: -0.1, createdOffsetDays: 5 },
  { key: 'west', label: '西通り店', distanceDelta: 2, ratingDelta: 0.05, createdOffsetDays: 10 },
  { key: 'north', label: '北側店', distanceDelta: 3, ratingDelta: 0, createdOffsetDays: 15 },
  { key: 'south', label: '南広場店', distanceDelta: -1, ratingDelta: -0.05, createdOffsetDays: 20 },
];

const VARIANT_SHOPS = VARIANTS.flatMap((variant, variantIndex) =>
  BASE_SHOPS.map((shop, baseIndex) => createVariantShop(shop, variant, variantIndex + baseIndex))
);

export const SHOPS: Shop[] = [...BASE_SHOPS, ...VARIANT_SHOPS];

export const CATEGORIES: ShopCategory[] = Array.from(new Set(SHOPS.map(shop => shop.category)));
